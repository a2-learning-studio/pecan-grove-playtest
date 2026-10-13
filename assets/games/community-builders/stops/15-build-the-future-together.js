/* Community Builders of Pecan Grove · Stop 15 · Build the Future Together / Construyamos el futuro juntos
   The town draws a plan for Pecan Grove in 2035. Six neighbors each share one wish. The player plans five
   places on the painted town (opening each tile's good and hard parts), adds a yearly check-in and invites
   someone who is missing from the planning table. Then the neighbors react and everyone meets for a picnic.
   Score (process only, never a side, never speed): +10 per neighbor whose wish is in the plan (60), +4 per place
   whose tile had its trade-off opened before it was placed (20), +10 for a yearly check-in, +10 for inviting a
   missing voice on the first tap (+5 after a "Look again"). Every old-farm tile can earn 100.
   Words are exact from the stop spec (15 - build-the-future-together.md). No network, no inputs, no inline styles. */
(function () {
  "use strict";
  var host = window.CommunityBuilders; if (!host) return;
  function factory(lifecycle) {
    var document = lifecycle.document, window = lifecycle.window, Date = lifecycle.Date;
    var setTimeout = lifecycle.setTimeout, clearTimeout = lifecycle.clearTimeout;
    var requestAnimationFrame = lifecycle.requestAnimationFrame, cancelAnimationFrame = lifecycle.cancelAnimationFrame;
    var definition = null, CB = { register: function (value) { definition = value; } };

  "use strict";

  var ID = "build-the-future-together";
  var DOTS = [null, null, null];

  /* ── words (exact) ─────────────────────────────────────────────────── */
  var WORDS = {en:window.CBLocale.read("stop-15", "en", {en:{"WORDS.step":function (n) { return window.CBLocale.part("stop-15", "en", "WORDS.step", 0) + n + window.CBLocale.part("stop-15", "en", "WORDS.step", 1); },"WORDS.tray":function (p) { return p + window.CBLocale.part("stop-15", "en", "WORDS.tray", 0); },"WORDS.lblNot":function (p) { return p + window.CBLocale.part("stop-15", "en", "WORDS.lblNot", 0); },"WORDS.lblOn":function (p, t) { return p + window.CBLocale.part("stop-15", "en", "WORDS.lblOn", 0) + t; },"WORDS.placesN":function (n) { return window.CBLocale.part("stop-15", "en", "WORDS.placesN", 0) + n + window.CBLocale.part("stop-15", "en", "WORDS.placesN", 1); },"WORDS.wishesN":function (n) { return window.CBLocale.part("stop-15", "en", "WORDS.wishesN", 0) + n + window.CBLocale.part("stop-15", "en", "WORDS.wishesN", 1); },"WORDS.great":function (p) { return window.CBLocale.part("stop-15", "en", "WORDS.great", 0) + p + window.CBLocale.part("stop-15", "en", "WORDS.great", 1); },"WORDS.look":function (p) { return window.CBLocale.part("stop-15", "en", "WORDS.look", 0) + p + window.CBLocale.part("stop-15", "en", "WORDS.look", 1); },"WORDS.luciaFarm":function (t) { return window.CBLocale.part("stop-15", "en", "WORDS.luciaFarm", 0) + t + window.CBLocale.part("stop-15", "en", "WORDS.luciaFarm", 1); },"WORDS.tipWish":function (n) { return window.CBLocale.part("stop-15", "en", "WORDS.tipWish", 0) + n + window.CBLocale.part("stop-15", "en", "WORDS.tipWish", 1); }},es:{"WORDS.step":function (n) { return window.CBLocale.part("stop-15", "es", "WORDS.step", 0) + n + window.CBLocale.part("stop-15", "es", "WORDS.step", 1); },"WORDS.tray":function (p) { return p + window.CBLocale.part("stop-15", "es", "WORDS.tray", 0); },"WORDS.lblNot":function (p) { return p + window.CBLocale.part("stop-15", "es", "WORDS.lblNot", 0); },"WORDS.lblOn":function (p, t) { return p + window.CBLocale.part("stop-15", "es", "WORDS.lblOn", 0) + t; },"WORDS.placesN":function (n) { return window.CBLocale.part("stop-15", "es", "WORDS.placesN", 0) + n + window.CBLocale.part("stop-15", "es", "WORDS.placesN", 1); },"WORDS.wishesN":function (n) { return window.CBLocale.part("stop-15", "es", "WORDS.wishesN", 0) + n + window.CBLocale.part("stop-15", "es", "WORDS.wishesN", 1); },"WORDS.great":function (p) { return window.CBLocale.part("stop-15", "es", "WORDS.great", 0) + p + window.CBLocale.part("stop-15", "es", "WORDS.great", 1); },"WORDS.look":function (p) { return window.CBLocale.part("stop-15", "es", "WORDS.look", 0) + p + window.CBLocale.part("stop-15", "es", "WORDS.look", 1); },"WORDS.luciaFarm":function (t) { return window.CBLocale.part("stop-15", "es", "WORDS.luciaFarm", 0) + t + window.CBLocale.part("stop-15", "es", "WORDS.luciaFarm", 1); },"WORDS.tipWish":function (n) { return window.CBLocale.part("stop-15", "es", "WORDS.tipWish", 0) + n + window.CBLocale.part("stop-15", "es", "WORDS.tipWish", 1); }}}).WORDS,es:window.CBLocale.read("stop-15", "es", {en:{"WORDS.step":function (n) { return window.CBLocale.part("stop-15", "en", "WORDS.step", 0) + n + window.CBLocale.part("stop-15", "en", "WORDS.step", 1); },"WORDS.tray":function (p) { return p + window.CBLocale.part("stop-15", "en", "WORDS.tray", 0); },"WORDS.lblNot":function (p) { return p + window.CBLocale.part("stop-15", "en", "WORDS.lblNot", 0); },"WORDS.lblOn":function (p, t) { return p + window.CBLocale.part("stop-15", "en", "WORDS.lblOn", 0) + t; },"WORDS.placesN":function (n) { return window.CBLocale.part("stop-15", "en", "WORDS.placesN", 0) + n + window.CBLocale.part("stop-15", "en", "WORDS.placesN", 1); },"WORDS.wishesN":function (n) { return window.CBLocale.part("stop-15", "en", "WORDS.wishesN", 0) + n + window.CBLocale.part("stop-15", "en", "WORDS.wishesN", 1); },"WORDS.great":function (p) { return window.CBLocale.part("stop-15", "en", "WORDS.great", 0) + p + window.CBLocale.part("stop-15", "en", "WORDS.great", 1); },"WORDS.look":function (p) { return window.CBLocale.part("stop-15", "en", "WORDS.look", 0) + p + window.CBLocale.part("stop-15", "en", "WORDS.look", 1); },"WORDS.luciaFarm":function (t) { return window.CBLocale.part("stop-15", "en", "WORDS.luciaFarm", 0) + t + window.CBLocale.part("stop-15", "en", "WORDS.luciaFarm", 1); },"WORDS.tipWish":function (n) { return window.CBLocale.part("stop-15", "en", "WORDS.tipWish", 0) + n + window.CBLocale.part("stop-15", "en", "WORDS.tipWish", 1); }},es:{"WORDS.step":function (n) { return window.CBLocale.part("stop-15", "es", "WORDS.step", 0) + n + window.CBLocale.part("stop-15", "es", "WORDS.step", 1); },"WORDS.tray":function (p) { return p + window.CBLocale.part("stop-15", "es", "WORDS.tray", 0); },"WORDS.lblNot":function (p) { return p + window.CBLocale.part("stop-15", "es", "WORDS.lblNot", 0); },"WORDS.lblOn":function (p, t) { return p + window.CBLocale.part("stop-15", "es", "WORDS.lblOn", 0) + t; },"WORDS.placesN":function (n) { return window.CBLocale.part("stop-15", "es", "WORDS.placesN", 0) + n + window.CBLocale.part("stop-15", "es", "WORDS.placesN", 1); },"WORDS.wishesN":function (n) { return window.CBLocale.part("stop-15", "es", "WORDS.wishesN", 0) + n + window.CBLocale.part("stop-15", "es", "WORDS.wishesN", 1); },"WORDS.great":function (p) { return window.CBLocale.part("stop-15", "es", "WORDS.great", 0) + p + window.CBLocale.part("stop-15", "es", "WORDS.great", 1); },"WORDS.look":function (p) { return window.CBLocale.part("stop-15", "es", "WORDS.look", 0) + p + window.CBLocale.part("stop-15", "es", "WORDS.look", 1); },"WORDS.luciaFarm":function (t) { return window.CBLocale.part("stop-15", "es", "WORDS.luciaFarm", 0) + t + window.CBLocale.part("stop-15", "es", "WORDS.luciaFarm", 1); },"WORDS.tipWish":function (n) { return window.CBLocale.part("stop-15", "es", "WORDS.tipWish", 0) + n + window.CBLocale.part("stop-15", "es", "WORDS.tipWish", 1); }}}).WORDS};

  /* ── the 18 wishes. Codes are for code only: second letter = place (K creek, M Main Street, S school, F chapel field).
     Every wish names its place in words (owner play-test, 10 Oct 2026: "there" pointed at nothing). ── */
  var WISH = {
    LK: window.CBLocale.pair("stop-15","bank.b0001"),
    LM: window.CBLocale.pair("stop-15","bank.b0002"),
    LS: window.CBLocale.pair("stop-15","bank.b0003"),
    JK: window.CBLocale.pair("stop-15","bank.b0004"),
    JM: window.CBLocale.pair("stop-15","bank.b0005"),
    JF: window.CBLocale.pair("stop-15","bank.b0006"),
    AK: window.CBLocale.pair("stop-15","bank.b0007"),
    AM: window.CBLocale.pair("stop-15","bank.b0008"),
    AS: window.CBLocale.pair("stop-15","bank.b0009"),
    RK: window.CBLocale.pair("stop-15","bank.b0010"),
    RS: window.CBLocale.pair("stop-15","bank.b0011"),
    RF: window.CBLocale.pair("stop-15","bank.b0012"),
    PM: window.CBLocale.pair("stop-15","bank.b0013"),
    PS: window.CBLocale.pair("stop-15","bank.b0014"),
    PF: window.CBLocale.pair("stop-15","bank.b0015"),
    YM: window.CBLocale.pair("stop-15","bank.b0016"),
    YS: window.CBLocale.pair("stop-15","bank.b0017"),
    YF: window.CBLocale.pair("stop-15","bank.b0018")
  };
  var NBW = { lee: ["LK", "LM", "LS"], johnson: ["JK", "JM", "JF"], ana: ["AK", "AM", "AS"], ruth: ["RK", "RS", "RF"], patel: ["PM", "PS", "PF"], jayden: ["YM", "YS", "YF"] };
  var KEY_PLACE = { K: "creek", M: "main", S: "school", F: "field" };

  /* ── the 24 tiles (exact). ans = the wishes a tile answers once it is in the plan; never shown. ic = authored line icons. ── */
  var FILLS_BANK = window.CBLocale.pair("stop-15","bank.b0019");
  var FILLS_BLOCK = window.CBLocale.pair("stop-15","bank.b0020");
  var FILLS_SCHOOL = window.CBLocale.pair("stop-15","bank.b0021");
  var TILES = {
    G1: { ic: ["lowbuilding", "tree"], ans: [], name: window.CBLocale.pair("stop-15","bank.b0022"),
      good: window.CBLocale.pair("stop-15","bank.b0023"),
      hard: window.CBLocale.pair("stop-15","bank.b0024") },
    G2: { ic: ["treering", "waterloop"], ans: [], name: window.CBLocale.pair("stop-15","bank.b0025"),
      good: window.CBLocale.pair("stop-15","bank.b0026"),
      hard: window.CBLocale.pair("stop-15","bank.b0027") },
    G3: { ic: ["barn", "cow"], ans: [], name: window.CBLocale.pair("stop-15","bank.b0028"),
      good: window.CBLocale.pair("stop-15","bank.b0029"),
      hard: window.CBLocale.pair("stop-15","bank.b0030") },
    G4: { ic: ["peek", "hourglass"], ans: [], name: window.CBLocale.pair("stop-15","bank.b0031"),
      good: window.CBLocale.pair("stop-15","bank.b0032"),
      hard: window.CBLocale.pair("stop-15","bank.b0033") },
    K1: { ic: ["drop", "bike"], ans: ["LK", "JK", "AK"], name: window.CBLocale.pair("stop-15","bank.b0034"),
      good: window.CBLocale.pair("stop-15","bank.b0035"),
      hard: window.CBLocale.pair("stop-15","bank.b0036") },
    K2: { ic: ["bike", "bench"], ans: ["AK", "RK"], name: window.CBLocale.pair("stop-15","bank.b0037"),
      good: window.CBLocale.pair("stop-15","bank.b0038"),
      hard: window.CBLocale.pair("stop-15","bank.b0039") },
    K3: { ic: ["drop", "bench"], ans: ["LK", "JK", "RK"], name: window.CBLocale.pair("stop-15","bank.b0040"),
      good: window.CBLocale.pair("stop-15","bank.b0041"),
      hard: window.CBLocale.pair("stop-15","bank.b0042") },
    K4: { ic: ["fish"], ans: ["JK"], name: window.CBLocale.pair("stop-15","bank.b0043"),
      good: window.CBLocale.pair("stop-15","bank.b0044"), hard: FILLS_BANK },
    K5: { ic: ["path"], ans: ["AK"], name: window.CBLocale.pair("stop-15","bank.b0045"),
      good: window.CBLocale.pair("stop-15","bank.b0046"), hard: FILLS_BANK },
    M1: { ic: ["stall", "sidewalk"], ans: ["JM", "PM", "LM"], name: window.CBLocale.pair("stop-15","bank.b0047"),
      good: window.CBLocale.pair("stop-15","bank.b0048"),
      hard: window.CBLocale.pair("stop-15","bank.b0049") },
    M2: { ic: ["sidewalk", "deskwrench"], ans: ["LM", "AM", "YM"], name: window.CBLocale.pair("stop-15","bank.b0050"),
      good: window.CBLocale.pair("stop-15","bank.b0051"),
      hard: window.CBLocale.pair("stop-15","bank.b0052") },
    M3: { ic: ["awning", "deskwrench"], ans: ["JM", "PM", "AM", "YM"], name: window.CBLocale.pair("stop-15","bank.b0053"),
      good: window.CBLocale.pair("stop-15","bank.b0054"),
      hard: window.CBLocale.pair("stop-15","bank.b0055") },
    M4: { ic: ["studycenter"], ans: ["YM"], name: window.CBLocale.pair("stop-15","bank.b0056"),
      good: window.CBLocale.pair("stop-15","bank.b0057"), hard: FILLS_BLOCK },
    M5: { ic: ["markethall"], ans: ["JM"], name: window.CBLocale.pair("stop-15","bank.b0058"),
      good: window.CBLocale.pair("stop-15","bank.b0059"), hard: FILLS_BLOCK },
    S1: { ic: ["bulb", "whisk"], ans: ["AS", "YS", "LS", "PS"], name: window.CBLocale.pair("stop-15","bank.b0060"),
      good: window.CBLocale.pair("stop-15","bank.b0061"),
      hard: window.CBLocale.pair("stop-15","bank.b0062") },
    S2: { ic: ["whisk", "book"], ans: ["LS", "PS", "RS"], name: window.CBLocale.pair("stop-15","bank.b0063"),
      good: window.CBLocale.pair("stop-15","bank.b0064"),
      hard: window.CBLocale.pair("stop-15","bank.b0065") },
    S3: { ic: ["bulb", "book"], ans: ["AS", "YS", "RS"], name: window.CBLocale.pair("stop-15","bank.b0066"),
      good: window.CBLocale.pair("stop-15","bank.b0067"),
      hard: window.CBLocale.pair("stop-15","bank.b0068") },
    S4: { ic: ["robot"], ans: ["YS"], name: window.CBLocale.pair("stop-15","bank.b0069"),
      good: window.CBLocale.pair("stop-15","bank.b0070"), hard: FILLS_SCHOOL },
    S5: { ic: ["bread"], ans: ["PS"], name: window.CBLocale.pair("stop-15","bank.b0071"),
      good: window.CBLocale.pair("stop-15","bank.b0072"), hard: FILLS_SCHOOL },
    F1: { ic: ["sprout", "chapel"], ans: ["JF", "RF"], name: window.CBLocale.pair("stop-15","bank.b0073"),
      good: window.CBLocale.pair("stop-15","bank.b0074"),
      hard: window.CBLocale.pair("stop-15","bank.b0075") },
    F2: { ic: ["chapel", "notes"], ans: ["RF", "PF", "YF"], name: window.CBLocale.pair("stop-15","bank.b0076"),
      good: window.CBLocale.pair("stop-15","bank.b0077"),
      hard: window.CBLocale.pair("stop-15","bank.b0078") },
    F3: { ic: ["sprout", "notes"], ans: ["JF", "PF", "YF"], name: window.CBLocale.pair("stop-15","bank.b0079"),
      good: window.CBLocale.pair("stop-15","bank.b0080"),
      hard: window.CBLocale.pair("stop-15","bank.b0081") },
    F4: { ic: ["museum"], ans: ["RF"], name: window.CBLocale.pair("stop-15","bank.b0082"),
      good: window.CBLocale.pair("stop-15","bank.b0083"),
      hard: window.CBLocale.pair("stop-15","bank.b0084") },
    F5: { ic: ["vegpatch"], ans: ["JF"], name: window.CBLocale.pair("stop-15","bank.b0085"),
      good: window.CBLocale.pair("stop-15","bank.b0086"),
      hard: window.CBLocale.pair("stop-15","bank.b0087") }
  };

  /* ── the five places, in the fixed Tab order. at = where the clearing sits on the town map (fractions);
     crop = the painted crop shown in the tray. There is no painted chapel: the chapel field is the garden green. ── */
  var PLACES = [
    { id: "farm", ic: "farm", name: window.CBLocale.pair("stop-15","bank.b0088"), at: [0.64, 0.27], crop: [0.50, 0.14, 0.86], tiles: ["G1", "G2", "G3", "G4"], big: [] },
    { id: "creek", ic: "creek", name: window.CBLocale.pair("stop-15","bank.b0089"), at: [0.47, 0.745], crop: [0.05, 0.66, 0.45], tiles: ["K1", "K2", "K3"], big: ["K4", "K5"] },
    { id: "main", ic: "main", name: window.CBLocale.pair("stop-15","bank.b0090"), at: [0.80, 0.47], crop: [0.60, 0.33, 0.98], tiles: ["M1", "M2", "M3"], big: ["M4", "M5"] },
    { id: "school", ic: "school", name: window.CBLocale.pair("stop-15","bank.b0091"), at: [0.50, 0.44], crop: [0.36, 0.30, 0.72], tiles: ["S1", "S2", "S3"], big: ["S4", "S5"] },
    { id: "field", ic: "chapel", name: window.CBLocale.pair("stop-15","bank.b0092"), at: [0.24, 0.60], crop: [0.10, 0.50, 0.50], tiles: ["F1", "F2", "F3"], big: ["F4", "F5"] }
  ];
  var PLACE = {}; PLACES.forEach(function (p) { PLACE[p.id] = p; });
  /* two framings of the painted town: the wide band shows map rows 0.1745 to 0.8255 (aspect 1376:500 over the 1376:768 map),
     short enough that the six wishes and all five places fit one 1440x900 screen; the close frame is a crop that keeps the
     map's aspect. x0/y0/w/hh say which part of the map is in view. */
  var FRAMES = {
    band: { crop: [0, 0.5, 1], x0: 0, y0: 0.17448, w: 1, hh: 0.65104, cls: "cb-s15-map" },
    close: { crop: [0.12, 0.17, 0.88], x0: 0.12, y0: 0.17, w: 0.76, hh: 0.76, cls: "cb-s15-map cb-s15-map--close" }
  };

  var CHECKS = [
    { id: "walk", text: window.CBLocale.pair("stop-15","bank.b0093") },
    { id: "report", text: window.CBLocale.pair("stop-15","bank.b0094") },
    { id: "students", text: window.CBLocale.pair("stop-15","bank.b0095") }
  ];
  var PEOPLE = [
    { id: "grandma", ic: "grandma", name: window.CBLocale.pair("stop-15","bank.b0096") },
    { id: "miller", ic: "miller", name: window.CBLocale.pair("stop-15","bank.b0097") },
    { id: "newfamily", ic: "newfamily", name: window.CBLocale.pair("stop-15","bank.b0098") },
    { id: "night", ic: "night", name: window.CBLocale.pair("stop-15","bank.b0099") },
    { id: "baby", ic: "baby", name: window.CBLocale.pair("stop-15","bank.b0100") },
    { id: "worker", ic: "worker", name: window.CBLocale.pair("stop-15","bank.b0101") }
  ];
  var PERSON = {}; PEOPLE.forEach(function (p) { PERSON[p.id] = p; });
  /* short names for the picnic tags, and each townsperson's colour for their paper silhouette (no painted portraits yet) */
  var PSHORT = { grandma: window.CBLocale.pair("stop-15","bank.b0102"), miller: window.CBLocale.pair("stop-15","bank.b0103"), newfamily: window.CBLocale.pair("stop-15","bank.b0104"),
    night: window.CBLocale.pair("stop-15","bank.b0105"), baby: window.CBLocale.pair("stop-15","bank.b0106"), worker: window.CBLocale.pair("stop-15","bank.b0107") };
  var PCOL = { grandma: "pk", miller: "gr", newfamily: "bl", night: "bld", baby: "yl", worker: "or" };
  function silhouette(c) { return '<path class="' + c + '" d="M32 11a11.5 11.5 0 1 1 0 23 11.5 11.5 0 0 1 0-23zM9 64c0-14.5 10-24.5 23-24.5S55 49.5 55 64z"/>'; }

  /* ── authored line icons: 24-unit grid, one 2px round stroke, like the shell's api.IC ── */
  var ICONS = {
    farm: '<path d="M12 21.5V6"/><path d="M12 9.6c-2.3 0-3.8-1.4-3.8-3.7 2.3 0 3.8 1.4 3.8 3.7zM12 9.6c2.3 0 3.8-1.4 3.8-3.7-2.3 0-3.8 1.4-3.8 3.7z"/><path d="M12 14c-2.3 0-3.8-1.4-3.8-3.7 2.3 0 3.8 1.4 3.8 3.7zM12 14c2.3 0 3.8-1.4 3.8-3.7-2.3 0-3.8 1.4-3.8 3.7z"/><path d="M12 18.4c-2.3 0-3.8-1.4-3.8-3.7 2.3 0 3.8 1.4 3.8 3.7zM12 18.4c2.3 0 3.8-1.4 3.8-3.7-2.3 0-3.8 1.4-3.8 3.7z"/><path d="M12 5.4c-1-1-1-2.4 0-3.4 1 1 1 2.4 0 3.4z"/>',
    creek: '<path d="M3 8c1.5-1.3 3-1.3 4.5 0s3 1.3 4.5 0 3-1.3 4.5 0 3 1.3 4.5 0"/><path d="M3 12.5c1.5-1.3 3-1.3 4.5 0s3 1.3 4.5 0 3-1.3 4.5 0 3 1.3 4.5 0"/><path d="M3 17c1.5-1.3 3-1.3 4.5 0s3 1.3 4.5 0 3-1.3 4.5 0 3 1.3 4.5 0"/>',
    main: '<path d="M4.5 11v9.5h15V11"/><path d="M3.5 7.5 5 4h14l1.5 3.5v1a2.25 2.25 0 0 1-4.25 1 2.25 2.25 0 0 1-4.25 0 2.25 2.25 0 0 1-4.25 0 2.25 2.25 0 0 1-4.25-1z"/><path d="M10 20.5v-5h4v5"/>',
    school: '<path d="M4 20.5V11l8-5.5 8 5.5v9.5z"/><path d="M12 5.5V2.5h3"/><path d="M10 20.5v-4.5h4v4.5"/><circle cx="12" cy="11.6" r="1.7"/>',
    chapel: '<path d="M5.5 20.5V12L12 7l6.5 5v8.5"/><path d="M10 8.6V5.4L12 3l2 2.4v3.2"/><path d="M3.5 20.5h17"/><path d="M10.4 20.5v-3a1.6 1.6 0 0 1 3.2 0v3"/>',
    lowbuilding: '<path d="M4 20.5v-9h16v9"/><path d="M2.5 20.5h19"/><path d="M3 11.5 4.8 8.5h14.4l1.8 3"/><path d="M6.6 14.2h3.2v2.6H6.6zM14.2 14.2h3.2v2.6h-3.2z"/><path d="M10.9 20.5v-4.2h2.2v4.2"/>',
    tree: '<path d="M12 21v-5.5"/><path d="M8.2 15.5a3.8 3.8 0 0 1-.9-7.5 4.8 4.8 0 0 1 9.4 0 3.8 3.8 0 0 1-.9 7.5z"/>',
    treering: '<rect x="8.5" y="13" width="7" height="7.5" rx="1"/><path d="M8.5 15.8h7"/><circle cx="4.6" cy="12.8" r="2.6"/><path d="M4.6 15.4v5.1"/><circle cx="19.4" cy="12.8" r="2.6"/><path d="M19.4 15.4v5.1"/><circle cx="12" cy="6.6" r="2.6"/><path d="M12 9.2v3.8"/><path d="M2.5 20.5h19"/>',
    waterloop: '<path d="M12 7.2c1.9 2.2 3 3.9 3 5.4a3 3 0 0 1-6 0c0-1.5 1.1-3.2 3-5.4z"/><path d="M19.6 13.4A7.8 7.8 0 0 1 6.2 18"/><path d="M4.4 10.6A7.8 7.8 0 0 1 17.8 6"/><path d="M18.3 2.9 17.8 6l-3.1-.4"/><path d="M5.7 21.1l.5-3.1 3.1.4"/>',
    barn: '<path d="M3.5 20.5V11L7 6.5h10l3.5 4.5v9.5z"/><path d="M3.5 11h17"/><path d="M8.5 20.5v-6.5h7v6.5"/><path d="m8.5 14 7 6.5M15.5 14l-7 6.5"/>',
    cow: '<path d="M7.6 8.5h8.8l-.9 6"/><path d="M8.5 14.5l-.9-6"/><ellipse cx="12" cy="16.8" rx="4.6" ry="3.4"/><path d="M7.6 9.2 3.6 8.4c.5 1.7 2 2.6 4.4 2.6M16.4 9.2l4-.8c-.5 1.7-2 2.6-4.4 2.6"/><path d="M8.8 8.5 8 5.2M15.2 8.5l.8-3.3"/><path d="M10 11.6h.01M14 11.6h.01M10.6 17h.01M13.4 17h.01"/>',
    hourglass: '<path d="M6.5 3.5h11M6.5 20.5h11"/><path d="M8 3.5c0 4.2 4 5 4 8.5s-4 4.3-4 8.5M16 3.5c0 4.2-4 5-4 8.5s4 4.3 4 8.5"/><path d="M9.6 18.4h4.8"/>',
    peek: '<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5.5 5.5"/>',
    drop: '<path d="M12 3.5c3.5 4.2 6 7.3 6 10.3a6 6 0 0 1-12 0c0-3 2.5-6.1 6-10.3z"/><path d="M9.3 14.2a2.8 2.8 0 0 0 2.5 2.7"/>',
    bike: '<circle cx="5.8" cy="15.8" r="3.6"/><circle cx="18.2" cy="15.8" r="3.6"/><path d="M5.8 15.8h6l3.6-7.3M9.3 8.5h6.1M9.3 8.5l-3.5 7.3M9.3 8.5l2.5 7.3M15.4 8.5l2.8 7.3"/><path d="M15.4 8.5l-.7-2.6h2.4M7.9 6.4h3"/>',
    bench: '<rect x="5" y="5" width="14" height="5" rx="1.2"/><path d="M8 10v3.5M16 10v3.5"/><path d="M3.5 13.5h17"/><path d="M5.5 13.5 4.6 20.5M18.5 13.5l.9 7"/><path d="M5.1 17.3h13.8"/>',
    fish: '<path d="M7 12c2-3.7 5-5.6 8-5.6 3.2 0 5.3 2.3 6.5 5.6-1.2 3.3-3.3 5.6-6.5 5.6-3 0-6-1.9-8-5.6z"/><path d="M7 12 2.5 8.2v7.6z"/><path d="M17.3 10.6h.01"/><path d="M12.2 9.2c-.8 1.8-.8 3.8 0 5.6"/>',
    path: '<path d="M4.5 21c.6-3.6 9.2-3.9 9.2-7.6S8.6 9.6 8.6 7.3 10.8 4 13 3"/><path d="M10.5 21c.5-2.4 8.7-3.2 8.7-7.5S13.9 9.2 13.9 7.5s1.2-2.7 3.1-4"/>',
    stall: '<path d="M3.5 4.5h17l-1.4 4h-14.2z"/><path d="M5 8.5V20.5M19 8.5v12"/><path d="M5 15h14"/><circle cx="8.6" cy="13" r="1.6"/><circle cx="12" cy="13" r="1.6"/><circle cx="15.4" cy="13" r="1.6"/>',
    sidewalk: '<circle cx="12.4" cy="3.6" r="1.8"/><path d="M12.1 6.8 11.2 11l-2.2 4M11.2 11l2.4 4M11.9 7.9 9.4 9.6M11.9 7.9l2.6 1.5"/><path d="M2.5 18h19v3.5h-19z"/><path d="M8.8 18v3.5M15.2 18v3.5"/>',
    deskwrench: '<path d="M3 13.5h18"/><path d="M5 13.5v7M19 13.5v7M14 13.5v3.5h5"/><path d="M6.6 10.6l5-5"/><path d="M13.6 2.8a2.6 2.6 0 0 0-2.8 3.6l1.6 1.6a2.6 2.6 0 0 0 3.6-2.8l-1.6.6-1.2-1.2z"/>',
    awning: '<path d="M3.5 9.5 5 4.5h14l1.5 5z"/><path d="M8.2 4.5 7.4 9.5M12 4.5v5M15.8 4.5l.8 5"/><path d="M5 9.5v11h14v-11"/><path d="M8 20.5v-6h4v6"/><path d="M14.5 13.5h2.5v2.5h-2.5z"/>',
    studycenter: '<path d="M3.5 20.5V7.5L12 3.5l8.5 4v13"/><path d="M2.5 20.5h19"/><path d="M12 11.6c-1.3-.9-2.8-1.3-4.3-1.3v6.4c1.5 0 3 .4 4.3 1.3 1.3-.9 2.8-1.3 4.3-1.3v-6.4c-1.5 0-3 .4-4.3 1.3z"/><path d="M12 11.6v6.4"/>',
    markethall: '<path d="M2.5 10.5 12 4.5l9.5 6"/><path d="M4.5 9.2v11.3M19.5 9.2v11.3M2.5 20.5h19"/><path d="M7.3 20.5v-3.3h3.6v3.3M13.1 20.5v-3.3h3.6v3.3"/><path d="M6.8 17.2 7.6 15h3l.8 2.2M12.6 17.2l.8-2.2h3l.8 2.2"/>',
    bulb: '<path d="M9.5 17.5h5M10.5 20.5h3"/><path d="M12 3.5a5.8 5.8 0 0 0-3.4 10.5c.6.5 1 1.2 1 2v1.5h4.8V16c0-.8.4-1.5 1-2A5.8 5.8 0 0 0 12 3.5z"/>',
    whisk: '<g transform="rotate(-38 12 12)"><rect x="10.6" y="14.6" width="2.8" height="7" rx="1.4"/><path d="M10.9 14.6C8.2 12.6 7.3 9.4 7.9 6.8 8.5 4.2 10.1 2.6 12 2.6s3.5 1.6 4.1 4.2c.6 2.6-.3 5.8-3 7.8"/><path d="M11.5 14.6c-1.1-2.3-1.4-5.2-.9-7.6.3-1.7.8-3.2 1.4-4.4.6 1.2 1.1 2.7 1.4 4.4.5 2.4.2 5.3-.9 7.6"/></g>',
    book: '<path d="M12 6.8C10 5.3 7.4 4.5 3.5 4.5v13c3.9 0 6.5.8 8.5 2.3 2-1.5 4.6-2.3 8.5-2.3v-13c-3.9 0-6.5.8-8.5 2.3z"/><path d="M12 6.8v13"/>',
    robot: '<rect x="5" y="8" width="14" height="10" rx="3"/><path d="M12 8V5.2"/><circle cx="12" cy="4" r="1.2"/><path d="M9.3 12h.01M14.7 12h.01"/><path d="M9.6 14.8c1.5.9 3.3.9 4.8 0"/><path d="M5 12.5H3M19 12.5h2M9 18v2.5M15 18v2.5"/>',
    bread: '<path d="M3.5 17c0-5.8 3.8-9.5 8.5-9.5s8.5 3.7 8.5 9.5z"/><path d="M3.5 17v2.5a1 1 0 0 0 1 1h15a1 1 0 0 0 1-1V17"/><path d="M7.6 13.4 9.4 11M11.2 12.6 13 10.2M14.8 13.4l1.6-2.2"/>',
    sprout: '<path d="M12 20.5V11"/><path d="M12 13.2c0-3.6-2.6-6-6.5-6 0 3.6 2.6 6 6.5 6z"/><path d="M12 11c0-3.4 2.4-5.5 6.5-5.5 0 3.4-2.4 5.5-6.5 5.5z"/><path d="M7.5 20.5h9"/>',
    notes: '<path d="M9 17.5V6.3l10-2v11.2"/><circle cx="6.8" cy="17.6" r="2.3"/><circle cx="16.8" cy="15.6" r="2.3"/><path d="M9 9.4l10-2"/>',
    museum: '<path d="M5.5 20.5V12L12 7l6.5 5v8.5"/><path d="M10 8.6V5.4L12 3l2 2.4v3.2"/><path d="M3.5 20.5h17"/><path d="M9.3 13.5h5.4M9.3 18h5.4"/><path d="M9.3 13.5a1.1 2.25 0 0 0 0 4.5M14.7 13.5a1.1 2.25 0 0 1 0 4.5"/>',
    vegpatch: '<path d="M2.5 20.5h19"/><path d="M6 20.5v-4M6 16.5c0-2-1.3-3-3-3 0 2 1.3 3 3 3zM6 16.5c0-2 1.3-3 3-3 0 2-1.3 3-3 3z"/><path d="M12 20.5v-4M12 16.5c0-2-1.3-3-3-3 0 2 1.3 3 3 3zM12 16.5c0-2 1.3-3 3-3 0 2-1.3 3-3 3z"/><path d="M18 20.5v-4M18 16.5c0-2-1.3-3-3-3 0 2 1.3 3 3 3zM18 16.5c0-2 1.3-3 3-3 0 2-1.3 3-3 3z"/><path d="M9 9.5v-3M9 6.5c0-1.6-1-2.4-2.4-2.4 0 1.6 1 2.4 2.4 2.4zM9 6.5c0-1.6 1-2.4 2.4-2.4 0 1.6-1 2.4-2.4 2.4z"/><path d="M15 9.5v-3M15 6.5c0-1.6-1-2.4-2.4-2.4 0 1.6 1 2.4 2.4 2.4zM15 6.5c0-1.6 1-2.4 2.4-2.4 0 1.6-1 2.4-2.4 2.4z"/><path d="M5.5 11h13"/>',
    pebble: '<path d="M4 15.6c0-3.7 3.5-7.1 8.2-7.1 4.3 0 7.8 2.6 7.8 5.8 0 3.3-3.2 5.2-7.8 5.2S4 18.3 4 15.6z"/><path d="M8.6 12.6c1-.8 2.3-1.3 3.7-1.3"/>',
    scale: '<path d="M12 3.5v17M8 20.5h8M4.5 7h15"/><path d="M4.5 7 2 13a2.5 2.5 0 0 0 5 0zM19.5 7 17 13a2.5 2.5 0 0 0 5 0z"/>',
    calendar: '<rect x="4" y="5.5" width="16" height="15" rx="2.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01"/>',
    notebook: '<rect x="5.5" y="3.5" width="13" height="17" rx="2"/><path d="M9 3.5v17"/><path d="M12 8h4M12 11.5h4"/><path d="M3.8 7h3M3.8 12h3M3.8 17h3"/>',
    wheelchair: '<circle cx="10.5" cy="4.6" r="1.9"/><path d="M10.5 8v6.5h5.2l2.6 5.2"/><path d="M10.5 11h5"/><path d="M7.6 11.2a5.6 5.6 0 1 0 7.8 6.9"/>',
    seat: '<path d="M7.5 12.2V4.9a1.4 1.4 0 0 1 1.4-1.4h6.2a1.4 1.4 0 0 1 1.4 1.4v7.3"/><rect x="5.5" y="12.2" width="13" height="2.8" rx="1.2"/><path d="M7.2 15 6.5 20.5M16.8 15l.7 5.5"/>',
    grandma: '<circle cx="9" cy="9.2" r="3.2"/><path d="M7.6 4.2a1.6 1.6 0 1 1 2.8 0"/><path d="M3 20.5c.6-3.7 3-5.6 6-5.6s5.4 1.9 6 5.6"/><path d="M15 3.5h5.5a1 1 0 0 1 1 1v3.6a1 1 0 0 1-1 1h-2.9l-2 1.6V9.1H15a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z"/>',
    miller: '<path d="M3.5 20.5V12.5L8.5 8l5 4.5v8"/><path d="M7 20.5v-4.3h3v4.3"/><path d="M16 20.5V8.4a2.5 2.5 0 0 1 5 0v12.1"/><path d="M16 12.2h5M16 15.9h5M2.5 20.5h19"/>',
    newfamily: '<path d="M4 9.5h16v11H4z"/><path d="M4 9.5 6 5.5h12l2 4"/><path d="M10 9.5v3.6h4V9.5"/><path d="M7 17.5h3"/>',
    night: '<path d="M16.5 15.6A7.2 7.2 0 0 1 8.4 4.4a7.4 7.4 0 1 0 8.1 11.2z"/><path d="M17.5 3.5v3.6M15.7 5.3h3.6"/><path d="M20.3 9.6h.01"/>',
    baby: '<path d="M10.8 9.8V4.3a5.5 5.5 0 0 1 5.5 5.5z"/><path d="M4.2 9.8h12.1a6 6 0 0 1-6 5.8 6 6 0 0 1-6.1-5.8z"/><path d="M4.2 9.8 2.6 7"/><circle cx="6.6" cy="19.2" r="1.8"/><circle cx="14.4" cy="19.2" r="1.8"/><path d="M7.8 15.2l-.6 2.3M13.2 15.2l.6 2.3"/>',
    worker: '<circle cx="7.5" cy="16.2" r="4.2"/><circle cx="7.5" cy="16.2" r="1.2"/><circle cx="18" cy="17.6" r="2.7"/><path d="M11.7 16.6h3.6M7.5 12V5.8h5.2l2 6.2h4.6a1 1 0 0 1 1 1v2"/><path d="M12.7 5.8V12M7.5 12h7.2"/><path d="M17.5 12V8.5"/>'
  };
  var SVGNS = "http://www.w3.org/2000/svg";
  function icon(name, cls) {
    var s = document.createElementNS(SVGNS, "svg");
    s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true"); s.setAttribute("focusable", "false");
    s.setAttribute("class", "cb-ico" + (cls ? " " + cls : ""));
    host.setAuthoredMarkup(s, ICONS[name]);                                    // constant, authored markup only
    return s;
  }

  var onEsc = null;
  /* A double tap must never act on the screen the first tap just opened (it would place a tile, invite someone or skip
     a step without the player seeing it). For a moment after each screen change under the finger, taps inside the
     game stage are dropped. */
  var calmUntil = 0;
  function calm() { calmUntil = Date.now() + 500; }
  function hush(e) {
    if (e.detail === 0 || Date.now() >= calmUntil) return;
    var t = e.target;
    if (!t || !t.closest || !t.closest('[data-game="community-builders"]')) return;
    e.preventDefault(); if (e.type === "click") e.stopPropagation();   // mousedown too, so focus stays where the first tap put it
  }
  document.addEventListener("mousedown", hush, true);
  document.addEventListener("click", hush, true);

  function run(api, stop) {
    var L = api.L, h = api.h, T = WORDS[L], NB = api.NB;
    var GUIDES = { lucia: { name: window.CBLocale.t("stop-15", L, "guides.lucia"), ic: "notebook" }, theo: { name: window.CBLocale.t("stop-15", L, "guides.theo"), ic: "wheelchair" } };
    if (api.input && api.input.on) api.input.on("back", function () {
      if (!onEsc || !document.querySelector(".cb-s15-tray") || document.querySelector("dialog[open]")) return false;
      onEsc(); return true;
    }, { scope: document.querySelector('[data-game="community-builders"]') });
    function t2(p) { return L === "es" ? p[1] : p[0]; }
    document.title = stop.name + " - " + api.W.series;

    /* ── the round ───────────────────────────────────────────────────── */
    var r = api.rec(stop.id) || {}, team = api.team();
    var prevA = team && team.phase === "B" && team.s15A ? team.s15A : null;
    var prevDeal = prevA ? prevA.deal : r.lastDeal || null;
    var prevGuests = prevA ? prevA.guests : r.lastGuests || null;
    /* dealing rule: neighbors in a random order; each gets one of their 3 wishes whose place has fewer than 2 wishes so far,
       preferring a wish they did not have last round. With at most 5 wishes dealt before anyone, it never gets stuck. */
    function dealWishes() {
      var count = { K: 0, M: 0, S: 0, F: 0 }, out = {};
      api.shuffle(Object.keys(NBW)).forEach(function (id) {
        var ok = NBW[id].filter(function (w) { return count[w.charAt(1)] < 2; });
        var fresh = ok.filter(function (w) { return !prevDeal || prevDeal[id] !== w; });
        var w = api.pick(fresh.length ? fresh : ok);
        out[id] = w; count[w.charAt(1)]++;
      });
      return out;
    }
    var deal = dealWishes();
    var trays = {};
    PLACES.forEach(function (P) { trays[P.id] = api.shuffle(P.big.length ? P.tiles.concat([api.pick(P.big)]) : P.tiles); });
    var checks = api.shuffle(CHECKS);
    var guests, missing, pool = PEOPLE.map(function (p) { return p.id; });
    for (var k = 0; k < 12; k++) {                                     // 2 at the table, 2 missing; never the same 2 guests as last round
      var four = api.shuffle(pool).slice(0, 4);
      guests = four.slice(0, 2); missing = four.slice(2);
      if (!prevGuests || guests.slice().sort().join() !== prevGuests.slice().sort().join()) break;
    }
    var rowPeople = api.shuffle(guests.concat(missing));
    if (team && team.phase === "A") team.s15A = { deal: deal, guests: guests.slice() };

    /* ── play state ──────────────────────────────────────────────────── */
    var viewPhase = "intro", lastPerson = null;
    var plan = {}, fair = {}, seen = {}, open = {}, openPlace = null;
    var check = null, tried = {}, firstTap = null, invited = null;
    function answered(nbId) {
      var w = deal[nbId], tid = plan[KEY_PLACE[w.charAt(1)]];
      return !!tid && TILES[tid].ans.indexOf(w) !== -1;
    }
    function nPlanned() { return PLACES.filter(function (P) { return !!plan[P.id]; }).length; }
    function nAnswered() { return NB.filter(function (n) { return answered(n.id); }).length; }
    function capP(id) { return t2(PERSON[id].name); }

    /* ── pieces ──────────────────────────────────────────────────────── */
    function badge() { return h("span", { "class": "cb-badge" }, [api.ico("check")]); }
    function keyed(el, key) { el.setAttribute("data-s15", key); return el; }
    function btn(label, cls, fn, ic, after) {           // a shell pill button that can also carry one of this stop's icons
      var b = h("button", { type: "button", "class": "cb-btn" + (cls ? " " + cls : ""), onclick: fn });
      var i = ic ? (ICONS[ic] ? icon(ic) : api.ico(ic)) : null;
      if (i && !after) b.appendChild(i);
      b.appendChild(h("span", { text: label }));
      if (i && after) b.appendChild(i);
      return b;
    }
    function nbAv(n) { return h("span", { "class": "cb-s15-av", "aria-hidden": "true" }, [api.img(n.img, "", null, true)]); }
    /* Lucía and Theo show their initial in a ring, the townspeople a paper silhouette in their colour: never a symbol or an object in a person's place */
    function guideAv(id) { return h("span", { "class": "cb-s15-av cb-s15-av--mono cb-s15-av--" + id, "aria-hidden": "true" }, [api.mono(GUIDES[id].name)]); }
    function personAv(id) { return h("span", { "class": "cb-s15-av cb-s15-av--guest", "aria-hidden": "true" }, [api.story(silhouette(PCOL[id] || "wd"), "cb-s15-sil")]); }
    function tico(tid) {
      var t = TILES[tid];
      return h("span", { "class": "cb-s15-tico" + (t.ic.length === 1 ? " cb-s15-tico--one" : ""), "aria-hidden": "true" }, t.ic.map(function (n) { return icon(n); }));
    }
    function sayRow(av, who, text, key, cls) {           // a guide or neighbor speaking: avatar, HTML name label, the line
      return h("div", { "class": "cb-s15-say" + (cls ? " " + cls : "") }, [av, h("div", { "class": "cb-s15-say__b" }, [
        h("b", { "class": "cb-s15-say__who", text: who }),
        h("p", { "class": "cb-s15-say__t", tabindex: key ? "-1" : null, "data-s15": key || null, text: text })])]);
    }
    function hud(i) { return i < 3 ? api.stopHud(stop, DOTS, i, T.step(i + 1)) : api.stopHud(stop, DOTS, 3, null); }
    function place(li, P, F) {
      li.style.setProperty("--x", ((P.at[0] - F.x0) / F.w * 100).toFixed(2));
      li.style.setProperty("--y", ((P.at[1] - F.y0) / F.hh * 100).toFixed(2));
      return li;
    }
    function disc(P, fresh) {
      var tid = plan[P.id];
      return h("span", { "class": "cb-s15-disc" + (tid ? " is-on" : "") + (fresh ? " is-new" : ""), "aria-hidden": "true" }, [tid ? tico(tid) : icon(P.ic, "cb-s15-disc__place")]);
    }
    /* the painted town band with its five clearings: "play" has real place buttons, "view" only shows the plan */
    function town(mode, freshPlace, frame) {
      var F = FRAMES[frame || "band"];
      /* "view" names each place and what the plan put there, in words on a paper tag; "play" keeps the small markers for the phone list */
      var pins = h("ul", { "class": "cb-s15-pins", "aria-hidden": "true" }, PLACES.map(function (P) {
        var tid = plan[P.id];
        var mark = mode === "view" ? h("span", { "class": "cb-story-tag cb-s15-vtag" + (freshPlace === P.id ? " is-new" : "") }, [h("b", { text: t2(P.name) }), tid ? h("small", { text: t2(TILES[tid].name) }) : null])
          : disc(P, freshPlace === P.id);
        return place(h("li", null, [mark]), P, F);
      }));
      var kids = [api.crop(F.crop, F.cls, [pins])];
      if (mode === "play") kids.push(h("ul", { "class": "cb-s15-places" }, PLACES.map(function (P) { return place(h("li", null, [placeBtn(P, freshPlace === P.id)]), P, F); })));
      return h("div", { "class": "cb-s15-town cb-s15-town--" + mode }, kids);
    }
    function placeBtn(P, fresh) {
      var tid = plan[P.id], name = t2(P.name);
      return h("button", { type: "button", "class": "cb-s15-place" + (tid ? " is-on" : ""), "data-s15-place": P.id,
        "aria-label": tid ? T.lblOn(name, t2(TILES[tid].name)) : T.lblNot(name), onclick: function () { openTray(P.id); } }, [
        disc(P, fresh), h("span", { "class": "cb-s15-place__t" }, [h("b", { text: name }), h("small", { text: tid ? t2(TILES[tid].name) : T.notYet })])]);
    }
    function nbrs(fresh) {
      return h("ul", { "class": "cb-s15-nbrs" }, NB.map(function (n) {
        var ok = answered(n.id);
        return h("li", { "class": "cb-s15-wish" + (ok ? " is-on" : "") + (fresh && fresh[n.id] ? " is-new" : ""), "data-s15-nb": n.id }, [
          h("span", { "class": "cb-s15-wish__face" }, [nbAv(n), ok ? badge() : null]),
          h("div", { "class": "cb-s15-wish__body" }, [
            h("p", { "class": "cb-s15-wish__name" }, [h("b", { text: api.nmCap(n) }), ok ? h("span", { "class": "cb-s15-inplan" }, [api.ico("check"), h("span", { text: T.inPlan })]) : null]),
            h("p", { "class": "cb-s15-wish__k", text: T.myWish }),
            h("p", { "class": "cb-s15-wish__t", text: t2(WISH[deal[n.id]]) })])]);
      }));
    }
    function faces() {
      return h("ul", { "class": "cb-faces cb-s15-faces", "aria-hidden": "true" }, NB.map(function (n) { return h("li", { "class": answered(n.id) ? "is-on" : null }, [api.img(n.img, "", null, true)]); }));
    }
    function progress() {
      return h("div", { "class": "cb-s15-progress" }, [h("p", { "class": "cb-msg", text: T.placesN(nPlanned()) }), h("p", { "class": "cb-msg", text: T.wishesN(nAnswered()) })]);
    }

    /* ── scrolling that also works in the game's full-screen mode ───── */
    function fsEl() { return document.fullscreenElement || document.webkitFullscreenElement || null; }
    function view() { var s = fsEl(); return s ? { top: s.getBoundingClientRect().top, h: s.clientHeight } : { top: 0, h: window.innerHeight || 0 }; }
    function scrollBy(dy) {
      if (Math.abs(dy) < 4) return;
      var s = fsEl(), how = api.REDUCED ? "auto" : "smooth";
      try { (s || window).scrollBy({ top: dy, behavior: how }); } catch (e) { if (s) s.scrollTop += dy; else window.scrollBy(0, dy); }
    }
    function narrow() { var st = document.querySelector(".cb"); return !!st && st.getBoundingClientRect().width < 900; }
    function revealTray() {
      var tr = document.querySelector(".cb-s15-tray"), nb = document.querySelector(".cb-s15-nbrs"); if (!tr) return;
      var v = view(), a = tr.getBoundingClientRect(), top = a.top;
      if (!narrow() && nb) { var b = nb.getBoundingClientRect(); if (a.bottom - b.top <= v.h - 24) top = b.top; }
      if (top - v.top < 8 || a.bottom > v.top + v.h - 8) scrollBy(top - v.top - 12);
    }
    function revealEl(el) {                                       // the nearest scroll; the sticky action bar covers the bottom
      if (!el) return;
      var v = view(), a = el.getBoundingClientRect(), low = v.top + v.h - 120;
      if (a.top < v.top + 12) scrollBy(a.top - v.top - 12);
      else if (a.bottom > low) scrollBy(a.bottom - low);
    }
    function revealBar() {                                        // wide layout: Step 1's bar sits under the town, not over it
      var el = document.querySelector(".cb-s15-actions--plan"); if (!el) return;
      var v = view(), a = el.getBoundingClientRect();
      if (a.bottom > v.top + v.h - 12) scrollBy(a.bottom - (v.top + v.h) + 16);
    }

    /* ── 0 · intro over the town ─────────────────────────────────────── */
    function intro() {
      viewPhase = "intro";
      var go = keyed(btn(T.start, "cb-btn--go cb-btn--big", function () { calm(); play(); }, "go", true), "start");
      var card = h("div", { "class": "cb-s15-introcard" }, [
        sayRow(guideAv("lucia"), GUIDES.lucia.name, T.lucia1, "intro"),
        sayRow(guideAv("theo"), GUIDES.theo.name, T.theo1),
        h("p", { "class": "cb-s15-introcard__plan", text: T.plan }),
        h("div", { "class": "cb-row" }, [go])]);
      api.screen([api.stopHud(stop, null), h("div", { "class": "cb-board cb-s15" }, [h("div", { "class": "cb-s15-intro" }, [api.crop([0, 0, 1], "cb-s15-intro__art"), card])])], '[data-s15="intro"]');
      api.frame();
    }

    /* ── 1 · plan 5 places ───────────────────────────────────────────── */
    function render1(focusSel, opt) {
      viewPhase = "plan";
      opt = opt || {};
      var coach = api.coach(T.s1, "home"); coach.setAttribute("tabindex", "-1"); coach.setAttribute("data-s15", "coach");
      var work = openPlace ? tray(openPlace) : town("play", opt.freshPlace);
      var next = nPlanned() === 5 ? keyed(btn(api.W.next, "cb-btn--go cb-btn--big", function () { calm(); step2(); }, "go", true), "next") : null;
      onEsc = openPlace ? closeTray : null;
      api.screen([hud(0), h("div", { "class": "cb-board cb-s15" }, [coach,
        h("div", { "class": "cb-s15-plan" + (openPlace ? " is-tray" : "") }, [nbrs(opt.freshNb), work]),
        h("div", { "class": "cb-actions cb-s15-actions cb-s15-actions--plan" + (openPlace ? " is-calm" : "") }, [h("div", { "class": "cb-actions__info" }, [faces(), progress()]), next])])], focusSel);
    }
    function play() { render1('[data-s15="coach"]'); api.frame(true); api.say(T.s1); }
    function openTray(pid) {
      calm();
      openPlace = pid;
      render1('[data-s15="tray-h"]');
      revealTray();
    }
    function closeTray() {
      calm();
      var pid = openPlace; openPlace = null;
      render1('[data-s15-place="' + pid + '"]');
      revealEl(document.querySelector('[data-s15-place="' + pid + '"]'));
    }
    function tray(pid) {
      var P = PLACE[pid];
      var x = h("button", { type: "button", "class": "cb-s15-x", "aria-label": api.W.close, "data-s15": "tray-x", onclick: closeTray }, [api.ico("close")]);
      return h("section", { "class": "cb-s15-tray", "aria-labelledby": "cb-s15-tray-h", "data-s15-tray": pid }, [
        h("div", { "class": "cb-s15-tray__head" }, [api.crop(P.crop, "cb-s15-tray__art"),
          h("h3", { id: "cb-s15-tray-h", tabindex: "-1", "data-s15": "tray-h", text: T.tray(t2(P.name)) }), x]),
        trayWishes(pid),
        h("ul", { "class": "cb-s15-tiles", "data-cb-choices": "" }, trays[pid].map(function (tid) { return h("li", null, [tileCard(pid, tid)]); }))]);
    }
    function trayWishes(pid) {
      var who = NB.filter(function (n) { return KEY_PLACE[deal[n.id].charAt(1)] === pid; });
      if (!who.length) return null;
      return h("div", { "class": "cb-s15-traywish" }, [h("p", { "class": "cb-s15-traywish__k", text: T.forHere }), h("ul", null, who.map(function (n) {
        return h("li", null, [api.img(n.img, "", "cb-s15-traywish__face", true), h("p", null, [h("b", { text: api.nmCap(n) + ": " }), t2(WISH[deal[n.id]])])]);
      }))]);
    }
    function tileCard(pid, tid) {
      var t = TILES[tid], cur = plan[pid] === tid, isOpen = !!open[tid], noteId = "cb-s15-note-" + tid;
      var note = h("div", { "class": "cb-s15-note", id: noteId, hidden: isOpen ? null : true }, [
        h("p", { "class": "cb-s15-note__row cb-s15-note__row--good" }, [h("span", { "class": "cb-s15-note__ic", "aria-hidden": "true" }, [icon("sprout")]),
          h("span", null, [h("b", { text: T.good }), " " + t2(t.good)])]),
        h("p", { "class": "cb-s15-note__row cb-s15-note__row--hard" }, [h("span", { "class": "cb-s15-note__ic", "aria-hidden": "true" }, [icon("pebble")]),
          h("span", null, [h("b", { text: T.hard }), " " + t2(t.hard)])])]);
      var card;
      var see = btn(T.see, "cb-s15-see", function () { toggle(tid, see, note, card); }, "scale");
      see.setAttribute("aria-expanded", isOpen ? "true" : "false"); see.setAttribute("aria-controls", noteId); see.setAttribute("data-s15-see", tid);
      var put = btn(T.put, "cb-btn--primary cb-s15-put", function () { putTile(pid, tid); }, "check");
      put.setAttribute("aria-pressed", cur ? "true" : "false"); put.setAttribute("data-s15-put", tid);
      card = h("div", { "class": "cb-s15-tile" + (cur ? " is-current" : "") + (isOpen ? " is-open" : ""), "data-s15-tile": tid, role: "group", "aria-labelledby": "cb-s15-tn-" + tid }, [
        h("div", { "class": "cb-s15-tile__head" }, [h("span", { "class": "cb-s15-tile__disc" }, [tico(tid), cur ? badge() : null]), h("b", { "class": "cb-s15-tile__name", id: "cb-s15-tn-" + tid, text: t2(t.name) })]),
        see, note, put]);
      return card;
    }
    var lastToggle = {};
    function toggle(tid, see, note, card) {                         // in place, so the tray never jumps
      var now = Date.now();
      if (now - (lastToggle[tid] || 0) < 400) return;                // a double tap opens the note once, not open-then-shut
      lastToggle[tid] = now;
      var on = !open[tid]; open[tid] = on;
      if (on) seen[tid] = true;
      see.setAttribute("aria-expanded", on ? "true" : "false"); note.hidden = !on; card.classList.toggle("is-open", on);
      if (on) api.say(T.good + " " + t2(TILES[tid].good) + " " + T.hard + " " + t2(TILES[tid].hard));
    }
    function putTile(pid, tid) {
      var before = {}, fresh = {};
      NB.forEach(function (n) { before[n.id] = answered(n.id); });
      plan[pid] = tid; fair[pid] = !!seen[tid];
      NB.forEach(function (n) { if (answered(n.id) && !before[n.id]) fresh[n.id] = 1; });
      openPlace = null;
      calm();
      render1('[data-s15-place="' + pid + '"]', { freshPlace: pid, freshNb: fresh });
      if (nPlanned() === 5 && !narrow()) revealBar();             // "Next" has just appeared under the town
      else revealEl(document.querySelector('[data-s15-place="' + pid + '"]'));
      api.say(T.placesN(nPlanned()) + ". " + T.wishesN(nAnswered()) + ".");
    }

    /* ── 2 · check it every year ─────────────────────────────────────── */
    function render2(focusSel, msg) {
      viewPhase = "check";
      var list = h("ul", { "class": "cb-s15-checks", "data-cb-choices": "" }, checks.map(function (c) {
        var on = check === c.id;
        return h("li", null, [h("button", { type: "button", "class": "cb-s15-check" + (on ? " is-on" : ""), "aria-pressed": on ? "true" : "false", "data-s15-check": c.id,
          onclick: function () { pickCheck(c.id); } }, [
          h("span", { "class": "cb-s15-check__ic", "aria-hidden": "true" }, [icon("calendar"), on ? badge() : null]),
          h("span", { "class": "cb-s15-check__t", text: t2(c.text) })])]);
      }));
      var next = keyed(btn(api.W.next, "cb-btn--go cb-btn--big", function () { calm(); step3(); }, "go", true), "next");
      api.screen([hud(1), h("div", { "class": "cb-board cb-s15" }, [
        h("div", { "class": "cb-s15-step2" }, [h("div", { "class": "cb-s15-step2__main" }, [sayRow(guideAv("theo"), GUIDES.theo.name, T.theo2, "theo"), list]), town("view", null, "close")]),
        h("div", { "class": "cb-actions cb-s15-actions" }, [h("div", { "class": "cb-actions__info" }, [msg ? api.fb(msg, true) : null]), next])])], focusSel);
    }
    function step2() { onEsc = null; render2('[data-s15="theo"]'); api.frame(true); api.say(T.theo2); }
    function pickCheck(id) { check = id; render2('[data-s15-check="' + id + '"]', T.added); api.say(T.added); }

    /* ── 3 · who isn't here yet? ─────────────────────────────────────── */
    function seat(av, name, cls) { return h("li", { "class": "cb-s15-seat" + (cls ? " " + cls : "") }, [av, h("span", { "class": "cb-s15-seat__n", text: name })]); }
    function render3(focusSel, msg, ok) {
      viewPhase = "invite";
      var seats = NB.map(function (n) { return seat(nbAv(n), api.nmCap(n)); })
        .concat([seat(guideAv("lucia"), GUIDES.lucia.name), seat(guideAv("theo"), GUIDES.theo.name)])
        .concat(guests.map(function (id) { return seat(personAv(id), capP(id), "is-guest"); }))
        .concat([invited ? seat(personAv(invited), capP(invited), "is-guest is-new") : h("li", { "class": "cb-s15-seat cb-s15-seat--empty", "aria-hidden": "true" }, [h("span", { "class": "cb-s15-av cb-s15-av--empty" }, [icon("seat")])])]);
      var row = h("ul", { "class": "cb-s15-people", "data-cb-choices": "" }, rowPeople.map(function (id) {
        var isTried = !!tried[id], isIn = invited === id, locked = !!invited || isTried;
        return h("li", null, [h("button", { type: "button", "class": "cb-s15-person" + (isTried ? " is-tried" : "") + (isIn ? " is-in" : "") + (locked && !isTried && !isIn ? " is-locked" : ""),
          "data-s15-person": id, "aria-disabled": locked ? "true" : null, "aria-label": capP(id) + (isTried ? ", " + T.tried : ""), onclick: function () { tapPerson(id); } }, [
          personAv(id), h("span", { "class": "cb-s15-person__n", text: capP(id) }),
          isTried ? h("span", { "class": "cb-s15-person__tag", "aria-hidden": "true", text: T.tried }) : null,
          isIn ? h("span", { "class": "cb-s15-person__stamp", "aria-hidden": "true" }, [api.ico("check")]) : null])]);
      }));
      var fin = keyed(btn(T.finishPlan, "cb-btn--go cb-btn--big", function () { calm(); react(); }, "check"), "finish");
      api.screen([hud(2), h("div", { "class": "cb-board cb-s15" }, [sayRow(guideAv("lucia"), GUIDES.lucia.name, T.lucia3, "lucia", "cb-s15-say--lead"),
        h("div", { "class": "cb-s15-step3" }, [
          h("section", { "class": "cb-s15-table", "aria-labelledby": "cb-s15-table-h" }, [h("h3", { id: "cb-s15-table-h", text: T.table }), h("ul", { "class": "cb-s15-seats" }, seats)]),
          h("section", { "class": "cb-s15-who", "aria-labelledby": "cb-s15-who-h" }, [h("h3", { id: "cb-s15-who-h", text: T.who }), row])]),
        h("div", { "class": "cb-actions cb-s15-actions" }, [h("div", { "class": "cb-actions__info" }, [msg ? api.fb(msg, ok) : null]), fin])])], focusSel);
    }
    function step3() { render3('[data-s15="lucia"]'); api.frame(true); api.say(T.lucia3); }
    function tapPerson(id) {
      if (invited || tried[id]) return;
      lastPerson = id;
      var m;
      if (guests.indexOf(id) !== -1) {                                  // already at the table: never wrong-sounding
        tried[id] = 1; if (!firstTap) firstTap = "guest";
        m = T.look(capP(id)); render3('[data-s15-person="' + id + '"]', m, false);
      } else {
        invited = id; if (!firstTap) firstTap = "missing";
        m = T.great(capP(id)); render3('[data-s15="finish"]', m, true);
      }
      api.say(m);
    }

    /* ── the neighbors react on the 2035 scene ──────────────────────── */
    function react() {
      viewPhase = "react";
      var cards = NB.map(function (n) {
        var ok = answered(n.id);
        return h("li", { "class": "cb-s15-react" + (ok ? " is-on" : "") }, [sayRow(h("span", { "class": "cb-s15-react__face" }, [nbAv(n), ok ? badge() : null]), api.nmCap(n), ok ? T.yes : T.notYetWish)]);
      });
      var voices = [h("li", { "class": "cb-s15-react" }, [sayRow(guideAv("lucia"), GUIDES.lucia.name, T.luciaFarm(t2(TILES[plan.farm].name)))])];
      if (check) voices.push(h("li", { "class": "cb-s15-react" }, [sayRow(guideAv("theo"), GUIDES.theo.name, T.theoCheck)]));
      if (invited) voices.push(h("li", { "class": "cb-s15-react" }, [sayRow(personAv(invited), capP(invited), T.thanks)]));
      cards[0].setAttribute("tabindex", "-1"); cards[0].setAttribute("data-s15", "react");
      var go = keyed(btn(T.picnic, "cb-btn--go cb-btn--big", function () { calm(); picnic(); }, "go", true), "picnic");
      api.screen([hud(3), h("div", { "class": "cb-board cb-s15" }, [h("div", { "class": "cb-s15-reacts" }, [h("ul", { "class": "cb-s15-reactlist" }, cards),
        h("div", { "class": "cb-s15-reacts__town" }, [town("view", null, "close"), h("ul", { "class": "cb-s15-voices" }, voices)])]),
        h("div", { "class": "cb-actions cb-s15-actions cb-s15-actions--recap" }, [h("div", { "class": "cb-actions__info" }, [faces(), progress()]), go])])], '[data-s15="react"]');
      api.frame(true);
    }

    /* ── the picnic: everyone gathers on the river meadow, then the aha ── */
    function picnic() {
      viewPhase = "picnic";
      var avs = NB.map(function (n) { return [nbAv(n), api.nmCap(n)]; }).concat([[guideAv("lucia"), GUIDES.lucia.name], [guideAv("theo"), GUIDES.theo.name]],
        guests.map(function (g) { return [personAv(g), t2(PSHORT[g])]; }), invited ? [[personAv(invited), t2(PSHORT[invited])]] : []);
      var crowd = h("ul", { "class": "cb-s15-crowd", "aria-hidden": "true" }, avs.map(function (a, i) {
        var li = h("li", null, [a[0], h("span", { "class": "cb-story-tag cb-s15-crowd__n", text: a[1] })]), side = i % 2 ? 1 : -1;
        li.style.setProperty("--fx", (side * (140 + Math.round((api.rng ? api.rng() : Math.random()) * 160))) + "px");
        li.style.setProperty("--fy", (-30 - Math.round((api.rng ? api.rng() : Math.random()) * 60)) + "px");
        li.style.setProperty("--d", (i * 0.07).toFixed(2) + "s");
        return li;
      }));
      var see = keyed(btn(T.seeScore, "cb-btn--go cb-btn--big", function () { calm(); finish(); }, "go", true), "see");
      api.screen([hud(3), h("div", { "class": "cb-board cb-s15" }, [h("div", { "class": "cb-s15-picnic" }, [api.crop([0, 0.62, 0.5], "cb-s15-picnic__art", [crowd]),
        h("div", { "class": "cb-s15-aha" }, [api.img("unity", "", null, true),
          h("p", { "class": "cb-s15-aha__t", tabindex: "-1", "data-s15": "aha" }, [h("strong", { text: T.aha })]), see])])])], '[data-s15="aha"]');
      api.frame(true);
      if (api.REDUCED) crowd.classList.add("is-in");
      else requestAnimationFrame(function () { requestAnimationFrame(function () { crowd.classList.add("is-in"); }); });
      api.say(T.aha);
    }

    /* ── score (process only) and the score card ─────────────────────── */
    function finish() {
      viewPhase = "result";
      var nW = nAnswered(), nT = PLACES.filter(function (P) { return plan[P.id] && fair[P.id]; }).length;
      var inv = invited ? (firstTap === "missing" ? 10 : 5) : 0;
      var score = 10 * nW + 4 * nT + (check ? 10 : 0) + inv;
      var left = NB.filter(function (n) { return !answered(n.id); })[0];
      var tip = left ? T.tipWish(api.nm(left)) : nT < 5 ? T.tipTrade : !check ? T.tipCheck : inv < 10 ? T.tipInvite : T.tip100;
      var key = NB.map(function (n) { return deal[n.id]; }).join(",") + "|" + guests.slice().sort().join(",");
      var info = api.saveRound(stop.id, score, { processBadge: nW === 6 && nT === 5 && check && invited ? "process-15" : null, lastRound: key, lastDeal: deal, lastGuests: guests.slice() });
      api.endPlay();
      var gu = btn(T.gu, "cb-btn--quiet", function () { api.dialog(T.gu, [h("div", { "class": "cb-dlg__body" }, [h("p", { text: T.guText })])], gu); }, "family");
      var ask = h("div", { "class": "cb-tipcard cb-s15-ask" }, [api.ico("chat"), h("div", null, [h("strong", { text: T.askK }), h("p", { text: T.ask })])]);
      var card = api.scoreCard(stop, score, info, tip, T.can, T.real, ask);
      var row = h("ul", { "class": "cb-s15-planrow" }, PLACES.map(function (P) {
        var tid = plan[P.id];
        return h("li", null, [h("span", { "class": "cb-s15-disc is-on" }, [tico(tid)]), h("span", { "class": "cb-s15-planrow__n", text: t2(TILES[tid].name) })]);
      }));
      var can = card.querySelector(".cb-card__can");
      if (can && can.parentNode) can.parentNode.insertBefore(row, can.nextSibling); else card.appendChild(row);
      var row2 = api.cardButtons(stop.id, api.restart(stop.id), gu);
      nextStopFrom15(row2, card);
      api.finishRound(stop.id, card, row2);
      api.say(api.W.score + " " + score + " / 100");
    }
    /* Next stop from Stop 15 (spec 15H.8): the lowest-numbered playable stop not finished yet; if none, the map with
       "More stops are coming soon!" or, when all 15 are finished, "You finished the journey!". The shell's button only
       looks at stops after this one, so it is swapped here. A stop that is not built yet does nothing when started,
       so each candidate is tried in order until one opens. */
    function nextStopFrom15(row, card) {
      var old = [].filter.call(row.children, function (b) { return b.textContent.trim() === api.W.nextStop; })[0];
      if (!old) return;                                            // Team challenge rows have no Next stop
      row.replaceChild(btn(api.W.nextStop, "cb-btn--big", function () {
        var todo = api.STOPS.filter(function (x) { return x.id !== stop.id && !api.rec(x.id); });
        for (var i = 0; i < todo.length; i++) { api.restart(todo[i].id)(); if (!card.isConnected) return; }
        api.showMap(todo.length ? api.W.moreSoon : T.journeyDone);
      }, "go", true), old);
    }

    if (api.setController) api.setController({
      snapshot: function () { return { v: 2, phase: viewPhase, plan: plan, fair: fair, seen: seen, open: open, openPlace: openPlace,
        check: check, tried: tried, firstTap: firstTap, invited: invited, lastPerson: lastPerson }; },
      restore: function (saved) {
        if (!saved || saved.v !== 2) return false;
        plan = saved.plan; fair = saved.fair; seen = saved.seen; open = saved.open; openPlace = saved.openPlace;
        check = saved.check; tried = saved.tried; firstTap = saved.firstTap; invited = saved.invited; lastPerson = saved.lastPerson; onEsc = null;
        if (saved.phase === "result") finish(); else if (saved.phase === "picnic") picnic(); else if (saved.phase === "react") react();
        else if (saved.phase === "invite") render3(null, lastPerson ? (invited === lastPerson ? T.great(capP(lastPerson)) : T.look(capP(lastPerson))) : null, !!invited);
        else if (saved.phase === "check") render2(null, check ? T.added : null); else if (saved.phase === "plan") render1(); else intro();
        return true;
      }
    });

    intro();
  }

  CB.register({ id: ID, steps: DOTS, css: "15-build-the-future-together.css", run: run });

    return definition;
  }
  if (host.defineStop) host.defineStop(factory);
  else host.register(factory({ document: document, window: window, Date: Date, setTimeout: setTimeout, clearTimeout: clearTimeout, requestAnimationFrame: requestAnimationFrame, cancelAnimationFrame: typeof cancelAnimationFrame === "function" ? cancelAnimationFrame : function () {} }));
})();
