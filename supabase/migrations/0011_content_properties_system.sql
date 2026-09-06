-- Dynamic, Notion-style properties for content_ideas
create table if not exists content_properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('text','url','date','select','multi_select')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table content_properties enable row level security;

create policy "content_properties_select" on content_properties
  for select using (auth.uid() = user_id);
create policy "content_properties_insert" on content_properties
  for insert with check (auth.uid() = user_id);
create policy "content_properties_update" on content_properties
  for update using (auth.uid() = user_id);
create policy "content_properties_delete" on content_properties
  for delete using (auth.uid() = user_id);

alter table content_ideas add column if not exists properties jsonb not null default '{}'::jsonb;

-- Seed the 7 existing fixed fields as properties per user, then backfill values into jsonb
do $$
declare
  u record;
  p_platform uuid;
  p_series uuid;
  p_type uuid;
  p_location uuid;
  p_sched uuid;
  p_pub uuid;
  p_link uuid;
begin
  for u in select distinct user_id from content_ideas loop
    insert into content_properties (user_id, name, type, sort_order)
      values (u.user_id, 'Plataforma', 'multi_select', 0) returning id into p_platform;
    insert into content_properties (user_id, name, type, sort_order)
      values (u.user_id, 'Serie', 'select', 1) returning id into p_series;
    insert into content_properties (user_id, name, type, sort_order)
      values (u.user_id, 'Tipo', 'select', 2) returning id into p_type;
    insert into content_properties (user_id, name, type, sort_order)
      values (u.user_id, 'Dónde graba', 'text', 3) returning id into p_location;
    insert into content_properties (user_id, name, type, sort_order)
      values (u.user_id, 'Fecha objetivo', 'date', 4) returning id into p_sched;
    insert into content_properties (user_id, name, type, sort_order)
      values (u.user_id, 'Publicado el', 'date', 5) returning id into p_pub;
    insert into content_properties (user_id, name, type, sort_order)
      values (u.user_id, 'Link', 'url', 6) returning id into p_link;

    update content_ideas set properties =
      (case when platform is not null and platform <> '' then
        jsonb_build_object(p_platform::text, (
          select jsonb_agg(trim(x)) from unnest(string_to_array(platform, ',')) as x
        ))
      else '{}'::jsonb end)
      || (case when series is not null and series <> '' then jsonb_build_object(p_series::text, series) else '{}'::jsonb end)
      || (case when content_type is not null and content_type <> '' then jsonb_build_object(p_type::text, content_type) else '{}'::jsonb end)
      || (case when record_location is not null and record_location <> '' then jsonb_build_object(p_location::text, record_location) else '{}'::jsonb end)
      || (case when scheduled_date is not null then jsonb_build_object(p_sched::text, to_char(scheduled_date, 'YYYY-MM-DD')) else '{}'::jsonb end)
      || (case when published_date is not null then jsonb_build_object(p_pub::text, to_char(published_date, 'YYYY-MM-DD')) else '{}'::jsonb end)
      || (case when published_link is not null and published_link <> '' then jsonb_build_object(p_link::text, published_link) else '{}'::jsonb end)
    where user_id = u.user_id;
  end loop;
end $$;
