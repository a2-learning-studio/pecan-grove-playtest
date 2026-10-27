"""Write the printable educator sheets: educator.html (English), educador.html (Spanish) and educator.css.

Page 1 of each sheet fits one printed US Letter page; page 2 lists the outside sources for the game's real-world facts.
Every game fact comes from the game's own files: stop names, chapters, goals and "Try it for real" tasks from the
locale JSON, play modes from the core strings, and sources, checked dates and the corrections contact from
docs/fact-sources.json. The sheets have no script and a strict CSP. tools/make_playtest.py writes them next to the
game pages, and tools/build.mjs copies them into dist/.
"""
import html
import json
import re
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GAME = ROOT / "assets" / "games" / "community-builders"
FILES = {"en": "educator.html", "es": "educador.html"}
PLAY = {"en": "index.html", "es": "espanol.html"}
CSS_FILE = "educator.css"
# The empty data: icon stops browsers from asking the server for a missing /favicon.ico.
CSP = "default-src 'none'; style-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'none'; object-src 'none'"
STAMPS = {"sun": "b0001", "half": "b0002", "hour": "b0003", "seed": "b0004"}
DEBRIEF_STOPS = (4, 6, 11)
MONTHS = {
    "en": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October",
           "November", "December"],
    "es": ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre",
           "noviembre", "diciembre"],
}
TEXT = {
    "en": {
        "title": "{series}: educator sheet",
        "description": "One-page educator and facilitator sheet for {series}: learning goals, grouping, words to know "
                       "and the sources of its real-world facts.",
        "kicker": "Educator and facilitator sheet",
        "other": "Versión en español",
        "play": "Play",
        "ages": "For ages 8 to 14, with a grown-up",
        "stops": "15 stops in 4 chapters",
        "languages": "English and Spanish, with recorded voice",
        "goals_h": "Learning goals",
        "goals": "Each stop ends with a goal kids can say in their own words.",
        "chapter": "Chapter {n}: {name}",
        "time_h": "Time",
        "time": "We have not timed classroom play yet, so this sheet gives no minutes per stop. Each stop is one "
                "short round that ends with a score card, and kids can replay it for new examples. Plan time to talk "
                "after each stop, and tell us how long your group took (see Corrections).",
        "group_h": "Grouping",
        "with_grownup": "With a grown-up. Every stop ends with “{tryReal}”, a short task to do together.",
        "players": "Several players, one device. Open {library}, then {groups}. Each player picks an animal and "
                   "keeps their own scores on the {scoreboard}.",
        "teams": "Two teams. In the same place, choose {team}. Each team picks an animal and plays the same stop in "
                 "turn; then both score cards appear side by side.",
        "quiet": "A quiet room. {note}",
        "closeout": "To close out, the grown-up running the play-test opens {address} and confirms, to review "
                    "every player's notes or bring a player back.",
        "words_h": "Words to know",
        "data_center": "Data center",
        "boards": "Pecan Grove and its boards are made up. In Stop 6, kids match each question to one of these desks; "
                  "the stop's grown-up note says who decides in Georgia.",
        "debrief_h": "Try it for real",
        "debrief": "Each stop ends with a task to do with a grown-up. Three to start with:",
        "stop": "Stop {n}, {name}",
        "facts_h": "Facts and corrections",
        "facts": "Pecan Grove, its neighbors and its boards are made up. Stop 10's 16 fix cards name real places, and "
                 "some grown-up notes describe Georgia law. We checked them against official records, or news reports "
                 "of official actions, on {date}. Page 2 lists every source.",
        "corrections": "Corrections: if a fact has changed, or to tell us how long your group took, write to {email}.",
        "privacy": "Privacy:",
        "sources_h": "Sources for real-world facts",
        "sources": "Status on {date}. “Corrected” means we changed the game's words after the check.",
        "where": "Where",
        "says": "What the game says",
        "status": "Status",
        "source": "Sources",
        "s10": "Stop 10: {place}",
        "s10_says": "{note} Stamp: {stamp}.",
        "note": "Stop {n} grown-up note",
        "what": "Stop 1: {heading}",
        "statuses": {"confirmed": "Confirmed", "corrected": "Corrected", "partly-confirmed": "Partly confirmed",
                     "not-confirmed": "Not confirmed yet"},
        "unconfirmed": "We could not confirm this yet; it is under review.",
    },
    "es": {
        "title": "{series}: guía para educadores",
        "description": "Guía de una página para educadores y facilitadores de {series}: metas de aprendizaje, cómo "
                       "agrupar, palabras para saber y las fuentes de sus datos reales.",
        "kicker": "Guía para educadores y facilitadores",
        "other": "English version",
        "play": "Jugar",
        "ages": "Para niños de 8 a 14 años, con un adulto",
        "stops": "15 paradas en 4 capítulos",
        "languages": "Inglés y español, con voz grabada",
        "goals_h": "Metas de aprendizaje",
        "goals": "Cada parada termina con una meta que los niños pueden decir con sus propias palabras.",
        "chapter": "Capítulo {n}: {name}",
        "time_h": "Tiempo",
        "time": "Todavía no medimos cuánto dura el juego en clase, así que esta hoja no da minutos por parada. Cada "
                "parada es una ronda corta que termina con una tarjeta de puntaje, y los niños pueden repetirla con "
                "ejemplos nuevos. Dejen tiempo para conversar después de cada parada y cuéntennos cuánto tardó su "
                "grupo (vea Correcciones).",
        "group_h": "Cómo agrupar",
        "with_grownup": "Con un adulto. Cada parada termina con «{tryReal}», una tarea corta para hacer juntos.",
        "players": "Varios jugadores, un dispositivo. Abran {library} y luego {groups}. Cada jugador elige un animal y "
                   "guarda sus propios puntajes en la {scoreboard}.",
        "teams": "Dos equipos. En el mismo lugar, elijan {team}. Cada equipo elige un animal y juega la misma parada "
                 "por turnos; luego las dos tarjetas de puntaje aparecen lado a lado.",
        "quiet": "Un salón en silencio. {note}",
        "closeout": "Al terminar, el adulto que dirige la prueba abre {address} y confirma para revisar las notas "
                    "de todos o traer de vuelta a un jugador.",
        "words_h": "Palabras para saber",
        "data_center": "Centro de datos",
        "boards": "Pecan Grove y sus juntas son inventados. En la parada 6, los niños unen cada pregunta con uno de "
                  "estos escritorios; la nota para adultos de esa parada dice quién decide en Georgia.",
        "debrief_h": "Hazlo de verdad",
        "debrief": "Cada parada termina con una tarea para hacer con un adulto. Tres para empezar:",
        "stop": "Parada {n}, {name}",
        "facts_h": "Datos y correcciones",
        "facts": "Pecan Grove, sus vecinos y sus juntas son inventados. Las 16 tarjetas de soluciones de la parada 10 "
                 "nombran lugares reales, y algunas notas para adultos describen leyes de Georgia. Las revisamos con "
                 "registros oficiales o con noticias sobre acciones oficiales el {date}. La página 2 muestra cada fuente.",
        "corrections": "Correcciones: si un dato cambió, o para contarnos cuánto tardó su grupo, escriba a {email}.",
        "privacy": "Privacidad:",
        "sources_h": "Fuentes de los datos reales",
        "sources": "Estado al {date}. «Corregido» quiere decir que cambiamos las palabras del juego después de "
                   "revisar. Las fuentes están en inglés.",
        "where": "Dónde",
        "says": "Lo que dice el juego",
        "status": "Estado",
        "source": "Fuentes",
        "s10": "Parada 10: {place}",
        "s10_says": "{note} Sello: {stamp}.",
        "note": "Nota para adultos de la parada {n}",
        "what": "Parada 1: {heading}",
        "statuses": {"confirmed": "Confirmado", "corrected": "Corregido", "partly-confirmed": "Confirmado en parte",
                     "not-confirmed": "Aún sin confirmar"},
        "unconfirmed": "Todavía no pudimos confirmarlo; está en revisión.",
    },
}
CSS = """/* Educator sheet: one printed US Letter page, then the sources. No script; the page CSP allows only this file. */
:root { --ink: #1d1d1b; --muted: #55534e; --rule: #d8d4cc; --accent: #1e5a47; --panel: #f4f1ea; --bg: #ffffff; }
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 15px/1.45 system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
.page { max-width: 8.5in; margin: 0 auto; padding: 28px 16px 32px; }
header { border-bottom: 3px solid var(--accent); padding-bottom: 10px; margin-bottom: 14px; }
.kicker { margin: 0; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; color: var(--accent); font-weight: 700; }
h1 { margin: 2px 0 4px; font-size: 26px; line-height: 1.15; }
.lede { margin: 0; color: var(--muted); }
.facts { display: flex; flex-wrap: wrap; gap: 6px 18px; margin: 10px 0 0; padding: 0; list-style: none; font-weight: 600; }
.facts li::before { content: "\\25A0"; color: var(--accent); margin-right: 6px; font-size: 10px; vertical-align: 2px; }
.addr { margin: 8px 0 0; }
.addr a { font-weight: 600; overflow-wrap: anywhere; }
.cols { columns: 2 300px; column-gap: 26px; }
section { break-inside: avoid; margin: 0 0 12px; }
h2 { margin: 0 0 4px; font-size: 15px; color: var(--accent); text-transform: uppercase; letter-spacing: .04em; }
h3 { margin: 6px 0 2px; font-size: 13px; }
p { margin: 0 0 6px; }
ul, ol { margin: 0 0 6px; padding-left: 18px; }
li { margin: 0 0 3px; }
dl { margin: 0; }
dt { font-weight: 700; display: inline; }
dt::after { content: ": "; }
dd { display: inline; margin: 0; }
dd::after { content: ""; display: block; margin-bottom: 3px; }
.box { background: var(--panel); border-left: 3px solid var(--accent); padding: 8px 10px; }
footer { border-top: 1px solid var(--rule); margin-top: 6px; padding-top: 8px; font-size: 12.5px; color: var(--muted); }
footer p { margin: 0 0 4px; }
a { color: var(--accent); }
.sources { margin-top: 28px; padding-top: 14px; border-top: 3px solid var(--accent); }
.goals { list-style: none; padding-left: 0; }
table { width: 100%; border-collapse: collapse; font-size: .9em; }
th, td { text-align: left; vertical-align: top; padding: 4px; border-bottom: 1px solid var(--rule); }
.c-where { width: 15%; }
.c-says { width: 33%; }
.c-status { width: 12%; }
.c-source { width: 40%; }
.src { margin: 0 0 4px; }
.url { display: block; font: .85em ui-monospace, Consolas, "Courier New", monospace; color: var(--muted); overflow-wrap: anywhere; }
.table-wrap { overflow-x: auto; }
@media print {
  @page { size: letter; margin: 0.4in 0.45in; }
  body { font-size: 8.2pt; line-height: 1.2; font-family: Arial, Arimo, "Liberation Sans", Helvetica, sans-serif; }
  .page { max-width: none; padding: 0; }
  header { padding-bottom: 6px; margin-bottom: 7px; }
  h1 { font-size: 16pt; }
  h2 { font-size: 10pt; }
  h3 { font-size: 8.2pt; margin-top: 3px; }
  .cols { column-gap: 0.3in; }
  /* Sections may continue in the next column so both columns fill and the sheet stays on one page. */
  section { margin-bottom: 5px; break-inside: auto; }
  h2, h3 { break-after: avoid; }
  li, .box { break-inside: avoid; }
  p { margin-bottom: 4px; }
  ul, ol { padding-left: 14px; }
  li { margin-bottom: 0; }
  footer { font-size: 7pt; margin-top: 3px; padding-top: 4px; }
  footer p { margin-bottom: 2px; }
  a { color: var(--ink); text-decoration: none; }
  .box { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .sources { break-before: page; margin-top: 0; padding-top: 6px; }
  table { font-size: 7.5pt; }
  tr { break-inside: avoid; }
  .url { font: 6.5pt "Courier New", Cousine, "Liberation Mono", monospace; }
}
"""


def _json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def _lookup(data, key):
    for part in key.split("."):
        data = data[part]
    return data


def _plain(value):
    """A locale entry as text: plain strings stay as they are; templated entries keep their visible parts."""
    if isinstance(value, dict) and "$parts" in value:
        return "".join(value["$parts"])
    return value


def _ended(name):
    """A stop name as a lead-in: "Match a Fix." but "Fact or Rumor?" keeps its own mark."""
    return name if name[-1:] in "?!." else name + "."


def chapters_of_stops(catalog_source):
    """Chapter number of each stop, in order, read from data/catalog.js without running it."""
    found = re.findall(r'pair\("core","bank\.b00(\d\d)"\),\[(\d)\]', catalog_source)
    chapters = [int(chapter) for _, chapter in sorted(found)]
    if len(chapters) != 15:
        raise ValueError("Expected 15 stops with chapters in data/catalog.js")
    return chapters


def long_date(iso, lang):
    day = date.fromisoformat(iso)
    month = MONTHS[lang][day.month - 1]
    return f"{day.day} {month} {day.year}" if lang == "en" else f"{day.day} de {month} de {day.year}"


def short_date(value, lang):
    """Publication dates may be a day, a month or a year."""
    if not value:
        return ""
    parts = value.split("-")
    if len(parts) == 1:
        return parts[0]
    month = MONTHS[lang][int(parts[1]) - 1]
    if len(parts) == 2:
        return f"{month} {parts[0]}" if lang == "en" else f"{month} de {parts[0]}"
    return long_date(value, lang)


def content(lang, root=ROOT):
    """Everything a sheet shows, gathered from the game's files."""
    game = root / "assets" / "games" / "community-builders"
    locales = game / "locales" / lang
    core = _json(locales / "core.json")
    stops = []
    chapters = chapters_of_stops((game / "data" / "catalog.js").read_text(encoding="utf-8"))
    for n in range(1, 16):
        data = _json(locales / f"stop-{n:02d}.json")
        words = next(value for value in data.values() if isinstance(value, dict) and "real" in value)
        stops.append({
            "n": n,
            "name": core["bank"][f"b{n:04d}"],
            "chapter": chapters[n - 1],
            # Stops 8 and 12 show their takeaway on the score card; the others show their "I can" line.
            "goal": words.get("takeaway") or words["can"],
            "real": words["real"],
            "data": data,
        })
    return {"core": core, "shell": _json(root / "assets" / "playtest" / "locales" / f"{lang}.json"),
            "stops": stops, "register": _json(root / "docs" / "fact-sources.json")}


def source_rows(lang, register, stops):
    """Page 2: each real-world claim with the game's current words, its status and its sources."""
    t, e = TEXT[lang], html.escape
    stop10 = stops[9]["data"]
    rows = []
    for claim in register["claims"]:
        data = stops[int(claim["file"].split("-")[1]) - 1]["data"]
        if claim["id"].startswith("stop-10/"):
            place, note = (_lookup(stop10, key) for key in claim["keys"])
            where = t["s10"].format(place=place)
            says = t["s10_says"].format(note=note, stamp=_lookup(stop10, "bank." + STAMPS[claim["stamp"]]))
        elif claim["keys"] == ["T.what"]:
            where = t["what"].format(heading=data["T"]["whatH"])
            says = data["T"]["what"]
        else:
            n = int(claim["file"].split("-")[1])
            where = t["note"].format(n=n)
            says = " ".join(_plain(_lookup(data, key)) for key in claim["keys"])
        status = t["statuses"][claim["status"]] + ", " + long_date(claim["checked"], lang)
        if claim["status"] in {"partly-confirmed", "not-confirmed"}:
            status += ". " + t["unconfirmed"]
        cited = []
        for source_id in claim["sources"]:
            source = register["sources"][source_id]
            when = short_date(source.get("date", ""), lang)
            cited.append(
                f'<p class="src">{e(source["publisher"])}, <a href="{e(source["url"])}">{e(source["title"])}</a>'
                f'{", " + e(when) if when else ""}<span class="url">{e(source["url"])}</span></p>')
        rows.append(f'<tr><td>{e(where)}</td><td>{e(says)}</td><td>{e(status)}</td><td>{"".join(cited)}</td></tr>')
    return "\n".join(rows)


def social_tags(lang, title, description, site_url, image_alt):
    """The published play-test shares one preview card; each sheet keeps its own title, text and address."""
    e = lambda value: html.escape(value, quote=True)
    image = site_url + "social-preview.jpg"
    pairs = (("property", "og:type", "website"), ("property", "og:title", title),
             ("property", "og:description", description), ("property", "og:url", site_url + FILES[lang]),
             ("property", "og:image", image), ("property", "og:image:alt", image_alt),
             ("property", "og:locale", "en_US" if lang == "en" else "es_ES"), ("name", "description", description),
             ("name", "twitter:card", "summary_large_image"), ("name", "twitter:title", title),
             ("name", "twitter:description", description), ("name", "twitter:image", image),
             ("name", "twitter:image:alt", image_alt))
    return "\n".join(f'<meta {attr}="{name}" content="{e(value)}">' for attr, name, value in pairs)


def sheet(lang, flavor="playtest", privacy="", root=ROOT, site_url="", image_alt=""):
    """One sheet as HTML. privacy is the same privacy line the game page shows for this flavor."""
    c, t, e = content(lang, root), TEXT[lang], html.escape
    core, shell, stops, register = c["core"], c["shell"], c["stops"], c["register"]
    W, X = core["W"], core["X"]
    series = W["series"]
    title, description = t["title"].format(series=series), t["description"].format(series=series)
    social = "\n" + social_tags(lang, title, description, site_url, image_alt) if site_url else ""
    checked = long_date(max(claim["checked"] for claim in register["claims"]), lang)
    goals = []
    for number, name in enumerate(W["chapters"], start=1):
        items = "".join(f'<li><b>{s["n"]}. {e(_ended(s["name"]))}</b> {e(s["goal"])}</li>'
                        for s in stops if s["chapter"] == number)
        goals.append(f'<h3>{e(t["chapter"].format(n=number, name=name))}</h3><ul class="goals">{items}</ul>')
    grouping = [
        t["with_grownup"].format(tryReal=W["tryReal"]),
        t["players"].format(library=W["library"], groups=X["libraryGroups"], scoreboard=W["scoreboard"]),
        t["teams"].format(team=W["team"]),
        t["quiet"].format(note=X["libraryNote"]),
    ]
    if flavor == "playtest":
        grouping.append(shell["feedback_shared"])
    desks = stops[5]["data"]["bank"]
    words = [(t["data_center"], stops[0]["data"]["T"]["what"])] + [
        (desks[name], desks[line]) for name, line in
        (("b0008", "b0009"), ("b0011", "b0012"), ("b0014", "b0015"), ("b0016", "b0017"), ("b0018", "b0019"),
         ("b0020", "b0021"))]
    debrief = "".join(f'<li><b>{e(t["stop"].format(n=n, name=stops[n - 1]["name"]))}:</b> {e(stops[n - 1]["real"])}</li>'
                      for n in DEBRIEF_STOPS)
    email = register["corrections"]["email"]
    other = "es" if lang == "en" else "en"
    address = f'<a href="{PLAY[lang]}">{e(site_url + PLAY[lang] if site_url else PLAY[lang])}</a>'
    # Copies with the feedback panel name the grown-up close-out view's address switch beside their privacy line.
    closeout = " " + t["closeout"].format(address=PLAY[lang] + "?closeout=1") if flavor in ("playtest", "library") else ""
    privacy_line = f'<p><b>{e(t["privacy"])}</b> {e(privacy + closeout)}</p>' if privacy else ""
    return f"""<!doctype html>
<html lang="{lang}">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="{CSP}">
<meta name="referrer" content="no-referrer">
<meta name="robots" content="noindex, nofollow">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(title)}</title>{social}
<link rel="icon" href="data:,">
<link rel="stylesheet" href="{CSS_FILE}">
</head>
<body>
<main class="page">
  <div class="sheet">
  <header>
    <p class="kicker">{e(t["kicker"])}</p>
    <h1>{e(series)}</h1>
    <p class="lede">{e(shell["lead"])}</p>
    <ul class="facts">
      <li>{e(t["ages"])}</li>
      <li>{e(t["stops"])}</li>
      <li>{e(t["languages"])}</li>
    </ul>
    <p class="addr"><b>{e(t["play"])}:</b> {address} &middot; <a href="{FILES[other]}" lang="{other}" hreflang="{other}">{e(t["other"])}</a></p>
  </header>
  <div class="cols">
    <section>
      <h2>{e(t["goals_h"])}</h2>
      <p>{e(t["goals"])}</p>
      {"".join(goals)}
    </section>
    <section>
      <h2>{e(t["time_h"])}</h2>
      <p>{e(t["time"])}</p>
    </section>
    <section>
      <h2>{e(t["group_h"])}</h2>
      <ul>{"".join(f"<li>{e(item)}</li>" for item in grouping)}</ul>
    </section>
    <section>
      <h2>{e(t["words_h"])}</h2>
      <p>{e(t["boards"])}</p>
      <dl>{"".join(f"<dt>{e(term)}</dt><dd>{e(meaning)}</dd>" for term, meaning in words)}</dl>
    </section>
    <section class="box">
      <h2>{e(t["debrief_h"])}</h2>
      <p>{e(t["debrief"])}</p>
      <ul>{debrief}</ul>
    </section>
    <section>
      <h2>{e(t["facts_h"])}</h2>
      <p>{e(t["facts"].format(date=checked))}</p>
      <p>{e(t["corrections"].split("{email}")[0])}<a href="mailto:{e(email)}">{e(email)}</a>{e(t["corrections"].split("{email}")[1])}</p>
    </section>
  </div>
  <footer>
    {privacy_line}
    <p><b>{e(shell["team"])}.</b> {e(W["footer"])}</p>
    <p>{e(shell["independent"])} {e(shell["fellowship"])}</p>
  </footer>
  </div>
  <section class="sources" aria-labelledby="sources-h">
    <h2 id="sources-h">{e(t["sources_h"])}</h2>
    <p>{e(t["sources"].format(date=checked))}</p>
    <div class="table-wrap"><table>
      <thead><tr><th scope="col" class="c-where">{e(t["where"])}</th><th scope="col" class="c-says">{e(t["says"])}</th><th scope="col" class="c-status">{e(t["status"])}</th><th scope="col" class="c-source">{e(t["source"])}</th></tr></thead>
      <tbody>
{source_rows(lang, register, stops)}
      </tbody>
    </table></div>
  </section>
</main>
</body>
</html>
"""


def write_sheets(out, flavor="playtest", privacy=None, site_url="", image_alt=None):
    """Write both sheets and their stylesheet into a generated site folder."""
    out = Path(out)
    (out / CSS_FILE).write_text(CSS, encoding="utf-8", newline="\n")
    for lang, name in FILES.items():
        text = sheet(lang, flavor, (privacy or {}).get(lang, ""), site_url=site_url,
                     image_alt=(image_alt or {}).get(lang, ""))
        (out / name).write_text(text, encoding="utf-8", newline="\n")
    return [CSS_FILE, *FILES.values()]
