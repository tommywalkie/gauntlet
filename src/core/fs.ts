// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
export interface FsEvent {
    kind: "any" | "access" | "create" | "modify" | "remove";
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
 * Base filesystem bindings with needed methods for watchers
 */
export interface FileSystem {
    cwd: string,
    exists: (filePath: string) => Promise<boolean>,
    lstat: (path: string | URL) => Promise<Omit<Omit<WalkEntry, "name">, "path">>,
    normalize: (path: string) => string,
    walk: (currentPath: string) => AsyncIterableIterator<WalkEntry>,
    watch: (paths: string | string[], options?: {
        recursive: boolean;
    } | undefined) => AsyncIterableIterator<FsEvent>,
}