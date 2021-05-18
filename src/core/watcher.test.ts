import { expect, it } from '../../imports/expect.ts'
import { moveSync, copySync } from '../../imports/std.ts'
import { join } from '../../imports/path.ts'
import { DenoFileSystem as fs } from '../utils.ts'
import { FileWatcher, watchFs } from './watcher.ts'
import { randomId } from './utils.ts'
import { WatchEvent } from './types.ts'

try { Deno.removeSync(join(Deno.cwd(), '__TEST__'), { recursive: true }) } catch (_) {}
Deno.mkdirSync(join(Deno.cwd(), '__TEST__'), { recursive: true })

async function track(
    fn: (path: string) => void,
    timeout?: number
): Promise<{ events: Array<WatchEvent>, watcher: FileWatcher<WatchEvent> }> {
    const source = join(Deno.cwd(), './__TEST__', `./${randomId()}`)
    Deno.mkdirSync(source, { recursive: true })
    const watcher = watchFs({ source, fs })
    setTimeout(() => (watcher as any).return(), timeout ?? 1700)
    setTimeout(() => fn(source), 400)
    const events = []
    for await (const event of watcher) {
        events.push(event)
    }
    return {events, watcher}
}

it('should be able to run and pause a watcher', async () => {
    const watcher = watchFs({ source: './', fs });
    setTimeout(() => (watcher as any).return(), 300);
    for await (const _ of watcher) {}
    expect(true).toBeTruthy()
})

it('should be able to track newly added files', async () => {
    const {events} = await track((path: string) => {
        Deno.writeTextFileSync(join(path, "A.txt"), "Hello world")
    })
    expect(events[0].kind).toBe('watch')
    expect(events.length).toBeGreaterThanOrEqual(1)
})

it('should be able to track file saves', async () => {
    const {events} = await track((path: string) => {
        Deno.writeTextFileSync(join(path, "A.txt"), "Hello world\n")
        Deno.writeTextFileSync(join(path, "A.txt"), "Lorem ipsum\n")
    })
    // console.log(events)
    expect(events[0].kind).toBe('watch')
    expect(events.length).toBeGreaterThanOrEqual(1)
})

it('should be able to track copied files', async () => {
    const {events} = await track((path: string) => {
        Deno.writeTextFileSync(join(path, 'A.txt'), 'Hello world')
        Deno.copyFileSync(join(path, 'A.txt'), join(path, 'B.txt'))
    })
    // console.log(events)
    expect(events.length).toBeGreaterThanOrEqual(1)
})

it('should be able to track copied non-empty folders', async () => {
    const {events} = await track((path: string) => {
        Deno.mkdirSync(join(path, 'foo'), { recursive: true })
        Deno.writeTextFileSync(join(path, 'foo', 'A.txt'), 'Hello world')
        copySync(join(path, 'foo'), join(path, 'bar'))
    })
    // console.log(events)
    expect(events.length).toBeGreaterThanOrEqual(1)
})

it('should be able to track copied non-empty folders from outside the watching scope', async () => {
    const unwatchedPath = join(Deno.cwd(), `./__TEST__/${randomId()}`)
    Deno.mkdirSync(unwatchedPath, { recursive: true })
    Deno.writeTextFileSync(join(unwatchedPath, 'A.txt'), 'Hello world')
    const {events} = await track((path: string) => {
        copySync(unwatchedPath, join(path, 'foo'), { overwrite: true })
    })
    // console.log(events)
    expect(events.length).toBeGreaterThanOrEqual(1)
})

it('should be able to track renamed files', async () => {
    const {events} = await track((path: string) => {
        Deno.writeTextFileSync(join(path, 'A.txt'), 'Hello world')
        setTimeout(() => Deno.renameSync(join(path, 'A.txt'), join(path, 'B.txt')), 800)
    })
    // console.log(events)
    expect(events.length).toBeGreaterThanOrEqual(1)
})

it('should be able to track renamed non-empty folders', async () => {
    const {events} = await track((path: string) => {
        Deno.mkdirSync(join(path, 'foo'), { recursive: true })
        Deno.writeTextFileSync(join(path, 'foo', 'A.txt'), 'Hello world')
        setTimeout(() => Deno.renameSync(join(path, 'foo'), join(path, 'bar')), 800)
    })
    // console.log(events)
    expect(events.length).toBeGreaterThanOrEqual(1)
})

it('should be able to track removed files', async () => {
    const {events} = await track((path: string) => {
        Deno.writeTextFileSync(join(path, 'A.txt'), 'Hello world')
        setTimeout(() => Deno.removeSync(join(path, 'A.txt'), { recursive: true }), 800)
    })
    // console.log(events)
    expect(events.length).toBeGreaterThanOrEqual(1)
})

it('should be able to track removed non-empty folders', async () => {
    const {events} = await track((path: string) => {
        Deno.mkdirSync(join(path, 'foo'), { recursive: true })
        Deno.writeTextFileSync(join(path, 'foo/A.txt'), 'Hello world')
        setTimeout(() => Deno.removeSync(join(path, 'foo'), { recursive: true }), 800)
    })
    // console.log(events)
    expect(events.length).toBeGreaterThanOrEqual(1)
})

it('should be able to track moved files', async () => {
    const {events} = await track((path: string) => {
        Deno.writeTextFileSync(join(path, 'A.txt'), 'Hello world')
        Deno.mkdirSync(join(path, 'foo'), { recursive: true })
        moveSync(join(path, 'A.txt'), join(path, 'foo', 'A.txt'), { overwrite: true })
    })
    // console.log(events)
    expect(events.length).toBeGreaterThanOrEqual(1)
})

it('should be able to track moved non-empty folders', async () => {
    const {events} = await track((path: string) => {
        Deno.mkdirSync(join(path, 'foo'), { recursive: true })
        Deno.writeTextFileSync(join(path, 'foo', 'A.txt'), 'Hello world')
        Deno.mkdirSync(join(path, 'bar'), { recursive: true })
        moveSync(join(path, 'foo'), join(path, 'bar', 'foo'), { overwrite: true })
    }, 2500)
    // console.log(events)
    expect(events.length).toBeGreaterThanOrEqual(1)
})

it('should be able to track moved non-empty folders from outside the watching scope', async () => {
    const unwatchedPath = join(Deno.cwd(), `./__TEST__/${randomId()}`)
    Deno.mkdirSync(unwatchedPath, { recursive: true })
    Deno.writeTextFileSync(join(unwatchedPath, 'A.txt'), 'Hello world')
    const {events} = await track((path: string) => {
        Deno.mkdirSync(join(path, 'foo'), { recursive: true })
        moveSync(unwatchedPath, join(path, 'foo'), { overwrite: true })
    }, 2500)
    // console.log(events)
    expect(events.length).toBeGreaterThanOrEqual(1)
})