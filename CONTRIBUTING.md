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
├─── src            # The actual source code
|   ├─── cli        # Command-line source code
|   ├─── core       # Browser-compatible core modules
|   └─── server     # Deno-based development server
├   build.ts        # Build script for NPM builds
├   cli.ts          # Command-line program entrypoint
└   mod.ts          # Module entrypoint
```

## Style guide

Gauntlet is intended to be built upon, and extensible via plugins. Although the product is simple, various dependencies may be needed for different use cases, this is why some style rules need to be followed.

- Avoid using any bare import mechanism.
- Use 2-space indentation (or just use `deno fmt`).
- Modules inside `src/core/` shall be browser-compatible.
- Modules inside `src/cli/` shall be browser-compatible.
- Use `deno info <URL>` before adding any dependency.
- Any dependency shall reside in its own file under `imports/`, [similarly to Meteor projects](https://guide.meteor.com/structure.html#javascript-structure).
- Any dependency shall be versioned and providing types.
  - Prefer using [esm.sh](https://esm.sh/) wherever possible, which directly provide bundles and types.
  - If using [jsDelivr](https://www.jsdelivr.com/), find types and use `// @deno-types="<module>.d.ts"`.
  - If using [Skypack](https://www.skypack.dev/), try using `?dts` when requesting modules.
  - If using [`std`](https://deno.land/std), look for [browser-compatibility comments](https://deno.land/manual@v1.10.2/contributing/style_guide#document-and-maintain-browser-compatibility).
  - If using Github raw files, use commit permalinks.
- Avoid cyclic imports.

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

