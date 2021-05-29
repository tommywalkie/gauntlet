import { isAbsolute, join, normalize } from "../../imports/path.ts";
import { randomId, toArraySync } from "../utils.ts";
import {
  AsyncPushIterator,
  AsyncPushIteratorSetup,
} from "../../imports/graphqlade.ts";
import type {
  FileSystemLike,
  FsEvent,
  WalkEntry,
  WatcherOptions,
  WatchEvent,
} from "../types.ts";

/**
 * Based on an `AsyncIterator` superset originally designed
 * for [`graphqlade`](https://github.com/morris/graphqlade), the file watcher is intended
 * to wrap asynchronously pushed events by the provided filesystem `<FileSystemLike>.watch`
 * while .
 */
export class FileWatcher extends AsyncPushIterator<WatchEvent> {
  fs: FileSystemLike;
  /**
   * @todo Refactor into a `Map` or something more efficient
   */
  contents: WalkEntry[] = [];
  mount: string;

  constructor(
    setup: (iterator: FileWatcher) => void,
    fs: FileSystemLike,
    mount: string,
  ) {
    super(setup as AsyncPushIteratorSetup<WatchEvent>);
    this.fs = fs;
    this.mount = normalize(mount);
  }
}

function diff(a: WalkEntry[], b: WalkEntry[]) {
  return a.filter((item1) => !b.some((item2) => (item2.path === item1.path)));
}

function processNotFoundMountErrorArgs(
  literralEntry: string,
  cwd: string,
) {
  const explanation = isAbsolute(literralEntry)
    ? `"${literralEntry}" looks like an absolute path, check your filesystem or consider using ".${literralEntry}" instead.`
    : `"${literralEntry}" doesn't exist in current working directory "${cwd}".`;
  return `Cannot init file watcher. Mount directory not found.
  ${explanation}`;
}

export class NotFoundMountError extends Error {
  name = "NotFoundMountError";
  constructor(literralEntry: string, cwd: string) {
    super(processNotFoundMountErrorArgs(literralEntry, cwd));
    Object.setPrototypeOf(this, NotFoundMountError.prototype);
  }
}

export function watchFs(options: WatcherOptions): FileWatcher {
  const sourcePath = isAbsolute(options.source)
    ? options.source
    : join(options.fs.cwd(), options.source);
  if (!options.fs.existsSync(sourcePath)) {
    throw new NotFoundMountError(options.source, options.fs.cwd());
  }
  return new FileWatcher(
    (iterator: FileWatcher) => {
      let events: Array<WatchEvent & { _id: string }> = [];
      const watcher = iterator.fs.watch(sourcePath);
      const srcIterator: IterableIterator<WalkEntry> = iterator.fs.walkSync(
        normalize(sourcePath),
      );

      function format(str: string) {
        return normalize(str).substring(sourcePath.length + 1);
      }

      /**
       * Performs a full walk of the source directory
       * and update registered contents, and emit events
       * for entries who got removed or registered.
       *
       * This **resource consuming** method shall be used as little as possible,
       * only for unobvious `FsEvent` events, like the ones for directories.
       *
       * @todo Consider removing possibly unnecessary spreads
       */
      function refreshSource() {
        const snapshot = [...new Set([...iterator.contents])];
        const srcIterator = iterator.fs.walkSync(normalize(sourcePath));
        const entries = toArraySync<WalkEntry>(srcIterator);
        iterator.contents = [...new Set([...entries])];
        const addedEntries = diff(entries, snapshot);
        const removedEntries = diff(snapshot, entries);
        for (let index = 0; index < removedEntries.length; index++) {
          if (removedEntries[index].isFile) {
            events.push({
              _id: randomId(),
              kind: "remove",
              entry: removedEntries[index],
            });
          }
        }
        for (let index = 0; index < addedEntries.length; index++) {
          if (addedEntries[index].isFile) {
            events.push({
              _id: randomId(),
              kind: "create",
              entry: addedEntries[index],
            });
          }
        }
      }

      /**
       * Process and filter `FsEvent` events,
       * by performing checks and
       *
       * @todo Consider optimizing folder deletion event handling.
       * In theory, folder deletion events happen after folder item deletion
       * events, AT LEAST when using Deno.watchFs.
       * We can play safe and check if folder items really got deleted,
       * though using refreshSource may be overkill.
       */
      function handleEvent(event: FsEvent) {
        // We could listen to inotify events including two paths,
        // but due to the fact they happen after many related modify events,
        // they become noise.
        if (event.paths.length === 1) {
          const path = event.paths[0];

          const getRegisteredEntry = (path: string) => {
            return iterator.contents.find(
              (content: WalkEntry) =>
                content.path === join(sourcePath, format(path)),
            );
          };

          /**
           * Try registering a new entry from given path,
           * first by performing a stats check, which can throw
           * if the file got immediatly removed just after being newly added.
           */
          const tryRegister = (path: string) => {
            try {
              const { isFile, isDirectory, isSymlink } = iterator.fs.lstatSync(
                path,
              );
              const newEntry = {
                path: join(sourcePath, format(path)),
                name: normalize(path).replace(/^.*[\\\/]/, ""),
                isFile,
                isDirectory,
                isSymlink,
              };
              if (isFile) {
                iterator.contents.push(newEntry);
                events.push({
                  _id: randomId(),
                  kind: "create",
                  entry: newEntry,
                });
              } else if (isDirectory) refreshSource();
            } catch (_e) {
              // Do nothing here, most of the time, it will throw when
              // looking at a removed/renamed file.
            }
          };

          if (event.kind === "create") {
            tryRegister(path);
          }
          if (event.kind === "modify") {
            const entry = getRegisteredEntry(path);
            if (!entry) {
              // Most likely a newly renamed file
              tryRegister(path);
            } else {
              if (entry?.isFile) {
                if (iterator.fs.existsSync(normalize(entry.path))) {
                  // These file/metadata change events may happen in groups,
                  // especially when using GUIs, thus require being de-duplicated.
                  events.push({ _id: randomId(), kind: event.kind, entry });
                } else {
                  // Most likely a file being renamed
                  events.push({ _id: randomId(), kind: "remove", entry });
                }
              }
              // Most likely a folder being moved or renamed
              if (entry?.isDirectory) refreshSource();
            }
          }
          if (event.kind === "remove") {
            const entry = getRegisteredEntry(path);
            if (entry?.isFile) {
              iterator.contents = iterator.contents.filter(
                (item: WalkEntry) =>
                  item.path !== join(sourcePath, format(path)),
              );
              events.push({ _id: randomId(), kind: event.kind, entry });
            }
            if (entry?.isDirectory) refreshSource();
          }
        }
      }

      const handledIds: string[] = [];
      const pollEvents = setInterval(() => {
        if (events.length > 0) {
          const snapshot = [...events];
          events = events.filter((el) =>
            !snapshot.map((el) => el._id).includes(el._id)
          );
          const set = snapshot.filter(
            (e: WatchEvent, i) =>
              snapshot.findIndex(
                (a: WatchEvent) =>
                  a.kind === e.kind && a.entry.path === e.entry.path,
              ) === i,
          );
          for (let index = 0; index < set.length; index++) {
            const event = set[index];
            if (!handledIds.includes(event._id)) {
              handledIds.push(event._id) && iterator.push(event);
            }
          }
        } else {
          handledIds.splice(0, handledIds.length);
        }
      }, 200);

      function notifyStart() {
        const { isFile, isDirectory, isSymlink } = iterator.fs.lstatSync(
          normalize(sourcePath),
        );
        iterator.push({
          kind: "watch",
          entry: {
            path: normalize(sourcePath),
            name: normalize(sourcePath).replace(/^.*[\\\/]/, ""),
            isFile,
            isDirectory,
            isSymlink,
          },
        });
      }

      (async () => {
        iterator.contents = toArraySync<WalkEntry>(srcIterator);
        notifyStart();
        for await (const event of watcher) {
          handleEvent(event);
        }
      })();

      return () => {
        // Clear the event poller
        clearInterval(pollEvents);
        // Terminate the wrapped filesystem watcher
        if (watcher.return) watcher.return();
      };
    },
    options.fs,
    options.source,
  );
}
