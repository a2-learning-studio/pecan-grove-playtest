const test = require('node:test'), assert = require('node:assert/strict');
const { fullCore } = require('./modernization-gameplay-fixture.cjs');
async function voiceFixture() {
  const media=[];
  const r = await fullCore('en',42,false,null,{voice:true,audioFactory:w=>class extends w.EventTarget {
    constructor(src) { super();this.src=src;this.currentTime=0;this.paused=true;media.push(this); }
    pause() { this.paused=true; }
    play() { this.paused=false;return Promise.resolve(); }
  }});
  try {
  await r.core.startStop('notice-the-signs');await r.tick();
  const replay=r.main().querySelector('.cb-vbtn');assert.ok(replay,'the real voice index finds a narrated intro line');replay.click();await r.tick();
  const active=media.at(-1);assert.ok(active);assert.match(active.src,/en\/s01-start\.mp3$/);
  const clip=r.w.CB_VOICE.clips['en/s01-start.mp3'];
  const sentenceWord=clip.s.split(' ').findIndex((word,index)=>index>5&&/[.!?]$/.test(word));
  active.currentTime=(clip.t[sentenceWord+1]+200)/1000;
  return {r,media,active};
  } catch(error) { r.close();throw error; }
}
test('Voice restoration seeks to the same point and live language switching restarts its current sentence',async()=>{
  const {r,media,active}=await voiceFixture();try{
    const original=JSON.parse(JSON.stringify(r.core.snapshot()));assert.ok(original.voice.line>0,'the clip is beyond its first sentence');
    assert.equal(await r.core.resume(original),true);await r.tick();
    assert.notEqual(media.at(-1),active);assert.equal(media.at(-1).currentTime,original.voice.time,'same-language restoration keeps the media clock');assert.equal(media.at(-1).paused,false);
    assert.equal(await r.core.setLanguage('es'),true);await r.tick();
    const translated=r.core.snapshot().voice;assert.ok(translated);assert.equal(translated.language,'es');assert.equal(translated.file,original.voice.file);assert.equal(translated.line,original.voice.line,'the corresponding translated sentence is active');assert.ok(media.at(-1).currentTime>0,'the translated clip does not start over at zero');assert.match(media.at(-1).src,/es\/s01-start\.mp3$/);
  }finally{r.close();}
});
test('A language change while paused defers narration until Resume',async()=>{
  const {r,media}=await voiceFixture();try{
    r.core.pause();const before=media.length;assert.equal(media.at(-1).paused,true);
    assert.equal(await r.core.setLanguage('es'),true);await r.tick();
    assert.equal(media.length,before,'paused language switching does not start another clip');
    r.core.resumePlay();await r.tick();assert.ok(media.length>before);assert.equal(media.at(-1).paused,false);assert.match(media.at(-1).src,/es\/s01-start\.mp3$/);
  }finally{r.close();}
});
