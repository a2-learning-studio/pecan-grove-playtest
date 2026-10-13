/* Community Builders of Pecan Grove · Stop 5 · Map What Could Change / Mapa de lo que puede cambiar
   A change card starts at the Old Miller Farm. The player taps the place where it lands first, then the
   neighbor who could feel it next. Several answers can be right. Helpful and hard cards score the same.
   Points reward the process only: +10 right on the first tap, +5 on the second, 0 when the game shows it.
   Words, cards and scoring are exact from "05 - map-what-could-change.md" (5A-5E). No network, no inputs. */
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
  var NS = "http://www.w3.org/2000/svg";

  /* ── words (exact, from the spec) ──────────────────────────────────── */
  var S = window.CBLocale.read("stop-05", LANG, {en:{"S.change":function (n) { return window.CBLocale.part("stop-05", "en", "S.change", 0) + n + window.CBLocale.part("stop-05", "en", "S.change", 1); },"S.step":function (n) { return window.CBLocale.part("stop-05", "en", "S.step", 0) + n + window.CBLocale.part("stop-05", "en", "S.step", 1); },"S.live":function (n, s) { return window.CBLocale.part("stop-05", "en", "S.live", 0) + n + window.CBLocale.part("stop-05", "en", "S.live", 1) + s + window.CBLocale.part("stop-05", "en", "S.live", 2); },"S.place":function (p) { return p + window.CBLocale.part("stop-05", "en", "S.place", 0); },"S.tipCard":function (c) { return window.CBLocale.part("stop-05", "en", "S.tipCard", 0) + c + window.CBLocale.part("stop-05", "en", "S.tipCard", 1); },"S.landed":function (p) { return window.CBLocale.part("stop-05", "en", "S.landed", 0) + p; }},es:{"S.change":function (n) { return window.CBLocale.part("stop-05", "es", "S.change", 0) + n + window.CBLocale.part("stop-05", "es", "S.change", 1); },"S.step":function (n) { return window.CBLocale.part("stop-05", "es", "S.step", 0) + n + window.CBLocale.part("stop-05", "es", "S.step", 1); },"S.live":function (n, s) { return window.CBLocale.part("stop-05", "es", "S.live", 0) + n + window.CBLocale.part("stop-05", "es", "S.live", 1) + s + window.CBLocale.part("stop-05", "es", "S.live", 2); },"S.place":function (p) { return p + window.CBLocale.part("stop-05", "es", "S.place", 0); },"S.tipCard":function (c) { return window.CBLocale.part("stop-05", "es", "S.tipCard", 0) + c + window.CBLocale.part("stop-05", "es", "S.tipCard", 1); },"S.landed":function (p) { return window.CBLocale.part("stop-05", "es", "S.landed", 0) + p; }}}).S;

  /* ── the scene: a crop of the painted town map, y 0.14-0.86 (the farm fields down to the river) ── */
  var Y0 = 0.14, Y1 = 0.86, VB_H = 553;                        // 0.72 x 768 map px; CSS keeps aspect-ratio 1376 / 553
  /* places in the spec's fixed order (= tab order). Labels: Stop 3 spec place labels, Wells / Homes from 5A.
     Points are fractions of the 1376 x 768 town map. */
  var ORDER = ["chapel", "clinic", "bakery", "school", "river", "community", "wells", "homes"];
  var PL = {
    farm: { n: window.CBLocale.pair("stop-05","bank.b0001"), p: [0.58, 0.27] },
    chapel: { n: window.CBLocale.pair("stop-05","bank.b0002"), p: [0.33, 0.425], ic: "chapel" },
    clinic: { n: window.CBLocale.pair("stop-05","bank.b0003"), p: [0.095, 0.53], ic: "clinic" },
    bakery: { n: window.CBLocale.pair("stop-05","bank.b0004"), p: [0.71, 0.49], ic: "shop" },
    school: { n: window.CBLocale.pair("stop-05","bank.b0005"), p: [0.50, 0.50], ic: "school" },
    river: { n: window.CBLocale.pair("stop-05","bank.b0006"), p: [0.42, 0.77], ic: "river" },
    community: { n: window.CBLocale.pair("stop-05","bank.b0007"), p: [0.27, 0.62], ic: "people" },
    wells: { n: window.CBLocale.pair("stop-05","bank.b0008"), p: [0.60, 0.645], ic: "well" },
    homes: { n: window.CBLocale.pair("stop-05","bank.b0009"), p: [0.84, 0.645], ic: "home" }
  };
  /* the farm plan, as a storybook paper sketch: see .cb-story in cb.css */
  var PLAN = '<path class="pp" d="M4 5h56v54H4z"/><rect class="n gr" x="9" y="10" width="17" height="13" rx="1"/><rect class="n grd" x="9" y="26" width="17" height="10" rx="1"/>' +
    '<rect class="n gr" x="9" y="39" width="17" height="5" rx="1"/><path class="ln" d="M30.5 9.5h25v27h-25z" stroke-dasharray="2.5 2"/><rect class="mt" x="34" y="13" width="18" height="19" rx="1"/>' +
    '<path class="ln" d="M34 19.5h18M34 25.5h18M40 13v19M46 13v19"/><rect class="n dt" x="4.8" y="46" width="54.4" height="5"/><path class="wv" d="M7 55.5c4-2.6 8 2.6 12 0s8-2.6 12 0 8 2.6 12 0 8-2.6 12 0"/>';
  var RINGS = [80, 175, 290, 420, 570], RING_OP = [0.78, 0.62, 0.48, 0.34, 0.22];
  /* the stone dropped on the farm, like a stone in a pond: a storybook pebble (see .cb-story in cb.css) */
  var STONE = '<ellipse class="sh" cx="32" cy="55" rx="21" ry="3.2"/><path class="stn" d="M11 46c-3.6-7.6.8-17.4 10.8-20.7 10.3-3.5 21.2.8 23.2 9 2 8.2-5.1 15.8-15.6 17.3-8.5 1.2-15.6-1.2-18.4-5.6z"/>' +
    '<path class="n hl" d="M19.5 32c2-2 4.7-3.3 7.8-3.6-2 1.4-3.7 3.2-4.7 5.3z"/><path class="ln" d="M25.5 44c3 1 7.2 1 10.2-.5"/>';

  /* ── the 12 change cards (5C, 5D). k: help / hard; first: right places; next: right neighbors ── */
  function C(k, ic, n, first, next, l1, l2) { return { k: k, ic: ic, n: n, first: first, next: next, l1: l1, l2: l2 }; }
  var CARDS = [
    C("help", "coin", window.CBLocale.pair("stop-05","bank.b0010"), ["school", "community"], ["jayden", "ruth"],
      window.CBLocale.pair("stop-05","bank.b0011"),
      window.CBLocale.pair("stop-05","bank.b0012")),
    C("help", "bread", window.CBLocale.pair("stop-05","bank.b0013"), ["bakery"], ["patel"],
      window.CBLocale.pair("stop-05","bank.b0014"),
      window.CBLocale.pair("stop-05","bank.b0015")),
    C("help", "hardhat", window.CBLocale.pair("stop-05","bank.b0016"), ["homes"], ["ana", "ruth"],
      window.CBLocale.pair("stop-05","bank.b0017"),
      window.CBLocale.pair("stop-05","bank.b0018")),
    C("help", "book", window.CBLocale.pair("stop-05","bank.b0019"), ["school"], ["ana", "jayden"],
      window.CBLocale.pair("stop-05","bank.b0020"),
      window.CBLocale.pair("stop-05","bank.b0021")),
    C("help", "signal", window.CBLocale.pair("stop-05","bank.b0022"), ["clinic", "homes"], ["lee", "ruth"],
      window.CBLocale.pair("stop-05","bank.b0023"),
      window.CBLocale.pair("stop-05","bank.b0024")),
    C("help", "road", window.CBLocale.pair("stop-05","bank.b0025"), ["clinic", "bakery"], ["lee", "johnson"],
      window.CBLocale.pair("stop-05","bank.b0026"),
      window.CBLocale.pair("stop-05","bank.b0027")),
    C("hard", "droplet", window.CBLocale.pair("stop-05","bank.b0028"), ["wells", "river"], ["johnson", "lee"],
      window.CBLocale.pair("stop-05","bank.b0029"),
      window.CBLocale.pair("stop-05","bank.b0030")),
    C("hard", "shovel", window.CBLocale.pair("stop-05","bank.b0031"), ["river", "wells"], ["johnson", "ana"],
      window.CBLocale.pair("stop-05","bank.b0032"),
      window.CBLocale.pair("stop-05","bank.b0033")),
    C("hard", "truck", window.CBLocale.pair("stop-05","bank.b0034"), ["bakery", "school", "clinic"], ["patel", "jayden", "lee"],
      window.CBLocale.pair("stop-05","bank.b0035"),
      window.CBLocale.pair("stop-05","bank.b0036")),
    C("hard", "moon", window.CBLocale.pair("stop-05","bank.b0037"), ["homes"], ["johnson", "lee", "jayden"],
      window.CBLocale.pair("stop-05","bank.b0038"),
      window.CBLocale.pair("stop-05","bank.b0039")),
    C("hard", "key", window.CBLocale.pair("stop-05","bank.b0040"), ["homes", "bakery"], ["patel", "ana"],
      window.CBLocale.pair("stop-05","bank.b0041"),
      window.CBLocale.pair("stop-05","bank.b0042")),
    C("hard", "lightbulb", window.CBLocale.pair("stop-05","bank.b0043"), ["homes", "bakery"], ["ruth", "patel"],
      window.CBLocale.pair("stop-05","bank.b0044"),
      window.CBLocale.pair("stop-05","bank.b0045"))
  ];

  /* ── authored icons: 24-unit grid, one 2px round stroke (same family as the shell's api.IC) ── */
  var ICONS = {
    coin: '<circle cx="12" cy="12" r="8.5"/><path d="M14.6 9.4c-.5-.9-1.5-1.4-2.7-1.4-1.5 0-2.6.8-2.6 1.9 0 1.2 1.1 1.7 2.7 2s2.7.9 2.7 2.1-1.2 2-2.7 2c-1.3 0-2.3-.5-2.8-1.5M12 6.4V8M12 16v1.6"/>',
    bread: '<path d="M7 20h10a1 1 0 0 0 1-1v-8.2a3.4 3.4 0 0 0 1.5-2.8C19.5 5.6 16.5 4 12 4S4.5 5.6 4.5 8a3.4 3.4 0 0 0 1.5 2.8V19a1 1 0 0 0 1 1z"/><path d="M9.5 10.5l1 1.6M13 9.5l1 1.6M10.5 14.5l1 1.6"/>',
    hardhat: '<path d="M3.5 17.5h17"/><path d="M5.5 17.5V15a6.5 6.5 0 0 1 13 0v2.5"/><path d="M10.5 8.8V12M13.5 8.8V12"/>',
    book: '<path d="M12 6.8C10.2 5.5 7.7 4.8 4.5 4.8v12.9c3.2 0 5.7.7 7.5 2 1.8-1.3 4.3-2 7.5-2V4.8c-3.2 0-5.7.7-7.5 2z"/><path d="M12 6.8v12.9"/>',
    signal: '<path d="M12 18.4v.2"/><path d="M8.7 15a4.7 4.7 0 0 1 6.6 0"/><path d="M5.7 12a8.9 8.9 0 0 1 12.6 0"/><path d="M2.8 9a13 13 0 0 1 18.4 0"/>',
    road: '<path d="M9 3.5 5 20.5M15 3.5l4 17"/><path d="M12 5v2.6M12 10.7v2.6M12 16.4V19"/>',
    droplet: '<path d="M12 3.5c3.1 4 6.2 7.2 6.2 10.6a6.2 6.2 0 0 1-12.4 0C5.8 10.7 8.9 7.5 12 3.5z"/><path d="M9.3 14.4a2.8 2.8 0 0 0 2.3 2.6"/>',
    shovel: '<path d="m15.6 3.6 4.8 4.8"/><path d="M18 6l-6.4 6.4"/><path d="M9.8 10.6l3.6 3.6-4.6 4.6a2.55 2.55 0 0 1-3.6-3.6z"/>',
    truck: '<path d="M4 6h8a1.5 1.5 0 0 1 1.5 1.5v8h-11v-8A1.5 1.5 0 0 1 4 6z"/><path d="M13.5 9.5h3.8l3.2 3.6v2.4h-7"/><circle cx="7" cy="17.5" r="2"/><circle cx="17" cy="17.5" r="2"/>',
    moon: '<path d="M19 14.6A7.6 7.6 0 1 1 9.4 5a6 6 0 0 0 9.6 9.6z"/><path d="M16.5 3.5v2.4M15.3 4.7h2.4"/>',
    key: '<path d="M3.5 11.4 7.5 8l4 3.4v5.1h-8z"/><path d="M7.5 12.6v1.4"/><path d="M11.5 13.8h9M17.3 13.8v2.8M20.5 13.8v2.2"/>',
    lightbulb: '<path d="M9.8 18h4.4M10.6 20.8h2.8"/><path d="M12 6.5a4.6 4.6 0 0 0-2.8 8.3c.5.4.7.9.7 1.5v.5h4.2v-.5c0-.6.2-1.1.7-1.5A4.6 4.6 0 0 0 12 6.5z"/><path d="M12 2.6V4M5.7 5.2l1 1M18.3 5.2l-1 1M3.6 11.2H5M19 11.2h1.4"/>',
    sprout: '<path d="M12 20.5V12"/><path d="M12 12.5C12 9 9.6 6.5 5.5 6.5c0 3.7 2.5 6 6.5 6z"/><path d="M12 14.5c0-3.7 2.4-6.5 6.5-6.5 0 3.9-2.5 6.5-6.5 6.5z"/><path d="M8 20.5h8"/>',
    pebble: '<path d="M2.8 17.6c-.5-2.9 1.9-5.4 5.3-5.8 3.1-.3 5.4 1.2 5.6 3.4.2 2.3-1.8 3.7-5 3.9-3 .2-5.6-.3-5.9-1.5z"/><path d="M12.6 9.7c-.4-2.3 1.4-4.2 4-4.5 2.4-.3 4.2.9 4.4 2.7.2 1.8-1.4 2.9-3.9 3.1-2.3.1-4.3-.2-4.5-1.3z"/><path d="M15.4 18.9c-.2-1.4.9-2.6 2.4-2.7 1.4-.1 2.3.7 2.4 1.7 0 1.1-1 1.6-2.4 1.6-1.3 0-2.3-.2-2.4-.6z"/>',
    plan: '<rect x="3.5" y="4.5" width="17" height="15.5" rx="1.5"/><path d="M6.5 8h11v9h-11z"/><path d="M12.5 8v4.2h5M9.5 17v-3.2h3"/>',
    ripple: '<circle cx="12" cy="4.6" r="2"/><path d="M12 9.2v1.6"/><ellipse cx="12" cy="15.4" rx="3.2" ry="1.3"/><path d="M5.2 14.2c-.5.4-.7.8-.7 1.2 0 1.7 3.4 3.1 7.5 3.1s7.5-1.4 7.5-3.1c0-.4-.2-.8-.7-1.2"/><path d="M2.3 13.4c-.5.6-.8 1.3-.8 2 0 2.8 4.7 5.1 10.5 5.1s10.5-2.3 10.5-5.1c0-.7-.3-1.4-.8-2"/>',
    pin: '<path d="M12 21s-6-5.4-6-10.5a6 6 0 0 1 12 0C18 15.6 12 21 12 21z"/><circle cx="12" cy="10.5" r="2.2"/>',
    chapel: '<path d="M12 3 8.5 6.8V10h-3v10.5h13V10h-3V6.8z"/><path d="M10.5 20.5v-3.2a1.5 1.5 0 0 1 3 0v3.2"/><path d="M12 8.4v.2"/>',
    clinic: '<rect x="4.5" y="4.5" width="15" height="15" rx="3.5"/><path d="M12 8.5v7M8.5 12h7"/>',
    shop: '<path d="M5 10.5v9h14v-9"/><path d="M3.6 6.6 5 4h14l1.4 2.6v1.2a2.1 2.1 0 0 1-4.2 0 2.1 2.1 0 0 1-4.2 0 2.1 2.1 0 0 1-4.2 0 2.1 2.1 0 0 1-4.2 0z"/><path d="M10 19.5V15h4v4.5"/>',
    school: '<path d="M3.5 10 12 5l8.5 5"/><path d="M5.5 9v11h13V9"/><path d="M10 20v-4h4v4"/><circle cx="12" cy="10.8" r="1.6"/>',
    river: '<path d="M3 7.5c1.5 0 1.5-1.2 3-1.2s1.5 1.2 3 1.2 1.5-1.2 3-1.2 1.5 1.2 3 1.2 1.5-1.2 3-1.2 1.5 1.2 3 1.2"/><path d="M3 12.5c1.5 0 1.5-1.2 3-1.2s1.5 1.2 3 1.2 1.5-1.2 3-1.2 1.5 1.2 3 1.2 1.5-1.2 3-1.2 1.5 1.2 3 1.2"/><path d="M3 17.5c1.5 0 1.5-1.2 3-1.2s1.5 1.2 3 1.2 1.5-1.2 3-1.2 1.5 1.2 3 1.2 1.5-1.2 3-1.2 1.5 1.2 3 1.2"/>',
    well: '<path d="M4.5 9 12 4.5 19.5 9"/><path d="M7 9v4.5M17 9v4.5"/><path d="M5 13.5h14V18a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z"/><path d="M12 9v2.6"/>'
  };

  /* five unlabelled dots in the header, captioned "Change n of 5" */
  CB.register({ id: "map-what-could-change", steps: [null, null, null, null, null], css: "05-map-what-could-change.css", run: run });

  function run(api, stop) {
    function reduced() { return api.motionAllowed ? !api.motionAllowed() : api.REDUCED; }
    var h = api.h, t2 = api.t2, L = api.L, NB = api.NB;
    document.title = S.title;                                  // spec's exact page title (the shell's separator is " · ")
    var DOTS = [null, null, null, null, null];

    function icon(name, cls) {
      var s = document.createElementNS(NS, "svg");
      s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true"); s.setAttribute("focusable", "false");
      s.setAttribute("class", "cb-ico cb-s05-i" + (cls ? " " + cls : ""));
      host.setAuthoredMarkup(s, ICONS[name] || api.IC[name]);               // constant, authored markup only
      return s;
    }
    function sv(tag, attrs) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
    function pt(p) { return [p[0] * 1376, (p[1] - Y0) * 768]; }
    function pct(p) { return [p[0] * 100, (p[1] - Y0) / (Y1 - Y0) * 100]; }
    function at(el, p) { var q = pct(p); el.style.setProperty("left", q[0].toFixed(2) + "%"); el.style.setProperty("top", q[1].toFixed(2) + "%"); return el; }
    function pathFor(id) {                                     // a gentle arc from the farm, bowing outward
      var a = pt(PL.farm.p), b = pt(PL[id].p), dx = b[0] - a[0], dy = b[1] - a[1], len = Math.sqrt(dx * dx + dy * dy);
      var s = (dx < 0 ? 1 : -1) * 0.14 * len, cx = (a[0] + b[0]) / 2 - dy / len * s, cy = (a[1] + b[1]) / 2 + dx / len * s;
      return "M" + a[0].toFixed(1) + " " + a[1].toFixed(1) + " Q" + cx.toFixed(1) + " " + cy.toFixed(1) + " " + b[0].toFixed(1) + " " + b[1].toFixed(1);
    }
    function pname(id) { return t2(PL[id].n); }
    function nb(id) { return api.nbById(id); }

    /* ── new round: 5 of 12, at least 2 helpful and 2 hard, random order, at most 2 from the last round
       (in Team challenge, Team 2 also gets at most 2 of Team 1's cards) ── */
    var rec = api.rec(stop.id), T = api.team ? api.team() : null;
    var last = rec && rec.lastRound ? rec.lastRound : null, avoid = T && T.phase === "B" && T.s05 ? T.s05 : null;
    function overlap(a, b) { return b ? a.filter(function (x) { return b.indexOf(x) >= 0; }).length : 0; }
    function draw() {
      var all = CARDS.map(function (c, i) { return i; }), fallback = null;
      for (var t = 0; t < 600; t++) {
        var d = api.shuffle(all).slice(0, 5), nh = d.filter(function (i) { return CARDS[i].k === "help"; }).length;
        if (nh < 2 || nh > 3) continue;
        if (overlap(d, avoid) > 2) continue;
        if (!fallback) fallback = d;
        if (overlap(d, last) > 2) continue;
        return d;
      }
      return fallback || api.shuffle(all).slice(0, 5);
    }
    var ids = draw();
    if (T && T.phase === "A") T.s05 = ids.slice();
    var round = ids.map(function (i) { return { i: i, c: CARDS[i], st: [{ tried: [], res: null, pick: null }, { tried: [], res: null, pick: null }] }; });
    var ci = 0, step = 0, drawn = {}, dropped = -1, lineNew = {}, finished = false, phase = "intro", feedbackKind = null;
    var PTS = { first: 10, second: 5, shown: 0 };
    /* a double-tap on Start or Next must not land its second click on the place or neighbor drawn under the finger.
       Pointer clicks (detail > 0) within GHOST ms of a new screen are ignored; keyboard clicks (detail 0) never are. */
    var GHOST = 400, armed = 0, nextArmed = 0;
    function ghost(e, t) { return !!(e && e.detail > 0 && Date.now() < t); }
    /* after an answer, the step's line appears in the card: keep the card clear of the sticky action bar */
    function reveal() {                                        // the whole panel (card and lit answers) when it fits, else the card
      var cardEl = document.querySelector(".cb-s05-card"), bar = document.querySelector(".cb-s05 .cb-actions");
      if (!cardEl || !bar || !cardEl.scrollIntoView) return;
      var barH = Math.ceil(bar.getBoundingClientRect().height + 24), panel = cardEl.parentNode;
      var fs = document.fullscreenElement || document.webkitFullscreenElement, vh = fs ? fs.clientHeight : window.innerHeight;
      var el = panel && panel.getBoundingClientRect().height + barH + 16 <= vh ? panel : cardEl;
      el.style.setProperty("scroll-margin-bottom", barH + "px");
      el.style.setProperty("scroll-margin-top", "16px");
      el.scrollIntoView({ block: "nearest", behavior: reduced() ? "auto" : "smooth" });
    }
    /* plates on the map: a two-line label shrinks to its widest line, so no empty space is left beside it */
    function fitPlates() {
      [].forEach.call(document.querySelectorAll(".cb-s05-place__t"), function (t) {
        t.style.removeProperty("--fit");
        var b = t.querySelector("b"), sm = t.querySelector("small"); if (!b || !document.createRange) return;
        var r = document.createRange(); r.selectNodeContents(b);
        var rs = r.getClientRects(); if (rs.length < 2) return;
        var w = 0; for (var k = 0; k < rs.length; k++) w = Math.max(w, rs[k].width);
        if (sm) { r.selectNodeContents(sm); w = Math.max(w, r.getBoundingClientRect().width); }
        t.style.setProperty("--fit", Math.ceil(w + 1) + "px");
      });
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (document.querySelector(".cb-s05-place")) fitPlates(); });

    /* ── pieces ── */
    function kindChip(k, cls) { return h("p", { "class": "cb-s05-kind" + (cls ? " " + cls : "") }, [icon(k === "help" ? "sprout" : "pebble"), h("span", { text: S.kind[k] })]); }
    function cardIcon(c, cls) { return h("span", { "class": cls || "cb-s05-card__ic", "aria-hidden": "true" }, [icon(c.ic)]); }
    function picksUpTo(n) { var out = []; for (var j = 0; j < n; j++) { var st = round[j].st[0], landed = st.firstTap || st.pick; if (landed) out.push({ id: landed, c: round[j].c }); } return out; }

    /* the painted map with rings, dotted paths and lit trails. mode: play | end | mini */
    function scene(mode) {
      var cur = round[Math.min(ci, 4)], svg = sv("svg", { viewBox: "0 0 1376 " + VB_H, "class": "cb-s05-svg", "aria-hidden": "true", focusable: "false", preserveAspectRatio: "none" });
      var F = pt(PL.farm.p);
      RINGS.forEach(function (rx, k) {
        var e = sv("ellipse", { cx: F[0].toFixed(1), cy: F[1].toFixed(1), rx: rx, ry: (rx * 0.42).toFixed(1), "class": "cb-s05-ring", "stroke-opacity": RING_OP[k] });
        e.style.setProperty("--i", String(k)); svg.appendChild(e);
      });
      ORDER.forEach(function (id) { svg.appendChild(sv("path", { d: pathFor(id), "class": "cb-s05-stones" })); });
      var trails = [], lit = {};
      if (mode === "play") {
        picksUpTo(ci).forEach(function (p) { trails.push({ id: p.id, old: true }); });
        if (cur.st[0].res) {
          var right = [cur.st[0].pick].concat(cur.c.first.filter(function (x) { return x !== cur.st[0].pick; }));
          right.forEach(function (id, k) { trails.push({ id: id, key: ci + ":" + id, delay: k * 220 }); });
        }
      } else picksUpTo(5).forEach(function (p) { trails.push({ id: p.id }); });
      trails.forEach(function (tr) {
        var p = sv("path", { d: pathFor(tr.id), "class": "cb-s05-trail" + (tr.old ? " is-old" : "") });
        if (tr.key && !drawn[tr.key] && !reduced()) { p.setAttribute("data-new", tr.key); p.setAttribute("data-delay", String(tr.delay || 0)); }
        svg.appendChild(p); lit[tr.id] = 1;
      });
      if (mode === "play" && !reduced() && dropped !== ci) svg.classList.add("is-drop");
      var farm = at(h("div", { "class": "cb-s05-farm" + (mode === "play" && !reduced() && dropped !== ci ? " is-drop" : ""), "aria-hidden": "true" }, [
        h("span", { "class": "cb-s05-farm__stone cb-story-obj" }, [api.story(STONE)]), h("span", { "class": "cb-s05-farm__name", text: pname("farm") })]), PL.farm.p);
      var pins = ORDER.map(function (id, k) {                  // phone: numbered markers; the list below carries the same number and the name
        return at(h("span", { "class": "cb-s05-pin" + (lit[id] ? " is-lit" : ""), "aria-hidden": "true", text: String(k + 1) }), PL[id].p);
      });
      var extra = [];
      if (mode === "mini") {                                   // the round's five changes sit where they landed
        var seen = {};
        picksUpTo(5).forEach(function (p) {
          if (seen[p.id]) return; seen[p.id] = 1;
          extra.push(at(h("span", { "class": "cb-story-tag cb-s05-mtag", "aria-hidden": "true", text: pname(p.id) }), PL[p.id].p));
        });
      }
      var art = api.crop([0, Y0, 1, Y1], "cb-s05-map" + (mode === "mini" ? " cb-s05-mini" : ""), [svg, farm].concat(pins, extra));
      return art;
    }
    function playTrails() {                                    // the trail draws itself from the farm to the place
      if (reduced()) return;
      [].forEach.call(document.querySelectorAll(".cb-s05-svg [data-new]"), function (p) {
        var key = p.getAttribute("data-new"), delay = +p.getAttribute("data-delay") || 0; drawn[key] = 1;
        var len = p.getTotalLength(); p.style.strokeDasharray = len; p.style.strokeDashoffset = len;
        p.getBoundingClientRect();
        p.style.transition = "stroke-dashoffset 0.9s cubic-bezier(0.16, 1, 0.3, 1) " + delay + "ms"; p.style.strokeDashoffset = "0";
      });
    }

    /* the 8 places: buttons in step 1 (on the map on wide screens, a list on phones), plates otherwise */
    function places(interactive) {
      var cur = round[Math.min(ci, 4)], st = cur.st[0], done = !!st.res, endMode = ci > 4;
      var stk = {};
      picksUpTo(Math.min(ci, 5)).forEach(function (p) { (stk[p.id] = stk[p.id] || []).push(p.c); });
      if (!endMode && done && st.pick) (stk[st.pick] = stk[st.pick] || []).push(cur.c);
      return h("ul", { "class": "cb-s05-places" + (interactive ? "" : " is-passive"), "aria-hidden": interactive ? null : "true" }, ORDER.map(function (id) {
        var name = pname(id), tried = interactive && st.tried.indexOf(id) >= 0;
        var right = endMode ? !!stk[id] : done && cur.c.first.indexOf(id) >= 0;
        var cls = "cb-s05-place" + (right ? " is-right" : "") + (tried ? " is-tried" : "") + (!interactive && !right ? " is-quiet" : "");
        var kids = [h("span", { "class": "cb-s05-place__no", "aria-hidden": "true", text: String(ORDER.indexOf(id) + 1) }),
          h("span", { "class": "cb-s05-place__ic", "aria-hidden": "true" }, [icon(right ? "check" : PL[id].ic)]),
          h("span", { "class": "cb-s05-place__t" }, [h("b", { text: name }), tried ? h("small", { text: S.tried }) : null]),
          null];
        var el = interactive ? h("button", { type: "button", "class": cls, "data-p": id, "aria-label": S.place(name) + (tried ? ", " + S.tried : ""),
          "aria-disabled": done || tried ? "true" : null, onclick: function (e) { if (!ghost(e, armed)) tap(id); } }, kids) : h("span", { "class": cls }, kids);
        var li = at(h("li", null, [el]), PL[id].p);
        return li;
      }));
    }
    function who() {
      var cur = round[ci], st = cur.st[1], done = !!st.res;
      return h("ul", { "class": "cb-pick cb-s05-who" }, NB.map(function (n) {
        var tried = st.tried.indexOf(n.id) >= 0, isR = done && cur.c.next.indexOf(n.id) >= 0;
        var b = h("button", { type: "button", "class": "cb-face-btn" + (isR ? " is-right" : "") + (tried ? " is-chosen" : ""), "data-nb": n.id,
          "aria-label": api.nmCap(n) + ", " + n.plain[L] + (tried ? ", " + S.tried : ""), "aria-disabled": done || tried ? "true" : null,
          onclick: function (e) { if (!ghost(e, armed)) tap(n.id); } }, [
          h("span", { "class": "cb-face-btn__img" }, [api.img(n.img, "", null, true), isR ? h("span", { "class": "cb-badge" }, [api.ico("check")]) : null]),
          h("b", { text: api.nmCap(n) }), h("small", { text: n.plain[L] }), tried ? h("span", { "class": "cb-s05-tried", text: S.tried }) : null]);
        return h("li", null, [b]);
      }));
    }
    function card(cur) {
      var c = cur.c, lines = [];
      [0, 1].forEach(function (s) {
        if (!cur.st[s].res) return;
        var key = ci + ":" + s, fresh = !lineNew[key]; lineNew[key] = 1;
        lines.push(h("p", { "class": "cb-s05-line" + (fresh && !reduced() ? " is-new" : "") }, [s ? api.ico("people") : icon("pin"), h("span", { text: t2(s ? c.l2 : c.l1) })]));
      });
      return h("article", { "class": "cb-s05-card" + (dropped !== ci && !reduced() ? " is-new" : "") }, [
        h("div", { "class": "cb-s05-card__top" }, [cardIcon(c), h("div", { "class": "cb-s05-card__head" }, [kindChip(c.k), h("h3", { "class": "cb-s05-card__name", text: t2(c.n) })])]),
        lines.length ? h("div", { "class": "cb-s05-lines" }, lines) : null]);
    }
    function stepNo() {
      return h("p", { "class": "cb-s05-stepno" }, [h("span", { "class": "cb-s05-stepno__dots", "aria-hidden": "true" }, [0, 1].map(function (s) {
        return h("i", { "class": s < step ? "is-done" : s === step ? "is-on" : null });
      })), h("span", { text: S.step(step + 1) })]);
    }
    function feedback(cur, s, kind) {                          // kind: ok | wrong | shown
      feedbackKind = kind;
      var st = cur.st[s], right = s ? cur.c.next : cur.c.first, nameOf = s ? function (id) { return api.nm(nb(id)); } : pname;
      var sentence = kind === "ok" ? S.ok[s] : kind === "wrong" ? S.wrong[s] : S.shown[s];
      var f = api.fb(sentence, kind === "ok"), p = f.querySelector("p"), wrap = h("div", { "class": "cb-s05-fbtext" });
      f.replaceChild(wrap, p); wrap.appendChild(p);
      var spoken = sentence;
      if (kind === "shown") { var nm = s ? api.nmCap(nb(st.pick)) : pname(st.pick); p.appendChild(document.createTextNode(" ")); p.appendChild(h("b", { text: nm })); spoken += " " + nm + "."; }
      if (kind !== "wrong") {
        var others = right.filter(function (x) { return x !== st.pick; }).map(nameOf);
        if (others.length) { wrap.appendChild(h("p", { "class": "cb-s05-also" }, [h("b", { text: S.also }), " " + others.join(", ")])); spoken += " " + S.also + " " + others.join(", ") + "."; }
        spoken += " " + t2(s ? cur.c.l2 : cur.c.l1);
      }
      return { node: f, spoken: spoken };
    }

    /* ── screens ── */
    var CROWD = [[13, 71], [24, 85], [37, 76], [50, 88], [62, 76], [74, 87]];
    function intro() {
      phase = "intro";
      var faces = NB.map(function (n, k) {
        var f = h("span", { "class": "cb-s05-face" }, [api.img(n.img, "", null, true)]);
        f.style.setProperty("left", CROWD[k][0] + "%"); f.style.setProperty("top", CROWD[k][1] + "%"); return f;
      });
      var rings = sv("svg", { viewBox: "0 0 1376 768", "class": "cb-s05-svg cb-s05-hero__rings", "aria-hidden": "true", focusable: "false", preserveAspectRatio: "none" });
      [300, 470, 660].forEach(function (rx, k) { rings.appendChild(sv("ellipse", { cx: "500", cy: "330", rx: rx, ry: (rx * 0.42).toFixed(0), "class": "cb-s05-ring", "stroke-opacity": [0.7, 0.45, 0.25][k] })); });
      /* the farm plan pinned up for the town: a storybook paper sketch (fields, the building, the road, the creek) with its name */
      var plan = h("span", { "class": "cb-s05-plan" }, [h("span", { "class": "cb-story-obj" }, [api.story(PLAN)]), h("span", { "class": "cb-story-tag", text: S.planTag })]);
      var art = api.crop([0.50, 0.44, 0.84, 0.78], "cb-s05-hero", [rings, plan].concat(faces));
      art.setAttribute("aria-hidden", "true");
      var introAt = Date.now() + GHOST;                        // a double-tap on the town-map medallion must not press Start
      var go = api.btn(S.start, "cb-btn--go cb-btn--big cb-s05-big", function (e) { if (!ghost(e, introAt)) play(); }, "go", true);
      api.screen([api.stopHud(stop, null), h("div", { "class": "cb-board cb-s05" }, [h("div", { "class": "cb-s05-intro" }, [art, h("div", { "class": "cb-intro cb-s05-intro__text" }, [
        h("p", { "class": "cb-intro__lead", text: S.intro1 }),
        h("p", { "class": "cb-s05-ripple" }, [h("span", { "class": "cb-s05-ripple__ic", "aria-hidden": "true" }, [icon("ripple")]), h("span", { text: S.intro2 })]),
        h("ul", { "class": "cb-s05-kinds" }, ["help", "hard"].map(function (k) {
          return h("li", null, [h("span", { "class": "cb-s05-kinds__ic", "aria-hidden": "true" }, [icon(k === "help" ? "sprout" : "pebble")]), h("span", { text: S.kind[k] })]);
        })),
        h("div", { "class": "cb-row" }, [go])])])])]);
      api.frame();
    }
    function play(fbo, focusSel) {
      phase = "play"; if (!fbo) feedbackKind = null;
      var cur = round[ci], st = cur.st[step], done = !!st.res;
      var task = h("div", { "class": "cb-s05-task" }, [stepNo(), api.coach(S.q[step], step ? "people" : "peek"), step === 0 ? places(true) : who()]);
      var playEl = h("div", { "class": "cb-s05-play" + (step ? " is-who" : "") }, [scene("play"), step ? places(false) : null, h("div", { "class": "cb-s05-panel" }, [card(cur), task])]);
      var next = api.btn(api.W.next, "cb-btn--go cb-btn--big cb-s05-big cb-s05-next", function (e) { if (!ghost(e, nextArmed)) onNext(); }, "go", true);
      var actions = fbo ? h("div", { "class": "cb-actions" }, [h("div", { "class": "cb-actions__info" }, [fbo.node]), done ? next : null]) : null;
      api.screen([api.stopHud(stop, DOTS, ci, S.change(ci + 1)), h("div", { "class": "cb-board cb-s05" }, [playEl, actions])], focusSel || null);
      dropped = ci;
      fitPlates();
      requestAnimationFrame(playTrails);
      if (fbo) {
        api.say(fbo.spoken);
        if (done) { nextArmed = Date.now() + GHOST; reveal(); }
      } else {
        armed = Date.now() + GHOST;
        api.frame();
        api.say(S.live(ci + 1, step + 1) + ". " + (step ? "" : t2(cur.c.n) + ". " + S.kind[cur.c.k] + ". ") + S.q[step]);
      }
    }
    function tap(id) {
      var cur = round[ci], st = cur.st[step], right = step ? cur.c.next : cur.c.first;
      if (step === 0 && !st.firstTap) st.firstTap = id;
      if (st.res || st.tried.indexOf(id) >= 0) return;
      var kind;
      if (right.indexOf(id) >= 0) { st.res = st.tried.length ? "second" : "first"; st.pick = id; kind = "ok"; }
      else {
        st.tried.push(id);
        if (st.tried.length < 2) kind = "wrong";
        else { st.res = "shown"; st.pick = right[0]; kind = "shown"; }
      }
      var fbo = feedback(cur, step, kind);
      play(fbo, st.res ? ".cb-s05-next" : (step ? '[data-nb="' + id + '"]' : '[data-p="' + id + '"]'));
    }
    function onNext() {
      if (step === 0) { step = 1; play(); return; }
      step = 0; ci++;
      if (ci < 5) play(); else endScreen();
    }
    function recapList(cls) {
      return h("ul", { "class": "cb-s05-recap" + (cls ? " " + cls : "") }, round.map(function (r) {
        var at = picksUpTo(5).filter(function (p) { return p.c === r.c; })[0];
        return h("li", null, [cardIcon(r.c, "cb-s05-recap__ic"), h("span", { "class": "cb-s05-recap__n" }, [t2(r.c.n), at ? h("small", { "class": "cb-s05-recap__at", text: S.landed(pname(at.id)) }) : null]),
          kindChip(r.c.k, "cb-s05-kind--sm")]);
      }));
    }
    function endScreen() {
      phase = "aha";
      feedbackKind = null;
      var shownAt = Date.now() + GHOST;
      var see = api.btn(S.see, "cb-btn--go cb-btn--big cb-s05-big cb-s05-see", function (e) { if (!ghost(e, shownAt)) finish(); }, "go", true);
      var playEl = h("div", { "class": "cb-s05-play is-end" }, [scene("end"), places(false),
        h("div", { "class": "cb-s05-panel cb-s05-panel--end" }, [h("div", { "class": "cb-s05-endrow" }, [h("p", { "class": "cb-s05-endmsg" }, [icon("ripple"), h("span", { text: S.end })]), see]), recapList()])]);
      api.screen([api.stopHud(stop, DOTS, 5), h("div", { "class": "cb-board cb-s05" }, [playEl])], ".cb-s05-see");
      fitPlates();
      api.frame();
      api.say(S.end);
    }

    /* ── score: 10 steps x (+10 first tap, +5 second tap, 0 shown). Max 100. No time bonus. ── */
    function finish() {
      phase = "result";
      if (finished) return; finished = true;                   // one save per round, whatever is tapped twice
      var score = 0, miss = [0, 0], help = [], hard = [], worst = null;
      round.forEach(function (r) {
        var cs = 0;
        r.st.forEach(function (st, s) { cs += PTS[st.res] || 0; miss[s] += st.tried.length; });
        score += cs; (r.c.k === "help" ? help : hard).push(cs);
        if (!worst || cs < worst.cs) worst = { cs: cs, c: r.c };
      });
      var avg = function (a) { return a.reduce(function (x, y) { return x + y; }, 0) / a.length; };
      var aH = avg(help), aD = avg(hard);
      /* the tip names the change that lost the most points, so it says what to do, not only which kind */
      var tip = score === 100 ? S.tip100 : worst && worst.cs < 20 ? S.tipCard(t2(worst.c.n)) : miss[1] > miss[0] ? S.tipStep2 : S.tipPaths;
      var info = api.saveRound(stop.id, score, { lastRound: ids.slice().sort(function (a, b) { return a - b; }) });
      api.endPlay();
      var mini = scene("mini");
      if (score >= 90 && !reduced()) mini.classList.add("is-glow");   // 3 stars: the ripple rings glow once
      var sum = h("div", { "class": "cb-s05-sum" }, [h("strong", { text: S.end }), h("div", { "class": "cb-s05-sum__grid" }, [mini, recapList("cb-s05-recap--card")])]);
      var gu = api.btn(S.gu, "cb-btn--quiet cb-s05-gu", function () { api.dialog(S.gu, [h("p", { text: S.guText })], gu); }, "family");
      var sc = api.scoreCard(stop, score, info, tip, S.can, S.real, sum);
      api.finishRound(stop.id, sc, api.cardButtons(stop.id, api.restart(stop.id), gu));
      api.say(api.W.score + " " + score + " / 100");
    }

    if (api.setController) api.setController({
      snapshot: function () { return { v: 2, phase: phase, ci: ci, step: step, feedback: feedbackKind, drawn: drawn, dropped: dropped, lineNew: lineNew, round: round.map(function(value) { return { id: value.i, steps: value.st.map(function(st){return {tried:st.tried.slice(),res:st.res,pick:st.pick,firstTap:st.firstTap||null};}) }; }) }; },
      restore: function (saved) {
        if (!saved || saved.v !== 2 || !Array.isArray(saved.round) || saved.round.length !== 5) return false;
        ids = saved.round.map(function(value){return value.id;});
        round = saved.round.map(function(value){return {i:value.id,c:CARDS[value.id],st:value.steps.map(function(st){return {tried:st.tried.slice(),res:st.res,pick:st.pick,firstTap:st.firstTap||null};})};});
        ci = saved.ci; step = saved.step; drawn = saved.drawn || {}; dropped = saved.dropped; lineNew = saved.lineNew || {}; finished = false;
        if (saved.phase === "result") finish(); else if(saved.phase === "aha") endScreen(); else if(saved.phase === "play") play(saved.feedback ? feedback(round[ci],step,saved.feedback) : null); else intro();
        return true;
      }
    });
    intro();
  }

    return definition;
  }
  if (host.defineStop) host.defineStop(factory);
  else host.register(factory({ document: document, window: window, Date: Date, setTimeout: setTimeout, clearTimeout: clearTimeout, requestAnimationFrame: requestAnimationFrame, cancelAnimationFrame: typeof cancelAnimationFrame === "function" ? cancelAnimationFrame : function () {} }));
})();
