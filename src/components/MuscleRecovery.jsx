import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../i18n/LanguageContext';
import { Activity, ChevronDown } from 'lucide-react';
import { getWorkoutLogs } from '../lib/dataService';

// ── Muscle group definitions ────────────────────────────
const MUSCLE_GROUPS = [
  { id: 'chest',      icon: '🫁', keywords: ['göğüs', 'chest', 'bench', 'pec', 'push'] },
  { id: 'back',       icon: '🔙', keywords: ['sırt', 'back', 'lat', 'row', 'pull', 'deadlift', 'çekiş'] },
  { id: 'shoulders',  icon: '💪', keywords: ['omuz', 'shoulder', 'delt', 'press', 'lateral'] },
  { id: 'biceps',     icon: '💪', keywords: ['biceps', 'biseps', 'curl', 'kol'] },
  { id: 'triceps',    icon: '💪', keywords: ['triceps', 'triseps', 'dip', 'pushdown', 'extension'] },
  { id: 'abs',        icon: '🔥', keywords: ['karın', 'abs', 'core', 'plank', 'crunch'] },
  { id: 'quads',      icon: '🦵', keywords: ['bacak', 'quad', 'squat', 'leg press', 'lunge', 'ön bacak'] },
  { id: 'hamstrings', icon: '🦵', keywords: ['hamstring', 'arka bacak', 'leg curl', 'romanian'] },
  { id: 'glutes',     icon: '🍑', keywords: ['kalça', 'glute', 'hip thrust', 'bridge'] },
  { id: 'calves',     icon: '🦶', keywords: ['baldır', 'calf', 'calves', 'raise'] },
];

// ── Recovery logic ──────────────────────────────────────
function getRecovery(lastTrainedDate) {
  if (!lastTrainedDate) return { pct: 100, status: 'neglected', days: null };
  const days = Math.floor((Date.now() - new Date(lastTrainedDate).getTime()) / 86400000);
  if (days <= 1) return { pct: 30,  status: 'recovering', days };
  if (days <= 2) return { pct: 60,  status: 'recovering', days };
  if (days <= 3) return { pct: 85,  status: 'ready', days };
  if (days <= 5) return { pct: 100, status: 'ready', days };
  return { pct: 100, status: 'neglected', days };
}

function getBarColor(status) {
  if (status === 'recovering') return 'from-orange-500 to-amber-500';
  if (status === 'ready')      return 'from-emerald-500 to-cyan-500';
  return 'from-red-500 to-rose-500';
}

function getStatusBadge(status, t) {
  if (status === 'recovering') return { text: t('recovery.recovering'), cls: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
  if (status === 'ready')      return { text: t('recovery.ready'),      cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
  return { text: t('recovery.neglected'), cls: 'text-red-400 bg-red-500/10 border-red-500/20' };
}

// ── Component ───────────────────────────────────────────
export default function MuscleRecovery({ plan }) {
  const { t } = useTranslation();
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    getWorkoutLogs().then(setWorkoutLogs).catch(() => []);
  }, []);

  // Calculate recovery data for each muscle
  const muscles = useMemo(() => {
    return MUSCLE_GROUPS.map(group => {
      let lastDate = null;
      let totalSessions = 0;

      workoutLogs.forEach(log => {
        const logDate = log.date || log.createdAt || '';
        const dayFocus = (log.focus || log.dayFocus || log.day_focus || '').toLowerCase();
        const exercises = (log.exercises || []).map(e => (e.name || '').toLowerCase());
        const allText = [dayFocus, ...exercises].join(' ');

        if (group.keywords.some(kw => allText.includes(kw.toLowerCase()))) {
          totalSessions++;
          if (!lastDate || logDate > lastDate) lastDate = logDate;
        }
      });

      // Check if this muscle is today's target
      const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
      const todayName = dayNames[new Date().getDay()];
      const todayPlan = plan?.workoutSplit?.find(d => d.day === todayName);
      const isToday = todayPlan && !todayPlan.isRest &&
        group.keywords.some(kw => (todayPlan.focus || '').toLowerCase().includes(kw.toLowerCase()));

      const recovery = getRecovery(lastDate);

      return {
        ...group,
        lastTrained: lastDate,
        totalSessions,
        isToday,
        ...recovery,
      };
    }).sort((a, b) => {
      // Sort: neglected first, then recovering, then ready
      const order = { neglected: 0, recovering: 1, ready: 2 };
      return (order[a.status] ?? 1) - (order[b.status] ?? 1);
    });
  }, [workoutLogs, plan]);

  // Show top 5, expand for all
  const visible = expanded ? muscles : muscles.slice(0, 5);
  const readyCount = muscles.filter(m => m.status === 'ready').length;
  const neglectedCount = muscles.filter(m => m.status === 'neglected').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900 border border-slate-800 rounded-2xl p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-emerald-400" />
          <h3 className="text-sm font-bold font-outfit text-white">
            {t('recovery.title')}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {neglectedCount > 0 && (
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-bold">
              {neglectedCount} {t('recovery.neglectedShort')}
            </span>
          )}
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
            {readyCount}/{muscles.length} {t('recovery.readyShort')}
          </span>
        </div>
      </div>

      {/* Muscle bars */}
      <div className="space-y-2.5">
        {visible.map((muscle, i) => {
          const badge = getStatusBadge(muscle.status, t);
          const barColor = getBarColor(muscle.status);

          return (
            <motion.div
              key={muscle.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              {/* Label row */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">{muscle.icon}</span>
                  <span className="text-[11px] font-medium text-white font-outfit">
                    {t(`bodyMap.${muscle.id}`)}
                  </span>
                  {muscle.isToday && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20 font-bold">
                      🎯 {t('recovery.todayTarget')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-slate-500">
                    {muscle.days !== null
                      ? `${muscle.days}${t('recovery.daysShort')}`
                      : '—'}
                  </span>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded-full border font-bold ${badge.cls}`}>
                    {badge.text}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-slate-800/60 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full bg-gradient-to-r ${barColor}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${muscle.pct}%` }}
                  transition={{ duration: 0.8, delay: 0.2 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Show more / less */}
      {muscles.length > 5 && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-3 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
        >
          <span>{expanded ? t('recovery.showLess') : t('recovery.showMore')}</span>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }}>
            <ChevronDown size={12} />
          </motion.div>
        </motion.button>
      )}
    </motion.div>
  );
}
