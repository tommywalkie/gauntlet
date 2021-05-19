import { runDevServer } from "../../server.ts";
import { defaultEmitter } from "../../emitter.ts";
import * as esbuild from "../../../imports/esbuild.ts";

export async function dev(_props: any) {
  try {
    const devServer = runDevServer({
      port: 8000,
      eventSource: defaultEmitter,
      mounts: [ './src', './imports' ]
      // mounts: ["./src"],
    });

    for await (const _ of devServer) {
    }
  } catch (error: any) {
    defaultEmitter.emit(
      "fatal",
      `The following unhandled error happened with dev server.\nConsider raising an issue on https://github.com/tommywalkie/gauntlet/issues.`,
    );
    console.error(error);
    esbuild.stop();
    defaultEmitter.emit("debug", "Gracefully stopped the ESBuild service");
    defaultEmitter.emit("terminate");
  }
}
