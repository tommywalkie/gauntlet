// Node.Buffer compatibility layer for Deno and the browser
import type { Buffer } from "../../imports/buffer.ts";

// Copyright 2019 Fred K. Schott. All rights reserved. MIT license.
export interface BaseOptions {
  fileExt: string;
  isDev: boolean;
  isHmrEnabled: boolean;
  isSSR: boolean;
  isPackage: boolean;
}

// Copyright 2019 Fred K. Schott. All rights reserved. MIT license.
export type PluginRunOptions = Pick<BaseOptions, "isDev">;

// Copyright 2019 Fred K. Schott. All rights reserved. MIT license.
export interface PluginLoadOptions extends BaseOptions {
  filePath: string;
}

// Copyright 2019 Fred K. Schott. All rights reserved. MIT license.
export type OnFileChangeProps = Pick<PluginLoadOptions, "filePath">;

// Copyright 2019 Fred K. Schott. All rights reserved. MIT license.
export interface PluginTransformOptions {
  id: string;
  contents: string | Buffer;
}

// Copyright 2019 Fred K. Schott. All rights reserved. MIT license.
export interface PluginOptimizeOptions {
  buildDirectory: string;
}

// Copyright 2019 Fred K. Schott. All rights reserved. MIT license.
export type PluginBuildResult = {
  code: string | Buffer;
  map?: string;
};

// Copyright 2019 Fred K. Schott. All rights reserved. MIT license.
export type BuildMap = Record<string, PluginBuildResult>;

// Copyright 2019 Fred K. Schott. All rights reserved. MIT license.
export type PluginLoadResult = BuildMap;

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
export interface PluginTransformResult {
  contents: string;
  map: string | RawSourceMap;
}

// Copyright 2019 Fred K. Schott. All rights reserved. MIT license.
export interface SnowpackPlugin {
  name: string;
  resolve?: {
    input: string[];
    output: string[];
  };
  load?(
    options: PluginLoadOptions,
  ): Promise<PluginLoadResult | string | null | undefined | void>;
  transform?(
    options: PluginTransformOptions,
  ): Promise<PluginTransformResult | string | null | undefined | void>;
  run?(options: PluginRunOptions): Promise<unknown>;
  optimize?(options: PluginOptimizeOptions): Promise<void>;
  cleanup?(): void | Promise<void>;
  knownEntrypoints?: string[];
  config?(snowpackConfig: SnowpackConfig): void;
  onChange?(props: OnFileChangeProps): void;
  markChanged?(file: string): void;
}

// Copyright 2019 Fred K. Schott. All rights reserved. MIT license.
export interface OptimizeOptions {
  entrypoints: "auto" | string[] | ((options: { files: string[] }) => string[]);
  preload: boolean;
  bundle: boolean;
  sourcemap: boolean | "both" | "inline" | "external";
  splitting: boolean;
  treeshake: boolean;
  manifest: boolean;
  minify: boolean;
  target: "es2020" | "es2019" | "es2018" | "es2017";
}

// Copyright 2019 Fred K. Schott. All rights reserved. MIT license.
export interface RouteConfigObject {
  src: string;
  dest: string | ((req: any, res: any) => void);
  match: "routes" | "all";
  _srcRegex: RegExp;
}

// Copyright 2019 Fred K. Schott. All rights reserved. MIT license.
export type MountEntry = {
  url: string;
  static: boolean;
  resolve: boolean;
};

// Copyright 2019 Fred K. Schott. All rights reserved. MIT license.
export interface SnowpackConfig {
  root: string;
  mode: "test" | "development" | "production";
  workspaceRoot?: string | false;
  extends?: string;
  exclude: string[];
  env?: Record<string, string | boolean | undefined>;
  mount: Record<string, MountEntry>;
  alias: Record<string, string>;
  plugins: SnowpackPlugin[];
  devOptions: {
    secure: boolean | { cert: string | Buffer; key: string | Buffer };
    hostname: string;
    port: number;
    openUrl?: string;
    open?: string;
    output?: "stream" | "dashboard";
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
