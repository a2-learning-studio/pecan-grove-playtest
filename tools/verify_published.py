"""Read-only release verification of every exported file on the public playtest site.

Reads responses into memory to compare hashes; it does not save downloaded media.
"""
import argparse
import concurrent.futures
import hashlib
import json
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen

BASE = "https://a2-learning-studio.github.io/pecan-grove-playtest/"
TEXT = {".html", ".css", ".js", ".json", ".txt", ".md", ".svg"}


def normalized(data, file):
    return data.replace(b"\r\n", b"\n") if file.suffix.lower() in TEXT else data


def check(file, export, home=False):
    relative = "/" if home else file.relative_to(export).as_posix()
    url = BASE if home else BASE + quote(relative, safe="/")
    try:
        request = Request(url, headers={"Cache-Control": "no-cache", "User-Agent": "PecanGroveReleaseVerifier/1.0"})
        with urlopen(request, timeout=25) as response:
            data, status = response.read(), response.status
        expected = normalized(file.read_bytes(), file)
        received = normalized(data, file)
        matches = status == 200 and hashlib.sha256(received).digest() == hashlib.sha256(expected).digest()
        return {"file": relative, "status": status, "matches": matches, "bytes": len(data),
                "sha256": hashlib.sha256(received).hexdigest()}
    except Exception as error:
        return {"file": relative, "matches": False, "error": str(error)}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--export", type=Path, default=Path(__file__).resolve().parents[1] / "_publish/pecan-grove-playtest")
    parser.add_argument("--output", type=Path, default=Path("published-verification.json"))
    args = parser.parse_args()
    export = args.export.resolve()
    files = sorted(p for p in export.rglob("*") if p.is_file() and ".git" not in p.relative_to(export).parts
                   and p.name.lower() not in {"desktop.ini", "thumbs.db", ".ds_store", ".nojekyll"})
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        results = list(pool.map(lambda file: check(file, export), files))
    results.append(check(export / "index.html", export, home=True))
    failures = [result for result in results if not result["matches"]]
    build = json.loads((export / "build.json").read_text(encoding="utf-8"))
    receipt = {"url": BASE, "build": build, "files_checked": len(results), "failed": len(failures), "results": results}
    args.output.write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
    print(f"Public release: {len(results) - len(failures)}/{len(results)} files match reviewed build {build['id']}.")
    for failure in failures:
        print(f"FAIL {failure['file']}: {failure.get('error', 'published bytes differ')}")
    if failures:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
