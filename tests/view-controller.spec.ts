import { describe, expect, it } from 'vitest'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import { createViewController } from '../src/client/view-controller.ts'
import { allLeaves } from '../src/client/pane-layout-store.ts'

function bench(initial: string | undefined = 'a') {
  let current = initial as SessionId | undefined
  const listeners = new Set<() => void>()
  const set = (id: SessionId | undefined) => { current = id; for (const fn of listeners) fn() }
  const sessions = {
    list: { getSnapshot: () => ({ current }), subscribe: (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn) } } },
    open: (id: SessionId) => set(id), clear: () => set(undefined),
  }
  const controller = createViewController(sessions)
  return { controller, sessions, leaves: () => allLeaves(controller.store.getSnapshot().root) }
}

describe('independent main view navigation', () => {
  it('opens only an explicit second blank view, with a two-view UI limit', () => {
    const { controller: c, sessions, leaves } = bench()
    expect(leaves().map(p => p.sessionId)).toEqual(['a'])
    c.add()
    expect(leaves().map(p => p.sessionId)).toEqual(['a', null])
    expect(sessions.list.getSnapshot().current).toBeUndefined()
    c.add()
    expect(leaves()).toHaveLength(2)
  })
  it('routes sidebar selections and ordinary navigation only to the active view', () => {
    const { controller: c, sessions, leaves } = bench()
    c.add()
    c.select('b' as SessionId)
    c.focus(leaves()[0]!.id)
    sessions.open('c' as SessionId)
    expect(leaves().map(p => p.sessionId)).toEqual(['c', 'b'])
    c.focus(leaves()[1]!.id)
    sessions.clear()
    expect(leaves().map(p => p.sessionId)).toEqual(['c', null])
  })
  it('closing the focused view preserves the survivor instead of reopening the closed session', () => {
    const { controller: c, sessions, leaves } = bench()
    c.add()
    c.select('b' as SessionId)
    c.close()
    expect(leaves().map(p => p.sessionId)).toEqual(['a'])
    expect(sessions.list.getSnapshot().current).toBe('a')
  })
  it('closing the original view leaves a blank survivor blank', () => {
    const { controller: c, sessions, leaves } = bench()
    const original = leaves()[0]!.id
    c.add()
    c.focus(original)
    c.close()
    expect(leaves().map(p => p.sessionId)).toEqual([null])
    expect(sessions.list.getSnapshot().current).toBeUndefined()
  })
  it('ignores stale view focus and unregisters its selection observer on disposal', () => {
    const { controller: c, sessions, leaves } = bench()
    c.focus('removed')
    expect(sessions.list.getSnapshot().current).toBe('a')
    c.dispose()
    sessions.open('b' as SessionId)
    expect(leaves().map(p => p.sessionId)).toEqual(['a'])
  })
})
