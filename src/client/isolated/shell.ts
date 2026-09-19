import type { Sessions } from './contracts.ts'
import type { ViewModel } from './model.ts'
import { accepts, envelope, type Geometry, type Notice } from './protocol.ts'

/** Parent controls views; children keep their own complete plugin runtime. */
export function createShell(sessions: Sessions, model: ViewModel, host = window) {
  const frames = new Map<string, Window>()
  const sent = new Map<string, number>()
  let mirroring = false, lastSelection = sessions.list.getSnapshot().current ?? null
  let mirrorGeneration = 0, disposed = false
  const mirror = () => {
    const generation = ++mirrorGeneration
    const state = model.getSnapshot(), active = state.views.find(v => v.id === state.active)!
    const selected = active.sessionId
    const apply = () => {
      if (disposed || generation !== mirrorGeneration) return
      lastSelection = selected
      mirroring = true
      try {
        if (selected === null) sessions.clear()
        else if (sessions.list.getSnapshot().current !== selected) sessions.open(selected)
      } finally { mirroring = false }
    }
    const snapshot = sessions.list.getSnapshot()
    if (selected && snapshot.byId && !snapshot.byId[selected]) {
      // A child can announce a freshly created session before the outer list stream arrives.
      void sessions.refresh().then(apply).catch(() => {
        if (!disposed && generation === mirrorGeneration) model.patch(active.id, { error: '外层会话列表暂未同步，可稍后重新选择此窗口。' })
      })
    } else apply()
  }
  const focus = (id: string) => { model.focus(id); mirror() }
  const synchronize = () => {
    const state = model.getSnapshot()
    for (const view of state.views) {
      const child = frames.get(view.id)
      if (!child || !view.ready) continue
      child.postMessage(envelope(view, { type: 'views', items: state.views.map(v => ({ id: v.id, sessionId: v.sessionId, active: v.id === state.active })) }), host.location.origin)
      if (sent.get(view.id) === view.revision) continue
      sent.set(view.id, view.revision)
      child.postMessage(envelope(view, { type: 'navigate', revision: view.revision, sessionId: view.sessionId }), host.location.origin)
    }
  }
  const receive = (event: MessageEvent) => {
    const view = model.getSnapshot().views.find(v => {
      const frame = frames.get(v.id)
      return frame && accepts(event, host.location.origin, frame, v)
    })
    if (!view) return
    const body = event.data.body as Notice
    switch (body.type) {
      case 'ready': sent.delete(view.id); model.patch(view.id, { ready: true, error: null }); break
      case 'focus': focus(view.id); break
      case 'selection':
        if (body.revision !== view.revision || (body.sessionId !== null && typeof body.sessionId !== 'string')) return
        if (body.sessionId !== view.sessionId) model.patch(view.id, { sessionId: body.sessionId })
        if (model.getSnapshot().active === view.id) mirror()
        break
      case 'sidebar':
        if (Number.isFinite(body.width) && body.width >= 0 && body.width !== view.sidebar) model.patch(view.id, { sidebar: body.width })
        break
      case 'manage':
        if (view.id !== model.getSnapshot().active) return
        if (body.action === 'add') model.add()
        if (body.action === 'close') model.close(body.id ?? view.id)
        if (body.action === 'focus' && body.id) model.focus(body.id)
        mirror()
        break
      case 'error': model.patch(view.id, { error: '这个窗口暂时未就绪，请重新选择会话。' }); break
    }
  }
  const unselect = sessions.list.subscribe(() => {
    const selected = sessions.list.getSnapshot().current ?? null
    if (mirroring || selected === lastSelection) return
    ++mirrorGeneration
    lastSelection = selected
    model.navigate(selected)
  })
  const unsubscribe = model.subscribe(synchronize)
  host.addEventListener('message', receive)
  return {
    attach(id: string, child: Window | null) {
      if (child) frames.set(id, child)
      else { frames.delete(id); sent.delete(id) }
      synchronize()
    },
    geometry(id: string, value: Geometry) {
      const view = model.getSnapshot().views.find(v => v.id === id), child = frames.get(id)
      if (view && child) child.postMessage(envelope(view, { type: 'geometry', value }), host.location.origin)
    },
    add() { model.add(); mirror() },
    close(id: string) { model.close(id); mirror() },
    focus,
    dispose() { disposed = true; ++mirrorGeneration; unselect(); unsubscribe(); host.removeEventListener('message', receive); frames.clear(); sent.clear() },
  }
}
export type Shell = ReturnType<typeof createShell>
