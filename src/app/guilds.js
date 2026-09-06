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

import { t } from '../i18n.js';
import { iconSvg } from '../data/icons.js';
import { Segmented, press } from '../ui/components.js';
import { synth } from '../ui/sound.js';
import { formatAmount } from '../pricing.js';
import { formatCountdown } from '../shop.js';
import * as leaderboard from '../leaderboard.js';
import * as account from '../account.js';
import { on } from '../ui/bus.js';
import { gameStage, houseError } from './arcade.js';
import { el, esc, state, toast } from './core.js';
import { describeError, showGate, signedIn, userId } from './gate.js';
import { boardNode, boardRow } from './quests.js';
import { paintPanel } from './panel.js';

const WINDOWS = ['daily', 'weekly', 'alltime'];

/** What the screen holds between paints. */
export const guildView = { window: 'daily', page: 0, rows: [], roster: [], results: [], ranks: {} };

let seg = null;
let feed = null;
let repaint = null;
let leaveArmed = null;
let wired = false;

const guildError = (error) => {
  const code = String(error?.message ?? '');
  return /^(ALREADY_IN_GUILD|NAME_TAKEN|TAG_TAKEN|GUILD_FULL|NOT_FOUND|SCHEMA)$/.test(code) ? t(`guildErr_${code}`) : describeError(error);
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
  }
  paintPanel({ force: true });
}

function paintHome(g) {
  el.guildTag.textContent = g.tag;
  el.guildName.textContent = g.name;
  el.guildAbout.textContent = g.about || '';
  el.guildAbout.hidden = !g.about;
  const role = g.owner === userId() ? t('guildOwner') : t('guildMember');
  el.guildMeta.textContent = `${t('guildMembers', { n: g.members })} · ${role}`;
  el.guildLeave.textContent = t('guildLeave');
  el.guildLeave.classList.remove('btn-danger');
  leaveArmed = null;
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
  join.textContent = g.members >= 50 ? t('guildFull') : t('guildJoin');
  join.disabled = g.members >= 50;
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
      leaveArmed = setTimeout(() => { leaveArmed = null; el.guildLeave.textContent = t('guildLeave'); el.guildLeave.classList.remove('btn-danger'); }, 4000);
      el.guildLeave.textContent = t('guildLeaveSure');
      el.guildLeave.classList.add('btn-danger');
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
  on('score', boardMoved);
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

/** The board, and the guild's own numbers, move as scores land. */
function boardMoved() {
  if (state.tab !== 'guilds') return;
  clearTimeout(repaint);
  repaint = setTimeout(() => {
    if (state.tab !== 'guilds') return;
    guildView.page = 0;
    loadGuildBoard({ quiet: true });
    if (state.guild) paintScores();
  }, 400);
}

function watchBoard() {
  if (feed) return;
  feed = account.openBoardFeed(boardMoved);
  const tick = setInterval(() => {
    if (state.tab !== 'guilds') { clearInterval(tick); feed?.close(); feed = null; clearTimeout(repaint); }
  }, 1000);
}
