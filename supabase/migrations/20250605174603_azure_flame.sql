/*
  # Add Quiz Timer Settings

  1. Changes
    - Add `has_timer` column to quizzes table
    - Add `question_timer_seconds` column to quizzes table
    - Set default values for new columns
  
  2. Security
    - Maintain existing RLS policies
    - No additional security changes needed
*/

-- Add timer settings columns to quizzes table
ALTER TABLE quizzes
ADD COLUMN has_timer boolean DEFAULT false,
ADD COLUMN question_timer_seconds integer DEFAULT 20;