# Private Drive storage for explicitly submitted Pecan Grove feedback

The modernization sending policy and pending server-deployment checks are documented in [docs/feedback-endpoint.md](../../docs/feedback-endpoint.md). Drafts stay local. Sending requires a scrubbed preview, a ticked grown-up check and an ordinary Send activation; there is no timed hold, so keyboard, switch and screen-reader users can send. Score sharing starts off for every new player. Historical verification below proves the earlier collector connection, not deployment of the new hardening changes.

The private response workbook belongs to the owners and stays private. Its address and ID are not in this repository: the collector reads the ID from the Apps Script property `PECAN_GROVE_SPREADSHEET_ID` (setup step 4).

This folder contains the collector (`Code.gs`, `appsscript.json`) and its tests. An owner's machine may also keep the deployed receiver URL in `deployment.json` here; that file is git-ignored and is not part of the repository. The workbook remains private. A saved URL alone does not prove that submissions are backed up: the published website must receive a matching acknowledgement and the private workbook must contain the submitted response.

**Verified active October 12, 2026:** published build `6d3f82ee2a61` received a matching readable acknowledgement for a test note, and the private workbook contained the same row, revision, and build. The verification record (`live-published-browser-verification.json`) and the handoff feedback release report are git-ignored owner files, not part of this repository. The one-time setup below is retained for maintenance or replacement; it is already complete for this receiver.

## One-time owner setup

1. Open the private workbook. Choose **Extensions → Apps Script**. Keep the workbook restricted to its owner and intended reviewers.
2. Replace `Code.gs` with the supplied `Code.gs`. It contains no workbook ID; it reads the ID from a script property (step 4).
3. In **Project Settings**, enable **Show appsscript.json manifest file**. Replace that file with the supplied `appsscript.json`.
4. In **Project Settings → Script Properties**, add the property `PECAN_GROVE_SPREADSHEET_ID` with the workbook's ID (the part of the workbook address between `/d/` and `/edit`). Without it, setup and every storage request fail closed.
5. Run `setupFeedback_` once. Approve the script's access to Google Sheets when Google asks. This collector has one OAuth scope, `spreadsheets`; it has no Drive-file, email, or account-profile scope.
6. Choose **Deploy → New deployment → Web app**. Set **Execute as: Me** and **Who has access: Anyone**. This gives anonymous players access to this write-only collector, while the workbook itself stays private. Google Workspace administrators can restrict this deployment option.
7. Copy the deployed URL ending in `/exec`. For the published site, set it as the GitHub Actions repository variable `PG_FEEDBACK_ENDPOINT` (**Settings → Secrets and variables → Actions → Variables**); the CI quality job refuses to build the play-test without it. For a local build, see the next section. Never put a Google OAuth token, account credential, or the private workbook ID into the website.
8. Complete the smoke test below before calling explicit sending available. Use a versioned deployment, not the editor-only `/dev` testing URL. Future code changes require updating the deployed version.

## Rebuilding after setup

The published site is built by CI with `npm run build` (`tools/build.mjs`), which calls `tools/make_playtest.py` and bundles the result into `dist/`. Locally, run the same command from the project root with Node 24 and the Python packages in `tools/requirements-build.txt`. The receiver URL comes from, in order:

1. the environment variable `PG_FEEDBACK_ENDPOINT`, which `tools/build.mjs` passes to the builder as `--feedback-endpoint` (CI sets it from the repository variable);
2. otherwise `backend/feedback/deployment.json`, if an owner keeps one (`{"schemaVersion": 1, "feedbackEndpoint": "https://script.google.com/macros/s/DEPLOYMENT_ID/exec"}`; git-ignored);
3. otherwise none: the build has no receiver and cannot send. This is the safe default for local and test builds.

`npm run build -- --flavor=family` builds `dist-family/`, which never has a receiver. Running `python tools/make_playtest.py` alone writes only the unbundled export in `_publish/pecan-grove-playtest/`, not the deployed `dist/`. When calling it directly, `--feedback-endpoint "https://script.google.com/macros/s/DEPLOYMENT_ID/exec"` replaces the receiver for one build and `--feedback-endpoint=` (an explicit empty value, which also works in Windows PowerShell) disables it; an explicit argument takes precedence over the saved file. Invalid saved configuration stops the build before it changes generated output. The public pages need the receiver URL to send feedback, but never receive the private workbook ID or any credentials.

After saving a new deployment URL, complete the deployment smoke test below before describing backup as active. `tools/smoke_feedback_endpoint.py` checks a deployed collector over HTTP for the owner; with `--write-test-records` it writes two labelled test rows to the live workbook, so only the owner runs it, never CI or a test.

## What is saved

`Responses` stores one current row per `sessionId + entryId`. Feedback edits increase the revision and update that row. Retry requests and older revisions do not create duplicates or overwrite newer content. An identical retry is acknowledged; conflicting content at an equal or older revision is returned as a conflict for the client to resolve and retry. A new player receives a new anonymous session and a new random station ID, so feedback and progress from people sharing a computer remain separate and no field links them. The station ID is chosen by the browser, not authenticated; the collector uses it only to group one request and to count requests per hour.

The columns are:

| Column | Meaning |
| --- | --- |
| A | Record key, anonymous session plus entry ID |
| B–D | Session ID, entry ID, revision |
| E–G | Created/updated client UTC times, received server UTC time |
| H–K | Language, game build, random station ID (new for every player), entry kind |
| L–O | Stop, optional score, rating, issue category |
| P–R | What worked, suggested fix, screen phase |
| S–T | Session ended flag; completed-stop scores as JSON (reserved) |
| U | Canonical payload SHA-256, used to detect conflicting revisions |

Only the known fields are stored. No names, email addresses, account IDs, IP addresses, or browser fingerprints are requested or added by this code. Google handles the hosting and spreadsheet service and can retain service logs according to its own policies. Free-text guidance in the game asks players not to include personal details.

Google Sheets saves this workbook in the owner's Drive. The owner can use **File → Download → Microsoft Excel (.xlsx)** to obtain the collected responses in Excel. The game also offers a local Excel download. The collector does not create a second `.xlsx` file on every keystroke.

## Browser transport contract

Send a simple cross-origin POST with `Content-Type: text/plain;charset=UTF-8`, `credentials: omit`, and `redirect: follow`. The body is JSON:

```json
{
  "schemaVersion": 1,
  "entries": [{
    "sessionId": "session_0123456789abcdef",
    "entryId": "entry_0123456789abcdef",
    "revision": 1,
    "createdAt": "2026-10-12T12:00:00.000Z",
    "updatedAt": "2026-10-12T12:00:01.000Z",
    "language": "en",
    "build": "preview",
    "stationId": "station-3",
    "kind": "feedback",
    "stop": 4,
    "score": 75,
    "rating": "okay",
    "category": "clarity",
    "worked": "The pictures helped.",
    "fix": "Explain this word.",
    "phase": "playing",
    "sessionEnded": false,
    "submitted": true
  }]
}
```

This example lists exactly the fields that the v1 game sends (`tools/tests/feedback.test.mjs` checks it). The collector ignores `submitted`. Column T stays `{}` because the game sends each score as its own `progress` record (column M) and never sends `scores`; the collector still accepts that optional field. Column S becomes `TRUE` only on a player's `session` record after that player ended, which reaches the workbook when a grown-up sends that player's notes from **Privacy and notes on this device**.

The required fields are session/entry IDs, revision, updated time, language, and build. IDs must contain 16–80 letters, digits, underscores, or hyphens. Revisions are positive integers. The collector accepts up to 20 entries and 65,536 UTF-8 bytes per request. Each text answer is limited to 1,200 characters. Send smaller batches when answers approach the limit.

Ratings are `unclear`, `okay`, `good`, or empty. Categories are `clarity`, `bug`, `voice`, `spanish`, `art`, `other`, or empty. Kinds are `feedback`, `progress`, or `session`. Stops range from 0 (general) to 15, and scores range from 0 to 100.

After committing the cells, the collector returns:

```json
{"ok":true,"schemaVersion":1,"acknowledged":[{"sessionId":"session_0123456789abcdef","entryId":"entry_0123456789abcdef","revision":1}],"conflicts":[]}
```

A client may remove an item from its retry queue only after it receives and validates an acknowledgement for the matching session and entry revision. An equal or older revision with different content appears in `conflicts` with the existing server revision; it is not acknowledged. Merge the latest local state, increase the pending revision above that server revision, and retry. Conflict replies never contain another comment's text. `fetch()` completing, an opaque `no-cors` response, a page unload, and a successful request without a matching acknowledgement do not prove backup. On timeout, offline use, unreadable CORS response, or an error reply, retain the local queue and show that backup is pending.

Apps Script ContentService redirects its response to `script.googleusercontent.com`. The website's CSP must allow its configured script endpoint and the HTTPS response host. Google's official ContentService documentation describes redirects but does not promise a universal browser CORS policy. The deployed endpoint must therefore pass an actual cross-origin browser test. Do not use `no-cors` as a workaround that falsely marks data backed up.

## Required deployment smoke test

1. From the published game, type a labelled test comment. Confirm no request is sent. Choose Send, review the scrubbed text, and ask a grown-up to tick the grown-up check and choose Send now. Confirm that the thanks line appears only after the matching acknowledgement.
2. Read `Responses` privately. Confirm exactly one row with the matching session, entry, revision, and comment.
3. Edit the comment. Confirm it stays local until another preview and Send. Confirm the same row then receives a higher revision and the scrubbed updated text. Reload the page and confirm no duplicate response row appears.
4. Start a new player on the same computer. Confirm the new session starts with blank feedback and fresh game progress, and the first player's responses remain in their own rows.
5. Disconnect the network, type another comment and choose Send through the preview. Confirm no more than three total attempts occur. Choose Next player: confirm it asks what happens to the note the team has not received and that the next player does not start until it is sent, deleted or (in a build with a close-out code) kept for the facilitator. Keep it, start the next player and reconnect. Confirm the previous player's local text is neither displayed nor sent by the next player's Send, and that Facilitator close-out (For grown-ups, with the code) lists it to send. Score consent must reset to off.
6. Send a formula-like test answer such as `=1+1`. Confirm it remains text rather than a spreadsheet formula.
7. Open the endpoint with GET. Confirm it returns only the service label/schema and never response rows or private workbook metadata.
8. Try the published game in a signed-out browser. Confirm no player Google login is required and that a readable acknowledgement is received.

## Limits and operation

The collector uses a script lock while checking revisions and writing rows. It flushes spreadsheet writes before acknowledging. It refuses malformed records, oversized requests, unexpected headers, more than 50,000 response rows, more than 30 requests per UTC hour per station, more than 300 per UTC hour overall, and more than 10,000 valid requests per UTC day. Contact details are scrubbed again before writing. These are basic controls for a small anonymous playtest, not strong protection against determined spam. A public anonymous endpoint cannot authenticate a real classroom participant. No public read endpoint is provided.

If a limit is reached, the client keeps responses pending locally. The owner can export/archive the workbook and increase a reviewed limit or create a new collector before another playtest. Do not move or rename response columns while collection is running. Read-only copies and Excel downloads are safe.

## Automated verification

Run `node --test backend/feedback/feedback-backend.test.cjs` from the project root. The tests execute the actual collector against a simulated Apps Script sheet, lock, properties store, and content service. They cover validation, byte/batch caps, independent players, revision upserts, retry deduplication, literal spreadsheet text, write acknowledgements, generic errors, capacity, daily limits, header drift, private GET behavior, and row-grid expansion. These tests do not deploy the script or verify Google's live CORS behavior.

## Primary documentation

- [Apps Script web-app deployment and execution identity](https://developers.google.com/apps-script/guides/web)
- [ContentService JSON and response redirects](https://developers.google.com/apps-script/guides/content)
- [LockService for concurrent executions](https://developers.google.com/apps-script/reference/lock/lock-service)
- [Range.setValues and formula interpretation](https://developers.google.com/apps-script/reference/spreadsheet/range)
- [Apps Script API authorization and project access](https://developers.google.com/apps-script/api/how-tos/enable)
- [Web-app manifest access and execution settings](https://developers.google.com/apps-script/manifest/web-app-api-executable)

## Private workbook configuration

Before running setup or deploying an update, set the Apps Script project property `PECAN_GROVE_SPREADSHEET_ID` to the existing private workbook ID (setup step 4). Keep that value in Script Properties, outside the public source repository. This setting does not change workbook sharing. The collector fails closed if the property is missing.

