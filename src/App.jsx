import { useState, useEffect, Component, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from './i18n/LanguageContext';
import { generatePlan, regeneratePlanWithPhase, localizePlan } from './data/planGenerator';
import { getSession, onAuthStateChange, loadPlan, savePlan, signOut as authSignOut } from './lib/dataService';

// ── Lazy-loaded pages (P2-1: Code Splitting) ─────────────
const LandingPage = lazy(() => import('./components/LandingPage'));
const AuthScreen = lazy(() => import('./components/AuthScreen'));
const Onboarding = lazy(() => import('./components/Onboarding'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const OnboardingTour = lazy(() => import('./components/OnboardingTour'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./components/TermsOfService'));

// ── Error Boundary (P1-3) ────────────────────────────────
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
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

// ── Loading Screen ───────────────────────────────────────
function LoadingScreen() {
  const { t } = useTranslation();
  const steps = t('loading.steps') || [];
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-slate-950 bg-grid flex flex-col items-center justify-center px-4">
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        className="mb-8"
      >
        <h1 className="text-4xl md:text-5xl font-extrabold font-outfit tracking-tighter bg-gradient-to-r from-orange-500 via-amber-400 to-blue-500 bg-clip-text text-transparent">
          FULL BALANCE
        </h1>
      </motion.div>

      <div className="w-full max-w-sm mb-6">
        <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-blue-500"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="text-sm text-slate-400 font-outfit"
        >
          {steps[currentStep]}
        </motion.p>
      </AnimatePresence>

      <div className="flex items-center gap-1.5 mt-6">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-orange-500"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
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
  const [isRestoring, setIsRestoring] = useState(true);

  // Restore session on mount
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
          // Fallback: check localStorage for user data (covers email confirmation gap)
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
      <AnimatePresence mode="wait">
        <Suspense fallback={<PageLoader />}>
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
                <LoadingScreen />
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

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AnimatePresence>

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
        <AppContent />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
