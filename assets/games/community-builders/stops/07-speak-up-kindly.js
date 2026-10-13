/* Community Builders of Pecan Grove · Stop 7 · Speak Up Kindly / Habla con respeto
   A postcard builder with no typing: "I noticed…", "I wonder…", "One idea…", then the helper who decides the idea.
   Points reward the process only (three parts, one topic, finding who decides). No topic, tile or helper is worth more
   than another, and speed is never scored. Nothing is sent anywhere. Every string is exact from "07 - speak-up-kindly.md". */
(function () {
  "use strict";
  var host = window.CommunityBuilders; if (!host) return;
  function factory(lifecycle) {
    var document = lifecycle.document, window = lifecycle.window, Date = lifecycle.Date;
    var setTimeout = lifecycle.setTimeout, clearTimeout = lifecycle.clearTimeout;
    var requestAnimationFrame = lifecycle.requestAnimationFrame, cancelAnimationFrame = lifecycle.cancelAnimationFrame;
    var definition = null, CB = { register: function (value) { definition = value; } };

  "use strict";

  var ES = (document.documentElement.lang || "en").slice(0, 2) === "es";
  function tx(p) { return ES ? p[1] : p[0]; }
  var ID = "speak-up-kindly", ROWS = ["n", "w", "i"], TOPICS = ["water", "trucks", "jobs", "history", "lights"];
  var HOME = [0.22, 0.27, 0.6, 0.65];        // painted crop: a home on the left, the clock-tower building through the trees
  var SVGNS = "http://www.w3.org/2000/svg", uid = 0;
  /* the last round drawn on this page, finished or not, so quitting and coming back is also a new round (memory only, never saved) */
  var SEEN = { spark: null, tiles: [] };
  /* a double tap on a button that changes the screen must not also tap whatever the new screen puts under the finger
     (a tile under "Start", a helper under "My card is ready", a score-card button under "See my score") */
  var shownAt = 0;
  function settle() { shownAt = Date.now(); }
  document.addEventListener("click", function (e) {
    if (e.detail > 1 && Date.now() - shownAt < 600 && e.target && e.target.closest && e.target.closest(".cb")) { e.preventDefault(); e.stopPropagation(); }
  }, true);

  /* ── words ─────────────────────────────────────────────────────────── */
  var T = window.CBLocale.read("stop-07", (ES ? "es" : "en"), {en:{"T.step":function (n) { return window.CBLocale.part("stop-07", "en", "T.step", 0) + n + window.CBLocale.part("stop-07", "en", "T.step", 1); },"T.topicIs":function (t) { return window.CBLocale.part("stop-07", "en", "T.topicIs", 0) + t; },"T.cardFor":function (n) { return window.CBLocale.part("stop-07", "en", "T.cardFor", 0) + n; },"T.to":function (n) { return window.CBLocale.part("stop-07", "en", "T.to", 0) + n; },"T.parts":function (n) { return window.CBLocale.part("stop-07", "en", "T.parts", 0) + n + window.CBLocale.part("stop-07", "en", "T.parts", 1); },"T.topics":function (n) { return window.CBLocale.part("stop-07", "en", "T.topics", 0) + n + window.CBLocale.part("stop-07", "en", "T.topics", 1); }},es:{"T.step":function (n) { return window.CBLocale.part("stop-07", "es", "T.step", 0) + n + window.CBLocale.part("stop-07", "es", "T.step", 1); },"T.topicIs":function (t) { return window.CBLocale.part("stop-07", "es", "T.topicIs", 0) + t; },"T.cardFor":function (n) { return window.CBLocale.part("stop-07", "es", "T.cardFor", 0) + n; },"T.to":function (n) { return window.CBLocale.part("stop-07", "es", "T.to", 0) + n; },"T.parts":function (n) { return window.CBLocale.part("stop-07", "es", "T.parts", 0) + n + window.CBLocale.part("stop-07", "es", "T.parts", 1); },"T.topics":function (n) { return window.CBLocale.part("stop-07", "es", "T.topics", 0) + n + window.CBLocale.part("stop-07", "es", "T.topics", 1); }}}).T;

  var TOPIC_NAME = { water: window.CBLocale.pair("stop-07","bank.b0001"), trucks: window.CBLocale.pair("stop-07","bank.b0002"), jobs: window.CBLocale.pair("stop-07","bank.b0003"), history: window.CBLocale.pair("stop-07","bank.b0004"), lights: window.CBLocale.pair("stop-07","bank.b0005") };

  /* one spark per neighbor; the [topic] is for code only */
  var SPARKS = [
    { nb: "johnson", topic: "water", line: window.CBLocale.pair("stop-07","bank.b0006") },
    { nb: "patel", topic: "trucks", line: window.CBLocale.pair("stop-07","bank.b0007") },
    { nb: "ana", topic: "jobs", line: window.CBLocale.pair("stop-07","bank.b0008") },
    { nb: "jayden", topic: "jobs", line: window.CBLocale.pair("stop-07","bank.b0009") },
    { nb: "ruth", topic: "history", line: window.CBLocale.pair("stop-07","bank.b0010") },
    { nb: "lee", topic: "lights", line: window.CBLocale.pair("stop-07","bank.b0011") }
  ];

  /* 45 tiles: row (n = I noticed, w = I wonder, i = One idea) → topic → 3 wordings [en, es] */
  var TILES = {
    n: {
      water: [window.CBLocale.pair("stop-07","bank.b0012"), window.CBLocale.pair("stop-07","bank.b0013"), window.CBLocale.pair("stop-07","bank.b0014")],
      trucks: [window.CBLocale.pair("stop-07","bank.b0015"), window.CBLocale.pair("stop-07","bank.b0016"), window.CBLocale.pair("stop-07","bank.b0017")],
      jobs: [window.CBLocale.pair("stop-07","bank.b0018"), window.CBLocale.pair("stop-07","bank.b0019"), window.CBLocale.pair("stop-07","bank.b0020")],
      history: [window.CBLocale.pair("stop-07","bank.b0021"), window.CBLocale.pair("stop-07","bank.b0022"), window.CBLocale.pair("stop-07","bank.b0023")],
      lights: [window.CBLocale.pair("stop-07","bank.b0024"), window.CBLocale.pair("stop-07","bank.b0025"), window.CBLocale.pair("stop-07","bank.b0026")]
    },
    w: {
      water: [window.CBLocale.pair("stop-07","bank.b0027"), window.CBLocale.pair("stop-07","bank.b0028"), window.CBLocale.pair("stop-07","bank.b0029")],
      trucks: [window.CBLocale.pair("stop-07","bank.b0030"), window.CBLocale.pair("stop-07","bank.b0031"), window.CBLocale.pair("stop-07","bank.b0032")],
      jobs: [window.CBLocale.pair("stop-07","bank.b0033"), window.CBLocale.pair("stop-07","bank.b0034"), window.CBLocale.pair("stop-07","bank.b0035")],
      history: [window.CBLocale.pair("stop-07","bank.b0036"), window.CBLocale.pair("stop-07","bank.b0037"), window.CBLocale.pair("stop-07","bank.b0038")],
      lights: [window.CBLocale.pair("stop-07","bank.b0039"), window.CBLocale.pair("stop-07","bank.b0040"), window.CBLocale.pair("stop-07","bank.b0041")]
    },
    i: {
      water: [window.CBLocale.pair("stop-07","bank.b0042"), window.CBLocale.pair("stop-07","bank.b0043"), window.CBLocale.pair("stop-07","bank.b0044")],
      trucks: [window.CBLocale.pair("stop-07","bank.b0045"), window.CBLocale.pair("stop-07","bank.b0046"), window.CBLocale.pair("stop-07","bank.b0047")],
      jobs: [window.CBLocale.pair("stop-07","bank.b0048"), window.CBLocale.pair("stop-07","bank.b0049"), window.CBLocale.pair("stop-07","bank.b0050")],
      history: [window.CBLocale.pair("stop-07","bank.b0051"), window.CBLocale.pair("stop-07","bank.b0052"), window.CBLocale.pair("stop-07","bank.b0053")],
      lights: [window.CBLocale.pair("stop-07","bank.b0054"), window.CBLocale.pair("stop-07","bank.b0055"), window.CBLocale.pair("stop-07","bank.b0056")]
    }
  };

  /* the six helpers who decide (Stop 6); the [id] is for code only */
  var HELPERS = {
    council: { name: window.CBLocale.pair("stop-07","bank.b0057"), line: window.CBLocale.pair("stop-07","bank.b0058") },
    planning: { name: window.CBLocale.pair("stop-07","bank.b0059"), line: window.CBLocale.pair("stop-07","bank.b0060") },
    development: { name: window.CBLocale.pair("stop-07","bank.b0061"), line: window.CBLocale.pair("stop-07","bank.b0062") },
    regional: { name: window.CBLocale.pair("stop-07","bank.b0063"), line: window.CBLocale.pair("stop-07","bank.b0064") },
    power: { name: window.CBLocale.pair("stop-07","bank.b0065"), line: window.CBLocale.pair("stop-07","bank.b0066") },
    environment: { name: window.CBLocale.pair("stop-07","bank.b0067"), line: window.CBLocale.pair("stop-07","bank.b0068") }
  };
  var HELPER_IDS = ["council", "planning", "development", "regional", "power", "environment"];
  var HJOB = {
    council: window.CBLocale.pair("stop-07","bank.b0069"), planning: window.CBLocale.pair("stop-07","bank.b0070"),
    development: window.CBLocale.pair("stop-07","bank.b0071"), regional: window.CBLocale.pair("stop-07","bank.b0072"),
    power: window.CBLocale.pair("stop-07","bank.b0073"), environment: window.CBLocale.pair("stop-07","bank.b0074")
  };
  var DECIDES = { water: "environment", jobs: "development", trucks: "council", history: "council", lights: "council" };

  /* line icons on the shell's 24-unit grid, one 2px round stroke (no glyphs, no words).
     The six helper desks are the same drawings as Stop 6 (06-who-decides.js), so a child sees the same desks in both stops. */
  var ICONS = {
    water: '<path d="M12 3.6c3.1 3.7 5.6 7 5.6 10.1a5.6 5.6 0 0 1-11.2 0C6.4 10.6 8.9 7.3 12 3.6z"/><path d="M9.4 14.4a2.7 2.7 0 0 0 2.2 2.5"/>',
    trucks: '<path d="M3 15.5V7.5a1 1 0 0 1 1-1h10v9"/><path d="M14 9.5h3.7l2.8 3.3v2.7H3"/><circle cx="7.5" cy="17.5" r="2"/><circle cx="16.5" cy="17.5" r="2"/>',
    jobs: '<path d="M4 14.5a8 8 0 0 1 16 0"/><path d="M10 6.9v4.6M14 6.9v4.6"/><path d="M2.5 14.5h19v2a1.5 1.5 0 0 1-1.5 1.5H4a1.5 1.5 0 0 1-1.5-1.5z"/>',
    history: '<path d="M4 20.5h16"/><path d="M6 20.5V12l6-4.5 6 4.5v8.5"/><path d="M10.6 8.6 12 3.5l1.4 5.1"/><path d="M10 20.5v-2.7a2 2 0 0 1 4 0v2.7"/><circle cx="12" cy="12.8" r="1.2"/>',
    lights: '<path d="M20 13.2A8 8 0 1 1 10.8 4a6.2 6.2 0 0 0 9.2 9.2z"/>',
    council: '<path d="M3.5 9.5 12 4.5l8.5 5z"/><path d="M6.5 12v5.5M10 12v5.5M14 12v5.5M17.5 12v5.5"/><path d="M4 20.5h16"/>',
    planning: '<rect x="3.5" y="4" width="4" height="13" rx="2"/><path d="M5.5 17v2.5h15V6.5H7.5"/><path d="M11 10h6v6h-6zM14 10v3M11 13h1.5"/>',
    development: '<path d="M8 3.5h8M9 3.5V6c-2.5 1-3.5 3-3.5 5.5v6A2.5 2.5 0 0 0 8 20h8a2.5 2.5 0 0 0 2.5-2.5v-6c0-2.5-1-4.5-3.5-5.5V3.5"/><circle cx="12" cy="14.5" r="2.6"/>',
    regional: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.3 15.3 5.2 5.2"/><path d="M8 13v-2.3l2.5-2 2.5 2V13"/>',
    power: '<path d="M13 3 5.5 13.5H11L10 21l8-11.5h-5.5z"/>',
    environment: '<path d="M5 19.5C5 11 10.5 5 19.5 4.5 19.5 13.5 14 19.5 5 19.5z"/><path d="M5 19.5c3.5-5 7-8 10.5-10"/>',
    printer: '<path d="M7 9V4.5h10V9"/><rect x="3.5" y="9" width="17" height="7.5" rx="2"/><path d="M7.5 13.5h9v6.5h-9z"/>'
  };
  function icon(name, cls) {
    var s = document.createElementNS(SVGNS, "svg");
    s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true"); s.setAttribute("focusable", "false");
    s.setAttribute("class", "cb-ico" + (cls ? " " + cls : ""));
    host.setAuthoredMarkup(s, ICONS[name]);                                   // constant, authored markup only
    return s;
  }

  CB.register({ id: ID, steps: [null, null], css: "07-speak-up-kindly.css", run: run });

  /* ── one round ─────────────────────────────────────────────────────── */
  function run(api, stop) {
    var h = api.h, STEPS = [null, null];
    document.title = T.title;
    var round = newRound(api, stop);
    var pick = { n: null, w: null, i: null };            // the tile chosen in each row
    var partsAtReady = 0, taps = 0, tried = {}, helperPts = 0, firstRight = false, done = false, phase = "intro", helperFeedback = null, resolved = null, renderUID = 0;

    function helperName(id) { return tx(HELPERS[id].name); }
    function helperLine(id) { return tx(HELPERS[id].line); }
    function filled() { return ROWS.filter(function (r) { return pick[r]; }); }
    function topicsUsed() { var o = {}; filled().forEach(function (r) { o[pick[r].topic] = 1; }); return Object.keys(o); }
    function decider() { var t = pick.i || pick.w || pick.n; return t ? DECIDES[t.topic] : null; }
    function lineText(t) { return T.stem[t.row] + " " + t.text; }
    function board(kids, cls) { return h("div", { "class": "cb-board cb-s07" + (cls ? " " + cls : "") }, kids); }

    /* the postcard: real text, each part with its topic icon; the build face, then the finished face */
    function face(kind, opt) {
      opt = opt || {};
      var kids = [kind === "done" ? h("span", { "class": "cb-s07-stamp is-on", "aria-hidden": "true" }, [api.ico("check")])
        : h("span", { "class": "cb-s07-stamp", "aria-hidden": "true" })];
      if (kind === "done") kids.push(h("p", { "class": "cb-s07-to", id: opt.toId || null }, [h("span", { "class": "cb-s07-to__ic" }, [icon(opt.helper)]), h("span", { text: T.to(helperName(opt.helper)) })]));
      kids.push(h("p", { "class": "cb-s07-hello", text: T.hello }));
      ROWS.forEach(function (r) {
        var t = pick[r];
        if (!t) {                                   // an empty part leaves no words; while building, a blank slot shows what is left
          if (kind === "build") kids.push(h("span", { "class": "cb-s07-line is-empty", "data-s07row": r, "aria-hidden": "true" }));
          return;
        }
        kids.push(h("p", { "class": "cb-s07-line" + (opt.anim === r ? " is-new" : ""), "data-s07row": r }, [
          h("span", { "class": "cb-s07-line__ic" }, [icon(t.topic)]), h("span", { "class": "cb-s07-line__t" }, [h("b", { text: T.stem[r] }), " " + t.text])]));
      });
      kids.push(h("p", { "class": "cb-s07-thanks", text: T.thanks }));
      kids.push(h("p", { "class": "cb-s07-from", text: T.from }));
      return h("div", { "class": "cb-s07-face cb-s07-face--" + kind, "aria-hidden": opt.hidden ? "true" : null }, kids);
    }
    function postcard() { return h("div", { "class": "cb-s07-card" }, [face("build")]); }
    function finishedCard(helper, flip, mini) {
      var toId = "cb-s07-to-" + (++uid);
      var inner = flip && !mini
        ? h("div", { "class": "cb-s07-flip" }, [face("build", { hidden: true }), face("done", { helper: helper, toId: toId })])
        : face("done", { helper: helper, toId: toId });
      return h("div", { "class": "cb-s07-card is-done" + (flip && !mini ? " is-flip" : "") + (mini ? " cb-s07-card--mini" : ""),
        role: "group", "aria-labelledby": toId, tabindex: mini ? null : "-1" }, [inner]);
    }

    /* ── intro: the kitchen table at your home ─────────────────────── */
    function intro() {
      phase = "intro";
      var scene = api.crop(HOME, "cb-s07-scene", [h("span", { "class": "cb-s07-plate", "aria-hidden": "true" }, [api.ico("home"), h("span", { text: T.home })])]);
      var parts = h("ul", { "class": "cb-s07-legend" }, ROWS.map(function (r) {
        return h("li", { "data-s07row": r }, [h("i", { "aria-hidden": "true" }), h("span", { text: T.rows[r] })]);
      }));
      api.screen([api.stopHud(stop, null), board([h("div", { "class": "cb-s07-intro" }, [
        h("figure", { "class": "cb-s07-intro__art" }, [scene, h("figcaption", { "class": "cb-vh", text: T.home })]),
        h("div", { "class": "cb-s07-intro__copy" }, [h("p", { "class": "cb-s07-intro__lead", text: T.intro }), parts,
          h("div", { "class": "cb-row" }, [api.btn(T.start, "cb-btn--go cb-btn--big", build, "go", true)])])])])]);
      api.frame(); settle();
    }

    /* ── step 1: build the card ─────────────────────────────────────── */
    function build() {
      phase = "build";
      renderUID = uid;
      var nb = api.nbById(round.spark.nb), buttons = {}, card = postcard();
      var scene = api.crop(HOME, "cb-s07-scene", [h("span", { "class": "cb-s07-plate", "aria-hidden": "true" }, [api.ico("home"), h("span", { text: T.home })])]);
      var spark = h("div", { "class": "cb-s07-spark", "data-nb": nb.id }, [scene, h("div", { "class": "cb-s07-talk" }, [
        h("figure", { "class": "cb-s07-say" }, [
          h("figcaption", { "class": "cb-s07-who" }, [api.img(nb.img, "", null, true), h("span", null, [h("b", { text: api.nmCap(nb) }), h("small", { text: nb.plain[api.L] })])]),
          h("blockquote", { "class": "cb-bubble" }, [h("p", { text: tx(round.spark.line) })])]),
        h("p", { "class": "cb-s07-lead", text: T.lead })])]);
      var rows = h("div", { "class": "cb-s07-rows" }, ROWS.map(function (r) {
        var hid = "cb-s07-row-" + r + "-" + (++uid);
        return h("div", { "class": "cb-s07-row", "data-s07row": r, role: "group", "aria-labelledby": hid }, [
          h("h3", { "class": "cb-s07-row__h", id: hid }, [h("i", { "aria-hidden": "true" }), h("span", { text: T.rows[r] })]),
          h("ul", { "class": "cb-s07-tiles" }, round.rows[r].map(function (t) {
            var b = h("button", { type: "button", "class": "cb-s07-tile", "data-tile": t.key, "data-topic": t.topic, "aria-pressed": "false",
              "aria-label": T.rows[r] + ", " + t.text + " " + T.topicIs(tx(TOPIC_NAME[t.topic])), onclick: function () { tap(t); } }, [
              h("span", { "class": "cb-s07-tile__ic" }, [icon(t.topic)]),
              h("span", { "class": "cb-s07-tile__body" }, [h("span", { "class": "cb-s07-tile__topic", "data-topic": t.topic, text: tx(TOPIC_NAME[t.topic]) }), h("span", { "class": "cb-s07-tile__t", text: t.text })]),
              h("span", { "class": "cb-s07-tile__ok", "aria-hidden": "true" }, [api.ico("check")])]);
            buttons[t.key] = b;
            return h("li", null, [b]);
          }))]);
      }));
      var dots = h("span", { "class": "cb-s07-dots", "aria-hidden": "true" }, ROWS.map(function (r) { return h("i", { "data-s07row": r }, [api.ico("check"), h("span", { text: T.rows[r] })]); }));
      var ready = api.btn(T.ready, "cb-btn--go cb-btn--big cb-s07-ready", function () {
        if (!filled().length || done) return;
        partsAtReady = filled().length;
        step2();
      }, "go", true);
      function sync(row) {
        ROWS.forEach(function (r) { round.rows[r].forEach(function (t) { buttons[t.key].setAttribute("aria-pressed", pick[r] && pick[r].key === t.key ? "true" : "false"); }); });
        card.replaceChild(face("build", { anim: row && pick[row] ? row : null }), card.firstChild);
        [].forEach.call(dots.children, function (d) { d.classList.toggle("is-on", !!pick[d.getAttribute("data-s07row")]); });
        if (filled().length) ready.removeAttribute("aria-disabled"); else ready.setAttribute("aria-disabled", "true");
      }
      function tap(t) {
        var cur = pick[t.row];
        pick[t.row] = cur && cur.key === t.key ? null : t;      // tap another to switch; tap the picked one again to unpick
        sync(t.row);
        if (pick[t.row]) api.say(lineText(t));
        if (pick.n && pick.w && pick.i && card.getBoundingClientRect().top > window.innerHeight * 0.6) {   // narrow stage: the card sits under all the tiles
          try { card.scrollIntoView({ block: "center", behavior: api.REDUCED ? "auto" : "smooth" }); } catch (e) { card.scrollIntoView(); }
        }
      }
      api.screen([api.stopHud(stop, STEPS, 0, T.step(1)), board([spark,
        h("p", { "class": "cb-coach" }, [api.ico("chat"), h("span", { text: T.tap })]),
        h("div", { "class": "cb-s07-desk" }, [h("div", { "class": "cb-s07-desk__main" }, [rows]), h("div", { "class": "cb-s07-desk__card" }, [card])]),
        h("div", { "class": "cb-actions cb-s07-bar" }, [h("div", { "class": "cb-actions__info" }, [dots]), ready])], "cb-s07--build")]);
      sync(null);
      api.frame(); settle();
    }

    /* ── step 2: who decides your idea? ─────────────────────────────── */
    function helperBtn(id, state, onTap) {
      var isTried = !!tried[id], isRight = state && state.right === id, locked = !!state;
      var b = h("button", { type: "button", "class": "cb-s07-helper" + (isTried ? " is-tried" : "") + (isRight ? " is-right" : ""), "data-h": id,
        "aria-label": T.cardFor(helperName(id)) + (isTried ? ", " + T.tried : ""), "aria-disabled": isTried || (locked && !state.final) ? "true" : null,
        disabled: state && state.final ? true : null, onclick: function () { if (!locked && !isTried) onTap(id); } }, [
        h("span", { "class": "cb-s07-helper__ic" }, [icon(id), isRight ? h("span", { "class": "cb-badge" }, [api.ico("check")]) : null]),
        h("span", { "class": "cb-s07-helper__n", text: helperName(id) }), h("span", { "class": "cb-s07-helper__job", text: tx(HJOB[id]) }),
        isTried ? h("span", { "class": "cb-s07-helper__tried", text: T.tried }) : null]);
      return h("li", null, [b]);
    }
    function step2(feedback, focusId, resolving, ok) {
      phase = resolving ? "resolving" : "who";
      helperFeedback = feedback && !resolving ? focusId : null;
      var card = postcard();
      var grid = h("ul", { "class": "cb-s07-helpers" }, round.helpers.map(function (id) { return helperBtn(id, resolving, onHelper); }));
      var b = board([h("div", { "class": "cb-s07-desk" }, [
        h("div", { "class": "cb-s07-desk__main" }, [h("p", { "class": "cb-coach cb-s07-q", tabindex: "-1" }, [api.ico("people"), h("span", { text: T.who })]), grid]),
        h("div", { "class": "cb-s07-desk__card" }, [card])]),
        feedback ? h("div", { "class": "cb-actions" }, [h("div", { "class": "cb-actions__info" }, [api.fb(feedback, !!ok)])]) : null], "cb-s07--who");
      api.screen([api.stopHud(stop, STEPS, 1, T.step(2)), b], focusId ? '[data-h="' + focusId + '"]' : ".cb-s07-q");
      if (!focusId) api.frame();
      settle();
      return b;
    }
    function onHelper(id) {
      if (done) return;
      taps++;
      var right = decider();
      if (id === right) {
        helperPts = taps === 1 ? 30 : 15; firstRight = taps === 1;
        var okText = T.right + " " + helperLine(id);
        api.say(T.liveRight + ". " + okText);
        resolve(true, okText, id);
      } else if (taps === 1) {
        tried[id] = 1;
        var fbText = T.not + " " + helperLine(id) + " " + T.another;
        step2(fbText, id);
        api.say(fbText);
      } else {
        tried[id] = 1; helperPts = 0;
        var hereText = T.here + " " + helperLine(right);
        api.say(T.liveNot + ". " + hereText);
        resolve(false, hereText, id);
      }
    }
    function resolve(ok, text, tappedId) {          // the right helper lights up in place with its answer, then the card turns over
      resolved = { ok:!!ok, tapped:tappedId };
      done = true;
      var right = decider();
      var b = step2(text, tappedId, { right: right }, ok);
      setTimeout(function () { if (b.isConnected) finished(ok, text, right); }, api.REDUCED ? 250 : 750);
    }

    /* ── the finished card ──────────────────────────────────────────── */
    function finished(ok, text, right) {
      phase = "finished";
      renderUID = uid;
      var card = finishedCard(right, true, false);
      function acts(where) {                        // Print and Show a grown-up: in the bar on wide screens, under the card on a phone
        var pb = api.btn(T.print, "cb-s07-printbtn", function () { printCard(card); });
        pb.insertBefore(icon("printer"), pb.firstChild);
        var sb = api.btn(T.show, "cb-s07-showbtn", function () { openGrownups(sb); }, "family");
        return h("div", { "class": "cb-row cb-s07-acts cb-s07-acts--" + where }, [pb, sb]);
      }
      var notes = [], nParts = filled().length, nTopics = topicsUsed().length;
      if (nParts < 3) notes.push(h("div", { "class": "cb-tipcard" }, [api.ico("bulb"), h("p", { text: T.parts(nParts) })]));
      if (nTopics > 1) notes.push(h("div", { "class": "cb-tipcard" }, [api.ico("bulb"), h("p", { text: T.topics(nTopics) })]));
      notes.push(h("div", { "class": "cb-tipcard cb-s07-aha" }, [api.ico("chat"), h("p", { text: T.aha })]));
      var grid = h("ul", { "class": "cb-s07-helpers" }, round.helpers.map(function (id) { return helperBtn(id, { right: right, final: true }); }));
      var see = api.btn(T.see, "cb-btn--go cb-btn--big", score, "go", true);
      // spec order under the card: the notes that fit, the aha, "Nothing was sent", then the buttons
      api.screen([api.stopHud(stop, STEPS, 2, T.step(2)), board([h("div", { "class": "cb-s07-fin" }, [
        api.fb(text, ok),
        h("div", { "class": "cb-s07-fin__card" }, [card]),
        grid,
        h("div", { "class": "cb-s07-fin__notes" }, notes),
        h("div", { "class": "cb-s07-fin__after" }, [h("p", { "class": "cb-s07-sent cb-s07-sent--card", text: T.sent }), acts("card")])]),
        h("div", { "class": "cb-actions cb-s07-bar" }, [h("div", { "class": "cb-actions__info" }, [h("p", { "class": "cb-s07-sent cb-s07-sent--bar" }, [api.ico("check"), h("span", { text: T.sent })])]),
          h("div", { "class": "cb-row cb-s07-bar__btns" }, [acts("bar"), see])])],
        "cb-s07--done")], ".cb-s07-card");
      api.frame(); settle();
    }
    function printCard(card) {                       // prints only the postcard: the stop's print sheet keys on this class
      card.classList.add("cb-s07-print");
      function clean() { card.classList.remove("cb-s07-print"); window.removeEventListener("afterprint", clean); }
      window.addEventListener("afterprint", clean);
      try { window.print(); } catch (e) { clean(); }
    }
    function openGrownups(opener) {
      api.dialog(T.guTitle, [h("div", { "class": "cb-dlg__body" }, [h("p", { text: T.guText })])], opener);
    }

    /* ── score: process only ────────────────────────────────────────── */
    function score() {
      phase = "result";
      renderUID = uid;
      var nTopics = topicsUsed().length, right = decider();
      var oneTopic = partsAtReady === 3 && nTopics === 1;
      var total = 15 * partsAtReady + (oneTopic ? 25 : 0) + helperPts;
      var tip = partsAtReady < 3 ? T.tipParts : nTopics > 1 ? T.tipTopic : !firstRight ? T.tipWho : T.tip100;
      var shown = [];
      ROWS.forEach(function (r) { round.rows[r].forEach(function (t) { shown.push(t.key); }); });
      var info = api.saveRound(stop.id, total, { lastSpark: round.spark.nb, lastTiles: shown });   // tile codes shown, never the card's words
      api.endPlay();
      var card = api.scoreCard(stop, total, info, tip, T.can, T.real);
      var can = card.querySelector(".cb-card__can");
      if (can) can.parentNode.insertBefore(finishedCard(right, false, true), can.nextSibling);
      if (tip === T.tipWho) {
        var p = card.querySelector(".cb-card__tip");
        if (p) {
          var box = h("div", { "class": "cb-s07-tipwho" });
          p.parentNode.replaceChild(box, p);
          box.appendChild(p);
          box.appendChild(h("p", { "class": "cb-s07-chip" }, [h("span", { "class": "cb-s07-chip__ic" }, [icon(right)]),
            h("span", null, [h("b", { text: helperName(right) }), h("span", { text: helperLine(right) })])]));
        }
      }
      var gu = api.btn(T.gu, "cb-btn--quiet", function () { openGrownups(gu); }, "family");
      api.finishRound(stop.id, card, api.cardButtons(stop.id, api.restart(stop.id), gu));
      settle();
      api.say(api.W.score + " " + total + " / 100");
    }

    if (api.setController) api.setController({
      snapshot: function () {
        var selections = {}, rows = {};
        ROWS.forEach(function(row){selections[row]=pick[row] && pick[row].key;rows[row]=round.rows[row].map(function(tile){return tile.key;});});
        return { v:2,phase:phase,spark:round.spark.nb,topics:round.topics.slice(),rows:rows,helpers:round.helpers.slice(),pick:selections,partsAtReady:partsAtReady,taps:taps,tried:Object.keys(tried),helperPts:helperPts,firstRight:firstRight,done:done,helperFeedback:helperFeedback,resolved:resolved,uid:uid,renderUID:renderUID };
      },
      restore: function (saved) {
        if(!saved || saved.v !== 2 || !saved.rows) return false;
        round.spark = SPARKS.filter(function(item){return item.nb === saved.spark;})[0]; round.topics=saved.topics.slice();round.helpers=saved.helpers.slice();
        ROWS.forEach(function(row){round.rows[row]=saved.rows[row].map(function(key){var parts=key.split("-");return {key:key,row:row,topic:parts[1],text:tx(TILES[row][parts[1]][+parts[2]])};});pick[row]=round.rows[row].filter(function(tile){return tile.key === saved.pick[row];})[0] || null;});
        partsAtReady=saved.partsAtReady;taps=saved.taps;tried={};saved.tried.forEach(function(id){tried[id]=1;});helperPts=saved.helperPts;firstRight=!!saved.firstRight;done=!!saved.done;resolved=saved.resolved;
        renderUID=saved.renderUID || 0;uid=["build","finished","result"].indexOf(saved.phase)!==-1 ? renderUID : saved.uid || 0;
        var right=decider(), text=resolved ? (resolved.ok ? T.right : T.here)+" "+helperLine(right) : null;
        if(saved.phase === "result") score(); else if(saved.phase === "finished") finished(resolved.ok,text,right); else if(saved.phase === "resolving") resolve(resolved.ok,text,resolved.tapped); else if(saved.phase === "who") step2(saved.helperFeedback ? T.not+" "+helperLine(saved.helperFeedback)+" "+T.another : null,saved.helperFeedback); else if(saved.phase === "build") build(); else intro();
        return true;
      }
    });
    intro();
  }

  /* a new random round: a different spark neighbor, 4 topics (the spark's + 3 of the other 4), fresh wordings */
  function newRound(api) {
    var r = api.rec(ID) || {}, tm = api.team();
    var avoid = tm && tm.phase === "B" && tm.s07 ? tm.s07 : null;
    function ok(s, withLast) { return !(avoid && (s.nb === avoid.nb || s.topic === avoid.topic)) && (!withLast || (s.nb !== r.lastSpark && s.nb !== SEEN.spark)); }
    var pool = SPARKS.filter(function (s) { return ok(s, true); });
    if (!pool.length) pool = SPARKS.filter(function (s) { return ok(s, false); });
    var spark = api.pick(pool);
    if (tm && tm.phase === "A") tm.s07 = { nb: spark.nb, topic: spark.topic };     // Team 2 gets another neighbor and topic
    var topics = [spark.topic].concat(api.shuffle(TOPICS.filter(function (t) { return t !== spark.topic; })).slice(0, 3));
    var last = SEEN.spark ? SEEN.tiles : (r.lastTiles || []), rows = {};
    ROWS.forEach(function (row) {
      rows[row] = api.shuffle(topics.map(function (tp) {
        var fresh = [0, 1, 2].filter(function (i) { return last.indexOf(row + "-" + tp + "-" + i) < 0; });
        var i = api.pick(fresh.length ? fresh : [0, 1, 2]);
        return { key: row + "-" + tp + "-" + i, row: row, topic: tp, text: tx(TILES[row][tp][i]) };
      }));
    });
    SEEN.spark = spark.nb;
    SEEN.tiles = [];
    ROWS.forEach(function (row) { rows[row].forEach(function (t) { SEEN.tiles.push(t.key); }); });
    return { spark: spark, topics: topics, rows: rows, helpers: api.shuffle(HELPER_IDS) };
  }

    return definition;
  }
  if (host.defineStop) host.defineStop(factory);
  else host.register(factory({ document: document, window: window, Date: Date, setTimeout: setTimeout, clearTimeout: clearTimeout, requestAnimationFrame: requestAnimationFrame, cancelAnimationFrame: typeof cancelAnimationFrame === "function" ? cancelAnimationFrame : function () {} }));
})();
