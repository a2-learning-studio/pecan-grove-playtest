#!/usr/bin/env node
/** Offline package checks. Compiles JS, but never executes it or contacts the network.
 * The authored manifest and voice data assignment are parsed as JSON literals.
 * Run: node tools/validate_game.mjs [--root SOURCE_ROOT] [--site GENERATED_SITE]
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const STOP_IDS = [
  'notice-the-signs', 'ask-a-good-question', 'listen-to-every-neighbor', 'fact-or-rumor',
  'map-what-could-change', 'who-decides', 'speak-up-kindly', 'disagree-kindly',
  'include-every-voice', 'match-a-fix', 'weigh-the-tradeoffs', 'make-a-fair-deal',
  'spread-the-word-right', 'keep-watch', 'build-the-future-together'
];
const GAME = 'assets/games/community-builders';
const MODULE_NAMES = STOP_IDS.map((id, index) => `${String(index + 1).padStart(2, '0')}-${id}`);
const ASSET_EXTENSION = /\.(?:js|css|svg|png|jpe?g|webp|gif|avif|ico|mp3|ogg|wav|m4a|mp4|woff2?|ttf)(?:[?#].*)?$/i;
const REMOTE = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);

/** Small lexical scanner: comments and quoted text cannot masquerade as stop registrations. */
function tokens(source) {
  const out = [];
  const wordPattern = /[A-Za-z_$][\w$]*/y;
  let i = 0;
  while (i < source.length) {
    const c = source[i];
    if (/\s/.test(c)) { i++; continue; }
    if (source.startsWith('//', i)) { i = source.indexOf('\n', i); if (i < 0) break; continue; }
    if (source.startsWith('/*', i)) { const end = source.indexOf('*/', i + 2); i = end < 0 ? source.length : end + 2; continue; }
    if (c === '"' || c === "'" || c === '`') {
      const quote = c, start = i++;
      let value = '';
      while (i < source.length && source[i] !== quote) {
        if (source[i] !== '\\') { value += source[i++]; continue; }
        i++;
        const escaped = source[i++];
        const escapes = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', v: '\v', '0': '\0' };
        if ((escaped === 'u' && /^[0-9a-f]{4}$/i.test(source.slice(i, i + 4))) ||
            (escaped === 'x' && /^[0-9a-f]{2}$/i.test(source.slice(i, i + 2)))) {
          const length = escaped === 'u' ? 4 : 2;
          value += String.fromCharCode(parseInt(source.slice(i, i + length), 16)); i += length;
        } else value += escapes[escaped] ?? escaped ?? '';
      }
      i++;
      out.push({ type: quote === '`' ? 'template' : 'string', value, start });
      continue;
    }
    wordPattern.lastIndex = i;
    const word = wordPattern.exec(source);
    if (word) { out.push({ type: 'word', value: word[0], start: i }); i += word[0].length; continue; }
    out.push({ type: 'punct', value: c, start: i++ });
  }
  return out;
}

function closeAt(list, index) {
  const pairs = { '[': ']', '{': '}', '(': ')' }, stack = [];
  for (let i = index; i < list.length; i++) {
    const value = list[i].value;
    if (list[i].type === 'string' || list[i].type === 'template') continue;
    if (pairs[value]) stack.push(pairs[value]);
    else if (value === stack.at(-1)) { stack.pop(); if (!stack.length) return i; }
  }
  return -1;
}

function propertyTokens(list, start, end) {
  const properties = new Map();
  for (let i = start + 1; i < end; i++) {
    if ((list[i].type === 'word' || list[i].type === 'string') && list[i + 1]?.value === ':') {
      properties.set(list[i].value, list[i + 2]);
      i += 2;
    }
    if ('[{('.includes(list[i]?.value) && list[i]?.type === 'punct') { const close = closeAt(list, i); if (close >= 0) i = close; }
  }
  return properties;
}

function walkFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  const found = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    // Symlinks are checked at resolution; never recurse through them.
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) found.push(...walkFiles(file));
    else if (entry.isFile()) found.push(file);
  }
  return found;
}

export function validateGame({ root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), site } = {}) {
  root = path.resolve(root);
  const errors = [], warnings = [], checked = new Set();
  let clipCount = 0, textCount = 0;
  const error = message => errors.push(message);
  const display = file => path.relative(root, file).replaceAll('\\', '/') || '.';
  const inside = (base, target) => { const rel = path.relative(base, target); return !rel.startsWith(`..${path.sep}`) && rel !== '..' && !path.isAbsolute(rel); };

  function requireFile(file, context, boundary = root) {
    if (!inside(boundary, file)) { error(`${context}: asset escapes package: ${display(file)}`); return false; }
    try {
      const stat = fs.statSync(file);
      if (!stat.isFile()) { error(`${context}: expected a file: ${display(file)}`); return false; }
      if (!inside(fs.realpathSync(boundary), fs.realpathSync(file))) { error(`${context}: symlink points outside package: ${display(file)}`); return false; }
      if (!stat.size) { error(`${context}: asset is empty: ${display(file)}`); return false; }
      checked.add(file); return true;
    } catch (e) { error(`${context}: missing or unreadable file ${display(file)} (${e.code || e.message})`); return false; }
  }

  function read(file, context) {
    if (!requireFile(file, context)) return '';
    try { return fs.readFileSync(file, 'utf8'); } catch (e) { error(`${context}: cannot read ${display(file)} (${e.message})`); return ''; }
  }

  function compile(source, file) {
    if (file.includes(`${path.sep}engine${path.sep}`) || /^\s*(?:import|export)\s/m.test(source)) {
      const result = spawnSync(process.execPath, ['--input-type=module', '--check'], { input: source, encoding: 'utf8' });
      if (result.status !== 0) error(`${display(file)}: JavaScript module syntax error: ${result.stderr.trim()}`);
      return;
    }
    try { new vm.Script(source, { filename: display(file) }); }
    catch (e) { error(`${display(file)}: JavaScript syntax error: ${e.message}`); }
  }

  function dataFile(relative, variable) {
    const file = path.join(root, GAME, relative), source = read(file, relative);
    if (!source) return null;
    // JSON.parse rejects calls, statements, getters and expressions; no project code is executed.
    const prefix = /^\s*(?:(?:\/\*[\s\S]*?\*\/|\/\/[^\n]*(?:\n|$))\s*)*window\s*\.\s*(CB_STOP_MODULES|CB_VOICE)\s*=\s*/.exec(source);
    if (!prefix || prefix[1] !== variable) { error(`${display(file)}: expected one data-only window.${variable} assignment`); return null; }
    try {
      return JSON.parse(source.slice(prefix[0].length).trim().replace(/;$/, ''));
    } catch (e) { error(`${display(file)}: expected one data-only window.${variable} assignment containing JSON (${e.message})`); return null; }
  }

  function reference(raw, from, boundary, context, strictPath = false) {
    if (typeof raw !== 'string' || !raw.trim()) { error(`${context}: asset URL is empty`); return; }
    let value = raw.trim().replace(/&amp;/g, '&');
    if (value.startsWith('#') || /^data:/i.test(value)) return;
    if (REMOTE.test(value)) { error(`${context}: external asset URL is not allowed: ${value}`); return; }
    value = value.split(/[?#]/, 1)[0];
    try { value = decodeURIComponent(value); } catch { error(`${context}: invalid URL encoding: ${raw}`); return; }
    if (/\0|\\/.test(value) || REMOTE.test(value) || (strictPath && value.split('/').some(p => p === '.' || p === '..'))) {
      error(`${context}: unsafe asset filename: ${raw}`); return;
    }
    const file = value.startsWith('/') ? path.join(boundary, value.slice(1)) : path.resolve(path.dirname(from), value);
    requireFile(file, context, boundary);
  }

  const coreFile = path.join(root, GAME, 'cb.js'), coreSource = read(coreFile, 'game core'), coreTokens = tokens(coreSource);
  for (const relative of ['assets/css/a2-studio.css', 'assets/img/mark.svg', `${GAME}/cb.css`]) requireFile(path.join(root, relative), 'play-test shell');
  if (coreSource) compile(coreSource, coreFile);
  const dataModule = path.join(root, GAME, 'data/catalog.js');
  const inventoryTokens = fs.existsSync(dataModule) ? tokens(read(dataModule, 'stop inventory module')) : coreTokens;
  const stopsStart = inventoryTokens.findIndex((t, i) => t.value === 'STOPS' && inventoryTokens[i + 1]?.value === '=' && inventoryTokens[i + 2]?.value === '[') + 2;
  const stopsEnd = stopsStart > 1 ? closeAt(inventoryTokens, stopsStart) : -1;
  const declaredStops = [];
  if (stopsEnd < 0) error(`${display(coreFile)}: cannot find the STOPS array`);
  else {
    for (let i = stopsStart + 1; i < stopsEnd; i++) {
      if (inventoryTokens[i].value === '[') {
        if (inventoryTokens[i + 1]?.type === 'string') declaredStops.push(inventoryTokens[i + 1].value);
        i = closeAt(inventoryTokens, i);
      }
    }
    if (JSON.stringify(declaredStops) !== JSON.stringify(STOP_IDS)) error(`${display(coreFile)}: STOPS must list all 15 known IDs in order; found ${declaredStops.join(', ')}`);
  }
  const modules = dataFile('stops/manifest.js', 'CB_STOP_MODULES');
  const registrations = new Set();
  if (!Array.isArray(modules)) error('stops/manifest.js: CB_STOP_MODULES must be an array');
  else {
    if (modules.length !== MODULE_NAMES.length || new Set(modules).size !== modules.length) error('stops/manifest.js: expected 15 unique stop module filenames');
    for (const expected of MODULE_NAMES) if (!modules.includes(expected)) error(`stops/manifest.js: missing required module ${expected}`);
    for (const module of modules) {
      if (typeof module !== 'string' || !/^\d\d-[a-z]+(?:-[a-z]+)*$/.test(module) || !MODULE_NAMES.includes(module)) {
        error(`stops/manifest.js: unknown or unsafe module filename ${JSON.stringify(module)}`); continue;
      }
      const file = path.join(root, GAME, 'stops', `${module}.js`), source = read(file, `module ${module}`);
      if (!source) continue;
      compile(source, file);
      const list = tokens(source), ids = new Map();
      for (let i = 0; i < list.length - 2; i++) if (list[i].type === 'word' && list[i + 1].value === '=' && list[i + 2].type === 'string') ids.set(list[i].value, list[i + 2].value);
      let count = 0;
      for (let i = 0; i < list.length - 5; i++) {
        const direct = list[i].value === 'CB' && list[i + 1].value === '.' && list[i + 2].value === 'register' && list[i + 3].value === '(' && list[i + 4].value === '{';
        // Factory stops return their descriptor to the lifecycle adapter. Validate that
        // actual object with the same ID, CSS and defined-run checks as direct stops.
        const factory = list[i].value === 'return' && list[i + 1].value === '{'
          && /\bhost\.defineStop\(factory\)/.test(source);
        if (!direct && !factory) continue;
        const start = direct ? i + 4 : i + 1;
        const properties = propertyTokens(list, start, closeAt(list, start));
        if (factory && (!properties.has('id') || (!properties.has('css') && !properties.has('run')))) continue;
        count++;
        const idToken = properties.get('id'), id = idToken?.type === 'string' ? idToken.value : ids.get(idToken?.value);
        const expected = module.slice(3);
        if (id !== expected) error(`${display(file)}: must register ${expected}; found ${JSON.stringify(id)}`);
        else if (registrations.has(id)) error(`${display(file)}: duplicate stop registration ${id}`);
        else registrations.add(id);
        const css = properties.get('css');
        if (css?.type !== 'string' || css.value !== `${module}.css`) error(`${display(file)}: css must be ${module}.css`);
        else reference(css.value, file, root, `${display(file)} css`, true);
        const run = properties.get('run');
        if (!run || run.type !== 'word' || (run.value !== 'function' && !new RegExp(`function\\s+${run.value.replace(/[$]/g, '\\$')}\\s*\\(`).test(source))) error(`${display(file)}: registration must supply a defined run function`);
      }
      if (count !== 1) error(`${display(file)}: expected exactly one CB.register({...}) call; found ${count}`);
    }
  }
  for (const id of STOP_IDS) if (!registrations.has(id)) error(`Stop ${STOP_IDS.indexOf(id) + 1} (${id}) has no valid registration`);

  const voice = dataFile('voice/index.js', 'CB_VOICE');
  const voiceFile = path.join(root, GAME, 'voice', 'index.js'), usedClips = new Set(), perLanguage = {};
  if (!object(voice)) error('voice/index.js: CB_VOICE must be an object');
  else {
    if (!object(voice.clips) || !Object.keys(voice.clips).length) error('voice/index.js: clips must be a nonempty object');
    for (const lang of ['en', 'es']) {
      const dictionary = voice[lang]; perLanguage[lang] = new Set();
      if (!object(dictionary) || !Object.keys(dictionary).length) { error(`voice/index.js: ${lang} must be a nonempty text-to-clip dictionary`); continue; }
      for (const [text, item] of Object.entries(dictionary)) {
        textCount++;
        const label = `voice/index.js ${lang} text ${JSON.stringify(text.slice(0, 55))}`;
        if (!text.trim() || !object(item) || typeof item.f !== 'string' || !['guide', 'nb'].includes(item.k)) { error(`${label}: expected nonempty text and { f: filename, k: "guide" | "nb" }`); continue; }
        if (!new RegExp(`^${lang}/[A-Za-z0-9][A-Za-z0-9@_-]*\\.mp3$`).test(item.f)) { error(`${label}: unsafe or wrong-language clip filename ${JSON.stringify(item.f)}`); continue; }
        reference(item.f, voiceFile, root, label, true);
        usedClips.add(item.f); perLanguage[lang].add(item.f.slice(3));
        if (!object(voice.clips?.[item.f])) error(`${label}: ${item.f} has no clips timing metadata`);
      }
    }
    for (const [filename, clip] of Object.entries(voice.clips || {})) {
      clipCount++;
      const label = `voice/index.js clips[${JSON.stringify(filename)}]`;
      if (!/^(?:en|es)\/[A-Za-z0-9][A-Za-z0-9@_-]*\.mp3$/.test(filename)) { error(`${label}: unsafe clip filename`); continue; }
      reference(filename, voiceFile, root, label, true);
      if (!object(clip) || typeof clip.s !== 'string' || !clip.s.trim() || !Array.isArray(clip.t) || !Number.isInteger(clip.h)) { error(`${label}: expected spoken text s, timing array t, integer heading word count h`); continue; }
      const words = clip.s.trim().split(/\s+/).length;
      if (clip.t.length !== words + 1) error(`${label}: timing count ${clip.t.length} must equal spoken word count + 1 (${words + 1})`);
      if (clip.h < 0 || clip.h > words) error(`${label}: h must be between 0 and ${words}`);
      if (clip.t.some((time, i) => !Number.isFinite(time) || time < 0 || (i && time < clip.t[i - 1]))) error(`${label}: timings must be finite, nonnegative and nondecreasing milliseconds`);
      if (!clip.t.length || clip.t.at(-1) <= 0) error(`${label}: final timestamp must be greater than zero`);
      if (!usedClips.has(filename)) warnings.push(`${label}: clip is not referenced by a screen text (may be intentionally reserved)`);
    }
    if (perLanguage.en && perLanguage.es) {
      for (const lang of ['en', 'es']) for (const filename of perLanguage[lang]) if (!perLanguage[lang === 'en' ? 'es' : 'en'].has(filename)) error(`voice/index.js: ${lang}/${filename} has no matching ${lang === 'en' ? 'es' : 'en'} dictionary clip`);
    }
  }

  function inspectTextAssets(file, boundary) {
    const source = fs.readFileSync(file, 'utf8'), ext = path.extname(file).toLowerCase(), label = path.relative(boundary, file).replaceAll('\\', '/');
    if (ext === '.css' || ext === '.svg' || ext === '.html') {
      for (const match of source.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*?))\s*\)/gi)) reference(match[1] ?? match[2] ?? match[3], file, boundary, `${label} url()`);
      for (const match of source.matchAll(/@import\s+(?:"([^"]+)"|'([^']+)')/gi)) reference(match[1] ?? match[2], file, boundary, `${label} @import`);
    }
    if (ext === '.html' || ext === '.svg') {
      for (const tag of source.matchAll(/<(script|link|img|audio|video|source|image|use)\b([^>]*?)>/gi)) {
        const attrs = new Map([...tag[2].matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g)].map(m => [m[1].toLowerCase(), m[2] ?? m[3] ?? m[4]]));
        const name = tag[1].toLowerCase();
        if (name === 'link' && !/\b(?:stylesheet|icon|preload|modulepreload)\b/.test(attrs.get('rel') || '')) continue;
        for (const key of ['src', 'href', 'xlink:href', 'poster']) if (attrs.has(key)) reference(attrs.get(key), file, boundary, `${label} <${name}> ${key}`);
        if (attrs.has('srcset')) for (const candidate of attrs.get('srcset').split(',')) reference(candidate.trim().split(/\s+/)[0], file, boundary, `${label} <${name}> srcset`);
      }
    }
    if (ext !== '.js' || file === voiceFile || file.endsWith(`${path.sep}manifest.js`)) return;
    compile(source, file);
    const list = tokens(source), gameBase = path.join(boundary, GAME);
    for (let i = 0; i < list.length; i++) {
      const t = list[i];
      if (t.type !== 'string') continue;
      const previous = list[i - 1]?.value, key = list[i - 2]?.value;
      if ((previous === '(' && list[i - 2]?.value === 'img') || (previous === ':' && key === 'img')) {
        if (/^[a-z0-9][a-z0-9@_-]*$/i.test(t.value)) reference(`img/${t.value}.webp`, path.join(gameBase, 'cb.js'), boundary, `${label} image helper`, true);
        else error(`${label}: unsafe image helper filename ${JSON.stringify(t.value)}`);
        continue;
      }
      // Resource properties and Audio constructors also catch external URLs without extensions.
      const directResource = previous === ':' && ['src', 'poster'].includes(key) || previous === '(' && list[i - 2]?.value === 'Audio';
      if (directResource && REMOTE.test(t.value) && !/^data:/i.test(t.value)) { error(`${label}: external asset URL is not allowed: ${t.value}`); continue; }
      if (!ASSET_EXTENSION.test(t.value) || t.value.startsWith('.') && !t.value.startsWith('./') && !t.value.startsWith('../')) continue;
      if (previous === '+' && list[i - 2]?.value === 'BASE') reference(t.value, path.join(gameBase, 'cb.js'), boundary, `${label} BASE resource`);
      else if (previous === '+') continue; // e.g. L + "/g-intro.mp3"; both language clips are checked via the index.
      else if (directResource || t.value.startsWith('/') || /^(?:assets|\.\.?|img|voice|stops)\//.test(t.value) || REMOTE.test(t.value)) reference(t.value, file, boundary, `${label} resource literal`);
    }
  }

  const sourceAssets = walkFiles(path.join(root, 'assets')).filter(file => /\.(?:js|css|svg)$/i.test(file));
  for (const file of sourceAssets) inspectTextAssets(file, root);
  if (site) {
    const boundary = path.resolve(site);
    if (!fs.existsSync(boundary) || !fs.statSync(boundary).isDirectory()) error(`Generated site directory does not exist: ${boundary}`);
    else {
      // Check the copied manifest, voice index and media too: valid source files do not prove a complete export.
      const generated = validateGame({ root: boundary });
      for (const message of generated.errors) error(`Generated site: ${message}`);
      for (const message of generated.warnings) warnings.push(`Generated site: ${message}`);
      for (const page of ['index.html', 'espanol.html']) requireFile(path.join(boundary, page), `generated ${page}`, boundary);
      for (const file of walkFiles(boundary).filter(file => /\.html$/i.test(file))) inspectTextAssets(file, boundary);
    }
  }
  return { errors: [...new Set(errors)], warnings: [...new Set(warnings)], stats: { stops: registrations.size, modules: Array.isArray(modules) ? modules.length : 0, clips: clipCount, screenTexts: textCount, files: checked.size } };
}

function main(args) {
  const options = {};
  for (let i = 0; i < args.length; i++) {
    if ((args[i] === '--root' || args[i] === '--site') && args[i + 1] && !args[i + 1].startsWith('--')) options[args[i++].slice(2)] = args[i];
    else { console.error('Usage: node tools/validate_game.mjs [--root SOURCE_ROOT] [--site GENERATED_SITE]'); process.exitCode = 2; return; }
  }
  try {
    const result = validateGame(options);
    for (const message of result.errors) console.error(`ERROR: ${message}`);
    for (const message of result.warnings) console.warn(`NOTE: ${message}`);
    const s = result.stats;
    console.log(`${result.errors.length ? 'FAIL' : 'PASS'}: ${s.stops}/15 stops, ${s.modules}/15 modules, ${s.clips} voice clips, ${s.screenTexts} voice text entries, ${s.files} asset files checked.`);
    console.log('Voice checks cover index shape, timestamps, bilingual clip IDs and file existence. Changed screen wording may intentionally be text-only until replacement audio is recorded.');
    if (result.errors.length) process.exitCode = 1;
  } catch (e) { console.error(`ERROR: validator could not complete: ${e.stack || e.message}`); process.exitCode = 1; }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
