import { supabase, isSupabaseReady } from './supabase';

// ══════════════════════════════════════════════
// Full Balance — Data Service Layer
// Hybrid: Supabase (primary) + localStorage (fallback)
// ══════════════════════════════════════════════

// ── Helpers ──────────────────────────────────

function lsGet(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch { return fallback; }
}

function lsSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
}

function lsRemove(key) {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}

function getUserId() {
  if (!isSupabaseReady()) return null;
  // Supabase stores session, we can read it synchronously from localStorage cache
  try {
    const sessionStr = localStorage.getItem('sb-' + import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0] + '-auth-token');
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      return session?.user?.id || null;
    }
  } catch { /* ignore */ }
  return null;
}

// ══════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════

export async function signUp(email, password, name) {
  if (!isSupabaseReady()) {
    throw new Error('Authentication service unavailable. Please try again later.');
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) throw error;
  return { user: data.user, session: data.session };
}

export async function signIn(email, password) {
  if (!isSupabaseReady()) {
    throw new Error('Authentication service unavailable. Please try again later.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return { user: data.user, session: data.session };
}

export async function resetPassword(email) {
  if (!isSupabaseReady()) {
    throw new Error('Authentication service unavailable. Please try again later.');
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
  if (error) throw error;
}

export async function signOut() {
  if (isSupabaseReady()) {
    await supabase.auth.signOut();
  }
  lsRemove('shredmatrix_session');
}

export async function signInWithGoogle() {
  if (!isSupabaseReady()) {
    throw new Error('Authentication service unavailable. Please try again later.');
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth`,
    },
  });
  if (error) throw error;
}

export async function getSession() {
  if (!isSupabaseReady()) return null;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  return {
    user: {
      id: session.user.id,
      name: session.user.user_metadata?.name || 'User',
      email: session.user.email,
    },
    session,
  };
}

export function onAuthStateChange(callback) {
  if (!isSupabaseReady()) return { unsubscribe: () => {} };

  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    // Only react to actual sign-in/sign-out events, not token refreshes or initial session
    if (event === 'SIGNED_IN' && session) {
      callback('SIGNED_IN', {
        id: session.user.id,
        name: session.user.user_metadata?.name || 'User',
        email: session.user.email,
      });
    } else if (event === 'SIGNED_OUT') {
      callback('SIGNED_OUT', null);
    }
    // Ignore: INITIAL_SESSION, TOKEN_REFRESHED, USER_UPDATED, PASSWORD_RECOVERY
  });

  return subscription;
}

// ══════════════════════════════════════════════
// PLAN
// ══════════════════════════════════════════════

export async function savePlan(planData, email) {
  const userId = getUserId();

  if (!isSupabaseReady() || !userId) {
    lsSet(`shredmatrix_plan_${email}`, planData);
    lsSet('shredmatrix_plan_created', new Date().toISOString());
    return;
  }

  try {
    const { error } = await supabase
      .from('plans')
      .upsert({ user_id: userId, plan_data: planData }, { onConflict: 'user_id' });
    if (error) throw error;

    // Update profile
    await supabase.from('profiles').update({
      plan_created_at: new Date().toISOString(),
    }).eq('id', userId);
  } catch {
    // Fallback to localStorage
    lsSet(`shredmatrix_plan_${email}`, planData);
    lsSet('shredmatrix_plan_created', new Date().toISOString());
  }
}

export async function loadPlan(email) {
  const userId = getUserId();

  if (!isSupabaseReady() || !userId) {
    return lsGet(`shredmatrix_plan_${email}`);
  }

  try {
    const { data, error } = await supabase
      .from('plans')
      .select('plan_data')
      .eq('user_id', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data?.plan_data || lsGet(`shredmatrix_plan_${email}`) || null;
  } catch {
    return lsGet(`shredmatrix_plan_${email}`) || null;
  }
}

// ══════════════════════════════════════════════
// WORKOUT LOG
// ══════════════════════════════════════════════

export async function saveWorkoutLog(log) {
  const userId = getUserId();

  if (!isSupabaseReady() || !userId) {
    const logs = lsGet('shredmatrix_workout_log', []);
    logs.push(log);
    lsSet('shredmatrix_workout_log', logs);
    return;
  }

  try {
    const { error } = await supabase
      .from('workout_logs')
      .insert({ user_id: userId, date: log.date, day_focus: log.focus || log.day_focus, exercises: log.exercises, notes: log.notes });
    if (error) throw error;
  } catch {
    const logs = lsGet('shredmatrix_workout_log', []);
    logs.push(log);
    lsSet('shredmatrix_workout_log', logs);
  }
}

export async function getWorkoutLogs() {
  const userId = getUserId();

  if (!isSupabaseReady() || !userId) {
    return lsGet('shredmatrix_workout_log', []);
  }

  try {
    const { data, error } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch {
    return lsGet('shredmatrix_workout_log', []);
  }
}

// ══════════════════════════════════════════════
// PROGRESS (Weight + Body Fat)
// ══════════════════════════════════════════════

export async function saveProgress(entry) {
  const userId = getUserId();

  if (!isSupabaseReady() || !userId) {
    const entries = lsGet('shredmatrix_progress', []);
    entries.push(entry);
    lsSet('shredmatrix_progress', entries);
    return;
  }

  try {
    const { error } = await supabase
      .from('progress_entries')
      .insert({ user_id: userId, date: entry.date, weight: entry.weight, body_fat: entry.bodyFat || entry.body_fat });
    if (error) throw error;
  } catch {
    const entries = lsGet('shredmatrix_progress', []);
    entries.push(entry);
    lsSet('shredmatrix_progress', entries);
  }
}

export async function getProgress() {
  const userId = getUserId();

  if (!isSupabaseReady() || !userId) {
    return lsGet('shredmatrix_progress', []);
  }

  try {
    const { data, error } = await supabase
      .from('progress_entries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch {
    return lsGet('shredmatrix_progress', []);
  }
}

export async function deleteProgress(dateToDelete) {
  const userId = getUserId();

  if (!isSupabaseReady() || !userId) {
    const entries = lsGet('shredmatrix_progress', []);
    lsSet('shredmatrix_progress', entries.filter(e => e.date !== dateToDelete));
    return;
  }

  try {
    const { error } = await supabase
      .from('progress_entries')
      .delete()
      .eq('user_id', userId)
      .eq('date', dateToDelete);
    if (error) throw error;
  } catch {
    const entries = lsGet('shredmatrix_progress', []);
    lsSet('shredmatrix_progress', entries.filter(e => e.date !== dateToDelete));
  }
}

// ══════════════════════════════════════════════
// MEASUREMENTS
// ══════════════════════════════════════════════

export async function saveMeasurement(entry) {
  const userId = getUserId();

  if (!isSupabaseReady() || !userId) {
    const entries = lsGet('shredmatrix_measurements', []);
    entries.push(entry);
    lsSet('shredmatrix_measurements', entries);
    return;
  }

  try {
    const { error } = await supabase
      .from('measurements')
      .insert({ user_id: userId, ...entry });
    if (error) throw error;
  } catch {
    const entries = lsGet('shredmatrix_measurements', []);
    entries.push(entry);
    lsSet('shredmatrix_measurements', entries);
  }
}

export async function getMeasurements() {
  const userId = getUserId();

  if (!isSupabaseReady() || !userId) {
    return lsGet('shredmatrix_measurements', []);
  }

  try {
    const { data, error } = await supabase
      .from('measurements')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch {
    return lsGet('shredmatrix_measurements', []);
  }
}

export async function deleteMeasurement(dateToDelete) {
  const userId = getUserId();

  if (!isSupabaseReady() || !userId) {
    const entries = lsGet('shredmatrix_measurements', []);
    lsSet('shredmatrix_measurements', entries.filter(e => e.date !== dateToDelete));
    return;
  }

  try {
    const { error } = await supabase
      .from('measurements')
      .delete()
      .eq('user_id', userId)
      .eq('date', dateToDelete);
    if (error) throw error;
  } catch {
    const entries = lsGet('shredmatrix_measurements', []);
    lsSet('shredmatrix_measurements', entries.filter(e => e.date !== dateToDelete));
  }
}

// ══════════════════════════════════════════════
// WATER
// ══════════════════════════════════════════════

export async function saveWater(date, glasses, targetMet = false) {
  const userId = getUserId();

  if (!isSupabaseReady() || !userId) {
    lsSet('shredmatrix_water', { date, glasses });
    // Also write to water_history for achievements
    if (targetMet) {
      const history = lsGet('shredmatrix_water_history', []);
      if (!history.includes(date)) {
        history.push(date);
        lsSet('shredmatrix_water_history', history);
      }
    }
    return;
  }

  try {
    const { error } = await supabase
      .from('water_logs')
      .upsert({ user_id: userId, date, glasses, target_met: targetMet }, { onConflict: 'user_id,date' });
    if (error) throw error;
  } catch {
    // Fallback to localStorage if table doesn't exist
    lsSet('shredmatrix_water', { date, glasses });
    if (targetMet) {
      const history = lsGet('shredmatrix_water_history', []);
      if (!history.includes(date)) {
        history.push(date);
        lsSet('shredmatrix_water_history', history);
      }
    }
  }
}

export async function getWater(date) {
  const userId = getUserId();

  if (!isSupabaseReady() || !userId) {
    const data = lsGet('shredmatrix_water');
    if (data?.date === date) return data;
    return { date, glasses: 0 };
  }

  try {
    const { data, error } = await supabase
      .from('water_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || { date, glasses: 0 };
  } catch {
    // Table may not exist — fallback to localStorage
    const data = lsGet('shredmatrix_water');
    if (data?.date === date) return data;
    return { date, glasses: 0 };
  }
}

export async function getWaterHistory(limit = 30) {
  const userId = getUserId();

  if (!isSupabaseReady() || !userId) {
    return lsGet('shredmatrix_water_history', []);
  }

  try {
    const { data, error } = await supabase
      .from('water_logs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  } catch {
    return lsGet('shredmatrix_water_history', []);
  }
}

// ══════════════════════════════════════════════
// SLEEP
// ══════════════════════════════════════════════

export async function saveSleep(date, hours) {
  const userId = getUserId();

  if (!isSupabaseReady() || !userId) {
    const entries = lsGet('shredmatrix_sleep', []);
    const idx = entries.findIndex(e => e.date === date);
    if (idx >= 0) entries[idx].hours = hours;
    else entries.push({ date, hours });
    lsSet('shredmatrix_sleep', entries);
    return;
  }

  try {
    const { error } = await supabase
      .from('sleep_logs')
      .upsert({ user_id: userId, date, hours }, { onConflict: 'user_id,date' });
    if (error) throw error;
  } catch {
    const entries = lsGet('shredmatrix_sleep', []);
    const idx = entries.findIndex(e => e.date === date);
    if (idx >= 0) entries[idx].hours = hours;
    else entries.push({ date, hours });
    lsSet('shredmatrix_sleep', entries);
  }
}

export async function getSleep(limit = 30) {
  const userId = getUserId();

  if (!isSupabaseReady() || !userId) {
    return lsGet('shredmatrix_sleep', []);
  }

  try {
    const { data, error } = await supabase
      .from('sleep_logs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  } catch {
    return lsGet('shredmatrix_sleep', []);
  }
}

// ══════════════════════════════════════════════
// PROFILE
// ══════════════════════════════════════════════

export async function updateProfile(updates) {
  const userId = getUserId();
  if (!isSupabaseReady() || !userId) return;

  try {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);
    if (error) throw error;
  } catch {
    // Profile update failed silently
  }
}

export async function getProfile() {
  const userId = getUserId();
  if (!isSupabaseReady() || !userId) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch {
    return null;
  }
}

// ══════════════════════════════════════════════
// PHOTOS (Supabase Storage)
// ══════════════════════════════════════════════

export async function uploadPhoto(file, type = 'profile') {
  // Validate file
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.');
  }
  if (file.size > MAX_SIZE) {
    throw new Error('File too large. Maximum size is 5MB.');
  }

  const userId = getUserId();

  if (!isSupabaseReady() || !userId) {
    // Fallback: store as base64 in localStorage
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (type === 'profile') {
          lsSet('shredmatrix_profile_photo', reader.result);
        } else {
          const photos = lsGet('shredmatrix_progress_photos', []);
          photos.push({ id: Date.now(), date: new Date().toISOString(), src: reader.result });
          lsSet('shredmatrix_progress_photos', photos);
        }
        resolve(reader.result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const ext = file.name?.split('.').pop() || 'jpg';
  const path = `${userId}/${type}/${Date.now()}.${ext}`;

  try {
    const { error } = await supabase.storage
      .from('user-photos')
      .upload(path, file, { cacheControl: '3600', upsert: type === 'profile' });
    if (error) throw error;

    const { data, error: urlError } = await supabase.storage
      .from('user-photos')
      .createSignedUrl(path, 3600);
    if (urlError) throw urlError;

    if (type === 'profile') {
      await updateProfile({ avatar_url: path });
    }

    return data.signedUrl;
  } catch {
    // Fallback: store as base64 in localStorage
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (type === 'profile') {
          lsSet('shredmatrix_profile_photo', reader.result);
        } else {
          const photos = lsGet('shredmatrix_progress_photos', []);
          photos.push({ id: Date.now(), date: new Date().toISOString(), src: reader.result });
          lsSet('shredmatrix_progress_photos', photos);
        }
        resolve(reader.result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

export async function getProfilePhoto() {
  const userId = getUserId();

  if (!isSupabaseReady() || !userId) {
    return lsGet('shredmatrix_profile_photo', null);
  }

  try {
    const profile = await getProfile();
    if (!profile?.avatar_url) return null;
    const { data } = await supabase.storage
      .from('user-photos')
      .createSignedUrl(profile.avatar_url, 3600);
    return data?.signedUrl || profile.avatar_url;
  } catch {
    return lsGet('shredmatrix_profile_photo', null);
  }
}

export async function getProgressPhotos() {
  const userId = getUserId();

  if (!isSupabaseReady() || !userId) {
    return lsGet('shredmatrix_progress_photos', []);
  }

  const { data, error } = await supabase.storage
    .from('user-photos')
    .list(`${userId}/progress`, { sortBy: { column: 'created_at', order: 'desc' } });
  if (error) return [];

  return await Promise.all((data || []).map(async (f) => {
    const { data: urlData } = await supabase.storage
      .from('user-photos')
      .createSignedUrl(`${userId}/progress/${f.name}`, 3600);
    return {
      id: f.id,
      name: f.name,
      date: f.created_at,
      src: urlData?.signedUrl || '',
    };
  }));
}

export async function deleteProgressPhoto(photoName) {
  const userId = getUserId();

  if (!isSupabaseReady() || !userId) {
    // localStorage fallback: filter by name or id
    const photos = lsGet('shredmatrix_progress_photos', []);
    const filtered = photos.filter((p) => p.name !== photoName && String(p.id) !== String(photoName));
    lsSet('shredmatrix_progress_photos', filtered);
    return filtered;
  }

  try {
    const path = `${userId}/progress/${photoName}`;
    const { error } = await supabase.storage
      .from('user-photos')
      .remove([path]);
    if (error) throw error;
  } catch {
    // If supabase delete fails, still update localStorage
    const photos = lsGet('shredmatrix_progress_photos', []);
    const filtered = photos.filter((p) => p.name !== photoName);
    lsSet('shredmatrix_progress_photos', filtered);
  }

  // Return updated list
  return getProgressPhotos();
}
// ══════════════════════════════════════════════
// PHASE MANAGEMENT
// ══════════════════════════════════════════════

export async function updatePhase(newPhase) {
  const userId = getUserId();

  if (!isSupabaseReady() || !userId) {
    localStorage.setItem('shredmatrix_current_phase', String(newPhase));
    localStorage.setItem('shredmatrix_plan_created', new Date().toISOString());
    return;
  }

  try {
    await supabase.from('profiles').update({
      current_phase: newPhase,
      plan_created_at: new Date().toISOString(),
    }).eq('id', userId);
  } catch {
    localStorage.setItem('shredmatrix_current_phase', String(newPhase));
    localStorage.setItem('shredmatrix_plan_created', new Date().toISOString());
  }
}

export async function getCurrentPhase() {
  const userId = getUserId();

  if (!isSupabaseReady() || !userId) {
    return parseInt(localStorage.getItem('shredmatrix_current_phase') || '0', 10);
  }

  const profile = await getProfile();
  return profile?.current_phase || 0;
}

export async function getPlanCreatedAt() {
  const userId = getUserId();

  if (!isSupabaseReady() || !userId) {
    return localStorage.getItem('shredmatrix_plan_created');
  }

  const profile = await getProfile();
  return profile?.plan_created_at;
}

// ══════════════════════════════════════════════
// FIRST LOGIN
// ══════════════════════════════════════════════

export async function getFirstLogin() {
  const userId = getUserId();

  if (!isSupabaseReady() || !userId) {
    return localStorage.getItem('shredmatrix_first_login');
  }

  const profile = await getProfile();
  return profile?.first_login_at;
}

export async function setFirstLogin() {
  const userId = getUserId();
  const now = new Date().toISOString();

  if (!isSupabaseReady() || !userId) {
    if (!localStorage.getItem('shredmatrix_first_login')) {
      localStorage.setItem('shredmatrix_first_login', now);
    }
    return;
  }

  // Profile trigger already sets first_login_at on signup
}

// ══════════════════════════════════════════════
// DELETE ALL USER DATA
// ══════════════════════════════════════════════

export async function deleteAllUserData(email) {
  const userId = getUserId();

  // Always clear localStorage
  const allKeys = [
    'shredmatrix_session', `shredmatrix_plan_${email}`,
    'shredmatrix_progress', 'shredmatrix_water', 'shredmatrix_water_history',
    'shredmatrix_workout_log', 'shredmatrix_measurements', 'shredmatrix_sleep',
    'shredmatrix_profile_photo', 'shredmatrix_progress_photos',
    'shredmatrix_reminder', 'shredmatrix_current_phase', 'shredmatrix_plan_created',
    'shredmatrix_first_login', `shredmatrix_tour_seen_${email}`,
    'shredmatrix_install_dismissed',
  ];
  allKeys.forEach(k => lsRemove(k));

  // Remove from users list
  const users = lsGet('shredmatrix_users', []);
  const filtered = users.filter(u => u.email !== email);
  lsSet('shredmatrix_users', filtered);

  if (!isSupabaseReady() || !userId) return;

  // Delete from all Supabase tables (ignore errors for missing tables)
  const tables = ['plans', 'workout_logs', 'progress_entries',
    'measurements', 'water_logs', 'sleep_logs', 'reminders'];
  for (const table of tables) {
    try { await supabase.from(table).delete().eq('user_id', userId); } catch {}
  }

  // Delete storage files
  try {
    const { data: files } = await supabase.storage.from('user-photos').list(userId, { limit: 100 });
    if (files?.length) {
      await supabase.storage.from('user-photos').remove(files.map(f => `${userId}/${f.name}`));
    }
  } catch { /* ignore storage errors */ }

  // Delete profile (cascade will handle auth)
  try { await supabase.from('profiles').delete().eq('id', userId); } catch {}

  // Delete auth user via RPC
  try {
    await supabase.rpc('delete_current_user');
  } catch { /* RPC may not exist yet */ }
}

// ══════════════════════════════════════════════
