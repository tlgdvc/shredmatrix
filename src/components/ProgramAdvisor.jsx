import { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, TrendingUp, TrendingDown, Minus, RefreshCw, ChevronRight, Sparkles, AlertTriangle, Check, Shield, UtensilsCrossed, Heart } from 'lucide-react';
import { analyzeProgress, advancePhase } from '../data/adaptiveEngine';
import { regeneratePlanWithPhase } from '../data/planGenerator';

export default function ProgramAdvisor({ plan, onPlanUpdate }) {
  const { t } = useTranslation();
  const [analysis, setAnalysis] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [upgraded, setUpgraded] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);

  useEffect(() => {
    if (plan) {
      const result = analyzeProgress(plan);
      setAnalysis(result);
    }
  }, [plan]);

  if (!analysis) return null;

  const phaseNames = t('advisor.phaseNames') || ['Temel', 'İleri', 'Yoğun', 'Elit'];

  const handleUpgrade = (phase) => {
    advancePhase(phase);
    if (onPlanUpdate) {
      const newPlan = regeneratePlanWithPhase(plan, phase);
      onPlanUpdate(newPlan);
    }
    setUpgraded(true);
    setManualOpen(false);
    setTimeout(() => setUpgraded(false), 3000);
  };

  const trendIcon = (trend) => {
    if (trend === 'gaining') return <TrendingUp size={12} className="text-green-400" />;
    if (trend === 'losing') return <TrendingDown size={12} className="text-red-400" />;
    return <Minus size={12} className="text-slate-500" />;
  };

  const trendLabel = (trend) => {
    if (trend === 'gaining') return t('advisor.gaining');
    if (trend === 'losing') return t('advisor.losing');
    return t('advisor.stable');
  };

  const reasonConfig = {
    plateau: { color: 'orange', icon: AlertTriangle, label: t('advisor.plateau'), desc: t('advisor.plateauDesc') },
    stagnation: { color: 'yellow', icon: AlertTriangle, label: t('advisor.stagnation'), desc: t('advisor.stagnationDesc') },
    time: { color: 'blue', icon: Sparkles, label: t('advisor.timeUp'), desc: t('advisor.timeUpDesc') },
    none: { color: 'emerald', icon: Check, label: t('advisor.noChange'), desc: t('advisor.noChangeDesc') },
  };

  const config = reasonConfig[analysis.reason] || reasonConfig.none;
  const colorMap = {
    orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', glow: 'from-orange-500/20' },
    yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', glow: 'from-yellow-500/20' },
    blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', glow: 'from-blue-500/20' },
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', glow: 'from-emerald-500/20' },
  };
  const colors = colorMap[config.color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden"
    >
      {/* Glow effect */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${colors.glow} to-transparent`} />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain size={16} className="text-purple-400" />
          <h3 className="text-sm font-bold font-outfit text-white">{t('advisor.title')}</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 font-medium">
            {t('advisor.phase')} {analysis.currentPhase + 1}: {phaseNames[analysis.currentPhase]}
          </span>
        </div>
      </div>

      {/* Phase Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-slate-500">{t('advisor.programAge')}: {analysis.programAgeWeeks} {t('advisor.week')}</span>
          <span className="text-[10px] text-slate-500">
            {analysis.phaseWeeksLeft > 0 ? `${analysis.phaseWeeksLeft} ${t('advisor.weeksLeft')}` : t('advisor.timeUp')}
          </span>
        </div>
        <div className="flex gap-0.5">
          {[0, 1, 2, 3].map(phase => (
            <div key={phase} className="flex-1 h-1.5 rounded-full overflow-hidden bg-slate-800">
              {phase < analysis.currentPhase && (
                <div className="h-full w-full bg-purple-500 rounded-full" />
              )}
              {phase === analysis.currentPhase && (
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(10, ((8 - analysis.phaseWeeksLeft) / 8) * 100)}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1">
          {phaseNames.map((name, i) => (
            <span key={i} className={`text-[8px] ${i <= analysis.currentPhase ? 'text-purple-400' : 'text-slate-600'}`}>
              {name}
            </span>
          ))}
        </div>
      </div>

      {/* Status Card */}
      <motion.div
        className={`${colors.bg} border ${colors.border} rounded-xl p-3 mb-3 cursor-pointer`}
        onClick={() => setShowDetails(!showDetails)}
        whileHover={{ scale: 1.01 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <config.icon size={14} className={colors.text} />
            <span className={`text-xs font-bold ${colors.text}`}>{config.label}</span>
          </div>
          <ChevronRight size={12} className={`text-slate-500 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
        </div>
        <p className="text-[10px] text-slate-400 mt-1">{config.desc}</p>
      </motion.div>

      {/* Trend Details */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3"
          >
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-950/50 border border-slate-800/50 rounded-lg p-2">
                <p className="text-[8px] text-slate-500 mb-1">{t('advisor.weightTrend')}</p>
                <div className="flex items-center gap-1">
                  {trendIcon(analysis.weightTrend)}
                  <span className="text-xs font-medium text-white">{trendLabel(analysis.weightTrend)}</span>
                </div>
                {analysis.summary.weightChange !== 0 && (
                  <span className="text-[9px] text-slate-500">
                    {analysis.summary.weightChange > 0 ? '+' : ''}{analysis.summary.weightChange.toFixed(1)} kg
                  </span>
                )}
              </div>
              <div className="bg-slate-950/50 border border-slate-800/50 rounded-lg p-2">
                <p className="text-[8px] text-slate-500 mb-1">{t('advisor.measureTrend')}</p>
                <div className="flex items-center gap-1">
                  {trendIcon(analysis.measureTrend)}
                  <span className="text-xs font-medium text-white">{trendLabel(analysis.measureTrend)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Health Condition Warnings */}
      {plan?.healthConditions?.length > 0 && !plan.healthConditions.includes('none') && (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Shield size={12} className="text-rose-400" />
            <span className="text-[10px] uppercase tracking-wider font-semibold text-rose-400">
              {t('advisor.healthWarnings') || 'Sağlık Uyarıları'}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {plan.healthConditions.map((cond) => {
              const labels = {
                back_pain: { emoji: '🪶', key: 'back_pain' },
                knee_issue: { emoji: '🦵', key: 'knee_issue' },
                shoulder_injury: { emoji: '💪', key: 'shoulder_injury' },
                wrist_issue: { emoji: '✋', key: 'wrist_issue' },
                heart_condition: { emoji: '❤️', key: 'heart_condition' },
              };
              const info = labels[cond];
              if (!info) return null;
              return (
                <span
                  key={cond}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-400 font-medium"
                >
                  <span>{info.emoji}</span>
                  {t(`onboarding.fields.${info.key}`) || cond}
                </span>
              );
            })}
          </div>
          <p className="text-[9px] text-slate-500 mt-1.5">
            {t('advisor.healthNote') || 'Programınız sağlık durumunuza göre uyarlandı — riskli egzersizler güvenli alternatiflerle değiştirildi.'}
          </p>
        </div>
      )}

      {/* Allergy Info */}
      {plan?.allergies?.length > 0 && !plan.allergies.includes('none') && (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-2">
            <UtensilsCrossed size={12} className="text-amber-400" />
            <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-400">
              {t('advisor.allergyWarnings') || 'Alerji Uyarıları'}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {plan.allergies.map((allergy) => {
              const labels = {
                lactose: '🥛', gluten: '🌾', egg: '🥚', nuts: '🥜',
                seafood: '🐟', vegan: '🌱', vegetarian: '🥬',
              };
              return (
                <span
                  key={allergy}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-400 font-medium"
                >
                  <span>{labels[allergy] || '⚠️'}</span>
                  {t(`onboarding.fields.${allergy}`) || allergy}
                </span>
              );
            })}
          </div>
          <p className="text-[9px] text-slate-500 mt-1.5">
            {t('advisor.allergyNote') || 'Beslenme planınızda alerjen içeren yiyecekler ⚠️ işaretiyle gösterilmektedir.'}
          </p>
        </div>
      )}

      {/* Success notification */}
      <AnimatePresence>
        {upgraded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-3 mb-3 flex items-center gap-2"
          >
            <Check size={14} className="text-emerald-400" />
            <span className="text-xs font-bold text-emerald-400">{t('advisor.upgraded')}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {analysis.shouldChange && !upgraded && (
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => handleUpgrade(analysis.suggestedPhase)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold cursor-pointer hover:from-purple-500 hover:to-blue-500 transition-all"
          >
            <Sparkles size={12} />
            {t('advisor.upgrade')} → {phaseNames[analysis.suggestedPhase]}
          </motion.button>
        )}
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setManualOpen(!manualOpen)}
          className={`${analysis.shouldChange && !upgraded ? '' : 'flex-1'} flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium cursor-pointer hover:text-white hover:border-slate-600 transition-all`}
        >
          <RefreshCw size={11} />
          {t('advisor.manualChange')}
        </motion.button>
      </div>

      {/* Manual Phase Selector */}
      <AnimatePresence>
        {manualOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3"
          >
            <div className="grid grid-cols-4 gap-1.5">
              {phaseNames.map((name, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => handleUpgrade(i)}
                  disabled={i === analysis.currentPhase}
                  className={`py-2 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                    i === analysis.currentPhase
                      ? 'bg-purple-500/20 border border-purple-500/40 text-purple-400'
                      : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                  }`}
                >
                  {name}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
