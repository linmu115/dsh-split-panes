// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { useSyncExternalStore } from 'react'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import { PaneWorkspace, type PaneWorkspaceProps } from '../src/client/PaneWorkspace.tsx'
import { ViewManager } from '../src/client/ViewManager.tsx'
import { createViewController } from '../src/client/view-controller.ts'
import { allLeaves } from '../src/client/pane-layout-store.ts'

afterEach(cleanup)
function mount() {
  let current = 'a' as SessionId | undefined
  const listeners = new Set<() => void>()
  const set = (id: SessionId | undefined) => { current = id; for (const fn of listeners) fn() }
  const sessions = {
    list: { getSnapshot: () => ({ current }), subscribe: (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn) } } },
    open: (id: SessionId) => set(id), clear: () => set(undefined),
  }
  const controller = createViewController(sessions)
  const actions = controller.store.actions
  const resolve = vi.fn(() => 'a' as SessionId)
  const props = {
    usePaneStore: (sel: (state: ReturnType<typeof controller.store.getSnapshot>) => unknown) => sel(useSyncExternalStore(controller.store.subscribe, controller.store.getSnapshot)),
    paneActions: actions, focusPane: controller.focus, openSession: controller.select,
    renderPane: (id: string | undefined, key: string) => <button data-testid={key} data-session={id ?? 'blank'} onPointerDown={event => event.stopPropagation()}>native content</button>,
    resolveRowSession: resolve, t: () => '调整窗口宽度',
  } as unknown as PaneWorkspaceProps
  const view = render(<><PaneWorkspace {...props}/><ViewManager controller={controller}/></>)
  return { ...view, controller, sessions, leaves: () => allLeaves(controller.store.getSnapshot().root) }
}
describe('main workspace interactions', () => {
  it('adds a blank view only through the sidebar controls and disables a third view', () => {
    const b = mount()
    expect(b.container.querySelectorAll('[data-main-view-id]')).toHaveLength(1)
    fireEvent.click(b.getByRole('button', { name: '添加主窗口' }))
    expect(b.leaves().map(p => p.sessionId)).toEqual(['a', null])
    expect(b.getByRole('button', { name: '添加主窗口' }).hasAttribute('disabled')).toBe(true)
    expect(b.container.querySelectorAll('[data-main-view-id][data-focused]')).toHaveLength(1)
  })
  it('activates the pane before descendant pointer handlers and before keyboard interactions', () => {
    const b = mount()
    fireEvent.click(b.getByRole('button', { name: '添加主窗口' }))
    const first = b.leaves()[0]!.id
    fireEvent.pointerDown(b.getByTestId(first))
    expect(b.sessions.list.getSnapshot().current).toBe('a')
    const second = b.leaves()[1]!.id
    fireEvent.focusIn(b.getByTestId(second))
    expect(b.sessions.list.getSnapshot().current).toBeUndefined()
    act(() => b.sessions.open('b' as SessionId))
    expect(b.leaves().map(p => p.sessionId)).toEqual(['a', 'b'])
  })
  it('keeps the surviving session when the sidebar closes the selected view', () => {
    const b = mount()
    fireEvent.click(b.getByRole('button', { name: '添加主窗口' }))
    act(() => b.sessions.open('b' as SessionId))
    fireEvent.click(b.getByRole('button', { name: '关闭窗口 2' }))
    expect(b.container.querySelector('[data-session="a"]')).not.toBeNull()
    expect(b.container.querySelector('[data-session="b"]')).toBeNull()
  })
  it('resizes with the divider keyboard without changing the sessions', () => {
    const b = mount()
    fireEvent.click(b.getByRole('button', { name: '添加主窗口' }))
    fireEvent.keyDown(b.getByRole('separator'), { key: 'ArrowRight' })
    expect(b.controller.store.getSnapshot().root).toMatchObject({ ratio: .55 })
    expect(b.leaves().map(p => p.sessionId)).toEqual(['a', null])
  })
})
