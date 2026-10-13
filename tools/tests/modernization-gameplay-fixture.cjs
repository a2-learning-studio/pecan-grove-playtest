const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { JSDOM } = require('jsdom');
const base = path.join(__dirname, '../../assets/games/community-builders');
async function fullCore(lang = 'en', seed = 42, paused = false, saved = null, options = {}) {
  const dom = new JSDOM(`<!doctype html><html lang="${lang}"><head></head><body><a hreflang="en" href="index.html"></a><a hreflang="es" href="espanol.html"></a><section data-playtest-stage><div data-game="community-builders" data-base="assets/games/community-builders/" data-feedback-session="test_player_session_123456"${paused ? ' data-playtest-paused="true"' : ''}></div></section></body></html>`, {url:`https://example.com/game/index.html?seed=${seed}`, runScripts:'outside-only', pretendToBeVisual:true});
  const w=dom.window;
  if (saved) w.localStorage.setItem(saved.key, saved.value);
  w.matchMedia=()=>({matches:!!options.reduced,addEventListener(){},removeEventListener(){}});
  w.scrollTo=()=>{}; w.scrollBy=()=>{}; w.Range.prototype.getClientRects=()=>[]; w.Range.prototype.getBoundingClientRect=()=>({width:0,height:0}); w.HTMLElement.prototype.scrollIntoView=()=>{};
  w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
  w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new w.Event('close'));};
  w.HTMLImageElement.prototype.decode=()=>Promise.resolve();
  w.Audio=class {constructor(){this.paused=true;this.currentTime=0;} pause(){this.paused=true;} play(){this.paused=false;return Promise.resolve();} addEventListener(){} removeEventListener(){} };
  if (options.audioFactory) w.Audio=options.audioFactory(w);
  const errors=[];w.console.error=(...args)=>errors.push(args);
  const original=w.document.head.appendChild.bind(w.document.head);
  w.document.head.appendChild=node=>{
    const r=original(node);
    if(node.tagName==='SCRIPT' && node.src.includes('/stops/')) {
      queueMicrotask(()=>{try {const filename=new URL(node.src).pathname.split('/').pop();const source=fs.readFileSync(path.join(base,'stops',filename),'utf8');w.eval(options.transformStopSource ? options.transformStopSource(source,filename) : source);node.onload?.();} catch(e){errors.push([e]);node.onerror?.();}});
    } else if(node.tagName==='LINK') queueMicrotask(()=>node.onload?.());
    else if(node.tagName==='SCRIPT' && node.src.includes('/voice/')) queueMicrotask(()=>{if(options.voice){w.eval(fs.readFileSync(path.join(base,'voice/index.js'),'utf8'));node.onload?.();}else node.onerror?.();});
    return r;
  };
  w.eval(fs.readFileSync(path.join(base,'locales/catalog.js'),'utf8'));
  const { bootGame } = await import(pathToFileURL(path.join(base,'engine/boot.js')).href);
  bootGame(w);
  await new Promise(r=>setTimeout(r,15));
  const root=w.document.querySelector('[data-game]');
  return {dom,w,root,core:w.CommunityBuilders,errors,main:()=>root.querySelector('.cb-main'),tick:()=>new Promise(r=>setTimeout(r,15)),close:()=>w.close()};
}
module.exports={fullCore};
