"""Check a deployed collector; --write-test-records creates two labeled test rows.

HTTP checks do not establish browser CORS success or verify cell formula types.
The owner must inspect the printed record keys privately and test the published UI.
"""
import argparse
import copy
import json
import re
import urllib.error
import urllib.request
import uuid
from datetime import datetime, timezone
from urllib.parse import urlsplit


ORIGIN = "https://a2-learning-studio.github.io"


def endpoint(value):
    parsed = urlsplit(value)
    if (parsed.scheme != "https" or parsed.hostname != "script.google.com"
            or not re.fullmatch(r"/macros/s/[A-Za-z0-9_-]+/exec", parsed.path)
            or parsed.username or parsed.password or parsed.port not in (None, 443)
            or parsed.query or parsed.fragment or any(c.isspace() for c in value)):
        raise argparse.ArgumentTypeError("Use the deployed HTTPS script.google.com/macros/s/…/exec URL.")
    return value


def request(url, data=None):
    headers = {"Origin": ORIGIN}
    body = None
    if data is not None:
        headers["Content-Type"] = "text/plain;charset=UTF-8"
        body = json.dumps(data, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    call = urllib.request.Request(url, data=body, headers=headers, method="POST" if body is not None else "GET")
    # urllib follows ContentService's redirect to its response URL, without cookies.
    with urllib.request.urlopen(call, timeout=35) as response:
        raw = response.read(100000)
        result = json.loads(raw.decode("utf-8"))
        if not isinstance(result, dict):
            raise AssertionError("Collector response must be a JSON object")
        return result, {
            "http_status": response.status,
            "response_host": urlsplit(response.url).hostname,
            "access_control_allow_origin": response.headers.get("Access-Control-Allow-Origin"),
        }


def post(url, entries):
    return request(url, {"schemaVersion": 1, "entries": entries})[0]


def receipt(entry, revision=None):
    return {"sessionId": entry["sessionId"], "entryId": entry["entryId"],
            "revision": revision if revision is not None else entry["revision"]}


def assert_ack(response, expected):
    assert response.get("ok") is True and response.get("schemaVersion") == 1, response
    assert response.get("acknowledged") == [expected], response
    assert response.get("conflicts") == [], response


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("endpoint", type=endpoint)
    parser.add_argument("--write-test-records", action="store_true",
                        help="Create/update two labeled anonymous smoke-test rows in the private workbook")
    args = parser.parse_args()
    service, transport = request(args.endpoint)
    assert service == {"ok": True, "service": "pecan-grove-feedback", "schemaVersion": 1, "accepts": "POST"}, service
    report = {"checks": ["private GET service label"], "transport": transport,
              "browser_cors": "Unverified: test from the published game in a signed-out browser",
              "private_sheet": "Unverified: HTTP acknowledgements do not inspect private Sheet cells"}
    if args.write_test_records:
        now = datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")
        run_id = uuid.uuid4().hex
        entry = {
            "sessionId": "smoke_session_" + run_id,
            "entryId": "smoke_entry_" + run_id,
            "revision": 1, "createdAt": now, "updatedAt": now,
            "language": "en", "build": "deployment-smoke",
            "stationId": "DEPLOYMENT_TEST", "kind": "feedback", "stop": 0,
            "score": None, "rating": "okay", "category": "other",
            "worked": "[Deployment smoke test] UTF-8: español, árboles, \U0001F3AE",
            "fix": "=1+1", "phase": "deployment-test", "sessionEnded": False,
            "scores": {"1": 100, "15": 75},
        }
        invalid, _ = request(args.endpoint, {"schemaVersion": 1, "entries": []})
        assert invalid == {"ok": False, "error": "invalid_request"}, invalid
        report["checks"].append("malformed request rejected without private details")
        assert_ack(post(args.endpoint, [entry]), receipt(entry))
        report["checks"].append("first anonymous session revision 1 acknowledged")
        assert_ack(post(args.endpoint, [entry]), receipt(entry))
        report["checks"].append("identical retry acknowledged")
        latest = copy.deepcopy(entry)
        latest["revision"] = 2
        latest["worked"] += " — revised"
        assert_ack(post(args.endpoint, [latest]), receipt(latest))
        report["checks"].append("same record revision 2 acknowledged")
        stale = post(args.endpoint, [entry])
        assert stale == {"ok": True, "schemaVersion": 1, "acknowledged": [], "conflicts": [receipt(latest)]}, stale
        report["checks"].append("stale revision conflict reports current revision only")
        other = copy.deepcopy(entry)
        other["sessionId"] = "smoke_other_" + run_id
        other["entryId"] = "smoke_otherentry_" + run_id
        other["language"] = "es"
        other["worked"] = "[Deployment smoke test] Segundo jugador en el mismo equipo."
        other["fix"] = "[Deployment smoke test] Separate anonymous player record."
        assert_ack(post(args.endpoint, [other]), receipt(other))
        report["checks"].append("second anonymous player acknowledged independently")
        report["record_keys"] = [latest["sessionId"] + ":" + latest["entryId"],
                                 other["sessionId"] + ":" + other["entryId"]]
        report["private_sheet"] = ("Inspect Responses privately: exactly two new rows for these keys; "
                                   "the first is revision 2 and Fix or suggestion is literal text =1+1, not a formula")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
