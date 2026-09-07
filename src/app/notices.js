/**
 * WHAT THE CREATOR HAS TO SAY
 * ----------------------------------------------------------------------------
 * Two things arrive from the server rather than from this build: an
 * announcement everyone is meant to read, and the reason an account has been
 * stopped from doing things.
 *
 * Both are read-only here. Nothing in the app can write either of them, and
 * the policies in schema.sql see to it that a player can read announcements
 * meant for them and their own suspension, and nothing else.
 *
 * Neither is allowed to matter. An announcement that fails to load, a project
 * whose schema has not been updated, a device with no connection: all of them
 * end with the game carrying on exactly as it did before. A message from the
 * creator is not worth a broken launch.
 */
import { t, getLanguage } from '../i18n.js';
import { supabase } from '../account/client.js';
import { openSheet } from './core.js';
import { live } from './live.js';
import { isSchemaGap } from '../account/schema.js';

const SEEN_KEY = 'wikster.seenNotice.v1';

const seen = () => {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]')); }
  catch { return new Set(); }
};
const markSeen = (id) => {
  try {
    const all = seen();
    all.add(String(id));
    // A player who has been here a while should not carry a thousand ids
    // around: the last fifty is more than enough to stop a repeat.
    localStorage.setItem(SEEN_KEY, JSON.stringify([...all].slice(-50)));
  } catch { /* session only */ }
};

/** The newest live announcement this device has not already been shown. */
export async function fetchNotice() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('id, title_en, title_fr, body_en, body_fr, kind')
      .order('starts_at', { ascending: false })
      .limit(10);
    if (error) throw error;
    const already = seen();
    return (data ?? []).find((row) => !already.has(String(row.id))) ?? null;
  } catch (err) {
    // A project running an older schema simply has no announcements table.
    if (!isSchemaGap(err)) console.warn('announcements', err);
    return null;
  }
}

/**
 * Why this account cannot chat or trade, if it cannot.
 *
 * A player with no account has nothing to be suspended, and asking anyway
 * earns an honest 401 from a policy that only speaks to signed-in players. So
 * it does not ask.
 */
export async function fetchSuspension() {
  if (!supabase) return null;
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session) return null;
    const { data, error } = await supabase
      .from('suspensions')
      .select('reason, until, muted')
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    if (data.until && new Date(data.until) <= new Date()) return null;
    return data;
  } catch (err) {
    if (!isSchemaGap(err)) console.warn('suspension', err);
    return null;
  }
}

/* The French copy when the device is in French, and the English as the
   fallback, because an announcement written in a hurry may only have one. */
const pick = (row, field) => {
  const lang = getLanguage() === 'fr' ? 'fr' : 'en';
  return String(row[`${field}_${lang}`] || row[`${field}_en`] || '').trim();
};

/* The kind is a word and a colour, not a column nobody reads. An outage must
   not arrive looking like a gift. */
const KINDS = { note: 'noticeKindNote', warning: 'noticeKindWarning', gift: 'noticeKindGift', event: 'noticeKindEvent' };

export function openNotice(row) {
  markSeen(row.id);
  const kind = KINDS[row.kind] ? row.kind : 'note';
  openSheet(pick(row, 'title') || t('noticeTitle'), (body) => {
    const wrap = document.createElement('div');
    wrap.className = `notice-sheet notice-${kind}`;
    wrap.dataset.kindLabel = t(KINDS[kind]);
    const text = document.createElement('p');
    text.className = 'notice-body';
    text.textContent = pick(row, 'body');
    wrap.append(text);
    body.append(wrap);
  });
}

export function openSuspension(row) {
  openSheet(t(row.muted ? 'mutedTitle' : 'suspendedTitle'), (body) => {
    const wrap = document.createElement('div');
    wrap.className = 'notice-sheet notice-warning';
    wrap.dataset.kindLabel = t('noticeKindWarning');
    const lead = document.createElement('p');
    lead.className = 'notice-body';
    lead.textContent = t(row.muted ? 'mutedLead' : 'suspendedLead');
    wrap.append(lead);
    if (row.reason) {
      const why = document.createElement('p');
      why.className = 'notice-reason';
      why.textContent = row.reason;
      wrap.append(why);
    }
    const until = document.createElement('p');
    until.className = 'notice-until';
    until.textContent = row.until
      ? t('noticeUntil', { when: new Date(row.until).toLocaleDateString() })
      : t('noticeUntilLifted');
    wrap.append(until);
    body.append(wrap);
  });
}

/**
 * Called once a launch, after the sheets that were already queued.
 *
 * A suspension goes first when there is one: being told why the game has gone
 * quiet matters more than anything the creator wanted to announce.
 */
export function checkNotices() {
  setTimeout(async () => {
    const [suspension, notice] = await Promise.all([fetchSuspension(), fetchNotice()]);
    if (!suspension && !notice) return;
    let tries = 0;
    const attempt = () => {
      if (live.sheet?.open || document.querySelector('.reveal')) {
        if (tries++ < 120) setTimeout(attempt, 500);
        return;
      }
      if (suspension) openSuspension(suspension);
      else openNotice(notice);
    };
    attempt();
  }, 2600);
}
