import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useSupabase } from '../lib/supabase-provider';
import { RealtimeChannel } from '@supabase/supabase-js';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Timer, Trophy, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateScore } from '../lib/utils';

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

interface GameSession {
  id: string;
  quiz_id: string;
  status: 'waiting' | 'active' | 'completed';
  pin: string;
}

interface Player {
  id: string;
  nickname: string;
  total_score: number;
}

const PlayGame = () => {
  const { gameId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { supabase } = useSupabase();
  const playerIdRef = useRef<string | null>(null);
  const gameChannelRef = useRef<RealtimeChannel | null>(null);
  
  const [nickname, setNickname] = useState(searchParams.get('nickname') || '');
  const [session, setSession] = useState<GameSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [leaderboard, setLeaderboard] = useState<Player[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [resultsCountdown, setResultsCountdown] = useState<number>(0);
  const resultsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    const fetchGameSession = async () => {
      if (!gameId) {
        setError('No game PIN provided');
        setIsLoading(false);
        return;
      }

      try {
        console.log('Fetching game session for PIN:', gameId);
        
        const { data: sessionData, error: sessionError } = await supabase
          .from('game_sessions')
          .select('*')
          .eq('pin', gameId)
          .single();

        if (sessionError) {
          console.error('Session fetch error:', sessionError);
          throw new Error('Game session not found. Please check the PIN and try again.');
        }
        
        if (!sessionData) {
          throw new Error('Game session not found');
        }

        console.log('Found session:', sessionData);
        setSession(sessionData);
        setGameStatus(sessionData.status === 'completed' ? 'finished' : 
                     sessionData.status === 'active' ? 'playing' : 'waiting');
        
        setIsLoading(false);
      } catch (err: unknown) {
        console.error('Error fetching session:', err);
        setError(err instanceof Error ? err.message : 'Failed to join game session');
        setIsLoading(false);
      }
    };

    fetchGameSession();
  }, [gameId, supabase]);

  useEffect(() => {
    if (!session || !nickname.trim()) return;

    const joinGame = async () => {
      try {
        console.log('Joining game with nickname:', nickname);
        
        // Check if player already exists
        const { data: existingPlayer, error: checkError } = await supabase
          .from('players')
          .select('*')
          .eq('session_id', session.id)
          .eq('nickname', nickname.trim())
          .maybeSingle();

        if (checkError) {
          console.error('Error checking existing player:', checkError);
          throw checkError;
        }

        if (existingPlayer) {
          console.log('Player already exists:', existingPlayer);
          playerIdRef.current = existingPlayer.id;
          // Broadcast player joined
          const gameChannel = supabase.channel(`game:${session.id}`);
          await gameChannel.send({
            type: 'broadcast',
            event: 'player_joined',
            payload: {
              player: {
                id: existingPlayer.id,
                nickname: existingPlayer.nickname,
                total_score: existingPlayer.total_score,
              }
            }
          });
        } else {
          // Create new player
          const { data: newPlayer, error: playerError } = await supabase
            .from('players')
            .insert([
              {
                session_id: session.id,
                nickname: nickname.trim(),
                total_score: 0,
              },
            ])
            .select()
            .single();

          if (playerError) {
            console.error('Error creating player:', playerError);
            throw playerError;
          }

          console.log('New player created:', newPlayer);
          playerIdRef.current = newPlayer.id;
          // Broadcast player joined
          const gameChannel = supabase.channel(`game:${session.id}`);
          await gameChannel.send({
            type: 'broadcast',
            event: 'player_joined',
            payload: {
              player: {
                id: newPlayer.id,
                nickname: newPlayer.nickname,
                total_score: newPlayer.total_score,
              }
            }
          });
        }

        // Set up realtime subscriptions
        setupRealtimeSubscriptions();
        
      } catch (err: unknown) {
        console.error('Error joining game:', err);
        setError(err instanceof Error ? err.message : 'Failed to join game');
      }
    };

    joinGame();
  }, [session, nickname, supabase]);

  const setupRealtimeSubscriptions = () => {
    if (!session) return;

    // Unsubscribe previous channel if exists
    if (gameChannelRef.current) {
      gameChannelRef.current.unsubscribe();
    }

    console.log('Setting up realtime subscriptions for session:', session.id);

    // Subscribe to game updates and timer sync
    const gameChannel = supabase.channel(`game:${session.id}`);
    
    gameChannel
      .on('broadcast', { event: 'game_started' }, (payload) => {
        setCurrentQuestion(payload.payload.question);
        setGameStatus('playing');
        setShowResults(false);
        setShowLeaderboard(false);
        setSelectedAnswer(null);
        setIsAnswerSubmitted(false);
        setTimeRemaining(payload.payload.timeLeft);
        setQuestionStartTime(Date.now());
      })
      .on('broadcast', { event: 'next_question' }, (payload) => {
        setCurrentQuestion(payload.payload.question);
        setShowResults(false);
        setShowLeaderboard(false);
        setSelectedAnswer(null);
        setIsAnswerSubmitted(false);
        setTimeRemaining(payload.payload.timeLeft);
        setQuestionStartTime(Date.now());
        if (resultsTimerRef.current) {
          clearInterval(resultsTimerRef.current);
        }
      })
      .on('broadcast', { event: 'timer_update' }, (payload) => {
        setTimeRemaining(payload.payload.timeLeft);
      })
      .on('broadcast', { event: 'player_joined' }, () => {
        // Already handled for host, but can be used for player-side notifications if needed
      })
      .on('broadcast', { event: 'reveal_answer' }, (payload) => {
        setShowResults(true);
        setShowLeaderboard(false);
        setTimeout(() => {
          setShowLeaderboard(true);
          setResultsCountdown(5);
          if (resultsTimerRef.current) clearInterval(resultsTimerRef.current);
          resultsTimerRef.current = setInterval(() => {
            setResultsCountdown((c) => {
              if (c <= 1) {
                clearInterval(resultsTimerRef.current!);
                return 0;
              }
              return c - 1;
            });
          }, 1000);
        }, 3000);
        if (payload.payload.leaderboard) {
          setLeaderboard(payload.payload.leaderboard);
        }
      })
      .on('broadcast', { event: 'leaderboard_update' }, (payload) => {
        if (payload.payload.leaderboard) {
          setLeaderboard(payload.payload.leaderboard);
        }
      })
      .on('broadcast', { event: 'game_ended' }, async (payload) => {
        setGameStatus('finished');
        // Always fetch the latest leaderboard from the DB for accuracy
        if (session) {
          const { data: freshPlayers, error } = await supabase
            .from('players')
            .select('*')
            .eq('session_id', session.id)
            .order('total_score', { ascending: false });
          if (!error && freshPlayers) {
            setLeaderboard(freshPlayers);
          } else if (payload.payload.leaderboard) {
            setLeaderboard(payload.payload.leaderboard);
          }
        } else if (payload.payload.leaderboard) {
          setLeaderboard(payload.payload.leaderboard);
        }
      })
      .subscribe();

    gameChannelRef.current = gameChannel;

    return () => {
      if (gameChannelRef.current) {
        gameChannelRef.current.unsubscribe();
      }
    };
  };

  const handleSubmitAnswer = async (selected: string) => {
    if (isAnswerSubmitted || !currentQuestion || !playerIdRef.current) return;

    try {
      setSelectedAnswer(selected);
      const responseTime = Date.now() - questionStartTime;
      const isCorrect = selected === currentQuestion.correct_answer;
      const score = calculateScore(isCorrect, responseTime);

      console.log('Submitting answer:', {
        selectedAnswer: selected,
        isCorrect,
        responseTime,
        score
      });

      const { error: answerError } = await supabase
        .from('player_answers')
        .insert([
          {
            player_id: playerIdRef.current,
            question_id: currentQuestion.id,
            selected_answer: selected,
            is_correct: isCorrect,
            response_time_ms: responseTime,
            score: score,
          },
        ]);

      if (answerError) {
        console.error('Error submitting answer:', answerError);
        throw answerError;
      }

      // (NEW) Send socket event to host
      if (gameChannelRef.current) {
        await gameChannelRef.current.send({
          type: 'broadcast',
          event: 'player_answered',
          payload: {
            player_id: playerIdRef.current,
            question_id: currentQuestion.id,
            selected_answer: selected,
            is_correct: isCorrect,
            response_time_ms: responseTime,
            score: score,
          }
        });
      }

      // Fetch current total_score
      const { data: playerData, error: fetchError } = await supabase
        .from('players')
        .select('total_score')
        .eq('id', playerIdRef.current)
        .single();
      if (fetchError) throw fetchError;
      const newTotalScore = (playerData?.total_score || 0) + score;

      // Update player's total score
      const { error: updateError } = await supabase
        .from('players')
        .update({ total_score: newTotalScore })
        .eq('id', playerIdRef.current);
      if (updateError) throw updateError;

      setIsAnswerSubmitted(true);
      console.log('Answer submitted successfully');
    } catch (err: unknown) {
      console.error('Error submitting answer:', err);
      setError('Failed to submit answer');
    }
  };

  // Auto-submit when timer reaches 0
  useEffect(() => {
    if (timeRemaining === 0 && !isAnswerSubmitted && selectedAnswer) {
      handleSubmitAnswer(selectedAnswer);
    }
  }, [timeRemaining, isAnswerSubmitted, selectedAnswer]);

  useEffect(() => {
    return () => {
      if (gameChannelRef.current) {
        gameChannelRef.current.unsubscribe();
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="rounded-lg bg-white p-6 shadow-sm border">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Join Game</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/join')}
              className="px-4 py-2 bg-brand-blue text-white rounded hover:bg-brand-blue/90"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="rounded-lg bg-white p-6 shadow-sm border">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Game Not Found</h2>
            <p className="text-gray-600 mb-4">The game session could not be found.</p>
            <button
              onClick={() => navigate('/join')}
              className="px-4 py-2 bg-brand-blue text-white rounded hover:bg-brand-blue/90"
            >
              Join Another Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!nickname.trim()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center">Join Game</h2>
          <form onSubmit={(e) => {
            e.preventDefault();
            const nicknameInput = (e.target as HTMLFormElement).nickname.value.trim();
            if (nicknameInput) {
              setNickname(nicknameInput);
            }
          }}>
            <div className="mb-4">
              <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-2">
                Enter your nickname
              </label>
              <input
                type="text"
                id="nickname"
                name="nickname"
                defaultValue={nickname}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue"
                placeholder="Your nickname"
                maxLength={15}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-brand-blue text-white py-2 px-4 rounded-md hover:bg-brand-blue/90 transition-colors"
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
        {/* Waiting for game to start */}
        {gameStatus === 'waiting' && (
          <motion.div 
            className="bg-white rounded-lg shadow-md p-6 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div 
              className="mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
            >
              <Users className="w-12 h-12 mx-auto text-brand-blue" />
            </motion.div>
            <motion.h2 
              className="text-2xl font-semibold mb-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              Welcome, {nickname}!
            </motion.h2>
            <motion.p 
              className="text-gray-600 mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              You've joined the game successfully.
            </motion.p>
            <motion.p 
              className="text-lg text-brand-blue font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              Waiting for the host to start the quiz...
            </motion.p>
            <motion.div 
              className="mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <LoadingSpinner />
            </motion.div>
          </motion.div>
        )}

        {/* Show leaderboard/results between questions */}
        {gameStatus === 'playing' && showResults && showLeaderboard && (
          <motion.div 
            className="bg-white rounded-lg shadow-md p-6 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.h2 
              className="text-2xl font-semibold mb-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Leaderboard
            </motion.h2>
            <motion.div 
              className="mb-2 text-lg text-gray-700"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              Next question in {resultsCountdown}s
            </motion.div>
            {leaderboard.length > 0 ? (
              <AnimatePresence>
                <motion.div 
                  className="space-y-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  {leaderboard.slice(0, 5).map((player, index) => (
                    <motion.div
                      key={player.id}
                      layout
                      initial={{ opacity: 0, x: -50, scale: 0.9 }}
                      animate={{ 
                        opacity: 1, 
                        x: 0, 
                        scale: 1,
                        transition: {
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                          delay: index * 0.1
                        }
                      }}
                      exit={{ 
                        opacity: 0, 
                        x: 50, 
                        scale: 0.9,
                        transition: { duration: 0.2 }
                      }}
                      transition={{
                        layout: {
                          type: "spring",
                          stiffness: 300,
                          damping: 30
                        }
                      }}
                      className={`flex justify-between items-center p-4 rounded-lg shadow-sm ${
                        player.nickname === nickname 
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white ring-2 ring-indigo-300' 
                          : index === 0
                          ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-lg transform scale-105"
                          : index === 1
                          ? "bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800"
                          : index === 2
                          ? "bg-gradient-to-r from-orange-300 to-orange-400 text-orange-800"
                          : "bg-gray-50 text-gray-800"
                      }`}
                      whileHover={{ 
                        scale: player.nickname === nickname ? 1.05 : index === 0 ? 1.08 : 1.02,
                        transition: { duration: 0.2 }
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <motion.span 
                          className={`font-bold text-lg ${
                            index === 0 ? "text-2xl" : ""
                          }`}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ 
                            delay: index * 0.1 + 0.2,
                            type: "spring",
                            stiffness: 400,
                            damping: 20
                          }}
                        >
                          #{index + 1}
                        </motion.span>
                        <motion.span 
                          className={`font-medium ${
                            index === 0 ? "text-lg" : ""
                          }`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.1 + 0.3 }}
                        >
                          {player.nickname}
                        </motion.span>
                        {player.nickname === nickname && (
                          <motion.span 
                            className="text-xs bg-white/20 px-2 py-1 rounded-full"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.5, type: "spring" }}
                          >
                            You
                          </motion.span>
                        )}
                      </div>
                      <motion.span 
                        className={`font-bold ${
                          index === 0 ? "text-xl" : "text-lg"
                        }`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ 
                          delay: index * 0.1 + 0.4,
                          type: "spring",
                          stiffness: 400,
                          damping: 20
                        }}
                      >
                        {player.total_score} pts
                      </motion.span>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            ) : (
              <p className="text-gray-600">No leaderboard data yet.</p>
            )}
          </motion.div>
        )}

        {/* Playing - Question View */}
        {gameStatus === 'playing' && (!showResults || (showResults && !showLeaderboard)) && currentQuestion && (
          <motion.div 
            className="bg-white rounded-lg shadow-md p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex justify-between items-center mb-6">
              <motion.h2 
                className="text-xl font-semibold"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                Question
              </motion.h2>
              {timeRemaining !== null && (
                <motion.div 
                  className="flex items-center space-x-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <Timer className="w-5 h-5" />
                  <span className="text-lg font-medium">{timeRemaining}s</span>
                </motion.div>
              )}
            </div>
            
            <motion.p 
              className="text-lg mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {currentQuestion.question_text}
            </motion.p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {currentQuestion.options.map((option, index) => (
                <motion.button
                  key={index}
                  onClick={() => {
                    if (!isAnswerSubmitted) {
                      handleSubmitAnswer(option);
                    }
                  }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    delay: 0.4 + index * 0.1, 
                    duration: 0.3,
                    type: "spring",
                    stiffness: 300
                  }}
                  whileHover={{ 
                    scale: isAnswerSubmitted ? 1 : 1.02,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ 
                    scale: isAnswerSubmitted ? 1 : 0.98,
                    transition: { duration: 0.1 }
                  }}
                  className={`p-4 rounded-lg text-left transition-colors ${
                    selectedAnswer === option
                      ? 'bg-brand-blue text-white'
                      : 'bg-gray-50 hover:bg-gray-100'
                  } ${isAnswerSubmitted ? 'cursor-not-allowed' : 'cursor-pointer'} ${
                    showResults && option === currentQuestion.correct_answer
                      ? 'bg-green-500 text-white'
                      : showResults && selectedAnswer === option && option !== currentQuestion.correct_answer
                        ? 'bg-red-500 text-white'
                        : ''
                  }`}
                  disabled={isAnswerSubmitted}
                >
                  <div className="flex items-center">
                    <span className="mr-3 flex h-6 w-6 items-center justify-center rounded-full bg-white text-gray-900 text-xs font-medium">
                      {String.fromCharCode(65 + index)}
                    </span>
                    {option}
                  </div>
                </motion.button>
              ))}
            </div>

            {showResults && currentQuestion.explanation && (
              <motion.div 
                className="mb-6 p-4 bg-blue-50 rounded-lg"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <h3 className="font-medium text-blue-800 mb-2">Explanation</h3>
                <p className="text-blue-700">{currentQuestion.explanation}</p>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Game finished */}
        {gameStatus === 'finished' && (
          <motion.div 
            className="bg-white rounded-lg shadow-md p-6 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div 
              className="mb-4"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
            >
              <Trophy className="w-12 h-12 mx-auto text-yellow-500" />
            </motion.div>
            <motion.h2 
              className="text-2xl font-semibold mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              Quiz Complete!
            </motion.h2>
            <motion.p 
              className="text-gray-600 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              Thanks for playing, {nickname}!
            </motion.p>
            
            {leaderboard.length > 0 && (
              <motion.div 
                className="mt-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <h3 className="text-lg font-semibold mb-4">Final Results</h3>
                <AnimatePresence>
                  <div className="space-y-2">
                    {leaderboard.slice(0, 5).map((player, index) => (
                      <motion.div
                        key={player.id}
                        layout
                        initial={{ opacity: 0, x: -50, scale: 0.9 }}
                        animate={{ 
                          opacity: 1, 
                          x: 0, 
                          scale: 1,
                          transition: {
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                            delay: index * 0.1
                          }
                        }}
                        transition={{
                          layout: {
                            type: "spring",
                            stiffness: 300,
                            damping: 30
                          }
                        }}
                        className={`flex justify-between items-center p-3 rounded ${
                          player.nickname === nickname 
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white ring-2 ring-indigo-300' 
                            : index === 0
                            ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white"
                            : "bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="font-bold">#{index + 1}</span>
                          <span>{player.nickname}</span>
                          {player.nickname === nickname && (
                            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                              You
                            </span>
                          )}
                        </div>
                        <span className="font-bold">{player.total_score} pts</span>
                      </motion.div>
                    ))}
                  </div>
                </AnimatePresence>
              </motion.div>
            )}
            
            <motion.button
              onClick={() => navigate('/join')}
              className="mt-6 px-6 py-2 bg-brand-blue text-white rounded hover:bg-brand-blue/90"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Join Another Game
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PlayGame;