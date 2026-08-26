-- Carlangax Hub — manual ordering for challenge certificates
-- Run this in the Supabase SQL editor after 0003_payouts.sql.

alter table challenge_certificates
  add column if not exists sort_order integer not null default 0;

with ordered as (
  select id, row_number() over (partition by user_id order by created_at asc) as rn
  from challenge_certificates
)
update challenge_certificates c
set sort_order = ordered.rn
from ordered
where c.id = ordered.id;
