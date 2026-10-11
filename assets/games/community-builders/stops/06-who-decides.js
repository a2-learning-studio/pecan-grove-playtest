/* Community Builders of Pecan Grove · Stop 6 · Who Decides? / ¿Quién decide?
   Five neighbors bring questions to Town Hall. The player taps the desk that decides each one,
   and learns where people can speak. Score: +20 for the right desk on the first tap, +10 on the
   second, 0 after that. Never a side, an outcome or speed. Words are the spec's, word for word. */
(function () {
  "use strict";
  var CB = window.CommunityBuilders; if (!CB) return;
  var DOTS = [null, null, null, null, null];

  /* authored line icons: 24-unit grid, one 2px round stroke, the same family as the shell's api.IC */
  var ICON = {
    council: '<path d="M3.5 9.5 12 4.5l8.5 5z"/><path d="M6.5 12v5.5M10 12v5.5M14 12v5.5M17.5 12v5.5"/><path d="M4 20.5h16"/>',
    planning: '<rect x="3.5" y="4" width="4" height="13" rx="2"/><path d="M5.5 17v2.5h15V6.5H7.5"/><path d="M11 10h6v6h-6zM14 10v3M11 13h1.5"/>',
    development: '<path d="M8 3.5h8M9 3.5V6c-2.5 1-3.5 3-3.5 5.5v6A2.5 2.5 0 0 0 8 20h8a2.5 2.5 0 0 0 2.5-2.5v-6c0-2.5-1-4.5-3.5-5.5V3.5"/><circle cx="12" cy="14.5" r="2.6"/>',
    regional: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.3 15.3 5.2 5.2"/><path d="M8 13v-2.3l2.5-2 2.5 2V13"/>',
    power: '<path d="M13 3 5.5 13.5H11L10 21l8-11.5h-5.5z"/>',
    environment: '<path d="M5 19.5C5 11 10.5 5 19.5 4.5 19.5 13.5 14 19.5 5 19.5z"/><path d="M5 19.5c3.5-5 7-8 10.5-10"/>',
    family: '<path d="M3.5 11 12 4l8.5 7"/><path d="M5.5 9.5v10.5h13V9.5"/><path d="M12 17.4s-3.3-1.9-3.3-4.1a1.7 1.7 0 0 1 3.3-.8 1.7 1.7 0 0 1 3.3.8c0 2.2-3.3 4.1-3.3 4.1z"/>',
    sign: '<rect x="4" y="4.5" width="16" height="9" rx="2"/><path d="M8 9h8M12 13.5v7M8.5 20.5h7"/>',
    board: '<path d="M5.5 4.5V20M5.5 13h5v7M18.5 4.5V20M18.5 13h-5v7"/>',
    hearing: '<path d="M3 11.5h18M5 11.5V20M19 11.5V20M5 15.5h14M12 11.5V8.5"/><rect x="10.5" y="3.5" width="3" height="5" rx="1.5"/>',
    permits: '<path d="M6 3.5h8l4 4v13H6z"/><path d="M14 3.5v4h4"/><path d="m9 14 2 2 4-4.5"/>',
    decision: '<circle cx="12" cy="12" r="8.5"/><path d="m8.5 12.2 2.5 2.5 4.8-5.2"/>',
    promises: '<path d="M7.5 20.5V5M4.5 20.5h6M3.5 8h17M7.5 5l-4 3M7.5 5l13 3M17.5 8v4.5"/><path d="M17.5 12.5V14a1.5 1.5 0 1 1-1.5 1.5"/>',
    pin: '<path d="M12 21s-6-5.6-6-10.5a6 6 0 0 1 12 0C18 15.4 12 21 12 21z"/><circle cx="12" cy="10.5" r="2.2"/>'
  };

  /* each desk's job in a few words, shown on the desk before any tap, so the first choice is a reading, not a guess.
     The full line still comes in the answer card. */
  var JOB = {
    council: ["Decides what can be built", "Decide qué se puede construir"],
    planning: ["Studies plans and gives advice", "Estudia los planes y da consejos"],
    development: ["Decides on tax breaks", "Decide si pagan menos impuestos"],
    regional: ["Comments for nearby towns", "Opina por los pueblos cercanos"],
    power: ["Sets power prices", "Fija el precio de la luz"],
    environment: ["Gives smoke and water permits", "Da permisos de humo y de agua"],
    family: ["Decides together at home", "Deciden juntos en casa"]
  };
  /* the seven desks: [id, name, line, place (null = a written comment), timeline step it rings] */
  var DESKS = [
    ["council", ["Town Council", "Concejo del pueblo"],
      ["Decides what can be built on land in town, after a public hearing. Neighbors' voices count most here.", "Decide qué se puede construir en cada terreno del pueblo, después de una audiencia pública. Aquí es donde más cuenta la voz de los vecinos."],
      ["the Town Council hearing", "la audiencia del Concejo del pueblo"], "hearing"],
    ["planning", ["Planning Board", "Junta de Planificación"],
      ["Studies the plan first and gives the Town Council advice.", "Estudia el plan primero y le da consejos al Concejo del pueblo."],
      ["the Planning Board meeting", "la reunión de la Junta de Planificación"], "board"],
    ["development", ["Development Board", "Junta de Desarrollo"],
      ["Decides if a new business can pay less tax for some years.", "Decide si un negocio nuevo puede pagar menos impuestos por unos años."], null, null],
    ["regional", ["Regional Review", "Revisión Regional"],
      ["Looks at how a big project could affect nearby towns, and shares comments. It does not decide.", "Revisa cómo un proyecto grande podría afectar a los pueblos cercanos y da su opinión. No decide."], null, null],
    ["power", ["State Power Board", "Junta Estatal de Electricidad"],
      ["Sets the price of power. It does not pick where buildings go.", "Fija el precio de la luz. No elige dónde se construye."], null, null],
    ["environment", ["State Environment Office", "Oficina Estatal del Medio Ambiente"],
      ["Gives permits for smoke from engines and for using lots of water.", "Da permisos para el humo de los motores y para usar mucha agua."], null, "permits"],
    ["family", ["Your family", "Tu familia"],
      ["You decide together at home what you think and what you do.", "En casa deciden juntos qué piensan y qué hacen."],
      ["a family talk at home", "una conversación en familia, en casa"], null]
  ].map(function (d) { return { id: d[0], name: d[1], line: d[2], place: d[3], ring: d[4], job: JOB[d[0]] }; });
  var DESK_IDS = DESKS.map(function (d) { return d.id; });

  /* fourteen questions, two per desk; the right desk is the one with the same id */
  var QS = {
    council: [["Can the old Miller farm be used for a data center?", "¿Se puede usar la vieja granja Miller para un centro de datos?"],
      ["Can the town ask for rules, like quiet nights and a row of trees?", "¿El pueblo puede pedir reglas, como noches tranquilas y una fila de árboles?"]],
    planning: [["Who studies the plan first and gives advice?", "¿Quién estudia el plan primero y da consejos?"],
      ["Who checks if the plan fits our town's land map?", "¿Quién revisa si el plan encaja con el mapa de terrenos del pueblo?"]],
    development: [["Will the company get a tax break?", "¿La empresa va a pagar menos impuestos?"],
      ["Could the company pay less tax if it brings jobs?", "¿La empresa podría pagar menos impuestos si trae empleos?"]],
    regional: [["Will more trucks on the road affect the next town too?", "¿Más camiones en la carretera afectarán también al pueblo vecino?"],
      ["Who looks at how this could change the towns around us?", "¿Quién revisa cómo esto podría cambiar a los pueblos de alrededor?"]],
    power: [["Who sets the price of my power bill?", "¿Quién fija el precio de mi recibo de luz?"],
      ["Who decides what big new buildings pay for power?", "¿Quién decide cuánto pagan por la luz los edificios grandes y nuevos?"]],
    environment: [["Who checks the smoke from the backup engines?", "¿Quién revisa el humo de los motores de respaldo?"],
      ["Who says if they can take lots of water from Pecan River?", "¿Quién dice si pueden sacar mucha agua del río Pecan?"]],
    family: [["Should our family save water this summer?", "¿Nuestra familia debería ahorrar agua este verano?"],
      ["What does our family think about the plan?", "¿Qué piensa nuestra familia sobre el plan?"]]
  };

  /* the timeline on the wall: [id, en, es, people can speak here] */
  var STEPS = [["sign", "Sign", "Letrero", false], ["board", "Board meeting", "Reunión de la junta", true], ["hearing", "Hearing", "Audiencia", true],
    ["permits", "Permits", "Permisos", true], ["decision", "Decision", "Decisión", false], ["promises", "Promises", "Promesas", false]];

  var T = {
    en: {
      hall: "Town Hall",
      intro: "Welcome to Town Hall! The Planning Board met last week. The Town Council hearing is next. Neighbors have questions. Help each one find the right desk.",
      start: "Start",
      qn: function (n) { return "Question " + n + " of 5"; },
      who: "Who can help? Tap the desk that decides this.",
      desk: function (n) { return "Desk: " + n; },
      speakAt: "People can speak at:",
      howK: "How the farm plan gets decided", ringAt: function (st) { return "This desk's step is circled below: " + st + "."; },
      boardPast: "People could speak at the Planning Board meeting. It already happened, so the Town Council hearing is next.",
      written: "a written comment (with a grown-up)",
      yes: "Yes! This desk can help.",
      wrong: "Not this desk. Try another one.",
      tried: "Tried",
      hereIs: "Here is the desk for this question.",
      nextQ: "Next question", finish: "Finish",
      rightDesk: "Right desk", notThis: "Not this desk",
      canSpeak: "People can speak", here: "We are here",
      aha: "Different helpers decide different parts. The Town Council decides what can be built on the farm, after a public hearing. That is where neighbors' voices count most.",
      see: "See my score",
      can: "I can find out who decides, and when people can speak.",
      tipCouncil: "Next time, remember: the Town Council decides what can be built, after a hearing.",
      tipDesk: "Next time, remember this desk:",
      tip100: "Great job finding who decides! Try a new round.",
      real: "Ask a grown-up: 'Who decides big building plans where we live?' Find out together at the library or on your city or county website.",
      gu: "For grown-ups: how it works in Georgia",
      guText: "In Fulton County, each city decides zoning inside its limits after a public hearing, and the county decides in the few unincorporated areas left. If land is already zoned for a use, there may be no hearing. Development authorities decide local tax breaks. Large projects also get a regional review that only gives advice. State bodies handle other parts. The Georgia Public Service Commission sets power rates but does not pick sites. Georgia EPD issues air permits for backup generators and permits for large water use. The game uses made-up boards so it stays clear of elections."
    },
    es: {
      hall: "Ayuntamiento",
      intro: "¡Te damos la bienvenida al Ayuntamiento! La Junta de Planificación ya se reunió. Ahora sigue la audiencia del Concejo del pueblo. Los vecinos tienen preguntas. Ayuda a cada uno a encontrar el escritorio correcto.",
      start: "Empezar",
      qn: function (n) { return "Pregunta " + n + " de 5"; },
      who: "¿Quién puede ayudar? Toca el escritorio que decide esto.",
      desk: function (n) { return "Escritorio: " + n; },
      speakAt: "La gente puede opinar en:",
      howK: "Cómo se decide el plan de la granja", ringAt: function (st) { return "El paso de este escritorio está marcado abajo: " + st + "."; },
      boardPast: "La gente podía opinar en la reunión de la Junta de Planificación. Ya pasó, así que lo que sigue es la audiencia del Concejo del pueblo.",
      written: "un comentario por escrito (con un adulto)",
      yes: "¡Sí! Este escritorio puede ayudar.",
      wrong: "Este escritorio no. Prueba otro.",
      tried: "Ya lo probaste",
      hereIs: "Este es el escritorio para esta pregunta.",
      nextQ: "Siguiente pregunta", finish: "Terminar",
      rightDesk: "Escritorio correcto", notThis: "Este escritorio no",
      canSpeak: "Se puede opinar", here: "Estamos aquí",
      aha: "Cada grupo decide una parte distinta. El Concejo del pueblo decide qué se puede construir en la granja, después de una audiencia pública. Ahí es donde más cuenta la voz de los vecinos.",
      see: "Ver mi puntaje",
      can: "Puedo averiguar quién decide y cuándo se puede opinar.",
      tipCouncil: "La próxima vez, recuerda: el Concejo del pueblo decide qué se puede construir, después de una audiencia.",
      tipDesk: "La próxima vez, recuerda este escritorio:",
      tip100: "¡Muy bien! Encontraste quién decide. Prueba una nueva ronda.",
      real: "Pregúntale a un adulto: '¿Quién decide los grandes proyectos de construcción donde vivimos?' Averigüen juntos en la biblioteca o en el sitio web de su ciudad o condado.",
      gu: "Para adultos: cómo funciona en Georgia",
      guText: "En el condado de Fulton, cada ciudad decide la zonificación dentro de sus límites después de una audiencia pública, y el condado decide en las pocas zonas no incorporadas que quedan. Si el terreno ya tiene la zonificación para ese uso, puede que no haya audiencia. Las autoridades de desarrollo deciden las reducciones de impuestos locales. Los proyectos grandes también pasan por una revisión regional que solo da recomendaciones. Otras partes las manejan agencias estatales: la Comisión de Servicio Público de Georgia fija las tarifas de electricidad pero no elige los sitios, y la EPD de Georgia otorga permisos de aire para los generadores de respaldo y permisos para usar mucha agua. El juego usa juntas inventadas para mantenerse lejos de las elecciones."
    }
  };

  /* painted crop of the clock-tower building on the town map, used as Town Hall */
  var HALL = [0.05, 0.17, 0.385, 0.51];                     // Town Hall: the blue-roofed hall left of the chapel (the clock tower is the school, with the town library)
  var SVGNS = "http://www.w3.org/2000/svg";

  CB.register({ id: "who-decides", steps: DOTS, css: "06-who-decides.css", run: run });

  function run(api, stop) {
    var h = api.h, L = api.L, t = T[L] || T.en;
    function tx(pair) { return L === "es" ? pair[1] : pair[0]; }
    function icon(name, cls) {
      var s = document.createElementNS(SVGNS, "svg");
      s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true"); s.setAttribute("focusable", "false");
      s.setAttribute("class", "cb-ico" + (cls ? " " + cls : ""));
      s.innerHTML = ICON[name];                                   // constant, authored markup only
      return s;
    }
    function deskById(id) { return DESKS.filter(function (d) { return d.id === id; })[0]; }
    function placeOf(d) { return d.place ? tx(d.place) : t.written; }
    function stepName(id) { var st = STEPS.filter(function (x) { return x[0] === id; })[0]; return st ? (L === "es" ? st[2] : st[1]) : ""; }

    /* ── a new random round: one Town Council question plus four other desks, one question each ── */
    var r = api.rec(stop.id), tm = api.team();
    var last = (r && r.lastQs) || [];
    var ban = tm && tm.phase === "B" && tm.s06 ? tm.s06 : [];          // Team 2 gets none of Team 1's questions
    var qDesks = api.shuffle(["council"].concat(api.shuffle(DESK_IDS.slice(1)).slice(0, 4)));
    var ids = qDesks.map(function (d) {
      var opts = [d + "-0", d + "-1"];
      var free = opts.filter(function (q) { return ban.indexOf(q) < 0 && last.indexOf(q) < 0; });
      if (!free.length) free = opts.filter(function (q) { return ban.indexOf(q) < 0; });
      return api.pick(free.length ? free : opts);
    });
    if (tm && tm.phase === "A") tm.s06 = ids.slice();
    var order = DESK_IDS, lastOrder = (r && r.lastDesks) || "";
    for (var k = 0; k < 12; k++) { order = api.shuffle(DESK_IDS); if (order.join(",") !== lastOrder) break; }
    var askers = api.shuffle(api.NB).slice(0, 5);
    var round = ids.map(function (q, i) {
      var p = q.split("-");
      return { q: q, desk: p[0], text: tx(QS[p[0]][+p[1]]), nb: askers[i], tried: [], done: null };
    });
    var qi = 0;
    /* A double tap must count once. When a screen changes under the finger (Start, Next, a wrong tap that
       scrolls its card into view), the second half of the tap would land on whatever moved there, often a desk. */
    var calm = 0;
    function settle() { calm = Date.now() + 400; }
    function settled(e) { return Date.now() >= calm || !(e && e.detail > 0); }   // keyboard clicks (detail 0) are never a double tap

    /* ── shared pieces ── */
    function scene() {
      return api.crop(HALL, "cb-s06-scene", [h("span", { "class": "cb-s06-place" }, [icon("council"), h("span", { text: t.hall })])]);
    }
    function timeline(ring) {
      return h("section", { "class": "cb-s06-timewrap", "aria-label": t.howK }, [h("p", { "class": "cb-s06-time__k", "aria-hidden": "true", text: t.howK }), steps(ring)]);
    }
    function steps(ring) {
      return h("ol", { "class": "cb-s06-time" }, STEPS.map(function (s, i) {
        return h("li", { "class": "cb-s06-step" + (i < 2 ? " is-past" : "") + (ring === s[0] ? " is-ring" : ""), "data-step": s[0] }, [
          s[0] === "hearing" ? h("span", { "class": "cb-s06-here" }, [h("span", { "class": "cb-s06-here__pill" }, [icon("pin"), h("span", { text: t.here })])]) : null,
          h("span", { "class": "cb-s06-step__disc", "aria-hidden": "true" }, [icon(s[0])]),
          h("span", { "class": "cb-s06-step__lbl", text: L === "es" ? s[2] : s[1] }),
          s[3] ? h("span", { "class": "cb-s06-step__speak" }, [api.ico("chat"), h("span", { text: t.canSpeak })]) : null
        ]);
      }));
    }
    function chip(d) {
      return h("span", { "class": "cb-s06-chip" }, [h("span", { "class": "cb-s06-chip__ic", "aria-hidden": "true" }, [icon(d.id)]), h("b", { text: tx(d.name) })]);
    }
    /* Esc on the answer card moves on, as the spec's keyboard check asks. It listens on the document, so it
       still works after a tap on blank space left focus on the page body; it ignores Esc while a dialog is
       open or while focus is outside the game, and lets go once its board is gone. */
    function onBoard(board, fn) {
      var stage = document.querySelector('[data-game="community-builders"]');
      function key(e) {
        if (!board.isConnected) { document.removeEventListener("keydown", key); return; }
        if (e.key !== "Escape" && e.key !== "Esc") return;
        var a = document.activeElement;
        if (document.querySelector("dialog[open]") || (a && a !== document.body && stage && !stage.contains(a))) return;
        e.preventDefault(); document.removeEventListener("keydown", key); fn();
      }
      document.addEventListener("keydown", key);
    }

    /* ── 1. intro ── */
    function intro() {
      var faces = h("ul", { "class": "cb-faces cb-s06-faces", "aria-hidden": "true" }, askers.map(function (n) { return h("li", { "class": "is-on" }, [api.img(n.img, "", null, true)]); }));
      api.screen([api.stopHud(stop, null), h("div", { "class": "cb-board cb-s06-board" }, [
        h("div", { "class": "cb-s06-top cb-s06-top--wide" }, [scene(), h("div", { "class": "cb-s06-intro" }, [
          h("p", { "class": "cb-intro__lead", text: t.intro }), faces,
          h("div", { "class": "cb-row" }, [api.btn(t.start, "cb-btn--go cb-btn--big", begin, "go", true)])])]),
        timeline(null)])]);
      api.frame();
    }
    function begin() { qi = 0; play({ focus: "[data-s06-q]" }); api.frame(); api.say(t.qn(1)); }

    /* ── 2. the five questions ── */
    function play(st) {
      st = st || {};
      var Q = round[qi], d = deskById(Q.desk), answered = !!Q.done;
      var ask = h("div", { "class": "cb-s06-ask", tabindex: "-1", "data-s06-q": "" }, [
        h("p", { "class": "cb-vh", text: api.nmCap(Q.nb) + ", " + Q.nb.plain[L] + ":" }),
        h("span", { "class": "cb-s06-who", "aria-hidden": "true" }, [api.img(Q.nb.img, "", null, true), h("b", { text: api.nmCap(Q.nb) }), h("small", { text: Q.nb.plain[L] })]),
        h("blockquote", { "class": "cb-bubble cb-s06-bubble" }, [h("p", { text: Q.text })]),
        api.coach(t.who, "people")]);
      var desks = h("ul", { "class": "cb-s06-desks" + (answered ? " is-answered" : "") }, order.map(function (id) {
        var e = deskById(id), tried = Q.tried.indexOf(id) >= 0, right = answered && id === Q.desk;
        var label = t.desk(tx(e.name)) + ", " + tx(e.job) + (tried ? ", " + t.tried : "") + (right ? ", " + t.rightDesk : "");
        var b = h("button", { type: "button", "class": "cb-s06-desk" + (tried ? " is-tried" : "") + (right ? " is-right" : "") + (st.fresh === id ? " is-fresh" : ""),
          "data-desk": id, "aria-label": label, "aria-disabled": tried || answered ? "true" : null, onclick: function (e) { tap(id, e); } }, [
          h("span", { "class": "cb-s06-desk__ic" }, [icon(id), right ? h("span", { "class": "cb-badge" }, [api.ico("check")]) : null]),
          h("span", { "class": "cb-s06-desk__txt" }, [h("span", { "class": "cb-s06-desk__name", text: tx(e.name) }), h("span", { "class": "cb-s06-desk__job", text: tx(e.job) }),
            tried ? h("span", { "class": "cb-s06-desk__tried" + (st.triedNew === id ? " is-fresh" : ""), text: t.tried }) : null])]);
        return h("li", null, [b]);
      }));
      var actions = null, nextBtn = null;
      if (answered) {
        var ok = Q.done !== "missed";
        nextBtn = api.btn(qi < 4 ? t.nextQ : t.finish, "cb-btn--go cb-btn--big", function (e) { if (settled(e)) next(); }, "go", true);
        nextBtn.setAttribute("data-s06-next", "");
        actions = h("div", { "class": "cb-actions cb-s06-actions" }, [h("div", { "class": "cb-actions__info" }, [
          h("div", { "class": "cb-feedback cb-s06-card" + (ok ? " is-ok" : "") }, [api.ico(ok ? "check" : "bulb"), h("div", { "class": "cb-s06-card__body" }, [
            h("p", { "class": "cb-s06-card__k", text: ok ? t.yes : t.hereIs }),
            h("p", { "class": "cb-s06-card__desk" }, [chip(d), h("span", { text: tx(d.line) })]),
            d.id === "planning" ? h("p", { "class": "cb-s06-card__speak" }, [api.ico("chat"), h("span", { text: t.boardPast })])
              : h("p", { "class": "cb-s06-card__speak" }, [api.ico("chat"), h("span", null, [h("b", { text: t.speakAt }), " " + placeOf(d)])]),
            d.ring ? h("p", { "class": "cb-s06-card__ring" }, [icon("pin"), h("span", { text: t.ringAt(stepName(d.ring)) })]) : null])])]), nextBtn]);
      } else if (st.wrong) {                             // that desk's own line, right under the desks
        var w = deskById(st.wrong);
        actions = h("div", { "class": "cb-feedback cb-s06-card cb-s06-tried" }, [api.ico("bulb"), h("div", { "class": "cb-s06-card__body" }, [
          h("p", { "class": "cb-s06-card__k", text: t.wrong }),
          h("p", { "class": "cb-s06-card__desk" }, [chip(w), h("span", { text: tx(w.line) })])])]);
      }
      var line = timeline(answered ? d.ring : null);
      var board = h("div", { "class": "cb-board cb-s06-board" }, [h("div", { "class": "cb-s06-top" }, [scene(), ask]), desks, actions, line]);
      if (answered) onBoard(board, next);
      api.screen([api.stopHud(stop, DOTS, qi, t.qn(qi + 1)), board], st.focus || null);
      settle();
      if (actions) show(actions, answered ? line.querySelector(".is-ring") : null);
    }
    /* The card sits right under the desks (not as a sticky bar, which on a phone covered most of the desks
       and hid the ringed step), and api.screen focuses without scrolling. Bring the card into view, plus the
       ringed timeline step when both fit on the screen. */
    function show(el, ring) {
      var vh = window.innerHeight || document.documentElement.clientHeight, how = api.REDUCED ? "auto" : "smooth";
      var a = el.getBoundingClientRect(), b = ring ? ring.getBoundingClientRect() : a, fits = b.bottom - a.top <= vh - 40;
      if (a.top >= 8 && b.bottom <= vh - 8) return;
      if (fits && a.top >= 8) (ring || el).scrollIntoView({ block: "nearest", behavior: how });
      else el.scrollIntoView({ block: fits || a.height > vh - 40 ? "start" : "nearest", behavior: how });
    }
    function tap(id, e) {
      var Q = round[qi];
      if (Q.done || Q.tried.indexOf(id) >= 0 || !settled(e)) return;
      var d = deskById(Q.desk), tell = tx(d.name) + ". " + tx(d.line) + " " + (d.id === "planning" ? t.boardPast : t.speakAt + " " + placeOf(d) + ".") + (d.ring ? " " + t.ringAt(stepName(d.ring)) : "");
      if (id === Q.desk) {
        Q.done = Q.tried.length ? "second" : "first";
        play({ focus: "[data-s06-next]", fresh: id });
        api.say(t.rightDesk + ". " + t.yes + " " + tell);
        return;
      }
      Q.tried.push(id);
      if (Q.tried.length >= 2) {
        Q.done = "missed";
        play({ focus: "[data-s06-next]", fresh: Q.desk, triedNew: id });
        api.say(t.notThis + ". " + t.hereIs + " " + tell);
      } else {
        var w = deskById(id);
        play({ focus: '[data-desk="' + id + '"]', triedNew: id, wrong: id });
        api.say(t.wrong + " " + tx(w.name) + ". " + tx(w.line));
      }
    }
    function next() {
      qi++;
      if (qi >= 5) return aha();
      play({ focus: "[data-s06-q]" }); api.frame(); api.say(t.qn(qi + 1));
    }

    /* ── 3. the aha card, Hearing ringed on the timeline ── */
    function aha() {
      var see = api.btn(t.see, "cb-btn--go cb-btn--big", function (e) { if (settled(e)) finish(); }, "go", true);
      see.setAttribute("data-s06-see", "");
      var board = h("div", { "class": "cb-board cb-s06-board" }, [
        h("div", { "class": "cb-s06-top cb-s06-top--wide" }, [scene(), h("div", { "class": "cb-s06-aha" }, [
          h("p", { "class": "cb-s06-aha__text" }, [h("span", { "class": "cb-s06-aha__ic", "aria-hidden": "true" }, [icon("council")]), h("span", { text: t.aha })]),
          h("div", { "class": "cb-row" }, [see])])]),
        timeline("hearing")]);
      api.screen([api.stopHud(stop, DOTS, 5), board], "[data-s06-see]");
      settle(); api.frame(); api.say(t.aha);
    }

    /* ── 4. score: process only, 20 / 10 / 0 per question ── */
    var finished = false;
    function finish() {
      if (finished) return; finished = true;          // one save per round, whatever is pressed twice
      var score = round.reduce(function (s, Q) { return s + (Q.done === "first" ? 20 : Q.done === "second" ? 10 : 0); }, 0);
      var councilMiss = round.some(function (Q) { return Q.desk === "council" && Q.done !== "first"; });
      var otherMiss = round.filter(function (Q) { return Q.desk !== "council" && Q.done !== "first"; })[0];
      var tip = councilMiss ? t.tipCouncil : otherMiss ? t.tipDesk : t.tip100;
      var info = api.saveRound(stop.id, score, { lastQs: ids.slice(), lastDesks: order.join(",") });
      api.endPlay();
      var card = api.scoreCard(stop, score, info, tip, t.can, t.real, null);
      if (!councilMiss && otherMiss) {                  // "remember this desk:" with that desk's icon, name and line
        var d = deskById(otherMiss.desk), tipP = card.querySelector(".cb-card__tip");
        if (tipP) {
          var wrap = h("div", { "class": "cb-s06-tipwrap" });
          tipP.parentNode.replaceChild(wrap, tipP);
          wrap.appendChild(tipP);
          wrap.appendChild(h("div", { "class": "cb-s06-tipdesk" }, [h("span", { "class": "cb-s06-tipdesk__ic", "aria-hidden": "true" }, [icon(d.id)]),
            h("div", null, [h("b", { text: tx(d.name) }), h("p", { text: tx(d.line) })])]));
        }
      }
      var gu = api.btn(t.gu, "cb-btn--quiet", function () { api.dialog(t.gu, [h("p", { text: t.guText })], gu); }, "family");
      api.finishRound(stop.id, card, api.cardButtons(stop.id, api.restart(stop.id), gu));
      api.say(api.W.score + " " + score + " / 100");
      calmCard();
    }
    /* the score card replaces the aha card under the finger: let the second half of a double tap on
       "See my score" fall on nothing, so it cannot press Play again or Next stop before the score is seen */
    function calmCard() {
      var until = Date.now() + 400, stage = document.querySelector('[data-game="community-builders"]');
      function eat(e) { if (Date.now() < until && e.detail > 0 && stage && stage.contains(e.target)) { e.preventDefault(); e.stopPropagation(); } }
      document.addEventListener("click", eat, true);
      setTimeout(function () { document.removeEventListener("click", eat, true); }, 450);
    }

    intro();
  }
})();
