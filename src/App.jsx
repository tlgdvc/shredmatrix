import { useState, useEffect, useMemo, Component, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from './i18n/LanguageContext';
import { generatePlan, regeneratePlanWithPhase, localizePlan } from './data/planGenerator';
import { getSession, onAuthStateChange, loadPlan, savePlan, signOut as authSignOut } from './lib/dataService';
import { Dumbbell, Flame, Brain, Leaf, Target, Wrench } from 'lucide-react';
import { ToastProvider } from './components/ToastProvider';

// ── Lazy-loaded pages (P2-1: Code Splitting) ─────────────
const LandingPage = lazy(() => import('./components/LandingPage'));
const AuthScreen = lazy(() => import('./components/AuthScreen'));
const Onboarding = lazy(() => import('./components/Onboarding'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const OnboardingTour = lazy(() => import('./components/OnboardingTour'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./components/TermsOfService'));
const StravaCallback = lazy(() => import('./components/StravaCallback'));

// ── Error Boundary (P1-3) ────────────────────────────────────
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    // Auto-recover from DOM manipulation errors (browser extensions, translate, etc.)
    const msg = error?.message || '';
    if (msg.includes('removeChild') || msg.includes('insertBefore') || msg.includes('appendChild')) {
      setTimeout(() => window.location.reload(), 100);
      return { hasError: false, error: null };
    }
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-white mb-3 font-outfit">Something went wrong</h1>
            <p className="text-slate-400 mb-6 text-sm">{this.state.error?.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-bold font-outfit hover:from-orange-600 hover:to-amber-600 transition-all cursor-pointer"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Goal Theme Configs ───────────────────────────────────
const GOAL_THEMES = {
  muscle: {
    icon: Dumbbell,
    gradient: 'from-orange-600 via-amber-500 to-yellow-400',
    glow: 'rgba(255, 109, 0, 0.4)',
    orb1: 'bg-orange-500/20',
    orb2: 'bg-amber-400/15',
    orb3: 'bg-yellow-500/10',
    bar: 'from-orange-500 to-amber-400',
    iconColor: 'text-orange-400',
    dotColor: 'bg-orange-500',
  },
  fat_loss: {
    icon: Flame,
    gradient: 'from-red-500 via-orange-500 to-amber-400',
    glow: 'rgba(239, 68, 68, 0.4)',
    orb1: 'bg-red-500/20',
    orb2: 'bg-orange-500/15',
    orb3: 'bg-amber-400/10',
    bar: 'from-red-500 to-orange-400',
    iconColor: 'text-red-400',
    dotColor: 'bg-red-500',
  },
  meditation: {
    icon: Brain,
    gradient: 'from-indigo-500 via-purple-500 to-violet-400',
    glow: 'rgba(139, 92, 246, 0.4)',
    orb1: 'bg-indigo-500/20',
    orb2: 'bg-purple-500/15',
    orb3: 'bg-violet-400/10',
    bar: 'from-indigo-500 to-purple-400',
    iconColor: 'text-purple-400',
    dotColor: 'bg-purple-500',
  },
  yoga: {
    icon: Leaf,
    gradient: 'from-teal-500 via-emerald-500 to-green-400',
    glow: 'rgba(20, 184, 166, 0.4)',
    orb1: 'bg-teal-500/20',
    orb2: 'bg-emerald-500/15',
    orb3: 'bg-green-400/10',
    bar: 'from-teal-500 to-emerald-400',
    iconColor: 'text-emerald-400',
    dotColor: 'bg-emerald-500',
  },
  pilates: {
    icon: Target,
    gradient: 'from-pink-500 via-rose-500 to-fuchsia-400',
    glow: 'rgba(236, 72, 153, 0.4)',
    orb1: 'bg-pink-500/20',
    orb2: 'bg-rose-500/15',
    orb3: 'bg-fuchsia-400/10',
    bar: 'from-pink-500 to-rose-400',
    iconColor: 'text-pink-400',
    dotColor: 'bg-pink-500',
  },
  reformer: {
    icon: Wrench,
    gradient: 'from-cyan-500 via-blue-500 to-indigo-400',
    glow: 'rgba(6, 182, 212, 0.4)',
    orb1: 'bg-cyan-500/20',
    orb2: 'bg-blue-500/15',
    orb3: 'bg-indigo-400/10',
    bar: 'from-cyan-500 to-blue-400',
    iconColor: 'text-cyan-400',
    dotColor: 'bg-cyan-500',
  },
};

// ── Loading Screen ───────────────────────────────────────
function LoadingScreen({ goal = 'muscle', userName = '' }) {
  const { t } = useTranslation();
  const steps = t('loading.steps') || [];
  const [currentStep, setCurrentStep] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);

  const theme = GOAL_THEMES[goal] || GOAL_THEMES.muscle;
  const GoalIcon = theme.icon;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(interval);
          setShowWelcome(true);
          return prev;
        }
        return prev + 1;
      });
    }, 450);
    return () => clearInterval(interval);
  }, []);

  const progress = ((currentStep + 1) / steps.length) * 100;
  const firstName = userName?.split(' ')[0] || '';

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 relative overflow-hidden">

      {/* ── Animated Background Orbs ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className={`absolute w-[500px] h-[500px] rounded-full ${theme.orb1} blur-[120px]`}
          animate={{
            x: ['-20%', '10%', '-20%'],
            y: ['-10%', '20%', '-10%'],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          style={{ top: '-15%', left: '-10%' }}
        />
        <motion.div
          className={`absolute w-[400px] h-[400px] rounded-full ${theme.orb2} blur-[100px]`}
          animate={{
            x: ['10%', '-15%', '10%'],
            y: ['10%', '-10%', '10%'],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          style={{ bottom: '-10%', right: '-5%' }}
        />
        <motion.div
          className={`absolute w-[300px] h-[300px] rounded-full ${theme.orb3} blur-[80px]`}
          animate={{
            x: ['-5%', '15%', '-5%'],
            y: ['15%', '-5%', '15%'],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          style={{ top: '40%', left: '50%', transform: 'translateX(-50%)' }}
        />
      </div>

      {/* ── Floating Particles ── */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-1 h-1 rounded-full ${theme.dotColor}`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30 - Math.random() * 40, 0],
              opacity: [0, 0.6, 0],
              scale: [0, 1 + Math.random(), 0],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col items-center">

        {/* Goal Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          className="mb-6"
        >
          <div className="relative">
            {/* Pulsing ring */}
            <motion.div
              className="absolute inset-0 w-20 h-20 rounded-2xl border border-white/10"
              animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10"
              style={{
                background: 'rgba(15, 23, 42, 0.7)',
                boxShadow: `0 0 40px ${theme.glow}`,
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <GoalIcon size={36} className={theme.iconColor} strokeWidth={1.5} />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className={`text-3xl md:text-4xl font-extrabold font-outfit tracking-tight text-center mb-2 bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}
        >
          FULL BALANCE
        </motion.h1>

        {/* Subtitle — Goal name */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-sm text-slate-400 font-outfit mb-8 tracking-wide"
        >
          {t(`loading.goalLabel.${goal}`) || goal}
        </motion.p>

        {/* Progress Bar */}
        <div className="w-64 sm:w-80 mb-5">
          <div className="h-1.5 rounded-full bg-slate-800/60 overflow-hidden backdrop-blur-sm">
            <motion.div
              className={`h-full rounded-full bg-gradient-to-r ${theme.bar}`}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Step Text */}
        <AnimatePresence mode="wait">
          {!showWelcome ? (
            <motion.p
              key={currentStep}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="text-xs text-slate-500 font-outfit h-5"
            >
              {steps[currentStep]}
            </motion.p>
          ) : (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <p className="text-lg font-bold font-outfit text-white">
                {t('dashboard.welcome.hi')}{' '}
                <span className={`bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}>
                  {firstName}!
                </span>
              </p>
              <p className="text-xs text-slate-400 mt-1.5 font-outfit">
                {t('dashboard.welcome.subtitle')}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading Dots */}
        {!showWelcome && (
          <div className="flex items-center gap-1.5 mt-5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${theme.dotColor}`}
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.3, 0.8] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Suspense fallback ────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full"
      />
    </div>
  );
}

// ── Protected Route ──────────────────────────────────────
function ProtectedRoute({ user, plan, children, requirePlan = false }) {
  if (!user) return <Navigate to="/auth" replace />;
  if (requirePlan && !plan) return <Navigate to="/onboarding" replace />;
  return children;
}

// ── App Content (inside Router) ──────────────────────────
function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useTranslation();
  const [user, setUser] = useState(null);
  const [plan, setPlan] = useState(null);
  const [pendingFormData, setPendingFormData] = useState(null);
  const [showTour, setShowTour] = useState(false);
  // Try to hydrate from localStorage synchronously (no spinner)
  const [isRestoring, setIsRestoring] = useState(() => {
    try {
      const cachedUser = JSON.parse(localStorage.getItem('shredmatrix_user'));
      if (cachedUser?.email) return false; // We have cached data, no spinner needed
    } catch {}
    return true; // No cache, show spinner briefly
  });

  // Sync-init user & plan from localStorage before first paint
  useEffect(() => {
    try {
      const cachedUser = JSON.parse(localStorage.getItem('shredmatrix_user'));
      if (cachedUser?.email) {
        setUser(cachedUser);
        const cachedPlan = JSON.parse(localStorage.getItem(`shredmatrix_plan_${cachedUser.email}`));
        if (cachedPlan) setPlan(cachedPlan);
      }
    } catch {}
  }, []);

  // Restore session from Supabase in background (verify + sync)
  useEffect(() => {
    const restoreSession = async () => {
      const currentPath = window.location.pathname;
      try {
        const sessionData = await getSession();
        if (sessionData?.user) {
          const u = sessionData.user;
          const userData = { name: u.name, email: u.email, id: u.id };
          setUser(userData);
          try { localStorage.setItem('shredmatrix_user', JSON.stringify(userData)); } catch {}
          const savedPlan = await loadPlan(u.email);
          if (savedPlan) {
            setPlan(savedPlan);
            if (currentPath !== '/dashboard') navigate('/dashboard', { replace: true });
          } else {
            if (currentPath !== '/onboarding' && currentPath !== '/loading') navigate('/onboarding', { replace: true });
          }
        } else {
          // No Supabase session — check localStorage fallback
          try {
            const cachedUser = JSON.parse(localStorage.getItem('shredmatrix_user'));
            if (cachedUser?.email) {
              setUser(cachedUser);
              const savedPlan = await loadPlan(cachedUser.email);
              if (savedPlan) {
                setPlan(savedPlan);
                if (currentPath !== '/dashboard') navigate('/dashboard', { replace: true });
              } else {
                if (currentPath !== '/onboarding' && currentPath !== '/loading') navigate('/onboarding', { replace: true });
              }
            }
          } catch {}
        }
      } catch {
        // session restore failed, stay on landing
      }
      setIsRestoring(false);
    };

    restoreSession();

    // Listen for auth state changes
    const subscription = onAuthStateChange((event, userData) => {
      if (event === 'SIGNED_IN' && userData) {
        const u = { name: userData.name, email: userData.email, id: userData.id };
        setUser(u);
        try { localStorage.setItem('shredmatrix_user', JSON.stringify(u)); } catch {}
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setPlan(null);
        try { localStorage.removeItem('shredmatrix_user'); } catch {}
        navigate('/', { replace: true });
      }
    });

    return () => subscription?.unsubscribe?.();
  }, []);

  // Regenerate plan when language changes
  useEffect(() => {
    if (plan && plan.lang !== lang) {
      // Rebuild the plan with the new language using existing user metrics
      const goalMap = {
        'Kas Gelişimi': 'muscle', 'Yağ Yakımı': 'fat_loss', 'Meditasyon': 'meditation',
        'Muscle Growth': 'muscle', 'Fat Loss': 'fat_loss', 'Meditation': 'meditation',
        'Crecimiento Muscular': 'muscle', 'Quema de Grasa': 'fat_loss', 'Meditación': 'meditation',
        'Yoga': 'yoga', 'Pilates': 'pilates', 'Reformer': 'reformer',
      };
      const userMetrics = {
        name: plan.userName,
        age: plan.userAge,
        gender: plan.userGender,
        height: plan.userHeight,
        weight: plan.userWeight,
        bodyFatPercentage: plan.userBodyFat,
        experience: plan.userExperience,
        activityLevel: plan.userActivityLevel,
        primaryGoal: goalMap[plan.goal] || 'muscle',
        workSchedule: plan.userWorkSchedule,
        budget: plan.userBudget,
      };
      const rawPlan = generatePlan(userMetrics, plan.phase || 0, lang);
      const newPlan = localizePlan(rawPlan, lang);
      setPlan(newPlan);
      savePlan(newPlan, user?.email).catch(() => {});
    }
  }, [lang]);

  // Handle loading → dashboard transition
  useEffect(() => {
    if (location.pathname === '/loading' && pendingFormData) {
      const timer = setTimeout(() => {
        const rawPlan = generatePlan(pendingFormData, 0, lang);
        const generatedPlan = localizePlan(rawPlan, lang);
        setPlan(generatedPlan);

        // Save plan to Supabase/localStorage
        savePlan(generatedPlan, user?.email).catch(() => {});

        setPendingFormData(null);
        navigate('/dashboard', { replace: true });

        // Show tour for first-time users
        const tourKey = `shredmatrix_tour_seen_${user?.email || 'guest'}`;
        if (!localStorage.getItem(tourKey)) {
          setShowTour(true);
          localStorage.setItem(tourKey, '1');
        }
      }, 3200);

      return () => clearTimeout(timer);
    }
  }, [location.pathname, pendingFormData, user, lang]);

  const handleAuth = async (userData) => {
    setUser(userData);
    // Persist user info as fallback (in case Supabase session isn't ready)
    try { localStorage.setItem('shredmatrix_user', JSON.stringify(userData)); } catch {}
    try {
      const savedPlan = await loadPlan(userData.email);
      if (savedPlan) {
        setPlan(savedPlan);
        if (location.pathname !== '/dashboard') navigate('/dashboard', { replace: true });
      } else {
        if (location.pathname !== '/onboarding') navigate('/onboarding', { replace: true });
      }
    } catch {
      if (location.pathname !== '/onboarding') navigate('/onboarding', { replace: true });
    }
  };

  const handleSubmit = (formData) => {
    setPendingFormData(formData);
    navigate('/loading', { replace: true });
  };

  const handleBack = () => {
    setPlan(null);
    navigate('/onboarding', { replace: true });
  };

  const handleLogout = async () => {
    await authSignOut();
    setUser(null);
    setPlan(null);
    try { localStorage.removeItem('shredmatrix_user'); } catch {}
    navigate('/', { replace: true });
  };

  const handlePlanUpdate = (newPlan) => {
    setPlan(newPlan);
    savePlan(newPlan, user?.email).catch(() => {});
  };

  const pageTransition = { duration: 0.4, ease: [0.22, 1, 0.36, 1] };

  if (isRestoring) return <PageLoader />;

  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={
              <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={pageTransition}>
                <LandingPage onStart={() => navigate('/auth')} />
              </motion.div>
            } />

            <Route path="/auth" element={
              user && plan ? <Navigate to="/dashboard" replace /> :
              <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={pageTransition}>
                <AuthScreen onAuth={handleAuth} onBack={() => navigate('/')} />
              </motion.div>
            } />

            <Route path="/onboarding" element={
              <ProtectedRoute user={user}>
                <motion.div key="onboarding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={pageTransition}>
                  <Onboarding onSubmit={handleSubmit} />
                </motion.div>
              </ProtectedRoute>
            } />

            <Route path="/loading" element={
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={pageTransition}>
                <LoadingScreen goal={pendingFormData?.primaryGoal || 'muscle'} userName={user?.name || pendingFormData?.name || ''} />
              </motion.div>
            } />

            <Route path="/dashboard" element={
              <ProtectedRoute user={user} plan={plan} requirePlan>
                <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={pageTransition}>
                  <Dashboard plan={plan} user={user} onBack={handleBack} onLogout={handleLogout} onPlanUpdate={handlePlanUpdate} />
                </motion.div>
              </ProtectedRoute>
            } />

            <Route path="/privacy" element={
              <motion.div key="privacy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={pageTransition}>
                <PrivacyPolicy />
              </motion.div>
            } />

            <Route path="/terms" element={
              <motion.div key="terms" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={pageTransition}>
                <TermsOfService />
              </motion.div>
            } />

            <Route path="/strava/callback" element={
              <motion.div key="strava-cb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={pageTransition}>
                <StravaCallback />
              </motion.div>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </Suspense>

      {/* Onboarding Tour Overlay */}
      <AnimatePresence>
        {showTour && (
          <Suspense fallback={null}>
            <OnboardingTour onClose={() => setShowTour(false)} />
          </Suspense>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Root App ─────────────────────────────────────────────
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
