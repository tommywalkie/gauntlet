<!-- deno-fmt-ignore-file -->

<p align="center">
  <img height="120" src="https://raw.githubusercontent.com/tommywalkie/gauntlet/main/.github/assets/logo.svg">
  <h1 align="center">Gauntlet Filesystem</h1>
</p>
<p align="center">
  <i>In-memory, lightweight and browser-compatible filesystem implementation</i>
</p>

<br>

## Overview

Provides a battle-tested and event-driven virtual filesystem implementation, built on top of [`simple-virtual-fs`](https://github.com/deebloo/virtual-fs) by Danny Blue (**@deebloo**), including various convenient methods, inspired from Deno APIs.

This filesystem is compliant with Gauntlet's `FileSystemLike` interface and implements most methods found in filesystem modules, while also supporting relative and absolute paths as inputs.

- [Usage](https://github.com/tommywalkie/gauntlet/tree/main/core/fs#usage)
  - [Create a new filesystem](https://github.com/tommywalkie/gauntlet/tree/main/core/fs#create-a-new-filesystem)
  - [Get current working directory](https://github.com/tommywalkie/gauntlet/tree/main/core/fs#get-current-working-directory)
  - [Switch current working directory](https://github.com/tommywalkie/gauntlet/tree/main/core/fs#switch-current-working-directory)
  - [Write a new file](https://github.com/tommywalkie/gauntlet/tree/main/core/fs#write-a-new-file)
  - [Read a file](https://github.com/tommywalkie/gauntlet/tree/main/core/fs#read-a-file)
  - [Check if path exists](https://github.com/tommywalkie/gauntlet/tree/main/core/fs#check-if-path-exists)
  - [Create a new directory](https://github.com/tommywalkie/gauntlet/tree/main/core/fs#create-a-new-directory)
  - [Get path stats](https://github.com/tommywalkie/gauntlet/tree/main/core/fs#get-path-stats)
  - [Remove a file or a directory](https://github.com/tommywalkie/gauntlet/tree/main/core/fs#remove-a-file-or-a-directory)
  - [Move a file or a directory](https://github.com/tommywalkie/gauntlet/tree/main/core/fs#move-a-file-or-a-directory)
  - [Copy a file or a directory](https://github.com/tommywalkie/gauntlet/tree/main/core/fs#copy-a-file-or-a-directory)
  - [Rename a file or a directory](https://github.com/tommywalkie/gauntlet/tree/main/core/fs#rename-a-file-or-a-directory)
  - [Watch for filesystem events](https://github.com/tommywalkie/gauntlet/tree/main/core/fs#watch-for-filesystem-events)
  - [Map over filesystem items](https://github.com/tommywalkie/gauntlet/tree/main/core/fs#map-over-filesystem-items)
  - [Filter filesystem items](https://github.com/tommywalkie/gauntlet/tree/main/core/fs#filter-filesystem-items)
  - [Clear filesystem](https://github.com/tommywalkie/gauntlet/tree/main/core/fs#clear-filesystem)

## Usage

### Create a new filesystem

```typescript
import { FileSystem } from "https://deno.land/x/gauntlet/tree/main/core/fs/fs/mod.ts"
const fs = new FileSystem<string>(); // Can be generic-typed (default: any)
```

### Get current working directory

```typescript
fs.cwd(); // "/"
```

### Switch current working directory

```typescript
fs.cd("some-dir");
fs.cd(".."); // Relative paths also work!
fs.cd("./some-dir");
fs.cd("/"); // Root directory absolute path
```

### Write a new file

```typescript
// Synchronous
fs.writeSync("foo.txt", "hello world");

// Asynchronous
await fs.write("foo.txt", "hello world");
```

### Read a file

```typescript
// Synchronous
fs.readSync("foo.txt"); // "hello world"

// Asynchronous
await fs.read("foo.txt", "hello world");
```

### Check if path exists

```typescript
// Synchronous
fs.existsSync("foo.txt"); // true
fs.existsSync("idontexist.txt"); // false

// Asynchronous
await fs.exists("foo.txt"); // true
await fs.exists("idontexist.txt"); // false
```

### Create a new directory

```typescript
// Synchronous
fs.mkdirSync("src");

// Asynchronous
await fs.mkdir("src");
```

### Get path stats

Throws an error if path doesn't exist.

```typescript
// Synchronous
fs.lstatSync("foo.txt"); // { path: "/foo.txt", name: "foo.txt", isFile: true, isDirectory: false, isSymlink: false }

// Asynchronous
await fs.lstat("foo.txt"); // { path: "/foo.txt", name: "foo.txt", isFile: true, isDirectory: false, isSymlink: false }
```

### Remove a file or a directory

Recursively removes all child paths.

```typescript
// Synchronous
fs.existsSync("some-dir/some-file"); // true
fs.removeSync("some-dir");
fs.existsSync("some-dir/some-file"); // false

// Asynchronous
await fs.exists("some-dir/some-file"); // true
await fs.remove("some-dir");
await fs.exists("some-dir/some-file"); // false
```

### Move a file or a directory

Recursively updates all child paths. This allows moving files/directories into directories or in the root directory, or renaming an existing file, throws an error if trying to override an existing file.

```typescript
// Synchronous
fs.existsSync("some-dir/some-file"); // true
fs.moveSync("some-dir", "/");
fs.existsSync("some-dir/some-file"); // false
fs.existsSync("some-file"); // true

// Asynchronous
await fs.exists("some-dir/some-file"); // true
await fs.move("some-dir", "/");
await fs.exists("some-dir/some-file"); // false
await fs.exists("some-file"); // true
```

### Copy a file or a directory

Recursively copy all child paths. Throws an error if trying to override an existing path.

```typescript
// Synchronous
fs.existsSync("some-dir/some-file"); // true
fs.copySync("some-dir", "another-dir");
fs.existsSync("some-dir/some-file"); // true
fs.existsSync("another-dir"); // true
fs.existsSync("another-dir/some-file"); // true

// Asynchronous
await fs.exists("some-dir/some-file"); // true
await fs.copy("some-dir", "another-dir");
await fs.exists("some-dir/some-file"); // true
await fs.exists("another-dir"); // true
await fs.exists("another-dir/some-file"); // true
```

### Rename a file or a directory

Recursively updates all child paths. Cannot rename the root directory. Throws an error if trying to override an existing file.

```typescript
// Synchronous
fs.existsSync("some-dir/some-file"); // true
fs.renameSync("some-dir", "awesome-dir");
fs.existsSync("some-dir/some-file"); // false
fs.existsSync("awesome-dir/some-file"); // true

// Asynchronous
await fs.exists("some-dir/some-file"); // true
await fs.rename("some-dir", "awesome-dir");
await fs.exists("some-dir/some-file"); // false
await fs.exists("awesome-dir/some-file"); // true
```

### Walk a directory

Recursively iterate over folder entries.

```typescript
// Synchronous
for (const item of fs.walkSync("/") {
  console.log(item);
  // { path: "/some-file.txt", name: "some-file.txt", isFile: true, ... }
  // { path: "/some-dir", name: "some-dir", isDirectory: true, ... }
  // { path: "/some-dir/some-file.txt", name: "some-file.txt", isFile: true, ... }
  // ...
})

// Asynchronous
for await (const item of fs.walk("/") {
  console.log(item);
  // { path: "/some-file.txt", name: "some-file.txt", isFile: true, ... }
  // { path: "/some-dir", name: "some-dir", isDirectory: true, ... }
  // { path: "/some-dir/some-file.txt", name: "some-file.txt", isFile: true, ... }
  // ...
})
```

### Watch for filesystem events

Using `watch`, you can listen and iterate over events. 

```typescript
// Prepare some filesystem ops
setTimeout(() => fs.writeSync("/A.txt", "hello world"), 100);
setTimeout(() => fs.writeSync("/A.txt", "editted hello world"), 150);
setTimeout(() => fs.removeSync("/A.txt"), 250);

// Launch the file watcher
for await (const event of fs.watch("/") {
  console.log(event);
  // { kind: "create", entry: { path: "/A.txt", ... } }
  // { kind: "modify", entry: { path: "/A.txt", ... } }
  // { kind: "remove", entry: { path: "/A.txt", ... } }
  // ...
})
```

This filesystem is internally an extended `EventEmitter`, enabling us to manually subscribe/unsubscribe to events, if needed.

```typescript
// Subscribe
const listener = fs.on("modify", (entry: WalkEntry) => {
  console.log(`Got a new save on ${entry.name}!!`)
});

// Unsubscribe
fs.off("modify", listener);
```

### Map over filesystem items

```typescript
const fs = new FileSystem<number>();
fs.writeSync("foo.txt", 1e3);
const anotherFs: FileSystem<string> = fs.map(
  (value: number) => value.toString()
);
anotherFs.readSync("foo.txt", "1000");
```

### Filter filesystem items

```typescript
const fs = new FileSystem<number>();
fs.writeSync("foo.txt", 1e-2);
fs.writeSync("bar.txt", .1);
const anotherFs = fs.filter(
  (value: number) => value > 0
);
anotherFs.existsSync("foo.txt"); // false
anotherFs.existsSync("bar.txt"); // true
```

### Clear filesystem

```typescript
fs.clear();
```

