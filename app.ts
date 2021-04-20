/**
 * This is just a demo script for development purposes
 */

import { runDevServer } from './src/server.ts'
import { defaultEventSource } from './src/reporter.ts'
import * as esbuild from './imports/esbuild.ts'

(async function() {
    try {
        // Just in case ESBuild tries to load $HOME from Windows..
        if (Deno.build.os === 'windows')
            Deno.env.set("HOME", Deno.env.get('USERPROFILE') ?? Deno.cwd())
        await runDevServer({
            port: 8000,
            eventSource: defaultEventSource,
            mounts: [ './public' ]
        })
    }
    catch (error: any) {
        esbuild.stop()
        defaultEventSource.emit('debug', 'Gracefully stopped the ESBuild service')
        defaultEventSource.emit('fatal', error.message ?? 'Unhandled error encountered:')
        console.error(error)
        defaultEventSource.emit('terminate')
    }
})()
