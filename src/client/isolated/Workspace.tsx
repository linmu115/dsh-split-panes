import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { View, ViewModel } from './model.ts'
import type { Shell } from './shell.ts'
import { clipRegions, frameUrl, viewGeometry } from './protocol.ts'
import css from './workspace.module.css'

function Frame({ view, shell, left, width, total, height, sidebar, active }: {
  view: View; shell: Shell; left: number; width: number; total: number; height: number; sidebar: number; active: boolean
}) {
  const nodeRef = useRef<HTMLIFrameElement | null>(null)
  const [slow, setSlow] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const ref = useCallback((node: HTMLIFrameElement | null) => { nodeRef.current = node; shell.attach(view.id, node?.contentWindow ?? null) }, [shell, view.id])
  useEffect(() => { shell.geometry(view.id, { left, width, sidebar, active }) }, [shell, view.id, view.ready, left, width, sidebar, active])
  useEffect(() => {
    if (view.ready) return
    const timer = setTimeout(() => {
      setSlow(true)
    }, 20000)
    return () => clearTimeout(timer)
  }, [view.id, view.ready, attempt])
  return <>
    <iframe ref={ref} className={css.frame} title="独立会话窗口" data-main-view={view.id}
      src={frameUrl(window.location, view)}
      style={{ clipPath: clipRegions(left, width, height, total, active ? sidebar : 0), zIndex: active ? 2 : 1 }} />
    {!view.ready && <div className={css.loading} style={{ left, width }}>
      {slow ? <div>窗口未能完成加载。<button type="button" onClick={() => { setSlow(false); setAttempt(v => v + 1); nodeRef.current?.contentWindow?.location.reload() }}>重试</button></div> : '正在打开会话窗口…'}
    </div>}
    {view.error && <div className={css.error} role="alert" style={{ left, width }}>{view.error}</div>}
  </>
}

export function Workspace({ model, shell }: { model: ViewModel; shell: Shell }) {
  const state = useSyncExternalStore(model.subscribe, model.getSnapshot)
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [dragging, setDragging] = useState(false)
  const active = state.views.find(v => v.id === state.active)!
  const geometry = viewGeometry(size.width, active.sidebar, state.views.length, state.ratio)
  useEffect(() => {
    const node = ref.current!
    const observer = new ResizeObserver(() => { const rect = node.getBoundingClientRect(); setSize({ width: rect.width, height: rect.height }) })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  const split = state.views.length > 1
  const changeRatio = (clientX: number) => {
    const rect = ref.current?.getBoundingClientRect()
    if (rect && geometry.center > 5) model.ratio((clientX - rect.left) / (geometry.center - 5))
  }
  return <div className={css.workspace} ref={ref} data-dsh-isolated-workspace="">
    {state.views.map((view, index) => <Frame key={view.id} view={view} shell={shell}
      left={index === 0 ? 0 : geometry.secondLeft} width={index === 0 ? geometry.first : geometry.second}
      total={size.width} height={size.height} sidebar={geometry.sidebar} active={view.id === state.active} />)}
    {split && <>
      <div className={css.focus} style={{ left: state.views[0]!.id === state.active ? 0 : geometry.secondLeft,
        width: state.views[0]!.id === state.active ? geometry.first : geometry.second }} />
      <div role="separator" aria-label="调整主窗口宽度" aria-orientation="vertical" aria-valuenow={Math.round(state.ratio * 100)}
        aria-valuemin={20} aria-valuemax={80} tabIndex={0} className={css.divider} style={{ left: geometry.first }}
        onKeyDown={event => { if (['ArrowLeft', 'ArrowRight'].includes(event.key)) { event.preventDefault(); model.ratio(state.ratio + (event.key === 'ArrowLeft' ? -.05 : .05)) } }}
        onPointerDown={event => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); setDragging(true) }}
        onPointerMove={event => { if (dragging) changeRatio(event.clientX) }}
        onPointerUp={event => { if (dragging) changeRatio(event.clientX); setDragging(false); event.currentTarget.releasePointerCapture(event.pointerId) }}
        onPointerCancel={() => setDragging(false)} onLostPointerCapture={() => setDragging(false)} />
    </>}
    {dragging && <div className={css.dragShield} />}
    {/* Blank sessions cannot open BetterSidebar yet; provide a small escape control. */}
    {active.sessionId === null && <button className={css.blankControl} type="button"
      style={{ left: (state.views[0]!.id === active.id ? geometry.first : geometry.secondLeft + geometry.second) - 40 }}
      aria-label={split ? '关闭空白主窗口' : '添加主窗口'} title={split ? '关闭空白主窗口' : '添加主窗口'}
      onClick={() => split ? shell.close(active.id) : shell.add()}>{split ? '×' : '＋'}</button>}
  </div>
}
