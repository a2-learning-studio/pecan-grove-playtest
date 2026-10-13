const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {migrate}=require('../migrate-content-banks.cjs');
const game=path.join(__dirname,'../../assets/games/community-builders');
test('All authored stop and core content pairs are JSON-owned and migration is idempotent',()=>{
 const targets=fs.readdirSync(path.join(game,'stops')).filter(f=>/^\d\d-.*\.js$/.test(f)).map(file=>({file:'stops/'+file,namespace:'stop-'+file.slice(0,2),host:'window'}));
 targets.push({file:'data/catalog.js',namespace:'core',host:'ctx.window'},{file:'engine/core/runtime.js',namespace:'core',host:'ctx.window'});
 for(const target of targets){const source=fs.readFileSync(path.join(game,target.file),'utf8'),en=JSON.parse(fs.readFileSync(path.join(game,'locales/en',target.namespace+'.json'))),es=JSON.parse(fs.readFileSync(path.join(game,'locales/es',target.namespace+'.json'))),before=JSON.stringify([en,es]),result=migrate(source,target.namespace,target.host,en,es);assert.equal(result.count,0,target.file);assert.equal(result.source,source,target.file);assert.equal(JSON.stringify([en,es]),before,'audit does not mutate catalog');}
});
test('Lexical migration preserves mixed tuple IDs, classifications, counts, factory parameters and mutable pairs',()=>{
 const en={},es={},source='var rows=[["source-id","Clear evidence.","Evidencia clara.","fact",7,["A claim.","Una afirmación."]]]; var names={id:"fox",en:"Friendly fox",es:"Zorro amable"};function K(icon,en,es,who,fix){return {icon,t:[en,es],who,fix};}var card=K("tree","A tree stays.","Un árbol queda.",["lee"],"water");';
 const result=migrate(source,'test','window',en,es);assert.equal(result.count,4);
 const CBLocale={pair(ns,key){assert.equal(ns,'test');const k=key.split('.')[1];return [en.bank[k],es.bank[k]];}},context={window:{CBLocale}};vm.runInNewContext(result.source,context);
 assert.equal(JSON.stringify(context.rows),JSON.stringify([['source-id','Clear evidence.','Evidencia clara.','fact',7,['A claim.','Una afirmación.']]]));assert.equal(JSON.stringify(context.names),JSON.stringify({id:'fox',en:'Friendly fox',es:'Zorro amable'}));assert.equal(JSON.stringify(context.card),JSON.stringify({icon:'tree',t:['A tree stays.','Un árbol queda.'],who:['lee'],fix:'water'}));
});
test('Generated pair helper reads authoritative JSON and returns independent mutable pairs',()=>{
 const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(game,'locales/catalog.js'),'utf8'),context);
 const namespace='stop-13',key=Object.keys(context.window.CB_LOCALES.en[namespace].bank)[0],one=context.window.CBLocale.pair(namespace,'bank.'+key),two=context.window.CBLocale.pair(namespace,'bank.'+key);
 assert.notEqual(one,two);one[0]='changed';assert.notEqual(two[0],'changed');assert.equal(two[1],context.window.CB_LOCALES.es[namespace].bank[key]);assert.throws(()=>context.window.CBLocale.pair(namespace,'bank.missing'));
});
