-- Notify PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';

-- Also add a dummy column and drop it to force a structure change event if NOTIFY is ignored
ALTER TABLE content_calendar ADD COLUMN IF NOT EXISTS _force_refresh text;
ALTER TABLE content_calendar DROP COLUMN IF EXISTS _force_refresh;
