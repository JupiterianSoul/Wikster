/*
 * A fake Supabase, good enough for the account, sync and friends screens.
 *
 * Outbound network is blocked in this sandbox, so nothing can be tested
 * against a real project. What this DOES buy is that every request the app
 * makes is seen, answered in the shape PostgREST and GoTrue answer in, and
 * checked — including the row-level rules, which are enforced here rather than
 * assumed, so a screen that reads something it should not be able to fails.
 */
export const SUPA_URL = 'https://stub.supabase.co';
export const SUPA_KEY = 'stub-anon-key';

/**
 * One database, many pages. Two players are two browser contexts with their
 * own route handlers, and they have to be looking at the same server — so the
 * tables (and the id counter, or both players would be issued the same uuid)
 * are created once and passed in.
 */
export const newDatabase = () => ({
  users: new Map(),         // email -> { id, password, meta }
  profiles: new Map(),      // id -> profile row
  saves: new Map(),         // id -> { user_id, data, updated_at }
  savesHistory: [],         // { id, user_id, at, reason, cards, coins, data }: what the saves_history trigger files
  friendships: [],          // { id, requester, addressee, status, created_at }
  messages: [],             // { id, sender, recipient, body, created_at, read_at }
  deliveries: [],           // { id, sender, recipient, kind, payload, created_at, claimed_at }
  trades: [],               // { id, proposer, recipient, offer, ask, status, created_at }
  auctions: [],             // { id, seller, seller_name, card, start_price, current_bid, bidder, bidder_name, bid_count, ends_at, status, created_at }
  codex: new Map(),         // key -> { key, title, rarity, price, views, thumbnail, lang, found_at, found_by }
  wishlists: [],            // { owner, key, card, created_at }
  kudos: [],                // { owner, key, sender, created_at }: hearts on a showcase
  guilds: [],               // { id, name, tag, about, owner, members, created_at }
  guildMembers: [],         // { user_id, guild_id, joined_at }
  guildInvites: [],         // { id, guild_id, inviter, invitee, created_at }
  guildMessages: [],        // { id, guild_id, sender, sender_name, body, created_at }
  guildGoals: [],           // { guild_id, week, kind, target, progress, members, done_at }
  guildGoalClaims: [],      // { guild_id, week, user_id }
  guildBank: [],            // { id, guild_id, donor, donor_name, card, created_at }
  guildBankTakes: [],       // { user_id, day, n }
  guildMatches: [],         // { week, guild_a, guild_b, score_a, score_b }
  challenges: [],           // { id, kind, challenger, opponent, status, payload, reply, result, claimed, created_at, updated_at }
  guildMatchClaims: [],     // { week, user_id }
  goalKind: null,           // a suite may pin the week's goal kind
  tokens: new Map(),        // access_token -> user id
  seq: 0
});

/**
 * `schema` picks which shape of database to impersonate:
 *   'v2' (default) everything the app knows about
 *   'v1'           a project whose owner has not re-run schema.sql: no
 *                  social columns on profiles, and no messages/deliveries/
 *                  trades tables at all. The app must stay usable on this.
 */
/*
 * Async on purpose: the WebSocket route below is an init script, and an init
 * script added after the page has navigated is one the page never ran, so a
 * suite awaits this before its first goto.
 */
export async function installSupabase(page, { log = null, db = newDatabase(), schema = 'v2' } = {}) {
  const uuid = () => `00000000-0000-4000-8000-${String(++db.seq).padStart(12, '0')}`;

  const note = (method, url) => { if (log) log.push(`${method} ${url.replace(SUPA_URL, '')}`); };

  // The page is on 127.0.0.1 and the "server" is on another origin, so every
  // request is a CORS request and the preflight has to be answered like the
  // real one is.
  const CORS = {
    'access-control-allow-origin': '*',
    'access-control-allow-headers': '*',
    'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'access-control-expose-headers': 'content-range,x-supabase-api-version'
  };
  const preflight = (route) => route.fulfill({ status: 204, headers: CORS, body: '' });

  const json = (route, body, status = 200) => route.fulfill({
    status,
    headers: { ...CORS, 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  const fail = (route, message, status = 400, pgCode = null) =>
    json(route, { message, error: message, code: pgCode ?? status }, status);

  /* --- pretending to be the older schema ---------------------------------- */
  const V1_ABSENT_COLUMNS = ['avatar', 'presence', 'last_seen_at', 'visibility'];
  const V1_ABSENT_TABLES = ['messages', 'deliveries', 'trades', 'auctions', 'codex', 'wishlists'];
  /** Postgres 42703 — the exact refusal a missing column produces. */
  const noColumn = (route, name) =>
    fail(route, `column profiles.${name} does not exist`, 400, '42703');
  /** Postgres 42P01 — the exact refusal a missing table produces. */
  const noTable = (route, name) =>
    fail(route, `relation "public.${name}" does not exist`, 400, '42P01');

  /**
   * A PostgREST result set. `single()` and `maybeSingle()` ask for
   * `application/vnd.pgrst.object+json`, and the real server then returns a
   * bare object rather than a one-element array — returning the array anyway
   * is the difference between a working profile and an undefined username.
   */
  const rows = (route, list, status = 200) => {
    const accept = route.request().headers().accept ?? '';
    if (!accept.includes('vnd.pgrst.object+json')) return json(route, list, status);
    if (list.length === 1) return json(route, list[0], status);
    return json(route, {
      code: 'PGRST116',
      details: `Results contain ${list.length} rows, application/vnd.pgrst.object+json requires 1 row`,
      hint: null,
      message: 'JSON object requested, multiple (or no) rows returned'
    }, 406);
  };

  const session = (user) => {
    const token = `tok-${user.id}`;
    db.tokens.set(token, user.id);
    return {
      access_token: token, token_type: 'bearer', expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: `ref-${user.id}`,
      user: {
        id: user.id, aud: 'authenticated', role: 'authenticated', email: user.email,
        user_metadata: user.meta ?? {}, app_metadata: {}, created_at: new Date().toISOString()
      }
    };
  };

  /** Who is calling, from the bearer token. This is what stands in for auth.uid(). */
  const caller = (route) => {
    const auth = route.request().headers().authorization ?? '';
    return db.tokens.get(auth.replace(/^Bearer /, '')) ?? null;
  };

  /** Files a save row into the history the way the server's trigger does. */
  const fileSave = (row, reason) => {
    let cards = null; let coins = null;
    try { cards = Object.keys(JSON.parse(row.data?.data?.['wikster.collection.v3'] ?? '{}').entries ?? {}).length; } catch { /* unreadable */ }
    try { coins = Number(row.data?.data?.['wikster.wallet.v1']); if (!Number.isFinite(coins)) coins = null; } catch { /* unreadable */ }
    db.savesHistory.push({ id: ++db.seq, user_id: row.user_id, at: new Date().toISOString(), reason, cards, coins, data: row.data });
  };

  const areFriends = (a, b) => db.friendships.some((f) =>
    f.status === 'accepted' &&
    ((f.requester === a && f.addressee === b) || (f.requester === b && f.addressee === a)));

  // --- Realtime -------------------------------------------------------------
  //
  // A Phoenix socket the way Supabase Realtime answers one, over Playwright's
  // mocked WebSocket: joins with their postgres_changes bindings, presence
  // tracked per topic, user broadcasts relayed to the rest of the topic, and
  // the heartbeat answered so the client never gives up on it. Every REST
  // write above that a player may hear about calls db.emitChange(), which is
  // what stands in for the publication: a row reaches a socket only when its
  // binding matches and its user could have read the row.
  db.realtime ??= { sockets: new Set(), refs: 0 };
  const rt = db.realtime;
  const canSee = (user, table, row) => {
    if (!user || !row) return false;
    if (table === 'messages' || table === 'deliveries') return row.sender === user || row.recipient === user;
    if (table === 'friendships') return row.requester === user || row.addressee === user;
    if (table === 'trades') return row.proposer === user || row.recipient === user;
    if (table === 'guild_invites') return row.inviter === user || row.invitee === user;
    if (table === 'challenges') return row.challenger === user || row.opponent === user;
    if (table === 'guild_messages' || table === 'guild_bank' || table === 'guild_goals') {
      return db.guildMembers.some((m) => m.user_id === user && m.guild_id === row.guild_id);
    }
    return true;   // the board is public
  };
  const bindingMatches = (binding, table, type, row) => {
    if (binding.table !== table) return false;
    if (binding.event !== '*' && binding.event !== type) return false;
    const m = /^(\w+)=eq\.(.+)$/.exec(binding.filter ?? '');
    return !m || String(row?.[m[1]]) === m[2];
  };
  const push = (sock, msg) => { try { sock.ws.send(JSON.stringify(msg)); } catch { /* closed */ } };
  db.emitChange = (table, type, record, old = null) => {
    const row = type === 'DELETE' ? old : record;
    for (const sock of rt.sockets) {
      for (const [topic, join] of sock.joins) {
        const ids = join.bindings.filter((b) => bindingMatches(b, table, type, row) && canSee(sock.user, table, row)).map((b) => b.id);
        if (!ids.length) continue;
        push(sock, [null, null, topic, 'postgres_changes', { ids, data: {
          type, schema: 'public', table, commit_timestamp: new Date().toISOString(), columns: [],
          record: type === 'DELETE' ? {} : record, old_record: old ?? {}, errors: null
        } }]);
      }
    }
  };
  const presenceState = (topic) => {
    const state = {};
    for (const sock of rt.sockets) {
      const join = sock.joins.get(topic);
      if (join?.tracked) (state[join.presenceKey] ??= { metas: [] }).metas.push({ phx_ref: join.tracked.ref, ...join.tracked.meta });
    }
    return state;
  };
  const presenceDiff = (topic, joins, leaves) => {
    for (const sock of rt.sockets) if (sock.joins.has(topic)) push(sock, [null, null, topic, 'presence_diff', { joins, leaves }]);
  };
  const untrack = (sock, topic) => {
    const join = sock.joins.get(topic);
    if (!join?.tracked) return;
    const was = join.tracked;
    join.tracked = null;
    presenceDiff(topic, {}, { [join.presenceKey]: { metas: [{ phx_ref: was.ref, ...was.meta }] } });
  };
  const leaveTopic = (sock, topic) => { untrack(sock, topic); sock.joins.delete(topic); };
  const decodeBinaryPush = (buf) => {
    // kind 3: [3, joinRefLen, refLen, topicLen, eventLen, metaLen, encoding] + fields + payload
    if (buf[0] !== 3) return null;
    const lens = [buf[1], buf[2], buf[3], buf[4], buf[5]];
    const encoding = buf[6];
    let at = 7;
    const take = (n) => { const out = buf.subarray(at, at + n).toString('utf8'); at += n; return out; };
    const [joinRef, ref, topic, event, meta] = lens.map(take);
    const rest = buf.subarray(at);
    const payload = encoding === 1 ? JSON.parse(rest.toString('utf8') || 'null') : rest;
    return { joinRef, ref, topic, event, meta: meta ? JSON.parse(meta) : null, payload };
  };
  const onSocketMessage = (sock, raw) => {
    if (typeof raw !== 'string') {
      const msg = decodeBinaryPush(Buffer.from(raw));
      if (!msg) return;
      for (const other of rt.sockets) {
        if (other === sock || !other.joins.has(msg.topic)) continue;
        push(other, [null, null, msg.topic, 'broadcast', { type: 'broadcast', event: msg.event, payload: msg.payload }]);
      }
      push(sock, [msg.joinRef || null, msg.ref || null, msg.topic, 'phx_reply', { status: 'ok', response: {} }]);
      return;
    }
    let parsed;
    try { parsed = JSON.parse(raw); } catch { return; }
    const [joinRef, ref, topic, event, payload] = parsed;
    const reply = (response = {}) => push(sock, [joinRef ?? null, ref ?? null, topic, 'phx_reply', { status: 'ok', response }]);
    if (topic === 'phoenix' && event === 'heartbeat') return reply();
    if (event === 'phx_join') {
      const token = payload?.access_token;
      if (token) sock.user = db.tokens.get(token) ?? sock.user;
      const bindings = (payload?.config?.postgres_changes ?? []).map((b) => ({ ...b, id: ++rt.refs }));
      sock.joins.set(topic, { joinRef, bindings, presenceKey: payload?.config?.presence?.key ?? String(++rt.refs), tracked: null });
      reply({ postgres_changes: bindings.map((b) => ({ id: b.id, event: b.event, schema: b.schema, table: b.table, filter: b.filter })) });
      if (payload?.config?.presence?.enabled) push(sock, [null, null, topic, 'presence_state', presenceState(topic)]);
      return;
    }
    if (event === 'phx_leave') { leaveTopic(sock, topic); return reply(); }
    if (event === 'access_token') { if (payload?.access_token) sock.user = db.tokens.get(payload.access_token) ?? sock.user; return reply(); }
    if (event === 'presence') {
      const join = sock.joins.get(topic);
      if (!join) return reply();
      if (payload?.event === 'track') {
        untrack(sock, topic);
        join.tracked = { ref: String(++rt.refs), meta: payload.payload ?? {} };
        reply();
        presenceDiff(topic, { [join.presenceKey]: { metas: [{ phx_ref: join.tracked.ref, ...join.tracked.meta }] } }, {});
      } else {
        untrack(sock, topic);
        reply();
      }
      return;
    }
    if (event === 'broadcast') {
      for (const other of rt.sockets) {
        if (other === sock || !other.joins.has(topic)) continue;
        push(other, [null, null, topic, 'broadcast', payload]);
      }
      return reply();
    }
    reply();
  };
  await page.routeWebSocket(/stub\.supabase\.co\/realtime\/v1\/websocket/, (ws) => {
    const sock = { ws, user: null, joins: new Map() };
    rt.sockets.add(sock);
    ws.onMessage((raw) => onSocketMessage(sock, raw));
    ws.onClose(() => {
      for (const topic of [...sock.joins.keys()]) leaveTopic(sock, topic);
      rt.sockets.delete(sock);
    });
  });

  // --- GoTrue ---------------------------------------------------------------
  page.route(`${SUPA_URL}/auth/v1/**`, async (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') return preflight(route);
    const url = new URL(request.url());
    const path = url.pathname.replace('/auth/v1/', '');
    note(request.method(), request.url());
    const body = request.postData() ? JSON.parse(request.postData()) : {};

    if (path === 'signup') {
      if (db.users.has(body.email)) return fail(route, 'User already registered', 422);
      if ((body.password ?? '').length < 6) return fail(route, 'Password should be at least 6 characters', 422);
      const user = { id: uuid(), email: body.email, password: body.password, meta: body.data ?? {} };
      db.users.set(body.email, user);
      return json(route, session(user));
    }
    if (path === 'token') {
      const user = db.users.get(body.email);
      if (!user || user.password !== body.password) {
        return fail(route, 'Invalid login credentials', 400);
      }
      return json(route, session(user));
    }
    if (path === 'logout') return route.fulfill({ status: 204, headers: CORS, body: '' });
    if (path === 'recover') return json(route, {});
    if (path === 'user') {
      const id = caller(route);
      const user = [...db.users.values()].find((u) => u.id === id);
      return user ? json(route, session(user).user) : fail(route, 'Unauthorized', 401);
    }
    return json(route, {});
  });

  // --- PostgREST ------------------------------------------------------------
  page.route(`${SUPA_URL}/rest/v1/**`, async (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') return preflight(route);
    const url = new URL(request.url());
    const path = url.pathname.replace('/rest/v1/', '');
    const method = request.method();
    note(method, request.url());
    const me = caller(route);
    const body = request.postData() ? JSON.parse(request.postData()) : null;
    const params = url.searchParams;

    // Signed out, the bearer token is just the anon key. The schema grants
    // that role exactly one thing, so this stub does too.
    if (!me && path !== 'rpc/username_available') {
      return fail(route, 'JWT expired', 401);
    }

    /* -- rpc -- */
    if (path === 'rpc/username_available') {
      const taken = [...db.profiles.values()]
        .some((p) => p.username.toLowerCase() === String(body.name).toLowerCase());
      return json(route, !taken);
    }
    /* -- the leaderboard: scores seeded by the test as db.scores = [{ user_id, username, score }] -- */
    // The windows as the trigger keeps them: one total per player over every
    // score row, ranked. A test may seed db.scores = [{ user_id, username, score }].
    const board = () => {
      const totals = new Map();
      for (const r of db.scores ?? []) {
        const row = totals.get(r.user_id) ?? { user_id: r.user_id, username: r.username, score: 0 };
        row.score += r.score;
        totals.set(r.user_id, row);
      }
      return [...totals.values()].sort((a, b) => b.score - a.score);
    };
    if (path === 'rpc/leaderboard_page') {
      // Every window reads the same totals here; the season window included.
      const all = board();
      const page = Number(body.p_page) || 0;
      return json(route, all.slice(page * 20, page * 20 + 20).map((r, i) => ({ rank: page * 20 + i + 1, user_id: r.user_id, username: r.username, score: r.score })));
    }
    /* -- the hall: schema V10 -- */
    const weekKey = (at = Date.now()) => String(Math.floor((Math.floor(at / 86400000) + 4) / 7));
    const GOAL_BASE = { open: 12, points: 1500, new: 15, wikdle: 3 };
    const goalEnsure = (g) => {
      const wk = weekKey();
      const n = Math.max(1, db.guilds.find((x) => x.id === g)?.members ?? 1);
      let goal = db.guildGoals.find((x) => x.guild_id === g && x.week === wk);
      if (goal) {
        if (n > goal.members && !goal.done_at) {
          goal.members = n;
          goal.target = Math.max(goal.progress, Math.round(GOAL_BASE[goal.kind] * (1 + 0.5 * (n - 1))));
        }
        return goal;
      }
      const kind = db.goalKind ?? ['open', 'points', 'new', 'wikdle'][(g.charCodeAt(0) + Number(wk)) % 4];
      goal = { guild_id: g, week: wk, kind, target: Math.round(GOAL_BASE[kind] * (1 + 0.5 * (n - 1))), progress: 0, members: n, done_at: null };
      db.guildGoals.push(goal);
      return goal;
    };
    db.goalBump = (g, kind, amount) => {
      if (!g || !(amount > 0)) return;
      const goal = goalEnsure(g);
      if (goal.kind !== kind || goal.done_at) return;
      goal.progress = Math.min(goal.target, goal.progress + amount);
      if (goal.progress >= goal.target) goal.done_at = new Date().toISOString();
      db.emitChange?.('guild_goals', 'UPDATE', { ...goal });
    };
    const weeklyScore = (g) => guildTotals().find((x) => x.id === g)?.score ?? 0;
    if (path === 'rpc/submit_score') {
      // The server's rule: one row per game and day; a round replaces the
      // day's when it beats it (Wikdle counts once), never above the game's
      // maximum; the windows move by the difference.
      const max = { wikdle: 1400, duel: 3100, reveal: 1600, slots: 20000, quiz: 1000 }[body.p_game];
      if (!max) return fail(route, 'this game is not scored by the client', 400);
      if (body.p_points < 0 || body.p_points > max) return fail(route, 'points out of range', 400);
      db.scores ??= [];
      const username = db.profiles.get(me)?.username ?? 'someone';
      const found = db.scores.find((r) => r.user_id === me && r.game === body.p_game && r.day === body.p_day);
      const delta = found ? body.p_points - found.score : body.p_points;
      if (found) {
        if (body.p_game === 'wikdle' || body.p_points <= found.score) return json(route, null, 204);
        found.score = body.p_points;
      } else {
        db.scores.push({ user_id: me, username, game: body.p_game, day: body.p_day, score: body.p_points });
      }
      const mine = board().find((r) => r.user_id === me);
      for (const table of ['leaderboard_daily', 'leaderboard_weekly', 'leaderboard_alltime']) {
        db.emitChange?.(table, 'UPDATE', { user_id: me, score: mine?.score ?? 0, updated_at: new Date().toISOString() });
      }
      const g = db.guildMembers.find((m) => m.user_id === me)?.guild_id;
      if (g) for (const table of ['guild_daily', 'guild_weekly', 'guild_alltime']) db.emitChange?.(table, 'UPDATE', { guild_id: g, updated_at: new Date().toISOString() });
      if (g) db.goalBump(g, 'points', delta);
      return json(route, null, 204);
    }
    if (path === 'rpc/my_rank') {
      const all = board();
      const at = all.findIndex((r) => r.user_id === me);
      return json(route, at < 0 ? [] : [{ rank: at + 1, score: all[at].score, total: all.length }]);
    }
    /* -- guilds: the functions of schema V8, over the same score rows -- */
    const guildOf = (user) => db.guildMembers.find((m) => m.user_id === user)?.guild_id ?? null;
    const guildTotals = () => {
      const perUser = new Map(board().map((r) => [r.user_id, r.score]));
      const totals = new Map();
      for (const m of db.guildMembers) totals.set(m.guild_id, (totals.get(m.guild_id) ?? 0) + (perUser.get(m.user_id) ?? 0));
      return [...db.guilds].map((g) => ({ ...g, score: totals.get(g.id) ?? 0 })).filter((g) => g.score > 0)
        .sort((a, b) => b.score - a.score || a.created_at.localeCompare(b.created_at));
    };
    const emitGuild = (id) => {
      const row = guildTotals().find((g) => g.id === id);
      for (const table of ['guild_daily', 'guild_weekly', 'guild_alltime']) db.emitChange?.(table, 'UPDATE', { guild_id: id, score: row?.score ?? 0, updated_at: new Date().toISOString() });
    };
    if (path === 'rpc/my_guild') {
      const id = guildOf(me);
      return json(route, id ? db.guilds.find((g) => g.id === id) ?? null : null);
    }
    if (path === 'rpc/create_guild') {
      if (guildOf(me)) return fail(route, 'ALREADY_IN_GUILD', 400);
      const name = String(body.p_name ?? '').trim();
      const tag = String(body.p_tag ?? '').trim().toUpperCase();
      if (name.length < 3 || name.length > 24) return fail(route, 'violates check constraint', 400);
      if (!/^[A-Z0-9]{2,5}$/.test(tag)) return fail(route, 'violates check constraint', 400);
      if (db.guilds.some((g) => g.name.toLowerCase() === name.toLowerCase())) return fail(route, 'NAME_TAKEN', 400);
      if (db.guilds.some((g) => g.tag === tag)) return fail(route, 'TAG_TAKEN', 400);
      const row = { id: uuid(), name, tag, about: String(body.p_about ?? '').trim(), owner: me, members: 1, created_at: new Date().toISOString() };
      db.guilds.push(row);
      db.guildMembers.push({ user_id: me, guild_id: row.id, joined_at: new Date().toISOString() });
      return json(route, row);
    }
    if (path === 'rpc/join_guild') {
      if (guildOf(me)) return fail(route, 'ALREADY_IN_GUILD', 400);
      const row = db.guilds.find((g) => g.id === body.p_guild);
      if (!row) return fail(route, 'NOT_FOUND', 400);
      if (row.members >= 50) return fail(route, 'GUILD_FULL', 400);
      db.guildMembers.push({ user_id: me, guild_id: row.id, joined_at: new Date().toISOString() });
      row.members += 1;
      emitGuild(row.id);
      return json(route, row);
    }
    if (path === 'rpc/leave_guild') {
      const id = guildOf(me);
      if (!id) return json(route, null, 204);
      db.guildMembers = db.guildMembers.filter((m) => m.user_id !== me);
      const left = db.guildMembers.filter((m) => m.guild_id === id);
      const row = db.guilds.find((g) => g.id === id);
      if (!left.length) {
        db.guilds = db.guilds.filter((g) => g.id !== id);
        db.guildInvites = db.guildInvites.filter((i) => i.guild_id !== id);
      } else {
        row.members = left.length;
        if (row.owner === me) row.owner = [...left].sort((a, b) => a.joined_at.localeCompare(b.joined_at))[0].user_id;
      }
      emitGuild(id);
      return json(route, null, 204);
    }
    if (path === 'rpc/delete_guild') {
      const id = guildOf(me);
      if (!id) return fail(route, 'NOT_FOUND', 400);
      const row = db.guilds.find((g) => g.id === id);
      if (row?.owner !== me) return fail(route, 'NOT_OWNER', 400);
      db.guilds = db.guilds.filter((g) => g.id !== id);
      db.guildMembers = db.guildMembers.filter((m) => m.guild_id !== id);
      db.guildInvites = db.guildInvites.filter((i) => i.guild_id !== id);
      emitGuild(id);
      return json(route, null, 204);
    }
    if (path === 'rpc/invite_to_guild') {
      const id = guildOf(me);
      const guest = body.p_user;
      if (!guest || guest === me) return fail(route, 'NOT_FOUND', 400);
      if (!id) return fail(route, 'NOT_IN_GUILD', 400);
      const row = db.guilds.find((g) => g.id === id);
      if (row.members >= 50) return fail(route, 'GUILD_FULL', 400);
      if (!areFriends(me, guest)) return fail(route, 'NOT_FRIEND', 400);
      if (guildOf(guest)) return fail(route, 'ALREADY_MEMBER', 400);
      if (!db.guildInvites.some((i) => i.guild_id === id && i.invitee === guest)) {
        const invite = { id: uuid(), guild_id: id, inviter: me, invitee: guest, created_at: new Date().toISOString() };
        db.guildInvites.push(invite);
        db.emitChange?.('guild_invites', 'INSERT', invite);
      }
      return json(route, null, 204);
    }
    if (path === 'rpc/my_guild_invites') {
      return json(route, db.guildInvites.filter((i) => i.invitee === me).map((i) => {
        const g = db.guilds.find((row) => row.id === i.guild_id);
        return {
          id: i.id, guild_id: i.guild_id, name: g?.name ?? '?', tag: g?.tag ?? '', about: g?.about ?? '',
          members: g?.members ?? 0, inviter: i.inviter, inviter_name: db.profiles.get(i.inviter)?.username ?? '?',
          created_at: i.created_at
        };
      }).sort((a, b) => b.created_at.localeCompare(a.created_at)));
    }
    if (path === 'rpc/accept_guild_invite') {
      if (guildOf(me)) return fail(route, 'ALREADY_IN_GUILD', 400);
      const invite = db.guildInvites.find((i) => i.id === body.p_invite && i.invitee === me);
      if (!invite) return fail(route, 'INVITE_GONE', 400);
      const row = db.guilds.find((g) => g.id === invite.guild_id);
      if (!row) return fail(route, 'NOT_FOUND', 400);
      if (row.members >= 50) return fail(route, 'GUILD_FULL', 400);
      db.guildMembers.push({ user_id: me, guild_id: row.id, joined_at: new Date().toISOString() });
      row.members += 1;
      db.guildInvites = db.guildInvites.filter((i) => i.invitee !== me);
      emitGuild(row.id);
      return json(route, row);
    }
    /* -- versus: the friend games (V13) -- */
    const challengeRow = (c) => ({
      ...c, challenger_name: db.profiles.get(c.challenger)?.username ?? '?', opponent_name: db.profiles.get(c.opponent)?.username ?? '?'
    });
    const hand = (cards) => (Array.isArray(cards) ? cards : []).map((c) => Number(c?.views) || 0).sort((x, y) => y - x);
    const sortScore = (cards, order) => {
      const truth = [...(cards ?? [])].sort((x, y) => (Number(y.views) || 0) - (Number(x.views) || 0)).map((c) => c.key);
      return (Array.isArray(order) ? order : []).reduce((n, k, i) => n + (truth[i] === k ? 1 : 0), 0);
    };
    if (path === 'rpc/challenge_send') {
      const other = body.p_user;
      if (!other || other === me) return fail(route, 'NOT_FOUND', 400);
      if (!['clash', 'sort'].includes(body.p_kind)) return fail(route, 'BAD_KIND', 400);
      if (!areFriends(me, other)) return fail(route, 'NOT_FRIEND', 400);
      if (db.challenges.filter((c) => c.challenger === me && c.opponent === other && c.status === 'open').length >= 5) return fail(route, 'TOO_MANY', 400);
      if (!Array.isArray(body.p_payload?.cards)) return fail(route, 'BAD_HAND', 400);
      const now = new Date().toISOString();
      const row = { id: uuid(), kind: body.p_kind, challenger: me, opponent: other, status: 'open', payload: body.p_payload, reply: null, result: null, claimed: [], created_at: now, updated_at: now };
      db.challenges.push(row);
      db.emitChange?.('challenges', 'INSERT', row);
      return json(route, challengeRow(row));
    }
    if (path === 'rpc/my_challenges') {
      const cutoff = Date.now() - 14 * 86400000;
      return json(route, db.challenges
        .filter((c) => (c.challenger === me || c.opponent === me) && (c.status === 'open' || Date.parse(c.updated_at) > cutoff))
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 40).map(challengeRow));
    }
    if (path === 'rpc/challenge_decline') {
      const row = db.challenges.find((c) => c.id === body.p_id && c.status === 'open' && (c.opponent === me || c.challenger === me));
      if (!row) return fail(route, 'GONE', 400);
      row.status = 'declined'; row.updated_at = new Date().toISOString();
      db.emitChange?.('challenges', 'UPDATE', row);
      return json(route, null, 204);
    }
    if (path === 'rpc/challenge_answer') {
      const row = db.challenges.find((c) => c.id === body.p_id && c.opponent === me);
      if (!row) return fail(route, 'GONE', 400);
      if (row.status !== 'open') return fail(route, 'SETTLED', 400);
      const reply = body.p_reply ?? {};
      let result;
      if (row.kind === 'clash') {
        if (!Array.isArray(reply.cards) || !reply.cards.length) return fail(route, 'BAD_HAND', 400);
        const a = hand(row.payload.cards), b = hand(reply.cards);
        let sc = 0, so = 0;
        for (let i = 0; i < Math.min(a.length, 5); i++) {
          if (i >= b.length || a[i] > b[i]) sc++; else if (b[i] > a[i]) so++;
        }
        result = { winner: sc > so ? 'challenger' : so > sc ? 'opponent' : 'draw', scores: { challenger: sc, opponent: so } };
      } else {
        if (!Array.isArray(reply.order)) return fail(route, 'BAD_HAND', 400);
        const sc = sortScore(row.payload.cards, row.payload.order), so = sortScore(row.payload.cards, reply.order);
        const cm = Number(row.payload.ms) || 0, om = Number(reply.ms) || 0;
        const winner = sc > so ? 'challenger' : so > sc ? 'opponent' : cm < om ? 'challenger' : om < cm ? 'opponent' : 'draw';
        result = { winner, scores: { challenger: sc, opponent: so }, ms: { challenger: cm, opponent: om } };
      }
      row.reply = reply; row.result = result; row.status = 'done'; row.updated_at = new Date().toISOString();
      db.emitChange?.('challenges', 'UPDATE', row);
      return json(route, challengeRow(row));
    }
    if (path === 'rpc/challenge_claim') {
      const row = db.challenges.find((c) => c.id === body.p_id && (c.challenger === me || c.opponent === me));
      if (!row) return fail(route, 'GONE', 400);
      if (row.status !== 'done') return fail(route, 'NOT_DONE', 400);
      if (row.claimed.includes(me)) return fail(route, 'CLAIMED', 400);
      const side = row.challenger === me ? 'challenger' : 'opponent';
      const w = row.result.winner;
      row.claimed.push(me); row.updated_at = new Date().toISOString();
      return json(route, w === 'draw' ? 300 : w === side ? 600 : 150);
    }
    if (path === 'rpc/decline_guild_invite') {
      db.guildInvites = db.guildInvites.filter((i) => !(i.id === body.p_invite && i.invitee === me));
      return json(route, null, 204);
    }
    if (path === 'rpc/guild_say') {
      const g = guildOf(me);
      if (!g) return fail(route, 'NOT_IN_GUILD', 400);
      const text = String(body.p_body ?? '').trim().slice(0, 500);
      if (!text) return fail(route, 'violates check constraint', 400);
      const row = { id: uuid(), guild_id: g, sender: me, sender_name: db.profiles.get(me)?.username ?? '', body: text, created_at: new Date().toISOString() };
      db.guildMessages.push(row);
      db.emitChange?.('guild_messages', 'INSERT', row);
      return json(route, row);
    }
    if (path === 'rpc/guild_chat') {
      const g = guildOf(me);
      return json(route, db.guildMessages.filter((m) => m.guild_id === g).slice(-60));
    }
    if (path === 'rpc/guild_goal') {
      const g = guildOf(me);
      if (!g) return json(route, []);
      const goal = goalEnsure(g);
      return json(route, [{ ...goal, claimed: db.guildGoalClaims.some((c) => c.guild_id === g && c.week === goal.week && c.user_id === me), reward: 900 }]);
    }
    if (path === 'rpc/guild_goal_add') {
      if (!['open', 'new', 'wikdle'].includes(body.p_kind)) return fail(route, 'not a client kind', 400);
      db.goalBump(guildOf(me), body.p_kind, Math.min(100, Math.max(0, Number(body.p_amount) || 0)));
      return json(route, null, 204);
    }
    if (path === 'rpc/guild_goal_claim') {
      const g = guildOf(me);
      if (!g) return fail(route, 'NOT_IN_GUILD', 400);
      const goal = db.guildGoals.find((x) => x.guild_id === g && x.week === weekKey());
      if (!goal?.done_at) return fail(route, 'NOT_DONE', 400);
      if (db.guildGoalClaims.some((c) => c.guild_id === g && c.week === goal.week && c.user_id === me)) return fail(route, 'CLAIMED', 400);
      db.guildGoalClaims.push({ guild_id: g, week: goal.week, user_id: me });
      return json(route, 900);
    }
    if (path === 'rpc/guild_bank') {
      const g = guildOf(me);
      return json(route, db.guildBank.filter((d) => d.guild_id === g).slice().reverse().slice(0, 200));
    }
    if (path === 'rpc/guild_bank_donate') {
      const g = guildOf(me);
      if (!g) return fail(route, 'NOT_IN_GUILD', 400);
      const card = body.p_card;
      if (!card?.key || !card?.title) return fail(route, 'BAD_CARD', 400);
      if (db.guildBank.filter((d) => d.guild_id === g).length >= 200) return fail(route, 'BANK_FULL', 400);
      const row = { id: uuid(), guild_id: g, donor: me, donor_name: db.profiles.get(me)?.username ?? '', card, created_at: new Date().toISOString() };
      db.guildBank.push(row);
      db.emitChange?.('guild_bank', 'INSERT', row);
      return json(route, row);
    }
    if (path === 'rpc/guild_bank_take') {
      const g = guildOf(me);
      if (!g) return fail(route, 'NOT_IN_GUILD', 400);
      const day = new Date().toISOString().slice(0, 10);
      const takes = db.guildBankTakes.find((x) => x.user_id === me && x.day === day);
      if ((takes?.n ?? 0) >= 3) return fail(route, 'TAKE_LIMIT', 400);
      const at = db.guildBank.findIndex((d) => d.id === body.p_id && d.guild_id === g);
      if (at < 0) return fail(route, 'GONE', 400);
      const [taken] = db.guildBank.splice(at, 1);
      if (takes) takes.n += 1; else db.guildBankTakes.push({ user_id: me, day, n: 1 });
      db.emitChange?.('guild_bank', 'DELETE', null, taken);
      return json(route, taken.card);
    }
    if (path === 'rpc/guild_bank_takes_left') {
      const day = new Date().toISOString().slice(0, 10);
      return json(route, 3 - (db.guildBankTakes.find((x) => x.user_id === me && x.day === day)?.n ?? 0));
    }
    if (path === 'rpc/guild_match') {
      const g = guildOf(me);
      if (!g) return json(route, []);
      const wk = weekKey();
      const prev = weekKey(Date.now() - 7 * 86400000);
      let m = db.guildMatches.find((x) => x.week === wk && (x.guild_a === g || x.guild_b === g));
      if (!m) {
        const mine = weeklyScore(g);
        const other = db.guilds.filter((x) => x.id !== g && !db.guildMatches.some((y) => y.week === wk && (y.guild_a === x.id || y.guild_b === x.id)))
          .sort((a, b) => Math.abs(weeklyScore(a.id) - mine) - Math.abs(weeklyScore(b.id) - mine) || b.members - a.members)[0];
        if (other) { m = { week: wk, guild_a: g, guild_b: other.id, score_a: null, score_b: null }; db.guildMatches.push(m); }
      }
      const other = m ? (m.guild_a === g ? m.guild_b : m.guild_a) : null;
      const og = db.guilds.find((x) => x.id === other);
      const lm = db.guildMatches.find((x) => x.week === prev && (x.guild_a === g || x.guild_b === g));
      const lo = lm ? (lm.guild_a === g ? lm.guild_b : lm.guild_a) : null;
      const lmine = lm ? (lm.guild_a === g ? lm.score_a : lm.score_b) : null;
      const ltheirs = lm ? (lm.guild_a === g ? lm.score_b : lm.score_a) : null;
      return json(route, [{
        week: wk, opponent_id: other, opponent_name: og?.name ?? null, opponent_tag: og?.tag ?? null, opponent_members: og?.members ?? null,
        my_score: weeklyScore(g), their_score: other ? weeklyScore(other) : 0,
        last_week: lm?.week ?? null, last_opponent_name: db.guilds.find((x) => x.id === lo)?.name ?? null,
        last_my_score: lmine, last_their_score: ltheirs,
        last_won: lm && lm.score_a != null ? lmine > ltheirs : null,
        last_claimed: db.guildMatchClaims.some((c) => c.week === prev && c.user_id === me)
      }]);
    }
    if (path === 'rpc/guild_match_claim') {
      const g = guildOf(me);
      if (!g) return fail(route, 'NOT_IN_GUILD', 400);
      const prev = weekKey(Date.now() - 7 * 86400000);
      const lm = db.guildMatches.find((x) => x.week === prev && (x.guild_a === g || x.guild_b === g));
      if (!lm || lm.score_a == null) return fail(route, 'NOT_DONE', 400);
      const won = lm.guild_a === g ? lm.score_a > lm.score_b : lm.score_b > lm.score_a;
      if (!won) return fail(route, 'NOT_DONE', 400);
      if (db.guildMatchClaims.some((c) => c.week === prev && c.user_id === me)) return fail(route, 'CLAIMED', 400);
      db.guildMatchClaims.push({ week: prev, user_id: me });
      return json(route, 750);
    }
    if (path === 'rpc/search_guilds') {
      const term = String(body.p_term ?? '').toLowerCase();
      return json(route, db.guilds.filter((g) => !term || g.name.toLowerCase().includes(term) || g.tag.toLowerCase().includes(term))
        .sort((a, b) => b.members - a.members).slice(0, 20));
    }
    if (path === 'rpc/guild_roster') {
      const perUser = new Map(board().map((r) => [r.user_id, r.score]));
      return json(route, db.guildMembers.filter((m) => m.guild_id === body.p_guild).map((m) => ({
        user_id: m.user_id, username: db.profiles.get(m.user_id)?.username ?? '?', level: db.profiles.get(m.user_id)?.level ?? 1,
        joined_at: m.joined_at, score: perUser.get(m.user_id) ?? 0
      })).sort((a, b) => b.score - a.score));
    }
    if (path === 'rpc/guild_board') {
      const all = guildTotals();
      const page = Number(body.p_page) || 0;
      return json(route, all.slice(page * 20, page * 20 + 20).map((g, i) => ({ rank: page * 20 + i + 1, guild_id: g.id, name: g.name, tag: g.tag, members: g.members, score: g.score })));
    }
    if (path === 'rpc/my_guild_rank') {
      const id = guildOf(me);
      if (!id) return json(route, []);
      const all = guildTotals();
      const at = all.findIndex((g) => g.id === id);
      return json(route, [{ rank: at < 0 ? null : at + 1, score: at < 0 ? 0 : all[at].score, total: all.length }]);
    }
    if (path === 'rpc/friend_cards') {
      // The whole point of the function: only a friend gets anything, and only
      // the collection key, never the rest of the blob.
      const target = body.target;
      if (target !== me && !areFriends(me, target)) return json(route, { allowed: false });
      const save = db.saves.get(target);
      return json(route, {
        allowed: true,
        cards: save?.data?.data?.['wikster.collection.v3'] ?? null
      });
    }

    /* -- the market: same rules as the definer functions in schema.sql -- */
    const auctionFloor = (a) => (a.current_bid == null ? a.start_price : Math.ceil(a.current_bid * 1.15));
    const postParcel = (sender, recipient, kind, payload) => {
      const row = { id: uuid(), sender, recipient, kind, payload, created_at: new Date().toISOString(), claimed_at: null };
      db.deliveries.push(row);
      db.emitChange('deliveries', 'INSERT', row);
      return row;
    };
    if (path === 'rpc/create_auction') {
      if (schema === 'v1') return fail(route, 'function public.create_auction does not exist', 404);
      const minutes = Number(body.minutes);
      if (![10, 30, 60, 180, 360, 720, 1440].includes(minutes)) return fail(route, 'BAD_DURATION', 400);
      const price = Number(body.price);
      if (!(price >= 1 && price <= 1000000)) return fail(route, 'BAD_PRICE', 400);
      const mine = db.auctions.filter((a) => a.seller === me && a.status === 'open').length;
      if (mine >= 10) return fail(route, 'TOO_MANY', 400);
      const row = {
        id: uuid(), seller: me,
        seller_name: db.profiles.get(me)?.username ?? '',
        card: body.card, start_price: price, current_bid: null,
        bidder: null, bidder_name: null, bid_count: 0,
        ends_at: new Date(Date.now() + minutes * 60000).toISOString(),
        status: 'open', created_at: new Date().toISOString()
      };
      db.auctions.push(row);
      return json(route, row);
    }
    if (path === 'rpc/place_bid') {
      if (schema === 'v1') return fail(route, 'function public.place_bid does not exist', 404);
      const a = db.auctions.find((x) => x.id === body.auction);
      if (!a) return fail(route, 'NOT_FOUND', 400);
      if (a.status !== 'open' || Date.now() >= new Date(a.ends_at).getTime()) return fail(route, 'ENDED', 400);
      if (a.seller === me) return fail(route, 'OWN_AUCTION', 400);
      const amount = Number(body.amount);
      if (!(amount >= auctionFloor(a))) return fail(route, 'TOO_LOW', 400);
      if (a.bidder) {
        postParcel(a.seller, a.bidder, 'auction-money',
          { amount: a.current_bid, reason: 'refund', title: a.card?.title });
      }
      a.current_bid = amount;
      a.bidder = me;
      a.bidder_name = db.profiles.get(me)?.username ?? '';
      a.bid_count += 1;
      if (new Date(a.ends_at).getTime() - Date.now() < 10000) {
        a.ends_at = new Date(Date.now() + 65000).toISOString();
      }
      return json(route, a);
    }
    if (path === 'rpc/cancel_auction') {
      if (schema === 'v1') return fail(route, 'function public.cancel_auction does not exist', 404);
      const a = db.auctions.find((x) => x.id === body.auction);
      if (!a) return fail(route, 'NOT_FOUND', 400);
      if (a.seller !== me) return fail(route, 'NOT_YOURS', 400);
      if (a.status !== 'open') return fail(route, 'ENDED', 400);
      if (a.bid_count > 0) return fail(route, 'HAS_BIDS', 400);
      a.status = 'cancelled';
      postParcel(a.seller, a.seller, 'auction-card', a.card);
      return json(route, a);
    }
    if (path === 'rpc/settle_auction') {
      if (schema === 'v1') return fail(route, 'function public.settle_auction does not exist', 404);
      const a = db.auctions.find((x) => x.id === body.auction);
      if (!a) return fail(route, 'NOT_FOUND', 400);
      if (a.status !== 'open') return json(route, a);
      if (Date.now() < new Date(a.ends_at).getTime()) return fail(route, 'NOT_OVER', 400);
      a.status = 'settled';
      if (!a.bidder) {
        postParcel(a.seller, a.seller, 'auction-card', a.card);
      } else {
        postParcel(a.seller, a.bidder, 'auction-card', a.card);
        postParcel(a.bidder, a.seller, 'auction-money',
          { amount: a.current_bid, reason: 'sale', title: a.card?.title });
      }
      return json(route, a);
    }
    if (path === 'auctions') {
      if (schema === 'v1') return fail(route, 'relation "public.auctions" does not exist', 404);
      if (method === 'GET') {
        const found = db.auctions.filter((a) => a.status === 'open' || a.seller === me || a.bidder === me);
        found.sort((x, y) => new Date(x.ends_at) - new Date(y.ends_at));
        return rows(route, found);
      }
    }

    /* -- the codex and wishlists (V4) -- */
    if (path === 'rpc/codex_counts') {
      if (schema === 'v1') return fail(route, 'function public.codex_counts does not exist', 404);
      const byRarity = {};
      for (const row of db.codex.values()) {
        if (row.rarity) byRarity[row.rarity] = (byRarity[row.rarity] ?? 0) + 1;
      }
      return json(route, { total: db.codex.size, byRarity });
    }
    if (path === 'codex') {
      if (schema === 'v1') return fail(route, 'relation "public.codex" does not exist', 404);
      if (method === 'GET') {
        let found = [...db.codex.values()];
        const rarityParam = params.get('rarity');
        if ((rarityParam ?? '').startsWith('eq.')) found = found.filter((r) => r.rarity === rarityParam.slice(3));
        // PostgREST in.(a,b): the app asks for a tier and its legacy aliases.
        else if ((rarityParam ?? '').startsWith('in.')) {
          const want = rarityParam.slice(3).replace(/^\(|\)$/g, '').split(',').map((v) => v.replace(/^"|"$/g, ''));
          found = found.filter((r) => want.includes(r.rarity));
        }
        const titleParam = params.get('title');
        if ((titleParam ?? '').startsWith('ilike.')) {
          const q = titleParam.slice(6).replace(/\*/g, '').replace(/%/g, '').toLowerCase();
          found = found.filter((r) => r.title.toLowerCase().includes(q));
        }
        const order = params.get('order') ?? '';
        if (order.startsWith('title')) found.sort((a, b) => a.title.localeCompare(b.title));
        else if (order.startsWith('price')) found.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        else found.sort((a, b) => new Date(b.found_at) - new Date(a.found_at));
        const range = request.headers()['range'] ?? '0-39';
        const [lo, hi] = range.split('-').map(Number);
        return rows(route, found.slice(lo, hi + 1));
      }
      if (method === 'POST') {
        const list = Array.isArray(body) ? body : [body];
        for (const row of list) {
          if (row.found_by !== me) return fail(route, 'row-level security policy', 403);
          if (!db.codex.has(row.key)) db.codex.set(row.key, { ...row, found_at: new Date().toISOString() });
        }
        return rows(route, [], 201);
      }
    }
    if (path === 'wishlists') {
      if (schema === 'v1') return fail(route, 'relation "public.wishlists" does not exist', 404);
      if (method === 'GET') {
        let found = db.wishlists;
        const ownerParam = params.get('owner');
        if ((ownerParam ?? '').startsWith('eq.')) {
          const owner = ownerParam.slice(3);
          if (owner !== me && !areFriends(me, owner)) return rows(route, []);
          found = found.filter((w) => w.owner === owner);
        } else if ((ownerParam ?? '').startsWith('in.')) {
          const ids = ownerParam.slice(4, -1).split(',').map((x) => x.replace(/"/g, ''));
          found = found.filter((w) => ids.includes(w.owner) && (w.owner === me || areFriends(me, w.owner)));
        } else {
          found = found.filter((w) => w.owner === me || areFriends(me, w.owner));
        }
        return rows(route, found);
      }
      if (method === 'POST') {
        const list = Array.isArray(body) ? body : [body];
        for (const row of list) {
          if (row.owner !== me) return fail(route, 'row-level security policy', 403);
          if (!db.wishlists.some((w) => w.owner === row.owner && w.key === row.key)) {
            db.wishlists.push({ ...row, created_at: new Date().toISOString() });
          }
        }
        return rows(route, [], 201);
      }
      if (method === 'DELETE') {
        const owner = (params.get('owner') ?? '').slice(3);
        const key = (params.get('key') ?? '').slice(3);
        if (owner !== me) return fail(route, 'row-level security policy', 403);
        db.wishlists = db.wishlists.filter((w) => !(w.owner === owner && w.key === key));
        return rows(route, []);
      }
    }

    /* -- profiles -- */
    if (path === 'profiles') {
      if (schema === 'v1') {
        const asked = params.get('select') ?? '';
        const missingRead = V1_ABSENT_COLUMNS.find((c) => asked.includes(c));
        if (missingRead) return noColumn(route, missingRead);
        const missingWrite = body && V1_ABSENT_COLUMNS.find((c) => c in body);
        if (missingWrite) return noColumn(route, missingWrite);
      }
      if (method === 'GET') {
        let found = [...db.profiles.values()];
        const eq = params.get('id');
        if (eq?.startsWith('eq.')) found = found.filter((p) => p.id === eq.slice(3));
        if (eq?.startsWith('in.')) {
          const wanted = eq.slice(3).replace(/[()]/g, '').split(',');
          found = found.filter((p) => wanted.includes(p.id));
        }
        const neq = params.get('id')?.startsWith('neq.') ? params.get('id').slice(4) : null;
        if (neq) found = found.filter((p) => p.id !== neq);
        const like = params.get('username');
        if (like?.startsWith('ilike.')) {
          const pattern = like.slice(6).replace(/%$/, '').toLowerCase();
          found = found.filter((p) => p.username.toLowerCase().startsWith(pattern));
        }
        return rows(route, found);
      }
      if (method === 'POST') {
        if (body.id !== me) return fail(route, 'new row violates row-level security policy', 403);
        if ([...db.profiles.values()].some((p) => p.username.toLowerCase() === body.username.toLowerCase())) {
          return fail(route, 'duplicate key value violates unique constraint "profiles_username_key"', 409);
        }
        const row = {
          id: body.id, username: body.username, created_at: new Date().toISOString(),
          level: 1, rank: null, cards: 0, unique_cards: 0, boosters_opened: 0,
          collection_value: 0, best_rarity: null, play_ms: 0,
          ...(schema === 'v1' ? {} : {
            visibility: 'public', presence: 'online',
            last_seen_at: new Date().toISOString(), avatar: null
          })
        };
        db.profiles.set(row.id, row);
        return rows(route, [row], 201);
      }
      if (method === 'PATCH') {
        const target = (params.get('id') ?? '').slice(3);
        if (target !== me) return fail(route, 'row-level security policy', 403);
        const row = db.profiles.get(target);
        if (row && body.username && [...db.profiles.values()]
            .some((p) => p.id !== target && p.username.toLowerCase() === body.username.toLowerCase())) {
          return fail(route, 'duplicate key value violates unique constraint', 409);
        }
        if (row) Object.assign(row, body);
        return rows(route, row ? [row] : []);
      }
    }

    /* -- saves -- */
    if (path === 'saves') {
      if (method === 'GET') {
        const target = (params.get('user_id') ?? '').slice(3);
        // The narrowed policy: nobody reads anyone else's save row.
        if (target !== me) return json(route, []);
        const row = db.saves.get(target);
        return rows(route, row ? [row] : []);
      }
      if (method === 'POST') {   // upsert
        if (body.user_id !== me) return fail(route, 'row-level security policy', 403);
        // What the saves_history trigger does on the real server: the row
        // being replaced is filed first.
        const previous = db.saves.get(body.user_id);
        if (previous) fileSave(previous, 'update');
        db.saves.set(body.user_id, { ...body, updated_at: new Date().toISOString() });
        return rows(route, [db.saves.get(body.user_id)], 201);
      }
      if (method === 'DELETE') {
        const target = (params.get('user_id') ?? '').slice(3);
        if (target !== me) return fail(route, 'row-level security policy', 403);
        const previous = db.saves.get(target);
        if (previous) fileSave(previous, 'erase');
        db.saves.delete(target);
        return json(route, [], 204);
      }
    }
    if (path === 'saves_history') {
      if (schema === 'v1') return fail(route, 'relation "public.saves_history" does not exist', 404);
      if (method === 'GET') {
        const found = db.savesHistory.filter((h) => h.user_id === me);
        const id = (params.get('id') ?? '').slice(3);
        const picked = id ? found.filter((h) => String(h.id) === id) : found;
        picked.sort((x, y) => new Date(y.at) - new Date(x.at));
        return rows(route, picked);
      }
      if (method === 'POST') {
        if (body.user_id !== me) return fail(route, 'row-level security policy', 403);
        fileSave({ user_id: body.user_id, data: body.data }, body.reason ?? 'update');
        return rows(route, [db.savesHistory[db.savesHistory.length - 1]], 201);
      }
    }

    /* -- friendships -- */
    if (path === 'friendships') {
      if (method === 'GET') {
        return rows(route, db.friendships.filter((f) => f.requester === me || f.addressee === me));
      }
      if (method === 'POST') {
        if (body.requester !== me) return fail(route, 'row-level security policy', 403);
        if (body.requester === body.addressee) return fail(route, 'violates check constraint', 400);
        if (db.friendships.some((f) => f.requester === body.requester && f.addressee === body.addressee)) {
          return fail(route, 'duplicate key value violates unique constraint', 409);
        }
        const row = { id: uuid(), status: 'pending', created_at: new Date().toISOString(), ...body };
        db.friendships.push(row);
        db.emitChange('friendships', 'INSERT', row);
        return rows(route, [row], 201);
      }
      if (method === 'PATCH') {
        const id = (params.get('id') ?? '').slice(3);
        const row = db.friendships.find((f) => f.id === id);
        // Only the addressee may accept.
        if (!row || row.addressee !== me) return fail(route, 'row-level security policy', 403);
        const before = { ...row };
        Object.assign(row, body);
        db.emitChange('friendships', 'UPDATE', row, before);
        return rows(route, [row]);
      }
      if (method === 'DELETE') {
        const id = (params.get('id') ?? '').slice(3);
        const at = db.friendships.findIndex((f) => f.id === id);
        if (at < 0) return rows(route, []);
        if (db.friendships[at].requester !== me && db.friendships[at].addressee !== me) {
          return fail(route, 'row-level security policy', 403);
        }
        const [gone] = db.friendships.splice(at, 1);
        db.emitChange('friendships', 'DELETE', null, gone);
        return rows(route, [gone]);
      }
    }

    if (schema === 'v1' && V1_ABSENT_TABLES.includes(path)) return noTable(route, path);

    /* -- messages -- */
    if (path === 'messages') {
      if (method === 'GET') {
        let found = db.messages.filter((m) => m.sender === me || m.recipient === me);
        const orParam = params.get('or');
        if (orParam) {
          const ids = [...orParam.matchAll(/(?:sender|recipient)\.eq\.([0-9a-f-]+)/g)].map((m) => m[1]);
          const pair = new Set(ids);
          found = found.filter((m) => pair.has(m.sender) && pair.has(m.recipient));
        }
        if ((params.get('recipient') ?? '').startsWith('eq.')) {
          found = found.filter((m) => m.recipient === params.get('recipient').slice(3));
        }
        if (params.get('read_at') === 'is.null') found = found.filter((m) => !m.read_at);
        if ((params.get('order') ?? '').includes('created_at.desc')) {
          found = [...found].sort((a, b) => b.created_at.localeCompare(a.created_at));
        }
        const limit = Number(params.get('limit') ?? 0);
        if (limit) found = found.slice(0, limit);
        return rows(route, found);
      }
      if (method === 'POST') {
        if (body.sender !== me) return fail(route, 'row-level security policy', 403);
        if (!areFriends(body.sender, body.recipient)) return fail(route, 'row-level security policy', 403);
        const row = { id: uuid(), read_at: null, created_at: new Date().toISOString(), ...body };
        db.messages.push(row);
        db.emitChange('messages', 'INSERT', row);
        return rows(route, [row], 201);
      }
      if (method === 'PATCH') {
        const recipient = (params.get('recipient') ?? '').slice(3);
        if (recipient !== me) return fail(route, 'row-level security policy', 403);
        const sender = (params.get('sender') ?? '').slice(3);
        const changed = [];
        for (const m of db.messages) {
          if (m.recipient !== me) continue;
          if (sender && m.sender !== sender) continue;
          if (params.get('read_at') === 'is.null' && m.read_at) continue;
          const before = { ...m };
          Object.assign(m, body);
          changed.push(m);
          db.emitChange('messages', 'UPDATE', m, before);
        }
        return rows(route, changed);
      }
    }

    /* -- showcase hearts -- */
    if (path === 'showcase_kudos') {
      if (method === 'GET') {
        const owner = (params.get('owner') ?? '').slice(3);
        return rows(route, db.kudos.filter((k) => !owner || k.owner === owner));
      }
      if (method === 'POST') {
        if (body.sender !== me) return fail(route, 'row-level security policy', 403);
        if (!areFriends(body.sender, body.owner)) return fail(route, 'row-level security policy', 403);
        if (db.kudos.some((k) => k.owner === body.owner && k.key === body.key && k.sender === body.sender)) return fail(route, 'duplicate key value violates unique constraint', 409);
        const row = { created_at: new Date().toISOString(), ...body };
        db.kudos.push(row);
        return rows(route, [row], 201);
      }
      if (method === 'DELETE') {
        const sender = (params.get('sender') ?? '').slice(3);
        if (sender !== me) return fail(route, 'row-level security policy', 403);
        const owner = (params.get('owner') ?? '').slice(3);
        const key = (params.get('key') ?? '').slice(3);
        db.kudos = db.kudos.filter((k) => !(k.owner === owner && k.key === key && k.sender === sender));
        return json(route, [], 204);
      }
    }

    /* -- deliveries -- */
    if (path === 'deliveries') {
      if (method === 'GET') {
        let found = db.deliveries.filter((d) => d.sender === me || d.recipient === me);
        if ((params.get('recipient') ?? '').startsWith('eq.')) {
          found = found.filter((d) => d.recipient === params.get('recipient').slice(3));
        }
        if (params.get('claimed_at') === 'is.null') found = found.filter((d) => !d.claimed_at);
        return rows(route, found);
      }
      if (method === 'POST') {
        if (body.sender !== me) return fail(route, 'row-level security policy', 403);
        if (body.sender !== body.recipient && !areFriends(body.sender, body.recipient)) {
          return fail(route, 'row-level security policy', 403);
        }
        const row = { id: uuid(), claimed_at: null, created_at: new Date().toISOString(), ...body };
        db.deliveries.push(row);
        db.emitChange('deliveries', 'INSERT', row);
        return rows(route, [row], 201);
      }
      if (method === 'PATCH') {
        const id = (params.get('id') ?? '').slice(3);
        const row = db.deliveries.find((d) => d.id === id);
        if (!row || row.recipient !== me) return fail(route, 'row-level security policy', 403);
        Object.assign(row, body);
        return rows(route, [row]);
      }
    }

    /* -- trades -- */
    if (path === 'trades') {
      if (method === 'GET') {
        let found = db.trades.filter((tr) => tr.proposer === me || tr.recipient === me);
        const statusParam = params.get('status');
        if (statusParam?.startsWith('neq.')) found = found.filter((tr) => tr.status !== statusParam.slice(4));
        if ((params.get('order') ?? '').includes('created_at.desc')) {
          found = [...found].sort((a, b) => b.created_at.localeCompare(a.created_at));
        }
        return rows(route, found);
      }
      if (method === 'POST') {
        if (body.proposer !== me) return fail(route, 'row-level security policy', 403);
        if (!areFriends(body.proposer, body.recipient)) return fail(route, 'row-level security policy', 403);
        const row = { id: uuid(), status: 'pending', resolved_at: null,
          created_at: new Date().toISOString(), ...body };
        db.trades.push(row);
        db.emitChange('trades', 'INSERT', row);
        return rows(route, [row], 201);
      }
      if (method === 'PATCH') {
        const id = (params.get('id') ?? '').slice(3);
        const row = db.trades.find((tr) => tr.id === id);
        if (!row || (row.proposer !== me && row.recipient !== me)) {
          return fail(route, 'row-level security policy', 403);
        }
        const before = { ...row };
        Object.assign(row, body);
        db.emitChange('trades', 'UPDATE', row, before);
        return rows(route, [row]);
      }
    }

    return fail(route, `unstubbed: ${method} ${path}`, 404);
  });

  return db;
}
