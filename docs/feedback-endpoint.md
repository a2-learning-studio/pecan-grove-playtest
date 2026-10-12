# P0-01 through P0-06: private feedback endpoint and sending policy

The public game keeps drafts and progress on the device. Opening, typing, moving the review window, changing stops, loading, reconnecting and changing browser visibility do not send data. Legacy queued drafts are migrated as local drafts, not treated as permission to send.

## Explicit sending

A player chooses **Send to the playtest team**, sees a preview with contact details removed, and asks a grown-up to hold the Send button for two seconds. Pointer input and holding Enter or Space work. Releasing early, leaving the button, changing the text, changing stops or hiding the page cancels the hold. The submitted draft is scrubbed before it enters the transport queue. Later edits become a new local draft and require another Send.

A separate **Save draft on this device** button never contacts the endpoint. Excel includes local drafts and submitted records for the current anonymous player only. Previous players' drafts stay stored under their own sessions and are never included in another player's submission.

The retry limit is three total requests per explicit Send: the initial request, a retry after five seconds, and a final retry after thirty seconds. The specification also lists 120 seconds, but its acceptance criterion caps the operation at three tries; the cap takes precedence. Reloading does not resume retries. Closing the page cancels scheduled retries. A matching acknowledgement for the exact submitted revision and payload is required before showing **Sent**.

## Score consent and shared computers

`pecan-grove-consent-v1` stores `scores`, `autoScores`, `at`, `build` and the current anonymous `sessionId`. Both options start off. Consent from a different anonymous player or an older preference without the session binding is ignored. **New player** resets both options.

With score sharing off, no progress records are created by the feedback layer. With it on, results can be held locally and included with an explicit Send. The separate **Also send scores when a stop is finished** checkbox must also be on before a result is sent as it happens. Turning score sharing off withdraws unsent score records. Already received records cannot be recalled by a browser preference.

The integration API is `window.PecanGroveFeedback.getConsent()` and `setConsent({scores, autoScores})`. Checkboxes use `data-pg-consent="scores"` or `data-pg-consent="autoScores"`; their changes are handled centrally. `pt:consent-change` can request a change with the same fields. Notifications emitted by the runtime add `source: "feedback"` to prevent loops.

## Language and initialization

Feedback UI strings come from `assets/playtest/locales/feedback-en.json` and `feedback-es.json`. The browser loads these first-party static assets, using the production asset map where present, before mounting the feedback singleton. `window.PecanGroveFeedback.ready` resolves with its runtime, and the document emits `pg:feedback-ready`. The ordered boot module must wait for readiness before loading the game so that the anonymous session is established before game-save storage is selected. If static locale loading fails, readiness returns null and `pg:feedback-unavailable` is emitted; this must not be treated as successful feedback initialization.

The document event `pg:language-change` accepts `{language, previousLanguage}` with `en` or `es`. It updates the existing form's labels, options, context, saved-note statuses, preview and grown-up hold copy. Controls, selected answers, typed text, current stop, model and anonymous session remain intact. Switching language cancels an active hold and rebuilds any open preview; another complete hold is required to send. A language switch itself never contacts the receiver.

## Server validation and storage

`backend/feedback/Code.gs` retains the configured private workbook and receiver. It provides no public response-reading endpoint and requests no names, account profiles or browser fingerprints.

- Only schema version 1 and batches of 1–20 known records are accepted.
- Bodies over 65,536 UTF-8 bytes are rejected before parsing.
- IDs, revision, timestamps, language, build, kinds, enums, numeric ranges and field types are checked. Each free-text answer is limited to 1,200 characters, matching the client.
- One request must belong to one station. Under a script lock, limits are 30 requests per UTC hour per station and 300 per UTC hour overall. Existing daily and row-capacity limits remain.
- Rate state uses truncated SHA-256 station keys and replaces its current-hour bucket. At most 300 station counters fit within the provider's per-property limit; multi-station batches cannot inflate the bucket.
- Email addresses, phone-like sequences with seven or more digits, URLs, handles and common EN/ES street-address patterns are removed again on the server.
- Text cells remain literal; spreadsheet formulas are not executed. Revisions deduplicate retries and prevent stale data from overwriting newer content.
- Acknowledgements follow committed and flushed cells. Validation failures return generic error codes without comments or private account/workbook details.

Contact scrubbing is a heuristic. It cannot reliably recognize people's names or every address format. The preview asks the grown-up to check the text and remove names. No code should describe these patterns as a guarantee that free text contains no personal information.

The [Apps Script quotas documentation](https://developers.google.com/apps-script/guides/services/quotas) lists the per-property size limit. Anonymous station IDs are not authenticated identities, so rate limits reduce simple abuse but cannot stop a determined client that invents IDs; the global limit bounds that case.

## Deployment status and required checks

The checked-in collector has the hardening changes. Updating a local `.gs` file does not update an existing versioned Apps Script deployment. The owner must review and update the deployed version, preserving the existing receiver URL. Do not describe the live server as hardened until this update and the cross-origin smoke test are recorded.

Use a clearly labelled test draft. Confirm zero receiver requests before Send, inspect the scrubbed preview, hold Send, and match the acknowledged revision with one private workbook row. Test an edited draft, a failed send capped at three requests, a signed-out player, and two different players sharing one computer. Do not publish workbook contents or deployment credentials.

Automated checks: `node --test tools/tests/modernization-privacy.test.mjs tools/tests/feedback.test.mjs backend/feedback/feedback-backend.test.cjs`.
# Private configuration

The receiver reads its workbook ID from the Apps Script property `PECAN_GROVE_SPREADSHEET_ID`. The repository contains no private workbook ID. Set the property on the existing script before deploying this version; otherwise it rejects storage requests. This change is prepared for review and is not yet deployed.

