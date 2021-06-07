import type { Plugin } from "../core/types.ts";

export type Inputs = ".json";
export type Outputs = ".json" | ".json.js";

export const PLUGIN: Plugin<Inputs, Outputs> = {
  name: "@gauntlet/plugin-json",
  resolve: {
    input: [".json"],
    output: [".json", ".json.js"],
  },
  transform(input) {
    return {
      ".json": input,
      ".json.js": `export default ${input};`,
    };
  },
};

export default PLUGIN;
