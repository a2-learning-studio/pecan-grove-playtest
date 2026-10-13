import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { JSDOM } from "jsdom";
import { I18n } from "../../assets/games/community-builders/engine/i18n.js";
import { HUD } from "../../assets/games/community-builders/engine/hud.js";
import { Tooltips } from "../../assets/games/community-builders/engine/tooltips.js";
import { enhanceTitle } from "../../assets/games/community-builders/engine/title-menu.js";
import { badgeIcon, badgeHint } from "../../assets/games/community-builders/engine/badge-art.js";
import { BADGE_IDS } from "../../assets/games/community-builders/engine/badges.js";
import { showResultBadges, observeFeedback } from "../../assets/games/community-builders/engine/result-presentation.js";
import { transitionScene, animateScene } from "../../assets/games/community-builders/engine/transitions.js";

function fixture(markup = "") {
  const dom = new JSDOM("<main>" + markup + "</main>", { url: "https://example.test/" });
  const old = Object.getOwnPropertyDescriptor(globalThis, "document");
  Object.defineProperty(globalThis, "document", { value: dom.window.document, configurable: true });
  dom.window.HTMLDialogElement.prototype.showModal = function() { this.open = true; };
  dom.window.HTMLDialogElement.prototype.close = function() { this.open = false; this.dispatchEvent(new dom.window.Event("close")); };
  const i18n = new I18n("en", JSON.parse(fs.readFileSync(new URL("../../assets/games/community-builders/engine/locales/en.json", import.meta.url))));
  return { root: dom.window.document.querySelector("main"), w: dom.window, i18n, close() { if (old) Object.defineProperty(globalThis,"document",old);else delete globalThis.document;dom.window.close(); } };
}

test("Continue shows the real saved animal, next stop and stars; New/Load/Settings keep their actions", () => {
  const r=fixture('<div class="cb-hero__copy"><button class="cb-btn--onstage">Grown-ups</button></div>');
  try {
    const calls=[],player={stops:{first:{best:90,rounds:1}},updated:new Date().toISOString()},store={current:"fox",players:{fox:player}};
    const api=()=>({ANIMALS:[{id:"fox",name:"Fox"}],STOPS:[{id:"first",n:1},{id:"second",n:2}],animalFace:()=>document.createElement("svg")});
    const options={root:r.root,slots:{store:()=>store,select:id=>calls.push(id)},api,i18n:r.i18n,resumeCurrent:()=>calls.push("resume"),openSlots:(_,isNew)=>calls.push(isNew?"new":"load"),settings:{open:()=>calls.push("settings")}};
    enhanceTitle(options);enhanceTitle(options);
    assert.equal(r.root.querySelectorAll(".cb-engine-title-actions").length,1);
    const buttons=[...r.root.querySelectorAll(".cb-engine-title-actions button")];
    assert.match(buttons[0].textContent,/Fox.*Stop 2 next.*3 stars/);
    assert.ok(buttons[0].querySelector("svg"));
    buttons.slice(0,4).forEach(button=>button.click());
    assert.deepEqual(calls,["fox","resume","new","load","settings"]);
  } finally { r.close(); }
});

test("every badge has distinct SVG geometry and a concrete locked hint; results show earned badges once", () => {
  const r=fixture('<section class="cb-card"><div class="cb-card__body"></div></section>');
  try {
    const paths=BADGE_IDS.map(id=>badgeIcon(id).querySelector("path").getAttribute("d"));
    assert.equal(new Set(paths).size,25);
    for(const id of BADGE_IDS)assert.notEqual(badgeHint(r.i18n,id),"badgeHint."+id);
    showResultBadges(r.root,["good-question","three-stars"],r.i18n);
    showResultBadges(r.root,["good-question"],r.i18n);
    assert.equal(r.root.querySelectorAll(".cb-result-badge").length,2);
    assert.match(r.root.textContent,/New badge/);
  }finally { r.close(); }
});

test("HUD More invokes real tool actions and restores focus scope; only newly earned stars are announced", t => {
  t.mock.timers.enable({apis:["Date","setTimeout"],now:1000});
  const r=fixture('<div class="cb-stophud"><div class="cb-stophud__tools"><button class="cb-stophud__back">Map</button><button aria-label="Sound">S</button></div></div>');
  let hud;
  try {
    const calls=[],player={stops:{one:{best:90}},badges:{}},tools=r.root.querySelector(".cb-stophud__tools");
    tools.lastChild.onclick=()=>calls.push("sound");
    hud=new HUD({root:r.root,core:()=>({getState:()=>({stopId:"one"})}),slots:{current:()=>player},pause:{control:()=>document.createElement("button")},i18n:r.i18n,focus:{push:()=>calls.push("push"),pop:()=>calls.push("pop")}});
    hud.openMore(tools.lastChild,tools,"Best: 3 / 3");
    assert.equal(hud.dialog.querySelectorAll("button").length,2);
    hud.dialog.querySelector("button").click();
    assert.deepEqual(calls,["push","pop","sound"]);
    hud.earned(90,70);assert.match(hud.live.textContent,/1 star/);
    hud.earned(90,90);assert.match(hud.live.textContent,/1 star/);
    hud.earned(70,0);assert.match(hud.live.textContent,/1 star/);
    t.mock.timers.tick(1499);assert.match(hud.live.textContent,/1 star/);
    t.mock.timers.tick(1);assert.match(hud.live.textContent,/2 stars/);
  }finally { hud?.destroy();r.close(); }
});

test("visible tooltips appear after 400ms on keyboard focus and dismiss without losing existing descriptions", t=>{
  t.mock.timers.enable({apis:["setTimeout"]});
  const r=fixture('<button aria-label="Pause" aria-describedby="help">P</button>'),tooltips=new Tooltips(r.root);
  try {
    const b=r.root.querySelector("button");b.focus();t.mock.timers.tick(399);assert.equal(r.root.querySelector('[role="tooltip"]'),null);
    t.mock.timers.tick(1);assert.equal(r.root.querySelector('[role="tooltip"]').textContent,"Pause");assert.match(b.getAttribute("aria-describedby"),/^help cb-tooltip/);
    b.dispatchEvent(new r.w.KeyboardEvent("keydown",{key:"Escape",bubbles:true}));
    assert.equal(b.getAttribute("aria-describedby"),"help");assert.equal(r.root.querySelector('[role="tooltip"]'),null);
    b.dispatchEvent(new r.w.Event("pointerover",{bubbles:true}));t.mock.timers.tick(400);b.dispatchEvent(new r.w.Event("pointerdown",{bubbles:true}));assert.equal(r.root.querySelector('[role="tooltip"]'),null);
  }finally { tooltips.destroy();r.close(); }
});

test("scene swaps expose controls before animations finish; Calm never passes transforms to animation",async()=>{
  const r=fixture(),calls=[];
  try{
    const ctx={root:r.root,document:r.w.document,motionAllowed:()=>true};
    ctx.document.startViewTransition=render=>{calls.push("start");render();return {updateCallbackDone:Promise.resolve(),finished:new Promise(()=>{})};};
    await transitionScene(ctx,()=>{r.root.append(document.createElement("button"));calls.push("render");},"stop");
    assert.deepEqual(calls,["start","render"]);assert.ok(r.root.querySelector("button"));
    let frames,options;r.root.animate=(a,b)=>{frames=a;options=b;return {cancel(){}};};
    ctx.motionAllowed=()=>false;animateScene(ctx,r.root);assert.equal(options.duration,120);assert.equal(frames.some(frame=>"transform" in frame),false);
    await transitionScene(ctx,()=>calls.push("calm"));assert.deepEqual(calls,["start","render","calm"]);
  }finally{r.close();}
});

test("feedback effects observe actual new successes and tries once",async()=>{
  const r=fixture(),calls=[],disconnect=observeFeedback(r.root,{pulse:()=>calls.push("pulse"),nudge:()=>calls.push("nudge")},{play:key=>calls.push(key)});
  try{
    for(const kind of ["ok","try"]){const node=document.createElement("div");node.dataset.cbFeedback=kind;r.root.append(node);}
    await new Promise(resolve=>queueMicrotask(resolve));assert.deepEqual(calls,["pulse","ok","nudge","try"]);
    r.root.firstChild.append(document.createElement("span"));await new Promise(resolve=>queueMicrotask(resolve));assert.equal(calls.length,4);
  }finally{disconnect();r.close();}
});
