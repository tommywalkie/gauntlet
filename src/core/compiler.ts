import { WatchEvent } from "./types.ts";
import { FileWatcher } from "./watcher.ts";
import { toArraySync } from "./utils.ts";
import { EventEmitter } from '../../imports/deno_events.ts';
import { AsyncPushIterator, AsyncPushIteratorSetup } from "../../imports/graphqlade.ts";
import { isAbsolute, join } from "../../imports/path.ts";

export interface CompilerEvent {
    kind: string,
    details: any
}

export interface CompilerEntry {
    mount: string
    path: string
    input?: string
    output?: string
}

export class Compiler<T = CompilerEvent> extends AsyncPushIterator<T> {
    entries: Map<string, CompilerEntry> = new Map()
    plugins: any[] = []
    watchers: FileWatcher<WatchEvent>[] = []

    constructor(setup: (iterator: Compiler<T>) => void) {
        super(setup as AsyncPushIteratorSetup<T>)
    }
}

export interface CompilerOptions {
    watchers: FileWatcher<WatchEvent>[]
    eventSource?: EventEmitter<any>
    onError?: (err: Error) => void
}

function formatPathConflictErrorMessage(existingEntry: string, incomingEntry: string, filename: string) {
    const aLen = existingEntry.length
    const bLen = incomingEntry.length
    const maxLen = Math.max(aLen, bLen) + 1
    return `Entries from different mounts point to the same path.
    ${incomingEntry} ${new Array(maxLen - bLen).join('─')}──x───> ${filename}
    ${existingEntry} ${new Array(maxLen - aLen).join('─')}──┘`
}

export class PathConflictError extends Error {
    name = "PathConflictError"
    constructor(existingEntry: string, incomingEntry: string, filename: string) {
        super(formatPathConflictErrorMessage(existingEntry, incomingEntry, filename));
        Object.setPrototypeOf(this, PathConflictError.prototype)
    }
}

export function setupCompiler(options: CompilerOptions) {
    // Initial build attempt
    const initialMap = new Map()
    for (let index = 0; index < options.watchers.length; index++) {
        const watcher = options.watchers[index];
        const sourcePath = isAbsolute(watcher.mount) ? watcher.mount : join(watcher.fs.cwd(), watcher.mount)
        let contents = toArraySync(watcher.fs.walkSync(sourcePath))
        for (let index = 0; index < contents.length; index++) {
            const element = contents[index];
            if (element.isFile) {
                const key = element.path.substr(sourcePath.length + 1)
                const existingEntry = initialMap.get(key)
                if (existingEntry) {
                    throw new PathConflictError(
                        join(watcher.mount, key),
                        join(existingEntry.mount, key),
                        key
                    )
                }
                initialMap.set(key, { mount: watcher.mount, path: element.path })
            }
        }
    }

    function terminate(err: Error) {
        if (options.onError) options.onError(err)
    }

    // The actual compiler event iterator
    return new Compiler<CompilerEvent>((iterator: Compiler) => {
        iterator.entries = initialMap
        for (let index = 0; index < options.watchers.length; index++) {
            const watcher = options.watchers[index];
            const sourcePath = isAbsolute(watcher.mount) ? watcher.mount : join(watcher.fs.cwd(), watcher.mount)
            
            setTimeout(async () => {
                try {
                    for await (const event of watcher) {
                        if (options.eventSource) options.eventSource.emit(event.kind, event.entry)
                        if (event.kind === "modify") {
                            const key = event.entry.path.substr(sourcePath.length + 1)
                            iterator.entries.set(key, { mount: watcher.mount, path: event.entry.path })
                        }
                        if (event.kind === "create") {
                            const key = event.entry.path.substr(sourcePath.length + 1)
                            const existingEntry = iterator.entries.get(key)
                            if (existingEntry) {
                                terminate(new PathConflictError(
                                    join(watcher.mount, key),
                                    join(existingEntry.mount, key),
                                    key
                                ))
                            }
                            else {
                                iterator.entries.set(key, { mount: watcher.mount, path: event.entry.path })
                            }
                        }
                        if (event.kind === "remove") {
                            const key = event.entry.path.substr(sourcePath.length + 1)
                            iterator.entries.delete(key)
                        }
                        iterator.push({ kind: event.kind, details: event.entry })
                    }
                }
                catch (e) {
                    terminate(e)
                }
            })
        }
        return () => {
            for (let index = 0; index < options.watchers.length; index++) {
                const watcher = options.watchers[index];
                watcher.return()
            }
        };
    })
}