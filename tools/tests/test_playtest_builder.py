"""Regression checks for safe feedback configuration and bilingual build output."""
import importlib.util
import base64
import hashlib
import html
import io
import json
import tempfile
import unittest
from contextlib import redirect_stderr
from datetime import date
from html.parser import HTMLParser
from pathlib import Path
from unittest.mock import patch

MODULE = Path(__file__).resolve().parents[1] / "make_playtest.py"
spec = importlib.util.spec_from_file_location("playtest_builder", MODULE)
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


class Elements(HTMLParser):
    def __init__(self, markup):
        super().__init__()
        self.elements = []
        self.ancestors = {}
        self.stack = []
        self.feed(markup)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.elements.append((tag, attrs))
        if "id" in attrs:
            self.ancestors[attrs["id"]] = [entry[1].get("id") for entry in self.stack]
        if tag not in {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}:
            self.stack.append((tag, attrs))

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                del self.stack[i:]
                break


class PlaytestBuilderTests(unittest.TestCase):
    def test_native_select_exception_allows_only_the_exact_browser_declaration(self):
        directives = {parts[0]: parts[1:] for item in builder.CSP.split(';') if (parts := item.split())}
        digest = base64.b64encode(hashlib.sha256(b'text-overflow:inherit').digest()).decode('ascii')
        self.assertEqual(directives['style-src'], ["'self'"])
        self.assertEqual(directives['style-src-attr'], ["'unsafe-hashes'", "'sha256-" + digest + "'"])
        self.assertEqual(directives['script-src'], ["'self'"])
        self.assertEqual(directives['media-src'], ["'self'", "blob:"])
        self.assertNotIn("'unsafe-inline'", builder.CSP)

    def test_family_boot_removes_the_feedback_module_and_retains_game_and_frame_guard(self):
        source = (MODULE.parents[1] / 'assets/playtest/boot.js').read_text(encoding='utf-8')
        output = builder.family_boot(source)
        self.assertNotIn('feedback.js', output)
        self.assertNotIn('PecanGroveFeedback', output)
        for required in ('frame-guard.js', 'styles.js', 'community-builders/cb.js', 'engine/main.js', 'shell.js'):
            self.assertIn(required, output)

    def test_feedback_destinations(self):
        for url in ("https://forms.office.com/r/abc", "https://forms.microsoft.com/Pages/ResponsePage.aspx?id=abc",
                    "https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=abc"):
            self.assertEqual(builder.checked_form(url), url)
        for url in ("http://forms.office.com/r/a", "javascript:alert(1)", "https://example.com/form",
                    "https://forms.office.com.evil.test/r/a", "https://u:p@forms.office.com/r/a",
                    "https://forms.office.com:444/r/a", "https://forms.office.com/r/a\n"):
            with self.subTest(url=url), self.assertRaises(ValueError):
                builder.checked_form(url)

    def test_languages_have_equal_shell_keys(self):
        self.assertEqual(set(builder.WORDS["en"]), set(builder.WORDS["es"]))

    def test_cloud_endpoint_validation(self):
        valid = "https://script.google.com/macros/s/AKfycb_test-123/exec"
        self.assertEqual(builder.checked_feedback_endpoint(valid), valid)
        self.assertEqual(builder.checked_feedback_endpoint(""), "")
        for url in ("http://script.google.com/macros/s/abc/exec", "https://example.com/macros/s/abc/exec",
                    "https://script.google.com.evil.test/macros/s/abc/exec", "https://u:p@script.google.com/macros/s/abc/exec",
                    "https://script.google.com/macros/s/abc/dev", "https://script.google.com/macros/s/abc/exec?email=x",
                    "https://script.google.com/macros/s/abc/exec#fragment", "https://script.google.com:444/macros/s/abc/exec",
                    "https://script.google.com/macros/s/abc/exec\n", "https://script.google.com/macros/s/../exec"):
            with self.subTest(url=url), self.assertRaises(ValueError):
                builder.checked_feedback_endpoint(url)

    def test_cloud_access_is_opt_in_at_build_time(self):
        endpoint = "https://script.google.com/macros/s/AKfycb_test-123/exec"
        local = builder.page("en", "")
        cloud = builder.page("en", "", feedback_endpoint=endpoint)
        self.assertIn("connect-src 'self'", local)
        self.assertNotIn("https://script.google.com", local)
        self.assertIn('data-endpoint=""', local)
        self.assertIn('data-endpoint="' + endpoint + '"', cloud)
        self.assertIn("connect-src 'self' https://script.google.com https://script.googleusercontent.com", cloud)
        self.assertIn("form-action 'none'", cloud)
        self.assertIn(html.escape(builder.WORDS["en"]["feedback_cloud"]), cloud)
        self.assertNotIn(builder.WORDS["en"]["feedback_local"], cloud)
        self.assertNotEqual(builder.build_id(), builder.build_id(feedback_endpoint=endpoint))

    def test_a_copy_that_sends_has_no_per_player_excel_button_and_a_local_copy_keeps_it(self):
        endpoint = "https://script.google.com/macros/s/AKfycb_test-123/exec"
        for lang in ("en", "es"):
            ids = lambda page: {attrs["id"] for _, attrs in Elements(page).elements if "id" in attrs}
            self.assertNotIn("pt-feedback-download", ids(builder.page(lang, "", feedback_endpoint=endpoint)))
            self.assertIn("pt-feedback-download", ids(builder.page(lang, "")))
            self.assertIn("pt-feedback-download", ids(builder.page(lang, "", feedback_endpoint=endpoint, flavor="library")))

    def test_close_out_code_is_embedded_only_as_a_salted_hash_with_a_new_salt_every_build(self):
        code = "maple-heron-42"
        first, second = builder.closeout_lock(code), builder.closeout_lock(code)
        self.assertRegex(first, r"^[0-9a-f]{32}:[0-9a-f]{64}$")
        self.assertNotEqual(first.split(":")[0], second.split(":")[0], "a random salt per build")
        for lock in (first, second):
            salt, digest = lock.split(":")
            self.assertEqual(hashlib.sha256((salt + ":" + code).encode("utf-8")).hexdigest(), digest)
        self.assertEqual(builder.closeout_lock(""), "")
        for lang in ("en", "es"):
            page = builder.page(lang, "", "test-revision", feedback_endpoint="https://script.google.com/macros/s/AKfycb_test-123/exec", closeout=first)
            self.assertIn(f'data-closeout="{first}"', page)
            self.assertNotIn(code, page)
            ids = {attrs["id"] for _, attrs in Elements(page).elements if "id" in attrs}
            self.assertIn("pt-closeout-open", ids)
            self.assertIn("pt-consent-options", Elements(page).ancestors["pt-closeout-open"])
            self.assertIn(html.escape(builder.WORDS[lang]["closeout_open"]), page)
            plain = builder.page(lang, "", "test-revision")
            self.assertNotIn("data-closeout", plain)
            self.assertNotIn("pt-closeout-open", plain)
            # Family and library copies never have the close-out, even if a lock is passed.
            for flavor in ("family", "library"):
                local = builder.page(lang, "", "test-revision", closeout=first, flavor=flavor)
                self.assertNotIn("data-closeout", local, flavor)
                self.assertNotIn("pt-closeout-open", local, flavor)
        with self.assertRaises(ValueError):
            builder.page("en", "", closeout="not-a-lock")
        # The build ID says only whether a code is set, so a rebuild with the same code keeps it.
        self.assertEqual(builder.build_id(closeout=True), builder.build_id(closeout=True))
        self.assertNotEqual(builder.build_id(), builder.build_id(closeout=True))

    def test_close_out_code_needs_ten_characters_of_three_kinds_and_no_spaces_at_either_end(self):
        self.assertEqual(builder.checked_closeout_code(""), "")
        for value in ("maple-heron-42", "e2e-closeout-test-code", "Heron Pond 7", "Tx7kq2Vw9m", "zorro.búho.88"):
            with self.subTest(value=value):
                self.assertEqual(builder.checked_closeout_code(value), value)
        # Too short, one or two kinds of character (all digits, all letters), a common word with digits, spaces at the ends.
        for value in ("abc123", "Ab1-Cd2", "1234567890", "abcdefghijkl", "abcdefghi1", "ABCDEFGHI-", "Password123", "Closeout-2026!", "Pecan Grove 7",
                      " maple-heron-42", "maple-heron-42 ", "maple\nheron-42", "x1-" * 67):
            with self.subTest(value=value), self.assertRaises(ValueError):
                builder.checked_closeout_code(value)

    def test_the_close_out_code_comes_from_the_environment_and_never_reaches_family_or_library(self):
        with patch.dict(builder.os.environ, {"PG_CLOSEOUT_CODE": "maple-heron-42"}):
            self.assertEqual(builder.resolve_closeout_code(None, "playtest"), "maple-heron-42")
            self.assertEqual(builder.resolve_closeout_code("", "playtest"), "", "an explicit empty argument turns it off")
            for flavor in ("family", "library"):
                self.assertEqual(builder.resolve_closeout_code(None, flavor), "", flavor)
                self.assertEqual(builder.resolve_closeout_code("other-code-1", flavor), "", flavor)
        with patch.dict(builder.os.environ, {"PG_CLOSEOUT_CODE": "short"}), self.assertRaises(ValueError):
            builder.resolve_closeout_code(None, "playtest")
        with patch.dict(builder.os.environ, {}, clear=True):
            self.assertEqual(builder.resolve_closeout_code(None, "playtest"), "")

    def test_family_flavor_removes_endpoint_and_feedback_ui_in_both_languages(self):
        endpoint = "https://script.google.com/macros/s/AKfycb_test-123/exec"
        for lang in ("en", "es"):
            page = builder.page(lang, "", "family-test", feedback_endpoint=endpoint, flavor="family")
            parsed = Elements(page)
            ids = {attrs["id"] for _, attrs in parsed.elements if "id" in attrs}
            self.assertIn('data-flavor="family"', page)
            self.assertIn("connect-src 'self'", page)
            self.assertNotIn("script.google.com", page)
            self.assertNotIn("script.googleusercontent.com", page)
            self.assertNotIn("data-endpoint", page)
            self.assertNotIn("assets/playtest/feedback.js", page)
            self.assertNotIn("assets/playtest/feedback.css", page)
            for removed in ("pt-feedback", "pt-feedback-home", "pt-review-tab", "pt-review-dialog", "pt-new-player-dialog", "pt-consent-options"):
                self.assertNotIn(removed, ids)
            self.assertIn("pt-stage", ids)
            self.assertIn("pt-start", ids)
            self.assertIn("community-builders", ids)
            self.assertEqual(page.count("<noscript>"), 1)

    def test_family_and_library_pages_show_no_playtest_only_copy(self):
        for flavor in ("family", "library"):
            for lang in ("en", "es"):
                w = builder.WORDS[lang]
                page = builder.page(lang, "", "local-test", flavor=flavor)
                ids = {attrs["id"] for _, attrs in Elements(page).elements if "id" in attrs}
                for removed in ("pt-version-tag", "pt-intro-note", "pt-guide", "pt-consent-scores", "pt-consent-auto"):
                    self.assertNotIn(removed, ids, (flavor, lang))
                self.assertNotIn("data-pg-consent", page, (flavor, lang))
                for key in ("title", "h1", "intro_note", "instructions", "foot", "privacy", "consent_scores"):
                    self.assertNotIn(html.escape(w[key]), page, (flavor, lang, key))
                self.assertNotIn(w["version_badge"].split("{date}")[0].strip(), page)
                for key in ("title_local", "h1_local", "foot_local"):
                    self.assertIn(html.escape(w[key]), page, (flavor, lang, key))
                # The credit sentences stay word for word; only the play-test description goes.
                self.assertTrue(w["foot"].endswith(w["foot_local"]))
                if flavor == "library":
                    self.assertIn(html.escape(w["privacy_library"]), page)
                    self.assertIn("pt-review-tab", ids, "library keeps its local notes")
                    # Shared library computers keep Next player and the device panel in the For grown-ups box.
                    parsed = Elements(page)
                    for element_id in ("pt-feedback-new-player-top", "pt-device-open", "pt-shared-top"):
                        self.assertIn("pt-consent-options", parsed.ancestors[element_id], (lang, element_id))
                else:
                    self.assertNotIn("pt-consent-options", ids, (flavor, lang))

    def test_playtest_page_keeps_its_test_copy_and_starts_right_under_the_heading(self):
        for lang in ("en", "es"):
            w = builder.WORDS[lang]
            page = builder.page(lang, "", "playtest-test")
            for key in ("h1", "intro_note", "instructions", "foot"):
                self.assertIn(html.escape(w[key]), page)
            self.assertLess(page.index('id="pt-h"'), page.index('id="pt-quiet"'))
            self.assertLess(page.index('id="pt-quiet"'), page.index('id="pt-start"'))
            self.assertLess(page.index('id="pt-start"'), page.index(html.escape(w["lead"])), "Start comes before the grown-up project copy")
            # The toolbar's Review / Feedback tab and the dock below the game already open the one feedback form.
            self.assertNotIn("pt-feedback-jump", page)
            self.assertIn('id="pt-review-tab"', page)
            self.assertIn('id="pt-feedback-home"', page)

    def test_every_flavor_has_a_bilingual_accessibility_statement_with_a_barrier_contact(self):
        for flavor in ("playtest", "family", "library"):
            for lang in ("en", "es"):
                w = builder.WORDS[lang]
                page = builder.page(lang, "", "access-test", flavor=flavor)
                ids = {attrs["id"] for _, attrs in Elements(page).elements if "id" in attrs}
                self.assertIn("pt-access", ids, (flavor, lang))
                for key in ("access_title", "access_goal", "access_gaps", "access_contact", "access_contact_detail"):
                    self.assertIn(html.escape(w[key]), page, (flavor, lang, key))
                self.assertIn(f'href="mailto:{builder.ACCESS_CONTACT}"', page)

    def test_score_options_start_off_and_keep_native_checkbox_labels(self):
        for lang in ("en", "es"):
            parsed = Elements(builder.page(lang, ""))
            options = [attrs for tag, attrs in parsed.elements if tag == "input" and "data-pg-consent" in attrs]
            self.assertEqual({attrs["data-pg-consent"] for attrs in options}, {"scores", "autoScores"})
            self.assertTrue(all(attrs.get("type") == "checkbox" and "checked" not in attrs for attrs in options))
            self.assertEqual(sum(tag == "noscript" for tag, _ in parsed.elements), 1)
            labels = [attrs["aria-label"] for tag, attrs in parsed.elements if "aria-label" in attrs and tag in {"nav", "section", "div"}]
            self.assertNotEqual(labels.count(builder.WORDS[lang]["brand"]), 3)

    def test_generated_privacy_copy_has_no_automatic_sending_promise(self):
        for lang in ("en", "es"):
            page = builder.page(lang, "", feedback_endpoint="https://script.google.com/macros/s/AKfycb_test-123/exec").lower()
            for phrase in ("automatically", "as you type", "backs up", "automática", "mientras escribes"):
                self.assertNotIn(phrase, page)
            self.assertIn('<script type="module" src="assets/playtest/boot.js"></script>', page)
            self.assertIn('rel="manifest"', page)
            self.assertIn("worker-src 'self'", page)
            self.assertIn("manifest-src 'self'", page)

    def test_missing_deployment_configuration_keeps_backup_off(self):
        with tempfile.TemporaryDirectory() as folder:
            self.assertEqual(builder.resolve_feedback_endpoint(None, Path(folder) / "missing.json"), "")

    def test_saved_deployment_survives_an_ordinary_rebuild(self):
        endpoint = "https://script.google.com/macros/s/AKfycb_saved/exec"
        with tempfile.TemporaryDirectory() as folder:
            config = Path(folder) / "deployment.json"
            config.write_text(json.dumps({"schemaVersion": 1, "feedbackEndpoint": endpoint}), encoding="utf-8")
            resolved = builder.resolve_feedback_endpoint(None, config)
            self.assertEqual(resolved, endpoint)
            for lang in ("en", "es"):
                self.assertIn('data-endpoint="' + endpoint + '"', builder.page(lang, "", feedback_endpoint=resolved))

    def test_explicit_endpoint_override_and_disable_ignore_saved_configuration(self):
        endpoint = "https://script.google.com/macros/s/AKfycb_override/exec"
        with tempfile.TemporaryDirectory() as folder:
            config = Path(folder) / "deployment.json"
            config.write_text("invalid JSON", encoding="utf-8")
            self.assertEqual(builder.resolve_feedback_endpoint(endpoint, config), endpoint)
            self.assertEqual(builder.resolve_feedback_endpoint("", config), "")
            with self.assertRaises(ValueError):
                builder.resolve_feedback_endpoint("https://example.com/exec", config)

    def test_invalid_deployment_configuration_is_rejected(self):
        endpoint = "https://script.google.com/macros/s/AKfycb_saved/exec"
        invalid = ("{broken", "[]", "null", '{}',
                   json.dumps({"schemaVersion": True, "feedbackEndpoint": endpoint}),
                   json.dumps({"schemaVersion": 2, "feedbackEndpoint": endpoint}),
                   json.dumps({"schemaVersion": 1, "feedbackEndpoint": None}),
                   json.dumps({"schemaVersion": 1, "feedbackEndpoint": "https://example.com/exec"}),
                   json.dumps({"schemaVersion": 1, "feedbackEndpoint": endpoint, "token": "should-not-be-here"}))
        with tempfile.TemporaryDirectory() as folder:
            config = Path(folder) / "deployment.json"
            for content in invalid:
                with self.subTest(content=content):
                    config.write_text(content, encoding="utf-8")
                    with self.assertRaises(ValueError):
                        builder.resolve_feedback_endpoint(None, config)

    def test_invalid_saved_configuration_stops_before_touching_output(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            config = root / "backend" / "feedback" / "deployment.json"
            config.parent.mkdir(parents=True)
            config.write_text('{"schemaVersion":1,"feedbackEndpoint":"https://example.com/exec"}', encoding="utf-8")
            output = root / "_publish" / "pecan-grove-playtest"
            output.mkdir(parents=True)
            sentinel = output / "index.html"
            sentinel.write_text("previous reviewed release", encoding="utf-8")
            with patch.object(builder, "ROOT", root), patch.object(builder, "OUT", output), \
                    patch.object(builder.subprocess, "run") as run, patch.object(builder.shutil, "which") as which, \
                    redirect_stderr(io.StringIO()), self.assertRaises(SystemExit) as error:
                builder.main([])
            self.assertEqual(error.exception.code, 2)
            run.assert_not_called()
            which.assert_not_called()
            self.assertEqual(sentinel.read_text(encoding="utf-8"), "previous reviewed release")

    def test_inline_feedback_is_bilingual_below_the_game(self):
        for lang in ("en", "es"):
            page = builder.page(lang, "", "test-revision")
            self.assertLess(page.index('id="community-builders"'), page.index('id="pt-feedback"'))
            self.assertIn('data-lang="' + lang + '" data-build="test-revision"', page)
            self.assertIn('href="assets/playtest/feedback.css"', page)
            self.assertIn('<script type="module" src="assets/playtest/boot.js"></script>', page)
            self.assertEqual(sum(tag == "script" for tag, _ in Elements(page).elements), 1, "The ordered boot module is the only executable entry point")
            self.assertIn(builder.WORDS[lang]["feedback_hint"], page)
            parsed = Elements(page)
            ids = [attrs["id"] for _, attrs in parsed.elements if "id" in attrs]
            self.assertEqual(len(ids), len(set(ids)), "IDs must be unique")
            for field in ("stop", "rating", "category", "worked", "fix"):
                field_id = "pt-feedback-" + field
                self.assertTrue(any(attrs.get("for") == field_id for tag, attrs in parsed.elements if tag == "label"))
                self.assertTrue(any(attrs.get("id") == field_id and attrs.get("name") == field for tag, attrs in parsed.elements if tag in {"select", "textarea"}))
            self.assertTrue(any(attrs.get("id") == "pt-feedback-status" and attrs.get("role") == "status" for _, attrs in parsed.elements))
            self.assertTrue(any(attrs.get("id") == "pt-feedback-download" and attrs.get("type") == "button" for _, attrs in parsed.elements))
            self.assertTrue(any(attrs.get("id") == "pt-feedback-new-player" and attrs.get("type") == "button" for _, attrs in parsed.elements))
            self.assertTrue(any(attrs.get("id") == "pt-feedback-new-player-top" and attrs.get("type") == "button" for _, attrs in parsed.elements))
            self.assertTrue(any(attrs.get("id") == "pt-feedback-player" for _, attrs in parsed.elements))
            for n in range(16):
                self.assertIn(f'<option value="{n}">', page)
            self.assertNotIn('name="email"', page)
            self.assertNotIn('name="name"', page)
            self.assertIn('<option value="spanish">', page)

    def test_ordered_boot_guards_frames_and_waits_for_feedback_session_before_core(self):
        boot = (builder.ROOT / "assets" / "playtest" / "boot.js").read_text(encoding="utf-8")
        self.assertIn("import './frame-guard.js'", boot)
        self.assertIn("document.documentElement.dataset.flavor !== 'family'", boot)
        self.assertLess(boot.index("import './frame-guard.js'"), boot.index("import('./feedback.js')"))
        self.assertLess(boot.index("await import('./feedback.js')"), boot.index("import('../games/community-builders/cb.js')"), "The feedback module stamps the anonymous session before the game reads saves")
        self.assertNotIn("PecanGroveFeedback?.ready", boot.split("import('../games/community-builders/cb.js')", 1)[0])
        self.assertLess(boot.index("import('../games/community-builders/cb.js')"), boot.index("import('./shell.js')"), "Shell must use the initialized core game API")

    def test_navigation_build_and_optional_feedback(self):
        for lang, destination in (("en", "espanol.html"), ("es", "index.html")):
            page = builder.page(lang, "", "test-revision", date(2026, 10, 12))
            self.assertTrue(any(tag == "html" and attrs.get("lang") == lang and attrs.get("data-flavor") == "playtest" for tag, attrs in Elements(page).elements))
            self.assertIn(f'data-language-url="{destination}"', page)
            self.assertIn('id="pt-start" type="button"', page)
            self.assertIn('href="#pt-h"', page)
            self.assertIn('<details class="pt-guide" id="pt-guide">', page)
            self.assertNotIn('<details class="pt-guide" open', page)
            # PG-UX-B01: the test's instructions follow Start, before the story and the small print; no eyebrow.
            self.assertLess(page.index('id="pt-start"'), page.index('id="pt-guide"'))
            self.assertLess(page.index('id="pt-guide"'), page.index('class="pt-lead"'))
            self.assertLess(page.index('id="pt-consent-options"'), page.index('id="pt-disclosure"'))
            self.assertNotIn('pt-eyebrow', page)
            # PG-UX-B11: the two questions a note is for come first in the feedback form, the optional lists after.
            self.assertLess(page.index('id="pt-feedback-privacy"'), page.index('id="pt-feedback-worked"'))
            self.assertLess(page.index('id="pt-feedback-fix"'), page.index('id="pt-feedback-stop"'))
            self.assertIn('content="test-revision"', page)
            self.assertIn('noindex, nofollow', page)
            self.assertNotIn('target="_blank"', page)
            linked = builder.page(lang, "https://forms.office.com/r/test?a=1&b=2", "test-revision")
            self.assertIn('a=1&amp;b=2', linked)
            self.assertIn('rel="noopener"', linked)
            self.assertIn(builder.WORDS[lang]["external"], linked)

    def test_staged_play_keeps_feedback_and_tools_inside_the_fullscreen_container(self):
        for lang in ("en", "es"):
            page = builder.page(lang, "", "flow-revision")
            parsed = Elements(page)
            attrs_by_id = {attrs["id"]: attrs for _, attrs in parsed.elements if "id" in attrs}
            self.assertLess(page.index('id="pt-intro"'), page.index('id="pt-stage"'))
            self.assertNotIn("pt-stage", parsed.ancestors["pt-intro"])
            self.assertIn("data-playtest-stage", attrs_by_id["pt-stage"])
            self.assertEqual(attrs_by_id["community-builders"]["data-playtest-paused"], "true")
            for element_id in ("community-builders", "pt-feedback", "pt-review-tab", "pt-library-tab", "pt-grownups-tab", "pt-exit", "pt-review-dialog", "pt-new-player-dialog"):
                self.assertIn("pt-stage", parsed.ancestors[element_id], element_id + " must remain reachable in fullscreen")
            self.assertIn("pt-feedback-home", parsed.ancestors["pt-feedback"])
            self.assertNotIn("pt-review-dialog", parsed.ancestors["pt-feedback"], "The one live form starts below the game")
            self.assertEqual(sum(tag == "form" and attrs.get("id") == "pt-feedback-form" for tag, attrs in parsed.elements), 1)
            self.assertEqual(attrs_by_id["pt-review-tab"]["aria-expanded"], "false")
            self.assertEqual(attrs_by_id["pt-review-tab"]["aria-controls"], "pt-review-dialog")
            for element_id in ("pt-review-tab", "pt-library-tab", "pt-grownups-tab", "pt-review-float", "pt-review-dock", "pt-review-close", "pt-new-player-cancel", "pt-new-player-confirm"):
                self.assertEqual(attrs_by_id[element_id]["type"], "button")
            self.assertIn('href="assets/playtest/shell.css"', page)
            self.assertIn('<script type="module" src="assets/playtest/boot.js"></script>', page)
            for key in ("team", "team_about", "purpose", "quiet", "quiet_hint", "review_tab", "library_tab", "grownups_tab", "new_title", "new_cancel", "new_confirm"):
                self.assertIn(html.escape(builder.WORDS[lang][key]), page)

    def test_pages_credit_the_studio_instead_of_a_person(self):
        for lang in ("en", "es"):
            page = builder.page(lang, "")
            self.assertIn(html.escape(builder.WORDS[lang]["team"]), page)
            self.assertIn("A2 Learning Studio", builder.WORDS[lang]["team"])
            self.assertIn('<meta name="author" content="A2 Learning Studio">', page)
            self.assertNotIn("Ali Keyvanfar", page)
            self.assertNotIn("Keyvanfar", page)

    def test_playtest_pages_publish_a_large_social_card(self):
        image = "https://a2-learning-studio.github.io/pecan-grove-playtest/social-preview.jpg"
        for lang in ("en", "es"):
            page = builder.page(lang, "")
            metas = {attrs.get("property") or attrs.get("name"): attrs.get("content") for tag, attrs in Elements(page).elements if tag == "meta"}
            card = builder.SOCIAL[lang]
            self.assertEqual(metas["og:type"], "website")
            self.assertEqual(metas["og:title"], card["title"])
            self.assertEqual(metas["og:description"], card["description"])
            self.assertLessEqual(len(card["description"]), 200)
            self.assertEqual(metas["og:url"], card["url"])
            self.assertEqual(metas["og:image"], image)
            self.assertTrue(metas["og:image"].startswith("https://"))
            self.assertEqual(metas["og:image:width"], "1200")
            self.assertEqual(metas["og:image:height"], "627")
            self.assertEqual(metas["twitter:card"], "summary_large_image")
            self.assertEqual(metas["twitter:image"], image)
            self.assertIn('name="twitter:card" content="summary_large_image"', page)
        for flavor in ("family", "library"):
            self.assertNotIn("og:image", builder.page("en", "", flavor=flavor))
        preview = builder.ROOT / "assets" / "img" / "social-preview.jpg"
        self.assertTrue(preview.is_file(), "Run npm run images to create the social preview")
        self.assertLess(preview.stat().st_size, 1_000_000)
        self.assertEqual(jpeg_size(preview.read_bytes()), (1200, 627))

    def test_the_locked_also_send_box_says_why_on_the_intro(self):
        # Review of the 2026-10-30 round: only the in-game For grown-ups dialog said why "Also send each score" is locked.
        for lang in ("en", "es"):
            page = builder.page(lang, "")
            parsed = Elements(page)
            why = next(attrs for tag, attrs in parsed.elements if attrs.get("id") == "pt-consent-why")
            self.assertIn("data-pg-consent-why", why)
            self.assertIn("pt-consent-options", parsed.ancestors["pt-consent-why"])
            auto = next(attrs for tag, attrs in parsed.elements if tag == "input" and attrs.get("data-pg-consent") == "autoScores")
            self.assertEqual(auto.get("aria-describedby"), "pt-consent-why")
            self.assertIn(html.escape(builder.WORDS[lang]["consent_auto_needs_scores"]), page)
            library = builder.local_page(page, lang, "library")
            self.assertNotIn("pt-consent-why", library)

    def test_next_player_and_device_panel_live_in_for_grown_ups_not_beside_start(self):
        for lang in ("en", "es"):
            page = builder.page(lang, "")
            parsed = Elements(page)
            for element_id in ("pt-feedback-new-player-top", "pt-device-open", "pt-shared-top"):
                self.assertIn("pt-consent-options", parsed.ancestors[element_id], element_id)
            self.assertNotIn("pt-consent-options", parsed.ancestors["pt-start"])
            self.assertIn(">" + html.escape(builder.WORDS[lang]["feedback_new_player"]) + "</button>", page)
            self.assertIn(builder.WORDS[lang]["consent_auto_hint"], page)
            self.assertIn("pt-feedback", parsed.ancestors["pt-feedback-device"])
            buttons = {attrs["id"]: attrs.get("class") for tag, attrs in parsed.elements if tag == "button" and "id" in attrs}
            # Keeping the current player is the safe default; starting the next player is the secondary choice.
            self.assertEqual(buttons["pt-new-player-cancel"], "pt-btn")
            self.assertEqual(buttons["pt-new-player-confirm"], "pt-btn pt-btn--secondary")
            family = builder.page(lang, "", "family-test", flavor="family")
            self.assertNotIn("pt-device-open", family)
            self.assertNotIn("pt-feedback-new-player-top", family)

    def test_robots_says_it_has_no_effect_under_the_subpath_and_pages_use_noindex(self):
        self.assertIn("has no effect under /pecan-grove-playtest/", builder.robots_txt())
        self.assertIn('<meta name="robots" content="noindex, nofollow">', builder.page("en", ""))

    def test_robots_allows_preview_crawlers_and_blocks_search(self):
        text = builder.robots_txt()
        for agent in ("LinkedInBot", "Twitterbot", "facebookexternalhit", "WhatsApp"):
            self.assertIn(f"User-agent: {agent}\nAllow: /", text)
        self.assertIn("User-agent: *\nDisallow: /", text)
        self.assertLess(text.index("User-agent: LinkedInBot"), text.index("User-agent: *"))


def jpeg_size(data):
    if data[:2] != b"\xff\xd8":
        raise ValueError("not a jpeg")
    index = 2
    while index + 8 < len(data):
        if data[index] != 0xFF:
            raise ValueError("bad jpeg marker")
        while data[index] == 0xFF:
            index += 1
        marker = data[index]
        index += 1
        if marker in (0xD8, 0xD9):
            continue
        if marker == 0xDA:
            break
        length = int.from_bytes(data[index:index + 2], "big")
        if marker in (0xC0, 0xC1, 0xC2):
            height = int.from_bytes(data[index + 3:index + 5], "big")
            width = int.from_bytes(data[index + 5:index + 7], "big")
            return width, height
        index += length
    raise ValueError("jpeg has no size marker")


if __name__ == "__main__":
    unittest.main()
