import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {JSDOM} from 'jsdom';
import {bootGame} from '../../assets/games/community-builders/engine/boot.js';

const base=fileURLToPath(new URL('../../assets/games/community-builders/',import.meta.url));
const clone=value=>JSON.parse(JSON.stringify(value));

async function nativeCore(language='en',{failOnce=null,paused=false}={}) {
  const dom=new JSDOM(`<!doctype html><html lang="${language}"><head><title>Native core test</title></head><body><a hreflang="en" href="index.html"></a><a hreflang="es" href="espanol.html"></a><section data-playtest-stage><div id="community-builders" data-game="community-builders" data-base="assets/games/community-builders/" data-feedback-session="native_test_player_123456"${paused?' data-playtest-paused="true"':''}></div></section></body></html>`,{url:'https://game.test/pecan/index.html?seed=42',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window,requests=[],errors=[];
  w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
  w.scrollTo=()=>{};w.scrollBy=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
  w.Range.prototype.getClientRects=()=>[];w.Range.prototype.getBoundingClientRect=()=>({width:0,height:0});
  w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
  w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new w.Event('close'));};
  w.HTMLImageElement.prototype.decode=()=>Promise.resolve();
  w.Audio=class {constructor(src){this.src=src;this.paused=true;this.currentTime=0;}pause(){this.paused=true;}play(){this.paused=false;return Promise.resolve();}addEventListener(){}removeEventListener(){}};
  // No resource loader is enabled, and any accidental fetch fails locally.
  w.fetch=()=>{throw Error('Native core test attempted a real fetch');};
  w.addEventListener('error',event=>errors.push(event.error||event.message));
  w.console.error=(...args)=>errors.push(args);
  const append=w.document.head.appendChild.bind(w.document.head);
  let failed=false;
  w.document.head.appendChild=node=>{
    const result=append(node);
    if(node.tagName==='SCRIPT'&&node.src.includes('/stops/')) {
      const filename=new URL(node.src).pathname.split('/').pop();requests.push(filename);
      queueMicrotask(()=>{
        if(!failed&&filename===failOnce){failed=true;node.onerror?.();return;}
        try{w.eval(fs.readFileSync(path.join(base,'stops',filename),'utf8'));node.onload?.();}
        catch(error){errors.push(error);node.onerror?.();}
      });
    }else if(node.tagName==='LINK')queueMicrotask(()=>node.onload?.());
    else if(node.tagName==='SCRIPT'&&node.src.includes('/voice/'))queueMicrotask(()=>node.onerror?.());
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
      assert.ok(r.requests.includes('manifest.js'));assert.equal(r.requests.filter(name=>/^\d\d-/.test(name)).length,0,'Stops remain lazy until chosen');
      assert.equal(r.errors.length,0,String(r.errors));
    }finally{r.close();}
  });
  test(`${language}: native Stop 1 actions, pause and snapshot survive a live language round-trip`,async()=>{
    const r=await nativeCore(language);
    try{
      r.core.enterPlay({quiet:true});assert.equal(await r.core.startStop('notice-the-signs'),true);await r.tick();
      assert.ok(r.requests.includes('01-notice-the-signs.js'));assert.ok(r.main().querySelector('.cb-s01-intro'));
      r.main().querySelector('.cb-s01-intro .cb-btn--go').click();r.main().querySelector('[data-view="today"]').click();r.main().querySelector('[data-spot="0"]').click();await r.tick();
      assert.equal(r.root.querySelectorAll('dialog[open]').length,0);assert.ok(r.root.querySelector('.cb-callout'));
      const before=clone(r.core.snapshot()),store=JSON.stringify(r.core.getState().store);assert.equal(before.state.screenKey,'look');assert.equal(before.state.tapped.length+before.state.found.length,1);
      r.core.pause();assert.equal(r.core.getState().paused,true);r.core.resumePlay();assert.equal(r.core.getState().paused,false);
      assert.deepEqual(clone(r.core.snapshot().state),before.state);
      r.core.showMap();assert.equal(await r.core.resume(before),true);await r.tick();assert.deepEqual(clone(r.core.snapshot().state),before.state);
      const alternate=language==='en'?'es':'en';assert.equal(await r.core.setLanguage(alternate),true);await r.tick();
      assert.equal(r.w.document.documentElement.lang,alternate);assert.equal(r.core.getAPI().L,alternate);assert.deepEqual(clone(r.core.snapshot().state),before.state);
      assert.equal(await r.core.setLanguage(language),true);await r.tick();assert.deepEqual(clone(r.core.snapshot().state),before.state);
      assert.equal(JSON.stringify(r.core.getState().store),store,'Restoring and translating do not write a completion score');assert.equal(r.errors.length,0,String(r.errors));
    }finally{r.close();}
  });
  test(`${language}: native Stop 2 answer state restores without losing the chosen question`,async()=>{
    const r=await nativeCore(language);
    try{
      r.core.enterPlay({quiet:true});assert.equal(await r.core.startStop('ask-a-good-question'),true);await r.tick();
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
    dialog=r.core.openLibraryMode(opener);assert.ok(dialog.querySelector('.cb-library'));dialog.querySelector('.cb-library .cb-btn--go').click();
    assert.equal(r.core.getState().quiet,true);assert.equal(r.core.getState().session,session);assert.equal(r.root.querySelectorAll('dialog[open]').length,0);
    let closes=0;dialog=r.core.getAPI().dialog('A test note',[r.core.getAPI().h('p',{text:'A real dialog body'})],opener,()=>closes++);
    dialog.dispatchEvent(new r.w.Event('cancel',{cancelable:true}));dialog.close();
    assert.equal(closes,1);assert.equal(dialog.isConnected,false);assert.equal(r.w.document.activeElement,opener);assert.equal(r.errors.length,0,String(r.errors));
  }finally{r.close();}
});

test('native lazy-stop failure renders a usable retry and the next attempt loads the real module',async()=>{
  const r=await nativeCore('en',{failOnce:'04-fact-or-rumor.js'});
  try{
    r.core.enterPlay({quiet:true});assert.equal(await r.core.startStop('fact-or-rumor'),false);await r.tick();
    assert.match(r.main().textContent,/could not load/);assert.equal(r.main().querySelector('.cb-btn--go').textContent,'Try again');
    r.main().querySelector('.cb-btn--go').click();await r.tick();await r.tick();
    assert.ok(r.main().querySelector('.cb-intro'));assert.equal(r.core.getState().stopId,'fact-or-rumor');assert.equal(r.requests.filter(name=>name==='04-fact-or-rumor.js').length,2);assert.equal(r.errors.length,0,String(r.errors));
  }finally{r.close();}
});
