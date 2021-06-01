<!-- deno-fmt-ignore-file -->

<p align="center">
  <img height="120" src="https://raw.githubusercontent.com/tommywalkie/gauntlet/main/.github/assets/logo.svg">
  <h1 align="center">Gauntlet</h1>
</p>
<p align="center">
  <i>Lightning-fast front-end tool which does put a smile on my face</i>
</p>
<p align="center">
  <a href="https://deno.land/x/gauntlet"><img src="https://img.shields.io/endpoint?url=https%3A%2F%2Fdeno-visualizer.danopia.net%2Fshields%2Flatest-version%2Fx%2Fgauntlet%2Fmod.ts" /></a>
  <a href="https://deno-visualizer.danopia.net/dependencies-of/https/deno.land/x/gauntlet/mod.ts?rankdir=LR"><img src="https://img.shields.io/endpoint?url=https%3A%2F%2Fdeno-visualizer.danopia.net%2Fshields%2Fcache-size%2Fhttps%2Fdeno.land%2Fx%2Fgauntlet%2Fmod.ts" alt="Current cache size" /></a>
  <a href="https://deno-visualizer.danopia.net/dependencies-of/https/deno.land/x/gauntlet/mod.ts?rankdir=LR"><img src="https://img.shields.io/endpoint?url=https%3A%2F%2Fdeno-visualizer.danopia.net%2Fshields%2Fupdates%2Fhttps%2Fdeno.land%2Fx%2Fgauntlet%2Fmod.ts" /></a>
</p>
<p align="center">
  <a href="https://github.com/tommywalkie/gauntlet/actions/workflows/windows.yml"><img src="https://img.shields.io/github/workflow/status/tommywalkie/gauntlet/Windows?logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAABHUlEQVRIS+1Xi23CMBB9NwHdgG4AG7RswAZ0E2ATVmCCZgTYADZgg1c9dAnBUmLnQyokW4qi6Ox7d8/23Yvhn4ZNiUtyCeBiZrfRgd35DMA3gA8AAvv0R3muzKzoDUxSjhfuvA4SI7EdOIhczkrnRzPbkWQMocH+ACYpKrY1SvTdNPZjAiub38QMMnAiUdW0pz3OVLfRlw/XoMOlgvGT6KFQrSW5a5hfRPycqibhlWvTsuCiruL2K4Cb1+nEWJ+mnevAna4TAGWVWunC4Prf4wzccaP7U53b4ltSrcp1cOEmATdNkwhRvJKVklRvSVRJ1S8A43Wnjnt0n05yHWhmBSc9HRvDdHWTd9fbMoeCfu5rXgPclu5Lf2FiPJf2P5TA7h8vNz6jAAAAAElFTkSuQmCC&label=Windows"/></a>
  <a href="https://github.com/tommywalkie/gauntlet/actions/workflows/ubuntu.yml"><img src="https://img.shields.io/github/workflow/status/tommywalkie/gauntlet/Ubuntu?logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAACVUlEQVRIS8WXgVEUQRBF/49AiUCMQIlAiUCJAMlAIhAjUCJQIsAMhAiACIQMIIK23lbPVt/UHburnHbV1VXdzPTv/vO7e876T+Zt4UbEB0mHkm4lHdu+r1hbAY6Ij5K+FKBr23v/AvhC0puOzT3b1+23P8o4It5LeidpV9LbAgDgsaSTXK/YO5XuRcAR8VwSd1dp7GVyJumrJIJ4loufbRPMaLOAExCwOxxEBIJ58YgwuWMCeC3pvlK8iOqI4G5e5aGX6fBc0g2OU7nQDlDLkuD4YGQMA/MzjojvWRbt0IXt/YjYtd0cjw6zjKC6BcAawSGucf+jVEcEwvnZUXpkm2A2Wl4NGTaW2DsEPIvqjmLO0AjIZtISnCuqWthvlG/MOCK4r6uCcGm7ls4c8J6xM9tUhVaA836IEEVSOrUkDmz/mETrNnQVgMJ3VoDXiOggVfpp2GjPKr0+sIigfgcfaUMjGZyhUEm/ukOX2YEQF/XLnsWWvutZ+vZs4Fvb1O9iS+AqsJsROLPu63X7VLc0UlzQQhCIC5r5xp5CXA+2B39LymmlAczhfE0DWl9OaxRZezTLSxsIfaAKa7qB5L3/TcvkmmhCzVYa0GRtrqnvwcHEkGCENm0A/EAQs4dEEd2mscjv/VhsgHdlLJ4sHotJOc4YDtTznIfAkSTaK9MJJY9vrZbMJNVVcDlxeF3UFthr8jTLsZbiqW3OjbYIuFDPY48Piq2vSdosAE/72JtTu3k123neTgWQHfBb2Ud/rqW1uXNNOZ9aT3CGPsJC1dv/CzMVFOu/AZB7Bi7zlZ76AAAAAElFTkSuQmCC&label=Ubuntu"/></a>
  <a href="https://github.com/tommywalkie/gauntlet/actions/workflows/macos.yml"><img src="https://img.shields.io/github/workflow/status/tommywalkie/gauntlet/MacOS?logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAABrUlEQVRIS92Wi03DQBBEZyoAOiAdhAoIFUAqACoAKgAqgA6ACiAVEDqgA0IFQAWDBp2R49z5bHwBiZUsRcr63u2s90P8kbEUV9I2gH0AryQfcucWAUu6AHAeYGckr9cOlnQL4LAG2iH5vFawpAMA9zXIE8lJDur/B0ktaQ5gN4A+AEy6RFsCrJ9AS4CdX0f9QPK9i8SVT6vUkjYBnFjC8CxqoJkPCWVkH+fbJWWr/C5J+veKJcHhw7kBYHjMHKGfCpbycXlZmSWLgiU5wsc+0mV8t5qpWAEHeV9aIu17n+NOEUs6BXDV9/SEv3PsrpbPcaM2h/Dds5P5j0ld1eYQqN+9I3mUOmSd4KTMvsy/BM9IuqlELRaxm8LG0ASH90edO5ckbw/eJEqYe/i0azmVrGMz3S7dNpeGSKpzvZUIt3bGguSofmaqV5eU27yVD+23hsQeSc/tb2sbi6WijpZVG9hz2EN8SGl5DxvHSiq3gTS3yL7f3DS13Ge3TElu9N5E6uZInDPvz+OwFjWVic7h6pAs2I5hr/IFLP88FkVYlXyJr9pNdaxe4L76dvH/BL1gpR+vRyf1AAAAAElFTkSuQmCC&label=MacOS"/></a>
</p>




## Overview

Gauntlet is a _work-in-progress_ naive and fast ES Modules powered frontend tool based on ESBuild, intended for Deno and the browser.

## Goals

-  <img src="https://www.thecolorapi.com/id?hex=993366&format=svg&named=false&w=12&h=12">  <!-- Power -->_Very_ fast
-  <img src="https://www.thecolorapi.com/id?hex=00CCFF&format=svg&named=false&w=12&h=12">  <!-- Space -->Browser-compatible at the core, ESM bundles, no `deps.ts`
-  <img src="https://www.thecolorapi.com/id?hex=339966&format=svg&named=false&w=12&h=12">  <!-- Time -->Hot module replacement support (**_planned!_**)
-  <img src="https://www.thecolorapi.com/id?hex=FFFF00&format=svg&named=false&w=12&h=12">  <!-- Mind -->Subscribable, watchable, virtual filesystem support
-  <img src="https://www.thecolorapi.com/id?hex=FF9900&format=svg&named=false&w=12&h=12">  <!-- Soul -->Dependency pre-bundling (**_planned!_**)
-  <img src="https://www.thecolorapi.com/id?hex=FF0000&format=svg&named=false&w=12&h=12">  <!-- Reality -->Out-of-the-box TypeScript/JSX support, plus Snowpack plugins (**_planned!_**)

## Contributing

Please follow the available [contributing guide](https://github.com/tommywalkie/gauntlet/blob/main/CONTRIBUTING.md), including most instructions for building from source, testing, the project structure and the planned features.

The **v1.0.0** roadmap is available in [Github Projects](https://github.com/tommywalkie/gauntlet/projects/1).

## License

Gauntlet is currently licensed under [Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0).

Gauntlet logo is licensed under [Creative Commons Attribution-ShareAlike 4.0 International License](https://creativecommons.org/licenses/by-sa/4.0/).

© Copyright 2021 Tom Bazarnik.