/** CSS/DOM presentation owned by this plugin. No factory or service is replaced. */
export function installLayout(mode: 'shell' | 'child'): () => void {
  const body = document.body
  body.dataset.mvMode = mode
  const tag = document.createElement('style')
  tag.dataset.plugin = 'dsh-independent-main-views-layout'
  tag.textContent = `
    body[data-mv-mode="child"]:not([data-mv-ready]) #root,
    body[data-mv-mode="child"]:not([data-mv-ready]) [data-dsh-panel-host] { visibility:hidden!important }
    [data-mv-frame] { padding-right:0!important; transition:none!important }
    body[data-mv-mode="shell"] [data-mv-frame] { grid-template-columns:var(--mv-outer-sidebar,240px) minmax(0,1fr) 0px!important }
    body[data-mv-mode="shell"] [data-dsh-panel-host],
    body[data-mv-mode="shell"] [data-rightbar-col],
    body[data-mv-mode="shell"] [data-side="rightbar"] { display:none!important }
    body[data-mv-mode="shell"] [data-mv-center] { margin-bottom:0!important }
    body[data-mv-mode="child"] [data-mv-left],
    body[data-mv-mode="child"] [data-side="sidebar"],
    body[data-mv-mode="child"] [data-side="rightbar"] { display:none!important }
    body[data-mv-mode="child"] [data-mv-frame] { display:block!important }
    body[data-mv-mode="child"] [data-mv-center] {
      position:fixed!important; top:0!important; bottom:var(--mv-bottom,0px)!important;
      left:var(--mv-left,0px)!important; width:var(--mv-width,100%)!important;
      margin:0!important; min-height:0!important; overflow:hidden!important;
    }
    body[data-mv-mode="child"] [data-rightbar-col] { position:fixed!important;right:0!important;top:0!important;bottom:0!important;width:var(--mv-sidebar,0px)!important;z-index:110!important;overflow:hidden!important }
    body[data-mv-mode="child"][data-mv-inactive] [data-rightbar-col] { visibility:hidden!important;pointer-events:none!important }
    body[data-mv-mode="child"] [data-dsh-bottom-toggle] { display:none!important }
    [data-mv-blank-prompt] {display:none}
    body[data-mv-blank] [data-mv-center] {visibility:hidden!important}
    body[data-mv-blank] [data-mv-blank-prompt] {position:fixed;left:var(--mv-left,0px);width:var(--mv-width,100%);top:40%;display:grid;justify-content:center}
    body[data-mv-mode="child"] [data-dsh-panel]:not([data-dsh-bottom-panel]) { width:var(--mv-sidebar,0px)!important; max-width:var(--mv-sidebar,0px)!important; bottom:0!important; }
    body[data-mv-mode="child"] [data-dsh-bottom-panel] { left:0!important; width:calc(100% - var(--mv-sidebar,0px))!important; height:var(--mv-bottom,0px)!important; max-height:var(--mv-bottom,0px)!important; }
    body[data-mv-mode="child"] [data-dsh-toggle-cluster] { display:none!important }
    body[data-mv-mode="child"] [data-dsh-panel-host] { z-index:110!important }
    body[data-mv-mode="child"] [data-mv-external-layer] { left:var(--mv-left,0px)!important; right:auto!important; width:var(--mv-width,100%)!important; box-sizing:border-box!important }
    body[data-mv-mode="child"] [data-mv-dialog-layer] { left:var(--mv-left,0px)!important; right:auto!important; width:var(--mv-width,100%)!important; box-sizing:border-box!important }
    body[data-mv-mode="child"] [data-mv-dialog-layer] [role="dialog"] { max-width:calc(100% - 24px)!important; box-sizing:border-box!important }
    body[data-mv-mode="child"][data-mv-inactive] [data-dsh-panel-host] { visibility:hidden!important; pointer-events:none!important }
    body[data-mv-mode="child"] [data-slot="conversation.session.header.corner"] { display:none!important }
  `
  document.head.append(tag)
  const marked = new Set<HTMLElement>()
  const mark = (node: HTMLElement | null, name: string) => {
    if (!node) return
    if (!node.hasAttribute(name)) node.setAttribute(name, '')
    marked.add(node)
  }
  const column = (slot: Element | null) => {
    let node = slot?.parentElement ?? null
    while (node && getComputedStyle(node).display === 'contents') node = node.parentElement
    return node
  }
  const syncPortals = () => {
    if (mode !== 'child') return
    for (const dialog of document.querySelectorAll<HTMLElement>('[role="dialog"]')) {
      // Fit viewport-sized modal backdrops to this view, without inspecting plugin names.
      for (let layer: HTMLElement | null = dialog; layer && layer !== body; layer = layer.parentElement) {
        const style = getComputedStyle(layer), box = layer.getBoundingClientRect()
        if (style.position === 'fixed' && (layer.hasAttribute('data-mv-dialog-layer')
          || (box.width >= innerWidth * .9 && box.height >= innerHeight * .9))) {
          mark(layer, 'data-mv-dialog-layer'); break
        }
      }
    }
    const externalView = [...document.querySelectorAll<HTMLIFrameElement>('iframe')].some(frame => {
      for (let layer = frame.parentElement; layer && layer !== body; layer = layer.parentElement) {
        if (layer.hasAttribute('data-dsh-panel-host')) return false
        const style = getComputedStyle(layer), box = layer.getBoundingClientRect()
        if (style.position === 'fixed' && Number(style.zIndex) >= 100 && box.height > innerHeight * .7
          && style.visibility !== 'hidden' && style.display !== 'none') { mark(layer, 'data-mv-external-layer'); return true }
      }
      return false
    })
    body.toggleAttribute('data-mv-external-view', externalView)
  }
  const sync = () => {
    const main = column(document.querySelector('#root [data-slot="main"]'))
    const frame = main?.parentElement ?? null
    syncPortals()
    mark(main, 'data-mv-center'); mark(frame, 'data-mv-frame')
    mark(column(document.querySelector('#root [data-slot="sidebar"]')), 'data-mv-left')
    if (frame && mode === 'shell') {
      const first = frame.style.gridTemplateColumns.match(/^([\d.]+px)/)?.[1]
      if (first && body.style.getPropertyValue('--mv-outer-sidebar') !== first) body.style.setProperty('--mv-outer-sidebar', first)
    }
  }
  let scheduled = 0
  const observer = new MutationObserver(() => {
    if (!scheduled) scheduled = requestAnimationFrame(() => { scheduled = 0; sync() })
  })
  observer.observe(body, { subtree: true, childList: true, attributes: true, attributeFilter: ['style', 'class'] })
  sync()
  return () => {
    observer.disconnect(); cancelAnimationFrame(scheduled); tag.remove()
    for (const node of marked) for (const name of ['data-mv-center', 'data-mv-frame', 'data-mv-left', 'data-mv-dialog-layer', 'data-mv-external-layer']) node.removeAttribute(name)
    delete body.dataset.mvBlank; delete body.dataset.mvSidebarOpen; delete body.dataset.mvExternalView; delete body.dataset.mvMode; delete body.dataset.mvReady; delete body.dataset.mvInactive
    for (const name of ['--mv-outer-sidebar', '--mv-left', '--mv-width', '--mv-sidebar', '--mv-bottom', '--mv-toggle-right']) body.style.removeProperty(name)
  }
}
