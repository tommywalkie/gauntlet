/**
 * File system events
 * 
 * This is basically a high-level `Deno.FsEvent` wrapper, leveraging
 * unintuitive behaviours on non-Unix systems with `Deno.watchFs`.
 */
export interface FileEvents {
    modify(path: WalkEntry): void;
    create(path: WalkEntry): void;
    remove(path: WalkEntry): void;
    watch(entry: WalkEntry): void;
}

/**
 * Base events interface for `EventEmitter<T>` from `deno_events`,
 * should be used for fine-grained debugging and crash reporting.
 */
export interface LogEvents {
    fatal(description: string, error?: Error): void
    error(description: string, error?: Error): void
    warn(description: string): void
    info(description: string): void
    debug(description: string): void
}

export interface WatchEvent {
    kind: keyof FileEvents
    entry: WalkEntry
}

export interface WatcherOptions {
    source: string,
    fs: FileSystemLike
}

export interface FsEvent {
    kind: "create" | "modify" | "remove" | string;
    paths: string[];
}

// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
export interface WalkEntry {
    path: string,
    name: string;
    isFile: boolean;
    isDirectory: boolean;
    isSymlink: boolean;
}

/**
 * Base filesystem bindings for watchers
 */
export interface FileSystemLike {
    cwd: () => string
    existsSync: (path: string) => boolean
    lstatSync: (path: string) => Omit<Omit<WalkEntry, "name">, "path">
    mkdirSync: (path: string | URL, ...options: any | undefined) => void
    readFileSync: (path: string | URL) => Uint8Array
    walkSync: (currentPath: string) => IterableIterator<WalkEntry>
    watch: (paths: string | string[], ...options: any | undefined) => AsyncIterableIterator<FsEvent>
    writeFileSync: (path: string | URL, data: Uint8Array, ...options: any | undefined) => void
}