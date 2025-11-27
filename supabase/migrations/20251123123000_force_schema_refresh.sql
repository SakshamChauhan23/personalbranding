-- Force schema cache refresh by touching the table
COMMENT ON COLUMN content_calendar.scheduled_time IS 'Time of scheduled post';

-- Ensure column exists (redundant but safe)
ALTER TABLE content_calendar ADD COLUMN IF NOT EXISTS scheduled_time time;
