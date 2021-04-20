export { Machine, interpret } from 'https://cdn.skypack.dev/xstate'

/**
 * Despite being available on `deno.land/x`, XState currently doesn't provide Deno compatible
 * typings (lacks of file extensions). As a workaround, we need
 * to explicitly register some parameters as optional, otherwise the type checker won't be happy.
 * 
 * Relevant thread: [davidkpiano/xstate#1625](https://github.com/davidkpiano/xstate/discussions/1625)
 */
declare module 'https://cdn.skypack.dev/xstate' {
    export function Machine(config: any, options?: any, initialContext?: any): any
    export function interpret(machine: any, options?: any): any
}