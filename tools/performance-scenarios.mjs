/* Runs only on the CI runner; local browser inspection uses the connected Chrome tab. */
import fs from "node:fs/promises";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";
import { launch } from "chrome-launcher";
import { startFlow } from "lighthouse";
import { stageReady, inspectStep } from "./performance-checks.mjs";

if (process.env.GITHUB_ACTIONS !== "true")
  throw new Error("Run the performance browser scenarios in GitHub Actions.");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist"),
  output = path.join(root, "test-results/lighthouse/flows");
await fs.mkdir(output, { recursive: true });
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".json": "application/json",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".avif": "image/avif",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".mp3": "audio/mpeg",
  ".webmanifest": "application/manifest+json",
};
const server = http.createServer(async (request, response) => {
  try {
    const name = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
    const file = path.resolve(
      dist,
      "." + (name === "/" ? "/index.html" : name),
    );
    if (!file.startsWith(dist + path.sep)) {
      response.writeHead(403).end();
      return;
    }
    const body = await fs.readFile(file);
    response.writeHead(200, {
      "Content-Type": types[path.extname(file)] || "application/octet-stream",
    });
    response.end(body);
  } catch (_) {
    if (response.headersSent) response.destroy();
    else response.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = "http://127.0.0.1:" + server.address().port;
const chrome = await launch({
  chromeFlags: ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage"],
});
const browser = await puppeteer.connect({
  browserURL: "http://127.0.0.1:" + chrome.port,
});
const records = [];
async function settledStage(page, selector, state) {
  await page.waitForSelector(selector, { visible: true });
  await page.waitForFunction(stageReady, {}, state);
  await page.evaluate(() => document.fonts.ready);
}
try {
  for (const language of ["en", "es"])
    for (let run = 1; run <= 3; run++) {
      const context = await browser.createBrowserContext(),
        page = await context.newPage();
      try {
        await page.setViewport({
          width: 393,
          height: 851,
          deviceScaleFactor: 1,
          isMobile: true,
          hasTouch: true,
        });
        const problems = [];
        page.on("pageerror", (error) => problems.push(error.message));
        await page.goto(
          base +
            "/" +
            (language === "es" ? "espanol.html" : "index.html") +
            "?seed=42",
          { waitUntil: "networkidle0" },
        );
        await page.waitForSelector('[data-engine-mounted="true"]');
        await page.click("#pt-quiet");
        await page.click("#pt-start");
        await settledStage(page, ".cb-engine-title-actions", { mode: "title" });
        const flow = await startFlow(page, {
          name: language + " game screens run " + run,
          flags: {
            disableStorageReset: true,
            formFactor: "mobile",
            screenEmulation: {
              mobile: true,
              width: 393,
              height: 851,
              deviceScaleFactor: 1,
              disabled: false,
            },
          },
        });
        await flow.snapshot({ name: "Title accessibility and best practices" });
        await flow.startTimespan({ name: "Title to map interaction" });
        const words = JSON.parse(
          await fs.readFile(
            path.join(
              root,
              "assets/games/community-builders/engine/locales",
              language + ".json",
            ),
            "utf8",
          ),
        );
        await page.$$eval(
          ".cb-engine-title-actions button",
          (buttons, label) => {
            const control = buttons.find(
              (button) => button.textContent.trim() === label,
            );
            if (!control) throw new Error("New game control missing");
            control.click();
          },
          words.newGame,
        );
        await page.waitForSelector(".cb-engine-slot-pick", { visible: true });
        await page.click(".cb-engine-slot-pick");
        await settledStage(page, '.cb-stop[data-stop-n="1"]', { mode: "map" });
        await flow.endTimespan();
        await flow.snapshot({ name: "Map accessibility and best practices" });
        for (const stop of [1, 2]) {
          await flow.startTimespan({
            name: "Open Stop " + stop + " interaction",
          });
          const stopId = await page.$eval(
            '.cb-stop[data-stop-n="' + stop + '"]',
            (node) => node.dataset.stopId,
          );
          await page.click('.cb-stop[data-stop-n="' + stop + '"]');
          await settledStage(
            page,
            stop === 1 ? ".cb-s01-intro" : ".cb-s02-intro",
            { mode: "stop", stopId },
          );
          await flow.endTimespan();
          await flow.snapshot({
            name:
              "Stop " + stop + " introduction accessibility and best practices",
          });
          await page.click(".cb-stophud__back");
          await settledStage(page, '.cb-stop[data-stop-n="' + stop + '"]', {
            mode: "map",
          });
        }
        const result = await flow.createFlowResult();
        if (result.steps.length !== 7)
          throw new Error(
            "Expected seven measured title/map/stop steps, received " +
              result.steps.length,
          );
        await fs.writeFile(
          path.join(output, language + "-" + run + ".json"),
          JSON.stringify(result),
        );
        await fs.writeFile(
          path.join(output, language + "-" + run + ".html"),
          await flow.generateReport(),
        );
        const flowRecords = result.steps.map((step) =>
          inspectStep(step, { language, run }),
        );
        records.push(...flowRecords);
        // The trace already exists in Lighthouse's gathered artifacts. Persist
        // failed flows after measurement, without running extra browser work.
        if (flowRecords.some((record) => record.failures.length))
          await fs.writeFile(
            path.join(output, language + "-" + run + "-artifacts.json"),
            JSON.stringify(flow.createArtifactsJson()),
          );
        if (problems.length)
          records.push({ language, run, failures: problems });
      } catch (error) {
        const failure = {
          language,
          run,
          screen: "scenario setup or measurement",
          failures: [error.message],
        };
        records.push(failure);
        await fs.writeFile(
          path.join(output, language + "-" + run + "-error.json"),
          JSON.stringify({ ...failure, stack: error.stack }, null, 2),
        );
      } finally {
        await context.close();
      }
    }
} finally {
  await browser.disconnect();
  await chrome.kill();
  await new Promise((resolve) => server.close(resolve));
}
await fs.writeFile(
  path.join(output, "summary.json"),
  JSON.stringify(records, null, 2),
);
const failed = records.filter((record) => record.failures.length);
console.log(
  "Measured " +
    records.length +
    " game-screen reports; " +
    failed.length +
    " failed. Navigation LCP/FCP/performance are measured separately by LHCI.",
);
if (failed.length) {
  console.error(JSON.stringify(failed, null, 2));
  process.exitCode = 1;
}
