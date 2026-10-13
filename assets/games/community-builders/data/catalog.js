export default function createData(ctx) {
  var STOPS = [
    [].concat(["notice-the-signs"],ctx.window.CBLocale.pair("core","bank.b0001"),[1]),
    [].concat(["ask-a-good-question"],ctx.window.CBLocale.pair("core","bank.b0002"),[1]),
    [].concat(["listen-to-every-neighbor"],ctx.window.CBLocale.pair("core","bank.b0003"),[1]),
    [].concat(["fact-or-rumor"],ctx.window.CBLocale.pair("core","bank.b0004"),[1]),
    [].concat(["map-what-could-change"],ctx.window.CBLocale.pair("core","bank.b0005"),[1]),
    [].concat(["who-decides"],ctx.window.CBLocale.pair("core","bank.b0006"),[1]),
    [].concat(["speak-up-kindly"],ctx.window.CBLocale.pair("core","bank.b0007"),[2]),
    [].concat(["disagree-kindly"],ctx.window.CBLocale.pair("core","bank.b0008"),[2]),
    [].concat(["include-every-voice"],ctx.window.CBLocale.pair("core","bank.b0009"),[2]),
    [].concat(["match-a-fix"],ctx.window.CBLocale.pair("core","bank.b0010"),[3]),
    [].concat(["weigh-the-tradeoffs"],ctx.window.CBLocale.pair("core","bank.b0011"),[3]),
    [].concat(["make-a-fair-deal"],ctx.window.CBLocale.pair("core","bank.b0012"),[3]),
    [].concat(["spread-the-word-right"],ctx.window.CBLocale.pair("core","bank.b0013"),[3]),
    [].concat(["keep-watch"],ctx.window.CBLocale.pair("core","bank.b0014"),[4]),
    [].concat(["build-the-future-together"],ctx.window.CBLocale.pair("core","bank.b0015"),[4]),
  ].map(function (s, i) {
    return {
      id: s[0],
      name: ctx.L === "es" ? s[2] : s[1],
      names: { en: s[1], es: s[2] },
      chap: s[3],
      n: i + 1,
    };
  });
  var PLAYABLE = { "listen-to-every-neighbor": 1, "fact-or-rumor": 1 };
  var POS = [
    [9, 39],
    [15, 52],
    [18, 77],
    [31, 58],
    [31, 24],
    [43, 44],
    [46, 72],
    [57, 52],
    [68, 30],
    [65, 73],
    [78, 53],
    [88, 74],
    [91, 50],
    [75, 18],
    [91, 20],
  ];
  var CHAP = ["#56B4E9", "#E69F00", "#009E73", "#CC79A7"];
  var NB = [
    {
      id: "lee",
      en: ctx.window.CBLocale.pair("core","bank.b0016")[0],
      es: ctx.window.CBLocale.pair("core","bank.b0016")[1],
      esCap: "La Sra. Lee",
      role: { en: ctx.window.CBLocale.pair("core","bank.b0017")[0], es: ctx.window.CBLocale.pair("core","bank.b0017")[1] },
      plain: { en: ctx.window.CBLocale.pair("core","bank.b0018")[0], es: ctx.window.CBLocale.pair("core","bank.b0018")[1] },
      img: "ms-lee",
      pos: [14, 56],
    },
    {
      id: "johnson",
      en: ctx.window.CBLocale.pair("core","bank.b0019")[0],
      es: ctx.window.CBLocale.pair("core","bank.b0019")[1],
      esCap: "El Sr. Johnson",
      role: {
        en: ctx.window.CBLocale.pair("core","bank.b0020")[0],
        es: ctx.window.CBLocale.pair("core","bank.b0020")[1],
      },
      plain: { en: ctx.window.CBLocale.pair("core","bank.b0021")[0], es: ctx.window.CBLocale.pair("core","bank.b0021")[1] },
      img: "mr-johnson",
      pos: [20, 26],
    },
    {
      id: "ana",
      en: ctx.window.CBLocale.pair("core","bank.b0022")[0],
      es: ctx.window.CBLocale.pair("core","bank.b0022")[1],
      esCap: "Ana",
      role: { en: ctx.window.CBLocale.pair("core","bank.b0023")[0], es: ctx.window.CBLocale.pair("core","bank.b0023")[1] },
      plain: { en: ctx.window.CBLocale.pair("core","bank.b0024")[0], es: ctx.window.CBLocale.pair("core","bank.b0024")[1] },
      img: "ana",
      pos: [34, 57],
    },
    {
      id: "ruth",
      en: ctx.window.CBLocale.pair("core","bank.b0025")[0],
      es: ctx.window.CBLocale.pair("core","bank.b0025")[1],
      esCap: "La abuela Ruth",
      role: { en: ctx.window.CBLocale.pair("core","bank.b0026")[0], es: ctx.window.CBLocale.pair("core","bank.b0026")[1] },
      plain: {
        en: ctx.window.CBLocale.pair("core","bank.b0027")[0],
        es: ctx.window.CBLocale.pair("core","bank.b0027")[1],
      },
      img: "grandma-ruth",
      pos: [45, 25],
    },
    {
      id: "patel",
      en: ctx.window.CBLocale.pair("core","bank.b0028")[0],
      es: ctx.window.CBLocale.pair("core","bank.b0028")[1],
      esCap: "El Sr. Patel",
      role: {
        en: ctx.window.CBLocale.pair("core","bank.b0029")[0],
        es: ctx.window.CBLocale.pair("core","bank.b0029")[1],
      },
      plain: { en: ctx.window.CBLocale.pair("core","bank.b0030")[0], es: ctx.window.CBLocale.pair("core","bank.b0030")[1] },
      img: "mr-patel",
      pos: [62, 38],
    },
    {
      id: "jayden",
      en: ctx.window.CBLocale.pair("core","bank.b0031")[0],
      es: ctx.window.CBLocale.pair("core","bank.b0031")[1],
      esCap: "Jayden",
      role: {
        en: ctx.window.CBLocale.pair("core","bank.b0032")[0],
        es: ctx.window.CBLocale.pair("core","bank.b0032")[1],
      },
      plain: { en: ctx.window.CBLocale.pair("core","bank.b0033")[0], es: ctx.window.CBLocale.pair("core","bank.b0033")[1] },
      img: "jayden",
      pos: [80, 55],
    },
  ];
  function nm(n) {
    return ctx.L === "es" ? n.es : n.en;
  }
  function nmCap(n) {
    return ctx.L === "es" ? n.esCap : n.en;
  }
  function t2(pair) {
    return ctx.L === "es" ? pair[1] : pair[0];
  }
  var ANIMALS = [
    [].concat(["fox"],ctx.window.CBLocale.pair("core","bank.b0034"),["#E69F00"]),
    [].concat(["owl"],ctx.window.CBLocale.pair("core","bank.b0035"),["#0072B2"]),
    [].concat(["turtle"],ctx.window.CBLocale.pair("core","bank.b0036"),["#009E73"]),
    [].concat(["rabbit"],ctx.window.CBLocale.pair("core","bank.b0037"),["#CC79A7"]),
    [].concat(["deer"],ctx.window.CBLocale.pair("core","bank.b0038"),["#D55E00"]),
    [].concat(["heron"],ctx.window.CBLocale.pair("core","bank.b0039"),["#56B4E9"]),
    [].concat(["bee"],ctx.window.CBLocale.pair("core","bank.b0040"),["#F0E442"]),
    [].concat(["otter"],ctx.window.CBLocale.pair("core","bank.b0041"),["#882255"]),
  ].map(function (a) {
    return { id: a[0], name: ctx.L === "es" ? a[2] : a[1], ring: a[3] };
  });
  var ICON = {
    fox: '<path d="M14 27 11 7q12 2 15 12h12q4-10 15-12l-3 20v12q-3 13-18 17-15-4-18-17Z" fill="#DD7442"/><path d="m16 14 3 13 7-5Zm32 0-10 8 7 5Z" fill="#F4B291"/><path d="M14 33q11-1 18 10 7-11 18-10-1 16-18 23-17-7-18-23Z" fill="#FFF2DA"/><path d="M21 31q3-3 6 0m10 0q3-3 6 0" fill="none" stroke="#34343D" stroke-width="2" stroke-linecap="round"/><path d="M28 42q4-3 8 0l-4 5Z" fill="#34343D"/><path d="M32 47v3" stroke="#34343D" stroke-width="1.6" stroke-linecap="round"/>',
    owl: '<path d="m13 11 12 7h14l12-7v26q0 20-19 21T13 37Z" fill="#6679A8"/><path d="M13 34q10 4 10 19-10-4-10-19Zm38 0q-10 4-10 19 10-4 10-19Z" fill="#435984"/><path d="M32 25q-15-12-17 5-1 12 11 12 4 0 6-4 2 4 6 4 12 0 11-12-2-17-17-5Z" fill="#FFF2DA"/><ellipse cx="24" cy="31" rx="3.5" ry="4.5" fill="#34343D"/><ellipse cx="40" cy="31" rx="3.5" ry="4.5" fill="#34343D"/><circle cx="25" cy="30" r="1" fill="#FFFFFF"/><circle cx="41" cy="30" r="1" fill="#FFFFFF"/><path d="m28 40 4 6 4-6Z" fill="#E5AD50"/><path d="m25 49 3 3m8-3 3 3" stroke="#D5DDEE" stroke-width="2" stroke-linecap="round"/>',
    turtle:
      '<path d="m12 40-8 3 8 4Z" fill="#87BD9B"/><rect x="17" y="43" width="8" height="12" rx="4" fill="#87BD9B"/><rect x="37" y="43" width="8" height="12" rx="4" fill="#87BD9B"/><path d="M10 39q1-22 21-22t21 22v7H10Z" fill="#3D8C75"/><path d="m26 24 10-1 7 8-5 10H25l-6-9Z" fill="#69AD8D"/><path d="M30 18v6M14 29l6 3m23-1 6-4M25 41l-4 5m17-5 4 5" stroke="#A4D1AD" stroke-width="1.8" stroke-linecap="round"/><circle cx="53" cy="36" r="9" fill="#A4D1AD"/><ellipse cx="55" cy="33" rx="1.8" ry="2.3" fill="#34343D"/><path d="M54 40q3 2 5-1" fill="none" stroke="#34343D" stroke-width="1.6" stroke-linecap="round"/>',
    rabbit:
      '<path d="M18 31 15 13q-1-9 5-9t8 10l2 15Zm16-2 3-17q2-9 8-8t5 10l-5 18Z" fill="#B8A0CE"/><path d="m21 25-2-12q0-4 2-4t3 5l2 11Zm18 0 3-12q1-4 3-3t1 5l-3 11Z" fill="#F1D8E4"/><path d="M13 39q0-15 19-15t19 15q0 18-19 18T13 39Z" fill="#B8A0CE"/><ellipse cx="24" cy="38" rx="2.2" ry="3" fill="#34343D"/><ellipse cx="40" cy="38" rx="2.2" ry="3" fill="#34343D"/><ellipse cx="21" cy="45" rx="4" ry="2.5" fill="#D8B7D8"/><ellipse cx="43" cy="45" rx="4" ry="2.5" fill="#D8B7D8"/><path d="m29 44 3-2 3 2-3 3Z" fill="#7D536D"/><path d="M27 49q5 4 10 0" fill="none" stroke="#34343D" stroke-width="1.6" stroke-linecap="round"/>',
    deer: '<path d="M22 24 20 8m0 9-7-7m7 3 5-7M42 24l2-16m0 9 7-7m-7 3-5-7" fill="none" stroke="#805E4E" stroke-width="2.5" stroke-linecap="round"/><path d="M23 27q-13 0-15-11 13-1 17 7Zm18 0q13 0 15-11-13-1-17 7Z" fill="#BE936F"/><path d="m15 20 8 4-4 1Zm34 0-8 4 4 1Z" fill="#F2CCAC"/><path d="M18 34q0-13 14-13t14 13l-4 14q-2 9-10 9t-10-9Z" fill="#BE936F"/><path d="M22 45q3-7 10-7t10 7q-2 12-10 12T22 45Z" fill="#F6E8CE"/><ellipse cx="25" cy="34" rx="2" ry="2.8" fill="#34343D"/><ellipse cx="39" cy="34" rx="2" ry="2.8" fill="#34343D"/><ellipse cx="32" cy="44" rx="4" ry="3" fill="#664B43"/><path d="M29 51q3 2 6 0" fill="none" stroke="#664B43" stroke-width="1.6" stroke-linecap="round"/>',
    heron:
      '<path d="m25 46-1 12m9-12 2 12m-13 0h6m5 0h6" stroke="#635963" stroke-width="2" stroke-linecap="round"/><path d="M10 41q6-11 20-9l6-5q-12-3-10-12 2-8 13-7v7q-6-1-6 2t11 5q5 8-6 15-2 14-17 13Z" fill="#79A9BB"/><path d="M17 38q11-3 17 3-7 10-17 5Z" fill="#497D95"/><path d="M37 12q-5 0-6 4t10 8l-4 6q-12-5-12-13 1-8 12-8Z" fill="#C4DDE0"/><path d="m42 11 17 4-17 4Z" fill="#E6AE54"/><circle cx="38" cy="11" r="5.5" fill="#79A9BB"/><circle cx="40" cy="10" r="1.6" fill="#34343D"/><path d="m34 7-6-2" stroke="#497D95" stroke-width="2" stroke-linecap="round"/>',
    bee: '<path d="M24 29Q9 26 13 15q8-8 18 12 10-20 18-12 4 11-11 14Z" fill="#C7E2E7"/><path d="m18 26-4-10m10 7 1-10" stroke="#574B4D" stroke-width="1.8" stroke-linecap="round"/><circle cx="14" cy="15" r="2" fill="#574B4D"/><circle cx="25" cy="12" r="2" fill="#574B4D"/><path d="M9 38q0-14 21-14t25 14q-4 16-25 16T9 38Z" fill="#EBC55B"/><path d="M32 24h6q5 14 0 29h-7q5-14 1-29Zm12 4 5 3q4 7 0 14l-6 5q6-12 1-22Z" fill="#574B4D"/><ellipse cx="19" cy="36" rx="2" ry="2.8" fill="#34343D"/><path d="M17 43q4 3 7-1" fill="none" stroke="#34343D" stroke-width="1.6" stroke-linecap="round"/><ellipse cx="14" cy="41" rx="2.5" ry="1.7" fill="#DF9C66"/>',
    otter:
      '<path d="M39 46q15 1 21 10-13 3-23-4Z" fill="#966C50"/><path d="M18 40q-1 18 14 18t14-18Z" fill="#966C50"/><circle cx="13" cy="24" r="6" fill="#966C50"/><circle cx="51" cy="24" r="6" fill="#966C50"/><circle cx="13" cy="24" r="3" fill="#C99A77"/><circle cx="51" cy="24" r="3" fill="#C99A77"/><path d="M11 29q0-15 21-15t21 15q0 18-21 18T11 29Z" fill="#966C50"/><path d="M19 33q6-5 13-1 7-4 13 1 5 12-13 12T19 33Z" fill="#F1DFC3"/><ellipse cx="23" cy="27" rx="2" ry="2.7" fill="#34343D"/><ellipse cx="41" cy="27" rx="2" ry="2.7" fill="#34343D"/><path d="M28 33q4-3 8 0-1 4-4 4t-4-4Z" fill="#57463E"/><path d="M28 40q4 3 8 0m-16-4-11-3m11 6-12 1m36-4 11-3m-11 6 12 1" fill="none" stroke="#57463E" stroke-width="1.5" stroke-linecap="round"/><ellipse cx="32" cy="51" rx="7" ry="5" fill="#7D989C"/><ellipse cx="23" cy="50" rx="5" ry="3.5" fill="#B78B68"/><ellipse cx="41" cy="50" rx="5" ry="3.5" fill="#B78B68"/>',
  };
  var BASKET_ICON = {
    fact: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3 27 7v8c0 7-5 12-11 14C10 27 5 22 5 15V7z" fill="#E9F2EE" stroke="#1E5A47" stroke-width="2"/><path d="m11 16 4 4 7-8" stroke="#1E5A47" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    rumor:
      '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M9 22a6 6 0 0 1 0-12 8 8 0 0 1 15 2 5 5 0 0 1 0 10z" fill="#F8EED8" stroke="#7A5200" stroke-width="2"/><path d="M12 26h3M18 28h3" stroke="#7A5200" stroke-width="2" stroke-linecap="round"/></svg>',
    dontknow:
      '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="12" fill="#E5EEF7" stroke="#1D5C93" stroke-width="2"/><path d="M12.5 12.5a3.5 3.5 0 1 1 5 3.2c-1 .5-1.5 1.3-1.5 2.3v1" stroke="#1D5C93" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="16" cy="23" r="1.5" fill="#1D5C93"/></svg>',
  };
  var STAR_ON =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.6 2.9 6 6.5.9-4.7 4.5 1.1 6.5L12 17.4 6.2 20.5l1.1-6.5-4.7-4.5 6.5-.9z" fill="#E69F00" stroke="#7A5200" stroke-width="1.2" stroke-linejoin="round"/></svg>';
  var STAR_OFF =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.6 2.9 6 6.5.9-4.7 4.5 1.1 6.5L12 17.4 6.2 20.5l1.1-6.5-4.7-4.5 6.5-.9z" fill="none" stroke="#7A5200" stroke-width="1.4" stroke-linejoin="round"/></svg>';
  var SVGNS = "http://www.w3.org/2000/svg";
  var IC = {
    back: '<path d="M14.5 5.5 8 12l6.5 6.5"/>',
    go: '<path d="M5 12h13"/><path d="m12.5 6 6 6-6 6"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    close: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
    lock: '<rect x="5.5" y="10.5" width="13" height="9.5" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
    sun: '<circle cx="12" cy="12" r="3.8"/><path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M5.6 18.4l1.6-1.6M16.8 7.2l1.6-1.6"/>',
    cloud:
      '<path d="M7.5 18.5h9a3.8 3.8 0 0 0 .5-7.6 5.6 5.6 0 0 0-10.8 1.2 3.2 3.2 0 0 0 1.3 6.4z"/>',
    bulb: '<path d="M9.5 17.5h5M10.5 20.5h3"/><path d="M12 3.5a5.8 5.8 0 0 0-3.4 10.5c.6.5 1 1.2 1 2v1.5h4.8V16c0-.8.4-1.5 1-2A5.8 5.8 0 0 0 12 3.5z"/>',
    home: '<path d="M4.5 11 12 4.8l7.5 6.2V19a1.5 1.5 0 0 1-1.5 1.5h-3.5v-5.5h-5v5.5H6A1.5 1.5 0 0 1 4.5 19z"/>',
    replay: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 4.5v4h4"/>',
    people:
      '<circle cx="9" cy="8" r="3"/><path d="M3.5 19.5c.5-3.2 2.8-5 5.5-5s5 1.8 5.5 5"/><circle cx="17" cy="9" r="2.4"/><path d="M16 14.2c2.3.1 4 1.7 4.5 4.8"/>',
    family:
      '<circle cx="8.5" cy="5.8" r="2.4"/><path d="M5.5 20.5v-6a3 3 0 0 1 6 0v6"/><circle cx="16.5" cy="10.3" r="1.9"/><path d="M14.2 20.5v-3.8a2.3 2.3 0 0 1 4.6 0v3.8"/>',
    peek: '<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5.5 5.5"/>',
    trophy:
      '<path d="M8 4.5h8V9a4 4 0 0 1-8 0z"/><path d="M8 6.5H5.5a2.8 2.8 0 0 0 2.9 3.9M16 6.5h2.5a2.8 2.8 0 0 1-2.9 3.9M12 13v3.5M10 16.5h4V20h-4zM8.5 20h7"/>',
    star: '<path d="m12 3.2 2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.5l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z"/>',
    flyer:
      '<rect x="5.5" y="3.5" width="13" height="17" rx="2"/><path d="M9 8h6M9 11.5h6M9 15h3.5"/>',
    chat: '<path d="M5 5.5h14A1.5 1.5 0 0 1 20.5 7v8.5A1.5 1.5 0 0 1 19 17h-7.5L7 20.5V17H5a1.5 1.5 0 0 1-1.5-1.5V7A1.5 1.5 0 0 1 5 5.5z"/>',
    expand:
      '<path d="M4.5 9V4.5H9M19.5 9V4.5H15M4.5 15v4.5H9M19.5 15v4.5H15"/>',
    shrink:
      '<path d="M9 4.5V9H4.5M15 4.5V9h4.5M9 19.5V15H4.5M15 19.5V15h4.5"/>',
    ear: '<path d="M7 9.5a5 5 0 0 1 10 0c0 3-2.6 3.8-3.2 6.2-.4 1.9-1.6 3.3-3.5 3.3a3 3 0 0 1-2.8-2"/><path d="M10 10a2 2 0 0 1 4 0c0 1.2-1 1.6-1.5 2.4"/>',
    voice:
      '<path d="M4.5 9.5h3l4.5-4v13l-4.5-4h-3z"/><path d="M15.5 9.2a4 4 0 0 1 0 5.6M18.2 6.6a7.6 7.6 0 0 1 0 10.8"/>',
    voiceOff:
      '<path d="M4.5 9.5h3l4.5-4v13l-4.5-4h-3z"/><path d="m16 9.5 5 5M21 9.5l-5 5"/>',
    sliders:
      '<path d="M4.5 7.5h8M17.5 7.5h2M4.5 16.5h2M11.5 16.5h8"/><circle cx="15" cy="7.5" r="2.5"/><circle cx="9" cy="16.5" r="2.5"/>',
    captions:
      '<rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="M10.6 10.2a2.3 2.3 0 1 0 0 3.6M16.6 10.2a2.3 2.3 0 1 0 0 3.6"/>',
    keys: '<rect x="3" y="6.5" width="18" height="11" rx="2.5"/><path d="M7 10.5h.01M10.5 10.5h.01M14 10.5h.01M17.5 10.5h.01M8 14h8"/>',
    hand: '<path d="M8.5 12.5V6a1.5 1.5 0 0 1 3 0v5.5V4.8a1.5 1.5 0 0 1 3 0v6.7V6.3a1.5 1.5 0 0 1 3 0v8.2a6 6 0 0 1-6 6h-.6a6 6 0 0 1-4.8-2.4l-2.6-3.5a1.5 1.5 0 0 1 2.3-1.9z"/>',
  };
  var CREST =
    '<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><circle cx="20" cy="20" r="18.5" fill="#1E5A47" stroke="#F7F4EE" stroke-width="1.5"/>' +
    '<path d="M20 29.5v-8" stroke="#A9492A" stroke-width="3" stroke-linecap="round"/>' +
    '<g fill="#F7F4EE"><circle cx="14.2" cy="17.4" r="4.6"/><circle cx="20" cy="13.4" r="5.6"/><circle cx="25.8" cy="17.4" r="4.6"/><rect x="11" y="16.5" width="18" height="5.2" rx="2.6"/></g>' +
    '<g fill="#E69F00"><circle cx="10.5" cy="31.2" r="1.5"/><circle cx="15.5" cy="32.6" r="1.5"/><circle cx="20.5" cy="33" r="1.5"/><circle cx="25.5" cy="32.4" r="1.5"/><circle cx="30.2" cy="31" r="1.5"/></g></svg>';
  ctx.publish({ nm, nmCap, t2 });
  ctx.bind({
    STOPS: [() => STOPS, (value) => (STOPS = value)],
    PLAYABLE: [() => PLAYABLE, (value) => (PLAYABLE = value)],
    POS: [() => POS, (value) => (POS = value)],
    CHAP: [() => CHAP, (value) => (CHAP = value)],
    NB: [() => NB, (value) => (NB = value)],
    ANIMALS: [() => ANIMALS, (value) => (ANIMALS = value)],
    ICON: [() => ICON, (value) => (ICON = value)],
    BASKET_ICON: [() => BASKET_ICON, (value) => (BASKET_ICON = value)],
    STAR_ON: [() => STAR_ON, (value) => (STAR_ON = value)],
    STAR_OFF: [() => STAR_OFF, (value) => (STAR_OFF = value)],
    SVGNS: [() => SVGNS, (value) => (SVGNS = value)],
    IC: [() => IC, (value) => (IC = value)],
    CREST: [() => CREST, (value) => (CREST = value)],
  });
}
