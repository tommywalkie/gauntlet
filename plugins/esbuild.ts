import { initialize, stop, transform } from "../imports/esbuild.ts";
import type { Plugin } from "../core/types.ts";

export type Inputs = ".js" | ".ts" | ".tsx" | ".jsx";
export type Outputs = ".js" | ".js.map";

export const PLUGIN: Plugin<Inputs, Outputs> = {
  name: "@gauntlet/plugin-esbuild",
  async onMount() {
    await initialize({});
  },
  onDestroy() {
    stop();
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
