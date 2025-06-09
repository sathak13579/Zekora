import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useSupabase } from '../lib/supabase-provider';

const JoinGame = () => {
  const [gamePin, setGamePin] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { supabase } = useSupabase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!gamePin.trim()) {
      setError('Please enter a game PIN');
      return;
    }
    
    if (!nickname.trim()) {
      setError('Please enter a nickname');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Check if game session exists and is active
      const { data: session, error: sessionError } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('pin', String(gamePin))
      .maybeSingle();

      if (sessionError) {
        throw new Error('Unable to verify game PIN. Please try again.');
      }

      if (!session) {
        throw new Error('Game PIN not found or the game has ended. Please check the PIN and try again.');
      }

      // Check if nickname is already taken in this session
      const { data: existingPlayer, error: playerError } = await supabase
        .from('players')
        .select('*')
        .eq('session_id', session.id)
        .eq('nickname', nickname)
        .maybeSingle();

      if (playerError) {
        throw new Error('Unable to verify nickname availability. Please try again.');
      }

      if (existingPlayer) {
        throw new Error('This nickname is already taken in this game. Please choose another.');
      }

      // If all checks pass, navigate to the game
      navigate(`/play/${gamePin}?nickname=${encodeURIComponent(nickname)}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-blue">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-gray-900">Join a Quiz</h1>
          <p className="mt-2 text-gray-600">
            Enter the game PIN and your nickname to participate
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="gamePin" className="block text-sm font-medium text-gray-700">
                Game PIN
              </label>
              <input
                id="gamePin"
                name="gamePin"
                type="text"
                autoComplete="off"
                required
                value={gamePin}
                onChange={(e) => setGamePin(e.target.value)}
                maxLength={6}
                placeholder="Enter 6-digit PIN"
                className="mt-1 block w-full rounded-md border border-gray-300 px-4 py-3 text-center text-xl font-semibold tracking-widest shadow-sm focus:border-brand-blue focus:outline-none focus:ring-brand-blue"
              />
            </div>

            <div>
              <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">
                Your Nickname
              </label>
              <input
                id="nickname"
                name="nickname"
                type="text"
                autoComplete="off"
                required
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={15}
                placeholder="Choose a nickname"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-3 shadow-sm focus:border-brand-blue focus:outline-none focus:ring-brand-blue"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full justify-center rounded-md bg-brand-blue px-4 py-3 text-base font-medium text-white shadow-sm transition-colors hover:bg-brand-blue/90 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Joining...' : 'Join Game'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinGame;