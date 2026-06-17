// ── Localized Meal Database ──────────────────────────────
// Each language has 7 day-type templates (upper, back, shoulders, lower, hiit, rest, active_rest)
// Each template has 5 meals with locale-appropriate foods

export const currencyMap = { tr: '₺', en: '$', es: '€' };
export const recipeSearchSuffix = { tr: 'tarifi', en: 'recipe', es: 'receta' };

// Price multipliers per currency (base is TRY)
const priceConvert = { tr: 1, en: 0.029, es: 0.027 }; // ~1 USD = 34 TRY, ~1 EUR = 37 TRY
const round = (n) => Math.round(n);
const px = (tryPrice, lang) => round(tryPrice * priceConvert[lang]);

// ── Meal name keys (locale-agnostic) ─────────────────────
export const MEAL_KEYS = {
  breakfast: 'breakfast',
  snack: 'snack',
  lunch: 'lunch',
  preWorkout: 'preWorkout',
  dinner: 'dinner',
  afternoonSnack: 'afternoonSnack',
};

export const mealNameMap = {
  tr: { breakfast: 'Kahvaltı', snack: 'Ara Öğün', lunch: 'Öğle Yemeği', preWorkout: 'Antrenman Öncesi', dinner: 'Akşam Yemeği', afternoonSnack: 'İkindi Atıştırması' },
  en: { breakfast: 'Breakfast', snack: 'Snack', lunch: 'Lunch', preWorkout: 'Pre-Workout', dinner: 'Dinner', afternoonSnack: 'Afternoon Snack' },
  es: { breakfast: 'Desayuno', snack: 'Merienda', lunch: 'Almuerzo', preWorkout: 'Pre-Entreno', dinner: 'Cena', afternoonSnack: 'Merienda Tarde' },
};

export const dayLabelMap = {
  tr: { upper: 'Üst Vücut Günü', back: 'Sırt & Biceps Günü', shoulders: 'Omuz Günü', lower: 'Bacak Günü', hiit: 'HIIT / Kardiyo Günü', rest: 'Dinlenme Günü', active_rest: 'Aktif Toparlanma Günü' },
  en: { upper: 'Upper Body Day', back: 'Back & Biceps Day', shoulders: 'Shoulder Day', lower: 'Leg Day', hiit: 'HIIT / Cardio Day', rest: 'Rest Day', active_rest: 'Active Recovery Day' },
  es: { upper: 'Día de Tren Superior', back: 'Día de Espalda & Bíceps', shoulders: 'Día de Hombros', lower: 'Día de Piernas', hiit: 'Día HIIT / Cardio', rest: 'Día de Descanso', active_rest: 'Día de Recuperación' },
};

export const mealNoteMap = {
  tr: { beforeWork: 'İşe gitmeden önce', afterWork: 'İşten çıkınca', postWorkout: 'Antrenmandan sonra — Yüksek protein', recovery: 'Antrenmandan sonra — Toparlanma', light: 'Hafif — Ertesi güne hazırlık', highCarb: 'Yüksek karbonhidrat', antiInflam: 'Anti-enflamatuar besinler', extraEnergy: 'Ekstra enerji', quickEnergy: 'Hızlı enerji', filling: 'Rahat ve doyurucu', muscleRepair: 'Kas onarımı — Yüksek omega-3', fullEnergy: 'Enerji depoları dolu' },
  en: { beforeWork: 'Before work', afterWork: 'After work', postWorkout: 'Post-workout — High protein', recovery: 'Post-workout — Recovery', light: 'Light — Prep for tomorrow', highCarb: 'High carbohydrate', antiInflam: 'Anti-inflammatory foods', extraEnergy: 'Extra energy', quickEnergy: 'Quick energy', filling: 'Relaxed and filling', muscleRepair: 'Muscle repair — High omega-3', fullEnergy: 'Full energy stores' },
  es: { beforeWork: 'Antes del trabajo', afterWork: 'Después del trabajo', postWorkout: 'Post-entreno — Alta proteína', recovery: 'Post-entreno — Recuperación', light: 'Ligero — Preparación mañana', highCarb: 'Alto en carbohidratos', antiInflam: 'Alimentos antiinflamatorios', extraEnergy: 'Energía extra', quickEnergy: 'Energía rápida', filling: 'Relajado y saciante', muscleRepair: 'Reparación muscular — Alto omega-3', fullEnergy: 'Reservas de energía llenas' },
};

// ═══════════════════════════════════════════════════════
// FOOD ITEMS PER LANGUAGE — by day type
// ═══════════════════════════════════════════════════════

function buildMealTemplates(lang = 'tr') {
  const n = mealNameMap[lang];
  const note = mealNoteMap[lang];
  const p = (tryPrice) => px(tryPrice, lang);

  const foods = {
    // ═══════════════════════════════════════════════════
    // TURKISH FOODS
    // ═══════════════════════════════════════════════════
    tr: {
      upper: {
        label: dayLabelMap.tr.upper,
        meals: (macros, cal) => [
          { id: 1, mealKey: 'breakfast', name: n.breakfast, time: '08:00', image: '/images/meals/breakfast.png', calories: round(cal * 0.25), items: ['Yulaf ezmesi + muz + fıstık ezmesi', 'Haşlanmış yumurta (3 adet)', 'Yeşil çay'], protein: round(macros.protein * 0.25), carbs: round(macros.carbs * 0.28), fat: round(macros.fat * 0.22), price: p(38) },
          { id: 2, mealKey: 'snack', name: n.snack, time: '11:00', image: '/images/meals/snack.png', calories: round(cal * 0.12), items: ['Whey protein shake', 'Bir avuç badem (30g)'], protein: round(macros.protein * 0.18), carbs: round(macros.carbs * 0.08), fat: round(macros.fat * 0.20), price: p(22) },
          { id: 3, mealKey: 'lunch', name: n.lunch, time: '13:00', note: note.beforeWork, image: '/images/meals/lunch.png', calories: round(cal * 0.30), items: ['Tavuk göğsü ızgara (200g)', 'Bulgur pilavı (150g)', 'Mevsim salata + zeytinyağı'], protein: round(macros.protein * 0.30), carbs: round(macros.carbs * 0.32), fat: round(macros.fat * 0.20), price: p(55) },
          { id: 4, mealKey: 'preWorkout', name: n.preWorkout, time: '18:30', note: note.afterWork, image: '/images/meals/postworkout.png', calories: round(cal * 0.15), items: ['Muzlu protein smoothie', 'Pirinç patlağı (2 adet)'], protein: round(macros.protein * 0.12), carbs: round(macros.carbs * 0.18), fat: round(macros.fat * 0.08), price: p(28) },
          { id: 5, mealKey: 'dinner', name: n.dinner, time: '21:00', note: note.postWorkout, image: '/images/meals/dinner.png', calories: round(cal * 0.18), items: ['Somon ızgara (180g)', 'Tatlı patates (150g)', 'Brokoli + zeytinyağı'], protein: round(macros.protein * 0.15), carbs: round(macros.carbs * 0.14), fat: round(macros.fat * 0.30), price: p(65) },
        ],
      },
      back: {
        label: dayLabelMap.tr.back,
        meals: (macros, cal) => [
          { id: 1, mealKey: 'breakfast', name: n.breakfast, time: '08:00', image: '/images/meals/breakfast.png', calories: round(cal * 0.25), items: ['Kepekli ekmek (2 dilim) + peynir + domates', 'Omlet (3 yumurta + ıspanak)', 'Siyah çay'], protein: round(macros.protein * 0.25), carbs: round(macros.carbs * 0.25), fat: round(macros.fat * 0.25), price: p(35) },
          { id: 2, mealKey: 'snack', name: n.snack, time: '11:00', image: '/images/meals/snack.png', calories: round(cal * 0.12), items: ['Yoğurt (200g) + ceviz', 'Yeşil elma (1 adet)'], protein: round(macros.protein * 0.12), carbs: round(macros.carbs * 0.12), fat: round(macros.fat * 0.18), price: p(18) },
          { id: 3, mealKey: 'lunch', name: n.lunch, time: '13:00', note: note.fullEnergy, image: '/images/meals/lunch.png', calories: round(cal * 0.30), items: ['Dana bonfile (180g)', 'Basmati pirinç pilavı', 'Roka salatası + nar ekşisi'], protein: round(macros.protein * 0.30), carbs: round(macros.carbs * 0.30), fat: round(macros.fat * 0.22), price: p(62) },
          { id: 4, mealKey: 'preWorkout', name: n.preWorkout, time: '18:30', note: note.afterWork, image: '/images/meals/postworkout.png', calories: round(cal * 0.15), items: ['Protein bar', 'Muz (1 adet)', 'Su (500ml)'], protein: round(macros.protein * 0.15), carbs: round(macros.carbs * 0.18), fat: round(macros.fat * 0.08), price: p(25) },
          { id: 5, mealKey: 'dinner', name: n.dinner, time: '21:00', note: note.recovery, image: '/images/meals/dinner.png', calories: round(cal * 0.18), items: ['Tavuk but (200g, fırında)', 'Kinoa salatası', 'Avokado (yarım)'], protein: round(macros.protein * 0.18), carbs: round(macros.carbs * 0.15), fat: round(macros.fat * 0.27), price: p(58) },
        ],
      },
      shoulders: {
        label: dayLabelMap.tr.shoulders,
        meals: (macros, cal) => [
          { id: 1, mealKey: 'breakfast', name: n.breakfast, time: '08:00', image: '/images/meals/breakfast.png', calories: round(cal * 0.25), items: ['Protein pancake (3 adet)', 'Bal + muz dilimleri', 'Türk kahvesi'], protein: round(macros.protein * 0.22), carbs: round(macros.carbs * 0.30), fat: round(macros.fat * 0.18), price: p(40) },
          { id: 2, mealKey: 'snack', name: n.snack, time: '11:00', image: '/images/meals/snack.png', calories: round(cal * 0.12), items: ['Lor peyniri (150g) + zeytinyağı', 'Tam buğday kraker (4 adet)'], protein: round(macros.protein * 0.15), carbs: round(macros.carbs * 0.10), fat: round(macros.fat * 0.15), price: p(20) },
          { id: 3, mealKey: 'lunch', name: n.lunch, time: '13:00', note: note.beforeWork, image: '/images/meals/lunch.png', calories: round(cal * 0.30), items: ['Köfte (180g, ızgara)', 'Makarna (tam buğday)', 'Cacık'], protein: round(macros.protein * 0.28), carbs: round(macros.carbs * 0.32), fat: round(macros.fat * 0.25), price: p(52) },
          { id: 4, mealKey: 'preWorkout', name: n.preWorkout, time: '18:30', note: note.afterWork, image: '/images/meals/postworkout.png', calories: round(cal * 0.15), items: ['Hurma (3 adet) + fıstık ezmesi', 'Whey shake (su ile)'], protein: round(macros.protein * 0.15), carbs: round(macros.carbs * 0.15), fat: round(macros.fat * 0.12), price: p(24) },
          { id: 5, mealKey: 'dinner', name: n.dinner, time: '21:00', note: note.postWorkout, image: '/images/meals/dinner.png', calories: round(cal * 0.18), items: ['Levrek buğulama (200g)', 'Sebzeli bulgur', 'Yeşil salata'], protein: round(macros.protein * 0.20), carbs: round(macros.carbs * 0.13), fat: round(macros.fat * 0.30), price: p(60) },
        ],
      },
      lower: {
        label: dayLabelMap.tr.lower,
        meals: (macros, cal) => [
          { id: 1, mealKey: 'breakfast', name: n.breakfast, time: '08:00', image: '/images/meals/breakfast.png', calories: round(cal * 0.25), items: ['Yulaf + süt + çilek + bal', 'Haşlanmış yumurta (4 adet)', 'Portakal suyu'], protein: round(macros.protein * 0.23), carbs: round(macros.carbs * 0.30), fat: round(macros.fat * 0.18), price: p(36) },
          { id: 2, mealKey: 'snack', name: n.snack, time: '11:00', image: '/images/meals/snack.png', calories: round(cal * 0.13), items: ['Muzlu-fıstık ezmeli smoothie', 'Tam buğday bisküvi (2 adet)'], protein: round(macros.protein * 0.12), carbs: round(macros.carbs * 0.15), fat: round(macros.fat * 0.15), price: p(20) },
          { id: 3, mealKey: 'lunch', name: n.lunch, time: '13:00', note: note.highCarb, image: '/images/meals/lunch.png', calories: round(cal * 0.28), items: ['Tavuk but (220g, fırında)', 'Patates püresi (200g)', 'Havuç salatası'], protein: round(macros.protein * 0.28), carbs: round(macros.carbs * 0.30), fat: round(macros.fat * 0.20), price: p(50) },
          { id: 4, mealKey: 'preWorkout', name: n.preWorkout, time: '18:30', note: note.extraEnergy, image: '/images/meals/postworkout.png', calories: round(cal * 0.16), items: ['Pirinç patlağı + bal', 'Muz (1 adet)', 'BCAA (5g)'], protein: round(macros.protein * 0.10), carbs: round(macros.carbs * 0.15), fat: round(macros.fat * 0.07), price: p(22) },
          { id: 5, mealKey: 'dinner', name: n.dinner, time: '21:00', note: note.recovery, image: '/images/meals/dinner.png', calories: round(cal * 0.18), items: ['Somon ızgara (200g)', 'Tatlı patates (200g)', 'Kuşkonmaz + limon'], protein: round(macros.protein * 0.27), carbs: round(macros.carbs * 0.10), fat: round(macros.fat * 0.40), price: p(68) },
        ],
      },
      hiit: {
        label: dayLabelMap.tr.hiit,
        meals: (macros, cal) => [
          { id: 1, mealKey: 'breakfast', name: n.breakfast, time: '08:00', image: '/images/meals/breakfast.png', calories: round(cal * 0.25), items: ['Granola + yoğurt + yaban mersini', 'Haşlanmış yumurta (2 adet)', 'Yeşil çay'], protein: round(macros.protein * 0.20), carbs: round(macros.carbs * 0.30), fat: round(macros.fat * 0.20), price: p(34) },
          { id: 2, mealKey: 'snack', name: n.snack, time: '11:00', image: '/images/meals/snack.png', calories: round(cal * 0.12), items: ['Enerji bar (düşük şeker)', 'Yeşil elma'], protein: round(macros.protein * 0.10), carbs: round(macros.carbs * 0.15), fat: round(macros.fat * 0.12), price: p(18) },
          { id: 3, mealKey: 'lunch', name: n.lunch, time: '13:00', note: note.filling, image: '/images/meals/lunch.png', calories: round(cal * 0.28), items: ['Ton balıklı wrap (tam buğday)', 'Mercimek çorbası', 'Ayran'], protein: round(macros.protein * 0.28), carbs: round(macros.carbs * 0.25), fat: round(macros.fat * 0.22), price: p(45) },
          { id: 4, mealKey: 'preWorkout', name: n.preWorkout, time: '18:30', note: note.quickEnergy, image: '/images/meals/postworkout.png', calories: round(cal * 0.15), items: ['Muz + bal (1 yk)', 'Hurma (4 adet)'], protein: round(macros.protein * 0.05), carbs: round(macros.carbs * 0.20), fat: round(macros.fat * 0.06), price: p(15) },
          { id: 5, mealKey: 'dinner', name: n.dinner, time: '21:00', note: note.recovery, image: '/images/meals/dinner.png', calories: round(cal * 0.20), items: ['Tavuk göğsü ızgara (200g)', 'Sebzeli kinoa', 'Zeytinyağlı enginar'], protein: round(macros.protein * 0.37), carbs: round(macros.carbs * 0.10), fat: round(macros.fat * 0.40), price: p(55) },
        ],
      },
      rest: {
        label: dayLabelMap.tr.rest,
        meals: (macros, cal) => [
          { id: 1, mealKey: 'breakfast', name: n.breakfast, time: '09:00', image: '/images/meals/breakfast.png', calories: round(cal * 0.28), items: ['Menemen (3 yumurta)', 'Tam buğday ekmek (1 dilim)', 'Beyaz peynir + zeytin', 'Çay'], protein: round(macros.protein * 0.25), carbs: round(macros.carbs * 0.25), fat: round(macros.fat * 0.30), price: p(30) },
          { id: 2, mealKey: 'snack', name: n.snack, time: '12:00', image: '/images/meals/snack.png', calories: round(cal * 0.12), items: ['Meyve tabağı (elma + portakal)', 'Ceviz (bir avuç)'], protein: round(macros.protein * 0.08), carbs: round(macros.carbs * 0.18), fat: round(macros.fat * 0.15), price: p(15) },
          { id: 3, mealKey: 'lunch', name: n.lunch, time: '14:00', note: note.filling, image: '/images/meals/lunch.png', calories: round(cal * 0.30), items: ['Mercimek çorbası', 'Izgara köfte (150g)', 'Bulgur pilavı', 'Salata'], protein: round(macros.protein * 0.32), carbs: round(macros.carbs * 0.30), fat: round(macros.fat * 0.22), price: p(48) },
          { id: 4, mealKey: 'afternoonSnack', name: n.afternoonSnack, time: '17:00', image: '/images/meals/postworkout.png', calories: round(cal * 0.10), items: ['Yoğurt (200g)', 'Bal (1 yk) + chia tohumu'], protein: round(macros.protein * 0.10), carbs: round(macros.carbs * 0.12), fat: round(macros.fat * 0.08), price: p(14) },
          { id: 5, mealKey: 'dinner', name: n.dinner, time: '20:00', note: note.light, image: '/images/meals/dinner.png', calories: round(cal * 0.20), items: ['Fırında sebzeli tavuk (180g)', 'Yeşil salata + limon', 'Zeytinyağı (1 yk)'], protein: round(macros.protein * 0.25), carbs: round(macros.carbs * 0.15), fat: round(macros.fat * 0.25), price: p(50) },
        ],
      },
      active_rest: {
        label: dayLabelMap.tr.active_rest,
        meals: (macros, cal) => [
          { id: 1, mealKey: 'breakfast', name: n.breakfast, time: '08:30', image: '/images/meals/breakfast.png', calories: round(cal * 0.27), items: ['Avokadolu tam buğday tost', 'Poşe yumurta (2 adet)', 'Taze sıkılmış portakal suyu'], protein: round(macros.protein * 0.22), carbs: round(macros.carbs * 0.25), fat: round(macros.fat * 0.30), price: p(38) },
          { id: 2, mealKey: 'snack', name: n.snack, time: '11:30', image: '/images/meals/snack.png', calories: round(cal * 0.12), items: ['Protein shake (süt ile)', 'Kuru kayısı (5 adet)'], protein: round(macros.protein * 0.18), carbs: round(macros.carbs * 0.12), fat: round(macros.fat * 0.10), price: p(20) },
          { id: 3, mealKey: 'lunch', name: n.lunch, time: '13:30', note: note.antiInflam, image: '/images/meals/lunch.png', calories: round(cal * 0.28), items: ['Somon (150g, fırında)', 'Zerdeçallı pirinç', 'Ispanak salatası + nar'], protein: round(macros.protein * 0.28), carbs: round(macros.carbs * 0.28), fat: round(macros.fat * 0.28), price: p(58) },
          { id: 4, mealKey: 'afternoonSnack', name: n.afternoonSnack, time: '17:00', image: '/images/meals/postworkout.png', calories: round(cal * 0.13), items: ['Lor peyniri + bal + ceviz', 'Yeşil çay'], protein: round(macros.protein * 0.15), carbs: round(macros.carbs * 0.10), fat: round(macros.fat * 0.12), price: p(18) },
          { id: 5, mealKey: 'dinner', name: n.dinner, time: '20:00', note: note.muscleRepair, image: '/images/meals/dinner.png', calories: round(cal * 0.20), items: ['Palamut ızgara (180g)', 'Zeytinyağlı enginar', 'Tam buğday ekmek (1 dilim)'], protein: round(macros.protein * 0.17), carbs: round(macros.carbs * 0.25), fat: round(macros.fat * 0.20), price: p(52) },
        ],
      },
    },

    // ═══════════════════════════════════════════════════
    // ENGLISH FOODS
    // ═══════════════════════════════════════════════════
    en: {
      upper: {
        label: dayLabelMap.en.upper,
        meals: (macros, cal) => [
          { id: 1, mealKey: 'breakfast', name: n.breakfast, time: '08:00', image: '/images/meals/breakfast.png', calories: round(cal * 0.25), items: ['Oatmeal + banana + peanut butter', 'Boiled eggs (3)', 'Green tea'], protein: round(macros.protein * 0.25), carbs: round(macros.carbs * 0.28), fat: round(macros.fat * 0.22), price: p(38) },
          { id: 2, mealKey: 'snack', name: n.snack, time: '11:00', image: '/images/meals/snack.png', calories: round(cal * 0.12), items: ['Whey protein shake', 'Almonds (30g)'], protein: round(macros.protein * 0.18), carbs: round(macros.carbs * 0.08), fat: round(macros.fat * 0.20), price: p(22) },
          { id: 3, mealKey: 'lunch', name: n.lunch, time: '13:00', note: note.beforeWork, image: '/images/meals/lunch.png', calories: round(cal * 0.30), items: ['Grilled chicken breast (200g)', 'Brown rice (150g)', 'Mixed salad + olive oil'], protein: round(macros.protein * 0.30), carbs: round(macros.carbs * 0.32), fat: round(macros.fat * 0.20), price: p(55) },
          { id: 4, mealKey: 'preWorkout', name: n.preWorkout, time: '18:30', note: note.afterWork, image: '/images/meals/postworkout.png', calories: round(cal * 0.15), items: ['Banana protein smoothie', 'Rice cakes (2)'], protein: round(macros.protein * 0.12), carbs: round(macros.carbs * 0.18), fat: round(macros.fat * 0.08), price: p(28) },
          { id: 5, mealKey: 'dinner', name: n.dinner, time: '21:00', note: note.postWorkout, image: '/images/meals/dinner.png', calories: round(cal * 0.18), items: ['Grilled salmon (180g)', 'Sweet potato (150g)', 'Broccoli + olive oil'], protein: round(macros.protein * 0.15), carbs: round(macros.carbs * 0.14), fat: round(macros.fat * 0.30), price: p(65) },
        ],
      },
      back: {
        label: dayLabelMap.en.back,
        meals: (macros, cal) => [
          { id: 1, mealKey: 'breakfast', name: n.breakfast, time: '08:00', image: '/images/meals/breakfast.png', calories: round(cal * 0.25), items: ['Whole wheat toast (2) + cheese + tomato', 'Spinach omelet (3 eggs)', 'Black coffee'], protein: round(macros.protein * 0.25), carbs: round(macros.carbs * 0.25), fat: round(macros.fat * 0.25), price: p(35) },
          { id: 2, mealKey: 'snack', name: n.snack, time: '11:00', image: '/images/meals/snack.png', calories: round(cal * 0.12), items: ['Greek yogurt (200g) + walnuts', 'Green apple'], protein: round(macros.protein * 0.12), carbs: round(macros.carbs * 0.12), fat: round(macros.fat * 0.18), price: p(18) },
          { id: 3, mealKey: 'lunch', name: n.lunch, time: '13:00', note: note.fullEnergy, image: '/images/meals/lunch.png', calories: round(cal * 0.30), items: ['Beef sirloin (180g)', 'Basmati rice', 'Arugula salad + balsamic'], protein: round(macros.protein * 0.30), carbs: round(macros.carbs * 0.30), fat: round(macros.fat * 0.22), price: p(62) },
          { id: 4, mealKey: 'preWorkout', name: n.preWorkout, time: '18:30', note: note.afterWork, image: '/images/meals/postworkout.png', calories: round(cal * 0.15), items: ['Protein bar', 'Banana', 'Water (500ml)'], protein: round(macros.protein * 0.15), carbs: round(macros.carbs * 0.18), fat: round(macros.fat * 0.08), price: p(25) },
          { id: 5, mealKey: 'dinner', name: n.dinner, time: '21:00', note: note.recovery, image: '/images/meals/dinner.png', calories: round(cal * 0.18), items: ['Roasted chicken thigh (200g)', 'Quinoa salad', 'Half avocado'], protein: round(macros.protein * 0.18), carbs: round(macros.carbs * 0.15), fat: round(macros.fat * 0.27), price: p(58) },
        ],
      },
      shoulders: {
        label: dayLabelMap.en.shoulders,
        meals: (macros, cal) => [
          { id: 1, mealKey: 'breakfast', name: n.breakfast, time: '08:00', image: '/images/meals/breakfast.png', calories: round(cal * 0.25), items: ['Protein pancakes (3)', 'Honey + banana slices', 'Americano coffee'], protein: round(macros.protein * 0.22), carbs: round(macros.carbs * 0.30), fat: round(macros.fat * 0.18), price: p(40) },
          { id: 2, mealKey: 'snack', name: n.snack, time: '11:00', image: '/images/meals/snack.png', calories: round(cal * 0.12), items: ['Cottage cheese (150g) + olive oil', 'Whole wheat crackers (4)'], protein: round(macros.protein * 0.15), carbs: round(macros.carbs * 0.10), fat: round(macros.fat * 0.15), price: p(20) },
          { id: 3, mealKey: 'lunch', name: n.lunch, time: '13:00', note: note.beforeWork, image: '/images/meals/lunch.png', calories: round(cal * 0.30), items: ['Turkey meatballs (180g)', 'Whole wheat pasta', 'Cucumber yogurt dip'], protein: round(macros.protein * 0.28), carbs: round(macros.carbs * 0.32), fat: round(macros.fat * 0.25), price: p(52) },
          { id: 4, mealKey: 'preWorkout', name: n.preWorkout, time: '18:30', note: note.afterWork, image: '/images/meals/postworkout.png', calories: round(cal * 0.15), items: ['Dates (3) + peanut butter', 'Whey shake (water)'], protein: round(macros.protein * 0.15), carbs: round(macros.carbs * 0.15), fat: round(macros.fat * 0.12), price: p(24) },
          { id: 5, mealKey: 'dinner', name: n.dinner, time: '21:00', note: note.postWorkout, image: '/images/meals/dinner.png', calories: round(cal * 0.18), items: ['Steamed sea bass (200g)', 'Vegetable couscous', 'Green salad'], protein: round(macros.protein * 0.20), carbs: round(macros.carbs * 0.13), fat: round(macros.fat * 0.30), price: p(60) },
        ],
      },
      lower: {
        label: dayLabelMap.en.lower,
        meals: (macros, cal) => [
          { id: 1, mealKey: 'breakfast', name: n.breakfast, time: '08:00', image: '/images/meals/breakfast.png', calories: round(cal * 0.25), items: ['Oats + milk + strawberries + honey', 'Boiled eggs (4)', 'Orange juice'], protein: round(macros.protein * 0.23), carbs: round(macros.carbs * 0.30), fat: round(macros.fat * 0.18), price: p(36) },
          { id: 2, mealKey: 'snack', name: n.snack, time: '11:00', image: '/images/meals/snack.png', calories: round(cal * 0.13), items: ['Banana-PB smoothie', 'Whole wheat biscuits (2)'], protein: round(macros.protein * 0.12), carbs: round(macros.carbs * 0.15), fat: round(macros.fat * 0.15), price: p(20) },
          { id: 3, mealKey: 'lunch', name: n.lunch, time: '13:00', note: note.highCarb, image: '/images/meals/lunch.png', calories: round(cal * 0.28), items: ['Roasted chicken thigh (220g)', 'Mashed potatoes (200g)', 'Coleslaw'], protein: round(macros.protein * 0.28), carbs: round(macros.carbs * 0.30), fat: round(macros.fat * 0.20), price: p(50) },
          { id: 4, mealKey: 'preWorkout', name: n.preWorkout, time: '18:30', note: note.extraEnergy, image: '/images/meals/postworkout.png', calories: round(cal * 0.16), items: ['Rice cakes + honey', 'Banana', 'BCAA (5g)'], protein: round(macros.protein * 0.10), carbs: round(macros.carbs * 0.15), fat: round(macros.fat * 0.07), price: p(22) },
          { id: 5, mealKey: 'dinner', name: n.dinner, time: '21:00', note: note.recovery, image: '/images/meals/dinner.png', calories: round(cal * 0.18), items: ['Grilled salmon (200g)', 'Sweet potato (200g)', 'Asparagus + lemon'], protein: round(macros.protein * 0.27), carbs: round(macros.carbs * 0.10), fat: round(macros.fat * 0.40), price: p(68) },
        ],
      },
      hiit: {
        label: dayLabelMap.en.hiit,
        meals: (macros, cal) => [
          { id: 1, mealKey: 'breakfast', name: n.breakfast, time: '08:00', image: '/images/meals/breakfast.png', calories: round(cal * 0.25), items: ['Granola + yogurt + blueberries', 'Boiled eggs (2)', 'Green tea'], protein: round(macros.protein * 0.20), carbs: round(macros.carbs * 0.30), fat: round(macros.fat * 0.20), price: p(34) },
          { id: 2, mealKey: 'snack', name: n.snack, time: '11:00', image: '/images/meals/snack.png', calories: round(cal * 0.12), items: ['Low-sugar energy bar', 'Green apple'], protein: round(macros.protein * 0.10), carbs: round(macros.carbs * 0.15), fat: round(macros.fat * 0.12), price: p(18) },
          { id: 3, mealKey: 'lunch', name: n.lunch, time: '13:00', note: note.filling, image: '/images/meals/lunch.png', calories: round(cal * 0.28), items: ['Tuna wrap (whole wheat)', 'Lentil soup', 'Buttermilk'], protein: round(macros.protein * 0.28), carbs: round(macros.carbs * 0.25), fat: round(macros.fat * 0.22), price: p(45) },
          { id: 4, mealKey: 'preWorkout', name: n.preWorkout, time: '18:30', note: note.quickEnergy, image: '/images/meals/postworkout.png', calories: round(cal * 0.15), items: ['Banana + honey (1 tbsp)', 'Dates (4)'], protein: round(macros.protein * 0.05), carbs: round(macros.carbs * 0.20), fat: round(macros.fat * 0.06), price: p(15) },
          { id: 5, mealKey: 'dinner', name: n.dinner, time: '21:00', note: note.recovery, image: '/images/meals/dinner.png', calories: round(cal * 0.20), items: ['Grilled chicken breast (200g)', 'Quinoa with vegetables', 'Artichoke hearts'], protein: round(macros.protein * 0.37), carbs: round(macros.carbs * 0.10), fat: round(macros.fat * 0.40), price: p(55) },
        ],
      },
      rest: {
        label: dayLabelMap.en.rest,
        meals: (macros, cal) => [
          { id: 1, mealKey: 'breakfast', name: n.breakfast, time: '09:00', image: '/images/meals/breakfast.png', calories: round(cal * 0.28), items: ['Scrambled eggs (3) with peppers', 'Whole wheat toast', 'Cheddar cheese + olives', 'Tea'], protein: round(macros.protein * 0.25), carbs: round(macros.carbs * 0.25), fat: round(macros.fat * 0.30), price: p(30) },
          { id: 2, mealKey: 'snack', name: n.snack, time: '12:00', image: '/images/meals/snack.png', calories: round(cal * 0.12), items: ['Fruit bowl (apple + orange)', 'Walnuts (handful)'], protein: round(macros.protein * 0.08), carbs: round(macros.carbs * 0.18), fat: round(macros.fat * 0.15), price: p(15) },
          { id: 3, mealKey: 'lunch', name: n.lunch, time: '14:00', note: note.filling, image: '/images/meals/lunch.png', calories: round(cal * 0.30), items: ['Chicken noodle soup', 'Grilled meatballs (150g)', 'Brown rice', 'Garden salad'], protein: round(macros.protein * 0.32), carbs: round(macros.carbs * 0.30), fat: round(macros.fat * 0.22), price: p(48) },
          { id: 4, mealKey: 'afternoonSnack', name: n.afternoonSnack, time: '17:00', image: '/images/meals/postworkout.png', calories: round(cal * 0.10), items: ['Greek yogurt (200g)', 'Honey (1 tbsp) + chia seeds'], protein: round(macros.protein * 0.10), carbs: round(macros.carbs * 0.12), fat: round(macros.fat * 0.08), price: p(14) },
          { id: 5, mealKey: 'dinner', name: n.dinner, time: '20:00', note: note.light, image: '/images/meals/dinner.png', calories: round(cal * 0.20), items: ['Baked herb chicken (180g)', 'Green salad + lemon', 'Olive oil drizzle'], protein: round(macros.protein * 0.25), carbs: round(macros.carbs * 0.15), fat: round(macros.fat * 0.25), price: p(50) },
        ],
      },
      active_rest: {
        label: dayLabelMap.en.active_rest,
        meals: (macros, cal) => [
          { id: 1, mealKey: 'breakfast', name: n.breakfast, time: '08:30', image: '/images/meals/breakfast.png', calories: round(cal * 0.27), items: ['Avocado toast (whole wheat)', 'Poached eggs (2)', 'Fresh orange juice'], protein: round(macros.protein * 0.22), carbs: round(macros.carbs * 0.25), fat: round(macros.fat * 0.30), price: p(38) },
          { id: 2, mealKey: 'snack', name: n.snack, time: '11:30', image: '/images/meals/snack.png', calories: round(cal * 0.12), items: ['Protein shake (with milk)', 'Dried apricots (5)'], protein: round(macros.protein * 0.18), carbs: round(macros.carbs * 0.12), fat: round(macros.fat * 0.10), price: p(20) },
          { id: 3, mealKey: 'lunch', name: n.lunch, time: '13:30', note: note.antiInflam, image: '/images/meals/lunch.png', calories: round(cal * 0.28), items: ['Baked salmon (150g)', 'Turmeric rice', 'Spinach-pomegranate salad'], protein: round(macros.protein * 0.28), carbs: round(macros.carbs * 0.28), fat: round(macros.fat * 0.28), price: p(58) },
          { id: 4, mealKey: 'afternoonSnack', name: n.afternoonSnack, time: '17:00', image: '/images/meals/postworkout.png', calories: round(cal * 0.13), items: ['Cottage cheese + honey + walnuts', 'Green tea'], protein: round(macros.protein * 0.15), carbs: round(macros.carbs * 0.10), fat: round(macros.fat * 0.12), price: p(18) },
          { id: 5, mealKey: 'dinner', name: n.dinner, time: '20:00', note: note.muscleRepair, image: '/images/meals/dinner.png', calories: round(cal * 0.20), items: ['Grilled mackerel (180g)', 'Roasted vegetables', 'Whole wheat bread (1 slice)'], protein: round(macros.protein * 0.17), carbs: round(macros.carbs * 0.25), fat: round(macros.fat * 0.20), price: p(52) },
        ],
      },
    },

    // ═══════════════════════════════════════════════════
    // SPANISH FOODS
    // ═══════════════════════════════════════════════════
    es: {
      upper: {
        label: dayLabelMap.es.upper,
        meals: (macros, cal) => [
          { id: 1, mealKey: 'breakfast', name: n.breakfast, time: '08:00', image: '/images/meals/breakfast.png', calories: round(cal * 0.25), items: ['Tostada con tomate y aceite de oliva', 'Tortilla española (3 huevos)', 'Café con leche'], protein: round(macros.protein * 0.25), carbs: round(macros.carbs * 0.28), fat: round(macros.fat * 0.22), price: p(38) },
          { id: 2, mealKey: 'snack', name: n.snack, time: '11:00', image: '/images/meals/snack.png', calories: round(cal * 0.12), items: ['Batido de proteína whey', 'Almendras (30g)'], protein: round(macros.protein * 0.18), carbs: round(macros.carbs * 0.08), fat: round(macros.fat * 0.20), price: p(22) },
          { id: 3, mealKey: 'lunch', name: n.lunch, time: '13:00', note: note.beforeWork, image: '/images/meals/lunch.png', calories: round(cal * 0.30), items: ['Pechuga de pollo a la plancha (200g)', 'Arroz integral (150g)', 'Ensalada mixta + aceite de oliva'], protein: round(macros.protein * 0.30), carbs: round(macros.carbs * 0.32), fat: round(macros.fat * 0.20), price: p(55) },
          { id: 4, mealKey: 'preWorkout', name: n.preWorkout, time: '18:30', note: note.afterWork, image: '/images/meals/postworkout.png', calories: round(cal * 0.15), items: ['Smoothie de plátano y proteína', 'Tortitas de arroz (2)'], protein: round(macros.protein * 0.12), carbs: round(macros.carbs * 0.18), fat: round(macros.fat * 0.08), price: p(28) },
          { id: 5, mealKey: 'dinner', name: n.dinner, time: '21:00', note: note.postWorkout, image: '/images/meals/dinner.png', calories: round(cal * 0.18), items: ['Salmón a la plancha (180g)', 'Boniato asado (150g)', 'Brócoli con aceite de oliva'], protein: round(macros.protein * 0.15), carbs: round(macros.carbs * 0.14), fat: round(macros.fat * 0.30), price: p(65) },
        ],
      },
      back: {
        label: dayLabelMap.es.back,
        meals: (macros, cal) => [
          { id: 1, mealKey: 'breakfast', name: n.breakfast, time: '08:00', image: '/images/meals/breakfast.png', calories: round(cal * 0.25), items: ['Pan integral (2) + queso + tomate', 'Revuelto de espinacas (3 huevos)', 'Café solo'], protein: round(macros.protein * 0.25), carbs: round(macros.carbs * 0.25), fat: round(macros.fat * 0.25), price: p(35) },
          { id: 2, mealKey: 'snack', name: n.snack, time: '11:00', image: '/images/meals/snack.png', calories: round(cal * 0.12), items: ['Yogur griego (200g) + nueces', 'Manzana verde'], protein: round(macros.protein * 0.12), carbs: round(macros.carbs * 0.12), fat: round(macros.fat * 0.18), price: p(18) },
          { id: 3, mealKey: 'lunch', name: n.lunch, time: '13:00', note: note.fullEnergy, image: '/images/meals/lunch.png', calories: round(cal * 0.30), items: ['Solomillo de ternera (180g)', 'Arroz basmati', 'Ensalada de rúcula + vinagreta'], protein: round(macros.protein * 0.30), carbs: round(macros.carbs * 0.30), fat: round(macros.fat * 0.22), price: p(62) },
          { id: 4, mealKey: 'preWorkout', name: n.preWorkout, time: '18:30', note: note.afterWork, image: '/images/meals/postworkout.png', calories: round(cal * 0.15), items: ['Barrita de proteína', 'Plátano', 'Agua (500ml)'], protein: round(macros.protein * 0.15), carbs: round(macros.carbs * 0.18), fat: round(macros.fat * 0.08), price: p(25) },
          { id: 5, mealKey: 'dinner', name: n.dinner, time: '21:00', note: note.recovery, image: '/images/meals/dinner.png', calories: round(cal * 0.18), items: ['Muslo de pollo al horno (200g)', 'Ensalada de quinoa', 'Medio aguacate'], protein: round(macros.protein * 0.18), carbs: round(macros.carbs * 0.15), fat: round(macros.fat * 0.27), price: p(58) },
        ],
      },
      shoulders: {
        label: dayLabelMap.es.shoulders,
        meals: (macros, cal) => [
          { id: 1, mealKey: 'breakfast', name: n.breakfast, time: '08:00', image: '/images/meals/breakfast.png', calories: round(cal * 0.25), items: ['Tortitas de proteína (3)', 'Miel + plátano en rodajas', 'Café americano'], protein: round(macros.protein * 0.22), carbs: round(macros.carbs * 0.30), fat: round(macros.fat * 0.18), price: p(40) },
          { id: 2, mealKey: 'snack', name: n.snack, time: '11:00', image: '/images/meals/snack.png', calories: round(cal * 0.12), items: ['Requesón (150g) + aceite de oliva', 'Crackers integrales (4)'], protein: round(macros.protein * 0.15), carbs: round(macros.carbs * 0.10), fat: round(macros.fat * 0.15), price: p(20) },
          { id: 3, mealKey: 'lunch', name: n.lunch, time: '13:00', note: note.beforeWork, image: '/images/meals/lunch.png', calories: round(cal * 0.30), items: ['Albóndigas a la plancha (180g)', 'Pasta integral', 'Gazpacho'], protein: round(macros.protein * 0.28), carbs: round(macros.carbs * 0.32), fat: round(macros.fat * 0.25), price: p(52) },
          { id: 4, mealKey: 'preWorkout', name: n.preWorkout, time: '18:30', note: note.afterWork, image: '/images/meals/postworkout.png', calories: round(cal * 0.15), items: ['Dátiles (3) + mantequilla de cacahuete', 'Batido de whey (agua)'], protein: round(macros.protein * 0.15), carbs: round(macros.carbs * 0.15), fat: round(macros.fat * 0.12), price: p(24) },
          { id: 5, mealKey: 'dinner', name: n.dinner, time: '21:00', note: note.postWorkout, image: '/images/meals/dinner.png', calories: round(cal * 0.18), items: ['Lubina al vapor (200g)', 'Cuscús con verduras', 'Ensalada verde'], protein: round(macros.protein * 0.20), carbs: round(macros.carbs * 0.13), fat: round(macros.fat * 0.30), price: p(60) },
        ],
      },
      lower: {
        label: dayLabelMap.es.lower,
        meals: (macros, cal) => [
          { id: 1, mealKey: 'breakfast', name: n.breakfast, time: '08:00', image: '/images/meals/breakfast.png', calories: round(cal * 0.25), items: ['Avena + leche + fresas + miel', 'Huevos cocidos (4)', 'Zumo de naranja'], protein: round(macros.protein * 0.23), carbs: round(macros.carbs * 0.30), fat: round(macros.fat * 0.18), price: p(36) },
          { id: 2, mealKey: 'snack', name: n.snack, time: '11:00', image: '/images/meals/snack.png', calories: round(cal * 0.13), items: ['Smoothie de plátano y cacahuete', 'Galletas integrales (2)'], protein: round(macros.protein * 0.12), carbs: round(macros.carbs * 0.15), fat: round(macros.fat * 0.15), price: p(20) },
          { id: 3, mealKey: 'lunch', name: n.lunch, time: '13:00', note: note.highCarb, image: '/images/meals/lunch.png', calories: round(cal * 0.28), items: ['Muslo de pollo al horno (220g)', 'Puré de patatas (200g)', 'Ensalada de zanahoria'], protein: round(macros.protein * 0.28), carbs: round(macros.carbs * 0.30), fat: round(macros.fat * 0.20), price: p(50) },
          { id: 4, mealKey: 'preWorkout', name: n.preWorkout, time: '18:30', note: note.extraEnergy, image: '/images/meals/postworkout.png', calories: round(cal * 0.16), items: ['Tortitas de arroz + miel', 'Plátano', 'BCAA (5g)'], protein: round(macros.protein * 0.10), carbs: round(macros.carbs * 0.15), fat: round(macros.fat * 0.07), price: p(22) },
          { id: 5, mealKey: 'dinner', name: n.dinner, time: '21:00', note: note.recovery, image: '/images/meals/dinner.png', calories: round(cal * 0.18), items: ['Salmón a la plancha (200g)', 'Boniato (200g)', 'Espárragos + limón'], protein: round(macros.protein * 0.27), carbs: round(macros.carbs * 0.10), fat: round(macros.fat * 0.40), price: p(68) },
        ],
      },
      hiit: {
        label: dayLabelMap.es.hiit,
        meals: (macros, cal) => [
          { id: 1, mealKey: 'breakfast', name: n.breakfast, time: '08:00', image: '/images/meals/breakfast.png', calories: round(cal * 0.25), items: ['Granola + yogur + arándanos', 'Huevos cocidos (2)', 'Té verde'], protein: round(macros.protein * 0.20), carbs: round(macros.carbs * 0.30), fat: round(macros.fat * 0.20), price: p(34) },
          { id: 2, mealKey: 'snack', name: n.snack, time: '11:00', image: '/images/meals/snack.png', calories: round(cal * 0.12), items: ['Barrita energética baja en azúcar', 'Manzana verde'], protein: round(macros.protein * 0.10), carbs: round(macros.carbs * 0.15), fat: round(macros.fat * 0.12), price: p(18) },
          { id: 3, mealKey: 'lunch', name: n.lunch, time: '13:00', note: note.filling, image: '/images/meals/lunch.png', calories: round(cal * 0.28), items: ['Wrap de atún (integral)', 'Sopa de lentejas', 'Agua con limón'], protein: round(macros.protein * 0.28), carbs: round(macros.carbs * 0.25), fat: round(macros.fat * 0.22), price: p(45) },
          { id: 4, mealKey: 'preWorkout', name: n.preWorkout, time: '18:30', note: note.quickEnergy, image: '/images/meals/postworkout.png', calories: round(cal * 0.15), items: ['Plátano + miel (1 cda)', 'Dátiles (4)'], protein: round(macros.protein * 0.05), carbs: round(macros.carbs * 0.20), fat: round(macros.fat * 0.06), price: p(15) },
          { id: 5, mealKey: 'dinner', name: n.dinner, time: '21:00', note: note.recovery, image: '/images/meals/dinner.png', calories: round(cal * 0.20), items: ['Pechuga de pollo a la plancha (200g)', 'Quinoa con verduras', 'Alcachofas al horno'], protein: round(macros.protein * 0.37), carbs: round(macros.carbs * 0.10), fat: round(macros.fat * 0.40), price: p(55) },
        ],
      },
      rest: {
        label: dayLabelMap.es.rest,
        meals: (macros, cal) => [
          { id: 1, mealKey: 'breakfast', name: n.breakfast, time: '09:00', image: '/images/meals/breakfast.png', calories: round(cal * 0.28), items: ['Huevos revueltos con pimientos (3)', 'Pan integral tostado', 'Queso manchego + aceitunas', 'Café'], protein: round(macros.protein * 0.25), carbs: round(macros.carbs * 0.25), fat: round(macros.fat * 0.30), price: p(30) },
          { id: 2, mealKey: 'snack', name: n.snack, time: '12:00', image: '/images/meals/snack.png', calories: round(cal * 0.12), items: ['Fruta variada (manzana + naranja)', 'Nueces (un puñado)'], protein: round(macros.protein * 0.08), carbs: round(macros.carbs * 0.18), fat: round(macros.fat * 0.15), price: p(15) },
          { id: 3, mealKey: 'lunch', name: n.lunch, time: '14:00', note: note.filling, image: '/images/meals/lunch.png', calories: round(cal * 0.30), items: ['Sopa de garbanzos', 'Albóndigas a la plancha (150g)', 'Arroz integral', 'Ensalada'], protein: round(macros.protein * 0.32), carbs: round(macros.carbs * 0.30), fat: round(macros.fat * 0.22), price: p(48) },
          { id: 4, mealKey: 'afternoonSnack', name: n.afternoonSnack, time: '17:00', image: '/images/meals/postworkout.png', calories: round(cal * 0.10), items: ['Yogur griego (200g)', 'Miel (1 cda) + semillas de chía'], protein: round(macros.protein * 0.10), carbs: round(macros.carbs * 0.12), fat: round(macros.fat * 0.08), price: p(14) },
          { id: 5, mealKey: 'dinner', name: n.dinner, time: '20:00', note: note.light, image: '/images/meals/dinner.png', calories: round(cal * 0.20), items: ['Pollo al horno con hierbas (180g)', 'Ensalada verde + limón', 'Aceite de oliva virgen'], protein: round(macros.protein * 0.25), carbs: round(macros.carbs * 0.15), fat: round(macros.fat * 0.25), price: p(50) },
        ],
      },
      active_rest: {
        label: dayLabelMap.es.active_rest,
        meals: (macros, cal) => [
          { id: 1, mealKey: 'breakfast', name: n.breakfast, time: '08:30', image: '/images/meals/breakfast.png', calories: round(cal * 0.27), items: ['Tostada de aguacate (pan integral)', 'Huevos pochados (2)', 'Zumo de naranja natural'], protein: round(macros.protein * 0.22), carbs: round(macros.carbs * 0.25), fat: round(macros.fat * 0.30), price: p(38) },
          { id: 2, mealKey: 'snack', name: n.snack, time: '11:30', image: '/images/meals/snack.png', calories: round(cal * 0.12), items: ['Batido de proteína (con leche)', 'Orejones de albaricoque (5)'], protein: round(macros.protein * 0.18), carbs: round(macros.carbs * 0.12), fat: round(macros.fat * 0.10), price: p(20) },
          { id: 3, mealKey: 'lunch', name: n.lunch, time: '13:30', note: note.antiInflam, image: '/images/meals/lunch.png', calories: round(cal * 0.28), items: ['Salmón al horno (150g)', 'Arroz con cúrcuma', 'Ensalada de espinacas + granada'], protein: round(macros.protein * 0.28), carbs: round(macros.carbs * 0.28), fat: round(macros.fat * 0.28), price: p(58) },
          { id: 4, mealKey: 'afternoonSnack', name: n.afternoonSnack, time: '17:00', image: '/images/meals/postworkout.png', calories: round(cal * 0.13), items: ['Requesón + miel + nueces', 'Té verde'], protein: round(macros.protein * 0.15), carbs: round(macros.carbs * 0.10), fat: round(macros.fat * 0.12), price: p(18) },
          { id: 5, mealKey: 'dinner', name: n.dinner, time: '20:00', note: note.muscleRepair, image: '/images/meals/dinner.png', calories: round(cal * 0.20), items: ['Caballa a la plancha (180g)', 'Verduras asadas', 'Pan integral (1 rebanada)'], protein: round(macros.protein * 0.17), carbs: round(macros.carbs * 0.25), fat: round(macros.fat * 0.20), price: p(52) },
        ],
      },
    },
  };

  return foods[lang] || foods.tr;
}

// ── Localized Meal Alternatives ──────────────────────────
export function getMealAlternatives(lang = 'tr') {
  const alts = {
    tr: {
      breakfast: [
        ['Yulaf ezmesi + muz + bal', 'Haşlanmış yumurta (3)', 'Yeşil çay'],
        ['Peynirli omlet (3 yumurta)', 'Tam buğday ekmek', 'Domates-salatalık'],
        ['Protein pancake (2)', 'Fıstık ezmesi', 'Süt (1 bardak)'],
        ['Menemen (3 yumurta)', 'Çavdar ekmeği', 'Beyaz peynir'],
      ],
      lunch: [
        ['Izgara tavuk göğsü (200g)', 'Bulgur pilavı', 'Mevsim salatası'],
        ['Köfte (150g)', 'Makarna (tam buğday)', 'Ayran'],
        ['Ton balıklı wrap', 'Avokado', 'Mercimek çorbası'],
        ['Dana bonfile (180g)', 'Tatlı patates püresi', 'Brokoli'],
      ],
      dinner: [
        ['Fırında somon (200g)', 'Kinoa', 'Ispanak salatası'],
        ['Tavuk sote', 'Esmer pirinç pilavı', 'Cacık'],
        ['Izgara levrek', 'Sebzeli bulgur', 'Roka salatası'],
        ['Hindi but (200g)', 'Patates püresi', 'Havuç tarator'],
      ],
      snack: [
        ['Protein bar', 'Muz', 'Badem (30g)'],
        ['Yoğurt (200g)', 'Granola', 'Bal'],
        ['Elma + fıstık ezmesi', 'Ceviz (20g)'],
        ['Lor peyniri (150g)', 'Kuru üzüm', 'Fındık (20g)'],
      ],
      preWorkout: [
        ['Whey protein shake', 'Muz', 'Yulaf ezmesi'],
        ['Süt + protein tozu', 'Pirinç keki (2)', 'Bal'],
        ['Tavuklu sandviç', 'Meyve suyu', 'Hurma (3)'],
      ],
    },
    en: {
      breakfast: [
        ['Oatmeal + banana + honey', 'Boiled eggs (3)', 'Green tea'],
        ['Cheese omelet (3 eggs)', 'Whole wheat toast', 'Tomato-cucumber'],
        ['Protein pancakes (2)', 'Peanut butter', 'Milk (1 glass)'],
        ['Scrambled eggs (3)', 'Rye bread', 'Cottage cheese'],
      ],
      lunch: [
        ['Grilled chicken breast (200g)', 'Brown rice', 'Seasonal salad'],
        ['Turkey meatballs (150g)', 'Whole wheat pasta', 'Buttermilk'],
        ['Tuna wrap', 'Avocado', 'Lentil soup'],
        ['Beef sirloin (180g)', 'Sweet potato mash', 'Broccoli'],
      ],
      dinner: [
        ['Baked salmon (200g)', 'Quinoa', 'Spinach salad'],
        ['Chicken stir-fry', 'Brown rice', 'Greek yogurt'],
        ['Grilled sea bass', 'Vegetable couscous', 'Arugula salad'],
        ['Roasted turkey (200g)', 'Mashed potatoes', 'Carrot sticks'],
      ],
      snack: [
        ['Protein bar', 'Banana', 'Almonds (30g)'],
        ['Greek yogurt (200g)', 'Granola', 'Honey'],
        ['Apple + peanut butter', 'Walnuts (20g)'],
        ['Cottage cheese (150g)', 'Raisins', 'Hazelnuts (20g)'],
      ],
      preWorkout: [
        ['Whey protein shake', 'Banana', 'Oatmeal'],
        ['Milk + protein powder', 'Rice cakes (2)', 'Honey'],
        ['Chicken sandwich', 'Fruit juice', 'Dates (3)'],
      ],
    },
    es: {
      breakfast: [
        ['Avena + plátano + miel', 'Huevos cocidos (3)', 'Té verde'],
        ['Tortilla de queso (3 huevos)', 'Pan integral', 'Tomate-pepino'],
        ['Tortitas de proteína (2)', 'Mantequilla de cacahuete', 'Leche (1 vaso)'],
        ['Huevos revueltos (3)', 'Pan de centeno', 'Requesón'],
      ],
      lunch: [
        ['Pechuga de pollo a la plancha (200g)', 'Arroz integral', 'Ensalada de temporada'],
        ['Albóndigas de pavo (150g)', 'Pasta integral', 'Agua con limón'],
        ['Wrap de atún', 'Aguacate', 'Sopa de lentejas'],
        ['Solomillo de ternera (180g)', 'Puré de boniato', 'Brócoli'],
      ],
      dinner: [
        ['Salmón al horno (200g)', 'Quinoa', 'Ensalada de espinacas'],
        ['Salteado de pollo', 'Arroz integral', 'Yogur griego'],
        ['Lubina a la plancha', 'Cuscús con verduras', 'Ensalada de rúcula'],
        ['Pavo asado (200g)', 'Puré de patatas', 'Bastones de zanahoria'],
      ],
      snack: [
        ['Barrita de proteína', 'Plátano', 'Almendras (30g)'],
        ['Yogur griego (200g)', 'Granola', 'Miel'],
        ['Manzana + mantequilla de cacahuete', 'Nueces (20g)'],
        ['Requesón (150g)', 'Pasas', 'Avellanas (20g)'],
      ],
      preWorkout: [
        ['Batido de whey', 'Plátano', 'Avena'],
        ['Leche + proteína en polvo', 'Tortitas de arroz (2)', 'Miel'],
        ['Sándwich de pollo', 'Zumo de frutas', 'Dátiles (3)'],
      ],
    },
  };
  return alts[lang] || alts.tr;
}

export { buildMealTemplates };
