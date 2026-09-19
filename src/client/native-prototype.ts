/** Central native conversation views; optional controls register with BetterSidebar. */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import { createElement } from 'react'
// Type-only: pulls the slots registry's Context merge (ctx.slots).
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
// Type-only: pulls the ui-session Context merge (ctx.uiSession).
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
// Type-only: pulls the sessions-service Context merge (ctx.sessions).
import type {} from '@deepseek-ai/dsh-api-session-controller/client'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: pulls the ui-layout SlotMap merge ('conversation').
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type { StoredEntry } from '@deepseek-ai/dsh-client-ui-slots'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import { observableHook } from './vendor/renderer/bindings.tsx'
import { PaneConversation, type PaneRenderDeps } from './PaneConversation.tsx'
import { PaneWorkspace, type PaneWorkspaceInjected } from './PaneWorkspace.tsx'
import { createPaneRootSource } from './root-binding.ts'
import { createPaneStores } from './scoped-pane-stores.ts'
import { resolveSessionIdFromRow } from './session-row.ts'
import { type PaneLayoutState } from './pane-layout-store.ts'
import { createViewController } from './view-controller.ts'
import { ViewManager } from './ViewManager.tsx'
import { en, zh, type PaneKey } from './locales.ts'

export type { PaneWorkspaceProps, PaneWorkspaceInjected } from './PaneWorkspace.tsx'
export type { PaneKey } from './locales.ts'
export type { PaneLayoutState, PaneLeaf, PaneNode, PaneSplit } from './pane-layout-store.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Pane chrome and split-pane copy. */
    panes: PaneKey
  }
}

/** Dictionary namespace owned by this plugin (pane chrome copy). */
const NS = 'panes'

/** The priority at which this plugin shadows ui-conversation's root (0). */
const TAKEOVER_PRIORITY = -1

/** Services required by the panes plugin. */
export const inject = ['slots', 'locale', 'sessions', 'uiSession']

/**
 * Register the panes-plugin surfaces over ONE shared pane-layout store
 * instance: the conversation-column occupant (the pane workspace) and the
 * split/close buttons inside the conversation header's actions row.
 * @param ctx - Client root context.
 */
export function apply(ctx: ClientContext): void {
  const paneStores = createPaneStores()
  ctx.effect(() => () => paneStores.clear(), 'ui-panes: release local view stores')
  // The ONE shared split-tree instance (global viewing state).
  const controller = createViewController(ctx.sessions)
  ctx.effect(() => controller.dispose, 'ui-panes: selection subscription')
  const paneStore = controller.store
  const paneActions = paneStore.actions
  const usePaneStore = observableHook<PaneLayoutState>({
    getSnapshot: () => paneStore.getSnapshot(),
    subscribe: fn => paneStore.subscribe(fn),
  })

  // The renderer host inputs shared by every pane: the root standard-source
  // binding (rebuilt from the contributing services) and the live ledger.
  const rootSource = createPaneRootSource(ctx)
  const deps: PaneRenderDeps = {
    resolveStore: paneStores.resolve,
    ctx,
    rootSource,
    ledger: {
      entries: key => ctx.slots.entries(key as never) as unknown as readonly StoredEntry[],
      entriesOfSlot: key => ctx.slots.entriesOfSlot(key as never) as unknown as readonly StoredEntry[],
      spec: key => ctx.slots.spec(key as never) as unknown as
        { kind: string; scope: string; inject?: unknown } | undefined,
      subscribe: (key, fn) => ctx.slots.subscribe(key as never, fn),
      getVersion: key => ctx.slots.getVersion(key as never),
    },
    // This plugin's own conversation occupant must never win inside a pane —
    // dropping it is what makes the stock ConversationRoot the pane's root.
    excluded: entry => entry.component === (PaneWorkspace as unknown)
      || (entry.locale === 'sidebarRight' && ctx.slots.entries('conversation.session.header.corner' as never).includes(entry)),
    wrapEntry: (entry, paneId) => wrapPaneEntry(entry, paneId, {
      ctx,
      onSessionStarted: (paneId_, sessionId) => {
        paneActions.setPaneSession(paneId_, sessionId)
        paneActions.focusPane(paneId_)
      },
    }),
  }

  const operations: PaneWorkspaceInjected = {
    openSession: controller.select,
    focusPane: controller.focus,
    splitWithNew: () => controller.add(),
    splitFocused: () => controller.add(),
    closeFocused: () => controller.close(),
    hasSplit: () => paneStore.getSnapshot().root.type !== 'leaf',
    toggleFullscreen: () => {},
    isFullscreen: () => false,
    usePaneStore,
    paneActions,
    renderPane: (sessionId, paneId) =>
      createElement(PaneConversation, { deps, sessionId, paneId, key: paneId }),
    resolveRowSession: row => resolveSessionIdFromRow(ctx, row),
  }

  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-panes: dictionaries')
  // The outer shell owns both sidebars. Pane stores never replace its factories.

  // The main-panel occupant. alpha.2 renders the center column through the
  // 'main' keyed slot; the reserved key 'conversation' hosts the official
  // ConversationPanel (which just delegates to 'main.conversation'). Shadow it
  // at priority -1 to make the pane workspace the default main panel; inside
  // each pane we still render the official ConversationRoot captured from
  // 'main.conversation'.
  ctx.slots.register({
    name: 'main',
    key: 'conversation',
    priority: TAKEOVER_PRIORITY,
    locale: NS,
    inject: (): PaneWorkspaceInjected => operations,
  } as never, PaneWorkspace as never)

  // BetterSidebar is the only optional third-party integration. Registration
  // follows service lifetime, including late loading/unloading of the sidebar.
  ctx.inject(['betterSidebar'] as never, sidebarCtx => {
    const sidebar = sidebarCtx.get('betterSidebar' as never) as unknown as {
      registerTab(descriptor: {
        id: string; title: string; single: boolean; order: number;
        component: () => ReturnType<typeof createElement>
      }): () => void
    }
    sidebarCtx.effect(() => sidebar.registerTab({
      id: 'independent-main-views', title: '主窗口', single: true, order: 15,
      component: () => createElement(ViewManager, { controller }),
    }), 'ui-panes: BetterSidebar main view controls')
  })
}

/** Wrapped conversation entries: inject provenance per (entry, pane). */
const wrappedEntries = new WeakMap<StoredEntry, Map<string, StoredEntry>>()

/**
 * Wrap one pane's copy of an entry so the stock `selectWorkspace` inject
 * reports the session it just created back to the pane that owns it.
 *
 * A pane's hero picker creates a session through the stock inject (workspace
 * connect + draft migration, all core logic) and selects it globally. Without
 * this provenance the pane that owns the hero would not adopt the new session
 * — the selection-change effect would bind whichever pane is focused.
 *
 * The wrapper is cached per (entry, pane): the renderer caches inject faces
 * and hooks by entry identity, so a fresh object per render would churn every
 * subscription in the pane.
 * @param entry - ledger entry.
 * @param paneId - owning pane.
 * @param hooks - client context + adoption callback.
 * @returns the wrapped entry (the original when it has no inject face).
 */
function wrapPaneEntry(
  entry: StoredEntry,
  paneId: string,
  hooks: { ctx: ClientContext; onSessionStarted: (paneId: string, sessionId: SessionId) => void },
): StoredEntry {
  const inject = entry.inject
  if (inject === undefined) return entry
  let perPane = wrappedEntries.get(entry)
  if (perPane === undefined) {
    perPane = new Map()
    wrappedEntries.set(entry, perPane)
  }
  let wrapped = perPane.get(paneId)
  if (wrapped !== undefined) return wrapped
  wrapped = {
    ...entry,
    inject: (...args: never[]) => {
      const face = (inject as (...params: never[]) => Record<string, unknown>)(...args)
      const selectWorkspace = face['selectWorkspace']
      if (typeof selectWorkspace !== 'function') return face
      return {
        ...face,
        selectWorkspace: async (workspaceId: unknown) => {
          const result = await (selectWorkspace as (id: unknown) => Promise<void>)(workspaceId)
          const created = hooks.ctx.sessions.list.getSnapshot().current
          if (created !== undefined) hooks.onSessionStarted(paneId, created)
          return result
        },
      }
    },
  }
  perPane.set(paneId, wrapped)
  return wrapped
}
