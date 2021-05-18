// Some Deno standard library modules might be marked as browser-compatible
// via some 'This module is browser compatible.' comment and can be externalized,
// like 'path'.
//
// Ideally, there should be only Deno-specific modules here (filesystem APIs etc.)

export * from "https://deno.land/std@0.96.0/fmt/colors.ts";
export { existsSync, walkSync, moveSync, copySync } from "https://deno.land/std@0.96.0/fs/mod.ts";
export { format } from "https://deno.land/std@0.96.0/datetime/mod.ts";
export {
    serve,
    Server,
    ServerRequest,
} from "https://deno.land/std@0.96.0/http/server.ts";
export type {
    HTTPOptions,
} from "https://deno.land/std@0.96.0/http/server.ts";