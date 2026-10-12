/* Anonymous playtest feedback: local drafts, acknowledged cloud queue, real Excel export. */
(function (host) {
  "use strict";
  var KEY = "pecan-grove-feedback-v1", GAME_KEY = "pecan-grove-journey";
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
  function validEntry(e) {
    return e && ID.test(e.sessionId) && ID.test(e.entryId) && Number.isInteger(e.revision) && e.revision > 0 &&
      Number.isFinite(Date.parse(e.updatedAt)) && typeof e.build === "string" && e.build.length <= 40 && ["feedback", "progress", "session"].indexOf(e.kind) !== -1 &&
      Number.isInteger(e.stop) && e.stop >= 0 && e.stop <= 15 && ["en", "es"].indexOf(e.language) !== -1 &&
      RATINGS.indexOf(e.rating) !== -1 && CATEGORIES.indexOf(e.category) !== -1 &&
      typeof e.worked === "string" && e.worked.length <= 1200 && typeof e.fix === "string" && e.fix.length <= 1200;
  }
  function readState(storage) {
    try {
      var raw = storage.getItem(KEY);
      if (!raw) return { state: null, warning: "" };
      var s = JSON.parse(raw);
      if (!s || s.schemaVersion !== 1 || !ID.test(s.activeSession) || !Array.isArray(s.entries) || !s.entries.every(validEntry)) throw Error("invalid saved feedback");
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
        rating: "", category: "", worked: "", fix: "", score: null, phase: "", ackRevision: 0 }, old || {});
      fields = fields || {};
      var next = { language: fields.language === "es" ? "es" : (fields.language === "en" ? "en" : e.language),
        rating: RATINGS.indexOf(fields.rating) !== -1 ? fields.rating : e.rating,
        category: CATEGORIES.indexOf(fields.category) !== -1 ? fields.category : e.category,
        worked: fields.worked === undefined ? e.worked : clean(fields.worked, 1200), fix: fields.fix === undefined ? e.fix : clean(fields.fix, 1200),
        score: fields.score === undefined ? e.score : (Number.isFinite(fields.score) ? Math.round(Math.max(0, Math.min(100, fields.score))) : null),
        phase: fields.phase === undefined ? e.phase : clean(fields.phase, 40), sessionEnded: fields.sessionEnded === undefined ? !!e.sessionEnded : !!fields.sessionEnded };
      if (old && Object.keys(next).every(function (k) { return next[k] === old[k]; })) return old;
      Object.assign(e, next, { revision: e.revision + 1, updatedAt: stamp });
      state.entries = state.entries.filter(function (x) { return x.entryId !== e.entryId || x.sessionId !== e.sessionId; });
      state.entries.push(e); if (changedSession && allowArchive) archive(); else persist(); return e;
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
      resolveConflicts: resolveConflicts,
      pending: function () { return state.entries.filter(function (e) { return (e.ackRevision || 0) < e.revision; }); },
      warning: function () { return warning; }, changedSession: function () { return changedSession; }, fresh: fresh, recovery: recovery,
      storageFailed: function () { warning = "storage"; } };
  }
  function payload(e) {
    var out = {};
    ["sessionId", "stationId", "entryId", "revision", "createdAt", "updatedAt", "language", "build", "kind", "stop", "rating", "category", "worked", "fix", "score", "phase", "sessionEnded"].forEach(function (k) { out[k] = e[k]; });
    return out;
  }
  function endpointAllowed(url) { return /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url || ""); }
  async function sendBatch(model, endpoint, fetcher, signal) {
    if (!endpointAllowed(endpoint)) throw Error("No configured backup endpoint");
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
    var rows = [headers].concat(entries.map(function (e) { return [e.sessionId, e.entryId, e.kind, e.stop, e.language, e.build, e.createdAt, e.updatedAt, e.revision, e.rating, e.category, e.worked, e.fix, e.score, e.phase, (e.ackRevision || 0) >= e.revision ? "confirmed" : "pending", e.sessionEnded ? "yes" : "no", e.stationId || ""]; }));
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
  var WORDS = {
    en: { player: "Player", general: "Whole game", stop: "Stop", local: "Saved on this device. Shared backup is not connected yet.", queued: "Saved on this device. Waiting to back up automatically…", synced: "Saved on this device and confirmed in the shared backup.", failed: "Saved on this device. Shared backup is unavailable; retrying automatically.", storage: "This browser cannot save feedback reliably. Keep this page open and download Excel before leaving. A new player cannot start until saving works.", recovery: "Some earlier feedback could not be reopened. The original is kept for your instructor to recover. ", changed: "A new player started in another tab. Reloading to keep players separate.", empty: "Your comments will appear here as you play.", draft: "Draft", backed: "Backed up", pending: "Waiting for backup", newConfirm: "Start a new anonymous player? This starts fresh game progress for the next person. Your feedback stays queued for backup, but the next player will not see it.", download: "Excel downloaded for this player.", downloadError: "Excel could not be downloaded. Keep this page open and try again.", noText: "Rating/category recorded", good: "Clear", okay: "Okay", unclear: "Confusing" },
    es: { player: "Jugador", general: "Todo el juego", stop: "Parada", local: "Guardado en este dispositivo. La copia compartida aún no está conectada.", queued: "Guardado en este dispositivo. Esperando la copia automática…", synced: "Guardado en este dispositivo y confirmado en la copia compartida.", failed: "Guardado en este dispositivo. La copia compartida no está disponible; se reintentará automáticamente.", storage: "Este navegador no puede guardar comentarios de forma fiable. Mantén esta página abierta y descarga Excel antes de salir. No puede empezar otro jugador hasta que funcione el guardado.", recovery: "No se pudieron abrir algunos comentarios anteriores. El original se conserva para que tu instructor lo recupere. ", changed: "Otro jugador empezó en otra pestaña. Se recargará para mantener las sesiones separadas.", empty: "Tus comentarios aparecerán aquí mientras juegas.", draft: "Borrador", backed: "Con copia", pending: "Esperando copia", newConfirm: "¿Empezar con un nuevo jugador anónimo? El siguiente jugador comenzará con un progreso nuevo. Tus comentarios seguirán en la cola de copia, pero el siguiente jugador no los verá.", download: "Excel descargado para este jugador.", downloadError: "No se pudo descargar Excel. Mantén esta página abierta e inténtalo de nuevo.", noText: "Valoración/categoría registrada", good: "Claro", okay: "Bien", unclear: "Confuso" }
  };
  function mount(document, window) {
    var root = document.getElementById("pt-feedback"); if (!root) return null;
    var lang = root.dataset.lang === "es" ? "es" : "en", W = WORDS[lang], endpoint = root.dataset.endpoint || "";
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
    var contextStop = 0, saveTimer = null, syncTimer = null, inflight = false, retry = false, recentScore = null, staleArchived = false, sessionReloading = false;
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
      var pending = model.pending().some(function (e) { return e.sessionId === model.active(); });
      status.textContent = (model.recovery ? W.recovery : "") + (!endpointAllowed(endpoint) ? W.local : (pending ? (retry ? W.failed : W.queued) : W.synced));
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
        state.className = "pt-feedback__entry-state"; state.textContent = endpointAllowed(endpoint) ? ((e.ackRevision || 0) >= e.revision ? W.backed : W.pending) : W.draft;
        item.appendChild(title); item.appendChild(text); item.appendChild(state); list.appendChild(item);
      });
      setStatus();
    }
    function loadContext(n) {
      contextStop = n; stop.value = String(n); var e = model.find("feedback", n);
      rating.value = e ? e.rating : ""; category.value = e ? e.category : ""; worked.value = e ? e.worked : ""; fix.value = e ? e.fix : "";
      render();
    }
    function scheduleSync(delay) {
      if (!endpointAllowed(endpoint)) return;
      window.clearTimeout(syncTimer); syncTimer = window.setTimeout(sync, delay === undefined ? 1500 : delay);
    }
    function flush() {
      window.clearTimeout(saveTimer); saveTimer = null;
      var fields = { rating: rating.value, category: category.value, worked: worked.value, fix: fix.value, language: lang };
      if (model.find("feedback", contextStop) || fields.rating || fields.category || fields.worked.trim() || fields.fix.trim()) model.upsert("feedback", contextStop, fields);
      else model.persist();
      render(); scheduleSync();
    }
    async function sync() {
      if (inflight || !model.pending().length || !endpointAllowed(endpoint)) return;
      inflight = true; var controller = window.AbortController ? new window.AbortController() : null;
      var timeout = window.setTimeout(function () { if (controller) controller.abort(); }, 15000);
      try { await sendBatch(model, endpoint, window.fetch.bind(window), controller && controller.signal); retry = false; }
      catch (e) { retry = true; }
      finally { window.clearTimeout(timeout); inflight = false; render(); if (model.pending().length) scheduleSync(retry ? 60000 : 300); }
    }
    form.addEventListener("submit", function (e) { e.preventDefault(); flush(); scheduleSync(0); });
    document.addEventListener("pt:feedback-flush", flush);
    [rating, category, worked, fix].forEach(function (input) { input.addEventListener("input", function () { window.clearTimeout(saveTimer); saveTimer = window.setTimeout(flush, 350); }); input.addEventListener("change", flush); });
    stop.addEventListener("change", function () { var n = Math.max(0, Math.min(15, Number(stop.value) || 0)); flush(); loadContext(n); });
    document.addEventListener("cb:screen", function (event) {
      var d = event.detail || {}, n = Math.max(0, Math.min(15, Number(d.stopN) || 0));
      if (n !== contextStop) { flush(); loadContext(n); recentScore = null; }
      if (d.phase === "result" && Number.isFinite(d.score)) {
        var marker = n + ":" + d.score;
        if (recentScore !== marker) { model.upsert("progress", n, { score: d.score, phase: "result", language: lang }); recentScore = marker; render(); scheduleSync(); }
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
      scheduleSync(0); window.location.reload();
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
      newTitle.textContent = lang === "es" ? "¿Listo para otro jugador?" : "Ready for another player?";
      newCancel.textContent = lang === "es" ? "Seguir jugando" : "Keep playing";
      newConfirm.textContent = lang === "es" ? "Empezar con otro jugador" : "Start new player";
      newMessage.textContent = W.newConfirm;
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
    window.addEventListener("online", function () { scheduleSync(0); });
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") flush(); else scheduleSync(0); });
    window.addEventListener("storage", function (e) { if (e.key === KEY) { model.persist(); render(); scheduleSync(0); } });
    model.upsert("session", 0, { phase: "start", language: lang });
    var initial = game && Number(game.dataset.currentStop);
    loadContext(Number.isInteger(initial) && initial >= 0 && initial <= 15 ? initial : 0); scheduleSync(0);
    return { model: model, flush: flush, sync: sync };
  }
  var api = { KEY: KEY, GAME_KEY: GAME_KEY, createModel: createModel, mergeEntries: mergeEntries, sendBatch: sendBatch, endpointAllowed: endpointAllowed, excel: excel, mount: mount };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (host.document) mount(host.document, host);
})(typeof window !== "undefined" ? window : globalThis);
