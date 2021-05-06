import * as types from './core/types.ts'
import * as fs from './core/fs.ts'
import * as cli from './cli/types.ts'

import type { ApplicationListenEvent } from '../imports/oak.ts'

export * from './core/types.ts'

/**
 * Stable Gauntlet types
 */
export namespace Gauntlet {
    /**
     * Stable browser-compatible Gauntlet Core types
     */
    export namespace Core {
        export import FileSystemLike = types.FileSystemLike
        export import LogEvents = types.LogEvents
        export import FileEvents = types.FileEvents
        export import VirtualFileSystem = fs.VirtualFileSystem
    }
    export interface Events extends Core.LogEvents, Core.FileEvents {
        listen(event: ApplicationListenEvent): void
        terminate(): void
    }
    /**
     * Stable Gauntlet command-line types
     */
    export namespace CLI {
        export import Program = cli.Program
        export import Command = cli.Command
        export import Flag = cli.Flag
        export import Option = cli.Option
        export import Input = cli.Input
        export import Callback = cli.Callback
        export import CallbackProps = cli.CallbackProps
        export import Context = cli.Context
    }
}