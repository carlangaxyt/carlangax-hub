-- Carlangax Hub — initial schema
-- Run this in the Supabase SQL editor (or via `supabase db push`) after creating your project.

-- ── Trades ──────────────────────────────────────────────
create table if not exists trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  direction text not null check (direction in ('long', 'short')),
  session text,                -- 'london', 'ny', 'asia', etc.
  setup text,                  -- playbook setup name
  entry numeric,
  exit numeric,
  size numeric,
  r_multiple numeric,
  pnl numeric,
  notes text,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ── Videos ──────────────────────────────────────────────
create table if not exists videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  category text not null default 'other', -- 'trade-review', 'psychology', 'market-analysis', 'other'
  tags text[] not null default '{}',
  storage_path text not null,   -- path inside the 'videos' storage bucket
  thumbnail_path text,
  related_trade_id uuid references trades(id) on delete set null,
  duration_seconds integer,
  created_at timestamptz not null default now()
);

-- ── Reminders ───────────────────────────────────────────
create table if not exists reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  due_at timestamptz,
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  done boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── Row Level Security ──────────────────────────────────
alter table trades enable row level security;
alter table videos enable row level security;
alter table reminders enable row level security;

create policy "own trades" on trades for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own videos" on videos for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own reminders" on reminders for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Storage bucket for uploaded videos ──────────────────
insert into storage.buckets (id, name, public)
values ('videos', 'videos', false)
on conflict (id) do nothing;

create policy "own video files read" on storage.objects for select
  using (bucket_id = 'videos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "own video files insert" on storage.objects for insert
  with check (bucket_id = 'videos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "own video files delete" on storage.objects for delete
  using (bucket_id = 'videos' and auth.uid()::text = (storage.foldername(name))[1]);
