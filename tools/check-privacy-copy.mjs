import fs from 'node:fs/promises';
const root = new URL('../dist/', import.meta.url);
let failures = 0;
for (const file of ['index.html', 'espanol.html']) {
  const text = await fs.readFile(new URL(file, root), 'utf8');
  if (/(?:automatically backs up|saves as you type|retrying automatically|copian automáticamente|guarda mientras escribes)/i.test(text)) { console.error(`Outdated privacy promise: ${file}`); failures++; }
  if (/<script\b(?![^>]*\bsrc=)[^>]*>\s*[^<\s]|<style\b|\sstyle\s*=/i.test(text)) { console.error(`Inline code in ${file}`); failures++; }
}
if (failures) process.exit(1); console.log('Privacy copy and CSP checks passed.');
