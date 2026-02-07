import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase project credentials
// In a real Vite project, these would be import.meta.env.VITE_SUPABASE_URL
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://lkyydtjtlotxwkwbprds.supabase.co';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxreXlkdGp0bG90eHdrd2JwcmRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMTI0NTMsImV4cCI6MjA4Mzg4ODQ1M30.XUxQpZr3cE10y-JqHnMu17gAv21kBVYkV41vp_L_Hyk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);