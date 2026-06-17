import { useState } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { mealNameMap, getMealAlternatives, currencyMap, recipeSearchSuffix, MEAL_KEYS } from '../data/mealDatabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Utensils,
  Beef,
  Wheat,
  Droplets,
  Coffee,
  Apple,
  ChefHat,
  Dumbbell,
  Moon,
  Clock,
  Info,
  Wallet,
  Flame,
  Shuffle,
  Play,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const MACRO_COLORS = {
  protein: '#ff6d00',
  carbs: '#00b0ff',
  fat: '#a855f7',
};

const mealIconsByKey = {
  breakfast: Coffee,
  snack: Apple,
  lunch: ChefHat,
  preWorkout: Dumbbell,
  dinner: Moon,
  afternoonSnack: Coffee,
};

/* ─── animation variants ─── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const slideVariants = {
  enter: (direction) => ({ x: direction > 0 ? 15 : -15, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction) => ({ x: direction < 0 ? 15 : -15, opacity: 0 }),
};

/* ─── custom tooltip ─── */
function MacroTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm shadow-xl">
      <span className="text-slate-300">{name}: </span>
      <span className="font-semibold text-white">{value}g</span>
    </div>
  );
}

/* ─── macro stat card ─── */
function MacroCard({ icon: Icon, label, grams, percentage, color }) {
  return (
    <motion.div
      variants={cardVariants}
      className="flex flex-1 flex-col items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 p-3"
    >
      <div
        className="flex h-8 w-8 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${color}18` }}
      >
        <Icon size={16} style={{ color }} />
      </div>
      <span className="text-[10px] text-slate-400">{label}</span>
      <span className="text-base font-bold text-white font-outfit">{grams}g</span>
      <span
        className="rounded-full px-2 py-0.5 text-[10px] font-medium"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {percentage}%
      </span>
    </motion.div>
  );
}

function getAlternativeItems(meal, altIndex, lang) {
  const mealAlternatives = getMealAlternatives(lang);
  const key = meal.mealKey;
  if (key && mealAlternatives[key]) {
    return mealAlternatives[key][altIndex % mealAlternatives[key].length] || null;
  }
  return null;
}

/* ─── meal card with image ─── */
function MealCard({ meal, index, t, lang, currency }) {
  const MealIcon = mealIconsByKey[meal.mealKey] || Utensils;
  const [altIndex, setAltIndex] = useState(0);
  const isSwapped = altIndex > 0;
  const altItems = isSwapped ? getAlternativeItems(meal, altIndex - 1, lang) : null;
  const displayItems = altItems || meal.items;

  return (
    <motion.div
      variants={cardVariants}
      custom={index}
      className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden"
    >
      {/* Meal image */}
      {meal.image && (
        <div className="relative h-36 w-full overflow-hidden">
          <img
            src={meal.image}
            alt={meal.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
          {/* Floating badges */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <span className="flex items-center gap-1 rounded-full bg-slate-950/80 backdrop-blur-sm border border-slate-700/50 px-2.5 py-1 text-xs font-bold text-white">
              <Flame size={12} className="text-orange-400" />
              {meal.calories} kcal
            </span>
            {meal.price && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 backdrop-blur-sm border border-emerald-500/30 px-2.5 py-1 text-xs font-bold text-emerald-400">
                <Wallet size={11} />
                {currency}{meal.price}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="p-4">
        {/* header */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <MealIcon size={16} className="text-orange-400" />
            <h4 className="font-outfit font-semibold text-white text-sm">{meal.name}</h4>
            <a
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(displayItems.join(' ') + ' ' + (recipeSearchSuffix[lang] || recipeSearchSuffix.tr))}`}
              target="_blank"
              rel="noopener noreferrer"
              title={t('video.watch')}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:scale-110 transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              <Play size={8} fill="currentColor" />
            </a>
          </div>
          <div className="flex items-center gap-1.5">
            <motion.button
              whileHover={{ rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setAltIndex((prev) => prev + 1)}
              className={[
                'flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] cursor-pointer transition-colors',
                isSwapped
                  ? 'bg-blue-500/15 border border-blue-500/30 text-blue-400'
                  : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white',
              ].join(' ')}
              title={t('nutrition.swapTooltip') || 'Show alternative meal'}
            >
              <Shuffle size={9} />
              {isSwapped ? t('nutrition.altLabel') : t('nutrition.swap')}
            </motion.button>
            {meal.note && (
              <span className="flex items-center gap-1 rounded-full bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 text-[9px] text-orange-400">
                <Info size={9} />
                {meal.note}
              </span>
            )}
            <span className="flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
              <Clock size={9} />
              {meal.time}
            </span>
          </div>
        </div>

        {/* food items */}
        <ul className="mb-3 space-y-1">
          {displayItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-600" />
              {item}
            </li>
          ))}
        </ul>

        {/* macro badges */}
        <div className="flex items-center gap-2 text-[11px] font-medium">
          <span
            className="rounded-full px-2 py-0.5"
            style={{ backgroundColor: `${MACRO_COLORS.protein}20`, color: MACRO_COLORS.protein }}
          >
            P: {meal.protein}g
          </span>
          <span
            className="rounded-full px-2 py-0.5"
            style={{ backgroundColor: `${MACRO_COLORS.carbs}20`, color: MACRO_COLORS.carbs }}
          >
            C: {meal.carbs}g
          </span>
          <span
            className="rounded-full px-2 py-0.5"
            style={{ backgroundColor: `${MACRO_COLORS.fat}20`, color: MACRO_COLORS.fat }}
          >
            F: {meal.fat}g
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   NutritionPanel – main export
   ═══════════════════════════════════════════ */
export default function NutritionPanel({ plan }) {
  const { t, lang } = useTranslation();
  const {
    bmr,
    tdee,
    macroPercentages,
    dailyNutrition,
    goal,
  } = plan;

  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [direction, setDirection] = useState(0);

  if (!dailyNutrition || !dailyNutrition.length) return null;

  const dayData = dailyNutrition[selectedDayIdx];
  if (!dayData) return null;
  const { calories: dayCalories, macros, meals, totalPrice, mealLabel, day: dayName, emoji, focus } = dayData;

  const donutData = [
    { name: t('nutrition.protein'), value: macros.protein },
    { name: t('nutrition.carbs'), value: macros.carbs },
    { name: t('nutrition.fat'), value: macros.fat },
  ];
  const donutColors = [MACRO_COLORS.protein, MACRO_COLORS.carbs, MACRO_COLORS.fat];

  const goToDay = (idx) => {
    setDirection(idx > selectedDayIdx ? 1 : -1);
    setSelectedDayIdx(idx);
  };

  const prev = () => {
    const idx = selectedDayIdx === 0 ? dailyNutrition.length - 1 : selectedDayIdx - 1;
    setDirection(-1);
    setSelectedDayIdx(idx);
  };

  const next = () => {
    const idx = selectedDayIdx === dailyNutrition.length - 1 ? 0 : selectedDayIdx + 1;
    setDirection(1);
    setSelectedDayIdx(idx);
  };

  // Haftalık toplam maliyet
  const weeklyPrice = dailyNutrition.reduce((s, d) => s + d.totalPrice, 0);

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-5"
    >
      {/* ── header ── */}
      <motion.div variants={cardVariants}>
        <div className="mb-1 flex items-center gap-2">
          <Utensils size={20} className="text-orange-400" />
          <h2 className="font-outfit text-xl font-bold text-white">{t('nutrition.title')}</h2>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          {t('nutrition.subtitle')}
        </p>
      </motion.div>

      {/* ── Day Selector ── */}
      <motion.div variants={cardVariants} className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        {/* Day pills — full-width grid, no arrows */}
        <div className="grid grid-cols-7 gap-1.5 mb-4">
          {dailyNutrition.map((d, i) => {
            const isActive = i === selectedDayIdx;
            const isRest = d.mealType === 'rest';
            return (
              <button
                key={i}
                onClick={() => goToDay(i)}
                className={[
                  'flex flex-col items-center justify-center py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-semibold transition-all duration-200 cursor-pointer',
                  isActive
                    ? 'bg-gradient-to-b from-orange-500/25 to-orange-500/5 border-2 border-orange-500/50 text-white shadow-lg shadow-orange-500/10'
                    : isRest
                      ? 'bg-slate-800/40 border border-slate-800 text-slate-600 hover:text-slate-400'
                      : 'bg-slate-800/80 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700/80',
                ].join(' ')}
              >
                <span className="text-base sm:text-lg leading-none mb-0.5">{d.emoji}</span>
                <span>{d.day.slice(0, 2)}</span>
              </button>
            );
          })}
        </div>

        {/* Selected day info */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-white font-outfit">
              {emoji} {dayName} — <span className="text-orange-400">{focus}</span>
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{mealLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold bg-orange-500/10 text-orange-400 px-2.5 py-1 rounded-full border border-orange-500/20">
              {dayCalories} kcal
            </span>
            <span className="flex items-center gap-1 text-xs font-bold bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <Wallet size={11} />
              {currencyMap[lang] || '₺'}{totalPrice}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── Stats badges ── */}
      <motion.div variants={cardVariants} className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-[11px] text-slate-400">
          BMR: {bmr} kcal
        </span>
        <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-[11px] text-slate-400">
          TDEE: {tdee} kcal
        </span>
        <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-0.5 text-[11px] font-medium text-orange-400">
          {goal}
        </span>
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
          {t('nutrition.weeklyCost')} ≈ {currencyMap[lang] || '₺'}{weeklyPrice}
        </span>
      </motion.div>

      {/* ── donut chart ── */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={selectedDayIdx + '-chart'}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
        >
          <h3 className="mb-3 font-outfit text-sm font-semibold text-slate-300">
            {t('nutrition.macroDistribution')} — {dayName}
          </h3>

          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                dataKey="value"
                stroke="none"
                paddingAngle={3}
                label={false}
              >
                {donutData.map((_, idx) => (
                  <Cell key={idx} fill={donutColors[idx]} />
                ))}
              </Pie>
              <Tooltip content={<MacroTooltip />} />
              <text
                x="50%"
                y="44%"
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-white text-xl font-bold font-outfit"
              >
                {dayCalories.toLocaleString()}
              </text>
              <text
                x="50%"
                y="56%"
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-slate-400 text-[10px]"
              >
                kcal
              </text>
            </PieChart>
          </ResponsiveContainer>

          {/* legend */}
          <div className="mt-3 flex items-center justify-center gap-4 text-xs">
            {donutData.map((entry, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: donutColors[idx] }}
                />
                <span className="text-slate-400">{entry.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── macro stat cards ── */}
      <motion.div variants={containerVariants} className="grid grid-cols-3 gap-3">
        <MacroCard
          icon={Beef}
          label={t('nutrition.protein')}
          grams={macros.protein}
          percentage={macroPercentages.protein}
          color={MACRO_COLORS.protein}
        />
        <MacroCard
          icon={Wheat}
          label={t('nutrition.carbs')}
          grams={macros.carbs}
          percentage={macroPercentages.carbs}
          color={MACRO_COLORS.carbs}
        />
        <MacroCard
          icon={Droplets}
          label={t('nutrition.fat')}
          grams={macros.fat}
          percentage={macroPercentages.fat}
          color={MACRO_COLORS.fat}
        />
      </motion.div>

      {/* ── meal cards ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-outfit text-sm font-semibold text-slate-300">
            {t('nutrition.mealPlan')}
            <span className="ml-2 text-xs font-normal text-slate-500">
              ({mealLabel})
            </span>
          </h3>
          <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
            <Wallet size={12} />
            {t('nutrition.dailyCost')} {currencyMap[lang] || '₺'}{totalPrice}
          </span>
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={selectedDayIdx + '-meals'}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="flex flex-col gap-4"
          >
            {meals.map((meal, idx) => (
              <MealCard key={meal.id ?? idx} meal={meal} index={idx} t={t} lang={lang} currency={currencyMap[lang] || '₺'} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
