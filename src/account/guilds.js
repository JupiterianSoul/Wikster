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
  const code = /ALREADY_IN_GUILD|NAME_TAKEN|TAG_TAKEN|GUILD_FULL|NOT_FOUND|sign in/.exec(text)?.[0];
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
