import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, LogOut, Zap } from 'lucide-react';
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
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link 
          to="/" 
          className="flex items-center space-x-2 group"
          onClick={() => setIsMenuOpen(false)}
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br from-primary to-accent electric-glow">
            <Zap className="h-6 w-6 text-black" />
            <div className="absolute -right-1 -top-1">
              <div className="h-3 w-3 animate-spark rounded-full bg-yellow-300" />
            </div>
          </div>
          <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
            Zekora!
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex md:items-center md:space-x-6">
          <Link to="/" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Home
          </Link>
          {user ? (
            <>
              <Link to="/dashboard" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Dashboard
              </Link>
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-1 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                >
                  <span>Account</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-card border border-border py-1 shadow-lg ring-1 ring-black ring-opacity-5">
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center px-4 py-2 text-sm text-foreground hover:bg-secondary"
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
                className="rounded-md border border-primary bg-transparent px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
              >
                Log in
              </Link>
              <Link 
                to="/register" 
                className="rounded-md bg-gradient-to-r from-primary to-accent px-4 py-2 text-sm font-medium text-black transition-colors hover:opacity-90 electric-glow"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden text-foreground"
        >
          {isMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      <div
        className={cn(
          "absolute inset-x-0 top-16 z-50 bg-card border-b border-border md:hidden",
          isMenuOpen ? "block" : "hidden"
        )}
      >
        <div className="container mx-auto space-y-4 px-4 py-4">
          <Link 
            to="/" 
            className="block py-2 text-base font-medium text-foreground hover:text-primary"
            onClick={() => setIsMenuOpen(false)}
          >
            Home
          </Link>
          {user ? (
            <>
              <Link 
                to="/dashboard" 
                className="block py-2 text-base font-medium text-foreground hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center py-2 text-base font-medium text-foreground hover:text-primary"
              >
                <LogOut className="mr-2 h-5 w-5" />
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className="block py-2 text-base font-medium text-foreground hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                Log in
              </Link>
              <Link 
                to="/register" 
                className="block py-2 text-base font-medium text-foreground hover:text-primary"
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