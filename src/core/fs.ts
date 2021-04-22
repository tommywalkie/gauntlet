import { ObservableVirtualFs, IVirtualFs } from '../../imports/simple-virtual-fs.ts'

/**
 * Generates a virtual filesystem implementing all methods from
 * [`simple-virtual-fs`](https://github.com/deebloo/virtual-fs)'s `VirtualFs<T>` class,
 * plus `FileSystemLike` bindings including `lstat`, `walk`, `exists`, etc.
 * 
 * @todo
 * Implement `watch` using `EventEmitter` or `rxjs`'s `BehaviorSubject`
 */
export function createVirtualFileSystem<T = any>(): FileSystemLike & IVirtualFs<T> {
    const virtualFs = new ObservableVirtualFs()
    function isDirectory(filePath: string) {
        return virtualFs.getChildPaths(filePath)?.length > 0
    }
    function lstat(filePath: string) {
        // If this is a file
        if (virtualFs.read(filePath))
            return Promise.resolve({ isFile: true, isDirectory: false, isSymlink: false })
        // If this is a non-empty directory
        if (isDirectory(filePath))
            return Promise.resolve({ isFile: false, isDirectory: true, isSymlink: false })
        // Neither a file nor a directory
        return Promise.resolve({ isFile: false, isDirectory: false, isSymlink: false })
    }
    // @ts-ignore — Need to implement `watch`
    return Object.assign(virtualFs, {
        cwd: '~/',
        exists: (filePath: string) => {
            return virtualFs.read(filePath) ? Promise.resolve(true) : Promise.resolve(false)
        },
        lstat,
        normalize: (str: string) => str,
        walk: (currentPath: string) => {
            async function* createAsyncIterable(syncIterable: Array<any>) {
                for (const elem of syncIterable) {
                    const stats = await lstat(elem)
                    const entry = { name: elem.replace(/^.*[\\\/]/, ''), path: elem, ...stats }
                    yield entry;
                }
            }
            return createAsyncIterable(virtualFs.getChildPaths(currentPath))
        }
    })
}

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
 * Base filesystem bindings for watchers
 */
export interface FileSystemLike {
    cwd: string,
    exists: (filePath: string) => Promise<boolean>,
    lstat: (path: string) => Promise<Omit<Omit<WalkEntry, "name">, "path">>,
    normalize: (path: string) => string,
    walk: (currentPath: string) => AsyncIterableIterator<WalkEntry>,
    watch: (paths: string | string[], options?: {
        recursive: boolean;
    } | undefined) => AsyncIterableIterator<FsEvent>,
}