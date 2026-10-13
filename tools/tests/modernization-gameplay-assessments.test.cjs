const test=require('node:test'),assert=require('node:assert/strict');
const {fullCore}=require('./modernization-gameplay-fixture.cjs');
const {expose,view,sameView}=require('./modernization-gameplay-flow.cjs');

async function roundTrip(r,language){
 const record=JSON.parse(JSON.stringify(r.core.snapshot())),before=view(r),store=JSON.stringify(r.core.getState().store);
 assert.equal(record.state.v,2);assert.equal(record.state.adapter,undefined);
 assert.equal(await r.core.resume(record),true);await r.tick();sameView(view(r),before,'assessment restore');
 assert.equal(JSON.stringify(r.core.snapshot().state),JSON.stringify(record.state),'attempts and assessment fields survive restore');
 assert.equal(await r.core.setLanguage(language==='en'?'es':'en'),true);await r.tick();
 assert.equal(JSON.stringify(r.core.snapshot().state),JSON.stringify(record.state),'assessment survives translation');
 assert.equal(await r.core.setLanguage(language),true);await r.tick();sameView(view(r),before,'assessment bilingual round trip');
 assert.equal(JSON.stringify(r.core.getState().store),store,'an unfinished assessment does not write a result');
 assert.equal(r.errors.length,0,String(r.errors));
}

for(const language of ['en','es'])for(const n of [9,10,11,14])test(`${language} Stop ${n}: an incorrect authored choice retains its assessment on restore and translation`,async()=>{
 const r=await fullCore(language,42,false,null,{reduced:true,transformStopSource:(source,file)=>Number(file.slice(0,2))===n?expose(n,source):source});
 try{
  await r.core.startStop(r.core.getAPI().STOPS[n-1].id);
  const q=selector=>r.main().querySelector(selector),all=selector=>Array.from(r.main().querySelectorAll(selector));
  const click=async el=>{assert.ok(el,'authored control exists');assert.equal(el.disabled,false);el.click();await r.tick();};
  await click(q('.cb-btn--go'));const flow=r.w.__stopTestFlow;
  if(n===9){
   await click(q('[data-s09-chair="0"]'));
   const wrong=all('[data-s09-way]').find(el=>!flow.seats[0].p.helps.includes(el.dataset.s09Way));
   await click(wrong);assert.equal(r.core.snapshot().state.seats[0].tries.length,1);assert.equal(r.core.snapshot().state.seats[0].fill,null);
   await roundTrip(r,language);
   const tried=r.core.snapshot().state.seats[0].tries;
   await click(all('[data-s09-way]').find(el=>!flow.seats[0].p.helps.includes(el.dataset.s09Way)&&!tried.includes(el.dataset.s09Way)));
   assert.equal(r.core.snapshot().state.seats[0].result,'shown');assert.equal(r.core.snapshot().state.seats[0].tries.length,2);
  }else if(n===10){
   const code=flow.round.probs[0],wrong=flow.round.probs.find(value=>value!==code);
   await click(q(`[data-p="${code}"]`));await click(q(`[data-f="${wrong}"]`));await click(q('[data-b="link"]'));
   assert.deepEqual(Array.from(r.core.snapshot().state.state[code].misses),[wrong]);assert.equal(r.core.snapshot().state.fbk.kind,'miss');
   await roundTrip(r,language);
   const next=flow.round.probs.find(value=>value!==code&&value!==wrong);
   await click(q(`[data-f="${next}"]`));await click(q('[data-b="link"]'));
   assert.equal(r.core.snapshot().state.state[code].by,'game');assert.equal(r.core.snapshot().state.fbk.kind,'shown');assert.ok(r.root.querySelector('dialog[open]'));
  }else if(n===11){
   for(const id of flow.order)await click(q(`[data-path="${id}"]`));await click(q('.cb-s11-choose'));
   const wrong=all('[data-nb]').find(el=>!flow.rightNbs(0).includes(el.dataset.nb));await click(wrong);
   assert.equal(r.core.snapshot().state.hadFeedback,true);
  }else{
   const item=flow.items[0],wrong=all('[data-clue]').find(el=>item.state==='none'||el.dataset.clue!==item.p.clue);
   await click(wrong);await click(all('button[data-st]').find(el=>el.dataset.st!==item.truth));
   assert.equal(r.core.snapshot().state.items[0].clueOK,false);assert.equal(r.core.snapshot().state.items[0].stOK,false);
  }
  await roundTrip(r,language);
 }finally{r.close();}
});
