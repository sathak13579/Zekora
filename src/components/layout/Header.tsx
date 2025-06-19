import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, LogOut, Sparkles } from 'lucide-react';
import { useSupabase } from '../../lib/supabase-provider';
import { User } from '@supabase/supabase-js';
import { cn } from '../../lib/utils';

type HeaderProps = {
  user: User | null;
};

const Header = ({ user }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { supabase } = useSupabase();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link 
          to="/" 
          className="flex items-center space-x-2"
          onClick={() => setIsMenuOpen(false)}
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-purple-600">
            <Sparkles className="h-6 w-6 text-white" />
            <div className="absolute -right-1 -top-1">
              <div className="h-3 w-3 animate-spark rounded-full bg-yellow-300" />
            </div>
          </div>
          <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">
            Zekora!
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex md:items-center md:space-x-6">
          <Link to="/" className="text-sm font-medium text-gray-700 hover:text-indigo-600">
            Home
          </Link>
          {user ? (
            <>
              <Link to="/dashboard" className="text-sm font-medium text-gray-700 hover:text-indigo-600">
                Dashboard
              </Link>
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-1 rounded-full bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-600"
                >
                  <span>Account</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className="rounded-md border border-indigo-600 bg-white px-4 py-2 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
              >
                Log in
              </Link>
              <Link 
                to="/register" 
                className="rounded-md bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden"
        >
          {isMenuOpen ? (
            <X className="h-6 w-6 text-gray-600" />
          ) : (
            <Menu className="h-6 w-6 text-gray-600" />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      <div
        className={cn(
          "absolute inset-x-0 top-16 z-50 bg-white md:hidden",
          isMenuOpen ? "block" : "hidden"
        )}
      >
        <div className="container mx-auto space-y-4 px-4 py-4">
          <Link 
            to="/" 
            className="block py-2 text-base font-medium text-gray-900 hover:text-indigo-600"
            onClick={() => setIsMenuOpen(false)}
          >
            Home
          </Link>
          {user ? (
            <>
              <Link 
                to="/dashboard" 
                className="block py-2 text-base font-medium text-gray-900 hover:text-indigo-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center py-2 text-base font-medium text-gray-900 hover:text-indigo-600"
              >
                <LogOut className="mr-2 h-5 w-5" />
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className="block py-2 text-base font-medium text-gray-900 hover:text-indigo-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Log in
              </Link>
              <Link 
                to="/register" 
                className="block py-2 text-base font-medium text-gray-900 hover:text-indigo-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;