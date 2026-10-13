/* CI-only browser isolation. This does not relax the game's console/CSP checks. */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { webkit, devices } from '@playwright/test';

if (process.env.GITHUB_ACTIONS !== 'true') {
  throw new Error('Run the WebKit CSP isolation probe in GitHub Actions.');
}

const directory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'https://pecan-grove-csp-probe.invalid';
const uaStyle = 'text-overflow:inherit';
const hash = crypto.createHash('sha256').update(uaStyle).digest('base64');
const strict = "default-src 'none'; script-src 'none'; style-src 'self' 'report-sample'; object-src 'none'; base-uri 'none'";
const narrow = strict + `; style-src-attr 'unsafe-hashes' 'sha256-${hash}' 'report-sample'`;
const selects = [1, 2, 3].map(number => `<label>Choice ${number}<select id="choice-${number}"><option>One</option><option>Two</option></select></label>`).join('\n');
const cases = [
  { name: 'strict-no-select', csp: strict, html: '<p id="probe">No native select control.</p>' },
  { name: 'strict-three-selects', csp: strict, html: selects },
  { name: 'exact-UA-style-hash-three-selects', csp: narrow, html: selects },
  { name: 'exact-UA-hash-rejects-unrelated-attribute', csp: narrow, html: '<p id="probe" style="color: rgb(1, 2, 3)">Unrelated authored attribute.</p>' },
  { name: 'exact-UA-hash-rejects-style-element', csp: narrow, html: '<style>#probe { color: rgb(1, 2, 3) }</style><p id="probe">Unrelated authored style element.</p>' }
];
const report = {
  createdAt: new Date().toISOString(),
  node: process.version,
  browser: 'webkit',
  uaStyle, hash,
  source: 'https://raw.githubusercontent.com/WebKit/WebKit/main/Source/WebCore/html/HTMLSelectElement.cpp',
  purpose: 'Isolate native-select UA inline-style behavior from all game code; record exact-hash and arbitrary-style controls.',
  results: [], screenshotControls: [], unexpectedRequests: [], harnessErrors: [], controlFailures: []
};
function validateControl(name, observed, consoleMessages) {
  const failures = [];
  const warnings = consoleMessages.filter(message => ['warning', 'error'].includes(message.type));
  const styleViolations = observed.violations.filter(event => event.directive.startsWith('style-src'));
  const check = (condition, message) => { if (!condition) failures.push(message); };
  if (name === 'strict-no-select') {
    check(observed.violations.length === 0, 'A strict page with no selects must have no policy violations.');
    check(warnings.length === 0, 'A strict page with no selects must have no console warnings/errors.');
  } else if (name === 'strict-three-selects') {
    check(observed.selectCount === 3, 'The reproduction must render all three native selects.');
    check(styleViolations.length === 3 && observed.violations.length === 3,
      'Expected exactly three native-select style violations; a browser fix or different declaration requires review.');
    check(warnings.length === 3, 'Expected exactly three native-select console warnings/errors.');
  } else if (name === 'exact-UA-style-hash-three-selects') {
    check(observed.selectCount === 3, 'The candidate must render all three native selects.');
    check(observed.violations.length === 0, 'The exact UA declaration hash must eliminate native-select policy violations.');
    check(warnings.length === 0, 'The exact UA declaration hash must eliminate native-select console warnings/errors.');
  } else {
    check(styleViolations.length >= 1, 'The unrelated authored style must still be blocked by policy.');
    check(warnings.length >= 1, 'The unrelated authored style rejection must be reported.');
    check(observed.probeColor !== 'rgb(1, 2, 3)', 'The unrelated authored color must not be applied.');
  }
  return failures;
}
const iphone = { ...devices['iPhone 14'] };
delete iphone.defaultBrowserType;
const viewports = [
  { name: 'desktop', options: { viewport: { width: 1280, height: 800 } } },
  { name: 'iphone', options: iphone }
];
let browser;
try {
  browser = await webkit.launch({ headless: true });
  report.browserVersion = browser.version();
  for (const viewport of viewports) {
    const context = await browser.newContext({ ...viewport.options, colorScheme: 'light' });
    try {
      await context.addInitScript(() => {
        window.__cspProbeEvents = [];
        document.addEventListener('securitypolicyviolation', event => {
          window.__cspProbeEvents.push({
            time: performance.now(), directive: event.effectiveDirective,
            violatedDirective: event.violatedDirective,
            blockedURI: event.blockedURI, sourceFile: event.sourceFile,
            lineNumber: event.lineNumber, columnNumber: event.columnNumber,
            sample: event.sample, disposition: event.disposition
          });
        });
      });
      await context.route('**/*', async route => {
        const url = new URL(route.request().url());
        if (url.origin === origin && url.pathname === '/screenshot-sheet.css') {
          await route.fulfill({status: 200, contentType: 'text/css', body: 'p { color: black; }'});
          return;
        }
        if (url.origin === origin && url.pathname === '/screenshot-sync') {
          await route.fulfill({status: 200, contentType: 'text/html', body:
            `<!doctype html><html lang="en"><head><meta http-equiv="Content-Security-Policy" content="${strict}"><link rel="stylesheet" href="/screenshot-sheet.css"><title>Strict screenshot synchronization</title></head><body><p>First-party styled screenshot control.</p></body></html>`});
          return;
        }
        const specimen = cases.find(item => url.pathname === '/' + item.name);
        if (url.origin !== origin || !specimen) {
          report.unexpectedRequests.push({ viewport: viewport.name, url: url.href });
          await route.abort();
          return;
        }
        // No author scripts, stylesheet links or external resources are supplied.
        await route.fulfill({ status: 200, contentType: 'text/html', body:
          `<!doctype html><html lang="en"><head><meta http-equiv="Content-Security-Policy" content="${specimen.csp}"><title>CSP native control isolation</title></head><body>${specimen.html}</body></html>` });
      });
      for (const specimen of cases) {
        const page = await context.newPage(), consoleMessages = [], pageErrors = [];
        page.on('console', message => consoleMessages.push({
          type: message.type(), text: message.text(), location: message.location(), time: Date.now()
        }));
        page.on('pageerror', error => pageErrors.push(error.message));
        try {
          await page.goto(origin + '/' + specimen.name, { waitUntil: 'load', timeout: 15000 });
          // securitypolicyviolation is queued asynchronously by the browser.
          await page.waitForTimeout(100);
          const observed = await page.evaluate(() => {
            const probe = document.querySelector('#probe');
            return {
              violations: window.__cspProbeEvents,
              selectCount: document.querySelectorAll('select').length,
              authoredStyleAttributes: [...document.querySelectorAll('[style]')].map(node => ({ tag: node.tagName, style: node.getAttribute('style') })),
              probeColor: probe ? getComputedStyle(probe).color : null,
              selectTextOverflow: [...document.querySelectorAll('select')].map(node => getComputedStyle(node).textOverflow)
            };
          });
          const controlFailures = validateControl(specimen.name, observed, consoleMessages);
          report.results.push({ viewport: viewport.name, case: specimen.name, csp: specimen.csp, consoleMessages, pageErrors, controlPassed: controlFailures.length === 0, controlFailures, ...observed });
          for (const message of controlFailures) report.controlFailures.push({ viewport: viewport.name, case: specimen.name, message });
          if (pageErrors.length) report.harnessErrors.push({ viewport: viewport.name, case: specimen.name, pageErrors });
        } catch (error) {
          report.harnessErrors.push({ viewport: viewport.name, case: specimen.name, error: error.message });
        } finally {
          await page.close();
        }
      }
      // Separate from the ten native-control cases: prove the dependency patch
      // captures real pixels under strict CSP and restores the existing sheet.
      const page = await context.newPage(), consoleMessages = [];
      page.on('console', message => consoleMessages.push({type: message.type(), text: message.text(), location: message.location()}));
      try {
        await page.goto(origin + '/screenshot-sync', {waitUntil: 'load', timeout: 15000});
        const before = await page.evaluate(() => Array.from(document.styleSheets[0].cssRules, rule => rule.cssText));
        const pixels = await page.screenshot({animations: 'allow', caret: 'initial'});
        await page.waitForTimeout(100);
        const after = await page.evaluate(() => ({rules: Array.from(document.styleSheets[0].cssRules, rule => rule.cssText),
          violations: window.__cspProbeEvents, color: getComputedStyle(document.querySelector('p')).color}));
        const controlFailures = [];
        if (JSON.stringify(before) !== JSON.stringify(after.rules)) controlFailures.push('Screenshot synchronization must restore the authored CSS rules.');
        if (after.violations.length) controlFailures.push('Screenshot capture must not create a CSP violation.');
        if (consoleMessages.some(message => ['warning', 'error'].includes(message.type))) controlFailures.push('Screenshot capture must not create a console warning/error.');
        if (!pixels.length || after.color !== 'rgb(0, 0, 0)') controlFailures.push('Screenshot capture must retain the allowed first-party rendering.');
        report.screenshotControls.push({viewport: viewport.name, before, after, consoleMessages, screenshotBytes: pixels.length,
          controlPassed: controlFailures.length === 0, controlFailures});
        for (const message of controlFailures) report.controlFailures.push({viewport: viewport.name, case: 'strict-screenshot-sync', message});
      } catch (error) {
        report.harnessErrors.push({viewport: viewport.name, case: 'strict-screenshot-sync', error: error.message});
      } finally {
        await page.close();
      }
    } finally {
      await context.close();
    }
  }
} catch (error) {
  report.harnessErrors.push({ error: error.message });
} finally {
  try { await browser?.close(); }
  catch (error) { report.harnessErrors.push({ stage: 'browser-close', error: error.message }); }
  const output = path.join(directory, 'test-results/webkit-csp-probe.json');
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, JSON.stringify(report, null, 2) + '\n');
  for (const result of report.results) {
    console.log(`${result.viewport}: ${result.case}: ${result.controlPassed ? 'PASS' : 'FAIL'}; ${result.consoleMessages.length} console messages, ${result.violations.length} CSP violations, color ${result.probeColor}`);
  }
  for (const result of report.screenshotControls) console.log(`${result.viewport}: strict-screenshot-sync: ${result.controlPassed ? 'PASS' : 'FAIL'}; ${result.screenshotBytes} pixel bytes`);
  console.log('WebKit CSP isolation evidence: test-results/webkit-csp-probe.json');
  // Expected rejections must be demonstrated. This never waives game violations.
  if (report.harnessErrors.length || report.unexpectedRequests.length || report.controlFailures.length) process.exitCode = 1;
}
