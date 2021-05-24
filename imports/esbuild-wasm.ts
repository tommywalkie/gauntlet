// @deno-types="https://cdn.jsdelivr.net/npm/esbuild-wasm@0.12.1/esm/browser.d.ts"
import * as esbuildWasm from "https://cdn.jsdelivr.net/npm/esbuild-wasm@0.12.1/esm/browser.min.js";
import type {
  TransformFailure,
  TransformOptions,
  TransformResult,
} from "https://cdn.jsdelivr.net/npm/esbuild-wasm@0.12.1/esm/browser.d.ts";

let ___READY = false;

export type EsbuildResult =
  | TransformResult
  | TransformFailure & { code?: string };

export async function transform(
  input: string,
  options?: TransformOptions,
): Promise<EsbuildResult> {
  if (!___READY) {
    throw new Error("esbuild not initialized.");
  }
  options = options ?? {};
  const result = await esbuildWasm.transform(input, {
    format: "esm",
    loader: "tsx",
    ...options,
  } as TransformOptions).catch((_: TransformFailure) => _);
  return result;
}

export async function initialize() {
  if (___READY) return;
  return await esbuildWasm.initialize({
    worker: false,
    wasmURL: "https://cdn.jsdelivr.net/npm/esbuild-wasm@0.12.1/esbuild.wasm",
  }).then(() => ___READY = true);
}

export function stop() {
  return;
}
