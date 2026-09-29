import { createElement, useState } from 'react'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { installOnboardingOwner, mirrorRootInert } from '../src/client/isolated/onboarding.tsx'
import type { ClientContext } from '../src/client/isolated/contracts.ts'
afterEach(cleanup)
function fixture(byId: Record<string, unknown> = {}) {
  const entries: { options: any; component: any }[] = [], disposers: (()=>void)[]=[]
  const ctx={get:()=>({list:{getSnapshot:()=>({phase:'ready',byId}),subscribe:()=>()=>{}}}),effect:(fn:()=>()=>void)=>disposers.push(fn()),
    slots:{inject:(_name:string,fn:()=>void)=>fn(),register:(options:any,component:any)=>{entries.push({options,component});return()=>{}}}} as unknown as ClientContext
  return {ctx,entries,dispose:()=>disposers.forEach(fn=>fn())}
}
it('defers iframe readiness until the official ordered steps explicitly finish',()=>{
  const h=fixture(), gate=installOnboardingOwner(h.ctx,false)
  const acknowledge=vi.fn(), later=vi.fn()
  const steps=[
    {options:{order:-100},component:({complete}:any)=><button onClick={()=>{acknowledge();complete()}}>Continue notice</button>},
    {options:{order:0},component:({complete}:any)=><button onClick={()=>{later();complete()}}>Configure later</button>},
    ...h.entries,
  ].sort((a,b)=>a.options.order-b.options.order)
  function Coordinator(){const[index,setIndex]=useState(0);return index<steps.length?createElement(steps[index]!.component,{complete:()=>setIndex(index+1)}):null}
  const view=render(<Coordinator />)
  expect(gate.getSnapshot()).toBe(false)
  fireEvent.click(view.getByText('Continue notice'));expect(gate.getSnapshot()).toBe(false)
  expect(later).not.toHaveBeenCalled()
  fireEvent.click(view.getByText('Configure later'));expect(gate.getSnapshot()).toBe(true)
  expect(acknowledge).toHaveBeenCalledOnce();expect(later).toHaveBeenCalledOnce();h.dispose()
})
it('delegates automatic child steps without acknowledging them and preserves explicit reopen',()=>{
  const h=fixture(),gate=installOnboardingOwner(h.ctx,true),complete=vi.fn()
  expect(h.entries[0]!.options.order).toBeLessThan(-100)
  const view=render(createElement(h.entries[0]!.component,{complete}))
  expect(view.container.childElementCount).toBe(0) // No fake click or complete of an official step.
  expect(complete).not.toHaveBeenCalled();expect(gate.getSnapshot()).toBe(false)
  // Explicit coordinator requests choose their id, not the first ordered step.
  view.rerender(<button onClick={complete}>Explicit account settings</button>)
  fireEvent.click(view.getByText('Explicit account settings'));expect(complete).toHaveBeenCalledOnce();h.dispose()
})
it('allows an existing nonblank main Session without suppressing a blank-session notice',()=>{
  const existing=fixture({s:{retainedBy:{mainView:1},blank:false}})
  expect(installOnboardingOwner(existing.ctx,false).getSnapshot()).toBe(true);existing.dispose()
  const blank=fixture({s:{retainedBy:{mainView:1},blank:true}})
  expect(installOnboardingOwner(blank.ctx,false).getSnapshot()).toBe(false);blank.dispose()
})
it('mirrors official root inert to the detached surface and restores it after modal close',async()=>{
  const root=document.createElement('div');root.id='root'
  const surface=document.createElement('div');document.body.append(root,surface)
  const dispose=mirrorRootInert(surface)
  root.setAttribute('inert','');await new Promise(resolve=>setTimeout(resolve,0))
  expect(surface.hasAttribute('inert')).toBe(true);expect(surface.style.visibility).toBe('hidden')
  root.removeAttribute('inert');await new Promise(resolve=>setTimeout(resolve,0))
  expect(surface.hasAttribute('inert')).toBe(false);expect(surface.style.visibility).toBe('')
  dispose();root.remove();surface.remove()
})
