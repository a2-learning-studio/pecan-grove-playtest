const test=require('node:test'),assert=require('node:assert/strict');
const {fullCore}=require('./modernization-gameplay-fixture.cjs');
const clone=value=>JSON.parse(JSON.stringify(value));
for(const language of ['en','es'])for(const revised of [false,true])test(`Stop 2 ${language}: ${revised?'revised':'first'} answered state restores without changing its original assessment`,async()=>{
  const r=await fullCore(language,42);try{
    await r.core.startStop('ask-a-good-question');r.main().querySelector('.cb-btn--go').click();
    r.main().querySelector('.cb-s02-tile[data-row="start"][data-id="will"]').click();
    r.main().querySelector('.cb-s02-tile[data-row="topic"]').click();r.main().querySelector('.cb-s02-ask').click();
    const first=clone(r.core.snapshot().state.answers[0]);assert.equal(first.fixed,undefined);assert.equal(first.r.sOk,false);
    if(revised){
      r.main().querySelector('.cb-s02-strip.is-done .cb-btn--quiet').click();
      r.main().querySelector('.cb-s02-tile[data-row="start"][data-id="how"]').click();r.main().querySelector('.cb-s02-ask').click();
      const answer=r.core.snapshot().state.answers[0];assert.ok(answer.fixed);assert.equal(answer.fixed.sOk,true);assert.equal(answer.pts,first.pts);assert.deepEqual(clone(answer.r),first.r);
    }
    const record=clone(r.core.snapshot()),state=clone(record.state),saved=JSON.stringify(r.core.getState().store);
    assert.equal(state.screenKey,'answer');assert.equal(await r.core.resume(record),true);
    assert.deepEqual(clone(r.core.snapshot().state),state,'rendering a saved answer must not mark it revised or rejudge its original score');
    assert.ok(r.main().querySelector('[data-s02="answer"]'));
    assert.equal(await r.core.setLanguage(language==='en'?'es':'en'),true);
    assert.equal(await r.core.setLanguage(language),true);
    assert.deepEqual(clone(r.core.snapshot().state),state,'a bilingual round trip preserves the same answer assessment');
    assert.equal(JSON.stringify(r.core.getState().store),saved);assert.equal(r.errors.length,0,String(r.errors));
  }finally{r.close();}
});
