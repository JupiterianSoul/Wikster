/**
 * VERSUS: two games that only work with a friend
 * ----------------------------------------------------------------------------
 * Both are challenges: one player sets one up from their own cards and
 * plays their half, the friend plays theirs when they like, and the server
 * settles it the moment the second half lands (challenge_answer in
 * supabase/schema.sql). Nothing here needs the two to be online at once,
 * and nothing here can be played alone.
 *
 * CARD CLASH: each side puts five cards on the table. The two hands are
 * laid out best to worst by monthly readers and compared pair by pair; a
 * round goes to the more-read card, and the hand with more rounds wins.
 *
 * SPEED SORT: the challenger deals eight of their cards, shuffled, and both
 * players put them in order from most read to least, as fast as they can.
 * Right positions count first; on a tie the faster hand wins.
 *
 * The arithmetic here is the same as the server's, so a screen can show the
 * reckoning it already knows and a test can check the two agree.
 */

export const CLASH_CARDS = 5;
export const SORT_CARDS = 8;
export const KINDS = ['clash', 'sort'];

/** What a settled challenge pays each side, in coins, Ink and season points. */
export const PAY = {
  win: { coins: 600, ink: 15, season: 40 },
  lose: { coins: 150, ink: 3, season: 10 },
  draw: { coins: 300, ink: 8, season: 20 }
};

const views = (c) => Number(c?.views) || 0;

/** The cards a game can use: real articles with a readership on record. */
export const eligible = (entries) => (entries ?? []).filter((e) => e && !e.special && views(e) > 0 && e.key);

/** A card as it travels in a challenge: the smallest thing that still draws. */
export const snapshot = (c) => ({ key: c.key, title: c.title, views: views(c), rarityId: c.rarityId, thumbnail: c.thumbnail ?? null });

/** Eight cards for a Speed Sort, no two with the same readership, shuffled. */
export function dealSort(entries, rng = Math.random) {
  const pool = eligible(entries).sort(() => rng() - 0.5);
  const seen = new Set();
  const hand = [];
  for (const c of pool) {
    if (seen.has(views(c))) continue;
    seen.add(views(c));
    hand.push(snapshot(c));
    if (hand.length === SORT_CARDS) break;
  }
  return hand.length === SORT_CARDS ? hand : null;
}

export const canClash = (entries) => eligible(entries).length >= CLASH_CARDS;
export const canSort = (entries) => new Set(eligible(entries).map(views)).size >= SORT_CARDS;

/** The true order of a Speed Sort hand: most read first. */
export const trueOrder = (cards) => [...cards].sort((a, b) => views(b) - views(a)).map((c) => c.key);

/** How many positions of `order` are right for `cards`. */
export function sortScore(cards, order) {
  const truth = trueOrder(cards);
  return (order ?? []).reduce((n, key, i) => n + (truth[i] === key ? 1 : 0), 0);
}

/** The rounds of a Clash: both hands best to worst, side by side. */
export function clashRounds(mine, theirs) {
  const a = [...mine].sort((x, y) => views(y) - views(x)).slice(0, CLASH_CARDS);
  const b = [...theirs].sort((x, y) => views(y) - views(x)).slice(0, CLASH_CARDS);
  return a.map((c, i) => {
    const o = b[i] ?? null;
    const winner = !o ? 'challenger' : views(c) > views(o) ? 'challenger' : views(o) > views(c) ? 'opponent' : 'draw';
    return { challenger: c, opponent: o, winner };
  });
}

/**
 * The reckoning, the way the server does it. `payload` is the challenger's
 * half, `reply` the opponent's. Returns { winner, scores } with winner one
 * of 'challenger', 'opponent', 'draw'.
 */
export function settle(kind, payload, reply) {
  if (kind === 'clash') {
    const rounds = clashRounds(payload?.cards ?? [], reply?.cards ?? []);
    const c = rounds.filter((r) => r.winner === 'challenger').length;
    const o = rounds.filter((r) => r.winner === 'opponent').length;
    return { winner: c > o ? 'challenger' : o > c ? 'opponent' : 'draw', scores: { challenger: c, opponent: o } };
  }
  const cards = payload?.cards ?? [];
  const c = sortScore(cards, payload?.order);
  const o = sortScore(cards, reply?.order);
  const cm = Number(payload?.ms) || 0;
  const om = Number(reply?.ms) || 0;
  const winner = c > o ? 'challenger' : o > c ? 'opponent' : cm < om ? 'challenger' : om < cm ? 'opponent' : 'draw';
  return { winner, scores: { challenger: c, opponent: o }, ms: { challenger: cm, opponent: om } };
}

/** Which side `userId` is on, and how it came out for them. */
export function outcomeFor(challenge, userId) {
  const side = challenge.challenger === userId ? 'challenger' : challenge.opponent === userId ? 'opponent' : null;
  if (!side || challenge.status !== 'done' || !challenge.result) return { side, outcome: null };
  const w = challenge.result.winner;
  return { side, outcome: w === 'draw' ? 'draw' : w === side ? 'win' : 'lose' };
}
