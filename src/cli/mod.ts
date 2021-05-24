// deno-lint-ignore-file

import { docopt } from "./docopt.ts";
import { format, yellow } from "../../imports/std.ts";

import type {
  Callback,
  Command,
  Context,
  Flag,
  Input,
  Option,
  Program,
  SingleOrPair,
} from "./types.ts";

export const FLAG_PATTERN: RegExp = /^\-\-?(?<flag>[a-zA-Z]+)$/;
export const OPTION_PATTERN: RegExp =
  /^\-\-?(?<flag>[a-zA-Z]+)[\= ](?<value>[\w\\\/\:\.\,\@]+)$/;

export function sanitizeValue(value: Input) {
  return value === "true" ? true : value === "false" ? false : value;
}

export function uniques(a: Array<string>, b: string) {
  return a.includes(b) ? a : [...a, b];
}

function __aliases(collection: Record<string, any>): Array<string> {
  return [].concat(
    ...Object.keys(collection)
      .map((key) => (collection as any)[key].aliases),
  )
    .reduce(uniques, []);
}

export class ProgramInstance implements Program {
  commands: Array<Command> = [];
  flags: Record<string, Flag>[] = [];
  options: Record<string, Option>[] = [];
  _version: string = "0.0.0";
  _name: string = "<my-cli>";
  _copyright: string = `Copyright ${format(new Date(), "yyyy")} <author>`;
  private __fallback: Callback = async (inputs: any) => this.help(inputs);
  version(v: string) {
    this._version = v;
    return this;
  }
  name(n: string) {
    this._name = n;
    return this;
  }
  copyright(c: string) {
    this._copyright = c;
    return this;
  }
  flag(
    aliases: SingleOrPair<string>,
    description: string = "",
  ) {
    aliases.forEach((label: string) =>
      (this.flags as any)[label] = {
        aliases,
        description,
        defaultValue: false,
      } as Flag
    );
    return this;
  }
  option(
    aliases: SingleOrPair<string>,
    description: string = "",
    defaultValue: Input = false,
  ) {
    aliases.forEach((label: string) =>
      (this.options as any)[label] = {
        aliases,
        description,
        defaultValue,
      } as Option
    );
    return this;
  }
  command(
    alias: string,
    description: string = "",
    callback: Callback,
    examples: string[] = [],
  ) {
    (this.commands as any)[alias] = {
      alias,
      description,
      callback,
      examples,
    } as Command;
    return this;
  }
  help(parsed: Context) {
    console.log(docopt(this));
  }
  parse = (
    args: string[] = [],
  ): Context => {
    let options: Record<string, Input> = {};
    let values: string[] = [];
    let commands: string[] = [];
    let __expect_command: boolean = true;
    args.forEach((arg, index) => {
      // For now, we only need to support single commands
      // $ gauntlet [command] [--any-flag <anything_else>]
      if (index > 1) __expect_command = false;

      // Get the previous argument, if exists
      const previous = index > 0 ? args[index - 1] : "";

      // If this is a flag, defaults the flag value to `true`
      // regardless of the actual expected value.
      // $ gauntlet -v
      if (FLAG_PATTERN.test(arg)) {
        options[arg.replace(FLAG_PATTERN, "$<flag>")] = true;
        __expect_command = false;
      } // If this is a flag followed by an equal sign and a value,
      // in that case set the flag value to the new one.
      // $ gauntlet --out-file=./output.js
      else if (OPTION_PATTERN.test(arg)) {
        options[arg.replace(OPTION_PATTERN, "$<flag>")] = sanitizeValue(
          arg.replace(OPTION_PATTERN, "$<value>"),
        );
        __expect_command = false;
      } // If the previous argument was a flag, set the previously registered
      // flag value to the new one.
      // $ gauntlet --out-file ./output.js
      else if (
        index > 0 &&
        OPTION_PATTERN.test(`${previous} ${arg}`) &&
        !__aliases(this.flags).includes(previous)
      ) {
        options[previous.replace(FLAG_PATTERN, "$<flag>")] = sanitizeValue(arg);
        __expect_command = false;
      } // If the argument is a value and is included in registered commands
      // via `<ProgramCli>.command`, register the value as a requested command.
      // $ gauntlet status
      else if (__expect_command && Object.keys(this.commands).includes(arg)) {
        commands.push(arg);
      } // Finally, register any unparsed value as input values
      // $ gauntlet a b c
      else {
        __expect_command = false;
        values.push(arg);
      }
    });
    return { instance: this, commands, options, values };
  };
  public fallback(callback: Callback) {
    this.__fallback = callback;
    return this;
  }
  run(args: string[]) {
    const _this = this;
    const { commands, options, values } = this.parse(args);

    // Uncomment this, for CLI input debuggging
    // console.log({commands, options, values})

    if (
      Object.keys(options).includes("version") ||
      Object.keys(options).includes("v")
    ) {
      console.log(
        `${this._name} ${yellow("v" + this._version)}\n${this._copyright}`,
      );
    } else if (
      Object.keys(options).includes("help") ||
      Object.keys(options).includes("h")
    ) {
      this.help({ instance: _this, commands, options, values });
    } else if (commands.length) {
      this.commands[(commands as any)[0]].callback({
        instance: _this,
        options,
        values,
      });
    } else {
      this.__fallback({
        instance: _this,
        options,
        values,
      });
    }
  }
}

export function setupProgram() {
  return new ProgramInstance();
}
