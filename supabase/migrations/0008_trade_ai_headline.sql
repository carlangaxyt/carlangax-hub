-- Carlangax Hub — headline for AI trade insight (Zella Insights-style modal)
-- Applied directly via Supabase MCP on 2026-08-24; kept here for the record.

alter table trades add column if not exists ai_headline text;
