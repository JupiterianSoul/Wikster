/**
 * THE LEDGER
 * ----------------------------------------------------------------------------
 * Counts of things done, kept on the profile under `ledger` so they travel
 * with the save: spins, quests claimed, messages sent, subjects opened. The
 * achievements are judged against these, so every count here is a real
 * thing the player did once and can do again, never a derived number.
 *
 * Most of them are written from one place, `record()`, which hears every
 * quest report the app makes; the rest are bumped where the thing happens.
 * A set (`noteIn`) remembers distinct ids, capped, so "ten different
 * subjects" is a real ten rather than a count of repeats.
 */

export function ledger(profile) {
  profile.ledger ??= {};
  return profile.ledger;
}

/** Adds n to a count; returns the new count. */
export function bump(profile, key, n = 1) {
  const l = ledger(profile);
  l[key] = (Number(l[key]) || 0) + (Number(n) || 0);
  return l[key];
}

/** Keeps the larger of the two. */
export function bumpMax(profile, key, value) {
  const l = ledger(profile);
  l[key] = Math.max(Number(l[key]) || 0, Number(value) || 0);
  return l[key];
}

/** Keeps the smaller, for ranks; 0 means never placed. */
export function bumpMin(profile, key, value) {
  const l = ledger(profile);
  const v = Number(value) || 0;
  if (v <= 0) return l[key] ?? 0;
  l[key] = (Number(l[key]) || 0) > 0 ? Math.min(l[key], v) : v;
  return l[key];
}

/** Remembers a distinct id under a key; true when it was new. */
export function noteIn(profile, key, id, cap = 200) {
  if (id == null || id === '') return false;
  const l = ledger(profile);
  const list = Array.isArray(l[key]) ? l[key] : (l[key] = []);
  if (list.includes(id)) return false;
  if (list.length >= cap) return false;
  list.push(id);
  return true;
}

export const countOf = (profile, key) => Number(profile?.ledger?.[key]) || 0;
export const sizeOf = (profile, key) => (Array.isArray(profile?.ledger?.[key]) ? profile.ledger[key].length : 0);

/**
 * What a quest report means to the ledger. `metric` and `detail` are the
 * same pair src/app/arcade.js hands the quests; returns true when a count
 * moved, so the caller knows to save.
 */
export function record(profile, metric, detail = {}) {
  const d = detail ?? {};
  switch (metric) {
    case 'open': {
      const kind = String(d.kind ?? 'open');
      bump(profile, `opens_${kind}`);
      if (typeof d.themeId === 'string' && d.themeId.startsWith('season-')) bump(profile, 'opensSeason');
      if (kind === 'theme' && d.themeId) noteIn(profile, 'subjects', d.themeId, 64);
      if (d.rarityId) bump(profile, 'opensTier');
      return true;
    }
    case 'pull':
      if (d.isNew) bump(profile, 'newPulls');
      if ((d.popularity ?? 0) >= 0.75) bump(profile, 'famousPulls');
      if (d.wished) bump(profile, 'wishGranted');
      return true;
    case 'wikdle':
      bump(profile, 'wikdlePlays');
      if (d.won) {
        bump(profile, 'wikdleWins');
        if ((d.guesses ?? 6) <= 3) bump(profile, 'wikdleFast');
      }
      return true;
    case 'slots':
      bump(profile, 'slotsSpins');
      if (d.won) bump(profile, 'slotsWins');
      if (d.threeOfAKind || (Array.isArray(d.lines) && d.lines.some((l) => l?.three || l?.kind === 3))) bump(profile, 'slotsTriples');
      if (d.bonus) bump(profile, 'slotsBonus');
      return true;
    case 'points':
      bump(profile, 'arcadePoints', d.amount ?? 0);
      if (d.game === 'slots') bumpMax(profile, 'slotsBest', d.amount ?? 0);
      return true;
    case 'buy':
      bump(profile, 'shopBuys');
      bump(profile, 'spent', d.price ?? 0);
      if (d.kind === 'crate') bump(profile, 'crates');
      if (d.kind === 'today') bump(profile, 'todayBuys');
      if (d.bundle) bump(profile, 'bundles');
      if (d.rarityId) bump(profile, 'tierBuys');
      return true;
    case 'sell':
      bump(profile, 'sellEarned', d.amount ?? 0);
      return true;
    case 'view':
      bump(profile, 'articleViews');
      return true;
    case 'album':
      bump(profile, 'albumsDone');
      return true;
    case 'versus':
      bump(profile, 'versusClaimed');
      if (d.won) bump(profile, 'versusWon');
      return true;
    default:
      return false;
  }
}
