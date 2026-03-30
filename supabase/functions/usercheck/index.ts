// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('USERCHECK_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'UserCheck API key is not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch(`https://api.usercheck.com/email/${encodeURIComponent(email)}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload) {
      return new Response(JSON.stringify({ error: payload?.error ?? 'Unable to validate email' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        disposable: Boolean(payload.disposable),
        did_you_mean: payload.did_you_mean ?? null,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (_error) {
    return new Response(JSON.stringify({ error: 'Unable to validate email' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
