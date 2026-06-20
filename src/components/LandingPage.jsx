import { motion } from 'framer-motion';
import {
  Dumbbell, UtensilsCrossed, TrendingUp, Timer, Award,
  Droplets, Target, ChevronRight, Shield, Smartphone, BarChart3,
  Heart, Flame, Brain, Sun, CircleDot, Cog, Users, Star,
  Camera, Scale, Trophy, Globe, CreditCard, Download, ArrowRight,
  CheckCircle2, Quote, Sparkles, Lock, Languages, MonitorSmartphone,
  RefreshCw, FileDown, Apple, Calculator, ShoppingBag, Image,
  Activity, Clock, Volume2, BookOpen, UserCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n/LanguageContext';

/* ── animation presets ── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

const fadeIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: (i = 0) => ({
    opacity: 1, scale: 1,
    transition: { delay: i * 0.12, duration: 0.5, ease: 'easeOut' },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

/* ── section wrapper helper ── */
function Section({ children, className = '', dark = false, id }) {
  return (
    <section
      id={id}
      className={[
        'py-20 sm:py-28 px-4',
        dark ? 'bg-slate-900/30 border-y border-slate-800/40' : '',
        className,
      ].join(' ')}
    >
      {children}
    </section>
  );
}

function SectionHeader({ tag, title, titleAccent, desc, idx = 0 }) {
  return (
    <motion.div
      initial="hidden" whileInView="visible" viewport={{ once: true }}
      className="text-center mb-16"
    >
      {tag && (
        <motion.span custom={idx} variants={fadeUp}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium mb-5"
        >
          <Sparkles size={12} /> {tag}
        </motion.span>
      )}
      <motion.h2 custom={idx + 1} variants={fadeUp}
        className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-outfit mb-4"
      >
        {title}{' '}
        {titleAccent && (
          <span className="bg-gradient-to-r from-orange-400 to-blue-400 bg-clip-text text-transparent">
            {titleAccent}
          </span>
        )}
      </motion.h2>
      {desc && (
        <motion.p custom={idx + 2} variants={fadeUp}
          className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed"
        >
          {desc}
        </motion.p>
      )}
    </motion.div>
  );
}

/* ────────────────────────────────────────────
   MAIN COMPONENT
   ──────────────────────────────────────────── */
export default function LandingPage({ onStart }) {
  const { t, lang, setLang, langFlags, SUPPORTED } = useTranslation();

  /* ── stats data ── */
  const stats = [
    { value: '100+', label: t('landing.stats.exercises') || 'Egzersiz' },
    { value: '50+', label: t('landing.stats.recipes') || 'Tarif' },
    { value: '24', label: t('landing.stats.programs') || 'Program' },
    { value: '6', label: t('landing.stats.goals') || 'Hedef' },
    { value: '%100', label: t('landing.stats.free') || 'Ücretsiz' },
  ];

  /* ── 6 goals ── */
  const goals = [
    {
      emoji: '💪', key: 'muscle',
      icon: Dumbbell, color: '#f97316',
      bullets: [
        t('landing.goals.muscle.b1') || 'Hypertrophy & strength split',
        t('landing.goals.muscle.b2') || 'Progressive overload tracking',
        t('landing.goals.muscle.b3') || 'Bulk & lean gain meal plans',
      ],
    },
    {
      emoji: '⚡', key: 'fatburn',
      icon: Flame, color: '#ef4444',
      bullets: [
        t('landing.goals.fatburn.b1') || 'HIIT & Tabata protocols',
        t('landing.goals.fatburn.b2') || 'Calorie deficit calculator',
        t('landing.goals.fatburn.b3') || 'Cardio + resistance combos',
      ],
    },
    {
      emoji: '🧘', key: 'meditation',
      icon: Brain, color: '#a855f7',
      bullets: [
        t('landing.goals.meditation.b1') || 'Breathwork & mindfulness',
        t('landing.goals.meditation.b2') || 'Zen & Vipassana sessions',
        t('landing.goals.meditation.b3') || 'Stress & sleep programs',
      ],
    },
    {
      emoji: '☀️', key: 'yoga',
      icon: Sun, color: '#eab308',
      bullets: [
        t('landing.goals.yoga.b1') || 'Sun Salutation to Ashtanga',
        t('landing.goals.yoga.b2') || 'Flexibility & mobility flows',
        t('landing.goals.yoga.b3') || 'Guided sessions with cues',
      ],
    },
    {
      emoji: '🎯', key: 'pilates',
      icon: CircleDot, color: '#06b6d4',
      bullets: [
        t('landing.goals.pilates.b1') || 'Mat Pilates fundamentals',
        t('landing.goals.pilates.b2') || 'Core stability & posture',
        t('landing.goals.pilates.b3') || 'Beginner to advanced flows',
      ],
    },
    {
      emoji: '🔧', key: 'reformer',
      icon: Cog, color: '#22c55e',
      bullets: [
        t('landing.goals.reformer.b1') || 'Machine-based resistance',
        t('landing.goals.reformer.b2') || 'Spring tension progressions',
        t('landing.goals.reformer.b3') || 'Full-body sculpt routines',
      ],
    },
  ];

  /* ── adaptive phases ── */
  const phases = [
    { phase: 0, label: t('landing.adaptive.phase0') || 'Foundation', color: '#22c55e', icon: UserCheck },
    { phase: 1, label: t('landing.adaptive.phase1') || 'Intermediate', color: '#3b82f6', icon: TrendingUp },
    { phase: 2, label: t('landing.adaptive.phase2') || 'Advanced', color: '#f97316', icon: Flame },
    { phase: 3, label: t('landing.adaptive.phase3') || 'Master', color: '#a855f7', icon: Trophy },
  ];

  /* ── nutrition features ── */
  const nutritionFeatures = [
    { icon: Calculator, color: '#f97316', title: t('landing.nutrition.calorie.title') || 'BMR, TDEE & BMI', desc: t('landing.nutrition.calorie.desc') || 'Kişisel kalori hesaplama ile hedefine uygun beslenme' },
    { icon: Apple, color: '#22c55e', title: t('landing.nutrition.meal.title') || '7 Günlük Menü', desc: t('landing.nutrition.meal.desc') || 'Makro takipli günlük yemek planları' },
    { icon: ShoppingBag, color: '#06b6d4', title: t('landing.nutrition.budget.title') || 'Bütçeye Uygun', desc: t('landing.nutrition.budget.desc') || 'Ekonomik, Orta ve Premium seçenekler' },
    { icon: Camera, color: '#eab308', title: t('landing.nutrition.photo.title') || 'Fotoğrafla Kalori', desc: t('landing.nutrition.photo.desc') || 'Yemek fotoğrafı yükle, kaloriyi gör' },
  ];

  /* ── tracking features ── */
  const trackingFeatures = [
    { icon: Droplets, color: '#06b6d4', title: t('landing.tracking.water.title') || 'Su Takibi', desc: t('landing.tracking.water.desc') || 'Günlük su hedefi ve hatırlatmalar' },
    { icon: Image, color: '#a855f7', title: t('landing.tracking.photos.title') || 'İlerleme Fotoğrafları', desc: t('landing.tracking.photos.desc') || 'Öncesi-sonrası galeri karşılaştırma' },
    { icon: Scale, color: '#22c55e', title: t('landing.tracking.weight.title') || 'Kilo & Ölçü Takibi', desc: t('landing.tracking.weight.desc') || 'Ağırlık ve vücut ölçümlerini kaydet' },
    { icon: Award, color: '#f59e0b', title: t('landing.tracking.badges.title') || 'Başarı Rozetleri', desc: t('landing.tracking.badges.desc') || 'Kilometre taşları ve ödül sistemi' },
  ];

  /* ── workout features ── */
  const workoutFeatures = [
    { icon: Dumbbell, color: '#f97316', title: t('landing.workouts.programs.title') || '24 Program', desc: t('landing.workouts.programs.desc') || '6 hedef × 4 faz = 24 benzersiz program' },
    { icon: Activity, color: '#3b82f6', title: t('landing.workouts.split.title') || 'Gün Gün Split', desc: t('landing.workouts.split.desc') || 'Set, tekrar ve dinlenme süreleri' },
    { icon: Clock, color: '#22c55e', title: t('landing.workouts.timer.title') || 'Dinlenme Zamanlayıcı', desc: t('landing.workouts.timer.desc') || 'Sesli uyarılı rest timer' },
    { icon: BookOpen, color: '#a855f7', title: t('landing.workouts.form.title') || 'Form Rehberi', desc: t('landing.workouts.form.desc') || 'Egzersiz açıklamaları ve ipuçları' },
  ];

  /* ── free features ── */
  const freeFeatures = [
    { icon: CreditCard, text: t('landing.free.noCost') || '%100 ücretsiz — gizli ücret yok' },
    { icon: UserCheck, text: t('landing.free.noPT') || 'PT\'ye gerek yok — aynı kalite programlar' },
    { icon: Languages, text: t('landing.free.langs') || '3 dil desteği (TR, EN, ES)' },
    { icon: MonitorSmartphone, text: t('landing.free.device') || 'Her cihazda çalışır (mobile-first)' },
    { icon: RefreshCw, text: t('landing.free.switch') || 'Profil ve hedef değiştirme her zaman' },
    { icon: FileDown, text: t('landing.free.export') || 'Veri dışa aktarma' },
  ];

  /* ── steps ── */
  const stepKeys = ['s1', 's2', 's3'];
  const stepIcons = [UserCheck, BarChart3, Sparkles];

  /* ── comparison: PT vs Full Balance ── */
  const comparisons = [
    { icon: CreditCard, pt: t('landing.compare.c1.pt') || '₺2.000-5.000/ay', fb: t('landing.compare.c1.fb') || '%100 Ücretsiz', label: t('landing.compare.c1.label') || 'Maliyet' },
    { icon: Target, pt: t('landing.compare.c2.pt') || 'Tek odak (fitness)', fb: t('landing.compare.c2.fb') || 'Fitness + Yoga + Meditasyon + Beslenme', label: t('landing.compare.c2.label') || 'Kapsam' },
    { icon: Clock, pt: t('landing.compare.c3.pt') || 'Randevuya bağlı', fb: t('landing.compare.c3.fb') || '7/24 her yerden erişim', label: t('landing.compare.c3.label') || 'Erişim' },
    { icon: RefreshCw, pt: t('landing.compare.c4.pt') || 'Standart program', fb: t('landing.compare.c4.fb') || 'AI destekli adaptif planlar', label: t('landing.compare.c4.label') || 'Program' },
    { icon: BarChart3, pt: t('landing.compare.c5.pt') || 'Kağıt/WhatsApp takip', fb: t('landing.compare.c5.fb') || 'Akıllı ilerleme analizi', label: t('landing.compare.c5.label') || 'Takip' },
    { icon: Globe, pt: t('landing.compare.c6.pt') || 'Tek dil', fb: t('landing.compare.c6.fb') || '3 dil desteği (TR/EN/ES)', label: t('landing.compare.c6.label') || 'Dil' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">

      {/* ═══════════════════ NAV ═══════════════════ */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-slate-950/70 border-b border-slate-800/40"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="text-[#ff6d00]" size={20} />
            <span className="font-outfit font-bold text-base tracking-tight bg-gradient-to-r from-orange-500 via-amber-400 to-blue-500 bg-clip-text text-transparent">
              FULL BALANCE
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Language switcher */}
            <div className="flex items-center gap-0.5 mr-1">
              {SUPPORTED.map((code) => (
                <button
                  key={code}
                  onClick={() => setLang(code)}
                  className={[
                    'text-sm px-1 py-0.5 rounded transition-all cursor-pointer',
                    lang === code ? 'opacity-100 scale-110' : 'opacity-40 hover:opacity-70',
                  ].join(' ')}
                  title={code.toUpperCase()}
                >
                  {langFlags[code]}
                </button>
              ))}
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onStart}
              className="px-4 py-2 text-xs font-bold font-outfit rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/20 cursor-pointer"
            >
              {t('landing.startNow') || 'Başla'}
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* ═══════════════════ SECTION 1: HERO ═══════════════════ */}
      <section className="relative pt-28 pb-20 sm:pt-40 sm:pb-32 px-4 overflow-hidden">
        {/* Background glows */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[min(700px,100vw)] h-[500px] bg-gradient-radial from-orange-500/10 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-0 w-[min(400px,50vw)] h-[400px] bg-gradient-radial from-blue-500/8 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[min(300px,40vw)] h-[300px] bg-gradient-radial from-purple-500/6 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium mb-6">
              <Sparkles size={12} />
              {t('landing.badge') || 'AI-Powered Fitness & Wellness'}
            </span>
          </motion.div>

          <motion.h1
            custom={1} variants={fadeUp} initial="hidden" animate="visible"
            className="text-4xl sm:text-5xl md:text-7xl font-extrabold font-outfit leading-[1.08] tracking-tight mb-6"
          >
            {t('landing.heroTitle1') || 'Vücudunu Dönüştür,'}{' '}
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-orange-500 via-amber-400 to-blue-500 bg-clip-text text-transparent">
              {t('landing.heroTitle2') || 'Zihnini Güçlendir'}
            </span>
          </motion.h1>

          <motion.p
            custom={2} variants={fadeUp} initial="hidden" animate="visible"
            className="text-slate-400 text-base sm:text-lg md:text-xl max-w-3xl mx-auto mb-12 leading-relaxed"
          >
            {t('landing.heroDesc') || 'Kas gelişimi, yağ yakımı, yoga, pilates, meditasyon ve reformer — 6 hedef kategorisi, 24 program, 500+ tarif ve 10.000+ egzersiz. Tamamen ücretsiz, kişisel antrenörün cebinde.'}
          </motion.p>

          <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible" className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 50px rgba(249,115,22,0.35)' }}
              whileTap={{ scale: 0.95 }}
              onClick={onStart}
              className="flex items-center gap-2 px-10 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-bold font-outfit shadow-xl shadow-orange-500/25 cursor-pointer"
            >
              {t('landing.ctaStart') || 'Ücretsiz Başla'}
              <ChevronRight size={16} />
            </motion.button>
            <span className="flex items-center gap-1.5 text-slate-500 text-xs">
              <Shield size={12} />
              {t('landing.noCard') || 'Kredi kartı gerekmez'}
            </span>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════ STATS BAR ═══════════════════ */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="border-y border-slate-800/50 bg-slate-900/30"
      >
        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-wrap justify-center gap-6 sm:grid sm:grid-cols-5">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-center w-[calc(50%-12px)] sm:w-auto"
            >
              <p className="text-2xl sm:text-3xl font-extrabold font-outfit bg-gradient-to-r from-orange-400 to-blue-400 bg-clip-text text-transparent">
                {s.value}
              </p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ═══════════════════ SECTION 2: 6 GOAL CATEGORIES ═══════════════════ */}
      <Section id="goals">
        <div className="max-w-6xl mx-auto">
          <SectionHeader
            tag={t('landing.goals.tag') || '6 Hedef Kategorisi'}
            title={t('landing.goals.title') || 'Hedefini Seç,'}
            titleAccent={t('landing.goals.titleAccent') || 'Yolculuğuna Başla'}
            desc={t('landing.goals.desc') || 'Fitness, wellness ve zihinsel sağlık — hepsi tek platformda. Hedefine özel program ve beslenme planı.'}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {goals.map((g, i) => {
              const Icon = g.icon;
              return (
                <motion.div
                  key={g.key}
                  custom={i}
                  variants={fadeIn}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  whileHover={{ y: -4, borderColor: `${g.color}50` }}
                  className="relative p-6 rounded-2xl bg-slate-900/60 border border-slate-800/60 transition-all group overflow-hidden"
                >
                  {/* Accent glow */}
                  <div
                    className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500"
                    style={{ backgroundColor: g.color }}
                  />

                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">{g.emoji}</span>
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${g.color}15` }}
                      >
                        <Icon size={20} style={{ color: g.color }} />
                      </div>
                    </div>
                    <h3 className="font-outfit font-bold text-white text-lg mb-3">
                      {t(`landing.goals.${g.key}.title`) || g.key}
                    </h3>
                    <ul className="space-y-2">
                      {g.bullets.map((b, bi) => (
                        <li key={bi} className="flex items-start gap-2 text-slate-400 text-xs leading-relaxed">
                          <CheckCircle2 size={14} className="mt-0.5 shrink-0" style={{ color: g.color }} />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ═══════════════════ SECTION 3: ADAPTIVE TRAINING SYSTEM ═══════════════════ */}
      <Section dark id="adaptive">
        <div className="max-w-5xl mx-auto">
          <SectionHeader
            tag={t('landing.adaptive.tag') || 'Akıllı İlerleme'}
            title={t('landing.adaptive.title') || 'Akıllı Faz Sistemi'}
            titleAccent={t('landing.adaptive.titleAccent') || '— 4 Aşama'}
            desc={t('landing.adaptive.desc') || 'AI ilerlemenizi analiz eder ve ne zaman bir sonraki faza geçmeniz gerektiğini otomatik önerir. Plato tespiti ve stagnasyon uyarıları ile sürekli gelişim.'}
          />

          {/* Phase timeline */}
          <div className="relative max-w-3xl mx-auto">
            {/* Connecting line */}
            <div className="absolute top-8 left-8 right-8 h-0.5 bg-gradient-to-r from-green-500/40 via-blue-500/40 via-orange-500/40 to-purple-500/40 hidden sm:block" />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-4 mb-12">
              {phases.map((p, i) => {
                const PhaseIcon = p.icon;
                return (
                  <motion.div
                    key={p.phase}
                    custom={i}
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="relative text-center"
                  >
                    <div
                      className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-3 border border-slate-700/50 relative z-10"
                      style={{ backgroundColor: `${p.color}12` }}
                    >
                      <PhaseIcon size={28} style={{ color: p.color }} />
                    </div>
                    <div className="text-xs font-bold font-outfit mb-1" style={{ color: p.color }}>
                      {t('landing.adaptive.phaseLabel') || 'FAZ'} {p.phase}
                    </div>
                    <div className="text-sm font-outfit font-semibold text-white">
                      {p.label}
                    </div>
                    {i < 3 && (
                      <div className="hidden sm:flex absolute top-8 -right-4 z-20 text-slate-600">
                        <ArrowRight size={16} />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* AI feature callouts */}
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              {[
                { icon: Brain, text: t('landing.adaptive.ai') || 'AI ilerleme analizi', color: '#3b82f6' },
                { icon: Target, text: t('landing.adaptive.plateau') || 'Plato tespiti', color: '#f97316' },
                { icon: TrendingUp, text: t('landing.adaptive.auto') || 'Otomatik faz önerisi', color: '#22c55e' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  custom={i + 4}
                  variants={fadeUp}
                  className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/40 border border-slate-700/30"
                >
                  <item.icon size={20} style={{ color: item.color }} />
                  <span className="text-sm text-slate-300">{item.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </Section>

      {/* ═══════════════════ SECTION 4: NUTRITION & CALORIE ═══════════════════ */}
      <Section id="nutrition">
        <div className="max-w-6xl mx-auto">
          <SectionHeader
            tag={t('landing.nutrition.tag') || 'Kişisel Beslenme'}
            title={t('landing.nutrition.title') || 'Kişisel Beslenme'}
            titleAccent={t('landing.nutrition.titleAccent') || '& Kalori Takibi'}
            desc={t('landing.nutrition.desc') || 'BMR, TDEE ve BMI hesaplamaları ile kişiselleştirilmiş beslenme planları. Bütçene uygun seçeneklerle makro hedeflerine ulaş.'}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {nutritionFeatures.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={i}
                  custom={i}
                  variants={fadeIn}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  whileHover={{ y: -4 }}
                  className="flex gap-4 p-6 rounded-2xl bg-slate-900/60 border border-slate-800/60 transition-all"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${f.color}15` }}
                  >
                    <Icon size={24} style={{ color: f.color }} />
                  </div>
                  <div>
                    <h3 className="font-outfit font-bold text-white text-sm mb-1">{f.title}</h3>
                    <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ═══════════════════ SECTION 5: SMART TRACKING ═══════════════════ */}
      <Section dark id="tracking">
        <div className="max-w-6xl mx-auto">
          <SectionHeader
            tag={t('landing.tracking.tag') || 'Gelişimini Gör'}
            title={t('landing.tracking.title') || 'Akıllı Takip'}
            titleAccent={t('landing.tracking.titleAccent') || 'Sistemi'}
            desc={t('landing.tracking.desc') || 'Su, kilo, vücut ölçüleri ve ilerleme fotoğrafları — tüm verilerini tek yerde takip et, başarı rozetleri kazan.'}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {trackingFeatures.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={i}
                  custom={i}
                  variants={fadeIn}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  whileHover={{ y: -4 }}
                  className="flex gap-4 p-6 rounded-2xl bg-slate-800/40 border border-slate-700/30 transition-all"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${f.color}15` }}
                  >
                    <Icon size={24} style={{ color: f.color }} />
                  </div>
                  <div>
                    <h3 className="font-outfit font-bold text-white text-sm mb-1">{f.title}</h3>
                    <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ═══════════════════ SECTION 6: WORKOUT FEATURES ═══════════════════ */}
      <Section id="workouts">
        <div className="max-w-6xl mx-auto">
          <SectionHeader
            tag={t('landing.workouts.tag') || 'Profesyonel Programlar'}
            title={t('landing.workouts.title') || 'Profesyonel Antrenman'}
            titleAccent={t('landing.workouts.titleAccent') || 'Programları'}
            desc={t('landing.workouts.desc') || '6 hedef × 4 faz = 24 benzersiz program. Gün gün egzersiz planı, set/tekrar/dinlenme detayları ve sesli zamanlayıcı.'}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {workoutFeatures.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={i}
                  custom={i}
                  variants={fadeIn}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  whileHover={{ y: -4 }}
                  className="flex gap-4 p-6 rounded-2xl bg-slate-900/60 border border-slate-800/60 transition-all"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${f.color}15` }}
                  >
                    <Icon size={24} style={{ color: f.color }} />
                  </div>
                  <div>
                    <h3 className="font-outfit font-bold text-white text-sm mb-1">{f.title}</h3>
                    <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ═══════════════════ SECTION 7: FREE & ACCESSIBLE ═══════════════════ */}
      <Section dark id="free">
        <div className="max-w-4xl mx-auto">
          <SectionHeader
            tag={t('landing.free.tag') || 'Sıfır Maliyet'}
            title={t('landing.free.title') || 'Tamamen Ücretsiz,'}
            titleAccent={t('landing.free.titleAccent') || 'Sonsuza Kadar'}
            desc={t('landing.free.desc') || 'Gizli ücret yok, premium duvarı yok, reklam yok. Profesyonel kalitede fitness programları herkes için erişilebilir olmalı.'}
          />

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto"
          >
            {freeFeatures.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/40 border border-slate-700/30"
                >
                  <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-green-400" />
                  </div>
                  <span className="text-sm text-slate-300">{f.text}</span>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </Section>

      {/* ═══════════════════ SECTION 8: HOW IT WORKS ═══════════════════ */}
      <Section id="steps">
        <div className="max-w-4xl mx-auto">
          <SectionHeader
            title={t('landing.stepsTitle1') || 'Nasıl'}
            titleAccent={t('landing.stepsTitle2') || 'Çalışır?'}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {stepKeys.map((key, i) => {
              const StepIcon = stepIcons[i];
              return (
                <motion.div
                  key={key}
                  custom={i + 1}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="relative text-center p-8 rounded-2xl bg-slate-900/40 border border-slate-800/40"
                >
                  <div className="text-5xl font-extrabold font-outfit bg-gradient-to-b from-orange-500/25 to-transparent bg-clip-text text-transparent mb-2">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-orange-500/10 to-blue-500/10 border border-slate-800 flex items-center justify-center mb-4">
                    <StepIcon size={22} className="text-orange-400" />
                  </div>
                  <h3 className="font-outfit font-bold text-white text-base mb-2">
                    {t(`landing.steps.${key}.title`) || ['Kayıt Ol', 'Bilgilerini Gir', 'Planını Al'][i]}
                  </h3>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    {t(`landing.steps.${key}.desc`) || ['Hızlı ve ücretsiz kayıt', 'Boy, kilo, hedef ve deneyim seviyeni gir', 'Kişiselleştirilmiş program ve beslenme planın hazır'][i]}
                  </p>
                  {i < 2 && (
                    <div className="hidden sm:block absolute top-1/2 -right-3 text-slate-700">
                      <ChevronRight size={20} />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ═══════════════════ SECTION 9: PT vs FULL BALANCE ═══════════════════ */}
      <Section dark id="compare">
        <div className="max-w-4xl mx-auto">
          <SectionHeader
            tag={t('landing.compare.tag') || 'Neden Full Balance?'}
            title={t('landing.compare.title') || 'Personal Trainer vs'}
            titleAccent={t('landing.compare.titleAccent') || 'Full Balance'}
          />

          {/* comparison table */}
          <motion.div
            variants={fadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="rounded-2xl border border-slate-700/30 overflow-hidden"
          >
            {/* table header */}
            <div className="grid grid-cols-[1fr_1fr_1fr] sm:grid-cols-[1.2fr_1fr_1fr] text-center">
              <div className="p-3 sm:p-4 bg-slate-800/60 border-b border-r border-slate-700/30" />
              <div className="p-3 sm:p-4 bg-slate-800/60 border-b border-r border-slate-700/30">
                <p className="font-outfit font-bold text-slate-400 text-xs sm:text-sm">🏋️ PT</p>
              </div>
              <div className="p-3 sm:p-4 bg-gradient-to-r from-orange-500/10 to-blue-500/10 border-b border-slate-700/30">
                <p className="font-outfit font-bold text-transparent bg-gradient-to-r from-orange-400 to-blue-400 bg-clip-text text-xs sm:text-sm">✨ Full Balance</p>
              </div>
            </div>

            {/* table rows */}
            {comparisons.map((c, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={fadeIn}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className={`grid grid-cols-[1fr_1fr_1fr] sm:grid-cols-[1.2fr_1fr_1fr] items-center ${i < comparisons.length - 1 ? 'border-b border-slate-700/20' : ''}`}
              >
                {/* label */}
                <div className="flex items-center gap-2 p-3 sm:p-4 border-r border-slate-700/20">
                  <c.icon size={16} className="text-orange-400 shrink-0 hidden sm:block" />
                  <span className="text-xs sm:text-sm font-outfit font-medium text-white">{c.label}</span>
                </div>
                {/* PT */}
                <div className="p-3 sm:p-4 text-center border-r border-slate-700/20">
                  <span className="text-xs sm:text-sm text-slate-500">{c.pt}</span>
                </div>
                {/* Full Balance */}
                <div className="p-3 sm:p-4 text-center bg-gradient-to-r from-orange-500/5 to-blue-500/5">
                  <span className="text-xs sm:text-sm text-emerald-400 font-medium">{c.fb}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* bottom highlight */}
          <motion.div
            variants={fadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mt-6 text-center"
          >
            <p className="text-sm text-slate-500 font-inter">
              {t('landing.compare.bottomText') || 'Aynı kalite, sıfır maliyet. Hemen başla.'}
            </p>
          </motion.div>
        </div>
      </Section>

      {/* ═══════════════════ SECTION 10: FINAL CTA ═══════════════════ */}
      <section className="relative py-24 sm:py-32 px-4 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-slate-950 to-blue-500/5 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-orange-500/8 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="relative max-w-3xl mx-auto text-center"
        >
          <motion.div custom={0} variants={fadeUp}>
            <Sparkles size={32} className="mx-auto text-orange-500 mb-6" />
          </motion.div>

          <motion.h2 custom={1} variants={fadeUp}
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-outfit mb-4"
          >
            {t('landing.readyTitle') || 'Dönüşümün'}
            <br />
            <span className="bg-gradient-to-r from-orange-500 via-amber-400 to-blue-500 bg-clip-text text-transparent">
              {t('landing.readySuffix') || 'Bugün Başlasın'}
            </span>
          </motion.h2>

          <motion.p custom={2} variants={fadeUp}
            className="text-slate-400 text-sm sm:text-base mb-4 max-w-lg mx-auto leading-relaxed"
          >
            {t('landing.readyDesc') || 'Profesyonel antrenman programları, kişisel beslenme planları ve akıllı takip araçları — hepsi ücretsiz.'}
          </motion.p>

          <motion.p custom={3} variants={fadeUp}
            className="text-orange-400/80 text-xs sm:text-sm mb-8 italic"
          >
            {t('landing.readyQuote') || '"PT\'lere verdiğin parayı artık kendin için kullan."'}
          </motion.p>

          <motion.button
            custom={4} variants={fadeUp}
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            whileHover={{ scale: 1.05, boxShadow: '0 0 70px rgba(249,115,22,0.3)' }}
            whileTap={{ scale: 0.95 }}
            onClick={onStart}
            className="px-12 py-5 rounded-xl bg-gradient-to-r from-orange-500 to-blue-500 text-white text-base font-bold font-outfit shadow-2xl shadow-orange-500/20 cursor-pointer"
          >
            {t('landing.ctaGenerate') || 'Ücretsiz Başla — Hemen'}
          </motion.button>

          <motion.div custom={5} variants={fadeUp}
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="flex items-center justify-center gap-6 mt-6 text-xs text-slate-600"
          >
            <span className="flex items-center gap-1"><Shield size={12} /> {t('landing.noCard') || 'Kredi kartı gerekmez'}</span>
            <span className="flex items-center gap-1"><Lock size={12} /> {t('landing.safe') || 'Güvenli'}</span>
            <span className="flex items-center gap-1"><Globe size={12} /> {t('landing.global') || '3 dil'}</span>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="border-t border-slate-800/40 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-orange-500" />
              <span className="font-outfit font-bold text-xs text-slate-600">FULL BALANCE</span>
            </div>
            <p className="text-[10px] text-slate-700">
              {t('landing.footer') || '© 2025 Full Balance. Tüm hakları saklıdır.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-1.5 pt-3 border-t border-slate-800/20">
            <Lock size={10} className="text-slate-700" />
            <p className="text-[9px] text-slate-700">
              {t('landing.footerPrivacy') || 'Verileriniz cihazınızda ve şifreli bulut sunucusunda güvende saklanır. Üçüncü taraflarla paylaşılmaz.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-3">
            <Link to="/privacy" className="text-[10px] text-slate-600 hover:text-orange-400 transition-colors">
              {t('auth.privacyLink') || 'Gizlilik Politikası'}
            </Link>
            <span className="text-slate-800">•</span>
            <Link to="/terms" className="text-[10px] text-slate-600 hover:text-orange-400 transition-colors">
              {t('auth.termsLink') || 'Kullanım Şartları'}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
