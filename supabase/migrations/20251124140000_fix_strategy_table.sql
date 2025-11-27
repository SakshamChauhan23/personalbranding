-- Create client_profile_audits table if it doesn't exist
CREATE TABLE IF NOT EXISTS client_profile_audits (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    positioning_statement text,
    content_pillars text[], -- Array of strings
    tone_voice text,
    audience_insights text,
    strengths_weaknesses text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Add updated_at column if it doesn't exist (for existing tables)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'client_profile_audits' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE client_profile_audits ADD COLUMN updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());
    END IF;
END $$;

-- Enable RLS
ALTER TABLE client_profile_audits ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view own client audits" ON client_profile_audits;
CREATE POLICY "Users can view own client audits" ON client_profile_audits
    FOR SELECT USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = client_id AND clients.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert own client audits" ON client_profile_audits;
CREATE POLICY "Users can insert own client audits" ON client_profile_audits
    FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM clients WHERE clients.id = client_id AND clients.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update own client audits" ON client_profile_audits;
CREATE POLICY "Users can update own client audits" ON client_profile_audits
    FOR UPDATE USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = client_id AND clients.user_id = auth.uid()));
