import { installOnboardingOwner } from './isolated/onboarding.tsx'
import { adaptSessions } from './isolated/navigation.ts'
import type { ClientContext, Sessions } from './isolated/contracts.ts'
import { childIdentity } from './isolated/protocol.ts'
import { installChild } from './isolated/child.tsx'
import { installLayout } from './isolated/layout.ts'
import { createViewModel } from './isolated/model.ts'
import { createShell } from './isolated/shell.ts'
import { installSurface } from './isolated/surface.tsx'

export const inject = ['slots', 'sessions', 'uiWorkspace']

/** Each child loads the ordinary application in its own JS realm and document. */
export function apply(ctx: ClientContext): void {
  const identity = childIdentity(new URL(window.location.href))
  if (window.parent !== window) {
    if (identity) { installOnboardingOwner(ctx, true); installChild(ctx, identity) }
    return // Never nest another shell inside a frame.
  }
  const onboarding = installOnboardingOwner(ctx, false)
  const sessions = adaptSessions(ctx)
  const model = createViewModel(sessions.list.getSnapshot().current ?? null)
  const shell = createShell(sessions, model)
  ctx.effect(() => () => shell.dispose(), 'independent-views: shell channel')
  ctx.effect(() => installLayout('shell'), 'independent-views: outer layout')
  installSurface(ctx, model, shell, onboarding)
}
