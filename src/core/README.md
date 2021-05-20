<!-- deno-fmt-ignore-file -->

<p align="center">
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

Gauntlet will be featuring lightweight and browser-compatible core modules, enabling anyone to integrate with any runtime, as long as the latter supports a fair amount of ES6+ features, including [modules via script tag](https://caniuse.com/es6-module) (for browsers), [async iterators](https://caniuse.com/mdn-javascript_builtins_asynciterator), [nullish coalescing](https://caniuse.com/mdn-javascript_operators_nullish_coalescing)  (`??`), [spread in array literals](https://caniuse.com/mdn-javascript_operators_nullish_coalescing) and [optional chaining](https://caniuse.com/mdn-javascript_operators_optional_chaining) (`?.`).

| <img src="https://raw.githubusercontent.com/gilbarbara/logos/master/logos/deno.svg" alt="Deno" width="24px" height="24px" /> | <img src="https://nodejs.org/static/images/favicons/favicon.ico" alt="Node" width="24px" height="24px" /> | <img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/edge/edge_48x48.png" alt="IE / Edge" width="24px" height="24px" /> | <img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png" alt="Firefox" width="24px" height="24px" /> | <img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png" alt="Chrome" width="24px" height="24px" /> | <img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari/safari_48x48.png" alt="Safari" width="24px" height="24px" /> | <img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari-ios/safari-ios_48x48.png" alt="iOS Safari" width="24px" height="24px" /> | <img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/opera/opera_48x48.png" alt="Opera" width="24px" height="24px" /> |
| ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| Deno 1.x                                                     | Node 10                                                      | Edge 80                                                      | Firefox 74                                                   | Chrome 80                                                    | Safari 13                                                    | iOS Safari 13 _*_                                            | Opera 67                                                     |

_*_ iOS Safari doesn't support [Symbol.asyncIterator](https://caniuse.com/mdn-javascript_builtins_symbol_asynciterator), but the latter is polyfilled during build.

