"""The printable educator sheets are built from the game's own content and its real-world fact register."""
import ast
import importlib.util
import json
import re
import tempfile
import unittest
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


sheets = load("educator_sheets_under_test", ROOT / "tools" / "make_educator.py")
builder = load("playtest_builder_for_sheets", ROOT / "tools" / "make_playtest.py")
GAME = ROOT / "assets" / "games" / "community-builders" / "locales"
REGISTER = json.loads((ROOT / "docs" / "fact-sources.json").read_text(encoding="utf-8"))


class Text(HTMLParser):
    """Visible text, with the elements and attributes the checks need."""
    def __init__(self, markup):
        super().__init__()
        self.text, self.tags = [], []
        self.feed(markup)

    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))

    def handle_data(self, data):
        self.text.append(data)

    def joined(self):
        return re.sub(r"\s+", " ", "".join(self.text))


def locale(lang, name):
    return json.loads((GAME / lang / f"{name}.json").read_text(encoding="utf-8"))


class EducatorSheetTest(unittest.TestCase):
    def built(self, flavor="playtest"):
        with tempfile.TemporaryDirectory() as folder:
            builder.educator_sheets(Path(folder), flavor)
            return {name: (Path(folder) / name).read_text(encoding="utf-8")
                    for name in ("educator.html", "educador.html", "educator.css")}

    def test_both_sheets_list_every_stop_goal_and_chapter_from_the_game(self):
        files = self.built()
        for lang, name in (("en", "educator.html"), ("es", "educador.html")):
            page = Text(files[name])
            text = page.joined()
            core = locale(lang, "core")
            for chapter in core["W"]["chapters"]:
                self.assertIn(chapter, text)
            for n in range(1, 16):
                words = next(v for v in locale(lang, f"stop-{n:02d}").values() if isinstance(v, dict) and "real" in v)
                self.assertIn(core["bank"][f"b{n:04d}"], text)
                self.assertIn(words.get("takeaway") or words["can"], text)
            self.assertIn(locale(lang, "stop-01")["T"]["what"], text)
            self.assertNotRegex(files[name], r"\{[a-zA-Z_]+\}")
            self.assertEqual(re.search(r'<html lang="(\w+)"', files[name]).group(1), lang)
            hrefs = [attrs.get("href") for tag, attrs in page.tags if tag in {"a", "link"}]
            self.assertIn("educator.css", hrefs)
            self.assertIn(sheets.FILES["es" if lang == "en" else "en"], hrefs)
            self.assertIn(sheets.PLAY[lang], hrefs)
            self.assertIn("mailto:" + REGISTER["corrections"]["email"], hrefs)

    def test_a_label_ending_in_a_question_mark_takes_no_extra_colon(self):
        # PG-UX-C37: "Stop 4, Fact or Rumor?:" printed both marks.
        self.assertEqual(sheets.lead_in("Stop 4, Fact or Rumor?"), "Stop 4, Fact or Rumor?")
        self.assertEqual(sheets.lead_in("Parada 11, Piensa en ventajas"), "Parada 11, Piensa en ventajas:")
        files = self.built()
        for name in ("educator.html", "educador.html"):
            self.assertNotRegex(Text(files[name]).joined(), r"[?!]:")

    def test_no_sheet_names_the_close_out_or_an_address_switch(self):
        # The sheets are published beside the game, where a child can open them: facilitator close-out is
        # documented only in the README and docs/.
        for flavor in ("playtest", "library", "family"):
            files = self.built(flavor)
            for lang, name in (("en", "educator.html"), ("es", "educador.html")):
                self.assertNotRegex(files[name], r"(?i)closeout|close-out|vista de cierre|cierre para facilitadores|c[oó]digo de cierre", (flavor, lang))

    def test_sheets_have_no_script_or_inline_style_and_a_strict_policy(self):
        for name, markup in self.built().items():
            if not name.endswith(".html"):
                continue
            self.assertNotRegex(markup, r"<script\b|<style\b|\sstyle\s*=")
            self.assertIn(f'content="{sheets.CSP}"', markup)
            self.assertIn("default-src 'none'", sheets.CSP)

    def test_page_two_prints_every_real_world_claim_and_source(self):
        files = self.built()
        for lang, name in (("en", "educator.html"), ("es", "educador.html")):
            text = Text(files[name]).joined()
            stop10 = locale(lang, "stop-10")["bank"]
            for claim in REGISTER["claims"]:
                for source in claim["sources"]:
                    self.assertIn(REGISTER["sources"][source]["url"], files[name].replace("&amp;", "&"))
                if claim["file"] == "stop-10":
                    for key in claim["keys"]:
                        self.assertIn(stop10[key.split(".")[1]], text)
            for claim in REGISTER["claims"]:
                self.assertIn(sheets.TEXT[lang]["statuses"][claim["status"]], text)
            if any(claim["status"] in {"partly-confirmed", "not-confirmed"} for claim in REGISTER["claims"]):
                self.assertIn(sheets.TEXT[lang]["unconfirmed"], text)
            self.assertIn("break-before: page", files["educator.css"])

    def test_each_flavor_shows_its_own_privacy_line(self):
        family, playtest = self.built("family"), self.built("playtest")
        for lang, name in (("en", "educator.html"), ("es", "educador.html")):
            self.assertIn(builder.FAMILY_PRIVACY[lang], Text(family[name]).joined())
            self.assertNotIn(builder.WORDS[lang]["feedback_shared"], Text(family[name]).joined())
            self.assertNotIn("og:image", family[name])
            self.assertIn(builder.WORDS[lang]["privacy"], Text(playtest[name]).joined())
            self.assertIn(f'content="{builder.SOCIAL_IMAGE}"', playtest[name])
            self.assertIn(f'content="{builder.SITE_ORIGIN}/{name}"', playtest[name])

    def test_disclosures_repeat_the_hub_wording_exactly(self):
        tree = ast.parse((ROOT / "tools" / "build.py").read_text(encoding="utf-8"))
        hub = next(ast.literal_eval(node.value) for node in tree.body if isinstance(node, ast.Assign)
                   and any(getattr(target, "id", None) == "UI" for target in node.targets))
        files = self.built()
        for lang, name in (("en", "educator.html"), ("es", "educador.html")):
            for key in ("independent", "fellowship"):
                self.assertEqual(builder.WORDS[lang][key], hub[lang][key])
                self.assertIn(hub[lang][key], Text(files[name]).joined())
                for flavor in ("playtest", "family"):
                    page = Text(builder.page(lang, "", "test", flavor=flavor)).joined()
                    self.assertIn(hub[lang][key], page)


if __name__ == "__main__":
    unittest.main()
