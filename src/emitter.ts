import { createBlankEmitter } from './core/emitter.ts'
import { cyan, gray, green, yellow, red, blue, bold, normalize } from '../imports/std.ts'
import { WalkEntry } from './core/fs.ts'

const DEBUG_PREFIX = `${gray('[')}${bold(blue('DEBUG'))}${gray('] —')}`
const WARN_PREFIX = `${gray('[')}${bold(yellow('WARN'))}${gray('] ——')}`
const INFO_PREFIX = `${gray('[')}${bold(cyan('INFO'))}${gray('] ——')}`
const SUCCESS_PREFIX = `${gray('[')}${bold(green('OK'))}${gray('] ————')}`
const FAIL_PREFIX = `${gray('[')}${bold(red('ERROR'))}${gray('] —')}`
const FATAL_PREFIX = `${gray('[')}${bold(red('FATAL'))}${gray('] —')}`

const logger = new class {
    debug(message: string) {
        console.log(`${DEBUG_PREFIX} ${message}`)
    }
    info(message: string) {
        console.log(`${INFO_PREFIX} ${message}`)
    }
    warn(message: string) {
        console.log(`${WARN_PREFIX} ${message}`)
    }
    success(message: string) {
        console.log(`${SUCCESS_PREFIX} ${message}`)
    }
    error(message: string) {
        console.log(`${FAIL_PREFIX} ${message}`)
    }
    fatal(message: string) {
        console.log(`${FATAL_PREFIX} ${red(message)}`)
    }
}

function displayFileName(path: WalkEntry) {
    return bold(yellow(path?.path ?? 'unknown'))
}

function displayContentType(path: WalkEntry) {
    return path ? path.isFile ? 'file' : path.isDirectory ? 'directory' : 'symlink' : 'unknown'
}

function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1)
}

const emitter = createBlankEmitter()

emitter.on("watch", (source: string) =>
    logger.info(`Now watching ${bold(yellow(normalize(source)))} for file changes...`))

emitter.on("modify", (entry: WalkEntry) =>
    logger.info(`${capitalize(displayContentType(entry))} ${displayFileName(entry)} changed`))

emitter.on("create", (entry: WalkEntry) =>
    logger.info(`Newly created ${displayContentType(entry)} ${displayFileName(entry)}`))

emitter.on("remove", (entry: WalkEntry) =>
    logger.info(`Deleted ${displayContentType(entry)} ${displayFileName(entry)}`))

emitter.on("listen", async ({ hostname, port, secure }) => 
    logger.success(`Listening on: ${cyan((secure ? "https://" : "http://") + (hostname ??
    "localhost") + ':' + port)}`))

emitter.on("terminate", () => logger.success('Gracefully exited'))

emitter.on("debug", (message: string) => logger.debug(message))
emitter.on("info", (message: string) => logger.info(message))
emitter.on("warn", (message: string) => logger.warn(message))
emitter.on("error", (message: string) => logger.error(message))
emitter.on("fatal", (message: string) => logger.fatal(message))

export { emitter as defaultEmitter }