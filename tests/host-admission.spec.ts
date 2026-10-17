import { describe, expect, it, vi } from 'vitest'
import { apply, inject } from '../src/index.ts'

describe('0.2.1 transport admission', () => {
  it('rejects an unauthenticated websocket before the event transport', () => {
    let route: any
    const cleanup: Array<() => void> = []
    const requestRejection = vi.fn(() => 401 as const)
    apply({ connection: { requestRejection }, webServer: { registerUpgrade: value => { route = value; return () => {} } },
      on: () => () => {}, effect(fn) { cleanup.push(fn()) },
    })
    try {
      expect(inject).toContain('connection')
      const socket = { end: vi.fn() }
      route.handler({ headers: {} }, socket, Buffer.alloc(0))
      expect(socket.end).toHaveBeenCalledWith('HTTP/1.1 401 Rejected\r\nConnection: close\r\n\r\n')
      expect(requestRejection).toHaveBeenCalledTimes(1)
    } finally { for (const dispose of cleanup.reverse()) dispose() }
  })
})
