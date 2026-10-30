"""Build the student play-test copy of Community Builders of Pecan Grove.

Output: _publish/pecan-grove-playtest/ — a small static site for GitHub Pages: the game in English (index.html) and
Spanish (espanol.html), a short "help us test" note, and only the files the game needs. Page assets use relative paths,
so the site works from https://<user>.github.io/pecan-grove-playtest/. Social preview tags use the absolute public URL
so LinkedIn and other apps can fetch the card. Each page's noindex robots meta tag keeps search engines out; a
robots.txt under the /pecan-grove-playtest/ subpath has no effect. Game progress and feedback drafts stay in the player's
browser. An optional configured Google Apps Script endpoint receives
only explicitly submitted, reviewed feedback.

    python tools/make_playtest.py                      # reuse the saved feedback deployment, when present
    python tools/make_playtest.py --form https://forms.office.com/r/XXXX
    python tools/make_playtest.py --feedback-endpoint "" # intentionally disable shared backup
    PG_CLOSEOUT_CODE=... python tools/make_playtest.py  # add the facilitator's close-out (playtest flavor only)
"""
import argparse, hashlib, html, importlib.util, json, os, re, secrets, shutil, subprocess
from datetime import date
from pathlib import Path
from urllib.parse import urlsplit
from html.parser import HTMLParser

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "_publish" / "pecan-grove-playtest"
IGNORED_FILES = {"desktop.ini", "thumbs.db", ".ds_store"}
# WebKit's native select shadow tree writes exactly `text-overflow:inherit` before attaching
# its UA slot. Permit that one declaration; authored style elements and every other attribute stay blocked.
# The CI WebKit probe checks both the native control and unrelated-style rejection.
SITE_ORIGIN = "https://a2-learning-studio.github.io/pecan-grove-playtest"
SOCIAL_IMAGE = SITE_ORIGIN + "/social-preview.jpg"
SOCIAL_IMAGE_WIDTH = 1200
SOCIAL_IMAGE_HEIGHT = 627
# These agents build link cards. Every other crawler remains disallowed.
PREVIEW_AGENTS = (
    "LinkedInBot", "Twitterbot", "facebookexternalhit", "Facebot", "WhatsApp",
    "Slackbot", "Slackbot-LinkExpanding", "Discordbot", "TelegramBot", "Applebot",
)
SOCIAL = {
    "en": {
        "title": "Community Builders of Pecan Grove",
        "description": "A free bilingual civic game for kids 8 to 14. Practice noticing, asking, listening, and planning together in the made-up town of Pecan Grove.",
        "url": SITE_ORIGIN + "/",
        "image_alt": "Illustrated town of Pecan Grove with neighbors from the bilingual civic game.",
    },
    "es": {
        "title": "Constructores de comunidad de Pecan Grove",
        "description": "Un juego cívico bilingüe y gratis para niños de 8 a 14 años. Practica notar, preguntar, escuchar y planear juntos en el pueblo inventado de Pecan Grove.",
        "url": SITE_ORIGIN + "/espanol.html",
        "image_alt": "Pueblo ilustrado de Pecan Grove con vecinos del juego cívico bilingüe.",
    },
}

# Accessibility barrier reports go to the studio's existing contact (the project's commit address).
ACCESS_CONTACT = "akeyvanf@kennesaw.edu"

CSP = ("default-src 'self'; script-src 'self'; style-src 'self'; "
       "style-src-attr 'unsafe-hashes' 'sha256-3oFxofzq3N//6J8H86e9ul4WT2OkJrtonB66gn/TLJw='; "
       "img-src 'self' data:; font-src 'self'; media-src 'self' blob:; "
       "connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; worker-src 'self'; manifest-src 'self'; "
       "require-trusted-types-for 'script'; trusted-types pg-game-scripts")

WORDS = {
    lang: json.loads((ROOT / "assets" / "playtest" / "locales" / (lang + ".json")).read_text(encoding="utf-8"))
    for lang in ("en", "es")
}
FAMILY_PRIVACY = {
    "en": "Your progress stays on this device. No account or name is needed.",
    "es": "Tu avance se queda en este dispositivo. No necesitas cuenta ni nombre.",
}


def checked_form(value):
    """A configured Microsoft Form only; never accept arbitrary runtime redirects."""
    if not value:
        return ""
    url = urlsplit(value)
    if (url.scheme != "https" or url.hostname not in {"forms.office.com", "forms.microsoft.com", "forms.cloud.microsoft"}
            or url.username or url.password or url.port not in (None, 443)
            or any(c.isspace() for c in value)):
        raise ValueError("Feedback URL must be an HTTPS Microsoft Forms link without credentials or whitespace.")
    return value


def checked_feedback_endpoint(value):
    """Only a public deployed Apps Script web app can receive submitted notes."""
    if not value:
        return ""
    url = urlsplit(value)
    if (url.scheme != "https" or url.hostname != "script.google.com"
            or not re.fullmatch(r"/macros/s/[A-Za-z0-9_-]+/exec", url.path)
            or url.username or url.password or url.port not in (None, 443)
            or url.query or url.fragment or any(c.isspace() for c in value)):
        raise ValueError("Feedback endpoint must be an HTTPS deployed script.google.com/macros/s/…/exec URL.")
    return value


def resolve_feedback_endpoint(cli_value, config_path=None):
    """An explicit argument wins; otherwise preserve the owner's saved deployment."""
    if cli_value is not None:
        return checked_feedback_endpoint(cli_value)
    config_path = config_path or ROOT / "backend" / "feedback" / "deployment.json"
    try:
        config = json.loads(config_path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return ""
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise ValueError(f"Cannot read feedback deployment configuration: {config_path}") from exc
    if (not isinstance(config, dict) or set(config) != {"schemaVersion", "feedbackEndpoint"}
            or type(config["schemaVersion"]) is not int or config["schemaVersion"] != 1
            or not isinstance(config["feedbackEndpoint"], str)):
        raise ValueError("Feedback deployment configuration must contain schemaVersion 1 and a feedbackEndpoint string only.")
    return checked_feedback_endpoint(config["feedbackEndpoint"])


# Words a guess tries first; a code made of one of them, whatever digits or symbols are added, is refused.
COMMON_CODE_WORDS = {"password", "passwrd", "qwerty", "letmein", "welcome", "admin", "secret", "pecangrove", "closeout",
                     "facilitator", "teacher", "library", "playtest"}


def checked_closeout_code(value):
    """The facilitator's close-out code: 10 to 200 characters with at least three kinds (lower-case letters, capital
    letters, digits, other characters), not a common word, no spaces at either end and no control characters."""
    if not value:
        return ""
    if (not isinstance(value, str) or len(value) < 10 or len(value) > 200 or value != value.strip()
            or any(ord(c) < 32 or ord(c) == 127 for c in value)):
        raise ValueError("The close-out code must have 10 to 200 characters, with no spaces at either end.")
    kinds = sum(any(test(c) for c in value) for test in (str.islower, str.isupper, str.isdigit, lambda c: not c.isalnum()))
    if kinds < 3:
        raise ValueError("The close-out code needs at least three of: lower-case letters, capital letters, digits, other characters.")
    if re.sub(r"[^a-z]", "", value.lower()) in COMMON_CODE_WORDS:
        raise ValueError("The close-out code is too easy to guess. Use 10 or more random characters.")
    return value


def resolve_closeout_code(cli_value, flavor):
    """An explicit argument wins; otherwise PG_CLOSEOUT_CODE, read like CI's secret. Family and library: never."""
    if flavor in {"family", "library"}:
        return ""
    return checked_closeout_code(cli_value if cli_value is not None else os.environ.get("PG_CLOSEOUT_CODE", ""))


def closeout_lock(code):
    """A random salt for this build and the SHA-256 of salt and code. The page never carries the code itself."""
    code = checked_closeout_code(code)
    if not code:
        return ""
    salt = secrets.token_hex(16)
    return salt + ":" + hashlib.sha256((salt + ":" + code).encode("utf-8")).hexdigest()


def page_csp(feedback_endpoint):
    checked_feedback_endpoint(feedback_endpoint)
    return CSP.replace("connect-src 'self'", "connect-src 'self' https://script.google.com https://script.googleusercontent.com") if feedback_endpoint else CSP


def family_boot(source):
    """Remove the feedback import before source validation and bundling."""
    result, count = re.subn(r"^  if \(document\.documentElement\.dataset\.flavor !== 'family'\) \{\n.*?^  \}\n", "", source, count=1, flags=re.M | re.S)
    if count != 1 or "feedback.js" in result:
        raise ValueError("Family boot must exclude the playtest receiver module.")
    return result


def build_id(form="", form_es="", feedback_endpoint="", flavor="playtest", closeout=False):
    digest = hashlib.sha256()
    def content(p):
        value = p.read_bytes()
        return value.replace(b'\r\n', b'\n') if p.suffix in {'.js', '.css', '.json', '.svg', '.md', '.mjs', '.py', '.txt'} else value
    for folder in ("assets/games/community-builders", "assets/playtest", "assets/fonts", "assets/css", "assets/icons"):
        for p in sorted((ROOT / folder).rglob("*")):
            if p.is_file() and p.name.lower() not in IGNORED_FILES:
                digest.update(p.relative_to(ROOT).as_posix().encode())
                digest.update(content(p))
    digest.update(content(Path(__file__)))
    for name in ("build.mjs", "critical-css.mjs", "subset_fonts.py", "requirements-build.txt", "sw-template.js", "make_educator.py"):
        p = ROOT / "tools" / name
        if p.is_file():
            digest.update(name.encode())
            digest.update(content(p))
    # The educator sheets print the real-world fact register.
    digest.update(content(ROOT / "docs" / "fact-sources.json"))
    # Whether the build has a close-out code, never the code or its salted hash: the salt is new in every build.
    digest.update(json.dumps([form, form_es, feedback_endpoint, flavor] + ([True] if closeout else []), separators=(",", ":")).encode())
    return digest.hexdigest()[:12]



def git_commit():
    """Identify release sources; an unpacked preview has no pretend Git identity."""
    value = os.environ.get("GITHUB_SHA", "")
    if re.fullmatch(r"[0-9a-fA-F]{40}", value):
        return value.lower()
    try:
        top = subprocess.run(["git", "rev-parse", "--show-toplevel"], cwd=ROOT, text=True, capture_output=True, check=True).stdout.strip()
        if Path(top).resolve() != ROOT.resolve():
            return ""
        value = subprocess.run(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True, capture_output=True, check=True).stdout.strip()
        return value if re.fullmatch(r"[0-9a-f]{40}", value) else ""
    except (OSError, subprocess.CalledProcessError):
        return ""

def feedback_panel(lang, revision, endpoint, form="", closeout=""):
    w = WORDS[lang]; e = html.escape
    options = '<option value="0">' + e(w["feedback_general"]) + '</option>'
    options += "".join(f'<option value="{n}">{e(w["feedback_stop"])} {n}</option>' for n in range(1, 16))
    ratings = "".join(f'<option value="{value}">{e(w[key])}</option>' for value, key in (
        ("unclear", "feedback_unclear"), ("okay", "feedback_okay"), ("good", "feedback_good")))
    categories = "".join(f'<option value="{value}">{e(w[key])}</option>' for value, key in (
        ("clarity", "feedback_clarity"), ("bug", "feedback_bug"), ("voice", "feedback_voice"),
        ("spanish", "feedback_spanish"), ("art", "feedback_art"), ("other", "feedback_other")))
    external = (f'<p class="pt-cta"><a class="pt-btn" href="{e(form)}" target="_blank" rel="noopener">{e(w["form"])}</a></p>'
                f'<p class="pt-privacy">{e(w["external"])}</p>') if form else ""
    lock = f' data-closeout="{e(closeout)}"' if closeout else ""
    # A copy that sends never offers a child the per-player Excel file; a copy that never sends keeps it as the backup.
    download = "" if endpoint else f'<button class="pt-btn pt-btn--secondary" id="pt-feedback-download" type="button">{e(w["feedback_download"])}</button>'
    # The two questions a note is for come first, right under the privacy line; the optional lists follow.
    return f'''  <section class="pt-note pt-feedback" id="pt-feedback" aria-labelledby="pt-feedback-h" data-lang="{lang}" data-build="{e(revision)}" data-endpoint="{e(endpoint)}"{lock}>
    <h2 id="pt-feedback-h">{e(w["feedback"])}</h2>
    <p>{e(w["feedback_intro"])}</p>
    <p class="pt-feedback__player">{e(w["feedback_player"])} <span id="pt-feedback-player">{e(w["feedback_player_loading"])}</span></p>
    <p class="pt-feedback__context">{e(w["feedback_context"])} <span id="pt-feedback-context">{e(w["feedback_general"])}</span></p>
    <form id="pt-feedback-form" aria-describedby="pt-feedback-privacy pt-feedback-hint">
      <p class="pt-privacy" id="pt-feedback-privacy">{e(w["feedback_cloud"] if endpoint else w["feedback_local"])}</p>
      <label for="pt-feedback-worked">{e(w["feedback_worked"])}<textarea id="pt-feedback-worked" name="worked" rows="3" maxlength="1200" aria-describedby="pt-feedback-hint"></textarea></label>
      <label for="pt-feedback-fix">{e(w["feedback_fix"])}<textarea id="pt-feedback-fix" name="fix" rows="3" maxlength="1200" aria-describedby="pt-feedback-hint"></textarea></label>
      <p class="pt-privacy" id="pt-feedback-hint">{e(w["feedback_hint"])}</p>
      <div class="pt-feedback__fields">
        <label for="pt-feedback-stop">{e(w["feedback_for"])}<select id="pt-feedback-stop" name="stop">{options}</select></label>
        <label for="pt-feedback-rating">{e(w["feedback_rating"])}<select id="pt-feedback-rating" name="rating"><option value="">{e(w["feedback_choose"])}</option>{ratings}</select></label>
        <label for="pt-feedback-category">{e(w["feedback_category"])}<select id="pt-feedback-category" name="category"><option value="">{e(w["feedback_choose"])}</option>{categories}</select></label>
      </div>
      <div class="pt-feedback__actions"><button class="pt-btn" id="pt-feedback-submit" type="submit">{e(w["feedback_send"] if endpoint else w["feedback_save"])}</button></div>
    </form>
    <p id="pt-feedback-status" role="status" aria-live="polite">{e(w["feedback_auto_status"] if endpoint else w["feedback_status"])}</p>
    <details class="pt-feedback-more"><summary>{e(w['more'])}</summary>
    <div class="pt-feedback__actions">{download}<button class="pt-btn pt-btn--secondary" id="pt-feedback-new-player" type="button" aria-haspopup="dialog" aria-describedby="pt-feedback-shared">{e(w["feedback_new_player"])}</button><button class="pt-btn pt-btn--secondary" id="pt-feedback-device" type="button" aria-haspopup="dialog">{e(w["device_open"])}</button></div>
    <p class="pt-privacy" id="pt-feedback-shared">{e(w["feedback_shared"])}</p>
    <details class="pt-feedback__saved"><summary>{e(w["feedback_notes"])}</summary><ul id="pt-feedback-entries"><li>{e(w["feedback_empty"])}</li></ul></details>
    </details>
{external}
    <p class="pt-privacy">Build: <code>{e(revision)}</code></p>
  </section>'''


def robots_txt():
    """Crawlers read robots.txt only at a host's root (RFC 9309), so under the GitHub Pages subpath this file has no
    effect; each page's noindex robots meta tag is the real search control. The rules apply if the site moves to a root."""
    blocks = ["# Crawlers read robots.txt only at a site's root, so this file has no effect under /pecan-grove-playtest/.\n"
              "# Each page's noindex, nofollow robots meta tag keeps it out of search. At a domain root, these rules keep\n"
              "# search crawlers out and let preview crawlers read the public card."]
    blocks.extend(f"User-agent: {agent}\nAllow: /" for agent in PREVIEW_AGENTS)
    blocks.append("User-agent: *\nDisallow: /")
    return "\n\n".join(blocks) + "\n"


def social_tags(lang):
    """Absolute card tags. Crawlers do not resolve paths relative to the shared URL."""
    card = SOCIAL[lang]
    e = lambda value: html.escape(value, quote=True)
    image = SOCIAL_IMAGE
    pairs = (
        ("property", "og:type", "website"),
        ("property", "og:title", card["title"]),
        ("property", "og:description", card["description"]),
        ("property", "og:url", card["url"]),
        ("property", "og:image", image),
        ("property", "og:image:type", "image/jpeg"),
        ("property", "og:image:width", str(SOCIAL_IMAGE_WIDTH)),
        ("property", "og:image:height", str(SOCIAL_IMAGE_HEIGHT)),
        ("property", "og:image:alt", card["image_alt"]),
        ("property", "og:locale", "en_US" if lang == "en" else "es_ES"),
        ("name", "description", card["description"]),
        ("name", "twitter:card", "summary_large_image"),
        ("name", "twitter:title", card["title"]),
        ("name", "twitter:description", card["description"]),
        ("name", "twitter:image", image),
        ("name", "twitter:image:alt", card["image_alt"]),
    )
    return "\n".join(f'<meta {attr}="{name}" content="{e(value)}">' for attr, name, value in pairs)


def page(lang, form, revision="preview", build_date=None, feedback_endpoint="", flavor="playtest", commit="", closeout=""):
    if flavor not in {"playtest", "family", "library"}:
        raise ValueError("Unknown game flavor")
    if flavor in {"family", "library"}:
        # Family and library copies never send and never have the facilitator's close-out.
        feedback_endpoint = closeout = ""
    if closeout and not re.fullmatch(r"[0-9a-f]{32}:[0-9a-f]{64}", closeout):
        raise ValueError("The close-out lock must be a salt and a SHA-256 hash from closeout_lock().")
    w = WORDS[lang]; e = html.escape
    form = checked_form(form)
    feedback_endpoint = checked_feedback_endpoint(feedback_endpoint)
    day = build_date or date.today()
    tag = ("Play-test version · " if lang == "en" else "Versión de prueba · ") + day.isoformat()
    social = "\n" + social_tags(lang) if flavor == "playtest" else ""
    steps = "".join(f"<li>{e(s)}</li>" for s in w["steps"])
    closeout_open = f'<button class="pt-btn pt-btn--secondary" id="pt-closeout-open" type="button" aria-haspopup="dialog">{e(w["closeout_open"])}</button>' if closeout else ""
    markup = f"""<!doctype html>
<html lang="{lang}" data-flavor="{flavor}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="{page_csp(feedback_endpoint)}">
<meta name="referrer" content="strict-origin-when-cross-origin">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#163A30">
<meta name="author" content="A2 Learning Studio">
<meta name="build-id" content="{e(commit or revision)}">
<meta name="content-build-id" content="{e(revision)}">
<title>{e(w["title"])}</title>{social}
<link rel="icon" href="assets/img/mark.svg" type="image/svg+xml">
<link rel="manifest" href="manifest.{lang}.webmanifest">
<meta name="apple-mobile-web-app-capable" content="yes">
<link rel="apple-touch-icon" href="assets/icons/apple-touch.png">
<link rel="preload" as="image" href="assets/games/community-builders/img/town-map-640.avif" imagesrcset="assets/games/community-builders/img/town-map-640.avif 640w, assets/games/community-builders/img/town-map-960.avif 960w, assets/games/community-builders/img/town-map-1376.avif 1376w" imagesizes="100vw" type="image/avif" fetchpriority="high">
<link rel="preload" as="font" href="assets/fonts/Inter-var.woff2" type="font/woff2" crossorigin>
<link rel="preload" as="font" href="assets/fonts/Geist-var.woff2" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/css/a2-studio.css">
<link rel="stylesheet" href="assets/games/community-builders/cb.css">
<link rel="stylesheet" href="playtest.css">
<link rel="stylesheet" href="assets/playtest/feedback.css">
<link rel="stylesheet" href="assets/playtest/shell.css">
<link rel="stylesheet" href="assets/games/community-builders/engine/tokens.css">
<link rel="stylesheet" href="assets/games/community-builders/engine/engine.css">
<script type="module" src="assets/playtest/boot.js"></script>
</head>
<body>
<a class="pt-skip" href="#pt-h">{e(w['skip'])}</a>
<header class="pt-bar"><div class="pt-in">
  <span class="pt-brand"><img src="assets/img/mark.svg" alt="" width="28" height="28"><b>{e(w["brand"])}</b></span>
  <span class="pt-tag" id="pt-version-tag">{e(tag)}</span>
  <a class="pt-lang" href="{w["other"]}" lang="{w["other_lang"]}" hreflang="{w["other_lang"]}">{e(w["other_label"])}</a>
</div></header>
<main class="pt-main">
  <section class="pt-intro" id="pt-intro" aria-labelledby="pt-h">
    <div class="pt-intro__art"><picture><source type="image/avif" srcset="assets/games/community-builders/img/town-map-640.avif 640w, assets/games/community-builders/img/town-map-960.avif 960w, assets/games/community-builders/img/town-map-1376.avif 1376w" sizes="100vw"><img src="assets/games/community-builders/img/town-map-640.webp" srcset="assets/games/community-builders/img/town-map-640.webp 640w, assets/games/community-builders/img/town-map-960.webp 960w, assets/games/community-builders/img/town-map-1376.webp 1376w" sizes="100vw" alt="" width="1376" height="768" fetchpriority="high" decoding="sync"></picture><p>{e(w['purpose'])}</p></div>
    <div class="pt-intro__copy">
    <h1 id="pt-h" tabindex="-1">{e(w["h1"])}</h1>
    <label class="pt-quiet-choice" for="pt-quiet"><input type="checkbox" id="pt-quiet"><span><b>{e(w['quiet'])}</b><small>{e(w['quiet_hint'])}</small></span></label>
    <div class="pt-actions"><button class="pt-btn" id="pt-start" type="button">{e(w["play"])}</button></div>
    <details class="pt-guide" id="pt-guide"><summary>{e(w["instructions"])}</summary>
      <p class="pt-goal">{e(w["goal"])}</p>
      <ol class="pt-steps">{steps}</ol>
      <p>{e(w['external_noise'])}</p>
    </details>
    <p class="pt-lead">{e(w["lead"])}</p>
    <p class="pt-goal" id="pt-intro-note">{e(w['intro_note'])}</p>
    <fieldset class="pt-consent" id="pt-consent-options"><legend>{e(w['grownups_tab'])}</legend>
      <label class="pt-quiet-choice" id="pt-consent-scores"><input type="checkbox" data-pg-consent="scores"><span><b>{e(w['consent_scores'])}</b><small>{e(w['consent_hint'])}</small></span></label>
      <label class="pt-quiet-choice" id="pt-consent-auto"><input type="checkbox" data-pg-consent="autoScores"><span>{e(w['consent_auto'])}<small>{e(w['consent_auto_hint'])}</small></span></label>
      <div class="pt-actions"><button class="pt-btn pt-btn--secondary" id="pt-feedback-new-player-top" type="button" aria-haspopup="dialog" aria-describedby="pt-shared-top">{e(w["feedback_new_player"])}</button><button class="pt-btn pt-btn--secondary" id="pt-device-open" type="button" aria-haspopup="dialog">{e(w["device_open"])}</button>{closeout_open}</div>
      <p class="pt-privacy" id="pt-shared-top">{e(w["feedback_shared"])}</p>
    </fieldset>
    <p class="pt-privacy">{e(w["privacy"])}</p>
    <p class="pt-privacy">{e(w["privacy_steps"])}</p>
    <p class="pt-team">{e(w['team'])}</p>
    <p>{e(w['team_about'])}</p>
    <p class="pt-privacy" id="pt-disclosure">{e(w['independent'])} {e(w['fellowship'])}</p>
    <p id="pt-intro-review-hint">{e(w['intro_review'])}</p>
    <details class="pt-guide" id="pt-access"><summary>{e(w["access_title"])}</summary>
      <p>{e(w["access_goal"])}</p>
      <p>{e(w["access_gaps"])}</p>
      <p>{e(w["access_contact"])} <a href="mailto:{ACCESS_CONTACT}">{ACCESS_CONTACT}</a></p>
      <p>{e(w["access_contact_detail"])}</p>
    </details>
    </div>
  </section>
  <section class="pt-stage" id="pt-stage" data-playtest-stage aria-label="{e(w['play_area'])}">
    <nav class="pt-toolbar" aria-label="{e(w['game_tools'])}">
      <button class="pt-tool pt-tool--review" id="pt-review-tab" type="button" aria-haspopup="dialog" aria-controls="pt-review-dialog" aria-expanded="false">{e(w['review_tab'])}</button>
      <button class="pt-tool" id="pt-library-tab" type="button" aria-haspopup="dialog">{e(w['library_tab'])}</button>
      <button class="pt-tool" id="pt-grownups-tab" type="button" aria-haspopup="dialog">{e(w['grownups_tab'])}</button>
      <button class="pt-tool" id="pt-exit" type="button">{e(w['exit_play'])}</button>
    </nav>
    <div class="pt-stage-content">
      <h1 class="pt-sr pt-game-heading">{e(w["game_label"])}</h1>
      <p class="pt-sr" id="pt-play-status" role="status" aria-live="polite"></p>
      <div class="cb" id="community-builders" tabindex="-1" aria-label="{e(w["game_label"])}" data-playtest-paused="true" data-game="community-builders" data-language-url="{w["other"]}" data-base="assets/games/community-builders/"></div>
      <div id="pt-feedback-home">
        <div class="pt-feedback-dock-header" id="pt-feedback-dock-header">
          <strong>{e(w['review_title'])}</strong>
          <button class="pt-tool" id="pt-feedback-dock-collapse" type="button" aria-expanded="true" aria-controls="pt-feedback" data-collapse-label="{e(w['collapse_docked_feedback'])}" data-expand-label="{e(w['expand_docked_feedback'])}">{e(w['collapse_docked_feedback'])}</button>
          <button class="pt-tool" id="pt-feedback-dock-float" type="button" aria-haspopup="dialog" aria-controls="pt-review-dialog">{e(w['floating'])}</button>
        </div>
{feedback_panel(lang, revision, feedback_endpoint, form, closeout)}
      </div>
    </div>
    <dialog class="pt-review-dialog" id="pt-review-dialog" aria-label="{e(w['review_view'])}">
      <div class="pt-review-titlebar" id="pt-review-titlebar">
        <button class="pt-review-move" id="pt-review-move" type="button" aria-label="{e(w['move_review'])}" aria-describedby="pt-review-move-help" title="{e(w['move_review'])}" disabled><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><circle cx="8" cy="5" r="1.6"/><circle cx="16" cy="5" r="1.6"/><circle cx="8" cy="12" r="1.6"/><circle cx="16" cy="12" r="1.6"/><circle cx="8" cy="19" r="1.6"/><circle cx="16" cy="19" r="1.6"/></svg><span>{e(w['review_title'])}</span></button>
        <span class="pt-sr" id="pt-review-move-help">{e(w['move_help'])}</span>
        <button class="pt-tool pt-review-collapse" id="pt-review-collapse" type="button" aria-expanded="true" aria-controls="pt-review-tools pt-feedback-window" data-collapse-label="{e(w['collapse_review'])}" data-expand-label="{e(w['expand_review'])}" hidden>{e(w['collapse_review'])}</button>
        <button class="pt-tool pt-review-close" id="pt-review-close" type="button" aria-label="{e(w['close'])}" title="{e(w['close'])}"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
      </div>
      <div class="pt-review-tools" id="pt-review-tools">
        <button class="pt-tool" id="pt-review-float" type="button" aria-pressed="false" data-popup-label="{e(w['popup'])}" data-float-label="{e(w['floating'])}">{e(w['floating'])}</button>
        <button class="pt-tool" id="pt-review-dock" type="button">{e(w['dock'])}</button>
      </div>
      <div id="pt-feedback-window"></div>
    </dialog>
    <dialog class="pt-player-dialog" id="pt-new-player-dialog" aria-labelledby="pt-new-player-title">
      <h2 id="pt-new-player-title">{e(w['new_title'])}</h2><p id="pt-new-player-message"></p>
      <div class="pt-actions"><button class="pt-btn" id="pt-new-player-cancel" type="button">{e(w['new_cancel'])}</button><button class="pt-btn pt-btn--secondary" id="pt-new-player-confirm" type="button">{e(w['new_confirm'])}</button></div>
    </dialog>
  </section>
  <noscript><p>{e(w['noscript'])}</p></noscript>
</main>
<footer class="pt-foot"><div class="pt-in"><p>{e(w["foot"])}</p></div></footer>
</body>
</html>
"""
    return markup if flavor == "playtest" else local_page(markup, lang, flavor)


def educator_sheets(out, flavor):
    """Printable educator sheets with the same privacy line as this flavor's game page."""
    spec = importlib.util.spec_from_file_location("educator_sheets", ROOT / "tools" / "make_educator.py")
    sheets = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(sheets)
    privacy = FAMILY_PRIVACY if flavor == "family" else {lang: WORDS[lang]["privacy_library" if flavor == "library" else "privacy"] for lang in ("en", "es")}
    return sheets.write_sheets(out, flavor, privacy, SITE_ORIGIN + "/" if flavor == "playtest" else "",
                               {lang: SOCIAL[lang]["image_alt"] for lang in SOCIAL})


# Copy that only the playtest build may show: a family or library copy is not a test and never sends.
PLAYTEST_ONLY = {"pt-version-tag", "pt-intro-note", "pt-guide"}
LOCAL_REMOVALS = {
    "family": PLAYTEST_ONLY | {"pt-feedback-home", "pt-review-dialog", "pt-new-player-dialog", "pt-review-tab", "pt-feedback-new-player-top", "pt-consent-options", "pt-intro-review-hint"},
    # The library copy keeps Next player and the device panel for shared computers, but never shares scores.
    "library": PLAYTEST_ONLY | {"pt-consent-scores", "pt-consent-auto"},
}


def local_page(markup, lang, flavor):
    """Remove the playtest UI structurally, never with a fragile nested-tag regex."""
    class Family(HTMLParser):
        voids = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}
        remove = LOCAL_REMOVALS[flavor]
        def __init__(self):
            super().__init__(convert_charrefs=False)
            self.output, self.stack = [], []
        def handle_starttag(self, tag, attrs):
            a = dict(attrs)
            skip = any(self.stack) or a.get("id") in self.remove or a.get("src", "").endswith("/feedback.js") or a.get("href", "").endswith("/feedback.css")
            if tag not in self.voids:
                self.stack.append(skip)
            if not skip:
                self.output.append(self.get_starttag_text())
        def handle_endtag(self, tag):
            skip = self.stack.pop() if self.stack else False
            if not skip:
                self.output.append(f"</{tag}>")
        def handle_data(self, data):
            if not any(self.stack):
                self.output.append(data)
        def handle_entityref(self, name):
            self.handle_data(f"&{name};")
        def handle_charref(self, name):
            self.handle_data(f"&#{name};")
        def handle_decl(self, decl):
            self.output.append(f"<!{decl}>")
    parser = Family(); parser.feed(markup)
    result = "".join(parser.output)
    w, e = WORDS[lang], html.escape
    for old, new in ((w["title"], w["title_local"]), (w["h1"], w["h1_local"]), (w["foot"], w["foot_local"]),
                     (w["privacy"], FAMILY_PRIVACY[lang] if flavor == "family" else w["privacy_library"])):
        result = result.replace(e(old), e(new))
    return result


CSS = """/* play-test page shell: the game's pine stage colours, the A2 fonts; the game itself brings its own styles (cb.css) */
html { background: var(--pg-color-f4f1ea); }
body { margin: 0; background: var(--pg-color-f4f1ea); color: var(--pg-ink); font-family: var(--a2-font-body, system-ui, sans-serif); }
.pt-in { box-sizing: border-box; width: min(100%, 1240px); margin: 0 auto; padding: 0 16px; }
.pt-bar { background: var(--pg-ink); color: var(--pg-paper); }
.pt-bar .pt-in { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 16px; min-height: 60px; }
.pt-brand { display: inline-flex; align-items: center; gap: 10px; font-family: var(--a2-font-display, system-ui); font-size: 1.0625rem; letter-spacing: -0.01em; }
.pt-tag { padding: 3px 10px; border-radius: 999px; background: var(--pg-focus-stage); color: var(--pg-ink); font-size: 0.8125rem; font-weight: 700; }
.pt-lang { margin-left: auto; box-sizing: border-box; display: inline-flex; align-items: center; min-height: 44px; padding: 8px 14px; border-radius: 999px; border: 1.5px solid var(--pg-color-bfd1c8); color: var(--pg-paper); font-weight: 650; text-decoration: none; }
.pt-lang:hover { background: var(--pg-stage-raised); }
.pt-lang:focus-visible, .pt-btn:focus-visible { outline: 3px solid var(--pg-focus-stage); outline-offset: 3px; }
.pt-main .pt-btn:focus-visible { outline-color: var(--pg-ink); }
.pt-main { box-sizing: border-box; width: min(100%, 1240px); margin: 0 auto; padding: 24px 16px 40px; display: grid; gap: 24px; }
.pt-note { display: grid; gap: 10px; max-width: 72ch; padding: 20px 22px; border-radius: 20px; background: var(--pg-card); border: 1.5px solid var(--pg-color-e4ddd1); }
.pt-note h1 { margin: 0; font-family: var(--a2-font-display, system-ui); font-size: clamp(1.5rem, 1.1rem + 1.5vw, 2rem); line-height: 1.15; letter-spacing: -0.02em; }
.pt-note h2 { margin: 0; font-family: var(--a2-font-display, system-ui); font-size: 1.25rem; }
.pt-guide > summary { cursor: pointer; font-weight: 700; padding: 12px 0; min-height: 24px; }
.pt-guide[open] { display: grid; gap: 12px; }
.pt-guide > summary:focus-visible { outline: 3px solid var(--pg-ink); outline-offset: 3px; }
.pt-feedback { width: 100%; box-sizing: border-box; }
.pt-main .cb { scroll-margin-top: 16px; }
.pt-note p, .pt-steps { margin: 0; font-size: 1rem; line-height: 1.55; }
.pt-goal { font-weight: 650; }
.pt-steps { padding-left: 1.3em; display: grid; gap: 4px; }
.pt-cta { margin-top: 6px; }
.pt-actions { display: flex; flex-wrap: wrap; align-items: center; gap: .75rem; margin-block: 1rem; }
.pt-btn { box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; min-height: 48px; padding: 0 22px; border: 0; border-radius: 999px; background: var(--pg-clay); color: var(--pg-card); font: inherit; font-weight: 700; text-decoration: none; cursor: pointer; }
.pt-btn:hover { background: var(--pg-clay-ink); }
.pt-btn--secondary { background: var(--pg-card); color: var(--pg-ink); border: 1.5px solid var(--pg-color-42654c); }
.pt-btn--secondary:hover { background: var(--pg-color-eaf2e3); }
.pt-cta--wait { color: var(--pg-ink-muted); font-style: italic; }
.pt-privacy { color: var(--pg-color-56625c); font-size: 0.875rem !important; }
.pt-foot { background: var(--pg-ink); color: var(--pg-color-bfd1c8); font-size: 0.875rem; }
.pt-foot p { margin: 0; padding: 16px 0; }
"""


def main(argv=None):
    global OUT
    ap = argparse.ArgumentParser()
    ap.add_argument("--form", default="")
    ap.add_argument("--form-es", default="", help="Spanish Microsoft Form; defaults to --form")
    ap.add_argument("--feedback-endpoint", default=None, help="Deployed Google Apps Script URL; defaults to backend/feedback/deployment.json. Pass an empty string to disable shared backup.")
    ap.add_argument("--build-date", type=date.fromisoformat, default=date.today())
    ap.add_argument("--flavor", choices=["playtest", "family", "library"], default="playtest")
    # Usually left out: PG_CLOSEOUT_CODE carries it, as CI does with its secret, so it stays out of command lines and logs.
    ap.add_argument("--closeout-code", default=None, help="Facilitator's close-out code (10+ random characters, at least three kinds); defaults to PG_CLOSEOUT_CODE. Family and library copies never have one.")
    a = ap.parse_args(argv)
    try:
        checked_form(a.form); checked_form(a.form_es)
        a.feedback_endpoint = "" if a.flavor in {"family", "library"} else resolve_feedback_endpoint(a.feedback_endpoint)
        code = resolve_closeout_code(a.closeout_code, a.flavor)
    except ValueError as exc:
        ap.error(str(exc))
    # Validate before touching generated output. No package download is needed.
    node = shutil.which("node")
    if not node:
        raise SystemExit("Node.js is required to validate the game before building.")
    subprocess.run([node, str(ROOT / "tools/validate_game.mjs"), "--root", str(ROOT)], check=True)
    revision = build_id(a.form, a.form_es, a.feedback_endpoint, a.flavor, bool(code))
    lock = closeout_lock(code)
    commit = git_commit()
    out_names = {"family": "pecan-grove-family", "library": "pecan-grove-library"}
    OUT = ROOT / "_publish" / out_names.get(a.flavor, "pecan-grove-playtest")
    if OUT.resolve() not in {ROOT.resolve() / "_publish" / "pecan-grove-playtest", ROOT.resolve() / "_publish" / "pecan-grove-family", ROOT.resolve() / "_publish" / "pecan-grove-library"}:
        raise SystemExit("Refusing to rebuild outside the project playtest folder.")
    keep_git = (OUT / ".git").exists()
    if OUT.exists():
        for p in OUT.iterdir():
            if p.name == ".git": continue
            if not p.is_dir():
                p.unlink(); continue
            # delete every file, then the folders bottom-up; OneDrive can hold an empty folder open, and git ignores empty folders
            for f in sorted(p.rglob("*"), key=lambda q: len(q.parts), reverse=True):
                if f.is_dir():
                    try: f.rmdir()
                    except OSError: pass
                else:
                    f.unlink()
            try: p.rmdir()
            except OSError: pass
    OUT.mkdir(parents=True, exist_ok=True)
    ignore_metadata = lambda _directory, names: [name for name in names if name.lower() in IGNORED_FILES]
    shutil.copytree(ROOT / "assets/games/community-builders", OUT / "assets/games/community-builders", dirs_exist_ok=True, ignore=ignore_metadata)
    shutil.copytree(ROOT / "assets/playtest", OUT / "assets/playtest", dirs_exist_ok=True, ignore=ignore_metadata)
    shutil.copytree(ROOT / "assets/fonts", OUT / "assets/fonts", dirs_exist_ok=True, ignore=ignore_metadata)
    (OUT / "assets/css").mkdir(parents=True, exist_ok=True); (OUT / "assets/img").mkdir(parents=True, exist_ok=True)
    shutil.copy2(ROOT / "assets/css/a2-studio.css", OUT / "assets/css/a2-studio.css")
    shutil.copy2(ROOT / "assets/img/mark.svg", OUT / "assets/img/mark.svg")
    if (ROOT / "assets/icons").is_dir():
        shutil.copytree(ROOT / "assets/icons", OUT / "assets/icons", dirs_exist_ok=True)
    for lang in ("en", "es"):
        form = (a.form_es or a.form) if lang == "es" else a.form
        (OUT / WORDS[lang]["file"]).write_text(page(lang, form, revision, a.build_date, a.feedback_endpoint, a.flavor, commit, lock), encoding="utf-8", newline="\n")
        manifest = {"name": WORDS[lang]["brand"], "short_name": "Pecan Grove", "lang": lang,
                    "start_url": "./?source=pwa" if lang == "en" else "./espanol.html?source=pwa", "scope": "./",
                    "display": "standalone", "display_override": ["fullscreen", "standalone"],
                    "theme_color": "#163A30", "background_color": "#163A30", "orientation": "any",
                    "icons": [{"src": f"assets/icons/icon-{size}.png", "sizes": f"{size}x{size}", "type": "image/png", "purpose": "any"} for size in (192, 512)] +
                             [{"src": "assets/icons/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}]}
        (OUT / f"manifest.{lang}.webmanifest").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    if a.flavor == "family":
        boot = OUT / "assets/playtest/boot.js"
        boot.write_text(family_boot(boot.read_text(encoding="utf-8")), encoding="utf-8", newline="\n")
        for name in ("feedback.js", "feedback.css"):
            (OUT / "assets/playtest" / name).unlink(missing_ok=True)
    (OUT / "playtest.css").write_text(CSS, encoding="utf-8", newline="\n")
    educator_sheets(OUT, a.flavor)
    (OUT / "robots.txt").write_text(robots_txt(), encoding="utf-8", newline="\n")
    if a.flavor == "playtest":
        preview = ROOT / "assets" / "img" / "social-preview.jpg"
        if not preview.is_file():
            raise SystemExit("Missing assets/img/social-preview.jpg. Run npm run images.")
        shutil.copy2(preview, OUT / "social-preview.jpg")
    (OUT / ".nojekyll").write_text("", encoding="utf-8")
    (OUT / "build.json").write_text(json.dumps({"id": revision, "commit": commit or None, "date": a.build_date.isoformat(), "flavor": a.flavor}, indent=2) + "\n", encoding="utf-8")
    (OUT / "README.md").write_text(
        "# Community Builders of Pecan Grove · student play-test\n\n"
        "A test copy of the kids' civic game from the Know Your Data Center hub, for students to play and review before the public launch.\n"
        "English: `index.html` · Spanish: `espanol.html`. Built by `tools/make_playtest.py` in the hub project; do not edit here.\n\n"
        "The game saves progress and drafts on the device. Feedback is sent only after a grown-up reviews and chooses Send. Score sharing starts off and is optional. The family flavor has no feedback connection. The library flavor keeps local notes and never sends them. Shared computers have separate anonymous sessions; names and contact details are never requested.\n",
        encoding="utf-8", newline="\n")
    subprocess.run([node, str(ROOT / "tools/validate_game.mjs"), "--root", str(ROOT), "--site", str(OUT)], check=True)
    n = sum(1 for _ in OUT.rglob("*") if _.is_file() and ".git" not in _.parts)
    print(f"play-test built: {OUT} ({n} files){' with form link' if a.form else ' (no form link yet)'}{'; facilitator close-out on' if lock else ''}{'; git history kept' if keep_git else ''}")


if __name__ == "__main__":
    main()
