-- Carlangax Hub — real backtesting sessions synced from TradeZella

create table if not exists backtesting_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  external_id text not null,
  name text not null,
  symbol text not null,
  description text,
  start_date date,
  end_date date,
  start_balance numeric,
  current_balance numeric,
  net_profit numeric,
  trade_count integer not null default 0,
  completion numeric,
  playbooks text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, external_id)
);

alter table backtesting_sessions enable row level security;

create policy "own backtesting sessions" on backtesting_sessions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
