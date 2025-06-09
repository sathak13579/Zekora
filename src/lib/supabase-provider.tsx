import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { createClient, SupabaseClient, User, RealtimeChannel } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

type SupabaseContext = {
  supabase: SupabaseClient<Database>;
  user: User | null;
  loading: boolean;
  subscribeToChannel: (channelName: string, callback: (payload: any) => void) => RealtimeChannel;
  unsubscribeFromChannel: (channel: RealtimeChannel) => void;
};

const SupabaseContext = createContext<SupabaseContext | undefined>(undefined);

export const SupabaseProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Memoize the Supabase client
  const supabase = useMemo(() => 
    createClient<Database>(supabaseUrl, supabaseAnonKey),
    []
  );

  useEffect(() => {
    let mounted = true;

    // Initialize auth state
    const initialize = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (mounted) {
          // It's valid to have no user (unauthenticated state)
          setUser(currentUser);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error checking authentication state:', error);
        if (mounted) {
          // On error, set user to null but don't throw
          setUser(null);
          setLoading(false);
        }
      }
    };

    initialize();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Helper functions for Realtime subscriptions
  const subscribeToChannel = useCallback((channelName: string, callback: (payload: any) => void) => {
    const channel = supabase.channel(channelName);
    
    channel
      .on('broadcast', { event: 'game_update' }, callback)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Successfully subscribed to channel: ${channelName}`);
        }
        if (status === 'CHANNEL_ERROR') {
          console.error(`Error subscribing to channel: ${channelName}`);
        }
      });
    
    return channel;
  }, [supabase]);

  const unsubscribeFromChannel = useCallback((channel: RealtimeChannel) => {
    supabase.removeChannel(channel);
  }, [supabase]);

  const value = {
    supabase,
    user,
    loading,
    subscribeToChannel,
    unsubscribeFromChannel,
  };

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>;
};

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};