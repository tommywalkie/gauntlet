import {
    Application,
    ApplicationListenEvent,
    ApplicationErrorEvent,
    Context
} from '../imports/oak.ts'
import * as esbuild from '../imports/esbuild.ts'
import { EventEmitter } from '../imports/deno_events.ts'
import { watchFs } from './core/watcher.ts'
import { createVirtualFileSystem } from './core/fs.ts'
import { denoFs } from './fs.ts'
import type { Gauntlet } from './types.ts'

export interface DevServerOptions {
    port: number
    mounts: string[]
    eventSource?: EventEmitter<Gauntlet.Events>
}

function terminate(eventSource: EventEmitter<Gauntlet.Events>) {
    eventSource.emit('debug', 'Intercepted SIGINT signal')
    esbuild.stop()
    eventSource.emit('debug', 'Gracefully stopped the ESBuild service')
    eventSource.emit('terminate')
    Deno.exit()
}

/**
 * Gracefully stops the Deno process while stopping
 * the running ESBuild service.
 */
async function gracefulExit(
    eventSource: EventEmitter<Gauntlet.Events>
) {
    // Deno.signal is not yet implemented on Windows.
    // https://github.com/denoland/deno/issues/9995
    if (Deno.build.os === 'windows') {
        const { setHandler } = await import('../imports/ctrlc.ts')
        const _ = setHandler(() => terminate(eventSource))
        return
    }
    // Otherwise, if using UNIX, listen to Deno.signal
    for await (const _ of Deno.signal(Deno.Signal.SIGINT)) {
        terminate(eventSource)
    }
}

export async function runDevServer(options: DevServerOptions = {
    port: 8000,
    mounts: [ Deno.cwd() ],
}) {
    const eventSource = options.eventSource ?? new EventEmitter<Gauntlet.Events>()
    await esbuild.initialize({}).then(_ => eventSource.emit('debug', 'ESBuild service is ready'))
    const app = new Application()

    /* If you need to test virtual filesystem, simply use this */
    const vfs = createVirtualFileSystem()
    vfs.add('./src/A.txt', 'A')
    vfs.add('./src/B/C.txt', 'C')
    setTimeout(() => vfs.add('./src/A.txt', 'AA'), 4000)
    setTimeout(() => vfs.add('./src/B/C.txt', 'D'), 4500)
    setTimeout(() => vfs.add('./src/D.txt', 'D'), 5000)
    setTimeout(() => vfs.add('./src/E.txt', 'E'), 5200)
    setTimeout(() => vfs.add('./src/B/F.txt', 'F'), 5100)
    setTimeout(() => vfs.remove('./src/B'), 5400)
    setTimeout(() => vfs.remove('./src/E.txt'), 5900)
    setTimeout(() => vfs.add('./src/A.txt', 'AAA'), 6400)

    app.use(async (context: Context) => {
        context.response.body = "Hello world!";
    })

    app.addEventListener("listen", async (evt: ApplicationListenEvent) => {
        eventSource.emit("listen", evt)
        const watchers = options.mounts.map(async (mount) => {
            const watcher = watchFs({ source: mount, fs: denoFs })
            for await (const event of watcher) {
                eventSource.emit(event.kind, event.entry)
            }
        })
        // Run watchers and listen for SIGINT signals
        await Promise.all([...watchers, await gracefulExit(eventSource)])
    })

    app.addEventListener("error", async (evt: ApplicationErrorEvent<any, any>) => {
        eventSource.emit('error', 'Unexpected error encountered with Oak server')
        console.log(evt.error)
        esbuild.stop()
        eventSource.emit('debug', 'Gracefully stopped the ESBuild service')
        eventSource.emit('terminate')
        Deno.exit()
    })
    
    return await app.listen({ port: options.port })
}