import { existsSync, walkSync } from '../imports/std.ts'
import { FileSystemLike } from './core/types.ts'

export const fs: FileSystemLike = {
    cwd: () => Deno.cwd(),
    watch: Deno.watchFs,
    walkSync,
    existsSync,
    lstatSync: Deno.lstatSync,
    readFile: Deno.readFile
}

export { fs as denoFs }