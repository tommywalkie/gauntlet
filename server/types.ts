import * as coreTypes from "../core/types.ts";
import type { ServerRequest } from "../imports/std.ts";

export type Disposable<T> = [T, () => void];

export interface DevServerEvents
  extends coreTypes.LogEvents, coreTypes.WatchEvents {
  listen(event: {
    hostname?: string;
    port: number;
    secure: boolean;
  }): void;
  request(req: ServerRequest): void;
  terminate(): void;
}
