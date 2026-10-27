import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { build } from 'vite';
import { gzipSync } from 'node:zlib';
import { splitStyles } from './critical-css.mjs';
import { prepareManifest, linkManifest } from './delivery-manifest.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const flavorArg = process.argv.find(a => a.startsWith('--flavor='));
const flavor = flavorArg ? flavorArg.split('=')[1] : process.argv.includes('--flavor') ? process.argv[process.argv.indexOf('--flavor') + 1] : 'playtest';
if (!['playtest', 'family', 'library'].includes(flavor)) throw new Error('Flavor must be playtest, family, or library');
const output = path.join(root, '_publish', `pecan-grove-${flavor}`);
const dist = path.join(root, flavor === 'playtest' ? 'dist' : `dist-${flavor}`);
const locales = spawnSync(process.execPath, ['tools/generate-game-locales.cjs'], { cwd: root, stdio: 'inherit' });
if (locales.status !== 0) process.exit(locales.status || 1);
const shellLocales = spawnSync(process.execPath, ['tools/generate-shell-locales.cjs'], { cwd: root, stdio: 'inherit' });
if (shellLocales.status !== 0) process.exit(shellLocales.status || 1);
const buildArgs = ['-B', 'tools/make_playtest.py', '--flavor', flavor];
if (process.env.PG_FEEDBACK_ENDPOINT) buildArgs.push('--feedback-endpoint', process.env.PG_FEEDBACK_ENDPOINT);
const python = spawnSync('python', buildArgs, { cwd: root, stdio: 'inherit' });
if (python.status !== 0) process.exit(python.status || 1);
const fonts = spawnSync('python', ['-B', 'tools/subset_fonts.py', output], { cwd: root, encoding: 'utf8' });
if (fonts.status !== 0) { process.stderr.write(fonts.stderr); process.exit(fonts.status || 1); }
const fontReceipt = JSON.parse(fonts.stdout);
const catalogFile = path.join(output, 'assets/games/community-builders/locales/catalog.js');
const catalog = await fs.readFile(catalogFile, 'utf8');
// Production fetches core and only the selected stop. Source preview keeps its generated compatibility bank.
await fs.writeFile(catalogFile, catalog.replace(/root\.CB_LOCALES = .*;/, 'root.CB_LOCALES = {en:{},es:{}};'));
// The standalone game uses its two proportional faces. Keep the hub's mono font out of this build.
const studioFile = path.join(output, 'assets/css/a2-studio.css');
const studioCss = await fs.readFile(studioFile, 'utf8');
await fs.writeFile(studioFile, studioCss.replace(/@font-face\s*\{[^}]*Geist Mono[^}]*\}\s*/g, '')
  .replace(/"Geist Mono A2", "Geist Mono", /g, ''));
async function readStyle(name, seen = new Set()) {
  if (seen.has(name)) throw new Error(`Circular stylesheet import: ${name}`);
  const next = new Set(seen).add(name);
  let css = await fs.readFile(path.join(output, name), 'utf8');
  for (const match of css.matchAll(/@import\s+["']([^"']+)["']\s*;/g)) {
    const imported = path.posix.normalize(path.posix.join(path.posix.dirname(name), match[1]));
    if (imported.startsWith('../') || imported.includes(':')) throw new Error('Stylesheet import leaves the export');
    css = css.replace(match[0], await readStyle(imported, next));
  }
  return css;
}
const [studio, tokens, game, engine, page, shell, feedback] = await Promise.all([
  'assets/css/a2-studio.css', 'assets/games/community-builders/engine/tokens.css',
  'assets/games/community-builders/cb.css', 'assets/games/community-builders/engine/engine.css',
  'playtest.css', 'assets/playtest/shell.css', ...(flavor === 'family' ? [] : ['assets/playtest/feedback.css'])
].map(name => readStyle(name)));
const styles = splitStyles({studio, tokens, game, engine, page, shell, feedback});
// Fonts retain their original base URL so Vite can resolve and fingerprint them.
await fs.writeFile(path.join(output, 'assets/css/critical.css'), styles.critical);
const gameStyles = path.join(output, 'assets/games/community-builders/full-game.css');
await fs.writeFile(gameStyles, styles.full);
const walk = async dir => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const all = await Promise.all(entries.filter(e => e.name !== '.git' && !e.name.startsWith('.')).map(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
  return all.flat();
};
for (const lang of ['en', 'es']) {
  const directory = path.join(output, 'assets/games/community-builders/voice', lang);
  const clips = (await fs.readdir(directory)).filter(n => n.endsWith('.mp3'));
  const files = await Promise.all(clips.map(async n => ({ file: n, bytes: (await fs.stat(path.join(directory, n))).size })));
  await fs.writeFile(path.join(directory, 'pack.json'), JSON.stringify({ lang, files, totalBytes: files.reduce((n, f) => n + f.bytes, 0) }));
}
const stopDir = path.join(output, 'assets/games/community-builders/stops');
const descriptors = JSON.parse(await fs.readFile(path.join(stopDir, 'manifest.json'), 'utf8'));
if (descriptors.length !== 15 || new Set(descriptors.map(stop => stop.id)).size !== 15) throw new Error('All 15 stops must have unique descriptors');
for (const stop of descriptors) {
  if (!Number.isInteger(stop.n) || stop.n < 1 || stop.n > 15 || !Array.isArray(stop.steps) || !stop.steps.length
      || !new RegExp('^' + String(stop.n).padStart(2, '0') + '-[a-z-]+\\.js$').test(stop.file)
      || stop.css !== stop.file.replace(/\.js$/, '.css')) throw new Error('Invalid stop descriptor');
  await Promise.all([stop.file, stop.css].map(file => fs.access(path.join(stopDir, file))));
}
const statics = [], assetMap = {};
for (const file of await walk(path.join(output, 'assets'))) {
  const relative = path.relative(output, file).split(path.sep).join('/');
  // Voice clips are content-addressed too: a re-recorded line gets a new URL, so a returning player's cache-first
  // worker can never keep serving the old recording.
  if (!/\.(?:webp|avif|png|svg|json)$/.test(file) && !/\/stops\/.*\.(?:js|css)$/.test(relative) && !/\/voice\/index\.js$/.test(relative)
    && !/\/voice\/(?:en|es)\/[^/]+\.mp3$/.test(relative) && !relative.endsWith('/full-game.css')) continue;
  const bytes = await fs.readFile(file); const hash = crypto.createHash('sha256').update(bytes).digest('hex').slice(0, 12);
  const ext = path.extname(file); const target = relative.slice(0, -ext.length) + '.' + hash + ext;
  assetMap[relative] = target; statics.push({ file, target });
}
await fs.writeFile(path.join(output, 'asset-map.json'), JSON.stringify(assetMap));
// Boot after the hero has painted. Simulated Lighthouse LCP includes every
// request that started before that paint, so loading the game first puts the
// whole HTTP/1.1 queue on the LCP path. Callbacks only: a top-level await keeps
// Vite's preload helper pending, and Safari warns when that preload is still
// unused a few seconds after load. The image's own decode is the backup when
// a LCP entry never points at the hero. Waiting a full second instead overlaps
// the game with the title-to-map interaction and pushes that task over 50ms.
const imports = `import map from './asset-map.json';
window.PG_ASSET_MAP=map;
window.PG_STYLE_HREF=map['assets/games/community-builders/full-game.css'];
const hero = document.querySelector('#pt-intro img');
let started = false;
const start = () => { if (started) return; started = true; import('./assets/playtest/boot.js'); };
const arm = () => requestAnimationFrame(start);
if (hero && typeof PerformanceObserver === 'function') {
  try {
    const paints = new PerformanceObserver(list => {
      if (list.getEntries().some(entry => entry.element === hero)) arm();
    });
    paints.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (_) {}
}
const afterDecode = () => requestAnimationFrame(() => requestAnimationFrame(start));
if (hero && typeof hero.decode === 'function') hero.decode().then(() => setTimeout(afterDecode, 200), afterDecode);
else afterDecode();
setTimeout(arm, 1000);
`;
await fs.writeFile(path.join(output, 'app-entry.js'), imports);
for (const lang of ['en', 'es']) {
  const file = path.join(output, lang === 'en' ? 'index.html' : 'espanol.html');
  let html = await fs.readFile(file, 'utf8');
  html = html.replace(/<script\b[^>]*src=["'][^"']+["'][^>]*><\/script>\s*/g, '');
  html = html.replace(/<link\b(?=[^>]*\brel="stylesheet")(?=[^>]*\bhref="(?!assets\/css\/a2-studio\.css)[^"]+")[^>]*>\s*/g, '');
  html = html.replace('assets/css/a2-studio.css', 'assets/css/critical.css');
  html = html.replace('</head>', '<meta name="pg-offline" content="enabled"><script type="module" src="app-entry.js"></script>\n</head>');
  await fs.writeFile(file, html);
}
await build({ configFile: false, root: output, base: './', publicDir: false,
  build: { outDir: dist, emptyOutDir: true, target: 'es2022', cssCodeSplit: true, manifest: true,
    // Vite's preload helper modulepreloads itself when a dynamic import runs.
    // That file is already running, so Safari reports the link as an unused preload.
    modulePreload: { resolveDependencies: (_filename, deps) => deps.filter(dep => !dep.includes('preload-helper')) },
    rollupOptions: { input: { en: path.join(output, 'index.html'), es: path.join(output, 'espanol.html') }, output: {
      assetFileNames: asset => asset.names?.some(name => name.endsWith('.css')) ? 'assets/critical-[hash][extname]' : 'assets/[name]-[hash][extname]'
    } } } });
for (const item of statics) {
  const target = path.join(dist, item.target); await fs.mkdir(path.dirname(target), { recursive: true }); await fs.copyFile(item.file, target);
}
const buildInfo = JSON.parse(await fs.readFile(path.join(output, 'build.json'), 'utf8'));
for (const lang of ['en', 'es']) {
  const manifest = JSON.parse(await fs.readFile(path.join(output, `manifest.${lang}.webmanifest`), 'utf8'));
  const prepared = prepareManifest(manifest, assetMap, lang);
  await fs.writeFile(path.join(dist, prepared.name), prepared.text);
  const pageFile = path.join(dist, lang === 'en' ? 'index.html' : 'espanol.html');
  await fs.writeFile(pageFile, linkManifest(await fs.readFile(pageFile, 'utf8'), prepared.name));
}
// Vite's copies keep pre-fingerprint icon references and have the wrong directory for relative scope.
for (const entry of await fs.readdir(path.join(dist, 'assets'))) {
  if (/^manifest\.(?:en|es)-[a-zA-Z0-9_-]+\.webmanifest$/.test(entry)) await fs.unlink(path.join(dist, 'assets', entry));
}
await fs.copyFile(path.join(output, 'build.json'), path.join(dist, 'build.json'));
await fs.copyFile(path.join(output, 'robots.txt'), path.join(dist, 'robots.txt'));
// The printable educator sheets (tools/make_educator.py) are plain pages beside the game; For grown-ups links to them.
for (const name of ['educator.html', 'educador.html', 'educator.css']) await fs.copyFile(path.join(output, name), path.join(dist, name));
if (flavor === 'playtest') {
  const preview = path.join(output, 'social-preview.jpg');
  const previewBytes = (await fs.stat(preview)).size;
  if (previewBytes > 1000000) throw new Error('Social preview image exceeds 1MB');
  await fs.copyFile(preview, path.join(dist, 'social-preview.jpg'));
}
await fs.writeFile(path.join(dist, '.nojekyll'), '');
const files = (await walk(dist)).map(f => path.relative(dist, f).split(path.sep).join('/'));
const shellWords = await Promise.all(['en', 'es'].map(async lang => JSON.parse(await fs.readFile(path.join(root, 'assets/playtest/locales', lang + '.json'), 'utf8'))));
// Offline play needs the voice index and all 15 stops with their copy. Voice packs stay a grown-up's choice, and the
// plain town-map.webp and town-map@2x.webp are never requested: the game asks for the sized town-map-<width> files.
// Zoomed map crops in stops choose the 2048/2752 candidates, so their AVIF files are kept (not the WebP fallbacks).
const precache = files.filter(f => !f.endsWith('.mp3') && !/\/voice\/(?!index\.)/.test(f) && f !== 'social-preview.jpg'
  && !/\/img\/town-map(?:@2x)?\.[0-9a-f]{12}\.webp$/.test(f)
  && !/town-map-(?:2048|2752)\.[0-9a-f]{12}\.webp$/.test(f) && !f.startsWith('.vite/'));
const precacheBytes = (await Promise.all(precache.map(f => fs.stat(path.join(dist, f))))).reduce((total, stat) => total + stat.size, 0);
if (precacheBytes > 3.5 * 1048576) throw new Error(`Offline precache is ${(precacheBytes / 1048576).toFixed(2)} MB; the budget is 3.5 MB`);
for (const needed of ['assets/games/community-builders/voice/index.', 'assets/games/community-builders/stops/15-'])
  if (!precache.some(f => f.startsWith(needed))) throw new Error(`Offline precache is missing ${needed}*`);
const sw = await fs.readFile(path.join(root, 'tools/sw-template.js'), 'utf8');
// The worker keeps downloaded voice packs across updates but drops clips this build no longer uses.
const voiceClips = Object.values(assetMap).filter(target => /\/voice\/(?:en|es)\/[^/]+\.mp3$/.test(target)).sort();
await fs.writeFile(path.join(dist, 'sw.js'), sw.replace('__BUILD__', buildInfo.id).replace('__PRECACHE__', JSON.stringify(precache)).replace('__VOICE__', JSON.stringify(voiceClips)));
for (const file of files.filter(f => f.endsWith('.html'))) {
  const html = await fs.readFile(path.join(dist, file), 'utf8');
  if (/<script\b(?![^>]*\bsrc=)[^>]*>[\s\S]*?\S[\s\S]*?<\/script>/i.test(html) || /<style\b|\sstyle\s*=/i.test(html)) throw new Error(`Inline code violates CSP: ${file}`);
  if (flavor === 'playtest' && !html.includes('property="og:image" content="https://a2-learning-studio.github.io/pecan-grove-playtest/social-preview.jpg"')) throw new Error(`Social preview tags missing from deployed HTML: ${file}`);
  if (flavor === 'playtest' && !html.includes('name="twitter:card" content="summary_large_image"')) throw new Error(`Twitter card missing from deployed HTML: ${file}`);
  if (flavor === 'family' && /script\.google|pt-feedback|pt-review-tab/.test(html)) throw new Error(`Family build contains playtest connection: ${file}`);
  if (flavor === 'library' && /script\.google/.test(html)) throw new Error(`Library build must not send feedback: ${file}`);
  // Family and library copies are not a test and never send: none of the playtest-only page copy may remain.
  if (flavor !== 'playtest') for (const words of shellWords) {
    const keys = ['title', 'h1', 'intro_note', 'instructions', 'foot', 'privacy', 'consent_scores', ...(flavor === 'family' ? ['review_tab', 'intro_review'] : [])];
    const left = [words.version_badge.split('{date}')[0].trim(), ...keys.map(key => words[key])].filter(value => html.includes(value));
    if (left.length) throw new Error(`${flavor} build shows playtest-only copy in ${file}: ${left.join(' | ')}`);
  }
}
const jsBytes = await Promise.all(files.filter(f => /\.js$/.test(f) && !f.includes('/stops/') && !f.includes('/voice/')).map(async f => gzipSync(await fs.readFile(path.join(dist, f))).length));
const cssBytes = await Promise.all(files.filter(f => /\.css$/.test(f) && !f.includes('/stops/')).map(async f => gzipSync(await fs.readFile(path.join(dist, f))).length));
const receipt = { build: buildInfo.id, flavor, files: files.length + 1, precacheFiles: precache.length, precacheBytes, jsGzipBytes: jsBytes.reduce((a, b) => a + b, 0), cssGzipBytes: cssBytes.reduce((a, b) => a + b, 0), criticalCssGzipBytes: styles.criticalGzipBytes, fonts: fontReceipt, assetMapEntries: Object.keys(assetMap).length };
if (receipt.jsGzipBytes >= 120000 || receipt.cssGzipBytes >= 40000) throw new Error('Production script or stylesheet budget exceeded');
await fs.writeFile(path.join(root, `docs/build-receipt-${flavor}.json`), JSON.stringify(receipt, null, 2));
if (flavor === 'playtest') await fs.writeFile(path.join(root, 'docs/build-receipt.json'), JSON.stringify(receipt, null, 2));
console.log(`Built ${flavor} in ${dist}; CSP and family checks passed.`);
