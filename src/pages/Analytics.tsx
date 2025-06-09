import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSupabase } from '../lib/supabase-provider';
import { ArrowLeft, Download, BarChart, Clock, Users, CheckCircle, XCircle } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// Types
type QuizData = {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
};

type SessionData = {
  id: string;
  created_at: string;
  player_count: number;
};

type QuestionData = {
  id: string;
  question_text: string;
  correct_count: number;
  incorrect_count: number;
  avg_response_time: number;
};

type PlayerData = {
  id: string;
  nickname: string;
  total_score: number;
  correct_count: number;
  incorrect_count: number;
  avg_response_time: number;
};

const Analytics = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const { supabase, user, loading: userLoading } = useSupabase();
  const navigate = useNavigate();
  
  // State
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [session, setSession] = useState<SessionData | null>(null);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load analytics data
  useEffect(() => {
    const loadAnalyticsData = async () => {
      if (!quizId || !user || userLoading) return;
      
      try {
        // Fetch quiz data
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', quizId)
          .eq('user_id', user.id)
          .single();
          
        if (quizError) throw quizError;
        
        setQuiz(quizData);
        
        // Fetch latest session
        const { data: sessionData, error: sessionError } = await supabase
          .from('game_sessions')
          .select('*')
          .eq('quiz_id', quizId)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
          
        if (sessionError) throw sessionError;
        
        // Get player count
        const { count: playerCount } = await supabase
          .from('players')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', sessionData.id);
        
        setSession({
          id: sessionData.id,
          created_at: sessionData.created_at,
          player_count: playerCount || 0
        });
        
        // Fetch questions with analytics
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select(`
            id,
            question_text,
            player_answers (
              is_correct,
              response_time_ms
            )
          `)
          .eq('quiz_id', quizId);
          
        if (questionsError) throw questionsError;
        
        // Process question analytics
        const processedQuestions = questionsData.map(q => {
          const answers = q.player_answers || [];
          const correct = answers.filter((a: any) => a.is_correct).length;
          const incorrect = answers.length - correct;
          const avgTime = answers.length > 0
            ? answers.reduce((sum: number, a: any) => sum + a.response_time_ms, 0) / answers.length / 1000
            : 0;
            
          return {
            id: q.id,
            question_text: q.question_text,
            correct_count: correct,
            incorrect_count: incorrect,
            avg_response_time: avgTime
          };
        });
        
        setQuestions(processedQuestions);
        
        // Fetch player data
        const { data: playersData, error: playersError } = await supabase
          .from('players')
          .select(`
            id,
            nickname,
            total_score,
            player_answers (
              is_correct,
              response_time_ms
            )
          `)
          .eq('session_id', sessionData.id)
          .order('total_score', { ascending: false });
          
        if (playersError) throw playersError;
        
        // Process player analytics
        const processedPlayers = playersData.map(p => {
          const answers = p.player_answers || [];
          const correct = answers.filter((a: any) => a.is_correct).length;
          const incorrect = answers.length - correct;
          const avgTime = answers.length > 0
            ? answers.reduce((sum: number, a: any) => sum + a.response_time_ms, 0) / answers.length / 1000
            : 0;
            
          return {
            id: p.id,
            nickname: p.nickname,
            total_score: p.total_score,
            correct_count: correct,
            incorrect_count: incorrect,
            avg_response_time: avgTime
          };
        });
        
        setPlayers(processedPlayers);
        
      } catch (err: any) {
        console.error('Error loading analytics:', err);
        setError(err.message || 'Failed to load analytics data');
      } finally {
        setDataLoading(false);
      }
    };
    
    loadAnalyticsData();
  }, [supabase, user, quizId, userLoading]);

  // Calculate overall stats
  const totalPlayers = session?.player_count || 0;
  const totalQuestions = questions.length;
  const overallAccuracy = questions.length > 0
    ? Math.round(
        (questions.reduce((sum, q) => sum + q.correct_count, 0) / 
        (questions.reduce((sum, q) => sum + q.correct_count + q.incorrect_count, 0))) * 100
      )
    : 0;
  const avgResponseTime = questions.length > 0
    ? (questions.reduce((sum, q) => sum + q.avg_response_time, 0) / questions.length).toFixed(1)
    : '0.0';

  // Export data to CSV
  const exportToCsv = () => {
    // Generate CSV content
    const headers = ['Player', 'Score', 'Correct Answers', 'Incorrect Answers', 'Avg Response Time (s)'];
    
    const rows = players.map(player => [
      player.nickname,
      player.total_score,
      player.correct_count,
      player.incorrect_count,
      player.avg_response_time
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${quiz?.title || 'quiz'}_results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF
  const exportToPdf = () => {
    // In a real implementation, this would generate a PDF
    alert('PDF export functionality would be implemented here');
  };

  if (userLoading || dataLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Error</h1>
          <p className="mt-2 text-gray-600">
            {error || 'Analytics data not found or you do not have permission to access it.'}
          </p>
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-4 inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Dashboard
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900">{quiz.title}</h1>
        {quiz.description && (
          <p className="mt-1 text-gray-600">{quiz.description}</p>
        )}
        
        <div className="mt-2 text-sm text-gray-500">
          Session date: {new Date(session?.created_at || '').toLocaleDateString()}
        </div>
      </div>

      {/* Export Buttons */}
      <div className="mb-8 flex space-x-4">
        <button
          onClick={exportToCsv}
          className="inline-flex items-center rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </button>
        <button
          onClick={exportToPdf}
          className="inline-flex items-center rounded-md bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue/90"
        >
          <Download className="mr-2 h-4 w-4" />
          Export PDF Report
        </button>
      </div>

      {/* Overall Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-brand-blue">
              <Users className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Participants</h3>
              <p className="text-2xl font-semibold text-gray-900">{totalPlayers}</p>
            </div>
          </div>
        </div>
        
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
              <BarChart className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Questions</h3>
              <p className="text-2xl font-semibold text-gray-900">{totalQuestions}</p>
            </div>
          </div>
        </div>
        
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Accuracy</h3>
              <p className="text-2xl font-semibold text-gray-900">{overallAccuracy}%</p>
            </div>
          </div>
        </div>
        
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <Clock className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Avg. Response Time</h3>
              <p className="text-2xl font-semibold text-gray-900">{avgResponseTime}s</p>
            </div>
          </div>
        </div>
      </div>

      {/* Question Performance */}
      <h2 className="mb-4 text-xl font-semibold text-gray-900">Question Performance</h2>
      <div className="mb-8 overflow-hidden rounded-lg border bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Question
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                Accuracy
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                Avg. Time
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                Correct/Incorrect
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {questions.map((question, index) => {
              const totalAnswers = question.correct_count + question.incorrect_count;
              const accuracy = totalAnswers > 0 
                ? Math.round((question.correct_count / totalAnswers) * 100)
                : null;
              
              return (
                <tr key={question.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <span className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {question.question_text}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className={`h-full ${
                            accuracy === null ? 'bg-gray-300' :
                            accuracy >= 70 
                              ? 'bg-green-500' 
                              : accuracy >= 40 
                                ? 'bg-yellow-500' 
                                : 'bg-red-500'
                          }`}
                          style={{ width: `${accuracy || 0}%` }}
                        />
                      </div>
                      <span className="ml-2 text-sm font-medium text-gray-900">
                        {accuracy === null ? '--' : `${accuracy}%`}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-900">
                    {totalAnswers > 0 ? `${question.avg_response_time.toFixed(1)}s` : '--'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center space-x-2 text-sm">
                      <span className="flex items-center text-green-600">
                        <CheckCircle className="mr-1 h-4 w-4" />
                        {question.correct_count}
                      </span>
                      <span className="text-gray-300">/</span>
                      <span className="flex items-center text-red-600">
                        <XCircle className="mr-1 h-4 w-4" />
                        {question.incorrect_count}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Player Performance */}
      <h2 className="mb-4 text-xl font-semibold text-gray-900">Player Performance</h2>
      <div className="overflow-hidden rounded-lg border bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Rank
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Player
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Score
              </th>
              <th scope="col" className="hidden px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 md:table-cell">
                Correct
              </th>
              <th scope="col" className="hidden px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 md:table-cell">
                Incorrect
              </th>
              <th scope="col" className="hidden px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 md:table-cell">
                Avg. Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {players.map((player, index) => (
              <tr 
                key={player.id}
                className={index === 0 ? 'bg-yellow-50' : ''}
              >
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                  {index + 1}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  {player.nickname}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-gray-900">
                  {player.total_score}
                </td>
                <td className="hidden whitespace-nowrap px-6 py-4 text-center text-sm text-green-600 md:table-cell">
                  {player.correct_count}
                </td>
                <td className="hidden whitespace-nowrap px-6 py-4 text-center text-sm text-red-600 md:table-cell">
                  {player.incorrect_count}
                </td>
                <td className="hidden whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900 md:table-cell">
                  {player.avg_response_time.toFixed(1)}s
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Analytics;