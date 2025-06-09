import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useSupabase } from '../lib/supabase-provider';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function HostGame() {
  const { supabase, user, loading: supabaseLoading } = useSupabase();
  const navigate = useNavigate();
  const { quizId } = useParams();
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

  // Use ref to store the subscription to prevent multiple subscriptions
  const playerSubscriptionRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    console.log('HostGame useEffect triggered', { quizId, user, supabaseLoading });
    
    if (!quizId) {
      setError('No quiz ID provided');
      setLoading(false);
      return;
    }

    if (supabaseLoading) {
      console.log('Supabase still loading, waiting...');
      return;
    }

    if (!user) {
      console.log('No user found, redirecting to login');
      navigate('/login');
      return;
    }

    const fetchSessionData = async () => {
      console.log('Starting fetchSessionData for quizId:', quizId);
      
      try {
        // Clean up any existing subscription before creating a new one
        if (playerSubscriptionRef.current) {
          console.log('Cleaning up existing subscription');
          supabase.removeChannel(playerSubscriptionRef.current);
          playerSubscriptionRef.current = null;
        }

        // First, verify the quiz exists and belongs to the user
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', quizId)
          .eq('user_id', user.id)
          .single();

        if (quizError) {
          console.error('Quiz fetch error:', quizError);
          throw quizError;
        }
        if (!quizData) {
          console.error('Quiz not found');
          throw new Error('Quiz not found or you do not have permission to host it');
        }

        console.log('Quiz data fetched:', quizData);
        setQuiz(quizData);

        // Check if there's an existing active session for this quiz
        const { data: existingSession, error: sessionCheckError } = await supabase
          .from('game_sessions')
          .select('*')
          .eq('quiz_id', quizId)
          .eq('host_id', user.id)
          .in('status', ['waiting', 'active'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (sessionCheckError) {
          console.error('Session check error:', sessionCheckError);
          throw sessionCheckError;
        }

        let sessionData = existingSession;

        // If no existing session, create a new one
        if (!sessionData) {
          console.log('Creating new game session');
          const gamePin = Math.floor(100000 + Math.random() * 900000).toString();
          
          const { data: newSession, error: createError } = await supabase
            .from('game_sessions')
            .insert({
              quiz_id: quizId,
              host_id: user.id,
              pin: gamePin,
              status: 'waiting'
            })
            .select()
            .single();

          if (createError) {
            console.error('Session creation error:', createError);
            throw createError;
          }
          
          sessionData = newSession;
          console.log('New session created:', sessionData);
        } else {
          console.log('Using existing session:', sessionData);
        }

        setSession(sessionData);

        // Fetch questions for the quiz
        const { data: questionData, error: questionError } = await supabase
          .from('questions')
          .select('*')
          .eq('quiz_id', quizId)
          .order('order', { ascending: true });

        if (questionError) {
          console.error('Questions fetch error:', questionError);
          throw questionError;
        }
        
        console.log('Questions fetched:', questionData);
        setQuestions(questionData || []);

        // Subscribe to player updates using ref
        console.log('Creating player subscription for session:', sessionData.id);
        playerSubscriptionRef.current = supabase
          .channel(`players_${sessionData.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'players',
              filter: `session_id=eq.${sessionData.id}`,
            },
            (payload) => {
              console.log('Player update received:', payload);
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
          .eq('session_id', sessionData.id);

        if (playerError) {
          console.error('Players fetch error:', playerError);
          throw playerError;
        }
        
        console.log('Players fetched:', playerData);
        setPlayers(playerData || []);

        setLoading(false);
        console.log('fetchSessionData completed successfully');
      } catch (err) {
        console.error('Error in fetchSessionData:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };

    fetchSessionData();

    // Cleanup subscription on unmount or dependency change
    return () => {
      console.log('Cleaning up player subscription');
      if (playerSubscriptionRef.current) {
        supabase.removeChannel(playerSubscriptionRef.current);
        playerSubscriptionRef.current = null;
      }
    };
  }, [quizId, supabase, user, supabaseLoading, navigate]);

  const startGame = async () => {
    if (!session) return;
    
    try {
      const { error } = await supabase
        .from('game_sessions')
        .update({ status: 'active' })
        .eq('id', session.id);

      if (error) throw error;

      setGameStarted(true);
      if (quiz?.has_timer) {
        startTimer();
      }
    } catch (err) {
      console.error('Error starting game:', err);
      setError(err instanceof Error ? err.message : 'Failed to start game');
    }
  };

  const startTimer = () => {
    if (!quiz?.has_timer) return;
    setTimeLeft(quiz.question_timer_seconds || 20);
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
    if (!session) return;
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      if (quiz?.has_timer) {
        startTimer();
      }
    } else {
      // End the game
      try {
        const { error } = await supabase
          .from('game_sessions')
          .update({ status: 'completed' })
          .eq('id', session.id);

        if (error) throw error;
        navigate(`/analytics/${quizId}`);
      } catch (err) {
        console.error('Error ending game:', err);
        setError(err instanceof Error ? err.message : 'Failed to end game');
      }
    }
  };

  // Show loading spinner while Supabase is loading or component is loading
  if (supabaseLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Error</h1>
          <p className="mt-2 text-gray-600">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-6 inline-flex items-center rounded-md bg-brand-blue px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-blue/90"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!session || !quiz) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Session Not Found</h1>
          <p className="mt-2 text-gray-600">Unable to load the game session.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-6 inline-flex items-center rounded-md bg-brand-blue px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-blue/90"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{quiz.title}</h1>
        <p className="text-gray-600">Session PIN: {session.pin}</p>
        <p className="text-gray-600">
          Players joined: {players.length}/{quiz.player_limit || 50}
        </p>
      </div>

      {!gameStarted ? (
        <div className="text-center">
          <button
            onClick={startGame}
            className="bg-brand-blue text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-brand-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={players.length === 0}
          >
            Start Game
          </button>
          {players.length === 0 && (
            <p className="mt-4 text-gray-600">Waiting for players to join...</p>
          )}
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
            {currentQuestion && (
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
            )}
          </div>
          <div className="text-center">
            <button
              onClick={handleNextQuestion}
              className="bg-brand-blue text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-brand-blue/90 transition-colors"
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