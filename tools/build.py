"""Know Your Data Center - static site generator.

Reads content/{en,es}/*.md (JSON front matter between '---json' and '---', Markdown body),
renders templates/base.html, and writes plain HTML to docs/ for GitHub Pages.
Also writes sitemap.xml (with hreflang alternates), robots.txt, llms.txt, 404.html, CNAME, .nojekyll,
then checks internal links, language pairs and length limits.

Run:  python -I tools/build.py          (from the site folder)

Hub-only: this copy is kept for the Know Your Data Center hub project and is not part of the Pecan Grove build, tests
or CI. It empties docs/ before writing, and in this repository docs/ holds review records, so it refuses to run
unless the hub's content/ and templates/ folders are present. Build the game with `npm run build`.
"""
import html
import json
import re
import shutil
import sys
from datetime import date
from pathlib import Path

if __name__ == "__main__":
    _site = Path(__file__).resolve().parent.parent
    if not ((_site / "content").is_dir() and (_site / "templates" / "base.html").is_file()):
        sys.exit("tools/build.py is the Know Your Data Center hub generator and empties docs/. This folder has no "
                 "content/ or templates/, so nothing was changed. Build the game with: npm run build")

import markdown
from jinja2 import Environment, FileSystemLoader, select_autoescape

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"
OUT = ROOT / "docs"
SITE_URL = "https://www.knowyourdatacenter.org"
PUBLISHED = "2026-10-20"

UI = {
    "en": {
        "site": "Know Your Data Center", "home_path": "/", "other_lang": "Español",
        "skip": "Skip to main content", "nav_label": "Main", "footer_nav": "More", "menu": "Menu",
        "short_answer": "Short answer", "key_points": "Key points", "last_checked": "Last checked",
        "edition": "First edition, 20 Oct 2026", "faq": "Common questions", "sources": "Sources",
        "accessed": "Accessed", "primary": "Primary source", "related": "Keep reading", "toc": "On this page",
        "independent": "Know Your Data Center is an independent educational project by A2 Learning Studio, "
                       "drawing on construction research at Kennesaw State University. Views are the author's own. It is not an "
                       "official publication of Kennesaw State University or the Fulton County Library System, and it "
                       "is not for or against any project.",
        "fellowship": "A2 Learning Studio includes a 2026 Google Higher Ed Faculty AI Fellow. Google does not pay for, review or "
                      "approve anything on this site.",
        "license": "Text CC BY 4.0. No ads, no sign-up, no tracking cookies.",
        "play": "Play the game", "play_path": "/kids/community-builders/", "panel_short": "Library panel · 27 Oct", "panel_path": "/panel/",
        "gc_title": "Community Builders of Pecan Grove", "gc_meta": "A free town game for kids 8 to 14, with a grown-up. 15 short stops. No sign-up.",
        "gc_alt": "Painted map of Pecan Grove, a made-up Georgia town with farms, a main street and a creek",
        "gc_chapters": ["Notice and understand", "Speak up well", "Find solutions", "Stay involved"],
        "signpost": "Here with kids? Play Community Builders, a free town game for ages 8 to 14.",
        "translation": "", "breadcrumb": "Breadcrumb",
    },
    "es": {
        "site": "Know Your Data Center", "home_path": "/es/", "other_lang": "English",
        "skip": "Saltar al contenido principal", "nav_label": "Principal", "footer_nav": "Más", "menu": "Menú",
        "short_answer": "Respuesta corta", "key_points": "Puntos clave", "last_checked": "Última revisión",
        "edition": "Primera edición, 20 de octubre de 2026", "faq": "Preguntas frecuentes", "sources": "Fuentes",
        "accessed": "Consultado el", "primary": "Fuente primaria", "related": "Siga leyendo", "toc": "En esta página",
        "independent": "Know Your Data Center es un proyecto educativo independiente de A2 Learning Studio, "
                       "inspirado en investigación de construcción en Kennesaw State University. Las opiniones son del autor. No es una "
                       "publicación oficial de Kennesaw State University ni del Sistema de Bibliotecas del Condado de "
                       "Fulton, y no está a favor ni en contra de ningún proyecto.",
        "fellowship": "A2 Learning Studio incluye a un becario 2026 del programa Google Higher Ed Faculty AI Fellowship. Google no "
                      "paga, no revisa ni aprueba nada de este sitio.",
        "license": "Texto con licencia CC BY 4.0. Sin anuncios, sin registro y sin cookies de seguimiento.",
        "play": "Jugar", "play_path": "/es/ninos/constructores-de-comunidad/", "panel_short": "Panel en la biblioteca · 27 de oct.", "panel_path": "/es/panel/",
        "gc_title": "Constructores de comunidad de Pecan Grove", "gc_meta": "Un juego gratis sobre un pueblo, para niños de 8 a 14 años, con un adulto. 15 paradas cortas. Sin registro.",
        "gc_alt": "Mapa pintado de Pecan Grove, un pueblo inventado de Georgia con granjas, una calle principal y un arroyo",
        "gc_chapters": ["Observa y entiende", "Habla bien", "Busca soluciones", "Sigue participando"],
        "signpost": "¿Vino con niños? Jueguen Constructores de comunidad, un juego gratis para niños de 8 a 14 años.",
        "translation": "Traducción en revisión por un hablante nativo.", "breadcrumb": "Ruta de navegación",
    },
}

NAV = {
    "en": [("/questions-to-ask/", "Questions to ask"), ("/what-could-change/", "What could change"),
           ("/power-bill/", "Power bill"), ("/water/", "Water"), ("/georgia/who-decides/", "Who decides"),
           ("/jobs/how-many/", "Jobs"), ("/who-pays-who-benefits/", "Who pays"),
           ("/kids/what-is-a-data-center/", "For kids")],
    "es": [("/es/preguntas/", "Preguntas"), ("/es/que-podria-cambiar/", "Qué podría cambiar"),
           ("/es/factura-de-luz/", "Factura de luz"), ("/es/agua/", "Agua"),
           ("/es/georgia/quien-decide/", "Quién decide"), ("/es/empleos/cuantos/", "Empleos"),
           ("/es/quien-paga-quien-se-beneficia/", "Quién paga"),
           ("/es/ninos/que-es-un-centro-de-datos/", "Para niños")],
}
MENU = {
    "en": [("Start here", [("/", "Home"), ("/questions-to-ask/", "Questions to ask"), ("/panel/", "Library panel, 27 Oct")]),
           ("Topics", [("/what-could-change/", "What could change"), ("/power-bill/", "Power bill"), ("/water/", "Water"),
                       ("/georgia/who-decides/", "Who decides"), ("/jobs/how-many/", "Jobs"), ("/who-pays-who-benefits/", "Who pays, who benefits")]),
           ("Kids and families", [("/kids/community-builders/", "Play Community Builders"), ("/kids/what-is-a-data-center/", "Read: What is a data center?")]),
           ("", [("/about/", "About and corrections")])],
    "es": [("Para empezar", [("/es/", "Inicio"), ("/es/preguntas/", "Preguntas para una audiencia pública"), ("/es/panel/", "Panel en la biblioteca, 27 de oct.")]),
           ("Temas", [("/es/que-podria-cambiar/", "Qué podría cambiar"), ("/es/factura-de-luz/", "Factura de luz"), ("/es/agua/", "Agua"),
                      ("/es/georgia/quien-decide/", "Quién decide"), ("/es/empleos/cuantos/", "Empleos"), ("/es/quien-paga-quien-se-beneficia/", "Quién paga y quién se beneficia")]),
           ("Niños y familias", [("/es/ninos/constructores-de-comunidad/", "Juega Constructores de comunidad"), ("/es/ninos/que-es-un-centro-de-datos/", "Lee: ¿Qué es un centro de datos?")]),
           ("", [("/es/acerca/", "Acerca de y correcciones")])],
}
SECTION = {"/kids/what-is-a-data-center/": ("/kids/",), "/es/ninos/que-es-un-centro-de-datos/": ("/es/ninos/",)}   # nav item -> path prefixes it owns
QICON = {  # authored 24-grid line icons for the six question cards
    "power": '<path d="M13 3 6 13h5l-1 8 7-10h-5l1-8z"/>',
    "water": '<path d="M12 3.5c3 4 6 7.2 6 10.5a6 6 0 0 1-12 0c0-3.3 3-6.5 6-10.5z"/>',
    "decides": '<path d="M4 9.5 12 5l8 4.5M5.5 10v7M10 10v7M14 10v7M18.5 10v7M4 19.5h16"/>',
    "pays": '<path d="M12 4v15M7 19.5h10M5 7.5h14M7.5 7.5 4.5 13a3 3 0 0 0 6 0zM16.5 7.5l-3 5.5a3 3 0 0 0 6 0z"/>',
    "jobs": '<path d="M4 18.5V17a8 8 0 0 1 16 0v1.5zM9.5 9.5V6.5a2.5 2.5 0 0 1 5 0v3M3 18.5h18"/>',
    "change": '<circle cx="12" cy="12" r="8.5"/><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8z"/>',
}
QMAP = {"/power-bill/": "power", "/es/factura-de-luz/": "power", "/water/": "water", "/es/agua/": "water",
        "/georgia/who-decides/": "decides", "/es/georgia/quien-decide/": "decides", "/who-pays-who-benefits/": "pays",
        "/es/quien-paga-quien-se-beneficia/": "pays", "/jobs/how-many/": "jobs", "/es/empleos/cuantos/": "jobs",
        "/what-could-change/": "change", "/es/que-podria-cambiar/": "change"}
FOOTER_NAV = {
    "en": [("/about/", "About and corrections"), ("/panel/", "Library panel, 27 Oct"), ("/", "Home")],
    "es": [("/es/acerca/", "Acerca de y correcciones"), ("/es/panel/", "Panel en la biblioteca, 27 de oct."),
           ("/es/", "Inicio")],
}
MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
MONTHS_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre",
             "octubre", "noviembre", "diciembre"]
FM_RE = re.compile(r"^---json\s*\n(.*?)\n---\s*\n(.*)$", re.S)
CITE_RE = re.compile(r"\[(S\d+(?:\s*[,;]\s*S\d+)*)\]")
GAME_MARK = "<!-- game:every-house-a-node -->"
CB_MARK = "<!-- game:community-builders -->"
CB_HTML = {
    "en": '<div class="cb" id="community-builders" data-game="community-builders" data-base="/assets/games/community-builders/"><noscript><p>This game needs JavaScript. Ask a grown-up to turn it on.</p></noscript></div>',
    "es": '<div class="cb" id="constructores-de-comunidad" data-game="community-builders" data-base="/assets/games/community-builders/"><noscript><p>Este juego necesita JavaScript. Pídele a un adulto que lo active.</p></noscript></div>',
}
ERRORS, WARNINGS = [], []


def human_date(iso, lang):
    d = date.fromisoformat(iso)
    return f"{d.day} {MONTHS_EN[d.month - 1]} {d.year}" if lang == "en" else f"{d.day} de {MONTHS_ES[d.month - 1]} de {d.year}"


def load_pages():
    pages = []
    for lang in ("en", "es"):
        for f in sorted((CONTENT / lang).glob("*.md")):
            m = FM_RE.match(f.read_text(encoding="utf-8"))
            if not m:
                ERRORS.append(f"{f.name}: no JSON front matter")
                continue
            fm = json.loads(m.group(1))
            fm["_body"], fm["_file"] = m.group(2), f"{lang}/{f.name}"
            pages.append(fm)
    return pages


def link_cites(fragment, source_ids, where):
    def rep(m):
        out = []
        for sid in re.split(r"\s*[,;]\s*", m.group(1)):
            if sid not in source_ids:
                WARNINGS.append(f"{where}: cites {sid} but it is not in sources")
            out.append(f'<sup class="kydc-cite"><a href="#src-{sid}">[{sid}]</a></sup>')
        return "".join(out)
    return CITE_RE.sub(rep, fragment)


def inline_md(text):
    """Markdown for one short field (answer, key point, FAQ answer) without a wrapping <p>."""
    h = markdown.markdown(text)
    return re.sub(r"^<p>(.*)</p>$", r"\1", h.strip(), flags=re.S)


GAME_HTML = {
    "en": """<section class="kydc-game" id="every-house-a-node" data-game="every-house-a-node" aria-labelledby="game-title">
<div class="kydc-game__top"><h3 class="kydc-game__title" id="game-title">Every House a Node</h3>
<div class="kydc-game__btns"><button type="button" data-act="again">Play again</button></div></div>
<p class="kydc-game__intro">The library needs a computer to make tonight's movie. Can our street build one together? Tap a house to ask.</p>
<div class="kydc-game__stage" data-stage><noscript><p>This small game needs JavaScript. In words: six homes each host a small computer box. Together they make the library's movie. When one family unplugs, another house helps, and the movie keeps going. Each home keeps the heat for warm water.</p></noscript></div>
</section>""",
    "es": """<section class="kydc-game" id="cada-casa-un-nodo" data-game="every-house-a-node" aria-labelledby="game-title">
<div class="kydc-game__top"><h3 class="kydc-game__title" id="game-title">Cada casa, un nodo</h3>
<div class="kydc-game__btns"><button type="button" data-act="again">Jugar otra vez</button></div></div>
<p class="kydc-game__intro">La biblioteca necesita una computadora para hacer la película de esta noche. ¿La armamos entre toda la calle? Toca una casa para preguntar.</p>
<div class="kydc-game__stage" data-stage><noscript><p>Este juego pequeño necesita JavaScript. En palabras: seis casas tienen cada una una cajita de computadora. Juntas hacen la película de la biblioteca. Cuando una familia la desconecta, otra casa ayuda y la película sigue. Cada casa se queda con el calor para el agua caliente.</p></noscript></div>
</section>""",
}


def render_body(p, source_ids):
    md = markdown.Markdown(extensions=["tables", "toc", "sane_lists"], extension_configs={"toc": {"slugify": slug}})
    body = p["_body"]
    has_game = GAME_MARK in body
    has_cb = CB_MARK in body
    body = body.replace(CB_MARK, "\n\nKYDCCBMARKER\n\n")
    body = body.replace(GAME_MARK, "\n\nKYDCGAMEMARKER\n\n")
    h = md.convert(body)
    toc = [(t["id"], t["name"]) for t in md.toc_tokens]
    h = h.replace("<p>KYDCGAMEMARKER</p>", GAME_HTML[p["lang"]])
    h = h.replace("<p>KYDCCBMARKER</p>", CB_HTML[p["lang"]])
    h = re.sub(r"<table>", '<div class="kydc-table-wrap"><table>', h)
    h = h.replace("</table>", "</table></div>")
    h = link_cites(h, source_ids, p["_file"])
    if p["id"] == "home":
        h = home_cards(h, p["_file"])
    return h, (has_game, has_cb), toc


def home_cards(h, where):
    """Six questions -> a grid of one-link cards; Find your way in -> door cards. Both from the Markdown already on the page."""
    m = re.search(r'(<h2[^>]*>(?:Six questions|Seis preguntas)[^<]*</h2>\s*)<ol>(.*?)</ol>', h, re.S)
    if not m:
        ERRORS.append(f"{where}: six-questions list not found")
        return h
    cards = []
    for li in re.findall(r"<li>(.*?)</li>", m.group(2), re.S):
        a = re.match(r'\s*<strong><a href="([^"]+)">(.*?)</a></strong>\s*(.*)$', li, re.S)
        if not a:
            ERRORS.append(f"{where}: a six-questions item is not 'link + teaser'")
            continue
        href, q, rest = a.groups()
        teaser = re.sub(r'\s*<sup class="kydc-cite">.*?</sup>', "", rest).strip()   # the destination page carries the sources
        if "<a " in teaser:
            ERRORS.append(f"{where}: a question card teaser holds a second link")
        icon = QICON[QMAP.get(href, "change")]
        card = (f'<li><a href="{href}"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">{icon}</svg>'
                f'<span class="kydc-q__q">{q}</span><span class="kydc-q__t">{teaser}</span></a></li>')
        if card.count("<a ") != 1:
            ERRORS.append(f"{where}: a question card must hold exactly one link")
        cards.append(card)
    h = h[:m.start()] + m.group(1) + '<ul class="kydc-qgrid">' + "".join(cards) + "</ul>" + h[m.end():]
    d = re.search(r'(<h2[^>]*>(?:Find your way in|Encuentre lo que busca)</h2>)(.*?)(?=<h2)', h, re.S)
    if not d:
        ERRORS.append(f"{where}: find-your-way-in section not found")
        return h
    groups = re.findall(r'(<h3[^>]*>.*?</h3>)\s*(<ul>.*?</ul>)(?=\s*(?:<h3|<blockquote|$))', d.group(2), re.S)
    rest = re.sub(r'<h3[^>]*>.*?</h3>\s*<ul>.*?</ul>(?=\s*(?:<h3|<blockquote|$))', "", d.group(2), flags=re.S).strip()
    doors = []
    for head, ul in groups:
        kid = re.search(r"(?i)kids|niños", head)
        faces = ('<div class="kydc-door__faces" aria-hidden="true">' + "".join(
            f'<img src="/assets/games/community-builders/img/{n}.webp" alt="" width="64" height="64" loading="lazy">' for n in ("jayden", "ana", "ms-lee")) + "</div>") if kid else ""
        # a row that opens with its only link becomes one tap target; rows with prose first or several links stay plain
        ul = re.sub(r"<li>(?=<a )(?:(?!</li>).)*</li>",
                    lambda li: li.group(0).replace("<li>", '<li class="is-go">', 1) if li.group(0).count("<a ") == 1 else li.group(0), ul, flags=re.S)
        doors.append(f'<section class="kydc-door{" kydc-door--kids" if kid else ""}">{faces}{head}{ul}</section>')
    h = h[:d.start()] + d.group(1) + '<div class="kydc-doors">' + "".join(doors) + "</div>" + rest + h[d.end():]
    return h


def slug(value, separator="-"):
    value = value.lower()
    value = (value.replace("á", "a").replace("é", "e").replace("í", "i").replace("ó", "o").replace("ú", "u")
             .replace("ñ", "n").replace("ü", "u"))
    value = re.sub(r"[^a-z0-9\s-]", "", value)
    return re.sub(r"[\s-]+", separator, value).strip(separator)


def jsonld(p, by_path):
    page_type = {"FAQPage": "WebPage", "Article": "Article"}.get(p.get("schema"), "WebPage")
    author = {"@type": "Organization", "@id": f"{SITE_URL}/about/#author", "name": "A2 Learning Studio"}
    node = {"@type": page_type, "@id": f"{SITE_URL}{p['path']}#page", "url": f"{SITE_URL}{p['path']}",
            "name": p["title"], "headline": p["h1"], "description": p["description"], "inLanguage": p["lang"],
            "datePublished": PUBLISHED, "dateModified": p["last_checked"], "author": {"@id": author["@id"]},
            "publisher": {"@id": author["@id"]}, "isPartOf": {"@id": f"{SITE_URL}/#website"},
            "isAccessibleForFree": True, "license": "https://creativecommons.org/licenses/by/4.0/"}
    alt = by_path.get(p["alt_path"])
    if alt:
        key = "translationOfWork" if p["lang"] == "es" else "workTranslation"
        node[key] = {"@id": f"{SITE_URL}{alt['path']}#page"}
    if p.get("sources"):
        node["citation"] = [s["url"] for s in p["sources"] if s.get("url")][:40]
    graph = [{"@type": "WebSite", "@id": f"{SITE_URL}/#website", "url": f"{SITE_URL}/", "name": "Know Your Data Center",
              "inLanguage": ["en", "es"], "publisher": {"@id": author["@id"]}}, author, node]
    if p.get("faq"):
        graph.append({"@type": "FAQPage", "@id": f"{SITE_URL}{p['path']}#faq", "inLanguage": p["lang"],
                      "mainEntity": [{"@type": "Question", "name": f["q"],
                                      "acceptedAnswer": {"@type": "Answer", "text": re.sub(r"\[S\d+[^\]]*\]", "", f["a"]).strip()}}
                                     for f in p["faq"]]})
    if p["id"] == "panel":
        graph.append({"@type": "Event", "name": "Data centers panel, Fulton County Library System" if p["lang"] == "en"
                      else "Panel sobre centros de datos, Sistema de Bibliotecas del Condado de Fulton",
                      "startDate": "2026-10-27", "eventStatus": "https://schema.org/EventScheduled",
                      "isAccessibleForFree": True, "url": f"{SITE_URL}{p['path']}"})
    return json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False).replace("</", "<\\/")


def build():
    pages = load_pages()
    by_path = {p["path"]: p for p in pages}
    env = Environment(loader=FileSystemLoader(ROOT / "templates"), autoescape=select_autoescape(["html"]))
    tpl = env.get_template("base.html")
    OUT.mkdir(exist_ok=True)
    for child in OUT.iterdir():  # empty docs/ in place (OneDrive can lock the folder itself)
        if child.is_dir():
            shutil.rmtree(child, ignore_errors=True)
        else:
            child.unlink(missing_ok=True)
    (OUT / "assets").mkdir(parents=True, exist_ok=True)
    shutil.copytree(ROOT / "assets", OUT / "assets", dirs_exist_ok=True)
    if (ROOT / "downloads").exists():
        shutil.copytree(ROOT / "downloads", OUT / "downloads", dirs_exist_ok=True)

    for p in pages:
        lang = p["lang"]
        where = p["_file"]
        if p["alt_path"] not in by_path:
            ERRORS.append(f"{where}: alt_path {p['alt_path']} has no page")
        elif by_path[p["alt_path"]]["alt_path"] != p["path"]:
            ERRORS.append(f"{where}: language pair does not point back")
        if len(p["title"]) > 60:
            WARNINGS.append(f"{where}: title {len(p['title'])} chars (> 60)")
        if len(p["description"]) > 160:
            WARNINGS.append(f"{where}: description {len(p['description'])} chars (> 160)")
        source_ids = {s["id"] for s in p.get("sources", [])}
        body_html, (has_game, has_cb), toc = render_body(p, source_ids)
        stage_html = ""
        if has_cb:  # the game is the page: it sits right under the heading, the text follows
            body_html = body_html.replace(CB_HTML[lang], "", 1)
            stage_html = CB_HTML[lang]
        notices, translation = [], False
        for n in ([p["notice"]] if p.get("notice") else []) + p.get("notices", []):
            if n == UI[lang]["translation"]:
                translation = True                       # "translation in review" lives in the meta line, not a box
                continue
            notices.append({"kind": "freeze" if re.search(r"(?i)frozen|congelad|election|elecci", n) else "info", "text": n})
        en_path = p["path"] if lang == "en" else p["alt_path"]
        ctx = dict(
            p=p, ui=UI[lang], site_url=SITE_URL, alt_lang="es" if lang == "en" else "en", en_path=en_path,
            nav=[{"path": a, "label": b, "current": p["path"] == a or any(p["path"].startswith(x) for x in SECTION.get(a, ()))} for a, b in NAV[lang]],
            menu=[{"label": g, "links": [{"path": a, "label": b, "current": p["path"] == a, "play": a == UI[lang]["play_path"]} for a, b in items]} for g, items in MENU[lang]],
            panel_link=date.today() <= date(2026, 10, 28) and p["id"] != "panel",
            promo=p.get("promo"), hero_actions=p.get("hero_actions", []), breadcrumb=p.get("breadcrumb", []), translation=translation,
            footer_nav=[{"path": a, "label": b} for a, b in FOOTER_NAV[lang]],
            notices=notices, stage_html=stage_html,
            answer_html=link_cites(inline_md(p["answer"]), source_ids, where),
            key_points_html=[link_cites(inline_md(k), source_ids, where) for k in p.get("key_points", [])],
            faq_html=[{"q": f["q"], "a": link_cites(inline_md(f["a"]), source_ids, where)} for f in p.get("faq", [])],
            body_html=body_html, has_game=has_game, has_cb=has_cb, toc=toc if len(toc) >= 3 and p["id"] not in ("home", "kids-community-builders") else [], last_checked_human=human_date(p["last_checked"], lang),
            related=[{"path": r, "title": by_path[r]["h1"]} for r in p.get("related", []) if r in by_path],
            jsonld=jsonld(p, by_path), og_image=(ROOT / "assets" / "img" / "og-card.png").exists(),
        )
        for r in p.get("related", []):
            if r not in by_path:
                WARNINGS.append(f"{where}: related {r} has no page (skipped)")
        target = OUT / p["path"].strip("/") / "index.html" if p["path"] != "/" else OUT / "index.html"
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(tpl.render(**ctx), encoding="utf-8")

    write_extras(pages)
    check_links(by_path)


def write_extras(pages):
    pairs = {}
    for p in pages:
        en = p if p["lang"] == "en" else None
        if en:
            pairs[p["path"]] = (p, next((q for q in pages if q["path"] == p["alt_path"]), None))
    urls = []
    for en, es in pairs.values():
        for cur in (en, es):
            if not cur:
                continue
            alts = "".join(f'<xhtml:link rel="alternate" hreflang="{x["lang"]}" href="{SITE_URL}{x["path"]}"/>'
                           for x in (en, es) if x)
            alts += f'<xhtml:link rel="alternate" hreflang="x-default" href="{SITE_URL}{en["path"]}"/>'
            urls.append(f'<url><loc>{SITE_URL}{cur["path"]}</loc><lastmod>{cur["last_checked"]}</lastmod>{alts}</url>')
    (OUT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
        'xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' + "\n".join(urls) + "\n</urlset>\n", encoding="utf-8")
    # Blueprint decision: allow search AND AI crawlers (public-education mission).
    (OUT / "robots.txt").write_text(
        "# Know Your Data Center welcomes search engines and AI assistants.\n"
        "User-agent: *\nAllow: /\n\n"
        "User-agent: OAI-SearchBot\nAllow: /\nUser-agent: ChatGPT-User\nAllow: /\nUser-agent: GPTBot\nAllow: /\n"
        "User-agent: Claude-SearchBot\nAllow: /\nUser-agent: Claude-User\nAllow: /\nUser-agent: ClaudeBot\nAllow: /\n"
        "User-agent: PerplexityBot\nAllow: /\nUser-agent: Google-Extended\nAllow: /\nUser-agent: Bingbot\nAllow: /\n\n"
        f"Sitemap: {SITE_URL}/sitemap.xml\n", encoding="utf-8")
    lines = ["# Know Your Data Center", "",
             "> Plain, sourced, dated answers about how data centers in Georgia get planned, built and run: what could "
             "change, what can help, and what you can ask. English and Spanish. Not for or against any project.", ""]
    for lang, head in (("en", "## English"), ("es", "## Español")):
        lines.append(head)
        lines += [f"- [{p['h1']}]({SITE_URL}{p['path']}): {p['description']}" for p in pages if p["lang"] == lang]
        lines.append("")
    (OUT / "llms.txt").write_text("\n".join(lines), encoding="utf-8")
    (OUT / "CNAME").write_text("www.knowyourdatacenter.org\n", encoding="utf-8")
    (OUT / ".nojekyll").write_text("", encoding="utf-8")
    (OUT / "404.html").write_text(
        '<!doctype html><html lang="en" class="a2"><head><meta charset="utf-8"><meta name="viewport" '
        'content="width=device-width, initial-scale=1"><title>Page not found | Know Your Data Center</title>'
        '<link rel="stylesheet" href="/assets/css/a2-studio.css"><link rel="stylesheet" href="/assets/css/kydc.css">'
        '</head><body><main class="kydc-main"><h1 class="kydc-h1">Page not found</h1><p>Try the <a href="/">home page</a>.'
        '</p><p lang="es">Página no encontrada. Vaya a la <a href="/es/">página de inicio</a>.</p></main></body></html>',
        encoding="utf-8")


def check_links(by_path):
    for f in OUT.rglob("*.html"):
        text = f.read_text(encoding="utf-8")
        for tok in sorted(set(re.findall(r"\{\{[A-Z_]+\}\}", text))):
            WARNINGS.append(f"{f.relative_to(OUT)}: placeholder {tok} must be filled before publishing")
        for href in re.findall(r'href="(/[^"#?]*)', text):
            if href.startswith("/assets/") or href.startswith("/downloads/"):
                if not (OUT / href.lstrip("/")).exists():
                    ERRORS.append(f"{f.relative_to(OUT)}: missing file {href}")
                continue
            if href not in by_path and href != "/":
                ERRORS.append(f"{f.relative_to(OUT)}: broken internal link {href}")


if __name__ == "__main__":
    try:
        build()
    except Exception as e:  # keep tracebacks out of shared logs
        sys.exit(f"BUILD FAILED: {type(e).__name__}: {e}")
    n = len(list(OUT.rglob("index.html")))
    print(f"Built {n} pages into docs/")
    for w in sorted(set(WARNINGS)):
        print("WARN ", w)
    for e in sorted(set(ERRORS)):
        print("ERROR", e)
    sys.exit(1 if ERRORS else 0)
