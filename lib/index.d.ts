import { IncomingMessage } from "node:http";
import { Duplex } from "node:stream";
//#region src/index.d.ts
interface HostContext {
  webServer: {
    registerUpgrade(route: {
      path: string;
      handler: (req: IncomingMessage, socket: Duplex, head: Buffer) => void;
    }): () => void;
  };
  on(name: string, callback: (rows: Array<{
    kind: 'script';
    placement: 'head';
    text: string;
  }>) => void): () => void;
  effect(callback: () => () => void, label?: string): unknown;
}
declare const inject: string[];
/** Transport only. Existing plugins retain their own endpoints and independent subscriptions. */
declare function apply(ctx: HostContext): void;
//#endregion
export { apply, inject };