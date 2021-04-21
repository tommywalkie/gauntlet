import type { DenoManifest } from './imports/deno_run.ts'

export const manifest: DenoManifest = {
    name: 'gauntlet',
    version: '0.0.2',
    entry: 'mod.ts',
    unstable: true,
    permissions: {
        env: true, // ESBuild needs this to get ESBUILD_BINARY_PATH
        net: true,
        read: true,
        write: true,
        run: true
    }
}

export default manifest