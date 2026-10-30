/* Community Builders of Pecan Grove · Stop 2 · Ask a Good Question / Haz una buena pregunta
   Skill: turn a worry into a clear, open, specific question someone can actually answer.
   The worries come from "02 - ask-a-good-question.md"; open questions are authored for each worry so a clear-looking
   sentence cannot earn full praise while missing what the neighbor actually wants to learn.
   Points reward the question only (topic +10, open start +8, fitting detail +7, per worry): never a side, never speed.
   After an answer that has tips, "Fix my question" brings the tiles back with the tips and the tile to try marked, so a tip is
   always something the player can act on. Only the first try of each worry counts for points; a fixed question replaces the
   words on the board and the score card, never the score. */
/* Scene: the clock-tower building of the painted town map stands in for the library porch; no text inputs, no network. */
(function () {
  "use strict";
  var host = window.CommunityBuilders; if (!host) return;
  function factory(lifecycle) {
    var document = lifecycle.document, window = lifecycle.window, Date = lifecycle.Date;
    var setTimeout = lifecycle.setTimeout, clearTimeout = lifecycle.clearTimeout;
    var requestAnimationFrame = lifecycle.requestAnimationFrame, cancelAnimationFrame = lifecycle.cancelAnimationFrame;
    var definition = null, CB = { register: function (value) { definition = value; } };

  "use strict";

  var L = (document.documentElement.lang || "en").slice(0, 2) === "es" ? "es" : "en";
  var I = L === "es" ? 1 : 0;                       // index into every [en, es] pair below
  var ID = "ask-a-good-question";

  /* ── words (exact, from the spec) ─────────────────────────────────── */
  var T = window.CBLocale.read("stop-02", L, {en:{"T.coachFor":function (n) { return window.CBLocale.part("stop-02", "en", "T.coachFor", 0) + n + window.CBLocale.part("stop-02", "en", "T.coachFor", 1); },"T.boardK":function (n) { return window.CBLocale.part("stop-02", "en", "T.boardK", 0) + n + window.CBLocale.part("stop-02", "en", "T.boardK", 1); },"T.worryN":function (n) { return window.CBLocale.part("stop-02", "en", "T.worryN", 0) + n + window.CBLocale.part("stop-02", "en", "T.worryN", 1); },"T.topicNo":function (t) { return window.CBLocale.part("stop-02", "en", "T.topicNo", 0) + t + window.CBLocale.part("stop-02", "en", "T.topicNo", 1); },"T.detNo":function (d) { return window.CBLocale.part("stop-02", "en", "T.detNo", 0) + d + window.CBLocale.part("stop-02", "en", "T.detNo", 1); }},es:{"T.coachFor":function (n) { return (window.CBLocale.part("stop-02", "es", "T.coachFor", 0) + n + window.CBLocale.part("stop-02", "es", "T.coachFor", 1)).replace(window.CBLocale.part("stop-02", "es", "T.coachFor", 2), window.CBLocale.part("stop-02", "es", "T.coachFor", 3)); },"T.boardK":function (n) { return window.CBLocale.part("stop-02", "es", "T.boardK", 0) + n + window.CBLocale.part("stop-02", "es", "T.boardK", 1); },"T.worryN":function (n) { return window.CBLocale.part("stop-02", "es", "T.worryN", 0) + n + window.CBLocale.part("stop-02", "es", "T.worryN", 1); },"T.topicNo":function (t) { return window.CBLocale.part("stop-02", "es", "T.topicNo", 0) + t + window.CBLocale.part("stop-02", "es", "T.topicNo", 1); },"T.detNo":function (d) { return window.CBLocale.part("stop-02", "es", "T.detNo", 0) + d + window.CBLocale.part("stop-02", "es", "T.detNo", 1); }}}).T;

  /* tiles: [id, en, es]; topics also carry the fixed "How much" opening [en, es] */
  var START = [[].concat(["how"],window.CBLocale.pair("stop-02","bank.b0001")), [].concat(["when"],window.CBLocale.pair("stop-02","bank.b0002")), [].concat(["who"],window.CBLocale.pair("stop-02","bank.b0003")),
    [].concat(["whatif"],window.CBLocale.pair("stop-02","bank.b0004")), [].concat(["will"],window.CBLocale.pair("stop-02","bank.b0005"))];
  var TOPIC = [
    [].concat(["water"],window.CBLocale.pair("stop-02","bank.b0006"),window.CBLocale.pair("stop-02","bank.b0007")),
    [].concat(["trucks"],window.CBLocale.pair("stop-02","bank.b0008"),window.CBLocale.pair("stop-02","bank.b0009")),
    [].concat(["noise"],window.CBLocale.pair("stop-02","bank.b0010"),window.CBLocale.pair("stop-02","bank.b0011")),
    [].concat(["jobs"],window.CBLocale.pair("stop-02","bank.b0012"),window.CBLocale.pair("stop-02","bank.b0013")),
    [].concat(["bills"],window.CBLocale.pair("stop-02","bank.b0014"),window.CBLocale.pair("stop-02","bank.b0015")),
    [].concat(["graves"],window.CBLocale.pair("stop-02","bank.b0016"),window.CBLocale.pair("stop-02","bank.b0017")),
    [].concat(["engines"],window.CBLocale.pair("stop-02","bank.b0018"),window.CBLocale.pair("stop-02","bank.b0019"))
  ];
  var DETAIL = [[].concat(["d1"],window.CBLocale.pair("stop-02","bank.b0020")), [].concat(["d2"],window.CBLocale.pair("stop-02","bank.b0021")), [].concat(["d3"],window.CBLocale.pair("stop-02","bank.b0022")),
    [].concat(["d4"],window.CBLocale.pair("stop-02","bank.b0023")), [].concat(["d5"],window.CBLocale.pair("stop-02","bank.b0024")), [].concat(["d6"],window.CBLocale.pair("stop-02","bank.b0025")),
    [].concat(["d7"],window.CBLocale.pair("stop-02","bank.b0026"))];
  var POOL = { start: START, topic: TOPIC, detail: DETAIL };
  /* the question is built from fixed frames, never by joining tiles; {d} is " detail" or nothing */
  var FRAME = {
    when: window.CBLocale.pair("stop-02","bank.b0027"),
    who: window.CBLocale.pair("stop-02","bank.b0028"),
    whatif: window.CBLocale.pair("stop-02","bank.b0029"),
    will: window.CBLocale.pair("stop-02","bank.b0030")
  };

  /* Every open start has an authored purpose for the current worry: a measurement, schedule, responsible person,
     or response to a problem. Generic frames are only a preview for a different topic, and cannot earn full praise.
     These new, variable questions and feedback are text-only (data-cb-novoice); existing worry and coach clips stay
     intact. Do not attach an old recording to new words, or offer a replay button for an unavailable recording. */
  var QUESTIONS = {
    "A-lee": {
      how: window.CBLocale.pair("stop-02","bank.b0031"),
      when: window.CBLocale.pair("stop-02","bank.b0032"),
      who: window.CBLocale.pair("stop-02","bank.b0033"),
      whatif: window.CBLocale.pair("stop-02","bank.b0034")
    },
    "A-johnson": {
      how: window.CBLocale.pair("stop-02","bank.b0035"),
      when: window.CBLocale.pair("stop-02","bank.b0036"),
      who: window.CBLocale.pair("stop-02","bank.b0037"),
      whatif: window.CBLocale.pair("stop-02","bank.b0038")
    },
    "A-ana": {
      how: window.CBLocale.pair("stop-02","bank.b0039"),
      when: window.CBLocale.pair("stop-02","bank.b0040"),
      who: window.CBLocale.pair("stop-02","bank.b0041"),
      whatif: window.CBLocale.pair("stop-02","bank.b0042")
    },
    "A-ruth": {
      how: window.CBLocale.pair("stop-02","bank.b0043"),
      when: window.CBLocale.pair("stop-02","bank.b0044"),
      who: window.CBLocale.pair("stop-02","bank.b0045"),
      whatif: window.CBLocale.pair("stop-02","bank.b0046")
    },
    "A-patel": {
      how: window.CBLocale.pair("stop-02","bank.b0047"),
      when: window.CBLocale.pair("stop-02","bank.b0048"),
      who: window.CBLocale.pair("stop-02","bank.b0049"),
      whatif: window.CBLocale.pair("stop-02","bank.b0050")
    },
    "A-jayden": {
      how: window.CBLocale.pair("stop-02","bank.b0051"),
      when: window.CBLocale.pair("stop-02","bank.b0052"),
      who: window.CBLocale.pair("stop-02","bank.b0053"),
      whatif: window.CBLocale.pair("stop-02","bank.b0054")
    },
    "B-lee": {
      how: window.CBLocale.pair("stop-02","bank.b0055"),
      when: window.CBLocale.pair("stop-02","bank.b0056"),
      who: window.CBLocale.pair("stop-02","bank.b0057"),
      whatif: window.CBLocale.pair("stop-02","bank.b0058")
    },
    "B-johnson": {
      how: window.CBLocale.pair("stop-02","bank.b0059"),
      when: window.CBLocale.pair("stop-02","bank.b0060"),
      who: window.CBLocale.pair("stop-02","bank.b0061"),
      whatif: window.CBLocale.pair("stop-02","bank.b0062")
    },
    "B-ana": {
      how: window.CBLocale.pair("stop-02","bank.b0063"),
      when: window.CBLocale.pair("stop-02","bank.b0064"),
      who: window.CBLocale.pair("stop-02","bank.b0065"),
      whatif: window.CBLocale.pair("stop-02","bank.b0066")
    },
    "B-ruth": {
      how: window.CBLocale.pair("stop-02","bank.b0067"),
      when: window.CBLocale.pair("stop-02","bank.b0068"),
      who: window.CBLocale.pair("stop-02","bank.b0069"),
      whatif: window.CBLocale.pair("stop-02","bank.b0070")
    },
    "B-patel": {
      how: window.CBLocale.pair("stop-02","bank.b0071"),
      when: window.CBLocale.pair("stop-02","bank.b0072"),
      who: window.CBLocale.pair("stop-02","bank.b0073"),
      whatif: window.CBLocale.pair("stop-02","bank.b0074")
    },
    "B-jayden": {
      how: window.CBLocale.pair("stop-02","bank.b0075"),
      when: window.CBLocale.pair("stop-02","bank.b0076"),
      who: window.CBLocale.pair("stop-02","bank.b0077"),
      whatif: window.CBLocale.pair("stop-02","bank.b0078")
    }
  };
  var HOW_START = {
    "A-lee": window.CBLocale.pair("stop-02","bank.b0079"), "A-ana": window.CBLocale.pair("stop-02","bank.b0080"),
    "A-patel": window.CBLocale.pair("stop-02","bank.b0080"), "B-ruth": window.CBLocale.pair("stop-02","bank.b0081")
  };

  /* the 12 Stop 3 worries, word for word: [id, neighbor, set, topic, details that fit, [en, es]] */
  var WORRIES = [
    ["A-lee", "lee", "A", "engines", ["d2", "d4"], window.CBLocale.pair("stop-02","bank.b0082")],
    ["A-johnson", "johnson", "A", "water", ["d5", "d7"], window.CBLocale.pair("stop-02","bank.b0083")],
    ["A-ana", "ana", "A", "jobs", ["d2", "d3"], window.CBLocale.pair("stop-02","bank.b0084")],
    ["A-ruth", "ruth", "A", "graves", ["d5"], window.CBLocale.pair("stop-02","bank.b0085")],
    ["A-patel", "patel", "A", "trucks", ["d6", "d7"], window.CBLocale.pair("stop-02","bank.b0086")],
    ["A-jayden", "jayden", "A", "jobs", ["d2", "d3"], window.CBLocale.pair("stop-02","bank.b0087")],
    ["B-lee", "lee", "B", "noise", ["d2", "d3"], window.CBLocale.pair("stop-02","bank.b0088")],
    ["B-johnson", "johnson", "B", "water", ["d5"], window.CBLocale.pair("stop-02","bank.b0089")],
    ["B-ana", "ana", "B", "water", ["d5", "d7"], window.CBLocale.pair("stop-02","bank.b0090")],
    ["B-ruth", "ruth", "B", "bills", ["d2", "d3"], window.CBLocale.pair("stop-02","bank.b0091")],
    ["B-patel", "patel", "B", "bills", ["d7", "d6"], window.CBLocale.pair("stop-02","bank.b0092")],
    ["B-jayden", "jayden", "B", "noise", ["d2", "d3"], window.CBLocale.pair("stop-02","bank.b0093")]
  ].map(function (w) { return { id: w[0], nb: w[1], set: w[2], topic: w[3], d: w[4], text: w[5][I] }; });

  /* the Pecan Sticker (spec: "a pecan-shaped sticker" on each asked question): a storybook pecan, see .cb-story in cb.css */
  var PECAN_ART = '<g transform="rotate(38 32 32)"><path class="wd" d="M32 5c9.5 5.5 14 15 14 26.5S41.5 52 32 59c-9.5-7-14-16-14-27.5S22.5 10.5 32 5z"/>' +
    '<path class="n wdd" d="M32 9c6.5 5 10 13.5 10 22.5s-3.5 18-10 23.5z"/><path class="ln" d="M32 10v45M25 20c2 6 2 16 0 24M39 20c-2 6-2 16 0 24"/>' +
    '<path class="n hl" d="M25 15c1.5-2.4 3.5-4.4 5.6-5.6-1.2 2.6-2 5.4-2.4 8.4z"/></g>';
  var CROP = { scene: [0.335, 0.2, 0.665, 0.53], centred: [0.335, 0.26, 0.665, 0.59] };   // the clock-tower building and its wide steps

  function word(pool, id) { var t = pool.filter(function (x) { return x[0] === id; })[0]; return t ? t[1 + I] : ""; }
  function startWord(w, id) { return id === "how" && HOW_START[w.id] ? HOW_START[w.id][I] : word(START, id); }
  function question(w, s, t, d) {
    if (!word(START, s)) return "";
    if (!t) return startWord(w, s);                                     // only Start picked: show the Start tile words
    var topic = TOPIC.filter(function (x) { return x[0] === t; })[0];
    if (!topic) return "";
    var dd = d ? " " + word(DETAIL, d) : "";
    var authored = t === w.topic && QUESTIONS[w.id] && QUESTIONS[w.id][s];
    if (authored) return authored[I].replace("{d}", dd);
    if (s === "how") return topic[3 + I] + dd + "?";
    return FRAME[s][I].replace("{t}", word(TOPIC, t)).replace("{d}", dd);
  }
  function judge(w, a) {
    var tOk = a.topic === w.topic, sOk = ["how", "when", "who", "whatif"].indexOf(a.start) !== -1,
      dOk = tOk && !!a.detail && w.d.indexOf(a.detail) !== -1, good = tOk + sOk + dOk;
    return {
      pts: (tOk ? 10 : 0) + (sOk ? 8 : 0) + (dOk ? 7 : 0), tOk: tOk, sOk: sOk, dOk: dOk,
      line: good === 3 ? T.ans3 : good ? T.ans12 : T.ans0,
      notes: [[tOk, tOk ? T.topicOk : T.topicNo(word(TOPIC, w.topic))], [sOk, sOk ? T.startOk : T.startWill],
        [dOk, dOk ? T.detOk : !tOk ? T.detTopic : !a.detail ? T.detNone : T.detNo(word(DETAIL, w.d[0]))]]
    };
  }

  function run(api, stop) {
    function reduced() { return api.motionAllowed ? !api.motionAllowed() : api.REDUCED; }
    var h = api.h, rec = api.rec(stop.id), team = api.team();
    var DOTS = [null, null, null, null], uid = 0;

    /* ── a new round: 4 worries from 4 different neighbors, both sets, at least 2 new since last time ── */
    function draw() {
      var prev = (rec && rec.lastRound) || [], prevOrder = ((rec && rec.lastOrder) || []).join(","),
        ex = team && team.phase === "B" && team.s02 ? team.s02 : [], fallback = null;
      for (var t = 0; t < 400; t++) {
        var ws = api.shuffle(api.NB).slice(0, 4).map(function (n) {
          var opts = WORRIES.filter(function (w) { return w.nb === n.id && ex.indexOf(w.id) === -1; });
          return opts.length ? api.pick(opts) : null;
        });
        if (ws.indexOf(null) !== -1) continue;
        fallback = fallback || ws;
        var sets = {}; ws.forEach(function (w) { sets[w.set] = 1; });
        var same = ws.filter(function (w) { return prev.indexOf(w.id) !== -1; }).length;
        if (sets.A && sets.B && same <= 2 && ws.map(function (w) { return w.nb; }).join(",") !== prevOrder) return ws;
      }
      return fallback || api.shuffle(WORRIES).slice(0, 4);
    }
    var round = draw();
    if (team && team.phase === "A") team.s02 = round.map(function (w) { return w.id; });   // Team 2 gets 4 other worries
    var speakers = round.map(function (w) { return api.nbById(w.nb); });                  // the steps order is the speaking order
    /* every worry shuffles every row, and never repeats the row order of the worry before it */
    var orders = [];
    round.forEach(function (w, i) {
      var o = {};
      ["start", "topic", "detail"].forEach(function (row) {
        var ids = POOL[row].map(function (x) { return x[0]; }), last = i ? orders[i - 1][row].join(",") : ids.join(","), s;
        for (var k = 0; k < 20; k++) { s = api.shuffle(ids); if (s.join(",") !== last) break; }
        o[row] = s;
      });
      orders.push(o);
    });
    var answers = [], wi = 0, sel = null, screenKey = "intro", restoreAsk = null, stopLayout = null;
    if (api.setController) api.setController({
      snapshot: function () { return { screenKey: screenKey, round: round.map(function (w) { return w.id; }), orders: orders, answers: answers, wi: wi, sel: sel }; },
      restore: function (state) {
        if (!state || !Array.isArray(state.round) || state.round.length !== 4) return;
        var restoredRound = state.round.map(function (id) { return WORRIES.filter(function (w) { return w.id === id; })[0]; });
        if (restoredRound.some(function (w) { return !w; })) return;
        round = restoredRound; speakers = round.map(function (w) { return api.nbById(w.nb); });
        if (Array.isArray(state.orders) && state.orders.length === 4) orders = state.orders;
        answers = (state.answers || []).slice(0, 4).map(function (a, i) { var copy = Object.assign({}, a); copy.q = question(round[i], a.start, a.topic, a.detail); copy.r = a.fixed ? a.r : judge(round[i], a); if (a.fixed) copy.fixed = judge(round[i], a); return copy; });
        wi = Math.max(0, Math.min(4, Number(state.wi) || 0));
        if (state.screenKey === "result" || wi === 4) finish();
        else if (state.screenKey === "intro") intro();
        else { worry(!!answers[wi], state.sel); if (state.screenKey === "answer" && restoreAsk) restoreAsk(true); }
      }, onPause: function () {}, onResume: function () {}
    });

    function sticker(empty) { return h("span", { "class": "cb-s02-sticker" + (empty ? " is-empty" : ""), "aria-hidden": "true" }, [h("span", { "class": "cb-story-obj" }, [api.story(PECAN_ART)])]); }

    /* ── the scene: the painted library with this round's four neighbors on its steps ── */
    function scene(cur, answered, withBubble) {
      var porch = h("ul", { "class": "cb-s02-porch", "aria-hidden": "true" }, speakers.map(function (n, i) {
        var s = cur < 0 ? "wait" : i < cur ? "done" : i === cur ? (withBubble ? "now" : "up-next") : "wait";
        return h("li", { "class": "cb-s02-nb", "data-s": s, "data-i": String(i) }, [
          h("span", { "class": "cb-s02-nb__face" }, [api.img(n.img, "", null, true), s === "done" || (s === "now" && answered) ? h("span", { "class": "cb-badge" }, [api.ico("check")]) : null]),
          h("span", { "class": "cb-s02-nb__name", text: api.nmCap(n) })]);
      }));
      var kids = withBubble
        ? [api.crop(CROP.centred, "cb-s02-art cb-s02-art--wide"), api.crop(CROP.centred, "cb-s02-art cb-s02-art--narrow"), porch]
        : [api.crop(CROP.centred, "cb-s02-art"), porch];
      if (withBubble) {
        var n = speakers[cur], w = round[cur];
        var bubble = h("blockquote", { "class": "cb-bubble cb-s02-say", tabindex: "-1", "data-s02": "worry" }, [
          h("p", null, [h("span", { "class": "cb-vh", text: api.nmCap(n) + ": " }), w.text])]);
        bubble.style.setProperty("--tail", ((cur + 0.5) * 25).toFixed(1) + "%");     // the tail points at the neighbor who is talking
        kids.push(bubble);
      }
      return h("div", { "class": "cb-s02-scene" + (withBubble ? "" : " cb-s02-scene--intro") }, kids);
    }

    /* ── the question board: the four asked questions, each with a Pecan Sticker ── */
    function boardCard(fresh) {
      var bid = "cb-s02-bk" + (++uid);
      return h("section", { "class": "cb-s02-boardwrap", "aria-labelledby": bid, "data-cb-novoice": "" }, [h("p", { "class": "cb-s02-board__k", id: bid, text: T.boardK(answers.length).replace(/(\d+)\s+(\S+)\s+(\d+)\s*$/, "$1\u00a0$2\u00a0$3") }),
        h("ol", { "class": "cb-s02-board" }, [0, 1, 2, 3].map(function (i) {
          var a = answers[i], now = i === wi && !a;
          if (!a) return h("li", { "class": "is-empty" + (now ? " is-now" : ""), "aria-hidden": "true" }, [sticker(true), now ? h("p", { "class": "cb-s02-board__hint", text: T.slotNow }) : h("span"), api.img(speakers[i].img, "", "cb-s02-board__face", true)]);
          return h("li", { "class": fresh && i === answers.length - 1 ? "is-new" : null }, [sticker(false), h("p", { text: a.q }), api.img(speakers[i].img, "", "cb-s02-board__face", true)]);
        }))]);
    }

    /* ── intro ── */
    function intro() {
      screenKey = "intro";
      var ex = h("p", { "class": "cb-s02-ex" }, [exLine(0), " ", exLine(1)]);
      var go = api.btn(T.start, "cb-btn--go cb-btn--big", function () { worry(); }, "go", true);
      api.screen([api.stopHud(stop, null), h("div", { "class": "cb-board" }, [h("div", { "class": "cb-s02-intro" }, [
        scene(0, false, false),
        h("div", { "class": "cb-s02-intro__copy" }, [h("p", { "class": "cb-s02-first", text: (window.CBLocale.t("stop-02",L,"bank.b0094")) + api.nmCap(speakers[0]) }), h("p", { "class": "cb-s02-intro__lead", text: T.intro1 }), ex, h("div", { "class": "cb-row" }, [go])])])])]);
      /* the shell frames the stage top; on a phone the intro is taller than the screen, so go one step further
         (never past the stage top) until "Let's start" is in view too */
      var root = go.closest(".cb"); if (!root) return api.frame();
      var v = view(root), r = root.getBoundingClientRect(), top = v.fs ? 0 : r.top - v.top + v.y,
        pad = v.fs ? 0 : parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0,
        framed = (v.fs ? v.y > 4 : r.top < -4) ? Math.max(0, top - pad) : v.y,
        to = Math.min(top, Math.max(framed, go.getBoundingClientRect().bottom - v.top + v.y - v.h + 20));
      if (Math.abs(to - framed) <= 4) api.frame();
      else v.el.scrollTo({ top: to, behavior: reduced() ? "auto" : "smooth" });
    }
    function exLine(i) { var p = T.ex[i]; return h("span", { "class": "cb-s02-ex__line" }, [api.ico(i ? "check" : "chat"), h("span", null, [h("b", { text: p[0] }), p[1]])]); }

    /* ── one worry: tiles in, question on the strip, then the neighbor answers ── */
    function worry(again, restoredSelection) {
      if (stopLayout) stopLayout();
      screenKey = "worry";
      var prev = again ? answers[wi] : null, lastR = prev ? (prev.fixed || prev.r) : null;
      sel = prev ? { start: prev.start, topic: prev.topic, detail: prev.detail } : { start: null, topic: null, detail: null };
      if (restoredSelection) sel = { start: restoredSelection.start || null, topic: restoredSelection.topic || null, detail: restoredSelection.detail || null };
      var hint = { start: null, topic: null, detail: null };
      if (lastR) {
        if (!lastR.sOk) hint.start = "how";
        if (!lastR.tOk) hint.topic = round[wi].topic;
        if (!lastR.dOk) hint.detail = round[wi].d[0];
      }
      // The shared scene guard protects the previous pointer position. A new
      // choice elsewhere is deliberate and must work as soon as it is visible.
      var lineEl = h("p", { "class": "cb-s02-q__line is-empty", id: "cb-s02-q", "data-cb-novoice": "" });
      var overBtn = api.btn(T.over, "cb-btn--quiet", function () { if (overBtn.getAttribute("aria-disabled") === "true") return; sel = { start: null, topic: null, detail: null }; refresh(); }, "replay");
      var askBtn = api.btn(T.ask, "cb-btn--go cb-btn--big cb-s02-ask", function () { ask(); }, "chat");
      askBtn.setAttribute("aria-describedby", "cb-s02-q");
      var strip = h("div", { "class": "cb-actions cb-s02-strip" }, [h("span", { "class": "cb-s02-q__k", text: T.yourQ }), lineEl, askBtn]);
      var rows = ["start", "topic", "detail"].map(function (row) {
        var lid = "cb-s02-r" + (++uid);
        var tiles = h("div", { "class": "cb-s02-tiles" }, orders[wi][row].map(function (id) {
          return h("button", { type: "button", "class": "cb-s02-tile" + (hint[row] === id ? " is-hint" : ""), "aria-pressed": "false", "data-row": row, "data-id": id, onclick: function () { pick(row, id); } }, [
            h("span", { text: row === "start" ? startWord(round[wi], id) : word(POOL[row], id) }), h("span", { "class": "cb-s02-tile__ck", "aria-hidden": "true" }, [api.ico("check")])]);
        }));
        var fixRow = lastR && (row === "start" ? !lastR.sOk : row === "topic" ? !lastR.tOk : !lastR.dOk);
        return h("div", { "class": "cb-s02-row" + (fixRow ? " is-needed" : ""), role: "group", "aria-labelledby": lid, "data-row": row, "data-cb-choices": "" }, [
          h("p", { "class": "cb-s02-row__k", id: lid }, [h("i", { "aria-hidden": "true" }), h("span", { text: T.rows[row] })]), tiles]);
      });
      var tray = h("div", { "class": "cb-s02-tray" }, rows.concat([h("div", { "class": "cb-s02-tray__foot" }, [overBtn])]));
      var coachEl = api.coach(lastR ? T.fixCoach : T.coachFor(api.nm(speakers[wi])), "chat");    // the instruction names whose worry it is
      if (lastR) {                                                      // fixing: the neighbor's tips stay in view above the tiles
        var tips = h("ul", { "class": "cb-s02-notes cb-s02-tips", "data-cb-novoice": "" }, lastR.notes.filter(function (x) { return !x[0]; }).map(function (x) {
          return h("li", null, [api.ico("bulb"), h("span", { text: x[1] })]); }));
        coachEl = h("div", { "class": "cb-s02-fixhead" }, [coachEl, tips]);
      }
      var work = h("div", { "class": "cb-s02-work" }, [coachEl, tray]);
      var sceneEl = scene(wi, false, true), board = boardCard(false);
      /* the worry and the board stay in view while the tiles scroll: a sticky side column on a wide stage,
         a sticky speech bubble on a narrow one (CSS) */
      var side = h("div", { "class": "cb-s02-side" }, [sceneEl, board]);
      var compactAsk = api.btn(T.ask, "cb-btn--go cb-s02-ask-float", function () { ask(); }, "chat");
      /* a pointer shortcut only: the inline Ask button in the strip stays the one keyboard and screen reader stop */
      compactAsk.setAttribute("tabindex", "-1");
      compactAsk.setAttribute("aria-hidden", "true");
      compactAsk.hidden = true;
      var playEl = h("div", { "class": "cb-s02-play" }, [side, work]);
      var bubble = sceneEl.querySelector('[data-s02="worry"]');
      refresh();
      api.screen([api.stopHud(stop, DOTS, wi, T.worryN(wi + 1)), h("div", { "class": "cb-board" }, [playEl, strip, compactAsk])], '[data-s02="worry"]');
      stickRoom(playEl, bubble);
      stopLayout = measureLayout(playEl, bubble, strip, compactAsk);
      frameWorry(sceneEl, bubble, strip);

      function refresh() {
        [].forEach.call(tray.querySelectorAll(".cb-s02-tile"), function (b) {
          b.setAttribute("aria-pressed", sel[b.getAttribute("data-row")] === b.getAttribute("data-id") ? "true" : "false");
        });
        var q = question(round[wi], sel.start, sel.topic, sel.detail);
        lineEl.textContent = q; lineEl.classList.toggle("is-empty", !q);
        askBtn.setAttribute("aria-disabled", sel.start && sel.topic ? "false" : "true");
        if (typeof compactAsk !== "undefined" && compactAsk) compactAsk.setAttribute("aria-disabled", sel.start && sel.topic ? "false" : "true");
        overBtn.setAttribute("aria-disabled", sel.start || sel.topic || sel.detail ? "false" : "true");
        return q;
      }
      function pick(row, id) {
        sel[row] = sel[row] === id ? null : id;                           // one tile per row; tap again to unpick
        rows.forEach(function (r) { if (r.getAttribute("data-row") === row) r.classList.remove("is-needed"); });
        var q = refresh();
        if (q) api.say(q);                                                // the live area reads the question as it changes
      }
      function ask(renderOnly) {
        if (!sel.start || !sel.topic) {                                   // "Ask it" works once Start and Topic are picked
          rows.forEach(function (r) { var k = r.getAttribute("data-row"); r.classList.toggle("is-needed", k !== "detail" && !sel[k]); });
          var need = tray.querySelector(".cb-s02-row.is-needed");
          if (need) need.scrollIntoView({ block: "nearest", behavior: reduced() ? "auto" : "smooth" });   // show the row that still needs a tile
          api.say(T.coachFor(api.nm(speakers[wi]))); return;
        }
        screenKey = "answer";
        var w = round[wi], n = speakers[wi], a = { w: w.id, start: sel.start, topic: sel.topic, detail: sel.detail };
        a.q = question(w, a.start, a.topic, a.detail);
        var r = judge(w, a), first = answers[wi];
        if (first && !renderOnly) {                                       // a fixed question: new words and a new answer, same points
          first.q = a.q; first.start = a.start; first.topic = a.topic; first.detail = a.detail; first.fixed = r;
        } else if (!first) { a.pts = r.pts; a.r = r; answers.push(a); }
        var talk = h("div", { "class": "cb-s02-talk", role: "group", "aria-label": api.nmCap(n), tabindex: "-1", "data-s02": "answer", "data-cb-novoice": "" }, [
          h("p", { "class": "cb-s02-you", text: a.q }),
          h("div", { "class": "cb-s02-reply" }, [api.img(n.img, "", "cb-s02-reply__face", true), h("p", { "class": "cb-s02-reply__line", text: r.line }),
            h("ul", { "class": "cb-s02-notes" }, r.notes.map(function (x) { return h("li", { "class": x[0] ? "is-ok" : null }, [api.ico(x[0] ? "check" : "bulb"), h("span", { text: x[1] })]); }))])]);
        work.replaceChild(talk, tray); work.removeChild(coachEl);          // one idea at a time: the tiles and their instruction make way for the answer
        var newBoard = boardCard(!first); side.replaceChild(newBoard, board); board = newBoard;
        var face = sceneEl.querySelector('.cb-s02-nb[data-i="' + wi + '"] .cb-s02-nb__face');
        if (face && !face.querySelector(".cb-badge")) face.appendChild(h("span", { "class": "cb-badge" }, [api.ico("check")]));
        var asked = Date.now(), last = wi === 3;
        var nextBtn = api.btn(last ? T.see : T.next, "cb-btn--go cb-btn--big", function (event) {
          if (event && event.detail > 0 && Date.now() - asked < 400) return; // a double tap on "Ask it" never skips the neighbor's answer
          wi++; if (wi < 4) worry(); else finish();
        }, "go", true);
        var fixBtn = r.tOk && r.sOk && r.dOk ? null : api.btn(T.fix, "cb-btn--quiet cb-btn--big", function (event) {
          if (event && event.detail > 0 && Date.now() - asked < 400) return;
          worry(true);
        }, "replay");
        var strip2 = h("div", { "class": "cb-actions cb-s02-strip is-done" }, [fixBtn, nextBtn]);
        strip.parentNode.replaceChild(strip2, strip);
        compactAsk.remove();
        if (stopLayout) stopLayout();
        stopLayout = measureLayout(playEl, bubble, strip2, null);
        talk.focus({ preventScroll: true });                              // after Ask it, focus moves to the answer
        reveal(talk, bubble, strip2);
        api.say(r.line + " " + r.notes.map(function (x) { return x[1]; }).join(" "));   // the answer and notes, never points
      }
      restoreAsk = ask;
    }

    /* how much of the screen top the stuck speech bubble covers (narrow stage only), for scroll margins */
    function stickRoom(playEl, bubble) {
      function set() { if (bubble.isConnected) playEl.style.setProperty("--s02-stick", (bubble.offsetHeight + 12) + "px"); }
      set();
      if (window.ResizeObserver) { var ro = new ResizeObserver(function () { if (!bubble.isConnected) ro.disconnect(); else set(); }); ro.observe(bubble); }
    }
    // Use the stage's measured available space, including embedded/fullscreen and zoomed layouts.
    function measureLayout(play, bubble, strip, floating) {
      var root = play.closest(".cb"), board = play.closest(".cb-board"), observer = null, disposed = false;
      if (!root) return function () {};
      function overlaps(a, b) { return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top; }
      function measure() {
        if (disposed || !strip.isConnected) return;
        var r = root.getBoundingClientRect(), height = Math.min(root.clientHeight || window.innerHeight, window.innerHeight), width = r.width || root.clientWidth;
        var compact = width < 600 || height < 700;
        root.setAttribute("data-s02-layout", "");
        root.toggleAttribute("data-s02-short", height < 640);
        board.classList.toggle("is-s02-compact", compact);
        root.style.setProperty("--s02-strip-h", Math.ceil(strip.getBoundingClientRect().height) + "px");
        if (!floating) return;
        floating.hidden = !compact;
        floating.style.right = Math.max(12, window.innerWidth - r.right + 12) + "px";
        if (compact) {
          var button = floating.getBoundingClientRect();
          // Keep the duplicate shortcut out of the art. The inline Ask button remains available.
          var collision = [].some.call(play.querySelectorAll(".cb-s02-art,.cb-s02-say"), function (art) { return overlaps(button, art.getBoundingClientRect()); });
          floating.hidden = collision;
        }
      }
      if (window.ResizeObserver) { observer = new window.ResizeObserver(measure); observer.observe(root); observer.observe(strip); observer.observe(bubble); }
      window.addEventListener("resize", measure); document.addEventListener("scroll", measure, true);
      measure();
      function dispose() { if (disposed) return; disposed = true; if (observer) observer.disconnect(); window.removeEventListener("resize", measure); document.removeEventListener("scroll", measure, true); root.removeAttribute("data-s02-layout"); root.removeAttribute("data-s02-short"); root.style.removeProperty("--s02-strip-h"); }
      if (lifecycle.cleanup) lifecycle.cleanup(dispose);
      return dispose;
    }
    function stuck(bubble) { return getComputedStyle(bubble).position === "sticky"; }
    /* bring an element fully into view, between the stuck bubble (narrow stage) or the screen top, and the sticky strip */
    function reveal(el, bubble, strip) {
      var root = el.closest(".cb"); if (!root) return;
      var v = view(root), r = el.getBoundingClientRect(), t = r.top - v.top, b = r.bottom - v.top,
        topPad = stuck(bubble) ? 12 + bubble.offsetHeight + 14 : 12, limit = v.h - strip.getBoundingClientRect().height - 24, d = 0;
      if (t < topPad) d = t - topPad;
      else if (b > limit) d = Math.min(b - limit, t - topPad);
      if (Math.abs(d) > 4) v.el.scrollBy({ top: d, behavior: reduced() ? "auto" : "smooth" });
    }
    /* a new worry: the stage top comes into view (header, the worry and the first rows), and on a narrow stage the page
       scrolls just far enough that the worry bubble clears the sticky question strip */
    function frameWorry(sceneEl, bubble, strip) {
      var root = bubble.closest(".cb"); if (!root) return api.frame();
      var v = view(root), top = v.fs ? 0 : root.getBoundingClientRect().top - v.top + v.y, to = top;
      if (stuck(bubble)) {                                              // measure where the bubble sits in the flow, not where it is stuck
        var porch = sceneEl.querySelector(".cb-s02-porch"), bt = porch.getBoundingClientRect().bottom - v.top + v.y + 12, bb = bt + bubble.offsetHeight,
          room = v.h - strip.getBoundingClientRect().height - 24;
        to = Math.min(Math.max(top, bb - room), bt - 12);
      }
      if (Math.abs(to - v.y) > 4) v.el.scrollTo({ top: to, behavior: reduced() ? "auto" : "smooth" });
    }
    /* whatever scrolls the game: the play view's scrollport, the stage in full screen, or the page */
    function view(root) {
      var port = api.scrollport ? api.scrollport() : root && root.classList.contains("is-fs") ? root : null;
      return port ? { fs: port === root, el: port, y: port.scrollTop, top: port.getBoundingClientRect().top, h: port.clientHeight }
        : { fs: false, el: window, y: window.pageYOffset, top: 0, h: window.innerHeight };
    }

    /* ── score card ── */
    function finish() {
      screenKey = "result";
      var score = answers.reduce(function (s, a) { return s + a.pts; }, 0);
      var tip = answers.some(function (a) { return !a.r.tOk; }) ? T.tipTopic
        : answers.some(function (a) { return !a.r.sOk; }) ? T.tipWill
        : answers.some(function (a) { return !a.r.dOk; }) ? T.tipDetail : T.tip100;
      var info = api.saveRound(stop.id, score, { lastRound: round.map(function (w) { return w.id; }), lastOrder: round.map(function (w) { return w.nb; }) });
      api.endPlay();
      var list = h("div", { "class": "cb-s02-asked" + (score >= 90 ? " is-3" : ""), "data-cb-novoice": "" }, [h("ul", null, answers.map(function (a, i) {
        return h("li", null, [sticker(false), api.img(speakers[i].img, "", "cb-s02-asked__face"), h("q", { text: a.q })]);
      }))]);
      var gu = api.btn(T.gu, "cb-btn--quiet", function () { api.dialog(T.gu, [h("p", { text: T.guText })], gu); }, "family");
      var card = api.scoreCard(stop, score, info, tip, T.can, T.real, list);
      api.finishRound(stop.id, card, api.cardButtons(stop.id, api.restart(stop.id), gu));
      api.say(api.W.score + " " + score + " / 100");
    }

    intro();
  }

  CB.register({ id: ID, steps: [null, null, null, null], css: "02-ask-a-good-question.css", run: run });

    return definition;
  }
  if (host.defineStop) host.defineStop(factory);
  else host.register(factory({ document: document, window: window, Date: Date, setTimeout: setTimeout, clearTimeout: clearTimeout, requestAnimationFrame: requestAnimationFrame, cancelAnimationFrame: typeof cancelAnimationFrame === "function" ? cancelAnimationFrame : function () {} }));
})();
