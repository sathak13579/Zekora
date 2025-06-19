import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useSupabase } from "../lib/supabase-provider";
import { generateGamePin } from "../lib/utils";
import { Users, Clock, Play, ArrowRight, Copy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import LoadingSpinner from "../components/ui/LoadingSpinner";

// Types
type Quiz = {
  id: string;
  title: string;
  description: string | null;
  has_timer: boolean;
  question_timer_seconds: number;
};

type Question = {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  order: number;
};

type Player = {
  id: string;
  nickname: string;
  total_score: number;
};

type GameSession = {
  id: string;
  quiz_id: string;
  host_id: string;
  pin: string;
  status: "waiting" | "active" | "completed";
  created_at: string;
};

type PlayerAnswer = {
  player_id: string;
  question_id: string;
  selected_answer: string;
  is_correct: boolean;
  response_time_ms: number;
  score: number;
};

const HostGame = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const { supabase, user, loading: userLoading } = useSupabase();
  const navigate = useNavigate();

  // Refs for cleanup
  const playerSubscriptionRef = useRef<RealtimeChannel | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const gameChannelRef = useRef<RealtimeChannel | null>(null);
  const answersChannelRef = useRef<RealtimeChannel | null>(null);
  const currentQuestionIndexRef = useRef<number>(0);

  // State
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [session, setSession] = useState<GameSession | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(() => {
    const savedIndex = localStorage.getItem(`questionIndex_${quizId}`);
    return savedIndex ? parseInt(savedIndex, 10) : 0;
  });
  const [gameStarted, setGameStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedPin, setCopiedPin] = useState(false);
  const [answers, setAnswers] = useState<PlayerAnswer[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [resultsCountdown, setResultsCountdown] = useState<number>(0);
  const resultsTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update localStorage when currentQuestionIndex changes
  useEffect(() => {
    if (quizId) {
      localStorage.setItem(
        `questionIndex_${quizId}`,
        currentQuestionIndex.toString()
      );
      currentQuestionIndexRef.current = currentQuestionIndex;
    }
  }, [currentQuestionIndex, quizId]);

  // Clean up localStorage when component unmounts
  useEffect(() => {
    return () => {
      if (quizId) {
        localStorage.removeItem(`questionIndex_${quizId}`);
      }
    };
  }, [quizId]);

  useEffect(() => {
    const fetchSessionData = async () => {
      if (!quizId) {
        setError("No quiz ID provided");
        setLoading(false);
        return;
      }

      if (userLoading) {
        return; // Wait for user loading to complete
      }

      if (!user) {
        navigate("/login");
        return;
      }

      try {
        console.log("Loading quiz data for:", quizId);

        // Fetch quiz data
        const { data: quizData, error: quizError } = await supabase
          .from("quizzes")
          .select("*")
          .eq("id", quizId)
          .eq("user_id", user.id)
          .single();

        if (quizError) throw quizError;
        if (!quizData)
          throw new Error(
            "Quiz not found or you do not have permission to host it"
          );

        setQuiz(quizData);

        // Fetch questions
        const { data: questionsData, error: questionsError } = await supabase
          .from("questions")
          .select("*")
          .eq("quiz_id", quizId)
          .order("order", { ascending: true });

        if (questionsError) throw questionsError;
        if (!questionsData || questionsData.length === 0) {
          throw new Error(
            "This quiz has no questions. Add some questions before hosting the game."
          );
        }

        setQuestions(questionsData);

        // Check for existing active session
        const { data: existingSession, error: sessionError } = await supabase
          .from("game_sessions")
          .select("*")
          .eq("quiz_id", quizId)
          .eq("host_id", user.id)
          .in("status", ["waiting", "active"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (sessionError) throw sessionError;

        let sessionData = existingSession;

        // Create new session if none exists
        if (!sessionData) {
          const pin = generateGamePin();
          console.log("Creating new session with PIN:", pin);

          const { data: newSession, error: createError } = await supabase
            .from("game_sessions")
            .insert({
              quiz_id: quizId,
              host_id: user.id,
              pin: pin,
              status: "waiting",
            })
            .select()
            .single();

          if (createError) throw createError;
          sessionData = newSession;
        }

        setSession(sessionData);
        setGameStarted(sessionData.status === "active");

        // Fetch initial players
        await fetchPlayers(sessionData.id);

        setLoading(false);
      } catch (err: unknown) {
        console.error("Error loading quiz:", err);
        setError(err instanceof Error ? err.message : "Failed to load quiz");
        setLoading(false);
      }
    };

    fetchSessionData();

    // Cleanup on unmount
    return () => {
      if (playerSubscriptionRef.current) {
        supabase.removeChannel(playerSubscriptionRef.current);
        playerSubscriptionRef.current = null;
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (gameChannelRef.current) {
        supabase.removeChannel(gameChannelRef.current);
        gameChannelRef.current = null;
      }
      if (answersChannelRef.current) {
        supabase.removeChannel(answersChannelRef.current);
        answersChannelRef.current = null;
      }
    };
  }, [quizId, supabase, user, userLoading, navigate]);

  const fetchPlayers = async (sessionId: string) => {
    try {
      const { data: playersData, error: playersError } = await supabase
        .from("players")
        .select("*")
        .eq("session_id", sessionId)
        .order("total_score", { ascending: false });

      if (playersError) throw playersError;
      setPlayers(playersData || []);
    } catch (err) {
      console.error("Error fetching players:", err);
    }
  };

  // Move player subscription setup to its own effect
  useEffect(() => {
    if (!session) return;

    // Clean up previous subscription
    if (playerSubscriptionRef.current) {
      supabase.removeChannel(playerSubscriptionRef.current);
      playerSubscriptionRef.current = null;
    }
    if (gameChannelRef.current) {
      supabase.removeChannel(gameChannelRef.current);
      gameChannelRef.current = null;
    }

    // Set up new channel for both broadcast and DB changes
    const gameChannel = supabase
      .channel(`game:${session.id}`)
      .on("broadcast", { event: "player_joined" }, (payload) => {
        const newPlayer = payload.payload.player;
        setPlayers((current) => {
          if (current.some((p) => p.id === newPlayer.id)) return current;
          return [...current, newPlayer];
        });
      })
      .on("broadcast", { event: "game_started" }, () => {
        /* no-op for host */
      })
      .on("broadcast", { event: "next_question" }, () => {
        /* no-op for host */
      })
      .on("broadcast", { event: "timer_update" }, () => {
        /* no-op for host */
      })
      .on("broadcast", { event: "player_answered" }, (payload) => {
        setAnswers((current) => {
          // Remove any previous answer from this player for this question
          const filtered = current.filter(
            (a) => a.player_id !== payload.payload.player_id
          );
          return [...filtered, payload.payload as PlayerAnswer];
        });
      })
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `session_id=eq.${session.id}`,
        },
        (payload) => {
          console.log("Player update received:", payload);
          if (payload.eventType === "INSERT") {
            setPlayers((current) => [...current, payload.new as Player]);
          } else if (payload.eventType === "UPDATE") {
            setPlayers((current) =>
              current.map((player) =>
                player.id === payload.new.id ? (payload.new as Player) : player
              )
            );
          } else if (payload.eventType === "DELETE") {
            setPlayers((current) =>
              current.filter((player) => player.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();
    gameChannelRef.current = gameChannel;

    // Clean up on unmount or when session changes
    return () => {
      if (playerSubscriptionRef.current) {
        supabase.removeChannel(playerSubscriptionRef.current);
        playerSubscriptionRef.current = null;
      }
      if (gameChannelRef.current) {
        supabase.removeChannel(gameChannelRef.current);
        gameChannelRef.current = null;
      }
    };
  }, [session, supabase]);

  const copyPinToClipboard = () => {
    if (session) {
      if (
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
        navigator.clipboard.writeText(session.pin);
        setCopiedPin(true);
        setTimeout(() => setCopiedPin(false), 2000);
      } else {
        // Fallback for browsers/environments without Clipboard API
        const textArea = document.createElement("textarea");
        textArea.value = session.pin;
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand("copy");
          setCopiedPin(true);
          setTimeout(() => setCopiedPin(false), 2000);
        } catch {
          alert("Failed to copy PIN. Please copy it manually.");
        }
        document.body.removeChild(textArea);
      }
    }
  };

  const startGame = async () => {
    if (!session) return;

    try {
      const { error } = await supabase
        .from("game_sessions")
        .update({ status: "active" })
        .eq("id", session.id);

      if (error) throw error;

      setGameStarted(true);
      if (quiz?.has_timer) {
        startTimer();
      }
      // Broadcast game started with first question and timer
      if (gameChannelRef.current) {
        await gameChannelRef.current.send({
          type: "broadcast",
          event: "game_started",
          payload: {
            question: questions[0],
            timeLeft: quiz?.question_timer_seconds || 20,
          },
        });
      }
    } catch (err: unknown) {
      console.error("Error starting game:", err);
      setError(err instanceof Error ? err.message : "Failed to start game");
    }
  };

  const showLeaderboardWithRefresh = async (afterLeaderboard?: () => void) => {
    if (!session) return;
    // Fetch latest players with updated scores
    const { data: freshPlayers, error } = await supabase
      .from("players")
      .select("*")
      .eq("session_id", session.id)
      .order("total_score", { ascending: false });
    if (!error && freshPlayers) {
      setPlayers(freshPlayers);
      // Broadcast the up-to-date leaderboard
      if (gameChannelRef.current) {
        await gameChannelRef.current.send({
          type: "broadcast",
          event: "reveal_answer",
          payload: {
            leaderboard: freshPlayers,
          },
        });
      }
    }
    // First show results
    setShowResults(true);
    setShowLeaderboard(false);
    setResultsCountdown(0);

    // Clear any existing timers
    if (resultsTimerRef.current) {
      clearInterval(resultsTimerRef.current);
      resultsTimerRef.current = null;
    }

    // Show leaderboard after 3 seconds
    const leaderboardTimer = setTimeout(() => {
      setShowLeaderboard(true);
      setResultsCountdown(5);

      // Start countdown timer
      resultsTimerRef.current = setInterval(() => {
        setResultsCountdown((c) => {
          if (c <= 1) {
            if (resultsTimerRef.current) {
              clearInterval(resultsTimerRef.current);
              resultsTimerRef.current = null;
            }
            setShowResults(false);
            setShowLeaderboard(false);
            if (afterLeaderboard) {
              // Execute the callback in the next tick to ensure state updates are processed
              setTimeout(afterLeaderboard, 0);
            }
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }, 3000);

    // Cleanup timer on unmount
    return () => {
      clearTimeout(leaderboardTimer);
      if (resultsTimerRef.current) {
        clearInterval(resultsTimerRef.current);
        resultsTimerRef.current = null;
      }
    };
  };

  const startTimer = async () => {
    if (!quiz?.has_timer) return;

    setTimeLeft(quiz.question_timer_seconds || 20);

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
          }
          // Broadcast timer update (0)
          if (gameChannelRef.current) {
            gameChannelRef.current.send({
              type: "broadcast",
              event: "timer_update",
              payload: { timeLeft: 0 },
            });
          }
          handleNextQuestion();
          return 0;
        }
        // Broadcast timer update
        if (gameChannelRef.current) {
          gameChannelRef.current.send({
            type: "broadcast",
            event: "timer_update",
            payload: { timeLeft: prev - 1 },
          });
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleNextQuestion = async () => {
    if (!session || !quiz) return;

    // Clear any existing timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // Check if this is the last question
    if (currentQuestionIndexRef.current < questions.length - 1) {
      // Calculate new index first
      const newIndex = currentQuestionIndexRef.current + 1;
      console.log("Question progression:", {
        currentIndex: currentQuestionIndexRef.current,
        newIndex: newIndex,
        totalQuestions: questions.length,
        localStorageValue: localStorage.getItem(`questionIndex_${quizId}`),
      });

      // Then show leaderboard
      await showLeaderboardWithRefresh(async () => {
        setCurrentQuestionIndex(newIndex);
        currentQuestionIndexRef.current = newIndex;
        localStorage.setItem(`questionIndex_${quizId}`, newIndex.toString());
        // Verify the index after leaderboard
        const currentStoredIndex = parseInt(
          localStorage.getItem(`questionIndex_${quizId}`) || "0",
          10
        );
        console.log("After leaderboard:", {
          currentStoredIndex,
          newIndex,
          currentQuestionIndex: currentQuestionIndexRef.current,
        });

        if (quiz.has_timer) {
          startTimer();
        }
        // Broadcast next question and timer
        if (gameChannelRef.current) {
          await gameChannelRef.current.send({
            type: "broadcast",
            event: "next_question",
            payload: {
              question: questions[newIndex],
              timeLeft: quiz?.question_timer_seconds || 20,
            },
          });
        }
      });
    } else {
      // Last question - end the game immediately
      try {
        const { error: sessionError } = await supabase
          .from("game_sessions")
          .update({ status: "completed" })
          .eq("id", session.id);
        if (sessionError) throw sessionError;
        const { error: quizError } = await supabase
          .from("quizzes")
          .update({ status: "completed" })
          .eq("id", quiz.id);
        if (quizError) throw quizError;
        if (gameChannelRef.current) {
          await gameChannelRef.current.send({
            type: "broadcast",
            event: "game_ended",
            payload: {
              leaderboard: players,
            },
          });
        }
        // Clear localStorage before navigating
        localStorage.removeItem(`questionIndex_${quizId}`);
        navigate(`/analytics/${quiz.id}`);
      } catch (err: unknown) {
        console.error("Error ending game:", err);
        setError(err instanceof Error ? err.message : "Failed to end game");
      }
    }
  };

  // Fetch answers for the current question (real-time)
  useEffect(() => {
    if (!session || !questions.length) return;
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    console.log(
      `Setting up answer channel for question ${
        currentQuestionIndex + 1
      } (ID: ${currentQuestion.id})`
    );

    // Function to fetch answers
    const fetchAnswers = async () => {
      console.log(
        `Fetching initial answers for question ${currentQuestion.id}`
      );
      const { data, error } = await supabase
        .from("player_answers")
        .select("*")
        .eq("question_id", currentQuestion.id);
      if (!error) {
        console.log(`Fetched ${data?.length || 0} initial answers`);
        setAnswers(data || []);
      } else {
        console.error("Error fetching answers:", error);
      }
    };

    // Set up a single persistent channel for all questions
    if (!answersChannelRef.current) {
      console.log("Setting up persistent answers channel");
      answersChannelRef.current = supabase
        .channel("game_answers")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "player_answers",
          },
          (payload) => {
            // Only process answers for the current question
            const answer = payload.new as PlayerAnswer;
            if (answer && answer.question_id === currentQuestion.id) {
              console.log("Answer update received:", payload);
              if (payload.eventType === "INSERT") {
                setAnswers((current) => {
                  const newAnswers = [...current, payload.new as PlayerAnswer];
                  console.log(`Updated answers count: ${newAnswers.length}`);
                  return newAnswers;
                });
              } else if (payload.eventType === "DELETE") {
                setAnswers((current) => {
                  const filteredAnswers = current.filter(
                    (a) => a.player_id !== payload.old.player_id
                  );
                  console.log(
                    `Updated answers count after delete: ${filteredAnswers.length}`
                  );
                  return filteredAnswers;
                });
              }
            }
          }
        )
        .subscribe((status) => {
          console.log("Answers channel subscription status:", status);
        });
    }

    // Fetch initial answers for the current question
    fetchAnswers();

    // Cleanup
    return () => {
      // Don't remove the channel here, let it persist
      // Just clear the answers for the current question
      setAnswers([]);
    };
  }, [session, currentQuestionIndex, questions, supabase]);

  // Clean up the persistent channel when the component unmounts
  useEffect(() => {
    return () => {
      if (answersChannelRef.current) {
        console.log("Cleaning up persistent answers channel");
        supabase.removeChannel(answersChannelRef.current);
        answersChannelRef.current = null;
      }
    };
  }, [supabase]);

  if (userLoading || loading) {
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
            onClick={() => navigate("/dashboard")}
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
          <h1 className="text-2xl font-bold text-gray-900">
            Session Not Found
          </h1>
          <p className="mt-2 text-gray-600">Unable to load the game session.</p>
          <button
            onClick={() => navigate("/dashboard")}
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
      {/* Waiting Room */}
      {!gameStarted && (
        <div className="mx-auto max-w-2xl">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900">
              Host: {quiz.title}
            </h1>

            <div className="mt-8 rounded-lg bg-gray-50 p-6 text-center">
              <h2 className="text-xl font-semibold text-gray-900">Game PIN</h2>
              <div className="mt-2 flex items-center justify-center space-x-2">
                <span className="text-4xl font-bold tracking-widest text-brand-blue">
                  {session.pin}
                </span>
                <button
                  onClick={copyPinToClipboard}
                  className="inline-flex items-center rounded-md bg-gray-100 p-2 text-gray-700 hover:bg-gray-200"
                >
                  <Copy className="h-5 w-5" />
                </button>
              </div>
              {copiedPin && (
                <span className="mt-2 text-sm text-green-600">
                  Copied to clipboard!
                </span>
              )}
              <p className="mt-4 text-sm text-gray-600">
                Players can join at{" "}
                <span className="font-medium">your-app.com/join</span> with this
                PIN
              </p>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Players ({players.length})
                </h3>
                <span className="text-sm text-gray-500">
                  {players.length > 0
                    ? "Waiting for more players..."
                    : "Waiting for players to join..."}
                </span>
              </div>

              {players.length === 0 ? (
                <div className="mt-4 flex h-32 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
                  <Users className="h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">No players yet</p>
                </div>
              ) : (
                <AnimatePresence>
                  <motion.ul 
                    className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4"
                    layout
                  >
                    {players.map((player) => (
                      <motion.li
                        key={player.id}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ 
                          type: "spring", 
                          stiffness: 300, 
                          damping: 30,
                          opacity: { duration: 0.2 }
                        }}
                        className="rounded-md bg-gray-100 p-2 text-center text-sm font-medium"
                      >
                        {player.nickname}
                      </motion.li>
                    ))}
                  </motion.ul>
                </AnimatePresence>
              )}
            </div>

            <div className="mt-8 flex justify-center">
              <button
                onClick={startGame}
                disabled={players.length === 0}
                className="inline-flex items-center rounded-md bg-brand-blue px-6 py-3 text-base font-medium text-white shadow-md transition-colors hover:bg-brand-blue/90 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Play className="mr-2 h-5 w-5" />
                Start Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Playing - Question View */}
      {gameStarted && !showResults && currentQuestion && (
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
            <div className="text-right">
              <div className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {questions.length}
              </div>
              <div className="text-sm text-gray-600">
                Players: {players.length}
              </div>
              <div className="text-sm text-gray-600">
                Answers: {answers.length} / {players.length}
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-6 shadow-sm">
            {/* Timer */}
            {quiz.has_timer && timeLeft !== null && (
              <div className="mb-4">
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full bg-brand-blue transition-all duration-1000"
                    style={{
                      width: `${
                        (timeLeft / (quiz.question_timer_seconds || 20)) * 100
                      }%`,
                    }}
                  />
                </div>
                <div className="mt-1 flex items-center justify-end space-x-1 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{timeLeft}s</span>
                </div>
              </div>
            )}

            {/* Current Question */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {currentQuestion.question_text}
              </h2>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {currentQuestion.options.map((option, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-gray-200 p-4"
                  >
                    <div className="flex items-center">
                      <span className="mr-3 flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-medium">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="text-sm font-medium">{option}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-end">
              <button
                onClick={handleNextQuestion}
                className="inline-flex items-center rounded-md bg-brand-blue px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-blue/90"
              >
                {currentQuestionIndex < questions.length - 1 ? (
                  <>
                    Next Question
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  "End Quiz"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard/Results View */}
      {gameStarted && showResults && (
        <div className="mx-auto max-w-3xl">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            {!showLeaderboard ? (
              <>
                <motion.h2 
                  className="text-2xl font-semibold mb-4"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  Results
                </motion.h2>
                {/* Display correct answer and explanation */}
                {currentQuestion && (
                  <motion.div 
                    className="mt-4 p-4 bg-blue-50 rounded-lg"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                  >
                    <h3 className="font-medium text-blue-800 mb-2">
                      Correct Answer
                    </h3>
                    <p className="text-blue-700">
                      {currentQuestion.correct_answer}
                    </p>
                    {currentQuestion.explanation && (
                      <>
                        <h3 className="font-medium text-blue-800 mt-2 mb-2">
                          Explanation
                        </h3>
                        <p className="text-blue-700">
                          {currentQuestion.explanation}
                        </p>
                      </>
                    )}
                  </motion.div>
                )}
              </>
            ) : (
              <>
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
                {players.length > 0 ? (
                  <AnimatePresence>
                    <motion.div 
                      className="space-y-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3, duration: 0.4 }}
                    >
                      {players.slice(0, 5).map((player, index) => (
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
                            index === 0
                              ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-lg transform scale-105"
                              : index === 1
                              ? "bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800"
                              : index === 2
                              ? "bg-gradient-to-r from-orange-300 to-orange-400 text-orange-800"
                              : "bg-gray-50 text-gray-800"
                          }`}
                          whileHover={{ 
                            scale: index === 0 ? 1.08 : 1.02,
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
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HostGame;