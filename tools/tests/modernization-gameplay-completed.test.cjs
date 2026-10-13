/* These tests expose authored round closures for choosing the real DOM controls.
   They run the actual core/module implementations and compare complete result state,
   including the original saved-result messages, after restoration and live switching. */
const test = require('node:test'), assert = require('node:assert/strict');
const { fullCore } = require('./modernization-gameplay-fixture.cjs');
const flows = {1:'{spots}',2:'{round,speakers}',3:'{lines,set,wishes:WISHES}',4:'{round}',5:'{round}',6:'{round}',7:'{round,decider}',8:'{round,fits}',9:'{seats}',10:'{round:R}',11:'{order,rightNbs,fitIds}',12:'{deck,state:S}',13:'{tray,heads:HEADS,slots}',14:'{items,followups:FU}',15:'{places:PLACES,trays,tiles:TILES,deal,keyPlace:KEY_PLACE,missing}'};
function expose(n, source) {
  const marker = /\n([ \t]+)(intro|start|startScreen|part1)\(\);\r?\n([ \t]*)\}/;
  assert.match(source, marker, 'the authored run entry remains inspectable');
  return source.replace(marker, '\n$1window.__stopTestFlow = ' + flows[n] + ';\n$1$2();\n$3}');
}
function view(r) {
  const c = r.main().cloneNode(true);
  c.querySelectorAll('.cb-stophud,.cb-vbtn,.cb-capbar').forEach(n=>n.remove());
  return c.innerHTML.replace(/data-v[^=\s]*="[^"]*"/g,'').replace(/tabindex="[^"]*"/g,'').replace(/ is-arriving| is-fresh| is-new| is-pop/g,'').replace(/cb-s13-(slot|tray|heads)-\d+/g,'cb-s13-$1-N').replace(/cb-sc-h\d+/g,'cb-sc-hN').replace(/\s+/g,' ');
}
function sameView(actual,expected,label) { let i=0;while(i<actual.length&&actual[i]===expected[i])i++;assert.ok(actual===expected,`${label} at ${i}: expected ${expected.slice(Math.max(0,i-60),i+100)} actual ${actual.slice(Math.max(0,i-60),i+100)}`); }
async function complete(r,n) {
  const api=r.core.getAPI(),f=r.w.__stopTestFlow;
  const q = selector=>r.main().querySelector(selector);
  const click=async target=>{const el=typeof target==='string'?q(target):target;assert.ok(el,`Stop ${n} control ${target}`);assert.equal(el.disabled,false);el.click();await r.tick();};
  const go=()=>click('.cb-btn--go');
  if(n!==3)await go();
  if(n===1){await click('[data-view="today"]');for(const s of f.spots.filter(s=>s.item.sign))await click(`[data-spot="${s.i}"]`);await go();}
  if(n===2){for(let i=0;i<4;i++){for(const row of ['start','topic','detail'])await click(`.cb-s02-tile[data-row="${row}"]`);await click('.cb-s02-ask');await new Promise(resolve=>setTimeout(resolve,410));await go();}}
  if(n===3){
    for(const nb of api.NB){await click(`[data-nb="${nb.id}"]`);r.root.querySelector('dialog[open]').close();await r.tick();}await go();
    for(const wish of f.wishes[f.set])for(const nb of api.NB.filter(nb=>[f.lines[nb.id][1],f.lines[nb.id][3]].includes(wish)).slice(0,2))await click(`[data-nb="${nb.id}"]`);
    await go();for(let i=0;i<4;i++){const line=q('.cb-bubble p').textContent,nb=api.NB.find(nb=>[api.t2(f.lines[nb.id][0]),api.t2(f.lines[nb.id][2])].includes(line));assert.ok(nb);await click([...r.main().querySelectorAll('.cb-face-btn')].find(b=>b.getAttribute('aria-label')===api.nmCap(nb)));await go();}
  }
  if(n===4)for(const claim of f.round){await click('.cb-peekbtn');await click(`[data-k="${claim.right}"]`);await go();}
  if(n===5){for(const row of f.round)for(let stage=0;stage<2;stage++){const attr=stage?'data-nb':'data-p',correct=stage?row.c.next:row.c.first;await click([...r.main().querySelectorAll('['+attr+']')].find(b=>correct.includes(b.getAttribute(attr))));await click('.cb-s05-next');}await click('.cb-s05-see');}
  if(n===6){for(const row of f.round){await click(`[data-desk="${row.desk}"]`);await click('[data-s06-next]');}await click('[data-s06-see]');}
  if(n===7){for(const row of ['n','w','i'])await click(`[data-tile="${f.round.rows[row].find(t=>t.topic===f.round.spark.topic).key}"]`);await click('.cb-s07-ready');await click(`[data-h="${f.decider()}"]`);await new Promise(resolve=>setTimeout(resolve,270));await click([...r.main().querySelectorAll('.cb-btn--go')].at(-1));}
  if(n===8){for(const side of ['A','B']){await click(`[data-s08="nb-${side}"]`);await click(`[data-s08="ask-${side}"]`);}for(const card of f.round.cards.filter(c=>f.fits(c,'A')&&f.fits(c,'B')))await click(`[data-s08="card-${card.i}"]`);await click('[data-s08="see"]');await go();}
  if(n===9){for(let i=0;i<5;i++){await click(`[data-s09-chair="${i}"]`);await click(`[data-s09-way="${f.seats[i].p.helps[0]}"]`);await click('[data-s09="done"]');}await click('[data-s09="finish"]');await click('[data-s09="see"]');}
  if(n===10){for(const code of f.round.probs){await click(`[data-p="${code}"]`);await click(`[data-f="${code}"]`);await click('[data-b="check"]');r.root.querySelector('dialog[open]').close();await r.tick();await click('[data-b="link"]');}await click('.cb-s10-see');}
  if(n===11){for(const id of f.order)await click(`[data-path="${id}"]`);await click('.cb-s11-choose');for(let step=0;step<2;step++){await click(`[data-nb="${f.rightNbs(step)[0]}"]`);await click('.cb-s11-next');}await click(`[data-chg="${f.fitIds()[0]}"]`);await click('.cb-s11-next');await click('.cb-s11-see');}
  if(n===12){
    let selected;for(let a=0;a<f.deck.length&&!selected;a++)for(let b=a+1;b<f.deck.length&&!selected;b++)for(let c=b+1;c<f.deck.length&&!selected;c++)for(let d=c+1;d<f.deck.length&&!selected;d++){const four=[f.deck[a],f.deck[b],f.deck[c],f.deck[d]];if(new Set(four.flatMap(c=>[...c.helps])).size>=5)selected=four;}assert.ok(selected);
    for(const c of selected)await click(`[data-s12="card-${c.id}"]`);await click('[data-s12="show"]');await click('[data-s12="ask"]');for(let i=0;i<4;i++){if(q('[data-s12="opt-0"]'))await click('[data-s12="opt-0"]');await click('[data-s12="next"]');}
    for(let i=0;i<4;i++)for(const key of ['who','what','when']){await click(`[data-s12="f-${i}-${key}"]`);if(key!=='what')await click(`[data-s12="ch-${i}-${key}-0"]`);}await click('[data-s12="sign"]');await click('[data-s12="see"]');
  }
  if(n===13){
    const rumor=f.tray.findIndex(c=>c.kind==='rumor');await click(`[data-s13card="${rumor}"]`);await click('[data-s13act="src-0"]');await new Promise(resolve=>setTimeout(resolve,310));await click('[data-s13act="off-0"]');
    const old=f.tray.findIndex(c=>c.kind==='old');await new Promise(resolve=>setTimeout(resolve,310));await click(`[data-s13card="${old}"]`);await click('[data-s13act="date-0"]');await new Promise(resolve=>setTimeout(resolve,310));await click('[data-s13act="swap-0"]');
    const other=f.tray.findIndex(c=>c.kind==='fact'&&c.tag!==f.slots[0].card.tag);await new Promise(resolve=>setTimeout(resolve,310));await click(`[data-s13card="${other}"]`);const third=f.tray.findIndex((c,i)=>c.kind==='fact'&&i!==old&&i!==other);await click(`[data-s13card="${third}"]`);
    for(let i=0;i<3;i++){await click(`[data-s13act="src-${i}"]`);await click(`[data-s13act="date-${i}"]`);}await click(`[data-s13head="${f.heads.findIndex(h=>h.tells)}"]`);await click('[data-s13next]');await click('[data-s13share="family"]');await click('[data-s13see]');
  }
  if(n===14){for(const it of f.items){await click(it.state==='none'?'[data-s14="none"]':`[data-clue="${it.p.clue}"]`);await click(`button[data-st="${it.truth}"]`);await go();}for(let i=0;i<f.items.length;i++)if(f.items[i].truth!=='kept')await click(`[data-row="${i}"][data-fu="${f.followups[0]}"]`);await go();await click('[data-s14="see"]');}
  if(n===15){for(const place of f.places){const wishes=Object.values(f.deal).filter(w=>f.keyPlace[w[1]]===place.id),tid=f.trays[place.id].slice().sort((a,b)=>wishes.filter(w=>f.tiles[b].ans.includes(w)).length-wishes.filter(w=>f.tiles[a].ans.includes(w)).length)[0];await click(`[data-s15-place="${place.id}"]`);await click(`[data-s15-see="${tid}"]`);await click(`[data-s15-put="${tid}"]`);}await click('[data-s15="next"]');await click('[data-s15-check]');await click('[data-s15="next"]');await click(`[data-s15-person="${f.missing[0]}"]`);await click('[data-s15="finish"]');await click('[data-s15="picnic"]');await click('[data-s15="see"]');}
}
for(const language of ['en','es'])for(let n=1;n<=15;n++)test(`${language} Stop ${n}: completed result restores exactly and switches language without another score write`, async()=>{
  const r=await fullCore(language,42,false,null,{reduced:true,transformStopSource:(source,filename)=>Number(filename.slice(0,2))===n?expose(n,source):source});
  const runtimeErrors=[];r.w.addEventListener('error',event=>{runtimeErrors.push(event.error||event.message);event.preventDefault();});
  try {
    const stop=r.core.getAPI().STOPS[n-1];await r.core.startStop(stop.id);assert.ok(r.w.__stopTestFlow,'the real round is available for authored choices');await complete(r,n);
    assert.ok(r.main().querySelector('.cb-board--result'),'a completed score card appears');assert.ok(r.main().querySelector('.cb-card__can'),'the real-world takeaway remains');
    const before=view(r),record=JSON.parse(JSON.stringify(r.core.snapshot())),saved=JSON.stringify(r.core.getState().store);
    assert.equal(await r.core.resume(record),true);await r.tick();sameView(view(r),before,'completed state');assert.equal(JSON.stringify(r.core.getState().store),saved,'restoring must not save twice');
    assert.equal(await r.core.setLanguage(language==='en'?'es':'en'),true);await r.tick();assert.equal(await r.core.setLanguage(language),true);await r.tick();sameView(view(r),before,'completed bilingual round trip');assert.equal(JSON.stringify(r.core.getState().store),saved,'switching must not save twice');
    assert.equal(runtimeErrors.length,0,runtimeErrors.map(String).join('\n'));assert.equal(r.errors.length,0,String(r.errors));
  } finally { r.close(); }
});
