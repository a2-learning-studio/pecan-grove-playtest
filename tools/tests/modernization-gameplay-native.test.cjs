const test=require('node:test'),assert=require('node:assert/strict');
const {fullCore}=require('./modernization-gameplay-fixture.cjs');
const {expose,view,sameView,complete}=require('./modernization-gameplay-flow.cjs');
for(const language of ['en','es'])for(let n=3;n<=15;n++)test(`${language} Stop ${n}: native model restores every phase without an input replay`,async()=>{
 const r=await fullCore(language,42,false,null,{reduced:true,transformStopSource:(source,file)=>Number(file.slice(0,2))===n?expose(n,source):source});
 try{
  await r.core.startStop(r.core.getAPI().STOPS[n-1].id);
  const checkpoints=new Map();
  // A live announcement is transient delivery, not the dialog's authored content.
  const modal=()=>Array.from(r.root.querySelectorAll('dialog[open]')).map(el=>{const copy=el.cloneNode(true);copy.querySelectorAll('.cb-live,.cb-vbtn,.cb-capbar').forEach(node=>node.remove());return copy.textContent.replace(/\s+/g,' ').trim();}).join('\n');
  const capture=()=>{const record=JSON.parse(JSON.stringify(r.core.snapshot()));assert.equal(record.state.v,2);assert.equal(record.state.adapter,undefined);const dialog=record.state.dialog||record.state.neighbor||record.state.confirmingClose||null;const key=String(record.state.phase)+(dialog?':dialog:'+JSON.stringify(dialog):'');checkpoints.set(key,{record,view:view(r),modal:modal()});};
  capture();await complete(r,n,capture);assert.ok(checkpoints.size>=3,'intro, game and result have native states');
  const store=JSON.stringify(r.core.getState().store);
  for(const [phase,checkpoint] of checkpoints){
   assert.equal(await r.core.resume(checkpoint.record),true);await r.tick();
   sameView(view(r),checkpoint.view,'phase '+phase);assert.equal(modal(),checkpoint.modal,'the authored open dialog is restored');
   assert.equal(JSON.stringify(r.core.snapshot().state),JSON.stringify(checkpoint.record.state),'model is restored semantically exactly');
   assert.equal(await r.core.setLanguage(language==='en'?'es':'en'),true);await r.tick();
   assert.equal(JSON.stringify(r.core.snapshot().state),JSON.stringify(checkpoint.record.state),'language changes preserve the native model');
   assert.equal(await r.core.setLanguage(language),true);await r.tick();
   sameView(view(r),checkpoint.view,'bilingual phase '+phase);assert.equal(modal(),checkpoint.modal,'the dialog returns in the original language');
   assert.equal(JSON.stringify(r.core.getState().store),store,'restoring or translating a phase never writes another result');
  }
  assert.equal(r.errors.length,0,String(r.errors));
 }finally{r.close();}
});
