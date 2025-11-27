-- 1. Drop existing policies to avoid "policy already exists" errors
drop policy if exists "Users can view own client profile" on clients;
drop policy if exists "Users can insert own client profile" on clients;
drop policy if exists "Users can update own client profile" on clients;

drop policy if exists "Users can view own audits" on client_profile_audits;
drop policy if exists "Users can insert own audits" on client_profile_audits;

drop policy if exists "Users can view own calendar" on content_calendar;
drop policy if exists "Users can insert own calendar" on content_calendar;
drop policy if exists "Users can update own calendar" on content_calendar;

drop policy if exists "Users can view own scripts" on content_scripts;
drop policy if exists "Users can insert own scripts" on content_scripts;
drop policy if exists "Users can update own scripts" on content_scripts;

-- 2. Re-create Policies with proper permissions

-- Clients
create policy "Users can view own client profile" on clients
  for select using (auth.uid() = user_id);

create policy "Users can insert own client profile" on clients
  for insert with check (auth.uid() = user_id);

create policy "Users can update own client profile" on clients
  for update using (auth.uid() = user_id);

-- Audits
create policy "Users can view own audits" on client_profile_audits
  for select using (exists (select 1 from clients where clients.id = client_profile_audits.client_id and clients.user_id = auth.uid()));

create policy "Users can insert own audits" on client_profile_audits
  for insert with check (exists (select 1 from clients where clients.id = client_id and clients.user_id = auth.uid()));

-- Calendar
create policy "Users can view own calendar" on content_calendar
  for select using (exists (select 1 from clients where clients.id = content_calendar.client_id and clients.user_id = auth.uid()));

create policy "Users can insert own calendar" on content_calendar
  for insert with check (exists (select 1 from clients where clients.id = client_id and clients.user_id = auth.uid()));

create policy "Users can update own calendar" on content_calendar
  for update using (exists (select 1 from clients where clients.id = client_id and clients.user_id = auth.uid()));

-- Scripts
create policy "Users can view own scripts" on content_scripts
  for select using (exists (select 1 from content_calendar join clients on content_calendar.client_id = clients.id where content_calendar.id = content_scripts.calendar_id and clients.user_id = auth.uid()));

create policy "Users can insert own scripts" on content_scripts
  for insert with check (exists (select 1 from content_calendar join clients on content_calendar.client_id = clients.id where content_calendar.id = calendar_id and clients.user_id = auth.uid()));

create policy "Users can update own scripts" on content_scripts
  for update using (exists (select 1 from content_calendar join clients on content_calendar.client_id = clients.id where content_calendar.id = calendar_id and clients.user_id = auth.uid()));
