-- Carlangax Hub — TradeZella real data sync
-- Run this after 0011_content_properties_system.sql.

alter table trades
  add column if not exists external_id text,
  add column if not exists source text not null default 'manual',
  add column if not exists account text,
  add column if not exists account_type text check (account_type in ('live', 'backtest')),
  add column if not exists result text check (result in ('win', 'loss', 'breakeven')),
  add column if not exists net_roi numeric,
  add column if not exists tags text[] not null default '{}';

create unique index if not exists trades_user_external_id_key
  on trades (user_id, external_id)
  where external_id is not null;

create table if not exists daily_journal (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  journal_date date not null,
  content text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, journal_date)
);

alter table daily_journal enable row level security;

create policy "own daily journal" on daily_journal for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
