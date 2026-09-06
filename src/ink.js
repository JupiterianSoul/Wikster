/**
 * INK
 * ----------------------------------------------------------------------------
 * The second currency, and the only one the Atelier takes: themes, frames
 * and card effects are bought with Ink and nothing else. It is earned by
 * playing, in small steady amounts from many places (a level, a rung of the
 * season's track, an achievement, a hard quest, the seventh gift of the
 * week, a guild goal met, a match won), and it can be pressed from
 * Buckarooz at a fixed rate that makes a theme a real purchase rather than
 * a Tuesday. The balance lives on the device under its own key and travels
 * with the save.
 *
 * What has been bought lives on the profile under `owned`, so a purchase
 * follows the player between devices the way everything else does.
 */
import { rarityRank } from './data/rarities.js';

export const INK_KEY = 'wikster.ink.v1';
export const INK_NAME = 'Ink';

/** Buckarooz for one Ink, at the counter. */
export const EXCHANGE_RATE = 60;

/** What the Atelier charges. */
export const THEME_PRICE = 120;
export const FRAME_PRICE = 150;
const FX_PRICES = [25, 30, 40, 50, 65, 80, 100, 120];
export const fxPrice = (rarityId) => FX_PRICES[Math.max(0, Math.min(FX_PRICES.length - 1, rarityRank(rarityId)))];

/* --- the balance ------------------------------------------------------------ */

const read = () => {
  try {
    const v = JSON.parse(localStorage.getItem(INK_KEY) ?? 'null');
    return Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0;
  } catch { return 0; }
};
const write = (n) => {
  try { localStorage.setItem(INK_KEY, JSON.stringify(Math.max(0, Math.floor(n)))); } catch { /* session only */ }
};

export const loadInk = () => read();
export const saveInk = (n) => write(n);

/** Adds Ink; resolves to the new balance. */
export function addInk(amount) {
  const n = Math.max(0, Math.floor(Number(amount) || 0));
  const after = read() + n;
  write(after);
  return after;
}

/** Takes Ink; false when there is not enough, and nothing moves. */
export function spendInk(amount) {
  const n = Math.max(0, Math.floor(Number(amount) || 0));
  const have = read();
  if (have < n) return false;
  write(have - n);
  return true;
}

/** How many Buckarooz `ink` costs at the counter. */
export const exchangeCost = (ink) => Math.max(0, Math.floor(Number(ink) || 0)) * EXCHANGE_RATE;

/* --- what pays Ink -------------------------------------------------------- */

/**
 * A level's Ink: a little every level, more at the round ones, so the
 * ladder pays about a theme every forty levels early on and faster later.
 */
export function inkForLevel(level) {
  const n = Math.max(1, Math.floor(Number(level) || 1));
  let ink = 2 + Math.floor(n / 5);
  if (n % 10 === 0) ink += 10;
  if (n % 25 === 0) ink += 25;
  if (n % 100 === 0) ink += 100;
  return ink;
}

/**
 * An achievement's Ink, from its coin or booster reward: pocket change for
 * the first rungs, a real sum for the ones that take weeks.
 */
export function inkForAchievement(reward) {
  if (!reward) return 0;
  if (reward.kind === 'coins') return Math.max(1, Math.round((Number(reward.coins) || 0) / 100));
  const rank = rarityRank(reward.spec?.rarityId ?? 'common');
  return [5, 8, 10, 15, 25, 35, 50, 80][Math.max(0, Math.min(7, rank))];
}

/** A daily quest's Ink, by its tier. */
export const inkForQuestTier = (tier) => ({ easy: 1, medium: 2, hard: 5 }[tier] ?? 1);

export const INK_DAILY_WEEK = 10;      // the seventh gift of a week
export const INK_GUILD_GOAL = 10;      // a weekly guild goal met
export const INK_GUILD_MATCH = 15;     // a guild match won
export const INK_SEASON_QUEST = 3;     // the day's season quest

/* --- what is owned -------------------------------------------------------- */

export function owned(profile) {
  profile.owned ??= { themes: [], frames: [], fx: [] };
  profile.owned.themes ??= [];
  profile.owned.frames ??= [];
  profile.owned.fx ??= [];
  return profile.owned;
}

export const ownsTheme = (profile, id) => owned(profile).themes.includes(id);
export const ownsFrame = (profile, id) => owned(profile).frames.includes(id);
export const fxKey = (rarityId, fxId) => `${rarityId}:${fxId}`;
export const ownsFx = (profile, rarityId, fxId) => owned(profile).fx.includes(fxKey(rarityId, fxId));

/** Records a purchase; the caller has already taken the Ink. */
export function grant(profile, kind, id) {
  const list = owned(profile)[kind];
  if (list && !list.includes(id)) list.push(id);
}
