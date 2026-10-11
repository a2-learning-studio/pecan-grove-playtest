/* Community Builders of Pecan Grove · Stop 11 · Weigh the Trade-offs / Pesa lo bueno y lo difícil
   Four signposts stand in the painted town square. Each path hangs 2 good parts and 2 hard parts on a
   pecan-wood balance that always settles level. The player weighs the paths, names who a path helps and who
   could find it hard, then adds one change that makes a hard part easier. Every path can earn 100.
   Score (process only): +10 for each path weighed before choosing; +20 first tap / +10 second tap / 0 shown,
   for each of the two neighbor steps and for the change. No time bonus.
   Words, cards, scoring and tips are exact from "11 - weigh-the-tradeoffs.md" (11A-11G). No network, no inputs. */
(function () {
  "use strict";
  var CB = window.CommunityBuilders; if (!CB) return;
  var LANG = (document.documentElement.lang || "en").slice(0, 2) === "es" ? "es" : "en";
  var NS = "http://www.w3.org/2000/svg";
  var RUN = 0;                                                   // one live round at a time (resize listener)

  /* ── words (exact, from the spec) ──────────────────────────────────── */
  var S = {
    en: {
      title: "Weigh the Trade-offs - Community Builders of Pecan Grove",
      intro: ["The hearing is over. Before the Town Council decides, it weighs four paths.",
        "Every path has good parts and hard parts. Help the town see them all.",
        "There's no wrong path. Points come from weighing well."],
      start: "Start",
      parts: { good: "Good parts", hard: "Hard parts" }, kind: { good: "Good part", hard: "Hard part" }, changes: "Changes",
      bowlN: { good: function (n) { return n + " good"; }, hard: function (n) { return n + " hard"; } },
      p1: "Tap each signpost to weigh its good parts and hard parts.",
      weighed: "Weighed", weighedL: "weighed",
      weighedN: function (n) { return "Paths weighed: " + n + " of 4"; },
      choose: "Choose this path",
      ask: function (n) { return "You weighed " + n + " of 4 paths. Weighing every path helps you see the whole picture."; },
      more: "Weigh more paths",
      yours: "Your path",
      chose: function (p) { return "You chose: " + p + ". Now look closely at its cards."; },
      q: ["Who does this path help? Tap a neighbor.", "Who could find this path hard? Tap a neighbor."],
      nb: function (n) { return n + ", neighbor"; },
      ok: [function (n) { return "Yes! A good part reaches " + n + "."; }, function (n) { return "Yes! A hard part reaches " + n + "."; }],
      wrong: [function (n) { return "Good thinking. In this round, the good parts don't reach " + n + " much. Read them again."; },
        function (n) { return "Good thinking. In this round, the hard parts don't reach " + n + " much. Read them again."; }],
      tried: "Tried",
      shown: ["Here is who it helps:", "Here is who could find it hard:"],
      p3: "Add one change that makes a hard part easier. Tap a change.",
      okChg: "Good change! It makes this hard part easier:",
      easier: "Easier now",
      idea: ["That's a real idea! It helps a different hard part:", "Look at your path's hard parts and try again."],
      fits: "Here is a change that fits:",
      finish: "Finish",
      aha: "Every path, even 'don't build' or 'wait', helps someone and is hard for someone.",
      see: "See my score",
      can: "I can see that every plan has good parts and hard parts.",
      tipWeigh: "Next time, weigh all four paths before you choose.",
      tipGood: "Next time, read the good parts slowly. Who would be glad?",
      tipHard: "Next time, read the hard parts slowly. Who would feel them?",
      tipChange: "Next time, pick a change that fits one of your path's hard parts.",
      tip100: "Great weighing! Try a new round with a different path.",
      real: "Choose something your family is deciding, like a weekend plan. Name one good part and one hard part of each choice.",
      askT: "Ask a grown-up", askQ: "When you make a big choice, how do you weigh the good parts and the hard parts?",
      gu: "For grown-ups: about this stop",
      guText: "There are four paths: build as planned, build with changes, don't build here, or wait for more information. Each has gains and costs, and each can earn full points. The score rewards exploring every path and naming who gains and who finds it hard. It never rewards the path chosen."
    },
    es: {
      title: "Pesa lo bueno y lo difícil - Constructores de comunidad de Pecan Grove",
      intro: ["La audiencia ya terminó. Antes de decidir, el Concejo del pueblo pesa cuatro caminos.",
        "Cada camino tiene partes buenas y partes difíciles. Ayuda al pueblo a verlas todas.",
        "No hay un camino equivocado. Los puntos vienen de pesar bien."],
      start: "Empezar",
      parts: { good: "Partes buenas", hard: "Partes difíciles" }, kind: { good: "Parte buena", hard: "Parte difícil" }, changes: "Cambios",
      bowlN: { good: function (n) { return n + " buenas"; }, hard: function (n) { return n + " difíciles"; } },
      p1: "Toca cada letrero para pesar sus partes buenas y sus partes difíciles.",
      weighed: "Ya lo pesaste", weighedL: "ya lo pesaste",
      weighedN: function (n) { return "Caminos que pesaste: " + n + " de 4"; },
      choose: "Elegir este camino",
      ask: function (n) { return "Pesaste " + n + " de 4 caminos. Pesar todos los caminos te ayuda a ver el panorama completo."; },
      more: "Pesar más caminos",
      yours: "Tu camino",
      chose: function (p) { return "Elegiste: " + p + ". Ahora mira de cerca sus tarjetas."; },
      q: ["¿A quién ayuda este camino? Toca a un vecino.", "¿A quién se le podría hacer difícil este camino? Toca a un vecino."],
      nb: function (n) { return n + ", vecino"; },
      ok: [function (n) { return "¡Sí! Una parte buena le llega a " + n + "."; }, function (n) { return "¡Sí! Una parte difícil le llega a " + n + "."; }],
      wrong: [function (n) { return "Buena idea. En esta ronda, las partes buenas casi no le llegan a " + n + ". Vuelve a leerlas."; },
        function (n) { return "Buena idea. En esta ronda, las partes difíciles casi no le llegan a " + n + ". Vuelve a leerlas."; }],
      tried: "Ya probaste",
      shown: ["Mira a quién ayuda:", "Mira a quién se le podría hacer difícil:"],
      p3: "Agrega un cambio que haga más fácil una parte difícil. Toca un cambio.",
      okChg: "¡Buen cambio! Hace más fácil esta parte difícil:",
      easier: "Ahora es más fácil",
      idea: ["¡Es una idea real! Ayuda con otra parte difícil:", "Mira las partes difíciles de tu camino y prueba otra vez."],
      fits: "Este cambio sí encaja:",
      finish: "Terminar",
      aha: "Cada camino, incluso 'no construir' o 'esperar', ayuda a alguien y a alguien se le hace difícil.",
      see: "Ver mi puntaje",
      can: "Puedo ver que cada plan tiene partes buenas y partes difíciles.",
      tipWeigh: "La próxima vez, pesa los cuatro caminos antes de elegir.",
      tipGood: "La próxima vez, lee despacio las partes buenas. ¿Quién se alegraría?",
      tipHard: "La próxima vez, lee despacio las partes difíciles. ¿Quién las sentiría?",
      tipChange: "La próxima vez, elige un cambio que encaje con una parte difícil de tu camino.",
      tip100: "¡Muy bien pesado! Prueba una nueva ronda con otro camino.",
      real: "Elige algo que tu familia esté decidiendo, como un plan de fin de semana. Di una parte buena y una difícil de cada opción.",
      askT: "Pregúntale a un adulto", askQ: "Cuando tomas una decisión grande, ¿cómo pesas las partes buenas y las difíciles?",
      gu: "Para adultos: sobre esta parada",
      guText: "Cuatro caminos: construir como se planeó, construir con cambios, no construir aquí o esperar más información. Cada uno tiene beneficios y costos, y cada uno puede ganar todos los puntos. El puntaje premia explorar cada camino y nombrar a quién ayuda y a quién se le hace difícil, nunca el camino elegido."
    }
  }[LANG];
  /* Spanish: "a" + "el Sr. ..." contracts to "al Sr. ..." (natural Spanish; the article stays) */
  function al(s) { return LANG === "es" ? s.replace(/ a el /g, " al ") : s; }

  /* ── the 32 path cards (11C, 11D): icon, line, the neighbors it reaches, and the change that fits a hard part ── */
  function K(ic, en, es, who, fix) { return { ic: ic, t: [en, es], who: who, fix: fix || null }; }
  var PATHS = {
    plan: { ic: "building", n: ["Build as planned", "Construir como se planeó"],
      g: [K("hardhat", "Lots of building jobs start right away.", "Muchos trabajos de construcción empiezan enseguida.", ["ana", "ruth"]),
        K("bread", "Crews buy lunch on Main Street every day.", "Los equipos de la obra compran comida en la calle principal todos los días.", ["patel"]),
        K("coin", "New tax money could help the school soon.", "El dinero nuevo de impuestos podría ayudar pronto a la escuela.", ["jayden"]),
        K("signal", "A fast internet line could reach the clinic.", "Una línea rápida de internet podría llegar a la clínica.", ["lee"])],
      h: [K("droplet", "On hot days, cooling could use a lot of water.", "En días de calor, el enfriamiento podría usar mucha agua.", ["johnson", "lee"], "water"),
        K("moon", "Bright lights and a low hum near homes at night.", "Luces fuertes y un zumbido grave cerca de las casas de noche.", ["jayden", "johnson", "lee"], "trees"),
        K("engine", "Backup engines get tested and make some smoke.", "Los motores de respaldo se prenden para pruebas y echan algo de humo.", ["lee"], "engines"),
        K("key", "Rents could go up while crews are in town.", "Las rentas podrían subir mientras los equipos de la obra están en el pueblo.", ["patel", "ana"], "housing")] },
    changes: { ic: "buildwrench", n: ["Build with changes", "Construir con cambios"],
      g: [K("hardhat", "Building jobs, with a promise to hire people from here.", "Trabajos de construcción, con la promesa de contratar a gente de aquí.", ["ana", "ruth"]),
        K("tree", "A wide strip of trees between the building and the farm next door.", "Una franja ancha de árboles entre el edificio y la granja de al lado.", ["johnson"]),
        K("book", "The school gets a class to train electricians.", "La escuela tiene una clase para formar electricistas.", ["jayden", "ana"]),
        K("moon", "Lights point down, so nights stay dark.", "Las luces apuntan hacia abajo, y las noches siguen oscuras.", ["lee", "jayden"])],
      h: [K("coin", "The changes cost money, so the company asks to pay less tax for a while.", "Los cambios cuestan dinero, así que la empresa pide pagar menos impuestos por un tiempo.", ["jayden", "ruth"], "taxfund"),
        K("hourglass", "Agreeing on every change takes months, and the work waits.", "Ponerse de acuerdo en cada cambio toma meses, y la obra espera.", ["ana", "patel"], "date"),
        K("emptybuild", "If it closes someday, the empty building could stay.", "Si algún día cierra, el edificio vacío podría quedarse ahí.", ["johnson", "ruth"], "bond"),
        K("truck", "Lots of trucks on Main Street while they build.", "Muchos camiones en la calle principal mientras construyen.", ["patel", "lee"], "route")] },
    no: { ic: "field", n: ["Don't build here", "No construir aquí"],
      g: [K("droplet", "The farm fields and the creek stay as they are.", "Los campos de la granja y el arroyo se quedan como están.", ["johnson", "ana"]),
        K("moon", "Nights stay quiet and dark.", "Las noches siguen tranquilas y oscuras.", ["jayden", "lee", "johnson"]),
        K("tree", "The big pecan trees and the old places stay.", "Los nogales grandes y los lugares antiguos se quedan.", ["ruth", "jayden"]),
        K("road", "Main Street keeps its usual traffic.", "La calle principal sigue con su tráfico de siempre.", ["patel", "lee"])],
      h: [K("hardhat", "No new building jobs here.", "No hay trabajos nuevos de construcción aquí.", ["ana", "ruth"], "class"),
        K("coin", "No new tax money for the school.", "No llega dinero nuevo de impuestos para la escuela.", ["jayden"], "lot"),
        K("bread", "Main Street doesn't get new lunch customers.", "La calle principal no recibe clientes nuevos a la hora de comer.", ["patel"], "lot"),
        K("book", "Young people may still move away to find tech jobs.", "Los jóvenes podrían seguir yéndose a buscar trabajos de tecnología.", ["jayden", "ruth"], "class")] },
    wait: { ic: "waitlens", n: ["Wait for more information", "Esperar más información"],
      g: [K("lens", "Time to test the wells and the creek first.", "Hay tiempo para revisar primero los pozos y el arroyo.", ["johnson", "ana"]),
        K("shovel", "Time to look for old graves before any digging.", "Hay tiempo para buscar tumbas antiguas antes de excavar.", ["ruth"]),
        K("helmet", "Time to plan with the fire station for the big batteries.", "Hay tiempo para planear con los bomberos qué hacer con las baterías grandes.", ["lee"]),
        K("truck", "Time to study where the trucks would drive.", "Hay tiempo para estudiar por dónde pasarían los camiones.", ["patel", "jayden"])],
      h: [K("hourglass", "Families next to the farm wait months to know what's coming.", "Las familias junto a la granja esperan meses para saber qué viene.", ["johnson"], "date"),
        K("hardhat", "Building jobs, if they come, start later.", "Los trabajos de construcción, si llegan, empiezan más tarde.", ["ana", "ruth"], "class"),
        K("road", "The company could choose another town.", "La empresa podría elegir otro pueblo.", ["patel", "jayden", "ana"], "date"),
        K("coin", "The town pays for the studies.", "El pueblo paga los estudios.", ["ruth", "patel"], "studies")] }
  };
  var ORDER = ["plan", "changes", "no", "wait"];                 // the spec's order; each round shuffles it
  /* part 2 asks who a path helps or makes things hard for. The [names] on each card stay code-only (spec), so each neighbor
     plate says what matters to them, using facts from earlier stops; a player can then reason their way to every right answer */
  var CARES = {
    lee: ["Night nurse at the clinic on Main Street", "Enfermera de noche en la clínica de la calle principal"],
    johnson: ["Farms next door; his well is close by", "Siembra al lado; su pozo está cerca"],
    ana: ["Builds things; fishes in the creek with her kids", "Construye cosas; pesca en el arroyo con sus hijos"],
    ruth: ["Keeps the town's stories; her grandson needs work", "Guarda las historias del pueblo; su nieto busca trabajo"],
    patel: ["Runs the bakery on Main Street; pays town taxes", "Tiene la panadería en la calle principal; paga impuestos"],
    jayden: ["Student who loves tech; has a little sister", "Estudiante, le encanta la tecnología; tiene una hermanita"]
  };

  /* ── the 11 change cards (11E): icon, name, the line that shows after a tap ── */
  function F(ic, n, line) { return { ic: ic, n: n, line: line }; }
  var FIX = {
    water: F("recycle", ["Cool it with recycled water", "Enfriar con agua reciclada"], ["Then less well and river water is used.", "Así se usa menos agua de los pozos y del río."]),
    trees: F("tree", ["A wide strip of trees and land near homes", "Una franja ancha de árboles y terreno cerca de las casas"], ["Trees and distance soften light and sound.", "Los árboles y la distancia suavizan la luz y el sonido."]),
    engines: F("engine", ["Cleaner engines, tested less often", "Motores más limpios, que se prueban menos"], ["Less smoke near the clinic.", "Menos humo cerca de la clínica."]),
    housing: F("key", ["A plan for where workers will live", "Un plan de dónde vivirán los trabajadores"], ["So rents in town don't jump.", "Para que las rentas del pueblo no suban de golpe."]),
    taxfund: F("coinjar", ["A shorter tax break and a savings fund for the school", "Una reducción de impuestos más corta y un fondo de ahorro para la escuela"], ["The school still gets steady money.", "La escuela sigue recibiendo dinero estable."]),
    date: F("calendar", ["Set a clear date to decide", "Poner una fecha clara para decidir"], ["Everyone knows when the answer comes.", "Todos saben cuándo llega la respuesta."]),
    bond: F("piggy", ["Money saved now to take it down if it closes", "Dinero guardado desde ahora para quitarlo si cierra"], ["No empty building is left behind.", "No se queda un edificio vacío."]),
    route: F("road", ["A truck route away from Main Street and the school", "Una ruta de camiones lejos de la calle principal y de la escuela"], ["Shoppers and school buses keep moving.", "Los clientes y los autobuses escolares siguen avanzando."]),
    "class": F("book", ["An electrician class at the school", "Una clase de electricistas en la escuela"], ["Young people can train for good jobs nearby.", "Los jóvenes pueden prepararse para buenos trabajos cerca."]),
    lot: F("factory", ["Suggest an old factory lot instead of the farm", "Proponer el terreno de una fábrica vieja en vez de la granja"], ["New business could still come to town.", "Igual podría llegar un negocio nuevo al pueblo."]),
    studies: F("lens", ["The company pays for the studies", "La empresa paga los estudios"], ["The town keeps its money for other things.", "El pueblo guarda su dinero para otras cosas."])
  };

  /* ── authored icons: 24-unit grid, one 2px round stroke (the shell's api.IC family; series icons as in Stop 5) ── */
  var ICONS = {
    building: '<path d="M2.5 20.5h19"/><path d="M4.5 20.5V8.2A1.2 1.2 0 0 1 5.7 7h12.6a1.2 1.2 0 0 1 1.2 1.2v12.3"/><path d="M8 10.6h1.5M11.25 10.6h1.5M14.5 10.6H16M8 14h1.5M14.5 14H16"/><path d="M10.5 20.5v-3.6h3v3.6"/>',
    buildwrench: '<path d="M2.5 20.5h9.5"/><path d="M4 20.5V8.2A1.2 1.2 0 0 1 5.2 7h8.6A1.2 1.2 0 0 1 15 8.2v2.3"/><path d="M7 10.6h1.5M10.4 10.6h1.5M7 14h1.5"/><path d="M8 20.5v-3.4h2.6"/><path d="m13 20.7 4.4-4.4"/><path d="M17.4 16.3a3.1 3.1 0 0 0 3.9-3.9l-1.9 1.9-1.8-.2-.2-1.8 1.9-1.9a3.1 3.1 0 0 0-3.9 3.9z"/>',
    field: '<path d="M2.8 20.5 6.6 11.2h10.8l3.8 9.3z"/><path d="M9.8 11.2 8.6 20.5M12 11.2v9.3M14.2 11.2l1.2 9.3"/><path d="M12 11.2V7.2"/><path d="M12 8.9c0-1.9 1.3-3.2 3.3-3.2 0 1.9-1.3 3.2-3.3 3.2z"/><path d="M12 9.4c0-1.7-1.2-2.9-3.1-2.9 0 1.7 1.2 2.9 3.1 2.9z"/>',
    waitlens: '<path d="M3 3.5h6M3 20.5h6"/><path d="M3.8 3.5c0 4 2.2 5 2.2 8.5s-2.2 4.5-2.2 8.5M8.2 3.5c0 4-2.2 5-2.2 8.5s2.2 4.5 2.2 8.5"/><circle cx="15.5" cy="10" r="4.6"/><path d="m18.8 13.3 3 3"/>',
    hardhat: '<path d="M3.5 17.5h17"/><path d="M5.5 17.5V15a6.5 6.5 0 0 1 13 0v2.5"/><path d="M10.5 8.8V12M13.5 8.8V12"/>',
    bread: '<path d="M7 20h10a1 1 0 0 0 1-1v-8.2a3.4 3.4 0 0 0 1.5-2.8C19.5 5.6 16.5 4 12 4S4.5 5.6 4.5 8a3.4 3.4 0 0 0 1.5 2.8V19a1 1 0 0 0 1 1z"/><path d="M9.5 10.5l1 1.6M13 9.5l1 1.6M10.5 14.5l1 1.6"/>',
    coin: '<circle cx="12" cy="12" r="8.5"/><path d="M14.6 9.4c-.5-.9-1.5-1.4-2.7-1.4-1.5 0-2.6.8-2.6 1.9 0 1.2 1.1 1.7 2.7 2s2.7.9 2.7 2.1-1.2 2-2.7 2c-1.3 0-2.3-.5-2.8-1.5M12 6.4V8M12 16v1.6"/>',
    signal: '<path d="M12 18.4v.2"/><path d="M8.7 15a4.7 4.7 0 0 1 6.6 0"/><path d="M5.7 12a8.9 8.9 0 0 1 12.6 0"/><path d="M2.8 9a13 13 0 0 1 18.4 0"/>',
    droplet: '<path d="M12 3.5c3.1 4 6.2 7.2 6.2 10.6a6.2 6.2 0 0 1-12.4 0C5.8 10.7 8.9 7.5 12 3.5z"/><path d="M9.3 14.4a2.8 2.8 0 0 0 2.3 2.6"/>',
    moon: '<path d="M19 14.6A7.6 7.6 0 1 1 9.4 5a6 6 0 0 0 9.6 9.6z"/><path d="M16.5 3.5v2.4M15.3 4.7h2.4"/>',
    engine: '<rect x="3.5" y="6.5" width="17" height="11.5" rx="2.5"/><circle cx="9.5" cy="12.25" r="3.4"/><path d="M9.5 12.25 9.5 9.6M9.5 12.25l2.3 1.4M9.5 12.25l-2.3 1.4"/><path d="M15.5 10h2.5M15.5 12.3h2.5M15.5 14.6h2.5"/><path d="M6.5 18v2M17.5 18v2"/>',
    key: '<path d="M3.5 11.4 7.5 8l4 3.4v5.1h-8z"/><path d="M7.5 12.6v1.4"/><path d="M11.5 13.8h9M17.3 13.8v2.8M20.5 13.8v2.2"/>',
    tree: '<path d="M12 20.5v-6.2"/><path d="m12 16.2-2.4-1.9M12 17.2l2.3-1.8"/><path d="M8.2 14.6a3.9 3.9 0 0 1-1.6-7.4 5.5 5.5 0 0 1 10.8 0 3.9 3.9 0 0 1-1.6 7.4z"/><path d="M8.5 20.5h7"/>',
    book: '<path d="M12 6.8C10.2 5.5 7.7 4.8 4.5 4.8v12.9c3.2 0 5.7.7 7.5 2 1.8-1.3 4.3-2 7.5-2V4.8c-3.2 0-5.7.7-7.5 2z"/><path d="M12 6.8v12.9"/>',
    hourglass: '<path d="M6.5 3.5h11M6.5 20.5h11"/><path d="M7.7 3.5c0 4.4 4.3 5.3 4.3 8.5s-4.3 4.1-4.3 8.5M16.3 3.5c0 4.4-4.3 5.3-4.3 8.5s4.3 4.1 4.3 8.5"/><path d="M9.6 18.2h4.8"/>',
    emptybuild: '<path d="M2.5 20.5h19"/><path d="M4.5 18V9.2a1.2 1.2 0 0 1 1.2-1.2h12.6a1.2 1.2 0 0 1 1.2 1.2V18" stroke-dasharray="2.4 2.6"/><path d="M9.5 18v-4h5v4" stroke-dasharray="2 2.4"/>',
    truck: '<path d="M4 6h8a1.5 1.5 0 0 1 1.5 1.5v8h-11v-8A1.5 1.5 0 0 1 4 6z"/><path d="M13.5 9.5h3.8l3.2 3.6v2.4h-7"/><circle cx="7" cy="17.5" r="2"/><circle cx="17" cy="17.5" r="2"/>',
    road: '<path d="M9 3.5 5 20.5M15 3.5l4 17"/><path d="M12 5v2.6M12 10.7v2.6M12 16.4V19"/>',
    lens: '<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5.5 5.5"/>',
    shovel: '<path d="m15.6 3.6 4.8 4.8"/><path d="M18 6l-6.4 6.4"/><path d="M9.8 10.6l3.6 3.6-4.6 4.6a2.55 2.55 0 0 1-3.6-3.6z"/>',
    helmet: '<path d="M2.6 16.6h15c1.4 0 2.6.6 3.4 1.7l.6.9"/><path d="M5 16.6c0-4.5 3.1-7.8 7-7.8s7 3.3 7 7.8"/><path d="M12 8.8c0-1.6.8-2.9 2.3-3.6"/><path d="M12 10.9l2 .7v2c0 1.1-.9 2-2 2.4-1.1-.4-2-1.3-2-2.4v-2z"/>',
    recycle: '<path d="M12 8.6c1.6 2 2.8 3.5 2.8 5a2.8 2.8 0 0 1-5.6 0c0-1.5 1.2-3 2.8-5z"/><path d="M4.4 11a7.6 7.6 0 0 1 12.7-4.6"/><path d="M17.6 3.4v3.4h-3.4"/><path d="M19.6 13a7.6 7.6 0 0 1-12.7 4.6"/><path d="M6.4 20.6v-3.4h3.4"/>',
    coinjar: '<path d="M7.2 6.5h9.6"/><path d="M8.2 6.5v1.6C6.4 9 5.5 10.6 5.5 12.6v5.9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-5.9c0-2-.9-3.6-2.7-4.5V6.5"/><circle cx="12" cy="14.6" r="2.7"/><path d="M12 2.5v2"/>',
    calendar: '<rect x="3.8" y="5.2" width="16.4" height="15.3" rx="2.2"/><path d="M3.8 9.8h16.4M8.3 3.3v3.8M15.7 3.3v3.8"/><path d="m9.2 15 2 2 3.8-3.8"/>',
    piggy: '<path d="M5.4 11.8a6.3 5.3 0 0 1 11.6-2.9l2.6-1.3v3.5l1.4.9v2.6l-1.9.7a6.4 6.4 0 0 1-2.3 2.4v2.8h-2.6v-1.6a8.2 8.2 0 0 1-3.6 0v1.6H8v-2.9a5.2 5.2 0 0 1-2.6-3.8z"/><path d="M5.4 11.8 3.2 10.6"/><path d="M10 7.2h3.2"/><path d="M15.6 11.4v.1"/>',
    factory: '<path d="M2.5 20.5h19"/><path d="M3.8 20.5v-9.6l5 3.4v-3.4l5 3.4v-3.4l5 3.4V7.2h1.4v13.3"/><path d="M7 17.4h1.6M11.2 17.4h1.6M15.4 17.4H17"/>',
    scale: '<path d="M12 5.4v14.4"/><path d="M8.2 20.5h7.6"/><path d="M4.2 7.4h15.6"/><circle cx="12" cy="5" r="1.3"/><path d="M4.2 7.4 2 12.6M4.2 7.4l2.2 5.2M1.6 12.6a2.6 2.6 0 0 0 5.2 0z"/><path d="M19.8 7.4 17.6 12.6M19.8 7.4l2.2 5.2M17.2 12.6a2.6 2.6 0 0 0 5.2 0z"/>',
    sprout: '<path d="M12 20.5V12"/><path d="M12 12.5C12 9 9.6 6.5 5.5 6.5c0 3.7 2.5 6 6.5 6z"/><path d="M12 14.5c0-3.7 2.4-6.5 6.5-6.5 0 3.9-2.5 6.5-6.5 6.5z"/><path d="M8 20.5h8"/>',
    pebble: '<path d="M5.6 15.8c-1.5-3 .3-6.9 4.3-8.2 4.1-1.4 8.4.3 9.2 3.6.8 3.3-2 6.3-6.2 6.9-3.4.5-6.2-.5-7.3-2.3z"/><path d="M9.6 10.8c.7-.6 1.6-1 2.6-1.1"/><path d="M8 20.6h8"/>'
  };
  var KIND_IC = { good: "sprout", hard: "pebble" };

  /* three unlabelled dots in the header, captioned "Part n of 3" */
  CB.register({ id: "weigh-the-tradeoffs", steps: [null, null, null], css: "11-weigh-the-tradeoffs.css", run: run });

  function run(api, stop) {
    var h = api.h, t2 = api.t2, NB = api.NB, REDUCED = api.REDUCED, myRun = ++RUN;
    document.title = S.title;                                  // the spec's exact page title (the shell's separator is " · ")
    var DOTS = [null, null, null];

    function icon(name, cls) {
      var s = document.createElementNS(NS, "svg");
      s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true"); s.setAttribute("focusable", "false");
      s.setAttribute("class", "cb-ico" + (cls ? " " + cls : ""));
      s.innerHTML = ICONS[name] || api.IC[name];               // constant, authored markup only
      return s;
    }
    function sv(tag, attrs) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
    function q(sel) { return document.querySelector(".cb-s11 " + sel); }

    /* a fast second tap right after a screen change must not land on the new screen's controls */
    var calm = 0;
    function hush() { calm = Date.now() + 450; }
    function busy(e) { return !!(e && e.detail > 0) && Date.now() < calm; }   // pointer taps only: Enter / Space give detail 0

    /* keep the result of a tap in view: scroll just enough that `target` clears the sticky action bar,
       but never so far that `top` (the question, or the tapped control) leaves the screen */
    function wide() { var c = document.querySelector(".cb"); return !c || c.clientWidth >= 900; }
    function scroller() {
      var r = document.querySelector('[data-game="community-builders"]'), fs = document.fullscreenElement || document.webkitFullscreenElement;
      return fs && r && fs === r ? r : window;
    }
    function keep(target, top) {
      if (!target || !target.getBoundingClientRect) return;
      var bar = q(".cb-actions"), vh = window.innerHeight;
      var limit = (bar ? Math.min(bar.getBoundingClientRect().top, vh) : vh) - 12;
      var t = target.getBoundingClientRect(), k = (top || target).getBoundingClientRect();
      var d = t.bottom > limit ? t.bottom - limit : 0;
      if (k.top - d < 12) d = k.top - 12;
      if (Math.abs(d) < 4) return;
      var sc = scroller();
      try { sc.scrollBy({ top: d, behavior: REDUCED ? "auto" : "smooth" }); } catch (e) { sc.scrollBy(0, d); }
    }
    function disc(name, cls) { return h("span", { "class": cls, "aria-hidden": "true" }, [icon(name)]); }
    function nbOf(id) { return api.nbById(id); }
    function face(id, cls) { var n = nbOf(id); return h("span", { "class": cls || "cb-s11-face" }, [api.img(n.img, "", null, true)]); }

    /* ── a new round: every path deals 2 of its 4 good parts and 2 of its 4 hard parts, in random order.
       A replay never repeats a path's pair of good parts or its pair of hard parts, and the signposts move.
       In Team challenge, Team 2 also gets a different deal from Team 1. ── */
    var rec = api.rec(stop.id), T = api.team ? api.team() : null;
    var last = rec && rec.lastRound && typeof rec.lastRound === "object" ? rec.lastRound : null;
    var avoid = T && T.phase === "B" && T.s11 ? T.s11 : null;
    var PAIRS = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];
    function pk(p) { return p && p.length === 2 ? p.slice().sort().join("") : ""; }
    function pickPair(bans) {
      var ok = PAIRS.filter(function (p) { return bans.every(function (b) { return pk(p) !== pk(b); }); });
      return api.shuffle(api.pick(ok.length ? ok : PAIRS));
    }
    function prev(src, id, k) { return src && src[id] ? src[id][k] : null; }
    var deal = {};
    ORDER.forEach(function (id) {
      deal[id] = { g: pickPair([prev(last, id, "g"), prev(avoid && avoid.deal, id, "g")]), h: pickPair([prev(last, id, "h"), prev(avoid && avoid.deal, id, "h")]) };
    });
    function dealKey() { var o = {}; ORDER.forEach(function (id) { o[id] = { g: deal[id].g.slice().sort(), h: deal[id].h.slice().sort() }; }); return o; }
    var lastOrder = rec && rec.lastOrder && rec.lastOrder.join ? rec.lastOrder.join() : "", avoidOrder = avoid && avoid.order ? avoid.order.join() : "";
    var order = api.shuffle(ORDER);
    for (var t = 0; t < 40 && (order.join() === lastOrder || order.join() === avoidOrder); t++) order = api.shuffle(ORDER);
    if (T && T.phase === "A") T.s11 = { deal: dealKey(), order: order.slice() };

    /* ── round state ── */
    var part = 0, showing = null, weighed = {}, asking = false, chosen = null, nWeighed = 0;
    var steps = [{ tried: [], res: null, pick: null }, { tried: [], res: null, pick: null }], step = 0;
    var p3 = { tried: [], res: null, pick: null, seen: {} }, tray = null;
    var stickers = {}, links = [], linksNew = false, motion = null, swing = 1;
    var PTS = { first: 20, second: 10, shown: 0 };

    function cardsOf(pid, k) { var key = k === "good" ? "g" : "h"; return deal[pid][key].map(function (i) { return PATHS[pid][key][i]; }); }
    function rightNbs(s) {
      var ids = {}; cardsOf(chosen, s ? "hard" : "good").forEach(function (c) { c.who.forEach(function (w) { ids[w] = 1; }); });
      return NB.filter(function (n) { return ids[n.id]; }).map(function (n) { return n.id; });
    }
    function fitIds() { var out = []; cardsOf(chosen, "hard").forEach(function (c) { if (out.indexOf(c.fix) < 0) out.push(c.fix); }); return out; }
    function buildTray() {                                     // every change that fits this round's 2 hard parts, plus changes that fit none of the path's 4
      var fit = fitIds(), used = PATHS[chosen].h.map(function (c) { return c.fix; });
      var others = api.shuffle(Object.keys(FIX).filter(function (f) { return used.indexOf(f) < 0; }));
      return api.shuffle(fit.concat(others.slice(0, 4 - fit.length)));
    }
    function otherHard(fid) {                                  // the hard part a non-fitting change helps (prefer one dealt this round)
      var dealt = null, any = null;
      order.forEach(function (pid) {
        if (pid === chosen) return;
        PATHS[pid].h.forEach(function (c, i) { if (c.fix !== fid) return; if (!any) any = c; if (!dealt && deal[pid].h.indexOf(i) >= 0) dealt = c; });
      });
      return dealt || any;
    }
    function nWeighedNow() { return Object.keys(weighed).length; }

    /* ── pieces ── */
    function coachEl() {
      var txt = part === 1 ? S.p1 : part === 2 ? S.q[step] : S.p3, ic = part === 1 ? "scale" : part === 2 ? "people" : "bulb";
      return h("p", { "class": "cb-coach" }, [icon(ic), h("span", { text: txt })]);
    }
    function kindChip(k) { return h("p", { "class": "cb-s11-kind" }, [icon(KIND_IC[k]), h("span", { text: S.kind[k] })]); }

    /* the painted town square: a crop of the town map, the clock-tower building with Main Street beside it */
    function art(rect, cls) { var a = api.crop(rect || [0.40, 0.27, 0.78], "cb-s11-art" + (cls ? " " + cls : "")); a.setAttribute("aria-hidden", "true"); return a; }

    function signs() {
      return h("ul", { "class": "cb-s11-signs" }, order.map(function (id) {
        var P = PATHS[id], w = !!weighed[id], on = showing === id, name = t2(P.n);
        var b = h("button", { type: "button", "class": "cb-s11-sign" + (on ? " is-on" : "") + (w ? " is-weighed" : ""), "data-path": id,
          "aria-pressed": on ? "true" : "false", "aria-label": name + (w ? ", " + S.weighedL : ""), onclick: function (e) { weigh(id, e); } }, [
          h("span", { "class": "cb-s11-sign__ic", "aria-hidden": "true" }, [icon(P.ic), w ? h("span", { "class": "cb-badge" }, [api.ico("check")]) : null]),
          h("span", { "class": "cb-s11-sign__t" }, [h("b", { text: name }), w ? h("small", { text: S.weighed }) : null])]);
        return h("li", null, [b]);
      }));
    }

    /* the balance: the path's sign on top of the post, the beam, a pan of good parts and a pan of hard parts */
    function balance() {
      var pid = part === 1 ? showing : chosen, P = pid ? PATHS[pid] : null;
      var head = h("div", { "class": "cb-s11-head" + (P ? "" : " is-empty") }, P ? [
        chosen ? h("span", { "class": "cb-s11-ribbon", text: S.yours }) : null,
        disc(P.ic, "cb-s11-head__ic"), h("p", { "class": "cb-s11-head__n", text: t2(P.n) })] : [disc("scale", "cb-s11-head__ic")]);
      if (!P) head.setAttribute("aria-hidden", "true");
      var bowls = ["good", "hard"].map(function (k) {             // the small balance on a phone: how many parts sit in each bowl, in words
        var n = P ? cardsOf(pid, k).length : 0;
        return h("span", { "class": "cb-s11-bowl", "data-k": k }, [h("span", { "class": "cb-s11-bowl__dish" }, n ? [h("span", { "class": "cb-s11-bowl__n", text: S.bowlN[k](n) })] : [])]);
      });
      var rig = h("div", { "class": "cb-s11-rig", "aria-hidden": "true" }, [h("span", { "class": "cb-s11-post" }), h("span", { "class": "cb-s11-base" }),
        h("span", { "class": "cb-s11-beam" }, [h("span", { "class": "cb-s11-pivot" })].concat(bowls))]);
      /* the change hangs below the hard pan, on a string to the hard part it makes easier; the pans stay the same size */
      var hk = part === 3 && p3.res ? hungKey() : null;
      return h("div", { "class": "cb-s11-bal" }, [head, rig, pan("good", pid), pan("hard", pid), hk ? hung(p3.pick, +hk.slice(1)) : null]);
    }
    function hanger() {
      var s = sv("svg", { "class": "cb-s11-hanger", viewBox: "0 0 100 40", preserveAspectRatio: "none", "aria-hidden": "true", focusable: "false" });
      s.appendChild(sv("path", { d: "M50 1 4 39M50 1l46 38", "vector-effect": "non-scaling-stroke" }));
      return s;
    }
    function pan(k, pid) {
      var id = "cb-s11-pan-" + k + "-" + myRun;
      var list = [];
      if (pid) cardsOf(pid, k).forEach(function (c, j) { list.push(card(c, k, j)); });
      else list = [0, 1].map(function () { return h("li", { "class": "cb-s11-slot", "aria-hidden": "true" }, [icon(KIND_IC[k])]); });
      return h("section", { "class": "cb-s11-pan", "data-k": k, "aria-labelledby": id }, [hanger(), h("span", { "class": "cb-s11-ring", "aria-hidden": "true" }),
        h("h3", { "class": "cb-s11-pan__h", id: id }, [icon(KIND_IC[k]), h("span", { text: S.parts[k] })]),
        h("ul", { "class": "cb-s11-cards" }, list)]);
    }
    function card(c, k, j) {
      var key = k.charAt(0) + j, st = stickers[key] || [], lit = links.some(function (l) { return l.key === key; });
      var easy = part === 3 && k === "hard" && p3.res && c.fix === p3.pick;
      var li = h("li", { "class": "cb-s11-card" + (lit ? " is-lit" : "") + (easy ? " is-easy" : ""), "data-k": k, "data-card": key }, [
        h("div", { "class": "cb-s11-card__top" }, [disc(c.ic, "cb-s11-card__ic"), kindChip(k),
          st.length ? h("span", { "class": "cb-s11-stk", "aria-hidden": "true" }, st.map(function (id) { return face(id, "cb-s11-stk__f"); })) : null]),
        h("p", { "class": "cb-s11-card__t", text: t2(c.t) }),
        easy ? h("p", { "class": "cb-s11-easy" }, [api.ico("check"), h("span", { text: S.easier })]) : null]);
      li.style.setProperty("--i", String(j + (k === "hard" ? 2 : 0)));
      return li;
    }
    function hungKey() { var key = null; cardsOf(chosen, "hard").forEach(function (c, j) { if (!key && c.fix === p3.pick) key = "h" + j; }); return key; }
    function hung(fid, j) {                                    // the change card hangs under that hard part
      var f = FIX[fid];
      return h("div", { "class": "cb-s11-hung", "data-at": String(j) }, [disc(f.ic, "cb-s11-hung__ic"), h("div", null, [h("b", { text: t2(f.n) }), h("p", { text: t2(f.line) })])]);
    }

    function nbrs() {
      var on = part === 2, st = steps[step], right = on && st.res ? (st.res === "shown" ? rightNbs(step) : [st.pick]) : [];
      return h("ul", { "class": "cb-s11-nbrs" + (on ? " is-live" : "") }, NB.map(function (n) {
        var tried = on && st.tried.indexOf(n.id) >= 0, isR = right.indexOf(n.id) >= 0, name = api.nmCap(n);
        var kids = [h("span", { "class": "cb-s11-nb__face" }, [api.img(n.img, "", null, true), isR ? h("span", { "class": "cb-badge" }, [api.ico("check")]) : null]),
          h("span", { "class": "cb-s11-nb__t" }, [h("b", { text: name }), h("small", { text: n.plain[api.L] }), on ? h("span", { "class": "cb-s11-nb__cares", text: t2(CARES[n.id]) }) : null]),
          tried ? h("span", { "class": "cb-s11-tried", text: S.tried }) : null];
        var cls = "cb-s11-nb" + (isR ? " is-right" : "") + (tried ? " is-tried" : "");
        var el = on ? h("button", { type: "button", "class": cls, "data-nb": n.id, "data-nbt": n.id, "aria-label": S.nb(name) + ", " + t2(CARES[n.id]) + (tried ? ", " + S.tried : ""),
          "aria-disabled": st.res || tried ? "true" : null, onclick: function (e) { tapNb(n.id, e); } }, kids) : h("div", { "class": cls, "data-nbt": n.id }, kids);
        return h("li", null, [el]);
      }));
    }

    function trayEl() {
      var id = "cb-s11-tray-" + myRun, fits = fitIds();
      return h("section", { "class": "cb-s11-tray", "aria-labelledby": id }, [h("h3", { "class": "cb-s11-tray__h", id: id }, [icon("scale"), h("span", { text: S.changes })]),
        h("ul", { "class": "cb-s11-chgs" }, tray.map(function (fid) {
          var f = FIX[fid], tried = p3.tried.indexOf(fid) >= 0, isR = p3.res && p3.pick === fid, seen = p3.seen[fid], name = t2(f.n);
          var b = h("button", { type: "button", "class": "cb-s11-chg" + (tried ? " is-tried" : "") + (isR ? " is-right" : ""), "data-chg": fid,
            "aria-label": name + (tried ? ", " + S.tried : ""), "aria-disabled": p3.res || tried ? "true" : null, onclick: function (e) { tapChg(fid, e); } }, [
            h("span", { "class": "cb-s11-chg__ic", "aria-hidden": "true" }, [icon(f.ic), isR ? h("span", { "class": "cb-badge" }, [api.ico("check")]) : null]),
            h("span", { "class": "cb-s11-chg__t" }, [h("b", { text: name }), seen ? h("small", { text: t2(f.line) }) : null]),
            tried ? h("span", { "class": "cb-s11-tried", text: S.tried }) : null]);
          return h("li", null, [b]);
        }))]);
    }

    /* feedback with pieces: the shell's feedback card, holding lines, cards and faces */
    function fbo(ok, parts, spoken) {
      var kids = []; parts.forEach(function (p, i) { if (i) kids.push(" "); kids.push(p); });
      return { node: h("div", { "class": "cb-feedback" + (ok ? " is-ok" : "") }, [api.ico(ok ? "check" : "bulb"), h("p", { "class": "cb-s11-fbtext" }, kids)]),
        spoken: spoken || parts.filter(function (p) { return typeof p === "string"; }).join(" ") };
    }
    function hl(kid, k) { return h("span", { "class": "cb-s11-hl", "data-k": k }, [kid]); }   // a card's words, marked inside the feedback line
    function miniCard(c, k) { return hl(t2(c.t), k); }
    function miniChange(fid) { return hl(t2(FIX[fid].line), "chg"); }
    function nameChange(fid) { return hl(h("b", { text: t2(FIX[fid].n) }), "chg"); }
    function chips(ids) {                                       // faces with names; hidden commas so the line also reads as a list
      var kids = [];
      ids.forEach(function (id, i) {
        kids.push(h("span", { "class": "cb-s11-chip" }, [face(id, "cb-s11-chips__f"), h("span", { text: api.nmCap(nbOf(id)) })]));
        kids.push(h("span", { "class": "cb-vh", text: i < ids.length - 1 ? ", " : "." }));
      });
      return h("span", { "class": "cb-s11-chips" }, kids);
    }

    function actions(fb) {
      var info = [], btns = [];
      if (part === 1) {
        var n = nWeighedNow();
        if (asking) {
          var bar = h("div", { "class": "cb-actions cb-s11-askbar" }, [h("div", { "class": "cb-actions__info" }, [api.fb(S.ask(n), false)]),
            h("div", { "class": "cb-row cb-s11-askbtns" }, [api.btn(S.more, "cb-btn--big cb-s11-big cb-s11-more", weighMore),
              api.btn(S.choose, "cb-btn--go cb-btn--big cb-s11-big cb-s11-choose", function (e) { choose(true, e); }, "go", true)])]);
          bar.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.preventDefault(); weighMore(); } });   // Esc closes the question
          return bar;
        }
        info.push(h("ul", { "class": "cb-s11-dots", "aria-hidden": "true" }, order.map(function (pid) { return h("li", { "class": weighed[pid] ? "is-on" : null }, [icon(PATHS[pid].ic)]); })));
        info.push(h("p", { "class": "cb-msg", text: S.weighedN(n) }));
        if (showing) btns.push(api.btn(S.choose, "cb-btn--go cb-btn--big cb-s11-big cb-s11-choose", function (e) { choose(false, e); }, "go", true));
      } else {
        if (fb) info.push(fb.node);
        else if (part === 2 && step === 0 && !steps[0].res && !steps[0].tried.length)
          info.push(h("p", { "class": "cb-s11-chose" }, [disc(PATHS[chosen].ic, "cb-s11-chose__ic"), h("span", { text: S.chose(t2(PATHS[chosen].n)) })]));
        var done = part === 2 ? !!steps[step].res : !!p3.res;
        if (done) btns.push(part === 2 ? api.btn(api.W.next, "cb-btn--go cb-btn--big cb-s11-big cb-s11-next", onNext, "go", true)
          : api.btn(S.finish, "cb-btn--go cb-btn--big cb-s11-big cb-s11-next", aha, "go", true));
        if (!info.length && !btns.length) return null;
      }
      return h("div", { "class": "cb-actions" }, [h("div", { "class": "cb-actions__info" }, info)].concat(btns));
    }

    /* ── the one scene: parts 1 to 3 ── */
    function render(fb, focusSel, view) {
      var linkSvg = sv("svg", { "class": "cb-s11-links", "aria-hidden": "true", focusable: "false" });
      var scene = h("div", { "class": "cb-s11-scene" }, [art(), linkSvg, part === 1 ? signs() : null, balance(), part === 3 ? trayEl() : null, nbrs()]);
      var board = h("div", { "class": "cb-board cb-s11", "data-part": String(part) }, [coachEl(), scene, actions(fb)]);
      if (motion && !REDUCED) { board.classList.add("is-" + motion); if (swing < 0) board.classList.add("is-swing-b"); }
      api.screen([api.stopHud(stop, DOTS, part - 1, api.W.part(part)), board], focusSel || null);
      motion = null;
      requestAnimationFrame(function () { drawLinks(); if (view) view(); });
      if (fb) api.say(fb.spoken);
    }
    /* what each moment keeps in view (wide stage: the question stays on screen; phone: the tapped area) */
    function viewNbrs() { keep(q(".cb-s11-nbrs"), wide() ? q(".cb-coach") : q(".cb-s11-nbrs")); }
    function viewPart(target) { return function () { if (wide()) keep(q(target), q(".cb-coach")); else api.frame(); }; }
    function hangMotion(kind) { motion = kind; swing = -swing; }   // alternate the first lean, so no side looks heavier

    /* a soft line from each card to the neighbor it reaches (wide stage; on a phone the faces on the cards show it) */
    function drawLinks() {
      var svg = document.querySelector(".cb-s11 .cb-s11-links"); if (!svg) return;
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      if (!links.length || getComputedStyle(svg).display === "none") return;
      var box = svg.getBoundingClientRect(), fresh = linksNew && !REDUCED; linksNew = false;
      if (!box.width) return;
      svg.setAttribute("viewBox", "0 0 " + box.width.toFixed(1) + " " + box.height.toFixed(1));
      links.forEach(function (lk, i) {
        var c = document.querySelector('.cb-s11 [data-card="' + lk.key + '"]'), n = document.querySelector('.cb-s11 [data-nbt="' + lk.nb + '"]');
        if (!c || !n) return;
        var a = c.getBoundingClientRect(), b = n.getBoundingClientRect();
        var sx = a.left + a.width / 2 - box.left, sy = a.bottom - box.top, ex = b.left + b.width / 2 - box.left, ey = b.top - box.top;
        var dy = Math.max(24, (ey - sy) * 0.55);
        var d = "M" + sx.toFixed(1) + " " + sy.toFixed(1) + " C" + sx.toFixed(1) + " " + (sy + dy).toFixed(1) + " " + ex.toFixed(1) + " " + (ey - dy).toFixed(1) + " " + ex.toFixed(1) + " " + ey.toFixed(1);
        var g = sv("g", { "class": "cb-s11-link" + (fresh ? " is-new" : "") });
        g.style.setProperty("--i", String(i));
        g.appendChild(sv("path", { d: d, "class": "cb-s11-link__case", pathLength: "1" }));
        g.appendChild(sv("path", { d: d, "class": "cb-s11-link__core", pathLength: "1" }));
        g.appendChild(sv("circle", { cx: sx.toFixed(1), cy: sy.toFixed(1), r: "5", "class": "cb-s11-link__dot" }));
        g.appendChild(sv("circle", { cx: ex.toFixed(1), cy: ey.toFixed(1), r: "5", "class": "cb-s11-link__dot" }));
        svg.appendChild(g);
      });
    }
    var onResize = function () {
      if (myRun !== RUN || !document.querySelector(".cb-s11 .cb-s11-links")) { window.removeEventListener("resize", onResize); return; }
      drawLinks();
    };
    window.addEventListener("resize", onResize);

    /* the intro balance holds a storybook sprout (good parts) and pebble (hard parts): see .cb-story in cb.css */
    var HERO = {
      sprout: '<ellipse class="sh" cx="32" cy="56" rx="14" ry="2.6"/><path class="dt" d="M17 56c1.5-5 7-8 15-8s13.5 3 15 8z"/><path class="tw" d="M32 50V30"/>' +
        '<path class="gr" d="M32 33C32 24 26 18 15 18c0 9.5 6.5 15 17 15z"/><path class="grd" d="M32 38c0-9.5 6.2-16 17-16 0 10-6.5 16-17 16z"/>',
      pebble: '<ellipse class="sh" cx="32" cy="55" rx="20" ry="3"/><path class="stn" d="M12 47c-3.5-7.5.8-17 10.5-20.2 10-3.4 20.6.8 22.6 8.8 2 8-5 15.4-15.2 16.8-8.3 1.2-15.2-1.2-17.9-5.4z"/>' +
        '<path class="n hl" d="M20 33c2-2 4.6-3.2 7.6-3.5-2 1.4-3.6 3.1-4.6 5.2z"/><path class="ln" d="M26 44c3 1 7 1 10-.5"/>'
    };
    /* ── intro ── */
    function intro() {
      part = 0;
      var stage = h("div", { "class": "cb-s11-hero__stage", "aria-hidden": "true" }, [
        h("ul", { "class": "cb-s11-hero__signs" }, ORDER.map(function (id) { return h("li", null, [h("span", { "class": "cb-s11-hero__sign", text: t2(PATHS[id].n) })]); })),
        h("div", { "class": "cb-s11-hero__bal" }, [h("span", { "class": "cb-s11-post" }), h("span", { "class": "cb-s11-base" }),
          h("span", { "class": "cb-s11-beam" }, [h("span", { "class": "cb-s11-pivot" }), h("span", { "class": "cb-s11-bowl", "data-k": "good" }, [h("span", { "class": "cb-s11-bowl__dish" }, [h("span", { "class": "cb-story-obj cb-s11-hero__thing" }, [api.story(HERO.sprout)])])]),
            h("span", { "class": "cb-s11-bowl", "data-k": "hard" }, [h("span", { "class": "cb-s11-bowl__dish" }, [h("span", { "class": "cb-story-obj cb-s11-hero__thing" }, [api.story(HERO.pebble)])])])])])]);
      var hero = api.crop([0.33, 0.30, 0.67], "cb-s11-hero", [stage]);
      hero.setAttribute("aria-hidden", "true");
      var go = api.btn(S.start, "cb-btn--go cb-btn--big cb-s11-big cb-s11-start", function () { if (part !== 0) return; part = 1; render(); hush(); api.frame(); api.say(S.p1); }, "go", true);
      api.screen([api.stopHud(stop, null), h("div", { "class": "cb-board cb-s11" }, [h("div", { "class": "cb-s11-intro" }, [hero, h("div", { "class": "cb-intro cb-s11-intro__text" }, [
        h("p", { "class": "cb-intro__lead", text: S.intro[0] }),
        h("p", { "class": "cb-s11-intro__p", text: S.intro[1] }),
        h("ul", { "class": "cb-s11-kinds" }, ["good", "hard"].map(function (k) { return h("li", { "data-k": k }, [disc(KIND_IC[k], "cb-s11-kinds__ic"), h("span", { text: S.parts[k] })]); })),
        h("p", { "class": "cb-s11-note" }, [disc("scale", "cb-s11-note__ic"), h("span", { text: S.intro[2] })]),
        h("div", { "class": "cb-row" }, [go])])])])]);
      api.frame();
    }

    /* ── part 1 · weigh ── */
    function weigh(id, e) {
      if (part !== 1 || busy(e)) return;
      var fresh = showing !== id, sel = '[data-path="' + id + '"]';
      asking = false; weighed[id] = 1; showing = id;
      if (fresh) hangMotion("hang");
      /* a narrow stage keeps the good-parts cards (the words) in view, not just the little balance */
      render(null, sel, function () { if (wide()) keep(q(".cb-s11-bal"), q(".cb-coach")); else keep(q('.cb-s11-pan[data-k="good"]'), q(sel)); });
      api.say(t2(PATHS[id].n) + ". " + S.weighedN(nWeighedNow()));
    }
    function weighMore(e) {
      if (part !== 1 || busy(e)) return;
      asking = false;
      var next = order.filter(function (id) { return !weighed[id]; })[0];
      render(null, next ? '[data-path="' + next + '"]' : '[data-path="' + showing + '"]');
      hush();
      api.say(S.weighedN(nWeighedNow()));
    }
    function choose(sure, e) {
      if (part !== 1 || !showing || busy(e)) return;
      var n = nWeighedNow();
      if (!sure && n < 4) { asking = true; render(null, ".cb-s11-more"); hush(); api.say(S.ask(n)); return; }
      asking = false; chosen = showing; nWeighed = n; part = 2; step = 0;
      render(null, null, viewPart(".cb-s11-nbrs")); hush();
      api.say(S.chose(t2(PATHS[chosen].n)) + " " + S.q[0]);
    }

    /* ── part 2 · name who ── */
    function mark(ids) {                                       // light the cards that reach these neighbors, with their faces
      var k = step ? "hard" : "good"; links = []; linksNew = true;
      cardsOf(chosen, k).forEach(function (c, j) {
        var key = k.charAt(0) + j;
        ids.forEach(function (id) {
          if (c.who.indexOf(id) < 0) return;
          var s = stickers[key] = stickers[key] || []; if (s.indexOf(id) < 0) s.push(id);
          links.push({ key: key, nb: id });
        });
      });
    }
    function tapNb(id, e) {
      var st = steps[step];
      if (part !== 2 || st.res || st.tried.indexOf(id) >= 0 || busy(e)) return;
      var right = rightNbs(step), name = api.nm(nbOf(id)), f;
      if (right.indexOf(id) >= 0) {
        st.res = st.tried.length ? "second" : "first"; st.pick = id; mark([id]);
        f = fbo(true, [al(S.ok[step](name))]);
      } else {
        st.tried.push(id);
        if (st.tried.length < 2) f = fbo(false, [al(S.wrong[step](name))]);
        else {
          st.res = "shown"; st.pick = null; mark(right);
          f = fbo(false, [S.shown[step], chips(right)], S.shown[step] + " " + right.map(function (r) { return api.nmCap(nbOf(r)); }).join(", ") + ".");
        }
      }
      render(f, st.res ? ".cb-s11-next" : '[data-nb="' + id + '"]', viewNbrs);
    }
    function onNext(e) {
      if (busy(e) || part !== 2 || !steps[step].res) return;
      links = [];
      if (step === 0) { step = 1; render(null, null, viewPart(".cb-s11-nbrs")); hush(); api.say(S.q[1]); return; }
      part = 3; tray = buildTray();
      render(null, null, function () { if (wide()) keep(q('.cb-s11-pan[data-k="hard"]'), q(".cb-coach")); else keep(q(".cb-s11-tray"), q('.cb-s11-pan[data-k="hard"]')); });
      hush(); api.say(S.p3);
    }

    /* ── part 3 · add a change ── */
    function tapChg(fid, e) {
      if (part !== 3 || p3.res || p3.tried.indexOf(fid) >= 0 || busy(e)) return;
      var fits = fitIds(), f;
      p3.seen[fid] = 1;
      if (fits.indexOf(fid) >= 0) {
        p3.res = p3.tried.length ? "second" : "first"; p3.pick = fid; hangMotion("settle");
        var hc = cardsOf(chosen, "hard").filter(function (c) { return c.fix === fid; })[0];
        f = fbo(true, [S.okChg, miniCard(hc, "hard"), miniChange(fid)], S.okChg + " " + t2(hc.t) + " " + t2(FIX[fid].line));
      } else {
        p3.tried.push(fid);
        if (p3.tried.length < 2) {
          var oh = otherHard(fid);
          f = fbo(false, [S.idea[0], miniCard(oh, "hard"), S.idea[1]], S.idea[0] + " " + t2(oh.t) + " " + S.idea[1]);
        } else {
          p3.res = "shown"; p3.pick = fits[0]; p3.seen[fits[0]] = 1; hangMotion("settle");
          f = fbo(false, [S.fits, nameChange(fits[0]), miniChange(fits[0])], S.fits + " " + t2(FIX[fits[0]].n) + ". " + t2(FIX[fits[0]].line));
        }
      }
      var sel = '[data-chg="' + fid + '"]';
      render(f, p3.res ? ".cb-s11-next" : sel, function () {
        if (p3.res) keep(q(".cb-s11-hung"), wide() ? q(".cb-s11-head") : q(".cb-s11-hung"));
        else if (wide()) keep(q('.cb-s11-pan[data-k="hard"]'), q(".cb-coach"));
        else keep(q(sel), q(".cb-s11-tray"));
      });
    }

    /* ── the aha card: four paths, four level balances ── */
    function aha(e) {
      if (part !== 3 || !p3.res || busy(e)) return;
      part = 4; links = []; hush();
      var tiles = h("ul", { "class": "cb-s11-aha__paths" }, order.map(function (pid, i) {
        var li = h("li", null, [h("div", { "class": "cb-s11-aha__bal", "aria-hidden": "true" }, [disc(PATHS[pid].ic, "cb-s11-aha__ic"), h("span", { "class": "cb-s11-post" }), h("span", { "class": "cb-s11-base" }),
          h("span", { "class": "cb-s11-beam" }, [h("span", { "class": "cb-s11-pivot" }), h("span", { "class": "cb-s11-bowl", "data-k": "good" }, [h("span", { "class": "cb-s11-bowl__dish" })]),
            h("span", { "class": "cb-s11-bowl", "data-k": "hard" }, [h("span", { "class": "cb-s11-bowl__dish" })])])]),
          h("b", { "class": "cb-s11-aha__n", text: t2(PATHS[pid].n) })]);
        li.style.setProperty("--i", String(i));
        return li;
      }));
      var see = api.btn(S.see, "cb-btn--go cb-btn--big cb-s11-big cb-s11-see", finish, "go", true);
      var board = h("div", { "class": "cb-board cb-s11 cb-s11--aha" + (REDUCED ? "" : " is-aha") }, [
        h("div", { "class": "cb-s11-scene cb-s11-aha" }, [art([0.33, 0.30, 0.71]), tiles]),
        h("div", { "class": "cb-s11-aha__foot" }, [h("p", { "class": "cb-s11-aha__line" }, [disc("scale", "cb-s11-aha__lic"), h("span", { text: S.aha })]), see])]);
      api.screen([api.stopHud(stop, DOTS, 3), board], ".cb-s11-see");
      api.frame();
      api.say(S.aha);
    }

    /* ── score: 40 + 20 + 20 + 20. Every path can earn 100. The chosen path never changes the score. ── */
    function finish(e) {
      if (part !== 4 || busy(e)) return;
      part = 5;
      var score = 10 * nWeighed + PTS[steps[0].res] + PTS[steps[1].res] + PTS[p3.res];
      var tip = nWeighed < 4 ? S.tipWeigh : steps[0].res !== "first" ? S.tipGood : steps[1].res !== "first" ? S.tipHard : p3.res !== "first" ? S.tipChange : S.tip100;
      var info = api.saveRound(stop.id, score, { lastRound: dealKey(), lastOrder: order.slice() });
      api.endPlay();
      var ask = h("div", { "class": "cb-tipcard cb-s11-ask" }, [api.ico("family"), h("div", null, [h("strong", { text: S.askT }), h("p", { text: S.askQ })])]);
      var gu = api.btn(S.gu, "cb-btn--quiet cb-s11-gu", function () { api.dialog(S.gu, [h("p", { text: S.guText })], gu); }, "family");
      var sc = api.scoreCard(stop, score, info, tip, S.can, S.real, ask);
      var again = api.restart(stop.id);
      api.finishRound(stop.id, sc, api.cardButtons(stop.id, function (e) { if (!busy(e)) again(); }, gu));
      hush();
      api.say(api.W.score + " " + score + " / 100");
    }

    intro();
  }
})();
