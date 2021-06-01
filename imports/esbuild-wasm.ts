// @deno-types="https://cdn.jsdelivr.net/npm/esbuild-wasm@0.12.5/esm/browser.d.ts"
import * as esbuildWasm from "https://cdn.jsdelivr.net/npm/esbuild-wasm@0.12.5/esm/browser.min.js";
import type {
  TransformFailure,
  TransformOptions,
  TransformResult,
} from "https://cdn.jsdelivr.net/npm/esbuild-wasm@0.12.5/esm/browser.d.ts";

let READY = false;

export type EsbuildResult =
  | TransformResult
  | TransformFailure & { code?: string };

export async function transform(
  input: string,
  options?: TransformOptions,
): Promise<EsbuildResult> {
  if (!READY) {
    throw new Error("esbuild not initialized.");
  }
  options = options ?? {};
  const result = await esbuildWasm.transform(input, {
    format: "esm",
    loader: "tsx",
    ...options,
  }).catch((_: TransformFailure) => _);
  return result;
}

export async function initialize() {
  if (READY) return;
  return await esbuildWasm.initialize({
    worker: false,
    wasmURL: "https://cdn.jsdelivr.net/npm/esbuild-wasm@0.12.5/esbuild.wasm",
  }).then(() => READY = true);
}

export function stop() {
  return;
}
