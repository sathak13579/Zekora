/*
  # Add DELETE permission to questions table

  1. Security Changes
    - Add DELETE policy for questions table
    - Allow users to delete questions for their own quizzes
    - Maintain existing security constraints

  2. Policy Details
    - Users can only delete questions from quizzes they own
    - Uses EXISTS subquery to verify ownership through quiz relationship
*/

-- Add DELETE policy for questions table
CREATE POLICY "Users can delete questions for their quizzes"
  ON questions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM quizzes 
      WHERE quizzes.id = questions.quiz_id 
      AND quizzes.user_id = auth.uid()
    )
  );