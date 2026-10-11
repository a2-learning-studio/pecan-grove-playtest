/* Community Builders of Pecan Grove · Stop 10 · Match a Fix / Une problema y solución
   A fix board on the corkboard in the School maker room. Tap a problem, then a fix from a real place, open its
   "Did it work?" note, then link them with yarn. Points reward checking, not just matching. Per problem:
   +12 right first link, +6 right second link, 0 when the game shows it, +8 when the right fix's note was opened
   before the player linked it. The open problem earns an Idea badge and no points. Max 100. No time bonus.
   Words, pools, rounds and scoring are exact from "10 - match-a-fix.md" (10A-10F). No network, no inputs. */
(function () {
  "use strict";
  var CB = window.CommunityBuilders; if (!CB) return;
  var LANG = (document.documentElement.lang || "en").slice(0, 2) === "es" ? "es" : "en";
  var NS = "http://www.w3.org/2000/svg";

  /* ── words (exact, from the spec) ──────────────────────────────────── */
  var S = {
    en: {
      title: "Match a Fix - Community Builders of Pecan Grove",
      intro1: "Before the Town Council decides, it asks neighbors for ideas to fix problems.",
      intro2: "Other places already tried some fixes. Match each problem to a fix that helps. Then check: did it work?",
      start: "Start", problems: "Problems", fixes: "Fixes from real places", check: "Did it work?",
      matched: function (n) { return "Problems matched: " + n + " of 5"; },
      coach1: "Tap a problem.", coach2: "Now tap a fix that could help it.", coach2Down: "Now scroll down to 'Fixes from real places' and tap one that could help it.",
      openChip: "No tested fix yet · Tap to share an idea", oneOpen: "One problem has no tested fix yet. You can share your own idea for it.",
      link: "Link them", other: "Pick another fix", linked: "Linked", linkN: function (n) { return "Link " + n; },
      good: "Good match! This fix was tried for this problem.",
      miss: function (place, prob) { return "That's a real fix from " + place.replace(/^Near /, "near ") + ", but it was tried for a different problem: " + prob + ". Try another fix."; },
      tried: "Tried", shown: "Here is the fix that was tried for it.",
      openQ: "Nobody has solved this yet. What's your idea?",
      nice: "Nice idea! Ideas like this still need testing. Who could help test it?",
      badge: "Idea badge", openLink: "No fix here was tested for this problem. Tap the card to share an idea.",
      look: "Look at your board:",
      aha: "Some fixes worked, some only partly, some are too early to tell, and some problems have no tested fix yet.",
      see: "See my score", chosen: "Chosen", probL: "Problem: ", fixL: "Fix: ",
      can: "I can match a problem with a fix and check if it worked.",
      tipIdea: "Great fixing! Try a new round with new problems.",
      tip100: "Perfect board! Next time, share your idea on the open problem too.",
      tipCheck: "Next time, tap 'Did it work?' before you link.",
      tipRead: "Next time, read the problem again, then look for the fix made for it.",
      real: "Pick one problem at your school or in your neighborhood. With a grown-up, look for one place that tried a fix. Did it work?",
      gu: "For grown-ups: about this stop",
      guText: "Each solution card names a real place and gives an honest 'Did it work?' note, for example testing wells before and after digging, or metering construction water. Some problems, like rent rises, truck traffic and power-line routes, have no tested fix yet."
    },
    es: {
      title: "Une problema y solución - Constructores de comunidad de Pecan Grove",
      intro1: "Antes de decidir, el Concejo del pueblo les pide a los vecinos ideas para resolver problemas.",
      intro2: "Otros lugares ya probaron algunas soluciones. Une cada problema con una solución que ayude. Luego revisa: ¿funcionó?",
      start: "Empezar", problems: "Problemas", fixes: "Soluciones de lugares reales", check: "¿Funcionó?",
      matched: function (n) { return "Problemas unidos: " + n + " de 5"; },
      coach1: "Toca un problema.", coach2: "Ahora toca una solución que podría ayudar.",
      coach2Down: "Ahora baja hasta 'Soluciones de lugares reales' y toca una que podría ayudar.",
      openChip: "Aún no hay solución probada · Toca para compartir una idea", oneOpen: "Un problema todavía no tiene una solución probada. Puedes compartir tu propia idea.",
      link: "Unirlos", other: "Elegir otra solución", linked: "Unido", linkN: function (n) { return "Unión " + n; },
      good: "¡Buena unión! Esta solución se probó para este problema.",
      miss: function (place, prob) {      // "de" + "Condado de Kent" reads "del condado de Kent" in a sentence
        var at = /^Condado /.test(place) ? "del c" + place.slice(1) : "de " + place.replace(/^Cerca /, "cerca ");
        return "Es una solución real " + at + ", pero se probó para otro problema: " + prob + ". Prueba otra solución.";
      },
      tried: "Ya probaste", shown: "Mira la solución que se probó para este problema.",
      openQ: "Nadie lo ha resuelto todavía. ¿Cuál es tu idea?",
      nice: "¡Buena idea! Las ideas como esta todavía hay que probarlas. ¿Quién podría ayudar a probarla?",
      badge: "Insignia de idea", openLink: "Ninguna solución de aquí se probó para este problema. Toca la tarjeta para compartir una idea.",
      look: "Mira tu tablero:",
      aha: "Algunas soluciones funcionaron, otras solo en parte, de otras es muy pronto para saber, y algunos problemas todavía no tienen una solución probada.",
      see: "Ver mi puntaje", chosen: "Elegido", probL: "Problema: ", fixL: "Solución: ",
      can: "Puedo unir un problema con una solución y revisar si funcionó.",
      tipIdea: "¡Muy bien! Prueba una nueva ronda con problemas nuevos.",
      tip100: "¡Tablero perfecto! La próxima vez, comparte también tu idea en el problema abierto.",
      tipCheck: "La próxima vez, toca '¿Funcionó?' antes de unir.",
      tipRead: "La próxima vez, lee otra vez el problema y busca la solución hecha para él.",
      real: "Elige un problema de tu escuela o de tu vecindario. Con un adulto, busca un lugar que haya probado una solución. ¿Funcionó?",
      gu: "Para adultos: sobre esta parada",
      guText: "Cada tarjeta de solución nombra un lugar real y trae una nota honesta de '¿Funcionó?', por ejemplo revisar los pozos antes y después de excavar, o medir el agua de la obra. Algunos problemas, como el aumento de la renta, el tráfico de camiones y la ruta de las líneas eléctricas, todavía no tienen una solución probada."
    }
  }[LANG];

  /* four stamps (10B): sun, half sun, hourglass, seed */
  var STAMP = { sun: ["Yes, it worked", "Sí, funcionó"], half: ["Partly", "En parte"], hour: ["Too early to tell", "Es muy pronto para saber"], seed: ["Not tested yet", "Aún no se ha probado"] };
  var ST_ORDER = ["sun", "half", "hour", "seed"];

  /* ── the 16 problems and their fixes (10C, 10D). Codes are for code only; the letter is the group.
     [code, neighbor, problem, fix, place, stamp, note]. Each problem has exactly one right fix: its own. ── */
  var D = [
    ["W1", "lee", ["Cooling the computers could use lots of drinking water.", "Enfriar las computadoras podría gastar mucha agua potable."],
      ["Cool them with recycled water", "Enfriarlas con agua reciclada"], ["Douglas County, Georgia", "Condado de Douglas, Georgia"], "sun",
      ["A data center there began cooling with recycled water in 2012.", "Un centro de datos de ahí empezó a enfriarse con agua reciclada en 2012."]],
    ["W2", "ana", ["Nobody counts the water used while building.", "Nadie cuenta el agua que se usa en la obra."],
      ["Put a meter on every water pipe", "Poner un medidor en cada tubo de agua"], ["Fayetteville, Georgia", "Fayetteville, Georgia"], "half",
      ["Some pipes were missed at first. Once found, the water was paid for.", "Al principio se pasaron algunos tubos. Cuando los encontraron, se pagó el agua."]],
    ["H1", "jayden", ["The computers make lots of heat that goes to waste.", "Las computadoras hacen mucho calor que se desperdicia."],
      ["Use the heat to warm homes", "Usar el calor para calentar casas"], ["Odense, Denmark", "Odense, Dinamarca"], "sun",
      ["It warms thousands of homes. It works best where a town already has heat pipes.", "Calienta miles de casas. Funciona mejor donde el pueblo ya tiene tubos de calefacción."]],
    ["J1", "ana", ["Most jobs could go to people from far away.", "La mayoría de los empleos podrían ser para gente de lejos."],
      ["Train people who live here for the jobs", "Preparar a la gente de aquí para esos empleos"], ["Douglasville, Georgia", "Douglasville, Georgia"], "hour",
      ["A tech college there teaches the classes. We don't know yet how many got jobs.", "Una escuela técnica de ahí da las clases. Todavía no sabemos cuántos consiguieron empleo."]],
    ["L1", "johnson", ["Mud from digging could get into wells.", "El lodo de la excavación podría llegar a los pozos."],
      ["Test wells before and after digging", "Revisar los pozos antes y después de excavar"], ["Near Mansfield, Georgia", "Cerca de Mansfield, Georgia"], "seed",
      ["Neighbors and the company there disagree about what made wells muddy. Testing first helps everyone know.", "Ahí los vecinos y la empresa no están de acuerdo sobre qué ensució los pozos. Revisar antes ayuda a que todos sepan."]],
    ["L2", "ruth", ["Old graves could be hidden on the land.", "Podría haber tumbas antiguas escondidas en el terreno."],
      ["Look for graves first and leave space around them", "Buscar tumbas antes y dejar espacio alrededor"], ["Hampton, Georgia", "Hampton, Georgia"], "half",
      ["Hampton kept a 50-foot space around an old graveyard. Other places are still checking.", "Hampton dejó 50 pies de espacio alrededor de un cementerio antiguo. Otros lugares todavía están revisando."]],
    ["L3", "johnson", ["Farms and forests could be cleared away.", "Se podrían perder granjas y bosques."],
      ["Make the project smaller", "Hacer el proyecto más pequeño"], ["Frederick County, Maryland", "Condado de Frederick, Maryland"], "hour",
      ["In 2026, a proposed deal there would make a project about 20% smaller.", "En 2026, un acuerdo propuesto ahí haría un proyecto como un 20 % más pequeño."]],
    ["N1", "jayden", ["A low hum could keep neighbors awake.", "Un zumbido grave podría no dejar dormir a los vecinos."],
      ["Measure sounds before building, then every year", "Medir los sonidos antes de construir y luego cada año"], ["Chandler, Arizona", "Chandler, Arizona"], "hour",
      ["Chandler started this in 2023. We found no results yet.", "Chandler empezó en 2023. Todavía no encontramos resultados."]],
    ["N2", "lee", ["Backup engines could make smoky air.", "Los motores de respaldo podrían echar humo."],
      ["Use the cleanest backup engines", "Usar los motores de respaldo más limpios"], ["Virginia", "Virginia"], "hour",
      ["Virginia made it a rule for new permits in 2026.", "Virginia lo hizo regla para los permisos nuevos en 2026."]],
    ["N3", "johnson", ["Bright lights could shine into homes all night.", "Las luces fuertes podrían alumbrar las casas toda la noche."],
      ["Dim the lights at night", "Bajar las luces de noche"], ["Near Mansfield, Georgia", "Cerca de Mansfield, Georgia"], "half",
      ["Lights were dimmed in 2025 after neighbors asked. Some neighbors still have worries.", "Bajaron las luces en 2025 cuando los vecinos lo pidieron. Algunos vecinos todavía tienen preocupaciones."]],
    ["N4", "patel", ["It could be built very close to homes.", "Lo podrían construir muy cerca de las casas."],
      ["Keep a wide space between it and homes", "Dejar un espacio amplio entre el edificio y las casas"], ["South Fulton, Georgia", "South Fulton, Georgia"], "hour",
      ["South Fulton made this a rule in 2026: 100 to 150 feet of space.", "South Fulton lo hizo regla en 2026: de 100 a 150 pies de espacio."]],
    ["M1", "ruth", ["Power bills could go up for families.", "Los recibos de luz de las familias podrían subir."],
      ["Big users pay their own share of power costs", "Que los grandes usuarios paguen su parte de la luz"], ["Ohio", "Ohio"], "hour",
      ["Ohio started this for one power company in 2025. There is little bill data yet.", "Ohio lo empezó con una compañía de luz en 2025. Todavía hay pocos datos de los recibos."]],
    ["M2", "jayden", ["Tax breaks could leave less money for schools.", "Una reducción de impuestos podría dejar menos dinero para las escuelas."],
      ["Pay full taxes, with no tax break", "Pagar todos los impuestos, sin reducción"], ["Barber County, Kansas", "Condado de Barber, Kansas"], "hour",
      ["In 2026, a data center there said it will pay full property taxes.", "En 2026, un centro de datos de ahí dijo que pagará todo su impuesto a la propiedad."]],
    ["M3", "ana", ["If it closes someday, an empty building could be left.", "Si algún día cierra, podría quedar un edificio vacío."],
      ["Set money aside now to remove it later", "Apartar dinero desde ahora para quitarlo después"], ["Kent County, Delaware", "Condado de Kent, Delaware"], "seed",
      ["Kent County made a rule like this in 2026. It has not been used yet.", "El condado de Kent hizo una regla así en 2026. Todavía no se ha usado."]],
    ["V1", "patel", ["Neighbors might not know who wants to build, or what was promised.", "Los vecinos podrían no saber quién quiere construir ni qué se prometió."],
      ["No secret agreements for leaders", "Que los líderes no firmen acuerdos secretos"], ["Pennsylvania", "Pensilvania"], "hour",
      ["Pennsylvania started this rule in 2026.", "Pensilvania empezó esta regla en 2026."]],
    ["V2", "ruth", ["Neighbors could feel that nobody listens to them.", "Los vecinos podrían sentir que nadie los escucha."],
      ["A neighbors' group that meets with leaders", "Un grupo de vecinos que se reúne con los líderes"], ["Prince William County, Virginia", "Condado de Prince William, Virginia"], "hour",
      ["In 2024 the county put more neighbors in its advice group. Results aren't known yet.", "En 2024 el condado puso a más vecinos en su grupo de consejo. Todavía no se saben los resultados."]]
  ];
  /* the 3 open problems (10E): no tested fix; three good ideas each, none marked best */
  var OPEN = [
    ["O1", "patel", ["Rents could go up while many workers are in town.", "Las rentas podrían subir mientras haya muchos trabajadores en el pueblo."], [
      ["Build homes for workers first", "Construir casas para los trabajadores primero"],
      ["Ask landlords to keep rents the same for a while", "Pedirles a los dueños que no suban las rentas por un tiempo"],
      ["Bring workers by bus from bigger towns", "Traer a los trabajadores en autobús desde ciudades más grandes"]]],
    ["O2", "lee", ["Lots of big trucks could crowd the roads for months.", "Muchos camiones grandes podrían llenar las calles por meses."], [
      ["Trucks drive only when school buses don't", "Que los camiones pasen solo cuando no pasan los autobuses escolares"],
      ["Make a special road for the trucks", "Hacer un camino especial para los camiones"],
      ["The builders fix any road the trucks damage", "Que la empresa arregle las calles que dañen los camiones"]]],
    ["O3", "johnson", ["New power lines could cross people's land.", "Nuevas líneas eléctricas podrían cruzar los terrenos de la gente."], [
      ["Follow power lines that are already there", "Seguir las líneas eléctricas que ya existen"],
      ["Put the lines underground", "Poner las líneas bajo tierra"],
      ["Ask landowners early where lines could go", "Preguntarles temprano a los dueños por dónde podrían pasar"]]]
  ];
  var DD = {}, BYG = {}, OD = {};
  D.forEach(function (r) {
    var e = { code: r[0], g: r[0].charAt(0), nb: r[1], p: r[2], f: r[3], pl: r[4], st: r[5], note: r[6] };
    DD[e.code] = e; (BYG[e.g] = BYG[e.g] || []).push(e.code);
  });
  OPEN.forEach(function (r) { OD[r[0]] = { code: r[0], nb: r[1], p: r[2], ideas: r[3] }; });
  var GROUPS = ["W", "H", "J", "L", "N", "M", "V"];

  /* ── authored icons: 24-unit grid, one 2px round stroke (the family of the shell's api.IC) ── */
  var ICONS = {
    half: '<path d="M3.5 16.5h17"/><path d="M7 16.5a5 5 0 0 1 10 0"/><path d="M12 6.2v2.4M5.3 9.4l1.7 1.7M18.7 9.4 17 11.1M8.5 20h7"/>',
    hour: '<path d="M6.5 3.5h11M6.5 20.5h11"/><path d="M8 3.5c0 4.4 4 5.2 4 8.5s-4 4.1-4 8.5M16 3.5c0 4.4-4 5.2-4 8.5s4 4.1 4 8.5"/><path d="M9.6 18.4c.8-1 1.5-1.5 2.4-1.5s1.6.5 2.4 1.5"/>',
    seed: '<g transform="rotate(-50 12 11)"><path d="M12 3.4c2.7 2.4 4.4 5.5 4.4 8.7 0 3.3-1.9 5.6-4.4 5.6s-4.4-2.3-4.4-5.6c0-3.2 1.7-6.3 4.4-8.7z"/><path d="M13.1 7.6c1 1.4 1.6 3 1.6 4.6 0 1.2-.3 2.2-.9 2.9"/></g><path d="M3.5 20.5h17"/>',
    pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
    pushpin: '<path d="M9 3.5h6"/><path d="M10.3 3.5v4.8L7.5 11.5v1.5h9v-1.5l-2.8-3.2V3.5"/><path d="M12 13v7.5"/>',
    stamp: '<path d="M10 3.5h4a1.5 1.5 0 0 1 1.5 1.5c0 2.7-1.8 3.8-1.8 6.5h-3.4c0-2.7-1.8-3.8-1.8-6.5A1.5 1.5 0 0 1 10 3.5z"/><path d="M5 14.5A1.5 1.5 0 0 1 6.5 13h11a1.5 1.5 0 0 1 1.5 1.5v3H5z"/><path d="M6 20.5h12"/>',
    link: '<circle cx="6" cy="7" r="2.5"/><circle cx="18" cy="17" r="2.5"/><path d="M8.4 8c4.4 1.8 1.4 6.9 7.2 8.1"/>',
    swap: '<path d="M4.5 8.5h14"/><path d="m15 5 3.5 3.5L15 12"/><path d="M19.5 15.5h-14"/><path d="m9 12-3.5 3.5L9 19"/>',
    problem: '<circle cx="9" cy="8" r="3"/><path d="M3.5 19.5c.5-3.2 2.8-5 5.5-5s5 1.8 5.5 5"/><path d="M17.5 5.5v6M17.5 15v.2"/>'
  };

  CB.register({ id: "match-a-fix", steps: [null, null, null, null, null], css: "10-match-a-fix.css", run: run });

  function run(api, stop) {
    var h = api.h, t2 = api.t2, REDUCED = api.REDUCED;
    document.title = S.title;                                   // the spec's exact page title
    var DOTS = [null, null, null, null, null];

    function icon(name, cls) {
      var s = document.createElementNS(NS, "svg");
      s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true"); s.setAttribute("focusable", "false");
      s.setAttribute("class", "cb-ico" + (cls ? " " + cls : ""));
      s.innerHTML = ICONS[name] || api.IC[name];                // constant, authored markup only
      return s;
    }
    function sv(tag, attrs) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
    function stIcon(st) { return icon(st === "sun" ? "sun" : st); }
    function stDisc(st, cls) { return h("span", { "class": "cb-s10-stdisc" + (cls ? " " + cls : ""), "data-st": st, "aria-hidden": "true" }, [stIcon(st)]); }
    function stChip(st) { return h("span", { "class": "cb-s10-chip cb-s10-chip--stamp", "data-st": st }, [stIcon(st), h("span", { text: t2(STAMP[st]) })]); }
    function chip(kind, text, ic) { return h("span", { "class": "cb-s10-chip cb-s10-chip--" + kind }, [ic ? icon(ic) : null, h("span", { text: text })]); }
    function nbOf(code) { return api.nbById((DD[code] || OD[code]).nb); }
    /* the shell dialog, tagged so this stop can size its head and buttons (64px buttons, a stacked head on phones) */
    function s10dlg(title, body, opener, onClose, opt) { var d = api.dialog(title, body, opener, onClose, opt); if (d && d.classList) d.classList.add("cb-s10-dlg"); return d; }
    function noDot(s) { return s.replace(/\.$/, ""); }

    /* ── a new round (10E): 5 problems from 5 different groups, at most 2 from the last round (and, for Team 2,
       at most 2 of Team 1's); their 5 fixes plus one decoy fix from each of the 2 groups left out; 1 open problem,
       not last round's; at least one sun or half sun and one hourglass or seed among the right fixes. ── */
    var rec = api.rec(stop.id), T = api.team ? api.team() : null;
    var last = rec && rec.lastRound ? rec.lastRound : null, lastOpen = rec && rec.lastOpen ? rec.lastOpen : null;
    var avoid = T && T.phase === "B" && T.s10 ? T.s10 : null, avoidOpen = T && T.phase === "B" ? T.s10open : null;
    function overlap(a, b) { return b ? a.filter(function (x) { return b.indexOf(x) >= 0; }).length : 0; }
    function draw() {
      var fallback = null;
      for (var t = 0; t < 3000; t++) {
        var gs = api.shuffle(GROUPS).slice(0, 5);
        var probs = gs.map(function (g) { return api.pick(BYG[g]); });
        var sts = probs.map(function (c) { return DD[c].st; });
        if (!sts.some(function (s) { return s === "sun" || s === "half"; }) || !sts.some(function (s) { return s === "hour" || s === "seed"; })) continue;
        if (overlap(probs, avoid) > 2) continue;
        var out = { probs: probs, decoys: GROUPS.filter(function (g) { return gs.indexOf(g) < 0; }).map(function (g) { return api.pick(BYG[g]); }) };
        if (!fallback) fallback = out;
        if (overlap(probs, last) > 2) continue;
        return out;
      }
      return fallback;
    }
    var R = draw();
    var openPool = OPEN.map(function (o) { return o[0]; }).filter(function (c) { return c !== lastOpen; });
    var openCode = api.pick(openPool.filter(function (c) { return c !== avoidOpen; }).length ? openPool.filter(function (c) { return c !== avoidOpen; }) : openPool);
    if (T && T.phase === "A") { T.s10 = R.probs.slice(); T.s10open = openCode; }
    var pList = api.shuffle(R.probs.concat([openCode]));          // the board: every card shuffled every round
    var fList = api.shuffle(R.probs.concat(R.decoys));
    var ideaOrder = api.shuffle([0, 1, 2]);

    var state = {}; R.probs.forEach(function (c) { state[c] = { misses: [], link: null, by: null, note: false, n: 0 }; });
    var fixLink = {}, opened = {}, drawn = {}, selP = null, selF = null, idea = null, fbk = null, linkNo = 0;
    var corkEl = null, yarnEl = null, ro = null, endSeen = false, finished = false;
    function nLinked() { return R.probs.filter(function (c) { return state[c].link; }).length; }
    function isOpen(c) { return c === openCode; }
    function triedFor(p, f) { return !!(p && state[p] && state[p].misses.indexOf(f) >= 0); }

    /* ── cards ── */
    function probLabel(c) { var d = DD[c] || OD[c]; return S.probL + t2(d.p) + " " + api.nmCap(nbOf(c)); }
    function fixLabel(c) { return S.fixL + t2(DD[c].f) + ". " + t2(DD[c].pl); }
    function edgePin(kind, c, n) { var a = { "class": "cb-s10-edge", "aria-hidden": "true", text: String(n) }; a["data-pin-" + kind] = c; return h("span", a); }
    function face(nb) { return h("span", { "class": "cb-s10-face", "aria-hidden": "true" }, [api.img(nb.img, "", null, true)]); }

    function probCard(c) {
      var open = isOpen(c), d = open ? OD[c] : DD[c], nb = nbOf(c), st = open ? null : state[c];
      var linked = !!(st && st.link), chosen = selP === c;
      var label = probLabel(c), chips = [];
      if (chosen) { chips.push(chip("chosen", S.chosen)); label += ". " + S.chosen; }
      if (linked) { chips.push(chip("linked", S.linked + " · " + S.linkN(st.n), "check")); label += ". " + S.linked + ". " + S.linkN(st.n); }
      if (open && idea !== null) { chips.push(chip("badge", S.badge, "bulb")); label += ". " + S.badge; }
      else if (open) { chips.push(chip("open", S.openChip, "bulb")); label += ". " + S.openChip; }
      var b = h("button", { type: "button", "class": "cb-s10-card cb-s10-prob" + (open ? " cb-s10-prob--open" : ""), "data-p": c,
        "data-s": linked ? "linked" : chosen ? "chosen" : null, "aria-label": label,
        "aria-pressed": open || linked ? null : (chosen ? "true" : "false"), "aria-disabled": linked ? "true" : null, "aria-haspopup": open ? "dialog" : null,
        onclick: function () { if (open) tapOpen(b); else tapP(c); } }, [
        face(nb),
        h("span", { "class": "cb-s10-prob__body" }, [h("span", { "class": "cb-s10-prob__who", text: api.nmCap(nb) }), h("span", { "class": "cb-s10-prob__text", text: t2(d.p) }),
          chips.length ? h("span", { "class": "cb-s10-chips" }, chips) : null]),
        open ? h("span", { "class": "cb-s10-bulb", "aria-hidden": "true" }, [icon("bulb")]) : null,
        linked ? edgePin("p", c, st.n) : null]);
      return b;
    }
    function fixCard(c) {
      var d = DD[c], lp = fixLink[c], chosen = selF === c, tried = !lp && triedFor(selP, c), done = !lp && nLinked() === 5;
      var s = lp ? "linked" : chosen ? "chosen" : tried ? "tried" : null;
      var label = fixLabel(c), chips = [];
      if (chosen) { chips.push(chip("chosen", S.chosen)); label += ". " + S.chosen; }
      if (tried) { chips.push(chip("tried", S.tried)); label += ". " + S.tried; }
      if (lp) {
        chips.push(chip("linked", S.linked + " · " + S.linkN(state[lp].n), "check")); chips.push(stChip(d.st));
        label += ". " + S.linked + ". " + S.linkN(state[lp].n) + ". " + t2(STAMP[d.st]);
      }
      var main = h("button", { type: "button", "class": "cb-s10-fix__main", "data-f": c, "aria-label": label,
        "aria-pressed": lp || tried || done ? null : (chosen ? "true" : "false"), "aria-disabled": lp || tried || done ? "true" : null, onclick: function () { tapF(c); } }, [
        h("span", { "class": "cb-s10-fix__name", text: t2(d.f) }),
        h("span", { "class": "cb-s10-fix__place" }, [icon("pin"), h("span", { text: t2(d.pl) })]),
        chips.length ? h("span", { "class": "cb-s10-chips" }, chips) : null]);
      var flap = h("button", { type: "button", "class": "cb-s10-flap" + (opened[c] ? " is-seen" : ""), "data-c": c, "aria-label": S.check + " " + t2(d.f), "aria-haspopup": "dialog",
        onclick: function () { openNote(c, flap, '[data-c="' + c + '"]'); } }, [h("span", { "class": "cb-s10-flap__ic", "aria-hidden": "true" }, [icon("stamp"), opened[c] ? h("i", null, [icon("check")]) : null]),
        h("span", { text: S.check })]);
      return h("li", { "class": "cb-s10-fix", "data-s": s }, [lp ? edgePin("f", c, state[lp].n) : null, main, flap]);
    }

    /* ── the workbench: the shell's sticky action bar holds feedback, the chosen pair and its three buttons ── */
    function slotP() {
      if (!selP) return h("span", { "class": "cb-s10-slot is-empty", "aria-hidden": "true" }, [h("span", { "class": "cb-s10-slot__ic" }, [icon("problem")])]);
      var d = DD[selP];
      return h("span", { "class": "cb-s10-slot" }, [face(nbOf(selP)), h("span", { "class": "cb-s10-slot__t" }, [h("small", { text: api.nmCap(nbOf(selP)) }), h("b", { text: t2(d.p) })])]);
    }
    function slotF() {
      if (!selF) return h("span", { "class": "cb-s10-slot is-empty", "aria-hidden": "true" }, [h("span", { "class": "cb-s10-slot__ic" }, [icon("pin")])]);
      var d = DD[selF];
      return h("span", { "class": "cb-s10-slot cb-s10-slot--fix" }, [h("span", { "class": "cb-s10-slot__ic" }, [icon("pin")]),
        h("span", { "class": "cb-s10-slot__t" }, [h("b", { text: t2(d.f) }), h("small", { text: t2(d.pl) })])]);
    }
    function bench() {
      var n = nLinked();
      if (n === 5) {
        var counts = countStamps();
        return h("div", { "class": "cb-actions cb-s10-bench cb-s10-bench--end" }, [
          h("div", { "class": "cb-s10-end" }, [h("p", { "class": "cb-s10-end__look", text: S.look }), countList(counts, "cb-s10-counts"),
            h("p", { "class": "cb-s10-end__aha", text: S.aha })]),
          api.btn(S.see, "cb-btn--go cb-btn--big cb-s10-big cb-s10-see", finish, "go", true)]);
      }
      var both = selP && selF, kids = [];
      if (fbk) kids.push(api.fb(fbk.text, fbk.ok));
      if (selP || selF) kids.push(h("div", { "class": "cb-s10-pair" + (both ? " is-full" : "") }, [slotP(), h("span", { "class": "cb-s10-pair__yarn", "aria-hidden": "true" }, [icon("link")]), slotF()]));
      var row = [h("p", { "class": "cb-msg cb-s10-progress", text: S.matched(n) })];
      if (both) {
        var seen = !!opened[selF];
        var chk = api.btn(S.check, (seen ? "" : "cb-btn--primary ") + "cb-s10-big cb-s10-benchbtn" + (seen ? " is-seen" : ""), function () { openNote(selF, chk, '[data-b="check"]'); }, "check");
        chk.replaceChild(h("span", { "class": "cb-s10-flap__ic", "aria-hidden": "true" }, [icon("stamp"), seen ? h("i", null, [icon("check")]) : null]), chk.querySelector("svg"));
        chk.setAttribute("data-b", "check"); chk.setAttribute("aria-haspopup", "dialog");
        var lk = api.btn(S.link, (seen ? "cb-btn--go " : "") + "cb-s10-big cb-s10-benchbtn", doLink); lk.insertBefore(icon("link"), lk.firstChild); lk.setAttribute("data-b", "link");
        var ot = api.btn(S.other, "cb-btn--quiet cb-s10-big cb-s10-benchbtn", pickOther); ot.insertBefore(icon("swap"), ot.firstChild); ot.setAttribute("data-b", "other");
        row.push(h("div", { "class": "cb-s10-btns" }, [chk, lk, ot]));
      }
      kids.push(h("div", { "class": "cb-s10-bench__row" }, row));
      /* the bench floats (sticky) only while it holds something to act on or read; idle, it sits under the board */
      return h("div", { "class": "cb-actions cb-s10-bench" + (both ? " is-pair" : "") + (selP || selF || fbk ? " is-live" : "") + (fbk ? " has-fb" : "") }, kids);
    }
    function countStamps() { var c = { sun: 0, half: 0, hour: 0, seed: 0 }; R.probs.forEach(function (p) { c[DD[p].st]++; }); return c; }
    function countList(c, cls) {
      return h("ul", { "class": cls }, ST_ORDER.map(function (st) { return h("li", { "data-st": st }, [stDisc(st), h("span", { text: t2(STAMP[st]) + ": " + c[st] })]); }));
    }
    function coach(text, ic) { return h("p", { "class": "cb-coach cb-s10-coach" }, [icon(ic), h("span", { text: text })]); }

    /* ── the board ── */
    function play(focusSel, first) {
      var n = nLinked();
      var yarn = sv("svg", { "class": "cb-s10-yarn", "aria-hidden": "true", focusable: "false", preserveAspectRatio: "none" });
      var cork = h("div", { "class": "cb-s10-cork" }, [yarn,
        h("section", { "class": "cb-s10-col cb-s10-col--p", "aria-labelledby": "cb-s10-hp" }, [
          h("h3", { "class": "cb-s10-col__h", id: "cb-s10-hp" }, [h("span", { "class": "cb-s10-col__ic", "aria-hidden": "true" }, [icon("problem")]), h("span", { text: S.problems })]),
          h("ul", { "class": "cb-s10-list" }, pList.map(function (c) { return h("li", null, [probCard(c)]); }))]),
        h("section", { "class": "cb-s10-col cb-s10-col--f", "aria-labelledby": "cb-s10-hf" }, [
          h("h3", { "class": "cb-s10-col__h", id: "cb-s10-hf" }, [h("span", { "class": "cb-s10-col__ic", "aria-hidden": "true" }, [icon("pin")]), h("span", { text: S.fixes })]),
          h("ul", { "class": "cb-s10-list" }, fList.map(fixCard))])]);
      var g = document.querySelector('[data-game="community-builders"]'), oneCol = !!g && g.clientWidth < 760;   // one column: the fixes sit below the problems
      var board = h("div", { "class": "cb-board cb-s10 cb-s10-play" }, [n < 5 ? coach(selP ? (oneCol ? S.coach2Down : S.coach2) : S.coach1, selP ? "pin" : "problem") : null, cork, bench()]);
      api.screen([api.stopHud(stop, DOTS, n, S.matched(n)), board], focusSel || null);
      corkEl = cork; yarnEl = yarn;
      if (ro) ro.disconnect();
      if (window.ResizeObserver) { ro = new ResizeObserver(function () { requestAnimationFrame(placeYarn); }); ro.observe(cork); [].forEach.call(cork.querySelectorAll(".cb-s10-list"), function (l) { ro.observe(l); }); }
      requestAnimationFrame(placeYarn);
      if (first) api.frame();
      if (n === 5 && !endSeen) {                                 // on a phone the end panel sits under the board: bring it into view once
        endSeen = true;
        requestAnimationFrame(function () {
          var e = board.querySelector(".cb-s10-bench--end");
          if (e && getComputedStyle(e).position !== "sticky") e.scrollIntoView({ block: "nearest", behavior: REDUCED ? "auto" : "smooth" });
        });
      }
    }

    /* clay yarn between linked pairs, pinned at both card edges (two-column board only; on one column the
       "Link n" numbers on both cards carry the pair) */
    function yarnD(a, b, sag) {
      var dx = b.x - a.x;
      return "M" + a.x.toFixed(1) + " " + a.y.toFixed(1) + " C" + (a.x + dx * 0.6).toFixed(1) + " " + (a.y + sag).toFixed(1) + " " +
        (b.x - dx * 0.6).toFixed(1) + " " + (b.y + sag).toFixed(1) + " " + b.x.toFixed(1) + " " + b.y.toFixed(1);
    }
    function placeYarn() {
      var cork = corkEl, svg = yarnEl; if (!cork || !cork.isConnected) return;
      var cr = cork.getBoundingClientRect(), cols = cork.querySelectorAll(".cb-s10-col");
      var two = cols[1].getBoundingClientRect().left > cols[0].getBoundingClientRect().right - 1;
      svg.setAttribute("viewBox", "0 0 " + cr.width.toFixed(1) + " " + cr.height.toFixed(1));
      svg.classList.toggle("is-off", !two);
      R.probs.forEach(function (c) {
        if (!state[c].link) return;
        var pe = cork.querySelector('[data-pin-p="' + c + '"]'), fe = cork.querySelector('[data-pin-f="' + c + '"]'); if (!pe || !fe) return;
        var pr = pe.getBoundingClientRect(), fr = fe.getBoundingClientRect();
        var a = { x: pr.left + pr.width / 2 - cr.left, y: pr.top + pr.height / 2 - cr.top }, b = { x: fr.left + fr.width / 2 - cr.left, y: fr.top + fr.height / 2 - cr.top };
        var d = yarnD(a, b, 10 + Math.min(34, Math.abs(b.y - a.y) * 0.06));
        var g = svg.querySelector('[data-y="' + c + '"]');
        if (!g) {
          g = sv("g", { "class": "cb-s10-yarnline", "data-y": c });
          g.appendChild(sv("path", { "class": "cb-s10-yarn__base", pathLength: "1" })); g.appendChild(sv("path", { "class": "cb-s10-yarn__hi" }));
          if (!drawn[c] && !REDUCED && two) g.classList.add("is-new");          // reduced motion: the yarn just appears
          svg.appendChild(g);
        }
        if (two) drawn[c] = 1;
        [].forEach.call(g.querySelectorAll("path"), function (p) { p.setAttribute("d", d); });
      });
    }

    /* ── taps ── */
    function sayPair() { api.say(S.chosen + ". " + probLabel(selP) + ". " + fixLabel(selF) + ". " + S.matched(nLinked())); }
    function tapP(c) {
      if (state[c].link) return;
      fbk = null;
      if (selP === c) { selP = null; play('[data-p="' + c + '"]'); api.say(S.coach1); return; }
      selP = c;
      if (selF && triedFor(c, selF)) selF = null;
      if (selF) { play('[data-b="check"]'); sayPair(); return; }
      play('[data-p="' + c + '"]'); api.say(S.chosen + ". " + S.coach2);
      var hf = document.getElementById("cb-s10-hf");
      if (hf && hf.getBoundingClientRect().top > window.innerHeight * 0.7) {      // one column: the fixes are below the other problems
        try { hf.scrollIntoView({ block: "start", behavior: api.REDUCED ? "auto" : "smooth" }); } catch (e) { hf.scrollIntoView(); }
      }
    }
    function tapF(c) {
      if (fixLink[c] || triedFor(selP, c) || nLinked() === 5) return;
      fbk = null;
      if (selF === c) { selF = null; play('[data-f="' + c + '"]'); api.say(selP ? S.coach2 : S.coach1); return; }
      selF = c;
      if (selP) { play('[data-b="check"]'); sayPair(); return; }
      play('[data-f="' + c + '"]'); api.say(S.chosen + ". " + S.coach1);
    }
    function tapOpen(b) {
      if (selF) { selF = null; fbk = { text: S.openLink, ok: false }; play('[data-p="' + openCode + '"]'); api.say(S.openLink); return; }
      openIdeas(b);
    }
    function pickOther() { var f = selF; selF = null; fbk = null; play('[data-f="' + f + '"]'); api.say(S.coach2); }
    function nextFocus(after) {
      var i = pList.indexOf(after);
      for (var k = 1; k <= pList.length; k++) { var c = pList[(i + k) % pList.length]; if (!isOpen(c) && !state[c].link) return '[data-p="' + c + '"]'; }
      return ".cb-s10-see";
    }
    function doLink() {
      var p = selP, f = selF, st = state[p]; if (!p || !f) return;
      if (f === p) {
        st.link = f; st.by = "player"; st.note = !!opened[f]; st.n = ++linkNo; fixLink[f] = p;
        selP = selF = null; fbk = { text: S.good, ok: true };
        play(nextFocus(p));
        api.say(S.good + " " + t2(STAMP[DD[f].st]) + ". " + S.matched(nLinked()) + (nLinked() === 5 ? ". " + S.look + " " + S.aha : ""));
        return;
      }
      st.misses.push(f);
      if (st.misses.length < 2) {
        selF = null; fbk = { text: S.miss(t2(DD[f].pl), noDot(t2(DD[f].p))), ok: false };
        play('[data-f="' + f + '"]'); api.say(fbk.text + " " + S.matched(nLinked()));
        return;
      }
      /* second miss on the same problem: the game links the fix that was tried for it and opens its note (0 points) */
      st.link = p; st.by = "game"; st.n = ++linkNo; fixLink[p] = p; selP = selF = null; fbk = { text: S.shown, ok: false };
      play(null);
      api.say(S.shown + " " + S.matched(nLinked()));
      var opener = corkEl.querySelector('[data-f="' + p + '"]');
      openNote(p, opener, '[data-f="' + p + '"]');
    }

    /* "Did it work?": the fix's stamp icon, its stamp words, then its note line. Opening it costs nothing. */
    function openNote(c, opener, focusAfter) {
      var d = DD[c];
      opened[c] = true;
      var pinB = h("span", { "class": "cb-s10-dlgpin", "aria-hidden": "true" }, [icon("pin")]);
      s10dlg(t2(d.f), [h("div", { "class": "cb-s10-note", "data-st": d.st }, [
        h("p", { "class": "cb-s10-note__q" }, [icon("stamp"), h("span", { text: S.check })]),
        h("p", { "class": "cb-s10-note__stamp" }, [stDisc(d.st, "cb-s10-stdisc--big"), h("strong", { text: t2(STAMP[d.st]) })]),
        h("p", { "class": "cb-s10-note__line", text: t2(d.note) })])],
      opener, function () { if (corkEl && corkEl.isConnected) play(nextValid(focusAfter)); }, { sub: t2(d.pl), badge: pinB });
      api.say(S.check + " " + t2(STAMP[d.st]) + ". " + t2(d.note));
    }
    function nextValid(sel) { return sel === '[data-b="check"]' && !(selP && selF) ? null : sel; }

    /* the open problem: three good ideas, none marked best; a badge, no points */
    function openIdeas(opener) {
      var d = OD[openCode], nb = nbOf(openCode), wrap = h("div", { "class": "cb-dlg__body cb-s10-ideas" });
      function drawIdeas(focusI) {
        wrap.innerHTML = "";
        wrap.appendChild(h("p", { "class": "cb-dlg__lead cb-s10-ideas__q" }, [h("span", { "class": "cb-s10-bulb", "aria-hidden": "true" }, [icon("bulb")]), h("span", { text: S.openQ })]));
        wrap.appendChild(h("ul", { "class": "cb-s10-tiles" }, ideaOrder.map(function (i) {
          var on = idea === i;
          return h("li", null, [h("button", { type: "button", "class": "cb-s10-tile", "data-i": String(i), "aria-pressed": on ? "true" : "false",
            "aria-label": t2(d.ideas[i]) + (on ? ". " + S.chosen : ""), onclick: function () { idea = i; drawIdeas(i); api.say(S.nice); } }, [
            h("span", { "class": "cb-s10-tile__ic", "aria-hidden": "true" }, [icon(on ? "check" : "bulb")]), h("span", { "class": "cb-s10-tile__t", text: t2(d.ideas[i]) }),
            on ? chip("chosen", S.chosen) : null])]);
        })));
        if (idea !== null) wrap.appendChild(h("div", { "class": "cb-s10-ideas__fb" }, [api.fb(S.nice, true), h("p", { "class": "cb-s10-ideas__badge" }, [chip("badge", S.badge, "bulb")])]));
        if (focusI !== undefined) { var t = wrap.querySelector('[data-i="' + focusI + '"]'); if (t) t.focus(); }
      }
      drawIdeas();
      s10dlg(t2(d.p), [wrap], opener, function () {
        if (corkEl && corkEl.isConnected) { if (idea !== null) fbk = { text: S.nice, ok: true }; play('[data-p="' + openCode + '"]'); }
      }, { face: nb.img, sub: api.nmCap(nb) });
    }

    /* ── intro: the School, with the "Did it work?" note pinned to the maker-room corkboard ── */
    function intro() {
      var art = api.crop([0.39, 0.235, 0.77], "cb-s10-hero");     // the School on the left, so the pinned note never covers it
      var legend = h("div", { "class": "cb-s10-legend" }, [h("span", { "class": "cb-s10-legend__pin", "aria-hidden": "true" }),
        h("p", { "class": "cb-s10-legend__q" }, [icon("stamp"), h("span", { text: S.check })]),
        h("ul", { "class": "cb-s10-legend__list" }, ST_ORDER.map(function (st) { return h("li", null, [stDisc(st), h("span", { text: t2(STAMP[st]) })]); }))]);
      var go = api.btn(S.start, "cb-btn--go cb-btn--big cb-s10-big cb-s10-start", function () { play(null, true); api.say(S.coach1 + " " + S.matched(0)); }, "go", true);
      api.screen([api.stopHud(stop, null), h("div", { "class": "cb-board cb-s10 cb-s10-intro" }, [
        h("div", { "class": "cb-s10-scene" }, [art, legend]),
        h("div", { "class": "cb-intro cb-s10-intro__text" }, [
          h("p", { "class": "cb-intro__lead", text: S.intro1 }),
          h("p", { "class": "cb-s10-intro__how" }, [h("span", { "class": "cb-s10-intro__ic", "aria-hidden": "true" }, [icon("link")]), h("span", { text: S.intro2 })]),
          h("p", { "class": "cb-s10-intro__how" }, [h("span", { "class": "cb-s10-intro__ic", "aria-hidden": "true" }, [icon("bulb")]), h("span", { text: S.oneOpen })]),
          h("div", { "class": "cb-row" }, [go])])])]);
      api.frame();
    }

    /* ── score: per problem +12 right first link, +6 right second link, 0 when the game shows it,
       +8 if the player opened that right fix's note before linking it. The open problem adds nothing. ── */
    function finish() {
      if (finished) return; finished = true;                     // one save per round, however fast "See my score" is pressed
      var score = 0, linkedUnchecked = false;
      R.probs.forEach(function (c) {
        var st = state[c]; if (st.by !== "player") return;
        score += (st.misses.length ? 6 : 12) + (st.note ? 8 : 0);
        if (!st.note) linkedUnchecked = true;
      });
      var tip = score === 100 ? (idea !== null ? S.tipIdea : S.tip100) : linkedUnchecked ? S.tipCheck : S.tipRead;
      var info = api.saveRound(stop.id, score, { lastRound: R.probs.slice().sort(), lastOpen: openCode });
      api.endPlay();
      if (ro) { ro.disconnect(); ro = null; }
      var sum = summary();
      if (score >= 90 && !REDUCED) sum.classList.add("is-glow");       // 3 stars: the yarn glows once
      var gu = api.btn(S.gu, "cb-btn--quiet cb-s10-big", function () { s10dlg(S.gu, [h("p", { text: S.guText })], gu); }, "family");
      var card = api.scoreCard(stop, score, info, tip, S.can, S.real, sum);
      api.finishRound(stop.id, card, api.cardButtons(stop.id, api.restart(stop.id), gu));
      api.say(api.W.score + " " + score + " / 100");
    }
    function summary() {
      var order = R.probs.slice().sort(function (a, b) { return state[a].n - state[b].n; });
      return h("div", { "class": "cb-s10-sum" }, [
        h("strong", { "class": "cb-s10-sum__h", text: S.look }), countList(countStamps(), "cb-s10-counts cb-s10-counts--card"),
        h("ul", { "class": "cb-s10-recap" }, order.map(function (c) {
          var y = sv("svg", { viewBox: "0 0 64 24", "class": "cb-s10-recap__yarn", "aria-hidden": "true", focusable: "false" });
          y.appendChild(sv("path", { d: "M6 12 C 22 22, 42 2, 58 12", "class": "cb-s10-yarn__base" }));
          y.appendChild(sv("path", { d: "M6 12 C 22 22, 42 2, 58 12", "class": "cb-s10-yarn__hi" }));
          y.appendChild(sv("circle", { cx: "6", cy: "12", r: "4.5", "class": "cb-s10-recap__pin" })); y.appendChild(sv("circle", { cx: "58", cy: "12", r: "4.5", "class": "cb-s10-recap__pin" }));
          return h("li", null, [face(nbOf(c)), y, h("span", { "class": "cb-s10-recap__fix", text: t2(DD[c].f) }), stChip(DD[c].st)]);
        })),
        idea !== null ? h("p", { "class": "cb-s10-sum__badge" }, [chip("badge", S.badge, "bulb"), h("span", { text: t2(OD[openCode].ideas[idea]) })]) : null]);
    }

    intro();
  }
})();
