import { expect, it } from '../../imports/expect.ts'
import { createVirtualFileSystem } from './fs.ts'
import { denoFs } from '../fs.ts'
import { watchFs } from './watcher.ts'
import { join, dirname, normalize } from '../../imports/path.ts'

it('should be able to run and pause a Deno.watchFs watcher', async () => {
    const watcher = Deno.watchFs("./");
    setTimeout(() => { (watcher as any).return(); }, 300);
    for await (const _ of watcher) {}
    expect(true).toBeTruthy()
})

it('should be able to run and pause an AsyncPushIterator watcher', async () => {
    const fs = createVirtualFileSystem()
    const watcher = fs.watch("/");
    setTimeout(() => { (watcher as any).return(); }, 300);
    for await (const _ of watcher) {}
    expect(true).toBeTruthy()
})

it('should be able to run and pause a Gauntlet watcher', async () => {
    const watcher = watchFs({ source: './', fs: denoFs });
    setTimeout(() => (watcher as any).return(), 300);
    for await (const _ of watcher) {}
    expect(true).toBeTruthy()
})

it('should be able to detect newly added files', async () => {
    const tempDirName = join(Deno.cwd(), "/foo")
    await Deno.mkdir(tempDirName, { recursive: true })
    const watcher = watchFs({ source: "./foo", fs: denoFs })

    // Make sure to put a highly enough value to make sure FS ops can be done before
    // the watcher is terminated. Otherwise async ops may leak.
    // Remember that Deno kills any test process even if some promise is still pending.
    setTimeout(() => { (watcher as any).return(); }, 2000)

    const file0 = join(tempDirName, "/A/B.txt")
    const file1 = join(tempDirName, "/C.txt")
    const encoder = new TextEncoder();
    const data = encoder.encode("Hello world\n");

    setTimeout(async () => {
        await Deno.mkdir(dirname(file0), { recursive: true })
        await Deno.writeFile(file0, data)
    }, 120)

    setTimeout(async () => {
        await Deno.mkdir(dirname(file1), { recursive: true })
        await Deno.writeFile(file1, data)
    }, 240)

    // Launch the watcher and record events
    const occuredEvents = []
    for await (const event of watcher) {
        occuredEvents.push(event)
    }

    // Clean up the temp dir
    await Deno.remove(tempDirName, { recursive: true })

    expect(occuredEvents.length).toBe(3)
    expect(occuredEvents[0].kind).toBe('watch')
    expect(occuredEvents[1].kind).toBe('create')
    expect(occuredEvents[1].entry.name).toBe('B.txt')
    expect(occuredEvents[1].kind).toBe('create')
    expect(occuredEvents[2].entry.name).toBe('C.txt')
    expect(occuredEvents[2].kind).toBe('create')
})

it('should be able to detect file saves', async () => {
    const tempDirName = join(Deno.cwd(), "/foo")
    await Deno.mkdir(tempDirName, { recursive: true })
    const watcher = watchFs({ source: "./foo", fs: denoFs })

    // Make sure to put a highly enough value to make sure FS ops can be done before
    // the watcher is terminated. Otherwise async ops may leak.
    // Remember that Deno kills any test process even if some promise is still pending.
    setTimeout(() => { (watcher as any).return(); }, 2500)

    const file0 = join(tempDirName, "/A.txt")
    const encoder = new TextEncoder();
    const data0 = encoder.encode("Hello world\n");
    const data1 = encoder.encode("Foo\n");
    const data2 = encoder.encode("Bar\n");

    await Deno.writeFile(file0, data0)

    setTimeout(async () => {
        await Deno.writeFile(file0, data1)
    }, 240)

    setTimeout(async () => {
        await Deno.writeFile(file0, data2)
    }, 520)

    // Launch the watcher and record events
    const occuredEvents = []
    for await (const event of watcher) {
        occuredEvents.push(event)
    }

    // Clean up the temp dir
    await Deno.remove(tempDirName, { recursive: true })

    expect(occuredEvents.length).toBe(3)
    expect(occuredEvents[0].kind).toBe('watch')
    expect(occuredEvents[1].kind).toBe('modify')
    expect(occuredEvents[1].entry.name).toBe('A.txt')
    expect(occuredEvents[2].kind).toBe('modify')
    expect(occuredEvents[2].entry.name).toBe('A.txt')
})

it('should be able to track renames via Deno.rename()', async () => {
    const tempDirName = join(Deno.cwd(), "/foo")
    await Deno.mkdir(tempDirName, { recursive: true })
    const watcher = watchFs({ source: "./foo", fs: denoFs })

    // Make sure to put a highly enough value to make sure FS ops can be done before
    // the watcher is terminated. Otherwise async ops may leak.
    // Remember that Deno kills any test process even if some promise is still pending.
    setTimeout(() => { (watcher as any).return(); }, 2600)

    const file0 = join(tempDirName, "/A.txt")
    const file1 = join(tempDirName, "/B.txt")
    const encoder = new TextEncoder();
    const data0 = encoder.encode("Hello world\n");

    await Deno.writeFile(file0, data0)

    // Deno.rename() behavior
    setTimeout(async () => {
        await Deno.rename(file0, file1)
    }, 240)

    // Launch the watcher and record events
    const occuredEvents = []
    for await (const event of watcher) {
        occuredEvents.push(event)
    }

    // Clean up the temp dir
    await Deno.remove(tempDirName, { recursive: true })

    expect(occuredEvents.length).toBe(3)
    expect(occuredEvents[0].kind).toBe('watch')
    expect(occuredEvents[1].kind).toBe('remove')
    expect(occuredEvents[1].entry.name).toBe('A.txt')
    expect(occuredEvents[2].kind).toBe('create')
    expect(occuredEvents[2].entry.name).toBe('B.txt')
})

// cf: https://github.com/microsoft/vscode/blob/94c9ea46838a9a619aeafb7e8afd1170c967bb55/src/vs/workbench/contrib/files/common/explorerModel.ts#L158-L167
it('should be able to track renames via Visual Studio Code', async () => {
    const tempDirName = join(Deno.cwd(), "/foo")
    await Deno.mkdir(tempDirName, { recursive: true })
    const watcher = watchFs({ source: "./foo", fs: denoFs })

    // Make sure to put a highly enough value to make sure FS ops can be done before
    // the watcher is terminated. Otherwise async ops may leak.
    // Remember that Deno kills any test process even if some promise is still pending.
    setTimeout(() => { (watcher as any).return(); }, 2600)

    const file0 = join(tempDirName, "/A.txt")
    const file1 = join(tempDirName, "/B.txt")
    const encoder = new TextEncoder();
    const data0 = encoder.encode("Hello world\n");

    await Deno.writeFile(file0, data0)

    // Deno.rename() behavior
    setTimeout(async () => {
        await Deno.remove(file0)
        await Deno.writeFile(file1, data0)
    }, 240)

    // Launch the watcher and record events
    const occuredEvents = []
    for await (const event of watcher) {
        occuredEvents.push(event)
    }

    // Clean up the temp dir
    await Deno.remove(tempDirName, { recursive: true })

    expect(occuredEvents.length).toBe(3)
    expect(occuredEvents[0].kind).toBe('watch')
    expect(occuredEvents[1].kind).toBe('remove')
    expect(occuredEvents[1].entry.name).toBe('A.txt')
    expect(occuredEvents[2].kind).toBe('create')
    expect(occuredEvents[2].entry.name).toBe('B.txt')
})
