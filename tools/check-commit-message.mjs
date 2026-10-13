import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {findEmoji} from './check-no-emoji.mjs';

const LAST_TICKET = [17, 18, 11, 8, 9];
export function checkCommitMessage(message) {
  const subject = String(message).split(/\r?\n/).find(line => line.trim() && !line.startsWith('#')) || '';
  const ids = [...subject.matchAll(/\bP(\d+)-(\d{2})\b/g)];
  const known = ([, phase, number]) => Number(phase) < LAST_TICKET.length && Number(number) <= LAST_TICKET[Number(phase)] && (Number(phase) === 0 || Number(number) > 0);
  const valid = ids.some(known);
  const failures = [];
  if (!valid) failures.push('The subject must include a specification ticket ID, for example P4-08: Add quality checks.');
  if (ids.some(id => !known(id))) failures.push('The subject contains an unknown specification ticket ID.');
  if (findEmoji(String(message)).length) failures.push('Commit messages must not contain pictographic characters.');
  return failures;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (!process.argv[2]) throw Error('Pass the Git commit-message file to this check.');
    const failures = checkCommitMessage(await fs.readFile(process.argv[2], 'utf8'));
    for (const failure of failures) console.error(failure);
    if (failures.length) process.exitCode = 1;
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
