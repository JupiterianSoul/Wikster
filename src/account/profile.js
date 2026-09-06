/* profile: split out of account.js */

import { USERNAME_RE, supabase } from './client.js';
import { isSchemaGap } from './schema.js';
import { live } from './live.js';

/* --- profile -------------------------------------------------------------------- */

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data;
}
/**
 * Create the profile row if this account has not got one yet.
 *
 * Returns null rather than throwing when there is no name to use, or when the
 * wanted name has been taken since sign-up - both are recoverable by asking
 * the player for a different one, which is what the gate does.
 */

export async function ensureProfile(userId, username = null) {
  const existing = await getProfile(userId);
  if (existing) return existing;

  const name = String(username ?? '').trim();
  if (!USERNAME_RE.test(name)) return null;

  const { data, error } = await supabase
    .from('profiles').insert({ id: userId, username: name }).select().single();
  if (error) {
    // A unique-constraint failure means someone else claimed it first; that is
    // a question for the player, not an error to abort sign-in on.
    if (String(error.message ?? '').toLowerCase().includes('duplicate key')) return null;
    throw error;
  }
  return data;
}
/**
 * The profile for a session, creating it from the name carried on the auth
 * user when this is the first sign-in after confirming an email address.
 */

export function profileForSession(session) {
  return (ensureProfile(session.user.id, session.user.user_metadata?.username ?? null));
}
/**
 * Publish the stats a friend is allowed to see. Sent alongside every save
 * push, so a friend list is one read rather than one save download per friend.
 */

export async function publishStats(userId, stats) {
  const row = {
    level: stats.level,
    rank: stats.rank,
    cards: stats.cards,
    unique_cards: stats.uniqueCards,
    boosters_opened: stats.boostersOpened,
    collection_value: stats.value,
    best_rarity: stats.bestRarity,
    play_ms: stats.playMs
  };
  // The badge shelf rides along where the project has the column (V12);
  // an older project takes the rest of the stats without it.
  if (Array.isArray(stats.badges) && live.badgeColumn !== false) {
    const { error } = await supabase.from('profiles').update({ ...row, badges: stats.badges }).eq('id', userId);
    if (!error) { live.badgeColumn = true; return; }
    if (!isSchemaGap(error)) throw error;
    live.badgeColumn = false;
  }
  const { error } = await supabase.from('profiles').update(row).eq('id', userId);
  if (error) throw error;
}
