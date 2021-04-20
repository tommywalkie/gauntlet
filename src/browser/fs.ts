import { FileSystem, WalkEntry } from "../core/fs.ts"

export interface BrowserFileSystem extends FileSystem {
    create(path: string): Promise<WalkEntry>,
    remove(path: string): Promise<void>,
    rename(oldpath: string, newpath: string): Promise<void>,
    write(path: string, data: string): Promise<void>,
    mkdir(path: string): Promise<void>
}

/**
 * **NOT IMPLEMENTED YET**
 * 
 * Creates a virtual file system which can be used by Gauntlet
 * inside browsers
 */
export function createFileSystem(): BrowserFileSystem | any {
    let files: WalkEntry[] = []
    return {
        cwd: '~',
        exists: async (filePath: string) => true,
        lstat: async (filePath: string) => {},
        normalize: (str: string) => str,
        walk: () => {},
        watch: () => {},
    }
}