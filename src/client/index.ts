import type { ClientContext, Sessions } from './isolated/contracts.ts'
import { childIdentity } from './isolated/protocol.ts'
import { installChild } from './isolated/child.tsx'
import { installLayout } from './isolated/layout.ts'
import { createViewModel } from './isolated/model.ts'
import { createShell } from './isolated/shell.ts'
import { installSurface } from './isolated/surface.tsx'

export const inject = ['slots', 'sessions']

/** Each child loads the ordinary application in its own JS realm and document. */
export function apply(ctx: ClientContext): void {
  const identity = childIdentity(new URL(window.location.href))
  if (window.parent !== window) {
    if (identity) installChild(ctx, identity)
    return // Never nest another shell inside a frame.
  }
  const sessions = ctx.get('sessions') as Sessions
  const model = createViewModel(sessions.list.getSnapshot().current ?? null)
  const shell = createShell(sessions, model)
  ctx.effect(() => () => shell.dispose(), 'independent-views: shell channel')
  ctx.effect(() => installLayout('shell'), 'independent-views: outer layout')
  installSurface(ctx, model, shell)
}
