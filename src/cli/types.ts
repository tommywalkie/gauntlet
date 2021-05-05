import type { DenoManifest } from '../../imports/deno_run.ts'

export type SingleOrPair<T> = [T] | [T, T]

export type ProgramInput = boolean | string | number

export interface ProgramContext {
    commands: Array<ProgramInput>
    options: Record<string, ProgramInput>
    values: Array<ProgramInput>
}

export type ProgramCallback<T = any> = (props: ProgramCallbackProps) => Promise<T>

export interface ProgramCallbackProps extends Omit<ProgramContext, "commands"> {
    manifest: DenoManifest
    options: Record<string, ProgramInput>
    values: Array<ProgramInput>
    [key: string]: any
}

export interface ProgramOption {
    aliases: SingleOrPair<string>
    description: string
    defaultValue: string | boolean
}

export interface ProgramFlag extends Omit<ProgramOption, "defaultValue"> {
    defaultValue: boolean
}

export interface ProgramCommand {
    alias: string
    description: string
    callback: ProgramCallback
    examples: string[]
}

export interface Program {
    command(alias: string, description: string, callback: ProgramCallback): Program
    flag(aliases: SingleOrPair<string>, description: string): Program
    option(aliases: SingleOrPair<string>, description: string, defaultValue: ProgramInput): Program
    help(context: ProgramContext): void
    parse(args: string[]): ProgramContext
    fallback(callback: ProgramCallback): Program
    run(): Promise<void>
}