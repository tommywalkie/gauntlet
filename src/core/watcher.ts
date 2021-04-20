import { isWindows } from 'https://deno.land/std@0.93.0/_util/os.ts'
import { EventEmitter } from '../../imports/deno_events.ts'
import type { FsEvent, WalkEntry, FileSystem } from './fs.ts'

/**
 * File system events
 * 
 * This is basically a high-level `Deno.FsEvents` wrapper, leveraging
 * unintuitive behaviours on non-Unix systems with `Deno.watchFs`.
 */
export interface FsEvents {
    modify(path: WalkEntry): void;
    create(path: WalkEntry): void;
    remove(path: WalkEntry): void;
    watch(path: string): void
}

export interface WatcherOptions {
    mounts: string[],
    eventSource?: EventEmitter<any>,
    fs: FileSystem
}

/**
 * Takes an async interator and returns an array
 */
export async function toArray<T>(asyncIterator: AsyncIterableIterator<T>): Promise<Array<T>> { 
    const arr=[]; 
    for await(const i of asyncIterator) arr.push(i); 
    return arr;
}

export function register(options: WatcherOptions) {
    const mounts = options.mounts
    const eventSource = options.eventSource ?? new EventEmitter<FsEvents>()
    return mounts.map(
        async (mount: string) => await watch(mount, eventSource, options.fs)
    )
}

export async function watch(
    source: string,
    eventSource: EventEmitter<FsEvents>,
    fs: FileSystem
) {
    const watcher = fs.watch(source)
    const iterator: AsyncIterableIterator<WalkEntry> = fs.walk(source)
    let contents = await toArray<WalkEntry>(iterator)

    function format(str: string) {
        return fs.normalize(str).substring(fs.cwd.length + 1)
    }

    function diff(a: WalkEntry[], b: WalkEntry[]) {
        return a.filter(item1 => !b.some(item2 => (item2.path === item1.path)))
    }

    async function refreshSource() {
        const snapshot = [...contents]
        setTimeout(async () => {
            const iterator = fs.walk(source)
            const entries = await toArray<WalkEntry>(iterator)
            contents = [...entries]
            const addedEntries = diff(entries, snapshot)
            const removedEntries = diff(snapshot, entries)
            for (let index = 0; index < removedEntries.length; index++) {
                if (removedEntries[index].isFile) eventSource.emit('remove', removedEntries[index])
            }
            for (let index = 0; index < addedEntries.length; index++) {
                if (addedEntries[index].isFile) eventSource.emit('create', addedEntries[index])
            }
        }, 50)
    }

    async function handleEvent(event: FsEvent) {
        for await (const path of event.paths) {
            if (event.kind === 'create') {
                const { isFile, isDirectory, isSymlink } = await fs.lstat(path)
                const formatted = format(path)
                const entry = {
                    path: formatted,
                    name: formatted.substring(fs.normalize(source).length + 1),
                    isFile,
                    isDirectory,
                    isSymlink
                }
                if (isFile)
                    eventSource.emit(event.kind, entry)
                else if (isDirectory) {
                    // Untracked files inside a non-empty folder from outside the watching scope
                    // also produce a 'create' event before the one for the actual directory.
                    // TODO: Consider implementing priority queues.
                    setTimeout(async () => await refreshSource(), 800)
                }
            }
            if (event.kind === 'remove' || event.kind === 'modify') {
                const entry = contents.find(content => content.path === format(path))
                if (await fs.exists(fs.normalize(path))) {
                    if (entry?.isFile) eventSource.emit(event.kind, entry)
                    if (entry?.isDirectory) await refreshSource()
                }
                else await refreshSource()
            }
        }
    }

    if (isWindows) {
        // This is meant to de-duplicate ReadDirectoryChangesW events
        const cache: Map<string, number> = new Map()
        async function updateCache(event: FsEvent) {
            cache.set(event.paths.toString(), Date.now() + 100)
            await handleEvent(event)
        }
        eventSource.emit("watch", source)
        for await (const event of watcher) {
            const entry = cache.get(event.paths.toString())
            if (entry) {
                if (Date.now() > entry) await updateCache(event)
            }
            else updateCache(event)
        }
    }
    else {
        eventSource.emit("watch", source)
        for await (const event of watcher) {
            await handleEvent(event)
        }
    }
}