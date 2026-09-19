import { createServer } from 'node:http';
import { chromium } from '@playwright/test';
import {apply} from '../lib/index.js';
import {writeFileSync} from 'node:fs';
let injection='',upgrade,cleanup;apply({webServer:{registerUpgrade:r=>{upgrade=r;return()=>{}}},on:(_name,fn)=>{const rows=[];fn(rows);injection=rows[0].text;return()=>{}},effect:fn=>{cleanup=fn()}});const TRANSPORT_PATH=upgrade.path;
const transport={handler:upgrade.handler,dispose:()=>cleanup()};let serial=0, active=0;const retryHeaders=[];
const server=createServer((req,res)=>{
 const url=new URL(req.url,'http://test');
 if(url.pathname==='/events'){
  if(!req.headers.cookie?.includes('view-test=allowed')){res.writeHead(401);res.end();return}
  active++;const id=++serial;req.on('close',()=>active--);res.writeHead(200,{'content-type':'text/event-stream'});
  res.write('\uFEFF: heartbeat\r\nevent: ready\r\nid: '+id+'\r\ndata: '+id+'\r');
  setTimeout(()=>res.write('\n\r\n'),5);return;
 }
 if(url.pathname==='/retry'){
  const last=req.headers['last-event-id']||'';retryHeaders.push(last);res.writeHead(200,{'content-type':'text/event-stream'});
  res.write('retry: 25\nid: resume-1\ndata: first\n\n');if(!last)setTimeout(()=>res.end(),10);return;
 }
 if(url.pathname==='/ordinary'){res.end('ordinary request completed');return}
 res.setHeader('content-type','text/html');res.end(`<head><script>${injection}</script></head><body><script>window.streams=[];window.events=[];for(let i=0;i<3;i++){const s=new EventSource('/events?s='+i);s.addEventListener('ready',e=>events.push({data:e.data,id:e.lastEventId}));streams.push(s)}</script></body>`);
});server.on('upgrade',(req,socket,head)=>{if(new URL(req.url,'http://test').pathname===TRANSPORT_PATH)transport.handler(req,socket,head);else socket.destroy()});await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true});const context=await browser.newContext();await context.addCookies([{name:'view-test',value:'allowed',url:origin,httpOnly:true}]);const page=await context.newPage();const checks=[];const check=(name,test)=>{if(!test)throw Error(name);checks.push(name)};
try{
 await page.goto(origin);await page.waitForFunction(()=>events.length===3);
 await page.evaluate(()=>{for(let i=0;i<2;i++){const f=document.createElement('iframe');f.src='/?dshMainView=v'+i+'&dshViewChannel=n'+i;document.body.append(f)}});
 await page.waitForFunction(()=>[...document.querySelectorAll('iframe')].length===2&&[...document.querySelectorAll('iframe')].every(f=>f.contentWindow.events?.length===3));
 check('nine independent event streams complete without starving HTTP',active===9);
 check('ordinary request remains available',await page.evaluate(async()=>await(await fetch('/ordinary')).text())==='ordinary request completed');
 const ids=await page.evaluate(()=>[...events,...[...document.querySelectorAll('iframe')].flatMap(f=>f.contentWindow.events)].map(e=>e.id));check('streams retain distinct upstream identities',new Set(ids).size===9);
 const unauth = await browser.newContext(); const deniedPage=await unauth.newPage(); await deniedPage.goto(origin); await deniedPage.evaluate(()=>{const f=document.createElement('iframe');f.src='/?dshMainView=denied&dshViewChannel=test';document.body.append(f)}); await deniedPage.waitForFunction(()=>document.querySelector('iframe')?.contentWindow.streams?.every(s=>s.readyState===2)); check('original endpoint rejects missing authentication',active===9); await unauth.close();
 const child=page.frames()[1];await child.evaluate(()=>{window.retryStream=new EventSource('/retry')});await page.waitForTimeout(120);check('reconnect preserves Last-Event-ID',retryHeaders[0]===''&&retryHeaders[1]==='resume-1');
 await child.evaluate(()=>{retryStream.close();streams.forEach(s=>s.close())});await page.waitForTimeout(50);check('close releases only this view upstream streams',active===6);
 await page.evaluate(()=>document.querySelectorAll('iframe').forEach(f=>f.remove()));await page.waitForTimeout(100);check('removing views releases remaining child streams',active===3);
 writeFileSync('.dev/transport-browser-result.json',JSON.stringify({checks,active,connections:serial,scope:'Built plugin host bootstrap and transport in local synthetic HTTP server; Chromium browser; no user instance mutation.'},null,2));console.log(JSON.stringify({checks,active,connections:serial}));
}finally{await context.close();await browser.close();transport.dispose();await new Promise(r=>server.close(r))}
