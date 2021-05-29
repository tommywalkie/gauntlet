import { existsSync, walkSync } from "../imports/std.ts";
import type { FileSystemLike } from "../core/types.ts";

export const DenoFileSystem: FileSystemLike = {
  cwd: () => Deno.cwd(),
  existsSync,
  lstatSync: Deno.lstatSync,
  readFileSync: Deno.readFileSync,
  walkSync,
  watch: Deno.watchFs,
};
