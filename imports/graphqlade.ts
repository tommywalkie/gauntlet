import { AsyncPushIterator } from "https://esm.sh/graphqlade@0.3.2/dist/util/AsyncPushIterator.js";

export type AsyncPushIteratorSetup<T> = (
  iterator: AsyncPushIterator<T>,
) => Promise<(() => unknown) | undefined> | (() => unknown) | undefined;

export { AsyncPushIterator };
