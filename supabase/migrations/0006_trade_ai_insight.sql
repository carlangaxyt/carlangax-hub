-- Carlangax Hub — AI score & summary for closed trades
-- Run this in the Supabase SQL editor after 0005_payouts_order.sql.

alter table trades
  add column if not exists ai_score integer,
  add column if not exists ai_summary text;
