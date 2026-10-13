import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { STOP_IDS, validateGame } from '../validate_game.mjs';

const GAME = 'assets/games/community-builders';
const TOOL = fileURLToPath(new URL('../validate_game.mjs', import.meta.url));

function fixture(t) {
  const tempBase = fs.realpathSync(os.tmpdir()), root = fs.mkdtempSync(path.join(tempBase, 'pecan-grove-validation-'));
  t.after(() => {
    const resolved = path.resolve(root), rel = path.relative(tempBase, resolved);
    if (!rel.startsWith('..') && !path.isAbsolute(rel) && path.basename(resolved).startsWith('pecan-grove-validation-')) fs.rmSync(resolved, { recursive: true, force: true });
  });
  const write = (relative, content) => { const file = path.join(root, relative); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, content); };
  write('assets/css/a2-studio.css', '/* fixture shell */');
  write('assets/img/mark.svg', '<svg xmlns="http://www.w3.org/2000/svg"></svg>');
  write(`${GAME}/cb.css`, '/* fixture game */');
  const names = STOP_IDS.map((id, i) => `${String(i + 1).padStart(2, '0')}-${id}`);
  write(`${GAME}/cb.js`, `var STOPS = ${JSON.stringify(STOP_IDS.map(id => [id, 'English', 'Español', 1]))};
    function startStop(id) { if (id === "listen-to-every-neighbor") stop3(); else if (id === "fact-or-rumor") stop4(); }
    function stop3() {} function stop4() {}`);
  write(`${GAME}/stops/manifest.js`, `window.CB_STOP_MODULES = ${JSON.stringify(names)};`);
  for (const name of names) {
    write(`${GAME}/stops/${name}.js`, `var ID = ${JSON.stringify(name.slice(3))}; CB.register({id: ID, css: "${name}.css", run: run}); function run() {}`);
    write(`${GAME}/stops/${name}.css`, '/* fixture */');
  }
  const voice = { en: { 'Hello there.': { f: 'en/hello.mp3', k: 'guide' } }, es: { 'Hola amigo.': { f: 'es/hello.mp3', k: 'guide' } }, clips: {
    'en/hello.mp3': { s: 'Hello there.', t: [0, 250, 500], h: 0 }, 'es/hello.mp3': { s: 'Hola amigo.', t: [0, 250, 500], h: 0 }
  } };
  const saveVoice = () => write(`${GAME}/voice/index.js`, `window.CB_VOICE = ${JSON.stringify(voice)};`);
  saveVoice();
  write(`${GAME}/voice/en/hello.mp3`, 'fixture audio'); write(`${GAME}/voice/es/hello.mp3`, 'fixture audio');
  return { root, write, voice, saveVoice, names, validate: options => validateGame({ root, ...options }) };
}

test('complete bilingual package validates without executing game code', t => {
  const f = fixture(t);
  fs.appendFileSync(path.join(f.root, GAME, 'cb.js'), '\nthrow new Error("The game must not execute");');
  const result = f.validate();
  assert.deepEqual(result.errors, []);
  assert.equal(result.stats.stops, 15);
  assert.equal(result.stats.clips, 2);
});

test('missing modules, missing CSS and incorrect registrations produce actionable errors', t => {
  const f = fixture(t);
  fs.unlinkSync(path.join(f.root, GAME, 'stops', `${f.names[0]}.js`));
  fs.unlinkSync(path.join(f.root, GAME, 'stops', `${f.names[1]}.css`));
  f.write(`${GAME}/stops/${f.names[2]}.js`, `CB.register({id: "invented-stop", css: "${f.names[2]}.css", run: run}); function run() {}`);
  const errors = f.validate().errors.join('\n');
  assert.match(errors, /missing or unreadable file .*01-notice-the-signs\.js/);
  assert.match(errors, /missing or unreadable file .*02-ask-a-good-question\.css/);
  assert.match(errors, /must register listen-to-every-neighbor/);
  assert.match(errors, /Stop 1 .*no valid registration/);
});

test('lifecycle factory descriptors retain the ID, stylesheet and run validation', t => {
  const f = fixture(t), name = f.names[2];
  f.write(`${GAME}/stops/${name}.js`, `var host = window.CommunityBuilders;
    function factory(lifecycle) { function run() { return {id: "a-neighbor"}; }
      return {id: "listen-to-every-neighbor", css: "${name}.css", run: run}; }
    host.defineStop(factory);`);
  assert.deepEqual(f.validate().errors, []);
  f.write(`${GAME}/stops/${name}.js`, `var host = window.CommunityBuilders;
    function factory(lifecycle) { return {id: "wrong-stop", css: "wrong.css", run: missingRun}; }
    host.defineStop(factory);`);
  const errors = f.validate().errors.join('\n');
  assert.match(errors, /must register listen-to-every-neighbor/);
  assert.match(errors, /css must be 03-listen-to-every-neighbor.css/);
  assert.match(errors, /registration must supply a defined run function/);
});

test('all module handlers and the full stop inventory are required', t => {
  const f = fixture(t);
  const file = path.join(f.root, GAME, 'cb.js');
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('function stop4()', 'function missingStop()').replace('"keep-watch"', '"unknown-stop"') + '\n/* function stop4() {} */');
  const errors = f.validate().errors.join('\n');
  assert.match(errors, /STOPS must list all 15 known IDs/);
  f.write(`${GAME}/stops/04-fact-or-rumor.js`, 'CB.register({id: "fact-or-rumor", css: "04-fact-or-rumor.css", run: missingStop});');
  assert.match(f.validate().errors.join('\n'), /registration must supply a defined run function/);
});

test('voice dictionary f fields and clip metadata both require their actual audio files', t => {
  const f = fixture(t);
  fs.unlinkSync(path.join(f.root, GAME, 'voice', 'es', 'hello.mp3'));
  f.voice.clips['en/reserved.mp3'] = { s: 'Reserved.', t: [0, 500], h: 0 }; f.saveVoice();
  const errors = f.validate().errors.join('\n');
  assert.match(errors, /es text .*missing or unreadable file .*es\/hello\.mp3/);
  assert.match(errors, /clips\["en\/reserved.mp3"\].*missing or unreadable file/);
});

test('unsafe manifest filenames and voice traversal are rejected', t => {
  const f = fixture(t);
  f.write(`${GAME}/stops/manifest.js`, `window.CB_STOP_MODULES = ${JSON.stringify([...f.names, '../../outside'])};`);
  f.voice.en['Hello there.'].f = 'en/../hello.mp3'; f.saveVoice();
  const errors = f.validate().errors.join('\n');
  assert.match(errors, /unknown or unsafe module filename "\.\.\/\.\.\/outside"/);
  assert.match(errors, /unsafe or wrong-language clip filename/);
});

test('voice shape, timing and bilingual clip coverage are checked without source text parity', t => {
  const f = fixture(t);
  f.voice.clips['en/hello.mp3'].t = [0, -1];
  f.voice.es['Hola amigo.'].f = 'es/other.mp3';
  f.voice.es['Hola amigo.'].k = 'unknown'; f.saveVoice();
  const errors = f.validate().errors.join('\n');
  assert.match(errors, /timing count/);
  assert.match(errors, /timings must be/);
  assert.match(errors, /expected nonempty text/);
  assert.match(errors, /no matching es dictionary clip/);
});

test('data indices cannot contain executable statements', t => {
  const f = fixture(t);
  f.write(`${GAME}/voice/index.js`, 'window.CB_VOICE = {}; while (true) {}');
  assert.match(f.validate().errors.join('\n'), /expected one data-only window.CB_VOICE assignment/);
});

test('CSS local files are resolved relative to CSS and external assets fail', t => {
  const f = fixture(t);
  f.write('assets/css/test.css', '@font-face {src:url("../fonts/font.woff2")} .hero{background:url(https://cdn.example.com/image)}');
  const errors = f.validate().errors.join('\n');
  assert.match(errors, /missing or unreadable file assets\/fonts\/font.woff2/);
  assert.match(errors, /external asset URL is not allowed: https:\/\/cdn.example.com\/image/);
});

test('JS image helpers, resource literals and unsafe encoded paths are checked', t => {
  const f = fixture(t);
  fs.appendFileSync(path.join(f.root, GAME, 'cb.js'), `\nimg("missing"); var n={img:"neighbor"}; var s={src:"https://cdn.example.com/no-extension"}; var bad={src:"%2e%2e/%2e%2e/%2e%2e/%2e%2e/outside.svg"};`);
  const errors = f.validate().errors.join('\n');
  assert.match(errors, /missing\.webp/);
  assert.match(errors, /neighbor\.webp/);
  assert.match(errors, /external asset URL/);
  assert.match(errors, /asset escapes package/);
});

test('generated EN/ES HTML checks scripts, style, images, SVG and audio while allowing navigation links', t => {
  const f = fixture(t), site = path.join(f.root, 'site');
  fs.cpSync(path.join(f.root, 'assets'), path.join(site, 'assets'), { recursive: true });
  f.write('site/index.html', `<a href="https://feedback.example.com">Feedback</a><script src="missing.js"></script><link rel="stylesheet" href="missing.css"><img src="missing.webp"><audio src="missing.mp3"></audio><svg><use href="missing.svg#shape"></use></svg>`);
  f.write('site/espanol.html', '<!doctype html><html lang="es"></html>');
  const errors = f.validate({ site }).errors.join('\n');
  for (const ext of ['js', 'css', 'webp', 'mp3', 'svg']) assert.match(errors, new RegExp(`missing\\.${ext}`));
  assert.doesNotMatch(errors, /feedback\.example/);
});

test('generated copy independently validates indexed voice files, not just HTML references', t => {
  const f = fixture(t), site = path.join(f.root, 'site');
  fs.cpSync(path.join(f.root, 'assets'), path.join(site, 'assets'), { recursive: true });
  for (const page of ['index.html', 'espanol.html']) f.write(`site/${page}`, '<!doctype html><html></html>');
  assert.deepEqual(f.validate({ site }).errors, []);
  fs.unlinkSync(path.join(site, GAME, 'voice', 'es', 'hello.mp3'));
  assert.match(f.validate({ site }).errors.join('\n'), /Generated site: .*missing or unreadable file .*es\/hello\.mp3/);
});

test('CLI fails nonzero with clear errors, and succeeds for a complete fixture', t => {
  const f = fixture(t);
  const pass = spawnSync(process.execPath, [TOOL, '--root', f.root], { encoding: 'utf8' });
  assert.equal(pass.status, 0, pass.stderr);
  assert.match(pass.stdout, /PASS: 15\/15 stops/);
  fs.unlinkSync(path.join(f.root, GAME, 'voice', 'en', 'hello.mp3'));
  const fail = spawnSync(process.execPath, [TOOL, '--root', f.root], { encoding: 'utf8' });
  assert.equal(fail.status, 1);
  assert.match(fail.stderr, /ERROR: .*missing or unreadable file/);
});
