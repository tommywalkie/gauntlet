import type { DenoManifest } from '../../imports/deno_run.ts'

export type SingleOrPair<T> = [T] | [T, T]

export type Input = boolean | string | number

export interface Context {
    commands: Array<Input>
    options: Record<string, Input>
    values: Array<Input>
}

export type Callback<T = any> = (props: CallbackProps) => Promise<T>

export interface CallbackProps extends Omit<Context, "commands"> {
    manifest: DenoManifest
    options: Record<string, Input>
    values: Array<Input>
    [key: string]: any
}

export interface Option {
    aliases: SingleOrPair<string>
    description: string
    defaultValue: string | boolean
}

export interface Flag extends Omit<Option, "defaultValue"> {
    defaultValue: boolean
}

export interface Command {
    alias: string
    description: string
    callback: Callback
    examples: string[]
}

export interface Program {
    command(alias: string, description: string, callback: Callback): this
    flag(aliases: SingleOrPair<string>, description: string): this
    option(aliases: SingleOrPair<string>, description: string, defaultValue: Input): this
    help(context: Context): void
    parse(args: string[]): Context
    fallback(callback: Callback): this
    run(): Promise<void>
}