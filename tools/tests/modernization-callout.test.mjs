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

// PG-UX-C14: a live region inserted already filled is often never read, and the old one read "Keep looking" as part
// of the lesson. The finding is now a plain labelled section; its words go once through the game's persistent polite
// region (ctx.say), without the button. This replaces the earlier role="status" assertion on the section.
test('findings are polite and nonmodal, retain the chosen target, and never close on a timer (WCAG 2.2.1)',()=>{
 const r=setup();try{const said=[];r.ctx.say=t=>said.push(t);const p=showCallout(r.ctx,r.anchor,r.ctx.h('p',{text:'The sign tells us a meeting date.'}),{title:'A meeting sign',closeLabel:'Keep looking',announce:'Signs found: 1 of 6'});
  assert.equal(p.getAttribute('role'),null);assert.equal(p.hasAttribute('aria-live'),false);assert.equal(p.getAttribute('aria-label'),'A meeting sign');
  assert.deepEqual(said,['A meeting sign The sign tells us a meeting date. Signs found: 1 of 6'],'one polite announcement: title, lesson and count, never the button');
  assert.equal(r.w.document.activeElement,r.anchor);assert.equal(r.ctx.root.querySelector('dialog'),null);assert.equal(r.tasks.size,0,'no dismissal clock');r.advance(600000);assert.equal(p.isConnected,true,'a quiet reader keeps the finding as long as needed');}finally{r.close();}
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

// The browser's part in the next tests. Content scrolls with view.top. In flow the finding sits at placeY below the
// board, and its slot keeps that same box while it floats; room() says whether that place takes space in the stage.
function placeModel(r,{width,height,pw,ph,placeY}){
 Object.defineProperties(r.w,{innerWidth:{value:width,configurable:true},innerHeight:{value:height,configurable:true}});
 const view={top:0},native=r.w.HTMLElement.prototype.getBoundingClientRect,x=(width-pw)/2;
 r.w.HTMLElement.prototype.getBoundingClientRect=function(){
  if(this.classList.contains('cb-callout-slot')||(this.classList.contains('cb-callout')&&this.classList.contains('is-flow')))return rect(x,placeY-view.top,pw,ph);
  if(this.classList.contains('cb-callout'))return rect(Number.parseFloat(this.style.left)||0,Number.parseFloat(this.style.top)||0,pw,ph);
  return native.call(this);
 };
 const at=(node,left,top,w,h)=>{node.getBoundingClientRect=()=>rect(left,top-view.top,w,h);return node;};
 const room=()=>!!r.ctx.main.querySelector('.cb-callout.is-flow, .cb-callout-slot');
 const scroll=top=>{view.top=top;r.anchor.dispatchEvent(new r.w.Event('scroll',{bubbles:true}));};
 // A player resting at the bottom: losing the room clamps the scroller, getting it back lets scroll anchoring
 // restore the bottom. Returns how often the finding moved between flow and floating, frame by frame.
 const atBottom=(panel,withRoom,withoutRoom,frames=20)=>{
  const states=[];scroll(withRoom);
  for(let i=0;i<frames;i++){r.frame();states.push(panel.classList.contains('is-flow'));const next=room()?withRoom:withoutRoom;if(next!==view.top)scroll(next);}
  return{states,moves:states.filter((s,i)=>s!==(i?states[i-1]:true)).length};
 };
 return{view,at,room,scroll,atBottom};
}
function sceneButton(r,label,left,top,w,h,m){const b=r.ctx.btn(label,'cb-btn',()=>{});return m?m.at(b,left,top,w,h):Object.assign(b,{getBoundingClientRect:()=>rect(left,top,w,h)});}

// Pixel 7 geometry from CI run 40793399662 (es, finding 5). With the finding's place taking room the stage scrolls
// to 973; without it the stage is 260 px shorter and clamps to 713, where the bottom-right corner touches the done
// button by 1 px. 594e9a2 floated into that corner and back every frame (20 moves in 20 frames).
test('a finding at the bottom of a phone stage moves at most once and then holds still',()=>{
 const r=setup();try{
  const m=placeModel(r,{width:412,height:839,pw:350,ph:236,placeY:1317});m.view.top=600;
  const back=sceneButton(r,'Map',0,0,412,105),other=sceneButton(r,'Another sign',10,600,392,600,m),done=sceneButton(r,'Ya terminé de buscar',37,1245,337,60,m);
  m.at(r.anchor,40,1000,44,44);r.ctx.main.append(back,other,done);
  const panel=showCallout(r.ctx,r.anchor,r.ctx.h('p',{text:'Un aviso nuevo en un tablero.'}));
  assert.equal(panel.classList.contains('is-flow'),true,'No corner is free, so the finding opens in flow');
  const{states,moves}=m.atBottom(panel,973,713);
  assert.ok(moves<=1,`The finding settles after at most one move (moved ${moves} times)`);
  assert.ok(states.slice(-10).every(s=>s===states.at(-1)),'and then holds still');
  assert.equal(m.view.top,973,'Where the finding goes never changes the scroll position');
  if(!panel.classList.contains('is-flow'))for(const b of[back,other,done])assert.ok(!overlaps(panel.getBoundingClientRect(),b.getBoundingClientRect()),'A floating finding covers no control');
  panel.dismiss();assert.equal(r.frames.size,0);assert.equal(r.ctx.main.querySelector('.cb-callout-slot'),null);
 }finally{r.close();}
});

// A tall feedback form below the board. At the bottom of the stage the finding's place is off screen and the
// bottom-right corner is free, but without that place the stage would clamp by 260 px and pull a feedback field
// under the corner. The finding floats once, keeps its place, and never covers the field.
for(const label of['What should we change?','¿Qué deberíamos cambiar?'])test(`a finding that floats at the bottom of the stage keeps its place and leaves "${label}" uncovered`,()=>{
 const r=setup();try{
  const m=placeModel(r,{width:412,height:839,pw:350,ph:236,placeY:832});
  const stage=r.ctx.h('section',{'data-playtest-stage':''}),home=r.ctx.h('div',{id:'pt-feedback-home'});
  r.ctx.root.before(stage);stage.append(r.ctx.root,home);
  const other=sceneButton(r,'Another sign',10,100,392,600,m),done=sceneButton(r,'I am done looking',37,760,337,60,m),dock=sceneButton(r,'Expand feedback',16,1100,380,48,m);
  const field=m.at(r.ctx.h('textarea',{'aria-label':label}),16,1700,380,200);
  m.at(r.anchor,40,300,44,44);r.ctx.main.append(other,done);home.append(dock,field);
  const panel=showCallout(r.ctx,r.anchor,r.ctx.h('p',{text:'A sign.'}));
  assert.equal(panel.classList.contains('is-flow'),true);
  const{states,moves}=m.atBottom(panel,1461,1201);
  assert.ok(moves<=1,`The finding settles after at most one move (moved ${moves} times)`);
  assert.ok(states.slice(-10).every(s=>s===states.at(-1)),'and then holds still');
  assert.equal(m.view.top,1461,'Floating keeps the finding\'s place, so the stage does not clamp');
  assert.equal(panel.classList.contains('is-flow'),false,'Its place is off screen and the corner is free, so it floats into view');
  assert.ok(!overlaps(panel.getBoundingClientRect(),field.getBoundingClientRect()),'The feedback field stays uncovered');
  assert.equal(r.ctx.main.querySelector('.cb-callout-slot').style.height,'236px');
  panel.dismiss();assert.equal(r.ctx.main.querySelector('.cb-callout-slot'),null);
 }finally{r.close();}
});

// 1280 x 720: a dense board opens the finding in flow below the fold. A little scrolling frees the bottom-right
// corner and the finding floats there, in view; once its own place is fully on screen it settles back into it.
test('on a wide screen an off-screen finding floats into view on scroll, settles into its place, and keeps focus',()=>{
 const r=setup();try{
  const m=placeModel(r,{width:1280,height:720,pw:350,ph:205,placeY:900});
  const stage=r.ctx.h('section',{'data-playtest-stage':''}),tools=r.ctx.h('div',{class:'pt-toolbar'}),review=sceneButton(r,'Review',16,8,120,44);
  r.ctx.root.before(stage);stage.append(tools,r.ctx.root);tools.append(review);tools.getBoundingClientRect=()=>rect(0,0,1280,60);
  const board=sceneButton(r,'A busy board',0,60,1280,500,m),done=sceneButton(r,'I am done looking',850,600,380,50,m);
  m.at(r.anchor,918,450,44,44);r.ctx.main.append(board,done);
  const panel=showCallout(r.ctx,r.anchor,r.ctx.h('p',{text:'A sign.'})),keep=panel.querySelector('button');
  assert.equal(panel.classList.contains('is-flow'),true,'No free spot at first, so the finding opens in flow, off screen');
  keep.focus();assert.equal(r.w.document.activeElement,keep);
  m.scroll(150);r.frame();
  assert.equal(panel.classList.contains('is-flow'),false,'The freed corner shows the finding');assert.equal(panel.parentNode,r.ctx.root);
  assert.deepEqual([panel.style.left,panel.style.top],['918px','503px']);
  const slot=r.ctx.main.querySelector('.cb-callout-slot');
  assert.ok(slot,'Its place below the board is kept');assert.deepEqual([slot.style.width,slot.style.height,slot.getAttribute('aria-hidden')],['350px','205px','true']);
  assert.equal(r.w.document.activeElement,keep,'Moving the finding keeps focus on Keep looking');
  m.scroll(300);r.frame();
  assert.equal(panel.classList.contains('is-flow'),false,'Its place is still partly off screen');assert.equal(panel.style.top,'503px');
  // cb.css gives a finding 16 px of padding and a 2 px border; only those may be cut off for its place to count as seen.
  panel.style.padding='16px';panel.style.border='2px solid';
  m.scroll(358);r.frame();
  assert.equal(panel.classList.contains('is-flow'),false,'The bottom of the text is still below the screen');
  m.scroll(375);r.frame();
  assert.equal(panel.classList.contains('is-flow'),true,'Only its padding is off screen: the player can read it all where it is');
  assert.equal(r.w.document.activeElement,keep);
  m.scroll(300);r.frame();
  assert.equal(panel.classList.contains('is-flow'),false,'Scrolled back, it floats in view again');assert.equal(r.w.document.activeElement,keep);
  m.scroll(450);r.frame();
  assert.equal(panel.classList.contains('is-flow'),true,'Its place is on screen, so it settles there');
  assert.equal(panel.parentNode,r.ctx.main);assert.equal(r.ctx.main.querySelector('.cb-callout-slot'),null);assert.equal(r.ctx.main.lastElementChild,panel);
  assert.equal(r.w.document.activeElement,keep);
  for(let i=0;i<5;i++)r.frame();assert.equal(r.frames.size,0,'No input, no work');
  keep.dispatchEvent(new r.w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));
  assert.equal(panel.isConnected,false);assert.equal(r.w.document.activeElement,r.anchor,'Escape closes and returns focus to the spot');
 }finally{r.close();}
});

for(const label of['Expand feedback','Expandir comentarios'])test(`a floating finding leaves the "${label}" feedback control below the game reachable`,()=>{
 const r=setup();try{
  Object.defineProperties(r.w,{innerWidth:{value:1280},innerHeight:{value:720}});panelSize(r);
  const stage=r.ctx.h('section',{'data-playtest-stage':''}),home=r.ctx.h('div',{id:'pt-feedback-home'}),dock=sceneButton(r,label,900,560,368,48);
  r.ctx.root.before(stage);stage.append(r.ctx.root,home);home.append(dock);
  r.anchor.getBoundingClientRect=()=>rect(918,450,44,44);
  const panel=showCallout(r.ctx,r.anchor,r.ctx.h('p',{text:'A sign.'}));
  assert.ok(panel.classList.contains('is-flow')||!overlaps(panelBox(panel),dock.getBoundingClientRect()),'The feedback control stays uncovered');
  assert.equal(panel.classList.contains('is-flow'),false,'A free spot is still used');
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

// PG-UX-C01 / C03 (2026-10-30 round): at 1366x768 almost every finding opened in flow below the board, out of view,
// and Keep looking left the player at the footer. Now an in-flow finding below the fold is scrolled into view at once
// (down to Keep looking), and Keep looking, Escape or Back scroll back to where the player was looking.
test('a finding placed below the fold comes into view at once, and Keep looking scrolls back to the chosen spot',()=>{
 const r=setup();try{
  const m=placeModel(r,{width:1366,height:768,pw:350,ph:300,placeY:1150});
  const port=r.ctx.h('div',{class:'pt-stage-content'});r.ctx.root.before(port);port.append(r.ctx.root);
  Object.defineProperties(port,{scrollHeight:{value:2400,configurable:true},clientHeight:{value:768,configurable:true},scrollTop:{get:()=>m.view.top,set:v=>{m.view.top=v;},configurable:true}});
  let reveals=0;r.w.HTMLElement.prototype.scrollIntoView=function(){if(this.classList.contains('cb-callout')){reveals++;port.scrollTop=1150+300-768;}};
  const board=sceneButton(r,'A busy board',0,60,1366,700,m);m.at(r.anchor,600,650,44,44);r.ctx.main.append(board);
  const panel=showCallout(r.ctx,r.anchor,r.ctx.h('p',{text:'A sign.'}),{closeLabel:'Keep looking'});
  assert.equal(panel.classList.contains('is-flow'),true,'No free corner: the finding opens in its place below the board');
  assert.equal(reveals,1);assert.equal(m.view.top,682);
  const box=panel.getBoundingClientRect();assert.ok(box.top>=0&&box.bottom<=768,'the whole finding, down to Keep looking, is on screen');
  assert.equal(r.w.document.activeElement,r.anchor,'focus stays on the chosen thing');
  r.frame();assert.equal(panel.classList.contains('is-flow'),true,'and it stays in its place');
  panel.querySelector('button').click();
  assert.equal(panel.isConnected,false);assert.equal(m.view.top,0,'Keep looking goes back to where the player was looking');
  assert.equal(r.w.document.activeElement,r.anchor);
 }finally{r.close();}
});
test('a finding already in view is not scrolled, and a tap elsewhere only closes it',()=>{
 const r=setup();try{
  const m=placeModel(r,{width:1366,height:768,pw:350,ph:200,placeY:500});
  let reveals=0;r.w.HTMLElement.prototype.scrollIntoView=function(){reveals++;};
  const board=sceneButton(r,'A busy board',0,0,1366,768,m);m.at(r.anchor,600,300,44,44);r.ctx.main.append(board);
  const panel=showCallout(r.ctx,r.anchor,r.ctx.h('p',{text:'A sign.'}));
  assert.equal(panel.classList.contains('is-flow'),true);assert.equal(reveals,0,'its place below the board is on screen already');
  board.dispatchEvent(new r.w.MouseEvent('click',{bubbles:true,cancelable:true,detail:1}));
  assert.equal(panel.isConnected,false);assert.equal(reveals,0);
 }finally{r.close();}
});
// PG-UX-C15: on a 1920 screen a floating finding went to the window's corner, outside the 1208px game; and it could
// cover the instruction the child was following.
test('a floating finding stays inside the game on a wide screen',()=>{
 const r=setup();try{
  Object.defineProperties(r.w,{innerWidth:{value:1920},innerHeight:{value:1080}});panelSize(r);
  r.ctx.root.getBoundingClientRect=()=>rect(356,80,1208,1000);
  r.anchor.getBoundingClientRect=()=>rect(1500,200,44,44);
  const panel=showCallout(r.ctx,r.anchor,r.ctx.h('p',{text:'A sign.'}));
  assert.equal(panel.classList.contains('is-flow'),false);
  const left=Number.parseFloat(panel.style.left),top=Number.parseFloat(panel.style.top);
  assert.ok(left>=356+12&&left+350<=356+1208-12,`inside the game horizontally (left ${left})`);
  assert.ok(top>=80+12&&top+205<=80+1000-12,`and vertically (top ${top})`);
 }finally{r.close();}
});
test('the instruction card counts as something a floating finding must not cover',()=>{
 const r=setup();try{
  Object.defineProperties(r.w,{innerWidth:{value:1280},innerHeight:{value:720}});panelSize(r);
  r.anchor.getBoundingClientRect=()=>rect(100,100,44,44);
  const coach=r.ctx.h('p',{class:'cb-coach'});coach.getBoundingClientRect=()=>rect(0,150,1280,100);r.ctx.main.prepend(coach);
  const panel=showCallout(r.ctx,r.anchor,r.ctx.h('p',{text:'A sign.'}));
  assert.equal(panel.classList.contains('is-flow'),false);
  assert.ok(!overlaps(panelBox(panel),coach.getBoundingClientRect()),'"Tap only the new things..." stays readable');
 }finally{r.close();}
});

// Review of the 2026-10-30 round: after the reveal scroll a keyboard player's focus stayed on the chosen thing, now
// scrolled out of sight (354-1282 px at 1366 and on phones). When the view moved, keyboard and gamepad focus lands on
// Keep looking, which leads back to the thing; a pointer player's focus stays on the thing.
for(const device of ['keyboard','gamepad'])test(`a ${device} player lands on Keep looking when the finding had to scroll into view, and Keep looking returns to the thing`,()=>{
 const r=setup();try{
  const m=placeModel(r,{width:1366,height:768,pw:350,ph:300,placeY:1150});
  const port=r.ctx.h('div',{class:'pt-stage-content'});r.ctx.root.before(port);port.append(r.ctx.root);
  Object.defineProperties(port,{scrollHeight:{value:2400,configurable:true},clientHeight:{value:768,configurable:true},scrollTop:{get:()=>m.view.top,set:v=>{m.view.top=v;},configurable:true}});
  r.w.HTMLElement.prototype.scrollIntoView=function(){if(this.classList.contains('cb-callout'))port.scrollTop=1150+300-768;};
  const board=sceneButton(r,'A busy board',0,60,1366,700,m);m.at(r.anchor,600,650,44,44);r.ctx.main.append(board);
  r.ctx.root.dataset.input=device;
  const panel=showCallout(r.ctx,r.anchor,r.ctx.h('p',{text:'A sign.'}),{closeLabel:'Keep looking'});
  const keep=panel.querySelector('button');
  assert.equal(m.view.top,682,'the finding scrolled into view');
  assert.equal(r.w.document.activeElement,keep,'focus is on Keep looking, which is in view');
  keep.click();
  assert.equal(m.view.top,0);assert.equal(r.w.document.activeElement,r.anchor,'and Keep looking brings focus back to the thing');
 }finally{r.close();}
});
test('a keyboard player keeps focus on the thing when the finding is already in view',()=>{
 const r=setup();try{
  const m=placeModel(r,{width:1366,height:768,pw:350,ph:200,placeY:500});
  r.w.HTMLElement.prototype.scrollIntoView=function(){};
  const board=sceneButton(r,'A busy board',0,0,1366,768,m);m.at(r.anchor,600,300,44,44);r.ctx.main.append(board);
  r.ctx.root.dataset.input='keyboard';
  showCallout(r.ctx,r.anchor,r.ctx.h('p',{text:'A sign.'}));
  assert.equal(r.w.document.activeElement,r.anchor);
 }finally{r.close();}
});
// Review: tapping one thing and then the next without Keep looking floated the second finding right over the thing
// just tapped (100% at 1366-1920), and over the "Signs found" count, because neither counted as an obstacle.
test('a floating finding never covers the thing it explains, nor the action bar with the count',()=>{
 const r=setup();try{
  Object.defineProperties(r.w,{innerWidth:{value:800},innerHeight:{value:600}});panelSize(r);
  r.anchor.getBoundingClientRect=()=>rect(20,20,100,100);
  // Everything below y=130 is busy: the "below" and "right" places and the bottom corner are taken.
  const busy=r.ctx.btn('Busy','cb-btn',()=>{});busy.getBoundingClientRect=()=>rect(0,130,800,470);r.ctx.main.append(busy);
  const panel=showCallout(r.ctx,r.anchor,r.ctx.h('p',{text:'A sign.'}));
  assert.ok(panel.classList.contains('is-flow')||!overlaps(panelBox(panel),r.anchor.getBoundingClientRect()),'the tapped thing stays visible');
 }finally{r.close();}
 const s=setup();try{
  Object.defineProperties(s.w,{innerWidth:{value:800},innerHeight:{value:600}});panelSize(s);
  s.anchor.getBoundingClientRect=()=>rect(400,40,60,60);
  const bar=s.ctx.h('div',{class:'cb-actions'},[s.ctx.h('p',{class:'cb-msg',text:'Signs found: 4 of 6'})]);bar.getBoundingClientRect=()=>rect(0,112,800,80);s.ctx.main.append(bar);
  const panel=showCallout(s.ctx,s.anchor,s.ctx.h('p',{text:'A sign.'}));
  assert.ok(panel.classList.contains('is-flow')||!overlaps(panelBox(panel),bar.getBoundingClientRect()),'the count stays readable');
 }finally{s.close();}
});
// Review: in phone landscape (640x360) a finding was taller than the play view, so Keep looking sat 41 px below the
// fold on 2 of 12. Short windows get wider lines, and the reveal makes sure Keep looking itself is on screen.
test('a short window gives the finding wider lines',()=>{
 const r=setup();try{
  Object.defineProperties(r.w,{innerWidth:{value:640},innerHeight:{value:360}});panelSize(r,520,200);
  r.anchor.getBoundingClientRect=()=>rect(100,100,44,44);
  const panel=showCallout(r.ctx,r.anchor,r.ctx.h('p',{text:'A sign.'}));
  assert.equal(panel.style.width,'520px');
 }finally{r.close();}
 const t=setup();try{
  Object.defineProperties(t.w,{innerWidth:{value:1366},innerHeight:{value:768}});panelSize(t);
  t.anchor.getBoundingClientRect=()=>rect(100,100,44,44);
  const panel=showCallout(t.ctx,t.anchor,t.ctx.h('p',{text:'A sign.'}));
  assert.equal(panel.style.width,'350px','a laptop keeps the 350 px finding');
 }finally{t.close();}
});
