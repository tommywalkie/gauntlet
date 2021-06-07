import type { Plugin } from "../core/types.ts";

export type Inputs =
  | ".png"
  | ".jpeg"
  | ".gif"
  | ".jpg"
  | ".bmp"
  | ".svg"
  | ".webp";
export type Outputs = ".js";

export const PLUGIN: Plugin<Inputs, Outputs> = {
  name: "@gauntlet/plugin-image-module",
  resolve: {
    input: [".png", ".jpeg", ".gif", ".jpg", ".bmp", ".svg", ".webp"],
    output: [".js"],
  },
  transform(_, { relativePath }) {
    return {
      ".js": `export default "${relativePath}";`,
    };
  },
};

export default PLUGIN;
