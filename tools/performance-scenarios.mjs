/* Runs only on the CI runner; local browser inspection uses the connected Chrome tab. */
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import puppeteer from 'puppeteer-core';
import {launch} from 'chrome-launcher';
import {startFlow} from 'lighthouse';

if (process.env.GITHUB_ACTIONS !== 'true') throw new Error('Run the performance browser scenarios in GitHub Actions.');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root,'dist'), output = path.join(root,'test-results/lighthouse/flows');
await fs.mkdir(output,{recursive:true});
const types = {'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.avif':'image/avif','.webp':'image/webp','.woff2':'font/woff2','.mp3':'audio/mpeg','.webmanifest':'application/manifest+json'};
const server = http.createServer(async (request,response)=>{
  try {
    const name = decodeURIComponent(new URL(request.url,'http://localhost').pathname);
    const file = path.resolve(dist,'.'+(name==='/'?'/index.html':name));
    if(!file.startsWith(dist+path.sep)) {response.writeHead(403).end();return;}
    response.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});
    response.end(await fs.readFile(file));
  } catch (_) {response.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
const chrome=await launch({chromeFlags:['--headless=new','--no-sandbox','--disable-dev-shm-usage']});
const browser=await puppeteer.connect({browserURL:'http://127.0.0.1:'+chrome.port});
const records=[];
try {
  for(const language of ['en','es']) for(let run=1;run<=3;run++) {
    const context=await browser.createBrowserContext(),page=await context.newPage();
    await page.setViewport({width:393,height:851,deviceScaleFactor:1});
    const problems=[];
    page.on('pageerror',error=>problems.push(error.message));
    await page.goto(base+'/'+(language==='es'?'espanol.html':'index.html')+'?seed=42',{waitUntil:'networkidle0'});
    await page.waitForSelector('[data-engine-mounted="true"]');
    await page.click('#pt-quiet');await page.click('#pt-start');await page.waitForSelector('.cb-hero',{visible:true});
    const flow=await startFlow(page,{name:language+' game screens run '+run,flags:{disableStorageReset:true}});
    await flow.snapshot({name:'Title accessibility and best practices'});
    await flow.startTimespan({name:'Title to map interaction'});
    const words=JSON.parse(await fs.readFile(path.join(root,'assets/games/community-builders/engine/locales',language+'.json'),'utf8'));
    await page.$$eval('.cb-engine-title-actions button',(buttons,label)=>buttons.find(button=>button.textContent.trim()===label).click(),words.newGame);
    await page.waitForSelector('.cb-engine-slot-pick',{visible:true});await page.click('.cb-engine-slot-pick');
    await page.waitForSelector('.cb-stop[data-stop-n="1"]',{visible:true});
    await flow.endTimespan();await flow.snapshot({name:'Map accessibility and best practices'});
    for(const stop of [1,2]) {
      await flow.startTimespan({name:'Open Stop '+stop+' interaction'});
      await page.click('.cb-stop[data-stop-n="'+stop+'"]');await page.waitForSelector('.cb-board',{visible:true});
      await flow.endTimespan();await flow.snapshot({name:'Stop '+stop+' introduction accessibility and best practices'});
      await page.click('.cb-stophud__back');await page.waitForSelector('.cb-stop[data-stop-n="'+stop+'"]',{visible:true});
    }
    const result=await flow.createFlowResult();
    await fs.writeFile(path.join(output,language+'-'+run+'.json'),JSON.stringify(result));
    await fs.writeFile(path.join(output,language+'-'+run+'.html'),await flow.generateReport());
    for(const step of result.steps) {
      const lhr=step.lhr, failures=[];
      if(lhr.runtimeError) failures.push(lhr.runtimeError.message);
      for(const category of ['accessibility','best-practices']) {
        const score=lhr.categories[category]?.score;
        if(typeof score==='number' && score<1) failures.push(category+' '+score);
      }
      const tbt=lhr.audits['total-blocking-time']?.numericValue,cls=lhr.audits['cumulative-layout-shift']?.numericValue;
      if(typeof tbt==='number'&&tbt>50)failures.push('TBT '+tbt+'ms');
      if(typeof cls==='number'&&cls>0)failures.push('CLS '+cls);
      records.push({language,run,screen:step.name,gatherMode:lhr.gatherMode,tbt:tbt??null,cls:cls??null,accessibility:lhr.categories.accessibility?.score??null,bestPractices:lhr.categories['best-practices']?.score??null,failures});
    }
    if(problems.length)records.push({language,run,failures:problems});
    await context.close();
  }
} finally {await browser.disconnect();await chrome.kill();await new Promise(resolve=>server.close(resolve));}
await fs.writeFile(path.join(output,'summary.json'),JSON.stringify(records,null,2));
const failed=records.filter(record=>record.failures.length);
console.log('Measured '+records.length+' game-screen reports; '+failed.length+' failed. Navigation LCP/FCP/performance are measured separately by LHCI.');
if(failed.length){console.error(JSON.stringify(failed,null,2));process.exitCode=1;}
