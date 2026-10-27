"""Back up and integrate reviewed feedback files; refuse concurrent source changes.

Hub-only owner tool from the 12 Oct 2026 feedback update: ORIGINAL is the hub copy on the owner's computer. Nothing in this
repository's build, tests, npm scripts or CI runs or imports it.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import shutil

WORK = Path(__file__).resolve().parents[1]
ORIGINAL = Path(r"C:\Users\alike\OneDrive - Kennesaw State University\22- Fall 26\Know Your Data Center (site)")
EXPORT = Path("_publish/pecan-grove-playtest")
PLAN = WORK / "feedback-integration-plan.json"
BACKUP = WORK / "backups/feedback-update-2026-10-12"


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest() if path.is_file() else None


def contained(root, path):
    if not path.resolve().is_relative_to(root.resolve()):
        raise SystemExit(f"Target escaped project: {path}")
    return path


def prepare():
    pairs = [("assets/games/community-builders/cb.js", "assets/games/community-builders/cb.js"),
             ("assets/games/community-builders/cb.js", "docs/assets/games/community-builders/cb.js"),
             ("assets/games/community-builders/cb.css", "assets/games/community-builders/cb.css"),
             ("assets/games/community-builders/cb.css", "docs/assets/games/community-builders/cb.css"),
             ("tools/make_playtest.py", "tools/make_playtest.py"),
             ("tools/integrate_feedback.py", "tools/integrate_feedback.py"),
             ("tools/smoke_feedback_endpoint.py", "tools/smoke_feedback_endpoint.py"),
             ("FEEDBACK-RELEASE-REPORT.md", "_handoff/codex-improvements-2026-10-12/FEEDBACK-RELEASE-REPORT.md")]
    for folder in ("assets/playtest", "backend/feedback", "tools/tests"):
        for source in sorted((WORK / folder).iterdir()):
            if source.is_file() and source.suffix in {".js", ".css", ".gs", ".json", ".md", ".cjs", ".mjs", ".py"}:
                relative = source.relative_to(WORK).as_posix()
                pairs.append((relative, relative))
    for source in sorted((WORK / EXPORT).rglob("*")):
        if source.is_file() and ".git" not in source.parts and source.name.lower() not in {"desktop.ini", "thumbs.db", ".ds_store"}:
            relative = source.relative_to(WORK).as_posix()
            pairs.append((relative, relative))
    changes = []
    for source, target in pairs:
        before, after = digest(contained(ORIGINAL, ORIGINAL / target)), digest(contained(WORK, WORK / source))
        if not after:
            raise SystemExit(f"Missing reviewed source: {source}")
        if before != after:
            changes.append({"source": source, "target": target, "before": before, "after": after})
    PLAN.write_text(json.dumps({"status": "prepared", "files": changes}, indent=2) + "\n", encoding="utf-8")
    print(f"Prepared {len(changes)} changed files; no original files modified.")


def apply():
    plan = json.loads(PLAN.read_text(encoding="utf-8"))
    if plan["status"] != "prepared" or BACKUP.exists():
        raise SystemExit("Integration already applied or backup exists; review instead of overwriting it.")
    for change in plan["files"]:
        source, target = contained(WORK, WORK / change["source"]), contained(ORIGINAL, ORIGINAL / change["target"])
        if digest(source) != change["after"] or digest(target) != change["before"]:
            raise SystemExit(f"Concurrent change detected: {target}")
    BACKUP.mkdir(parents=True)
    for change in plan["files"]:
        source, target = WORK / change["source"], ORIGINAL / change["target"]
        if target.is_file():
            saved = contained(BACKUP, BACKUP / change["target"])
            saved.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(target, saved)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
        if digest(target) != change["after"]:
            raise SystemExit(f"Integration verification failed: {target}")
    plan["status"] = "applied"
    (BACKUP / "receipt.json").write_text(json.dumps(plan, indent=2) + "\n", encoding="utf-8")
    PLAN.write_text(json.dumps(plan, indent=2) + "\n", encoding="utf-8")
    print(f"Integrated and verified {len(plan['files'])} files. Previous files preserved in {BACKUP}.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=["prepare", "apply"])
    parser.add_argument("--batch", default="", help="Separate backup receipt for a later reviewed correction")
    args = parser.parse_args()
    if args.batch:
        if not re.fullmatch(r"[a-z0-9-]{1,64}", args.batch):
            parser.error("Invalid batch name")
        PLAN = WORK / f"feedback-integration-{args.batch}.json"
        BACKUP = WORK / f"backups/feedback-update-2026-10-12-{args.batch}"
    prepare() if args.mode == "prepare" else apply()
