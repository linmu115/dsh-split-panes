import { useEffect } from 'react'
import type { ClientContext } from './contracts.ts'

/** A child application is mounted only after the outer coordinator reaches us. */
export function createOnboardingGate() {
  let ready = false
  const listeners = new Set<() => void>()
  return {
    getSnapshot: () => ready,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } },
    release: () => { if (ready) return; ready = true; for (const listener of listeners) listener() },
  }
}
export type OnboardingGate = ReturnType<typeof createOnboardingGate>

/** The ordinary SettingsRoot owns every official acknowledgement and credential step. */
export function installOnboardingOwner(ctx: ClientContext, child: boolean): OnboardingGate {
  const gate = createOnboardingGate()
  function FrameReady({ complete }: { complete(): void }) {
    useEffect(() => { gate.release(); complete() }, [complete])
    return null
  }
  // Hold automatic child onboarding at our own step. The authenticated parent
  // document is the single owner; no other registrant's complete/ack is called.
  // Explicit settings reopen selects its requested id and bypasses this step.
  function ParentOwnsOnboarding() { return null }
  ctx.slots.inject('settings.onboarding', () => ctx.slots.register({
    name: 'settings.onboarding', id: child ? 'dsh-split:parent-onboarding' : 'dsh-split:frames-ready',
    order: child ? -Number.MAX_VALUE : Number.MAX_VALUE,
  }, child ? ParentOwnsOnboarding : FrameReady))
  if (!child) {
    // Match official SettingsRoot: an already selected nonblank Session does
    // not run automatic onboarding, so it does not need the trailing step.
    const sessions = ctx.get('sessions') as { list: {
      getSnapshot(): { phase: string; byId: Record<string, { blank?: boolean; retainedBy: Record<string, number> }> }
      subscribe(listener: () => void): () => void
    } }
    ctx.effect(() => {
      const sync = () => {
        const snapshot = sessions.list.getSnapshot()
        const selected = Object.values(snapshot.byId).find(row => (row.retainedBy.mainView ?? 0) > 0)
        if (snapshot.phase === 'ready' && selected !== undefined && selected.blank === false) gate.release()
      }
      const off = sessions.list.subscribe(sync); sync(); return off
    }, 'independent-views: onboarding readiness')
  }
  return gate
}

/** Our body portal must honor the official root's blocking modal ownership. */
export function mirrorRootInert(surface: HTMLElement, doc = document): () => void {
  const sync = () => {
    const root = doc.getElementById('root')
    const blocked = root?.inert === true || root?.hasAttribute('inert') === true
    if (surface.inert !== blocked) surface.inert = blocked
    if (surface.hasAttribute('inert') !== blocked) surface.toggleAttribute('inert', blocked)
    surface.style.visibility = blocked ? 'hidden' : ''
  }
  const observer = new MutationObserver(sync)
  observer.observe(doc.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['inert'] })
  sync()
  return () => { observer.disconnect(); surface.inert = false; surface.removeAttribute('inert'); surface.style.visibility = '' }
}
