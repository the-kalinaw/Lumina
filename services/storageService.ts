import { UserData } from '../types';
import { supabase } from '../supabaseClient';
import { DEFAULT_CATEGORIES, DEFAULT_EXPENDITURE_CATEGORIES, DEFAULT_MOODS, DEFAULT_HIGHLIGHT_CATEGORIES } from '../constants';

// --- Auth Services ---

export const registerUser = async (email: string, username: string, password: string): Promise<{ success: boolean; message?: string; needsConfirmation?: boolean }> => {
  // Try to include username in user metadata during sign-up and request an email confirmation redirect
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  }, {
    data: { username },
    // Redirect to a dedicated confirmation page after the user clicks the link
    emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/confirmed` : undefined
  });

  if (error) {
    return { success: false, message: error.message };
  }

  // Initialize empty data row for new user
  if (data.user) {
    const initialData: UserData & { displayName?: string } = {
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
      displayName: username
    };
    
    // Create the row in the 'user_data' table
    // Table schema assumed: user_id (uuid, PK), content (jsonb)
    const { error: dbError } = await supabase
      .from('user_data')
      .insert([
        { user_id: data.user.id, content: initialData }
      ]);
      
    if (dbError) {
      console.error("Failed to initialize user data", dbError);
      // We don't fail registration here, but data init might need retry
    }
  }

  // If a session was not returned, Supabase requires email confirmation
  const needsConfirmation = !data.session;

  return { success: true, needsConfirmation };
};

// Resend the signup confirmation email. Uses Supabase auth `resend` method when available.
export const resendConfirmation = async (email: string): Promise<{ success: boolean; message?: string }> => {
  try {
    // Some supabase client versions expose `auth.resend` — types may not include it, so call dynamically
    // @ts-ignore
    const { error } = await (supabase.auth as any).resend({ type: 'signup', email, emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/confirmed` : undefined });
    if (error) return { success: false, message: error.message };
    return { success: true };
  } catch (err) {
    console.error('Resend confirmation failed', err);
    return { success: false, message: 'Failed to resend confirmation email' };
  }
};

export const loginUser = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true };
};

export const logoutUser = async () => {
  await supabase.auth.signOut();
};

// --- Data Services ---

export const fetchUserData = async (userId: string): Promise<UserData> => {
  // Fetch from Supabase 'user_data' table
  const { data, error } = await supabase
    .from('user_data')
    .select('content')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error("Error fetching user data:", error);
    // Return default structure if not found or error
    return { 
      logs: {}, 
      highlights: [], 
      categories: DEFAULT_CATEGORIES,
      expenditureCategories: DEFAULT_EXPENDITURE_CATEGORIES,
      highlightCategories: DEFAULT_HIGHLIGHT_CATEGORIES,
      moods: DEFAULT_MOODS
    };
  }

  const userData = data?.content || {};

  // Migrations / Defaults ensure structure is valid
  if (!userData.categories || userData.categories.length === 0) userData.categories = DEFAULT_CATEGORIES;
  if (!userData.expenditureCategories || userData.expenditureCategories.length === 0) userData.expenditureCategories = DEFAULT_EXPENDITURE_CATEGORIES;
  if (!userData.highlightCategories || userData.highlightCategories.length === 0) userData.highlightCategories = DEFAULT_HIGHLIGHT_CATEGORIES;
  if (!userData.moods || userData.moods.length === 0) userData.moods = DEFAULT_MOODS;
  if (!userData.logs) userData.logs = {};
  if (!userData.highlights) userData.highlights = [];

  if (!userData.preferences?.customTheme) {
     userData.preferences = {
         ...userData.preferences,
         customTheme: {
             mode: 'custom',
             backgroundColor: '#09090b',
             textColor: '#e4e4e7',
             cardColor: '#18181b',
             accentColor: '#cfbaf0'
         }
     }
  }

  return userData;
};

export const saveUserDataAsync = async (userId: string, data: UserData): Promise<boolean> => {
  if (!userId) return false;

  // Fail-safe: check if online before attempting to save
  if (!navigator.onLine) {
    console.error("Cannot save data: device is offline");
    return false;
  }

  const maxRetries = 3;
  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const { error } = await supabase
        .from('user_data')
        .upsert({ user_id: userId, content: data, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });

      if (error) {
        lastError = error;
        // Retry on network/transient errors, but not on auth errors
        if (error.code === 'PGRST301' || error.message?.includes('Failed to fetch')) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        console.error("Failed to save data to Supabase:", error);
        return false;
      }
      console.log("✓ Data saved successfully to Supabase");
      return true; // Success
    } catch (err) {
      lastError = err;
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  console.error("Failed to save data after retries:", lastError);
  return false;
};

export const getSession = (): string | null => {
  // We can just rely on Supabase session in the App component, 
  // but for initial state before auth listener fires, we might return null
  return null;
};

export const setSession = (username: string | null) => {
  // Legacy support or local caching if needed, primarily handled by Supabase SDK now
};