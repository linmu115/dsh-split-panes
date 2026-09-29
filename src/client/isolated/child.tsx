import { adaptSessions } from './navigation.ts'
import { useSyncExternalStore } from 'react'
import type { ClientContext, Sessions, Sidebar } from './contracts.ts'
import { accepts, envelope, type Command, type Notice, type ViewIdentity, type ViewSummary } from './protocol.ts'
import { observeViewFocus } from './focus.ts'
import css from './workspace.module.css'
import { bindSidebarChrome } from './sidebar-chrome.ts'
import { installLayout } from './layout.ts'

export function installChild(ctx: ClientContext, identity: ViewIdentity): void {
  const sessions = adaptSessions(ctx)
  const origin = window.location.origin
  const notify = (body: Notice) => window.parent.postMessage(envelope(identity, body), origin)
  let chromeBinding: ReturnType<typeof bindSidebarChrome> | undefined
  let chromeCommand: Extract<Command,{type:'sidebar-chrome'}> | undefined
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
    if (body.type === 'sidebar-chrome') {
      if (!Number.isSafeInteger(body.revision) || !body.value || typeof body.value.panelOpen !== 'boolean' || typeof body.value.bottomOpen !== 'boolean' || ![body.value.width,body.value.bottomHeight].every(Number.isFinite)) return
      chromeCommand=body; chromeBinding?.apply(body.value,body.revision,body.active)
    } else if (body.type === 'geometry') {
      const { left, width, sidebar, bottom = 0, active } = body.value
      if (![left, width, sidebar, bottom].every(n => Number.isFinite(n) && n >= 0)) return
      const style = document.body.style
      style.setProperty('--mv-left', `${left}px`)
      style.setProperty('--mv-width', `${width}px`)
      style.setProperty('--mv-sidebar', `${sidebar}px`)
      style.setProperty('--mv-bottom', `${bottom}px`)
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
      let stage: 'catalog' | 'open' = 'catalog'
      try {
        const snapshot = sessions.list.getSnapshot()
        if (snapshot.phase === 'pending' || (body.sessionId && snapshot.byId && !snapshot.byId[body.sessionId])) await sessions.refresh()
        if (disposed || requestedRevision !== body.revision) return
        document.body.toggleAttribute('data-mv-blank', body.sessionId === null)
        stage = 'open'
        if (body.sessionId !== null) sessions.open(body.sessionId)
        revision = body.revision
        initialized = body.sessionId !== null
        previous = undefined
        document.body.dataset.mvReady = ''
        notify({ type: 'navigated', revision })
      } catch (error) {
        if (disposed || requestedRevision !== body.revision) return
        console.warn('[dsh-split-panes] view navigation failed', { stage, revision: body.revision, sessionId: body.sessionId, error: error instanceof Error ? error.message : String(error) })
        notify({ type: 'error', revision: body.revision, stage, message: '会话未能打开，可在左侧重新选择。' })
      } finally {
        if (requestedRevision === body.revision) { applying = false; publish() }
      }
    }
  }
  ctx.effect(() => installLayout('child'), 'independent-views: child presentation')
  ctx.effect(() => {
    const focus = () => {chromeBinding?.focus();notify({ type: 'focus' })}
    window.addEventListener('message', receive)
    const unwatchFocus = observeViewFocus(document, focus)
    const blank = document.createElement('div')
    blank.dataset.mvBlankPrompt = ''
    const hint = document.createElement('p'); hint.textContent = '从左侧选择会话，或新建会话。'
    const start = document.createElement('button'); start.textContent = '新建会话'
    start.onclick = () => {
      initialized = true; previous = sessions.list.getSnapshot().current ?? null; document.body.removeAttribute('data-mv-blank')
      ;(ctx.get('uiWorkspace') as { startSession(): void }).startSession()
    }
    blank.append(hint, start); document.body.append(blank)
    const unsubscribe = sessions.list.subscribe(publish)
    notify({ type: 'ready' })
    return () => {
      blank.remove(); disposed = true; unsubscribe()
      window.removeEventListener('message', receive)
      unwatchFocus()
    }
  }, 'independent-views: child channel')

  // Every child uses its own unmodified BetterSidebar service and sticker pages.
  ctx.inject(['betterSidebar', 'sidebarRight'], childCtx => {
    const sidebar = childCtx.get('betterSidebar') as Sidebar
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
      chromeBinding=bindSidebarChrome(sidebar,(value,revision,sessionId)=>notify({type:'sidebar',value,revision,sessionId}),document,requestAnimationFrame,cancelAnimationFrame,childCtx.get('sidebarRight') as import('./sidebar-chrome.ts').NativeSidebar)
      if(chromeCommand) chromeBinding.apply(chromeCommand.value,chromeCommand.revision,chromeCommand.active)
      const unregister = sidebar.registerTab({ id: 'independent-main-views', title: '主窗口', single: true, order: 15, component: ViewControls })
      return () => { chromeBinding?.dispose(); chromeBinding=undefined; unregister() }
    }, 'independent-views: sidebar controls')
  })
}
