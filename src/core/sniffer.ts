const KEYWORD = "(import|export)"
const CONTENT = "((?:(?:[\\w \\$\\{\\},\\n]+)|\\*(?: as [\\w\\n]+)?))"
const LOCATION = "(?:[\\\"\\']([\\w \\.\\-\\~\\/\\@\\:\\+\\?\\=\\&]+)[\\\"\\'])"

// https://regex101.com/r/KMI8eO/1
const MODULE_RE = new RegExp(`${KEYWORD} (?:${CONTENT} from )?${LOCATION};?`, 'gm')

/**
 * Matched EcmaScript 6 Modules statement, which :
 * - **should** have a keyword (`import` or `export`) 
 * - **may (not)** have content (`import './something.js'` is valid)
 * - **should** have a location (path or URL)
 */
export interface ModuleStatement {
    originalInput: string
    keyword: string
    content?: string
    location: string
}

/**
 * Detects `import` and `export` (multi-line) statements from some content.
 * 
 * **Note**: It is only meant for matching dependency imports from explicit
 * places (paths or URLs) or ambiguous ones (bare specifiers), this won't match
 * regular variable exports like any proper AST walker would do.
 * 
 * ```typescript
 * // ✅ Matched!
 * import { something } from './somewhere.ts'
 * import { something as alias } from './somewhere.ts'
 * export { something } from './somewhere.ts'
 * import './something.ts'
 * import React from 'react'
 * import * as React from 'react'
 * import * as React from 'https://cdn.skypack.dev/react'
 * import React, { useState } from 'react'
 * import { useState, useEffect } from 'react'
 * import {
 *   onMount,
 *   onDestroy
 * } from 'svelte'
 * 
 * // ❌ Nope
 * export default something
 * export { something }
 * export function() { ... }
 * export class { ... }
 * export let whatever
 * ```
 */
export function sniffModules(code: string): ModuleStatement[] {
    return [...code.matchAll(MODULE_RE)].map(match => {
        return {
            originalInput: match[0],
            keyword: match[1],
            content: match[2],
            location: match[3]
        }
    })
}