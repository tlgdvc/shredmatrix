import { useState, useEffect } from 'react';
import { getWorkoutLogs, saveWorkoutLog } from '../lib/dataService';
import { useTranslation } from '../i18n/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  ChevronDown,
  Repeat,
  Hash,
  Timer,
  Dumbbell,
  Play,
} from 'lucide-react';

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 260, damping: 24 },
  },
};

const exerciseRowVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.045, type: 'spring', stiffness: 300, damping: 26 },
  }),
  exit: { opacity: 0, x: -12, transition: { duration: 0.15 } },
};

function isRestDay(day) {
  const focus = day.focus?.toLowerCase() ?? '';
  return (
    focus.includes('dinlenme') ||
    focus.includes('rest') ||
    focus.includes('off')
  );
}

function ExerciseRow({ exercise, index, t }) {
  const videoUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.name + ' form technique')}`;
  return (
    <motion.div
      custom={index}
      variants={exerciseRowVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="bg-slate-950 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3"
    >
      <span className="font-semibold text-slate-100 text-sm flex-1 min-w-0 truncate">
        {exercise.name}
      </span>

      <div className="flex items-center gap-3 shrink-0 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <Repeat size={13} className="text-orange-400" />
          <span className="text-slate-300">{exercise.sets}</span>
        </span>
        <span className="flex items-center gap-1">
          <Hash size={13} className="text-blue-400" />
          <span className="text-slate-300">{exercise.reps}</span>
        </span>
        <span className="flex items-center gap-1">
          <Timer size={13} className="text-emerald-400" />
          <span className="text-slate-300">{exercise.rest}</span>
        </span>
        <a
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={t('video.watch')}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:scale-110 transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          <Play size={10} fill="currentColor" />
        </a>
      </div>
    </motion.div>
  );
}

function DayCard({ day, index, isOpen, onToggle, t }) {
  const rest = isRestDay(day);
  const exerciseCount = day.exercises?.length ?? 0;

  return (
    <motion.div variants={cardVariants}>
      <div
        className={[
          'rounded-xl border transition-colors duration-200 overflow-hidden',
          rest
            ? 'bg-slate-900/50 border-slate-800/60'
            : 'bg-slate-900 border-slate-800 hover:border-slate-700',
          isOpen && !rest ? 'border-l-2 border-l-orange-500' : '',
        ].join(' ')}
      >
        {/* Workout image — shown when card is open and has an image */}
        <AnimatePresence initial={false}>
          {isOpen && !rest && day.image && (
            <motion.div
              key="image"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 140, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              className="relative overflow-hidden"
            >
              <img
                src={day.image}
                alt={day.focus}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                <span className="text-sm font-bold text-white font-outfit drop-shadow-lg">
                  {day.focus}
                </span>
                <span className="text-xs font-medium bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/30 backdrop-blur-sm">
                  {exerciseCount} {t('workout.totalExercises')}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed header */}
        <button
          type="button"
          onClick={() => onToggle(index)}
          className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer focus:outline-none"
        >
          <span className="text-xl leading-none">{day.emoji}</span>

          <div className="flex-1 min-w-0">
            <p
              className={[
                'font-outfit font-semibold text-sm truncate',
                rest ? 'text-slate-500' : 'text-slate-100',
              ].join(' ')}
            >
              {day.day}
            </p>
            <p
              className={[
                'text-xs truncate',
                rest ? 'text-slate-600' : 'text-slate-400',
              ].join(' ')}
            >
              {day.focus}
            </p>
          </div>

          {!rest && exerciseCount > 0 && !isOpen && (
            <span className="shrink-0 text-[10px] font-semibold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
              {exerciseCount} {t('workout.totalExercises')}
            </span>
          )}

          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="shrink-0"
          >
            <ChevronDown
              size={16}
              className={rest ? 'text-slate-600' : 'text-slate-400'}
            />
          </motion.span>
        </button>

        {/* Expanded exercises */}
        <AnimatePresence initial={false}>
          {isOpen && !rest && exerciseCount > 0 && (
            <motion.div
              key="content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 flex flex-col gap-2">
                {/* Column labels */}
                <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-500 px-3 pb-1">
                  <span>{t('workout.totalExercises')}</span>
                  <div className="flex gap-4">
                    <span>{t('workout.sets')}</span>
                    <span>{t('workout.reps')}</span>
                    <span>{t('workout.rest')}</span>
                  </div>
                </div>

                {day.exercises.map((exercise, i) => (
                  <ExerciseRow
                    key={exercise.name + i}
                    exercise={exercise}
                    index={i}
                    t={t}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {isOpen && rest && (
            <motion.div
              key="rest-content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4">
                <div className="bg-slate-950/60 rounded-lg p-4 text-center text-slate-500 text-sm">
                  {t('workout.restMsg')}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function WorkoutPanel({ plan }) {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState(0);
  const [completedDays, setCompletedDays] = useState({});

  // Load completed workouts from dataService
  useEffect(() => {
    getWorkoutLogs().then((saved) => {
      const today = new Date().toISOString().split('T')[0];
      const todayMap = {};
      saved.forEach((entry) => {
        if (entry.date === today) {
          todayMap[entry.dayFocus || entry.day_focus] = true;
        }
      });
      setCompletedDays(todayMap);
    }).catch(() => { /* ignore */ });
  }, []);

  if (!plan) return null;

  const { workoutSplit = [], goal = '' } = plan;

  const handleToggle = (index) => {
    setOpenIndex((prev) => (prev === index ? -1 : index));
  };

  const handleCompleteWorkout = async (day) => {
    const today = new Date().toISOString().split('T')[0];
    const focus = day.focus;

    // Check if already completed today
    if (completedDays[focus]) return;

    const entry = {
      date: today,
      dayFocus: focus,
      day_focus: focus,
      exercises: (day.exercises || []).map((ex) => ({
        name: ex.name,
        sets: Array.from({ length: parseInt(ex.sets) || 4 }, () => ({
          weight: 0,
          reps: parseInt(ex.reps) || 10,
          completed: true,
        })),
      })),
    };

    try {
      await saveWorkoutLog(entry);
      setCompletedDays((prev) => ({ ...prev, [focus]: true }));
    } catch { /* ignore */ }
  };

  const trainingDays = workoutSplit.filter((d) => !isRestDay(d));

  // Program age calculation
  const planCreatedAt = plan.createdAt || localStorage.getItem('shredmatrix_plan_created');
  const programAgeDays = planCreatedAt
    ? Math.floor((Date.now() - new Date(planCreatedAt).getTime()) / 86400000)
    : 0;
  const showProgramWarning = programAgeDays >= 90; // 3 months

  return (
    <section className="flex flex-col gap-5 h-full">
      {/* ─── Header ─── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-500/10">
            <Calendar size={20} className="text-orange-400" />
          </div>
          <div>
            <h2 className="font-outfit font-bold text-lg text-slate-100 leading-tight">
              {t('workout.title')}
            </h2>
            {goal && (
              <p className="text-xs text-slate-400 mt-0.5">
                {goal} {t('workout.program')}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="shrink-0 text-[10px] font-semibold bg-orange-500/10 text-orange-400 px-2.5 py-1 rounded-full border border-orange-500/20">
            {t('workout.weekly')} {trainingDays.length} {t('workout.days')}
          </span>
          <span className="shrink-0 text-[10px] font-semibold bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full border border-blue-500/20">
            7 {t('workout.split')}
          </span>
        </div>
      </div>

      {/* ─── Program age warning ─── */}
      {showProgramWarning && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <span className="text-amber-400 text-sm">⚠️</span>
          <p className="text-[11px] text-amber-300 flex-1">
            {t('workout.programWarning', { days: programAgeDays })}
          </p>
        </div>
      )}

      {/* ─── Day Cards ─── */}
      <motion.div
        className="flex flex-col gap-2.5 overflow-y-auto pr-1 custom-scrollbar"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {workoutSplit.map((day, index) => {
          const rest = isRestDay(day);
          const isDone = completedDays[day.focus];
          return (
            <div key={day.day + index}>
              <DayCard
                day={day}
                index={index}
                isOpen={openIndex === index}
                onToggle={handleToggle}
                t={t}
              />
              {/* Complete workout button — only for training days when card is open */}
              {openIndex === index && !rest && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-1"
                >
                  {isDone ? (
                    <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      <span className="text-base">✅</span>
                      <span className="text-xs font-semibold font-outfit">{t('workout.completed')}</span>
                    </div>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleCompleteWorkout(day)}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-bold font-outfit shadow-lg shadow-orange-500/20 cursor-pointer"
                    >
                      <Dumbbell size={16} />
                      {t('workout.completeBtn')}
                    </motion.button>
                  )}
                </motion.div>
              )}
            </div>
          );
        })}
      </motion.div>

      {/* ─── Footer ─── */}
      <div className="mt-auto pt-3 border-t border-slate-800/60 flex items-center gap-2 text-xs text-slate-500">
        <Dumbbell size={14} className="text-slate-600" />
        <span>
          {t('workout.total')}{' '}
          <span className="text-slate-400 font-medium">
            {workoutSplit.reduce(
              (sum, d) => sum + (d.exercises?.length ?? 0),
              0
            )}
          </span>{' '}
          {t('workout.totalExercises')} · {trainingDays.length} {t('workout.trainingDays')} · 
          {workoutSplit.length - trainingDays.length} {t('workout.restDays')}
        </span>
      </div>
    </section>
  );
}
