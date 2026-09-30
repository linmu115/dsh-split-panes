import {createShell} from '../src/client/isolated/shell.ts'
import {createViewModel} from '../src/client/isolated/model.ts'
import {describe,expect,it,vi} from 'vitest'
import {adaptSessions,waitForCatalogSession} from '../src/client/isolated/navigation.ts'
import {bindSidebarChrome} from '../src/client/isolated/sidebar-chrome.ts'
import type {ClientContext} from '../src/client/isolated/contracts.ts'
import {installLayout} from '../src/client/isolated/layout.ts'

describe('DSH 0.2 native navigation and sidebar',()=>{
 it('derives selection from mainView retention and uses public workspace navigation',()=>{
  const openSession=vi.fn(),startSession=vi.fn(),refresh=vi.fn(async()=>{})
  const catalog={list:{getSnapshot:()=>({phase:'ready',byId:{one:{retainedBy:{sideView:1}},two:{retainedBy:{mainView:1}}}}),subscribe:()=>()=>{}},refresh}
  const ctx={get:(name:string)=>name==='sessions'?catalog:{openSession,startSession}} as unknown as ClientContext
  const service=adaptSessions(ctx)
  expect(service.list.getSnapshot().current).toBe('two')
  service.open('one');expect(openSession).toHaveBeenCalledWith('one')
  service.clear();expect(startSession).not.toHaveBeenCalled()
 })
 it('restores right and bottom visibility through their distinct native owners',()=>{
  document.body.innerHTML='<button data-dsh-bottom-toggle></button>'
  let expanded=false,bottom=false
  const sidebar={registerTab:()=>()=>{},getSnapshot:()=>({sessionId:'one',state:{bottomOpen:bottom,bottomHeight:280}}),subscribeState:()=>()=>{}}
  document.querySelector<HTMLButtonElement>('button')!.onclick=()=>{bottom=!bottom}
  const native={mounted:{getSnapshot:()=> 'one',subscribe:()=>()=>{}},isExpanded:()=>expanded,toggleExpanded:vi.fn(()=>{expanded=!expanded})}
  const queue=new Map<number,FrameRequestCallback>();let n=0
  const report=vi.fn(),binding=bindSidebarChrome(sidebar,report,document,fn=>{queue.set(++n,fn);return n},id=>queue.delete(id),native)
  binding.apply({panelOpen:true,bottomOpen:true,width:460,bottomHeight:280},1,true)
  for(let i=0;queue.size && i<5;i++){const batch=[...queue.values()];queue.clear();batch.forEach(fn=>fn(0))}
  expect(expanded).toBe(true);expect(bottom).toBe(true);expect(report).not.toHaveBeenCalled()
  binding.dispose();document.body.innerHTML=''
 })
 it('does not hide the native rightbar in child view and restores owned DOM markers',()=>{
  const dispose=installLayout('child')
  const css=document.querySelector('style[data-plugin="dsh-independent-main-views-layout"]')!.textContent!
  expect(css).toContain('[data-rightbar-col] { position:fixed')
  expect(css).not.toContain('body[data-mv-mode="child"] [data-rightbar-col],')
  dispose();expect(document.body.dataset.mvMode).toBeUndefined()
 })
})


it('waits for reconnect publication when refresh resolves with the catalog still pending',async()=>{
 let phase='pending'
 const listeners=new Set<()=>void>(),refresh=vi.fn(async()=>{})
 const sessions={list:{getSnapshot:()=>({phase,byId:phase==='ready'?{target:{}}:{}}),subscribe:(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn)}}},refresh,open:vi.fn(),clear:()=>{}}
 let completed=false
 const task=waitForCatalogSession(sessions,'target',new AbortController().signal).then(()=>{completed=true})
 await Promise.resolve();await Promise.resolve()
 expect(refresh).toHaveBeenCalledOnce();expect(completed).toBe(false)
 phase='ready';for(const fn of listeners)fn();await task
 expect(listeners.size).toBe(0)
})
it('bounds missing target waits and releases cancelled navigation observers',async()=>{
 const listeners=new Set<()=>void>()
 const sessions={list:{getSnapshot:()=>({phase:'ready',byId:{}}),subscribe:(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn)}}},refresh:async()=>{},open:vi.fn(),clear:()=>{}}
 const controller=new AbortController(),task=waitForCatalogSession(sessions,'gone',controller.signal)
 controller.abort(new Error('superseded'))
 await expect(task).rejects.toThrow('superseded');expect(listeners.size).toBe(0)
 await expect(waitForCatalogSession(sessions,'gone',new AbortController().signal,10)).rejects.toThrow('catalog')
 expect(listeners.size).toBe(0)
})

/** Match official retainScope publication + UiWorkspace.replaceMain retain/release order. */
function nativeSelectionFixture() {
 let rows: Record<string,{retainedBy: Record<string,number>}>={a:{retainedBy:{mainView:1}},b:{retainedBy:{}}}
 let selected='a'
 const listeners=new Set<()=>void>()
 const emit=()=>{for(const fn of listeners)fn()}
 const retain=(id:string,source:string,delta:number)=>{
  rows={...rows,[id]:{retainedBy:{...rows[id]!.retainedBy,[source]:(rows[id]!.retainedBy[source]??0)+delta}}};emit()
 }
 const openSession=(id:string)=>{retain(id,'mainView',1);const old=selected;selected=id;retain(old,'mainView',-1)}
 const catalog={list:{getSnapshot:()=>({phase:'ready',byId:rows}),subscribe:(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn)}}},refresh:async()=>{}}
 const sessions=adaptSessions({get:(name:string)=>name==='sessions'?catalog:{openSession}} as unknown as ClientContext)
 const model=createViewModel('a'),shell=createShell(sessions,model)
 return {model,shell,openSession,emit,retain,listeners,current:()=>selected}
}
it('fills the active empty view on an official same-A reopen without changing window one',()=>{
 const f=nativeSelectionFixture();f.shell.add()
 const blank=f.model.getSnapshot().views[1]!
 expect(f.model.getSnapshot().active).toBe(blank.id)
 expect(blank.sessionId).toBeNull()
 f.openSession('a')
 expect(f.model.getSnapshot().views.map(v=>v.sessionId)).toEqual(['a','a'])
 expect(f.model.getSnapshot().views[1]!.revision).toBe(1)
 f.openSession('a') // Once assigned, a repeated retain must not restart the child.
 expect(f.model.getSnapshot().views[1]!.revision).toBe(1)
 f.shell.dispose()
})
it('leaves active blank manager empty for catalog refresh and non-mainView retains',()=>{
 const f=nativeSelectionFixture();f.shell.add()
 const blankId=f.model.getSnapshot().active
 f.emit();f.retain('a','sideView',1);f.retain('a','sideView',-1)
 expect(f.model.getSnapshot().active).toBe(blankId)
 expect(f.model.getSnapshot().views.map(v=>v.sessionId)).toEqual(['a',null])
 expect(f.model.getSnapshot().views[1]!.revision).toBe(0)
 f.shell.dispose();expect(f.listeners.size).toBe(0)
 f.openSession('a');expect(f.model.getSnapshot().views[1]!.sessionId).toBeNull()
})
it('different B selection preserves A and close maps the survivor back to the host',()=>{
 const f=nativeSelectionFixture();f.shell.add();f.openSession('b')
 expect(f.model.getSnapshot().views.map(v=>v.sessionId)).toEqual(['a','b'])
 f.shell.close(f.model.getSnapshot().active)
 expect(f.model.getSnapshot().views.map(v=>v.sessionId)).toEqual(['a'])
 expect(f.current()).toBe('a')
 f.shell.dispose()
})
it('focus mirroring to A never consumes an inactive blank view; closing blank preserves A',()=>{
 const f=nativeSelectionFixture();const first=f.model.getSnapshot().active
 f.shell.add();const blank=f.model.getSnapshot().active
 f.shell.focus(first);f.openSession('a')
 expect(f.model.getSnapshot().views.map(v=>v.sessionId)).toEqual(['a',null])
 f.shell.focus(blank);expect(f.model.getSnapshot().views[1]!.sessionId).toBeNull()
 f.shell.close(blank)
 expect(f.model.getSnapshot().active).toBe(first)
 expect(f.current()).toBe('a')
 f.shell.dispose()
})
