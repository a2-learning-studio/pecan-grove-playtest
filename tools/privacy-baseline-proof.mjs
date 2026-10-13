import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const require = createRequire(import.meta.url);
const {JSDOM} = require('jsdom');
const {classifyRequest} = require('../tests/e2e/network-policy.cjs');
const current = require('../assets/playtest/feedback.js');
const root = fileURLToPath(new URL('../', import.meta.url));
export const BASELINE_COMMIT = 'a2feba56cd91af16461032b95b8a3fbbb1e3fda0';
export const baselineRoot = process.env.PG_BASELINE_ROOT || path.resolve(root, '../pecan-grove-modernization-repo');

function sourceAtCommit(repository, file) {
  return execFileSync('git', ['-C', repository, 'show', `${BASELINE_COMMIT}:${file}`], {encoding:'utf8', maxBuffer:8*1024*1024});
}
function sha256(source) { return crypto.createHash('sha256').update(source).digest('hex'); }

async function captureMount(api, html) {
  // outside-only executes no page scripts; no resources option means no asset loads.
  // The only fetch implementation is this in-memory recorder. It never uses a socket.
  const dom = new JSDOM(html, {url:'https://a2-learning-studio.github.io/pecan-grove-playtest/', runScripts:'outside-only', pretendToBeVisual:true});
  const win = dom.window, requests = [], timers = new Map();
  let now = 0, serial = 0;
  win.TextEncoder = TextEncoder;
  win.setTimeout = (fn, delay=0) => {timers.set(++serial, {fn, at:now+Number(delay)}); return serial;};
  win.clearTimeout = key => timers.delete(key);
  win.fetch = async (url, options={}) => {
    const body = JSON.parse(options.body);
    requests.push({method:options.method, ...classifyRequest(String(url), new URL(win.location.href).origin, {loaded:false}), entries:body.entries.map(entry=>({kind:entry.kind, stop:entry.stop, submitted:entry.submitted===true}))});
    return {ok:true, json:async()=>({ok:true,schemaVersion:1,acknowledged:body.entries.map(entry=>({sessionId:entry.sessionId,entryId:entry.entryId,revision:entry.revision}))})};
  };
  async function tick(ms) {
    const end=now+ms;
    for (;;) {
      const due=[...timers].filter(([,timer])=>timer.at<=end).sort((a,b)=>a[1].at-b[1].at);
      if(!due.length) break;
      const [key,timer]=due[0];timers.delete(key);now=timer.at;timer.fn();
      for(let n=0;n<12;n++) await Promise.resolve();
    }
    now=end;
  }
  const app=api.mount(win.document,win);
  if(!app) throw Error('The actual baseline feedback form did not mount');
  await tick(0);
  const mountRequests=requests.length;
  const input=win.document.getElementById('pt-feedback-fix');
  input.value='A locally typed test draft';input.dispatchEvent(new win.Event('input',{bubbles:true}));
  await tick(2000);
  const typedRequests=requests.length-mountRequests;
  win.dispatchEvent(new win.Event('online'));
  win.document.dispatchEvent(new win.Event('visibilitychange'));
  await tick(5000);
  const passiveRequests=requests.length-mountRequests-typedRequests;
  const result={mountRequests,typedRequests,passiveRequests,requests};
  dom.window.close();
  return result;
}

export async function proveBaseline(repository=baselineRoot) {
  // Read committed blobs, not a checkout that another task may be editing.
  const oldSource=sourceAtCommit(repository,'assets/playtest/feedback.js');
  const html=sourceAtCommit(repository,'index.html');
  const context=vm.createContext({module:{exports:{}},TextEncoder,Uint8Array,DataView,Map,AbortController});
  vm.runInContext(oldSource,context,{filename:`baseline-${BASELINE_COMMIT}/feedback.js`});
  return {
    generatedAt:new Date().toISOString(),baselineCommit:BASELINE_COMMIT,
    baselineSourceSha256:sha256(oldSource),baselineHtmlSha256:sha256(html),
    currentSourceSha256:sha256(fs.readFileSync(path.join(root,'assets/playtest/feedback.js'))),
    method:'Actual committed legacy mount and current exported mount, same committed HTML, clean JSDOM/localStorage per case, fake timers, stub fetch only; shared browser-fixture request classifier.',
    realNetworkRequests:0,
    baseline:await captureMount(context.module.exports,html),
    current:await captureMount(current,html)
  };
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const result=await proveBaseline();
  if(result.baseline.mountRequests<1||!result.baseline.requests.some(request=>request.unexpected)||result.current.requests.length) throw Error('Baseline regression proof did not meet the expected before/after contract');
  if(process.argv.includes('--write-report')) {
    fs.writeFileSync(path.join(root,'docs/privacy-baseline-proof.json'),JSON.stringify(result,null,2)+'\n');
    fs.writeFileSync(path.join(root,'docs/privacy-baseline-proof.md'),`# Privacy baseline regression proof\n\nGenerated ${result.generatedAt}.\n\nThe actual feedback mount from public commit \`${result.baselineCommit}\` attempted ${result.baseline.mountRequests} POST request immediately on mount and ${result.baseline.typedRequests} after an unsent edit. The current mount attempted ${result.current.mountRequests} on mount and ${result.current.typedRequests} after the same edit. No real network requests were made.\n\nThis is a JSDOM integration test of the actual frontend code, with fresh storage, fake timers and a stubbed receiver. Both cases use the same HTML from the committed baseline. The shared Playwright network classifier rejects the old mount request even before DOMContentLoaded. This demonstrates that the guard detects the original automatic-backup regression; it is not a browser execution result or a live Drive test.\n\nCommitted baseline feedback SHA-256: \`${result.baselineSourceSha256}\`.\n\nCommitted baseline HTML SHA-256: \`${result.baselineHtmlSha256}\`.\n\nCurrent feedback SHA-256 at this run: \`${result.currentSourceSha256}\`.\n\nFull method and captured request metadata are in [the JSON receipt](privacy-baseline-proof.json). Request bodies, player IDs and receiver URLs are deliberately omitted from the receipt.\n\nRun \`node tools/privacy-baseline-proof.mjs --write-report\` with the baseline Git checkout at the sibling path, or set \`PG_BASELINE_ROOT\`. The source is read with \`git show\` at the recorded commit, so local checkout edits cannot change this proof.\n`);
  }
  console.log(JSON.stringify({baselineCommit:result.baselineCommit,baseline:result.baseline.mountRequests,current:result.current.mountRequests,realNetworkRequests:result.realNetworkRequests}));
}
