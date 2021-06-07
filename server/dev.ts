import {
  AsyncPushIterator,
  AsyncPushIteratorSetup,
} from "../imports/graphqlade.ts";
import {
  Compiler,
  CompilerEvent,
  FileWatcher,
  setupCompiler,
  watchFs,
} from "../core/mod.ts";
import { EventEmitter } from "../imports/pietile-eventemitter.ts";
import { HTTPOptions, serve, Server } from "../imports/std.ts";
import esbuildPlugin from "../plugins/esbuild.ts";
import esbuildWasmPlugin from "../plugins/esbuild-wasm.ts";
import { DenoFileSystem } from "./utils.ts";
import type { AsyncDisposable, DevServerEvents, Disposable } from "./types.ts";
import type { Plugin } from "../core/types.ts";

type DevServerSetup<T> = (
  iterator: DevServer<T>,
) => Promise<(() => unknown) | undefined> | (() => unknown) | undefined;

export class DevServer<T> extends AsyncPushIterator<T> {
  compiler: Compiler;

  constructor(setup: DevServerSetup<T>, compiler: Compiler) {
    super(setup as AsyncPushIteratorSetup<T>);
    this.compiler = compiler;
  }
}

export interface DevServerOptions {
  port: number;
  mounts: string[];
  eventSource?: EventEmitter<DevServerEvents>;
  plugins?: Plugin[];
}

function initServer(addr: string | HTTPOptions): Disposable<Server> {
  const options = typeof addr === "string"
    ? addr
    : { port: addr.port, hostname: addr.hostname };
  const server = serve(options);
  return [server, () => server.close()];
}

async function initCompiler(
  mounts: string[],
  plugins: Plugin[],
  eventSource?: EventEmitter<DevServerEvents>,
  onError?: (err: Error) => void,
): Promise<AsyncDisposable<Compiler>> {
  let watchers: FileWatcher[] = [];
  try {
    watchers = mounts.map((mount) => {
      return watchFs({ source: mount, fs: DenoFileSystem });
    });
    const compiler = await setupCompiler({
      watchers,
      onError,
      eventSource,
      plugins,
    });
    return [compiler, async () => {
      await compiler.return();
    }];
  } catch (e) {
    if (eventSource) eventSource.emit("error", `${e.name}: ${e.message}`);
    if (eventSource) eventSource.emit("terminate");
    Deno.exit(1);
  }
}

export async function runServer(options: DevServerOptions = {
  port: 8000,
  mounts: [Deno.cwd()],
  plugins: [esbuildPlugin],
}) {
  const threads: number[] = [];
  if (!options.plugins) {
    options.plugins = [
      esbuildWasmPlugin,
      esbuildWasmPlugin,
      esbuildPlugin,
      esbuildWasmPlugin,
    ];
  }
  try {
    const eventSource = options.eventSource;
    const [compiler, disposeCompiler] = await initCompiler(
      options.mounts,
      options.plugins,
      eventSource,
      async (e: Error) => await terminate(e),
    );
    const [server, disposeServer] = initServer({ port: options.port });

    const terminate = async (err?: Error) => {
      if (err && eventSource) {
        eventSource.emit("error", `${err.name}: ${err.message}`);
      }
      await disposeCompiler();
      for (let index = 0; index < threads.length; index++) {
        const element = threads[index];
        clearTimeout(element);
      }
      disposeServer();
      if (eventSource) eventSource.emit("terminate");
      Deno.exit(1);
    };

    const gracefulExit = async () => {
      // Deno.signal is not yet implemented on Windows.
      // https://github.com/denoland/deno/issues/9995
      if (Deno.build.os === "windows") {
        const { setHandler } = await import("../imports/ctrlc.ts");
        setHandler(async () => {
          if (eventSource) {
            eventSource.emit("debug", "Intercepted SIGINT signal");
          }
          await terminate();
        });
      } else {
        // Otherwise, if using UNIX, listen to Deno.signal
        for await (const _ of Deno.signal(Deno.Signal.SIGINT)) {
          if (eventSource) {
            eventSource.emit("debug", "Intercepted SIGINT signal");
          }
          await terminate();
        }
      }
    };

    // deno-lint-ignore no-explicit-any
    return new DevServer<CompilerEvent | { kind: string; details: any }>(
      async (iterator) => {
        try {
          if (eventSource) {
            eventSource.emit("listen", {
              hostname: "localhost",
              port: options.port,
              secure: false,
            });
          }

          threads.push(setTimeout(async () => {
            try {
              for await (const event of iterator.compiler) {
                if (eventSource) {
                  eventSource.emit(
                    event.kind as keyof DevServerEvents,
                    event.details,
                  );
                }
                iterator.push(event);
              }
            } catch (e) {
              await terminate(e);
            }
          }));

          threads.push(setTimeout(async () => {
            for await (const request of server) {
              iterator.push({ kind: "request", details: request });
              request.respond({ status: 200, body: "hello world" });
            }
          }));

          await gracefulExit();
        } catch (e) {
          await terminate(e);
        }
        return async () => {
          for (let index = 0; index < threads.length; index++) {
            const element = threads[index];
            clearTimeout(element);
          }
          await iterator.compiler.return();
        };
      },
      compiler,
    );
  } catch (e) {
    if (options.eventSource) {
      options.eventSource.emit(
        "fatal",
        "The following error occured at the development server root.\n" +
          "Consider raising an issue on https://github.com/tommywalkie/gauntlet/issues.",
      );
    }
    console.error(e);
    Deno.exit(1);
  }
}
