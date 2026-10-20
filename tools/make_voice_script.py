"""Build the voice script for Community Builders of Pecan Grove from the game's own words.

Every line is pulled from the game source, so the voice always says exactly what the screen shows.
Writes _handoff/voice/voice-script.json (for the audio generator) and "Voice script and casting.xlsx" (for review).

    python tools/make_voice_script.py
"""
import json, re, subprocess, sys
from pathlib import Path
from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill

ROOT = Path(__file__).resolve().parent.parent
G = ROOT / "assets/games/community-builders"
OUT = ROOT / "_handoff/voice"
OUT.mkdir(parents=True, exist_ok=True)

ES_HINT = re.compile(r"[áéíóúñ¿¡]|\b(el|la|los|las|una|que|para|toca|del|por|cada|ahora|pueblo|vecino)\b", re.I)


def pair(file, key, idx=None):
    """[en, es] for a key that appears once in each language block of a file (string or array element)."""
    s = (G / file).read_text(encoding="utf-8")
    if idx is None:
        vals = re.findall(r"\b" + key + r'\s*:\s*"((?:[^"\\]|\\.)*)"', s)
    else:
        vals = [re.findall(r'"((?:[^"\\]|\\.)*)"', a)[idx] for a in re.findall(r"\b" + key + r"\s*:\s*\[([^\]]*)\]", s)]
    vals = [v.replace('\\"', '"').replace("\\'", "'") for v in vals]
    es = [v for v in vals if ES_HINT.search(v)]
    en = [v for v in vals if not ES_HINT.search(v)]
    assert en and es, (file, key, vals[:4])
    return [en[0], es[0]]


class Joined(list):
    """[en, es] spoken as one clip, remembering the on-screen pieces it was built from."""
    parts = ()


class Title(list):
    """The spoken stop name. It is not on screen as its own line, so the player never matches on it."""


def join(*pairs):
    j = Joined([" ".join(p[0] for p in pairs), " ".join(p[1] for p in pairs)])
    j.parts = [p for p in pairs if not isinstance(p, Title)]
    return j


# stop names, from the shell
cb = (G / "cb.js").read_text(encoding="utf-8")
STOP = {int(i) + 1: [en, es] for i, (en, es) in enumerate(re.findall(r'\["[a-z-]+", "([^"]+)", "([^"]+)", \d\]', cb))}
assert len(STOP) == 15, len(STOP)


def title(n):
    end = lambda s: s if s.endswith("?") else s + "."           # "Fact or Rumor?" needs no extra full stop
    return Title(["Stop " + str(n) + ". " + end(STOP[n][0]), "Parada " + str(n) + ". " + end(STOP[n][1])])


# the neighbors' hopes and worries (Stop 3, and the Stop 2 worries), read by evaluating the SETS literal
i = cb.index("  var SETS = {"); j = cb.index("\n  };", i) + 4
sets = json.loads(subprocess.run(["node", "-e", "var SETS;" + cb[i:j].replace("var SETS", "SETS") + ";process.stdout.write(JSON.stringify(SETS))"],
                                 capture_output=True, text=True, encoding="utf-8").stdout)
NB = {"lee": ["Ms. Lee", "la Sra. Lee"], "johnson": ["Mr. Johnson", "el Sr. Johnson"], "ana": ["Mrs. Ana", "la Sra. Ana"],
      "ruth": ["Grandma Ruth", "la abuela Ruth"], "patel": ["Mr. Patel", "el Sr. Patel"], "jayden": ["Jayden", "Jayden"]}

L = []                                            # (id, stop, where, speaker, delivery, [en, es])
def add(cid, stop, where, who, how, text):
    # "match": the on-screen texts that start this clip in the game (each piece of a joined line, never the stop name)
    parts = getattr(text, "parts", None) or [text]
    L.append({"id": cid, "stop": stop, "where": where, "speaker": who, "delivery": how, "en": text[0], "es": text[1],
              "match": [[p[0], p[1]] for p in parts]})

WARM = "Warm, clear, unhurried; a friendly guide talking to an 8-year-old. Small smile in the voice."
TASK = "Clear and encouraging; slow down a little on what to tap."
add("g-intro", 0, "Title screen, after Start the journey", "Lucia", "Storyteller warmth; this is the opening of the game.", join(pair("cb.js", "intro1"), pair("cb.js", "intro2")))

add("s01-start", 1, "Stop 1 start screen", "Lucia", WARM, join(title(1), pair("stops/01-notice-the-signs.js", "lead"), pair("stops/01-notice-the-signs.js", "story")))
add("s01-past", 1, "Stop 1, 'Last month' view", "Lucia", TASK, pair("stops/01-notice-the-signs.js", "pastLine"))
add("s01-today", 1, "Stop 1, first look at 'Today'", "Lucia", TASK, join(pair("stops/01-notice-the-signs.js", "todayLine"), pair("stops/01-notice-the-signs.js", "todayMore")))

add("s02-start", 2, "Stop 2 start screen", "Lucia", WARM, join(title(2), pair("stops/02-ask-a-good-question.js", "intro1")))
for k, (en, es) in NB.items():
    esn = ("Convierte la preocupación de " + es + " en una pregunta clara. Toca una ficha en cada fila y luego toca Pregúntalo.").replace(" de el ", " del ")
    add("s02-coach-" + k, 2, "Stop 2, each worry: the instruction names whose worry it is", "Lucia", TASK,
        ["Turn " + en + "'s worry into a clear question. Tap one tile in each row, then tap Ask it.", esn])

add("s03-p1", 3, "Stop 3 part 1 (Listen)", "Lucia", WARM, join(title(3), pair("cb.js", "p1")))
add("s03-p2", 3, "Stop 3 part 2 (Find shared wishes)", "Lucia", TASK, pair("cb.js", "p2"))
add("s03-p3", 3, "Stop 3 part 3 (Who said this?)", "Lucia", TASK, pair("cb.js", "p3"))
for st in ("A", "B"):
    for k in NB:
        hope, _, worry, _ = sets[st][k]
        add(f"nb-{k}-{st}-hope", 3, f"Stop 3, tapping {NB[k][0]} (set {st}): the hope", k, "In character, sincere; a hope said with quiet warmth.", hope)
        add(f"nb-{k}-{st}-worry", 3, f"Stop 3 tap, and Stop 2 worry bubble ({NB[k][0]}, set {st})", k, "In character; a real worry, calm, never scared or angry.", worry)

add("s04-start", 4, "Stop 4 start screen", "Lucia", WARM, join(title(4), pair("cb.js", "intro")))
add("s04-how", 4, "Stop 4, each claim", "Lucia", TASK, pair("cb.js", "how"))
add("s05-start", 5, "Stop 5 start screen", "Lucia", WARM, join(title(5), pair("stops/05-map-what-could-change.js", "intro1"), pair("stops/05-map-what-could-change.js", "intro2")))
add("s05-q1", 5, "Stop 5, step 1 of each change", "Lucia", TASK, pair("stops/05-map-what-could-change.js", "q", 0))
add("s05-q2", 5, "Stop 5, step 2 of each change", "Lucia", TASK, pair("stops/05-map-what-could-change.js", "q", 1))
add("s06-start", 6, "Stop 6 start screen", "Lucia", WARM, join(title(6), pair("stops/06-who-decides.js", "intro")))
add("s06-who", 6, "Stop 6, each question", "Lucia", TASK, pair("stops/06-who-decides.js", "who"))
add("s07-start", 7, "Stop 7 start screen", "Lucia", WARM, join(title(7), pair("stops/07-speak-up-kindly.js", "intro")))
add("s07-build", 7, "Stop 7, building the postcard", "Lucia", TASK, join(pair("stops/07-speak-up-kindly.js", "lead"), pair("stops/07-speak-up-kindly.js", "tap")))
add("s07-who", 7, "Stop 7, step 2", "Lucia", TASK, pair("stops/07-speak-up-kindly.js", "who"))
add("s08-start", 8, "Stop 8 start screen", "Lucia", WARM, join(title(8), pair("stops/08-disagree-kindly.js", "intro")))
add("s08-c1", 8, "Stop 8, step 1", "Lucia", TASK, pair("stops/08-disagree-kindly.js", "coach1"))
add("s08-c2", 8, "Stop 8, step 2", "Lucia", TASK, pair("stops/08-disagree-kindly.js", "coach2"))
add("s09-start", 9, "Stop 9 start screen", "Lucia", WARM, join(title(9), pair("stops/09-include-every-voice.js", "intro")))
add("s09-instr", 9, "Stop 9, the room", "Lucia", TASK, pair("stops/09-include-every-voice.js", "instr"))
add("s10-start", 10, "Stop 10 start screen", "Lucia", WARM, join(title(10), pair("stops/10-match-a-fix.js", "intro1"), pair("stops/10-match-a-fix.js", "intro2"), pair("stops/10-match-a-fix.js", "oneOpen")))
add("s10-c1", 10, "Stop 10, pick a problem", "Lucia", TASK, pair("stops/10-match-a-fix.js", "coach1"))
add("s10-c2", 10, "Stop 10, then a fix", "Lucia", TASK, pair("stops/10-match-a-fix.js", "coach2"))
add("s11-start", 11, "Stop 11 start screen", "Lucia", WARM, join(title(11), pair("stops/11-weigh-the-tradeoffs.js", "intro", 0), pair("stops/11-weigh-the-tradeoffs.js", "intro", 1)))
add("s11-p1", 11, "Stop 11, part 1", "Lucia", TASK, pair("stops/11-weigh-the-tradeoffs.js", "p1"))
add("s11-q1", 11, "Stop 11, part 2 first question", "Lucia", TASK, pair("stops/11-weigh-the-tradeoffs.js", "q", 0))
add("s11-q2", 11, "Stop 11, part 2 second question", "Lucia", TASK, pair("stops/11-weigh-the-tradeoffs.js", "q", 1))
add("s11-p3", 11, "Stop 11, part 3", "Lucia", TASK, pair("stops/11-weigh-the-tradeoffs.js", "p3"))
add("s12-start", 12, "Stop 12 start screen", "Lucia", WARM, join(title(12), pair("stops/12-make-a-fair-deal.js", "intro1"), pair("stops/12-make-a-fair-deal.js", "intro2")))
add("s12-s1", 12, "Stop 12, step 1", "Lucia", TASK, pair("stops/12-make-a-fair-deal.js", "s1"))
add("s12-s3", 12, "Stop 12, step 3", "Lucia", TASK, pair("stops/12-make-a-fair-deal.js", "s3"))
add("s13-start", 13, "Stop 13 start screen", "Lucia", WARM, join(title(13), pair("stops/13-spread-the-word-right.js", "intro")))
add("s13-tap", 13, "Stop 13, building the poster", "Lucia", TASK, pair("stops/13-spread-the-word-right.js", "tap"))
add("s14-built", 14, "Stop 14 start screen (the town said yes, with changes)", "Lucia", WARM, join(title(14), pair("stops/14-keep-watch.js", "introBuilt"), pair("stops/14-keep-watch.js", "fair")))
add("s14-studying", 14, "Stop 14 start screen (the town said not now)", "Lucia", WARM, join(title(14), pair("stops/14-keep-watch.js", "introStudying"), pair("stops/14-keep-watch.js", "fair")))
add("s14-s1", 14, "Stop 14, step 1", "Lucia", TASK, pair("stops/14-keep-watch.js", "s1"))
add("s14-s2", 14, "Stop 14, step 2", "Lucia", TASK, pair("stops/14-keep-watch.js", "s2"))
add("s15-lucia1", 15, "Stop 15 start screen (Lucia speaks)", "Lucia", WARM, join(title(15), pair("stops/15-build-the-future-together.js", "lucia1")))
add("s15-theo1", 15, "Stop 15 start screen (Theo speaks)", "Theo", "Cheerful, steady, a 9-year-old proud to help.", pair("stops/15-build-the-future-together.js", "theo1"))
add("s15-plan", 15, "Stop 15, step 1", "Lucia", TASK, join(pair("stops/15-build-the-future-together.js", "plan"), pair("stops/15-build-the-future-together.js", "s1")))
add("s15-theo2", 15, "Stop 15, step 2 (Theo speaks)", "Theo", "Cheerful, steady.", pair("stops/15-build-the-future-together.js", "theo2"))
add("s15-lucia3", 15, "Stop 15, step 3 (Lucia speaks)", "Lucia", TASK, pair("stops/15-build-the-future-together.js", "lucia3"))

# added 11 Oct 2026 after the first play-test look: the in-play instructions that had no voice yet, and Ana's answers in Stop 12
def both(file, key):
    """[en, es] for a key that appears exactly twice in a file (English block first), for Spanish with no telltale accent."""
    vals = re.findall(r"\b" + key + r'\s*:\s*"((?:[^"\\]|\\.)*)"', (G / file).read_text(encoding="utf-8"))
    assert len(vals) == 2, (file, key, vals)
    return [v.replace('\\"', '"').replace("\\'", "'") for v in vals]
add("s01-review", 1, "Stop 1, the signs you did not find", "Lucia", TASK, pair("stops/01-notice-the-signs.js", "review"))
add("s02-fix", 2, "Stop 2, Fix my question", "Lucia", TASK, pair("stops/02-ask-a-good-question.js", "fixCoach"))
add("s08-found", 8, "Stop 8, after the first way that works for both", "Lucia", TASK, pair("stops/08-disagree-kindly.js", "foundOne"))
add("s10-down", 10, "Stop 10, then a fix (phone: the fixes are further down)", "Lucia", TASK, pair("stops/10-match-a-fix.js", "coach2Down"))
add("s10-open", 10, "Stop 10, the problem with no tested fix", "Lucia", TASK, pair("stops/10-match-a-fix.js", "openLink"))
add("s12-s2", 12, "Stop 12, step 2", "Lucia", TASK, pair("stops/12-make-a-fair-deal.js", "s2"))
add("s12-pick", 12, "Stop 12, step 2: a hard promise", "Lucia", TASK, pair("stops/12-make-a-fair-deal.js", "pickChange"))
add("nb-ana-deal-can", 12, "Stop 12, Mrs. Ana for the building crew: yes", "ana", "In character; glad and sure.", pair("stops/12-make-a-fair-deal.js", "can"))
add("nb-ana-deal-hard", 12, "Stop 12, Mrs. Ana for the building crew: hard", "ana", "In character; honest, friendly, open to a change.", pair("stops/12-make-a-fair-deal.js", "hard"))
add("nb-ana-deal-cant", 12, "Stop 12, Mrs. Ana for the building crew: can't promise", "ana", "In character; kind and sorry, never cold.", pair("stops/12-make-a-fair-deal.js", "cant"))
add("g-team1", 0, "Two-team play: Team 1 picks an animal", "Lucia", TASK, both("cb.js", "team1"))
add("g-team2", 0, "Two-team play: Team 2 picks an animal", "Lucia", TASK, both("cb.js", "team2"))

# the cast: who each voice is, what to listen for, where to look in ElevenLabs, and one line to audition with
CAST = [
    ("Lucia", "Lucía, the guide (most lines)", "Girl of 11, bilingual Latina; curious, kind, a little playful. Native Latin American Spanish AND clear American English.",
     "Voice Library → Language: Spanish (Latin American) and English · Age: Young · Gender: Female · Use case: Characters or Educational. Search: 'young girl', 'niña', 'joven latina', 'kid narrator bilingual'. Premade fallback to compare: Laura or Jessica (young American female) for English.",
     "g-intro"),
    ("Theo", "Theo, the second guide (Stop 15)", "Boy of 9; cheerful, steady, confident. He uses a wheelchair; the voice is just a happy kid.",
     "Voice Library → Age: Young · Gender: Male · Use case: Characters. Search: 'young boy', 'kid boy', 'niño'. Premade fallback: Liam or Will (young American male).",
     "s15-theo1"),
    ("lee", "Ms. Lee, clinic nurse", "Woman about 40; calm, caring, practical. Works nights.",
     "Search: 'warm caring woman', 'nurse', 'calm female 40s'; Spanish: 'mujer cálida 40 años'. Premade to compare: Matilda (friendly) or Sarah (soft).",
     "nb-lee-A-worry"),
    ("johnson", "Mr. Johnson, third-generation farmer", "Black American man about 65, Georgia; slow, warm, deep, grounded.",
     "Search: 'southern older man', 'warm grandfather', 'deep Black American male'; Spanish: 'hombre mayor voz grave cálida'. Premade to compare: Bill (old American male).",
     "nb-johnson-A-hope"),
    ("ana", "Mrs. Ana, master electrician", "Latina woman about 35; confident, practical, upbeat; a parent.",
     "Search: 'confident Latina woman', 'mujer latina segura 30s'; a bilingual voice is best. Premade to compare: Jessica.",
     "nb-ana-A-hope"),
    ("ruth", "Grandma Ruth, town historian", "Woman about 80; gentle storyteller, slow, a little humor.",
     "Search: 'grandmother storyteller', 'old woman warm', 'abuela narradora'.",
     "nb-ruth-B-hope"),
    ("patel", "Mr. Patel, bakery owner", "South Asian American man about 45; friendly, upbeat shopkeeper.",
     "Search: 'Indian American man friendly', 'warm male 40s'; Spanish: 'hombre amable 40 años'. Premade to compare: Eric or Chris.",
     "nb-patel-A-hope"),
    ("jayden", "Jayden, high-school tech lead", "Teen boy about 16; bright, quick, a bit of energy.",
     "Search: 'teen boy', 'young male energetic', 'adolescente'. Premade to compare: Will or Liam.",
     "nb-jayden-A-hope"),
]
lines = {l["id"]: l for l in L}
json.dump({"model_hint": "eleven_multilingual_v2", "lines": L, "cast": [c[0] for c in CAST]}, open(OUT / "voice-script.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)

wb = Workbook()
hdr = Font(bold=True, color="FFFFFF"); fill = PatternFill("solid", fgColor="163A30"); wrap = Alignment(wrap_text=True, vertical="top")
ws = wb.active; ws.title = "1 Cast and voice IDs"
ws.append(["Role id", "Character", "Who they are", "Where to look in ElevenLabs", "Audition line (English)", "Audition line (Spanish)", "Chosen English voice ID", "Chosen Spanish voice ID (or same)"])
for rid, name, who, where, sample in CAST:
    ws.append([rid, name, who, where, lines[sample]["en"], lines[sample]["es"], "", ""])
for c, w in zip("ABCDEFGH", (10, 26, 34, 52, 46, 46, 26, 26)): ws.column_dimensions[c].width = w
ws2 = wb.create_sheet("2 Script")
ws2.append(["Clip id", "Stop", "Where it plays", "Speaker", "Delivery", "English", "Spanish"])
for l in L: ws2.append([l["id"], l["stop"] or "title", l["where"], l["speaker"], l["delivery"], l["en"], l["es"]])
for c, w in zip("ABCDEFG", (18, 6, 34, 10, 34, 60, 60)): ws2.column_dimensions[c].width = w
ws3 = wb.create_sheet("3 Where voice plays")
for row in [
    ["What is voiced", "Why", "How it behaves"],
    ["The opening story (title screen)", "Sets the scene for kids who cannot read it all yet.", "Plays after the first tap (browsers block sound before a tap)."],
    ["Each stop's start screen: the stop name and its first line", "Every stop begins with a voice, so a pre-reader always knows where they are.", "Lucía reads it; tapping Start stops her."],
    ["The instruction each time a new task starts", "This is where first-time players got lost in the play-test; hearing it removes the reading barrier.", "Plays once per screen; a speaker button replays it."],
    ["Stop 3 neighbors' hopes and worries (and the Stop 2 worries)", "Listening is the skill in Stop 3, so the neighbors speak in their own voices.", "Plays when the player taps a neighbor."],
    ["Not voiced: feedback, buttons, score card, tips, cards", "They change every round and are short; voice there would be noise.", "Text only, as now."],
    ["Voice on or off", "Libraries are shared spaces; families decide.", "A 'Voice' button in the stop bar mutes or unmutes, remembered on the device. Voice is on by default."],
]: ws3.append(row)
for c, w in zip("ABC", (46, 60, 60)): ws3.column_dimensions[c].width = w
for sh in (ws, ws2, ws3):
    for cell in sh[1]: cell.font = hdr; cell.fill = fill
    for row in sh.iter_rows(min_row=2):
        for cell in row: cell.alignment = wrap
    sh.freeze_panes = "A2"
wb.save(OUT / "Voice script and casting.xlsx")
words = {s: sum(len(l["en"].split()) for l in L if l["speaker"] == s) for s in {l["speaker"] for l in L}}
print(len(L), "lines per language;", sum(len(l['en']) + len(l['es']) for l in L), "characters total (EN+ES);", "words by speaker (EN):", words)
