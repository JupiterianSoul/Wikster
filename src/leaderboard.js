/**
 * THE LEADERBOARD, from the player's side.
 * ============================================================================
 * Three windows, daily, weekly and all-time, each a table on the server kept
 * by a trigger over every score (supabase/schema.sql, V6). A page is twenty
 * rows; the player's own standing comes separately so it can be pinned to
 * the bottom of the screen when it is not on the page being looked at.
 */
import { supabase } from './account.js';
import { emit } from './ui/bus.js';

export const WINDOWS = ['daily', 'weekly', 'alltime'];
export const PAGE_SIZE = 20;
const TIMEOUT_MS = 10000;

const withTimeout = (promise) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), TIMEOUT_MS))
]);

/** One page of a window: { rows: [{ rank, userId, username, score }], page, more }. */
export async function fetchPage(window = 'daily', page = 0) {
  if (!supabase) throw new Error('CLOSED');
  if (!WINDOWS.includes(window)) throw new Error('BAD_WINDOW');
  const { data, error } = await withTimeout(supabase.rpc('leaderboard_page', { p_window: window, p_page: page }));
  if (error) throw new Error(/does not exist|schema cache/i.test(error.message ?? '') ? 'SCHEMA' : error.message);
  const rows = (data ?? []).map((r) => ({
    rank: Number(r.rank), userId: r.user_id, username: r.username ?? '?', score: Number(r.score) || 0
  }));
  return { rows, page, more: rows.length === PAGE_SIZE };
}

/** The caller's own standing in a window, or null when they have no score in it. */
export async function fetchMyRank(window = 'daily') {
  if (!supabase) throw new Error('CLOSED');
  const { data, error } = await withTimeout(supabase.rpc('my_rank', { p_window: window }));
  if (error) throw new Error(/does not exist|schema cache/i.test(error.message ?? '') ? 'SCHEMA' : error.message);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || row.rank == null) return null;
  return { rank: Number(row.rank), score: Number(row.score) || 0, total: Number(row.total) || 0 };
}

/** The most a game can send for one day; the server holds the same table. */
export const GAME_MAX = { wikdle: 1400, duel: 3100, reveal: 1600, slots: 20000, quiz: 1000 };

/** The day a score belongs to, in the server's clock. */
export const utcDay = (now = Date.now()) => new Date(now).toISOString().slice(0, 10);

/*
 * A score that could not be sent is not a score that was lost. Every
 * submission is written to a queue first and removed when the server has
 * it; a refusal the server means (out of range, an unknown game) drops it,
 * anything else - no network, a timeout, a tunnel that closed - keeps it for
 * the next flush, which happens on resume, on reconnect and before the board
 * is read.
 */
const QUEUE_KEY = 'wikster.scores.queue.v1';
const readQueue = () => { try { const q = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]'); return Array.isArray(q) ? q : []; } catch { return []; } };
const writeQueue = (q) => { try { if (q.length) localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); else localStorage.removeItem(QUEUE_KEY); } catch { /* storage unavailable */ } };
const REFUSED = /out of range|not scored|sign in/i;
let flushing = null;

async function send(entry) {
  const { error } = await withTimeout(supabase.rpc('submit_score', { p_game: entry.game, p_points: entry.points, p_day: entry.day }));
  if (error) throw new Error(error.message);
}

/** Sends whatever is waiting, oldest first, and stops at the first failure
 *  that is not a refusal. Resolves to how many landed. */
export async function flushScores() {
  if (!supabase) return 0;
  if (flushing) return flushing;
  flushing = (async () => {
    let landed = 0;
    let queue = readQueue();
    while (queue.length) {
      const entry = queue[0];
      try {
        await send(entry);
        landed += 1;
      } catch (error) {
        if (!REFUSED.test(String(error?.message ?? ''))) break;
      }
      queue = queue.slice(1);
      writeQueue(queue);
    }
    if (landed) emit('score', { landed });
    return landed;
  })();
  try { return await flushing; } finally { flushing = null; }
}

/**
 * A game scored on the device sends its points for the day: Wikdle once, a
 * duel, a reveal, a quiz or a spin whenever it beats the day's best. The
 * server keeps one row per game and day and refuses points above the game's
 * maximum. Queued first, so a score survives a dead network.
 */
export async function submitScore(game, points, day = utcDay()) {
  const max = GAME_MAX[game];
  if (!max) throw new Error('this game is not scored by the client');
  const clean = Math.max(0, Math.min(max, Math.round(Number(points) || 0)));
  if (clean <= 0) return;
  writeQueue([...readQueue(), { game, points: clean, day, at: Date.now() }]);
  if (!supabase) throw new Error('CLOSED');
  await flushScores();
  if (readQueue().some((e) => e.game === game && e.day === day && e.points === clean)) throw new Error('QUEUED');
}

/** How many scores are still waiting to be sent. */
export const pendingScores = () => readQueue().length;

export const submitWikdle = (points, day) => submitScore('wikdle', points, day);

/** Milliseconds until a window resets: midnight UTC, or Sunday midnight UTC; never for all-time. */
export function msToReset(window, now = Date.now()) {
  if (window === 'alltime') return null;
  const next = new Date(now);
  next.setUTCHours(24, 0, 0, 0);
  if (window === 'weekly') {
    // Sunday 00:00 UTC: the day of week of `next` is tomorrow's.
    const daysToSunday = (7 - next.getUTCDay()) % 7;
    next.setUTCDate(next.getUTCDate() + daysToSunday);
  }
  return next.getTime() - now;
}
