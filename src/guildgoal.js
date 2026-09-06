/**
 * THE GUILD GOAL, from the player's side.
 * ----------------------------------------------------------------------------
 * The week's shared target moves when a member does something the goal
 * counts: a booster opened, a card none of them had, a Wikdle solved. The
 * points kind is not reported from here at all; the score trigger on the
 * server moves it the moment a score lands (schema V10).
 *
 * Reports are gathered for a few seconds and sent as one call per kind, so
 * a booster of seven new cards is one request and not seven. A player who
 * is not in a guild costs nothing: the batch is dropped before it is sent.
 */
import * as account from './account.js';
import { emit } from './ui/bus.js';

const FLUSH_MS = 2500;

/** How a quest report maps onto the goal's kinds. */
const KIND_OF = {
  open: () => 'open',
  pull: (detail) => (detail?.isNew ? 'new' : null),
  wikdle: (detail) => (detail?.won ? 'wikdle' : null)
};

const pending = new Map();
let timer = null;
let inGuild = () => false;

/** Told once by the app how to know whether the player is in a guild. */
export function guildGoalSetup(isInGuild) {
  inGuild = isInGuild;
}

/** Called wherever a quest is reported; keeps only what the goal counts. */
export function reportGuildGoal(metric, detail = {}) {
  const kind = KIND_OF[metric]?.(detail);
  if (!kind || !inGuild()) return;
  pending.set(kind, (pending.get(kind) ?? 0) + 1);
  clearTimeout(timer);
  timer = setTimeout(() => { flushGuildGoal().catch(() => {}); }, FLUSH_MS);
}

/** Sends what has gathered. Safe to call any time; a failure keeps the batch for next time. */
export async function flushGuildGoal() {
  clearTimeout(timer);
  timer = null;
  if (!pending.size || !inGuild()) { pending.clear(); return; }
  const batch = [...pending.entries()];
  pending.clear();
  let moved = false;
  for (const [kind, amount] of batch) {
    try { await account.guildGoalAdd(kind, amount); moved = true; } catch {
      pending.set(kind, (pending.get(kind) ?? 0) + amount);
    }
  }
  if (moved) emit('guild-goal', {});
}
