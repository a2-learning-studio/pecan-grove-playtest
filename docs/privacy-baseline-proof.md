# Privacy baseline regression proof

Generated 2026-10-12T23:57:24.059Z.

The actual feedback mount from public commit `a2feba56cd91af16461032b95b8a3fbbb1e3fda0` attempted 1 POST request immediately on mount and 1 after an unsent edit. The current mount attempted 0 on mount and 0 after the same edit. No real network requests were made.

This is a JSDOM integration test of the actual frontend code, with fresh storage, fake timers and a stubbed receiver. Both cases use the same HTML from the committed baseline. The shared Playwright network classifier rejects the old mount request even before DOMContentLoaded. This demonstrates that the guard detects the original automatic-backup regression; it is not a browser execution result or a live Drive test.

Committed baseline feedback SHA-256: `38616fb82d9bf2a6f8e32d0d96b6026c5561a6abe367cec0cd9a859a394d0577`.

Committed baseline HTML SHA-256: `7d763b90702688b66c8491518efcfe45a7024063d075d7398303fbbf1fd05bf3`.

Current feedback SHA-256 at this run: `b6359ce26a66cd1f4a470f24ecf0f9791cadbf8cdef40f3d702279dff98ad36a`.

Full method and captured request metadata are in [the JSON receipt](privacy-baseline-proof.json). Request bodies, player IDs and receiver URLs are deliberately omitted from the receipt.

Run `node tools/privacy-baseline-proof.mjs --write-report` with the baseline Git checkout at the sibling path, or set `PG_BASELINE_ROOT`. The source is read with `git show` at the recorded commit, so local checkout edits cannot change this proof.
