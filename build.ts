import * as esbuild from "./imports/esbuild.ts";

try {
  await esbuild.initialize({});
  const asyncIteratorPolyfill = `// Symbol.asyncIterator polyfill for iOS Safari
  // Copyright 2016 Financial Times
  if (!('Symbol' in self && 'asyncIterator' in self.Symbol)) {
    Object.defineProperty(Symbol, 'asyncIterator', {
      value: Symbol('asyncIterator')
    });
  }`;

  try {
    Deno.removeSync("./dist", { recursive: true });
  } catch (e) {}
  Deno.mkdirSync("./dist");

  // ESM build
  const { files } = await Deno.emit("./src/core/mod.ts", {
    bundle: "module",
  });
  const output = `// @ts-nocheck\n${asyncIteratorPolyfill}\n\n${
    files["deno:///bundle.js"]
  }`;
  Deno.writeTextFileSync("./dist/index.esm.js", output);

  // CJS build
  const { code } = await esbuild.transform(output, {
    format: "cjs",
    target: "node12",
  });
  Deno.writeTextFileSync("./dist/index.js", `// @ts-nocheck\n${code}`);

  esbuild.stop();
} catch (e) {
  esbuild.stop();
}
