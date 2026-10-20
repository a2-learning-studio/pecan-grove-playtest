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
  if (/\/voice\/(?:en|es)\/.*\.mp3$/.test(relative)) { statics.push({ file, target: relative }); continue; }
  if (!/\.(?:webp|avif|png|svg|json)$/.test(file) && !/\/stops\/.*\.(?:js|css)$/.test(relative) && !/\/voice\/index\.js$/.test(relative) && !relative.endsWith('/full-game.css')) continue;
  const bytes = await fs.readFile(file); const hash = crypto.createHash('sha256').update(bytes).digest('hex').slice(0, 12);
  const ext = path.extname(file); const target = relative.slice(0, -ext.length) + '.' + hash + ext;
  assetMap[relative] = target; statics.push({ file, target });
}
await fs.writeFile(path.join(output, 'asset-map.json'), JSON.stringify(assetMap));
const imports = ["import map from './asset-map.json';", "window.PG_ASSET_MAP=map;", "window.PG_STYLE_HREF=map['assets/games/community-builders/full-game.css'];", "await import('./assets/playtest/boot.js');"];
await fs.writeFile(path.join(output, 'app-entry.js'), imports.join('\n'));
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
if (flavor === 'playtest') {
  const preview = path.join(output, 'social-preview.jpg');
  const previewBytes = (await fs.stat(preview)).size;
  if (previewBytes > 1000000) throw new Error('Social preview image exceeds 1MB');
  await fs.copyFile(preview, path.join(dist, 'social-preview.jpg'));
}
await fs.writeFile(path.join(dist, '.nojekyll'), '');
const files = (await walk(dist)).map(f => path.relative(dist, f).split(path.sep).join('/'));
const precache = files.filter(f => !f.endsWith('.mp3') && !f.includes('/voice/') && f !== 'social-preview.jpg' && !/\/stops\/(?!0[12]-|manifest\.)/.test(f)
  && !/\/locales\/(?:en|es)\/stop-(?!0[12]\.)/.test(f)
  && !/town-map-(?:2048|2752)\./.test(f) && !f.startsWith('.vite/'));
const sw = await fs.readFile(path.join(root, 'tools/sw-template.js'), 'utf8');
await fs.writeFile(path.join(dist, 'sw.js'), sw.replace('__BUILD__', buildInfo.id).replace('__PRECACHE__', JSON.stringify(precache)));
for (const file of files.filter(f => f.endsWith('.html'))) {
  const html = await fs.readFile(path.join(dist, file), 'utf8');
  if (/<script\b(?![^>]*\bsrc=)[^>]*>[\s\S]*?\S[\s\S]*?<\/script>/i.test(html) || /<style\b|\sstyle\s*=/i.test(html)) throw new Error(`Inline code violates CSP: ${file}`);
  if (flavor === 'playtest' && !html.includes('property="og:image" content="https://a2-learning-studio.github.io/pecan-grove-playtest/social-preview.jpg"')) throw new Error(`Social preview tags missing from deployed HTML: ${file}`);
  if (flavor === 'playtest' && !html.includes('name="twitter:card" content="summary_large_image"')) throw new Error(`Twitter card missing from deployed HTML: ${file}`);
  if (flavor === 'family' && /script\.google|pt-feedback|pt-review-tab/.test(html)) throw new Error(`Family build contains playtest connection: ${file}`);
  if (flavor === 'library' && /script\.google/.test(html)) throw new Error(`Library build must not send feedback: ${file}`);
}
const jsBytes = await Promise.all(files.filter(f => /\.js$/.test(f) && !f.includes('/stops/') && !f.includes('/voice/')).map(async f => gzipSync(await fs.readFile(path.join(dist, f))).length));
const cssBytes = await Promise.all(files.filter(f => /\.css$/.test(f) && !f.includes('/stops/')).map(async f => gzipSync(await fs.readFile(path.join(dist, f))).length));
const receipt = { build: buildInfo.id, flavor, files: files.length + 1, jsGzipBytes: jsBytes.reduce((a, b) => a + b, 0), cssGzipBytes: cssBytes.reduce((a, b) => a + b, 0), criticalCssGzipBytes: styles.criticalGzipBytes, fonts: fontReceipt, assetMapEntries: Object.keys(assetMap).length };
if (receipt.jsGzipBytes >= 120000 || receipt.cssGzipBytes >= 40000) throw new Error('Production script or stylesheet budget exceeded');
await fs.writeFile(path.join(root, `docs/build-receipt-${flavor}.json`), JSON.stringify(receipt, null, 2));
if (flavor === 'playtest') await fs.writeFile(path.join(root, 'docs/build-receipt.json'), JSON.stringify(receipt, null, 2));
console.log(`Built ${flavor} in ${dist}; CSP and family checks passed.`);
