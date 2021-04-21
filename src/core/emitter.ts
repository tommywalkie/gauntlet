import { EventEmitter } from '../../imports/deno_events.ts'
import { TsundereEvents } from '../server.ts'

/**
 * Generates and returns a blank type-safe `EventEmitter<TsundereEvents>` instance
 */
export function createBlankEmitter() {
    return new EventEmitter<TsundereEvents>()
}

/**
 * Generates and returns an platform-agnostic and type-safe `EventEmitter<TsundereEvents>`
 * instance with default bindings to the `Console` API.
 * 
 * ```typescript
 * emitter.on("debug", (message: string) => console.log(message))
 * emitter.on("info", (message: string) => console.log(message))
 * emitter.on("warn", (message: string) => console.log(message))
 * emitter.on("error", (message: string) => console.error(message))
 * emitter.on("fatal", (message: string) => console.error(message))
 * ```
 */
export function createDefaultEmitter() {
    return new EventEmitter<TsundereEvents>()
        .on("debug", (message: string) => console.log(message))
        .on("info", (message: string) => console.log(message))
        .on("warn", (message: string) => console.log(message))
        .on("error", (message: string) => console.error(message))
        .on("fatal", (message: string) => console.error(message))
}