import type { IncomingMessage } from 'node:http'
import type { Duplex } from 'node:stream'
import { browserBootstrap } from './transport/browser.js'
import { createEventTransport, TRANSPORT_PATH } from './transport/server.ts'
interface HostContext {
  connection: {requestRejection(req: IncomingMessage): 401 | 403 | undefined}
  webServer: { registerUpgrade(route: {path:string; handler:(req:IncomingMessage, socket:Duplex, head:Buffer)=>void}): () => void }
  on(name: string, callback: (rows: Array<{kind:'script'; placement:'head'; text:string}>) => void): () => void
  effect(callback: () => () => void, label?: string): unknown
}
export const inject = ['webServer', 'connection']
/** Transport only. Existing plugins retain their own endpoints and independent subscriptions. */
export function apply(ctx: HostContext): void {
  ctx.effect(() => {
    const transport = createEventTransport()
    const unregister = ctx.webServer.registerUpgrade({path:TRANSPORT_PATH, handler:(req, socket, head) => {
      const rejection = ctx.connection.requestRejection(req)
      if (rejection !== undefined) { socket.end(`HTTP/1.1 ${rejection} Rejected\r\nConnection: close\r\n\r\n`); return }
      transport.handler(req, socket, head)
    }})
    const uninject = ctx.on('webserver/index-inject', rows => rows.push({kind:'script', placement:'head', text:`(${browserBootstrap.toString()})();`}))
    return () => { uninject(); unregister(); transport.dispose() }
  }, 'independent-views: isolated event transport')
}
