/**
 * THE ATELIER
 * ----------------------------------------------------------------------------
 * The shop for how things look: every theme that is not a season's or a
 * code's, ten frames no level hands out, and five alternate treatments for
 * each rarity. It takes Ink and nothing else, and Buckarooz can be pressed
 * into Ink at the counter for anyone in a hurry.
 *
 * Nothing bought here is worn from here: a purchase goes to the profile's
 * `owned` list and turns up in Customization, where the pickers are. The
 * "wear it" shortcuts on an owned tile do the same thing the picker would.
 */
import { t, tx } from '../i18n.js';
import { bump } from '../ledger.js';
import * as store from '../collection.js';
import { synth } from '../ui/sound.js';
import { iconSvg } from '../data/icons.js';
import { press } from '../ui/components.js';
import { DEFAULT_THEME, THEMES } from '../ui/themes.js';
import { INK_FRAMES, frameSvg, frameTier } from '../frames.js';
import { RARITIES } from '../data/rarities.js';
import { DEFAULT_FX, FX_BY_RARITY } from '../data/fx.js';
import {
  EXCHANGE_RATE, FRAME_PRICE, INK_DAILY_WEEK, INK_GUILD_GOAL, INK_GUILD_MATCH, THEME_PRICE,
  addInk, exchangeCost, fxPrice, grant, inkForLevel, ownsFrame, ownsFx, ownsTheme, spendInk
} from '../ink.js';
import { formatAmount } from '../pricing.js';
import { el, esc, ink, money, openSheet, refreshWallet, state, storedTheme, toast, useTheme } from './core.js';
import { live } from './live.js';
import { spawnBurst } from './open.js';
import { renderBinder } from './binder.js';
import { renderPacks } from './packs.js';
import { renderShop } from './shop.js';
import { fxSampleCard } from './fxcard.js';
import { frameStyle, pickFrameStyle } from './regalia.js';
import { wearFx } from './settings.js';

/** The themes on the Atelier's shelf: everything that is not a season's or a code's. */
export const ATELIER_THEMES = THEMES.filter((theme) => !theme.code && !theme.season && theme.id !== DEFAULT_THEME);

export function renderAtelier() {
  el.atelierTitle.textContent = t('tabAtelier');
  el.atelierLead.textContent = t('atelierLead');
  el.atelierPurseLabel.textContent = t('atelierPurse');
  el.atelierCoinsLabel.textContent = t('shopPurse');
  el.atelierPurse.innerHTML = ink(state.ink);
  el.atelierCoins.innerHTML = money(state.wallet);
  el.atelierExchange.textContent = t('atelierExchange');
  el.atelierThemesLabel.textContent = t('atelierThemes');
  el.atelierFramesLabel.textContent = t('atelierFrames');
  el.atelierFxLabel.textContent = t('atelierFx');
  el.atelierFxNote.textContent = t('atelierFxNote');
  if (!el.atelierExchange.dataset.wired) {
    el.atelierExchange.dataset.wired = '1';
    press(el.atelierExchange, { sound: null });
    el.atelierExchange.addEventListener('click', () => { synth.playTap(); openExchange(); });
  }
  paintThemes();
  paintFrames();
  paintFx();
}

/* --- the three shelves ---------------------------------------------------- */

function paintThemes() {
  const current = storedTheme();
  el.atelierThemes.replaceChildren(...ATELIER_THEMES.map((theme) => {
    const owned = ownsTheme(state.profile, theme.id);
    const card = document.createElement('div');
    card.className = `theme-card atelier-tile${owned ? ' is-owned' : ''}${theme.id === current ? ' is-on' : ''}`;
    card.dataset.theme = theme.id;
    card.innerHTML = `
      <span class="theme-swatch">${theme.swatch.map((c) => `<span style="background:${c}"></span>`).join('')}</span>
      <h4></h4><p></p>
      <span class="theme-check">${iconSvg('check', { size: 14 })}</span>`;
    card.querySelector('h4').textContent = tx(theme.name);
    card.querySelector('p').textContent = tx(theme.blurb);
    card.appendChild(priceButton({
      owned, price: THEME_PRICE, worn: theme.id === current,
      buy: () => buy('themes', theme.id, THEME_PRICE, tx(theme.name)),
      wear: () => { useTheme(theme.id, { announce: true }); renderPacks(); renderShop(); renderBinder(); renderAtelier(); }
    }));
    return card;
  }));
}

function paintFrames() {
  const level = state.profile.progress.level ?? 1;
  const tier = Math.max(1, frameTier(level));
  const wearing = frameStyle();
  el.atelierFrames.replaceChildren(...INK_FRAMES.map((style) => {
    const owned = ownsFrame(state.profile, style.id);
    const card = document.createElement('div');
    card.className = `frame-card atelier-tile${owned ? ' is-owned' : ''}${style.id === wearing ? ' is-on' : ''}`;
    card.dataset.frame = style.id;
    card.innerHTML = `
      <span class="frame-prev">
        <span class="frame-prev-core">${level}</span>
        <span class="frame-overlay" aria-hidden="true">${frameSvg(style.id, tier)}</span>
      </span>
      <span class="frame-copy"><h4></h4><small></small></span>
      <span class="theme-check">${iconSvg('check', { size: 14 })}</span>`;
    card.querySelector('h4').textContent = tx(style.name);
    card.querySelector('small').textContent = t('atelierFrameNote');
    card.appendChild(priceButton({
      owned, price: FRAME_PRICE, worn: style.id === wearing,
      buy: () => buy('frames', style.id, FRAME_PRICE, tx(style.name)),
      wear: () => { pickFrameStyle(style.id); toast(t('frameEquipped', { name: tx(style.name) })); renderAtelier(); }
    }));
    return card;
  }));
}

function paintFx() {
  el.atelierFx.replaceChildren(...RARITIES.map((rarity) => {
    const price = fxPrice(rarity.id);
    const row = document.createElement('div');
    row.className = 'fx-tier';
    row.innerHTML = `<div class="fx-tier-head"><span class="fx-tier-name"></span>
      <span class="fx-tier-count tabular"></span></div><div class="fx-chips"></div>`;
    const name = row.querySelector('.fx-tier-name');
    name.textContent = tx(rarity.name);
    name.style.color = rarity.color;
    row.querySelector('.fx-tier-count').innerHTML = t('atelierFxPrice', { price: ink(price) });
    row.querySelector('.fx-chips').replaceChildren(...(FX_BY_RARITY[rarity.id] ?? []).map((style) => {
      const owned = ownsFx(state.profile, rarity.id, style.id);
      const worn = (state.cardFx[rarity.id] ?? DEFAULT_FX) === style.id;
      const chip = document.createElement('div');
      chip.className = `fx-chip atelier-tile${owned ? ' is-owned' : ''}${worn ? ' is-on' : ''}`;
      chip.dataset.fx = style.id;
      chip.style.setProperty('--rarity', rarity.color);
      chip.innerHTML = `<span class="fx-sample-slot"></span><span class="fx-chip-name"></span><span class="fx-chip-sub"></span>`;
      // The treatment itself, on a card the size of a card: nobody buys a
      // look off a sentence describing it.
      chip.querySelector('.fx-sample-slot').appendChild(fxSampleCard(rarity, style.id));
      chip.querySelector('.fx-chip-name').textContent = tx(style.name);
      chip.querySelector('.fx-chip-sub').textContent = tx(style.note);
      chip.appendChild(priceButton({
        owned, price, worn,
        buy: () => buy('fx', `${rarity.id}:${style.id}`, price, tx(style.name)),
        wear: () => { wearFx(rarity, style); toast(esc(t('fxEquipped', { name: tx(style.name), rarity: tx(rarity.name) }))); renderAtelier(); }
      }));
      return chip;
    }));
    return row;
  }));
}

/** The one button on a tile: the price, "wear it" once owned, or "worn". */
function priceButton({ owned, price, worn, buy: onBuy, wear }) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `btn btn-sm atelier-buy${owned ? ' btn-ghost is-owned' : ' btn-primary'}`;
  if (worn) {
    btn.innerHTML = `<span class="buy-label">${esc(t('atelierWorn'))}</span>`;
    btn.disabled = true;
  } else if (owned) {
    btn.innerHTML = `<span class="buy-label">${esc(t('atelierWear'))}</span>`;
  } else {
    btn.innerHTML = `<span class="buy-label">${esc(t('buy'))}</span><span class="buy-price">${ink(price)}</span>`;
    if (state.ink < price) btn.classList.add('is-short');
  }
  press(btn, { sound: null });
  btn.addEventListener('click', () => { synth.playTap(); if (owned) wear(); else onBuy(btn); });
  return btn;
}

/* --- buying and pressing -------------------------------------------------- */

function buy(kind, id, price, name) {
  if (!spendInk(price)) {
    synth.playDenied();
    toast(esc(t('atelierShort', { n: formatAmount(price - state.ink) })), 'error');
    openExchange();
    return;
  }
  grant(state.profile, kind, id);
  bump(state.profile, 'atelierBuys');
  store.saveProfile(state.profile);
  refreshWallet();
  synth.playPurchase();
  const tile = el.atelierThemes.querySelector(`[data-theme="${id}"]`) ?? el.atelierFrames.querySelector(`[data-frame="${id}"]`)
    ?? el.atelierFx.querySelector(`[data-fx="${id.split(':')[1]}"]`);
  const rect = (tile ?? el.atelierPurse).getBoundingClientRect();
  spawnBurst({ shapes: ['star4', 'orb'], colors: ['#818cf8', '#ffffff', '#c7d2fe'], count: 16, spread: 1, gravity: 0.3 },
    { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }, { scale: 0.8 });
  toast(esc(t('atelierBought', { name })), 'ok');
  renderAtelier();
}

/** The counter: Buckarooz into Ink, one, ten or fifty at a time. */
export function openExchange() {
  openSheet(t('atelierExchangeTitle'), (body) => {
    const paint = () => {
      body.innerHTML = `
        <p class="atelier-balances"><span data-ink></span><span data-coins></span></p>
        <p style="margin-bottom:14px" data-note></p>
        <div class="settings-list" style="padding:0" data-rows></div>`;
      body.querySelector('[data-ink]').innerHTML = ink(state.ink);
      body.querySelector('[data-coins]').innerHTML = money(state.wallet);
      body.querySelector('[data-note]').textContent = t('atelierExchangeNote', { rate: formatAmount(EXCHANGE_RATE) });
      const rows = body.querySelector('[data-rows]');
      for (const n of [1, 10, 50]) {
        const cost = exchangeCost(n);
        const row = document.createElement('div');
        row.className = 'row';
        row.innerHTML = `<div class="row-copy"><h4></h4><p></p></div>`;
        row.querySelector('h4').innerHTML = ink(n);
        row.querySelector('p').innerHTML = t('atelierExchangeFor', { cost: money(cost) });
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-sm btn-primary row-action';
        btn.textContent = t('atelierPress');
        btn.disabled = state.wallet < cost;
        press(btn, { sound: null });
        btn.addEventListener('click', () => {
          if (store.loadWallet() < cost) { synth.playDenied(); toast(esc(t('atelierNoCoins')), 'error'); return; }
          store.saveWallet(store.loadWallet() - cost);
          addInk(n);
          refreshWallet();
          synth.playCoins();
          toast(esc(t('atelierExchanged', { n: formatAmount(n) })), 'ok');
          paint();
          if (el.screens.atelier?.classList.contains('is-active')) renderAtelier();
        });
        row.appendChild(btn);
        rows.appendChild(row);
      }
    };
    paint();
  });
}

/** What Ink is and where it comes from, for the wallet sheet and the help. */
export function openInkSheet() {
  openSheet(t('inkTitle'), (body) => {
    body.innerHTML = `
      <p class="atelier-balances" style="margin-bottom:8px" data-balance></p>
      <p style="margin-bottom:16px" data-what></p>
      <div class="row"><div class="row-copy"><h4 data-earn-t></h4><p data-earn></p></div></div>
      <div class="row"><div class="row-copy"><h4 data-spend-t></h4><p data-spend></p></div></div>
      <button class="btn btn-primary btn-block" type="button" style="margin-top:16px" data-go></button>`;
    body.querySelector('[data-balance]').innerHTML = ink(state.ink);
    body.querySelector('[data-what]').textContent = t('inkWhat');
    body.querySelector('[data-earn-t]').textContent = t('walletEarnTitle');
    body.querySelector('[data-earn]').textContent = t('inkEarn', {
      level: inkForLevel(1), week: INK_DAILY_WEEK, goal: INK_GUILD_GOAL, match: INK_GUILD_MATCH, rate: formatAmount(EXCHANGE_RATE)
    });
    body.querySelector('[data-spend-t]').textContent = t('walletSpendTitle');
    body.querySelector('[data-spend]').textContent = t('inkSpend');
    const go = body.querySelector('[data-go]');
    go.textContent = t('atelierExchange');
    press(go, { sound: null });
    go.addEventListener('click', () => { live.sheet.hide(); setTimeout(openExchange, 260); });
  });
}
