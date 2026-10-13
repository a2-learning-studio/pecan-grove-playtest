/* Community Builders of Pecan Grove · Stop 8 · Disagree Kindly / Desacuerdo con respeto
   Two neighbors at the park disagree about one part of the plan. The player hears what each wants,
   chooses to ask why, then tries idea cards until two work for both.
   Score: process only (asking why before the first try, finding both ways, careful trying). Never a side, never speed.
   Words are exact from the stop spec (08 - disagree-kindly.md). No network, no inputs, no inline styles. */
(function () {
  "use strict";
  var host = window.CommunityBuilders; if (!host) return;
  function factory(lifecycle) {
    var document = lifecycle.document, window = lifecycle.window, Date = lifecycle.Date;
    var setTimeout = lifecycle.setTimeout, clearTimeout = lifecycle.clearTimeout;
    var requestAnimationFrame = lifecycle.requestAnimationFrame, cancelAnimationFrame = lifecycle.cancelAnimationFrame;
    var definition = null, CB = { register: function (value) { definition = value; } };

  "use strict";

  var LANG = (document.documentElement.lang || "en").slice(0, 2) === "es" ? "es" : "en";
  var ID = "disagree-kindly";

  /* ── words (exact) ─────────────────────────────────────────────────── */
  var WORDS = {en:window.CBLocale.read("stop-08", "en", {en:{"WORDS.hard":function (why) { return window.CBLocale.part("stop-08", "en", "WORDS.hard", 0) + why + window.CBLocale.part("stop-08", "en", "WORDS.hard", 1); },"WORDS.hardFor":function (n) { return window.CBLocale.part("stop-08", "en", "WORDS.hardFor", 0) + n; },"WORDS.tray":function (n) { return window.CBLocale.part("stop-08", "en", "WORDS.tray", 0) + n + window.CBLocale.part("stop-08", "en", "WORDS.tray", 1); },"WORDS.tipOne":function (aName) { return window.CBLocale.part("stop-08", "en", "WORDS.tipOne", 0) + aName + window.CBLocale.part("stop-08", "en", "WORDS.tipOne", 1); },"WORDS.nbLabel":function (n) { return n + window.CBLocale.part("stop-08", "en", "WORDS.nbLabel", 0); },"WORDS.askLabel":function (aName) { return window.CBLocale.part("stop-08", "en", "WORDS.askLabel", 0) + aName + window.CBLocale.part("stop-08", "en", "WORDS.askLabel", 1); },"WORDS.tryLabel":function (c) { return window.CBLocale.part("stop-08", "en", "WORDS.tryLabel", 0) + c; }},es:{"WORDS.hard":function (why) { return window.CBLocale.part("stop-08", "es", "WORDS.hard", 0) + why + window.CBLocale.part("stop-08", "es", "WORDS.hard", 1); },"WORDS.hardFor":function (n) { return window.CBLocale.part("stop-08", "es", "WORDS.hardFor", 0) + n; },"WORDS.tray":function (n) { return window.CBLocale.part("stop-08", "es", "WORDS.tray", 0) + n + window.CBLocale.part("stop-08", "es", "WORDS.tray", 1); },"WORDS.tipOne":function (aName) { return window.CBLocale.part("stop-08", "es", "WORDS.tipOne", 0) + aName + window.CBLocale.part("stop-08", "es", "WORDS.tipOne", 1); },"WORDS.nbLabel":function (n) { return n + window.CBLocale.part("stop-08", "es", "WORDS.nbLabel", 0); },"WORDS.askLabel":function (aName) { return window.CBLocale.part("stop-08", "es", "WORDS.askLabel", 0) + aName + window.CBLocale.part("stop-08", "es", "WORDS.askLabel", 1); },"WORDS.tryLabel":function (c) { return window.CBLocale.part("stop-08", "es", "WORDS.tryLabel", 0) + c; }}}).WORDS,es:window.CBLocale.read("stop-08", "es", {en:{"WORDS.hard":function (why) { return window.CBLocale.part("stop-08", "en", "WORDS.hard", 0) + why + window.CBLocale.part("stop-08", "en", "WORDS.hard", 1); },"WORDS.hardFor":function (n) { return window.CBLocale.part("stop-08", "en", "WORDS.hardFor", 0) + n; },"WORDS.tray":function (n) { return window.CBLocale.part("stop-08", "en", "WORDS.tray", 0) + n + window.CBLocale.part("stop-08", "en", "WORDS.tray", 1); },"WORDS.tipOne":function (aName) { return window.CBLocale.part("stop-08", "en", "WORDS.tipOne", 0) + aName + window.CBLocale.part("stop-08", "en", "WORDS.tipOne", 1); },"WORDS.nbLabel":function (n) { return n + window.CBLocale.part("stop-08", "en", "WORDS.nbLabel", 0); },"WORDS.askLabel":function (aName) { return window.CBLocale.part("stop-08", "en", "WORDS.askLabel", 0) + aName + window.CBLocale.part("stop-08", "en", "WORDS.askLabel", 1); },"WORDS.tryLabel":function (c) { return window.CBLocale.part("stop-08", "en", "WORDS.tryLabel", 0) + c; }},es:{"WORDS.hard":function (why) { return window.CBLocale.part("stop-08", "es", "WORDS.hard", 0) + why + window.CBLocale.part("stop-08", "es", "WORDS.hard", 1); },"WORDS.hardFor":function (n) { return window.CBLocale.part("stop-08", "es", "WORDS.hardFor", 0) + n; },"WORDS.tray":function (n) { return window.CBLocale.part("stop-08", "es", "WORDS.tray", 0) + n + window.CBLocale.part("stop-08", "es", "WORDS.tray", 1); },"WORDS.tipOne":function (aName) { return window.CBLocale.part("stop-08", "es", "WORDS.tipOne", 0) + aName + window.CBLocale.part("stop-08", "es", "WORDS.tipOne", 1); },"WORDS.nbLabel":function (n) { return n + window.CBLocale.part("stop-08", "es", "WORDS.nbLabel", 0); },"WORDS.askLabel":function (aName) { return window.CBLocale.part("stop-08", "es", "WORDS.askLabel", 0) + aName + window.CBLocale.part("stop-08", "es", "WORDS.askLabel", 1); },"WORDS.tryLabel":function (c) { return window.CBLocale.part("stop-08", "es", "WORDS.tryLabel", 0) + c; }}}).WORDS};

  /* ── the six disagreements (exact). Each card lists the whys it works for. ── */
  var D = [
    { id: "trucks", ic: "truck", topic: window.CBLocale.pair("stop-08","bank.b0001"),
      want: { A: window.CBLocale.pair("stop-08","bank.b0002"),
              B: window.CBLocale.pair("stop-08","bank.b0003") },
      why: { A1: window.CBLocale.pair("stop-08","bank.b0004"),
             A2: window.CBLocale.pair("stop-08","bank.b0005"),
             B1: window.CBLocale.pair("stop-08","bank.b0006"),
             B2: window.CBLocale.pair("stop-08","bank.b0007") },
      cards: [
        [].concat([["A1", "A2"]],window.CBLocale.pair("stop-08","bank.b0008")),
        [].concat([["B1", "B2"]],window.CBLocale.pair("stop-08","bank.b0009")),
        [].concat([["A1", "A2", "B1"]],window.CBLocale.pair("stop-08","bank.b0010")),
        [].concat([["A1", "A2", "B1"]],window.CBLocale.pair("stop-08","bank.b0011")),
        [].concat([["A2", "B1", "B2"]],window.CBLocale.pair("stop-08","bank.b0012")),
        [].concat([["A2", "B2"]],window.CBLocale.pair("stop-08","bank.b0013"))
      ] },
    { id: "lights", ic: "moon", topic: window.CBLocale.pair("stop-08","bank.b0014"),
      want: { A: window.CBLocale.pair("stop-08","bank.b0015"),
              B: window.CBLocale.pair("stop-08","bank.b0016") },
      why: { A1: window.CBLocale.pair("stop-08","bank.b0017"),
             A2: window.CBLocale.pair("stop-08","bank.b0018"),
             B1: window.CBLocale.pair("stop-08","bank.b0019"),
             B2: window.CBLocale.pair("stop-08","bank.b0020") },
      cards: [
        [].concat([["A1", "A2"]],window.CBLocale.pair("stop-08","bank.b0021")),
        [].concat([["B1", "B2"]],window.CBLocale.pair("stop-08","bank.b0022")),
        [].concat([["A1", "B1"]],window.CBLocale.pair("stop-08","bank.b0023")),
        [].concat([["A1", "B1"]],window.CBLocale.pair("stop-08","bank.b0024")),
        [].concat([["A2", "B1", "B2"]],window.CBLocale.pair("stop-08","bank.b0025")),
        [].concat([["A2", "B1", "B2"]],window.CBLocale.pair("stop-08","bank.b0026"))
      ] },
    { id: "workers", ic: "hardhat", topic: window.CBLocale.pair("stop-08","bank.b0027"),
      want: { A: window.CBLocale.pair("stop-08","bank.b0028"),
              B: window.CBLocale.pair("stop-08","bank.b0029") },
      why: { A1: window.CBLocale.pair("stop-08","bank.b0030"),
             A2: window.CBLocale.pair("stop-08","bank.b0031"),
             B1: window.CBLocale.pair("stop-08","bank.b0032"),
             B2: window.CBLocale.pair("stop-08","bank.b0033") },
      cards: [
        [].concat([["A1", "A2"]],window.CBLocale.pair("stop-08","bank.b0034")),
        [].concat([["B1", "B2"]],window.CBLocale.pair("stop-08","bank.b0035")),
        [].concat([["A1", "B1", "B2"]],window.CBLocale.pair("stop-08","bank.b0036")),
        [].concat([["A1", "B1", "B2"]],window.CBLocale.pair("stop-08","bank.b0037")),
        [].concat([["A1", "A2", "B2"]],window.CBLocale.pair("stop-08","bank.b0038")),
        [].concat([["A2", "B2"]],window.CBLocale.pair("stop-08","bank.b0039"))
      ] },
    { id: "trees", ic: "tree", topic: window.CBLocale.pair("stop-08","bank.b0040"),
      want: { A: window.CBLocale.pair("stop-08","bank.b0041"),
              B: window.CBLocale.pair("stop-08","bank.b0042") },
      why: { A1: window.CBLocale.pair("stop-08","bank.b0043"),
             A2: window.CBLocale.pair("stop-08","bank.b0044"),
             B1: window.CBLocale.pair("stop-08","bank.b0045"),
             B2: window.CBLocale.pair("stop-08","bank.b0046") },
      cards: [
        [].concat([["A1", "A2"]],window.CBLocale.pair("stop-08","bank.b0047")),
        [].concat([["B1", "B2"]],window.CBLocale.pair("stop-08","bank.b0048")),
        [].concat([["A1", "B1", "B2"]],window.CBLocale.pair("stop-08","bank.b0049")),
        [].concat([["A1", "B1", "B2"]],window.CBLocale.pair("stop-08","bank.b0050")),
        [].concat([["A2", "B1", "B2"]],window.CBLocale.pair("stop-08","bank.b0051")),
        [].concat([["A1", "A2", "B2"]],window.CBLocale.pair("stop-08","bank.b0052"))
      ] },
    { id: "engines", ic: "sound", topic: window.CBLocale.pair("stop-08","bank.b0053"),
      sub: window.CBLocale.pair("stop-08","bank.b0054"),
      want: { A: window.CBLocale.pair("stop-08","bank.b0055"),
              B: window.CBLocale.pair("stop-08","bank.b0056") },
      why: { A1: window.CBLocale.pair("stop-08","bank.b0057"),
             A2: window.CBLocale.pair("stop-08","bank.b0058"),
             B1: window.CBLocale.pair("stop-08","bank.b0059"),
             B2: window.CBLocale.pair("stop-08","bank.b0060") },
      cards: [
        [].concat([["A1", "A2"]],window.CBLocale.pair("stop-08","bank.b0061")),
        [].concat([["B1", "B2"]],window.CBLocale.pair("stop-08","bank.b0062")),
        [].concat([["A1", "B1", "B2"]],window.CBLocale.pair("stop-08","bank.b0063")),
        [].concat([["A1", "B1", "B2"]],window.CBLocale.pair("stop-08","bank.b0064")),
        [].concat([["A2", "B1", "B2"]],window.CBLocale.pair("stop-08","bank.b0065")),
        [].concat([["A2", "B1", "B2"]],window.CBLocale.pair("stop-08","bank.b0066"))
      ] },
    { id: "digging", ic: "shovel", topic: window.CBLocale.pair("stop-08","bank.b0067"),
      want: { A: window.CBLocale.pair("stop-08","bank.b0068"),
              B: window.CBLocale.pair("stop-08","bank.b0069") },
      why: { A1: window.CBLocale.pair("stop-08","bank.b0070"),
             A2: window.CBLocale.pair("stop-08","bank.b0071"),
             B1: window.CBLocale.pair("stop-08","bank.b0072"),
             B2: window.CBLocale.pair("stop-08","bank.b0073") },
      cards: [
        [].concat([["A1", "A2"]],window.CBLocale.pair("stop-08","bank.b0074")),
        [].concat([["B1", "B2"]],window.CBLocale.pair("stop-08","bank.b0075")),
        [].concat([["A1", "A2", "B1"]],window.CBLocale.pair("stop-08","bank.b0076")),
        [].concat([["A1", "A2", "B1"]],window.CBLocale.pair("stop-08","bank.b0077")),
        [].concat([["A1", "A2", "B2"]],window.CBLocale.pair("stop-08","bank.b0078")),
        [].concat([["A1", "A2", "B2"]],window.CBLocale.pair("stop-08","bank.b0079"))
      ] }
  ];
  /* the spec's own check: exactly two cards work for both in every version */
  D.forEach(function (d) {
    [1, 2].forEach(function (v) {
      var n = d.cards.filter(function (c) { return c[0].indexOf("A" + v) !== -1 && c[0].indexOf("B" + v) !== -1; }).length;
      if (n !== 2 && window.console) console.error("Stop 8: " + d.id + " version " + v + " has " + n + " cards that work for both");
    });
  });

  /* ── small authored icons: 24-unit grid, one 2px round stroke (same style as the shell's) ── */
  var IC8 = {
    truck: '<rect x="2.5" y="6" width="11" height="9.5" rx="1.5"/><path d="M13.5 9h3.6l3.4 3.8v2.7h-7"/><circle cx="7" cy="17.5" r="2"/><circle cx="17" cy="17.5" r="2"/>',
    moon: '<path d="M20 13.6A8 8 0 1 1 10.4 4a6.3 6.3 0 0 0 9.6 9.6z"/>',
    hardhat: '<path d="M4.8 15.5a7.2 7.2 0 0 1 14.4 0"/><path d="M10 8.6v5M14 8.6v5"/><rect x="2.5" y="15.5" width="19" height="3.2" rx="1.6"/>',
    tree: '<path d="M8 17.5a3.8 3.8 0 0 1-2-7 3.6 3.6 0 0 1 3.4-5A3.2 3.2 0 0 1 12 4a3.2 3.2 0 0 1 2.6 1.5 3.6 3.6 0 0 1 3.4 5 3.8 3.8 0 0 1-2 7z"/><path d="M12 17.5V21M12 14.6l-2.2-1.9"/>',
    sound: '<path d="M12 4v16M8 8v8M16 8v8M4 10.5v3M20 10.5v3"/>',
    shovel: '<path d="M12.6 11.4 19 5"/><path d="M17.2 3.2l3.6 3.6"/><path d="M10.4 9.6l4 4-4.6 4.7a4 4 0 0 1-5.7 0 4 4 0 0 1 0-5.7z"/>',
    thumbs: '<path d="M7 10.5v9H4.6a1.1 1.1 0 0 1-1.1-1.1v-6.8a1.1 1.1 0 0 1 1.1-1.1z"/><path d="M7 10.5 10.7 4a1.9 1.9 0 0 1 3.5 1.3L13.5 9h5a2 2 0 0 1 2 2.4l-1.3 6.5a2 2 0 0 1-2 1.6H7"/>',
    think: '<circle cx="12" cy="12" r="8.6"/><path d="M8.9 10.4h.01M15.1 10.4h.01"/><path d="M9.6 15.4h4.8"/><path d="M14 7.4c.9-.4 1.9-.4 2.7.1"/>',
    leaf: '<path d="M4.5 19.5c0-8 5.2-14.5 15-15 0 9.2-6.2 15-15 15z"/><path d="M4.5 19.5 14 10"/>',
    table: '<rect x="3" y="7" width="18" height="2.6" rx="1.3"/><path d="M7.5 9.6 5 19M16.5 9.6 19 19M3.5 14.5h17"/>'
  };
  var SVGNS = "http://www.w3.org/2000/svg";
  function icon(name, cls) {
    var s = document.createElementNS(SVGNS, "svg");
    s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true"); s.setAttribute("focusable", "false");
    s.setAttribute("class", "cb-ico" + (cls ? " " + cls : ""));
    host.setAuthoredMarkup(s, IC8[name]);                                 // constant, authored markup only
    return s;
  }

  /* the park: Community center behind, the big tree in its hedge, the bench by the path */
  var PARK = [0.38, 0.31, 0.80, 0.73];

  /* ghost taps: when a screen changes under the pointer, the second tap of a double tap must not press
     whatever was drawn there (a neighbor, an idea card, the score card's "Play again"). Pointer clicks only;
     keyboard clicks (detail 0) always go through. */
  var calmUntil = 0, guarded = false;
  function calm(ms) { calmUntil = Date.now() + (ms || 350); }
  function guard() {
    var root = document.querySelector('[data-game="community-builders"]');
    if (guarded || !root) return; guarded = true;
    document.addEventListener("click", function (e) { if (root.contains(e.target) && e.detail > 0 && Date.now() < calmUntil) { e.stopPropagation(); e.preventDefault(); } }, true);
  }

  function run(api, stop) {
    var L = api.L, h = api.h, T = WORDS[L], W = api.W, STEPS = [null, null];
    function t2(p) { return L === "es" ? p[1] : p[0]; }
    function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
    function aNm(n) { var s = api.nm(n); return L === "es" ? (/^el /.test(s) ? "al " + s.slice(3) : "a " + s) : s; }
    document.title = stop.name + " - " + W.series;
    guard(); calm();

    /* ── the round: a new topic, a new pair, sides that swap ─────────── */
    var r = api.rec(stop.id) || {}, team = api.team();
    var round = (function () {
      var avoid = [r.lastTopic, team && team.phase === "B" ? team.s08Topic : null];
      var pool = D.filter(function (d) { return avoid.indexOf(d.id) === -1; });
      var d = api.pick(pool.length ? pool : D), v = (api.rng ? api.rng() : Math.random()) < 0.5 ? 1 : 2;
      var ids = api.NB.map(function (n) { return n.id; }), pairs = [], lastPair = r.lastPair || [], sides = r.sides || {};
      for (var i = 0; i < ids.length; i++) for (var j = i + 1; j < ids.length; j++) pairs.push([ids[i], ids[j]]);
      pairs = api.shuffle(pairs).filter(function (p) { return !(lastPair.indexOf(p[0]) !== -1 && lastPair.indexOf(p[1]) !== -1); });
      function flip(s) { return s === "A" ? "B" : s === "B" ? "A" : null; }
      function seat(p) {                       // a neighbor who took side A last time takes side B, and the other way round
        var n0 = flip(sides[p[0]]), n1 = flip(sides[p[1]]);
        if (n0 && n1) return n0 === n1 ? null : n0 === "A" ? p : [p[1], p[0]];
        if (n0) return n0 === "A" ? p : [p[1], p[0]];
        if (n1) return n1 === "A" ? [p[1], p[0]] : p;
        return (api.rng ? api.rng() : Math.random()) < 0.5 ? p : [p[1], p[0]];
      }
      var ab = null;
      for (var k = 0; k < pairs.length && !ab; k++) ab = seat(pairs[k]);
      if (!ab) ab = (api.rng ? api.rng() : Math.random()) < 0.5 ? pairs[0] : [pairs[0][1], pairs[0][0]];
      if (team && team.phase === "A") team.s08Topic = d.id;
      return { d: d, v: v, nb: { A: api.nbById(ab[0]), B: api.nbById(ab[1]) },
        cards: api.shuffle(d.cards.map(function (c, i) { return { i: i, tags: c[0], text: L === "es" ? c[2] : c[1] }; })) };
    })();
    var d = round.d, NBS = round.nb;
    function wantOf(side) { return t2(d.want[side]); }
    function whyOf(side) { return t2(d.why[side + round.v]); }
    function fits(card, side) { return card.tags.indexOf(side + round.v) !== -1; }
    function answer(card, side) { return fits(card, side) ? T.can : T.hard(whyOf(side)); }

    /* ── play state ──────────────────────────────────────────────────── */
    var S = { step: 1, open: { A: false, B: false }, why: { A: false, B: false }, firstTry: null, tries: [], found: [], tried: {}, last: null, msg: null };
    var board, hudEl, coachEl, ideasEl, trayEl, actionsEl, seats = {}, phase = "intro";

    function face(n, cls) { return h("span", { "class": cls, "aria-hidden": "true" }, [api.img(n.img, "")]); }
    function scene(cls, kids) {
      return api.crop(PARK, "cb-s08-scene" + (cls ? " " + cls : ""), [h("span", { "class": "cb-s08-place", "aria-hidden": "true" }, [icon("table"), h("span", { text: T.park })])].concat(kids || []));
    }
    function swap(oldEl, newEl) { if (oldEl && oldEl.parentNode) oldEl.parentNode.replaceChild(newEl, oldEl); return newEl; }

    /* ── 1 · intro over the picture ──────────────────────────────────── */
    function intro() {
      phase = "intro";
      var duo = ["A", "B"].map(function (side) {
        var n = NBS[side];
        return h("span", { "class": "cb-s08-guest", "data-side": side, "aria-hidden": "true" }, [face(n, "cb-s08-guest__face"), h("b", { text: api.nmCap(n) })]);
      });
      var go = api.btn(T.go, "cb-btn--go cb-btn--big cb-s08-big", function () { calm(); play(); }, "go", true);
      api.screen([api.stopHud(stop, null), h("div", { "class": "cb-board cb-s08" }, [
        h("div", { "class": "cb-s08-stage" }, [scene("cb-s08-scene--wide", duo),
          h("div", { "class": "cb-s08-say" }, [h("p", { "class": "cb-s08-say__text", text: T.intro }), h("div", { "class": "cb-row" }, [go])])])])]);
      api.frame();
    }

    /* ── 2 · the table: two neighbors, their bubbles, six ideas, the tray ── */
    function play() {
      phase = "play";
      hudEl = api.stopHud(stop, STEPS, 0, T.step1);
      var topic = h("header", { "class": "cb-s08-topic" }, [h("span", { "class": "cb-s08-topic__ic", "aria-hidden": "true" }, [icon(d.ic)]),
        h("div", null, [h("h3", { tabindex: "-1", "data-s08": "topic", text: t2(d.topic) }), d.sub ? h("p", { text: t2(d.sub) }) : null])]);
      var pair = h("div", { "class": "cb-s08-pair" }, ["A", "B"].map(function (side) {
        var who = whoEl(side); seats[side].bubble = bubbleEl(side);
        return h("div", { "class": "cb-s08-seat", "data-side": side }, [who, seats[side].bubble]);
      }));
      coachEl = api.coach(T.coach1, "ear");
      ideasEl = h("div", { "class": "cb-s08-slot-ideas", hidden: true });
      trayEl = h("div", { "class": "cb-s08-slot-tray", hidden: true });
      actionsEl = h("div", { "class": "cb-s08-slot-actions", hidden: true });
      board = h("div", { "class": "cb-board cb-s08", "data-step": "1" }, [topic, h("div", { "class": "cb-s08-table" }, [scene(null, []), pair]), coachEl, ideasEl, trayEl, actionsEl]);
      api.screen([hudEl, board], '[data-s08="topic"]');
      api.frame();
    }

    /* a neighbor at the table: built once, then changed in place, so focus never jumps */
    function whoEl(side) {
      var n = NBS[side], st = seats[side] = {};
      st.face = h("span", { "class": "cb-s08-nb__face" }, [api.img(n.img, "")]);
      st.btn = h("button", { type: "button", "class": "cb-s08-nb", "data-s08": "nb-" + side, "data-cb-id": "nb-" + side, "aria-label": T.nbLabel(api.nmCap(n)), onclick: function () { tapNeighbor(side); } },
        [st.face, h("span", { "class": "cb-s08-nb__plate" }, [h("b", { text: api.nmCap(n) })])]);
      st.who = h("div", { "class": "cb-s08-who", "data-side": side }, [st.btn]);
      return st.who;
    }
    function heardWhy(side) {
      var st = seats[side];
      if (st.badge) return;
      st.badge = h("span", { "class": "cb-badge" }, [api.ico("check")]); st.face.appendChild(st.badge);
      st.who.appendChild(h("span", { "class": "cb-s08-heard" }, [api.ico("check"), h("span", { text: T.heard })]));
    }
    function react(side, ok) {                 // the face shows how the last idea landed: a thumbs-up or a calm thinking face
      var st = seats[side], el = h("span", { "class": "cb-s08-react is-new", "data-ok": ok ? "1" : "0", "aria-hidden": "true" }, [icon(ok ? "thumbs" : "think")]);
      if (st.react) st.face.replaceChild(el, st.react); else st.face.appendChild(el);
      st.react = el;
    }
    function bubbleEl(side, fresh) {
      var n = NBS[side];
      if (!S.open[side]) {
        return h("div", { "class": "cb-s08-bubble", "data-side": side, "data-state": "closed", onclick: function () { tapNeighbor(side); } },
          [h("span", { "class": "cb-s08-bubble__wait", "aria-hidden": "true" }, [api.ico("chat")])]);
      }
      var kids = [h("p", { "class": "cb-s08-bubble__who" }, [face(n, "cb-s08-mini"), h("b", { text: api.nmCap(n) })]),
        h("div", { "class": "cb-s08-line" + (fresh === "want" ? " is-new" : "") }, [h("span", { "class": "cb-s08-k", text: T.want }), h("p", { "class": "cb-s08-said", text: wantOf(side) })])];
      if (S.why[side]) {
        kids.push(h("div", { "class": "cb-s08-line cb-s08-line--why" + (fresh === "why" ? " is-new" : "") }, [h("span", { "class": "cb-s08-k", text: T.whyK }),
          h("p", { "class": "cb-s08-said", tabindex: "-1", "data-s08": "why-" + side, "data-cb-id": "why-" + side, text: cap(whyOf(side)) })]));   // the spec's why, capital first letter, nothing added
      } else {
        var ask = api.btn(T.ask, "cb-btn--primary cb-s08-ask", function () { askWhy(side); }, "chat");
        ask.setAttribute("aria-label", T.askLabel(aNm(n))); ask.setAttribute("data-s08", "ask-" + side); ask.setAttribute("data-cb-id", "ask-" + side);
        kids.push(ask);
      }
      if (S.last) {
        var ok = S.last[side];
        kids.push(h("div", { "class": "cb-s08-reply" + (fresh === "reply" ? " is-new" : ""), "data-ok": ok ? "1" : "0" }, [icon(ok ? "thumbs" : "think"), h("p", { text: S.last.text[side] })]));
      }
      return h("div", { "class": "cb-s08-bubble", "data-side": side, "data-state": "open" }, kids);
    }
    function redrawBubble(side, fresh) { seats[side].bubble = swap(seats[side].bubble, bubbleEl(side, fresh)); }

    function tapNeighbor(side) {
      var n = NBS[side];
      if (S.open[side]) { api.say(api.nmCap(n) + ": " + wantOf(side) + (S.why[side] ? " " + cap(whyOf(side)) + "." : "")); return; }
      S.open[side] = true;
      seats[side].btn.classList.add("is-open");
      redrawBubble(side, "want");
      api.say(api.nmCap(n) + ": " + wantOf(side));
    }
    function askWhy(side) {
      var n = NBS[side];
      S.why[side] = true;
      heardWhy(side); redrawBubble(side, "why");
      var p = board.querySelector('[data-s08="why-' + side + '"]'); if (p) p.focus({ preventScroll: true });
      var msg = api.nmCap(n) + ": " + cap(whyOf(side)) + ". " + T.heard;
      /* listening is done only when both neighbors have said why; then step 2 and the idea cards open */
      if (S.step === 1 && S.why.A && S.why.B) { toStep2(); msg += " " + T.step2 + ". " + T.coach2; }
      api.say(msg);
    }
    function toStep2() {
      S.step = 2; board.setAttribute("data-step", "2");
      hudEl = swap(hudEl, api.stopHud(stop, STEPS, 1, T.step2));
      coachEl = swap(coachEl, api.coach(T.coach2, "bulb"));
      drawIdeas(); drawTray(); drawActions();
    }

    /* the six idea cards: drawn once; a tried card changes in place, a card that works moves to the tray */
    var cardEls = {};
    function drawIdeas() {
      var list = h("ul", { "class": "cb-s08-cards" }, round.cards.map(function (c) {
        var b = h("button", { type: "button", "class": "cb-s08-card", "data-s08": "card-" + c.i, "aria-label": T.tryLabel(c.text), onclick: function (e) { tryCard(c, e.detail === 0); } }, [
          h("span", { "class": "cb-s08-card__text", text: c.text }),
          h("span", { "class": "cb-s08-card__go", "aria-hidden": "true" }, [h("span", { text: T.tryIt }), api.ico("go")])]);
        var li = h("li", null, [b]);
        cardEls[c.i] = { li: li, btn: b };
        return li;
      }));
      ideasEl = swap(ideasEl, h("section", { "class": "cb-s08-ideas" }, [list]));
    }
    function settle(b) { b.setAttribute("aria-disabled", "true"); b.removeAttribute("aria-label"); var go = b.querySelector(".cb-s08-card__go"); if (go) b.removeChild(go); }
    function markTried(c, ok) {
      var b = cardEls[c.i].btn;
      settle(b); b.classList.add("is-tried");
      var hardFor = ["A", "B"].filter(function (s) { return !ok[s]; });
      b.appendChild(h("span", { "class": "cb-s08-card__meta" }, [h("span", { "class": "cb-s08-tried", text: T.tried })].concat(hardFor.map(function (s) {
        return h("span", { "class": "cb-s08-hardfor" }, [face(NBS[s], "cb-s08-mini"), h("span", { text: T.hardFor(api.nm(NBS[s])) })]);
      }))));
      b.appendChild(h("span", { "class": "cb-s08-card__ans" }, ["A", "B"].map(function (s) {        // shown on narrow stages, where the bubbles are out of sight
        return h("span", { "class": "cb-s08-card__a", "data-ok": ok[s] ? "1" : "0" }, [icon(ok[s] ? "thumbs" : "think"), h("span", { text: api.nmCap(NBS[s]) + ": " + answer(c, s) })]);
      })));
    }
    /* the tray: the ways that work for both */
    function drawTray(fresh) {
      var n = S.found.length;
      var slots = h("ol", { "class": "cb-s08-slots" }, [0, 1].map(function (k) {
        var c = n > k ? round.cards.filter(function (x) { return x.i === S.found[k]; })[0] : null;
        if (!c) return h("li", { "class": "cb-s08-slot", "aria-hidden": "true" }, [h("span", { "class": "cb-s08-duo is-faint" }, [icon("thumbs"), icon("thumbs")])]);
        return h("li", { "class": "cb-s08-slot is-on" + (fresh && k === n - 1 ? " is-new" : "") }, [h("span", { "class": "cb-s08-duo", "aria-hidden": "true" }, [icon("thumbs"), icon("thumbs")]),
          h("span", { "class": "cb-s08-slot__body" }, [h("span", { "class": "cb-s08-slot__text", text: c.text }), h("b", { "class": "cb-s08-slot__ok", text: T.works })])]);
      }));
      trayEl = swap(trayEl, h("section", { "class": "cb-s08-tray", "aria-labelledby": "cb-s08-tray-h" }, [
        h("p", { "class": "cb-s08-tray__h", id: "cb-s08-tray-h" }, [h("span", { "class": "cb-s08-tray__ic", "aria-hidden": "true" }, [icon("thumbs")]), h("span", { text: T.tray(n) })]), slots]));
    }
    function drawActions() {
      var done = S.found.length >= 2;
      if (!S.msg && !done) { actionsEl = swap(actionsEl, h("div", { "class": "cb-s08-slot-actions", hidden: true })); return; }
      var see = done ? api.btn(T.see, "cb-btn--go cb-btn--big cb-s08-big", function () { calm(); aha(); }, "go", true) : null;
      if (see) see.setAttribute("data-s08", "see");
      actionsEl = swap(actionsEl, h("div", { "class": "cb-actions cb-s08-actions" }, [h("div", { "class": "cb-actions__info" }, [api.fb(done ? T.end : S.msg, true)]), see]));
    }

    function tryCard(c, kb) {
      if (S.tried[c.i] || S.found.indexOf(c.i) !== -1 || S.found.length >= 2) return;
      if (!S.firstTry) S.firstTry = { A: S.why.A, B: S.why.B };
      var ok = { A: fits(c, "A"), B: fits(c, "B") }, works = ok.A && ok.B;
      S.tries.push({ i: c.i, works: works });
      S.last = { A: ok.A, B: ok.B, text: { A: answer(c, "A"), B: answer(c, "B") } };
      ["A", "B"].forEach(function (s) { react(s, ok[s]); redrawBubble(s, "reply"); });
      var words = api.nmCap(NBS.A) + ": " + S.last.text.A + " " + api.nmCap(NBS.B) + ": " + S.last.text.B;
      if (!works) {
        S.tried[c.i] = ok; S.msg = null;
        markTried(c, ok); drawActions();
        api.say(words);
        return;
      }
      S.found.push(c.i);
      var done = S.found.length >= 2;
      S.msg = done ? null : T.foundOne;
      var open = function (x) { return !S.tried[x.i] && S.found.indexOf(x.i) === -1; }, at = round.cards.indexOf(c);
      var next = round.cards.slice(at + 1).filter(open)[0] || round.cards.slice(0, at).filter(open)[0];
      var li = cardEls[c.i].li, had = kb || li.contains(document.activeElement);   // the card leaves the grid: its focus must not fall to the page
      li.parentNode.removeChild(li);
      calm(400);                                 // the grid closes up under the pointer: a quick second tap must not try the next card
      drawTray(true); drawActions();
      var leafTop = null;
      if (done) {
        round.cards.filter(open).forEach(function (x) { settle(cardEls[x.i].btn); cardEls[x.i].btn.classList.add("is-rest"); });
        if (coachEl.parentNode) coachEl.parentNode.removeChild(coachEl);
        /* bring the end of the board into view, so the action bar rests under the tray instead of floating over the two ideas */
        var br = board.getBoundingClientRect(), vh = window.innerHeight || document.documentElement.clientHeight;
        if (br.bottom > vh + 2 && board.scrollIntoView) { board.scrollIntoView({ block: "end", behavior: api.REDUCED ? "auto" : "smooth" }); leafTop = Math.max(0, br.height - vh); }
        if (had) { var see = board.querySelector('[data-s08="see"]'); if (see) see.focus({ preventScroll: true }); }
      } else if (had && next) cardEls[next.i].btn.focus({ preventScroll: true });
      leaves(leafTop);
      api.say(words + " " + T.works + " " + T.tray(S.found.length) + ". " + (done ? T.end : T.foundOne));
    }

    /* success: a few pecan leaves drift down over the part of the board the player can see */
    function leaves(atTop) {
      if (api.REDUCED) return;
      var rect = board.getBoundingClientRect(), top = atTop !== null && atTop !== undefined ? atTop : Math.max(0, -rect.top), layer = h("div", { "class": "cb-s08-leaves", "aria-hidden": "true" });
      for (var i = 0; i < 8; i++) {
        var lf = h("span", { "class": "cb-s08-leaf" }, [icon("leaf")]);
        lf.style.setProperty("--s", (30 + (api.rng ? api.rng() : Math.random()) * 18).toFixed(0) + "px");
        lf.style.setProperty("--x", (4 + i * 11.5 + (api.rng ? api.rng() : Math.random()) * 6).toFixed(1) + "%");
        lf.style.setProperty("--y", (top + (api.rng ? api.rng() : Math.random()) * 60).toFixed(0) + "px");
        lf.style.setProperty("--dx", (((api.rng ? api.rng() : Math.random()) - 0.5) * 120).toFixed(0) + "px");
        lf.style.setProperty("--rot", (((api.rng ? api.rng() : Math.random()) - 0.5) * 540).toFixed(0) + "deg");
        lf.style.setProperty("--delay", (i * 0.12).toFixed(2) + "s");
        lf.style.setProperty("--c", ["var(--cb-c3)", "var(--cb-c2)", "var(--cb-stage-2)"][i % 3]);
        layer.appendChild(lf);
      }
      board.appendChild(layer);
      setTimeout(function () { if (layer.parentNode) layer.parentNode.removeChild(layer); }, 3400);
    }

    /* ── 3 · the aha card, then the score card ───────────────────────── */
    function aha() {
      phase = "aha";
      var duo = ["A", "B"].map(function (side) {
        var n = NBS[side];
        return h("span", { "class": "cb-s08-guest", "data-side": side, "aria-hidden": "true" }, [h("span", { "class": "cb-s08-guest__face" }, [api.img(n.img, ""),
          h("span", { "class": "cb-s08-react", "data-ok": "1" }, [icon("thumbs")])]), h("b", { text: api.nmCap(n) })]);
      });
      var next = api.btn(W.next, "cb-btn--go cb-btn--big cb-s08-big", function () { calm(); finish(); }, "go", true);
      api.screen([api.stopHud(stop, STEPS, 2), h("div", { "class": "cb-board cb-s08" }, [
        h("div", { "class": "cb-s08-stage cb-s08-stage--aha" }, [scene("cb-s08-scene--wide", duo),
          h("div", { "class": "cb-s08-say" }, [h("p", { "class": "cb-s08-duo cb-s08-duo--big", "aria-hidden": "true" }, [icon("thumbs"), icon("thumbs")]),
            h("p", { "class": "cb-s08-say__text", tabindex: "-1", "data-s08": "aha", text: T.aha }), h("div", { "class": "cb-row" }, [next])])])])], '[data-s08="aha"]');
      api.frame();
      api.say(T.aha);
    }
    function finish() {
      phase = "result";
      var heard = S.firstTry || { A: false, B: false };
      var careful = 15;
      S.tries.forEach(function (t, k) { if (k >= 3 && !t.works) careful -= 5; });     // the first 3 tries are free
      careful = Math.max(0, careful);
      var score = (heard.A ? 15 : 0) + (heard.B ? 15 : 0) + (S.found.length >= 1 ? 35 : 0) + (S.found.length >= 2 ? 20 : 0) + careful;
      var tip = !heard.A && !heard.B ? T.tipNone : !heard.A ? T.tipOne(aNm(NBS.A)) : !heard.B ? T.tipOne(aNm(NBS.B)) : careful < 15 ? T.tipCareful : T.tip100;
      var sides = {}, old = r.sides || {};
      for (var k in old) sides[k] = old[k];
      sides[NBS.A.id] = "A"; sides[NBS.B.id] = "B";
      var info = api.saveRound(stop.id, score, { lastRound: d.id + "-" + round.v, lastTopic: d.id, lastPair: [NBS.A.id, NBS.B.id], sides: sides });
      api.endPlay();
      var ask = h("div", { "class": "cb-tipcard cb-tipcard--real cb-s08-askgrown" }, [api.ico("chat"), h("div", null, [h("strong", { text: T.askGrown }), h("p", { text: T.askGrownText })])]);
      var card = api.scoreCard(stop, score, info, tip, T.takeaway, T.real, ask);
      var gu = api.btn(T.gu, "cb-btn--quiet", function () { api.dialog(T.gu, [h("div", { "class": "cb-dlg__body" }, [h("p", { text: T.guText })])], gu); }, "family");
      api.finishRound(stop.id, card, api.cardButtons(stop.id, api.restart(stop.id), gu));
      api.say(W.score + " " + score + " / 100");
    }

    if (api.setController) api.setController({
      snapshot: function () { return {v:2,phase:phase,topic:d.id,variant:round.v,neighbors:{A:NBS.A.id,B:NBS.B.id},cards:round.cards.map(function(card){return card.i;}),step:S.step,open:{A:S.open.A,B:S.open.B},why:{A:S.why.A,B:S.why.B},firstTry:S.firstTry,tries:S.tries.map(function(item){return {i:item.i,works:item.works};}),found:S.found.slice(),tried:S.tried}; },
      restore: function (saved) {
        if(!saved || saved.v !== 2 || !Array.isArray(saved.cards)) return false;
        d=D.filter(function(item){return item.id === saved.topic;})[0];round.d=d;round.v=saved.variant;
        NBS={A:api.nbById(saved.neighbors.A),B:api.nbById(saved.neighbors.B)};round.nb=NBS;
        round.cards=saved.cards.map(function(i){var c=d.cards[i];return {i:i,tags:c[0],text:L === "es" ? c[2] : c[1]};});
        S={step:saved.step,open:saved.open,why:saved.why,firstTry:saved.firstTry,tries:saved.tries,found:saved.found.slice(),tried:saved.tried,last:null,msg:saved.found.length === 1 ? T.foundOne : null};
        var last=S.tries.length ? round.cards.filter(function(c){return c.i === S.tries[S.tries.length-1].i;})[0] : null;
        if(last) S.last={A:fits(last,"A"),B:fits(last,"B"),text:{A:answer(last,"A"),B:answer(last,"B")}};
        if(saved.phase === "result") finish(); else if(saved.phase === "aha") aha(); else if(saved.phase === "play") {
          play();
          ["A","B"].forEach(function(side){seats[side].btn.classList.toggle("is-open",S.open[side]);if(S.why[side])heardWhy(side);if(S.last)react(side,S.last[side]);});
          if(saved.step === 2) {
            toStep2();
            round.cards.forEach(function(c){if(S.tried[c.i])markTried(c,S.tried[c.i]);if(S.found.indexOf(c.i)!==-1)cardEls[c.i].li.remove();});
            if(S.found.length>=2){round.cards.forEach(function(c){if(!S.tried[c.i] && S.found.indexOf(c.i)===-1){settle(cardEls[c.i].btn);cardEls[c.i].btn.classList.add("is-rest");}});coachEl.remove();}
          }
        } else intro();
        return true;
      }
    });
    intro();
  }

  CB.register({ id: ID, steps: [null, null], css: "08-disagree-kindly.css", run: run });

    return definition;
  }
  if (host.defineStop) host.defineStop(factory);
  else host.register(factory({ document: document, window: window, Date: Date, setTimeout: setTimeout, clearTimeout: clearTimeout, requestAnimationFrame: requestAnimationFrame, cancelAnimationFrame: typeof cancelAnimationFrame === "function" ? cancelAnimationFrame : function () {} }));
})();
