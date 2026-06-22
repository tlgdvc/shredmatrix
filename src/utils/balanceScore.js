/**
 * Full Balance Score — Birleşik Sağlık Puanı (0-100)
 *
 * Ağırlıklar:
 *   🏋️ Antrenman tutarlılığı  — %30
 *   🥗 Beslenme uyumu         — %20
 *   💧 Su tüketimi            — %15
 *   😴 Uyku kalitesi          — %15
 *   📊 Kilo trendi            — %10
 *   📏 Ölçüm takibi           — %10
 */

// ── Helpers ─────────────────────────────────────────────
function clamp(val, min = 0, max = 100) {
  return Math.max(min, Math.min(max, val));
}

function daysBetween(d1, d2) {
  return Math.abs(Math.floor((d1 - d2) / 86400000));
}

// ── Individual Scores ───────────────────────────────────

/**
 * Antrenman Tutarlılığı (0-100)
 * Son 7 günde kaç antrenman yapıldı / haftalık hedef
 */
function workoutScore(workoutLogs = [], weeklyTarget = 4) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const recentLogs = workoutLogs.filter(log => {
    const d = new Date(log.date || log.createdAt);
    return d >= weekAgo && d <= now;
  });
  const uniqueDays = new Set(recentLogs.map(l => (l.date || l.createdAt || '').split('T')[0]));
  const ratio = uniqueDays.size / Math.max(1, weeklyTarget);
  return clamp(Math.round(ratio * 100));
}

/**
 * Su Tüketimi (0-100)
 * Son 7 günde hedef bardak sayısına ulaşma oranı
 */
function waterScore(waterHistory = [], targetGlasses = 8) {
  if (waterHistory.length === 0) return 0;
  const recent = waterHistory.slice(-7);
  const avgRatio = recent.reduce((sum, entry) => {
    const glasses = entry.glasses || entry.amount || 0;
    return sum + Math.min(glasses / targetGlasses, 1);
  }, 0) / recent.length;
  return clamp(Math.round(avgRatio * 100));
}

/**
 * Uyku Kalitesi (0-100)
 * Hedef: 7-9 saat. Bu aralığa yakınlık.
 */
function sleepScore(sleepEntries = []) {
  if (sleepEntries.length === 0) return 0;
  const recent = sleepEntries.slice(-7);
  const avgQuality = recent.reduce((sum, entry) => {
    const h = entry.hours || 0;
    if (h >= 7 && h <= 9) return sum + 1;       // ideal
    if (h >= 6 && h < 7) return sum + 0.7;       // ok
    if (h > 9 && h <= 10) return sum + 0.7;      // slightly over
    if (h >= 5 && h < 6) return sum + 0.4;       // poor
    return sum + 0.2;                             // very poor
  }, 0) / recent.length;
  return clamp(Math.round(avgQuality * 100));
}

/**
 * Kilo Trendi (0-100)
 * Hedefe doğru ilerleme — son 30 günde tutarlı değişim
 */
function weightTrendScore(progressEntries = [], goalType = 'muscle') {
  if (progressEntries.length < 2) return 50; // not enough data → neutral
  const sorted = [...progressEntries]
    .filter(e => e.weight)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length < 2) return 50;

  const recent = sorted.slice(-10); // last 10 entries
  const first = recent[0].weight;
  const last = recent[recent.length - 1].weight;
  const change = last - first;

  if (goalType === 'fat_loss') {
    // Weight should decrease
    if (change < -0.5) return clamp(80 + Math.min(Math.abs(change) * 4, 20));
    if (change <= 0.5) return 60; // stable
    return clamp(40 - change * 5); // gaining = bad
  } else if (goalType === 'muscle') {
    // Weight should increase slightly
    if (change > 0.3) return clamp(80 + Math.min(change * 5, 20));
    if (change >= -0.5) return 60; // stable
    return clamp(40 + change * 5); // losing = bad
  }
  // Other goals (yoga, meditation, pilates) — stability is good
  if (Math.abs(change) < 1) return 85;
  return clamp(70 - Math.abs(change) * 3);
}

/**
 * Ölçüm Takibi (0-100)
 * Son 30 günde düzenli ölçüm yapma tutarlılığı
 */
function measurementScore(measurements = []) {
  if (measurements.length === 0) return 0;
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
  const recent = measurements.filter(m => new Date(m.date) >= thirtyDaysAgo);
  // Ideal: at least 4 measurements per month (weekly)
  const ratio = Math.min(recent.length / 4, 1);
  return clamp(Math.round(ratio * 100));
}

// ── Level System ────────────────────────────────────────
const LEVELS = [
  { min: 0,  max: 30,  key: 'beginner',    emoji: '🔴', color: 'text-red-400',     bg: 'bg-red-500/15',     border: 'border-red-500/30' },
  { min: 31, max: 50,  key: 'developing',   emoji: '🟠', color: 'text-orange-400',  bg: 'bg-orange-500/15',  border: 'border-orange-500/30' },
  { min: 51, max: 70,  key: 'consistent',   emoji: '🟡', color: 'text-yellow-400',  bg: 'bg-yellow-500/15',  border: 'border-yellow-500/30' },
  { min: 71, max: 85,  key: 'strong',       emoji: '🟢', color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' },
  { min: 86, max: 100, key: 'elite',        emoji: '💎', color: 'text-cyan-400',    bg: 'bg-cyan-500/15',    border: 'border-cyan-500/30' },
];

export function getLevel(score) {
  return LEVELS.find(l => score >= l.min && score <= l.max) || LEVELS[0];
}

// ── Main Calculator ─────────────────────────────────────
/**
 * Calculate the Full Balance Score
 * @param {Object} data
 * @param {Array} data.workoutLogs - Workout history
 * @param {Array} data.waterHistory - Water intake history
 * @param {Array} data.sleepEntries - Sleep entries
 * @param {Array} data.progressEntries - Weight/body fat entries
 * @param {Array} data.measurements - Body measurements
 * @param {number} data.weeklyTarget - Target workout days per week
 * @param {string} data.goalType - Primary goal key
 * @returns {{ score: number, breakdown: Object, level: Object, trend: string }}
 */
export function calculateBalanceScore({
  workoutLogs = [],
  waterHistory = [],
  sleepEntries = [],
  progressEntries = [],
  measurements = [],
  weeklyTarget = 4,
  goalType = 'muscle',
} = {}) {
  const breakdown = {
    workout:     workoutScore(workoutLogs, weeklyTarget),
    water:       waterScore(waterHistory),
    sleep:       sleepScore(sleepEntries),
    weightTrend: weightTrendScore(progressEntries, goalType),
    measurement: measurementScore(measurements),
  };

  // Beslenme uyumu şu an beslenme takibi olmadığı için
  // antrenman + su + uyku'nun ortalamasını kullanıyoruz
  breakdown.nutrition = Math.round(
    (breakdown.workout * 0.4 + breakdown.water * 0.3 + breakdown.sleep * 0.3)
  );

  // Weighted total
  const score = clamp(Math.round(
    breakdown.workout     * 0.30 +
    breakdown.nutrition   * 0.20 +
    breakdown.water       * 0.15 +
    breakdown.sleep       * 0.15 +
    breakdown.weightTrend * 0.10 +
    breakdown.measurement * 0.10
  ));

  const level = getLevel(score);

  // Trend: compare to previous week (simplified)
  const trend = score >= 50 ? 'up' : 'down';

  return { score, breakdown, level, trend };
}

// ── Mood System ─────────────────────────────────────────
export const MOODS = [
  { id: 'exhausted',  emoji: '😴', intensity: 0.6,  key: 'mood.exhausted' },
  { id: 'low',        emoji: '😐', intensity: 0.85, key: 'mood.low' },
  { id: 'normal',     emoji: '💪', intensity: 1.0,  key: 'mood.normal' },
  { id: 'energetic',  emoji: '🔥', intensity: 1.2,  key: 'mood.energetic' },
  { id: 'zen',        emoji: '🧘', intensity: 0.7,  key: 'mood.zen' },
];

const MOOD_STORAGE_KEY = 'shredmatrix_mood';

export function saveMood(moodId) {
  const today = new Date().toISOString().split('T')[0];
  try {
    const history = JSON.parse(localStorage.getItem(MOOD_STORAGE_KEY) || '{}');
    history[today] = { mood: moodId, timestamp: Date.now() };
    localStorage.setItem(MOOD_STORAGE_KEY, JSON.stringify(history));
  } catch { /* ignore */ }
}

export function getTodayMood() {
  const today = new Date().toISOString().split('T')[0];
  try {
    const history = JSON.parse(localStorage.getItem(MOOD_STORAGE_KEY) || '{}');
    return history[today]?.mood || null;
  } catch { return null; }
}

export function getMoodHistory(days = 30) {
  try {
    const history = JSON.parse(localStorage.getItem(MOOD_STORAGE_KEY) || '{}');
    const entries = Object.entries(history)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, days);
    return entries;
  } catch { return []; }
}

export function getMoodIntensity(moodId) {
  const mood = MOODS.find(m => m.id === moodId);
  return mood ? mood.intensity : 1.0;
}
