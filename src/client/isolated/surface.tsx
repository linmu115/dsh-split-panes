import { useLayoutEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import type { ClientContext } from './contracts.ts'
import type { ViewModel } from './model.ts'
import type { Shell } from './shell.ts'
import { Workspace } from './Workspace.tsx'

/** Retain frame documents even while the shell temporarily shows another panel. */
export function installSurface(ctx: ClientContext, model: ViewModel, shell: Shell) {
  const surface = document.createElement('div')
  surface.dataset.dshMainViewSurface = ''
  Object.assign(surface.style, { position: 'fixed', display: 'none', zIndex: '2' })
  document.body.append(surface)
  const root = createRoot(surface)
  root.render(<Workspace model={model} shell={shell} />)
  ctx.effect(() => () => { root.unmount(); surface.remove() }, 'independent-views: persistent frame documents')
  function Anchor() {
    const ref = useRef<HTMLDivElement>(null)
    useLayoutEffect(() => {
      const node = ref.current!
      let frame = 0
      const measure = () => {
        frame = 0
        const rect = node.getBoundingClientRect()
        Object.assign(surface.style, { display: 'block', left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` })
      }
      const schedule = () => { if (!frame) frame = requestAnimationFrame(measure) }
      const observer = new ResizeObserver(schedule)
      observer.observe(node)
      window.addEventListener('resize', schedule)
      window.addEventListener('scroll', schedule, true)
      measure()
      return () => {
        observer.disconnect(); cancelAnimationFrame(frame)
        window.removeEventListener('resize', schedule); window.removeEventListener('scroll', schedule, true)
        surface.style.display = 'none'
      }
    }, [])
    return <div ref={ref} style={{ flex: 1, minWidth: 0, minHeight: 0, height: '100%' }} data-dsh-main-view-anchor="" />
  }
  ctx.slots.register({ name: 'main', key: 'conversation', priority: -1 }, Anchor)
}
