import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, User, Eye, EyeOff, Sparkles, Shield, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { signUp, signIn, resetPassword } from '../lib/dataService';

// ── Validation ───────────────────────────────────────────
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ── Animation Variants ───────────────────────────────────
const formVariants = {
  enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0, scale: 0.97 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir) => ({ x: dir < 0 ? 60 : -60, opacity: 0, scale: 0.97 }),
};

const fieldVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  }),
};

// ── Input Component ──────────────────────────────────────
function AuthInput({ icon: Icon, type = 'text', placeholder, value, onChange, error, index = 0 }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <motion.div custom={index} variants={fieldVariants} initial="hidden" animate="visible">
      <div className="relative group">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <Icon
            size={18}
            className={`transition-colors duration-200 ${
              error ? 'text-red-500' : 'text-slate-600 group-focus-within:text-orange-500'
            }`}
          />
        </div>

        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          autoComplete={isPassword ? 'current-password' : type === 'email' ? 'email' : 'name'}
          className={[
            'w-full pl-11 pr-11 py-3.5 rounded-xl bg-slate-950 border text-white text-sm',
            'placeholder-slate-600 focus:outline-none focus:ring-1 transition-all duration-200 font-inter',
            error
              ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/30'
              : 'border-slate-800 focus:border-orange-500 focus:ring-orange-500/30',
          ].join(' ')}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors cursor-pointer"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.2 }}
            className="text-red-500 text-xs mt-1.5 pl-1 font-inter"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}



// ═════════════════════════════════════════════════════════
// AuthScreen Component
// ═════════════════════════════════════════════════════════
export default function AuthScreen({ onAuth, onBack }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [direction, setDirection] = useState(1);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Errors
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);



  const [resetSent, setResetSent] = useState(false);

  const toggleMode = useCallback(() => {
    setDirection(mode === 'login' ? 1 : -1);
    setMode((m) => (m === 'login' ? 'register' : 'login'));
    setErrors({});
    setFormError('');
    setResetSent(false);
  }, [mode]);

  // ── Validate ─────────────────────────────────────────
  const validate = useCallback(() => {
    const newErrors = {};

    if (mode === 'register' && !name.trim()) {
      newErrors.name = t('auth.errors.nameRequired');
    }

    if (!email.trim()) {
      newErrors.email = t('auth.errors.emailRequired');
    } else if (!validateEmail(email)) {
      newErrors.email = t('auth.errors.emailInvalid');
    }

    if (!password) {
      newErrors.password = t('auth.errors.passwordRequired');
    } else if (password.length < 6) {
      newErrors.password = t('auth.errors.passwordMin');
    }

    if (mode === 'register') {
      if (!confirmPassword) {
        newErrors.confirmPassword = t('auth.errors.confirmRequired');
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = t('auth.errors.confirmMismatch');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [mode, name, email, password, confirmPassword]);

  // ── Submit ───────────────────────────────────────────
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setFormError('');

      if (!validate()) return;

      setIsSubmitting(true);

      try {
        if (mode === 'register') {
          const result = await signUp(email.toLowerCase().trim(), password, name.trim());
          
          // If session exists (email confirmation disabled), proceed directly
          if (result.session) {
            const user = result.user;
            onAuth({ name: user.user_metadata?.name || name.trim(), email: user.email, id: user.id });
          } else {
            // Email confirmation may be enabled — auto sign-in after registration
            try {
              const loginResult = await signIn(email.toLowerCase().trim(), password);
              const user = loginResult.user;
              onAuth({ name: user.user_metadata?.name || name.trim(), email: user.email, id: user.id });
            } catch {
              // If sign-in also fails, use the signUp user data directly
              const user = result.user;
              if (user) {
                onAuth({ name: user.user_metadata?.name || name.trim(), email: user.email, id: user.id });
              }
            }
          }
        } else {
          const result = await signIn(email.toLowerCase().trim(), password);
          const user = result.user;
          onAuth({ name: user.user_metadata?.name || 'User', email: user.email, id: user.id });
        }
      } catch (err) {
        const msg = err.message || '';
        if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('already been registered')) {
          setFormError(t('auth.errors.emailTaken'));
        } else if (msg.includes('Invalid login') || msg.includes('invalid')) {
          setFormError(t('auth.errors.invalidCredentials'));
        } else {
          setFormError(msg || t('auth.errors.invalidCredentials'));
        }
      }

      setIsSubmitting(false);
    },
    [mode, name, email, password, confirmPassword, validate, onAuth]
  );

  // ── Forgot Password Submit ──────────────────────────
  const handleForgotSubmit = useCallback(async (e) => {
    e.preventDefault();
    setFormError('');
    if (!email.trim() || !validateEmail(email)) {
      setErrors({ email: t('auth.errors.emailInvalid') });
      return;
    }
    setIsSubmitting(true);
    try {
      await resetPassword(email.toLowerCase().trim());
      setResetSent(true);
    } catch (err) {
      setFormError(err.message || t('auth.errors.resetFailed'));
    }
    setIsSubmitting(false);
  }, [email, t]);

  const isLogin = mode === 'login';
  const isForgot = mode === 'forgot';

  return (
    <div
      className="min-h-screen bg-slate-950 bg-grid text-white flex flex-col items-center justify-center px-4 py-8"
      onClick={(e) => { if (e.target === e.currentTarget && onBack) onBack(); }}
    >
      <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>

        {/* ── Back Button ── */}
        {onBack && (
          <motion.button
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            onClick={onBack}
            className="flex items-center gap-1.5 text-slate-500 hover:text-orange-400 text-sm font-outfit mb-6 transition-colors cursor-pointer group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            {t('auth.backToHome') || 'Ana Sayfa'}
          </motion.button>
        )}

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold font-outfit tracking-tighter bg-gradient-to-r from-orange-500 via-amber-400 to-blue-500 bg-clip-text text-transparent mb-2">
            {t('auth.title')}
          </h1>
          <p className="text-slate-500 text-sm font-outfit">
            {t('auth.subtitle')}
          </p>
        </motion.div>

        {/* ── Mode Toggle ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 mb-6"
        >
          {['login', 'register'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                if (m !== mode) {
                  setDirection(m === 'register' ? 1 : -1);
                  setMode(m);
                  setErrors({});
                  setFormError('');
                }
              }}
              className={[
                'relative flex-1 py-2.5 text-sm font-semibold font-outfit rounded-lg transition-all duration-300 cursor-pointer',
                mode === m ? 'text-white' : 'text-slate-500 hover:text-slate-300',
              ].join(' ')}
            >
              {mode === m && (
                <motion.div
                  layoutId="authTab"
                  className="absolute inset-0 bg-gradient-to-r from-orange-500/15 to-blue-500/15 border border-orange-500/30 rounded-lg"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <span className="relative z-10">{m === 'login' ? t('auth.login') : t('auth.register')}</span>
            </button>
          ))}
        </motion.div>

        {/* ── Form Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl shadow-black/20"
        >
          {/* Motivational badge */}
          <div className="flex items-center gap-2 mb-6 px-3 py-2 rounded-lg bg-orange-500/5 border border-orange-500/10">
            <Shield size={14} className="text-orange-400 shrink-0" />
            <p className="text-xs text-slate-400 font-inter">
              {isForgot
                ? t('auth.forgotMsg') || 'E-posta adresinize şifre sıfırlama bağlantısı gönderilecek.'
                : isLogin
                ? t('auth.loginMsg')
                : t('auth.registerMsg')}
            </p>
          </div>

          <AnimatePresence mode="wait" custom={direction}>
            {isForgot ? (
              /* ─── Forgot Password Form ─── */
              <motion.form
                key="forgot"
                custom={direction}
                variants={formVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                onSubmit={handleForgotSubmit}
                className="space-y-4"
                noValidate
              >
                {resetSent ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-4"
                  >
                    <CheckCircle size={40} className="text-emerald-400 mx-auto mb-3" />
                    <p className="text-sm text-white font-outfit font-bold mb-1">
                      {t('auth.resetSentTitle') || 'Bağlantı Gönderildi!'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {t('auth.resetSentDesc') || 'E-posta kutunuzu kontrol edin. Şifre sıfırlama bağlantınız gönderildi.'}
                    </p>
                  </motion.div>
                ) : (
                  <>
                    <AuthInput
                      icon={Mail}
                      type="email"
                      placeholder={t('auth.email')}
                      value={email}
                      onChange={setEmail}
                      error={errors.email}
                      index={0}
                    />

                    <AnimatePresence mode="wait">
                      {formError && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.25 }}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                          <p className="text-red-500 text-xs font-inter">{formError}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-blue-500 text-white text-sm font-bold font-outfit tracking-wide shadow-lg shadow-orange-500/20 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                        />
                      ) : (
                        <>
                          {t('auth.sendResetLink') || 'Sıfırlama Bağlantısı Gönder'}
                          <ArrowRight size={16} />
                        </>
                      )}
                    </motion.button>
                  </>
                )}
              </motion.form>
            ) : (
              /* ─── Login / Register Form ─── */
              <motion.form
                key={mode}
                custom={direction}
                variants={formVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                onSubmit={handleSubmit}
                className="space-y-4"
                noValidate
              >
                {!isLogin && (
                  <AuthInput
                    icon={User}
                    placeholder={t('auth.name')}
                    value={name}
                    onChange={setName}
                    error={errors.name}
                    index={0}
                  />
                )}

                <AuthInput
                  icon={Mail}
                  type="email"
                  placeholder={t('auth.email')}
                  value={email}
                  onChange={setEmail}
                  error={errors.email}
                  index={isLogin ? 0 : 1}
                />

                <AuthInput
                  icon={Lock}
                  type="password"
                  placeholder={t('auth.password')}
                  value={password}
                  onChange={setPassword}
                  error={errors.password}
                  index={isLogin ? 1 : 2}
                />

                {!isLogin && (
                  <AuthInput
                    icon={Lock}
                    type="password"
                    placeholder={t('auth.confirmPassword')}
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    error={errors.confirmPassword}
                    index={3}
                  />
                )}

                {/* Forgot password link */}
                {isLogin && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => { setDirection(1); setMode('forgot'); setErrors({}); setFormError(''); setResetSent(false); }}
                      className="text-xs text-slate-500 hover:text-orange-400 transition-colors cursor-pointer font-inter"
                    >
                      {t('auth.forgotPassword') || 'Şifremi Unuttum'}
                    </button>
                  </div>
                )}

                <AnimatePresence mode="wait">
                  {formError && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.25 }}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                      <p className="text-red-500 text-xs font-inter">{formError}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.02, boxShadow: '0 0 32px rgba(249,115,22,0.3)' }}
                  whileTap={{ scale: 0.97 }}
                  className={[
                    'w-full flex items-center justify-center gap-2 py-3.5 rounded-xl',
                    'bg-gradient-to-r from-orange-500 to-blue-500 text-white text-sm font-bold font-outfit tracking-wide',
                    'shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all duration-200 cursor-pointer',
                    'disabled:opacity-60 disabled:cursor-not-allowed',
                  ].join(' ')}
                >
                  {isSubmitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    <>
                      {isLogin ? t('auth.submitLogin') : t('auth.submitRegister')}
                      {isLogin ? <ArrowRight size={16} /> : <Sparkles size={16} />}
                    </>
                  )}
                </motion.button>

                {/* Register: Privacy + Terms notice */}
                {!isLogin && (
                  <p className="text-[10px] text-slate-600 text-center leading-relaxed">
                    {t('auth.agreeText') || 'Kayıt olarak'}{' '}
                    <Link to="/privacy" className="text-orange-400/70 hover:text-orange-400 underline transition-colors">
                      {t('auth.privacyLink') || 'Gizlilik Politikası'}
                    </Link>
                    {' '}{t('auth.and') || 've'}{' '}
                    <Link to="/terms" className="text-orange-400/70 hover:text-orange-400 underline transition-colors">
                      {t('auth.termsLink') || 'Kullanım Şartları'}
                    </Link>
                    {t('auth.agreeEnd') || "'nı kabul etmiş olursunuz."}
                  </p>
                )}
              </motion.form>
            )}
          </AnimatePresence>

          {/* ─── Toggle Link ─── */}
          <div className="mt-6 pt-4 border-t border-slate-800/50 text-center">
            <p className="text-sm text-slate-500 font-inter">
              {isForgot ? (t('auth.rememberPassword') || 'Şifreni hatırlıyor musun?') : (isLogin ? t('auth.noAccount') : t('auth.hasAccount'))}{' '}
              <button
                type="button"
                onClick={() => {
                  setDirection(isForgot || !isLogin ? -1 : 1);
                  setMode(isForgot ? 'login' : (isLogin ? 'register' : 'login'));
                  setErrors({});
                  setFormError('');
                  setResetSent(false);
                }}
                className="text-orange-400 hover:text-orange-300 font-semibold transition-colors cursor-pointer"
              >
                {isForgot ? (t('auth.login') || 'Giriş Yap') : (isLogin ? t('auth.register') : t('auth.login'))}
              </button>
            </p>
          </div>


        </motion.div>

        {/* ── Footer tagline ── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-center text-xs text-slate-700 mt-6 font-outfit"
        >
          {t('auth.tagline')}
        </motion.p>
      </div>
    </div>
  );
}
