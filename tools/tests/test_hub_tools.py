"""Hub-only tools kept in this repository must not damage it when someone runs them here."""
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


class HubToolsTest(unittest.TestCase):
    def test_hub_site_generator_refuses_to_empty_docs_here(self):
        docs = sorted(p.relative_to(ROOT).as_posix() for p in (ROOT / "docs").rglob("*") if p.is_file())
        before = {name: (ROOT / name).stat().st_mtime_ns for name in docs}
        result = subprocess.run([sys.executable, "-I", "-B", str(ROOT / "tools" / "build.py")], cwd=ROOT,
                                capture_output=True, text=True, timeout=60)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("npm run build", result.stderr)
        after = sorted(p.relative_to(ROOT).as_posix() for p in (ROOT / "docs").rglob("*") if p.is_file())
        self.assertEqual(after, docs)
        self.assertEqual({name: (ROOT / name).stat().st_mtime_ns for name in after}, before)


if __name__ == "__main__":
    unittest.main()
