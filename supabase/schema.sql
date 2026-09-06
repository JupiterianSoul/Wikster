-- ============================================================================
-- WIKSTER - database schema
-- ============================================================================
-- Run this once, whole, in your Supabase project's SQL editor
-- (Dashboard -> SQL Editor -> New query -> paste -> Run).
--
-- Three tables:
--   profiles      one public row per player: username and the stats a friend
--                 is allowed to see. Readable by any signed-in player, because
--                 that is what username search needs.
--   saves         the private save blob. Readable ONLY by its owner. A friend
--                 sees the cards through friend_cards() below, which hands back
--                 that one key and nothing else in the blob.
--   friendships   one row per request, from requester to addressee.
--
-- Every table has row-level security on. The anon key shipped in the app is
-- public by design; these policies, not the key, are what keep one player out
-- of another's data. Nothing below trusts the client.
-- ============================================================================

-- --- profiles ---------------------------------------------------------------
--
-- Usernames are plain text with a unique index on lower(username), rather than
-- the citext extension. Same effect - one person may hold "Ada" and nobody
-- else may hold "ada" - with nothing to install, so this script cannot fail on
-- an extension the project will not grant.

create table if not exists public.profiles (
  id                uuid primary key references auth.users on delete cascade,
  username          text not null
                      check (username ~ '^[a-zA-Z0-9_]{3,20}$'),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  -- The stats a friend sees. Denormalised on purpose: a friend list should be
  -- one cheap read, not one save download per friend.
  level             integer not null default 1,
  rank              text,
  cards             integer not null default 0,
  unique_cards      integer not null default 0,
  boosters_opened   integer not null default 0,
  collection_value  bigint  not null default 0,
  best_rarity       text,
  play_ms           bigint  not null default 0
);

create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username));

alter table public.profiles enable row level security;

-- Any signed-in player can read any profile. This is what makes "add a friend
-- by username" possible at all, and it is limited to the columns above.
drop policy if exists "profiles are readable by signed-in players" on public.profiles;
create policy "profiles are readable by signed-in players"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "a player writes only their own profile" on public.profiles;
create policy "a player writes only their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "a player updates only their own profile" on public.profiles;
create policy "a player updates only their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- --- friendships -------------------------------------------------------------

create table if not exists public.friendships (
  id          uuid primary key default gen_random_uuid(),
  requester   uuid not null references auth.users on delete cascade,
  addressee   uuid not null references auth.users on delete cascade,
  status      text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at  timestamptz not null default now(),
  -- One request per direction, and never to yourself.
  unique (requester, addressee),
  check (requester <> addressee)
);

create index if not exists friendships_requester_idx on public.friendships (requester);
create index if not exists friendships_addressee_idx on public.friendships (addressee);

alter table public.friendships enable row level security;

drop policy if exists "you see friendships you are part of" on public.friendships;
create policy "you see friendships you are part of"
  on public.friendships for select
  to authenticated
  using (auth.uid() = requester or auth.uid() = addressee);

-- You may only ever send a request AS yourself, and only as pending. Accepting
-- is a separate, addressee-only action below.
drop policy if exists "you send requests as yourself" on public.friendships;
create policy "you send requests as yourself"
  on public.friendships for insert
  to authenticated
  with check (auth.uid() = requester and status = 'pending');

-- Only the person who received a request may accept it.
drop policy if exists "only the addressee accepts" on public.friendships;
create policy "only the addressee accepts"
  on public.friendships for update
  to authenticated
  using (auth.uid() = addressee)
  with check (auth.uid() = addressee and status = 'accepted');

-- Either side may withdraw or remove.
drop policy if exists "either side removes a friendship" on public.friendships;
create policy "either side removes a friendship"
  on public.friendships for delete
  to authenticated
  using (auth.uid() = requester or auth.uid() = addressee);

-- --- saves --------------------------------------------------------------------

create table if not exists public.saves (
  user_id     uuid primary key references auth.users on delete cascade,
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);

alter table public.saves enable row level security;

/*
 * Whether two players are accepted friends.
 *
 * security definer so the check runs regardless of the caller's view of the
 * friendships table, and search_path is pinned so the function cannot be
 * hijacked by a schema the caller controls. It reads nothing it does not need.
 */
create or replace function public.are_friends(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and ((f.requester = a and f.addressee = b)
        or (f.requester = b and f.addressee = a))
  );
$$;

revoke all on function public.are_friends(uuid, uuid) from public;
grant execute on function public.are_friends(uuid, uuid) to authenticated;

-- Nobody reads anyone else's save row. Friends go through friend_cards().
drop policy if exists "you read your own save, and your friends'" on public.saves;
drop policy if exists "you read only your own save" on public.saves;
create policy "you read only your own save"
  on public.saves for select
  to authenticated
  using (auth.uid() = user_id);

-- Erasing a save should REMOVE the row, not leave an empty one behind. Without
-- this the wipe could only overwrite the save with a blank blob, which reads
-- as an account that exists and has nothing in it. A player may only delete
-- their own.
drop policy if exists "you delete your own save" on public.saves;
create policy "you delete your own save"
  on public.saves for delete
  using (auth.uid() = user_id);

drop policy if exists "you write only your own save" on public.saves;
create policy "you write only your own save"
  on public.saves for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "you update only your own save" on public.saves;
create policy "you update only your own save"
  on public.saves for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

/*
 * A friend's cards, and nothing else.
 *
 * The save blob holds the wallet, the settings, the daily-gift record and the
 * language as well as the collection. A friend has no business with any of
 * that, so rather than opening the row up, this hands back the single key the
 * friends screen actually renders. security definer because the caller cannot
 * read the row at all; the friendship check inside is what authorises it.
 */
create or replace function public.friend_cards(target uuid)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  -- allowed is answered separately from cards, so "we are not friends" and
  -- "they have not pulled anything yet" are not both a bare null.
  select case
    when auth.uid() = target or public.are_friends(auth.uid(), target) then
      jsonb_build_object('allowed', true, 'cards', (
        select s.data -> 'data' ->> 'wikster.collection.v3'
        from public.saves s where s.user_id = target
      ))
    else jsonb_build_object('allowed', false)
  end;
$$;

revoke all on function public.friend_cards(uuid) from public;
grant execute on function public.friend_cards(uuid) to authenticated;

-- --- username availability -------------------------------------------------------

/*
 * Is a username free?
 *
 * A plain select against profiles would work, but this keeps sign-up from
 * needing to read the table at all and returns a straight yes or no.
 */
create or replace function public.username_available(name text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select not exists (
    select 1 from public.profiles p where lower(p.username) = lower(name)
  );
$$;

revoke all on function public.username_available(text) from public;
grant execute on function public.username_available(text) to anon, authenticated;

-- --- keep updated_at honest --------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists saves_touch on public.saves;
create trigger saves_touch before update on public.saves
  for each row execute function public.touch_updated_at();

-- --- saves_history ---------------------------------------------------------------
-- The save's previous versions, kept by the server on every write and on an
-- erase, and readable only by their owner. This is the net under syncing: a
-- merge that went wrong, an erase that was a mistake, a phone that died with
-- the only good copy, are all walked back from here in Settings > Data.
--
-- Rows are thinned with age so the table never grows past a few dozen per
-- player: everything from the last hour, one an hour for the last day, one a
-- day beyond that, and never more than 40 in all. The version filed before an
-- erase or a restore is never thinned.
create table if not exists public.saves_history (
  id        bigint generated always as identity primary key,
  user_id   uuid not null references auth.users on delete cascade,
  at        timestamptz not null default now(),
  reason    text not null default 'update',   -- update | erase | before-restore
  cards     integer,                           -- how many different cards the save held
  coins     bigint,                            -- the wallet
  data      jsonb not null
);
create index if not exists saves_history_owner_at on public.saves_history (user_id, at desc);
alter table public.saves_history enable row level security;

drop policy if exists "you read only your own backups" on public.saves_history;
create policy "you read only your own backups"
  on public.saves_history for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "you file only your own backups" on public.saves_history;
create policy "you file only your own backups"
  on public.saves_history for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "you delete only your own backups" on public.saves_history;
create policy "you delete only your own backups"
  on public.saves_history for delete
  to authenticated
  using (auth.uid() = user_id);

-- Files the row being replaced or erased, then thins the owner's history.
-- Runs as the definer so a cascade from a deleted account (no session, and
-- a user row already gone) can be told apart and skipped.
create or replace function public.keep_save_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reason text := case when tg_op = 'DELETE' then 'erase' else 'update' end;
  v_cards integer;
  v_coins bigint;
  v_last timestamptz;
begin
  if not exists (select 1 from auth.users u where u.id = old.user_id) then
    return coalesce(new, old);
  end if;
  -- An erase is always filed. An update is filed at most once a minute, so a
  -- burst of syncs does not fill the history with copies of the same minute.
  select max(h.at) into v_last from public.saves_history h where h.user_id = old.user_id;
  if v_reason = 'update' and v_last is not null and v_last > now() - interval '1 minute' then
    return coalesce(new, old);
  end if;
  begin
    v_cards := jsonb_object_length(((old.data->'data'->>'wikster.collection.v3')::jsonb)->'entries');
  exception when others then v_cards := null; end;
  begin
    v_coins := (old.data->'data'->>'wikster.wallet.v1')::bigint;
  exception when others then v_coins := null; end;
  insert into public.saves_history (user_id, reason, cards, coins, data)
    values (old.user_id, v_reason, v_cards, v_coins, old.data);

  -- Thin: within each bucket (a minute this hour, an hour today, a day
  -- before that) only the newest plain update survives.
  delete from public.saves_history h
  using (
    select id, row_number() over (partition by bucket order by at desc) as rn
    from (
      select id, at,
        case when at > now() - interval '1 hour' then to_char(at, 'YYYYMMDDHH24MI')
             when at > now() - interval '1 day'  then to_char(at, 'YYYYMMDDHH24')
             else to_char(at, 'YYYYMMDD') end as bucket
      from public.saves_history
      where user_id = old.user_id and reason = 'update'
    ) b
  ) k
  where h.id = k.id and k.rn > 1;
  -- And never more than 40, whatever their reasons.
  delete from public.saves_history h
  where h.user_id = old.user_id
    and h.id not in (
      select id from public.saves_history
      where user_id = old.user_id order by at desc limit 40
    );
  return coalesce(new, old);
end;
$$;

drop trigger if exists saves_history_keep on public.saves;
create trigger saves_history_keep before update or delete on public.saves
  for each row execute function public.keep_save_history();

-- --- tell PostgREST about all of the above ------------------------------------------
--
-- The API keeps a cached picture of the schema and does not always notice DDL
-- straight away. Without this, everything above can be present and correct and
-- the app still gets "Could not find the table 'public.profiles' in the schema
-- cache" until the cache happens to refresh.

notify pgrst, 'reload schema';

-- ============================================================================
-- V2 - social: visibility, presence, avatars, chat, trades, gifts
-- ============================================================================
-- Everything below is idempotent; re-run the whole file freely.

-- --- profile additions -------------------------------------------------------

alter table public.profiles
  add column if not exists visibility text not null default 'public'
    check (visibility in ('private', 'friends', 'public')),
  add column if not exists presence text not null default 'online'
    check (presence in ('online', 'hidden')),
  add column if not exists last_seen_at timestamptz not null default now(),
  -- The chosen card artwork and its crop, e.g. {"url": ..., "x": 50, "y": 30}.
  add column if not exists avatar jsonb;

-- Visibility now decides who can read a profile:
--   public   anyone signed in (search finds you)
--   friends  your accepted friends, plus anyone you have a pending row with
--            (they must see the request to answer it)
--   private  only you
drop policy if exists "profiles are readable by signed-in players" on public.profiles;
create policy "profiles are readable by signed-in players"
  on public.profiles for select
  to authenticated
  using (
    auth.uid() = id
    or visibility = 'public'
    or (visibility = 'friends' and exists (
      select 1 from public.friendships f
      where (f.requester = auth.uid() and f.addressee = id)
         or (f.requester = id and f.addressee = auth.uid())
    ))
  );

-- --- messages (friend chat) --------------------------------------------------

create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  sender      uuid not null references auth.users on delete cascade,
  recipient   uuid not null references auth.users on delete cascade,
  body        text not null check (char_length(body) between 1 and 500),
  created_at  timestamptz not null default now(),
  read_at     timestamptz,
  check (sender <> recipient)
);

create index if not exists messages_pair_idx
  on public.messages (least(sender, recipient), greatest(sender, recipient), created_at);
create index if not exists messages_recipient_unread_idx
  on public.messages (recipient) where read_at is null;

alter table public.messages enable row level security;

drop policy if exists "you read conversations you are in" on public.messages;
create policy "you read conversations you are in"
  on public.messages for select
  to authenticated
  using (auth.uid() = sender or auth.uid() = recipient);

-- You write as yourself, to a friend.
drop policy if exists "you message friends as yourself" on public.messages;
create policy "you message friends as yourself"
  on public.messages for insert
  to authenticated
  with check (auth.uid() = sender and public.are_friends(sender, recipient));

-- Only the recipient marks a message read, and that is all they may change.
drop policy if exists "the recipient marks messages read" on public.messages;
create policy "the recipient marks messages read"
  on public.messages for update
  to authenticated
  using (auth.uid() = recipient)
  with check (auth.uid() = recipient);

-- --- deliveries --------------------------------------------------------------
--
-- The one-way postbox that makes gifts and trades safe with client-owned
-- saves: whoever GIVES removes the goods from their own save and posts a
-- delivery; the recipient's app claims it and adds the goods to its own save.
-- No client ever writes another player's save.

create table if not exists public.deliveries (
  id          uuid primary key default gen_random_uuid(),
  sender      uuid not null references auth.users on delete cascade,
  recipient   uuid not null references auth.users on delete cascade,
  kind        text not null check (kind in ('card', 'booster', 'trade-return')),
  -- card:   the full card entry snapshot
  -- booster:{spec: {...}}
  payload     jsonb not null,
  note        text check (char_length(note) <= 200),
  created_at  timestamptz not null default now(),
  claimed_at  timestamptz
);

create index if not exists deliveries_recipient_idx
  on public.deliveries (recipient) where claimed_at is null;

alter table public.deliveries enable row level security;

drop policy if exists "you see deliveries you sent or received" on public.deliveries;
create policy "you see deliveries you sent or received"
  on public.deliveries for select
  to authenticated
  using (auth.uid() = sender or auth.uid() = recipient);

drop policy if exists "you send deliveries as yourself to friends" on public.deliveries;
create policy "you send deliveries as yourself to friends"
  on public.deliveries for insert
  to authenticated
  with check (auth.uid() = sender
    and (public.are_friends(sender, recipient) or sender = recipient));

drop policy if exists "the recipient claims a delivery" on public.deliveries;
create policy "the recipient claims a delivery"
  on public.deliveries for update
  to authenticated
  using (auth.uid() = recipient)
  with check (auth.uid() = recipient);

-- --- trades ------------------------------------------------------------------
--
-- WikiMaster-style: I offer cards, I ask for cards, you accept or decline.
-- The offered cards leave the proposer's save the moment the trade is posted
-- (escrow, held in `offer`). On accept, the recipient removes the asked cards
-- from their own save, takes the offered ones, and posts the asked cards back
-- as a delivery to the proposer. On decline/cancel the proposer's app
-- restores the escrowed cards from `offer`.

create table if not exists public.trades (
  id           uuid primary key default gen_random_uuid(),
  proposer     uuid not null references auth.users on delete cascade,
  recipient    uuid not null references auth.users on delete cascade,
  offer        jsonb not null,     -- [card entry snapshots]
  ask          jsonb not null,     -- [{key, title, rarityId}]
  status       text not null default 'pending'
                 check (status in ('pending', 'accepted', 'declined', 'cancelled', 'closed')),
  created_at   timestamptz not null default now(),
  resolved_at  timestamptz,
  check (proposer <> recipient)
);

create index if not exists trades_proposer_idx on public.trades (proposer);
create index if not exists trades_recipient_idx on public.trades (recipient);

alter table public.trades enable row level security;

drop policy if exists "you see trades you are part of" on public.trades;
create policy "you see trades you are part of"
  on public.trades for select
  to authenticated
  using (auth.uid() = proposer or auth.uid() = recipient);

drop policy if exists "you propose trades as yourself to friends" on public.trades;
create policy "you propose trades as yourself to friends"
  on public.trades for insert
  to authenticated
  with check (auth.uid() = proposer
    and status = 'pending'
    and public.are_friends(proposer, recipient));

-- The recipient answers a pending trade; the proposer cancels a pending one
-- or closes an answered one after restoring/collecting.
drop policy if exists "trade parties update their side" on public.trades;
create policy "trade parties update their side"
  on public.trades for update
  to authenticated
  using (auth.uid() = proposer or auth.uid() = recipient)
  with check (auth.uid() = proposer or auth.uid() = recipient);

-- Presence: whether a player counts as online right now. Their own presence
-- switch decides whether anyone may know.
create or replace function public.is_online(p public.profiles)
returns boolean
language sql
stable
as $$
  select p.presence = 'online' and p.last_seen_at > now() - interval '2 minutes';
$$;

notify pgrst, 'reload schema';

-- ============================================================================
-- V3 - the market: auctions
-- ============================================================================
-- Any player can put a card up; everyone can bid. The rules that make it
-- fair live HERE, not in the app: the 15% minimum raise, the anti-snipe
-- clock, the no-cancel-once-bid rule and settlement are all enforced by
-- definer functions, so no client - however modified - can bend them.
--
-- Money and cards move by the same postbox as gifts and trades: the bidder's
-- app deducts its own wallet when it bids; refunds, payouts and the card
-- itself arrive as deliveries that each app applies to its own save.

-- The postbox learns the two auction parcels.
alter table public.deliveries drop constraint if exists deliveries_kind_check;
alter table public.deliveries add constraint deliveries_kind_check
  check (kind in ('card', 'booster', 'trade-return', 'auction-card', 'auction-money'));

create table if not exists public.auctions (
  id           uuid primary key default gen_random_uuid(),
  seller       uuid not null references auth.users on delete cascade,
  seller_name  text not null default '',
  card         jsonb not null,
  start_price  integer not null check (start_price between 1 and 1000000),
  current_bid  integer,
  bidder       uuid references auth.users on delete set null,
  bidder_name  text,
  bid_count    integer not null default 0,
  ends_at      timestamptz not null,
  status       text not null default 'open'
                 check (status in ('open', 'settled', 'cancelled')),
  created_at   timestamptz not null default now()
);

create index if not exists auctions_open_idx on public.auctions (status, ends_at);
create index if not exists auctions_seller_idx on public.auctions (seller);

alter table public.auctions enable row level security;

-- Reading is open to every signed-in player; every WRITE goes through the
-- functions below, so there are deliberately no insert/update policies.
drop policy if exists "auctions are readable by signed-in players" on public.auctions;
create policy "auctions are readable by signed-in players"
  on public.auctions for select
  to authenticated
  using (true);

-- The next acceptable bid: the asking price untouched, then +15%, rounded up.
create or replace function public.auction_floor(a public.auctions)
returns integer
language sql immutable as $$
  select case when a.current_bid is null then a.start_price
              else ceil(a.current_bid * 1.15)::integer end;
$$;

-- List a card. At most ten open per seller; the durations are the seven the
-- app offers, nothing else.
create or replace function public.create_auction(card jsonb, price integer, minutes integer)
returns public.auctions
language plpgsql security definer set search_path = public as $$
declare mine integer; row_out public.auctions;
begin
  if auth.uid() is null then raise exception 'AUTH'; end if;
  if minutes not in (10, 30, 60, 180, 360, 720, 1440) then raise exception 'BAD_DURATION'; end if;
  if price is null or price < 1 or price > 1000000 then raise exception 'BAD_PRICE'; end if;
  select count(*) into mine from auctions where seller = auth.uid() and status = 'open';
  if mine >= 10 then raise exception 'TOO_MANY'; end if;
  insert into auctions (seller, seller_name, card, start_price, ends_at)
  values (auth.uid(),
          coalesce((select username from profiles where id = auth.uid()), ''),
          card, price, now() + make_interval(mins => minutes))
  returning * into row_out;
  return row_out;
end $$;

-- Bid. The floor is enforced here; a bid inside the last ten seconds winds
-- the clock back up to 65, so sniping the final second buys nothing. The
-- outbid player's money goes straight back out as a delivery.
create or replace function public.place_bid(auction uuid, amount integer)
returns public.auctions
language plpgsql security definer set search_path = public as $$
declare a public.auctions; row_out public.auctions;
begin
  if auth.uid() is null then raise exception 'AUTH'; end if;
  select * into a from auctions where id = auction for update;
  if a.id is null then raise exception 'NOT_FOUND'; end if;
  if a.status <> 'open' or now() >= a.ends_at then raise exception 'ENDED'; end if;
  if a.seller = auth.uid() then raise exception 'OWN_AUCTION'; end if;
  if amount is null or amount < auction_floor(a) then raise exception 'TOO_LOW'; end if;
  if a.bidder is not null then
    insert into deliveries (sender, recipient, kind, payload)
    values (a.seller, a.bidder, 'auction-money',
            jsonb_build_object('amount', a.current_bid, 'reason', 'refund',
                               'title', a.card->>'title'));
  end if;
  update auctions set
    current_bid = amount,
    bidder = auth.uid(),
    bidder_name = coalesce((select username from profiles where id = auth.uid()), ''),
    bid_count = bid_count + 1,
    ends_at = case when ends_at - now() < interval '10 seconds'
                   then now() + interval '65 seconds' else ends_at end
  where id = auction
  returning * into row_out;
  return row_out;
end $$;

-- Withdraw a listing. Only the seller, and only while nobody has bid.
create or replace function public.cancel_auction(auction uuid)
returns public.auctions
language plpgsql security definer set search_path = public as $$
declare a public.auctions; row_out public.auctions;
begin
  if auth.uid() is null then raise exception 'AUTH'; end if;
  select * into a from auctions where id = auction for update;
  if a.id is null then raise exception 'NOT_FOUND'; end if;
  if a.seller <> auth.uid() then raise exception 'NOT_YOURS'; end if;
  if a.status <> 'open' then raise exception 'ENDED'; end if;
  if a.bid_count > 0 then raise exception 'HAS_BIDS'; end if;
  update auctions set status = 'cancelled' where id = auction returning * into row_out;
  insert into deliveries (sender, recipient, kind, payload)
  values (a.seller, a.seller, 'auction-card', a.card);
  return row_out;
end $$;

-- Close a finished auction. Anyone may ring the bell - the checks make it
-- run exactly once - so the market needs no clock of its own: whichever app
-- first notices the timer at zero settles it for everyone.
create or replace function public.settle_auction(auction uuid)
returns public.auctions
language plpgsql security definer set search_path = public as $$
declare a public.auctions; row_out public.auctions;
begin
  if auth.uid() is null then raise exception 'AUTH'; end if;
  select * into a from auctions where id = auction for update;
  if a.id is null then raise exception 'NOT_FOUND'; end if;
  if a.status <> 'open' then return a; end if;
  if now() < a.ends_at then raise exception 'NOT_OVER'; end if;
  update auctions set status = 'settled' where id = auction returning * into row_out;
  if a.bidder is null then
    insert into deliveries (sender, recipient, kind, payload)
    values (a.seller, a.seller, 'auction-card', a.card);
  else
    insert into deliveries (sender, recipient, kind, payload)
    values (a.seller, a.bidder, 'auction-card', a.card);
    insert into deliveries (sender, recipient, kind, payload)
    values (a.bidder, a.seller, 'auction-money',
            jsonb_build_object('amount', a.current_bid, 'reason', 'sale',
                               'title', a.card->>'title'));
  end if;
  return row_out;
end $$;

grant execute on function public.create_auction(jsonb, integer, integer) to authenticated;
grant execute on function public.place_bid(uuid, integer) to authenticated;
grant execute on function public.cancel_auction(uuid) to authenticated;
grant execute on function public.settle_auction(uuid) to authenticated;

-- Live updates for every open market screen. If the publication does not
-- exist on this project the two lines can be skipped; the app also polls.
do $$ begin
  alter publication supabase_realtime add table public.auctions;
exception when others then null; end $$;

-- ============================================================================
-- V4 - the card index and wishlists
-- ============================================================================
-- The codex is the game's shared memory: one row per real card anyone has
-- ever pulled (custom packs stay out). Clients add rows as they open packs;
-- nothing ever updates or deletes one, so the worst a hostile client can do
-- is discover a card. Wishlists are per-player and readable by friends, so
-- a card can say who at the table wants it.

create table if not exists public.codex (
  key        text primary key,
  title      text not null check (char_length(title) <= 300),
  rarity     text,
  price      integer,
  views      bigint,
  thumbnail  text check (char_length(thumbnail) <= 2000),
  lang       text check (char_length(lang) <= 12),
  found_at   timestamptz not null default now(),
  found_by   uuid references auth.users on delete set null
);

create index if not exists codex_found_idx on public.codex (found_at desc);
create index if not exists codex_title_idx on public.codex (lower(title) text_pattern_ops);

alter table public.codex enable row level security;

drop policy if exists "the codex is readable by signed-in players" on public.codex;
create policy "the codex is readable by signed-in players"
  on public.codex for select
  to authenticated
  using (true);

drop policy if exists "discoveries are written by their finder" on public.codex;
create policy "discoveries are written by their finder"
  on public.codex for insert
  to authenticated
  with check (auth.uid() = found_by);

-- One call for the header numbers: how much has been found, per tier.
create or replace function public.codex_counts()
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare total bigint; by_rarity jsonb;
begin
  select count(*) into total from codex;
  select coalesce(jsonb_object_agg(rarity, n), '{}'::jsonb) into by_rarity
    from (select rarity, count(*) as n from codex where rarity is not null group by rarity) t;
  return jsonb_build_object('total', total, 'byRarity', by_rarity);
end $$;

grant execute on function public.codex_counts() to authenticated;

create table if not exists public.wishlists (
  owner      uuid not null references auth.users on delete cascade,
  key        text not null,
  card       jsonb not null,
  created_at timestamptz not null default now(),
  primary key (owner, key)
);

alter table public.wishlists enable row level security;

drop policy if exists "a wishlist is readable by its owner and their friends" on public.wishlists;
create policy "a wishlist is readable by its owner and their friends"
  on public.wishlists for select
  to authenticated
  using (auth.uid() = owner or public.are_friends(owner, auth.uid()));

drop policy if exists "you wish as yourself" on public.wishlists;
create policy "you wish as yourself"
  on public.wishlists for insert
  to authenticated
  with check (auth.uid() = owner);

drop policy if exists "you unwish as yourself" on public.wishlists;
create policy "you unwish as yourself"
  on public.wishlists for delete
  to authenticated
  using (auth.uid() = owner);

-- ============================================================================
-- V5 - the top tier was renamed: Artifact became Prismatic. Rows written
-- under the old name are renamed here, in every place a tier is stored, and
-- each statement is a no-op once it has run. Clients accept the old name too,
-- so the order the app and the schema are updated in does not matter.

update public.codex set rarity = 'prismatic' where rarity = 'artifact';
update public.profiles set best_rarity = 'prismatic' where best_rarity = 'artifact';
update public.wishlists
  set card = jsonb_set(card, '{rarityId}', '"prismatic"')
  where card->>'rarityId' = 'artifact';
update public.auctions
  set card = jsonb_set(card, '{rarityId}', '"prismatic"')
  where card->>'rarityId' = 'artifact';
update public.trades
  set offer = (
    select coalesce(jsonb_agg(
      case when c->>'rarityId' = 'artifact' then jsonb_set(c, '{rarityId}', '"prismatic"') else c end
    ), '[]'::jsonb) from jsonb_array_elements(offer) c),
      ask = (
    select coalesce(jsonb_agg(
      case when c->>'rarityId' = 'artifact' then jsonb_set(c, '{rarityId}', '"prismatic"') else c end
    ), '[]'::jsonb) from jsonb_array_elements(ask) c)
  where status = 'pending'
    and jsonb_typeof(offer) = 'array' and jsonb_typeof(ask) = 'array'
    and (offer::text like '%"artifact"%' or ask::text like '%"artifact"%');

-- ============================================================================
-- V6 - MINIGAMES, QUESTS AND THE LEADERBOARD
--
-- Three new pieces of furniture. `scores` is every point anyone ever earned
-- in a minigame, written by the game functions with the service key (the
-- slot machine) or by submit_score() for Wikdle, never by a
-- plain insert from a client. `quests` is each player's dealt quests for
-- each day, dealt by the quests function. The three leaderboard tables are
-- caches over `scores`, one per window, kept by a trigger and emptied by
-- cron on the window's clock: daily at 00:00 UTC, weekly on Sunday 00:00
-- UTC, all-time never.
-- ============================================================================

create table if not exists public.scores (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users on delete cascade,
  game       text not null check (game in ('slots', 'roulette', 'wikdle', 'quest', 'duel', 'reveal')),
  points     integer not null check (points >= 0),
  detail     jsonb,
  at         timestamptz not null default now()
);
create index if not exists scores_user_at_idx on public.scores (user_id, at desc);
create index if not exists scores_at_idx on public.scores (at desc);

alter table public.scores enable row level security;
drop policy if exists "your own scores are yours to read" on public.scores;
create policy "your own scores are yours to read"
  on public.scores for select to authenticated using (auth.uid() = user_id);
-- No insert policy on purpose: only the service key and submit_score() write.

-- The three windows. Each holds one row per player with that window's total,
-- and each has an index on the score, which is what makes a page of twenty
-- a single index scan.
create table if not exists public.leaderboard_daily   (user_id uuid primary key references auth.users on delete cascade, score bigint not null default 0, updated_at timestamptz not null default now());
create table if not exists public.leaderboard_weekly  (user_id uuid primary key references auth.users on delete cascade, score bigint not null default 0, updated_at timestamptz not null default now());
create table if not exists public.leaderboard_alltime (user_id uuid primary key references auth.users on delete cascade, score bigint not null default 0, updated_at timestamptz not null default now());
create index if not exists leaderboard_daily_score_idx   on public.leaderboard_daily   (score desc, updated_at asc);
create index if not exists leaderboard_weekly_score_idx  on public.leaderboard_weekly  (score desc, updated_at asc);
create index if not exists leaderboard_alltime_score_idx on public.leaderboard_alltime (score desc, updated_at asc);

alter table public.leaderboard_daily   enable row level security;
alter table public.leaderboard_weekly  enable row level security;
alter table public.leaderboard_alltime enable row level security;
drop policy if exists "the board is public" on public.leaderboard_daily;
create policy "the board is public" on public.leaderboard_daily for select to authenticated using (true);
drop policy if exists "the board is public" on public.leaderboard_weekly;
create policy "the board is public" on public.leaderboard_weekly for select to authenticated using (true);
drop policy if exists "the board is public" on public.leaderboard_alltime;
create policy "the board is public" on public.leaderboard_alltime for select to authenticated using (true);

-- Every score lands in all three windows the moment it is written.
create or replace function public.scores_into_windows()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into leaderboard_daily (user_id, score) values (new.user_id, new.points)
    on conflict (user_id) do update set score = leaderboard_daily.score + excluded.score, updated_at = now();
  insert into leaderboard_weekly (user_id, score) values (new.user_id, new.points)
    on conflict (user_id) do update set score = leaderboard_weekly.score + excluded.score, updated_at = now();
  insert into leaderboard_alltime (user_id, score) values (new.user_id, new.points)
    on conflict (user_id) do update set score = leaderboard_alltime.score + excluded.score, updated_at = now();
  return new;
end $$;
drop trigger if exists scores_into_windows on public.scores;
create trigger scores_into_windows after insert on public.scores
  for each row execute function public.scores_into_windows();

-- The games scored on the device arrive through this, as the caller: Wikdle
-- (the word is the same for everyone and the board is its own proof), the
-- Popularity Duel and Guess the Article (a round's points, from the player's
-- own cards). One row per game and day: Wikdle's is written once, a duel or
-- a reveal round replaces the day's row when it beats it. Never above the
-- game's own maximum, which is what keeps a forged score off the board.
--
-- A project on the older shape of this table (the check constraint without
-- the two new games) is brought up by the alter below.
alter table public.scores drop constraint if exists scores_game_check;
alter table public.scores add constraint scores_game_check
  check (game in ('slots', 'roulette', 'wikdle', 'quest', 'duel', 'reveal'));

create or replace function public.submit_score(p_game text, p_points integer, p_day text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_max integer;
  v_existing integer;
begin
  if auth.uid() is null then raise exception 'sign in'; end if;
  v_max := case p_game when 'wikdle' then 1400 when 'duel' then 3100 when 'reveal' then 1600 else null end;
  if v_max is null then raise exception 'this game is not scored by the client'; end if;
  if p_points < 0 or p_points > v_max then raise exception 'points out of range'; end if;
  select points into v_existing from scores
    where user_id = auth.uid() and game = p_game and detail->>'day' = p_day
    limit 1;
  if v_existing is not null then
    if p_game = 'wikdle' or p_points <= v_existing then return; end if;
    delete from scores where user_id = auth.uid() and game = p_game and detail->>'day' = p_day;
  end if;
  insert into scores (user_id, game, points, detail) values (auth.uid(), p_game, p_points, jsonb_build_object('day', p_day));
end $$;
grant execute on function public.submit_score(text, integer, text) to authenticated;

-- One page of a window: twenty rows, ranked, with usernames. The offset is
-- the page number times twenty; the tables are small and indexed on the
-- score, so a page is one scan.
create or replace function public.leaderboard_page(p_window text, p_page integer default 0)
returns table (rank bigint, user_id uuid, username text, score bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if p_window = 'daily' then
    return query select row_number() over (order by d.score desc, d.updated_at asc) as rank, d.user_id, p.username, d.score
      from leaderboard_daily d join profiles p on p.id = d.user_id
      order by d.score desc, d.updated_at asc limit 20 offset greatest(0, p_page) * 20;
  elsif p_window = 'weekly' then
    return query select row_number() over (order by w.score desc, w.updated_at asc), w.user_id, p.username, w.score
      from leaderboard_weekly w join profiles p on p.id = w.user_id
      order by w.score desc, w.updated_at asc limit 20 offset greatest(0, p_page) * 20;
  else
    return query select row_number() over (order by a.score desc, a.updated_at asc), a.user_id, p.username, a.score
      from leaderboard_alltime a join profiles p on p.id = a.user_id
      order by a.score desc, a.updated_at asc limit 20 offset greatest(0, p_page) * 20;
  end if;
end $$;
grant execute on function public.leaderboard_page(text, integer) to authenticated;

-- The caller's own standing in a window: rank, score, and how many are ranked.
create or replace function public.my_rank(p_window text)
returns table (rank bigint, score bigint, total bigint)
language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid(); my_score bigint; my_at timestamptz;
begin
  if me is null then return; end if;
  if p_window = 'daily' then
    select d.score, d.updated_at into my_score, my_at from leaderboard_daily d where d.user_id = me;
    if my_score is null then return; end if;
    return query select (select count(*) + 1 from leaderboard_daily x where x.score > my_score or (x.score = my_score and x.updated_at < my_at)), my_score, (select count(*) from leaderboard_daily);
  elsif p_window = 'weekly' then
    select w.score, w.updated_at into my_score, my_at from leaderboard_weekly w where w.user_id = me;
    if my_score is null then return; end if;
    return query select (select count(*) + 1 from leaderboard_weekly x where x.score > my_score or (x.score = my_score and x.updated_at < my_at)), my_score, (select count(*) from leaderboard_weekly);
  else
    select a.score, a.updated_at into my_score, my_at from leaderboard_alltime a where a.user_id = me;
    if my_score is null then return; end if;
    return query select (select count(*) + 1 from leaderboard_alltime x where x.score > my_score or (x.score = my_score and x.updated_at < my_at)), my_score, (select count(*) from leaderboard_alltime);
  end if;
end $$;
grant execute on function public.my_rank(text) to authenticated;

-- The windows are emptied on their clocks. pg_cron ships with Supabase but
-- has to be switched on once: Database -> Extensions -> pg_cron. If that has
-- not been done the two schedule lines below error and can be run later.
create extension if not exists pg_cron;
select cron.unschedule(jobid) from cron.job where jobname in ('wikster-daily-flush', 'wikster-weekly-flush');
select cron.schedule('wikster-daily-flush',  '0 0 * * *', $$truncate table public.leaderboard_daily$$);
select cron.schedule('wikster-weekly-flush', '0 0 * * 0', $$truncate table public.leaderboard_weekly$$);

-- Each player's dealt quests, one row per quest per day, written by the
-- quests function with the service key. A player may read their own.
create table if not exists public.quests (
  user_id    uuid not null references auth.users on delete cascade,
  day        text not null,
  quest_id   text not null,
  target     integer not null,
  progress   integer not null default 0,
  claimed    boolean not null default false,
  expires_at timestamptz not null,
  primary key (user_id, day, quest_id)
);
create index if not exists quests_user_day_idx on public.quests (user_id, day);
alter table public.quests enable row level security;
drop policy if exists "your quests are yours to read" on public.quests;
create policy "your quests are yours to read"
  on public.quests for select to authenticated using (auth.uid() = user_id);

-- ============================================================================
-- V7 - THE LIVE WIRES, AND A BOARD THAT COUNTS EVERY GAME
-- ----------------------------------------------------------------------------
-- The app used to find out about a message, a request, a gift or a trade by
-- asking once a minute. It now listens: the social tables join the Realtime
-- publication, and the rows a player may read (their row-level rules apply
-- to the stream as they do to a query) reach them the moment they are
-- written. Friendships keep their whole row on delete so a removal still
-- names who it was about. The board's three windows are published too, so a
-- leaderboard on screen moves as scores land.
--
-- submit_score gains the quiz and the slot machine, and no longer inflates a
-- window when a day's best is beaten: the row is updated in place and the
-- windows take the difference, instead of a delete that subtracted nothing
-- followed by an insert that added everything again.
-- ============================================================================

do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.deliveries;
exception when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.friendships;
exception when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.trades;
exception when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.leaderboard_daily;
exception when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.leaderboard_weekly;
exception when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.leaderboard_alltime;
exception when others then null; end $$;
alter table public.friendships replica identity full;

alter table public.scores drop constraint if exists scores_game_check;
alter table public.scores add constraint scores_game_check
  check (game in ('slots', 'roulette', 'wikdle', 'quest', 'duel', 'reveal', 'quiz'));

-- A beaten best moves the windows by the difference.
create or replace function public.scores_windows_delta()
returns trigger language plpgsql security definer set search_path = public as $$
declare d integer := new.points - old.points;
begin
  if d = 0 then return new; end if;
  update leaderboard_daily   set score = greatest(0, score + d), updated_at = now() where user_id = new.user_id;
  update leaderboard_weekly  set score = greatest(0, score + d), updated_at = now() where user_id = new.user_id;
  update leaderboard_alltime set score = greatest(0, score + d), updated_at = now() where user_id = new.user_id;
  return new;
end $$;
drop trigger if exists scores_windows_delta on public.scores;
create trigger scores_windows_delta after update of points on public.scores
  for each row execute function public.scores_windows_delta();

create or replace function public.submit_score(p_game text, p_points integer, p_day text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_max integer;
  v_existing integer;
begin
  if auth.uid() is null then raise exception 'sign in'; end if;
  v_max := case p_game
    when 'wikdle' then 1400 when 'duel' then 3100 when 'reveal' then 1600
    when 'slots' then 20000 when 'quiz' then 1000 else null end;
  if v_max is null then raise exception 'this game is not scored by the client'; end if;
  if p_points < 0 or p_points > v_max then raise exception 'points out of range'; end if;
  select points into v_existing from scores
    where user_id = auth.uid() and game = p_game and detail->>'day' = p_day
    limit 1;
  if v_existing is not null then
    if p_game = 'wikdle' or p_points <= v_existing then return; end if;
    update scores set points = p_points, at = now()
      where user_id = auth.uid() and game = p_game and detail->>'day' = p_day;
    return;
  end if;
  insert into scores (user_id, game, points, detail) values (auth.uid(), p_game, p_points, jsonb_build_object('day', p_day));
end $$;
grant execute on function public.submit_score(text, integer, text) to authenticated;

-- ============================================================================
-- V8 - THE SHOWCASE AND THE GUILDS
-- ----------------------------------------------------------------------------
-- A player pins up to three cards on their profile (a copy of each card, as
-- the profile row already carries a copy of the stats) and friends leave a
-- heart on them. A guild is a name, a tag and up to fifty players; every
-- point a member scores lands on the guild's three windows the moment it
-- lands on their own, through the same trigger, and the windows are emptied
-- on the same clocks.
-- ============================================================================

alter table public.profiles add column if not exists showcase jsonb not null default '[]'::jsonb;

create table if not exists public.showcase_kudos (
  owner      uuid not null references auth.users on delete cascade,
  key        text not null,
  sender     uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  primary key (owner, key, sender),
  check (owner <> sender)
);
alter table public.showcase_kudos enable row level security;
drop policy if exists "hearts are readable by signed-in players" on public.showcase_kudos;
create policy "hearts are readable by signed-in players"
  on public.showcase_kudos for select to authenticated using (true);
drop policy if exists "you leave hearts as yourself, on friends" on public.showcase_kudos;
create policy "you leave hearts as yourself, on friends"
  on public.showcase_kudos for insert to authenticated
  with check (auth.uid() = sender and exists (
    select 1 from friendships f where f.status = 'accepted'
      and ((f.requester = auth.uid() and f.addressee = owner) or (f.addressee = auth.uid() and f.requester = owner))));
drop policy if exists "you take back your own hearts" on public.showcase_kudos;
create policy "you take back your own hearts"
  on public.showcase_kudos for delete to authenticated using (auth.uid() = sender);

-- --- guilds -------------------------------------------------------------------

create table if not exists public.guilds (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 3 and 24),
  tag        text not null check (tag ~ '^[A-Z0-9]{2,5}$'),
  about      text not null default '' check (char_length(about) <= 140),
  owner      uuid not null references auth.users on delete cascade,
  members    integer not null default 0,
  created_at timestamptz not null default now()
);
create unique index if not exists guilds_name_lower_idx on public.guilds (lower(name));
create unique index if not exists guilds_tag_idx on public.guilds (tag);

create table if not exists public.guild_members (
  user_id   uuid primary key references auth.users on delete cascade,
  guild_id  uuid not null references public.guilds on delete cascade,
  joined_at timestamptz not null default now()
);
create index if not exists guild_members_guild_idx on public.guild_members (guild_id, joined_at);

create table if not exists public.guild_daily   (guild_id uuid primary key references public.guilds on delete cascade, score bigint not null default 0, updated_at timestamptz not null default now());
create table if not exists public.guild_weekly  (guild_id uuid primary key references public.guilds on delete cascade, score bigint not null default 0, updated_at timestamptz not null default now());
create table if not exists public.guild_alltime (guild_id uuid primary key references public.guilds on delete cascade, score bigint not null default 0, updated_at timestamptz not null default now());
create index if not exists guild_daily_score_idx   on public.guild_daily   (score desc, updated_at asc);
create index if not exists guild_weekly_score_idx  on public.guild_weekly  (score desc, updated_at asc);
create index if not exists guild_alltime_score_idx on public.guild_alltime (score desc, updated_at asc);

alter table public.guilds enable row level security;
alter table public.guild_members enable row level security;
alter table public.guild_daily enable row level security;
alter table public.guild_weekly enable row level security;
alter table public.guild_alltime enable row level security;
drop policy if exists "guilds are public" on public.guilds;
create policy "guilds are public" on public.guilds for select to authenticated using (true);
drop policy if exists "rosters are public" on public.guild_members;
create policy "rosters are public" on public.guild_members for select to authenticated using (true);
drop policy if exists "the guild board is public" on public.guild_daily;
create policy "the guild board is public" on public.guild_daily for select to authenticated using (true);
drop policy if exists "the guild board is public" on public.guild_weekly;
create policy "the guild board is public" on public.guild_weekly for select to authenticated using (true);
drop policy if exists "the guild board is public" on public.guild_alltime;
create policy "the guild board is public" on public.guild_alltime for select to authenticated using (true);
-- No write policies on purpose: membership and scores move through the
-- functions below and the trigger.

-- A member's points move their guild's windows by the same amount.
create or replace function public.guild_windows_add(p_user uuid, p_delta integer)
returns void language plpgsql security definer set search_path = public as $$
declare g uuid;
begin
  if p_delta = 0 then return; end if;
  select guild_id into g from guild_members where user_id = p_user;
  if g is null then return; end if;
  insert into guild_daily (guild_id, score) values (g, greatest(0, p_delta))
    on conflict (guild_id) do update set score = greatest(0, guild_daily.score + p_delta), updated_at = now();
  insert into guild_weekly (guild_id, score) values (g, greatest(0, p_delta))
    on conflict (guild_id) do update set score = greatest(0, guild_weekly.score + p_delta), updated_at = now();
  insert into guild_alltime (guild_id, score) values (g, greatest(0, p_delta))
    on conflict (guild_id) do update set score = greatest(0, guild_alltime.score + p_delta), updated_at = now();
end $$;

create or replace function public.scores_into_windows()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into leaderboard_daily (user_id, score) values (new.user_id, new.points)
    on conflict (user_id) do update set score = leaderboard_daily.score + excluded.score, updated_at = now();
  insert into leaderboard_weekly (user_id, score) values (new.user_id, new.points)
    on conflict (user_id) do update set score = leaderboard_weekly.score + excluded.score, updated_at = now();
  insert into leaderboard_alltime (user_id, score) values (new.user_id, new.points)
    on conflict (user_id) do update set score = leaderboard_alltime.score + excluded.score, updated_at = now();
  perform guild_windows_add(new.user_id, new.points);
  return new;
end $$;

create or replace function public.scores_windows_delta()
returns trigger language plpgsql security definer set search_path = public as $$
declare d integer := new.points - old.points;
begin
  if d = 0 then return new; end if;
  update leaderboard_daily   set score = greatest(0, score + d), updated_at = now() where user_id = new.user_id;
  update leaderboard_weekly  set score = greatest(0, score + d), updated_at = now() where user_id = new.user_id;
  update leaderboard_alltime set score = greatest(0, score + d), updated_at = now() where user_id = new.user_id;
  perform guild_windows_add(new.user_id, d);
  return new;
end $$;

-- Founding, joining, leaving. One guild per player; fifty players per guild.
create or replace function public.create_guild(p_name text, p_tag text, p_about text default '')
returns public.guilds language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); row_out guilds;
begin
  if me is null then raise exception 'sign in'; end if;
  if exists (select 1 from guild_members where user_id = me) then raise exception 'ALREADY_IN_GUILD'; end if;
  if exists (select 1 from guilds where lower(name) = lower(trim(p_name))) then raise exception 'NAME_TAKEN'; end if;
  if exists (select 1 from guilds where tag = upper(trim(p_tag))) then raise exception 'TAG_TAKEN'; end if;
  insert into guilds (name, tag, about, owner, members)
    values (trim(p_name), upper(trim(p_tag)), coalesce(trim(p_about), ''), me, 1)
    returning * into row_out;
  insert into guild_members (user_id, guild_id) values (me, row_out.id);
  return row_out;
end $$;

create or replace function public.join_guild(p_guild uuid)
returns public.guilds language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); row_out guilds;
begin
  if me is null then raise exception 'sign in'; end if;
  if exists (select 1 from guild_members where user_id = me) then raise exception 'ALREADY_IN_GUILD'; end if;
  select * into row_out from guilds where id = p_guild for update;
  if row_out.id is null then raise exception 'NOT_FOUND'; end if;
  if row_out.members >= 50 then raise exception 'GUILD_FULL'; end if;
  insert into guild_members (user_id, guild_id) values (me, p_guild);
  update guilds set members = members + 1 where id = p_guild returning * into row_out;
  return row_out;
end $$;

-- Leaving hands the guild to its oldest remaining member; the last one out
-- takes the guild with them, windows and all.
create or replace function public.leave_guild()
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); g uuid; heir uuid; left_n integer;
begin
  if me is null then raise exception 'sign in'; end if;
  select guild_id into g from guild_members where user_id = me;
  if g is null then return; end if;
  delete from guild_members where user_id = me;
  select count(*) into left_n from guild_members where guild_id = g;
  if left_n = 0 then
    delete from guilds where id = g;
    return;
  end if;
  update guilds set members = left_n where id = g;
  if (select owner from guilds where id = g) = me then
    select user_id into heir from guild_members where guild_id = g order by joined_at asc limit 1;
    update guilds set owner = heir where id = g;
  end if;
end $$;

create or replace function public.my_guild()
returns public.guilds language sql stable security definer set search_path = public as $$
  select g.* from guilds g join guild_members m on m.guild_id = g.id where m.user_id = auth.uid();
$$;

create or replace function public.search_guilds(p_term text)
returns setof public.guilds language sql stable security definer set search_path = public as $$
  select * from guilds
    where p_term is null or p_term = '' or name ilike '%' || p_term || '%' or tag ilike '%' || p_term || '%'
    order by members desc, created_at asc limit 20;
$$;

create or replace function public.guild_roster(p_guild uuid)
returns table (user_id uuid, username text, level integer, joined_at timestamptz, score bigint)
language sql stable security definer set search_path = public as $$
  select m.user_id, p.username, p.level, m.joined_at, coalesce(a.score, 0)
    from guild_members m join profiles p on p.id = m.user_id
    left join leaderboard_alltime a on a.user_id = m.user_id
    where m.guild_id = p_guild order by coalesce(a.score, 0) desc, m.joined_at asc;
$$;

create or replace function public.guild_board(p_window text, p_page integer default 0)
returns table (rank bigint, guild_id uuid, name text, tag text, members integer, score bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if p_window = 'daily' then
    return query select row_number() over (order by d.score desc, d.updated_at asc), g.id, g.name, g.tag, g.members, d.score
      from guild_daily d join guilds g on g.id = d.guild_id order by d.score desc, d.updated_at asc limit 20 offset greatest(0, p_page) * 20;
  elsif p_window = 'weekly' then
    return query select row_number() over (order by w.score desc, w.updated_at asc), g.id, g.name, g.tag, g.members, w.score
      from guild_weekly w join guilds g on g.id = w.guild_id order by w.score desc, w.updated_at asc limit 20 offset greatest(0, p_page) * 20;
  else
    return query select row_number() over (order by a.score desc, a.updated_at asc), g.id, g.name, g.tag, g.members, a.score
      from guild_alltime a join guilds g on g.id = a.guild_id order by a.score desc, a.updated_at asc limit 20 offset greatest(0, p_page) * 20;
  end if;
end $$;

create or replace function public.my_guild_rank(p_window text)
returns table (rank bigint, score bigint, total bigint)
language plpgsql stable security definer set search_path = public as $$
declare g uuid; my_score bigint; my_at timestamptz;
begin
  select guild_id into g from guild_members where user_id = auth.uid();
  if g is null then return; end if;
  if p_window = 'daily' then
    select d.score, d.updated_at into my_score, my_at from guild_daily d where d.guild_id = g;
    if my_score is null then return query select null::bigint, 0::bigint, (select count(*) from guild_daily); return; end if;
    return query select (select count(*) + 1 from guild_daily x where x.score > my_score or (x.score = my_score and x.updated_at < my_at)), my_score, (select count(*) from guild_daily);
  elsif p_window = 'weekly' then
    select w.score, w.updated_at into my_score, my_at from guild_weekly w where w.guild_id = g;
    if my_score is null then return query select null::bigint, 0::bigint, (select count(*) from guild_weekly); return; end if;
    return query select (select count(*) + 1 from guild_weekly x where x.score > my_score or (x.score = my_score and x.updated_at < my_at)), my_score, (select count(*) from guild_weekly);
  else
    select a.score, a.updated_at into my_score, my_at from guild_alltime a where a.guild_id = g;
    if my_score is null then return query select null::bigint, 0::bigint, (select count(*) from guild_alltime); return; end if;
    return query select (select count(*) + 1 from guild_alltime x where x.score > my_score or (x.score = my_score and x.updated_at < my_at)), my_score, (select count(*) from guild_alltime);
  end if;
end $$;

grant execute on function public.create_guild(text, text, text) to authenticated;
grant execute on function public.join_guild(uuid) to authenticated;
grant execute on function public.leave_guild() to authenticated;
grant execute on function public.my_guild() to authenticated;
grant execute on function public.search_guilds(text) to authenticated;
grant execute on function public.guild_roster(uuid) to authenticated;
grant execute on function public.guild_board(text, integer) to authenticated;
grant execute on function public.my_guild_rank(text) to authenticated;

-- The guild windows turn with the players' (see V6 for switching pg_cron on).
select cron.unschedule(jobid) from cron.job where jobname in ('wikster-daily-flush', 'wikster-weekly-flush');
select cron.schedule('wikster-daily-flush',  '0 0 * * *', $$truncate table public.leaderboard_daily; truncate table public.guild_daily$$);
select cron.schedule('wikster-weekly-flush', '0 0 * * 0', $$truncate table public.leaderboard_weekly; truncate table public.guild_weekly$$);

do $$ begin
  alter publication supabase_realtime add table public.guild_daily;
exception when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.guild_weekly;
exception when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.guild_alltime;
exception when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.showcase_kudos;
exception when others then null; end $$;

-- ============================================================================
-- V9 - CLOSING A GUILD, AND ASKING A FRIEND IN
-- ----------------------------------------------------------------------------
-- Two things a guild had no way to do. Closing: the founder takes the guild
-- down, members, windows and pending invitations with it, instead of the
-- roundabout of leaving until it empties. Inviting: any member asks a friend
-- in, and the friend answers on their own screen. An invitation is an offer,
-- never a membership: it is the accept that checks the room is still there,
-- still has space, and that the guest is not already in one.
-- ============================================================================

create table if not exists public.guild_invites (
  id         uuid primary key default gen_random_uuid(),
  guild_id   uuid not null references public.guilds on delete cascade,
  inviter    uuid not null references auth.users on delete cascade,
  invitee    uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  unique (guild_id, invitee),
  check (inviter <> invitee)
);
create index if not exists guild_invites_invitee_idx on public.guild_invites (invitee, created_at desc);

alter table public.guild_invites enable row level security;
drop policy if exists "you see invitations to you or from your guild" on public.guild_invites;
create policy "you see invitations to you or from your guild"
  on public.guild_invites for select to authenticated
  using (auth.uid() = invitee or auth.uid() = inviter
    or exists (select 1 from guild_members m where m.user_id = auth.uid() and m.guild_id = guild_invites.guild_id));
-- No write policies on purpose: invitations are posted, accepted and turned
-- down through the functions below.

-- A member asks a friend in. The guild must have room, the guest must be a
-- friend and must not already be in a guild. Asking twice is not an error:
-- the standing invitation simply keeps its place.
create or replace function public.invite_to_guild(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); g guilds;
begin
  if me is null then raise exception 'sign in'; end if;
  if p_user is null or p_user = me then raise exception 'NOT_FOUND'; end if;
  select gu.* into g from guilds gu join guild_members m on m.guild_id = gu.id where m.user_id = me;
  if g.id is null then raise exception 'NOT_IN_GUILD'; end if;
  if g.members >= 50 then raise exception 'GUILD_FULL'; end if;
  if not public.are_friends(me, p_user) then raise exception 'NOT_FRIEND'; end if;
  if exists (select 1 from guild_members where user_id = p_user) then raise exception 'ALREADY_MEMBER'; end if;
  insert into guild_invites (guild_id, inviter, invitee) values (g.id, me, p_user)
    on conflict (guild_id, invitee) do nothing;
end $$;

-- What is waiting for me, newest first, with the guild and who asked.
create or replace function public.my_guild_invites()
returns table (id uuid, guild_id uuid, name text, tag text, about text, members integer, inviter uuid, inviter_name text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select i.id, g.id, g.name, g.tag, g.about, g.members, i.inviter, coalesce(p.username, '?'), i.created_at
    from guild_invites i
    join guilds g on g.id = i.guild_id
    left join profiles p on p.id = i.inviter
    where i.invitee = auth.uid()
    order by i.created_at desc
    limit 20;
$$;

-- Saying yes. Everything is checked here, at the moment it matters, and all
-- of my other invitations go with it: I can only be in one guild.
create or replace function public.accept_guild_invite(p_invite uuid)
returns public.guilds language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); g uuid; row_out guilds;
begin
  if me is null then raise exception 'sign in'; end if;
  if exists (select 1 from guild_members where user_id = me) then raise exception 'ALREADY_IN_GUILD'; end if;
  select guild_id into g from guild_invites where id = p_invite and invitee = me;
  if g is null then raise exception 'INVITE_GONE'; end if;
  select * into row_out from guilds where id = g for update;
  if row_out.id is null then raise exception 'NOT_FOUND'; end if;
  if row_out.members >= 50 then raise exception 'GUILD_FULL'; end if;
  insert into guild_members (user_id, guild_id) values (me, g);
  update guilds set members = members + 1 where id = g returning * into row_out;
  delete from guild_invites where invitee = me;
  return row_out;
end $$;

create or replace function public.decline_guild_invite(p_invite uuid)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'sign in'; end if;
  delete from guild_invites where id = p_invite and invitee = me;
end $$;

-- The founder closes the guild. The rows that hang off it - the roster, the
-- three windows, the standing invitations - all cascade from this one delete.
create or replace function public.delete_guild()
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); g uuid;
begin
  if me is null then raise exception 'sign in'; end if;
  select guild_id into g from guild_members where user_id = me;
  if g is null then raise exception 'NOT_FOUND'; end if;
  if (select owner from guilds where id = g) <> me then raise exception 'NOT_OWNER'; end if;
  delete from guilds where id = g;
end $$;

grant execute on function public.invite_to_guild(uuid) to authenticated;
grant execute on function public.my_guild_invites() to authenticated;
grant execute on function public.accept_guild_invite(uuid) to authenticated;
grant execute on function public.decline_guild_invite(uuid) to authenticated;
grant execute on function public.delete_guild() to authenticated;

-- An invitation should land on the guest's screen the moment it is sent.
do $$ begin
  alter publication supabase_realtime add table public.guild_invites;
exception when others then null; end $$;

-- ============================================================================
-- V10 - THE GUILD HALL
-- ----------------------------------------------------------------------------
-- A guild was a name, a tag and a board. This is what happens inside it.
--
--   guild_messages   a room the whole roster talks in
--   guild_goals      one shared target a week, picked for the guild, that
--                    every member chips at and every member is paid for
--   guild_bank       duplicates put on the table for anyone in the guild
--   guild_matches    a weekly match against the nearest guild on the board
--
-- The week is the leaderboard's week: Sunday 00:00 UTC to Sunday 00:00 UTC,
-- which is when the weekly windows are emptied. week_key names one.
-- ============================================================================

create or replace function public.week_key(p_at timestamptz default now())
returns text language sql immutable as $$
  select (((extract(epoch from p_at)::bigint / 86400) + 4) / 7)::text;
$$;

-- Whether the caller is in a guild, and which.
create or replace function public.my_guild_id()
returns uuid language sql stable security definer set search_path = public as $$
  select guild_id from guild_members where user_id = auth.uid();
$$;

-- --- the room ------------------------------------------------------------------

create table if not exists public.guild_messages (
  id          uuid primary key default gen_random_uuid(),
  guild_id    uuid not null references public.guilds on delete cascade,
  sender      uuid not null references auth.users on delete cascade,
  sender_name text not null default '',
  body        text not null check (char_length(body) between 1 and 500),
  created_at  timestamptz not null default now()
);
create index if not exists guild_messages_guild_idx on public.guild_messages (guild_id, created_at desc);
alter table public.guild_messages enable row level security;
drop policy if exists "members read their guild's room" on public.guild_messages;
create policy "members read their guild's room"
  on public.guild_messages for select to authenticated
  using (exists (select 1 from guild_members m where m.user_id = auth.uid() and m.guild_id = guild_messages.guild_id));
-- Writes go through guild_say, which stamps the name.

create or replace function public.guild_say(p_body text)
returns public.guild_messages language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); g uuid; row_out guild_messages;
begin
  if me is null then raise exception 'sign in'; end if;
  g := my_guild_id();
  if g is null then raise exception 'NOT_IN_GUILD'; end if;
  insert into guild_messages (guild_id, sender, sender_name, body)
    values (g, me, coalesce((select username from profiles where id = me), ''), left(trim(p_body), 500))
    returning * into row_out;
  return row_out;
end $$;

-- The last sixty lines, oldest first.
create or replace function public.guild_chat()
returns setof public.guild_messages language sql stable security definer set search_path = public as $$
  select * from (
    select m.* from guild_messages m where m.guild_id = my_guild_id() order by m.created_at desc limit 60
  ) recent order by created_at asc;
$$;

-- --- the weekly goal -----------------------------------------------------------
--
-- One goal a week per guild, chosen from the guild and the week so it cannot
-- be re-rolled. The target grows with the roster, but slower than the roster
-- does: a guild of ten shares a target five and a half times a guild of one,
-- so every member who joins makes it easier per head. That is the point.

create table if not exists public.guild_goals (
  guild_id   uuid not null references public.guilds on delete cascade,
  week       text not null,
  kind       text not null check (kind in ('open', 'points', 'new', 'wikdle')),
  target     integer not null,
  progress   integer not null default 0,
  members    integer not null default 1,
  done_at    timestamptz,
  created_at timestamptz not null default now(),
  primary key (guild_id, week)
);
create table if not exists public.guild_goal_claims (
  guild_id   uuid not null,
  week       text not null,
  user_id    uuid not null references auth.users on delete cascade,
  claimed_at timestamptz not null default now(),
  primary key (guild_id, week, user_id),
  foreign key (guild_id, week) references public.guild_goals on delete cascade
);
alter table public.guild_goals enable row level security;
alter table public.guild_goal_claims enable row level security;
drop policy if exists "members read their guild's goal" on public.guild_goals;
create policy "members read their guild's goal"
  on public.guild_goals for select to authenticated
  using (exists (select 1 from guild_members m where m.user_id = auth.uid() and m.guild_id = guild_goals.guild_id));
drop policy if exists "you read your own goal claims" on public.guild_goal_claims;
create policy "you read your own goal claims"
  on public.guild_goal_claims for select to authenticated using (auth.uid() = user_id);

create or replace function public.guild_goal_base(p_kind text)
returns integer language sql immutable as $$
  select case p_kind when 'open' then 12 when 'points' then 1500 when 'new' then 15 when 'wikdle' then 3 else 10 end;
$$;

-- The week's goal for a guild, made now if it is not there yet.
create or replace function public.guild_goal_ensure(p_guild uuid)
returns public.guild_goals language plpgsql security definer set search_path = public as $$
declare wk text := week_key(); row_out guild_goals; n integer; k text; kinds text[] := array['open', 'points', 'new', 'wikdle'];
begin
  select greatest(1, members) into n from guilds where id = p_guild;
  select * into row_out from guild_goals where guild_id = p_guild and week = wk;
  if row_out.guild_id is not null then
    -- The roster grew since the week began: the target grows with it, so a
    -- guild cannot fill up on the last day for a goal one member met alone.
    if n > row_out.members and row_out.done_at is null then
      update guild_goals set members = n, target = greatest(progress, round(guild_goal_base(kind) * (1 + 0.5 * (n - 1)))::integer)
        where guild_id = p_guild and week = wk returning * into row_out;
    end if;
    return row_out;
  end if;
  k := kinds[1 + (abs(hashtext(p_guild::text || ':' || wk)) % 4)];
  insert into guild_goals (guild_id, week, kind, target, members)
    values (p_guild, wk, k, round(guild_goal_base(k) * (1 + 0.5 * (n - 1)))::integer, n)
    on conflict (guild_id, week) do nothing;
  select * into row_out from guild_goals where guild_id = p_guild and week = wk;
  return row_out;
end $$;

-- Progress lands here from the client (a booster opened, a new card, a
-- Wikdle solved) and from the score trigger (points). Never past the target.
create or replace function public.guild_goal_bump(p_guild uuid, p_kind text, p_amount integer)
returns void language plpgsql security definer set search_path = public as $$
declare goal guild_goals;
begin
  if p_guild is null or p_amount is null or p_amount <= 0 then return; end if;
  goal := guild_goal_ensure(p_guild);
  if goal.kind <> p_kind or goal.done_at is not null then return; end if;
  update guild_goals set progress = least(target, progress + p_amount),
    done_at = case when progress + p_amount >= target then now() else null end
    where guild_id = p_guild and week = goal.week;
end $$;

create or replace function public.guild_goal_add(p_kind text, p_amount integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'sign in'; end if;
  if p_kind not in ('open', 'new', 'wikdle') then raise exception 'not a client kind'; end if;
  perform guild_goal_bump(my_guild_id(), p_kind, least(100, greatest(0, p_amount)));
end $$;

-- What the screen shows: the goal (made now if the week has not been looked
-- at yet), and whether I have been paid for it.
create or replace function public.guild_goal()
returns table (week text, kind text, target integer, progress integer, members integer, done_at timestamptz, claimed boolean, reward integer)
language plpgsql security definer set search_path = public as $$
declare g uuid := my_guild_id(); goal guild_goals;
begin
  if g is null then return; end if;
  goal := guild_goal_ensure(g);
  if goal.guild_id is null then return; end if;
  return query select goal.week, goal.kind, goal.target, goal.progress, goal.members, goal.done_at,
    exists (select 1 from guild_goal_claims c where c.guild_id = g and c.week = goal.week and c.user_id = auth.uid()),
    900;
end $$;

-- Paid once per member, once the target is met, and only to members.
create or replace function public.guild_goal_claim()
returns integer language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); g uuid; goal guild_goals;
begin
  if me is null then raise exception 'sign in'; end if;
  g := my_guild_id();
  if g is null then raise exception 'NOT_IN_GUILD'; end if;
  select * into goal from guild_goals where guild_id = g and week = week_key();
  if goal.guild_id is null or goal.done_at is null then raise exception 'NOT_DONE'; end if;
  if exists (select 1 from guild_goal_claims where guild_id = g and week = goal.week and user_id = me) then raise exception 'CLAIMED'; end if;
  insert into guild_goal_claims (guild_id, week, user_id) values (g, goal.week, me);
  return 900;
end $$;

-- Points count for the goal too, from the same trigger that fills the windows.
create or replace function public.guild_windows_add(p_user uuid, p_delta integer)
returns void language plpgsql security definer set search_path = public as $$
declare g uuid;
begin
  if p_delta = 0 then return; end if;
  select guild_id into g from guild_members where user_id = p_user;
  if g is null then return; end if;
  insert into guild_daily (guild_id, score) values (g, greatest(0, p_delta))
    on conflict (guild_id) do update set score = greatest(0, guild_daily.score + p_delta), updated_at = now();
  insert into guild_weekly (guild_id, score) values (g, greatest(0, p_delta))
    on conflict (guild_id) do update set score = greatest(0, guild_weekly.score + p_delta), updated_at = now();
  insert into guild_alltime (guild_id, score) values (g, greatest(0, p_delta))
    on conflict (guild_id) do update set score = greatest(0, guild_alltime.score + p_delta), updated_at = now();
  if p_delta > 0 then perform guild_goal_bump(g, 'points', p_delta); end if;
end $$;

-- --- the bank ------------------------------------------------------------------
--
-- A card put on the table is anyone's to take, three a day each, so the pile
-- of duplicates in every collection turns into something to talk about.

create table if not exists public.guild_bank (
  id         uuid primary key default gen_random_uuid(),
  guild_id   uuid not null references public.guilds on delete cascade,
  donor      uuid not null references auth.users on delete cascade,
  donor_name text not null default '',
  card       jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists guild_bank_guild_idx on public.guild_bank (guild_id, created_at desc);
create table if not exists public.guild_bank_takes (
  user_id uuid not null references auth.users on delete cascade,
  day     date not null,
  n       integer not null default 0,
  primary key (user_id, day)
);
alter table public.guild_bank enable row level security;
alter table public.guild_bank_takes enable row level security;
drop policy if exists "members see their guild's bank" on public.guild_bank;
create policy "members see their guild's bank"
  on public.guild_bank for select to authenticated
  using (exists (select 1 from guild_members m where m.user_id = auth.uid() and m.guild_id = guild_bank.guild_id));
drop policy if exists "you see your own takes" on public.guild_bank_takes;
create policy "you see your own takes"
  on public.guild_bank_takes for select to authenticated using (auth.uid() = user_id);

create or replace function public.guild_bank()
returns setof public.guild_bank language sql stable security definer set search_path = public as $$
  select * from guild_bank where guild_id = my_guild_id() order by created_at desc limit 200;
$$;

create or replace function public.guild_bank_donate(p_card jsonb)
returns public.guild_bank language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); g uuid; row_out guild_bank;
begin
  if me is null then raise exception 'sign in'; end if;
  g := my_guild_id();
  if g is null then raise exception 'NOT_IN_GUILD'; end if;
  if p_card is null or p_card->>'key' is null or p_card->>'title' is null then raise exception 'BAD_CARD'; end if;
  if (select count(*) from guild_bank where guild_id = g) >= 200 then raise exception 'BANK_FULL'; end if;
  insert into guild_bank (guild_id, donor, donor_name, card)
    values (g, me, coalesce((select username from profiles where id = me), ''), p_card)
    returning * into row_out;
  return row_out;
end $$;

create or replace function public.guild_bank_take(p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); g uuid; taken guild_bank; today date := (now() at time zone 'utc')::date; n integer;
begin
  if me is null then raise exception 'sign in'; end if;
  g := my_guild_id();
  if g is null then raise exception 'NOT_IN_GUILD'; end if;
  select coalesce(t.n, 0) into n from guild_bank_takes t where t.user_id = me and t.day = today;
  if coalesce(n, 0) >= 3 then raise exception 'TAKE_LIMIT'; end if;
  delete from guild_bank where id = p_id and guild_id = g returning * into taken;
  if taken.id is null then raise exception 'GONE'; end if;
  insert into guild_bank_takes (user_id, day, n) values (me, today, 1)
    on conflict (user_id, day) do update set n = guild_bank_takes.n + 1;
  return taken.card;
end $$;

-- How many more a member may take today.
create or replace function public.guild_bank_takes_left()
returns integer language sql stable security definer set search_path = public as $$
  select 3 - coalesce((select n from guild_bank_takes where user_id = auth.uid() and day = (now() at time zone 'utc')::date), 0);
$$;

-- --- guild versus guild ----------------------------------------------------------
--
-- Each week a guild is paired with the nearest guild on the weekly board that
-- has no match yet, the first time anyone in it looks. The pair holds for the
-- week; the scores are the weekly window, live. At the turn of the week the
-- final scores are written down here before the window is emptied, so last
-- week's result is still there to be paid for.

create table if not exists public.guild_matches (
  week       text not null,
  guild_a    uuid not null references public.guilds on delete cascade,
  guild_b    uuid not null references public.guilds on delete cascade,
  score_a    bigint,
  score_b    bigint,
  created_at timestamptz not null default now(),
  primary key (week, guild_a),
  unique (week, guild_b)
);
create table if not exists public.guild_match_claims (
  week       text not null,
  user_id    uuid not null references auth.users on delete cascade,
  claimed_at timestamptz not null default now(),
  primary key (week, user_id)
);
alter table public.guild_matches enable row level security;
alter table public.guild_match_claims enable row level security;
drop policy if exists "matches are public" on public.guild_matches;
create policy "matches are public" on public.guild_matches for select to authenticated using (true);
drop policy if exists "you see your own match claims" on public.guild_match_claims;
create policy "you see your own match claims"
  on public.guild_match_claims for select to authenticated using (auth.uid() = user_id);

create or replace function public.guild_match()
returns table (week text, opponent_id uuid, opponent_name text, opponent_tag text, opponent_members integer,
               my_score bigint, their_score bigint,
               last_week text, last_opponent_name text, last_my_score bigint, last_their_score bigint, last_won boolean, last_claimed boolean)
language plpgsql security definer set search_path = public as $$
declare g uuid := my_guild_id(); wk text := week_key(); prev text := week_key(now() - interval '7 days');
        other uuid; m guild_matches; lm guild_matches; last_other uuid;
begin
  if g is null then return; end if;
  select * into m from guild_matches gm where gm.week = wk and (gm.guild_a = g or gm.guild_b = g);
  if m.week is null then
    -- The nearest guild by this week's score that nobody has claimed yet.
    select x.id into other from guilds x
      left join guild_weekly w on w.guild_id = x.id
      where x.id <> g
        and not exists (select 1 from guild_matches gm where gm.week = wk and (gm.guild_a = x.id or gm.guild_b = x.id))
      order by abs(coalesce(w.score, 0) - coalesce((select score from guild_weekly where guild_id = g), 0)) asc, x.members desc, x.created_at asc
      limit 1;
    if other is not null then
      begin
        insert into guild_matches (week, guild_a, guild_b) values (wk, g, other);
      exception when unique_violation then null; end;
      select * into m from guild_matches gm where gm.week = wk and (gm.guild_a = g or gm.guild_b = g);
    end if;
  end if;
  other := case when m.guild_a = g then m.guild_b when m.guild_b = g then m.guild_a else null end;
  select * into lm from guild_matches gm where gm.week = prev and (gm.guild_a = g or gm.guild_b = g);
  last_other := case when lm.guild_a = g then lm.guild_b when lm.guild_b = g then lm.guild_a else null end;
  return query select wk, other,
    (select name from guilds where id = other), (select tag from guilds where id = other), (select members from guilds where id = other),
    coalesce((select score from guild_weekly where guild_id = g), 0)::bigint,
    coalesce((select score from guild_weekly where guild_id = other), 0)::bigint,
    lm.week, (select name from guilds where id = last_other),
    case when lm.guild_a = g then lm.score_a else lm.score_b end,
    case when lm.guild_a = g then lm.score_b else lm.score_a end,
    case when lm.week is null or lm.score_a is null then null
         else (case when lm.guild_a = g then lm.score_a > lm.score_b else lm.score_b > lm.score_a end) end,
    exists (select 1 from guild_match_claims c where c.week = prev and c.user_id = auth.uid());
end $$;

create or replace function public.guild_match_claim()
returns integer language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); g uuid; prev text := week_key(now() - interval '7 days'); lm guild_matches; won boolean;
begin
  if me is null then raise exception 'sign in'; end if;
  g := my_guild_id();
  if g is null then raise exception 'NOT_IN_GUILD'; end if;
  select * into lm from guild_matches where week = prev and (guild_a = g or guild_b = g);
  if lm.week is null or lm.score_a is null then raise exception 'NOT_DONE'; end if;
  won := case when lm.guild_a = g then lm.score_a > lm.score_b else lm.score_b > lm.score_a end;
  if not won then raise exception 'NOT_DONE'; end if;
  if exists (select 1 from guild_match_claims where week = prev and user_id = me) then raise exception 'CLAIMED'; end if;
  insert into guild_match_claims (week, user_id) values (prev, me);
  return 750;
end $$;

-- The turn of the week: the matches are settled from the window before the
-- window is emptied. pg_cron calls this instead of truncating on its own.
create or replace function public.week_turn()
returns void language plpgsql security definer set search_path = public as $$
declare ending text := week_key(now() - interval '1 hour');
begin
  update guild_matches gm set
    score_a = coalesce((select score from guild_weekly where guild_id = gm.guild_a), 0),
    score_b = coalesce((select score from guild_weekly where guild_id = gm.guild_b), 0)
    where gm.week = ending and gm.score_a is null;
  truncate table public.leaderboard_weekly;
  truncate table public.guild_weekly;
end $$;

grant execute on function public.week_key(timestamptz) to authenticated;
grant execute on function public.my_guild_id() to authenticated;
grant execute on function public.guild_say(text) to authenticated;
grant execute on function public.guild_chat() to authenticated;
grant execute on function public.guild_goal() to authenticated;
grant execute on function public.guild_goal_add(text, integer) to authenticated;
grant execute on function public.guild_goal_claim() to authenticated;
grant execute on function public.guild_bank() to authenticated;
grant execute on function public.guild_bank_donate(jsonb) to authenticated;
grant execute on function public.guild_bank_take(uuid) to authenticated;
grant execute on function public.guild_bank_takes_left() to authenticated;
grant execute on function public.guild_match() to authenticated;
grant execute on function public.guild_match_claim() to authenticated;
revoke all on function public.guild_goal_ensure(uuid) from public;
revoke all on function public.guild_goal_bump(uuid, text, integer) from public;
revoke all on function public.week_turn() from public;

select cron.unschedule(jobid) from cron.job where jobname = 'wikster-weekly-flush';
select cron.schedule('wikster-weekly-flush', '0 0 * * 0', $$select public.week_turn()$$);

do $$ begin
  alter publication supabase_realtime add table public.guild_messages;
exception when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.guild_bank;
exception when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.guild_goals;
exception when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.guild_matches;
exception when others then null; end $$;

-- ============================================================================
-- V11 - THE SEASONS
-- ----------------------------------------------------------------------------
-- The year in eleven parts (src/data/seasons.js is the calendar the app
-- reads; this table is the same calendar, so the server can say which
-- season a score belongs to without trusting the phone's clock). Every
-- score lands on a fourth window filed under the season it was scored in,
-- for players and for guilds, and the windows of past seasons stay: a
-- season is never emptied, the next one simply starts a new key.
-- ============================================================================

create table if not exists public.seasons (
  id         text primary key,
  ord        integer not null,
  from_month integer not null, from_day integer not null,
  to_month   integer not null, to_day   integer not null
);
insert into public.seasons (id, ord, from_month, from_day, to_month, to_day) values
  ('frost', 1, 1, 1, 2, 1), ('hearts', 2, 2, 1, 3, 1), ('thaw', 3, 3, 1, 4, 1), ('fools', 4, 4, 1, 5, 1),
  ('bloom', 5, 5, 1, 6, 1), ('solstice', 6, 6, 1, 7, 14), ('voyage', 7, 7, 14, 9, 1), ('harvest', 8, 9, 1, 10, 1),
  ('hallows', 9, 10, 1, 11, 3), ('ember', 10, 11, 3, 12, 1), ('yule', 11, 12, 1, 1, 1)
on conflict (id) do update set ord = excluded.ord, from_month = excluded.from_month, from_day = excluded.from_day,
  to_month = excluded.to_month, to_day = excluded.to_day;
alter table public.seasons enable row level security;
drop policy if exists "the calendar is public" on public.seasons;
create policy "the calendar is public" on public.seasons for select to authenticated using (true);

-- The key a score is filed under today: the year the season began, and its id.
create or replace function public.current_season_key()
returns text language plpgsql stable set search_path = public as $$
declare d date := (now() at time zone 'utc')::date; y integer := extract(year from (now() at time zone 'utc'))::integer; r record;
begin
  for r in select * from seasons order by ord loop
    if r.to_month < r.from_month or (r.to_month = r.from_month and r.to_day <= r.from_day) then
      -- A season across the year end: it began this year, or last.
      if d >= make_date(y, r.from_month, r.from_day) then return y || '-' || r.id; end if;
      if d < make_date(y, r.to_month, r.to_day) then return (y - 1) || '-' || r.id; end if;
    elsif d >= make_date(y, r.from_month, r.from_day) and d < make_date(y, r.to_month, r.to_day) then
      return y || '-' || r.id;
    end if;
  end loop;
  return y || '-none';
end $$;

create table if not exists public.leaderboard_season (
  season     text not null,
  user_id    uuid not null references auth.users on delete cascade,
  score      bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (season, user_id)
);
create index if not exists leaderboard_season_idx on public.leaderboard_season (season, score desc, updated_at asc);
create table if not exists public.guild_season (
  season     text not null,
  guild_id   uuid not null references public.guilds on delete cascade,
  score      bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (season, guild_id)
);
create index if not exists guild_season_idx on public.guild_season (season, score desc, updated_at asc);
alter table public.leaderboard_season enable row level security;
alter table public.guild_season enable row level security;
drop policy if exists "the season board is public" on public.leaderboard_season;
create policy "the season board is public" on public.leaderboard_season for select to authenticated using (true);
drop policy if exists "the guild season board is public" on public.guild_season;
create policy "the guild season board is public" on public.guild_season for select to authenticated using (true);

-- The same trigger fills the fourth window.
create or replace function public.scores_into_windows()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into leaderboard_daily (user_id, score) values (new.user_id, new.points)
    on conflict (user_id) do update set score = leaderboard_daily.score + excluded.score, updated_at = now();
  insert into leaderboard_weekly (user_id, score) values (new.user_id, new.points)
    on conflict (user_id) do update set score = leaderboard_weekly.score + excluded.score, updated_at = now();
  insert into leaderboard_alltime (user_id, score) values (new.user_id, new.points)
    on conflict (user_id) do update set score = leaderboard_alltime.score + excluded.score, updated_at = now();
  insert into leaderboard_season (season, user_id, score) values (current_season_key(), new.user_id, new.points)
    on conflict (season, user_id) do update set score = leaderboard_season.score + excluded.score, updated_at = now();
  perform guild_windows_add(new.user_id, new.points);
  return new;
end $$;

create or replace function public.scores_windows_delta()
returns trigger language plpgsql security definer set search_path = public as $$
declare d integer := new.points - old.points;
begin
  if d = 0 then return new; end if;
  update leaderboard_daily   set score = greatest(0, score + d), updated_at = now() where user_id = new.user_id;
  update leaderboard_weekly  set score = greatest(0, score + d), updated_at = now() where user_id = new.user_id;
  update leaderboard_alltime set score = greatest(0, score + d), updated_at = now() where user_id = new.user_id;
  insert into leaderboard_season (season, user_id, score) values (current_season_key(), new.user_id, greatest(0, d))
    on conflict (season, user_id) do update set score = greatest(0, leaderboard_season.score + d), updated_at = now();
  perform guild_windows_add(new.user_id, d);
  return new;
end $$;

create or replace function public.guild_windows_add(p_user uuid, p_delta integer)
returns void language plpgsql security definer set search_path = public as $$
declare g uuid;
begin
  if p_delta = 0 then return; end if;
  select guild_id into g from guild_members where user_id = p_user;
  if g is null then return; end if;
  insert into guild_daily (guild_id, score) values (g, greatest(0, p_delta))
    on conflict (guild_id) do update set score = greatest(0, guild_daily.score + p_delta), updated_at = now();
  insert into guild_weekly (guild_id, score) values (g, greatest(0, p_delta))
    on conflict (guild_id) do update set score = greatest(0, guild_weekly.score + p_delta), updated_at = now();
  insert into guild_alltime (guild_id, score) values (g, greatest(0, p_delta))
    on conflict (guild_id) do update set score = greatest(0, guild_alltime.score + p_delta), updated_at = now();
  insert into guild_season (season, guild_id, score) values (current_season_key(), g, greatest(0, p_delta))
    on conflict (season, guild_id) do update set score = greatest(0, guild_season.score + p_delta), updated_at = now();
  if p_delta > 0 then perform guild_goal_bump(g, 'points', p_delta); end if;
end $$;

-- The boards learn the fourth window.
create or replace function public.leaderboard_page(p_window text, p_page integer default 0)
returns table (rank bigint, user_id uuid, username text, score bigint)
language plpgsql stable security definer set search_path = public as $$
declare sk text := current_season_key();
begin
  if p_window = 'daily' then
    return query select row_number() over (order by d.score desc, d.updated_at asc) as rank, d.user_id, p.username, d.score
      from leaderboard_daily d join profiles p on p.id = d.user_id
      order by d.score desc, d.updated_at asc limit 20 offset greatest(0, p_page) * 20;
  elsif p_window = 'weekly' then
    return query select row_number() over (order by w.score desc, w.updated_at asc), w.user_id, p.username, w.score
      from leaderboard_weekly w join profiles p on p.id = w.user_id
      order by w.score desc, w.updated_at asc limit 20 offset greatest(0, p_page) * 20;
  elsif p_window = 'season' then
    return query select row_number() over (order by s.score desc, s.updated_at asc), s.user_id, p.username, s.score
      from leaderboard_season s join profiles p on p.id = s.user_id where s.season = sk
      order by s.score desc, s.updated_at asc limit 20 offset greatest(0, p_page) * 20;
  else
    return query select row_number() over (order by a.score desc, a.updated_at asc), a.user_id, p.username, a.score
      from leaderboard_alltime a join profiles p on p.id = a.user_id
      order by a.score desc, a.updated_at asc limit 20 offset greatest(0, p_page) * 20;
  end if;
end $$;

create or replace function public.my_rank(p_window text)
returns table (rank bigint, score bigint, total bigint)
language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid(); my_score bigint; my_at timestamptz; sk text := current_season_key();
begin
  if me is null then return; end if;
  if p_window = 'daily' then
    select d.score, d.updated_at into my_score, my_at from leaderboard_daily d where d.user_id = me;
    if my_score is null then return; end if;
    return query select (select count(*) + 1 from leaderboard_daily x where x.score > my_score or (x.score = my_score and x.updated_at < my_at)), my_score, (select count(*) from leaderboard_daily);
  elsif p_window = 'weekly' then
    select w.score, w.updated_at into my_score, my_at from leaderboard_weekly w where w.user_id = me;
    if my_score is null then return; end if;
    return query select (select count(*) + 1 from leaderboard_weekly x where x.score > my_score or (x.score = my_score and x.updated_at < my_at)), my_score, (select count(*) from leaderboard_weekly);
  elsif p_window = 'season' then
    select s.score, s.updated_at into my_score, my_at from leaderboard_season s where s.user_id = me and s.season = sk;
    if my_score is null then return; end if;
    return query select (select count(*) + 1 from leaderboard_season x where x.season = sk and (x.score > my_score or (x.score = my_score and x.updated_at < my_at))), my_score, (select count(*) from leaderboard_season x where x.season = sk);
  else
    select a.score, a.updated_at into my_score, my_at from leaderboard_alltime a where a.user_id = me;
    if my_score is null then return; end if;
    return query select (select count(*) + 1 from leaderboard_alltime x where x.score > my_score or (x.score = my_score and x.updated_at < my_at)), my_score, (select count(*) from leaderboard_alltime);
  end if;
end $$;

create or replace function public.guild_board(p_window text, p_page integer default 0)
returns table (rank bigint, guild_id uuid, name text, tag text, members integer, score bigint)
language plpgsql stable security definer set search_path = public as $$
declare sk text := current_season_key();
begin
  if p_window = 'daily' then
    return query select row_number() over (order by d.score desc, d.updated_at asc), g.id, g.name, g.tag, g.members, d.score
      from guild_daily d join guilds g on g.id = d.guild_id order by d.score desc, d.updated_at asc limit 20 offset greatest(0, p_page) * 20;
  elsif p_window = 'weekly' then
    return query select row_number() over (order by w.score desc, w.updated_at asc), g.id, g.name, g.tag, g.members, w.score
      from guild_weekly w join guilds g on g.id = w.guild_id order by w.score desc, w.updated_at asc limit 20 offset greatest(0, p_page) * 20;
  elsif p_window = 'season' then
    return query select row_number() over (order by s.score desc, s.updated_at asc), g.id, g.name, g.tag, g.members, s.score
      from guild_season s join guilds g on g.id = s.guild_id where s.season = sk order by s.score desc, s.updated_at asc limit 20 offset greatest(0, p_page) * 20;
  else
    return query select row_number() over (order by a.score desc, a.updated_at asc), g.id, g.name, g.tag, g.members, a.score
      from guild_alltime a join guilds g on g.id = a.guild_id order by a.score desc, a.updated_at asc limit 20 offset greatest(0, p_page) * 20;
  end if;
end $$;

create or replace function public.my_guild_rank(p_window text)
returns table (rank bigint, score bigint, total bigint)
language plpgsql stable security definer set search_path = public as $$
declare g uuid; my_score bigint; my_at timestamptz; sk text := current_season_key();
begin
  select guild_id into g from guild_members where user_id = auth.uid();
  if g is null then return; end if;
  if p_window = 'daily' then
    select d.score, d.updated_at into my_score, my_at from guild_daily d where d.guild_id = g;
    if my_score is null then return query select null::bigint, 0::bigint, (select count(*) from guild_daily); return; end if;
    return query select (select count(*) + 1 from guild_daily x where x.score > my_score or (x.score = my_score and x.updated_at < my_at)), my_score, (select count(*) from guild_daily);
  elsif p_window = 'weekly' then
    select w.score, w.updated_at into my_score, my_at from guild_weekly w where w.guild_id = g;
    if my_score is null then return query select null::bigint, 0::bigint, (select count(*) from guild_weekly); return; end if;
    return query select (select count(*) + 1 from guild_weekly x where x.score > my_score or (x.score = my_score and x.updated_at < my_at)), my_score, (select count(*) from guild_weekly);
  elsif p_window = 'season' then
    select s.score, s.updated_at into my_score, my_at from guild_season s where s.guild_id = g and s.season = sk;
    if my_score is null then return query select null::bigint, 0::bigint, (select count(*) from guild_season x where x.season = sk); return; end if;
    return query select (select count(*) + 1 from guild_season x where x.season = sk and (x.score > my_score or (x.score = my_score and x.updated_at < my_at))), my_score, (select count(*) from guild_season x where x.season = sk);
  else
    select a.score, a.updated_at into my_score, my_at from guild_alltime a where a.guild_id = g;
    if my_score is null then return query select null::bigint, 0::bigint, (select count(*) from guild_alltime); return; end if;
    return query select (select count(*) + 1 from guild_alltime x where x.score > my_score or (x.score = my_score and x.updated_at < my_at)), my_score, (select count(*) from guild_alltime);
  end if;
end $$;

grant execute on function public.current_season_key() to authenticated;

do $$ begin
  alter publication supabase_realtime add table public.leaderboard_season;
exception when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.guild_season;
exception when others then null; end $$;

-- ============================================================================
-- V12 - THE BADGE SHELF
-- ----------------------------------------------------------------------------
-- The badges a player has earned, with the rank each is held at, published
-- with the rest of the public stats so a friend's page can show the shelf
-- without reading their save: [{ "id": "ripper", "rank": 2 }, ...].
-- ============================================================================
alter table public.profiles add column if not exists badges jsonb not null default '[]'::jsonb;
