-- Add scheduled_date column to content_calendar table
ALTER TABLE content_calendar 
ADD COLUMN IF NOT EXISTS scheduled_date DATE;

-- Optional: Add index for faster querying by date
CREATE INDEX IF NOT EXISTS idx_content_calendar_scheduled_date ON content_calendar(scheduled_date);
