-- Add calendar_id to notifications table
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS calendar_id uuid REFERENCES content_calendar(id) ON DELETE CASCADE;
