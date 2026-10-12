/* Community Builders of Pecan Grove / Constructores de comunidad de Pecan Grove
   Kids' civic-skills journey. One stop = one skill; points reward the process, never a side.
   Scores stay in this device's localStorage. An optional playtest shell can listen for progress events.
   Language follows <html lang>. */
(function () {
  "use strict";
  var root = document.querySelector('[data-game="community-builders"]');
  if (!root) return;
  var BASE = root.getAttribute("data-base") || "/assets/games/community-builders/";
  var L = (document.documentElement.lang || "en").slice(0, 2) === "es" ? "es" : "en";
  var feedbackSession = root.getAttribute("data-feedback-session") || "";
  var KEY = "pecan-grove-journey" + (/^[A-Za-z0-9_-]{16,80}$/.test(feedbackSession) ? ":" + feedbackSession : "");
  var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── words (exact, from the series design) ─────────────────────────── */
  var W = {
    en: {
      series: "Community Builders of Pecan Grove", town: "Pecan Grove, Georgia",
      intro1: "You live in Pecan Grove. The Miller family wants to sell their old farm by the creek. A company wants to build a data center there. Learn 15 ways to be a helpful neighbor while your town decides.",
      intro2: "There's no one right answer. You earn points for how well you listen, check facts and speak kindly.",
      start: "Start the journey", grownups: "For grown-ups", close: "Close", townmap: "Town map",
      grownText: "Pecan Grove is a made-up town. This game teaches skills, not sides. Building as planned, building with changes, not building, or waiting for more information can all be fair choices. Points reward listening, checking facts and kindness, never picking a side. The game asks for no names or personal information. Scores stay on this device. A personal public-education project by Ali Keyvanfar, Ph.D. Not an official KSU or Fulton County Library product.",
      stop: "Stop", next: "Next", soon: "Coming soon", back: "Back to town map", nextStop: "Next stop",
      moreSoon: "More stops are coming soon!", journey: "Journey score", open: function (n) { return "Stops open: " + n + " of 15"; },
      allStops: "Choose a stop: names and progress", mapHelp: "Town map. Use the arrow keys to scroll, or choose a stop from the list below.",
      journeyHelp: "Your journey adds your best score at each stop. Replaying can improve it; a lower score never takes points away.",
      perfect: "Perfect score saved! Try a new round to practice with different examples.", language: "Español", languageTitle: "Change language?",
      languageNote: "Your completed scores will stay saved. This unfinished round will not be kept.", languageGo: "Continue in Español",
      last5: "Last 5 tries", best: "Best", library: "Library / Class mode", who: "Who's playing?", scoreboard: "Scoreboard",
      team: "Team challenge", leave: "Leave Library mode", playing: function (a) { return "Playing: " + a; }, you: "You",
      total: "Total", starsWord: "Stars", pbest: "Personal best", improved: "Most improved",
      noImproved: "Play a stop again to earn Most improved!", everyone: "Everyone gets better by playing again.",
      clear: "Clear scoreboard", tapTurtle: "To erase, tap the Turtle.", sure: "Are you sure? This erases all scores on this device.",
      yesErase: "Yes, erase", noKeep: "No, keep them", erased: "Scores erased.", undo: "Undo",
      team1: "Team 1, pick your animal.", team2: "Team 2, pick your animal.", pickStop: "Pick a stop.",
      pass: "Pass the tablet to Team 2.", bothTeams: "Great work, both teams! Play again and switch who goes first.",
      teamLabel: function (n) { return "Team " + n; },
      score: "Your score", yourBest: "Your best", first: "First score saved! Play again to beat it.", newBest: "New personal best!",
      goodStart: "Good start! Every round is practice.", stars: function (n) { return n + " of 3 stars"; },
      tryReal: "Try it for real (with a grown-up)", again: "Play again (new round)",
      stopStars: function (n, name, s) { return "Stop " + n + ", " + name + ", " + s + " of 3 stars"; },
      stopSoon: function (n, name) { return "Stop " + n + ", " + name + ", coming soon"; },
      stopOpen: function (n, name) { return "Stop " + n + ", " + name + ", not played yet"; },
      chapters: ["Notice and understand", "Speak up well", "Find solutions", "Stay involved"],
      footer: "Made with the help of AI tools. Voices made with ElevenLabs AI. Ideas from construction research at Kennesaw State University. v0.1",
      part: function (n) { return "Part " + n + " of 3"; }
    },
    es: {
      series: "Constructores de comunidad de Pecan Grove", town: "Pecan Grove, Georgia",
      intro1: "Vives en Pecan Grove. La familia Miller quiere vender su vieja granja junto al arroyo. Una empresa quiere construir ahí un centro de datos. Aprende 15 formas de ser buen vecino mientras tu pueblo decide.",
      intro2: "No hay una sola respuesta correcta. Ganas puntos por lo bien que escuchas, revisas los datos y hablas con respeto.",
      start: "Empezar el camino", grownups: "Para adultos", close: "Cerrar", townmap: "Mapa del pueblo",
      grownText: "Pecan Grove es un pueblo inventado. Este juego enseña habilidades, no bandos. Construir como se planeó, construir con cambios, no construir o esperar más información pueden ser decisiones justas. Los puntos premian escuchar, revisar datos y respetar, nunca elegir un lado. El juego no pide nombres ni datos personales. Los puntajes se quedan en este dispositivo. Un proyecto personal de educación pública de Ali Keyvanfar, Ph.D. No es un producto oficial de KSU ni de la Biblioteca del Condado de Fulton.",
      stop: "Parada", next: "Siguiente", soon: "Próximamente", back: "Volver al mapa", nextStop: "Siguiente parada",
      moreSoon: "¡Pronto habrá más paradas!", journey: "Puntaje del camino", open: function (n) { return "Paradas abiertas: " + n + " de 15"; },
      allStops: "Elige una parada: nombres y avance", mapHelp: "Mapa del pueblo. Usa las flechas para desplazarte o elige una parada de la lista de abajo.",
      journeyHelp: "El puntaje del camino suma tu mejor puntaje de cada parada. Puedes mejorarlo al volver a jugar; un puntaje menor nunca te quita puntos.",
      perfect: "¡Puntaje perfecto guardado! Prueba otra ronda para practicar con ejemplos diferentes.", language: "English", languageTitle: "¿Cambiar de idioma?",
      languageNote: "Tus puntajes completados se conservan. Esta ronda sin terminar no se guardará.", languageGo: "Continuar en English",
      last5: "Últimos 5 intentos", best: "Mejor", library: "Modo biblioteca / clase", who: "¿Quién juega?", scoreboard: "Tabla de puntajes",
      team: "Desafío en equipo", leave: "Salir del modo biblioteca", playing: function (a) { return "Jugando: " + a; }, you: "Tú",
      total: "Total", starsWord: "Estrellas", pbest: "Récord personal", improved: "¡Mayor mejora!",
      noImproved: "¡Juega otra vez una parada para ganar Mayor mejora!", everyone: "Todos mejoran cuando vuelven a jugar.",
      clear: "Borrar tabla", tapTurtle: "Para borrar, toca la Tortuga.", sure: "¿Seguro? Esto borra todos los puntajes de este dispositivo.",
      yesErase: "Sí, borrar", noKeep: "No, conservarlos", erased: "Puntajes borrados.", undo: "Deshacer",
      team1: "Equipo 1, elige tu animal.", team2: "Equipo 2, elige tu animal.", pickStop: "Elige una parada.",
      pass: "Pasa la tableta al Equipo 2.", bothTeams: "¡Muy bien, los dos equipos! Jueguen otra vez y cambien quién empieza.",
      teamLabel: function (n) { return "Equipo " + n; },
      score: "Tu puntaje", yourBest: "Tu mejor puntaje", first: "¡Primer puntaje guardado! Juega otra vez para superarlo.", newBest: "¡Nuevo récord personal!",
      goodStart: "¡Buen comienzo! Cada ronda es práctica.", stars: function (n) { return n + " de 3 estrellas"; },
      tryReal: "Hazlo de verdad (con un adulto)", again: "Jugar otra vez (nueva ronda)",
      stopStars: function (n, name, s) { return "Parada " + n + ", " + name + ", " + s + " de 3 estrellas"; },
      stopSoon: function (n, name) { return "Parada " + n + ", " + name + ", próximamente"; },
      stopOpen: function (n, name) { return "Parada " + n + ", " + name + ", sin jugar"; },
      chapters: ["Observa y entiende", "Habla bien", "Busca soluciones", "Sigue participando"],
      footer: "Hecho con ayuda de herramientas de IA. Voces hechas con IA de ElevenLabs. Ideas de investigación en construcción de Kennesaw State University. v0.1",
      part: function (n) { return "Parte " + n + " de 3"; }
    }
  }[L];

  var STOPS = [
    ["notice-the-signs", "Notice the Signs", "Fíjate en las señales", 1], ["ask-a-good-question", "Ask a Good Question", "Haz una buena pregunta", 1],
    ["listen-to-every-neighbor", "Listen to Every Neighbor", "Escucha a cada vecino", 1], ["fact-or-rumor", "Fact or Rumor?", "¿Dato o rumor?", 1],
    ["map-what-could-change", "Map What Could Change", "Mapa de lo que puede cambiar", 1], ["who-decides", "Who Decides?", "¿Quién decide?", 1],
    ["speak-up-kindly", "Speak Up Kindly", "Habla con respeto", 2], ["disagree-kindly", "Disagree Kindly", "Desacuerdo con respeto", 2],
    ["include-every-voice", "Include Every Voice", "Incluye todas las voces", 2], ["match-a-fix", "Match a Fix", "Une problema y solución", 3],
    ["weigh-the-tradeoffs", "Weigh the Trade-offs", "Pesa lo bueno y lo difícil", 3], ["make-a-fair-deal", "Make a Fair Deal", "Haz un trato justo", 3],
    ["spread-the-word-right", "Spread the Word Right", "Comparte bien la información", 3], ["keep-watch", "Keep Watch", "Vigila las promesas", 4],
    ["build-the-future-together", "Build the Future Together", "Construyamos el futuro juntos", 4]
  ].map(function (s, i) { return { id: s[0], name: L === "es" ? s[2] : s[1], chap: s[3], n: i + 1 }; });
  var PLAYABLE = { "listen-to-every-neighbor": 1, "fact-or-rumor": 1 };
  /* stop token centres on the 1376 x 768 town map */
  var POS = [[9, 39], [15, 52], [18, 77], [31, 58], [31, 24], [43, 44], [46, 72], [57, 52], [68, 30], [65, 73], [78, 53], [88, 74], [91, 50], [75, 18], [91, 20]];
  var CHAP = ["#56B4E9", "#E69F00", "#009E73", "#CC79A7"];

  var NB = [
    { id: "lee", en: "Ms. Lee", es: "la Sra. Lee", esCap: "La Sra. Lee", role: { en: "Clinic Nurse", es: "Enfermera de la clínica" }, plain: { en: "Nurse", es: "Enfermera" }, img: "ms-lee", pos: [14, 56] },
    { id: "johnson", en: "Mr. Johnson", es: "el Sr. Johnson", esCap: "El Sr. Johnson", role: { en: "Third-Generation Farmer", es: "Agricultor de tercera generación" }, plain: { en: "Farmer", es: "Agricultor" }, img: "mr-johnson", pos: [20, 26] },
    { id: "ana", en: "Ana", es: "Ana", esCap: "Ana", role: { en: "Master Electrician", es: "Electricista maestra" }, plain: { en: "Electrician", es: "Electricista" }, img: "ana", pos: [34, 57] },
    { id: "ruth", en: "Grandma Ruth", es: "la abuela Ruth", esCap: "La abuela Ruth", role: { en: "Town Historian & Elder", es: "Historiadora del pueblo" }, plain: { en: "Keeps the town's stories", es: "Guarda las historias del pueblo" }, img: "grandma-ruth", pos: [45, 25] },
    { id: "patel", en: "Mr. Patel", es: "el Sr. Patel", esCap: "El Sr. Patel", role: { en: "Main Street Merchant", es: "Comerciante de la calle principal" }, plain: { en: "Bakery owner", es: "Dueño de la panadería" }, img: "mr-patel", pos: [62, 38] },
    { id: "jayden", en: "Jayden", es: "Jayden", esCap: "Jayden", role: { en: "High School Tech Lead", es: "Líder de tecnología de la escuela" }, plain: { en: "Student", es: "Estudiante" }, img: "jayden", pos: [80, 55] }
  ];
  function nm(n) { return L === "es" ? n.es : n.en; }
  function nmCap(n) { return L === "es" ? n.esCap : n.en; }

  /* Stop 3 line sets: [hope, hopeTag, worry, worryTag] */
  var SETS = {
    A: {
      lee: [["I hope ambulances can always reach the clinic fast.", "Ojalá las ambulancias siempre lleguen rápido a la clínica."], "roads",
        ["I worry the big backup engines could make smoky air. I want to know how often they run.", "Me preocupa que los grandes motores de respaldo echen humo. Quiero saber cada cuánto los prenden."], "land"],
      johnson: [["I hope my grandkids can farm this land too.", "Ojalá mis nietos también puedan cultivar esta tierra."], "future",
        ["I worry mud could reach the creek and my well.", "Me preocupa que el lodo llegue al arroyo y a mi pozo."], "land"],
      ana: [["I hope there are good jobs here for people who live here.", "Ojalá haya buenos trabajos para la gente de aquí."], "jobs",
        ["I worry the jobs will end when the building is done.", "Me preocupa que los empleos se acaben cuando terminen de construir."], "jobs"],
      ruth: [["I hope my grandson can find good work here.", "Ojalá mi nieto encuentre buen trabajo aquí."], "jobs",
        ["I worry old graves could be hidden on the farm. I want someone to look before digging.", "Me preocupa que haya tumbas antiguas escondidas en la granja. Quiero que alguien las busque antes de excavar."], "land"],
      patel: [["I hope new workers come to my bakery, so I can hire more people.", "Ojalá los nuevos trabajadores vengan a mi panadería y yo pueda contratar a más gente."], "jobs",
        ["I worry big trucks will crowd Main Street for months.", "Me preocupa que los camiones grandes llenen la calle principal por meses."], "roads"],
      jayden: [["I hope our school gets tech classes, so students can work in tech here someday.", "Ojalá la escuela tenga clases de tecnología, para que los estudiantes trabajen en eso aquí algún día."], "future",
        ["I worry young people will move away to find work.", "Me preocupa que los jóvenes se vayan a buscar trabajo a otro lado."], "future"]
    },
    B: {
      lee: [["I hope the clinic always has power, even in big storms.", "Ojalá la clínica siempre tenga luz, aunque haya tormentas fuertes."], null,
        ["I worry bright lights all night could shine into bedrooms.", "Me preocupa que las luces fuertes toda la noche alumbren los cuartos."], "nights"],
      johnson: [["I hope my cows and fields stay healthy.", "Ojalá mis vacas y mis campos sigan sanos."], "places",
        ["I worry no one will test my well before they dig.", "Me preocupa que nadie revise mi pozo antes de excavar."], "water"],
      ana: [["I hope I can teach young people here to be electricians.", "Ojalá pueda enseñarles a los jóvenes de aquí a ser electricistas."], null,
        ["I worry the creek could get muddy. I fish there with my kids.", "Me preocupa que el arroyo se llene de lodo. Ahí pesco con mis hijos."], "water"],
      ruth: [["I hope we keep the old chapel and the stories of this land.", "Ojalá cuidemos la vieja capilla y las historias de esta tierra."], "places",
        ["I worry my power bill will go up.", "Me preocupa que suba mi recibo de luz."], "costs"],
      patel: [["I hope new workers come to eat on Main Street.", "Ojalá los nuevos trabajadores vengan a comer a la calle principal."], null,
        ["I worry the rent for my shop will go up while they build.", "Me preocupa que suba la renta de mi local mientras construyen."], "costs"],
      jayden: [["I hope we keep the big pecan trees where we play.", "Ojalá cuidemos los nogales grandes donde jugamos."], "places",
        ["I worry a hum at night could keep my little sister awake.", "Me preocupa que un zumbido de noche no deje dormir a mi hermanita."], "nights"]
    }
  };
  var WISH = {
    land: ["Take care of the land, water and air", "Cuidar la tierra, el agua y el aire"], jobs: ["Good jobs for people who live here", "Buenos trabajos para la gente de aquí"],
    roads: ["Safe, open roads", "Calles seguras y abiertas"], future: ["Kids can grow up and stay in Pecan Grove", "Que los niños puedan crecer y quedarse en Pecan Grove"],
    water: ["Clean water in the creek and our wells", "Agua limpia en el arroyo y en los pozos"], nights: ["Quiet, dark nights for sleeping", "Noches tranquilas y oscuras para dormir"],
    costs: ["Fair costs for families and shops", "Costos justos para familias y negocios"], places: ["Keep the trees, fields and old places", "Cuidar los árboles, los campos y los lugares antiguos"]
  };
  var WISHES = { A: ["land", "jobs", "roads", "future"], B: ["water", "nights", "costs", "places"] };
  /* the slot hint for each wish still to find: one or two words, so the player knows what to look for in the hopes and worries */
  var WHINT = {
    land: ["Land, water and air?", "¿Tierra, agua y aire?"], jobs: ["Jobs?", "¿Trabajos?"], roads: ["Roads?", "¿Calles?"], future: ["Kids' future here?", "¿El futuro de los niños aquí?"],
    water: ["Water?", "¿Agua?"], nights: ["Nights?", "¿Noches?"], costs: ["Costs?", "¿Costos?"], places: ["Trees and old places?", "¿Árboles y lugares antiguos?"]
  };
  function t2(pair) { return L === "es" ? pair[1] : pair[0]; }

  var S3 = {
    en: { title: "Listen to Every Neighbor", p1: "Tap each neighbor to hear what they hope and what they worry about.", hope: "Hope", worry: "Worry", listened: "Listened",
      p2: "Find two neighbors who want the same thing. Read each hope and each worry: a worry shows what someone wants, too. Tap one neighbor, then another.",
      picked: "Picked. Now tap one more neighbor.", shared: "Shared wish!", already: "You already found that one.", toFind: "Shared wishes to find",
      noplan: "These two don't share one of the 4 wishes here. Do you see something else they share? Talk about it with someone. Then try another pair.",
      found: function (n) { return "Shared wishes found: " + n + " of 4"; }, done: "I'm done looking", all: "And one wish everyone shares: to be heard.",
      p3t: "Who said this?", p3: "Tap the neighbor who said it.", line: function (n) { return "Line " + n + " of 4"; },
      right: function (n) { return "Yes! " + n + " said that."; }, wrong: function (n) { return "Good try. " + n + " said that."; },
      can: "I can listen to every neighbor before I make up my mind.",
      tipSkip: function (n) { return "Next time, listen to " + n + " too!"; }, tipPairs: "Next time, read each neighbor's hope and worry before you tap.",
      tipWish: "Next time, try more pairs. Most neighbors share something.", tipLine: "Next time, read each hope and worry slowly.", tip100: "Great listening! Try a new round.",
      real: "Ask someone at home: 'What do you hope for our neighborhood?' Listen to the whole answer.",
      listenedN: function (n) { return n + " of 6 neighbors listened"; } },
    es: { title: "Escucha a cada vecino", p1: "Toca a cada vecino para escuchar lo que espera y lo que le preocupa.", hope: "Espera", worry: "Le preocupa", listened: "Escuchado",
      p2: "Busca a dos vecinos que quieran lo mismo. Lee cada esperanza y cada preocupación: una preocupación también muestra lo que alguien quiere. Toca a un vecino y luego a otro.",
      picked: "Ya elegiste. Ahora toca a otro vecino.", shared: "¡Deseo compartido!", already: "Ya encontraste ese.", toFind: "Deseos compartidos por encontrar",
      noplan: "Estos dos no comparten uno de los 4 deseos de aquí. ¿Ves otra cosa que compartan? Coméntalo con alguien. Luego prueba otra pareja.",
      found: function (n) { return "Deseos compartidos: " + n + " de 4"; }, done: "Ya terminé de buscar", all: "Y un deseo que todos comparten: que los escuchen.",
      p3t: "¿Quién dijo esto?", p3: "Toca al vecino que lo dijo.", line: function (n) { return "Frase " + n + " de 4"; },
      right: function (n) { return "¡Sí! Lo dijo " + n + "."; }, wrong: function (n) { return "Buen intento. Lo dijo " + n + "."; },
      can: "Puedo escuchar a cada vecino antes de formarme una opinión.",
      tipSkip: function (n) { return ("La próxima vez, escucha también a " + n + ".").replace(" a el ", " al "); }, tipPairs: "La próxima vez, lee lo que espera y lo que le preocupa a cada vecino antes de tocar.",
      tipWish: "La próxima vez, prueba más parejas. Casi todos los vecinos comparten algo.", tipLine: "La próxima vez, lee despacio cada esperanza y cada preocupación.", tip100: "¡Escuchaste muy bien! Prueba una nueva ronda.",
      real: "Pregúntale a alguien en casa: '¿Qué te gustaría para nuestra comunidad?' Escucha toda la respuesta.",
      listenedN: function (n) { return n + " de 6 vecinos escuchados"; } }
  }[L];

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
  var S4 = {
    en: { title: "Fact or Rumor?", intro: "The Planning Board meets next week. People in town are saying lots of things. Some are checked facts. Some are rumors. Some, nobody knows yet.",
      start: "Start sorting", claim: function (n) { return "Claim " + n + " of 5"; }, peek: "Peek at the source",
      how: "Tap 'Peek at the source' to see who said it and how they know. Then tap the box where it goes.",
      flyerTag: "Flyer", chatTag: "Family chat", whoT: "Who told you?", howT: "How do they know?", whenT: "When?",
      b: { fact: "Checked fact", rumor: "Rumor", dontknow: "We don't know yet" },
      put: function (b) { return "Put in " + b; },
      ok: { fact: "Yes! We checked what the dated proposal says. A proposal is not a promise that it will happen.", rumor: "Yes! Nobody can show how they know. Rumors come from hopeful and worried people.", dontknow: "Yes! It isn't studied or decided yet. 'We don't know yet' is an honest answer." },
      notQuite: function (h) { return "Good try. The source says: " + h; }, nextClaim: "Next claim", sorted: function (n) { return "Claim " + n + " of 5 sorted."; },
      at: function (n) { return n + ", at the counter"; }, flyer: "A flyer on the board", chat: "A message in the family chat",
      can: "I can check who said it and how they know.", your5: "Your 5 claims",
      tipNb: function (n) { return "Next time, peek first, even when " + n + " tells you."; }, tipPeek: "Next time, tap 'Peek at the source' before you sort.",
      tipRumor: "Next time, if nobody can show how they know, choose Rumor.", tipDk: "Next time, look for a study or a decision that isn't done yet.",
      tipFact: "Next time, check what the source actually proves. A dated proposal tells us what is proposed, not what will happen.", tip100: "Great checking! Try a new round with new claims.",
      real: "Next time you hear 'Everyone says…', ask a grown-up: 'Who said it? How do they know?'",
      gu: "For grown-ups: this stop",
      guText: "Kids check a claim's source before sorting it as a checked fact, a rumor or 'we don't know yet'. Rumors in the game come from both sides, for example 'the lights will go out' and 'it uses no water at all'. Health effects for a site that isn't built yet go under 'we don't know yet'." },
    es: { title: "¿Dato o rumor?", intro: "La Junta de Planificación se reúne la próxima semana. En el pueblo se dicen muchas cosas. Algunas son datos revisados. Otras son rumores. Y otras, nadie las sabe todavía.",
      start: "Empezar a clasificar", claim: function (n) { return "Frase " + n + " de 5"; }, peek: "Mira la fuente",
      how: "Toca 'Mira la fuente' para ver quién lo dijo y cómo lo sabe. Luego toca la caja donde va.",
      flyerTag: "Volante", chatTag: "Chat de la familia", whoT: "¿Quién te lo dijo?", howT: "¿Cómo lo sabe?", whenT: "¿Cuándo?",
      b: { fact: "Dato revisado", rumor: "Rumor", dontknow: "Todavía no sabemos" },
      put: function (b) { return "Poner en " + b; },
      ok: { fact: "¡Sí! Revisamos lo que dice la propuesta con fecha. Una propuesta no es una promesa de que eso sucederá.", rumor: "¡Sí! Nadie puede mostrar cómo lo sabe. Los rumores vienen de gente con esperanza y de gente preocupada.", dontknow: "¡Sí! Todavía no se ha estudiado ni decidido. 'Todavía no sabemos' es una respuesta honesta." },
      notQuite: function (h) { return "Buen intento. La fuente dice: " + h; }, nextClaim: "Siguiente frase", sorted: function (n) { return "Frase " + n + " de 5 clasificada."; },
      at: function (n) { return n + ", en el mostrador"; }, flyer: "Un volante en el tablero", chat: "Un mensaje en el chat de la familia",
      can: "Puedo revisar quién lo dijo y cómo lo sabe.", your5: "Tus 5 frases",
      tipNb: function (n) { return "La próxima vez, mira la fuente primero, aunque te lo diga " + n + "."; }, tipPeek: "La próxima vez, toca 'Mira la fuente' antes de clasificar.",
      tipRumor: "La próxima vez, si nadie puede mostrar cómo lo sabe, elige Rumor.", tipDk: "La próxima vez, fíjate si hay un estudio o una decisión que todavía no termina.",
      tipFact: "La próxima vez, revisa qué demuestra la fuente. Una propuesta con fecha dice qué se propone, no qué sucederá.", tip100: "¡Revisaste muy bien! Prueba una nueva ronda con frases nuevas.",
      real: "La próxima vez que oigas 'Todos dicen…', pregúntale a un adulto: '¿Quién lo dijo? ¿Cómo lo sabe?'",
      gu: "Para adultos: esta parada",
      guText: "Los niños revisan la fuente de una afirmación antes de clasificarla como dato revisado, rumor o 'todavía no sabemos'. En el juego, los rumores vienen de los dos lados, por ejemplo 'se va a ir la luz' y 'no usa nada de agua'. Los efectos en la salud de un sitio que aún no existe son 'todavía no sabemos'." }
  }[L];
  var SRC = {
    plan: [["It's written in the plan the company sent to Regional Review. Anyone can read it at the library.", "Está escrito en el plan que la empresa mandó a la Revisión Regional. Cualquiera lo puede leer en la biblioteca."], ["The plan is dated September 3.", "El plan tiene fecha del 3 de septiembre."]],
    air: [["The State Environment Office is still checking the air permit.", "La Oficina Estatal del Medio Ambiente todavía está revisando el permiso de calidad del aire."], ["It isn't finished yet.", "Todavía no ha terminado."]],
    sound: [["The sound study isn't done yet.", "El estudio de ruido todavía no está listo."], ["It's due in the spring.", "Va a estar listo en la primavera."]],
    tax: [["The Development Board hasn't decided about tax breaks yet.", "La Junta de Desarrollo todavía no ha decidido sobre las reducciones de impuestos."], ["It meets in November.", "Se reúne en noviembre."]]
  };
  var RUMOR_HOW = [["A friend of a friend told them.", "Se lo contó un amigo de un amigo."], ["They heard it at a ball game. Nobody checked.", "Lo oyó en un partido. Nadie lo revisó."],
    ["Lots of people passed it on. Nobody knows who said it first.", "Mucha gente lo fue pasando. Nadie sabe quién lo dijo primero."], ["Someone saw it online and can't find it again.", "Alguien lo vio en internet y ya no lo encuentra."]];
  var RUMOR_WHEN = ["No date. Nobody remembers.", "Sin fecha. Nadie se acuerda."];
  /* [right basket, voice, source, en, es] */
  var CLAIMS = [
    ["rumor", "hopeful", null, "It uses no water at all.", "No usa nada de agua."],
    ["rumor", "worried", null, "Every well in town will dry up next year.", "Todos los pozos del pueblo se van a secar el próximo año."],
    ["fact", null, "plan", "The company's September 3 proposal lists daily water use and says how much it expects to use.", "La propuesta de la empresa del 3 de septiembre indica el uso diario de agua y dice cuánta espera usar."],
    ["rumor", "hopeful", null, "Everyone in Pecan Grove will get a job there.", "Todos en Pecan Grove van a conseguir trabajo ahí."],
    ["rumor", "worried", null, "Not one job will go to people from here.", "Ni un solo trabajo va a ser para gente de aquí."],
    ["fact", null, "plan", "The company's September 3 proposal lists many building jobs and fewer jobs after opening.", "La propuesta de la empresa del 3 de septiembre indica muchos empleos de construcción y menos después de abrir."],
    ["rumor", "worried", null, "The lights will go out in every house.", "Se va a ir la luz en todas las casas."],
    ["rumor", "hopeful", null, "Everyone's power bill will go down.", "A todos nos va a bajar el recibo de luz."],
    ["rumor", "worried", null, "The backup engines will run all day, every day.", "Los motores de respaldo van a estar prendidos todo el día, todos los días."],
    ["fact", null, "plan", "The company's September 3 proposal says the backup engines would run during power cuts and short tests.", "La propuesta de la empresa del 3 de septiembre dice que los motores de respaldo se prenderían durante cortes de luz y pruebas cortas."],
    ["rumor", "hopeful", null, "Every student will get a new laptop next month.", "Todos los estudiantes van a recibir una laptop nueva el próximo mes."],
    ["dontknow", "hopeful", "tax", "The school will get lots of new money.", "La escuela va a recibir mucho dinero nuevo."],
    ["dontknow", "hopeful", "sound", "You won't hear any hum from the farm fence.", "Desde la cerca de la granja no se va a oír ningún zumbido."],
    ["dontknow", "worried", "sound", "The hum will keep kids awake at night.", "El zumbido no va a dejar dormir a los niños en la noche."],
    ["dontknow", "worried", "air", "Smoke from the backup engines will reach the clinic.", "El humo de los motores de respaldo va a llegar a la clínica."]
  ];

  var ANIMALS = [["fox", "Fox", "Zorro", "#E69F00"], ["owl", "Owl", "Búho", "#0072B2"], ["turtle", "Turtle", "Tortuga", "#009E73"], ["rabbit", "Rabbit", "Conejo", "#CC79A7"],
    ["deer", "Deer", "Venado", "#D55E00"], ["heron", "Heron", "Garza", "#56B4E9"], ["bee", "Bee", "Abeja", "#F0E442"], ["otter", "Otter", "Nutria", "#6B6B6B"]]
    .map(function (a) { return { id: a[0], name: L === "es" ? a[2] : a[1], ring: a[3] }; });
  var ICON = {
    fox: '<path d="M10 14 18 30h28l8-16-12 8H22z" fill="#E69F00"/><path d="M18 30c2 12 8 20 14 20s12-8 14-20z" fill="#E69F00"/><path d="M26 42c2 4 4 6 6 6s4-2 6-6z" fill="#fff"/><circle cx="25" cy="36" r="2.4" fill="#1A1A1A"/><circle cx="39" cy="36" r="2.4" fill="#1A1A1A"/><circle cx="32" cy="45" r="2" fill="#1A1A1A"/>',
    owl: '<ellipse cx="32" cy="36" rx="18" ry="20" fill="#0072B2"/><path d="M16 20l6 8M48 20l-6 8" stroke="#0072B2" stroke-width="5" stroke-linecap="round"/><circle cx="25" cy="32" r="7" fill="#fff"/><circle cx="39" cy="32" r="7" fill="#fff"/><circle cx="25" cy="32" r="3" fill="#1A1A1A"/><circle cx="39" cy="32" r="3" fill="#1A1A1A"/><path d="m29 40 3 5 3-5z" fill="#E69F00"/>',
    turtle: '<ellipse cx="32" cy="40" rx="20" ry="13" fill="#009E73"/><path d="M14 40a18 13 0 0 1 36 0" fill="#00785A"/><circle cx="52" cy="38" r="6" fill="#4CB38F"/><circle cx="54" cy="36" r="1.6" fill="#1A1A1A"/><rect x="16" y="49" width="7" height="6" rx="3" fill="#4CB38F"/><rect x="40" y="49" width="7" height="6" rx="3" fill="#4CB38F"/><path d="M24 33h16M32 28v12" stroke="#4CB38F" stroke-width="2.5"/>',
    rabbit: '<ellipse cx="24" cy="18" rx="5" ry="13" fill="#CC79A7"/><ellipse cx="40" cy="18" rx="5" ry="13" fill="#CC79A7"/><circle cx="32" cy="40" r="16" fill="#CC79A7"/><circle cx="26" cy="38" r="2.4" fill="#1A1A1A"/><circle cx="38" cy="38" r="2.4" fill="#1A1A1A"/><path d="M29 45c2 2 4 2 6 0" stroke="#1A1A1A" stroke-width="2" fill="none" stroke-linecap="round"/>',
    deer: '<path d="M20 8v10l-6-4M20 18l6-6M44 8v10l6-4M44 18l-6-6" stroke="#8A4B22" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M18 24h28l-6 22c-2 6-14 6-16 0z" fill="#D55E00"/><circle cx="26" cy="32" r="2.4" fill="#1A1A1A"/><circle cx="38" cy="32" r="2.4" fill="#1A1A1A"/><ellipse cx="32" cy="44" rx="4" ry="3" fill="#1A1A1A"/>',
    heron: '<path d="M30 54V34c0-10 4-18 10-22" stroke="#56B4E9" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="42" cy="12" r="6" fill="#56B4E9"/><path d="M47 12h12l-12 3z" fill="#E69F00"/><circle cx="43" cy="10" r="1.6" fill="#1A1A1A"/><ellipse cx="26" cy="44" rx="12" ry="8" fill="#56B4E9"/>',
    bee: '<ellipse cx="22" cy="22" rx="9" ry="7" fill="#E5EEF7" stroke="#1A1A1A" stroke-width="1.5"/><ellipse cx="42" cy="22" rx="9" ry="7" fill="#E5EEF7" stroke="#1A1A1A" stroke-width="1.5"/><ellipse cx="32" cy="38" rx="17" ry="13" fill="#F0E442" stroke="#1A1A1A" stroke-width="1.5"/><path d="M26 26v24M38 26v24" stroke="#1A1A1A" stroke-width="4"/><circle cx="17" cy="36" r="1.8" fill="#1A1A1A"/>',
    otter: '<circle cx="32" cy="36" r="18" fill="#6B6B6B"/><circle cx="16" cy="22" r="5" fill="#6B6B6B"/><circle cx="48" cy="22" r="5" fill="#6B6B6B"/><ellipse cx="32" cy="42" rx="10" ry="7" fill="#C9C1B6"/><circle cx="26" cy="33" r="2.4" fill="#1A1A1A"/><circle cx="38" cy="33" r="2.4" fill="#1A1A1A"/><ellipse cx="32" cy="40" rx="3" ry="2" fill="#1A1A1A"/><path d="M22 42h-6M42 42h6" stroke="#1A1A1A" stroke-width="1.5"/>'
  };
  var BASKET_ICON = {
    fact: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3 27 7v8c0 7-5 12-11 14C10 27 5 22 5 15V7z" fill="#E9F2EE" stroke="#1E5A47" stroke-width="2"/><path d="m11 16 4 4 7-8" stroke="#1E5A47" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    rumor: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M9 22a6 6 0 0 1 0-12 8 8 0 0 1 15 2 5 5 0 0 1 0 10z" fill="#F8EED8" stroke="#7A5200" stroke-width="2"/><path d="M12 26h3M18 28h3" stroke="#7A5200" stroke-width="2" stroke-linecap="round"/></svg>',
    dontknow: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="12" fill="#E5EEF7" stroke="#1D5C93" stroke-width="2"/><path d="M12.5 12.5a3.5 3.5 0 1 1 5 3.2c-1 .5-1.5 1.3-1.5 2.3v1" stroke="#1D5C93" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="16" cy="23" r="1.5" fill="#1D5C93"/></svg>'
  };
  var STAR_ON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.6 2.9 6 6.5.9-4.7 4.5 1.1 6.5L12 17.4 6.2 20.5l1.1-6.5-4.7-4.5 6.5-.9z" fill="#E69F00" stroke="#7A5200" stroke-width="1.2" stroke-linejoin="round"/></svg>';
  var STAR_OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.6 2.9 6 6.5.9-4.7 4.5 1.1 6.5L12 17.4 6.2 20.5l1.1-6.5-4.7-4.5 6.5-.9z" fill="none" stroke="#7A5200" stroke-width="1.4" stroke-linejoin="round"/></svg>';

  /* ── helpers ───────────────────────────────────────────────────────── */
  function h(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === "text") e.textContent = attrs[k];
      else if (k === "html") e.innerHTML = attrs[k];          // constant, authored markup only
      else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== null && attrs[k] !== undefined && attrs[k] !== false) e.setAttribute(k, attrs[k] === true ? "" : attrs[k]);
    }
    (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return e;
  }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function starsFor(s) { return s >= 90 ? 3 : s >= 70 ? 2 : s >= 40 ? 1 : 0; }
  function img(name, alt, cls, eager) { return h("img", { src: BASE + "img/" + name + ".webp", alt: alt || "", "class": cls || null, loading: eager ? null : "lazy", decoding: "async" }); }
  /* storybook objects (DESIGN.md "Things on a scene"): constant, authored markup on the 64-unit grid, styled by .cb-story in cb.css */
  function story(markup, cls) {
    var s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("viewBox", "0 0 64 64"); s.setAttribute("aria-hidden", "true"); s.setAttribute("focusable", "false");
    s.setAttribute("class", "cb-story" + (cls ? " " + cls : ""));
    s.innerHTML = markup;                                       // constant, authored markup only
    return s;
  }
  /* a person with no painted portrait yet: their initial in a ring, never a symbol or an object in their place */
  function mono(name, cls) { return h("span", { "class": "cb-mono" + (cls ? " " + cls : ""), "aria-hidden": "true" }, [h("span", { text: (name || "?").trim().charAt(0).toUpperCase() })]); }

  /* ── storage (device only) ─────────────────────────────────────────── */
  var store = load();
  function load() {
    try { var s = JSON.parse(localStorage.getItem(KEY) || "null"); if (s && s.version === 1 && s.players) return s; } catch (e) { /* storage blocked: the game still works */ }
    return { version: 1, players: { you: { stops: {} } }, current: "you" };
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* ignore */ } }
  function player() { var p = store.current || "you"; if (!store.players[p]) store.players[p] = { stops: {} }; return store.players[p]; }
  function rec(stopId, pl) { pl = pl || player(); return pl.stops[stopId] || null; }
  function saveRound(stopId, score, extra) {
    var pl = player(), r = pl.stops[stopId] || { best: 0, first: score, last5: [], rounds: 0, all: [] };
    var wasFirst = r.rounds === 0, newBest = !wasFirst && score > r.best;
    r.rounds += 1; r.best = Math.max(r.best, score); if (wasFirst) r.first = score;
    r.last5.push(score); if (r.last5.length > 5) r.last5.shift();
    r.all = (r.all || []).concat([score]).slice(-50);
    for (var k in extra) r[k] = extra[k];
    pl.stops[stopId] = r; save();
    if (wasFirst) justDone = stopId;
    return { first: wasFirst, newBest: newBest, best: r.best };
  }
  function journeyOf(pl) { var t = 0; for (var k in pl.stops) t += pl.stops[k].best || 0; return t; }
  function playerLabel() { var p = store.current; if (!p || p === "you") return W.you; var a = ANIMALS.filter(function (x) { return x.id === p; })[0]; return a ? a.name : W.you; }

  /* ── icons: authored on a 24-unit grid, one 2px round stroke ───────── */
  var SVGNS = "http://www.w3.org/2000/svg";
  var IC = {
    back: '<path d="M14.5 5.5 8 12l6.5 6.5"/>',
    go: '<path d="M5 12h13"/><path d="m12.5 6 6 6-6 6"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    close: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
    lock: '<rect x="5.5" y="10.5" width="13" height="9.5" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
    sun: '<circle cx="12" cy="12" r="3.8"/><path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M5.6 18.4l1.6-1.6M16.8 7.2l1.6-1.6"/>',
    cloud: '<path d="M7.5 18.5h9a3.8 3.8 0 0 0 .5-7.6 5.6 5.6 0 0 0-10.8 1.2 3.2 3.2 0 0 0 1.3 6.4z"/>',
    bulb: '<path d="M9.5 17.5h5M10.5 20.5h3"/><path d="M12 3.5a5.8 5.8 0 0 0-3.4 10.5c.6.5 1 1.2 1 2v1.5h4.8V16c0-.8.4-1.5 1-2A5.8 5.8 0 0 0 12 3.5z"/>',
    home: '<path d="M4.5 11 12 4.8l7.5 6.2V19a1.5 1.5 0 0 1-1.5 1.5h-3.5v-5.5h-5v5.5H6A1.5 1.5 0 0 1 4.5 19z"/>',
    replay: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 4.5v4h4"/>',
    people: '<circle cx="9" cy="8" r="3"/><path d="M3.5 19.5c.5-3.2 2.8-5 5.5-5s5 1.8 5.5 5"/><circle cx="17" cy="9" r="2.4"/><path d="M16 14.2c2.3.1 4 1.7 4.5 4.8"/>',
    family: '<circle cx="8.5" cy="5.8" r="2.4"/><path d="M5.5 20.5v-6a3 3 0 0 1 6 0v6"/><circle cx="16.5" cy="10.3" r="1.9"/><path d="M14.2 20.5v-3.8a2.3 2.3 0 0 1 4.6 0v3.8"/>',
    peek: '<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5.5 5.5"/>',
    trophy: '<path d="M8 4.5h8V9a4 4 0 0 1-8 0z"/><path d="M8 6.5H5.5a2.8 2.8 0 0 0 2.9 3.9M16 6.5h2.5a2.8 2.8 0 0 1-2.9 3.9M12 13v3.5M10 16.5h4V20h-4zM8.5 20h7"/>',
    star: '<path d="m12 3.2 2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.5l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z"/>',
    flyer: '<rect x="5.5" y="3.5" width="13" height="17" rx="2"/><path d="M9 8h6M9 11.5h6M9 15h3.5"/>',
    chat: '<path d="M5 5.5h14A1.5 1.5 0 0 1 20.5 7v8.5A1.5 1.5 0 0 1 19 17h-7.5L7 20.5V17H5a1.5 1.5 0 0 1-1.5-1.5V7A1.5 1.5 0 0 1 5 5.5z"/>',
    expand: '<path d="M4.5 9V4.5H9M19.5 9V4.5H15M4.5 15v4.5H9M19.5 15v4.5H15"/>',
    shrink: '<path d="M9 4.5V9H4.5M15 4.5V9h4.5M9 19.5V15H4.5M15 19.5V15h4.5"/>',
    ear: '<path d="M7 9.5a5 5 0 0 1 10 0c0 3-2.6 3.8-3.2 6.2-.4 1.9-1.6 3.3-3.5 3.3a3 3 0 0 1-2.8-2"/><path d="M10 10a2 2 0 0 1 4 0c0 1.2-1 1.6-1.5 2.4"/>',
    voice: '<path d="M4.5 9.5h3l4.5-4v13l-4.5-4h-3z"/><path d="M15.5 9.2a4 4 0 0 1 0 5.6M18.2 6.6a7.6 7.6 0 0 1 0 10.8"/>',
    voiceOff: '<path d="M4.5 9.5h3l4.5-4v13l-4.5-4h-3z"/><path d="m16 9.5 5 5M21 9.5l-5 5"/>',
    sliders: '<path d="M4.5 7.5h8M17.5 7.5h2M4.5 16.5h2M11.5 16.5h8"/><circle cx="15" cy="7.5" r="2.5"/><circle cx="9" cy="16.5" r="2.5"/>',
    captions: '<rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="M10.6 10.2a2.3 2.3 0 1 0 0 3.6M16.6 10.2a2.3 2.3 0 1 0 0 3.6"/>',
    keys: '<rect x="3" y="6.5" width="18" height="11" rx="2.5"/><path d="M7 10.5h.01M10.5 10.5h.01M14 10.5h.01M17.5 10.5h.01M8 14h8"/>',
    hand: '<path d="M8.5 12.5V6a1.5 1.5 0 0 1 3 0v5.5V4.8a1.5 1.5 0 0 1 3 0v6.7V6.3a1.5 1.5 0 0 1 3 0v8.2a6 6 0 0 1-6 6h-.6a6 6 0 0 1-4.8-2.4l-2.6-3.5a1.5 1.5 0 0 1 2.3-1.9z"/>'
  };
  function ico(name, cls) {
    var s = document.createElementNS(SVGNS, "svg");
    s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true"); s.setAttribute("focusable", "false");
    s.setAttribute("class", "cb-ico" + (cls ? " " + cls : ""));
    s.innerHTML = IC[name];                                   // constant, authored markup only
    return s;
  }
  /* the Pecan Grove crest: a pecan tree over a stepping-stone path */
  var CREST = '<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><circle cx="20" cy="20" r="18.5" fill="#1E5A47" stroke="#F7F4EE" stroke-width="1.5"/>' +
    '<path d="M20 29.5v-8" stroke="#A9492A" stroke-width="3" stroke-linecap="round"/>' +
    '<g fill="#F7F4EE"><circle cx="14.2" cy="17.4" r="4.6"/><circle cx="20" cy="13.4" r="5.6"/><circle cx="25.8" cy="17.4" r="4.6"/><rect x="11" y="16.5" width="18" height="5.2" rx="2.6"/></g>' +
    '<g fill="#E69F00"><circle cx="10.5" cy="31.2" r="1.5"/><circle cx="15.5" cy="32.6" r="1.5"/><circle cx="20.5" cy="33" r="1.5"/><circle cx="25.5" cy="32.4" r="1.5"/><circle cx="30.2" cy="31" r="1.5"/></g></svg>';
  var X = {
    en: { parts3: ["Listen", "Find shared wishes", "Who said this?"], of: function (a, b) { return a + " of " + b; }, fsOn: "Full screen", fsOff: "Exit full screen", restored: "Scores are back.",
      voice: "Voice", voiceOn: "Voice is on", voiceOff: "Voice is off", replay: "Hear it again",
      settings: "Settings", setSub: "How the game sounds and looks. This device remembers it.", keepPlaying: "Keep playing", on: "On", off: "Off",
      secVoice: "Sound", auto: "Read new lines by itself", autoHint: "When this is off, tap the speaker button at the end of a line to hear it.",
      vol: "Volume", speed: "Speed", speeds: ["Slower", "Normal", "Faster"], sample: "Hear a sample", sampleStop: "Stop the sample",
      secCap: "Captions", words: "Light up each word as it is read", capBar: "Caption bar", capHint: "Shows who is talking and what they say, at the bottom of the game.",
      capSize: "Caption size", sizes: ["Small", "Medium", "Large"], capOn: "Captions are on", capOff: "Captions are off",
      secHelp: "Screen and helpers", circles: "Circle what to tap", circlesHint: "When the voice says what to tap, a marker circle shows where it is.",
      calm: "Calm motion", calmHint: "Fewer things move and slide.", calmSys: "Your device asks for less motion, so this stays on.",
      secKeys: "Keys", keysNote: "On a computer, these keys work while you play.",
      keys: [["Esc", "Open Settings (the voice waits)"], ["M", "Voice on or off"], ["R", "Hear it again"], ["S", "Stop the voice"], ["C", "Caption bar on or off"],
        ["F", "Full screen"], ["?", "Show these keys"], ["Tab", "Move to the next button"], ["Enter|Space", "Choose"]],
      reset: "Go back to the usual settings", resetDone: "Settings are back to the usual.", guide: "Lucía", guide2: "Theo" },
    es: { parts3: ["Escucha", "Deseos compartidos", "¿Quién dijo esto?"], of: function (a, b) { return a + " de " + b; }, fsOn: "Pantalla completa", fsOff: "Salir de pantalla completa", restored: "Los puntajes volvieron.",
      voice: "Voz", voiceOn: "La voz está activada", voiceOff: "La voz está desactivada", replay: "Escuchar otra vez",
      settings: "Ajustes", setSub: "Cómo suena y se ve el juego. Este dispositivo lo recuerda.", keepPlaying: "Seguir jugando", on: "Sí", off: "No",
      secVoice: "Sonido", auto: "Leer sola cada línea nueva", autoHint: "Si esto está apagado, toca el botón de la bocina al final de una línea para escucharla.",
      vol: "Volumen", speed: "Velocidad", speeds: ["Más lenta", "Normal", "Más rápida"], sample: "Escuchar un ejemplo", sampleStop: "Detener el ejemplo",
      secCap: "Subtítulos", words: "Iluminar cada palabra mientras se lee", capBar: "Barra de subtítulos", capHint: "Muestra quién habla y lo que dice, abajo del juego.",
      capSize: "Tamaño de los subtítulos", sizes: ["Pequeño", "Mediano", "Grande"], capOn: "Los subtítulos están activados", capOff: "Los subtítulos están desactivados",
      secHelp: "Pantalla y ayudas", circles: "Encerrar en un círculo lo que hay que tocar", circlesHint: "Cuando la voz dice qué tocar, un círculo de marcador muestra dónde está.",
      calm: "Movimiento tranquilo", calmHint: "Menos cosas se mueven y se deslizan.", calmSys: "Tu dispositivo pide menos movimiento, así que esto queda activado.",
      secKeys: "Teclas", keysNote: "En una computadora, estas teclas funcionan mientras juegas.",
      keys: [["Esc", "Abrir Ajustes (la voz espera)"], ["M", "Activar o desactivar la voz"], ["R", "Escuchar otra vez"], ["S", "Detener la voz"], ["C", "Activar o desactivar los subtítulos"],
        ["F", "Pantalla completa"], ["?", "Mostrar estas teclas"], ["Tab", "Ir al siguiente botón"], ["Enter|Espacio", "Elegir"]],
      reset: "Volver a los ajustes de siempre", resetDone: "Los ajustes volvieron a los de siempre.", guide: "Lucía", guide2: "Theo" }
  }[L];

  /* ── shell ─────────────────────────────────────────────────────────── */
  var live = h("p", { "class": "cb-live", "aria-live": "polite" });
  var bar = h("div", { "class": "cb-bar" });
  var main = h("div", { "class": "cb-main" });
  var foot = h("p", { "class": "cb-foot", text: W.footer });
  root.innerHTML = "";
  [bar, main, foot, live].forEach(function (e) { root.appendChild(e); });
  var mode = "title", inStop = false, justDone = null, team = null, baseTitle = document.title, uid = 0;
  var feedbackStop = null, feedbackScore = null;
  function say(t) { var to = root.querySelector("dialog[open] .cb-live") || live; to.textContent = ""; setTimeout(function () { to.textContent = t; }, 30); }
  function setTitle(t) { document.title = t ? t + " · " + W.series : baseTitle; }
  function animalOf(id) { return ANIMALS.filter(function (x) { return x.id === id; })[0] || null; }
  function nbById(id) { return NB.filter(function (n) { return n.id === id; })[0]; }
  function btn(label, cls, fn, icon, iconAfter) {
    var b = h("button", { type: "button", "class": "cb-btn" + (cls ? " " + cls : ""), onclick: fn });
    if (icon && !iconAfter) b.appendChild(ico(icon));
    b.appendChild(h("span", { text: label }));
    if (icon && iconAfter) b.appendChild(ico(icon));
    return b;
  }
  function animalFace(a) { var s = h("span", { "class": "cb-face", "aria-hidden": "true" }); s.innerHTML = '<svg viewBox="0 0 64 64" focusable="false">' + ICON[a.id] + "</svg>"; s.style.setProperty("--ring", a.ring); return s; }
  /* full screen: the stage becomes the whole screen (the game, not the page) */
  var canFS = !!(root.requestFullscreen || root.webkitRequestFullscreen) && document.fullscreenEnabled !== false;
  function fsEl() { return document.fullscreenElement || document.webkitFullscreenElement || null; }
  function toggleFS() {
    try {
      if (fsEl()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else { var p = (root.requestFullscreen || root.webkitRequestFullscreen).call(root); if (p && p.catch) p.catch(function () {}); }
    } catch (e) { /* the browser said no: the game keeps working in the page */ }
  }
  function fsBtn(iconOnly) {
    if (!canFS) return null;
    var on = !!fsEl();
    return h("button", { type: "button", "class": "cb-btn cb-btn--onstage cb-fs" + (iconOnly ? " cb-fs--icon" : ""), "aria-label": on ? X.fsOff : X.fsOn, onclick: toggleFS },
      [ico(on ? "shrink" : "expand"), iconOnly ? null : h("span", { text: on ? X.fsOff : X.fsOn })]);
  }
  function syncFS() {
    var on = !!fsEl(); root.classList.toggle("is-fs", on);
    [].forEach.call(root.querySelectorAll(".cb-fs"), function (b) {
      var icon = b.querySelector("svg"); if (icon) b.replaceChild(ico(on ? "shrink" : "expand"), icon);
      var t = b.querySelector("span"); if (t) t.textContent = on ? X.fsOff : X.fsOn; b.setAttribute("aria-label", on ? X.fsOff : X.fsOn);
    });
  }
  document.addEventListener("fullscreenchange", syncFS);
  document.addEventListener("webkitfullscreenchange", syncFS);
  function renderBar() {
    bar.innerHTML = ""; bar.hidden = mode === "stop";
    if (bar.hidden) return;
    var brand = h("p", { "class": "cb-brand" }); brand.innerHTML = CREST; brand.appendChild(h("span", { text: W.town }));
    bar.appendChild(brand);
    if (mode === "map") bar.appendChild(h("ul", { "class": "cb-bar__key" }, W.chapters.map(function (c, i) {
      var li = h("li", null, [h("i", { "aria-hidden": "true" }), (i + 1) + ". " + c]); li.style.setProperty("--cb-chap", CHAP[i]); return li;
    })));
    var a = store.current && store.current !== "you" ? animalOf(store.current) : null;
    if (a) { var c = h("button", { type: "button", "class": "cb-chip", onclick: function () { openWho(c); } }, [animalFace(a), h("span", { text: W.playing(a.name) })]); bar.appendChild(c); }
    var lang = languageBtn(); if (lang) bar.appendChild(lang);
    bar.appendChild(setBtn(false)); bar.appendChild(voiceBtn(false));
    var f = fsBtn(false); if (f) bar.appendChild(f);
  }
  function languageBtn() {
    var other = L === "es" ? "en" : "es", alternate = document.querySelector('a[hreflang="' + other + '"]');
    var path = root.getAttribute("data-language-url") || (alternate && alternate.getAttribute("href"));
    if (!path) return null;
    var url;
    try { url = new URL(path, location.href); if (url.origin !== location.origin) return null; } catch (e) { return null; }
    var b = btn(W.language, "cb-btn--onstage cb-language", function () {
      if (inStop) dialog(W.languageTitle, [h("p", { text: W.languageNote }),
        btn(W.languageGo, "cb-btn--go", function () { vStop(); location.assign(url.href); })], b);
      else { vStop(); location.assign(url.href); }
    });
    b.setAttribute("lang", other); return b;
  }
  function screen(kids, focusSel) {
    vMark(vEl, false); vEl = null;                            // a new screen: the voice stops unless the same line is shown again
    vInkClear();
    if (mode !== "stop") vHeard = {};
    main.innerHTML = ""; kids.forEach(function (k) { if (k) main.appendChild(k); });
    root.setAttribute("data-screen", mode); renderBar();
    progressEvent();
    var f = focusSel ? main.querySelector(focusSel) : null;
    if (!f) { f = main.querySelector("h2"); if (f) f.setAttribute("tabindex", "-1"); }
    if (f && acted) f.focus({ preventScroll: true });
    guard();
  }
  // The separate playtest panel can follow the current activity without reading engine internals.
  function progressEvent() {
    var stop = mode === "stop" && feedbackStop ? STOPS.filter(function (s) { return s.id === feedbackStop; })[0] : null;
    var phase = stop ? (feedbackScore === null ? "playing" : "result") : mode;
    var detail = { stopId: stop ? stop.id : null, stopN: stop ? stop.n : 0,
      phase: phase, score: stop ? feedbackScore : null, journey: journeyOf(player()) };
    root.setAttribute("data-current-stop", String(detail.stopN));
    root.setAttribute("data-feedback-phase", phase);
    root.setAttribute("data-feedback-score", detail.score === null ? "" : String(detail.score));
    if (typeof window.CustomEvent === "function" && typeof document.dispatchEvent === "function") {
      document.dispatchEvent(new window.CustomEvent("cb:screen", { detail: detail }));
    }
  }
  var acted = false, nudged = false;
  var tapX = -99, tapY = -99, swapAt = -1e9, swapX = -99, swapY = -99;
  root.addEventListener("click", function (e) {
    acted = true;
    if (!e.isTrusted || e.detail === 0) return;             // keyboard and scripted clicks are never blocked
    if (performance.now() - swapAt < 350 && Math.abs(e.clientX - swapX) < 30 && Math.abs(e.clientY - swapY) < 30) { e.preventDefault(); e.stopPropagation(); return; }
    tapX = e.clientX; tapY = e.clientY;
  }, true);
  function guard() { swapAt = performance.now(); swapX = tapX; swapY = tapY; }
  root.addEventListener("keydown", function () { acted = true; }, true);
  function frame(whole) {                  // keep the stage in view when the screen changes under the player
    if (!acted) return;
    if (fsEl() === root) { if (root.scrollTop > 4) root.scrollTo({ top: 0, behavior: REDUCED ? "auto" : "smooth" }); return; }
    var r = root.getBoundingClientRect();
    if (r.top < -4 || (whole && r.bottom > window.innerHeight + 4 && r.top > 4)) root.scrollIntoView({ block: "start", behavior: REDUCED ? "auto" : "smooth" });
  }
  function coach(text, icon) { return h("p", { "class": "cb-coach" }, [ico(icon || "bulb"), h("span", { text: text })]); }
  function fb(text, ok) { return text ? h("div", { "class": "cb-feedback" + (ok ? " is-ok" : "") }, [ico(ok ? "check" : "bulb"), h("p", { text: text })]) : null; }

  /* ── voice: when a screen shows one of its key lines (voice/index.js maps the on-screen text to a clip), the guide or
     neighbor reads it and each word lights up as it is said (read-along). A small speaker button at the end of the line
     replays it. Nothing plays before the player's first tap; the Voice switch is remembered on this device. Lines inside
     [data-cb-novoice] are never read (a quiz quote would give the answer away). No voice files: the game is just quiet. ── */
  var VKEY = "pecan-grove-voice", vOn = true, vIdx = null, vClips = {}, vKeys = null, vLoading = false;
  var vAudio = null, vEl = null, vQueue = [], vLast = { f: "", t: -1e9 }, vRead = null, vRaf = 0, vLastItem = null, vLastEl = null;
  var vHeard = {};                                            // guide lines already read on this visit to a stop (the town map starts a new visit)

  /* ── settings: how the game sounds and looks (the Settings button, or Esc). Remembered on this device only. ── */
  var SKEY = "pecan-grove-settings", SYS_CALM = REDUCED, RATES = [0.85, 1, 1.15], SIZES = ["s", "m", "l"];
  var CFG_DEF = { voice: true, auto: true, vol: 0.9, rate: 1, words: true, cap: false, capSize: "m", circles: true, calm: false };
  var CFG = cfgLoad();
  function cfgLoad() {
    var c = {}, k, s = null;
    for (k in CFG_DEF) c[k] = CFG_DEF[k];
    try {
      s = JSON.parse(localStorage.getItem(SKEY) || "null");
      if (!s && localStorage.getItem(VKEY) === "off") s = { voice: false };   // the Voice switch from before Settings existed
    } catch (e) { /* storage blocked: the usual settings */ }
    if (s && typeof s === "object") for (k in CFG_DEF) if (typeof s[k] === typeof CFG_DEF[k]) c[k] = s[k];
    c.vol = Math.min(1, Math.max(0, Math.round(c.vol * 10) / 10));
    if (RATES.indexOf(c.rate) < 0) c.rate = 1;
    if (SIZES.indexOf(c.capSize) < 0) c.capSize = "m";
    return c;
  }
  function cfgSave() { try { localStorage.setItem(SKEY, JSON.stringify(CFG)); localStorage.setItem(VKEY, CFG.voice ? "on" : "off"); } catch (e) { /* ignore */ } }
  function applyCalm() { REDUCED = SYS_CALM || CFG.calm; root.classList.toggle("is-calm", CFG.calm && !SYS_CALM); }
  vOn = CFG.voice; applyCalm();

  /* the caption bar: who is talking and the words being said, a sentence at a time, at the bottom of the stage.
     It copies on-screen words, so screen readers skip it (they read the page itself) and the voice never reads it. */
  var cap = h("div", { "class": "cb-cap", "aria-hidden": "true", "data-cb-novoice": "", "data-size": CFG.capSize }), capBox = h("p", { "class": "cb-cap__box" });
  cap.appendChild(capBox); cap.hidden = true; root.insertBefore(cap, foot);   // above the footer line when the stage ends on screen
  function vWho(f) {
    var id = f.replace(/^..\//, "").replace(/\.mp3$/, ""), m = /^nb-([a-z]+)-/.exec(id), n = m ? nbById(m[1]) : null;
    return n ? nmCap(n) : /^s15-theo/.test(id) ? X.guide2 : X.guide;
  }
  function capChunks(ws) {                                    // a sentence, or about a dozen words, per caption
    var out = [], s = 0;
    ws.forEach(function (w, i) {
      var n = i - s + 1;
      if (i === ws.length - 1 || (n >= 3 && /[.!?…]["”»)]?$/.test(w)) || (n >= 12 && /[,;:]$/.test(w)) || n >= 16) { out.push([s, i]); s = i + 1; }
    });
    return out;
  }
  function capPlace() {                                       // sit above the sticky action bar when it is on screen
    var bar = main.querySelector(".cb-actions"), b = 14;
    if (bar && getComputedStyle(bar).position === "sticky") {
      var r = bar.getBoundingClientRect(), vb = fsEl() === root ? root.getBoundingClientRect().bottom : window.innerHeight;
      if (r.top < vb && r.bottom > 0) b = Math.max(14, Math.round(vb - r.top + 10));
    }
    cap.style.setProperty("--cb-cap-b", b + "px");
  }
  function capDraw(i) {                                       // i: the spoken word now (-1 before the first one)
    var R = vRead; if (!R || !R.box || !R.ch.length) return;
    var k = 0; if (i >= 0) while (k < R.ch.length - 1 && R.ch[k][1] < i) k++;
    if (k !== R.ck) {
      R.ck = k; R.box.innerHTML = "";
      var line = h("span", { "class": "cb-cap__line" });
      for (var j = R.ch[k][0]; j <= R.ch[k][1]; j++) { if (j > R.ch[k][0]) line.appendChild(document.createTextNode(" ")); line.appendChild(h("span", { "class": "cb-cap__w", text: R.cw[j] })); }
      R.box.appendChild(h("b", { "class": "cb-cap__who", text: R.who })); R.box.appendChild(line);
      R.capW = line.children; if (R.box === capBox) capPlace();
    }
    for (var q = 0; q < R.capW.length; q++) R.capW[q].classList.toggle("is-now", CFG.words && q === i - R.ch[k][0]);
  }
  function vNorm(t) { return (t || "").replace(/\s+/g, " ").trim(); }
  function vTok(w) { return (w || "").toLowerCase().replace(/[^0-9a-záéíóúüñ']/g, ""); }
  function vLoad() {
    if (vIdx || vLoading) return; vLoading = true;
    var s = h("script", { src: BASE + "voice/index.js" });
    s.onload = function () { var V = window.CB_VOICE || {}; vIdx = V[L] || {}; vClips = V.clips || {}; vScan([main].concat([].slice.call(root.querySelectorAll("dialog[open]")))); };
    s.onerror = function () { vIdx = {}; };
    document.head.appendChild(s);
  }
  function vMark(el, on) { if (el) el.classList.toggle("is-speaking", on); }
  function vUnread() {                                        // clear the read-along highlight
    if (vRaf) cancelAnimationFrame(vRaf); vRaf = 0;
    if (vRead) { if (vRead.on) vRead.on.classList.remove("is-now"); if (vRead.hud) vRead.hud.classList.remove("is-now"); }
    vRead = null; cap.hidden = true;
  }
  function vStop() { vQueue = []; vUnread(); if (vAudio) { vAudio.pause(); vAudio = null; } vMark(vEl, false); vEl = null; }
  function vAlign(E, S) {                                     // where the line's shown words sit among the spoken words
    var best = 0, bd = null;
    for (var d = 1 - E.length; d < S.length; d++) {
      var m = 0; for (var i = 0; i < E.length; i++) if (E[i] && E[i] === S[i + d]) m++;
      if (m > best) { best = m; bd = d; }
    }
    return best >= Math.min(E.length, S.length) * 0.6 ? bd : null;
  }
  /* ── voice cues: when the voice names something to tap, a hand-drawn marker circle draws itself around it, so a
     young player sees what the words point at. Each cue: the words that trigger it (English, Spanish), what to circle
     (a CSS selector, or {t: button text}), and how many at most. Keyed by clip id; "s02-coach-" covers every worry. ── */
  var CUES = {
    "s01-past": [["tap today", "toca hoy", ".cb-s01-view[data-view=today]", 1]],
    "s02-coach-": [["one tile in each row", "una ficha en cada fila", ".cb-s02-row", 3], ["tap ask it", "toca pregúntalo", { en: "Ask it", es: "Pregúntalo" }, 1]],
    "s03-p1": [["tap each neighbor", "toca a cada vecino", ".cb-nbr", 6]],
    "s03-p2": [["tap one neighbor", "toca a un vecino", ".cb-note", 2]],
    "s03-p3": [["tap the neighbor", "toca al vecino", ".cb-face-btn", 6]],
    "s04-how": [["peek at the source", "mira la fuente", { en: "Peek at the source", es: "Mira la fuente" }, 1], ["the box", "la caja", ".cb-basket", 3]],
    "s05-q1": [["tap a place", "toca un lugar", ".cb-s05-place", 6]],
    "s05-q2": [["tap a neighbor", "toca a un vecino", ".cb-face-btn", 6]],
    "s06-who": [["tap the desk", "toca el escritorio", ".cb-s06-desk", 7]],
    "s07-build": [["one tile in each row", "una ficha en cada fila", ".cb-s07-tile", 3]],
    "s07-who": [["tap who", "toca para", ".cb-s07-helper", 6]],
    "s08-c1": [["tap each neighbor", "toca a cada vecino", ".cb-s08-nb", 2]],
    "s08-c2": [["try it", "pruébalo", { en: "Try it", es: "Pruébalo" }, 3]],
    "s09-instr": [["empty chair", "silla vacía", ".cb-s09-chair", 5]],
    "s10-c1": [["tap a problem", "toca un problema", ".cb-s10-prob", 6]],
    "s10-c2": [["tap a fix", "toca una solución", ".cb-s10-fix__main", 6]],
    "s11-p1": [["tap each signpost", "toca cada letrero", ".cb-s11-sign", 4]],
    "s11-q1": [["tap a neighbor", "toca a un vecino", ".cb-s11-nb, .cb-face-btn", 6]],
    "s11-q2": [["tap a neighbor", "toca a un vecino", ".cb-s11-nb, .cb-face-btn", 6]],
    "s11-p3": [["tap a change", "toca un cambio", ".cb-s11-chg", 4]],
    "s12-s1": [["pick 4 promises", "elige 4 promesas", ".cb-s12-card", 8]],
    "s12-s3": [["tap each fuzzy part", "toca cada parte", ".cb-s12-fuzzy", 6]],
    "s13-tap": [["tap a card", "toca una tarjeta", ".cb-s13-card", 6]],
    "s14-s1": [["its clue", "su pista", ".cb-s14-clue", 6], ["no clue found", "no encontré pista", ".cb-s14-none", 1]],
    "s14-s2": [["a kind follow-up", "un seguimiento", ".cb-s14-fu", 6]],
    "s15-plan": [["tap a place", "toca un lugar", ".cb-s15-place", 5]],
    "s15-theo2": [["one yearly check-in", "una revisión", ".cb-s15-check", 3]],
    "s15-lucia3": [["invite one person", "invita a una persona", ".cb-s15-person", 6]]
  };
  var vInkLayer = null, vInkTimers = [];
  function vCues(f, c) {                                      // the clock time of each cue in this clip
    var id = f.replace(/^..\//, "").replace(/\.mp3$/, ""), list = CUES[id] || (/^s02-coach-/.test(id) ? CUES["s02-coach-"] : null);
    if (!list || !c) return [];
    var S = c.s.split(" ").map(vTok), out = [];
    list.forEach(function (q) {
      var P = q[L === "es" ? 1 : 0].split(" ").map(vTok);
      for (var i = c.h || 0; i + P.length <= S.length; i++) {
        var ok = true; for (var j = 0; j < P.length; j++) if (S[i + j].indexOf(P[j]) !== 0) { ok = false; break; }
        if (ok) { out.push({ at: c.t[i], what: q[2], max: q[3], done: false }); break; }
      }
    });
    return out;
  }
  function vTargets(what, max) {
    var all = typeof what === "string" ? [].slice.call(root.querySelectorAll(what))
      : [].slice.call(root.querySelectorAll("button, [role=tab]")).filter(function (b) { return vNorm(b.textContent).indexOf(what[L]) >= 0; });
    return all.filter(function (e) { var r = e.getBoundingClientRect(); return r.width > 4 && r.height > 4 && !e.closest("[hidden], .cb-vh"); }).slice(0, max || 1);
  }
  function vInkClear() {
    vInkTimers.forEach(clearTimeout); vInkTimers = [];
    if (vInkLayer) vInkLayer.innerHTML = "";
  }
  function vCircle(el, k) {                                   // one marker loop around el, a little wobbly, overlapping where it closes
    if (!vInkLayer || !vInkLayer.isConnected) { vInkLayer = h("div", { "class": "cb-ink", "aria-hidden": "true" }); root.appendChild(vInkLayer); }
    var R = root.getBoundingClientRect(), r = el.getBoundingClientRect(), pad = Math.max(8, Math.min(16, r.height * 0.18));
    var w = r.width + pad * 2, hh = r.height + pad * 2, x = r.left - R.left + root.scrollLeft - pad, y = r.top - R.top + root.scrollTop - pad;
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 " + w.toFixed(1) + " " + hh.toFixed(1)); svg.setAttribute("class", "cb-ink__loop");
    svg.style.setProperty("left", x.toFixed(1) + "px"); svg.style.setProperty("top", y.toFixed(1) + "px");
    svg.style.setProperty("width", w.toFixed(1) + "px"); svg.style.setProperty("height", hh.toFixed(1) + "px");
    var cx = w / 2, cy = hh / 2, rx = w / 2 - 3, ry = hh / 2 - 3, a0 = -2.2 + k * 0.7, d = "";
    for (var i = 0; i <= 56; i++) {
      var u = i / 56, a = a0 + u * Math.PI * 2 * 1.1, wob = 1 + 0.03 * Math.sin(3 * a + k) + 0.02 * Math.sin(5 * a + 2 * k), grow = 1 - 0.07 * u;
      d += (i ? " L" : "M") + (cx + Math.cos(a) * rx * wob * (1.02 - 0.04 * u)).toFixed(1) + " " + (cy + Math.sin(a) * ry * wob * grow).toFixed(1);
    }
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path"); path.setAttribute("d", d);
    svg.appendChild(path); vInkLayer.appendChild(svg);
    var len = path.getTotalLength(); path.style.setProperty("--len", len.toFixed(0));
    vInkTimers.push(setTimeout(function () { svg.classList.add("is-out"); }, 3000));
    vInkTimers.push(setTimeout(function () { svg.remove(); }, 3500));
  }
  function vCue(q) { vTargets(q.what, q.max).forEach(function (el, k) { vCircle(el, k); }); }
  function vFollow(a, item, el) {                             // light each shown word while it is said
    vUnread();
    var c = vClips[item.f]; if (!c || !el) return;
    var S = c.s.split(" ").map(vTok), map = [];                // map[i]: the shown word for spoken word i, across every part of the line
    ((el._vParts || [el]).filter(function (p) { return p.isConnected; })).forEach(function (p) {
      var spans = [].slice.call(p.querySelectorAll(".cb-w")), d = vAlign(spans.map(function (s) { return vTok(s.textContent); }), S);
      if (d !== null) spans.forEach(function (s, j) { if (j + d >= 0 && !map[j + d]) map[j + d] = s; });
    });
    vRead = { t: c.t, map: map, cur: -2, on: null, hud: c.h ? root.querySelector(".cb-stophud__h") : null, h: c.h, cues: CFG.circles ? vCues(item.f, c) : [],
      cw: c.s.split(" "), who: vWho(item.f), ck: -1, capW: [], box: null };
    vRead.ch = capChunks(vRead.cw);
    var set = el.closest(".cb-set");                           // the sample in Settings plays into the caption preview there
    if (set) vRead.box = set.querySelector(".cb-set__cap .cb-cap__box");
    else if (CFG.cap && !el.closest("dialog")) { vRead.box = capBox; cap.hidden = false; }   // a window's own words are right there in it
    capDraw(-1);
    (function tick() {
      if (!vRead || vAudio !== a) return;
      var ms = a.currentTime * 1000, t = vRead.t, i = -1;
      vRead.cues.forEach(function (q) { if (!q.done && a.currentTime > 0 && ms >= q.at) { q.done = true; if (CFG.circles) vCue(q); } });
      if (a.currentTime > 0 && ms < t[t.length - 1]) { i = 0; while (i + 1 < t.length - 1 && t[i + 1] <= ms) i++; }
      if (i !== vRead.cur) {
        if (vRead.on) vRead.on.classList.remove("is-now");
        vRead.on = CFG.words && i >= 0 ? vRead.map[i] || null : null;
        if (vRead.on) vRead.on.classList.add("is-now");
        if (vRead.hud) vRead.hud.classList.toggle("is-now", CFG.words && i >= 0 && i < vRead.h);   // the spoken stop name lights the stop's title
        capDraw(i);
        vRead.cur = i;
      }
      vRaf = requestAnimationFrame(tick);
    })();
  }
  function vPlay(item, el) {
    if (vAudio) vAudio.pause();
    vUnread(); vMark(vEl, false);
    var a = new Audio(BASE + "voice/" + item.f); vAudio = a; vEl = el || null; vMark(vEl, true); vLast = { f: item.f, t: performance.now() };
    a.volume = CFG.vol; a.defaultPlaybackRate = a.playbackRate = CFG.rate;   // speed changes keep the pitch; the read-along follows the audio clock
    if (item.k === "guide") vHeard[item.f] = 1;               // neighbors speak on every tap; the guide once a visit
    if (item.k !== "sample") { vLastItem = item; vLastEl = vEl; }
    function done() { if (vAudio !== a) return; vUnread(); vMark(vEl, false); vAudio = null; vEl = null; var nx = vQueue.shift(); if (nx && nx.el.isConnected) vPlay(nx.item, nx.el); }
    a.onended = done; a.onerror = done;
    var p = a.play(); if (p && p.catch) p.catch(done);      // the browser said no (no tap yet): stay quiet
    vFollow(a, item, el);
  }
  function vWords(el) {                                       // each word of the line in its own span, for the read-along
    if (el.querySelector(".cb-w")) return;
    var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), list = [], n;
    while ((n = w.nextNode())) if (n.nodeValue.trim() && !(n.parentElement && n.parentElement.closest(".cb-vbtn"))) list.push(n);
    list.forEach(function (tn) {
      var host = tn.parentElement;
      if (/flex|grid/.test(getComputedStyle(host).display)) { // bare text in a flex or grid box: give it one inline home first
        var wrap = h("span", { "class": "cb-vbtn-wrap" }); host.replaceChild(wrap, tn); wrap.appendChild(tn);
      }
      var frag = document.createDocumentFragment();
      tn.nodeValue.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        frag.appendChild(/^\s+$/.test(part) ? document.createTextNode(part) : h("span", { "class": "cb-w", text: part }));
      });
      tn.parentNode.replaceChild(frag, tn);
    });
  }
  function vAttach(el, b) {                                   // the button stays on the line's last word, whatever the layout
    vWords(el);
    var ws = el.querySelectorAll(".cb-w"), last = ws[ws.length - 1];
    if (!last) { el.appendChild(b); return; }
    var glue = h("span", { "class": "cb-vbtn-glue" }); last.parentNode.replaceChild(glue, last); glue.appendChild(last); glue.appendChild(b);
  }
  function vDirect(el) { for (var n = el.firstChild; n; n = n.nextSibling) if (n.nodeType === 3 && n.nodeValue.trim()) return true; return false; }
  function vFind(el) {                                        // the clip for this element: its whole text, or a line it shows among other words
    var t = vNorm(el.textContent); if (!t || t.length > 700) return null;
    if (vIdx[t]) return vIdx[t];
    if (!vDirect(el)) return null;
    if (!vKeys) vKeys = Object.keys(vIdx).filter(function (k) { return k.length >= 12; }).sort(function (a, b) { return b.length - a.length; });
    for (var i = 0; i < vKeys.length; i++) if (t.indexOf(vKeys[i]) >= 0) return vIdx[vKeys[i]];
    return null;
  }
  function vScan(nodes) {
    if (!vIdx) return;
    var hits = {};                                            // per clip, every element that shows its text or a part of it
    function first(a, b) { return a.compareDocumentPosition(b) & 4 ? -1 : 1; }
    nodes.forEach(function (n) {
      if (!n || !n.querySelectorAll) return;
      [n].concat([].slice.call(n.querySelectorAll("p, h2, h3, span, li, div, strong, blockquote"))).forEach(function (el) {
        if (el.closest(".cb-vbtn, .cb-w, .cb-vbtn-glue, .cb-live, .cb-vh, [hidden], [aria-hidden=\"true\"], [data-cb-novoice]")) return;
        var item = vFind(el); if (!item || el.closest('[data-cb-voiced="' + item.f + '"]')) return;
        (hits[item.f] = hits[item.f] || { item: item, els: [] }).els.push(el);
      });
    });
    var found = Object.keys(hits).map(function (k) {          // a line told in two paragraphs reads and lights up as one
      var all = hits[k].els, els = all.filter(function (e, i) { return all.indexOf(e) === i && !all.some(function (o) { return o !== e && e.contains(o); }); }).sort(first);
      return { item: hits[k].item, el: els[els.length - 1], els: els };
    });
    if (!found.length) return;
    found.sort(function (a, b) { return first(a.els[0], b.els[0]); });
    found.forEach(function (f) {
      f.el._vParts = f.els;
      f.els.forEach(function (e) { e.setAttribute("data-cb-voiced", f.item.f); if (e !== f.el) vWords(e); });
      if (f.el.closest("button")) { vWords(f.el); return; }  // never a button inside a button: the line still plays and lights up
      vAttach(f.el, h("button", { type: "button", "class": "cb-vbtn", "aria-label": X.replay, title: X.replay,
        onclick: function (e) { e.stopPropagation(); vQueue = []; vPlay(f.item, f.el); } }, [ico("voice")]));
    });
    if (!vOn || !acted || !CFG.auto) return;
    var now = performance.now();
    var nbs = found.filter(function (f) { return f.item.k === "nb"; }).length;   // a whole board of neighbors' lines: tap to hear each
    var play = found.filter(function (f) { return f.item.k === "nb" ? nbs <= 2 : !vHeard[f.item.f] || (vAudio && f.item.f === vLast.f); }).slice(0, 3);
    if (!play.length) return;
    if (vAudio && play[0].item.f === vLast.f && now - vLast.t < 30000) {   // the same line was redrawn: keep reading, follow the new copy
      vMark(vEl, false); vEl = play[0].el; vMark(vEl, true); vFollow(vAudio, play[0].item, vEl); vQueue = play.slice(1); return;
    }
    vStop(); vQueue = play.slice(1); vPlay(play[0].item, play[0].el);
  }
  function voiceBtn(iconOnly) {
    return h("button", { type: "button", "class": "cb-btn cb-btn--onstage cb-voice" + (iconOnly ? " cb-fs--icon" : ""), "aria-pressed": vOn ? "true" : "false",
      "aria-label": X.voice, title: (vOn ? X.voiceOn : X.voiceOff) + " (M)", onclick: function () { setVoice(!vOn, true); } },
      [ico(vOn ? "voice" : "voiceOff"), iconOnly ? null : h("span", { text: X.voice })]);
  }
  function setVoice(on, tell) {
    vOn = CFG.voice = on; cfgSave();
    if (!vOn) { vStop(); vInkClear(); }
    [].forEach.call(root.querySelectorAll(".cb-voice"), function (b) {
      b.setAttribute("aria-pressed", vOn ? "true" : "false"); b.title = (vOn ? X.voiceOn : X.voiceOff) + " (M)";
      var i = b.querySelector("svg"); if (i) b.replaceChild(ico(vOn ? "voice" : "voiceOff"), i);
    });
    if (tell) say(vOn ? X.voiceOn : X.voiceOff);
  }
  function setCap(on, tell) {
    CFG.cap = on; cfgSave();
    if (vRead && !on && vRead.box === capBox) { vRead.box = null; cap.hidden = true; }
    if (vRead && on && !vRead.box && vEl && !vEl.closest("dialog")) { vRead.box = capBox; vRead.ck = -1; cap.hidden = false; capDraw(vRead.cur); }
    if (tell) say(on ? X.capOn : X.capOff);
  }
  function setBtn(iconOnly) {
    return h("button", { type: "button", "class": "cb-btn cb-btn--onstage cb-setbtn" + (iconOnly ? " cb-fs--icon" : ""), "aria-label": X.settings, "aria-haspopup": "dialog",
      title: X.settings + " (Esc)", onclick: function (e) { openSettings(e.currentTarget); } }, [ico("sliders"), iconOnly ? null : h("span", { text: X.settings })]);
  }
  function replayNow() {                                      // R: the line just read, or the first one on screen
    if (vLastEl && vLastEl.isConnected && vLastItem) { vQueue = []; vPlay(vLastItem, vLastEl); return; }
    var scope = root.querySelector("dialog[open]") || main;
    var bs = [].slice.call(scope.querySelectorAll(".cb-vbtn")).filter(function (b) { var r = b.getBoundingClientRect(); return r.width > 0 && r.bottom > 0 && r.top < window.innerHeight; });
    if (bs[0]) bs[0].click();
  }

  /* the Settings window: Voice, Captions, Helpers, Keys. Opening it pauses the voice; closing it picks up where it stopped. */
  var setOpen = false;
  function openSettings(opener, toKeys) {
    if (setOpen) return;
    setOpen = true; vLoad();
    var held = vAudio && !vAudio.paused ? vAudio : null; if (held) held.pause();
    var body = h("div", { "class": "cb-dlg__body cb-set" });
    fillSettings(body);
    var d = dialog(X.settings, [body], opener && opener.isConnected ? opener : null, function () {
      setOpen = false;
      if (held && vAudio === held && vEl && vEl.isConnected && vOn) { var p = held.play(); if (p && p.catch) p.catch(function () {}); }
    }, { sub: X.setSub, closeLabel: mode === "stop" ? X.keepPlaying : null });
    if (toKeys) { var k = d.querySelector(".cb-set__keys"); if (k) { k.focus({ preventScroll: true }); k.scrollIntoView({ block: "start", behavior: "auto" }); } }
  }
  function fillSettings(body) {
    body.innerHTML = "";
    function sec(icon, title, kids, cls) {
      return h("section", { "class": "cb-set__sec" + (cls ? " " + cls : ""), tabindex: cls ? "-1" : null }, [h("h3", { "class": "cb-set__h" }, [ico(icon), h("span", { text: title })])].concat(kids));
    }
    function sw(label, hint, get, set, off) {               // an on/off switch with its label (and a short hint)
      var id = "cb-set" + (++uid), b = h("button", { type: "button", role: "switch", id: id, "class": "cb-switch", "aria-describedby": hint ? id + "h" : null,
        onclick: function () { if (!b.disabled) { set(!get()); paint(); } } }, [h("span", { "class": "cb-switch__track", "aria-hidden": "true" }, [h("span", { "class": "cb-switch__thumb" })]),
        h("span", { "class": "cb-switch__state", "aria-hidden": "true" })]);
      function paint() { var on = !!get(); b.setAttribute("aria-checked", on ? "true" : "false"); b.lastChild.textContent = on ? X.on : X.off; }
      paint(); if (off) b.disabled = true;
      return h("div", { "class": "cb-set__row" }, [h("div", { "class": "cb-set__txt" }, [h("label", { "for": id, text: label }), hint ? h("p", { "class": "cb-set__hint", id: id + "h", text: hint }) : null]), b]);
    }
    function seg(legend, vals, names, get, set) {            // one choice of a few, as a row of pills
      var name = "cb-seg" + (++uid), row = h("div", { "class": "cb-seg__opts" });
      vals.forEach(function (v, i) {
        var inp = h("input", { type: "radio", name: name, value: String(v) }); inp.checked = get() === v;
        inp.addEventListener("change", function () { if (inp.checked) set(v); });
        row.appendChild(h("label", { "class": "cb-seg__opt" }, [inp, h("span", { text: names[i] })]));
      });
      return h("fieldset", { "class": "cb-seg" }, [h("legend", { text: legend }), row]);
    }
    var volId = "cb-set" + (++uid), vol = h("input", { type: "range", id: volId, "class": "cb-range", min: "0", max: "100", step: "10" });
    var out = h("output", { "class": "cb-set__val", "for": volId, "aria-hidden": "true" });
    function volPaint() { var p = Math.round(CFG.vol * 100); vol.value = String(p); vol.setAttribute("aria-valuetext", p + "%"); out.textContent = p + "%"; vol.style.setProperty("--p", p + "%"); }
    vol.addEventListener("input", function () { CFG.vol = +vol.value / 100; if (vAudio) vAudio.volume = CFG.vol; volPaint(); cfgSave(); });
    volPaint();
    var sample = h("button", { type: "button", "class": "cb-btn cb-set__sample", onclick: function () {
      if (vAudio && vEl === sample) { vStop(); return; }
      vStop(); vPlay({ f: L + "/g-intro.mp3", k: "sample" }, sample);
    } }, [ico("voice"), h("span", { "class": "cb-set__play", text: X.sample }), h("span", { "class": "cb-set__stop", text: X.sampleStop })]);
    var preview = h("div", { "class": "cb-set__cap", "aria-hidden": "true", "data-cb-novoice": "", "data-size": CFG.capSize }, [h("p", { "class": "cb-cap__box" }, [
      h("b", { "class": "cb-cap__who", text: X.guide }), h("span", { "class": "cb-cap__line", text: W.intro1.split(". ")[0] + "." })])]);
    var keys = h("dl", { "class": "cb-keys" });
    X.keys.forEach(function (k) {
      keys.appendChild(h("dt", null, k[0].split("|").map(function (c) { return h("kbd", { text: c }); })));
      keys.appendChild(h("dd", { text: k[1] }));
    });
    var reset = btn(X.reset, "cb-btn--quiet cb-set__reset", function () {
      for (var k in CFG_DEF) CFG[k] = CFG_DEF[k];
      cfgSave(); applyCalm(); setVoice(CFG.voice, false); setCap(CFG.cap, false); cap.setAttribute("data-size", CFG.capSize);
      if (vAudio) { vAudio.volume = CFG.vol; vAudio.playbackRate = CFG.rate; }
      fillSettings(body); say(X.resetDone);
      var r = body.querySelector(".cb-set__reset"); if (r) r.focus();
    }, "replay");
    [sec("voice", X.secVoice, [
        sw(X.voice, null, function () { return vOn; }, function (v) { setVoice(v, false); }),
        sw(X.auto, X.autoHint, function () { return CFG.auto; }, function (v) { CFG.auto = v; cfgSave(); }),
        h("div", { "class": "cb-set__row cb-set__row--vol" }, [h("label", { "class": "cb-set__lbl", "for": volId, text: X.vol }), h("div", { "class": "cb-set__volume" }, [vol, out])]),
        seg(X.speed, RATES, X.speeds, function () { return CFG.rate; }, function (v) { CFG.rate = v; if (vAudio) vAudio.playbackRate = v; cfgSave(); }),
        h("div", { "class": "cb-row" }, [sample])]),
      sec("captions", X.secCap, [
        sw(X.words, null, function () { return CFG.words; }, function (v) {
          CFG.words = v; cfgSave();
          if (!v && vRead) { if (vRead.on) vRead.on.classList.remove("is-now"); vRead.on = null; if (vRead.hud) vRead.hud.classList.remove("is-now"); }
          if (vRead) vRead.cur = -2;                       // repaint on the next frame
        }),
        sw(X.capBar, X.capHint, function () { return CFG.cap; }, function (v) { setCap(v, false); }),
        seg(X.capSize, SIZES, X.sizes, function () { return CFG.capSize; }, function (v) { CFG.capSize = v; cap.setAttribute("data-size", v); preview.setAttribute("data-size", v); cfgSave(); }),
        preview]),
      sec("hand", X.secHelp, [
        canFS ? h("div", { "class": "cb-row" }, [btn(fsEl() ? X.fsOff : X.fsOn, "", function () {   // close Settings first: a full-screen game would cover it
          var d = body.closest("dialog"); if (d) d.close(); toggleFS();
        }, fsEl() ? "shrink" : "expand")]) : null,
        sw(X.circles, X.circlesHint, function () { return CFG.circles; }, function (v) { CFG.circles = v; if (!v) vInkClear(); cfgSave(); }),
        sw(X.calm, SYS_CALM ? X.calmSys : X.calmHint, function () { return SYS_CALM || CFG.calm; }, function (v) { CFG.calm = v; applyCalm(); cfgSave(); }, SYS_CALM)]),
      sec("keys", X.secKeys, [h("p", { "class": "cb-set__hint", text: X.keysNote }), keys], "cb-set__keys"),
      h("div", { "class": "cb-row cb-set__end" }, [reset])
    ].forEach(function (s) { body.appendChild(s); });
  }

  /* standard game keys, only while the player is in the game (a tap or focus inside it), never while typing or in a window */
  var keysLive = false;
  document.addEventListener("pointerdown", function (e) { keysLive = root.contains(e.target); }, true);
  document.addEventListener("focusin", function (e) { keysLive = root.contains(e.target); }, true);
  document.addEventListener("keydown", function (e) {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
    if (!(keysLive || root.contains(document.activeElement) || fsEl() === root)) return;
    var t = e.target, k = e.key && e.key.length === 1 ? e.key.toLowerCase() : e.key, act = null;
    if (t && t.closest && t.closest("input, textarea, select, [contenteditable=''], [contenteditable='true']")) return;
    if (root.querySelector("dialog[open]")) return;           // a window is open: Esc closes it, nothing else
    if (k === "Escape") { if (t && t.classList && t.classList.contains("cb-stop")) return; act = function () { openSettings(root.contains(t) ? t : null); }; }
    else if (k === "?") act = function () { openSettings(root.contains(t) ? t : null, true); };
    else if (e.repeat) return;
    else if (k === "m") act = function () { setVoice(!vOn, true); };
    else if (k === "r") act = replayNow;
    else if (k === "s") act = function () { if (vAudio) { vStop(); vInkClear(); } };
    else if (k === "c") act = function () { setCap(!CFG.cap, true); };
    else if (k === "f" && canFS) act = toggleFS;
    if (!act) return;
    e.preventDefault(); acted = true; act();
  });
  new MutationObserver(function (recs) {
    if (vEl && !vEl.isConnected) { vUnread(); vMark(vEl, false); vEl = null; }
    var nodes = [];
    recs.forEach(function (r) {
      if (r.target === cap || cap.contains(r.target)) return;   // the caption bar rewrites itself every few words
      if (r.target.nodeType === 1 && r.target.closest(".cb-medal, [data-cb-novoice], .cb-live, .cb-vh")) return;
      [].forEach.call(r.addedNodes, function (n) {
        if (n.nodeType === 1 && !n.classList.contains("cb-vbtn") && !n.classList.contains("cb-w")) nodes.push(n);
        else if (n.nodeType === 3 && n.parentElement && !n.parentElement.closest(".cb-w")) nodes.push(n.parentElement);   // a line rewritten in place
      });
    });
    if (nodes.length) { vLoad(); vScan(nodes); }
    if (vAudio && !vEl) vStop();                              // the line being read left the screen: stop
  }).observe(root, { childList: true, subtree: true });

  /* ── dialogs ───────────────────────────────────────────────────────── */
  function dialog(title, body, opener, onClose, opt) {
    opt = opt || {};
    var id = "cb-dlg-h" + (++uid);
    var d = h("dialog", { "class": "cb-dlg" + (opt.wide ? " cb-dlg--wide" : ""), "aria-labelledby": id });
    var hd = h("h2", { id: id, tabindex: "-1", text: title });
    d.appendChild(h("button", { type: "button", "class": "cb-dlg__x", "aria-label": W.close, onclick: function () { d.close(); } }, [ico("close")]));
    d.appendChild(h("div", { "class": "cb-dlg__head" }, [opt.face ? img(opt.face, "", "cb-dlg__face", true) : null, opt.badge || null,
      h("div", null, [hd, opt.sub ? h("p", { "class": "cb-dlg__sub", text: opt.sub }) : null])]));
    body.forEach(function (b) { if (b) d.appendChild(b); });
    d.appendChild(h("p", { "class": "cb-live", "aria-live": "polite" }));
    d.appendChild(h("div", { "class": "cb-dlg__foot" }, [btn(opt.closeLabel || W.close, "cb-btn--primary", function () { d.close(); })]));
    var cleaned = false, nativeClose = d.close.bind(d);
    function cleanup() {                       // synchronous and idempotent: never wait for the async close event
      if (cleaned) return; cleaned = true;
      if (d.open) nativeClose();
      d.remove(); guard(); if (onClose) onClose(); if (opener && opener.isConnected && opener.focus) opener.focus();
    }
    d.close = cleanup;
    d.addEventListener("cancel", function (e) { e.preventDefault(); cleanup(); });   // Esc
    d.addEventListener("close", cleanup);                                           // backup
    root.appendChild(d);
    if (d.showModal) d.showModal(); else d.setAttribute("open", "");
    hd.focus();
    return d;
  }
  function openGrownups(opener) {
    var wrap = h("div", { "class": "cb-dlg__body" }), changed = { on: false };
    grownBody(wrap, changed);
    dialog(W.grownups, [wrap], opener, function () {
      if (changed.on && mode === "map") {       // scores were erased or restored: redraw the town, keep focus on For grown-ups
        showMap(); var g = main.querySelector(".cb-dock__grownups"); if (g) { acted = true; g.focus(); }
      }
    });
  }
  function grownBody(wrap, changed) {
    wrap.innerHTML = "";
    wrap.appendChild(h("p", { text: W.grownText }));
    var c = btn(W.clear, "", function () { clearFlow(wrap, changed); });
    wrap.appendChild(h("div", { "class": "cb-row" }, [c]));
    return c;
  }
  function clearFlow(wrap, changed) {
    wrap.innerHTML = "";
    wrap.appendChild(h("p", { text: W.tapTurtle }));
    var grid = h("div", { "class": "cb-animals" });
    shuffle(ANIMALS).forEach(function (a) { grid.appendChild(animalBtn(a, function () { if (a.id === "turtle") confirmClear(wrap, changed); })); });
    wrap.appendChild(grid);
    grid.firstChild.focus();
  }
  function confirmClear(wrap, changed) {
    wrap.innerHTML = "";
    wrap.appendChild(h("p", { text: W.sure }));
    var yes = btn(W.yesErase, "cb-btn--go", function () {
      var backup = JSON.stringify(store);
      store = { version: 1, players: { you: { stops: {} } }, current: "you" }; save(); changed.on = true;
      wrap.innerHTML = "";
      var note = h("p", { tabindex: "-1", text: W.erased });
      var undo = btn(W.undo, "", function () { store = JSON.parse(backup); save(); changed.on = true; grownBody(wrap, changed).focus(); say(X.restored); }, "replay");
      wrap.appendChild(note); wrap.appendChild(undo); say(W.erased); undo.focus();
      setTimeout(function () { if (undo.isConnected) { var had = document.activeElement === undo; undo.remove(); if (had) note.focus(); } }, 10000);
    });
    var no = btn(W.noKeep, "", function () { grownBody(wrap, changed).focus(); });
    wrap.appendChild(h("div", { "class": "cb-row" }, [yes, no])); no.focus();
  }
  function animalBtn(a, fn, pressed) {
    var b = h("button", { type: "button", "class": "cb-animal", "aria-pressed": pressed ? "true" : null, onclick: fn }, [animalFace(a), h("span", { text: a.name })]);
    b.style.setProperty("--ring", a.ring);
    return b;
  }

  /* ── title: the town at dusk-light, one clear way in ──────────────── */
  function showTitle() {
    inStop = false; mode = "title"; setTitle(null);
    var gu = btn(W.grownups, "cb-btn--onstage cb-btn--big", function () { openGrownups(gu); }, "family");
    var chapters = h("ul", { "class": "cb-hero__chapters" }, W.chapters.map(function (c, i) {
      var li = h("li", null, [h("i", { "aria-hidden": "true" }), h("span", { text: c })]); li.style.setProperty("--cb-chap", CHAP[i]); return li;
    }));
    screen([h("section", { "class": "cb-hero", "aria-labelledby": "cb-hero-h" }, [
      img("town-map", "", "cb-hero__art", true), h("span", { "class": "cb-hero__scrim", "aria-hidden": "true" }),
      h("div", { "class": "cb-hero__copy" }, [
        h("h2", { "class": "cb-vh", id: "cb-hero-h", text: W.series }),
        h("p", { "class": "cb-hero__lead", text: W.intro1 }),
        h("p", { "class": "cb-hero__note" }, [ico("star", "cb-ico--fill"), h("span", { text: W.intro2 })]),
        h("div", { "class": "cb-row" }, [btn(W.start, "cb-btn--go cb-btn--big", function () { showMap(); }, "go", true), gu]),
        chapters
      ])
    ])]);
  }

  /* ── hub: the painted town is the level select ─────────────────────── */
  function nextSuggested() {
    var pl = player();
    for (var i = 0; i < STOPS.length; i++) if (PLAYABLE[STOPS[i].id] && !rec(STOPS[i].id, pl)) return STOPS[i].id;
    return null;
  }
  function pathD(a, b, prev, next) {   // Catmull-Rom segment a->b as a cubic Bezier, in map pixels
    var X_ = function (p) { return p[0] * 13.76; }, Y = function (p) { return p[1] * 7.68; };
    prev = prev || a; next = next || b;
    var c1x = X_(a) + (X_(b) - X_(prev)) / 6, c1y = Y(a) + (Y(b) - Y(prev)) / 6, c2x = X_(b) - (X_(next) - X_(a)) / 6, c2y = Y(b) - (Y(next) - Y(a)) / 6;
    return "M" + X_(a) + " " + Y(a) + " C" + c1x + " " + c1y + " " + c2x + " " + c2y + " " + X_(b) + " " + Y(b);
  }
  function showMap(msg) {
    inStop = false; mode = "map"; setTitle(null);
    if (team) { store.current = team.prev || "you"; save(); team = null; }
    var pl = player(), sug = nextSuggested(), openN = Object.keys(PLAYABLE).length, stampId = justDone;
    justDone = null;
    var canvas = h("div", { "class": "cb-world__canvas" }, [img("town-map", "", "cb-world__art", true)]);
    var pan = h("div", { "class": "cb-world__pan", role: "region", "aria-label": W.mapHelp }, [canvas]);
    var world = h("div", { "class": "cb-world" }, [pan]);
    var svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("viewBox", "0 0 1376 768"); svg.setAttribute("aria-hidden", "true"); svg.setAttribute("class", "cb-path");
    for (var i = 0; i < POS.length - 1; i++) {
      var d = pathD(POS[i], POS[i + 1], POS[i - 1], POS[i + 2]);
      var stones = document.createElementNS(SVGNS, "path");
      stones.setAttribute("d", d); stones.setAttribute("class", "cb-stones");
      svg.appendChild(stones);
      if (rec(STOPS[i].id, pl)) {
        var trail = document.createElementNS(SVGNS, "path");
        trail.setAttribute("d", d); trail.setAttribute("class", "cb-trail");
        svg.appendChild(trail);
        if (stampId === STOPS[i].id && !REDUCED) (function (tr) {     // the signature: the path draws itself to the next stop
          requestAnimationFrame(function () {
            var len = tr.getTotalLength(); tr.style.strokeDasharray = len; tr.style.strokeDashoffset = len;
            tr.getBoundingClientRect();
            tr.style.transition = "stroke-dashoffset 1.4s cubic-bezier(0.16, 1, 0.3, 1) 0.25s"; tr.style.strokeDashoffset = "0";
          });
        })(trail);
      }
    }
    canvas.appendChild(svg);
    function token(s, onMap) {
      var r = rec(s.id, pl), playable = PLAYABLE[s.id], st = r ? starsFor(r.best) : 0;
      var state = !playable ? "locked" : r ? "done" : sug === s.id ? "next" : "open";
      var label = playable ? (r ? W.stopStars(s.n, s.name, st) : W.stopOpen(s.n, s.name) + (state === "next" ? ", " + W.next : "")) : W.stopSoon(s.n, s.name);
      var disc = h("span", { "class": "cb-stop__disc", "aria-hidden": "true" }, [state === "done" ? ico("check") : h("span", { text: String(s.n) }),
        state === "locked" ? h("span", { "class": "cb-stop__lock" }, [ico("lock")]) : null]);
      var plate = h("span", { "class": "cb-stop__plate", "aria-hidden": "true" }, [h("span", { "class": "cb-stop__n", text: W.stop + " " + s.n }), h("b", { text: s.name }),
        playable ? (r ? starRow(st) : null) : h("span", { "class": "cb-state", text: W.soon })]);
      var mini = state === "done" ? h("span", { "class": "cb-stop__mini", "aria-hidden": "true" }, [starRow(st)]) : null;
      var b = h("button", { type: "button", "class": "cb-stop" + (onMap && stampId === s.id ? " is-stamping" : ""), "data-state": state, "aria-label": label,
        onclick: function () { if (playable) startStop(s.id); else comingSoon(s, b); } }, [state === "next" ? h("span", { "class": "cb-tag", "aria-hidden": "true", text: W.next }) : null, disc, mini, plate]);
      b.style.setProperty("--cb-chap", CHAP[s.chap - 1]);
      var li = h("li", null, [b]);
      if (onMap) {
        var x = POS[s.n - 1][0]; li.style.left = x + "%"; li.style.top = POS[s.n - 1][1] + "%";
        if (x > 85) li.setAttribute("data-edge", "r"); else if (x < 8) li.setAttribute("data-edge", "l");
      }
      return li;
    }
    canvas.appendChild(h("ul", { "class": "cb-stops cb-stops--onmap" }, STOPS.map(function (s) { return token(s, true); })));
    var J = journeyOf(pl);
    var scoreBtn = h("button", { type: "button", "class": "cb-jscore", onclick: function () { openLast5(scoreBtn); } }, [
      ico("star", "cb-ico--fill cb-jscore__ico"),
      h("span", { "class": "cb-jscore__txt" }, [h("span", { "class": "cb-jscore__label", text: W.journey }),
        h("strong", null, [h("span", { "class": "cb-jscore__num", text: String(J) }), h("small", { text: "/ 1500" })])]),
      h("span", { "class": "cb-jscore__more" }, [h("span", { text: W.last5 }), ico("go")])]);
    world.appendChild(h("div", { "class": "cb-world__hud" }, [scoreBtn]));
    canvas.addEventListener("keydown", function (e) { if (e.key === "Escape" && e.target.classList && e.target.classList.contains("cb-stop")) e.target.classList.add("is-quiet"); });
    canvas.addEventListener("focusout", function (e) { if (e.target.classList) e.target.classList.remove("is-quiet"); });
    if (msg) { var toast = h("p", { "class": "cb-toast", text: msg }); world.appendChild(toast); setTimeout(function () { if (toast.isConnected) toast.remove(); }, 5000); }
    var journey = h("details", { "class": "cb-journey" }, [h("summary", null, [h("span", { text: W.allStops }), ico("go")]), h("p", { "class": "cb-journey__help", text: W.journeyHelp })].concat(W.chapters.map(function (c, ci) {
      var ss = STOPS.filter(function (s) { return s.chap === ci + 1; }), done = ss.filter(function (s) { return rec(s.id, pl); }).length;
      var sec = h("section", { "class": "cb-chap" }, [h("h3", { "class": "cb-chap__h" }, [h("i", { "aria-hidden": "true" }), h("span", { text: (ci + 1) + ". " + c }), h("small", { text: X.of(done, ss.length) })]),
        h("ul", { "class": "cb-stops cb-stops--list" }, ss.map(function (s) { return token(s, false); }))]);
      sec.style.setProperty("--cb-chap", CHAP[ci]);
      return sec;
    })));
    var lib = btn(W.library, "cb-btn--onstage", function () { openWho(lib); }, "people");
    var gu = btn(W.grownups, "cb-btn--onstage cb-dock__grownups", function () { openGrownups(gu); }, "family");
    screen([h("h2", { "class": "cb-vh", text: W.series }), world, journey,
      h("div", { "class": "cb-dock" }, [h("p", { "class": "cb-dock__open", text: W.open(openN) }), h("div", { "class": "cb-row" }, [lib, gu])])]);
    function edges() {
      var m = pan.scrollWidth - pan.clientWidth;
      if (m > 4) pan.setAttribute("tabindex", "0"); else pan.removeAttribute("tabindex");
      world.classList.toggle("is-more-l", pan.scrollLeft > 6);
      world.classList.toggle("is-more-r", pan.scrollLeft < m - 6);
    }
    pan.addEventListener("keydown", function (e) {
      if (e.target !== pan || pan.scrollWidth <= pan.clientWidth + 4 || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
      e.preventDefault(); pan.scrollBy({ left: e.key === "ArrowLeft" ? -160 : 160, behavior: REDUCED ? "auto" : "smooth" });
    });
    pan.addEventListener("scroll", edges, { passive: true });
    pan.addEventListener("focusin", function (e) {
      var d = e.target.closest && e.target.closest(".cb-stop"); d = d && d.querySelector(".cb-stop__disc");
      if (d) d.scrollIntoView({ inline: "nearest", block: "nearest", behavior: REDUCED ? "auto" : "smooth" });
    });
    if (pan.scrollWidth > pan.clientWidth + 4) {          // narrow stage: start the pan on the next stop
      var focusStop = STOPS.filter(function (s) { return s.id === (sug || stampId); })[0] || STOPS[0];
      var target = Math.max(0, POS[focusStop.n - 1][0] / 100 * canvas.offsetWidth - pan.clientWidth / 2);
      if (!nudged && !REDUCED) {                              // once per visit: the town slides into place, so it reads as draggable
        nudged = true; pan.scrollLeft = Math.max(0, target - 90);
        requestAnimationFrame(function () { pan.scrollTo({ left: target, behavior: "smooth" }); });
      } else pan.scrollLeft = target;
    }
    edges();
    frame(true);
    function unblock() {                                      // the next stop's name plate never sits on another stop: if it would, it goes above its disc
      var nx = canvas.querySelector('.cb-stop[data-state="next"]'), pl = nx && nx.querySelector(".cb-stop__plate");
      if (!pl || !canvas.isConnected) return;
      var discs = [].slice.call(canvas.querySelectorAll(".cb-stop__disc")).filter(function (d) { return !nx.contains(d); });
      function hits() { var a = pl.getBoundingClientRect(); return discs.some(function (d) { var b = d.getBoundingClientRect();
        return a.left < b.right + 4 && a.right > b.left - 4 && a.top < b.bottom + 4 && a.bottom > b.top - 4; }); }
      nx.classList.remove("is-plate-up");
      if (!hits()) return;
      nx.style.setProperty("--cb-plate-h", pl.offsetHeight + "px"); nx.classList.add("is-plate-up");
      if (hits()) nx.classList.remove("is-plate-up");          // no better place: keep it under the disc
    }
    unblock();
    if (window.ResizeObserver) {
      var mapObserver = new ResizeObserver(function () {
        if (!canvas.isConnected) { mapObserver.disconnect(); return; }
        edges(); unblock();
      });
      mapObserver.observe(canvas); mapObserver.observe(pan);
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(unblock);
    if (msg) say(msg);
  }
  function starRow(n) { var e = h("span", { "class": "cb-stars", "aria-hidden": "true" }); e.innerHTML = [0, 1, 2].map(function (i) { return i < n ? STAR_ON : STAR_OFF; }).join(""); return e; }
  function comingSoon(s, opener) {
    var badge = h("span", { "class": "cb-dlg__badge", "aria-hidden": "true" }, [h("span", { text: String(s.n) }), h("span", { "class": "cb-stop__lock" }, [ico("lock")])]);
    badge.style.setProperty("--cb-chap", CHAP[s.chap - 1]);
    dialog(W.stop + " " + s.n + ": " + s.name, [h("p", { "class": "cb-dlg__lead", text: W.soon })], opener, null, { badge: badge, sub: W.chapters[s.chap - 1] });
  }
  function openLast5(opener) {
    var pl = player(), rows = STOPS.filter(function (s) { return rec(s.id, pl); });
    var body = rows.length ? h("table", { "class": "cb-table" }, [
      h("thead", null, [h("tr", null, [h("th", { text: W.stop }), h("th", { text: W.last5 }), h("th", { "class": "cb-num", text: W.best })])]),
      h("tbody", null, rows.map(function (s) {
        var r = rec(s.id, pl);
        var bars = h("span", { "class": "cb-tries", role: "img", "aria-label": r.last5.join(", ") }, r.last5.map(function (v) {
          var b = h("span", { "class": "cb-tries__bar" }, [h("b", { text: String(v) })]); b.style.setProperty("--h", Math.max(4, Math.round(v * 0.4)) + "px"); return b;
        }));
        bars.style.setProperty("--cb-chap", CHAP[s.chap - 1]);
        return h("tr", null, [h("td", { text: s.n + ". " + s.name }), h("td", null, [bars]), h("td", { "class": "cb-num", text: String(r.best) })]);
      }))
    ]) : h("p", { text: W.open(Object.keys(PLAYABLE).length) });
    dialog(W.last5, [body], opener, null, { wide: true });
  }

  /* ── Library / Class mode, scoreboard, team challenge ─────────────── */
  function openWho(opener) {
    var wrap = h("div", { "class": "cb-dlg__body" });
    var grid = h("div", { "class": "cb-animals" });
    ANIMALS.forEach(function (a) {
      grid.appendChild(animalBtn(a, function () { store.current = a.id; save(); d.close(); showMap(); }, store.current === a.id));
    });
    wrap.appendChild(grid);
    var sb = btn(W.scoreboard, "", function () { d.close(); openScoreboard(opener); }, "trophy");
    var tc = btn(W.team, "", function () { d.close(); teamStart(opener); }, "people");
    var lv = btn(W.leave, "", function () { store.current = "you"; save(); d.close(); showMap(); }, "back");
    wrap.appendChild(h("div", { "class": "cb-row" }, [sb, tc, lv]));
    var d = dialog(W.who, [wrap], opener, null, { wide: true });
  }
  function improvement(pl) {
    var best = null;
    for (var k in pl.stops) { var a = pl.stops[k].all || []; if (a.length >= 2) { var l3 = a.slice(1).slice(-3), v = l3.reduce(function (t, x) { return t + x; }, 0) / l3.length - a[0]; if (best === null || v > best) best = v; } }
    return best;
  }
  function openScoreboard(opener) {
    var played = ANIMALS.filter(function (a) { var p = store.players[a.id]; return p && Object.keys(p.stops).length; });
    var imps = played.map(function (a) { return improvement(store.players[a.id]); });
    var top = imps.reduce(function (m, v) { return v !== null && v > 0 && (m === null || v > m) ? v : m; }, null);
    var rows = played.map(function (a, i) {
      var p = store.players[a.id], stars = 0, bestStop = null;
      for (var k in p.stops) { stars += starsFor(p.stops[k].best); if (!bestStop || p.stops[k].best > p.stops[bestStop].best) bestStop = k; }
      var bs = STOPS.filter(function (s) { return s.id === bestStop; })[0];
      return h("tr", null, [h("td", null, [h("span", { "class": "cb-who" }, [animalFace(a), h("span", { text: a.name }),
        top !== null && imps[i] === top ? h("span", { "class": "cb-ribbon", text: W.improved }) : null])]),
        h("td", { "class": "cb-num", text: journeyOf(p) + " / 1500" }), h("td", { "class": "cb-num", text: String(stars) }), h("td", { text: bs ? bs.name + " (" + p.stops[bestStop].best + ")" : "" })]);
    });
    var tbl = h("table", { "class": "cb-table" }, [h("thead", null, [h("tr", null, [h("th", { text: "" }), h("th", { "class": "cb-num", text: W.total }), h("th", { "class": "cb-num", text: W.starsWord }), h("th", { text: W.pbest })])]), h("tbody", null, rows)]);
    dialog(W.scoreboard, [rows.length ? tbl : null, top === null ? h("p", { text: W.noImproved }) : null, h("p", { "class": "cb-dlg__sub", text: W.everyone })], opener, null, { wide: true });
  }
  function teamStart(opener) {
    team = { a: null, b: null, stop: null, phase: "pickA", cards: [], prev: store.current || "you" };
    var wrap = h("div", { "class": "cb-dlg__body" }), d;
    function stepA() {
      wrap.innerHTML = ""; wrap.appendChild(h("p", { "class": "cb-dlg__lead", text: W.team1 }));
      var g = h("div", { "class": "cb-animals" }); ANIMALS.forEach(function (a) { g.appendChild(animalBtn(a, function () { team.a = a.id; stepB(); })); }); wrap.appendChild(g); g.firstChild.focus();
    }
    function stepB() {
      wrap.innerHTML = ""; wrap.appendChild(h("p", { "class": "cb-dlg__lead", text: W.team2 }));
      var g = h("div", { "class": "cb-animals" }); ANIMALS.filter(function (a) { return a.id !== team.a; }).forEach(function (a) { g.appendChild(animalBtn(a, function () { team.b = a.id; stepStop(); })); }); wrap.appendChild(g); g.firstChild.focus();
    }
    function stepStop() {
      wrap.innerHTML = ""; wrap.appendChild(h("p", { "class": "cb-dlg__lead", text: W.pickStop }));
      var row = h("div", { "class": "cb-row" });
      STOPS.filter(function (s) { return PLAYABLE[s.id]; }).forEach(function (s) {
        row.appendChild(btn(W.stop + " " + s.n + ": " + s.name, "cb-btn--primary", function () { team.stop = s.id; team.phase = "A"; store.current = team.a; save(); d.close(); startStop(s.id); }, "go", true));
      });
      wrap.appendChild(row); row.firstChild.focus();
    }
    d = dialog(W.team, [wrap], opener, null, { wide: true }); stepA();
  }

  /* ── stop header: back, the stop's own medallion, a part stepper ─── */
  function stopHud(stop, steps, cur, cap) {
    feedbackStop = stop.id;
    var a = store.current && store.current !== "you" ? animalOf(store.current) : null;
    var title = h("div", { "class": "cb-stophud__title" }, [h("span", { "class": "cb-stophud__badge", "aria-hidden": "true", text: String(stop.n) }), h("div", null, [
      h("h2", { "class": "cb-stophud__h", text: stop.name }),
      h("p", { text: W.stop + " " + stop.n + " · " + W.chapters[stop.chap - 1] + (a ? " · " + W.playing(a.name) : "") })])]);
    var stepper = null;
    if (steps) {
      var labelled = !!steps[0];
      stepper = h("div", { "class": "cb-stophud__steps" }, [h("ol", { "class": "cb-steps" + (labelled ? "" : " cb-steps--dots") }, steps.map(function (lbl, i) {
        var s = i < cur ? "done" : i === cur ? "now" : "todo";
        return h("li", { "class": "cb-step", "data-s": s, "aria-current": s === "now" ? "step" : null }, [
          h("span", { "class": "cb-step__dot", "aria-hidden": "true" }, [s === "done" ? ico("check") : String(i + 1)]),
          h("span", { "class": labelled ? "cb-step__lbl" : "cb-vh", text: lbl || String(i + 1) })]);
      })), cap ? h("p", { "class": labelled ? "cb-vh" : "cb-steps__cap", text: cap }) : null]);
    }
    var hud = h("div", { "class": "cb-stophud" }, [h("div", { "class": "cb-stophud__tools" }, [(function () { var b = btn(W.townmap, "cb-btn--onstage cb-stophud__back", function () { showMap(); }, "back"); b.setAttribute("aria-label", W.townmap); return b; })(), languageBtn(), setBtn(true), voiceBtn(true), fsBtn(true)]), title, stepper]);
    hud.style.setProperty("--cb-chap", CHAP[stop.chap - 1]);
    return hud;
  }

  /* ── results: the medal fills, the stars stamp, then the tip ───────── */
  function scoreCard(stop, score, info, tip, can, real, extra) {
    feedbackStop = stop.id; feedbackScore = score;
    var st = starsFor(score), hid = "cb-sc-h" + (++uid);
    var stars = h("div", { "class": "cb-medal__stars", "aria-hidden": "true" }, [40, 70, 90].map(function (at) {
      var s = h("span", { "class": "cb-medal__star" + (REDUCED && score >= at ? " is-on" : ""), "data-at": String(at) }); s.innerHTML = STAR_OFF + STAR_ON; return s;
    }));
    var medal = h("div", { "class": "cb-medal", "aria-hidden": "true" }, [stars,
      h("div", { "class": "cb-medal__disc" }, [h("span", { "class": "cb-medal__k", text: W.score }), h("b", { "class": "cb-count", "data-to": String(score), text: REDUCED ? String(score) : "0" }), h("span", { "class": "cb-medal__of", text: "/ 100" })]),
      info.newBest ? h("p", { "class": "cb-medal__ribbon" + (REDUCED ? " is-on" : ""), text: W.newBest }) : null]);
    medal.style.setProperty("--cb-chap", CHAP[stop.chap - 1]);
    medal.querySelector(".cb-medal__disc").style.setProperty("--p", REDUCED ? score : 0);   // CSSOM, not a style attribute (CSP)
    return h("section", { "class": "cb-card", "aria-labelledby": hid }, [
      h("h3", { "class": "cb-vh", id: hid, text: stop.name }),
      h("p", { "class": "cb-vh cb-card__score", text: W.score + " " + score + " / 100. " + (st ? W.stars(st) : W.goodStart) }),
      medal,
      h("div", { "class": "cb-card__body" }, [
        h("p", { "class": "cb-card__can" }, [ico("check"), h("span", { text: can })]),
        h("p", { "class": "cb-card__meta" }, [h("span", { "class": "cb-card__stars", text: st ? W.stars(st) : W.goodStart }),
          h("span", { "class": "cb-card__best" }, [W.yourBest + " ", h("b", { text: String(info.best) }), " / 100"]),
          info.newBest ? h("span", { "class": "cb-card__new", text: W.newBest }) : null]),
        info.first ? h("p", { "class": "cb-card__first", text: score === 100 ? W.perfect : W.first }) : null,
        h("div", { "class": "cb-tipcard" }, [ico("bulb"), h("p", { "class": "cb-card__tip", text: tip })]),
        h("div", { "class": "cb-tipcard cb-tipcard--real cb-card__real" }, [ico("home"), h("div", null, [h("strong", { text: W.tryReal }), h("p", { text: real })])]),
        extra || null])
    ]);
  }
  function playCard(card) {
    var num = card.querySelector(".cb-count"); if (!num) return;
    var to = +num.getAttribute("data-to"), stars = [].slice.call(card.querySelectorAll(".cb-medal__star")), rib = card.querySelector(".cb-medal__ribbon");
    var disc = card.querySelector(".cb-medal__disc");
    function paint(v) { num.textContent = String(v); if (disc) disc.style.setProperty("--p", v); stars.forEach(function (s) { if (v >= +s.getAttribute("data-at")) s.classList.add("is-on"); }); }
    function end() { paint(to); if (rib) rib.classList.add("is-on"); }
    if (REDUCED || !window.requestAnimationFrame) return end();
    var dur = Math.min(1600, 500 + to * 11), t0 = null, fin = false;
    function step(t) {
      if (fin) return; if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / dur); paint(Math.round(to * (1 - Math.pow(2, -10 * p))));
      if (p < 1) requestAnimationFrame(step); else { fin = true; end(); }
    }
    requestAnimationFrame(step);
    setTimeout(function () { if (!fin) { fin = true; end(); } }, dur + 400);   // a hidden tab pauses animation frames
  }
  function cardButtons(stopId, again, extraBtn) {
    if (team && team.phase === "A") {
      return h("div", { "class": "cb-row cb-card__btns" }, [btn(W.pass, "cb-btn--go cb-btn--big", function () { team.phase = "B"; store.current = team.b; save(); startStop(stopId); }, "people")]);
    }
    var idx = STOPS.findIndex(function (s) { return s.id === stopId; }), nxt = null;
    for (var i = idx + 1; i < STOPS.length; i++) if (PLAYABLE[STOPS[i].id]) { nxt = STOPS[i].id; break; }
    return h("div", { "class": "cb-row cb-card__btns" }, [
      btn(W.again, "cb-btn--go cb-btn--big", again, "replay"),
      btn(W.nextStop, "cb-btn--big", function () { if (nxt) startStop(nxt); else showMap(W.moreSoon); }, "go", true),
      btn(W.back, "cb-btn--quiet", function () { showMap(); }, "back"),
      extraBtn || null
    ]);
  }
  function stepsFor(id) { return REG[id] ? REG[id].steps : id === "listen-to-every-neighbor" ? X.parts3 : [null, null, null, null, null]; }
  function finishRound(stopId, cardEl, buttons) {
    var stop = STOPS.filter(function (s) { return s.id === stopId; })[0], steps = stepsFor(stopId);
    mode = "stop";
    if (team && team.phase === "B") {
      team.cards.push(cardEl); team.phase = "done";
      var a = animalOf(team.a), b = animalOf(team.b), c0 = team.cards[0], c1 = team.cards[1];
      c0.insertBefore(h("p", { "class": "cb-card__team" }, [animalFace(a), W.teamLabel(1) + ": " + a.name]), c0.firstChild);
      c1.insertBefore(h("p", { "class": "cb-card__team" }, [animalFace(b), W.teamLabel(2) + ": " + b.name]), c1.firstChild);
      var swap = btn(W.again, "cb-btn--go cb-btn--big", function () { var t = team; team = { a: t.b, b: t.a, stop: t.stop, phase: "A", cards: [], prev: t.prev }; store.current = team.a; save(); startStop(t.stop); }, "replay");
      screen([stopHud(stop, steps, steps.length), h("div", { "class": "cb-board" }, [h("h3", { "class": "cb-board__h", text: W.team }), h("div", { "class": "cb-cards2" }, [c0, c1]),
        h("p", { "class": "cb-msg", text: W.bothTeams }), h("div", { "class": "cb-row cb-card__btns" }, [swap, btn(W.back, "cb-btn--quiet", function () { showMap(); }, "back")])])]);
      playCard(c0); playCard(c1);
      say(W.bothTeams); return;
    }
    if (team && team.phase === "A") team.cards.push(cardEl.cloneNode(true));
    screen([stopHud(stop, steps, steps.length), h("div", { "class": "cb-board cb-board--result" }, [cardEl, buttons])]);
    frame(); playCard(cardEl);
  }
  function startStop(id) {
    feedbackStop = id; feedbackScore = null;
    if (REG[id]) runModule(id); else if (id === "listen-to-every-neighbor") stop3(); else if (id === "fact-or-rumor") stop4();
  }

  /* ── Stop 3 · Listen to Every Neighbor ─────────────────────────────── */
  function stop3() {
    feedbackScore = null;
    inStop = true; mode = "stop";
    var stop = STOPS[2], r = rec(stop.id);
    var set = team && team.phase === "B" && team.setA ? (team.setA === "A" ? "B" : "A") : (r && r.lastSet ? (r.lastSet === "A" ? "B" : "A") : (Math.random() < 0.5 ? "A" : "B"));
    if (team && team.phase === "A") team.setA = set;
    var lines = SETS[set], listened = {}, found = {}, unplanned = 0, right = 0, picked = null, foundPairs = [], pairOf = {}, lastWish = null;
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
      var ln = lines[n.id];
      dialog(nmCap(n), [h("div", { "class": "cb-say" }, [
        h("div", { "class": "cb-say__b" }, [h("span", { "class": "cb-say__k" }, [ico("sun"), S3.hope]), h("p", { text: t2(ln[0]) })]),
        h("div", { "class": "cb-say__b cb-say__b--worry" }, [h("span", { "class": "cb-say__k" }, [ico("cloud"), S3.worry]), h("p", { text: t2(ln[2]) })])])],
      b, function () {
        if (!listened[n.id]) { listened[n.id] = 1; say(S3.listenedN(Object.keys(listened).length)); part1(n.id); }
      }, { face: n.img, sub: n.role[L] });
    }
    function part1(focusId) {
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
      var A = lines[picked], B = lines[n.id], tagsA = [A[1], A[3]], tagsB = [B[1], B[3]], shared = tagsA.filter(function (t) { return t && tagsB.indexOf(t) !== -1; });
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
      var pool = [];
      NB.forEach(function (n) { pool.push([n, lines[n.id][0]]); pool.push([n, lines[n.id][2]]); });
      var qs = shuffle(pool).slice(0, 4), qi = 0;
      qs.forEach(function (q) { q.order = shuffle(NB); });          // the six faces keep their places while you answer
      function ask(feedback, chosen, ok) {
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
      ask();
    }
    function finish() {
      var nL = Object.keys(listened).length, nW = Object.keys(found).length;
      var p2 = Math.max(0, 6 * nW - 2 * Math.max(0, unplanned - 3));
      var score = 6 * nL + p2 + 10 * right;
      var skipped = NB.filter(function (n) { return !listened[n.id]; })[0];
      var tip = skipped ? S3.tipSkip(nm(skipped)) : unplanned > 3 ? S3.tipPairs : nW < 4 ? S3.tipWish : right < 4 ? S3.tipLine : S3.tip100;
      var info = saveRound(stop.id, score, { lastSet: set });
      inStop = false;
      var card = scoreCard(stop, score, info, tip, S3.can, S3.real);
      finishRound(stop.id, card, cardButtons(stop.id, stop3));
      say(W.score + " " + score + " / 100");
    }
    part1();
  }

  /* ── Stop 4 · Fact or Rumor? ──────────────────────────────────────── */
  function stop4() {
    feedbackScore = null;
    inStop = true; mode = "stop";
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
    var ci = 0, DOTS = [null, null, null, null, null];
    function whoLine(c) { return c.kind === "neighbor" ? S4.at(nmCap(c.who)) : c.kind === "flyer" ? S4.flyer : S4.chat; }
    function basketIcon(k, cls) { var s = h("span", { "class": cls || "cb-basket__ic", "aria-hidden": "true" }); s.innerHTML = BASKET_ICON[k]; return s; }

    function startScreen() {
      var kindsEl = h("ul", { "class": "cb-kinds" }, ["fact", "rumor", "dontknow"].map(function (k) { return h("li", { "data-k": k }, [basketIcon(k), h("span", { text: S4.b[k] })]); }));
      screen([stopHud(stop, null), h("div", { "class": "cb-board" }, [h("div", { "class": "cb-bakery" }, [bakery(null), h("div", { "class": "cb-intro" }, [
        h("p", { "class": "cb-intro__lead", text: S4.intro }), kindsEl,
        h("div", { "class": "cb-row" }, [btn(S4.start, "cb-btn--go cb-btn--big", function () { play(); }, "go", true)])])])])]);
      frame();
    }
    function play(feedback, ok) {
      var c = round[ci], done = !!c.sorted;
      var from = h("p", { "class": "cb-claim__from" }, [c.who ? img(c.who.img, "") : ico(c.kind === "flyer" ? "flyer" : "chat"), h("span", { text: whoLine(c) })]);
      var peekBox = h("div", { "class": "cb-source", id: "cb-peek", hidden: !(c.peeked || done) || null }, [h("dl", null, [
        h("dt", { text: S4.whoT }), h("dd", { text: whoLine(c) }), h("dt", { text: S4.howT }), h("dd", { text: c.how }), h("dt", { text: S4.whenT }), h("dd", { text: c.when })])]);
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
      var score = round.reduce(function (s, c) { return s + (c.peeked ? 6 : 0) + (c.sorted === c.right ? 14 : 0); }, 0);
      var noPeekNb = round.filter(function (c) { return !c.peeked && c.who; })[0], noPeek = round.some(function (c) { return !c.peeked; });
      var miss = function (k) { return round.some(function (c) { return c.right === k && c.sorted !== k; }); };
      var tip = noPeekNb ? S4.tipNb(nm(noPeekNb.who)) : noPeek ? S4.tipPeek : miss("rumor") ? S4.tipRumor : miss("dontknow") ? S4.tipDk : miss("fact") ? S4.tipFact : S4.tip100;
      var info = saveRound(stop.id, score, { lastClaims: ids.slice().sort(function (a, b) { return a - b; }) });
      inStop = false;
      var list = h("div", { "class": "cb-your5" }, [h("strong", { text: S4.your5 }), h("ul", null, round.map(function (c) {
        return h("li", { "data-k": c.right }, [basketIcon(c.right, "cb-your5__ic"), h("q", { text: c.text }), h("span", { "class": "cb-your5__k", text: S4.b[c.right] })]);
      }))]);
      var gu = btn(S4.gu, "cb-btn--quiet", function () { dialog(S4.gu, [h("p", { text: S4.guText })], gu); }, "family");
      var card = scoreCard(stop, score, info, tip, S4.can, S4.real, list);
      finishRound(stop.id, card, cardButtons(stop.id, stop4, gu));
      say(W.score + " " + score + " / 100");
    }
    startScreen();
  }

  /* ── stop modules: one file per stop in stops/, registered through window.CommunityBuilders ── */
  var REG = {};
  function stopById(id) { return STOPS.filter(function (s) { return s.id === id; })[0] || null; }
  function runModule(id) {
    feedbackStop = id; feedbackScore = null;
    var def = REG[id], stop = stopById(id);
    inStop = true; mode = "stop"; setTitle(stop.name);
    try { def.run(API, stop); }
    catch (e) { inStop = false; showMap(W.moreSoon); if (window.console) console.error("Stop " + id + " failed", e); }
  }
  /* painted crop of the town map: rect = [x0, y0, x1, y1] as fractions of the map; returns a .cb-art panel */
  function crop(rect, cls, kids) {
    var w = Math.max(0.2, Math.min(1, rect[2] - rect[0])), k = 1 / w;
    var ox = w >= 1 ? 0.5 : rect[0] / (1 - w), oy = w >= 1 ? 0.5 : Math.max(0, Math.min(1, rect[1] / (1 - w)));
    var im = img("town-map@2x", "", "cb-art__map cb-art__map--crop", true);   // the sharpened 2x painting: crops enlarge it
    var pos = (ox * 100).toFixed(2) + "% " + (oy * 100).toFixed(2) + "%";
    im.style.setProperty("object-position", pos); im.style.setProperty("transform-origin", pos); im.style.setProperty("transform", "scale(" + k.toFixed(3) + ")");
    return h("div", { "class": "cb-art" + (cls ? " " + cls : "") }, [im].concat(kids || []));
  }
  var API = {
    L: L, W: W, X: X, BASE: BASE, REDUCED: REDUCED, STOPS: STOPS, NB: NB, CHAP: CHAP, ANIMALS: ANIMALS, STAR_ON: STAR_ON, STAR_OFF: STAR_OFF, BASKET_ICON: BASKET_ICON,
    h: h, ico: ico, IC: IC, img: img, story: story, mono: mono, btn: btn, shuffle: shuffle, pick: pick, starsFor: starsFor, t2: t2, nm: nm, nmCap: nmCap, nbById: nbById, stopById: stopById,
    say: say, setTitle: setTitle, screen: screen, stopHud: stopHud, coach: coach, fb: fb, frame: frame, dialog: dialog, crop: crop, animalFace: animalFace,
    rec: function (id) { return rec(id); }, saveRound: saveRound, scoreCard: scoreCard, cardButtons: cardButtons, finishRound: finishRound,
    restart: function (id) { return function () { startStop(id); }; }, showMap: function (msg) { showMap(msg); },
    endPlay: function () { inStop = false; }, team: function () { return team; }
  };
  window.CommunityBuilders = {
    register: function (def) {
      if (!def || !def.id || !stopById(def.id) || typeof def.run !== "function") return;
      REG[def.id] = { steps: def.steps || [null, null, null], run: def.run };
      PLAYABLE[def.id] = 1;
      if (def.css) document.head.appendChild(h("link", { rel: "stylesheet", href: BASE + "stops/" + def.css }));
      if (booted && mode === "map" && !inStop) showMap();
    }
  };
  var booted = false;
  function boot() {
    if (booted) return; booted = true;
    var played = Object.keys(store.players).some(function (k) { return Object.keys(store.players[k].stops || {}).length; });
    if (played) showMap(); else showTitle();
  }
  function loadModules(list) {
    var left = list.length; if (!left) return boot();
    list.forEach(function (m) {
      var sc = h("script", { src: BASE + "stops/" + m + ".js" });
      sc.onload = sc.onerror = function () { if (--left === 0) boot(); };
      document.head.appendChild(sc);
    });
    setTimeout(boot, 2500);                     // never leave the stage empty
  }
  var extra = [];
  try { (new URLSearchParams(location.search).getAll("cbstop")).forEach(function (m) { if (/^\d\d-[a-z-]+$/.test(m)) extra.push(m); }); } catch (e) { /* old browser */ }
  var man = h("script", { src: BASE + "stops/manifest.js" });
  man.onload = function () { var list = (window.CB_STOP_MODULES || []).filter(function (m) { return /^\d\d-[a-z-]+$/.test(m); }); extra.forEach(function (m) { if (list.indexOf(m) < 0) list.push(m); }); loadModules(list); };
  man.onerror = function () { loadModules(extra); };
  document.head.appendChild(man);
})();
