-- Migration: Add new onboarding fields to clients table
-- Run this to update your existing database

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS industry text,
ADD COLUMN IF NOT EXISTS role text,
ADD COLUMN IF NOT EXISTS target_audience text;

-- Update RLS policies (they automatically apply to new columns)
-- No changes needed as existing policies work with new columns
