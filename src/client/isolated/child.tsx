import { useSyncExternalStore } from 'react'
import type { ClientContext, Sessions, Sidebar } from './contracts.ts'
import { accepts, envelope, type Command, type Notice, type ViewIdentity, type ViewSummary } from './protocol.ts'
import { observeViewFocus } from './focus.ts'
import css from './workspace.module.css'
import { installLayout } from './layout.ts'

export function installChild(ctx: ClientContext, identity: ViewIdentity): void {
  const sessions = ctx.get('sessions') as Sessions
  const origin = window.location.origin
  const notify = (body: Notice) => window.parent.postMessage(envelope(identity, body), origin)
  let revision = -1, requestedRevision = -1, applying = false, initialized = false, disposed = false
  let previous: string | null | undefined
  let items: ViewSummary[] = []
  const listeners = new Set<() => void>()
  const publish = () => {
    if (!initialized || applying || disposed) return
    const sessionId = sessions.list.getSnapshot().current ?? null
    if (sessionId === previous) return
    previous = sessionId
    notify({ type: 'selection', revision, sessionId })
  }
  const receive = async (event: MessageEvent) => {
    if (!accepts(event, origin, window.parent, identity)) return
    const body = event.data.body as Command
    if (body.type === 'geometry') {
      const { left, width, sidebar, active } = body.value
      if (![left, width, sidebar].every(n => Number.isFinite(n) && n >= 0)) return
      const style = document.body.style
      style.setProperty('--mv-left', `${left}px`)
      style.setProperty('--mv-width', `${width}px`)
      style.setProperty('--mv-sidebar', `${sidebar}px`)
      style.setProperty('--mv-toggle-right', sidebar > 0 ? '10px' : `${Math.max(10, window.innerWidth - left - width + 10)}px`)
      document.body.toggleAttribute('data-mv-inactive', !active)
      document.body.toggleAttribute('data-mv-sidebar-open', sidebar > 0)
    } else if (body.type === 'views' && Array.isArray(body.items)) {
      items = body.items; for (const fn of listeners) fn()
    } else if (body.type === 'navigate') {
      if (!Number.isSafeInteger(body.revision) || body.revision < requestedRevision
        || (body.sessionId !== null && typeof body.sessionId !== 'string')) return
      requestedRevision = body.revision
      applying = true
      try {
        const snapshot = sessions.list.getSnapshot()
        if (snapshot.phase === 'pending' || (body.sessionId && snapshot.byId && !snapshot.byId[body.sessionId])) await sessions.refresh()
        if (disposed || requestedRevision !== body.revision) return
        if (body.sessionId === null) sessions.clear()
        else sessions.open(body.sessionId)
        revision = body.revision
        initialized = true
        previous = undefined
        document.body.dataset.mvReady = ''
      } catch {
        notify({ type: 'error', message: '会话未能打开，可在左侧重新选择。' })
      } finally {
        if (requestedRevision === body.revision) { applying = false; publish() }
      }
    }
  }
  ctx.effect(() => installLayout('child'), 'independent-views: child presentation')
  ctx.effect(() => {
    const focus = () => notify({ type: 'focus' })
    window.addEventListener('message', receive)
    const unwatchFocus = observeViewFocus(document, focus)
    const unsubscribe = sessions.list.subscribe(publish)
    notify({ type: 'ready' })
    return () => {
      disposed = true; unsubscribe()
      window.removeEventListener('message', receive)
      unwatchFocus()
    }
  }, 'independent-views: child channel')

  // Every child uses its own unmodified BetterSidebar service and sticker pages.
  ctx.inject(['betterSidebar'], childCtx => {
    const sidebar = childCtx.get('betterSidebar') as Sidebar
    let lastWidth = -1
    const measure = () => {
      const state = sidebar.getSnapshot().state
      const width = state?.panelOpen ? Math.max(0, state.width) : 0
      if (width !== lastWidth) { lastWidth = width; notify({ type: 'sidebar', width }) }
    }
    const ViewControls = () => {
      const views = useSyncExternalStore(fn => { listeners.add(fn); return () => { listeners.delete(fn) } }, () => items)
      return <div className={css.controls}>
        <div className={css.controlRow}>
          <strong>主窗口</strong><button className={css.circle} type="button" aria-label="添加主窗口" title="添加主窗口"
            disabled={views.length >= 2} onClick={() => notify({ type: 'manage', action: 'add' })}>＋</button>
        </div>
        {views.map((view, i) => <div key={view.id} className={css.controlRow}>
          <button className={css.viewChoice} type="button" aria-pressed={view.active} onClick={() => notify({ type: 'manage', action: 'focus', id: view.id })}>窗口 {i + 1}{view.sessionId === null ? ' · 新会话' : ''}</button>
          <button className={css.circle} type="button" aria-label={`关闭窗口 ${i + 1}`} disabled={views.length === 1}
            onClick={() => notify({ type: 'manage', action: 'close', id: view.id })}>×</button>
        </div>)}
      </div>
    }
    childCtx.effect(() => {
      const unlisten = sidebar.subscribeState(measure)
      const unregister = sidebar.registerTab({ id: 'independent-main-views', title: '主窗口', single: true, order: 15, component: ViewControls })
      measure()
      return () => { unlisten(); unregister() }
    }, 'independent-views: sidebar controls')
  })
}
