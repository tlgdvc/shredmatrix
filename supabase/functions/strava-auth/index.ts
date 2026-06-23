// Supabase Edge Function: Strava OAuth Token Exchange
// Handles: authorization code → tokens, and token refresh
// Deploy: npx supabase functions deploy strava-auth

const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
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
    const { action, code, refresh_token } = await req.json();

    // Get secrets from environment
    const clientId = Deno.env.get('STRAVA_CLIENT_ID');
    const clientSecret = Deno.env.get('STRAVA_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: 'Strava credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let body: Record<string, string>;

    if (action === 'exchange') {
      // Exchange authorization code for tokens
      if (!code) {
        return new Response(
          JSON.stringify({ error: 'Authorization code required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      body = {
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
      };
    } else if (action === 'refresh') {
      // Refresh expired access token
      if (!refresh_token) {
        return new Response(
          JSON.stringify({ error: 'Refresh token required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      body = {
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refresh_token,
        grant_type: 'refresh_token',
      };
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use "exchange" or "refresh"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Strava API
    const stravaRes = await fetch(STRAVA_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(body),
    });

    const data = await stravaRes.json();

    if (!stravaRes.ok) {
      return new Response(
        JSON.stringify({ error: data.message || 'Strava API error', details: data }),
        { status: stravaRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return tokens (access_token, refresh_token, expires_at, athlete)
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
