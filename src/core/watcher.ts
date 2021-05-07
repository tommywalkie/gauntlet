import { AsyncPushIterator } from '../../imports/graphqlade.ts'
import { join, normalize } from '../../imports/path.ts'
import { getOS, toArray, randomId } from './utils.ts'
import type { FsEvent, WalkEntry } from './fs.ts'
import type { WatchEvent, WatcherOptions } from './types.ts'

export function watchFs(options: WatcherOptions): AsyncIterableIterator<WatchEvent> {
    const isMac = getOS() === 'darwin'
    return new AsyncPushIterator<WatchEvent>((iterator) => {
        let events: Array<WatchEvent & { _id: string }> = []
        const watcher = options.fs.watch(join(options.fs.cwd(), options.source))
        const srcIterator: AsyncIterableIterator<WalkEntry> = options.fs.walk(options.source)
        let contents: WalkEntry[] = []

        function format(str: string) {
            return normalize(str).substring(join(options.fs.cwd(), options.source).length + 1)
        }
    
        function diff(a: WalkEntry[], b: WalkEntry[]) {
            return a.filter(item1 => !b.some(item2 => (item2.path === item1.path)))
        }

        async function refreshSource() {
            const snapshot = [...new Set([...contents])]
            const srcIterator = options.fs.walk(options.source)
            const entries = await toArray<WalkEntry>(srcIterator)
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
            if (isMac) console.log(event)
            if (event.paths.length === 1) {
                const path = event.paths[0]
                const entry = contents.find(
                    content => {
                        if (isMac) console.log(content.path, join(options.source, format(path)))
                        return content.path === join(options.source, format(path))
                    }
                )
                if (isMac) {
                    const physicallyExists = await options.fs.exists(normalize(path))
                    if (entry && physicallyExists) event.kind = 'modify'
                    if (!physicallyExists) event.kind = 'remove'
                }
                if (event.kind === 'create') {
                    await options.fs.lstat(path).then(
                        async ({ isFile, isDirectory, isSymlink }) => {
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
                                // Just in case folder file events happen before the one for the folder
                                setTimeout(async() => await refreshSource(), 1200)
                            }
                        }
                    ).catch(async () => {
                        setTimeout(async() => await refreshSource(), 1200)
                    })
                }
                if (event.kind === 'remove' || event.kind === 'modify') {
                    if (entry?.isFile) {
                        if (event.kind === 'remove') {
                            contents = contents.filter(
                                content => content.path !== join(options.source, format(path))
                            )
                            events.push({ _id: randomId(), kind: event.kind, entry })
                        }
                        else {
                            // A file rename can happen in two ways:
                            // - A direct metadata change (Deno.rename())
                            // - A removal/creation of a file (like VS Code, see:
                            // https://github.com/microsoft/vscode/blob/94c9ea46838a9a619aeafb7e8afd1170c967bb55/src/vs/workbench/contrib/files/common/explorerModel.ts#L158-L167)
                            //
                            // This means we need to track if the said file
                            // which fired a 'modify' event actually exists.
                            // If not, this is probably a move/rename, so we refresh the source
                            // to make sure about it.
                            if (await options.fs.exists(normalize(entry.path)))
                                events.push({ _id: randomId(), kind: event.kind, entry })
                            else setTimeout(async() => await refreshSource(), 1200)
                        }
                    }
                    if (entry?.isDirectory) {
                        // When renaming folders, at least on Windows, 3 'modify' events may fire:
                        // - One for the OLD NAMED folder
                        // - One for the NEWLY NAMED folder
                        // - One for the PARENT folder
                        // This is a workaround in order to de-duplicate events
                        setTimeout(async() => await refreshSource(), 1200)
                    }
                }
            }
        }

        const intervalId = setInterval(() => {
            if (events.length > 0) {
                for (let index = 0; index < events.length; index++) {
                    const event = events[index]
                    events = events.filter(el => el._id !== event._id)
                    iterator.push(event)
                }
            }
        }, 50);

        async function notifyStart() {
            const { isFile, isDirectory, isSymlink } = await options.fs.lstat(options.source)
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
            contents = await toArray<WalkEntry>(srcIterator)
            
            // This is meant to de-duplicate ReadDirectoryChangesW events
            const cache: Map<string, number> = new Map()
            async function updateCache(event: FsEvent) {
                cache.set(event.paths.toString(), Date.now() + 100)
                await handleEvent(event)
            }

            await notifyStart()

            for await (const event of watcher) {
                const entry = cache.get(event.paths.toString())
                if (entry) {
                    if (Date.now() > entry) await updateCache(event)
                }
                else updateCache(event)
            }
        })()
    
        return () => {
            clearInterval(intervalId);
            // Both the hereby watcher and the wrapped file watcher (options.fs.watch)
            // shall be terminated. Otherwise, async ops may leak and Deno test will fail.
            (watcher as any).return();
        };
    })
}