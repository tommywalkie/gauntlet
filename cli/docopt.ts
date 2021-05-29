// deno-lint-ignore-file

import { blue, cyan, gray, green, yellow } from "../imports/std.ts";
import type { Flag, Option, Program } from "./types.ts";

const NEXT_LINE_ALINEA = "\n   ";

function render(
  program: Program,
  usageExamples: string[],
  optionsGuide: string[],
) {
  return `${program._name} ${yellow("v" + program._version)}

Usage:
   ${usageExamples.join(NEXT_LINE_ALINEA)}

Options:
   ${optionsGuide.join(NEXT_LINE_ALINEA)}

${program._copyright}`;
}

export function docopt(
  program: Program,
) {
  const commandsObj = Object.assign({ ...program.commands });
  const maxCmdLen = Math.max(
    ...(Object.keys(Object.assign({ ...program.commands }))
      .map((el) => commandsObj[el].alias.length) as number[]),
  );
  const maxOptLen = Math.max(
    ...(Object.keys({ ...program.options, ...program.flags }).map((command) =>
      ({ ...program.options, ...program.flags } as any)[command].aliases
        .join(", ").length
    )),
  );
  const usageExamples = Object.keys({ ...program.commands }).map((command) => {
    const { alias, description } = commandsObj[command];
    const example = green(alias) +
      Array.from(Array(maxCmdLen - alias.length).keys()).map((_) => " ").join(
        "",
      );
    return `${program._name} ${example}  ${gray(description)}`;
  });
  const optionsGuide = Array.from(
    new Set(
      Object.keys({ ...program.options, ...program.flags }).map((entry) => {
        const { aliases, description, defaultValue }: Option | Flag =
          (Object.assign({}, { ...program.options, ...program.flags }) as any)[
            entry
          ];
        const __flags = aliases.join(", ");
        const coloredFlags = aliases.map((el) => cyan(el)).join(", ");
        const optionDisplay = coloredFlags +
          Array.from(Array(maxOptLen - __flags.length).keys()).map((_) => " ")
            .join("");
        return `${optionDisplay}  ${gray(description)} ${
          defaultValue ? gray(`[default=${blue(String(defaultValue))}]`) : ""
        }`;
      }),
    ),
  );
  return render(program, usageExamples, optionsGuide);
}
