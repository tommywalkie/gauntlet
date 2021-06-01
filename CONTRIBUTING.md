<!-- deno-fmt-ignore-file -->
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

- Deno
- Node 12+ (recommended for specific tests)
- Any decent Markdown editor (recommended for docs)

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
├─── commands       # Command-line program commands
├─── imports        # Meteor-like imports folder
├─── cli            # Command-line source code (backend-agnostic)
├─── core           # Core modules (backend-agnostic)
├─── server         # Deno-based development server
├   build.ts        # Build script for NPM builds
├   cli.ts          # Command-line program entrypoint
└   mod.ts          # Module entrypoint
```

## Style guide

Gauntlet is intended to be built upon, and extensible via plugins. Although the product is simple, various dependencies may be needed for different use cases, this is why some style rules need to be followed.

- Avoid using any bare import mechanism.
- Use 2-space indentation (or just use `deno fmt`).
- Modules inside `core/` shall be browser-compatible.
- Modules inside `cli/` shall be browser-compatible.
- Use `deno info <URL>` before adding any dependency.
- Any dependency shall reside in its own file under `imports/`, [similarly to Meteor projects](https://guide.meteor.com/structure.html#javascript-structure).
- Any dependency shall be versioned and providing types.
  - Prefer using [esm.sh](https://esm.sh/) wherever possible, which directly provide bundles and types.
  - If using [jsDelivr](https://www.jsdelivr.com/), find types and use `// @deno-types="<module>.d.ts"`.
  - If using [Skypack](https://www.skypack.dev/), try using `?dts` when requesting modules, otherwise, find types and use `// @deno-types="<module>.d.ts"`.
  - If using [`std`](https://deno.land/std), look for [browser-compatibility comments](https://deno.land/manual@v1.10.2/contributing/style_guide#document-and-maintain-browser-compatibility).
  - If using Github raw files, use commit permalinks and find types and use `// @deno-types="<module>.d.ts"`.
- Avoid cyclic imports.

## Formatting

Formatting is handled by Deno's [built-in formatter](https://deno.land/manual/tools/formatter#code-formatter), based on [dprint](https://dprint.dev/), the [default rules](https://dprint.dev/plugins/typescript/config/) notably include two spaces for indentation, double quotes by default, max 120 characters line width.

```shell
deno fmt --ignore=dist          # Explicitly ignore NPM builds and auto-format files
deno fmt --check --ignore=dist  # Explicitly ignore NPM builds, check and report errors
```

### Formatting gotchas

Unlike what the documentation mentions, given [this snippet](https://github.com/denoland/deno/blob/d69a5fbe1a4f909b7eba0eac81dd111fb7229232/cli/tools/fmt.rs#L155-L169), the Deno formatter actually covers :
- TypeScript
- JavaScript
- JSX
- JSON, JSONC
- Markdown (HTML tags included, this can notably mess up Github badges)

Therefore, don't forget to use ignore flags when appropriate. In Markdown, you would like to use:

```markdown
<!-- deno-fmt-ignore -->
```

While in actual scripts, you would use something like:

```js
// deno-fmt-ignore
```

## Linting

Linting is based on official [Deno linter](https://lint.deno.land/) rules.

You can [ignore rules](https://lint.deno.land/ignoring-rules) for a specific line or at the file level using `// deno-lint-ignore`.

```shell
deno lint --ignore=dist # Explicitly ignore NPM builds
```

## Testing

Launch tests with the following Deno command.

**Note**: We need both `-A` and `--unstable` flags in order to launch file watching and build pipeline related tests.

```shell
deno test -A --unstable                       # Run tests
deno test -A --unstable --coverage=.coverage  # Run tests + coverage (experimental)
deno coverage ./.coverage                     # Display coverage report (experimental)
```

### Writing your test

Each test file must have the `**/*.test.ts` naming pattern so Deno can detect them when using `deno test`. We use available Jest-like matchers in `imports/expect.ts`, which are based on the excellent [`expect`](https://deno.land/x/expect) module.

```typescript
import { expect, it } from './imports/expect.ts'

it('should work', () => {
  expect(1 + 1).toBe(2);
  expect(1).toBeGreaterThan(0);
  expect(true).toBeTruthy();
  expect(false).toBeFalsy();
  expect(() => someFunction()).toThrow();
  expect(() => anotherFunction()).toThrow(/.*something specific.*/gi);
  expect(somePromise()).rejects.toThrow();
  expect(somePromiseWhichReturnsTrue()).resolves.toBeTruthy();
})
```

### File watching tests

Related tests can be found in `core/watcher/mod.test.ts`.

Filesystem watching can be _tricky_ to test, especially if not confortable with [async iterators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of) and/or if not aware about asynchronous ops leaks, which Deno tracks for you:

```
AssertionError: Test case is leaking async ops.
Before:
  - dispatched: 3
  - completed: 2
After:
  - dispatched: 5
  - completed: 5

Make sure to await all promises returned from Deno APIs before
finishing test case.
```

Therefore, you shall find an `exec` method, allowing you to automatically set up temporary folders, run and safely terminate iterators.

```typescript
async function exec(fn: (path: string) => void) { ... }

it("should work", async () => {
  const events: Array<FsEvent> = await exec((path) => {
    // Do something with the filesystem..
    Deno.writeTextFileSync(join(path, "A.txt"), "Writing a file...");
  });
  // Process and assert events..
  expect(events.length).toBe(2);
  expect(events[1].kind).toBe("create");
  expect(events[1].entry.name).toBe("A.txt");
});
```
