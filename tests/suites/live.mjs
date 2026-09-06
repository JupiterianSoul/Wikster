/*
 * The live wires, against the stubbed Supabase and its Phoenix socket: a
 * message and its receipt arriving without a poll, presence coming and
 * going, the last-online line, a parcel and a request landing at once, the
 * board moving under a score, and a French Wikdle that takes French words.
 *
 * Every wait here is under two seconds; the poll is a minute. Anything that
 * shows up inside that is the socket doing its job.
 */
import { chromium, devices } from 'playwright';
import { launchOptions } from '../lib/browser.mjs';
import { installStubs } from '../lib/stubs.mjs';
import { installSupabase, newDatabase } from '../lib/supastub.mjs';

let fails = 0;
const check = (l, c, e = '') => { if (!c) fails++; console.log(`${c ? 'PASS' : 'FAIL'}  ${l}${e ? '  ' + e : ''}`); };
const section = (s) => console.log(`\n== ${s}`);
const browser = await chromium.launch(launchOptions());
const shared = newDatabase();
const errors = [];
const PX = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
const card = (key, title, rarityId, price, pack) => ({
  key, title, rarityId, price, views: 400000, popularity: 0.7, count: 1, favorite: false,
  packId: `theme|${pack}`, packName: pack[0].toUpperCase() + pack.slice(1), lang: 'en',
  thumbnail: PX, firstPulledAt: 1, lastPulledAt: 1, description: 'A thing', extract: 'Some words about it.'
});
const MINE = { 'en:Cat': card('en:Cat', 'Cat', 'rare', 300, 'animals') };

/** A page as a player; waits until the socket is up when asked, so a check
 *  never races the join. */
async function newPlayer(label, { cards = {}, language = 'en' } = {}) {
  const ctx = await browser.newContext({ serviceWorkers: 'block', ...devices['Pixel 7'] });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${label} PAGE: ${e.message}`));
  installStubs(page);
  await installSupabase(page, { db: shared });
  await page.addInitScript(({ cards, language }) => {
    localStorage.setItem('wikster.language', language);
    localStorage.setItem('wikster.profile.v1', JSON.stringify({
      started: true, createdAt: Date.now(), playMs: 0, boostersOpened: 3,
      rarityCounts: {}, progress: { level: 5, xp: 0 }, pendingLevels: [],
      daily: { lastDay: Math.floor(Date.now() / 86400000), shownDay: Math.floor(Date.now() / 86400000), claimed: 1, board: 0 },
      timed: { count: 0, stamp: Date.now() }, freeTaken: { window: 0, ids: [] }
    }));
    localStorage.setItem('wikster.wallet.v1', '50000');
    localStorage.setItem('wikster.collection.v3', JSON.stringify({ entries: cards }));
  }, { cards, language });
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
/** Waits for a condition, polling, up to `ms`: still far inside the
 *  minute the poll would take, which is the whole point. */
const until = async (fn, ms = 6000) => {
  const end = Date.now() + ms;
  for (;;) {
    let ok = false;
    try { ok = await fn(); } catch { ok = false; }
    if (ok || Date.now() > end) return ok;
    await new Promise((r) => setTimeout(r, 200));
  }
};
const userIdOf = (email) => shared.users.get(email)?.id;
/** Which topics a player's sockets have joined: the wires are up when the
 *  social feed and the presence lobby are among them. */
const wiresOf = (id) => [...shared.realtime.sockets].filter((s) => s.user === id).flatMap((s) => [...s.joins.keys()]);

/* --- two friends, on the wire ------------------------------------------------ */
section('two friends, on the wire');
const a = await newPlayer('A', { cards: MINE });
await gate(a, 'ada@example.com', 'ada_lovelace');
const b = await newPlayer('B');
await gate(b, 'grace@example.com', 'grace_h');
const idA = userIdOf('ada@example.com');
const idB = userIdOf('grace@example.com');
shared.friendships.push({ id: 'f1', requester: idA, addressee: idB, status: 'accepted', created_at: new Date().toISOString() });
await a.waitForTimeout(1200);
check('both players have joined their social feed', wiresOf(idA).includes(`realtime:social:${idA}`) && wiresOf(idB).includes(`realtime:social:${idB}`), JSON.stringify([wiresOf(idA), wiresOf(idB)]));
check('and the presence lobby', wiresOf(idA).includes('realtime:presence:lobby') && wiresOf(idB).includes('realtime:presence:lobby'));

/* --- presence ------------------------------------------------------------------ */
section('presence');
await viaDrawer(a, 'friends');
await a.waitForTimeout(1200);
check('A sees B online, from the lobby', (await a.locator('#friends-list .person .presence-dot.is-online').count()) === 1);
await a.locator('#friends-list .person').first().click();
await a.waitForTimeout(900);
check('the friend screen says Online', /online/i.test(await a.locator('#friend-rank').textContent()) && !/offline/i.test(await a.locator('#friend-rank').textContent()), await a.locator('#friend-rank').textContent());
check('and no last-online line while they are here', (await a.locator('#friend-rank .friend-seen').count()) === 0);

/* --- a message arrives without a poll ------------------------------------------ */
section('a message, live');
await a.locator('#friend-actions .btn-primary').click();
await a.waitForTimeout(1200);
check('the chat is up', await a.locator('#screen-chat').isVisible());
check('the chat head says Online', /online/i.test(await a.locator('#chat-presence').textContent()));
await viaDrawer(b, 'friends');
await b.waitForTimeout(800);
await a.locator('#chat-input').fill('hello grace');
await a.locator('#chat-send').click();
const bubble = a.locator('#chat-log .bubble.is-mine').first();
check('my bubble is up, one tick', await until(async () => (await bubble.count()) === 1) && !(await bubble.evaluate((n) => n.classList.contains('is-read'))));
check('B\'s friends list shows the unread at once', await until(async () => /1/.test(await b.locator('#friends-list .person .count').first().textContent())), await b.locator('#friends-list').textContent());

/* --- opening the conversation is the read ---------------------------------------- */
section('the receipt');
await b.locator('#friends-list .person').first().click();
await b.waitForTimeout(900);
await b.locator('#friend-actions .btn-primary').click();
check('B sees the message', await until(async () => /hello grace/.test(await b.locator('#chat-log').textContent())));
check('the server has it read', await until(async () => shared.messages.every((m) => m.read_at)));
check('A\'s bubble turns to two blue ticks without B typing', await until(() => bubble.evaluate((n) => n.classList.contains('is-read'))), await a.locator('#chat-log').innerHTML().then((h) => h.slice(0, 200)));
check('and says Seen', /seen/i.test(await a.locator('#chat-log .chat-receipt').textContent()));
// B answers: A's log grows without waiting for its ten-second poll.
await b.locator('#chat-input').fill('hi ada');
await b.locator('#chat-send').click();
check('B\'s answer is in A\'s log at once', await until(async () => /hi ada/.test(await a.locator('#chat-log').textContent())));

/* --- a parcel and a request land at once ------------------------------------------ */
section('a parcel and a request');
const before = await a.evaluate(() => Object.values(JSON.parse(localStorage.getItem('wikster.inventory.v1') ?? '{}')).reduce((n, s) => n + (s.count ?? 0), 0));
const parcel = { id: 'd-live-1', sender: idB, recipient: idA, kind: 'booster',
  payload: { spec: { kind: 'theme', themeId: 'animals', rarityId: null, cards: 5 }, count: 1 },
  created_at: new Date().toISOString(), claimed_at: null };
shared.deliveries.push(parcel);
shared.emitChange('deliveries', 'INSERT', parcel);
const held = () => a.evaluate(() => Object.values(JSON.parse(localStorage.getItem('wikster.inventory.v1') ?? '{}')).reduce((n, s) => n + (s.count ?? 0), 0));
check('the booster is on A\'s shelf within seconds', await until(async () => (await held()) === before + 1), `${before} -> ${await held()}`);
check('and claimed on the server', shared.deliveries.find((d) => d.id === 'd-live-1')?.claimed_at != null);
check('the bell kept a note of it', await a.evaluate(() => (JSON.parse(localStorage.getItem('wikster.profile.v1')).notifFeed ?? []).some((n) => /booster/i.test(n.title))));
const c = await newPlayer('C');
await gate(c, 'carol@example.com', 'carol_c');
const idC = userIdOf('carol@example.com');
await viaDrawer(a, 'friends');
await a.waitForTimeout(600);
const ask = { id: 'f-live-2', requester: idC, addressee: idA, status: 'pending', created_at: new Date().toISOString() };
shared.friendships.push(ask);
shared.emitChange('friendships', 'INSERT', ask);
check('the request is in A\'s incoming list at once', await until(async () => /carol_c/.test(await a.locator('#incoming-list').textContent())), await a.locator('#incoming-list').textContent());

/* --- leaving is offline, with a last-online line ----------------------------------- */
section('going away');
// B signs out: the wires close with a leave, which is what a phone does
// when the app is put away. (Tearing the context down instead depends on
// the browser delivering a close for a mocked socket, which not every
// build does.)
await b.evaluate(() => window.__wikster.signOut());
await b.waitForTimeout(800);
await b.context().close();
check('B\'s dot goes out when their socket closes', await until(async () => (await a.locator('#friends-list .person .presence-dot.is-online').count()) === 0));
await a.locator('#friends-list .person', { hasText: 'grace_h' }).first().click();
await a.waitForTimeout(900);
check('the friend screen says Offline', /offline/i.test(await a.locator('#friend-rank').textContent()));
check('with when they were last online, to the minute', /last online 1 min ago/i.test(await a.locator('#friend-rank .friend-seen').textContent().catch(() => '')), await a.locator('#friend-rank').textContent());
await a.locator('#friend-actions .btn-primary').click();
await a.waitForTimeout(900);
check('and the chat head carries it beside Offline', /offline · last online 1 min ago/i.test(await a.locator('#chat-presence').textContent()), await a.locator('#chat-presence').textContent());

/* --- the board moves as scores land --------------------------------------------------- */
section('the board');
await viaDrawer(a, 'leaderboard');
await a.waitForTimeout(1500);
check('the board is empty to begin with', (await a.locator('#leaderboard-body .lb-row').count()) === 0);
shared.scores = [{ user_id: idC, username: 'carol_c', game: 'duel', day: '2026-01-01', score: 900 }];
shared.emitChange('leaderboard_daily', 'UPDATE', { user_id: idC, score: 900, updated_at: new Date().toISOString() });
check('C\'s score is on A\'s board within seconds', await until(async () => /carol_c/.test(await a.locator('#leaderboard-body').textContent()) && /900/.test(await a.locator('#leaderboard-body').textContent())), (await a.locator('#leaderboard-body').textContent()).slice(0, 120));

/* --- a French Wikdle ------------------------------------------------------------------- */
section('un Wikdle en français');
const f = await newPlayer('F', { language: 'fr' });
await gate(f, 'fanny@example.com', 'fanny_f');
await viaDrawer(f, 'games');
await f.locator('.game-tile', { hasText: /wikdle/i }).first().click();
await f.waitForTimeout(1500);
const keys = await f.locator('#screen-wikdle .wikdle-key').allTextContents();
check('the keyboard is an AZERTY of 28 keys', keys.length === 28 && keys[0] === 'a' && keys[1] === 'z', keys.join(''));
const key = async (k) => { await f.locator(`#screen-wikdle .wikdle-key[data-key="${k}"]`).dispatchEvent('pointerdown'); await f.waitForTimeout(30); };
for (const k of 'zzzzz') await key(k);
await key('enter');
await f.waitForTimeout(500);
check('a non-word is refused in French too', /mot/i.test(await f.locator('#screen-wikdle .wikdle-status').textContent()), await f.locator('#screen-wikdle .wikdle-status').textContent());
for (let i = 0; i < 5; i++) await key('back');
for (const k of 'ecole') await key(k);
await key('enter');
await f.waitForTimeout(900);
check('"ecole" is a French word and plays a row', (await f.locator('#screen-wikdle [data-row="0"] .wikdle-cell.is-hit, #screen-wikdle [data-row="0"] .wikdle-cell.is-near, #screen-wikdle [data-row="0"] .wikdle-cell.is-miss').count()) === 5);
check('the hint, once taken, comes from the encyclopaedia', await (async () => {
  await f.locator('#screen-wikdle .wikdle-hint-btn').click();
  await f.waitForTimeout(1200);
  const label = await f.locator('#screen-wikdle .wikdle-hint b').first().textContent().catch(() => '');
  return /wikip/i.test(label) || /article/i.test(label) || /lettre/i.test(label);
})(), await f.locator('#screen-wikdle .wikdle-hints').textContent());
check('the article link is the French encyclopaedia', ((await f.evaluate(() => localStorage.getItem('wikster.language'))) === 'fr'));

console.log(errors.length ? `\nERRORS:\n${errors.join('\n')}` : '\nno page errors');
console.log(fails ? `\n${fails} FAILURES` : '\nALL PASS');
await browser.close();
process.exit(fails ? 1 : 0);
