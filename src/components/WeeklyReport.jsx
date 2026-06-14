import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar, Dumbbell, Droplets, Scale, TrendingUp,
  TrendingDown, Flame, Award, Minus,
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

const itemV = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

function getMondayOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function formatDate(d, locale = 'tr-TR') {
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

function StatRow({ icon: Icon, label, value, sub, color = '#ff6d00' }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-950/50 border border-slate-800/50">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
        <Icon size={15} style={{ color }} />
      </div>
      <div className="flex-1">
        <p className="text-[10px] text-slate-500">{label}</p>
        <p className="text-sm font-bold text-white font-outfit">{value}</p>
      </div>
      {sub && <span className="text-[10px] text-slate-500">{sub}</span>}
    </div>
  );
}

export default function WeeklyReport({ plan }) {
  const { t, lang } = useTranslation();
  const localeMap = { tr: 'tr-TR', en: 'en-US', es: 'es-ES' };
  const report = useMemo(() => {
    const now = new Date();
    const monday = getMondayOfWeek(now);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);

    // Workout logs this week
    let workoutCount = 0;
    let totalVolume = 0;
    try {
      const logs = JSON.parse(localStorage.getItem('shredmatrix_workout_log') || '[]');
      const weekLogs = logs.filter((l) => {
        const d = new Date(l.date);
        return d >= monday && d <= now;
      });
      workoutCount = weekLogs.length;
      weekLogs.forEach((log) => {
        (log.exercises || []).forEach((ex) => {
          (ex.sets || []).forEach((s) => {
            if (s.completed) totalVolume += (s.weight || 0) * (s.reps || 0);
          });
        });
      });
    } catch { /* ignore */ }

    // Water average this week
    let waterAvg = 0;
    try {
      const water = JSON.parse(localStorage.getItem('shredmatrix_water_history') || '[]');
      const weekWater = water.filter((w) => {
        const d = new Date(w.date);
        return d >= monday && d <= now;
      });
      if (weekWater.length > 0) {
        waterAvg = Math.round(weekWater.reduce((sum, w) => sum + (w.glasses || 0), 0) / weekWater.length);
      }
    } catch { /* ignore */ }

    // Progress entries this week
    let weightChange = null;
    try {
      const progress = JSON.parse(localStorage.getItem('shredmatrix_progress') || '[]');
      const sorted = [...progress].sort((a, b) => new Date(a.date) - new Date(b.date));
      if (sorted.length >= 2) {
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        weightChange = +(last.weight - first.weight).toFixed(1);
      }
    } catch { /* ignore */ }

    // Workout completion rate
    const targetWorkouts = 4; // 4 days per week from plan
    const completionRate = Math.min(100, Math.round((workoutCount / targetWorkouts) * 100));

    return {
      weekRange: `${formatDate(monday, localeMap[lang] || 'tr-TR')} — ${formatDate(sunday, localeMap[lang] || 'tr-TR')}`,
      workoutCount,
      targetWorkouts,
      totalVolume,
      waterAvg,
      weightChange,
      completionRate,
    };
  }, [plan, lang]);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
      className="bg-slate-900 border border-slate-800 rounded-2xl p-5"
    >
      {/* Header */}
      <motion.div variants={itemV} className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-orange-400" />
          <h3 className="text-sm font-bold font-outfit text-white">{t('weeklyReport.title')}</h3>
        </div>
        <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{report.weekRange}</span>
      </motion.div>

      {/* Completion ring */}
      <motion.div variants={itemV} className="flex items-center gap-4 mb-4 px-3 py-3 rounded-xl bg-slate-950/50 border border-slate-800/50">
        <div className="relative w-14 h-14">
          <svg width="56" height="56" viewBox="0 0 56 56" className="transform -rotate-90">
            <circle cx="28" cy="28" r="23" fill="none" stroke="#1e293b" strokeWidth="4" />
            <circle
              cx="28" cy="28" r="23" fill="none"
              stroke={report.completionRate >= 100 ? '#22c55e' : '#ff6d00'}
              strokeWidth="4" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 23}
              strokeDashoffset={2 * Math.PI * 23 * (1 - report.completionRate / 100)}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white font-outfit">
            %{report.completionRate}
          </span>
        </div>
        <div>
          <p className="text-sm font-bold text-white font-outfit">
            {report.workoutCount}/{report.targetWorkouts} {t('weeklyReport.workouts')}
          </p>
          <p className="text-[10px] text-slate-500">
            {report.completionRate >= 100 ? t('weeklyReport.goalComplete') : report.completionRate >= 50 ? t('weeklyReport.doingWell') : t('weeklyReport.keepGoing')}
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="space-y-2">
        <motion.div variants={itemV}>
          <StatRow icon={Dumbbell} label={t('weeklyReport.volume')} value={`${report.totalVolume.toLocaleString()} kg`} color="#ff6d00" />
        </motion.div>
        <motion.div variants={itemV}>
          <StatRow icon={Droplets} label={t('weeklyReport.waterAvg')} value={`${report.waterAvg} ${t('water.glasses')}`} sub={`${report.waterAvg * 250} ml`} color="#00b0ff" />
        </motion.div>
        <motion.div variants={itemV}>
          <StatRow
            icon={report.weightChange !== null && report.weightChange > 0 ? TrendingUp : report.weightChange !== null && report.weightChange < 0 ? TrendingDown : Minus}
            label={t('weeklyReport.weightChange')}
            value={report.weightChange !== null ? `${report.weightChange > 0 ? '+' : ''}${report.weightChange} kg` : t('weeklyReport.noData')}
            color={report.weightChange !== null ? (report.weightChange < 0 ? '#22c55e' : '#f59e0b') : '#64748b'}
          />
        </motion.div>
      </div>

      {/* Grade */}
      <motion.div variants={itemV} className="mt-4 text-center py-3 rounded-xl bg-gradient-to-r from-orange-500/10 to-blue-500/10 border border-orange-500/10">
        <Award size={20} className="text-orange-400 mx-auto mb-1" />
        <p className="text-xs font-bold text-white font-outfit">
          {report.completionRate >= 100 ? t('weeklyReport.perfectWeek') : report.completionRate >= 75 ? t('weeklyReport.greatWeek') : report.completionRate >= 50 ? t('weeklyReport.goodWeek') : t('weeklyReport.needsImprovement')}
        </p>
      </motion.div>
    </motion.div>
  );
}
