/* Community Builders · Stop 3 · lazy module with the shared lifecycle and replay adapter. */
(function(){
  "use strict";
  var host=window.CommunityBuilders;if(!host)return;
  function factory(lifecycle){
    var window=lifecycle.window, document=lifecycle.document, Date=lifecycle.Date, setTimeout=lifecycle.setTimeout, clearTimeout=lifecycle.clearTimeout, requestAnimationFrame=lifecycle.requestAnimationFrame, cancelAnimationFrame=lifecycle.cancelAnimationFrame;
    var L=(document.documentElement.lang||"en").slice(0,2)==="es"?"es":"en";
  var SETS = {
    A: {
      lee: [window.CBLocale.pair("stop-03","bank.b0001"), "roads",
        window.CBLocale.pair("stop-03","bank.b0002"), "land"],
      johnson: [window.CBLocale.pair("stop-03","bank.b0003"), "future",
        window.CBLocale.pair("stop-03","bank.b0004"), "land"],
      ana: [window.CBLocale.pair("stop-03","bank.b0005"), "jobs",
        window.CBLocale.pair("stop-03","bank.b0006"), "jobs"],
      ruth: [window.CBLocale.pair("stop-03","bank.b0007"), ["jobs", "future"],
        window.CBLocale.pair("stop-03","bank.b0008"), "land"],
      patel: [window.CBLocale.pair("stop-03","bank.b0009"), "jobs",
        window.CBLocale.pair("stop-03","bank.b0010"), "roads"],
      jayden: [window.CBLocale.pair("stop-03","bank.b0011"), "future",
        window.CBLocale.pair("stop-03","bank.b0012"), "future"]
    },
    B: {
      lee: [window.CBLocale.pair("stop-03","bank.b0013"), null,
        window.CBLocale.pair("stop-03","bank.b0014"), "nights"],
      johnson: [window.CBLocale.pair("stop-03","bank.b0015"), "places",
        window.CBLocale.pair("stop-03","bank.b0016"), "water"],
      ana: [window.CBLocale.pair("stop-03","bank.b0017"), null,
        window.CBLocale.pair("stop-03","bank.b0018"), "water"],
      ruth: [window.CBLocale.pair("stop-03","bank.b0019"), "places",
        window.CBLocale.pair("stop-03","bank.b0020"), "costs"],
      patel: [window.CBLocale.pair("stop-03","bank.b0021"), null,
        window.CBLocale.pair("stop-03","bank.b0022"), "costs"],
      jayden: [window.CBLocale.pair("stop-03","bank.b0023"), "places",
        window.CBLocale.pair("stop-03","bank.b0024"), "nights"]
    }
  };
  var WISH = {
    land: window.CBLocale.pair("stop-03","bank.b0025"), jobs: window.CBLocale.pair("stop-03","bank.b0026"),
    roads: window.CBLocale.pair("stop-03","bank.b0027"), future: window.CBLocale.pair("stop-03","bank.b0028"),
    water: window.CBLocale.pair("stop-03","bank.b0029"), nights: window.CBLocale.pair("stop-03","bank.b0030"),
    costs: window.CBLocale.pair("stop-03","bank.b0031"), places: window.CBLocale.pair("stop-03","bank.b0032")
  };
  var WISHES = { A: ["land", "jobs", "roads", "future"], B: ["water", "nights", "costs", "places"] };
  /* the slot hint for each wish still to find: one or two words, so the player knows what to look for in the hopes and worries */
  var WHINT = {
    land: window.CBLocale.pair("stop-03","bank.b0033"), jobs: window.CBLocale.pair("stop-03","bank.b0034"), roads: window.CBLocale.pair("stop-03","bank.b0035"), future: window.CBLocale.pair("stop-03","bank.b0036"),
    water: window.CBLocale.pair("stop-03","bank.b0037"), nights: window.CBLocale.pair("stop-03","bank.b0038"), costs: window.CBLocale.pair("stop-03","bank.b0039"), places: window.CBLocale.pair("stop-03","bank.b0040")
  };
  function t2(pair) { return L === "es" ? pair[1] : pair[0]; }

  var S3 = {en:window.CBLocale.read("stop-03", "en", {en:{"T.found":function (n) { return window.CBLocale.part("stop-03", "en", "T.found", 0) + n + window.CBLocale.part("stop-03", "en", "T.found", 1); },"T.line":function (n) { return window.CBLocale.part("stop-03", "en", "T.line", 0) + n + window.CBLocale.part("stop-03", "en", "T.line", 1); },"T.right":function (n) { return window.CBLocale.part("stop-03", "en", "T.right", 0) + n + window.CBLocale.part("stop-03", "en", "T.right", 1); },"T.wrong":function (n) { return window.CBLocale.part("stop-03", "en", "T.wrong", 0) + n + window.CBLocale.part("stop-03", "en", "T.wrong", 1); },"T.tipSkip":function (n) { return window.CBLocale.part("stop-03", "en", "T.tipSkip", 0) + n + window.CBLocale.part("stop-03", "en", "T.tipSkip", 1); },"T.listenedN":function (n) { return n + window.CBLocale.part("stop-03", "en", "T.listenedN", 0); }},es:{"T.found":function (n) { return window.CBLocale.part("stop-03", "es", "T.found", 0) + n + window.CBLocale.part("stop-03", "es", "T.found", 1); },"T.line":function (n) { return window.CBLocale.part("stop-03", "es", "T.line", 0) + n + window.CBLocale.part("stop-03", "es", "T.line", 1); },"T.right":function (n) { return window.CBLocale.part("stop-03", "es", "T.right", 0) + n + window.CBLocale.part("stop-03", "es", "T.right", 1); },"T.wrong":function (n) { return window.CBLocale.part("stop-03", "es", "T.wrong", 0) + n + window.CBLocale.part("stop-03", "es", "T.wrong", 1); },"T.tipSkip":function (n) { return (window.CBLocale.part("stop-03", "es", "T.tipSkip", 0) + n + window.CBLocale.part("stop-03", "es", "T.tipSkip", 1)).replace(window.CBLocale.part("stop-03", "es", "T.tipSkip", 2), window.CBLocale.part("stop-03", "es", "T.tipSkip", 3)); },"T.listenedN":function (n) { return n + window.CBLocale.part("stop-03", "es", "T.listenedN", 0); }}}).T,es:window.CBLocale.read("stop-03", "es", {en:{"T.found":function (n) { return window.CBLocale.part("stop-03", "en", "T.found", 0) + n + window.CBLocale.part("stop-03", "en", "T.found", 1); },"T.line":function (n) { return window.CBLocale.part("stop-03", "en", "T.line", 0) + n + window.CBLocale.part("stop-03", "en", "T.line", 1); },"T.right":function (n) { return window.CBLocale.part("stop-03", "en", "T.right", 0) + n + window.CBLocale.part("stop-03", "en", "T.right", 1); },"T.wrong":function (n) { return window.CBLocale.part("stop-03", "en", "T.wrong", 0) + n + window.CBLocale.part("stop-03", "en", "T.wrong", 1); },"T.tipSkip":function (n) { return window.CBLocale.part("stop-03", "en", "T.tipSkip", 0) + n + window.CBLocale.part("stop-03", "en", "T.tipSkip", 1); },"T.listenedN":function (n) { return n + window.CBLocale.part("stop-03", "en", "T.listenedN", 0); }},es:{"T.found":function (n) { return window.CBLocale.part("stop-03", "es", "T.found", 0) + n + window.CBLocale.part("stop-03", "es", "T.found", 1); },"T.line":function (n) { return window.CBLocale.part("stop-03", "es", "T.line", 0) + n + window.CBLocale.part("stop-03", "es", "T.line", 1); },"T.right":function (n) { return window.CBLocale.part("stop-03", "es", "T.right", 0) + n + window.CBLocale.part("stop-03", "es", "T.right", 1); },"T.wrong":function (n) { return window.CBLocale.part("stop-03", "es", "T.wrong", 0) + n + window.CBLocale.part("stop-03", "es", "T.wrong", 1); },"T.tipSkip":function (n) { return (window.CBLocale.part("stop-03", "es", "T.tipSkip", 0) + n + window.CBLocale.part("stop-03", "es", "T.tipSkip", 1)).replace(window.CBLocale.part("stop-03", "es", "T.tipSkip", 2), window.CBLocale.part("stop-03", "es", "T.tipSkip", 3)); },"T.listenedN":function (n) { return n + window.CBLocale.part("stop-03", "es", "T.listenedN", 0); }}}).T};
  var S3_WORDS = S3; S3 = S3_WORDS[L];


    return {id:"listen-to-every-neighbor",steps:window.CBLocale.read("core",L).X.parts3,css:"03-listen-to-every-neighbor.css",run:function(api,stop){
      var L=api.L,W=api.W,X=api.X,STOPS=api.STOPS,NB=api.NB,h=api.h,ico=api.ico,img=api.img,story=api.story,btn=api.btn,shuffle=api.shuffle,pick=api.pick,rec=api.rec,setTitle=api.setTitle,stopHud=api.stopHud,nm=api.nm,nmCap=api.nmCap,t2=api.t2,nbById=api.nbById,dialog=api.dialog,screen=api.screen,coach=api.coach,frame=api.frame,say=api.say,fb=api.fb,saveRound=api.saveRound,scoreCard=api.scoreCard,finishRound=api.finishRound,cardButtons=api.cardButtons,BASKET_ICON=api.BASKET_ICON,rng=api.rng,team=api.team();
  function stop3() {
    var stop = STOPS[2], r = rec(stop.id);
    var set = team && team.phase === "B" && team.setA ? (team.setA === "A" ? "B" : "A") : (r && r.lastSet ? (r.lastSet === "A" ? "B" : "A") : ((typeof rng === "function" ? rng() : Math.random()) < 0.5 ? "A" : "B"));
    if (team && team.phase === "A") team.setA = set;
    var lines = SETS[set], listened = {}, found = {}, unplanned = 0, right = 0, picked = null, foundPairs = [], pairOf = {}, lastWish = null;
    var phase = "listen", neighborDialog = null, pairMessage = null, pairOK = false, qs = null, qi = 0, quizAnswer = null;
    setTitle(stop.name);
    function hud(i) { return stopHud(stop, X.parts3, i, W.part(i + 1)); }

    function pin(n) {
      var done = !!listened[n.id];
      return h("button", { type: "button", "class": "cb-nbr" + (done ? " is-done" : ""), "data-nb": n.id, "aria-label": nmCap(n) + ", " + n.plain[L] + (done ? ", " + S3.listened : "") }, [
        h("span", { "class": "cb-nbr__face" }, [img(n.img, ""), done ? h("span", { "class": "cb-badge" }, [ico("check")]) : null]),
        h("span", { "class": "cb-nbr__plate" }, [h("b", { text: nmCap(n) }), h("small", { text: n.plain[L] })])
      ]);
    }
    function openNeighbor(n, b) {
      neighborDialog = n.id;
      var ln = lines[n.id];
      dialog(nmCap(n), [h("div", { "class": "cb-say" }, [
        h("div", { "class": "cb-say__b" }, [h("span", { "class": "cb-say__k" }, [ico("sun"), S3.hope]), h("p", { text: t2(ln[0]) })]),
        h("div", { "class": "cb-say__b cb-say__b--worry" }, [h("span", { "class": "cb-say__k" }, [ico("cloud"), S3.worry]), h("p", { text: t2(ln[2]) })])])],
      b, function () {
        neighborDialog = null;
        if (!listened[n.id]) { listened[n.id] = 1; say(S3.listenedN(Object.keys(listened).length)); part1(n.id); }
      }, { face: n.img, sub: n.role[L] });
    }
    function part1(focusId) {
      phase = "listen";
      var nL = Object.keys(listened).length;
      var sc = h("div", { "class": "cb-scene" }, [img("town-map", "", "cb-scene__art", true)]);
      sc.appendChild(h("ul", { "class": "cb-nbrs" }, NB.map(function (n) {
        var b = pin(n); b.addEventListener("click", function () { openNeighbor(n, b); });
        var li = h("li", null, [b]); li.style.left = n.pos[0] + "%"; li.style.top = n.pos[1] + "%";
        return li;
      })));
      var faces = h("ul", { "class": "cb-faces", "aria-hidden": "true" }, NB.map(function (n) { return h("li", { "class": listened[n.id] ? "is-on" : null }, [img(n.img, "")]); }));
      screen([hud(0), h("div", { "class": "cb-board cb-s3-listen" }, [coach(S3.p1, "ear"), sc,
        h("div", { "class": "cb-actions" }, [h("div", { "class": "cb-actions__info" }, [faces, h("p", { "class": "cb-msg", text: S3.listenedN(nL) })]),
          btn(W.next, "cb-btn--go cb-btn--big", function () { part2(); }, "go", true)])])],
      focusId ? '[data-nb="' + focusId + '"]' : null);
      if (!focusId) frame();
    }
    function tap(n) {
      if (!picked) { picked = n.id; return part2(S3.picked, false, n.id); }
      if (picked === n.id) { picked = null; return part2(null, false, n.id); }
      function tagList(tag) { return !tag ? [] : Array.isArray(tag) ? tag.slice() : [tag]; }
      function tagsOf(line) { return tagList(line[1]).concat(tagList(line[3])); }
      var A = lines[picked], B = lines[n.id], tagsA = tagsOf(A), tagsB = tagsOf(B), shared = tagsA.filter(function (t, i) { return tagsB.indexOf(t) !== -1 && tagsA.indexOf(t) === i; });
      var pair = [picked, n.id]; picked = null;
      if (!shared.length) { unplanned++; return part2(S3.noplan, false, n.id); }
      var fresh = shared.filter(function (t) { return !found[t]; });
      if (!fresh.length) return part2(S3.already, false, n.id);
      found[fresh[0]] = 1; foundPairs.push(pair); pairOf[fresh[0]] = pair; lastWish = fresh[0];
      var m = S3.shared + " " + t2(WISH[fresh[0]]);
      if (Object.keys(found).length === 4) m += ". " + S3.all;
      part2(m, true, n.id);
    }
    function part2(msg, ok, focusId) {
      phase = "pairs"; pairOK = !!ok;
      pairMessage = msg === S3.picked ? "picked" : msg === S3.noplan ? "noplan" : msg === S3.already ? "already" : ok ? "shared" : null;
      var keys = Object.keys(found), nFound = keys.length;
      /* one slot per wish of this set: a found wish shows its pair and words; one still to find shows a short hint */
      var slots = h("ol", { "class": "cb-wishslots", "aria-label": S3.found(nFound) }, WISHES[set].map(function (k) {
        if (!found[k]) return h("li", { "aria-hidden": "true" }, [h("span", { "class": "cb-wishslots__q", text: "?" }), h("span", { "class": "cb-wishslots__hint", text: t2(WHINT[k]) })]);
        var p = pairOf[k], A = nbById(p[0]), B = nbById(p[1]);
        return h("li", { "class": "is-on" + (ok && k === lastWish ? " is-new" : "") }, [h("span", { "class": "cb-duo", "aria-hidden": "true" }, [img(A.img, ""), img(B.img, "")]), h("span", { text: t2(WISH[k]) })]);
      }));
      var grid = h("ul", { "class": "cb-notebook" }, NB.map(function (n) {
        var ln = lines[n.id], on = picked === n.id;
        var b = h("button", { type: "button", "class": "cb-note" + (on ? " is-picked" : ""), "data-nb": n.id, "aria-pressed": on ? "true" : "false" }, [
          h("span", { "class": "cb-note__head" }, [img(n.img, ""), h("span", null, [h("b", { text: nmCap(n) }), h("small", { text: n.plain[L] })]),
            on ? h("span", { "class": "cb-note__picked", "aria-hidden": "true" }, [ico("check")]) : null]),
          h("span", { "class": "cb-note__line cb-note__line--hope" }, [ico("sun"), h("span", null, [h("b", { "class": "cb-note__k", text: S3.hope }), " " + t2(ln[0])])]),
          h("span", { "class": "cb-note__line cb-note__line--worry" }, [ico("cloud"), h("span", null, [h("b", { "class": "cb-note__k", text: S3.worry }), " " + t2(ln[2])])])
        ]);
        b.addEventListener("click", function () { tap(n); });
        return h("li", null, [b]);
      }));
      screen([hud(1), h("div", { "class": "cb-board" }, [coach(S3.p2, "people"), h("p", { "class": "cb-wishslots__k", "aria-hidden": "true", text: S3.toFind }), slots,
        nFound === 4 ? h("p", { "class": "cb-unity" }, [img("unity", ""), h("strong", { text: S3.all })]) : null,
        grid,
        h("div", { "class": "cb-actions" }, [h("div", { "class": "cb-actions__info" }, [msg ? fb(msg, ok) : null, h("p", { "class": "cb-msg", role: "status", text: S3.found(nFound) })]),
          btn(nFound === 4 ? W.next : S3.done, "cb-btn--go cb-btn--big", function () { part3(); }, "go", true)])])],
      focusId ? '[data-nb="' + focusId + '"]' : null);
      if (!msg && !focusId) frame();
      if (msg) say(msg);
    }
    function part3() {
      phase = "quiz";
      pairMessage = null; pairOK = false;
      if (!qs) {
      var pool = [];
      NB.forEach(function (n) { pool.push([n, lines[n.id][0]]); pool.push([n, lines[n.id][2]]); });
      qs = shuffle(pool).slice(0, 4); qi = 0;
      qs.forEach(function (q) { q.order = shuffle(NB); });          // the six faces keep their places while you answer
      }
      function ask(feedback, chosen, ok) {
        quizAnswer = chosen ? { chosen: chosen, ok: !!ok } : null;
        if (qi >= 4) return finish();
        var q = qs[qi], answered = !!feedback;
        var grid = h("ul", { "class": "cb-pick" }, q.order.map(function (n) {
          var isRight = answered && n.id === q[0].id, mine = answered && chosen === n.id && !isRight;
          var b = h("button", { type: "button", "class": "cb-face-btn" + (isRight ? " is-right" : "") + (mine ? " is-chosen" : ""), disabled: answered || null, "aria-label": nmCap(n) }, [
            h("span", { "class": "cb-face-btn__img" }, [img(n.img, ""), isRight ? h("span", { "class": "cb-badge" }, [ico("check")]) : null]),
            h("b", { text: nmCap(n) }), h("small", { text: n.plain[L] })]);
          b.addEventListener("click", function () {
            var good = n.id === q[0].id; if (good) right++;
            ask(good ? S3.right(nm(q[0])) : S3.wrong(nm(q[0])), n.id, good);
          });
          return h("li", null, [b]);
        }));
        var nextQ = btn(W.next, "cb-btn--go cb-btn--big", function () { qi++; ask(); }, "go", true);
        screen([hud(2), h("div", { "class": "cb-board" }, [coach(S3.p3t + " " + S3.p3, "people"),
          h("div", { "class": "cb-quoteblock", "data-cb-novoice": "" }, [h("p", { "class": "cb-linecount", text: S3.line(qi + 1) }), h("blockquote", { "class": "cb-bubble" }, [h("p", { text: t2(q[1]) })])]),
          grid,
          feedback ? h("div", { "class": "cb-actions" }, [h("div", { "class": "cb-actions__info" }, [fb(feedback, ok)]), nextQ]) : null])]);
        if (feedback) { say(feedback); nextQ.focus(); } else frame();
      }
      ask(quizAnswer ? (quizAnswer.ok ? S3.right(nm(qs[qi][0])) : S3.wrong(nm(qs[qi][0]))) : null, quizAnswer && quizAnswer.chosen, quizAnswer && quizAnswer.ok);
    }
    function finish() {
      phase = "result";
      var nL = Object.keys(listened).length, nW = Object.keys(found).length;
      var p2 = Math.max(0, 6 * nW - 2 * Math.max(0, unplanned - 3));
      var score = 6 * nL + p2 + 10 * right;
      var skipped = NB.filter(function (n) { return !listened[n.id]; })[0];
      var tip = skipped ? S3.tipSkip(nm(skipped)) : unplanned > 3 ? S3.tipPairs : nW < 4 ? S3.tipWish : right < 4 ? S3.tipLine : S3.tip100;
      var info = saveRound(stop.id, score, { lastSet: set, allListened: nL === 6, processBadge: nL === 6 ? "process-3" : null });
      api.endPlay();
      var card = scoreCard(stop, score, info, tip, S3.can, S3.real);
      finishRound(stop.id, card, cardButtons(stop.id, api.restart(stop.id)));
      say(W.score + " " + score + " / 100");
    }
    if (api.setController) api.setController({
      snapshot: function () { return { v: 2, phase: phase, set: set, listened: Object.keys(listened), found: Object.keys(found), unplanned: unplanned, right: right, picked: picked, foundPairs: foundPairs, pairOf: pairOf, lastWish: lastWish, neighbor: neighborDialog, pairMessage: pairMessage, pairOK: pairOK, qi: qi, answer: quizAnswer,
        quiz: qs && qs.map(function (q) { return { nb: q[0].id, line: lines[q[0].id][0] === q[1] ? 0 : 2, order: q.order.map(function(n) { return n.id; }) }; }) }; },
      restore: function (saved) {
        if (!saved || saved.v !== 2 || !SETS[saved.set]) return false;
        set = saved.set; lines = SETS[set]; listened = {}; found = {};
        saved.listened.forEach(function (id) { listened[id] = 1; }); saved.found.forEach(function (id) { found[id] = 1; });
        unplanned = saved.unplanned; right = saved.right; picked = saved.picked; foundPairs = saved.foundPairs; pairOf = saved.pairOf; lastWish = saved.lastWish; qi = saved.qi; quizAnswer = saved.answer;
        qs = saved.quiz && saved.quiz.map(function (q) { var item = [nbById(q.nb), lines[q.nb][q.line]]; item.order = q.order.map(nbById); return item; });
        if (saved.phase === "result") finish();
        else if (saved.phase === "quiz") part3();
        else if (saved.phase === "pairs") {
          var message = saved.pairMessage === "shared" ? S3.shared + " " + t2(WISH[lastWish]) + (Object.keys(found).length === 4 ? ". " + S3.all : "") : saved.pairMessage ? S3[saved.pairMessage] : null;
          part2(message, saved.pairOK);
        } else { part1(); if (saved.neighbor) openNeighbor(nbById(saved.neighbor), document.querySelector('[data-nb="'+saved.neighbor+'"]')); }
        return true;
      }
    });
    part1();
  }


      stop3();
    }};
  }
  if(host.defineStop)host.defineStop(factory);else host.register(factory({window:window,document:document,Date:Date,setTimeout:setTimeout,clearTimeout:clearTimeout,requestAnimationFrame:requestAnimationFrame,cancelAnimationFrame:typeof cancelAnimationFrame==="function"?cancelAnimationFrame:function(){}}));
})();
