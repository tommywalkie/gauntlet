// deno-lint-ignore-file no-explicit-any
import {
  WebSocketAcceptedClient,
  WebSocketServer,
} from "../imports/deno-websocket.ts";
import { EventEmitter } from "../imports/pietile-eventemitter.ts";
import { Buffer } from "../imports/buffer.ts";

export interface Dependency {
  dependents: Set<string>;
  dependencies: Set<string>;
  isHmrEnabled: boolean;
  isHmrAccepted: boolean;
  needsReplacement: boolean;
}

interface ExpectedServerEvents {
  upgrade(
    // A bit unsure about what to do here,
    // Snowpack labels this `req`, but Node labels this `res`
    // and expects an `IncomingMessage` value.
    // ref: https://cdn.jsdelivr.net/npm/@types/node@15.6.0/http.d.ts
    req: Request | Response,
    socket: EventEmitter<any>,
    head: Buffer,
  ): void;
}

interface ExpectedWebSocketServer {
  handleUpgrade(
    req: Request | Response,
    socket: EventEmitter<any>,
    head: Buffer,
    listener: (client: WebSocketAcceptedClient) => void,
  ): void;
}

/**
 * This is a naive attempt at porting ESM Hot Module Replacement (ESM-HMR)
 * specification from Snowpack, for Deno.
 *
 * Current quirks:
 * - `ws` is not supported yet on Deno, nor polyfilled by esm.sh
 * - `deno-websocket` doesn't have `ws.handleUpgrade`
 *
 * @copyright Copyright 2019 Fred K. Schott. All rights reserved. MIT license.
 */
export class EsmHmrEngine {
  clients: Set<WebSocketAcceptedClient> = new Set();
  dependencyTree = new Map<string, Dependency>();

  constructor(options: { server?: EventEmitter<ExpectedServerEvents> }) {
    // TODO(tommywalkie): Support custom server and handleUpgrade events
    const wss = options.server
      ? new WebSocketServer()
      : new WebSocketServer(12321);
    if (options.server) {
      options.server.on("upgrade", (req, socket, head) => {
        // @ts-ignore: need to type req somehow
        if (req.headers["sec-websocket-protocol"] !== "esm-hmr") {
          return;
        }
        const upgradableWss = wss as unknown as ExpectedWebSocketServer;
        if (upgradableWss.handleUpgrade) {
          upgradableWss.handleUpgrade(req, socket, head, (client) => {
            wss.emit("connection", client, req);
          });
        }
      });
    }
    wss.on("connection", (client: WebSocketAcceptedClient) => {
      this.connectClient(client);
      this.registerListener(client);
    });
  }

  registerListener(client: WebSocketAcceptedClient) {
    client.on("message", (data: any) => {
      const message = JSON.parse(data.toString());
      if (message.type === "hotAccept") {
        const entry = this.getEntry(message.id, true) as Dependency;
        entry.isHmrAccepted = true;
      }
    });
  }

  createEntry(sourceUrl: string) {
    const newEntry: Dependency = {
      dependencies: new Set(),
      dependents: new Set(),
      needsReplacement: false,
      isHmrEnabled: false,
      isHmrAccepted: false,
    };
    this.dependencyTree.set(sourceUrl, newEntry);
    return newEntry;
  }

  getEntry(sourceUrl: string, createIfNotFound = false) {
    const result = this.dependencyTree.get(sourceUrl);
    if (result) {
      return result;
    }
    if (createIfNotFound) {
      return this.createEntry(sourceUrl);
    }
    return null;
  }

  setEntry(sourceUrl: string, imports: string[], isHmrEnabled = false) {
    const result = this.getEntry(sourceUrl, true)!;
    const outdatedDependencies = new Set(result.dependencies);
    result.isHmrEnabled = isHmrEnabled;
    for (const importUrl of imports) {
      this.addRelationship(sourceUrl, importUrl);
      outdatedDependencies.delete(importUrl);
    }
    for (const importUrl of outdatedDependencies) {
      this.removeRelationship(sourceUrl, importUrl);
    }
  }

  removeRelationship(sourceUrl: string, importUrl: string) {
    const importResult = this.getEntry(importUrl);
    importResult && importResult.dependents.delete(sourceUrl);
    const sourceResult = this.getEntry(sourceUrl);
    sourceResult && sourceResult.dependencies.delete(importUrl);
  }

  addRelationship(sourceUrl: string, importUrl: string) {
    if (importUrl !== sourceUrl) {
      const importResult = this.getEntry(importUrl, true)!;
      importResult.dependents.add(sourceUrl);
      const sourceResult = this.getEntry(sourceUrl, true)!;
      sourceResult.dependencies.add(importUrl);
    }
  }

  markEntryForReplacement(entry: Dependency, state: boolean) {
    entry.needsReplacement = state;
  }

  broadcastMessage(data: Record<string, unknown>) {
    this.clients.forEach((client) => {
      if (client.state === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      } else {
        this.disconnectClient(client);
      }
    });
  }

  connectClient(client: WebSocketAcceptedClient) {
    this.clients.add(client);
  }

  disconnectClient(client: WebSocketAcceptedClient) {
    client.close();
    this.clients.delete(client);
  }

  disconnectAllClients() {
    for (const client of this.clients) {
      this.disconnectClient(client);
    }
  }
}
