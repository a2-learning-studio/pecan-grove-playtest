/* Anonymous playtest feedback: local drafts and explicit, acknowledged sending. */
(function (host) {
  "use strict";
  var KEY = "pecan-grove-feedback-v1", GAME_KEY = "pecan-grove-journey", CONSENT_KEY = "pecan-grove-consent-v1", ERASE_FLAG = "pecan-grove-erase";
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
  // Children's details beyond contact patterns. Each rule needs a clear cue ("my name is", "years old", "Elementary",
  // a full date or a birthday), so ordinary sentences and the game's own characters stay intact.
  var LETTERS = "A-Za-zÀ-ÖØ-öø-ÿ", WORD = "[" + LETTERS + "][" + LETTERS + "'’-]*", CAP = "[A-ZÀ-ÖØ-Þ][" + LETTERS + ".'’-]*";
  var MONTHS = "jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?";
  var MESES = "enero|febrero|marzo|abril|mayo|junio|julio|agosto|sep?tiembre|octubre|noviembre|diciembre";
  var AGES = "\\d{1,2}|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen";
  var EDADES = "\\d{1,2}|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|diecis[eé]is|diecisiete|dieciocho";
  var KIN = "friend|teacher|brother|sister|mom|mum|dad|mother|father|cousin|grandma|grandpa|grandmother|grandfather";
  var PARIENTES = "amig[oa]|maestr[oa]|profe(?:sor|sora)?|herman[oa]|mam[aá]|pap[aá]|prim[oa]|abuel[oa]|t[ií][oa]";
  var NAME_STOP = /^(?:a|an|the|and|or|but|so|not|no|very|really|too|kind|sort|like|i|im|i'm|i’m|me|my|you|it|is|was|from|in|at|on|to|of|for|with|also|y|o|pero|que|muy|un|una|el|la|los|las|lo|de|del|en|con|por|para|al|mi|tu|su|es|era|yo|se|también|mr|mrs|ms|mx|miss|dr|coach|sr|sra|srta|prof|profe|maestro|maestra)$/i;
  var NAME_LINK = /^(?:de|del|la|las|los|y|van|von|da|di|le)$/i, UPPER = /^[A-ZÀ-ÖØ-Þ]/;
  var DATE = "(?:(?:" + MONTHS + ")\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?(?:,?\\s+\\d{4})?\\b|\\d{1,2}(?:st|nd|rd|th)?\\s+(?:of\\s+)?(?:" + MONTHS + ")\\b\\.?(?:,?\\s+\\d{4})?|(?:el\\s+)?\\d{1,2}\\s+de\\s+(?:" + MESES + ")(?:\\s+del?\\s+\\d{4})?\\b|\\d{1,2}[\\/.-]\\d{1,2}(?:[\\/.-]\\d{2,4})?\\b|\\d{4}\\b|(?:" + MONTHS + "|" + MESES + ")\\b)";
  var CHILD_RULES = [
    // Full dates with a year: 3/14/2015, March 14, 2015, 14 de marzo de 2015.
    [/\b\d{1,2}[/.-]\d{1,2}[/.-](?:\d{4}|\d{2})\b/g],
    [new RegExp("\\b(?:" + MONTHS + ")\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?,?\\s+\\d{4}\\b|\\b\\d{1,2}(?:st|nd|rd|th)?\\s+(?:of\\s+)?(?:" + MONTHS + ")\\.?,?\\s+\\d{4}\\b|\\b\\d{1,2}\\s+de\\s+(?:" + MESES + ")\\s+del?\\s+\\d{4}\\b", "gi")],
    // A birthday or birth date after its cue, even without a year.
    [new RegExp("(\\b(?:born|birthday|b-?day|date of birth|dob|nac[ií]|cumpleaños|fecha de nacimiento)(?:\\s+(?:is|es|on|in|el|en)){0,2}\\s*:?\\s*)" + DATE, "gi"), 1],
    // Ages: "I am 9", "I'm nine years old", "9-year-old", "age 9", "tengo 9 años", "9 años de edad".
    [new RegExp("(\\b(?:i am|i'm|i’m|im|i turned|i just turned)\\s+)(?:" + AGES + ")(?:\\s*(?:years?|yrs?)(?:\\s*old)?)?(?=\\s*(?:and\\b|but\\b|[,.!?;:)]|$))", "gim"), 1],
    [new RegExp("\\b(?:" + AGES + ")(?:\\s+|-)(?:years?|yrs?)(?:\\s+|-)old\\b|\\b\\d{1,2}\\s*y\\/o\\b", "gi")],
    [/(\b(?:age|aged|edad)\s*:?\s*)\d{1,2}\b/gi, 1],
    [new RegExp("(\\b(?:ya\\s+)?(?:tengo|cumpl[ií])\\s+)(?:" + EDADES + ")\\s+años(?:\\s+de\\s+edad)?", "gi"), 1],
    [new RegExp("\\b(?:" + EDADES + ")\\s+años\\s+de\\s+edad", "gi")],
    // Schools with a name: "Pecan Elementary", "Oak Middle School", "Escuela Primaria Benito Juárez".
    [new RegExp("\\b(?!(?:The|A|An|My|Our|This|That|Your|Their|His|Her|In|At|High|Middle|Elementary|Junior|School|Academy)\\s)(?:" + CAP + "\\s+){1,3}(?:(?:Elementary|Middle|High|Intermediate|Primary|Junior High|Charter|Magnet|Montessori)\\s+School|Elementary|Academy|School)\\b", "g")],
    [new RegExp("\\b(?:[Ee]scuela|[Cc]olegio|[Ii]nstituto|[Ll]iceo|[Aa]cademia|[Pp]rimaria|[Ss]ecundaria)(?:\\s+(?:[Pp]rimaria|[Ss]ecundaria|[Pp][uú]blica|[Pp]rivada|[Tt][eé]cnica|[Nn][uú]mero|[Nn]o\\.?|de|del|la|el)){0,3}\\s+(?:" + CAP + "|\\d{1,4})(?:\\s+(?:(?:de|del|de la|la|los|las|y)\\s+)?" + CAP + "){0,3}", "g")]
  ];
  // A name after a clear cue. The first word may be lower case; later words must be capitalized.
  var NAME_CUE = new RegExp("(\\b(?:(?:my name(?:'s|’s|\\s+is)|my names is|i am called|i'm called|i’m called|im called|they call me|my (?:best )?(?:" + KIN + ")(?:(?:'s|’s) name is|\\s+is (?:named|called))|me llamo|mi nombre es|me dicen|me llaman|mi (?:mejor )?(?:" + PARIENTES + ") se llama|el nombre de mi (?:mejor )?(?:" + PARIENTES + ") es)\\s+|(?:my |first |last |full |mi )?(?:name|nombre)\\s*:\\s*)(?:(?:mr|mrs|ms|miss|dr|coach|sr|sra|srta|profe|maestr[oa])\\.?\\s+)?)(" + WORD + "(?:\\s+" + WORD + "){0,3})", "gi");
  function scrubNames(text, removed) {
    return text.replace(NAME_CUE, function (match, cue, words) {
      var parts = words.split(/(\s+)/), tokens = parts.filter(function (_, i) { return i % 2 === 0; }), count = 1;
      if (NAME_STOP.test(tokens[0])) return match;
      while (count < tokens.length) {
        var link = count;
        while (link < tokens.length && NAME_LINK.test(tokens[link])) link++;
        if (link > count && link < tokens.length && UPPER.test(tokens[link])) { count = link + 1; continue; }
        if (!UPPER.test(tokens[count]) || NAME_STOP.test(tokens[count])) break;
        count++;
      }
      return cue + removed + parts.slice(count * 2 - 1).join("");
    });
  }
  function scrubPII(text, language) {
    var removed = language === "es" ? "[quitado]" : "[removed]";
    var scrubbed = clean(text, 1200)
      .replace(/(?:https?:\/\/|www\.)[^\s<>]+/gi, removed)
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, removed)
      .replace(/\b\d{1,6}\s+(?:calle|avenida|carrera|camino|paseo|carretera)\s+(?:[A-Za-zÀ-ÿ.'-]+(?:[ \t]+|$)){1,4}/gi, removed)
      .replace(/\b\d{1,6}\s+(?:[A-Za-zÀ-ÿ.'-]+\s+){0,4}(?:street|st|road|rd|avenue|ave|lane|ln|drive|dr|boulevard|blvd|way|court|ct|calle|avenida|av|carrera|camino|paseo|carretera)\b(?:\s+(?:apt|unit|piso|n[oú]mero)\.?\s*[A-Za-z0-9-]+)?/gi, removed)
      .replace(/\b(?:calle|avenida|carrera|camino|paseo|carretera)\s+(?:[A-Za-zÀ-ÿ.'-]+\s+){0,4}\d{1,6}\b/gi, removed)
      .replace(/(?:\+?\d|\(\d)[\d\s().-]{5,}\d/g, function (value) { return value.replace(/\D/g, "").length >= 7 ? removed : value; })
      .replace(/(^|[^A-Za-z0-9_])@[A-Za-z0-9_.-]{1,50}/g, function (_, prefix) { return prefix + removed; });
    CHILD_RULES.forEach(function (rule) {
      scrubbed = scrubbed.replace(rule[0], function (match, cue) { return (rule[1] ? cue : "") + removed; });
    });
    return scrubNames(scrubbed, removed);
  }
  // Words the scrubber leaves but a grown-up should still check. The game's own titled characters are not flagged.
  var CAST = /^(?:ana|patel|lee|johnson)$/i;
  var TITLED = /\b(?:[Mm]rs?|[Mm][sx]|Miss|[Dd]r|Coach|[Ss]ra?|[Ss]rta|[Pp]rofe?|[Mm]aestr[oa]|[Ss]eñor(?:a|ita)?|[Dd]oña|Don)\.?\s+([A-Za-zÀ-ÖØ-öø-ÿ'’-]+)/g;
  var CHECK_WORDS = /\b(?:school|teacher|birthday|born|years old|my name|name is|live on|live at|escuela|colegio|maestr[oa]|profe(?:sor|sora)?|cumpleaños|nac[ií]|me llamo|mi nombre|vivo en)(?![A-Za-zÀ-ÖØ-öø-ÿ])/gi;
  function privacyFlags(text) {
    var found = [];
    function add(value) { value = value.replace(/\s+/g, " ").trim(); if (value && found.every(function (f) { return f.toLowerCase() !== value.toLowerCase(); })) found.push(value); }
    String(text || "").replace(TITLED, function (match, name) { name = name.replace(/['’]s$/i, ""); if (!CAST.test(name) && !NAME_STOP.test(name)) add(match); return match; });
    String(text || "").replace(CHECK_WORDS, function (match, offset, all) {
      // A cue whose detail was already removed, or a word inside a flagged name, adds nothing to check.
      var removedNext = /^\s*(?:is|es|:)?\s*\[(?:removed|quitado)\]/i.test(all.slice(offset + match.length));
      if (!removedNext && found.every(function (f) { return f.toLowerCase().indexOf(match.toLowerCase()) === -1; })) add(match);
      return match;
    });
    return found.slice(0, 8);
  }
  function hasContent(e) { return !!(e && (e.rating || e.category || (e.worked || "").trim() || (e.fix || "").trim())); }
  function received(e) { return !!(e && e.submitted && (e.ackRevision || 0) >= e.revision); }
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
      if (!s || s.schemaVersion !== 1 || !ID.test(s.activeSession) || !Array.isArray(s.entries)) throw Error("invalid saved feedback");
      // One unrecognised entry must not start a new player and hide the game: keep the player and
      // the valid entries, and return the original text so it is kept as a recovery copy.
      var valid = s.entries.filter(validEntry);
      valid.forEach(function (e) { e.submitted = e.submitted === true; });
      var damaged = valid.length !== s.entries.length; s.entries = valid;
      return { state: s, warning: "", recovery: damaged ? raw : null };
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
    function keepRecovery(raw) {
      try {
        var earlierRecovery = storage.getItem(KEY + "-recovery");
        if (!earlierRecovery) storage.setItem(KEY + "-recovery", raw);
        else if (earlierRecovery !== raw) storage.setItem(KEY + "-recovery-" + makeId(), raw);
        return true;
      }
      catch (e) { recoveryBlocked = true; return false; }
    }
    if (loaded.recovery) keepRecovery(loaded.recovery);
    function active() { return state.activeSession; }
    function entries(all) { return state.entries.filter(function (e) { return all || e.sessionId === active(); }); }
    function find(kind, stop) { return entries().find(function (e) { return e.kind === kind && e.stop === stop; }); }
    function persist(forceSession) {
      if (recoveryBlocked) { warning = "storage"; return false; }
      var disk = readState(storage);
      if (disk.state) {
        if (disk.state.activeSession !== active() && !forceSession) { changedSession = true; return false; }
        // Entries this version cannot read (written by another tab) are copied aside before saving over them.
        if (disk.recovery && !keepRecovery(disk.recovery)) { warning = "storage"; return false; }
        state.entries = mergeEntries(disk.state.entries, state.entries);
      }
      try { storage.setItem(KEY, JSON.stringify(state)); warning = ""; return true; }
      catch (e) { warning = "storage"; return false; }
    }
    function archive() {
      var disk = readState(storage);
      if (recoveryBlocked || !disk.state || (disk.recovery && !keepRecovery(disk.recovery))) { warning = "storage"; return false; }
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
    function withdrawScores(later) {
      var withdrawn = entries().filter(function (e) { return e.kind === "progress" && e.submitted && (e.ackRevision || 0) < e.revision; });
      withdrawn.forEach(function (e) { e.submitted = false; e.revision++; e.updatedAt = now(); });
      // From a storage event the next save stores this, so the event itself never writes.
      return later || !withdrawn.length ? true : persist();
    }
    function refresh() {
      // Read another tab's change without writing. A write here could put back the old player
      // while another tab is starting a new one.
      var disk = readState(storage);
      if (!disk.state) return false;
      if (disk.state.activeSession !== active()) { changedSession = true; return false; }
      state.entries = mergeEntries(disk.state.entries, state.entries);
      return true;
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
      // The next player also gets a new random device code, so no field links two children on one computer.
      var previous = state.activeSession, station = state.stationId;
      state.activeSession = makeId(); state.stationId = makeId(); state.previousSession = { id: previous, at: now() }; changedSession = false;
      if (!persist(true)) { state.activeSession = previous; state.stationId = station; delete state.previousSession; return null; }
      upsert("session", 0, { phase: "start" }); return active();
    }
    function previousPlayer() {
      var p = state.previousSession;
      return p && ID.test(p.id || "") && p.id !== active() && Number.isFinite(Date.parse(p.at)) ? { id: p.id, at: p.at } : null;
    }
    function forgetPrevious() {
      if (!state.previousSession) return true;
      delete state.previousSession; return persist();
    }
    function switchBack() {
      var p = previousPlayer(); if (!p || changedSession || warning) return null;
      var disk = readState(storage);
      if (disk.state && disk.state.activeSession !== active()) { changedSession = true; return null; }
      var current = active(), station = state.stationId, earlier = state.entries.find(function (e) { return e.sessionId === p.id && ID.test(e.stationId || ""); });
      state.activeSession = p.id; state.stationId = earlier ? earlier.stationId : station; delete state.previousSession;
      if (!persist(true)) { state.activeSession = current; state.stationId = station; state.previousSession = p; return null; }
      upsert("session", 0, { sessionEnded: false }); return active();
    }
    function unsubmit(target) {
      var e = state.entries.find(function (x) { return x.sessionId === target.sessionId && x.entryId === target.entryId; });
      if (!e || !e.submitted) return false;
      // A new local revision, so merging with the saved copy cannot restore the submission.
      e.submitted = false; e.revision++; e.updatedAt = now(); return persist();
    }
    function submitAll(includeScores) {
      // A grown-up reviewed every listed note at once. Scrub each one as the single-note preview does.
      var disk = readState(storage);
      if (disk.state) {
        if (disk.state.activeSession !== active()) { changedSession = true; return 0; }
        state.entries = mergeEntries(disk.state.entries, state.entries);
      }
      var stamp = now(), sessions = new Set(), count = 0;
      state.entries.forEach(function (e) {
        if (e.kind !== "feedback" || !hasContent(e) || received(e)) return;
        var worked = scrubPII(e.worked, e.language), fix = scrubPII(e.fix, e.language);
        if (worked !== e.worked || fix !== e.fix) { e.worked = worked; e.fix = fix; e.revision++; e.updatedAt = stamp; }
        e.submitted = true; sessions.add(e.sessionId); count++;
      });
      state.entries.forEach(function (e) {
        // Earlier players' scores stay local: their score-sharing choice ended with their session.
        if ((e.kind === "session" && sessions.has(e.sessionId)) || (includeScores && e.kind === "progress" && e.sessionId === active())) { if (!received(e)) e.submitted = true; }
      });
      return persist() ? count : 0;
    }
    function players() {
      var map = new Map();
      state.entries.forEach(function (e) {
        var p = map.get(e.sessionId) || { sessionId: e.sessionId, updatedAt: "", notes: [] };
        if (e.updatedAt > p.updatedAt) p.updatedAt = e.updatedAt;
        if (e.kind === "feedback" && hasContent(e)) p.notes.push(e);
        map.set(e.sessionId, p);
      });
      return Array.from(map.values()).filter(function (p) { return p.notes.length || p.sessionId === active(); })
        .sort(function (a, b) { return (b.sessionId === active()) - (a.sessionId === active()) || b.updatedAt.localeCompare(a.updatedAt); });
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
    return { active: active, entries: entries, find: find, upsert: upsert, persist: persist, refresh: refresh, archive: archive, acknowledge: acknowledge, rotate: rotate,
      stash: function (kind, stop, fields) { return upsert(kind, stop, fields, true); },
      previousPlayer: previousPlayer, forgetPrevious: forgetPrevious, switchBack: switchBack, unsubmit: unsubmit, submitAll: submitAll, players: players,
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
  async function sendBatch(model, endpoint, fetcher, signal, all) {
    if (!endpointAllowed(endpoint)) throw Error("No configured feedback endpoint");
    var batch = [], sent = [], encoder = new TextEncoder(), station = null;
    // Another page on this shared origin could queue raw text. Only text that already passed the preview scrub
    // may leave; anything else goes back to being a local draft for a grown-up to review.
    model.pending(all).forEach(function (e) {
      if (e.kind === "feedback" && (scrubPII(e.worked, e.language) !== e.worked || scrubPII(e.fix, e.language) !== e.fix)) model.unsubmit(e);
    });
    model.pending(all).some(function (e) {
      // The collector accepts one device code per request.
      if (station === null) station = e.stationId || "";
      if ((e.stationId || "") !== station) return false;
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
    var contextStop = 0, saved = { rating: "", category: "", worked: "", fix: "" }, saveTimer = null, syncTimer = null, inflight = false, retry = false, attempts = 0, recentScore = null, staleArchived = false, sessionReloading = false, pageOpen = true, previewEntry = null, controller = null;
    // Set once this page hands the device to the next player or erases it; later flushes must not write old text.
    var leaving = false, sentEntry = null;
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
      if (key !== "scores" && key !== "autoScores") return;
      var next = consentCopy(); next[key] = input.checked;
      // Turning sharing on is a grown-up choice: it waits for a confirmation. Turning it off never does.
      if ((next.scores && !consent.scores) || (next.autoScores && !consent.autoScores)) { updateConsentControls(); askConsent(next, input, key); }
      else setConsent(next);
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
      // After a reload nothing retries by itself, so an unconfirmed note says so instead of "waiting".
      var others = endpointAllowed(endpoint) && model.pending(true).some(function (e) { return e.sessionId !== model.active(); });
      status.textContent = (model.recovery ? W.recovery : "") + (!endpointAllowed(endpoint) ? W.local : (pending ? (retry ? (attempts < 3 ? W.retrying : W.failed) : (inflight || sending ? W.queued : W.unsent)) : (acknowledged ? W.synced : W.draftSaved))) + (others ? " " + W.othersWaiting : "");
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
      saved = formValues(); render();
    }
    function formValues() { return { rating: rating.value, category: category.value, worked: worked.value, fix: fix.value }; }
    function syncForm() {
      // Show another tab's newer note, except in a field this tab is still editing.
      var e = model.find("feedback", contextStop), changed = false;
      [["rating", rating], ["category", category], ["worked", worked], ["fix", fix]].forEach(function (pair) {
        var value = e ? e[pair[0]] : "";
        if (pair[1].value === saved[pair[0]] && value !== saved[pair[0]]) { pair[1].value = value; saved[pair[0]] = value; changed = true; }
      });
      if (changed) invalidatePreview();
    }
    function scheduleSync(delay) {
      if (!pageOpen || !model.pending().length || !endpointAllowed(endpoint) || attempts >= 3) return;
      window.clearTimeout(syncTimer); syncTimer = window.setTimeout(sync, delay);
    }
    function flush() {
      window.clearTimeout(saveTimer); saveTimer = null;
      if (leaving) return;
      // Save only the fields edited in this tab, so closing an older tab cannot put back older text.
      var values = formValues(), fields = { language: lang };
      Object.keys(values).forEach(function (k) { if (values[k] !== saved[k]) fields[k] = values[k]; });
      if (model.find("feedback", contextStop) || fields.rating || fields.category || (fields.worked || "").trim() || (fields.fix || "").trim()) model.upsert("feedback", contextStop, fields);
      else model.persist();
      saved = values; render();
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
    var preview = el("preview"), previewHeading, previewText, previewFlags, checkBox, send, edit, checkStatus;
    if (!preview) {
      preview = make("section", "preview"); preview.className = "pt-feedback__preview"; preview.hidden = true; preview.setAttribute("aria-label", W.preview);
      previewHeading = make("h3", "preview-heading", W.preview); previewHeading.tabIndex = -1;
      var previewHint = make("p", "preview-hint", W.removed);
      previewText = make("p", "preview-text"); previewText.className = "pt-feedback__preview-text";
      previewFlags = make("p", "preview-flags"); previewFlags.className = "pt-feedback__flags"; previewFlags.hidden = true;
      // A single, untimed grown-up check sits right above Send, so every input method can send (WCAG 2.1.1).
      var check = make("label", "check"); check.className = "pt-feedback__check";
      checkBox = make("input", "confirm"); checkBox.type = "checkbox";
      check.appendChild(checkBox); check.appendChild(make("span", "check-text", W.check));
      send = make("button", "send", W.sendNow); send.type = "button"; send.setAttribute("aria-describedby", "pt-feedback-check-status");
      edit = make("button", "edit", W.edit); edit.type = "button";
      checkStatus = make("p", "check-status", W.checkStatus); checkStatus.setAttribute("role", "status"); checkStatus.setAttribute("aria-live", "polite");
      [previewHeading, previewHint, previewText, previewFlags, check, send, edit, checkStatus].forEach(function (node) { preview.appendChild(node); }); form.appendChild(preview);
    } else { previewHeading = el("preview-heading"); previewText = el("preview-text"); previewFlags = el("preview-flags"); checkBox = el("confirm"); send = el("send"); edit = el("edit"); checkStatus = el("check-status"); }
    var submit = el("submit"); if (submit) submit.textContent = W.send;
    var thanks = el("thanks"), sending = false, editedWhileSending = false, resultKey = "";
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
    // One line reports the explicit send: "Sending" first, thanks only after the matching acknowledgement.
    function showResult(key) {
      resultKey = key || "";
      if (!thanks) return;
      thanks.textContent = resultKey ? W[resultKey] : "";
      thanks.hidden = !resultKey;
    }
    function releaseSendLock() {
      if (sending) { editedWhileSending = true; return; }
      editedWhileSending = false;
      showResult("");
      setSendLocked(false);
    }
    function settleSendLock() {
      if (!sending || inflight) return;
      var pending = model.pending().length > 0;
      if (pending && retry && attempts < 3 && endpointAllowed(endpoint)) return;
      sending = false;
      var sent = sentEntry && model.entries().find(function (e) { return e.sessionId === sentEntry.sessionId && e.entryId === sentEntry.entryId; });
      // Editing the note during the send clears the line. A confirmed note keeps its thanks and stays locked until edited.
      if (editedWhileSending) { showResult(""); setSendLocked(false); editedWhileSending = false; return; }
      if (received(sent)) showResult("thanks");
      else { showResult("notSent"); setSendLocked(false); }
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
      text(el("hint"), W.hint); text(el("shared"), W.shared); text(el("download"), W.downloadLabel); text(el("new-player"), W.newPlayer); text(el("device"), W.deviceOpen);
      text(query(".pt-feedback__saved > summary"), W.savedNotes); text(query(".pt-feedback-more > summary"), W.more);
      var build = query("p > code"); prefix(build && build.parentNode, W.buildLabel);
      text(submit, W.send); text(saveDraft, W.save); text(el("preview-heading"), W.preview); text(el("preview-hint"), W.removed);
      showResult(resultKey);
      if (preview) preview.setAttribute("aria-label", W.preview);
      text(send, W.sendNow); text(edit, W.edit); text(checkStatus, W.checkStatus); text(el("check-text"), W.check);
      if (useNewDialog) { text(newTitle, W.newTitle); text(newCancel, W.newCancel); text(newConfirm, W.newConfirmLabel); text(newMessage, W.newConfirm); }
      root.dataset.lang = lang; root.setAttribute("lang", lang);
    }
    function invalidatePreview() {
      previewEntry = null; if (preview) preview.hidden = true;
      if (checkBox) checkBox.checked = false;
      if (checkStatus) checkStatus.textContent = W.checkStatus;
    }
    function showPreview() {
      flush(); if (model.warning() || model.changedSession()) return;
      if (!endpointAllowed(endpoint)) { status.textContent = W.unavailable; return; }
      // A blank note has nothing to review or send.
      if (!rating.value && !category.value && !worked.value.trim() && !fix.value.trim()) { invalidatePreview(); status.textContent = W.blank; worked.focus(); return; }
      var entry = model.find("feedback", contextStop);
      if (!entry) entry = model.upsert("feedback", contextStop, { language: lang });
      previewEntry = { entryId: entry.entryId, revision: entry.revision, stop: contextStop, worked: scrubPII(entry.worked, lang), fix: scrubPII(entry.fix, lang) };
      previewText.textContent = W.worked + ":\n" + previewEntry.worked + "\n\n" + W.fix + ":\n" + previewEntry.fix;
      var flags = privacyFlags(previewEntry.worked + "\n" + previewEntry.fix);
      if (previewFlags) { previewFlags.textContent = flags.length ? W.flagged.replace("{words}", flags.join(", ")) : ""; previewFlags.hidden = !flags.length; }
      checkBox.checked = false; checkStatus.textContent = W.checkStatus; preview.hidden = false;
      // Start at the heading so a phone keeps the "remove any names" prompt in view.
      if (typeof preview.scrollIntoView === "function") preview.scrollIntoView({ block: "start" });
      if (previewHeading) previewHeading.focus({ preventScroll: true });
    }
    function finishSend() {
      if (sending || (send && send.disabled)) return;
      if (!previewEntry) return;
      if (!checkBox.checked) { checkStatus.textContent = W.checkFirst; checkBox.focus(); return; }
      var entry = model.find("feedback", previewEntry.stop);
      if (!entry || entry.entryId !== previewEntry.entryId || entry.revision !== previewEntry.revision || contextStop !== previewEntry.stop) { invalidatePreview(); return; }
      model.upsert("feedback", contextStop, { worked: previewEntry.worked, fix: previewEntry.fix });
      worked.value = previewEntry.worked; fix.value = previewEntry.fix;
      if (!model.submit(entry.entryId, consent.scores)) { setStatus(); return; }
      sentEntry = { sessionId: entry.sessionId, entryId: entry.entryId };
      invalidatePreview(); attempts = 0; retry = false; window.clearTimeout(syncTimer);
      sending = true; editedWhileSending = false; setSendLocked(true); showResult("sending");
      var running = sync(); render();
      if (thanks) thanks.focus();
      Promise.resolve(running).then(settleSendLock);
    }
    if (send) send.addEventListener("click", finishSend);
    if (checkBox) {
      checkBox.addEventListener("change", function () { checkStatus.textContent = W.checkStatus; });
      // Enter on a checkbox would submit the form and rebuild the preview.
      checkBox.addEventListener("keydown", function (event) { if (event.key === "Enter") event.preventDefault(); });
    }
    if (edit) edit.addEventListener("click", function () { invalidatePreview(); worked.focus(); });
    saveDraft.addEventListener("click", function () { invalidatePreview(); flush(); });
    form.addEventListener("submit", function (event) { event.preventDefault(); if (sending || (submit && submit.disabled)) return; showPreview(); });
    document.addEventListener("pt:feedback-flush", flush);
    document.addEventListener("pg:language-change", function (event) {
      var next = event.detail && event.detail.language;
      if ((next !== "en" && next !== "es") || next === lang) return;
      var wasPreviewing = preview && !preview.hidden;
      flush(); lang = next; W = WORDS[lang]; translateForm(); render();
      if (playerReady) { playerReady.textContent = W.playerReady; playerBack.textContent = W.switchBack; }
      if (deviceDialog && deviceDialog.open) renderDevice();
      // A language change clears the grown-up check; review the newly translated preview.
      if (wasPreviewing) showPreview();
    });
    [rating, category, worked, fix].forEach(function (input) { input.addEventListener("input", function () { invalidatePreview(); releaseSendLock(); forgetUndo(); window.clearTimeout(saveTimer); saveTimer = window.setTimeout(flush, 350); }); input.addEventListener("change", function () { invalidatePreview(); releaseSendLock(); flush(); }); });
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
    function clearForm() { [rating, category, worked, fix].forEach(function (input) { input.value = ""; }); invalidatePreview(); }
    function resetConsentFor(session) {
      try { storage.setItem(CONSENT_KEY, JSON.stringify({ scores: false, autoScores: false, at: new Date().toISOString(), build: root.dataset.build || "", sessionId: session })); } catch (_) { model.storageFailed(); }
    }
    function confirmNewPlayer() {
      flush();
      if (model.warning() || model.changedSession()) return;
      if (!model.rotate()) { setStatus(); return; }
      // The note is already saved for the player who just left. Clear the form and stop saving, so the
      // reload's page-hide save cannot copy it into the next player's session.
      leaving = true; clearForm();
      closeNewPlayerDialog();
      window.clearTimeout(syncTimer);
      resetConsentFor(model.active());
      window.location.reload();
    }
    function unsentNotes() {
      return endpointAllowed(endpoint) ? model.entries().filter(function (e) { return e.kind === "feedback" && hasContent(e) && !received(e); }).length : 0;
    }
    function newPlayer(event) {
      flush();
      if (model.warning() || model.changedSession()) return;
      var unsent = unsentNotes(), message = W.newConfirm + (unsent ? " " + W.newUnsent.replace("{count}", unsent) : "");
      if (!useNewDialog) { if (window.confirm(message)) confirmNewPlayer(); return; }
      if (newDialog.open) return;
      newOpener = event && event.currentTarget || document.activeElement;
      newMessage.textContent = message;
      newDialog.showModal(); suspendNewPlayerVoice(true); newCancel.focus();
    }
    if (useNewDialog) {
      newCancel.addEventListener("click", closeNewPlayerDialog);
      newConfirm.addEventListener("click", confirmNewPlayer);
      newDialog.addEventListener("cancel", function (event) { event.preventDefault(); closeNewPlayerDialog(); });
      newDialog.addEventListener("close", function () { if (!newDialog.open) { suspendNewPlayerVoice(false); restoreNewPlayerFocus(); } });
    }
    [el("new-player"), el("new-player-top")].forEach(function (button) { if (button) button.addEventListener("click", newPlayer); });
    // Right after Next player, a grown-up can undo a mistaken switch until the new player starts or types.
    var undoHost = el("new-player-top"), playerReady = null, playerBack = null, previous = model.previousPlayer();
    if (previous && undoHost && undoHost.parentNode && Date.now() - Date.parse(previous.at) < 600000 && model.entries().every(function (e) { return e.kind === "session"; })) {
      playerReady = document.createElement("p"); playerReady.id = "pt-player-ready"; playerReady.className = "pt-privacy"; playerReady.setAttribute("role", "status"); playerReady.textContent = W.playerReady;
      playerBack = document.createElement("button"); playerBack.id = "pt-player-back"; playerBack.type = "button"; playerBack.className = "pt-btn pt-btn--secondary"; playerBack.textContent = W.switchBack;
      // Below the For grown-ups buttons, outside their row.
      var spot = undoHost.parentNode.parentNode || undoHost.parentNode, backRow = document.createElement("div"); backRow.className = "pt-actions";
      backRow.appendChild(playerBack); spot.appendChild(playerReady); spot.appendChild(backRow);
      playerBack.addEventListener("click", function () {
        flush();
        if (model.warning() || model.changedSession() || !model.switchBack()) { setStatus(); return; }
        leaving = true; clearForm(); resetConsentFor(model.active());
        window.location.reload();
      });
      var startButton = document.getElementById("pt-start");
      if (startButton) startButton.addEventListener("click", forgetUndo);
    } else if (previous) model.forgetPrevious();
    function forgetUndo() {
      if (!playerReady) return;
      model.forgetPrevious(); playerReady.remove(); playerBack.parentNode.remove(); playerReady = playerBack = null;
    }
    function saveExcel(list, name, target, done) {
      try {
        var blob = new window.Blob([excel(list)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        var url = window.URL.createObjectURL(blob), a = document.createElement("a"); a.href = url; a.download = name;
        document.body.appendChild(a); a.click(); a.remove(); window.setTimeout(function () { window.URL.revokeObjectURL(url); }, 30000); target.textContent = done;
      } catch (e) { target.textContent = W.downloadError; }
    }
    el("download").addEventListener("click", function () {
      flush(); saveExcel(model.entries(), "pecan-grove-feedback-" + model.active().slice(-6) + ".xlsx", status, W.download);
    });
    function node(tag, className, text, id) { var n = document.createElement(tag); if (className) n.className = className; if (text) n.textContent = text; if (id) n.id = id; return n; }
    function action(text, className, id, run) { var b = node("button", className, text, id); b.type = "button"; b.addEventListener("click", run); return b; }
    function focusId(id) { var n = document.getElementById(id); if (n && typeof n.focus === "function") n.focus(); }
    function dialogHost() { return document.getElementById("pt-stage") || document.body; }
    // Grown-up confirmation before any score leaves the device.
    var consentDialog = null, consentNext = null, consentOpener = null;
    function askConsent(next, opener, key) {
      var message = key === "autoScores" ? W.consentAutoAsk : W.consentScoresAsk;
      if (!consentDialog) {
        consentDialog = node("dialog", "pt-player-dialog", "", "pt-consent-dialog"); consentDialog.setAttribute("aria-labelledby", "pt-consent-title"); consentDialog.setAttribute("aria-describedby", "pt-consent-message");
        consentDialog.addEventListener("cancel", function (event) { event.preventDefault(); closeConsent(false); });
        dialogHost().appendChild(consentDialog);
      }
      if (typeof consentDialog.showModal !== "function") { if (window.confirm(message)) setConsent(next); return; }
      if (consentDialog.open) return;
      consentNext = next; consentOpener = opener;
      while (consentDialog.firstChild) consentDialog.removeChild(consentDialog.firstChild);
      var actions = node("div", "pt-actions"), keep = action(W.consentNo, "pt-btn", "pt-consent-cancel", function () { closeConsent(false); });
      actions.appendChild(keep); actions.appendChild(action(W.consentYes, "pt-btn pt-btn--secondary", "pt-consent-confirm", function () { closeConsent(true); }));
      [node("h2", "", W.consentTitle, "pt-consent-title"), node("p", "", message, "pt-consent-message"), actions].forEach(function (n) { consentDialog.appendChild(n); });
      consentDialog.showModal(); keep.focus();
    }
    function closeConsent(allow) {
      var next = consentNext, opener = consentOpener; consentNext = consentOpener = null;
      if (consentDialog && consentDialog.open) consentDialog.close();
      if (allow && next) setConsent(next); else updateConsentControls();
      if (opener && typeof opener.focus === "function" && opener.isConnected !== false) opener.focus();
    }
    // For grown-ups: the privacy notice and every player's notes on this shared device.
    var deviceDialog = null, deviceOpener = null, deviceShown = false, eraseAsked = false;
    function waitingNotes() { return model.players().reduce(function (n, p) { return n + p.notes.filter(function (e) { return !received(e); }).length; }, 0); }
    function renderDevice(message) {
      var d = deviceDialog, cloud = endpointAllowed(endpoint), everyone = model.players();
      var notes = everyone.reduce(function (n, p) { return n + p.notes.length; }, 0), waiting = waitingNotes();
      while (d.firstChild) d.removeChild(d.firstChild);
      var title = node("h2", "", W.deviceOpen, "pt-device-title"); title.tabIndex = -1;
      var notice = node("details", "pt-device__privacy", "", "pt-device-privacy");
      notice.appendChild(node("summary", "", W.privacyTitle));
      [W.privacyStored, cloud ? W.privacySentCloud : W.privacySentLocal, cloud ? W.privacyWho : "", W.privacyContact, W.privacyDelete].forEach(function (text) { if (text) notice.appendChild(node("p", "", text)); });
      [title, node("p", "", W.deviceIntro), notice, node("h3", "", W.deviceNotesTitle),
        node("p", "", W.deviceSummary.replace("{players}", everyone.length).replace("{notes}", notes).replace("{waiting}", waiting))].forEach(function (n) { d.appendChild(n); });
      var out = node("p", "pt-device__status", message || "", "pt-device-status"); out.setAttribute("role", "status"); out.setAttribute("aria-live", "polite");
      if (!deviceShown) {
        // Notes can be private; they stay hidden until the grown-up chooses to read them.
        d.appendChild(node("p", "", W.deviceGate));
        if (notes) d.appendChild(action(W.deviceShow, "pt-btn pt-btn--secondary", "pt-device-show", function () { deviceShown = true; renderDevice(); focusId("pt-device-notes"); }));
      } else {
        var players = node("ul", "pt-device__players", "", "pt-device-notes"); players.tabIndex = -1;
        everyone.filter(function (p) { return p.notes.length; }).forEach(function (p) {
          var item = node("li", "pt-device__player"), inner = node("ul", "pt-device__notes");
          item.appendChild(node("strong", "", W.player + " " + p.sessionId.slice(-6).toUpperCase() + (p.sessionId === model.active() ? " " + W.deviceCurrent : "")));
          p.notes.forEach(function (e) {
            var entry = node("li", "pt-feedback__entry"), text = [scrubPII(e.worked, e.language), scrubPII(e.fix, e.language)].filter(Boolean), flags = privacyFlags(text.join("\n"));
            entry.appendChild(node("strong", "", label(e.stop) + (e.rating ? " · " + W[e.rating] : "")));
            entry.appendChild(node("p", "", text.join(" / ") || W.noText));
            if (flags.length) entry.appendChild(node("p", "pt-feedback__flags", W.flagged.replace("{words}", flags.join(", "))));
            entry.appendChild(node("span", "pt-feedback__entry-state", received(e) ? W.backed : (e.submitted ? W.pending : W.draft)));
            inner.appendChild(entry);
          });
          item.appendChild(inner); players.appendChild(item);
        });
        if (!notes) players.appendChild(node("li", "", W.deviceNone));
        d.appendChild(players);
        if (cloud && waiting) {
          var check = node("label", "pt-feedback__check"), box = node("input", "", "", "pt-device-confirm"); box.type = "checkbox";
          box.addEventListener("keydown", function (event) { if (event.key === "Enter") event.preventDefault(); });
          check.appendChild(box); check.appendChild(node("span", "", W.deviceCheck));
          d.appendChild(check);
          d.appendChild(action(W.deviceSend.replace("{count}", waiting), "pt-btn", "pt-device-send", function () { sendDevice(box, out); }));
        } else if (!cloud && notes) d.appendChild(node("p", "", W.deviceLocal));
        if (notes) d.appendChild(action(W.deviceDownload, "pt-btn pt-btn--secondary", "pt-device-download", function () { flush(); saveExcel(model.entries(true), "pecan-grove-feedback-all-players.xlsx", out, W.deviceDownloaded); }));
      }
      d.appendChild(out);
      var erase = node("div", "pt-device__erase");
      if (!eraseAsked) erase.appendChild(action(W.erase, "pt-btn pt-btn--secondary", "pt-device-erase", function () { eraseAsked = true; renderDevice(); focusId("pt-device-erase-no"); }));
      else {
        erase.appendChild(node("p", "", W.eraseConfirm + (waiting ? " " + W.eraseUnsent.replace("{count}", waiting) : ""), "pt-device-erase-message"));
        erase.appendChild(action(W.eraseNo, "pt-btn", "pt-device-erase-no", function () { eraseAsked = false; renderDevice(); focusId("pt-device-erase"); }));
        erase.appendChild(action(W.eraseYes, "pt-btn pt-btn--secondary", "pt-device-erase-yes", eraseDevice));
      }
      d.appendChild(erase);
      var actions = node("div", "pt-actions"); actions.appendChild(action(W.close, "pt-btn", "pt-device-close", closeDevice)); d.appendChild(actions);
    }
    function openDevice(opener) {
      flush();
      if (!deviceDialog) {
        deviceDialog = node("dialog", "pt-player-dialog pt-device", "", "pt-device-dialog"); deviceDialog.setAttribute("aria-labelledby", "pt-device-title");
        deviceDialog.addEventListener("cancel", function (event) { event.preventDefault(); closeDevice(); });
        dialogHost().appendChild(deviceDialog);
      }
      if (deviceDialog.open) return;
      deviceOpener = opener || document.activeElement; deviceShown = false; eraseAsked = false;
      renderDevice();
      if (typeof deviceDialog.showModal === "function") deviceDialog.showModal(); else deviceDialog.open = true;
      suspendNewPlayerVoice(true); focusId("pt-device-title");
    }
    function closeDevice() {
      if (!deviceDialog) return;
      if (deviceDialog.open) { if (typeof deviceDialog.close === "function") deviceDialog.close(); else deviceDialog.open = false; }
      suspendNewPlayerVoice(false); deviceShown = false; eraseAsked = false;
      var opener = deviceOpener; deviceOpener = null;
      if (opener && typeof opener.focus === "function" && opener.isConnected !== false) opener.focus();
    }
    async function sendDevice(box, out) {
      if (!endpointAllowed(endpoint)) return;
      if (inflight || sending) { out.textContent = W.sending; return; }
      if (!box.checked) { out.textContent = W.checkFirst; box.focus(); return; }
      flush();
      if (!model.submitAll(consent.scores)) { if (model.changedSession() || model.warning()) { setStatus(); return; } }
      var sendButton = document.getElementById("pt-device-send"); if (sendButton) sendButton.disabled = true;
      inflight = true; out.textContent = W.sending;
      // One request per batch of up to 20 records; a failed request stops and leaves the rest saved here.
      var rounds = Math.ceil(model.pending(true).length / 20) + 3;
      try {
        while (model.pending(true).length && rounds-- > 0) {
          controller = window.AbortController ? new window.AbortController() : null;
          var timeout = window.setTimeout(function () { if (controller) controller.abort(); }, 15000);
          try { await sendBatch(model, endpoint, window.fetch.bind(window), controller && controller.signal, true); }
          finally { window.clearTimeout(timeout); controller = null; }
        }
      } catch (_) { /* Anything not acknowledged stays on this device and is listed again. */ }
      inflight = false; render();
      var left = waitingNotes();
      if (deviceDialog && deviceDialog.open) renderDevice(left ? W.deviceFailed.replace("{count}", left) : W.deviceSent);
    }
    function eraseDevice() {
      leaving = true; window.clearTimeout(syncTimer); if (controller) controller.abort(); clearForm();
      var session = null; try { session = window.sessionStorage; } catch (_) { session = null; }
      if (!eraseAll(storage, session)) { leaving = false; renderDevice(W.storage); return; }
      // A closing page may save once more; the next load finishes the erase before anything else starts.
      try { if (session) session.setItem(ERASE_FLAG, "1"); } catch (_) { /* The erase above already removed the saved data. */ }
      window.location.reload();
    }
    [el("device"), document.getElementById("pt-device-open")].forEach(function (button) { if (button) button.addEventListener("click", function (event) { openDevice(event && event.currentTarget); }); });
    window.addEventListener("pagehide", function () { flush(); pageOpen = false; window.clearTimeout(syncTimer); if (controller) controller.abort(); });
    document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") flush(); });
    window.addEventListener("storage", function (event) {
      // Another tab erased this device: reload without writing this tab's copy back.
      if (event.key === KEY && event.newValue === null) { leaving = true; window.location.reload(); return; }
      // Storage events only read: writing from here could undo another tab's New player.
      if (event.key === KEY) { if (model.refresh()) syncForm(); render(); }
      if (event.key === CONSENT_KEY) { consent = readConsent(storage, model.active()); if (!consent.scores) model.withdrawScores(true); updateConsentControls(); }
    });
    model.upsert("session", 0, { phase: "start", language: lang });
    var initial = game && Number(game.dataset.currentStop);
    translateForm(); loadContext(Number.isInteger(initial) && initial >= 0 && initial <= 15 ? initial : 0); updateConsentControls();
    var runtime = { model: model, flush: flush, sync: sync, getConsent: consentCopy, setConsent: setConsent, showPreview: showPreview, openDevice: openDevice,
      requestNewPlayer: function (opener) { newPlayer({ currentTarget: opener }); } };
    window.PecanGroveFeedback = Object.assign({}, api, runtime);
    return runtime;
  }
  function eraseAll(storage, session) {
    var ok = true;
    [storage, session].forEach(function (area) {
      if (!area) return;
      try {
        var keys = [];
        for (var i = 0; i < area.length; i++) { var key = area.key(i); if (typeof key === "string" && key.indexOf("pecan-grove") === 0 && key !== ERASE_FLAG) keys.push(key); }
        keys.forEach(function (key) { area.removeItem(key); });
      } catch (_) { ok = false; }
    });
    return ok;
  }
  function finishErase(window) {
    // Repeat a just-confirmed erase before this page saves anything, in case the closing page saved once more.
    var session;
    try { session = window.sessionStorage; if (!session || session.getItem(ERASE_FLAG) !== "1") return; } catch (_) { return; }
    var storage = null; try { storage = window.localStorage; } catch (_) { storage = null; }
    eraseAll(storage, session);
    try { session.removeItem(ERASE_FLAG); } catch (_) { /* The flag only repeats an erase that already happened. */ }
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
  var api = { KEY: KEY, GAME_KEY: GAME_KEY, CONSENT_KEY: CONSENT_KEY, ERASE_FLAG: ERASE_FLAG, scrubPII: scrubPII, privacyFlags: privacyFlags, readConsent: readConsent, WORDS: WORDS, createModel: createModel, mergeEntries: mergeEntries, sendBatch: sendBatch, endpointAllowed: endpointAllowed, excel: excel, mount: mount, scopeSession: scopeSession, eraseAll: eraseAll, finishErase: finishErase };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  host.PecanGroveFeedback = api;
  if (host.document && host.document.getElementById && host.document.getElementById("community-builders")) {
    try { finishErase(host); } catch (e) { /* An unavailable session store has nothing left to erase. */ }
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
