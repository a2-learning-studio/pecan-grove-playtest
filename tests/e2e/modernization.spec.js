const { test, expect } = require('./fixtures');
const AxeBuilder = require('@axe-core/playwright').default;
const {renderedLabelContrast}=require('./contrast-probe.cjs');

const languages = [{lang:'en',file:'index.html'},{lang:'es',file:'espanol.html'}];
async function audit(page) { const result = await new AxeBuilder({page}).analyze(); expect(result.violations).toEqual([]); }
async function startStage(page,file='index.html',seed=42) {
  await page.goto(`/${file}?seed=${seed}`);
  await page.locator('#community-builders').waitFor();
  await expect(page.locator('#community-builders')).toHaveAttribute('data-engine-mounted','true');
  await page.locator('#pt-feedback-save-draft').waitFor({state:'attached'});
  await page.locator('#pt-quiet').check();
  await page.locator('#pt-start').click();
  await expect(page.locator('.cb-hero')).toBeVisible();
}
async function start(page,file='index.html',seed=42) {
  await startStage(page,file,seed);
  await newGame(page);
  await expect(page.locator('.cb-stop[data-stop-n="1"]:visible').first()).toBeVisible();
}
async function newGame(page) {
  const words=await page.evaluate(()=>window.PecanGroveEngine.i18n.messages);
  await page.locator('.cb-engine-title-actions').getByRole('button',{name:words.newGame,exact:true}).click();
  await page.locator('dialog[open] .cb-engine-slot-pick').first().click();
  await expect(page.locator('.cb-world__pan')).toBeVisible();
}
async function stop(page,n) { await page.locator(`.cb-stop[data-stop-n="${n}"]:visible`).first().click(); await expect(page.locator('.cb-board')).toBeVisible(); }
async function primary(page) { return page.locator('.cb-main .cb-btn--go.cb-btn--big').last().click(); }
async function completeStop1(page,check=async()=>{}) {
  await stop(page,1); await check();
  await page.locator('.cb-s01-intro .cb-btn--go').click();
  await page.locator('.cb-s01-view[data-view="today"]').click(); await check();
  for(let i=0;i<12;i++) {
    await page.locator(`.cb-s01-spot[data-spot="${i}"]`).click();
    // The modernization requires inline callouts, not a blocking dialog after each tap.
    await expect(page.locator('dialog[open]')).toHaveCount(0); await check();
  }
  await primary(page); await expect(page.locator('.cb-card__can')).toBeVisible(); await check();
}
async function backToMap(page) { await page.locator('.cb-stophud__back').click(); await expect(page.locator('.cb-stop[data-stop-n="2"]:visible').first()).toBeVisible(); }
async function completeStop2(page,check=async()=>{}) {
  await stop(page,2); await check();
  const first=(await page.locator('.cb-s02-first').innerText()).replace(/^[^:]+:\s*/,'');
  await page.locator('.cb-s02-intro .cb-btn--go').click();
  await expect(page.locator('.cb-s02-nb[data-i="0"] .cb-s02-nb__name')).toHaveText(first); await check();
  for(let round=0;round<4;round++) {
    await check();
    for(const row of ['start','topic','detail']) await page.locator(`.cb-s02-row[data-row="${row}"] .cb-s02-tile`).first().click();
    await page.locator('.cb-s02-ask').click(); await expect(page.locator('[data-s02="answer"]')).toBeVisible(); await check();
    // UI ignores double taps for 400 ms; wait for that intentional guard before advancing.
    await page.waitForTimeout(450);
    await page.locator('.cb-s02-strip.is-done .cb-btn--go').click();
  }
  await expect(page.locator('.cb-card__can')).toBeVisible(); await check();
}

function stableRound(record) {
  // Time, spoken playback position and the focused control can change during a rerender.
  return {v:record.v,mode:record.mode,stopId:record.stopId,slot:record.slot,session:record.session,rng:record.rng,roundSeed:record.roundSeed,state:record.state};
}
async function installGamepad(page) {
  await page.addInitScript(()=>{
    const pad={id:'Pecan Grove test controller',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:16},()=>({pressed:false,touched:false,value:0})),timestamp:0};
    window.__pgTestPad=pad;
    Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[pad]});
  });
}
async function padButton(page,index) {
  await page.evaluate(index=>{const pad=window.__pgTestPad;pad.buttons[index]={pressed:true,touched:true,value:1};pad.timestamp++;},index);
  await page.waitForTimeout(100);
  await page.evaluate(index=>{const pad=window.__pgTestPad;pad.buttons[index]={pressed:false,touched:false,value:0};pad.timestamp++;},index);
  await page.waitForTimeout(50);
}
async function choiceReachable(page) {
  const choice=page.locator('.cb-board button:visible:not(:disabled)').first();
  await expect(choice).toBeVisible();await choice.scrollIntoViewIfNeeded();
  const result=await choice.evaluate(node=>{
    const a=node.getBoundingClientRect(),x=a.left+a.width/2,y=a.top+a.height/2,top=document.elementFromPoint(x,y);
    const occluders=[...document.querySelectorAll('#community-builders *, .pt-toolbar')].filter(other=>{
      if(other===node||node.contains(other)||other.contains(node))return false;
      const style=getComputedStyle(other),b=other.getBoundingClientRect();
      return ['fixed','sticky'].includes(style.position)&&style.visibility!=='hidden'&&style.display!=='none'&&b.width&&b.height&&a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
    }).map(other=>other.className);
    return{hit:!!top&&(node===top||node.contains(top)),occluders,overflow:document.documentElement.scrollWidth>innerWidth+1};
  });
  expect(result.overflow,'The game must fit the viewport width').toBe(false);
  expect(result.occluders,'Sticky/fixed controls must not cover the current choice').toEqual([]);
  expect(result.hit,'The choice center must remain reachable').toBe(true);
}

// These are intentionally named smoke checks. They cover the entry/first play state,
// not every possible answer, result or dialog of Stops 3–15 (see docs/e2e-coverage.md).
for(const {lang,file} of languages) for(let n=1;n<=15;n++) {
  test(`${lang}: all-stop smoke ${String(n).padStart(2,'0')} accessibility, input, calm, restore and language`,async({page,noNetwork})=>{
    test.setTimeout(90000);
    await installGamepad(page);await page.emulateMedia({reducedMotion:'reduce'});await start(page,file);
    await stop(page,n);await audit(page);
    const intro=await page.evaluate(()=>window.CommunityBuilders.snapshot());
    const go=page.locator('.cb-board .cb-btn--go.cb-btn--big').last();
    await expect(go).toBeEnabled();await go.focus();await page.keyboard.press('Enter');await audit(page);
    const record=await page.evaluate(()=>window.CommunityBuilders.snapshot());
    expect(record.stopId).toBe(intro.stopId);expect(record.mode).toBe('stop');expect(record.state).not.toEqual(intro.state);
    const tabStart=page.locator('.cb-board button:visible:not(:disabled)').first();await tabStart.focus();await page.keyboard.press('Tab');
    await expect(tabStart).not.toBeFocused();await page.keyboard.press('Shift+Tab');await expect(tabStart).toBeFocused();
    // Start and B are real polled gamepad edges; selection/completion is not claimed here.
    await padButton(page,9);await expect(page.locator('.cb-pause')).toBeVisible();await audit(page);
    await padButton(page,1);await expect(page.locator('.cb-pause')).toHaveCount(0);
    expect(stableRound(await page.evaluate(()=>window.CommunityBuilders.snapshot()))).toEqual(stableRound(record));
    await page.evaluate(()=>window.PecanGroveEngine.settings.update({calm:true}));
    expect(await page.evaluate(()=>window.PecanGroveEngine.motion.allowed())).toBe(false);
    await page.evaluate(()=>window.PecanGroveEngine.fx.burst(30,30));
    expect(await page.evaluate(()=>window.PecanGroveEngine.fx.pool.length)).toBe(0);
    const moving=await page.locator('#community-builders').evaluate(node=>node.getAnimations({subtree:true}).filter(animation=>animation.playState==='running'&&animation.effect?.getKeyframes().some(frame=>['transform','translate','rotate','scale'].some(key=>frame[key]&&frame[key]!=='none'))).length);
    expect(moving,'Reduced motion must suppress running transform animations').toBe(0);
    for(const viewport of [{width:360,height:640},{width:600,height:500},{width:600,height:800},{width:1280,height:800},{width:1920,height:1080}]) {await page.setViewportSize(viewport);await choiceReachable(page);}
    const alternate=lang==='en'?'es':'en';
    expect(await page.evaluate(language=>window.CommunityBuilders.setLanguage(language),alternate)).toBe(true);
    await expect(page.locator('html')).toHaveAttribute('lang',alternate);
    expect(stableRound(await page.evaluate(()=>window.CommunityBuilders.snapshot()))).toEqual(stableRound(record));
    await audit(page);
    expect(await page.evaluate(language=>window.CommunityBuilders.setLanguage(language),lang)).toBe(true);
    expect(await page.evaluate(record=>window.CommunityBuilders.resume(record),record)).toBe(true);
    expect(stableRound(await page.evaluate(()=>window.CommunityBuilders.snapshot()))).toEqual(stableRound(record));
    // Exercise persistence + the real title Continue button, rather than retaining a
    // test-owned snapshot across reload and calling resume with it.
    await expect.poll(()=>page.evaluate(()=>window.PecanGroveEngine.store.current().resume?.stopId)).toBe(record.stopId);
    await startStage(page,file);
    await page.locator('.cb-engine-title-actions .cb-continue').click();
    await expect.poll(()=>page.evaluate(()=>window.CommunityBuilders.snapshot().stopId)).toBe(record.stopId);
    await expect.poll(async()=>stableRound(await page.evaluate(()=>window.CommunityBuilders.snapshot()))).toEqual(stableRound(record));
    await audit(page);expect(noNetwork.receiverRequests).toHaveLength(0);
  });
  test(`${lang}: @visual Stop ${String(n).padStart(2,'0')} first play screen`,async({page})=>{
    test.skip(process.env.PG_RUN_VISUAL!=='1','Candidate screenshots and Ali’s baseline approval are pending. Set PG_RUN_VISUAL=1 to render/review candidates.');
    await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:1280,height:800});await start(page,file);await stop(page,n);await page.locator('.cb-board .cb-btn--go.cb-btn--big').last().focus();await page.keyboard.press('Enter');
    await expect(page.locator('#community-builders')).toHaveScreenshot(`stop-${String(n).padStart(2,'0')}-${lang}.png`,{animations:'disabled',maxDiffPixelRatio:0.002});
  });
}

for(const {lang,file} of languages) test(`${lang}: Stop2 intro speaker matches first play speaker across twenty seeds`,async({page})=>{
  test.setTimeout(180000);
  await page.addInitScript(()=>{for(const key of Object.keys(localStorage))if(key.startsWith('pecan-grove-journey'))localStorage.removeItem(key);});
  for(let seed=0;seed<20;seed++) {await start(page,file,seed);await stop(page,2);const first=(await page.locator('.cb-s02-first').innerText()).replace(/^[^:]+:\s*/,'');await page.locator('.cb-s02-intro .cb-btn--go').click();await expect(page.locator('.cb-s02-nb[data-i="0"] .cb-s02-nb__name'),`speaker for seed ${seed}`).toHaveText(first);}
});

for(const {lang,file} of languages) {
  test(`${lang}: privacy and complete Stops 1–2 with local drafts`,async({page,noNetwork})=>{
    await start(page,file); await completeStop1(page); await backToMap(page); await completeStop2(page);
    await page.locator('#pt-review-tab').click();
    await page.locator('#pt-feedback-worked').fill('a'.repeat(200)); await page.locator('#pt-feedback-fix').fill('b'.repeat(200));
    await page.locator('#pt-feedback-save-draft').click();
    await expect(page.locator('#pt-feedback-status')).toContainText(lang==='en'?'device':'dispositivo');
    expect(noNetwork.receiverRequests).toHaveLength(0); noNetwork.assertClean(); expect(noNetwork.consoleProblems).toEqual([]);
  });
  test(`${lang}: accessibility on intro, map and every Stops 1–2 screen`,async({page})=>{
    await page.goto(`/${file}?seed=42`); await expect(page.locator('#community-builders')).toHaveAttribute('data-engine-mounted','true'); await audit(page);
    await page.locator('#pt-quiet').check(); await page.locator('#pt-start').click(); await audit(page);
    await newGame(page);await audit(page);
    await completeStop1(page,()=>audit(page)); await backToMap(page); await completeStop2(page,()=>audit(page));
    await page.locator('#pt-review-tab').click(); await audit(page);
  });
  for(const viewport of [{width:360,height:640},{width:600,height:500},{width:600,height:800},{width:1280,height:800},{width:1920,height:1080}]) {
    test(`${lang}: layout ${viewport.width}x${viewport.height} keeps map and Stop2 choices reachable`,async({page})=>{
      await page.setViewportSize(viewport); await start(page,file);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
      await stop(page,2); await page.locator('.cb-s02-intro .cb-btn--go').click();
      for(const row of ['start','topic','detail']) {
        const choice=page.locator(`.cb-s02-row[data-row="${row}"] .cb-s02-tile`).first(); await choice.scrollIntoViewIfNeeded();
        const overlaps=await choice.evaluate(node=>{const a=node.getBoundingClientRect();return [...document.querySelectorAll('.cb-s02-strip,.cb-s02-say,.pt-toolbar')].filter(x=>['sticky','fixed'].includes(getComputedStyle(x).position)).some(x=>{const b=x.getBoundingClientRect();return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;});});
        expect(overlaps,'A sticky/fixed control must not cover the active choice').toBe(false); await choice.click();
      }
      await expect(page.locator('.cb-s02-ask')).toBeEnabled(); expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    });
  }
}

test('seed 42 repeats Stop2 speaker and tile order after a clean reload',async({page})=>{
  async function sample() {await start(page);await stop(page,2);const first=await page.locator('.cb-s02-first').innerText();await page.locator('.cb-s02-intro .cb-btn--go').click();return{first,tiles:await page.locator('.cb-s02-tile').evaluateAll(nodes=>nodes.map(n=>[n.dataset.row,n.dataset.id]))};}
  const first=await sample();const second=await sample();expect(second).toEqual(first);
});
test('language switch mid-stop retains the current step and selected tiles',async({page})=>{
  await start(page);await stop(page,2);await page.locator('.cb-s02-intro .cb-btn--go').click();await page.locator('.cb-s02-row[data-row="topic"] .cb-s02-tile').first().click();
  const selected=await page.locator('.cb-s02-tile[aria-pressed="true"]').getAttribute('data-id');
  await page.locator('.cb-stophud .cb-language[lang="es"]').click();await expect(page.locator('html')).toHaveAttribute('lang','es');await expect(page.locator('.cb-s02-play')).toBeVisible();await expect(page.locator('.cb-s02-tile[aria-pressed="true"]')).toHaveAttribute('data-id',selected);
  await page.locator('#pt-review-tab').click();await expect(page.locator('#pt-feedback-h')).toHaveText('Comentarios de la prueba');await expect(page.locator('#pt-feedback-save-draft')).toHaveText('Guardar borrador en este dispositivo');await expect(page.locator('#pt-feedback-category option[value="art"]')).toHaveText('Imágenes o diseño');
});
test('pause/resume preserves selected choices and native Tab access',async({page})=>{
  await start(page);await stop(page,2);await page.locator('.cb-s02-intro .cb-btn--go').click();await page.locator('.cb-s02-row[data-row="topic"] .cb-s02-tile').first().click();
  const selected=await page.locator('.cb-s02-tile[aria-pressed="true"]').getAttribute('data-id');await page.keyboard.press('Escape');await expect(page.locator('.cb-pause')).toBeVisible();await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');await page.keyboard.press('Escape');await expect(page.locator('.cb-pause')).toHaveCount(0);await expect(page.locator('.cb-s02-tile[aria-pressed="true"]')).toHaveAttribute('data-id',selected);
});
test('docked/floating collapse preserves the single feedback form and keyboard move works',async({page})=>{
  // Floating controls are a desktop layout; narrow viewports intentionally use a modal.
  await page.setViewportSize({width:1280,height:900});await start(page);if(await page.locator('#pt-feedback').isHidden())await page.locator('#pt-feedback-dock-collapse').click();await page.locator('#pt-feedback-fix').fill('Keep this draft when collapsed');await page.locator('#pt-feedback-dock-collapse').click();await expect(page.locator('#pt-feedback')).toBeHidden();await expect(page.locator('#pt-feedback-dock-collapse')).toHaveAttribute('aria-expanded','false');
  await page.locator('#pt-feedback-dock-float').click();await expect(page.locator('#pt-review-dialog')).toHaveClass(/is-floating/);await expect(page.locator('#pt-feedback-fix')).toHaveValue('Keep this draft when collapsed');
  const before=await page.locator('#pt-review-dialog').boundingBox();await page.locator('#pt-review-move').press('ArrowLeft');const after=await page.locator('#pt-review-dialog').boundingBox();expect(after.x).toBeLessThan(before.x);
  await page.locator('#pt-review-collapse').click();await expect(page.locator('#pt-feedback-window')).toBeHidden();await page.locator('#pt-review-collapse').click();await expect(page.locator('#pt-feedback-fix')).toHaveValue('Keep this draft when collapsed');await expect(page.locator('#pt-feedback-form')).toHaveCount(1);
});
test('narrow feedback opens as a modal and preserves its single draft form',async({page})=>{
  await page.setViewportSize({width:360,height:800});await start(page);await page.locator('#pt-review-tab').click();
  await expect(page.locator('#pt-review-dialog')).toBeVisible();await expect(page.locator('#pt-review-dialog')).not.toHaveClass(/is-floating/);
  await page.locator('#pt-feedback-fix').fill('Keep this draft when the narrow review closes');await page.locator('#pt-review-close').click();
  await expect(page.locator('#pt-review-tab')).toBeFocused();await page.locator('#pt-review-tab').click();
  await expect(page.locator('#pt-feedback-fix')).toHaveValue('Keep this draft when the narrow review closes');await expect(page.locator('#pt-feedback-form')).toHaveCount(1);
});
test('frame guard replaces an embedded game with a safe open link',async({page})=>{
  await page.route('**/__frame-test.html',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html lang="en"><title>Frame test</title><iframe title="Game" src="/index.html"></iframe></html>'}));await page.goto('/__frame-test.html');const frame=page.frameLocator('iframe');await expect(frame.getByRole('heading',{name:'Open the game in its own tab'})).toBeVisible();await expect(frame.locator('#community-builders')).toHaveCount(0);await expect(frame.getByRole('link',{name:'Open Pecan Grove'})).toHaveAttribute('rel','noopener');
});

test.describe('explicitly approved feedback transport',()=>{
  test.use({allowFeedback:true});
  test('preview and grown-up hold are required, and only scrubbed submitted entries are sent',async({page,noNetwork})=>{
    await page.route('https://script.google.com/macros/**',async route=>{const body=JSON.parse(route.request().postData());await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,schemaVersion:1,acknowledged:body.entries.map(e=>({sessionId:e.sessionId,entryId:e.entryId,revision:e.revision}))})});});
    await start(page);await page.locator('#pt-review-tab').click();await page.locator('#pt-feedback-fix').fill('Email ana@x.com or call 555-123-4567');await page.locator('#pt-feedback-submit').click();await expect(page.locator('#pt-feedback-preview')).toBeVisible();await expect(page.locator('#pt-feedback-preview-text')).not.toContainText('ana@x.com');expect(noNetwork.receiverRequests).toHaveLength(0);
    await page.locator('#pt-feedback-send').focus();const sent=page.waitForRequest(request=>request.url().includes('/macros/'));await page.keyboard.down('Enter');const request=await sent;await page.keyboard.up('Enter');
    const body=JSON.parse(request.postData());expect(JSON.stringify(body)).not.toMatch(/ana@x\.com|555-123-4567/);expect(body.entries.every(e=>e.submitted===true)).toBe(true);await expect(page.locator('#pt-feedback-status')).toContainText('received');expect(noNetwork.receiverRequests).toHaveLength(1);
  });
});

test('family flavor has no feedback or endpoint',async({page,noNetwork})=>{
  test.skip(!process.env.PG_FAMILY_BASE_URL,'Set PG_FAMILY_BASE_URL to run the separately built family flavor. Structural family tests always run in Python.');
  await page.goto(process.env.PG_FAMILY_BASE_URL);await expect(page.locator('html')).toHaveAttribute('data-flavor','family');await expect(page.locator('#pt-feedback')).toHaveCount(0);await expect(page.locator('#pt-review-tab')).toHaveCount(0);expect(await page.content()).not.toContain('script.google.com');expect(noNetwork.receiverRequests).toHaveLength(0);
});

for(const {lang,file} of languages) for(const completed of [1,2,15]) {
 test(`${lang}: map fit and labels stay clear after ${completed} completed stops`,async({page,noNetwork})=>{
  test.setTimeout(90000);await start(page,file);await page.evaluate(count=>{const core=window.CommunityBuilders,state=core.getState(),player=state.store.players[state.store.current];core.getAPI().STOPS.slice(0,count).forEach(stop=>{player.stops[stop.id]={best:90,rounds:1};});core.updateSettings({calm:true});core.showMap();},completed);
  for(const width of [360,414,600,768,900,1280,1600]) {
   await page.setViewportSize({width,height:900});await page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
   const result=await page.locator('.cb-world__pan').evaluate(pan=>{
    const canvas=pan.querySelector('.cb-world__canvas'),bounds=pan.getBoundingClientRect(),buttons=[...canvas.querySelectorAll('.cb-stop')],discs=buttons.map(button=>button.querySelector('.cb-stop__disc').getBoundingClientRect());
    const overlaps=(a,b)=>a.left<b.right-.5&&a.right>b.left+.5&&a.top<b.bottom-.5&&a.bottom>b.top+.5;
    const labels=[];buttons.forEach((button,index)=>{for(const node of button.querySelectorAll('.cb-tag,.cb-stop__plate')){const style=getComputedStyle(node),box=node.getBoundingClientRect();if(node.hidden||style.visibility==='hidden'||Number(style.opacity)===0||!box.width||!box.height)continue;for(let j=0;j<discs.length;j++)if(j!==index&&overlaps(box,discs[j]))labels.push({stop:index+1,other:j+1,label:node.className});}});
    return{count:discs.length,scroll:pan.scrollWidth>pan.clientWidth+1,outside:discs.map((box,index)=>({box,index})).filter(({box})=>box.width<43.9||box.height<43.9||box.left<bounds.left-.5||box.right>bounds.right+.5||box.top<bounds.top-.5||box.bottom>bounds.bottom+.5).map(({index})=>index+1),labels};
   });
   expect(result.count).toBe(15);expect(result.scroll,`${width}px horizontal map overflow`).toBe(false);expect(result.outside,`${width}px clipped or undersized discs`).toEqual([]);expect(result.labels,`${width}px labels cover a different disc`).toEqual([]);
  }
  noNetwork.assertClean();
 });
}

for(const {lang,file}of languages)test(`${lang}: rendered map and Stop1/2 label contrast`,async({page})=>{
 test.setTimeout(120000);await start(page,file);await page.evaluate(()=>window.PecanGroveEngine.settings.update({calm:true}));
 async function probe(selector){const labels=await renderedLabelContrast(page,selector);expect(labels.length,`Visible labels for ${selector}`).toBeGreaterThan(0);for(const label of labels)expect(label.ratio,`${label.text}: rendered contrast`).toBeGreaterThanOrEqual(4.5);}
 await page.locator('.cb-stop[data-stop-n="1"]').first().focus();await probe('.cb-stop__plate');
 await stop(page,1);await page.locator('.cb-s01-intro .cb-btn--go').click();await page.locator('.cb-s01-view[data-view="today"]').click();await probe('.cb-s01-tag');
 for(const index of [0,5,10]){await page.locator(`.cb-s01-spot[data-spot="${index}"]`).click();await page.locator('.cb-callout .cb-btn').click();await probe('.cb-s01-tag');}
 await page.evaluate(()=>window.CommunityBuilders.showMap());await stop(page,2);await probe('.cb-s02-nb__name');await page.locator('.cb-s02-intro .cb-btn--go').click();await probe('.cb-s02-nb__name');
 for(const viewport of [{width:360,height:640},{width:600,height:500}]){await page.setViewportSize(viewport);await probe('.cb-s02-nb__name');}
});
