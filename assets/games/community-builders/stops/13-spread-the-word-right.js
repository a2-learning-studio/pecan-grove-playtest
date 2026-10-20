/* Community Builders of Pecan Grove · Stop 13 · Spread the Word Right / Comparte bien la información
   A "What we know so far" poster builder with no typing, for the library board at school: put 3 of 6 fact cards on the
   poster, give each one its source and check its date, swap old news, take rumors off, pick a headline, then ask a
   grown-up where to share it. Points count the finished poster only (sources, dates, a hope and a worry, the FIRST
   headline tapped, no rumor). Never a side, never speed, and where you share never changes the score.
   Every player-facing string is exact from "13 - spread-the-word-right.md". */
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
  var ID = "spread-the-word-right", STEPS = [null, null];
  var SCHOOL = [0.32, 0.27, 0.68, 0.63];      // painted crop: the clock-tower building, used as the School with its library board
  var BAND = [0.3, 0.29, 0.7, 0.6];           // a wider strip of the same building, behind the poster
  var SVGNS = "http://www.w3.org/2000/svg", uid = 0;

  /* ── words ─────────────────────────────────────────────────────────── */
  var T = window.CBLocale.read("stop-13", (ES ? "es" : "en"), {en:{"T.prog":function (n, hd) { return window.CBLocale.part("stop-13", "en", "T.prog", 0) + n + window.CBLocale.part("stop-13", "en", "T.prog", 1) + (hd ? window.CBLocale.part("stop-13", "en", "T.prog", 2) : window.CBLocale.part("stop-13", "en", "T.prog", 3)); },"T.step":function (n) { return window.CBLocale.part("stop-13", "en", "T.step", 0) + n + window.CBLocale.part("stop-13", "en", "T.step", 1); },"T.slot":function (n) { return window.CBLocale.part("stop-13", "en", "T.slot", 0) + n + window.CBLocale.part("stop-13", "en", "T.slot", 1); },"T.source":function (s) { return window.CBLocale.part("stop-13", "en", "T.source", 0) + s; },"T.card":function (w, tag) { return window.CBLocale.part("stop-13", "en", "T.card", 0) + w + window.CBLocale.part("stop-13", "en", "T.card", 1) + tag; },"T.at":function (b, n) { return b + window.CBLocale.part("stop-13", "en", "T.at", 0) + n; },"T.inSlot":function (n) { return window.CBLocale.part("stop-13", "en", "T.inSlot", 0) + n; }},es:{"T.prog":function (n, hd) { return window.CBLocale.part("stop-13", "es", "T.prog", 0) + n + window.CBLocale.part("stop-13", "es", "T.prog", 1) + (hd ? window.CBLocale.part("stop-13", "es", "T.prog", 2) : window.CBLocale.part("stop-13", "es", "T.prog", 3)); },"T.step":function (n) { return window.CBLocale.part("stop-13", "es", "T.step", 0) + n + window.CBLocale.part("stop-13", "es", "T.step", 1); },"T.slot":function (n) { return window.CBLocale.part("stop-13", "es", "T.slot", 0) + n + window.CBLocale.part("stop-13", "es", "T.slot", 1); },"T.source":function (s) { return window.CBLocale.part("stop-13", "es", "T.source", 0) + s; },"T.card":function (w, tag) { return window.CBLocale.part("stop-13", "es", "T.card", 0) + w + window.CBLocale.part("stop-13", "es", "T.card", 1) + tag; },"T.at":function (b, n) { return b + window.CBLocale.part("stop-13", "es", "T.at", 0) + n; },"T.inSlot":function (n) { return window.CBLocale.part("stop-13", "es", "T.inSlot", 0) + n; }}}).T;

  /* sources and their dates; the ids are for code only, never shown */
  var SRC = {
    plan: { name: window.CBLocale.pair("stop-13","bank.b0001"), date: window.CBLocale.pair("stop-13","bank.b0002") },
    board: { name: window.CBLocale.pair("stop-13","bank.b0003"), date: window.CBLocale.pair("stop-13","bank.b0004") },
    state: { name: window.CBLocale.pair("stop-13","bank.b0005"), date: window.CBLocale.pair("stop-13","bank.b0006") },
    first: { name: window.CBLocale.pair("stop-13","bank.b0007"), date: window.CBLocale.pair("stop-13","bank.b0008") }
  };
  /* 8 checked facts: 4 hope, 4 worry */
  var FACTS = [
    { tag: "hope", src: "plan", t: window.CBLocale.pair("stop-13","bank.b0009") },
    { tag: "hope", src: "plan", t: window.CBLocale.pair("stop-13","bank.b0010") },
    { tag: "hope", src: "board", t: window.CBLocale.pair("stop-13","bank.b0011") },
    { tag: "hope", src: "board", t: window.CBLocale.pair("stop-13","bank.b0012") },
    { tag: "worry", src: "plan", t: window.CBLocale.pair("stop-13","bank.b0013") },
    { tag: "worry", src: "plan", t: window.CBLocale.pair("stop-13","bank.b0014") },
    { tag: "worry", src: "plan", t: window.CBLocale.pair("stop-13","bank.b0015") },
    { tag: "worry", src: "state", t: window.CBLocale.pair("stop-13","bank.b0016") }
  ];
  /* 4 old facts from the company's first plan (June 2), each with its new fact */
  var OLDS = [
    { tag: "hope", t: window.CBLocale.pair("stop-13","bank.b0017"),
      src: "plan", nt: window.CBLocale.pair("stop-13","bank.b0018") },
    { tag: "hope", t: window.CBLocale.pair("stop-13","bank.b0019"),
      src: "plan", nt: window.CBLocale.pair("stop-13","bank.b0020") },
    { tag: "worry", t: window.CBLocale.pair("stop-13","bank.b0021"),
      src: "plan", nt: window.CBLocale.pair("stop-13","bank.b0022") },
    { tag: "worry", t: window.CBLocale.pair("stop-13","bank.b0023"),
      src: "board", nt: window.CBLocale.pair("stop-13","bank.b0024") }
  ];
  /* 4 rumors (Stop 4's words): no source, no date; 2 hope, 2 worry */
  var RUMORS = [
    { tag: "hope", t: window.CBLocale.pair("stop-13","bank.b0025") },
    { tag: "worry", t: window.CBLocale.pair("stop-13","bank.b0026") },
    { tag: "hope", t: window.CBLocale.pair("stop-13","bank.b0027") },
    { tag: "worry", t: window.CBLocale.pair("stop-13","bank.b0028") }
  ];
  /* 4 headlines: two tell, two sell (one for each side); both selling ones get the same note and the same 0 */
  var HEADS = [
    { tells: true, t: window.CBLocale.pair("stop-13","bank.b0029") },
    { tells: true, t: window.CBLocale.pair("stop-13","bank.b0030") },
    { tells: false, t: window.CBLocale.pair("stop-13","bank.b0031") },
    { tells: false, t: window.CBLocale.pair("stop-13","bank.b0032") }
  ];
  /* where to share: all three are safe and score the same; there is no "post online" choice */
  var SHARES = [
    { id: "family", icon: "table", t: window.CBLocale.pair("stop-13","bank.b0033"), line: window.CBLocale.pair("stop-13","bank.b0034") },
    { id: "class", icon: "desk", t: window.CBLocale.pair("stop-13","bank.b0035"), line: window.CBLocale.pair("stop-13","bank.b0036") },
    { id: "library", icon: "board", t: window.CBLocale.pair("stop-13","bank.b0037"), line: window.CBLocale.pair("stop-13","bank.b0038") }
  ];

  /* line icons on the shell's 24-unit grid, one 2px round stroke (no glyphs, no words) */
  var ICONS = {
    umbrella: '<path d="M3.5 12.5a8.5 8.5 0 0 1 17 0z"/><path d="M12 12.5v5.3a2.2 2.2 0 0 1-4.4 0"/><path d="M12 4V2.8"/>',
    note: '<path d="M5 4.5h14v9.2l-5.8 5.8H5z"/><path d="M13.2 19.3v-5.6h5.6"/><path d="M8.5 8.5h7M8.5 11.5h4"/>',
    calendar: '<rect x="4" y="5.5" width="16" height="14.5" rx="2.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/><path d="m9.5 15 1.8 1.8 3.4-3.6"/>',
    off: '<path d="M9.5 7.5 5 12l4.5 4.5"/><path d="M5 12h9.5a4.5 4.5 0 0 0 4.5-4.5V6"/>',
    swap: '<path d="M5 8.5h13"/><path d="m14.5 5 3.5 3.5-3.5 3.5"/><path d="M19 15.5H6"/><path d="m9.5 12-3.5 3.5L9.5 19"/>',
    table: '<path d="M3 13h18"/><path d="M5.5 13 4.5 20M18.5 13l1 7"/><path d="M7 13a5 5 0 0 1 10 0"/><path d="M12 8V6.5"/>',
    desk: '<path d="M2.5 13.5h19"/><path d="M4.5 13.5v6.5M19.5 13.5v6.5"/><path d="M6.5 13.5c1.8-1.6 3.7-1.6 5.5 0 1.8-1.6 3.7-1.6 5.5 0"/><path d="M6.5 13.5V8.8c1.8-1.6 3.7-1.6 5.5 0 1.8-1.6 3.7-1.6 5.5 0v4.7"/><path d="M12 8.8v4.7"/>',
    board: '<rect x="3.5" y="4" width="17" height="12.5" rx="1.8"/><path d="M8 16.5 6.6 20.5M16 16.5l1.4 4"/><path d="M7 8h5M7 11h3.5"/><rect x="14" y="7.5" width="3.5" height="4.5" rx=".6"/>',
    card: '<rect x="4.5" y="6" width="15" height="12" rx="2.5"/><path d="M8 10h8M8 13.5h4.5"/>',
    headline: '<path d="M4.5 7.5h15"/><path d="M4.5 12h10"/><path d="M4.5 16.5h7"/>'
  };
  var PIN = '<circle class="cb-s13-pin__head" cx="12" cy="11.5" r="8"/><circle class="cb-s13-pin__hi" cx="9.4" cy="8.9" r="2.2"/>';
  function icon(name, cls) {
    var s = document.createElementNS(SVGNS, "svg");
    s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true"); s.setAttribute("focusable", "false");
    s.setAttribute("class", "cb-ico" + (cls ? " " + cls : ""));
    host.setAuthoredMarkup(s, name === "pin" ? PIN : ICONS[name]);            // constant, authored markup only
    return s;
  }
  /* Shared input reports modality, including native Tab, so this stop does not intercept keys. */
  function keyboardMode() {
    var root = document.querySelector('[data-game="community-builders"]');
    return !!(root && root.dataset && (root.dataset.input === "keyboard" || root.dataset.input === "gamepad"));
  }

  CB.register({ id: ID, steps: STEPS, css: "13-spread-the-word-right.css", run: run });

  /* ── one round ─────────────────────────────────────────────────────── */
  function run(api, stop) {
    var h = api.h;
    document.title = T.title;
    var round = newRound(api);
    var tray = round.cards.slice();          // tray order; a card on the poster leaves a dashed gap here
    var viewPhase = "intro", displayedAnim = null, displayedDrop = false;
    var slots = [null, null, null];          // { card, src, date, at (tray index) }
    var head = null, firstHead = null, share = null, dropped = false, anim = null, done = false, holdUntil = 0, keyboardActivation = false;
    document.addEventListener("click", function (event) { keyboardActivation = event.detail === 0; }, true);
    /* a tap re-draws the board and moves things under the finger: for 300 ms the second tap of a double tap is ignored, so it never lands
       on a control that just appeared or moved there (Swap under Check the date, the next slot under Take it off, See my score). Placing
       cards is never held: its second tap lands on the dashed outline, so a child can tap cards as fast as they like. */
    function hold() { holdUntil = Date.now() + 300; }
    function busy() { return !keyboardActivation && Date.now() < holdUntil; }

    function tagName(tag) { return tag === "hope" ? T.hope : T.worry; }
    function filled() { return slots.filter(Boolean).length; }
    function needsCheck() { return slots.some(function (s) { return s && (!s.src || !s.date); }); }
    function coachText() {
      if (filled() < 3) return T.tap;
      if (needsCheck()) return T.checkEach;
      if (head === null) return T.pickHead;
      return T.readyPin;
    }
    function onPoster(i) { return slots.some(function (s) { return s && s.at === i; }); }
    function board(kids, cls) { return h("div", { "class": "cb-board cb-s13" + (cls ? " " + cls : "") }, kids); }
    function hud(i) { return api.stopHud(stop, STEPS, i, T.step(i + 1)); }
    function tagChip(tag) {
      return h("span", { "class": "cb-s13-tag", "data-tag": tag }, [tag === "hope" ? api.ico("sun") : icon("umbrella"), h("span", { text: tagName(tag) })]);
    }
    function dateOf(c) { return tx(SRC[c.src].date); }
    function stampLine(c) { return c.kind === "rumor" ? T.noDate : c.kind === "old" ? T.oldLine : T.upToDate; }
    /* the lowest visible line above the sticky action bar (the bar's height changes with the screen and the language) */
    function floorY(el) {
      var bar = document.querySelector(".cb-s13-bar"), b = bar && !(el && bar.contains(el)) ? bar.getBoundingClientRect() : null;
      return (b && b.height ? b.top : window.innerHeight) - 12;
    }
    function reveal(el, always) {             // scroll a control into view when focus moved somewhere the player cannot see
      if (!el || !(keyboardMode() || always)) return;
      var r = el.getBoundingClientRect();
      if (r.top < 8 || r.bottom > floorY(el)) el.scrollIntoView({ block: "center", behavior: api.REDUCED ? "auto" : "smooth" });
    }
    /* the smallest scroll that keeps el (and topEl above it) clear of the sticky bar: feedback and the tapped control never hide under it */
    function keep(el, topEl) {
      if (!el || !el.getBoundingClientRect) return;
      var r = el.getBoundingClientRect(), t = (topEl || el).getBoundingClientRect().top, d = 0;
      if (!r.height) return;
      if (r.bottom > floorY(el)) d = r.bottom - floorY(el);
      if (t - d < 12) d = t - 12;                          // never push the top off the screen
      if (Math.abs(d) < 2) return;
      var fs = document.fullscreenElement || document.webkitFullscreenElement, sc = fs && fs.contains(el) ? fs : window;
      sc.scrollBy({ top: d, behavior: api.REDUCED ? "auto" : "smooth" });
    }
    /* on a narrow stage the poster sits above the tray and grows with every card: keep the tray still under the finger */
    function anchor(sel) {
      var el = document.querySelector(sel), t = el ? el.getBoundingClientRect().top : null;
      return function () {
        var e2 = document.querySelector(sel); if (t === null || !e2) return;
        var d = e2.getBoundingClientRect().top - t; if (Math.abs(d) < 1) return;
        var fs = document.fullscreenElement || document.webkitFullscreenElement, sc = fs && fs.contains(e2) ? fs : window;
        sc.scrollBy({ top: d, behavior: "instant" });
      };
    }
    function focused() { return document.activeElement; }
    function still(el, isNew) { if (el && !isNew) el.classList.add("is-still"); return el; }   // feedback that is already there does not rise again

    /* the painted school (the clock-tower building, with the town library): a storybook notice board stands where the poster goes, with its name */
    var BOARD = '<ellipse class="sh" cx="32" cy="58.5" rx="22" ry="2.8"/><rect class="wdd" x="15" y="42" width="4.5" height="16" rx="1"/><rect class="wdd" x="44.5" y="42" width="4.5" height="16" rx="1"/>' +
      '<rect class="wd" x="6" y="11" width="52" height="34" rx="3"/><rect class="n crk" x="10.5" y="15.5" width="43" height="25" rx="1.5"/><path class="rd" d="M2.5 13L32 4l29.5 9z"/>' +
      '<path class="pp" d="M14 19l9 .5-.6 10-9-.5z"/><path class="yl" d="M41 20l9-.8.9 10-9 .8z"/><circle class="rd" cx="18.5" cy="19.6" r="1.6"/><circle class="rd" cx="45.5" cy="20" r="1.6"/>';
    function mark() { return h("span", { "class": "cb-s13-mark", "aria-hidden": "true" }, [h("span", { "class": "cb-story-obj" }, [api.story(BOARD)]), h("span", { "class": "cb-story-tag", text: T.boardTag })]); }

    /* ── the poster: real text on white paper ───────────────────────── */
    function sticky(c, isNew) {
      if (c.kind === "rumor") return h("p", { "class": "cb-s13-sticky is-empty" + (isNew ? " is-new" : "") }, [icon("note"), h("span", { text: T.noSrc })]);
      return h("p", { "class": "cb-s13-sticky" + (isNew ? " is-new" : "") }, [icon("note"), h("span", { text: T.source(tx(SRC[c.src].name)) })]);
    }
    function stamp(c, isNew, swapBtn) {
      var k = c.kind === "rumor" ? "none" : c.kind === "old" ? "old" : "now";
      var ring = h("span", { "class": "cb-s13-stamp__ring", "aria-hidden": k === "none" ? "true" : null }, k === "none" ? [] : [h("span", { text: dateOf(c) })]);
      return h("div", { "class": "cb-s13-stamp" + (isNew ? " is-new" : ""), "data-k": k }, [ring,
        h("div", { "class": "cb-s13-stamp__txt" }, [h("p", { text: stampLine(c) }), swapBtn || null])]);
    }
    function actBtn(kind, i, label, ic, used, onTap, cls) {
      return h("button", { type: "button", "class": "cb-s13-act" + (cls ? " " + cls : "") + (used ? " is-used" : ""), "data-s13act": kind + "-" + i,
        "aria-label": T.at(label, i + 1), onclick: onTap }, [used ? api.ico("check") : icon(ic), h("span", { text: label })]);
    }
    function slotEl(i, mode) {
      var s = slots[i], n = i + 1, lid = "cb-s13-slot-" + (++uid);
      if (!s) return h("li", { "class": "cb-s13-slot is-empty" }, [h("p", { "class": "cb-s13-slot__empty" }, [icon("card"), h("span", { text: T.slot(n) })])]);
      var c = s.card, a = anim && anim.i === i ? anim.what : null, kids = [];
      kids.push(h("div", { "class": "cb-s13-slot__top" }, [h("p", { "class": "cb-s13-words", text: c.text }), tagChip(c.tag)]));
      var ev = [];
      if (s.src) ev.push(sticky(c, a === "src"));
      if (s.date) ev.push(stamp(c, a === "date" || a === "swap",
        mode === "build" && c.kind === "old" ? actBtn("swap", i, T.swap, "swap", false, function () { doSwap(i); }, "cb-s13-act--swap") : null));
      if (ev.length) kids.push(h("div", { "class": "cb-s13-ev" }, ev));
      if (mode === "build" && c.kind === "rumor" && (s.src || s.date)) kids.push(h("div", { "class": "cb-s13-rumor" }, [still(api.fb(T.rumor, false), a === "src" || a === "date")]));
      if (mode === "build") kids.push(h("div", { "class": "cb-s13-acts" }, [
        actBtn("src", i, T.addSrc, "note", s.src, function () { doSource(i); }),
        actBtn("date", i, T.checkDate, "calendar", s.date, function () { doDate(i); }),
        actBtn("off", i, T.takeOff, "off", false, function () { doOff(i); }, "cb-s13-act--off")]));
      return h("li", { "class": "cb-s13-slot" + (a === "place" || a === "swap" ? " is-new" : ""), role: "group", "aria-labelledby": lid }, [
        h("span", { "class": "cb-s13-slot__n", "aria-hidden": "true", text: String(n) }),
        h("span", { "class": "cb-vh", id: lid, text: T.slot(n) }),
        h("div", { "class": "cb-s13-slot__body" }, kids)]);
    }
    function poster(mode) {
      var hl = head === null
        ? h("div", { "class": "cb-s13-hl is-empty", "aria-hidden": "true" }, [icon("headline"), h("span", { text: T.heads })])
        : h("p", { "class": "cb-s13-hl" + (anim && anim.what === "head" ? " is-new" : "") , text: tx(HEADS[head].t) });
      var kids = [hl, h("ol", { "class": "cb-s13-slots" }, [0, 1, 2].map(function (i) { return slotEl(i, mode); }))];
      if (mode !== "build" && (share || mode === "mini")) kids.push(h("span", { "class": "cb-s13-pins", "aria-hidden": "true" }, [1, 2, 3, 4].map(function (k) {
        return h("span", { "class": "cb-s13-pin", "data-pin": String(k) }, [icon("pin")]);
      })));
      return h("div", { "class": "cb-s13-poster cb-s13-poster--" + mode + (mode !== "build" && (share || mode === "mini") ? " is-pinned" : "") }, kids);
    }

    /* ── intro: the School, where the library keeps its board ───────── */
    function intro() {
      viewPhase = "intro";
      var scene = api.crop(SCHOOL, "cb-s13-scene", [mark()]);
      var legend = h("ul", { "class": "cb-s13-legend" }, [[icon("note"), T.addSrc], [icon("calendar"), T.checkDate]].map(function (x) {
        return h("li", null, [x[0], h("span", { text: x[1] })]);
      }));
      api.screen([api.stopHud(stop, null), board([h("div", { "class": "cb-s13-intro" }, [
        h("figure", { "class": "cb-s13-intro__art" }, [scene]),
        h("div", { "class": "cb-s13-intro__copy" }, [h("p", { "class": "cb-s13-intro__lead", text: T.intro }), legend,
          h("div", { "class": "cb-row" }, [api.btn(T.start, "cb-btn--go cb-btn--big", function () { hold(); build(); api.frame(); }, "go", true)])])])])]);
      api.frame();
    }

    /* ── step 1: build the poster ───────────────────────────────────── */
    function trayItem(c, i) {
      if (onPoster(i)) {                   // the dashed outline where the card was; an invisible copy keeps its size
        return h("li", { "class": "cb-s13-gap", "aria-hidden": "true" }, [h("span", { "class": "cb-s13-card cb-s13-card--ghost" }, [h("span", { "class": "cb-s13-card__w", text: c.text }), tagChip(c.tag)])]);
      }
      var wait = filled() === 3;
      return h("li", null, [h("button", { type: "button", "class": "cb-s13-card", "data-s13card": String(i), "aria-label": T.card(c.text, tagName(c.tag)),
        "aria-disabled": wait ? "true" : null, onclick: function () { place(i); } }, [h("span", { "class": "cb-s13-card__w", text: c.text }), tagChip(c.tag)])]);
    }
    function headBtn(k) {
      var on = head === k;
      return h("li", null, [h("button", { type: "button", "class": "cb-s13-head", "data-s13head": String(k), "aria-pressed": on ? "true" : "false",
        onclick: function () { pickHead(k); } }, [h("span", { "class": "cb-s13-head__dot", "aria-hidden": "true" }, [on ? api.ico("check") : null]), h("span", { text: tx(HEADS[k].t) })])]);
    }
    function dots() {
      var n = filled(), d = [0, 1, 2].map(function (i) { return h("i", { "class": i < n ? "is-on" : null }, [i < n ? api.ico("check") : icon("card")]); });
      d.push(h("i", { "class": "cb-s13-dots__hl" + (head !== null ? " is-on" : "") }, [head !== null ? api.ico("check") : icon("headline")]));
      return h("span", { "class": "cb-s13-dots", "aria-hidden": "true" }, d);
    }
    function build(focusSel) {
      viewPhase = "build"; displayedAnim = anim;
      var ready = filled() === 3 && head !== null, d = dots();
      /* the bar says in words what is done and what is missing; a tap on the faded Next shows why it waits */
      var progLine = T.prog(filled(), head !== null);
      if (filled() === 3 && needsCheck()) progLine += " " + T.checkEach;
      var why = h("p", { "class": "cb-msg cb-s13-prog", role: "status", text: progLine });
      var tid = "cb-s13-tray-" + (++uid), hid = "cb-s13-heads-" + uid;
      var note = head !== null ? still(api.fb(HEADS[head].tells ? T.good : T.sell, HEADS[head].tells), anim && anim.what === "head") : null;
      var next = api.btn(T.next, "cb-btn--go cb-btn--big cb-s13-next", function () {
        if (busy()) return;
        if (filled() === 3 && head !== null) { hold(); return step2(); }
        d.classList.remove("is-nudge"); void d.offsetWidth; d.classList.add("is-nudge");
        why.textContent = T.prog(filled(), head !== null) + ". " + coachText();
        why.classList.remove("is-nudge"); void why.offsetWidth; why.classList.add("is-nudge");
      }, "go", true);
      next.setAttribute("data-s13next", "");
      if (!ready) next.setAttribute("aria-disabled", "true");
      api.screen([hud(0), board([
        api.coach(coachText(), "flyer"),
        h("div", { "class": "cb-s13-play" }, [
          h("div", { "class": "cb-s13-wall" }, [api.crop(BAND, "cb-s13-band", [mark()]), poster("build")]),
          h("div", { "class": "cb-s13-side" }, [
            h("section", { "class": "cb-s13-tray", "aria-labelledby": tid }, [h("h3", { "class": "cb-s13-h", id: tid }, [icon("card"), h("span", { text: T.cards })]),
              h("ul", { "class": "cb-s13-cards", "data-cb-choices": "" }, tray.map(trayItem))]),
            h("section", { "class": "cb-s13-heads", "aria-labelledby": hid }, [h("h3", { "class": "cb-s13-h", id: hid }, [icon("headline"), h("span", { text: T.heads })]),
              h("ul", { "class": "cb-s13-headlist", "data-cb-choices": "" }, round.heads.map(headBtn)), note ? h("div", { "class": "cb-s13-note" }, [note]) : null])])]),
        h("div", { "class": "cb-actions cb-s13-bar" }, [h("div", { "class": "cb-actions__info" }, [d, why]), next])], "cb-s13--build")], focusSel || null);
      anim = null;
    }
    function place(i) {
      if (busy() || onPoster(i)) return;
      var e = slots.indexOf(null);
      if (e < 0) return;                                   // three cards are up: the other cards wait
      var back = anchor(".cb-s13-cards > li:nth-child(" + (i + 1) + ")");
      slots[e] = { card: tray[i], src: false, date: false, at: i };
      anim = { i: e, what: "place" };
      var nxt = null;
      if (filled() < 3) for (var k = 1; k < tray.length; k++) { var j = (i + k) % tray.length; if (!onPoster(j)) { nxt = j; break; } }
      if (nxt !== null) { build('[data-s13card="' + nxt + '"]'); back(); if (keyboardMode()) keep(focused()); }
      else { build('[data-s13act="src-' + slots.findIndex(function (s) { return s && !s.src; }) + '"]'); back(); reveal(focused(), true); }
      api.say(T.inSlot(e + 1));
    }
    function doSource(i) {
      var s = slots[i]; if (!s || busy()) return;
      hold();
      if (!s.src) { s.src = true; anim = { i: i, what: "src" }; }
      build('[data-s13act="src-' + i + '"]');
      keep(focused());                                     // the new tag pushes the buttons down: keep them above the bar
      api.say(s.card.kind === "rumor" ? T.noSrc + " " + T.rumor : T.srcAdded + ". " + T.source(tx(SRC[s.card.src].name)));
    }
    function doDate(i) {
      var s = slots[i]; if (!s || busy()) return;
      hold();
      if (!s.date) { s.date = true; anim = { i: i, what: "date" }; }
      build('[data-s13act="' + (s.card.kind === "old" ? "swap" : "date") + "-" + i + '"]');
      keep(s.card.kind === "old" ? document.querySelector('[data-s13act="date-' + i + '"]') : focused(), focused());
      api.say(s.card.kind === "rumor" ? T.noDate + " " + T.rumor : dateOf(s.card) + ". " + stampLine(s.card));
    }
    function doSwap(i) {
      var s = slots[i]; if (!s || s.card.kind !== "old" || busy()) return;
      hold();
      var o = OLDS[s.card.idx], nc = { key: "n" + s.card.idx, kind: "fact", tag: o.tag, text: tx(o.nt), src: o.src };
      tray[s.at] = nc;                                     // the new fact takes the same slot and tag; its date counts as checked
      slots[i] = { card: nc, src: s.src, date: true, at: s.at };
      anim = { i: i, what: "swap" };
      build('[data-s13act="' + (s.src ? "date" : "src") + "-" + i + '"]');
      keep(focused());
      api.say(T.inSlot(i + 1) + ". " + nc.text + " " + dateOf(nc) + ". " + T.upToDate);
    }
    function doOff(i) {
      var s = slots[i]; if (!s || busy()) return;
      hold();
      slots[i] = null;                                     // the card goes back to the tray, plain again
      build('[data-s13card="' + s.at + '"]');
      if (keyboardMode()) keep(focused());                            // a touch player keeps looking at the poster
    }
    function pickHead(k) {
      if (busy()) return;
      hold();
      head = k; if (firstHead === null) firstHead = k;     // the +10 comes from the first headline tapped this round
      anim = { what: "head" };
      build('[data-s13head="' + k + '"]');
      keep(document.querySelector(".cb-s13-note"), focused());   // the headline note sits under the tiles: never under the bar
      api.say(HEADS[k].tells ? T.good : T.sell);
    }

    /* ── step 2: ask a grown-up where to share it ───────────────────── */
    function shareBtn(x) {
      var on = share === x.id;
      return h("li", null, [h("button", { type: "button", "class": "cb-s13-share", "data-s13share": x.id, "aria-pressed": on ? "true" : "false",
        onclick: function () { pickShare(x.id); } }, [h("span", { "class": "cb-s13-share__ic" }, [icon(x.icon)]), h("span", { "class": "cb-s13-share__t", text: tx(x.t) }),
          h("span", { "class": "cb-s13-share__ok", "aria-hidden": "true" }, [api.ico("check")])])]);
    }
    function step2(focusSel, restoreDrop) {
      viewPhase = "share";
      var x = SHARES.filter(function (s) { return s.id === share; })[0];
      var drop = restoreDrop === undefined ? !!share && !dropped : !!restoreDrop; displayedDrop = drop; if (share) dropped = true;
      var wall = h("div", { "class": "cb-s13-wall cb-s13-wall--share" + (drop ? " is-drop" : "") }, [api.crop(BAND, "cb-s13-band", [mark()]), poster("share"),
        share ? h("p", { "class": "cb-s13-aha", id: "cb-s13-aha" }, [api.ico("bulb"), h("span", { text: T.aha })]) : null]);
      api.screen([hud(1), board([
        h("p", { "class": "cb-coach cb-s13-q", tabindex: "-1" }, [api.ico("family"), h("span", { text: T.ask })]),
        h("div", { "class": "cb-s13-play cb-s13-play--share" }, [wall, h("div", { "class": "cb-s13-side" }, [h("ul", { "class": "cb-s13-shares", "data-cb-choices": "" }, SHARES.map(shareBtn))])]),
        x ? h("div", { "class": "cb-actions cb-s13-bar" }, [h("div", { "class": "cb-actions__info" }, [api.fb(tx(x.line), true)]), see()]) : null], "cb-s13--share")],
        focusSel || ".cb-s13-q");
      if (drop) keep(document.getElementById("cb-s13-aha"));   // the poster drops onto the board: its aha line comes into view above the sticky bar
      if (!focusSel) api.frame();
    }
    function see() {
      var b = api.btn(T.see, "cb-btn--go cb-btn--big", function () { if (!done && !busy()) { done = true; finish(); } }, "go", true);
      b.setAttribute("data-s13see", "");
      return b;
    }
    function pickShare(id) {
      if (busy()) return;
      share = id; hold();
      step2("[data-s13see]");                              // as in Stops 3 and 4, focus moves to the next step once the choice is made
      var x = SHARES.filter(function (s) { return s.id === id; })[0];
      api.say(tx(x.line) + " " + T.aha);
    }

    /* ── score: the finished poster only ────────────────────────────── */
    function finish() {
      viewPhase = "result";
      var cards = slots.map(function (s) { return s; });
      var rumorOn = cards.some(function (s) { return s.card.kind === "rumor"; });
      var nSrc = cards.filter(function (s) { return s.card.kind === "fact" && s.src; }).length;      // up-to-date checked fact with its source
      var nDate = cards.filter(function (s) { return s.card.kind !== "rumor" && s.date; }).length;
      var hope = cards.some(function (s) { return s.card.tag === "hope"; }), worry = cards.some(function (s) { return s.card.tag === "worry"; });
      var tells = firstHead !== null && HEADS[firstHead].tells;
      var score = 15 * nSrc + 5 * nDate + (hope && worry ? 20 : 0) + (tells ? 10 : 0) + (rumorOn ? 0 : 10);
      var facts = cards.filter(function (s) { return s.card.kind !== "rumor"; });
      var tip = rumorOn ? T.tipRumor
        : facts.some(function (s) { return !s.src; }) ? T.tipSrc
        : facts.some(function (s) { return !s.date || s.card.kind === "old"; }) ? T.tipDate
        : !(hope && worry) ? T.tipMix
        : !tells ? T.tipHead : T.tip100;
      var info = api.saveRound(stop.id, score, { allSources: nSrc === 3, processBadge: nSrc === 3 && nDate === 3 ? "process-13" : null, lastRumor: round.rumor, lastOld: round.old, lastFacts: round.facts });   // pool codes only, never the poster
      api.endPlay();
      var card = api.scoreCard(stop, score, info, tip, T.can, T.real);
      var can = card.querySelector(".cb-card__can");
      if (can) can.parentNode.insertBefore(h("div", { "class": "cb-s13-mini" }, [poster("mini")]), can.nextSibling);
      var gu = api.btn(T.gu, "cb-btn--quiet", function () {
        api.dialog(api.W.grownups, [h("div", { "class": "cb-dlg__body" }, [h("p", { text: T.guText })])], gu);
      }, "family");
      var btns = api.cardButtons(stop.id, api.restart(stop.id), gu), shown = Date.now();
      btns.addEventListener("click", function (e) {           // the second tap of a double tap on See my score never lands on Play again
        if (e.detail > 0 && Date.now() - shown < 400) { e.stopPropagation(); e.preventDefault(); }
      }, true);
      api.finishRound(stop.id, card, btns);
      api.say(api.W.score + " " + score + " / 100");
    }

    if (api.setController) api.setController({
      snapshot: function () { return { v: 2, phase: viewPhase, tray: tray.map(function (c) { return c.key; }), slots: slots.map(function (s) { return s ? { at: s.at, key: s.card.key, src: s.src, date: s.date } : null; }),
        head: head, firstHead: firstHead, share: share, dropped: dropped, displayedAnim: displayedAnim, displayedDrop: displayedDrop }; },
      restore: function (saved) {
        if (!saved || saved.v !== 2 || !Array.isArray(saved.slots) || saved.slots.length !== 3) return false;
        tray = saved.tray.map(function (key, at) { if (key.charAt(0) !== "n") return tray[at]; var o = OLDS[Number(key.slice(1))]; return { key: key, kind: "fact", tag: o.tag, text: tx(o.nt), src: o.src }; });
        slots = saved.slots.map(function (s) { if (!s) return null; var c = tray[s.at];
          if (s.key && s.key.charAt(0) === "n") { var index = Number(s.key.slice(1)), o = OLDS[index]; c = { key: s.key, kind: "fact", tag: o.tag, text: tx(o.nt), src: o.src }; }
          return { at: s.at, card: c, src: !!s.src, date: !!s.date };
        });
        head = saved.head; firstHead = saved.firstHead; share = saved.share; dropped = !!saved.dropped; anim = saved.displayedAnim; displayedAnim = saved.displayedAnim; displayedDrop = !!saved.displayedDrop; done = saved.phase === "result";
        if (saved.phase === "result") finish(); else if (saved.phase === "share") step2(null, saved.displayedDrop); else if (saved.phase === "build") build(); else intro();
        return true;
      }
    });

    intro();
  }

  /* a new random round: 2 hope and 2 worry checked facts, 1 old fact and 1 rumor, shuffled; the rumor and the old fact
     are never last round's (and in Team challenge, never Team 1's); checked facts not shown last round come first */
  function newRound(api) {
    var r = api.rec(ID) || {}, tm = api.team();
    var avoid = tm && tm.phase === "B" && tm.s13 ? tm.s13 : {};
    function pickNot(n, bad) {
      var pool = [];
      for (var i = 0; i < n; i++) if (bad.indexOf(i) < 0) pool.push(i);
      return api.pick(pool.length ? pool : [0, 1, 2, 3]);
    }
    var rumor = pickNot(RUMORS.length, [r.lastRumor, avoid.rumor]);
    var old = pickNot(OLDS.length, [r.lastOld, avoid.old]);
    if (tm && tm.phase === "A") tm.s13 = { rumor: rumor, old: old };
    var last = r.lastFacts || [];
    function two(ids) {
      var fresh = api.shuffle(ids.filter(function (i) { return last.indexOf(i) < 0; })), seen = api.shuffle(ids.filter(function (i) { return last.indexOf(i) >= 0; }));
      return fresh.concat(seen).slice(0, 2);
    }
    var facts = two([0, 1, 2, 3]).concat(two([4, 5, 6, 7]));
    var cards = facts.map(function (i) { var f = FACTS[i]; return { key: "f" + i, kind: "fact", tag: f.tag, text: tx(f.t), src: f.src }; });
    var o = OLDS[old];
    cards.push({ key: "o" + old, kind: "old", idx: old, tag: o.tag, text: tx(o.t), src: "first" });
    cards.push({ key: "r" + rumor, kind: "rumor", tag: RUMORS[rumor].tag, text: tx(RUMORS[rumor].t), src: null });
    return { rumor: rumor, old: old, facts: facts, cards: api.shuffle(cards), heads: api.shuffle([0, 1, 2, 3]) };
  }

    return definition;
  }
  if (host.defineStop) host.defineStop(factory);
  else host.register(factory({ document: document, window: window, Date: Date, setTimeout: setTimeout, clearTimeout: clearTimeout, requestAnimationFrame: requestAnimationFrame, cancelAnimationFrame: typeof cancelAnimationFrame === "function" ? cancelAnimationFrame : function () {} }));
})();
