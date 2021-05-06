import { AsyncPushIterator } from '../../imports/graphqlade.ts'
import { normalize } from '../../imports/path.ts'
import { EventEmitter } from '../../imports/deno_events.ts';
import { randomId, toTypedArray } from './utils.ts'
import type {
    FileSystemLike,
    FileEvents,
    FsEvent,
    WalkEntry
} from './types.ts'

export type WatchOptions = {
    recursive?: boolean
}

/**
 * Virtual filesystem inspired from
 * [`simple-virtual-fs`](https://github.com/deebloo/virtual-fs),
 * using `EventEmitter` instead of `rxjs`'s `BehaviourSubject`.
 */
export class VirtualFileSystem<T = any> extends EventEmitter<FileEvents> implements FileSystemLike {
    isVirtual: boolean = true
    cwd = () => './'
    private contents = new Map<string, T>();

    get size() {
        return this.contents.size;
    }

    private getEntryFrom(path: string) {
        return {
            name: path.replace(/^.*[\\\/]/, ''),
            path: path,
            ...this.lstatSync(path)
        }
    }

    add(path: string, value?: T): VirtualFileSystem<T> {
        let walkEntry, _exists = false
        const nPath = normalize(path)
        if (this.existsSync(nPath)) {
            _exists = true;
            walkEntry = this.getEntryFrom(nPath);
        }
        else {
            walkEntry = {
                name: nPath.replace(/^.*[\\\/]/, ''),
                path: nPath,
                isFile: value ? true : false,
                isDirectory: value ? false : true,
                isSymlink: false
            };
        }
        this.contents.set(nPath, value as T);
        if (_exists)
            this.emit('modify', walkEntry);
        else
            this.emit('create', walkEntry);
        return this;
    }

    remove(path: string): VirtualFileSystem<T> {
        this.getPaths().forEach(p => {
            if (p.startsWith(normalize(path))) {
                const walkEntry = this.getEntryFrom(normalize(p));
                this.contents.delete(p);
                this.emit('remove', walkEntry);
            }
        });
        return this;
    }

    move(path: string, moveTo: string): VirtualFileSystem<T> {
        const children = this.getChildPaths(path);

        if (this.contents.has(path)) {
            const walkEntry = this.getEntryFrom(path);
            this.contents.set(moveTo, this.read(path));
            this.contents.delete(path);
            this.emit('remove', walkEntry)
        }

        children.forEach(p => {
            const parsed = p.split(path);
            const walkEntry = this.getEntryFrom(path);
            const newPath = moveTo + parsed[parsed.length - 1];
            const newWalkEntry = {
                name: parsed[parsed.length - 1],
                path: newPath,
                ...this.lstatSync(path)
            };
            this.contents.set(newPath, this.read(p));
            this.contents.delete(p);
            this.emit('remove', walkEntry)
            this.emit('create', newWalkEntry)
        });

        return this;
    }

    clear(): VirtualFileSystem {
        this.contents.clear();
        return this;
    }

    read(path: string): T {
        return this.contents.get(path) as T;
    }

    readFile(path: string) {
        const res = this.contents.get(normalize(path))
        if (res)
            return Promise.resolve(toTypedArray(String(res)))
        return Promise.reject(`File "${path}" not found.`)
    }

    exists(filePath: string) {
        return this.contents.has(normalize(filePath)) ? Promise.resolve(true) : Promise.resolve(false)
    }

    existsSync(filePath: string) {
        return this.contents.has(filePath)
    }

    lstat(filePath: string) {
        if (this.read(normalize(filePath)))
            return Promise.resolve({ isFile: true, isDirectory: false, isSymlink: false })
        if (this.getChildPaths(normalize(filePath))?.length > 0)
            return Promise.resolve({ isFile: false, isDirectory: true, isSymlink: false })
        return Promise.reject(`Path "${filePath}" not found`)
    }

    lstatSync(filePath: string) {
        if (this.read(filePath))
            return { isFile: true, isDirectory: false, isSymlink: false }
        if (this.getChildPaths(filePath)?.length > 0)
            return { isFile: false, isDirectory: true, isSymlink: false }
        throw new Error(`Path "${filePath}" not found`)
    }

    walk(currentPath: string) {
        const _this = this
        async function* createAsyncIterable(syncIterable: Array<any>) {
            for (const elem of syncIterable) {
                const stats = await _this.lstat(elem)
                const entry = { name: elem.replace(/^.*[\\\/]/, ''), path: elem, ...stats }
                yield entry;
            }
        }
        return createAsyncIterable(this.getChildPaths(normalize(currentPath)))
    }

    watch(paths: string | string[], options?: WatchOptions): AsyncPushIterator<FsEvent> {
        let events: Array<FsEvent & { _id: string }> = []
        return new AsyncPushIterator<FsEvent>((it) => {
            const intervalId = setInterval(() => {
                if (events.length > 0) {
                    for (let index = 0; index < events.length; index++) {
                        const event = events[index]
                        events = events.filter(el => el._id !== event._id)
                        if (typeof paths === 'string') {
                            // In case 'paths' is string
                            if (event.paths[0].startsWith(normalize(paths)))
                                it.push(event)
                        }
                        else if (paths.length > 0) {
                            // In case 'paths' is string[]
                            for (let index = 0; index < paths.length; index++) {
                                const path = normalize(paths[index]);
                                if (event.paths[0].startsWith(path))
                                    it.push(event)
                            }
                        }
                        else {
                            it.push(event)
                        }
                    }
                }
            }, 50);

            type AcceptedEvents = 'create' | 'modify' | 'remove'
            const possibleEvents: Array<AcceptedEvents> = ['create', 'modify', 'remove']
            for (let index = 0; index < possibleEvents.length; index++) {
                const possibleEvent = possibleEvents[index];
                this.on(possibleEvent, (entry: WalkEntry) => {
                    events.push({
                        _id: randomId(),
                        kind: possibleEvent,
                        paths: [entry.path]
                    });
                })
            }
        
            return () => {
                clearInterval(intervalId);
            };
        })
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

    map<R>(fn: (res: T, path: string) => R): VirtualFileSystem<R> {
        const res = new VirtualFileSystem<R>();
        this.contents.forEach((item, key) => {
            res.add(key, fn(item, key) as R);
        });
        return res;
    }

    filter(fn: (res: T, path: string) => boolean): VirtualFileSystem<T> {
        const res = new VirtualFileSystem();
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
    return new VirtualFileSystem()
}

export type { FsEvent, FileEvents, FileSystemLike, WalkEntry }