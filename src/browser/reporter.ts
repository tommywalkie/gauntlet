import { EventEmitter } from '../../imports/deno_events.ts'
import { TsundereEvents } from '../server.ts'

const defaultEventSource = new EventEmitter<TsundereEvents>()

defaultEventSource.on("debug", (message: string) => {
    console.log(message)
})

defaultEventSource.on("info", (message: string) => {
    console.log(message)
})

defaultEventSource.on("warn", (message: string) => {
    console.warn(message)
})

defaultEventSource.on("error", (message: string) => {
    console.error(message)
})

defaultEventSource.on("fatal", (message: string) => {
    console.error(message)
})

export { defaultEventSource }