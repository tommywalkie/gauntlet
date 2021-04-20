/**
 * Base events interface for `EventEmitter<T>` from `deno_events`,
 * should be used for fine-grained debugging and crash reporting.
 */
export interface LogEvents {
    fatal(description: string, error?: Error): void
    error(description: string, error?: Error): void
    warn(description: string): void
    info(description: string): void
    debug(description: string): void
}