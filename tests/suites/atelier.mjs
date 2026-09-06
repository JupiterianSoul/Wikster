/*
 * The Atelier and Ink, offline: the purse in the app bar, the counter, a
 * theme, a frame and an effect bought and then worn from Customization, a
 * card wearing the effect, a level paying Ink, and the help.
 */
import { chromium, devices } from 'playwright';
import { launchOptions } from '../lib/browser.mjs';
import { installStubs } from '../lib/stubs.mjs';
import { EXCHANGE_RATE, FRAME_PRICE, THEME_PRICE, fxPrice, inkForLevel } from '../../src/ink.js';

let fails = 0;
const check = (l, c, e = '') => { if (!c) fails++; console.log(`${c ? 'PASS' : 'FAIL'}  ${l}${e ? '  ' + e : ''}`); };
const section = (s) => console.log(`\n== ${s}`);
const b = await chromium.launch(launchOptions());
const ctx = await b.newContext({ serviceWorkers: 'block', ...devices['Pixel 7'] });
const p = await ctx.newPage(); installStubs(p);
const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
await p.addInitScript(() => {
  localStorage.setItem('wikster.language', 'en');
  const now = Date.now();
  localStorage.setItem('wikster.profile.v1', JSON.stringify({ started: true, createdAt: now, playMs: 0, boostersOpened: 6, rarityCounts: {}, progress: { level: 12, xp: 0 }, pendingLevels: [], daily: { lastDay: Math.floor(now / 86400000), shownDay: Math.floor(now / 86400000), claimed: 1, board: 0 }, timed: { count: 0, stamp: now }, freeTaken: { window: 0, ids: [] } }));
  localStorage.setItem('wikster.wallet.v1', '20000');
  // A stale choice from before the table was redrawn: it must read as classic.
  localStorage.setItem('wikster.cardFx.v1', JSON.stringify({ rare: 'sheen' }));
});
await p.goto((process.env.BASE_URL ?? 'http://127.0.0.1:4173/'), { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(2400);
const closeSheets = async () => { for (let i = 0; i < 8; i++) {
  if (!(await p.locator('#sheet').isVisible().catch(() => false))) return;
  if (await p.locator('#sheet-close').isVisible()) await p.locator('#sheet-close').click();
  else await p.locator('#sheet .btn-primary').click().catch(() => 0);
  await p.waitForTimeout(380); } };
await closeSheets();
const drawer = async (link) => {
  for (let i = 0; i < 5; i++) {
    if (await p.locator('#drawer.is-open').count()) break;
    await p.evaluate(() => document.querySelector('.appbar .icon-btn')?.click());
    await p.waitForTimeout(420);
  }
  await p.locator(`.drawer-link[data-link="${link}"]`).click();
  await p.waitForTimeout(900);
};
const inkHeld = () => p.evaluate(() => Number(localStorage.getItem('wikster.ink.v1') ?? 0));
const wallet = () => p.evaluate(() => Number(localStorage.getItem('wikster.wallet.v1')));
const profile = () => p.evaluate(() => JSON.parse(localStorage.getItem('wikster.profile.v1') ?? '{}'));

section('the purse');
check('a fresh save holds no Ink', (await inkHeld()) === 0);
check('the app bar shows it beside the coins', /0/.test(await p.locator('#wallet-ink').textContent()) && await p.locator('#wallet-ink .ink-drop').count() === 1);
check('a stale effect choice reads as classic', await p.evaluate(() => Object.keys(window.__wikster.state.cardFx).length === 0));
await p.locator('#wallet').click();
await p.waitForTimeout(700);
check('the wallet sheet has an Ink line', /Ink/.test(await p.locator('#sheet [data-ink-t]').textContent()));
await p.locator('#sheet [data-ink-go]').click();
await p.waitForTimeout(700);
check('and opens the Ink sheet', /Atelier/.test(await p.locator('#sheet-body').textContent()));
await closeSheets();

section('the atelier');
await drawer('atelier');
check('the screen opens from the drawer', await p.locator('#screen-atelier').isVisible());
check('it sits under the shop tab', await p.evaluate(() => document.querySelector('.nav-item.is-active')?.dataset.tab) === 'shop');
check('nine themes on the shelf', await p.locator('#atelier-themes .theme-card').count() === 9);
check('no season or code theme among them', await p.evaluate(() => ![...document.querySelectorAll('#atelier-themes .theme-card')].some((c) => /apotheosis|hellfire|frost|yule|rire/.test(c.dataset.theme))));
check('ten frames on the shelf', await p.locator('#atelier-frames .frame-card').count() === 10);
check('forty effects, five a rarity', await p.locator('#atelier-fx .fx-chip').count() === 40 && await p.locator('#atelier-fx .fx-tier').count() === 8);
check('every effect is its own name', await p.evaluate(() => new Set([...document.querySelectorAll('#atelier-fx .fx-chip-name')].map((n) => n.textContent)).size === 40));
check('prices are in Ink', await p.locator('#atelier-themes .atelier-buy .ink-drop').count() === 9);
check('and dim while the purse is short', await p.locator('#atelier-themes .atelier-buy.is-short').count() === 9);
await p.locator('#atelier-themes .theme-card[data-theme="paper"] .atelier-buy').click();
await p.waitForTimeout(700);
check('buying short opens the counter instead', /counter/i.test(await p.locator('#sheet-title').textContent()), await p.locator('#sheet-title').textContent());
check('the counter offers one, ten and fifty', await p.locator('#sheet .row').count() === 3);
const coinsBefore = await wallet();
await p.locator('#sheet .row').nth(2).locator('button').click();
await p.waitForTimeout(600);
check('fifty Ink cost fifty times the rate', (await wallet()) === coinsBefore - 50 * EXCHANGE_RATE && (await inkHeld()) === 50, `${coinsBefore} -> ${await wallet()}, ink ${await inkHeld()}`);
await closeSheets();
await p.evaluate(() => window.__wikster.grantInk(400));
await p.waitForTimeout(300);
check('the banner follows the purse', /450/.test(await p.locator('#atelier-purse').textContent()), await p.locator('#atelier-purse').textContent());

section('buying');
await p.locator('#atelier-themes .theme-card[data-theme="paper"] .atelier-buy').click();
await p.waitForTimeout(800);
check('a theme costs its price', (await inkHeld()) === 450 - THEME_PRICE);
check('and is owned', (await profile()).owned?.themes?.includes('paper'));
check('the tile now offers to wear it', /wear/i.test(await p.locator('#atelier-themes .theme-card[data-theme="paper"] .atelier-buy').textContent()));
await p.locator('#atelier-frames .frame-card[data-frame="comet"] .atelier-buy').click();
await p.waitForTimeout(800);
check('a frame costs its price', (await inkHeld()) === 450 - THEME_PRICE - FRAME_PRICE);
check('and is owned', (await profile()).owned?.frames?.includes('comet'));
const rareChip = p.locator('#atelier-fx .fx-chip[data-fx="tide"]');
await rareChip.locator('.atelier-buy').click();
await p.waitForTimeout(800);
check('an effect costs its rarity\'s price', (await inkHeld()) === 450 - THEME_PRICE - FRAME_PRICE - fxPrice('rare'));
check('and is owned for that rarity', (await profile()).owned?.fx?.includes('rare:tide'));
check('the wear button on the effect is there', /wear/i.test(await rareChip.locator('.atelier-buy').textContent()));
await rareChip.locator('.atelier-buy').click();
await p.waitForTimeout(600);
check('wearing it from the shelf works', await p.evaluate(() => window.__wikster.state.cardFx.rare === 'tide'));
check('the shelf marks it worn', /worn/i.test(await rareChip.locator('.atelier-buy').textContent()));

section('customization');
await drawer('customize');
check('the bought theme is in the picker', await p.locator('#theme-grid .theme-card[data-theme="paper"]').count() === 1);
check('the others still are not', await p.locator('#theme-grid .theme-card').count() === 2);
check('the bought frame is in the picker, unlocked', await p.locator('#frame-styles .frame-card[data-frame="comet"]').count() === 1 && await p.locator('#frame-styles .frame-card[data-frame="comet"].is-locked').count() === 0);
check('the other Atelier frames are not', await p.locator('#frame-styles .frame-card[data-frame="ivy"]').count() === 0);
check('the bought effect is a chip on its tier', await p.locator('#fx-tiers .fx-chip:not(.is-hint)').count() === 9);
check('the doorway to the Atelier is on the screen', await p.locator('#customize-door .row').count() === 1);
await p.locator('#frame-styles .frame-card[data-frame="comet"]').click();
await p.waitForTimeout(600);
check('the frame goes on', await p.evaluate(() => window.__wikster.store.loadFrameStyle()) === 'comet');
check('and the app bar draws it', await p.locator('#level-badge .frame-overlay .comet-orbit').count() >= 1);
await p.locator('#theme-grid .theme-card[data-theme="paper"]').click();
await p.waitForTimeout(700);
check('the theme goes on', await p.evaluate(() => document.documentElement.dataset.theme) === 'paper');
await p.evaluate(() => window.__wikster.setTheme('aurora'));

section('a card wearing it');
const worn = await p.evaluate(() => {
  const rare = window.__wikster.RARITIES.find((r) => r.id === 'rare');
  const card = document.createElement('div');
  card.className = 'card is-lit';
  card.innerHTML = `<div class="card-inner"><div class="card-face card-front"><div class="fx fx-a"></div><div class="card-art"></div><div class="fx-p"></div><div class="fx fx-b"></div><div class="fx-ring"></div></div></div>`;
  document.body.appendChild(card);
  window.__wikster.debugRarity('rare');
  card.dataset.rarity = 'rare'; card.style.setProperty('--rarity', rare.color);
  card.dataset.fx = window.__wikster.state.cardFx.rare;
  const plate = card.querySelector('.fx-p');
  const before = getComputedStyle(plate, '::before');
  const out = { fx: card.dataset.fx, height: before.height, anim: before.animationName, classicHidden: getComputedStyle(card.querySelector('.fx-b')).display };
  card.remove();
  return out;
});
check('a rare card carries the effect', worn.fx === 'tide', JSON.stringify(worn));
check('the effect paints and moves', worn.height !== 'auto' && worn.anim === 'fx-tide', JSON.stringify(worn));
check('the tier\'s own dressing steps aside', worn.classicHidden === 'none');

section('a level pays Ink');
const inkBefore = await inkHeld();
await p.evaluate(() => window.__wikster.addXp(100000));
await p.waitForTimeout(900);
check('the level sheet shows the Ink', await p.locator('#sheet .reward-ink').count() === 1);
await p.locator('#sheet .btn-primary').click();
await p.waitForTimeout(700);
check('claiming pays it', (await inkHeld()) === inkBefore + inkForLevel(13), `${inkBefore} -> ${await inkHeld()}`);
// That much XP is several levels; claim them all before going on.
for (let i = 0; i < 40 && await p.locator('#sheet').isVisible().catch(() => false); i++) { await closeSheets(); await p.waitForTimeout(200); }

section('help');
await drawer('atelier');
await p.evaluate(() => document.querySelector('#screen-atelier .help-btn')?.click());
await p.waitForTimeout(600);
check('the help sheet opens', /Atelier/.test(await p.locator('#sheet-title').textContent()) && await p.locator('#sheet .help-body').count() === 1);
await closeSheets();
await p.screenshot({ path: 'atelier.png', fullPage: false });

console.log(errs.length ? 'PAGE ERRORS: ' + errs.join('\n') : 'no page errors');
console.log(fails ? `${fails} FAILURES` : 'ALL PASS');
await b.close();
process.exit(fails ? 1 : 0);
