<!-- deno-fmt-ignore-file -->

<p align="center">
  <img height="120" src="https://raw.githubusercontent.com/tommywalkie/gauntlet/main/.github/assets/logo.svg">
  <h1 align="center">Gauntlet File Watcher</h1>
</p>
<p align="center">
    <i>Like </i><code>Deno.watchFs</code><i>, but more verbose and same behavior for everyone.</i>
</p>



## Overview

Originally intended to be a `Deno.watchFs` pre-processor, this backend-agnostic module allows to de-duplicate, pre-process and watch for filesystem events emitted by any file watching implementation, in order to forward minimal, consistent and informative events.

This is currently designed for tools which heavily rely on tracking and processing file changes, like transpilers or development servers, like Gauntlet.

## Usage

Provided that you have an adequate `FileSystemLike` interface; notably implementing `watch`, `walkSync`, `existsSync`, `lstatSync` and `cwd`; you can start watching for / iterating filesystem events.

```typescript
import { watchFs } from "https://deno.land/x/gauntlet@0.1.0/mod.ts";
import { existsSync, walkSync } from "https://deno.land/std@0.97.0/fs/mod.ts";

const watcher = watchFs({
  source: "./src",
  fs: {
  	cwd: Deno.cwd,
    existsSync,
    lstatSync: Deno.lstatSync,
    readFileSync: Deno.readFileSync,
    walkSync,
    watchFs: Deno.watchFs,
  }
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

## Differences with Deno.watchFs

Its behavior differs greatly from `Deno.watchFs`, which is [tracked and documented here](https://github.com/tommywalkie/Deno.watchFs), some key points to bear in mind:

- Copied folders' items **emit** `Deno.FsEvent` events.
- Removed folders' items **emit** `Deno.FsEvent` events.
- Renamed folders' items **don't emit** `Deno.FsEvent` events.
- Moved folders' items **don't emit** `Deno.FsEvent` events.
- A `modify` event can be any file/metadata change, this basically means users have to _guess what happened_ themselves and find out if the related item was a file or a possibly renamed or moved directory. This also means these events could happen in large groups, especially if interacting with the filesystem using any third-party GUI tool, **requiring de-duplicating events**.
- Events in OSX don't follow the same order than in other systems.
- Renaming events can happen [in unconveniently ordered 2~3 events](https://github.com/tommywalkie/Deno.watchFs#rename-a-file), depending of the OS which may not all have access to every event.  

## Behaviors

The hereby file watcher implementation strives to leverage aforementionned quirks as efficiently and consistent as possible, no matter the backend, while providing oftenly needed information about the related entry.

- All emitted event payloads provide `Deno.WalkEntry`-like data. 
- Emits one `watch` event when the file watcher is ready.
- Emits one `create` event for any newly added file (empty or not). _*_
- Emits one `modify` event for any file save.
- Emits one `remove` event and then one `create` event for any renamed file.
- Emits one `remove` event for every file inside a folder being removed.
- Emits one `remove` event and then one `create` event for every file inside a folder being renamed.
- Emits one `create` event for every file inside a folder being moved from outside the waching scope.
- Emits one `remove` event for every file inside a folder being moved to outside the waching scope.

The main benefit of this approach is it allows us to be aware of any path change, so we no longer have to recursively update renamed / moved paths ourselves.

_*_ Depending on whether interacts with the filesystem, an additional `modify` event may be emitted. When using Deno APIs like `Deno.writeSync`, only a `create` event will happen upon writing a new file, while a `modify` may be emitted if using `CTRL`+`S` on Visual Studio Code after the `create` event, this is often because third-party tools also alter metadata.