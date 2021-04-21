import type { ProgramCommand, ProgramFlag, ProgramOption } from './types.ts'
import { manifest } from '../../manifest.ts'

function render(usageExamples: string[], optionsGuide: string[]) {
    return `${manifest.name} v${manifest.version}

Usage:
   ${usageExamples.join('\n   ')}

Options:
   ${optionsGuide.join('\n   ')}

Copyright 2021 Tom Bazarnik
Licensed under Apache License, Version 2.0.`
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
            alias + Array.from(Array(maxCmdLen - alias.length).keys()).map(_ => ' ').join('')
        return `${manifest.name} ${example}  ${description}`
    })
    const optionsGuide = Array.from(new Set(Object.keys({ ...options, ...flags }).map(entry => {
        const { aliases, description, defaultValue }: ProgramOption | ProgramFlag =
            (Object.assign({}, { ...options, ...flags }) as any)[entry]
        const __flags = aliases.join(', ')
        const optionDisplay =
            __flags + Array.from(Array(maxOptLen - __flags.length).keys()).map(_ => ' ').join('')
        return `${optionDisplay}  ${description} ${defaultValue ? `[default=${defaultValue}]` : ''}`
    })))
    return render(usageExamples, optionsGuide)
}