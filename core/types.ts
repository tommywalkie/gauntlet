// deno-lint-ignore-file no-explicit-any

// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
export interface WalkEntry {
  path: string;
  name: string;
  isFile: boolean;
  isDirectory: boolean;
  isSymlink: boolean;
}

/**
 * File watching events interface, designed for the `EventEmitter<T>`
 * implementation from `deno_events`
 */
export interface WatchEvents {
  modify(path: WalkEntry): void;
  create(path: WalkEntry): void;
  remove(path: WalkEntry): void;
  watch(entry: WalkEntry): void;
}

/**
 * Base events interface, designed for the `EventEmitter<T>`
 * implementation from `deno_events`, should be used for
 * fine-grained debugging and crash reporting.
 */
export interface LogEvents {
  fatal(description: string, error?: Error): void;
  error(description: string, error?: Error): void;
  warn(description: string): void;
  info(description: string): void;
  debug(description: string): void;
}

export interface Events extends LogEvents, WatchEvents {}

/**
 * File watching event object
 */
export interface WatchEvent {
  kind: keyof WatchEvents;
  entry: WalkEntry;
}

/**
 * Base file watching event
 */
export interface FsEvent {
  kind: FsEventKind | string;
  paths: string[];
}

/**
 * Base filesystem bindings
 */
export interface FileSystemLike {
  cwd: () => string;
  existsSync: (path: string) => boolean;
  lstatSync: (path: string) => Omit<Omit<WalkEntry, "name">, "path">;
  walkSync: (currentPath: string) => IterableIterator<WalkEntry>;
  watchFs: (
    paths: string | string[],
    ...options: any | undefined
  ) => AsyncIterableIterator<FsEvent>;
  readFileSync: (path: string | URL) => Uint8Array;
}

export interface WatcherOptions {
  source: string;
  fs: FileSystemLike;
}

export type FsEventKind = "create" | "modify" | "remove";

/**
 * Base file watching event
 */
export interface VirtualFileSystemEvent {
  kind: FsEventKind | "rename";
  paths: string[];
}

export interface FileExtensionInfo {
  extension: string;
  fullExtension: string;
}

export type Entry = WalkEntry & FileExtensionInfo & {
  mount: string;
  relativePath: string;
};

export interface ResolvedEntry extends Entry {
  content: string;
}

export interface ComputedEntry extends ResolvedEntry {
  outputs: ResolvedEntry[];
}

export type PluginHookContext = Entry & FileSystemLike;

export type Context = Entry & FileSystemLike;

export type Computed<T extends string> =
  | {
    [key in T]: string;
  }
  | Promise<
    {
      [key in T]: string;
    }
  >;

export type PluginResult<T extends string> = Computed<T>;

export interface Plugin<
  T extends string = string,
  K extends string = string,
  U = string,
> {
  name: string;
  onMount?(): void | Promise<void>;
  onDestroy?(): void | Promise<void>;
  onError?(err: Error, context: Context): void | Promise<void>;
  onBuild?(result: Computed<K>, context: Context): void | Promise<void>;
  resolve: {
    input: Array<T>;
    output: Array<K>;
  };
  load?(path: string, context: Context): U | Promise<U>;
  transform: (
    content: U,
    context: Context,
  ) =>
    | {
      [key in K]: string;
    }
    | Promise<
      {
        [key in K]: string;
      }
    >;
}
