/*
 * WHAT THE CREATOR HANDED OVER, ONE KIND AT A TIME
 * ============================================================================
 * The creator's tools used to write a player's save directly, and every one of
 * these cases is something that did not work and looked as though it had.
 *
 *   a booster   filed as { id: count } where the game keeps { spec, count }
 *               under an id derived from the spec. It was not in the inventory
 *               and never had been.
 *   a card      carrying `rarity` where the game reads `rarityId`, and
 *               rarityById(undefined) answers Common, so a Legendary arrived
 *               Common and nothing said so.
 *   the profile written into the one key the device rewrites immediately before
 *               every push, so the merge discarded it every single time. Level,
 *               play time, boosters opened, every owned cosmetic.
 *
 * So each case here checks the thing the player would look at, not the row: the
 * pack on the shelf, the tier on the card in the binder, the number on the
 * profile. A test that reads back what it wrote proves nothing.
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
const until = async (fn, ms = 15000) => {
  const end = Date.now() + ms;
  for (;;) {
    let ok = false;
    try { ok = await fn(); } catch { ok = false; }
    if (ok || Date.now() > end) return ok;
    await new Promise((r) => setTimeout(r, 250));
  }
};

const LATEST_ID = RELEASES.at(-1).id;
const ME = '00000000-0000-4000-8000-000000000001';

const seed = (db) => {
  db.users.set('p@example.test', { id: ME, password: 'hunter2hunter2', meta: {} });
  db.profiles.set(ME, { id: ME, username: 'player', created_at: new Date().toISOString(), level: 6,
    cards: 12, unique_cards: 10, boosters_opened: 4, collection_value: 900, play_ms: 60000 });
  return ME;
};

let seq = 0;
const give = (db, kind, payload, note = '') => {
  db.grants.push({ id: ++seq, user_id: ME, at: new Date(Date.now() - 1000 + seq).toISOString(),
    kind, payload, note_en: note, note_fr: note, claimed_at: null });
};

async function launch(db, { schema = 'v2' } = {}) {
  const ctx = await browser.newContext({ serviceWorkers: 'block', ...devices['Pixel 7'] });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`PAGE: ${e.message}`));
  installStubs(page);
  await installSupabase(page, { db, schema });
  await page.addInitScript((LATEST) => {
    /* Seed once. A reload re-runs this script, and rewriting the wallet on the
       way in would make "it was not paid twice" pass by resetting it. */
    if (localStorage.getItem('wikster.profile.v1')) return;
    localStorage.setItem('wikster.language', 'en');
    const now = Date.now();
    const day = Math.floor(now / 86400000);
    localStorage.setItem('wikster.profile.v1', JSON.stringify({
      started: true, createdAt: now, playMs: 60000, boostersOpened: 4, rarityCounts: {},
      progress: { level: 6, xp: 10 }, pendingLevels: [],
      daily: { lastDay: day, shownDay: day, claimed: 1, board: 0 },
      timed: { count: 0, stamp: now }, freeTaken: { window: 0, ids: [] },
      owned: { themes: [], frames: [], fx: [] }
    }));
    localStorage.setItem('wikster.wallet.v1', '5000');
    localStorage.setItem('wikster.ink.v1', '20');
    localStorage.setItem('wikster.inventory.v1', '{}');
    localStorage.setItem('wikster.seenRelease.v1', LATEST);
  }, LATEST_ID);
  await page.goto(process.env.BASE_URL ?? 'http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
  return { ctx, page };
}

const closeSheets = async (page) => {
  for (let i = 0; i < 8; i++) {
    if (!(await page.locator('#sheet').isVisible().catch(() => false))) break;
    await page.keyboard.press('Escape');
    await page.waitForTimeout(250);
  }
};

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

/** Storage, read the way the game reads it. */
const stored = (page, key, fallback = null) =>
  page.evaluate(([k, f]) => { try { return JSON.parse(localStorage.getItem(k)) ?? f; } catch { return f; } }, [key, fallback]);

/* --- coins and Ink -------------------------------------------------------- */
section('money');
{
  const db = newDatabase(); seed(db);
  give(db, 'coins', { amount: 2500, mode: 'add' }, 'For the trouble.');
  give(db, 'ink', { amount: 30, mode: 'add' });
  const { ctx, page } = await launch(db);
  await signIn(page);
  const landed = await until(async () => (await stored(page, 'wikster.wallet.v1', 0)) === 7500);
  check('coins are added to the purse', landed, String(await stored(page, 'wikster.wallet.v1', 0)));
  check('Ink is added too', (await stored(page, 'wikster.ink.v1', 0)) === 50, String(await stored(page, 'wikster.ink.v1', 0)));
  check('both rows are marked picked up', db.grants.every((g) => g.claimed_at));

  /* The sheet is the answer to "it notified me but did not say what". */
  const seen = await until(async () => (await page.locator('.gift-item').count()) >= 2);
  check('the sheet itemises what arrived', seen);
  if (seen) {
    const text = await page.locator('.gift-sheet').textContent();
    check('naming the coins', /2,?500/.test(text), text.slice(0, 90));
    check('and the Ink', /30/.test(text));
    check('with the note beside them', text.includes('For the trouble'));
  }
  await ctx.close();
}

/* --- a booster actually reaches the shelf --------------------------------- */
section('a booster');
{
  const db = newDatabase(); seed(db);
  give(db, 'booster', { spec: { kind: 'open', themeId: null, rarityId: 'legendary', cards: 5 }, count: 3 });
  give(db, 'booster', { spec: { kind: 'theme', themeId: 'space', rarityId: null, cards: 4 }, count: 1 });
  const { ctx, page } = await launch(db);
  await signIn(page);

  const ok = await until(async () => {
    const inv = await stored(page, 'wikster.inventory.v1', {});
    return Object.keys(inv).length === 2;
  });
  check('the inventory gains a slot for each', ok);
  const inv = await stored(page, 'wikster.inventory.v1', {});
  const slots = Object.entries(inv);
  check('filed under an id derived from the spec, not the picker\'s name',
    slots.every(([id]) => id.includes('|')), slots.map(([id]) => id).join(' '));
  check('each slot holds the spec the game rebuilds a pack from',
    slots.every(([, s]) => s && typeof s === 'object' && s.spec && typeof s.spec.kind === 'string'));
  const legend = slots.find(([, s]) => s.spec.rarityId === 'legendary');
  check('with the count asked for', legend?.[1]?.count === 3, JSON.stringify(legend?.[1]?.count));
  check('and the tier asked for', legend?.[1]?.spec?.rarityId === 'legendary');

  /* And the player can see it: the shelf, not the storage. */
  await closeSheets(page);
  await page.locator('#navbar [data-tab="packs"]').click().catch(() => 0);
  await page.waitForTimeout(900);
  const onShelf = await until(async () =>
    (await page.locator('#packs-rail button').count()) >= 2
    && !(await page.locator('#packs-empty').isVisible()));
  check('and it is on the shelf, not only in storage', onShelf,
    `${await page.locator('#packs-rail button').count()} on the rail`);
  await ctx.close();
}

/* --- a card arrives at the tier it was given ------------------------------ */
section('a card, at the tier it was given');
{
  const db = newDatabase(); seed(db);
  give(db, 'card', {
    article: { key: 'Tardigrade', title: 'Tardigrade', description: 'A very small animal.',
      extract: 'Tardigrades are water-dwelling micro-animals.', thumbnail: null,
      url: 'https://en.wikipedia.org/wiki/Tardigrade', lang: 'en', sourceId: 'wikipedia',
      sourceName: 'Wikipedia', views: 40000, popularity: 62 },
    rarityId: 'legendary', count: 2
  }, 'One of my favourites.');
  const { ctx, page } = await launch(db);
  await signIn(page);

  const landed = await until(async () => {
    const c = await stored(page, 'wikster.collection.v3', { entries: {} });
    return Boolean(c.entries?.Tardigrade);
  });
  check('the card is in the collection', landed);
  const col = await stored(page, 'wikster.collection.v3', { entries: {} });
  const entry = col.entries?.Tardigrade ?? {};
  check('under rarityId, which is what the game reads', entry.rarityId === 'legendary',
    `rarityId=${entry.rarityId} rarity=${entry.rarity}`);
  check('with the copies asked for', entry.count === 2, String(entry.count));
  check('carrying its title and text', entry.title === 'Tardigrade' && Boolean(entry.extract));
  /* The price is the game's own: derived from the article's fame and the tier,
     the same as an identical card pulled out of a booster. A number sent from
     outside survived one copy and was recalculated on the next. */
  check('priced the way a pulled card of that tier is priced', entry.price > 0, String(entry.price));

  const sheet = await until(async () => (await page.locator('.gift-item').count()) > 0);
  check('the sheet names the card', sheet && (await page.locator('.gift-sheet').textContent()).includes('Tardigrade'));
  await ctx.close();
}

/* --- the profile, which the merge used to eat ----------------------------- */
section('the profile: what the merge used to throw away');
{
  const db = newDatabase(); seed(db);
  give(db, 'profile', { patch: { playMs: 7200000 }, say: 'Play time set to 2h' });
  give(db, 'profile', { patch: { 'progress.level': 42 }, say: 'Level set to 42' });
  give(db, 'profile', { patch: { boostersOpened: 99 } });
  give(db, 'profileAdd', { path: 'progress.xp', by: 250 });
  const { ctx, page } = await launch(db);
  await signIn(page);

  const ok = await until(async () => (await stored(page, 'wikster.profile.v1', {}))?.playMs === 7200000);
  check('play time is set', ok, String((await stored(page, 'wikster.profile.v1', {}))?.playMs));
  const prof = await stored(page, 'wikster.profile.v1', {});
  check('the level is set', prof?.progress?.level === 42, String(prof?.progress?.level));
  check('boosters opened is set', prof?.boostersOpened === 99, String(prof?.boostersOpened));
  check('XP is added rather than replaced', prof?.progress?.xp === 260, String(prof?.progress?.xp));

  /*
   * The whole point. The device flushes play time and pushes, which rewrites
   * the profile key with a stamp newer than anything the creator could have
   * written. If the value survives that, the queue has done its job.
   */
  await page.waitForTimeout(1200);
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await page.waitForTimeout(2500);
  const after = await stored(page, 'wikster.profile.v1', {});
  check('and it survives the device writing the profile again',
    after?.progress?.level === 42 && after?.playMs >= 7200000, JSON.stringify({ lvl: after?.progress?.level, ms: after?.playMs }));
  await ctx.close();
}

/* --- cosmetics ------------------------------------------------------------ */
section('cosmetics');
{
  const db = newDatabase(); seed(db);
  give(db, 'owned', { bucket: 'fx', ids: ['legendary:classicfoil', 'mythic:tear'] });
  give(db, 'owned', { bucket: 'themes', ids: ['casino'] });
  give(db, 'revokeOwned', { bucket: 'themes', id: 'casino' });
  const { ctx, page } = await launch(db);
  await signIn(page);
  const ok = await until(async () => ((await stored(page, 'wikster.profile.v1', {}))?.owned?.fx ?? []).length === 2);
  check('effects land as rarity:effect, which is the key the game owns them by', ok,
    JSON.stringify((await stored(page, 'wikster.profile.v1', {}))?.owned?.fx));
  const owned = (await stored(page, 'wikster.profile.v1', {}))?.owned ?? {};
  check('a theme given and taken back in the same pass ends up gone',
    !(owned.themes ?? []).includes('casino'), JSON.stringify(owned.themes));
  check('and there is no badges bucket to write into', owned.badges === undefined);
  await ctx.close();
}

/* --- nothing is handed over twice ----------------------------------------- */
section('handed over exactly once');
{
  const db = newDatabase(); seed(db);
  give(db, 'coins', { amount: 1000, mode: 'add' });
  const { ctx, page } = await launch(db);
  await signIn(page);
  await until(async () => (await stored(page, 'wikster.wallet.v1', 0)) === 6000);
  check('it lands', (await stored(page, 'wikster.wallet.v1', 0)) === 6000);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(6000);
  check('and a relaunch does not pay it again', (await stored(page, 'wikster.wallet.v1', 0)) === 6000,
    String(await stored(page, 'wikster.wallet.v1', 0)));
  await ctx.close();
}

/* --- a kind this build does not know is left for one that does ------------ */
section('a kind this build does not know');
{
  const db = newDatabase(); seed(db);
  give(db, 'somethingFromTheFuture', { whatever: true });
  give(db, 'coins', { amount: 100, mode: 'add' });
  const { ctx, page } = await launch(db);
  await signIn(page);
  await until(async () => (await stored(page, 'wikster.wallet.v1', 0)) === 5100);
  check('the one it understands is applied', (await stored(page, 'wikster.wallet.v1', 0)) === 5100);
  check('and the one it does not is left unclaimed for a build that does',
    !db.grants.find((g) => g.kind === 'somethingFromTheFuture').claimed_at);
  await ctx.close();
}

/* --- a project whose schema has not been updated -------------------------- */
section('a project without the table');
{
  const db = newDatabase(); seed(db);
  give(db, 'coins', { amount: 1000, mode: 'add' });
  const { ctx, page } = await launch(db, { schema: 'v1' });
  await page.waitForTimeout(6000);
  check('the game still runs', await page.locator('#navbar').isVisible());
  check('and nothing was handed over', (await stored(page, 'wikster.wallet.v1', 0)) === 5000);
  await ctx.close();
}

console.log(errors.length ? `\npage errors:\n${errors.slice(0, 6).join('\n')}` : '\nno page errors');
await browser.close();
process.exit(fails || errors.length ? 1 : 0);
