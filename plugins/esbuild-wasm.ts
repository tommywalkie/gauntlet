import { initialize, transform } from "../imports/esbuild-wasm.ts";
import type { Plugin } from "../core/types.ts";

export type Inputs = ".js" | ".ts" | ".tsx" | ".jsx";
export type Outputs = ".js" | ".js.map";

export const PLUGIN: Plugin<Inputs, Outputs> = {
  name: "@gauntlet/plugin-esbuild-wasm",
  async onMount() {
    await initialize();
  },
  resolve: {
    input: [".js", ".ts", ".tsx", ".jsx"],
    output: [".js", ".js.map"],
  },
  async transform(input) {
    const esbuildResults = await transform(input, {
      loader: "ts",
      sourcemap: "both",
    });
    return {
      ".js": esbuildResults.code,
      ".js.map": esbuildResults.map,
    };
  },
};

export default PLUGIN;
