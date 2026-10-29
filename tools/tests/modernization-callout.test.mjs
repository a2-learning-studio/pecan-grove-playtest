import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {showCallout,prefersFindCards} from '../../assets/games/community-builders/engine/callout.js';

function setup({voice=false}={}) {
  const dom=new JSDOM('<div id="game"><main><button class="cb-s01-spot">A sign</button></main></div>',{pretendToBeVisual:true});
  const w=dom.window,root=w.document.querySelector('#game'),main=root.querySelector('main'),anchor=main.querySelector('button');
  let time=0,next=0;const tasks=new Map(),cleanups=[],frames=new Map();
  w.requestAnimationFrame=fn=>{const id=++next;frames.set(id,fn);return id;};w.cancelAnimationFrame=id=>frames.delete(id);
  function frame(){const pending=[...frames];frames.clear();pending.forEach(([,fn])=>fn(time));}
  const clock={Date:{now:()=>time},setTimeout(fn,ms){const id=++next;tasks.set(id,{fn,at:time+ms});return id;},clearTimeout(id){tasks.delete(id);},cleanup(fn){cleanups.push(fn);}};
  function advance(ms){const end=time+ms;while(true){let entry=[...tasks].sort((a,b)=>a[1].at-b[1].at)[0];if(!entry||entry[1].at>end)break;time=entry[1].at;tasks.delete(entry[0]);entry[1].fn();}time=end;}
  const ctx={window:w,document:w.document,root,main,activeLifecycle:clock,CFG:{findCards:false},W:{close:'Close'},vOn:voice,gamePaused:false,vAudio:null,vEl:null,vLoad:()=>Promise.resolve(),vScan(){ctx.vAudio={};ctx.vEl=root.querySelector('.cb-callout p');},vStop(){ctx.vAudio=null;ctx.vEl=null;},h(tag,attrs={},kids=[]){const n=w.document.createElement(tag);for(const[k,v]of Object.entries(attrs))k==='text'?n.textContent=v:n.setAttribute(k,v);for(const c of kids)if(c)n.append(c);return n;},btn(label,cls,run){const b=w.document.createElement('button');b.textContent=label;b.className=cls;b.addEventListener('click',run);return b;}};
  return{dom,w,ctx,anchor,advance,tasks,frames,frame,cleanups,close:()=>w.close()};
}

test('findings are polite and nonmodal, retain the chosen target, and never close on a timer (WCAG 2.2.1)',()=>{
 const r=setup();try{const p=showCallout(r.ctx,r.anchor,r.ctx.h('p',{text:'The sign tells us a meeting date.'}),{title:'A meeting sign'});assert.equal(p.getAttribute('role'),'status');assert.equal(r.w.document.activeElement,r.anchor);assert.equal(r.ctx.root.querySelector('dialog'),null);assert.equal(r.tasks.size,0,'no dismissal clock');r.advance(600000);assert.equal(p.isConnected,true,'a quiet reader keeps the finding as long as needed');}finally{r.close();}
});
test('a finding stays open after its narration ends',async()=>{
 const r=setup({voice:true});try{const p=showCallout(r.ctx,r.anchor,r.ctx.h('p',{text:'A sign.'}));await Promise.resolve();r.advance(20000);assert.equal(p.isConnected,true);r.ctx.vAudio=null;r.ctx.vEl=null;r.advance(600000);assert.equal(p.isConnected,true);p.dismiss();assert.equal(p.isConnected,false);}finally{r.close();}
});
test('Escape and stop cleanup dismiss once and remove all timers',()=>{
 const r=setup();try{let closed=0;const p=showCallout(r.ctx,r.anchor,r.ctx.h('p',{text:'A sign.'}),{onClose:()=>closed++});r.anchor.dispatchEvent(new r.w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));r.cleanups.forEach(fn=>fn());assert.equal(closed,1);assert.equal(p.isConnected,false);assert.equal(r.tasks.size,0);assert.equal(r.w.document.activeElement,r.anchor);}finally{r.close();}
});
test('classic-card preference follows the setting and conservative forced-colors preference',()=>{
 const r=setup();try{r.w.matchMedia=()=>({matches:false});assert.equal(prefersFindCards(r.ctx),false);r.ctx.CFG.findCards=true;assert.equal(prefersFindCards(r.ctx),true);r.ctx.CFG.findCards=false;r.w.matchMedia=()=>({matches:true});assert.equal(prefersFindCards(r.ctx),true);}finally{r.close();}
});

test('scroll and resize bursts update callout geometry once on the next frame without synchronous scroll positioning',()=>{
 const r=setup();try{let reads=0,left=20;r.anchor.getBoundingClientRect=()=>{reads++;return{left,top:30,right:left+44,bottom:74,width:44,height:44};};
  const panel=showCallout(r.ctx,r.anchor,r.ctx.h('p',{text:'A sign.'}));const initial=reads,previousLeft=panel.style.left;left=80;
  for(let i=0;i<10;i++)r.anchor.dispatchEvent(new r.w.Event('scroll',{bubbles:true}));r.w.dispatchEvent(new r.w.Event('resize'));
  assert.equal(reads,initial,'The scroll event must not synchronously inspect layout.');assert.equal(panel.style.left,previousLeft);assert.equal(r.frames.size,1);
  r.frame();assert.equal(reads,initial+1);assert.equal(panel.style.left,'80px');assert.equal(r.frames.size,0);
 }finally{r.close();}
});
test('dismissing a callout cancels its pending position frame and detaches scroll scheduling',()=>{
 const r=setup();try{const panel=showCallout(r.ctx,r.anchor,r.ctx.h('p',{text:'A sign.'}));r.anchor.dispatchEvent(new r.w.Event('scroll',{bubbles:true}));assert.equal(r.frames.size,1);
  panel.dismiss();assert.equal(r.frames.size,0);r.anchor.dispatchEvent(new r.w.Event('scroll',{bubbles:true}));assert.equal(r.frames.size,0);r.frame();assert.equal(panel.isConnected,false);
 }finally{r.close();}
});

function rect(left,top,width,height){return{left,top,right:left+width,bottom:top+height,width,height};}
function panelSize(r,width=350,height=205){
 const native=r.w.HTMLElement.prototype.getBoundingClientRect;
 r.w.HTMLElement.prototype.getBoundingClientRect=function(){return this.classList.contains('cb-callout')?rect(0,0,width,height):native.call(this);};
}
function panelBox(panel){return rect(Number.parseFloat(panel.style.left),Number.parseFloat(panel.style.top),350,205);}
function overlaps(a,b){return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;}

for(const label of ['I am done looking','Ya terminé de mirar'])test(`a final finding leaves the ${label} action reachable`,()=>{
 const r=setup();try{
  Object.defineProperties(r.w,{innerWidth:{value:1280},innerHeight:{value:720}});panelSize(r);
  r.anchor.classList.add('is-not');r.anchor.getBoundingClientRect=()=>rect(918,450,44,44);
  const actions=r.ctx.h('div',{class:'cb-actions'}),finish=r.ctx.btn(label,'cb-btn--go',()=>{}),bounds=rect(850,620,380,50);
  finish.getBoundingClientRect=()=>bounds;actions.append(finish);r.ctx.main.append(actions);
  const panel=showCallout(r.ctx,r.anchor,r.ctx.h('p',{text:'A yard-sale table.'}));
  assert.equal(r.ctx.main.querySelectorAll('.cb-s01-spot:not(.is-found):not(.is-not)').length,0,'Every discovery has been classified');
  assert.ok(panel.classList.contains('is-flow')||!overlaps(panelBox(panel),bounds),'A nonmodal final finding must not cover Finish');
  assert.equal(r.w.document.activeElement,r.anchor,'Reading a finding retains the selected object');
  panel.dismiss();assert.equal(r.tasks.size,0);assert.equal(panel.isConnected,false);
 }finally{r.close();}
});

test('persistent play toolbar is protected and a callout never treats its own controls as obstacles',()=>{
 const r=setup();try{
  Object.defineProperties(r.w,{innerWidth:{value:1280},innerHeight:{value:720}});panelSize(r);
  const stage=r.ctx.h('section',{'data-playtest-stage':''}),tools=r.ctx.h('div',{class:'pt-toolbar'}),review=r.ctx.btn('Review','pt-tool',()=>{}),bounds=rect(900,500,350,80);
  r.ctx.root.before(stage);stage.append(tools,r.ctx.root);tools.append(review);review.getBoundingClientRect=()=>bounds;
  r.anchor.getBoundingClientRect=()=>rect(918,450,44,44);
  const panel=showCallout(r.ctx,r.anchor,r.ctx.h('p',{text:'A sign.'}));
  assert.ok(panel.classList.contains('is-flow')||!overlaps(panelBox(panel),bounds),'The review/navigation toolbar remains reachable');
  panel.querySelector('button').getBoundingClientRect=()=>rect(0,0,1280,720);
  r.w.dispatchEvent(new r.w.Event('resize'));r.frame();
  assert.equal(panel.classList.contains('is-flow'),false,'The callout never blocks itself from a free placement');
 }finally{r.close();}
});

test('a dense short viewport uses in-flow findings instead of covering visible HUD or action controls',()=>{
 const r=setup();try{
  Object.defineProperties(r.w,{innerWidth:{value:360},innerHeight:{value:300}});panelSize(r,336,205);
  r.anchor.classList.add('is-found');r.anchor.getBoundingClientRect=()=>rect(170,140,44,44);
  const hud=r.ctx.h('div',{class:'cb-stophud'}),back=r.ctx.btn('Map','cb-stophud__back',()=>{}),actions=r.ctx.h('div',{class:'cb-actions'}),finish=r.ctx.btn('Finish','cb-btn--go',()=>{});
  back.getBoundingClientRect=()=>rect(0,0,360,150);finish.getBoundingClientRect=()=>rect(0,150,360,150);
  hud.append(back);actions.append(finish);r.ctx.main.append(hud,actions);
  const panel=showCallout(r.ctx,r.anchor,r.ctx.h('p',{text:'A sign.'}));
  assert.equal(panel.classList.contains('is-flow'),true);assert.equal(panel.parentNode,r.ctx.main);
  assert.equal(r.w.document.activeElement,r.anchor);
  r.advance(600000);assert.equal(panel.isConnected,true,'An in-flow finding waits for the player, with no timer');
 }finally{r.close();}
});

for(const label of ['I am done looking','Ya terminé de buscar'])test(`an in-flow finding stays put through pointerup before the ${label} click`,()=>{
 const r=setup();try{
  Object.defineProperties(r.w,{innerWidth:{value:360},innerHeight:{value:300}});panelSize(r,336,205);
  r.anchor.getBoundingClientRect=()=>rect(170,140,44,44);
  let scrollTop=852,closed=0,activated=0;
  const obstacle=r.ctx.btn('Map','cb-stophud__back',()=>{});obstacle.getBoundingClientRect=()=>rect(0,0,360,150);r.ctx.main.append(obstacle);
  let panel;const finish=r.ctx.btn(label,'cb-btn--go',()=>{
   assert.equal(panel.isConnected,false,'Capture-click dismissal precedes the native target handler');
   assert.equal(scrollTop,765);activated++;
  });finish.getBoundingClientRect=()=>rect(0,150,360,150);r.ctx.main.append(finish);
  panel=showCallout(r.ctx,r.anchor,r.ctx.h('p',{text:'A yard-sale table.'}),{onClose:()=>closed++});
  assert.equal(panel.classList.contains('is-flow'),true);
  const remove=panel.remove.bind(panel);panel.remove=()=>{scrollTop=765;remove();};
  finish.dispatchEvent(new r.w.MouseEvent('pointerdown',{bubbles:true,cancelable:true}));
  assert.equal(panel.isConnected,true,'Removing flow content during pointerdown can clamp the scroller and retarget pointerup');assert.equal(scrollTop,852);
  finish.dispatchEvent(new r.w.MouseEvent('pointerup',{bubbles:true,cancelable:true}));
  assert.equal(panel.isConnected,true);assert.equal(scrollTop,852);
  finish.dispatchEvent(new r.w.MouseEvent('click',{bubbles:true,cancelable:true,detail:1}));
  assert.equal(activated,1);assert.equal(closed,1);assert.equal(r.tasks.size,0);
  r.cleanups.forEach(fn=>fn());assert.equal(closed,1);
 }finally{r.close();}
});

test('the next finding click dismisses its predecessor before opening the new finding',()=>{
 const r=setup();try{
  const next=r.ctx.btn('Another sign','cb-s01-spot',()=>{
   assert.equal(first.isConnected,false);second=showCallout(r.ctx,next,r.ctx.h('p',{text:'The next finding.'}));
  });r.ctx.main.append(next);let second;
  const first=showCallout(r.ctx,r.anchor,r.ctx.h('p',{text:'The previous finding.'}));
  next.dispatchEvent(new r.w.MouseEvent('pointerdown',{bubbles:true,cancelable:true}));assert.equal(first.isConnected,true);
  next.dispatchEvent(new r.w.MouseEvent('pointerup',{bubbles:true,cancelable:true}));assert.equal(first.isConnected,true);
  next.dispatchEvent(new r.w.MouseEvent('click',{bubbles:true,cancelable:true,detail:1}));
  assert.equal(first.isConnected,false);assert.equal(second.isConnected,true);assert.equal(r.ctx.root.querySelectorAll('.cb-callout').length,1);assert.equal(r.w.document.activeElement,next);
 }finally{r.close();}
});
