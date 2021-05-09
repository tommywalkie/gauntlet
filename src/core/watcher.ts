import { AsyncPushIterator, AsyncPushIteratorSetup } from '../../imports/graphqlade.ts'
import { join, normalize } from '../../imports/path.ts'
import { getOS, toArraySync, randomId } from './utils.ts'
import type { FileSystemLike, FsEvent, WalkEntry } from './fs.ts'
import type { WatchEvent, WatcherOptions } from './types.ts'

/**
 * Based on an `AsyncIterator` superset originally designed
 * for [`graphqlade`](https://github.com/morris/graphqlade), the file watcher is intended
 * to wrap asynchronously pushed events by the provided filesystem `<FileSystemLike>.watch`
 * while .
 */
export class FileWatcher<T> extends AsyncPushIterator<T> {
    fs: FileSystemLike

    constructor(setup: AsyncPushIteratorSetup<T>, fs: FileSystemLike) {
        super(setup)
        this.fs = fs
    }
}

export function watchFs(options: WatcherOptions): AsyncIterableIterator<WatchEvent> {
    const isMac = getOS() === 'darwin'
    return new FileWatcher<WatchEvent>((iterator) => {
        let events: Array<WatchEvent & { _id: string }> = []
        const watcher = options.fs.watch(join(options.fs.cwd(), options.source))
        const srcIterator: IterableIterator<WalkEntry> = options.fs.walkSync(options.source)
        let contents: WalkEntry[] = []

        function format(str: string) {
            return normalize(str).substring(join(options.fs.cwd(), options.source).length + 1)
        }
    
        function diff(a: WalkEntry[], b: WalkEntry[]) {
            return a.filter(item1 => !b.some(item2 => (item2.path === item1.path)))
        }

        function refreshSource() {
            const snapshot = [...new Set([...contents])]
            const srcIterator = options.fs.walkSync(options.source)
            const entries = toArraySync<WalkEntry>(srcIterator)
            contents = [...new Set([...entries])]
            const addedEntries = diff(entries, snapshot)
            const removedEntries = diff(snapshot, entries)
            for (let index = 0; index < removedEntries.length; index++) {
                if (removedEntries[index].isFile) {
                    events.push({ _id: randomId(), kind: 'remove', entry: removedEntries[index] })
                }
            }
            for (let index = 0; index < addedEntries.length; index++) {
                if (addedEntries[index].isFile) {
                    events.push({ _id: randomId(), kind: 'create', entry: addedEntries[index] })
                }
            }
        }
    
        async function handleEvent(event: FsEvent) {
            if (event.paths.length === 1) {
                const path = event.paths[0]
                const entry = contents.find(
                    content => content.path === join(options.source, format(path))
                )

                if (isMac) {
                    const physicallyExists = options.fs.existsSync(normalize(path))
                    // File saves on MacOS emit 'create' events for whatever reason
                    if (event.kind === 'create' && entry && physicallyExists) event.kind = 'modify'
                }
                
                if (event.kind === 'create') {
                    try {
                        const { isFile, isDirectory, isSymlink } = options.fs.lstatSync(path)
                        const entry = {
                            path: join(options.source, format(path)),
                            name: normalize(path).replace(/^.*[\\\/]/, ''),
                            isFile,
                            isDirectory,
                            isSymlink
                        }
                        if (isFile) {
                            contents.push(entry)
                            events.push({ _id: randomId(), kind: event.kind as any, entry })
                        }
                        else if (isDirectory) {
                            refreshSource()
                        }
                    } catch(e) {
                        refreshSource()
                    }
                }
                if (event.kind === 'modify') {
                    if (entry?.isFile) {
                        if (options.fs.existsSync(normalize(entry.path))) {
                            events.push({ _id: randomId(), kind: event.kind, entry })
                        }
                        else {
                            refreshSource()
                        }
                    }
                    if (entry?.isDirectory) {
                        refreshSource()
                    }
                }
                if (event.kind === 'remove') {
                    if (entry?.isFile) {
                        contents = contents.filter(
                            content => content.path !== join(options.source, format(path))
                        )
                        events.push({ _id: randomId(), kind: event.kind, entry })
                    }
                    if (entry?.isDirectory) {
                        refreshSource()
                    }
                }
            }
        }

        const handledIds: string[] = []
        const intervalId = setInterval(() => {
            if (events.length > 0) {
                const snapshot = [...events]
                const set = snapshot.filter(
                    (e: WatchEvent, i) => events.findIndex(
                        (a: WatchEvent) => a.kind === e.kind && a.entry.path === e.entry.path
                    ) === i
                )
                events = events.filter(el => !snapshot.map(el => el._id).includes(el._id))
                for (let index = 0; index < set.length; index++) {
                    const event = set[index]
                    if (!handledIds.includes(event._id)) handledIds.push(event._id) && iterator.push(event)
                }
            }
        }, 200);

        async function notifyStart() {
            const { isFile, isDirectory, isSymlink } = options.fs.lstatSync(options.source)
            events.push({
                _id: randomId(),
                kind: "watch",
                entry: {
                    path: normalize(options.source),
                    name: normalize(options.source),
                    isFile, isDirectory, isSymlink
                }
            })
        }
    
        (async () => {
            contents = toArraySync<WalkEntry>(srcIterator)
            await notifyStart()
            for await (const event of watcher) {
                await handleEvent(event)
            }
        })()
    
        return () => {
            clearInterval(intervalId);
            (watcher as any).return();
        };
    }, options.fs)
}