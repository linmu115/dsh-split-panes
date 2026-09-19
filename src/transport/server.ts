import { request } from 'node:http'
import type { IncomingMessage } from 'node:http'
import type { Duplex } from 'node:stream'
import { WebSocketServer, WebSocket } from 'ws'

export const TRANSPORT_PATH = '/dsh-split-panes/event-transport'
/** One browser stream -> one upstream request. No cross-view sharing or event interpretation. */
export function createEventTransport() {
  const server = new WebSocketServer({ noServer: true, maxPayload: 16384, perMessageDeflate: false })
  const alive = new WeakSet<WebSocket>()
  const heartbeat = setInterval(() => {
    for (const ws of server.clients) {
      if (!alive.has(ws)) { ws.terminate(); continue }
      alive.delete(ws); ws.ping()
    }
  }, 30000)
  heartbeat.unref()
  const handler = (req: IncomingMessage, socket: Duplex, head: Buffer) => {
    const expected = `http://${req.headers.host}`
    if (req.headers.origin !== expected || !req.socket.localPort) { socket.destroy(); return }
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(new URL(expected).hostname)) { socket.destroy(); return }
    server.handleUpgrade(req, socket, head, ws => {
      alive.add(ws); ws.on('pong', () => alive.add(ws))
      let started = false
      const timer = setTimeout(() => ws.close(1008), 5000)
      ws.once('close', () => clearTimeout(timer))
      ws.once('error', () => {})
      ws.on('message', bytes => {
        if (started) { ws.close(1008); return }
        started = true; clearTimeout(timer)
        let path: string, lastEventId: string
        try {
          const value = JSON.parse(bytes.toString())
          path = value.path; lastEventId = value.lastEventId ?? ''
          if (typeof path !== 'string' || path.length > 8192 || !path.startsWith('/') || path.startsWith('//')
            || path.includes('\\') || typeof lastEventId !== 'string' || /[\r\n\0]/.test(lastEventId)) throw Error()
          const url = new URL(path, expected)
          if (url.origin !== expected || url.pathname.startsWith('/dsh-split-panes/')) throw Error()
          path = url.pathname + url.search
        } catch { ws.close(1008); return }
        const headers: Record<string, string> = { accept: 'text/event-stream', 'cache-control': 'no-cache', origin: expected, host: req.headers.host! }
        if (req.headers.cookie) headers.cookie = req.headers.cookie
        if (req.headers.authorization) headers.authorization = req.headers.authorization
        if (lastEventId) headers['last-event-id'] = Buffer.from(lastEventId, 'utf8').toString('latin1')
        // Fixed loopback destination; original endpoint still performs its own authentication.
        const upstream = request({ hostname: '127.0.0.1', port: req.socket.localPort, path, method: 'GET', headers }, response => {
          clearTimeout(headersTimeout)
          const type = response.headers['content-type'] ?? ''
          if (response.statusCode !== 200 || !type.toLowerCase().startsWith('text/event-stream')) {
            response.destroy(); ws.send(JSON.stringify({type:'fatal'})); ws.close(); return
          }
          ws.send(JSON.stringify({type:'open'})); response.setEncoding('utf8')
          response.on('data', (text: string) => {
            if (ws.readyState !== WebSocket.OPEN) { response.destroy(); return }
            if (ws.bufferedAmount > 4 * 1024 * 1024) { response.destroy(); ws.close(1013); return }
            response.pause()
            ws.send(JSON.stringify({type:'chunk', text}), error => { if (error) response.destroy(); else response.resume() })
          })
          response.once('end', () => ws.close())
          response.once('error', () => ws.close(1011))
          ws.once('close', () => response.destroy())
        })
        const headersTimeout = setTimeout(() => upstream.destroy(), 10000)
        ws.once('close', () => clearTimeout(headersTimeout))
        upstream.once('error', () => { if (ws.readyState === WebSocket.OPEN) ws.close(1011) })
        ws.once('close', () => upstream.destroy())
        upstream.end()
      })
    })
  }
  return { handler, dispose() { clearInterval(heartbeat); for (const ws of server.clients) ws.terminate(); server.close() } }
}
