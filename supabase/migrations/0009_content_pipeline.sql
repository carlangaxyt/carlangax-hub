-- Carlangax Hub — content pipeline (Kanban board + calendar + blueprint)
-- Applied directly via Supabase MCP on 2026-08-24; kept here for the record.

create table if not exists content_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  stage text not null default 'idea' check (stage in ('idea', 'guion', 'grabar', 'editar', 'listo')),
  platform text,
  notes text,
  scheduled_date date,
  published_link text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists content_blueprint (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  content text not null default '',
  updated_at timestamptz not null default now()
);

alter table content_ideas enable row level security;
alter table content_blueprint enable row level security;

create policy "own content ideas" on content_ideas for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own content blueprint" on content_blueprint for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
