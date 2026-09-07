/**
 * WHAT THE CREATOR HANDED OVER
 * ============================================================================
 * The creator's tools do not edit a save. They write a row in public.grants
 * saying what to hand over, and this reads the rows waiting for the signed-in
 * account so the game can put them away itself.
 *
 * That indirection is not ceremony, it is the only thing that works. Writing
 * the save from outside meant guessing the game's own storage shapes, and a
 * guess that is close but wrong lands and is read past rather than failing: a
 * booster written as a number where the game keeps { spec, count } simply was
 * not there. And the profile key is rewritten by this device immediately before
 * every push, so anything the creator put in it lost the merge every time.
 *
 * Applying a row here means calling the game's own writers, on this device,
 * now. The shapes cannot drift because nothing is restating them, and the write
 * is the newest by construction.
 */

import { supabase } from './client.js';
import { isSchemaGap } from './schema.js';

/** False once the project turns out not to have the table, so it is asked once. */
let present = true;

/**
 * Everything waiting for this account, oldest first.
 *
 * A project whose schema has not been updated has no such table. That is not an
 * error worth showing anybody: the game simply has nothing to hand over.
 */
export async function waitingGrants(userId) {
  if (!present || !userId) return [];
  const { data, error } = await supabase
    .from('grants')
    .select('id, at, kind, payload, note_en, note_fr')
    .eq('user_id', userId)
    .is('claimed_at', null)
    .order('at', { ascending: true })
    .limit(100);
  if (error) {
    if (isSchemaGap(error)) { present = false; return []; }
    throw error;
  }
  return data ?? [];
}

/**
 * Mark rows claimed, so they are handed over exactly once.
 *
 * Called after the game has applied them and written them to storage, never
 * before: a claim that lands and an apply that does not is a gift that
 * evaporates, and the other order at worst hands the same gift twice, which is
 * the survivable failure of the two.
 */
export async function claimGrants(ids) {
  if (!present || !ids.length) return false;
  const { error } = await supabase
    .from('grants')
    .update({ claimed_at: new Date().toISOString() })
    .in('id', ids)
    .is('claimed_at', null);
  if (error) {
    if (isSchemaGap(error)) { present = false; return false; }
    throw error;
  }
  return true;
}
