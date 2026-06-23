// ── Strava Integration Service ──────────────────────────
// Handles OAuth flow, token management, and API calls

const STRAVA_CLIENT_ID = '260461';
const STRAVA_AUTH_URL = 'https://www.strava.com/oauth/authorize';
const STRAVA_API_BASE = 'https://www.strava.com/api/v3';
const EDGE_FUNCTION_URL = 'https://ildknnvlhpipzakiadys.supabase.co/functions/v1/strava-auth';
const STORAGE_KEY = 'fullbalance_strava';
const REDIRECT_URI = `${window.location.origin}/strava/callback`;

// ── Token Storage ───────────────────────────────────────
function getStoredTokens() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function storeTokens(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
    athlete: data.athlete || getStoredTokens()?.athlete,
  }));
}

function clearTokens() {
  localStorage.removeItem(STORAGE_KEY);
}

// ── OAuth Flow ──────────────────────────────────────────
export function startStravaAuth() {
  const params = new URLSearchParams({
    client_id: STRAVA_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    approval_prompt: 'auto',
    scope: 'read,activity:read_all',
  });
  window.location.href = `${STRAVA_AUTH_URL}?${params}`;
}

export async function handleStravaCallback(code) {
  const res = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'exchange', code }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Token exchange failed');
  }

  const data = await res.json();
  storeTokens(data);
  return data;
}

// ── Token Management ────────────────────────────────────
async function getValidToken() {
  const tokens = getStoredTokens();
  if (!tokens) throw new Error('Not connected to Strava');

  // Check if token is expired (with 5 min buffer)
  const now = Math.floor(Date.now() / 1000);
  if (tokens.expires_at && tokens.expires_at > now + 300) {
    return tokens.access_token;
  }

  // Refresh token
  const res = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'refresh', refresh_token: tokens.refresh_token }),
  });

  if (!res.ok) {
    clearTokens();
    throw new Error('Token refresh failed');
  }

  const data = await res.json();
  storeTokens(data);
  return data.access_token;
}

// ── API Calls ───────────────────────────────────────────
async function stravaFetch(endpoint, params = {}) {
  const token = await getValidToken();
  const url = new URL(`${STRAVA_API_BASE}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    if (res.status === 401) {
      clearTokens();
      throw new Error('Strava session expired');
    }
    throw new Error(`Strava API error: ${res.status}`);
  }

  return res.json();
}

// ── Public API ──────────────────────────────────────────
export function isStravaConnected() {
  return !!getStoredTokens();
}

export function getStravaAthlete() {
  return getStoredTokens()?.athlete || null;
}

export function disconnectStrava() {
  clearTokens();
}

export async function getStravaActivities(page = 1, perPage = 10) {
  return stravaFetch('/athlete/activities', {
    page: String(page),
    per_page: String(perPage),
  });
}

export async function getStravaStats() {
  const athlete = getStravaAthlete();
  if (!athlete?.id) throw new Error('No athlete data');
  return stravaFetch(`/athletes/${athlete.id}/stats`);
}

export async function getStravaActivity(id) {
  return stravaFetch(`/activities/${id}`);
}

// ── Activity Type Mapper ────────────────────────────────
export function getActivityEmoji(type) {
  const map = {
    Run: '🏃', Ride: '🚴', Swim: '🏊', Walk: '🚶',
    Hike: '🥾', Yoga: '🧘', WeightTraining: '🏋️',
    Workout: '💪', CrossFit: '🔥', Elliptical: '🏃',
    Rowing: '🚣', Soccer: '⚽', Basketball: '🏀',
    Tennis: '🎾', Skiing: '⛷️', Snowboard: '🏂',
    IceSkate: '⛸️', Climbing: '🧗',
  };
  return map[type] || '🏃';
}

export function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}s ${m}dk`;
  return `${m}dk`;
}

export function formatDistance(meters) {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}
