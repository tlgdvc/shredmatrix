import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../i18n/LanguageContext';
import {
  Zap, Droplets, Moon, Dumbbell,
} from 'lucide-react';
import { useToast } from './ToastProvider';
import {
  calculateBalanceScore, getLevel, MOODS,
  saveMood, getTodayMood, getMoodIntensity,
} from '../utils/balanceScore';
import {
  getWorkoutLogs, getWaterHistory, getSleep,
  getProgress, getMeasurements,
} from '../lib/dataService';

// ── Animated Counter ────────────────────────────────────
function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    const start = performance.now();
    const from = 0;

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return value;
}

// ── Score Ring ───────────────────────────────────────────
function ScoreRing({ score, size = 120, strokeWidth = 8 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const level = getLevel(score);
  const displayScore = useCountUp(score);

  // Color based on score
  const getStrokeColor = (s) => {
    if (s >= 86) return '#06b6d4'; // cyan
    if (s >= 71) return '#10b981'; // emerald
    if (s >= 51) return '#eab308'; // yellow
    if (s >= 31) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(148,163,184,0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Score arc */}
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={getStrokeColor(score)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (score / 100) * circumference }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="flex items-baseline gap-0.5">
          <span className="text-3xl font-black font-outfit text-white leading-none">
            {displayScore}
          </span>
          <span className="text-[10px] font-semibold text-slate-500">/100</span>
        </div>
        <span className={`text-[8px] font-bold mt-0.5 ${level.color}`}>
          {level.emoji}
        </span>
      </div>
    </div>
  );
}

// ── Mood Selector ───────────────────────────────────────
function MoodSelector({ onSelect, t }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="bg-slate-900 border border-slate-700/50 rounded-3xl p-6 max-w-sm w-full shadow-2xl"
      >
        <h3 className="text-lg font-bold font-outfit text-white text-center mb-1">
          {t('hero.moodTitle')}
        </h3>
        <p className="text-[11px] text-slate-500 text-center mb-5">
          {t('hero.moodHint')}
        </p>

        <div className="flex justify-center gap-3">
          {MOODS.map((mood, i) => (
            <motion.button
              key={mood.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onSelect(mood.id)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-slate-800/50 border border-slate-700/30 hover:border-orange-500/40 transition-colors cursor-pointer"
            >
              <span className="text-2xl">{mood.emoji}</span>
              <span className="text-[9px] text-slate-400 font-medium whitespace-nowrap">
                {t(`hero.mood.${mood.id}`)}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Mini Stat Card ──────────────────────────────────────
function MiniStat({ icon: Icon, label, value, unit, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-800/40 border border-slate-700/20"
    >
      <Icon size={14} className={color} />
      <span className="text-xs font-bold font-outfit text-white">{value}</span>
      <span className="text-[8px] text-slate-500">{unit || label}</span>
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════
// HERO CARD — Main Component
// ═════════════════════════════════════════════════════════
export default function HeroCard({ plan }) {
  const { t } = useTranslation();
  const toast = useToast();

  // ── State ──
  const [scoreData, setScoreData] = useState(null);
  const [todayMood, setTodayMood] = useState(() => getTodayMood());
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [waterToday, setWaterToday] = useState(0);
  const [sleepToday, setSleepToday] = useState(null);
  const [workoutsThisWeek, setWorkoutsThisWeek] = useState(0);

  // Check if mood was already set today
  useEffect(() => {
    if (!todayMood) {
      // Small delay so dashboard renders first
      const timer = setTimeout(() => setShowMoodPicker(true), 800);
      return () => clearTimeout(timer);
    }
  }, [todayMood]);

  // ── Load all data for score ──
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [logs, water, sleep, progress, measurements] = await Promise.all([
          getWorkoutLogs().catch(() => []),
          getWaterHistory(30).catch(() => []),
          getSleep(30).catch(() => []),
          getProgress().catch(() => []),
          getMeasurements().catch(() => []),
        ]);

        if (cancelled) return;

        // Calculate score
        const weeklyTarget = plan?.workoutSplit?.filter(d => !d.isRest).length || 4;
        const goalType = plan?.primaryGoal || 'muscle';
        const result = calculateBalanceScore({
          workoutLogs: logs, waterHistory: water, sleepEntries: sleep,
          progressEntries: progress, measurements, weeklyTarget, goalType,
        });
        setScoreData(result);

        // Today's stats
        const todayStr = new Date().toISOString().split('T')[0];
        const todayWater = water.find(w => w.date === todayStr);
        setWaterToday(todayWater?.glasses || todayWater?.amount || 0);

        const todaySleep = sleep.find(s => s.date === todayStr);
        setSleepToday(todaySleep?.hours || null);

        // Workouts this week
        const weekAgo = new Date(Date.now() - 7 * 86400000);
        const weekLogs = logs.filter(l => new Date(l.date || l.createdAt) >= weekAgo);
        const uniqueDays = new Set(weekLogs.map(l => (l.date || l.createdAt || '').split('T')[0]));
        setWorkoutsThisWeek(uniqueDays.size);
      } catch {
        // Score will be null — that's ok
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, [plan]);

  // ── Today's workout info ──
  const todayInfo = useMemo(() => {
    if (!plan?.workoutSplit) return { isRest: true, dayName: '' };
    const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const todayName = dayNames[new Date().getDay()];
    const todayPlan = plan.workoutSplit.find(d => d.day === todayName);
    if (!todayPlan || todayPlan.isRest) {
      return { isRest: true, dayName: todayName };
    }
    return {
      isRest: false,
      dayName: todayName,
      focus: todayPlan.focus || todayPlan.day,
      exercises: todayPlan.exercises?.length || 0,
    };
  }, [plan]);

  // ── Handle mood selection ──
  const handleMoodSelect = (moodId) => {
    saveMood(moodId);
    setTodayMood(moodId);
    setShowMoodPicker(false);

    const mood = MOODS.find(m => m.id === moodId);
    if (mood) {
      toast.info(t(`hero.mood.${moodId}Tip`));
    }
  };

  const score = scoreData?.score || 0;
  const level = scoreData?.level || getLevel(0);
  const moodObj = MOODS.find(m => m.id === todayMood);
  const weeklyTarget = plan?.workoutSplit?.filter(d => !d.isRest).length || 4;

  return (
    <>
      {/* Mood Picker Modal */}
      <AnimatePresence>
        {showMoodPicker && (
          <MoodSelector onSelect={handleMoodSelect} t={t} />
        )}
      </AnimatePresence>

      {/* Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-700/30 rounded-3xl p-5 mb-6 shadow-xl"
      >
        {/* Background glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-orange-500/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />

        {/* Top row: Score + Today's workout */}
        <div className="flex items-start gap-4 relative z-10">

          {/* Score Ring */}
          <div className="flex flex-col items-center shrink-0">
            <ScoreRing score={score} size={100} strokeWidth={6} />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-[8px] font-semibold text-slate-500 mt-1 tracking-wide uppercase"
            >
              {t('hero.balanceScore')}
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className={`mt-0.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold ${level.bg} border ${level.border} ${level.color}`}
            >
              {t(`hero.level.${level.key}`)}
            </motion.div>
          </div>

          {/* Today's info */}
          <div className="flex-1 min-w-0 pt-1">
            {/* Mood badge */}
            {todayMood && moodObj && (
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => setShowMoodPicker(true)}
                className="flex items-center gap-1 mb-2 px-2 py-0.5 rounded-full bg-slate-800/60 border border-slate-700/30 cursor-pointer hover:border-orange-500/30 transition-colors"
              >
                <span className="text-sm">{moodObj.emoji}</span>
                <span className="text-[9px] text-slate-400">
                  {t(`hero.mood.${todayMood}`)}
                </span>
              </motion.button>
            )}

            {/* Today's workout */}
            {todayInfo.isRest ? (
              <div>
                <h3 className="text-sm font-bold font-outfit text-white flex items-center gap-1.5">
                  💤 {t('hero.restDay')}
                </h3>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                  {t('hero.restDayMsg')}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-[9px] text-slate-500 mb-0.5">
                  {t('hero.todayWorkout')}
                </p>
                <h3 className="text-base font-bold font-outfit text-white leading-tight">
                  {todayInfo.focus}
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {todayInfo.exercises} {t('hero.workout').toLowerCase()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Mini stats row */}
        <div className="grid grid-cols-4 gap-2 mt-4 relative z-10">
          <MiniStat
            icon={Zap}
            label={t('hero.calories')}
            value={plan?.dailyCalories || '—'}
            unit="kcal"
            color="text-orange-400"
            delay={0.4}
          />
          <MiniStat
            icon={Droplets}
            label={t('hero.water')}
            value={waterToday}
            unit={t('hero.glasses')}
            color="text-blue-400"
            delay={0.5}
          />
          <MiniStat
            icon={Moon}
            label={t('hero.sleep')}
            value={sleepToday ?? '—'}
            unit={t('hero.hours')}
            color="text-indigo-400"
            delay={0.6}
          />
          <MiniStat
            icon={Dumbbell}
            label={t('hero.workout')}
            value={`${workoutsThisWeek}/${weeklyTarget}`}
            unit={t('hero.done')}
            color="text-emerald-400"
            delay={0.7}
          />
        </div>

        {/* Score breakdown bar */}
        {scoreData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-3 flex items-center gap-1 relative z-10"
          >
            {['workout', 'nutrition', 'water', 'sleep', 'weightTrend', 'measurement'].map((key, i) => {
              const val = scoreData.breakdown[key] || 0;
              const barColor = val >= 70 ? 'bg-emerald-500' : val >= 40 ? 'bg-amber-500' : 'bg-red-500';
              return (
                <div key={key} className="flex-1 group relative">
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${barColor}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${val}%` }}
                      transition={{ duration: 0.8, delay: 1.3 + i * 0.1 }}
                    />
                  </div>
                  <span className="text-[7px] text-slate-600 mt-0.5 block text-center">
                    {t(`hero.breakdown.${key}`)}
                  </span>
                </div>
              );
            })}
          </motion.div>
        )}
      </motion.div>
    </>
  );
}
