// @deno-types="https://deno.land/x/esbuild@v0.12.0/mod.d.ts"
import { transform, stop, initialize } from "https://deno.land/x/esbuild@v0.12.0/mod.js";
import type {
    InitializeOptions,
    TransformOptions,
    TransformResult,
    TransformFailure
} from "https://deno.land/x/esbuild@v0.12.0/mod.d.ts";

export interface EsbuildInstance {
    initialize(options: InitializeOptions): Promise<void>
    transform(input: string, options?: TransformOptions): Promise<TransformResult>
    stop(): void
}

export type {
    InitializeOptions,
    TransformOptions,
    TransformResult,
    TransformFailure
}

export { transform, stop, initialize }
export default { transform, stop, initialize }