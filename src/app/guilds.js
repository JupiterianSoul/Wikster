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
import { Bar, Segmented, press } from '../ui/components.js';
import { synth } from '../ui/sound.js';
import { CURRENCY_NAME, formatAmount } from '../pricing.js';
import { rankFor } from '../progression.js';
import * as store from '../collection.js';
import { rarityById, rarityRank } from '../data/rarities.js';
import { formatCountdown } from '../shop.js';
import * as leaderboard from '../leaderboard.js';
import * as account from '../account.js';
import { on } from '../ui/bus.js';
import { earnSeasonPoints, gameStage, houseError } from './arcade.js';
import { pointsForGuildGoal } from '../season.js';
import { el, esc, money, openSheet, refreshWallet, state, toast } from './core.js';
import { pushNote, whenText } from './drawer.js';
import { gainBooster } from './open.js';
import { live } from './live.js';
import { describeError, showGate, signedIn, userId } from './gate.js';
import { boardNode, boardRow } from './quests.js';
import { paintPanel } from './panel.js';

const WINDOWS = ['daily', 'weekly', 'season', 'alltime'];

/** What the screen holds between paints. */
export const guildView = {
  window: 'daily', page: 0, rows: [], roster: [], results: [], ranks: {}, invites: [],
  room: 'chat', chat: [], bank: [], takesLeft: 3, goal: null, match: null
};

/** The pay for a week's goal, on top of the money: five cards, Rare guaranteed. */
const GOAL_BOOSTER = { kind: 'open', themeId: null, rarityId: 'rare', cards: 5 };

const CAP = 50;

let seg = null;
let roomSeg = null;
let goalBar = null;
let feed = null;
let room = null;
let repaint = null;
let leaveArmed = null;
let deleteArmed = null;
let wired = false;

const guildError = (error) => {
  const code = String(error?.message ?? '');
  return /^(ALREADY_IN_GUILD|NAME_TAKEN|TAG_TAKEN|GUILD_FULL|NOT_IN_GUILD|NOT_FRIEND|ALREADY_MEMBER|INVITE_GONE|NOT_OWNER|NOT_FOUND|NOT_DONE|CLAIMED|BANK_FULL|TAKE_LIMIT|BAD_CARD|GONE|SCHEMA)$/.test(code)
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
  el.guildGoalLabel.textContent = t('guildGoalLabel');
  el.guildMatchLabel.textContent = t('guildMatchLabel');
  el.guildChatSend.textContent = t('chatSend');
  el.guildChatInput.placeholder = t('guildChatPlaceholder');
  el.guildBankDonate.textContent = t('guildBankDonate');
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
  watchRoom(g);
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
  paintHall();
}

/** The three windows, with the guild's standing in each. */
async function paintScores() {
  const labels = { daily: 'guildScoreToday', weekly: 'guildScoreWeek', season: 'guildScoreSeason', alltime: 'guildScoreAll' };
  el.guildScores.replaceChildren(...WINDOWS.filter((w) => w !== 'season').map((w) => {
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
    // The card keeps its three cells; the season's standing lives on the Season screen.
    if (w === 'season') return;
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

/* --- the hall: the goal, the match, the rooms ------------------------------ */

/** Everything under the card, loaded together and painted as each answers. */
function paintHall() {
  if (!roomSeg) {
    roomSeg = new Segmented(el.guildRoomsSeg, [
      { id: 'chat', label: t('guildRoomChat') }, { id: 'bank', label: t('guildRoomBank') }, { id: 'members', label: t('guildRoster') }
    ], (id) => { guildView.room = id; showRoom(); });
  } else {
    roomSeg.relabel([{ label: t('guildRoomChat') }, { label: t('guildRoomBank') }, { label: t('guildRoster') }]);
  }
  roomSeg.select(guildView.room, { silent: true });
  showRoom();
  loadGoal();
  loadMatch();
  loadChat();
  loadBank();
}

function showRoom() {
  el.guildRoomChat.hidden = guildView.room !== 'chat';
  el.guildRoomBank.hidden = guildView.room !== 'bank';
  el.guildRoomMembers.hidden = guildView.room !== 'members';
  if (guildView.room === 'chat') keepChatBottom();
}

/** The one wire for the guild on screen: the room, the table and the goal. */
function watchRoom(g) {
  if (room && room.id === g?.id) return;
  room?.close();
  room = null;
  if (!g) return;
  const wire = account.openGuildRoom(g.id, (event) => {
    if (state.tab !== 'guilds' || state.guild?.id !== g.id) return;
    if (event.kind === 'message' && event.row) {
      const line = { id: event.row.id, sender: event.row.sender, name: event.row.sender_name || '?', body: event.row.body, createdAt: event.row.created_at };
      if (!guildView.chat.some((m) => m.id === line.id)) { guildView.chat.push(line); paintChat(); }
      if (line.sender !== userId()) synth.playMessage();
    } else if (event.kind === 'bank') loadBank();
    else if (event.kind === 'goal') loadGoal();
  });
  room = { id: g.id, close: () => wire.close() };
}

/* --- the goal ----------------------------------------------------------------- */

async function loadGoal() {
  const g = state.guild;
  let goal = null;
  try { goal = await account.guildGoal(); } catch (error) {
    if (String(error?.message) === 'SCHEMA') { el.guildGoal.hidden = true; el.guildMatch.hidden = true; el.guildRoomsSeg.hidden = true; el.guildRoomChat.hidden = true; el.guildRoomBank.hidden = true; el.guildRoomMembers.hidden = false; }
    return;
  }
  if (state.tab !== 'guilds' || state.guild?.id !== g?.id) return;
  guildView.goal = goal;
  paintGoal();
}

/** What the goal asks, in words. */
export function goalText(goal) {
  return t(`guildGoal_${goal.kind}`, { n: formatAmount(goal.target) });
}

function paintGoal() {
  const goal = guildView.goal;
  el.guildGoal.hidden = !goal;
  if (!goal) return;
  if (!goalBar) goalBar = new Bar(el.guildGoalBar);
  const done = Boolean(goal.doneAt) || goal.progress >= goal.target;
  el.guildGoalText.textContent = goalText(goal);
  el.guildGoalLeft.textContent = done ? t('guildGoalDone') : t('guildEndsIn', { time: formatCountdown(leaderboard.msToReset('weekly') ?? 0) });
  goalBar.set(goal.target ? goal.progress / goal.target : 0);
  el.guildGoalCount.textContent = `${formatAmount(goal.progress)} / ${formatAmount(goal.target)}`;
  el.guildGoalReward.innerHTML = `${t('guildGoalPays')} ${money(goal.reward)} + ${esc(t('guildGoalBooster'))}`;
  el.guildGoalClaim.hidden = !done;
  el.guildGoalClaim.disabled = goal.claimed;
  el.guildGoalClaim.textContent = goal.claimed ? t('guildGoalClaimed') : t('guildGoalClaim');
  el.guildGoal.classList.toggle('is-done', done);
}

async function claimGoal() {
  el.guildGoalClaim.disabled = true;
  try {
    const paid = await account.guildGoalClaim();
    store.saveWallet(store.loadWallet() + paid);
    refreshWallet();
    gainBooster(GOAL_BOOSTER, 1);
    earnSeasonPoints(pointsForGuildGoal());
    if (guildView.goal) guildView.goal.claimed = true;
    synth.playFanfare();
    toast(esc(t('guildGoalPaid', { amount: `${formatAmount(paid)} ${CURRENCY_NAME}` })), 'ok');
    pushNote('shield', t('guildGoalPaid', { amount: `${formatAmount(paid)} ${CURRENCY_NAME}` }), 'guilds');
    paintGoal();
  } catch (error) {
    toast(esc(guildError(error)), 'error');
    synth.playDenied();
    el.guildGoalClaim.disabled = false;
  }
}

/* --- the match ---------------------------------------------------------------- */

async function loadMatch() {
  const g = state.guild;
  let match = null;
  try { match = await account.guildMatch(); } catch { return; }
  if (state.tab !== 'guilds' || state.guild?.id !== g?.id) return;
  guildView.match = match;
  paintMatch();
}

function paintMatch() {
  const g = state.guild;
  const match = guildView.match;
  el.guildMatch.hidden = !match || !g;
  if (!match || !g) return;
  el.guildMatchLeft.textContent = t('guildEndsIn', { time: formatCountdown(leaderboard.msToReset('weekly') ?? 0) });
  const side = (tag, name, score, mine, leading) => {
    const cell = document.createElement('div');
    cell.className = `guild-side${mine ? ' is-mine' : ''}${leading ? ' is-leading' : ''}`;
    cell.innerHTML = '<span class="guild-side-tag"></span><b class="guild-side-name"></b><span class="guild-side-score tabular"></span>';
    cell.querySelector('.guild-side-tag').textContent = tag;
    cell.querySelector('.guild-side-name').textContent = name;
    cell.querySelector('.guild-side-score').textContent = formatAmount(score);
    return cell;
  };
  const vs = document.createElement('span');
  vs.className = 'guild-vs';
  vs.textContent = t('guildVersus');
  if (match.opponent) {
    const lead = match.myScore === match.theirScore ? null : match.myScore > match.theirScore;
    el.guildVersus.replaceChildren(
      side(g.tag, g.name, match.myScore, true, lead === true), vs,
      side(match.opponent.tag, match.opponent.name, match.theirScore, false, lead === false)
    );
  } else {
    const alone = document.createElement('p');
    alone.className = 'muted';
    alone.textContent = t('guildMatchNone');
    el.guildVersus.replaceChildren(side(g.tag, g.name, match.myScore, true, false), alone);
  }
  const last = match.last;
  el.guildMatchLast.hidden = !last || last.won == null;
  if (last && last.won != null) {
    el.guildMatchLast.replaceChildren();
    const line = document.createElement('span');
    line.textContent = t(last.won ? 'guildMatchWon' : 'guildMatchLost', { name: last.opponentName, mine: formatAmount(last.myScore), theirs: formatAmount(last.theirScore) });
    el.guildMatchLast.appendChild(line);
    if (last.won) {
      const claim = document.createElement('button');
      claim.type = 'button';
      claim.className = 'btn btn-primary btn-sm';
      claim.textContent = last.claimed ? t('guildGoalClaimed') : t('guildMatchClaim');
      claim.disabled = last.claimed;
      press(claim, { sound: null });
      claim.addEventListener('click', async () => {
        claim.disabled = true;
        try {
          const paid = await account.guildMatchClaim();
          store.saveWallet(store.loadWallet() + paid);
          refreshWallet();
          last.claimed = true;
          synth.playFanfare();
          toast(esc(t('guildMatchPaid', { amount: `${formatAmount(paid)} ${CURRENCY_NAME}` })), 'ok');
          paintMatch();
        } catch (error) {
          toast(esc(guildError(error)), 'error');
          synth.playDenied();
          claim.disabled = false;
        }
      });
      el.guildMatchLast.appendChild(claim);
    }
  }
}

/* --- the room ----------------------------------------------------------------- */

async function loadChat() {
  const g = state.guild;
  let lines = [];
  try { lines = await account.guildChat(); } catch { return; }
  if (state.tab !== 'guilds' || state.guild?.id !== g?.id) return;
  guildView.chat = lines;
  paintChat();
}

function keepChatBottom() {
  requestAnimationFrame(() => { el.guildChatLog.scrollTop = el.guildChatLog.scrollHeight; });
}

/** The room's lines: name over each bubble that is not mine, time in the corner. */
function paintChat() {
  const mine = userId();
  const lines = guildView.chat;
  if (!lines.length) {
    const empty = document.createElement('p');
    empty.className = 'muted guild-chat-empty';
    empty.textContent = t('guildChatEmpty');
    el.guildChatLog.replaceChildren(empty);
    return;
  }
  let lastSender = null;
  el.guildChatLog.replaceChildren(...lines.map((m) => {
    const own = m.sender === mine;
    const bubble = document.createElement('div');
    bubble.className = `bubble${own ? ' is-mine' : ''}`;
    if (!own && m.sender !== lastSender) {
      const who = document.createElement('span');
      who.className = 'bubble-who';
      who.textContent = m.name;
      bubble.appendChild(who);
    }
    lastSender = m.sender;
    bubble.appendChild(document.createTextNode(m.body));
    const when = document.createElement('span');
    when.className = 'bubble-when';
    when.textContent = whenText(m.createdAt);
    bubble.appendChild(when);
    return bubble;
  }));
  keepChatBottom();
}

async function sayInRoom(event) {
  event.preventDefault();
  const text = el.guildChatInput.value.trim();
  if (!text || !state.guild) return;
  el.guildChatInput.value = '';
  try {
    const line = await account.guildSay(text);
    if (!guildView.chat.some((m) => m.id === line.id)) { guildView.chat.push(line); paintChat(); }
    synth.playMessage();
  } catch (error) {
    el.guildChatInput.value = text;
    toast(esc(guildError(error)), 'error');
  }
}

/* --- the bank ----------------------------------------------------------------- */

async function loadBank() {
  const g = state.guild;
  let deposits = [];
  let left = guildView.takesLeft;
  try { [deposits, left] = await Promise.all([account.guildBank(), account.guildBankTakesLeft().catch(() => left)]); } catch { return; }
  if (state.tab !== 'guilds' || state.guild?.id !== g?.id) return;
  guildView.bank = deposits;
  guildView.takesLeft = Math.max(0, Number(left) || 0);
  paintBank();
}

function paintBank() {
  const deposits = guildView.bank;
  el.guildBankNote.textContent = t('guildBankNote', { n: deposits.length, left: guildView.takesLeft });
  if (!deposits.length) {
    const empty = document.createElement('p');
    empty.className = 'muted';
    empty.textContent = t('guildBankEmpty');
    el.guildBank.replaceChildren(empty);
    return;
  }
  el.guildBank.replaceChildren(...deposits.map((d) => {
    const card = d.card ?? {};
    const rarity = rarityById(card.rarityId);
    const row = document.createElement('div');
    row.className = 'person guild-deposit';
    row.innerHTML = `
      <span class="pick-thumb" aria-hidden="true"></span>
      <span class="person-copy"><b></b><span></span></span>
      <span class="person-actions"></span>`;
    if (card.thumbnail) row.querySelector('.pick-thumb').style.backgroundImage = `url("${card.thumbnail}")`;
    row.querySelector('b').textContent = card.title ?? '?';
    const line = row.querySelector('.person-copy span');
    line.textContent = `${tx(rarity.name)} · ${t('guildBankFrom', { name: d.donorName })}`;
    line.style.color = rarity.color;
    const take = document.createElement('button');
    take.type = 'button';
    take.className = 'btn btn-sm btn-primary';
    take.textContent = t('guildBankTake');
    take.disabled = guildView.takesLeft <= 0;
    press(take, { sound: null });
    take.addEventListener('click', async () => {
      take.disabled = true;
      try {
        const taken = await account.guildBankTake(d.id);
        store.receiveCardEntry(state.collection, { ...taken, count: 1 });
        guildView.bank = guildView.bank.filter((x) => x.id !== d.id);
        guildView.takesLeft = Math.max(0, guildView.takesLeft - 1);
        synth.playResolved();
        toast(esc(t('guildBankTaken', { card: card.title ?? '?' })), 'ok');
        paintBank();
      } catch (error) {
        toast(esc(guildError(error)), 'error');
        synth.playDenied();
        if (String(error?.message) === 'GONE') { guildView.bank = guildView.bank.filter((x) => x.id !== d.id); paintBank(); }
        else take.disabled = false;
      }
    });
    row.querySelector('.person-actions').appendChild(take);
    return row;
  }));
}

/** Putting a duplicate on the table: only cards with a spare copy are offered. */
function openDonateSheet() {
  const spare = store.allEntries(state.collection)
    .filter((c) => !store.isLocked(c) && (c.count ?? 1) > 1)
    .sort((a, b) => rarityRank(b.rarityId) - rarityRank(a.rarityId));
  openSheet(t('guildBankDonateTitle'), (body) => {
    const note = document.createElement('p');
    note.className = 'muted';
    note.textContent = spare.length ? t('guildBankDonateNote') : t('guildBankNoSpare');
    body.appendChild(note);
    if (!spare.length) return;
    const list = document.createElement('div');
    list.className = 'pick-list';
    list.replaceChildren(...spare.map((card) => {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'pick-row';
      row.innerHTML = `
        <span class="pick-thumb"></span>
        <span class="pick-copy"><b></b><span></span></span>
        <span class="chip tabular">×${card.count}</span>`;
      if (card.thumbnail) row.querySelector('.pick-thumb').style.backgroundImage = `url("${card.thumbnail}")`;
      row.querySelector('b').textContent = card.title;
      const tier = row.querySelector('.pick-copy span');
      tier.textContent = tx(rarityById(card.rarityId).name);
      tier.style.color = rarityById(card.rarityId).color;
      press(row, { sound: null });
      row.addEventListener('click', async () => {
        row.disabled = true;
        const snapshot = store.takeCardCopy(state.collection, card.key);
        if (!snapshot) return;
        try {
          const deposit = await account.guildBankDonate(snapshot);
          guildView.bank.unshift(deposit);
          synth.playResolved();
          toast(esc(t('guildBankDonated', { card: card.title })), 'ok');
          live.sheet.hide();
          paintBank();
        } catch (error) {
          // The card comes home when the table would not take it.
          store.receiveCardEntry(state.collection, snapshot);
          toast(esc(guildError(error)), 'error');
          synth.playDenied();
          row.disabled = false;
        }
      });
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
  press(el.guildGoalClaim, { sound: null });
  el.guildGoalClaim.addEventListener('click', claimGoal);
  el.guildChatForm.addEventListener('submit', sayInRoom);
  press(el.guildBankDonate, { sound: null });
  el.guildBankDonate.addEventListener('click', () => { synth.playTap(); openDonateSheet(); });
  on('guild-goal', () => { if (state.tab === 'guilds' && state.guild) loadGoal(); });
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
    : t(view.window === 'weekly' ? 'lbResetWeekly' : view.window === 'season' ? 'lbResetSeason' : 'lbResetDaily', { time: formatCountdown(ms) });
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
    loadMatch();
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
    if (state.tab !== 'guilds') { clearInterval(tick); feed?.close(); feed = null; room?.close(); room = null; clearTimeout(repaint); }
  }, 1000);
}
