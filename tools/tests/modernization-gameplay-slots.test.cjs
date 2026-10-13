const test=require('node:test'),assert=require('node:assert/strict');
const {fullCore}=require('./modernization-gameplay-fixture.cjs');
const partial={1:['[data-view="today"]','.cb-s01-spot'],2:['.cb-s02-tile[data-row="start"]','.cb-s02-tile[data-row="topic"]'],3:['.cb-note'],4:['.cb-peekbtn'],5:['.cb-s05-place'],6:['.cb-s06-desk'],7:['.cb-s07-tile'],8:['.cb-s08-nb'],9:['.cb-s09-chair'],10:['.cb-s10-prob'],11:['.cb-s11-sign'],12:['.cb-s12-card'],13:['.cb-s13-card'],14:['.cb-s14-clue'],15:['.cb-s15-place']};
function state(r){const c=r.main().cloneNode(true);c.querySelectorAll('.cb-stophud,.cb-vbtn,.cb-capbar').forEach(n=>n.remove());return c.innerHTML.replace(/data-v[^=\s]*="[^"]*"|tabindex="[^"]*"/g,'').replace(/ is-arriving| is-fresh| is-new| is-pop/g,'').replace(/cb-s13-(slot|tray|heads)-\d+/g,'cb-s13-$1-N').replace(/\s+/g,' ');}
test('All 15 stop adapters persist through real Slots storage and a fresh core instance',async()=>{
 const {Slots,resumable}=await import('../../assets/games/community-builders/engine/store.js');
 for(let n=1;n<=15;n++){
  let first=await fullCore(),second;
  try{
   const id=first.core.getAPI().STOPS[n-1].id;await first.core.startStop(id);first.main().querySelector('.cb-btn--go').click();await first.tick();
   if(n===13)await new Promise(r=>setTimeout(r,350));
   for(const selector of partial[n]){first.main().querySelector(selector).click();await first.tick();const d=first.root.querySelector('dialog[open]');if(d){const b=d.querySelector('.cb-btn--go,.cb-btn');if(b)b.click();else d.close();await first.tick();}}
   const before=state(first),slots=new Slots({state:()=>first.core.getState(),storage:first.w.localStorage,target:first.w.document});
   slots.resume(first.core.snapshot());const record=slots.current().resume;assert.equal(resumable(record),true,'Stop '+n+' persisted record is resumable');
   const key=first.core.getState().storageKey,saved={key,value:first.w.localStorage.getItem(key)};first.close();first=null;
   second=await fullCore('en',42,false,saved);const savedPlayer=second.core.getState().store.players[second.core.getState().store.current];
   assert.equal(await second.core.resume(savedPlayer.resume),true,'Stop '+n+' reload resumes');await second.tick();assert.equal(state(second),before,'Stop '+n+' preserves its exact game screen');
  }finally{first?.close();second?.close();}
 }
});
