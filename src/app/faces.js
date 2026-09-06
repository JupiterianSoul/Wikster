/**
 * FACES
 * ----------------------------------------------------------------------------
 * A picture and a frame for anyone whose name is on screen: the guild
 * roster, the hall, the table, the board. Friends are already known with
 * their avatar; everyone else is read from the profiles table in one batch
 * per screen and kept for the session, so a board of fifty is one read and
 * a repaint is none.
 */
import * as account from '../account.js';
import { state } from './core.js';
import { paintAvatarInto } from './social.js';

/** id -> profile row (username, level, avatar), or null when unknown. */
const known = new Map();

const friendRow = (id) => state.social?.friends?.find((f) => f.otherId === id)?.profile ?? null;

/** What is known now, without a read: a friend's row, or one fetched before. */
export function faceOf(id) {
  return friendRow(id) ?? known.get(id) ?? null;
}

/** Reads the rows not yet known; resolves when every id has an answer. */
export async function facesFor(ids) {
  const wanted = [...new Set(ids.filter(Boolean))].filter((id) => !faceOf(id) && !known.has(id));
  if (!wanted.length || !account.configured) return;
  let rows = [];
  try { rows = await account.profilesById(wanted.slice(0, 100)); } catch { rows = []; }
  for (const id of wanted) known.set(id, rows.find((r) => r.id === id) ?? null);
}

/** A row a friend feed just changed: forget it, so the next paint reads again. */
export const forgetFace = (id) => { known.delete(id); };

/**
 * Paints every mark in `root` that names a person (`data-face="<id>"`)
 * with what is known, reading the rest first. `fallback` names what to
 * show before and without a row: the initial of the name in the mark.
 */
export async function paintFaces(root, { fallback = null } = {}) {
  const marks = [...root.querySelectorAll('[data-face]')];
  const paint = () => {
    for (const mark of marks) {
      const row = faceOf(mark.dataset.face);
      if (row) paintAvatarInto(mark, row);
      else if (fallback) paintAvatarInto(mark, { username: fallback(mark), level: Number(mark.dataset.level) || 1 });
    }
  };
  paint();
  await facesFor(marks.map((m) => m.dataset.face));
  if (root.isConnected) paint();
}
