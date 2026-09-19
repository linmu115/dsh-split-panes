// @vitest-environment jsdom
// Read-only diagnostic against the user's unmodified reference implementation.
// This is a compatibility gate, not a copied/rewritten reference implementation.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createViewController } from '../src/client/view-controller.ts'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import { allLeaves } from '../src/client/pane-layout-store.ts'

afterEach(() => { document.body.replaceChildren(); vi.unstubAllGlobals() })

describe.skipIf(!process.env.DSH_ANNOTATION_SOURCE)('unchanged reference plugin compatibility', () => {
  it('diagnoses source jump selecting the inactive first DOM copy after the active view opens that same session', async () => {
    // The dynamically resolved module is read directly from the existing plugin;
    // production code of split-panes never imports it.
    // @ts-expect-error optional local source is resolved by the test runner only
    const { AnnotationCoreClientService } = await import('@local-annotation/client/service.tsx')
    vi.stubGlobal('CSS', { escape: (value: string) => value })
    let current = 'a' as SessionId | undefined
    const listeners = new Set<() => void>()
    const sessions = {
      list: { getSnapshot: () => ({ current }), subscribe: (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn) } } },
      open: (id: SessionId) => { current = id; for (const fn of listeners) fn() },
      clear: () => { current = undefined; for (const fn of listeners) fn() },
    }
    const views = createViewController(sessions)
    views.add()
    views.select('b' as SessionId)
    const left = document.createElement('article')
    left.dataset.chatAnchorKey = 'original-anchor'
    left.textContent = 'original text'
    left.scrollIntoView = vi.fn()
    const right = document.createElement('article')
    right.dataset.chatAnchorKey = 'original-anchor'
    right.textContent = 'original text'
    right.scrollIntoView = vi.fn()
    // Models the DOM after the right pane adopts A; left A stays mounted.
    document.body.append(left, right)
    const ctx = { get: (name: string) => name === 'sessions' ? sessions : {
      binding: () => ({ target: () => ({ getSnapshot: () => ({ order: ['original-anchor'], nodes: new Map([['original-anchor', {}]]) }) }) }),
    } }
    const receiver = Object.assign(Object.create(AnnotationCoreClientService.prototype), {
      ctx, lifetime: new AbortController(),
    })
    await receiver.openDshSource({
      sourceType: 'dsh-message', selectedText: 'no matching range in this DOM fixture',
      locator: { sessionId: 'a', anchorId: 'original-anchor', occurrence: 0 },
    })
    expect(allLeaves(views.store.getSnapshot().root).map(p => p.sessionId)).toEqual(['a', 'a'])
    // Known incompatibility: navigation is correctly scoped, DOM lookup isn't.
    // A release acceptance test would require exactly the reverse result.
    expect(left.scrollIntoView).toHaveBeenCalledOnce()
    expect(right.scrollIntoView).not.toHaveBeenCalled()
    views.dispose()
  })
})
