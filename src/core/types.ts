/**
 * File system events
 * 
 * This is basically a high-level `Deno.FsEvent` wrapper, leveraging
 * unintuitive behaviours on non-Unix systems with `Deno.watchFs`.
 */
export interface FileEvents {
    modify(path: WalkEntry): void;
    create(path: WalkEntry): void;
    remove(path: WalkEntry): void;
}

/**
 * Base events interface for `EventEmitter<T>` from `deno_events`,
 * should be used for fine-grained debugging and crash reporting.
 */
export interface LogEvents {
    fatal(description: string, error?: Error): void
    error(description: string, error?: Error): void
    warn(description: string): void
    info(description: string): void
    debug(description: string): void
}

// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
export interface FsEvent {
    kind: "any" | "access" | "create" | "modify" | "remove";
    paths: string[];
}

// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
export interface WalkEntry {
    path: string,
    name: string;
    isFile: boolean;
    isDirectory: boolean;
    isSymlink: boolean;
}

// Copyright 2019 Fred K. Schott. All rights reserved. MIT license.
export interface RawSourceMap {
    version: number;
    sources: string[];
    names: string[];
    sourceRoot?: string;
    sourcesContent?: string[];
    mappings: string;
    file: string;
}

// Copyright 2019 Fred K. Schott. All rights reserved. MIT license.
type OnFileChangeProps = {
      filePath: string
}

// Copyright 2019 Fred K. Schott. All rights reserved. MIT license.
export type SnowpackBuiltFile = {
    code: string | Uint8Array;
    map?: string;
};

// Copyright 2019 Fred K. Schott. All rights reserved. MIT license.
export type SnowpackBuildMap = Record<string, SnowpackBuiltFile>;

// Copyright 2019 Fred K. Schott. All rights reserved. MIT license.
export interface PluginLoadOptions {
    /** The absolute file path of the source file, on disk. */
    filePath: string;
    /** A helper for just the file extension of the source file (ex: ".js", ".svelte") */
    fileExt: string;
    /** True if builder is in dev mode (`snowpack dev` or `snowpack build --watch`) */
    isDev: boolean;
    /** True if HMR is enabled (add any HMR code to the output here). */
    isHmrEnabled: boolean;
    /** True if builder is in SSR mode */
    isSSR: boolean;
    /** True if file being transformed is inside of a package. */
    isPackage: boolean;
}

// Copyright 2019 Fred K. Schott. All rights reserved. MIT license.
export interface PluginTransformOptions {
    /** The absolute file path of the source file, on disk. */
    id: string;
    /** The extension of the file */
    fileExt: string;
    /** Contents of the file to transform */
    contents: string | Uint8Array;
    /** True if builder is in dev mode (`snowpack dev` or `snowpack build --watch`) */
    isDev: boolean;
    /** True if HMR is enabled (add any HMR code to the output here). */
    isHmrEnabled: boolean;
    /** True if builder is in SSR mode */
    isSSR: boolean;
    /** True if file being transformed is inside of a package. */
    isPackage: boolean;
}

// Copyright 2019 Fred K. Schott. All rights reserved. MIT license.
export interface PluginRunOptions {
    isDev: boolean;
}
  
/** map of extensions -> code (e.g. { ".js": "[code]", ".css": "[code]" }) */
// Copyright 2019 Fred K. Schott. All rights reserved. MIT license.
export type PluginLoadResult = SnowpackBuildMap;

// Copyright 2019 Fred K. Schott. All rights reserved. MIT license.
export type PluginTransformResult = {contents: string; map: string | RawSourceMap};

// Copyright 2019 Fred K. Schott. All rights reserved. MIT license.
export interface PluginOptimizeOptions {
    buildDirectory: string;
}

// Copyright 2019 Fred K. Schott. All rights reserved. MIT license.
export interface SnowpackPlugin {
    /** name of the plugin */
    name: string;
    /** Tell Snowpack how the load() function will resolve files. */
    resolve?: {
        /**
             file extensions that this load function takes as input (e.g. [".jsx",
            ".js", …])
        */
        input: string[];
        /**
             file extensions that this load function outputs (e.g. [".js", ".css"])
        */
        output: string[];
    };
    /** load a file that matches resolve.input */
    load?(options: PluginLoadOptions): Promise<PluginLoadResult | string | null | undefined | void>;
    /** transform a file that matches resolve.input */
    transform?(
        options: PluginTransformOptions,
    ): Promise<PluginTransformResult | string | null | undefined | void>;
    /** runs a command, unrelated to file building (e.g. TypeScript, ESLint) */
    run?(options: PluginRunOptions): Promise<unknown>;
    /** optimize the entire built application */
    optimize?(options: PluginOptimizeOptions): Promise<void>;
    /** cleanup any long-running instances/services before exiting.  */
    cleanup?(): void | Promise<void>;
    /** Known dependencies that should be installed */
    knownEntrypoints?: string[];
    /** read and modify the Snowpack config object */
    config?(snowpackConfig: SnowpackConfig): void;
    /** Called when a watched file changes during development. */
    onChange?(props: OnFileChangeProps): void;
    /** (internal interface, not set by the user) Mark a file as changed. */
    markChanged?(file: string): void;
}
  
/** Snowpack Build Plugin type */
// Copyright 2019 Fred K. Schott. All rights reserved. MIT license.
export type SnowpackPluginFactory<PluginOptions = object> = (
    snowpackConfig: SnowpackConfig,
    pluginOptions?: PluginOptions,
) => SnowpackPlugin;

// Copyright 2019 Fred K. Schott. All rights reserved. MIT license.
export type MountEntry = {
    url: string;
    static: boolean;
    resolve: boolean;
};

// Copyright 2019 Fred K. Schott. All rights reserved. MIT license.
export interface OptimizeOptions {
    entrypoints: 'auto' | string[] | ((options: {files: string[]}) => string[]);
    preload: boolean;
    bundle: boolean;
    sourcemap: boolean | 'both' | 'inline' | 'external';
    splitting: boolean;
    treeshake: boolean;
    manifest: boolean;
    minify: boolean;
    target: 'es2020' | 'es2019' | 'es2018' | 'es2017';
}

// Copyright 2019 Fred K. Schott. All rights reserved. MIT license.
export interface RouteConfigObject {
    src: string;
    dest: string | ((req: any, res: any) => void);
    match: 'routes' | 'all';
    _srcRegex: RegExp;
}
  
// Copyright 2019 Fred K. Schott. All rights reserved. MIT license.
export interface SnowpackConfig {
    root: string;
    workspaceRoot?: string | false;
    extends?: string;
    exclude: string[];
    env?: Record<string, string | boolean | undefined>;
    mount: Record<string, MountEntry>;
    alias: Record<string, string>;
    plugins: SnowpackPlugin[];
    devOptions: {
        secure: boolean | {cert: string | Uint8Array; key: string | Uint8Array};
        hostname: string;
        port: number;
        openUrl?: string;
        open?: string;
        output?: 'stream' | 'dashboard';
        hmr?: boolean;
        hmrDelay: number;
        hmrPort: number | undefined;
        hmrErrorOverlay: boolean;
    };
    buildOptions: {
        out: string;
        baseUrl: string;
        metaUrlPath: string;
        clean: boolean;
        sourcemap: boolean;
        watch: boolean;
        htmlFragments: boolean;
        jsxFactory: string | undefined;
        jsxFragment: string | undefined;
        jsxInject: string | undefined;
        ssr: boolean;
        resolveProxyImports: boolean;
    };
    testOptions: {
        files: string[];
    };
  
    // TODO: Consider adding packageOptions or removing it for good;
    // packageOptions: PackageSourceLocal | PackageSourceRemote;
  
    optimize?: OptimizeOptions;
    routes: RouteConfigObject[];
    experiments: {};
    _extensionMap: Record<string, string[]>;
}

/**
 * Base filesystem bindings for watchers
 */
export interface FileSystemLike {
    cwd: string
    readFile: (path: string) => Promise<Uint8Array>
    exists: (filePath: string) => Promise<boolean>
    lstat: (path: string) => Promise<Omit<Omit<WalkEntry, "name">, "path">>
    walk: (currentPath: string) => AsyncIterableIterator<WalkEntry>
    watch: (paths: string | string[], options?: { recursive: boolean }) => AsyncIterableIterator<FsEvent>
}