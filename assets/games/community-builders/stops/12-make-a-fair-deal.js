/* Community Builders of Pecan Grove · Stop 12 · Make a Fair Deal / Haz un trato justo
   Neighbors and builders sit at one table and write promises down. The player puts 4 of 8 promises on the deal,
   shows the neighbors whose worries they answer, hears Ana (for the building crew) on the two hard ones, then makes
   each promise clear: who, what and when we check. Then the deal is signed.
   Score: +10 for each different neighbor helped (up to 5), +5 for each fully clear promise, +30 / +15 / 0 when
   0 / 1 / 2 promises are still too hard. Process only: never a side, an outcome or speed.
   Words are exact from the stop spec (12 - make-a-fair-deal.md). No network, no inputs, no inline styles. */
(function () {
  "use strict";
  var host = window.CommunityBuilders; if (!host) return;
  function factory(lifecycle) {
    var document = lifecycle.document, window = lifecycle.window, Date = lifecycle.Date;
    var setTimeout = lifecycle.setTimeout, clearTimeout = lifecycle.clearTimeout;
    var requestAnimationFrame = lifecycle.requestAnimationFrame, cancelAnimationFrame = lifecycle.cancelAnimationFrame;
    var definition = null, CB = { register: function (value) { definition = value; } };

  "use strict";

  var ID = "make-a-fair-deal";

  /* ── words (exact) ─────────────────────────────────────────────────── */
  var WORDS = {en:window.CBLocale.read("stop-12", "en", {en:{"WORDS.step":function (n) { return window.CBLocale.part("stop-12", "en", "WORDS.step", 0) + n + window.CBLocale.part("stop-12", "en", "WORDS.step", 1); },"WORDS.onDealN":function (n) { return window.CBLocale.part("stop-12", "en", "WORDS.onDealN", 0) + n + window.CBLocale.part("stop-12", "en", "WORDS.onDealN", 1); },"WORDS.helped":function (n) { return window.CBLocale.part("stop-12", "en", "WORDS.helped", 0) + n + window.CBLocale.part("stop-12", "en", "WORDS.helped", 1); },"WORDS.cardLabel":function (name, on) { return name + window.CBLocale.part("stop-12", "en", "WORDS.cardLabel", 0) + (on ? window.CBLocale.part("stop-12", "en", "WORDS.cardLabel", 1) : window.CBLocale.part("stop-12", "en", "WORDS.cardLabel", 2)); },"WORDS.promiseN":function (n) { return window.CBLocale.part("stop-12", "en", "WORDS.promiseN", 0) + n + window.CBLocale.part("stop-12", "en", "WORDS.promiseN", 1); },"WORDS.clearN":function (n) { return window.CBLocale.part("stop-12", "en", "WORDS.clearN", 0) + n + window.CBLocale.part("stop-12", "en", "WORDS.clearN", 1); },"WORDS.tipName":function (n) { return window.CBLocale.part("stop-12", "en", "WORDS.tipName", 0) + n + window.CBLocale.part("stop-12", "en", "WORDS.tipName", 1); }},es:{"WORDS.step":function (n) { return window.CBLocale.part("stop-12", "es", "WORDS.step", 0) + n + window.CBLocale.part("stop-12", "es", "WORDS.step", 1); },"WORDS.onDealN":function (n) { return window.CBLocale.part("stop-12", "es", "WORDS.onDealN", 0) + n + window.CBLocale.part("stop-12", "es", "WORDS.onDealN", 1); },"WORDS.helped":function (n) { return window.CBLocale.part("stop-12", "es", "WORDS.helped", 0) + n + window.CBLocale.part("stop-12", "es", "WORDS.helped", 1); },"WORDS.cardLabel":function (name, on) { return name + window.CBLocale.part("stop-12", "es", "WORDS.cardLabel", 0) + (on ? window.CBLocale.part("stop-12", "es", "WORDS.cardLabel", 1) : window.CBLocale.part("stop-12", "es", "WORDS.cardLabel", 2)); },"WORDS.promiseN":function (n) { return window.CBLocale.part("stop-12", "es", "WORDS.promiseN", 0) + n + window.CBLocale.part("stop-12", "es", "WORDS.promiseN", 1); },"WORDS.clearN":function (n) { return window.CBLocale.part("stop-12", "es", "WORDS.clearN", 0) + n + window.CBLocale.part("stop-12", "es", "WORDS.clearN", 1); },"WORDS.tipName":function (n) { return window.CBLocale.part("stop-12", "es", "WORDS.tipName", 0) + n + window.CBLocale.part("stop-12", "es", "WORDS.tipName", 1); }}}).WORDS,es:window.CBLocale.read("stop-12", "es", {en:{"WORDS.step":function (n) { return window.CBLocale.part("stop-12", "en", "WORDS.step", 0) + n + window.CBLocale.part("stop-12", "en", "WORDS.step", 1); },"WORDS.onDealN":function (n) { return window.CBLocale.part("stop-12", "en", "WORDS.onDealN", 0) + n + window.CBLocale.part("stop-12", "en", "WORDS.onDealN", 1); },"WORDS.helped":function (n) { return window.CBLocale.part("stop-12", "en", "WORDS.helped", 0) + n + window.CBLocale.part("stop-12", "en", "WORDS.helped", 1); },"WORDS.cardLabel":function (name, on) { return name + window.CBLocale.part("stop-12", "en", "WORDS.cardLabel", 0) + (on ? window.CBLocale.part("stop-12", "en", "WORDS.cardLabel", 1) : window.CBLocale.part("stop-12", "en", "WORDS.cardLabel", 2)); },"WORDS.promiseN":function (n) { return window.CBLocale.part("stop-12", "en", "WORDS.promiseN", 0) + n + window.CBLocale.part("stop-12", "en", "WORDS.promiseN", 1); },"WORDS.clearN":function (n) { return window.CBLocale.part("stop-12", "en", "WORDS.clearN", 0) + n + window.CBLocale.part("stop-12", "en", "WORDS.clearN", 1); },"WORDS.tipName":function (n) { return window.CBLocale.part("stop-12", "en", "WORDS.tipName", 0) + n + window.CBLocale.part("stop-12", "en", "WORDS.tipName", 1); }},es:{"WORDS.step":function (n) { return window.CBLocale.part("stop-12", "es", "WORDS.step", 0) + n + window.CBLocale.part("stop-12", "es", "WORDS.step", 1); },"WORDS.onDealN":function (n) { return window.CBLocale.part("stop-12", "es", "WORDS.onDealN", 0) + n + window.CBLocale.part("stop-12", "es", "WORDS.onDealN", 1); },"WORDS.helped":function (n) { return window.CBLocale.part("stop-12", "es", "WORDS.helped", 0) + n + window.CBLocale.part("stop-12", "es", "WORDS.helped", 1); },"WORDS.cardLabel":function (name, on) { return name + window.CBLocale.part("stop-12", "es", "WORDS.cardLabel", 0) + (on ? window.CBLocale.part("stop-12", "es", "WORDS.cardLabel", 1) : window.CBLocale.part("stop-12", "es", "WORDS.cardLabel", 2)); },"WORDS.promiseN":function (n) { return window.CBLocale.part("stop-12", "es", "WORDS.promiseN", 0) + n + window.CBLocale.part("stop-12", "es", "WORDS.promiseN", 1); },"WORDS.clearN":function (n) { return window.CBLocale.part("stop-12", "es", "WORDS.clearN", 0) + n + window.CBLocale.part("stop-12", "es", "WORDS.clearN", 1); },"WORDS.tipName":function (n) { return window.CBLocale.part("stop-12", "es", "WORDS.tipName", 0) + n + window.CBLocale.part("stop-12", "es", "WORDS.tipName", 1); }}}).WORDS};

  /* ── each neighbor's worry, word for word from Stop 3's line Set A and Set B ── */
  var WORRY = {
    A: {
      lee: window.CBLocale.pair("stop-12","bank.b0001"),
      johnson: window.CBLocale.pair("stop-12","bank.b0002"),
      ana: window.CBLocale.pair("stop-12","bank.b0003"),
      ruth: window.CBLocale.pair("stop-12","bank.b0004"),
      patel: window.CBLocale.pair("stop-12","bank.b0005"),
      jayden: window.CBLocale.pair("stop-12","bank.b0006")
    },
    B: {
      lee: window.CBLocale.pair("stop-12","bank.b0007"),
      johnson: window.CBLocale.pair("stop-12","bank.b0008"),
      ana: window.CBLocale.pair("stop-12","bank.b0009"),
      ruth: window.CBLocale.pair("stop-12","bank.b0010"),
      patel: window.CBLocale.pair("stop-12","bank.b0011"),
      jayden: window.CBLocale.pair("stop-12","bank.b0012")
    }
  };

  /* ── the eight promise cards (exact). helps: whose worry the card answers in Set A and Set B.
     ch: the two smaller changes the builders can keep; they help the same neighbors. Codes P1..P8 never show. ── */
  var PROMISES = [
    { id: "p1", ic: "water", name: window.CBLocale.pair("stop-12","bank.b0013"),
      line: window.CBLocale.pair("stop-12","bank.b0014"),
      helps: { A: ["johnson"], B: ["johnson", "ana"] },
      ch: [window.CBLocale.pair("stop-12","bank.b0015"),
        window.CBLocale.pair("stop-12","bank.b0016")] },
    { id: "p2", ic: "trucks", name: window.CBLocale.pair("stop-12","bank.b0017"),
      line: window.CBLocale.pair("stop-12","bank.b0018"),
      helps: { A: ["patel"], B: ["jayden"] },
      ch: [window.CBLocale.pair("stop-12","bank.b0019"),
        window.CBLocale.pair("stop-12","bank.b0020")] },
    { id: "p3", ic: "lamp", name: window.CBLocale.pair("stop-12","bank.b0021"),
      line: window.CBLocale.pair("stop-12","bank.b0022"),
      helps: { A: [], B: ["lee"] },
      ch: [window.CBLocale.pair("stop-12","bank.b0023"),
        window.CBLocale.pair("stop-12","bank.b0024")] },
    { id: "p4", ic: "hiring", name: window.CBLocale.pair("stop-12","bank.b0025"),
      line: window.CBLocale.pair("stop-12","bank.b0026"),
      helps: { A: ["ana", "jayden"], B: ["patel"] },
      also: { B: { patel: window.CBLocale.pair("stop-12","bank.b0027") } },
      ch: [window.CBLocale.pair("stop-12","bank.b0028"),
        window.CBLocale.pair("stop-12","bank.b0029")] },
    { id: "p5", ic: "graves", name: window.CBLocale.pair("stop-12","bank.b0030"),
      line: window.CBLocale.pair("stop-12","bank.b0031"),
      helps: { A: ["ruth"], B: [] },
      ch: [window.CBLocale.pair("stop-12","bank.b0032"),
        window.CBLocale.pair("stop-12","bank.b0033")] },
    { id: "p6", ic: "share", name: window.CBLocale.pair("stop-12","bank.b0034"),
      line: window.CBLocale.pair("stop-12","bank.b0035"),
      helps: { A: [], B: ["ruth"] },
      also: { B: { ruth: window.CBLocale.pair("stop-12","bank.b0036") } },
      ch: [window.CBLocale.pair("stop-12","bank.b0037"),
        window.CBLocale.pair("stop-12","bank.b0038")] },
    { id: "p7", ic: "jar", name: window.CBLocale.pair("stop-12","bank.b0039"),
      line: window.CBLocale.pair("stop-12","bank.b0040"),
      helps: { A: ["johnson"], B: ["ana"] },
      ch: [window.CBLocale.pair("stop-12","bank.b0041"),
        window.CBLocale.pair("stop-12","bank.b0042")] },
    { id: "p8", ic: "calendar", name: window.CBLocale.pair("stop-12","bank.b0043"),
      line: window.CBLocale.pair("stop-12","bank.b0044"),
      helps: { A: ["lee"], B: [] },
      ch: [window.CBLocale.pair("stop-12","bank.b0045"),
        window.CBLocale.pair("stop-12","bank.b0046")] }
  ];
  /* the spec's own check: in either set, four promises can help at most 5 of the 6 neighbors */
  ["A", "B"].forEach(function (s) {
    var most = 0;
    for (var a = 0; a < 8; a++) for (var b = a + 1; b < 8; b++) for (var c = b + 1; c < 8; c++) for (var d = c + 1; d < 8; d++) {
      var m = {}; [a, b, c, d].forEach(function (i) { PROMISES[i].helps[s].forEach(function (id) { m[id] = 1; }); });
      most = Math.max(most, Object.keys(m).length);
    }
    if (most !== 5 && window.console) console.error("Stop 12: set " + s + " reaches " + most + " neighbors, not 5");
  });

  /* ── small authored icons: 24-unit grid, one 2px round stroke (the shell's style) ── */
  var IC12 = {
    water: '<path d="M7.5 8c2.4 3 4 5.3 4 7.5a4 4 0 0 1-8 0c0-2.2 1.6-4.5 4-7.5z"/><path d="M14.5 4h6"/><path d="M15.5 4v13.5a2 2 0 0 0 4 0V4"/><path d="M15.5 12h4"/>',
    trucks: '<circle cx="7" cy="7.5" r="4.8"/><path d="M7 5v2.5l1.7 1.1"/><rect x="9.5" y="12.5" width="8" height="5.5" rx="1"/><path d="M17.5 14.5h2.6l2 2.3V18h-4.6"/><circle cx="12.5" cy="19.4" r="1.6"/><circle cx="19.5" cy="19.4" r="1.6"/>',
    lamp: '<path d="M6 21V7a3.5 3.5 0 0 1 3.5-3.5H14V5"/><path d="M10.8 8.5h6.4L15.6 5h-3.2z"/><path d="M12 11.5l-.8 2M14 11.5v2.2M16 11.5l.8 2"/><path d="M3.5 21h5"/>',
    hiring: '<path d="M3 10a4.75 4.75 0 0 1 9.5 0"/><path d="M2 10.5h11.5"/><path d="M7.75 5.25v2.5"/><path d="M11 15.5l5.5-4.5 5.5 4.5"/><path d="M12.5 14.3V21h8v-6.7"/><path d="M15.3 21v-3h2.4v3"/><path d="M16.5 11V6.5h3l-.9 1.2.9 1.2h-3"/>',
    graves: '<path d="M5.5 2.5h5"/><path d="M8 2.5V12"/><path d="M5 12h6v3.5a3 3 0 0 1-6 0z"/><circle cx="16" cy="13" r="4"/><path d="m19 16 2.8 2.8"/>',
    share: '<ellipse cx="7.5" cy="13" rx="5" ry="2"/><path d="M2.5 13v4c0 1.1 2.2 2 5 2s5-.9 5-2v-4"/><path d="M2.5 15c0 1.1 2.2 2 5 2s5-.9 5-2"/><path d="M17.5 3v18"/><path d="M14 6.5h7"/><path d="M15 10h5"/><path d="M14 6.5V8M21 6.5V8"/>',
    jar: '<path d="M7 9.5h10"/><path d="M7.5 9.5V19a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2V9.5"/><circle cx="12" cy="16" r="2"/><path d="M12 9.5V6"/><path d="M12 6.5c0-2 1.5-3.5 4-3.5 0 2.3-1.7 3.5-4 3.5z"/><path d="M12 7.5c0-1.7-1.3-3-3.5-3 0 1.9 1.4 3 3.5 3z"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 9.5h17"/><path d="M8 3v4M16 3v4"/><path d="m8.5 14.8 2.4 2.4 4.8-4.8"/>',
    scroll: '<path d="M5.5 4h13a3.5 3.5 0 0 1 0 7h-13a3.5 3.5 0 0 1 0-7z"/><path d="M18.5 4a3.5 3.5 0 0 0 0 7"/><path d="M12 4v7"/><circle cx="12" cy="13.4" r="2.4"/><path d="M10.7 15.5 9.6 20l2.4-1.3 2.4 1.3-1.1-4.5"/>',
    hourglass: '<path d="M6.5 3.5h11M6.5 20.5h11"/><path d="M7.5 3.5c0 4 4.5 5.5 4.5 8.5s-4.5 4.5-4.5 8.5"/><path d="M16.5 3.5c0 4-4.5 5.5-4.5 8.5s4.5 4.5 4.5 8.5"/><path d="M9.8 18.2h4.4"/>',
    q: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.6a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1.1.9-1.1 1.6v.6"/><circle cx="12" cy="17" r="1.1" fill="currentColor" stroke="none"/>',
    crew: '<path d="M4.8 15.5a7.2 7.2 0 0 1 14.4 0"/><path d="M10 8.6v5M14 8.6v5"/><rect x="2.5" y="15.5" width="19" height="3.2" rx="1.6"/>',
    pen: '<path d="M4 20l1.2-4.6L15.6 5a2.1 2.1 0 0 1 3 3L8.2 18.4z"/><path d="M13.6 7l3 3"/>'
  };
  /* the signed scroll: an open sheet rolls up and gets its ribbon seal (120 x 96) */
  var ROLL = '<g class="cb-s12-roll__sheet"><rect class="cb-s12-roll__rod" x="16" y="8" width="88" height="14" rx="7"/>' +
    '<rect class="cb-s12-roll__paper" x="24" y="21" width="72" height="58" rx="3"/><path class="cb-s12-roll__txt" d="M34 34h52M34 44h44M34 54h48M34 64h30"/>' +
    '<rect class="cb-s12-roll__rod" x="16" y="77" width="88" height="12" rx="6"/></g>' +
    '<g class="cb-s12-roll__tube"><rect class="cb-s12-roll__paper" x="12" y="36" width="96" height="22" rx="11"/><path class="cb-s12-roll__edge" d="M97 36a11 11 0 0 0 0 22"/><path class="cb-s12-roll__band" d="M60 36v22"/></g>' +
    '<g class="cb-s12-roll__seal"><path class="cb-s12-roll__tails" d="M53 70 48 88l12-6 12 6-5-18z"/><circle class="cb-s12-roll__disc" cx="60" cy="64" r="12"/><circle class="cb-s12-roll__ring" cx="60" cy="64" r="6.5"/></g>';
  var SVGNS = "http://www.w3.org/2000/svg";
  function icon(name, cls) {
    var s = document.createElementNS(SVGNS, "svg");
    s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true"); s.setAttribute("focusable", "false");
    s.setAttribute("class", "cb-ico" + (cls ? " " + cls : ""));
    host.setAuthoredMarkup(s, IC12[name]);                                 // constant, authored markup only
    return s;
  }

  /* the Deal Table: the painted Community building (the clock tower) with its garden in front */
  var TABLE = [0.20, 0.225, 0.60, 0.62];
  var WIDE = [0.40, 0.25, 0.81, 0.70];

  function run(api, stop) {
    var L = api.L, h = api.h, T = WORDS[L], W = api.W, NB = api.NB, STEPS = [null, null, null];
    var ANA = api.nbById("ana");
    function t2(p) { return L === "es" ? p[1] : p[0]; }
    function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
    document.title = T.title;

    /* ── the round: the other line set than last time, a new card order, new hard promises ── */
    var r = api.rec(stop.id) || {}, team = api.team();
    function other(s) { return s === "A" ? "B" : "A"; }
    var set = team && team.phase === "B" && team.s12Set ? other(team.s12Set)
      : (r.lastSet === "A" || r.lastSet === "B") ? other(r.lastSet) : ((api.rng ? api.rng() : Math.random()) < 0.5 ? "A" : "B");
    if (team && team.phase === "A") team.s12Set = set;
    var deck = api.shuffle(PROMISES).map(function (p) {
      return { p: p, id: p.id, name: t2(p.name), line: cap(t2(p.line)), helps: p.helps[set], on: false,
        hard: false, opts: null, choice: null, who: null, what: false, when: null, open: null, li: null, btn: null, k: 0 };
    });
    var S = { step: 0, picked: [], deal: null, locked: false, note: null, i: 0, hardDone: false, fresh: -1 };
    var viewPhase = "intro";
    var board, barEl, seatsEl, cardsEl;
    /* a double tap must not reach the control that the re-render puts under the finger (keyboard is never held back) */
    var calmUntil = 0;
    function calm(e) { return !!(e && e.detail > 0 && (e.detail > 1 || Date.now() < calmUntil)); }
    function settle() { calmUntil = Date.now() + 300; }
    /* keep something that just opened clear of the sticky action bar */
    function clearOfBar(el) {
      var b = board && board.querySelector(".cb-s12-bar");
      if (!el || !el.isConnected || !el.scrollIntoView) return;
      var room = b && !b.classList.contains("is-quiet") ? Math.ceil(b.getBoundingClientRect().height) + 28 : 16;
      el.style.setProperty("scroll-margin-bottom", room + "px");
      el.scrollIntoView({ block: "nearest", behavior: api.REDUCED ? "auto" : "smooth" });
    }

    /* ── small builders ──────────────────────────────────────────────── */
    function disc(name, cls) { return h("span", { "class": "cb-s12-ic" + (cls ? " " + cls : ""), "aria-hidden": "true" }, [icon(name)]); }
    function coach(text, ic) { return h("p", { "class": "cb-coach" }, [icon(ic), h("span", { text: text })]); }
    function badge(delay) { var b = h("span", { "class": "cb-badge" }, [api.ico("check")]); if (delay) b.style.setProperty("--d", delay); return b; }
    function swap(a, b) { if (a && a.parentNode) a.parentNode.replaceChild(b, a); return b; }
    function bigBtn(label, fn, data, ic) {
      var b = api.btn(label, "cb-btn--go cb-btn--big cb-s12-go", function (e) { if (calm(e)) return; settle(); fn(e); }, ic ? null : "go", true);
      if (ic) b.insertBefore(icon(ic), b.firstChild);
      b.setAttribute("data-s12", data); b.setAttribute("data-cb-id", "s12-" + data);
      return b;
    }
    function helpedMap(list) { var m = {}; list.forEach(function (c) { c.helps.forEach(function (id) { (m[id] = m[id] || []).push(c); }); }); return m; }
    function isClear(c) { return c.who !== null && c.what && c.when !== null; }
    function answered(c) { return !c.hard || c.choice !== null; }
    function scene(cls, rect, kids) { return api.crop(rect || TABLE, "cb-s12-scene" + (cls ? " " + cls : ""), kids); }
    function bar(info, btnEl) { return h("div", { "class": "cb-actions cb-s12-bar" }, [h("div", { "class": "cb-actions__info" }, info), btnEl || null]); }

    /* Ana's chair on the builders' side: her painted portrait (she already wears her hard hat) and a plate that says who she speaks for */
    function chair() {
      return h("span", { "class": "cb-s12-chair" }, [
        h("span", { "class": "cb-s12-chair__row", "aria-hidden": "true" }, [h("span", { "class": "cb-s12-chair__face" }, [api.img(ANA.img, "")])]),
        h("span", { "class": "cb-s12-plate" }, [h("b", { text: api.nmCap(ANA) }), h("small", { text: T.crew })])]);
    }
    function anaEl(line, fresh) {
      return h("div", { "class": "cb-s12-ana" }, [chair(), line ? h("div", { "class": "cb-s12-say" + (fresh ? " is-new" : "") }, [
        h("p", { "class": "cb-s12-say__line" }, [h("span", { "class": "cb-vh", text: api.nmCap(ANA) + ": " }), line])]) : null]);
    }
    /* the deal tray in the action bar: four slots that fill with the promises' icons */
    function slots() {
      var list = S.deal || S.picked;
      return h("ol", { "class": "cb-s12-slots", "aria-hidden": "true" }, [0, 1, 2, 3].map(function (k) {
        var c = list[k];
        if (!c) return h("li", { "class": "cb-s12-slot" });
        var st = "on";
        if (S.step === 2) st = k < S.i || (k === S.i && answered(c)) ? (c.choice === "keep" ? "hard" : "ok") : k === S.i ? "now" : "on";
        else if (S.step >= 3) st = isClear(c) ? "clear" : c.choice === "keep" ? "hard" : "on";
        var li = h("li", { "class": "cb-s12-slot is-full" + (S.fresh === k ? " is-new" : ""), "data-st": st }, [icon(c.p.ic)]);
        if (st === "ok" || st === "clear") li.appendChild(h("span", { "class": "cb-s12-slot__b" }, [api.ico("check")]));
        else if (st === "hard") li.appendChild(h("span", { "class": "cb-s12-slot__b" }, [icon("hourglass")]));
        return li;
      }));
    }
    function facesEl(c) {
      return h("span", { "class": "cb-s12-faces", "aria-hidden": "true" }, c.helps.map(function (id) {
        var n = api.nbById(id);
        return h("span", { "class": "cb-s12-faces__f" }, [api.img(n.img, ""), h("span", { "class": "cb-s12-faces__ok" }, [api.ico("check")])]);
      }));
    }
    function tagsEl(c, fresh) {
      var t = [];
      if (c.choice === 0 || c.choice === 1) t.push(h("span", { "class": "cb-s12-tag" + (fresh ? " is-new" : ""), "data-k": "changed" }, [icon("pen"), h("span", { text: T.changed })]));
      if (c.choice === "keep") t.push(h("span", { "class": "cb-s12-tag" + (fresh ? " is-new" : ""), "data-k": "hard" }, [icon("hourglass"), h("span", { text: T.tooHard })]));
      return t.length ? h("p", { "class": "cb-s12-tags" }, t) : null;
    }

    /* ── 0 · the intro over the Deal Table ───────────────────────────── */
    function intro() {
      viewPhase = "intro";
      S.step = 0;
      var guests = h("span", { "class": "cb-s12-guests", "aria-hidden": "true" }, NB.filter(function (n) { return n.id !== "ana"; }).map(function (n) {
        return h("span", { "class": "cb-s12-guests__f" }, [api.img(n.img, "")]);
      }));
      var card = h("div", { "class": "cb-s12-over" }, [guests,
        h("p", { "class": "cb-s12-over__lead", text: T.intro1 }),
        h("p", { "class": "cb-s12-over__how" }, [icon("scroll"), h("span", { text: T.intro2 })]),
        h("div", { "class": "cb-row" }, [bigBtn(T.start, function () { step1(); api.frame(); }, "start")])]);
      api.screen([api.stopHud(stop, null), h("div", { "class": "cb-board cb-s12", "data-step": "0", "data-set": set }, [
        h("div", { "class": "cb-s12-stage" }, [h("div", { "class": "cb-s12-stage__art" }, [scene("cb-s12-scene--wide", WIDE), anaEl(null)]), card])])]);
      api.frame();
    }

    /* ── 1 · pick four promises, then show the neighbors ─────────────── */
    function seatEl(n) {
      var worry = h("p", { "class": "cb-s12-worry", text: t2(WORRY[set][n.id]) });
      if (n.id === "ana") return h("li", { "class": "cb-s12-ana cb-s12-seat cb-s12-seat--ana", "data-nb": n.id }, [chair(), h("div", { "class": "cb-s12-say" }, [worry])]);
      return h("li", { "class": "cb-s12-seat", "data-nb": n.id }, [
        h("div", { "class": "cb-s12-seat__head" }, [h("span", { "class": "cb-s12-seat__face", "aria-hidden": "true" }, [api.img(n.img, "")]),
          h("span", { "class": "cb-s12-seat__name" }, [h("b", { text: api.nmCap(n) }), h("small", { text: n.plain[L] })])]),
        worry]);
    }
    function cardEl(c) {
      var lid = "cb-s12-l-" + c.id;
      c.btn = h("button", { type: "button", "class": "cb-s12-card", "data-s12": "card-" + c.id, "data-cb-id": "s12-card-" + c.id, "aria-describedby": lid, onclick: function (e) { if (!calm(e)) toggle(c); } }, [
        disc(c.p.ic, "cb-s12-card__ic"),
        h("span", { "class": "cb-s12-card__mark", "aria-hidden": "true" }, [api.ico("check")]),
        h("span", { "class": "cb-s12-card__tag", "aria-hidden": "true" }, [api.ico("check"), h("span", { text: T.onDeal })]),
        h("b", { "class": "cb-s12-card__name", text: c.name }),
        h("span", { "class": "cb-s12-card__line", id: lid, text: c.line })]);
      paintCard(c);
      return h("li", null, [c.btn]);
    }
    function paintCard(c) {
      c.btn.classList.toggle("is-on", c.on);
      c.btn.setAttribute("aria-pressed", c.on ? "true" : "false");
      c.btn.setAttribute("aria-label", T.cardLabel(c.name, c.on));
    }
    function bar1() {
      var n = S.picked.length;
      var el = bar([slots(), h("p", { "class": "cb-msg", text: T.onDealN(n) }), S.note ? api.fb(S.note, false) : null],
        n === 4 ? bigBtn(T.show, reveal, "show") : null);
      if (!n) el.classList.add("is-quiet");      // an empty tray does not cover the cards; it rises once the first promise is on the deal
      return el;
    }
    function step1() {
      viewPhase = "pick";
      S.step = 1;
      seatsEl = h("ul", { "class": "cb-s12-seats" }, [ANA].concat(NB.filter(function (n) { return n.id !== "ana"; })).map(seatEl));
      cardsEl = h("ul", { "class": "cb-s12-cards", "data-cb-choices": "" }, deck.map(cardEl));
      barEl = bar1();
      board = h("div", { "class": "cb-board cb-s12", "data-step": "1", "data-set": set }, [coach(T.s1, "scroll"),
        h("div", { "class": "cb-s12-table" }, [scene(), seatsEl]), cardsEl, barEl]);
      api.screen([api.stopHud(stop, STEPS, 0, T.step(1)), board]);
    }
    function toggle(c) {
      if (S.locked) return;
      if (!c.on && S.picked.length >= 4) { S.note = T.full; S.fresh = -1; barEl = swap(barEl, bar1()); api.say(T.full); return; }
      c.on = !c.on;
      if (c.on) S.picked.push(c); else S.picked.splice(S.picked.indexOf(c), 1);
      S.note = null; S.fresh = c.on ? S.picked.length - 1 : -1;
      paintCard(c); barEl = swap(barEl, bar1()); S.fresh = -1;
      api.say(T.onDealN(S.picked.length));
    }
    function reveal() {
      viewPhase = "shown";
      if (S.locked || S.picked.length !== 4) return;
      S.locked = true; S.deal = S.picked.slice();
      var m = helpedMap(S.deal), n = Object.keys(m).length, k = 0;
      [].forEach.call(seatsEl.children, function (li) {
        var id = li.getAttribute("data-nb"), cards = m[id] || null, delay = (0.1 + k * 0.12).toFixed(2) + "s";
        var box = li.querySelector(".cb-s12-seat__face, .cb-s12-chair__face");
        if (cards && box) box.appendChild(badge(delay));
        var more = [];
        (cards || []).forEach(function (c) { var a = c.p.also && c.p.also[set] && c.p.also[set][id]; if (a) more.push(h("p", { "class": "cb-s12-reply__more", text: t2(a) })); });
        var rep = h("div", { "class": "cb-s12-reply", "data-ok": cards ? "1" : "0" }, [api.ico(cards ? "check" : "chat"), h("p", { text: cards ? T.answers : T.notYet })].concat(more));
        rep.style.setProperty("--d", delay);
        (li.querySelector(".cb-s12-say") || li).appendChild(rep);
        li.classList.add(cards ? "is-helped" : "is-waiting");
        k++;
      });
      cardsEl = swap(cardsEl, h("ul", { "class": "cb-s12-cards cb-s12-cards--deal" }, S.deal.map(function (c) {
        return h("li", null, [h("div", { "class": "cb-s12-card is-on is-locked" }, [
          disc(c.p.ic, "cb-s12-card__ic"),
          h("span", { "class": "cb-s12-card__tag" }, [api.ico("check"), h("span", { text: T.onDeal })]),
          h("b", { "class": "cb-s12-card__name", text: c.name }),
          h("span", { "class": "cb-s12-card__line", text: c.line }),
          c.helps.length ? facesEl(c) : h("p", { "class": "cb-s12-card__none" }, [api.ico("bulb"), h("span", { text: T.noOne })])])]);
      })));
      var go = bigBtn(T.ask, function () { step2(0); api.frame(); }, "ask");
      barEl = swap(barEl, bar([slots(), h("p", { "class": "cb-msg", text: T.helped(n) }), n >= 5 ? api.fb(T.wow, true) : null], go));
      board.setAttribute("data-step", "1-shown");
      go.focus({ preventScroll: true });
      var top = board.querySelector(".cb-s12-table");
      if (top && top.getBoundingClientRect().top < 0) top.scrollIntoView({ block: "start", behavior: api.REDUCED ? "auto" : "smooth" });
      else clearOfBar(seatsEl.querySelector(".cb-s12-say"));     // on a phone, Ana's answer sits under the picture: keep it above the bar
      api.say(T.helped(n) + (n >= 5 ? " " + T.wow : ""));
    }

    /* ── 2 · Ana answers for the building crew, one promise at a time ── */
    function pickHard() {                      // exactly 2 of the 4, at random, preferring cards that were not hard last round
      var last = r.lastHard || [];
      var fresh = api.shuffle(S.deal.filter(function (c) { return last.indexOf(c.id) === -1; }));
      var stale = api.shuffle(S.deal.filter(function (c) { return last.indexOf(c.id) !== -1; }));
      fresh.concat(stale).slice(0, 2).forEach(function (c) { c.hard = true; c.opts = api.shuffle([0, 1]); });
    }
    function anaLine(c) { return !c.hard ? T.can : c.choice === null ? T.hard : c.choice === "keep" ? T.cant : T.can; }
    function optsEl(c) {
      var chosen = c.choice !== null;
      var items = c.opts.map(function (k) { return { k: k, text: cap(t2(c.p.ch[k])), ic: "pen" }; }).concat([{ k: "keep", text: T.keep, ic: c.p.ic }]);
      return h("div", { "class": "cb-s12-opts" }, [h("p", { "class": "cb-s12-opts__h", text: T.pickChange }),
        h("ul", { "class": "cb-s12-opts__list", "data-cb-choices": "" }, items.map(function (it) {
          var kids = [disc(it.ic, "cb-s12-opt__ic"), h("span", { "class": "cb-s12-opt__text", text: it.text })];
          if (!chosen) return h("li", null, [h("button", { type: "button", "class": "cb-s12-opt", "data-s12": "opt-" + it.k, onclick: function (e) { if (!calm(e)) choose(c, it.k); } }, kids)]);
          var me = c.choice === it.k;
          if (me) kids.push(h("span", { "class": "cb-s12-opt__mark" }, [api.ico("check")]));
          return h("li", null, [h("div", { "class": "cb-s12-opt is-static " + (me ? "is-chosen" : "is-rest") }, kids)]);
        }))]);
    }
    function step2(i, fresh) {
      viewPhase = "answer";
      S.step = 2; S.i = i;
      if (!S.hardDone) { pickHard(); S.hardDone = true; }
      var c = S.deal[i], done = answered(c);
      var big = h("div", { "class": "cb-s12-big" + (c.choice === "keep" ? " is-hard" : "") }, [
        h("div", { "class": "cb-s12-big__head" }, [disc(c.p.ic, "cb-s12-big__ic"),
          h("div", { "class": "cb-s12-big__t" }, [h("h3", { "class": "cb-s12-big__name", tabindex: "-1", "data-s12": "promise", text: c.name }), tagsEl(c, fresh)])]),
        h("p", { "class": "cb-s12-big__line" + (fresh && c.choice !== "keep" ? " is-new" : ""), text: c.line }),
        c.helps.length ? facesEl(c) : null]);
      var ask = h("div", { "class": "cb-s12-ask" + (c.hard ? "" : " cb-s12-ask--solo") }, [
        h("div", { "class": "cb-s12-ask__card" }, [h("p", { "class": "cb-linecount", text: T.promiseN(i + 1) }), big]), c.hard ? optsEl(c) : null]);
      var next = done ? bigBtn(W.next, function () { if (i < 3) { step2(i + 1); api.frame(); } else { step3(); api.frame(); } }, "next") : null;
      barEl = bar([slots(), c.choice === "keep" ? api.fb(T.note, false) : null], next);
      if (!next) barEl.classList.add("is-quiet");
      board = h("div", { "class": "cb-board cb-s12", "data-step": "2", "data-set": set, "data-hard": c.hard ? "1" : "0" }, [coach(T.s2, "crew"),
        h("div", { "class": "cb-s12-table" }, [scene(), anaEl(anaLine(c), fresh || i > 0)]), ask, barEl]);
      api.screen([api.stopHud(stop, STEPS, 1, T.step(2)), board], fresh ? '[data-s12="next"]' : '[data-s12="promise"]');
      if (!fresh) api.say(T.promiseN(i + 1) + ". " + c.name + ". " + api.nmCap(ANA) + ": " + anaLine(c) + (c.hard ? " " + T.pickChange : ""));
    }
    function choose(c, k) {
      if (c.choice !== null) return;
      c.choice = k;
      if (k !== "keep") c.line = cap(t2(c.p.ch[k]));
      step2(S.i, true);
      api.say(k === "keep" ? api.nmCap(ANA) + ": " + T.cant + " " + T.note + " " + T.tooHard : T.changed + ". " + api.nmCap(ANA) + ": " + T.can);
    }

    /* ── 3 · make each promise clear: who, what, and when we check ───── */
    var PARTS = ["who", "what", "when"];
    function partEl(c, key, nid) {
      var label = T[key], value = key === "who" ? (c.who === null ? null : T.whoOpts[c.who]) : key === "what" ? (c.what ? c.line : null) : (c.when === null ? null : T.whenOpts[c.when]);
      var fuzzy = key === "who" ? T.somebody : key === "what" ? T.tryHelp : T.someday, opts = key === "who" ? T.whoOpts : key === "when" ? T.whenOpts : null;
      var dd;
      if (value !== null) dd = h("dd", null, [h("p", { "class": "cb-s12-val" + (S.justPart === c.k + key ? " is-new" : "") }, [api.ico("check"), h("span", { text: value })])]);
      else {
        var open = c.open === key, cid = "cb-s12-o-" + c.id + "-" + key;
        var b = h("button", { type: "button", "class": "cb-s12-fuzzy", "data-s12": "f-" + c.k + "-" + key, "data-cb-id": "s12-f-" + c.k + "-" + key, "aria-label": label + " " + fuzzy, "aria-describedby": nid,
          onclick: function (e) { if (!calm(e)) tapFuzzy(c, key, e.detail === 0); } }, [icon("q"), h("span", { text: fuzzy })]);
        if (opts) { b.setAttribute("aria-expanded", open ? "true" : "false"); if (open) b.setAttribute("aria-controls", cid); }
        dd = h("dd", null, [b, opts && open ? h("div", { "class": "cb-s12-choices", id: cid }, opts.map(function (o, j) {
          return h("button", { type: "button", "class": "cb-s12-choice", "data-s12": "ch-" + c.k + "-" + key + "-" + j, "data-cb-id": "s12-ch-" + c.k + "-" + key + "-" + j, onclick: function (e) { if (!calm(e)) setPart(c, key, j, e.detail === 0); } }, [h("span", { text: o })]);
        })) : null]);
      }
      return h("div", { "class": "cb-s12-part" + (value !== null ? " is-clear" : ""), "data-part": key }, [h("dt", { text: label }), dd]);
    }
    function clarEl(c, fresh) {
      var clear = isClear(c), nid = "cb-s12-n-" + c.id;
      c.li = h("li", { "class": "cb-s12-clar" + (clear ? " is-clear" : ""), "data-c": String(c.k) }, [
        h("div", { "class": "cb-s12-clar__head" }, [h("span", { "class": "cb-s12-clar__ic" }, [disc(c.p.ic), clear ? badge() : null]),
          h("div", { "class": "cb-s12-clar__t" }, [h("b", { id: nid, text: c.name }), tagsEl(c)]),
          clear ? h("span", { "class": "cb-s12-clear" + (fresh ? " is-new" : "") }, [api.ico("check"), h("span", { text: T.clear })]) : null]),
        h("dl", { "class": "cb-s12-parts" }, PARTS.map(function (key) { return partEl(c, key, nid); }))]);
      return c.li;
    }
    function bar3() {
      return bar([slots(), h("p", { "class": "cb-msg", text: T.clearN(S.deal.filter(isClear).length) })], bigBtn(T.sign, signed, "sign", "pen"));
    }
    function step3() {
      viewPhase = "clarify";
      S.step = 3;
      S.deal.forEach(function (c, k) { c.k = k; });
      var list = h("ul", { "class": "cb-s12-clars" }, S.deal.map(function (c) { return clarEl(c); }));
      barEl = bar3();
      board = h("div", { "class": "cb-board cb-s12", "data-step": "3", "data-set": set }, [
        h("h3", { "class": "cb-board__h cb-s12-h", text: T.s3h }), coach(T.s3, "pen"),
        h("div", { "class": "cb-s12-table cb-s12-table--slim" }, [scene(), anaEl(null)]), list, barEl]);
      api.screen([api.stopHud(stop, STEPS, 2, T.step(3)), board], ".cb-s12-fuzzy");
      api.say(T.s3h + ". " + T.clearN(S.deal.filter(isClear).length));
    }
    function focusNext(c, key, kb) {
      var at = c.k * 3 + PARTS.indexOf(key), all = [].slice.call(board.querySelectorAll(".cb-s12-fuzzy"));
      var pos = function (b) { var m = /f-(\d)-(\w+)/.exec(b.getAttribute("data-s12")); return +m[1] * 3 + PARTS.indexOf(m[2]); };
      var nxt = all.filter(function (b) { return pos(b) > at; })[0] || all[0] || board.querySelector('[data-s12="sign"]');
      if (nxt) { nxt.focus({ preventScroll: true }); if (kb && !nxt.closest(".cb-s12-bar")) clearOfBar(nxt); }
    }
    function tapFuzzy(c, key, kb) {
      if (key === "what") { c.what = true; return settled(c, key, kb); }
      c.open = c.open === key ? null : key;
      if (!kb) settle();                    // the list below it moves: a double tap must not pick from it
      clarEl(c); swap(board.querySelector('[data-c="' + c.k + '"]'), c.li);
      var f = c.open ? c.li.querySelector('[data-s12="ch-' + c.k + "-" + key + '-0"]') : c.li.querySelector('[data-s12="f-' + c.k + "-" + key + '"]');
      if (f) f.focus({ preventScroll: true });
      if (c.open) clearOfBar(c.li.querySelector(".cb-s12-choices"));   // never open the two choices under the action bar
      else if (f && kb) clearOfBar(f);
    }
    function setPart(c, key, j, kb) { c[key] = j; settled(c, key, kb); }
    function settled(c, key, kb) {
      if (!kb) settle();                    // the parts below move up: a double tap must not clear the next one
      var before = S.deal.filter(isClear).length;
      c.open = null; S.justPart = c.k + key;
      var old = board.querySelector('[data-c="' + c.k + '"]');
      clarEl(c, isClear(c)); swap(old, c.li); S.justPart = null;
      var n = S.deal.filter(isClear).length;
      barEl = swap(barEl, bar3());
      focusNext(c, key, kb);
      var val = key === "who" ? T.whoOpts[c.who] : key === "what" ? c.line : T.whenOpts[c.when];
      api.say(T[key] + " " + val + (n > before ? ". " + T.clear + " " + T.clearN(n) : ""));
    }

    /* ── signed: the scroll rolls up and gets its ribbon seal ────────── */
    function recapEl(c) {
      function row(key) {
        var v = key === "who" ? (c.who === null ? null : T.whoOpts[c.who]) : key === "what" ? (c.what ? c.line : null) : (c.when === null ? null : T.whenOpts[c.when]);
        var fz = key === "who" ? T.somebody : key === "what" ? T.tryHelp : T.someday;
        return [h("dt", { text: T[key] }), h("dd", null, [v !== null ? h("span", { text: v }) : h("span", { "class": "cb-s12-fz" }, [icon("q"), h("span", { text: fz })])])];
      }
      return h("li", { "class": "cb-s12-rc" + (isClear(c) ? " is-clear" : "") }, [disc(c.p.ic, "cb-s12-rc__ic"),
        h("div", { "class": "cb-s12-rc__t" }, [h("b", { text: c.name }), tagsEl(c)]),
        h("dl", { "class": "cb-s12-rc__dl" }, [].concat(row("who"), row("what"), row("when")))]);
    }
    function signed() {
      viewPhase = "signed";
      S.step = 4;
      var roll = document.createElementNS(SVGNS, "svg");
      roll.setAttribute("viewBox", "0 0 120 96"); roll.setAttribute("aria-hidden", "true"); roll.setAttribute("focusable", "false"); roll.setAttribute("class", "cb-s12-roll");
      host.setAuthoredMarkup(roll, ROLL);                                     // constant, authored markup only
      var card = h("div", { "class": "cb-s12-over cb-s12-over--signed" }, [h("div", { "class": "cb-s12-signed" }, [roll, h("div", { "class": "cb-s12-signed__copy" }, [
        h("p", { "class": "cb-s12-over__lead", tabindex: "-1", "data-s12": "signed", text: T.signed1 }),
        h("p", { "class": "cb-s12-signed__aha", text: T.signed2 })])]),
        h("div", { "class": "cb-row" }, [bigBtn(T.see, finish, "see")])]);
      board = h("div", { "class": "cb-board cb-s12", "data-step": "4", "data-set": set }, [
        h("div", { "class": "cb-s12-stage cb-s12-stage--signed" }, [h("div", { "class": "cb-s12-stage__art" }, [scene("cb-s12-scene--wide", WIDE), anaEl(null)]), card]),
        h("ol", { "class": "cb-s12-recap" }, S.deal.map(recapEl))]);
      api.screen([api.stopHud(stop, STEPS, 3), board], '[data-s12="signed"]');
      api.say(T.signed1 + " " + T.signed2);
    }

    /* ── the score card ──────────────────────────────────────────────── */
    function finish() {
      viewPhase = "result";
      var m = helpedMap(S.deal), nHelped = Object.keys(m).length;
      var nClear = S.deal.filter(isClear).length, kept = S.deal.filter(function (c) { return c.choice === "keep"; }).length;
      var score = Math.min(5, nHelped) * 10 + nClear * 5 + (kept === 0 ? 30 : kept === 1 ? 15 : 0);
      var miss = NB.filter(function (n) { return !m[n.id]; })[0];
      var tip = nHelped < 5 ? T.tipName(api.nm(miss)) : kept ? T.tipKeep : nClear < 4 ? T.tipClear : T.tip100;
      var info = api.saveRound(stop.id, score, { lastRound: set + ":" + deck.map(function (c) { return c.id; }).join(","), lastSet: set,
        processBadge: nClear === 4 && kept === 0 ? "process-12" : null, lastHard: S.deal.filter(function (c) { return c.hard; }).map(function (c) { return c.id; }) });
      api.endPlay();
      var ask = h("div", { "class": "cb-tipcard cb-tipcard--real cb-s12-askgrown" }, [api.ico("chat"), h("div", null, [h("strong", { text: T.askGrown }), h("p", { text: T.askGrownText })])]);
      var card = api.scoreCard(stop, score, info, tip, T.takeaway, T.real, ask);
      var medal = card.querySelector(".cb-medal"), md = card.querySelector(".cb-medal__disc");
      if (medal && md) { medal.classList.add("cb-s12-medal"); md.appendChild(h("span", { "class": "cb-s12-seal", "aria-hidden": "true" }, [icon("scroll")])); }
      var gu = api.btn(T.gu, "cb-btn--quiet", function () { api.dialog(T.gu, [h("div", { "class": "cb-dlg__body" }, [h("p", { text: T.guText })])], gu); }, "family");
      api.finishRound(stop.id, card, api.cardButtons(stop.id, api.restart(stop.id), gu));
      api.say(W.score + " " + score + " / 100");
    }

    if (api.setController) api.setController({
      snapshot: function () { return { v: 2, phase: viewPhase, picked: S.picked.map(function (c) { return c.id; }),
        deal: S.deal ? S.deal.map(function (c) { return c.id; }) : null, locked: S.locked, note: !!S.note, i: S.i, hardDone: S.hardDone,
        deck: deck.map(function (c) { return { id: c.id, on: c.on, hard: c.hard, opts: c.opts, choice: c.choice, who: c.who, what: c.what, when: c.when, open: c.open, k: c.k }; }) }; },
      restore: function (saved) {
        if (!saved || saved.v !== 2 || !Array.isArray(saved.deck)) return false;
        var byId = {}; deck.forEach(function (c) { byId[c.id] = c; });
        saved.deck.forEach(function (value) { var c = byId[value.id]; if (!c) return;
          ["on", "hard", "opts", "choice", "who", "what", "when", "open", "k"].forEach(function (key) { c[key] = value[key]; });
          c.line = cap(t2(c.choice !== null && c.choice !== "keep" ? c.p.ch[c.choice] : c.p.line));
        });
        S.picked = saved.picked.map(function (id) { return byId[id]; }); S.deal = saved.deal ? saved.deal.map(function (id) { return byId[id]; }) : null;
        S.locked = !!saved.locked; S.note = saved.note ? T.full : null; S.i = saved.i; S.hardDone = !!saved.hardDone; S.fresh = -1;
        if (saved.phase === "result") finish(); else if (saved.phase === "signed") signed(); else if (saved.phase === "clarify") step3();
        else if (saved.phase === "answer") step2(S.i); else if (saved.phase === "shown") { S.locked = false; step1(); reveal(); }
        else if (saved.phase === "pick") step1(); else intro();
        return true;
      }
    });

    intro();
  }

  var LANG = (document.documentElement.lang || "en").slice(0, 2) === "es" ? "es" : "en";
  CB.register({ id: ID, steps: { en: [null, null, null], es: [null, null, null] }[LANG], css: "12-make-a-fair-deal.css", run: run });

    return definition;
  }
  if (host.defineStop) host.defineStop(factory);
  else host.register(factory({ document: document, window: window, Date: Date, setTimeout: setTimeout, clearTimeout: clearTimeout, requestAnimationFrame: requestAnimationFrame, cancelAnimationFrame: typeof cancelAnimationFrame === "function" ? cancelAnimationFrame : function () {} }));
})();
