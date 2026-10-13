"""Plan and safely integrate reviewed source; never delete, publish or copy release exports."""
import argparse
from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import uuid

WORK = Path(__file__).resolve().parents[1]
ORIGINAL = Path(r"C:\Users\alike\OneDrive - Kennesaw State University\22- Fall 26\Know Your Data Center (site)").resolve()
PLAN = WORK / "integration-plan.json"
BACKUPS = WORK / "backups"
GAME = PurePosixPath("assets/games/community-builders")
DENIED_PARTS = {".git", "node_modules", "dist", "dist-family", "_publish", "backups", "__pycache__", ".vite", "test-results", "playwright-report", "metadata"}
DENIED_NAMES = {"desktop.ini", "thumbs.db", ".ds_store", "deployment.json", "activation-status.md", "feedback-endpoint.md"}
ROOT_FILES = {"package.json", "package-lock.json", "eslint.config.mjs", "stylelint.config.mjs", "playwright.config.js", "lighthouserc.json", ".gitignore", "DESIGN.md", "PRODUCT.md"}
TOOL_FILES = {"build.mjs", "build.py", "make_playtest.py", "validate_game.mjs", "images.mjs", "generate-game-locales.cjs", "generate-shell-locales.cjs", "migrate-content-banks.cjs", "run-tests.cjs", "sw-template.js", "check_audio_release.py", "make_voice_assets.py", "make_voice_script.py", "make_handout.py", "pre-commit.mjs", "check-commit-message.mjs", "check-no-emoji.mjs", "check-privacy-copy.mjs", "readability.mjs", "export-animal-review.mjs", "cb-stop-module-guide.md", "integrate_reviewed_changes.py", "critical-css.mjs", "palette.mjs", "performance-scenarios.mjs", "test-engine-coverage.mjs", "subset_fonts.py", "privacy-baseline-proof.mjs"}
DOC_FILES = {"source-map.md", "stop-api.md", "stop-api.d.ts", "stops-audit.md", "engine-content-review.md", "engine-copy-review.md", "engine-human-review.md", "Pecan_Grove_Modernization_Spec.md", "e2e-coverage.md", "quality-checks.md", "readability-method.md", "readability-exceptions.json", "privacy-baseline-proof.md", "performance.md", "spec-acceptance-audit.md"}
BACKEND_FILES = {"Code.gs", "appsscript.json", "README.md", "feedback-backend.test.cjs"}
TOOL_FILES.add("check-fact-sources.mjs")
TOOL_FILES.add("requirements-build.txt")
TOOL_FILES.update({"delivery-manifest.mjs", "performance-checks.mjs", "webkit-csp-probe.mjs"})
DOC_FILES.update({"content-review.md", "engine-coverage.json", "engine-coverage.txt"})
ROOT_FILES.update({".gitattributes", "IMPLEMENTATION-REPORT.md", "pecan-grove-comprehensive-audit-2026-10-12.md"})
ROOT_FILES.add("assets/img/mark.svg")
TREES = {
    "assets/games/community-builders": {".js", ".css", ".json", ".svg", ".webp", ".avif", ".png", ".jpg", ".jpeg", ".mp3"},
    "assets/playtest": {".js", ".css", ".json", ".svg", ".png", ".webp", ".avif"},
    "assets/css": {".css"}, "assets/fonts": {".woff", ".woff2", ".ttf", ".otf"},
    "assets/icons": {".png", ".svg"},
    "tools/tests": {".py", ".cjs", ".mjs", ".js", ".json"},
    "tests": {".py", ".cjs", ".mjs", ".js", ".json"},
    "docs/engine-art-review": {".html", ".css", ".svg", ".png", ".webp", ".avif"},
}


def relative_path(value):
    if not isinstance(value, str) or not value or "\\" in value or ":" in value or "\0" in value:
        raise SystemExit("Invalid relative integration path.")
    path = PurePosixPath(value)
    if path.is_absolute() or any(part in {"", ".", ".."} for part in value.split("/")):
        raise SystemExit("Invalid relative integration path.")
    return path


def forbidden(value):
    path = relative_path(str(value))
    name = path.name.lower()
    return (any(part.lower() in DENIED_PARTS for part in path.parts) or name in DENIED_NAMES
            or "verification" in name or name.endswith((".pyc", ".log"))
            or name.startswith(("integration-", "feedback-integration-")))


def inside(root, value):
    root = root.resolve()
    parts = relative_path(str(value)).parts
    target = root.joinpath(*parts)
    for candidate in [target, *list(target.parents)[:len(parts) - 1]]:
        if candidate.is_symlink() or (hasattr(candidate, "is_junction") and candidate.is_junction()):
            raise SystemExit("Linked integration paths are not allowed.")
    resolved = target.resolve()
    if not resolved.is_relative_to(root) or resolved == root:
        raise SystemExit("Integration path escaped its project.")
    if resolved.exists() and not resolved.is_file():
        raise SystemExit("An integration file path is occupied by a directory.")
    return resolved


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest() if path.is_file() else None


def allowed_sources():
    selected = set()
    explicit = set(ROOT_FILES)
    explicit.update("tools/" + name for name in TOOL_FILES)
    explicit.update("docs/" + name for name in DOC_FILES)
    explicit.update("backend/feedback/" + name for name in BACKEND_FILES)
    explicit.update({".github/workflows/modernization.yml", ".githooks/pre-commit", ".githooks/commit-msg"})
    for relative in explicit:
        if inside(WORK, relative).is_file():
            selected.add(relative)
    for tree, extensions in TREES.items():
        folder = WORK.joinpath(*PurePosixPath(tree).parts)
        if not folder.is_dir():
            continue
        for directory, dirs, names in os.walk(folder, followlinks=False):
            dirs[:] = sorted(name for name in dirs if not forbidden(Path(directory, name).relative_to(WORK).as_posix()))
            for name in sorted(names):
                relative = Path(directory, name).relative_to(WORK).as_posix()
                if not forbidden(relative) and Path(name).suffix.lower() in extensions:
                    inside(WORK, relative)
                    selected.add(relative)
    return sorted(selected)


def pairs():
    result = []
    for source in allowed_sources():
        result.append((source, source))
        if PurePosixPath(source).is_relative_to(GAME):
            result.append((source, "docs/" + source))
    return sorted(result)


def atomic_json(path, value):
    temporary = path.with_name("." + path.name + "." + uuid.uuid4().hex + ".tmp")
    try:
        with temporary.open("x", encoding="utf-8", newline="\n") as handle:
            json.dump(value, handle, indent=2)
            handle.write("\n")
        temporary.replace(path)
    finally:
        temporary.unlink(missing_ok=True)


def stats(files):
    changes = [item for item in files if item["before"] != item["after"]]
    groups = Counter("docs-game-mirror" if item["destination"].startswith("docs/assets/games/")
                     else item["source"].split("/")[0] for item in changes)
    return {"reviewed_pairs": len(files), "changed_files": len(changes),
            "new_files": sum(item["before"] is None for item in changes),
            "replaced_files": sum(item["before"] is not None for item in changes),
            "payload_bytes": sum(item["bytes"] for item in changes), "groups": dict(sorted(groups.items()))}


def prepare():
    if not ORIGINAL.is_dir():
        raise SystemExit("The original canonical project is unavailable.")
    files = []
    for source, destination in pairs():
        src, dst = inside(WORK, source), inside(ORIGINAL, destination)
        after = sha(src)
        if after is None:
            raise SystemExit("A reviewed source file is missing.")
        files.append({"source": source, "destination": destination, "before": sha(dst),
                      "after": after, "bytes": src.stat().st_size})
    now = datetime.now(timezone.utc)
    plan = {"schema": 2, "status": "prepared", "id": now.strftime("%Y%m%dT%H%M%S%fZ") + "-" + uuid.uuid4().hex[:12],
            "prepared_at": now.isoformat(), "work": str(WORK.resolve()), "original": str(ORIGINAL.resolve()),
            "files": files, "changes": [item for item in files if item["before"] != item["after"]], "stats": stats(files)}
    validate(plan)
    atomic_json(PLAN, plan)
    print(json.dumps({"status": "prepared", **plan["stats"], "canonical_writes": 0,
                      "release_exports_included": False, "private_deployment_files_included": False}))
    return plan


def validate(plan, expected_status="prepared", check_targets=True):
    if not isinstance(plan, dict) or plan.get("schema") != 2 or plan.get("status") != expected_status or expected_status not in {"prepared", "applied"}:
        raise SystemExit("The integration plan is invalid or has already been applied.")
    if plan.get("work") != str(WORK.resolve()) or plan.get("original") != str(ORIGINAL.resolve()):
        raise SystemExit("Integration roots differ from the reviewed plan.")
    if not re.fullmatch(r"\d{8}T\d{12}Z-[a-f0-9]{12}", str(plan.get("id", ""))):
        raise SystemExit("The integration backup version is invalid.")
    files = plan.get("files")
    if not isinstance(files, list):
        raise SystemExit("The integration file inventory is invalid.")
    expected, actual = pairs(), []
    for item in files:
        if not isinstance(item, dict) or set(item) != {"source", "destination", "before", "after", "bytes"}:
            raise SystemExit("An integration file record is invalid.")
        source, destination = item["source"], item["destination"]
        if forbidden(source) or forbidden(destination):
            raise SystemExit("The plan includes an excluded file.")
        src, dst = inside(WORK, source), inside(ORIGINAL, destination)
        actual.append((source, destination))
        if not re.fullmatch(r"[a-f0-9]{64}", str(item["after"])) or (item["before"] is not None and not re.fullmatch(r"[a-f0-9]{64}", str(item["before"]))):
            raise SystemExit("An integration hash is invalid.")
        if type(item["bytes"]) is not int or item["bytes"] < 0 or sha(src) != item["after"] or src.stat().st_size != item["bytes"]:
            raise SystemExit("A reviewed source changed since the plan was prepared: " + source)
        if check_targets and sha(dst) != item["before"]:
            raise SystemExit("A canonical file changed since the plan was prepared.")
    if actual != expected or len(set(actual)) != len(actual):
        raise SystemExit("The plan differs from the current explicit source allowlist.")
    if plan.get("changes") != [item for item in files if item["before"] != item["after"]]:
        raise SystemExit("The integration changes differ from the reviewed inventory.")
    return files


def apply():
    plan_hash = sha(PLAN)
    plan = json.loads(PLAN.read_text(encoding="utf-8"))
    validate(plan)
    if BACKUPS.resolve() != WORK.resolve() / "backups" or BACKUPS.is_symlink() or (hasattr(BACKUPS, "is_junction") and BACKUPS.is_junction()):
        raise SystemExit("The integration backup directory must stay inside the reviewed workspace.")
    backup = BACKUPS / ("source-before-integration-" + plan["id"])
    if backup.exists():
        raise SystemExit("This integration backup already exists; prepare a new plan.")
    backup.mkdir(parents=True, exist_ok=False)
    # Stage every replacement and old target before touching the canonical tree.
    for item in plan["changes"]:
        src, dst = inside(WORK, item["source"]), inside(ORIGINAL, item["destination"])
        payload = inside(backup, "reviewed-source/" + item["source"])
        if not payload.exists():
            payload.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, payload)
        if sha(payload) != item["after"]:
            raise SystemExit("A staged source differs from the reviewed hash; canonical files are untouched.")
        if item["before"] is not None:
            old = inside(backup, "original/" + item["destination"])
            old.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(dst, old)
            if sha(old) != item["before"]:
                raise SystemExit("A backup differs from the reviewed original; canonical files are untouched.")
    validate(plan)
    if sha(PLAN) != plan_hash:
        raise SystemExit("The integration plan changed during staging; canonical files are untouched.")
    for item in plan["changes"]:
        dst = inside(ORIGINAL, item["destination"])
        payload = inside(backup, "reviewed-source/" + item["source"])
        dst.parent.mkdir(parents=True, exist_ok=True)
        temporary = dst.with_name("." + dst.name + ".integration-" + plan["id"] + ".tmp")
        try:
            with temporary.open("xb") as output, payload.open("rb") as source:
                shutil.copyfileobj(source, output)
            shutil.copystat(payload, temporary)
            if sha(temporary) != item["after"] or sha(dst) != item["before"]:
                raise SystemExit("A canonical file changed during integration; its current content is preserved.")
            temporary.replace(dst)
        finally:
            temporary.unlink(missing_ok=True)
    verify(plan)
    receipt = {"schema": 2, "id": plan["id"], "applied_at": datetime.now(timezone.utc).isoformat(),
               "original": str(ORIGINAL), "backup": str(backup), "stats": plan["stats"],
               "published": False, "changes": plan["changes"]}
    atomic_json(backup / "receipt.json", receipt)
    atomic_json(WORK / "integration-result.json", receipt)
    plan["status"] = "applied"
    atomic_json(PLAN, plan)
    print(json.dumps({"status": "applied", **plan["stats"], "published": False}))


def verify(plan=None):
    plan = plan or json.loads(PLAN.read_text(encoding="utf-8"))
    validate(plan, expected_status=plan.get("status"), check_targets=False)
    for item in plan["files"]:
        if sha(inside(ORIGINAL, item["destination"])) != item["after"]:
            raise SystemExit("An integrated canonical file differs from the reviewed hash.")
    print(json.dumps({"status": "verified", "files": len(plan["files"]), "published": False}))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=("prepare", "apply", "verify"))
    args = parser.parse_args()
    {"prepare": prepare, "apply": apply, "verify": verify}[args.action]()
