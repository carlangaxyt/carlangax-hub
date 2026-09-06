-- Vault-backed accessor for the Buffer API token used by the buffer-poll edge function.
-- The token itself is stored separately via vault.create_secret(), never in migrations.
create or replace function public.get_buffer_access_token()
returns text
language sql
security definer
set search_path = vault, public
as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'buffer_access_token' limit 1;
$$;

revoke all on function public.get_buffer_access_token() from public;
revoke all on function public.get_buffer_access_token() from anon;
revoke all on function public.get_buffer_access_token() from authenticated;
grant execute on function public.get_buffer_access_token() to service_role;

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Polls Buffer every 5 minutes for newly sent/errored posts and inserts a
-- notification row per post. See supabase/functions/buffer-poll.
--
-- The Authorization header below carries the project's public anon key
-- (safe to commit — it's the same key already embedded in the client-side
-- bundle via NEXT_PUBLIC_SUPABASE_ANON_KEY). It only satisfies the Function
-- Gateway's JWT check; the function itself uses the service-role key
-- (auto-injected by the platform) to bypass RLS when writing notifications.
select cron.schedule(
  'buffer-poll-job',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://mvinhnsjwmbduwphlvvy.supabase.co/functions/v1/buffer-poll',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12aW5obnNqd21iZHV3cGhsdnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyNjAxODcsImV4cCI6MjEwMjgzNjE4N30.ln2-FfDZc4Lz-V59I0qPvD414Z9LbCJLDgiXd_YUYIw'
    ),
    body := '{}'::jsonb
  );
  $$
);
