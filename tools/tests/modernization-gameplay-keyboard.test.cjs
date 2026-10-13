const test = require('node:test'), assert = require('node:assert/strict');
const {fullCore} = require('./modernization-gameplay-fixture.cjs');

for(const lang of ['en','es'])test(`Stop1 ${lang}: deliberate pointer taps process all twelve objects and reach the score`,async()=>{
  const r=await fullCore(lang,42);try{
    let clock=1000;r.w.Date.now=()=>clock;
    await r.core.startStop('notice-the-signs');
    r.main().querySelector('.cb-s01-intro .cb-btn--go').click();
    r.main().querySelector('[data-view="today"]').click();
    const pointer=node=>{
      node.dispatchEvent(new r.w.MouseEvent('pointerdown',{bubbles:true,detail:1}));
      node.dispatchEvent(new r.w.MouseEvent('click',{bubbles:true,detail:1}));
    };
    pointer(r.main().querySelector('[data-spot="0"]'));
    assert.equal(r.core.snapshot().state.found.length,0,'a pointer edge during the screen handoff is intentionally ignored');
    for(let i=0;i<12;i++){
      clock+=400;
      const spot=r.main().querySelector(`[data-spot="${i}"]`);pointer(spot);
      assert.match(spot.className,/is-(found|not)(?:\s|$)/,'each deliberate tap must process its own object');
    }
    const state=r.core.snapshot().state;
    assert.equal(state.found.length,6);assert.equal(state.tapped.length,6);
    clock+=400;pointer(r.main().querySelector('.cb-actions .cb-btn--go'));
    assert.ok(r.main().querySelector('.cb-card__can'),'finding every sign proceeds directly to the result');
  }finally{r.close();}
});

test('Stop1 inline findings accept the next object immediately and count each object once',async()=>{
  const r=await fullCore('en',42);try{
    let clock=1000;r.w.Date.now=()=>clock;
    await r.core.startStop('notice-the-signs');
    r.main().querySelector('.cb-s01-intro .cb-btn--go').click();
    r.main().querySelector('[data-view="today"]').click();
    clock+=400;
    const pointer=node=>{
      node.dispatchEvent(new r.w.MouseEvent('pointerdown',{bubbles:true,detail:1}));
      node.dispatchEvent(new r.w.MouseEvent('click',{bubbles:true,detail:1}));
    };
    pointer(r.main().querySelector('[data-spot="0"]'));
    assert.ok(r.root.querySelector('.cb-callout'));
    pointer(r.main().querySelector('[data-spot="1"]'));
    assert.match(r.main().querySelector('[data-spot="1"]').className,/is-(found|not)(?:\s|$)/);
    const state=r.core.snapshot().state;
    assert.equal(state.found.length+state.tapped.length,2,'dismissal does not swallow the next distinct object');
    pointer(r.main().querySelector('[data-spot="1"]'));
    const repeated=r.core.snapshot().state;
    assert.equal(repeated.found.length+repeated.tapped.length,2,'repeated activation never scores twice');
  }finally{r.close();}
});

test('Stop1 classic finding cards retain pointer protection when a dialog closes',async()=>{
  const r=await fullCore('en',42,false,{key:'pecan-grove-settings',value:JSON.stringify({findCards:true})});try{
    let clock=1000;r.w.Date.now=()=>clock;
    await r.core.startStop('notice-the-signs');
    r.main().querySelector('.cb-s01-intro .cb-btn--go').click();
    r.main().querySelector('[data-view="today"]').click();
    const pointer=node=>{
      node.dispatchEvent(new r.w.MouseEvent('pointerdown',{bubbles:true,detail:1}));
      node.dispatchEvent(new r.w.MouseEvent('click',{bubbles:true,detail:1}));
    };
    clock+=400;pointer(r.main().querySelector('[data-spot="0"]'));
    const dialog=r.root.querySelector('.cb-s01-dlg[open]');assert.ok(dialog);
    clock+=400;pointer(dialog.querySelector('.cb-dlg__foot .cb-btn'));
    assert.equal(dialog.isConnected,false);
    const next=r.main().querySelector('[data-spot="1"]');pointer(next);
    assert.match(next.className,/is-idle/,'a second pointer edge cannot fall through the disappearing modal');
    clock+=400;pointer(next);
    assert.match(next.className,/is-(found|not)(?:\s|$)/,'a deliberate new tap still works');
  }finally{r.close();}
});

test('Stop 2 accepts an immediate keyboard choice while rejecting the second pointer tap', async()=>{
  const r=await fullCore('en',42);try{
    let clock=1000;r.w.Date.now=()=>clock;
    await r.core.startStop('ask-a-good-question');r.main().querySelector('.cb-btn--go').click();
    const tile=r.main().querySelector('.cb-s02-tile[data-row="start"]');assert.ok(tile);
    tile.dispatchEvent(new r.w.MouseEvent('click',{bubbles:true,detail:1}));
    assert.equal(tile.getAttribute('aria-pressed'),'false','a second pointer tap on the newly opened screen is ignored');
    tile.click();
    assert.equal(tile.getAttribute('aria-pressed'),'true','native keyboard/gamepad activation does not wait for the pointer guard');
    assert.equal(r.core.snapshot().state.sel.start,tile.dataset.id);
    clock+=301;tile.dispatchEvent(new r.w.MouseEvent('click',{bubbles:true,detail:1}));
    assert.equal(tile.getAttribute('aria-pressed'),'false','pointer activation works after its deterministic 300ms guard');
  }finally{r.close();}
});

test('Stop 13 permits successive keyboard card and source choices without a delay',async()=>{
  const r=await fullCore('en',42);try{
    await r.core.startStop('spread-the-word-right');r.main().querySelector('.cb-btn--go').click();
    r.main().querySelector('.cb-s13-card').click();
    assert.equal(r.main().querySelectorAll('.cb-s13-slot:not(.is-empty)').length,1);
    r.main().querySelector('[data-s13act="src-0"]').click();
    assert.ok(r.main().querySelector('.cb-s13-sticky'),'the source was added immediately');
  }finally{r.close();}
});

test('Stop 15 permits immediate keyboard placement while its pointer guard is active',async()=>{
  const r=await fullCore('en',42);try{
    await r.core.startStop('build-the-future-together');r.main().querySelector('.cb-btn--go').click();
    const place=r.main().querySelector('.cb-s15-place'),pid=place.dataset.s15Place;place.click();
    assert.ok(r.main().querySelector('.cb-s15-tray'),'the tray opens without a pointer delay');
    const put=r.main().querySelector('[data-s15-put]');assert.ok(put);const id=put.dataset.s15Put;put.click();
    assert.ok(r.main().querySelector('[data-s15-put="'+id+'"]')?.getAttribute('aria-pressed')==='true'||!r.main().querySelector('.cb-s15-tray'),'the selected plan is accepted');
    assert.equal(r.core.snapshot().state.v,2,'the stop uses its native state controller');
    assert.equal(r.core.snapshot().state.plan[pid],id,'the accepted plan choice is available directly for resume');
  }finally{r.close();}
});
