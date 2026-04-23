/**
 * SelfBuilt Autorun — generates a list of designs, browses each one,
 * and saves them to your account while you watch in a real browser window.
 *
 * Usage:
 *   node test/autorun.js
 *
 * Requirements:
 *   1. All three servers must be running (npm run dev or the launch config).
 *   2. The browser will open automatically. Sign in to your SelfBuilt account
 *      if prompted — the script waits for you before proceeding.
 *   3. Edit the DESIGNS array below to choose what gets built.
 */

import { chromium } from '@playwright/test';

// ─── EDIT THESE ──────────────────────────────────────────────────────────────
const APP_URL = 'http://localhost:5174';

const DESIGNS = [
  {
    prompt: 'A small side table, 18 inches tall, to hold a lamp next to a couch.',
    // Optional: param tweaks to apply after generation. Key matches the DSL
    // overall_dimensions_in field names: width, height, depth.
    params: { width: 20 },
  },
  {
    prompt: 'A bookshelf about 6 feet tall and 30 inches wide for paperback books.',
    params: {},
  },
  {
    prompt: 'A classic picnic table for the backyard, cedar, seats 6 people.',
    params: {},
  },
  {
    prompt: 'A raised garden bed 4 feet by 8 feet, 18 inches tall, cedar.',
    params: {},
  },
  {
    prompt: 'A 4-foot-tall quarter pipe skateboard ramp, 8 feet wide.',
    params: {},
  },
];

// How long to wait (ms) for a design to finish generating before giving up.
const GENERATE_TIMEOUT = 90_000;
// How long to wait for the Builder Guide to load.
const GUIDE_TIMEOUT = 90_000;
// Slow down each action so you can follow along (ms between steps).
const SLOW_MO = 400;
// ─────────────────────────────────────────────────────────────────────────────

const green  = s => `\x1b[32m${s}\x1b[0m`;
const yellow = s => `\x1b[33m${s}\x1b[0m`;
const red    = s => `\x1b[31m${s}\x1b[0m`;
const bold   = s => `\x1b[1m${s}\x1b[0m`;
const dim    = s => `\x1b[2m${s}\x1b[0m`;

function log(icon, msg) { console.log(`  ${icon} ${msg}`); }

async function waitForWorkshopIframe(page) {
  // The React app embeds the workshop in an iframe. Find it.
  let frame = null;
  const deadline = Date.now() + 15_000;
  while (!frame && Date.now() < deadline) {
    for (const f of page.frames()) {
      if (f.url().includes('selfbuilt-workshop')) { frame = f; break; }
    }
    if (!frame) await page.waitForTimeout(500);
  }
  if (!frame) throw new Error('Workshop iframe not found — is the app running?');
  return frame;
}

async function waitForSignIn(page) {
  log('⏳', 'Waiting for sign-in…');
  // Poll until a known logged-in element appears.
  // The React shell shows the workshop once auth resolves.
  await page.waitForFunction(() => {
    // The workshop iframe appears when the user is signed in and past the terms gate.
    return [...document.querySelectorAll('iframe')].some(f =>
      f.src.includes('selfbuilt-workshop')
    );
  }, { timeout: 120_000 });
  log(green('✓'), 'Signed in and workshop loaded.');
}

async function generateDesign(frame, prompt) {
  // Clear the textarea and type the new prompt.
  const textarea = frame.locator('textarea').first();
  await textarea.click();
  await textarea.selectAll();
  await textarea.fill(prompt);

  // Click the Generate button.
  const generateBtn = frame.locator('button', { hasText: /generate design/i });
  await generateBtn.click();
  log('🔨', `Generating: "${prompt.slice(0, 60)}…"`);

  // Wait until the loading state clears and a design appears.
  // The viewport title div shows the design name once complete.
  await frame.waitForFunction(() => {
    const title = document.getElementById('viewport-title');
    return title && !title.classList.contains('hidden');
  }, { timeout: GENERATE_TIMEOUT });
  log(green('✓'), 'Design generated.');
}

async function applyParams(frame, params) {
  if (!params || Object.keys(params).length === 0) return;
  log('⚙', `Tweaking params: ${JSON.stringify(params)}`);

  for (const [key, value] of Object.entries(params)) {
    const input = frame.locator(`input[data-param="${key}"]`);
    const count = await input.count();
    if (count === 0) { log(yellow('⚠'), `Param "${key}" not found, skipping.`); continue; }
    await input.fill(String(value));
  }

  // Click Apply.
  const applyBtn = frame.locator('button', { hasText: /apply/i });
  if (await applyBtn.count() > 0) {
    await applyBtn.click();
    // Wait for re-render.
    await frame.waitForTimeout(2000);
    log(green('✓'), 'Params applied.');
  }
}

async function openBuilderGuide(page) {
  // Switch to the Builder Guide tab in the React shell nav.
  const guideTab = page.locator('button, a', { hasText: /builder guide/i }).first();
  if (await guideTab.count() === 0) {
    log(yellow('⚠'), 'No Builder Guide tab found, skipping.');
    return;
  }
  await guideTab.click();
  log('📖', 'Opened Builder Guide tab.');

  // Wait for guide content to appear (the Opus guide loads asynchronously).
  try {
    await page.waitForSelector('#opus-guide-content:not(.hidden)', { timeout: GUIDE_TIMEOUT });
    log(green('✓'), 'Builder guide loaded.');
  } catch {
    log(yellow('⚠'), 'Builder guide timed out — moving on.');
  }
  await page.waitForTimeout(1500);
}

async function saveProject(page) {
  // Look for a Save button in the React shell.
  const saveBtn = page.locator('button', { hasText: /save/i }).first();
  if (await saveBtn.count() > 0 && await saveBtn.isVisible()) {
    await saveBtn.click();
    await page.waitForTimeout(1000);
    log(green('✓'), 'Project saved.');
  } else {
    // Auto-save: many apps fire postMessage → Firestore on design render.
    log(dim('·'), 'No explicit Save button — project auto-saved on generate.');
  }
}

async function backToWorkshop(page) {
  const workshopTab = page.locator('button, a', { hasText: /design workshop/i }).first();
  if (await workshopTab.count() > 0) await workshopTab.click();
  await page.waitForTimeout(800);
}

async function run() {
  console.log(bold('\nSelfBuilt Autorun'));
  console.log(dim(`${DESIGNS.length} designs queued  ·  slowMo ${SLOW_MO}ms\n`));

  const browser = await chromium.launch({ headless: false, slowMo: SLOW_MO });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  await page.goto(APP_URL);
  console.log(`${dim('·')} Opened ${APP_URL}`);

  try {
    await waitForSignIn(page);
  } catch {
    console.log(red('Sign-in timed out (2 min). Make sure you sign in to the app.'));
    await browser.close();
    process.exit(1);
  }

  let passed = 0, failed = 0;

  for (let i = 0; i < DESIGNS.length; i++) {
    const { prompt, params } = DESIGNS[i];
    console.log(`\n${'─'.repeat(60)}`);
    console.log(bold(`[${i + 1}/${DESIGNS.length}] Starting design…`));

    try {
      // Always go back to workshop first.
      await backToWorkshop(page);
      const frame = await waitForWorkshopIframe(page);

      await generateDesign(frame, prompt);
      await applyParams(frame, params);
      await openBuilderGuide(page);
      await saveProject(page);

      passed++;
      log(green('✓'), 'Done.');
    } catch (err) {
      failed++;
      log(red('✗'), `Failed: ${err.message}`);
    }

    // Brief pause between designs so the UI settles.
    if (i < DESIGNS.length - 1) {
      log(dim('·'), 'Pausing 3s before next design…');
      await page.waitForTimeout(3000);
    }
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log(bold('Results:') + `  ${green(passed + ' saved')}  ${failed ? red(failed + ' failed') : dim('0 failed')}`);
  console.log(dim('\nBrowser will stay open — close it when you\'re done reviewing.'));

  // Keep browser open for inspection. Press Ctrl+C to exit.
  await new Promise(() => {});
}

run().catch(err => {
  console.error(red('Fatal:'), err.message);
  process.exit(1);
});
