import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Ruler, Dumbbell, Flame, Wallet, Clock,
  LogOut, Trash2, RefreshCw, Heart, Sparkles, Scale, Activity,
  Camera, ImagePlus, X, ChevronLeft, ChevronRight,
  TrendingUp, Brain, Flower2, Circle, Wrench, Target, BadgeCheck, Globe,
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { generatePlan } from '../data/planGenerator';
import { deleteAllUserData, getProfilePhoto, getProgressPhotos, uploadPhoto, deleteProgressPhoto } from '../lib/dataService';
import { useToast } from './ToastProvider';

const PHOTO_KEY = 'shredmatrix_profile_photo';
const GALLERY_KEY = 'shredmatrix_progress_photos';

const containerV = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemV = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

function StatCard({ icon: Icon, label, value, unit, color = '#ff6d00' }) {
  return (
    <motion.div variants={itemV} className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-3 flex flex-col items-center gap-1.5">
      <Icon size={16} style={{ color }} />
      <span className="text-[10px] text-slate-400 font-outfit">{label}</span>
      <span className="text-sm font-bold text-white font-outfit">
        {value}{unit && <span className="text-xs text-slate-400 ml-0.5">{unit}</span>}
      </span>
    </motion.div>
  );
}

function Badge({ children }) {
  return (
    <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">
      {children}
    </span>
  );
}

function loadPhoto() {
  try { return localStorage.getItem(PHOTO_KEY) || null; } catch { return null; }
}
function savePhoto(dataUrl) {
  try { localStorage.setItem(PHOTO_KEY, dataUrl); } catch {}
}

function loadGallery() {
  try {
    const raw = localStorage.getItem(GALLERY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveGallery(arr) {
  try { localStorage.setItem(GALLERY_KEY, JSON.stringify(arr)); } catch {}
}

export default function ProfilePage({ plan, user, onLogout, onUpdatePlan, onPlanUpdate }) {
  const { t, lang, setLang, SUPPORTED, langLabels, langFlags } = useTranslation();
  const fileInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const [profilePhoto, setProfilePhoto] = useState(loadPhoto);
  const [gallery, setGallery] = useState(loadGallery);
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const [showGoalChange, setShowGoalChange] = useState(false);
  const [changingGoal, setChangingGoal] = useState(null);
  const toast = useToast();

  // Lock body scroll when lightbox is open (iOS Safari compatible)
  useEffect(() => {
    if (lightboxIdx !== null) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [lightboxIdx]);

  useEffect(() => {
    let cancelled = false;
    async function loadPhotos() {
      try {
        const [photo, photos] = await Promise.all([getProfilePhoto(), getProgressPhotos()]);
        if (cancelled) return;
        if (photo) setProfilePhoto(photo);
        setGallery(photos || []);
      } catch {
        // Keep local fallback state.
      }
    }
    loadPhotos();
    return () => {
      cancelled = true;
    };
  }, []);

  const goalOptions = [
    { value: 'muscle', icon: TrendingUp, label: t('onboarding.fields.muscle'), color: '#ff6d00' },
    { value: 'fat_loss', icon: Flame, label: t('onboarding.fields.fatLoss'), color: '#00b0ff' },
    { value: 'yoga', icon: Flower2, label: t('onboarding.fields.yoga'), color: '#a855f7' },
    { value: 'pilates', icon: Circle, label: t('onboarding.fields.pilates'), color: '#ec4899' },
    { value: 'reformer', icon: Wrench, label: t('onboarding.fields.reformer'), color: '#14b8a6' },
    { value: 'meditation', icon: Brain, label: t('onboarding.fields.meditation'), color: '#8b5cf6' },
  ];

  if (!plan) return null;

  const goalMap = { 'Kas Gelişimi': 'muscle', 'Yağ Yakımı': 'fat_loss', 'Meditasyon': 'meditation', 'Yoga': 'yoga', 'Pilates': 'pilates', 'Reformer': 'reformer' };
  const currentGoalKey = goalMap[plan.goal] || 'muscle';
  const experienceLabel = {
    beginner: t('onboarding.fields.beginner'),
    intermediate: t('onboarding.fields.intermediate'),
    advanced: t('onboarding.fields.advanced'),
  }[plan.userExperience] || plan.userExperience;
  const activityLabel = {
    sedentary: t('onboarding.fields.sedentary'),
    light: t('onboarding.fields.light'),
    moderate: t('onboarding.fields.moderate'),
    active: t('onboarding.fields.active'),
    athlete: t('onboarding.fields.veryActive'),
    veryActive: t('onboarding.fields.veryActive'),
  }[plan.userActivityLevel] || plan.userActivityLevel;
  const budgetLabel = {
    economy: t('onboarding.fields.low'),
    moderate: t('onboarding.fields.mid'),
    premium: t('onboarding.fields.high'),
  }[plan.userBudget] || plan.userBudget;
  const scheduleLabel = {
    morning: t('onboarding.fields.morning'),
    afternoon: t('onboarding.fields.afternoon'),
    evening: t('onboarding.fields.evening'),
    flexible: t('onboarding.fields.flexible'),
    none: t('onboarding.fields.flexible'),
  }[plan.userWorkSchedule] || plan.userWorkSchedule;

  const handleGoalChange = (newGoal) => {
    if (newGoal === currentGoalKey) return;
    setChangingGoal(newGoal);
    const userMetrics = {
      name: plan.userName,
      age: plan.userAge,
      gender: plan.userGender,
      height: plan.userHeight,
      weight: plan.userWeight,
      bodyFatPercentage: plan.userBodyFat,
      experience: plan.userExperience,
      activityLevel: plan.userActivityLevel || 'moderate',
      primaryGoal: newGoal,
      budget: plan.userBudget,
      workSchedule: plan.userWorkSchedule,
    };
    const newPlan = generatePlan(userMetrics, 0);
    // Reset phase tracking
    localStorage.setItem('shredmatrix_current_phase', '0');
    localStorage.setItem('shredmatrix_plan_created', new Date().toISOString());
    if (onPlanUpdate) onPlanUpdate(newPlan);
    setTimeout(() => {
      setChangingGoal(null);
      setShowGoalChange(false);
    }, 800);
  };

  const initials = (plan.userName || user?.name || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // ── Photo handlers ──
  const handleProfilePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadPhoto(file, 'profile');
      setProfilePhoto(url);
      savePhoto(url);
      toast.success(t('errors.saveSuccess'));
    } catch (err) {
      toast.error(t('errors.uploadFailed'));
    } finally {
      e.target.value = '';
    }
  };

  const handleGalleryPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadPhoto(file, 'progress');
      const updated = await getProgressPhotos();
      setGallery(updated || []);
      saveGallery(updated || []);
      toast.success(t('errors.saveSuccess'));
    } catch (err) {
      toast.error(t('errors.uploadFailed'));
    } finally {
      e.target.value = '';
    }
  };

  const deleteGalleryPhoto = async (id) => {
    if (!window.confirm(t('profile.deletePhotoConfirm'))) return;
    // Find the photo to get its name for Supabase deletion
    const photo = gallery.find((p) => p.id === id);
    // Optimistic UI update
    const updated = gallery.filter((p) => p.id !== id);
    setGallery(updated);
    saveGallery(updated);
    if (lightboxIdx !== null) setLightboxIdx(null);
    // Delete from Supabase Storage
    if (photo?.name) {
      try {
        const refreshed = await deleteProgressPhoto(photo.name);
        if (refreshed) {
          setGallery(refreshed);
          saveGallery(refreshed);
        }
      } catch {
        // Optimistic update already applied
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm(t('profile.deleteConfirm'))) return;
    try {
      await deleteAllUserData(user?.email);
    } catch {
      toast.error(t('errors.deleteFailed'));
      return;
    }
    onLogout();
  };

  return (
    <motion.div variants={containerV} initial="hidden" animate="visible" className="space-y-6">

      {/* ── Profile Header ── */}
      <motion.div variants={itemV} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-5">
        {/* Avatar with photo upload */}
        <div className="relative group">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-blue-500 flex items-center justify-center shadow-lg shadow-orange-500/20 overflow-hidden">
            {profilePhoto ? (
              <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold font-outfit text-white">{initials}</span>
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-orange-500 border-2 border-slate-900 flex items-center justify-center text-white cursor-pointer hover:bg-orange-400 transition-colors shadow-lg"
          >
            <Camera size={12} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleProfilePhoto}
          />
        </div>

        <div className="text-center sm:text-left flex-1">
          <h2 className="text-xl font-bold font-outfit text-white">{plan.userName || t('profile.user')}</h2>
          {user?.email && (
            <p className="text-sm text-slate-400 flex items-center gap-1.5 justify-center sm:justify-start mt-0.5">
              <Mail size={12} />
              {user.email}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start flex-wrap">
            <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-orange-500/15 to-blue-500/15 border border-orange-500/20 text-xs font-semibold text-orange-400">
              {plan.goal}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">
              {plan.dailyCalories} {t('profile.kcalDay')}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── Progress Photos Gallery ── */}
      <motion.div variants={itemV}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold font-outfit text-white flex items-center gap-2">
            <Camera size={14} className="text-orange-400" />
            {t('profile.progressPhotos')}
          </h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => galleryInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium cursor-pointer hover:bg-orange-500/20 transition-colors"
          >
            <ImagePlus size={12} />
            {t('profile.addPhoto')}
          </motion.button>
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleGalleryPhoto}
          />
        </div>

        {gallery.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
            <Camera size={32} className="text-slate-700 mx-auto mb-3" />
            <p className="text-xs text-slate-400">{t('profile.noPhotos')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {gallery.map((photo, idx) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative aspect-square rounded-xl overflow-hidden bg-slate-900 border border-slate-800 cursor-pointer"
                onClick={() => setLightboxIdx(idx)}
              >
                <img src={photo.src} alt="" className="w-full h-full object-cover" />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
                  <span className="text-[10px] text-white/80 font-medium">{new Date(photo.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lightboxIdx !== null && gallery[lightboxIdx] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
            style={{ touchAction: 'none', overscrollBehavior: 'contain' }}
            onClick={() => setLightboxIdx(null)}
          >
            <button
              onClick={() => setLightboxIdx(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white cursor-pointer hover:bg-white/20 z-10"
            >
              <X size={20} />
            </button>
            {lightboxIdx > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white cursor-pointer hover:bg-white/20 z-10"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            {lightboxIdx < gallery.length - 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white cursor-pointer hover:bg-white/20 z-10"
              >
                <ChevronRight size={20} />
              </button>
            )}
            <motion.img
              key={lightboxIdx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              src={gallery[lightboxIdx].src}
              alt=""
              className="max-w-full max-h-[75vh] rounded-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
              <p className="text-white text-sm font-outfit bg-black/50 px-4 py-1.5 rounded-full">
                {new Date(gallery[lightboxIdx].date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
              <button
                onClick={(e) => { e.stopPropagation(); deleteGalleryPhoto(gallery[lightboxIdx].id); setLightboxIdx(null); }}
                className="w-9 h-9 rounded-full bg-red-500/80 flex items-center justify-center text-white cursor-pointer hover:bg-red-500 transition-colors"
                aria-label="Delete photo"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Goal Change Section ── */}
      <motion.div variants={itemV}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold font-outfit text-white flex items-center gap-2">
            <Target size={14} className="text-orange-400" />
            {t('profile.goalChange') || 'Hedef Değiştir'}
          </h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowGoalChange(!showGoalChange)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
              showGoalChange
                ? 'bg-slate-700 text-white'
                : 'bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20'
            }`}
          >
            {showGoalChange ? (t('profile.close') || 'Kapat') : (t('profile.changeGoal') || 'Değiştir')}
          </motion.button>
        </div>

        {/* Current goal badge */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 mb-3 flex items-center gap-3">
          {(() => {
            const current = goalOptions.find(g => g.value === currentGoalKey);
            const Icon = current?.icon || Dumbbell;
            return (
              <>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${current?.color || '#ff6d00'}15` }}>
                  <Icon size={20} style={{ color: current?.color || '#ff6d00' }} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-400">{t('profile.currentGoal') || 'Mevcut Hedef'}</p>
                  <p className="text-sm font-bold text-white font-outfit">{plan.goal}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ backgroundColor: `${current?.color || '#ff6d00'}15`, color: current?.color || '#ff6d00' }}>
                  {t('profile.active') || 'Aktif'}
                </span>
              </>
            );
          })()}
        </div>

        {/* Goal selection grid */}
        <AnimatePresence>
          {showGoalChange && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-3 gap-2 mb-2">
                {goalOptions.map((goal) => {
                  const Icon = goal.icon;
                  const isActive = goal.value === currentGoalKey;
                  const isChanging = changingGoal === goal.value;
                  return (
                    <motion.button
                      key={goal.value}
                      whileHover={{ scale: isActive ? 1 : 1.03 }}
                      whileTap={{ scale: isActive ? 1 : 0.97 }}
                      onClick={() => !isActive && handleGoalChange(goal.value)}
                      disabled={isActive || changingGoal !== null}
                      className={[
                        'flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all duration-200',
                        isActive
                          ? 'bg-slate-800/50 border-slate-700 opacity-50 cursor-not-allowed'
                          : isChanging
                            ? 'bg-green-500/10 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.15)]'
                            : 'bg-slate-900 border-slate-800 hover:border-slate-600 cursor-pointer',
                      ].join(' ')}
                    >
                      {isChanging ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1, rotate: 360 }}
                          transition={{ duration: 0.5 }}
                        >
                          <BadgeCheck size={22} className="text-green-400" />
                        </motion.div>
                      ) : (
                        <div className={`p-2 rounded-xl ${isActive ? 'bg-slate-700' : ''}`} style={{ backgroundColor: isActive ? undefined : `${goal.color}10` }}>
                          <Icon size={20} style={{ color: isActive ? '#475569' : goal.color }} />
                        </div>
                      )}
                      <span className={`text-xs font-medium font-outfit ${
                        isChanging ? 'text-green-400' : isActive ? 'text-slate-500' : 'text-slate-300'
                      }`}>
                        {isChanging ? (t('profile.switching') || 'Geçiliyor...') : goal.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-500 text-center">
                {t('profile.goalChangeNote') || 'Hedef değiştirildiğinde program sıfırlanır ve Faz 0\'dan başlanır.'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Body Stats ── */}
      <motion.div variants={itemV}>
        <h3 className="text-sm font-bold font-outfit text-white mb-3 flex items-center gap-2">
          <Activity size={14} className="text-orange-400" />
          {t('profile.bodyStats')}
        </h3>
        <motion.div variants={containerV} className="grid grid-cols-4 gap-2">
          <StatCard icon={Ruler} label={t('profile.height')} value={plan.userHeight} unit="cm" color="#00b0ff" />
          <StatCard icon={Scale} label={t('profile.weight')} value={plan.userWeight} unit="kg" color="#ff6d00" />
          <StatCard icon={Heart} label={t('profile.bmi')} value={plan.bmi} color="#f472b6" />
          <StatCard icon={Flame} label={t('profile.bodyFat')} value={`%${plan.userBodyFat}`} color="#ef4444" />
          <StatCard icon={Sparkles} label={t('profile.bmr')} value={plan.bmr} unit="kcal" color="#22c55e" />
          <StatCard icon={Activity} label={t('profile.tdee')} value={plan.tdee} unit="kcal" color="#a855f7" />
          <StatCard icon={Dumbbell} label={t('profile.dailyCal')} value={plan.dailyCalories} unit="kcal" color="#ff6d00" />
          <StatCard icon={Target} label={t('dashboard.quickStats.training') || 'Antrenman'} value={plan.trainingDays || plan.workoutSplit?.filter(d => !d.isRest).length || '—'} unit={t('dashboard.quickStats.daysWeek') || 'gün/h'} color="#06b6d4" />
        </motion.div>
      </motion.div>

      {/* ── Preferences ── */}
      <motion.div variants={itemV}>
        <h3 className="text-sm font-bold font-outfit text-white mb-3 flex items-center gap-2">
          <User size={14} className="text-blue-400" />
          {t('profile.preferences')}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: '🎯', label: t('profile.prefExperience') || 'Deneyim', value: experienceLabel },
            { icon: '🏃', label: t('profile.prefActivity') || 'Aktivite', value: activityLabel },
            { icon: '💰', label: t('profile.prefBudget') || 'Bütçe', value: budgetLabel },
            { icon: '🕐', label: t('profile.prefSchedule') || 'Zaman', value: scheduleLabel },
            { icon: plan.userGender === 'female' ? '♀️' : '♂️', label: t('profile.prefGender') || 'Cinsiyet', value: plan.userGender === 'female' ? t('profile.female') : t('profile.male') },
            { icon: '🎂', label: t('profile.prefAge') || 'Yaş', value: plan.userAge ? `${plan.userAge} ${t('profile.age')}` : '—' },
          ].filter(item => item.value && item.value !== 'undefined').map((item, i) => (
            <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/30">
              <span className="text-sm">{item.icon}</span>
              <div className="min-w-0">
                <p className="text-[9px] text-slate-500 leading-tight">{item.label}</p>
                <p className="text-xs font-medium text-slate-200 font-outfit truncate">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Language ── */}
      <motion.div variants={itemV}>
        <h3 className="text-sm font-bold font-outfit text-white mb-3 flex items-center gap-2">
          <Globe size={14} className="text-cyan-400" />
          {t('profile.language') || 'Uygulama Dili'}
        </h3>
        <div className="flex gap-2">
          {SUPPORTED.map((code) => (
            <button
              key={code}
              onClick={() => setLang(code)}
              className={[
                'flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all cursor-pointer',
                lang === code
                  ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                  : 'bg-slate-800/50 border-slate-700/30 text-slate-400 hover:border-slate-600',
              ].join(' ')}
            >
              <span className="text-base">{langFlags[code]}</span>
              {langLabels[code]}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Actions ── */}
      <motion.div variants={itemV} className="space-y-3">
        <h3 className="text-sm font-bold font-outfit text-white mb-3 flex items-center gap-2">
          <RefreshCw size={14} className="text-emerald-400" />
          {t('profile.accountActions')}
        </h3>

        {onUpdatePlan && (
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={onUpdatePlan}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw size={16} className="text-orange-400" />
            <div className="text-left">
              <p className="text-sm font-semibold">{t('profile.update')}</p>
              <p className="text-[10px] text-slate-400">{t('profile.updateDesc')}</p>
            </div>
          </motion.button>
        )}

        {onLogout && (
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <LogOut size={16} className="text-blue-400" />
            <div className="text-left">
              <p className="text-sm font-semibold">{t('profile.logoutBtn')}</p>
              <p className="text-[10px] text-slate-400">{t('profile.logoutDesc')}</p>
            </div>
          </motion.button>
        )}

        {/* Danger zone */}
        <div className="mt-4 p-4 rounded-xl border border-red-500/20 bg-red-500/5">
          <p className="text-xs text-red-400 font-semibold mb-2">{t('profile.dangerZone')}</p>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleDeleteAccount}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
          >
            <Trash2 size={16} />
            <div className="text-left">
              <p className="text-sm font-semibold">{t('profile.deleteAccount')}</p>
              <p className="text-[10px] text-red-400/60">{t('profile.deleteDesc')}</p>
            </div>
          </motion.button>
        </div>
      </motion.div>

      {/* ── App Info ── */}
      <motion.div variants={itemV} className="text-center pt-4 border-t border-slate-800/50">
        <p className="text-[10px] text-slate-500">Full Balance v1.0.0 — 2026</p>
      </motion.div>
    </motion.div>
  );
}
