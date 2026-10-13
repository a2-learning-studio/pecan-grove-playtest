/* One-time lexical migration and ongoing audit. JSON owns text; authored IDs and
   classifications stay in JS. No source expression is evaluated by this tool. */
const fs=require('node:fs'),path=require('node:path'),espree=require('espree');
const root=path.join(__dirname,'..'),game=path.join(root,'assets/games/community-builders');
const targets=fs.readdirSync(path.join(game,'stops')).filter(file=>/^\d\d-.*\.js$/.test(file)).map(file=>({file:path.join(game,'stops',file),namespace:'stop-'+file.slice(0,2),host:'window'}));
targets.push({file:path.join(game,'data/catalog.js'),namespace:'core',host:'ctx.window'},
  {file:path.join(game,'engine/core/runtime.js'),namespace:'core',host:'ctx.window'});
const natural=text=>typeof text==='string'&&!/^(?:var\(|<|#[A-Fa-f0-9]+$)/.test(text)&&(/\s|[.?!,;:¿¡]|[^\x00-\x7f]/.test(text)||/^[A-Z][a-z]/.test(text));
const literal=node=>node?.type==='Literal'&&typeof node.value==='string';
function children(node){return Object.entries(node).filter(([key])=>!['range','loc'].includes(key)).flatMap(([,value])=>Array.isArray(value)?value.filter(child=>child?.type):value?.type?[value]:[]);}
function migrate(source,namespace,host,en,es){
  let count=0,next=Math.max(0,...Object.keys(en.bank||{}).map(key=>Number(key.slice(1))||0));
  en.bank||={};es.bank||={};
  const existing=new Map(Object.keys(en.bank).map(key=>[JSON.stringify([en.bank[key],es.bank[key]]),key]));
  function bank(a,b){const signature=JSON.stringify([a,b]);let key=existing.get(signature);if(!key){key='b'+String(++next).padStart(4,'0');en.bank[key]=a;es.bank[key]=b;existing.set(signature,key);}count++;return 'bank.'+key;}
  function pair(a,b){return `${host}.CBLocale.pair(${JSON.stringify(namespace)},${JSON.stringify(bank(a,b))})`;}
  // Repeat because a mixed tuple may itself contain nested bilingual text arrays.
  for(let pass=0;pass<20;pass++){
    const ast=espree.parse(source,{ecmaVersion:'latest',sourceType:'module',range:true}),edits=[],pairFunctions=new Map();
    function declarations(node){if(node.type==='FunctionDeclaration'&&node.id){const index=node.params.findIndex(p=>p.type==='Identifier'&&p.name==='en');if(index>=0&&node.params[index+1]?.name==='es')pairFunctions.set(node.id.name,index);}children(node).forEach(declarations);}
    declarations(ast);
    function visit(node){
      if(node.type==='CallExpression'&&node.callee.type==='Identifier'&&pairFunctions.has(node.callee.name)){
        const index=pairFunctions.get(node.callee.name),a=node.arguments[index],b=node.arguments[index+1];
        if(literal(a)&&literal(b)){edits.push({range:[a.range[0],b.range[1]],text:'...'+pair(a.value,b.value)});return;}
      }
      if(node.type==='ArrayExpression'){
        let segments=[],raw=[],found=false;
        const flush=()=>{if(raw.length){segments.push('['+raw.join(',')+']');raw=[];}};
        for(let i=0;i<node.elements.length;i++){
          const a=node.elements[i],b=node.elements[i+1];
          if(literal(a)&&literal(b)&&natural(a.value)&&natural(b.value)){
            flush();segments.push(pair(a.value,b.value));found=true;i++;
          }else raw.push(a?source.slice(...a.range):'');
        }
        if(found){flush();edits.push({range:node.range,text:segments.length===1?segments[0]:'[].concat('+segments.join(',')+')'});return;}
      }
      if(node.type==='ObjectExpression'){
        const a=node.properties.find(p=>p.type==='Property'&&(p.key.name||p.key.value)==='en'&&literal(p.value)),b=node.properties.find(p=>p.type==='Property'&&(p.key.name||p.key.value)==='es'&&literal(p.value));
        if(a&&b){const lookup=pair(a.value.value,b.value.value);edits.push({range:a.value.range,text:lookup+'[0]'},{range:b.value.range,text:lookup+'[1]'});}
      }
      if(node.type==='ConditionalExpression'&&literal(node.consequent)&&literal(node.alternate)&&node.test.type==='BinaryExpression'&&node.test.operator==='==='&&node.test.right.type==='Literal'&&['en','es'].includes(node.test.right.value)){
        const esFirst=node.test.right.value==='es',a=esFirst?node.alternate.value:node.consequent.value,b=esFirst?node.consequent.value:node.alternate.value;
        if(natural(a)&&natural(b)){const language=source.slice(...node.test.left.range);edits.push({range:node.range,text:`${host}.CBLocale.t(${JSON.stringify(namespace)},${language},${JSON.stringify(bank(a,b))})`});return;}
      }
      children(node).forEach(visit);
    }
    visit(ast);if(!edits.length)break;
    edits.sort((a,b)=>b.range[0]-a.range[0]);for(const edit of edits)source=source.slice(0,edit.range[0])+edit.text+source.slice(edit.range[1]);
  }
  return {source,count};
}
if(require.main===module){
  const apply=process.argv.includes('--apply'),skip=new Set(process.argv.filter(arg=>arg.startsWith('--skip=')).map(arg=>arg.slice(7)));
  let total=0;
  for(const target of targets){if(skip.has(path.basename(target.file).slice(0,2)))continue;
    const enFile=path.join(game,'locales/en',target.namespace+'.json'),esFile=path.join(game,'locales/es',target.namespace+'.json');
    const en=JSON.parse(fs.readFileSync(enFile,'utf8')),es=JSON.parse(fs.readFileSync(esFile,'utf8')),source=fs.readFileSync(target.file,'utf8');
    const result=migrate(source,target.namespace,target.host,en,es);total+=result.count;
    if(apply&&result.source!==source){fs.writeFileSync(target.file,result.source);fs.writeFileSync(enFile,JSON.stringify(en,null,2)+'\n');fs.writeFileSync(esFile,JSON.stringify(es,null,2)+'\n');}
    console.log(path.relative(root,target.file).replaceAll('\\','/')+': '+result.count+' text pairs '+(apply?'migrated':'remaining'));
  }
  if(!apply&&total)process.exitCode=1;
}
module.exports={migrate,natural};
