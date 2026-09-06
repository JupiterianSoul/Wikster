/* profile: split out of main.js */

import { MAX_LEVEL, levelFraction, rankFor, rewardForLevel, xpForLevel } from '../progression.js';
import { paintAvatarInto } from './social.js';
import { frameTier } from '../frames.js';
import { getLanguage, t, tx } from '../i18n.js';
import * as store from '../collection.js';
import { formatAmount } from '../pricing.js';
import { albumsDeep } from '../albums.js';
import { evaluate as evaluateAchievements } from '../achievements.js';
import * as account from '../account.js';
import { RARITIES, rarityById, rarityOfCard, rarityRank } from '../data/rarities.js';
import { Bar } from '../ui/components.js';
import { el, openSheet, state } from './core.js';
import { iconSvg } from '../data/icons.js';
import { press } from '../ui/components.js';
import { synth } from '../ui/sound.js';
import { buildStaticCard, openCardDetail } from './detail.js';
import { signedIn, userId } from './gate.js';
import { live } from './live.js';
import { rewardCard } from './open.js';
import { achFacts, frameStyle, paintFrameInto, renderBadges } from './regalia.js';

/* --- profile ------------------------------------------------------------------------------------------- */

export function formatDuration(ms) {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
}

/** The time-played cell alone, for the minute tick while the profile is open. */
export function paintPlaytime() {
  const cell = el.statGrid?.querySelector('[data-stat="playtime"] b');
  if (cell) cell.textContent = formatDuration(state.profile.playMs ?? 0);
}

export function renderProfile() {
  const { progress, rarityCounts } = state.profile;
  const level = progress.level ?? 1;
  const rank = rankFor(level);
  const atMax = level >= MAX_LEVEL;

  live.profileRing.set(levelFraction(progress), String(level));
  paintFrameInto(el.profileRing, frameStyle(), frameTier(level));
  // The picture beside the ring: the account's, or the initial of the name.
  paintAvatarInto(el.profileFace, state.account?.profile ?? { username: t('lbYou') }, { frame: { style: null, tier: 0 } });
  el.profileFace.hidden = !state.account?.profile;
  el.profileLevel.textContent = atMax ? t('profileMax') : t('profileLevel', { n: level });
  el.profileRank.textContent = tx(rank.name);
  live.xpBar.set(levelFraction(progress));
  el.xpLine.textContent = atMax ? t('profileMax') : t('profileXpLine', {
    have: (progress.xp ?? 0).toLocaleString(), need: xpForLevel(level).toLocaleString()
  });

  el.nextRewardLabel.textContent = t('profileNextReward');
  el.nextReward.replaceChildren(
    atMax ? document.createTextNode(t('profileMax'))
      : rewardCard(rewardForLevel(level + 1), { art: false })
  );

  paintShowcase();
  renderBadges();

  el.statsLabel.textContent = t('profileStats');
  const entries = store.allEntries(state.collection);
  const pulled = Object.values(rarityCounts).reduce((sum, n) => sum + n, 0);

  const stats = [
    [t('statPlaytime'), formatDuration(state.profile.playMs ?? 0)],
    [t('statAccountAge'), new Date(state.profile.createdAt ?? Date.now())
      .toLocaleDateString(getLanguage(), { year: 'numeric', month: 'short', day: 'numeric' })],
    [t('statBoosters'), (state.profile.boostersOpened ?? 0).toLocaleString()],
    [t('statCards'), pulled.toLocaleString()],
    [t('statValue'), formatAmount(entries.reduce((sum, e) => sum + e.price * e.count, 0))],
    [t('statAlbums'), String(albumsDeep(entries, state.customPacks))],
    [t('statAchievements'), String(evaluateAchievements(achFacts(),
      state.profile.achievements?.redeemed ?? []).filter((a) => a.unlocked).length)],
    ...(account.configured ? [[t('statFriends'), String(state.social.friends.length)]] : [])
  ];
  el.statGrid.replaceChildren(...stats.map(([label, value], i) => {
    const cell = document.createElement('div');
    cell.className = 'stat-cell';
    if (i === 0) cell.dataset.stat = 'playtime';
    cell.innerHTML = '<b></b><span></span>';
    cell.querySelector('b').textContent = value;
    cell.querySelector('span').textContent = label;
    return cell;
  }));

  el.rarityLabel.textContent = t('statRarity');
  const peak = Math.max(1, ...RARITIES.map((r) => rarityCounts[r.id] ?? 0));
  el.rarityBars.replaceChildren(...RARITIES.map((rarity) => {
    const count = rarityCounts[rarity.id] ?? 0;
    const row = document.createElement('div');
    row.className = 'rarity-row';
    row.innerHTML = `<span class="rarity-name"></span><span class="rarity-track"></span><span class="rarity-count"></span>`;
    const name = row.querySelector('.rarity-name');
    name.textContent = tx(rarity.name);
    name.style.color = rarity.color;
    const bar = new Bar(row.querySelector('.rarity-track'));
    bar.set(count / peak, { animate: false });
    bar.fill.style.background = rarity.color;
    row.querySelector('.rarity-count').textContent = count.toLocaleString();
    return row;
  }));

}

/* --- the showcase -------------------------------------------------------------
 *
 * Three cards pinned on the profile for friends to see. A pin is a copy of
 * the card as it was pinned (the card can be sold or traded afterwards and
 * the pin stays), kept in the profile so it syncs, and published to the
 * profile row so a friend's screen reads it in one go.
 */

const MAX_PINS = 3;

export function pinnedCards() {
  return (Array.isArray(state.profile.showcase) ? state.profile.showcase : []).filter((c) => c && c.key).slice(0, MAX_PINS);
}

function savePins(pins) {
  state.profile.showcase = pins.slice(0, MAX_PINS);
  store.saveProfile(state.profile);
  paintShowcase();
  if (signedIn()) account.setShowcase(userId(), state.profile.showcase).catch(() => { /* next sync */ });
}

export function paintShowcase() {
  if (!el.showcaseGrid) return;
  el.showcaseLabel.textContent = t('showcaseLabel');
  el.showcaseNote.textContent = t('showcaseNote');
  const pins = pinnedCards();
  el.showcaseGrid.replaceChildren(...Array.from({ length: MAX_PINS }, (_, i) => {
    const slot = document.createElement('div');
    slot.className = 'showcase-slot';
    const card = pins[i];
    if (card) {
      const node = buildStaticCard(card, rarityOfCard(card), null, { fav: false, wish: false });
      node.addEventListener('click', () => {
        const owned = state.collection.entries?.[card.key];
        if (owned) openCardDetail(card.key, owned, rarityOfCard(owned));
      });
      const off = document.createElement('button');
      off.type = 'button';
      off.className = 'icon-btn is-mini showcase-remove';
      off.setAttribute('aria-label', t('showcaseRemove'));
      off.innerHTML = iconSvg('close', { size: 14 });
      press(off, { sound: null });
      off.addEventListener('click', (e) => { e.stopPropagation(); synth.playTap(); savePins(pins.filter((_, j) => j !== i)); });
      slot.append(node, off);
    } else {
      const add = document.createElement('button');
      add.type = 'button';
      add.className = 'showcase-empty';
      add.innerHTML = `${iconSvg('plus', { size: 22 })}<span></span>`;
      add.querySelector('span').textContent = t('showcaseEmpty');
      press(add, { sound: null });
      add.addEventListener('click', () => { synth.playTap(); openShowcasePicker(); });
      slot.appendChild(add);
    }
    return slot;
  }));
}

/** Choose a card of mine to pin: the picker the gift sheet uses, rarest first. */
export function openShowcasePicker() {
  const pins = pinnedCards();
  const taken = new Set(pins.map((c) => c.key));
  const mine = store.allEntries(state.collection)
    .filter((c) => !taken.has(c.key))
    .sort((a, b) => rarityRank(b.rarityId) - rarityRank(a.rarityId));
  openSheet(t('showcasePick'), (body) => {
    if (!mine.length) {
      body.innerHTML = '<p class="muted"></p>';
      body.querySelector('p').textContent = t('giftNothing');
      return;
    }
    const list = document.createElement('div');
    list.className = 'pick-list';
    list.replaceChildren(...mine.map((card) => {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'pick-row';
      row.innerHTML = `
        <span class="pick-thumb"></span>
        <span class="pick-copy"><b></b><span></span></span>
        <span class="chip tabular">×${card.count}</span>`;
      if (card.thumbnail) row.querySelector('.pick-thumb').style.backgroundImage = `url("${card.thumbnail}")`;
      row.querySelector('b').textContent = card.title;
      const tier = row.querySelector('.pick-copy span');
      tier.textContent = tx(rarityById(card.rarityId).name);
      tier.style.color = rarityById(card.rarityId).color;
      press(row, { sound: null });
      row.addEventListener('click', () => {
        synth.playResolved();
        savePins([...pins, { ...card, count: 1, favorite: false }]);
        live.sheet.hide();
      });
      return row;
    }));
    body.appendChild(list);
  });
}
