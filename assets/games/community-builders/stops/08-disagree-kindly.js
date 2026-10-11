/* Community Builders of Pecan Grove · Stop 8 · Disagree Kindly / Desacuerdo con respeto
   Two neighbors at the park disagree about one part of the plan. The player hears what each wants,
   chooses to ask why, then tries idea cards until two work for both.
   Score: process only (asking why before the first try, finding both ways, careful trying). Never a side, never speed.
   Words are exact from the stop spec (08 - disagree-kindly.md). No network, no inputs, no inline styles. */
(function () {
  "use strict";
  var CB = window.CommunityBuilders; if (!CB) return;
  var LANG = (document.documentElement.lang || "en").slice(0, 2) === "es" ? "es" : "en";
  var ID = "disagree-kindly";

  /* ── words (exact) ─────────────────────────────────────────────────── */
  var WORDS = {
    en: {
      intro: "The Planning Board met last night. Now two neighbors don't agree about one part of the plan. The town has not decided yet. Can you help them find a way that works for both?",
      go: "Let's go", park: "Park",
      step1: "Step 1 of 2: Listen", step2: "Step 2 of 2: Find a way for both",
      coach1: "Tap each neighbor to hear what they want. Then ask why.",
      coach2: "Find a way both can live with. Tap 'Try it' on a card.",
      want: "What I want", ask: "Ask why", whyK: "Why it matters to me", heard: "Heard why",
      tryIt: "Try it", can: "I can live with that.",
      hard: function (why) { return "That's hard for me because " + why + "."; },
      works: "Works for both!", foundOne: "You found one! Can you find one more?",
      tried: "Tried", hardFor: function (n) { return "Hard for " + n; },
      tray: function (n) { return "Ways that work for both: " + n + " of 2"; },
      end: "Both neighbors can live with these two ideas!", see: "See my score",
      aha: "When you hear the 'why', you can often find an option both people can live with.",
      takeaway: "I can disagree kindly and look for a way that works for both.",
      tipNone: "Next time, ask both neighbors why before you try a card.",
      tipOne: function (aName) { return "Next time, ask " + aName + " why too, before you try a card."; },
      tipCareful: "Next time, read both whys again before you try another card.",
      tip100: "Great listening and great ideas! Try a new round.",
      real: "When you disagree at home or at school, try: 'I hear you. Can we find a way that works for both of us?'",
      askGrown: "Ask a grown-up", askGrownText: "'Tell me about a time you found a way that worked for both of you.'",
      gu: "For grown-ups",
      guText: "Kids hear each neighbor's reason before looking for options both can accept, like the 'Is there a plan we can all live with?' step in deliberation games. Disagreeing is normal. The skill is staying respectful and curious. Each round is about one small part of a plan, so both neighbors can come out okay. The cards echo options real towns have used or discussed: truck hours and routes, lights that point down, tree buffers, measuring noise before building, testing wells and looking for old graves before digging, and training local workers. Pecan Grove is made up, and the game does not say whether a data center should be built.",
      nbLabel: function (n) { return n + ", what I want"; },
      askLabel: function (aName) { return "Ask " + aName + " why"; },
      tryLabel: function (c) { return "Try it: " + c; }
    },
    es: {
      intro: "La Junta de Planificación se reunió anoche. Ahora dos vecinos no están de acuerdo sobre una parte del plan. El pueblo todavía no ha decidido. ¿Puedes ayudarlos a encontrar algo que les sirva a los dos?",
      go: "¡Vamos!", park: "Parque",
      step1: "Paso 1 de 2: Escucha", step2: "Paso 2 de 2: Busca algo para los dos",
      coach1: "Toca a cada vecino para escuchar lo que quiere. Luego pregúntale por qué.",
      coach2: "Busca algo que les sirva a los dos. Toca 'Pruébalo' en una tarjeta.",
      want: "Lo que quiero", ask: "Pregunta por qué", whyK: "Por qué me importa", heard: "Ya sé por qué",
      tryIt: "Pruébalo", can: "Eso me parece bien.",
      hard: function (why) { return "Eso se me hace difícil porque " + why + "."; },
      works: "¡Les sirve a los dos!", foundOne: "¡Encontraste una! ¿Puedes encontrar otra?",
      tried: "Ya la probaste", hardFor: function (n) { return "Difícil para " + n; },
      tray: function (n) { return "Opciones que les sirven a los dos: " + n + " de 2"; },
      end: "¡Los dos vecinos están bien con estas dos ideas!", see: "Ver mi puntaje",
      aha: "Cuando escuchas el porqué, muchas veces puedes encontrar una opción que les sirva a los dos.",
      takeaway: "Puedo no estar de acuerdo con respeto y buscar algo que sirva a los dos.",
      tipNone: "La próxima vez, pregúntales a los dos vecinos por qué antes de probar una tarjeta.",
      tipOne: function (aName) { return "La próxima vez, pregúntale también " + aName + " por qué, antes de probar una tarjeta."; },
      tipCareful: "La próxima vez, vuelve a leer los dos porqués antes de probar otra tarjeta.",
      tip100: "¡Escuchaste muy bien y tuviste buenas ideas! Prueba una nueva ronda.",
      real: "Cuando no estés de acuerdo en casa o en la escuela, prueba: 'Te escucho. ¿Buscamos algo que nos sirva a los dos?'",
      askGrown: "Pregúntale a un adulto", askGrownText: "'Cuéntame de una vez que encontraste algo que les sirvió a los dos.'",
      gu: "Para adultos",
      guText: "Los niños escuchan la razón de cada vecino antes de buscar opciones que los dos acepten, como el paso de '¿hay un plan con el que todos podamos vivir?' de los juegos de deliberación. Estar en desacuerdo es normal; la habilidad es seguir con respeto y curiosidad. Cada ronda trata de una parte pequeña de un plan, para que a los dos vecinos les pueda ir bien. Las tarjetas se parecen a opciones que pueblos reales han usado o discutido: horarios y rutas para camiones, luces que apuntan hacia abajo, franjas de árboles, medir el ruido antes de construir, revisar pozos y buscar tumbas antiguas antes de excavar, y capacitar a trabajadores locales. Pecan Grove es inventado, y el juego no dice si se debe construir un centro de datos.",
      nbLabel: function (n) { return n + ", lo que quiero"; },
      askLabel: function (aName) { return "Pregúntale " + aName + " por qué"; },
      tryLabel: function (c) { return "Pruébalo: " + c; }
    }
  };

  /* ── the six disagreements (exact). Each card lists the whys it works for. ── */
  var D = [
    { id: "trucks", ic: "truck", topic: ["Truck hours", "Horario de los camiones"],
      want: { A: ["I want trucks to come all day, so the work ends sooner.", "Quiero que los camiones vengan todo el día, para que la obra termine antes."],
              B: ["I want fewer trucks on Main Street.", "Quiero menos camiones en la calle principal."] },
      why: { A1: ["the sooner the work ends, the sooner our town is calm again", "cuanto antes termine la obra, antes vuelve la calma al pueblo"],
             A2: ["someone in my family drives a truck and gets paid for each trip", "alguien de mi familia maneja un camión y le pagan por viaje"],
             B1: ["kids walk to school on Main Street", "los niños caminan a la escuela por la calle principal"],
             B2: ["my home is on Main Street and big trucks shake my windows", "mi casa está en la calle principal y los camiones grandes hacen temblar mis ventanas"] },
      cards: [
        [["A1", "A2"], "Trucks come any time, day or night.", "Los camiones vienen a cualquier hora, de día o de noche."],
        [["B1", "B2"], "Only a few trucks come each day.", "Solo vienen unos pocos camiones al día."],
        [["A1", "A2", "B1"], "Trucks come all day, but stop while kids walk to and from school.", "Los camiones vienen todo el día, pero paran mientras los niños van y vuelven de la escuela."],
        [["A1", "A2", "B1"], "Crossing guards help kids, and trucks go slowly near the school.", "Hay guardias de cruce para los niños, y los camiones van despacio cerca de la escuela."],
        [["A2", "B1", "B2"], "Trucks take the long farm road around town. The work takes a few more weeks.", "Los camiones toman el camino largo de la granja, alrededor del pueblo. La obra tarda unas semanas más."],
        [["A2", "B2"], "Trucks go slowly on Main Street, so windows don't shake. The work takes a bit longer.", "Los camiones van despacio por la calle principal, para que no tiemblen las ventanas. La obra tarda un poco más."]
      ] },
    { id: "lights", ic: "moon", topic: ["Night lights", "Luces de noche"],
      want: { A: ["I want bright lights around the building all night.", "Quiero luces fuertes alrededor del edificio toda la noche."],
              B: ["I want dark nights at my house.", "Quiero noches oscuras en mi casa."] },
      why: { A1: ["night guards need to see the whole site to keep it safe", "los guardias de noche necesitan ver todo el lugar para cuidarlo"],
             A2: ["I walk home past the farm after dark, and I like a lit road", "camino a casa junto a la granja cuando ya está oscuro, y me gusta que el camino tenga luz"],
             B1: ["light shines into my bedroom and I can't sleep", "la luz entra a mi cuarto y no puedo dormir"],
             B2: ["owls and fireflies on the farm need dark nights", "los búhos y las luciérnagas de la granja necesitan noches oscuras"] },
      cards: [
        [["A1", "A2"], "Bright lights stay on all night, everywhere.", "Las luces fuertes se quedan prendidas toda la noche, por todos lados."],
        [["B1", "B2"], "No lights at all at night.", "Nada de luces en la noche."],
        [["A1", "B1"], "Lights point down, with covers, so they don't shine into homes.", "Las luces apuntan hacia abajo, con tapas, para que no alumbren las casas."],
        [["A1", "B1"], "A thick row of trees blocks the light from homes.", "Una fila tupida de árboles tapa la luz hacia las casas."],
        [["A2", "B1", "B2"], "Lights turn on only when someone walks by.", "Las luces se prenden solo cuando alguien pasa."],
        [["A2", "B1", "B2"], "Soft, warm lights only along the road. The rest stays dark.", "Luces suaves y cálidas solo junto al camino. Lo demás queda oscuro."]
      ] },
    { id: "workers", ic: "hardhat", topic: ["Local workers or a faster build", "Gente de aquí o una obra más rápida"],
      want: { A: ["I want jobs for people from Pecan Grove, even if they need training first.", "Quiero trabajos para gente de Pecan Grove, aunque primero necesiten capacitación."],
              B: ["I want expert crews, even from far away, so the work goes fast.", "Quiero equipos expertos, aunque vengan de lejos, para que la obra avance rápido."] },
      why: { A1: ["young people here need to learn a trade so they can stay", "los jóvenes de aquí necesitan aprender un oficio para poder quedarse"],
             A2: ["families here need paychecks now", "las familias de aquí necesitan sueldos ya"],
             B1: ["a long build means more months of trucks and noise", "una obra larga significa más meses de camiones y ruido"],
             B2: ["power work must be safe, so it needs experts", "el trabajo eléctrico tiene que ser seguro, por eso necesita expertos"] },
      cards: [
        [["A1", "A2"], "Hire only people from here, and train everyone first.", "Contratar solo a gente de aquí y capacitar a todos primero."],
        [["B1", "B2"], "Hire only expert crews from other places.", "Contratar solo equipos expertos de otros lugares."],
        [["A1", "B1", "B2"], "Expert crews build fast. The school starts a class to learn the trade.", "Los equipos expertos construyen rápido. La escuela abre una clase para aprender el oficio."],
        [["A1", "B1", "B2"], "Expert crews build fast. Then local people train for the jobs that stay.", "Los equipos expertos construyen rápido. Después, gente de aquí se capacita para los trabajos que se quedan."],
        [["A1", "A2", "B2"], "Local people work now as paid helpers next to experts. It takes a few more months.", "Gente de aquí trabaja ya como ayudante con sueldo, junto a los expertos. Tarda unos meses más."],
        [["A2", "B2"], "Local people get paid now for simple jobs. Experts do the power work. It takes a bit longer.", "Gente de aquí cobra ya por trabajos sencillos. Los expertos hacen lo eléctrico. Tarda un poco más."]
      ] },
    { id: "trees", ic: "tree", topic: ["Trees or parking", "Árboles o estacionamiento"],
      want: { A: ["I want a big parking lot by the gate for the workers.", "Quiero un estacionamiento grande junto a la entrada para los trabajadores."],
              B: ["I want to keep the row of big pecan trees by the road.", "Quiero que se queden los nogales grandes junto al camino."] },
      why: { A1: ["workers' cars are parked all along Main Street", "los carros de los trabajadores ocupan toda la calle principal"],
             A2: ["the night crew needs to park close to the gate", "el equipo de noche necesita estacionarse cerca de la entrada"],
             B1: ["the trees hide the building from our homes", "los árboles tapan el edificio para que no se vea desde las casas"],
             B2: ["kids climb and play in those old trees", "los niños juegan y trepan en esos árboles viejos"] },
      cards: [
        [["A1", "A2"], "Cut the trees and build a big lot by the gate.", "Cortar los árboles y hacer un estacionamiento grande junto a la entrada."],
        [["B1", "B2"], "Keep every tree and build no lot.", "Dejar todos los árboles y no hacer estacionamiento."],
        [["A1", "B1", "B2"], "Workers park at the edge of town and ride a small bus in.", "Los trabajadores se estacionan en la orilla del pueblo y llegan en un autobús pequeño."],
        [["A1", "B1", "B2"], "Build the lot far back on the farm, behind the trees.", "Hacer el estacionamiento al fondo de la granja, detrás de los árboles."],
        [["A2", "B1", "B2"], "A small lot by the gate, in an open spot. Every tree stays.", "Un estacionamiento pequeño junto a la entrada, en un lugar sin árboles. Todos los árboles se quedan."],
        [["A1", "A2", "B2"], "Cut a few young trees for a lot by the gate. The old pecans stay.", "Cortar unos árboles jóvenes para hacer un estacionamiento junto a la entrada. Los nogales viejos se quedan."]
      ] },
    { id: "engines", ic: "sound", topic: ["Engine tests", "Pruebas de los motores"],
      sub: ["The big backup engines need a short test run now and then.", "Los grandes motores de respaldo necesitan una prueba corta de vez en cuando."],
      want: { A: ["I want the engine tests done at night.", "Quiero que las pruebas de los motores sean de noche."],
              B: ["I want no engine tests at night.", "Quiero que no haya pruebas de motores de noche."] },
      why: { A1: ["kids play outside after school, and the engines are loud", "los niños juegan afuera después de la escuela, y los motores hacen mucho ruido"],
             A2: ["the clinic is busy all day, and patients need quiet", "la clínica tiene mucho trabajo todo el día, y los pacientes necesitan silencio"],
             B1: ["people need to sleep at night", "la gente necesita dormir de noche"],
             B2: ["farm animals get scared by loud sounds at night", "a los animales de las granjas los asustan los ruidos fuertes de noche"] },
      cards: [
        [["A1", "A2"], "Always test the engines late at night.", "Probar los motores siempre tarde en la noche."],
        [["B1", "B2"], "Always test the engines in the afternoon.", "Probar los motores siempre en la tarde."],
        [["A1", "B1", "B2"], "Test the engines on school mornings, while kids are inside.", "Probar los motores en las mañanas de escuela, cuando los niños están adentro."],
        [["A1", "B1", "B2"], "Measure the noise at homes first. Then test briefly on school mornings.", "Primero medir el ruido cerca de las casas. Luego probar un ratito en las mañanas de escuela."],
        [["A2", "B1", "B2"], "Test on Sunday afternoons, when the clinic is closed.", "Probar los domingos en la tarde, cuando la clínica está cerrada."],
        [["A2", "B1", "B2"], "Test right after the clinic closes, before bedtime.", "Probar justo cuando cierra la clínica, antes de la hora de dormir."]
      ] },
    { id: "digging", ic: "shovel", topic: ["Dig now or look first", "Excavar ya o revisar primero"],
      want: { A: ["I want the digging to start this month.", "Quiero que la excavación empiece este mes."],
              B: ["I want someone to check the land before anyone digs.", "Quiero que alguien revise el terreno antes de que empiecen a excavar."] },
      why: { A1: ["the dry weather ends soon, and rain turns the farm to mud", "el tiempo seco se acaba pronto, y con la lluvia la granja se vuelve puro lodo"],
             A2: ["the crew is ready, and every week of waiting costs money", "el equipo ya está listo, y cada semana de espera cuesta dinero"],
             B1: ["there may be old graves on the farm", "puede haber tumbas antiguas en la granja"],
             B2: ["our well is near the farm, and no one has tested it yet", "nuestro pozo está cerca de la granja, y nadie lo ha revisado todavía"] },
      cards: [
        [["A1", "A2"], "Start digging everywhere this month.", "Empezar a excavar en todo el terreno este mes."],
        [["B1", "B2"], "Wait a whole year and check everything.", "Esperar un año entero y revisar todo."],
        [["A1", "A2", "B1"], "A history team walks the land this week. Digging starts where they find nothing.", "Un equipo de historia recorre el terreno esta semana. Se excava donde no encuentren nada."],
        [["A1", "A2", "B1"], "The history team checks the land one part at a time. Digging follows right behind.", "El equipo de historia revisa el terreno por partes. La excavación va justo detrás."],
        [["A1", "A2", "B2"], "Test the nearby wells this week. Meanwhile, the crew builds fences and roads.", "Revisar los pozos cercanos esta semana. Mientras, el equipo hace cercas y caminos."],
        [["A1", "A2", "B2"], "Test the wells and put up mud fences first. Then dig.", "Revisar los pozos y poner cercas contra el lodo primero. Luego excavar."]
      ] }
  ];
  /* the spec's own check: exactly two cards work for both in every version */
  D.forEach(function (d) {
    [1, 2].forEach(function (v) {
      var n = d.cards.filter(function (c) { return c[0].indexOf("A" + v) !== -1 && c[0].indexOf("B" + v) !== -1; }).length;
      if (n !== 2 && window.console) console.error("Stop 8: " + d.id + " version " + v + " has " + n + " cards that work for both");
    });
  });

  /* ── small authored icons: 24-unit grid, one 2px round stroke (same style as the shell's) ── */
  var IC8 = {
    truck: '<rect x="2.5" y="6" width="11" height="9.5" rx="1.5"/><path d="M13.5 9h3.6l3.4 3.8v2.7h-7"/><circle cx="7" cy="17.5" r="2"/><circle cx="17" cy="17.5" r="2"/>',
    moon: '<path d="M20 13.6A8 8 0 1 1 10.4 4a6.3 6.3 0 0 0 9.6 9.6z"/>',
    hardhat: '<path d="M4.8 15.5a7.2 7.2 0 0 1 14.4 0"/><path d="M10 8.6v5M14 8.6v5"/><rect x="2.5" y="15.5" width="19" height="3.2" rx="1.6"/>',
    tree: '<path d="M8 17.5a3.8 3.8 0 0 1-2-7 3.6 3.6 0 0 1 3.4-5A3.2 3.2 0 0 1 12 4a3.2 3.2 0 0 1 2.6 1.5 3.6 3.6 0 0 1 3.4 5 3.8 3.8 0 0 1-2 7z"/><path d="M12 17.5V21M12 14.6l-2.2-1.9"/>',
    sound: '<path d="M12 4v16M8 8v8M16 8v8M4 10.5v3M20 10.5v3"/>',
    shovel: '<path d="M12.6 11.4 19 5"/><path d="M17.2 3.2l3.6 3.6"/><path d="M10.4 9.6l4 4-4.6 4.7a4 4 0 0 1-5.7 0 4 4 0 0 1 0-5.7z"/>',
    thumbs: '<path d="M7 10.5v9H4.6a1.1 1.1 0 0 1-1.1-1.1v-6.8a1.1 1.1 0 0 1 1.1-1.1z"/><path d="M7 10.5 10.7 4a1.9 1.9 0 0 1 3.5 1.3L13.5 9h5a2 2 0 0 1 2 2.4l-1.3 6.5a2 2 0 0 1-2 1.6H7"/>',
    think: '<circle cx="12" cy="12" r="8.6"/><path d="M8.9 10.4h.01M15.1 10.4h.01"/><path d="M9.6 15.4h4.8"/><path d="M14 7.4c.9-.4 1.9-.4 2.7.1"/>',
    leaf: '<path d="M4.5 19.5c0-8 5.2-14.5 15-15 0 9.2-6.2 15-15 15z"/><path d="M4.5 19.5 14 10"/>',
    table: '<rect x="3" y="7" width="18" height="2.6" rx="1.3"/><path d="M7.5 9.6 5 19M16.5 9.6 19 19M3.5 14.5h17"/>'
  };
  var SVGNS = "http://www.w3.org/2000/svg";
  function icon(name, cls) {
    var s = document.createElementNS(SVGNS, "svg");
    s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true"); s.setAttribute("focusable", "false");
    s.setAttribute("class", "cb-ico" + (cls ? " " + cls : ""));
    s.innerHTML = IC8[name];                                 // constant, authored markup only
    return s;
  }

  /* the park: Community center behind, the big tree in its hedge, the bench by the path */
  var PARK = [0.38, 0.31, 0.80, 0.73];

  /* ghost taps: when a screen changes under the pointer, the second tap of a double tap must not press
     whatever was drawn there (a neighbor, an idea card, the score card's "Play again"). Pointer clicks only;
     keyboard clicks (detail 0) always go through. */
  var calmUntil = 0, guarded = false;
  function calm(ms) { calmUntil = Date.now() + (ms || 350); }
  function guard() {
    var root = document.querySelector('[data-game="community-builders"]');
    if (guarded || !root) return; guarded = true;
    root.addEventListener("click", function (e) { if (e.detail > 0 && Date.now() < calmUntil) { e.stopPropagation(); e.preventDefault(); } }, true);
  }

  function run(api, stop) {
    var L = api.L, h = api.h, T = WORDS[L], W = api.W, STEPS = [null, null];
    function t2(p) { return L === "es" ? p[1] : p[0]; }
    function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
    function aNm(n) { var s = api.nm(n); return L === "es" ? (/^el /.test(s) ? "al " + s.slice(3) : "a " + s) : s; }
    document.title = stop.name + " - " + W.series;
    guard(); calm();

    /* ── the round: a new topic, a new pair, sides that swap ─────────── */
    var r = api.rec(stop.id) || {}, team = api.team();
    var round = (function () {
      var avoid = [r.lastTopic, team && team.phase === "B" ? team.s08Topic : null];
      var pool = D.filter(function (d) { return avoid.indexOf(d.id) === -1; });
      var d = api.pick(pool.length ? pool : D), v = Math.random() < 0.5 ? 1 : 2;
      var ids = api.NB.map(function (n) { return n.id; }), pairs = [], lastPair = r.lastPair || [], sides = r.sides || {};
      for (var i = 0; i < ids.length; i++) for (var j = i + 1; j < ids.length; j++) pairs.push([ids[i], ids[j]]);
      pairs = api.shuffle(pairs).filter(function (p) { return !(lastPair.indexOf(p[0]) !== -1 && lastPair.indexOf(p[1]) !== -1); });
      function flip(s) { return s === "A" ? "B" : s === "B" ? "A" : null; }
      function seat(p) {                       // a neighbor who took side A last time takes side B, and the other way round
        var n0 = flip(sides[p[0]]), n1 = flip(sides[p[1]]);
        if (n0 && n1) return n0 === n1 ? null : n0 === "A" ? p : [p[1], p[0]];
        if (n0) return n0 === "A" ? p : [p[1], p[0]];
        if (n1) return n1 === "A" ? [p[1], p[0]] : p;
        return Math.random() < 0.5 ? p : [p[1], p[0]];
      }
      var ab = null;
      for (var k = 0; k < pairs.length && !ab; k++) ab = seat(pairs[k]);
      if (!ab) ab = Math.random() < 0.5 ? pairs[0] : [pairs[0][1], pairs[0][0]];
      if (team && team.phase === "A") team.s08Topic = d.id;
      return { d: d, v: v, nb: { A: api.nbById(ab[0]), B: api.nbById(ab[1]) },
        cards: api.shuffle(d.cards.map(function (c, i) { return { i: i, tags: c[0], text: L === "es" ? c[2] : c[1] }; })) };
    })();
    var d = round.d, NBS = round.nb;
    function wantOf(side) { return t2(d.want[side]); }
    function whyOf(side) { return t2(d.why[side + round.v]); }
    function fits(card, side) { return card.tags.indexOf(side + round.v) !== -1; }
    function answer(card, side) { return fits(card, side) ? T.can : T.hard(whyOf(side)); }

    /* ── play state ──────────────────────────────────────────────────── */
    var S = { step: 1, open: { A: false, B: false }, why: { A: false, B: false }, firstTry: null, tries: [], found: [], tried: {}, last: null, msg: null };
    var board, hudEl, coachEl, ideasEl, trayEl, actionsEl, seats = {};

    function face(n, cls) { return h("span", { "class": cls, "aria-hidden": "true" }, [api.img(n.img, "")]); }
    function scene(cls, kids) {
      return api.crop(PARK, "cb-s08-scene" + (cls ? " " + cls : ""), [h("span", { "class": "cb-s08-place", "aria-hidden": "true" }, [icon("table"), h("span", { text: T.park })])].concat(kids || []));
    }
    function swap(oldEl, newEl) { if (oldEl && oldEl.parentNode) oldEl.parentNode.replaceChild(newEl, oldEl); return newEl; }

    /* ── 1 · intro over the picture ──────────────────────────────────── */
    function intro() {
      var duo = ["A", "B"].map(function (side) {
        var n = NBS[side];
        return h("span", { "class": "cb-s08-guest", "data-side": side, "aria-hidden": "true" }, [face(n, "cb-s08-guest__face"), h("b", { text: api.nmCap(n) })]);
      });
      var go = api.btn(T.go, "cb-btn--go cb-btn--big cb-s08-big", function () { calm(); play(); }, "go", true);
      api.screen([api.stopHud(stop, null), h("div", { "class": "cb-board cb-s08" }, [
        h("div", { "class": "cb-s08-stage" }, [scene("cb-s08-scene--wide", duo),
          h("div", { "class": "cb-s08-say" }, [h("p", { "class": "cb-s08-say__text", text: T.intro }), h("div", { "class": "cb-row" }, [go])])])])]);
      api.frame();
    }

    /* ── 2 · the table: two neighbors, their bubbles, six ideas, the tray ── */
    function play() {
      hudEl = api.stopHud(stop, STEPS, 0, T.step1);
      var topic = h("header", { "class": "cb-s08-topic" }, [h("span", { "class": "cb-s08-topic__ic", "aria-hidden": "true" }, [icon(d.ic)]),
        h("div", null, [h("h3", { tabindex: "-1", "data-s08": "topic", text: t2(d.topic) }), d.sub ? h("p", { text: t2(d.sub) }) : null])]);
      var pair = h("div", { "class": "cb-s08-pair" }, ["A", "B"].map(function (side) {
        var who = whoEl(side); seats[side].bubble = bubbleEl(side);
        return h("div", { "class": "cb-s08-seat", "data-side": side }, [who, seats[side].bubble]);
      }));
      coachEl = api.coach(T.coach1, "ear");
      ideasEl = h("div", { "class": "cb-s08-slot-ideas", hidden: true });
      trayEl = h("div", { "class": "cb-s08-slot-tray", hidden: true });
      actionsEl = h("div", { "class": "cb-s08-slot-actions", hidden: true });
      board = h("div", { "class": "cb-board cb-s08", "data-step": "1" }, [topic, h("div", { "class": "cb-s08-table" }, [scene(null, []), pair]), coachEl, ideasEl, trayEl, actionsEl]);
      api.screen([hudEl, board], '[data-s08="topic"]');
      api.frame();
    }

    /* a neighbor at the table: built once, then changed in place, so focus never jumps */
    function whoEl(side) {
      var n = NBS[side], st = seats[side] = {};
      st.face = h("span", { "class": "cb-s08-nb__face" }, [api.img(n.img, "")]);
      st.btn = h("button", { type: "button", "class": "cb-s08-nb", "data-s08": "nb-" + side, "aria-label": T.nbLabel(api.nmCap(n)), onclick: function () { tapNeighbor(side); } },
        [st.face, h("span", { "class": "cb-s08-nb__plate" }, [h("b", { text: api.nmCap(n) })])]);
      st.who = h("div", { "class": "cb-s08-who", "data-side": side }, [st.btn]);
      return st.who;
    }
    function heardWhy(side) {
      var st = seats[side];
      if (st.badge) return;
      st.badge = h("span", { "class": "cb-badge" }, [api.ico("check")]); st.face.appendChild(st.badge);
      st.who.appendChild(h("span", { "class": "cb-s08-heard" }, [api.ico("check"), h("span", { text: T.heard })]));
    }
    function react(side, ok) {                 // the face shows how the last idea landed: a thumbs-up or a calm thinking face
      var st = seats[side], el = h("span", { "class": "cb-s08-react is-new", "data-ok": ok ? "1" : "0", "aria-hidden": "true" }, [icon(ok ? "thumbs" : "think")]);
      if (st.react) st.face.replaceChild(el, st.react); else st.face.appendChild(el);
      st.react = el;
    }
    function bubbleEl(side, fresh) {
      var n = NBS[side];
      if (!S.open[side]) {
        return h("div", { "class": "cb-s08-bubble", "data-side": side, "data-state": "closed", onclick: function () { tapNeighbor(side); } },
          [h("span", { "class": "cb-s08-bubble__wait", "aria-hidden": "true" }, [api.ico("chat")])]);
      }
      var kids = [h("p", { "class": "cb-s08-bubble__who" }, [face(n, "cb-s08-mini"), h("b", { text: api.nmCap(n) })]),
        h("div", { "class": "cb-s08-line" + (fresh === "want" ? " is-new" : "") }, [h("span", { "class": "cb-s08-k", text: T.want }), h("p", { "class": "cb-s08-said", text: wantOf(side) })])];
      if (S.why[side]) {
        kids.push(h("div", { "class": "cb-s08-line cb-s08-line--why" + (fresh === "why" ? " is-new" : "") }, [h("span", { "class": "cb-s08-k", text: T.whyK }),
          h("p", { "class": "cb-s08-said", tabindex: "-1", "data-s08": "why-" + side, text: cap(whyOf(side)) })]));   // the spec's why, capital first letter, nothing added
      } else {
        var ask = api.btn(T.ask, "cb-btn--primary cb-s08-ask", function () { askWhy(side); }, "chat");
        ask.setAttribute("aria-label", T.askLabel(aNm(n))); ask.setAttribute("data-s08", "ask-" + side);
        kids.push(ask);
      }
      if (S.last) {
        var ok = S.last[side];
        kids.push(h("div", { "class": "cb-s08-reply" + (fresh === "reply" ? " is-new" : ""), "data-ok": ok ? "1" : "0" }, [icon(ok ? "thumbs" : "think"), h("p", { text: S.last.text[side] })]));
      }
      return h("div", { "class": "cb-s08-bubble", "data-side": side, "data-state": "open" }, kids);
    }
    function redrawBubble(side, fresh) { seats[side].bubble = swap(seats[side].bubble, bubbleEl(side, fresh)); }

    function tapNeighbor(side) {
      var n = NBS[side];
      if (S.open[side]) { api.say(api.nmCap(n) + ": " + wantOf(side) + (S.why[side] ? " " + cap(whyOf(side)) + "." : "")); return; }
      S.open[side] = true;
      seats[side].btn.classList.add("is-open");
      redrawBubble(side, "want");
      api.say(api.nmCap(n) + ": " + wantOf(side));
    }
    function askWhy(side) {
      var n = NBS[side];
      S.why[side] = true;
      heardWhy(side); redrawBubble(side, "why");
      var p = board.querySelector('[data-s08="why-' + side + '"]'); if (p) p.focus({ preventScroll: true });
      var msg = api.nmCap(n) + ": " + cap(whyOf(side)) + ". " + T.heard;
      /* listening is done only when both neighbors have said why; then step 2 and the idea cards open */
      if (S.step === 1 && S.why.A && S.why.B) { toStep2(); msg += " " + T.step2 + ". " + T.coach2; }
      api.say(msg);
    }
    function toStep2() {
      S.step = 2; board.setAttribute("data-step", "2");
      hudEl = swap(hudEl, api.stopHud(stop, STEPS, 1, T.step2));
      coachEl = swap(coachEl, api.coach(T.coach2, "bulb"));
      drawIdeas(); drawTray(); drawActions();
    }

    /* the six idea cards: drawn once; a tried card changes in place, a card that works moves to the tray */
    var cardEls = {};
    function drawIdeas() {
      var list = h("ul", { "class": "cb-s08-cards" }, round.cards.map(function (c) {
        var b = h("button", { type: "button", "class": "cb-s08-card", "data-s08": "card-" + c.i, "aria-label": T.tryLabel(c.text), onclick: function (e) { tryCard(c, e.detail === 0); } }, [
          h("span", { "class": "cb-s08-card__text", text: c.text }),
          h("span", { "class": "cb-s08-card__go", "aria-hidden": "true" }, [h("span", { text: T.tryIt }), api.ico("go")])]);
        var li = h("li", null, [b]);
        cardEls[c.i] = { li: li, btn: b };
        return li;
      }));
      ideasEl = swap(ideasEl, h("section", { "class": "cb-s08-ideas" }, [list]));
    }
    function settle(b) { b.setAttribute("aria-disabled", "true"); b.removeAttribute("aria-label"); var go = b.querySelector(".cb-s08-card__go"); if (go) b.removeChild(go); }
    function markTried(c, ok) {
      var b = cardEls[c.i].btn;
      settle(b); b.classList.add("is-tried");
      var hardFor = ["A", "B"].filter(function (s) { return !ok[s]; });
      b.appendChild(h("span", { "class": "cb-s08-card__meta" }, [h("span", { "class": "cb-s08-tried", text: T.tried })].concat(hardFor.map(function (s) {
        return h("span", { "class": "cb-s08-hardfor" }, [face(NBS[s], "cb-s08-mini"), h("span", { text: T.hardFor(api.nm(NBS[s])) })]);
      }))));
      b.appendChild(h("span", { "class": "cb-s08-card__ans" }, ["A", "B"].map(function (s) {        // shown on narrow stages, where the bubbles are out of sight
        return h("span", { "class": "cb-s08-card__a", "data-ok": ok[s] ? "1" : "0" }, [icon(ok[s] ? "thumbs" : "think"), h("span", { text: api.nmCap(NBS[s]) + ": " + answer(c, s) })]);
      })));
    }
    /* the tray: the ways that work for both */
    function drawTray(fresh) {
      var n = S.found.length;
      var slots = h("ol", { "class": "cb-s08-slots" }, [0, 1].map(function (k) {
        var c = n > k ? round.cards.filter(function (x) { return x.i === S.found[k]; })[0] : null;
        if (!c) return h("li", { "class": "cb-s08-slot", "aria-hidden": "true" }, [h("span", { "class": "cb-s08-duo is-faint" }, [icon("thumbs"), icon("thumbs")])]);
        return h("li", { "class": "cb-s08-slot is-on" + (fresh && k === n - 1 ? " is-new" : "") }, [h("span", { "class": "cb-s08-duo", "aria-hidden": "true" }, [icon("thumbs"), icon("thumbs")]),
          h("span", { "class": "cb-s08-slot__body" }, [h("span", { "class": "cb-s08-slot__text", text: c.text }), h("b", { "class": "cb-s08-slot__ok", text: T.works })])]);
      }));
      trayEl = swap(trayEl, h("section", { "class": "cb-s08-tray", "aria-labelledby": "cb-s08-tray-h" }, [
        h("p", { "class": "cb-s08-tray__h", id: "cb-s08-tray-h" }, [h("span", { "class": "cb-s08-tray__ic", "aria-hidden": "true" }, [icon("thumbs")]), h("span", { text: T.tray(n) })]), slots]));
    }
    function drawActions() {
      var done = S.found.length >= 2;
      if (!S.msg && !done) { actionsEl = swap(actionsEl, h("div", { "class": "cb-s08-slot-actions", hidden: true })); return; }
      var see = done ? api.btn(T.see, "cb-btn--go cb-btn--big cb-s08-big", function () { calm(); aha(); }, "go", true) : null;
      if (see) see.setAttribute("data-s08", "see");
      actionsEl = swap(actionsEl, h("div", { "class": "cb-actions cb-s08-actions" }, [h("div", { "class": "cb-actions__info" }, [api.fb(done ? T.end : S.msg, true)]), see]));
    }

    function tryCard(c, kb) {
      if (S.tried[c.i] || S.found.indexOf(c.i) !== -1 || S.found.length >= 2) return;
      if (!S.firstTry) S.firstTry = { A: S.why.A, B: S.why.B };
      var ok = { A: fits(c, "A"), B: fits(c, "B") }, works = ok.A && ok.B;
      S.tries.push({ i: c.i, works: works });
      S.last = { A: ok.A, B: ok.B, text: { A: answer(c, "A"), B: answer(c, "B") } };
      ["A", "B"].forEach(function (s) { react(s, ok[s]); redrawBubble(s, "reply"); });
      var words = api.nmCap(NBS.A) + ": " + S.last.text.A + " " + api.nmCap(NBS.B) + ": " + S.last.text.B;
      if (!works) {
        S.tried[c.i] = ok; S.msg = null;
        markTried(c, ok); drawActions();
        api.say(words);
        return;
      }
      S.found.push(c.i);
      var done = S.found.length >= 2;
      S.msg = done ? null : T.foundOne;
      var open = function (x) { return !S.tried[x.i] && S.found.indexOf(x.i) === -1; }, at = round.cards.indexOf(c);
      var next = round.cards.slice(at + 1).filter(open)[0] || round.cards.slice(0, at).filter(open)[0];
      var li = cardEls[c.i].li, had = kb || li.contains(document.activeElement);   // the card leaves the grid: its focus must not fall to the page
      li.parentNode.removeChild(li);
      calm(400);                                 // the grid closes up under the pointer: a quick second tap must not try the next card
      drawTray(true); drawActions();
      var leafTop = null;
      if (done) {
        round.cards.filter(open).forEach(function (x) { settle(cardEls[x.i].btn); cardEls[x.i].btn.classList.add("is-rest"); });
        if (coachEl.parentNode) coachEl.parentNode.removeChild(coachEl);
        /* bring the end of the board into view, so the action bar rests under the tray instead of floating over the two ideas */
        var br = board.getBoundingClientRect(), vh = window.innerHeight || document.documentElement.clientHeight;
        if (br.bottom > vh + 2 && board.scrollIntoView) { board.scrollIntoView({ block: "end", behavior: api.REDUCED ? "auto" : "smooth" }); leafTop = Math.max(0, br.height - vh); }
        if (had) { var see = board.querySelector('[data-s08="see"]'); if (see) see.focus({ preventScroll: true }); }
      } else if (had && next) cardEls[next.i].btn.focus({ preventScroll: true });
      leaves(leafTop);
      api.say(words + " " + T.works + " " + T.tray(S.found.length) + ". " + (done ? T.end : T.foundOne));
    }

    /* success: a few pecan leaves drift down over the part of the board the player can see */
    function leaves(atTop) {
      if (api.REDUCED) return;
      var rect = board.getBoundingClientRect(), top = atTop !== null && atTop !== undefined ? atTop : Math.max(0, -rect.top), layer = h("div", { "class": "cb-s08-leaves", "aria-hidden": "true" });
      for (var i = 0; i < 8; i++) {
        var lf = h("span", { "class": "cb-s08-leaf" }, [icon("leaf")]);
        lf.style.setProperty("--s", (30 + Math.random() * 18).toFixed(0) + "px");
        lf.style.setProperty("--x", (4 + i * 11.5 + Math.random() * 6).toFixed(1) + "%");
        lf.style.setProperty("--y", (top + Math.random() * 60).toFixed(0) + "px");
        lf.style.setProperty("--dx", ((Math.random() - 0.5) * 120).toFixed(0) + "px");
        lf.style.setProperty("--rot", ((Math.random() - 0.5) * 540).toFixed(0) + "deg");
        lf.style.setProperty("--delay", (i * 0.12).toFixed(2) + "s");
        lf.style.setProperty("--c", ["var(--cb-c3)", "var(--cb-c2)", "var(--cb-stage-2)"][i % 3]);
        layer.appendChild(lf);
      }
      board.appendChild(layer);
      setTimeout(function () { if (layer.parentNode) layer.parentNode.removeChild(layer); }, 3400);
    }

    /* ── 3 · the aha card, then the score card ───────────────────────── */
    function aha() {
      var duo = ["A", "B"].map(function (side) {
        var n = NBS[side];
        return h("span", { "class": "cb-s08-guest", "data-side": side, "aria-hidden": "true" }, [h("span", { "class": "cb-s08-guest__face" }, [api.img(n.img, ""),
          h("span", { "class": "cb-s08-react", "data-ok": "1" }, [icon("thumbs")])]), h("b", { text: api.nmCap(n) })]);
      });
      var next = api.btn(W.next, "cb-btn--go cb-btn--big cb-s08-big", function () { calm(); finish(); }, "go", true);
      api.screen([api.stopHud(stop, STEPS, 2), h("div", { "class": "cb-board cb-s08" }, [
        h("div", { "class": "cb-s08-stage cb-s08-stage--aha" }, [scene("cb-s08-scene--wide", duo),
          h("div", { "class": "cb-s08-say" }, [h("p", { "class": "cb-s08-duo cb-s08-duo--big", "aria-hidden": "true" }, [icon("thumbs"), icon("thumbs")]),
            h("p", { "class": "cb-s08-say__text", tabindex: "-1", "data-s08": "aha", text: T.aha }), h("div", { "class": "cb-row" }, [next])])])])], '[data-s08="aha"]');
      api.frame();
      api.say(T.aha);
    }
    function finish() {
      var heard = S.firstTry || { A: false, B: false };
      var careful = 15;
      S.tries.forEach(function (t, k) { if (k >= 3 && !t.works) careful -= 5; });     // the first 3 tries are free
      careful = Math.max(0, careful);
      var score = (heard.A ? 15 : 0) + (heard.B ? 15 : 0) + (S.found.length >= 1 ? 35 : 0) + (S.found.length >= 2 ? 20 : 0) + careful;
      var tip = !heard.A && !heard.B ? T.tipNone : !heard.A ? T.tipOne(aNm(NBS.A)) : !heard.B ? T.tipOne(aNm(NBS.B)) : careful < 15 ? T.tipCareful : T.tip100;
      var sides = {}, old = r.sides || {};
      for (var k in old) sides[k] = old[k];
      sides[NBS.A.id] = "A"; sides[NBS.B.id] = "B";
      var info = api.saveRound(stop.id, score, { lastRound: d.id + "-" + round.v, lastTopic: d.id, lastPair: [NBS.A.id, NBS.B.id], sides: sides });
      api.endPlay();
      var ask = h("div", { "class": "cb-tipcard cb-tipcard--real cb-s08-askgrown" }, [api.ico("chat"), h("div", null, [h("strong", { text: T.askGrown }), h("p", { text: T.askGrownText })])]);
      var card = api.scoreCard(stop, score, info, tip, T.takeaway, T.real, ask);
      var gu = api.btn(T.gu, "cb-btn--quiet", function () { api.dialog(T.gu, [h("div", { "class": "cb-dlg__body" }, [h("p", { text: T.guText })])], gu); }, "family");
      api.finishRound(stop.id, card, api.cardButtons(stop.id, api.restart(stop.id), gu));
      api.say(W.score + " " + score + " / 100");
    }

    intro();
  }

  CB.register({ id: ID, steps: [null, null], css: "08-disagree-kindly.css", run: run });
})();
