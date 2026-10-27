const test = require('node:test'), assert = require('node:assert/strict');
const {fullCore} = require('./modernization-gameplay-fixture.cjs');

for(const lang of ['en','es'])test(`${lang}: language buttons are named by their visible EN/ES label first (WCAG 2.5.3)`,async()=>{
  const r=await fullCore(lang,42);try{
    await r.core.startStop('notice-the-signs');
    const buttons=[...r.root.querySelectorAll('.cb-language')];
    assert.ok(buttons.length>0);
    for(const button of buttons)assert.ok(button.getAttribute('aria-label').startsWith(button.textContent.trim()),`${button.getAttribute('aria-label')} starts with ${button.textContent}`);
  }finally{r.close();}
});

test('Stop 13 poster slots keep list semantics and group each card inside its list item (WCAG 1.3.1)',async()=>{
  const r=await fullCore('en',42);try{
    await r.core.startStop('spread-the-word-right');r.main().querySelector('.cb-btn--go').click();
    r.main().querySelector('.cb-s13-card').click();
    const slots=[...r.main().querySelectorAll('.cb-s13-slots > li')];
    assert.equal(slots.length,3);
    for(const slot of slots)assert.equal(slot.getAttribute('role'),null,'a slot stays a list item');
    const group=r.main().querySelector('.cb-s13-slot:not(.is-empty) > [role="group"]');
    assert.ok(group,'the filled slot names a group for its card and actions');
    assert.match(r.w.document.getElementById(group.getAttribute('aria-labelledby')).textContent,/^Slot 1 of 3$/);
  }finally{r.close();}
});

test('the Library / Class mode choice made before Start uses the in-game quiet routine: no voice and classic find cards',async()=>{
  const r=await fullCore('en',42);try{
    r.core.enterPlay({quiet:true});
    assert.equal(r.core.getAPI().prefersFindCards(),true,'findings open as persistent centred cards');
    assert.equal(JSON.parse(r.w.localStorage.getItem('pecan-grove-settings')||'{}').voice,false);
  }finally{r.close();}
});

test('forced colors keep the selected language label visible: no Canvas backplate behind HighlightText',()=>{
  const css=require('node:fs').readFileSync(require('node:path').join(__dirname,'../../assets/games/community-builders/engine/presentation.css'),'utf8');
  const forced=css.slice(css.indexOf('@media (forced-colors: active)'));
  const rule=forced.slice(forced.indexOf('.cb-language-group .cb-btn[aria-pressed="true"]'));
  const body=rule.slice(rule.indexOf('{')+1,rule.indexOf('}'));
  assert.match(body,/forced-color-adjust:\s*none/);
  assert.match(body,/background:\s*Highlight/);assert.match(body,/color:\s*HighlightText/);
});
