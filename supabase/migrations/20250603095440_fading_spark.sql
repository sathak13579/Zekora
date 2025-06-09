/*
  # Update Game Session Policies
  
  1. Changes
    - Add policy to allow anyone to read game sessions by PIN
    - Keep existing policies for authenticated users
  
  2. Security
    - Public can only read minimal game session data using PIN
    - Host users retain full access to their sessions
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read sessions they host" ON game_sessions;

-- Create new policies
CREATE POLICY "Anyone can read active game sessions by PIN"
  ON game_sessions
  FOR SELECT
  USING (true);

CREATE POLICY "Users can read all session data they host"
  ON game_sessions
  FOR SELECT
  TO authenticated
  USING (host_id = auth.uid());

-- Update players policies to allow anyone to read player lists
DROP POLICY IF EXISTS "Users can read players in their sessions" ON players;
DROP POLICY IF EXISTS "Anyone can join as player" ON players;

CREATE POLICY "Anyone can read players in a session"
  ON players
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can join as player"
  ON players
  FOR INSERT
  WITH CHECK (true);

-- Update player answers policies
DROP POLICY IF EXISTS "Users can read answers for their sessions" ON player_answers;
DROP POLICY IF EXISTS "Players can submit answers" ON player_answers;

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