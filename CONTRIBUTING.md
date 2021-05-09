# Contributing

Welcome and thanks for your interest in contributing! Please read carefully through our guidelines below to ensure that your contribution adheres to our  project's standards.

## Issue tracking

We use [Github Issues](https://github.com/tommywalkie/gauntlet/issues) to track all bugs and feature requests related to Gauntlet.

Also, we use [Github Projects](https://github.com/tommywalkie/gauntlet/projects) to track pending issues and project goals.

## Submit a Pull Request

Here is a couple of rules of thumb for any submitted pull request:

- Please be respectful and mindful of your language
- Please use English language for any comment through Github or the source code
- Fork the hereby repo and follow the [Github flow](https://guides.github.com/introduction/flow/)
- Give the PR a descriptive title

## Build from source

Clone the hereby repo or, if intending to submit a PR, your own fork.

```shell
git clone https://github.com/tommywalkie/gauntlet
```

### Prerequisites

- Deno 1.8+
- Deno Visual Studio Code extension

**Note**: No need to install ESBuild yourself, this is done automatically by the official Deno module itself, or retrieved via network if using the WebAssembly version.

### Usage

Install the `cli.ts` script as a command-line tool via Deno. All source code changes are automatically applied to the command-line program.

```shell
deno install -A --unstable --no-check <your-repo>/cli.ts
# ✅ Successfully installed gauntlet
```

Now you can run the actual program.

```shell
gauntlet --help   # Open the help guide
gauntlet dev      # Run the development server
```

## Project structure

```bash
.
├─── .github        # Continuous integration
├─── imports        # Meteor-like imports folder
├─── src            # The actual source code
|   ├─── cli        # Command-line program source code
|   ├─── core       # Browser-compatible core modules
|   └    *.ts       # Deno-specific modules (server, filesystem)
├   cli.ts          # Command-line program entrypoint
└   mod.ts          # Module entrypoint
```

Gauntlet opted for a simple project structure using [Meteor-inspired `imports`](https://guide.meteor.com/structure.html#javascript-structure) folder instead of a bloated [`deps.ts`](https://deno.land/manual/examples/manage_dependencies), in order to isolate each dependency and make sure either users and contributors download only the requested modules. This also help us making the difference between browser-compatible modules and Deno-specific ones.

### Core modules

As Snowpack and Vite currently cannot simply be ported to Deno while [`std/node`](https://deno.land/std/node) still lacks most of needed modules (`vm2`, `http2`, `worker_threads`, etc.), Gauntlet is striving to be an ECMAScript Modules powered development server based on Deno, with browser-compatible core modules.

The goal is to provide easily reusable and backend-agnostic modules inside of `src/core`, including most expected features for such a build tool:

- **Filesystem interface** (`src/core/fs.ts`): Provides a `FileSystemLike` interface specifying needed APIs (like `walkSync`, `lstatSync`, etc.) and a browser-compatible virtual filesystem implementing `FileSystemLike`.
- **File watcher** (`src/core/watcher.ts`): Provides a bare-bones and OS-agnostic file watcher, given a filesystem interface as parameter.
- **Compiler** (`src/core/compiler.ts`): Provides a backend-agnostic build pipeline which only listens to file watchers' events and run the appropriate transform plugins and saves outputs, given one or many file watchers and some configuration object as parameters.

![concept](https://raw.githubusercontent.com/tommywalkie/gauntlet/main/.github/assets/api-concept.png)

Ideally, these modules will be available as transpiled ECMAScript Modules which can be fetched via `deno.land/x` or any CDN.

#### Filesystem interface

The available `FileSystemLike` interface is intended to specify needed filesystem APIs in order to make Gauntlet work.

```typescript
export interface FileSystemLike {
    cwd: () => string
    existsSync: (path: string) => boolean
    lstatSync: (path: string) => {
        isFile: boolean;
        isDirectory: boolean;
        isSymlink: boolean;
    }
    mkdirSync: (path: string | URL, ...options: any | undefined) => void
    readFileSync: (path: string | URL) => Uint8Array
    walkSync: (currentPath: string) => IterableIterator<{
        path: string,
        name: string;
        isFile: boolean;
        isDirectory: boolean;
        isSymlink: boolean;
    }>
    watch: (
    	paths: string | string[], 
    	...options: any | undefined
    ) => AsyncIterableIterator<{
        kind: "create" | "modify" | "remove" | string;
        paths: string[];
    }>
    writeFileSync: (
    	path: string | URL,
    	data: Uint8Array, ...options: any | undefined
    ) => void
}
```

For example, here is the available Deno-based `FileSystemLike` implementation in `src/fs.ts`:

```typescript
import { existsSync, walkSync } from '../imports/std.ts'
import type { FileSystemLike } from './core/types.ts'

export const fs: FileSystemLike = {
    cwd: Deno.cwd,
    existsSync,
    lstatSync: Deno.lstatSync,
    mkdirSync: Deno.mkdirSync,
    readFileSync: Deno.readFileSync,
    walkSync,
    watch: Deno.watchFs,
    writeFileSync: Deno.writeFileSync,
}
```

#### File watcher

`Deno.watchFs` uses Rust crate `notify` under the hood which is intended to provide cross-platform file watching support. Our current file watcher implementation is pre-processing `Deno.watchFs` results in order to solve various quirks:

- Any `NotifyEvent` event processed by `Deno.watchFs` is [being stripped away](https://github.com/denoland/deno/blob/46b1c653c0c433932908b7610f60b409af134c76/runtime/ops/fs_events.rs#L66-L82) of some valuable information and will just output an event kind string and one or multiple paths, making it hard to guess _what_ actually happened without needlessly walking the filesystem 
- A `modify` event can be either data or metadata change on Windows
- A `create` event can also be a file save on OSX
- When renaming entries, a single `modify` event specifying the old-named entry may be emitted, while Linux is currently the only system being granted with `modify` events describing two paths, _good luck to Windows & OSX users_

```json
{
    kind: "modify",
    paths: ["old_name.txt", "new_name.txt"]
}
```

- When renaming/removing a non-empty folder, this may emit event(s) only for the folder itself, which can be quite inconvenient while our primary use case is watching and processing _supposedly_ existing files, again implying needlessly walking the filesystem

The current file watcher implementation is designed for consistent behaviors among operating systems with four possible events (`watch`, `create`, `remove` and `modify`), and to be used the same way as `Deno.watchFs`, thus by returning an async iterator.

```typescript
import { watchFs } from 'https://deno.land/x/gauntlet/src/core/watcher.ts'
import { fs } from 'https://deno.land/x/gauntlet/src/fs.ts'

for await (const event of watchFs({ source: "./src", fs })) {
    // Process emitted events
}
```

The behavior of the file watcher is as it follows:

- Any event returns a filesystem entry (`WalkEntry`) defined by a path, an entry name, and some stats
- Emits a `watch` event when the file watcher is ready
- Emits a `create` event and then a `modify` event for any newly added file
- Emits a `modify` event for any file save
- Emits a `remove` event and then a `create` event for any renamed file
- Emits a `remove` event for every file inside a folder being removed
- Emits a `remove` event and then a `create` event for every file inside a folder being renamed

This approach is certainly not perfect, an obvious limitation is that the compiler or any user may need to cache file contents to avoid re-processing unchanged renamed files. That said, file watchers are carefully tested via multi-platform continuous integration, but feel free to suggest changes via Github Issues or pull requests.

#### Compiler

TODO

## Style guide

- All the platform-agnostic source code shall reside in `src/core/`
- [Similarly to Meteor projects](https://guide.meteor.com/structure.html#javascript-structure), individual dependencies shall be settled under `imports/`
- Gauntlet is intended to be built upon, please don't bring any bare import mechanism
- Avoid cyclic imports
- Prefer JS/TS/native dependencies over WebAssembly ones unless necessary (_e.g._ ESBuild for the browser)
- Prefer modularized dependencies over heavy centralized ones using, _inter alia_, the [`deps.ts` convention](https://deno.land/manual/examples/manage_dependencies) (*i.e.* please don't make accustomed Lodash users vendor the whole `deno.land/x`)
- For event-driven components, use the available type-safe `EventEmitter` implementation in `imports/deno_events.ts` which is based on [`deno_events`](https://deno.land/x/deno_events)
- Test files (`**/*.test.ts`) use the available Jest-like matchers in `imports/expect.ts` which are based on [`expect`](https://deno.land/x/expect)

## Testing

Launch tests with the following Deno command.

**Note**: We need both `-A` and `--unstable` flags in order to launch file watching and build pipeline related tests.

```shell
deno test -A --unstable
```

### Writing your test

Each test file must have the `**/*.test.ts` naming pattern so Deno can detect them when using `deno test`. We use available Jest-like matchers in `imports/expect.ts` which are based on [`expect`](https://deno.land/x/expect).

```typescript
import { expect, it } from '../../imports/expect.ts'

it('should work', () => {
    expect(1 + 1).toBe(2)
    expect(1).toBeGreaterThan(0)
    expect(true).toBeTruthy()
    expect(false).toBeFalsy()
})
```

### Testing file watching

File watching is hands down the trickiest feature to test, first we need to make sure we understand the motivation behind the custom file watcher implementation and how iterators work, then we can talk about how to write proper tests in `src/core/watcher.test.ts`.

When using `deno test`, we can notice that file watching related tests take some time (`~2.5s` per test), this is intentional for many reasons we'll attempt to list shortly.

Given this sample test about tracking newly added files:

```typescript
import { expect, it } from '../../imports/expect.ts'
import { join } from '../../imports/path.ts'
import { denoFs } from '../fs.ts'
import { watchFs } from './watcher.ts'

it('should be able to track newly added files', async () => {
    const tempDirName = join(Deno.cwd(), "/foo")
    try { Deno.removeSync(tempDirName, { recursive: true }) } catch(e) {}
    Deno.mkdirSync(tempDirName, { recursive: true })
    
    const watcher = watchFs({ source: "./foo", fs: denoFs })
    setTimeout(() => (watcher as any).return(), 2500)

    const occurredEvents: WatchEvent[] = []
    for await (const event of watcher) {
        occurredEvents.push(event)
        if (event.kind === 'watch') {
            Deno.writeTextFileSync(join(tempDirName, "/A.txt"), "Lorem ipsum")
        }
    }

    expect(occurredEvents.length).toBe(3)
    Deno.removeSync(tempDirName, { recursive: true })
})
```

First we prepare the temporary folder `./foo` for the test and make sure it didn't exist in the first place, otherwise `mkdirSync` will throw an error, hence the preliminary `try/catch`.

```typescript
const tempDirName = join(Deno.cwd(), "/foo")
try { Deno.removeSync(tempDirName, { recursive: true }) } catch(e) {}
Deno.mkdirSync(tempDirName, { recursive: true })
```

Now we import the Deno-specific filesystem interface in `src/fs.ts` so we can use it in our tests, then we create an `AsyncIterableIterator` based file watcher using the filesystem interface we just imported, finally we set up a timeout to automatically call `<AsyncIterableIterator>.return()` and safely terminate the file watcher.

```typescript
const watcher = watchFs({ source: "./foo", fs: denoFs })
setTimeout(() => (watcher as any).return(), 2500)
```

Then, we can launch the file watcher and record occurred events. The normal behavior of the file watcher is to emit a `watch` event to tell us it is ready.

```typescript
const occurredEvents: WatchEvent[] = []
for await (const event of watcher) {
    occurredEvents.push(event)
    if (event.kind === 'watch') {
        Deno.writeTextFileSync(join(tempDirName, "/A.txt"), "Some text")
    }
}
```

Once the watcher is terminated by the previously mentioned `setTimeout`, we can make our usual tests and then clear the temporary directory.

Now, let's discuss about the guidelines and the common mistakes we can make during our tests:

- Favor using synchronous APIs like `Deno.writeTextFileSync`
- When renaming files using any third party tool like Visual Studio Code, we may mistakenly expect just a metadata change, while it may actually copy and then delete the old entry, hence why we should favor using shell commands or Deno filesystem APIs during our tests for consistency
- Always assume we have no idea how many / what events will occur for whatever system (especially OSX), this is also why...
- We **should not** use `<AsyncIterableIterator>.return()` inside the `for..await` unless we are absolutely sure about what we are doing. It is very tempting to do so in order to drastically speed up tests, but we may run into never-ending iteration if some _expected_ event didn't happen
- Deno will warn us if some test function ended while there are remaining processing promises
