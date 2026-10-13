const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const directory=path.join(__dirname,'../../assets/games/community-builders/locales');
function keys(value,key='',result=[]){if(value&&value.$parts){result.push(key+':formatter('+value.$args.join(',')+')');return result;}if(Array.isArray(value)){value.forEach((v,i)=>keys(v,key+'.'+i,result));return result;}if(value&&typeof value==='object'){Object.keys(value).forEach(k=>keys(value[k],key+'.'+k,result));return result;}assert.notEqual(value,'',key+' must not be empty');result.push(key+':'+typeof value);return result;}
test('All 16 bilingual game JSON namespaces have matching keys, formatter arguments and placeholder names',()=>{
 const files=fs.readdirSync(path.join(directory,'en')).filter(f=>f.endsWith('.json'));assert.equal(files.length,16);
 assert.deepEqual(files.sort(),fs.readdirSync(path.join(directory,'es')).filter(f=>f.endsWith('.json')).sort());
 for(const file of files){const a=JSON.parse(fs.readFileSync(path.join(directory,'en',file))),b=JSON.parse(fs.readFileSync(path.join(directory,'es',file)));assert.deepEqual(keys(a).sort(),keys(b).sort(),file);const placeholders=o=>JSON.stringify(o).match(/\{[A-Za-z][\w.-]*\}/g)?.sort()||[];assert.deepEqual(placeholders(a),placeholders(b),file+' placeholders');}
});
test('Generated catalog matches the authored JSON and formats dynamic game copy without evaluation',()=>{
 const c=vm.createContext({window:{},Intl});vm.runInContext(fs.readFileSync(path.join(directory,'catalog.js'),'utf8'),c);
 for(const lang of ['en','es'])for(const file of fs.readdirSync(path.join(directory,lang)).filter(name=>name.endsWith('.json'))){assert.deepEqual(JSON.parse(JSON.stringify(c.window.CB_LOCALES[lang][file.slice(0,-5)])),JSON.parse(fs.readFileSync(path.join(directory,lang,file))),lang+'/'+file);}
 assert.equal(c.window.CBLocale.list(['A','B'],'en'),'A and B');
 assert.equal(c.window.CBLocale.list(['A','B'],'es'),'A y B');
});
