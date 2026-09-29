import type { ClientContext, Sessions } from './contracts.ts'
/** Adapt the 0.2 catalog + public UI navigation to the view coordinator. */
export function adaptSessions(ctx: ClientContext): Sessions {
  const catalog = ctx.get('sessions') as { list: Sessions['list']; refresh(): Promise<void> }
  const navigation = ctx.get('uiWorkspace') as { openSession(id: string): void; startSession(): void }
  return {
    list: {
      getSnapshot() {
        const snapshot = catalog.list.getSnapshot()
        const current = Object.entries(snapshot.byId ?? {}).find(([, row]) =>
          ((row as {retainedBy?: {mainView?: number}}).retainedBy?.mainView ?? 0) > 0)?.[0]
        return {...snapshot, ...(current === undefined ? {} : {current})}
      },
      subscribe: fn => catalog.list.subscribe(fn),
    },
    open: id => navigation.openSession(id),
    // A local empty view owns no host selection; do not create or archive a session.
    clear: () => {},
    refresh: () => catalog.refresh(),
  }
}
