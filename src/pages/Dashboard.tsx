import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSupabase } from '../lib/supabase-provider';
import { Plus, Clock, CheckCircle, Edit, Play, BarChart3, Copy, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

type Quiz = {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  status: 'draft' | 'ready' | 'completed';
};

const Dashboard = () => {
  const { supabase, user } = useSupabase();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search and pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchQuizzes = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('quizzes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        setQuizzes(data || []);
      } catch (err: any) {
        console.error('Error fetching quizzes:', err);
        setError(err.message || 'Failed to load quizzes');
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuizzes();
  }, [supabase, user]);

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Update total pages when filtered items change
  useEffect(() => {
    const filtered = filteredQuizzes();
    setTotalPages(Math.max(1, Math.ceil(filtered.length / itemsPerPage)));
  }, [quizzes, searchQuery, itemsPerPage]);

  const handleCloneQuiz = async (quiz: Quiz) => {
    if (!user) return;

    try {
      // First clone the quiz
      const { data: newQuiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          title: `CLONE - ${quiz.title}`,
          description: quiz.description,
          user_id: user.id,
          status: 'draft',
          player_limit: 50
        })
        .select()
        .single();

      if (quizError) throw quizError;

      // Get questions from original quiz
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', quiz.id);

      if (questionsError) throw questionsError;

      // Clone questions for new quiz
      if (questions && questions.length > 0) {
        // Defensive: Remove any questions for the new quiz before inserting
        await supabase
          .from('questions')
          .delete()
          .eq('quiz_id', newQuiz.id);

        const newQuestions = questions.map((q, idx) => ({
          quiz_id: newQuiz.id,
          question_text: q.question_text,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          order: idx // ensure order is sequential for the new quiz
        }));

        const { error: insertError } = await supabase
          .from('questions')
          .insert(newQuestions);

        if (insertError) throw insertError;
      }

      // Update local state
      setQuizzes(prev => [newQuiz, ...prev]);
      toast.success('Quiz cloned successfully!');
    } catch (err: any) {
      console.error('Error cloning quiz:', err);
      toast.error('Failed to clone quiz');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Edit className="h-5 w-5 text-gray-500" />;
      case 'ready':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'completed':
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'ready':
        return 'Ready to Host';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Filter quizzes based on search query
  const filteredQuizzes = () => {
    if (!searchQuery.trim()) return quizzes;
    
    return quizzes.filter(quiz => 
      quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (quiz.description && quiz.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  // Get current page items
  const getCurrentPageItems = () => {
    const filtered = filteredQuizzes();
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  };

  // Pagination handlers
  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handleChangeItemsPerPage = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const currentItems = getCurrentPageItems();
  const totalItems = filteredQuizzes().length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col justify-between sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Quizzes</h1>
          <p className="mt-1 text-gray-600">
            Create, manage, and host interactive quizzes
          </p>
        </div>
        <Link
          to="/create"
          className="mt-4 inline-flex items-center rounded-md bg-brand-blue px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-blue/90 sm:mt-0"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create New Quiz
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-500">
          {error}
        </div>
      )}

      {quizzes.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <Plus className="h-6 w-6 text-gray-600" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No quizzes yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new quiz
          </p>
          <div className="mt-6">
            <Link
              to="/create"
              className="inline-flex items-center rounded-md bg-brand-blue px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-blue/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Quiz
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Search and filter controls */}
          <div className="mb-4 flex flex-col items-center justify-between space-y-3 sm:flex-row sm:space-y-0">
            <div className="relative w-full sm:max-w-xs">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search quizzes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
              />
            </div>
            <div className="flex items-center space-x-4">
              <label htmlFor="itemsPerPage" className="text-sm font-medium text-gray-700">
                Show:
              </label>
              <select
                id="itemsPerPage"
                value={itemsPerPage}
                onChange={handleChangeItemsPerPage}
                className="block rounded-md border border-gray-300 bg-white py-1.5 pl-3 pr-10 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="mt-2 overflow-hidden rounded-lg border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Quiz Title
                  </th>
                  <th scope="col" className="hidden px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 md:table-cell">
                    Created
                  </th>
                  <th scope="col" className="hidden px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:table-cell">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                      No quizzes found matching your search.
                    </td>
                  </tr>
                ) : (
                  currentItems.map((quiz) => (
                    <tr key={quiz.id} className="group hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">
                            {quiz.title}
                          </div>
                        </div>
                      </td>
                      <td className="hidden whitespace-nowrap px-6 py-4 text-sm text-gray-500 md:table-cell">
                        {formatDate(quiz.created_at)}
                      </td>
                      <td className="hidden whitespace-nowrap px-6 py-4 sm:table-cell">
                        <div className="flex items-center">
                          {getStatusIcon(quiz.status)}
                          <span className="ml-1.5 text-sm text-gray-700">
                            {getStatusText(quiz.status)}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                        <div className="flex justify-end space-x-2">
                          {quiz.status === 'ready' && (
                            <Link
                              to={`/host/${quiz.id}`}
                              className="inline-flex items-center rounded-md bg-green-100 px-2.5 py-1.5 text-sm font-medium text-green-800 hover:bg-green-200"
                            >
                              <Play className="mr-1 h-4 w-4" />
                              Host
                            </Link>
                          )}
                          {quiz.status === 'completed' && (
                            <Link
                              to={`/analytics/${quiz.id}`}
                              className="inline-flex items-center rounded-md bg-blue-100 px-2.5 py-1.5 text-sm font-medium text-blue-800 hover:bg-blue-200"
                            >
                              <BarChart3 className="mr-1 h-4 w-4" />
                              Analytics
                            </Link>
                          )}
                          <button
                            onClick={() => handleCloneQuiz(quiz)}
                            className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
                          >
                            <Copy className="mr-1 h-4 w-4" />
                            Clone
                          </button>
                          <Link
                            to={`/create?edit=${quiz.id}`}
                            className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
                          >
                            <Edit className="mr-1 h-4 w-4" />
                            Edit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination controls */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-700">
              <span className="hidden sm:inline">Showing </span>
              <span className="font-medium">{totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span>
              <span className="mx-1">to</span>
              <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span>
              <span className="mx-1">of</span>
              <span className="font-medium">{totalItems}</span>
              <span className="hidden sm:inline"> entries</span>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="ml-1 hidden sm:inline">Previous</span>
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    pageNum > 0 && pageNum <= totalPages && (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-md ${
                          currentPage === pageNum
                            ? 'bg-brand-blue text-white'
                            : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  );
                })}
              </div>
              
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="mr-1 hidden sm:inline">Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;