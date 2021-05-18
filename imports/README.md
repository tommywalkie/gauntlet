# Gauntlet `imports`

The hereby folder is basically a `deps.ts` replacement, using [Meteor-inspired `imports`](https://guide.meteor.com/structure.html#javascript-structure).

Global dependency stores like the ones Deno and `pnpm` provide are great, but that doesn't mean we have to accept whatever dependency when fetching a single utility module. Some [`deps.ts` convention](https://deno.land/manual/examples/manage_dependencies) was introduced in order to overcome dependency management issues and the lack of a package manager, but it comes at the cost of [increased compile times and bundle sizes](https://dev.to/wongjiahau/why-deps-ts-and-mod-ts-is-bad-in-deno-bjo), and privatizing modules.

```
std ─────────────────────────┐
typescript (3.97MB) ─────────┤
@babel/core (2.07MB) ────────┤
react (981.85KB) ────────────┼─────► deps.ts
drollup (763.48KB) ──────────┤
postcss (313.87KB) ──────────┤
...etc. ─────────────────────┘
```

Meteor `imports` can help us overcome the aforementioned issues, while also isolating dependencies, each in their own module.

```
 /imports
┌────────────────┐
│ expect ────────┼────────────┬───┬─────► A.test.ts
│ deno_events ───┼────┐       └───┼─┬───► B.test.ts
│ graphqlade ────┼────┴───► A.ts ─┘ │
│ esbuild ───────┼────────► B.ts ───┘
└────────────────┘
```