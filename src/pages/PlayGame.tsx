import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSupabase } from '../lib/supabase-provider';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Timer, UserSquare as TimerSquare } from 'lucide-react';

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
}

interface GameSession {
  id: string;
  quiz_id: string;
  status: 'waiting' | 'active' | 'completed';
}

const PlayGame = () => {
  const { pin } = useParams();
  const navigate = useNavigate();
  const { supabase } = useSupabase();
  const [nickname, setNickname] = useState('');
  const [session, setSession] = useState<GameSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGameSession = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase
          .from('game_sessions')
          .select('*')
          .eq('pin', pin)
          .single();

        if (sessionError) throw sessionError;
        if (!sessionData) throw new Error('Game session not found');

        setSession(sessionData);
        setIsLoading(false);
      } catch (err) {
        setError('Failed to join game session');
        setIsLoading(false);
      }
    };

    fetchGameSession();
  }, [pin, supabase]);

  useEffect(() => {
    if (!session) return;

    const channel = supabase.channel(`game_${session.id}`);

    channel
      .on('broadcast', { event: 'question_update' }, ({ payload }) => {
        setCurrentQuestion(payload.question);
        setTimeRemaining(payload.timeLimit);
        setSelectedAnswer(null);
        setIsAnswerSubmitted(false);
      })
      .on('broadcast', { event: 'timer_update' }, ({ payload }) => {
        setTimeRemaining(payload.timeRemaining);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [session, supabase]);

  useEffect(() => {
    if (timeRemaining === 0 && !isAnswerSubmitted && selectedAnswer) {
      handleSubmitAnswer();
    }
  }, [timeRemaining, isAnswerSubmitted, selectedAnswer]);

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError('Please enter a nickname');
      return;
    }

    try {
      const { data: player, error: playerError } = await supabase
        .from('players')
        .insert([
          {
            session_id: session!.id,
            nickname: nickname.trim(),
          },
        ])
        .select()
        .single();

      if (playerError) throw playerError;

      // Subscribe to game updates
      const channel = supabase.channel(`game_${session!.id}`);
      channel.subscribe();

    } catch (err) {
      setError('Failed to join game');
    }
  };

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || isAnswerSubmitted) return;

    try {
      const isCorrect = selectedAnswer === currentQuestion?.correct_answer;
      const responseTime = 20000 - (timeRemaining || 0) * 1000;
      const score = calculateScore(isCorrect, responseTime);

      const { error: answerError } = await supabase
        .from('player_answers')
        .insert([
          {
            player_id: session!.id,
            question_id: currentQuestion!.id,
            selected_answer: selectedAnswer,
            is_correct: isCorrect,
            response_time_ms: responseTime,
            score: score,
          },
        ]);

      if (answerError) throw answerError;
      setIsAnswerSubmitted(true);

    } catch (err) {
      setError('Failed to submit answer');
    }
  };

  const calculateScore = (isCorrect: boolean, responseTime: number): number => {
    if (!isCorrect) return 0;
    const maxScore = 1000;
    const timeBonus = Math.max(0, 1 - (responseTime / 20000));
    return Math.round(maxScore * timeBonus);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-lg mb-4">Game session not found</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (!nickname) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center">Join Game</h2>
          <form onSubmit={handleJoinGame}>
            <div className="mb-4">
              <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-2">
                Enter your nickname
              </label>
              <input
                type="text"
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your nickname"
                maxLength={20}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Join Game
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {currentQuestion ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Question</h2>
              <div className="flex items-center space-x-2">
                <Timer className="w-5 h-5" />
                <span className="text-lg font-medium">{timeRemaining}s</span>
              </div>
            </div>
            <p className="text-lg mb-6">{currentQuestion.question_text}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => !isAnswerSubmitted && setSelectedAnswer(option)}
                  className={`p-4 rounded-lg text-left transition-colors ${
                    selectedAnswer === option
                      ? 'bg-blue-100 border-2 border-blue-500'
                      : 'bg-gray-50 hover:bg-gray-100'
                  } ${isAnswerSubmitted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  disabled={isAnswerSubmitted}
                >
                  {option}
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSubmitAnswer}
                disabled={!selectedAnswer || isAnswerSubmitted}
                className={`px-6 py-2 rounded-md ${
                  !selectedAnswer || isAnswerSubmitted
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                Submit Answer
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Waiting for the next question...</h2>
            <LoadingSpinner />
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayGame;