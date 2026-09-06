/**
 * GUILDS, from the player's side.
 * ----------------------------------------------------------------------------
 * A guild is a name, a tag and up to fifty players. Every point a member
 * scores lands on the guild's three windows through the same trigger that
 * fills their own (supabase/schema.sql, V8). Everything here is a function
 * on the server: the client never writes a guild row itself.
 */

import { supabase } from './client.js';

const TIMEOUT_MS = 10000;
const withTimeout = (promise) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), TIMEOUT_MS))
]);

/** Turns a PostgREST error into one word the screen can name. */
function named(error) {
  const text = String(error?.message ?? '');
  if (/does not exist|schema cache/i.test(text)) return new Error('SCHEMA');
  const code = /ALREADY_IN_GUILD|NAME_TAKEN|TAG_TAKEN|GUILD_FULL|NOT_IN_GUILD|NOT_FRIEND|ALREADY_MEMBER|INVITE_GONE|NOT_OWNER|NOT_FOUND|NOT_DONE|CLAIMED|BANK_FULL|TAKE_LIMIT|BAD_CARD|GONE|sign in/.exec(text)?.[0];
  return new Error(code === 'sign in' ? 'CLOSED' : (code ?? text));
}

async function call(fn, args = {}) {
  if (!supabase) throw new Error('CLOSED');
  const { data, error } = await withTimeout(supabase.rpc(fn, args));
  if (error) throw named(error);
  return data;
}

const shape = (g) => (g ? {
  id: g.id, name: g.name, tag: g.tag, about: g.about ?? '', owner: g.owner,
  members: Number(g.members) || 0, createdAt: g.created_at
} : null);

/** My guild, or null. */
export async function myGuild() {
  const data = await call('my_guild');
  const row = Array.isArray(data) ? data[0] : data;
  return row?.id ? shape(row) : null;
}

export async function createGuild(name, tag, about = '') {
  const data = await call('create_guild', { p_name: name, p_tag: tag, p_about: about });
  return shape(Array.isArray(data) ? data[0] : data);
}

export async function joinGuild(id) {
  const data = await call('join_guild', { p_guild: id });
  return shape(Array.isArray(data) ? data[0] : data);
}

export async function leaveGuild() {
  await call('leave_guild');
}

/** The founder closes the guild: roster, windows and invitations with it. */
export async function deleteGuild() {
  await call('delete_guild');
}

/** Ask a friend into my guild. Asking twice keeps the standing invitation. */
export async function inviteToGuild(userId) {
  await call('invite_to_guild', { p_user: userId });
}

/** Invitations waiting for me, newest first. */
export async function myGuildInvites() {
  const data = await call('my_guild_invites');
  return (data ?? []).map((r) => ({
    id: r.id, guildId: r.guild_id, name: r.name ?? '?', tag: r.tag ?? '', about: r.about ?? '',
    members: Number(r.members) || 0, inviter: r.inviter, inviterName: r.inviter_name ?? '?', createdAt: r.created_at
  }));
}

export async function acceptGuildInvite(id) {
  const data = await call('accept_guild_invite', { p_invite: id });
  return shape(Array.isArray(data) ? data[0] : data);
}

export async function declineGuildInvite(id) {
  await call('decline_guild_invite', { p_invite: id });
}

export async function searchGuilds(term) {
  const data = await call('search_guilds', { p_term: String(term ?? '').trim() });
  return (data ?? []).map(shape);
}

/** Who is in a guild: { userId, username, level, joinedAt, score }, best first. */
export async function guildRoster(id) {
  const data = await call('guild_roster', { p_guild: id });
  return (data ?? []).map((r) => ({
    userId: r.user_id, username: r.username ?? '?', level: Number(r.level) || 1,
    joinedAt: r.joined_at, score: Number(r.score) || 0
  }));
}

/** One page of a guild window: { rows: [{ rank, guildId, name, tag, members, score }], page, more }. */
export async function guildBoard(window = 'daily', page = 0) {
  const data = await call('guild_board', { p_window: window, p_page: page });
  const rows = (data ?? []).map((r) => ({
    rank: Number(r.rank), guildId: r.guild_id, name: r.name ?? '?', tag: r.tag ?? '',
    members: Number(r.members) || 0, score: Number(r.score) || 0
  }));
  return { rows, page, more: rows.length === 20 };
}

/** My guild's standing in a window, or null when it has no score there yet. */
export async function myGuildRank(window = 'daily') {
  const data = await call('my_guild_rank', { p_window: window });
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return { rank: row.rank == null ? null : Number(row.rank), score: Number(row.score) || 0, total: Number(row.total) || 0 };
}

/* --- the hall (schema V10) --------------------------------------------------- */

const shapeLine = (m) => ({ id: m.id, sender: m.sender, name: m.sender_name || '?', body: m.body, createdAt: m.created_at });

/** The room's last sixty lines, oldest first. */
export async function guildChat() {
  const data = await call('guild_chat');
  return (data ?? []).map(shapeLine);
}

export async function guildSay(body) {
  const data = await call('guild_say', { p_body: String(body ?? '').trim().slice(0, 500) });
  return shapeLine(Array.isArray(data) ? data[0] : data);
}

/** This week's goal: { week, kind, target, progress, members, doneAt, claimed, reward }, or null. */
export async function guildGoal() {
  const data = await call('guild_goal');
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.kind) return null;
  return {
    week: row.week, kind: row.kind, target: Number(row.target) || 0, progress: Number(row.progress) || 0,
    members: Number(row.members) || 1, doneAt: row.done_at ?? null, claimed: Boolean(row.claimed), reward: Number(row.reward) || 0
  };
}

export async function guildGoalAdd(kind, amount) {
  await call('guild_goal_add', { p_kind: kind, p_amount: Math.max(0, Math.round(amount)) });
}

/** The goal's pay, as money. */
export async function guildGoalClaim() {
  return Number(await call('guild_goal_claim')) || 0;
}

const shapeDeposit = (r) => ({ id: r.id, donor: r.donor, donorName: r.donor_name || '?', card: r.card, createdAt: r.created_at });

export async function guildBank() {
  const data = await call('guild_bank');
  return (data ?? []).map(shapeDeposit);
}

export async function guildBankDonate(card) {
  const data = await call('guild_bank_donate', { p_card: card });
  return shapeDeposit(Array.isArray(data) ? data[0] : data);
}

/** Takes a card off the table; resolves to the card entry. */
export async function guildBankTake(id) {
  return await call('guild_bank_take', { p_id: id });
}

export async function guildBankTakesLeft() {
  return Number(await call('guild_bank_takes_left')) || 0;
}

/** This week's match and last week's result, or null without a guild. */
export async function guildMatch() {
  const data = await call('guild_match');
  const r = Array.isArray(data) ? data[0] : data;
  if (!r?.week) return null;
  return {
    week: r.week,
    opponent: r.opponent_id ? { id: r.opponent_id, name: r.opponent_name ?? '?', tag: r.opponent_tag ?? '', members: Number(r.opponent_members) || 0 } : null,
    myScore: Number(r.my_score) || 0, theirScore: Number(r.their_score) || 0,
    last: r.last_week ? {
      week: r.last_week, opponentName: r.last_opponent_name ?? '?',
      myScore: Number(r.last_my_score) || 0, theirScore: Number(r.last_their_score) || 0,
      won: r.last_won == null ? null : Boolean(r.last_won), claimed: Boolean(r.last_claimed)
    } : null
  };
}

export async function guildMatchClaim() {
  return Number(await call('guild_match_claim')) || 0;
}
