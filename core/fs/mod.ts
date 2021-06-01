// deno-lint-ignore-file no-explicit-any
import { AsyncPushIterator } from "../../imports/graphqlade.ts";
import { EventEmitter } from "../../imports/pietile-eventemitter.ts";
import { isAbsolute, join, normalize } from "../../imports/path.ts";
import { randomId, toTypedArray } from "../utils.ts";
import type {
  FileSystemLike,
  FsEvent,
  FsEventKind,
  WalkEntry,
  WatchEvents,
} from "../types.ts";

export interface Item<T = any> extends WalkEntry {
  data?: T;
}

export interface Document<T = any> extends Item<T> {
  data: T;
  isFile: true;
  isDirectory: false;
}

export interface Directory extends Item {
  data: undefined;
  isFile: false;
  isDirectory: true;
}

/**
 * Same as `String.prototype.replaceAll("\\", "/")`, except it has better
 * compatibility.
 */
export function replaceSlashes(str: string) {
  return str.split(/\\/).join("/");
}

/**
 * Same as [`std/path`](https://deno.land/std/path).`normalize`,
 * except it replaces all `\` with `/`, and removes trailing slashes.
 */
export function format(path: string) {
  const res = replaceSlashes(normalize(path));
  return res.length > 1 && res[res.length - 1] === "/"
    ? res.substr(0, res.length - 1)
    : res;
}

export function dirname(entry: string) {
  return entry.substr(
    0,
    entry.length - entry.replace(/^.*[\\\/]/, "").length - 1,
  );
}

export interface PathItem {
  path: string;
  name: string;
  index: number;
}

export class FileSystem<T = any> extends EventEmitter<WatchEvents>
  implements FileSystemLike {
  private root = "/";
  private CWD: string = this.root;
  private contents = new Map<string, Item<T>>();

  get size(): number {
    return this.contents.size;
  }

  /**
   * Given an absolute path, split it and
   * returns an iterator, for each folder.
   * This utility doesn't check if these folders actually exist.
   */
  private *traverse(givenPath: string): IterableIterator<PathItem> {
    if (!isAbsolute(givenPath)) {
      throw new Error("Cannot traverse a relative path.");
    }
    const iterator = givenPath.split("/");
    let path = this.root;
    for (const [index, name] of iterator.entries()) {
      path = format(join(path, name));
      yield { path, name, index };
    }
  }

  resolve(p: string) {
    p = format(p);
    return isAbsolute(p) ? p : format(join(this.CWD, p));
  }

  cwd(): string {
    return this.CWD;
  }

  cd(path: string): void {
    path = this.resolve(path);
    if (path === "/") {
      this.CWD = path;
    } else {
      if (!this.existsSync(path)) {
        throw new Error(
          `Cannot use a non-existing "${path}" entry as current working directory.`,
        );
      }
      if (this.lstatSync(path).isFile) {
        throw new Error(
          `Cannot use a file "${path}" as current working directory.`,
        );
      }
      this.CWD = path;
    }
  }

  /**
   * Low-level path existence checking implementation,
   * given path must be absolute.
   * @private
   */
  private _exists(existingPath: string) {
    return this.contents.has(existingPath);
  }

  existsSync(path: string) {
    path = this.resolve(path);
    return this._exists(path);
  }

  exists(path: string): Promise<boolean> {
    try {
      return Promise.resolve(this.existsSync(path));
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * Low-level folder creation implementation, given path must be absolute
   * and valid, implying all parent folders exist.
   * @private
   */
  private _mkdir(existingPath: string) {
    this.contents.set(existingPath, {
      path: existingPath,
      name: existingPath.replace(/^.*[\\\/]/, ""),
      isFile: false,
      isDirectory: true,
      isSymlink: false,
    } as Directory);
  }

  mkdirSync(givenPath: string) {
    givenPath = this.resolve(givenPath);
    if (this._exists(givenPath)) {
      throw new Error("Cannot create directory, file already exists.");
    }
    if (givenPath === "/") {
      throw new Error("Cannot override the root folder.");
    }
    const parentDirIndex = givenPath.split("/").length - 2;
    for (const { path, index } of this.traverse(givenPath)) {
      if (index <= parentDirIndex && path !== "/") {
        if (this.contents.get(path)?.isFile) {
          throw new Error("Cannot create folder under a file.");
        }
        if (!this._exists(path)) {
          throw new Error("Cannot create folder inside a non-existing folder.");
        }
      }
    }
    this._mkdir(givenPath);
  }

  mkdir(givenPath: string) {
    try {
      return Promise.resolve(this.mkdirSync(givenPath));
    } catch (e) {
      return Promise.reject(e);
    }
  }

  readSync(path: string) {
    path = this.resolve(path);
    if (this.existsSync(path)) {
      const entry = this.contents.get(path) as Document<T>;
      if (entry.isDirectory) {
        throw new Error("Cannot read into a directory.");
      }
      return entry.data;
    }
    throw new Error("Cannot read file, path not found.");
  }

  read(path: string) {
    try {
      return Promise.resolve(this.readSync(path));
    } catch (e) {
      return Promise.reject(e);
    }
  }

  readTextFileSync(path: string): string {
    const content = this.readSync(path) as unknown as string;
    if (typeof content === "string") {
      return content;
    }
    throw new Error(`Cannot read non-text file "${path}".`);
  }

  readTextFile(path: string) {
    try {
      return Promise.resolve(this.readTextFileSync(path));
    } catch (e) {
      return Promise.reject(e);
    }
  }

  readFileSync(path: string | URL) {
    if (path instanceof URL) path = path.toString();
    return toTypedArray(this.readTextFileSync(path));
  }

  readFile(path: string) {
    try {
      return Promise.resolve(this.readFileSync(path));
    } catch (e) {
      return Promise.reject(e);
    }
  }

  writeSync(givenPath: string, value: T) {
    givenPath = this.resolve(givenPath);
    const parentDirIndex = givenPath.split("/").length - 2;
    if (givenPath === "/") {
      throw new Error("Cannot create file as filesystem root.");
    }
    for (const { path, index } of this.traverse(givenPath)) {
      if (index <= parentDirIndex && path !== "/") {
        const entry = this.contents.get(path);
        if (entry) {
          if (entry.isFile) {
            throw new Error(
              `Path "${givenPath}" is not valid, "${path}" is a file.`,
            );
          }
        } else {
          throw new Error(
            `Path "${givenPath}" is not valid, directory "${path}" not found.`,
          );
        }
      }
      if (index === parentDirIndex + 1) {
        if (this.contents.get(path)?.isDirectory) {
          throw new Error("Cannot write into a directory.");
        }
      }
    }
    const walkEntry: Omit<Document<T>, "data"> = {
      path: givenPath,
      name: givenPath.replace(/^.*[\\\/]/, ""),
      isFile: true,
      isDirectory: false,
      isSymlink: false,
    };
    if (this._exists(givenPath)) {
      this.emit("modify", walkEntry);
    } else {
      this.emit("create", walkEntry);
    }
    this.contents.set(givenPath, {
      data: value,
      ...walkEntry,
    } as Document<T>);
  }

  write(givenPath: string, value: T) {
    try {
      return Promise.resolve(this.writeSync(givenPath, value));
    } catch (e) {
      return Promise.reject(e);
    }
  }

  add = this.writeSync;

  writeFileSync(path: string, data: Uint8Array) {
    const foundType = typeof data;
    if (
      foundType !== "object" ||
      (data.toString && data.toString() !== "[object Uint8Array]")
    ) {
      throw new Error(
        `Cannot write non-Uint8Array data when using writeFileSync() or writeFile().`,
      );
    }
    return this.writeSync(path, new TextDecoder().decode(data) as unknown as T);
  }

  writeFile(path: string, data: Uint8Array) {
    try {
      return Promise.resolve(this.writeFileSync(path, data));
    } catch (e) {
      return Promise.reject(e);
    }
  }

  writeTextFileSync(path: string, data: string) {
    if (typeof data !== "string") {
      throw new Error(
        `Cannot write non-string data when using writeTextFileSync() or writeTextFile().`,
      );
    }
    return this.writeSync(path, data as unknown as T);
  }

  writeTextFile(path: string, data: string) {
    try {
      return Promise.resolve(this.writeTextFileSync(path, data));
    } catch (e) {
      return Promise.reject(e);
    }
  }

  removeSync(givenPath: string) {
    givenPath = this.resolve(givenPath);
    if (this._exists(givenPath)) {
      if (this.contents.get(givenPath)?.isDirectory) {
        for (const child of this.getChildPaths(givenPath)) {
          this.removeSync(child);
        }
      }
      const { path, name, isFile, isDirectory, isSymlink } = this.contents.get(
        givenPath,
      ) as Item<T>;
      this.emit("remove", { path, name, isFile, isDirectory, isSymlink });
      this.contents.delete(path);
    } else {
      throw new Error(`Cannot remove "${givenPath}", path not found.`);
    }
  }

  remove(path: string) {
    try {
      // TODO(tommywalkie): Consider using promises instead of just wrapping removeSync()
      return Promise.resolve(this.removeSync(path));
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * Low-level folder creation implementation, given path must be absolute
   * and valid, implying all parent folders exist.
   * @private
   */
  private _lstat(existingPath: string): WalkEntry {
    const { path, name, isFile, isDirectory, isSymlink } = this.contents.get(
      existingPath,
    ) as WalkEntry;
    return { path, name, isFile, isDirectory, isSymlink };
  }

  lstatSync(givenPath: string) {
    givenPath = this.resolve(givenPath);
    if (this.contents.has(givenPath)) {
      return this._lstat(givenPath);
    }
    throw new Error(`Path "${givenPath}" not found`);
  }

  lstat(givenPath: string) {
    try {
      return Promise.resolve(this.lstatSync(givenPath));
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * Low-level item copying implementation, destination path
   * must be absolute and not be already registered in contents.
   * @private
   */
  private _copy(entry: Item<T>, to: string) {
    if (entry.isDirectory) {
      this.mkdirSync(to);
    }
    if (entry.isFile) {
      // In theory, as long as public methods are used to
      // populate filesystem, folders are guaranteed to be
      // created before folder contents.
      // So we can safely use `writeSync` here.
      this.writeSync(to, (entry as Document).data);
    }
    this.emit("create", {
      path: to,
      name: entry.name,
      isFile: entry.isFile,
      isDirectory: entry.isDirectory,
      isSymlink: entry.isSymlink,
    });
  }

  /**
   * Low-level item moving implementation, destination path
   * must be absolute and not be already registered in contents.
   * @private
   */
  private _move(entry: Item<T>, to: string) {
    this._copy(entry, to);
    // Unlike the case earlier, calling `removeSync`
    // would recursively remove entries, and throw errors
    // when retrieving deleted folder items' stats.
    // We can prevent this by directly calling `<Map>.delete`.
    this.contents.delete(entry.path);
    this.emit("remove", {
      path: entry.path,
      name: entry.name,
      isFile: entry.isFile,
      isDirectory: entry.isDirectory,
      isSymlink: entry.isSymlink,
    });
  }

  moveSync(from: string, to: string) {
    from = this.resolve(from);
    to = this.resolve(to);
    if (!this._exists(from)) {
      throw new Error(`Cannot move not found "${from}" path.`);
    }
    if (dirname(to).length > 0 && !this._exists(dirname(to))) {
      throw new Error(
        `Cannot move "${from}" into invalid path "${to}", "${
          dirname(to)
        }" not found.`,
      );
    }
    const fromStats = this._lstat(from);
    if (!this._exists(to) && fromStats.isDirectory && to !== "/") {
      this.mkdirSync(to);
    }

    // Simulate root folder stats if needed, otherwise get destination stats as usual
    let toStats: { isFile: boolean; isDirectory: boolean };
    if (to === "/") {
      toStats = { isFile: false, isDirectory: true };
    } else {
      if (this._exists(to)) {
        toStats = this._lstat(to);
        if (fromStats.isFile && toStats.isFile) {
          throw new Error(
            `Cannot move "${from}" file into an existing "${to}" file.`,
          );
        }
        if (fromStats.isDirectory && toStats.isFile) {
          throw new Error(
            `Cannot move "${from}" directory into an existing "${to}" file.`,
          );
        }
      } else {
        toStats = {
          isFile: fromStats.isFile,
          isDirectory: fromStats.isDirectory,
        };
      }
    }
    if (fromStats.isDirectory && toStats.isDirectory) {
      for (const item of this.getChildPaths(from)) {
        const stats = this._lstat(item);
        const destPath = format(join(to, item.substr(from.length + 1)));
        if (stats.isDirectory) {
          this._move(
            this.contents.get(item) as Directory,
            destPath,
          );
        }
        if (stats.isFile) {
          if (this._exists(destPath)) {
            throw new Error(
              `Cannot override existing "${destPath}" file while moving "${from}" directory into "${to}".`,
            );
          }
          this._move(
            this.contents.get(item) as Document<T>,
            destPath,
          );
        }
      }
      this.removeSync(from);
    }
    if (fromStats.isFile && toStats.isDirectory) {
      this._move(
        this.contents.get(from) as Document<T>,
        format(join(to, from.replace(/^.*[\\\/]/, ""))),
      );
    }
    if (fromStats.isFile && toStats.isFile) {
      this._move(
        this.contents.get(from) as Document<T>,
        to,
      );
    }
  }

  move(from: string, to: string) {
    try {
      // TODO(tommywalkie): Consider using promises instead of just wrapping moveSync()
      Promise.resolve(this.moveSync(from, to));
    } catch (e) {
      return Promise.reject(e);
    }
  }

  copySync(from: string, to: string) {
    from = this.resolve(from);
    to = this.resolve(to);
    if (!this._exists(from)) {
      throw new Error(`Cannot copy not found "${from}" path.`);
    }
    if (dirname(to).length > 0 && !this._exists(dirname(to))) {
      throw new Error(
        `Cannot copy "${from}" into invalid path "${to}", "${
          dirname(to)
        }" not found.`,
      );
    }
    const fromStats = this._lstat(from);
    if (this._exists(to)) {
      throw new Error(
        `Cannot copy "${from}" into an existing "${to}" path.`,
      );
    }
    if (!this._exists(to) && fromStats.isDirectory && to !== "/") {
      this.mkdirSync(to);
    }

    // Simulate root folder stats if needed, otherwise get destination stats as usual
    let toStats: { isFile: boolean; isDirectory: boolean };
    if (to === "/") {
      toStats = { isFile: false, isDirectory: true };
    } else {
      if (this._exists(to)) {
        toStats = this._lstat(to);
        if (fromStats.isFile && toStats.isFile) {
          throw new Error(
            `Cannot copy "${from}" file into an existing "${to}" file.`,
          );
        }
        if (fromStats.isDirectory && toStats.isFile) {
          throw new Error(
            `Cannot copy "${from}" directory into an existing "${to}" file.`,
          );
        }
      } else {
        toStats = {
          isFile: fromStats.isFile,
          isDirectory: fromStats.isDirectory,
        };
      }
    }
    if (fromStats.isDirectory && toStats.isDirectory) {
      for (const item of this.getChildPaths(from)) {
        const stats = this._lstat(item);
        const destPath = format(join(to, item.substr(from.length + 1)));
        if (stats.isDirectory) {
          this._copy(
            this.contents.get(item) as Directory,
            destPath,
          );
        }
        if (stats.isFile) {
          if (this._exists(destPath)) {
            throw new Error(
              `Cannot override existing "${destPath}" file while copying "${from}" directory into "${to}".`,
            );
          }
          this._copy(
            this.contents.get(item) as Document<T>,
            destPath,
          );
        }
      }
    }
    if (fromStats.isFile && toStats.isFile) {
      this._copy(
        this.contents.get(from) as Document<T>,
        to,
      );
    }
  }

  copy(from: string, to: string) {
    try {
      // TODO(tommywalkie): Consider using promises instead of just wrapping moveSync()
      Promise.resolve(this.copySync(from, to));
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * Rename synchronously a file or a directory. This method is almost the same
   * as `moveSync` except the destination cannot be an existing entry,
   * nor the root folder.
   */
  renameSync(from: string, to: string) {
    from = this.resolve(from);
    to = this.resolve(to);
    if (!this._exists(from)) {
      throw new Error(`Cannot rename not found "${from}" path.`);
    }
    if (to === "/") {
      throw new Error(`Cannot rename "${from}" into root folder.`);
    }
    if (dirname(to).length > 0 && !this._exists(dirname(to))) {
      throw new Error(
        `Path "${to}" is invalid, "${dirname(to)}" not found.`,
      );
    }
    if (this._exists(to)) {
      throw new Error(
        `Cannot rename "${from}" path into an existing "${to}" path.`,
      );
    }
    const fromStats = this._lstat(from);
    if (!this._exists(to) && fromStats.isDirectory) {
      this.mkdirSync(to);
    }
    if (fromStats.isDirectory) {
      for (const item of this.getChildPaths(from)) {
        const stats = this._lstat(item);
        if (stats.isDirectory) {
          this._move(
            this.contents.get(item) as Directory,
            format(join(to, item.substr(from.length + 1))),
          );
        }
        if (stats.isFile) {
          this._move(
            this.contents.get(item) as Document<T>,
            format(join(to, item.substr(from.length + 1))),
          );
        }
      }
      this.removeSync(from);
    }
    if (fromStats.isFile) {
      this._move(
        this.contents.get(from) as Document<T>,
        format(join(to, from.substr(from.length + 1))),
      );
    }
  }

  rename(from: string, to: string) {
    try {
      // TODO(tommywalkie): Consider using promises instead of just wrapping renameSync()
      Promise.resolve(this.renameSync(from, to));
    } catch (e) {
      return Promise.reject(e);
    }
  }

  *walkSync(givenPath: string) {
    givenPath = this.resolve(givenPath);
    if (this._exists(givenPath)) {
      if (this._lstat(givenPath).isFile) {
        throw new Error(
          `Cannot walk a "${givenPath}" file.`,
        );
      }
    }
    for (const elem of this.getChildPaths(givenPath)) {
      yield this._lstat(elem);
    }
  }

  async *walk(givenPath: string) {
    try {
      givenPath = this.resolve(givenPath);
      if (this._exists(givenPath)) {
        if (this._lstat(givenPath).isFile) {
          throw new Error(
            `Cannot walk a "${givenPath}" file.`,
          );
        }
      }
      for await (const elem of this.getChildPaths(givenPath)) {
        yield this._lstat(elem);
      }
    } catch (e) {
      return Promise.reject(e);
    }
  }

  watch(paths: string | string[]): AsyncPushIterator<FsEvent> {
    let events: Array<FsEvent & { _id: string }> = [];
    if (!Array.isArray(paths)) {
      paths = [paths];
    }
    paths = paths.map((el) => this.resolve(el));
    return new AsyncPushIterator<FsEvent>((it) => {
      const intervalId = setInterval(() => {
        if (events.length > 0) {
          for (let index = 0; index < events.length; index++) {
            const event = events[index];
            const eventPath = event.paths[0];
            events = events.filter((el) => el._id !== event._id);
            for (let i = 0; i < paths.length; i++) {
              if (eventPath.startsWith(paths[i])) {
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

  clear() {
    this.contents.clear();
  }

  getPaths(): string[] {
    return Array.from(this.contents.keys());
  }

  getContents(): Item<T>[] {
    return Array.from(this.contents.values());
  }

  getRoot(): string[] {
    return this.getChildPaths("");
  }

  ls(path: string, recursive = false) {
    path = this.resolve(path);
    return this.getChildPaths(path).filter((el) => {
      return recursive
        ? true
        : el.split("/").length === path.split("/").length + 1;
    });
  }

  getChildPaths(path: string): string[] {
    return this.getPaths().filter((p) =>
      p.startsWith(path + "/") && p !== path
    );
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
  ) {
    const res = new FileSystem<R>();
    this.contents.forEach((item, key) => {
      res.add(key, fn(item.data as T, key));
    });
    return res;
  }

  filter(fn: (res: T, path: string) => boolean) {
    const res = new FileSystem<T>();
    this.contents.forEach((item, key) => {
      if (fn(item.data as T, key)) {
        res.add(key, item.data as T);
      }
    });
    return res;
  }
}

export function createVirtualFileSystem<T = any>(): FileSystem<T> {
  return new FileSystem<T>();
}

export {
  createVirtualFileSystem as createFileSystem,
  FileSystem as VirtualFileSystem,
};
