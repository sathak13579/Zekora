/*
  # Quiz Application Schema

  1. New Tables
    - `quizzes`: Main quiz table
      - `id` (uuid, primary key)
      - `created_at` (timestamptz)
      - `title` (text)
      - `description` (text, nullable)
      - `user_id` (uuid, references auth.users)
      - `status` (text, enum-like)
      - `player_limit` (integer)
    
    - `questions`: Quiz questions
      - `id` (uuid, primary key)
      - `quiz_id` (uuid, references quizzes)
      - `question_text` (text)
      - `options` (jsonb)
      - `correct_answer` (text)
      - `explanation` (text)
      - `order` (integer)
    
    - `game_sessions`: Active quiz sessions
      - `id` (uuid, primary key)
      - `quiz_id` (uuid, references quizzes)
      - `host_id` (uuid, references auth.users)
      - `pin` (text)
      - `status` (text, enum-like)
      - `created_at` (timestamptz)
    
    - `players`: Game participants
      - `id` (uuid, primary key)
      - `session_id` (uuid, references game_sessions)
      - `nickname` (text)
      - `total_score` (integer)
      - `created_at` (timestamptz)
    
    - `player_answers`: Player responses
      - `id` (uuid, primary key)
      - `player_id` (uuid, references players)
      - `question_id` (uuid, references questions)
      - `selected_answer` (text)
      - `is_correct` (boolean)
      - `response_time_ms` (integer)
      - `score` (integer)
    
    - `user_profiles`: Extended user information
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `is_pro` (boolean)
      - `subdomain` (text, nullable)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to:
      - Read/write their own quizzes
      - Read/write questions for their quizzes
      - Read/write game sessions they host
      - Read player data for their sessions
      - Read/write their own profile
*/

-- Create enum-like types using CHECK constraints
CREATE TYPE quiz_status AS ENUM ('draft', 'ready', 'completed');
CREATE TYPE session_status AS ENUM ('waiting', 'active', 'completed');

-- Quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  title text NOT NULL,
  description text,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status quiz_status DEFAULT 'draft',
  player_limit integer DEFAULT 50
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  options jsonb NOT NULL,
  correct_answer text NOT NULL,
  explanation text NOT NULL,
  "order" integer NOT NULL
);

-- Game sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  host_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pin text NOT NULL UNIQUE,
  status session_status DEFAULT 'waiting',
  created_at timestamptz DEFAULT now()
);

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  nickname text NOT NULL,
  total_score integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Player answers table
CREATE TABLE IF NOT EXISTS player_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_answer text NOT NULL,
  is_correct boolean NOT NULL,
  response_time_ms integer NOT NULL,
  score integer NOT NULL
);

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_pro boolean DEFAULT false,
  subdomain text UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for quizzes
CREATE POLICY "Users can read own quizzes"
  ON quizzes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quizzes"
  ON quizzes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quizzes"
  ON quizzes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for questions
CREATE POLICY "Users can read questions for their quizzes"
  ON questions
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM quizzes
    WHERE quizzes.id = questions.quiz_id
    AND quizzes.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert questions for their quizzes"
  ON questions
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM quizzes
    WHERE quizzes.id = quiz_id
    AND quizzes.user_id = auth.uid()
  ));

CREATE POLICY "Users can update questions for their quizzes"
  ON questions
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM quizzes
    WHERE quizzes.id = quiz_id
    AND quizzes.user_id = auth.uid()
  ));

-- Policies for game sessions
CREATE POLICY "Users can read sessions they host"
  ON game_sessions
  FOR SELECT
  TO authenticated
  USING (host_id = auth.uid());

CREATE POLICY "Users can create sessions for their quizzes"
  ON game_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM quizzes
    WHERE quizzes.id = quiz_id
    AND quizzes.user_id = auth.uid()
  ));

-- Policies for players
CREATE POLICY "Users can read players in their sessions"
  ON players
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM game_sessions
    WHERE game_sessions.id = session_id
    AND game_sessions.host_id = auth.uid()
  ));

CREATE POLICY "Anyone can join as player"
  ON players
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policies for player answers
CREATE POLICY "Users can read answers for their sessions"
  ON player_answers
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM players
    JOIN game_sessions ON players.session_id = game_sessions.id
    WHERE players.id = player_answers.player_id
    AND game_sessions.host_id = auth.uid()
  ));

CREATE POLICY "Players can submit answers"
  ON player_answers
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM players
    WHERE players.id = player_id
  ));

-- Policies for user profiles
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quizzes_user_id ON quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_quiz_id ON game_sessions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_host_id ON game_sessions(host_id);
CREATE INDEX IF NOT EXISTS idx_players_session_id ON players(session_id);
CREATE INDEX IF NOT EXISTS idx_player_answers_player_id ON player_answers(player_id);
CREATE INDEX IF NOT EXISTS idx_player_answers_question_id ON player_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);