import { runDevServer } from '../../server.ts'
import { defaultEventSource } from '../../reporter.ts'
import * as esbuild from '../../../imports/esbuild.ts'
import type { ProgramCallbackProps } from '../types.ts'

export async function dev(props: ProgramCallbackProps) {
    console.log(props)
    try {
        await runDevServer({
            port: 8000,
            eventSource: defaultEventSource,
            mounts: [ './' ]
        })
    }
    catch (error: any) {
        esbuild.stop()
        defaultEventSource.emit('debug', 'Gracefully stopped the ESBuild service')
        defaultEventSource.emit('fatal', error.message ?? 'Unhandled error encountered:')
        console.error(error)
        defaultEventSource.emit('terminate')
    }
}