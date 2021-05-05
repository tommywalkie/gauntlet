import { isWindows } from '../../imports/std.ts'
import { EventEmitter } from '../../imports/deno_events.ts'
import { join, normalize } from '../../imports/path.ts'
import { toArray } from './utils.ts'
import type { FileEvents, FsEvent, WalkEntry, FileSystemLike } from './fs.ts'

export interface WatcherOptions {
    mounts: string[],
    eventSource?: EventEmitter<any>,
    fs: FileSystemLike
}

export interface WatchEvents {
    watch(path: string): void;
}

export function register(options: WatcherOptions) {
    const mounts = options.mounts
    const eventSource = options.eventSource ?? new EventEmitter<FileEvents>()
    return mounts.map(
        async (mount: string) => await watch(mount, eventSource, options.fs)
    )
}

export { register as registerWatchers }

export async function watch(
    source: string,
    eventSource: EventEmitter<FileEvents & WatchEvents>,
    fs: FileSystemLike
) {
    const watcher = fs.watch(source)
    const iterator: AsyncIterableIterator<WalkEntry> = fs.walk(source)
    let contents = await toArray<WalkEntry>(iterator)

    function format(str: string) {
        return normalize(str).substring(join(fs.cwd, source).length + 1)
    }

    function diff(a: WalkEntry[], b: WalkEntry[]) {
        return a.filter(item1 => !b.some(item2 => (item2.path === item1.path)))
    }

    async function refreshSource() {
        const snapshot = [...new Set([...contents])]
        setTimeout(async () => {
            const iterator = fs.walk(source)
            const entries = await toArray<WalkEntry>(iterator)
            contents = [...new Set([...entries])]
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
                const entry = {
                    path: join(source, format(path)),
                    name: normalize(path).replace(/^.*[\\\/]/, ''),
                    isFile,
                    isDirectory,
                    isSymlink
                }
                if (isFile) {
                    eventSource.emit(event.kind, entry)
                    contents.push(entry)
                }
                else if (isDirectory) {
                    // Untracked files inside a non-empty folder from outside the watching scope
                    // also produce a 'create' event before the one for the actual directory.
                    setTimeout(async () => await refreshSource(), 400)
                }
            }
            if (event.kind === 'remove' || event.kind === 'modify') {
                const entry = contents.find(content => content.path === join(source, format(path)))
                if (entry?.isFile) {
                    if (event.kind === 'remove') {
                        contents = contents.filter(content => content.path !== join(source, format(path)))
                    }
                    eventSource.emit(event.kind, entry)
                }
                if (entry?.isDirectory) {
                    setTimeout(async () => await refreshSource(), 400)
                }
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