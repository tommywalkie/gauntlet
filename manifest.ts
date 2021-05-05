import type { DenoManifest } from './imports/deno_run.ts'

export const manifest: DenoManifest = {
    name: 'gauntlet',
    version: '0.0.3',
    entry: 'mod.ts',
    unstable: true,  // Allows Gauntlet to listen to SIGINT events and file changes
    permissions: {
        env: true,   // Allows ESBuild to get ESBUILD_BINARY_PATH
        net: true,   // Allows ESBuild to fetch/install its own runtime
        read: true,  // Allows Gauntlet to read physical files
        write: true, // Allows Gauntlet to output transpiled contents
        run: true    // Allows ESBuild to run its own command line tool
    },
    metadata: {
        author: 'Tom Bazarnik <tommywalkie@gmail.com>',
        repository: 'https://github.com/tommywalkie/gauntlet',
    }
}

export default manifest