/**
 * Pecan Grove anonymous playtest feedback collector.
 * Install in the owner's Apps Script editor; do not copy this into the public site.
 * Run setupFeedback_ once, then deploy as the owner with anonymous web-app access.
 */
const FEEDBACK_CONFIG = Object.freeze({
  spreadsheetProperty: 'PECAN_GROVE_SPREADSHEET_ID',
  sheetName: 'Responses',
  schemaVersion: 1,
  maxBodyBytes: 65536,
  maxRequestsPerStationHour: 30,
  maxRequestsPerHour: 300,
  maxEntriesPerRequest: 20,
  maxRows: 50000,
  maxRequestsPerUtcDay: 10000,
  lockWaitMs: 10000
});

const FEEDBACK_HEADERS = Object.freeze([
  'Record key', 'Session ID', 'Entry ID', 'Revision', 'Created at (client UTC)',
  'Updated at (client UTC)', 'Received at (server UTC)', 'Language', 'Build',
  'Station ID', 'Kind', 'Stop', 'Score', 'Rating', 'Category', 'Worked well',
  'Fix or suggestion', 'Phase', 'Session ended', 'Scores JSON', 'Payload SHA-256'
]);

/** Owner setup. This function never changes the spreadsheet's sharing. */
function setupFeedback_() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(FEEDBACK_CONFIG.lockWaitMs)) throw new Error('busy');
  try {
    const sheet = feedbackSheet_();
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, FEEDBACK_HEADERS.length)
      .setFontWeight('bold').setBackground('#153d35').setFontColor('#ffffff');
    sheet.getRange('P:Q').setWrap(true);
    SpreadsheetApp.flush();
    return 'Responses is ready. Keep the spreadsheet private.';
  } finally {
    lock.releaseLock();
  }
}

/** GET exposes only a service label, never feedback, IDs, or spreadsheet metadata. */
function doGet() {
  return feedbackJson_({ok: true, service: 'pecan-grove-feedback', schemaVersion: 1, accepts: 'POST'});
}

function doPost(event) {
  let lock;
  try {
    const entries = feedbackRequest_(event);
    lock = LockService.getScriptLock();
    if (!lock.tryLock(FEEDBACK_CONFIG.lockWaitMs)) return feedbackJson_({ok: false, error: 'busy'});
    feedbackHourlyLimit_(entries);
    feedbackDailyLimit_();
    const sheet = feedbackSheet_();
    const result = feedbackUpsert_(sheet, entries, new Date().toISOString());
    // A reply is an acknowledgement of committed cells, not merely a received request.
    SpreadsheetApp.flush();
    return feedbackJson_({ok: true, schemaVersion: 1, acknowledged: result.acknowledged, conflicts: result.conflicts});
  } catch (error) {
    // Do not put comments, payloads, account IDs, or private Sheet errors in logs/replies.
    const safeCodes = ['invalid_request', 'invalid_entry', 'too_large', 'capacity', 'daily_limit', 'hourly_limit', 'revision_conflict'];
    const code = error && safeCodes.indexOf(error.message) !== -1 ? error.message : 'unavailable';
    return feedbackJson_({ok: false, error: code});
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock();
  }
}

function feedbackJson_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}

function feedbackRequest_(event) {
  const post = event && event.postData;
  if (!post || typeof post.contents !== 'string') throw new Error('invalid_request');
  const raw = post.contents;
  // postData.length is supplied by Apps Script; independently bound UTF-8 bytes too.
  if (raw.length > FEEDBACK_CONFIG.maxBodyBytes || Number(post.length) > FEEDBACK_CONFIG.maxBodyBytes ||
      Utilities.newBlob(raw).getBytes().length > FEEDBACK_CONFIG.maxBodyBytes) throw new Error('too_large');
  let data;
  try { data = JSON.parse(raw); } catch (_) { throw new Error('invalid_request'); }
  if (!feedbackObject_(data) || data.schemaVersion !== 1 || !Array.isArray(data.entries) ||
      data.entries.length < 1 || data.entries.length > FEEDBACK_CONFIG.maxEntriesPerRequest) throw new Error('invalid_request');
  const byKey = Object.create(null);
  data.entries.map(feedbackEntry_).forEach(function (entry) {
    const key = entry.sessionId + ':' + entry.entryId;
    const previous = byKey[key];
    if (previous && previous.revision === entry.revision && JSON.stringify(previous) !== JSON.stringify(entry)) {
      throw new Error('revision_conflict');
    }
    if (!previous || entry.revision > previous.revision) byKey[key] = entry;
  });
  const entries = Object.keys(byKey).map(function (key) { return byKey[key]; });
  if (new Set(entries.map(function (entry) { return entry.stationId || 'unspecified'; })).size !== 1) throw new Error('invalid_request');
  return entries;
}

function feedbackObject_(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function feedbackText_(value, maximum, fallback) {
  if (value === undefined || value === null) return fallback === undefined ? '' : fallback;
  if (typeof value !== 'string' || value.length > maximum || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value)) {
    throw new Error('invalid_entry');
  }
  return value;
}

function feedbackChoice_(value, choices, fallback) {
  const result = value === undefined || value === null ? fallback : value;
  if (choices.indexOf(result) === -1) throw new Error('invalid_entry');
  return result;
}

function feedbackInteger_(value, minimum, maximum, fallback) {
  if (value === undefined || value === null) return fallback;
  if (!Number.isInteger(value) || value < minimum || value > maximum) throw new Error('invalid_entry');
  return value;
}

function feedbackDate_(value, fallback) {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== 'string' || value.length > 35 || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value) ||
      !Number.isFinite(Date.parse(value))) throw new Error('invalid_entry');
  return new Date(value).toISOString();
}

function feedbackEntry_(entry) {
  if (!feedbackObject_(entry)) throw new Error('invalid_entry');
  const sessionId = feedbackText_(entry.sessionId, 80);
  const entryId = feedbackText_(entry.entryId, 80);
  if (!/^[A-Za-z0-9_-]{16,80}$/.test(sessionId) || !/^[A-Za-z0-9_-]{16,80}$/.test(entryId)) throw new Error('invalid_entry');
  const revision = feedbackInteger_(entry.revision, 1, 2147483647);
  if (revision === undefined) throw new Error('invalid_entry');
  const updatedAt = feedbackDate_(entry.updatedAt);
  if (!updatedAt) throw new Error('invalid_entry');
  const language = feedbackChoice_(entry.language, ['en', 'es']);
  const build = feedbackText_(entry.build, 40);
  if (!build || !/^[A-Za-z0-9._-]+$/.test(build)) throw new Error('invalid_entry');
  const scores = Object.create(null);
  if (entry.scores !== undefined && entry.scores !== null) {
    if (!feedbackObject_(entry.scores) || Object.keys(entry.scores).length > 15) throw new Error('invalid_entry');
    Object.keys(entry.scores).sort(function (a, b) { return Number(a) - Number(b); }).forEach(function (key) {
      if (!/^(?:[1-9]|1[0-5])$/.test(key)) throw new Error('invalid_entry');
      scores[key] = feedbackInteger_(entry.scores[key], 0, 100);
      if (scores[key] === undefined || scores[key] === null) throw new Error('invalid_entry');
    });
  }
  if (entry.sessionEnded !== undefined && typeof entry.sessionEnded !== 'boolean') throw new Error('invalid_entry');
  return {
    sessionId: sessionId, entryId: entryId, revision: revision,
    createdAt: feedbackDate_(entry.createdAt, updatedAt), updatedAt: updatedAt,
    language: language, build: build, stationId: feedbackText_(entry.stationId, 80),
    kind: feedbackChoice_(entry.kind, ['feedback', 'progress', 'session'], 'feedback'),
    stop: feedbackInteger_(entry.stop, 0, 15, 0), score: feedbackInteger_(entry.score, 0, 100, null),
    rating: feedbackChoice_(entry.rating, ['', 'unclear', 'okay', 'good'], ''),
    category: feedbackChoice_(entry.category, ['', 'clarity', 'bug', 'voice', 'spanish', 'art', 'other'], ''),
    worked: feedbackScrubPII_(feedbackText_(entry.worked, 1200), language), fix: feedbackScrubPII_(feedbackText_(entry.fix, 1200), language),
    phase: feedbackText_(entry.phase, 40), sessionEnded: entry.sessionEnded === true, scores: scores
  };
}

/** Recheck contact details even when a client bypasses its preview. */
function feedbackScrubPII_(text, language) {
  const removed = language === 'es' ? '[quitado]' : '[removed]';
  // Numbers right after "stop" or "parada" are the game's stops, never a house number or a phone number.
  const afterStop = function (all, offset) { return /\b(?:stops?|paradas?)\s*(?:#|no\.?|n[uú]m(?:ero)?\.?)?\s*$/i.test(all.slice(0, offset)); };
  const keepStop = function (value, offset, all) { return afterStop(all, offset) ? value : removed; };
  return text
    .replace(/(?:https?:\/\/|www\.)[^\s<>]+/gi, removed)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, removed)
    .replace(/\b\d{1,6}\s+(?:calle|avenida|carrera|camino|paseo|carretera)\s+(?:[A-Za-zÀ-ÿ.'-]+(?:[ \t]+|$)){1,4}/gi, keepStop)
    // A street name is not made of everyday words: "2 was a good way" and "3 kids on the street" stay.
    .replace(/\b\d{1,6}\s+(?:(?!(?:the|a|an|and|or|but|of|on|in|at|to|for|with|from|by|was|were|is|are|it|my|our|your|this|that|same|el|la|los|las|un|una|y|en|es|fue|con|por)\s)[A-Za-zÀ-ÿ.'-]+\s+){0,4}(?:street|st|road|rd|avenue|ave|lane|ln|drive|dr|boulevard|blvd|way|court|ct|calle|avenida|av|carrera|camino|paseo|carretera)\b(?:\s+(?:apt|unit|piso|n[oú]mero)\.?\s*[A-Za-z0-9-]+)?/gi, keepStop)
    .replace(/\b(?:calle|avenida|carrera|camino|paseo|carretera)\s+(?:[A-Za-zÀ-ÿ.'-]+\s+){0,4}\d{1,6}\b/gi, function (value) { return afterStop(value, value.search(/\d+$/)) ? value : removed; })
    .replace(/(?:\+?\d|\(\d)[\d\s().-]{5,}\d/g, function (value, offset, all) { return value.replace(/\D/g, '').length >= 7 && !(afterStop(all, offset) && /^\d{1,2}(?:[\s.-]+\d{1,2})*$/.test(value)) ? removed : value; })
    .replace(/(^|[^A-Za-z0-9_])@[A-Za-z0-9_.-]{1,50}/g, function (_, prefix) { return prefix + removed; });
}

/** Called under the script lock. Counters are bounded to the current hour. */
function feedbackHourlyLimit_(entries) {
  const store = PropertiesService.getScriptProperties();
  const hour = new Date().toISOString().slice(0, 13);
  let bucket;
  try { bucket = JSON.parse(store.getProperty('feedbackHourly') || 'null'); } catch (_) { bucket = null; }
  if (!bucket || bucket.hour !== hour) bucket = {hour: hour, total: 0, stations: {}};
  const stations = Array.from(new Set(entries.map(function (entry) {
    return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, entry.stationId || 'unspecified', Utilities.Charset.UTF_8).slice(0, 8).map(function (byte) { return ('0' + ((byte + 256) % 256).toString(16)).slice(-2); }).join('');
  })));
  if (!Number.isFinite(bucket.total) || bucket.total >= FEEDBACK_CONFIG.maxRequestsPerHour || stations.some(function (station) { return Number(bucket.stations[station] || 0) >= FEEDBACK_CONFIG.maxRequestsPerStationHour; })) throw new Error('hourly_limit');
  bucket.total++;
  stations.forEach(function (station) { bucket.stations[station] = Number(bucket.stations[station] || 0) + 1; });
  store.setProperties({feedbackHourly: JSON.stringify(bucket)});
}

function feedbackSheet_() {
  const id = PropertiesService.getScriptProperties().getProperty(FEEDBACK_CONFIG.spreadsheetProperty);
  if (!id) throw new Error('unavailable');
  const book = SpreadsheetApp.openById(id);
  let sheet = book.getSheetByName(FEEDBACK_CONFIG.sheetName);
  if (!sheet) sheet = book.insertSheet(FEEDBACK_CONFIG.sheetName);
  if (sheet.getLastRow() === 0) sheet.getRange(1, 1, 1, FEEDBACK_HEADERS.length).setValues([FEEDBACK_HEADERS.slice()]);
  const headers = sheet.getRange(1, 1, 1, FEEDBACK_HEADERS.length).getValues()[0];
  if (headers.some(function (header, index) { return header !== FEEDBACK_HEADERS[index]; })) throw new Error('unavailable');
  return sheet;
}

function feedbackDailyLimit_() {
  const store = PropertiesService.getScriptProperties();
  const today = new Date().toISOString().slice(0, 10);
  const previousDay = store.getProperty('feedbackUtcDay');
  const count = previousDay === today ? Number(store.getProperty('feedbackRequests') || '0') : 0;
  if (!Number.isFinite(count) || count >= FEEDBACK_CONFIG.maxRequestsPerUtcDay) throw new Error('daily_limit');
  store.setProperties({feedbackUtcDay: today, feedbackRequests: String(count + 1)});
}

/** Keep comments literal even when viewed or exported to Excel. */
function feedbackCell_(value) {
  if (typeof value !== 'string') return value;
  return /^[\s]*[=+\-@]/.test(value) || value.charAt(0) === "'" ? "'" + value : value;
}

function feedbackRow_(entry, receivedAt) {
  return [entry.sessionId + ':' + entry.entryId, entry.sessionId, entry.entryId, entry.revision,
    entry.createdAt, entry.updatedAt, receivedAt, entry.language, entry.build, entry.stationId,
    entry.kind, entry.stop, entry.score === null ? '' : entry.score, entry.rating, entry.category,
    entry.worked, entry.fix, entry.phase, entry.sessionEnded, JSON.stringify(entry.scores), feedbackHash_(entry)].map(feedbackCell_);
}

function feedbackHash_(entry) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, JSON.stringify(entry), Utilities.Charset.UTF_8)
    .map(function (byte) { return ('0' + ((byte + 256) % 256).toString(16)).slice(-2); }).join('');
}

function feedbackUpsert_(sheet, entries, receivedAt) {
  const lastRow = sheet.getLastRow();
  if (lastRow > FEEDBACK_CONFIG.maxRows + 1) throw new Error('capacity');
  const saved = Object.create(null);
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 4).getValues().forEach(function (row, index) {
      if (typeof row[0] === 'string' && row[0]) saved[row[0]] = {row: index + 2, revision: Number(row[3])};
    });
  }
  const additions = entries.filter(function (entry) { return !saved[entry.sessionId + ':' + entry.entryId]; }).length;
  if (lastRow - 1 + additions > FEEDBACK_CONFIG.maxRows) throw new Error('capacity');
  const neededRows = lastRow + additions;
  if (sheet.getMaxRows() < neededRows) sheet.insertRowsAfter(sheet.getMaxRows(), neededRows - sheet.getMaxRows());
  let appendAt = lastRow + 1;
  const acknowledged = [];
  const conflicts = [];
  entries.forEach(function (entry) {
    const key = entry.sessionId + ':' + entry.entryId;
    const existing = saved[key];
    if (existing && existing.revision >= entry.revision) {
      const storedHash = sheet.getRange(existing.row, FEEDBACK_HEADERS.length, 1, 1).getValues()[0][0];
      const receipt = {sessionId: entry.sessionId, entryId: entry.entryId, revision: existing.revision};
      if (storedHash === feedbackHash_(entry)) acknowledged.push(receipt);
      else conflicts.push(receipt);
      return;
    }
    const row = existing ? existing.row : appendAt++;
    const range = sheet.getRange(row, 1, 1, FEEDBACK_HEADERS.length);
    range.setNumberFormat('@');
    range.setValues([feedbackRow_(entry, receivedAt)]);
    saved[key] = {row: row, revision: entry.revision};
    acknowledged.push({sessionId: entry.sessionId, entryId: entry.entryId, revision: entry.revision});
  });
  return {acknowledged: acknowledged, conflicts: conflicts};
}
