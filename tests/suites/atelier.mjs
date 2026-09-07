/*
 * The Atelier and Ink, offline: the purse in the app bar, the counter, a
 * theme, a frame and an effect bought and then worn from Customization, a
 * card wearing the effect, a level paying Ink, and the help.
 */
import { chromium, devices } from 'playwright';
import { launchOptions } from '../lib/browser.mjs';
import { installStubs } from '../lib/stubs.mjs';
import { EXCHANGE_RATE, FRAME_PRICE, THEME_PRICE, fxPrice, inkForLevel } from '../../src/ink.js';
import { RELEASES } from '../../src/data/releases.js';
import { ALL_FX } from '../../src/data/fx.js';

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
  localStorage.setItem('wikster.cardFx.v1', JSON.stringify({ rare: 'tide' }));
  // Last here two releases ago: the what's-new sheet has something to say.
  localStorage.setItem('wikster.seenRelease.v1', 'seasons');
});
await p.goto((process.env.BASE_URL ?? 'http://127.0.0.1:4173/'), { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(2400);
section('what is new');
const sawNew = await (async () => { for (let i = 0; i < 20; i++) { if (/What.s new/i.test(await p.locator('#sheet-title').textContent().catch(() => ''))) return true; await p.waitForTimeout(400); } return false; })();
check('the what\'s-new sheet opens for a returning device', sawNew, await p.locator('#sheet-title').textContent().catch(() => ''));
check('it lists the releases missed, newest first, three at most', (await p.locator('#sheet .whatsnew-item').count()) === 3 && new RegExp(RELEASES.at(-1).title.en, 'i').test(await p.locator('#sheet .whatsnew-item').first().textContent()), await p.locator('#sheet .whatsnew-item').first().textContent());
await p.locator('#sheet .whatsnew .btn-primary').click();
await p.waitForTimeout(900);
check('the patch-notes button lands on the Updates screen', await p.locator('#screen-updates').isVisible());
check('and the device is marked up to date', (await p.evaluate(() => localStorage.getItem('wikster.seenRelease.v1'))) === RELEASES.at(-1).id);
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
// Ink left the purse and became its own button beside the menu: two numbers
// in one chip made it too wide to sit in the middle of the bar.
check('Ink has its own button in the app bar', await p.locator('#ink-btn .ink-drop').count() === 1);
check('and the purse carries the coins alone', !(await p.locator('#wallet-ink').count()));
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
// The count comes from the table, not a number written here, so the shelf and
// the catalogue cannot drift apart: two for most tiers, four for Prismatic.
const BOUGHT = ALL_FX.length - 1;
check('every board design is on the shelf, on its own tier',
  await p.locator('#atelier-fx .fx-chip').count() === BOUGHT && await p.locator('#atelier-fx .fx-tier').count() === 8, String(BOUGHT));
check('every effect is its own name', await p.evaluate((n) => new Set([...document.querySelectorAll('#atelier-fx .fx-chip-name')].map((x) => x.textContent)).size === n, BOUGHT));
check('and each is shown on a card of its tier',
  await p.locator('#atelier-fx .fx-chip .fx-sample').count() === BOUGHT);
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
const rareChip = p.locator('#atelier-fx .fx-chip[data-fx="deepcurrent"]');
await rareChip.locator('.atelier-buy').click();
await p.waitForTimeout(800);
check('an effect costs its rarity\'s price', (await inkHeld()) === 450 - THEME_PRICE - FRAME_PRICE - fxPrice('rare'));
check('and is owned for that rarity', (await profile()).owned?.fx?.includes('rare:deepcurrent'));
check('the wear button on the effect is there', /wear/i.test(await rareChip.locator('.atelier-buy').textContent()));
await rareChip.locator('.atelier-buy').click();
await p.waitForTimeout(600);
check('wearing it from the shelf works', await p.evaluate(() => window.__wikster.state.cardFx.rare === 'deepcurrent'));
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
/* Two cards of the same tier, one plain and one dressed, read side by side:
   what a treatment has to do is look different from the tier it replaces. */
const worn = await p.evaluate(() => {
  const rare = window.__wikster.RARITIES.find((r) => r.id === 'rare');
  const build = (fx) => {
    const card = document.createElement('div');
    card.className = 'card is-lit';
    card.innerHTML = '<div class="card-inner"><div class="card-face card-front">'
      + '<div class="fx fx-a"></div><div class="card-art"></div><div class="fx-p"></div>'
      + '<div class="fx fx-b"></div><div class="fx fx-c"></div><div class="fx fx-v"></div>'
      + '<div class="fx-ring"></div></div></div>';
    document.body.appendChild(card);
    card.dataset.rarity = 'rare';
    card.style.setProperty('--rarity', rare.color);
    if (fx) card.dataset.fx = fx;
    const front = card.querySelector('.card-front');
    const read = () => ({
      plate: getComputedStyle(front).backgroundImage,
      sheen: getComputedStyle(card.querySelector('.fx-b')).backgroundImage,
      anim: getComputedStyle(card.querySelector('.fx-b')).animationName,
      // A treatment may restyle everything except the article's picture.
      artZ: getComputedStyle(card.querySelector('.card-art')).zIndex,
      // The ring is a border because a mask cuts its middle out; lose that and
      // it floods the whole face.
      ringMask: getComputedStyle(card.querySelector('.fx-ring')).maskImage
    });
    const out = read();
    card.remove();
    return out;
  };
  return { plain: build(null), dressed: build(window.__wikster.state.cardFx.rare), fx: window.__wikster.state.cardFx.rare };
});
check('a rare card carries the effect', worn.fx === 'deepcurrent', JSON.stringify(worn.fx));
check('the treatment paints and moves', /gradient/.test(worn.dressed.sheen) && /^bx-/.test(worn.dressed.anim), JSON.stringify(worn.dressed.anim));
check('and the picture stays above every layer it draws', Number(worn.dressed.artZ) > Number(worn.plain.artZ) || worn.dressed.artZ === '6', `${worn.plain.artZ} -> ${worn.dressed.artZ}`);
check('the tier\'s own plate steps aside', worn.dressed.plate !== worn.plain.plate, `${worn.plain.plate.slice(0, 40)} vs ${worn.dressed.plate.slice(0, 40)}`);
check('and the ring is still a ring, not a flood', /gradient/.test(worn.dressed.ringMask), worn.dressed.ringMask.slice(0, 60));

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
