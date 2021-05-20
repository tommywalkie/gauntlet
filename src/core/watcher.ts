import {
  AsyncPushIterator,
  AsyncPushIteratorSetup,
} from "../../imports/graphqlade.ts";
import { isAbsolute, join, normalize } from "../../imports/path.ts";
import { randomId, toArraySync } from "./utils.ts";
import type { FileSystemLike, FsEvent, WalkEntry } from "./fs.ts";
import type { WatcherOptions, WatchEvent } from "./types.ts";

/**
 * Based on an `AsyncIterator` superset originally designed
 * for [`graphqlade`](https://github.com/morris/graphqlade), the file watcher is intended
 * to wrap asynchronously pushed events by the provided filesystem `<FileSystemLike>.watch`
 * while .
 */
export class FileWatcher<T> extends AsyncPushIterator<T> {
  fs: FileSystemLike;
  contents: WalkEntry[] = [];
  mount: string;

  constructor(
    setup: (iterator: FileWatcher<T>) => void,
    fs: FileSystemLike,
    mount: string,
  ) {
    super(setup as AsyncPushIteratorSetup<T>);
    this.fs = fs;
    this.mount = normalize(mount);
  }
}

function diff(a: WalkEntry[], b: WalkEntry[]) {
  return a.filter((item1) => !b.some((item2) => (item2.path === item1.path)));
}

function processNotFoundMountErrorArgs(
  literralEntry: string,
  mount: string,
  cwd: string,
) {
  const explanation = isAbsolute(literralEntry)
    ? `"${literralEntry}" is an absolute path, check your filesystem or consider using ".${literralEntry}" instead.`
    : `"${literralEntry}" doesn't exist in current working directory "${cwd}".`;
  return `Cannot init file watcher. Mount directory not found.
  ${explanation}`;
}

export class NotFoundMountError extends Error {
  name = "NotFoundMountError";
  constructor(literralEntry: string, mount: string, cwd: string) {
    super(processNotFoundMountErrorArgs(literralEntry, mount, cwd));
    Object.setPrototypeOf(this, NotFoundMountError.prototype);
  }
}

export function watchFs(options: WatcherOptions): FileWatcher<WatchEvent> {
  const sourcePath = isAbsolute(options.source)
    ? options.source
    : join(options.fs.cwd(), options.source);
  if (!options.fs.existsSync(sourcePath)) {
    throw new NotFoundMountError(options.source, sourcePath, options.fs.cwd());
  }
  return new FileWatcher<WatchEvent>(
    (iterator: FileWatcher<WatchEvent>) => {
      let events: Array<WatchEvent & { _id: string }> = [];
      const watcher = iterator.fs.watch(sourcePath);
      const srcIterator: IterableIterator<WalkEntry> = iterator.fs.walkSync(
        normalize(sourcePath),
      );

      function format(str: string) {
        return normalize(str).substring(sourcePath.length + 1);
      }

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

      function handleEvent(event: FsEvent) {
        // We could listen to inotify events including two paths,
        // but due to the fact they happen after many related modify events,
        // they become noise.
        if (event.paths.length === 1) {
          const path = event.paths[0];
          const entry = iterator.contents.find(
            (content: WalkEntry) =>
              content.path === join(sourcePath, format(path)),
          );

          if (event.kind === "create") {
            try {
              const { isFile, isDirectory, isSymlink } = iterator.fs.lstatSync(
                path,
              );
              const new_entry = {
                path: join(sourcePath, format(path)),
                name: normalize(path).replace(/^.*[\\\/]/, ""),
                isFile,
                isDirectory,
                isSymlink,
              };
              if (isFile) {
                iterator.contents.push(new_entry);
                events.push({
                  _id: randomId(),
                  kind: event.kind as any,
                  entry: new_entry,
                });
              } else if (isDirectory) refreshSource();
            } catch (e) {}
          }
          if (event.kind === "modify") {
            if (entry?.isFile) {
              if (iterator.fs.existsSync(normalize(entry.path))) {
                events.push({ _id: randomId(), kind: event.kind, entry });
              } else refreshSource();
            }
            if (entry?.isDirectory) refreshSource();
          }
          if (event.kind === "remove") {
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
      }, 100);

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
        clearInterval(pollEvents);
        // Both the hereby watcher and the wrapped file watcher (iterator.fs.watch)
        // shall be terminated. Otherwise, async ops may leak and Deno test will fail.
        (watcher as any).return();
      };
    },
    options.fs,
    options.source,
  );
}
