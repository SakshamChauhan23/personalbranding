-- Add draft_data to content_scripts to store AI variations (tones, slides, etc.)
alter table content_scripts 
add column if not exists draft_data jsonb;
