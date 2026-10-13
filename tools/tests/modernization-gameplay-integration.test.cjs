const test=require('node:test'), assert=require('node:assert/strict');
const {fullCore}=require('./modernization-gameplay-fixture.cjs');
const clone=v=>JSON.parse(JSON.stringify(v));
const partial={1:['[data-view="today"]','.cb-s01-spot'],2:['.cb-s02-tile[data-row="start"]','.cb-s02-tile[data-row="topic"]'],3:['.cb-note'],4:['.cb-peekbtn'],5:['.cb-s05-place'],6:['.cb-s06-desk'],7:['.cb-s07-tile'],8:['.cb-s08-nb'],9:['.cb-s09-chair'],10:['.cb-s10-prob'],11:['.cb-s11-sign'],12:['.cb-s12-card'],13:['.cb-s13-card'],14:['.cb-s14-clue'],15:['.cb-s15-place']};
function sameView(actual,expected,label){let i=0;while(i<actual.length&&actual[i]===expected[i])i++;assert.ok(actual===expected,`${label} at ${i}: expected ${expected.slice(Math.max(0,i-60),i+100)} actual ${actual.slice(Math.max(0,i-60),i+100)}`);}
function view(r){const c=r.main().cloneNode(true);c.querySelectorAll('.cb-stophud,.cb-vbtn,.cb-capbar').forEach(n=>n.remove());return c.innerHTML.replace(/data-v[^=\s]*="[^"]*"/g,'').replace(/tabindex="[^"]*"/g,'').replace(/ is-arriving| is-fresh| is-new| is-pop/g,'').replace(/cb-s13-(slot|tray|heads)-\d+/g,'cb-s13-$1-N').replace(/cb-sc-h\d+/g,'cb-sc-hN').replace(/\s+/g,' ');}
for(const n of Array.from({length:15},(_,i)=>i+1))test(`Stop ${n}: real core restores partial state and survives EN→ES→EN without extra saved results`,async()=>{
 const r=await fullCore('en',42);try{
 const s=r.core.getAPI().STOPS[n-1];await r.core.startStop(s.id);
 r.main().querySelector('.cb-btn--go').click();await r.tick();
 for(const selector of partial[n]){const target=r.main().querySelector(selector);assert.ok(target,selector);target.click();await r.tick();const d=r.root.querySelector('dialog[open]');if(d){const b=d.querySelector('.cb-btn--go,.cb-btn');if(b)b.click();else d.close();await r.tick();}}
 const before=view(r), state=clone(r.core.snapshot()), store=JSON.stringify(r.core.getState().store);
 assert.equal(await r.core.resume(state),true);await r.tick();sameView(view(r),before,'same-language state');assert.equal(JSON.stringify(r.core.getState().store),store,'restore must not save a result');
 assert.equal(await r.core.setLanguage('es'),true);await r.tick();assert.equal(r.w.document.documentElement.lang,'es');
 assert.equal(await r.core.setLanguage('en'),true);await r.tick();sameView(view(r),before,'round-trip language state');assert.equal(JSON.stringify(r.core.getState().store),store,'language change must not save a result');
 assert.equal(r.errors.length,0,String(r.errors));
 }finally{r.close();}
});
test('Live language change before Start preserves the intro gate',async()=>{const r=await fullCore('en',42,true);try{await r.core.setLanguage('es');assert.equal(r.core.getState().mode,'title');assert.equal(r.root.getAttribute('data-playtest-paused'),'true');}finally{r.close();}});
test('A completed Stop 4 result restores the same round without a second score write',async()=>{
 const r=await fullCore('en',42);try{
  await r.core.startStop('fact-or-rumor');r.main().querySelector('.cb-btn--go').click();await r.tick();
  for(let i=0;i<5;i++){r.main().querySelector('.cb-peekbtn').click();r.main().querySelector('.cb-basket').click();await r.tick();r.main().querySelector('.cb-btn--go').click();await r.tick();}
  await new Promise(resolve=>setTimeout(resolve,2100));
  const before=view(r),record=clone(r.core.snapshot()),saved=JSON.stringify(r.core.getState().store);
  assert.ok(r.main().querySelector('.cb-board--result'));
  assert.equal(await r.core.resume(record),true);await new Promise(resolve=>setTimeout(resolve,2100));
  sameView(view(r),before,'completed round');assert.equal(JSON.stringify(r.core.getState().store),saved,'no duplicate completion');
 }finally{r.close();}
});
