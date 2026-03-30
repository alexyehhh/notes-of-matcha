import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { checkDisposableEmail } from '../lib/usercheck';
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

    const validation = await checkDisposableEmail(email);
    if (validation.disposable) {
      const suggestion = validation.did_you_mean
        ? ` Did you mean ${validation.did_you_mean}?`
        : '';
      return { data: null, error: new Error(`Please use a valid email address.${suggestion}`) };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/?verified=1`,
        data: {
          name,
          username,
        },
      },
    });
    if (error || !data.user) {
      if (error?.message?.toLowerCase().includes('already registered')) {
        return { data: null, error: new Error('This email is already used by another user. Try logging in instead.') };
      }
      return { data, error };
    }

    // Track pending verification so we can show the right login message
    if (data.user) {
      await supabase
        .from('pending_users')
        .upsert({
          user_id: data.user.id,
          email,
          username,
        }, { onConflict: 'user_id' });
    }

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
      const { data: pending } = await supabase
        .from('pending_users')
        .select('created_at')
        .eq('username', username)
        .maybeSingle();

      if (pending?.created_at) {
        const createdAt = new Date(pending.created_at).getTime();
        const expiresAt = createdAt + 60 * 60 * 1000;
        if (Date.now() < expiresAt) {
          return { data: null, error: new Error('Account not verified. Please check your inbox for verification.') };
        }
        return { data: null, error: new Error('Verification expired. Please sign up again.') };
      }

      return { data: null, error: new Error('Incorrect username or password') };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email: profile.email, password });
    if (error) {
      if (error.message?.toLowerCase().includes('email not confirmed')) {
        return { data: null, error: new Error('Account not verified. Please check your inbox for verification.') };
      }
      return { data: null, error: new Error('Incorrect username or password') };
    }
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
