/** Observe focus within this view, including same-origin embedded app documents.
 * Event listeners only: no embedded plugin code or business services are changed.
 */
export function observeViewFocus(doc: Document, focus: () => void): () => void {
  const frames = new Map<HTMLIFrameElement, () => void>()
  doc.addEventListener('pointerdown', focus, true)
  doc.addEventListener('focusin', focus, true)
  const scan = () => {
    for (const [frame, dispose] of frames) if (!doc.contains(frame)) { dispose(); frames.delete(frame) }
    for (const frame of doc.querySelectorAll('iframe')) {
      if (frames.has(frame)) continue
      let child: Document | null = null, cleanup: (() => void) | undefined
      const attach = () => {
        let next: Document | null = null
        try { next = frame.contentDocument } catch { /* Cross-origin embeds are inaccessible. */ }
        if (next === child) return
        cleanup?.(); child = next
        cleanup = next ? observeViewFocus(next, focus) : undefined
      }
      frame.addEventListener('load', attach)
      frames.set(frame, () => { frame.removeEventListener('load', attach); cleanup?.() })
      attach()
    }
  }
  const observer = new MutationObserver(scan)
  observer.observe(doc, { subtree: true, childList: true })
  scan()
  return () => {
    observer.disconnect()
    doc.removeEventListener('pointerdown', focus, true)
    doc.removeEventListener('focusin', focus, true)
    for (const dispose of frames.values()) dispose()
    frames.clear()
  }
}
