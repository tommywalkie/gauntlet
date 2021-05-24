// deno-lint-ignore-file no-explicit-any

/**
 * Naive unique ID generator
 */
export function randomId() {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Takes an async iterator and returns an array
 */
export async function toArray<T = any>(
  asyncIterator: AsyncIterableIterator<T>,
): Promise<Array<T>> {
  const arr = [];
  for await (const i of asyncIterator) arr.push(i);
  return arr;
}

/**
 * Takes an iterator and returns an array
 */
export function toArraySync<T = any>(it: IterableIterator<T>): Array<T> {
  return [...it];
}

/**
 * Takes a string and returns an `Uint8Array`.
 * Source: https://gist.github.com/NejcZdovc/447d730e0aada3771da7b88804d010f2
 */
export function toTypedArray(s: string): Uint8Array {
  var escstr = encodeURIComponent(s);
  var binstr = escstr.replace(/%([0-9A-F]{2})/g, function (_, p1) {
    return String.fromCharCode("0x" + p1 as any);
  });
  var ua = new Uint8Array(binstr.length);
  Array.prototype.forEach.call(binstr, function (ch, i) {
    ua[i] = ch.charCodeAt(0);
  });
  return ua;
}

export function isDeno() {
  return (globalThis as any)?.Deno != null;
}

export function isBrowser() {
  if (isDeno()) return false;
  return (globalThis as any).navigator;
}

export function getOS() {
  if ((globalThis as any)?.Deno != null) {
    return Deno.build.os;
  }
  const navigator = (globalThis as any).navigator;
  if (navigator?.appVersion?.includes?.("Win") ?? false) {
    return "windows";
  }
  if (navigator?.appVersion?.includes?.("Mac") ?? false) {
    return "darwin";
  }
  return "linux";
}
