import { expect, it } from "../../imports/expect.ts";
import { existsSync } from "../../imports/std.ts";
import { join } from "../../imports/path.ts";
import { DenoFileSystem as fs } from "../../server/utils.ts";
import { FileWatcher, watchFs } from "./mod.ts";
import { randomId } from "../utils.ts";

const testDir = join(Deno.cwd(), "__TEST__");
if (existsSync(testDir)) {
  Deno.removeSync(testDir, { recursive: true });
}
Deno.mkdirSync(testDir, { recursive: true });

function makeWatchableTempDir(): [string, FileWatcher] {
  const source = join(testDir, `./${randomId()}`);
  Deno.mkdirSync(source, { recursive: true });
  return [source, watchFs({ source, fs })];
}

async function exec(fn: (path: string) => void) {
  // Make a temporary directory for our test.
  const [source, watcher] = makeWatchableTempDir();
  const maxTimeout = Deno.build.os === "darwin" ? 8000 : 5000;
  // Stop the watcher if 5 seconds have passed, if still active..
  const emergencyStop = setTimeout(() => watcher.return(), maxTimeout);
  const events = [];
  const dispose = () => {
    // Safely dispose ressources.
    clearTimeout(emergencyStop);
    watcher.return();
  }

  // MacOS filesystem ops are VERY slow, at least on Github machines,
  // so we need to wait a bit before starting watching a folder
  // that may not be completely created.
  if (Deno.build.os === "darwin") {
    let i = 0;
    while (i < 5e3) {
      if ((i % 100) === 0) {
        if (existsSync(source)) break;
      }
      i++;
    }
  }

  let currentTimeout;
  for await (const event of watcher) {
    events.push(event);
    if (currentTimeout) {
      // Got new event! Override the previously set timeout.
      clearTimeout(currentTimeout);
      currentTimeout = setTimeout(dispose, 120);
    }
    else {
      // Exec tasks and start waiting until no more event happens..
      fn(source);
      currentTimeout = setTimeout(dispose, 500);
    }
  }
  return events;
}

it("should be able to run and pause a watcher", async () => {
  const watcher = watchFs({ source: "./", fs });
  setTimeout(() => watcher.return(), 300);
  // deno-lint-ignore no-empty
  for await (const _ of watcher) {}
  expect(true).toBeTruthy();
});

it("should be able to track newly added files", async () => {
  const events = await exec((path) => {
    Deno.writeTextFileSync(join(path, "A.txt"), "Hello world");
    Deno.writeTextFileSync(join(path, "B.txt"), "Hello world");
    Deno.writeTextFileSync(join(path, "C.txt"), "Hello world");
    Deno.writeTextFileSync(join(path, "D.txt"), "Hello world");
    Deno.writeTextFileSync(join(path, "E.txt"), "Hello world");
    Deno.writeTextFileSync(join(path, "F.txt"), "Hello world");
  });
  expect(events[0].kind).toBe("watch");
  expect(events.length).toBe(13);
});

it("should be able to track newly added files", async () => {
  const events = await exec((path) => {
    Deno.writeTextFileSync(join(path, "A.txt"), "Hello world");
    Deno.writeTextFileSync(join(path, "B.txt"), "Hello world");
    Deno.writeTextFileSync(join(path, "C.txt"), "Hello world");
    Deno.writeTextFileSync(join(path, "D.txt"), "Hello world");
    Deno.writeTextFileSync(join(path, "E.txt"), "Hello world");
    Deno.writeTextFileSync(join(path, "F.txt"), "Hello world");
  });
  expect(events[0].kind).toBe("watch");
  expect(events.length).toBe(13);
});

it("should be able to track newly added files", async () => {
  const events = await exec((path) => {
    Deno.writeTextFileSync(join(path, "A.txt"), "Hello world");
    Deno.writeTextFileSync(join(path, "B.txt"), "Hello world");
    Deno.writeTextFileSync(join(path, "C.txt"), "Hello world");
    Deno.writeTextFileSync(join(path, "D.txt"), "Hello world");
    Deno.writeTextFileSync(join(path, "E.txt"), "Hello world");
    Deno.writeTextFileSync(join(path, "F.txt"), "Hello world");
  });
  expect(events[0].kind).toBe("watch");
  expect(events.length).toBe(13);
});

it("should be able to track newly added files", async () => {
  const events = await exec((path) => {
    Deno.writeTextFileSync(join(path, "A.txt"), "Hello world");
    Deno.writeTextFileSync(join(path, "B.txt"), "Hello world");
    Deno.writeTextFileSync(join(path, "C.txt"), "Hello world");
    Deno.writeTextFileSync(join(path, "D.txt"), "Hello world");
    Deno.writeTextFileSync(join(path, "E.txt"), "Hello world");
    Deno.writeTextFileSync(join(path, "F.txt"), "Hello world");
  });
  expect(events[0].kind).toBe("watch");
  expect(events.length).toBe(13);
});

it("should be able to track newly added files", async () => {
  const events = await exec((path) => {
    Deno.writeTextFileSync(join(path, "A.txt"), "Hello world");
    Deno.writeTextFileSync(join(path, "B.txt"), "Hello world");
    Deno.writeTextFileSync(join(path, "C.txt"), "Hello world");
    Deno.writeTextFileSync(join(path, "D.txt"), "Hello world");
    Deno.writeTextFileSync(join(path, "E.txt"), "Hello world");
    Deno.writeTextFileSync(join(path, "F.txt"), "Hello world");
  });
  console.log(events);
  expect(events[0].kind).toBe("watch");
  expect(events.length).toBe(13);
});
