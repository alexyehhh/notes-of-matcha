import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
  });

  useEffect(() => {
    // Get initial session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState({
        user: session?.user ?? null,
        session,
        isLoading: false,
      });
    });

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthState({
        user: session?.user ?? null,
        session,
        isLoading: false,
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string, username: string) => {
    // Check username is not already taken
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (existing) {
      return { data: null, error: new Error('Username is already taken') };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/?verified=1`,
      },
    });
    if (error || !data.user) {
      if (error?.message?.toLowerCase().includes('already registered')) {
        return { data: null, error: new Error('This email is already used by another user. Try logging in instead.') };
      }
      return { data, error };
    }

    // Set session so the update runs as authenticated user
    if (data.session) {
      await supabase.auth.setSession(data.session);
    }
    // Wait briefly for trigger to create profile row
    await new Promise(resolve => setTimeout(resolve, 500));
    await supabase
      .from('profiles')
      .update({ name, username, email })
      .eq('id', data.user.id);

    // Ensure user is not logged in until they verify email
    if (data.session) {
      await supabase.auth.signOut();
    }

    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  };

  const signInWithUsername = async (username: string, password: string) => {
    // Look up email from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', username)
      .maybeSingle();

    if (profileError || !profile?.email) {
      return { data: null, error: new Error('Incorrect username or password') };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email: profile.email, password });
    if (error) return { data: null, error: new Error('Incorrect username or password') };
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const requestPasswordReset = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { data, error };
  };

  return {
    user: authState.user,
    session: authState.session,
    isLoading: authState.isLoading,
    signUp,
    signIn,
    signInWithUsername,
    signOut,
    requestPasswordReset,
  };
}
