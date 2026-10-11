/* Community Builders of Pecan Grove · Stop 14 · Keep Watch / Vigila las promesas
   Skill: check kindly whether promises were kept, and follow up on the ones that are late or unclear.
   One scene, the town one year later (a painted crop of the town map), on one of two fair paths:
   "built" (yes, with changes) or "studying" (not now). Step 1: for each of 5 promises, tap its clue
   in town or "No clue found", then mark it Kept / Not yet / Need to ask. Step 2: a kind follow-up
   for every late or unclear promise, then close the notebook.
   Score (score card only): +8 per first clue tap right (40) + 8 per first status tap right (40)
   + 20 when every Not yet / Need to ask promise has a follow-up at closing. No time bonus.
   Every round: 1 promise with no clue, 1 unclear, 3 kept or late (at least one of each); paths alternate. */
(function () {
  "use strict";
  var CB = window.CommunityBuilders; if (!CB) return;
  var LANG = (document.documentElement.lang || "en").slice(0, 2) === "es" ? "es" : "en";
  var I = LANG === "es" ? 1 : 0;

  /* ── words, exact from the spec (14 - keep-watch.md, pastes 14B to 14H) ── */
  var T = {
    en: {
      pageTitle: "Keep Watch - Community Builders of Pecan Grove",
      introBuilt: "It's spring, one year later. The town said yes to the data center, with changes.",
      introStudying: "It's spring, one year later. The town said not now. It's still studying and writing rules.",
      fair: "Saying yes with changes and saying not now, to study more, are both fair choices. Either way, people made promises. Let's check them, kindly.",
      start: "Start",
      step: function (n) { return "Step " + n + " of 2"; },
      noClue: "No clue found", notebook: "Promise notebook", siteTag: "Data center",
      clueAria: function (l) { return "Clue: " + l; },
      notChecked: "Not checked yet",
      promiseN: function (n) { return "Promise " + n + " of 5"; },
      s1: "Read the promise. Tap its clue in town, or tap 'No clue found'.",
      see: "What you see:",
      rightNone: "Right. There's no clue for this one in town.",
      other: "That clue goes with another promise.", hereIs: "Here is this one's clue.", noneHere: "There's no clue for this one in town.",
      lookClue: "Look again: there is a clue for this one. Here it is.",
      how: "How is this promise doing?",
      st: { kept: "Kept", notyet: "Not yet", ask: "Need to ask" },
      stAria: function (l) { return l + ", status"; },
      ok: { kept: "Yes! This promise was kept.", notyet: "Yes. It's started, but it's not done yet.", ask: "Yes. We can't tell yet, so we'll ask." },
      wrong: { kept: "Look again: the clue shows it's done. This promise was kept.",
        notyet: "Look again: it's started, but not done yet. It's late, not broken.",
        ask: "Look again: we can't tell from this. No clue doesn't mean a broken promise. We just need to ask." },
      nextPromise: "Next promise", followUp: "Follow up",
      s2: "Pick a kind follow-up for each late or unclear promise. It goes in your notebook, to ask with a grown-up.",
      fu: { thanks: "Say thank you", why: "Ask why", when: "Ask when" },
      fuLine: {
        notyet: { thanks: "Thank you for starting. We'll check again soon.", why: "What's making it take longer?", when: "When do you think it will be done?" },
        ask: { thanks: "Thank you for this promise. Where can we see how it's going?", why: "Why is it hard to tell if it's done?", when: "When can we see how it's going?" }
      },
      reply: "Thanks for asking kindly. You'll get an answer at the next town meeting.",
      fuN: function (n, t) { return "Follow-ups: " + n + " of " + t; },
      closeNb: "Close the notebook",
      still: function (n) { return n === 1 ? "1 promise still needs a follow-up." : n + " promises still need a follow-up."; },
      goBack: "Go back", closeAnyway: "Close anyway",
      closing: "Some promises are kept, some are late, and some just need a question. Checking kindly works better than blaming.",
      seeScore: "See my score",
      can: "I can check, kindly, if promises were kept.",
      tipFollow: "Next time, give every late or unclear promise a kind follow-up.",
      tipAsk: "Next time, remember: no clue doesn't mean a broken promise. Ask first.",
      tipStatus: "Next time, read each clue slowly. Is it done, started or not clear?",
      tipClue: "Next time, look all over town for each promise's clue.",
      tip100: "Great watching! Try a new round. The town may take the other path.",
      real: "With a grown-up, keep a 'listen and look' notebook at home. Write down changes in sounds, lights or water you notice. Never go near a building site.",
      askH: "Ask a grown-up", ask: "What promise in our town would you like to check on, and who could we ask?",
      gu: "For grown-ups: about this stop",
      guText: "Promises come from the town, the builders and the neighbors. Kids match each promise to a clue a year later and choose a kind follow-up. Real checking is an adult job: ask for yearly reports and meeting minutes, and find out who enforces each promise. Each round, the town has taken one of two fair paths: building with changes, or not building while it studies."
    },
    es: {
      pageTitle: "Vigila las promesas - Constructores de comunidad de Pecan Grove",
      introBuilt: "Es primavera, un año después. El pueblo dijo que sí al centro de datos, con cambios.",
      introStudying: "Es primavera, un año después. El pueblo dijo que por ahora no. Todavía está estudiando y escribiendo reglas.",
      fair: "Decir que sí con cambios y decir que por ahora no, para estudiar más, son decisiones justas. De cualquier forma, la gente hizo promesas. Vamos a revisarlas, con respeto.",
      start: "Empezar",
      step: function (n) { return "Paso " + n + " de 2"; },
      noClue: "No encontré pista", notebook: "Cuaderno de promesas", siteTag: "Centro de datos",
      clueAria: function (l) { return "Pista: " + l; },
      notChecked: "Sin revisar",
      promiseN: function (n) { return "Promesa " + n + " de 5"; },
      s1: "Lee la promesa. Toca su pista en el pueblo, o toca 'No encontré pista'.",
      see: "Lo que ves:",
      rightNone: "Así es. De esta no hay ninguna pista en el pueblo.",
      other: "Esa pista es de otra promesa.", hereIs: "Aquí está la pista de esta.", noneHere: "De esta no hay ninguna pista en el pueblo.",
      lookClue: "Mira otra vez: sí hay una pista para esta. Aquí está.",
      how: "¿Cómo va esta promesa?",
      st: { kept: "Cumplida", notyet: "Todavía no", ask: "Hay que preguntar" },
      stAria: function (l) { return l + ", estado"; },
      ok: { kept: "¡Sí! Esta promesa se cumplió.", notyet: "Sí. Ya empezó, pero todavía no termina.", ask: "Sí. Todavía no se sabe, así que vamos a preguntar." },
      wrong: { kept: "Mira otra vez: la pista muestra que ya está hecho. Esta promesa se cumplió.",
        notyet: "Mira otra vez: ya empezó, pero todavía no termina. Va atrasada, pero no se rompió.",
        ask: "Mira otra vez: con esto no se puede saber. Que no haya pista no quiere decir que se rompió la promesa. Solo hay que preguntar." },
      nextPromise: "Siguiente promesa", followUp: "Hacer seguimiento",
      s2: "Elige un seguimiento amable para cada promesa atrasada o que no está clara. Se anota en tu cuaderno, para preguntarlo con un adulto.",
      fu: { thanks: "Dar las gracias", why: "Preguntar por qué", when: "Preguntar cuándo" },
      fuLine: {
        notyet: { thanks: "Gracias por empezar. Volveremos a revisar pronto.", why: "¿Qué lo está atrasando?", when: "¿Cuándo crees que estará terminado?" },
        ask: { thanks: "Gracias por esta promesa. ¿Dónde podemos ver cómo va?", why: "¿Por qué cuesta saber si ya está hecho?", when: "¿Cuándo podremos ver cómo va?" }
      },
      reply: "Gracias por preguntar con respeto. Tendrás una respuesta en la próxima reunión del pueblo.",
      fuN: function (n, t) { return "Seguimientos: " + n + " de " + t; },
      closeNb: "Cerrar el cuaderno",
      still: function (n) { return n === 1 ? "Todavía falta el seguimiento de 1 promesa." : "Todavía faltan seguimientos para " + n + " promesas."; },
      goBack: "Regresar", closeAnyway: "Cerrar de todos modos",
      closing: "Algunas promesas se cumplen, otras van atrasadas y otras solo necesitan una pregunta. Revisar con respeto funciona mejor que culpar.",
      seeScore: "Ver mi puntaje",
      can: "Puedo revisar, con respeto, si se cumplieron las promesas.",
      tipFollow: "La próxima vez, haz un seguimiento amable para cada promesa atrasada o que no está clara.",
      tipAsk: "La próxima vez, recuerda: si no hay pista, no quiere decir que se rompió la promesa. Primero pregunta.",
      tipStatus: "La próxima vez, lee despacio cada pista. ¿Ya está hecho, apenas empezó o no está claro?",
      tipClue: "La próxima vez, busca por todo el pueblo la pista de cada promesa.",
      tip100: "¡Muy buena vigilancia! Prueba una nueva ronda. El pueblo puede tomar el otro camino.",
      real: "Con un adulto, lleva en casa un cuaderno de 'escucha y observa'. Anota los cambios de ruido, luces o agua que notes. Nunca te acerques a una obra.",
      askH: "Pregúntale a un adulto", ask: "¿Qué promesa de nuestro pueblo te gustaría revisar, y a quién le podríamos preguntar?",
      gu: "Para adultos: sobre esta parada",
      guText: "Las promesas vienen del pueblo, de los constructores y de los vecinos. Los niños comparan cada promesa con una pista un año después y eligen un seguimiento amable. La revisión real es trabajo de adultos: pidan informes anuales y actas de las reuniones, y pregunten quién hace cumplir cada promesa. En cada ronda, el pueblo tomó uno de dos caminos justos: construir con cambios, o no construir mientras estudia."
    }
  }[LANG];

  /* ── who promised: the builders (hard hat), the Town Council (small Town Hall), or a neighbor (portrait) ── */
  var MAKERS = {
    builders: { label: ["From the builders", "De los constructores"], icon: "hardhat" },
    council: { label: ["From the Town Council", "Del Concejo del pueblo"], icon: "townhall" },
    ana: { label: ["From Ana", "De Ana"], nb: "ana" },
    jayden: { label: ["From Jayden", "De Jayden"], nb: "jayden" },
    patel: { label: ["From Mr. Patel", "Del Sr. Patel"], nb: "patel" }
  };
  /* the seven clues: separate icons on real buttons, so they can move and one can be missing */
  var CLUES = {
    lights: ["Lights", "Luces"], letter: ["Well-test letter", "Carta de las pruebas de agua"], truck: ["Truck sign", "Letrero de camiones"],
    school: ["School class", "Clase en la escuela"], poster: ["Meeting poster", "Cartel de la reunión"],
    stakes: ["Study stakes", "Estacas de estudio"], hall: ["Town Hall meeting", "Reunión en el ayuntamiento"]
  };
  /* codes K1..S5 and the keys kept / notyet / unclear are for code only; they never show */
  var K1_NOT = ["The letter says the wells were tested. The creek tests start next month.", "La carta dice que revisaron los pozos. Las pruebas del arroyo empiezan el próximo mes."];
  var K1_UNC = ["The van drives by sometimes, but no letter has come. We can't tell.", "La camioneta pasa a veces, pero no ha llegado ninguna carta. No se sabe."];
  var PROMISES = {
    built: [
      { code: "K1", maker: "builders", clue: "letter", words: ["We'll test the wells and the creek every month.", "Vamos a revisar los pozos y el arroyo cada mes."],
        kept: ["A letter came to every farm. The wells and the creek were tested every month.", "Llegó una carta a cada granja. Revisaron los pozos y el arroyo cada mes."], notyet: K1_NOT, unclear: K1_UNC },
      { code: "K2", maker: "builders", clue: "lights", words: ["We'll point every outside light down.", "Vamos a apuntar todas las luces de afuera hacia abajo."],
        kept: ["Every outside light points down. You can see the stars over the farm.", "Todas las luces de afuera apuntan hacia abajo. Se ven las estrellas sobre la granja."],
        notyet: ["Half the lights point down. A box of new lamps waits by the fence.", "La mitad de las luces apuntan hacia abajo. Una caja de lámparas nuevas espera junto a la cerca."],
        unclear: ["The lights point down, but some stay on all night. Was that part of the promise?", "Las luces apuntan hacia abajo, pero algunas quedan prendidas toda la noche. ¿Eso era parte de la promesa?"] },
      { code: "K3", maker: "builders", clue: "truck", words: ["We'll keep big trucks off Main Street.", "Vamos a mantener los camiones grandes fuera de la calle principal."],
        kept: ["The truck sign points to the farm road. Main Street is calm.", "El letrero de camiones señala el camino de la granja. La calle principal está tranquila."],
        notyet: ["The farm road isn't finished. Some trucks still use Main Street.", "El camino de la granja no está terminado. Algunos camiones todavía pasan por la calle principal."],
        unclear: ["The sign shows a clock and a truck. Which hours does it mean?", "El letrero muestra un reloj y un camión. ¿Qué horario quiere decir?"] },
      { code: "K4", maker: "ana", clue: "school", words: ["I'll teach a class for young electricians at the school.", "Voy a dar una clase para jóvenes electricistas en la escuela."],
        kept: ["Ana's class meets every Tuesday. Jayden is in it!", "La clase de Ana es cada martes. ¡Jayden está en ella!"],
        notyet: ["The classroom is ready, but the class starts in the fall.", "El salón está listo, pero la clase empieza en el otoño."],
        unclear: ["There's a class at the school. Is it Ana's class?", "Hay una clase en la escuela. ¿Es la clase de Ana?"] },
      { code: "K5", maker: "council", clue: "poster", words: ["We'll hold a meeting every spring to share the yearly report.", "Vamos a hacer una reunión cada primavera para compartir el informe del año."],
        kept: ["The poster in the bakery window shows the date of the spring meeting.", "El cartel en la ventana de la panadería muestra la fecha de la reunión de primavera."],
        notyet: ["The poster is up, but the meeting has no date yet.", "El cartel ya está, pero la reunión todavía no tiene fecha."],
        unclear: ["The poster shows a meeting. Will they share the report there?", "El cartel anuncia una reunión. ¿Van a compartir ahí el informe?"] }
    ],
    studying: [
      { code: "S1", maker: "council", clue: "letter", words: ["We'll test the wells and the creek before we decide.", "Vamos a revisar los pozos y el arroyo antes de decidir."],
        kept: ["A letter with the test results came to every farm.", "Llegó a cada granja una carta con los resultados."], notyet: K1_NOT, unclear: K1_UNC },
      { code: "S2", maker: "builders", clue: "stakes", words: ["We'll pay for every study the town asks for.", "Vamos a pagar cada estudio que pida el pueblo."],
        kept: ["Study teams are measuring the field. The builders paid for every study.", "Los equipos de estudio miden el campo. Los constructores pagaron cada estudio."],
        notyet: ["One study has started. The others start in the summer.", "Ya empezó un estudio. Los demás empiezan en el verano."],
        unclear: ["Little flags stand in the field, but no one is there. Is the study still going?", "Hay banderitas en el campo, pero no hay nadie. ¿Sigue el estudio?"] },
      { code: "S3", maker: "council", clue: "hall", words: ["We'll write the new rules in open meetings.", "Vamos a escribir las reglas nuevas en reuniones abiertas."],
        kept: ["Neighbors fill Town Hall. Anyone can come and speak.", "Los vecinos llenan el ayuntamiento. Cualquiera puede venir y hablar."],
        notyet: ["The meetings were planned for winter. The first one is next month.", "Las reuniones eran para el invierno. La primera es el próximo mes."],
        unclear: ["Town Hall's lights are on. Is the meeting open to everyone?", "Las luces del ayuntamiento están prendidas. ¿La reunión está abierta a todos?"] },
      { code: "S4", maker: "jayden", clue: "school", words: ["I'll start a tech club at the school.", "Voy a empezar un club de tecnología en la escuela."],
        kept: ["Jayden's tech club meets every Friday after school.", "El club de tecnología de Jayden se reúne cada viernes después de clases."],
        notyet: ["Jayden found a room, but the club starts after the summer.", "Jayden ya consiguió un salón, pero el club empieza después del verano."],
        unclear: ["Some kids meet after school. Is it Jayden's club?", "Unos niños se reúnen después de clases. ¿Es el club de Jayden?"] },
      { code: "S5", maker: "patel", clue: "poster", words: ["I'll put a poster for every town meeting in my bakery window.", "Voy a poner en la ventana de mi panadería un cartel de cada reunión del pueblo."],
        kept: ["The bakery window shows a poster for the next meeting.", "En la ventana de la panadería hay un cartel de la próxima reunión."],
        notyet: ["Mr. Patel made the poster, but it's not in the window yet.", "El Sr. Patel ya hizo el cartel, pero todavía no está en la ventana."],
        unclear: ["The bakery poster is from last month. Is a new one coming?", "El cartel de la panadería es del mes pasado. ¿Viene uno nuevo?"] }
    ]
  };

  /* ── the scene: one painted crop of the town map per path (fields, Town Hall, Main Street, the creek) ── */
  var CROP = { built: [0.30, 0.14, 0.98, 0.82], studying: [0.12, 0.12, 0.80, 0.80] };
  var SITE = [64, 12];                                          // "built": the low, plain building on the old farm land
  var SPOTS = [[15, 30], [44, 24], [84, 32], [18, 74], [50, 70], [82, 76]];   // 6 spots; a round uses 4, never on a face
  var FU = ["thanks", "why", "when"], FU_ICON = { thanks: "heart", why: "chat", when: "calendar" };
  /* ── Stop 14 storybook things (see .cb-story in cb.css): each clue is drawn as the thing itself and stands at the painted
     place it names, so "the poster in the bakery window" really is at the bakery ── */
  var ART = {
    lights: '<ellipse class="sh" cx="32" cy="59" rx="12" ry="2.4"/><path class="n yl" d="M41.5 15h9.5l5 18H36.5z" opacity="0.5"/><path class="mtd" d="M26 58.5h12l-2.2-4.5h-7.6z"/>' +
      '<rect class="mtd" x="30" y="16" width="4" height="38.5" rx="1"/><path class="mtd" d="M30 18c0-7 4.6-10.5 11-10.5h4v4h-4c-4 0-7 2.4-7 6.5z"/><path class="ink" d="M39.5 10h13l-2.2 5.5h-8.6z"/>',
    letter: '<ellipse class="sh" cx="32" cy="57" rx="24" ry="2.6"/><path class="pp" d="M6 18h52v34H6z"/><path d="M6 18l26 19.5L58 18"/><path class="ln" d="M6.5 51.5l19-16.5M57.5 51.5l-19-16.5"/>' +
      '<path class="bl" d="M48 21.5s-5.5 6.4-5.5 9.6a5.5 5.5 0 0 0 11 0c0-3.2-5.5-9.6-5.5-9.6z"/>',
    truck: '<ellipse class="sh" cx="32" cy="59" rx="12" ry="2.4"/><rect class="mt" x="30" y="33" width="4" height="26" rx="1"/><rect class="yl" x="8" y="6" width="48" height="29" rx="3"/>' +
      '<path class="n ink" d="M14 25.5v-9h15v9zM29 18.5h6.5l3.5 3.5v3.5h-10z"/><circle class="n ink" cx="17.6" cy="27.5" r="2.5"/><circle class="n ink" cx="33.5" cy="27.5" r="2.5"/><path class="hd" d="M42 21h9M47 17l4 4-4 4"/>',
    school: '<ellipse class="sh" cx="32" cy="59" rx="20" ry="2.4"/><path class="leg" d="M19 34l-6 24M45 34l6 24M32 34v24"/><rect class="wd" x="7" y="5" width="50" height="33" rx="2"/>' +
      '<rect class="n grd" x="10.5" y="8.5" width="43" height="26" rx="1"/><path class="n yl" d="M31 12l-6.5 11h5.5l-2 8.5 9.5-12.5h-5.5l3.2-7z"/><path class="chk" d="M14.5 30h9M40 15h9M40 20.5h7"/>',
    poster: '<ellipse class="sh" cx="32" cy="58.5" rx="26" ry="2.4"/><rect class="wd" x="5" y="5" width="54" height="51" rx="2"/><rect class="n bl" x="9" y="9" width="46" height="43"/>' +
      '<path class="n hl" d="M11 11h11L11 27z"/><path class="pp" d="M20 15h24v32H20z"/><rect class="n gr" x="23" y="18.5" width="18" height="9"/><path class="ln" d="M23 32h18M23 36h18M23 40h11"/><rect class="n rd" x="37" y="39" width="4.5" height="4.5"/>',
    stakes: '<ellipse class="sh" cx="32" cy="58.5" rx="26" ry="2.6"/><path class="n grd" d="M6 58.5c1-4.5 3-7.5 6-8.5-1 3-1 6-.5 8.5zM56 58.5c1-4 3-6.5 5.5-7.5-1 2.6-1 5-.5 7.5z"/>' +
      '<path class="wd" d="M13 58.5V22l3.5-4.5L20 22v36.5z"/><path class="wd" d="M29.5 58.5V15l3.5-4.5 3.5 4.5v43.5z"/><path class="wd" d="M46 58.5V26l3.5-4.5L53 26v32.5z"/>' +
      '<path class="or" d="M13 27h7v3.5h-7zM20 27.5l6 2.2-6 1.6zM29.5 20h7v3.5h-7zM36.5 20.5l6 2.2-6 1.6zM46 31h7v3.5h-7zM53 31.5l5.5 2-5.5 1.6z"/>',
    hall: '<ellipse class="sh" cx="32" cy="58.5" rx="28" ry="2.4"/><path class="wal" d="M8 26h48v30H8z"/><path class="rd" d="M3.5 27.5L32 10l28.5 17.5z"/><rect class="n stn" x="8.8" y="51.5" width="46.4" height="4"/>' +
      '<rect class="wh" x="13.5" y="30" width="5" height="21.5"/><rect class="wh" x="24.5" y="30" width="5" height="21.5"/><rect class="wh" x="34.5" y="30" width="5" height="21.5"/><rect class="wh" x="45.5" y="30" width="5" height="21.5"/>' +
      '<path class="tw" d="M32 10V2.5"/><path class="bl" d="M32 2.5h8.5v5.5H32z"/>',
    site: '<ellipse class="sh" cx="32" cy="57" rx="29" ry="2.6"/><rect class="mt" x="4" y="27" width="56" height="27" rx="2"/><rect class="n mtd" x="4.8" y="46" width="54.4" height="7.2"/>' +
      '<path class="ln" d="M14 31v12M24 31v12M40 31v12M50 31v12"/><rect class="wh" x="26.5" y="41" width="11" height="13"/><path class="n gr" d="M2 57c2-3 5-4.5 8-4.5s5 1.5 6 4.5zM50 57c1.5-3 4-4.5 7-4.5s4.5 1.5 5 4.5z"/>',
    pad: '<ellipse class="sh" cx="32" cy="58.5" rx="20" ry="2.4"/><rect class="bl" x="12" y="5" width="41" height="51" rx="3"/><path class="ln" d="M12 14H8.5M12 24H8.5M12 34H8.5M12 44H8.5"/>' +
      '<path class="pp" d="M20 15h25v11H20z"/><path class="ln" d="M24 19h17M24 22.5h11"/><path class="hd" d="M24.5 38.5l5.5 5.5 11.5-11.5"/>'
  };
  /* where each clue stands, in % of the path's picture: on the painted place it names (Main Street bakery, the clock-tower school,
     the farm road, the farm field, the farmhouses), never on a face */
  var CLUE_AT = {
    built: { school: [28, 40], poster: [50, 47], truck: [69, 63], lights: [80, 17], letter: [87, 74] },
    studying: { letter: [14, 70], hall: [14, 33], stakes: [50, 15], school: [57, 47], poster: [80, 52] }
  };

  /* ── line icons, authored on the shell's 24-unit grid with one 2px round stroke (constant markup) ── */
  var ICON = {
    lights: '<path d="M6.5 21V8a4 4 0 0 1 4-4H13"/><path d="M13 4v1.6"/><path d="M11 9.5h4.2l-1-3.9h-2.2z"/><path d="M13.1 12.4v2.4M10.4 12.6l-1.1 2M15.8 12.6l1.1 2"/><path d="M4 21h5"/>',
    letter: '<path d="M2.5 16.8V8.6c0-.9.7-1.6 1.6-1.6h11.6l4.8 5v4.8"/><path d="M2.5 16.8h1.6M9 16.8h5.6M19.4 16.8h1.1"/><circle cx="6.6" cy="17.2" r="2.1"/><circle cx="17" cy="17.2" r="2.1"/><rect x="4.9" y="9.3" width="5.6" height="4.2" rx=".6"/><path d="m5.1 9.6 2.6 1.9 2.6-1.9"/><path d="M14 8.9c1.1 1.4 1.7 2.3 1.7 3.1a1.7 1.7 0 0 1-3.4 0c0-.8.6-1.7 1.7-3.1z"/>',
    truck: '<circle cx="10.6" cy="10.4" r="7.6"/><path d="M10.6 18v4M8 22h5.2"/><path d="M6.4 12.6V8.4h5v4.2M11.4 10h1.8l1.6 1.7v.9"/><path d="M6.4 12.6h8.4"/><circle class="cb-s14-knock" cx="18.4" cy="5" r="3.9"/><path d="M18.4 3.4v1.8l1.2.9"/>',
    school: '<circle cx="4.4" cy="4.6" r="1.9"/><path d="M4.4 7.2v7.6M4.4 14.8l-1.6 5.4M4.4 14.8l1.6 5.4M4.4 10l3.6-2.2"/><path d="M9 13.8h13.5"/><path d="M11 13.8v6.6"/><circle cx="11.6" cy="9.6" r="1.5"/><circle cx="15.7" cy="9.6" r="1.5"/><circle cx="19.8" cy="9.6" r="1.5"/><path d="M18.4 13.8v2.6h3"/><circle cx="19.6" cy="19.2" r="2.3"/>',
    poster: '<path d="M2.5 21h19M3.5 21V3M20.5 21V3"/><rect x="6.5" y="3.5" width="11" height="14.5" rx="1.4"/><path d="M9 6.5h6v3.6H9z"/><circle cx="10" cy="13.1" r="1"/><circle cx="14" cy="13.1" r="1"/><path d="M9 16a1.5 1.5 0 0 1 2.8 0M12.2 16a1.5 1.5 0 0 1 2.8 0"/>',
    stakes: '<path d="M6.5 19.5V5.5"/><path d="M6.5 5.5h6l-1.6 2.2 1.6 2.3h-6"/><path d="M16 19.5v-8"/><path d="M16 11.5h4.4l-1.2 1.6 1.2 1.6H16"/><path d="M2.5 20.5c1.2-.9 2.3-.9 3.5 0s2.3.9 3.5 0 2.3-.9 3.5 0 2.3.9 3.5 0 2.3-.9 3.5 0"/>',
    hall: '<path d="M3 9.5 12 4l9 5.5"/><path d="M4.5 9.5v11h15v-11"/><path d="M6.8 17.4h10.4"/><path d="M8 17.4v3.1M16 17.4v3.1"/><circle cx="8.4" cy="13.8" r="1.4"/><circle cx="12" cy="13.8" r="1.4"/><circle cx="15.6" cy="13.8" r="1.4"/>',
    closed: '<rect x="5" y="3" width="14.5" height="18" rx="2.2"/><path d="M3.5 7.5h3M3.5 12h3M3.5 16.5h3"/><path d="m9.6 12.2 2.2 2.2 4.4-4.8"/>',
    notebook: '<path d="M12 6.6C10 5 7 4.6 3.5 5v13.4c3.5-.4 6.5 0 8.5 1.6 2-1.6 5-2 8.5-1.6V5c-3.5-.4-6.5 0-8.5 1.6z"/><path d="M12 6.6V20"/><path d="M6 9h3.5M6 12h3.5"/><path d="m14.4 15.4 4.4-4.4 1.6 1.6-4.4 4.4-2 .4z"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    ask: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.7a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1.1.9-1.1 1.6v.5"/><path d="M12 16.9v.1"/>',
    hardhat: '<path d="M5.5 16.5V15a6.5 6.5 0 0 1 13 0v1.5"/><path d="M10 8.7v4M14 8.7v4"/><rect x="3" y="16.5" width="18" height="3" rx="1.5"/>',
    townhall: '<path d="M3.5 9.2 12 4.2l8.5 5"/><path d="M4.5 9.5h15"/><path d="M6.5 12v6M10 12v6M14 12v6M17.5 12v6"/><path d="M3.5 20.5h17"/>',
    heart: '<path d="M12 19.6S4.4 15.2 4.4 9.7A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7.6 1.7c0 5.5-7.6 9.9-7.6 9.9z"/>',
    chat: '<path d="M5 5.5h14A1.5 1.5 0 0 1 20.5 7v8.5A1.5 1.5 0 0 1 19 17h-7.5L7 20.5V17H5a1.5 1.5 0 0 1-1.5-1.5V7A1.5 1.5 0 0 1 5 5.5z"/>',
    calendar: '<rect x="4" y="5.5" width="16" height="14.5" rx="2"/><path d="M4 10h16"/><path d="M8.5 3.5v4M15.5 3.5v4"/><path d="M8.5 14h.01M12 14h.01M15.5 14h.01M8.5 17h.01M12 17h.01"/>',
    site: '<path d="M1.8 20.5h20.4"/><path d="M4 20.5V7.5h12.5v13"/><path d="M3 7.5h14.5"/><path d="M6.6 10.8h1.6M9.5 10.8h1.6M12.4 10.8h1.6M6.6 14h1.6M12.4 14h1.6"/><path d="M9.3 20.5v-3.8h2v3.8"/><path d="M20 20.5v-3.4"/><circle cx="20" cy="14.6" r="2.1"/>'
  };
  var SVGNS = "http://www.w3.org/2000/svg";
  function icon(name, cls) {
    var s = document.createElementNS(SVGNS, "svg");
    s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true"); s.setAttribute("focusable", "false");
    s.setAttribute("class", "cb-ico" + (cls ? " " + cls : ""));
    s.innerHTML = ICON[name];                                   // constant, authored markup only
    return s;
  }

  CB.register({
    id: "keep-watch",
    steps: [null, null],
    css: "14-keep-watch.css",
    run: function (api, stop) {
      var h = api.h, say = api.say, STEPS = [null, null];
      document.title = T.pageTitle;

      /* ── the round: path, shuffled notebook, exactly 1 no-clue + 1 unclear + 3 kept / late (both present) ── */
      var rec = api.rec(stop.id) || {}, tm = api.team(), path;
      if (tm && tm.phase === "B" && tm.kwPath) path = tm.kwPath === "built" ? "studying" : "built";   // Team 2 gets the other path
      else if (rec.lastPath) path = rec.lastPath === "built" ? "studying" : "built";                   // then they alternate
      else path = Math.random() < 0.5 ? "built" : "studying";                                          // the first round is random
      if (tm && tm.phase === "A") tm.kwPath = path;
      var list = PROMISES[path], lastNo = (rec.noClue || {})[path];
      var noClue = api.pick(list.filter(function (p) { return p.code !== lastNo; }));   // never the same as last time on this path
      var rest = api.shuffle(list.filter(function (p) { return p !== noClue; }));
      var mixed = api.shuffle(["kept", "notyet", Math.random() < 0.5 ? "kept" : "notyet"]);
      var state = {}; state[noClue.code] = "none"; state[rest[0].code] = "unclear";
      rest.slice(1).forEach(function (p, i) { state[p.code] = mixed[i]; });
      var items = api.shuffle(list).map(function (p) {
        var s = state[p.code];
        return { p: p, state: s, truth: s === "kept" ? "kept" : s === "notyet" ? "notyet" : "ask", line: s === "none" ? null : api.t2(p[s]),
          clueTap: null, clueOK: false, st: null, stOK: false, fu: null };
      });
      var spots = api.shuffle([0, 1, 2, 3, 4, 5]), sp = 0;
      items.forEach(function (it) { if (it.state !== "none") it.spot = spots[sp++]; });
      var need = items.filter(function (it) { return it.truth !== "kept"; });
      var ci = 0;

      /* a fast double tap would land its second tap on the next screen's controls (a clue, "Close the notebook",
         "Play again"): pointer taps in the first moment after a screen change are ignored; keys are never held back */
      var calm = 0;
      function hush() { calm = Date.now() + 340; }
      function G(fn) { return function (e) { if (e && e.detail > 0 && Date.now() < calm) return; fn(e); }; }

      /* ── small builders ── */
      function hud(i) { return api.stopHud(stop, STEPS, i, T.step(Math.min(i, 1) + 1)); }
      function maker(it) { return api.t2(MAKERS[it.p.maker].label); }
      function who(it, cls) {
        var M = MAKERS[it.p.maker], n = M.nb ? api.nbById(M.nb) : null;
        return h("span", { "class": "cb-s14-who" + (n ? "" : " cb-s14-who--ic") + (cls ? " " + cls : ""), "aria-hidden": "true" }, [n ? api.img(n.img, "", null, true) : icon(M.icon)]);
      }
      function tick() { return h("span", { "class": "cb-s14-tick", "aria-hidden": "true" }, [api.ico("check")]); }   // the Checkmark Badge
      function stIcon(s) { return s === "kept" ? tick() : h("span", { "class": "cb-s14-stic", "aria-hidden": "true" }, [icon(s === "notyet" ? "clock" : "ask")]); }
      function chip(s, fresh) {
        if (!s) return h("span", { "class": "cb-s14-chip", "data-st": "none" }, [h("span", { text: T.notChecked })]);
        return h("span", { "class": "cb-s14-chip" + (fresh ? " is-new" : ""), "data-st": s }, [stIcon(s), h("span", { text: T.st[s] })]);
      }
      function art(cls, kids, withSite) {
        var k = (kids || []).slice();
        if (withSite && path === "built") {          // on the start screen only, so it is never mistaken for a clue
          var site = h("span", { "class": "cb-s14-site", "aria-hidden": "true" }, [h("span", { "class": "cb-story-obj" }, [api.story(ART.site)]), h("span", { "class": "cb-story-tag", text: T.siteTag })]);
          site.style.setProperty("--x", SITE[0] + "%"); site.style.setProperty("--y", SITE[1] + "%");
          k.unshift(site);
        }
        return api.crop(CROP[path], "cb-s14-art" + (cls ? " " + cls : ""), k);
      }
      function cover() {             // the Promise notebook, closed, with the Checkmark Badge on its cover
        return h("span", { "class": "cb-s14-cover", "aria-hidden": "true" }, [
          h("span", { "class": "cb-s14-cover__pages" }),
          h("span", { "class": "cb-s14-cover__face" }, [h("span", { "class": "cb-s14-cover__rings" }, [h("i"), h("i"), h("i")]),
            h("span", { "class": "cb-s14-cover__plate" }, [icon("notebook"), h("b", { text: T.notebook })])]),
          h("span", { "class": "cb-s14-cover__badge" }, [api.ico("check")])]);
      }
      function nbHead(count) {
        return h("div", { "class": "cb-s14-nb__head" }, [h("span", { "class": "cb-s14-nb__ic", "aria-hidden": "true" }, [icon("notebook")]),
          h("h3", { id: "cb-s14-nb-h", text: T.notebook }), count ? h("p", { "class": "cb-s14-nb__count", text: count }) : null]);
      }
      function rowMain(it, s, big, fresh) {
        return h("div", { "class": "cb-s14-row__main" }, [who(it), h("div", { "class": "cb-s14-row__txt" }, [h("b", { text: maker(it) }),
          h("q", { "class": big ? "is-big" : null, text: api.t2(it.p.words) })]), chip(s, fresh)]);
      }

      /* ── start: this round's picture, the notebook, and the path in words ── */
      function intro() {
        var pad = h("span", { "class": "cb-s14-pad", "aria-hidden": "true" }, [h("span", { "class": "cb-story-obj" }, [api.story(ART.pad)]), h("span", { "class": "cb-story-tag", text: T.notebook })]);
        api.screen([api.stopHud(stop, null), h("div", { "class": "cb-board" }, [h("div", { "class": "cb-s14-intro" }, [
          art("cb-s14-intro__art", [pad], true),
          h("div", { "class": "cb-s14-intro__copy" }, [
            h("p", { "class": "cb-s14-intro__lead", text: path === "built" ? T.introBuilt : T.introStudying }),
            h("p", { "class": "cb-s14-intro__fair" }, [api.ico("people"), h("span", { text: T.fair })]),
            h("div", { "class": "cb-row" }, [api.btn(T.start, "cb-btn--go cb-btn--big", G(function () { check('[data-s14="now"]'); say(T.promiseN(1)); api.frame(); }), "go", true)])])])])]);
        api.frame(); hush();
      }

      /* ── Step 1 · check each promise: notebook row → clue in town → status ── */
      function tapClue(id) {
        var it = items[ci]; if (it.clueTap) return;
        it.clueTap = id; it.clueOK = it.state === "none" ? id === "none" : id === it.p.clue;
        check('[data-s14="box"]', true);
        var m = boxMsg(it);
        say((m ? m[0] + " " : "") + (it.line ? T.see + " " + it.line + " " : "") + T.how);
      }
      function boxMsg(it) {           // [text, ok] for the clue box, or null when the first tap found the clue
        var has = it.state !== "none";
        if (it.clueOK) return has ? null : [T.rightNone, true];
        if (it.clueTap === "none") return [T.lookClue, false];
        return [T.other + " " + (has ? T.hereIs : T.noneHere), false];
      }
      function tapStatus(s) {
        var it = items[ci]; if (!it.clueTap || it.st) return;
        it.st = s; it.stOK = s === it.truth;
        check('[data-s14="answer"]', true);
        say(it.stOK ? T.ok[it.truth] : T.wrong[it.truth]);
      }
      function check(focus, toBox) {
        var it = items[ci], phase = it.st ? "answered" : it.clueTap ? "status" : "clue", has = it.state !== "none";
        var rows = h("ol", { "class": "cb-s14-rows" }, items.map(function (r, i) {
          var now = i === ci, shown = i < ci || (now && r.st) ? r.truth : null;
          return h("li", { "class": "cb-s14-row", "data-now": now || null, "data-s14": now ? "now" : null, "aria-current": now ? "step" : null, tabindex: now ? "-1" : null },
            [rowMain(r, shown, now, now && phase === "answered")]);
        }));
        var nb = h("section", { "class": "cb-s14-nb", "aria-labelledby": "cb-s14-nb-h" }, [nbHead(T.promiseN(ci + 1)), rows]);
        /* the clues in town: 4 buttons, each at the painted place it names, in reading order (left to right) */
        var vis = items.filter(function (r) { return r.state !== "none"; }).sort(function (a, b) { return CLUE_AT[path][a.p.clue][0] - CLUE_AT[path][b.p.clue][0]; });
        var clues = h("ul", { "class": "cb-s14-clues" }, vis.map(function (r) {
          var isThis = phase !== "clue" && r === it, tapped = phase !== "clue" && it.clueTap === r.p.clue && r !== it, label = api.t2(CLUES[r.p.clue]);
          var b = h("button", { type: "button", "class": "cb-s14-clue" + (isThis ? " is-this" : "") + (tapped ? " is-tapped" : ""), "data-clue": r.p.clue,
            "aria-label": T.clueAria(label), "aria-disabled": phase !== "clue" ? "true" : null, onclick: G(function () { tapClue(r.p.clue); }) },
            [h("span", { "class": "cb-s14-clue__disc cb-story-obj" }, [api.story(ART[r.p.clue])]), h("span", { "class": "cb-s14-clue__lbl", text: label })]);
          var at = CLUE_AT[path][r.p.clue], li = h("li", null, [b]); li.style.setProperty("--x", at[0] + "%"); li.style.setProperty("--y", at[1] + "%");
          return li;
        }));
        var none = h("button", { type: "button", "class": "cb-s14-none" + (phase !== "clue" && !has ? " is-this" : "") + (phase !== "clue" && has && it.clueTap === "none" ? " is-tapped" : ""),
          "data-s14": "none", "aria-disabled": phase !== "clue" ? "true" : null, onclick: G(function () { tapClue("none"); }) },
          [h("span", { "class": "cb-s14-none__disc", "aria-hidden": "true" }, [icon("ask")]), h("span", { text: T.noClue })]);
        var box = null;
        if (phase !== "clue") {
          var m = boxMsg(it), sts = h("div", { "class": "cb-s14-sts" }, ["kept", "notyet", "ask"].map(function (s) {
            var isR = phase === "answered" && s === it.truth, mine = phase === "answered" && s === it.st && !isR;
            return h("button", { type: "button", "class": "cb-s14-st" + (isR ? " is-right" : "") + (mine ? " is-chosen" : ""), "data-st": s,
              "aria-label": T.stAria(T.st[s]), "aria-disabled": phase === "answered" ? "true" : null, onclick: G(function () { tapStatus(s); }) },
              [stIcon(s), h("span", { text: T.st[s] }), isR ? h("span", { "class": "cb-s14-st__stamp", "aria-hidden": "true" }, [api.ico("check")]) : null]);
          }));
          box = h("div", { "class": "cb-s14-box" + (phase === "status" ? " is-new" : ""), tabindex: "-1", "data-s14": "box" }, [
            m ? api.fb(m[0], m[1]) : null,
            it.line ? h("div", { "class": "cb-s14-see" }, [h("span", { "class": "cb-s14-see__ic", "aria-hidden": "true" }, [h("span", { "class": "cb-story-obj" }, [api.story(ART[it.p.clue])])]),
              h("div", null, [h("p", { "class": "cb-s14-see__k", text: T.see }), h("p", { "class": "cb-s14-see__line", text: it.line })])]) : null,
            h("div", { "class": "cb-s14-how" }, [h("p", { "class": "cb-s14-how__q", text: T.how }), sts])]);
        }
        var actions = null;
        if (phase === "answered") {
          var ans = api.fb(it.stOK ? T.ok[it.truth] : T.wrong[it.truth], it.stOK);
          ans.setAttribute("tabindex", "-1"); ans.setAttribute("data-s14", "answer");
          var last = ci === items.length - 1;
          actions = h("div", { "class": "cb-actions" }, [h("div", { "class": "cb-actions__info" }, [ans]),
            api.btn(last ? T.followUp : T.nextPromise, "cb-btn--go cb-btn--big", G(function () {
              if (last) return follow(true);
              ci++; check('[data-s14="now"]'); say(T.promiseN(ci + 1)); showNow();
            }), "go", true)]);
        }
        api.screen([hud(0), h("div", { "class": "cb-board" }, [api.coach(T.s1, "peek"),
          h("div", { "class": "cb-s14-play", "data-step": "1", "data-phase": phase }, [nb,
            h("div", { "class": "cb-s14-scene" }, [h("div", { "class": "cb-s14-stage" }, [art(null), clues]), none, box])]),
          actions])], focus);
        hush();
        if (toBox) {                   // keep the clue box and its status buttons in view, clear of the sticky answer bar
          var bx = document.querySelector(".cb-s14-box");
          if (bx && bx.scrollIntoView) bx.scrollIntoView({ block: "nearest", behavior: api.REDUCED ? "auto" : "smooth" });
        }
      }

      function showNow() {            // bring the stage back into view, or, on a short phone screen, the promise being checked
        var row = document.querySelector('[data-s14="now"]'), stage = document.querySelector('[data-game="community-builders"]');
        if (!row || !stage || !row.scrollIntoView) return api.frame();
        var pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;          // the page keeps room for its header
        if (row.getBoundingClientRect().bottom - stage.getBoundingClientRect().top + pad > window.innerHeight - 12)   // below the fold even with the stage framed
          row.scrollIntoView({ block: "end", behavior: api.REDUCED ? "auto" : "smooth" });
        else api.frame();
      }

      /* ── Step 2 · follow up kindly: every choice is kind, and every choice counts ── */
      function done() { return need.filter(function (it) { return it.fu; }).length; }
      function tapFu(i, k) {
        items[i].fu = k;
        follow(false, '[data-row="' + i + '"][data-fu="' + k + '"]', i);
        var talk = document.querySelector(".cb-s14-talk.is-new");          // the picked line and the kind answer, in view above the bar
        if (talk && talk.scrollIntoView) talk.scrollIntoView({ block: "nearest", behavior: api.REDUCED ? "auto" : "smooth" });
        say(T.reply + " " + T.fuN(done(), need.length));
      }
      function follow(first, focus, fresh) {
        var firstNeed = -1;
        var rows = h("ol", { "class": "cb-s14-rows" }, items.map(function (it, i) {
          var needs = it.truth !== "kept";
          if (needs && firstNeed < 0) firstNeed = i;
          var kids = [rowMain(it, it.truth, false)];
          if (needs) {
            var lines = T.fuLine[it.truth];
            kids.push(h("div", { "class": "cb-s14-fus", role: "group", "aria-label": maker(it) + ": " + api.t2(it.p.words) }, FU.map(function (k) {
              return h("button", { type: "button", "class": "cb-s14-fu", "data-row": String(i), "data-fu": k, "aria-pressed": it.fu === k ? "true" : "false",
                onclick: G(function () { tapFu(i, k); }) }, [h("span", { "class": "cb-s14-fu__ic", "aria-hidden": "true" }, [icon(FU_ICON[k])]),
                h("span", { "class": "cb-s14-fu__txt" }, [h("b", { text: T.fu[k] }), h("span", { "class": "cb-s14-fu__line", text: lines[k] })])]);
            })));
            if (it.fu) kids.push(h("div", { "class": "cb-s14-talk" + (fresh === i ? " is-new" : "") }, [h("p", { "class": "cb-s14-say cb-s14-say--me", text: lines[it.fu] }),
              h("div", { "class": "cb-s14-say cb-s14-say--them" }, [who(it, "cb-s14-who--sm"), h("p", { text: T.reply })])]));
          }
          return h("li", { "class": "cb-s14-row" + (needs ? " cb-s14-row--need" : " cb-s14-row--kept"), "data-s14": needs ? "need-" + i : null, tabindex: needs ? "-1" : null }, kids);
        }));
        var nb = h("section", { "class": "cb-s14-nb", "aria-labelledby": "cb-s14-nb-h" }, [nbHead(null), rows]);
        var closeBtn = api.btn(T.closeNb, "cb-btn--go cb-btn--big", G(function () { tryClose(closeBtn); }));
        closeBtn.insertBefore(icon("notebook"), closeBtn.firstChild);
        api.screen([hud(1), h("div", { "class": "cb-board" }, [api.coach(T.s2, "chat"),
          h("div", { "class": "cb-s14-play", "data-step": "2" }, [nb]),
          h("div", { "class": "cb-actions" }, [h("div", { "class": "cb-actions__info" }, [h("p", { "class": "cb-msg cb-s14-msg", text: T.fuN(done(), need.length) })]), closeBtn])])],
        focus || '[data-s14="need-' + firstNeed + '"]');
        hush();
        if (first) { api.frame(); say(T.fuN(0, need.length)); }
      }
      function tryClose(opener) {
        var missing = need.filter(function (it) { return !it.fu; });
        if (!missing.length) return closed();
        var choice = null, d;
        var back = api.btn(T.goBack, "cb-btn--primary", G(function () { choice = "back"; d.close(); }), "back");
        var anyway = api.btn(T.closeAnyway, "cb-btn--quiet", G(function () { choice = "close"; d.close(); }));
        d = api.dialog(T.still(missing.length), [h("div", { "class": "cb-row cb-s14-confirm" }, [back, anyway])], null, function () {
          if (choice === "close") return closed();
          var target = choice === "back" ? document.querySelector('[data-row="' + items.indexOf(missing[0]) + '"][data-fu="thanks"]') : opener;
          if (target && target.isConnected) {
            target.focus({ preventScroll: true });
            if (choice === "back" && target.scrollIntoView) target.scrollIntoView({ block: "center", behavior: api.REDUCED ? "auto" : "smooth" });
          }
        });
        var foot = d.querySelector(".cb-dlg__foot"); if (foot) foot.remove();     // its two choices are the only way on
        hush();
      }

      /* ── closed: the notebook shuts gently and the Checkmark Badge lands on its cover ── */
      function closed() {
        var see = api.btn(T.seeScore, "cb-btn--go cb-btn--big", G(finish), "go", true); see.setAttribute("data-s14", "see");
        api.screen([api.stopHud(stop, STEPS, 2, T.step(2)), h("div", { "class": "cb-board" }, [h("div", { "class": "cb-s14-end" }, [
          art("cb-s14-end__art", [h("span", { "class": "cb-s14-end__desk" }, [cover()])]),
          h("div", { "class": "cb-s14-end__copy" }, [h("p", { "class": "cb-s14-end__line", text: T.closing }), h("div", { "class": "cb-row" }, [see])])])])],
        '[data-s14="see"]');
        api.frame(); say(T.closing); hush();
      }

      /* ── score card: process only, never a path, a maker or speed ── */
      function finish() {
        var clues = items.filter(function (it) { return it.clueOK; }).length, sts = items.filter(function (it) { return it.stOK; }).length;
        var allFu = need.every(function (it) { return it.fu; });
        var score = 8 * clues + 8 * sts + (allFu ? 20 : 0);
        var tip = !allFu ? T.tipFollow
          : items.some(function (it) { return it.truth === "ask" && it.st === "notyet"; }) ? T.tipAsk
          : items.some(function (it) { return !it.stOK; }) ? T.tipStatus
          : items.some(function (it) { return !it.clueOK; }) ? T.tipClue : T.tip100;
        var nc = {}, old = (api.rec(stop.id) || {}).noClue || {};
        for (var k in old) nc[k] = old[k];
        nc[path] = noClue.code;
        var info = api.saveRound(stop.id, score, { lastPath: path, noClue: nc,
          lastRound: path + ":" + items.map(function (it) { return it.p.code + "=" + it.state; }).join(",") });
        api.endPlay();
        var recap = h("div", { "class": "cb-s14-recap" }, [h("p", { "class": "cb-s14-recap__h" }, [icon("notebook"), h("strong", { text: T.notebook })]),
          h("ul", null, items.map(function (it) {
            return h("li", null, [who(it, "cb-s14-who--sm"), h("span", { "class": "cb-s14-recap__txt" }, [h("b", { text: maker(it) }), h("q", { text: api.t2(it.p.words) })]), chip(it.truth)]);
          }))]);
        var askCard = h("div", { "class": "cb-tipcard cb-s14-askcard" }, [api.ico("chat"), h("div", null, [h("strong", { text: T.askH }), h("p", { text: T.ask })])]);
        var card = api.scoreCard(stop, score, info, tip, T.can, T.real, h("div", { "class": "cb-s14-extra" }, [askCard, recap]));
        var canIco = card.querySelector(".cb-card__can > .cb-ico");                 // the closed notebook leads the takeaway
        if (canIco) canIco.parentNode.replaceChild(icon("closed", "cb-s14-can"), canIco);
        var gu = api.btn(T.gu, "cb-btn--quiet", function () { api.dialog(T.gu, [h("p", { text: T.guText })], gu); }, "family");
        api.finishRound(stop.id, card, api.cardButtons(stop.id, api.restart(stop.id), gu));
        hush();                                                                      // the shell's card buttons get the same short calm
        [].forEach.call(document.querySelectorAll(".cb-card__btns"), function (row) {
          row.addEventListener("click", function (e) { if (e.detail > 0 && Date.now() < calm) { e.stopPropagation(); e.preventDefault(); } }, true);
        });
        say(api.W.score + " " + score + " / 100");
      }

      intro();
    }
  });
})();
