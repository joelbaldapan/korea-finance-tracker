import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from './lib/supabase';
import { AuthScreen } from './components/AuthScreen';
import { DashboardSummary } from './components/DashboardSummary';
import { TransactionFeed } from './components/TransactionFeed';
import { ThemeToggle } from './components/ThemeToggle';
import { TrashScreen } from './components/TrashScreen';
import { GmailImportModal } from './components/GmailImportModal';
import { AddTransactionModal } from './components/AddTransactionModal';
import { SettingsModal } from './components/SettingsModal';
import { LogOut, Trash2, Mail, Plus, Settings } from 'lucide-react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './App.css';

const queryClient = new QueryClient();
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy-client-id';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="app-loading-screen">Loading...</div>;
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route 
              path="/login" 
              element={session ? <Navigate to="/" replace /> : <AuthScreen />} 
            />
            <Route 
              path="/" 
              element={session ? <DashboardLayout /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/trash" 
              element={session ? <TrashScreen /> : <Navigate to="/login" replace />} 
            />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}

function DashboardLayout() {
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState<Set<number>>(new Set());

  const handleSignOut = () => {
      supabase.auth.signOut();
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const toggleMonth = (idx: number) => {
      const next = new Set(selectedMonths);
      if (next.has(idx)) {
          next.delete(idx);
      } else {
          next.add(idx);
      }
      setSelectedMonths(next);
  };

  return (
    <div className="dashboard-layout">
        <header className="dashboard-header">
            <h1 className="dashboard-logo">KFT</h1>
            <div className="dashboard-header-actions">
                <ThemeToggle />
                <button 
                    onClick={() => setIsManualOpen(true)}
                    className="dashboard-header-btn"
                    aria-label="Add Manual Transaction"
                >
                    <Plus className="w-6 h-6" />
                </button>
                <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className="dashboard-header-btn"
                    aria-label="Settings"
                >
                    <Settings className="w-6 h-6" />
                </button>
                <button 
                    onClick={() => setIsImportOpen(true)}
                    className="dashboard-header-btn"
                    aria-label="Import Gmail"
                >
                    <Mail className="w-6 h-6" />
                </button>
                <Link 
                    to="/trash"
                    className="dashboard-header-btn"
                    aria-label="Trash"
                >
                    <Trash2 className="w-6 h-6" />
                </Link>
                <button 
                    onClick={handleSignOut}
                    className="dashboard-header-btn"
                    aria-label="Sign out"
                >
                    <LogOut className="w-6 h-6" />
                </button>
            </div>
        </header>

        <main className="dashboard-main">
            <div className="month-filter-container" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '24px' }}>
                {months.map((m, idx) => (
                    <label key={m} className={`cursor-pointer px-3 py-1 border-2 border-black font-bold uppercase text-xs transition-colors ${selectedMonths.has(idx) ? 'bg-yellow-400 text-black' : 'bg-transparent text-gray-400 dark:border-white'}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input 
                            type="checkbox" 
                            checked={selectedMonths.has(idx)}
                            onChange={() => toggleMonth(idx)}
                            style={{ display: 'none' }}
                        />
                        {m}
                    </label>
                ))}
            </div>
            
            <DashboardSummary selectedMonths={selectedMonths} />
            <TransactionFeed selectedMonths={selectedMonths} />
        </main>
        
        <GmailImportModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
        <AddTransactionModal isOpen={isManualOpen} onClose={() => setIsManualOpen(false)} />
        {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
    </div>
  );
}

export default App;
