-- Content Script Versions Table
create table if not exists content_script_versions (
  id uuid primary key default uuid_generate_v4(),
  script_id uuid references content_scripts(id) on delete cascade not null,
  content_text text,
  hook_variations jsonb,
  cta text,
  hashtags text[],
  draft_data jsonb,
  feedback_used text,
  version int,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table content_script_versions enable row level security;

drop policy if exists "Users can view own script versions" on content_script_versions;
create policy "Users can view own script versions" on content_script_versions
  for select using (exists (select 1 from content_scripts join content_calendar on content_scripts.calendar_id = content_calendar.id join clients on content_calendar.client_id = clients.id where content_scripts.id = script_id and clients.user_id = auth.uid()));

drop policy if exists "Users can insert own script versions" on content_script_versions;
create policy "Users can insert own script versions" on content_script_versions
  for insert with check (exists (select 1 from content_scripts join content_calendar on content_scripts.calendar_id = content_calendar.id join clients on content_calendar.client_id = clients.id where content_scripts.id = script_id and clients.user_id = auth.uid()));
