// deno-lint-ignore-file no-explicit-any

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
import { default as esbuild } from "../imports/esbuild.ts";
import { DenoFileSystem } from "./utils.ts";
import type { DevServerEvents, Disposable } from "./types.ts";
import type { EsbuildInstance } from "../imports/esbuild.ts";

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
}

function initServer(addr: string | HTTPOptions): Disposable<Server> {
  const options = typeof addr === "string"
    ? addr
    : { port: addr.port, hostname: addr.hostname };
  const server = serve(options);
  return [server, () => server.close()];
}

function initESBuild(
  eventSource?: EventEmitter<DevServerEvents>,
): Disposable<EsbuildInstance> {
  const instance = esbuild;
  (async () =>
    await esbuild.initialize({}).then(() => {
      if (eventSource) {
        eventSource.emit("debug", "ESBuild service is now running");
      }
    }))();
  return [instance, () => instance.stop()];
}

function initCompiler(
  mounts: string[],
  eventSource?: EventEmitter<DevServerEvents>,
  onError?: (err: Error) => void,
): Disposable<Compiler> {
  let watchers: FileWatcher[] = [];
  try {
    watchers = mounts.map((mount) => {
      return watchFs({ source: mount, fs: DenoFileSystem });
    });
    const compiler = setupCompiler({ watchers, onError });
    return [compiler, () => compiler.return()];
  } catch (e) {
    if (eventSource) eventSource.emit("error", `${e.name}: ${e.message}`);
    if (eventSource) eventSource.emit("terminate");
    Deno.exit(1);
  }
}

export function runDevServer(options: DevServerOptions = {
  port: 8000,
  mounts: [Deno.cwd()],
}) {
  try {
    const eventSource = options.eventSource;

    const [compiler, disposeCompiler] = initCompiler(
      options.mounts,
      eventSource,
      (e: Error) => terminate(e),
    );
    const [server, disposeServer] = initServer({ port: options.port });
    const [_esbuildInstance, disposeEsbuild] = initESBuild(eventSource);

    const terminate = (err?: Error) => {
      if (err && eventSource) {
        eventSource.emit("error", `${err.name}: ${err.message}`);
      }
      disposeEsbuild();
      if (eventSource) {
        eventSource.emit("debug", "Gracefully stopped the ESBuild service");
      }
      disposeCompiler();
      disposeServer();
      if (eventSource) eventSource.emit("terminate");
      Deno.exit(1);
    };

    const gracefulExit = async () => {
      // Deno.signal is not yet implemented on Windows.
      // https://github.com/denoland/deno/issues/9995
      if (Deno.build.os === "windows") {
        const { setHandler } = await import("../imports/ctrlc.ts");
        setHandler(() => {
          if (eventSource) {
            eventSource.emit("debug", "Intercepted SIGINT signal");
          }
          terminate();
        });
      } else {
        // Otherwise, if using UNIX, listen to Deno.signal
        for await (const _ of Deno.signal(Deno.Signal.SIGINT)) {
          if (eventSource) {
            eventSource.emit("debug", "Intercepted SIGINT signal");
          }
          terminate();
        }
      }
    };

    return new DevServer<CompilerEvent | { kind: string; details: any }>(
      (iterator) => {
        try {
          if (eventSource) {
            eventSource.emit("listen", {
              hostname: "localhost",
              port: options.port,
              secure: false,
            });
          }

          setTimeout(async () => {
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
              terminate(e);
            }
          });

          setTimeout(async () => {
            for await (const request of server) {
              iterator.push({ kind: "request", details: request });
              request.respond({ status: 200, body: "hello world" });
            }
          });

          (async function () {
            await gracefulExit();
          })();
        } catch (e) {
          terminate(e);
        }
        return () => iterator.compiler.return();
      },
      compiler,
    );
  } catch (e) {
    esbuild.stop();
    if (options.eventSource) {
      options.eventSource.emit("fatal", `${e.name}: ${e.message}`);
    }
    console.error(e);
    Deno.exit(1);
  }
}
