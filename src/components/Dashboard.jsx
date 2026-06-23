import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../i18n/LanguageContext';
import NutritionPanel from './NutritionPanel';
import WorkoutPanel from './WorkoutPanel';
import ProgressTracker from './ProgressTracker';
import ProfilePage from './ProfilePage';
import WaterTracker from './WaterTracker';
import WorkoutTimer from './WorkoutTimer';
import WeeklyReport from './WeeklyReport';
import Achievements from './Achievements';
import SupplementGuide from './SupplementGuide';
import DailyMotivation from './DailyMotivation';
import ShareCard from './ShareCard';
import InstallPrompt from './InstallPrompt';
import BodyMeasurements from './BodyMeasurements';
import SleepTracker from './SleepTracker';
import CalorieCalc from './CalorieCalc';
import DataExport from './DataExport';
import ProgramAdvisor from './ProgramAdvisor';
import HeroCard from './HeroCard';
import MuscleRecovery from './MuscleRecovery';
import StreakCalendar from './StreakCalendar';
import { StravaConnectCard, StravaActivitiesPanel } from './StravaPanel';
import {
  Sparkles, UtensilsCrossed, Dumbbell, TrendingUp, User,
  LogOut, Target, Award, Share2, ChevronDown,
} from 'lucide-react';



const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const columnVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

// ── Welcome Modal ────────────────────────────────────────
function WelcomeOverlay({ name, onClose, t }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="text-center"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-5xl mb-3"
        >
          ⚡
        </motion.div>
        <h1 className="text-2xl md:text-3xl font-extrabold font-outfit text-white mb-1">
          {t('dashboard.welcome.hi')} <span className="gradient-text">{name}</span>!
        </h1>
        <p className="text-slate-400 text-xs font-outfit">
          {t('dashboard.welcome.subtitle')}
        </p>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 1.8, ease: 'linear' }}
          className="h-0.5 bg-gradient-to-r from-orange-500 to-blue-500 rounded-full mt-4 mx-auto max-w-[200px]"
        />
      </motion.div>
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════
export default function Dashboard({ plan, user, onBack, onLogout, onPlanUpdate }) {
  const { t, lang, setLang, langFlags, SUPPORTED } = useTranslation();
  const [activeTab, setActiveTab] = useState('nutrition');
  const [showWelcome, setShowWelcome] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showQuickStats, setShowQuickStats] = useState(false);
  const [daysSinceJoin] = useState(() => {
    try { const d = localStorage.getItem('shredmatrix_first_login'); return d ? Math.floor((Date.now() - new Date(d).getTime()) / 86400000) : 0; } catch { return 0; }
  });

  // ── Tabs ─────────────────────────────────────────────────
  const TABS = [
    { id: 'nutrition', label: t('dashboard.tabs.nutrition'), icon: UtensilsCrossed },
    { id: 'workout', label: t('dashboard.tabs.workout'), icon: Dumbbell },
    { id: 'progress', label: t('dashboard.tabs.progress'), icon: TrendingUp },
    { id: 'achievements', label: t('dashboard.tabs.achievements'), icon: Award },
    { id: 'profile', label: t('dashboard.tabs.profile'), icon: User },
  ];

  // Show welcome on first visit
  useEffect(() => {
    if (!plan) return;
    const key = `shredmatrix_welcomed_${user?.email || 'guest'}`;
    if (!sessionStorage.getItem(key)) {
      setShowWelcome(true);
      sessionStorage.setItem(key, '1');
    }
    // Record first login for achievements
    if (!localStorage.getItem('shredmatrix_first_login')) {
      localStorage.setItem('shredmatrix_first_login', new Date().toISOString());
    }
  }, [plan, user]);

  if (!plan) return null;

  return (
    <>
    <div className="min-h-screen bg-grid pb-20 lg:pb-0 overflow-x-hidden w-full">
      {/* ── Welcome Overlay ── */}
      <AnimatePresence>
        {showWelcome && (
          <WelcomeOverlay
            name={plan.userName || t('dashboard.athlete') || 'Athlete'}
            onClose={() => setShowWelcome(false)}
            t={t}
          />
        )}
      </AnimatePresence>

      {/* ── Top Nav ──────────────────────────────────── */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/50 safe-area-top"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Sparkles className="text-[#ff6d00]" size={18} />
            <h1 className="text-base font-outfit font-bold gradient-text tracking-tight">
              FULL BALANCE
            </h1>
          </div>

          {/* Desktop tabs */}
          <div className="hidden lg:flex items-center gap-0.5 bg-slate-900/80 border border-slate-800 rounded-full p-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer',
                    active
                      ? 'bg-gradient-to-r from-orange-500/15 to-blue-500/15 text-orange-400 border border-orange-500/20'
                      : 'text-slate-500 hover:text-slate-300',
                  ].join(' ')}
                >
                  <Icon size={12} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Quick Stats Button */}
            <div className="relative hidden sm:block">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowQuickStats(!showQuickStats)}
                className={[
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer',
                  showQuickStats
                    ? 'bg-gradient-to-r from-[#ff6d00]/20 to-[#00b0ff]/20 border-[#ff6d00]/40 text-orange-400'
                    : 'bg-gradient-to-r from-[#ff6d00]/10 to-[#00b0ff]/10 border-[#ff6d00]/20 text-white hover:border-[#ff6d00]/40',
                ].join(' ')}
              >
                <Target size={11} className="text-[#ff6d00]" />
                <span className="text-[10px]">{plan.goal}</span>
                <ChevronDown size={10} className={`text-slate-500 transition-transform ${showQuickStats ? 'rotate-180' : ''}`} />
              </motion.button>

              {/* Quick Stats Dropdown */}
              <AnimatePresence>
                {showQuickStats && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowQuickStats(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 top-full mt-2 z-50 w-64 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl shadow-black/40"
                    >
                      <h4 className="text-xs font-bold font-outfit text-white mb-3 flex items-center gap-2">
                        <Sparkles size={12} className="text-orange-400" />
                        {t('dashboard.quickStats.title')}
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-950/60 border border-slate-800/50 rounded-xl p-2.5 text-center">
                          <p className="text-[9px] text-slate-500 mb-0.5">{t('dashboard.quickStats.goal')}</p>
                          <p className="text-xs font-bold text-orange-400 font-outfit">{plan.goal}</p>
                        </div>
                        <div className="bg-slate-950/60 border border-slate-800/50 rounded-xl p-2.5 text-center">
                          <p className="text-[9px] text-slate-500 mb-0.5">{t('dashboard.quickStats.dailyCal')}</p>
                          <p className="text-xs font-bold text-white font-outfit">{plan.dailyCalories} <span className="text-slate-500 text-[9px]">kcal</span></p>
                        </div>
                        <div className="bg-slate-950/60 border border-slate-800/50 rounded-xl p-2.5 text-center">
                          <p className="text-[9px] text-slate-500 mb-0.5">BMR</p>
                          <p className="text-xs font-bold text-emerald-400 font-outfit">{plan.bmr} <span className="text-slate-500 text-[9px]">kcal</span></p>
                        </div>
                        <div className="bg-slate-950/60 border border-slate-800/50 rounded-xl p-2.5 text-center">
                          <p className="text-[9px] text-slate-500 mb-0.5">TDEE</p>
                          <p className="text-xs font-bold text-purple-400 font-outfit">{plan.tdee} <span className="text-slate-500 text-[9px]">kcal</span></p>
                        </div>
                        <div className="bg-slate-950/60 border border-slate-800/50 rounded-xl p-2.5 text-center">
                          <p className="text-[9px] text-slate-500 mb-0.5">{t('dashboard.quickStats.training')}</p>
                          <p className="text-xs font-bold text-blue-400 font-outfit">
                            {plan.workoutSplit?.filter(d => !d.isRest).length || 0} {t('dashboard.quickStats.daysWeek')}
                          </p>
                        </div>
                        <div className="bg-slate-950/60 border border-slate-800/50 rounded-xl p-2.5 text-center">
                          <p className="text-[9px] text-slate-500 mb-0.5">{t('dashboard.quickStats.programAge')}</p>
                          <p className="text-xs font-bold text-amber-400 font-outfit">
                            {daysSinceJoin} {t('dashboard.quickStats.days')}
                          </p>
                        </div>
                      </div>
                      {/* Macros mini bar */}
                      <div className="mt-3 flex items-center gap-1.5 text-[9px]">
                        <span className="text-orange-400 font-semibold">P {plan.macros?.protein || '—'}g</span>
                        <span className="text-slate-700">•</span>
                        <span className="text-blue-400 font-semibold">C {plan.macros?.carbs || '—'}g</span>
                        <span className="text-slate-700">•</span>
                        <span className="text-purple-400 font-semibold">F {plan.macros?.fat || '—'}g</span>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowShare(true)}
              className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors cursor-pointer"
              title={t('dashboard.share')}
              aria-label={t('dashboard.share')}
            >
              <Share2 size={13} />
              <span className="text-[10px] font-medium hidden sm:inline">{t('dashboard.share')}</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onLogout}
              className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
              title={t('dashboard.logout')}
              aria-label={t('dashboard.logout')}
            >
              <LogOut size={13} />
              <span className="text-[10px] font-medium hidden sm:inline">{t('dashboard.logout')}</span>
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* ── Main Content ─────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 overflow-hidden">
        {/* ── Hero Card — Full Balance Score + Today ── */}
        <HeroCard plan={plan} />

        <AnimatePresence mode="wait">

          {/* ─── Beslenme Tab ─── */}
          {activeTab === 'nutrition' && (
            <motion.div
              key="nutrition"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <motion.div variants={containerVariants} initial="hidden" animate="visible">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <motion.div variants={columnVariants} className="lg:col-span-2">
                    <NutritionPanel plan={plan} />
                  </motion.div>
                  <motion.div variants={columnVariants} className="space-y-6">
                    <CalorieCalc />
                    <WaterTracker />
                    <SleepTracker />
                    <DailyMotivation />
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ─── Antrenman Tab ─── */}
          {activeTab === 'workout' && (
            <motion.div
              key="workout"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <motion.div variants={containerVariants} initial="hidden" animate="visible">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <motion.div variants={columnVariants} className="lg:col-span-2">
                    <WorkoutPanel plan={plan} />
                  </motion.div>
                  <motion.div variants={columnVariants} className="space-y-6">
                    <WorkoutTimer />
                    <MuscleRecovery plan={plan} />
                    <ProgramAdvisor plan={plan} onPlanUpdate={onPlanUpdate} />
                    <SupplementGuide goal={plan.goal} />
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ─── İlerleme Tab ─── */}
          {activeTab === 'progress' && (
            <motion.div
              key="progress"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <motion.div variants={containerVariants} initial="hidden" animate="visible">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <motion.div variants={columnVariants} className="lg:col-span-2">
                    <ProgressTracker userName={plan.userName} />
                  </motion.div>
                  <motion.div variants={columnVariants} className="space-y-6">
                    <StreakCalendar />
                    <StravaActivitiesPanel />
                    <WeeklyReport plan={plan} />
                    <BodyMeasurements />
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ─── Başarım Tab ─── */}
          {activeTab === 'achievements' && (
            <motion.div
              key="achievements"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Achievements plan={plan} user={user} />
            </motion.div>
          )}

          {/* ─── Profil Tab ─── */}
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <ProfilePage
                plan={plan}
                user={user}
                onLogout={onLogout}
                onUpdatePlan={onBack}
                onPlanUpdate={onPlanUpdate}
              />
              <div className="mt-6 space-y-6">
                <StravaConnectCard />
                <DataExport />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Mobile Bottom Tab Bar ─────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/50">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  'flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all cursor-pointer min-w-0',
                  active ? 'text-orange-400' : 'text-slate-600',
                ].join(' ')}
              >
                <Icon size={18} />
                <span className="text-[9px] font-medium truncate">{tab.label}</span>
                {active && (
                  <motion.div
                    layoutId="bottomTabIndicator"
                    className="w-4 h-0.5 rounded-full bg-orange-500 mt-0.5"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Footer (desktop only) ─────────────────────── */}
      <footer className="hidden lg:block border-t border-slate-800/50 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <p className="text-[10px] text-slate-600">
            {t('dashboard.footer')}
          </p>
          {user?.email && (
            <p className="text-[10px] text-slate-700">{user.email}</p>
          )}
        </div>
      </footer>
    </div>

      {/* ── Share Card Modal ── */}
      <AnimatePresence>
        {showShare && (
          <ShareCard plan={plan} onClose={() => setShowShare(false)} />
        )}
      </AnimatePresence>

      {/* ── PWA Install Prompt ── */}
      <InstallPrompt />
    </>
  );
}
