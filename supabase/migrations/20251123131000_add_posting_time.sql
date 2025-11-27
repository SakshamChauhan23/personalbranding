-- Rename/Add column to bypass schema cache issues
ALTER TABLE content_calendar ADD COLUMN IF NOT EXISTS posting_time time DEFAULT '09:00:00';

-- We can leave scheduled_time for now to avoid errors if it exists, or drop it later.
-- The app will now use posting_time.
