import { expect, it } from "../../imports/expect.ts";
import { createVirtualFileSystem } from "./fs.ts";

it("can set up a filesystem", () => {
  const fs = createVirtualFileSystem<string>();
  expect(fs.getRoot().length).toBe(0);
});

it("can parse an absolute input filesystem path", () => {
  const fs = createVirtualFileSystem<string>();
  expect(fs.resolve("A/B\/C\\D")).toBe("/A/B/C/D");
});

it("can parse a relative input filesystem path", () => {
  const fs = createVirtualFileSystem<string>();
  expect(fs.resolve("../../")).toBe("/");
  expect(fs.resolve("../foo")).toBe("/foo");
  expect(fs.resolve("../foo/../")).toBe("/");
  expect(fs.resolve("..")).toBe("/");
  expect(fs.resolve(".")).toBe("/");
  expect(fs.resolve("./")).toBe("/");
});

it("can create a folder synchronously in a filesystem", () => {
  const fs = createVirtualFileSystem<string>();
  fs.mkdirSync("A");
  expect(fs.getRoot().length).toBe(1);
  expect(fs.getChildPaths("").length).toBe(1);
  expect(fs.getChildPaths("")[0]).toBe("/A");
});

it("can create a folder asynchronously in a filesystem", async () => {
  const fs = createVirtualFileSystem<string>();
  await fs.mkdir("A");
  expect(fs.getRoot().length).toBe(1);
  expect(fs.getChildPaths("").length).toBe(1);
  expect(fs.getChildPaths("")[0]).toBe("/A");
});

it("cannot override root directory in a filesystem", () => {
  const fs = createVirtualFileSystem<string>();
  expect(() => fs.mkdirSync("/")).toThrow();
});

it("cannot override an existing directory in a filesystem", () => {
  const fs = createVirtualFileSystem<string>();
  fs.mkdirSync("A");
  expect(() => fs.mkdirSync("A")).toThrow();
});

it("can write a file synchronously in a filesystem", () => {
  const fs = createVirtualFileSystem<string>();
  fs.writeSync("A.txt", "hello world");
  expect(fs.getRoot().length).toBe(1);
  expect(fs.getChildPaths("").length).toBe(1);
  expect(fs.getChildPaths("")[0]).toBe("/A.txt");
});

it("can write a file asynchronously in a filesystem", async () => {
  const fs = createVirtualFileSystem<string>();
  await fs.write("A.txt", "hello world");
  expect(fs.getRoot().length).toBe(1);
  expect(fs.getChildPaths("").length).toBe(1);
  expect(fs.getChildPaths("")[0]).toBe("/A.txt");
});

it("can write a file synchronously inside a folder in a filesystem", () => {
  const fs = createVirtualFileSystem<string>();
  fs.mkdirSync("A");
  fs.writeSync("A/B.txt", "hello world");
  expect(fs.getRoot().length).toBe(2);
});

it("can write a file asynchronously inside a folder in a filesystem", async () => {
  const fs = createVirtualFileSystem<string>();
  await fs.mkdir("A");
  await fs.write("A/B.txt", "hello world");
  expect(fs.getRoot().length).toBe(2);
});

it("cannot write a file synchronously inside a non-existing folder in a filesystem", () => {
  const fs = createVirtualFileSystem<string>();
  expect(() => fs.writeSync("A/B.txt", "hello world")).toThrow();
});

it("cannot write a file asynchronously inside a non-existing folder in a filesystem", async () => {
  const fs = createVirtualFileSystem<string>();
  expect(fs.write("A/B.txt", "hello world")).rejects.toThrow();
});

it("cannot write synchronously into a folder in a filesystem", () => {
  const fs = createVirtualFileSystem<string>();
  fs.mkdirSync("A");
  expect(() => fs.writeSync("A", "hello world")).toThrow();
});

it("cannot write asynchronously into a folder in a filesystem", async () => {
  const fs = createVirtualFileSystem<string>();
  await fs.mkdir("A");
  expect(fs.write("A", "hello world")).rejects.toThrow();
});

it("can remove a file synchronously in a filesystem", () => {
  const fs = createVirtualFileSystem<string>();
  fs.writeSync("A.txt", "hello world");
  fs.removeSync("A.txt");
  expect(fs.getRoot().length).toBe(0);
});

it("can remove a file asynchronously in a filesystem", async () => {
  const fs = createVirtualFileSystem<string>();
  await fs.write("A.txt", "hello world");
  await fs.remove("A.txt");
  expect(fs.getRoot().length).toBe(0);
});

it("can remove a folder synchronously in a filesystem", () => {
  const fs = createVirtualFileSystem<string>();
  fs.mkdirSync("A");
  fs.removeSync("A");
  expect(fs.getRoot().length).toBe(0);
});

it("can remove a folder asynchronously in a filesystem", async () => {
  const fs = createVirtualFileSystem<string>();
  await fs.mkdir("A");
  await fs.remove("A");
  expect(fs.getRoot().length).toBe(0);
});

it("cannot synchronously remove a non-existing path in a filesystem", () => {
  const fs = createVirtualFileSystem<string>();
  expect(() => fs.removeSync("foo")).toThrow();
});

it("cannot asynchronously remove a non-existing path in a filesystem", async () => {
  const fs = createVirtualFileSystem<string>();
  expect(fs.remove("foo")).rejects.toThrow();
});

it("can remove a non-empty folder synchronously in a filesystem", () => {
  const fs = createVirtualFileSystem<string>();
  fs.mkdirSync("A");
  fs.writeSync("A/B.txt", "hello world");
  fs.writeSync("A.txt", "hello world"); // Just to make sure it doesn't confuse items
  expect(fs.getRoot().length).toBe(3);
  fs.removeSync("A");
  expect(fs.getRoot().length).toBe(1);
});

it("can remove a non-empty folder asynchronously in a filesystem", async () => {
  const fs = createVirtualFileSystem<string>();
  await fs.mkdir("A");
  await fs.write("A/B.txt", "hello world");
  await fs.write("A.txt", "hello world"); // Just to make sure it doesn't confuse items
  expect(fs.getRoot().length).toBe(3);
  await fs.remove("A");
  expect(fs.getRoot().length).toBe(1);
});

it("can check synchronously if path exists in a filesystem", () => {
  const fs = createVirtualFileSystem<string>();
  fs.mkdirSync("A");
  expect(fs.existsSync("/A")).toBeTruthy();
  expect(fs.existsSync("A")).toBeTruthy();
  expect(fs.existsSync("./A")).toBeTruthy();
});

it("can check asynchronously if path exists in a filesystem", async () => {
  const fs = createVirtualFileSystem<string>();
  await fs.mkdir("A");
  expect(fs.exists("/A")).resolves.toBeTruthy();
  expect(fs.exists("A")).resolves.toBeTruthy();
  expect(fs.exists("./A")).resolves.toBeTruthy();
});

it("can retrieve file stats synchronously in a filesystem", () => {
  const fs = createVirtualFileSystem<string>();
  fs.writeSync("A.txt", "hello world");
  const stats = fs.lstatSync("A.txt");
  expect(stats.path).toBe("/A.txt");
  expect(stats.name).toBe("A.txt");
  expect(stats.isFile).toBeTruthy();
  expect(stats.isDirectory).toBeFalsy();
});

it("can retrieve file stats asynchronously in a filesystem", async () => {
  const fs = createVirtualFileSystem<string>();
  await fs.write("A.txt", "hello world");
  const stats = await fs.lstat("A.txt");
  expect(stats.path).toBe("/A.txt");
  expect(stats.name).toBe("A.txt");
  expect(stats.isFile).toBeTruthy();
  expect(stats.isDirectory).toBeFalsy();
});

it("can retrieve folder stats synchronously in a filesystem", () => {
  const fs = createVirtualFileSystem<string>();
  fs.mkdirSync("A");
  const stats = fs.lstatSync("A");
  expect(stats.path).toBe("/A");
  expect(stats.name).toBe("A");
  expect(stats.isFile).toBeFalsy();
  expect(stats.isDirectory).toBeTruthy();
});

it("can retrieve folder stats asynchronously in a filesystem", async () => {
  const fs = createVirtualFileSystem<string>();
  await fs.mkdir("A");
  const stats = await fs.lstat("A");
  expect(stats.path).toBe("/A");
  expect(stats.name).toBe("A");
  expect(stats.isFile).toBeFalsy();
  expect(stats.isDirectory).toBeTruthy();
});

it("cannot retrieve non-existing file stats synchronously in a filesystem", () => {
  const fs = createVirtualFileSystem<string>();
  expect(() => fs.lstatSync("A.txt")).toThrow();
});

it("cannot retrieve non-existing file stats asynchronously in a filesystem", async () => {
  const fs = createVirtualFileSystem<string>();
  expect(fs.lstat("A.txt")).rejects.toThrow();
});

it("can move a file synchronously inside a folder in a filesystem", () => {
  const fs = createVirtualFileSystem<string>();
  fs.mkdirSync("A");
  fs.writeSync("A/B.txt", "hello world");
  fs.mkdirSync("C");
  fs.moveSync("A/B.txt", "C");
  expect(fs.existsSync("A/B.txt")).toBeFalsy();
  expect(fs.existsSync("C/B.txt")).toBeTruthy();
});

it("can move a file asynchronously inside a folder in a filesystem", async () => {
  const fs = createVirtualFileSystem<string>();
  await fs.mkdir("A");
  await fs.write("A/B.txt", "hello world");
  await fs.mkdir("C");
  await fs.move("A/B.txt", "C");
  expect(fs.exists("A/B.txt")).resolves.toBeFalsy();
  expect(fs.exists("C/B.txt")).resolves.toBeTruthy();
});

it("can move a file synchronously to a new file in a filesystem", () => {
  const fs = createVirtualFileSystem<string>();
  fs.mkdirSync("A");
  fs.writeSync("A/B.txt", "hello world");
  fs.mkdirSync("C");
  fs.moveSync("A/B.txt", "C/B.txt");
  expect(fs.existsSync("A/B.txt")).toBeFalsy();
  expect(fs.existsSync("C/B.txt")).toBeTruthy();
});

it("can move a file asynchronously to a new file in a filesystem", async () => {
  const fs = createVirtualFileSystem<string>();
  await fs.mkdir("A");
  await fs.write("A/B.txt", "hello world");
  await fs.mkdir("C");
  await fs.move("A/B.txt", "C/B.txt");
  expect(fs.exists("A/B.txt")).resolves.toBeFalsy();
  expect(fs.exists("C/B.txt")).resolves.toBeTruthy();
});

it("cannot move a file synchronously into an existing file in a filesystem", () => {
  const fs = createVirtualFileSystem<string>();
  fs.mkdirSync("A");
  fs.writeSync("A/B.txt", "hello world");
  fs.mkdirSync("C");
  fs.writeSync("C/B.txt", "foo bar");
  expect(() => fs.moveSync("A/B.txt", "C/B.txt")).toThrow();
});

it("cannot move a file asynchronously into an existing file in a filesystem", async () => {
  const fs = createVirtualFileSystem<string>();
  await fs.mkdir("A");
  await fs.write("A/B.txt", "hello world");
  await fs.mkdir("C");
  await fs.write("C/B.txt", "foo bar");
  expect(fs.move("A/B.txt", "C/B.txt")).rejects.toThrow();
});

it("can move folder contents synchronously in a filesystem", () => {
  const fs = createVirtualFileSystem<string>();
  fs.mkdirSync("A");
  fs.writeSync("A/B.txt", "hello world");
  fs.mkdirSync("A/C");
  fs.writeSync("A/C/D.txt", "hello world");
  fs.mkdirSync("E");
  fs.moveSync("A", "E");
  expect(fs.existsSync("A")).toBeFalsy();
  expect(fs.existsSync("E")).toBeTruthy();
  expect(fs.existsSync("A/B.txt")).toBeFalsy();
  expect(fs.existsSync("E/B.txt")).toBeTruthy();
});

it("can move folder contents asynchronously in a filesystem", async () => {
  const fs = createVirtualFileSystem<string>();
  await fs.mkdir("A");
  await fs.write("A/B.txt", "hello world");
  await fs.mkdir("A/C");
  await fs.write("A/C/D.txt", "hello world");
  await fs.mkdir("E");
  await fs.move("A", "E");
  expect(fs.exists("A")).resolves.toBeFalsy();
  expect(fs.exists("E")).resolves.toBeTruthy();
  expect(fs.exists("A/B.txt")).resolves.toBeFalsy();
  expect(fs.exists("E/B.txt")).resolves.toBeTruthy();
});

it("can move folder contents synchronously to the root in a filesystem", () => {
  const fs = createVirtualFileSystem<string>();
  fs.mkdirSync("A");
  fs.writeSync("A/B.txt", "hello world");
  fs.mkdirSync("A/C");
  fs.writeSync("A/C/D.txt", "hello world");
  fs.moveSync("A", "/");
  expect(fs.existsSync("A/B.txt")).toBeFalsy();
  expect(fs.existsSync("B.txt")).toBeTruthy();
  expect(fs.existsSync("/")).toBeFalsy();
});

it("can move folder contents asynchronously to the root in a filesystem", async () => {
  const fs = createVirtualFileSystem<string>();
  await fs.mkdir("A");
  await fs.write("A/B.txt", "hello world");
  await fs.mkdir("A/C");
  await fs.write("A/C/D.txt", "hello world");
  await fs.move("A", "/");
  expect(fs.exists("A/B.txt")).resolves.toBeFalsy();
  expect(fs.exists("B.txt")).resolves.toBeTruthy();
  expect(fs.exists("/")).resolves.toBeFalsy();
});

it("can move folder contents synchronously in a non-existing folder in a filesystem", () => {
  const fs = createVirtualFileSystem<string>();
  fs.mkdirSync("A");
  fs.writeSync("A/B.txt", "hello world");
  fs.mkdirSync("A/C");
  fs.writeSync("A/C/D.txt", "hello world");
  fs.moveSync("A", "E");
  expect(fs.existsSync("A/B.txt")).toBeFalsy();
  expect(fs.existsSync("E")).toBeTruthy();
  expect(fs.existsSync("E/B.txt")).toBeTruthy();
});

it("can move folder contents asynchronously in a non-existing folder in a filesystem", async () => {
  const fs = createVirtualFileSystem<string>();
  await fs.mkdir("A");
  await fs.write("A/B.txt", "hello world");
  await fs.mkdir("A/C");
  await fs.write("A/C/D.txt", "hello world");
  await fs.move("A", "E");
  expect(fs.exists("A/B.txt")).resolves.toBeFalsy();
  expect(fs.exists("E")).resolves.toBeTruthy();
  expect(fs.exists("E/B.txt")).resolves.toBeTruthy();
});

it("can change current working directory in a filesystem", () => {
  const fs = createVirtualFileSystem<string>();
  fs.mkdirSync("A");
  fs.writeSync("A/B.txt", "hello world");
  fs.cd("A");
  expect(fs.resolve("../")).toBe("/");
  expect(fs.resolve("./")).toBe("/A");
  expect(fs.existsSync("./B.txt")).toBeTruthy();
  fs.writeSync("./C.txt", "hello world");
  expect(fs.existsSync("/A/C.txt")).toBeTruthy();
  expect(fs.existsSync("A/C.txt")).toBeFalsy();
  expect(fs.existsSync("C.txt")).toBeTruthy();
  fs.cd("..");
  expect(fs.existsSync("A/B.txt")).toBeTruthy();
  expect(fs.existsSync("A/C.txt")).toBeTruthy();
});

it("can rename a file synchronously in a filesystem", () => {
  const fs = createVirtualFileSystem<string>();
  fs.writeSync("A.txt", "hello world");
  fs.renameSync("A.txt", "B.txt");
  expect(fs.existsSync("A.txt")).toBeFalsy();
  expect(fs.existsSync("B.txt")).toBeTruthy();
});

it("can rename a file asynchronously in a filesystem", async () => {
  const fs = createVirtualFileSystem<string>();
  await fs.write("A.txt", "hello world");
  await fs.rename("A.txt", "B.txt");
  expect(fs.exists("A.txt")).resolves.toBeFalsy();
  expect(fs.exists("B.txt")).resolves.toBeTruthy();
});

it("cannot rename a file synchronously to an existing entry in a filesystem", () => {
  const fs = createVirtualFileSystem<string>();
  fs.writeSync("A.txt", "hello world");
  fs.writeSync("B.txt", "hello world");
  fs.mkdirSync("C");
  expect(() => fs.renameSync("A.txt", "B.txt")).toThrow();
  expect(() => fs.renameSync("A.txt", "C")).toThrow();
});

it("cannot rename a file asynchronously to an existing entry in a filesystem", async () => {
  const fs = createVirtualFileSystem<string>();
  await fs.write("A.txt", "hello world");
  await fs.write("B.txt", "hello world");
  await fs.mkdir("C");
  expect(fs.rename("A.txt", "B.txt")).rejects.toThrow();
  expect(fs.rename("A.txt", "C")).rejects.toThrow();
});

it("can rename a folder synchronously in a filesystem", () => {
  const fs = createVirtualFileSystem<string>();
  fs.mkdirSync("A");
  fs.writeSync("A/B.txt", "hello world");
  fs.writeSync("A/C.txt", "hello world");
  fs.renameSync("A", "D");
  expect(fs.existsSync("A")).toBeFalsy();
  expect(fs.existsSync("D")).toBeTruthy();
  expect(fs.existsSync("A/B.txt")).toBeFalsy();
  expect(fs.existsSync("D/B.txt")).toBeTruthy();
  expect(fs.existsSync("A/C.txt")).toBeFalsy();
  expect(fs.existsSync("D/C.txt")).toBeTruthy();
});

it("can rename a folder asynchronously in a filesystem", async () => {
  const fs = createVirtualFileSystem<string>();
  await fs.mkdir("A");
  await fs.write("A/B.txt", "hello world");
  await fs.write("A/C.txt", "hello world");
  await fs.rename("A", "D");
  expect(fs.exists("A")).resolves.toBeFalsy();
  expect(fs.exists("D")).resolves.toBeTruthy();
  expect(fs.exists("A/B.txt")).resolves.toBeFalsy();
  expect(fs.exists("D/B.txt")).resolves.toBeTruthy();
  expect(fs.exists("A/C.txt")).resolves.toBeFalsy();
  expect(fs.exists("D/C.txt")).resolves.toBeTruthy();
});

it("cannot rename a folder synchronously after the root folder in a filesystem", () => {
  const fs = createVirtualFileSystem<string>();
  fs.mkdirSync("A");
  expect(() => fs.renameSync("A", "/")).toThrow();
  expect(() => fs.renameSync("A", "../")).toThrow();
});

it("cannot rename a folder asynchronously after the root folder in a filesystem", async () => {
  const fs = createVirtualFileSystem<string>();
  await fs.mkdir("A");
  expect(fs.rename("A", "/")).rejects.toThrow();
  expect(fs.rename("A", "../")).rejects.toThrow();
});

it("cannot rename a folder synchronously to an existing entry in a filesystem", () => {
  const fs = createVirtualFileSystem<string>();
  fs.mkdirSync("A");
  fs.mkdirSync("B");
  fs.writeSync("C", "");
  expect(() => fs.renameSync("A", "B")).toThrow();
  expect(() => fs.renameSync("A", "C")).toThrow();
});

it("cannot rename a folder asynchronously to an existing entry in a filesystem", async () => {
  const fs = createVirtualFileSystem<string>();
  await fs.mkdir("A");
  await fs.mkdir("B");
  await fs.write("C", "");
  expect(fs.rename("A", "B")).rejects.toThrow();
  expect(fs.rename("A", "C")).rejects.toThrow();
});

it("can map a filesystem into a new one", () => {
  const fs = createVirtualFileSystem<number>();
  fs.writeSync("A.txt", 2);
  fs.writeSync("B.txt", 1e3);
  fs.writeSync("C.txt", .15);
  fs.writeSync("D.txt", -.15);
  fs.writeSync("E.txt", 1e-2);
  const fs2 = fs.map((value) => value.toString());
  expect(fs2.readSync("A.txt")).toBe("2");
  expect(fs2.readSync("B.txt")).toBe("1000");
  expect(fs2.readSync("C.txt")).toBe("0.15");
  expect(fs2.readSync("D.txt")).toBe("-0.15");
  expect(fs2.readSync("E.txt")).toBe("0.01");
});

it("can filter a filesystem", () => {
  const fs = createVirtualFileSystem<number>();
  fs.writeSync("A.txt", 2);
  fs.writeSync("B.txt", 1e3);
  fs.writeSync("C.txt", .15);
  fs.writeSync("D.txt", -.15);
  fs.writeSync("E.txt", 1e-2);
  const fs2 = fs.filter((value) => value > 1);
  expect(fs2.existsSync("A.txt")).toBeTruthy();
  expect(fs2.existsSync("B.txt")).toBeTruthy();
  expect(fs2.existsSync("C.txt")).toBeFalsy();
  expect(fs2.existsSync("D.txt")).toBeFalsy();
  expect(fs2.existsSync("E.txt")).toBeFalsy();
});

it("can subscribe to filesystem events", () => {
  const fs = createVirtualFileSystem<number>();
  const listeners = [];
  const incr: string[] = [];
  listeners.push(fs.on("create", () => incr.push("C")));
  listeners.push(fs.on("modify", () => incr.push("M")));
  listeners.push(fs.on("remove", () => incr.push("R")));
  fs.writeSync("A.txt", 2);
  fs.writeSync("B.txt", 1e3);
  fs.writeSync("A.txt", .15);
  fs.removeSync("/B.txt");
  fs.offAll(); // Safely terminate all listeners
  expect(incr.join("")).toBe("CCMR");
});

it("watch for filesystem events", async () => {
  const incr: string[] = [];
  const fs = createVirtualFileSystem<number>();
  fs.mkdirSync("A");
  setTimeout(() => fs.writeSync("/A/B.txt", 1), 100);
  setTimeout(() => fs.writeSync("/A/C.txt", 2), 150);
  setTimeout(() => fs.writeSync("/A/B.txt", 3), 250);
  setTimeout(() => fs.writeSync("/D.txt", 4), 120);
  setTimeout(() => fs.removeSync("/A/B.txt"), 320);
  const watcher = fs.watch("A");
  setTimeout(() => {
    watcher.return();
  }, 400);
  for await (const event of watcher) {
    incr.push(event.kind);
  }
  expect(incr.join()).toBe("create,create,modify,remove");
});