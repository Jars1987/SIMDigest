import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// Support both anon key (legacy) and publishable key (new)
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  '';

if (!supabaseUrl || !supabaseKey) {
  console.error('\u274c CRITICAL: Supabase not configured!');
  console.error('\u274c The application requires a database to function.');
  console.error('\u274c Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment.');
  console.error('\u274c Users will see error messages until this is fixed.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseKey);
};
