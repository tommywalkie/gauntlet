export interface IVirtualFs<T> {
    size: number
    add(path: string, value?: T | undefined): VirtualFs<T>
    remove(path: string): VirtualFs<T>
    move(path: string, moveTo: string): VirtualFs<T>
    clear(): VirtualFs<T>
    read(path: string): T
    getPaths(): string[]
    getContents(): T[]
    getRoot(): string[]
    getChildPaths(path: string): string[]
    getChildNames(path: string): string[]
    map<R>(fn: (res: T, path: string) => R): VirtualFs<R>
    filter(fn: (res: T, path: string) => boolean): VirtualFs<T>
}

/**
 * Virtual filesystem implementation inspired from
 * [`virtual-fs`](https://github.com/deebloo/virtual-fs)
 * 
 * @todo
 * Might be available later on NPM (_c.f._ [deebloo/virtual-fs#9](https://github.com/deebloo/virtual-fs/issues/9))
 * 
 * @license
 * MIT License
 * 
 * Copyright (c) 2019 Danny Blue
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
 export class VirtualFs<T = any> implements IVirtualFs<T> {
    private contents = new Map<string, T>();

    get size() {
        return this.contents.size;
    }

    add(path: string, value?: T): VirtualFs<T> {
        this.contents.set(path, value as T);
        return this;
    }

    remove(path: string): VirtualFs<T> {
        this.getPaths().forEach(p => {
            if (p.startsWith(path)) {
                this.contents.delete(p);
            }
        });
        return this;
    }

    move(path: string, moveTo: string): VirtualFs<T> {
        const children = this.getChildPaths(path);

        if (this.contents.has(path)) {
            this.contents.set(moveTo, this.read(path));
            this.contents.delete(path);
        }

        children.forEach(p => {
            const parsed = p.split(path);
            const newPath = moveTo + parsed[parsed.length - 1];
            this.contents.set(newPath, this.read(p));
            this.contents.delete(p);
        });

        return this;
    }

    clear(): VirtualFs<T> {
        this.contents.clear();
        return this;
    }

    read(path: string): T {
        return this.contents.get(path) as T;
    }

    getPaths(): string[] {
        return Array.from(this.contents.keys());
    }

    getContents(): T[] {
        return Array.from(this.contents.values());
    }

    getRoot(): string[] {
        return this.getChildPaths('');
    }

    getChildPaths(path: string): string[] {
        return this.getPaths().filter(p => p.startsWith(path) && p !== path);
    }

    getChildNames(path: string): string[] {
        return this.getChildPaths(path)
            .map(fullPath => fullPath.split(path)[1].split('/')[1]) // Find the first child
            .reduce((final: string[], pathRef) => {
                // Dedupe the list
                if (final.indexOf(pathRef) <= -1) {
                    final.push(pathRef);
                }
                return final;
            }, []);
    }

    map<R>(fn: (res: T, path: string) => R): VirtualFs<R> {
        const res = new VirtualFs<R>();
        this.contents.forEach((item, key) => {
            res.add(key, fn(item, key) as R);
        });
        return res;
    }

    filter(fn: (res: T, path: string) => boolean): VirtualFs<T> {
        const res = new VirtualFs<T>();
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
 * [`virtual-fs`](https://github.com/deebloo/virtual-fs)'s `VirtualFs<T>` class,
 * plus `FileSystemLike` bindings including `lstat`, `walk`, `exists`, etc.
 * 
 * @todo
 * Implement `watch` using `EventEmitter` or `rxjs`'s `BehaviorSubject`
 */
export function createVirtualFileSystem<T = any>(): FileSystemLike & IVirtualFs<T> {
    const virtualFs = new VirtualFs()
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
            async function* createAsyncIterable(syncIterable: Array<string>) {
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