import {afterEach,describe,expect,it,vi} from 'vitest'
import {bindSidebarChrome} from '../src/client/isolated/sidebar-chrome.ts'
import {createViewModel} from '../src/client/isolated/model.ts'
import {createShell} from '../src/client/isolated/shell.ts'
import {envelope,type SidebarChrome} from '../src/client/isolated/protocol.ts'

const chrome:SidebarChrome={panelOpen:true,bottomOpen:true,width:460,bottomHeight:280}
function fixture(){
 let state={...chrome,panelOpen:false,bottomOpen:false,width:300,bottomHeight:180},sessionId='a'
 const tabs={a:['sticker'],b:['files']};let notify=()=>{}
 const sidebar={registerTab:()=>()=>{},getSnapshot:()=>({sessionId,state,tabs:tabs[sessionId as 'a'|'b']}),subscribeState:(fn:()=>void)=>{notify=fn;return()=>{notify=()=>{}}}}
 document.body.innerHTML='<div data-dsh-toggle-cluster><button id="bottom"></button><button id="right"></button></div>'
 const set=(patch:Partial<typeof state>,session=sessionId)=>{state={...state,...patch};sessionId=session;notify()}
 const right=vi.fn(()=>set({panelOpen:!state.panelOpen})),bottom=vi.fn(()=>set({bottomOpen:!state.bottomOpen}))
 document.getElementById('right')!.onclick=right;document.getElementById('bottom')!.onclick=bottom
 const queue=new Map<number,FrameRequestCallback>();let id=0
 const schedule=(fn:FrameRequestCallback)=>{queue.set(++id,fn);return id}
 const flush=()=>{let count=0;while(queue.size){if(++count>12)throw Error('Reconciliation loop');const batch=[...queue];queue.clear();for(const [,fn]of batch)fn(0)}}
 const report=vi.fn(),binding=bindSidebarChrome(sidebar,report,document,schedule,n=>queue.delete(n))
 return{binding,report,right,bottom,set,flush,sidebar}
}
afterEach(()=>{document.body.innerHTML=''})
describe('shared BetterSidebar chrome',()=>{
 it('reconciles open state through original buttons without replacing content or echoing programmatic clicks',()=>{
  const f=fixture(),tabs=f.sidebar.getSnapshot().tabs
  f.binding.apply(chrome,1,true);f.flush()
  expect(f.right).toHaveBeenCalledTimes(1);expect(f.bottom).toHaveBeenCalledTimes(1)
  expect(f.sidebar.getSnapshot().state).toMatchObject({panelOpen:true,bottomOpen:true,width:300})
  expect(f.sidebar.getSnapshot().tabs).toBe(tabs);expect(f.report).not.toHaveBeenCalled()
  f.binding.dispose()
 })
 it('ignores inactive state and restores shared visibility when selecting a closed view',()=>{
  const f=fixture();f.binding.apply(chrome,1,true);f.flush();f.binding.apply(chrome,2,false);f.flush()
  f.set({panelOpen:false,bottomOpen:false});expect(f.report).not.toHaveBeenCalled()
  f.binding.apply(chrome,3,true);f.flush()
  expect(f.sidebar.getSnapshot().state.panelOpen).toBe(true);expect(f.report).not.toHaveBeenCalled();f.binding.dispose()
 })
 it('suppresses session layout visibility while preserving that session tabs',()=>{
  const f=fixture();f.binding.apply(chrome,1,true);f.flush()
  f.set({panelOpen:false,bottomOpen:false,width:600},'b');f.flush()
  expect(f.sidebar.getSnapshot().tabs).toEqual(['files'])
  expect(f.sidebar.getSnapshot().state).toMatchObject({panelOpen:true,bottomOpen:true})
  expect(f.report).not.toHaveBeenCalled();f.binding.dispose()
 })
 it('reports real plugin reveal actions, but never copies per-session geometry into the outer layout',()=>{
  const f=fixture();f.binding.apply({...chrome,panelOpen:false,bottomOpen:false},3,true);f.flush()
  f.set({width:700});expect(f.report).not.toHaveBeenCalled()
  f.set({panelOpen:true});expect(f.report).toHaveBeenCalledExactlyOnceWith({...chrome,bottomOpen:false},3,'a')
  f.binding.dispose()
 })
 it('keeps explicit global close across session changes and rejects older commands',()=>{
  const f=fixture();const closed={...chrome,panelOpen:false,bottomOpen:false}
  f.binding.apply(closed,4,true);f.flush();f.set({panelOpen:true,bottomOpen:true},'b');f.flush()
  f.binding.apply(chrome,3,true);f.flush()
  expect(f.sidebar.getSnapshot().state).toMatchObject({panelOpen:false,bottomOpen:false})
  expect(f.report).not.toHaveBeenCalled();f.binding.dispose()
 })
 it('waits for late native controls rather than accepting their closed state',async()=>{
  const f=fixture(),buttons=document.querySelector('[data-dsh-toggle-cluster]')!;buttons.remove()
  f.binding.apply(chrome,1,true);f.flush();expect(f.report).not.toHaveBeenCalled()
  document.body.append(buttons);await Promise.resolve();f.flush()
  expect(f.sidebar.getSnapshot().state.panelOpen).toBe(true);f.binding.dispose()
 })
 it('retains a user reveal between local focus and the parent selection acknowledgement',()=>{
  const f=fixture(),closed={...chrome,panelOpen:false,bottomOpen:false}
  f.binding.apply(closed,4,false);f.flush();f.binding.focus();f.set({panelOpen:true})
  expect(f.report).not.toHaveBeenCalled();f.binding.apply(closed,5,true);f.flush()
  expect(f.report).toHaveBeenCalledExactlyOnceWith({...closed,panelOpen:true},5,'a')
  expect(f.sidebar.getSnapshot().state.panelOpen).toBe(true);f.binding.dispose()
 })
 it('preserves global visibility and dimensions through focus, navigation, add and close',()=>{
  const model=createViewModel('a');model.chrome(chrome);const first=model.getSnapshot().active
  model.add();model.navigate('b');model.focus(first);model.close(first)
  expect(model.getSnapshot().chrome).toEqual(chrome)
  model.chrome({panelOpen:false});model.add();model.focus(model.getSnapshot().views[0]!.id)
  expect(model.getSnapshot().chrome.panelOpen).toBe(false)
 })
 it('rejects inactive, obsolete or wrong-session visibility reports',()=>{
  let current:string|undefined='a'
  const sessions={list:{getSnapshot:()=>({current}),subscribe:()=>()=>{}},open:(id:string)=>{current=id},clear:()=>{current=undefined},refresh:async()=>{}}
  const model=createViewModel('a'),shell=createShell(sessions,model),first=model.getSnapshot().views[0]!,left={postMessage:vi.fn()} as unknown as Window
  shell.attach(first.id,left);shell.add();model.navigate('b');const second=model.getSnapshot().views[1]!,right={postMessage:vi.fn()} as unknown as Window;shell.attach(second.id,right)
  const send=(view:typeof first,frame:Window,revision:number,sessionId:string)=>window.dispatchEvent(new MessageEvent('message',{origin:location.origin,source:frame,data:envelope(view,{type:'sidebar',value:chrome,revision,sessionId})}))
  const revision=model.getSnapshot().chromeRevision
  send(first,left,revision,'a');send(second,right,revision-1,'b');send(second,right,revision,'a')
  expect(model.getSnapshot().chrome.panelOpen).toBe(false)
  send(second,right,revision,'b');expect(model.getSnapshot().chrome).toEqual(chrome);shell.dispose()
 })
})
