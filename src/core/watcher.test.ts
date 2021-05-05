import { expect, it } from '../../imports/expect.ts'
import { createVirtualFileSystem } from './fs.ts'
import { watch } from './watcher.ts'

it('should be able to run and pause a Deno.watchFs watcher', async () => {
    const watcher = Deno.watchFs("/");
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

