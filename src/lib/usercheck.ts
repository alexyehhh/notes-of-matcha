import { supabase } from './supabase';

export interface UserCheckResult {
  disposable: boolean;
  did_you_mean: string | null;
}

export async function checkDisposableEmail(email: string): Promise<UserCheckResult> {
  const { data, error } = await supabase.functions.invoke('usercheck', {
    body: { email },
  });

  if (error) {
    throw new Error(error.message || 'Unable to validate email. Please try again.');
  }

  if (!data || typeof data.disposable !== 'boolean') {
    throw new Error('Unable to validate email. Please try again.');
  }

  return {
    disposable: data.disposable,
    did_you_mean: data.did_you_mean ?? null,
  };
}
