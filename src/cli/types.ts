export type SingleOrPair<T> = [T] | [T, T];

export type Input = boolean | string | number;

export interface Context {
  instance: Program;
  commands: Array<Input>;
  options: Record<string, Input>;
  values: Array<Input>;
}

export type Callback<T = void> = (props: CallbackProps) => Promise<T>;

export interface CallbackProps extends Omit<Context, "commands"> {
  options: Record<string, Input>;
  values: Array<Input>;
  // deno-lint-ignore no-explicit-any
  [key: string]: any;
}

export interface Option {
  aliases: SingleOrPair<string>;
  description: string;
  defaultValue: string | boolean;
}

export interface Flag extends Omit<Option, "defaultValue"> {
  defaultValue: boolean;
}

export interface Command {
  alias: string;
  description: string;
  callback: Callback;
  examples: string[];
}

export interface Program {
  commands: Array<Command>;
  flags: Record<string, Flag>[];
  options: Record<string, Option>[];
  _name: string;
  _version: string;
  _copyright: string;
  command(alias: string, description: string, callback: Callback): this;
  flag(aliases: SingleOrPair<string>, description: string): this;
  option(
    aliases: SingleOrPair<string>,
    description: string,
    defaultValue: Input,
  ): this;
  help(context: Context): void;
  parse(args: string[]): Context;
  fallback(callback: Callback): this;
  run(args: string[]): void;
}
