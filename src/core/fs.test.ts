import { expect, it } from '../../imports/expect.ts'
import { createVirtualFileSystem } from './fs.ts'

it('should be able to create a virtual filesystem', async () => {
    const fs = createVirtualFileSystem()
    expect(fs.getRoot().length).toBe(0)
    fs.add('/hello.txt', 'world')
    expect(fs.getRoot().length).toBe(1)
})

it('should be able to walk a virtual filesystem', async () => {
    const fs = createVirtualFileSystem()
    fs.add('/A.txt', 'A')
    fs.add('/B.txt', 'B')
    fs.add('/C')
    fs.add('/C/D.txt', 'D')
    const entries = []
    for await (const entry of fs.walk('/')) {
        entries.push(entry)
    }
    const result = entries.map(el => el.path).join('-')
    expect(result).toBe('/A.txt-/B.txt-/C-/C/D.txt')
})

it('should be able to get stats in a virtual filesystem', async () => {
    const fs = createVirtualFileSystem()
    fs.add('/foo/bar.txt', 42)
    const bar = await fs.lstat('/foo/bar.txt')
    expect(bar.isFile).toBeTruthy()
    expect(bar.isDirectory).toBeFalsy()
    const foo = await fs.lstat('/foo')
    expect(foo.isFile).toBeFalsy()
    expect(foo.isDirectory).toBeTruthy()
})

it('should be able to check presence in a virtual filesystem', async () => {
    const fs = createVirtualFileSystem()
    fs.add('/A.txt', 'A')
    fs.add('/B.txt', 'B')
    fs.add('/C')
    fs.add('/C/D.txt', 'D')
    expect(await fs.exists('/A.txt')).toBeTruthy()
    expect(await fs.exists('/E.txt')).toBeFalsy()
})