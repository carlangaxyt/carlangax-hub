-- Carlangax Hub — trading plan + batch AI insight history
-- Applied directly via Supabase MCP on 2026-08-22; kept here for the record.

create table if not exists trading_plan (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  content text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists trade_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  summary text not null,
  trade_count integer not null,
  created_at timestamptz not null default now()
);

alter table trading_plan enable row level security;
alter table trade_insights enable row level security;

create policy "own trading plan" on trading_plan for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own trade insights" on trade_insights for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
