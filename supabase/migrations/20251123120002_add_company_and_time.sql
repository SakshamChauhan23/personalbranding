-- Add company_name to clients
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS company_name text;

-- Add scheduled_time to content_calendar
-- We keep scheduled_date for the grid view, but add time for precision
ALTER TABLE content_calendar
ADD COLUMN IF NOT EXISTS scheduled_time time;

-- Update RLS if needed (existing policies should cover new columns)
