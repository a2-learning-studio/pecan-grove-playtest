const { test, expect } = require('./fixtures');
const { isReceiver } = require('./network-policy.cjs');
const AxeBuilder = require('@axe-core/playwright').default;
const {renderedLabelContrast}=require('./contrast-probe.cjs');
const {settleFiniteAnimations,accessibilityDiagnostics}=require('./settle-animations.cjs');
const readiness=import('../../tools/performance-checks.mjs');

const languages = [{lang:'en',file:'index.html'},{lang:'es',file:'espanol.html'}];
async function waitStageReady(page,mode) {
  const {stageReady}=await readiness;
  await expect.poll(()=>page.evaluate(stageReady,{mode}),`The ${mode} scene must finish its real loading and layout work`).toBe(true);
}
async function audit(page) {
  const mode=await page.evaluate(()=>window.CommunityBuilders.getState().mode);
  await waitStageReady(page,mode);
  await settleFiniteAnimations(page,expect);
  const result = await new AxeBuilder({page}).analyze();
  const diagnostics = result.violations.length ? await accessibilityDiagnostics(page,result.violations) : [];
  expect(result.violations,`Accessibility violations; rendered context: ${JSON.stringify(diagnostics)}`).toEqual([]);
}
async function startStage(page,file='index.html',seed=42) {
  await page.goto(`/${file}?seed=${seed}`);
  // The team intro intentionally keeps the mounted game hidden until Start.
  await page.locator('#community-builders').waitFor({state:'attached'});
  await expect(page.locator('#community-builders')).toHaveAttribute('data-engine-mounted','true');
  await page.locator('#pt-feedback-save-draft').waitFor({state:'attached'});
  await page.locator('#pt-quiet').check();
  await page.locator('#pt-start').click();
  await expect(page.locator('.cb-hero')).toBeVisible();
  // Library / Class mode also chooses classic find cards. These journeys keep
  // the default inline findings; the Library case has its own test below.
  await page.evaluate(()=>window.PecanGroveEngine.settings.update({findCards:false}));
  await waitStageReady(page,'title');
  await leaveNativeFullscreen(page);
}
// Start still exercises native fullscreen. Return the browser to its normal
// window before viewport sweeps (Chromium cannot resize a fullscreen window) and
// before pressing Escape: Firefox and Safari keep that first Escape to leave
// fullscreen, so the page never sees it. The game's expanded view must remain
// open after that native exit.
async function leaveNativeFullscreen(page) {
  await page.evaluate(async()=>{
    const exit=document.exitFullscreen||document.webkitExitFullscreen;
    if((document.fullscreenElement||document.webkitFullscreenElement)&&exit)await exit.call(document);
  });
  await expect.poll(()=>page.evaluate(()=>!!(document.fullscreenElement||document.webkitFullscreenElement))).toBe(false);
  await expect(page.locator('#pt-stage')).toHaveClass(/is-expanded/);
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
  await waitStageReady(page,'map');
}
async function stop(page,n) { await page.locator(`.cb-stop[data-stop-n="${n}"]:visible`).first().click(); await expect(page.locator('.cb-board')).toBeVisible(); await waitStageReady(page,'stop'); }
async function primary(page) { return page.locator('.cb-main .cb-btn--go.cb-btn--big').last().click(); }
async function startStop1Today(page) {
  await page.locator('.cb-s01-intro .cb-btn--go').click();
  // The introductory transition deliberately guards rapid pointer taps for
  // 350 ms. Start the next deliberate action after that guard has elapsed.
  await page.waitForTimeout(400);
  const today=page.locator('.cb-s01-view[data-view="today"]');
  await today.click();
  await expect(today).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('.cb-s01-scene')).not.toHaveClass(/is-past/);
}
async function completeStop1(page,check=async()=>{}) {
  await stop(page,1); await check();
  await startStop1Today(page); await check();
  await findStop1Items(page,0,12,check);await finishStop1(page,check);
}
async function findStop1Items(page,first,end,check=async()=>{}) {
  for(let i=first;i<end;i++) {
    // Pointer actions have a 350 ms double-tap guard. Let each deliberate tap
    // finish, then prove this particular object was actually processed.
    await page.waitForTimeout(400);
    const spot=page.locator(`.cb-s01-spot[data-spot="${i}"]`);
    await spot.click(); await expect(spot).toHaveClass(/is-(found|not)(?:\s|$)/);
    // The modernization requires inline callouts, not a blocking dialog after each tap.
    await expect(page.locator('dialog[open]')).toHaveCount(0); await check();
  }
}
async function finishStop1(page,check=async()=>{}) {
  await page.waitForTimeout(400);
  await primary(page); await expect(page.locator('.cb-card__can')).toBeVisible(); await check();
}
async function backToMap(page) { await page.locator('.cb-stophud__back').click(); await expect(page.locator('.cb-stop[data-stop-n="2"]:visible').first()).toBeVisible(); }
async function completeStop2(page,check=async()=>{}) {
  await beginStop2(page,check);await answerStop2Rounds(page,4,check);
  await expect(page.locator('.cb-card__can')).toBeVisible(); await check();
}
async function beginStop2(page,check=async()=>{}) {
  await stop(page,2); await check();
  const first=(await page.locator('.cb-s02-first').innerText()).replace(/^[^:]+:\s*/,'');
  await page.locator('.cb-s02-intro .cb-btn--go').click();
  await expect(page.locator('.cb-s02-nb[data-i="0"] .cb-s02-nb__name')).toHaveText(first); await check();
}
async function answerStop2Rounds(page,count,check=async()=>{}) {
  for(let round=0;round<count;round++) {
    await check();
    for(const row of ['start','topic','detail']) await page.locator(`.cb-s02-row[data-row="${row}"] .cb-s02-tile`).first().click();
    await page.locator('.cb-s02-ask').click(); await expect(page.locator('[data-s02="answer"]')).toBeVisible(); await check();
    // UI ignores double taps for 400 ms; wait for that intentional guard before advancing.
    await page.waitForTimeout(450);
    await page.locator('.cb-s02-strip.is-done .cb-btn--go').click();
  }
}

async function assertLocalOnly(page,noNetwork){const consent=await page.evaluate(()=>window.PecanGroveFeedback.getConsent());expect(consent.scores).toBe(false);expect(consent.autoScores).toBe(false);expect(noNetwork.receiverRequests).toHaveLength(0);noNetwork.assertClean();expect(noNetwork.consoleProblems).toEqual([]);}
async function saveReferenceDraft(page,lang){
  await page.locator('#pt-review-tab').click();await page.locator('#pt-feedback-worked').fill('a'.repeat(200));await page.locator('#pt-feedback-fix').fill('b'.repeat(200));await page.locator('#pt-feedback-save-draft').click();await expect(page.locator('#pt-feedback-status')).toContainText(lang==='en'?'device':'dispositivo');await page.locator('#pt-review-close').click();
}
async function captureJourneyCheckpoint(page,completedStop=null){
  const snapshot=await page.evaluate(()=>window.CommunityBuilders.snapshot());
  // Observe real autosave. Never manufacture progress or invoke save/resume to
  // make a missing checkpoint appear; a production autosave gap must fail here.
  await expect.poll(async()=>{
    const saved=await page.evaluate(()=>{const state=window.CommunityBuilders.getState(),stored=JSON.parse(localStorage.getItem(state.storageKey)||'null');return stored?.players?.[state.store.current]?.resume||null;});
    return completedStop?saved:stableRound(saved||{});
  },'Actual persisted journey must match the pointer-played checkpoint').toEqual(completedStop?null:stableRound(snapshot));
  const checkpoint=await page.evaluate(()=>{
    const core=window.CommunityBuilders,state=core.getState(),feedback=window.PecanGroveFeedback;
    const stored=JSON.parse(localStorage.getItem(state.storageKey)||'null');
    return{origin:location.origin,entries:Object.entries(localStorage),snapshot:core.snapshot(),player:state.store.current,playerStops:stored?.players?.[state.store.current]?.stops,session:feedback.model.active(),consent:feedback.getConsent(),drafts:feedback.model.entries().filter(entry=>entry.worked||entry.fix).map(entry=>({sessionId:entry.sessionId,entryId:entry.entryId,worked:entry.worked,fix:entry.fix}))};
  });
  expect(checkpoint.playerStops,'The checkpoint must come from real persisted storage').toBeTruthy();
  if(completedStop)expect(checkpoint.playerStops[completedStop],'The completed stop must be genuinely earned').toBeTruthy();
  expect(checkpoint.consent.scores).toBe(false);expect(checkpoint.consent.autoScores).toBe(false);
  return{...checkpoint,completed:!!completedStop};
}
async function continueJourneyCheckpoint(page,file,checkpoint){
  expect(checkpoint,'A real earlier pointer-played checkpoint is required; absent checkpoints are failures').toBeTruthy();
  await page.addInitScript(checkpoint=>{if(location.origin===checkpoint.origin)for(const [key,value]of checkpoint.entries)localStorage.setItem(key,value);},checkpoint);
  await startStage(page,file);await page.locator('.cb-engine-title-actions .cb-continue').click();
  await waitStageReady(page,checkpoint.completed?'map':'stop');
  // The game ignores a click within 350 ms of the click that changed the scene, at the same spot (a touch ghost
  // click). Continue now sits right under the title, where the map shows the next stop, so wait that window out.
  await page.waitForTimeout(400);
  const restored=await page.evaluate(()=>{const core=window.CommunityBuilders,state=core.getState(),feedback=window.PecanGroveFeedback;return{snapshot:core.snapshot(),player:state.store.current,playerStops:state.store.players[state.store.current].stops,session:feedback.model.active(),consent:feedback.getConsent(),drafts:feedback.model.entries()};});
  expect(restored.player).toBe(checkpoint.player);expect(restored.session).toBe(checkpoint.session);expect(restored.playerStops).toEqual(checkpoint.playerStops);expect(restored.consent.scores).toBe(false);expect(restored.consent.autoScores).toBe(false);
  if(!checkpoint.completed)expect(stableRound(restored.snapshot)).toEqual(stableRound(checkpoint.snapshot));
  for(const draft of checkpoint.drafts){const retained=restored.drafts.find(entry=>entry.sessionId===draft.sessionId&&entry.entryId===draft.entryId);expect(retained,'Saved feedback must stay with the same anonymous player').toBeTruthy();expect(retained.worked).toBe(draft.worked);expect(retained.fix).toBe(draft.fix);}
}

function stableRound(record) {
  // Time, spoken playback position and the focused control can change during a rerender.
  return {v:record.v,mode:record.mode,stopId:record.stopId,slot:record.slot,session:record.session,rng:record.rng,roundSeed:record.roundSeed,state:record.state};
}
async function installGamepad(page) {
  await page.addInitScript(()=>{
    const pad={id:'Pecan Grove test controller',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:16},()=>({pressed:false,touched:false,value:0})),timestamp:0};
    window.__pgTestPad=pad;
    window.__pgPadReads=0;
    Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>{window.__pgPadReads++;return[pad];}});
  });
}
async function padButton(page,index) {
  const pressedAt=await page.evaluate(index=>{const pad=window.__pgTestPad;pad.buttons[index]={pressed:true,touched:true,value:1};pad.timestamp++;return window.__pgPadReads;},index);
  // Keep the synthetic physical edge down until the real RAF poll has sampled
  // it; a fixed100ms pulse may fall entirely between slow CI WebKit frames.
  await expect.poll(()=>page.evaluate(()=>window.__pgPadReads),'The real gamepad poll must sample the pressed edge').toBeGreaterThan(pressedAt);
  const releasedAt=await page.evaluate(index=>{const pad=window.__pgTestPad;pad.buttons[index]={pressed:false,touched:false,value:0};pad.timestamp++;return window.__pgPadReads;},index);
  await expect.poll(()=>page.evaluate(()=>window.__pgPadReads),'The real gamepad poll must sample the released edge').toBeGreaterThan(releasedAt);
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
    const rect=box=>({x:box.x,y:box.y,width:box.width,height:box.height,top:box.top,right:box.right,bottom:box.bottom,left:box.left});
    const element=other=>other?{tag:other.tagName,id:other.id,className:typeof other.className==='string'?other.className:other.className?.baseVal,text:other.textContent?.trim().slice(0,160),rect:rect(other.getBoundingClientRect())}:null;
    return{hit:!!top&&(node===top||node.contains(top)),occluders,overflow:document.documentElement.scrollWidth>innerWidth+1,choice:element(node),top:element(top),center:{x,y},viewport:{width:innerWidth,height:innerHeight,visualWidth:visualViewport?.width,visualHeight:visualViewport?.height,scrollX,scrollY,fullscreen:(document.fullscreenElement||document.webkitFullscreenElement)?.id||null}};
  });
  const evidence=JSON.stringify(result);
  expect(result.overflow,`The game must fit the viewport width: ${evidence}`).toBe(false);
  expect(result.occluders,`Sticky/fixed controls must not cover the current choice: ${evidence}`).toEqual([]);
  expect(result.hit,`The choice center must remain reachable: ${evidence}`).toBe(true);
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

// All twenty seeds remain covered. Five-seed groups keep finite repeated
// navigation work inside the unchanged per-case budget on slow CI WebKit.
for(const {lang,file} of languages) for(const firstSeed of [0,5,10,15]) test(`${lang}: Stop2 intro speaker matches first play speaker, seeds ${firstSeed}-${firstSeed+4}`,async({page})=>{
  test.setTimeout(180000);
  await page.addInitScript(()=>{for(const key of Object.keys(localStorage))if(key.startsWith('pecan-grove-journey'))localStorage.removeItem(key);});
  for(let seed=firstSeed;seed<firstSeed+5;seed++) {await start(page,file,seed);await stop(page,2);const first=(await page.locator('.cb-s02-first').innerText()).replace(/^[^:]+:\s*/,'');await page.locator('.cb-s02-intro .cb-btn--go').click();await expect(page.locator('.cb-s02-nb[data-i="0"] .cb-s02-nb__name'),`speaker for seed ${seed}`).toHaveText(first);}
});

for(const {lang,file} of languages) {
  // 8d2 WebKit ES advances all twelve objects: item5 ends at33.098s,
  // item11 at44.366s and Finish starts44.823s against the unchanged45s cap.
  // Its retry finishes at42.694s and reaches Save draft at44.792s. Preserve
  // that real work in bounded phases; capture only genuinely durable progress.
  test.describe.serial(`${lang}: private persisted reference journey`,()=>{
    let checkpoint;
    // Desktop WebKit (Desktop Safari: 1280x720 at device scale 2) is much slower here than every other project,
    // and two of these cases outgrow the shared 45 s cap on the CI runner. Nothing hangs: the traces show steady
    // progress, each click slow because Playwright waits for the element to hold still across frames.
    // A local probe of this profile measured the title and map, whose looping decorations keep repainting, at
    // about 0.6 s a frame (26 ms at device scale 1, 17 ms in Chromium); Stop 1 itself idles at full rate.
    // CI durations of the Stop 2 case: 44.7 s and 42.7 s (run 1), 44.2 s es and an en timeout at 46.7 s (run 2)
    // whose trace ends on its last click, Review close, at 45.2 s. The Stop 1 case timed out on its first try in
    // both runs (49.8 s, 49.1 s; in run 2 beside the five-seed Stop 2 case): intro button 7.7 s to settle,
    // findings 0-3 0.6-3.3 s each, finding 4 started 0.5 s before the cap. Its retries pass in 37-39 s. The same
    // cases in run 2 took 20-27 s on iPhone and 6-9 s in Chromium and Firefox. 90 s is about 1.7 times the
    // slowest projected need (about 52 s) and applies to desktop WebKit only; the other projects keep 45 s.
    const desktopWebKitBudget=testInfo=>{if(testInfo.project.name==='webkit')test.setTimeout(90000);};
    test('Stop1 intro, Today and pointer findings0-5',async({page,noNetwork},testInfo)=>{
      desktopWebKitBudget(testInfo);
      checkpoint=null;await start(page,file);await stop(page,1);await startStop1Today(page);await findStop1Items(page,0,6);
      checkpoint=await captureJourneyCheckpoint(page);expect([...checkpoint.snapshot.state.found,...checkpoint.snapshot.state.tapped]).toHaveLength(6);await assertLocalOnly(page,noNetwork);
    });
    test('Continue Stop1 pointer findings6-11, result and local draft',async({page,noNetwork})=>{
      await continueJourneyCheckpoint(page,file,checkpoint);await findStop1Items(page,6,12);await finishStop1(page);await saveReferenceDraft(page,lang);await backToMap(page);checkpoint=await captureJourneyCheckpoint(page,'notice-the-signs');await assertLocalOnly(page,noNetwork);
    });
    test('Continue to Stop2 pointer completion and retained local drafts',async({page,noNetwork},testInfo)=>{
      desktopWebKitBudget(testInfo);
      await continueJourneyCheckpoint(page,file,checkpoint);await completeStop2(page);await saveReferenceDraft(page,lang);await assertLocalOnly(page,noNetwork);
    });
  });
  // f745 Pixel trace reached Stop2's second answer at44s after auditing the
  // complete Stop1 route; the global45s cap, not the1.25s animation, expired.
  // Preserve the same audits and real journey in bounded scene cases.
  test(`${lang}: accessibility on intro, title and map`,async({page})=>{
    await page.goto(`/${file}?seed=42`); await expect(page.locator('#community-builders')).toHaveAttribute('data-engine-mounted','true'); await audit(page);
    await page.locator('#pt-quiet').check(); await page.locator('#pt-start').click(); await audit(page);
    await newGame(page);await audit(page);
  });
  // WebKit's original trace spent~3s per finding audit and reached item8 at44s.
  // Serial groups stay on one shard and retry from the beginning, recapturing
  // every checkpoint from real actions. Each case still gets a fresh context.
  test.describe.serial(`${lang}: accessible persisted reference journey`,()=>{
    let checkpoint;
    // 8d2 WebKit ES advances through item5 at41.365s and starts its final
    // axe.finishRun at44.859s. Bound that real audit work with another actual
    // partial checkpoint instead of dropping a screen audit or raising45s.
    test('Stop1 intro, Today and findings0-2',async({page,noNetwork})=>{
      checkpoint=null;await start(page,file);await stop(page,1);await audit(page);await startStop1Today(page);await audit(page);await findStop1Items(page,0,3,()=>audit(page));checkpoint=await captureJourneyCheckpoint(page);expect([...checkpoint.snapshot.state.found,...checkpoint.snapshot.state.tapped]).toHaveLength(3);await assertLocalOnly(page,noNetwork);
    });
    test('Continue Stop1 findings3-5',async({page,noNetwork})=>{
      await continueJourneyCheckpoint(page,file,checkpoint);await findStop1Items(page,3,6,()=>audit(page));checkpoint=await captureJourneyCheckpoint(page);expect([...checkpoint.snapshot.state.found,...checkpoint.snapshot.state.tapped]).toHaveLength(6);await assertLocalOnly(page,noNetwork);
    });
    test('Continue Stop1 findings6-11 and result',async({page,noNetwork})=>{
      await continueJourneyCheckpoint(page,file,checkpoint);await findStop1Items(page,6,12,()=>audit(page));await finishStop1(page,()=>audit(page));await backToMap(page);checkpoint=await captureJourneyCheckpoint(page,'notice-the-signs');await assertLocalOnly(page,noNetwork);
    });
    test('Continue to Stop2 intro and questions0-1',async({page,noNetwork})=>{
      await continueJourneyCheckpoint(page,file,checkpoint);await beginStop2(page,()=>audit(page));await answerStop2Rounds(page,2,()=>audit(page));checkpoint=await captureJourneyCheckpoint(page);await assertLocalOnly(page,noNetwork);
    });
    test('Continue Stop2 questions2-3, result and feedback',async({page,noNetwork})=>{
      await continueJourneyCheckpoint(page,file,checkpoint);await answerStop2Rounds(page,2,()=>audit(page));await expect(page.locator('.cb-card__can')).toBeVisible();await audit(page);await page.locator('#pt-review-tab').click();await audit(page);await assertLocalOnly(page,noNetwork);
    });
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
test('Library / Class mode chosen on the page keeps each Stop 1 finding on screen until the player closes it',async({page})=>{
  await page.goto('/index.html?seed=42');await expect(page.locator('#community-builders')).toHaveAttribute('data-engine-mounted','true');
  await page.locator('#pt-quiet').check();await page.locator('#pt-start').click();await expect(page.locator('.cb-hero')).toBeVisible();await waitStageReady(page,'title');
  await leaveNativeFullscreen(page);
  await newGame(page);await stop(page,1);await startStop1Today(page);
  await page.waitForTimeout(400);await page.locator('.cb-s01-spot[data-spot="0"]').click();
  const card=page.locator('dialog[open]');await expect(card).toBeVisible();await expect(card).toBeInViewport();
  // "This game has no timers": the finding waits for the player.
  await page.waitForTimeout(6500);await expect(card).toBeVisible();
  await page.keyboard.press('Escape');await expect(card).toHaveCount(0);
});
// 2026-10-30 UI/UX round (PG-UX-C02): one Escape closes the open finding only; Pause needs a second Escape.
for(const {lang,file} of languages)test(`${lang}: Escape on an open Stop 1 finding closes the finding and does not open Pause`,async({page})=>{
  await start(page,file);await stop(page,1);await startStop1Today(page);
  await page.waitForTimeout(400);const spot=page.locator('.cb-s01-spot[data-spot="3"]');
  await spot.focus();await page.keyboard.press('Enter');await expect(page.locator('.cb-callout')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.cb-callout')).toHaveCount(0);await expect(page.locator('.cb-pause')).toHaveCount(0);await expect(spot).toBeFocused();
  await page.keyboard.press('Escape');await expect(page.locator('.cb-pause')).toBeVisible();
});
// PG-UX-C01 / C03: a finding opens in view down to Keep looking, on a laptop and a phone, and Keep looking brings the
// chosen thing back into view.
for(const [lang,file,width,height] of [['en','index.html',1366,768],['es','espanol.html',390,844]])test(`${lang} ${width}x${height}: a Stop 1 finding opens in view, and Keep looking returns to the scene`,async({page})=>{
  await page.setViewportSize({width,height});await start(page,file);await stop(page,1);await startStop1Today(page);
  for(const index of [5,11]){
    await page.waitForTimeout(400);const spot=page.locator(`.cb-s01-spot[data-spot="${index}"]`);
    await spot.click();const finding=page.locator('.cb-callout'),keep=finding.locator('.cb-btn');
    await expect(keep).toBeInViewport({ratio:1});
    await expect(finding.locator('h3')).toBeInViewport({ratio:1});
    await keep.click();await expect(finding).toHaveCount(0);
    await expect(spot).toBeInViewport();await expect(spot).toBeFocused();
  }
});
// Repair after the round's reviews. A keyboard player's focus must stay in view when a finding opens (it used to stay
// on the chosen thing, which the reveal had scrolled 350-1280 px out of sight), and Keep looking brings them back.
for(const [lang,file,width,height] of [['en','index.html',1366,768],['es','espanol.html',390,844]])test(`${lang} ${width}x${height}: a keyboard player's focus stays in view when a Stop 1 finding opens`,async({page})=>{
  await page.setViewportSize({width,height});await start(page,file);await stop(page,1);await startStop1Today(page);
  // Items 0, 4 and 7 sit high in the scene: before the repair their focus ended 85-171 px above the view.
  for(const index of [0,4,7]){
    await page.waitForTimeout(400);const spot=page.locator(`.cb-s01-spot[data-spot="${index}"]`);
    await spot.focus();await page.keyboard.press('Enter');await expect(page.locator('.cb-callout')).toBeVisible();
    await expect(page.locator(':focus')).toBeInViewport({ratio:1});
    if(await page.locator('.cb-callout .cb-btn').evaluate(node=>node===document.activeElement))await page.keyboard.press('Enter');
    else await page.keyboard.press('Escape');
    await expect(page.locator('.cb-callout')).toHaveCount(0);await expect(spot).toBeFocused();await expect(spot).toBeInViewport();
  }
});
// Tapping one thing and then the next without Keep looking floated the second finding over the thing just tapped and
// the "Signs found" count, at 1366-1920.
for(const {lang,file} of languages)test(`${lang}: a second Stop 1 tap without Keep looking never hides the tapped thing or the count`,async({page})=>{
  await page.setViewportSize({width:1366,height:768});await start(page,file);await stop(page,1);await startStop1Today(page);
  const box=locator=>locator.evaluate(node=>{const r=node.getBoundingClientRect();return{left:r.left,top:r.top,right:r.right,bottom:r.bottom};});
  const apart=(a,b)=>a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top;
  for(const index of [0,1,2,3]){
    await page.waitForTimeout(450);const spot=page.locator(`.cb-s01-spot[data-spot="${index}"]`);await spot.click();
    const finding=page.locator('.cb-callout');await expect(finding).toBeVisible();
    const panel=await box(finding);
    expect(apart(panel,await box(spot)),`finding ${index} leaves the tapped thing visible`).toBe(true);
    expect(apart(panel,await box(page.locator('.cb-s01-board .cb-msg'))),`finding ${index} leaves the count readable`).toBe(true);
  }
});
// In phone landscape a finding was taller than the play view: Keep looking sat below the fold on 2 of 12.
test('en 640x360: every Stop 1 finding opens with Keep looking on screen',async({page})=>{
  await page.setViewportSize({width:640,height:360});await start(page);await stop(page,1);await startStop1Today(page);
  for(let index=0;index<12;index++){
    await page.waitForTimeout(400);await page.locator(`.cb-s01-spot[data-spot="${index}"]`).click();
    const keep=page.locator('.cb-callout .cb-btn');await expect(keep).toBeInViewport({ratio:1});await keep.click();
    await expect(page.locator('.cb-callout')).toHaveCount(0);
  }
});
// Stop 2 on phones: after Start the view jumped to the top of the game, and the worry the child must turn into a
// question (which has focus) sat 205-436 px below the fold.
// Measured with reduced motion, as the review found it (the view jumps at once).
for(const [lang,file,width,height] of [['es','espanol.html',390,844],['en','index.html',360,640]])test(`${lang} ${width}x${height}: after Start in Stop 2 the focused worry is on screen`,async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width,height});await start(page,file);await stop(page,2);
  await page.waitForTimeout(450);await page.locator('.cb-s02-intro .cb-btn--go').click();
  const worry=page.locator('[data-s02="worry"]');await expect(worry).toBeFocused();
  await expect(worry).toBeInViewport({ratio:1});
});
// Stop 2 at the 1366x768 floor: once the question can be asked, "Ask it" comes into view (it sat fully below the fold).
for(const {lang,file} of languages)test(`${lang} 1366x768: Stop 2's Ask it comes into view once the question can be asked`,async({page})=>{
  await page.setViewportSize({width:1366,height:768});await start(page,file);await stop(page,2);
  await page.waitForTimeout(450);await page.locator('.cb-s02-intro .cb-btn--go').click();await page.waitForTimeout(450);
  await expect(page.locator('[data-s02="worry"]')).toBeInViewport({ratio:1});
  await page.locator('.cb-s02-row[data-row="start"] .cb-s02-tile').first().click();
  await page.locator('.cb-s02-row[data-row="topic"] .cb-s02-tile').first().click();
  await expect(page.locator('.cb-s02-strip .cb-s02-ask')).toBeInViewport({ratio:1});
  await expect(page.locator('.cb-s02-row[data-row="topic"] .cb-s02-tile').first()).toBeInViewport();
});
// Stop 2 at the 1366x768 floor, after Ask: the answer opened at the top of the play view, but "Fix my question" and
// "Next worry" sat under the taller side column, 34-116 px below the bottom edge (802-862 EN, 824-884 ES of 768).
// The start of the judged question, the neighbor's answer and both buttons must share the first screen of the play view.
for(const {lang,file} of languages)test(`${lang} 1366x768: after Ask in Stop 2 the question, the answer and both buttons are in view`,async({page})=>{
  await page.setViewportSize({width:1366,height:768});await start(page,file);await stop(page,2);
  await page.waitForTimeout(450);await page.locator('.cb-s02-intro .cb-btn--go').click();await page.waitForTimeout(450);
  // seed 42's first tiles make a question with tips, so both "Fix my question" and "Next worry" are offered
  for(const row of ['start','topic','detail'])await page.locator(`.cb-s02-row[data-row="${row}"] .cb-s02-tile`).first().click();
  await page.locator('.cb-s02-ask').click();
  const answer=page.locator('[data-s02="answer"]'),buttons=page.locator('.cb-s02-strip.is-done .cb-btn');
  await expect(answer).toBeFocused();await expect(buttons).toHaveCount(2);
  // the play view scrolls itself (smoothly unless motion is reduced): judge the place it comes to rest
  const scrollTop=()=>answer.evaluate(node=>{let box=node.parentElement;while(box&&!(/auto|scroll/.test(getComputedStyle(box).overflowY)&&box.scrollHeight>box.clientHeight))box=box.parentElement;return box?box.scrollTop:scrollY;});
  await expect.poll(async()=>{const before=await scrollTop();await page.waitForTimeout(250);return before===await scrollTop();},'the play view stops scrolling').toBe(true);
  // inside the visible play area (the play view's scrollport, clipped to the window), not only the window
  const outside=()=>answer.evaluate(node=>{
    let port=node.parentElement;while(port&&!(/auto|scroll/.test(getComputedStyle(port).overflowY)&&port.scrollHeight>port.clientHeight))port=port.parentElement;
    const p=port&&port.getBoundingClientRect(),top=p?Math.max(0,p.top+port.clientTop):0,bottom=p?Math.min(innerHeight,p.top+port.clientTop+port.clientHeight):innerHeight;
    const range=document.createRange();range.selectNodeContents(node.querySelector('.cb-s02-you'));
    const parts=[['the first line of the judged question',range.getClientRects()[0]],['the answer',node.querySelector('.cb-s02-reply__line').getBoundingClientRect()]]
      .concat([...document.querySelectorAll('.cb-s02-strip.is-done .cb-btn')].map(button=>[button.textContent.trim(),button.getBoundingClientRect()]));
    return parts.filter(([,r])=>!(r.top>=top-0.5&&r.bottom<=bottom+0.5)).map(([name,r])=>`${name} at ${Math.round(r.top)}-${Math.round(r.bottom)} of ${Math.round(top)}-${Math.round(bottom)}`);
  });
  await expect.poll(outside,'everything the child needs after Ask is in the play view').toEqual([]);
  for(const index of [0,1])await expect(buttons.nth(index)).toBeInViewport({ratio:1});
  await expect(answer).toBeInViewport();
});
// The title at 200% browser zoom on the laptop floor (1366x768 seen as 683x384): New game was 258 px below the fold.
for(const {lang,file} of languages)test(`${lang} 683x384: New game is on the first screen of the title`,async({page})=>{
  await page.setViewportSize({width:683,height:384});await startStage(page,file);
  const words=await page.evaluate(()=>window.PecanGroveEngine.i18n.messages);
  await expect(page.locator('.cb-engine-title-actions').getByRole('button',{name:words.newGame,exact:true})).toBeInViewport({ratio:1});
});
// A tooltip stays while the pointer moves onto it (WCAG 1.4.13 Hoverable), with a real mouse path; touch shows none.
test('a hover tooltip stays while the mouse moves onto it, and leaves with the mouse',async({page})=>{
  await page.setViewportSize({width:1366,height:768});await start(page);await stop(page,2);
  // hover() waits until the HUD stops moving. Measured: in a full Chromium run the stop's smooth scroll to its top was
  // still running, so a pointer placed at a box read too early landed on the toolbar instead (1 of 3 runs).
  const icon=page.locator('.cb-stophud .cb-setbtn');await icon.hover();const b=await icon.boundingBox();
  await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:4});
  if(!await page.evaluate(()=>matchMedia('(hover: hover)').matches)){
    await page.waitForTimeout(700);await expect(page.locator('.cb-tooltip')).toHaveCount(0);return;
  }
  const tip=page.locator('.cb-tooltip');await expect(tip).toBeVisible();
  const t=await tip.boundingBox();
  await page.mouse.move(t.x+Math.min(t.width/2,b.width/2),t.y+t.height/2,{steps:12});
  await page.waitForTimeout(300);await expect(tip).toBeVisible();
  await page.mouse.move(t.x+t.width/2,t.y+t.height+160,{steps:6});
  await expect(page.locator('.cb-tooltip')).toHaveCount(0);
});
// Phones: the play tools are one row that scrolls sideways. A tool reached with Tab lands fully on screen.
for(const {lang,file} of languages)test(`${lang} 360x640: every play tool reached with Tab is fully on screen`,async({page})=>{
  await page.setViewportSize({width:360,height:640});await start(page,file);
  // The last review of the round made only keyboard focus (:focus-visible) scroll the row, because a tap focuses a tool
  // too and must not slide it out from under the finger. Focus set by a script after a tap is not keyboard focus, so
  // the tools after the first are now reached with the Tab key itself, as this test's name says.
  const [first,...rest]=['#pt-review-tab','#pt-library-tab','#pt-grownups-tab','#pt-exit'].map(id=>page.locator(id));
  await first.focus();await expect(first).toBeFocused();await expect(first).toBeInViewport({ratio:1});
  for(const tool of rest){await page.keyboard.press('Tab');await expect(tool).toBeFocused();await expect(tool).toBeInViewport({ratio:1});}
});
// Last review of the round. On a phone a press on a tool that peeks past the row's edge focused it, the row then
// scrolled it fully into view under the finger, and the press ended beside it: nothing opened (EN 360: For grown-ups).
for(const [lang,file,width,height] of [['en','index.html',360,640],['es','espanol.html',412,915]])test(`${lang} ${width}x${height}: a press on a play tool that peeks past the row's edge opens it`,async({page},testInfo)=>{
  await page.setViewportSize({width,height});await start(page,file);
  const peek=await page.locator('.pt-toolbar').evaluate(row=>{
    const b=row.getBoundingClientRect(),tool=[...row.querySelectorAll('.pt-tool')].find(n=>{const r=n.getBoundingClientRect();return r.left<b.right-12&&r.right>b.right+12;});
    if(!tool)return null;const r=tool.getBoundingClientRect();return{id:tool.id,x:Math.round((r.left+b.right)/2),y:Math.round(b.top+b.height/2)};
  });
  expect(peek,'a tool peeks past the edge of the row').not.toBeNull();
  if(testInfo.project.use.hasTouch)await page.touchscreen.tap(peek.x,peek.y);else await page.mouse.click(peek.x,peek.y,{delay:80});
  if(peek.id==='pt-exit')await expect(page.locator('#pt-stage')).not.toHaveClass(/is-playing/);
  else await expect(page.locator('dialog[open]').first()).toBeVisible();
});
// Last review of the round: the row's fade stuck to its content edge, 8 px short of the bar's edge, and the pill under
// it showed again in that strip ("Fo|gr" in English, "cla|e" in Spanish at 360).
for(const {lang,file} of languages)test(`${lang} 360x640: the play tools' fade reaches the bar's edge`,async({page})=>{
  await page.setViewportSize({width:360,height:640});await start(page,file);
  const clip=await page.locator('.pt-toolbar').evaluate(row=>{row.scrollLeft=0;const r=row.getBoundingClientRect();return{x:Math.floor(r.right)-6,y:Math.round(r.top+r.height/2-8),width:6,height:16};});
  await page.waitForTimeout(100);
  const {data,info}=await require('sharp')(await page.screenshot({clip})).raw().toBuffer({resolveWithObject:true});
  let worst=0;for(let i=0;i<data.length;i+=info.channels)worst=Math.max(worst,Math.abs(data[i]-22)+Math.abs(data[i+1]-58)+Math.abs(data[i+2]-48));
  expect(worst,'the last 6 px of the bar are its own pine (#163a30), with no pill showing past the fade').toBeLessThanOrEqual(12);
});
// Last review of the round: at 1100 px of game and wider the steps row sat in the title column only, and its caption ran
// under the HUD's Pause button (Spanish Stops 3-10 at 1366x768: 9-91 px; at 1180: up to 151 px; English Stop 10: 38 px).
for(const [lang,file,stops] of [['es','espanol.html',[3,10]],['en','index.html',[10]]])test(`${lang}: a stop's steps never run under the HUD on a wide stage`,async({page})=>{
  await page.setViewportSize({width:1366,height:768});await start(page,file);
  for(const n of stops){
    await stop(page,n);await page.waitForTimeout(450);
    const go=page.locator('.cb-board .cb-btn--go.cb-btn--big').last();await go.focus();await page.keyboard.press('Enter');
    await expect(page.locator('.cb-stophud__steps')).toBeVisible();
    for(const [width,height] of [[1366,768],[1180,800]]){
      await page.setViewportSize({width,height});await page.waitForTimeout(250);
      const clash=await page.locator('.cb-stophud').evaluate(head=>{
        const hud=head.querySelector(':scope > .cb-engine-hud').getBoundingClientRect();
        return[...head.querySelectorAll('.cb-stophud__steps *')].filter(n=>!n.closest('.cb-vh')).map(n=>({text:n.textContent.trim().slice(0,30),r:n.getBoundingClientRect()}))
          .filter(({r})=>r.width&&r.height&&r.left<hud.right&&r.right>hud.left&&r.top<hud.bottom&&r.bottom>hud.top).map(({text})=>text);
      });
      expect(clash,`Stop ${n} at ${width}x${height}: nothing in the steps row is under the HUD`).toEqual([]);
    }
    await page.setViewportSize({width:1366,height:768});await backToMap(page);
  }
});
// Last review of the round: a finished stop's number is ink on its chapter colour. On green (3.65:1) and pink (4.08:1)
// it was 16.7 px, under large text, so it failed 4.5:1 on phone maps and in the All stops list (Stops 10-15).
for(const {lang,file} of languages)test(`${lang} 390x844: every finished stop's number is readable on its chapter colour`,async({page})=>{
  await page.setViewportSize({width:390,height:844});await start(page,file);
  await page.evaluate(()=>{const core=window.CommunityBuilders,state=core.getState(),player=state.store.players[state.store.current];core.getAPI().STOPS.forEach(stop=>{player.stops[stop.id]={best:90,rounds:1};});core.showMap();});
  await waitStageReady(page,'map');
  await page.evaluate(()=>document.querySelectorAll('.cb details').forEach(d=>{d.open=true;}));
  const discs=await page.evaluate(()=>[...document.querySelectorAll('.cb-stop[data-state="done"] .cb-stop__disc')].filter(disc=>disc.getBoundingClientRect().width>0).map(disc=>{
    const number=disc.querySelector(':scope > span:not([class])'),style=getComputedStyle(number);
    return{n:disc.closest('.cb-stop').dataset.stopN,list:!!disc.closest('.cb-stops--list'),size:parseFloat(style.fontSize),weight:Number(style.fontWeight),color:style.color,fill:getComputedStyle(disc).backgroundColor};
  }));
  const {parseColor,contrastRatio}=require('./contrast-probe.cjs');
  expect(discs.filter(d=>d.list).length,'finished stops in the All stops list').toBe(15);expect(discs.filter(d=>!d.list).length,'finished stops on the map').toBe(15);
  for(const d of discs){
    const ratio=contrastRatio(parseColor(d.color),parseColor(d.fill)),large=d.size>=24||(d.weight>=700&&d.size>=18.66);
    expect(ratio,`Stop ${d.n} (${d.list?'list':'map'}): ${d.size}px at weight ${d.weight}`).toBeGreaterThanOrEqual(large?3:4.5);
  }
});
// Last review of the round: P with a finding open, then Enter on Resume. Resume's click counted as a tap outside the
// finding, which closed it and removed Keep looking, where Pause had to give focus back: focus fell to the page.
for(const [lang,file,width,height] of [['en','index.html',1366,768],['es','espanol.html',390,844]])test(`${lang} ${width}x${height}: Resume brings a keyboard player back to the open finding`,async({page})=>{
  await page.setViewportSize({width,height});await start(page,file);await stop(page,1);await startStop1Today(page);
  await page.waitForTimeout(400);const spot=page.locator('.cb-s01-spot[data-spot="0"]');
  await spot.focus();await page.keyboard.press('Enter');const finding=page.locator('.cb-callout');await expect(finding).toBeVisible();
  const focused=await page.evaluate(()=>document.activeElement.textContent.trim());
  await page.keyboard.press('p');await expect(page.locator('.cb-pause')).toBeVisible();
  await page.keyboard.press('Enter');await expect(page.locator('.cb-pause')).toHaveCount(0);
  await expect(finding).toBeVisible();
  expect(await page.evaluate(()=>document.activeElement===document.body?'(the page)':document.activeElement.textContent.trim()),'focus is back where it was before Pause').toBe(focused);
  await expect(page.locator(':focus')).toBeInViewport();
});
// The first-stop badge toast covered the result line on a phone and ran past the game's edge on a laptop. It now stays
// inside the game and off the result line, and the screen behind it still reads.
for(const [width,height] of [[1366,768],[390,844]])test(`es ${width}x${height}: the new-badge toast stays inside the game and off the result line`,async({page})=>{
  await page.setViewportSize({width,height});await start(page,'espanol.html');await stop(page,1);await startStop1Today(page);
  await findStop1Items(page,0,12);await finishStop1(page);
  const toast=page.locator('.cb-engine-toast');await expect(toast).toBeVisible();await page.waitForTimeout(700);
  const [t,can,game]=await Promise.all(['.cb-engine-toast','.cb-card__can','#community-builders'].map(sel=>page.locator(sel).first().evaluate(node=>{const r=node.getBoundingClientRect();return{left:r.left,top:r.top,right:r.right,bottom:r.bottom};})));
  expect(t.right).toBeLessThanOrEqual(game.right);expect(t.left).toBeGreaterThanOrEqual(game.left);
  expect(t.bottom<=can.top||t.top>=can.bottom||t.right<=can.left||t.left>=can.right,'the result line stays readable').toBe(true);
});
test('language switch mid-stop retains the current step and selected tiles',async({page})=>{
  await start(page);await stop(page,2);await page.locator('.cb-s02-intro .cb-btn--go').click();await page.locator('.cb-s02-row[data-row="topic"] .cb-s02-tile').first().click();
  const selected=await page.locator('.cb-s02-tile[aria-pressed="true"]').getAttribute('data-id');
  const language=page.locator('.cb-stophud .cb-language[lang="es"]');
  if(await language.isVisible())await language.click();
  else{await page.locator('.cb-hud-more').click();await page.locator('.cb-hud-more-dialog').getByRole('button',{name:'ES, Español',exact:true}).click();}
  await expect(page.locator('html')).toHaveAttribute('lang','es');await expect(page.locator('.cb-s02-play')).toBeVisible();await expect(page.locator('.cb-s02-tile[aria-pressed="true"]')).toHaveAttribute('data-id',selected);
  await expect(page.locator('#community-builders')).toHaveAttribute('aria-label','Juego'); // PG-UX-A09
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

async function typeNote(page,text) {
  await page.evaluate(value=>{const fix=document.getElementById('pt-feedback-fix');fix.value=value;fix.dispatchEvent(new Event('input',{bubbles:true}));},text);
  await expect.poll(()=>page.evaluate(()=>window.PecanGroveFeedback.model.find('feedback',0)?.fix||'')).toBe(text);
}
async function openIntro(page,file) {
  await page.goto(`/${file}`);
  await expect(page.locator('#community-builders')).toHaveAttribute('data-engine-mounted','true');
  await page.locator('#pt-feedback-save-draft').waitFor({state:'attached'});
}
// Facilitator close-out exists only in a build made with PG_CLOSEOUT_CODE. CI builds dist-e2e with this test code.
const CLOSEOUT_CODE=process.env.PG_E2E_CLOSEOUT_CODE||'e2e-closeout-test-code';
const hasCloseout=async page=>(await page.locator('#pt-closeout-open').count())>0;
const CLOSEOUT_NEEDED='Needs a build with a close-out code, like CI\'s dist-e2e.';
async function openCloseout(page,file){
  await openIntro(page,file);
  await page.locator('#pt-closeout-open').click();
  await expect(page.locator('#pt-closeout-ask')).toBeVisible();await expect(page.locator('#pt-closeout-code')).toBeFocused();
  await page.locator('#pt-closeout-code').fill(CLOSEOUT_CODE);await page.locator('#pt-closeout-ask-confirm').click();
  await expect(page.locator('#pt-closeout-dialog')).toBeVisible();await expect(page.locator('#pt-closeout-title')).toBeFocused();
  expect(page.url(),'the code never goes into the address').not.toMatch(/closeout|e2e-closeout/);
}
const storedText=page=>page.evaluate(()=>Object.entries(localStorage).filter(([key])=>key.startsWith('pecan-grove')).map(pair=>pair.join(' ')).join(String.fromCharCode(10)));
async function afterReload(page){await expect(page.locator('#community-builders')).toHaveAttribute('data-engine-mounted','true');await page.locator('#pt-feedback-save-draft').waitFor({state:'attached'});}
for (const {lang,file} of languages) test(`${lang}: Next player keeps the last player's note only for the facilitator, and only Facilitator close-out brings that player back`,async({page,noNetwork})=>{
  await openIntro(page,file);test.skip(!(await hasCloseout(page)),CLOSEOUT_NEEDED);const first=await page.evaluate(()=>window.PecanGroveFeedback.model.active());
  await typeNote(page,'PREVIOUS CHILD SECRET');
  // The step log (and so a progress file) belongs to one player: mark this player's log to follow it.
  const steps=async()=>{await page.waitForFunction(()=>window.PecanGroveEngine&&window.PecanGroveEngine.steps);return page.evaluate(()=>({key:window.PecanGroveEngine.steps.key(),marked:window.PecanGroveEngine.steps.entries().some(e=>e.event==='pause'&&e.stop===7)}));};
  await steps();await page.evaluate(()=>window.PecanGroveEngine.steps.record('pause',{stop:7}));expect(await steps()).toEqual({key:`pecan-grove-steps:${first}`,marked:true});
  await expect(page.locator('#pt-consent-options #pt-feedback-new-player-top')).toBeVisible();
  await page.locator('#pt-feedback-new-player-top').click();await expect(page.locator('#pt-new-player-cancel')).toBeFocused();
  await expect(page.locator('#pt-new-player-message')).toContainText(lang==='en'?'has not received: 1. Choose what happens to them':'no ha recibido: 1. Elige qué pasa con ellas');
  // Nothing starts the next player until the note is handled.
  await expect(page.locator('#pt-new-player-confirm')).toBeHidden();
  const result=await new AxeBuilder({page}).include('#pt-new-player-dialog').analyze();expect(result.violations).toEqual([]);
  await page.locator('#pt-new-player-keep').click();
  await expect(page.locator('#pt-player-ready')).toBeVisible();await page.locator('#pt-feedback-save-draft').waitFor({state:'attached'});
  await expect(page.locator('#pt-player-back')).toHaveCount(0);
  await expect(page.locator('#pt-feedback-fix')).toHaveValue('');
  const next=await page.evaluate(()=>({session:window.PecanGroveFeedback.model.active(),text:window.PecanGroveFeedback.model.entries().map(e=>e.fix).join(''),kept:window.PecanGroveFeedback.model.entries(true).some(e=>e.fix==='PREVIOUS CHILD SECRET')}));
  expect(next.session).not.toBe(first);expect(next.text).not.toContain('SECRET');expect(next.kept).toBe(true);
  expect(await steps()).toEqual({key:`pecan-grove-steps:${next.session}`,marked:false});
  expect(await page.evaluate(key=>localStorage.getItem(key),`pecan-grove-steps:${first}`)).toContain('"stop":7');
  await openCloseout(page,file);
  await page.locator('#pt-closeout-dialog').getByRole('button',{name:new RegExp(`${first.slice(-6).toUpperCase()}`)}).click();
  await afterReload(page);await expect(page.locator('#pt-feedback-fix')).toHaveValue('PREVIOUS CHILD SECRET');
  await expect(page.locator('#pt-closeout-ask')).toHaveCount(0);await expect(page.locator('#pt-closeout-dialog')).toHaveCount(0);
  expect(await page.evaluate(()=>window.PecanGroveFeedback.model.active())).toBe(first);
  expect(await steps()).toEqual({key:`pecan-grove-steps:${first}`,marked:true});
  await assertLocalOnly(page,noNetwork);
});
test('Next player: Delete them asks again with Keep playing first, and leaves none of the note on the device',async({page,noNetwork})=>{
  await openIntro(page,'index.html');await typeNote(page,'DELETE ME SECRET');const first=await page.evaluate(()=>window.PecanGroveFeedback.model.active());
  await page.locator('#pt-feedback-new-player-top').click();
  // With a receiver or a close-out code Next player first asks what happens; otherwise it asks only to delete.
  const remove=page.locator('#pt-new-player-delete');if(await remove.isVisible())await remove.click();
  await expect(page.locator('#pt-new-player-cancel')).toBeFocused();await expect(page.locator('#pt-new-player-message')).toContainText('Delete them? Nobody can bring them back.');
  await expect(page.locator('#pt-new-player-confirm')).toHaveText('Delete and start the next player');
  expect((await new AxeBuilder({page}).include('#pt-new-player-dialog').analyze()).violations).toEqual([]);
  const reloaded=page.waitForEvent('load');await page.locator('#pt-new-player-confirm').click();await reloaded;await afterReload(page);
  expect(await page.evaluate(()=>window.PecanGroveFeedback.model.active())).not.toBe(first);
  expect(await storedText(page)).not.toContain('DELETE ME SECRET');
  await assertLocalOnly(page,noNetwork);
});
test('Privacy and notes on this device shows the notice and only counts notes, and erases every Pecan Grove key',async({page,noNetwork})=>{
  await openIntro(page,'index.html');await typeNote(page,'first player note');const keep=await hasCloseout(page);
  await page.locator('#pt-feedback-new-player-top').click();
  if(keep)await page.locator('#pt-new-player-keep').click();
  else{const remove=page.locator('#pt-new-player-delete');if(await remove.isVisible())await remove.click();await page.locator('#pt-new-player-confirm').click();}
  await expect(page.locator('#pt-player-ready')).toBeVisible();
  await page.locator('#pt-device-open').click();await expect(page.locator('#pt-device-dialog')).toBeVisible();await expect(page.locator('#pt-device-title')).toBeFocused();
  await page.locator('#pt-device-privacy > summary').click();await expect(page.locator('#pt-device-privacy')).toContainText('akeyvanf@kennesaw.edu');const cloud=await page.evaluate(()=>!!document.getElementById('pt-feedback').dataset.endpoint);
  // CI runs this against dist-e2e, which has a placeholder receiver and a test close-out code; a local build may have neither.
  await expect(page.locator('#pt-device-privacy')).toContainText(cloud?'nothing leaves this device until a grown-up reviews a note':'This copy of the game is not connected');
  if(keep)await expect(page.locator('#pt-device-privacy')).toContainText('keep them on this device for Facilitator close-out, which opens only with the facilitator\'s code');
  else await expect(page.locator('#pt-device-dialog')).not.toContainText('close-out');
  // The next child sees how many notes are waiting, never their text, Send or the Excel for every player.
  await expect(page.locator('#pt-device-dialog')).toContainText(keep?'Notes: 1. Not received by the playtest team: 1.':'Notes: 0. Not received by the playtest team: 0.');
  await expect(page.locator('#pt-device-dialog')).not.toContainText('first player note');
  for(const id of ['pt-device-show','pt-device-notes','pt-device-send','pt-device-download'])await expect(page.locator('#'+id)).toHaveCount(0);
  const result=await new AxeBuilder({page}).include('#pt-device-dialog').analyze();expect(result.violations).toEqual([]);
  const earlier=await page.evaluate(()=>window.PecanGroveFeedback.model.players(true).map(p=>p.sessionId).concat(window.PecanGroveFeedback.model.active()));
  await page.locator('#pt-device-erase').click();await expect(page.locator('#pt-device-erase-no')).toBeFocused();await page.locator('#pt-device-erase-yes').click();
  await expect(page.locator('#pt-player-ready')).toHaveCount(0);await page.locator('#pt-feedback-save-draft').waitFor({state:'attached'});
  const after=await page.evaluate(()=>window.PecanGroveFeedback.model.entries(true).filter(e=>e.kind==='feedback').length),stored=await storedText(page);
  expect(after).toBe(0);expect(stored).not.toContain('first player note');for(const session of earlier)expect(stored).not.toContain(session);
  await assertLocalOnly(page,noNetwork);
});
test('Facilitator close-out asks for the code in a dialog, never in the address, warns about downloads and is accessible',async({page,noNetwork})=>{
  await openIntro(page,'espanol.html');test.skip(!(await hasCloseout(page)),CLOSEOUT_NEEDED);await typeNote(page,'nota del jugador, correo ana@x.com');
  // Nothing about the close-out is in the page's copy until a grown-up asks for it.
  expect(await page.content()).not.toMatch(/[?&]closeout=|e2e-closeout-test-code/);
  await page.locator('#pt-closeout-open').click();await expect(page.locator('#pt-closeout-ask')).toBeVisible();
  await expect(page.locator('#pt-closeout-ask')).toContainText('Si eres un jugador, elige Ahora no.');
  // A masked password field that the browser treats as a one-time code, so it never offers to save or fill it in.
  await expect(page.locator('#pt-closeout-code')).toHaveAttribute('type','password');await expect(page.locator('#pt-closeout-code')).toHaveAttribute('autocomplete','one-time-code');
  expect((await new AxeBuilder({page}).include('#pt-closeout-ask').analyze()).violations).toEqual([]);
  await page.locator('#pt-closeout-code').fill('no-es-el-codigo');await page.locator('#pt-closeout-code').press('Enter');
  await expect(page.locator('#pt-closeout-ask-status')).toHaveText('Ese código no es correcto. Intentos antes de esperar un minuto: 4.');
  await expect(page.locator('#pt-closeout-dialog')).toHaveCount(0);await expect(page.locator('#pt-closeout-code')).toHaveValue('');
  await page.keyboard.press('Escape');await expect(page.locator('#pt-closeout-ask')).toBeHidden();await expect(page.locator('#pt-closeout-open')).toBeFocused();
  await openCloseout(page,'espanol.html');
  await expect(page.locator('#pt-closeout-notes')).toContainText('nota del jugador, correo [quitado]');
  const result=await new AxeBuilder({page}).include('#pt-closeout-dialog').analyze();expect(result.violations).toEqual([]);
  // The Excel for every player has each note as Send would send it, under a check-before-sharing row.
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#pt-closeout-download').click()]);
  expect(download.suggestedFilename()).toBe('pecan-grove-feedback-all-players.xlsx');
  const workbook=require('node:fs').readFileSync(await download.path()).toString('utf8');
  expect(workbook).toContain('Revisa antes de compartir.');expect(workbook).toContain('correo [quitado]');expect(workbook).not.toContain('ana@x.com');
  // Closing first says to delete the downloaded file from Downloads.
  await page.locator('#pt-closeout-close').click();await expect(page.locator('#pt-closeout-files')).toContainText('pecan-grove-feedback-all-players.xlsx');
  await expect(page.locator('#pt-closeout-dialog')).not.toContainText('nota del jugador');
  await page.locator('#pt-closeout-close').click();await expect(page.locator('#pt-closeout-dialog')).toBeHidden();await expect(page.locator('#pt-closeout-open')).toBeFocused();
  expect(await page.evaluate(()=>document.getElementById('pt-closeout-dialog').textContent)).not.toContain('nota del jugador');
  expect(page.url()).not.toMatch(/closeout/);
  await assertLocalOnly(page,noNetwork);
});
test('Facilitator close-out is also under the game\'s For grown-ups, behind the same code',async({page,noNetwork})=>{
  await openIntro(page,'index.html');test.skip(!(await hasCloseout(page)),CLOSEOUT_NEEDED);
  await page.locator('#pt-quiet').check();await page.locator('#pt-start').click();await expect(page.locator('.cb-hero')).toBeVisible();
  await page.locator('.cb-hero .cb-btn--onstage').click();
  const button=page.locator('dialog[open]').getByRole('button',{name:'Facilitator close-out',exact:true});await button.click();
  await expect(page.locator('#pt-closeout-ask')).toBeVisible();await page.locator('#pt-closeout-code').fill(CLOSEOUT_CODE);await page.locator('#pt-closeout-ask-confirm').click();
  await expect(page.locator('#pt-closeout-dialog')).toBeVisible();await page.locator('#pt-closeout-close').click();
  await expect(page.locator('#pt-closeout-dialog')).toBeHidden();await expect(button).toBeFocused();
  await assertLocalOnly(page,noNetwork);
});
// On a first visit the feedback words come as two files. A missing one borrows the other language; with neither, the
// form is switched off and emptied, and Next player (start page and the game's For grown-ups) still starts the next
// player, so nothing typed waits for the next child. With no service worker, every load misses the same files.
// A raw key is a word name from the feedback or shell words (camelCase or snake_case), or an unfilled placeholder.
const WORD_KEYS=['feedback-en','en'].flatMap(name=>Object.keys(require(`../../assets/playtest/locales/${name}.json`))).filter(key=>/[A-Z_]/.test(key));
const RAW_KEYS=new RegExp(`\\b(?:undefined|null|${WORD_KEYS.join('|')})\\b|\\{(?:count|files|code|words|players|notes|waiting|time)\\}`);
test.describe('feedback words that do not load on a first visit',()=>{
  test.use({serviceWorkers:'block'});
  for(const {failing,file} of [{failing:['en','es'],file:'index.html'},{failing:['en','es'],file:'espanol.html'},{failing:['en'],file:'index.html'},{failing:['es'],file:'espanol.html'}])
  test(`${failing.join(' and ')} words fail on ${file}: the grown-up controls work, no raw key shows and nothing typed stays after Next player`,async({page,noNetwork})=>{
    const words=new RegExp(`/feedback-(?:${failing.join('|')})\\.[0-9a-f]+\\.json$`),es=file==='espanol.html',both=failing.length===2,dialog=page.locator('#pt-new-player-dialog');
    // The files fail only after a child has typed into the form while it was still loading.
    let release;const typed=new Promise(resolve=>{release=resolve;});
    await page.route(words,async route=>{await typed;await route.abort();});
    await page.goto(`/${file}`);await expect(page.locator('#community-builders')).toHaveAttribute('data-engine-mounted','true');
    await page.evaluate(()=>{document.getElementById('pt-feedback-worked').value='my name is Lila Fernandez';});release();
    const first=await page.locator('#community-builders').getAttribute('data-feedback-session'),secret=/Lila|Fernandez|LOCALE FALLBACK/;
    if(both){
      await expect(page.locator('#pt-feedback')).toHaveAttribute('data-feedback-unavailable','true');
      await expect(page.locator('#pt-feedback-status')).toHaveText(es?/^No se pudo cargar el formulario de comentarios\. Recarga esta página/:/^The feedback form could not load\. Reload this page while you are online/);
      for(const id of ['worked','fix','submit'])await expect(page.locator('#pt-feedback-'+id)).toBeDisabled();
      await expect(page.locator('#pt-feedback-worked')).toHaveValue('');
      for(const id of ['#pt-device-open','#pt-closeout-open'])await expect(page.locator(id)).toBeHidden();
      await page.locator('#pt-feedback-new-player-top').click();await expect(dialog).toBeVisible();await expect(page.locator('#pt-new-player-cancel')).toBeFocused();
      await expect(page.locator('#pt-new-player-message')).toHaveText(es?/Recarga esta página con conexión a internet/:/Reload this page while you are online/);
      expect(await dialog.innerText()).not.toMatch(RAW_KEYS);
      expect((await new AxeBuilder({page}).include('#pt-new-player-dialog').analyze()).violations).toEqual([]);
      await page.keyboard.press('Escape');await expect(dialog).toBeHidden();await expect(page.locator('#pt-feedback-new-player-top')).toBeFocused();
      // The game's own For grown-ups has Next player too.
      await page.locator('#pt-quiet').check();await page.locator('#pt-start').click();await expect(page.locator('.cb-hero')).toBeVisible();
      await page.locator('.cb-hero .cb-btn--onstage').click();
      await page.locator('dialog[open]').getByRole('button',{name:es?'Siguiente jugador en esta computadora':'Next player on this computer',exact:true}).click();
      await expect(dialog).toBeVisible();expect(await dialog.innerText()).not.toMatch(RAW_KEYS);
    }else{
      await page.locator('#pt-feedback-save-draft').waitFor({state:'attached'});
      // The form borrows the other language's words, and says so in its lang attribute.
      await expect(page.locator('#pt-feedback-h')).toHaveText(es?'Playtest feedback':'Comentarios de la prueba');await expect(page.locator('#pt-feedback')).toHaveAttribute('lang',es?'en':'es');
      await expect(page.locator('#pt-feedback-worked')).toHaveValue('');
      await typeNote(page,'LOCALE FALLBACK SECRET');
      await page.locator('#pt-feedback-new-player-top').click();await expect(dialog).toBeVisible();expect(await dialog.innerText()).not.toMatch(RAW_KEYS);
      const remove=page.locator('#pt-new-player-delete');if(await remove.isVisible())await remove.click();
      expect(await dialog.innerText()).not.toMatch(RAW_KEYS);
    }
    const reloaded=page.waitForEvent('load');await page.locator('#pt-new-player-confirm').click();await reloaded;
    await expect(page.locator('#community-builders')).toHaveAttribute('data-engine-mounted','true');
    await expect.poll(()=>page.locator('#community-builders').getAttribute('data-feedback-session')).not.toBe(first);
    if(both)await expect(page.locator('#pt-feedback')).toHaveAttribute('data-feedback-unavailable','true');else await page.locator('#pt-feedback-save-draft').waitFor({state:'attached'});
    await expect(page.locator('#pt-feedback-worked')).toHaveValue('');await expect(page.locator('#pt-feedback-fix')).toHaveValue('');
    expect(await storedText(page)).not.toMatch(secret);
    expect(await page.locator('#pt-feedback').innerText()).not.toMatch(RAW_KEYS);
    // Only the aborted word files may show up as failed loads, beside Playwright's note that it blocked the service worker.
    const expected=problem=>/feedback-e[ns]\.[0-9a-f]+\.json$/.test(problem.location?.url||'')||problem.text==='Service Worker registration blocked by Playwright';
    noNetwork.consoleProblems.splice(0,noNetwork.consoleProblems.length,...noNetwork.consoleProblems.filter(problem=>!expected(problem)));
    expect(noNetwork.receiverRequests).toHaveLength(0);noNetwork.assertClean();expect(noNetwork.consoleProblems).toEqual([]);
  });
});
test('leaving Facilitator close-out and coming back with Back shows no note text',async({playwright,browserName,baseURL})=>{
  test.skip(browserName!=='chromium','Only Chromium takes the switch that keeps its back-forward cache on.');
  // Playwright turns the back-forward cache off by default; a real browser keeps it on, so Back can show a page exactly as
  // it was left. This browser keeps it on, and aborts every receiver request like the shared fixture.
  const browser=await playwright.chromium.launch({channel:test.info().project.use.channel,ignoreDefaultArgs:['--disable-back-forward-cache']});
  try{
    const context=await browser.newContext({baseURL});await context.route(isReceiver,route=>route.abort('blockedbyclient'));
    const page=await context.newPage(),problems=[];page.on('pageerror',error=>problems.push(error.message));
    await openIntro(page,'index.html');test.skip(!(await hasCloseout(page)),CLOSEOUT_NEEDED);await typeNote(page,'BFCACHE SECRET NOTE');
    await openCloseout(page,'index.html');await expect(page.locator('#pt-closeout-notes')).toContainText('BFCACHE SECRET NOTE');
    await page.evaluate(()=>{window.__sameDocument=true;});
    await page.goto('/educator.html');await page.goBack({waitUntil:'commit'});await afterReload(page);
    const restored=await page.evaluate(()=>window.__sameDocument===true);
    test.info().annotations.push({type:'back-forward cache',description:restored?'restored':'reloaded'});
    await expect(page.locator('#pt-closeout-dialog[open]')).toHaveCount(0);
    expect(await page.evaluate(()=>document.getElementById('pt-closeout-dialog')?.textContent||'')).not.toContain('BFCACHE SECRET NOTE');
    // The player's own note comes back into the form from storage.
    await expect(page.locator('#pt-feedback-fix')).toHaveValue('BFCACHE SECRET NOTE');
    expect(problems).toEqual([]);
  }finally{await browser.close();}
});
// Last review of the round: the intro's "turn on the box above first" line stayed the second score box's description
// after the box unlocked (Chromium's accessibility tree read it on the unlocked box, in English and Spanish).
for(const {lang,file} of languages)test(`${lang}: the second score box is described by its lock only while it is locked`,async({page,noNetwork})=>{
  await openIntro(page,file);
  const scores=page.locator('#pt-consent-options input[data-pg-consent="scores"]'),auto=page.locator('#pt-consent-options input[data-pg-consent="autoScores"]');
  const why=(await page.locator('#pt-consent-why').textContent()).trim();
  await expect(auto).toBeDisabled();await expect(auto).toHaveAccessibleDescription(why);
  await scores.click();await page.locator('#pt-consent-confirm').click();await expect(scores).toBeChecked();
  await expect(auto).toBeEnabled();await expect(auto).toHaveAccessibleDescription('');
  await scores.click();await expect(scores).not.toBeChecked();
  await expect(auto).toBeDisabled();await expect(auto).toHaveAccessibleDescription(why);
  await assertLocalOnly(page,noNetwork);
});
test('turning on score sharing from the start page waits for a grown-up confirmation',async({page,noNetwork})=>{
  await openIntro(page,'espanol.html');const box=page.locator('#pt-consent-options input[data-pg-consent="scores"]');
  await box.click();await expect(page.locator('#pt-consent-dialog')).toBeVisible();await expect(page.locator('#pt-consent-cancel')).toBeFocused();
  await expect(box).not.toBeChecked();expect(await page.evaluate(()=>window.PecanGroveFeedback.getConsent().scores)).toBe(false);
  await page.keyboard.press('Escape');await expect(page.locator('#pt-consent-dialog')).toBeHidden();await expect(box).toBeFocused();await expect(box).not.toBeChecked();
  await box.click();await page.locator('#pt-consent-confirm').click();await expect(box).toBeChecked();expect(await page.evaluate(()=>window.PecanGroveFeedback.getConsent().scores)).toBe(true);
  await box.click();await expect(page.locator('#pt-consent-dialog')).toBeHidden();await expect(box).not.toBeChecked();
  await assertLocalOnly(page,noNetwork);
});
test.describe('receiver safety net',()=>{
  // Permission only stops the teardown assertion: the shared fixture must still abort the attempt.
  test.use({allowFeedback:true});
  test('every browser test aborts receiver requests unless the test mocks them',async({page,noNetwork,browserName})=>{
    await page.goto('about:blank');
    const outcome=await page.evaluate(()=>fetch('https://script.google.com/macros/s/e2e-safety-net-not-deployed/exec',{mode:'no-cors'}).then(()=>'reached',()=>'aborted'));
    expect(outcome).toBe('aborted');expect(noNetwork.receiverRequests).toHaveLength(1);
    // In every engine the attempt failed in the browser and no response came back: nothing reached the receiver.
    const [attempt]=noNetwork.receiverRequests;await expect.poll(()=>attempt.failure()?.errorText||'').not.toBe('');expect(await attempt.response()).toBeNull();
    // Engines word (or skip) the console report of an aborted request differently. Only Chromium's wording is checked;
    // any report naming this one request is expected, and every other console problem still fails the scenario.
    if(browserName==='chromium'){await expect.poll(()=>noNetwork.consoleProblems.length).toBe(1);expect(noNetwork.consoleProblems[0].text).toContain('ERR_BLOCKED_BY_CLIENT');noNetwork.consoleProblems.length=0;}
    else{await page.waitForTimeout(500);const aborted=problem=>/e2e-safety-net-not-deployed/.test(problem.text+' '+(problem.location?.url||''));noNetwork.consoleProblems.splice(0,noNetwork.consoleProblems.length,...noNetwork.consoleProblems.filter(problem=>!aborted(problem)));}
  });
});
test.describe('explicitly approved feedback transport',()=>{
  // Receiver mocking exercises the supported offline-disabled configuration:
  // a controlling service worker can bypass page/context network interception.
  test.use({allowFeedback:true,serviceWorkers:'block'});
  test('preview and the grown-up check are required, and only scrubbed submitted entries are sent',async({page,context,noNetwork})=>{
    await page.addInitScript(()=>{
      const disableOffline=()=>{const meta=document.querySelector('meta[name="pg-offline"]');if(!meta)return false;meta.content='disabled';return true;};
      if(disableOffline())return;
      const observer=new MutationObserver(()=>{if(disableOffline())observer.disconnect();});
      observer.observe(document,{childList:true,subtree:true});
      document.addEventListener('DOMContentLoaded',()=>observer.disconnect(),{once:true});
    });
    const mocked=[];
    await context.route(/^https:\/\/script\.google(?:usercontent)?\.com\//,async route=>{
      const request=route.request(),headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'content-type'};
      mocked.push(request);
      // Native browsers may send a CORS preflight before the actual submitted
      // payload. Both are mocked; a preflight must never be mistaken for a POST.
      if(request.method()==='OPTIONS'){expect(request.postData()).toBeNull();await route.fulfill({status:204,headers,body:''});return;}
      expect(request.method()).toBe('POST');const body=JSON.parse(request.postData());
      await route.fulfill({status:200,headers,contentType:'application/json',body:JSON.stringify({ok:true,schemaVersion:1,acknowledged:body.entries.map(e=>({sessionId:e.sessionId,entryId:e.entryId,revision:e.revision}))})});
    });
    await start(page);await expect(page.locator('meta[name="pg-offline"]')).toHaveAttribute('content','disabled');expect(await page.evaluate(()=>navigator.serviceWorker.controller)).toBeNull();
    await page.locator('#pt-review-tab').click();await page.locator('#pt-feedback-fix').fill('Email ana@x.com or call 555-123-4567');await page.locator('#pt-feedback-submit').click();await expect(page.locator('#pt-feedback-preview')).toBeVisible();await expect(page.locator('#pt-feedback-preview-text')).not.toContainText('ana@x.com');expect(noNetwork.receiverRequests).toHaveLength(0);expect(mocked).toHaveLength(0);
    await page.locator('#pt-feedback-send').click();await expect(page.locator('#pt-feedback-check-status')).toContainText('tick the check first');expect(mocked).toHaveLength(0);
    // One ordinary activation of each control: keyboard, switch and screen-reader users can send (no timed hold).
    await page.locator('#pt-feedback-confirm').check();const sent=page.waitForRequest(request=>request.url().includes('/macros/')&&request.method()==='POST');await page.locator('#pt-feedback-send').press('Enter');const request=await sent;
    const body=JSON.parse(request.postData());expect(JSON.stringify(body)).not.toMatch(/ana@x\.com|555-123-4567/);expect(body.entries.every(e=>e.submitted===true)).toBe(true);await expect(page.locator('#pt-feedback-status')).toContainText('received');await expect(page.locator('#pt-feedback-thanks')).toHaveText('Thanks, feedback received');const posts=noNetwork.receiverRequests.filter(request=>request.method()==='POST');expect(posts).toHaveLength(1);expect(mocked.filter(request=>request.method()==='POST')).toHaveLength(posts.length);expect(noNetwork.receiverRequests.every(request=>['POST','OPTIONS'].includes(request.method()))).toBe(true);expect(mocked.every(request=>['POST','OPTIONS'].includes(request.method()))).toBe(true);
  });
  test('close-out Send in one tab never sends a note another tab wrote after the list was shown',async({page,context,noNetwork})=>{
    test.skip(!process.env.CI&&!(await (await page.request.get('/index.html')).text()).includes('data-endpoint="https://'),'Needs a build with a receiver address, like CI\'s dist-e2e.');
    await context.addInitScript(()=>{
      const disableOffline=()=>{const meta=document.querySelector('meta[name="pg-offline"]');if(!meta)return false;meta.content='disabled';return true;};
      if(disableOffline())return;
      const observer=new MutationObserver(()=>{if(disableOffline())observer.disconnect();});
      observer.observe(document,{childList:true,subtree:true});
      document.addEventListener('DOMContentLoaded',()=>observer.disconnect(),{once:true});
    });
    const posts=[];
    await context.route(/^https:\/\/script\.google(?:usercontent)?\.com\//,async route=>{
      const request=route.request(),headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'content-type'};
      if(request.method()==='OPTIONS'){await route.fulfill({status:204,headers,body:''});return;}
      const body=JSON.parse(request.postData());posts.push(body);
      await route.fulfill({status:200,headers,contentType:'application/json',body:JSON.stringify({ok:true,schemaVersion:1,acknowledged:body.entries.map(e=>({sessionId:e.sessionId,entryId:e.entryId,revision:e.revision}))})});
    });
    const other=await context.newPage();
    await openIntro(page,'index.html');test.skip(!(await hasCloseout(page)),CLOSEOUT_NEEDED);await typeNote(page,'Stop 3 was fun');
    await openCloseout(page,'index.html');await openIntro(other,'index.html');
    await expect(page.locator('#pt-closeout-notes')).toContainText('Stop 3 was fun');await expect(page.locator('#pt-closeout-send')).toContainText('(1)');
    await page.locator('#pt-closeout-confirm').check();
    // A child in the other tab writes a note while the grown-up is reading the list.
    await other.evaluate(()=>{const stop=document.getElementById('pt-feedback-stop');stop.value='5';stop.dispatchEvent(new Event('change',{bubbles:true}));const worked=document.getElementById('pt-feedback-worked');worked.value='Hi I am in the other tab';worked.dispatchEvent(new Event('input',{bubbles:true}));document.getElementById('pt-feedback-save-draft').click();});
    // The list is drawn again with the new note and the grown-up check cleared, so Send sends nothing yet.
    await expect(page.locator('#pt-closeout-notes')).toContainText('Hi I am in the other tab');
    await expect(page.locator('#pt-closeout-status')).toContainText('changed after this list was shown');
    await expect(page.locator('#pt-closeout-confirm')).not.toBeChecked();
    await page.locator('#pt-closeout-send').click();await expect(page.locator('#pt-closeout-status')).toContainText('tick the check first');
    expect(posts).toHaveLength(0);
    // Read again, checked and sent: exactly the listed notes leave, and focus stays in the dialog.
    await page.locator('#pt-closeout-confirm').check();await page.locator('#pt-closeout-send').click();
    await expect(page.locator('#pt-closeout-status')).toContainText('received every note on this device');
    expect(await page.evaluate(()=>!!document.activeElement.closest('#pt-closeout-dialog'))).toBe(true);
    const sent=posts.flatMap(body=>body.entries).filter(e=>e.kind==='feedback').map(e=>e.worked||e.fix).sort();
    expect(sent).toEqual(['Hi I am in the other tab','Stop 3 was fun']);
    expect(noNetwork.receiverRequests.every(request=>['POST','OPTIONS'].includes(request.method()))).toBe(true);
    await other.close();
  });
  test('Next player: Review and send now sends only this player\'s notes after the grown-up check, then the next player starts',async({page,context,noNetwork})=>{
    test.skip(!process.env.CI&&!(await (await page.request.get('/index.html')).text()).includes('data-endpoint="https://'),'Needs a build with a receiver address, like CI\'s dist-e2e.');
    await context.addInitScript(()=>{
      const disableOffline=()=>{const meta=document.querySelector('meta[name="pg-offline"]');if(!meta)return false;meta.content='disabled';return true;};
      if(disableOffline())return;
      const observer=new MutationObserver(()=>{if(disableOffline())observer.disconnect();});
      observer.observe(document,{childList:true,subtree:true});
      document.addEventListener('DOMContentLoaded',()=>observer.disconnect(),{once:true});
    });
    const posts=[];
    await context.route(/^https:\/\/script\.google(?:usercontent)?\.com\//,async route=>{
      const request=route.request(),headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'content-type'};
      if(request.method()==='OPTIONS'){await route.fulfill({status:204,headers,body:''});return;}
      const body=JSON.parse(request.postData());posts.push(body);
      await route.fulfill({status:200,headers,contentType:'application/json',body:JSON.stringify({ok:true,schemaVersion:1,acknowledged:body.entries.map(e=>({sessionId:e.sessionId,entryId:e.entryId,revision:e.revision}))})});
    });
    await openIntro(page,'index.html');const first=await page.evaluate(()=>window.PecanGroveFeedback.model.active());
    await typeNote(page,'my brother noah liked stop 3, call 404 555 0199');
    await page.locator('#pt-feedback-new-player-top').click();await page.locator('#pt-new-player-send').click();
    await expect(page.locator('#pt-new-player-review')).toBeFocused();await expect(page.locator('#pt-new-player-notes')).toContainText('call [removed]');
    await expect(page.locator('#pt-new-player-body')).toContainText('Please check these words before sending: brother noah.');
    expect((await new AxeBuilder({page}).include('#pt-new-player-dialog').analyze()).violations).toEqual([]);
    await page.locator('#pt-new-player-confirm').click();await expect(page.locator('#pt-new-player-status')).toContainText('tick the check first');expect(posts).toHaveLength(0);
    await page.locator('#pt-new-player-check').check();const reloaded=page.waitForEvent('load');await page.locator('#pt-new-player-confirm').click();await reloaded;await afterReload(page);
    const sent=posts.flatMap(body=>body.entries);
    expect(sent.every(e=>e.sessionId===first),'only the leaving player\'s records').toBe(true);
    expect(sent.filter(e=>e.kind==='feedback').map(e=>e.fix)).toEqual(['my brother noah liked stop 3, call [removed]']);
    expect(await page.evaluate(()=>window.PecanGroveFeedback.model.active())).not.toBe(first);
    expect(noNetwork.receiverRequests.every(request=>['POST','OPTIONS'].includes(request.method()))).toBe(true);
  });
});

test.describe('separately built family flavor',()=>{
  test.use({baseURL:process.env.PG_FAMILY_BASE_URL||'http://127.0.0.1:8892'});
  test('family flavor has no feedback or endpoint',async({page,noNetwork})=>{
    test.skip(!process.env.PG_FAMILY_BASE_URL,'Set PG_FAMILY_BASE_URL to run the separately built family flavor. Structural family tests always run in Python.');
    await page.goto('/');await expect(page.locator('html')).toHaveAttribute('data-flavor','family');await expect(page.locator('#pt-feedback')).toHaveCount(0);await expect(page.locator('#pt-review-tab')).toHaveCount(0);expect(await page.content()).not.toContain('script.google.com');expect(noNetwork.receiverRequests).toHaveLength(0);
    // The family copy never has the facilitator's close-out or its code.
    await expect(page.locator('#pt-closeout-open')).toHaveCount(0);expect(await page.content()).not.toMatch(/data-closeout|closeout=/);
  });
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
    const geometry={pan:{x:bounds.x,y:bounds.y,width:bounds.width,height:bounds.height,scrollWidth:pan.scrollWidth,clientWidth:pan.clientWidth},canvas:{width:canvas.getBoundingClientRect().width,height:canvas.getBoundingClientRect().height,scrollWidth:canvas.scrollWidth,transform:getComputedStyle(canvas).transform},viewport:{width:innerWidth,height:innerHeight,fullscreen:(document.fullscreenElement||document.webkitFullscreenElement)?.id||null}};
    return{count:discs.length,scroll:pan.scrollWidth>pan.clientWidth+1,outside:discs.map((box,index)=>({box,index})).filter(({box})=>box.width<43.9||box.height<43.9||box.left<bounds.left-.5||box.right>bounds.right+.5||box.top<bounds.top-.5||box.bottom>bounds.bottom+.5).map(({index})=>index+1),labels,geometry};
   });
   expect(result.count).toBe(15);expect(result.scroll,`${width}px horizontal map overflow: ${JSON.stringify(result.geometry)}`).toBe(false);expect(result.outside,`${width}px clipped or undersized discs: ${JSON.stringify(result.geometry)}`).toEqual([]);expect(result.labels,`${width}px labels cover a different disc`).toEqual([]);
  }
  noNetwork.assertClean();
 });
}

async function probeLabels(page,selector){await settleFiniteAnimations(page,expect);const labels=await renderedLabelContrast(page,selector);expect(labels.length,`Visible labels for ${selector}`).toBeGreaterThan(0);for(const label of labels)expect(label.ratio,`${label.text}: rendered contrast`).toBeGreaterThanOrEqual(4.5);}
// Keep every rendered label, sample point, state and viewport. Separate scene
// cases avoid treating screenshot throughput as an app-response timeout.
for(const {lang,file}of languages){
 test(`${lang}: rendered map label contrast`,async({page})=>{
  test.setTimeout(120000);await start(page,file);await page.evaluate(()=>window.PecanGroveEngine.settings.update({calm:true}));
  await page.locator('.cb-stop[data-stop-n="1"]').first().focus();await probeLabels(page,'.cb-stop__plate');
 });
 test(`${lang}: rendered Stop1 label contrast in every selected finding state`,async({page})=>{
  test.setTimeout(120000);await start(page,file);await page.evaluate(()=>window.PecanGroveEngine.settings.update({calm:true}));
  await stop(page,1);await startStop1Today(page);await probeLabels(page,'.cb-s01-tag');
  for(const index of [0,5,10]){await page.locator(`.cb-s01-spot[data-spot="${index}"]`).click();await page.locator('.cb-callout .cb-btn').click();await probeLabels(page,'.cb-s01-tag');}
 });
 test(`${lang}: rendered Stop2 intro, play and narrow label contrast`,async({page})=>{
  test.setTimeout(120000);await start(page,file);await page.evaluate(()=>window.PecanGroveEngine.settings.update({calm:true}));
  await stop(page,2);await probeLabels(page,'.cb-s02-nb__name');await page.locator('.cb-s02-intro .cb-btn--go').click();await probeLabels(page,'.cb-s02-nb__name');
  for(const viewport of [{width:360,height:640},{width:600,height:500}]){await page.setViewportSize(viewport);await probeLabels(page,'.cb-s02-nb__name');}
 });
}
