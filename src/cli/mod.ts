import type {
    ProgramInput,
    ProgramCommand,
    ProgramFlag,
    ProgramOption,
    SingleOrPair,
    ProgramCallback,
    ProgramContext
} from './types.ts'

import { manifest } from '../../manifest.ts'
import { docopt } from './docopt.ts'

export const FLAG_PATTERN: RegExp = /^\-\-?(?<flag>[a-zA-Z]+)$/
export const OPTION_PATTERN: RegExp = /^\-\-?(?<flag>[a-zA-Z]+)[\= ](?<value>[\w\\\/\:\.\,\@]+)$/

export function sanitizeValue(value: ProgramInput) {
    return value === 'true' ? true : value === 'false' ? false : value
}

export function uniques(a: Array<string>, b: string) {
    return a.includes(b) ? a : [...a, b]
}

function __aliases(collection: Record<string, any>): Array<string> {
    return [].concat(...Object.keys(collection)
        .map(key => (collection as any)[key].aliases))
        .reduce(uniques, [])
}

export class Program {
    commands: Array<ProgramCommand> = []
    flags: Record<string, ProgramFlag>[] = []
    options: Record<string, ProgramOption>[] = []
    private __fallback: ProgramCallback = 
        async(inputs: any) => this.help(inputs)
    flag(
        aliases: SingleOrPair<string>,
        description: string = ''
    ) {
        aliases.forEach((label: string) =>
            (this.flags as any)[label] =
                {aliases, description, defaultValue: false} as ProgramFlag)
        return this
    }
    option(
        aliases: SingleOrPair<string>,
        description: string = '',
        defaultValue: ProgramInput = false
    ) {
        aliases.forEach((label: string) =>
            (this.options as any)[label] =
                {aliases, description, defaultValue} as ProgramOption)
        return this
    }
    command(
        alias: string,
        description: string = '',
        callback: ProgramCallback
    ) {
        (this.commands as any)[alias] =
            {alias, description, callback} as ProgramCommand
        return this
    }
    private help(parsed: ProgramContext) {
        console.log(docopt(this.commands, this.options, this.flags))
    }
    parse = (
        args: string[] = [...Deno.args]
    ): ProgramContext => {
        let options: Record<string, ProgramInput> = {}
        let values: string[] = []
        let commands: string[] = []
        let __expect_command: boolean = true
        args.forEach((arg, index) => {
            // For now, we only need to support single commands
            // $ tsundere [command] [--any-flag <anything_else>]
            if (index > 1) __expect_command = false

            // Get the previous argument, if exists
            const previous = index > 0 ? args[index-1] : ''

            // If this is a flag, defaults the flag value to `true`
            // regardless of the actual expected value.
            // $ tsundere -v
            if (FLAG_PATTERN.test(arg)) {
                options[arg.replace(FLAG_PATTERN, '$<flag>')] = true
                __expect_command = false
            }
            // If this is a flag followed by an equal sign and a value,
            // in that case set the flag value to the new one.
            // $ tsundere --out-file=./output.js
            else if (OPTION_PATTERN.test(arg)) {
                options[arg.replace(OPTION_PATTERN, '$<flag>')] = 
                    sanitizeValue(arg.replace(OPTION_PATTERN, '$<value>'))
                __expect_command = false
            }
            // If the previous argument was a flag, set the previously registered
            // flag value to the new one.
            // $ tsundere --out-file ./output.js
            else if (
                index > 0
                && OPTION_PATTERN.test(`${previous} ${arg}`)
                && !__aliases(this.flags).includes(previous)
            ) {
                options[previous.replace(FLAG_PATTERN, '$<flag>')] = sanitizeValue(arg)
                __expect_command = false
            }
            // If the argument is a value and is included in registered commands
            // via `<ProgramCli>.command`, register the value as a requested command.
            // $ tsundere status
            else if (__expect_command && Object.keys(this.commands).includes(arg))
                commands.push(arg)
            // Finally, register any unparsed value as input values
            // $ tsundere a b c
            else {
                __expect_command = false
                values.push(arg)
            }
        })
        return {commands, options, values}
    }
    public fallback(callback: ProgramCallback) {
        this.__fallback = callback
        return this
    }
    run = async () => {
        const {commands, options, values} = this.parse()
        
        // Uncomment this, for CLI input debuggging
        // console.log({commands, options, values})
        
        if (Object.keys(options).includes('version') || Object.keys(options).includes('v')) 
            console.log(`${manifest.name} v${manifest.version}\nCopyright 2021 Tom Bazarnik\nLicensed under Apache License, Version 2.0.`)
        else if (Object.keys(options).includes('help') || Object.keys(options).includes('h'))
            this.help({commands, options, values})
        else if (commands.length)
            await this.commands[(commands as any)[0]].callback({
                manifest,
                options,
                values
            })
        else
            await this.__fallback({
                manifest,
                options,
                values
            })
    }
}

export function setupProgram() {
    return new Program()
}