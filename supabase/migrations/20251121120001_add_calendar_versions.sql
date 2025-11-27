-- Content Calendar Versions Table
create table if not exists content_calendar_versions (
  id uuid primary key default uuid_generate_v4(),
  calendar_id uuid references content_calendar(id) on delete cascade not null,
  title text not null,
  brief text,
  format text,
  pillar text,
  audience_target text,
  psychological_trigger text,
  why_it_works text,
  feedback_used text, -- The feedback that triggered this version
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table content_calendar_versions enable row level security;

drop policy if exists "Users can view own calendar versions" on content_calendar_versions;
create policy "Users can view own calendar versions" on content_calendar_versions
  for select using (exists (select 1 from content_calendar join clients on content_calendar.client_id = clients.id where content_calendar.id = calendar_id and clients.user_id = auth.uid()));

drop policy if exists "Users can insert own calendar versions" on content_calendar_versions;
create policy "Users can insert own calendar versions" on content_calendar_versions
  for insert with check (exists (select 1 from content_calendar join clients on content_calendar.client_id = clients.id where content_calendar.id = calendar_id and clients.user_id = auth.uid()));
