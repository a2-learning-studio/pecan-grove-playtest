import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {JSDOM} from 'jsdom';
import {bootGame} from '../../assets/games/community-builders/engine/boot.js';

const base=fileURLToPath(new URL('../../assets/games/community-builders/',import.meta.url));
const clone=value=>JSON.parse(JSON.stringify(value));

async function nativeCore(language='en',{failOnce=null,paused=false,reduced=false,animations=null}={}) {
  const dom=new JSDOM(`<!doctype html><html lang="${language}"><head><title>Native core test</title></head><body><a hreflang="en" href="index.html"></a><a hreflang="es" href="espanol.html"></a><section data-playtest-stage><div id="community-builders" data-game="community-builders" data-base="assets/games/community-builders/" data-feedback-session="native_test_player_123456"${paused?' data-playtest-paused="true"':''}></div></section></body></html>`,{url:'https://game.test/pecan/index.html?seed=42',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window,requests=[],errors=[];
  w.matchMedia=query=>({matches:!!reduced&&query.includes('prefers-reduced-motion'),addEventListener(){},removeEventListener(){}});
  w.scrollTo=()=>{};w.scrollBy=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
  w.Range.prototype.getClientRects=()=>[];w.Range.prototype.getBoundingClientRect=()=>({width:0,height:0});
  w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
  w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new w.Event('close'));};
  w.HTMLImageElement.prototype.decode=()=>Promise.resolve();
  if(animations)w.HTMLElement.prototype.animate=function(frames,options){animations.push({node:this,frames,options});return{finished:Promise.resolve(),cancel(){},pause(){},play(){}};};
  // This native-module fixture models successful requests without a network
  // resource loader; the loading suite separately exercises pending/error cases.
  Object.defineProperties(w.HTMLImageElement.prototype, {
    complete: { configurable: true, get: () => true },
    naturalWidth: { configurable: true, get: () => 960 },
  });
  w.Audio=class {constructor(src){this.src=src;this.paused=true;this.currentTime=0;}pause(){this.paused=true;}play(){this.paused=false;return Promise.resolve();}addEventListener(){}removeEventListener(){}};
  // The only fetch is the actual first-party lazy-stop descriptor, read locally.
  // No resource loader or socket is enabled; any other fetch fails explicitly.
  w.fetch=async url=>{
    const parsed=new URL(String(url),w.location.href);
    if(parsed.origin===w.location.origin&&parsed.pathname.endsWith('/stops/manifest.json')) {
      requests.push('manifest.json');
      return{ok:true,json:async()=>JSON.parse(fs.readFileSync(path.join(base,'stops/manifest.json'),'utf8'))};
    }
    throw Error('Unexpected native core fetch: '+parsed.pathname);
  };
  w.addEventListener('error',event=>errors.push(event.error||event.message));
  w.console.error=(...args)=>errors.push(args);
  const append=w.document.head.appendChild.bind(w.document.head);
  let failed=false;
  w.document.head.appendChild=node=>{
    const result=append(node);
    if(node.tagName==='SCRIPT'&&node.src.includes('/stops/')) {
      const filename=new URL(node.src).pathname.split('/').pop();requests.push(filename);
      w.queueMicrotask(()=>{
        if(!failed&&filename===failOnce){failed=true;node.onerror?.();return;}
        try{w.eval(fs.readFileSync(path.join(base,'stops',filename),'utf8'));node.onload?.();}
        catch(error){errors.push(error);node.onerror?.();}
      });
    }else if(node.tagName==='LINK')w.queueMicrotask(()=>node.onload?.());
    else if(node.tagName==='SCRIPT'&&node.src.includes('/voice/'))w.queueMicrotask(()=>node.onerror?.());
    return result;
  };
  w.eval(fs.readFileSync(path.join(base,'locales/catalog.js'),'utf8'));
  // This is the native imported ES module graph; no bundling or source rewriting.
  const core=bootGame(w);
  const tick=()=>new Promise(resolve=>setTimeout(resolve,20));
  await tick();
  const root=w.document.getElementById('community-builders');
  return{dom,w,core,root,requests,errors,tick,main:()=>root.querySelector('.cb-main'),close:()=>w.close()};
}

test('native boot returns null on a page without the game host',()=>{
  const dom=new JSDOM('<!doctype html><p>Other page</p>');
  try{assert.equal(bootGame(dom.window),null);assert.equal(dom.window.document.querySelector('script'),null);}finally{dom.window.close();}
});

for(const language of ['en','es']) {
  for(const reduced of [false,true])test(`${language}: ${reduced?'system reduced motion':'Calm setting'} swaps real scenes without a partial-text fade`,async()=>{
    const animations=[],r=await nativeCore(language,{reduced,animations});
    try{
      if(!reduced)r.core.updateSettings({calm:true});animations.length=0;
      r.core.enterPlay({quiet:true});r.main().querySelector('.cb-hero .cb-btn--go').click();await r.tick();await r.tick();await r.tick();
      assert.equal(r.core.getState().mode,'map','A programmatic Start click opens the map');
      assert.equal(r.core.motionAllowed(),false);assert.equal(r.w.document.activeElement,r.main().querySelector('h2'));
      assert.equal(await r.core.startStop('notice-the-signs'),true);
      assert.equal(r.w.document.activeElement,r.main().querySelector('h2'),'The readable stop heading receives focus immediately');
      assert.equal(r.main().querySelector('.cb-s01-intro .cb-btn--go').disabled,false,'Input is available without waiting for a fade');
      assert.equal(animations.length,0,'No scene, map disc or transition creates a WAAPI fade under the motion gate');assert.equal(r.errors.length,0,String(r.errors));
    }finally{r.close();}
  });
  test(`${language}: native map focus settles without stealing feedback focus or overriding the next stop`,async()=>{
    const r=await nativeCore(language);
    try{
      r.core.enterPlay({quiet:true});r.main().querySelector('.cb-hero .cb-btn--go').click();
      assert.equal(r.root.dataset.sceneLayout,'pending');
      await r.tick();await r.tick();await r.tick();
      assert.equal(r.root.dataset.sceneLayout,'ready');
      assert.equal(r.w.document.activeElement,r.main().querySelector('h2'));
      const feedback=r.w.document.createElement('textarea');r.w.document.body.append(feedback);feedback.value='My playtest note';feedback.focus();
      r.core.showMap();await r.tick();await r.tick();await r.tick();
      assert.equal(r.w.document.activeElement,feedback,'A map refresh preserves focus in the external feedback form');assert.equal(feedback.value,'My playtest note');
      r.main().querySelector('.cb-stop').focus();r.core.showMap();
      assert.equal(r.root.dataset.sceneLayout,'pending');
      assert.equal(await r.core.startStop('notice-the-signs'),true);
      const heading=r.main().querySelector('h2');assert.equal(r.w.document.activeElement,heading,'Stop headings retain immediate focus');
      await r.tick();await r.tick();await r.tick();
      assert.equal(r.w.document.activeElement,heading,'Cancelled map focus cannot steal focus from the next stop');assert.equal(r.root.dataset.sceneLayout,'ready');assert.equal(r.errors.length,0,String(r.errors));
    }finally{r.close();}
  });
  test(`${language}: native ES module boot exposes the actual core API and opens all fifteen map stops`,async()=>{
    const r=await nativeCore(language,{paused:true});
    try{
      assert.equal(r.core,r.w.CommunityBuilders);assert.equal(r.core.getState().mode,'title');assert.ok(r.root.querySelector('.cb-hero'));
      assert.equal(r.core.getAPI().STOPS.length,15);assert.equal(r.core.getAPI().L,language);
      for(const method of ['snapshot','resume','pause','resumePlay','startStop','showMap','showTitle','openSettings','setLanguage','enterPlay'])assert.equal(typeof r.core[method],'function',method);
      r.core.enterPlay({quiet:true});await r.tick();
      assert.equal(r.core.getState().mode,'title');
      r.main().querySelector('.cb-hero .cb-btn--go').click();
      assert.equal(r.core.getState().mode,'map');assert.equal(r.core.getState().quiet,true);assert.equal(r.root.hasAttribute('data-playtest-paused'),false);
      assert.equal(new Set([...r.main().querySelectorAll('.cb-stop[data-stop-n]')].map(node=>node.dataset.stopN)).size,15,'The canvas and accessible stop list cover the same fifteen stops');
      assert.ok(r.requests.includes('manifest.json'));assert.equal(r.requests.filter(name=>/^\d\d-/.test(name)).length,0,'Stops remain lazy until chosen');
      assert.equal(r.errors.length,0,String(r.errors));
    }finally{r.close();}
  });
  test(`${language}: native Stop 1 actions, pause and snapshot survive a live language round-trip`,async()=>{
    const r=await nativeCore(language);
    try{
      // Library / Class mode also chooses classic find cards; this case covers the default inline findings.
      r.core.enterPlay({quiet:true});r.core.updateSettings({findCards:false});assert.equal(await r.core.startStop('notice-the-signs'),true);await r.tick();
      assert.equal(r.root.querySelector('.cb-loading-overlay'),null,'Successful critical artwork leaves the real scene usable');
      assert.ok(r.requests.includes('01-notice-the-signs.js'));assert.ok(r.main().querySelector('.cb-s01-intro'));
      r.main().querySelector('.cb-s01-intro .cb-btn--go').click();r.main().querySelector('[data-view="today"]').click();r.main().querySelector('[data-spot="0"]').click();await r.tick();
      assert.equal(r.root.querySelectorAll('dialog[open]').length,0);assert.ok(r.root.querySelector('.cb-callout'));
      const before=clone(r.core.snapshot()),store=JSON.stringify(r.core.getState().store);assert.equal(before.state.screenKey,'look');assert.equal(before.state.tapped.length+before.state.found.length,1);
      r.core.pause();assert.equal(r.core.getState().paused,true);r.core.resumePlay();assert.equal(r.core.getState().paused,false);
      assert.deepEqual(clone(r.core.snapshot().state),before.state);
      r.core.showMap();assert.equal(await r.core.resume(before),true);await r.tick();assert.deepEqual(clone(r.core.snapshot().state),before.state);
      const alternate=language==='en'?'es':'en';assert.equal(await r.core.setLanguage(alternate),true);await r.tick();
      assert.equal(r.w.document.documentElement.lang,alternate);assert.equal(r.core.getAPI().L,alternate);assert.deepEqual(clone(r.core.snapshot().state),before.state);
      assert.match(r.w.location.pathname, alternate==='es'?/espanol\.html$/:/index\.html$/);
      assert.equal(await r.core.setLanguage(language),true);await r.tick();assert.deepEqual(clone(r.core.snapshot().state),before.state);
      assert.match(r.w.location.pathname, language==='es'?/espanol\.html$/:/index\.html$/);
      assert.equal(JSON.stringify(r.core.getState().store),store,'Restoring and translating do not write a completion score');assert.equal(r.errors.length,0,String(r.errors));
    }finally{r.close();}
  });
  test(`${language}: native Stop 2 answer state restores without losing the chosen question`,async()=>{
    const r=await nativeCore(language);
    try{
      r.core.enterPlay({quiet:true});assert.equal(await r.core.startStop('ask-a-good-question'),true);await r.tick();
      assert.equal(r.root.querySelector('.cb-loading-overlay'),null,'Successful critical artwork leaves the real scene usable');
      const first=r.main().querySelector('.cb-s02-first').textContent.replace(/^[^:]+:\s*/,'');r.main().querySelector('.cb-s02-intro .cb-btn--go').click();
      assert.equal(r.main().querySelector('.cb-s02-nb[data-i="0"] .cb-s02-nb__name').textContent,first);
      for(const row of ['start','topic','detail'])r.main().querySelector(`.cb-s02-row[data-row="${row}"] .cb-s02-tile`).click();
      r.main().querySelector('.cb-s02-ask').click();await r.tick();assert.ok(r.main().querySelector('[data-s02="answer"]'));
      const before=clone(r.core.snapshot());assert.equal(before.state.answers.length,1);
      assert.equal(await r.core.resume(before),true);await r.tick();assert.deepEqual(clone(r.core.snapshot().state),before.state);assert.ok(r.main().querySelector('[data-s02="answer"]'));
      assert.equal(await r.core.setLanguage(language==='en'?'es':'en'),true);await r.tick();
      const translated=clone(r.core.snapshot().state),semantic=state=>({...state,answers:state.answers.map(({w,start,topic,detail,pts,fixed})=>({w,start,topic,detail,pts,fixed:!!fixed}))});
      assert.deepEqual(semantic(translated),semantic(before.state));assert.notEqual(translated.answers[0].q,before.state.answers[0].q,'The selected question translates while its IDs and earned points stay the same');
      assert.equal(r.errors.length,0,String(r.errors));
    }finally{r.close();}
  });
}

test('native settings/library dialogs preserve the session, save quiet settings and close once with focus restored',async()=>{
  const r=await nativeCore();
  try{
    r.core.enterPlay({quiet:false});r.main().querySelector('.cb-hero .cb-btn--go').click();const session=r.core.getState().session,opener=r.main().querySelector('.cb-stop');opener.focus();
    r.core.openSettings(opener);let dialog=r.root.querySelector('dialog[open]');assert.ok(dialog?.querySelector('.cb-set'));
    dialog.close();assert.equal(r.w.document.activeElement,opener);
    r.core.updateSettings({calm:true,cap:true,voice:false,rate:1.15});const stored=JSON.parse(r.w.localStorage.getItem('pecan-grove-settings'));
    assert.equal(stored.voice,false);assert.equal(stored.cap,true);assert.equal(stored.rate,1.15);assert.equal(r.core.motionAllowed(),false);
    // PG-UX-C28: with the voice already off, Use quiet mode shows as the current state and Settings is the main (go)
    // action, so the quiet button is found by its words rather than by the go colour.
    dialog=r.core.openLibraryMode(opener);assert.ok(dialog.querySelector('.cb-library'));const quietButton=[...dialog.querySelectorAll('.cb-library .cb-btn')].find(b=>b.textContent.includes(r.core.getAPI().X.libraryQuiet));
    assert.equal(quietButton.getAttribute('aria-pressed'),'true');assert.equal(quietButton.classList.contains('cb-btn--go'),false);quietButton.click();
    assert.equal(r.core.getState().quiet,true);assert.equal(r.core.getState().session,session);assert.equal(r.root.querySelectorAll('dialog[open]').length,0);
    assert.equal(r.core.getAPI().prefersFindCards(),true,'Library mode enables classic finding cards');
    await r.core.startStop('notice-the-signs');r.main().querySelector('.cb-s01-intro .cb-btn--go').click();r.main().querySelector('[data-view="today"]').click();r.main().querySelector('[data-spot="0"]').click();
    assert.ok(r.root.querySelector('.cb-s01-dlg[open]'),'The classic setting changes the real Stop 1 finding UI');r.root.querySelector('.cb-s01-dlg').close();
    r.core.showMap();
    const modalOpener=r.main().querySelector('.cb-stop');modalOpener.focus();
    let closes=0;dialog=r.core.getAPI().dialog('A test note',[r.core.getAPI().h('p',{text:'A real dialog body'})],modalOpener,()=>closes++);
    dialog.dispatchEvent(new r.w.Event('cancel',{cancelable:true}));dialog.close();
    assert.equal(closes,1);assert.equal(dialog.isConnected,false);assert.equal(r.w.document.activeElement,modalOpener);assert.equal(r.errors.length,0,String(r.errors));
  }finally{r.close();}
});

test('grown-up Install action prompts only after an explicit click',async()=>{
  const r=await nativeCore();try{let prompts=0;r.w.PecanGroveOffline={availableInstall:true,install(){prompts++;return Promise.resolve(true);}};r.core.enterPlay({quiet:true});r.main().querySelector('.cb-hero .cb-btn--go').click();r.core.openGrownups(r.main().querySelector('.cb-stop'));const d=r.root.querySelector('dialog[open]');assert.equal(prompts,0);const install=[...d.querySelectorAll('button')].find(b=>b.textContent===r.core.getAPI().W.installGame);assert.ok(install);install.click();assert.equal(prompts,1);}finally{r.close();}
});

test('For grown-ups still offers Next player when the feedback form could not load its words',async()=>{
  const r=await nativeCore();try{let asked=0;r.w.PecanGroveFeedback={requestNewPlayer(){asked++;}};r.core.enterPlay({quiet:true});r.main().querySelector('.cb-hero .cb-btn--go').click();r.core.openGrownups(r.main().querySelector('.cb-stop'));const d=r.root.querySelector('dialog[open]'),W=r.core.getAPI().W,buttons=[...d.querySelectorAll('button')];assert.ok(!buttons.some(b=>b.textContent===W.devicePanel),'the privacy panel needs the feedback words');const next=buttons.find(b=>b.textContent===W.nextPlayer);assert.ok(next);next.click();assert.equal(asked,1);assert.equal(r.errors.length,0,String(r.errors));}finally{r.close();}
});

test('For grown-ups links to the educator sheet in each language',async()=>{
  for(const language of ['en','es']){const r=await nativeCore(language);try{r.core.enterPlay({quiet:true});r.main().querySelector('.cb-hero .cb-btn--go').click();r.core.openGrownups(r.main().querySelector('.cb-stop'));const link=r.root.querySelector('dialog[open] a.cb-dlg__link');assert.ok(link);assert.equal(link.getAttribute('href'),language==='en'?'educator.html':'educador.html');assert.equal(link.textContent,r.core.getAPI().W.educator);assert.equal(link.getAttribute('rel'),'noopener');assert.equal(r.errors.length,0,String(r.errors));}finally{r.close();}}
});

test('native lazy-stop failure renders a usable retry and the next attempt loads the real module',async()=>{
  const r=await nativeCore('en',{failOnce:'04-fact-or-rumor.js'});
  try{
    const unavailable=[];r.w.document.addEventListener('cb:stop-unavailable',event=>unavailable.push(event.detail.id));
    r.core.enterPlay({quiet:true});assert.equal(await r.core.startStop('fact-or-rumor'),false);await r.tick();
    assert.deepEqual(unavailable,['fact-or-rumor'],'the offline layer is asked to look for a newer release');
    assert.match(r.main().textContent,/could not load/);assert.equal(r.main().querySelector('.cb-btn--go').textContent,'Try again');
    r.main().querySelector('.cb-btn--go').click();await r.tick();await r.tick();
    assert.ok(r.main().querySelector('.cb-intro'));assert.equal(r.core.getState().stopId,'fact-or-rumor');assert.equal(r.requests.filter(name=>name==='04-fact-or-rumor.js').length,2);assert.equal(r.errors.length,0,String(r.errors));
  }finally{r.close();}
});

test('native public choices/nav helpers annotate actual stop controls and preserve explicit entry/wrap',async()=>{
 const r=await nativeCore();try{const api=r.core.getAPI(),group=api.h('div',{},[api.h('button',{text:'First'}),api.h('button',{text:'Second',id:'entry-two'})]);r.main().append(group);
 assert.equal(api.choices(group),group);assert.equal(group.querySelectorAll('[data-cb-choice]').length,2);assert.equal(group.lastChild.getAttribute('aria-keyshortcuts'),'2');assert.equal(group.querySelectorAll('.cb-choice-badge').length,2);
 assert.equal(api.nav.group(group,{entry:'#entry-two',wrap:false}),group);assert.equal(group.dataset.cbNavGroup,'row');assert.equal(group.dataset.cbNavWrap,'false');assert.ok(group.lastChild.hasAttribute('data-cb-nav-entry'));
 let removed=null;const handler=()=>{};r.w.PecanGroveEngine={input:{off:(...args)=>{removed=args;}}};api.input.off('confirm',handler);assert.deepEqual(removed,['confirm',handler]);
 }finally{r.close();}
});
test('native map locks only later unfinished stops when adults choose order and labels resumable steps',async()=>{
 const r=await nativeCore();try{r.core.enterPlay({quiet:true});r.main().querySelector('.cb-hero .cb-btn--go').click();const api=r.core.getAPI();
 assert.equal(r.main().querySelectorAll('.cb-stop[aria-disabled="true"]').length,0);
 const mapStop=r.main().querySelector('.cb-stop');mapStop.focus();mapStop.dispatchEvent(new r.w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));assert.equal(mapStop.classList.contains('is-quiet'),false,'Escape remains available to the shared pause action rather than hiding a map tooltip');
 assert.ok(r.main().querySelector('.cb-stones[data-upcoming="true"]'),'Upcoming stones are explicitly marked for motion-gated shimmer');
 r.core.updateSettings({playInOrder:true});r.core.showMap();assert.equal(r.main().querySelector('.cb-stop[data-stop-n="1"]').getAttribute('aria-disabled'),null);assert.equal(r.main().querySelector('.cb-stop[data-stop-n="2"]').getAttribute('aria-disabled'),'true');
 const state=r.core.getState(),player=state.store.players[state.store.current];player.stops[api.STOPS[0].id]={best:90,rounds:1};r.core.showMap();assert.equal(r.main().querySelector('.cb-stop[data-stop-n="2"]').getAttribute('aria-disabled'),null);assert.equal(r.main().querySelector('.cb-stop[data-stop-n="3"]').getAttribute('aria-disabled'),'true');
 await r.core.startStop(api.STOPS[1].id);player.resume=r.core.snapshot();r.core.showMap();const started=r.main().querySelector('.cb-stop[data-stop-n="2"]');assert.equal(started.dataset.state,'started');assert.match(started.getAttribute('aria-label'),/Keep going/);started.click();await r.tick();assert.ok(r.main().querySelector('.cb-s02-intro'));
 }finally{r.close();}
});

for(const language of ['en','es'])test(`${language}: native Peek exposes the actual dated fictional proposal excerpt`,async()=>{
 const r=await nativeCore(language);try{r.core.enterPlay({quiet:true});await r.core.startStop('fact-or-rumor');r.main().querySelector('.cb-intro .cb-btn--go').click();
 let found=false;for(let i=0;i<5;i++){const excerpt=r.main().querySelector('.cb-source-excerpt');if(excerpt){r.main().querySelector('.cb-peekbtn').click();assert.equal(excerpt.closest('.cb-source').hidden,false);assert.match(excerpt.textContent,language==='en'?/made up for Pecan Grove/:/inventó para Pecan Grove/);assert.equal(excerpt.querySelectorAll('blockquote p').length,5);found=true;break;}r.main().querySelector('.cb-basket').click();r.main().querySelector('.cb-actions .cb-btn--go').click();}
 assert.equal(found,true,'Every five-claim round includes one proposal-backed fact');assert.equal(r.errors.length,0,String(r.errors));
 }finally{r.close();}
});
