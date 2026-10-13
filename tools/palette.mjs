/* Preserve authored colors while giving every stylesheet one palette source. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const tokenFile = path.join(root, 'assets/games/community-builders/engine/tokens.css');
let tokens = await fs.readFile(tokenFile, 'utf8');
const palette = new Map([...tokens.matchAll(/(--pg-[\w-]+):\s*(#[\da-f]{3,8})\s*;/gi)].map(match => [match[2].toLowerCase(), match[1]]));
const additions = new Map();
const color = /#(?:[\da-f]{8}|[\da-f]{6}|[\da-f]{4}|[\da-f]{3})\b/gi;
const replace = source => source.replace(color, value => {
  const key = value.toLowerCase();
  let name = palette.get(key);
  if (!name) { name = `--pg-color-${key.slice(1)}`; palette.set(key, name); additions.set(name, key); }
  return `var(${name})`;
});
async function walk(folder) {
  const files = [];
  for (const item of await fs.readdir(folder, { withFileTypes: true })) {
    const file = path.join(folder, item.name);
    if (item.isDirectory()) files.push(...await walk(file));
    else if (item.name.endsWith('.css') && file !== tokenFile) files.push(file);
  }
  return files;
}
const targets = [...await walk(path.join(root, 'assets/games/community-builders')), ...await walk(path.join(root, 'assets/playtest'))];
let changed = 0;
for (const file of targets) {
  const before = await fs.readFile(file, 'utf8'), after = replace(before);
  if (before !== after) { await fs.writeFile(file, after); changed++; }
}
const builder = path.join(root, 'tools/make_playtest.py');
const source = await fs.readFile(builder, 'utf8');
await fs.writeFile(builder, source.replace(/CSS = """([\s\S]*?)"""/, (_, css) => `CSS = """${replace(css)}"""`));
if (additions.size) {
  tokens += '\n/* Additional authored palette shades used by stop artwork labels. */\n:root {\n';
  for (const [name, value] of [...additions].sort()) tokens += `  ${name}: ${value};\n`;
  await fs.writeFile(tokenFile, tokens + '}\n');
}
console.log(`Centralized ${changed} stylesheets; ${additions.size} palette shades added.`);
