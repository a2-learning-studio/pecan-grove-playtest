import contextlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location("source_integration", Path(__file__).parents[1] / "integrate_reviewed_changes.py")
integration = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(integration)


class SourceIntegrationTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix=".integration-test-", dir=Path(__file__).resolve().parents[2])
        self.root = Path(self.temporary.name)
        self.assertTrue(self.root.resolve().is_relative_to(Path(__file__).resolve().parents[2]))
        self.work, self.original = self.root / "reviewed", self.root / "original"
        self.work.mkdir(); self.original.mkdir()
        self.plan = self.work / "integration-plan.json"
        self.patches = patch.multiple(integration, WORK=self.work, ORIGINAL=self.original,
                                      PLAN=self.plan, BACKUPS=self.work / "backups")
        self.patches.start()
        self.addCleanup(self.patches.stop)
        self.addCleanup(self.temporary.cleanup)
        self.write(self.work, "assets/games/community-builders/cb.js", "new game")
        self.write(self.original, "assets/games/community-builders/cb.js", "old game")
        self.write(self.original, "docs/assets/games/community-builders/cb.js", "old mirror")
        self.write(self.work, "package.json", '{"name":"reviewed"}')

    def write(self, root, relative, text):
        path = root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")
        return path

    def prepare(self):
        with contextlib.redirect_stdout(io.StringIO()):
            return integration.prepare()

    def apply(self):
        with contextlib.redirect_stdout(io.StringIO()):
            integration.apply()

    def test_plan_mirrors_game_and_excludes_private_and_release_files(self):
        self.write(self.work, "tools/requirements-build.txt", "fonttools==4.62.1\n")
        for relative in ["_publish/pecan-grove-playtest/index.html", "dist/index.html",
                         "backend/feedback/deployment.json", "assets/playtest/live-verification.json",
                         "assets/games/community-builders/metadata/private.json", "backups/private.js",
                         "node_modules/private.js", "docs/feedback-endpoint.md"]:
            self.write(self.work, relative, "excluded")
        before = (self.original / "assets/games/community-builders/cb.js").read_bytes()
        plan = self.prepare()
        self.assertEqual(plan["stats"]["changed_files"], 4)
        self.assertEqual({item["destination"] for item in plan["files"]},
                         {"package.json", "tools/requirements-build.txt", "assets/games/community-builders/cb.js", "docs/assets/games/community-builders/cb.js"})
        self.assertEqual((self.original / "assets/games/community-builders/cb.js").read_bytes(), before)
        self.assertEqual([path.name for path in (self.work / "backups").iterdir()], ["private.js"])

    def test_whole_plan_detects_canonical_change_before_any_write(self):
        self.prepare()
        self.write(self.original, "docs/assets/games/community-builders/cb.js", "another editor")
        with self.assertRaisesRegex(SystemExit, "canonical file changed"):
            self.apply()
        self.assertEqual((self.original / "assets/games/community-builders/cb.js").read_text(), "old game")
        self.assertFalse((self.work / "backups").exists())

    def test_unchanged_inventory_and_added_source_are_guarded(self):
        self.write(self.original, "package.json", '{"name":"reviewed"}')
        self.prepare()
        self.write(self.work, "package.json", '{"name":"changed"}')
        with self.assertRaisesRegex(SystemExit, "reviewed source changed"):
            self.apply()
        self.prepare()
        self.write(self.work, "assets/playtest/new.js", "added after review")
        with self.assertRaisesRegex(SystemExit, "allowlist"):
            self.apply()
        self.assertFalse((self.work / "backups").exists())

    def test_tampered_destination_is_rejected_before_writes(self):
        plan = self.prepare()
        plan["files"][0]["destination"] = "../outside.js"
        self.plan.write_text(json.dumps(plan), encoding="utf-8")
        with self.assertRaises(SystemExit):
            self.apply()
        self.assertFalse((self.root / "outside.js").exists())
        self.assertFalse((self.work / "backups").exists())

    def test_apply_backs_up_old_files_payload_and_uses_new_version_next_time(self):
        first = self.prepare(); self.apply()
        backup = self.work / "backups" / ("source-before-integration-" + first["id"])
        self.assertEqual((backup / "original/assets/games/community-builders/cb.js").read_text(), "old game")
        self.assertEqual((backup / "original/docs/assets/games/community-builders/cb.js").read_text(), "old mirror")
        self.assertEqual((backup / "reviewed-source/assets/games/community-builders/cb.js").read_text(), "new game")
        receipt = (backup / "receipt.json").read_bytes()
        self.assertFalse(json.loads(receipt)["published"])
        with self.assertRaises(SystemExit): self.apply()
        self.write(self.work, "assets/games/community-builders/cb.js", "next review")
        second = self.prepare(); self.assertNotEqual(first["id"], second["id"]); self.apply()
        self.assertEqual((backup / "receipt.json").read_bytes(), receipt)
        self.assertEqual((self.original / "docs/assets/games/community-builders/cb.js").read_text(), "next review")

    def test_staging_race_is_caught_before_canonical_replacements(self):
        self.prepare()
        original_copy = integration.shutil.copy2
        changed = False
        def race(source, target, *args, **kwargs):
            nonlocal changed
            result = original_copy(source, target, *args, **kwargs)
            if not changed:
                changed = True
                self.write(self.original, "package.json", "concurrent package")
            return result
        with patch.object(integration.shutil, "copy2", side_effect=race):
            with self.assertRaisesRegex(SystemExit, "canonical file changed"):
                self.apply()
        self.assertEqual((self.original / "assets/games/community-builders/cb.js").read_text(), "old game")
        self.assertEqual((self.original / "docs/assets/games/community-builders/cb.js").read_text(), "old mirror")

    def test_existing_backup_aborts_without_canonical_writes(self):
        plan = self.prepare()
        (self.work / "backups" / ("source-before-integration-" + plan["id"])).mkdir(parents=True)
        with self.assertRaisesRegex(SystemExit, "backup already exists"):
            self.apply()
        self.assertEqual((self.original / "assets/games/community-builders/cb.js").read_text(), "old game")


if __name__ == "__main__":
    unittest.main()
