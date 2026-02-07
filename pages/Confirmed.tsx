import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { DEFAULT_CATEGORIES, DEFAULT_EXPENDITURE_CATEGORIES, DEFAULT_MOODS, DEFAULT_HIGHLIGHT_CATEGORIES } from '../constants';

const Confirmed: React.FC = () => {
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('Verifying your account...');
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const finalize = async () => {
      try {
        // Get session/user
        const { data } = await supabase.auth.getSession();
        const session = data.session as any | null;
        const user = session?.user;

        if (!user) {
          // Not signed in — the user likely clicked the confirmation link that doesn't create a session automatically
          setMessage('Your email appears confirmed. Please sign in to continue.');
          return;
        }

        // Try to fetch existing user_data
        const { data: row, error: fetchErr } = await supabase
          .from('user_data')
          .select('content')
          .eq('user_id', user.id)
          .single();

        let name = (user as any)?.user_metadata?.username || user.email;

        if (fetchErr || !row) {
          // Initialize user data if missing
          const initialData = {
            logs: {},
            highlights: [],
            categories: DEFAULT_CATEGORIES,
            expenditureCategories: DEFAULT_EXPENDITURE_CATEGORIES,
            highlightCategories: DEFAULT_HIGHLIGHT_CATEGORIES,
            moods: DEFAULT_MOODS,
            preferences: {
              customTheme: {
                mode: 'custom',
                backgroundColor: '#09090b',
                textColor: '#e4e4e7',
                cardColor: '#18181b',
                accentColor: '#cfbaf0'
              }
            },
            displayName: name
          };

          const { error: insertErr } = await supabase
            .from('user_data')
            .insert([{ user_id: user.id, content: initialData }]);

          if (insertErr) console.error('Failed to create user_data after confirmation', insertErr);
        } else {
          name = row.content?.displayName || name;
        }

        if (mounted) {
          setDisplayName(name);
          setMessage('Welcome back — email confirmed!');
        }
      } catch (err) {
        console.error(err);
        setMessage('An error occurred while confirming your account.');
      }
    };

    finalize();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg p-6">
      <div className="w-full max-w-lg bg-dark-card p-10 rounded-3xl border border-white/5 shadow-2xl text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Email Confirmed</h1>
        <p className="text-gray-400 mb-6">{message}</p>
        {displayName && <p className="text-xl font-medium text-white mb-4">Welcome, <span className="text-pastel-purple">{displayName}</span> ✨</p>}
        <div className="flex gap-4 justify-center">
          <button onClick={() => navigate('/')} className="px-6 py-3 rounded-xl bg-theme-accent text-black font-bold">Go to Dashboard</button>
          <button onClick={() => navigate('/tracker')} className="px-6 py-3 rounded-xl border border-white/10 text-white">Open Tracker</button>
        </div>
      </div>
    </div>
  );
};

export default Confirmed;