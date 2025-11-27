-- Hard reset of the column to force schema cache update
ALTER TABLE content_calendar DROP COLUMN IF EXISTS scheduled_time;

-- Re-add with a default value to ensure data consistency
ALTER TABLE content_calendar ADD COLUMN scheduled_time time DEFAULT '09:00:00';

-- Explicitly notify PostgREST
NOTIFY pgrst, 'reload schema';
