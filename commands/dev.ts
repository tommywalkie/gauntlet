import { defaultEmitter, runDevServer } from "../mod.ts";

// Ideally, the production-ready dev server will be able to
// catch all internal errors and gracefully stopping
// its HTTP server, file watchers and ESBuild,
// enabling us to remove this line.
import * as esbuild from "../imports/esbuild.ts";

export async function dev() {
  try {
    const devServer = runDevServer({
      port: 8000,
      eventSource: defaultEmitter,
      mounts: ["./src", "./imports"],
      // mounts: ["./src"],
    });

    for await (const _ of devServer) {
      // TODO
    }
  } catch (error) {
    defaultEmitter.emit(
      "fatal",
      `Unhandled error happened with dev server.
Consider raising an issue on https://github.com/tommywalkie/gauntlet/issues.`,
    );
    console.error(error);
    // Like aforementionned, if some fatal error happens,
    // stop the ESBuild service.
    esbuild.stop();
    defaultEmitter.emit("debug", "Gracefully stopped the ESBuild service");
    defaultEmitter.emit("terminate");
  }
}
