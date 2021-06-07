import { defaultEmitter, runServer } from "../mod.ts";

export async function dev() {
  const devServer = await runServer({
    port: 8000,
    eventSource: defaultEmitter,
    mounts: ["./core"],
  });

  for await (const _ of devServer) {
    // TODO
  }
}
