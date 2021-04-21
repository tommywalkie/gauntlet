import { setupProgram } from './src/cli/mod.ts'
import { dev } from './src/cli/commands/dev.ts'

const program = setupProgram()

program.flag(['--version', '-v'], 'Get Gauntlet CLI version')
    .flag(['--help', '-h'], 'Display help')
    .command('dev', 'Run development server', dev)
    .run()