import { EventEmitter } from "../../imports/pietile-eventemitter.ts";
import { isAbsolute, join } from "../../imports/path.ts";
import {
  AsyncPushIterator,
  AsyncPushIteratorSetup,
} from "../../imports/graphqlade.ts";
import { FileWatcher } from "../watcher/mod.ts";
import { VirtualFileSystem } from "../fs/mod.ts";
import type {
  Entry,
  FileExtensionInfo,
  LogEvents,
  Plugin,
  WalkEntry,
  WatchEvents,
} from "../types.ts";

export interface CompilerEvent {
  kind: string;
  // deno-lint-ignore no-explicit-any
  details: any;
}

export interface CompilerOptions {
  watchers: FileWatcher[];
  plugins?: Plugin[];
  eventSource?: EventEmitter<WatchEvents & LogEvents>;
  onError?: (err: Error) => void;
}

export class Compiler extends AsyncPushIterator<CompilerEvent> {
  entries: Map<string, Entry> = new Map();
  fs: VirtualFileSystem = new VirtualFileSystem();
  plugins: Plugin[] = [];
  watchers: FileWatcher[] = [];

  constructor(setup: (iterator: Compiler) => void) {
    super(setup as AsyncPushIteratorSetup<CompilerEvent>);
  }
}

function formatPathConflictErrorMessage(
  existingEntry: string,
  incomingEntry: string,
  filename: string,
) {
  const aLen = existingEntry.length;
  const bLen = incomingEntry.length;
  const maxLen = Math.max(aLen, bLen) + 1;
  return `Entries from different mounts point to the same path.
  ${incomingEntry} ${new Array(maxLen - bLen).join("─")}──x───> ${filename}
  ${existingEntry} ${new Array(maxLen - aLen).join("─")}──┘`;
}

export class PathConflictError extends Error {
  name = "PathConflictError";
  constructor(existingEntry: string, incomingEntry: string, filename: string) {
    super(
      formatPathConflictErrorMessage(existingEntry, incomingEntry, filename),
    );
    Object.setPrototypeOf(this, PathConflictError.prototype);
  }
}

export function getFileExtension(entry: WalkEntry): FileExtensionInfo {
  if (entry.isDirectory) {
    return {
      extension: "",
      fullExtension: "",
    };
  }
  const parts = entry.name.split(".");
  if (parts.length === 1) {
    return {
      extension: ".bin",
      fullExtension: ".bin",
    };
  }
  if (parts.length > 2) {
    return {
      extension: "." + parts[parts.length - 1],
      fullExtension: "." + parts.splice(1, parts.length - 1).join("."),
    };
  }
  return {
    extension: "." + parts[parts.length - 1],
    fullExtension: "." + parts[parts.length - 1],
  };
}

export async function setupCompiler(options: CompilerOptions) {
  // Initial build attempt
  const initialMap: Map<string, Entry> = new Map();
  const plugins: Plugin[] = [];

  if (!options.plugins) options.plugins = [];

  for (const watcher of options.watchers) {
    const sourcePath = isAbsolute(watcher.mount)
      ? watcher.mount
      : join(watcher.fs.cwd(), watcher.mount);
    for (const content of watcher.fs.walkSync(sourcePath)) {
      const key = content.path.substr(sourcePath.length + 1);
      const existingEntry = initialMap.get(key);
      if (content.isFile) {
        if (existingEntry) {
          throw new PathConflictError(
            join(watcher.mount, key),
            join(existingEntry.mount, key),
            key,
          );
        }
      }
      initialMap.set(key, {
        mount: watcher.mount,
        relativePath: key,
        ...getFileExtension(content),
        ...content,
      });
    }
  }

  for (let index = 0; index < options.plugins.length; index++) {
    const plugin = options.plugins[index];
    plugins.push(plugin);
    if (plugin.onMount) {
      if (options.eventSource) {
        options.eventSource.emit(
          "debug",
          `Mounting "${plugin.name}" plugin`,
        );
      }
      await plugin.onMount();
    }
  }

  function terminate(err: Error) {
    if (options.onError) options.onError(err);
    throw err;
  }

  const threads: number[] = [];

  // The actual compiler event iterator
  return new Compiler((iterator: Compiler) => {
    iterator.entries = initialMap;
    for (let index = 0; index < options.watchers.length; index++) {
      const watcher = options.watchers[index];
      const sourcePath = isAbsolute(watcher.mount)
        ? watcher.mount
        : join(watcher.fs.cwd(), watcher.mount);

      threads.push(setTimeout(async () => {
        try {
          for await (const event of watcher) {
            if (event.kind === "modify") {
              const key = event.entry.path.substr(sourcePath.length + 1);
              iterator.entries.set(key, {
                mount: watcher.mount,
                relativePath: key,
                ...getFileExtension(event.entry),
                ...event.entry,
              });
            }
            if (event.kind === "create") {
              const key = event.entry.path.substr(sourcePath.length + 1);
              const existingEntry = iterator.entries.get(key);
              if (existingEntry) {
                terminate(
                  new PathConflictError(
                    join(watcher.mount, key),
                    join(existingEntry.mount, key),
                    key,
                  ),
                );
              } else {
                iterator.entries.set(key, {
                  mount: watcher.mount,
                  relativePath: key,
                  ...getFileExtension(event.entry),
                  ...event.entry,
                });
              }
            }
            if (event.kind === "remove") {
              const key = event.entry.path.substr(sourcePath.length + 1);
              iterator.entries.delete(key);
            }
            iterator.push({ kind: event.kind, details: event.entry });
          }
        } catch (e) {
          terminate(e);
        }
      }));
    }
    return () => {
      for (let index = 0; index < options.watchers.length; index++) {
        const watcher = options.watchers[index];
        watcher.return();
        clearTimeout(threads[index]);
        if (options.eventSource) {
          options.eventSource.emit(
            "debug",
            `Stopped watching "${watcher.mount}" path`,
          );
        }
      }
      for (const plugin of plugins) {
        (async () => {
          if (plugin.onDestroy) {
            await plugin.onDestroy();
            if (options.eventSource) {
              options.eventSource.emit(
                "debug",
                `Unmounted "${plugin.name}" plugin`,
              );
            }
          }
        })();
      }
    };
  });
}
