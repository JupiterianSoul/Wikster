/* versus: the friend games, on the server (schema V13) */

import { supabase } from './client.js';

const TIMEOUT_MS = 10000;
const withTimeout = (promise) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), TIMEOUT_MS))
]);

const named = (error) => {
  const raw = String(error?.message ?? '');
  if (/does not exist|schema cache|could not find/i.test(raw)) return new Error('SCHEMA');
  const code = /(NOT_FRIEND|TOO_MANY|BAD_KIND|BAD_HAND|GONE|SETTLED|NOT_DONE|CLAIMED|NOT_FOUND)/.exec(raw);
  return new Error(code ? code[1] : raw || 'FAILED');
};

async function call(fn, args = {}) {
  if (!supabase) throw new Error('CLOSED');
  const { data, error } = await withTimeout(supabase.rpc(fn, args));
  if (error) throw named(error);
  return data;
}

const shape = (r) => (r ? {
  id: r.id, kind: r.kind, challenger: r.challenger, opponent: r.opponent,
  challengerName: r.challenger_name ?? null, opponentName: r.opponent_name ?? null,
  status: r.status, payload: r.payload ?? {}, reply: r.reply ?? null, result: r.result ?? null,
  claimed: Array.isArray(r.claimed) ? r.claimed : [], createdAt: r.created_at, updatedAt: r.updated_at
} : null);

/** Sets a challenge for a friend: the kind, and my half already played. */
export async function sendChallenge(userId, kind, payload) {
  const data = await call('challenge_send', { p_user: userId, p_kind: kind, p_payload: payload });
  return shape(Array.isArray(data) ? data[0] : data);
}

/** Everything on my table, newest first. */
export async function myChallenges() {
  const data = await call('my_challenges');
  return (data ?? []).map(shape);
}

/** My half as the opponent; comes back settled. */
export async function answerChallenge(id, reply) {
  const data = await call('challenge_answer', { p_id: id, p_reply: reply });
  return shape(Array.isArray(data) ? data[0] : data);
}

export async function declineChallenge(id) {
  await call('challenge_decline', { p_id: id });
}

/** My pay for a settled challenge, once. */
export async function claimChallenge(id) {
  return Number(await call('challenge_claim', { p_id: id })) || 0;
}
