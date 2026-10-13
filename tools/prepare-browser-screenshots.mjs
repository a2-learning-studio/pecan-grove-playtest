/* Test dependency compatibility only. The game CSP and violation checks stay intact. */
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const supportedVersion = '1.64.0';
const upstream = `function inPagePrepareForScreenshots(screenshotStyle, hideCaret, disableAnimations, syncAnimations) {
  if (syncAnimations) {
    const style = document.createElement("style");
    style.textContent = "body {}";
    document.head.appendChild(style);
    document.documentElement.getBoundingClientRect();
    style.remove();
  }`;
const replacement = `function inPagePrepareForScreenshots(screenshotStyle, hideCaret, disableAnimations, syncAnimations) {
  if (syncAnimations) {
    // Pecan Grove CI: synchronize through an existing allowed first-party sheet.
    // Creating a new inline style violates the strict product policy in WebKit.
    const sheet = Array.from(document.styleSheets).find(candidate => {
      try {
        return candidate.href && new URL(candidate.href, document.baseURI).origin === location.origin && !candidate.disabled && candidate.cssRules;
      } catch { return false; }
    });
    if (sheet) {
      const index = sheet.cssRules.length;
      sheet.insertRule("body {}", index);
      try { document.documentElement.getBoundingClientRect(); }
      finally { sheet.deleteRule(index); }
    } else {
      // A page without an allowed stylesheet has no stylesheet animations to sync.
      document.documentElement.getBoundingClientRect();
    }
  }`;
export function prepareScreenshotSource(source, version) {
  if (version !== supportedVersion) throw new Error(`Review the screenshot workaround for Playwright ${version}; expected ${supportedVersion}.`);
  if (source.split(replacement).length === 2 && !source.includes(upstream)) return source;
  if (source.split(upstream).length !== 2 || source.includes(replacement)) {
    throw new Error('The exact upstream screenshot synchronization block changed; no dependency patch was applied.');
  }
  return source.replace(upstream, replacement);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.env.GITHUB_ACTIONS !== 'true') throw new Error('Apply the browser screenshot compatibility patch only in GitHub Actions.');
  const require = createRequire(import.meta.url);
  const packagePath = require.resolve('playwright-core/package.json');
  const version = JSON.parse(await fs.readFile(packagePath, 'utf8')).version;
  const target = path.join(path.dirname(packagePath), 'lib/coreBundle.js');
  const source = await fs.readFile(target, 'utf8');
  const updated = prepareScreenshotSource(source, version);
  if (updated !== source) await fs.writeFile(target, updated);
  console.log(`Playwright ${version}: guarded first-party stylesheet screenshot synchronization ready.`);
}
