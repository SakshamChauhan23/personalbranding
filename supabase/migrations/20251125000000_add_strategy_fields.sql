-- Add new fields to client_profile_audits table
ALTER TABLE client_profile_audits 
ADD COLUMN IF NOT EXISTS primary_goals text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS relevant_content text;

-- Add new fields to clients table
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS company_linkedin_url text;
