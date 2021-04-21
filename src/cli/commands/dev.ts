import { runDevServer } from '../../server.ts'
import { defaultEmitter } from '../../emitter.ts'
import * as esbuild from '../../../imports/esbuild.ts'
import type { ProgramCallbackProps } from '../types.ts'

export async function dev(props: ProgramCallbackProps) {
    try {
        await runDevServer({
            port: 8000,
            eventSource: defaultEmitter,
            mounts: [ './' ]
        })
    }
    catch (error: any) {
        esbuild.stop()
        defaultEmitter.emit('debug', 'Gracefully stopped the ESBuild service')
        defaultEmitter.emit('fatal', error.message ?? 'Unhandled error encountered:')
        console.error(error)
        defaultEmitter.emit('terminate')
    }
}