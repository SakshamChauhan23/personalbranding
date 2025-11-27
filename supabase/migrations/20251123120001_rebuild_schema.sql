-- Update clients table
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS approval_email text,
ADD COLUMN IF NOT EXISTS brand_colors jsonb,
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS onboarding_data jsonb;

-- Update content_calendar table
ALTER TABLE content_calendar
ADD COLUMN IF NOT EXISTS media_url text,
ADD COLUMN IF NOT EXISTS media_type text CHECK (media_type IN ('image', 'video', 'carousel', 'pdf')),
ADD COLUMN IF NOT EXISTS caption text,
ADD COLUMN IF NOT EXISTS feedback_status text CHECK (feedback_status IN ('draft', 'sent', 'approved', 'changes_requested')) DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS feedback_notes text;

-- Create feedback_entries table
CREATE TABLE IF NOT EXISTS feedback_entries (
  id uuid primary key default uuid_generate_v4(),
  calendar_id uuid references content_calendar(id) on delete cascade not null,
  client_id uuid references clients(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  client_id uuid references clients(id) on delete cascade,
  type text check (type in ('feedback', 'approval', 'deadline', 'system')),
  message text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create media_uploads table (simple metadata tracking)
CREATE TABLE IF NOT EXISTS media_uploads (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete cascade not null,
  file_path text not null,
  file_type text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies for new tables
ALTER TABLE feedback_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_uploads ENABLE ROW LEVEL SECURITY;

-- Policies for feedback_entries
DROP POLICY IF EXISTS "Users can view own client feedback" ON feedback_entries;
CREATE POLICY "Users can view own client feedback" ON feedback_entries
  FOR SELECT USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = client_id AND clients.user_id = auth.uid()));

-- Policies for notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Policies for media_uploads
DROP POLICY IF EXISTS "Users can view own media" ON media_uploads;
CREATE POLICY "Users can view own media" ON media_uploads
  FOR SELECT USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = client_id AND clients.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert own media" ON media_uploads;
CREATE POLICY "Users can insert own media" ON media_uploads
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM clients WHERE clients.id = client_id AND clients.user_id = auth.uid()));
