-- Carlangax Hub — manual ordering for payouts
-- Run this in the Supabase SQL editor after 0004_certificates_order.sql.

alter table payouts
  add column if not exists sort_order integer not null default 0;

with ordered as (
  select id, row_number() over (partition by user_id order by created_at asc) as rn
  from payouts
)
update payouts p
set sort_order = ordered.rn
from ordered
where p.id = ordered.id;
