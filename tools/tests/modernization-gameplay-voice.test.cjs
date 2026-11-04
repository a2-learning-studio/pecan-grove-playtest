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
// Decision D14 (2026-11-01): a stop's intro must show every word its start clip says, or the clip stops matching or says
// more than the screen (Stops 6, 10 and 11 drifted on 13 Oct 2026). The screen may say more (Stops 12 and 13).
const START_CLIPS=['notice-the-signs','ask-a-good-question','fact-or-rumor','map-what-could-change','who-decides','speak-up-kindly','disagree-kindly','include-every-voice','match-a-fix','weigh-the-tradeoffs','make-a-fair-deal','spread-the-word-right'];
for(const lang of ['en','es'])test(`${lang}: every stop intro with a start clip shows every word the clip says after its title, in order`,async()=>{
  const r=await fullCore(lang,42,false,null,{voice:true});
  const tok=word=>word.toLowerCase().replace(/[^0-9a-záéíóúüñ']/g,'');
  const drift=[];
  try{
    const stops=r.core.getAPI().STOPS;
    for(const id of START_CLIPS){
      const n=stops.find(stop=>stop.id===id).n,file=`${lang}/s${String(n).padStart(2,'0')}-start.mp3`,clip=r.w.CB_VOICE.clips[file];
      assert.ok(clip,`${file} exists`);
      await r.core.startStop(id);await r.tick();
      const main=r.main(),voiced=main.querySelectorAll(`[data-cb-voiced="${file}"]`);
      if(!voiced.length||!main.querySelector('.cb-vbtn')){drift.push(`${file}: the clip does not attach to the intro`);continue;}
      const shown=[...main.querySelectorAll(`[data-cb-voiced="${file}"] .cb-w`)].map(node=>tok(node.textContent)).filter(Boolean);
      const spoken=clip.s.split(' ').slice(clip.h).map(tok).filter(Boolean);
      let at=0;const missing=spoken.filter(word=>{const found=shown.indexOf(word,at);if(found<0)return true;at=found+1;return false;});
      if(missing.length)drift.push(`${file}: said but not shown, in order: ${missing.join(' ')}`);
    }
  }finally{r.close();}
  assert.deepEqual(drift,[]);
});
