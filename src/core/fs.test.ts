import { expect, it } from "../../imports/expect.ts";
import { createVirtualFileSystem } from "./fs.ts";

it("should be able to set up a filesystem", () => {
  const fs = createVirtualFileSystem<string>();
  expect(fs.getRoot().length).toBe(0);
});

it("should be able to synchronously add a file to a filesystem", () => {
  const fs = createVirtualFileSystem<string>();
  expect(fs.getRoot().length).toBe(0);
  fs.writeSync("/hello.txt", "world");
  expect(fs.getRoot().length).toBe(1);
});

it("should be able to asynchronously add a file to a filesystem", async () => {
  const fs = createVirtualFileSystem<string>();
  expect(fs.getRoot().length).toBe(0);
  await fs.write("/hello.txt", "world");
  expect(fs.getRoot().length).toBe(1);
});

it("should be able to synchronously remove a file to a filesystem", () => {
  const fs = createVirtualFileSystem<string>();
  expect(fs.getRoot().length).toBe(0);
  fs.writeSync("/hello.txt", "world");
  expect(fs.getRoot().length).toBe(1);
  fs.removeSync("/hello.txt");
  expect(fs.getRoot().length).toBe(0);
});

it("should be able to asynchronously remove a file to a filesystem", async () => {
  const fs = createVirtualFileSystem<string>();
  expect(fs.getRoot().length).toBe(0);
  await fs.write("/hello.txt", "world");
  expect(fs.getRoot().length).toBe(1);
  await fs.remove("/hello.txt");
  expect(fs.getRoot().length).toBe(0);
});

it("should be able to synchronously remove a non-empty directory to a filesystem", () => {
  const fs = createVirtualFileSystem<string>();
  expect(fs.getRoot().length).toBe(0);
  fs.writeSync("/A");
  fs.writeSync("/A/B.txt", "world");
  fs.writeSync("/A/C.txt", "world");
  expect(fs.getRoot().length).toBe(3);
  fs.removeSync("/A");
  expect(fs.getRoot().length).toBe(0);
});

it("should be able to asynchronously remove a non-empty directory to a filesystem", async () => {
  const fs = createVirtualFileSystem<string>();
  expect(fs.getRoot().length).toBe(0);
  await fs.write("/A");
  await fs.write("/A/B.txt", "world");
  await fs.write("/A/C.txt", "world");
  expect(fs.getRoot().length).toBe(3);
  await fs.remove("/A");
  expect(fs.getRoot().length).toBe(0);
});

it("should be able to get filesystem current working directory", () => {
  const fs = createVirtualFileSystem<string>();
  expect(fs.cwd().replace("\\", "/")).toBe("/");
});

it("should be able to set filesystem current working directory", () => {
  const fs = createVirtualFileSystem<string>();
  fs.mkdirSync("/A");
  fs.setCwd("/A");
  expect(fs.cwd().replace("\\", "/")).toBe("/A");
});

it("should be able to add a file to a filesystem using relative path", () => {
  const fs = createVirtualFileSystem<string>();
  fs.mkdirSync("/A");
  fs.setCwd("/A");
  fs.writeSync("../B.txt", "hello world");
  expect(fs.existsSync("/B.txt")).toBeTruthy();
});

it("should be able to remove a file to a filesystem using relative path", () => {
  const fs = createVirtualFileSystem<string>();
  fs.mkdirSync("/A");
  fs.setCwd("/A");
  fs.writeSync("/B.txt", "hello world");
  fs.removeSync("../B.txt");
  expect(fs.existsSync("/B.txt")).toBeFalsy();
});

it("should be able to asynchronously add a file to a filesystem", async () => {
  const fs = createVirtualFileSystem<string>();
  expect(fs.getRoot().length).toBe(0);
  await fs.write("/hello.txt", "world");
  expect(fs.getRoot().length).toBe(1);
});

it("should be able to synchronously walk a filesystem", () => {
  const fs = createVirtualFileSystem<string>();
  fs.add("/A.txt", "A");
  fs.add("/B.txt", "B");
  fs.add("/C");
  fs.add("/C/D.txt", "D");
  const entries = [];
  for (const entry of fs.walkSync("/")) {
    entries.push(entry);
  }
  const result = entries.map((el) => el.name).join("-");
  expect(result).toBe("A.txt-B.txt-C-D.txt");
});

it("should be able to asynchronously walk a filesystem", async () => {
  const fs = createVirtualFileSystem<string>();
  fs.add("/A.txt", "A");
  fs.add("/B.txt", "B");
  fs.add("/C");
  fs.add("/C/D.txt", "D");
  const entries = [];
  for await (const entry of fs.walk("/")) {
    entries.push(entry);
  }
  const result = entries.map((el) => el.name).join("-");
  expect(result).toBe("A.txt-B.txt-C-D.txt");
});

it("should be able to synchronously get file stats from a filesystem", () => {
  const fs = createVirtualFileSystem<number>();
  fs.add("/foo/bar.txt", 42);
  const bar = fs.lstatSync("/foo/bar.txt");
  expect(bar.isFile).toBeTruthy();
  expect(bar.isDirectory).toBeFalsy();
  const foo = fs.lstatSync("/foo");
  expect(foo.isFile).toBeFalsy();
  expect(foo.isDirectory).toBeTruthy();
});

it("should be able to asynchronously get file stats from a filesystem", async () => {
  const fs = createVirtualFileSystem<number>();
  fs.add("/foo/bar.txt", 42);
  const bar = await fs.lstat("/foo/bar.txt");
  expect(bar.isFile).toBeTruthy();
  expect(bar.isDirectory).toBeFalsy();
  const foo = await fs.lstat("/foo");
  expect(foo.isFile).toBeFalsy();
  expect(foo.isDirectory).toBeTruthy();
});

it("should be able to synchronously check if path exists in a filesystem", () => {
  const fs = createVirtualFileSystem<string>();
  fs.add("/A.txt", "A");
  expect(fs.existsSync("/A.txt")).toBeTruthy();
  expect(fs.existsSync("/E.txt")).toBeFalsy();
});

it("should be able to asynchronously check if path exists in a filesystem", async () => {
  const fs = createVirtualFileSystem<string>();
  fs.add("/A.txt", "A");
  expect(await fs.exists("/A.txt")).toBeTruthy();
  expect(await fs.exists("/E.txt")).toBeFalsy();
});

it("should be able to subscribe for filesystem events", () => {
  const incr: string[] = [];
  const fs = createVirtualFileSystem();
  const listeners = [];
  listeners.push(fs.on("create", () => incr.push("C")));
  listeners.push(fs.on("modify", () => incr.push("M")));
  listeners.push(fs.on("remove", () => incr.push("R")));
  fs.add("/A.txt", "A");
  fs.add("/B.txt", "B");
  fs.add("/A.txt", "C");
  fs.removeSync("/B.txt");
  fs.offAll(); // Safely terminate all listeners
  expect(incr.join("")).toBe("CCMR");
});

it("should be able to watch for filesystem events", async () => {
  const incr: string[] = [];
  const fs = createVirtualFileSystem();
  setTimeout(() => fs.add("/A.txt", "A"), 100);
  setTimeout(() => fs.add("/B.txt", "B"), 150);
  setTimeout(() => fs.add("/A.txt", "C"), 250);
  setTimeout(() => fs.removeSync("/B.txt"), 320);
  const watcher = fs.watch("/");
  setTimeout(() => {
    watcher.return();
  }, 400);
  for await (const event of watcher) {
    incr.push(event.kind);
  }
  expect(incr.join()).toBe("create,create,modify,remove");
});
