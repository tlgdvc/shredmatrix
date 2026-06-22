import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../i18n/LanguageContext';
import { Activity } from 'lucide-react';
import { getWorkoutLogs } from '../lib/dataService';

// ── Muscle group definitions ────────────────────────────
// Each group: id, label key, front/back position, related workout keywords
const MUSCLE_GROUPS = [
  { id: 'chest',     labelKey: 'bodyMap.chest',     side: 'front', keywords: ['göğüs', 'chest', 'bench', 'pec', 'push'] },
  { id: 'shoulders', labelKey: 'bodyMap.shoulders',  side: 'front', keywords: ['omuz', 'shoulder', 'delt', 'press', 'lateral'] },
  { id: 'biceps',    labelKey: 'bodyMap.biceps',     side: 'front', keywords: ['biceps', 'biseps', 'curl', 'kol'] },
  { id: 'abs',       labelKey: 'bodyMap.abs',        side: 'front', keywords: ['karın', 'abs', 'core', 'plank', 'crunch'] },
  { id: 'quads',     labelKey: 'bodyMap.quads',      side: 'front', keywords: ['bacak', 'quad', 'squat', 'leg press', 'lunge', 'ön bacak'] },
  { id: 'back',      labelKey: 'bodyMap.back',       side: 'back',  keywords: ['sırt', 'back', 'lat', 'row', 'pull', 'deadlift', 'çekiş'] },
  { id: 'triceps',   labelKey: 'bodyMap.triceps',    side: 'back',  keywords: ['triceps', 'triseps', 'dip', 'pushdown', 'extension'] },
  { id: 'glutes',    labelKey: 'bodyMap.glutes',     side: 'back',  keywords: ['kalça', 'glute', 'hip thrust', 'bridge'] },
  { id: 'hamstrings',labelKey: 'bodyMap.hamstrings', side: 'back',  keywords: ['hamstring', 'arka bacak', 'leg curl', 'romanian'] },
  { id: 'calves',    labelKey: 'bodyMap.calves',     side: 'front', keywords: ['baldır', 'calf', 'calves', 'raise'] },
];

// ── SVG Body Parts ──────────────────────────────────────
// Simplified human silhouette paths for front view
const BODY_PATHS = {
  // Head (not clickable, decorative)
  head: 'M48,8 C48,3.6 51.6,0 56,0 C60.4,0 64,3.6 64,8 C64,12.4 60.4,18 56,18 C51.6,18 48,12.4 48,8 Z',
  neck: 'M52,18 L60,18 L59,24 L53,24 Z',

  // Front muscles
  chest:      'M38,26 C38,26 44,24 56,24 C68,24 74,26 74,26 L72,40 C72,40 64,38 56,38 C48,38 40,40 40,40 Z',
  shoulders:  'M28,26 C28,24 34,22 38,24 L40,36 C36,34 30,32 28,30 Z M74,24 C78,22 84,24 84,26 L84,30 C82,32 76,34 72,36 L74,24 Z',
  biceps:     'M26,32 L30,32 L32,50 L26,50 Z M82,32 L86,32 L86,50 L80,50 Z',
  triceps:    'M22,34 L26,32 L26,50 L22,48 Z M86,32 L90,34 L90,48 L86,50 Z',
  abs:        'M44,40 L68,40 L66,68 L46,68 Z',
  quads:      'M40,70 L54,70 L52,100 L38,100 Z M58,70 L72,70 L74,100 L60,100 Z',
  hamstrings: 'M40,70 L54,70 L52,100 L38,100 Z M58,70 L72,70 L74,100 L60,100 Z', // same position, shown on back
  glutes:     'M42,64 L70,64 L72,76 L40,76 Z',
  calves:     'M40,102 L52,102 L50,124 L42,124 Z M60,102 L72,102 L70,124 L62,124 Z',
  back:       'M38,26 L74,26 L72,64 L40,64 Z', // full back, shown on back view
};

// ── Color Logic ─────────────────────────────────────────
function getMuscleFreshness(lastTrainedDate) {
  if (!lastTrainedDate) return { status: 'neglected', color: '#ef4444', opacity: 0.35, label: '7+ gün' };
  const days = Math.floor((Date.now() - new Date(lastTrainedDate).getTime()) / 86400000);
  if (days <= 1) return { status: 'fresh',    color: '#10b981', opacity: 0.7,  label: `${days}g`, days };
  if (days <= 2) return { status: 'fresh',    color: '#10b981', opacity: 0.55, label: `${days}g`, days };
  if (days <= 4) return { status: 'ready',    color: '#eab308', opacity: 0.5,  label: `${days}g`, days };
  if (days <= 6) return { status: 'ready',    color: '#f97316', opacity: 0.45, label: `${days}g`, days };
  return { status: 'neglected', color: '#ef4444', opacity: 0.35, label: `${days}g`, days };
}

// ── Component ───────────────────────────────────────────
export default function BodyMap({ plan }) {
  const { t } = useTranslation();
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [selectedMuscle, setSelectedMuscle] = useState(null);
  const [view, setView] = useState('front'); // 'front' | 'back'

  useEffect(() => {
    getWorkoutLogs().then(setWorkoutLogs).catch(() => []);
  }, []);

  // Calculate when each muscle was last trained
  const muscleData = useMemo(() => {
    const data = {};

    MUSCLE_GROUPS.forEach(group => {
      let lastDate = null;
      let totalSessions = 0;

      workoutLogs.forEach(log => {
        const logDate = log.date || log.createdAt || '';
        const dayFocus = (log.focus || log.dayFocus || '').toLowerCase();
        const exercises = (log.exercises || []).map(e => (e.name || '').toLowerCase());
        const allText = [dayFocus, ...exercises].join(' ');

        const matches = group.keywords.some(kw => allText.includes(kw.toLowerCase()));
        if (matches) {
          totalSessions++;
          if (!lastDate || logDate > lastDate) lastDate = logDate;
        }
      });

      // Also check plan's workout split for today's target
      const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
      const todayName = dayNames[new Date().getDay()];
      const todayPlan = plan?.workoutSplit?.find(d => d.day === todayName);
      const isTargetToday = todayPlan && !todayPlan.isRest &&
        group.keywords.some(kw => (todayPlan.focus || '').toLowerCase().includes(kw.toLowerCase()));

      data[group.id] = {
        ...group,
        lastTrained: lastDate,
        totalSessions,
        isTargetToday,
        freshness: getMuscleFreshness(lastDate),
      };
    });

    return data;
  }, [workoutLogs, plan]);

  // Which muscles to show based on view
  const frontMuscles = ['chest', 'shoulders', 'biceps', 'abs', 'quads', 'calves'];
  const backMuscles = ['back', 'triceps', 'glutes', 'hamstrings', 'calves'];
  const visibleMuscles = view === 'front' ? frontMuscles : backMuscles;

  // Balance score
  const trainedCount = Object.values(muscleData).filter(m => m.freshness.status !== 'neglected').length;
  const balancePct = Math.round((trainedCount / MUSCLE_GROUPS.length) * 100);

  const selected = selectedMuscle ? muscleData[selectedMuscle] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900 border border-slate-800 rounded-2xl p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-emerald-400" />
          <h3 className="text-sm font-bold font-outfit text-white">
            {t('bodyMap.title') || 'Vücut Haritası'}
          </h3>
        </div>
        {/* View toggle */}
        <div className="flex gap-1 bg-slate-800/50 rounded-lg p-0.5">
          {['front', 'back'].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-2.5 py-1 rounded-md text-[9px] font-bold transition-all cursor-pointer ${
                view === v
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t(`bodyMap.${v}`) || (v === 'front' ? 'Ön' : 'Arka')}
            </button>
          ))}
        </div>
      </div>

      {/* Balance bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] text-slate-500">
            {t('bodyMap.balance') || 'Dengeli Gelişim'}
          </span>
          <span className="text-[9px] font-bold text-emerald-400">{balancePct}%</span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500"
            initial={{ width: 0 }}
            animate={{ width: `${balancePct}%` }}
            transition={{ duration: 1, delay: 0.3 }}
          />
        </div>
      </div>

      {/* SVG Body */}
      <div className="flex justify-center mb-3">
        <svg viewBox="0 0 112 130" width="160" height="185" className="drop-shadow-lg">
          {/* Body outline (decorative) */}
          <path d={BODY_PATHS.head} fill="rgba(148,163,184,0.15)" />
          <path d={BODY_PATHS.neck} fill="rgba(148,163,184,0.1)" />

          {/* Muscle groups */}
          {visibleMuscles.map((muscleId, i) => {
            const path = BODY_PATHS[muscleId];
            if (!path) return null;
            const data = muscleData[muscleId];
            if (!data) return null;
            const { freshness, isTargetToday } = data;
            const isSelected = selectedMuscle === muscleId;

            return (
              <motion.path
                key={`${view}-${muscleId}`}
                d={path}
                fill={freshness.color}
                fillOpacity={isSelected ? 0.9 : freshness.opacity}
                stroke={isTargetToday ? '#f97316' : isSelected ? '#fff' : 'rgba(148,163,184,0.2)'}
                strokeWidth={isTargetToday ? 1.5 : isSelected ? 1.5 : 0.5}
                strokeDasharray={isTargetToday ? '3,2' : 'none'}
                initial={{ fillOpacity: 0 }}
                animate={{ fillOpacity: isSelected ? 0.9 : freshness.opacity }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                onClick={() => setSelectedMuscle(muscleId === selectedMuscle ? null : muscleId)}
                className="cursor-pointer transition-all"
                whileHover={{ fillOpacity: 0.8 }}
              />
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 mb-3">
        {[
          { color: '#10b981', label: t('bodyMap.fresh') || 'Taze' },
          { color: '#eab308', label: t('bodyMap.ready') || 'Hazır' },
          { color: '#ef4444', label: t('bodyMap.neglected') || 'İhmal' },
        ].map(item => (
          <div key={item.color} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: item.color, opacity: 0.6 }} />
            <span className="text-[8px] text-slate-500">{item.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm border border-orange-500 border-dashed" />
          <span className="text-[8px] text-slate-500">{t('bodyMap.today') || 'Bugün'}</span>
        </div>
      </div>

      {/* Selected muscle detail */}
      {selected && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-3"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-white font-outfit">
              {t(selected.labelKey) || selected.id}
            </span>
            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
              selected.freshness.status === 'fresh' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
              selected.freshness.status === 'ready' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
              'bg-red-500/15 text-red-400 border border-red-500/30'
            }`}>
              {selected.freshness.status === 'fresh' ? (t('bodyMap.freshLabel') || 'Taze') :
               selected.freshness.status === 'ready' ? (t('bodyMap.readyLabel') || 'Hazır') :
               (t('bodyMap.neglectedLabel') || 'İhmal Ediliyor')}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div>
              <span className="text-slate-500">{t('bodyMap.lastTrained') || 'Son çalışma'}:</span>
              <span className="text-white ml-1 font-medium">
                {selected.lastTrained
                  ? `${selected.freshness.days || '?'} ${t('bodyMap.daysAgo') || 'gün önce'}`
                  : (t('bodyMap.never') || 'Hiç')}
              </span>
            </div>
            <div>
              <span className="text-slate-500">{t('bodyMap.totalSessions') || 'Toplam'}:</span>
              <span className="text-white ml-1 font-medium">{selected.totalSessions}</span>
            </div>
          </div>
          {selected.isTargetToday && (
            <div className="mt-2 text-[9px] text-orange-400 font-medium flex items-center gap-1">
              🎯 {t('bodyMap.targetToday') || 'Bugün çalışılacak kas grubu'}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
