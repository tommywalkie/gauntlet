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
 * Pool over async iterators, using `setTimeout`.
 * _Most likely a dirty hack_.
 *
 * Use this when :
 * - You want to asynchronously run multiple iterators
 * (_e.g._ HTTP server, file watcher) at the same time,
 * but in their own event queue (which is the primary difference
 * with the `MuxAsyncIterator` approach)
 * - You are not entirely sure to support Web Workers in your
 * current runtime.
 *
 * ```ts
 * for await (const _ of someIterator) { ... }
 *
 * // Won't run before the first loop is done
 * for await (const _ of anotherIterator) { ... }
 * ```
 *
 * Using this utility:
 *
 * ```ts
 * const pool = new AsyncIteratorPool();
 * pool.add(someIterator, async (data) => { ... });
 * pool.add(anotherIterator, async (data) => { ... });
 * pool.return();
 * ```
 */
export class AsyncIteratorPool<T = unknown> {
  private threads: number[] = [];
  private iterators: AsyncIterableIterator<unknown>[] = [];
  private onError: (e: Error) => Promise<void> = (e) => {
    throw Promise.reject(e);
  };
  constructor(onError?: (e: Error) => Promise<void>) {
    if (onError) this.onError = onError;
  }
  push<U = T>(
    iterator: AsyncIterableIterator<U>,
    fn: (data: U) => Promise<void>,
  ) {
    this.iterators.push(iterator);
    this.threads.push(setTimeout(async () => {
      try {
        for await (const data of iterator) await fn(data);
      } catch (e) {
        this.return();
        await this.onError(e);
      }
    }));
  }
  return() {
    for (const iterator of this.iterators) {
      (async () => {
        if (iterator.return) await iterator.return();
      });
    }
    for (const thread of this.threads) {
      clearTimeout(thread);
    }
  }
}

/**
 * Takes a string and returns an `Uint8Array`.
 * Source: https://gist.github.com/NejcZdovc/447d730e0aada3771da7b88804d010f2
 */
export function toTypedArray(s: string): Uint8Array {
  const escstr = encodeURIComponent(s);
  const binstr = escstr.replace(/%([0-9A-F]{2})/g, function (_, p1) {
    return String.fromCharCode("0x" + p1 as any);
  });
  const ua = new Uint8Array(binstr.length);
  Array.prototype.forEach.call(binstr, function (ch, i) {
    ua[i] = ch.charCodeAt(0);
  });
  return ua;
}

/**
 * Same as `String.prototype.replaceAll("\\", "/")`, except it has better
 * compatibility.
 */
export function replaceSlashes(str: string) {
  return str.split(/\\/).join("/");
}

export function isDeno() {
  return globalThis.Deno != null;
}

export function isBrowser() {
  if (isDeno()) return false;
  return globalThis.navigator ? true : false;
}

export function getOS() {
  if ((globalThis as any).Deno != null) {
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
