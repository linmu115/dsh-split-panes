// Synthetic browser acceptance for the built plugin. Never connects to a user instance.
import { createServer } from 'node:http'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { createRequire } from 'node:module'
import { chromium } from '@playwright/test'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const reactRoot = dirname(require.resolve('react/package.json'))
const domRoot = dirname(require.resolve('react-dom/package.json'))
const annotationRoot = process.env.DSH_ANNOTATION_SOURCE
if (!annotationRoot) throw new Error('Set DSH_ANNOTATION_SOURCE to read the existing reference implementation')
const original = readFileSync(resolve(annotationRoot, 'src/client/service.tsx'), 'utf8')
const parsed = ts.createSourceFile('reference.tsx', original, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
const cls = parsed.statements.find(s => ts.isClassDeclaration(s) && s.name?.text === 'AnnotationCoreClientService')
const methods = cls.members.filter(m => ['openDshSource', 'resolveDshAnchor'].includes(m.name?.getText(parsed))).map(m => m.getText(parsed)).join('\n')
if (!methods.includes('document.querySelector')) throw new Error('Reference fixture extraction failed')
const referenceCode = ts.transpileModule(`class ReferenceService { ${methods} }`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText
const stickerRoot = process.env.DSH_STICKER_SOURCE
const thoughtRoot = process.env.DSH_THOUGHTDAG_SOURCE
if (!stickerRoot || !thoughtRoot) throw new Error('Set sticker and ThoughtDAG readonly source paths')
const stickerOriginal = readFileSync(resolve(stickerRoot, 'src/client/sticker-sidebar.tsx'), 'utf8')
const stickerParsed = ts.createSourceFile('sticker.tsx', stickerOriginal, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
const stickerFunction = stickerParsed.statements.find(s => ts.isFunctionDeclaration(s) && s.name?.text === 'openStickerInSidebar')
const stickerCode = ts.transpileModule(stickerFunction.getText(stickerParsed).replace('export ', ''), {compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
html,body,#root{height:100%;margin:0;font:14px system-ui;--dsw-alias-bg-base:#fff;--dsw-alias-label-primary:#111;--dsw-alias-label-secondary:#777;--dsw-alias-border-l2:#ddd}
*{box-sizing:border-box}button{cursor:pointer}main{display:flex;min-width:0;min-height:0;flex-direction:column}textarea{display:block;width:90%;height:70px;margin:12px}
[data-slot]{display:contents}.native{display:flex;flex-direction:column;min-height:0;flex:1}.chat{overflow:auto;flex:1;min-height:0}.chat p{margin:20px}
[data-dsh-panel-host]{position:fixed;inset:0;pointer-events:none;z-index:25}[data-dsh-panel]{position:absolute;right:0;top:0;height:100%;background:#f4f4f4;width:320px;pointer-events:auto;border-left:1px solid #ccc}
[data-dsh-toggle-cluster]{position:absolute;right:10px;top:8px;pointer-events:auto;z-index:30}
</style></head><body><div id="root"></div><script src="/react.js"></script><script src="/react-dom.js"></script><script>
window.__ModuleLoader__={load({id,factory}){window[id==='dsh-thoughtdag'?'thoughtPlugin':'panesPlugin']=factory(name=>{
if(name==='react')return React;if(name==='react-dom/client')return ReactDOM;if(name==='react/jsx-runtime')return{Fragment:React.Fragment,jsx:(type,props,key)=>React.createElement(type,{...props,key}),jsxs:(type,props,key)=>React.createElement(type,{...props,key})};throw Error(name)})}}
</script><script src="/client.js"></script><script src="/thoughtdag-client.js"></script><script>
${referenceCode}
const STICKER_DETAIL_TAB_TYPE='dsh-session-sticker-board:detail', STICKER_DETAIL_TAB_ID=STICKER_DETAIL_TAB_TYPE;
${stickerCode}
function referenceRange(){return null}
const h=React.createElement;let current='a',state={panelOpen:false,bottomOpen:false,width:320,bottomHeight:240},editor='',editorSession='',main=null,headerSwitch=null,globalPanel=false;
const drafts={a:'',b:''},listeners=new Set(),sideListeners=new Set(),tabs=new Map(),disposers=[];
const notify=()=>{for(const f of listeners)f();render()};const sideNotify=()=>{for(const f of sideListeners)f();render()};
const sessions={list:{getSnapshot:()=>({current,phase:'ready',byId:{a:{displayTitle:'A'},b:{displayTitle:'B'}}}),subscribe:f=>{listeners.add(f);return()=>listeners.delete(f)}},open:id=>{current=id;state={...state,panelOpen:false,bottomOpen:false};sideNotify();notify()},clear:()=>{current=undefined;state={...state,panelOpen:false,bottomOpen:false};sideNotify();notify()},refresh:async()=>{}};
const sidebar={registerTab:t=>{tabs.set(t.id,t);return()=>tabs.delete(t.id)},getSnapshot:()=>({state,sessionId:current}),features:["updateTab","tabMeta"],isTabEnabled:()=>true,
listTabInstances:()=>[],openTabResult:async(seed,scope)=>({seed,scope}),updateTabInstance:()=>true,activateTabInstance:handle=>{sidebar.openTab(handle.seed,handle.scope);return true},subscribeState:f=>{sideListeners.add(f);return()=>sideListeners.delete(f)},openTab:seed=>{editor=seed.type;editorSession=current;state={...state,panelOpen:true};sideNotify()}};
const services={sessions,betterSidebar:sidebar,uiConversation:{binding:()=>({target:()=>({getSnapshot:()=>({order:['source-anchor'],nodes:new Map([['source-anchor',{}]])})})})}};
const ctx={sessions,get:n=>services[n],effect:f=>{disposers.push(f())},inject:(names,f)=>{if(names.some(n=>n!=='betterSidebar'))return;const d=f(ctx);if(d)disposers.push(d)},slots:{inject:(_name,f)=>f(),register:(options,component)=>{if(options.name==='conversation.session.header.actions'){headerSwitch=component;return()=>{headerSwitch=null}}main=component;return()=>{main=null}}}};
const reference=Object.assign(Object.create(ReferenceService.prototype),{ctx,lifetime:new AbortController()});
window.fixture={toggleGlobal:()=>{globalPanel=!globalPanel;render()},sessions,sidebar,drafts,get current(){return current},get editorSession(){return editorSession},jump:()=>reference.openDshSource({sourceType:'dsh-message',selectedText:'source text',locator:{sessionId:'a',anchorId:'source-anchor',occurrence:0}})};
const root=ReactDOM.createRoot(document.getElementById('root'));
function Native(){return h('div',{className:'native'},h('header',{style:{height:90,flexShrink:0,paddingTop:55}},headerSwitch?h(headerSwitch):null,h('b',{'data-session-title':''},current?current.toUpperCase():'空白会话'),h('button',{onClick:()=>{sessions.open('a')}},'选择 A'),h('button',{onClick:()=>{sessions.open('b')}},'选择 B'),h('button',{onClick:()=>window.fixture.jump()},'跳转 A 原文'),h('button',{onClick:async()=>{window.fixture.stickerOpened=await openStickerInSidebar(sidebar,{sessionId:current,stickerId:'note-'+current})}},'普通贴纸')),
h('div',{className:'chat'},h('div',{style:{height:1000}},'conversation '+current),h('p',{'data-chat-anchor-key':'source-anchor'},'source text'),h('div',{style:{height:700}},'tail')),
h('textarea',{'aria-label':'会话输入',value:drafts[current]||'',onChange:e=>{drafts[current]=e.target.value;render()}}))}
function Sidebar(){return ReactDOM.createPortal(h('div',{'data-dsh-panel-host':''},h('div',{'data-dsh-toggle-cluster':''},h('button',{onClick:()=>{state={...state,bottomOpen:!state.bottomOpen};sideNotify()}},'底栏'),h('button',{onClick:()=>{state={...state,panelOpen:!state.panelOpen};sideNotify()}},'侧栏')),
h('div',{'data-dsh-panel':'',style:{display:state.panelOpen?'block':'none'}},h('button',{onClick:()=>sidebar.openTab({type:'independent-main-views'})},'主窗口管理'),
editor===STICKER_DETAIL_TAB_TYPE?h('section',{'aria-label':'贴纸编辑页'},h('h3',null,'贴纸 '+editorSession),h('textarea',{'aria-label':'贴纸注释',defaultValue:'note '+editorSession})):editor==='independent-main-views'?h(tabs.get(editor).component):h('p',null,'侧栏内容'))),document.body)}
function render(){root.render(h(React.Fragment,null,h('div',{'data-slot':'root'},h('div',{style:{display:'grid',gridTemplateColumns:'200px minmax(0,1fr) 0px',height:'100%',overflow:'hidden'}},h('aside',null,h('div',{'data-slot':'sidebar'},h('button',{onClick:()=>sessions.open('a')},'会话 A'),h('button',{onClick:()=>sessions.open('b')},'会话 B'))),h('main',null,h('div',{'data-slot':'main'},globalPanel?h('p',null,'全局页面'):main?h(main):h('div',{'data-slot':'main.conversation'},h(Native)))),h('div',{'data-rightbar-col':''}))),h(Sidebar)))}
window.panesPlugin.apply(ctx);window.thoughtPlugin.apply(ctx);render();
</script></body></html>`

const server = createServer((req, res) => {
  const path = new URL(req.url, 'http://fixture').pathname
  if(path==='/thoughtdag/api/version'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({version:'fixture'}));return}
  if(path==='/thoughtdag/'){res.end(`<body style="padding:100px 20px"><button>画布操作</button><p id="session"></p><script>addEventListener('message',e=>{if(e.data.type==='td:current-session')document.getElementById('session').textContent=e.data.session?.id||''});parent.postMessage({source:'dsh-thoughtdag',type:'td:request-current'},location.origin)</script>`);return}
  const files = { '/thoughtdag-client.js': resolve(thoughtRoot,'dsh/lib/client.js'), '/react.js': resolve(reactRoot, 'umd/react.development.js'), '/react-dom.js': resolve(domRoot, 'umd/react-dom.development.js'), '/client.js': resolve('lib/client.js') }
  res.setHeader('Content-Type', files[path] ? 'text/javascript' : 'text/html; charset=utf-8')
  res.end(files[path] ? readFileSync(files[path]) : html)
})
await new Promise(done => server.listen(0, '127.0.0.1', done))
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1600, height: 960 } })
const errors = [], checks = []
page.on('pageerror', error => errors.push(error.message))
const check = (name, condition) => { if (!condition) throw new Error('FAILED: '+name); checks.push(name) }
try {
  await page.goto(`http://127.0.0.1:${server.address().port}/`)
  const frames = () => page.frames().filter(f => new URL(f.url()).searchParams.has('dshMainView'))
  await page.waitForFunction(() => document.querySelector('iframe[data-main-view]')?.contentDocument?.body.hasAttribute('data-mv-ready'))
  const first = frames()[0]
  await first.getByRole('textbox', { name: '会话输入' }).fill('draft left')
  await page.getByRole('button', { name: '展开右侧栏', exact: true }).click()
  await first.getByRole('button', { name: '主窗口管理' }).click()
  await first.getByRole('button', { name: '添加主窗口' }).click()
  await page.waitForFunction(() => document.querySelectorAll('iframe[data-main-view]').length===2 && [...document.querySelectorAll('iframe[data-main-view]')].every(f=>f.contentDocument?.body.hasAttribute('data-mv-ready')))
  const second = frames().find(f => f !== first)
  check('second starts blank', await second.evaluate(() => window.fixture.current===undefined))
  check('shared sidebar stays open on blank view',await page.getByRole('button',{name:'收起右侧栏',exact:true}).isVisible()&&await page.getByRole('complementary',{name:'空白会话侧栏'}).isVisible())
  check('only one outer pair of controls',await page.locator('[data-main-view-sidebar-controls] button').count()===2 && !(await second.locator('[data-dsh-toggle-cluster]').isVisible()))
  await page.getByRole('button', { name: '会话 B', exact: true }).click()
  await second.waitForFunction(()=>window.fixture.current==='b')
  await second.getByRole('textbox', { name: '会话输入' }).fill('draft right')
  check('left draft retained', await first.getByRole('textbox', { name: '会话输入' }).inputValue()==='draft left')
  check('separate current sessions', await first.evaluate(()=>window.fixture.current)==='a' && await second.evaluate(()=>window.fixture.current)==='b')
  await second.getByRole('button', { name: '普通贴纸' }).click()
  await second.getByRole('region', { name: '贴纸编辑页' }).waitFor({state:'visible'})
  check('real sticker caller opens B editor', await second.evaluate(()=>window.fixture.stickerOpened===true && window.fixture.editorSession==='b'))
  check('right sidebar is at far right', (await second.getByRole('region',{name:'贴纸编辑页'}).boundingBox()).x > 1100)
  await first.getByRole('textbox',{name:'会话输入'}).click()
  check('focus preserves shared expanded state',await page.getByRole('button',{name:'收起右侧栏',exact:true}).isVisible())
  await first.getByRole('button', { name: '普通贴纸' }).click()
  await first.getByRole('region', { name: '贴纸编辑页' }).waitFor({state:'visible'})
  check('left sticker owns A', await first.evaluate(()=>window.fixture.editorSession)==='a')
  check('left active sidebar also at far right', (await first.getByRole('region',{name:'贴纸编辑页'}).boundingBox()).x > 1100)
  check('inactive sidebar hidden', await second.getByRole('region',{name:'贴纸编辑页'}).isVisible()===false)
  await page.getByRole('button',{name:'收起右侧栏',exact:true}).click()
  await second.getByRole('textbox',{name:'会话输入'}).click()
  await page.waitForTimeout(100)
  check('explicit close survives view switch',await page.getByRole('button',{name:'展开右侧栏',exact:true}).isVisible() && !(await second.getByRole('region',{name:'贴纸编辑页'}).isVisible()))
  await first.getByRole('button',{name:'普通贴纸',exact:true}).click()
  await page.getByRole('button',{name:'收起右侧栏',exact:true}).waitFor()
  check('clicking a sticker in inactive view reveals shared sidebar',await first.getByRole('region',{name:'贴纸编辑页'}).isVisible())
  await second.getByRole('textbox',{name:'会话输入'}).click()
  await second.getByRole('region',{name:'贴纸编辑页'}).waitFor({state:'visible'})
  check('view keeps its own editor content',await second.evaluate(()=>window.fixture.editorSession==='b'))
  await page.getByRole('button',{name:'展开底部栏',exact:true}).click();await first.getByRole('textbox',{name:'会话输入'}).click();await page.waitForTimeout(100)
  check('bottom visibility shared across views',await page.getByRole('button',{name:'收起底部栏',exact:true}).isVisible()&&await first.evaluate(()=>window.fixture.sidebar.getSnapshot().state.bottomOpen))
  await page.getByRole('button',{name:'收起底部栏',exact:true}).click()
  const widthHandle=page.getByRole('separator',{name:'调整右侧栏宽度'}),oldWidth=Number(await widthHandle.getAttribute('aria-valuenow'))
  await widthHandle.press('ArrowLeft');await second.getByRole('textbox',{name:'会话输入'}).click()
  check('shared width survives focus',Number(await widthHandle.getAttribute('aria-valuenow'))===oldWidth+20)
  await second.getByRole('button', { name: '跳转 A 原文' }).click()
  await second.waitForFunction(()=>document.querySelector('.chat').scrollTop>100)
  check('source jump scrolls its own document', await first.evaluate(()=>document.querySelector('.chat').scrollTop)===0)
  check('source session opens only in right runtime', await second.evaluate(()=>window.fixture.current)==='a')
  await first.getByRole('button',{name:'思维图',exact:true}).click()
  await first.locator('.dsh-td-overlay.is-open').waitFor()
  check('map mode independent from right dialogue', await second.locator('.dsh-td-overlay.is-open').count()===0)
  await second.getByRole('button',{name:'普通贴纸'}).click()
  const mapFrame=first.frameLocator('iframe[title="ThoughtDAG"]')
  await mapFrame.getByRole('button',{name:'画布操作'}).click()
  await page.getByRole('button',{name:'会话 B',exact:true}).click()
  await first.waitForFunction(()=>window.fixture.current==='b')
  check('nested canvas focus routes shared list to its own view', await second.evaluate(()=>window.fixture.current)==='a')
  await first.locator('.dsh-td-canvas-switch').getByRole('button',{name:'对话',exact:true}).click()
  await page.getByRole('button',{name:'会话 A',exact:true}).click()
  await page.evaluate(()=>window.fixture.toggleGlobal())
  await page.waitForTimeout(60)
  await page.evaluate(()=>window.fixture.toggleGlobal())
  await first.getByRole('textbox',{name:'会话输入'}).waitFor()
  check('outer global panel remount preserves child runtime', await first.getByRole('textbox',{name:'会话输入'}).inputValue()==='draft left')
  const divider=page.getByRole('separator',{name:'调整主窗口宽度'}), before=await divider.boundingBox()
  await divider.focus(); await page.keyboard.press('ArrowLeft')
  await page.waitForTimeout(80)
  check('divider changes ratio', (await divider.boundingBox()).x < before.x)
  const moved=await divider.boundingBox()
  await page.mouse.move(moved.x+2,moved.y+100); await page.mouse.down(); await page.mouse.move(moved.x+60,moved.y+100,{steps:8}); await page.mouse.up()
  check('pointer divider drag works across iframe boundary', (await divider.boundingBox()).x>moved.x+20)
  await second.getByRole('button',{name:'普通贴纸'}).click()
  mkdirSync('.dev/shots',{recursive:true})
  await page.screenshot({path:'.dev/shots/isolated-two-views.png'})
  await second.getByRole('button',{name:'主窗口管理'}).click()
  await second.getByRole('button',{name:'关闭窗口 2'}).click()
  await page.waitForFunction(()=>document.querySelectorAll('iframe[data-main-view]').length===1)
  check('closing view preserves other draft', await first.getByRole('textbox',{name:'会话输入'}).inputValue()==='draft left')
  check('no browser exceptions', errors.length===0)
  mkdirSync('.dev/shots',{recursive:true})
  await page.screenshot({path:'.dev/shots/isolated-fixture.png'})
  writeFileSync('.dev/isolated-browser-result.json',JSON.stringify({checks,errors,scope:'Synthetic browser fixture; reference jump methods extracted unchanged; sticker open function and ThoughtDAG mode shim loaded unchanged; DSH services, editor body and map canvas are contract fixtures.'},null,2))
  console.log(JSON.stringify({checks,errors}))
} catch(error) {
  mkdirSync('.dev/shots',{recursive:true})
  await page.screenshot({path:'.dev/shots/isolated-failure.png'})
  console.error(error.message)
  console.error(JSON.stringify({checks,errors,frames:page.frames().map(f=>f.url().split('?')[0])}))
  process.exitCode=1
} finally { await browser.close(); await new Promise(done=>server.close(done)) }
