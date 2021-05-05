import type {
    ProgramCommand,
    ProgramFlag,
    ProgramOption
} from './types.ts'

import { format, gray, green, yellow, cyan, red, blue } from '../../imports/std.ts'
import { manifest } from '../../manifest.ts'

export const LICENSE = `Copyright ${format(new Date(), 'yyyy')} Tom Bazarnik
Licensed under Apache License, Version 2.0.`

export const VERSION = `${manifest.name} ${yellow('v' + manifest.version)}`

const NEXT_LINE_ALINEA = '\n   '

function render(usageExamples: string[], optionsGuide: string[]) {
    return `${VERSION}

Usage:
   ${usageExamples.join(NEXT_LINE_ALINEA)}

Options:
   ${optionsGuide.join(NEXT_LINE_ALINEA)}

${LICENSE}`
}

function renderCommand(commandsObj: any, maxCmdLen: number, command: string) {
    const { alias, description } = commandsObj[command]
    const example =
        alias + Array.from(Array(maxCmdLen - alias.length).keys()).map(_ => ' ').join('')
    return `${manifest.name} ${example}  ${description}`
}

export function docopt(
    commands: ProgramCommand[],
    options: Record<string, ProgramOption>[],
    flags: Record<string, ProgramFlag>[]
) {
    const commandsObj = Object.assign({ ...commands })
    const maxCmdLen = Math.max(...(Object.keys(Object.assign({ ...commands }))
        .map(el => commandsObj[el].alias.length) as number[]))
    const maxOptLen = Math.max(...(Object.keys({ ...options, ...flags }).map(command => 
        (Object.assign({}, { ...options, ...flags }) as any)[command].aliases.join(', ').length) as number[]))
    const usageExamples = Object.keys({ ...commands }).map(command => {
        const { alias, description } = commandsObj[command]
        const example =
            green(alias) + Array.from(Array(maxCmdLen - alias.length).keys()).map(_ => ' ').join('')
        return `${manifest.name} ${example}  ${gray(description)}`
    })
    const optionsGuide = Array.from(new Set(Object.keys({ ...options, ...flags }).map(entry => {
        const { aliases, description, defaultValue }: ProgramOption | ProgramFlag =
            (Object.assign({}, { ...options, ...flags }) as any)[entry]
        const __flags = aliases.join(', ')
        const colored_flags = aliases.map(el => cyan(el)).join(', ')
        const optionDisplay =
            colored_flags + Array.from(Array(maxOptLen - __flags.length).keys()).map(_ => ' ').join('')
        return `${optionDisplay}  ${gray(description)} ${defaultValue ? gray(`[default=${blue(String(defaultValue))}]`) : ''}`
    })))
    return render(usageExamples, optionsGuide)
}