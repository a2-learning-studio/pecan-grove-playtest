const test=require('node:test'),assert=require('node:assert/strict');
const {fullCore}=require('./modernization-gameplay-fixture.cjs');
test('Stop2 measures compact embedded space, reserves strip height and keeps floating Ask away from artwork',async()=>{
 const r=await fullCore();try{
  const stage=r.root;
  let width=360,height=640,stripHeight=80,artBottom=700;const observers=[];
  Object.defineProperty(r.w,'innerHeight',{get:()=>height,configurable:true});Object.defineProperty(r.w,'innerWidth',{get:()=>width,configurable:true});Object.defineProperty(stage,'clientHeight',{get:()=>height,configurable:true});
  r.w.ResizeObserver=class{constructor(cb){this.cb=cb;this.disconnected=false;observers.push(this);}observe(){}disconnect(){this.disconnected=true;}};
  const rect=(left,top,right,bottom)=>({left,top,right,bottom,width:right-left,height:bottom-top});
  r.w.HTMLElement.prototype.getBoundingClientRect=function(){if(this===stage)return rect(0,0,width,height);if(this.classList.contains('cb-s02-strip'))return rect(12,800,width-12,800+stripHeight);if(this.classList.contains('cb-s02-ask-float'))return rect(width-68,height-68,width-12,height-12);if(this.classList.contains('cb-s02-art'))return rect(12,0,width-12,artBottom);return rect(0,0,0,0);};
  await r.core.startStop('ask-a-good-question');r.main().querySelector('.cb-btn--go').click();
  const floating=r.main().querySelector('.cb-s02-ask-float');assert.ok(floating);assert.equal(stage.style.getPropertyValue('--s02-strip-h'),'80px');assert.ok(r.main().querySelector('.is-s02-compact'));assert.equal(floating.hidden,true,'the shortcut hides when its pinned rectangle intersects art');
  artBottom=200;r.w.document.dispatchEvent(new r.w.Event('scroll'));assert.equal(floating.hidden,false,'the 56px shortcut appears once the artwork clears it');
  height=500;observers.at(-1).cb();assert.equal(stage.hasAttribute('data-s02-short'),true,'a short embedded container disables sticky speech');
  width=800;height=900;stripHeight=120;observers.at(-1).cb();assert.equal(r.main().querySelector('.is-s02-compact'),null);assert.equal(floating.hidden,true);assert.equal(stage.style.getPropertyValue('--s02-strip-h'),'120px');
  const stopObserver=observers.at(-1);r.core.showMap();assert.equal(stopObserver.disconnected,true,'the measured observer is disposed when leaving the stop');assert.equal(stage.style.getPropertyValue('--s02-strip-h'),'');assert.equal(stage.hasAttribute('data-s02-layout'),false);
 }finally{r.close();}
});
