'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const crypto = require('node:crypto');
const runtime = require('../../assets/playtest/feedback.js');

const code = fs.readFileSync(path.join(__dirname, 'Code.gs'), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));
const sessionId = 'session_0123456789abcdef';
const entryId = 'entry_0123456789abcdef';

function validEntry(overrides = {}) {
  return {sessionId, entryId, revision: 1, updatedAt: '2026-10-12T12:00:00.000Z',
    createdAt: '2026-10-12T11:59:00.000Z', language: 'en', build: '7f805c04a6ae',
    stop: 4, score: 75, rating: 'okay', category: 'clarity',
    worked: 'The pictures helped.', fix: 'Explain this word.', ...overrides};
}

function harness(options = {}) {
  const calls = {locks: 0, releases: 0, opens: 0, flushes: 0, writes: 0, grow: 0};
  let grid = [];
  let maximumRows = options.maximumRows || 1000;
  const properties = Object.create(null);
  const lock = {
    held: false,
    tryLock() { calls.locks++; this.held = !options.busy; return this.held; },
    hasLock() { return this.held; },
    releaseLock() { this.held = false; calls.releases++; }
  };
  const sheet = {
    getLastRow() { return options.lastRow || grid.length; },
    getMaxRows() { return maximumRows; },
    insertRowsAfter(last, amount) { assert.equal(last, maximumRows); maximumRows += amount; calls.grow++; },
    getRange(row, col, height, width) {
      if (typeof row === 'string') return {setWrap() { return this; }};
      return {
        getValues() { return Array.from({length: height}, (_, r) =>
          Array.from({length: width}, (_, c) => (grid[row - 1 + r] || [])[col - 1 + c] ?? '')); },
        setValues(values) {
          calls.writes++;
          values.forEach((valuesRow, r) => {
            grid[row - 1 + r] ||= [];
            valuesRow.forEach((value, c) => { grid[row - 1 + r][col - 1 + c] = value; });
          });
          return this;
        },
        setNumberFormat() { return this; }, setFontWeight() { return this; },
        setBackground() { return this; }, setFontColor() { return this; }
      };
    },
    setFrozenRows() {}
  };
  const context = vm.createContext({
    ContentService: {MimeType: {JSON: 'json'}, createTextOutput(contents) {
      return {contents, setMimeType(mime) { this.mime = mime; return this; }};
    }},
    Utilities: {newBlob(value) { return {getBytes() { return Array.from(Buffer.from(value, 'utf8')); }}; },
      DigestAlgorithm: {SHA_256: 'sha256'}, Charset: {UTF_8: 'utf8'},
      computeDigest(algorithm, value, charset) { return Array.from(crypto.createHash(algorithm).update(value, charset).digest()); }},
    LockService: {getScriptLock() { return lock; }},
    PropertiesService: {getScriptProperties() { return {
      getProperty(key) { return key === 'PECAN_GROVE_SPREADSHEET_ID' ? (options.noWorkbook ? null : 'test-private-workbook') : properties[key] || null; },
      setProperties(values) { Object.assign(properties, values); }
    }; }},
    SpreadsheetApp: {
      openById(id) {
        assert.equal(id, 'test-private-workbook');
        calls.opens++;
        if (options.sheetError) throw new Error('Private owner spreadsheet ' + id);
        return {getSheetByName(name) { assert.equal(name, 'Responses'); return sheet; }};
      },
      flush() { calls.flushes++; if (options.flushError) throw new Error('private storage failure'); }
    }
  });
  vm.runInContext(code, context, {filename: 'Code.gs'});
  const headers = vm.runInContext('FEEDBACK_HEADERS.slice()', context);
  grid = [plain(headers)];
  function request(entries, extra = {}) {
    const raw = JSON.stringify({schemaVersion: 1, entries, ...extra});
    return {postData: {contents: raw, length: Buffer.byteLength(raw)}};
  }
  return {context, calls, properties, sheet, lock,
    get grid() { return grid; }, set grid(value) { grid = value; },
    request,
    post(entries, extra) { return JSON.parse(context.doPost(request(entries, extra)).contents); },
    validate(entry) { return plain(context.feedbackEntry_(entry)); }
  };
}

test('valid bilingual feedback, progress and ended sessions normalize without personal fields', () => {
  const h = harness();
  const entry = h.validate(validEntry({language: 'es', kind: 'progress', scores: {'1': 100, '15': 70},
    sessionEnded: true, worked: 'La voz me ayudó.', name: 'Ignored private field'}));
  assert.equal(entry.language, 'es');
  assert.deepEqual(entry.scores, {'1': 100, '15': 70});
  assert.equal(entry.sessionEnded, true);
  assert.equal(entry.name, undefined);
});

test('required identity, revision, language, time, build and range limits reject malformed entries', () => {
  const h = harness();
  const bad = [
    {sessionId: 'short'}, {entryId: '../invalid-entry-id'}, {revision: 0}, {revision: 1.1},
    {revision: undefined}, {language: 'fr'}, {updatedAt: 'today'}, {updatedAt: undefined},
    {build: 'bad build'}, {build: ''}, {stop: 16}, {stop: '4'}, {score: 101},
    {rating: 'excellent'}, {category: 'email'}, {kind: 'account'}, {sessionEnded: 'yes'},
    {worked: 'x'.repeat(1201)}, {fix: 'bad\u0000text'}, {scores: {16: 100}}, {scores: {1: -1}},
    {scores: [100]}, {scores: {1: null}}
  ];
  for (const changes of bad) assert.throws(() => h.validate(validEntry(changes)), /invalid_entry/);
});

test('request rejects invalid JSON/schema, empty/oversized batches and oversized UTF-8 before sheet access', () => {
  const h = harness();
  const cases = [undefined, {postData: {contents: '{'}}, h.request([], {}),
    h.request([validEntry()], {schemaVersion: 2}), h.request(Array.from({length: 21}, () => validEntry())),
    {postData: {contents: 'é'.repeat(33000), length: 0}}];
  for (const event of cases) assert.equal(JSON.parse(h.context.doPost(event).contents).ok, false);
  assert.equal(h.calls.opens, 0);
  assert.equal(h.calls.locks, 0);
});

test('POST appends once and acknowledges only committed revision after flush', () => {
  const h = harness();
  const result = h.post([validEntry()]);
  assert.deepEqual(result, {ok: true, schemaVersion: 1, acknowledged: [{sessionId, entryId, revision: 1}], conflicts: []});
  assert.equal(h.calls.flushes, 1);
  assert.equal(h.calls.releases, 1);
  assert.equal(h.grid.length, 2);
  assert.equal(h.grid[1][0], sessionId + ':' + entryId);
  assert.equal(h.grid[1][15], 'The pictures helped.');
});

test('higher revisions update; repeat and delayed older requests never create duplicate rows or overwrite', () => {
  const h = harness();
  h.post([validEntry()]);
  const latest = h.post([validEntry({revision: 3, fix: 'Updated suggestion'})]);
  const repeat = h.post([validEntry({revision: 3, fix: 'Updated suggestion'})]);
  const delayed = h.post([validEntry({revision: 2})]);
  assert.equal(h.grid.length, 2);
  assert.equal(h.grid[1][16], 'Updated suggestion');
  for (const response of [latest, repeat]) assert.equal(response.acknowledged[0].revision, 3);
  assert.equal(delayed.acknowledged.length, 0);
  assert.deepEqual(delayed.conflicts, [{sessionId, entryId, revision: 3}]);
});

test('same revision with different text is a conflict and never falsely acknowledged as backed up', () => {
  const h = harness();
  h.post([validEntry({fix: 'First tab text'})]);
  const collision = h.post([validEntry({fix: 'Second tab text'})]);
  assert.deepEqual(collision, {ok: true, schemaVersion: 1, acknowledged: [], conflicts: [{sessionId, entryId, revision: 1}]});
  assert.equal(h.grid[1][16], 'First tab text');
  const resolved = h.post([validEntry({revision: 2, fix: 'Second tab text'})]);
  assert.equal(resolved.acknowledged[0].revision, 2);
  assert.equal(h.grid[1][16], 'Second tab text');
});

test('same computer/new player retains separate rows even if entry ID is reused', () => {
  const h = harness();
  h.post([validEntry(), validEntry({sessionId: 'different_player_0123456789'})]);
  assert.equal(h.grid.length, 3);
  assert.notEqual(h.grid[1][0], h.grid[2][0]);
});

test('a batch deduplicates repeated record revisions and rejects conflicting same revision content', () => {
  const h = harness();
  const result = h.post([validEntry(), validEntry({revision: 2}), validEntry()]);
  assert.equal(h.grid.length, 2);
  assert.equal(result.acknowledged.length, 1);
  assert.equal(result.acknowledged[0].revision, 2);
  const conflict = h.post([validEntry(), validEntry({fix: 'different same revision'})]);
  assert.deepEqual(conflict, {ok: false, error: 'revision_conflict'});
});

test('spreadsheet-formula strings are stored as literal text including whitespace prefixes', () => {
  const h = harness();
  h.post([validEntry({worked: '=IMPORTXML("https://example.invalid","//x")', fix: '\t@SUM(1)', stationId: '-1+2'})]);
  assert.equal(h.grid[1][15].charAt(0), "'");
  assert.equal(h.grid[1][16], '\t[removed](1)');
  assert.equal(h.grid[1][9], "'-1+2");
  assert.equal(h.context.feedbackCell_("'literal"), "''literal");
});

test('lock contention and daily limits keep data queued without success acknowledgement', () => {
  const busy = harness({busy: true});
  assert.deepEqual(busy.post([validEntry()]), {ok: false, error: 'busy'});
  assert.equal(busy.calls.opens, 0);
  const capped = harness();
  capped.properties.feedbackUtcDay = new Date().toISOString().slice(0, 10);
  capped.properties.feedbackRequests = '10000';
  assert.deepEqual(capped.post([validEntry()]), {ok: false, error: 'daily_limit'});
  assert.equal(capped.calls.opens, 0);
  assert.equal(capped.calls.releases, 1);
});

test('capacity is checked for the whole batch before modifying any response row', () => {
  const h = harness({lastRow: 50001});
  assert.deepEqual(h.post([validEntry()]), {ok: false, error: 'capacity'});
  assert.equal(h.calls.writes, 0);
});

test('the sheet grid grows safely when append reaches its existing bottom row', () => {
  const h = harness({maximumRows: 1});
  assert.equal(h.post([validEntry()]).ok, true);
  assert.equal(h.calls.grow, 1);
});

test('flush and private Sheet failures return a generic error, never feedback or owner metadata', () => {
  for (const option of [{flushError: true}, {sheetError: true}]) {
    const h = harness(option);
    const result = h.post([validEntry({worked: 'Do not echo this comment'})]);
    assert.deepEqual(result, {ok: false, error: 'unavailable'});
    assert.equal(h.calls.releases, 1);
  }
});

test('GET provides health metadata with no read of response rows or private Sheet ID', () => {
  const h = harness();
  const result = JSON.parse(h.context.doGet().contents);
  assert.deepEqual(result, {ok: true, service: 'pecan-grove-feedback', schemaVersion: 1, accepts: 'POST'});
  assert.equal(h.calls.opens, 0);
  assert.equal(JSON.stringify(result).includes('1AVhc06'), false);
});

test('header drift fails closed instead of writing under incorrect owner columns', () => {
  const h = harness();
  h.grid[0][0] = 'Moved column';
  assert.deepEqual(h.post([validEntry()]), {ok: false, error: 'unavailable'});
  assert.equal(h.calls.writes, 0);
});

test('owner setup formats the expected private sheet without invoking sharing or Drive services', () => {
  const h = harness();
  assert.match(h.context.setupFeedback_(), /Keep the spreadsheet private/);
  assert.equal(h.calls.flushes, 1);
  assert.equal(h.calls.releases, 1);
  assert.equal(/DriveApp|setSharing|addViewer|getOAuthToken/.test(code), false);
});

function runtimeModel() {
  const disk = new Map(); let id = 0;
  return runtime.createModel({build: 'preview', language: 'en',
    id: () => 'anonymous_test_' + String(++id).padStart(16, '0'),
    storage: {getItem: key => disk.get(key) || null, setItem: (key, value) => disk.set(key, value)}});
}

function backendFetcher(h) {
  return async (_, request) => {
    assert.equal(request.mode, 'cors');
    assert.equal(request.credentials, 'omit');
    assert.equal(request.headers['Content-Type'], 'text/plain;charset=UTF-8');
    const result = h.context.doPost({postData: {contents: request.body, length: Buffer.byteLength(request.body)}});
    return {ok: true, json: async () => JSON.parse(result.contents)};
  };
}

test('actual browser queue and actual collector interoperate for anonymous session/feedback/progress revisions', async () => {
  const h = harness(); const model = runtimeModel();
  model.upsert('session', 0, {phase: 'start'});
  model.upsert('feedback', 4, {rating: 'okay', category: 'spanish', worked: 'La voz ayudó.', fix: 'Use a simpler word.'});
  model.upsert('progress', 4, {phase: 'result', score: 75});
  model.submit(model.find('feedback', 4).entryId, true);
  const count = await runtime.sendBatch(model, 'https://script.google.com/macros/s/test-deployment/exec', backendFetcher(h));
  assert.equal(count, 3);
  assert.equal(model.pending().length, 0);
  assert.equal(h.grid.length, 4);
  model.upsert('feedback', 4, {fix: 'Updated comment'});
  model.submit(model.find('feedback', 4).entryId, true);
  await runtime.sendBatch(model, 'https://script.google.com/macros/s/test-deployment/exec', backendFetcher(h));
  assert.equal(h.grid.length, 4);
  assert.equal(h.grid.find(row => row[10] === 'feedback')[16], 'Updated comment');
});

test('actual browser queue resolves collector revision conflict before it can report confirmed backup', async () => {
  const h = harness(); const model = runtimeModel();
  const local = model.upsert('feedback', 2, {fix: 'Newest local comment'});
  model.submit(local.entryId, false);
  h.post([{...local, fix: 'Other tab at the same revision'}]);
  const endpoint = 'https://script.google.com/macros/s/test-deployment/exec';
  assert.equal(await runtime.sendBatch(model, endpoint, backendFetcher(h)), 0);
  assert.equal(model.pending().length, 1);
  assert.equal(model.pending()[0].revision, 2);
  assert.equal(await runtime.sendBatch(model, endpoint, backendFetcher(h)), 1);
  assert.equal(model.pending().length, 0);
  assert.equal(h.grid[1][16], 'Newest local comment');
});

test('missing private workbook property rejects storage without opening any workbook', () => {
  const h = harness({noWorkbook: true});
  assert.equal(h.post([validEntry()]).ok, false);
  assert.equal(h.calls.opens, 0);
  assert.equal(JSON.parse(h.context.doGet().contents).ok, true);
});
