// deno-lint-ignore-file no-explicit-any
import { AsyncPushIterator } from "../../imports/graphqlade.ts";
import { isAbsolute, join, normalize } from "../../imports/path.ts";
import { EventEmitter } from "../../imports/pietile-eventemitter.ts";
import { randomId, toTypedArray } from "./utils.ts";
import type {
  FileSystemLike,
  FsEvent,
  FsEventKind,
  WalkEntry,
  WatchEvents,
} from "./types.ts";

/**
 * Virtual filesystem inspired from
 * [`simple-virtual-fs`](https://github.com/deebloo/virtual-fs),
 * using type-safe `EventEmitter` implementation from `pietile-eventemitter`
 */
export class VirtualFileSystem<T = any> extends EventEmitter<WatchEvents> {
  private contents = new Map<string, T>();
  private CWD = "/";

  get size(): number {
    return this.contents.size;
  }

  cwd(): string {
    return this.CWD;
  }

  setCwd(path: string): void {
    path = this.parsePath(path);
    this.CWD = path;
  }

  private getEntryFrom(path: string) {
    const stats = this.lstatSync(path);
    return {
      name: path.replace(/^.*[\\\/]/, ""),
      path: path,
      ...stats,
    };
  }

  private parsePath(path: string | URL) {
    const res = path instanceof URL
      ? normalize(path.toString())
      : normalize(path);
    return isAbsolute(res) ? res : join(this.CWD, res);
  }

  private tryReadFile(path: string | URL) {
    path = this.parsePath(path);
    if (this.getChildPaths(path).length > 0) {
      throw new Error(`Cannot read directory "${path}" as a file.`);
    }
    const res = this.contents.get(path);
    if (res) return res;
    throw new Error(`File "${path}" not found.`);
  }

  add(path: string, value?: T): VirtualFileSystem<T> {
    let walkEntry, _exists = false;
    const nPath = normalize(path);
    if (this.existsSync(nPath)) {
      _exists = true;
      walkEntry = this.getEntryFrom(nPath);
    } else {
      walkEntry = {
        name: nPath.replace(/^.*[\\\/]/, ""),
        path: nPath,
        isFile: value ? true : false,
        isDirectory: value ? false : true,
        isSymlink: false,
      };
    }
    this.contents.set(nPath, value as T);
    if (_exists) {
      this.emit("modify", walkEntry);
    } else {
      this.emit("create", walkEntry);
    }
    return this;
  }

  remove(path: string): Promise<VirtualFileSystem<T>> {
    path = this.parsePath(path);
    return Promise.resolve(this.removeSync(path));
  }

  removeSync(path: string): VirtualFileSystem<T> {
    path = this.parsePath(path);
    this.getPaths().forEach((p) => {
      if (p.startsWith(normalize(path))) {
        const walkEntry = this.getEntryFrom(normalize(p));
        this.contents.delete(p);
        this.emit("remove", walkEntry);
      }
    });
    return this;
  }

  move(path: string, moveTo: string): VirtualFileSystem<T> {
    path = this.parsePath(path);
    const children = this.getChildPaths(path);

    if (this.contents.has(path)) {
      const walkEntry = this.getEntryFrom(path);
      this.contents.set(moveTo, this.read(path) as T);
      this.contents.delete(path);
      this.emit("remove", walkEntry);
    }

    for (let index = 0; index < children.length; index++) {
      const child = children[index];
      const parsed = child.split(path);
      const walkEntry = this.getEntryFrom(path);
      const newPath = moveTo + parsed[parsed.length - 1];
      const stats = this.lstatSync(path);
      const newWalkEntry = {
        name: parsed[parsed.length - 1],
        path: newPath,
        ...stats,
      };
      this.contents.set(newPath, this.read(child) as T);
      this.contents.delete(child);
      this.emit("remove", walkEntry);
      this.emit("create", newWalkEntry);
    }

    return this;
  }

  clear(): VirtualFileSystem<T> {
    this.contents.clear();
    return this;
  }

  read(path: string | URL) {
    path = this.parsePath(path);
    return this.contents.get(path);
  }

  write(path: string | URL, value?: T) {
    path = this.parsePath(path);
    this.add(path, value);
    return Promise.resolve();
  }

  writeSync(path: string | URL, value?: T) {
    path = this.parsePath(path);
    this.add(path, value);
  }

  mkdir(path: string | URL) {
    path = this.parsePath(path);
    this.add(path);
    return Promise.resolve();
  }

  mkdirSync(path: string | URL) {
    path = this.parsePath(path);
    this.add(path);
  }

  readFile(path: string | URL) {
    try {
      const res = this.tryReadFile(path);
      return Promise.resolve(toTypedArray(String(res)));
    } catch (e) {
      return Promise.reject(e);
    }
  }

  readFileSync(path: string | URL) {
    const res = this.tryReadFile(path);
    return toTypedArray(String(res));
  }

  readTextFileSync(path: string | URL): string {
    const res = this.tryReadFile(path);
    if (typeof res === "string") return res;
    throw new Error(`Cannot read non-text file "${path}".`);
  }

  writeFile(path: string | URL, data: Uint8Array) {
    try {
      path = this.parsePath(path);
      const str = new TextDecoder().decode(data);
      this.add(path, str as unknown as T);
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }

  writeFileSync(path: string | URL, data: Uint8Array) {
    path = this.parsePath(path);
    const str = new TextDecoder().decode(data);
    this.add(path, str as unknown as T);
  }

  writeTextFileSync(path: string | URL, data: string) {
    path = this.parsePath(path);
    this.add(path, data as unknown as T);
  }

  exists(path: string | URL) {
    path = this.parsePath(path);
    return this.contents.has(path)
      ? Promise.resolve(true)
      : Promise.resolve(false);
  }

  existsSync(path: string | URL) {
    path = this.parsePath(path);
    return this.contents.has(path);
  }

  lstat(path: string | URL) {
    path = this.parsePath(path);
    if (this.read(path)) {
      return Promise.resolve({
        isFile: true,
        isDirectory: false,
        isSymlink: false,
      });
    }
    if (this.getChildPaths(path).length > 0) {
      return Promise.resolve({
        isFile: false,
        isDirectory: true,
        isSymlink: false,
      });
    }
    return Promise.reject(`Path "${path}" not found`);
  }

  lstatSync(path: string | URL) {
    path = this.parsePath(path);
    if (this.read(path)) {
      return { isFile: true, isDirectory: false, isSymlink: false };
    }
    if (this.getChildPaths(path).length > 0) {
      return { isFile: false, isDirectory: true, isSymlink: false };
    }
    throw new Error(`Path "${path}" not found`);
  }

  walk(currentPath: string | URL) {
    currentPath = this.parsePath(currentPath);
    // deno-lint-ignore no-this-alias
    const self = this;
    async function* createAsyncIterable(syncIterable: Array<string>) {
      for (const elem of syncIterable) {
        const stats = await self.lstat(elem);
        const entry = {
          name: elem.replace(/^.*[\\\/]/, ""),
          path: elem,
          ...stats,
        };
        yield entry;
      }
    }
    return createAsyncIterable(this.getChildPaths(currentPath));
  }

  walkSync(currentPath: string | URL) {
    currentPath = this.parsePath(currentPath);
    // deno-lint-ignore no-this-alias
    const self = this;
    function* createAsyncIterable(syncIterable: Array<string>) {
      for (const elem of syncIterable) {
        const stats = self.lstatSync(elem);
        const entry = {
          name: elem.replace(/^.*[\\\/]/, ""),
          path: elem,
          ...stats,
        };
        yield entry;
      }
    }
    return createAsyncIterable(this.getChildPaths(currentPath));
  }

  watch(paths: string | string[]): AsyncPushIterator<FsEvent> {
    let events: Array<FsEvent & { _id: string }> = [];
    if (!Array.isArray(paths)) {
      paths = [paths];
    }
    return new AsyncPushIterator<FsEvent>((it) => {
      const intervalId = setInterval(() => {
        if (events.length > 0) {
          for (let index = 0; index < events.length; index++) {
            const event = events[index];
            const eventPath = event.paths[0];
            events = events.filter((el) => el._id !== event._id);
            for (let i = 0; i < paths.length; i++) {
              if (eventPath.startsWith(normalize(paths[i]))) {
                it.push(event);
              }
            }
          }
        }
      }, 50);

      const possibleEvents: Array<FsEventKind> = [
        "create",
        "modify",
        "remove",
      ];

      // Register listeners, in order to terminate them later
      const listeners = new Map<FsEventKind, (path: WalkEntry) => void>();
      for (let index = 0; index < possibleEvents.length; index++) {
        const possibleEvent = possibleEvents[index];
        listeners.set(
          possibleEvent,
          this.on(possibleEvent, (entry: WalkEntry) => {
            events.push({
              _id: randomId(),
              kind: possibleEvent,
              paths: [entry.path],
            });
          }),
        );
      }

      return () => {
        clearInterval(intervalId);
        // Safely terminate related listeners
        listeners.forEach((value, key) => {
          this.off(key, value);
        });
      };
    });
  }

  getPaths(): string[] {
    return Array.from(this.contents.keys());
  }

  getContents(): T[] {
    return Array.from(this.contents.values());
  }

  getRoot(): string[] {
    return this.getChildPaths("");
  }

  getChildPaths(path: string): string[] {
    return this.getPaths().filter((p) => p.startsWith(path) && p !== path);
  }

  getChildNames(path: string): string[] {
    return this.getChildPaths(path)
      .map((fullPath) => fullPath.split(path)[1].split("/")[1])
      .reduce((final: string[], pathRef) => {
        if (final.indexOf(pathRef) <= -1) {
          final.push(pathRef);
        }
        return final;
      }, []);
  }

  map<R = T>(
    fn: (res: T, path: string) => R,
  ): VirtualFileSystem<R> {
    const res = new VirtualFileSystem<R>();
    this.contents.forEach((item, key) => {
      res.add(key, fn(item, key));
    });
    return res;
  }

  filter(fn: (res: T, path: string) => boolean): VirtualFileSystem<T> {
    const res = new VirtualFileSystem<T>();
    this.contents.forEach((item, key) => {
      if (fn(item, key)) {
        res.add(key, item);
      }
    });
    return res;
  }
}

/**
 * Generates a virtual filesystem implementing all methods from
 * [`simple-virtual-fs`](https://github.com/deebloo/virtual-fs)'s `VirtualFileSystem<T>` class,
 * plus `FileSystemLike` bindings including `lstat`, `walk`, `exists`, etc.
 */
export function createVirtualFileSystem<T = any>(): VirtualFileSystem<T> {
  return new VirtualFileSystem<T>();
}

createVirtualFileSystem();

export type { FileSystemLike, FsEvent, WalkEntry };
