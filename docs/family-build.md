# Family copy: notes for IT and library staff

The family copy is the same bilingual game without the play-test feedback connection. It is built from this repository with `npm run build -- --flavor=family` and lands in `dist-family/`.

## What it contains

- The game in English (`index.html`) and Spanish (`espanol.html`), and the printable educator sheets (`educator.html`, `educador.html`).
- No feedback form, no feedback receiver and no score sharing. `tools/build.mjs` stops the build if any family page contains the play-test receiver or feedback controls, and each game page's Content-Security-Policy allows network connections only to its own site (`connect-src 'self'`).
- `build.json` names the build: its content id, the Git commit, the build date and `"flavor": "family"`.
- Static files only: about 330 files and 16 MB, most of it recorded voice. There is no server code, database, account, cookie, analytics or third-party request; fonts and images are bundled.

## Getting a copy

- From CI: every run of the **Modernization checks and Pages** workflow uploads `dist` and `dist-family` together as the artifact `checked-builds`. GitHub keeps it for 7 days. Download it from the run's summary page and use the `dist-family` folder.
- Building it yourself: install Node 24 and Python 3.12, run `npm ci` and `python -m pip install -r tools/requirements-build.txt`, then `npm run build -- --flavor=family`. A local build never has a feedback receiver.
- There is no versioned release download yet. Publishing one (and where) is a decision for the project owners.

## Hosting

- Serve the folder as is from any static web server, at the site root or in a sub-folder; all paths are relative. The game uses JavaScript modules, so open it through a web server rather than from the file system.
- Use HTTPS (or `http://localhost`). Browsers only allow the offline service worker (`sw.js`) on secure origins; without it the game still runs online but cannot be installed for offline play.
- The pages ask search engines not to index them (`robots` meta tag and `robots.txt`).
- To update, replace the whole folder with a newer build. Open copies notice the new build and offer to restart.

## On each device

Progress, settings and the chosen player stay in that browser's storage on that device. Files saved for offline play, including optional voice packs, sit in the browser's cache. Nothing is sent anywhere. Clearing the browser's site data removes progress. On a shared computer, **Library / Class mode → Players, teams and scores** lets each player pick an animal profile with separate scores.

## Quick check before rollout

1. Open `index.html` and `espanol.html` from your server; both should start without errors.
2. In the browser's developer tools, the Network panel should show requests to your own server only.
3. `build.json` should say `"flavor": "family"`.
