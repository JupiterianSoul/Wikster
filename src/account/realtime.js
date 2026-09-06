/**
 * THE LIVE WIRES
 * ----------------------------------------------------------------------------
 * Everything that happens to a player because of someone else - a message, a
 * request, a gift, a trade, a friend coming online, a score landing on the
 * board - used to be found by asking once a minute. These are Realtime
 * subscriptions, so it is found the moment it happens. Each one degrades to
 * nothing: a project without Realtime, or a socket that never comes up,
 * leaves the poll doing what it always did, one beat later.
 *
 * Three wires:
 *   openSocialFeed   postgres changes on the social tables, filtered to me
 *   openPresence     who is here right now, from a presence channel
 *   openBoardFeed    the leaderboard windows moving
 */

import { configured, supabase } from './client.js';

const drop = (channel) => {
  if (!channel) return;
  try { supabase.removeChannel(channel); } catch { /* already gone */ }
};

/**
 * Rows that arrive for me. `onEvent` gets { kind, type, row } for
 * 'message' | 'read' | 'delivery' | 'friendship' | 'trade', and
 * { kind: 'status', status } as the subscription comes and goes.
 */
export function openSocialFeed(selfId, onEvent) {
  if (!configured || !selfId) return { close() {} };
  let channel = null;
  try {
    channel = supabase.channel(`social:${selfId}`);
    const tell = (kind) => (payload) => {
      try { onEvent?.({ kind, type: payload.eventType, row: payload.new ?? payload.old ?? null }); } catch { /* a listener's problem */ }
    };
    const bind = (table, event, filter, kind) =>
      channel.on('postgres_changes', { event, schema: 'public', table, filter }, tell(kind));
    bind('messages', 'INSERT', `recipient=eq.${selfId}`, 'message');
    bind('messages', 'UPDATE', `sender=eq.${selfId}`, 'read');
    bind('deliveries', 'INSERT', `recipient=eq.${selfId}`, 'delivery');
    bind('friendships', '*', `addressee=eq.${selfId}`, 'friendship');
    bind('friendships', '*', `requester=eq.${selfId}`, 'friendship');
    bind('trades', '*', `recipient=eq.${selfId}`, 'trade');
    bind('trades', '*', `proposer=eq.${selfId}`, 'trade');
    channel.subscribe((status) => { try { onEvent?.({ kind: 'status', status }); } catch { /* ignore */ } });
  } catch {
    channel = null;
  }
  return { close() { drop(channel); channel = null; } };
}

/**
 * Who is here. Everyone signed in joins one presence channel keyed by their
 * id; being tracked on it is what "online" means. A player who set their
 * presence to hidden still joins, to see others, but is never tracked.
 * `onSync` gets the Set of ids present, or null when the channel is down.
 */
export function openPresence(selfId, { hidden = false } = {}, onSync) {
  if (!configured || !selfId) return { setHidden() {}, close() {} };
  let channel = null;
  let ready = false;
  let tracked = false;
  let wantHidden = Boolean(hidden);
  const settle = async () => {
    if (!ready || !channel) return;
    if (wantHidden) {
      if (tracked) { tracked = false; await channel.untrack(); }
    } else if (!tracked) {
      tracked = true;
      await channel.track({ at: new Date().toISOString() });
    }
  };
  try {
    channel = supabase.channel('presence:lobby', { config: { presence: { key: selfId } } });
    channel.on('presence', { event: 'sync' }, () => {
      try { onSync?.(new Set(Object.keys(channel.presenceState()))); } catch { /* ignore */ }
    });
    channel.subscribe((status) => {
      ready = status === 'SUBSCRIBED';
      if (ready) settle().catch(() => {});
      else { tracked = false; try { onSync?.(null); } catch { /* ignore */ } }
    });
  } catch {
    channel = null;
  }
  return {
    setHidden(value) { wantHidden = Boolean(value); settle().catch(() => {}); },
    close() { drop(channel); channel = null; ready = false; tracked = false; }
  };
}

/**
 * Invitations posted to me. Its own channel on purpose: a project that has
 * not run schema V9 has no guild_invites table, and a binding on a table
 * that is not there fails the whole channel it sits in. Alone, it costs
 * nothing but itself.
 */
export function openGuildInviteFeed(selfId, onInvite) {
  if (!configured || !selfId) return { close() {} };
  let channel = null;
  try {
    channel = supabase.channel(`guild-invites:${selfId}`);
    channel.on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'guild_invites', filter: `invitee=eq.${selfId}` },
      (payload) => { try { onInvite?.(payload.new ?? null); } catch { /* a listener's problem */ } });
    channel.subscribe();
  } catch {
    channel = null;
  }
  return { close() { drop(channel); channel = null; } };
}

/** The three windows of the board moving under someone's score. */
export function openBoardFeed(onChange) {
  if (!configured) return { close() {} };
  let channel = null;
  try {
    channel = supabase.channel('board');
    for (const table of ['leaderboard_daily', 'leaderboard_weekly', 'leaderboard_alltime', 'guild_daily', 'guild_weekly', 'guild_alltime']) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => { try { onChange?.(); } catch { /* ignore */ } });
    }
    channel.subscribe();
  } catch {
    channel = null;
  }
  return { close() { drop(channel); channel = null; } };
}
