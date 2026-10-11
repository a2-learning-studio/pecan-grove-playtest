/* Community Builders of Pecan Grove · Stop 2 · Ask a Good Question / Haz una buena pregunta
   Skill: turn a worry into a clear, open, specific question someone can actually answer.
   Words, worries, tiles, frames, rubric and tips come word for word from "02 - ask-a-good-question.md".
   Points reward the question only (topic +10, open start +8, fitting detail +7, per worry): never a side, never speed.
   After an answer that has tips, "Fix my question" brings the tiles back with the tips and the tile to try marked, so a tip is
   always something the player can act on. Only the first try of each worry counts for points; a fixed question replaces the
   words on the board and the score card, never the score. */
/* Scene: the clock-tower building of the painted town map stands in for the library porch; no text inputs, no network. */
(function () {
  "use strict";
  var CB = window.CommunityBuilders; if (!CB) return;
  var L = (document.documentElement.lang || "en").slice(0, 2) === "es" ? "es" : "en";
  var I = L === "es" ? 1 : 0;                       // index into every [en, es] pair below
  var ID = "ask-a-good-question";

  /* ── words (exact, from the spec) ─────────────────────────────────── */
  var T = {
    en: {
      intro1: "The neighbors are going to the Planning Board meeting. Help them turn each worry into a clear question.",
      ex: [["'Will it be big?'", " just gets a 'yes'."], ["'How much water will it use on the hottest day?'", " gets an answer you can use."]],
      start: "Let's start", coach: "Tap one tile in each row. Then tap Ask it.", ask: "Ask it", over: "Start over", yourQ: "Your question:",
      coachFor: function (n) { return "Turn " + n + "'s worry into a clear question. Tap one tile in each row, then tap Ask it."; },
      boardK: function (n) { return "Your questions for the Planning Board: " + n + " of 4"; }, slotNow: "Your question goes here when you tap Ask it.",
      rows: { start: "1. Start: how you ask", topic: "2. Topic: what it's about", detail: "3. Detail: when or where" },
      worryN: function (n) { return "Worry " + n + " of 4"; },
      ans3: "I can really use that answer. Thank you!", ans12: "That helps! It can be even clearer:", ans0: "Thanks for trying! Here's how to fix it:",
      topicOk: "Topic: yes, that's my worry.", topicNo: function (t) { return "Topic: my worry is about " + t + "."; },
      startOk: "Start: it's open, so I'll get a real answer.", startWill: "Start: 'Will...' just gets a yes or a no. Try How much, When, Who or What happens if.",
      detOk: "Detail: now it's specific.", detNone: "Detail: add when or where to make it specific.",
      detNo: function (d) { return "Detail: that one doesn't fit my worry. Try '" + d + "'."; },
      next: "Next worry", see: "See my score",
      fix: "Fix my question", fixCoach: "Use the tips to change your question. The tile with the dashed ring is one to try. Then tap Ask it.",
      can: "I can turn a worry into a clear question.",
      tipTopic: "Next time, read the worry again and pick its topic.", tipWill: "Next time, start with How much, When, Who or What happens if.",
      tipDetail: "Next time, add a detail that fits: when or where.", tip100: "Great questions! Try a new round.",
      real: "Write one good question about your town on paper. Ask a grown-up to help you find who could answer it.",
      gu: "Ask a grown-up",
      guText: "Open, specific questions ('How much water on the hottest, driest day, and from where?') get more useful answers than yes/no ones. The hub's '30 questions to ask' list has more examples you can take to a public meeting."
    },
    es: {
      intro1: "Los vecinos van a ir a la reunión de la Junta de Planificación. Ayúdalos a convertir cada preocupación en una pregunta clara.",
      ex: [["'¿Va a ser grande?'", " solo recibe un 'sí'."], ["'¿Cuánta agua va a usar en el día más caluroso?'", " recibe una respuesta que te sirve."]],
      start: "¡Empecemos!", coach: "Toca una ficha en cada fila. Luego toca Pregúntalo.", ask: "Pregúntalo", over: "Volver a empezar", yourQ: "Tu pregunta:",
      coachFor: function (n) { return ("Convierte la preocupación de " + n + " en una pregunta clara. Toca una ficha en cada fila y luego toca Pregúntalo.").replace(" de el ", " del "); },
      boardK: function (n) { return "Tus preguntas para la Junta de Planificación: " + n + " de 4"; }, slotNow: "Tu pregunta va aquí cuando tocas Pregúntalo.",
      rows: { start: "1. Inicio: cómo preguntas", topic: "2. Tema: de qué se trata", detail: "3. Detalle: cuándo o dónde" },
      worryN: function (n) { return "Preocupación " + n + " de 4"; },
      ans3: "Esa respuesta de verdad me sirve. ¡Gracias!", ans12: "¡Eso ayuda! Puede ser todavía más clara:", ans0: "¡Gracias por intentarlo! Así la puedes arreglar:",
      topicOk: "Tema: sí, eso es lo que me preocupa.", topicNo: function (t) { return "Tema: mi preocupación tiene que ver con " + t + "."; },
      startOk: "Inicio: es abierta, así que me darán una respuesta de verdad.", startWill: "Inicio: '¿Va a...?' solo recibe un sí o un no. Prueba con ¿Cuánto?, ¿Cuándo?, ¿Quién? o ¿Qué pasa si?",
      detOk: "Detalle: ahora es concreta.", detNone: "Detalle: agrega cuándo o dónde para que sea concreta.",
      detNo: function (d) { return "Detalle: ese no va con mi preocupación. Prueba con '" + d + "'."; },
      next: "Siguiente preocupación", see: "Ver mi puntaje",
      fix: "Arreglar mi pregunta", fixCoach: "Usa los consejos para cambiar tu pregunta. La ficha con el borde punteado es una para probar. Luego toca Pregúntalo.",
      can: "Puedo convertir una preocupación en una pregunta clara.",
      tipTopic: "La próxima vez, vuelve a leer la preocupación y elige su tema.", tipWill: "La próxima vez, empieza con ¿Cuánto?, ¿Cuándo?, ¿Quién? o ¿Qué pasa si?",
      tipDetail: "La próxima vez, agrega un detalle que vaya con la preocupación: cuándo o dónde.", tip100: "¡Muy buenas preguntas! Prueba una nueva ronda.",
      real: "Escribe en papel una buena pregunta sobre tu pueblo. Pídele a un adulto que te ayude a encontrar quién podría responderla.",
      gu: "Pregúntale a un adulto",
      guText: "Las preguntas abiertas y concretas ('¿Cuánta agua en el día más caluroso y seco, y de dónde?') reciben respuestas más útiles que las de sí o no. La lista de '30 preguntas para hacer' del sitio tiene más ejemplos para llevar a una reunión pública."
    }
  }[L];

  /* tiles: [id, en, es]; topics also carry the fixed "How much" opening [en, es] */
  var START = [["how", "How much...", "¿Cuánto...?"], ["when", "When...", "¿Cuándo...?"], ["who", "Who...", "¿Quién...?"],
    ["whatif", "What happens if...", "¿Qué pasa si...?"], ["will", "Will...", "¿Va a...?"]];
  var TOPIC = [
    ["water", "the water", "el agua", "How much water will it use", "¿Cuánta agua va a usar"],
    ["trucks", "the trucks", "los camiones", "How many trucks will there be", "¿Cuántos camiones va a haber"],
    ["noise", "the noise and lights at night", "el ruido y las luces de noche", "How much noise and light will there be at night", "¿Cuánto ruido y luz va a haber de noche"],
    ["jobs", "the jobs", "los empleos", "How many jobs will there be", "¿Cuántos empleos va a haber"],
    ["bills", "power bills and rent", "el recibo de luz y la renta", "How much will power bills and rent go up", "¿Cuánto van a subir el recibo de luz y la renta"],
    ["graves", "the old graves", "las tumbas antiguas", "How much land will they check for old graves", "¿Cuánto terreno van a revisar para buscar tumbas antiguas"],
    ["engines", "the backup engines", "los motores de respaldo", "How much smoke will the backup engines make", "¿Cuánto humo van a echar los motores de respaldo"]
  ];
  var DETAIL = [["d1", "on the hottest day", "en el día más caluroso"], ["d2", "after it opens", "después de que abra"], ["d3", "for people who live here", "para la gente de aquí"],
    ["d4", "near the school", "cerca de la escuela"], ["d5", "before digging", "antes de excavar"], ["d6", "on Main Street", "en la calle principal"]];
  var POOL = { start: START, topic: TOPIC, detail: DETAIL };
  /* the question is built from fixed frames, never by joining tiles; {d} is " detail" or nothing */
  var FRAME = {
    when: ["When will we know more about {t}{d}?", "¿Cuándo vamos a saber más sobre {t}{d}?"],
    who: ["Who will check {t}{d}?", "¿Quién va a revisar {t}{d}?"],
    whatif: ["What happens if there is a problem with {t}{d}?", "¿Qué pasa si hay un problema con {t}{d}?"],
    will: ["Will everything be OK with {t}{d}?", "¿Va a estar todo bien con {t}{d}?"]
  };

  /* the 12 Stop 3 worries, word for word: [id, neighbor, set, topic, details that fit, [en, es]] */
  var WORRIES = [
    ["A-lee", "lee", "A", "engines", ["d2", "d4"], ["I worry the big backup engines could make smoky air. I want to know how often they run.", "Me preocupa que los grandes motores de respaldo echen humo. Quiero saber cada cuánto los prenden."]],
    ["A-johnson", "johnson", "A", "water", ["d3", "d5"], ["I worry mud could reach the creek and my well.", "Me preocupa que el lodo llegue al arroyo y a mi pozo."]],
    ["A-ana", "ana", "A", "jobs", ["d2", "d3"], ["I worry the jobs will end when the building is done.", "Me preocupa que los empleos se acaben cuando terminen de construir."]],
    ["A-ruth", "ruth", "A", "graves", ["d5"], ["I worry old graves could be hidden on the farm. I want someone to look before digging.", "Me preocupa que haya tumbas antiguas escondidas en la granja. Quiero que alguien las busque antes de excavar."]],
    ["A-patel", "patel", "A", "trucks", ["d4", "d6"], ["I worry big trucks will crowd Main Street for months.", "Me preocupa que los camiones grandes llenen la calle principal por meses."]],
    ["A-jayden", "jayden", "A", "jobs", ["d2", "d3"], ["I worry young people will move away to find work.", "Me preocupa que los jóvenes se vayan a buscar trabajo a otro lado."]],
    ["B-lee", "lee", "B", "noise", ["d2", "d3"], ["I worry bright lights all night could shine into bedrooms.", "Me preocupa que las luces fuertes toda la noche alumbren los cuartos."]],
    ["B-johnson", "johnson", "B", "water", ["d5"], ["I worry no one will test my well before they dig.", "Me preocupa que nadie revise mi pozo antes de excavar."]],
    ["B-ana", "ana", "B", "water", ["d3", "d5"], ["I worry the creek could get muddy. I fish there with my kids.", "Me preocupa que el arroyo se llene de lodo. Ahí pesco con mis hijos."]],
    ["B-ruth", "ruth", "B", "bills", ["d2", "d3"], ["I worry my power bill will go up.", "Me preocupa que suba mi recibo de luz."]],
    ["B-patel", "patel", "B", "bills", ["d3", "d6"], ["I worry the rent for my shop will go up while they build.", "Me preocupa que suba la renta de mi local mientras construyen."]],
    ["B-jayden", "jayden", "B", "noise", ["d2", "d3"], ["I worry a hum at night could keep my little sister awake.", "Me preocupa que un zumbido de noche no deje dormir a mi hermanita."]]
  ].map(function (w) { return { id: w[0], nb: w[1], set: w[2], topic: w[3], d: w[4], text: w[5][I] }; });

  /* the Pecan Sticker (spec: "a pecan-shaped sticker" on each asked question): a storybook pecan, see .cb-story in cb.css */
  var PECAN_ART = '<g transform="rotate(38 32 32)"><path class="wd" d="M32 5c9.5 5.5 14 15 14 26.5S41.5 52 32 59c-9.5-7-14-16-14-27.5S22.5 10.5 32 5z"/>' +
    '<path class="n wdd" d="M32 9c6.5 5 10 13.5 10 22.5s-3.5 18-10 23.5z"/><path class="ln" d="M32 10v45M25 20c2 6 2 16 0 24M39 20c-2 6-2 16 0 24"/>' +
    '<path class="n hl" d="M25 15c1.5-2.4 3.5-4.4 5.6-5.6-1.2 2.6-2 5.4-2.4 8.4z"/></g>';
  var CROP = { scene: [0.335, 0.2, 0.665, 0.53], centred: [0.335, 0.26, 0.665, 0.59] };   // the clock-tower building and its wide steps

  function word(pool, id) { var t = pool.filter(function (x) { return x[0] === id; })[0]; return t ? t[1 + I] : ""; }
  function question(s, t, d) {
    if (!s) return "";
    if (!t) return word(START, s);                                       // only Start picked: show the Start tile words
    var dd = d ? " " + word(DETAIL, d) : "";
    if (s === "how") return TOPIC.filter(function (x) { return x[0] === t; })[0][3 + I] + dd + "?";
    return FRAME[s][I].replace("{t}", word(TOPIC, t)).replace("{d}", dd);
  }
  function judge(w, a) {
    var tOk = a.topic === w.topic, sOk = a.start !== "will", dOk = !!a.detail && w.d.indexOf(a.detail) !== -1, good = tOk + sOk + dOk;
    return {
      pts: (tOk ? 10 : 0) + (sOk ? 8 : 0) + (dOk ? 7 : 0), tOk: tOk, sOk: sOk, dOk: dOk,
      line: good === 3 ? T.ans3 : good ? T.ans12 : T.ans0,
      notes: [[tOk, tOk ? T.topicOk : T.topicNo(word(TOPIC, w.topic))], [sOk, sOk ? T.startOk : T.startWill],
        [dOk, dOk ? T.detOk : !a.detail ? T.detNone : T.detNo(word(DETAIL, w.d[0]))]]
    };
  }

  function run(api, stop) {
    var h = api.h, REDUCED = api.REDUCED, rec = api.rec(stop.id), team = api.team();
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
    var answers = [], wi = 0, sel = null;

    function sticker(empty) { return h("span", { "class": "cb-s02-sticker" + (empty ? " is-empty" : ""), "aria-hidden": "true" }, [h("span", { "class": "cb-story-obj" }, [api.story(PECAN_ART)])]); }

    /* ── the scene: the painted library with this round's four neighbors on its steps ── */
    function scene(cur, answered, withBubble) {
      var porch = h("ul", { "class": "cb-s02-porch", "aria-hidden": "true" }, speakers.map(function (n, i) {
        var s = cur < 0 ? "wait" : i < cur ? "done" : i === cur ? "now" : "wait";
        return h("li", { "class": "cb-s02-nb", "data-s": s, "data-i": String(i) }, [
          h("span", { "class": "cb-s02-nb__face" }, [api.img(n.img, "", null, true), s === "done" || (s === "now" && answered) ? h("span", { "class": "cb-badge" }, [api.ico("check")]) : null]),
          h("span", { "class": "cb-s02-nb__name", text: api.nmCap(n) })]);
      }));
      var kids = withBubble
        ? [api.crop(CROP.scene, "cb-s02-art cb-s02-art--wide"), api.crop(CROP.centred, "cb-s02-art cb-s02-art--narrow"), porch]
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
      return h("section", { "class": "cb-s02-boardwrap", "aria-labelledby": bid }, [h("p", { "class": "cb-s02-board__k", id: bid, text: T.boardK(answers.length) }),
        h("ol", { "class": "cb-s02-board" }, [0, 1, 2, 3].map(function (i) {
          var a = answers[i], now = i === wi && !a;
          if (!a) return h("li", { "class": "is-empty" + (now ? " is-now" : ""), "aria-hidden": "true" }, [sticker(true), now ? h("p", { "class": "cb-s02-board__hint", text: T.slotNow }) : h("span"), api.img(speakers[i].img, "", "cb-s02-board__face", true)]);
          return h("li", { "class": fresh && i === answers.length - 1 ? "is-new" : null }, [sticker(false), h("p", { text: a.q }), api.img(speakers[i].img, "", "cb-s02-board__face", true)]);
        }))]);
    }

    /* ── intro ── */
    function intro() {
      var ex = h("p", { "class": "cb-s02-ex" }, [exLine(0), " ", exLine(1)]);
      var go = api.btn(T.start, "cb-btn--go cb-btn--big", function () { worry(); }, "go", true);
      api.screen([api.stopHud(stop, null), h("div", { "class": "cb-board" }, [h("div", { "class": "cb-s02-intro" }, [
        scene(-1, false, false),
        h("div", { "class": "cb-s02-intro__copy" }, [h("p", { "class": "cb-s02-intro__lead", text: T.intro1 }), ex, h("div", { "class": "cb-row" }, [go])])])])]);
      /* the shell frames the stage top; on a phone the intro is taller than the screen, so go one step further
         (never past the stage top) until "Let's start" is in view too */
      var root = go.closest(".cb"); if (!root) return api.frame();
      var v = view(root), r = root.getBoundingClientRect(), top = v.fs ? 0 : r.top - v.top + v.y,
        pad = v.fs ? 0 : parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0,
        framed = (v.fs ? v.y > 4 : r.top < -4) ? Math.max(0, top - pad) : v.y,
        to = Math.min(top, Math.max(framed, go.getBoundingClientRect().bottom - v.top + v.y - v.h + 20));
      if (Math.abs(to - framed) <= 4) api.frame();
      else v.el.scrollTo({ top: to, behavior: REDUCED ? "auto" : "smooth" });
    }
    function exLine(i) { var p = T.ex[i]; return h("span", { "class": "cb-s02-ex__line" }, [api.ico(i ? "check" : "chat"), h("span", null, [h("b", { text: p[0] }), p[1]])]); }

    /* ── one worry: tiles in, question on the strip, then the neighbor answers ── */
    function worry(again) {
      var prev = again ? answers[wi] : null, lastR = prev ? (prev.fixed || prev.r) : null;
      sel = prev ? { start: prev.start, topic: prev.topic, detail: prev.detail } : { start: null, topic: null, detail: null };
      var hint = { start: null, topic: null, detail: null };
      if (lastR) {
        if (!lastR.tOk) hint.topic = round[wi].topic;
        if (!lastR.dOk) hint.detail = round[wi].d[0];
      }
      var born = Date.now(), fresh = function () { return Date.now() - born < 300; };   // the second half of a double tap on the last screen's button
      var lineEl = h("p", { "class": "cb-s02-q__line is-empty", id: "cb-s02-q" });
      var overBtn = api.btn(T.over, "cb-btn--quiet", function () { if (overBtn.getAttribute("aria-disabled") === "true") return; sel = { start: null, topic: null, detail: null }; refresh(); }, "replay");
      var askBtn = api.btn(T.ask, "cb-btn--go cb-btn--big cb-s02-ask", function () { if (!fresh()) ask(); }, "chat");
      askBtn.setAttribute("aria-describedby", "cb-s02-q");
      var strip = h("div", { "class": "cb-actions cb-s02-strip" }, [h("span", { "class": "cb-s02-q__k", text: T.yourQ }), lineEl, askBtn]);
      var rows = ["start", "topic", "detail"].map(function (row) {
        var lid = "cb-s02-r" + (++uid);
        var tiles = h("div", { "class": "cb-s02-tiles" }, orders[wi][row].map(function (id) {
          return h("button", { type: "button", "class": "cb-s02-tile" + (hint[row] === id ? " is-hint" : ""), "aria-pressed": "false", "data-row": row, "data-id": id, onclick: function () { if (!fresh()) pick(row, id); } }, [
            h("span", { text: word(POOL[row], id) }), h("span", { "class": "cb-s02-tile__ck", "aria-hidden": "true" }, [api.ico("check")])]);
        }));
        var fixRow = lastR && (row === "start" ? !lastR.sOk : row === "topic" ? !lastR.tOk : !lastR.dOk);
        return h("div", { "class": "cb-s02-row" + (fixRow ? " is-needed" : ""), role: "group", "aria-labelledby": lid, "data-row": row }, [
          h("p", { "class": "cb-s02-row__k", id: lid }, [h("i", { "aria-hidden": "true" }), h("span", { text: T.rows[row] })]), tiles]);
      });
      var tray = h("div", { "class": "cb-s02-tray" }, rows.concat([h("div", { "class": "cb-s02-tray__foot" }, [overBtn])]));
      var coachEl = api.coach(lastR ? T.fixCoach : T.coachFor(api.nm(speakers[wi])), "chat");    // the instruction names whose worry it is
      if (lastR) {                                                      // fixing: the neighbor's tips stay in view above the tiles
        var tips = h("ul", { "class": "cb-s02-notes cb-s02-tips" }, lastR.notes.filter(function (x) { return !x[0]; }).map(function (x) {
          return h("li", null, [api.ico("bulb"), h("span", { text: x[1] })]); }));
        coachEl = h("div", { "class": "cb-s02-fixhead" }, [coachEl, tips]);
      }
      var work = h("div", { "class": "cb-s02-work" }, [coachEl, tray]);
      var sceneEl = scene(wi, false, true), board = boardCard(false);
      /* the worry and the board stay in view while the tiles scroll: a sticky side column on a wide stage,
         a sticky speech bubble on a narrow one (CSS) */
      var side = h("div", { "class": "cb-s02-side" }, [sceneEl, board]);
      var playEl = h("div", { "class": "cb-s02-play" }, [side, work]);
      var bubble = sceneEl.querySelector('[data-s02="worry"]');
      refresh();
      api.screen([api.stopHud(stop, DOTS, wi, T.worryN(wi + 1)), h("div", { "class": "cb-board" }, [playEl, strip])], '[data-s02="worry"]');
      stickRoom(playEl, bubble);
      frameWorry(sceneEl, bubble, strip);

      function refresh() {
        [].forEach.call(tray.querySelectorAll(".cb-s02-tile"), function (b) {
          b.setAttribute("aria-pressed", sel[b.getAttribute("data-row")] === b.getAttribute("data-id") ? "true" : "false");
        });
        var q = question(sel.start, sel.topic, sel.detail);
        lineEl.textContent = q; lineEl.classList.toggle("is-empty", !q);
        askBtn.setAttribute("aria-disabled", sel.start && sel.topic ? "false" : "true");
        overBtn.setAttribute("aria-disabled", sel.start || sel.topic || sel.detail ? "false" : "true");
        return q;
      }
      function pick(row, id) {
        sel[row] = sel[row] === id ? null : id;                           // one tile per row; tap again to unpick
        rows.forEach(function (r) { if (r.getAttribute("data-row") === row) r.classList.remove("is-needed"); });
        var q = refresh();
        if (q) api.say(q);                                                // the live area reads the question as it changes
      }
      function ask() {
        if (!sel.start || !sel.topic) {                                   // "Ask it" works once Start and Topic are picked
          rows.forEach(function (r) { var k = r.getAttribute("data-row"); r.classList.toggle("is-needed", k !== "detail" && !sel[k]); });
          var need = tray.querySelector(".cb-s02-row.is-needed");
          if (need) need.scrollIntoView({ block: "nearest", behavior: REDUCED ? "auto" : "smooth" });   // show the row that still needs a tile
          api.say(T.coachFor(api.nm(speakers[wi]))); return;
        }
        var w = round[wi], n = speakers[wi], a = { w: w.id, start: sel.start, topic: sel.topic, detail: sel.detail };
        a.q = question(a.start, a.topic, a.detail);
        var r = judge(w, a), first = answers[wi];
        if (first) {                                                      // a fixed question: new words and a new answer, same points
          first.q = a.q; first.start = a.start; first.topic = a.topic; first.detail = a.detail; first.fixed = r;
        } else { a.pts = r.pts; a.r = r; answers.push(a); }
        var talk = h("div", { "class": "cb-s02-talk", role: "group", "aria-label": api.nmCap(n), tabindex: "-1", "data-s02": "answer" }, [
          h("p", { "class": "cb-s02-you", text: a.q }),
          h("div", { "class": "cb-s02-reply" }, [api.img(n.img, "", "cb-s02-reply__face", true), h("p", { "class": "cb-s02-reply__line", text: r.line }),
            h("ul", { "class": "cb-s02-notes" }, r.notes.map(function (x) { return h("li", { "class": x[0] ? "is-ok" : null }, [api.ico(x[0] ? "check" : "bulb"), h("span", { text: x[1] })]); }))])]);
        work.replaceChild(talk, tray); work.removeChild(coachEl);          // one idea at a time: the tiles and their instruction make way for the answer
        var newBoard = boardCard(!first); side.replaceChild(newBoard, board); board = newBoard;
        var face = sceneEl.querySelector('.cb-s02-nb[data-i="' + wi + '"] .cb-s02-nb__face');
        if (face && !face.querySelector(".cb-badge")) face.appendChild(h("span", { "class": "cb-badge" }, [api.ico("check")]));
        var asked = Date.now(), last = wi === 3;
        var nextBtn = api.btn(last ? T.see : T.next, "cb-btn--go cb-btn--big", function () {
          if (Date.now() - asked < 400) return;                           // a double tap on "Ask it" never skips the neighbor's answer
          wi++; if (wi < 4) worry(); else finish();
        }, "go", true);
        var fixBtn = r.tOk && r.sOk && r.dOk ? null : api.btn(T.fix, "cb-btn--quiet cb-btn--big", function () {
          if (Date.now() - asked < 400) return;
          worry(true);
        }, "replay");
        var strip2 = h("div", { "class": "cb-actions cb-s02-strip is-done" }, [fixBtn, nextBtn]);
        strip.parentNode.replaceChild(strip2, strip);
        talk.focus({ preventScroll: true });                              // after Ask it, focus moves to the answer
        reveal(talk, bubble, strip2);
        api.say(r.line + " " + r.notes.map(function (x) { return x[1]; }).join(" "));   // the answer and notes, never points
      }
    }

    /* how much of the screen top the stuck speech bubble covers (narrow stage only), for scroll margins */
    function stickRoom(playEl, bubble) {
      function set() { if (bubble.isConnected) playEl.style.setProperty("--s02-stick", (bubble.offsetHeight + 12) + "px"); }
      set();
      if (window.ResizeObserver) { var ro = new ResizeObserver(function () { if (!bubble.isConnected) ro.disconnect(); else set(); }); ro.observe(bubble); }
    }
    function stuck(bubble) { return getComputedStyle(bubble).position === "sticky"; }
    /* bring an element fully into view, between the stuck bubble (narrow stage) or the screen top, and the sticky strip */
    function reveal(el, bubble, strip) {
      var root = el.closest(".cb"); if (!root) return;
      var v = view(root), r = el.getBoundingClientRect(), t = r.top - v.top, b = r.bottom - v.top,
        topPad = stuck(bubble) ? 12 + bubble.offsetHeight + 14 : 12, limit = v.h - strip.getBoundingClientRect().height - 24, d = 0;
      if (t < topPad) d = t - topPad;
      else if (b > limit) d = Math.min(b - limit, t - topPad);
      if (Math.abs(d) > 4) v.el.scrollBy({ top: d, behavior: REDUCED ? "auto" : "smooth" });
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
      if (Math.abs(to - v.y) > 4) v.el.scrollTo({ top: to, behavior: REDUCED ? "auto" : "smooth" });
    }
    /* the page scrolls, except in the shell's full screen, where the stage itself is the scroller */
    function view(root) {
      var fs = !!root && root.classList.contains("is-fs");
      return fs ? { fs: true, el: root, y: root.scrollTop, top: root.getBoundingClientRect().top, h: root.clientHeight }
        : { fs: false, el: window, y: window.pageYOffset, top: 0, h: window.innerHeight };
    }

    /* ── score card ── */
    function finish() {
      var score = answers.reduce(function (s, a) { return s + a.pts; }, 0);
      var tip = answers.some(function (a) { return !a.r.tOk; }) ? T.tipTopic
        : answers.some(function (a) { return a.start === "will"; }) ? T.tipWill
        : answers.some(function (a) { return !a.r.dOk; }) ? T.tipDetail : T.tip100;
      var info = api.saveRound(stop.id, score, { lastRound: round.map(function (w) { return w.id; }), lastOrder: round.map(function (w) { return w.nb; }) });
      api.endPlay();
      var list = h("div", { "class": "cb-s02-asked" + (score >= 90 ? " is-3" : "") }, [h("ul", null, answers.map(function (a, i) {
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
})();
