// @deno-types="https://deno.land/x/esbuild@v0.12.1/mod.d.ts"
import {
  build,
  initialize,
  stop,
  transform,
} from "https://deno.land/x/esbuild@v0.12.1/mod.js";
import type {
  InitializeOptions,
  TransformFailure,
  TransformOptions,
  TransformResult,
} from "https://deno.land/x/esbuild@v0.12.1/mod.d.ts";

export interface EsbuildInstance {
  initialize(options: InitializeOptions): Promise<void>;
  transform(
    input: string,
    options?: TransformOptions,
  ): Promise<TransformResult>;
  stop(): void;
}

export type {
  InitializeOptions,
  TransformFailure,
  TransformOptions,
  TransformResult,
};

export { build, initialize, stop, transform };
export default { transform, stop, initialize, build };
