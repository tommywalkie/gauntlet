import { exists, walk } from '../imports/std.ts'

export const fs = {
    cwd: () => Deno.cwd(),
    watch: Deno.watchFs,
    walk,
    exists,
    lstat: Deno.lstat,
    readFile: Deno.readFile
}

export { fs as denoFs }