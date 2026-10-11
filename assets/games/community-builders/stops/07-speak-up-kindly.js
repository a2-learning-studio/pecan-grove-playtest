/* Community Builders of Pecan Grove · Stop 7 · Speak Up Kindly / Habla con respeto
   A postcard builder with no typing: "I noticed…", "I wonder…", "One idea…", then the helper who decides the idea.
   Points reward the process only (three parts, one topic, finding who decides). No topic, tile or helper is worth more
   than another, and speed is never scored. Nothing is sent anywhere. Every string is exact from "07 - speak-up-kindly.md". */
(function () {
  "use strict";
  var CB = window.CommunityBuilders; if (!CB) return;
  var ES = (document.documentElement.lang || "en").slice(0, 2) === "es";
  function tx(p) { return ES ? p[1] : p[0]; }
  var ID = "speak-up-kindly", ROWS = ["n", "w", "i"], TOPICS = ["water", "trucks", "jobs", "history", "lights"];
  var HOME = [0.22, 0.27, 0.6, 0.65];        // painted crop: a home on the left, the clock-tower building through the trees
  var SVGNS = "http://www.w3.org/2000/svg", uid = 0;
  /* the last round drawn on this page, finished or not, so quitting and coming back is also a new round (memory only, never saved) */
  var SEEN = { spark: null, tiles: [] };
  /* a double tap on a button that changes the screen must not also tap whatever the new screen puts under the finger
     (a tile under "Start", a helper under "My card is ready", a score-card button under "See my score") */
  var shownAt = 0;
  function settle() { shownAt = Date.now(); }
  document.addEventListener("click", function (e) {
    if (e.detail > 1 && Date.now() - shownAt < 600 && e.target && e.target.closest && e.target.closest(".cb")) { e.preventDefault(); e.stopPropagation(); }
  }, true);

  /* ── words ─────────────────────────────────────────────────────────── */
  var T = ES ? {
    title: "Habla con respeto - Constructores de comunidad de Pecan Grove",
    intro: "Pronto será la audiencia del Concejo del pueblo. Antes, un adulto puede enviar un comentario por escrito a los grupos que deciden. Arma una tarjeta corta y respetuosa. No se envía nada. Se la muestras a un adulto.",
    start: "Empezar", home: "Tu casa",
    step: function (n) { return "Paso " + n + " de 2"; },
    lead: "¿Y tú qué quieres decir? Arma tu propia tarjeta sobre un tema, el que tú quieras.",
    tap: "Toca una ficha en cada fila, todas sobre ese tema. Puedes cambiar de idea.",
    rows: { n: "Me di cuenta de que…", w: "Me pregunto…", i: "Una idea…" },
    stem: { n: "Me di cuenta de que", w: "Me pregunto", i: "Una idea:" },
    topicIs: function (t) { return "Tema: " + t; },
    hello: "¡Hola!", thanks: "Gracias por escuchar.", from: "De: un niño o una niña de Pecan Grove",
    ready: "Mi tarjeta está lista",
    who: "¿Quién decide sobre tu idea? Toca para quién es tu tarjeta.",
    cardFor: function (n) { return "Tarjeta para: " + n; },
    right: "¡Sí! Este grupo decide sobre tu idea.", not: "Este no.", another: "Prueba otro.", tried: "Ya lo probaste",
    here: "Este es el grupo que decide sobre tu idea.", liveRight: "Grupo correcto", liveNot: "Este no",
    to: function (n) { return "Para: " + n; },
    parts: function (n) { return "Tu tarjeta tiene " + n + " de 3 partes. Las tres partes ayudan a que te entiendan."; },
    topics: function (n) { return "Tu tarjeta tiene " + n + " temas. Una tarjeta sobre un solo tema se escucha mejor."; },
    aha: "Una tarjeta corta sobre un solo tema, para el grupo que lo decide, se escucha mejor que una lista larga.",
    sent: "No se envió nada. Tu tarjeta se queda en esta pantalla.",
    print: "Imprimir", show: "Muéstraselo a un adulto", see: "Ver mi puntaje",
    guTitle: "Para adultos",
    guText: "Los niños arman un comentario de tres partes (me di cuenta, me pregunto, una idea) y eligen quién decide ese tema. El juego no envía nada. Si usted está de acuerdo con la tarjeta de su hijo o hija, puede enviarla como carta o comentario público por escrito. Para saber cómo se reciben los comentarios por escrito antes de una audiencia pública, pregunte en la secretaría de su ciudad o condado.",
    can: "Puedo decir lo que noté, preguntar y compartir una idea, con respeto.",
    tipParts: "La próxima vez, completa las tres partes: me di cuenta, me pregunto y una idea.",
    tipTopic: "La próxima vez, usa un solo tema en las tres partes. Un solo tema se escucha mejor.",
    tipWho: "La próxima vez, pregúntate: ¿quién decide sobre mi idea?",
    tip100: "¡Gran tarjeta! Prueba una nueva ronda con otro tema.",
    real: "Imprime tu tarjeta y muéstrasela a un adulto. Si está de acuerdo, puede enviar tu idea en una carta o un comentario escrito antes de una reunión.",
    gu: "Para adultos: sobre esta parada"
  } : {
    title: "Speak Up Kindly - Community Builders of Pecan Grove",
    intro: "The Town Council hearing is soon. Before it, a grown-up can send a written comment to the helpers who decide. Make a short, kind postcard. Nothing gets sent. You show it to a grown-up.",
    start: "Start", home: "Your home",
    step: function (n) { return "Step " + n + " of 2"; },
    lead: "What do you want to say? Make your own postcard about one topic, any one you like.",
    tap: "Tap one tile in each row, all about that topic. You can change your mind.",
    rows: { n: "I noticed…", w: "I wonder…", i: "One idea…" },
    stem: { n: "I noticed", w: "I wonder", i: "One idea:" },
    topicIs: function (t) { return "Topic: " + t; },
    hello: "Hello!", thanks: "Thank you for listening.", from: "From: a kid in Pecan Grove",
    ready: "My card is ready",
    who: "Who decides your idea? Tap who your card is for.",
    cardFor: function (n) { return "Card for: " + n; },
    right: "Yes! This helper decides your idea.", not: "Not this one.", another: "Try another one.", tried: "Tried",
    here: "Here is who decides your idea.", liveRight: "Right helper", liveNot: "Not this one",
    to: function (n) { return "To: " + n; },
    parts: function (n) { return "Your card has " + n + " of 3 parts. All three parts help people understand you."; },
    topics: function (n) { return "Your card has " + n + " topics. A card about one topic is easier to hear."; },
    aha: "A short card on one topic, sent to the helper who decides it, is easier to hear than a long list.",
    sent: "Nothing was sent. Your card stays on this screen.",
    print: "Print", show: "Show a grown-up", see: "See my score",
    guTitle: "For grown-ups",
    guText: "Kids build a three-part comment (I noticed, I wonder, one idea) and pick who decides that topic. The game sends nothing. If you agree with your child's card, you can send it yourself as a letter or written public comment. To learn how written comments are accepted before a public hearing, ask your city or county clerk.",
    can: "I can say what I noticed, ask, and share one idea, kindly.",
    tipParts: "Next time, fill all three parts: I noticed, I wonder and one idea.",
    tipTopic: "Next time, keep all three parts on one topic. One topic is easier to hear.",
    tipWho: "Next time, ask: who decides my idea?",
    tip100: "Great card! Try a new round with a different topic.",
    real: "Print your card and show a grown-up. If they agree, they can send your idea as a letter or written comment before a meeting.",
    gu: "For grown-ups: about this stop"
  };

  var TOPIC_NAME = { water: ["Water", "Agua"], trucks: ["Trucks", "Camiones"], jobs: ["Jobs", "Empleos"], history: ["History", "Historia"], lights: ["Lights at night", "Luces de noche"] };

  /* one spark per neighbor; the [topic] is for code only */
  var SPARKS = [
    { nb: "johnson", topic: "water", line: ["I worry the data center could take lots of water from Pecan River. My cows need it too.", "Me preocupa que el centro de datos saque mucha agua del río Pecan. Mis vacas también la necesitan."] },
    { nb: "patel", topic: "trucks", line: ["I worry big trucks will crowd Main Street for months.", "Me preocupa que los camiones grandes llenen la calle principal por meses."] },
    { nb: "ana", topic: "jobs", line: ["I worry the jobs will end when the building is done.", "Me preocupa que los empleos se acaben cuando terminen de construir."] },
    { nb: "jayden", topic: "jobs", line: ["I worry young people will move away to find work.", "Me preocupa que los jóvenes se vayan a buscar trabajo a otro lado."] },
    { nb: "ruth", topic: "history", line: ["I worry old graves could be hidden on the farm. I want someone to look before digging.", "Me preocupa que haya tumbas antiguas escondidas en la granja. Quiero que alguien las busque antes de excavar."] },
    { nb: "lee", topic: "lights", line: ["I worry bright lights all night could shine into bedrooms.", "Me preocupa que las luces fuertes toda la noche alumbren los cuartos."] }
  ];

  /* 45 tiles: row (n = I noticed, w = I wonder, i = One idea) → topic → 3 wordings [en, es] */
  var TILES = {
    n: {
      water: [["Pecan River gets low on hot summer days.", "el río Pecan baja mucho en los días de calor."], ["many farms here use water from Pecan River.", "muchas granjas de aquí usan agua del río Pecan."], ["we all share the water in Pecan River.", "todos compartimos el agua del río Pecan."]],
      trucks: [["Main Street gets busy in the morning before school.", "la calle principal se llena en la mañana antes de la escuela."], ["school buses use the farm road every day.", "los autobuses escolares usan el camino de la granja todos los días."], ["kids walk to school on Main Street.", "los niños caminan a la escuela por la calle principal."]],
      jobs: [["many people here drive far to get to work.", "mucha gente de aquí maneja lejos para ir a trabajar."], ["young people move away to find work.", "los jóvenes se van a buscar trabajo a otro lado."], ["people in Pecan Grove are good at building and fixing things.", "la gente de Pecan Grove sabe construir y arreglar cosas."]],
      history: [["the old chapel is older than anyone in town.", "la vieja capilla es más antigua que cualquier persona del pueblo."], ["Grandma Ruth knows lots of stories about the old farm.", "la abuela Ruth sabe muchas historias de la vieja granja."], ["there are old family graves near the chapel.", "hay tumbas antiguas de familias cerca de la capilla."]],
      lights: [["we can see lots of stars at night here.", "aquí se ven muchas estrellas de noche."], ["our street is dark and quiet at night.", "nuestra calle es oscura y tranquila de noche."], ["fireflies come out on dark summer nights.", "las luciérnagas salen en las noches oscuras de verano."]]
    },
    w: {
      water: [["how much water the data center would take from Pecan River.", "cuánta agua sacaría el centro de datos del río Pecan."], ["how much water the building would need on the hottest days.", "cuánta agua necesitaría el edificio en los días más calurosos."], ["if there would be enough water for the farms too.", "si alcanzaría el agua también para las granjas."]],
      trucks: [["how many trucks would come each day.", "cuántos camiones pasarían cada día."], ["which roads the trucks would use.", "por qué calles pasarían los camiones."], ["if trucks would come when kids walk to school.", "si pasarían camiones a la hora en que los niños caminan a la escuela."]],
      jobs: [["how many jobs would go to people who live here.", "cuántos empleos serían para la gente de aquí."], ["if the jobs would last after the building is done.", "si los empleos durarían después de terminar la obra."], ["what training people here would need for those jobs.", "qué capacitación necesitaría la gente de aquí para esos empleos."]],
      history: [["if someone will look for old graves before digging.", "si alguien va a buscar tumbas antiguas antes de excavar."], ["how the farm's old stories will be kept.", "cómo se van a guardar las historias antiguas de la granja."], ["how close the building would be to the old chapel.", "qué tan cerca de la vieja capilla quedaría el edificio."]],
      lights: [["which lights would stay on all night.", "qué luces quedarían prendidas toda la noche."], ["if we could still see the stars.", "si todavía podríamos ver las estrellas."], ["how bright the lights would be near homes.", "qué tan fuertes serían las luces cerca de las casas."]]
    },
    i: {
      water: [["the company could take less water from Pecan River on hot days.", "la empresa podría sacar menos agua del río Pecan en los días de calor."], ["the company could share how much river water it uses each month.", "la empresa podría decir cuánta agua del río usa cada mes."], ["the company could reuse its water instead of taking more from the river.", "la empresa podría volver a usar su agua en vez de sacar más del río."]],
      trucks: [["trucks could use a road away from the school.", "los camiones podrían usar un camino lejos de la escuela."], ["trucks could wait until the school buses are done.", "los camiones podrían esperar a que pasen los autobuses escolares."], ["the town could ask for a truck plan before it decides.", "el pueblo podría pedir un plan para los camiones antes de decidir."]],
      jobs: [["the company could hire people who live here first.", "la empresa podría contratar primero a gente de aquí."], ["the company could train people from Pecan Grove for the jobs.", "la empresa podría capacitar a gente de Pecan Grove para esos empleos."], ["if the company pays less tax, it could promise jobs for people here.", "si la empresa paga menos impuestos, podría prometer empleos para la gente de aquí."]],
      history: [["an expert could look for old graves before any digging.", "una persona experta podría buscar tumbas antiguas antes de excavar."], ["the town could keep a wide space of trees around old graves.", "el pueblo podría dejar un espacio amplio con árboles alrededor de las tumbas antiguas."], ["the building could stay far from the old chapel.", "el edificio podría quedar lejos de la vieja capilla."]],
      lights: [["lights could point down, not into homes.", "las luces podrían apuntar hacia abajo, no hacia las casas."], ["the town could ask to see a lights plan before it decides.", "el pueblo podría pedir ver un plan de luces antes de decidir."], ["lights that are not needed could turn off at night.", "las luces que no se necesiten podrían apagarse de noche."]]
    }
  };

  /* the six helpers who decide (Stop 6); the [id] is for code only */
  var HELPERS = {
    council: { name: ["Town Council", "Concejo del pueblo"], line: ["Decides what can be built, after a public hearing. It can set rules for trucks, lights and old graves.", "Decide qué se puede construir, después de una audiencia pública. Puede poner reglas para los camiones, las luces y las tumbas antiguas."] },
    planning: { name: ["Planning Board", "Junta de Planificación"], line: ["Studied the plan first and gave the Town Council advice. Its meeting is over.", "Estudió el plan primero y le dio consejos al Concejo del pueblo. Su reunión ya pasó."] },
    development: { name: ["Development Board", "Junta de Desarrollo"], line: ["Decides if the company can pay less tax for some years. It can ask for jobs for people here in return.", "Decide si la empresa puede pagar menos impuestos por unos años. A cambio, puede pedir empleos para la gente de aquí."] },
    regional: { name: ["Regional Review", "Revisión Regional"], line: ["Looks at how a big project could affect nearby towns, and shares comments. It does not decide.", "Revisa cómo un proyecto grande podría afectar a los pueblos cercanos y da su opinión. No decide."] },
    power: { name: ["State Power Board", "Junta Estatal de Electricidad"], line: ["Sets the price of power. It does not pick where buildings go.", "Fija el precio de la luz. No elige dónde se construye."] },
    environment: { name: ["State Environment Office", "Oficina Estatal del Medio Ambiente"], line: ["Gives permits for smoke from engines and for taking lots of water from Pecan River.", "Da permisos para el humo de los motores y para sacar mucha agua del río Pecan."] }
  };
  var HELPER_IDS = ["council", "planning", "development", "regional", "power", "environment"];
  var HJOB = {
    council: ["Decides what can be built", "Decide qué se puede construir"], planning: ["Gave advice; its meeting is over", "Dio consejos; su reunión ya pasó"],
    development: ["Decides on tax breaks", "Decide si pagan menos impuestos"], regional: ["Comments for nearby towns", "Opina por los pueblos cercanos"],
    power: ["Sets power prices", "Fija el precio de la luz"], environment: ["Gives smoke and water permits", "Da permisos de humo y de agua"]
  };
  var DECIDES = { water: "environment", jobs: "development", trucks: "council", history: "council", lights: "council" };

  /* line icons on the shell's 24-unit grid, one 2px round stroke (no glyphs, no words).
     The six helper desks are the same drawings as Stop 6 (06-who-decides.js), so a child sees the same desks in both stops. */
  var ICONS = {
    water: '<path d="M12 3.6c3.1 3.7 5.6 7 5.6 10.1a5.6 5.6 0 0 1-11.2 0C6.4 10.6 8.9 7.3 12 3.6z"/><path d="M9.4 14.4a2.7 2.7 0 0 0 2.2 2.5"/>',
    trucks: '<path d="M3 15.5V7.5a1 1 0 0 1 1-1h10v9"/><path d="M14 9.5h3.7l2.8 3.3v2.7H3"/><circle cx="7.5" cy="17.5" r="2"/><circle cx="16.5" cy="17.5" r="2"/>',
    jobs: '<path d="M4 14.5a8 8 0 0 1 16 0"/><path d="M10 6.9v4.6M14 6.9v4.6"/><path d="M2.5 14.5h19v2a1.5 1.5 0 0 1-1.5 1.5H4a1.5 1.5 0 0 1-1.5-1.5z"/>',
    history: '<path d="M4 20.5h16"/><path d="M6 20.5V12l6-4.5 6 4.5v8.5"/><path d="M10.6 8.6 12 3.5l1.4 5.1"/><path d="M10 20.5v-2.7a2 2 0 0 1 4 0v2.7"/><circle cx="12" cy="12.8" r="1.2"/>',
    lights: '<path d="M20 13.2A8 8 0 1 1 10.8 4a6.2 6.2 0 0 0 9.2 9.2z"/>',
    council: '<path d="M3.5 9.5 12 4.5l8.5 5z"/><path d="M6.5 12v5.5M10 12v5.5M14 12v5.5M17.5 12v5.5"/><path d="M4 20.5h16"/>',
    planning: '<rect x="3.5" y="4" width="4" height="13" rx="2"/><path d="M5.5 17v2.5h15V6.5H7.5"/><path d="M11 10h6v6h-6zM14 10v3M11 13h1.5"/>',
    development: '<path d="M8 3.5h8M9 3.5V6c-2.5 1-3.5 3-3.5 5.5v6A2.5 2.5 0 0 0 8 20h8a2.5 2.5 0 0 0 2.5-2.5v-6c0-2.5-1-4.5-3.5-5.5V3.5"/><circle cx="12" cy="14.5" r="2.6"/>',
    regional: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.3 15.3 5.2 5.2"/><path d="M8 13v-2.3l2.5-2 2.5 2V13"/>',
    power: '<path d="M13 3 5.5 13.5H11L10 21l8-11.5h-5.5z"/>',
    environment: '<path d="M5 19.5C5 11 10.5 5 19.5 4.5 19.5 13.5 14 19.5 5 19.5z"/><path d="M5 19.5c3.5-5 7-8 10.5-10"/>',
    printer: '<path d="M7 9V4.5h10V9"/><rect x="3.5" y="9" width="17" height="7.5" rx="2"/><path d="M7.5 13.5h9v6.5h-9z"/>'
  };
  function icon(name, cls) {
    var s = document.createElementNS(SVGNS, "svg");
    s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true"); s.setAttribute("focusable", "false");
    s.setAttribute("class", "cb-ico" + (cls ? " " + cls : ""));
    s.innerHTML = ICONS[name];                                   // constant, authored markup only
    return s;
  }

  CB.register({ id: ID, steps: [null, null], css: "07-speak-up-kindly.css", run: run });

  /* ── one round ─────────────────────────────────────────────────────── */
  function run(api, stop) {
    var h = api.h, STEPS = [null, null];
    document.title = T.title;
    var round = newRound(api, stop);
    var pick = { n: null, w: null, i: null };            // the tile chosen in each row
    var partsAtReady = 0, taps = 0, tried = {}, helperPts = 0, firstRight = false, done = false;

    function helperName(id) { return tx(HELPERS[id].name); }
    function helperLine(id) { return tx(HELPERS[id].line); }
    function filled() { return ROWS.filter(function (r) { return pick[r]; }); }
    function topicsUsed() { var o = {}; filled().forEach(function (r) { o[pick[r].topic] = 1; }); return Object.keys(o); }
    function decider() { var t = pick.i || pick.w || pick.n; return t ? DECIDES[t.topic] : null; }
    function lineText(t) { return T.stem[t.row] + " " + t.text; }
    function board(kids, cls) { return h("div", { "class": "cb-board cb-s07" + (cls ? " " + cls : "") }, kids); }

    /* the postcard: real text, each part with its topic icon; the build face, then the finished face */
    function face(kind, opt) {
      opt = opt || {};
      var kids = [kind === "done" ? h("span", { "class": "cb-s07-stamp is-on", "aria-hidden": "true" }, [api.ico("check")])
        : h("span", { "class": "cb-s07-stamp", "aria-hidden": "true" })];
      if (kind === "done") kids.push(h("p", { "class": "cb-s07-to", id: opt.toId || null }, [h("span", { "class": "cb-s07-to__ic" }, [icon(opt.helper)]), h("span", { text: T.to(helperName(opt.helper)) })]));
      kids.push(h("p", { "class": "cb-s07-hello", text: T.hello }));
      ROWS.forEach(function (r) {
        var t = pick[r];
        if (!t) {                                   // an empty part leaves no words; while building, a blank slot shows what is left
          if (kind === "build") kids.push(h("span", { "class": "cb-s07-line is-empty", "data-s07row": r, "aria-hidden": "true" }));
          return;
        }
        kids.push(h("p", { "class": "cb-s07-line" + (opt.anim === r ? " is-new" : ""), "data-s07row": r }, [
          h("span", { "class": "cb-s07-line__ic" }, [icon(t.topic)]), h("span", { "class": "cb-s07-line__t" }, [h("b", { text: T.stem[r] }), " " + t.text])]));
      });
      kids.push(h("p", { "class": "cb-s07-thanks", text: T.thanks }));
      kids.push(h("p", { "class": "cb-s07-from", text: T.from }));
      return h("div", { "class": "cb-s07-face cb-s07-face--" + kind, "aria-hidden": opt.hidden ? "true" : null }, kids);
    }
    function postcard() { return h("div", { "class": "cb-s07-card" }, [face("build")]); }
    function finishedCard(helper, flip, mini) {
      var toId = "cb-s07-to-" + (++uid);
      var inner = flip && !mini
        ? h("div", { "class": "cb-s07-flip" }, [face("build", { hidden: true }), face("done", { helper: helper, toId: toId })])
        : face("done", { helper: helper, toId: toId });
      return h("div", { "class": "cb-s07-card is-done" + (flip && !mini ? " is-flip" : "") + (mini ? " cb-s07-card--mini" : ""),
        role: "group", "aria-labelledby": toId, tabindex: mini ? null : "-1" }, [inner]);
    }

    /* ── intro: the kitchen table at your home ─────────────────────── */
    function intro() {
      var scene = api.crop(HOME, "cb-s07-scene", [h("span", { "class": "cb-s07-plate", "aria-hidden": "true" }, [api.ico("home"), h("span", { text: T.home })])]);
      var parts = h("ul", { "class": "cb-s07-legend" }, ROWS.map(function (r) {
        return h("li", { "data-s07row": r }, [h("i", { "aria-hidden": "true" }), h("span", { text: T.rows[r] })]);
      }));
      api.screen([api.stopHud(stop, null), board([h("div", { "class": "cb-s07-intro" }, [
        h("figure", { "class": "cb-s07-intro__art" }, [scene, h("figcaption", { "class": "cb-vh", text: T.home })]),
        h("div", { "class": "cb-s07-intro__copy" }, [h("p", { "class": "cb-s07-intro__lead", text: T.intro }), parts,
          h("div", { "class": "cb-row" }, [api.btn(T.start, "cb-btn--go cb-btn--big", build, "go", true)])])])])]);
      api.frame(); settle();
    }

    /* ── step 1: build the card ─────────────────────────────────────── */
    function build() {
      var nb = api.nbById(round.spark.nb), buttons = {}, card = postcard();
      var scene = api.crop(HOME, "cb-s07-scene", [h("span", { "class": "cb-s07-plate", "aria-hidden": "true" }, [api.ico("home"), h("span", { text: T.home })])]);
      var spark = h("div", { "class": "cb-s07-spark", "data-nb": nb.id }, [scene, h("div", { "class": "cb-s07-talk" }, [
        h("figure", { "class": "cb-s07-say" }, [
          h("figcaption", { "class": "cb-s07-who" }, [api.img(nb.img, "", null, true), h("span", null, [h("b", { text: api.nmCap(nb) }), h("small", { text: nb.plain[api.L] })])]),
          h("blockquote", { "class": "cb-bubble" }, [h("p", { text: tx(round.spark.line) })])]),
        h("p", { "class": "cb-s07-lead", text: T.lead })])]);
      var rows = h("div", { "class": "cb-s07-rows" }, ROWS.map(function (r) {
        var hid = "cb-s07-row-" + r + "-" + (++uid);
        return h("div", { "class": "cb-s07-row", "data-s07row": r, role: "group", "aria-labelledby": hid }, [
          h("h3", { "class": "cb-s07-row__h", id: hid }, [h("i", { "aria-hidden": "true" }), h("span", { text: T.rows[r] })]),
          h("ul", { "class": "cb-s07-tiles" }, round.rows[r].map(function (t) {
            var b = h("button", { type: "button", "class": "cb-s07-tile", "data-tile": t.key, "data-topic": t.topic, "aria-pressed": "false",
              "aria-label": T.rows[r] + ", " + t.text + " " + T.topicIs(tx(TOPIC_NAME[t.topic])), onclick: function () { tap(t); } }, [
              h("span", { "class": "cb-s07-tile__ic" }, [icon(t.topic)]),
              h("span", { "class": "cb-s07-tile__body" }, [h("span", { "class": "cb-s07-tile__topic", "data-topic": t.topic, text: tx(TOPIC_NAME[t.topic]) }), h("span", { "class": "cb-s07-tile__t", text: t.text })]),
              h("span", { "class": "cb-s07-tile__ok", "aria-hidden": "true" }, [api.ico("check")])]);
            buttons[t.key] = b;
            return h("li", null, [b]);
          }))]);
      }));
      var dots = h("span", { "class": "cb-s07-dots", "aria-hidden": "true" }, ROWS.map(function (r) { return h("i", { "data-s07row": r }, [api.ico("check"), h("span", { text: T.rows[r] })]); }));
      var ready = api.btn(T.ready, "cb-btn--go cb-btn--big cb-s07-ready", function () {
        if (!filled().length || done) return;
        partsAtReady = filled().length;
        step2();
      }, "go", true);
      function sync(row) {
        ROWS.forEach(function (r) { round.rows[r].forEach(function (t) { buttons[t.key].setAttribute("aria-pressed", pick[r] && pick[r].key === t.key ? "true" : "false"); }); });
        card.replaceChild(face("build", { anim: row && pick[row] ? row : null }), card.firstChild);
        [].forEach.call(dots.children, function (d) { d.classList.toggle("is-on", !!pick[d.getAttribute("data-s07row")]); });
        if (filled().length) ready.removeAttribute("aria-disabled"); else ready.setAttribute("aria-disabled", "true");
      }
      function tap(t) {
        var cur = pick[t.row];
        pick[t.row] = cur && cur.key === t.key ? null : t;      // tap another to switch; tap the picked one again to unpick
        sync(t.row);
        if (pick[t.row]) api.say(lineText(t));
        if (pick.n && pick.w && pick.i && card.getBoundingClientRect().top > window.innerHeight * 0.6) {   // narrow stage: the card sits under all the tiles
          try { card.scrollIntoView({ block: "center", behavior: api.REDUCED ? "auto" : "smooth" }); } catch (e) { card.scrollIntoView(); }
        }
      }
      api.screen([api.stopHud(stop, STEPS, 0, T.step(1)), board([spark,
        h("p", { "class": "cb-coach" }, [api.ico("chat"), h("span", { text: T.tap })]),
        h("div", { "class": "cb-s07-desk" }, [h("div", { "class": "cb-s07-desk__main" }, [rows]), h("div", { "class": "cb-s07-desk__card" }, [card])]),
        h("div", { "class": "cb-actions cb-s07-bar" }, [h("div", { "class": "cb-actions__info" }, [dots]), ready])], "cb-s07--build")]);
      sync(null);
      api.frame(); settle();
    }

    /* ── step 2: who decides your idea? ─────────────────────────────── */
    function helperBtn(id, state, onTap) {
      var isTried = !!tried[id], isRight = state && state.right === id, locked = !!state;
      var b = h("button", { type: "button", "class": "cb-s07-helper" + (isTried ? " is-tried" : "") + (isRight ? " is-right" : ""), "data-h": id,
        "aria-label": T.cardFor(helperName(id)) + (isTried ? ", " + T.tried : ""), "aria-disabled": isTried || (locked && !state.final) ? "true" : null,
        disabled: state && state.final ? true : null, onclick: function () { if (!locked && !isTried) onTap(id); } }, [
        h("span", { "class": "cb-s07-helper__ic" }, [icon(id), isRight ? h("span", { "class": "cb-badge" }, [api.ico("check")]) : null]),
        h("span", { "class": "cb-s07-helper__n", text: helperName(id) }), h("span", { "class": "cb-s07-helper__job", text: tx(HJOB[id]) }),
        isTried ? h("span", { "class": "cb-s07-helper__tried", text: T.tried }) : null]);
      return h("li", null, [b]);
    }
    function step2(feedback, focusId, resolving, ok) {
      var card = postcard();
      var grid = h("ul", { "class": "cb-s07-helpers" }, round.helpers.map(function (id) { return helperBtn(id, resolving, onHelper); }));
      var b = board([h("div", { "class": "cb-s07-desk" }, [
        h("div", { "class": "cb-s07-desk__main" }, [h("p", { "class": "cb-coach cb-s07-q", tabindex: "-1" }, [api.ico("people"), h("span", { text: T.who })]), grid]),
        h("div", { "class": "cb-s07-desk__card" }, [card])]),
        feedback ? h("div", { "class": "cb-actions" }, [h("div", { "class": "cb-actions__info" }, [api.fb(feedback, !!ok)])]) : null], "cb-s07--who");
      api.screen([api.stopHud(stop, STEPS, 1, T.step(2)), b], focusId ? '[data-h="' + focusId + '"]' : ".cb-s07-q");
      if (!focusId) api.frame();
      settle();
      return b;
    }
    function onHelper(id) {
      if (done) return;
      taps++;
      var right = decider();
      if (id === right) {
        helperPts = taps === 1 ? 30 : 15; firstRight = taps === 1;
        var okText = T.right + " " + helperLine(id);
        api.say(T.liveRight + ". " + okText);
        resolve(true, okText, id);
      } else if (taps === 1) {
        tried[id] = 1;
        var fbText = T.not + " " + helperLine(id) + " " + T.another;
        step2(fbText, id);
        api.say(fbText);
      } else {
        tried[id] = 1; helperPts = 0;
        var hereText = T.here + " " + helperLine(right);
        api.say(T.liveNot + ". " + hereText);
        resolve(false, hereText, id);
      }
    }
    function resolve(ok, text, tappedId) {          // the right helper lights up in place with its answer, then the card turns over
      done = true;
      var right = decider();
      var b = step2(text, tappedId, { right: right }, ok);
      setTimeout(function () { if (b.isConnected) finished(ok, text, right); }, api.REDUCED ? 250 : 750);
    }

    /* ── the finished card ──────────────────────────────────────────── */
    function finished(ok, text, right) {
      var card = finishedCard(right, true, false);
      function acts(where) {                        // Print and Show a grown-up: in the bar on wide screens, under the card on a phone
        var pb = api.btn(T.print, "cb-s07-printbtn", function () { printCard(card); });
        pb.insertBefore(icon("printer"), pb.firstChild);
        var sb = api.btn(T.show, "cb-s07-showbtn", function () { openGrownups(sb); }, "family");
        return h("div", { "class": "cb-row cb-s07-acts cb-s07-acts--" + where }, [pb, sb]);
      }
      var notes = [], nParts = filled().length, nTopics = topicsUsed().length;
      if (nParts < 3) notes.push(h("div", { "class": "cb-tipcard" }, [api.ico("bulb"), h("p", { text: T.parts(nParts) })]));
      if (nTopics > 1) notes.push(h("div", { "class": "cb-tipcard" }, [api.ico("bulb"), h("p", { text: T.topics(nTopics) })]));
      notes.push(h("div", { "class": "cb-tipcard cb-s07-aha" }, [api.ico("chat"), h("p", { text: T.aha })]));
      var grid = h("ul", { "class": "cb-s07-helpers" }, round.helpers.map(function (id) { return helperBtn(id, { right: right, final: true }); }));
      var see = api.btn(T.see, "cb-btn--go cb-btn--big", score, "go", true);
      // spec order under the card: the notes that fit, the aha, "Nothing was sent", then the buttons
      api.screen([api.stopHud(stop, STEPS, 2, T.step(2)), board([h("div", { "class": "cb-s07-fin" }, [
        api.fb(text, ok),
        h("div", { "class": "cb-s07-fin__card" }, [card]),
        grid,
        h("div", { "class": "cb-s07-fin__notes" }, notes),
        h("div", { "class": "cb-s07-fin__after" }, [h("p", { "class": "cb-s07-sent cb-s07-sent--card", text: T.sent }), acts("card")])]),
        h("div", { "class": "cb-actions cb-s07-bar" }, [h("div", { "class": "cb-actions__info" }, [h("p", { "class": "cb-s07-sent cb-s07-sent--bar" }, [api.ico("check"), h("span", { text: T.sent })])]),
          h("div", { "class": "cb-row cb-s07-bar__btns" }, [acts("bar"), see])])],
        "cb-s07--done")], ".cb-s07-card");
      api.frame(); settle();
    }
    function printCard(card) {                       // prints only the postcard: the stop's print sheet keys on this class
      card.classList.add("cb-s07-print");
      function clean() { card.classList.remove("cb-s07-print"); window.removeEventListener("afterprint", clean); }
      window.addEventListener("afterprint", clean);
      try { window.print(); } catch (e) { clean(); }
    }
    function openGrownups(opener) {
      api.dialog(T.guTitle, [h("div", { "class": "cb-dlg__body" }, [h("p", { text: T.guText })])], opener);
    }

    /* ── score: process only ────────────────────────────────────────── */
    function score() {
      var nTopics = topicsUsed().length, right = decider();
      var oneTopic = partsAtReady === 3 && nTopics === 1;
      var total = 15 * partsAtReady + (oneTopic ? 25 : 0) + helperPts;
      var tip = partsAtReady < 3 ? T.tipParts : nTopics > 1 ? T.tipTopic : !firstRight ? T.tipWho : T.tip100;
      var shown = [];
      ROWS.forEach(function (r) { round.rows[r].forEach(function (t) { shown.push(t.key); }); });
      var info = api.saveRound(stop.id, total, { lastSpark: round.spark.nb, lastTiles: shown });   // tile codes shown, never the card's words
      api.endPlay();
      var card = api.scoreCard(stop, total, info, tip, T.can, T.real);
      var can = card.querySelector(".cb-card__can");
      if (can) can.parentNode.insertBefore(finishedCard(right, false, true), can.nextSibling);
      if (tip === T.tipWho) {
        var p = card.querySelector(".cb-card__tip");
        if (p) {
          var box = h("div", { "class": "cb-s07-tipwho" });
          p.parentNode.replaceChild(box, p);
          box.appendChild(p);
          box.appendChild(h("p", { "class": "cb-s07-chip" }, [h("span", { "class": "cb-s07-chip__ic" }, [icon(right)]),
            h("span", null, [h("b", { text: helperName(right) }), h("span", { text: helperLine(right) })])]));
        }
      }
      var gu = api.btn(T.gu, "cb-btn--quiet", function () { openGrownups(gu); }, "family");
      api.finishRound(stop.id, card, api.cardButtons(stop.id, api.restart(stop.id), gu));
      settle();
      api.say(api.W.score + " " + total + " / 100");
    }

    intro();
  }

  /* a new random round: a different spark neighbor, 4 topics (the spark's + 3 of the other 4), fresh wordings */
  function newRound(api) {
    var r = api.rec(ID) || {}, tm = api.team();
    var avoid = tm && tm.phase === "B" && tm.s07 ? tm.s07 : null;
    function ok(s, withLast) { return !(avoid && (s.nb === avoid.nb || s.topic === avoid.topic)) && (!withLast || (s.nb !== r.lastSpark && s.nb !== SEEN.spark)); }
    var pool = SPARKS.filter(function (s) { return ok(s, true); });
    if (!pool.length) pool = SPARKS.filter(function (s) { return ok(s, false); });
    var spark = api.pick(pool);
    if (tm && tm.phase === "A") tm.s07 = { nb: spark.nb, topic: spark.topic };     // Team 2 gets another neighbor and topic
    var topics = [spark.topic].concat(api.shuffle(TOPICS.filter(function (t) { return t !== spark.topic; })).slice(0, 3));
    var last = SEEN.spark ? SEEN.tiles : (r.lastTiles || []), rows = {};
    ROWS.forEach(function (row) {
      rows[row] = api.shuffle(topics.map(function (tp) {
        var fresh = [0, 1, 2].filter(function (i) { return last.indexOf(row + "-" + tp + "-" + i) < 0; });
        var i = api.pick(fresh.length ? fresh : [0, 1, 2]);
        return { key: row + "-" + tp + "-" + i, row: row, topic: tp, text: tx(TILES[row][tp][i]) };
      }));
    });
    SEEN.spark = spark.nb;
    SEEN.tiles = [];
    ROWS.forEach(function (row) { rows[row].forEach(function (t) { SEEN.tiles.push(t.key); }); });
    return { spark: spark, topics: topics, rows: rows, helpers: api.shuffle(HELPER_IDS) };
  }
})();
