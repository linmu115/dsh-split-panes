import { afterEach, expect, it, vi } from 'vitest'
import { installChild } from '../src/client/isolated/child.tsx'
import { envelope } from '../src/client/isolated/protocol.ts'
import type { ClientContext } from '../src/client/isolated/contracts.ts'
const cleanups: (()=>void)[]=[]
afterEach(()=>{cleanups.splice(0).reverse().forEach(fn=>fn());document.body.innerHTML='';vi.restoreAllMocks()})
function fixture() {
 const post=vi.spyOn(window.parent,'postMessage').mockImplementation(()=>{})
 let owner:string|undefined
 let phase='pending'
 const catalog={list:{getSnapshot:()=>({phase,byId:{target:{retainedBy:{mainView:owner==='target'?1:0}},other:{retainedBy:{mainView:owner==='other'?1:0}}}}),subscribe:()=>()=>{}},refresh:vi.fn(async()=>{phase='ready'})}
 const openSession=vi.fn((id:string)=>{owner=id})
 const ctx={get:(key:string)=>key==='sessions'?catalog:{openSession},effect:(fn:()=>()=>void)=>cleanups.push(fn()),inject:()=>{}} as unknown as ClientContext
 const identity={id:'test',nonce:'test-nonce'}
 installChild(ctx,identity)
 const navigate=async(revision:number,sessionId:string)=>{window.dispatchEvent(new MessageEvent('message',{origin:window.location.origin,source:window.parent,data:envelope(identity,{type:'navigate',revision,sessionId})}));await Promise.resolve();await Promise.resolve()}
 return {catalog,openSession,navigate,notices:()=>post.mock.calls.map(call=>(call[0] as any).body)}
}
it('acknowledges a successful cold-list navigation only after opening the selected owner',async()=>{
 const f=fixture();await f.navigate(0,'target')
 expect(f.catalog.refresh).toHaveBeenCalledOnce();expect(f.openSession).toHaveBeenCalledWith('target')
 expect(f.notices()).toContainEqual({type:'navigated',revision:0})
 expect(f.notices()).toContainEqual({type:'selection',revision:0,sessionId:'target'})
 expect(document.body.hasAttribute('data-mv-ready')).toBe(true)
})
it('does not report an old cold-list failure after a newer navigation succeeds',async()=>{
 const f=fixture();let reject!:(reason:unknown)=>void
 f.catalog.refresh.mockImplementationOnce(()=>new Promise<void>((_,fail)=>{reject=fail}))
 await f.navigate(0,'target');await f.navigate(1,'other');reject(new Error('old refresh failed'));await Promise.resolve();await Promise.resolve()
 expect(f.notices()).toContainEqual({type:'navigated',revision:1})
 expect(f.notices().filter(n=>n.type==='error')).toEqual([])
})
it('reports the failing stage and revision, then acknowledges a successful explicit retry',async()=>{
 const f=fixture();vi.spyOn(console,'warn').mockImplementation(()=>{})
 f.openSession.mockImplementationOnce(()=>{throw new Error('unavailable')})
 await f.navigate(0,'target')
 expect(f.notices()).toContainEqual(expect.objectContaining({type:'error',stage:'open',revision:0}))
 await f.navigate(1,'target')
 expect(f.notices()).toContainEqual({type:'navigated',revision:1})
})
