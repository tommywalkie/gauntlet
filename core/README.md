<!-- deno-fmt-ignore-file -->

<p align="center">
  <img height="120" src="https://raw.githubusercontent.com/tommywalkie/gauntlet/main/.github/assets/logo.svg">
  <h1 align="center">Gauntlet Core</h1>
</p>
<p align="center">
  <i>Browser-compatible <a href="https://github.com/tommywalkie/gauntlet">Gauntlet</a> core modules</i>
</p>
<p align="center">
  <a href="https://deno.land/x/gauntlet"><img src="https://img.shields.io/endpoint?url=https%3A%2F%2Fdeno-visualizer.danopia.net%2Fshields%2Flatest-version%2Fx%2Fgauntlet%2Fmod.ts" /></a>
  <a href="https://deno-visualizer.danopia.net/dependencies-of/https/deno.land/x/gauntlet/src/core/mod.ts?rankdir=LR"><img src="https://img.shields.io/endpoint?url=https%3A%2F%2Fdeno-visualizer.danopia.net%2Fshields%2Fcache-size%2Fhttps%2Fdeno.land%2Fx%2Fgauntlet%2Fsrc%2Fcore%2Fmod.ts" alt="Current cache size" /></a>
  <a href="https://deno-visualizer.danopia.net/dependencies-of/https/deno.land/x/gauntlet/src/core/mod.ts?rankdir=LR"><img src="https://img.shields.io/endpoint?url=https%3A%2F%2Fdeno-visualizer.danopia.net%2Fshields%2Fupdates%2Fhttps%2Fdeno.land%2Fx%2Fgauntlet%2Fsrc%2Fcore%2Fmod.ts" /></a>
</p>



## Overview

Gauntlet will be featuring lightweight and browser-compatible core modules, enabling anyone to integrate with any runtime, as long as the latter provides a few needed filesystem APIs, and supports a fair amount of ES6+ features, including [modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules#browser_support) (for browsers), [async iterators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/asyncIterator#browser_compatibility), [nullish coalescing](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing_operator#browser_compatibility)  (`??`), [spread syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax#browser_compatibility) (`...`) and [optional chaining](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining#browser_compatibility) (`?.`).

| <img src="https://raw.githubusercontent.com/gilbarbara/logos/master/logos/deno.svg" alt="Deno" width="24px" height="24px" /> | <img src="https://nodejs.org/static/images/favicons/favicon.ico" alt="Node" width="24px" height="24px" /> | <img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/edge/edge_48x48.png" alt="IE / Edge" width="24px" height="24px" /> | <img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png" alt="Firefox" width="24px" height="24px" /> | <img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png" alt="Chrome" width="24px" height="24px" /> | <img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari/safari_48x48.png" alt="Safari" width="24px" height="24px" /> | <img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/opera/opera_48x48.png" alt="Opera" width="24px" height="24px" /> |
| ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| Deno 1.x                                                     | ⚠️                                                            | Edge 80                                                      | Firefox 74                                                   | Chrome 80                                                    | Safari 13.1<br />iOS Safari 13.4 _*_                         | Opera 67                                                     |

_*_ iOS Safari doesn't support [Symbol.asyncIterator](https://caniuse.com/mdn-javascript_builtins_symbol_asynciterator). The latter is polyfilled during build, but needs testing.

## Contents

Gauntlet core modules include:

- [**File watcher**](https://github.com/tommywalkie/gauntlet/tree/main/core/watcher) (`core/watcher`): Provides a bare-bones file watcher, given a `FileSystemLike` object as parameter.
- **Compiler** (`core/compiler`): Provides a build pipeline which listens to file watchers' events, run the appropriate plugins and save outputs, given one or many file watchers and some configuration object as parameters.
- [**Virtual filesystem**](https://github.com/tommywalkie/gauntlet/tree/main/core/fs) (`core/fs`): Provides a [`FileSystemLike`](https://github.com/tommywalkie/gauntlet/tree/main/core#filesystemlike) compliant virtual filesystem implentation.

### FileSystemLike

By design, aforementionned modules are based on top of a `FileSystemLike` object (defined in `core/types.ts`), which needs only a couple of filesystem methods, which can be either Deno APIs or anything else, including self-made filesystems.

**Neither the compiler nor the file watcher will write into the disk**, outputting build results is all on the development server or whatever system making use of Gauntlet core modules. 

```typescript
export interface FileSystemLike {
  /* To get the current working directory */
  cwd: () => string
  /* To track if an item exists, should support relative paths */
  existsSync: (path: string) => boolean
  /* To retrieve item stats, should support relative paths */
  lstatSync: (path: string) => {
    isFile: boolean;
    isDirectory: boolean;
    isSymlink: boolean;
  }
  /* To get the file content, currently needed for the compiler */
  readFileSync: (path: string | URL) => Uint8Array
  /* To walk a folder and list items, should support relative paths */
  walkSync: (currentPath: string) => IterableIterator<{
    path: string,
    name: string;
    isFile: boolean;
    isDirectory: boolean;
    isSymlink: boolean;
  }>
  /* To watch for filesystem events via an async iterator */
  watch: (
    paths: string | string[], 
    ...options: any | undefined
  ) => AsyncIterableIterator<{
    kind: "create" | "modify" | "remove" | string;
    paths: string[];
  }>
}
```

For convenience, a Deno-compatible implementation is available.

```typescript
import { DenoFileSystem } from "https://deno.land/x/gauntlet/mod.ts";
// { cwd: Deno.cwd, lstatSync: Deno.lstatSync, ... }
```