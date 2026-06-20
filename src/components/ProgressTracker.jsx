import { useState, useEffect, useCallback } from 'react';
import { getProgress, saveProgress } from '../lib/dataService';
import { useTranslation } from '../i18n/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Scale, Target, Plus, Trash2 } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';


const MAX_CHART_ENTRIES = 30;

/* ─── animation variants ─── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: 'easeOut' } },
};

/* ─── helpers ─── */


function formatDate(dateStr) {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}`;
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

/* ─── custom chart tooltip ─── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 shadow-2xl">
      <p className="text-xs text-slate-400 mb-1.5 font-medium">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-300">{entry.name}:</span>
          <span className="font-bold text-white">
            {entry.value}{entry.dataKey === 'weight' ? ' kg' : ' %'}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── stat mini card ─── */
function StatCard({ icon: Icon, label, value, unit, color, delay = 0 }) {
  return (
    <motion.div
      variants={itemVariants}
      className="flex flex-col items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900 p-4"
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon size={18} style={{ color }} />
      </div>
      <span className="text-[10px] uppercase tracking-wider text-slate-500">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-bold text-white font-outfit">{value}</span>
        <span className="text-xs text-slate-500">{unit}</span>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   ProgressTracker – main export
   ═══════════════════════════════════════════ */
export default function ProgressTracker({ userName }) {
  const { t } = useTranslation();
  const [entries, setEntries] = useState([]);
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [date, setDate] = useState(todayISO);
  const [period, setPeriod] = useState('all'); // '7' | '30' | 'all'

  /* load entries from dataService on mount */
  useEffect(() => {
    getProgress().then(setEntries).catch(() => { /* ignore */ });
  }, []);

  const handleSave = useCallback(async () => {
    const w = parseFloat(weight);
    const bf = parseFloat(bodyFat);
    if (!w || w <= 0) return;

    const newEntry = {
      date,
      weight: w,
      bodyFat: bf > 0 ? bf : null,
    };

    try {
      await saveProgress(newEntry);
      setEntries((prev) => {
        /* replace if same date exists, otherwise append */
        const exists = prev.findIndex((e) => e.date === date);
        let next;
        if (exists >= 0) {
          next = [...prev];
          next[exists] = newEntry;
        } else {
          next = [...prev, newEntry];
        }
        return next.sort((a, b) => a.date.localeCompare(b.date));
      });
    } catch { /* ignore */ }

    setWeight('');
    setBodyFat('');
    setDate(todayISO());
  }, [weight, bodyFat, date]);

  const handleDelete = useCallback((dateToDelete) => {
    setEntries((prev) => prev.filter((e) => e.date !== dateToDelete));
  }, []);

  /* derived stats */
  const filteredEntries = (() => {
    if (period === 'all') return entries;
    const days = period === '7' ? 7 : 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return entries.filter(e => new Date(e.date) >= cutoff);
  })();

  const chartData = filteredEntries.slice(-MAX_CHART_ENTRIES).map((e) => ({
    date: formatDate(e.date),
    weight: e.weight,
    bodyFat: e.bodyFat,
  }));

  const current = entries.length > 0 ? entries[entries.length - 1] : null;
  const starting = entries.length > 0 ? entries[0] : null;
  const weightChange =
    current && starting ? +(current.weight - starting.weight).toFixed(1) : 0;
  const hasData = entries.length > 0;

  // Min / Max / Avg for filtered period
  const periodWeights = filteredEntries.map(e => e.weight).filter(Boolean);
  const periodMin = periodWeights.length ? Math.min(...periodWeights).toFixed(1) : '–';
  const periodMax = periodWeights.length ? Math.max(...periodWeights).toFixed(1) : '–';
  const periodAvg = periodWeights.length ? (periodWeights.reduce((a, b) => a + b, 0) / periodWeights.length).toFixed(1) : '–';

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-5"
    >
      {/* ── Header ─── */}
      <motion.div variants={cardVariants}>
        <div className="mb-1 flex items-center gap-2">
          <TrendingUp size={20} className="text-orange-400" />
          <h2 className="font-outfit text-xl font-bold text-white">
            {t('progress.title')}
          </h2>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          {userName
            ? `${userName}, ${t('progress.subtitle')}`
            : t('progress.subtitle')}
        </p>
      </motion.div>

      {/* ── Data Entry ─── */}
      <motion.div
        variants={cardVariants}
        className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
      >
        <h3 className="mb-4 font-outfit text-sm font-semibold text-slate-300 flex items-center gap-2">
          <Plus size={14} className="text-orange-400" />
          {t('progress.addNew')}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-wider text-slate-400">
              {t('progress.date')}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              aria-label={t('progress.date')}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:border-orange-500/50 transition-colors"
            />
          </div>

          {/* Weight */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-wider text-slate-500">
              {t('progress.weight')}
            </label>
            <input
              type="number"
              min="30"
              max="300"
              step="0.1"
              placeholder="85.0"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:border-orange-500/50 transition-colors"
            />
          </div>

          {/* Body Fat */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-wider text-slate-500">
              {t('progress.bodyFat')}
            </label>
            <input
              type="number"
              min="3"
              max="60"
              step="0.1"
              placeholder="18.0"
              value={bodyFat}
              onChange={(e) => setBodyFat(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:border-orange-500/50 transition-colors"
            />
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 cursor-pointer transition-shadow hover:shadow-orange-500/30"
        >
          {t('progress.save')}
        </motion.button>
      </motion.div>

      {/* ── Chart or Empty State ─── */}
      <AnimatePresence mode="wait">
        {!hasData ? (
          <motion.div
            key="empty"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="rounded-2xl border border-slate-800 bg-slate-900 p-10 flex flex-col items-center justify-center gap-4"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/15 to-blue-500/15 border border-slate-800">
              <Scale size={28} className="text-orange-400" />
            </div>
            <p className="font-outfit text-lg font-bold gradient-text">
              {t('progress.emptyTitle')}
            </p>
            <p className="text-xs text-slate-500 text-center max-w-xs">
              {t('progress.emptyDesc')}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="chart"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-outfit text-sm font-semibold text-slate-300">
                {t('progress.title')}
                <span className="ml-2 text-xs font-normal text-slate-500">
                  ({chartData.length})
                </span>
              </h3>
              {/* Period selector */}
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                {[{ key: '7', label: t('progressPeriod.days7') }, { key: '30', label: t('progressPeriod.days30') }, { key: 'all', label: t('progressPeriod.all') }].map(p => (
                  <button
                    key={p.key}
                    onClick={() => setPeriod(p.key)}
                    className={[
                      'px-2.5 py-1 rounded-md text-[10px] font-medium transition-all cursor-pointer',
                      period === p.key
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                        : 'text-slate-500 hover:text-white',
                    ].join(' ')}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  dy={10}
                />
                <YAxis
                  yAxisId="weight"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  domain={['dataMin - 2', 'dataMax + 2']}
                  tickFormatter={(v) => `${v}kg`}
                />
                <YAxis
                  yAxisId="bf"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  domain={['dataMin - 2', 'dataMax + 2']}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  yAxisId="weight"
                  type="monotone"
                  dataKey="weight"
                  name={t('progress.weightLabel')}
                  stroke="#ff6d00"
                  strokeWidth={2.5}
                  dot={{ fill: '#ff6d00', r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#ff6d00', stroke: '#020617', strokeWidth: 2 }}
                />
                <Line
                  yAxisId="bf"
                  type="monotone"
                  dataKey="bodyFat"
                  name={t('progress.bodyFatLabel')}
                  stroke="#00b0ff"
                  strokeWidth={2.5}
                  dot={{ fill: '#00b0ff', r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#00b0ff', stroke: '#020617', strokeWidth: 2 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="mt-3 flex items-center justify-center gap-5 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-[#ff6d00]" />
                <span className="text-slate-400">{t('progress.weight')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-[#00b0ff]" />
                <span className="text-slate-400">{t('progress.bodyFat')}</span>
              </div>
            </div>

            {/* Min/Max/Avg for selected period */}
            {periodWeights.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="bg-slate-950/60 border border-slate-800/50 rounded-xl p-2.5 text-center">
                  <p className="text-[9px] text-slate-500">{t('progressPeriod.min')}</p>
                  <p className="text-sm font-bold text-emerald-400 font-outfit">{periodMin} <span className="text-[9px] text-slate-500">kg</span></p>
                </div>
                <div className="bg-slate-950/60 border border-slate-800/50 rounded-xl p-2.5 text-center">
                  <p className="text-[9px] text-slate-500">{t('progressPeriod.avg')}</p>
                  <p className="text-sm font-bold text-blue-400 font-outfit">{periodAvg} <span className="text-[9px] text-slate-500">kg</span></p>
                </div>
                <div className="bg-slate-950/60 border border-slate-800/50 rounded-xl p-2.5 text-center">
                  <p className="text-[9px] text-slate-500">{t('progressPeriod.max')}</p>
                  <p className="text-sm font-bold text-orange-400 font-outfit">{periodMax} <span className="text-[9px] text-slate-500">kg</span></p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Stats Grid ─── */}
      {hasData && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          <StatCard
            icon={Scale}
            label={t('progress.current')}
            value={current?.weight ?? '–'}
            unit="kg"
            color="#ff6d00"
          />
          <StatCard
            icon={Target}
            label={t('progress.start')}
            value={starting?.weight ?? '–'}
            unit="kg"
            color="#64748b"
          />
          <StatCard
            icon={TrendingUp}
            label={t('progress.change')}
            value={`${weightChange > 0 ? '+' : ''}${weightChange}`}
            unit="kg"
            color={weightChange <= 0 ? '#22c55e' : '#ef4444'}
          />
          <StatCard
            icon={Target}
            label={t('progress.bodyFat')}
            value={current?.bodyFat ?? '–'}
            unit="%"
            color="#00b0ff"
          />
        </motion.div>
      )}

      {/* ── Entry History ─── */}
      {hasData && (
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
        >
          <h3 className="mb-3 font-outfit text-sm font-semibold text-slate-300">
            {t('progress.recordHistory')}
            <span className="ml-2 text-xs font-normal text-slate-500">
              ({entries.length} {t('progress.records')})
            </span>
          </h3>

          <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-none">
            {[...entries].reverse().map((entry) => (
              <motion.div
                key={entry.date}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between rounded-xl bg-slate-950 border border-slate-800 px-4 py-2.5"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 font-mono w-12">
                    {formatDate(entry.date)}
                  </span>
                  <span className="text-sm font-semibold text-white">
                    {entry.weight} kg
                  </span>
                  {entry.bodyFat != null && (
                    <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                      %{entry.bodyFat}
                    </span>
                  )}
                </div>
                <motion.button
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleDelete(entry.date)}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                >
                  <Trash2 size={13} />
                </motion.button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.section>
  );
}
