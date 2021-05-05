import type { ApplicationListenEvent } from '../imports/oak.ts'
import type { FileEvents, LogEvents } from './core/types.ts'
import type { WatchEvents } from './core/watcher.ts'

export interface GauntletEvents extends LogEvents, FileEvents, WatchEvents {
    listen(evt: ApplicationListenEvent): void
    terminate(): void
}