import test from 'node:test';
import assert from 'node:assert/strict';
import {findEmoji, checkNoEmoji} from '../check-no-emoji.mjs';
import {checkCommitMessage} from '../check-commit-message.mjs';

test('no-emoji check recognizes pictographs and flags and reports Unicode-aware locations',()=>{
  const found=findEmoji('Plain text\nñ\u{1F642} x \u{1F1EA}\u{1F1F8}');
  assert.deepEqual(found,[{line:2,column:2,codepoint:'U+1F642'},{line:2,column:6,codepoint:'U+1F1EA'},{line:2,column:7,codepoint:'U+1F1F8'}]);
});
test('no-emoji check preserves bilingual accents, punctuation and escaped Unicode test cases',()=>assert.deepEqual(findEmoji('¿Qué cambió? Niño, mañana, résumé. \\u{1F642}'),[]));
test('source scanner checks its own tools and documents without following generated outputs',async()=>{
  const result=await checkNoEmoji(['tools/check-no-emoji.mjs','tools/check-commit-message.mjs','tools/tests/modernization-hygiene.test.mjs']);assert.equal(result.checked,3);assert.deepEqual(result.findings,[]);
});
for(const message of ['P0-00: Add the test harness','P0-17/P1-18: Improve bilingual copy','fix(P4-08): Add hooks','[P3-08] Improve offline behavior','P4-09: Add content review\n\nReviewed claim sources.'])test(`ticket subject accepts ${message.split('\n')[0]}`,()=>assert.deepEqual(checkCommitMessage(message),[]));
for(const message of ['Improve things','P4-00: Unknown','P0-18: Unknown','P1-19: Unknown','P2-12: Unknown','P3-09: Unknown','P4-10: Unknown','P4-08/P4-99: Mixed validity','P4-08/P5-01: Unknown phase'])test(`ticket subject rejects ${message}`,()=>assert.ok(checkCommitMessage(message).length));
test('commit check catches pictographs in subject and body',()=>{assert.ok(checkCommitMessage('P4-08: Add checks \u{1F642}').length);assert.ok(checkCommitMessage('P4-08: Add checks\n\n\u{1F642}').length);});
