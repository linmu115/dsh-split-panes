// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { createViewModel } from '../src/client/isolated/model.ts'
import { createShell } from '../src/client/isolated/shell.ts'
import { accepts, envelope, frameUrl, viewGeometry } from '../src/client/isolated/protocol.ts'

describe('isolated main view protocol', () => {
  it('requires exact origin, source frame, nonce and view identity', () => {
    const source = {} as Window, id = { id: 'one', nonce: 'nonce' }
    const event = { origin: 'http://localhost', source, data: envelope(id, { type: 'focus' }) }
    expect(accepts(event, event.origin, source, id)).toBe(true)
    expect(accepts({ ...event, origin: 'https://elsewhere' }, event.origin, source, id)).toBe(false)
    expect(accepts({ ...event, source: {} as Window }, event.origin, source, id)).toBe(false)
    expect(accepts(event, event.origin, source, { ...id, nonce: 'other' })).toBe(false)
  })
  it('constructs same-origin frames without copying authentication queries', () => {
    const url = frameUrl(new URL('http://localhost:123/?token=do-not-copy#private') as unknown as Location, { id: 'a', nonce: 'b' })
    expect(url).toBe('http://localhost:123/?dshMainView=a&dshViewChannel=b')
  })
  it('keeps the sidebar on the far right and limits its geometry without collapsing main views', () => {
    expect(viewGeometry(1205, 400, 2, .5)).toEqual({ sidebar: 400, center: 805, first: 400, secondLeft: 405, second: 400 })
    expect(viewGeometry(1000, 900, 2, .5).sidebar).toBe(450)
  })
  it('adds a blank view and preserves the survivor on close', () => {
    let id = 0
    const m = createViewModel('a', () => String(++id))
    m.add(); m.navigate('b'); m.add()
    expect(m.getSnapshot().views.map(v => v.sessionId)).toEqual(['a', 'b'])
    m.close(m.getSnapshot().active)
    expect(m.getSnapshot().views.map(v => v.sessionId)).toEqual(['a'])
  })
  it('routes parent navigation only to the active frame and rejects stale selection replies', () => {
    let current: string | undefined = 'a'
    const listeners = new Set<() => void>()
    const sessions = {
      list: { getSnapshot: () => ({ current }), subscribe: (f: () => void) => { listeners.add(f); return () => { listeners.delete(f) } } },
      open: (id: string) => { current = id; for (const f of listeners) f() },
      clear: () => { current = undefined; for (const f of listeners) f() }, refresh: async () => {},
    }
    let id = 0
    const m = createViewModel('a', () => String(++id)), shell = createShell(sessions, m)
    const left = { postMessage: vi.fn() } as unknown as Window
    shell.attach(m.getSnapshot().active, left)
    const first = m.getSnapshot().views[0]!
    const receive = (view: typeof first, source: Window, body: Parameters<typeof envelope>[1]) => window.dispatchEvent(new MessageEvent('message', {
      origin: window.location.origin, source, data: envelope(view, body),
    }))
    receive(first, left, { type: 'ready' })
    shell.add()
    const second = m.getSnapshot().views[1]!, right = { postMessage: vi.fn() } as unknown as Window
    shell.attach(second.id, right); receive(second, right, { type: 'ready' })
    sessions.open('b')
    expect(m.getSnapshot().views.map(v => v.sessionId)).toEqual(['a', 'b'])
    receive(second, right, { type: 'selection', revision: 0, sessionId: 'stale' })
    expect(m.getSnapshot().views[1]!.sessionId).toBe('b')
    const revision = m.getSnapshot().views[1]!.revision
    receive(second, right, { type: 'selection', revision, sessionId: 'c' })
    expect(current).toBe('c')
    expect(m.getSnapshot().views.map(v => v.sessionId)).toEqual(['a', 'c'])
    shell.focus(first.id)
    expect(current).toBe('a')
    expect(m.getSnapshot().views[1]!.sessionId).toBe('c')
    shell.dispose()
  })
  it('waits for newly created child sessions without overriding a later outer selection', async () => {
    let current: string | undefined = 'a'
    let byId: Record<string, {}> = { a: {}, b: {} }
    const listeners = new Set<() => void>()
    const notify = () => { for (const fn of listeners) fn() }
    let resolveRefresh: () => void = () => {}
    const sessions = {
      list: { getSnapshot: () => ({ current, byId }), subscribe: (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn) } } },
      open: (id: string) => { if (!byId[id]) throw Error('Unknown session'); current = id; notify() },
      clear: () => { current = undefined; notify() },
      refresh: () => new Promise<void>(resolve => { resolveRefresh = () => { byId = {...byId, new: {}}; notify(); resolve() } }),
    }
    const model = createViewModel('a'), shell = createShell(sessions, model)
    const view = model.getSnapshot().views[0]!, frame = {postMessage: vi.fn()} as unknown as Window
    shell.attach(view.id, frame)
    const selectNew = () => window.dispatchEvent(new MessageEvent('message', {origin:location.origin, source:frame,
      data:envelope(view, {type:'selection', revision:model.getSnapshot().views[0]!.revision, sessionId:'new'})}))
    selectNew(); expect(current).toBe('a')
    resolveRefresh(); await Promise.resolve(); await Promise.resolve()
    expect(current).toBe('new')
    expect(model.getSnapshot().views[0]!.sessionId).toBe('new')
    sessions.open('a'); byId = {a:{}, b:{}}; selectNew()
    sessions.open('b'); resolveRefresh(); await Promise.resolve(); await Promise.resolve()
    expect(current).toBe('b')
    expect(model.getSnapshot().views[0]!.sessionId).toBe('b')
    shell.dispose()
  })

})
