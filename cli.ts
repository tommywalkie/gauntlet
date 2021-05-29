import { setupProgram } from "./cli/mod.ts";
import { dev } from "./commands/dev.ts";
import { format } from "./imports/std.ts";

const program = setupProgram();

const copyright = `Copyright ${format(new Date(), "yyyy")} Tom Bazarnik
Licensed under Apache License, Version 2.0.`;

if (import.meta.main) {
  program.name("gauntlet")
    .version("0.1.0")
    .copyright(copyright)
    .flag(["--version", "-v"], "Get Gauntlet CLI version")
    .flag(["--help", "-h"], "Display help")
    .command("dev", "Run development server", dev)
    .run([...Deno.args]);
}
