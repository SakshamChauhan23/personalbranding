-- Add missing fields to clients table
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS role TEXT,
ADD COLUMN IF NOT EXISTS target_audience TEXT;

-- Update existing clients to extract name from LinkedIn URL
-- This will set name to the last part of the URL (e.g., "saksham-chauhan")
UPDATE clients
SET name = COALESCE(
    NULLIF(SPLIT_PART(linkedin_url, '/', array_length(string_to_array(linkedin_url, '/'), 1)), ''),
    'Unnamed Client'
)
WHERE name IS NULL OR name = '';

-- Add delete policy if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'clients'
        AND policyname = 'Users can delete own client profile'
    ) THEN
        CREATE POLICY "Users can delete own client profile" ON clients
        FOR DELETE USING (auth.uid() = user_id);
    END IF;
END$$;
