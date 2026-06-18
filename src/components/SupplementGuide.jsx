import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Pill, AlertTriangle, CheckCircle, Clock, Flame, Droplets, Sparkles, Leaf } from 'lucide-react';
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

/* ── Data per goal ── */
const supplementData = {
  muscle: [
    { name: 'Kreatin Monohidrat', emoji: '⚡', dose: '5g / gün', timing: 'Antrenman sonrası', freq: 'Günde 1 kez', schedule: '💪 Antrenman Sonrası', why: 'ATP yenilenmesini hızlandırır, güç ve kas hacmi artışı sağlar.', detail: 'Kaslarınız enerji üretmek için ATP kullanır. Kreatin bu enerjiyi daha hızlı geri kazanmanızı sağlar. Böylece daha ağır kaldırabilir ve kaslarınız daha hızlı büyür. En çok araştırılmış ve güvenli takviyelerden biridir.', importance: 'high', color: '#ff6d00' },
    { name: 'Whey Protein', emoji: '🥛', dose: '25-30g / öğün', timing: 'Antrenman sonrası + sabah', freq: 'Günde 1-2 kez', schedule: '☀️ Sabah + 💪 Antrenman Sonrası', why: 'Hızlı emilen protein kaynağı. Kas sentezini tetikler.', detail: 'Sütten elde edilen protein tozu. Antrenman sonrası kaslarınız tamir olmak için proteine ihtiyaç duyar. Whey protein çok hızlı emilir ve kaslarınıza hemen ulaşır. Yemeklerden yeterli protein alamıyorsanız idealdir.', importance: 'high', color: '#f59e0b' },
    { name: 'BCAA / EAA', emoji: '💊', dose: '5-10g', timing: 'Antrenman sırası', freq: 'Günde 1 kez', schedule: '🏋️ Antrenman Sırası', why: 'Kas yıkımını azaltır, toparlanmayı hızlandırır.', detail: 'Dallanmış zincirli amino asitler. Antrenman sırasında içilir. Kaslarınızın enerji için kendini yıkmasını önler ve antrenman sonrası ağrıları azaltır.', importance: 'medium', color: '#00b0ff' },
    { name: 'Omega-3 (Balık Yağı)', emoji: '🐟', dose: '2-3g EPA+DHA', timing: 'Yemekle birlikte', freq: 'Günde 1 kez', schedule: '🍽️ Öğle/Akşam Yemeği', why: 'Anti-enflamatuar, eklem sağlığı, kalp sağlığı.', detail: 'Balık yağında bulunan sağlıklı yağlar. Vücuttaki iltihabı azaltır, eklemlerinizi korur ve kalbinizi sağlıklı tutar. Yoğun antrenman yapanlar için toparlanmayı hızlandırır.', importance: 'medium', color: '#22c55e' },
    { name: 'D3 Vitamini', emoji: '☀️', dose: '2000-4000 IU', timing: 'Sabah, yağlı yemekle', freq: 'Günde 1 kez', schedule: '☀️ Sabah Kahvaltısı', why: 'Testosteron desteği, kemik sağlığı, bağışıklık.', detail: 'Güneş vitamini. Türkiye\'de çoğu insanda eksik. Kemiklerinizi güçlendirir, bağışıklık sisteminizi destekler ve erkeklerde testosteron seviyesini korur. Yağlı bir yemekle alın, yoksa emilmez.', importance: 'medium', color: '#a855f7' },
    { name: 'ZMA (Çinko+Magnezyum)', emoji: '🌙', dose: '1 kapsül', timing: 'Yatmadan önce', freq: 'Günde 1 kez', schedule: '🌙 Yatmadan 30dk Önce', why: 'Uyku kalitesi, kas toparlanması, hormonal denge.', detail: 'Çinko ve magnezyum mineralleri bir arada. Gece boyunca kas toparlanmasını destekler, uyku kalitenizi artırır. Ter ile kaybedilen mineralleri yerine koyar.', importance: 'low', color: '#6366f1' },
    { name: 'Glutamin', emoji: '🧬', dose: '5-10g', timing: 'Antrenman sonrası', freq: 'Günde 1-2 kez', schedule: '💪 Antrenman Sonrası + 🌙 Yatmadan Önce', why: 'Kas toparlanmasını hızlandırır, bağışıklığı destekler.', detail: 'Vücudunuzdaki en bol amino asit. Yoğun antrenman sonrası kas hasarını onarır ve bağışıklık sisteminizi güçlendirir. Özellikle ağır antrenman yapan kişilerde bağışıklık düşüşünü önler.', importance: 'medium', color: '#06b6d4' },
    { name: 'Beta-Alanin', emoji: '⏱️', dose: '3-5g', timing: 'Antrenman öncesi', freq: 'Günde 1 kez', schedule: '🏋️ Antrenman Öncesi (15-30dk)', why: 'Kas dayanıklılığını artırır, yorgunluğu geciktirir.', detail: 'Kaslarınızdaki asit birikimini azaltan bir amino asit. Daha uzun süre yüksek tempoda antrenman yapmanızı sağlar. İlk haftalarda ciltte hafif karıncalanma hissi normal, zararsızdır.', importance: 'low', color: '#ec4899' },
    { name: 'Kazein Protein', emoji: '🥛', dose: '25-30g', timing: 'Yatmadan önce', freq: 'Günde 1 kez', schedule: '🌙 Yatmadan Önce', why: 'Yavaş salınımlı protein, gece boyunca kas besler.', detail: 'Whey\'in aksine çok yavaş emilir (6-8 saat). Gece boyunca kaslarınıza sürekli protein sağlar. Uyurken kas kaybını önler ve toparlanmayı destekler. Yoğurt kıvamında, tok tutar.', importance: 'low', color: '#8b5cf6' },
  ],
  fat_loss: [
    { name: 'Kafein', emoji: '☕', dose: '200mg', timing: 'Antrenman öncesi 30dk', freq: 'Günde 1 kez', schedule: '🏋️ Antrenman Öncesi (30dk)', why: 'Metabolizmayı hızlandırır, yağ yakımını artırır.', detail: 'Bir fincan kahve kadar kafein. Metabolizmanızı hızlandırır ve antrenman performansınızı artırır. Daha fazla kalori yakmanızı sağlar. Öğleden sonra almayın, uykunuzu bozabilir.', importance: 'high', color: '#ff6d00' },
    { name: 'Whey Protein İzolat', emoji: '🥛', dose: '25-30g', timing: 'Antrenman sonrası + ara öğün', freq: 'Günde 1-2 kez', schedule: '💪 Antrenman Sonrası + 🕐 Ara Öğün', why: 'Düşük kalorili, yüksek proteinli. Doygunluk sağlar.', detail: 'Normal whey proteinin daha saf hali. Daha az kalori ve şeker içerir. Diyet yaparken kaslarınızı korur ve uzun süre tok tutar. Atıştırma yerine kullanılabilir.', importance: 'high', color: '#f59e0b' },
    { name: 'L-Karnitin', emoji: '🔥', dose: '2-3g', timing: 'Antrenman öncesi', freq: 'Günde 1 kez', schedule: '🏋️ Antrenman Öncesi', why: 'Yağ asitlerinin mitokondriye taşınmasını destekler.', detail: 'Vücudunuzdaki yağları enerji fabrikasına (mitokondri) taşıyan bir molekül. Egzersiz sırasında daha fazla yağ yakmanıza yardımcı olur. Tek başına mucize yaratmaz, egzersizle birlikte kullanın.', importance: 'medium', color: '#ef4444' },
    { name: 'Yeşil Çay Ekstresi', emoji: '🍵', dose: '500mg EGCG', timing: 'Sabah + öğle', freq: 'Günde 2 kez', schedule: '☀️ Sabah + 🌤️ Öğle', why: 'Termogenez artışı, antioksidan.', detail: 'Yeşil çayın konsantre hali. Vücut ısınızı hafifçe artırarak (termogenez) ekstra kalori yakmanızı sağlar. Aynı zamanda güçlü bir antioksidan, hücrelerinizi korur.', importance: 'medium', color: '#22c55e' },
    { name: 'Omega-3', emoji: '🐟', dose: '2-3g', timing: 'Yemekle birlikte', freq: 'Günde 1 kez', schedule: '🍽️ Yemekle Birlikte', why: 'İnsülin hassasiyeti, anti-enflamatuar.', detail: 'Sağlıklı yağlar. Vücudunuzun insüline daha iyi tepki vermesini sağlar, böylece yediğiniz şeker yağa dönüşmek yerine enerji olarak kullanılır.', importance: 'medium', color: '#00b0ff' },
    { name: 'Multivitamin', emoji: '💊', dose: '1 tablet', timing: 'Sabah kahvaltıyla', freq: 'Günde 1 kez', schedule: '☀️ Sabah Kahvaltısı', why: 'Kalori kısıtlamasında mikro besin eksikliğini önler.', detail: 'Diyet yaparken az yemek yersiniz, bu da vitamin eksikliğine yol açabilir. Multivitamin bu boşluğu doldurur. Enerjinizi, bağışıklığınızı ve genel sağlığınızı korur.', importance: 'low', color: '#a855f7' },
    { name: 'CLA (Konjuge Linoleik Asit)', emoji: '🔬', dose: '3-4g', timing: 'Yemekle birlikte', freq: 'Günde 2-3 kez (öğünlere bölün)', schedule: '🍽️ Her Ana Öğünde', why: 'Yağ depolanmasını azaltır, kas oranını korur.', detail: 'Doğal olarak ette ve sütte bulunan bir yağ asidi. Vücudunuzun yağı depolamasını zorlaştırır ve kasları korur. Diyet yaparken kas kaybını önlemeye yardımcı olur. Öğünlere bölerek alın.', importance: 'low', color: '#06b6d4' },
    { name: 'Probiyotik', emoji: '🦠', dose: '10-20 milyar CFU', timing: 'Sabah, aç karnına', freq: 'Günde 1 kez', schedule: '☀️ Sabah (Aç Karnına)', why: 'Bağırsak sağlığı, metabolizma, bağışıklık.', detail: 'Bağırsaklarınızdaki faydalı bakterileri destekler. Sağlıklı bağırsak = daha iyi sindirim, daha güçlü bağışıklık ve daha hızlı metabolizma. Diyet döneminde sindirim sorunlarını önler.', importance: 'low', color: '#10b981' },
  ],
  meditation: [
    { name: 'Magnezyum Bisglisinat', emoji: '🧠', dose: '300-400mg', timing: 'Akşam, yatmadan 1 saat önce', freq: 'Günde 1 kez', schedule: '🌙 Yatmadan 1 Saat Önce', why: 'Sinir sistemini yatıştırır, derin uykuyu destekler.', detail: 'En iyi emilen magnezyum formu. Sinir sisteminizi sakinleştirir, kaslarınızı gevşetir ve derin uyku kalitesini artırır. Meditasyon pratiğinizin etkisini güçlendirir.', importance: 'high', color: '#a855f7' },
    { name: 'L-Theanine', emoji: '🍵', dose: '200mg', timing: 'Meditasyon öncesi', freq: 'Günde 1-2 kez', schedule: '🧘 Meditasyon Öncesi', why: 'Alfa beyin dalgalarını artırır, sakin odaklanma sağlar.', detail: 'Yeşil çayda bulunan bir amino asit. Sizi uyutmadan sakinleştirir ve odaklanmanızı artırır. Beyin dalgalarınızı meditasyona uygun hale getirir. Kafeinle birlikte alınırsa titreme olmadan enerji verir.', importance: 'high', color: '#22c55e' },
    { name: 'Ashwagandha', emoji: '🌿', dose: '300-600mg', timing: 'Sabah veya akşam', freq: 'Günde 1 kez', schedule: '☀️ Sabah veya 🌙 Akşam', why: 'Kortizol seviyesini düşürür, stres adaptasyonunu artırır.', detail: 'Hint Ayurvedik tıbbında binlerce yıldır kullanılan bir bitki. Stres hormonunuzu (kortizol) düşürür, kaygıyı azaltır ve uyku kalitenizi iyileştirir. 4-6 hafta düzenli kullanımda etki gösterir.', importance: 'medium', color: '#f59e0b' },
    { name: 'Omega-3 (DHA)', emoji: '🐟', dose: '1-2g DHA', timing: 'Yemekle birlikte', freq: 'Günde 1 kez', schedule: '🍽️ Yemekle Birlikte', why: 'Beyin sağlığı, bilişsel fonksiyon desteği.', detail: 'Beyninizin %60\'ı yağdan oluşur ve DHA en önemli yağdır. Hafıza, öğrenme ve duygusal dengeyi destekler. Düzenli kullanımda beyin sisini azaltır.', importance: 'medium', color: '#00b0ff' },
    { name: 'B Kompleks Vitamin', emoji: '💊', dose: '1 tablet', timing: 'Sabah', freq: 'Günde 1 kez', schedule: '☀️ Sabah', why: 'Sinir sistemi sağlığı, enerji metabolizması.', detail: '8 farklı B vitamininin birleşimi. Sinir sisteminizin sağlıklı çalışmasını destekler ve yiyeceklerinizi enerjiye dönüştürmenize yardımcı olur. Stresli dönemlerde ihtiyaç artar.', importance: 'low', color: '#6366f1' },
    { name: 'Rhodiola Rosea', emoji: '🌸', dose: '200-400mg', timing: 'Sabah', freq: 'Günde 1 kez', schedule: '☀️ Sabah', why: 'Zihinsel yorgunluğu azaltır, odaklanmayı artırır.', detail: 'İskandinav geleneksel tıbbından gelen adaptojenik bir bitki. Stresle başa çıkma kapasitenizi artırır. Zihinsel netliği ve odaklanmayı güçlendirir. Meditasyon pratiğini derinleştirmeye yardımcı olur.', importance: 'medium', color: '#ec4899' },
    { name: 'D3 Vitamini', emoji: '☀️', dose: '2000-4000 IU', timing: 'Sabah, yağlı yemekle', freq: 'Günde 1 kez', schedule: '☀️ Sabah Kahvaltısı', why: 'Ruh hali dengesi, kemik sağlığı, bağışıklık.', detail: 'D3 eksikliği depresyon ve anksiyete riskini artırır. Meditasyon yapanlar için ruh hali dengesi çok önemlidir. Yeterli D3 seviyesi serotonin üretimini destekler ve genel iyilik halini artırır.', importance: 'medium', color: '#f59e0b' },
  ],
  yoga: [
    { name: 'Magnezyum', emoji: '✨', dose: '300-400mg', timing: 'Akşam', freq: 'Günde 1 kez', schedule: '🌙 Akşam', why: 'Kas gevşemesi, kramp önleme, esneklik desteği.', detail: 'Kaslarınızın düzgün gevşemesini sağlar. Yoga sırasında kramp girme riskini azaltır ve esnekliğinizi artırır. Stres azaltıcı etkisi de vardır.', importance: 'high', color: '#a855f7' },
    { name: 'D3 Vitamini', emoji: '☀️', dose: '2000-4000 IU', timing: 'Sabah, yağlı yemekle', freq: 'Günde 1 kez', schedule: '☀️ Sabah Kahvaltısı', why: 'Kemik sağlığı, eklem desteği, bağışıklık.', detail: 'Kemiklerinizi ve eklemlerinizi güçlendirir. Yoga pozlarında eklem sağlığı çok önemlidir. Yağlı bir yemekle alın çünkü yağda çözünür bir vitamindir.', importance: 'high', color: '#f59e0b' },
    { name: 'Kolajen Peptid', emoji: '🦴', dose: '10g', timing: 'Sabah veya akşam', freq: 'Günde 1 kez', schedule: '☀️ Sabah veya 🌙 Akşam', why: 'Eklem, tendon ve bağ doku sağlığını destekler.', detail: 'Vücudunuzdaki en bol protein. Yaşla birlikte azalır. Eklemlerinizi, tendonlarınızı ve cildinizi destekler. Yoga yapanlar için esneklik ve eklem sağlığını korumada çok faydalıdır.', importance: 'medium', color: '#22c55e' },
    { name: 'Zerdeçal (Curcumin)', emoji: '🟡', dose: '500mg + Piperin', timing: 'Yemekle birlikte', freq: 'Günde 1 kez', schedule: '🍽️ Yemekle Birlikte', why: 'Anti-enflamatuar, eklem rahatlığı.', detail: 'Doğal anti-enflamatuar. Eklem ağrılarını ve iltihabı azaltır. Piperiinle (karabiber özütü) birlikte alın, yoksa vücut ememiyor. Yoga sonrası toparlanmayı hızlandırır.', importance: 'medium', color: '#ff6d00' },
    { name: 'Omega-3', emoji: '🐟', dose: '2g EPA+DHA', timing: 'Yemekle birlikte', freq: 'Günde 1 kez', schedule: '🍽️ Yemekle Birlikte', why: 'Esneklik desteği, anti-enflamatuar.', detail: 'Eklem esnekliğini destekler ve vücuttaki iltihabı azaltır. Düzenli kullanımda eklem rahatlığı hissedilir.', importance: 'low', color: '#00b0ff' },
    { name: 'Probiyotik', emoji: '🦠', dose: '10-20 milyar CFU', timing: 'Sabah, aç karnına', freq: 'Günde 1 kez', schedule: '☀️ Sabah (Aç Karnına)', why: 'Bağırsak-beyin ekseni, sindirim, bağışıklık.', detail: 'Bağırsak ve beyin arasında güçlü bir bağlantı vardır (bağırsak-beyin ekseni). Sağlıklı bağırsak florası ruh halinizi ve stres tepkinizi olumlu etkiler. Yoga pratiğini tamamlayan bütünsel bir destek.', importance: 'low', color: '#10b981' },
  ],
  pilates: [
    { name: 'Kolajen Peptid', emoji: '🦴', dose: '10-15g', timing: 'Sabah veya antrenman öncesi', freq: 'Günde 1 kez', schedule: '☀️ Sabah veya 🏋️ Antrenman Öncesi', why: 'Eklem, tendon ve bağ doku sağlığı. Derin kas desteği.', detail: 'Pilates derin kasları ve bağ dokuyu yoğun çalıştırır. Kolajen bu dokuların güçlü ve esnek kalmasını sağlar. Antrenman öncesi alırsanız eklemleriniz daha iyi korunur.', importance: 'high', color: '#06b6d4' },
    { name: 'Magnezyum', emoji: '✨', dose: '300-400mg', timing: 'Akşam', freq: 'Günde 1 kez', schedule: '🌙 Akşam', why: 'Kas gevşemesi, kramp önleme, toparlanma.', detail: 'Pilates sonrası kas gerginliğini çözer ve krampları önler. Gece alırsanız uyku kalitenizi de artırır. Kas toparlanmasını hızlandırır.', importance: 'high', color: '#a855f7' },
    { name: 'D3 + K2 Vitamini', emoji: '☀️', dose: '2000 IU D3 + 100mcg K2', timing: 'Sabah', freq: 'Günde 1 kez', schedule: '☀️ Sabah', why: 'Kemik yoğunluğu, kalsiyum emilimi.', detail: 'D3 kalsiyumu emer, K2 onu kemiklere yönlendirir. İkisi birlikte kemiklerinizi güçlendirir. Özellikle kadınlarda kemik erimesi riskini azaltır.', importance: 'medium', color: '#f59e0b' },
    { name: 'Elektrolit Takviyesi', emoji: '💧', dose: '1 porsiyon', timing: 'Egzersiz sırasında', freq: 'Her antrenman', schedule: '🏋️ Antrenman Sırası', why: 'Sodyum, potasyum, magnezyum dengesi. Kramp önleme.', detail: 'Ter ile kaybedilen mineralleri yerine koyar. Kas kramplarını önler, performansınızı korur. Özellikle yoğun terliyorsanız çok önemlidir.', importance: 'medium', color: '#22c55e' },
    { name: 'B12 Vitamini', emoji: '💊', dose: '1000mcg', timing: 'Sabah', freq: 'Günde 1 kez', schedule: '☀️ Sabah', why: 'Enerji üretimi, sinir sistemi sağlığı.', detail: 'Enerji üretiminde kilit rol oynar. Özellikle az et yiyenler veya veganlar için çok önemlidir. Sinir sisteminizin sağlıklı çalışmasını destekler.', importance: 'low', color: '#ef4444' },
    { name: 'Omega-3', emoji: '🐟', dose: '2g EPA+DHA', timing: 'Yemekle birlikte', freq: 'Günde 1 kez', schedule: '🍽️ Yemekle Birlikte', why: 'Eklem esnekliği, anti-enflamatuar.', detail: 'Eklem sağlığını destekler ve pilates sonrası iltihabı azaltır. Özellikle yoğun çalışan eklemlerin korunması için önemlidir.', importance: 'low', color: '#00b0ff' },
  ],
  reformer: [
    { name: 'Kolajen Peptid', emoji: '🦴', dose: '10-15g', timing: 'Sabah', freq: 'Günde 1 kez', schedule: '☀️ Sabah', why: 'Eklem ve bağ doku sağlığı. Reformer direncine karşı koruma.', detail: 'Reformer makinesinin direnci eklemlerinize baskı uygular. Kolajen, eklem kıkırdağınızı ve tendonlarınızı güçlendirerek bu baskıdan korunmanızı sağlar.', importance: 'high', color: '#22c55e' },
    { name: 'Whey Protein', emoji: '🥛', dose: '20-25g', timing: 'Antrenman sonrası', freq: 'Günde 1 kez', schedule: '💪 Antrenman Sonrası', why: 'Kas onarımı ve toparlanma. Reformer yoğun kas çalıştırır.', detail: 'Reformer düşündüğünüzden daha çok kas çalıştırır. Antrenman sonrası kaslarınızın tamir olması için proteine ihtiyacı var. 30 dakika içinde alırsanız en iyi sonucu alırsınız.', importance: 'high', color: '#f59e0b' },
    { name: 'Magnezyum', emoji: '✨', dose: '300-400mg', timing: 'Akşam', freq: 'Günde 1 kez', schedule: '🌙 Akşam', why: 'Kas gevşemesi, kramp önleme, uyku kalitesi.', detail: 'Reformer sonrası kas gevşemesini destekler. Gece boyunca kaslarınızın toparlanmasına yardımcı olur ve uyku kalitenizi artırır.', importance: 'medium', color: '#a855f7' },
    { name: 'Zerdeçal (Curcumin)', emoji: '🟡', dose: '500mg + Piperin', timing: 'Yemekle', freq: 'Günde 1 kez', schedule: '🍽️ Yemekle Birlikte', why: 'Anti-enflamatuar, eklem koruma.', detail: 'Doğal iltihap giderici. Yoğun reformer antrenmanı sonrası eklem ve kas iltihabını azaltır. Karabiber özütüyle (piperin) birlikte alırsanız 20 kat daha iyi emilir.', importance: 'medium', color: '#ff6d00' },
    { name: 'Elektrolit', emoji: '💧', dose: '1 porsiyon', timing: 'Antrenman sırasında', freq: 'Her antrenman', schedule: '🏋️ Antrenman Sırası', why: 'Terleme ile kaybedilen mineral dengesi.', detail: 'Reformer antrenmanında çok terlersiniz. Kaybedilen sodyum, potasyum ve magnezyumu yerine koyar. Krampları ve yorgunluğu önler.', importance: 'low', color: '#06b6d4' },
    { name: 'D3 + K2 Vitamini', emoji: '☀️', dose: '2000 IU D3 + 100mcg K2', timing: 'Sabah', freq: 'Günde 1 kez', schedule: '☀️ Sabah', why: 'Kemik yoğunluğu, kalsiyum dengesi.', detail: 'Reformer makinesinin direnci kemiklerinize de faydalıdır ama yeterli D3+K2 olmadan kemikler güçlenemez. D3 kalsiyumu emer, K2 onu doğru yere yönlendirir.', importance: 'low', color: '#f59e0b' },
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
      <motion.div variants={itemV} className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10 mb-4">
        <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
        <p className="text-[10px] text-slate-400 leading-relaxed">
          {t(`supplement.warning_${goalKey}`) || t('supplement.warning')}
        </p>
      </motion.div>

      {/* Daily Schedule Summary */}
      <motion.div variants={itemV} className="mb-4 p-3 rounded-xl bg-slate-800/30 border border-slate-700/20">
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
            <div key={slot.label} className="px-2.5 py-2 rounded-lg bg-slate-950/40 border border-slate-800/30">
              <p className="text-[10px] font-bold text-white mb-1">{slot.time} {slot.label}</p>
              <div className="space-y-0.5">
                {slot.items.map(s => (
                  <p key={s.name} className="text-[9px] text-slate-500">{s.emoji} {s.name}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Supplement cards */}
      <div className="space-y-2.5">
        {supplements.map((sup, idx) => {
          const ImpIcon = importanceIcons[sup.importance];
          return (
            <motion.div
              key={sup.name}
              variants={itemV}
              className="px-3.5 py-3.5 rounded-xl bg-slate-950/50 border border-slate-800/50"
            >
              {/* Top row: name + importance */}
              <div className="flex items-center gap-2.5 mb-2">
                <span className="text-xl">{sup.emoji}</span>
                <span className="text-xs font-bold text-white font-outfit flex-1">{sup.name}</span>
                <span
                  className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: `${importanceColors[sup.importance]}15`,
                    color: importanceColors[sup.importance],
                  }}
                >
                  <ImpIcon size={8} />
                  {importanceLabels[sup.importance]}
                </span>
              </div>

              {/* Why (short) */}
              <p className="text-[11px] text-slate-300 mb-1.5 leading-relaxed">{sup.why}</p>

              {/* Detail (beginner explanation) */}
              <p className="text-[10px] text-slate-500 mb-3 leading-relaxed italic">{sup.detail}</p>

              {/* Info badges */}
              <div className="flex flex-wrap items-center gap-2 text-[9px]">
                <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/60 text-orange-400">
                  <Droplets size={9} /> {sup.dose}
                </span>
                <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/60 text-blue-400">
                  <Clock size={9} /> {sup.freq}
                </span>
                <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/60 text-emerald-400">
                  {sup.schedule}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
