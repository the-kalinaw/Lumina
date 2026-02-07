import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { fetchUserData, saveUserDataAsync, logoutUser, getSession } from './services/storageService';
import { AppState, DayLog, Highlight, UserData, Category, MoodConfig, HighlightCategory, UserPreferences, Task } from './types';
import { supabase } from './supabaseClient';
import Dashboard from './pages/Dashboard';
import Tracker from './pages/Tracker';
import Database from './pages/Database';
import Calendar from './pages/Calendar';
import Highlights from './pages/Highlights';
import Settings from './pages/Settings';
import Statistics from './pages/Statistics';
import Login from './pages/Login';
import Confirmed from './pages/Confirmed';
import { Home, Calendar as CalendarIcon, Database as DatabaseIcon, Star, Menu, X, Clock, LogOut, Settings as SettingsIcon, Loader2, PieChart } from 'lucide-react';
import { DEFAULT_CATEGORIES, DEFAULT_EXPENDITURE_CATEGORIES, DEFAULT_MOODS, DEFAULT_HIGHLIGHT_CATEGORIES } from './constants';
import { addDays, format } from 'date-fns';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userData, setUserData] = useState<UserData>({ 
    logs: {}, 
    highlights: [], 
    categories: DEFAULT_CATEGORIES,
    expenditureCategories: DEFAULT_EXPENDITURE_CATEGORIES,
    highlightCategories: DEFAULT_HIGHLIGHT_CATEGORIES,
    moods: DEFAULT_MOODS
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Connection monitoring
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'unstable'>('online');
  const [connectionStableTime, setConnectionStableTime] = useState<number>(0); // Timestamp when connection became stable
  const connectionTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [hasInitialLoadSucceeded, setHasInitialLoadSucceeded] = useState<boolean>(false);


  /* =========================================================================================
     AUTHENTICATION & DATA PERSISTENCE LAYER
     -----------------------------------------------------------------------------------------
     The following useEffect hooks handle authentication and data persistence.
     Currently using Supabase for auth with fallback to local storage. Update these hooks
     if migrating between backend systems.
     ========================================================================================= */

  // Auth Listener
  useEffect(() => {
    type SupabaseSession = { user: { email?: string; id: string; user_metadata?: { username?: string } } } | null;

    // Check active session
    supabase.auth.getSession().then(({ data }: { data: { session: SupabaseSession } }) => {
      const session = data.session;
      if (session) {
        const displayName = (session.user as any)?.user_metadata?.username || session.user.email || 'User';
        setCurrentUser(displayName);
        setCurrentUserId(session.user.id);
      }
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: SupabaseSession) => {
      if (session) {
        const displayName = (session.user as any)?.user_metadata?.username || session.user.email || 'User';
        setCurrentUser(displayName);
        setCurrentUserId(session.user.id);
      } else {
        setCurrentUser(null);
        setCurrentUserId(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Connection Status Monitoring
  useEffect(() => {
    const handleOnline = () => {
      setConnectionStatus('online');
      // Start 5-second stability timer
      if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = setTimeout(() => {
        setConnectionStableTime(Date.now());
      }, 5000); // 5 seconds of uninterrupted connection
    };

    const handleOffline = () => {
      setConnectionStatus('offline');
      setConnectionStableTime(0); // Reset stability
      if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
    };

    // Check initial connection status
    if (navigator.onLine) {
      setConnectionStatus('online');
      connectionTimeoutRef.current = setTimeout(() => {
        setConnectionStableTime(Date.now());
      }, 5000);
    } else {
      setConnectionStatus('offline');
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
    };
  }, []);

  // Helper: Check if connection is stable enough for saving
  const isConnectionStable = (): boolean => {
    return connectionStatus === 'online' && connectionStableTime > 0;
  };

  // Apply Theme & Text Color
  useEffect(() => {
    const root = document.documentElement;
    const theme = userData.preferences?.customTheme;
    
    if (theme) {
      root.style.setProperty('--bg-primary', theme.backgroundColor);
      root.style.setProperty('--text-primary', theme.textColor);
      root.style.setProperty('--card-bg', theme.cardColor);
      root.style.setProperty('--accent-color', theme.accentColor);
      
      if (theme.backgroundImage) {
        document.body.style.backgroundImage = `url(${theme.backgroundImage})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundAttachment = 'fixed';
      } else {
        document.body.style.backgroundImage = 'none';
      }

      // Inject dynamic styles for text color classes
      const styleId = 'dynamic-theme-styles';
      let styleTag = document.getElementById(styleId);
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = styleId;
        document.head.appendChild(styleTag);
      }
      styleTag.innerHTML = `
        body, .text-gray-200, .text-white, .text-gray-300, .text-gray-400, .text-gray-500 {
          color: ${theme.textColor} !important;
        }
        .text-black {
          color: #000000 !important;
        }
        .text-pastel-pink { color: #ffcfd2 !important; }
        .text-pastel-purple { color: #cfbaf0 !important; }
        .text-pastel-blue { color: #a3c4f3 !important; }
        .text-pastel-mint { color: #8eecf5 !important; }
        .text-pastel-green { color: #98f5e1 !important; }
        .text-pastel-yellow { color: #fbf8cc !important; }
        .text-red-400 { color: #f87171 !important; }
      `;
    }
  }, [userData.preferences?.customTheme]);

  // Data Loading & Task Rollover Logic
  useEffect(() => {
    const loadData = async () => {
      if (currentUserId) {
        setIsLoading(true);
        setHasInitialLoadSucceeded(false);
        try {
          const data = await fetchUserData(currentUserId);
          
          // --- TASK ROLLOVER LOGIC ---
          // Checks all previous days' incomplete tasks and moves them to today
          const todayStr = format(new Date(), 'yyyy-MM-dd');
          const todayLog = data.logs[todayStr] || {
            date: todayStr,
            hours: {},
            expenses: [],
            moods: [],
            journalEntries: [],
            tasks: []
          };
          
          const existingTaskIds = new Set(todayLog.tasks?.map(t => t.id) || []);
          let tasksToAddToday: Task[] = [];
          
          // Iterate through all logged dates and collect incomplete unscheduled tasks
          Object.entries(data.logs).forEach(([dateStr, log]) => {
            // Skip today and future dates
            if (dateStr >= todayStr) return;
            
            if (log.tasks && log.tasks.length > 0) {
              const incompleteUnscheduled = log.tasks.filter(
                t => !t.completed && (!t.time || t.time === '')
              );
              
              incompleteUnscheduled.forEach(task => {
                // Only add if not already in today's tasks
                if (!existingTaskIds.has(task.id)) {
                  tasksToAddToday.push(task);
                  existingTaskIds.add(task.id);
                }
                
                // Remove from the previous day's log
                const dateLog = data.logs[dateStr];
                if (dateLog) {
                  dateLog.tasks = dateLog.tasks.filter(t => t.id !== task.id);
                }
              });
            }
          });
          
          // Add all collected tasks to today and save if any were moved
          if (tasksToAddToday.length > 0) {
            const updatedTodayLog = {
              ...todayLog,
              tasks: [...(todayLog.tasks || []), ...tasksToAddToday]
            };
            data.logs[todayStr] = updatedTodayLog;
            saveUserDataAsync(currentUserId, data);
          }
          // --- END ROLLOVER LOGIC ---

          setUserData(data);

          setHasInitialLoadSucceeded(true);

          if ((data as any).displayName) setCurrentUser((data as any).displayName);
        } catch (error) {
          console.error("Failed to load user data", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        // Reset to default if logged out
        setUserData({ 
          logs: {}, 
          highlights: [], 
          categories: DEFAULT_CATEGORIES,
          expenditureCategories: DEFAULT_EXPENDITURE_CATEGORIES,
          highlightCategories: DEFAULT_HIGHLIGHT_CATEGORIES,
          moods: DEFAULT_MOODS
        });
      }
    };
    if (currentUserId) loadData();
  }, [currentUserId]);

  // Debounced Auto-save with validation
  useEffect(() => {
    if (!currentUserId || isLoading || !hasInitialLoadSucceeded) return;
    
    // Don't save if connection is not stable (hasn't been 5+ seconds of uninterrupted connection)
    if (connectionStableTime === 0) {
      console.warn("Connection not yet stable, skipping auto-save");
      return;
    }
    
    const timeoutId = setTimeout(async () => {
      const success = await saveUserDataAsync(currentUserId, userData);
      if (!success) {
        console.error("Auto-save failed. Data will be retried on next change.");
        setConnectionStatus('unstable');
        setConnectionStableTime(0); // Reset stability timer
        // Restart stability timer
        if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = setTimeout(() => {
          if (navigator.onLine) {
            setConnectionStatus('online');
            setConnectionStableTime(Date.now());
          }
        }, 5000);
      }
    }, 2000); // Wait 2 seconds of inactivity before saving

    return () => clearTimeout(timeoutId);
  }, [userData, currentUserId, isLoading, connectionStableTime]);

  const handleLogin = (username: string) => {
    // handled by auth listener, but kept for interface compatibility if needed
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setCurrentUserId(null);
  };

  // State Update Helpers
  const updateLog = (date: string, log: DayLog) => {
    setUserData(prev => ({
      ...prev,
      logs: { ...prev.logs, [date]: log }
    }));
  };

  const updateCategories = (categories: Category[]) => {
    setUserData(prev => ({ ...prev, categories }));
  };

  const updateExpenditureCategories = (expenditureCategories: Category[]) => {
    setUserData(prev => ({ ...prev, expenditureCategories }));
  };

  const updateHighlightCategories = (highlightCategories: HighlightCategory[]) => {
    setUserData(prev => ({ ...prev, highlightCategories }));
  };

  const updateMoods = (moods: MoodConfig[]) => {
    setUserData(prev => ({ ...prev, moods }));
  };

  const updatePreferences = (preferences: UserPreferences) => {
    setUserData(prev => ({ ...prev, preferences: { ...prev.preferences, ...preferences } }));
  };

  const addHighlight = (h: Highlight) => {
    setUserData(prev => ({ ...prev, highlights: [h, ...prev.highlights] }));
  };

  const removeHighlight = (id: string) => {
    setUserData(prev => ({ ...prev, highlights: prev.highlights.filter(h => h.id !== id) }));
  };

  const updateHighlight = (h: Highlight) => {
    setUserData(prev => ({ 
      ...prev, 
      highlights: prev.highlights.map(existing => existing.id === h.id ? h : existing) 
    }));
  };

  const addHighlightCategory = (c: HighlightCategory) => {
    setUserData(prev => ({ ...prev, highlightCategories: [...prev.highlightCategories, c] }));
  };

  const importUserData = (data: UserData) => {
    if (data && typeof data === 'object' && 'logs' in data) {
      setUserData(prev => ({ ...prev, ...data }));
    } else {
      alert("Invalid data format. Please upload a valid Lumina backup file.");
    }
  };

  const appState: AppState = {
    ...userData,
    currentUser
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-pulse">
           <div className="w-12 h-12 rounded-full bg-pastel-purple flex items-center justify-center shadow-[0_0_30px_rgba(207,186,240,0.6)]">
             <Loader2 className="animate-spin text-black" size={24} />
           </div>
           <p className="text-gray-500 text-xs font-black uppercase tracking-widest">Loading...</p>
           
           {/* Connection Status Indicator */}
           <div className="mt-4 flex flex-col items-center gap-2">
             <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${
               connectionStatus === 'online' && connectionStableTime > 0 
                 ? 'text-green-400' 
                 : connectionStatus === 'offline'
                 ? 'text-red-400'
                 : 'text-yellow-400'
             }`}>
               <div className={`w-2 h-2 rounded-full ${
                 connectionStatus === 'online' && connectionStableTime > 0
                   ? 'bg-green-400 animate-pulse'
                   : connectionStatus === 'offline'
                   ? 'bg-red-400'
                   : 'bg-yellow-400 animate-pulse'
               }`}></div>
               {connectionStatus === 'offline' && 'Offline - Retrying...'}
               {connectionStatus === 'online' && connectionStableTime === 0 && 'Connecting... (stabilizing)'}
               {connectionStatus === 'online' && connectionStableTime > 0 && 'Connected'}
             </div>
             {connectionStatus === 'offline' && (
               <p className="text-gray-500 text-[10px]">Check your internet connection</p>
             )}
             {connectionStatus === 'online' && connectionStableTime === 0 && (
               <p className="text-gray-500 text-[10px]">Verifying connection stability...</p>
             )}
           </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-transparent font-sans selection:bg-theme-accent selection:text-black transition-colors duration-500 text-[var(--text-primary)]">
        
        {/* Mobile Header */}
        <div className="md:hidden flex justify-between items-center px-6 py-4 sticky top-0 bg-dark-bg/80 backdrop-blur-md z-40 border-b border-white/5">
          <div className="text-xl font-bold tracking-tight flex items-center gap-2">
             <div className="w-3 h-3 rounded-full bg-theme-accent shadow-[0_0_10px_rgba(207,186,240,0.5)]"></div>
             Lumina
          </div>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="opacity-70 hover:opacity-100">
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-dark-card/30 backdrop-blur-3xl border-r border-white/5 p-8 transform transition-transform duration-500 ease-in-out
          ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
        `}>
          <div className="mb-10">
            <h1 className="text-2xl font-bold tracking-tighter flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-theme-accent shadow-[0_0_15px_rgba(207,186,240,0.5)]"></span>
              Lumina
            </h1>
            <p className="text-[9px] opacity-60 mt-2 font-black uppercase tracking-[0.3em] truncate">{currentUser}</p>
          </div>

          <div className="space-y-2">
            <NavLink to="/" icon={<Home size={18} />} label="Overview" onClick={() => setIsMenuOpen(false)} />
            <NavLink to="/tracker" icon={<Clock size={18} />} label="Tracker" onClick={() => setIsMenuOpen(false)} />
            <NavLink to="/calendar" icon={<CalendarIcon size={18} />} label="Calendar" onClick={() => setIsMenuOpen(false)} />
            <NavLink to="/stats" icon={<PieChart size={18} />} label="Statistics" onClick={() => setIsMenuOpen(false)} />
            <NavLink to="/database" icon={<DatabaseIcon size={18} />} label="Archives" onClick={() => setIsMenuOpen(false)} />
            <NavLink to="/highlights" icon={<Star size={18} />} label="Memories" onClick={() => setIsMenuOpen(false)} />
            <NavLink to="/settings" icon={<SettingsIcon size={18} />} label="Settings" onClick={() => setIsMenuOpen(false)} />
          </div>

          <div className="absolute bottom-8 left-8 right-8">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest opacity-60 hover:opacity-100 transition-colors border border-white/5 rounded-xl hover:bg-white/5"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <main className="md:ml-64 p-6 md:p-12 transition-all duration-500">
          <Routes>
            <Route path="/" element={<DashboardWrapper state={appState} />} />
            <Route path="/tracker" element={<Tracker 
              state={appState} 
              updateLog={updateLog} 
              updateCategories={updateCategories}
              updateExpenditureCategories={updateExpenditureCategories}
              updateMoods={updateMoods}
            />} />
            <Route path="/calendar" element={<Calendar state={appState} />} />
            <Route path="/stats" element={<Statistics state={appState} />} />
            <Route path="/database" element={<Database state={appState} onNavigate={(date) => {}} />} />
            <Route path="/highlights" element={<Highlights state={appState} addHighlight={addHighlight} removeHighlight={removeHighlight} editHighlight={updateHighlight} updateHighlightCategories={updateHighlightCategories} />} />
            <Route path="/settings" element={<Settings 
              state={appState} 
              updateCategories={updateCategories} 
              updateExpenditureCategories={updateExpenditureCategories}
              updateHighlightCategories={updateHighlightCategories}
              updateMoods={updateMoods}
              updatePreferences={updatePreferences}
              importUserData={importUserData}
            />} />
            <Route path="/confirmed" element={<Confirmed />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

const DashboardWrapper = ({state}: {state: AppState}) => {
    const navigate = useNavigate();
    const handleNavigate = (path: string) => {
        navigate(`/${path}`);
    };
    return <Dashboard state={state} onNavigate={handleNavigate} />;
}

const NavLink = ({ to, icon, label, onClick }: { to: string, icon: React.ReactNode, label: string, onClick: () => void }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className={`
        flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group
        ${isActive ? 'bg-white/10 opacity-100 shadow-md translate-x-1' : 'opacity-60 hover:bg-white/5 hover:opacity-100 hover:translate-x-1'}
      `}
    >
      <span className={`transition-colors duration-300 ${isActive ? 'text-theme-accent shadow-theme-accent/20 shadow-sm' : 'group-hover:text-theme-accent'}`}>
        {icon}
      </span>
      <span className="font-medium tracking-tight text-sm">{label}</span>
    </Link>
  );
};

export default App;