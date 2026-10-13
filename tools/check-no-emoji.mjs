import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const PROJECT = fileURLToPath(new URL('../', import.meta.url));
const SKIP = new Set(['.git', 'node_modules', 'dist', '_publish', 'backups', 'test-results', 'playwright-report', 'coverage', '__pycache__']);
const SOURCE = new Set(['.js', '.mjs', '.cjs', '.ts', '.css', '.html', '.json', '.md', '.py', '.svg', '.yml', '.yaml', '.ejs']);

export function findEmoji(text) {
  const found = [];
  for (const match of text.matchAll(/[\p{Extended_Pictographic}\p{Regional_Indicator}]/gu)) {
    const before = text.slice(0, match.index), line = before.split('\n').length;
    const column = [...before.slice(before.lastIndexOf('\n') + 1)].length + 1;
    found.push({line, column, codepoint: 'U+' + match[0].codePointAt(0).toString(16).toUpperCase()});
  }
  return found;
}

export async function checkNoEmoji(inputs = ['.'], root = PROJECT) {
  const findings = [], seen = new Set(); let checked = 0;
  async function visit(target) {
    const absolute = path.resolve(root, target);
    if (seen.has(absolute)) return;
    seen.add(absolute);
    const stat = await fs.lstat(absolute);
    if (stat.isSymbolicLink()) return;
    if (stat.isDirectory()) {
      for (const item of await fs.readdir(absolute, {withFileTypes:true})) {
        if (!SKIP.has(item.name) && !item.isSymbolicLink()) await visit(path.join(absolute, item.name));
      }
    } else if (stat.isFile() && SOURCE.has(path.extname(absolute).toLowerCase())) {
      checked++;
      for (const match of findEmoji(await fs.readFile(absolute, 'utf8'))) findings.push({file:path.relative(root, absolute).replaceAll('\\','/'), ...match});
    }
  }
  for (const input of inputs) await visit(input);
  return {checked, findings};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await checkNoEmoji(process.argv.slice(2).length ? process.argv.slice(2) : ['.']);
    for (const item of result.findings) console.error(`${item.file}:${item.line}:${item.column}: pictographic character ${item.codepoint}`);
    if (result.findings.length) process.exitCode = 1;
    else console.log(`No-emoji check passed (${result.checked} source/document files).`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
