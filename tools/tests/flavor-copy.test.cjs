const test = require('node:test'), assert = require('node:assert/strict');
const {fullCore} = require('./modernization-gameplay-fixture.cjs');

for(const flavor of ['family','library'])for(const lang of ['en','es'])test(`${flavor} ${lang}: For grown-ups promises no Send and offers no score sharing`,async()=>{
  const r=await fullCore(lang,42);try{
    r.w.document.documentElement.setAttribute('data-flavor',flavor);
    // A library copy still loads the local feedback module; it must not offer sharing.
    r.w.PecanGroveFeedback={getConsent:()=>({scores:false,autoScores:false}),setConsent(){}};
    r.core.openGrownups(null);
    const dialog=r.root.querySelector('dialog[open]'),W=r.core.getAPI().W;
    assert.ok(dialog.textContent.includes(W.grownTextLocal));
    assert.ok(!dialog.textContent.includes(W.grownText),'no promise about Send or score sharing');
    assert.equal(dialog.querySelector('[data-pg-consent]'),null);
  }finally{r.close();}
});

test('the playtest For grown-ups dialog keeps its sharing choices',async()=>{
  const r=await fullCore('en',42);try{
    r.w.document.documentElement.setAttribute('data-flavor','playtest');
    r.w.PecanGroveFeedback={getConsent:()=>({scores:false,autoScores:false}),setConsent(){}};
    r.core.openGrownups(null);
    const dialog=r.root.querySelector('dialog[open]'),W=r.core.getAPI().W;
    assert.ok(dialog.textContent.includes(W.grownText));
    assert.ok(dialog.querySelector('[data-pg-consent="scores"]'));
  }finally{r.close();}
});
