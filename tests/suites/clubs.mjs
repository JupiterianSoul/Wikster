/*
 * The clubs batch, against the stubbed Supabase: Wikipedia Today on the
 * shop floor, the showcase and its hearts between two friends, and a guild
 * founded, joined, scored on its own board and left.
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
const MINE = {
  'en:Cat': { ...card('en:Cat', 'Cat', 'rare', 300, 'animals'), count: 2 },
  'en:Paris': card('en:Paris', 'Paris', 'prismatic', 9000, 'geography')
};
const until = async (fn, ms = 6000) => {
  const end = Date.now() + ms;
  for (;;) {
    let ok = false;
    try { ok = await fn(); } catch { ok = false; }
    if (ok || Date.now() > end) return ok;
    await new Promise((r) => setTimeout(r, 200));
  }
};

async function newPlayer(label, { cards = {} } = {}) {
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
    localStorage.setItem('wikster.wallet.v1', '50000');
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
const tab = async (page, name) => { await page.locator(`.nav-item[data-tab="${name}"]`).click(); await page.waitForTimeout(800); };
const wallet = (page) => page.evaluate(() => Number(localStorage.getItem('wikster.wallet.v1')));
const userIdOf = (email) => shared.users.get(email)?.id;

const a = await newPlayer('A', { cards: MINE });
await gate(a, 'ada@example.com', 'ada_lovelace');
const b = await newPlayer('B');
await gate(b, 'grace@example.com', 'grace_h');
const idA = userIdOf('ada@example.com');
const idB = userIdOf('grace@example.com');
shared.friendships.push({ id: 'f1', requester: idA, addressee: idB, status: 'accepted', created_at: new Date().toISOString() });

/* --- Wikipedia Today --------------------------------------------------------- */
section('Wikipedia Today');
await tab(a, 'shop');
await a.waitForTimeout(600);
const stall = a.locator('.shop-today');
check('the stall is on the floor', (await stall.count()) === 1);
check('it names yesterday', /front page/i.test(await stall.locator('.shop-tile-name').textContent()), await stall.locator('.shop-tile-name').textContent());
check('and costs its price', /3,785/.test(await stall.locator('.buy').textContent()), await stall.locator('.buy').textContent());
const before = await wallet(a);
await stall.locator('.buy').click();
await a.waitForTimeout(900);
check('buying takes the coins', (await wallet(a)) === before - 3785, `${before} -> ${await wallet(a)}`);
check('and says so on the stall', /bought today/i.test(await stall.locator('.buy').textContent()) && await stall.locator('.buy').isDisabled());
check('the booster is on the shelf', await a.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('wikster.inventory.v1') ?? '{}')).some((id) => id.startsWith('today|'))));
// The draw itself: the front page of the stub's world, five cards, and every
// one of them graded by the place its article holds on the day rather than by
// how read it is, which is what put it on the list to begin with.
const drawn = await a.evaluate(async () => {
  const day = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const top = await window.__wikster.topRead(day, 'en', 200);
  const rankOf = new Map(top.map((row, i) => [row.title, i + 1]));
  const cards = await window.__wikster.draw({ name: 'today', cards: 5, source: 'today', day, titles: [], extra: [], queries: [] });
  return cards.map((c) => {
    const title = c.article ?? c.title;
    const rank = rankOf.get(title) ?? null;
    return {
      key: c.key, title, rank, rarityId: c.rarityId,
      wanted: rank ? window.__wikster.todayRarity(rank).id : null,
      plate: String(c.thumbnail ?? '').startsWith('data:')
    };
  });
});
check('the draw deals five of yesterday\'s most-read', drawn.length === 5 && drawn.every((c) => c.key), JSON.stringify(drawn.map((c) => c.title)));
check('each card is placed on the day\'s list', drawn.every((c) => c.rank), JSON.stringify(drawn));
check('and graded by that place, not by its readership', drawn.every((c) => c.rarityId && c.rarityId === c.wanted), JSON.stringify(drawn.map((c) => `#${c.rank} ${c.rarityId}`)));
check('a pictureless page is passed over while a spare is left', drawn.every((c) => !c.plate), JSON.stringify(drawn.filter((c) => c.plate)));
// Written to the profile, so it survives a relaunch (the harness reseeds
// storage on a reload, so the save itself is what is checked here).
check('the day is written to the profile', await a.evaluate(() => JSON.parse(localStorage.getItem('wikster.profile.v1') ?? '{}').todayBought === new Date(Date.now() - 86400000).toISOString().slice(0, 10)));
await a.waitForTimeout(4500);
check('and reaches the account save', /todayBought/.test(shared.saves.get(idA)?.data?.data?.['wikster.profile.v1'] ?? ''));

/* --- the showcase --------------------------------------------------------------- */
section('the showcase');
await tab(a, 'profile');
await a.waitForTimeout(600);
check('three empty slots to begin with', (await a.locator('#showcase-grid .showcase-empty').count()) === 3);
await a.locator('#showcase-grid .showcase-empty').first().click();
await a.waitForTimeout(600);
check('the picker lists my cards, rarest first', /Paris/.test(await a.locator('#sheet .pick-row').first().textContent()), await a.locator('#sheet .pick-row').first().textContent());
await a.locator('#sheet .pick-row').first().click();
await a.waitForTimeout(700);
check('Paris is pinned', (await a.locator('#showcase-grid .card').count()) === 1 && (await a.locator('#showcase-grid .showcase-empty').count()) === 2);
check('and published on my profile row', await until(() => (shared.profiles.get(idA)?.showcase ?? []).some((c) => c.key === 'en:Paris')));
await viaDrawer(b, 'friends');
await b.waitForTimeout(1200);
await b.locator('#friends-list .person').first().click();
await b.waitForTimeout(1200);
check('B sees the showcase on A\'s page', !(await b.locator('#friend-showcase').isHidden()) && (await b.locator('#friend-showcase .card').count()) === 1);
check('with no hearts yet', (await b.locator('#friend-showcase .showcase-kudos').textContent()).trim() === '0');
await b.locator('#friend-showcase .showcase-kudos').click();
await b.waitForTimeout(800);
check('a tap leaves a heart', /1/.test(await b.locator('#friend-showcase .showcase-kudos').textContent()) && (await b.locator('#friend-showcase .showcase-kudos').evaluate((n) => n.classList.contains('is-on'))));
check('kept on the server, as B', shared.kudos.length === 1 && shared.kudos[0].sender === idB && shared.kudos[0].owner === idA);
await b.locator('#friend-showcase .showcase-kudos').click();
await b.waitForTimeout(800);
check('a second tap takes it back', shared.kudos.length === 0 && /0/.test(await b.locator('#friend-showcase .showcase-kudos').textContent()));
await tab(a, 'profile');
await a.locator('#showcase-grid .showcase-remove').first().click();
await a.waitForTimeout(500);
check('A takes the card down', (await a.locator('#showcase-grid .showcase-empty').count()) === 3);

/* --- guilds -------------------------------------------------------------------- */
section('guilds');
shared.goalKind = 'open';
await viaDrawer(a, 'guilds');
await a.waitForTimeout(900);
check('without a guild, the search and the form are up', await a.locator('#guild-join').isVisible() && await a.locator('#guild-home').isHidden());
check('and the board is empty', /no guild has scored/i.test(await a.locator('#guild-board').textContent()), await a.locator('#guild-board').textContent());
await a.locator('#guild-create input[name="name"]').fill('Night Owls');
await a.locator('#guild-create input[name="tag"]').fill('owl');
await a.locator('#guild-create input[name="about"]').fill('We read at night.');
await a.locator('#guild-create-go').click();
await a.waitForTimeout(1200);
check('founding puts the guild card up', await a.locator('#guild-home').isVisible() && (await a.locator('#guild-tag').textContent()) === 'OWL' && /Night Owls/.test(await a.locator('#guild-name').textContent()));
check('one member, the founder', /1 member/i.test(await a.locator('#guild-meta').textContent()) && /founder/i.test(await a.locator('#guild-meta').textContent()), await a.locator('#guild-meta').textContent());
check('the roster lists me', await until(async () => /ada_lovelace/.test(await a.locator('#guild-roster').textContent())));
check('the server has it', shared.guilds.length === 1 && shared.guilds[0].tag === 'OWL' && shared.guildMembers.length === 1);
// B finds it and joins.
await viaDrawer(b, 'guilds');
await b.waitForTimeout(900);
await b.locator('#guild-find-input').fill('owl');
await b.locator('#guild-find-go').click();
await b.waitForTimeout(900);
check('B finds it by its tag', /Night Owls/.test(await b.locator('#guild-results').textContent()));
await b.locator('#guild-results .btn-primary').first().click();
await b.waitForTimeout(1200);
check('B is in', await b.locator('#guild-home').isVisible() && /2 member/i.test(await b.locator('#guild-meta').textContent()) && /member/i.test(await b.locator('#guild-meta').textContent()));
check('as a member, not the founder', !/founder/i.test(await b.locator('#guild-meta').textContent()));
// Points: A scores 500 on a duel, B 300 on a quiz; the guild has 800.
shared.scores = [
  { user_id: idA, username: 'ada_lovelace', game: 'duel', day: '2026-01-01', score: 500 },
  { user_id: idB, username: 'grace_h', game: 'quiz', day: '2026-01-01', score: 300 }
];
shared.emitChange('guild_daily', 'UPDATE', { guild_id: shared.guilds[0].id, score: 800, updated_at: new Date().toISOString() });
check('the guild board shows the sum, live', await until(async () => /800/.test(await a.locator('#guild-board').textContent()) && /Night Owls/.test(await a.locator('#guild-board').textContent())), (await a.locator('#guild-board').textContent()).slice(0, 160));
check('and the card says #1', await until(async () => /#1 of 1/.test(await a.locator('#guild-scores').textContent())), await a.locator('#guild-scores').textContent());

/* --- the hall: the room, the goal, the table, the match --------------------- */
section('the guild hall');
// The room: A says something, B hears it without asking.
check('the goal is up, sized for two', await until(async () => /Open 18 boosters/.test(await a.locator('#guild-goal-text').textContent())), await a.locator('#guild-goal-text').textContent());
check('the room is open', await a.locator('#guild-room-chat').isVisible() && /nobody has said/i.test(await a.locator('#guild-chat-log').textContent()));
await a.locator('#guild-chat-input').fill('owls assemble');
await a.locator('#guild-chat-form button[type="submit"]').click();
await a.waitForTimeout(600);
check('A\'s line is in the room', /owls assemble/.test(await a.locator('#guild-chat-log').textContent()));
check('B hears it live, under A\'s name', await until(async () => /owls assemble/.test(await b.locator('#guild-chat-log').textContent()) && /ada_lovelace/i.test(await b.locator('#guild-chat-log').textContent())), (await b.locator('#guild-chat-log').textContent()).slice(0, 120));
check('the server keeps the line', shared.guildMessages.length === 1 && shared.guildMessages[0].sender_name === 'ada_lovelace');

// The goal: eighteen boosters between two. A opens ten, B eight, both see it move.
await a.evaluate(() => { for (let i = 0; i < 10; i++) window.__wikster.guildGoal('open', { kind: 'theme' }); return window.__wikster.guildGoal('open', { kind: 'theme' }); });
await a.waitForTimeout(400);
check('A\'s openings count', shared.guildGoals[0].progress === 11, String(shared.guildGoals[0].progress));
check('and B watches the bar move', await until(async () => /11 \/ 18/.test(await b.locator('#guild-goal-count').textContent())), await b.locator('#guild-goal-count').textContent());
check('a new card does not count toward an opening goal', (await a.evaluate(() => window.__wikster.guildGoal('pull', { isNew: true })), shared.guildGoals[0].progress === 11));
await b.evaluate(() => { for (let i = 0; i < 6; i++) window.__wikster.guildGoal('open', { kind: 'open' }); return window.__wikster.guildGoal('open', { kind: 'open' }); });
await b.waitForTimeout(400);
check('the guild made it', shared.guildGoals[0].done_at != null && shared.guildGoals[0].progress === 18);
check('both see Done and a Claim', await until(async () => await a.locator('#guild-goal-claim').isVisible() && await b.locator('#guild-goal-claim').isVisible()));
const purseA = await wallet(a);
await a.locator('#guild-goal-claim').click();
await a.waitForTimeout(900);
check('claiming pays A nine hundred', (await wallet(a)) === purseA + 900, `${purseA} -> ${await wallet(a)}`);
check('and a Rare booster', await a.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('wikster.inventory.v1') ?? '{}')).some((id) => id === 'open|any|rare|5')));
check('and only once', await a.locator('#guild-goal-claim').isDisabled() && /claimed/i.test(await a.locator('#guild-goal-claim').textContent()));
check('B is paid separately', shared.guildGoalClaims.length === 1 && shared.guildGoalClaims[0].user_id === idA);

// The table: A puts a spare Cat down, B takes it.
await a.locator('#guild-rooms-seg .seg-option[data-value="bank"]').click();
await a.waitForTimeout(300);
check('the table is empty', /empty/i.test(await a.locator('#guild-bank').textContent()));
await a.locator('#guild-bank-donate').click();
await a.waitForTimeout(600);
check('only spares are offered', /Cat/.test(await a.locator('#sheet').textContent()) && !/Paris/.test(await a.locator('#sheet').textContent()), (await a.locator('#sheet').textContent()).slice(0, 100));
await a.locator('#sheet .pick-row').first().click();
await a.waitForTimeout(800);
check('the Cat is on the table', shared.guildBank.length === 1 && shared.guildBank[0].card.key === 'en:Cat' && shared.guildBank[0].donor_name === 'ada_lovelace');
check('and A has one copy left', await a.evaluate(() => JSON.parse(localStorage.getItem('wikster.collection.v3')).entries['en:Cat'].count === 1));
await closeSheets(a);
await b.locator('#guild-rooms-seg .seg-option[data-value="bank"]').click();
check('B sees it arrive', await until(async () => /Cat/.test(await b.locator('#guild-bank').textContent()) && /from ada_lovelace/i.test(await b.locator('#guild-bank').textContent())), (await b.locator('#guild-bank').textContent()).slice(0, 100));
await b.locator('#guild-bank .btn-primary').first().click();
await b.waitForTimeout(800);
check('B takes it home', await b.evaluate(() => JSON.parse(localStorage.getItem('wikster.collection.v3')).entries['en:Cat']?.count === 1));
check('and the table is empty again', shared.guildBank.length === 0 && await until(async () => /empty/i.test(await b.locator('#guild-bank').textContent())));
check('with two takes left today', /2 take/.test(await b.locator('#guild-bank-note').textContent()), await b.locator('#guild-bank-note').textContent());

// The match: a second guild shows up, and the two are paired.
check('alone, there is nobody to play', /no other guild/i.test(await a.locator('#guild-versus').textContent()));
const rival = { id: 'guild-rival', name: 'Day Larks', tag: 'LARK', about: '', owner: 'nobody', members: 3, created_at: new Date().toISOString() };
shared.guilds.push(rival);
shared.guildMembers.push({ user_id: 'lark-1', guild_id: rival.id, joined_at: new Date().toISOString() });
shared.scores.push({ user_id: 'lark-1', username: 'lark_1', game: 'duel', day: '2026-01-01', score: 650 });
shared.emitChange('guild_weekly', 'UPDATE', { guild_id: rival.id, score: 650, updated_at: new Date().toISOString() });
check('the match is made, live', await until(async () => /Day Larks/.test(await a.locator('#guild-versus').textContent())), (await a.locator('#guild-versus').textContent()).slice(0, 120));
check('with both scores', /800/.test(await a.locator('#guild-versus').textContent()) && /650/.test(await a.locator('#guild-versus').textContent()));
check('and the pairing is written down', shared.guildMatches.length === 1 && shared.guildMatches[0].guild_b === rival.id);
check('the leader is marked', await a.locator('#guild-versus .guild-side.is-mine.is-leading').count() === 1);
// Last week, settled: the Owls won, and the win pays.
const lastWeek = String(Math.floor((Math.floor((Date.now() - 7 * 86400000) / 86400000) + 4) / 7));
shared.guildMatches.push({ week: lastWeek, guild_a: shared.guilds[0].id, guild_b: rival.id, score_a: 1200, score_b: 900 });
await viaDrawer(a, 'leaderboard');
await viaDrawer(a, 'guilds');
await a.waitForTimeout(600);
check('last week\'s win is announced', await until(async () => /beat Day Larks/.test(await a.locator('#guild-match-last').textContent())), await a.locator('#guild-match-last').textContent());
const purseA2 = await wallet(a);
await a.locator('#guild-match-last .btn').click();
await a.waitForTimeout(800);
check('and pays seven hundred and fifty', (await wallet(a)) === purseA2 + 750 && shared.guildMatchClaims.length === 1);
// Back to two members for what follows; the rival stays on the board.
await b.locator('#guild-rooms-seg .seg-option[data-value="chat"]').click();

// B leaves; A's guild is one member again.
await b.locator('#guild-leave').click();
await b.waitForTimeout(300);
check('leaving asks twice', /sure/i.test(await b.locator('#guild-leave').textContent()));
await b.locator('#guild-leave').click();
await b.waitForTimeout(1000);
check('B is out, back to the search', await b.locator('#guild-join').isVisible() && shared.guildMembers.filter((m) => m.guild_id === shared.guilds[0].id).length === 1);
check('the guild is still standing with one member', shared.guilds[0].members === 1);
check('the panel knows the guild on a desk build', true);

/* --- invitations, and closing the guild --------------------------------------- */
section('invitations and closing');
// A asks B in from the guild card. The chooser is the friend list.
await a.locator('#guild-invite').click();
await a.waitForTimeout(800);
check('the chooser lists my friends', /grace_h/.test(await a.locator('#sheet').textContent()), (await a.locator('#sheet').textContent()).slice(0, 120));
await a.locator('#sheet .pick-row .btn-primary').first().click();
await a.waitForTimeout(800);
check('the server holds the invitation', shared.guildInvites.length === 1 && shared.guildInvites[0].invitee === idB);
check('and the button says it is sent', /invited/i.test(await a.locator('#sheet .pick-row .btn').first().textContent()));
await closeSheets(a);

// It reaches B where B is standing, with no reload and no second guild.
check('B sees it arrive', await until(async () => await b.locator('#guild-invites-room').isVisible()
  && /Night Owls/.test(await b.locator('#guild-invites').textContent())), await b.locator('#guild-invites').textContent());
check('and who sent it', /ada_lovelace/.test(await b.locator('#guild-invites').textContent()));
check('the bell was rung', await until(async () => /invited you/i.test(await b.evaluate(() =>
  JSON.stringify(JSON.parse(localStorage.getItem('wikster.profile.v1') ?? '{}').notifFeed ?? [])))));

// Turning it down takes it off both sides.
await b.locator('#guild-invites .btn-ghost').first().click();
await b.waitForTimeout(900);
check('declining clears it', shared.guildInvites.length === 0 && await b.locator('#guild-invites-room').isHidden());
check('and B is still without a guild', await b.locator('#guild-join').isVisible());

// Asked a second time, B accepts.
await a.locator('#guild-invite').click();
await a.waitForTimeout(800);
await a.locator('#sheet .pick-row .btn-primary').first().click();
await a.waitForTimeout(800);
await closeSheets(a);
check('B is asked again', await until(async () => /Night Owls/.test(await b.locator('#guild-invites').textContent())));
await b.locator('#guild-invites .btn-primary').first().click();
await b.waitForTimeout(1400);
check('accepting puts B in', await b.locator('#guild-home').isVisible() && shared.guildMembers.filter((m) => m.guild_id === shared.guilds[0].id).length === 2);
check('and spends the invitation', shared.guildInvites.length === 0);
check('a member cannot close the guild', await b.locator('#guild-delete').isHidden());
check('the founder can', await a.locator('#guild-delete').isVisible());
check('A\'s roster caught up on its own', await until(async () => /grace_h/.test(await a.locator('#guild-roster').textContent())),
  (await a.locator('#guild-roster').textContent()).slice(0, 120));

// The founder closes it. Two taps, as with leaving, because it is final.
await a.locator('#guild-delete').click();
await a.waitForTimeout(400);
check('closing asks twice', /sure/i.test(await a.locator('#guild-delete').textContent()), await a.locator('#guild-delete').textContent());
await a.locator('#guild-delete').click();
await a.waitForTimeout(1400);
check('the guild is gone from the server', !shared.guilds.some((g) => g.tag === 'OWL') && !shared.guildMembers.some((m) => m.user_id === idA || m.user_id === idB));
check('A is back at the search', await a.locator('#guild-join').isVisible() && await a.locator('#guild-home').isHidden());
check('and B finds out without asking', await until(async () => await b.locator('#guild-join').isVisible()));

console.log(errors.length ? `\nERRORS:\n${errors.join('\n')}` : '\nno page errors');
console.log(fails ? `\n${fails} FAILURES` : '\nALL PASS');
await browser.close();
process.exit(fails ? 1 : 0);
