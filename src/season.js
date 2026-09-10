/**
 * THE SEASON, from the player's side.
 * ----------------------------------------------------------------------------
 * Which season it is, from the calendar in src/data/seasons.js and the UTC
 * date; how many season points a save has earned in it; where that stands
 * on the track; what the day's season quest asks; and which of the season's
 * cosmetics the save has unlocked for good.
 *
 * Everything is kept in the profile under `seasons`, one entry per season
 * key (the year it started and its id, so a season played twice is two
 * entries), and under `seasonUnlocks` for the theme and the badge, which
 * outlive the season that gave them. The profile is part of the save, so
 * all of it follows the player between devices.
 *
 * Season points are the track's currency and nothing else: the season's
 * leaderboard window on the server is minigame points, the same as the
 * other windows, and is kept by the server (schema V11).
 */
import { POINTS_FOR, POINTS_GUILD_GOAL, POINTS_QUEST, SEASONS, TRACK, TRACK_REWARDS, seasonById } from './data/seasons.js';
import { creditFor } from './data/quests.js';

const DAY = 86400000;

/* --- the calendar --------------------------------------------------------- */

const utcDate = (y, m, d) => Date.UTC(y, m - 1, d);

/**
 * The season on a given day: its row, the key it is filed under, and when
 * it began and ends (UTC midnights). A season that wraps the year end is
 * filed under the year it began.
 */
export function seasonAt(now = Date.now()) {
  const at = new Date(now);
  const y = at.getUTCFullYear();
  for (const season of SEASONS) {
    const [fm, fd] = season.from;
    const [tm, td] = season.to;
    const wraps = tm < fm || (tm === fm && td <= fd);
    const start = utcDate(y, fm, fd);
    const end = utcDate(wraps ? y + 1 : y, tm, td);
    if (now >= start && now < end) return { season, key: `${y}-${season.id}`, year: y, startsAt: start, endsAt: end };
    if (wraps) {
      // Still in the season that began last year.
      const start2 = utcDate(y - 1, fm, fd);
      const end2 = utcDate(y, tm, td);
      if (now >= start2 && now < end2) return { season, key: `${y - 1}-${season.id}`, year: y - 1, startsAt: start2, endsAt: end2 };
    }
  }
  // The calendar covers the year; this is only reachable with a broken table.
  const first = SEASONS[0];
  return { season: first, key: `${y}-${first.id}`, year: y, startsAt: utcDate(y, 1, 1), endsAt: utcDate(y + 1, 1, 1) };
}

/** The whole year from today: every season with its dates, the current one marked. */
export function seasonCalendar(now = Date.now()) {
  const current = seasonAt(now);
  const y = new Date(now).getUTCFullYear();
  const rows = SEASONS.map((season) => {
    const [fm, fd] = season.from;
    const [tm, td] = season.to;
    const wraps = tm < fm || (tm === fm && td <= fd);
    let start = utcDate(y, fm, fd);
    let end = utcDate(wraps ? y + 1 : y, tm, td);
    // A season already over this year is shown for next year.
    if (end <= now && season.id !== current.season.id) { start = utcDate(y + 1, fm, fd); end = utcDate(wraps ? y + 2 : y + 1, tm, td); }
    if (season.id === current.season.id) { start = current.startsAt; end = current.endsAt; }
    return { season, startsAt: start, endsAt: end, current: season.id === current.season.id, past: end <= now };
  });
  return rows.sort((a, b) => a.startsAt - b.startsAt);
}

export const msToSeasonEnd = (now = Date.now()) => Math.max(0, seasonAt(now).endsAt - now);
export const daysLeft = (now = Date.now()) => Math.max(0, Math.ceil(msToSeasonEnd(now) / DAY));

/* --- the save ------------------------------------------------------------- */

/** The profile's entry for a season key, made on first touch. */
export function seasonEntry(profile, key) {
  profile.seasons ??= {};
  const entry = (profile.seasons[key] ??= { points: 0, claimed: [], quests: {} });
  entry.points ??= 0;
  entry.claimed ??= [];
  entry.quests ??= {};
  return entry;
}

export function seasonUnlocks(profile) {
  profile.seasonUnlocks ??= { themes: [], badges: [] };
  profile.seasonUnlocks.themes ??= [];
  profile.seasonUnlocks.badges ??= [];
  return profile.seasonUnlocks;
}

export const themeUnlocked = (profile, seasonId) => seasonUnlocks(profile).themes.includes(seasonId);
export const badgeUnlocked = (profile, seasonId) => seasonUnlocks(profile).badges.includes(seasonId);

/* --- points --------------------------------------------------------------- */

/**
 * Adds season points to the current season. Returns what changed: the
 * points before and after, and any rung newly reached, so the app can say
 * so. Nothing is claimed here; a rung reached is a rung to claim.
 */
export function addSeasonPoints(profile, amount, now = Date.now()) {
  const n = Math.max(0, Math.floor(Number(amount) || 0));
  const current = seasonAt(now);
  const entry = seasonEntry(profile, current.key);
  const before = entry.points;
  if (n <= 0) return { key: current.key, before, after: before, reached: [] };
  entry.points = before + n;
  const reached = [];
  TRACK.forEach((need, i) => { if (before < need && entry.points >= need) reached.push(i); });
  return { key: current.key, before, after: entry.points, reached };
}

/** Points a report is worth, by the table in the data. */
export function pointsForReport(metric, detail = {}, now = Date.now()) {
  const rule = POINTS_FOR[metric];
  if (!rule) return 0;
  const { season } = seasonAt(now);
  return Math.max(0, Math.floor(Number(rule(detail ?? {}, season)) || 0));
}

export const pointsForQuest = () => POINTS_QUEST;
export const pointsForGuildGoal = () => POINTS_GUILD_GOAL;

/* --- the track ------------------------------------------------------------ */

/**
 * The ten rungs for a season key: threshold, reward, whether reached and
 * whether claimed. `key` defaults to the current season.
 */
export function trackState(profile, key = seasonAt().key) {
  const entry = seasonEntry(profile, key);
  return TRACK.map((need, i) => ({
    index: i, need, reward: TRACK_REWARDS[i],
    reached: entry.points >= need,
    claimed: entry.claimed.includes(i)
  }));
}

export const claimableTiers = (profile, key = seasonAt().key) =>
  trackState(profile, key).filter((r) => r.reached && !r.claimed).length;

/** The next rung not yet reached, or null past the top. */
export function nextRung(profile, key = seasonAt().key) {
  const entry = seasonEntry(profile, key);
  const i = TRACK.findIndex((need) => entry.points < need);
  return i < 0 ? null : { index: i, need: TRACK[i], from: i === 0 ? 0 : TRACK[i - 1], points: entry.points };
}

/**
 * Claims a rung. Marks it, unlocks what it carries for good, and returns
 * the reward with the season it belongs to, or throws NOT_REACHED /
 * CLAIMED. A rung can be claimed after the season, but only from a key the
 * save has played: the points are the proof.
 */
export function claimTier(profile, key, index) {
  const entry = seasonEntry(profile, key);
  const need = TRACK[index];
  if (need == null) throw new Error('NOT_REACHED');
  if (entry.points < need) throw new Error('NOT_REACHED');
  if (entry.claimed.includes(index)) throw new Error('CLAIMED');
  entry.claimed.push(index);
  const seasonId = key.slice(key.indexOf('-') + 1);
  const season = seasonById(seasonId);
  const reward = TRACK_REWARDS[index];
  const unlocks = seasonUnlocks(profile);
  if (reward.theme && season && !unlocks.themes.includes(season.id)) unlocks.themes.push(season.id);
  if (reward.badge && season && !unlocks.badges.includes(season.id)) unlocks.badges.push(season.id);
  return { reward, season };
}

/** A booster spec for a season's pack. */
export const seasonSpec = (season, { cards = 5, rarityId = null } = {}) =>
  ({ kind: 'theme', themeId: `season-${season.id}`, rarityId, cards });

/* --- the quest of the day ------------------------------------------------- */

const seeded = (text) => {
  let h = 2166136261;
  for (const ch of text) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return h;
};

/**
 * The season's own quests, in the shape of the daily book so the same
 * credit rule reads them. One is dealt a day from the date and the season.
 */
export function seasonQuests(season) {
  const themeId = `season-${season.id}`;
  return [
    { id: `${season.id}-open`, metric: 'open', where: { themeId }, target: 1, reward: { money: 120 },
      name: { en: `Open a ${season.name.en} booster`, fr: `Ouvrez un booster ${season.name.fr}` },
      how: { en: `The season's own booster, in the Shop while ${season.name.en} runs.`,
             fr: `Le booster de la saison, en boutique pendant ${season.name.fr}.` } },
    { id: `${season.id}-pull-3`, metric: 'pull', where: { themeId }, target: 3, reward: { money: 160 },
      name: { en: `Pull 3 ${season.name.en} cards`, fr: `Tirez 3 cartes ${season.name.fr}` },
      how: { en: 'Only cards out of the season booster count.',
             fr: 'Seules les cartes issues du booster de saison comptent.' } },
    { id: `${season.id}-rare`, metric: 'pull', where: { themeId, minRarity: 'rare' }, target: 1, reward: { money: 260 },
      name: { en: `Pull a ${season.name.en} card, Rare or better`, fr: `Tirez une carte ${season.name.fr}, Rare ou mieux` },
      how: { en: 'From the season booster, at Rare or any tier above it.',
             fr: 'Du booster de saison, en Rare ou tout palier supérieur.' } },
    { id: `${season.id}-wikdle`, metric: 'wikdle', where: { won: true }, target: 1, reward: { money: 140 },
      name: { en: 'Solve today’s Wikdle', fr: 'Résolvez le Wikdle du jour' },
      how: { en: 'In Minigames. Find the word within your six guesses.',
             fr: 'Dans Mini-jeux. Trouvez le mot en six essais ou moins.' } },
    { id: `${season.id}-points`, metric: 'points', sum: 'amount', target: 400, reward: { money: 150 },
      name: { en: 'Score 400 minigame points', fr: 'Marquez 400 points en mini-jeux' },
      how: { en: 'Every minigame adds to the same total.',
             fr: 'Tous les mini-jeux alimentent le même total.' } },
    { id: `${season.id}-new-5`, metric: 'pull', where: { isNew: true }, target: 5, reward: { money: 150 },
      name: { en: 'Pull 5 cards you do not own', fr: 'Tirez 5 cartes que vous n’avez pas' },
      how: { en: 'Any booster. Duplicates do not count.',
             fr: 'N’importe quel booster. Les doublons ne comptent pas.' } }
  ];
}

export const utcDay = (now = Date.now()) => new Date(now).toISOString().slice(0, 10);

/** Today's season quest, and its progress read off the day's ledger of reports. */
export function seasonQuestToday(profile, events = [], now = Date.now()) {
  const current = seasonAt(now);
  const day = utcDay(now);
  const list = seasonQuests(current.season);
  const quest = list[seeded(`season:${current.key}:${day}`) % list.length];
  let progress = 0;
  for (const event of events ?? []) {
    progress += creditFor(quest, event.m, event.d ?? {});
    if (progress >= quest.target) { progress = quest.target; break; }
  }
  const entry = seasonEntry(profile, current.key);
  return { quest, day, progress, done: progress >= quest.target, claimed: Boolean(entry.quests[day]), key: current.key };
}

/** Marks the day's season quest claimed; the caller pays it. */
export function claimSeasonQuest(profile, key, day) {
  const entry = seasonEntry(profile, key);
  if (entry.quests[day]) throw new Error('CLAIMED');
  entry.quests[day] = true;
}
