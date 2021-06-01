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

> Please note that the hereby documentation is meant for anyone contributing to / building on top of Gauntlet core modules.

Gauntlet core modules include:

- **File watcher** (`src/core/watcher.ts`): Provides a bare-bones file watcher, given a `FileSystemLike` object as parameter.
- **Compiler** (`src/core/compiler.ts`): Provides a build pipeline which listens to file watchers' events, run the appropriate plugins and save outputs, given one or many file watchers and some configuration object as parameters.
- **Virtual filesystem** (`src/core/fs.ts`): Provides a `FileSystemLike` compliant virtual filesystem implentation.

### FileSystemLike

By design, aforementionned modules are based on top of a `FileSystemLike` object (available in `src/core/types.ts`), which needs only a couple of filesystem methods, which can be either Deno APIs or anything else, including self-made filesystems, like the one provided by Gauntlet.

**Neither the compiler nor the file watcher will write into the disk**, outputting build results is all on the development server or whatever system making use of Gauntlet core modules. 

```typescript
export interface FileSystemLike {
  /* To get the current working directory */
  cwd: () => string
  /* To track if an item exists */
  existsSync: (path: string) => boolean
  /* To retrieve item stats */
  lstatSync: (path: string) => {
    isFile: boolean;
    isDirectory: boolean;
    isSymlink: boolean;
  }
  /* To get the file content, currently needed for the compiler */
  readFileSync: (path: string | URL) => Uint8Array
  /* To walk a folder and list items */
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

## API

### File watcher

The backend-agnostic file watcher provided by Gauntlet process events from the provided `<FileSystemLike>.watch` and reports for any newly added or moved file, even if the renamed or moved parent directory was the only item emitting an event, making it a convenient utility for unbundled development.

Start watching for file events, by providing a `FileSystemLike` implementation, like the one for Deno.

```typescript
import { DenoFileSystem, watchFs } from "https://deno.land/x/gauntlet/mod.ts";

const watcher = watchFs({
  source: "./src",
  fs: DenoFileSystem
});

for await (const event of watcher) {
  /**
   * event: {
   *   kind: "watch" | "create" | "modify" | "remove"
   *   entry: {
   *     path: string
   *     name: string
   *     isFile: boolean
   *     isDirectory: boolean
   *     isSymLink: boolean
   *   }
   * }
   */
}
```

#### Differences with Deno.watchFs

Its behavior differs greatly from `Deno.watchFs`, which is [tracked and documented here](https://github.com/tommywalkie/Deno.watchFs), some key points to bear in mind:

- Copied folders' items **emit** `Deno.FsEvent` events.
- Removed folders' items **emit** `Deno.FsEvent` events.
- Renamed folders' items **don't emit** `Deno.FsEvent` events.
- Moved folders' items **don't emit** `Deno.FsEvent` events.
- A `modify` event can be any file/metadata change, this basically means users have to _guess what happened_ themselves and find out if the related item was a file or a possibly renamed or moved directory.
- Renaming events can happen [in unconveniently ordered 2~3 events](https://github.com/tommywalkie/Deno.watchFs#rename-a-file), depending of the OS, which may not have access to all `Deno.FsEvent` events.  

Moreover, but may not be specific to `Deno.watchFs`: performing filesystem ops using a GUI like Visual Studio Code, like a single file save, _can_ result in additional `modify` events, thus requiring polling and/or de-duplicating events in order to avoid unnecessary operations.

#### Behaviors

The Gauntlet file watcher strives to leverage aforementionned quirks as efficiently as possible, and gives oftenly needed information about the related entry.

- All emitted events provide `Deno.WalkEntry`-like data as parameter. 
- Emits a `watch` event when the file watcher is ready.
- Emits a `create` event event for any newly added file (empty or not).
- Emits a `modify` event for any file save.
- Emits a `remove` event and then a `create` event for any renamed file.
- Emits a `remove` event for every file inside a folder being removed.
- Emits a `remove` event and then a `create` event for every file inside a folder being renamed.
- Emits a `create` event for every file inside a folder being moved from outside the waching scope.
- Emits a `remove` event for every file inside a folder being moved to outside the waching scope.

This allows us to be aware of any path change, so we no longer have to update renamed / moved folders' items' paths ourselves.

