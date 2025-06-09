-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read players in a session" ON players;
DROP POLICY IF EXISTS "Anyone can join as player" ON players;
DROP POLICY IF EXISTS "Anyone can update their own data" ON players;

-- Create updated policies for players table
CREATE POLICY "Anyone can read players in a session"
  ON players
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can join as player"
  ON players
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Players can update their own data"
  ON players
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Update game sessions policies to ensure proper access
DROP POLICY IF EXISTS "Anyone can read active game sessions by PIN" ON game_sessions;
DROP POLICY IF EXISTS "Users can read all session data they host" ON game_sessions;
DROP POLICY IF EXISTS "Users can update their game sessions" ON game_sessions;

CREATE POLICY "Anyone can read active game sessions by PIN"
  ON game_sessions
  FOR SELECT
  USING (true);

CREATE POLICY "Users can read all session data they host"
  ON game_sessions
  FOR SELECT
  TO authenticated
  USING (host_id = auth.uid());

CREATE POLICY "Users can update their game sessions"
  ON game_sessions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Update player answers policies
DROP POLICY IF EXISTS "Anyone can read answers for their session" ON player_answers;
DROP POLICY IF EXISTS "Anyone can submit answers" ON player_answers;

CREATE POLICY "Anyone can read answers for their session"
  ON player_answers
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can submit answers"
  ON player_answers
  FOR INSERT
  WITH CHECK (true);

-- Update questions policies to allow reading during gameplay
DROP POLICY IF EXISTS "Users can read questions for their quizzes" ON questions;

CREATE POLICY "Anyone can read questions"
  ON questions
  FOR SELECT
  USING (true);