/* Anonymous playtest feedback: local drafts and explicit, acknowledged sending. */
(function (host) {
  "use strict";
  var KEY = "pecan-grove-feedback-v1", GAME_KEY = "pecan-grove-journey", CONSENT_KEY = "pecan-grove-consent-v1", ERASE_FLAG = "pecan-grove-erase";
  // Files downloaded during the current player's turn (names only), and this device's wrong close-out code tries. The
  // tries key is outside the pecan-grove prefix on purpose: Erase all keeps it, so erasing never buys more guesses.
  var FILES_KEY = "pecan-grove-files-v1", TRIES_KEY = "pg-closeout-tries", CODE_TRIES = 5, CODE_WAIT = 60000;
  var ID = /^[A-Za-z0-9_-]{16,80}$/;
  var RATINGS = ["", "unclear", "okay", "good"], CATEGORIES = ["", "clarity", "bug", "voice", "spanish", "art", "other"];
  function uid(crypto) {
    if (crypto && crypto.randomUUID) return crypto.randomUUID();
    if (crypto && crypto.getRandomValues) {
      var a = new Uint8Array(16); crypto.getRandomValues(a);
      return Array.from(a, function (n) { return n.toString(16).padStart(2, "0"); }).join("");
    }
    return "session-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  }
  function clean(s, max) { return typeof s === "string" ? s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").slice(0, max) : ""; }
  // Children's details beyond contact patterns. Each rule needs a clear cue ("my name is", "years old", "Elementary",
  // a full date or a birthday), so ordinary sentences and the game's own characters stay intact.
  var LETTERS = "A-Za-zÀ-ÖØ-öø-ÿ", WORD = "[" + LETTERS + "][" + LETTERS + "0-9_'’-]*", CAP = "[A-ZÀ-ÖØ-Þ][" + LETTERS + ".'’-]*";
  var MONTHS = "jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?";
  var MESES = "enero|febrero|marzo|abril|mayo|junio|julio|agosto|sep?tiembre|octubre|noviembre|diciembre";
  var AGES = "\\d{1,2}|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen";
  var EDADES = "\\d{1,2}|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|diecis[eé]is|diecisiete|dieciocho";
  // An age can come with a half: "9 1/2", "9½", "9 and a half".
  var AGE = "(?:" + AGES + ")(?:\\s*(?:½|\\.5)|\\s+(?:1\\/2|and a half))?";
  var KIN = "friend|teacher|brother|sister|mom|mum|dad|mother|father|cousin|grandma|grandpa|grandmother|grandfather|step(?:dad|mom|mum|mother|father|brother|sister)|aunt(?:ie)?|uncle";
  // With the diminutives children use: "mi hermanito", "mi abuelita".
  var PARIENTES = "amig(?:uit)?[oa]|maestr[oa]|profe(?:sor|sora)?|herman(?:it|astr)?[oa]|mam[aá]|mami|pap[aá]|papi|padrastro|madrastra|prim(?:it)?[oa]|abuel(?:it)?[oa]|t[ií][oa]";
  // A pet's name can point to a child as well: "my dog Biscuit", "mi perro se llama Toby".
  var PETS = "dog|puppy|cat|kitten|pet|bunny|hamster|horse|bird|parrot|fish|turtle|rabbit";
  var MASCOTAS = "perr[oa]|perrit[oa]|gat[oa]|gatit[oa]|mascota|conej[oa]|h[aá]mster|caballo|p[aá]jaro|loro|pez|tortuga";
  var NAME_STOP = /^(?:a|an|the|and|or|but|so|not|no|very|really|too|kind|sort|like|i|im|i'm|i’m|me|my|you|it|is|was|from|in|at|on|to|of|for|with|also|when|where|what|why|how|who|if|because|after|before|back|up|out|again|stop|stops|y|o|pero|que|muy|mucho|mucha|tanto|un|una|el|la|los|las|lo|de|del|en|con|por|para|al|mi|tu|su|es|era|yo|se|también|cuando|donde|porque|si|parada|paradas|mr|mrs|ms|mx|miss|dr|coach|sr|sra|srta|prof|profe|maestro|maestra)$/i;
  // Lower-case words that end a name after a cue ("my name is sofia garcia" ends nowhere, "jake liked it" ends at liked).
  var NAME_NEXT = /^(?:am|are|were|have|has|had|like[ds]?|love[ds]?|think|thought|play(?:ed|ing|s)?|go|goes|went|got|get|want(?:ed|s)?|did|do|does|said|say|says|made|make|found|saw|see|hope|wish|know|need(?:ed)?|enjoy(?:ed)?|feel|felt|tengo|tiene|tienen|soy|vivo|voy|estoy|está|juego|jugué|jugue|quiero|creo|pienso|siento|te|le|gusta|gustó|gusto|encanta|encantó|fue|hice|hago|dijo|ayudó)$/;
  // Words that say something about the name itself, never a name: "my name is spelled wrong", "mi nombre es importante".
  var NOT_NAME = /^(?:spelled|misspelled|written|wrong|right|missing|shown|printed|listed|correct|incorrect|blank|empty|there|here|important|long|short|hard|weird|funny|cool|ok|okay|fine|same|different|new|cut|hidden|importante|largo|corto|raro|correcto|incorrecto|igual|mal|bien|dif[ií]cil|f[aá]cil|bonito|feo|nuevo|nueva|viejo)$/i;
  // Lower-case words that read as an action or a feeling after "my brother" or "hi im", not as a name.
  var NOT_NAME_LOWER = /^(?:says|thinks|plays|wants|helps|likes|loves|gets|makes|goes|does|is|was|knows|needs|tries|reads|uses|calls|lives|works|came|told|gave|took|ate|eats|ran|runs|sleeps|barks|bit|sat|can|could|will|would|should|might|must|just|always|never|still|that|which|happy|glad|sad|mad|bored|stuck|lost|done|sorry|sure|ready|great|good|awesome|amazing|nice|bad|best|super|easy|dice|dijo|juega|jugo|come|duerme|corre|ladra|quiere|tiene|va|vino|está|esta|son|ayuda|piensa|cree|sabe|vive|siempre|nunca|quien|feliz|triste|list[oa]|genial|divertid[oa]|buen[oa]|incre[ií]ble)$/i;
  function notNameLower(word) { return NAME_STOP.test(word) || NAME_NEXT.test(word) || NOT_NAME.test(word) || NOT_NAME_LOWER.test(word) || /(?:ed|ing|ó|aron|ieron|aba|ando|iendo)$/i.test(word); }
  var NAME_LINK = /^(?:de|del|la|las|los|y|van|von|da|di|le)$/i, UPPER = /^[A-ZÀ-ÖØ-Þ]/;
  // Numbers right after "stop" or "parada" are the game's stops, never a house number or a phone number.
  var AFTER_STOP = /\b(?:stops?|paradas?)\s*(?:#|no\.?|n[uú]m(?:ero)?\.?)?\s*$/i, STOP_LIST = /^\d{1,2}(?:[\s.-]+\d{1,2})*$/;
  function afterStop(all, offset) { return AFTER_STOP.test(all.slice(0, offset)); }
  function scoreList(value) { var parts = value.trim().split(/\s+/); return parts.length >= 3 && parts.every(function (part) { return /^\d{1,3}$/.test(part) && Number(part) <= 100; }); }
  var DATE = "(?:(?:" + MONTHS + ")\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?(?:,?\\s+\\d{4})?\\b|\\d{1,2}(?:st|nd|rd|th)?\\s+(?:of\\s+)?(?:" + MONTHS + ")\\b\\.?(?:,?\\s+\\d{4})?|(?:el\\s+)?\\d{1,2}\\s+de\\s+(?:" + MESES + ")(?:\\s+del?\\s+\\d{4})?\\b|\\d{1,2}[\\/.-]\\d{1,2}(?:[\\/.-]\\d{2,4})?\\b|\\d{4}\\b|(?:" + MONTHS + "|" + MESES + ")\\b)";
  var CHILD_RULES = [
    // Full dates with a year: 3/14/2015, March 14, 2015, 14 de marzo de 2015.
    [/\b\d{1,2}[/.-]\d{1,2}[/.-](?:\d{4}|\d{2})\b/g],
    [new RegExp("\\b(?:" + MONTHS + ")\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?,?\\s+\\d{4}\\b|\\b\\d{1,2}(?:st|nd|rd|th)?\\s+(?:of\\s+)?(?:" + MONTHS + ")\\.?,?\\s+\\d{4}\\b|\\b\\d{1,2}\\s+de\\s+(?:" + MESES + ")\\s+del?\\s+\\d{4}\\b", "gi")],
    // A birthday or birth date after its cue, even without a year.
    [new RegExp("(\\b(?:born|birthday|b-?day|date of birth|dob|nac[ií]|cumpleaños|fecha de nacimiento)(?:\\s+(?:is|es|on|in|el|en)){0,2}\\s*:?\\s*)" + DATE, "gi"), 1],
    // Ages: "I am 9", "I'm nine years old", "9-year-old", "age 9", "tengo 9 años", "9 años de edad".
    [new RegExp("(\\b(?:i am|i'm|i’m|im|i turned|i just turned)\\s+)" + AGE + "(?:\\s*(?:years?|yrs?)(?:\\s*old)?)?(?=\\s*(?:and\\b|but\\b|[,.!?;:)]|$))", "gim"), 1],
    [new RegExp("\\b" + AGE + "(?:\\s+|-)(?:years?|yrs?)(?:\\s+|-)old\\b|\\b\\d{1,2}\\s*y\\/o\\b", "gi")],
    [/(\b(?:age|aged|edad)\s*:?\s*)\d{1,2}\b/gi, 1],
    [new RegExp("(\\b(?:ya\\s+)?(?:tengo|cumpl[ií])\\s+)(?:" + EDADES + ")\\s+años(?:\\s+y\\s+medio)?(?:\\s+de\\s+edad)?", "gi"), 1],
    [new RegExp("\\b(?:" + EDADES + ")\\s+años\\s+de\\s+edad", "gi")],
    // Schools with a name: "Pecan Elementary", "Oak Middle School", "Escuela Primaria Benito Juárez".
    [new RegExp("\\b(?!(?:The|A|An|My|Our|This|That|Your|Their|His|Her|In|At|High|Middle|Elementary|Junior|School|Academy)\\s)(?:" + CAP + "\\s+){1,3}(?:(?:Elementary|Middle|High|Intermediate|Primary|Junior High|Charter|Magnet|Montessori)\\s+School|Elementary|Academy|School)\\b", "g")],
    [new RegExp("\\b(?:[Ee]scuela|[Cc]olegio|[Ii]nstituto|[Ll]iceo|[Aa]cademia|[Pp]rimaria|[Ss]ecundaria)(?:\\s+(?:[Pp]rimaria|[Ss]ecundaria|[Pp][uú]blica|[Pp]rivada|[Tt][eé]cnica|[Nn][uú]mero|[Nn]o\\.?|de|del|la|el)){0,3}\\s+(?:" + CAP + "|\\d{1,4})(?:\\s+(?:(?:de|del|de la|la|los|las|y)\\s+)?" + CAP + "){0,3}", "g")]
  ];
  // A name after a clear cue: every word up to the punctuation, an everyday word or four words, capitalized or not.
  var NAME_CUE = new RegExp("(\\b(?:(?:my name(?:'s|’s|\\s+is)|my names is|i am called|i'm called|i’m called|im called|they call me|my (?:best )?(?:" + KIN + "|" + PETS + ")(?:(?:'s|’s) name is|\\s+is (?:named|called))|me llamo|mi nombre es|me dicen|me llaman|mi (?:mejor )?(?:" + PARIENTES + "|" + MASCOTAS + ") se llama|el nombre de mi (?:mejor )?(?:" + PARIENTES + "|" + MASCOTAS + ") es)\\s*:?\\s+|(?:my |first |last |full |mi )?(?:name|nombre)\\s*:\\s*)(?:(?:mr|mrs|ms|miss|dr|coach|sr|sra|srta|profe|maestr[oa])\\.?\\s+)?)(" + WORD + "(?:\\s+" + WORD + "){0,3})", "gi");
  function scrubNames(text, removed) {
    // The four-word window can reach the next cue ("me llamo Sofia y mi hermano se llama Diego"). Only the name is
    // replaced, and the search goes on right after it, so the next cue and its name are found in the same pass.
    var out = "", at = 0, match;
    NAME_CUE.lastIndex = 0;
    while ((match = NAME_CUE.exec(text))) {
      var start = match.index + match[1].length, parts = match[2].split(/(\s+)/), tokens = parts.filter(function (_, i) { return i % 2 === 0; }), count = 1;
      if (NAME_STOP.test(tokens[0]) || NOT_NAME.test(tokens[0])) { NAME_CUE.lastIndex = start; continue; }
      while (count < tokens.length) {
        // "María de la Cruz": linking words belong to the name only when another name word follows them.
        var link = count;
        while (link < tokens.length && NAME_LINK.test(tokens[link])) link++;
        if (link >= tokens.length || NAME_STOP.test(tokens[link]) || NAME_NEXT.test(tokens[link])) break;
        count = link + 1;
      }
      out += text.slice(at, start) + removed; at = start + parts.slice(0, count * 2 - 1).join("").length; NAME_CUE.lastIndex = at;
    }
    return out + text.slice(at);
  }
  function scrubPII(text, language) {
    // Send scrubs again what the grown-up read, so a second scrub must change nothing. A pass that removed something
    // runs again, a few times at most, until nothing changes; that also keeps the note within the saved length.
    var removed = language === "es" ? "[quitado]" : "[removed]", before = clean(text, 1200), after = scrubOnce(before, removed);
    for (var pass = 1; pass < 5 && after !== before; pass++) { before = clean(after, 1200); after = scrubOnce(before, removed); }
    return after;
  }
  function scrubOnce(text, removed) {
    var scrubbed = text
      .replace(/(?:https?:\/\/|www\.)[^\s<>]+/gi, removed)
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, removed)
      .replace(/\b\d{1,6}\s+(?:calle|avenida|carrera|camino|paseo|carretera)\s+(?:[A-Za-zÀ-ÿ.'-]+(?:[ \t]+|$)){1,4}/gi, function (value, offset, all) { return afterStop(all, offset) ? value : removed; })
      // A street name is not made of everyday words: "2 was a good way" and "3 kids on the street" stay.
      .replace(/\b\d{1,6}\s+(?:(?!(?:the|a|an|and|or|but|of|on|in|at|to|for|with|from|by|was|were|is|are|it|my|our|your|this|that|same|el|la|los|las|un|una|y|en|es|fue|con|por)\s)[A-Za-zÀ-ÿ.'-]+\s+){0,4}(?:street|st|road|rd|avenue|ave|lane|ln|drive|dr|boulevard|blvd|way|court|ct|calle|avenida|av|carrera|camino|paseo|carretera)\b(?:\s+(?:apt|unit|piso|n[oú]mero)\.?\s*[A-Za-z0-9-]+)?/gi, function (value, offset, all) { return afterStop(all, offset) ? value : removed; })
      .replace(/\b(?:calle|avenida|carrera|camino|paseo|carretera)\s+(?:[A-Za-zÀ-ÿ.'-]+\s+){0,4}\d{1,6}\b/gi, function (value) { return afterStop(value, value.search(/\d+$/)) ? value : removed; })
      // An apartment or suite number, also after a direction such as "Rd NE apt 5".
      .replace(/\b(?:apt|apartment|suite|ste|depto|departamento|apartamento|apto)\.?\s*(?:#|no\.?|n[uú]m(?:ero)?\.?)?\s*\d{1,5}[A-Za-z]?\b/gi, removed)
      // A list of scores ("100 90 80 70") is not a phone number: every part is a number up to 100.
      .replace(/(?:\+?\d|\(\d)[\d\s().-]{5,}\d/g, function (value, offset, all) { return value.replace(/\D/g, "").length >= 7 && !(afterStop(all, offset) && STOP_LIST.test(value)) && !scoreList(value) ? removed : value; })
      // A Discord tag ("coolkid#1234") is a contact handle like "@sam".
      .replace(/(^|[^A-Za-z0-9_])[A-Za-z0-9_.]{2,32}#\d{4}\b/g, function (_, prefix) { return prefix + removed; })
      .replace(/(^|[^A-Za-z0-9_])@[A-Za-z0-9_.-]{1,50}/g, function (_, prefix) { return prefix + removed; });
    CHILD_RULES.forEach(function (rule) {
      scrubbed = scrubbed.replace(rule[0], function (match, cue) { return (rule[1] ? cue : "") + removed; });
    });
    return scrubNames(scrubbed, removed);
  }
  // Words the scrubber leaves but a grown-up should still check. The game's own characters, animals, town and stops
  // are not flagged.
  var CAST = /^(?:ana|patel|lee|johnson|ruth|jayden|fox|owl|turtle|rabbit|deer|heron|bee|otter|zorro|búho|buho|tortuga|conejo|venado|garza|abeja|nutria|pecan|grove|georgia|stops?|paradas?)$/i;
  // A lower-case "miss" is a title only before a possessive: "miss okafor's class", not "I miss playing".
  var TITLED = /\b(?:[Mm]rs?|[Mm][sx]|Miss|miss(?=\s+[A-Za-zÀ-ÖØ-öø-ÿ-]+['’]s\b)|[Dd]r|Coach|[Ss]ra?|[Ss]rta|[Pp]rofe?|[Mm]aestr[oa]|[Ss]eñor(?:a|ita)?|[Dd]oña|Don)\.?\s+([A-Za-zÀ-ÖØ-öø-ÿ'’-]+)/g;
  var CHECK_WORDS = /\b(?:school|teacher|birthday|born|years old|my name|name is|live on|live at|escuela|colegio|maestr[oa]|profe(?:sor|sora)?|cumpleaños|nac[ií]|me llamo|mi nombre|vivo en)(?![A-Za-zÀ-ÖØ-öø-ÿ])/gi;
  // Capitalized words the scrubber cannot tell from ordinary ones: after "I'm", "soy", "this is" or "es", after a
  // relative or a friend, and in a sign-off ("-Emma", "Gracias, Valentina").
  var FEW = WORD + "(?:\\s+" + WORD + "){0,2}";
  var INTRO = new RegExp("\\b(?:i['’]?m|i am|this is|it['’]?s me,?|soy|es)\\s+(" + FEW + ")", "gi");
  // After a greeting (also "hey guys"), "im" or "soy" introduces a name even in lower case: "hi im maya lopez", "hola
  // soy valentina". So do "its me" and "this is from" on their own: "yo its me jackson", "this is from harper".
  var GREETING = new RegExp("\\b(?:(?:hi|hello|hey|hiya|howdy|yo|sup|hola|buenas|buenos d[ií]as)\\b[\\s,!.]*(?:(?:guys|all|everyone|everybody|there|friends|team|chicos|chicas|amigos|amigas|todos|todas)\\b[\\s,!.]*)?(?:i['’]?m|i am|im|this is|it['’]?s me,?|it['’]?s|soy|es)|it['’]?s me,?|(?:this is|it['’]?s) from)\\s+(" + FEW + ")", "gi");
  var KIN_NAME = new RegExp("\\b(" + KIN + "|" + PARIENTES + ")s?\\s+(" + FEW + ")", "gi");
  // "my little brother noah", "her twin sister lily", "mi hermano luis", "my dog Biscuit": after "my", "her" or "mi",
  // a lower-case name is flagged too.
  var MY_KIN = new RegExp("\\b(?:my|our|his|her|their|mi|mis|su|sus|nuestr[oa]s?)\\s+(?:(?:little|big|older|younger|baby|best|twin|step|new|old|peque[ñn][oa]|mayor|menor|mejor)\\s+)?(" + KIN + "|" + PETS + "|" + PARIENTES + "|" + MASCOTAS + ")\\s+(" + FEW + ")", "gi");
  // A sign-off ("-Emma", "Gracias, Valentina"). The lookahead lets "love it bye Liam" find its last sign-off too.
  var SIGN_OFF = new RegExp("(?:^|[\\s.!?,])(?=([-–—~]+\\s*|(?:thanks|thank you|thx|love|sincerely|from|by|bye|cheers|gracias|saludos|atentamente|besos|abrazos|con cariño|de parte de)\\s*,?\\s+)(" + FEW + ")(\\s*(?:[,.!?()]|$)))", "gim");
  var SIGN_OFF_LOWER = /^(?:[-–—~]+\s*|(?:from|by|bye|love|de parte de)\s+)$/i;
  var EVERYDAY = /^(?:you|all|everyone|everybody|now|kids|us|them|team|game|games|everything|fun|lots|lot|much|later|today|soon|friends|guys|todos|todas|ustedes|ti|juego|equipo|pronto|luego|hoy)$/i;
  // A social handle after its app ("my snap is mayal22", "add me on roblox: kid22"), and a school written in lower case
  // ("lincoln elementary") or without "School" ("Dickerson Middle", "Pope High").
  var HANDLE = /\b(?:my|mi|(?:add|follow|friend|find|message|dm)\s+me\s+on|ag?r[eé]game\s+en|s[ií]gueme\s+en|b[uú]scame\s+en)\s+(?:snap(?:chat)?|insta(?:gram)?|ig|tik ?tok|discord|roblox|fortnite|minecraft|xbox|psn|twitch|youtube|yt|gamertag|username|user name|usuario|nombre de usuario)(?:\s+(?:name|username|user|handle|id|tag|account|cuenta))?(?:\s+(?:is|es)|\s*[:=])?\s+([A-Za-z0-9_.]{2,30})/gi;
  var SCHOOL_NAME = new RegExp("\\b((?:" + WORD + "\\s+){1,3})(elementary|middle school|high school|primary school|academy)\\b(?:\\s+in\\s+(" + WORD + "))?", "gi");
  var SCHOOL_SHORT = /\b([A-ZÀ-ÖØ-Þ][A-Za-zÀ-ÖØ-öø-ÿ'’-]+)\s+(Middle|High|Elementary|Intermediate|Primary)\b(?!\s+[Ss]chool)/g;
  var REMOVED_TOWN = /\[(?:removed|quitado)\]\s+(?:in|en)\s+([A-ZÀ-ÖØ-Þ][A-Za-zÀ-ÖØ-öø-ÿ'’-]+)/g;
  function capitalized(words) {
    // A real surname or second name after a game character's first name still counts: "Jayden Smith", "Ana Sofia".
    var names = [];
    words.split(/\s+/).every(function (word) { var ok = UPPER.test(word) && !NAME_STOP.test(word); if (ok) names.push(word); return ok; });
    return names.every(function (word) { return CAST.test(word); }) ? "" : names.join(" ");
  }
  function lowerName(words) {
    // Up to two words that read as a name, not as an action, a feeling or one of the game's own words.
    var names = [];
    words.split(/\s+/).slice(0, 2).every(function (word) { var ok = !notNameLower(word) && !CAST.test(word) && !EVERYDAY.test(word); if (ok) names.push(word); return ok; });
    return names.join(" ");
  }
  function privacyFlags(text) {
    var found = [];
    function add(value) { value = value.replace(/\s+/g, " ").trim(); if (value && found.every(function (f) { return f.toLowerCase().indexOf(value.toLowerCase()) === -1; })) found.push(value); }
    String(text || "").replace(TITLED, function (match, name) { name = name.replace(/['’]s$/i, ""); if (!CAST.test(name) && !NAME_STOP.test(name)) add(match); return match; });
    String(text || "").replace(INTRO, function (match, words) { add(capitalized(words)); return match; });
    String(text || "").replace(GREETING, function (match, words) { add(capitalized(words) || lowerName(words)); return match; });
    String(text || "").replace(KIN_NAME, function (match, kin, words) { var name = capitalized(words); if (name) add(kin + " " + name); return match; });
    String(text || "").replace(MY_KIN, function (match, kin, words) { var name = capitalized(words) || lowerName(words); if (name) add(kin + " " + name); return match; });
    String(text || "").replace(SIGN_OFF, function (match, cue, words, end, offset, all) {
      var name = capitalized(words);
      // A lower-case sign-off name counts only at the very end: "thanks, from ava r." but not "made by kids at stop 2".
      if (!name && SIGN_OFF_LOWER.test(cue) && /^\s*[.!?]*\s*$/.test(all.slice(offset + match.length + cue.length + words.length))) name = lowerName(words) === words.split(/\s+/).slice(0, 2).join(" ") ? lowerName(words) : "";
      if (name === words.replace(/\s+/g, " ")) add(name);
      return match;
    });
    String(text || "").replace(HANDLE, function (match, handle) { if (!NAME_STOP.test(handle)) add(handle); return match; });
    String(text || "").replace(SCHOOL_SHORT, function (match, name, kind) { if (!NAME_STOP.test(name) && !CAST.test(name)) add(name + " " + kind); return match; });
    String(text || "").replace(REMOVED_TOWN, function (match, town) { if (!NAME_STOP.test(town) && !CAST.test(town)) add(town); return match; });
    String(text || "").replace(SCHOOL_NAME, function (match, words, kind, town) {
      // Only the words right before "elementary" name it: "at lincoln elementary" flags "lincoln elementary", and the
      // town after it ("in marietta") is flagged too.
      var name = [], list = words.trim().split(/\s+/);
      while (list.length && !NAME_STOP.test(list[list.length - 1])) name.unshift(list.pop());
      if (name.length) add(name.join(" ") + " " + kind);
      if (town && !NAME_STOP.test(town) && !CAST.test(town) && !EVERYDAY.test(town)) add(town);
      return match;
    });
    String(text || "").replace(CHECK_WORDS, function (match, offset, all) {
      // A cue whose detail was already removed, or a word inside a flagged name, adds nothing to check.
      var removedNext = /^\s*(?:is|es|:)?\s*\[(?:removed|quitado)\]/i.test(all.slice(offset + match.length));
      if (!removedNext && found.every(function (f) { return f.toLowerCase().indexOf(match.toLowerCase()) === -1; })) add(match);
      return match;
    });
    return found.slice(0, 8);
  }
  function hasContent(e) { return !!(e && (e.rating || e.category || (e.worked || "").trim() || (e.fix || "").trim())); }
  function received(e) { return !!(e && e.submitted && (e.ackRevision || 0) >= e.revision); }
  function readConsent(storage, sessionId) {
    try {
      var value = JSON.parse(storage.getItem(CONSENT_KEY) || "null");
      if (value && value.sessionId === sessionId && value.scores === true) return { scores: true, autoScores: value.autoScores === true, at: value.at, build: value.build, sessionId: sessionId };
    } catch (_) { /* A damaged or unavailable preference never grants consent. */ }
    return { scores: false, autoScores: false, at: "", build: "", sessionId: sessionId };
  }
  function validEntry(e) {
    return e && ID.test(e.sessionId) && ID.test(e.entryId) && Number.isInteger(e.revision) && e.revision > 0 &&
      Number.isFinite(Date.parse(e.updatedAt)) && typeof e.build === "string" && e.build.length <= 40 && ["feedback", "progress", "session"].indexOf(e.kind) !== -1 &&
      Number.isInteger(e.stop) && e.stop >= 0 && e.stop <= 15 && ["en", "es"].indexOf(e.language) !== -1 &&
      RATINGS.indexOf(e.rating) !== -1 && CATEGORIES.indexOf(e.category) !== -1 &&
      typeof e.worked === "string" && e.worked.length <= 1200 && typeof e.fix === "string" && e.fix.length <= 1200 && (e.submitted === undefined || typeof e.submitted === "boolean");
  }
  function readState(storage) {
    try {
      var raw = storage.getItem(KEY);
      if (!raw) return { state: null, warning: "" };
      var s = JSON.parse(raw);
      if (!s || s.schemaVersion !== 1 || !ID.test(s.activeSession) || !Array.isArray(s.entries)) throw Error("invalid saved feedback");
      // One unrecognised entry must not start a new player and hide the game: keep the player and
      // the valid entries, and return the original text so it is kept as a recovery copy.
      var valid = s.entries.filter(validEntry);
      valid.forEach(function (e) { e.submitted = e.submitted === true; });
      var damaged = valid.length !== s.entries.length; s.entries = valid;
      return { state: s, warning: "", recovery: damaged ? raw : null };
    } catch (e) { return { state: null, warning: "storage", recovery: typeof raw === "string" ? raw : null }; }
  }
  function mergeEntries(a, b) {
    var map = new Map();
    a.concat(b).forEach(function (e) {
      var key = e.sessionId + ":" + e.entryId, old = map.get(key);
      var newer = !old || e.revision > old.revision || (e.revision === old.revision && (e.updatedAt > old.updatedAt || (e.updatedAt === old.updatedAt && JSON.stringify(payload(e)) > JSON.stringify(payload(old)))));
      var chosen = newer ? e : old;
      var matching = !old || old.revision !== e.revision || JSON.stringify(payload(old)) === JSON.stringify(payload(e));
      chosen = Object.assign({}, chosen, { ackRevision: matching ? Math.max(old && old.ackRevision || 0, e.ackRevision || 0) : (chosen.ackRevision || 0) });
      map.set(key, chosen);
    });
    return Array.from(map.values());
  }
  function createModel(options) {
    var storage = options.storage, now = options.now || function () { return new Date().toISOString(); }, makeId = options.id || function () { return uid(host.crypto); };
    var loaded = readState(storage), state = loaded.state || { schemaVersion: 1, activeSession: makeId(), entries: [] };
    state.stationId = ID.test(state.stationId || "") ? state.stationId : makeId();
    // Old queued drafts have no explicit submission and remain local after migration.
    state.entries.forEach(function (e) { e.submitted = e.submitted === true; });
    var warning = loaded.warning, changedSession = false, fresh = !loaded.state && !loaded.warning, recovery = !!loaded.recovery || !!state.recoveryAvailable, recoveryBlocked = false;
    // False until this player is on the device: with blocked site data nothing is ever saved, and a reload starts over.
    var saved = !!loaded.state;
    if (recovery) state.recoveryAvailable = true;
    function keepRecovery(raw) {
      try {
        var earlierRecovery = storage.getItem(KEY + "-recovery");
        if (!earlierRecovery) storage.setItem(KEY + "-recovery", raw);
        else if (earlierRecovery !== raw) storage.setItem(KEY + "-recovery-" + makeId(), raw);
        return true;
      }
      catch (e) { recoveryBlocked = true; return false; }
    }
    if (loaded.recovery) keepRecovery(loaded.recovery);
    function active() { return state.activeSession; }
    function entries(all) { return state.entries.filter(function (e) { return all || e.sessionId === active(); }); }
    function find(kind, stop) { return entries().find(function (e) { return e.kind === kind && e.stop === stop; }); }
    function persist(forceSession) {
      if (recoveryBlocked) { warning = "storage"; return false; }
      var disk = readState(storage);
      if (disk.state) {
        if (disk.state.activeSession !== active() && !forceSession) { changedSession = true; return false; }
        // Entries this version cannot read (written by another tab) are copied aside before saving over them.
        if (disk.recovery && !keepRecovery(disk.recovery)) { warning = "storage"; return false; }
        state.entries = mergeEntries(disk.state.entries, state.entries);
      }
      try { storage.setItem(KEY, JSON.stringify(state)); warning = ""; saved = true; return true; }
      catch (e) { warning = "storage"; return false; }
    }
    function archive() {
      var disk = readState(storage);
      if (recoveryBlocked || !disk.state || (disk.recovery && !keepRecovery(disk.recovery))) { warning = "storage"; return false; }
      state.entries = mergeEntries(disk.state.entries, state.entries);
      if (disk.state.activeSession === active()) return persist();
      changedSession = true;
      try {
        storage.setItem(KEY, JSON.stringify(Object.assign({}, disk.state, { entries: state.entries })));
        warning = ""; return true;
      } catch (e) { warning = "storage"; return false; }
    }
    function upsert(kind, stop, fields, allowArchive) {
      var disk = readState(storage);
      if (disk.state) {
        if (disk.state.activeSession !== active()) { changedSession = true; if (!allowArchive) return null; }
        state.entries = mergeEntries(disk.state.entries, state.entries);
      }
      stop = Math.max(0, Math.min(15, Number(stop) || 0));
      var old = find(kind, stop), stamp = now();
      var e = Object.assign({ sessionId: active(), stationId: state.stationId, entryId: makeId(), revision: 0, createdAt: stamp, updatedAt: stamp,
        language: options.language === "es" ? "es" : "en", build: clean(options.build, 40), kind: kind, stop: stop,
        rating: "", category: "", worked: "", fix: "", score: null, phase: "", ackRevision: 0, submitted: false }, old || {});
      fields = fields || {};
      var next = { language: fields.language === "es" ? "es" : (fields.language === "en" ? "en" : e.language),
        rating: RATINGS.indexOf(fields.rating) !== -1 ? fields.rating : e.rating,
        category: CATEGORIES.indexOf(fields.category) !== -1 ? fields.category : e.category,
        worked: fields.worked === undefined ? e.worked : clean(fields.worked, 1200), fix: fields.fix === undefined ? e.fix : clean(fields.fix, 1200),
        score: fields.score === undefined ? e.score : (Number.isFinite(fields.score) ? Math.round(Math.max(0, Math.min(100, fields.score))) : null),
        phase: fields.phase === undefined ? e.phase : clean(fields.phase, 40), sessionEnded: fields.sessionEnded === undefined ? !!e.sessionEnded : !!fields.sessionEnded };
      if (old && Object.keys(next).every(function (k) { return next[k] === old[k]; })) return old;
      Object.assign(e, next, { revision: e.revision + 1, updatedAt: stamp, submitted: false });
      state.entries = state.entries.filter(function (x) { return x.entryId !== e.entryId || x.sessionId !== e.sessionId; });
      state.entries.push(e); if (changedSession && allowArchive) archive(); else persist(); return e;
    }
    function submit(entryId, includeScores) {
      var current = entries().find(function (e) { return e.entryId === entryId && e.kind === "feedback"; });
      if (current) {
        current = upsert("feedback", current.stop, { worked: scrubPII(current.worked, current.language), fix: scrubPII(current.fix, current.language) });
        if (!current) return false;
      }
      entries().forEach(function (e) {
        if ((current && e.entryId === current.entryId) || e.kind === "session" || (includeScores && e.kind === "progress")) e.submitted = true;
      });
      return persist();
    }
    function submitProgress(stop) {
      var entry = find("progress", stop); if (!entry) return false;
      entry.submitted = true; return persist();
    }
    function withdrawScores(later) {
      var withdrawn = entries().filter(function (e) { return e.kind === "progress" && e.submitted && (e.ackRevision || 0) < e.revision; });
      withdrawn.forEach(function (e) { e.submitted = false; e.revision++; e.updatedAt = now(); });
      // From a storage event the next save stores this, so the event itself never writes.
      return later || !withdrawn.length ? true : persist();
    }
    function refresh() {
      // Read another tab's change without writing. A write here could put back the old player
      // while another tab is starting a new one.
      var disk = readState(storage);
      if (!disk.state) return false;
      if (disk.state.activeSession !== active()) { changedSession = true; return false; }
      state.entries = mergeEntries(disk.state.entries, state.entries);
      return true;
    }
    function acknowledge(list, snapshots) {
      var count = 0;
      (Array.isArray(list) ? list : []).forEach(function (ack) {
        state.entries.forEach(function (e) {
          var matches = !snapshots || snapshots.some(function (s) { return JSON.stringify(s) === JSON.stringify(payload(e)); });
          if (matches && ack && ack.sessionId === e.sessionId && ack.entryId === e.entryId && Number.isInteger(ack.revision) && ack.revision === e.revision) {
            e.ackRevision = Math.max(e.ackRevision || 0, e.revision); count++;
          }
        });
      });
      if (count) persist(); return count;
    }
    function rotate() {
      if (changedSession || warning) return null;
      upsert("session", 0, { sessionEnded: true });
      if (changedSession || warning) return null;
      // The next player also gets a new random device code, so no field links two children on one computer.
      var previous = state.activeSession, station = state.stationId;
      state.activeSession = makeId(); state.stationId = makeId(); state.previousSession = { id: previous, at: now() }; changedSession = false;
      if (!persist(true)) { state.activeSession = previous; state.stationId = station; delete state.previousSession; return null; }
      upsert("session", 0, { phase: "start" }); return active();
    }
    function previousPlayer() {
      var p = state.previousSession;
      return p && ID.test(p.id || "") && p.id !== active() && Number.isFinite(Date.parse(p.at)) ? { id: p.id, at: p.at } : null;
    }
    function forgetPrevious() {
      if (!state.previousSession) return true;
      delete state.previousSession; return persist();
    }
    function restore(id) {
      // The facilitator's close-out brings back an earlier player, for a Next player chosen by mistake. The player
      // playing now ends and stays saved on this device.
      if (changedSession || warning || !ID.test(id || "") || id === active()) return null;
      var disk = readState(storage);
      if (disk.state) {
        if (disk.state.activeSession !== active()) { changedSession = true; return null; }
        state.entries = mergeEntries(disk.state.entries, state.entries);
      }
      if (!state.entries.some(function (e) { return e.sessionId === id; })) return null;
      upsert("session", 0, { sessionEnded: true });
      if (changedSession || warning) return null;
      var current = active(), station = state.stationId, previous = state.previousSession, earlier = state.entries.find(function (e) { return e.sessionId === id && ID.test(e.stationId || ""); });
      state.activeSession = id; state.stationId = earlier ? earlier.stationId : makeId(); delete state.previousSession;
      if (!persist(true)) { state.activeSession = current; state.stationId = station; if (previous) state.previousSession = previous; return null; }
      upsert("session", 0, { sessionEnded: false }); return active();
    }
    function unsubmit(target) {
      var e = state.entries.find(function (x) { return x.sessionId === target.sessionId && x.entryId === target.entryId; });
      if (!e || !e.submitted) return false;
      // A new local revision, so merging with the saved copy cannot restore the submission.
      e.submitted = false; e.revision++; e.updatedAt = now(); return persist();
    }
    function waiting() {
      // Every player's notes the playtest team has not received, as the close-out list shows them: scrubbed.
      return state.entries.filter(function (e) { return e.kind === "feedback" && hasContent(e) && !received(e); }).map(function (e) {
        return { sessionId: e.sessionId, entryId: e.entryId, revision: e.revision, worked: scrubPII(e.worked, e.language), fix: scrubPII(e.fix, e.language) };
      });
    }
    function submitAll(includeScores, reviewed) {
      // A grown-up read the listed notes at once. Only a note still exactly as listed is sent: one written or changed
      // after the list was shown, in this tab or another, stays a local draft. Scrub each one as the single-note preview does.
      var disk = readState(storage);
      if (disk.state) {
        if (disk.state.activeSession !== active()) { changedSession = true; return 0; }
        state.entries = mergeEntries(disk.state.entries, state.entries);
      }
      var stamp = now(), sessions = new Set(), count = 0;
      state.entries.forEach(function (e) {
        if (e.kind !== "feedback" || !hasContent(e) || received(e)) return;
        var worked = scrubPII(e.worked, e.language), fix = scrubPII(e.fix, e.language);
        var read = (Array.isArray(reviewed) ? reviewed : []).some(function (r) { return r && r.sessionId === e.sessionId && r.entryId === e.entryId && r.revision === e.revision && r.worked === worked && r.fix === fix; });
        if (!read) return;
        if (worked !== e.worked || fix !== e.fix) { e.worked = worked; e.fix = fix; e.revision++; e.updatedAt = stamp; }
        e.submitted = true; sessions.add(e.sessionId); count++;
      });
      state.entries.forEach(function (e) {
        // Earlier players' scores stay local: their score-sharing choice ended with their session.
        if ((e.kind === "session" && sessions.has(e.sessionId)) || (includeScores && e.kind === "progress" && e.sessionId === active())) { if (!received(e)) e.submitted = true; }
      });
      return persist() ? count : 0;
    }
    function players(all) {
      // With all, also the players who left no notes: the facilitator's close-out can bring any of them back.
      var map = new Map();
      state.entries.forEach(function (e) {
        var p = map.get(e.sessionId) || { sessionId: e.sessionId, updatedAt: "", notes: [] };
        if (e.updatedAt > p.updatedAt) p.updatedAt = e.updatedAt;
        if (e.kind === "feedback" && hasContent(e)) p.notes.push(e);
        map.set(e.sessionId, p);
      });
      return Array.from(map.values()).filter(function (p) { return all || p.notes.length || p.sessionId === active(); })
        .sort(function (a, b) { return (b.sessionId === active()) - (a.sessionId === active()) || b.updatedAt.localeCompare(a.updatedAt); });
    }
    function resolveConflicts(list) {
      var disk = readState(storage);
      if (disk.state) {
        if (disk.state.activeSession !== active()) { changedSession = true; return 0; }
        state.entries = mergeEntries(disk.state.entries, state.entries);
      }
      var count = 0;
      (Array.isArray(list) ? list : []).forEach(function (conflict) {
        state.entries.forEach(function (e) {
          if (conflict && conflict.sessionId === e.sessionId && conflict.entryId === e.entryId && Number.isInteger(conflict.revision) && conflict.revision >= 1 && (e.ackRevision || 0) < e.revision) {
            e.revision = Math.max(e.revision, conflict.revision) + 1; e.updatedAt = now(); count++;
          }
        });
      });
      if (count) persist(); return count;
    }
    return { active: active, entries: entries, find: find, upsert: upsert, persist: persist, refresh: refresh, archive: archive, acknowledge: acknowledge, rotate: rotate,
      stash: function (kind, stop, fields) { return upsert(kind, stop, fields, true); },
      previousPlayer: previousPlayer, forgetPrevious: forgetPrevious, restore: restore, unsubmit: unsubmit, waiting: waiting, submitAll: submitAll, players: players,
      resolveConflicts: resolveConflicts, submit: submit, submitProgress: submitProgress, withdrawScores: withdrawScores,
      pending: function (all) { return entries(!!all).filter(function (e) { return e.submitted === true && (e.ackRevision || 0) < e.revision; }); },
      warning: function () { return warning; }, saved: function () { return saved; }, changedSession: function () { return changedSession; }, fresh: fresh, recovery: recovery,
      storageFailed: function () { warning = "storage"; } };
  }
  function payload(e) {
    var out = {};
    ["sessionId", "stationId", "entryId", "revision", "createdAt", "updatedAt", "language", "build", "kind", "stop", "rating", "category", "worked", "fix", "score", "phase", "sessionEnded", "submitted"].forEach(function (k) { out[k] = e[k]; });
    return out;
  }
  function endpointAllowed(url) { return /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url || ""); }
  async function sendBatch(model, endpoint, fetcher, signal, all) {
    if (!endpointAllowed(endpoint)) throw Error("No configured feedback endpoint");
    var batch = [], sent = [], encoder = new TextEncoder(), station = null;
    // Another page on this shared origin could queue raw text. Only text that already passed the preview scrub
    // may leave; anything else goes back to being a local draft for a grown-up to review.
    model.pending(all).forEach(function (e) {
      if (e.kind === "feedback" && (scrubPII(e.worked, e.language) !== e.worked || scrubPII(e.fix, e.language) !== e.fix)) model.unsubmit(e);
    });
    model.pending(all).some(function (e) {
      // The collector accepts one device code per request.
      if (station === null) station = e.stationId || "";
      if ((e.stationId || "") !== station) return false;
      var item = payload(e), candidate = sent.concat([item]);
      if (candidate.length > 20 || encoder.encode(JSON.stringify({ schemaVersion: 1, entries: candidate })).length > 58000) return true;
      batch.push(e); sent.push(item); return false;
    });
    if (!batch.length) return 0;
    var response = await fetcher(endpoint, { method: "POST", mode: "cors", credentials: "omit", redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=UTF-8" }, body: JSON.stringify({ schemaVersion: 1, entries: sent }), signal: signal });
    if (!response.ok) throw Error("Backup did not accept the request");
    var body = await response.json();
    if (!body || body.ok !== true || body.schemaVersion !== 1 || !Array.isArray(body.acknowledged)) throw Error("Backup confirmation missing");
    var ack = body.acknowledged.filter(function (a) { return sent.some(function (e) { return a && a.sessionId === e.sessionId && a.entryId === e.entryId && a.revision === e.revision; }); });
    var count = model.acknowledge(ack, sent);
    var conflicts = (Array.isArray(body.conflicts) ? body.conflicts : []).filter(function (a) { return sent.some(function (e) { return a && a.sessionId === e.sessionId && a.entryId === e.entryId; }); });
    var revised = model.resolveConflicts(conflicts);
    if (!count && !revised && !ack.length) throw Error("Backup did not confirm these entries");
    return count;
  }
  function xml(s) { return String(s === null || s === undefined ? "" : s).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;"); }
  function zip(files) {
    var encoder = new TextEncoder(), chunks = [], directory = [], offset = 0;
    function bytes(size) { return new Uint8Array(size); }
    function set(arr, position, value, size) { var view = new DataView(arr.buffer); if (size === 2) view.setUint16(position, value, true); else view.setUint32(position, value >>> 0, true); }
    function crc(data) { var c = 0xffffffff; for (var i = 0; i < data.length; i++) { c ^= data[i]; for (var j = 0; j < 8; j++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)); } return (c ^ 0xffffffff) >>> 0; }
    Object.keys(files).forEach(function (name) {
      var n = encoder.encode(name), data = encoder.encode(files[name]), sum = crc(data), h = bytes(30);
      set(h, 0, 0x04034b50); set(h, 4, 20, 2); set(h, 6, 0x0800, 2); set(h, 12, 33, 2); set(h, 14, sum); set(h, 18, data.length); set(h, 22, data.length); set(h, 26, n.length, 2);
      chunks.push(h, n, data);
      var d = bytes(46); set(d, 0, 0x02014b50); set(d, 4, 20, 2); set(d, 6, 20, 2); set(d, 8, 0x0800, 2); set(d, 14, 33, 2); set(d, 16, sum); set(d, 20, data.length); set(d, 24, data.length); set(d, 28, n.length, 2); set(d, 42, offset);
      directory.push(d, n); offset += h.length + n.length + data.length;
    });
    var directorySize = directory.reduce(function (n, a) { return n + a.length; }, 0), end = bytes(22);
    set(end, 0, 0x06054b50); set(end, 8, Object.keys(files).length, 2); set(end, 10, Object.keys(files).length, 2); set(end, 12, directorySize); set(end, 16, offset);
    chunks = chunks.concat(directory, [end]); var total = chunks.reduce(function (n, a) { return n + a.length; }, 0), out = bytes(total), at = 0;
    chunks.forEach(function (a) { out.set(a, at); at += a.length; }); return out;
  }
  function excel(entries, notice) {
    var headers = ["Anonymous session", "Entry ID", "Type", "Stop", "Language", "Build", "Created UTC", "Updated UTC", "Revision", "Rating", "Category", "What worked", "What to improve", "Score", "Phase", "Backup state", "Session ended", "Anonymous station"];
    // A file can stay behind in a shared computer's Downloads, so every note in it has the same scrub as a sent note,
    // under a first row that asks to check it before sharing.
    var rows = [[notice || (WORDS.en && WORDS.en.excelCheck) || "Check before sharing."], headers].concat(entries.map(function (e) { return [e.sessionId, e.entryId, e.kind, e.stop, e.language, e.build, e.createdAt, e.updatedAt, e.revision, e.rating, e.category, scrubPII(e.worked, e.language), scrubPII(e.fix, e.language), e.score, e.phase, (e.ackRevision || 0) >= e.revision ? "confirmed" : (e.submitted ? "pending" : "local draft"), e.sessionEnded ? "yes" : "no", e.stationId || ""]; }));
    function column(i) { var s = ""; do { s = String.fromCharCode(65 + i % 26) + s; i = Math.floor(i / 26) - 1; } while (i >= 0); return s; }
    var sheet = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="2" topLeftCell="A3" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="11" width="22" customWidth="1"/><col min="12" max="13" width="55" customWidth="1"/><col min="14" max="18" width="22" customWidth="1"/></cols><sheetData>' + rows.map(function (row, i) { return '<row r="' + (i + 1) + '">' + row.map(function (v, j) { var ref = column(j) + (i + 1); return typeof v === "number" && Number.isFinite(v) ? '<c r="' + ref + '"><v>' + v + '</v></c>' : '<c r="' + ref + '" t="inlineStr"><is><t xml:space="preserve">' + xml(v) + '</t></is></c>'; }).join("") + '</row>'; }).join("") + '</sheetData><autoFilter ref="A2:R' + rows.length + '"/></worksheet>';
    return zip({
      "[Content_Types].xml": '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
      "_rels/.rels": '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
      "xl/workbook.xml": '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Playtest feedback" sheetId="1" r:id="rId1"/></sheets></workbook>',
      "xl/_rels/workbook.xml.rels": '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
      "xl/worksheets/sheet1.xml": sheet
    });
  }
  // SPOKEN names the language a borrowed set of words is really in, for the form's lang attribute.
  var WORDS = {}, SPOKEN = {};
  if (typeof window === "undefined" && typeof module !== "undefined" && module.exports && typeof require === "function") {
    // Node and the tests read the locales from disk. A browser never runs this (the bundler may give it a module
    // object) and fetches them below, so through this alias the bundler leaves both files out of the shipped script.
    var readLocale = require;
    WORDS.en = readLocale("./locales/feedback-en.json");
    WORDS.es = readLocale("./locales/feedback-es.json");
  }
  function mount(document, window) {
    var root = document.getElementById("pt-feedback"); if (!root) return null;
    var documentLanguage = document.documentElement && document.documentElement.lang;
    var lang = (documentLanguage || root.dataset.lang) === "es" ? "es" : "en", W = WORDS[lang], endpoint = root.dataset.endpoint || "";
    var storage; try { storage = window.localStorage; } catch (e) { storage = { getItem: function () { throw e; }, setItem: function () { throw e; }, removeItem: function () { throw e; } }; }
    // A build with a close-out code carries only a random salt and the SHA-256 of salt and code, never the code. Only a
    // secure page (https or localhost) can check the code, so on plain http there is no close-out and no keeping for it.
    var lock = /^([0-9a-f]{32}):([0-9a-f]{64})$/.exec(root.dataset.closeout || ""), closeoutReady = !!lock && window.isSecureContext === true && !!(window.crypto && window.crypto.subtle);
    var model = createModel({ storage: storage, language: lang, build: root.dataset.build || "", id: function () { return uid(window.crypto); } });
    var game = document.getElementById("community-builders");
    if (game) {
      game.setAttribute("data-feedback-session", model.active());
      if (model.fresh) {
        try { var legacy = storage.getItem(GAME_KEY), scopedKey = GAME_KEY + ":" + model.active(); if (legacy && !storage.getItem(scopedKey)) storage.setItem(scopedKey, legacy); }
        catch (e) { model.storageFailed(); }
      }
    }
    function el(id) { return document.getElementById("pt-feedback-" + id); }
    var form = el("form"), stop = el("stop"), rating = el("rating"), category = el("category"), worked = el("worked"), fix = el("fix"), status = el("status"), list = el("entries"), context = el("context"), player = el("player");
    if (!form || !stop || !rating || !category || !worked || !fix || !status || !list) return null;
    form.setAttribute("data-pg-native", "");
    var contextStop = 0, saved = { rating: "", category: "", worked: "", fix: "" }, saveTimer = null, syncTimer = null, inflight = false, retry = false, attempts = 0, recentScore = null, staleArchived = false, sessionReloading = false, pageOpen = true, previewEntry = null, controller = null;
    // Set once this page hands the device to the next player or erases it; later flushes must not write old text.
    var leaving = false, sentEntry = null;
    var consent = readConsent(storage, model.active());
    if (!consent.scores) model.withdrawScores();
    function consentCopy() { return Object.assign({}, consent); }
    function updateConsentControls() {
      if (!document.querySelectorAll) return;
      Array.from(document.querySelectorAll("[data-pg-consent]")).forEach(function (input) {
        var key = input.getAttribute("data-pg-consent"); input.checked = consent[key] === true;
        if (key === "autoScores") input.disabled = !consent.scores;
      });
    }
    function setConsent(value) {
      var next = { scores: value && value.scores === true, autoScores: value && value.scores === true && value.autoScores === true, at: new Date().toISOString(), build: root.dataset.build || "", sessionId: model.active() };
      try { storage.setItem(CONSENT_KEY, JSON.stringify(next)); consent = next; }
      catch (_) { model.storageFailed(); setStatus(); return false; }
      if (!consent.scores) model.withdrawScores();
      updateConsentControls();
      if (window.CustomEvent && document.dispatchEvent) document.dispatchEvent(new window.CustomEvent("pt:consent-change", { detail: Object.assign({ source: "feedback" }, consentCopy()) }));
      return true;
    }
    document.addEventListener("change", function (event) {
      var input = event.target, key = input && input.getAttribute && input.getAttribute("data-pg-consent");
      if (key !== "scores" && key !== "autoScores") return;
      var next = consentCopy(); next[key] = input.checked;
      // Turning sharing on is a grown-up choice: it waits for a confirmation. Turning it off never does.
      if ((next.scores && !consent.scores) || (next.autoScores && !consent.autoScores)) { updateConsentControls(); askConsent(next, input, key); }
      else setConsent(next);
    });
    document.addEventListener("pt:consent-change", function (event) { var detail = event.detail || {}; if (detail.source !== "feedback") setConsent(detail); else updateConsentControls(); });
    var newDialog = document.getElementById("pt-new-player-dialog"), newTitle = document.getElementById("pt-new-player-title"), newMessage = document.getElementById("pt-new-player-message"), newCancel = document.getElementById("pt-new-player-cancel"), newConfirm = document.getElementById("pt-new-player-confirm"), newOpener = null, newVoiceSuspended = false;
    var useNewDialog = !!(newDialog && typeof newDialog.showModal === "function" && newTitle && newMessage && newCancel && newConfirm);
    function label(n) { return n ? W.stop + " " + n : W.general; }
    function setStatus() {
      if (model.changedSession()) {
        closeNewPlayerDialog();
        if (!staleArchived) {
          var fields = { rating: rating.value, category: category.value, worked: worked.value, fix: fix.value, language: lang };
          if (model.find("feedback", contextStop) || fields.rating || fields.category || fields.worked.trim() || fields.fix.trim()) model.stash("feedback", contextStop, fields);
          staleArchived = model.archive();
        }
        if (!staleArchived || model.warning()) { status.textContent = W.storage; return; }
        status.textContent = W.changed;
        if (!sessionReloading) { sessionReloading = true; window.location.reload(); }
        return;
      }
      // With nothing saved at all (blocked site data), Next player starts over instead of waiting for saving to work.
      if (model.warning()) {
        status.textContent = model.saved() ? W.storage : W.storageUnsaved + (el("download") ? " " + W.downloadFirst : "");
        if (useNewDialog && newDialog.open && model.saved() && newState !== "storage") renderNewPlayer("storage");
        return;
      }
      var pending = model.pending().length > 0, acknowledged = model.entries().some(function (e) { return e.submitted && (e.ackRevision || 0) >= e.revision; });
      // After a reload nothing retries by itself, so an unconfirmed note says so instead of "waiting". Earlier players'
      // notes are left only for the facilitator's close-out, or by an older version of the game.
      var others = model.entries(true).some(function (e) { return e.sessionId !== model.active() && e.kind === "feedback" && hasContent(e) && !received(e); });
      status.textContent = (model.recovery ? W.recovery : "") + (!endpointAllowed(endpoint) ? W.local : (pending ? (retry ? (attempts < 3 ? W.retrying : W.failed) : (inflight || sending ? W.queued : W.unsent)) : (acknowledged ? W.synced : W.draftSaved))) + (others ? " " + (closeoutReady ? W.othersKept : W.othersWaiting) : "");
    }
    function render() {
      if (player) player.textContent = W.player + " " + model.active().slice(-6).toUpperCase();
      if (context) context.textContent = label(contextStop);
      while (list.firstChild) list.removeChild(list.firstChild);
      var comments = model.entries().filter(function (e) { return e.kind === "feedback"; }).sort(function (a, b) { return b.updatedAt.localeCompare(a.updatedAt); });
      if (!comments.length) { var empty = document.createElement("li"); empty.textContent = W.empty; empty.className = "pt-feedback__empty"; list.appendChild(empty); }
      comments.forEach(function (e) {
        var item = document.createElement("li"), title = document.createElement("strong"), text = document.createElement("p"), state = document.createElement("span");
        item.className = "pt-feedback__entry"; title.textContent = label(e.stop) + (e.rating ? " · " + W[e.rating] : "");
        text.textContent = [e.worked, e.fix].filter(Boolean).join(" / ") || W.noText;
        state.className = "pt-feedback__entry-state"; state.textContent = e.submitted ? ((e.ackRevision || 0) >= e.revision ? W.backed : W.pending) : W.draft;
        item.appendChild(title); item.appendChild(text); item.appendChild(state); list.appendChild(item);
      });
      setStatus();
    }
    function loadContext(n) {
      invalidatePreview();
      contextStop = n; stop.value = String(n); var e = model.find("feedback", n);
      rating.value = e ? e.rating : ""; category.value = e ? e.category : ""; worked.value = e ? e.worked : ""; fix.value = e ? e.fix : "";
      saved = formValues(); render();
    }
    function formValues() { return { rating: rating.value, category: category.value, worked: worked.value, fix: fix.value }; }
    function syncForm() {
      // Show another tab's newer note, except in a field this tab is still editing.
      var e = model.find("feedback", contextStop), changed = false;
      [["rating", rating], ["category", category], ["worked", worked], ["fix", fix]].forEach(function (pair) {
        var value = e ? e[pair[0]] : "";
        if (pair[1].value === saved[pair[0]] && value !== saved[pair[0]]) { pair[1].value = value; saved[pair[0]] = value; changed = true; }
      });
      if (changed) invalidatePreview();
    }
    function scheduleSync(delay) {
      if (!pageOpen || !model.pending().length || !endpointAllowed(endpoint) || attempts >= 3) return;
      window.clearTimeout(syncTimer); syncTimer = window.setTimeout(sync, delay);
    }
    function flush() {
      window.clearTimeout(saveTimer); saveTimer = null;
      if (leaving) return;
      // Save only the fields edited in this tab, so closing an older tab cannot put back older text.
      var values = formValues(), fields = { language: lang };
      Object.keys(values).forEach(function (k) { if (values[k] !== saved[k]) fields[k] = values[k]; });
      if (model.find("feedback", contextStop) || fields.rating || fields.category || (fields.worked || "").trim() || (fields.fix || "").trim()) model.upsert("feedback", contextStop, fields);
      else model.persist();
      saved = values; render();
    }
    async function sync() {
      if (!pageOpen || inflight || attempts >= 3 || !model.pending().length || !endpointAllowed(endpoint)) return;
      inflight = true; attempts++; controller = window.AbortController ? new window.AbortController() : null;
      var timeout = window.setTimeout(function () { if (controller) controller.abort(); }, 15000);
      try { await sendBatch(model, endpoint, window.fetch.bind(window), controller && controller.signal); retry = model.pending().length > 0; }
      catch (_) { retry = true; }
      finally {
        window.clearTimeout(timeout); inflight = false; controller = null; render();
        // Maximum three total requests per explicit Send, including the first request.
        if (pageOpen && retry && model.pending().length && attempts < 3) scheduleSync(attempts === 1 ? 5000 : 30000);
        settleSendLock();
      }
    }
    function make(tag, id, text) { var node = document.createElement(tag); node.id = "pt-feedback-" + id; if (text) node.textContent = text; return node; }
    var saveDraft = el("save-draft");
    if (!saveDraft) { saveDraft = make("button", "save-draft", W.save); saveDraft.type = "button"; form.appendChild(saveDraft); }
    var preview = el("preview"), previewHeading, previewText, previewFlags, checkBox, send, edit, checkStatus;
    if (!preview) {
      preview = make("section", "preview"); preview.className = "pt-feedback__preview"; preview.hidden = true; preview.setAttribute("aria-label", W.preview);
      previewHeading = make("h3", "preview-heading", W.preview); previewHeading.tabIndex = -1;
      var previewHint = make("p", "preview-hint", W.removed);
      previewText = make("p", "preview-text"); previewText.className = "pt-feedback__preview-text";
      previewFlags = make("p", "preview-flags"); previewFlags.className = "pt-feedback__flags"; previewFlags.hidden = true;
      // A single, untimed grown-up check sits right above Send, so every input method can send (WCAG 2.1.1).
      var check = make("label", "check"); check.className = "pt-feedback__check";
      checkBox = make("input", "confirm"); checkBox.type = "checkbox";
      check.appendChild(checkBox); check.appendChild(make("span", "check-text", W.check));
      send = make("button", "send", W.sendNow); send.type = "button"; send.setAttribute("aria-describedby", "pt-feedback-check-status");
      edit = make("button", "edit", W.edit); edit.type = "button";
      checkStatus = make("p", "check-status", W.checkStatus); checkStatus.setAttribute("role", "status"); checkStatus.setAttribute("aria-live", "polite");
      [previewHeading, previewHint, previewText, previewFlags, check, send, edit, checkStatus].forEach(function (node) { preview.appendChild(node); }); form.appendChild(preview);
    } else { previewHeading = el("preview-heading"); previewText = el("preview-text"); previewFlags = el("preview-flags"); checkBox = el("confirm"); send = el("send"); edit = el("edit"); checkStatus = el("check-status"); }
    var submit = el("submit"); if (submit) submit.textContent = W.send;
    var thanks = el("thanks"), sending = false, editedWhileSending = false, resultKey = "";
    if (!thanks) {
      thanks = make("p", "thanks", W.thanks);
      thanks.className = "pt-feedback__thanks";
      thanks.setAttribute("role", "status");
      thanks.setAttribute("aria-live", "polite");
      thanks.tabIndex = -1;
      thanks.hidden = true;
      form.appendChild(thanks);
    }
    function setSendLocked(locked) {
      [submit, send].forEach(function (btn) {
        if (!btn) return;
        btn.disabled = !!locked;
        btn.setAttribute("aria-disabled", locked ? "true" : "false");
      });
    }
    // One line reports the explicit send: "Sending" first, thanks only after the matching acknowledgement.
    function showResult(key) {
      resultKey = key || "";
      if (!thanks) return;
      thanks.textContent = resultKey ? W[resultKey] : "";
      thanks.hidden = !resultKey;
    }
    function releaseSendLock() {
      if (sending) { editedWhileSending = true; return; }
      editedWhileSending = false;
      showResult("");
      setSendLocked(false);
    }
    function settleSendLock() {
      if (!sending || inflight) return;
      var pending = model.pending().length > 0;
      if (pending && retry && attempts < 3 && endpointAllowed(endpoint)) return;
      sending = false;
      var sent = sentEntry && model.entries().find(function (e) { return e.sessionId === sentEntry.sessionId && e.entryId === sentEntry.entryId; });
      // Editing the note during the send clears the line. A confirmed note keeps its thanks and stays locked until edited.
      if (editedWhileSending) { showResult(""); setSendLocked(false); editedWhileSending = false; return; }
      if (received(sent)) showResult("thanks");
      else { showResult("notSent"); setSendLocked(false); }
    }
    function translateForm() {
      function text(node, value) { if (node) node.textContent = value; }
      function query(selector) { return root.querySelector ? root.querySelector(selector) : null; }
      // Labels contain the existing controls. Replace only their text node.
      function prefix(node, value) {
        if (!node) return;
        var first = Array.from(node.childNodes || []).find(function (child) { return child.nodeType === 3; });
        if (first) first.textContent = value + " ";
      }
      function options(select, labels) {
        Array.from(select.options || []).forEach(function (option) { if (Object.prototype.hasOwnProperty.call(labels, option.value)) option.textContent = labels[option.value]; });
      }
      text(el("h"), W.title); text(query("h2 + p"), W.introduction);
      prefix(player && player.parentNode, W.anonymous); prefix(context && context.parentNode, W.activity);
      text(el("privacy"), endpointAllowed(endpoint) ? W.privacyCloud : W.privacyLocal);
      [["stop", "forStop"], ["rating", "ratingLabel"], ["category", "categoryLabel"], ["worked", "workedLabel"], ["fix", "fixLabel"]].forEach(function (pair) { prefix(query('label[for="pt-feedback-' + pair[0] + '"]'), W[pair[1]]); });
      var stopLabels = { 0: W.generalOption }; for (var n = 1; n <= 15; n++) stopLabels[n] = W.stop + " " + n;
      options(stop, stopLabels); options(rating, { "": W.choose, unclear: W.unclearOption, okay: W.okayOption, good: W.goodOption });
      options(category, { "": W.choose, clarity: W.clarityOption, bug: W.bugOption, voice: W.voiceOption, spanish: W.spanishOption, art: W.artOption, other: W.otherOption });
      text(el("hint"), W.hint); text(el("shared"), W.shared); text(el("download"), W.downloadLabel); text(el("new-player"), W.newPlayer); text(el("device"), W.deviceOpen);
      text(query(".pt-feedback__saved > summary"), W.savedNotes); text(query(".pt-feedback-more > summary"), W.more);
      var build = query("p > code"); prefix(build && build.parentNode, W.buildLabel);
      text(submit, W.send); text(saveDraft, W.save); text(el("preview-heading"), W.preview); text(el("preview-hint"), W.removed);
      showResult(resultKey);
      if (preview) preview.setAttribute("aria-label", W.preview);
      text(send, W.sendNow); text(edit, W.edit); text(checkStatus, W.checkStatus); text(el("check-text"), W.check);
      if (useNewDialog) { text(newTitle, W.newTitle); text(newCancel, W.newCancel); if (!newDialog.open) text(newConfirm, W.newConfirmLabel); }
      root.dataset.lang = lang; root.setAttribute("lang", SPOKEN[lang] || lang);
    }
    function invalidatePreview() {
      previewEntry = null; if (preview) preview.hidden = true;
      if (checkBox) checkBox.checked = false;
      if (checkStatus) checkStatus.textContent = W.checkStatus;
    }
    function showPreview() {
      flush(); if (model.warning() || model.changedSession()) return;
      if (!endpointAllowed(endpoint)) { status.textContent = W.unavailable; return; }
      // A blank note has nothing to review or send.
      if (!rating.value && !category.value && !worked.value.trim() && !fix.value.trim()) { invalidatePreview(); status.textContent = W.blank; worked.focus(); return; }
      var entry = model.find("feedback", contextStop);
      if (!entry) entry = model.upsert("feedback", contextStop, { language: lang });
      previewEntry = { entryId: entry.entryId, revision: entry.revision, stop: contextStop, worked: scrubPII(entry.worked, lang), fix: scrubPII(entry.fix, lang) };
      previewText.textContent = W.worked + ":\n" + previewEntry.worked + "\n\n" + W.fix + ":\n" + previewEntry.fix;
      var flags = privacyFlags(previewEntry.worked + "\n" + previewEntry.fix);
      if (previewFlags) { previewFlags.textContent = flags.length ? W.flagged.replace("{words}", flags.join(", ")) : ""; previewFlags.hidden = !flags.length; }
      checkBox.checked = false; checkStatus.textContent = W.checkStatus; preview.hidden = false;
      // Start at the heading so a phone keeps the "remove any names" prompt in view.
      if (typeof preview.scrollIntoView === "function") preview.scrollIntoView({ block: "start" });
      if (previewHeading) previewHeading.focus({ preventScroll: true });
    }
    function finishSend() {
      if (sending || (send && send.disabled)) return;
      if (!previewEntry) return;
      if (!checkBox.checked) { checkStatus.textContent = W.checkFirst; checkBox.focus(); return; }
      var entry = model.find("feedback", previewEntry.stop);
      if (!entry || entry.entryId !== previewEntry.entryId || entry.revision !== previewEntry.revision || contextStop !== previewEntry.stop) { invalidatePreview(); return; }
      model.upsert("feedback", contextStop, { worked: previewEntry.worked, fix: previewEntry.fix });
      worked.value = previewEntry.worked; fix.value = previewEntry.fix;
      if (!model.submit(entry.entryId, consent.scores)) { setStatus(); return; }
      sentEntry = { sessionId: entry.sessionId, entryId: entry.entryId };
      invalidatePreview(); attempts = 0; retry = false; window.clearTimeout(syncTimer);
      sending = true; editedWhileSending = false; setSendLocked(true); showResult("sending");
      var running = sync(); render();
      if (thanks) thanks.focus();
      Promise.resolve(running).then(settleSendLock);
    }
    if (send) send.addEventListener("click", finishSend);
    if (checkBox) {
      checkBox.addEventListener("change", function () { checkStatus.textContent = W.checkStatus; });
      // Enter on a checkbox would submit the form and rebuild the preview.
      checkBox.addEventListener("keydown", function (event) { if (event.key === "Enter") event.preventDefault(); });
    }
    if (edit) edit.addEventListener("click", function () { invalidatePreview(); worked.focus(); });
    saveDraft.addEventListener("click", function () { invalidatePreview(); flush(); });
    form.addEventListener("submit", function (event) { event.preventDefault(); if (sending || (submit && submit.disabled)) return; showPreview(); });
    document.addEventListener("pt:feedback-flush", flush);
    document.addEventListener("pg:language-change", function (event) {
      var next = event.detail && event.detail.language;
      if ((next !== "en" && next !== "es") || next === lang) return;
      var wasPreviewing = preview && !preview.hidden;
      flush(); lang = next; W = WORDS[lang]; translateForm(); render();
      if (playerReady) playerReady.textContent = W.playerReady;
      if (deviceDialog && deviceDialog.open) renderDevice();
      // A redrawn close-out list clears the grown-up check: read it again in the new language.
      if (closeoutDialog && closeoutDialog.open) { filesWarned = false; renderCloseout(""); closeoutTitle.focus(); }
      if (askDialog && askDialog.open) renderAsk().focus();
      // Next player in the new language; a listed review clears its grown-up check, like the close-out list.
      if (useNewDialog && newDialog.open) renderNewPlayer(newState);
      // A language change clears the grown-up check; review the newly translated preview.
      if (wasPreviewing) showPreview();
    });
    [rating, category, worked, fix].forEach(function (input) { input.addEventListener("input", function () { invalidatePreview(); releaseSendLock(); forgetReady(); window.clearTimeout(saveTimer); saveTimer = window.setTimeout(flush, 350); }); input.addEventListener("change", function () { invalidatePreview(); releaseSendLock(); flush(); }); });
    stop.addEventListener("change", function () { var n = Math.max(0, Math.min(15, Number(stop.value) || 0)); flush(); loadContext(n); });
    document.addEventListener("cb:screen", function (event) {
      var d = event.detail || {}, n = Math.max(0, Math.min(15, Number(d.stopN) || 0));
      if (n !== contextStop) { flush(); loadContext(n); recentScore = null; }
      if (consent.scores && d.phase === "result" && Number.isFinite(d.score)) {
        var marker = n + ":" + d.score;
        if (recentScore !== marker) { model.upsert("progress", n, { score: d.score, phase: "result", language: lang }); recentScore = marker; render(); if (consent.autoScores) { model.submitProgress(n); attempts = 0; retry = false; sync(); } }
      }
    });
    function suspendNewPlayerVoice(suspended) {
      if (newVoiceSuspended === suspended) return;
      newVoiceSuspended = suspended;
      var keepPaused = suspended || (game && game.getAttribute("data-playtest-paused") === "true") || (document.querySelector && document.querySelector("#pt-review-dialog[open]:not(.is-floating)"));
      if (window.CommunityBuilders && typeof window.CommunityBuilders.suspendVoice === "function") window.CommunityBuilders.suspendVoice(!!keepPaused);
    }
    function restoreNewPlayerFocus() {
      var opener = newOpener; newOpener = null;
      if (opener && typeof opener.focus === "function" && opener.isConnected !== false) opener.focus();
    }
    function closeNewPlayerDialog() {
      if (!useNewDialog || !newDialog.open) return;
      newDialog.close(); emptyNewPlayer(); suspendNewPlayerVoice(false); restoreNewPlayerFocus();
    }
    function clearForm() { [rating, category, worked, fix].forEach(function (input) { input.value = ""; }); invalidatePreview(); }
    function resetConsentFor(session) {
      try { storage.setItem(CONSENT_KEY, JSON.stringify({ scores: false, autoScores: false, at: new Date().toISOString(), build: root.dataset.build || "", sessionId: session })); } catch (_) { model.storageFailed(); }
    }
    // Next player never leaves this player's notes behind for the next child. Notes the playtest team has not
    // received are first reviewed and sent, deleted, or (only in a build with a close-out code) kept for the
    // facilitator's close-out, the one place that can read them or bring this player back.
    var newState = "", newCount = 0, newBody = null, newStatus = null, newSendButton = null, newKeepButton = null, newDeleteButton = null, newCheck = null, newReviewed = [];
    function unhandled() { return model.entries().filter(function (e) { return e.kind === "feedback" && hasContent(e) && !received(e); }); }
    function noteState() { return endpointAllowed(endpoint) || closeoutReady ? "choose" : "delete"; }
    function newText(state) {
      var notes = W.newNotes.replace("{count}", unhandled().length), download = el("download") ? " " + W.newDownloadFirst : "";
      if (state === "unsaved") return W.newUnsaved + download;
      if (state === "storage") return W.newStorage;
      if (state === "review") return W.newReview;
      if (state === "choose") return notes + " " + W.newChoose;
      if (state === "delete") return notes + " " + W.newDeleteAsk + download;
      return W.newConfirm + (closeoutReady ? " " + W.newRestore : "");
    }
    function newButton(text, id, run) {
      var button = action(text, "pt-btn pt-btn--secondary", id, run), row = newConfirm.parentNode;
      if (row && row.insertBefore) row.insertBefore(button, newConfirm); else newDialog.appendChild(button);
      return button;
    }
    function emptyNewPlayer() {
      // A closed Next player dialog keeps no note text in the page.
      newReviewed = []; newCheck = null;
      if (newBody) { fill(newBody, newStatus, [], []); newStatus.textContent = ""; }
      if (newMessage) newMessage.textContent = "";
    }
    function noteItem(e) {
      // One note as Send would send it: scrubbed, with the words a grown-up should still check.
      var entry = node("li", "pt-feedback__entry"), text = [scrubPII(e.worked, e.language), scrubPII(e.fix, e.language)].filter(Boolean), flags = privacyFlags(text.join("\n"));
      entry.appendChild(node("strong", "", label(e.stop) + (e.rating ? " · " + W[e.rating] : "")));
      entry.appendChild(node("p", "", text.join(" / ") || W.noText));
      if (flags.length) entry.appendChild(node("p", "pt-feedback__flags", W.flagged.replace("{words}", flags.join(", "))));
      entry.appendChild(node("span", "pt-feedback__entry-state", received(e) ? W.backed : (e.submitted ? W.pending : W.draft)));
      return entry;
    }
    function renderNewPlayer(state, message) {
      if (!newBody) {
        newBody = node("div", "pt-new-player__body", "", "pt-new-player-body"); newStatus = politeStatus("pt-new-player-status"); newBody.appendChild(newStatus);
        if (newMessage.parentNode && newMessage.parentNode.insertBefore) newMessage.parentNode.insertBefore(newBody, newMessage.nextSibling || null); else newDialog.appendChild(newBody);
        newSendButton = newButton(W.newSendNotes, "pt-new-player-send", function () { showNewPlayer("review"); });
        newKeepButton = newButton(W.newKeepNotes, "pt-new-player-keep", keepForFacilitator);
        newDeleteButton = newButton(W.newDeleteNotes, "pt-new-player-delete", function () { showNewPlayer("delete"); });
      }
      newState = state; newCheck = null; newReviewed = []; newCount = unhandled().length;
      newDialog.className = "pt-player-dialog" + (state === "review" ? " pt-device" : "");
      newTitle.textContent = W.newTitle; newCancel.textContent = W.newCancel; newMessage.textContent = newText(state);
      newSendButton.textContent = W.newSendNotes; newKeepButton.textContent = W.newKeepNotes; newDeleteButton.textContent = W.newDeleteNotes;
      var before = [], files = downloadedFiles(), focus = newCancel;
      // A file saved during this turn stays in Downloads, where the next child could open it.
      if (files.length) before.push(node("p", "pt-feedback__flags", W.newFiles.replace("{files}", files.join(", ")), "pt-new-player-files"));
      if (state === "review") {
        // Send sends exactly these notes, as listed; a change in another tab draws the list again.
        newReviewed = model.waiting().filter(function (e) { return e.sessionId === model.active(); });
        var heading = node("h3", "", W.preview, "pt-new-player-review"), notes = node("ul", "pt-device__notes", "", "pt-new-player-notes"), check = node("label", "pt-feedback__check");
        heading.tabIndex = -1; focus = heading;
        unhandled().forEach(function (e) { notes.appendChild(noteItem(e)); });
        newCheck = node("input", "", "", "pt-new-player-check"); newCheck.type = "checkbox";
        newCheck.addEventListener("keydown", function (event) { if (event.key === "Enter") event.preventDefault(); });
        check.appendChild(newCheck); check.appendChild(node("span", "", W.deviceCheck));
        before.push(heading, node("p", "", W.removed), notes, check);
      }
      fill(newBody, newStatus, before, []);
      newStatus.textContent = message || "";
      var choosing = state === "choose";
      newSendButton.hidden = !(choosing && endpointAllowed(endpoint));
      newKeepButton.hidden = !(choosing && closeoutReady);
      newDeleteButton.hidden = !choosing;
      newConfirm.hidden = choosing; newConfirm.setAttribute("aria-disabled", "false");
      newConfirm.textContent = state === "storage" ? W.newEraseYes : state === "delete" ? W.newDeleteYes : state === "review" ? W.sendNow : W.newConfirmLabel;
      focus.focus();
    }
    function showNewPlayer(state, message) {
      if (!useNewDialog) {
        // Without an in-page dialog the browser's confirm asks once; Cancel keeps playing, and notes can only be deleted.
        if (state === "choose") state = "delete";
        if (state === "review" || !window.confirm(newText(state))) return;
        if (state === "unsaved") startOver(); else if (state === "storage") eraseDevice(setStatus); else if (state === "delete") deleteNotes(); else confirmNewPlayer();
        return;
      }
      if (!newDialog.open) { newDialog.showModal(); suspendNewPlayerVoice(true); }
      renderNewPlayer(state, message);
    }
    function canLeave() {
      // Save the last keystrokes first; storage that stopped working offers the erase instead.
      flush();
      if (model.changedSession()) return false;
      if (model.warning()) { if (!model.saved()) startOver(); else showNewPlayer("storage"); return false; }
      return true;
    }
    function startNext() {
      // This player's notes are sent, deleted or kept for the facilitator. Clear the form and stop saving, so the
      // reload's page-hide save cannot copy anything into the next player's session.
      if (!model.rotate()) { setStatus(); return; }
      leaving = true; clearForm();
      closeNewPlayerDialog();
      window.clearTimeout(syncTimer);
      resetConsentFor(model.active()); forgetFiles();
      window.location.reload();
    }
    function confirmNewPlayer() {
      if (!canLeave()) return;
      // A note saved since the question was asked, in this tab or another, is handled first.
      if (unhandled().length) { showNewPlayer(noteState()); return; }
      startNext();
    }
    function keepForFacilitator() {
      if (!closeoutReady || !canLeave()) return;
      // A kept note waits on the device as Send and Excel would give it: scrubbed. Like a deleted note, it becomes a
      // newer revision, so an older copy in another tab cannot bring the raw text back.
      unhandled().forEach(function (e) { model.upsert("feedback", e.stop, { worked: scrubPII(e.worked, e.language), fix: scrubPII(e.fix, e.language) }); });
      if (model.warning() || model.changedSession()) { setStatus(); return; }
      startNext();
    }
    function deleteNotes() {
      if (!canLeave()) return;
      // Each note becomes an empty newer revision rather than a removed record, so an older copy in another tab can
      // never bring its text back.
      unhandled().forEach(function (e) { model.upsert("feedback", e.stop, { rating: "", category: "", worked: "", fix: "" }); });
      if (model.warning() || model.changedSession()) { setStatus(); return; }
      loadContext(contextStop);
      startNext();
    }
    async function sendAndNext() {
      if (!endpointAllowed(endpoint) || newState !== "review" || !newCheck) return;
      if (inflight || sending) { newStatus.textContent = W.sending; return; }
      if (!newCheck.checked) { newStatus.textContent = W.checkFirst; newCheck.focus(); return; }
      if (!canLeave()) return;
      var listed = newReviewed.length, count = model.submitAll(consent.scores, newReviewed);
      if (!count && (model.changedSession() || model.warning())) { setStatus(); return; }
      // Send keeps focus while it works; a second press only repeats "Sending".
      newConfirm.setAttribute("aria-disabled", "true");
      inflight = true; newStatus.textContent = W.sending;
      var rounds = Math.ceil(model.pending().length / 20) + 3;
      try {
        while (model.pending().length && rounds-- > 0) {
          controller = window.AbortController ? new window.AbortController() : null;
          var timeout = window.setTimeout(function () { if (controller) controller.abort(); }, 15000);
          try { await sendBatch(model, endpoint, window.fetch.bind(window), controller && controller.signal); }
          finally { window.clearTimeout(timeout); controller = null; }
        }
      } catch (_) { /* Anything not acknowledged stays on this device; Next player waits for it. */ }
      inflight = false; render();
      if (!newDialog.open || newState !== "review") return;
      var left = unhandled().length;
      // Only when the team has every note of this player does the next player start.
      if (!left) { startNext(); return; }
      renderNewPlayer("review", W.deviceFailed.replace("{count}", left) + (count < listed ? " " + W.closeoutChanged : ""));
    }
    function confirmNewState() {
      if (newState === "unsaved") startOver();
      else if (newState === "storage") eraseDevice(function () { renderNewPlayer("storage", W.eraseFailed); });
      else if (newState === "delete") deleteNotes();
      else if (newState === "review") sendAndNext();
      else confirmNewPlayer();
    }
    function startOver() {
      // Nothing of this player was ever saved, so a reload is the next player: new random codes, an empty form, a new game.
      leaving = true; clearForm();
      closeNewPlayerDialog();
      window.clearTimeout(syncTimer);
      window.location.reload();
    }
    function newPlayer(event) {
      flush();
      if (model.changedSession() || (useNewDialog && newDialog.open)) return;
      newOpener = event && event.currentTarget || document.activeElement;
      // With blocked site data nothing is saved, so the next player can still start; this player's game and notes go.
      // Saving that stopped working after this player saved offers to erase this device's Pecan Grove data instead.
      showNewPlayer(model.warning() ? (model.saved() ? "storage" : "unsaved") : (unhandled().length ? noteState() : "confirm"));
    }
    if (useNewDialog) {
      newCancel.addEventListener("click", closeNewPlayerDialog);
      newConfirm.addEventListener("click", confirmNewState);
      newDialog.addEventListener("cancel", function (event) { event.preventDefault(); closeNewPlayerDialog(); });
      newDialog.addEventListener("close", function () { if (!newDialog.open) { emptyNewPlayer(); suspendNewPlayerVoice(false); restoreNewPlayerFocus(); } });
    }
    [el("new-player"), el("new-player-top")].forEach(function (button) { if (button) button.addEventListener("click", newPlayer); });
    // Right after Next player, one line confirms the switch until the new player starts or types. A player chosen
    // by mistake comes back only from the facilitator's close-out, never from a button the next child can press.
    var readyHost = el("new-player-top"), playerReady = null, previous = model.previousPlayer();
    if (previous && readyHost && readyHost.parentNode && Date.now() - Date.parse(previous.at) < 600000 && model.entries().every(function (e) { return e.kind === "session"; })) {
      playerReady = document.createElement("p"); playerReady.id = "pt-player-ready"; playerReady.className = "pt-privacy"; playerReady.setAttribute("role", "status"); playerReady.textContent = W.playerReady;
      // Below the For grown-ups buttons, outside their row.
      (readyHost.parentNode.parentNode || readyHost.parentNode).appendChild(playerReady);
      var startButton = document.getElementById("pt-start");
      if (startButton) startButton.addEventListener("click", forgetReady);
    } else if (previous) model.forgetPrevious();
    function forgetReady() {
      if (!playerReady) return;
      model.forgetPrevious(); playerReady.remove(); playerReady = null;
    }
    // The names of files saved during this player's turn, so Next player and closing the close-out can say to delete
    // them from Downloads. Kept for the current player only; an unavailable store keeps this page's own list.
    var downloads = [];
    function downloadedFiles() {
      var names = downloads.slice();
      try {
        var kept = JSON.parse(storage.getItem(FILES_KEY) || "null");
        if (kept && kept.sessionId === model.active() && Array.isArray(kept.files)) kept.files.forEach(function (name) { if (typeof name === "string" && names.indexOf(name.slice(0, 80)) === -1) names.push(name.slice(0, 80)); });
      } catch (_) { /* This page's own list still warns. */ }
      return names.slice(0, 10);
    }
    function recordFile(name) {
      name = String(name || "").slice(0, 80);
      if (!name) return;
      if (downloads.indexOf(name) === -1) downloads.push(name);
      try { storage.setItem(FILES_KEY, JSON.stringify({ sessionId: model.active(), files: downloadedFiles() })); } catch (_) { /* This page's own list still warns. */ }
    }
    function forgetFiles() { downloads = []; try { storage.removeItem(FILES_KEY); } catch (_) { /* The list belongs to the player who left. */ } }
    document.addEventListener("pg:file-saved", function (event) { recordFile(event.detail && event.detail.name); });
    function saveExcel(list, name, target, done) {
      try {
        var blob = new window.Blob([excel(list, W.excelCheck)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        var url = window.URL.createObjectURL(blob), a = document.createElement("a"); a.href = url; a.download = name;
        document.body.appendChild(a); a.click(); a.remove(); window.setTimeout(function () { window.URL.revokeObjectURL(url); }, 30000); target.textContent = done;
        recordFile(name);
      } catch (e) { target.textContent = W.downloadError; }
    }
    // Only a copy that never sends keeps the per-player Excel button; with a receiver it is not built.
    var download = el("download");
    if (download) download.addEventListener("click", function () {
      flush(); saveExcel(model.entries(), "pecan-grove-feedback-" + model.active().slice(-6) + ".xlsx", status, W.download);
    });
    function node(tag, className, text, id) { var n = document.createElement(tag); if (className) n.className = className; if (text) n.textContent = text; if (id) n.id = id; return n; }
    function action(text, className, id, run) { var b = node("button", className, text, id); b.type = "button"; b.addEventListener("click", run); return b; }
    function focusId(id) { var n = document.getElementById(id); if (n && typeof n.focus === "function") n.focus(); }
    function dialogHost() { return document.getElementById("pt-stage") || document.body; }
    // Grown-up confirmation before any score leaves the device.
    var consentDialog = null, consentNext = null, consentOpener = null;
    function askConsent(next, opener, key) {
      var message = key === "autoScores" ? W.consentAutoAsk : W.consentScoresAsk;
      if (!consentDialog) {
        consentDialog = node("dialog", "pt-player-dialog", "", "pt-consent-dialog"); consentDialog.setAttribute("aria-labelledby", "pt-consent-title"); consentDialog.setAttribute("aria-describedby", "pt-consent-message");
        consentDialog.addEventListener("cancel", function (event) { event.preventDefault(); closeConsent(false); });
        dialogHost().appendChild(consentDialog);
      }
      if (typeof consentDialog.showModal !== "function") { if (window.confirm(message)) setConsent(next); return; }
      if (consentDialog.open) return;
      consentNext = next; consentOpener = opener;
      while (consentDialog.firstChild) consentDialog.removeChild(consentDialog.firstChild);
      var actions = node("div", "pt-actions"), keep = action(W.consentNo, "pt-btn", "pt-consent-cancel", function () { closeConsent(false); });
      actions.appendChild(keep); actions.appendChild(action(W.consentYes, "pt-btn pt-btn--secondary", "pt-consent-confirm", function () { closeConsent(true); }));
      [node("h2", "", W.consentTitle, "pt-consent-title"), node("p", "", message, "pt-consent-message"), actions].forEach(function (n) { consentDialog.appendChild(n); });
      consentDialog.showModal(); keep.focus();
    }
    function closeConsent(allow) {
      var next = consentNext, opener = consentOpener; consentNext = consentOpener = null;
      if (consentDialog && consentDialog.open) consentDialog.close();
      if (allow && next) setConsent(next); else updateConsentControls();
      if (opener && typeof opener.focus === "function" && opener.isConnected !== false) opener.focus();
    }
    // For grown-ups on a shared device: the privacy notice, how many notes are saved here, and erase. Notes can be
    // private, so this panel only counts them; their text, Send, the Excel for every player and bringing a player
    // back are in the facilitator's close-out below, which exists only in a build with a close-out code.
    var deviceDialog = null, deviceStatus = null, deviceOpener = null, eraseAsked = false;
    function waitingNotes() { return model.waiting().length; }
    function politeStatus(id) { var out = node("p", "pt-device__status", "", id); out.setAttribute("role", "status"); out.setAttribute("aria-live", "polite"); return out; }
    // A redraw keeps the dialog's one polite region in place, so its next message is announced.
    function fill(d, keep, before, after) {
      Array.from(d.childNodes || []).forEach(function (n) { if (n !== keep) d.removeChild(n); });
      if (keep.parentNode !== d) d.appendChild(keep);
      before.forEach(function (n) { d.insertBefore(n, keep); });
      after.forEach(function (n) { d.appendChild(n); });
    }
    function noteCount(everyone) { return everyone.reduce(function (n, p) { return n + p.notes.length; }, 0); }
    function renderDevice(message) {
      var cloud = endpointAllowed(endpoint), everyone = model.players(), notes = noteCount(everyone), waiting = waitingNotes();
      var title = node("h2", "", W.deviceOpen, "pt-device-title"); title.tabIndex = -1;
      var notice = node("details", "pt-device__privacy", "", "pt-device-privacy");
      notice.appendChild(node("summary", "", W.privacyTitle));
      // Each line says what this copy does: with or without a receiver, and with or without a close-out code.
      var notesKept = cloud ? (closeoutReady ? W.privacyNotesCloudKeep : W.privacyNotesCloud) : (closeoutReady ? W.privacyNotesLocalKeep : W.privacyNotesLocal);
      [W.privacyStored, notesKept, cloud ? W.privacySentCloud : W.privacySentLocal, cloud ? W.privacyWho : "", W.privacyContact, W.privacyDelete, closeoutReady ? W.privacyTries : ""].forEach(function (text) { if (text) notice.appendChild(node("p", "", text)); });
      deviceStatus.textContent = message || "";
      var erase = node("div", "pt-device__erase");
      if (!eraseAsked) erase.appendChild(action(W.erase, "pt-btn pt-btn--secondary", "pt-device-erase", function () { eraseAsked = true; renderDevice(); focusId("pt-device-erase-no"); }));
      else {
        erase.appendChild(node("p", "", W.eraseConfirm + (waiting ? " " + W.eraseUnsent.replace("{count}", waiting) + (closeoutReady ? " " + W.eraseKeep : "") : ""), "pt-device-erase-message"));
        erase.appendChild(action(W.eraseNo, "pt-btn", "pt-device-erase-no", function () { eraseAsked = false; renderDevice(); focusId("pt-device-erase"); }));
        erase.appendChild(action(W.eraseYes, "pt-btn pt-btn--secondary", "pt-device-erase-yes", eraseDevice));
      }
      var actions = node("div", "pt-actions"); actions.appendChild(action(W.close, "pt-btn", "pt-device-close", closeDevice));
      fill(deviceDialog, deviceStatus, [title, node("p", "", W.deviceIntro), notice, node("h3", "", W.deviceNotesTitle),
        node("p", "", W.deviceSummary.replace("{players}", everyone.length).replace("{notes}", notes).replace("{waiting}", waiting), "pt-device-summary"),
        node("p", "", W.deviceCloseout + (closeoutReady ? " " + W.deviceCloseoutCode : ""))], [erase, actions]);
    }
    function openDevice(opener) {
      flush();
      if (!deviceDialog) {
        deviceDialog = node("dialog", "pt-player-dialog pt-device", "", "pt-device-dialog"); deviceDialog.setAttribute("aria-labelledby", "pt-device-title");
        deviceDialog.addEventListener("cancel", function (event) { event.preventDefault(); closeDevice(); });
        deviceStatus = politeStatus("pt-device-status"); deviceDialog.appendChild(deviceStatus);
        dialogHost().appendChild(deviceDialog);
      }
      if (deviceDialog.open) return;
      deviceOpener = opener || document.activeElement; eraseAsked = false;
      renderDevice();
      if (typeof deviceDialog.showModal === "function") deviceDialog.showModal(); else deviceDialog.open = true;
      suspendNewPlayerVoice(true); focusId("pt-device-title");
    }
    function closeDevice() {
      if (!deviceDialog) return;
      if (deviceDialog.open) { if (typeof deviceDialog.close === "function") deviceDialog.close(); else deviceDialog.open = false; }
      suspendNewPlayerVoice(false); eraseAsked = false;
      var opener = deviceOpener; deviceOpener = null;
      if (opener && typeof opener.focus === "function" && opener.isConnected !== false) opener.focus();
    }
    // The facilitator's close-out: every player's notes to read, send and download, and the earlier players to bring
    // back. It exists only in a build made with PG_CLOSEOUT_CODE, and opens from Facilitator close-out (For grown-ups)
    // after the facilitator types that code into a dialog, never into the address, so nothing reaches the browser's
    // history. Wrong codes are counted on this device, across tabs and Erase all. The page holds only a salted hash, so
    // this keeps children out; someone with the page source and time could still try codes offline.
    var askDialog = null, askInput = null, askStatus = null, askOpener = null, checking = false, codeTries = { count: 0, until: 0 };
    var closeoutDialog = null, closeoutTitle = null, closeoutIntro = null, closeoutBody = null, closeoutStatus = null, closeoutClose = null, closeoutSend = null, reviewed = [], filesWarned = false;
    function readTries() {
      try { var kept = JSON.parse(storage.getItem(TRIES_KEY) || "null"); if (kept && Number.isInteger(kept.count) && Number.isFinite(kept.until)) codeTries = { count: kept.count, until: kept.until }; }
      catch (_) { /* This page keeps its own count. */ }
      if (codeTries.until && codeTries.until <= Date.now()) codeTries = { count: 0, until: 0 };
      return codeTries;
    }
    function writeTries(tries) {
      codeTries = tries;
      try { storage.setItem(TRIES_KEY, JSON.stringify(tries)); } catch (_) { /* This page keeps its own count. */ }
    }
    function sha256(text) {
      var subtle = window.crypto && window.crypto.subtle;
      if (!subtle || typeof subtle.digest !== "function") return Promise.reject(Error("No SHA-256 in this browser"));
      return subtle.digest("SHA-256", new TextEncoder().encode(text)).then(function (buffer) {
        return Array.from(new Uint8Array(buffer), function (n) { return n.toString(16).padStart(2, "0"); }).join("");
      });
    }
    function renderAsk() {
      while (askDialog.firstChild) askDialog.removeChild(askDialog.firstChild);
      var field = node("label", "pt-closeout__field", "", "pt-closeout-code-label"), actions = node("div", "pt-actions");
      askInput = node("input", "pt-closeout__code", "", "pt-closeout-code");
      // A real password field, so the code is masked and never read out. Edge offers to save a password field even with
      // autocomplete="off", but not a one-time code: so the browser never keeps the code or fills it in for a child.
      askInput.type = "password"; askInput.name = "pt-closeout-otp"; askInput.setAttribute("autocomplete", "one-time-code"); askInput.setAttribute("autocapitalize", "off"); askInput.setAttribute("spellcheck", "false"); askInput.setAttribute("aria-describedby", "pt-closeout-ask-message pt-closeout-ask-status");
      askInput.addEventListener("keydown", function (event) { if (event.key === "Enter") { event.preventDefault(); checkCode(); } });
      field.appendChild(node("span", "", W.codeLabel)); field.appendChild(askInput);
      askStatus = politeStatus("pt-closeout-ask-status");
      actions.appendChild(action(W.closeoutNo, "pt-btn", "pt-closeout-ask-cancel", function () { answerCloseout(false); }));
      actions.appendChild(action(W.codeOpen, "pt-btn pt-btn--secondary", "pt-closeout-ask-confirm", checkCode));
      [node("h2", "", W.closeoutTitle, "pt-closeout-ask-title"), node("p", "", W.codeAsk, "pt-closeout-ask-message"), field, askStatus, actions].forEach(function (n) { askDialog.appendChild(n); });
      if (readTries().until) askStatus.textContent = W.codeWait;
      return askInput;
    }
    function askCloseout(opener) {
      if (!closeoutReady) return;
      if (!askDialog) {
        askDialog = node("dialog", "pt-player-dialog", "", "pt-closeout-ask"); askDialog.setAttribute("aria-labelledby", "pt-closeout-ask-title"); askDialog.setAttribute("aria-describedby", "pt-closeout-ask-message");
        askDialog.addEventListener("cancel", function (event) { event.preventDefault(); answerCloseout(false); });
        dialogHost().appendChild(askDialog);
      }
      if (typeof askDialog.showModal !== "function" || askDialog.open || (closeoutDialog && closeoutDialog.open)) return;
      askOpener = opener || document.activeElement;
      var input = renderAsk(); askDialog.showModal(); suspendNewPlayerVoice(true); input.focus();
    }
    function emptyAsk() { if (askInput) askInput.value = ""; if (askStatus) askStatus.textContent = ""; }
    function answerCloseout(open) {
      if (askDialog && askDialog.open) askDialog.close();
      emptyAsk();
      if (open) { openCloseout(); return; }
      suspendNewPlayerVoice(false);
      var opener = askOpener; askOpener = null;
      if (opener && typeof opener.focus === "function" && opener.isConnected !== false) opener.focus();
    }
    function checkCode() {
      if (checking || !askDialog || !askDialog.open) return;
      var tries = readTries(), typed = askInput.value.trim();
      if (tries.until) { askStatus.textContent = W.codeWait; return; }
      if (!typed) { askStatus.textContent = W.codeEmpty; askInput.focus(); return; }
      checking = true;
      sha256(lock[1] + ":" + typed).then(function (hash) {
        checking = false;
        if (!askDialog.open) return;
        askInput.value = "";
        if (hash === lock[2]) { writeTries({ count: 0, until: 0 }); answerCloseout(true); return; }
        var count = readTries().count + 1;
        // Five wrong codes on this device, then a one-minute wait before the next try.
        writeTries(count >= CODE_TRIES ? { count: 0, until: Date.now() + CODE_WAIT } : { count: count, until: 0 });
        askStatus.textContent = count >= CODE_TRIES ? W.codeWait : W.codeWrong.replace("{count}", CODE_TRIES - count);
        askInput.focus();
      }, function () { checking = false; askStatus.textContent = W.codeUnavailable; });
    }
    function playerCode(session) { return session.slice(-6).toUpperCase(); }
    function lastSaved(at) {
      try { return new Date(at).toLocaleString(lang, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); }
      catch (_) { return String(at).slice(0, 16).replace("T", " "); }
    }
    function renderCloseout(message) {
      var cloud = endpointAllowed(endpoint), everyone = model.players(), notes = noteCount(everyone);
      // Send may send exactly the notes listed here, as listed; a later change in any tab draws the list again.
      reviewed = model.waiting();
      closeoutTitle.textContent = W.closeoutTitle; closeoutIntro.textContent = W.closeoutIntro; closeoutClose.textContent = W.close;
      if (message !== undefined) closeoutStatus.textContent = message;
      var body = closeoutBody; closeoutSend = null;
      while (body.firstChild) body.removeChild(body.firstChild);
      body.appendChild(node("h3", "", W.deviceNotesTitle));
      body.appendChild(node("p", "", W.deviceSummary.replace("{players}", everyone.length).replace("{notes}", notes).replace("{waiting}", reviewed.length)));
      var players = node("ul", "pt-device__players", "", "pt-closeout-notes");
      everyone.filter(function (p) { return p.notes.length; }).forEach(function (p) {
        var item = node("li", "pt-device__player"), inner = node("ul", "pt-device__notes");
        item.appendChild(node("strong", "", W.player + " " + playerCode(p.sessionId) + (p.sessionId === model.active() ? " " + W.deviceCurrent : "")));
        p.notes.forEach(function (e) { inner.appendChild(noteItem(e)); });
        item.appendChild(inner); players.appendChild(item);
      });
      if (!notes) players.appendChild(node("li", "", W.deviceNone));
      body.appendChild(players);
      if (cloud && reviewed.length) {
        var check = node("label", "pt-feedback__check"), box = node("input", "", "", "pt-closeout-confirm"); box.type = "checkbox";
        box.addEventListener("keydown", function (event) { if (event.key === "Enter") event.preventDefault(); });
        check.appendChild(box); check.appendChild(node("span", "", W.deviceCheck));
        body.appendChild(check);
        closeoutSend = action(W.deviceSend.replace("{count}", reviewed.length), "pt-btn", "pt-closeout-send", function () { sendCloseout(box); });
        body.appendChild(closeoutSend);
      } else if (!cloud && notes) body.appendChild(node("p", "", W.deviceLocal));
      if (notes) body.appendChild(action(W.deviceDownload, "pt-btn pt-btn--secondary", "pt-closeout-download", function () { flush(); saveExcel(model.entries(true), "pecan-grove-feedback-all-players.xlsx", closeoutStatus, W.deviceDownloaded); }));
      // A Next player chosen by mistake: bring back an earlier player's game and notes.
      var earlier = model.players(true).filter(function (p) { return p.sessionId !== model.active(); });
      body.appendChild(node("h3", "", W.restoreTitle));
      body.appendChild(node("p", "", earlier.length ? W.restoreIntro : W.restoreNone));
      if (earlier.length) {
        var restore = node("div", "pt-actions pt-closeout__restore");
        earlier.forEach(function (p) { restore.appendChild(action(W.restorePlayer.replace("{code}", playerCode(p.sessionId)).replace("{time}", lastSaved(p.updatedAt)), "pt-btn pt-btn--secondary", "", function () { restorePlayer(p.sessionId); })); });
        body.appendChild(restore);
      }
    }
    // A close-out left open closes by itself after ten minutes without input, first with the Downloads reminder if a
    // file was saved; it also closes when the tab is hidden.
    var closeoutIdle = null;
    function armIdle() {
      window.clearTimeout(closeoutIdle);
      closeoutIdle = closeoutDialog && closeoutDialog.open ? window.setTimeout(function () { closeCloseout(); armIdle(); }, 600000) : null;
    }
    function openCloseout() {
      flush();
      if (!closeoutDialog) {
        closeoutDialog = node("dialog", "pt-player-dialog pt-device", "", "pt-closeout-dialog"); closeoutDialog.setAttribute("aria-labelledby", "pt-closeout-title");
        closeoutDialog.addEventListener("cancel", function (event) { event.preventDefault(); closeCloseout(); });
        ["keydown", "pointerdown", "input"].forEach(function (type) { closeoutDialog.addEventListener(type, armIdle); });
        closeoutTitle = node("h2", "", "", "pt-closeout-title"); closeoutTitle.tabIndex = -1;
        closeoutIntro = node("p"); closeoutBody = node("div", "pt-closeout__body", "", "pt-closeout-body"); closeoutStatus = politeStatus("pt-closeout-status");
        var actions = node("div", "pt-actions"); closeoutClose = action(W.close, "pt-btn", "pt-closeout-close", closeCloseout); actions.appendChild(closeoutClose);
        [closeoutTitle, closeoutIntro, closeoutBody, closeoutStatus, actions].forEach(function (n) { closeoutDialog.appendChild(n); });
        dialogHost().appendChild(closeoutDialog);
      }
      if (closeoutDialog.open) return;
      filesWarned = false; renderCloseout("");
      if (typeof closeoutDialog.showModal === "function") closeoutDialog.showModal(); else closeoutDialog.open = true;
      suspendNewPlayerVoice(true); closeoutTitle.focus(); armIdle();
    }
    function emptyCloseout() {
      // A closed close-out keeps no note text in the page, also for the back-forward cache.
      reviewed = []; closeoutSend = null;
      if (closeoutBody) while (closeoutBody.firstChild) closeoutBody.removeChild(closeoutBody.firstChild);
      if (closeoutStatus) closeoutStatus.textContent = "";
    }
    function closeCloseout(now) {
      if (!closeoutDialog) return;
      var files = now === true ? [] : downloadedFiles();
      if (closeoutDialog.open && files.length && !filesWarned) {
        // Before the view closes: a file saved here stays in Downloads, where a child could open it.
        filesWarned = true; emptyCloseout();
        closeoutBody.appendChild(node("p", "pt-feedback__flags", W.closeoutFiles.replace("{files}", files.join(", ")), "pt-closeout-files"));
        closeoutTitle.focus();
        return;
      }
      if (closeoutDialog.open) { if (typeof closeoutDialog.close === "function") closeoutDialog.close(); else closeoutDialog.open = false; }
      window.clearTimeout(closeoutIdle); emptyCloseout(); suspendNewPlayerVoice(false);
      var opener = askOpener; askOpener = null;
      if (opener && typeof opener.focus === "function" && opener.isConnected !== false) opener.focus();
    }
    async function sendCloseout(box) {
      if (!endpointAllowed(endpoint)) return;
      if (inflight || sending) { closeoutStatus.textContent = W.sending; return; }
      if (!box.checked) { closeoutStatus.textContent = W.checkFirst; box.focus(); return; }
      flush();
      var listed = reviewed.length, count = model.submitAll(consent.scores, reviewed);
      if (!count && (model.changedSession() || model.warning())) { setStatus(); return; }
      // Send keeps focus while it works; a second press only repeats "Sending".
      if (closeoutSend) closeoutSend.setAttribute("aria-disabled", "true");
      inflight = true; closeoutStatus.textContent = W.sending;
      // One request per batch of up to 20 records; a failed request stops and leaves the rest saved here.
      var rounds = Math.ceil(model.pending(true).length / 20) + 3;
      try {
        while (model.pending(true).length && rounds-- > 0) {
          controller = window.AbortController ? new window.AbortController() : null;
          var timeout = window.setTimeout(function () { if (controller) controller.abort(); }, 15000);
          try { await sendBatch(model, endpoint, window.fetch.bind(window), controller && controller.signal, true); }
          finally { window.clearTimeout(timeout); controller = null; }
        }
      } catch (_) { /* Anything not acknowledged stays on this device and is listed again. */ }
      inflight = false; render();
      var left = waitingNotes(), result = left ? W.deviceFailed.replace("{count}", left) : W.deviceSent;
      if (count < listed) result += " " + W.closeoutChanged;
      if (!closeoutDialog || !closeoutDialog.open) return;
      renderCloseout(result);
      // The list is drawn again; focus stays in the dialog, on Send while notes are left, otherwise on its title.
      (closeoutSend || closeoutTitle).focus();
    }
    function restorePlayer(session) {
      flush();
      if (model.warning() || model.changedSession() || !model.restore(session)) { setStatus(); if (closeoutDialog && closeoutDialog.open) renderCloseout(model.warning() ? W.storage : W.closeoutChanged); return; }
      leaving = true; clearForm(); resetConsentFor(model.active());
      window.location.reload();
    }
    function eraseDevice(failed) {
      leaving = true; window.clearTimeout(syncTimer); if (controller) controller.abort();
      var session = null; try { session = window.sessionStorage; } catch (_) { session = null; }
      // A failed erase keeps the form as it is, so the next save cannot store an emptied note.
      if (!eraseAll(storage, session)) { leaving = false; if (typeof failed === "function") failed(); else renderDevice(W.storage); return; }
      clearForm();
      // A closing page may save once more; the next load finishes the erase before anything else starts.
      try { if (session) session.setItem(ERASE_FLAG, "1"); } catch (_) { /* The erase above already removed the saved data. */ }
      window.location.reload();
    }
    [el("device"), document.getElementById("pt-device-open")].forEach(function (button) { if (button) button.addEventListener("click", function (event) { openDevice(event && event.currentTarget); }); });
    function hideNotes() {
      // Leaving the page, also into the back-forward cache: close the dialogs and keep no note text in the page. The
      // emptied form counts as already saved, so a later save never stores it over the note.
      closeNewPlayerDialog(); if (consentDialog && consentDialog.open) closeConsent(false); closeDevice();
      if (askDialog && askDialog.open) answerCloseout(false);
      closeCloseout(true); emptyNewPlayer(); emptyAsk();
      clearForm(); saved = formValues(); previewEntry = null;
      if (previewText) previewText.textContent = "";
      if (previewFlags) previewFlags.textContent = "";
      while (list.firstChild) list.removeChild(list.firstChild);
    }
    window.addEventListener("pagehide", function () { flush(); pageOpen = false; window.clearTimeout(syncTimer); if (controller) controller.abort(); hideNotes(); });
    window.addEventListener("pageshow", function (event) {
      if (!event || !event.persisted) return;
      // Back or Forward brought this page back. Another tab may have started a player, brought one back or erased
      // this device in the meantime: then load the page again; otherwise show this player's saved notes again.
      var disk = readState(storage);
      if (leaving || (disk.state ? disk.state.activeSession !== model.active() : model.saved() && !disk.warning)) { leaving = true; window.location.reload(); return; }
      pageOpen = true; model.refresh(); loadContext(contextStop);
      consent = readConsent(storage, model.active()); if (!consent.scores) model.withdrawScores(true); updateConsentControls();
    });
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState !== "hidden") return;
      flush();
      // A hidden tab can be left for anyone to find: the code question and the close-out close, keeping no note text.
      if (askDialog && askDialog.open) answerCloseout(false);
      if (closeoutDialog && closeoutDialog.open) closeCloseout(true);
    });
    window.addEventListener("storage", function (event) {
      // Another tab erased this device: reload without writing this tab's copy back.
      if (event.key === KEY && event.newValue === null) { leaving = true; window.location.reload(); return; }
      // Storage events only read: writing from here could undo another tab's New player.
      if (event.key === KEY) {
        if (model.refresh()) syncForm();
        render();
        // A note written or changed in another tab while the close-out list is open: draw the list again, which
        // clears the grown-up check, so Send can only send what the grown-up has read.
        if (closeoutDialog && closeoutDialog.open && !inflight && !filesWarned && JSON.stringify(model.waiting()) !== JSON.stringify(reviewed)) renderCloseout(W.closeoutChanged);
        // The same for this player's notes listed in Next player; a question about them shows the new count.
        if (useNewDialog && newDialog.open && !inflight) {
          var mine = model.waiting().filter(function (e) { return e.sessionId === model.active(); });
          if (newState === "review" && JSON.stringify(mine) !== JSON.stringify(newReviewed)) renderNewPlayer(mine.length ? "review" : "confirm", mine.length ? W.closeoutChanged : "");
          else if ((newState === "confirm" || newState === "choose" || newState === "delete") && unhandled().length !== newCount) renderNewPlayer(unhandled().length ? (newState === "confirm" ? noteState() : newState) : "confirm");
        }
      }
      if (event.key === CONSENT_KEY) { consent = readConsent(storage, model.active()); if (!consent.scores) model.withdrawScores(true); updateConsentControls(); }
    });
    model.upsert("session", 0, { phase: "start", language: lang });
    var initial = game && Number(game.dataset.currentStop);
    translateForm(); loadContext(Number.isInteger(initial) && initial >= 0 && initial <= 15 ? initial : 0); updateConsentControls();
    var runtime = { model: model, flush: flush, sync: sync, getConsent: consentCopy, setConsent: setConsent, showPreview: showPreview, openDevice: openDevice,
      requestNewPlayer: function (opener) { newPlayer({ currentTarget: opener }); } };
    // Facilitator close-out (For grown-ups) exists only in a build with a close-out code.
    // On plain http the build's button cannot open it, so it is taken away.
    var closeoutOpen = document.getElementById("pt-closeout-open");
    if (closeoutReady) {
      runtime.openCloseout = function (opener) { flush(); askCloseout(opener); };
      if (closeoutOpen) closeoutOpen.addEventListener("click", function (event) { runtime.openCloseout(event && event.currentTarget); });
    } else if (closeoutOpen) closeoutOpen.hidden = true;
    window.PecanGroveFeedback = Object.assign({}, api, runtime);
    return runtime;
  }
  function unavailable(document, window) {
    // Without its words the form cannot run. It is switched off and emptied, so no typed text waits for the next child,
    // and Next player (in the form, under For grown-ups and in the game) still starts the next player.
    var root = document.getElementById("pt-feedback"), shell = window.PGShellLocale || {}, lang = document.documentElement && document.documentElement.lang === "es" ? "es" : "en";
    function el(id) { return document.getElementById(id); }
    function say(key) { return (shell[lang] || {})[key] || ""; }
    var form = el("pt-feedback-form"), status = el("pt-feedback-status"), player = el("pt-feedback-player"), game = document.getElementById("community-builders");
    var dialog = el("pt-new-player-dialog"), message = el("pt-new-player-message"), cancel = el("pt-new-player-cancel"), confirm = el("pt-new-player-confirm"), opener = null, notes = false;
    var useDialog = !!(dialog && typeof dialog.showModal === "function" && message && cancel && confirm), fields = form ? Array.from(form.elements || []) : [];
    function empty() { fields.forEach(function (input) { if (input.tagName === "TEXTAREA") input.value = ""; }); }
    root.dataset.feedbackUnavailable = "true";
    if (form) form.addEventListener("submit", function (event) { event.preventDefault(); });
    fields.forEach(function (input) { input.disabled = true; }); empty();
    // The privacy panel, the close-out and Excel need the feedback words too.
    ["pt-feedback-device", "pt-device-open", "pt-closeout-open", "pt-feedback-download"].forEach(function (id) { if (el(id)) el(id).hidden = true; });
    var storage = null, model = null;
    try { storage = window.localStorage; model = createModel({ storage: storage, language: lang, build: root.dataset.build || "", id: function () { return uid(window.crypto); } }); } catch (_) { model = null; }
    if (player && model) player.textContent = model.active().slice(-6).toUpperCase();
    function show() {
      if (status) status.textContent = say("feedback_unavailable");
      if (useDialog) { message.textContent = say(notes ? "feedback_unavailable_notes" : "feedback_unavailable"); confirm.hidden = notes; }
    }
    function voice(suspended) {
      var keepPaused = suspended || (game && game.getAttribute("data-playtest-paused") === "true") || !!document.querySelector("#pt-review-dialog[open]:not(.is-floating)");
      if (window.CommunityBuilders && typeof window.CommunityBuilders.suspendVoice === "function") window.CommunityBuilders.suspendVoice(keepPaused);
    }
    function start() {
      // Nothing typed here was saved. The next player gets new codes; this player's game stays saved on the device.
      empty();
      if (model && model.saved()) model.rotate();
      try { storage.removeItem(FILES_KEY); } catch (_) { /* The list belongs to the player who left. */ }
      window.location.reload();
    }
    function ask(from) {
      // Notes this player saved earlier that the team has not received wait for the form, which sends, deletes or keeps them.
      notes = !!model && model.entries().some(function (e) { return e.kind === "feedback" && hasContent(e) && !received(e); });
      if (!useDialog) { if (!notes && window.confirm(say("new_title"))) start(); return; }
      if (dialog.open) return;
      opener = from || document.activeElement; show(); dialog.showModal(); voice(true); cancel.focus();
    }
    if (useDialog) {
      cancel.addEventListener("click", function () { dialog.close(); });
      confirm.addEventListener("click", start);
      dialog.addEventListener("close", function () { voice(false); if (opener && typeof opener.focus === "function") opener.focus(); opener = null; });
    }
    [el("pt-feedback-new-player"), el("pt-feedback-new-player-top")].forEach(function (button) { if (button) button.addEventListener("click", function (event) { ask(event.currentTarget); }); });
    document.addEventListener("pg:language-change", function (event) { var next = event.detail && event.detail.language; if (next === "en" || next === "es") { lang = next; show(); } });
    show();
    var runtime = { model: model, requestNewPlayer: ask };
    window.PecanGroveFeedback = Object.assign({}, api, runtime);
    return runtime;
  }
  function eraseAll(storage, session) {
    var ok = true;
    [storage, session].forEach(function (area) {
      if (!area) return;
      try {
        var keys = [];
        for (var i = 0; i < area.length; i++) { var key = area.key(i); if (typeof key === "string" && key.indexOf("pecan-grove") === 0 && key !== ERASE_FLAG) keys.push(key); }
        keys.forEach(function (key) { area.removeItem(key); });
      } catch (_) { ok = false; }
    });
    return ok;
  }
  function finishErase(window) {
    // Repeat a just-confirmed erase before this page saves anything, in case the closing page saved once more.
    var session;
    try { session = window.sessionStorage; if (!session || session.getItem(ERASE_FLAG) !== "1") return; } catch (_) { return; }
    var storage = null; try { storage = window.localStorage; } catch (_) { storage = null; }
    eraseAll(storage, session);
    try { session.removeItem(ERASE_FLAG); } catch (_) { /* The flag only repeats an erase that already happened. */ }
  }
  function scopeSession(document, window) {
    var game = document.getElementById("community-builders");
    if (!game || game.getAttribute("data-feedback-session")) return;
    var storage;
    try { storage = window.localStorage; } catch (e) { return; }
    var lang = document.documentElement && document.documentElement.lang;
    var model = createModel({ storage: storage, language: lang === "es" ? "es" : "en", id: function () { return uid(window.crypto); } });
    if (!model.persist()) return;
    game.setAttribute("data-feedback-session", model.active());
    if (model.fresh) {
      try {
        var legacy = storage.getItem(GAME_KEY), scopedKey = GAME_KEY + ":" + model.active();
        if (legacy && !storage.getItem(scopedKey)) storage.setItem(scopedKey, legacy);
      } catch (e) { model.storageFailed(); }
    }
  }
  var api = { KEY: KEY, GAME_KEY: GAME_KEY, CONSENT_KEY: CONSENT_KEY, ERASE_FLAG: ERASE_FLAG, FILES_KEY: FILES_KEY, TRIES_KEY: TRIES_KEY, scrubPII: scrubPII, privacyFlags: privacyFlags, readConsent: readConsent, WORDS: WORDS, createModel: createModel, mergeEntries: mergeEntries, sendBatch: sendBatch, endpointAllowed: endpointAllowed, excel: excel, mount: mount, scopeSession: scopeSession, eraseAll: eraseAll, finishErase: finishErase };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  host.PecanGroveFeedback = api;
  if (host.document && host.document.getElementById && host.document.getElementById("community-builders")) {
    try { finishErase(host); } catch (e) { /* An unavailable session store has nothing left to erase. */ }
    try { scopeSession(host.document, host); } catch (e) { /* The form mount still scopes the session if storage is busy. */ }
  }
  if (host.document && host.document.getElementById("pt-feedback")) {
    // First-party static locales load before the singleton feedback form is mounted. A language that does not load
    // borrows the other one; with neither, the form is switched off and only Next player works.
    api.ready = Promise.allSettled(["en", "es"].map(function (language) {
      var path = "assets/playtest/locales/feedback-" + language + ".json";
      var mapped = host.PG_ASSET_MAP && host.PG_ASSET_MAP[path];
      return host.fetch(new URL(mapped || path, host.document.baseURI)).then(function (response) {
        if (!response.ok) throw Error("Feedback locale unavailable");
        return response.json();
      }).then(function (messages) { WORDS[language] = messages; });
    })).then(function () {
      if (!WORDS.en && !WORDS.es) throw Error("Feedback locales unavailable");
      ["en", "es"].forEach(function (language, i) { var other = i ? "en" : "es"; if (!WORDS[language]) { WORDS[language] = WORDS[other]; SPOKEN[language] = other; } });
      var runtime = mount(host.document, host);
      host.document.dispatchEvent(new host.CustomEvent("pg:feedback-ready"));
      return runtime;
    }).catch(function () {
      var root = host.document.getElementById("pt-feedback"), runtime = null;
      if (root) root.dataset.feedbackUnavailable = "true";
      try { runtime = unavailable(host.document, host); } catch (_) { /* The form stays as the page drew it. */ }
      host.document.dispatchEvent(new host.CustomEvent("pg:feedback-unavailable"));
      return runtime;
    });
  }
})(typeof window !== "undefined" ? window : globalThis);
