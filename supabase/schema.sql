-- Reset: Drop existing tables to start fresh (WARNING: Deletes all data)
drop table if exists schedules cascade;
drop table if exists content_scripts cascade;
drop table if exists content_calendar cascade;
drop table if exists client_profile_audits cascade;
drop table if exists clients cascade;

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Clients Table
create table clients (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text,
  linkedin_url text,
  bio text,
  goals text,
  tone_preferences text,
  industry text,
  role text,
  target_audience text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Client Profile Audits Table
create table client_profile_audits (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete cascade not null,
  positioning_statement text,
  content_pillars jsonb,
  tone_voice text,
  strengths_weaknesses text,
  audience_insights text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Content Calendar Table
create table content_calendar (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete cascade not null,
  title text not null,
  brief text,
  format text check (format in ('text', 'story', 'carousel')),
  pillar text,
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  audience_target text,
  psychological_trigger text,
  why_it_works text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Content Scripts Table
create table content_scripts (
  id uuid primary key default uuid_generate_v4(),
  calendar_id uuid references content_calendar(id) on delete cascade not null,
  content_text text,
  hook_variations jsonb,
  cta text,
  hashtags text[],
  version int default 1,
  status text check (status in ('draft', 'approved')) default 'draft',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Schedules Table
create table schedules (
  id uuid primary key default uuid_generate_v4(),
  script_id uuid references content_scripts(id) on delete cascade not null,
  scheduled_time timestamp with time zone not null,
  method text check (method in ('manual', 'auto')),
  is_posted boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table clients enable row level security;

create policy "Users can view own client profile" on clients
  for select using (auth.uid() = user_id);

create policy "Users can insert own client profile" on clients
  for insert with check (auth.uid() = user_id);

create policy "Users can update own client profile" on clients
  for update using (auth.uid() = user_id);

create policy "Users can delete own client profile" on clients
  for delete using (auth.uid() = user_id);

-- Audits
alter table client_profile_audits enable row level security;

create policy "Users can view own audits" on client_profile_audits
  for select using (exists (select 1 from clients where clients.id = client_profile_audits.client_id and clients.user_id = auth.uid()));

create policy "Users can insert own audits" on client_profile_audits
  for insert with check (exists (select 1 from clients where clients.id = client_id and clients.user_id = auth.uid()));

-- Calendar
alter table content_calendar enable row level security;

create policy "Users can view own calendar" on content_calendar
  for select using (exists (select 1 from clients where clients.id = content_calendar.client_id and clients.user_id = auth.uid()));

create policy "Users can insert own calendar" on content_calendar
  for insert with check (exists (select 1 from clients where clients.id = client_id and clients.user_id = auth.uid()));

create policy "Users can update own calendar" on content_calendar
  for update using (exists (select 1 from clients where clients.id = client_id and clients.user_id = auth.uid()));

-- Scripts
alter table content_scripts enable row level security;

create policy "Users can view own scripts" on content_scripts
  for select using (exists (select 1 from content_calendar join clients on content_calendar.client_id = clients.id where content_calendar.id = content_scripts.calendar_id and clients.user_id = auth.uid()));

create policy "Users can insert own scripts" on content_scripts
  for insert with check (exists (select 1 from content_calendar join clients on content_calendar.client_id = clients.id where content_calendar.id = calendar_id and clients.user_id = auth.uid()));

create policy "Users can update own scripts" on content_scripts
  for update using (exists (select 1 from content_calendar join clients on content_calendar.client_id = clients.id where content_calendar.id = calendar_id and clients.user_id = auth.uid()));
