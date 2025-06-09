import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSupabase } from '../lib/supabase-provider';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function HostGame() {
  const { supabase } = useSupabase();
  const navigate = useNavigate();
  const { id: sessionId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [quiz, setQuiz] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided');
      return;
    }

    const fetchSessionData = async () => {
      try {
        // Fetch game session
        const { data: sessionData, error: sessionError } = await supabase
          .from('game_sessions')
          .select('*, quiz:quizzes(*)')
          .eq('id', sessionId)
          .single();

        if (sessionError) throw sessionError;
        if (!sessionData) throw new Error('Session not found');

        setSession(sessionData);
        setQuiz(sessionData.quiz);

        // Fetch questions for the quiz
        const { data: questionData, error: questionError } = await supabase
          .from('questions')
          .select('*')
          .eq('quiz_id', sessionData.quiz.id)
          .order('order', { ascending: true });

        if (questionError) throw questionError;
        setQuestions(questionData);

        // Subscribe to player updates
        const playerSubscription = supabase
          .channel('players')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'players',
              filter: `session_id=eq.${sessionId}`,
            },
            (payload) => {
              if (payload.eventType === 'INSERT') {
                setPlayers((current) => [...current, payload.new]);
              } else if (payload.eventType === 'UPDATE') {
                setPlayers((current) =>
                  current.map((player) =>
                    player.id === payload.new.id ? payload.new : player
                  )
                );
              }
            }
          )
          .subscribe();

        // Initial fetch of players
        const { data: playerData, error: playerError } = await supabase
          .from('players')
          .select('*')
          .eq('session_id', sessionId);

        if (playerError) throw playerError;
        setPlayers(playerData);

        setLoading(false);

        // Cleanup subscription
        return () => {
          playerSubscription.unsubscribe();
        };
      } catch (err) {
        console.error('Error fetching session data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };

    fetchSessionData();
  }, [sessionId, supabase]);

  const startGame = async () => {
    try {
      const { error } = await supabase
        .from('game_sessions')
        .update({ status: 'active' })
        .eq('id', sessionId);

      if (error) throw error;

      setGameStarted(true);
      if (quiz.has_timer) {
        startTimer();
      }
    } catch (err) {
      console.error('Error starting game:', err);
      setError(err instanceof Error ? err.message : 'Failed to start game');
    }
  };

  const startTimer = () => {
    if (!quiz.has_timer) return;
    setTimeLeft(quiz.question_timer_seconds);
    setTimerActive(true);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timerActive && timeLeft !== null && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (timeLeft === 0) {
      setTimerActive(false);
      // Auto-advance to next question when timer reaches 0
      handleNextQuestion();
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timerActive, timeLeft]);

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      if (quiz.has_timer) {
        startTimer();
      }
    } else {
      // End the game
      try {
        const { error } = await supabase
          .from('game_sessions')
          .update({ status: 'completed' })
          .eq('id', sessionId);

        if (error) throw error;
        navigate(`/session/${sessionId}/results`);
      } catch (err) {
        console.error('Error ending game:', err);
        setError(err instanceof Error ? err.message : 'Failed to end game');
      }
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div>Error: {error}</div>;

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{quiz.title}</h1>
        <p className="text-gray-600">Session PIN: {session.pin}</p>
        <p className="text-gray-600">
          Players joined: {players.length}/{quiz.player_limit}
        </p>
      </div>

      {!gameStarted ? (
        <div className="text-center">
          <button
            onClick={startGame}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-blue-600 transition-colors"
            disabled={players.length === 0}
          >
            Start Game
          </button>
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Players:</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="bg-gray-100 p-4 rounded-lg text-center"
                >
                  {player.nickname}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">
                Question {currentQuestionIndex + 1} of {questions.length}
              </h2>
              {quiz.has_timer && timeLeft !== null && (
                <div className="text-2xl font-bold">Time left: {timeLeft}s</div>
              )}
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <p className="text-xl mb-4">{currentQuestion.question_text}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQuestion.options.map((option: string, index: number) => (
                  <div
                    key={index}
                    className="bg-gray-100 p-4 rounded-lg text-center"
                  >
                    {option}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="text-center">
            <button
              onClick={handleNextQuestion}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-blue-600 transition-colors"
            >
              {currentQuestionIndex < questions.length - 1
                ? 'Next Question'
                : 'End Game'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}