import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const ENGLISH = {a:1,any:2,area:3,are:1,because:2,business:2,different:3,every:2,everyone:3,everything:3,family:3,fire:1,give:1,have:1,hour:1,hours:1,idea:3,ideas:3,library:3,libraries:3,our:1,people:2,pecan:2,question:2,questions:2,quiet:2,science:2,some:1,the:1,their:1,there:1,these:1,they:1,through:1,were:1,where:1,who:1,you:1,your:1};

export function syllablesEnglish(word) {
  let text=word.toLowerCase().normalize('NFD').replace(/[^a-z]/g,'');
  if (ENGLISH[text]) return ENGLISH[text];
  if (text.length<=3) return 1;
  text=text.replace(/([^dt])ed$/,'$1').replace(/([^aeiou])es$/,'$1');
  if (!/[^aeiou]le$/.test(text)) text=text.replace(/e$/,'');
  return Math.max(1,(text.match(/[aeiouy]+/g)||[]).length);
}
export function syllablesSpanish(word) {
  const text=word.toLowerCase().replace(/([qg])u(?=[eiéí])/g,'$1').replace(/h/g,'').replace(/y$/,'i');
  let count=0;
  for (const [group] of text.matchAll(/[aeiouáéíóúü]+/g)) {
    count++;
    for (let i=1;i<group.length;i++) {
      const a=group[i-1],b=group[i];
      if (/[íú]/.test(a+b)||(/[aeoáéó]/.test(a)&&/[aeoáéó]/.test(b))||a===b) count++;
    }
  }
  return Math.max(1,count);
}
export function words(text) { return text.match(/[\p{L}]+(?:['’][\p{L}]+)*|\d+(?:[.,]\d+)?/gu)||[]; }
export function sentences(text) {
  const normalized=text.replace(/\b(Mr|Mrs|Ms|Dr|Sr|Sra|St)\./g,'$1').replace(/(\d)\.(\d)/g,'$1,$2');
  return normalized.split(/[.!?]+["'”’]*/).map(part=>words(part)).filter(part=>part.length);
}
export function measure(text,language='en') {
  const cleaned=String(text).replace(/\{[\w.-]+\}/g,'').replace(/<[^>]*>/g,''),tokens=words(cleaned),parts=sentences(cleaned);
  const wordCount=tokens.length,sentenceCount=parts.length,syllableCount=tokens.reduce((n,word)=>n+(language==='es'?syllablesSpanish(word):syllablesEnglish(word)),0);
  if (!wordCount) return {wordCount:0,sentenceCount:0,syllableCount:0,longestSentence:0,metric:language==='es'?'Fernandez-Huerta estimate':'Flesch-Kincaid grade estimate',score:null,flags:[]};
  const averageSentence=wordCount/Math.max(1,sentenceCount),averageSyllables=syllableCount/wordCount;
  const score=language==='es'?206.84-60*averageSyllables-1.02*averageSentence:0.39*averageSentence+11.8*averageSyllables-15.59;
  const longestSentence=Math.max(...parts.map(part=>part.length)),flags=[];
  if(language==='es'?score<70:score>5)flags.push(language==='es'?'FH below 70':'FK grade above 5');
  if(longestSentence>15)flags.push('sentence above 15 words');
  return {wordCount,sentenceCount,syllableCount,longestSentence,metric:language==='es'?'Fernandez-Huerta estimate':'Flesch-Kincaid grade estimate',score:Math.round(score*10)/10,shortSample:wordCount<20,flags};
}
export function extractStrings(value,key='',out=[]) {
  if (typeof value==='string') { if(value.trim())out.push({key,text:value,templated:/\{[\w.-]+\}/.test(value)}); }
  else if(value&&typeof value==='object') {
    if(Array.isArray(value.$parts)) {out.push({key,text:value.$parts.join(' '),templated:true});return out;}
    for(const [name,child] of Object.entries(value)) {
      if(name.startsWith('$')||['grownText','grownTextLocal','guText'].includes(name))continue;
      extractStrings(child,key?key+'.'+name:name,out);
    }
  }
  return out;
}
export async function buildReport(root=ROOT) {
  const records=[],sources=[];
  let exceptions=[];
  try {exceptions=JSON.parse(await fs.readFile(path.join(root,'docs/readability-exceptions.json'),'utf8'));} catch(error) {if(error.code!=='ENOENT')throw error;}
  for(const language of ['en','es']) {
    const game=path.join(root,'assets/games/community-builders/locales',language);
    for(const name of (await fs.readdir(game)).filter(name=>name.endsWith('.json')).sort()) sources.push({language,namespace:name.slice(0,-5),file:path.join(game,name)});
    sources.push({language,namespace:'engine',file:path.join(root,'assets/games/community-builders/engine/locales',language+'.json')});
    sources.push({language,namespace:'feedback',file:path.join(root,'assets/playtest/locales/feedback-'+language+'.json')});
  }
  for(const source of sources) {
    const value=JSON.parse(await fs.readFile(source.file,'utf8'));
    for(const entry of extractStrings(value)) {
      const id=source.language+':'+source.namespace+':'+entry.key,exception=exceptions.find(item=>item.id===id);
      const review=exception?{reason:exception.reason,status:exception.text!==entry.text?'stale':exception.status||'pending',reviewer:exception.reviewer||'Pending'}:null;
      records.push({id,language:source.language,namespace:source.namespace,file:path.relative(root,source.file).replaceAll('\\','/'),...entry,...measure(entry.text,source.language),exception:review});
    }
  }
  const summary={};
  for(const language of ['en','es']) {
    const subset=records.filter(record=>record.language===language),flagged=subset.filter(record=>record.flags.length);
    summary[language]={strings:subset.length,flagged:flagged.length,shortSamples:subset.filter(record=>record.shortSample).length,templateFragments:subset.filter(record=>record.templated).length,approvedExceptions:flagged.filter(record=>record.exception?.status==='approved').length,pendingOrUnreviewed:flagged.filter(record=>record.exception?.status!=='approved').length};
  }
  return {schemaVersion:1,generatedAt:new Date().toISOString(),scope:'All authored JSON game stories, choices, engine and feedback UI strings. grownText/guText and the separate adult playtest-instruction catalogs are excluded.',methods:{en:'0.39*(words/sentences)+11.8*(estimated syllables/words)-15.59; warn above grade 5',es:'206.84-60*(estimated syllables/words)-1.02*(words/sentences); warn below 70; this is a reading-ease score, not a grade'},limits:['Rule-based syllable and sentence estimates need human checking.','Short UI labels and templates are unstable samples; scores are not fluency or comprehension proof.','Template variables are omitted; check the full rendered sentence in context.','Spanish native review and all exception approvals remain separate human decisions.'],summary,records};
}
function markdown(report) {
  const rows=['# Readability report','','Generated from the actual JSON locale files. This report warns; it does not certify child comprehension or native Spanish quality. See [method and review rules](readability-method.md).','','| Language | Strings | Flagged | Short samples | Pending/unreviewed flags | Approved exceptions |','| --- | ---: | ---: | ---: | ---: | ---: |'];
  for(const [language,s]of Object.entries(report.summary))rows.push(`| ${language} | ${s.strings} | ${s.flagged} | ${s.shortSamples} | ${s.pendingOrUnreviewed} | ${s.approvedExceptions} |`);
  rows.push('','English uses an estimated Flesch-Kincaid grade. Spanish uses an estimated Fernández-Huerta reading-ease score; it is not assigned an English or Spanish school grade. Raw scores are not clamped.','',report.scope,'','## Flagged strings','','Every flagged string remains open unless an exact-text exception has explicit human approval. Short samples and omitted template variables are marked for context review.','','| Locale key | Metric | Score | Words / longest sentence | Flags and review | Text |','| --- | --- | ---: | --- | --- | --- |');
  const escape=text=>String(text).replaceAll('|','\\|').replace(/\s+/g,' ').trim();
  for(const r of report.records.filter(record=>record.flags.length))rows.push(`| ${escape(r.id)} | ${r.language==='en'?'FK grade':'FH ease'} | ${r.score} | ${r.wordCount} / ${r.longestSentence} | ${escape(r.flags.join('; ')+(r.shortSample?'; short sample':'')+(r.templated?'; template':'')+'; '+(r.exception?.status||'unreviewed'))} | ${escape(r.text)} |`);
  return rows.join('\n')+'\n';
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {
    const report=await buildReport();
    await fs.writeFile(path.join(ROOT,'docs/readability-report.json'),JSON.stringify(report,null,2)+'\n');
    await fs.writeFile(path.join(ROOT,'docs/readability-report.md'),markdown(report));
    for(const [language,s]of Object.entries(report.summary))console.log(`${language}: ${s.strings} strings; ${s.flagged} flagged; ${s.pendingOrUnreviewed} pending/unreviewed; ${s.approvedExceptions} approved exceptions.`);
    for(const r of report.records.filter(record=>record.flags.length).slice(0,20))console.warn(`${process.env.GITHUB_ACTIONS?'::warning title=Readability::':''}${r.id}: ${r.flags.join('; ')} (${r.metric} ${r.score}).`);
    console.log('Full warnings: docs/readability-report.md and docs/readability-report.json. Threshold warnings do not fail CI.');
  } catch(error) {console.error(error.message);process.exitCode=1;}
}
