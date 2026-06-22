import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, Calendar, Trophy } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { getWorkoutLogs } from '../lib/dataService';

// ── Constants ────────────────────────────────
const TOTAL_WEEKS = 12;
const DAYS_IN_WEEK = 7;
const TOTAL_DAYS = TOTAL_WEEKS * DAYS_IN_WEEK;

// ── Helpers ──────────────────────────────────

function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

function getDayGrid() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find the most recent Sunday (end of grid)
  const endDay = new Date(today);

  // Start from (TOTAL_DAYS - 1) days before today's week-start
  // We want columns = weeks, rows = days (Mon=0 … Sun=6)
  // GitHub style: columns flow left→right (oldest→newest)
  // Row 0=Sun, 1=Mon … 6=Sat  — but we'll use Mon-start: 0=Mon … 6=Sun

  const dayOfWeek = today.getDay(); // 0=Sun
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // how many days since Monday

  // End of current (partial) week = today
  // Start = Monday of (TOTAL_WEEKS - 1) weeks ago from current week's Monday
  const currentMonday = new Date(today);
  currentMonday.setDate(today.getDate() - mondayOffset);

  const startDate = new Date(currentMonday);
  startDate.setDate(currentMonday.getDate() - (TOTAL_WEEKS - 1) * 7);

  const days = [];
  const cursor = new Date(startDate);

  for (let i = 0; i < TOTAL_DAYS; i++) {
    days.push({
      date: toDateStr(cursor),
      ts: cursor.getTime(),
      dayOfWeek: i % 7,         // 0=Mon … 6=Sun
      weekIndex: Math.floor(i / 7),
      isFuture: cursor > today,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

function getMonthLabels(days) {
  const labels = [];
  let lastMonth = -1;

  for (const day of days) {
    if (day.dayOfWeek !== 0) continue; // only check Monday (top row)
    const m = new Date(day.date + 'T00:00:00').getMonth();
    if (m !== lastMonth) {
      labels.push({ weekIndex: day.weekIndex, month: m });
      lastMonth = m;
    }
  }
  return labels;
}

const MONTH_KEYS = [
  'streak.months.jan', 'streak.months.feb', 'streak.months.mar',
  'streak.months.apr', 'streak.months.may', 'streak.months.jun',
  'streak.months.jul', 'streak.months.aug', 'streak.months.sep',
  'streak.months.oct', 'streak.months.nov', 'streak.months.dec',
];

const DAY_LABEL_ROWS = [
  { row: 1, key: 'streak.days.mon' },
  { row: 3, key: 'streak.days.wed' },
  { row: 5, key: 'streak.days.fri' },
];

function getIntensity(exerciseCount) {
  if (!exerciseCount || exerciseCount <= 0) return 0;
  if (exerciseCount === 1) return 1;
  if (exerciseCount <= 3) return 2;
  return 3;
}

const INTENSITY_CLASSES = [
  'bg-slate-800/50',          // 0 — no workout
  'bg-emerald-900/50',        // 1 — light (1 exercise)
  'bg-emerald-600/70',        // 2 — medium
  'bg-emerald-400',           // 3 — full
];

function computeStreaks(workoutDates) {
  if (!workoutDates.size) return { current: 0, longest: 0 };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Current streak: count back from today (or yesterday if today has no workout)
  let current = 0;
  let cursor = new Date(today);

  // If today doesn't have a workout, start from yesterday
  if (!workoutDates.has(toDateStr(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (workoutDates.has(toDateStr(cursor))) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }

  // Longest streak: scan all sorted dates
  const sorted = Array.from(workoutDates).sort();
  let longest = 0;
  let run = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + 'T00:00:00');
    const curr = new Date(sorted[i] + 'T00:00:00');
    const diff = (curr - prev) / (1000 * 60 * 60 * 24);

    if (diff === 1) {
      run++;
    } else {
      longest = Math.max(longest, run);
      run = 1;
    }
  }
  longest = Math.max(longest, run);

  return { current, longest };
}

function getThisWeekCount(workoutDates) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - mondayOffset);

  let count = 0;
  const cursor = new Date(monday);
  for (let i = 0; i < 7; i++) {
    if (cursor > today) break;
    if (workoutDates.has(toDateStr(cursor))) count++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

// ══════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════

export default function StreakCalendar() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWorkoutLogs()
      .then((data) => setLogs(data || []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  // Build a map: date → exercise count
  const dateMap = useMemo(() => {
    const m = new Map();
    for (const log of logs) {
      const d = (log.date || log.createdAt || log.created_at || '').slice(0, 10);
      if (!d) continue;
      const count = Array.isArray(log.exercises) ? log.exercises.length : 1;
      m.set(d, (m.get(d) || 0) + count);
    }
    return m;
  }, [logs]);

  const workoutDates = useMemo(() => new Set(dateMap.keys()), [dateMap]);
  const days = useMemo(() => getDayGrid(), []);
  const monthLabels = useMemo(() => getMonthLabels(days), [days]);

  const { current: currentStreak, longest: longestStreak } = useMemo(
    () => computeStreaks(workoutDates),
    [workoutDates],
  );

  const thisWeekCount = useMemo(() => getThisWeekCount(workoutDates), [workoutDates]);

  // ── Render ──────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="bg-slate-900 border border-slate-800 rounded-2xl p-5"
    >
      {/* ── Header ───────────────────────────── */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-emerald-500/10">
          <Calendar size={16} className="text-emerald-400" />
        </div>
        <h3 className="text-sm font-outfit font-bold text-white tracking-tight">
          {t('streak.title')}
        </h3>
      </div>

      {loading ? (
        /* ── Loading spinner ─────────────────── */
        <div className="flex items-center justify-center py-10">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full"
          />
        </div>
      ) : (
        <>
          {/* ── Streak stats row ──────────────── */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            {/* Current streak */}
            <div className="bg-slate-950/60 rounded-xl px-3 py-2.5 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Flame size={14} className="text-orange-400" />
              </div>
              <p className="text-lg font-bold text-white font-outfit leading-none">
                {currentStreak}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">{t('streak.currentStreak')}</p>
            </div>

            {/* Longest streak */}
            <div className="bg-slate-950/60 rounded-xl px-3 py-2.5 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Trophy size={14} className="text-yellow-400" />
              </div>
              <p className="text-lg font-bold text-white font-outfit leading-none">
                {longestStreak}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">{t('streak.longestStreak')}</p>
            </div>

            {/* This week */}
            <div className="bg-slate-950/60 rounded-xl px-3 py-2.5 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Calendar size={14} className="text-emerald-400" />
              </div>
              <p className="text-lg font-bold text-white font-outfit leading-none">
                {thisWeekCount}<span className="text-slate-500 text-xs font-normal">/7</span>
              </p>
              <p className="text-[10px] text-slate-500 mt-1">{t('streak.thisWeek')}</p>
            </div>
          </div>

          {/* ── Current streak callout ────────── */}
          {currentStreak > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center gap-2 mb-4 py-2 px-3 rounded-xl bg-orange-500/10 border border-orange-500/20"
            >
              <span className="text-lg">🔥</span>
              <span className="text-sm font-bold text-orange-300 font-outfit">
                {t('streak.streakMessage', { count: currentStreak })}
              </span>
            </motion.div>
          )}

          {/* ── Heatmap ──────────────────────── */}
          <div className="overflow-x-auto -mx-1 px-1">
            <div className="inline-flex flex-col gap-[3px] min-w-0">
              {/* Month labels */}
              <div className="flex gap-[3px] ml-[28px]">
                {Array.from({ length: TOTAL_WEEKS }).map((_, wi) => {
                  const label = monthLabels.find((l) => l.weekIndex === wi);
                  return (
                    <div key={wi} className="w-[13px] flex-shrink-0">
                      {label && (
                        <span className="text-[9px] text-slate-500 font-medium leading-none">
                          {t(MONTH_KEYS[label.month])}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Grid: rows = days, cols = weeks */}
              {Array.from({ length: DAYS_IN_WEEK }).map((_, row) => (
                <div key={row} className="flex items-center gap-[3px]">
                  {/* Day label */}
                  <div className="w-[25px] flex-shrink-0 text-right pr-1">
                    {DAY_LABEL_ROWS.find((d) => d.row === row) && (
                      <span className="text-[9px] text-slate-500 font-medium">
                        {t(DAY_LABEL_ROWS.find((d) => d.row === row).key)}
                      </span>
                    )}
                  </div>

                  {/* Squares */}
                  {Array.from({ length: TOTAL_WEEKS }).map((_, col) => {
                    const dayIndex = col * DAYS_IN_WEEK + row;
                    const day = days[dayIndex];
                    if (!day) return <div key={col} className="w-[13px] h-[13px]" />;

                    const exerciseCount = dateMap.get(day.date) || 0;
                    const intensity = day.isFuture ? -1 : getIntensity(exerciseCount);
                    const colorClass =
                      intensity < 0 ? 'bg-slate-800/20' : INTENSITY_CLASSES[intensity];

                    return (
                      <motion.div
                        key={day.date}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          duration: 0.2,
                          delay: Math.min(dayIndex * 0.004, 0.4),
                          ease: 'easeOut',
                        }}
                        title={`${day.date} — ${exerciseCount} ${t('streak.exercises')}`}
                        className={`w-[13px] h-[13px] rounded-[3px] ${colorClass} transition-colors`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* ── Legend ─────────────────────────── */}
          <div className="flex items-center justify-end gap-1.5 mt-3">
            <span className="text-[9px] text-slate-500 mr-1">{t('streak.less')}</span>
            {INTENSITY_CLASSES.map((cls, i) => (
              <div
                key={i}
                className={`w-[10px] h-[10px] rounded-[2px] ${cls}`}
              />
            ))}
            <span className="text-[9px] text-slate-500 ml-1">{t('streak.more')}</span>
          </div>
        </>
      )}
    </motion.div>
  );
}
