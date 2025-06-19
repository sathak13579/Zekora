import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { useSupabase } from '../../lib/supabase-provider';
import { useLocation } from 'react-router-dom';

const Layout = () => {
  const { user } = useSupabase();
  const location = useLocation();
  
  // Check if we're on the play game page to hide header and footer
  const isPlayPage = location.pathname.includes('/play/');
  
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {!isPlayPage && <Header user={user} />}
      <main className="flex-1">
        <Outlet />
      </main>
      {!isPlayPage && <Footer />}
    </div>
  );
};

export default Layout;