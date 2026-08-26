-- Carlangax Hub — prop firm payouts & challenge certificates
-- Run this in the Supabase SQL editor after 0001_init.sql and 0002_broker_connections.sql.

create table if not exists payouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  prop_firm text not null,
  amount numeric not null,
  currency text not null default 'USD',
  payout_date date not null default current_date,
  status text not null default 'paid' check (status in ('pending', 'paid')),
  proof_path text,          -- path inside the 'certificates' storage bucket
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists challenge_certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  prop_firm text not null,
  challenge_name text not null,   -- e.g. "Phase 1", "Phase 2", "Funded"
  passed_date date not null default current_date,
  certificate_path text not null, -- path inside the 'certificates' storage bucket
  notes text,
  created_at timestamptz not null default now()
);

alter table payouts enable row level security;
alter table challenge_certificates enable row level security;

create policy "own payouts" on payouts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own challenge certificates" on challenge_certificates for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Storage bucket for payout proofs & challenge certificates ──
insert into storage.buckets (id, name, public)
values ('certificates', 'certificates', false)
on conflict (id) do nothing;

create policy "own certificate files read" on storage.objects for select
  using (bucket_id = 'certificates' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "own certificate files insert" on storage.objects for insert
  with check (bucket_id = 'certificates' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "own certificate files delete" on storage.objects for delete
  using (bucket_id = 'certificates' and auth.uid()::text = (storage.foldername(name))[1]);
