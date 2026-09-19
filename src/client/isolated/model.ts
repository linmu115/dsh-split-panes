import type { ViewIdentity } from './protocol.ts'
export interface View extends ViewIdentity {
  sessionId: string | null
  revision: number
  sidebar: number
  ready: boolean
  error: string | null
}
export interface ModelState { views: View[]; active: string; ratio: number }
export function createViewModel(initial: string | null, uuid = () => crypto.randomUUID()) {
  const make = (sessionId: string | null): View => ({ id: uuid(), nonce: uuid(), sessionId, revision: 0, sidebar: 0, ready: false, error: null })
  const first = make(initial)
  let state: ModelState = { views: [first], active: first.id, ratio: .5 }
  const listeners = new Set<() => void>()
  const update = (next: ModelState) => { state = next; for (const fn of listeners) fn() }
  const patch = (id: string, value: Partial<View>) => {
    if (!state.views.some(v => v.id === id)) return
    update({ ...state, views: state.views.map(v => v.id === id ? { ...v, ...value } : v) })
  }
  return {
    getSnapshot: () => state,
    subscribe: (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn) } },
    patch,
    add() {
      if (state.views.length >= 2) return
      const view = make(null)
      update({ ...state, views: [...state.views, view], active: view.id })
    },
    close(id: string) {
      if (state.views.length === 1 || !state.views.some(v => v.id === id)) return
      const views = state.views.filter(v => v.id !== id)
      update({ ...state, views, active: state.active === id ? views[0]!.id : state.active })
    },
    focus(id: string) {
      if (state.active !== id && state.views.some(v => v.id === id)) update({ ...state, active: id })
    },
    ratio(value: number) { if (Number.isFinite(value)) update({ ...state, ratio: Math.max(.2, Math.min(.8, value)) }) },
    navigate(sessionId: string | null) {
      const active = state.views.find(v => v.id === state.active)!
      patch(active.id, { sessionId, revision: active.revision + 1, error: null })
    },
  }
}
export type ViewModel = ReturnType<typeof createViewModel>
