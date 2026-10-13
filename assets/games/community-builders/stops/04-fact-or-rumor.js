/* Community Builders · Stop 4 · lazy module with the shared lifecycle and replay adapter. */
(function(){
  "use strict";
  var host=window.CommunityBuilders;if(!host)return;
  function factory(lifecycle){
    var window=lifecycle.window, document=lifecycle.document, Date=lifecycle.Date, setTimeout=lifecycle.setTimeout, clearTimeout=lifecycle.clearTimeout, requestAnimationFrame=lifecycle.requestAnimationFrame, cancelAnimationFrame=lifecycle.cancelAnimationFrame;
    var L=(document.documentElement.lang||"en").slice(0,2)==="es"?"es":"en";
  /* Stop 4 storybook things (the flyer on its board, the family chat on a phone): see .cb-story in cb.css */
  var S4ART = {
    flyer: '<ellipse class="sh" cx="32" cy="59.5" rx="16" ry="2.4"/><rect class="wd" x="29" y="40" width="6" height="19.5" rx="1"/><rect class="wd" x="8" y="6" width="48" height="38" rx="3"/>' +
      '<rect class="n crk" x="12" y="10" width="40" height="30" rx="1.5"/><path class="yl" d="M20 12.5l23-1.5 1.6 25.5-23 1.5z"/><path class="hd" d="M24.4 16.4l9-.6"/>' +
      '<path class="ln" d="M24.7 21.4l15-1M25 26.4l15-1M25.3 31.4l10-.7"/><circle class="rd" cx="32" cy="12.6" r="2.2"/>',
    chat: '<ellipse class="sh" cx="32" cy="59.5" rx="14" ry="2.4"/><rect class="ink" x="17" y="4" width="30" height="54" rx="5"/><rect class="n wh" x="20" y="10" width="24" height="40" rx="1.5"/>' +
      '<path class="bl" d="M22.5 14h13a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-9l-3 2.5V22h-1a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2z"/>' +
      '<path class="gr" d="M41.5 27h-13a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h9l3 2.5V35h1a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2z"/>' +
      '<path class="yl" d="M22.5 40h11a2 2 0 0 1 2 2v2.5a2 2 0 0 1-2 2h-8l-3 2.2v-2.2a2 2 0 0 1-2-2V42a2 2 0 0 1 2-2z"/><circle class="n mt" cx="32" cy="54" r="1.6"/>'
  };
  var S4 = {en:window.CBLocale.read("stop-04", "en", {en:{"T.claim":function (n) { return window.CBLocale.part("stop-04", "en", "T.claim", 0) + n + window.CBLocale.part("stop-04", "en", "T.claim", 1); },"T.put":function (b) { return window.CBLocale.part("stop-04", "en", "T.put", 0) + b; },"T.notQuite":function (h) { return window.CBLocale.part("stop-04", "en", "T.notQuite", 0) + h; },"T.sorted":function (n) { return window.CBLocale.part("stop-04", "en", "T.sorted", 0) + n + window.CBLocale.part("stop-04", "en", "T.sorted", 1); },"T.at":function (n) { return n + window.CBLocale.part("stop-04", "en", "T.at", 0); },"T.tipNb":function (n) { return window.CBLocale.part("stop-04", "en", "T.tipNb", 0) + n + window.CBLocale.part("stop-04", "en", "T.tipNb", 1); }},es:{"T.claim":function (n) { return window.CBLocale.part("stop-04", "es", "T.claim", 0) + n + window.CBLocale.part("stop-04", "es", "T.claim", 1); },"T.put":function (b) { return window.CBLocale.part("stop-04", "es", "T.put", 0) + b; },"T.notQuite":function (h) { return window.CBLocale.part("stop-04", "es", "T.notQuite", 0) + h; },"T.sorted":function (n) { return window.CBLocale.part("stop-04", "es", "T.sorted", 0) + n + window.CBLocale.part("stop-04", "es", "T.sorted", 1); },"T.at":function (n) { return n + window.CBLocale.part("stop-04", "es", "T.at", 0); },"T.tipNb":function (n) { return window.CBLocale.part("stop-04", "es", "T.tipNb", 0) + n + window.CBLocale.part("stop-04", "es", "T.tipNb", 1); }}}).T,es:window.CBLocale.read("stop-04", "es", {en:{"T.claim":function (n) { return window.CBLocale.part("stop-04", "en", "T.claim", 0) + n + window.CBLocale.part("stop-04", "en", "T.claim", 1); },"T.put":function (b) { return window.CBLocale.part("stop-04", "en", "T.put", 0) + b; },"T.notQuite":function (h) { return window.CBLocale.part("stop-04", "en", "T.notQuite", 0) + h; },"T.sorted":function (n) { return window.CBLocale.part("stop-04", "en", "T.sorted", 0) + n + window.CBLocale.part("stop-04", "en", "T.sorted", 1); },"T.at":function (n) { return n + window.CBLocale.part("stop-04", "en", "T.at", 0); },"T.tipNb":function (n) { return window.CBLocale.part("stop-04", "en", "T.tipNb", 0) + n + window.CBLocale.part("stop-04", "en", "T.tipNb", 1); }},es:{"T.claim":function (n) { return window.CBLocale.part("stop-04", "es", "T.claim", 0) + n + window.CBLocale.part("stop-04", "es", "T.claim", 1); },"T.put":function (b) { return window.CBLocale.part("stop-04", "es", "T.put", 0) + b; },"T.notQuite":function (h) { return window.CBLocale.part("stop-04", "es", "T.notQuite", 0) + h; },"T.sorted":function (n) { return window.CBLocale.part("stop-04", "es", "T.sorted", 0) + n + window.CBLocale.part("stop-04", "es", "T.sorted", 1); },"T.at":function (n) { return n + window.CBLocale.part("stop-04", "es", "T.at", 0); },"T.tipNb":function (n) { return window.CBLocale.part("stop-04", "es", "T.tipNb", 0) + n + window.CBLocale.part("stop-04", "es", "T.tipNb", 1); }}}).T};
  var S4_WORDS = S4; S4 = S4_WORDS[L];
  var SRC = {
    plan: [window.CBLocale.pair("stop-04","bank.b0001"), window.CBLocale.pair("stop-04","bank.b0002")],
    air: [window.CBLocale.pair("stop-04","bank.b0003"), window.CBLocale.pair("stop-04","bank.b0004")],
    sound: [window.CBLocale.pair("stop-04","bank.b0005"), window.CBLocale.pair("stop-04","bank.b0006")],
    tax: [window.CBLocale.pair("stop-04","bank.b0007"), window.CBLocale.pair("stop-04","bank.b0008")]
  };
  var RUMOR_HOW = [window.CBLocale.pair("stop-04","bank.b0009"), window.CBLocale.pair("stop-04","bank.b0010"),
    window.CBLocale.pair("stop-04","bank.b0011"), window.CBLocale.pair("stop-04","bank.b0012")];
  var RUMOR_WHEN = window.CBLocale.pair("stop-04","bank.b0013");
  /* [right basket, voice, source, en, es] */
  var CLAIMS = [
    [].concat(["rumor","hopeful",null],window.CBLocale.pair("stop-04","bank.b0014")),
    [].concat(["rumor","worried",null],window.CBLocale.pair("stop-04","bank.b0015")),
    [].concat(["fact",null,"plan"],window.CBLocale.pair("stop-04","bank.b0016")),
    [].concat(["rumor","hopeful",null],window.CBLocale.pair("stop-04","bank.b0017")),
    [].concat(["rumor","worried",null],window.CBLocale.pair("stop-04","bank.b0018")),
    [].concat(["fact",null,"plan"],window.CBLocale.pair("stop-04","bank.b0019")),
    [].concat(["rumor","worried",null],window.CBLocale.pair("stop-04","bank.b0020")),
    [].concat(["rumor","hopeful",null],window.CBLocale.pair("stop-04","bank.b0021")),
    [].concat(["rumor","worried",null],window.CBLocale.pair("stop-04","bank.b0022")),
    [].concat(["fact",null,"plan"],window.CBLocale.pair("stop-04","bank.b0023")),
    [].concat(["rumor","hopeful",null],window.CBLocale.pair("stop-04","bank.b0024")),
    [].concat(["dontknow","hopeful","tax"],window.CBLocale.pair("stop-04","bank.b0025")),
    [].concat(["dontknow","hopeful","sound"],window.CBLocale.pair("stop-04","bank.b0026")),
    [].concat(["dontknow","worried","sound"],window.CBLocale.pair("stop-04","bank.b0027")),
    [].concat(["dontknow","worried","air"],window.CBLocale.pair("stop-04","bank.b0028"))
  ];


    return {id:"fact-or-rumor",steps:[null,null,null,null,null],css:"04-fact-or-rumor.css",run:function(api,stop){
      var L=api.L,W=api.W,X=api.X,STOPS=api.STOPS,NB=api.NB,h=api.h,ico=api.ico,img=api.img,story=api.story,btn=api.btn,shuffle=api.shuffle,pick=api.pick,rec=api.rec,setTitle=api.setTitle,stopHud=api.stopHud,nm=api.nm,nmCap=api.nmCap,t2=api.t2,nbById=api.nbById,dialog=api.dialog,screen=api.screen,coach=api.coach,frame=api.frame,say=api.say,fb=api.fb,saveRound=api.saveRound,scoreCard=api.scoreCard,finishRound=api.finishRound,cardButtons=api.cardButtons,BASKET_ICON=api.BASKET_ICON,rng=api.rng,team=api.team();
  function stop4() {
    var stop = STOPS[3], r = rec(stop.id);
    setTitle(stop.name);
    var PATEL = nbById("patel");
    function bakery(c) {        // painted Main Street from the town map, Mr. Patel at his bakery door
      var w = h("div", { "class": "cb-art" }, [img("town-map", "", "cb-art__map", true),
        h("span", { "class": "cb-art__host", "aria-hidden": "true" }, [img(PATEL.img, ""), h("span", null, [h("b", { text: nmCap(PATEL) }), h("small", { text: PATEL.plain[L] })])])]);
      /* who said it, on the painting: a neighbor's painted portrait, or a storybook flyer board or phone with its name tag */
      if (c) w.appendChild(c.who ? h("span", { "class": "cb-art__src", "aria-hidden": "true" }, [img(c.who.img, "")])
        : h("span", { "class": "cb-art__src cb-art__src--thing", "aria-hidden": "true" }, [h("span", { "class": "cb-story-obj" }, [story(S4ART[c.kind === "flyer" ? "flyer" : "chat"])]),
          h("span", { "class": "cb-story-tag", text: c.kind === "flyer" ? S4.flyerTag : S4.chatTag })]));
      return w;
    }
    function draw() {
      var hop = [0, 3, 7, 10], wor = [1, 4, 6, 8], fac = [2, 5, 9], dk = [11, 12, 13, 14], prev = r && r.lastClaims ? r.lastClaims.join(",") : "";
      for (var tries = 0; tries < 30; tries++) {
        var c = [pick(hop), pick(wor), pick(fac), pick(dk)];
        var rest = [].concat(hop, wor, fac, dk).filter(function (x) { return c.indexOf(x) === -1; });
        c.push(pick(rest));
        if (c.slice().sort(function (a, b) { return a - b; }).join(",") !== prev) return shuffle(c);
      }
      return shuffle(c);
    }
    var ids = draw(), kinds = shuffle(["neighbor", "flyer", "chat", pick(["neighbor", "flyer", "chat"]), pick(["neighbor", "flyer", "chat"])]);
    var nbs = shuffle(NB), nbi = 0, hows = shuffle(RUMOR_HOW), hi = 0;
    var round = ids.map(function (id, i) {
      var c = CLAIMS[id], kind = kinds[i], who = kind === "neighbor" ? nbs[nbi++] : null, how, when;
      if (c[0] === "rumor") { how = hows[hi++ % 4]; when = RUMOR_WHEN; } else { how = SRC[c[2]][0]; when = SRC[c[2]][1]; }
      return { id: id, right: c[0], text: L === "es" ? c[4] : c[3], kind: kind, who: who, how: t2(how), when: t2(when), peeked: false, sorted: null };
    });
    var ci = 0, DOTS = [null, null, null, null, null], phase = "intro";
    function whoLine(c) { return c.kind === "neighbor" ? S4.at(nmCap(c.who)) : c.kind === "flyer" ? S4.flyer : S4.chat; }
    function basketIcon(k, cls) { var s = h("span", { "class": cls || "cb-basket__ic", "aria-hidden": "true" }); host.setAuthoredMarkup(s, BASKET_ICON[k]); return s; }

    function startScreen() {
      phase = "intro";
      var kindsEl = h("ul", { "class": "cb-kinds" }, ["fact", "rumor", "dontknow"].map(function (k) { return h("li", { "data-k": k }, [basketIcon(k), h("span", { text: S4.b[k] })]); }));
      screen([stopHud(stop, null), h("div", { "class": "cb-board" }, [h("div", { "class": "cb-bakery" }, [bakery(null), h("div", { "class": "cb-intro" }, [
        h("p", { "class": "cb-intro__lead", text: S4.intro }), kindsEl,
        h("div", { "class": "cb-row" }, [btn(S4.start, "cb-btn--go cb-btn--big", function () { play(); }, "go", true)])])])])]);
      frame();
    }
    function play(feedback, ok) {
      phase = "play";
      var c = round[ci], done = !!c.sorted;
      if (done && !feedback) { ok = c.sorted === c.right; feedback = ok ? S4.ok[c.sorted] : S4.notQuite(c.how) + " " + S4.ok[c.right].replace(/^(Yes!|¡Sí!)\s*/, ""); }
      var from = h("p", { "class": "cb-claim__from" }, [c.who ? img(c.who.img, "") : ico(c.kind === "flyer" ? "flyer" : "chat"), h("span", { text: whoLine(c) })]);
      var peekBox = h("div", { "class": "cb-source", id: "cb-peek", hidden: !(c.peeked || done) || null }, [h("dl", null, [
        h("dt", { text: S4.whoT }), h("dd", { text: whoLine(c) }), h("dt", { text: S4.howT }), h("dd", { text: c.how }), h("dt", { text: S4.whenT }), h("dd", { text: c.when })])]);
      if (CLAIMS[c.id][2] === "plan") peekBox.appendChild(h("section", { "class": "cb-source-excerpt", "aria-label": S4.sourceExcerptTitle }, [
        h("h3", { text: S4.sourceExcerptTitle }), h("p", { text: S4.sourceFiction }),
        h("blockquote", null, S4.planExcerpt.map(function (line) { return h("p", { text: line }); }))
      ]));
      var peekBtn = btn(S4.peek, "cb-peekbtn", function () { if (!c.sorted) c.peeked = true; peekBox.hidden = false; peekBtn.setAttribute("aria-expanded", "true"); }, "peek");
      peekBtn.setAttribute("aria-expanded", (c.peeked || done) ? "true" : "false"); peekBtn.setAttribute("aria-controls", "cb-peek");
      var baskets = h("div", { "class": "cb-baskets" }, ["fact", "rumor", "dontknow"].map(function (k) {
        var isR = done && c.right === k, mine = done && c.sorted === k && !isR;
        var b = h("button", { type: "button", "class": "cb-basket" + (isR ? " is-right" : "") + (mine ? " is-chosen" : ""), "data-k": k, "aria-label": S4.put(S4.b[k]), disabled: done ? true : null,
          onclick: function () {
            if (c.sorted) return;
            c.sorted = k;
            var good = k === c.right;
            play(good ? S4.ok[k] : S4.notQuite(c.how) + " " + S4.ok[c.right].replace(/^(Yes!|¡Sí!)\s*/, ""), good);
          } }, [basketIcon(k), h("span", { text: S4.b[k] }), isR ? h("span", { "class": "cb-basket__stamp", "aria-hidden": "true" }, [ico("check")]) : null]);
        return b;
      }));
      var nextBtn = btn(S4.nextClaim, "cb-btn--go cb-btn--big", function () { ci++; if (ci >= 5) finish(); else play(); }, "go", true);
      screen([stopHud(stop, DOTS, ci, S4.claim(ci + 1)), h("div", { "class": "cb-board" }, [
        done ? null : coach(S4.how, "peek"),                            // the task, in words, until this claim is sorted
        h("div", { "class": "cb-bakery cb-bakery--play" }, [bakery(c), h("div", { "class": "cb-claim" }, [
          h("p", { "class": "cb-vh", text: S4.claim(ci + 1) }), from,
          h("blockquote", { "class": "cb-bubble cb-bubble--claim" }, [h("p", { "class": "cb-claim__text", text: c.text })]),
          h("div", { "class": "cb-row" }, [peekBtn]), peekBox])]),
        baskets,
        done ? h("div", { "class": "cb-actions" }, [h("div", { "class": "cb-actions__info" }, [fb(feedback, ok)]), nextBtn]) : null])]);
      if (feedback) { say(feedback + " " + S4.sorted(ci + 1)); nextBtn.focus(); } else frame();
    }
    function finish() {
      phase = "result";
      var score = round.reduce(function (s, c) { return s + (c.peeked ? 6 : 0) + (c.sorted === c.right ? 14 : 0); }, 0);
      var noPeekNb = round.filter(function (c) { return !c.peeked && c.who; })[0], noPeek = round.some(function (c) { return !c.peeked; });
      var miss = function (k) { return round.some(function (c) { return c.right === k && c.sorted !== k; }); };
      var tip = noPeekNb ? S4.tipNb(nm(noPeekNb.who)) : noPeek ? S4.tipPeek : miss("rumor") ? S4.tipRumor : miss("dontknow") ? S4.tipDk : miss("fact") ? S4.tipFact : S4.tip100;
      var info = saveRound(stop.id, score, { lastClaims: ids.slice().sort(function (a, b) { return a - b; }), allSources: !noPeek, processBadge: !noPeek ? "process-4" : null });
      api.endPlay();
      var list = h("div", { "class": "cb-your5" }, [h("strong", { text: S4.your5 }), h("ul", null, round.map(function (c) {
        return h("li", { "data-k": c.right }, [basketIcon(c.right, "cb-your5__ic"), h("q", { text: c.text }), h("span", { "class": "cb-your5__k", text: S4.b[c.right] })]);
      }))]);
      var gu = btn(S4.gu, "cb-btn--quiet", function () { dialog(S4.gu, [h("p", { text: S4.guText })], gu); }, "family");
      var card = scoreCard(stop, score, info, tip, S4.can, S4.real, list);
      finishRound(stop.id, card, cardButtons(stop.id, api.restart(stop.id), gu));
      say(W.score + " " + score + " / 100");
    }
    if (api.setController) api.setController({
      snapshot: function () { return { v: 2, phase: phase, ci: ci, round: round.map(function(c) { return { id:c.id, kind:c.kind, who:c.who && c.who.id, how:c.right === "rumor" ? RUMOR_HOW.findIndex(function(pair){return t2(pair) === c.how;}) : null, peeked:c.peeked, sorted:c.sorted }; }) }; },
      restore: function (saved) {
        if (!saved || saved.v !== 2 || !Array.isArray(saved.round) || saved.round.length !== 5) return false;
        ci = saved.ci; ids = saved.round.map(function(value){return value.id;});
        round = saved.round.map(function(value) { var c=CLAIMS[value.id], how=c[0] === "rumor" ? RUMOR_HOW[value.how] : SRC[c[2]][0]; return {id:value.id,right:c[0],text:L === "es" ? c[4] : c[3],kind:value.kind,who:value.who ? nbById(value.who) : null,how:t2(how),when:t2(c[0] === "rumor" ? RUMOR_WHEN : SRC[c[2]][1]),peeked:!!value.peeked,sorted:value.sorted}; });
        if (saved.phase === "result") finish(); else if(saved.phase === "play") play(); else startScreen();
        return true;
      }
    });
    startScreen();
  }


      stop4();
    }};
  }
  if(host.defineStop)host.defineStop(factory);else host.register(factory({window:window,document:document,Date:Date,setTimeout:setTimeout,clearTimeout:clearTimeout,requestAnimationFrame:requestAnimationFrame,cancelAnimationFrame:typeof cancelAnimationFrame==="function"?cancelAnimationFrame:function(){}}));
})();
