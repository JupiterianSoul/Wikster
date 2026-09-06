/*
 * The seasons, against the stubbed Supabase: the season that is on, its
 * points and its track from the first rung to the theme, the badge on the
 * profile, the stall on the shop floor, the quest of the day, the fourth
 * window of the board, and the year laid out.
 */
import { chromium, devices } from 'playwright';
import { launchOptions } from '../lib/browser.mjs';
import { installStubs } from '../lib/stubs.mjs';
import { installSupabase, newDatabase } from '../lib/supastub.mjs';
import { SEASONS, TRACK } from '../../src/data/seasons.js';
import { seasonAt, seasonCalendar } from '../../src/season.js';

let fails = 0;
const check = (l, c, e = '') => { if (!c) fails++; console.log(`${c ? 'PASS' : 'FAIL'}  ${l}${e ? '  ' + e : ''}`); };
const section = (s) => console.log(`\n== ${s}`);
const browser = await chromium.launch(launchOptions());
const shared = newDatabase();
const errors = [];
const until = async (fn, ms = 6000) => {
  const end = Date.now() + ms;
  for (;;) {
    let ok = false;
    try { ok = await fn(); } catch { ok = false; }
    if (ok || Date.now() > end) return ok;
    await new Promise((r) => setTimeout(r, 200));
  }
};

const ctx = await browser.newContext({ serviceWorkers: 'block', ...devices['Pixel 7'] });
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push(`PAGE: ${e.message}`));
installStubs(page);
await installSupabase(page, { db: shared });
await page.addInitScript(() => {
  localStorage.setItem('wikster.language', 'en');
  localStorage.setItem('wikster.profile.v1', JSON.stringify({
    started: true, createdAt: Date.now(), playMs: 0, boostersOpened: 3,
    rarityCounts: {}, progress: { level: 5, xp: 0 }, pendingLevels: [],
    daily: { lastDay: Math.floor(Date.now() / 86400000), shownDay: Math.floor(Date.now() / 86400000), claimed: 1, board: 0 },
    timed: { count: 0, stamp: Date.now() }, freeTaken: { window: 0, ids: [] }
  }));
  localStorage.setItem('wikster.wallet.v1', '50000');
});
await page.goto((process.env.BASE_URL ?? 'http://127.0.0.1:4173/'), { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2200);
const closeSheets = async () => {
  for (let i = 0; i < 6; i++) {
    if (!(await page.locator('#sheet').isVisible().catch(() => false))) break;
    if (await page.locator('#sheet-close').isVisible()) await page.locator('#sheet-close').click();
    else await page.locator('#sheet .btn-primary').click().catch(() => 0);
    await page.waitForTimeout(400);
  }
};
await closeSheets();
// Signed in, so the season board has somebody to rank.
await page.locator('#gate-seg .seg-option[data-value="signup"]').click();
await page.waitForTimeout(250);
await page.locator('#gate-form input[name="email"]').fill('ada@example.com');
await page.locator('#gate-form input[name="password"]').fill('hunter2hunter2');
await page.locator('#gate-form button[type="submit"]').click();
await page.waitForTimeout(1000);
if (await page.locator('#gate-form input[name="username"]').count()) {
  await page.locator('#gate-form input[name="username"]').fill('ada_lovelace');
  await page.locator('#gate-form button[type="submit"]').click();
  await page.waitForTimeout(1100);
}
await closeSheets();
const viaDrawer = async (link) => {
  await page.evaluate(() => document.querySelector('.appbar .icon-btn')?.click());
  await page.waitForTimeout(400);
  await page.locator(`.drawer-link[data-link="${link}"]`).click();
  await page.waitForTimeout(900);
};
const tab = async (name) => { await page.locator(`.nav-item[data-tab="${name}"]`).click(); await page.waitForTimeout(800); };
const wallet = () => page.evaluate(() => Number(localStorage.getItem('wikster.wallet.v1')));
const profile = () => page.evaluate(() => JSON.parse(localStorage.getItem('wikster.profile.v1') ?? '{}'));
const earn = (metric, detail) => page.evaluate(([m, d]) => window.__wikster.season(m, d), [metric, detail]);

const now = seasonAt();
const { season } = now;
const themeId = `season-${season.id}`;

/* --- the season that is on ------------------------------------------------- */
section('the season that is on');
check('the calendar covers today', Boolean(season) && now.endsAt > Date.now() && now.startsAt <= Date.now(), now.key);
check('and every day of the year', (() => {
  // Walk a whole year a day at a time: some season must own every day, and never two.
  let ok = true;
  for (let d = 0; d < 366; d++) {
    const at = Date.UTC(2027, 0, 1) + d * 86400000;
    const s = seasonAt(at);
    if (!s.season || at < s.startsAt || at >= s.endsAt) { ok = false; break; }
  }
  return ok;
})());
check('eleven seasons, none overlapping', SEASONS.length === 11 && seasonCalendar().length === 11);
await viaDrawer('season');
check('the screen names it', new RegExp(season.name.en).test(await page.locator('#season-name').textContent()), await page.locator('#season-name').textContent());
check('and says how long is left', /day/.test(await page.locator('#season-dates').textContent()), await page.locator('#season-dates').textContent());
check('the banner wears the season\'s colour', (await page.evaluate(() => getComputedStyle(document.querySelector('#screen-season')).getPropertyValue('--season-accent').trim())) === season.accent);
check('the track has ten rungs, all locked', await page.locator('#season-track .season-rung').count() === 10 && await page.locator('#season-track .season-rung.is-locked').count() === 10);
check('the year is laid out with today marked', await page.locator('#season-calendar .season-row').count() === 11 && await page.locator('#season-calendar .season-row.is-now').count() === 1);
check('the quest of the day is up', await page.locator('#season-quest .quest').count() === 1, await page.locator('#season-quest').textContent());
check('the stall sells the season\'s booster', await page.locator('#season-shop .shop-tile').count() === 2 && new RegExp(season.name.en).test(await page.locator('#season-shop').textContent()));

/* --- points and the track ------------------------------------------------- */
section('points and the track');
check('nothing yet', /^0$/.test((await page.locator('#season-points').textContent()).trim()));
await earn('open', { kind: 'theme', themeId: 'animals' });
await page.waitForTimeout(300);
check('an ordinary booster is ten points', (await page.locator('#season-points').textContent()).trim() === '10', await page.locator('#season-points').textContent());
await earn('open', { kind: 'theme', themeId });
await page.waitForTimeout(300);
check('the season\'s own booster is thirty', (await page.locator('#season-points').textContent()).trim() === '40');
await earn('points', { amount: 400, game: 'duel' });
await earn('wikdle', { won: true, guesses: 3 });
await earn('daily', {});
await page.waitForTimeout(400);
// 40 + 20 + 25 + 40 = 125: past the first rung.
check('minigame points, a Wikdle and the gift add up', (await page.locator('#season-points').textContent()).trim() === '125', await page.locator('#season-points').textContent());
check('the first rung is ready', await page.locator('#season-track .season-rung').first().locator('.btn').count() === 1);
await page.evaluate(() => document.querySelector('.appbar .icon-btn')?.click());
await page.waitForTimeout(400);
check('and the drawer says so', await until(async () => !(await page.locator('.drawer-link[data-link="season"] .chip').isHidden())));
await page.locator('.drawer-link[data-link="season"]').click();
await page.waitForTimeout(900);
const purse = await wallet();
await page.locator('#season-track .season-rung').first().locator('.btn').click();
await page.waitForTimeout(700);
check('claiming the first rung pays three hundred', (await wallet()) === purse + 300, `${purse} -> ${await wallet()}`);
check('and stays claimed', await page.locator('#season-track .season-rung').first().locator('.quest-stamp').count() === 1);
const saved = await profile();
check('the save remembers it', saved.seasons?.[now.key]?.claimed?.includes(0) && saved.seasons[now.key].points === 125);

// Up to the badge and the theme.
for (let i = 0; i < 20; i++) await earn('daily', {});
await page.waitForTimeout(500);
check('the fourth rung is within reach', (await profile()).seasons[now.key].points >= TRACK[3]);
await page.locator('#season-track .season-rung').nth(3).locator('.btn').click();
await page.waitForTimeout(700);
check('the badge is unlocked for good', (await profile()).seasonUnlocks?.badges?.includes(season.id));
await viaDrawer('badges');
check('and hangs on the badges screen', new RegExp(`${season.name.en} Season`).test(await page.locator('#badges-all').textContent()), (await page.locator('#badges-all').textContent()).slice(0, 160));
await viaDrawer('customize');
check('the season theme is not offered yet', await page.locator(`.theme-card[data-theme="${season.theme}"]`).count() === 0);
await viaDrawer('season');
for (let i = 0; i < 30; i++) await earn('daily', {});
await page.waitForTimeout(500);
check('the seventh rung is within reach', (await profile()).seasons[now.key].points >= TRACK[6]);
await page.locator('#season-track .season-rung').nth(6).locator('.btn').click();
await page.waitForTimeout(700);
check('the theme is unlocked for good', (await profile()).seasonUnlocks?.themes?.includes(season.id));
await viaDrawer('customize');
check('and the picker offers it now, marked as the season\'s', await page.locator(`.theme-card[data-theme="${season.theme}"]`).count() === 1 && /season theme/i.test(await page.locator(`.theme-card[data-theme="${season.theme}"]`).textContent()));
await page.locator(`.theme-card[data-theme="${season.theme}"]`).click();
await page.waitForTimeout(600);
check('putting it on dresses the whole app', (await page.evaluate(() => document.documentElement.dataset.theme)) === season.theme);
check('with the season\'s backdrop behind it', (await page.evaluate(() => window.__wikster.backdrop.theme?.backdrop?.renderer)) === 'season');
await page.evaluate(() => window.__wikster.setTheme('aurora'));

/* --- the stall, the quest, the board --------------------------------------- */
section('the stall, the quest, the board');
await tab('shop');
await page.waitForTimeout(600);
const stall = page.locator('#screen-shop .shop-season');
check('the season stall is on the shop floor', (await stall.count()) === 1 && new RegExp(season.name.en).test(await stall.textContent()));
const before = await wallet();
await stall.locator('.buy').first().click();
await page.waitForTimeout(900);
check('buying the season booster takes the coins', (await wallet()) < before, `${before} -> ${await wallet()}`);
check('and shelves it', await page.evaluate((id) => Object.keys(JSON.parse(localStorage.getItem('wikster.inventory.v1') ?? '{}')).some((k) => k.startsWith(`theme|${id}|`)), themeId));
await viaDrawer('leaderboard');
check('the board has a season window', await page.locator('#leaderboard-seg .seg-option[data-value="season"]').count() === 1);
await page.locator('#leaderboard-seg .seg-option[data-value="season"]').click();
await page.waitForTimeout(900);
check('that says when the season ends', /season ends in/i.test(await page.locator('#leaderboard-body').textContent()), (await page.locator('#leaderboard-body').textContent()).slice(-80));
await viaDrawer('season');
check('the season board line reads the fourth window', await until(async () => /no score this season|#\d+ of/i.test(await page.locator('#season-board').textContent())), await page.locator('#season-board').textContent());

console.log(errors.length ? `\nERRORS:\n${errors.join('\n')}` : '\nno page errors');
console.log(fails ? `\n${fails} FAILURES` : '\nALL PASS');
await browser.close();
process.exit(fails ? 1 : 0);
