import { createClient } from '@supabase/supabase-js';

// Helper function to safely get and validate environment variables
const getEnvVar = (key, fallback = null) => {
  const value = process.env[key];
  // Treat empty strings and whitespace-only strings as missing
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return fallback;
  }
  return value.trim();
};

// Get environment variables with fallbacks (fallbacks are for development only)
// Use the same Supabase instance as the main app
const supabaseUrl = getEnvVar('REACT_APP_SUPABASE_URL', 'https://boksbamofmufhlgealif.supabase.co');
const supabaseAnonKey = getEnvVar('REACT_APP_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJva3NiYW1vZm11ZmhsZ2VhbGlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MzU1OTgsImV4cCI6MjA4NTUxMTU5OH0.GFMJ9VmwjzYvDd93VxECOmDDpVp_lkq5xisAsdIPbV4');

// Debug: Log environment variables (development only)
if (process.env.NODE_ENV === 'development') {
  const urlFromEnv = getEnvVar('REACT_APP_SUPABASE_URL');
  const keyFromEnv = getEnvVar('REACT_APP_SUPABASE_ANON_KEY');
  console.log('Admin App - Supabase URL:', urlFromEnv ? 'Set from env' : 'Using fallback');
  console.log('Admin App - Supabase Key:', keyFromEnv ? 'Set from env' : 'Using fallback');
}

let supabase;

try {
  // Validate that we have valid values
  if (!supabaseUrl || !supabaseAnonKey) {
    const urlFromEnv = process.env.REACT_APP_SUPABASE_URL;
    const keyFromEnv = process.env.REACT_APP_SUPABASE_ANON_KEY;
    const urlIsValid = urlFromEnv && typeof urlFromEnv === 'string' && urlFromEnv.trim() !== '';
    const keyIsValid = keyFromEnv && typeof keyFromEnv === 'string' && keyFromEnv.trim() !== '';
    
    console.error('Supabase configuration error:', {
      REACT_APP_SUPABASE_URL: urlIsValid ? 'Set' : (urlFromEnv ? 'Empty/invalid' : 'Missing'),
      REACT_APP_SUPABASE_ANON_KEY: keyIsValid ? 'Set (hidden)' : (keyFromEnv ? 'Empty/invalid' : 'Missing'),
      usingFallback: !urlIsValid || !keyIsValid
    });
    
    // In production, fail hard if env vars are missing
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Missing required Supabase environment variables. Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.');
    }
    
    // In development, warn but continue with fallbacks
    console.warn('⚠️ Using fallback Supabase credentials. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in .env file.');
  }

  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
} catch (error) {
  console.error('Failed to initialize Supabase:', error);
  throw error; // Admin app should fail if Supabase is not configured
}

export { supabase };

