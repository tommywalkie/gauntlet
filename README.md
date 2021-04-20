<p align="center">
  <h1 align="center">Gauntlet</h1>
</p>
<p align="center">
  <i>Lightning-fast front-end tool which does put a smile on my face</i>
</p>



## Overview

Gauntlet is a _work-in-progress_ naive and fast ES Modules powered frontend tool based on Deno and ESBuild.

## Goals

<!-- Purposely designed to match Marvel Cinematic Universe Infinity Stones and their powers (https://en.wikipedia.org/wiki/Infinity_Gems#Description) -->

- 🟣 _Very_ fast
- 🔵 Browser-compatible at the core, modularized codebase (no `deps.ts`)
- 🟢 Discoverable, backed by XState statecharts (**_planned!_**)
- 🟡 Subscribable, log and watch for _any_ event the way _you_ want
- 🟠 Supports Snowpack plugins (**_planned!_**)
- 🔴 Supports TypeScript and JSX via ESBuild

## Contributing

#### Submitting a Pull Request

Here is a couple of rules of thumb for any submitted pull request:

- Please be respectful and mindful of your language
- Please use english language for any comment through Github or the source code
- Fork the hereby repo and follow the [Github flow](https://guides.github.com/introduction/flow/)
- Give the PR a descriptive title

#### Building from source

Clone the hereby repo or, if intending to submit a PR, your own fork.

```shell
git clone https://github.com/tommywalkie/gauntlet
```

##### Prerequisites

- Deno 1.8+
- Deno Visual Studio Code extension

**Note**: No need to install ESBuild yourself, this is done automatically by the official Deno module itself, or retrieved via network if using the WebAssembly version.

##### Testing

Launch tests with Deno:

```shell
deno test
```

### Style guide

Contributing section is still _work-in-progress_, but here is a couple notes about the basic idea:

- All the platform-agnostic source code shall reside in `src/core/`
- [Similarly to Meteor projects](https://guide.meteor.com/structure.html#javascript-structure), individual dependencies shall be settled under `imports/`
- Prefer JS/TS/native dependencies over WebAssembly ones unless necessary (_e.g._ ESBuild for the browser)
- Prefer modularized dependencies over heavy centralized ones using, inter alia, the [`deps.ts` convention](https://deno.land/manual/examples/manage_dependencies) (*i. e.* please don't make accustomed Lodash users vendor the whole `deno.land/x`)
- Most core features shall be event-driven, using the available `EventEmitter` implementation in `imports/deno_events.ts` which is based on [`deno_events`](https://deno.land/x/deno_events) for type safety
- Test files (`**/*.test.ts`) use the available Jest-like matchers in `imports/expect.ts` which are based on [`expect`](https://deno.land/x/expect)

## License

Gauntlet is currently licensed under [Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0).

© Copyright 2021 Tom Bazarnik.