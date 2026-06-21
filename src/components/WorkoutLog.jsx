import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dumbbell,
  CheckCircle,
  Plus,
  Clock,
  History,
  Save,
  Trash2,
  TrendingUp,
} from 'lucide-react';

const STORAGE_KEY = 'shredmatrix_workout_log';

/* ── Animation variants ──────────────────────────────── */
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 260, damping: 24 },
  },
};

const rowVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.04, type: 'spring', stiffness: 300, damping: 26 },
  }),
  exit: { opacity: 0, x: -12, transition: { duration: 0.15 } },
};

/* ── Helpers ──────────────────────────────────────────── */
function isRestDay(day) {
  const focus = day.focus?.toLowerCase() ?? '';
  return (
    focus.includes('dinlenme') ||
    focus.includes('rest') ||
    focus.includes('off') ||
    focus.includes('descanso')
  );
}

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

function loadLogs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLogs(logs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

function calcVolume(exercises) {
  if (!exercises) return 0;
  return exercises.reduce((total, ex) => {
    return total + (ex.sets || []).reduce((s, set) => {
      if (!set.completed) return s;
      return s + (Number(set.weight) || 0) * (Number(set.reps) || 0);
    }, 0);
  }, 0);
}

function formatVolume(v) {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return String(v);
}

/* ── ExerciseCard ─────────────────────────────────────── */
function ExerciseCard({ exercise, planExercise, exerciseIndex, onUpdate }) {
  const { t } = useTranslation();
  const handleSetChange = (setIndex, field, value) => {
    const updated = { ...exercise };
    updated.sets = updated.sets.map((s, i) =>
      i === setIndex ? { ...s, [field]: value } : s
    );
    onUpdate(exerciseIndex, updated);
  };

  const handleToggleComplete = (setIndex) => {
    const updated = { ...exercise };
    updated.sets = updated.sets.map((s, i) =>
      i === setIndex ? { ...s, completed: !s.completed } : s
    );
    onUpdate(exerciseIndex, updated);
  };

  const handleAddSet = () => {
    const updated = { ...exercise };
    updated.sets = [
      ...updated.sets,
      { weight: '', reps: '', completed: false },
    ];
    onUpdate(exerciseIndex, updated);
  };

  const handleRemoveSet = (setIndex) => {
    const updated = { ...exercise };
    updated.sets = updated.sets.filter((_, i) => i !== setIndex);
    onUpdate(exerciseIndex, updated);
  };

  const completedSets = exercise.sets.filter((s) => s.completed).length;

  return (
    <motion.div
      custom={exerciseIndex}
      variants={rowVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="bg-slate-900 border border-slate-800 rounded-2xl p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-outfit font-semibold text-slate-100 text-sm flex items-center gap-2">
          <Dumbbell size={16} className="text-orange-400" />
          {exercise.name}
        </h4>
        <span className="text-[10px] font-medium bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
          {completedSets}/{exercise.sets.length} {t('workout.sets')}
        </span>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[40px_1fr_1fr_40px_32px] gap-2 items-center text-[10px] uppercase tracking-wider text-slate-500 px-1 mb-2">
        <span>{t('workoutLog.set') || 'Set'}</span>
        <span className="text-center">{t('workoutLog.weight')}</span>
        <span className="text-center">{t('workoutLog.reps')}</span>
        <span className="text-center">✓</span>
        <span />
      </div>

      {/* Set rows */}
      <AnimatePresence initial={false}>
        {exercise.sets.map((set, si) => (
          <motion.div
            key={si}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-[40px_1fr_1fr_40px_32px] gap-2 items-center mb-1.5"
          >
            {/* Set number */}
            <span className="text-xs font-semibold text-slate-500 text-center">
              {si + 1}
            </span>

            {/* Weight input */}
            <input
              type="number"
              inputMode="decimal"
              value={set.weight}
              onChange={(e) => handleSetChange(si, 'weight', e.target.value)}
              placeholder={planExercise?.weight || 'kg'}
              className="bg-slate-950 border border-slate-800 rounded-lg w-full text-center text-sm text-slate-100 py-1.5 placeholder-slate-600 focus:border-orange-500/50 transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />

            {/* Reps input */}
            <input
              type="number"
              inputMode="numeric"
              value={set.reps}
              onChange={(e) => handleSetChange(si, 'reps', e.target.value)}
              placeholder={planExercise?.reps || t('workout.reps')}
              className="bg-slate-950 border border-slate-800 rounded-lg w-full text-center text-sm text-slate-100 py-1.5 placeholder-slate-600 focus:border-orange-500/50 transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />

            {/* Complete toggle */}
            <button
              type="button"
              onClick={() => handleToggleComplete(si)}
              className="flex items-center justify-center cursor-pointer"
            >
              <CheckCircle
                size={20}
                className={
                  set.completed
                    ? 'text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]'
                    : 'text-slate-700 hover:text-slate-500'
                }
              />
            </button>

            {/* Remove set */}
            <button
              type="button"
              onClick={() => handleRemoveSet(si)}
              className="flex items-center justify-center cursor-pointer text-slate-700 hover:text-red-400 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Add set */}
      <motion.button
        type="button"
        onClick={handleAddSet}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs font-medium text-slate-400 hover:text-orange-400 bg-slate-950/60 border border-dashed border-slate-800 hover:border-orange-500/30 rounded-lg py-2 cursor-pointer transition-colors"
      >
        <Plus size={14} />
        {t('workoutLog.addSet')}
      </motion.button>
    </motion.div>
  );
}

/* ── HistoryView ──────────────────────────────────────── */
function HistoryView({ logs }) {
  const { t } = useTranslation();
  if (!logs || logs.length === 0) {
    return (
      <div className="text-center text-slate-500 text-sm py-8">
        {t('workoutLog.noHistory')}
      </div>
    );
  }

  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <motion.div
      className="flex flex-col gap-3"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {sorted.map((log, i) => {
        const volume = calcVolume(log.exercises);
        const totalSets = log.exercises?.reduce(
          (sum, ex) => sum + (ex.sets?.filter((s) => s.completed).length || 0),
          0
        ) || 0;

        return (
          <motion.div
            key={log.date + i}
            variants={cardVariants}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-slate-500" />
                <span className="text-sm font-semibold text-slate-200">
                  {log.date}
                </span>
              </div>
              <span className="text-[10px] font-semibold bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/20">
                {log.dayFocus}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <TrendingUp size={13} className="text-blue-400" />
                <span className="text-slate-300 font-medium">
                  {formatVolume(volume)} kg
                </span>{' '}
                {t('workoutLog.totalVolume')}
              </span>
              <span className="flex items-center gap-1">
                <Dumbbell size={13} className="text-orange-400" />
                <span className="text-slate-300 font-medium">{totalSets}</span>{' '}
                {t('workoutLog.setsCompleted')}
              </span>
            </div>

            {/* Exercise summary list */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {log.exercises?.map((ex, j) => (
                <span
                  key={j}
                  className="text-[10px] bg-slate-800/80 text-slate-400 px-2 py-0.5 rounded-full"
                >
                  {ex.name}
                </span>
              ))}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

/* ── Main Component ───────────────────────────────────── */
export default function WorkoutLog({ plan }) {
  const { t } = useTranslation();
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const todayName = dayNames[new Date().getDay()];
    // Find today among training days (rest days are filtered out)
    if (!plan?.workoutSplit) return 0;
    const training = plan.workoutSplit.filter(d => !isRestDay(d));
    const idx = training.findIndex(d => d.day === todayName);
    return idx >= 0 ? idx : 0;
  });
  const [workoutData, setWorkoutData] = useState({});
  const [showHistory, setShowHistory] = useState(false);
  const [logs, setLogs] = useState([]);
  const [saveFlash, setSaveFlash] = useState(false);

  // Filter out rest days
  const trainingDays = useMemo(() => {
    if (!plan?.workoutSplit) return [];
    return plan.workoutSplit.filter((d) => !isRestDay(d));
  }, [plan]);

  const activeDay = trainingDays[selectedDayIndex];

  // Load logs on mount
  useEffect(() => {
    setLogs(loadLogs());
  }, []);

  // Initialize workout data when day changes
  useEffect(() => {
    if (!activeDay?.exercises) return;

    setWorkoutData((prev) => {
      const key = activeDay.day + activeDay.focus;
      if (prev[key]) return prev;

      const exercises = activeDay.exercises.map((ex) => {
        const numSets = parseInt(ex.sets, 10) || 3;
        return {
          name: ex.name,
          sets: Array.from({ length: numSets }, () => ({
            weight: '',
            reps: '',
            completed: false,
          })),
        };
      });

      return { ...prev, [key]: exercises };
    });
  }, [activeDay]);

  const dayKey = activeDay ? activeDay.day + activeDay.focus : '';
  const currentExercises = workoutData[dayKey] || [];

  const handleExerciseUpdate = useCallback(
    (exerciseIndex, updatedExercise) => {
      setWorkoutData((prev) => {
        const exercises = [...(prev[dayKey] || [])];
        exercises[exerciseIndex] = updatedExercise;
        return { ...prev, [dayKey]: exercises };
      });
    },
    [dayKey]
  );

  // Stats
  const todayVolume = useMemo(() => calcVolume(currentExercises), [currentExercises]);
  const completedExercises = useMemo(() => {
    return currentExercises.filter((ex) =>
      ex.sets.some((s) => s.completed)
    ).length;
  }, [currentExercises]);

  // Save handler
  const handleSave = () => {
    if (!activeDay || currentExercises.length === 0) return;

    const entry = {
      date: getTodayStr(),
      dayFocus: activeDay.focus,
      exercises: currentExercises.map((ex) => ({
        name: ex.name,
        sets: ex.sets.map((s) => ({
          weight: Number(s.weight) || 0,
          reps: Number(s.reps) || 0,
          completed: !!s.completed,
        })),
      })),
    };

    const existing = loadLogs();
    // Replace if same date + focus already exists
    const idx = existing.findIndex(
      (l) => l.date === entry.date && l.dayFocus === entry.dayFocus
    );
    if (idx >= 0) {
      existing[idx] = entry;
    } else {
      existing.push(entry);
    }

    saveLogs(existing);
    setLogs(existing);
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1500);
  };

  if (!plan) return null;

  return (
    <section className="flex flex-col gap-5 h-full">
      {/* ─── Header ─── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-500/10">
            <Dumbbell size={20} className="text-orange-400" />
          </div>
          <div>
            <h2 className="font-outfit font-bold text-lg text-slate-100 leading-tight">
              {t('workoutLog.title')}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {t('workoutLog.subtitle')}
            </p>
          </div>
        </div>

        {/* History toggle */}
        <motion.button
          type="button"
          onClick={() => setShowHistory(!showHistory)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={[
            'flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border cursor-pointer transition-colors',
            showHistory
              ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
              : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:border-slate-600',
          ].join(' ')}
        >
          <History size={14} />
          {showHistory ? t('workoutLog.workout') : t('workoutLog.history')}
        </motion.button>
      </div>

      {/* ─── History View ─── */}
      <AnimatePresence mode="wait">
        {showHistory ? (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-y-auto pr-1"
          >
            <HistoryView logs={logs} />
          </motion.div>
        ) : (
          <motion.div
            key="workout"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4 flex-1 overflow-hidden"
          >
            {/* ─── Day Selector Pills ─── */}
            {trainingDays.length > 0 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                {trainingDays.map((day, i) => (
                  <motion.button
                    key={day.day + i}
                    type="button"
                    onClick={() => setSelectedDayIndex(i)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={[
                      'shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border cursor-pointer transition-all duration-200',
                      selectedDayIndex === i
                        ? 'bg-orange-500/10 text-orange-400 border-orange-500 shadow-[0_0_12px_rgba(255,109,0,0.15)]'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-300',
                    ].join(' ')}
                  >
                    {day.emoji && <span className="text-base">{day.emoji}</span>}
                    <span className="whitespace-nowrap">{day.day}</span>
                  </motion.button>
                ))}
              </div>
            )}

            {/* ─── Active Day Info ─── */}
            {activeDay && (
              <div className="flex items-center justify-between">
                <p className="font-outfit font-semibold text-sm text-slate-200">
                  {activeDay.focus}
                </p>
                <div className="flex items-center gap-3 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <TrendingUp size={12} className="text-blue-400" />
                    <span className="text-slate-300 font-semibold">
                      {formatVolume(todayVolume)} kg
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Dumbbell size={12} className="text-orange-400" />
                    <span className="text-slate-300 font-semibold">
                      {completedExercises}/{currentExercises.length}
                    </span>
                  </span>
                </div>
              </div>
            )}

            {/* ─── Exercise Cards ─── */}
            <motion.div
              className="flex flex-col gap-3 overflow-y-auto pr-1 flex-1"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <AnimatePresence mode="wait">
                {currentExercises.map((exercise, i) => (
                  <ExerciseCard
                    key={exercise.name + i}
                    exercise={exercise}
                    planExercise={activeDay?.exercises?.[i]}
                    exerciseIndex={i}
                    onUpdate={handleExerciseUpdate}
                  />
                ))}
              </AnimatePresence>
            </motion.div>

            {/* ─── Save Button ─── */}
            {currentExercises.length > 0 && (
              <motion.button
                type="button"
                onClick={handleSave}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className={[
                  'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-outfit font-semibold text-sm cursor-pointer transition-all duration-300',
                  saveFlash
                    ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(52,211,153,0.3)]'
                    : 'bg-gradient-to-r from-orange-500 to-blue-500 text-white shadow-[0_0_20px_rgba(255,109,0,0.2)]',
                ].join(' ')}
              >
                {saveFlash ? (
                  <>
                    <CheckCircle size={18} />
                    {t('workoutLog.saved')}
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    {t('workoutLog.saveWorkout')}
                  </>
                )}
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Footer Stats ─── */}
      <div className="mt-auto pt-3 border-t border-slate-800/60 flex items-center gap-2 text-xs text-slate-500">
        <Dumbbell size={14} className="text-slate-600" />
        <span>
          {t('workoutLog.today')}{' '}
          <span className="text-slate-400 font-medium">
            {formatVolume(todayVolume)} kg
          </span>{' '}
          {t('workoutLog.totalVolume')} ·{' '}
          <span className="text-slate-400 font-medium">
            {completedExercises}
          </span>{' '}
          {t('workoutLog.exercisesActive')} ·{' '}
          <span className="text-slate-400 font-medium">{logs.length}</span>{' '}
          {t('workoutLog.savedWorkouts')}
        </span>
      </div>
    </section>
  );
}
