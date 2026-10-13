const test = require('node:test'), assert = require('node:assert/strict');
const { fullCore } = require('./modernization-gameplay-fixture.cjs');
const { expose, view, sameView, complete } = require('./modernization-gameplay-flow.cjs');
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
