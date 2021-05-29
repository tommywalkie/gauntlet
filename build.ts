import * as esbuild from "./imports/esbuild.ts";
import { join } from "./imports/path.ts";
import { existsSync } from "./imports/std.ts";

try {
  await esbuild.initialize({});
  const asyncIteratorPolyfill = `// Symbol.asyncIterator polyfill for iOS Safari
// Copyright 2016 Financial Times
if (!('Symbol' in self && 'asyncIterator' in self.Symbol)) {
  Object.defineProperty(Symbol, 'asyncIterator', {
    value: Symbol('asyncIterator')
  });
}`;
  const distDir = join(Deno.cwd(), "dist");
  if (existsSync(distDir)) {
    Deno.removeSync(distDir, { recursive: true });
  }
  Deno.mkdirSync(distDir, { recursive: true });

  // ESM build
  const { files } = await Deno.emit("./core/mod.ts", {
    bundle: "module",
  });
  const output = `${asyncIteratorPolyfill}\n\n${files["deno:///bundle.js"]}`;
  Deno.writeTextFileSync("./dist/index.mjs", output);

  // CJS build
  const { code } = await esbuild.transform(output, {
    format: "cjs",
    target: "node12",
  });
  Deno.writeTextFileSync("./dist/index.js", code);

  esbuild.stop();
} catch (_e) {
  esbuild.stop();
}
