import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Plus, Minus, RotateCcw } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

const STORAGE_KEY = 'shredmatrix_water';
const TARGET_GLASSES = 8;
const ML_PER_GLASS = 250;
const TARGET_ML = TARGET_GLASSES * ML_PER_GLASS;

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: getTodayStr(), glasses: 0 };
    const parsed = JSON.parse(raw);
    // Auto-reset if stored date is not today
    if (parsed.date !== getTodayStr()) {
      return { date: getTodayStr(), glasses: 0 };
    }
    return parsed;
  } catch {
    return { date: getTodayStr(), glasses: 0 };
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// getMessage is now inside the component to use t()

// SVG circle constants
const RADIUS = 70;
const STROKE_WIDTH = 10;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const VIEW_SIZE = (RADIUS + STROKE_WIDTH) * 2;
const CENTER = VIEW_SIZE / 2;

export default function WaterTracker() {
  const { t } = useTranslation();
  const [glasses, setGlasses] = useState(() => loadData().glasses);

  const getMessage = (pct) => {
    if (pct >= 100) return t('water.messages.done');
    if (pct >= 75) return t('water.messages.almost');
    if (pct >= 50) return t('water.messages.half');
    if (pct >= 25) return t('water.messages.good');
    return t('water.messages.start');
  };

  // Persist on every change
  useEffect(() => {
    saveData({ date: getTodayStr(), glasses });

    // Bug fix: write to water_history when target met (used by Achievements + WeeklyReport)
    if (glasses >= TARGET_GLASSES) {
      try {
        const history = JSON.parse(localStorage.getItem('shredmatrix_water_history') || '[]');
        const today = getTodayStr();
        if (!history.includes(today)) {
          history.push(today);
          localStorage.setItem('shredmatrix_water_history', JSON.stringify(history));
        }
      } catch { /* ignore */ }
    }
  }, [glasses]);

  // Auto-reset check on mount & when tab regains focus
  useEffect(() => {
    const check = () => {
      const data = loadData();
      setGlasses(data.glasses);
    };
    window.addEventListener('focus', check);
    return () => window.removeEventListener('focus', check);
  }, []);

  const add = useCallback(() => {
    setGlasses((g) => Math.min(g + 1, TARGET_GLASSES));
  }, []);

  const remove = useCallback(() => {
    setGlasses((g) => Math.max(g - 1, 0));
  }, []);

  const reset = useCallback(() => {
    setGlasses(0);
  }, []);

  const percentage = Math.round((glasses / TARGET_GLASSES) * 100);
  const mlConsumed = glasses * ML_PER_GLASS;
  const dashOffset = CIRCUMFERENCE - (CIRCUMFERENCE * Math.min(percentage, 100)) / 100;
  const message = getMessage(percentage);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="bg-slate-900 border border-slate-800 rounded-2xl p-5"
    >
      {/* ── Header ─────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-blue-500/10">
          <Droplets size={16} className="text-[#00b0ff]" />
        </div>
        <h3 className="text-sm font-outfit font-bold text-white tracking-tight">
          {t('water.title')}
        </h3>
      </div>

      {/* ── Circular Progress ──────────────────────── */}
      <div className="flex justify-center mb-4">
        <div className="relative" style={{ width: VIEW_SIZE, height: VIEW_SIZE }}>
          <svg
            width={VIEW_SIZE}
            height={VIEW_SIZE}
            viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
            className="transform -rotate-90"
          >
            {/* Background track */}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke="#1e293b"
              strokeWidth={STROKE_WIDTH}
            />

            {/* Gradient definition */}
            <defs>
              <linearGradient id="waterGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ff6d00" />
                <stop offset="100%" stopColor="#00b0ff" />
              </linearGradient>
            </defs>

            {/* Animated progress arc */}
            <motion.circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke="url(#waterGradient)"
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              initial={{ strokeDashoffset: CIRCUMFERENCE }}
            />
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
            <motion.span
              key={glasses}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="text-3xl font-outfit font-bold text-white leading-none"
            >
              {glasses}
            </motion.span>
            <span className="text-[11px] text-slate-500 font-medium mt-0.5">
              / {TARGET_GLASSES} {t('water.glasses')}
            </span>
          </div>
        </div>
      </div>

      {/* ── Stats row ──────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-slate-950/60 rounded-xl px-3 py-2 text-center">
          <p className="text-[11px] text-slate-500 mb-0.5">{t('water.consumed')}</p>
          <p className="text-sm font-bold text-white font-outfit">
            {mlConsumed} <span className="text-[10px] text-slate-500 font-normal">ml</span>
          </p>
        </div>
        <div className="bg-slate-950/60 rounded-xl px-3 py-2 text-center">
          <p className="text-[11px] text-slate-500 mb-0.5">{t('water.completed')}</p>
          <p className="text-sm font-bold font-outfit">
            <span className="gradient-text">%{percentage}</span>
          </p>
        </div>
      </div>

      {/* ── Motivational message ───────────────────── */}
      <AnimatePresence mode="wait">
        <motion.p
          key={message}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          className="text-center text-xs text-slate-400 mb-4"
        >
          {message}
        </motion.p>
      </AnimatePresence>

      {/* ── Controls ───────────────────────────────── */}
      <div className="flex items-center justify-center gap-2">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={remove}
          disabled={glasses <= 0}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-xs font-medium
                     hover:bg-slate-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <Minus size={12} />
          <span>1</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={add}
          disabled={glasses >= TARGET_GLASSES}
          className="flex items-center gap-1 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#ff6d00] to-[#00b0ff] text-white text-xs font-bold
                     shadow-lg shadow-orange-500/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <Plus size={12} />
          <span>+1</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={reset}
          disabled={glasses === 0}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-xs font-medium
                     hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <RotateCcw size={12} />
          <span>{t('water.reset')}</span>
        </motion.button>
      </div>
    </motion.div>
  );
}
