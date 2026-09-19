import { useEffect } from 'react'
import type { ReactNode } from 'react'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type { PaneLayoutState } from './pane-layout-store.ts'
import { createPaneLayoutStore } from './pane-layout-store.ts'
import { SplitContainer } from './SplitContainer.tsx'
import { sessionRowOf } from './session-row.ts'
import css from './PaneWorkspace.module.css'

export { SESSION_DRAG_TYPE } from './session-row.ts'

export type PaneLayoutActions = ReturnType<ReturnType<typeof createPaneLayoutStore>['create']>['actions']

/** The entry's inject face: selection-drive verbs plus the pane body renderer. */
export interface PaneWorkspaceInjected {
  /** Select a session as current — focusing a pane opens its session. */
  openSession: (sessionId: SessionId) => void
  focusPane: (paneId: string) => void
  /**
   * Split a pane and bind the NEW pane to an INDEPENDENT fresh conversation:
   * splitting anchors the original pane to the current selection; inside the
   * split tree the new pane stays a new-conversation placeholder (null
   * session) — the stock hero then starts its own conversation.
   */
  splitWithNew: (
    paneId: string,
    direction: 'horizontal' | 'vertical',
    anchor: SessionId | null,
  ) => void
  /** Split the FOCUSED pane (header-affordance route). */
  splitFocused: (direction: 'horizontal' | 'vertical') => void
  /** Close the FOCUSED pane (header-affordance route); no-op on a single pane. */
  closeFocused: () => void
  /** Whether the shared pane tree is currently split (close button visibility). */
  hasSplit: () => boolean
  /**
   * Show the FOCUSED pane alone while the tree stays intact, or leave
   * fullscreen. No-op on a single pane (already full-bleed).
   */
  toggleFullscreen: () => void
  /** Whether the focused pane is the one currently shown fullscreen. */
  isFullscreen: () => boolean
  /** Selector hook over the SHARED split tree (global viewing state). */
  usePaneStore: <S>(selector: (state: PaneLayoutState) => S) => S
  /** The shared split tree's bound actions. */
  paneActions: PaneLayoutActions
  /**
   * Render one pane's native conversation body for an explicit session. The
   * delegate owns the per-session renderer host; the workspace layouts it.
   * `sessionId` undefined is the new-conversation hero.
   */
  renderPane: (sessionId: SessionId | undefined, paneId: string) => ReactNode
  /**
   * Resolve the session a side-bar row element stands for (the click-routing
   * channel: `sessions.open()` does not report a selection change when the
   * clicked session is already current).
   */
  resolveRowSession: (row: HTMLElement) => SessionId | null
}

/** Full composed props: runtime (main panel, root scope) + inject + locale. */
export type PaneWorkspaceProps =
  & PropsRuntime<'main'>
  & InjectFace<PaneWorkspaceInjected>
  & PropsLocale<'panes'>

/** The outer application keeps its sidebars; only main content is rendered here. */
export function PaneWorkspace({ usePaneStore, paneActions, focusPane, openSession, renderPane, resolveRowSession, t }: PaneWorkspaceProps) {
  const state = usePaneStore(s => s)
  // Run before descendant click handlers and document-level reference handlers.
  // Keyboard navigation also activates the containing view before Enter is used.
  useEffect(() => {
    const activate = (event: Event) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const pane = target.closest<HTMLElement>('[data-main-view-id]')
      if (pane) focusPane(pane.dataset.mainViewId!)
    }
    const select = (event: MouseEvent) => {
      const row = sessionRowOf(event.target)
      if (!row) return
      const id = resolveRowSession(row)
      if (id) openSession(id)
    }
    document.addEventListener('pointerdown', activate, true)
    document.addEventListener('focusin', activate, true)
    document.addEventListener('click', select, true)
    return () => {
      document.removeEventListener('pointerdown', activate, true)
      document.removeEventListener('focusin', activate, true)
      document.removeEventListener('click', select, true)
    }
  }, [focusPane, openSession, resolveRowSession])

  const split = state.root.type === 'split'
  return <div data-slot="main.conversation" style={{ display: 'contents' }}><div className={css.host} data-dsh-main-views="" data-slot={split ? 'conversation.panes' : undefined}>
    <SplitContainer node={state.root} dividerLabel={t('pane.split.divider')}
      onSetRatio={(id, ratio) => paneActions.setRatio(id, ratio)}
      renderLeaf={leaf => <div key={leaf.id} className={split ? css.pane : css.singleSurface}
        data-main-view-id={leaf.id} data-focused={split && state.focusedPaneId === leaf.id || undefined}>
        {renderPane(leaf.sessionId ?? undefined, leaf.id)}
      </div>} />
  </div></div>
}
