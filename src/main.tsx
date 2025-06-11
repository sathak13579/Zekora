import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.tsx';
import './index.css';
import { SupabaseProvider } from './lib/supabase-provider.tsx';

createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
      <SupabaseProvider>
        <App />
        <Toaster position="top-right" />
      </SupabaseProvider>
    </BrowserRouter>
);