import { supabase, isSupabaseReady } from './supabase';

// ══════════════════════════════════════════════
// Admin Service — FullBalance Admin Panel
// Only accessible by admin role users
// ══════════════════════════════════════════════

const ADMIN_EMAIL = 'tlgdvc@gmail.com';

export function isAdmin(user) {
  return user?.email?.toLowerCase() === ADMIN_EMAIL;
}

// ── User Statistics ─────────────────────────────
export async function getAdminStats() {
  if (!isSupabaseReady()) return null;

  try {
    // Total users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Today's registrations
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: todayRegistrations } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    // This week registrations
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { count: weekRegistrations } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString());

    // This month registrations
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const { count: monthRegistrations } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', monthAgo.toISOString());

    // Previous month for growth calculation
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);
    const { count: prevMonthRegistrations } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', twoMonthsAgo.toISOString())
      .lt('created_at', monthAgo.toISOString());

    const growth = prevMonthRegistrations > 0
      ? Math.round(((monthRegistrations - prevMonthRegistrations) / prevMonthRegistrations) * 100)
      : monthRegistrations > 0 ? 100 : 0;

    // Users with plans
    const { count: usersWithPlans } = await supabase
      .from('plans')
      .select('*', { count: 'exact', head: true });

    return {
      totalUsers: totalUsers || 0,
      todayRegistrations: todayRegistrations || 0,
      weekRegistrations: weekRegistrations || 0,
      monthRegistrations: monthRegistrations || 0,
      monthlyGrowth: growth,
      usersWithPlans: usersWithPlans || 0,
    };
  } catch (err) {
    console.error('[Admin] Stats error:', err);
    return null;
  }
}

// ── User List ───────────────────────────────────
export async function getAdminUsers(page = 0, pageSize = 20, search = '') {
  if (!isSupabaseReady()) return { users: [], total: 0 };

  try {
    let query = supabase
      .from('profiles')
      .select('id, email, name, created_at, plan_created_at, role', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    return { users: data || [], total: count || 0 };
  } catch (err) {
    console.error('[Admin] Users error:', err);
    return { users: [], total: 0 };
  }
}

// ── User Plan Details ───────────────────────────
export async function getUserPlanDetails(userId) {
  if (!isSupabaseReady()) return null;

  try {
    const { data, error } = await supabase
      .from('plans')
      .select('plan_data')
      .eq('user_id', userId)
      .single();
    if (error) return null;
    return data?.plan_data || null;
  } catch {
    return null;
  }
}

// ── Plan Distribution ───────────────────────────
export async function getPlanDistribution() {
  if (!isSupabaseReady()) return [];

  try {
    const { data, error } = await supabase
      .from('plans')
      .select('plan_data');
    if (error) throw error;

    const goalCounts = {};
    const genderCounts = {};
    const ageBuckets = { '16-20': 0, '21-25': 0, '26-30': 0, '31-35': 0, '36-40': 0, '41-50': 0, '50+': 0 };

    (data || []).forEach(({ plan_data }) => {
      if (!plan_data) return;

      // Goal distribution
      const goal = plan_data.goal || plan_data.primaryGoal || 'Bilinmiyor';
      goalCounts[goal] = (goalCounts[goal] || 0) + 1;

      // Gender distribution
      const gender = plan_data.userGender || 'Bilinmiyor';
      genderCounts[gender] = (genderCounts[gender] || 0) + 1;

      // Age distribution
      const age = parseInt(plan_data.userAge) || 0;
      if (age <= 20) ageBuckets['16-20']++;
      else if (age <= 25) ageBuckets['21-25']++;
      else if (age <= 30) ageBuckets['26-30']++;
      else if (age <= 35) ageBuckets['31-35']++;
      else if (age <= 40) ageBuckets['36-40']++;
      else if (age <= 50) ageBuckets['41-50']++;
      else ageBuckets['50+']++;
    });

    return {
      goals: Object.entries(goalCounts).map(([name, value]) => ({ name, value })),
      genders: Object.entries(genderCounts).map(([name, value]) => ({ name, value })),
      ages: Object.entries(ageBuckets).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value })),
    };
  } catch (err) {
    console.error('[Admin] Distribution error:', err);
    return { goals: [], genders: [], ages: [] };
  }
}

// ── Registration Trend (last 30 days) ───────────
export async function getRegistrationTrend() {
  if (!isSupabaseReady()) return [];

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Group by date
    const grouped = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      const key = d.toISOString().slice(0, 10);
      grouped[key] = 0;
    }

    (data || []).forEach(({ created_at }) => {
      const key = created_at?.slice(0, 10);
      if (key && grouped[key] !== undefined) grouped[key]++;
    });

    return Object.entries(grouped).map(([date, count]) => ({
      date: date.slice(5), // "06-15" format
      count,
    }));
  } catch (err) {
    console.error('[Admin] Trend error:', err);
    return [];
  }
}

// ── Delete User ─────────────────────────────────
export async function deleteUser(userId) {
  if (!isSupabaseReady()) throw new Error('Supabase not ready');

  // Delete plan first
  await supabase.from('plans').delete().eq('user_id', userId);
  // Delete profile
  const { error } = await supabase.from('profiles').delete().eq('id', userId);
  if (error) throw error;
}
