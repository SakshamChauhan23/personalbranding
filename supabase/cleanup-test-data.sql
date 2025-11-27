-- =============================================================================
-- CLEANUP TEST DATA - Use these queries to delete test data during development
-- Run these in Supabase SQL Editor before regenerating content
-- =============================================================================

-- 1️⃣ VIEW ALL CLIENTS
-- Use this to find client IDs you want to delete
SELECT
    id,
    linkedin_url,
    industry,
    role,
    created_at,
    (SELECT COUNT(*) FROM client_profile_audits WHERE client_id = clients.id) as audit_count,
    (SELECT COUNT(*) FROM content_calendar WHERE client_id = clients.id) as calendar_count
FROM clients
ORDER BY created_at DESC;


-- 2️⃣ DELETE CALENDAR FOR A SPECIFIC CLIENT
-- Replace 'your-client-id' with actual client ID
-- This allows regenerating calendar without using AI quota for audit
DELETE FROM content_calendar
WHERE client_id = 'your-client-id';


-- 3️⃣ DELETE AUDIT FOR A SPECIFIC CLIENT
-- Replace 'your-client-id' with actual client ID
-- WARNING: This will also delete calendar (cascade)
DELETE FROM client_profile_audits
WHERE client_id = 'your-client-id';


-- 4️⃣ DELETE ENTIRE CLIENT (and all related data)
-- Replace 'your-client-id' with actual client ID
-- Cascades to audit and calendar
DELETE FROM clients
WHERE id = 'your-client-id';


-- 5️⃣ DELETE ALL TEST CLIENTS (DANGER!)
-- Only use this if you want to completely reset
-- UNCOMMENT BELOW TO USE:

-- DELETE FROM content_calendar;
-- DELETE FROM client_profile_audits;
-- DELETE FROM clients;


-- 6️⃣ DELETE CLIENTS BY EMAIL (Useful for cleanup)
-- Replace 'your-email@example.com' with your test email
DELETE FROM clients
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'your-email@example.com'
);


-- 7️⃣ FIND DUPLICATE CLIENTS
-- Helps identify clients you can safely delete
SELECT
    linkedin_url,
    COUNT(*) as duplicate_count,
    ARRAY_AGG(id) as client_ids
FROM clients
GROUP BY linkedin_url
HAVING COUNT(*) > 1;


-- 8️⃣ DELETE OLDER DUPLICATE CLIENTS (Keep newest)
-- Automatically removes duplicates, keeping only the latest version
DELETE FROM clients
WHERE id NOT IN (
    SELECT MAX(id)
    FROM clients
    GROUP BY linkedin_url, user_id
);


-- =============================================================================
-- QUOTA MONITORING QUERIES
-- =============================================================================

-- 9️⃣ COUNT TOTAL AI GENERATIONS TODAY
-- Helps track how many API calls you've made
SELECT
    'Audits Generated Today' as metric,
    COUNT(*) as count
FROM client_profile_audits
WHERE created_at >= CURRENT_DATE

UNION ALL

SELECT
    'Calendars Generated Today' as metric,
    COUNT(*) as count
FROM content_calendar
WHERE created_at >= CURRENT_DATE;


-- 🔟 FIND CLIENTS WITHOUT CALENDAR (Need Generation)
SELECT
    c.id,
    c.linkedin_url,
    c.industry,
    c.created_at
FROM clients c
LEFT JOIN content_calendar cc ON c.id = cc.client_id
WHERE cc.id IS NULL
ORDER BY c.created_at DESC;
