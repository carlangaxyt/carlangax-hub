-- Carlangax Hub — broker connections (read-only portfolio sync)
-- Run this in the Supabase SQL editor after 0001_init.sql.

create table if not exists broker_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  account_id text,
  created_at timestamptz not null default now(),
  unique (user_id, provider)
);

alter table broker_connections enable row level security;

create policy "own broker connections" on broker_connections for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
