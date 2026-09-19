import { useSyncExternalStore } from 'react'
import { allLeaves } from './pane-layout-store.ts'
import type { createViewController } from './view-controller.ts'
import css from './ViewManager.module.css'

export function ViewManager({ controller }: { controller: ReturnType<typeof createViewController> }) {
  const state = useSyncExternalStore(controller.store.subscribe, controller.store.getSnapshot)
  const panes = allLeaves(state.root)
  return <div className={css.manager}>
    <div className={css.heading}><strong>主窗口</strong>
      <button type="button" className={css.button} aria-label="添加主窗口" title="添加主窗口"
        disabled={panes.length >= 2} onClick={() => controller.add()}>＋</button>
    </div>
    {panes.map((pane, index) => <div className={css.row} key={pane.id} data-active={pane.id === state.focusedPaneId || undefined}>
      <button type="button" className={css.select} aria-pressed={pane.id === state.focusedPaneId}
        onClick={() => controller.focus(pane.id)}>窗口 {index + 1}{pane.sessionId === null ? ' · 新会话' : ''}</button>
      <button type="button" className={css.button} aria-label={`关闭窗口 ${index + 1}`} title="关闭主窗口"
        disabled={panes.length === 1} onClick={() => controller.close(pane.id)}>×</button>
    </div>)}
  </div>
}
