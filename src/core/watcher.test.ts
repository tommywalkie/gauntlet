import { expect, it } from '../../imports/expect.ts'
import { denoFs } from '../fs.ts'
import { watchFs } from './watcher.ts'
import { join } from '../../imports/path.ts'

const DELAY = 2500

it('should be able to run and pause a watcher', async () => {
    const watcher = watchFs({ source: './', fs: denoFs });
    setTimeout(() => (watcher as any).return(), 300);
    for await (const _ of watcher) {}
    expect(true).toBeTruthy()
})

it('should be able to track newly added files', async () => {
    const tempDirName = join(Deno.cwd(), "/foo")
    try { Deno.removeSync(tempDirName, { recursive: true }) } catch(e) {}
    Deno.mkdirSync(tempDirName, { recursive: true })
    const watcher = watchFs({ source: "./foo", fs: denoFs })
    const occuredEvents: any[] = []

    setTimeout(() => (watcher as any).return(), DELAY)

    for await (const event of watcher) {
        occuredEvents.push(event)
        if (event.kind === 'watch') {
            Deno.writeTextFileSync(join(tempDirName, "/A.txt"), "Hello world")
        }
    }

    expect(occuredEvents.length).toBe(3)
    expect(occuredEvents[0].kind).toBe('watch')
    expect(occuredEvents[1].kind).toBe('create')
    expect(occuredEvents[1].entry.name).toBe('A.txt');
    expect(occuredEvents[2].kind).toBe('modify')
    expect(occuredEvents[2].entry.name).toBe('A.txt');
    Deno.removeSync(tempDirName, { recursive: true })
})

it('should be able to track file saves', async () => {
    const tempDirName = join(Deno.cwd(), "/foo")
    try { Deno.removeSync(tempDirName, { recursive: true }) } catch(e) {}
    Deno.mkdirSync(tempDirName, { recursive: true })
    const watcher = watchFs({ source: "./foo", fs: denoFs })
    
    const occuredEvents = []

    // @ts-ignore
    setTimeout(() => watcher.return(), DELAY)

    // Launch the watcher and record events
    for await (const event of watcher) {
        occuredEvents.push(event)
        if (event.kind === 'watch') {
            Deno.writeTextFileSync(join(tempDirName, "/A.txt"), "Hello world\n")
        }
        if (occuredEvents.length === 2) {
            Deno.writeTextFileSync(join(tempDirName, "/A.txt"), "Lorem Ipsum\n");
        }
    }

    expect(occuredEvents.length).toBe(4)
    expect(occuredEvents[0].kind).toBe('watch')
    expect(occuredEvents[1].kind).toBe('create')
    expect(occuredEvents[1].entry.name).toBe('A.txt')
    expect(occuredEvents[2].kind).toBe('modify')
    expect(occuredEvents[2].entry.name).toBe('A.txt')
    expect(occuredEvents[3].kind).toBe('modify')
    expect(occuredEvents[3].entry.name).toBe('A.txt')

    Deno.removeSync(tempDirName, { recursive: true })
})

it('should be able to track file renames via Deno.rename()', async () => {
    const tempDirName = join(Deno.cwd(), "/foo")
    try { Deno.removeSync(tempDirName, { recursive: true }) } catch(e) {}
    Deno.mkdirSync(tempDirName, { recursive: true })
    const watcher = watchFs({ source: "./foo", fs: denoFs })
    const occuredEvents = []

    setTimeout(() => (watcher as any).return(), DELAY)

    for await (const event of watcher) {
        occuredEvents.push(event)
        if (event.kind === 'watch') {
            Deno.writeTextFileSync(join(tempDirName, "/A.txt"), "Hello world\n")
        }
        if (occuredEvents.length === 3) {
            Deno.renameSync(join(tempDirName, "/A.txt"), join(tempDirName, "/B.txt"));
        }
    }

    expect(occuredEvents[0].kind).toBe('watch')
    expect(occuredEvents.filter(el => el.kind === 'create').length).toBe(2)
    expect(occuredEvents.filter(el => el.kind === 'remove').length).toBe(1)
    expect(occuredEvents.filter(el => el.kind === 'remove')[0].entry.name).toBe('A.txt')

    Deno.removeSync(tempDirName, { recursive: true })
})

it('should be able to track file renames via Visual Studio Code', async () => {
    const tempDirName = join(Deno.cwd(), "/foo")
    try { Deno.removeSync(tempDirName, { recursive: true }) } catch(e) {}
    Deno.mkdirSync(tempDirName, { recursive: true })
    const watcher = watchFs({ source: "./foo", fs: denoFs })
    const occuredEvents = []

    setTimeout(() => (watcher as any).return(), DELAY)

    for await (const event of watcher) {
        occuredEvents.push(event)
        if (event.kind === 'watch') {
            Deno.writeTextFileSync(join(tempDirName, "/A.txt"), "Hello world\n")
        }
        // For reference:
        // https://github.com/microsoft/vscode/blob/94c9ea46838a9a619aeafb7e8afd1170c967bb55/src/vs/workbench/contrib/files/common/explorerModel.ts#L158-L167
        if (occuredEvents.length === 3) {
            Deno.removeSync(join(tempDirName, "/A.txt"));
        }
        if (occuredEvents.length === 4) {
            Deno.writeTextFileSync(join(tempDirName, "/B.txt"), "Hello world\n");
        }
    }

    expect(occuredEvents[0].kind).toBe('watch')
    expect(occuredEvents.filter(el => el.kind === 'create').length).toBe(2)
    expect(occuredEvents.filter(el => el.kind === 'remove').length).toBe(1)
    expect(occuredEvents.filter(el => el.kind === 'remove')[0].entry.name).toBe('A.txt')

    Deno.removeSync(tempDirName, { recursive: true })
})

it('should be able to track non-empty folder deletions', async () => {
    const tempDirName = join(Deno.cwd(), "/foo")
    try { Deno.removeSync(tempDirName, { recursive: true }) } catch(e) {}
    Deno.mkdirSync(tempDirName, { recursive: true })
    const watcher = watchFs({ source: "./foo", fs: denoFs })
    const occuredEvents = []

    setTimeout(() => (watcher as any).return(), DELAY + 1000)

    for await (const event of watcher) {
        occuredEvents.push(event)
        if (event.kind === 'watch') {
            Deno.mkdirSync(join(tempDirName, "/bar/"), { recursive: true })
            Deno.writeTextFileSync(join(tempDirName, "/bar/A.txt"), "Hello world\n")
            Deno.writeTextFileSync(join(tempDirName, "/bar/B.txt"), "Hello world\n")
        }
        if (occuredEvents.length === 5) {
            Deno.removeSync(join(tempDirName, "/bar/"), { recursive: true });
        }
    }

    expect(occuredEvents.length).toBe(7)
    expect(occuredEvents[0].kind).toBe('watch')
    expect(occuredEvents[1].kind).toBe('create')
    expect(occuredEvents[2].kind).toBe('create')
    expect(occuredEvents[3].kind).toBe('modify')
    expect(occuredEvents[4].kind).toBe('modify')
    expect(occuredEvents[5].kind).toBe('remove')
    expect(occuredEvents[6].kind).toBe('remove')

    Deno.removeSync(tempDirName, { recursive: true })
})

it('should be able to track non-empty folder renames', async () => {
    const tempDirName = join(Deno.cwd(), "/foo")
    try { Deno.removeSync(tempDirName, { recursive: true }) } catch(e) {}
    Deno.mkdirSync(tempDirName, { recursive: true })
    const watcher = watchFs({ source: "./foo", fs: denoFs })
    const occuredEvents = []

    setTimeout(() => (watcher as any).return(), DELAY + 1000)

    for await (const event of watcher) {
        occuredEvents.push(event)
        if (event.kind === 'watch') {
            Deno.mkdirSync(join(tempDirName, "/bar/"), { recursive: true })
            Deno.writeTextFileSync(join(tempDirName, "/bar/A.txt"), "Hello world\n")
            Deno.writeTextFileSync(join(tempDirName, "/bar/B.txt"), "Hello world\n")
        }
        if (occuredEvents.length === 5) {
            Deno.renameSync(join(tempDirName, "/bar/"), join(tempDirName, "/rab/"));
        }
    }

    expect(occuredEvents.length).toBe(9)
    expect(occuredEvents[0].kind).toBe('watch')
    expect(occuredEvents[1].kind).toBe('create')
    expect(occuredEvents[2].kind).toBe('create')
    expect(occuredEvents[3].kind).toBe('modify')
    expect(occuredEvents[4].kind).toBe('modify')
    expect(occuredEvents[5].kind).toBe('remove')
    expect(occuredEvents[6].kind).toBe('remove')
    expect(occuredEvents[7].kind).toBe('create')
    expect(occuredEvents[8].kind).toBe('create')

    Deno.removeSync(tempDirName, { recursive: true })
})