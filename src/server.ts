import {
    Application,
    ApplicationListenEvent,
    ApplicationErrorEvent,
    Context,
    send
} from '../imports/oak.ts'
import { setHandler, Disposable } from '../imports/ctrlc.ts'
import * as esbuild from '../imports/esbuild.ts'
import { EventEmitter } from '../imports/deno_events.ts'
import { normalize } from 'https://deno.land/std@0.93.0/path/mod.ts'
import { exists, walk } from 'https://deno.land/std@0.93.0/fs/mod.ts'
import { register } from './core/watcher.ts'
import type { FsEvents } from './core/watcher.ts'
import type { LogEvents } from './core/events.ts'

export interface TsundereEvents extends LogEvents, FsEvents {
    listen(evt: ApplicationListenEvent): void
    terminate(): void
}

export interface DevServerOptions {
    port: number
    mounts: string[]
    eventSource?: EventEmitter<TsundereEvents>
}

function terminate(eventSource: EventEmitter<TsundereEvents>) {
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
    eventSource: EventEmitter<TsundereEvents>
) {
    // Deno.signal is not yet implemented on Windows.
    // https://github.com/denoland/deno/issues/9995
    if (Deno.build.os === 'windows') {
        const _: Disposable = setHandler(() => terminate(eventSource))
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
    const eventSource = options.eventSource ?? new EventEmitter<TsundereEvents>()
    // await esbuild.initialize({}).then(_ => eventSource.emit('debug', 'ESBuild service is ready'))
    const app = new Application()

    app.use(async (context: Context) => {
        await send(context, context.request.url.pathname, {
            root: `${Deno.cwd()}/public`,
            index: "index.html",
        })
    })

    app.addEventListener("listen", async (evt: ApplicationListenEvent) => {
        eventSource.emit("listen", evt)
        const watchers = register({
            mounts: options.mounts,
            eventSource,
            fs: {
                cwd: Deno.cwd(),
                watch: Deno.watchFs,
                walk,
                exists,
                normalize,
                lstat: Deno.lstat
            }
        })
        // Run watchers and listen for SIGINT signals
        await Promise.all([...watchers, await gracefulExit(eventSource)])
    })

    app.addEventListener("error", async (evt: ApplicationErrorEvent<any>) => {
        eventSource.emit('error', 'Unexpected error encountered with Oak server')
        console.log(evt.error)
        esbuild.stop()
        eventSource.emit('debug', 'Gracefully stopped the ESBuild service')
        eventSource.emit('terminate')
        Deno.exit()
    })
    
    return await app.listen({ port: options.port })
}