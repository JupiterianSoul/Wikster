/*
 * The friend games, against the stubbed Supabase: a Card Clash set by A and
 * answered by B, settled and paid both ways; a Speed Sort played by both;
 * a challenge turned down; the bell and the table following live.
 */
import { chromium, devices } from 'playwright';
import { launchOptions } from '../lib/browser.mjs';
import { installStubs } from '../lib/stubs.mjs';
import { installSupabase, newDatabase } from '../lib/supastub.mjs';
import { PAY } from '../../src/versus.js';

let fails = 0;
const check = (l, c, e = '') => { if (!c) fails++; console.log(`${c ? 'PASS' : 'FAIL'}  ${l}${e ? '  ' + e : ''}`); };
const section = (s) => console.log(`\n== ${s}`);
const browser = await chromium.launch(launchOptions());
const shared = newDatabase();
const errors = [];
const until = async (fn, ms = 8000) => {
  const end = Date.now() + ms;
  for (;;) {
    let ok = false;
    try { ok = await fn(); } catch { ok = false; }
    if (ok || Date.now() > end) return ok;
    await new Promise((r) => setTimeout(r, 200));
  }
};
const PX = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
const card = (key, title, rarityId, price, views) => ({
  key, title, rarityId, price, views, popularity: 0.6, count: 1, favorite: false,
  packId: 'theme|animals', packName: 'Animals', lang: 'en', thumbnail: PX, firstPulledAt: 1, lastPulledAt: 1, description: 'A thing', extract: 'Some words.'
});
// A's hand is the stronger by readers: 900 / 700 / 500 / 300 / 100 against 800 / 600 / 400 / 200 / 50.
const A_CARDS = Object.fromEntries([
  ['en:Cat', 'Cat', 'rare', 300, 900], ['en:Dog', 'Dog', 'rare', 300, 700], ['en:Owl', 'Owl', 'uncommon', 120, 500],
  ['en:Fox', 'Fox', 'uncommon', 120, 300], ['en:Eel', 'Eel', 'common', 40, 100], ['en:Ant', 'Ant', 'common', 40, 80],
  ['en:Bee', 'Bee', 'common', 40, 60], ['en:Cod', 'Cod', 'common', 40, 40], ['en:Elk', 'Elk', 'common', 40, 20]
].map(([k, ti, r, p, v]) => [k, card(k, ti, r, p, v)]));
const B_CARDS = Object.fromEntries([
  ['en:Lion', 'Lion', 'rare', 300, 800], ['en:Wolf', 'Wolf', 'rare', 300, 600], ['en:Hare', 'Hare', 'uncommon', 120, 400],
  ['en:Newt', 'Newt', 'uncommon', 120, 200], ['en:Gnat', 'Gnat', 'common', 40, 50], ['en:Moth', 'Moth', 'common', 40, 30]
].map(([k, ti, r, p, v]) => [k, card(k, ti, r, p, v)]));

async function newPlayer(label, cards) {
  const ctx = await browser.newContext({ serviceWorkers: 'block', ...devices['Pixel 7'] });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${label} PAGE: ${e.message}`));
  installStubs(page);
  await installSupabase(page, { db: shared });
  await page.addInitScript(({ cards }) => {
    localStorage.setItem('wikster.language', 'en');
    localStorage.setItem('wikster.profile.v1', JSON.stringify({
      started: true, createdAt: Date.now(), playMs: 0, boostersOpened: 3,
      rarityCounts: {}, progress: { level: 5, xp: 0 }, pendingLevels: [],
      daily: { lastDay: Math.floor(Date.now() / 86400000), shownDay: Math.floor(Date.now() / 86400000), claimed: 1, board: 0 },
      timed: { count: 0, stamp: Date.now() }, freeTaken: { window: 0, ids: [] }
    }));
    localStorage.setItem('wikster.wallet.v1', '10000');
    localStorage.setItem('wikster.collection.v3', JSON.stringify({ entries: cards }));
  }, { cards });
  await page.goto((process.env.BASE_URL ?? 'http://127.0.0.1:4173/'), { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2200);
  await closeSheets(page);
  return page;
}
async function closeSheets(page) {
  for (let i = 0; i < 6; i++) {
    if (!(await page.locator('#sheet').isVisible().catch(() => false))) break;
    if (await page.locator('#sheet-close').isVisible()) await page.locator('#sheet-close').click();
    else await page.locator('#sheet .btn-primary').click().catch(() => 0);
    await page.waitForTimeout(400);
  }
}
async function gate(page, email, username) {
  await page.locator('#gate-seg .seg-option[data-value="signup"]').click();
  await page.waitForTimeout(250);
  await page.locator('#gate-form input[name="email"]').fill(email);
  await page.locator('#gate-form input[name="password"]').fill('hunter2hunter2');
  await page.locator('#gate-form button[type="submit"]').click();
  await page.waitForTimeout(1000);
  if (await page.locator('#gate-form input[name="username"]').count()) {
    await page.locator('#gate-form input[name="username"]').fill(username);
    await page.locator('#gate-form button[type="submit"]').click();
    await page.waitForTimeout(1100);
  }
  await closeSheets(page);
}
const viaDrawer = async (page, link) => {
  await page.evaluate(() => document.querySelector('.appbar .icon-btn')?.click());
  await page.waitForTimeout(400);
  await page.locator(`.drawer-link[data-link="${link}"]`).click();
  await page.waitForTimeout(900);
};
const wallet = (page) => page.evaluate(() => Number(localStorage.getItem('wikster.wallet.v1')));
const inkOf = (page) => page.evaluate(() => Number(localStorage.getItem('wikster.ink.v1') ?? 0));
const openVersus = async (page) => {
  await viaDrawer(page, 'games');
  await page.locator('.game-tile', { hasText: /friends/i }).click();
  await page.waitForTimeout(1200);
};

/* --- two friends ------------------------------------------------------------ */
section('two friends');
const a = await newPlayer('A', A_CARDS);
await gate(a, 'ada@example.com', 'ada_lovelace');
const b = await newPlayer('B', B_CARDS);
await gate(b, 'grace@example.com', 'grace_h');
const idA = [...shared.profiles.values()].find((p) => p.username === 'ada_lovelace')?.id;
const idB = [...shared.profiles.values()].find((p) => p.username === 'grace_h')?.id;
check('both accounts exist', Boolean(idA && idB));
shared.friendships.push({ id: 'f1', requester: idA, addressee: idB, status: 'accepted', created_at: new Date().toISOString() });
await viaDrawer(a, 'friends');
await viaDrawer(b, 'friends');
await a.waitForTimeout(800);

/* --- card clash --------------------------------------------------------------- */
section('card clash');
await openVersus(a);
check('the games screen leads to Versus', await a.locator('#screen-versus').isVisible());
check('nothing on the table yet', /nothing|nobody|no /i.test(await a.locator('#versus-body').textContent()));
await a.locator('#versus-body .btn-primary', { hasText: /new challenge/i }).click();
await a.waitForTimeout(500);
check('a new challenge picks a friend', (await a.locator('#versus-body .person.is-tick').count()) === 1 && /grace_h/.test(await a.locator('#versus-body').textContent()));
await a.locator('#versus-body .person.is-tick').first().click();
await a.waitForTimeout(300);
check('and a game, both playable with these cards', (await a.locator('#versus-body .versus-game:not([disabled])').count()) === 2);
await a.locator('#versus-body .versus-game[data-kind="clash"]').click();
await a.waitForTimeout(300);
await a.locator('#versus-body .btn-primary', { hasText: /play your half/i }).click();
await a.waitForTimeout(600);
check('the clash asks for five cards, readers showing', (await a.locator('#versus-body .pick-row').count()) === 9 && /900/.test(await a.locator('#versus-body .pick-row').first().textContent()));
for (const key of ['en:Cat', 'en:Dog', 'en:Owl', 'en:Fox', 'en:Eel']) await a.locator(`#versus-body .pick-row[data-key="${key}"]`).click();
await a.waitForTimeout(200);
check('a sixth is refused', await (async () => { await a.locator('#versus-body .pick-row[data-key="en:Ant"]').click(); await a.waitForTimeout(150); return (await a.locator('#versus-body .pick-row.is-on').count()) === 5; })());
await a.locator('#versus-body .btn-primary', { hasText: /send/i }).click();
await a.waitForTimeout(1500);
check('the challenge is on the server', shared.challenges.length === 1 && shared.challenges[0].kind === 'clash' && shared.challenges[0].payload.cards.length === 5);
check('and waits on them, on A\'s table', await until(async () => (await a.locator('#versus-body .versus-row').count()) === 1 && /waiting/i.test(await a.locator('#versus-body .versus-row').textContent())));

// B hears about it without touching anything.
check('B\'s bell rings', await until(async () => (await b.locator('#bell-count').textContent().catch(() => '')).trim() !== '' && !(await b.locator('#bell-count').isHidden())), await b.locator('#bell-count').textContent().catch(() => ''));
await openVersus(b);
check('it waits on B', await until(async () => /ada_lovelace/.test(await b.locator('#versus-body').textContent()) && (await b.locator('#versus-body .versus-row .btn-primary').count()) === 1));
await b.locator('#versus-body .versus-row .btn-primary').click();
await b.waitForTimeout(600);
for (const key of ['en:Lion', 'en:Wolf', 'en:Hare', 'en:Newt', 'en:Gnat']) await b.locator(`#versus-body .pick-row[data-key="${key}"]`).click();
await b.locator('#versus-body .btn-primary', { hasText: /send/i }).click();
await b.waitForTimeout(1500);
check('the server settles it: A takes every round', shared.challenges[0].status === 'done' && shared.challenges[0].result.winner === 'challenger' && shared.challenges[0].result.scores.challenger === 5, JSON.stringify(shared.challenges[0].result));
check('B sees the reckoning at once', await until(async () => (await b.locator('#sheet').isVisible()) && (await b.locator('#sheet .versus-round').count()) === 5 && /beat you|lost/i.test(await b.locator('#sheet .versus-outcome-line').textContent())), await b.locator('#sheet .versus-outcome-line').textContent().catch(() => ''));
const bCoins = await wallet(b), bInk = await inkOf(b);
await b.locator('#sheet .btn-primary', { hasText: /claim/i }).click();
await b.waitForTimeout(800);
check('the loser is still paid', (await wallet(b)) === bCoins + PAY.lose.coins && (await inkOf(b)) === bInk + PAY.lose.ink, `${bCoins} -> ${await wallet(b)}`);
check('and only once', shared.challenges[0].claimed.length === 1);
check('A\'s table follows: settled, won, a claim to take', await until(async () => /won/i.test(await a.locator('#versus-body .versus-row').textContent()) && (await a.locator('#versus-body .versus-row .btn-primary').count()) === 1));
const aCoins = await wallet(a), aInk = await inkOf(a);
await a.locator('#versus-body .versus-row .btn-primary').click();
await a.waitForTimeout(800);
check('the winner is paid more', (await wallet(a)) === aCoins + PAY.win.coins && (await inkOf(a)) === aInk + PAY.win.ink, `${aCoins} -> ${await wallet(a)}`);
check('the ledger counts the game and the win', await a.evaluate(() => { const l = JSON.parse(localStorage.getItem('wikster.profile.v1')).ledger; return l.versusPlayed === 1 && l.versusWins === 1; }));
check('A\'s bell told the story too', await a.evaluate(() => (JSON.parse(localStorage.getItem('wikster.profile.v1')).notifFeed ?? []).some((n) => /grace_h/.test(n.title) && /won|beat/i.test(n.title))));

/* --- speed sort ----------------------------------------------------------------- */
section('speed sort');
await a.locator('#versus-body .btn-primary', { hasText: /new challenge/i }).click();
await a.waitForTimeout(400);
await a.locator('#versus-body .person.is-tick').first().click();
await a.locator('#versus-body .versus-game[data-kind="sort"]').click();
await a.locator('#versus-body .btn-primary', { hasText: /play your half/i }).click();
await a.waitForTimeout(600);
check('eight cards to put in order', (await a.locator('#versus-body .versus-card').count()) === 8 && (await a.locator('#versus-body .versus-slot').count()) === 8);
// A plays it perfectly: the order by readers is known.
const dealt = await a.evaluate(() => [...document.querySelectorAll('#versus-body .versus-card')].map((n) => n.dataset.key));
const byViews = (keys) => [...keys].sort((x, y) => A_CARDS[y].views - A_CARDS[x].views);
for (const key of byViews(dealt)) await a.locator(`#versus-body .versus-card[data-key="${key}"]`).click();
await a.waitForTimeout(1500);
check('the sort is sent with its time', shared.challenges.length === 2 && shared.challenges[1].kind === 'sort' && shared.challenges[1].payload.order.length === 8 && shared.challenges[1].payload.ms > 0);
check('it reaches B', await until(async () => (await b.locator('#versus-body .versus-row[data-kind="sort"] .btn-primary').count()) === 1));
await b.locator('#versus-body .versus-row[data-kind="sort"] .btn-primary').click();
await b.waitForTimeout(600);
const dealtB = await b.evaluate(() => [...document.querySelectorAll('#versus-body .versus-card')].map((n) => n.dataset.key));
check('B gets the same eight', dealtB.length === 8 && dealtB.every((k) => dealt.includes(k)));
// B swaps the first two, then undoes one wrong tap along the way.
const ordered = byViews(dealtB);
await b.locator(`#versus-body .versus-card[data-key="${ordered[3]}"]`).click();
await b.locator('#versus-body .versus-sort .btn-ghost').click();
check('undo takes the last card back', (await b.locator('#versus-body .versus-card.is-placed').count()) === 0);
for (const key of [ordered[1], ordered[0], ...ordered.slice(2)]) await b.locator(`#versus-body .versus-card[data-key="${key}"]`).click();
await b.waitForTimeout(1500);
check('right positions decide it: A wins eight to six', shared.challenges[1].status === 'done' && shared.challenges[1].result.winner === 'challenger' && shared.challenges[1].result.scores.opponent === 6, JSON.stringify(shared.challenges[1].result));
check('the reckoning shows the true order with B\'s misses', (await b.locator('#sheet .versus-round').count()) === 8 && (await b.locator('#sheet .versus-round.is-mine-right').count()) === 6);
await closeSheets(b);

/* --- turning one down ------------------------------------------------------------- */
section('turning one down');
await a.locator('#versus-body .btn-primary', { hasText: /new challenge/i }).click();
await a.waitForTimeout(400);
await a.locator('#versus-body .person.is-tick').first().click();
await a.locator('#versus-body .versus-game[data-kind="clash"]').click();
await a.locator('#versus-body .btn-primary', { hasText: /play your half/i }).click();
await a.waitForTimeout(500);
for (const key of ['en:Cat', 'en:Dog', 'en:Owl', 'en:Fox', 'en:Eel']) await a.locator(`#versus-body .pick-row[data-key="${key}"]`).click();
await a.locator('#versus-body .btn-primary', { hasText: /send/i }).click();
await a.waitForTimeout(1200);
check('a third challenge waits on B', await until(async () => (await b.locator('#versus-body .versus-row .btn-ghost', { hasText: /decline/i }).count()) === 1));
await b.locator('#versus-body .versus-row .btn-ghost', { hasText: /decline/i }).click();
await b.waitForTimeout(1000);
check('declined on the server', shared.challenges[2].status === 'declined');
check('and marked so on A\'s table', await until(async () => /declined/i.test(await a.locator('#versus-body').textContent())));

/* --- the friend page ----------------------------------------------------------------- */
section('the friend page');
await viaDrawer(a, 'friends');
await a.locator('#friends-list .person').first().click();
await a.waitForTimeout(1200);
await a.locator('#friend-actions .btn', { hasText: /challenge/i }).click();
await a.waitForTimeout(900);
check('a friend\'s page leads to a challenge with them picked', await a.locator('#screen-versus').isVisible() && (await a.locator('#versus-body .person.is-tick.is-on').count()) === 1);

console.log(errors.length ? `\nERRORS:\n${errors.join('\n')}` : '\nno page errors');
console.log(fails ? `\n${fails} FAILURES` : '\nALL PASS');
await browser.close();
process.exit(fails ? 1 : 0);
