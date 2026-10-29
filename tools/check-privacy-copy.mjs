import fs from 'node:fs/promises';
const repo = new URL('../', import.meta.url), root = new URL('dist/', repo);
// Retired promises: feedback no longer backs up by itself, and sending no longer needs a timed hold.
const OUTDATED = /(?:automatically backs up|backs up automatically|saves as you type|retrying automatically|copian automáticamente|guarda mientras escribes|hold(?:ing)? (?:the )?send(?: button)? for (?:two|2) seconds|mantenga pulsado 2 segundos)/i;
let failures = 0;
async function check(url, label, html) {
  const text = await fs.readFile(url, 'utf8');
  if (OUTDATED.test(text)) { console.error(`Outdated privacy promise: ${label}`); failures++; }
  if (html && /<script\b(?![^>]*\bsrc=)[^>]*>\s*[^<\s]|<style\b|\sstyle\s*=/i.test(text)) { console.error(`Inline code in ${label}`); failures++; }
  return text;
}
for (const file of ['index.html', 'espanol.html']) await check(new URL(file, root), file, true);
// Reviewers read these before any build: the README, the feedback policy docs and any page left at the repository root.
for (const file of ['README.md', 'backend/feedback/README.md', 'docs/feedback-endpoint.md', 'assets/playtest/locales/feedback-en.json', 'assets/playtest/locales/feedback-es.json']) await check(new URL(file, repo), file, false);
for (const file of (await fs.readdir(repo)).filter(name => name.endsWith('.html'))) {
  // CI deploys dist/. A page at the root is a stale export and must not carry a receiver address.
  if (/script\.google(?:usercontent)?\.com/.test(await check(new URL(file, repo), file, true))) { console.error(`Stale root page embeds the feedback receiver: ${file}`); failures++; }
}
if (failures) process.exit(1); console.log('Privacy copy and CSP checks passed.');
