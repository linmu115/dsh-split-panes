import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { View, ViewModel } from './model.ts'
import type { Shell } from './shell.ts'
import { clipRegions, frameUrl, viewGeometry } from './protocol.ts'
import css from './workspace.module.css'

function Frame({ view, shell, left, width, total, height, sidebar, bottom, active }: {
  view: View; shell: Shell; left: number; width: number; total: number; height: number; sidebar: number; bottom: number; active: boolean
}) {
  const nodeRef = useRef<HTMLIFrameElement | null>(null)
  const [slow, setSlow] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const ref = useCallback((node: HTMLIFrameElement | null) => { nodeRef.current = node; shell.attach(view.id, node?.contentWindow ?? null) }, [shell, view.id])
  useEffect(() => { shell.geometry(view.id, { left, width, sidebar, bottom, active }) }, [shell, view.id, view.ready, left, width, sidebar, bottom, active])
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
      style={{ clipPath: clipRegions(left, width, height, total, active ? sidebar : 0, active ? bottom : 0), zIndex: active ? 2 : 1 }} />
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
  const [chromeDrag,setChromeDrag] = useState<'right'|'bottom'|null>(null)
  const active = state.views.find(v => v.id === state.active)!
  const geometry = viewGeometry(size.width, state.chrome.panelOpen ? state.chrome.width : 0, state.views.length, state.ratio)
  const bottom = state.chrome.bottomOpen ? Math.min(state.chrome.bottomHeight,size.height*.55) : 0
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
  return <div className={css.workspace} data-dsh-isolated-workspace="">
    <div className={css.chromeToolbar} data-main-view-sidebar-controls="">
      <button type="button" aria-label={state.chrome.bottomOpen?'收起底部栏':'展开底部栏'} aria-pressed={state.chrome.bottomOpen}
        title={state.chrome.bottomOpen?'收起底部栏':'展开底部栏'} onClick={()=>shell.toggleSidebar('bottom')}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><rect x="2.25" y="2.25" width="13.5" height="13.5" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M3 11.5h12" stroke="currentColor" strokeWidth="1.4"/></svg>
      </button>
      <button type="button" aria-label={state.chrome.panelOpen?'收起右侧栏':'展开右侧栏'} aria-pressed={state.chrome.panelOpen}
        title={state.chrome.panelOpen?'收起右侧栏':'展开右侧栏'} onClick={()=>shell.toggleSidebar('right')}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><rect x="2.25" y="2.25" width="13.5" height="13.5" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M11.5 3v12" stroke="currentColor" strokeWidth="1.4"/></svg>
      </button>
    </div>
    <div className={css.canvas} ref={ref}>
    {state.views.map((view, index) => <Frame key={view.id} view={view} shell={shell}
      left={index === 0 ? 0 : geometry.secondLeft} width={index === 0 ? geometry.first : geometry.second}
      total={size.width} height={size.height} sidebar={geometry.sidebar} bottom={bottom} active={view.id === state.active} />)}
    {split && <>
      <div className={css.focus} style={{ left: state.views[0]!.id === state.active ? 0 : geometry.secondLeft,
        width: state.views[0]!.id === state.active ? geometry.first : geometry.second, bottom }} />
      <div role="separator" aria-label="调整主窗口宽度" aria-orientation="vertical" aria-valuenow={Math.round(state.ratio * 100)}
        aria-valuemin={20} aria-valuemax={80} tabIndex={0} className={css.divider} style={{ left: geometry.first, bottom }}
        onKeyDown={event => { if (['ArrowLeft', 'ArrowRight'].includes(event.key)) { event.preventDefault(); model.ratio(state.ratio + (event.key === 'ArrowLeft' ? -.05 : .05)) } }}
        onPointerDown={event => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); setDragging(true) }}
        onPointerMove={event => { if (dragging) changeRatio(event.clientX) }}
        onPointerUp={event => { if (dragging) changeRatio(event.clientX); setDragging(false); event.currentTarget.releasePointerCapture(event.pointerId) }}
        onPointerCancel={() => setDragging(false)} onLostPointerCapture={() => setDragging(false)} />
    </>}
    {geometry.sidebar>0 && <div role="separator" aria-label="调整右侧栏宽度" aria-orientation="vertical" tabIndex={0}
      aria-valuenow={Math.round(geometry.sidebar)} className={css.sidebarResize} style={{right:geometry.sidebar-3}}
      onKeyDown={e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();model.chrome({width:Math.max(240,geometry.sidebar+(e.key==='ArrowLeft'?20:-20))})}}}
      onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);setChromeDrag('right')}}
      onPointerMove={e=>{if(chromeDrag==='right'){const r=ref.current!.getBoundingClientRect();model.chrome({width:Math.max(240,Math.min(r.width*.45,r.right-e.clientX))})}}}
      onPointerUp={e=>{setChromeDrag(null);e.currentTarget.releasePointerCapture(e.pointerId)}} onPointerCancel={()=>setChromeDrag(null)} onLostPointerCapture={()=>setChromeDrag(null)} />}
    {bottom>0 && <div role="separator" aria-label="调整底部栏高度" aria-orientation="horizontal" tabIndex={0}
      aria-valuenow={Math.round(bottom)} className={css.bottomResize} style={{bottom:bottom-3,right:geometry.sidebar}}
      onKeyDown={e=>{if(['ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();model.chrome({bottomHeight:Math.max(120,bottom+(e.key==='ArrowUp'?20:-20))})}}}
      onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);setChromeDrag('bottom')}}
      onPointerMove={e=>{if(chromeDrag==='bottom'){const r=ref.current!.getBoundingClientRect();model.chrome({bottomHeight:Math.max(120,Math.min(r.height*.55,r.bottom-e.clientY))})}}}
      onPointerUp={e=>{setChromeDrag(null);e.currentTarget.releasePointerCapture(e.pointerId)}} onPointerCancel={()=>setChromeDrag(null)} onLostPointerCapture={()=>setChromeDrag(null)} />}
    {(dragging||chromeDrag) && <div className={css.dragShield} style={{cursor:chromeDrag==='bottom'?'row-resize':'col-resize'}} />}
    {active.sessionId===null && geometry.sidebar>0 && <aside className={css.emptySidebar} style={{width:geometry.sidebar}} aria-label="空白会话侧栏">
      <p className={css.emptyHint}>选择会话后显示侧栏内容</p>
      <div className={css.controls}><div className={css.controlRow}><strong>主窗口</strong>
        <button className={css.circle} type="button" aria-label="添加主窗口" disabled={split} onClick={()=>shell.add()}>＋</button></div>
        {state.views.map((view,i)=><div key={view.id} className={css.controlRow}>
          <button className={css.viewChoice} aria-pressed={view.id===state.active} onClick={()=>shell.focus(view.id)}>窗口 {i+1}{view.sessionId===null?' · 新会话':''}</button>
          <button className={css.circle} aria-label={`关闭窗口 ${i+1}`} disabled={!split} onClick={()=>shell.close(view.id)}>×</button>
        </div>)}
      </div>
    </aside>}
    {active.sessionId===null && bottom>0 && <aside className={css.emptyBottom} style={{height:bottom,right:geometry.sidebar}} aria-label="空白会话底部栏"><p className={css.emptyHint}>选择会话后显示底部栏内容</p></aside>}
    {/* Blank views retain a compact management shortcut when the shared sidebar is closed. */}
    {active.sessionId === null && !state.chrome.panelOpen && <button className={css.blankControl} type="button"
      style={{ left: (state.views[0]!.id === active.id ? geometry.first : geometry.secondLeft + geometry.second) - 40 }}
      aria-label={split ? '关闭空白主窗口' : '添加主窗口'} title={split ? '关闭空白主窗口' : '添加主窗口'}
      onClick={() => split ? shell.close(active.id) : shell.add()}>{split ? '×' : '＋'}</button>}
    </div>
  </div>
}
