import {describe,expect,it,vi} from 'vitest'
import {adaptSessions} from '../src/client/isolated/navigation.ts'
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
