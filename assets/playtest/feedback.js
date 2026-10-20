/* Anonymous playtest feedback: local drafts and explicit, acknowledged sending. */
(function (host) {
  "use strict";
  var KEY = "pecan-grove-feedback-v1", GAME_KEY = "pecan-grove-journey", CONSENT_KEY = "pecan-grove-consent-v1";
  var ID = /^[A-Za-z0-9_-]{16,80}$/;
  var RATINGS = ["", "unclear", "okay", "good"], CATEGORIES = ["", "clarity", "bug", "voice", "spanish", "art", "other"];
  function uid(crypto) {
    if (crypto && crypto.randomUUID) return crypto.randomUUID();
    if (crypto && crypto.getRandomValues) {
      var a = new Uint8Array(16); crypto.getRandomValues(a);
      return Array.from(a, function (n) { return n.toString(16).padStart(2, "0"); }).join("");
    }
    return "session-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  }
  function clean(s, max) { return typeof s === "string" ? s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").slice(0, max) : ""; }
  function scrubPII(text, language) {
    var removed = language === "es" ? "[quitado]" : "[removed]";
    return clean(text, 1200)
      .replace(/(?:https?:\/\/|www\.)[^\s<>]+/gi, removed)
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, removed)
      .replace(/\b\d{1,6}\s+(?:calle|avenida|carrera|camino|paseo|carretera)\s+(?:[A-Za-zÀ-ÿ.'-]+(?:[ \t]+|$)){1,4}/gi, removed)
      .replace(/\b\d{1,6}\s+(?:[A-Za-zÀ-ÿ.'-]+\s+){0,4}(?:street|st|road|rd|avenue|ave|lane|ln|drive|dr|boulevard|blvd|way|court|ct|calle|avenida|av|carrera|camino|paseo|carretera)\b(?:\s+(?:apt|unit|piso|n[oú]mero)\.?\s*[A-Za-z0-9-]+)?/gi, removed)
      .replace(/\b(?:calle|avenida|carrera|camino|paseo|carretera)\s+(?:[A-Za-zÀ-ÿ.'-]+\s+){0,4}\d{1,6}\b/gi, removed)
      .replace(/(?:\+?\d|\(\d)[\d\s().-]{5,}\d/g, function (value) { return value.replace(/\D/g, "").length >= 7 ? removed : value; })
      .replace(/(^|[^A-Za-z0-9_])@[A-Za-z0-9_.-]{1,50}/g, function (_, prefix) { return prefix + removed; });
  }
  function readConsent(storage, sessionId) {
    try {
      var value = JSON.parse(storage.getItem(CONSENT_KEY) || "null");
      if (value && value.sessionId === sessionId && value.scores === true) return { scores: true, autoScores: value.autoScores === true, at: value.at, build: value.build, sessionId: sessionId };
    } catch (_) { /* A damaged or unavailable preference never grants consent. */ }
    return { scores: false, autoScores: false, at: "", build: "", sessionId: sessionId };
  }
  function validEntry(e) {
    return e && ID.test(e.sessionId) && ID.test(e.entryId) && Number.isInteger(e.revision) && e.revision > 0 &&
      Number.isFinite(Date.parse(e.updatedAt)) && typeof e.build === "string" && e.build.length <= 40 && ["feedback", "progress", "session"].indexOf(e.kind) !== -1 &&
      Number.isInteger(e.stop) && e.stop >= 0 && e.stop <= 15 && ["en", "es"].indexOf(e.language) !== -1 &&
      RATINGS.indexOf(e.rating) !== -1 && CATEGORIES.indexOf(e.category) !== -1 &&
      typeof e.worked === "string" && e.worked.length <= 1200 && typeof e.fix === "string" && e.fix.length <= 1200 && (e.submitted === undefined || typeof e.submitted === "boolean");
  }
  function readState(storage) {
    try {
      var raw = storage.getItem(KEY);
      if (!raw) return { state: null, warning: "" };
      var s = JSON.parse(raw);
      if (!s || s.schemaVersion !== 1 || !ID.test(s.activeSession) || !Array.isArray(s.entries) || !s.entries.every(validEntry)) throw Error("invalid saved feedback");
      s.entries.forEach(function (e) { e.submitted = e.submitted === true; });
      return { state: s, warning: "" };
    } catch (e) { return { state: null, warning: "storage", recovery: typeof raw === "string" ? raw : null }; }
  }
  function mergeEntries(a, b) {
    var map = new Map();
    a.concat(b).forEach(function (e) {
      var key = e.sessionId + ":" + e.entryId, old = map.get(key);
      var newer = !old || e.revision > old.revision || (e.revision === old.revision && (e.updatedAt > old.updatedAt || (e.updatedAt === old.updatedAt && JSON.stringify(payload(e)) > JSON.stringify(payload(old)))));
      var chosen = newer ? e : old;
      var matching = !old || old.revision !== e.revision || JSON.stringify(payload(old)) === JSON.stringify(payload(e));
      chosen = Object.assign({}, chosen, { ackRevision: matching ? Math.max(old && old.ackRevision || 0, e.ackRevision || 0) : (chosen.ackRevision || 0) });
      map.set(key, chosen);
    });
    return Array.from(map.values());
  }
  function createModel(options) {
    var storage = options.storage, now = options.now || function () { return new Date().toISOString(); }, makeId = options.id || function () { return uid(host.crypto); };
    var loaded = readState(storage), state = loaded.state || { schemaVersion: 1, activeSession: makeId(), entries: [] };
    state.stationId = ID.test(state.stationId || "") ? state.stationId : makeId();
    // Old queued drafts have no explicit submission and remain local after migration.
    state.entries.forEach(function (e) { e.submitted = e.submitted === true; });
    var warning = loaded.warning, changedSession = false, fresh = !loaded.state && !loaded.warning, recovery = !!loaded.recovery || !!state.recoveryAvailable, recoveryBlocked = false;
    if (recovery) state.recoveryAvailable = true;
    if (loaded.recovery) {
      try {
        var earlierRecovery = storage.getItem(KEY + "-recovery");
        if (!earlierRecovery) storage.setItem(KEY + "-recovery", loaded.recovery);
        else if (earlierRecovery !== loaded.recovery) storage.setItem(KEY + "-recovery-" + makeId(), loaded.recovery);
      }
      catch (e) { recoveryBlocked = true; }
    }
    function active() { return state.activeSession; }
    function entries(all) { return state.entries.filter(function (e) { return all || e.sessionId === active(); }); }
    function find(kind, stop) { return entries().find(function (e) { return e.kind === kind && e.stop === stop; }); }
    function persist(forceSession) {
      if (recoveryBlocked) { warning = "storage"; return false; }
      var disk = readState(storage);
      if (disk.state) {
        if (disk.state.activeSession !== active() && !forceSession) { changedSession = true; return false; }
        state.entries = mergeEntries(disk.state.entries, state.entries);
      }
      try { storage.setItem(KEY, JSON.stringify(state)); warning = ""; return true; }
      catch (e) { warning = "storage"; return false; }
    }
    function archive() {
      var disk = readState(storage);
      if (recoveryBlocked || !disk.state) { warning = "storage"; return false; }
      state.entries = mergeEntries(disk.state.entries, state.entries);
      if (disk.state.activeSession === active()) return persist();
      changedSession = true;
      try {
        storage.setItem(KEY, JSON.stringify(Object.assign({}, disk.state, { entries: state.entries })));
        warning = ""; return true;
      } catch (e) { warning = "storage"; return false; }
    }
    function upsert(kind, stop, fields, allowArchive) {
      var disk = readState(storage);
      if (disk.state) {
        if (disk.state.activeSession !== active()) { changedSession = true; if (!allowArchive) return null; }
        state.entries = mergeEntries(disk.state.entries, state.entries);
      }
      stop = Math.max(0, Math.min(15, Number(stop) || 0));
      var old = find(kind, stop), stamp = now();
      var e = Object.assign({ sessionId: active(), stationId: state.stationId, entryId: makeId(), revision: 0, createdAt: stamp, updatedAt: stamp,
        language: options.language === "es" ? "es" : "en", build: clean(options.build, 40), kind: kind, stop: stop,
        rating: "", category: "", worked: "", fix: "", score: null, phase: "", ackRevision: 0, submitted: false }, old || {});
      fields = fields || {};
      var next = { language: fields.language === "es" ? "es" : (fields.language === "en" ? "en" : e.language),
        rating: RATINGS.indexOf(fields.rating) !== -1 ? fields.rating : e.rating,
        category: CATEGORIES.indexOf(fields.category) !== -1 ? fields.category : e.category,
        worked: fields.worked === undefined ? e.worked : clean(fields.worked, 1200), fix: fields.fix === undefined ? e.fix : clean(fields.fix, 1200),
        score: fields.score === undefined ? e.score : (Number.isFinite(fields.score) ? Math.round(Math.max(0, Math.min(100, fields.score))) : null),
        phase: fields.phase === undefined ? e.phase : clean(fields.phase, 40), sessionEnded: fields.sessionEnded === undefined ? !!e.sessionEnded : !!fields.sessionEnded };
      if (old && Object.keys(next).every(function (k) { return next[k] === old[k]; })) return old;
      Object.assign(e, next, { revision: e.revision + 1, updatedAt: stamp, submitted: false });
      state.entries = state.entries.filter(function (x) { return x.entryId !== e.entryId || x.sessionId !== e.sessionId; });
      state.entries.push(e); if (changedSession && allowArchive) archive(); else persist(); return e;
    }
    function submit(entryId, includeScores) {
      var current = entries().find(function (e) { return e.entryId === entryId && e.kind === "feedback"; });
      if (current) {
        current = upsert("feedback", current.stop, { worked: scrubPII(current.worked, current.language), fix: scrubPII(current.fix, current.language) });
        if (!current) return false;
      }
      entries().forEach(function (e) {
        if ((current && e.entryId === current.entryId) || e.kind === "session" || (includeScores && e.kind === "progress")) e.submitted = true;
      });
      return persist();
    }
    function submitProgress(stop) {
      var entry = find("progress", stop); if (!entry) return false;
      entry.submitted = true; return persist();
    }
    function withdrawScores() {
      entries().filter(function (e) { return e.kind === "progress" && e.submitted && (e.ackRevision || 0) < e.revision; }).forEach(function (e) { e.submitted = false; e.revision++; e.updatedAt = now(); });
      return persist();
    }
    function acknowledge(list, snapshots) {
      var count = 0;
      (Array.isArray(list) ? list : []).forEach(function (ack) {
        state.entries.forEach(function (e) {
          var matches = !snapshots || snapshots.some(function (s) { return JSON.stringify(s) === JSON.stringify(payload(e)); });
          if (matches && ack && ack.sessionId === e.sessionId && ack.entryId === e.entryId && Number.isInteger(ack.revision) && ack.revision === e.revision) {
            e.ackRevision = Math.max(e.ackRevision || 0, e.revision); count++;
          }
        });
      });
      if (count) persist(); return count;
    }
    function rotate() {
      if (changedSession || warning) return null;
      upsert("session", 0, { sessionEnded: true });
      if (changedSession || warning) return null;
      var previous = state.activeSession;
      state.activeSession = makeId(); changedSession = false;
      if (!persist(true)) { state.activeSession = previous; return null; }
      upsert("session", 0, { phase: "start" }); return active();
    }
    function resolveConflicts(list) {
      var disk = readState(storage);
      if (disk.state) {
        if (disk.state.activeSession !== active()) { changedSession = true; return 0; }
        state.entries = mergeEntries(disk.state.entries, state.entries);
      }
      var count = 0;
      (Array.isArray(list) ? list : []).forEach(function (conflict) {
        state.entries.forEach(function (e) {
          if (conflict && conflict.sessionId === e.sessionId && conflict.entryId === e.entryId && Number.isInteger(conflict.revision) && conflict.revision >= 1 && (e.ackRevision || 0) < e.revision) {
            e.revision = Math.max(e.revision, conflict.revision) + 1; e.updatedAt = now(); count++;
          }
        });
      });
      if (count) persist(); return count;
    }
    return { active: active, entries: entries, find: find, upsert: upsert, persist: persist, archive: archive, acknowledge: acknowledge, rotate: rotate,
      stash: function (kind, stop, fields) { return upsert(kind, stop, fields, true); },
      resolveConflicts: resolveConflicts, submit: submit, submitProgress: submitProgress, withdrawScores: withdrawScores,
      pending: function (all) { return entries(!!all).filter(function (e) { return e.submitted === true && (e.ackRevision || 0) < e.revision; }); },
      warning: function () { return warning; }, changedSession: function () { return changedSession; }, fresh: fresh, recovery: recovery,
      storageFailed: function () { warning = "storage"; } };
  }
  function payload(e) {
    var out = {};
    ["sessionId", "stationId", "entryId", "revision", "createdAt", "updatedAt", "language", "build", "kind", "stop", "rating", "category", "worked", "fix", "score", "phase", "sessionEnded", "submitted"].forEach(function (k) { out[k] = e[k]; });
    return out;
  }
  function endpointAllowed(url) { return /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url || ""); }
  async function sendBatch(model, endpoint, fetcher, signal) {
    if (!endpointAllowed(endpoint)) throw Error("No configured feedback endpoint");
    var batch = [], sent = [], encoder = new TextEncoder();
    model.pending().some(function (e) {
      var item = payload(e), candidate = sent.concat([item]);
      if (candidate.length > 20 || encoder.encode(JSON.stringify({ schemaVersion: 1, entries: candidate })).length > 58000) return true;
      batch.push(e); sent.push(item); return false;
    });
    if (!batch.length) return 0;
    var response = await fetcher(endpoint, { method: "POST", mode: "cors", credentials: "omit", redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=UTF-8" }, body: JSON.stringify({ schemaVersion: 1, entries: sent }), signal: signal });
    if (!response.ok) throw Error("Backup did not accept the request");
    var body = await response.json();
    if (!body || body.ok !== true || body.schemaVersion !== 1 || !Array.isArray(body.acknowledged)) throw Error("Backup confirmation missing");
    var ack = body.acknowledged.filter(function (a) { return sent.some(function (e) { return a && a.sessionId === e.sessionId && a.entryId === e.entryId && a.revision === e.revision; }); });
    var count = model.acknowledge(ack, sent);
    var conflicts = (Array.isArray(body.conflicts) ? body.conflicts : []).filter(function (a) { return sent.some(function (e) { return a && a.sessionId === e.sessionId && a.entryId === e.entryId; }); });
    var revised = model.resolveConflicts(conflicts);
    if (!count && !revised && !ack.length) throw Error("Backup did not confirm these entries");
    return count;
  }
  function xml(s) { return String(s === null || s === undefined ? "" : s).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;"); }
  function zip(files) {
    var encoder = new TextEncoder(), chunks = [], directory = [], offset = 0;
    function bytes(size) { return new Uint8Array(size); }
    function set(arr, position, value, size) { var view = new DataView(arr.buffer); if (size === 2) view.setUint16(position, value, true); else view.setUint32(position, value >>> 0, true); }
    function crc(data) { var c = 0xffffffff; for (var i = 0; i < data.length; i++) { c ^= data[i]; for (var j = 0; j < 8; j++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)); } return (c ^ 0xffffffff) >>> 0; }
    Object.keys(files).forEach(function (name) {
      var n = encoder.encode(name), data = encoder.encode(files[name]), sum = crc(data), h = bytes(30);
      set(h, 0, 0x04034b50); set(h, 4, 20, 2); set(h, 6, 0x0800, 2); set(h, 12, 33, 2); set(h, 14, sum); set(h, 18, data.length); set(h, 22, data.length); set(h, 26, n.length, 2);
      chunks.push(h, n, data);
      var d = bytes(46); set(d, 0, 0x02014b50); set(d, 4, 20, 2); set(d, 6, 20, 2); set(d, 8, 0x0800, 2); set(d, 14, 33, 2); set(d, 16, sum); set(d, 20, data.length); set(d, 24, data.length); set(d, 28, n.length, 2); set(d, 42, offset);
      directory.push(d, n); offset += h.length + n.length + data.length;
    });
    var directorySize = directory.reduce(function (n, a) { return n + a.length; }, 0), end = bytes(22);
    set(end, 0, 0x06054b50); set(end, 8, Object.keys(files).length, 2); set(end, 10, Object.keys(files).length, 2); set(end, 12, directorySize); set(end, 16, offset);
    chunks = chunks.concat(directory, [end]); var total = chunks.reduce(function (n, a) { return n + a.length; }, 0), out = bytes(total), at = 0;
    chunks.forEach(function (a) { out.set(a, at); at += a.length; }); return out;
  }
  function excel(entries) {
    var headers = ["Anonymous session", "Entry ID", "Type", "Stop", "Language", "Build", "Created UTC", "Updated UTC", "Revision", "Rating", "Category", "What worked", "What to improve", "Score", "Phase", "Backup state", "Session ended", "Anonymous station"];
    var rows = [headers].concat(entries.map(function (e) { return [e.sessionId, e.entryId, e.kind, e.stop, e.language, e.build, e.createdAt, e.updatedAt, e.revision, e.rating, e.category, e.worked, e.fix, e.score, e.phase, (e.ackRevision || 0) >= e.revision ? "confirmed" : (e.submitted ? "pending" : "local draft"), e.sessionEnded ? "yes" : "no", e.stationId || ""]; }));
    function column(i) { var s = ""; do { s = String.fromCharCode(65 + i % 26) + s; i = Math.floor(i / 26) - 1; } while (i >= 0); return s; }
    var sheet = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="11" width="22" customWidth="1"/><col min="12" max="13" width="55" customWidth="1"/><col min="14" max="18" width="22" customWidth="1"/></cols><sheetData>' + rows.map(function (row, i) { return '<row r="' + (i + 1) + '">' + row.map(function (v, j) { var ref = column(j) + (i + 1); return typeof v === "number" && Number.isFinite(v) ? '<c r="' + ref + '"><v>' + v + '</v></c>' : '<c r="' + ref + '" t="inlineStr"><is><t xml:space="preserve">' + xml(v) + '</t></is></c>'; }).join("") + '</row>'; }).join("") + '</sheetData><autoFilter ref="A1:R' + rows.length + '"/></worksheet>';
    return zip({
      "[Content_Types].xml": '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
      "_rels/.rels": '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
      "xl/workbook.xml": '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Playtest feedback" sheetId="1" r:id="rId1"/></sheets></workbook>',
      "xl/_rels/workbook.xml.rels": '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
      "xl/worksheets/sheet1.xml": sheet
    });
  }
  var WORDS = {};
  if (typeof module !== "undefined" && module.exports && typeof require === "function") {
    WORDS.en = require("./locales/feedback-en.json");
    WORDS.es = require("./locales/feedback-es.json");
  }
  function mount(document, window) {
    var root = document.getElementById("pt-feedback"); if (!root) return null;
    var documentLanguage = document.documentElement && document.documentElement.lang;
    var lang = (documentLanguage || root.dataset.lang) === "es" ? "es" : "en", W = WORDS[lang], endpoint = root.dataset.endpoint || "";
    var storage; try { storage = window.localStorage; } catch (e) { storage = { getItem: function () { throw e; }, setItem: function () { throw e; } }; }
    var model = createModel({ storage: storage, language: lang, build: root.dataset.build || "", id: function () { return uid(window.crypto); } });
    var game = document.getElementById("community-builders");
    if (game) {
      game.setAttribute("data-feedback-session", model.active());
      if (model.fresh) {
        try { var legacy = storage.getItem(GAME_KEY), scopedKey = GAME_KEY + ":" + model.active(); if (legacy && !storage.getItem(scopedKey)) storage.setItem(scopedKey, legacy); }
        catch (e) { model.storageFailed(); }
      }
    }
    function el(id) { return document.getElementById("pt-feedback-" + id); }
    var form = el("form"), stop = el("stop"), rating = el("rating"), category = el("category"), worked = el("worked"), fix = el("fix"), status = el("status"), list = el("entries"), context = el("context"), player = el("player");
    if (!form || !stop || !rating || !category || !worked || !fix || !status || !list) return null;
    form.setAttribute("data-pg-native", "");
    var contextStop = 0, saveTimer = null, syncTimer = null, inflight = false, retry = false, attempts = 0, recentScore = null, staleArchived = false, sessionReloading = false, pageOpen = true, holdTimer = null, previewEntry = null, controller = null;
    var consent = readConsent(storage, model.active());
    if (!consent.scores) model.withdrawScores();
    function consentCopy() { return Object.assign({}, consent); }
    function updateConsentControls() {
      if (!document.querySelectorAll) return;
      Array.from(document.querySelectorAll("[data-pg-consent]")).forEach(function (input) {
        var key = input.getAttribute("data-pg-consent"); input.checked = consent[key] === true;
        if (key === "autoScores") input.disabled = !consent.scores;
      });
    }
    function setConsent(value) {
      var next = { scores: value && value.scores === true, autoScores: value && value.scores === true && value.autoScores === true, at: new Date().toISOString(), build: root.dataset.build || "", sessionId: model.active() };
      try { storage.setItem(CONSENT_KEY, JSON.stringify(next)); consent = next; }
      catch (_) { model.storageFailed(); setStatus(); return false; }
      if (!consent.scores) model.withdrawScores();
      updateConsentControls();
      if (window.CustomEvent && document.dispatchEvent) document.dispatchEvent(new window.CustomEvent("pt:consent-change", { detail: Object.assign({ source: "feedback" }, consentCopy()) }));
      return true;
    }
    document.addEventListener("change", function (event) {
      var input = event.target, key = input && input.getAttribute && input.getAttribute("data-pg-consent");
      if (key === "scores" || key === "autoScores") { var next = consentCopy(); next[key] = input.checked; setConsent(next); }
    });
    document.addEventListener("pt:consent-change", function (event) { var detail = event.detail || {}; if (detail.source !== "feedback") setConsent(detail); else updateConsentControls(); });
    var newDialog = document.getElementById("pt-new-player-dialog"), newTitle = document.getElementById("pt-new-player-title"), newMessage = document.getElementById("pt-new-player-message"), newCancel = document.getElementById("pt-new-player-cancel"), newConfirm = document.getElementById("pt-new-player-confirm"), newOpener = null, newVoiceSuspended = false;
    var useNewDialog = !!(newDialog && typeof newDialog.showModal === "function" && newTitle && newMessage && newCancel && newConfirm);
    function label(n) { return n ? W.stop + " " + n : W.general; }
    function setStatus() {
      if (model.changedSession()) {
        closeNewPlayerDialog();
        if (!staleArchived) {
          var fields = { rating: rating.value, category: category.value, worked: worked.value, fix: fix.value, language: lang };
          if (model.find("feedback", contextStop) || fields.rating || fields.category || fields.worked.trim() || fields.fix.trim()) model.stash("feedback", contextStop, fields);
          staleArchived = model.archive();
        }
        if (!staleArchived || model.warning()) { status.textContent = W.storage; return; }
        status.textContent = W.changed;
        if (!sessionReloading) { sessionReloading = true; window.location.reload(); }
        return;
      }
      if (model.warning()) { status.textContent = W.storage; if (useNewDialog && newDialog.open) newMessage.textContent = W.storage; return; }
      var pending = model.pending().length > 0, acknowledged = model.entries().some(function (e) { return e.submitted && (e.ackRevision || 0) >= e.revision; });
      status.textContent = (model.recovery ? W.recovery : "") + (!endpointAllowed(endpoint) ? W.local : (pending ? (retry ? (attempts < 3 ? W.retrying : W.failed) : W.queued) : (acknowledged ? W.synced : W.draftSaved)));
    }
    function render() {
      if (player) player.textContent = W.player + " " + model.active().slice(-6).toUpperCase();
      if (context) context.textContent = label(contextStop);
      while (list.firstChild) list.removeChild(list.firstChild);
      var comments = model.entries().filter(function (e) { return e.kind === "feedback"; }).sort(function (a, b) { return b.updatedAt.localeCompare(a.updatedAt); });
      if (!comments.length) { var empty = document.createElement("li"); empty.textContent = W.empty; empty.className = "pt-feedback__empty"; list.appendChild(empty); }
      comments.forEach(function (e) {
        var item = document.createElement("li"), title = document.createElement("strong"), text = document.createElement("p"), state = document.createElement("span");
        item.className = "pt-feedback__entry"; title.textContent = label(e.stop) + (e.rating ? " · " + W[e.rating] : "");
        text.textContent = [e.worked, e.fix].filter(Boolean).join(" / ") || W.noText;
        state.className = "pt-feedback__entry-state"; state.textContent = e.submitted ? ((e.ackRevision || 0) >= e.revision ? W.backed : W.pending) : W.draft;
        item.appendChild(title); item.appendChild(text); item.appendChild(state); list.appendChild(item);
      });
      setStatus();
    }
    function loadContext(n) {
      invalidatePreview();
      contextStop = n; stop.value = String(n); var e = model.find("feedback", n);
      rating.value = e ? e.rating : ""; category.value = e ? e.category : ""; worked.value = e ? e.worked : ""; fix.value = e ? e.fix : "";
      render();
    }
    function scheduleSync(delay) {
      if (!pageOpen || !model.pending().length || !endpointAllowed(endpoint) || attempts >= 3) return;
      window.clearTimeout(syncTimer); syncTimer = window.setTimeout(sync, delay);
    }
    function flush() {
      window.clearTimeout(saveTimer); saveTimer = null;
      var fields = { rating: rating.value, category: category.value, worked: worked.value, fix: fix.value, language: lang };
      if (model.find("feedback", contextStop) || fields.rating || fields.category || fields.worked.trim() || fields.fix.trim()) model.upsert("feedback", contextStop, fields);
      else model.persist();
      render();
    }
    async function sync() {
      if (!pageOpen || inflight || attempts >= 3 || !model.pending().length || !endpointAllowed(endpoint)) return;
      inflight = true; attempts++; controller = window.AbortController ? new window.AbortController() : null;
      var timeout = window.setTimeout(function () { if (controller) controller.abort(); }, 15000);
      try { await sendBatch(model, endpoint, window.fetch.bind(window), controller && controller.signal); retry = model.pending().length > 0; }
      catch (_) { retry = true; }
      finally {
        window.clearTimeout(timeout); inflight = false; controller = null; render();
        // Maximum three total requests per explicit Send, including the first request.
        if (pageOpen && retry && model.pending().length && attempts < 3) scheduleSync(attempts === 1 ? 5000 : 30000);
        settleSendLock();
      }
    }
    function make(tag, id, text) { var node = document.createElement(tag); node.id = "pt-feedback-" + id; if (text) node.textContent = text; return node; }
    var saveDraft = el("save-draft");
    if (!saveDraft) { saveDraft = make("button", "save-draft", W.save); saveDraft.type = "button"; form.appendChild(saveDraft); }
    var preview = el("preview"), previewText, send, edit, holdStatus;
    if (!preview) {
      preview = make("section", "preview"); preview.className = "pt-feedback__preview"; preview.hidden = true; preview.setAttribute("aria-label", W.preview);
      var previewHeading = make("h3", "preview-heading", W.preview), previewHint = make("p", "preview-hint", W.removed);
      previewText = make("p", "preview-text"); previewText.className = "pt-feedback__preview-text";
      send = make("button", "send", W.hold); send.type = "button"; send.setAttribute("aria-describedby", "pt-feedback-hold-status");
      edit = make("button", "edit", W.edit); edit.type = "button";
      holdStatus = make("p", "hold-status", W.holdCancel); holdStatus.setAttribute("role", "status"); holdStatus.setAttribute("aria-live", "polite");
      [previewHeading, previewHint, previewText, send, edit, holdStatus].forEach(function (node) { preview.appendChild(node); }); form.appendChild(preview);
    } else { previewText = el("preview-text"); send = el("send"); edit = el("edit"); holdStatus = el("hold-status"); }
    var submit = el("submit"); if (submit) submit.textContent = W.send;
    var thanks = el("thanks"), sending = false, editedWhileSending = false;
    if (!thanks) {
      thanks = make("p", "thanks", W.thanks);
      thanks.className = "pt-feedback__thanks";
      thanks.setAttribute("role", "status");
      thanks.setAttribute("aria-live", "polite");
      thanks.tabIndex = -1;
      thanks.hidden = true;
      form.appendChild(thanks);
    }
    function setSendLocked(locked) {
      [submit, send].forEach(function (btn) {
        if (!btn) return;
        btn.disabled = !!locked;
        btn.setAttribute("aria-disabled", locked ? "true" : "false");
      });
    }
    function showThanks(on) {
      if (!thanks) return;
      thanks.textContent = W.thanks;
      thanks.hidden = !on;
    }
    function releaseSendLock() {
      if (sending) { editedWhileSending = true; return; }
      editedWhileSending = false;
      showThanks(false);
      setSendLocked(false);
    }
    function settleSendLock() {
      if (!sending || inflight) return;
      var pending = model.pending().length > 0;
      if (pending && retry && attempts < 3 && endpointAllowed(endpoint)) return;
      sending = false;
      // A failed cloud send can be tried again. Editing the note also clears the lock.
      // A confirmed send, or a note saved where sending is not connected, keeps the thanks line.
      if (editedWhileSending || (pending && endpointAllowed(endpoint))) {
        showThanks(false);
        setSendLocked(false);
        editedWhileSending = false;
      }
    }
    function translateForm() {
      function text(node, value) { if (node) node.textContent = value; }
      function query(selector) { return root.querySelector ? root.querySelector(selector) : null; }
      // Labels contain the existing controls. Replace only their text node.
      function prefix(node, value) {
        if (!node) return;
        var first = Array.from(node.childNodes || []).find(function (child) { return child.nodeType === 3; });
        if (first) first.textContent = value + " ";
      }
      function options(select, labels) {
        Array.from(select.options || []).forEach(function (option) { if (Object.prototype.hasOwnProperty.call(labels, option.value)) option.textContent = labels[option.value]; });
      }
      text(el("h"), W.title); text(query("h2 + p"), W.introduction);
      prefix(player && player.parentNode, W.anonymous); prefix(context && context.parentNode, W.activity);
      text(el("privacy"), endpointAllowed(endpoint) ? W.privacyCloud : W.privacyLocal);
      [["stop", "forStop"], ["rating", "ratingLabel"], ["category", "categoryLabel"], ["worked", "workedLabel"], ["fix", "fixLabel"]].forEach(function (pair) { prefix(query('label[for="pt-feedback-' + pair[0] + '"]'), W[pair[1]]); });
      var stopLabels = { 0: W.generalOption }; for (var n = 1; n <= 15; n++) stopLabels[n] = W.stop + " " + n;
      options(stop, stopLabels); options(rating, { "": W.choose, unclear: W.unclearOption, okay: W.okayOption, good: W.goodOption });
      options(category, { "": W.choose, clarity: W.clarityOption, bug: W.bugOption, voice: W.voiceOption, spanish: W.spanishOption, art: W.artOption, other: W.otherOption });
      text(el("hint"), W.hint); text(el("shared"), W.shared); text(el("download"), W.downloadLabel); text(el("new-player"), W.newPlayer);
      text(query(".pt-feedback__saved > summary"), W.savedNotes); text(query(".pt-feedback-more > summary"), W.more);
      var build = query("p > code"); prefix(build && build.parentNode, W.buildLabel);
      text(submit, W.send); text(saveDraft, W.save); text(el("preview-heading"), W.preview); text(el("preview-hint"), W.removed);
      text(thanks, W.thanks);
      if (preview) preview.setAttribute("aria-label", W.preview);
      text(send, W.hold); text(edit, W.edit); text(holdStatus, W.holdCancel);
      if (useNewDialog) { text(newTitle, W.newTitle); text(newCancel, W.newCancel); text(newConfirm, W.newConfirmLabel); text(newMessage, W.newConfirm); }
      root.dataset.lang = lang; root.setAttribute("lang", lang);
    }
    function cancelHold() { window.clearTimeout(holdTimer); holdTimer = null; if (holdStatus) holdStatus.textContent = W.holdCancel; }
    function invalidatePreview() { cancelHold(); previewEntry = null; if (preview) preview.hidden = true; }
    function showPreview() {
      flush(); if (model.warning() || model.changedSession()) return;
      if (!endpointAllowed(endpoint)) { status.textContent = W.unavailable; return; }
      var entry = model.find("feedback", contextStop);
      if (!entry) entry = model.upsert("feedback", contextStop, { language: lang });
      previewEntry = { entryId: entry.entryId, revision: entry.revision, stop: contextStop, worked: scrubPII(entry.worked, lang), fix: scrubPII(entry.fix, lang) };
      previewText.textContent = W.worked + ":\n" + previewEntry.worked + "\n\n" + W.fix + ":\n" + previewEntry.fix;
      preview.hidden = false; holdStatus.textContent = W.holdCancel; send.focus();
    }
    function finishHold() {
      holdTimer = null;
      if (sending) return;
      var entry = previewEntry && model.find("feedback", previewEntry.stop);
      if (!entry || entry.entryId !== previewEntry.entryId || entry.revision !== previewEntry.revision || contextStop !== previewEntry.stop) { invalidatePreview(); return; }
      model.upsert("feedback", contextStop, { worked: previewEntry.worked, fix: previewEntry.fix });
      worked.value = previewEntry.worked; fix.value = previewEntry.fix;
      if (!model.submit(entry.entryId, consent.scores)) { setStatus(); return; }
      preview.hidden = true; previewEntry = null; attempts = 0; retry = false; window.clearTimeout(syncTimer);
      sending = true; editedWhileSending = false; setSendLocked(true); showThanks(true); render();
      if (thanks) thanks.focus();
      Promise.resolve(sync()).then(settleSendLock);
    }
    function beginHold(event) {
      if (sending || (send && send.disabled) || !previewEntry || holdTimer !== null || (event && event.button !== undefined && event.button !== 0) || (event && (event.repeat || event.isPrimary === false))) return;
      if (event && event.preventDefault) event.preventDefault();
      holdStatus.textContent = W.holdProgress; holdTimer = window.setTimeout(finishHold, 2000);
    }
    if (send) {
      send.addEventListener("pointerdown", beginHold);
      ["pointerup", "pointercancel", "pointerleave", "blur"].forEach(function (name) { send.addEventListener(name, cancelHold); });
      send.addEventListener("keydown", function (event) { if (event.key === " " || event.key === "Enter") { event.preventDefault(); beginHold(event); } });
      send.addEventListener("keyup", function (event) { if (event.key === " " || event.key === "Enter") { event.preventDefault(); cancelHold(); } });
      send.addEventListener("click", function (event) { event.preventDefault(); });
    }
    if (edit) edit.addEventListener("click", function () { invalidatePreview(); worked.focus(); });
    saveDraft.addEventListener("click", function () { invalidatePreview(); flush(); });
    form.addEventListener("submit", function (event) { event.preventDefault(); if (sending || (submit && submit.disabled)) return; showPreview(); });
    document.addEventListener("pt:feedback-flush", flush);
    document.addEventListener("pg:language-change", function (event) {
      var next = event.detail && event.detail.language;
      if ((next !== "en" && next !== "es") || next === lang) return;
      var wasPreviewing = preview && !preview.hidden;
      flush(); cancelHold(); lang = next; W = WORDS[lang]; translateForm(); render();
      // A language change cannot finish an old hold; review the newly translated preview.
      if (wasPreviewing) showPreview();
    });
    [rating, category, worked, fix].forEach(function (input) { input.addEventListener("input", function () { invalidatePreview(); releaseSendLock(); window.clearTimeout(saveTimer); saveTimer = window.setTimeout(flush, 350); }); input.addEventListener("change", function () { invalidatePreview(); releaseSendLock(); flush(); }); });
    stop.addEventListener("change", function () { var n = Math.max(0, Math.min(15, Number(stop.value) || 0)); flush(); loadContext(n); });
    document.addEventListener("cb:screen", function (event) {
      var d = event.detail || {}, n = Math.max(0, Math.min(15, Number(d.stopN) || 0));
      if (n !== contextStop) { flush(); loadContext(n); recentScore = null; }
      if (consent.scores && d.phase === "result" && Number.isFinite(d.score)) {
        var marker = n + ":" + d.score;
        if (recentScore !== marker) { model.upsert("progress", n, { score: d.score, phase: "result", language: lang }); recentScore = marker; render(); if (consent.autoScores) { model.submitProgress(n); attempts = 0; retry = false; sync(); } }
      }
    });
    function suspendNewPlayerVoice(suspended) {
      if (newVoiceSuspended === suspended) return;
      newVoiceSuspended = suspended;
      var keepPaused = suspended || (game && game.getAttribute("data-playtest-paused") === "true") || (document.querySelector && document.querySelector("#pt-review-dialog[open]:not(.is-floating)"));
      if (window.CommunityBuilders && typeof window.CommunityBuilders.suspendVoice === "function") window.CommunityBuilders.suspendVoice(!!keepPaused);
    }
    function restoreNewPlayerFocus() {
      var opener = newOpener; newOpener = null;
      if (opener && typeof opener.focus === "function" && opener.isConnected !== false) opener.focus();
    }
    function closeNewPlayerDialog() {
      if (!useNewDialog || !newDialog.open) return;
      newDialog.close(); suspendNewPlayerVoice(false); restoreNewPlayerFocus();
    }
    function confirmNewPlayer() {
      flush();
      if (model.warning() || model.changedSession()) return;
      if (!model.rotate()) { setStatus(); return; }
      closeNewPlayerDialog();
      window.clearTimeout(syncTimer); cancelHold();
      try { storage.setItem(CONSENT_KEY, JSON.stringify({ scores: false, autoScores: false, at: new Date().toISOString(), build: root.dataset.build || "", sessionId: model.active() })); } catch (_) { model.storageFailed(); }
      window.location.reload();
    }
    function newPlayer(event) {
      flush();
      if (model.warning() || model.changedSession()) return;
      if (!useNewDialog) { if (window.confirm(W.newConfirm)) confirmNewPlayer(); return; }
      if (newDialog.open) return;
      newOpener = event && event.currentTarget || document.activeElement;
      newMessage.textContent = W.newConfirm;
      newDialog.showModal(); suspendNewPlayerVoice(true); newCancel.focus();
    }
    if (useNewDialog) {
      newCancel.addEventListener("click", closeNewPlayerDialog);
      newConfirm.addEventListener("click", confirmNewPlayer);
      newDialog.addEventListener("cancel", function (event) { event.preventDefault(); closeNewPlayerDialog(); });
      newDialog.addEventListener("close", function () { if (!newDialog.open) { suspendNewPlayerVoice(false); restoreNewPlayerFocus(); } });
    }
    [el("new-player"), el("new-player-top")].forEach(function (button) { if (button) button.addEventListener("click", newPlayer); });
    el("download").addEventListener("click", function () {
      flush();
      try {
        var blob = new window.Blob([excel(model.entries())], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        var url = window.URL.createObjectURL(blob), a = document.createElement("a"); a.href = url; a.download = "pecan-grove-feedback-" + model.active().slice(-6) + ".xlsx";
        document.body.appendChild(a); a.click(); a.remove(); window.setTimeout(function () { window.URL.revokeObjectURL(url); }, 30000); status.textContent = W.download;
      } catch (e) { status.textContent = W.downloadError; }
    });
    window.addEventListener("pagehide", function () { flush(); pageOpen = false; cancelHold(); window.clearTimeout(syncTimer); if (controller) controller.abort(); });
    document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") { flush(); cancelHold(); } });
    window.addEventListener("blur", cancelHold);
    document.addEventListener("keydown", function (event) { if (event.key === "Escape") cancelHold(); }, true);
    window.addEventListener("storage", function (event) {
      if (event.key === KEY) { model.persist(); render(); }
      if (event.key === CONSENT_KEY) { consent = readConsent(storage, model.active()); if (!consent.scores) model.withdrawScores(); updateConsentControls(); }
    });
    model.upsert("session", 0, { phase: "start", language: lang });
    var initial = game && Number(game.dataset.currentStop);
    translateForm(); loadContext(Number.isInteger(initial) && initial >= 0 && initial <= 15 ? initial : 0); updateConsentControls();
    var runtime = { model: model, flush: flush, sync: sync, getConsent: consentCopy, setConsent: setConsent, showPreview: showPreview };
    window.PecanGroveFeedback = Object.assign({}, api, runtime);
    return runtime;
  }
  function scopeSession(document, window) {
    var game = document.getElementById("community-builders");
    if (!game || game.getAttribute("data-feedback-session")) return;
    var storage;
    try { storage = window.localStorage; } catch (e) { return; }
    var lang = document.documentElement && document.documentElement.lang;
    var model = createModel({ storage: storage, language: lang === "es" ? "es" : "en", id: function () { return uid(window.crypto); } });
    if (!model.persist()) return;
    game.setAttribute("data-feedback-session", model.active());
    if (model.fresh) {
      try {
        var legacy = storage.getItem(GAME_KEY), scopedKey = GAME_KEY + ":" + model.active();
        if (legacy && !storage.getItem(scopedKey)) storage.setItem(scopedKey, legacy);
      } catch (e) { model.storageFailed(); }
    }
  }
  var api = { KEY: KEY, GAME_KEY: GAME_KEY, CONSENT_KEY: CONSENT_KEY, scrubPII: scrubPII, readConsent: readConsent, WORDS: WORDS, createModel: createModel, mergeEntries: mergeEntries, sendBatch: sendBatch, endpointAllowed: endpointAllowed, excel: excel, mount: mount, scopeSession: scopeSession };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  host.PecanGroveFeedback = api;
  if (host.document && host.document.getElementById && host.document.getElementById("community-builders")) {
    try { scopeSession(host.document, host); } catch (e) { /* The form mount still scopes the session if storage is busy. */ }
  }
  if (host.document && host.document.getElementById("pt-feedback")) {
    // First-party static locales load before the singleton feedback form is mounted.
    api.ready = Promise.all(["en", "es"].map(function (language) {
      var path = "assets/playtest/locales/feedback-" + language + ".json";
      var mapped = host.PG_ASSET_MAP && host.PG_ASSET_MAP[path];
      return host.fetch(new URL(mapped || path, host.document.baseURI)).then(function (response) {
        if (!response.ok) throw Error("Feedback locale unavailable");
        return response.json();
      }).then(function (messages) { WORDS[language] = messages; });
    })).then(function () {
      var runtime = mount(host.document, host);
      host.document.dispatchEvent(new host.CustomEvent("pg:feedback-ready"));
      return runtime;
    }).catch(function () {
      var root = host.document.getElementById("pt-feedback");
      if (root) root.dataset.feedbackUnavailable = "true";
      host.document.dispatchEvent(new host.CustomEvent("pg:feedback-unavailable"));
      return null;
    });
  }
})(typeof window !== "undefined" ? window : globalThis);
