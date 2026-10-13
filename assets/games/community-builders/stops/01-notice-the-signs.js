/* Community Builders of Pecan Grove · Stop 1 · Notice the Signs / Fíjate en las señales
   Skill: notice small, quiet signs of a big change without assuming every change is about the project.
   One painted scene (the road by the creek, a crop of the town map), two views: "Last month" is empty,
   "Today" holds 12 new things, 6 signs of the project and 6 everyday changes, drawn fresh every round.
   Score (score card only): +12 per sign found (72) + careful noticing 28, minus 4 per everyday change tapped. */
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

  /* ── words, exact from the spec (01 - notice-the-signs.md) ─────────── */
  var T = window.CBLocale.read("stop-01", LANG, {en:{"T.every":function (n) { return window.CBLocale.part("stop-01", "en", "T.every", 0) + n + window.CBLocale.part("stop-01", "en", "T.every", 1); },"T.foundN":function (n) { return window.CBLocale.part("stop-01", "en", "T.foundN", 0) + n + window.CBLocale.part("stop-01", "en", "T.foundN", 1); },"T.everyN":function (n) { return window.CBLocale.part("stop-01", "en", "T.everyN", 0) + n; },"T.tipMiss":function (n) { return window.CBLocale.part("stop-01", "en", "T.tipMiss", 0) + n + window.CBLocale.part("stop-01", "en", "T.tipMiss", 1); }},es:{"T.every":function (n) { return window.CBLocale.part("stop-01", "es", "T.every", 0) + n + window.CBLocale.part("stop-01", "es", "T.every", 1); },"T.foundN":function (n) { return window.CBLocale.part("stop-01", "es", "T.foundN", 0) + n + window.CBLocale.part("stop-01", "es", "T.foundN", 1); },"T.everyN":function (n) { return window.CBLocale.part("stop-01", "es", "T.everyN", 0) + n; },"T.tipMiss":function (n) { return window.CBLocale.part("stop-01", "es", "T.tipMiss", 0) + n + window.CBLocale.part("stop-01", "es", "T.tipMiss", 1); }}}).T;

  /* ── the 20 items. sign: true = a sign of the project. board = words that sit on the item as HTML text.
     tag = the short name written under the picture, so a first-time player always knows what each thing is ── */
  var ITEMS = [
    { id: "sign", sign: true, name: window.CBLocale.pair("stop-01","bank.b0001"), tag: window.CBLocale.pair("stop-01","bank.b0002"),
      board: { kind: "post", text: window.CBLocale.pair("stop-01","bank.b0003") },
      line: window.CBLocale.pair("stop-01","bank.b0004") },
    { id: "flags", sign: true, name: window.CBLocale.pair("stop-01","bank.b0005"), tag: window.CBLocale.pair("stop-01","bank.b0006"),
      line: window.CBLocale.pair("stop-01","bank.b0007") },
    { id: "paint", sign: true, name: window.CBLocale.pair("stop-01","bank.b0008"), tag: window.CBLocale.pair("stop-01","bank.b0009"),
      line: window.CBLocale.pair("stop-01","bank.b0010") },
    { id: "notice", sign: true, name: window.CBLocale.pair("stop-01","bank.b0011"), tag: window.CBLocale.pair("stop-01","bank.b0012"),
      line: window.CBLocale.pair("stop-01","bank.b0013") },
    { id: "truck", sign: true, name: window.CBLocale.pair("stop-01","bank.b0014"), tag: window.CBLocale.pair("stop-01","bank.b0015"),
      line: window.CBLocale.pair("stop-01","bank.b0016") },
    { id: "drill", sign: true, name: window.CBLocale.pair("stop-01","bank.b0017"), tag: window.CBLocale.pair("stop-01","bank.b0018"),
      line: window.CBLocale.pair("stop-01","bank.b0019") },
    { id: "paper", sign: true, name: window.CBLocale.pair("stop-01","bank.b0020"), tag: window.CBLocale.pair("stop-01","bank.b0021"),
      line: window.CBLocale.pair("stop-01","bank.b0022") },
    { id: "code", sign: true, name: window.CBLocale.pair("stop-01","bank.b0023"), tag: window.CBLocale.pair("stop-01","bank.b0024"),
      board: { kind: "paper", text: window.CBLocale.pair("stop-01","bank.b0025") },
      line: window.CBLocale.pair("stop-01","bank.b0026") },
    { id: "letter", sign: true, name: window.CBLocale.pair("stop-01","bank.b0027"), tag: window.CBLocale.pair("stop-01","bank.b0028"),
      line: window.CBLocale.pair("stop-01","bank.b0029") },
    { id: "sale", sign: true, name: window.CBLocale.pair("stop-01","bank.b0030"), tag: window.CBLocale.pair("stop-01","bank.b0031"),
      board: { kind: "hang", text: window.CBLocale.pair("stop-01","bank.b0032") },
      line: window.CBLocale.pair("stop-01","bank.b0033") },
    { id: "mural", name: window.CBLocale.pair("stop-01","bank.b0034"), tag: window.CBLocale.pair("stop-01","bank.b0035") },
    { id: "icecream", name: window.CBLocale.pair("stop-01","bank.b0036"), tag: window.CBLocale.pair("stop-01","bank.b0037") },
    { id: "branch", name: window.CBLocale.pair("stop-01","bank.b0038"), tag: window.CBLocale.pair("stop-01","bank.b0039") },
    { id: "cat", name: window.CBLocale.pair("stop-01","bank.b0040"), tag: window.CBLocale.pair("stop-01","bank.b0041") },
    { id: "pumpkin", name: window.CBLocale.pair("stop-01","bank.b0042"), tag: window.CBLocale.pair("stop-01","bank.b0043") },
    { id: "bike", name: window.CBLocale.pair("stop-01","bank.b0044"), tag: window.CBLocale.pair("stop-01","bank.b0045") },
    { id: "yard", name: window.CBLocale.pair("stop-01","bank.b0046"), tag: window.CBLocale.pair("stop-01","bank.b0047") },
    { id: "ball", name: window.CBLocale.pair("stop-01","bank.b0048"), tag: window.CBLocale.pair("stop-01","bank.b0049") },
    { id: "leaves", name: window.CBLocale.pair("stop-01","bank.b0050"), tag: window.CBLocale.pair("stop-01","bank.b0051") },
    { id: "feeder", name: window.CBLocale.pair("stop-01","bank.b0052"), tag: window.CBLocale.pair("stop-01","bank.b0053") }
  ];

  /* ── storybook art: each thing is a small painted object on the 64-unit grid, standing on its own ground shadow.
     One warm outline (stroke), flat fills from the painted map's colours (classes, in the CSS), no words in any picture.
     Class key: n = no outline · ln = thin detail line · hd = heavy line · sh = ground shadow · hl = soft highlight ── */
  var ART = {
    sign: '<ellipse class="sh" cx="32" cy="58" rx="20" ry="2.8"/><rect class="wd" x="13" y="30" width="5" height="28" rx="1"/><rect class="wd" x="46" y="30" width="5" height="28" rx="1"/>' +
      '<rect class="wh" x="5" y="7" width="54" height="31" rx="2.5"/><rect class="n bl" x="8" y="10" width="48" height="7.5" rx="1"/><path class="hd" d="M12 24.5h40M12 31h27"/>',
    flags: '<ellipse class="sh" cx="33" cy="57.5" rx="25" ry="3.4"/><path class="n grd" d="M6 57.5c1-5 3-8 6-9-1 3-1 6-.5 9zM11.5 57.5c0-4 1-6.5 3-7.5 0 2.5 0 5 .5 7.5zM53 57.5c1-4 3-7 6-8-1 3-1 6-.4 8z"/>' +
      '<path class="stk" d="M15 57V20M32 57V11M49 57V24"/>' +
      '<path class="or" d="M15 20h14l-3.5 5.5L29 31H15z"/><path class="n ord" d="M16 26.6h10.4l1.8 3.4H16z"/>' +
      '<path class="or" d="M32 11h14l-3.5 5.5L46 22H32z"/><path class="n ord" d="M33 17.6h10.4l1.8 3.4H33z"/>' +
      '<path class="or" d="M49 24h11l-3 4.5 3 4.5H49z"/><path class="n ord" d="M50 29.5h7.8l1.4 2.5H50z"/>',
    paint: '<ellipse class="sh" cx="32" cy="57.5" rx="27" ry="3.2"/><path class="dt" d="M3 50c0-5.5 12.5-9 29-9s29 3.5 29 9-12.5 8.5-29 8.5S3 55.5 3 50z"/>' +
      '<path class="pnt" d="M8 50h17M20 46l5 4-5 4M30 50h4M38 50h4"/>' +
      '<rect class="or" x="45" y="20" width="13" height="26" rx="3"/><path class="n ord" d="M53.5 21.2h2.4a1 1 0 0 1 1 1v21.6a1 1 0 0 1-1 1h-2.4z"/><rect class="n wh" x="46" y="28" width="11" height="7"/>' +
      '<path class="wh" d="M47 20v-4.5h9V20"/><rect class="mt" x="49.5" y="11" width="4" height="4.5" rx="1"/>' +
      '<circle class="n or" cx="45" cy="11.5" r="1.4"/><circle class="n or" cx="41.5" cy="14.5" r="1.1"/><circle class="n or" cx="42.5" cy="8.5" r="1"/>',
    notice: '<ellipse class="sh" cx="32" cy="58.5" rx="22" ry="2.8"/><rect class="wdd" x="15" y="42" width="4.5" height="16" rx="1"/><rect class="wdd" x="44.5" y="42" width="4.5" height="16" rx="1"/>' +
      '<rect class="wd" x="6" y="11" width="52" height="34" rx="3"/><rect class="n crk" x="10.5" y="15.5" width="43" height="25" rx="1.5"/><path class="rd" d="M2.5 13L32 4l29.5 9z"/>' +
      '<path class="bl" d="M12.5 19l7 .6-.7 8-7-.6z"/><path class="yl" d="M45 21l6.5-.8 1 7.6-6.5.8z"/>' +
      '<path class="pp" d="M21.5 18.5l21-1.5 1.4 21-21 1.5z"/><path class="ln" d="M26 23.6l13-.9M26.3 27.6l13-.9M26.6 31.6l8.5-.6"/><path class="n gr" d="M26.8 34.5l12-.9.3 3-12 .9z"/>' +
      '<circle class="rd" cx="32" cy="18.6" r="2.3"/>',
    truck: '<ellipse class="sh" cx="32" cy="56.5" rx="28" ry="3.4"/><path class="wh" d="M4 34h25v13H4z"/>' +
      '<path class="wh" d="M29 47V23.5h13.5l7 10.5h8.5a2.5 2.5 0 0 1 2.5 2.5V47z"/><path class="bl" d="M32.5 27h9l5 7.5h-14z"/>' +
      '<path class="n or" d="M5 39.5h23v3H5zM30 39.5h29v3H30z"/><path class="ln" d="M43 36v10"/><circle class="n yl" cx="58" cy="37.5" r="1.4"/>' +
      '<circle class="ink" cx="15" cy="47.5" r="5.5"/><circle class="n mt" cx="15" cy="47.5" r="2.2"/><circle class="ink" cx="48" cy="47.5" r="5.5"/><circle class="n mt" cx="48" cy="47.5" r="2.2"/>' +
      '<path class="tri" d="M16 13L9.5 34M16 13l1 21M16 13l7.5 21"/><rect class="yl" x="11.5" y="7" width="9" height="6.5" rx="1.5"/><circle class="n bld" cx="20.6" cy="10.2" r="1.4"/>',
    drill: '<ellipse class="sh" cx="31" cy="57.5" rx="27" ry="3.2"/><path class="dt" d="M41 57.5c1.5-4.5 5-7 9-7s7.5 2.5 9 7z"/>' +
      '<rect class="ink" x="5" y="47" width="32" height="9" rx="4.5"/><circle class="n mt" cx="10" cy="51.5" r="2"/><circle class="n mt" cx="21" cy="51.5" r="2"/><circle class="n mt" cx="32" cy="51.5" r="2"/>' +
      '<path class="yl" d="M7 47V34.5a2.5 2.5 0 0 1 2.5-2.5H27l5 6.5V47z"/><path class="n yld" d="M8 43h23v3H8z"/><path class="bl" d="M10.5 35.5h8v6h-8z"/>' +
      '<path class="mtd" d="M32 38.5h6.5v5H32z"/><path class="mtd" d="M39.5 50.5h4l-2 7z"/><rect class="mt" x="38" y="8" width="7" height="43" rx="1.5"/>' +
      '<path class="ln" d="M38.6 16h5.8M38.6 24h5.8M38.6 32h5.8M38.6 40h5.8"/><rect class="or" x="36.5" y="5" width="10" height="5" rx="1.5"/>',
    paper: '<ellipse class="sh" cx="32" cy="58" rx="26" ry="2.8"/><path class="pp" d="M6 15.5l26 3.5 26-3.5v37l-26 3.5-26-3.5z"/><path class="n ppd" d="M32.6 19.9l3-.4v35.6l-3 .4z"/>' +
      '<path d="M32 19v37"/><path class="hd" d="M10 22l17 2.2"/><path class="ln" d="M10 27.5l17 2.2M10 31.5l17 2.2M10 35.5l17 2.2M10 39.5l17 2.2M10 43.5l11 1.4"/>' +
      '<path class="yl" d="M36 24.5l18-2.4v14l-18 2.4z"/><path class="ln" d="M39 28.4l12-1.6M39 32.2l12-1.6"/><path class="ln" d="M36 44.5l18-2.4M36 48.5l18-2.4"/>',
    code: '<ellipse class="sh" cx="32" cy="58" rx="20" ry="2.6"/><path class="pp" d="M14 7h26l10 10v39H14z"/><path class="ppd" d="M40 7v10h10"/>' +
      '<path d="M32 23v-3.5"/><path class="dt" d="M25 31h14c0 7-3 12.5-7 13.5-4-1-7-6.5-7-13.5z"/><path class="wd" d="M23.5 31.5a8.5 7 0 0 1 17 0z"/><path class="ln" d="M20 50h24M20 53h15"/>',
    letter: '<ellipse class="sh" cx="32" cy="58.5" rx="17" ry="2.6"/><rect class="wd" x="28.5" y="33" width="7" height="25.5" rx="1"/><rect class="wdd" x="19" y="33" width="26" height="3.6" rx="1"/>' +
      '<path class="bl" d="M10 34V23a10 10 0 0 1 10-10h24a10 10 0 0 1 10 10v11z"/><path class="n bld" d="M11 33V23a9 9 0 0 1 7-8.8V33z"/><path d="M18.5 13.6V34"/><path class="n hl" d="M23 16.4h20a7 7 0 0 1 5.2 2.6H23z"/>' +
      '<rect class="rd" x="48.5" y="10" width="2.6" height="19" rx="1"/><path class="rd" d="M48.5 9.5h9.5v6.5h-9.5z"/>' +
      '<path class="pp" d="M2.5 20.5l15.5-2.8 1.8 9.6-15.5 2.8z"/><path class="ln" d="M3 21l8.4 3.6 6.9-6.6"/>',
    sale: '<ellipse class="sh" cx="25" cy="58.5" rx="16" ry="2.6"/><rect class="wd" x="9" y="5" width="6" height="53.5" rx="1"/><rect class="wd" x="15" y="8.5" width="42" height="5" rx="1"/>' +
      '<path class="ln" d="M25 13.5v8.5M48 13.5v8.5"/><rect class="yl" x="19" y="22" width="35" height="19" rx="2"/><path class="hd" d="M24 29h25M27.5 34.5h18"/>',
    mural: '<ellipse class="sh" cx="32" cy="58" rx="30" ry="2.8"/><rect class="wal" x="4" y="22" width="56" height="34.5" rx="2.5"/><rect class="stn" x="2" y="18" width="60" height="6" rx="2"/>' +
      '<path class="rb rb1" d="M13.5 50a18.5 18.5 0 0 1 37 0"/><path class="rb rb2" d="M18 50a14 14 0 0 1 28 0"/><path class="rb rb3" d="M22.5 50a9.5 9.5 0 0 1 19 0"/><path class="rb rb4" d="M27 50a5 5 0 0 1 10 0"/>' +
      '<circle class="yl" cx="51.5" cy="31" r="4.2"/><circle class="n pk" cx="9" cy="51.5" r="2.2"/><circle class="n pk" cx="55.5" cy="51.5" r="2.2"/><path class="ln" d="M4 39h3.5M56.5 39H60"/>',
    icecream: '<ellipse class="sh" cx="32" cy="58" rx="24" ry="3"/><path d="M32 21v14"/><path class="pk" d="M9 22a23 12.5 0 0 1 46 0z"/>' +
      '<path class="n wh" d="M24.5 21.4c.5-6 3-10.4 7.5-11.6 4.5 1.2 7 5.6 7.5 11.6z"/><path d="M9 22a23 12.5 0 0 1 46 0z"/>' +
      '<rect class="wh" x="12" y="34" width="38" height="16" rx="3"/><rect class="n bl" x="15.5" y="37" width="31" height="10" rx="2"/>' +
      '<path class="dt" d="M28.5 41h7l-3.5 6.5z"/><circle class="pk" cx="32" cy="39.4" r="3.2"/><path d="M50 40h6.5v-6.5"/>' +
      '<circle class="ink" cx="20" cy="51.5" r="4.5"/><circle class="n mt" cx="20" cy="51.5" r="1.7"/><circle class="ink" cx="43" cy="51.5" r="4.5"/><circle class="n mt" cx="43" cy="51.5" r="1.7"/>',
    branch: '<ellipse class="sh" cx="32" cy="56" rx="28" ry="3"/><path class="tw" d="M19.5 49.5l-4-8.5M33 43.5l1-9.5M43 38.5l7-3.5"/>' +
      '<path class="wd" d="M4 50.5c9-.5 19-3 29-7.5l18-8.5c1.6-.8 3.2.9 2.2 2.4l-.5.6-17.8 9.4C25 52 15 54.5 5 55c-2.6 0-3.5-4.3-1-4.5z"/>' +
      '<path class="or" d="M15.5 41.5c-4.5-.5-6.5-4-5.5-8 4.5.5 6.5 4 5.5 8z"/><path class="gr" d="M34 34c-3-3-3-7 0-10 3 3 3 7 0 10z"/>' +
      '<path class="yl" d="M50 35c1.5-4 5-6 9-5-1.5 4-5 6-9 5z"/><path class="rd" d="M25 47.5c1.5-3.5 4.5-5.5 8.5-5-1.5 3.5-4.5 5.5-8.5 5z"/>',
    cat: '<ellipse class="sh" cx="32" cy="58.5" rx="12" ry="2.4"/><rect class="wd" x="28.5" y="3" width="7" height="55.5" rx="2"/>' +
      '<path class="pp" d="M15.5 12.5l33-1.5 1.5 35-33 1.5z"/><path class="n yl" d="M26.5 9.8l11-.5.2 4-11 .5z"/>' +
      '<path class="or" d="M24.5 30l.5-8 5.5 4.5zM39.5 30l-.5-8-5.5 4.5z"/><path class="or" d="M23 34c0-6 4-9.5 9-9.5s9 3.5 9 9.5c0 3.5-3.5 6-9 6s-9-2.5-9-6z"/>' +
      '<circle class="n ink" cx="28.5" cy="32" r="1.3"/><circle class="n ink" cx="35.5" cy="32" r="1.3"/><path class="n pkd" d="M30.8 35h2.4L32 36.4z"/>' +
      '<path class="ln" d="M24 35.5l-4.5-.8M24 37.2l-4.5.8M40 35.5l4.5-.8M40 37.2l4.5.8M21 43.5l22-1"/>',
    pumpkin: '<ellipse class="sh" cx="32" cy="57" rx="24" ry="3.2"/><path class="gr" d="M33 18c4-6 11-7 15-4-3 5-10 7-15 4z"/>' +
      '<path class="or" d="M32 20c-12 0-23 7-23 18s9 18 23 18 23-7 23-18-11-18-23-18z"/><path class="rib" d="M32 20.5c-6 5-6 30 0 35M32 20.5c6 5 6 30 0 35M21 23c-6.5 6-6.5 25 1.5 31.5M43 23c6.5 6 6.5 25-1.5 31.5"/>' +
      '<path class="n hl" d="M15 31.5c1.5-3.5 4-6 7-7.5-1.5 3-2.5 6-2.8 9z"/><path class="grd" d="M30 21c0-4 1-8 4-10.5l2.5 2c-2 2-3 5-3 8.5z"/>',
    bike: '<ellipse class="sh" cx="32" cy="57.5" rx="29" ry="2.8"/><path class="rk-o" d="M6 57V31a9 9 0 0 1 18 0v26M40 57V31a9 9 0 0 1 18 0v26"/>' +
      '<path class="rk" d="M6 57V31a9 9 0 0 1 18 0v26M40 57V31a9 9 0 0 1 18 0v26"/>' +
      '<circle class="whl" cx="17" cy="46" r="10"/><circle class="whl" cx="47" cy="46" r="10"/><path class="ln" d="M17 36.5v19M7.5 46h19M47 36.5v19M37.5 46h19"/>' +
      '<circle class="n ink" cx="17" cy="46" r="1.8"/><circle class="n ink" cx="47" cy="46" r="1.8"/>' +
      '<path class="frm" d="M17 46l11-16 4 16zM28 30h16L32 46M44 30l3 16M44 30l1.4-6"/><path class="hd" d="M41.5 23.5h7.5M23.5 28h8"/>',
    yard: '<ellipse class="sh" cx="32" cy="58.5" rx="27" ry="2.8"/><path class="leg" d="M10 37l-3 21M54 37l3 21M14.5 37v21M49.5 37v21"/>' +
      '<rect class="wd" x="4" y="33" width="56" height="5.5" rx="1.5"/><path class="ln" d="M27.5 38.5v2.6"/><path class="pp" d="M24.5 41h6.5l2 2.2-2 2.2h-6.5z"/>' +
      '<path class="yl" d="M9.5 17.5h12.5l3 9.5H6.5z"/><path d="M16 27v4"/><rect class="mt" x="11.5" y="30.5" width="9" height="2.5" rx="1"/>' +
      '<rect class="rd" x="28" y="29.5" width="13" height="3.5" rx=".6"/><rect class="bl" x="29" y="26" width="12" height="3.5" rx=".6"/><rect class="gr" x="28.5" y="22.5" width="11" height="3.5" rx=".6"/>' +
      '<path class="pk" d="M45.5 26.5l-4.5-3.3 1 5zM44.5 33c-1-5 1.5-9 6-9s7 4 6 9z"/><circle class="pk" cx="50.5" cy="22.4" r="1.5"/>',
    ball: '<ellipse class="sh" cx="32" cy="57" rx="17" ry="2.8"/><path class="n grd" d="M9.5 57c1-4 2.5-6.5 5-7.5-1 2.5-1 5-.5 7.5zM50 57c.5-3.5 2-6 4.5-7-.7 2.4-.8 4.7-.4 7z"/>' +
      '<circle class="wh" cx="32" cy="38" r="17"/><path class="ln" d="M32 32V27.4M37.7 36.1l4.4-1.4M35.5 42.9l2.7 3.7M28.5 42.9l-2.7 3.7M26.3 36.1l-4.4-1.4"/>' +
      '<path class="n ink" d="M32 32l5.7 4.1-2.2 6.8h-7l-2.2-6.8z"/>' +
      '<path class="n ink" d="M32 27.7l-2.9-2.1 1.1-3.5h3.6l1.1 3.5zM41.8 34.8l1.1-3.4h3.7l1.1 3.4-3 2.2zM38.1 46.3h3.6l1.1 3.5-2.9 2.1-3-2.1zM25.9 46.3l1.2 3.5-3 2.1-2.9-2.1 1.1-3.5zM22.2 34.8l-2.9 2.2-3-2.2 1.1-3.4h3.7z"/>' +
      '<circle cx="32" cy="38" r="17"/><path class="n hl" d="M20.5 30c1.6-4 4.6-6.8 8.5-8-2.6 2.4-4.4 5.2-5.3 8.6z"/>',
    leaves: '<ellipse class="sh" cx="32" cy="57.5" rx="29" ry="3"/><path class="wd" d="M46.2 6.6l2.8.6-9.2 44.6-2.8-.6z"/><path class="mt" d="M29.5 50l15 3.2-.9 2.6-15-3.2z"/>' +
      '<path class="or" d="M3 57c1-10.5 12-18.5 27-18.5s26 8 27 18.5z"/><path class="n ord" d="M8 55.5c3-6 10.5-10 22-10s19 4 22 10z"/>' +
      '<path class="rd" d="M13.5 47.5c1-3.5 4-5.5 7.5-5-1 3.5-4 5.5-7.5 5z"/><path class="yl" d="M27 43c2-3 5.5-4 8.5-2.5-2 3-5.5 4-8.5 2.5z"/>' +
      '<path class="yl" d="M40 51c2.5-2.5 6-3 8.5-1-2.5 2.5-6 3-8.5 1z"/><path class="rd" d="M22.5 53c1.5-3 4.5-4.5 7.5-3.8-1.5 3-4.5 4.5-7.5 3.8z"/><path class="rd" d="M56 57c1-2.2 3-3.3 5.2-2.8-1 2.2-3 3.3-5.2 2.8z"/>',
    feeder: '<ellipse class="sh" cx="32" cy="58.5" rx="12" ry="2.4"/><rect class="wd" x="29.5" y="36" width="5" height="22.5" rx="1"/>' +
      '<rect class="wd" x="18" y="21" width="28" height="16" rx="1"/><rect class="pp" x="22" y="24" width="20" height="9" rx="1"/>' +
      '<circle class="n dtd" cx="26" cy="30.5" r="1.1"/><circle class="n dtd" cx="30" cy="31" r="1.1"/><circle class="n dtd" cx="34" cy="30.4" r="1.1"/><circle class="n dtd" cx="38" cy="31" r="1.1"/><circle class="n dtd" cx="32" cy="28.6" r="1.1"/>' +
      '<path class="rd" d="M13.5 22.5L32 9l18.5 13.5z"/><rect class="wdd" x="14" y="36" width="36" height="3.5" rx="1"/>' +
      '<path class="bl" d="M40.5 36c0-4 3-6.5 6.5-6.5 2.5 0 4 1.5 4.5 3.5l3 .5-3 1.5c-.5 1-2 1-3.5 1z"/><path class="n bld" d="M43 33.5c2-.5 4 0 5 1.5-2 .8-4 .5-5-1.5z"/><circle class="n ink" cx="48.4" cy="32.2" r=".9"/>'
  };

  /* the road by the creek: a painted crop of the town map (fences and garden plots, the river, the dirt road, the meadow) */
  var CROP = [0.22, 0.5, 0.72, 1];
  /* 12 spots as % of the scene, sorted left to right (this is the Tab order). Wide scene: three loose rows
     (by the fences, on the bank, on the road); the third number is the row height on short screens, where the river sits higher.
     Tall phone scene: the same order fills three columns top to bottom. */
  var POS = [[12, 20, 22], [13, 84, 83], [22, 57, 53], [35, 84, 83], [36, 17, 20], [46, 58, 54], [58, 84, 83], [60, 21, 23], [69, 57, 53], [80, 84, 83], [85, 18, 21], [88, 58, 54]];
  var PCOL = [17.5, 50, 82.5], PROW = [13, 37, 61.5, 86];          // phone: 3 columns x 4 rows
  var QCOL = [26, 74], QROW = [9.5, 25.6, 41.7, 57.8, 73.9, 90];         // narrowest phones: 2 columns x 6 rows
  var lastKey = null;               // this page's last draw, so Team 2 never gets Team 1's twelve

  /* a double tap must count once. Without this, the second tap of "Keep looking" lands on the spot under it (and scores it),
     and the second tap of "I'm done looking" lands on "See my score" (skipping the review) or on a score-card button.
     Only pointer taps are held back (a key press gives detail 0), and only this stop sets quietUntil, so the guard is idle elsewhere. */
  var quietUntil = 0;
  function quiet() { quietUntil = Date.now() + 350; }
  document.addEventListener("click", function (e) {
    if (!e.detail || Date.now() >= quietUntil) return;
    var t = e.target;
    if (t && t.closest && t.closest('[data-game="community-builders"]')) { e.stopPropagation(); e.preventDefault(); }
  }, true);

  CB.register({
    id: "notice-the-signs",
    steps: [null, null],            // 1 look, 2 read what you missed; the spec names no parts
    css: "01-notice-the-signs.css",
    run: run
  });

  function run(api, stop) {
    var h = api.h, t2 = api.t2;
    function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
    function icon(id, cls) {
      var s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      s.setAttribute("viewBox", "0 0 64 64"); s.setAttribute("aria-hidden", "true"); s.setAttribute("focusable", "false");
      s.setAttribute("class", "cb-story cb-s01-art" + (cls ? " " + cls : ""));
      host.setAuthoredMarkup(s, ART[id]);                                    // constant, authored markup only
      return s;
    }

    /* ── a new round: 6 of 10 signs + 6 of 10 everyday changes, shuffled over the 12 spots ── */
    var r = api.rec(stop.id), avoid = [r && r.lastRound ? String(r.lastRound) : "", lastKey || ""];
    var signs = ITEMS.filter(function (it) { return it.sign; }), every = ITEMS.filter(function (it) { return !it.sign; });
    var pickd, key;
    for (var tries = 0; tries < 50; tries++) {
      pickd = api.shuffle(signs).slice(0, 6).concat(api.shuffle(every).slice(0, 6));
      key = pickd.map(function (it) { return it.id; }).sort().join(",");
      if (avoid.indexOf(key) === -1) break;
    }
    lastKey = key;
    /* the shuffle keeps the wider word boards apart, so two of them never crowd one row (phone) or sit side by side (wide) */
    function spread(order) {
      var b = [];
      order.forEach(function (it, i) { if (it.board) b.push(i); });
      /* the rezoning sign has the most words (and more in Spanish): it gets a top-row spot, where there is room above and below it */
      for (var z = 0; z < order.length; z++) if (order[z].board && order[z].board.kind === "post" && POS[z][1] > 25) return false;
      for (var m = 0; m < b.length; m++) for (var n = m + 1; n < b.length; n++) {
        var p = b[m], q = b[n];
        if (p % 4 === q % 4 || p % 6 === q % 6) return false;                                     // one row of either phone grid
        if (Math.abs(POS[p][0] - POS[q][0]) < 20 && Math.abs(POS[p][1] - POS[q][1]) < 45) return false;   // neighbours on the wide scene
      }
      return true;
    }
    var order = api.shuffle(pickd);
    for (var k = 0; k < 300 && !spread(order); k++) order = api.shuffle(pickd);
    var spots = order.map(function (it, i) {
      return { i: i, item: it, x: POS[i][0], y: POS[i][1], sy: POS[i][2], px: PCOL[Math.floor(i / 4)], py: PROW[i % 4], qx: QCOL[Math.floor(i / 6)], qy: QROW[i % 6] };
    });
    var found = {}, tapped = {}, view = "past", seenToday = false, reviewing = false, finished = false, screenKey = "intro";
    if (api.setController) api.setController({
      snapshot: function () { return { screenKey: screenKey, order: spots.map(function (s) { return s.item.id; }), found: Object.keys(found), tapped: Object.keys(tapped), view: view, seenToday: seenToday }; },
      restore: function (state) {
        if (!state || !Array.isArray(state.order) || state.order.length !== 12) return;
        var restoredItems = state.order.map(function (id) { return ITEMS.filter(function (it) { return it.id === id; })[0]; });
        if (restoredItems.some(function (it) { return !it; }) || restoredItems.filter(function (it) { return it.sign; }).length !== 6) return;
        spots = restoredItems.map(function (it, i) { return { i: i, item: it, x: POS[i][0], y: POS[i][1], sy: POS[i][2], px: PCOL[Math.floor(i / 4)], py: PROW[i % 4], qx: QCOL[Math.floor(i / 6)], qy: QROW[i % 6] }; });
        key = restoredItems.map(function (it) { return it.id; }).sort().join(",");
        found = {}; tapped = {};
        (state.found || []).forEach(function (id) { if (restoredItems.some(function (it) { return it.id === id && it.sign; })) found[id] = 1; });
        (state.tapped || []).forEach(function (id) { if (restoredItems.some(function (it) { return it.id === id && !it.sign; })) tapped[id] = 1; });
        view = state.view === "today" ? "today" : "past"; seenToday = !!state.seenToday; reviewing = false; finished = false;
        if (state.screenKey === "result") finish(); else if (state.screenKey === "review") doneLooking(); else if (state.screenKey === "look") look(); else start();
      }, onPause: function () {}, onResume: function () {}
    });
    function nFound() { return Object.keys(found).length; }
    function nTapped() { return Object.keys(tapped).length; }

    /* ── the things on the road: a picture, then its name on a little paper tag ── */
    function boardEl(it, big) {
      var txt = t2(it.board.text), k = it.board.kind, cut = txt.indexOf(". ");
      var words = k === "post" && cut > 0 ? [h("b", { text: txt.slice(0, cut + 1) }), " " + txt.slice(cut + 2)] : [txt];
      return h("span", { "class": "cb-s01-brd cb-s01-brd--" + k + (big ? " cb-s01-brd--big" : "") }, [h("span", { "class": "cb-s01-brd__face" }, words)]);
    }
    function sticker(it) {
      return it.board ? h("span", { "class": "cb-s01-stk cb-s01-stk--board cb-s01-stk--" + it.board.kind }, [boardEl(it, false)])
        : h("span", { "class": "cb-s01-stk cb-s01-stk--" + it.id }, [icon(it.id)]);
    }
    /* the tag always names the thing; once it is tapped, a second line says what it turned out to be (words, never colour alone) */
    function tagEl(it, st) {
      return h("span", { "class": "cb-s01-tag", "aria-hidden": "true" }, [
        h("span", { "class": "cb-s01-tag__n", text: t2(it.tag) }),
        st === "idle" ? null : h("span", { "class": "cb-s01-tag__s" }, [st === "found" ? api.ico("check") : null, h("span", { text: st === "found" ? T.found : st === "not" ? T.not : T.missed })])]);
    }
    function stateOf(s) {
      if (s.item.sign) return found[s.item.id] ? "found" : reviewing ? "missed" : "idle";
      return tapped[s.item.id] ? "not" : "idle";
    }
    function paint(s, fresh) {
      var st = stateOf(s), b = s.btn, name = cap(t2(s.item.name));
      b.className = "cb-s01-spot is-" + st + (s.item.board ? " cb-s01-spot--board" : "") + (fresh ? " is-fresh" : "");
      [].slice.call(b.querySelectorAll(".cb-s01-tag, .cb-badge")).forEach(function (e) { e.remove(); });
      if (st === "found") s.stk.appendChild(h("span", { "class": "cb-badge", "aria-hidden": "true" }, [api.ico("check")]));
      b.appendChild(tagEl(s.item, st));
      b.setAttribute("aria-label", name + (st === "found" ? T.aFound : st === "not" ? T.aNot : st === "missed" ? T.aMissed : ""));
      b.disabled = reviewing && st === "idle";
    }
    function makeSpot(s, fresh) {
      s.stk = sticker(s.item);
      s.btn = h("button", { type: "button", "data-spot": String(s.i), onclick: function () { tap(s); } }, [h("span", { "class": "cb-s01-ring", "aria-hidden": "true" }), s.stk]);
      paint(s, fresh);
      var li = h("li", null, [s.btn]);
      li.style.setProperty("--x", s.x + "%"); li.style.setProperty("--y", s.y + "%"); li.style.setProperty("--sy", s.sy + "%");
      li.style.setProperty("--px", s.px + "%"); li.style.setProperty("--py", s.py + "%");
      li.style.setProperty("--qx", s.qx + "%"); li.style.setProperty("--qy", s.qy + "%");
      li.style.setProperty("--i", String(s.i));                 // the order the things pop in when Today first opens
      return li;
    }
    function scene(past, freshFn) {
      var ul = h("ul", { "class": "cb-s01-spots" }, spots.map(function (s) { return makeSpot(s, freshFn ? freshFn(s) : false); }));
      var art = api.crop(CROP, "cb-s01-scene" + (past ? " is-past" : "") + (reviewing ? " is-review" : ""), [ul]);
      /* the zoomed painting overflows its panel; a focus or find-in-page scroll must never slide the spots off the picture */
      art.addEventListener("scroll", function () { if (art.scrollLeft || art.scrollTop) { art.scrollLeft = 0; art.scrollTop = 0; } });
      return art;
    }

    /* ── cards: one button, "Keep looking"; Esc closes; focus goes back to the spot ── */
    function card(s, onClose) {
      var it = s.item;
      if (api.callout && !(api.prefersFindCards && api.prefersFindCards())) {
        var content = [h("p", { text: it.sign ? t2(it.line) : T.everyRest })];
        if (it.sign) content.push(h("p", { text: T.askLine }));
        return api.callout(s.btn, content, { title: it.sign ? T.signT : T.every(t2(it.name)), closeLabel: T.keep, onClose: onClose });
      }
      var badge = h("span", { "class": "cb-s01-dlgbadge" + (it.sign ? " is-sign" : ""), "aria-hidden": "true" }, [icon(it.id)]), d;
      if (it.sign) {
        d = api.dialog(T.signT, [h("div", { "class": "cb-s01-cardbody" }, [
          it.board ? h("div", { "class": "cb-s01-bigboard" }, [boardEl(it, true)]) : null,
          h("p", { "class": "cb-s01-line" }, [api.ico("check"), h("span", { text: t2(it.line) })]),
          h("p", { "class": "cb-s01-ask" }, [api.ico("family"), h("span", { text: T.askLine })])])],
        s.btn, onClose, { badge: badge, sub: cap(t2(it.name)) });
      } else {
        d = api.dialog(T.every(t2(it.name)), [h("div", { "class": "cb-s01-cardbody" }, [
          h("p", { "class": "cb-s01-line cb-s01-line--every" }, [api.ico("bulb"), h("span", { text: T.everyRest })])])],
        s.btn, onClose, { badge: badge });
      }
      d.classList.add("cb-s01-dlg");
      var x = d.querySelector(".cb-dlg__x"); if (x) x.remove();
      var foot = d.querySelector(".cb-dlg__foot .cb-btn span"); if (foot) foot.textContent = T.keep;
    }
    function tap(s) {
      var it = s.item, fresh = false;
      if (!reviewing) {                                   // score counts the first tap only; reading again changes nothing
        if (it.sign && !found[it.id]) { found[it.id] = 1; fresh = true; }
        else if (!it.sign && !tapped[it.id]) { tapped[it.id] = 1; fresh = true; }
      }
      if (fresh) { paint(s, true); if (it.sign) progress(true); }
      card(s, function () { quiet(); });
      quiet();
    }

    /* ── progress, in words (never points) ── */
    var msgEl, dotsEl;
    function progressBits() {
      dotsEl = h("ol", { "class": "cb-s01-dots", "aria-hidden": "true" }, [0, 1, 2, 3, 4, 5].map(function () { return h("li"); }));
      msgEl = h("p", { "class": "cb-msg" });
      progress(false);
      return [dotsEl, msgEl];
    }
    function progress(announce) {
      var n = nFound(), text = n === 6 && !reviewing ? T.all6 : T.foundN(n);
      msgEl.textContent = text;
      [].forEach.call(dotsEl.children, function (li, i) {
        var on = i < n; if (on === li.classList.contains("is-on")) return;
        li.classList.toggle("is-on", on); li.classList.toggle("is-pop", on && announce);
        li.textContent = ""; if (on) li.appendChild(api.ico("check"));
      });
      if (announce) api.say(text);
    }

    /* ── 1 · start ── */
    function start() {
      screenKey = "intro";
      var aid = "cb-s01-about-h";
      api.screen([api.stopHud(stop, null), h("div", { "class": "cb-board" }, [h("div", { "class": "cb-s01-start" }, [
        api.crop(CROP, "cb-s01-startart"),
        h("div", { "class": "cb-s01-intro" }, [
          h("p", { "class": "cb-s01-lead", text: T.lead }),
          h("p", { "class": "cb-s01-story", text: T.story }),
          h("div", { "class": "cb-row" }, [api.btn(T.start, "cb-btn--go cb-btn--big", look, "go", true)]),
          h("section", { "class": "cb-s01-about", "aria-labelledby": aid }, [h("h3", { id: aid, text: T.aboutH }), h("p", { text: T.about })])])])])]);
      api.frame();
    }

    /* ── 2 · look: Last month / Today ── */
    function look() {
      screenKey = "look";
      var coachEl = api.coach(view === "past" ? T.pastLine : T.todayLine + " " + T.todayMore, "peek"), sc = scene(view === "past");
      function vbtn(v) {
        return h("button", { type: "button", "class": "cb-s01-view", "data-view": v, "aria-pressed": v === view ? "true" : "false", onclick: function () { setView(v); } },
          [api.ico("check", "cb-s01-view__ic"), h("span", { text: v === "past" ? T.past : T.today })]);
      }
      var views = h("div", { "class": "cb-s01-views" + (seenToday ? "" : " is-cue") }, [vbtn("past"), vbtn("today")]);
      function setView(v) {
        if (v === view) return;
        if (v === "today" && !seenToday && (!api.motionAllowed || api.motionAllowed())) {
          sc.classList.add("is-arriving");
          setTimeout(function () { sc.classList.remove("is-arriving"); }, 1700);
        }
        view = v; if (v === "today") seenToday = true;
        sc.classList.toggle("is-past", v === "past");
        views.classList.toggle("is-cue", !seenToday);
        [].forEach.call(views.children, function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-view") === v ? "true" : "false"); });
        coachEl.lastChild.textContent = v === "past" ? T.pastLine : T.todayLine + " " + T.todayMore;
        api.say(coachEl.lastChild.textContent);
      }
      api.screen([api.stopHud(stop, [null, null], 0), h("div", { "class": "cb-board cb-s01-board" }, [
        h("div", { "class": "cb-s01-top" }, [coachEl, views]), sc,
        h("div", { "class": "cb-actions" }, [h("div", { "class": "cb-actions__info" }, progressBits()),
          api.btn(T.done, "cb-btn--go cb-btn--big", doneLooking, "go", true)])])]);
      api.frame(true);                                 // the whole board (scene + action bar) in view
      quiet();
    }

    /* ── 3 · "I'm done looking": show what was missed, or go straight to the score ── */
    function doneLooking() {
      var missed = spots.filter(function (s) { return s.item.sign && !found[s.item.id]; });
      if (!missed.length) return finish();
      reviewing = true;
      screenKey = "review";
      var sc = scene(false, function (s) { return s.item.sign && !found[s.item.id]; });
      api.screen([api.stopHud(stop, [null, null], 1), h("div", { "class": "cb-board cb-s01-board" }, [
        api.coach(T.review, "bulb"), sc,
        h("div", { "class": "cb-actions" }, [h("div", { "class": "cb-actions__info" }, progressBits()),
          api.btn(T.seeScore, "cb-btn--go cb-btn--big", finish, "go", true)])])], '[data-spot="' + missed[0].i + '"]');
      api.frame(true);
      api.say(T.review);
      quiet();
    }

    /* ── 4 · score card ── */
    function finish() {
      if (finished) return;
      finished = true;
      screenKey = "result";
      var nF = nFound(), nE = nTapped();
      var score = 12 * nF + Math.max(0, 28 - 4 * nE);
      var miss = spots.filter(function (s) { return s.item.sign && !found[s.item.id]; })[0];
      var tip = miss ? T.tipMiss(t2(miss.item.name)) : nE ? T.tipEvery : T.tip100;
      var info = api.saveRound(stop.id, score, { lastRound: key, allSigns: nF === 6, extraTaps: nE, processBadge: nF === 6 && nE === 0 ? "process-1" : null });
      api.endPlay();
      var card = api.scoreCard(stop, score, info, tip, T.can, T.real);
      var stats = h("ul", { "class": "cb-s01-stats" }, [
        h("li", null, [api.ico("check"), h("span", { text: T.foundN(nF) })]),
        h("li", null, [api.ico("peek"), h("span", { text: T.everyN(nE) })])]);
      var meta = card.querySelector(".cb-card__meta");
      if (meta) meta.parentNode.insertBefore(stats, meta.nextSibling); else card.appendChild(stats);
      if (score >= 90) card.classList.add("cb-s01-card--3");
      var gu = api.btn(T.ask, "cb-btn--quiet", function () {
        api.dialog(api.W.grownups, [h("p", { text: T.guText })], gu);
      }, "family");
      api.finishRound(stop.id, card, api.cardButtons(stop.id, api.restart(stop.id), gu));
      api.say(api.W.score + " " + score + " / 100");
      quiet();
    }

    start();
  }

    return definition;
  }
  if (host.defineStop) host.defineStop(factory);
  else host.register(factory({ document: document, window: window, Date: Date, setTimeout: setTimeout, clearTimeout: clearTimeout, requestAnimationFrame: requestAnimationFrame, cancelAnimationFrame: typeof cancelAnimationFrame === "function" ? cancelAnimationFrame : function () {} }));
})();
