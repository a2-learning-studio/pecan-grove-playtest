const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.join(__dirname,'../../assets/games/community-builders');
const source=fs.readFileSync(path.join(base,'locales/catalog.js'),'utf8').replace(/root\.CB_LOCALES = .*;/,'root.CB_LOCALES = {en:{},es:{}};');
function runtime(fetch){const window={fetch,PG_ASSET_MAP:{'assets/games/community-builders/locales/en/stop-07.json':'hashed-en.json'}};vm.runInNewContext(source,{window,Intl});return window;}
test('Production copy loader fetches only the selected bilingual namespace once and uses hashed URLs',async()=>{
 const requests=[];const window=runtime(async url=>{requests.push(url);return {ok:true,json:async()=>({copy:url})};});
 assert.deepEqual(requests,[]);const first=window.CBLocale.load('stop-07');assert.equal(window.CBLocale.load('stop-07'),first);await first;
 assert.deepEqual(requests,['hashed-en.json','assets/games/community-builders/locales/es/stop-07.json']);
 assert.equal(window.CB_LOCALES.en['stop-06'],undefined);assert.equal(window.CB_LOCALES.en['stop-07'].copy,'hashed-en.json');
 await window.CBLocale.load('stop-07');assert.equal(requests.length,2);
 await assert.rejects(window.CBLocale.load('../private'));assert.equal(requests.length,2);
});
test('Failed namespace load is atomic and retryable instead of caching an incomplete language bank',async()=>{
 let fail=true,count=0;const window=runtime(async()=>({ok:!fail,json:async()=>({text:'safe'})}));
 await assert.rejects(window.CBLocale.load('stop-02'));assert.equal(window.CB_LOCALES.en['stop-02'],undefined);assert.equal(window.CB_LOCALES.es['stop-02'],undefined);
 fail=false;window.fetch=async()=>{count++;return {ok:true,json:async()=>({text:'retried'})};};await window.CBLocale.load('stop-02');assert.equal(count,2);assert.equal(window.CB_LOCALES.es['stop-02'].text,'retried');
});
test('Lazy stop manifest carries authored step counts and resolves all 15 module/style pairs',()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(base,'stops/manifest.json'),'utf8'));
 assert.equal(new Set(manifest.map(row=>row.id)).size,15);assert.deepEqual(manifest.map(row=>row.n),Array.from({length:15},(_,i)=>i+1));
 assert.deepEqual(manifest.map(row=>row.steps.length),[2,4,3,5,5,5,2,2,5,5,3,3,2,2,3]);
 for(const row of manifest)for(const name of [row.file,row.css])assert.equal(fs.existsSync(path.join(base,'stops',name)),true,name);
});
