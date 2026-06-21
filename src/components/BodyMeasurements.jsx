import { useState, useEffect, useCallback } from 'react';
import { getMeasurements, saveMeasurement, deleteMeasurement } from '../lib/dataService';
import { useTranslation } from '../i18n/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Ruler, Plus, Trash2 } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';



const FIELDS = [
  { key: 'chest', color: '#ff6d00' },
  { key: 'waist', color: '#00b0ff' },
  { key: 'hip',   color: '#a855f7' },
  { key: 'arm',   color: '#22c55e' },
  { key: 'leg',   color: '#f59e0b' },
];



function formatDate(d) {
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2,'0')}.${String(dt.getMonth()+1).padStart(2,'0')}`;
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 shadow-2xl">
      <p className="text-[10px] text-slate-400 mb-1">{label}</p>
      {payload.map((e, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: e.color }} />
          <span className="text-slate-300">{e.name}:</span>
          <span className="font-bold text-white">{e.value} cm</span>
        </div>
      ))}
    </div>
  );
}

export default function BodyMeasurements() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({ chest:'', waist:'', hip:'', arm:'', leg:'' });
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    getMeasurements().then(setEntries).catch(() => { /* ignore */ });
  }, []);

  const handleSave = useCallback(async () => {
    const hasValue = Object.values(form).some(v => parseFloat(v) > 0);
    if (!hasValue) return;
    const entry = { date };
    FIELDS.forEach(f => { const v = parseFloat(form[f.key]); if (v > 0) entry[f.key] = v; });
    try {
      await saveMeasurement(entry);
      setEntries(prev => {
        const idx = prev.findIndex(e => e.date === date);
        let next;
        if (idx >= 0) { next = [...prev]; next[idx] = entry; }
        else { next = [...prev, entry]; }
        return next.sort((a,b) => a.date.localeCompare(b.date));
      });
    } catch { /* ignore */ }
    setForm({ chest:'', waist:'', hip:'', arm:'', leg:'' });
  }, [form, date]);

  const handleDelete = useCallback(async (d) => {
    setEntries(prev => prev.filter(e => e.date !== d));
    try { await deleteMeasurement(d); } catch { /* fallback already in state */ }
  }, []);

  const chartData = entries.slice(-30).map(e => ({
    date: formatDate(e.date), ...FIELDS.reduce((a,f) => ({ ...a, [f.key]: e[f.key] || null }), {}),
  }));
  const hasData = entries.length > 0;

  return (
    <motion.section
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="flex flex-col gap-5"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Ruler size={20} className="text-purple-400" />
        <h2 className="font-outfit text-xl font-bold text-white">{t('measurements.title')}</h2>
      </div>

      {/* Form */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <h3 className="mb-4 font-outfit text-sm font-semibold text-slate-300 flex items-center gap-2">
          <Plus size={14} className="text-purple-400" />
          {t('measurements.add')}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
          <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
            <label className="text-[10px] uppercase tracking-wider text-slate-500">{t('measurements.date')}</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              aria-label={t('measurements.date')}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-white focus:border-purple-500/50 transition-colors" />
          </div>
          {FIELDS.map(f => (
            <div key={f.key} className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wider text-slate-500">{t(`measurements.${f.key}`)}</label>
              <input type="number" min="10" max="300" step="0.1" placeholder="cm"
                value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:border-purple-500/50 transition-colors" />
            </div>
          ))}
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleSave}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 cursor-pointer">
          {t('measurements.save')}
        </motion.button>
      </div>

      {/* Chart */}
      {hasData && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h3 className="mb-4 font-outfit text-sm font-semibold text-slate-300">{t('measurements.chart')}</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} domain={['dataMin - 3', 'dataMax + 3']} tickFormatter={v => `${v}cm`} />
              <Tooltip content={<ChartTooltip />} />
              {FIELDS.map(f => (
                <Line key={f.key} type="monotone" dataKey={f.key} name={t(`measurements.${f.key}`)}
                  stroke={f.color} strokeWidth={2} dot={{ fill: f.color, r: 2.5, strokeWidth: 0 }}
                  activeDot={{ r: 4, fill: f.color, stroke: '#020617', strokeWidth: 2 }} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-[10px]">
            {FIELDS.map(f => (
              <div key={f.key} className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: f.color }} />
                <span className="text-slate-400">{t(`measurements.${f.key}`)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty */}
      {!hasData && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 flex flex-col items-center gap-3">
          <Ruler size={28} className="text-purple-400" />
          <p className="font-outfit text-lg font-bold gradient-text">{t('measurements.emptyTitle')}</p>
          <p className="text-xs text-slate-500 text-center">{t('measurements.emptyDesc')}</p>
        </div>
      )}

      {/* History */}
      {hasData && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h3 className="mb-3 font-outfit text-sm font-semibold text-slate-300">
            {t('measurements.history')} <span className="ml-2 text-xs text-slate-500">({entries.length})</span>
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-none">
            {[...entries].reverse().map(entry => (
              <div key={entry.date} className="flex items-center justify-between rounded-xl bg-slate-950 border border-slate-800 px-4 py-2.5">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-slate-500 font-mono w-12">{formatDate(entry.date)}</span>
                  {FIELDS.map(f => entry[f.key] != null && (
                    <span key={f.key} className="text-[10px] px-2 py-0.5 rounded-full border" style={{ color: f.color, borderColor: `${f.color}30`, backgroundColor: `${f.color}10` }}>
                      {t(`measurements.${f.key}`)}: {entry[f.key]}cm
                    </span>
                  ))}
                </div>
                <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => handleDelete(entry.date)}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer">
                  <Trash2 size={13} />
                </motion.button>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.section>
  );
}
