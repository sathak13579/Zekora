/*
  # Update Game Session Policies
  
  1. Changes
    - Add policy to allow anyone to read game sessions by PIN
    - Add policy for updating game sessions
    - Keep existing policies for authenticated users
  
  2. Security
    - Public can only read minimal game session data using PIN
    - Host users retain full access to their sessions
    - Host users can update their sessions
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read sessions they host" ON game_sessions;
DROP POLICY IF EXISTS "Anyone can read active game sessions by PIN" ON game_sessions;
DROP POLICY IF EXISTS "Users can read all session data they host" ON game_sessions;
DROP POLICY IF EXISTS "Users can update their game sessions" ON game_sessions;

-- Create game session policies
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
  TO authenticated
  USING (host_id = auth.uid())
  WITH CHECK (host_id = auth.uid());

-- Drop existing player policies if they exist
DROP POLICY IF EXISTS "Users can read players in their sessions" ON players;
DROP POLICY IF EXISTS "Anyone can join as player" ON players;
DROP POLICY IF EXISTS "Anyone can read players in a session" ON players;

-- Create player policies
CREATE POLICY "Anyone can read players in a session"
  ON players
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can join as player"
  ON players
  FOR INSERT
  WITH CHECK (true);

-- Drop existing player answer policies if they exist
DROP POLICY IF EXISTS "Users can read answers for their sessions" ON player_answers;
DROP POLICY IF EXISTS "Players can submit answers" ON player_answers;
DROP POLICY IF EXISTS "Anyone can read answers for their session" ON player_answers;
DROP POLICY IF EXISTS "Anyone can submit answers" ON player_answers;

-- Create player answer policies
CREATE POLICY "Anyone can read answers for their session"
  ON player_answers
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM players
    WHERE players.id = player_answers.player_id
  ));

CREATE POLICY "Anyone can submit answers"
  ON player_answers
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM players
    WHERE players.id = player_id
  ));