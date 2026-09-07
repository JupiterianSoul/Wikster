/*
 * What the creator has to say, and what a stopped account is told.
 *
 * Both arrive from the server, both are read-only to the player, and neither
 * is allowed to matter: a project whose schema has not been updated, or a
 * failed request, has to end with the game carrying on exactly as before.
 */
import { chromium, devices } from 'playwright';
import { launchOptions } from '../lib/browser.mjs';
import { installStubs } from '../lib/stubs.mjs';
import { installSupabase, newDatabase } from '../lib/supastub.mjs';
import { RELEASES } from '../../src/data/releases.js';

let fails = 0;
const check = (l, c, e = '') => { if (!c) fails++; console.log(`${c ? 'PASS' : 'FAIL'}  ${l}${e ? '  ' + e : ''}`); };
const section = (s) => console.log(`\n== ${s}`);
const browser = await chromium.launch(launchOptions());
const errors = [];
const until = async (fn, ms = 12000) => {
  const end = Date.now() + ms;
  for (;;) {
    let ok = false;
    try { ok = await fn(); } catch { ok = false; }
    if (ok || Date.now() > end) return ok;
    await new Promise((r) => setTimeout(r, 250));
  }
};

const LATEST_ID = RELEASES.at(-1).id;

async function launch(db) {
  const ctx = await browser.newContext({ serviceWorkers: 'block', ...devices['Pixel 7'] });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`PAGE: ${e.message}`));
  installStubs(page);
  await installSupabase(page, { db });
  await page.addInitScript((LATEST) => {
    localStorage.setItem('wikster.language', 'en');
    const now = Date.now();
    const day = Math.floor(now / 86400000);
    localStorage.setItem('wikster.profile.v1', JSON.stringify({
      started: true, createdAt: now, playMs: 0, boostersOpened: 4, rarityCounts: {},
      progress: { level: 6, xp: 0 }, pendingLevels: [],
      daily: { lastDay: day, shownDay: day, claimed: 1, board: 0 },
      timed: { count: 0, stamp: now }, freeTaken: { window: 0, ids: [] }
    }));
    localStorage.setItem('wikster.wallet.v1', '5000');
    // The what's-new sheet holds the queue until it is dismissed, and this
    // suite is not about it. Marking the real latest release as seen is what
    // actually stops it: an id that is not in the list reads as "seen nothing".
    localStorage.setItem('wikster.seenRelease.v1', LATEST);
  }, LATEST_ID);
  await page.goto(process.env.BASE_URL ?? 'http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
  return { ctx, page };
}

const seed = (db) => {
  const id = '00000000-0000-4000-8000-000000000001';
  db.users.set('p@example.test', { id, password: 'hunter2hunter2', meta: {} });
  db.profiles.set(id, { id, username: 'player', created_at: new Date().toISOString(), level: 6,
    cards: 12, unique_cards: 10, boosters_opened: 4, collection_value: 900, play_ms: 60000 });
  return id;
};

const closeSheets = async (page) => {
  for (let i = 0; i < 8; i++) {
    if (!(await page.locator('#sheet').isVisible().catch(() => false))) break;
    await page.keyboard.press('Escape');
    await page.waitForTimeout(250);
  }
};

/* Sign in through the gate the way a player does, because a suspension is
   read by a policy that only answers a signed-in session. */
async function signIn(page) {
  await page.evaluate(() => document.querySelector('.appbar .icon-btn')?.click());
  await page.waitForTimeout(400);
  await page.locator('.drawer-link[data-link="account"], .drawer-link[data-link="friends"]').first().click().catch(() => 0);
  await page.waitForTimeout(900);
  if (await page.locator('#gate-seg .seg-option[data-value="in"]').count()) {
    await page.locator('#gate-seg .seg-option[data-value="in"]').click();
    await page.waitForTimeout(200);
  }
  await page.locator('#gate-form input[name="email"]').fill('p@example.test');
  await page.locator('#gate-form input[name="password"]').fill('hunter2hunter2');
  await page.locator('#gate-form button[type="submit"]').click();
  await page.waitForTimeout(2600);
  await closeSheets(page);
}

/* --- a live announcement reaches the player ------------------------------- */
section('an announcement, read by a player with no account');
{
  const db = newDatabase();
  const me = seed(db);
  db.announcements.push({
    id: 1, title_en: 'Back up', title_fr: 'De retour',
    body_en: 'Sorry about this morning. Everyone has coins waiting.',
    body_fr: 'Desole pour ce matin.', kind: 'note',
    starts_at: new Date(Date.now() - 60000).toISOString(), ends_at: null, target_user: null
  });
  const { ctx, page } = await launch(db);
  const shown = await until(async () =>
    (await page.locator('.notice-sheet').count()) > 0
    && (await page.locator('#sheet').isVisible()));
  check('it reaches a signed-out player', shown);
  if (shown) {
    check('with the creator\'s words', (await page.locator('.notice-body').textContent()).includes('Sorry about this morning'));
    check('and its title', (await page.locator('#sheet').textContent()).includes('Back up'));
  }
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  /* Dismissed means dismissed: a reload must not show it again. */
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4500);
  check('and not shown a second time', (await page.locator('.notice-sheet').count()) === 0);
  await ctx.close();
}

/* --- one that has not started, or has ended, is not shown ----------------- */
section('the ones that should not appear');
{
  const db = newDatabase();
  seed(db);
  db.announcements.push(
    { id: 2, title_en: 'Later', body_en: 'Not yet.', kind: 'note',
      starts_at: new Date(Date.now() + 86400000).toISOString(), ends_at: null, target_user: null },
    { id: 3, title_en: 'Over', body_en: 'Finished.', kind: 'note',
      starts_at: new Date(Date.now() - 172800000).toISOString(),
      ends_at: new Date(Date.now() - 86400000).toISOString(), target_user: null },
    { id: 4, title_en: 'Someone else', body_en: 'For another player.', kind: 'note',
      starts_at: new Date(Date.now() - 60000).toISOString(), ends_at: null,
      target_user: '00000000-0000-4000-8000-000000000099' }
  );
  const { ctx, page } = await launch(db);
  await page.waitForTimeout(5000);
  check('a future one waits', (await page.locator('.notice-sheet').count()) === 0);
  check('the game is usable regardless', await page.locator('#navbar').isVisible());
  await ctx.close();
}

/* --- one aimed at a single player, which is what a grant note is ---------- */
section('an announcement for one player');
{
  const db = newDatabase();
  const me = seed(db);
  db.announcements.push({
    id: 6, title_en: 'From the creator', body_en: 'Here are 5,000 coins for the trouble.',
    kind: 'gift', starts_at: new Date(Date.now() - 60000).toISOString(), ends_at: null,
    target_user: me
  });
  const { ctx, page } = await launch(db);
  await page.waitForTimeout(4500);
  check('it does not reach them before they sign in', (await page.locator('.notice-sheet').count()) === 0);
  await signIn(page);
  await page.reload({ waitUntil: 'domcontentloaded' });
  const shown = await until(async () => (await page.locator('.notice-sheet').count()) > 0);
  check('it reaches them once signed in', shown);
  if (shown) {
    check('with what it was about', (await page.locator('.notice-body').textContent()).includes('5,000 coins'));
  }
  await ctx.close();
}

/* --- a suspension explains itself ----------------------------------------- */
section('a suspended account is told why');
{
  const db = newDatabase();
  const me = seed(db);
  db.suspensions.push({ user_id: me, reason: 'Selling accounts', until: null, muted: false });
  db.announcements.push({ id: 5, title_en: 'Ignored', body_en: 'The suspension comes first.',
    kind: 'note', starts_at: new Date(Date.now() - 60000).toISOString(), ends_at: null, target_user: null });
  const { ctx, page } = await launch(db);
  await signIn(page);
  await page.reload({ waitUntil: 'domcontentloaded' });
  const shown = await until(async () => (await page.locator('.notice-sheet').count()) > 0);
  check('the notice appears', shown);
  if (shown) {
    const text = await page.locator('#sheet').textContent();
    check('it says the account is on hold', text.includes('on hold'), text.slice(0, 70));
    check('it gives the reason', text.includes('Selling accounts'));
    check('it says the collection is untouched', text.toLowerCase().includes('collection'));
    check('and it comes before the announcement', !text.includes('The suspension comes first'));
  }
  await ctx.close();
}

/* --- a muted account is told something different --------------------------- */
section('a muted account');
{
  const db = newDatabase();
  const me = seed(db);
  db.suspensions.push({ user_id: me, reason: 'Language in guild chat', until: null, muted: true });
  const { ctx, page } = await launch(db);
  await signIn(page);
  await page.reload({ waitUntil: 'domcontentloaded' });
  const shown = await until(async () => (await page.locator('.notice-sheet').count()) > 0);
  check('the notice appears', shown);
  if (shown) {
    const text = await page.locator('#sheet').textContent();
    check('it is about posting, not about being on hold', text.includes('cannot post'), text.slice(0, 70));
  }
  await ctx.close();
}

/* --- a lapsed one says nothing --------------------------------------------- */
section('a suspension that has lapsed');
{
  const db = newDatabase();
  const me = seed(db);
  db.suspensions.push({ user_id: me, reason: 'Old business',
    until: new Date(Date.now() - 3600000).toISOString(), muted: false });
  const { ctx, page } = await launch(db);
  await signIn(page);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  check('nothing is shown', (await page.locator('.notice-sheet').count()) === 0);
  check('and the game is usable', await page.locator('#navbar').isVisible());
  await ctx.close();
}

/* --- an older project has neither table ------------------------------------- */
section('a project whose schema has not been updated');
{
  const db = newDatabase();
  seed(db);
  const ctx = await browser.newContext({ serviceWorkers: 'block', ...devices['Pixel 7'] });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`PAGE: ${e.message}`));
  installStubs(page);
  await installSupabase(page, { db });
  // Both tables answer as though they are not there at all.
  await page.route('**/rest/v1/announcements*', (r) =>
    r.fulfill({ status: 404, contentType: 'application/json',
      body: JSON.stringify({ code: '42P01', message: 'relation "public.announcements" does not exist' }) }));
  await page.route('**/rest/v1/suspensions*', (r) =>
    r.fulfill({ status: 404, contentType: 'application/json',
      body: JSON.stringify({ code: '42P01', message: 'relation "public.suspensions" does not exist' }) }));
  await page.addInitScript((latest) => {
    localStorage.setItem('wikster.language', 'en');
    localStorage.setItem('wikster.seenRelease.v1', latest);
  }, RELEASES.at(-1).id);
  await page.goto(process.env.BASE_URL ?? 'http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  check('nothing is shown', (await page.locator('.notice-sheet').count()) === 0);
  check('and nothing is broken', await page.locator('#navbar').isVisible());
  await ctx.close();
}

check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
console.log(fails ? `\n${fails} FAILURES` : '\nALL PASS');
process.exit(fails ? 1 : 0);
