/* Community Builders of Pecan Grove · Stop 9 · Include Every Voice / Incluye todas las voces
   Five chairs stayed empty at the last library meeting. The player opens each chair, reads who was
   missing and why, and taps one of six ways that would really help that person join.
   Score: process only (+8 for each chair opened; +12 if the first way tapped helps, +6 if the second does).
   Never a side, never speed. Words are exact from the stop spec (09 - include-every-voice.md).
   No network, no inputs, no inline styles: every colour lives in 09-include-every-voice.css. */
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
  var ID = "include-every-voice";

  /* ── words (exact) ─────────────────────────────────────────────────── */
  var WORDS = {en:window.CBLocale.read("stop-09", "en", {en:{"WORDS.filled":function (n) { return window.CBLocale.part("stop-09", "en", "WORDS.filled", 0) + n + window.CBLocale.part("stop-09", "en", "WORDS.filled", 1); },"WORDS.chair":function (n) { return window.CBLocale.part("stop-09", "en", "WORDS.chair", 0) + n + window.CBLocale.part("stop-09", "en", "WORDS.chair", 1); },"WORDS.ask":function (n) { return window.CBLocale.part("stop-09", "en", "WORDS.ask", 0) + n + window.CBLocale.part("stop-09", "en", "WORDS.ask", 1); },"WORDS.way":function (w) { return window.CBLocale.part("stop-09", "en", "WORDS.way", 0) + w; },"WORDS.missing":function (n) { return n + window.CBLocale.part("stop-09", "en", "WORDS.missing", 0); },"WORDS.right":function (n) { return window.CBLocale.part("stop-09", "en", "WORDS.right", 0) + n + window.CBLocale.part("stop-09", "en", "WORDS.right", 1); },"WORDS.wrong1":function (hint) { return window.CBLocale.part("stop-09", "en", "WORDS.wrong1", 0) + hint; },"WORDS.tipOpen":function (n) { return window.CBLocale.part("stop-09", "en", "WORDS.tipOpen", 0) + n + window.CBLocale.part("stop-09", "en", "WORDS.tipOpen", 1); },"WORDS.tipRead":function (n) { return window.CBLocale.part("stop-09", "en", "WORDS.tipRead", 0) + n + window.CBLocale.part("stop-09", "en", "WORDS.tipRead", 1); }},es:{"WORDS.filled":function (n) { return window.CBLocale.part("stop-09", "es", "WORDS.filled", 0) + n + window.CBLocale.part("stop-09", "es", "WORDS.filled", 1); },"WORDS.chair":function (n) { return window.CBLocale.part("stop-09", "es", "WORDS.chair", 0) + n + window.CBLocale.part("stop-09", "es", "WORDS.chair", 1); },"WORDS.ask":function (n) { return window.CBLocale.part("stop-09", "es", "WORDS.ask", 0) + n + window.CBLocale.part("stop-09", "es", "WORDS.ask", 1); },"WORDS.way":function (w) { return window.CBLocale.part("stop-09", "es", "WORDS.way", 0) + w; },"WORDS.missing":function (n) { return window.CBLocale.part("stop-09", "es", "WORDS.missing", 0) + n; },"WORDS.right":function (n) { return window.CBLocale.part("stop-09", "es", "WORDS.right", 0) + n + window.CBLocale.part("stop-09", "es", "WORDS.right", 1); },"WORDS.wrong1":function (hint) { return window.CBLocale.part("stop-09", "es", "WORDS.wrong1", 0) + hint; },"WORDS.tipOpen":function (n) { return window.CBLocale.part("stop-09", "es", "WORDS.tipOpen", 0) + n + window.CBLocale.part("stop-09", "es", "WORDS.tipOpen", 1); },"WORDS.tipRead":function (n) { return window.CBLocale.part("stop-09", "es", "WORDS.tipRead", 0) + n + window.CBLocale.part("stop-09", "es", "WORDS.tipRead", 1); }}}).WORDS,es:window.CBLocale.read("stop-09", "es", {en:{"WORDS.filled":function (n) { return window.CBLocale.part("stop-09", "en", "WORDS.filled", 0) + n + window.CBLocale.part("stop-09", "en", "WORDS.filled", 1); },"WORDS.chair":function (n) { return window.CBLocale.part("stop-09", "en", "WORDS.chair", 0) + n + window.CBLocale.part("stop-09", "en", "WORDS.chair", 1); },"WORDS.ask":function (n) { return window.CBLocale.part("stop-09", "en", "WORDS.ask", 0) + n + window.CBLocale.part("stop-09", "en", "WORDS.ask", 1); },"WORDS.way":function (w) { return window.CBLocale.part("stop-09", "en", "WORDS.way", 0) + w; },"WORDS.missing":function (n) { return n + window.CBLocale.part("stop-09", "en", "WORDS.missing", 0); },"WORDS.right":function (n) { return window.CBLocale.part("stop-09", "en", "WORDS.right", 0) + n + window.CBLocale.part("stop-09", "en", "WORDS.right", 1); },"WORDS.wrong1":function (hint) { return window.CBLocale.part("stop-09", "en", "WORDS.wrong1", 0) + hint; },"WORDS.tipOpen":function (n) { return window.CBLocale.part("stop-09", "en", "WORDS.tipOpen", 0) + n + window.CBLocale.part("stop-09", "en", "WORDS.tipOpen", 1); },"WORDS.tipRead":function (n) { return window.CBLocale.part("stop-09", "en", "WORDS.tipRead", 0) + n + window.CBLocale.part("stop-09", "en", "WORDS.tipRead", 1); }},es:{"WORDS.filled":function (n) { return window.CBLocale.part("stop-09", "es", "WORDS.filled", 0) + n + window.CBLocale.part("stop-09", "es", "WORDS.filled", 1); },"WORDS.chair":function (n) { return window.CBLocale.part("stop-09", "es", "WORDS.chair", 0) + n + window.CBLocale.part("stop-09", "es", "WORDS.chair", 1); },"WORDS.ask":function (n) { return window.CBLocale.part("stop-09", "es", "WORDS.ask", 0) + n + window.CBLocale.part("stop-09", "es", "WORDS.ask", 1); },"WORDS.way":function (w) { return window.CBLocale.part("stop-09", "es", "WORDS.way", 0) + w; },"WORDS.missing":function (n) { return window.CBLocale.part("stop-09", "es", "WORDS.missing", 0) + n; },"WORDS.right":function (n) { return window.CBLocale.part("stop-09", "es", "WORDS.right", 0) + n + window.CBLocale.part("stop-09", "es", "WORDS.right", 1); },"WORDS.wrong1":function (hint) { return window.CBLocale.part("stop-09", "es", "WORDS.wrong1", 0) + hint; },"WORDS.tipOpen":function (n) { return window.CBLocale.part("stop-09", "es", "WORDS.tipOpen", 0) + n + window.CBLocale.part("stop-09", "es", "WORDS.tipOpen", 1); },"WORDS.tipRead":function (n) { return window.CBLocale.part("stop-09", "es", "WORDS.tipRead", 0) + n + window.CBLocale.part("stop-09", "es", "WORDS.tipRead", 1); }}}).WORDS};

  /* ── the six ways (exact). Ids are for code only; never shown. ────── */
  var WAYS = [
    { id: "evening", name: window.CBLocale.pair("stop-09","bank.b0001") },
    { id: "interpreter", name: window.CBLocale.pair("stop-09","bank.b0002") },
    { id: "kids", name: window.CBLocale.pair("stop-09","bank.b0003") },
    { id: "recording", name: window.CBLocale.pair("stop-09","bank.b0004") },
    { id: "ride", name: window.CBLocale.pair("stop-09","bank.b0005") },
    { id: "ramp", name: window.CBLocale.pair("stop-09","bank.b0006") }
  ];
  var WAY = {}; WAYS.forEach(function (w) { WAY[w.id] = w; });

  /* ── the eight missing people (exact). nb = one of the six painted neighbors. Theo and Lucía's family have no painted
     portrait yet, so they show their initial in a ring (api.mono), never a symbol in their place. ── */
  var PEOPLE = [
    { id: "nights", nb: "lee", helps: ["evening", "recording"],
      why: window.CBLocale.pair("stop-09","bank.b0007"),
      hint: window.CBLocale.pair("stop-09","bank.b0008") },
    { id: "spanish", ic: "family", name: { en: window.CBLocale.pair("stop-09","bank.b0009")[0], es: window.CBLocale.pair("stop-09","bank.b0009")[1], esCap: window.CBLocale.t("stop-09", LANG, "capitalNames.spanish") }, helps: ["interpreter"],
      why: window.CBLocale.pair("stop-09","bank.b0010"),
      hint: window.CBLocale.pair("stop-09","bank.b0011") },
    { id: "students", nb: "jayden", helps: ["evening", "kids"],
      why: window.CBLocale.pair("stop-09","bank.b0012"),
      hint: window.CBLocale.pair("stop-09","bank.b0013") },
    { id: "harvest", nb: "johnson", helps: ["recording"],
      why: window.CBLocale.pair("stop-09","bank.b0014"),
      hint: window.CBLocale.pair("stop-09","bank.b0015") },
    { id: "ride", nb: "ruth", helps: ["ride"],
      why: window.CBLocale.pair("stop-09","bank.b0016"),
      hint: window.CBLocale.pair("stop-09","bank.b0017") },
    { id: "stairs", ic: "wheelchair", name: { en: window.CBLocale.pair("stop-09","bank.b0018")[0], es: window.CBLocale.pair("stop-09","bank.b0018")[1], esCap: window.CBLocale.t("stop-09", LANG, "capitalNames.stairs") }, helps: ["ramp"],
      why: window.CBLocale.pair("stop-09","bank.b0019"),
      hint: window.CBLocale.pair("stop-09","bank.b0020") },
    { id: "shop", nb: "patel", helps: ["evening", "recording"],
      why: window.CBLocale.pair("stop-09","bank.b0021"),
      hint: window.CBLocale.pair("stop-09","bank.b0022") },
    { id: "babysitter", nb: "ana", helps: ["kids", "recording"],
      why: window.CBLocale.pair("stop-09","bank.b0023"),
      hint: window.CBLocale.pair("stop-09","bank.b0024") }
  ];
  var PERSON = {}; PEOPLE.forEach(function (p) { PERSON[p.id] = p; });
  var IDS = PEOPLE.map(function (p) { return p.id; });

  /* ── authored line icons: 24-unit grid, one 2px round stroke, like the shell's api.IC ── */
  var ICONS = {
    chair: '<path d="M7.5 12.2V4.9a1.4 1.4 0 0 1 1.4-1.4h6.2a1.4 1.4 0 0 1 1.4 1.4v7.3"/><path d="M7.5 7.6h9"/><rect x="5.5" y="12.2" width="13" height="2.8" rx="1.2"/><path d="M7.2 15 6.5 20.5M16.8 15l.7 5.5"/>',
    library: '<path d="M3.5 9.5 12 4.5l8.5 5z"/><path d="M5.5 12v5.5M9.8 12v5.5M14.2 12v5.5M18.5 12v5.5"/><path d="M4.5 17.5h15M3.5 20.5h17"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    stairs: '<path d="M3.5 20.5h4.2v-4.2h4.2v-4.2h4.2V7.9h4.4"/>',
    bubble: '<path d="M5 5.5h14A1.5 1.5 0 0 1 20.5 7v8.5A1.5 1.5 0 0 1 19 17h-7.5L7 20.5V17H5a1.5 1.5 0 0 1-1.5-1.5V7A1.5 1.5 0 0 1 5 5.5z"/>',
    evening: '<path d="M13.6 8.7A5.4 5.4 0 1 1 7.7 2.8a4.2 4.2 0 0 0 5.9 5.9z"/><circle cx="16.5" cy="16.5" r="5"/><path d="M16.5 14v2.5l1.8 1.2"/>',
    interpreter: '<path d="M3.5 13.5V12a8.5 8.5 0 0 1 17 0v1.5"/><rect x="2.5" y="12.5" width="3.5" height="6" rx="1.6"/><rect x="18" y="12.5" width="3.5" height="6" rx="1.6"/><path d="M8.6 7.6h4.6a1 1 0 0 1 1 1v2.4a1 1 0 0 1-1 1h-2.6l-1.9 1.6V12h-.1a1 1 0 0 1-1-1V8.6a1 1 0 0 1 1-1z"/><path d="M11.2 14.6h4.1a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1v1.5l-1.9-1.5h-2.2a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1z"/>',
    kids: '<rect x="2.5" y="14" width="7" height="6.5" rx="1"/><path d="M3.3 14 6 9.2 8.7 14"/><rect x="12.5" y="13" width="9" height="7.5" rx="1.3"/><path d="M14.8 15.8h4.4"/><path d="M15.4 15.8l-.6-5.6 4.4-.6.6 6.2"/>',
    recording: '<rect x="3" y="4.5" width="18" height="12.5" rx="2"/><path d="M10.3 8.4v4.8l4.1-2.4z"/><path d="M8.5 20.5h7M12 17v3.5"/>',
    ride: '<path d="M5.6 17H5a1.5 1.5 0 0 1-1.5-1.5V8A1.5 1.5 0 0 1 5 6.5h10.1c.5 0 .9.2 1.2.6l3.5 4.1c.2.3.4.6.4 1v3.3a1.5 1.5 0 0 1-1.5 1.5h-.3M9.6 17h4.8"/><circle cx="7.6" cy="17" r="2"/><circle cx="16.4" cy="17" r="2"/><path d="M3.5 11h16.2M11 6.5V11"/>',
    ramp: '<path d="M2.5 20.5h19"/><path d="M3.5 20.5 15 14h5.5v6.5"/><path d="M15.5 14V5.5h5v8.5"/><path d="M3.5 17.2 13.6 11.5"/>',
    wheelchair: '<circle cx="11.5" cy="4.4" r="2.2"/><path d="M11 7.8 10.2 13h5.3l2.3 5.2 1.7-.6"/><path d="M11.2 9.8l3.8-.6 1.8-1.9"/><path d="M8.2 11.6a5.4 5.4 0 1 0 7.6 6.6"/>',
    family: '<circle cx="6.5" cy="5.8" r="2.3"/><path d="M3.5 20.5V13.6a3 3 0 0 1 6 0v6.9"/><circle cx="17.5" cy="5.8" r="2.3"/><path d="M14.5 20.5V13.6a3 3 0 0 1 6 0v6.9"/><circle cx="12" cy="11.6" r="1.8"/><path d="M10 20.5v-3.6a2 2 0 0 1 4 0v3.6"/>'
  };
  /* the empty meeting chair, as a storybook object (see .cb-story in cb.css) */
  var CHAIR = '<ellipse class="sh" cx="32" cy="59" rx="19" ry="2.6"/><rect class="wdd" x="18" y="25" width="5" height="14"/><rect class="wdd" x="41" y="25" width="5" height="14"/>' +
    '<rect class="wd" x="17" y="5" width="30" height="22" rx="4"/><path class="ln" d="M25 9.5v13.5M32 9.5v13.5M39 9.5v13.5"/>' +
    '<rect class="wdd" x="15.5" y="44" width="4.5" height="14.5" rx="1"/><rect class="wdd" x="44" y="44" width="4.5" height="14.5" rx="1"/>' +
    '<path class="wd" d="M11.5 38h41l-4 7.5h-33z"/><path class="n rd" d="M16.5 39.6h31l-1.8 3.4H18.3z"/>';
  var SVGNS = "http://www.w3.org/2000/svg";
  function icon(name, cls) {
    var s = document.createElementNS(SVGNS, "svg");
    s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true"); s.setAttribute("focusable", "false");
    s.setAttribute("class", "cb-ico" + (cls ? " " + cls : ""));
    host.setAuthoredMarkup(s, ICONS[name]);                                  // constant, authored markup only
    return s;
  }

  /* painted crops of the town map: the clock-tower building plays the library */
  var CROP = [0.30, 0.20, 0.70, 0.60];            // the play screen: the library and its garden
  var CROP_WIDE = [0.30, 0.205, 0.78, 0.6];       // intro and aha: the library with Main Street beside it
  var DOTS = [null, null, null, null, null];

  function run(api, stop) {
    var L = api.L, h = api.h, T = WORDS[L];
    function t2(p) { return L === "es" ? p[1] : p[0]; }
    document.title = stop.name + " - " + api.W.series;

    function nmP(p) { return p.nb ? api.nm(api.nbById(p.nb)) : p.name[L]; }
    function nmCapP(p) { return p.nb ? api.nmCap(api.nbById(p.nb)) : (L === "es" ? p.name.esCap : p.name.en); }

    /* ── the round: 5 of the 8. The 3 who sat out last time are always in, plus 2 at random. ── */
    var r = api.rec(stop.id) || {}, team = api.team();
    function validPrev(list) {
      if (!list || list.length !== 5) return false;
      var seen = {};
      return list.every(function (id) { if (!PERSON[id] || seen[id]) return false; seen[id] = 1; return true; });
    }
    var prev = team && team.phase === "B" && validPrev(team.s09A) ? team.s09A : validPrev(r.lastPeople) ? r.lastPeople : null;
    var ids = prev ? IDS.filter(function (id) { return prev.indexOf(id) === -1; }).concat(api.shuffle(prev).slice(0, 2)) : api.shuffle(IDS).slice(0, 5);
    ids = api.shuffle(ids);                                     // random chairs
    if (team && team.phase === "A") team.s09A = ids.slice();
    var ways = api.shuffle(WAYS), lastWays = (r.lastWays || []).join(",");
    for (var k = 0; k < 8 && ways.map(function (w) { return w.id; }).join(",") === lastWays; k++) ways = api.shuffle(WAYS);
    var seats = ids.map(function (id) { return { p: PERSON[id], opened: false, tries: [], result: null, fill: null }; });

    /* ── play state ──────────────────────────────────────────────────── */
    var phase = "intro";
    var open = -1, resolved = false, confirming = false, msg = null, freshSeat = -1, freshCard = false;
    var swapAt = 0;                             // when the action bar's button changed role under the finger (Done -> Finish the plan -> Finish)
    function settled(e) { return (e && e.detail === 0) || Date.now() - swapAt > 400; }   // a fast second tap must not fall through to the new button; keys always work
    function nFilled() { return seats.filter(function (s) { return !!s.fill; }).length; }
    function helps(s, wayId) { return s.p.helps.indexOf(wayId) !== -1; }
    function nextEmpty(from) {
      for (var j = 1; j <= 5; j++) { var i = (from + j + 5) % 5; if (!seats[i].fill) return i; }
      return -1;
    }

    /* ── pieces ──────────────────────────────────────────────────────── */
    function avatar(p, cls) {
      if (p.nb) return h("span", { "class": "cb-s09-av" + (cls ? " " + cls : "") }, [api.img(api.nbById(p.nb).img, "", null, true)]);
      return h("span", { "class": "cb-s09-av cb-s09-av--mono" + (cls ? " " + cls : "") }, [api.mono(p.name.en.replace(/^the /, ""))]);
    }
    function badge() { return h("span", { "class": "cb-badge" }, [api.ico("check")]); }
    function place() { return h("p", { "class": "cb-s09-place", "aria-hidden": "true" }, [icon("library"), h("span", { text: T.library })]); }
    function note() {
      var ic = ["clock", "stairs", "bubble"];
      var kids = [h("span", { "class": "cb-s09-note__k", text: T.noteK }), " "];
      T.note.forEach(function (part, i) {                      // reads exactly "Last meeting: 2 pm · upstairs · English only"
        var last = i === T.note.length - 1;                    // the dot ends an item, so a wrapped line never starts with one
        kids.push(h("span", { "class": "cb-s09-note__i" }, [icon(ic[i]), h("span", { text: part }), last ? null : h("span", { "class": "cb-s09-note__dot", text: " · " })]));
      });
      return h("p", { "class": "cb-s09-note" }, kids);
    }
    function seatEl(s, i, live) {
      var filled = !!s.fill, isOpen = live && open === i;
      /* an empty chair is a storybook wooden chair in the lamp light, named on a paper tag; a filled one shows who joined */
      var disc = filled ? h("span", { "class": "cb-s09-chair__disc", "aria-hidden": "true" }, [avatar(s.p), badge()])
        : h("span", { "class": "cb-s09-chair__disc cb-s09-chair__disc--empty cb-story-obj", "aria-hidden": "true" }, [api.story(CHAIR)]);
      var plate = filled ? h("span", { "class": "cb-s09-chair__plate" }, [h("b", { text: nmCapP(s.p) }), h("small", { text: T.joined })])
        : isOpen ? h("span", { "class": "cb-s09-chair__plate", "aria-hidden": "true" }, [h("b", { text: nmCapP(s.p) })])
        : h("span", { "class": "cb-story-tag cb-s09-chair__tag", "aria-hidden": "true", text: T.empty });
      var cls = "cb-s09-chair" + (filled ? " is-filled" : "") + (isOpen ? " is-open" : "") + (filled && i === freshSeat ? " is-new" : "");
      if (!live || filled) return h("li", null, [h("span", { "class": cls }, [disc, plate])]);
      var waiting = open !== -1 && !isOpen;
      return h("li", null, [h("button", { type: "button", "class": cls + (waiting ? " is-wait" : ""), "data-s09-chair": String(i), "aria-label": T.chair(i + 1),
        "aria-expanded": isOpen ? "true" : "false", "aria-controls": isOpen ? "cb-s09-card" : null, "aria-disabled": waiting ? "true" : null,
        onclick: function () { tapChair(i); } }, [disc, plate])]);
    }
    function chairs(live) {
      return h("ol", { "class": "cb-s09-chairs", "data-cb-choices": "", "aria-hidden": live ? null : "true" }, seats.map(function (s, i) { return seatEl(s, i, live); }));
    }
    function room() { return h("div", { "class": "cb-s09-room" }, [api.crop(CROP, "cb-s09-scene", [place()]), note(), chairs(true)]); }
    function stage(kind, card) {                // intro and aha: the room, its chairs, and a card over it
      return h("div", { "class": "cb-s09-stage cb-s09-stage--" + kind }, [api.crop(CROP_WIDE, "cb-s09-scene cb-s09-scene--wide", [place()]), note(), chairs(false), card]);
    }
    function coachLine() {
      if (nFilled() === 5) return h("p", { "class": "cb-s09-unity" }, [api.img("unity", "", null, true), h("strong", { text: T.all })]);
      return h("p", { "class": "cb-coach cb-s09-coach" }, [h("span", { "class": "cb-s09-coach__ic", "aria-hidden": "true" }, [icon("chair")]), h("span", { text: T.instr })]);
    }
    function card(s) {
      var name = nmCapP(s.p);
      return h("section", { "class": "cb-s09-card" + (freshCard ? " is-new" : "") + (s.fill ? " is-joined" : ""), id: "cb-s09-card", "aria-labelledby": "cb-s09-who" }, [
        h("div", { "class": "cb-s09-card__head" }, [h("span", { "class": "cb-s09-card__face" }, [avatar(s.p, "cb-s09-av--lg"), s.fill ? badge() : null]),
          h("div", { "class": "cb-s09-card__id" }, [h("h3", { id: "cb-s09-who", tabindex: "-1", "data-s09": "who", text: name }),
            s.fill ? h("span", { "class": "cb-s09-joined" }, [api.ico("check"), h("span", { text: T.joined })]) : null])]),
        h("p", { "class": "cb-s09-card__why", text: t2(s.p.why) }),
        msg ? feedback(msg) : h("p", { "class": "cb-s09-card__ask" }, [api.ico("go"), h("span", { text: T.ask(nmP(s.p)) })])   // the card talks about this one person
      ]);
    }
    function wayEl(w) {
      var s = open !== -1 ? seats[open] : null;
      var tried = !!s && s.tries.indexOf(w.id) !== -1 && !helps(s, w.id);
      var ring = !!s && resolved && helps(s, w.id);
      var rest = !!s && resolved && !ring && !tried;
      var off = !s || resolved || tried;
      var name = t2(w.name);
      var cls = "cb-s09-way" + (!s ? " is-wait" : "") + (tried ? " is-tried" : "") + (ring ? " is-ring" : "") + (rest ? " is-rest" : "");
      return h("li", null, [h("button", { type: "button", "class": cls, "data-s09-way": w.id, "aria-label": T.way(name) + (tried ? ", " + T.tried : ""), "aria-disabled": off ? "true" : null,
        onclick: function () { tapWay(w); } }, [
        h("span", { "class": "cb-s09-way__ic", "aria-hidden": "true" }, [icon(w.id)]),
        h("span", { "class": "cb-s09-way__name", text: name }),
        tried ? h("span", { "class": "cb-s09-way__tag", "aria-hidden": "true", text: T.tried }) : null,
        ring ? h("span", { "class": "cb-s09-way__stamp", "aria-hidden": "true" }, [api.ico("check")]) : null])]);
    }
    function pips() {
      return h("ul", { "class": "cb-s09-pips", "aria-hidden": "true" }, seats.map(function (s) {
        return h("li", { "class": s.fill ? "is-on" : null }, [s.fill ? avatar(s.p) : icon("chair")]);
      }));
    }
    function feedback(m) {
      var lines = [h("p", { text: m.text })];
      if (m.also) lines.push(h("p", { "class": "cb-s09-also" }, [h("b", { text: T.also }), " " + m.also]));
      return h("div", { "class": "cb-feedback" + (m.ok ? " is-ok" : "") }, [api.ico(m.ok ? "check" : "bulb"), h("div", { "class": "cb-s09-fb" }, lines)]);
    }
    function actions() {
      /* before the first chair is opened, the bar stays away: on a phone it would cover the instruction, and there is nothing to finish yet */
      if (!confirming && !resolved && !seats.some(function (s) { return s.opened; })) return null;
      if (confirming) {
        return h("div", { "class": "cb-actions cb-s09-actions" }, [
          h("div", { "class": "cb-actions__info" }, [h("p", { "class": "cb-msg cb-s09-ask", text: T.confirm })]),
          h("div", { "class": "cb-row cb-s09-btns" }, [
            withKey(api.btn(T.keep, "cb-btn--primary cb-btn--big", keepLooking, "back"), "keep"),
            withKey(api.btn(T.finish, "cb-btn--big", function (e) { if (settled(e)) aha(); }, "go", true), "finish-anyway")])]);
      }
      var info = [pips(), h("p", { "class": "cb-msg", text: T.filled(nFilled()) })];
      var main = resolved ? api.btn(T.done, "cb-btn--go cb-btn--big", done, "go", true)
        : api.btn(T.finishPlan, (nFilled() === 5 ? "cb-btn--go" : "cb-s09-finish") + " cb-btn--big", finishPlan, "check");
      main.setAttribute("data-s09", resolved ? "done" : "finish");
      return h("div", { "class": "cb-actions cb-s09-actions" }, [h("div", { "class": "cb-actions__info" }, info), main]);
    }
    function withKey(el, key) { el.setAttribute("data-s09", key); return el; }
    function onBack(board, callback) {
      if (api.input && api.input.on) api.input.on("back", callback, { scope: board });
    }

    /* ── 1 · intro over the room ─────────────────────────────────────── */
    function intro() {
      phase = "intro";
      var go = api.btn(T.start, "cb-btn--go cb-btn--big", function () { play(); }, "go", true);
      go.setAttribute("data-s09", "start");
      var say = h("div", { "class": "cb-s09-say" }, [h("p", { "class": "cb-s09-say__text", tabindex: "-1", "data-s09": "lead", text: T.intro }), h("div", { "class": "cb-row" }, [go])]);
      var board = h("div", { "class": "cb-board cb-s09" }, [stage("intro", say)]);
      api.screen([api.stopHud(stop, null), board], '[data-s09="lead"]');
      onBack(board, function () { play(); return true; });
      api.frame();
    }

    /* ── 2 · the room: five chairs, the open card, six ways ──────────── */
    function render(focusSel) {
      phase = "play";
      var n = nFilled();
      var work = h("div", { "class": "cb-s09-work" }, [open === -1 ? coachLine() : card(seats[open]),
        h("ul", { "class": "cb-s09-ways", "data-cb-choices": "" }, ways.map(wayEl))]);
      var board = h("div", { "class": "cb-board cb-s09" }, [
        h("div", { "class": "cb-s09-play" }, [room(), work]), actions()]);
      api.screen([api.stopHud(stop, DOTS, n, T.filled(n)), board], focusSel);
      onBack(board, function () { if (!confirming) return false; keepLooking(); return true; });
      freshSeat = -1; freshCard = false;
    }
    /* bring something into view above the sticky action bar (api.screen focuses without scrolling).
       where: "start" puts it at the top, "mid" about a third down, "near" scrolls the least; keepSel is never pushed off the top. */
    function reveal(sel, where, keepSel) {
      var el = document.querySelector(sel); if (!el) return false;
      var fs = document.fullscreenElement || document.webkitFullscreenElement || null;
      var box = fs && fs.contains(el) ? fs : window;           // in full screen the stage scrolls, not the page
      var vh = window.innerHeight || 0, floor = vh, bar = document.querySelector(".cb-s09-actions");
      if (bar && !bar.contains(el)) { var b = bar.getBoundingClientRect(); if (b.top < vh && b.bottom > 0) floor = b.top; }
      var r = el.getBoundingClientRect();
      if (r.top >= 8 && r.bottom <= floor - 8) return false;
      var d = where === "start" ? r.top - 12 : where === "mid" ? r.top - Math.max(12, (floor - r.height) * 0.3)
        : r.top < 8 ? r.top - 12 : Math.min(r.bottom - (floor - 12), r.top - 12);
      var keep = keepSel ? document.querySelector(keepSel) : null;
      if (keep && d > 0) d = Math.max(0, Math.min(d, keep.getBoundingClientRect().top - 12));
      if (Math.abs(d) < 2) return false;
      try { box.scrollBy({ top: d, behavior: api.REDUCED ? "auto" : "smooth" }); } catch (e) { box.scrollBy(0, d); }
      return true;
    }
    function play() {
      render(null);
      api.frame(true);
      api.say(T.instr);
    }
    function tapChair(i) {
      var s = seats[i];
      if (s.fill) return;
      if (open === i) { var who = document.querySelector('[data-s09="who"]'); if (who) who.focus(); return; }
      if (open !== -1) { api.say(T.ask(nmP(seats[open].p))); return; }        // while a card is open, the other chairs wait
      s.opened = true; open = i; resolved = false; msg = null; confirming = false; freshCard = true;
      render('[data-s09="who"]');
      reveal("#cb-s09-card", "start");
      api.say(T.missing(nmP(s.p)) + ". " + t2(s.p.why) + " " + T.ask(nmP(s.p)));
    }
    function tapWay(w) {
      if (open === -1) { api.say(T.instr); return; }                           // the ways work only while a chair card is open
      if (resolved) return;
      var s = seats[open];
      if (s.tries.indexOf(w.id) !== -1) return;
      s.tries.push(w.id);
      if (helps(s, w.id)) { s.result = s.tries.length === 1 ? "first" : "second"; fill(s, w.id, true); return; }
      if (s.tries.length === 1) {
        msg = { text: T.wrong1(t2(s.p.hint)), ok: false };
        render('[data-s09-way="' + w.id + '"]');
        if (!reveal("#cb-s09-card .cb-feedback", "near")) reveal('[data-s09-way="' + w.id + '"]', "near", "#cb-s09-card .cb-feedback");   // the hint, then the tried way
        api.say(msg.text);
        return;
      }
      s.result = "shown"; fill(s, s.p.helps[0], false);                       // second way did not help: show one that does
    }
    function fill(s, wayId, ok) {
      s.fill = wayId; resolved = true; freshSeat = open; confirming = false;
      var others = s.p.helps.filter(function (id) { return id !== wayId; }).map(function (id) { return t2(WAY[id].name); });
      msg = { text: ok ? T.right(nmP(s.p)) : T.shown, ok: ok, also: others.length ? others.join(", ") : null };
      render('[data-s09="done"]');
      reveal("#cb-s09-card .cb-feedback", "near");
      api.say(msg.text + (msg.also ? " " + T.also + " " + msg.also + "." : "") + " " + T.filled(nFilled()));
    }
    function done() {
      var from = open; open = -1; resolved = false; msg = null; swapAt = Date.now();
      var nx = nextEmpty(from);
      if (nx === -1) { render('[data-s09="finish"]'); reveal(".cb-s09-unity", "near"); api.say(T.all); return; }
      render('[data-s09-chair="' + nx + '"]');
      reveal('[data-s09-chair="' + nx + '"]', "mid");
    }
    function finishPlan(e) {
      if (!settled(e)) return;
      if (nFilled() < 5) { confirming = true; swapAt = Date.now(); render('[data-s09="keep"]'); api.say(T.confirm); return; }
      aha();
    }
    function keepLooking() {
      confirming = false; swapAt = Date.now();
      var first = nextEmpty(-1);
      render(open !== -1 ? '[data-s09="who"]' : first !== -1 ? '[data-s09-chair="' + first + '"]' : '[data-s09="finish"]');
    }

    /* ── 3 · the aha card over the room and its filled chairs ────────── */
    function aha() {
      phase = "aha";
      confirming = false; open = -1; resolved = false; msg = null;
      var n = nFilled();
      var see = withKey(api.btn(T.see, "cb-btn--go cb-btn--big", function () { finish(); }, "go", true), "see");
      var say = h("div", { "class": "cb-s09-say cb-s09-say--aha" }, [
        n === 5 ? h("p", { "class": "cb-s09-unity cb-s09-unity--say" }, [api.img("unity", "", null, true), h("strong", { text: T.all })]) : null,
        h("p", { "class": "cb-s09-say__text", tabindex: "-1", "data-s09": "lead", text: T.aha }), h("div", { "class": "cb-row" }, [see])]);
      api.screen([api.stopHud(stop, DOTS, n, T.filled(n)), h("div", { "class": "cb-board cb-s09" }, [stage("aha", say)])], '[data-s09="lead"]');
      api.frame();
      api.say(T.aha);
    }

    /* ── 4 · score: +8 per chair opened; +12 first way helps, +6 second way helps ── */
    function finish() {
      phase = "result";
      var score = 0;
      seats.forEach(function (s) { if (s.opened) score += 8; if (s.result === "first") score += 12; else if (s.result === "second") score += 6; });
      var unopened = seats.filter(function (s) { return !s.opened; })[0];
      var missed = seats.filter(function (s) { return s.opened && s.result !== "first"; })[0];
      var tip = unopened ? T.tipOpen(nmP(unopened.p)) : missed ? T.tipRead(nmP(missed.p)) : T.tip100;
      var info = api.saveRound(stop.id, score, { processBadge: nFilled() === 5 ? "process-9" : null, lastRound: ids.join(","), lastPeople: ids.slice(), lastWays: ways.map(function (w) { return w.id; }) });
      api.endPlay();
      var gu = api.btn(T.gu, "cb-btn--quiet", function () { api.dialog(T.gu, [h("div", { "class": "cb-dlg__body" }, [h("p", { text: T.guText })])], gu); }, "family");
      var scard = api.scoreCard(stop, score, info, tip, T.can, T.real);
      api.finishRound(stop.id, scard, api.cardButtons(stop.id, api.restart(stop.id), gu));
      api.say(api.W.score + " " + score + " / 100");
    }

    if (api.setController) api.setController({
      snapshot: function () { return { v: 2, phase: phase, open: open, resolved: resolved, confirming: confirming,
        seats: seats.map(function (s) { return { id: s.p.id, opened: s.opened, tries: s.tries.slice(), result: s.result, fill: s.fill }; }) }; },
      restore: function (saved) {
        if (!saved || saved.v !== 2 || !Array.isArray(saved.seats) || saved.seats.length !== 5) return false;
        saved.seats.forEach(function (value, i) { var s = seats[i]; s.opened = !!value.opened; s.tries = value.tries.slice(); s.result = value.result; s.fill = value.fill; });
        open = saved.open; resolved = !!saved.resolved; confirming = !!saved.confirming; freshSeat = -1; freshCard = false; msg = null;
        if (open !== -1) { var s = seats[open];
          if (s.fill) { var others = s.p.helps.filter(function (id) { return id !== s.fill; }).map(function (id) { return t2(WAY[id].name); });
            msg = { text: s.result === "shown" ? T.shown : T.right(nmP(s.p)), ok: s.result !== "shown", also: others.length ? others.join(", ") : null }; }
          else if (s.tries.length) msg = { text: T.wrong1(t2(s.p.hint)), ok: false };
        }
        if (saved.phase === "result") finish(); else if (saved.phase === "aha") aha(); else if (saved.phase === "play") render(); else intro();
        return true;
      }
    });

    intro();
  }

  CB.register({ id: ID, steps: DOTS, css: "09-include-every-voice.css", run: run });

    return definition;
  }
  if (host.defineStop) host.defineStop(factory);
  else host.register(factory({ document: document, window: window, Date: Date, setTimeout: setTimeout, clearTimeout: clearTimeout, requestAnimationFrame: requestAnimationFrame, cancelAnimationFrame: typeof cancelAnimationFrame === "function" ? cancelAnimationFrame : function () {} }));
})();
