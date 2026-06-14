import { supabase, isSupabaseReady } from './supabase';

// ══════════════════════════════════════════════
// ShredMatrix — Data Service Layer
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
    // Fallback: localStorage auth
    const users = lsGet('shredmatrix_users', []);
    if (users.find(u => u.email === email)) throw new Error('Bu e-posta zaten kayıtlı');
    users.push({ name, email, password: btoa(password) });
    lsSet('shredmatrix_users', users);
    const session = { name, email };
    lsSet('shredmatrix_session', session);
    return { user: session, isLocal: true };
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
    const users = lsGet('shredmatrix_users', []);
    const user = users.find(u => u.email === email && u.password === btoa(password));
    if (!user) throw new Error('E-posta veya şifre hatalı');
    const session = { name: user.name, email: user.email };
    lsSet('shredmatrix_session', session);
    return { user: session, isLocal: true };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return { user: data.user, session: data.session };
}

export async function signOut() {
  if (isSupabaseReady()) {
    await supabase.auth.signOut();
  }
  lsRemove('shredmatrix_session');
}

export async function getSession() {
  if (!isSupabaseReady()) {
    const session = lsGet('shredmatrix_session');
    return session ? { user: session, isLocal: true } : null;
  }

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
    if (session) {
      callback('SIGNED_IN', {
        id: session.user.id,
        name: session.user.user_metadata?.name || 'User',
        email: session.user.email,
      });
    } else {
      callback('SIGNED_OUT', null);
    }
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

  const { error } = await supabase
    .from('plans')
    .upsert({ user_id: userId, plan_data: planData }, { onConflict: 'user_id' });
  if (error) throw error;

  // Update profile
  await supabase.from('profiles').update({
    plan_created_at: new Date().toISOString(),
  }).eq('id', userId);
}

export async function loadPlan(email) {
  const userId = getUserId();

  if (!isSupabaseReady() || !userId) {
    return lsGet(`shredmatrix_plan_${email}`);
  }

  const { data, error } = await supabase
    .from('plans')
    .select('plan_data')
    .eq('user_id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data?.plan_data || null;
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

  const { error } = await supabase
    .from('workout_logs')
    .insert({ user_id: userId, date: log.date, day_focus: log.focus || log.day_focus, exercises: log.exercises, notes: log.notes });
  if (error) throw error;
}

export async function getWorkoutLogs() {
  const userId = getUserId();

  if (!isSupabaseReady() || !userId) {
    return lsGet('shredmatrix_workout_log', []);
  }

  const { data, error } = await supabase
    .from('workout_logs')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (error) throw error;
  return data || [];
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

  const { error } = await supabase
    .from('progress_entries')
    .insert({ user_id: userId, date: entry.date, weight: entry.weight, body_fat: entry.bodyFat || entry.body_fat });
  if (error) throw error;
}

export async function getProgress() {
  const userId = getUserId();

  if (!isSupabaseReady() || !userId) {
    return lsGet('shredmatrix_progress', []);
  }

  const { data, error } = await supabase
    .from('progress_entries')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true });
  if (error) throw error;
  return data || [];
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

  const { error } = await supabase
    .from('measurements')
    .insert({ user_id: userId, ...entry });
  if (error) throw error;
}

export async function getMeasurements() {
  const userId = getUserId();

  if (!isSupabaseReady() || !userId) {
    return lsGet('shredmatrix_measurements', []);
  }

  const { data, error } = await supabase
    .from('measurements')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true });
  if (error) throw error;
  return data || [];
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

  const { error } = await supabase
    .from('water_logs')
    .upsert({ user_id: userId, date, glasses, target_met: targetMet }, { onConflict: 'user_id,date' });
  if (error) throw error;
}

export async function getWater(date) {
  const userId = getUserId();

  if (!isSupabaseReady() || !userId) {
    const data = lsGet('shredmatrix_water');
    if (data?.date === date) return data;
    return { date, glasses: 0 };
  }

  const { data, error } = await supabase
    .from('water_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || { date, glasses: 0 };
}

export async function getWaterHistory(limit = 30) {
  const userId = getUserId();

  if (!isSupabaseReady() || !userId) {
    return lsGet('shredmatrix_water_history', []);
  }

  const { data, error } = await supabase
    .from('water_logs')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
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

  const { error } = await supabase
    .from('sleep_logs')
    .upsert({ user_id: userId, date, hours }, { onConflict: 'user_id,date' });
  if (error) throw error;
}

export async function getSleep(limit = 30) {
  const userId = getUserId();

  if (!isSupabaseReady() || !userId) {
    return lsGet('shredmatrix_sleep', []);
  }

  const { data, error } = await supabase
    .from('sleep_logs')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

// ══════════════════════════════════════════════
// PROFILE
// ══════════════════════════════════════════════

export async function updateProfile(updates) {
  const userId = getUserId();
  if (!isSupabaseReady() || !userId) return;

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);
  if (error) throw error;
}

export async function getProfile() {
  const userId = getUserId();
  if (!isSupabaseReady() || !userId) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// ══════════════════════════════════════════════
// PHOTOS (Supabase Storage)
// ══════════════════════════════════════════════

export async function uploadPhoto(file, type = 'profile') {
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

  const { error } = await supabase.storage
    .from('user-photos')
    .upload(path, file, { cacheControl: '3600', upsert: type === 'profile' });
  if (error) throw error;

  const { data } = supabase.storage
    .from('user-photos')
    .getPublicUrl(path);

  if (type === 'profile') {
    await updateProfile({ avatar_url: data.publicUrl });
  }

  return data.publicUrl;
}

export async function getProfilePhoto() {
  const userId = getUserId();

  if (!isSupabaseReady() || !userId) {
    return lsGet('shredmatrix_profile_photo', null);
  }

  const profile = await getProfile();
  return profile?.avatar_url || null;
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

  return (data || []).map(f => ({
    id: f.id,
    name: f.name,
    date: f.created_at,
    src: supabase.storage.from('user-photos').getPublicUrl(`${userId}/progress/${f.name}`).data.publicUrl,
  }));
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

  await supabase.from('profiles').update({
    current_phase: newPhase,
    plan_created_at: new Date().toISOString(),
  }).eq('id', userId);
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

  // Delete from all Supabase tables
  const tables = ['plans', 'workout_logs', 'progress_entries',
    'measurements', 'water_logs', 'sleep_logs', 'reminders'];
  for (const table of tables) {
    await supabase.from(table).delete().eq('user_id', userId);
  }

  // Delete storage files
  try {
    const { data: files } = await supabase.storage.from('user-photos').list(userId, { limit: 100 });
    if (files?.length) {
      await supabase.storage.from('user-photos').remove(files.map(f => `${userId}/${f.name}`));
    }
  } catch { /* ignore storage errors */ }

  // Delete profile (cascade will handle auth)
  await supabase.from('profiles').delete().eq('id', userId);
}

// ══════════════════════════════════════════════
// REMINDER
// ══════════════════════════════════════════════

export async function saveReminder(settings) {
  const userId = getUserId();

  if (!isSupabaseReady() || !userId) {
    lsSet('shredmatrix_reminder', settings);
    return;
  }

  const { error } = await supabase
    .from('reminders')
    .upsert({ user_id: userId, ...settings }, { onConflict: 'user_id' });
  if (error) throw error;
}

export async function getReminder() {
  const userId = getUserId();

  if (!isSupabaseReady() || !userId) {
    return lsGet('shredmatrix_reminder', { enabled: false, hour: 9 });
  }

  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || { enabled: false, hour: 9 };
}
