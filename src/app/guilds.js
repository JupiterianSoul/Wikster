/**
 * GUILDS
 * ----------------------------------------------------------------------------
 * A name, a tag and up to fifty players, with a board of their own. Every
 * point a member scores lands on the guild's windows through the same
 * trigger that fills their own (schema V8), so nothing here counts points:
 * the screen reads what the server keeps and moves when it moves.
 *
 * Two rooms on one screen. Without a guild: a search and a founding form.
 * With one: the guild's card (tag, name, line, members, my part in it and
 * its standing in the three windows), the roster, and the way out. Under
 * both: the guild leaderboard, in the same shape as the players'.
 */

import { t, tx } from '../i18n.js';
import { iconSvg } from '../data/icons.js';
import { Segmented, press } from '../ui/components.js';
import { synth } from '../ui/sound.js';
import { formatAmount } from '../pricing.js';
import { rankFor } from '../progression.js';
import { formatCountdown } from '../shop.js';
import * as leaderboard from '../leaderboard.js';
import * as account from '../account.js';
import { on } from '../ui/bus.js';
import { gameStage, houseError } from './arcade.js';
import { el, esc, openSheet, state, toast } from './core.js';
import { describeError, showGate, signedIn, userId } from './gate.js';
import { boardNode, boardRow } from './quests.js';
import { paintPanel } from './panel.js';

const WINDOWS = ['daily', 'weekly', 'alltime'];

/** What the screen holds between paints. */
export const guildView = { window: 'daily', page: 0, rows: [], roster: [], results: [], ranks: {}, invites: [] };

const CAP = 50;

let seg = null;
let feed = null;
let repaint = null;
let leaveArmed = null;
let deleteArmed = null;
let wired = false;

const guildError = (error) => {
  const code = String(error?.message ?? '');
  return /^(ALREADY_IN_GUILD|NAME_TAKEN|TAG_TAKEN|GUILD_FULL|NOT_IN_GUILD|NOT_FRIEND|ALREADY_MEMBER|INVITE_GONE|NOT_OWNER|NOT_FOUND|SCHEMA)$/.test(code)
    ? t(`guildErr_${code}`) : describeError(error);
};

/** Asks the server which guild is mine, once per session and after a change. */
export async function loadMyGuild({ fresh = false } = {}) {
  if (!signedIn()) { state.guild = null; return null; }
  if (state.guild !== undefined && !fresh) return state.guild;
  try { state.guild = await account.myGuild(); } catch (error) {
    if (String(error?.message) === 'SCHEMA') state.guild = null;
    else throw error;
  }
  return state.guild;
}

export async function renderGuilds() {
  el.guildsTitle.textContent = t('tabGuilds');
  el.guildsIntro.textContent = t('guildsIntro');
  el.guildRosterLabel.textContent = t('guildRoster');
  el.guildInvitesLabel.textContent = t('guildInvitesLabel');
  el.guildCreateLabel.textContent = t('guildCreateLabel');
  el.guildBoardLabel.textContent = t('guildBoard');
  el.guildFindMark.innerHTML = iconSvg('search', { size: 18 });
  el.guildFindInput.placeholder = t('guildFindPlaceholder');
  el.guildFindInput.setAttribute('aria-label', t('guildFindPlaceholder'));
  el.guildFindGo.textContent = t('guildFindGo');
  el.guildCreateGo.textContent = t('guildCreateGo');
  el.guildCreate.querySelector('#guild-create-name-label').textContent = t('guildCreateName');
  el.guildCreate.querySelector('#guild-create-tag-label').textContent = t('guildCreateTag');
  el.guildCreate.querySelector('#guild-create-about-label').textContent = t('guildCreateAbout');
  wire();

  if (!signedIn()) {
    el.guildHome.hidden = true;
    el.guildJoin.hidden = true;
    el.guildBoard.replaceChildren(gameStage('podium', t('guildSignIn'), { label: t('gateSignIn'), run: () => showGate() }));
    return;
  }
  if (!seg) {
    seg = new Segmented(el.guildSeg, WINDOWS.map((id) => ({ id, label: t(`lb_${id}`) })), (id) => {
      guildView.window = id; guildView.page = 0; guildView.rows = [];
      loadGuildBoard();
    });
  }
  seg.select?.(guildView.window, { silent: true });

  try { await loadMyGuild({ fresh: true }); } catch (error) {
    el.guildHome.hidden = true;
    el.guildJoin.hidden = true;
    el.guildBoard.replaceChildren(gameStage('podium', houseError(error), { label: t('retry'), run: () => renderGuilds() }));
    return;
  }
  paintRooms();
  guildView.page = 0;
  guildView.rows = [];
  watchBoard();
  loadGuildBoard();
}

/** The two rooms: the guild's card and roster, or the search and the form. */
function paintRooms() {
  const g = state.guild;
  el.guildHome.hidden = !g;
  el.guildJoin.hidden = Boolean(g);
  if (g) paintHome(g);
  else {
    el.guildResults.replaceChildren(...guildView.results.map(resultRow));
    el.guildFindStatus.textContent = '';
    el.guildCreateStatus.textContent = '';
    paintInvites();
    loadInvites();
  }
  paintPanel({ force: true });
}

function paintHome(g) {
  const owner = g.owner === userId();
  el.guildTag.textContent = g.tag;
  el.guildName.textContent = g.name;
  el.guildAbout.textContent = g.about || '';
  el.guildAbout.hidden = !g.about;
  el.guildMeta.textContent = `${t('guildMembers', { n: g.members })} · ${t(owner ? 'guildOwner' : 'guildMember')}`;
  clearTimeout(leaveArmed);
  leaveArmed = null;
  el.guildLeave.textContent = t('guildLeave');
  el.guildLeave.classList.remove('btn-danger', 'is-armed');
  // Asking a friend in is any member's right; closing the guild is the
  // founder's alone, so the button is not there for anyone else.
  const full = g.members >= CAP;
  el.guildInvite.textContent = full ? t('guildFull') : t('guildInviteGo');
  el.guildInvite.disabled = full;
  clearTimeout(deleteArmed);
  deleteArmed = null;
  el.guildDelete.hidden = !owner;
  el.guildDelete.textContent = t('guildDelete');
  el.guildDelete.classList.remove('btn-danger', 'is-armed');
  paintScores();
  loadRoster(g);
}

/** The three windows, with the guild's standing in each. */
async function paintScores() {
  const labels = { daily: 'guildScoreToday', weekly: 'guildScoreWeek', alltime: 'guildScoreAll' };
  el.guildScores.replaceChildren(...WINDOWS.map((w) => {
    const cell = document.createElement('div');
    cell.className = 'guild-score';
    cell.dataset.window = w;
    cell.innerHTML = '<b class="tabular">…</b><span></span><small></small>';
    cell.querySelector('span').textContent = t(labels[w]);
    return cell;
  }));
  const ranks = await Promise.all(WINDOWS.map((w) => account.myGuildRank(w).catch(() => null)));
  if (state.tab !== 'guilds') return;
  WINDOWS.forEach((w, i) => {
    const r = ranks[i];
    guildView.ranks[w] = r;
    const cell = el.guildScores.querySelector(`[data-window="${w}"]`);
    if (!cell) return;
    cell.querySelector('b').textContent = formatAmount(r?.score ?? 0);
    cell.querySelector('small').textContent = r?.rank ? t('guildRank', { rank: r.rank, total: r.total }) : t('guildUnranked');
  });
}

async function loadRoster(g) {
  let roster = [];
  try { roster = await account.guildRoster(g.id); } catch { roster = []; }
  if (state.tab !== 'guilds' || state.guild?.id !== g.id) return;
  guildView.roster = roster;
  el.guildRoster.replaceChildren(...roster.map((m) => {
    const row = document.createElement('div');
    row.className = 'person';
    row.innerHTML = `
      <span class="person-mark" aria-hidden="true"></span>
      <span class="person-copy"><b></b><span class="guild-line"></span></span>
      <span class="person-actions"></span>`;
    row.querySelector('.person-mark').textContent = String(m.username).slice(0, 1).toUpperCase();
    row.querySelector('b').textContent = m.userId === userId() ? `${m.username} (${t('guildYou')})` : m.username;
    row.querySelector('.guild-line').textContent = t('guildRosterLine', { n: m.level, points: formatAmount(m.score) });
    if (m.userId === g.owner) {
      const tag = document.createElement('span');
      tag.className = 'chip';
      tag.textContent = t('guildOwner');
      row.querySelector('.person-actions').appendChild(tag);
    }
    return row;
  }));
}

/** A guild found by the search, with the way in. */
function resultRow(g) {
  const row = document.createElement('div');
  row.className = 'person';
  row.innerHTML = `
    <span class="person-mark guild-row-tag" aria-hidden="true"></span>
    <span class="person-copy"><b></b><span></span></span>
    <span class="person-actions"></span>`;
  row.querySelector('.person-mark').textContent = g.tag;
  row.querySelector('b').textContent = g.name;
  row.querySelector('.person-copy span').textContent = `${t('guildMembers', { n: g.members })}${g.about ? ` · ${g.about}` : ''}`;
  const join = document.createElement('button');
  join.type = 'button';
  join.className = 'btn btn-sm btn-primary';
  join.textContent = g.members >= CAP ? t('guildFull') : t('guildJoin');
  join.disabled = g.members >= CAP;
  press(join, { sound: null });
  join.addEventListener('click', async () => {
    join.disabled = true;
    try {
      const joined = await account.joinGuild(g.id);
      state.guild = joined;
      synth.playResolved();
      toast(esc(t('guildJoined', { name: joined.name })), 'ok');
      guildView.results = [];
      paintRooms();
      loadGuildBoard();
    } catch (error) {
      toast(esc(guildError(error)), 'error');
      synth.playDenied();
      join.disabled = false;
    }
  });
  row.querySelector('.person-actions').appendChild(join);
  return row;
}

/* --- invitations ---------------------------------------------------------- */

/**
 * What is waiting for me. Only ever asked for while I have no guild: an
 * invitation to a second one is nothing I can act on, and the server would
 * turn it down anyway.
 */
export async function loadInvites() {
  if (!signedIn() || state.guild) return;
  let invites = [];
  try { invites = await account.myGuildInvites(); } catch { return; }
  guildView.invites = invites;
  state.social.guildInvites = invites;
  if (state.tab === 'guilds' && !state.guild) paintInvites();
}

function paintInvites() {
  const invites = state.guild ? [] : guildView.invites;
  el.guildInvitesRoom.hidden = !invites.length;
  el.guildInvites.replaceChildren(...invites.map(inviteRow));
}

/** One invitation: who asked, into what, and the two answers. */
function inviteRow(invite) {
  const row = document.createElement('div');
  row.className = 'person';
  row.innerHTML = `
    <span class="person-mark guild-row-tag" aria-hidden="true"></span>
    <span class="person-copy"><b></b><span></span></span>
    <span class="person-actions"></span>`;
  row.querySelector('.person-mark').textContent = invite.tag;
  row.querySelector('b').textContent = invite.name;
  row.querySelector('.person-copy span').textContent =
    `${t('guildInvitedBy', { name: invite.inviterName })} · ${t('guildMembers', { n: invite.members })}`;

  const drop = (id) => {
    guildView.invites = guildView.invites.filter((i) => i.id !== id);
    state.social.guildInvites = guildView.invites;
    paintInvites();
  };
  const answer = (label, cls, run) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `btn btn-sm ${cls}`;
    btn.textContent = label;
    press(btn, { sound: null });
    btn.addEventListener('click', async () => {
      for (const other of row.querySelectorAll('button')) other.disabled = true;
      try { await run(); } catch (error) {
        toast(esc(guildError(error)), 'error');
        synth.playDenied();
        // A stale invitation is gone from the server; drop it here too.
        if (String(error?.message) === 'INVITE_GONE') drop(invite.id);
        else for (const other of row.querySelectorAll('button')) other.disabled = false;
      }
    });
    return btn;
  };
  row.querySelector('.person-actions').append(
    answer(t('guildInviteAccept'), 'btn-primary', async () => {
      const joined = await account.acceptGuildInvite(invite.id);
      state.guild = joined;
      guildView.invites = [];
      state.social.guildInvites = [];
      guildView.results = [];
      synth.playResolved();
      toast(esc(t('guildJoined', { name: joined.name })), 'ok');
      paintRooms();
      loadGuildBoard();
    }),
    answer(t('guildInviteDecline'), 'btn-ghost', async () => {
      await account.declineGuildInvite(invite.id);
      synth.playTap();
      drop(invite.id);
    })
  );
  return row;
}

/**
 * Asking friends in. The list is my friends: the ones already on the roster
 * are named as members and cannot be asked twice, and everyone else gets a
 * button that reports what the server said, whatever it said.
 */
async function openInviteSheet() {
  const g = state.guild;
  if (!g) return;
  let friends = state.social.friends ?? [];
  if (!friends.length) {
    try {
      const lists = await account.listFriendships(userId());
      Object.assign(state.social, lists, { loaded: true });
      friends = state.social.friends ?? [];
    } catch { /* whatever is loaded is what we show */ }
  }
  const inside = new Set(guildView.roster.map((m) => m.userId));
  openSheet(t('guildInviteTitle', { name: g.name }), (body) => {
    const note = document.createElement('p');
    note.className = 'muted';
    note.textContent = friends.length
      ? t('guildInviteNote', { n: Math.max(0, CAP - g.members) })
      : t('guildInviteNoFriends');
    body.appendChild(note);
    if (!friends.length) return;

    const list = document.createElement('div');
    list.className = 'pick-list';
    list.replaceChildren(...friends.map((entry) => {
      const row = document.createElement('div');
      row.className = 'pick-row is-static';
      row.innerHTML = `
        <span class="pick-copy"><b></b><span></span></span>
        <span class="pick-end"></span>`;
      const name = entry.profile?.username ?? '?';
      row.querySelector('b').textContent = name;
      const level = entry.profile?.level ?? 1;
      row.querySelector('.pick-copy span').textContent = t('friendsLevelLine', { n: level, rank: tx(rankFor(level).name) });
      const end = row.querySelector('.pick-end');
      if (inside.has(entry.otherId)) {
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.textContent = t('guildMember');
        end.appendChild(chip);
        return row;
      }
      const ask = document.createElement('button');
      ask.type = 'button';
      ask.className = 'btn btn-sm btn-primary';
      ask.textContent = t('guildInviteSend');
      press(ask, { sound: null });
      ask.addEventListener('click', async () => {
        ask.disabled = true;
        try {
          await account.inviteToGuild(entry.otherId);
          ask.textContent = t('guildInvited');
          ask.classList.remove('btn-primary');
          ask.classList.add('btn-ghost');
          synth.playResolved();
          toast(esc(t('guildInviteSent', { name })), 'ok');
        } catch (error) {
          toast(esc(guildError(error)), 'error');
          synth.playDenied();
          ask.disabled = false;
        }
      });
      end.appendChild(ask);
      return row;
    }));
    body.appendChild(list);
  });
}

/** The forms and the buttons, bound once. */
function wire() {
  if (wired) return;
  wired = true;
  el.guildFind.addEventListener('submit', async (event) => {
    event.preventDefault();
    const term = el.guildFindInput.value.trim();
    if (!term) { el.guildFindStatus.textContent = t('guildFindEmpty'); return; }
    el.guildFindGo.disabled = true;
    el.guildFindStatus.textContent = '';
    try {
      guildView.results = await account.searchGuilds(term);
      el.guildResults.replaceChildren(...guildView.results.map(resultRow));
      el.guildFindStatus.textContent = guildView.results.length ? '' : t('guildFindNone');
    } catch (error) {
      el.guildFindStatus.textContent = guildError(error);
    }
    el.guildFindGo.disabled = false;
  });
  el.guildCreate.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = new FormData(el.guildCreate);
    const name = String(form.get('name') ?? '').trim();
    const tag = String(form.get('tag') ?? '').trim().toUpperCase();
    const about = String(form.get('about') ?? '').trim();
    if (!/^[A-Z0-9]{2,5}$/.test(tag)) { el.guildCreateStatus.textContent = t('guildTagBad'); return; }
    el.guildCreateGo.disabled = true;
    el.guildCreateStatus.textContent = '';
    try {
      const made = await account.createGuild(name, tag, about);
      state.guild = made;
      el.guildCreate.reset();
      synth.playFanfare();
      toast(esc(t('guildCreated', { name: made.name })), 'ok');
      paintRooms();
      loadGuildBoard();
    } catch (error) {
      el.guildCreateStatus.textContent = guildError(error);
      synth.playDenied();
    }
    el.guildCreateGo.disabled = false;
  });
  press(el.guildLeave, { sound: null });
  el.guildLeave.addEventListener('click', async () => {
    // Two taps: the first arms it and says so, the second leaves.
    if (leaveArmed == null) {
      leaveArmed = setTimeout(() => { leaveArmed = null; el.guildLeave.textContent = t('guildLeave'); el.guildLeave.classList.remove('btn-danger', 'is-armed'); }, 4000);
      el.guildLeave.textContent = t('guildLeaveSure');
      el.guildLeave.classList.add('btn-danger', 'is-armed');
      synth.playTap();
      return;
    }
    clearTimeout(leaveArmed);
    leaveArmed = null;
    el.guildLeave.disabled = true;
    try {
      await account.leaveGuild();
      state.guild = null;
      toast(esc(t('guildLeft')), 'ok');
      synth.playResolved();
      paintRooms();
      loadGuildBoard();
    } catch (error) {
      toast(esc(guildError(error)), 'error');
    }
    el.guildLeave.disabled = false;
  });
  press(el.guildInvite, { sound: null });
  el.guildInvite.addEventListener('click', () => { synth.playTap(); openInviteSheet(); });
  press(el.guildDelete, { sound: null });
  el.guildDelete.addEventListener('click', async () => {
    // The same two taps as leaving, because this one cannot be undone.
    if (deleteArmed == null) {
      deleteArmed = setTimeout(() => { deleteArmed = null; el.guildDelete.textContent = t('guildDelete'); el.guildDelete.classList.remove('btn-danger', 'is-armed'); }, 4000);
      el.guildDelete.textContent = t('guildDeleteSure');
      el.guildDelete.classList.add('btn-danger', 'is-armed');
      synth.playTap();
      return;
    }
    clearTimeout(deleteArmed);
    deleteArmed = null;
    el.guildDelete.disabled = true;
    try {
      const name = state.guild?.name ?? '';
      await account.deleteGuild();
      state.guild = null;
      guildView.results = [];
      toast(esc(t('guildDeleted', { name })), 'ok');
      synth.playResolved();
      paintRooms();
      loadGuildBoard();
    } catch (error) {
      toast(esc(guildError(error)), 'error');
      synth.playDenied();
    }
    el.guildDelete.disabled = false;
  });
  on('score', boardMoved);
  // The heartbeat and the live wire both end at the same list; the screen
  // takes what they found rather than asking the server a second time.
  on('guild-invite', () => {
    guildView.invites = state.social.guildInvites ?? guildView.invites;
    if (state.tab === 'guilds' && !state.guild) paintInvites();
  });
}

/* --- the guild board ----------------------------------------------------- */

export async function loadGuildBoard({ quiet = false } = {}) {
  if (!signedIn()) return;
  const view = guildView;
  if (view.page === 0 && !quiet) el.guildBoard.replaceChildren(gameStage('podium', t('lbLoading')));
  let page;
  try { page = await account.guildBoard(view.window, view.page); } catch (error) {
    el.guildBoard.replaceChildren(gameStage('podium', guildError(error), { label: t('retry'), run: () => loadGuildBoard() }));
    return;
  }
  if (state.tab !== 'guilds') return;
  view.rows = view.page === 0 ? page.rows : [...view.rows, ...page.rows];
  view.more = page.more;
  const mine = state.guild?.id ?? null;
  const shape = {
    isMe: (r) => r.guildId === mine,
    nameOf: (r) => r.name,
    faceOf: (r) => r.tag,
    subOf: (r) => `${r.tag} · ${t('guildMembers', { n: r.members })}`,
    empty: t('guildBoardEmpty'),
    guild: true
  };
  const list = boardNode(view.rows, shape);
  // My guild pinned under the page when it is not on it.
  const rank = view.ranks[view.window];
  if (mine && rank?.rank && !view.rows.some((r) => r.guildId === mine)) {
    const pin = boardRow({ rank: rank.rank, guildId: mine, name: state.guild.name, tag: state.guild.tag, members: state.guild.members, score: rank.score }, { ...shape, cls: 'is-pinned' });
    list.appendChild(pin);
  }
  const reset = document.createElement('p');
  reset.className = 'lb-foot';
  const ms = leaderboard.msToReset(view.window);
  reset.innerHTML = `${iconSvg('clock', { size: 14 })}<span></span>`;
  reset.querySelector('span').textContent = ms == null ? t('lbForever')
    : t(view.window === 'weekly' ? 'lbResetWeekly' : 'lbResetDaily', { time: formatCountdown(ms) });
  list.appendChild(reset);
  if (view.more) {
    const more = document.createElement('button');
    more.type = 'button';
    more.className = 'btn btn-ghost btn-sm lb-more';
    more.textContent = t('lbMore');
    press(more, { sound: null });
    more.addEventListener('click', () => { synth.playTap(); view.page += 1; loadGuildBoard(); });
    list.appendChild(more);
  }
  el.guildBoard.replaceChildren(list);
}

/**
 * The board, and the guild's own numbers, move as scores land. The guild
 * itself is checked at the same moment: a member joining or leaving moves
 * the windows too, and so does the founder closing the whole thing, so this
 * is where a roster and a member count stop being stale. The card is only
 * repainted when something about the guild actually changed, so a score
 * landing never disarms a button somebody is halfway through pressing.
 */
function boardMoved() {
  if (state.tab !== 'guilds') return;
  clearTimeout(repaint);
  repaint = setTimeout(async () => {
    if (state.tab !== 'guilds') return;
    guildView.page = 0;
    loadGuildBoard({ quiet: true });
    if (!state.guild) return;
    paintScores();
    const was = state.guild;
    let fresh = was;
    try { fresh = await account.myGuild(); } catch { return; }
    if (state.tab !== 'guilds' || state.guild !== was) return;
    if (!fresh) { state.guild = null; paintRooms(); return; }
    state.guild = fresh;
    if (fresh.members !== was.members || fresh.owner !== was.owner || fresh.name !== was.name) {
      paintHome(fresh);
      paintPanel({ force: true });
    }
  }, 400);
}

function watchBoard() {
  if (feed) return;
  feed = account.openBoardFeed(boardMoved);
  const tick = setInterval(() => {
    if (state.tab !== 'guilds') { clearInterval(tick); feed?.close(); feed = null; clearTimeout(repaint); }
  }, 1000);
}
