import type { ISessions } from '@deepseek-ai/dsh-api-session-controller/client'
import type { Context } from '@deepseek-ai/cordis'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type {} from '@deepseek-ai/dsh-client-ui-workspace/client'
import type { ClientContext, Sessions } from './contracts.ts'
/** Adapt the 0.2 catalog + public UI navigation to the view coordinator. */
export function adaptSessions(ctx: ClientContext): Sessions {
  const catalog = ctx.get('sessions') as Pick<ISessions, 'list' | 'refresh'>
  const navigation = ctx.get('uiWorkspace') as Pick<Context['uiWorkspace'], 'openSession'>
  return {
    list: {
      getSnapshot() {
        const snapshot = catalog.list.getSnapshot()
        const current = Object.entries(snapshot.byId ?? {}).find(([, row]) =>
          (row.retainedBy.mainView ?? 0) > 0)?.[0]
        return {...snapshot, ...(current === undefined ? {} : {current})}
      },
      subscribe: fn => catalog.list.subscribe(fn),
    },
    open: id => navigation.openSession(id as SessionId),
    // A local empty view owns no host selection; do not create or archive a session.
    clear: () => {},
    refresh: () => catalog.refresh(),
  }
}


/** A resolved refresh can still carry a transport failure; observe the actual catalog. */
export async function waitForCatalogSession(sessions: Sessions, id: string, signal: AbortSignal, timeoutMs = 15000): Promise<void> {
  signal.throwIfAborted()
  const available = () => {
    const snapshot = sessions.list.getSnapshot()
    return snapshot.phase === 'ready' && snapshot.byId?.[id] !== undefined
  }
  if (available()) return
  await new Promise<void>((resolve, reject) => {
    let done = false, unsubscribe: (() => void) | undefined
    const finish = (error?: unknown) => {
      if (done) return
      done = true; clearTimeout(timer); unsubscribe?.(); signal.removeEventListener('abort', abort)
      if (error === undefined) resolve(); else reject(error)
    }
    const abort = () => finish(signal.reason ?? new Error('View navigation cancelled'))
    const sync = () => { if (available()) finish() }
    const timer = setTimeout(() => finish(new Error('Session catalog did not make the requested session available')), timeoutMs)
    unsubscribe = sessions.list.subscribe(sync)
    if (done) { unsubscribe(); return }
    signal.addEventListener('abort', abort, { once: true })
    if (signal.aborted) { abort(); return }
    // Reconnection may publish a usable catalog after this refresh resolves unsuccessfully.
    void sessions.refresh().then(sync, finish)
    sync()
  })
}
