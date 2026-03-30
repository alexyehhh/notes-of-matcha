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
    let message = error.message || 'Unable to validate email. Please try again.';
    const contextBody = (error as { context?: { body?: string } })?.context?.body;
    if (typeof contextBody === 'string') {
      try {
        const parsed = JSON.parse(contextBody) as { error?: string };
        if (parsed?.error) message = parsed.error;
      } catch {
        // Ignore JSON parse failures and keep the default message.
      }
    }
    if ((data as { error?: string } | null)?.error) {
      message = (data as { error?: string }).error || message;
    }
    throw new Error(message);
  }

  if (!data || typeof data.disposable !== 'boolean') {
    throw new Error('Unable to validate email. Please try again.');
  }

  return {
    disposable: data.disposable,
    did_you_mean: data.did_you_mean ?? null,
  };
}
