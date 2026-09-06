alter table content_ideas
  add column if not exists series text,
  add column if not exists content_type text,
  add column if not exists record_location text,
  add column if not exists published_date date;
