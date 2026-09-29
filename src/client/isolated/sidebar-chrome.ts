import type { Sidebar } from './contracts.ts'
import type { SidebarChrome } from './protocol.ts'

export interface NativeSidebar {
  mounted: {getSnapshot(): string | undefined; subscribe(fn: () => void): () => void}
  isExpanded(): boolean
  toggleExpanded(): void
}
/** Visibility adapter only: original button callbacks own the sidebar store and all tab content. */
export function bindSidebarChrome(sidebar: Sidebar, report: (value: SidebarChrome, revision: number, sessionId: string | null) => void,
  doc = document, schedule = requestAnimationFrame, cancel = cancelAnimationFrame, native?: NativeSidebar) {
  let desired: SidebarChrome | null = null, revision = -1, active = false, disposed = false, pending = 0
  let adoptSession: string | null | undefined
  let baseline: SidebarChrome | null = null, session: string | null | undefined
  let nativeClick = false, awaitingControls = true, focusPending = false
  let userIntent: Partial<Pick<SidebarChrome,'panelOpen'|'bottomOpen'>> | null = null
  const read = () => {
    const snapshot = sidebar.getSnapshot(), state = snapshot.state
    return state ? {sessionId:native?.mounted.getSnapshot() ?? snapshot.sessionId ?? null, value:{panelOpen:native?.isExpanded() ?? state.panelOpen === true, bottomOpen:state.bottomOpen === true,
      width:state.width ?? 460, bottomHeight:state.bottomHeight ?? 280}} : null
  }
  const enqueue = () => { if (!disposed && !pending) pending = schedule(reconcile) }
  const reconcile = () => {
    pending = 0
    if (disposed || !desired || focusPending) return
    const current = read()
    if (!current) { baseline=null;session=undefined;return }
    if (adoptSession !== undefined) {
      // Native persisted layout is authoritative on the first active document mount.
      // Do not write the parent's placeholder false values into a restored session.
      if (!active || adoptSession === null || current.sessionId !== adoptSession
        || (native && native.mounted.getSnapshot() !== adoptSession)) return
      adoptSession = undefined; desired = {...current.value}
      session = current.sessionId; baseline = current.value; awaitingControls = false
      report(desired, revision, current.sessionId)
      return
    }
    session = current.sessionId; baseline=current.value
    const buttons = [...doc.querySelectorAll<HTMLButtonElement>('[data-dsh-toggle-cluster] button')]
    const rightMismatch = current.value.panelOpen !== desired.panelOpen
    const bottomMismatch = current.value.bottomOpen !== desired.bottomOpen
    awaitingControls = rightMismatch || bottomMismatch
    if (!awaitingControls) return
    if (rightMismatch && native && native.mounted.getSnapshot()) {
      nativeClick=true
      try { native.toggleExpanded() } finally { nativeClick=false }
      enqueue(); return
    }
    const button = native ? doc.querySelector<HTMLButtonElement>('[data-dsh-bottom-toggle]') : rightMismatch ? buttons.at(-1) : buttons.length > 1 ? buttons[0] : undefined
    // Controls may mount after the service. A DOM mutation will retry; do not busy-loop on missing controls.
    if (button && button.getAttribute('aria-disabled') !== 'true') {
      nativeClick=true
      try { button.click() } finally { nativeClick=false }
      enqueue()
    }
  }
  const changed = () => {
    const current = read()
    if (!current || !desired) {baseline=null;session=undefined;return}
    if (adoptSession !== undefined) { enqueue(); return }
    const previous=baseline, changedSession=current.sessionId!==session
    baseline=current.value; session=current.sessionId
    if (nativeClick) return
    if (changedSession || !previous) { enqueue();return }
    const change:Partial<Pick<SidebarChrome,'panelOpen'|'bottomOpen'>>={}
    if (current.value.panelOpen!==previous.panelOpen) change.panelOpen=current.value.panelOpen
    if (current.value.bottomOpen!==previous.bottomOpen) change.bottomOpen=current.value.bottomOpen
    if (focusPending) {if(Object.keys(change).length)userIntent={...userIntent,...change};return}
    if (!active) {enqueue();return}
    // Geometry belongs to the outer handles; per-session stored widths must not change it.
    const next={...desired,...change}
    if (JSON.stringify(next)!==JSON.stringify(desired)) {desired=next;report(next,revision,current.sessionId)}
  }
  const unlisten = sidebar.subscribeState(changed)
  const unmount = native?.mounted.subscribe(changed)
  const observer = new MutationObserver(() => {changed();if(awaitingControls) enqueue()})
  observer.observe(doc.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-rightbar-collapsed']})
  return {
    focus() {
      if(active||focusPending)return
      focusPending=true
      const current=read();baseline=current?.value??null;session=current?.sessionId
    },
    apply(value: SidebarChrome, nextRevision: number, selected: boolean, adopt?: string | null) {
      if (nextRevision < revision) return
      const same = nextRevision===revision && selected===active && adopt===adoptSession && JSON.stringify(value)===JSON.stringify(desired)
      desired={...value}; revision=nextRevision; active=selected; adoptSession=adopt
      if(selected&&focusPending){
        focusPending=false
        if(userIntent){const next={...desired,...userIntent};userIntent=null;desired=next;report(next,revision,read()?.sessionId??null)}
      }
      if (!same) enqueue()
    },
    dispose() {disposed=true; unlisten(); unmount?.(); observer.disconnect(); cancel(pending)},
  }
}
