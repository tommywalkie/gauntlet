import * as esbuildWasm from "https://esm.sh/esbuild-wasm@0.12.5";
import type {
  TransformFailure,
  TransformOptions,
  TransformResult,
} from "https://esm.sh/esbuild-wasm@0.12.5";

let READY = false;

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

export const transform = esbuildWasm.transform;

export type { TransformFailure, TransformOptions, TransformResult };
