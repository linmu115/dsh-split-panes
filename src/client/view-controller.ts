import type { SessionId } from '@deepseek-ai/dsh-session/types'
import { allLeaves, createPaneLayoutStore } from './pane-layout-store.ts'

export interface ViewSessions {
  list: { getSnapshot(): { current?: SessionId | undefined }; subscribe(fn: () => void): () => void }
  open(id: SessionId): void
  clear(): void
}

/** Generic navigation only. No reference, sticker or map service is involved. */
export function createViewController(sessions: ViewSessions) {
  const store = createPaneLayoutStore().create()
  const actions = store.actions
  let selected = sessions.list.getSnapshot().current
  actions.setPaneSession(store.getSnapshot().root.id, selected ?? null)
  const routeSelection = () => {
    const next = sessions.list.getSnapshot().current
    if (next === selected) return
    selected = next
    const state = store.getSnapshot()
    if (state.focusedPaneId) actions.setPaneSession(state.focusedPaneId, next ?? null)
  }
  const dispose = sessions.list.subscribe(routeSelection)
  const focus = (id: string) => {
    const leaf = allLeaves(store.getSnapshot().root).find(pane => pane.id === id)
    if (!leaf) return
    actions.focusPane(id)
    if (leaf.sessionId === null) {
      if (sessions.list.getSnapshot().current !== undefined) sessions.clear()
    } else if (sessions.list.getSnapshot().current !== leaf.sessionId) sessions.open(leaf.sessionId)
  }
  return {
    store, dispose, focus,
    add() {
      const state = store.getSnapshot()
      // Presentation limit only; the underlying layout model supports more panes.
      if (allLeaves(state.root).length >= 2) return
      const id = state.focusedPaneId ?? state.root.id
      actions.splitPane(id, 'horizontal', null)
      focus(store.getSnapshot().focusedPaneId!)
    },
    close(id = store.getSnapshot().focusedPaneId) {
      if (!id || store.getSnapshot().root.type === 'leaf') return
      actions.closePane(id)
      const next = store.getSnapshot().focusedPaneId
      if (next) focus(next)
    },
    select(id: SessionId) {
      const paneId = store.getSnapshot().focusedPaneId
      if (paneId) actions.setPaneSession(paneId, id)
      sessions.open(id)
    },
  }
}
