// @vitest-environment jsdom
/** Panes-plugin registration: occupies the conversation slot permanently
    (the single-pane state is the tree with one leaf), registers the header
    split/close buttons over the ONE shared pane tree, owns the global
    shortcuts, and back-fills the side-bar drag payload. */
import { describe, expect, it, vi } from 'vitest'
import { fireEvent } from '@testing-library/react'
import { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client'
import {
  SlotTestRuntime, stubSettingsScope, usePinnedBrowserLanguages,
} from '@deepseek-ai/dsh-client-test-runtime'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import {
  apply as applyConversation, inject as conversationInject,
} from '@deepseek-ai/dsh-client-ui-conversation/client'
import { apply, inject } from '../src/client/native-prototype.ts'
import { SESSION_DRAG_TYPE } from '../src/client/session-row.ts'

usePinnedBrowserLanguages('zh-CN')

async function bench() {
  const runtime = await SlotTestRuntime.create()
  const locale = new LocaleRuntime(runtime.ctx)
  runtime.ctx.provide('locale', locale)
  runtime.slots.installLocale(locale)
  runtime.ctx.provide('settingsScope', { bind: () => stubSettingsScope().scope } as never)
  runtime.ctx.provide('uiWorkspace', {
    openSession: async () => {},
    openWorkspace: async (_workspaceId: unknown, beforeOpen: (id: SessionId) => void) => { beforeOpen('s1' as SessionId) },
  } as never)
  await runtime.sessions.add({
    id: 's1' as SessionId,
    summary: { title: 'Fix the build', displayTitle: 'Fix the build', cwd: '/dev' },
  }, { current: false })
  await runtime.sessions.add({
    id: 's2' as SessionId,
    summary: { title: 'Second', displayTitle: 'Second', cwd: '/dev' },
  }, { current: false })
  // alpha.2: the center column is the keyed 'main' slot; the conversation root
  // 'main.conversation' is declared by ui-conversation itself.
  await runtime.root.declare({
    'main': { kind: 'keyed', scope: 'root' },
  }, (_props: { renderSlot?: unknown }) => null)
  await runtime.mount({ inject: conversationInject, apply: applyConversation })
  await runtime.flush()
  return runtime
}


describe('main-view registration', () => {
  it('keeps one main occupant without installing header actions or keyboard shortcuts', async () => {
    const runtime = await bench()
    try {
      await runtime.mount({ inject: [...inject], apply })
      await runtime.flush()
      const entry = runtime.slots.entries('main').find(e => e.options.priority === -1)!
      expect(entry).toBeDefined()
      const ops = entry.inject!() as unknown as { hasSplit(): boolean }
      fireEvent.keyDown(window, { key: 'ArrowRight', ctrlKey: true, shiftKey: true })
      expect(ops.hasSplit()).toBe(false)
      expect(runtime.slots.entries('conversation.session.header.actions' as never)
        .filter(e => e.options.id?.startsWith('panes-'))).toHaveLength(0)
    } finally { await runtime.dispose() }
  })
  it('registers its controls when BetterSidebar arrives late and disposes registration', async () => {
    const runtime = await bench()
    const remove = vi.fn()
    const registerTab = vi.fn((_descriptor: unknown) => remove)
    await runtime.mount({ inject: [...inject], apply })
    await runtime.flush()
    expect(registerTab).not.toHaveBeenCalled()
    runtime.ctx.provide('betterSidebar' as never, { registerTab } as never)
    await runtime.flush()
    expect(registerTab).toHaveBeenCalledOnce()
    expect(registerTab.mock.calls[0]![0]).toMatchObject({ id: 'independent-main-views', title: '主窗口', single: true })
    await runtime.dispose()
    expect(remove).toHaveBeenCalledOnce()
  })
})
