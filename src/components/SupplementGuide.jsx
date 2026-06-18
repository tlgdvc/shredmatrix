import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pill, AlertTriangle, CheckCircle, Clock, Flame, Droplets, Sparkles, Leaf, ChevronDown } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

const itemV = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

/* ── Goal key mapping ── */
function resolveGoalKey(goal) {
  if (!goal) return 'muscle';
  const g = goal.toLowerCase();
  if (g.includes('yağ') || g.includes('fat')) return 'fat_loss';
  if (g.includes('medit')) return 'meditation';
  if (g.includes('yoga')) return 'yoga';
  if (g.includes('pilates')) return 'pilates';
  if (g.includes('reformer')) return 'reformer';
  return 'muscle';
}

/* ── Data per goal (5-6 per category, only proven & essential) ── */
const supplementData = {
  muscle: [
    { name: 'Kreatin Monohidrat', emoji: '⚡', dose: '5g/gün', freq: 'Günde 1 kez', schedule: '💪 Antrenman Sonrası', why: 'ATP yenilenmesini hızlandırır, güç ve kas hacmi artışı sağlar.', detail: 'Kaslarınız enerji üretmek için ATP kullanır. Kreatin bu enerjiyi daha hızlı geri kazanmanızı sağlar. Böylece daha ağır kaldırabilir ve kaslarınız daha hızlı büyür. En çok araştırılmış ve güvenli takviyelerden biridir.', importance: 'high' },
    { name: 'Whey Protein', emoji: '🥛', dose: '25-30g', freq: 'Günde 1-2 kez', schedule: '☀️ Sabah + 💪 Sonrası', why: 'Hızlı emilen protein. Kas sentezini tetikler.', detail: 'Sütten elde edilen protein tozu. Antrenman sonrası kaslarınız tamir olmak için proteine ihtiyaç duyar. Whey protein çok hızlı emilir ve kaslarınıza hemen ulaşır.', importance: 'high' },
    { name: 'Omega-3 (Balık Yağı)', emoji: '🐟', dose: '2-3g EPA+DHA', freq: 'Günde 1 kez', schedule: '🍽️ Yemekle Birlikte', why: 'Anti-enflamatuar, eklem ve kalp sağlığı.', detail: 'Vücuttaki iltihabı azaltır, eklemlerinizi korur ve kalbinizi sağlıklı tutar. Yoğun antrenman yapanlar için toparlanmayı hızlandırır.', importance: 'medium' },
    { name: 'D3 Vitamini', emoji: '☀️', dose: '2000-4000 IU', freq: 'Günde 1 kez', schedule: '☀️ Sabah Kahvaltısı', why: 'Testosteron, kemik sağlığı, bağışıklık.', detail: 'Güneş vitamini. Türkiye\'de çoğu insanda eksik. Kemiklerinizi güçlendirir ve erkeklerde testosteron seviyesini korur. Yağlı yemekle alın, yoksa emilmez.', importance: 'medium' },
    { name: 'ZMA (Çinko+Magnezyum)', emoji: '🌙', dose: '1 kapsül', freq: 'Günde 1 kez', schedule: '🌙 Yatmadan 30dk Önce', why: 'Uyku kalitesi, kas toparlanması, hormonal denge.', detail: 'Gece boyunca kas toparlanmasını destekler, uyku kalitenizi artırır. Ter ile kaybedilen mineralleri yerine koyar.', importance: 'low' },
    { name: 'Glutamin', emoji: '🧬', dose: '5-10g', freq: 'Günde 1 kez', schedule: '💪 Antrenman Sonrası', why: 'Kas toparlanması, bağışıklık desteği.', detail: 'Yoğun antrenman sonrası kas hasarını onarır ve bağışıklık sisteminizi güçlendirir. Ağır antrenman yapanlarda bağışıklık düşüşünü önler.', importance: 'low' },
  ],
  fat_loss: [
    { name: 'Kafein', emoji: '☕', dose: '200mg', freq: 'Günde 1 kez', schedule: '🏋️ Antrenman Öncesi (30dk)', why: 'Metabolizmayı hızlandırır, yağ yakımını artırır.', detail: 'Metabolizmanızı hızlandırır ve antrenman performansınızı artırır. Daha fazla kalori yakmanızı sağlar. Öğleden sonra almayın, uykunuzu bozabilir.', importance: 'high' },
    { name: 'Whey Protein İzolat', emoji: '🥛', dose: '25-30g', freq: 'Günde 1-2 kez', schedule: '💪 Sonrası + 🕐 Ara Öğün', why: 'Düşük kalorili, yüksek protein. Tok tutar.', detail: 'Normal whey proteinin daha saf hali. Daha az kalori içerir. Diyet yaparken kaslarınızı korur ve uzun süre tok tutar.', importance: 'high' },
    { name: 'L-Karnitin', emoji: '🔥', dose: '2-3g', freq: 'Günde 1 kez', schedule: '🏋️ Antrenman Öncesi', why: 'Yağ asitlerini enerjiye dönüştürmeye yardımcı olur.', detail: 'Vücudunuzdaki yağları enerji fabrikasına taşıyan bir molekül. Egzersiz sırasında daha fazla yağ yakmanıza yardımcı olur. Egzersizle birlikte kullanın.', importance: 'medium' },
    { name: 'Yeşil Çay Ekstresi', emoji: '🍵', dose: '500mg EGCG', freq: 'Günde 2 kez', schedule: '☀️ Sabah + 🌤️ Öğle', why: 'Termogenez artışı, antioksidan.', detail: 'Vücut ısınızı hafifçe artırarak ekstra kalori yakmanızı sağlar. Aynı zamanda güçlü bir antioksidan, hücrelerinizi korur.', importance: 'medium' },
    { name: 'Omega-3', emoji: '🐟', dose: '2-3g', freq: 'Günde 1 kez', schedule: '🍽️ Yemekle Birlikte', why: 'İnsülin hassasiyeti, anti-enflamatuar.', detail: 'Vücudunuzun insüline daha iyi tepki vermesini sağlar, böylece yediğiniz şeker yağa dönüşmek yerine enerji olarak kullanılır.', importance: 'medium' },
    { name: 'Multivitamin', emoji: '💊', dose: '1 tablet', freq: 'Günde 1 kez', schedule: '☀️ Sabah Kahvaltısı', why: 'Diyet sırasında mikro besin eksikliğini önler.', detail: 'Diyet yaparken az yemek yersiniz, bu da vitamin eksikliğine yol açabilir. Multivitamin bu boşluğu doldurur.', importance: 'low' },
  ],
  meditation: [
    { name: 'Magnezyum Bisglisinat', emoji: '🧠', dose: '300-400mg', freq: 'Günde 1 kez', schedule: '🌙 Yatmadan 1 Saat Önce', why: 'Sinir sistemini yatıştırır, derin uykuyu destekler.', detail: 'En iyi emilen magnezyum formu. Sinir sisteminizi sakinleştirir ve derin uyku kalitesini artırır. Meditasyon pratiğinin etkisini güçlendirir.', importance: 'high' },
    { name: 'L-Theanine', emoji: '🍵', dose: '200mg', freq: 'Günde 1-2 kez', schedule: '🧘 Meditasyon Öncesi', why: 'Alfa beyin dalgalarını artırır, sakin odaklanma.', detail: 'Yeşil çayda bulunan bir amino asit. Sizi uyutmadan sakinleştirir ve odaklanmanızı artırır. Beyin dalgalarınızı meditasyona uygun hale getirir.', importance: 'high' },
    { name: 'Ashwagandha', emoji: '🌿', dose: '300-600mg', freq: 'Günde 1 kez', schedule: '☀️ Sabah veya 🌙 Akşam', why: 'Kortizol düşürür, stres adaptasyonunu artırır.', detail: 'Hint Ayurvedik tıbbında binlerce yıldır kullanılan bir bitki. Stres hormonunuzu düşürür ve kaygıyı azaltır. 4-6 hafta düzenli kullanımda etki gösterir.', importance: 'medium' },
    { name: 'Omega-3 (DHA)', emoji: '🐟', dose: '1-2g DHA', freq: 'Günde 1 kez', schedule: '🍽️ Yemekle Birlikte', why: 'Beyin sağlığı, bilişsel fonksiyon desteği.', detail: 'Beyninizin %60\'ı yağdan oluşur ve DHA en önemli yağdır. Hafıza, öğrenme ve duygusal dengeyi destekler.', importance: 'medium' },
    { name: 'B Kompleks Vitamin', emoji: '💊', dose: '1 tablet', freq: 'Günde 1 kez', schedule: '☀️ Sabah', why: 'Sinir sistemi, enerji metabolizması.', detail: '8 farklı B vitamininin birleşimi. Sinir sisteminizin sağlıklı çalışmasını destekler. Stresli dönemlerde ihtiyaç artar.', importance: 'low' },
  ],
  yoga: [
    { name: 'Magnezyum', emoji: '✨', dose: '300-400mg', freq: 'Günde 1 kez', schedule: '🌙 Akşam', why: 'Kas gevşemesi, kramp önleme, esneklik.', detail: 'Kaslarınızın düzgün gevşemesini sağlar. Yoga sırasında kramp riskini azaltır ve esnekliğinizi artırır.', importance: 'high' },
    { name: 'D3 Vitamini', emoji: '☀️', dose: '2000-4000 IU', freq: 'Günde 1 kez', schedule: '☀️ Sabah Kahvaltısı', why: 'Kemik sağlığı, eklem desteği, bağışıklık.', detail: 'Kemiklerinizi ve eklemlerinizi güçlendirir. Yoga pozlarında eklem sağlığı çok önemlidir. Yağlı yemekle alın.', importance: 'high' },
    { name: 'Kolajen Peptid', emoji: '🦴', dose: '10g', freq: 'Günde 1 kez', schedule: '☀️ Sabah veya 🌙 Akşam', why: 'Eklem, tendon ve bağ doku sağlığı.', detail: 'Yaşla birlikte azalır. Eklemlerinizi, tendonlarınızı destekler. Yoga yapanlar için esneklik ve eklem sağlığını korumada faydalıdır.', importance: 'medium' },
    { name: 'Zerdeçal (Curcumin)', emoji: '🟡', dose: '500mg + Piperin', freq: 'Günde 1 kez', schedule: '🍽️ Yemekle Birlikte', why: 'Anti-enflamatuar, eklem rahatlığı.', detail: 'Doğal anti-enflamatuar. Piperiinle birlikte alın, yoksa vücut ememiyor. Yoga sonrası toparlanmayı hızlandırır.', importance: 'medium' },
    { name: 'Omega-3', emoji: '🐟', dose: '2g EPA+DHA', freq: 'Günde 1 kez', schedule: '🍽️ Yemekle Birlikte', why: 'Esneklik desteği, anti-enflamatuar.', detail: 'Eklem esnekliğini destekler ve vücuttaki iltihabı azaltır. Düzenli kullanımda eklem rahatlığı hissedilir.', importance: 'low' },
  ],
  pilates: [
    { name: 'Kolajen Peptid', emoji: '🦴', dose: '10-15g', freq: 'Günde 1 kez', schedule: '☀️ Sabah', why: 'Eklem, tendon ve bağ doku sağlığı.', detail: 'Pilates derin kasları ve bağ dokuyu yoğun çalıştırır. Kolajen bu dokuların güçlü ve esnek kalmasını sağlar.', importance: 'high' },
    { name: 'Magnezyum', emoji: '✨', dose: '300-400mg', freq: 'Günde 1 kez', schedule: '🌙 Akşam', why: 'Kas gevşemesi, kramp önleme, toparlanma.', detail: 'Pilates sonrası kas gerginliğini çözer ve krampları önler. Gece alırsanız uyku kalitenizi de artırır.', importance: 'high' },
    { name: 'D3 + K2 Vitamini', emoji: '☀️', dose: '2000 IU D3 + 100mcg K2', freq: 'Günde 1 kez', schedule: '☀️ Sabah', why: 'Kemik yoğunluğu, kalsiyum emilimi.', detail: 'D3 kalsiyumu emer, K2 onu kemiklere yönlendirir. İkisi birlikte kemiklerinizi güçlendirir.', importance: 'medium' },
    { name: 'Elektrolit', emoji: '💧', dose: '1 porsiyon', freq: 'Her antrenman', schedule: '🏋️ Antrenman Sırası', why: 'Mineral dengesi, kramp önleme.', detail: 'Ter ile kaybedilen mineralleri yerine koyar. Kas kramplarını önler, performansınızı korur.', importance: 'medium' },
    { name: 'B12 Vitamini', emoji: '💊', dose: '1000mcg', freq: 'Günde 1 kez', schedule: '☀️ Sabah', why: 'Enerji üretimi, sinir sistemi sağlığı.', detail: 'Enerji üretiminde kilit rol oynar. Özellikle az et yiyenler veya veganlar için çok önemlidir.', importance: 'low' },
  ],
  reformer: [
    { name: 'Kolajen Peptid', emoji: '🦴', dose: '10-15g', freq: 'Günde 1 kez', schedule: '☀️ Sabah', why: 'Eklem ve bağ doku sağlığı, dirence karşı koruma.', detail: 'Reformer makinesinin direnci eklemlerinize baskı uygular. Kolajen, kıkırdağınızı ve tendonlarınızı güçlendirir.', importance: 'high' },
    { name: 'Whey Protein', emoji: '🥛', dose: '20-25g', freq: 'Günde 1 kez', schedule: '💪 Antrenman Sonrası', why: 'Kas onarımı ve toparlanma.', detail: 'Reformer düşündüğünüzden daha çok kas çalıştırır. 30 dakika içinde alırsanız en iyi sonucu alırsınız.', importance: 'high' },
    { name: 'Magnezyum', emoji: '✨', dose: '300-400mg', freq: 'Günde 1 kez', schedule: '🌙 Akşam', why: 'Kas gevşemesi, kramp önleme, uyku kalitesi.', detail: 'Reformer sonrası kas gevşemesini destekler. Gece boyunca toparlanmaya yardımcı olur.', importance: 'medium' },
    { name: 'Zerdeçal (Curcumin)', emoji: '🟡', dose: '500mg + Piperin', freq: 'Günde 1 kez', schedule: '🍽️ Yemekle Birlikte', why: 'Anti-enflamatuar, eklem koruma.', detail: 'Yoğun reformer sonrası eklem iltihabını azaltır. Piperiinle birlikte alırsanız 20 kat daha iyi emilir.', importance: 'medium' },
    { name: 'Elektrolit', emoji: '💧', dose: '1 porsiyon', freq: 'Her antrenman', schedule: '🏋️ Antrenman Sırası', why: 'Mineral dengesi, kramp önleme.', detail: 'Reformer antrenmanında çok terlersiniz. Kaybedilen mineralleri yerine koyar, krampları önler.', importance: 'low' },
  ],
};

/* ── Goal labels ── */
const goalLabels = {
  muscle: 'muscleGoal', fat_loss: 'fatGoal',
  meditation: 'meditationGoal', yoga: 'yogaGoal',
  pilates: 'pilatesGoal', reformer: 'reformerGoal',
};

/* ── Section titles per goal type ── */
const sectionConfig = {
  muscle: { icon: Pill, titleKey: 'title' },
  fat_loss: { icon: Pill, titleKey: 'title' },
  meditation: { icon: Leaf, titleKey: 'titleWellness' },
  yoga: { icon: Leaf, titleKey: 'titleWellness' },
  pilates: { icon: Sparkles, titleKey: 'title' },
  reformer: { icon: Sparkles, titleKey: 'title' },
};

const importanceIcons = { high: CheckCircle, medium: Flame, low: Clock };
const importanceColors = { high: '#22c55e', medium: '#f59e0b', low: '#64748b' };

export default function SupplementGuide({ goal }) {
  const { t } = useTranslation();
  const goalKey = resolveGoalKey(goal);
  const supplements = useMemo(() => supplementData[goalKey] || supplementData.muscle, [goalKey]);
  const importanceLabels = { high: t('supplement.important'), medium: t('supplement.useful'), low: t('supplement.optional') };
  const config = sectionConfig[goalKey] || sectionConfig.muscle;
  const HeaderIcon = config.icon;
  const [expanded, setExpanded] = useState(null);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
      className="bg-slate-900 border border-slate-800 rounded-2xl p-5"
    >
      {/* Header */}
      <motion.div variants={itemV} className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <HeaderIcon size={16} className="text-orange-400" />
          <h3 className="text-sm font-bold font-outfit text-white">
            {t(`supplement.${config.titleKey}`) || 'Takviye & Destek Rehberi'}
          </h3>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
          {t(`supplement.${goalLabels[goalKey]}`) || goal}
        </span>
      </motion.div>

      {/* Warning */}
      <motion.div variants={itemV} className="flex items-start gap-2 px-3 py-2 rounded-xl bg-amber-500/5 border border-amber-500/10 mb-4">
        <AlertTriangle size={12} className="text-amber-400 mt-0.5 shrink-0" />
        <p className="text-[10px] text-slate-400 leading-relaxed">
          {t(`supplement.warning_${goalKey}`) || t('supplement.warning')}
        </p>
      </motion.div>

      {/* Daily Schedule Summary */}
      <motion.div variants={itemV} className="mb-4 p-2.5 rounded-xl bg-slate-800/30 border border-slate-700/20">
        <h4 className="text-[10px] font-bold font-outfit text-slate-400 mb-2 flex items-center gap-1.5">
          <Clock size={10} className="text-blue-400" />
          {t('supplement.dailySchedule') || 'Günlük Kullanım Takvimi'}
        </h4>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { time: '☀️', label: t('supplement.morning') || 'Sabah', items: supplements.filter(s => s.schedule.includes('Sabah') || s.schedule.includes('☀️')) },
            { time: '🏋️', label: t('supplement.workout') || 'Antrenman', items: supplements.filter(s => s.schedule.includes('Antrenman') || s.schedule.includes('🏋️')) },
            { time: '🍽️', label: t('supplement.withMeal') || 'Yemekle', items: supplements.filter(s => s.schedule.includes('Yemek') || s.schedule.includes('🍽️')) },
            { time: '🌙', label: t('supplement.evening') || 'Akşam/Gece', items: supplements.filter(s => s.schedule.includes('Akşam') || s.schedule.includes('Gece') || s.schedule.includes('🌙') || s.schedule.includes('Yatmadan')) },
          ].filter(slot => slot.items.length > 0).map(slot => (
            <div key={slot.label} className="px-2 py-1.5 rounded-lg bg-slate-950/40 border border-slate-800/30">
              <p className="text-[9px] font-bold text-white mb-0.5">{slot.time} {slot.label}</p>
              {slot.items.map(s => (
                <p key={s.name} className="text-[8px] text-slate-500 leading-tight">{s.emoji} {s.name}</p>
              ))}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Supplement cards — compact with expandable detail */}
      <div className="space-y-1.5">
        {supplements.map((sup) => {
          const ImpIcon = importanceIcons[sup.importance];
          const isOpen = expanded === sup.name;
          return (
            <motion.div
              key={sup.name}
              variants={itemV}
              className="rounded-xl bg-slate-950/50 border border-slate-800/50 overflow-hidden"
            >
              {/* Compact row — always visible */}
              <button
                onClick={() => setExpanded(isOpen ? null : sup.name)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left cursor-pointer"
              >
                <span className="text-base">{sup.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-white font-outfit truncate">{sup.name}</span>
                    <span
                      className="flex items-center gap-0.5 text-[8px] px-1 py-px rounded-full shrink-0"
                      style={{ backgroundColor: `${importanceColors[sup.importance]}15`, color: importanceColors[sup.importance] }}
                    >
                      <ImpIcon size={7} />
                      {importanceLabels[sup.importance]}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-500 truncate">{sup.dose} · {sup.freq} · {sup.schedule}</p>
                </div>
                <ChevronDown size={12} className={`text-slate-600 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Expandable detail */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 pt-0 border-t border-slate-800/30">
                      <p className="text-[10px] text-slate-300 mt-2 mb-1.5 leading-relaxed">{sup.why}</p>
                      <p className="text-[10px] text-slate-500 leading-relaxed italic mb-2">{sup.detail}</p>
                      <div className="flex flex-wrap gap-1.5 text-[8px]">
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-800/60 text-orange-400">
                          <Droplets size={8} /> {sup.dose}
                        </span>
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-800/60 text-blue-400">
                          <Clock size={8} /> {sup.freq}
                        </span>
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-800/60 text-emerald-400">
                          {sup.schedule}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
