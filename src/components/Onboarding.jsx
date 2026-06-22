import { useState } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Armchair,
  Footprints,
  Bike,
  Dumbbell,
  Flame,
  TrendingUp,
  User,
  Ruler,
  ChevronRight,
  ChevronLeft,
  Briefcase,
  Clock,
  Wallet,
  BadgeCheck,
  Brain,
  Flower2,
  Circle,
  Wrench,
  Sparkles,
  Heart,
  UtensilsCrossed,
} from 'lucide-react';

// ── Step Configuration ───────────────────────────────────
const STEP_IDS = ['personal', 'body', 'activity', 'goal', 'health', 'allergies', 'lifestyle'];
const STEP_ICONS = [User, Ruler, Footprints, TrendingUp, Heart, UtensilsCrossed, Briefcase];

// ── Animation Variants ───────────────────────────────────
const pageVariants = {
  enter: (dir) => ({ x: dir > 0 ? 15 : -15, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir < 0 ? 15 : -15, opacity: 0 }),
};

// ── Slider Component (FIXED) ─────────────────────────────
function SliderInput({ label, value, onChange, min, max, unit, step = 1 }) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-medium text-slate-400 font-outfit">{label}</label>
        <motion.span
          key={value}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="bg-gradient-to-r from-orange-500 to-blue-500 text-white text-sm font-bold px-3 py-1 rounded-lg shadow-lg shadow-orange-500/20"
        >
          {value} {unit}
        </motion.span>
      </div>

      {/* Single native range input — styled via CSS */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slider-input w-full"
        style={{ '--fill': `${percentage}%` }}
      />

      <div className="flex justify-between text-[10px] text-slate-600 mt-1.5">
        <span>{min} {unit}</span>
        <span>{max} {unit}</span>
      </div>
    </div>
  );
}

// ── Card Selector ────────────────────────────────────────
function SelectCard({ selected, onClick, children, className = '' }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className={[
        'relative flex flex-col items-center gap-2 p-4 rounded-2xl border text-center transition-all duration-200 cursor-pointer',
        selected
          ? 'bg-slate-900 border-orange-500 shadow-[0_0_24px_rgba(249,115,22,0.15)]'
          : 'bg-slate-900 border-slate-800 hover:border-slate-700',
        className,
      ].join(' ')}
    >
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2"
        >
          <BadgeCheck size={16} className="text-orange-400" />
        </motion.div>
      )}
      {children}
    </motion.button>
  );
}

// ═════════════════════════════════════════════════════════
// Onboarding Component
// ═════════════════════════════════════════════════════════
export default function Onboarding({ onSubmit }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  // Translated data arrays (need t() from hook)
  const STEPS = STEP_IDS.map((id, i) => ({
    id,
    label: t(`onboarding.step${i + 1}.title`),
    icon: STEP_ICONS[i],
  }));

  const genderOptions = [
    { value: 'male', label: t('onboarding.fields.male'), emoji: '♂️', color: '#00b0ff' },
    { value: 'female', label: t('onboarding.fields.female'), emoji: '♀️', color: '#f472b6' },
  ];

  const experienceLevels = [
    { value: 'beginner', label: t('onboarding.fields.beginner'), desc: t('onboarding.fields.expBeginner'), emoji: '🌱' },
    { value: 'intermediate', label: t('onboarding.fields.intermediate'), desc: t('onboarding.fields.expIntermediate'), emoji: '💪' },
    { value: 'advanced', label: t('onboarding.fields.advanced'), desc: t('onboarding.fields.expAdvanced'), emoji: '🔥' },
  ];

  const activityLevels = [
    { value: 'sedentary', icon: Armchair, label: t('onboarding.fields.sedentary'), desc: '' },
    { value: 'light', icon: Footprints, label: t('onboarding.fields.light'), desc: '' },
    { value: 'moderate', icon: Bike, label: t('onboarding.fields.moderate'), desc: '' },
    { value: 'active', icon: Dumbbell, label: t('onboarding.fields.active'), desc: '' },
    { value: 'athlete', icon: Flame, label: t('onboarding.fields.veryActive'), desc: '' },
  ];

  const goals = [
    { value: 'muscle', icon: TrendingUp, label: t('onboarding.fields.muscle'), desc: '', color: '#ff6d00' },
    { value: 'fat_loss', icon: Flame, label: t('onboarding.fields.fatLoss'), desc: '', color: '#00b0ff' },
    { value: 'yoga', icon: Flower2, label: t('onboarding.fields.yoga'), desc: t('onboarding.fields.yogaDesc'), color: '#a855f7' },
    { value: 'pilates', icon: Circle, label: t('onboarding.fields.pilates'), desc: t('onboarding.fields.pilatesDesc'), color: '#ec4899' },
    { value: 'reformer', icon: Wrench, label: t('onboarding.fields.reformer'), desc: t('onboarding.fields.reformerDesc'), color: '#14b8a6' },
    { value: 'meditation', icon: Brain, label: t('onboarding.fields.meditation'), desc: t('onboarding.fields.meditationDesc'), color: '#8b5cf6' },
  ];

  const workSchedules = [
    { value: 'morning', label: t('onboarding.fields.morning'), desc: '06:00 – 14:00', emoji: '🌅' },
    { value: 'afternoon', label: t('onboarding.fields.afternoon'), desc: '14:00 – 18:00', emoji: '☀️' },
    { value: 'evening', label: t('onboarding.fields.evening'), desc: '16:00 – 00:00', emoji: '🌙' },
    { value: 'flexible', label: t('onboarding.fields.flexible'), desc: '', emoji: '🔄' },
  ];

  const budgetOptions = [
    { value: 'economy', label: t('onboarding.fields.low'), desc: '', emoji: '💚', color: '#22c55e' },
    { value: 'moderate', label: t('onboarding.fields.mid'), desc: '', emoji: '💰', color: '#f59e0b' },
    { value: 'premium', label: t('onboarding.fields.high'), desc: '', emoji: '💎', color: '#a855f7' },
  ];

  // Health condition options
  const healthOptions = [
    { value: 'back_pain', label: t('onboarding.fields.back_pain'), emoji: '🪶' },
    { value: 'knee_issue', label: t('onboarding.fields.knee_issue'), emoji: '🦵' },
    { value: 'shoulder_injury', label: t('onboarding.fields.shoulder_injury'), emoji: '💪' },
    { value: 'wrist_issue', label: t('onboarding.fields.wrist_issue'), emoji: '✋' },
    { value: 'heart_condition', label: t('onboarding.fields.heart_condition'), emoji: '❤️' },
    { value: 'none', label: t('onboarding.fields.noHealthIssue'), emoji: '✅' },
  ];

  // Food allergy options
  const allergyOptions = [
    { value: 'lactose', label: t('onboarding.fields.lactose'), emoji: '🥛' },
    { value: 'gluten', label: t('onboarding.fields.gluten'), emoji: '🌾' },
    { value: 'egg', label: t('onboarding.fields.egg'), emoji: '🥚' },
    { value: 'nuts', label: t('onboarding.fields.nuts'), emoji: '🥜' },
    { value: 'seafood', label: t('onboarding.fields.seafood'), emoji: '🐟' },
    { value: 'vegan', label: t('onboarding.fields.vegan'), emoji: '🌱' },
    { value: 'vegetarian', label: t('onboarding.fields.vegetarian'), emoji: '🥬' },
    { value: 'none', label: t('onboarding.fields.noAllergy'), emoji: '✅' },
  ];

  // Multi-select toggle helper
  const toggleMultiSelect = (arr, setArr, value) => {
    if (value === 'none') {
      setArr(['none']);
      return;
    }
    const without = arr.filter((v) => v !== 'none');
    if (without.includes(value)) {
      setArr(without.filter((v) => v !== value));
    } else {
      setArr([...without, value]);
    }
  };

  // Form state
  const [name, setName] = useState('');
  const [age, setAge] = useState(25);
  const [gender, setGender] = useState('male');
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(75);
  const [bodyFatPercentage, setBodyFatPercentage] = useState(20);
  const [experience, setExperience] = useState('intermediate');
  const [activityLevel, setActivityLevel] = useState('moderate');
  const [primaryGoal, setPrimaryGoal] = useState('muscle');
  const [healthConditions, setHealthConditions] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [workSchedule, setWorkSchedule] = useState([]);
  const [budget, setBudget] = useState('moderate');

  const canNext = () => {
    switch (step) {
      case 0: return name.trim().length > 0 && gender;
      case 1: return weight > 0 && height > 0;
      case 2: return activityLevel && experience;
      case 3: return primaryGoal;
      case 4: return healthConditions.length > 0;
      case 5: return allergies.length > 0;
      case 6: return workSchedule.length > 0 && budget;
      default: return true;
    }
  };

  const nextStep = () => {
    if (step < STEPS.length - 1 && canNext()) {
      setDirection(1);
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setDirection(-1);
      setStep(step - 1);
    }
  };

  const goToStep = (idx) => {
    // Only allow going to completed or current steps
    if (idx <= step) {
      setDirection(idx > step ? 1 : -1);
      setStep(idx);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canNext()) return;
    onSubmit({
      name, age, gender, height, weight,
      bodyFatPercentage, experience, activityLevel,
      primaryGoal, workSchedule, budget,
      healthConditions, allergies,
    });
  };

  const progress = ((step + 1) / STEPS.length) * 100;
  const bmi = weight > 0 && height > 0 ? (weight / ((height / 100) ** 2)).toFixed(1) : '—';
  const bmiCategory = (() => {
    const val = parseFloat(bmi);
    if (isNaN(val)) return '';
    if (val < 18.5) return t('onboarding.fields.bmiUnderweight');
    if (val < 25) return t('onboarding.fields.bmiNormal');
    if (val < 30) return t('onboarding.fields.bmiOverweight');
    return t('onboarding.fields.bmiObese');
  })();

  return (
    <div className="min-h-screen bg-slate-950 bg-grid text-white flex flex-col items-center justify-center px-4 py-8">
      <form onSubmit={handleSubmit} className="w-full max-w-2xl">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-6xl font-extrabold font-outfit tracking-tighter bg-gradient-to-r from-orange-500 via-amber-400 to-blue-500 bg-clip-text text-transparent mb-2">
            FULL BALANCE
          </h1>
          <p className="text-slate-500 text-sm font-outfit">
            {t('onboarding.step1.subtitle')}
          </p>
        </motion.div>

        {/* ── Progress Bar ── */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === step;
              const isDone = i < step;
              return (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => goToStep(i)}
                  className={[
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                    i <= step ? 'cursor-pointer' : 'cursor-not-allowed opacity-50',
                    isActive
                      ? 'bg-orange-500/15 border border-orange-500/30 text-orange-400'
                      : isDone
                        ? 'bg-slate-800 border border-slate-700 text-emerald-400'
                        : 'bg-slate-900 border border-slate-800 text-slate-600',
                  ].join(' ')}
                >
                  <Icon size={13} />
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
              );
            })}
          </div>
          <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-blue-500"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
            />
          </div>
        </div>

        {/* ── Step Content ── */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 md:p-8 min-h-[440px] flex flex-col">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 flex flex-col"
            >
              {/* ─── STEP 0: Kişisel ───────────────────── */}
              {step === 0 && (
                <div className="space-y-6 flex-1">
                  <div>
                    <h2 className="text-xl font-bold font-outfit text-white mb-1">{t('onboarding.step1.title')}</h2>
                    <p className="text-sm text-slate-500">{t('onboarding.step1.subtitle')}</p>
                  </div>

                  {/* Name */}
                  <div>
                    <label htmlFor="name-input" className="block text-sm font-medium text-slate-400 mb-2 font-outfit">{t('onboarding.fields.name')}</label>
                    <input
                      id="name-input"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('onboarding.fields.namePlaceholder')}
                      autoComplete="name"
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30 transition-colors font-outfit"
                    />
                  </div>

                  {/* Age */}
                  <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/50">
                    <SliderInput label={t('onboarding.fields.age')} value={age} onChange={setAge} min={16} max={65} unit="" />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-3 font-outfit">{t('onboarding.fields.gender')}</label>
                    <div className="grid grid-cols-2 gap-3">
                      {genderOptions.map((g) => {
                        const sel = gender === g.value;
                        return (
                          <SelectCard key={g.value} selected={sel} onClick={() => setGender(g.value)}>
                            <span className="text-3xl">{g.emoji}</span>
                            <span className={`text-sm font-semibold font-outfit ${sel ? 'text-white' : 'text-slate-400'}`}>
                              {g.label}
                            </span>
                          </SelectCard>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ─── STEP 1: Vücut ────────────────────── */}
              {step === 1 && (
                <div className="space-y-5 flex-1">
                  <div>
                    <h2 className="text-xl font-bold font-outfit text-white mb-1">{t('onboarding.step2.title')}</h2>
                    <p className="text-sm text-slate-500">{t('onboarding.step2.subtitle')}</p>
                  </div>

                  <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/50">
                    <SliderInput label={t('onboarding.fields.height')} value={height} onChange={setHeight} min={140} max={220} unit="cm" />
                  </div>

                  <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/50">
                    <SliderInput label={t('onboarding.fields.weight')} value={weight} onChange={setWeight} min={40} max={200} unit="kg" />
                  </div>

                  <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/50">
                    <SliderInput label={t('onboarding.fields.bodyFat')} value={bodyFatPercentage} onChange={setBodyFatPercentage} min={5} max={50} unit="%" />
                  </div>

                  {/* Live BMI indicator */}
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-950/70 border border-slate-800/50">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10">
                      <Ruler size={18} className="text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">{t('onboarding.fields.bmiLabel')}</p>
                      <p className="text-lg font-bold font-outfit text-white">
                        {bmi}
                        {bmiCategory && (
                          <span className="ml-2 text-xs font-normal text-slate-500">{bmiCategory}</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── STEP 2: Aktivite ─────────────────── */}
              {step === 2 && (
                <div className="space-y-6 flex-1">
                  <div>
                    <h2 className="text-xl font-bold font-outfit text-white mb-1">{t('onboarding.step3.title')}</h2>
                    <p className="text-sm text-slate-500">{t('onboarding.step3.subtitle')}</p>
                  </div>

                  {/* Experience */}
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-3 font-outfit">{t('onboarding.fields.experience')}</label>
                    <div className="grid grid-cols-3 gap-3">
                      {experienceLevels.map((lvl) => {
                        const sel = experience === lvl.value;
                        return (
                          <SelectCard key={lvl.value} selected={sel} onClick={() => setExperience(lvl.value)}>
                            <span className="text-2xl">{lvl.emoji}</span>
                            <span className={`text-sm font-semibold font-outfit ${sel ? 'text-white' : 'text-slate-400'}`}>
                              {lvl.label}
                            </span>
                            <span className="text-[10px] text-slate-600">{lvl.desc}</span>
                          </SelectCard>
                        );
                      })}
                    </div>
                  </div>

                  {/* Activity Level */}
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-3 font-outfit">{t('onboarding.fields.activityLevel')}</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                      {activityLevels.map((level) => {
                        const Icon = level.icon;
                        const sel = activityLevel === level.value;
                        return (
                          <SelectCard key={level.value} selected={sel} onClick={() => setActivityLevel(level.value)} className="p-3">
                            <Icon size={22} className={sel ? 'text-orange-400' : 'text-slate-500'} />
                            <span className={`text-xs font-semibold font-outfit ${sel ? 'text-white' : 'text-slate-400'}`}>
                              {level.label}
                            </span>
                            <span className="text-[9px] text-slate-600 leading-tight">{level.desc}</span>
                          </SelectCard>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ─── STEP 3: Hedef ────────────────────── */}
              {step === 3 && (
                <div className="space-y-6 flex-1">
                  <div>
                    <h2 className="text-xl font-bold font-outfit text-white mb-1">{t('onboarding.step4.title')}</h2>
                    <p className="text-sm text-slate-500">{t('onboarding.step4.subtitle')}</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {goals.map((goal) => {
                      const Icon = goal.icon;
                      const sel = primaryGoal === goal.value;
                      return (
                        <motion.button
                          type="button"
                          key={goal.value}
                          onClick={() => setPrimaryGoal(goal.value)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          className={[
                            'relative flex flex-col items-center gap-2 p-4 rounded-2xl border text-center transition-all duration-200 cursor-pointer',
                            sel
                              ? 'bg-slate-900 border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.15)]'
                              : 'bg-slate-900 border-slate-800 hover:border-slate-700',
                          ].join(' ')}
                        >
                          {sel && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-3 right-3">
                              <BadgeCheck size={18} className="text-orange-400" />
                            </motion.div>
                          )}
                          <div className={`p-3 rounded-2xl ${sel ? 'bg-orange-500/10' : 'bg-slate-800'}`}>
                            <Icon size={28} style={{ color: sel ? goal.color : '#64748b' }} />
                          </div>
                          <div>
                            <span className={`block text-sm font-bold font-outfit ${sel ? 'text-white' : 'text-slate-300'}`}>
                              {goal.label}
                            </span>
                            <span className="text-xs text-slate-500 mt-1 block">{goal.desc}</span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Motivational note */}
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-orange-500/5 border border-orange-500/10">
                    <Flame size={18} className="text-orange-400 shrink-0" />
                    <p className="text-xs text-slate-400">
                      {primaryGoal === 'muscle'
                        ? t('onboarding.fields.muscleDesc')
                        : primaryGoal === 'fat_loss'
                          ? t('onboarding.fields.fatLossDesc')
                          : primaryGoal === 'yoga'
                            ? t('onboarding.fields.yogaGoalDesc')
                            : primaryGoal === 'pilates'
                              ? t('onboarding.fields.pilatesGoalDesc')
                              : primaryGoal === 'reformer'
                                ? t('onboarding.fields.reformerGoalDesc')
                                : t('onboarding.fields.meditationGoalDesc')}
                    </p>
                  </div>
                </div>
              )}

              {/* ─── STEP 4: Sağlık Durumu ──────────── */}
              {step === 4 && (
                <div className="space-y-6 flex-1">
                  <div>
                    <h2 className="text-xl font-bold font-outfit text-white mb-1">{t('onboarding.step5.title')}</h2>
                    <p className="text-sm text-slate-500">{t('onboarding.fields.healthSubtitle')}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-3 font-outfit">
                      {t('onboarding.fields.healthTitle')}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {healthOptions.map((opt) => {
                        const sel = healthConditions.includes(opt.value);
                        return (
                          <SelectCard
                            key={opt.value}
                            selected={sel}
                            onClick={() => toggleMultiSelect(healthConditions, setHealthConditions, opt.value)}
                          >
                            <span className="text-2xl">{opt.emoji}</span>
                            <span className={`text-sm font-semibold font-outfit ${sel ? 'text-white' : 'text-slate-400'}`}>
                              {opt.label}
                            </span>
                          </SelectCard>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ─── STEP 5: Gıda Alerjileri ────────── */}
              {step === 5 && (
                <div className="space-y-6 flex-1">
                  <div>
                    <h2 className="text-xl font-bold font-outfit text-white mb-1">{t('onboarding.step6.title')}</h2>
                    <p className="text-sm text-slate-500">{t('onboarding.fields.allergySubtitle')}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-3 font-outfit">
                      {t('onboarding.fields.allergyTitle')}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {allergyOptions.map((opt) => {
                        const sel = allergies.includes(opt.value);
                        return (
                          <SelectCard
                            key={opt.value}
                            selected={sel}
                            onClick={() => toggleMultiSelect(allergies, setAllergies, opt.value)}
                          >
                            <span className="text-2xl">{opt.emoji}</span>
                            <span className={`text-sm font-semibold font-outfit ${sel ? 'text-white' : 'text-slate-400'}`}>
                              {opt.label}
                            </span>
                          </SelectCard>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ─── STEP 6: Yaşam Tarzı ──────────────── */}
              {step === 6 && (
                <div className="space-y-6 flex-1">
                  <div>
                    <h2 className="text-xl font-bold font-outfit text-white mb-1">{t('onboarding.step7.title')}</h2>
                    <p className="text-sm text-slate-500">{t('onboarding.step7.subtitle')}</p>
                  </div>

                  {/* Work Schedule */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-400 mb-3 font-outfit">
                      <Clock size={14} />
                      {t('onboarding.fields.workSchedule')}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {workSchedules.map((ws) => {
                        const sel = workSchedule.includes(ws.value);
                        const isFlexible = ws.value === 'flexible';
                        return (
                          <SelectCard
                            key={ws.value}
                            selected={sel}
                            onClick={() => {
                              if (isFlexible) {
                                setWorkSchedule(['flexible']);
                              } else {
                                const without = workSchedule.filter((v) => v !== 'flexible');
                                if (without.includes(ws.value)) {
                                  setWorkSchedule(without.filter((v) => v !== ws.value));
                                } else if (without.length < 2) {
                                  setWorkSchedule([...without, ws.value]);
                                } else {
                                  setWorkSchedule([without[1], ws.value]);
                                }
                              }
                            }}
                            className="p-3"
                          >
                            <span className="text-xl">{ws.emoji}</span>
                            <span className={`text-xs font-semibold font-outfit ${sel ? 'text-white' : 'text-slate-400'}`}>
                              {ws.label}
                            </span>
                            <span className="text-[9px] text-slate-600">{ws.desc}</span>
                          </SelectCard>
                        );
                      })}
                    </div>
                  </div>

                  {/* Budget */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-400 mb-3 font-outfit">
                      <Wallet size={14} />
                      {t('onboarding.fields.budget')}
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {budgetOptions.map((b) => {
                        const sel = budget === b.value;
                        return (
                          <SelectCard key={b.value} selected={sel} onClick={() => setBudget(b.value)} className="p-4">
                            <span className="text-2xl">{b.emoji}</span>
                            <span className={`text-sm font-semibold font-outfit ${sel ? 'text-white' : 'text-slate-400'}`}>
                              {b.label}
                            </span>
                            <span className="text-[10px] font-medium" style={{ color: sel ? b.color : '#64748b' }}>
                              {b.desc}
                            </span>
                          </SelectCard>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary preview */}
                  <div className="px-4 py-3 rounded-xl bg-slate-950/70 border border-slate-800/50">
                    <p className="text-xs text-slate-500 mb-2 font-outfit font-medium">{t('onboarding.fields.summary')}</p>
                    <div className="flex flex-wrap gap-2 text-[10px]">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">{name || '?'}</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">{age} {t('onboarding.fields.ageUnit')}</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">{gender === 'male' ? t('onboarding.fields.male') : t('onboarding.fields.female')}</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">{height}cm / {weight}kg</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">%{bodyFatPercentage} {t('onboarding.fields.fatUnit')}</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">BMI: {bmi}</span>
                      <span className="px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400">
                        {goals.find(g => g.value === primaryGoal)?.label || primaryGoal}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* ── Navigation ── */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800/50">
            <motion.button
              type="button"
              onClick={prevStep}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={[
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer',
                step === 0
                  ? 'opacity-0 pointer-events-none'
                  : 'bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700',
              ].join(' ')}
            >
              <ChevronLeft size={16} />
              {t('onboarding.prev')}
            </motion.button>

            <span className="text-xs text-slate-600 font-outfit hidden sm:inline">
              {step + 1} / {STEPS.length}
            </span>

            {step < STEPS.length - 1 ? (
              <motion.button
                type="button"
                onClick={nextStep}
                disabled={!canNext()}
                whileHover={canNext() ? { scale: 1.03 } : {}}
                whileTap={canNext() ? { scale: 0.97 } : {}}
                className={[
                  'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer',
                  canNext()
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30'
                    : 'bg-slate-800 text-slate-600 cursor-not-allowed',
                ].join(' ')}
              >
                {t('onboarding.next')}
                <ChevronRight size={16} />
              </motion.button>
            ) : (
              <motion.button
                type="submit"
                disabled={!canNext()}
                whileHover={{ scale: 1.03, boxShadow: '0 0 32px rgba(249,115,22,0.35)' }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white text-sm font-bold font-outfit tracking-wide cursor-pointer shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-shadow"
              >
                {t('onboarding.generate')}
                <Sparkles size={16} />
              </motion.button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
