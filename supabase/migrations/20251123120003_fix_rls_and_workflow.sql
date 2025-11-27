-- Fix RLS for content_calendar
ALTER TABLE content_calendar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own calendar items" ON content_calendar;
CREATE POLICY "Users can insert own calendar items" ON content_calendar
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = content_calendar.client_id 
      AND clients.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own calendar items" ON content_calendar;
CREATE POLICY "Users can update own calendar items" ON content_calendar
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = content_calendar.client_id 
      AND clients.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own calendar items" ON content_calendar;
CREATE POLICY "Users can delete own calendar items" ON content_calendar
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = content_calendar.client_id 
      AND clients.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can select own calendar items" ON content_calendar;
CREATE POLICY "Users can select own calendar items" ON content_calendar
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = content_calendar.client_id 
      AND clients.user_id = auth.uid()
    )
  );

-- Add workflow_stage column
ALTER TABLE content_calendar
ADD COLUMN IF NOT EXISTS workflow_stage text CHECK (workflow_stage IN ('brief', 'content')) DEFAULT 'brief';
