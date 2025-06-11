/*
  # Clear All Database Data

  This migration removes all data from all tables while preserving the table structure,
  indexes, policies, and constraints.
  
  1. Changes
    - Truncates all tables in the correct dependency order
    - Preserves table structures and policies
    - Resets all auto-increment sequences
    - Maintains all RLS policies and constraints
*/

-- Disable triggers temporarily to speed up the process
SET session_replication_role = 'replica';

-- Truncate tables in order of dependencies (child tables first)
-- This respects foreign key constraints

-- Clear player answers first (references players and questions)
TRUNCATE TABLE player_answers CASCADE;

-- Clear players (references game_sessions)
TRUNCATE TABLE players CASCADE;

-- Clear questions (references quizzes)
TRUNCATE TABLE questions CASCADE;

-- Clear game sessions (references quizzes and users)
TRUNCATE TABLE game_sessions CASCADE;

-- Clear quizzes (references users)
TRUNCATE TABLE quizzes CASCADE;

-- Clear user profiles (references users, but users table is managed by Supabase Auth)
TRUNCATE TABLE user_profiles CASCADE;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Reset sequences if they exist (though we use UUIDs, this is for completeness)
-- Note: UUID generation doesn't use sequences, but this ensures any future changes are covered
DO $$
BEGIN
    -- Reset any sequences that might exist
    PERFORM setval(pg_get_serial_sequence(schemaname||'.'||tablename, columnname), 1, false)
    FROM (
        SELECT schemaname, tablename, columnname
        FROM pg_tables t
        JOIN information_schema.columns c ON c.table_name = t.tablename
        WHERE t.schemaname = 'public'
        AND c.column_default LIKE 'nextval%'
    ) AS sequences;
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors if no sequences exist
        NULL;
END $$;