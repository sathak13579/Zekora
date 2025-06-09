/*
  # Clear All Data

  This migration truncates all tables in the correct order to respect foreign key constraints.
  
  1. Changes
    - Truncates all tables in the correct dependency order
    - Preserves table structures and policies
    - Resets all sequences
*/

-- Disable triggers temporarily
SET session_replication_role = 'replica';

-- Truncate tables in order of dependencies
TRUNCATE TABLE player_answers CASCADE;
TRUNCATE TABLE players CASCADE;
TRUNCATE TABLE questions CASCADE;
TRUNCATE TABLE game_sessions CASCADE;
TRUNCATE TABLE quizzes CASCADE;
TRUNCATE TABLE user_profiles CASCADE;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Reset all sequences
ALTER SEQUENCE IF EXISTS player_answers_id_seq RESTART;
ALTER SEQUENCE IF EXISTS players_id_seq RESTART;
ALTER SEQUENCE IF EXISTS questions_id_seq RESTART;
ALTER SEQUENCE IF EXISTS game_sessions_id_seq RESTART;
ALTER SEQUENCE IF EXISTS quizzes_id_seq RESTART;
ALTER SEQUENCE IF EXISTS user_profiles_id_seq RESTART;