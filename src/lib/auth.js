import { supabase } from './supabase';

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    let errorMessage = error.message;
    
    if (error.status === 400) {
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Please verify your email address before logging in.';
      } else {
        errorMessage = 'Login failed. Please check your email and password.';
      }
    } else if (error.status === 500) {
      errorMessage = 'Server error. Please try again later.';
    }
    
    const friendlyError = new Error(errorMessage);
    friendlyError.originalError = error;
    throw friendlyError;
  }
  
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) return null;

  return {
    id: user.id,
    email: user.email,
    role: profile.role,
    full_name: profile.full_name,
    phone: profile.phone,
  };
}

