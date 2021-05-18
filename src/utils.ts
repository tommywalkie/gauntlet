import { existsSync, walkSync } from '../imports/std.ts'
import type { FileSystemLike } from './core/types.ts'

export const DenoFileSystem: FileSystemLike = {
    cwd: () => Deno.cwd(),
    existsSync,
    lstatSync: Deno.lstatSync,
    mkdirSync: Deno.mkdirSync,
    readFileSync: Deno.readFileSync,
    walkSync,
    watch: Deno.watchFs,
    writeFileSync: Deno.writeFileSync,
}