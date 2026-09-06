/**
 * THE SEASON SCREEN
 * ----------------------------------------------------------------------------
 * The season that is on, and everything it brings: its banner, the points
 * earned in it and the track they climb, the day's season quest, the
 * season's own booster, where the player and their guild stand on the
 * season's board, and the year to come. Everything about points and rungs
 * is kept by src/season.js; this paints it and pays what is claimed.
 */
import { getLanguage, t, tx } from '../i18n.js';
import { bump, bumpMax, bumpMin, noteIn } from '../ledger.js';
import { iconSvg } from '../data/icons.js';
import { Bar, press } from '../ui/components.js';
import { synth } from '../ui/sound.js';
import * as store from '../collection.js';
import * as quests from '../quests.js';
import * as leaderboard from '../leaderboard.js';
import * as account from '../account.js';
import { specName } from '../booster.js';
import { formatAmount } from '../pricing.js';
import { TRACK } from '../data/seasons.js';
import {
  claimSeasonQuest, claimTier, daysLeft, nextRung, pointsForQuest, seasonAt, seasonCalendar, seasonEntry, seasonQuestToday, seasonSpec, trackState
} from '../season.js';
import { on } from '../ui/bus.js';
import { earnSeasonPoints, questUserKey } from './arcade.js';
import { el, esc, ink, money, refreshWallet, showScreen, state, toast } from './core.js';
import { INK_SEASON_QUEST, addInk } from '../ink.js';
import { paintDrawerLinks, pushNote } from './drawer.js';
import { signedIn } from './gate.js';
import { gainBooster, spawnBurst } from './open.js';
import { updateBadges } from './regalia.js';
import { buildSeasonStall } from './shop.js';

let bar = null;
let wired = false;

const dateText = (ms) => new Date(ms).toLocaleDateString(getLanguage(), { day: 'numeric', month: 'long' });
/** The short form, for the year's list where two dates share one line. */
const shortDate = (ms) => new Date(ms).toLocaleDateString(getLanguage(), { day: 'numeric', month: 'short' });
const spanDays = (row) => Math.round((row.endsAt - row.startsAt) / 86400000);

export function renderSeason() {
  wire();
  const current = seasonAt();
  const { season } = current;
  el.seasonTitle.textContent = t('tabSeason');
  el.seasonKicker.textContent = t('seasonKicker');
  el.seasonTrackLabel.textContent = t('seasonTrackLabel');
  el.seasonQuestLabel.textContent = t('seasonQuestLabel');
  el.seasonShopLabel.textContent = t('seasonShopLabel');
  el.seasonBoardLabel.textContent = t('seasonBoardLabel');
  el.seasonCalendarLabel.textContent = t('seasonCalendarLabel');

  // The banner wears the season's colours; the rest of the screen reads them.
  const screen = el.screens.season;
  screen.style.setProperty('--season-accent', season.accent);
  screen.style.setProperty('--season-accent-2', season.accent2);
  el.seasonMark.innerHTML = iconSvg(season.icon, { size: 30 });
  el.seasonName.textContent = tx(season.name);
  el.seasonTagline.textContent = tx(season.blurb);
  // A season is a stretch of weeks, so the banner says so outright: the two
  // ends joined by a word rather than a dot, then how much of it is left.
  el.seasonDates.textContent = `${t('seasonSpan', { from: dateText(current.startsAt), to: dateText(current.endsAt - 1) })} · ${t('seasonDays', { n: daysLeft() })}`;

  paintPoints();
  paintTrack();
  paintQuest();
  el.seasonShop.replaceChildren(buildSeasonStall({ inSeasonScreen: true }));
  paintBoard();
  paintCalendar();
}

function wire() {
  if (wired) return;
  wired = true;
  on('season', () => { if (state.tab === 'season') { paintPoints(); paintTrack(); paintQuest(); } });
  on('score', () => { if (state.tab === 'season') paintBoard(); });
}

/* --- points and the track ------------------------------------------------- */

function paintPoints() {
  const current = seasonAt();
  const entry = seasonEntry(state.profile, current.key);
  if (!bar) bar = new Bar(el.seasonBar);
  el.seasonPoints.textContent = formatAmount(entry.points);
  el.seasonPointsLabel.textContent = t('seasonPointsLabel');
  const next = nextRung(state.profile, current.key);
  if (next) {
    el.seasonNext.textContent = t('seasonNext', { n: formatAmount(next.need - next.points), rung: next.index + 1 });
    bar.set((next.points - next.from) / Math.max(1, next.need - next.from));
  } else {
    el.seasonNext.textContent = t('seasonMaxed');
    bar.set(1);
  }
}

/** What a rung pays, in words and coins. */
function rewardText(reward, season) {
  const bits = [];
  if (reward.money) bits.push(money(reward.money));
  if (reward.ink) bits.push(ink(reward.ink));
  if (reward.booster) bits.push(esc(specName(seasonSpec(season, reward.booster))));
  if (reward.badge) bits.push(esc(t('seasonRewardBadge', { name: tx(season.name) })));
  if (reward.theme) bits.push(esc(t('seasonRewardTheme', { name: tx(season.name) })));
  return bits.join(' + ');
}

function rewardIcon(reward) {
  if (reward.theme) return 'wand';
  if (reward.badge) return 'star';
  if (reward.booster) return 'packs';
  return 'gem';
}

function paintTrack() {
  const current = seasonAt();
  const { season } = current;
  const rungs = trackState(state.profile, current.key);
  el.seasonTrack.replaceChildren(...rungs.map((rung) => {
    const card = document.createElement('div');
    card.className = `season-rung${rung.claimed ? ' is-claimed' : rung.reached ? ' is-ready' : ' is-locked'}${rung.reward.theme || rung.reward.badge ? ' is-big' : ''}`;
    card.innerHTML = `
      <span class="season-rung-n tabular"></span>
      <span class="season-rung-icon">${iconSvg(rewardIcon(rung.reward), { size: 20 })}</span>
      <span class="season-rung-reward"></span>
      <span class="season-rung-need tabular"></span>
      <span class="season-rung-state"></span>`;
    card.querySelector('.season-rung-n').textContent = t('seasonRung', { n: rung.index + 1 });
    card.querySelector('.season-rung-reward').innerHTML = rewardText(rung.reward, season);
    card.querySelector('.season-rung-need').textContent = t('seasonLocked', { n: formatAmount(rung.need) });
    const slot = card.querySelector('.season-rung-state');
    if (rung.claimed) {
      slot.innerHTML = `<span class="quest-stamp">${iconSvg('check', { size: 13 })}<span></span></span>`;
      slot.querySelector('.quest-stamp span').textContent = t('seasonClaimed');
    } else if (rung.reached) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-primary btn-sm';
      btn.textContent = t('seasonClaim');
      press(btn, { sound: null });
      btn.addEventListener('click', () => claimRung(current, rung.index, btn));
      slot.appendChild(btn);
    } else {
      slot.innerHTML = `<span class="season-rung-lock">${iconSvg('lock', { size: 13 })}</span>`;
    }
    return card;
  }));
}

function claimRung(current, index, btn) {
  btn.disabled = true;
  let claimed;
  try { claimed = claimTier(state.profile, current.key, index); } catch (error) {
    btn.disabled = false;
    const code = String(error?.message ?? '');
    toast(esc(code === 'CLAIMED' ? t('seasonClaimed') : t('seasonNotReached')), 'error');
    synth.playDenied();
    return;
  }
  const { reward, season } = claimed;
  if (reward.money) store.saveWallet(store.loadWallet() + reward.money);
  if (reward.ink) addInk(reward.ink);
  bump(state.profile, 'seasonRungs');
  refreshWallet();
  if (reward.booster) gainBooster(seasonSpec(season, reward.booster), 1);
  if (reward.badge) {
    updateBadges();
    pushNote('star', t('seasonBadgeUnlocked', { name: tx(season.name) }), 'badges');
  }
  if (reward.theme) pushNote('wand', t('seasonThemeUnlocked', { name: tx(season.name) }), 'customize');
  store.saveProfile(state.profile);
  synth.playFanfare();
  const rect = btn.getBoundingClientRect();
  spawnBurst({ shapes: ['star4', 'orb'], colors: [season.accent, '#ffffff', season.accent2], count: 18, spread: 1.1, gravity: 0.3 },
    { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }, { scale: 0.9 });
  const what = reward.theme ? t('seasonThemeUnlocked', { name: tx(season.name) })
    : reward.badge ? t('seasonBadgeUnlocked', { name: tx(season.name) })
      : t('seasonClaimedToast', { n: index + 1 });
  toast(esc(what), 'ok');
  paintTrack();
  paintDrawerLinks();
}

/* --- the quest of the day ------------------------------------------------- */

function paintQuest() {
  const board = quests.loadBoard(questUserKey());
  const today = seasonQuestToday(state.profile, board.events);
  const { quest } = today;
  const card = document.createElement('div');
  card.className = `quest season-quest${today.done ? ' is-done' : ''}${today.claimed ? ' is-claimed' : ''}`;
  card.style.setProperty('--tier', seasonAt().season.accent);
  card.innerHTML = `
    <span class="quest-stripe" aria-hidden="true"></span>
    <div class="quest-main">
      <div class="quest-head"><b class="quest-name"></b><span class="quest-tier"></span></div>
      <div class="quest-bar"><i></i><span class="quest-bar-text tabular"></span></div>
      <div class="quest-foot"><span class="quest-reward"></span><span class="quest-state"></span></div>
    </div>`;
  card.querySelector('.quest-name').textContent = tx(quest.name);
  card.querySelector('.quest-tier').textContent = tx(seasonAt().season.name);
  card.querySelector('.quest-reward').innerHTML = `${money(quest.reward.money)} + ${esc(t('seasonQuestPays', { n: pointsForQuest() }))}`;
  card.querySelector('.quest-bar i').style.width = `${Math.round(100 * Math.min(1, today.progress / quest.target))}%`;
  card.querySelector('.quest-bar-text').textContent = `${Math.min(today.progress, quest.target)} / ${quest.target}`;
  const slot = card.querySelector('.quest-state');
  if (today.claimed) {
    slot.innerHTML = `<span class="quest-stamp">${iconSvg('check', { size: 13 })}<span></span></span>`;
    slot.querySelector('.quest-stamp span').textContent = t('questClaimed');
  } else if (today.done) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-primary btn-sm quest-claim';
    btn.textContent = t('questClaim');
    press(btn, { sound: null });
    btn.addEventListener('click', () => {
      btn.disabled = true;
      try { claimSeasonQuest(state.profile, today.key, today.day); } catch {
        btn.disabled = false; toast(esc(t('questClaimed')), 'error'); synth.playDenied(); return;
      }
      store.saveWallet(store.loadWallet() + quest.reward.money);
      addInk(INK_SEASON_QUEST);
      bump(state.profile, 'seasonQuests');
      refreshWallet();
      store.saveProfile(state.profile);
      earnSeasonPoints(pointsForQuest());
      synth.playPurchase();
      toast(esc(t('questPaid', { name: tx(quest.name) })), 'ok');
      paintQuest();
    });
    slot.appendChild(btn);
  } else {
    slot.innerHTML = `<span class="quest-pct tabular"></span>`;
    slot.querySelector('.quest-pct').textContent = `${Math.round(100 * Math.min(1, today.progress / quest.target))}%`;
  }
  el.seasonQuest.replaceChildren(card);
}

/* --- the season board ----------------------------------------------------- */

async function paintBoard() {
  const box = el.seasonBoard;
  const line = (icon, text) => {
    const row = document.createElement('div');
    row.className = 'season-board-line';
    row.innerHTML = `<span class="season-board-icon">${iconSvg(icon, { size: 16 })}</span><span></span>`;
    row.querySelector('span:last-child').textContent = text;
    return row;
  };
  const go = document.createElement('button');
  go.type = 'button';
  go.className = 'btn btn-ghost btn-sm';
  go.textContent = t('seasonBoardOpen');
  press(go, { sound: null });
  go.addEventListener('click', () => {
    synth.playTap();
    state.leaderboardView = { ...(state.leaderboardView ?? {}), window: 'season', page: 0, rows: [] };
    import('./quests.js').then((m) => { m.renderLeaderboard(); showScreen('leaderboard'); });
  });
  if (!signedIn()) {
    box.replaceChildren(line('podium', t('lbSignIn')));
    return;
  }
  box.replaceChildren(line('podium', t('lbLoading')));
  let mine = null, guild = null;
  try { mine = await leaderboard.fetchMyRank('season'); } catch { /* the line says so */ }
  try { if (state.guild) guild = await account.myGuildRank('season'); } catch { /* same */ }
  if (state.tab !== 'season') return;
  const rows = [
    line('podium', mine ? t('seasonBoardMe', { rank: mine.rank, total: mine.total, points: formatAmount(mine.score) }) : t('seasonBoardNone'))
  ];
  if (state.guild) rows.push(line('shield', guild?.rank ? t('seasonBoardGuild', { name: state.guild.name, rank: guild.rank, total: guild.total }) : t('seasonBoardGuildNone', { name: state.guild.name })));
  rows.push(go);
  box.replaceChildren(...rows);
}

/* --- the year ------------------------------------------------------------- */

function paintCalendar() {
  const rows = seasonCalendar();
  el.seasonCalendar.replaceChildren(...rows.map((row) => {
    const { season } = row;
    const node = document.createElement('div');
    node.className = `season-row${row.current ? ' is-now' : ''}${row.past ? ' is-past' : ''}`;
    node.style.setProperty('--season-accent', season.accent);
    node.innerHTML = `
      <span class="season-row-mark">${iconSvg(season.icon, { size: 18 })}</span>
      <span class="season-row-copy"><b></b><span></span></span>
      <span class="season-row-when tabular"></span>`;
    node.querySelector('b').textContent = tx(season.name);
    node.querySelector('.season-row-copy span').textContent = tx(season.tagline);
    // Every row carries its whole stretch, not just the day it opens: the
    // list is a year of seasons, and a lone date reads as a lone day.
    const when = node.querySelector('.season-row-when');
    when.innerHTML = '<b></b><small></small>';
    when.querySelector('b').textContent = t('seasonSpan', { from: shortDate(row.startsAt), to: shortDate(row.endsAt - 1) });
    when.querySelector('small').textContent = row.current
      ? t('seasonNowLeft', { n: daysLeft() })
      : t('seasonLength', { n: spanDays(row) });
    // A season this save has played, in any year, says how far it got.
    const played = Object.entries(state.profile.seasons ?? {})
      .filter(([key]) => key.endsWith(`-${season.id}`))
      .map(([, entry]) => entry)
      .sort((a, b) => (b.points ?? 0) - (a.points ?? 0))[0];
    if (played && !row.current) {
      const note = document.createElement('span');
      note.className = 'season-row-played';
      note.textContent = t('seasonPlayed', { points: formatAmount(played.points ?? 0), rungs: TRACK.filter((need) => (played.points ?? 0) >= need).length });
      node.querySelector('.season-row-copy').appendChild(note);
    }
    return node;
  }));
}
