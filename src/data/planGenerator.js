/**
 * ShredMatrix — Plan Generator (Mock)
 * Her antrenman gününe özel beslenme programı + fiyat bilgisi.
 * İş programı: Değişken (bazen 14:00-18:00), Haftalık 4 gün antrenman.
 */

import { buildMealTemplates, dayLabelMap } from './mealDatabase';

// ── Kalori Hesaplama ─────────────────────────────────────
function calculateBMR(weight, bodyFat, age, height, gender) {
  // Birincil: Katch-McArdle (yağsız kütle üzerinden)
  const leanMass = weight * (1 - bodyFat / 100);
  const katchBMR = 370 + 21.6 * leanMass;

  // İkincil: Mifflin-St Jeor (yaş/boy/cinsiyet ile doğrulama)
  let mifflinBMR;
  if (gender === 'female') {
    mifflinBMR = 10 * weight + 6.25 * height - 5 * age - 161;
  } else {
    mifflinBMR = 10 * weight + 6.25 * height - 5 * age + 5;
  }

  // İkisinin ortalaması daha doğru sonuç verir
  return (katchBMR + mifflinBMR) / 2;
}

const activityMultipliers = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9,
};

// ── Makro Dağılımları ────────────────────────────────────
function calculateMacros(calories, goal) {
  const ratios = {
    muscle:     { p: 0.35, c: 0.40, f: 0.25 },
    fat_loss:   { p: 0.40, c: 0.25, f: 0.35 },
    meditation: { p: 0.25, c: 0.45, f: 0.30 },
    yoga:       { p: 0.28, c: 0.42, f: 0.30 },
    pilates:    { p: 0.30, c: 0.40, f: 0.30 },
    reformer:   { p: 0.32, c: 0.38, f: 0.30 },
  };
  const r = ratios[goal] || ratios.muscle;
  return {
    protein: Math.round((calories * r.p) / 4),
    carbs: Math.round((calories * r.c) / 4),
    fat: Math.round((calories * r.f) / 9),
  };
}

// ── Antrenman Tipine Göre Kalori Ayarlama ─────────────────
function adjustCaloriesForDay(baseCalories, dayType, goal) {
  switch (dayType) {
    case 'upper':      return Math.round(baseCalories * 1.05);  // Üst vücut +%5
    case 'lower':      return Math.round(baseCalories * 1.10);  // Alt vücut +%10 (daha yorucu)
    case 'hiit':       return Math.round(baseCalories * 1.08);  // HIIT +%8
    case 'active_rest': return Math.round(baseCalories * 0.90); // Aktif dinlenme -%10
    case 'rest':       return Math.round(baseCalories * 0.85);  // Tam dinlenme -%15
    default:           return baseCalories;
  }
}

// ── Öğün Veritabanı (Antrenman Tipine Göre — Dil Destekli) ──
function getMealTemplates(lang = 'tr') {
  return buildMealTemplates(lang);
}

// ── Gün → Öğün template eşleştirme ──────────────────────
function getDayMealType(dayFocus) {
  const f = dayFocus.toLowerCase();
  // Turkish + English + Spanish
  if (f.includes('göğüs') || f.includes('triceps') || f.includes('üst vücut') || f.includes('push') || f.includes('chest') || f.includes('upper')) return 'upper';
  if (f.includes('sırt') || f.includes('biceps') || f.includes('pull') || f.includes('back')) return 'back';
  if (f.includes('omuz') || f.includes('trapez') || f.includes('shoulder')) return 'shoulders';
  if (f.includes('bacak') || f.includes('core') || f.includes('alt vücut') || f.includes('leg') || f.includes('pierna')) return 'lower';
  if (f.includes('hiit') || f.includes('metabol') || f.includes('kardiyo') || f.includes('conditioning') || f.includes('cardio') || f.includes('metabolik')) return 'hiit';
  if (f.includes('aktif') || f.includes('toparlanma') || f.includes('active') || f.includes('recovery') || f.includes('recuper')) return 'active_rest';
  if (f.includes('dinlenme') || f.includes('rest') || f.includes('off') || f.includes('descanso')) return 'rest';
  return 'rest';
}

// ── Antrenman Programı — Fazlı Sistem ─────────────────────
// Her hedef için 4 faz: Foundation → Advanced → Intensive → Elite
const workoutPhases = {
  muscle: [
    // ─── Phase 0 — Foundation (Temel Program) ─────────────
    [
      {
        day: 'Pazartesi', focus: 'Göğüs & Triceps', emoji: '🔥',
        image: '/images/workouts/chest.png',
        exercises: [
          { name: 'Bench Press', sets: 4, reps: '8-10', rest: '90s' },
          { name: 'İncline Dumbbell Press', sets: 4, reps: '10-12', rest: '75s' },
          { name: 'Cable Flyes', sets: 3, reps: '12-15', rest: '60s' },
          { name: 'Dips', sets: 3, reps: '10-12', rest: '60s' },
          { name: 'Triceps Pushdown', sets: 3, reps: '12-15', rest: '45s' },
          { name: 'Overhead Triceps Extension', sets: 3, reps: '12-15', rest: '45s' },
        ],
      },
      {
        day: 'Salı', focus: 'Dinlenme', emoji: '😴',
        exercises: [{ name: 'Tam Dinlenme', sets: '-', reps: '-', rest: '-' }],
      },
      {
        day: 'Çarşamba', focus: 'Sırt & Biceps', emoji: '💪',
        image: '/images/workouts/back.png',
        exercises: [
          { name: 'Deadlift', sets: 4, reps: '6-8', rest: '120s' },
          { name: 'Barbell Row', sets: 4, reps: '8-10', rest: '90s' },
          { name: 'Lat Pulldown', sets: 3, reps: '10-12', rest: '75s' },
          { name: 'Seated Cable Row', sets: 3, reps: '12-15', rest: '60s' },
          { name: 'Barbell Curl', sets: 3, reps: '10-12', rest: '45s' },
          { name: 'Hammer Curl', sets: 3, reps: '12-15', rest: '45s' },
        ],
      },
      {
        day: 'Perşembe', focus: 'Dinlenme', emoji: '😴',
        exercises: [{ name: 'Tam Dinlenme', sets: '-', reps: '-', rest: '-' }],
      },
      {
        day: 'Cuma', focus: 'Omuz & Trapez', emoji: '⚡',
        image: '/images/workouts/shoulders.png',
        exercises: [
          { name: 'Military Press', sets: 4, reps: '8-10', rest: '90s' },
          { name: 'Lateral Raise', sets: 4, reps: '12-15', rest: '45s' },
          { name: 'Face Pull', sets: 3, reps: '15-20', rest: '45s' },
          { name: 'Rear Delt Fly', sets: 3, reps: '12-15', rest: '45s' },
          { name: 'Barbell Shrug', sets: 4, reps: '10-12', rest: '60s' },
        ],
      },
      {
        day: 'Cumartesi', focus: 'Bacak & Core', emoji: '🦵',
        image: '/images/workouts/legs.png',
        exercises: [
          { name: 'Squat', sets: 4, reps: '8-10', rest: '120s' },
          { name: 'Romanian Deadlift', sets: 4, reps: '10-12', rest: '90s' },
          { name: 'Leg Press', sets: 3, reps: '12-15', rest: '75s' },
          { name: 'Walking Lunges', sets: 3, reps: '12/bacak', rest: '60s' },
          { name: 'Leg Curl', sets: 3, reps: '12-15', rest: '45s' },
          { name: 'Plank', sets: 3, reps: '60s', rest: '30s' },
        ],
      },
      {
        day: 'Pazar', focus: 'Tam Dinlenme', emoji: '😴',
        exercises: [{ name: 'Tam Dinlenme', sets: '-', reps: '-', rest: '-' }],
      },
    ],

    // ─── Phase 1 — Advanced (Farklı Açılar, Artan Hacim) ──
    [
      {
        day: 'Pazartesi', focus: 'Göğüs & Ön Omuz', emoji: '🔥',
        image: '/images/workouts/chest.png',
        exercises: [
          { name: 'Incline Barbell Press', sets: 4, reps: '8-10', rest: '90s' },
          { name: 'Dumbbell Flyes', sets: 4, reps: '10-12', rest: '60s' },
          { name: 'Decline Press', sets: 3, reps: '10-12', rest: '75s' },
          { name: 'Cable Crossover', sets: 3, reps: '12-15', rest: '45s' },
          { name: 'Front Raise', sets: 3, reps: '12-15', rest: '45s' },
          { name: 'Skull Crushers', sets: 3, reps: '10-12', rest: '45s' },
        ],
      },
      {
        day: 'Salı', focus: 'Sırt & Arka Omuz', emoji: '💪',
        image: '/images/workouts/back.png',
        exercises: [
          { name: 'Pull-Ups', sets: 4, reps: '8-12', rest: '90s' },
          { name: 'T-Bar Row', sets: 4, reps: '8-10', rest: '75s' },
          { name: 'Single Arm Dumbbell Row', sets: 3, reps: '10-12', rest: '60s' },
          { name: 'Cable Pullover', sets: 3, reps: '12-15', rest: '45s' },
          { name: 'Reverse Pec Deck', sets: 3, reps: '15', rest: '45s' },
          { name: 'Preacher Curl', sets: 3, reps: '10-12', rest: '45s' },
        ],
      },
      {
        day: 'Çarşamba', focus: 'Dinlenme', emoji: '😴',
        exercises: [{ name: 'Tam Dinlenme', sets: '-', reps: '-', rest: '-' }],
      },
      {
        day: 'Perşembe', focus: 'Bacak & Kalça', emoji: '🦵',
        image: '/images/workouts/legs.png',
        exercises: [
          { name: 'Front Squat', sets: 4, reps: '8-10', rest: '120s' },
          { name: 'Bulgarian Split Squat', sets: 3, reps: '10/bacak', rest: '75s' },
          { name: 'Leg Extension', sets: 3, reps: '12-15', rest: '45s' },
          { name: 'Lying Leg Curl', sets: 3, reps: '12-15', rest: '45s' },
          { name: 'Hip Thrust', sets: 4, reps: '10-12', rest: '75s' },
          { name: 'Calf Raise', sets: 4, reps: '15-20', rest: '30s' },
        ],
      },
      {
        day: 'Cuma', focus: 'Omuz & Kol', emoji: '⚡',
        image: '/images/workouts/shoulders.png',
        exercises: [
          { name: 'Arnold Press', sets: 4, reps: '8-10', rest: '75s' },
          { name: 'Cable Lateral Raise', sets: 4, reps: '12-15', rest: '45s' },
          { name: 'Upright Row', sets: 3, reps: '10-12', rest: '60s' },
          { name: 'Close Grip Bench Press', sets: 3, reps: '8-10', rest: '75s' },
          { name: 'Incline Dumbbell Curl', sets: 3, reps: '10-12', rest: '45s' },
          { name: 'Hammer Curl', sets: 3, reps: '12-15', rest: '45s' },
        ],
      },
      {
        day: 'Cumartesi', focus: 'Dinlenme', emoji: '😴',
        exercises: [{ name: 'Tam Dinlenme', sets: '-', reps: '-', rest: '-' }],
      },
      {
        day: 'Pazar', focus: 'Tam Dinlenme', emoji: '😴',
        exercises: [{ name: 'Tam Dinlenme', sets: '-', reps: '-', rest: '-' }],
      },
    ],

    // ─── Phase 2 — Intensive (Süpersetler, Dropsetler) ────
    // 5 günlük split: Push / Pull / Bacak / Üst / Alt
    [
      {
        day: 'Pazartesi', focus: 'Push — Göğüs & Omuz & Triceps', emoji: '🔥',
        image: '/images/workouts/chest.png',
        exercises: [
          { name: 'Süperset: Bench Press + Dumbbell Flyes', sets: 4, reps: '8 + 12', rest: '90s' },
          { name: 'Incline Smith Machine Press', sets: 4, reps: '10-12', rest: '75s' },
          { name: 'Süperset: Shoulder Press + Lateral Raise', sets: 3, reps: '10 + 15', rest: '75s' },
          { name: 'Cable Crossover (Dropset)', sets: 3, reps: '12-10-8', rest: '60s' },
          { name: 'Süperset: Triceps Dip + Pushdown', sets: 3, reps: '10 + 15', rest: '60s' },
          { name: 'Overhead Cable Extension', sets: 3, reps: '15', rest: '30s' },
        ],
      },
      {
        day: 'Salı', focus: 'Pull — Sırt & Biceps', emoji: '💪',
        image: '/images/workouts/back.png',
        exercises: [
          { name: 'Süperset: Weighted Pull-Up + Straight Arm Pulldown', sets: 4, reps: '8 + 12', rest: '90s' },
          { name: 'Pendlay Row', sets: 4, reps: '6-8', rest: '90s' },
          { name: 'Süperset: Cable Row + Face Pull', sets: 3, reps: '10 + 15', rest: '75s' },
          { name: 'Meadows Row', sets: 3, reps: '10-12', rest: '60s' },
          { name: 'Süperset: EZ Bar Curl + Reverse Curl', sets: 3, reps: '10 + 12', rest: '45s' },
          { name: 'Concentration Curl (Dropset)', sets: 2, reps: '12-10-8', rest: '45s' },
        ],
      },
      {
        day: 'Çarşamba', focus: 'Bacak — Quad Dominant', emoji: '🦵',
        image: '/images/workouts/legs.png',
        exercises: [
          { name: 'Back Squat (Pause)', sets: 5, reps: '5-6', rest: '150s' },
          { name: 'Süperset: Leg Press + Jump Squat', sets: 4, reps: '12 + 8', rest: '90s' },
          { name: 'Hack Squat', sets: 3, reps: '10-12', rest: '75s' },
          { name: 'Süperset: Leg Extension + Sissy Squat', sets: 3, reps: '15 + 10', rest: '60s' },
          { name: 'Standing Calf Raise (Dropset)', sets: 4, reps: '20-15-12', rest: '30s' },
          { name: 'Hanging Leg Raise', sets: 3, reps: '15', rest: '45s' },
        ],
      },
      {
        day: 'Perşembe', focus: 'Dinlenme / Aktif Toparlanma', emoji: '🧘',
        exercises: [
          { name: 'Hafif Yürüyüş', sets: 1, reps: '30 dk', rest: '-' },
          { name: 'Foam Rolling & Stretching', sets: 1, reps: '20 dk', rest: '-' },
        ],
      },
      {
        day: 'Cuma', focus: 'Üst Vücut — Push & Pull Mix', emoji: '⚡',
        image: '/images/workouts/shoulders.png',
        exercises: [
          { name: 'Süperset: Incline DB Press + Chest-Supported Row', sets: 4, reps: '10 + 10', rest: '75s' },
          { name: 'Süperset: OHP + Chin-Ups', sets: 3, reps: '8 + 8', rest: '90s' },
          { name: 'Süperset: Cable Fly + Reverse Fly', sets: 3, reps: '12 + 15', rest: '60s' },
          { name: 'Süperset: Skull Crusher + Barbell Curl', sets: 3, reps: '10 + 10', rest: '60s' },
          { name: 'Lateral Raise (21s Method)', sets: 3, reps: '7+7+7', rest: '45s' },
          { name: 'Shrug (Dropset)', sets: 3, reps: '12-10-8', rest: '45s' },
        ],
      },
      {
        day: 'Cumartesi', focus: 'Bacak — Hamstring & Kalça', emoji: '🦵',
        image: '/images/workouts/legs.png',
        exercises: [
          { name: 'Sumo Deadlift', sets: 4, reps: '6-8', rest: '120s' },
          { name: 'Süperset: Hip Thrust + Glute Bridge', sets: 4, reps: '10 + 15', rest: '75s' },
          { name: 'Nordic Hamstring Curl', sets: 3, reps: '6-8', rest: '90s' },
          { name: 'Süperset: Lying Leg Curl + Good Morning', sets: 3, reps: '12 + 10', rest: '60s' },
          { name: 'Adductor Machine', sets: 3, reps: '15', rest: '45s' },
          { name: 'Seated Calf Raise', sets: 4, reps: '15-20', rest: '30s' },
        ],
      },
      {
        day: 'Pazar', focus: 'Tam Dinlenme', emoji: '😴',
        exercises: [{ name: 'Tam Dinlenme', sets: '-', reps: '-', rest: '-' }],
      },
    ],

    // ─── Phase 3 — Elite (Periodize, Deload Notları) ──────
    [
      {
        day: 'Pazartesi', focus: 'Göğüs & Triceps — Güç Odaklı', emoji: '🏆',
        image: '/images/workouts/chest.png',
        exercises: [
          { name: 'Paused Bench Press (3s)', sets: 5, reps: '4-6', rest: '180s' },
          { name: 'Close Grip Floor Press', sets: 4, reps: '6-8', rest: '120s' },
          { name: 'Weighted Dips', sets: 4, reps: '6-8', rest: '90s' },
          { name: 'Süperset: Incline DB Press + Pec Deck', sets: 3, reps: '8 + 12', rest: '75s' },
          { name: 'JM Press', sets: 3, reps: '8-10', rest: '60s' },
          { name: 'Cable Kickback (Dropset)', sets: 3, reps: '12-10-8', rest: '45s' },
          { name: '⚠️ Deload Notu: 4. haftada ağırlıkları %60\'a düşür', sets: '-', reps: '-', rest: '-' },
        ],
      },
      {
        day: 'Salı', focus: 'Sırt & Biceps — Hacim Odaklı', emoji: '🏆',
        image: '/images/workouts/back.png',
        exercises: [
          { name: 'Deficit Deadlift', sets: 5, reps: '3-5', rest: '180s' },
          { name: 'Weighted Chin-Ups', sets: 4, reps: '6-8', rest: '120s' },
          { name: 'Süperset: Seal Row + Chest-Supported Shrug', sets: 4, reps: '8 + 12', rest: '90s' },
          { name: 'Kroc Row', sets: 3, reps: '15-20', rest: '75s' },
          { name: 'Süperset: Spider Curl + Bayesian Curl', sets: 3, reps: '10 + 12', rest: '60s' },
          { name: 'Behind-the-Back Wrist Curl', sets: 3, reps: '20', rest: '30s' },
          { name: '⚠️ Deload Notu: 4. haftada toplam seti %50 azalt', sets: '-', reps: '-', rest: '-' },
        ],
      },
      {
        day: 'Çarşamba', focus: 'Dinlenme / Aktif Toparlanma', emoji: '🧘',
        exercises: [
          { name: 'Hafif Yüzme veya Bisiklet', sets: 1, reps: '30 dk', rest: '-' },
          { name: 'Mobility Drill (Kalça + Omuz)', sets: 1, reps: '20 dk', rest: '-' },
          { name: 'Foam Rolling + Kontrast Duş', sets: 1, reps: '15 dk', rest: '-' },
        ],
      },
      {
        day: 'Perşembe', focus: 'Bacak — Güç & Patlayıcılık', emoji: '🏆',
        image: '/images/workouts/legs.png',
        exercises: [
          { name: 'Back Squat (RPE 9)', sets: 5, reps: '3-5', rest: '180s' },
          { name: 'Paused Front Squat', sets: 3, reps: '6-8', rest: '120s' },
          { name: 'Box Jump', sets: 4, reps: '5', rest: '90s' },
          { name: 'Süperset: Leg Press + Wall Sit', sets: 3, reps: '12 + 30s', rest: '75s' },
          { name: 'Reverse Lunge (Barbell)', sets: 3, reps: '8/bacak', rest: '75s' },
          { name: 'Standing Single Leg Calf Raise', sets: 4, reps: '12-15', rest: '30s' },
          { name: '⚠️ Deload Notu: 4. haftada squat ağırlığı max %65', sets: '-', reps: '-', rest: '-' },
        ],
      },
      {
        day: 'Cuma', focus: 'Omuz & Kol — Hipertrofi', emoji: '🏆',
        image: '/images/workouts/shoulders.png',
        exercises: [
          { name: 'Push Press', sets: 4, reps: '5-6', rest: '120s' },
          { name: 'Süperset: Lu Raise + Rear Delt Cable Fly', sets: 4, reps: '10 + 15', rest: '60s' },
          { name: 'Süperset: Close Grip Bench + Weighted Chin-Up', sets: 4, reps: '8 + 8', rest: '90s' },
          { name: 'Giant Set: Lateral Raise + Front Raise + Rear Delt', sets: 3, reps: '10+10+10', rest: '60s' },
          { name: 'Süperset: Rope Pushdown + Cable Curl', sets: 3, reps: '15 + 15', rest: '45s' },
          { name: 'Plate Pinch + Farmer Walk', sets: 3, reps: '30s + 40m', rest: '60s' },
        ],
      },
      {
        day: 'Cumartesi', focus: 'Full Body — Zayıf Nokta Günü', emoji: '🎯',
        image: '/images/workouts/chest.png',
        exercises: [
          { name: 'Tempo Squat (3-1-3)', sets: 3, reps: '8', rest: '90s' },
          { name: 'Tempo Bench Press (3-1-3)', sets: 3, reps: '8', rest: '90s' },
          { name: 'Pendlay Row (Strict)', sets: 3, reps: '8', rest: '75s' },
          { name: 'Süperset: DB Lateral Raise + Band Pull-Apart', sets: 3, reps: '15 + 20', rest: '45s' },
          { name: 'Turkish Get-Up', sets: 2, reps: '3/taraf', rest: '90s' },
          { name: 'Ab Wheel + Pallof Press', sets: 3, reps: '10 + 12', rest: '45s' },
        ],
      },
      {
        day: 'Pazar', focus: 'Tam Dinlenme', emoji: '😴',
        exercises: [{ name: 'Tam Dinlenme', sets: '-', reps: '-', rest: '-' }],
      },
    ],
  ],

  fat_loss: [
    // ─── Phase 0 — Foundation (Temel Yağ Yakım) ──────────
    [
      {
        day: 'Pazartesi', focus: 'Full Body HIIT', emoji: '🔥',
        image: '/images/workouts/chest.png',
        exercises: [
          { name: 'Burpees', sets: 4, reps: '15', rest: '30s' },
          { name: 'Kettlebell Swing', sets: 4, reps: '20', rest: '30s' },
          { name: 'Mountain Climbers', sets: 3, reps: '30s', rest: '15s' },
          { name: 'Box Jumps', sets: 3, reps: '12', rest: '30s' },
          { name: 'Battle Ropes', sets: 3, reps: '30s', rest: '30s' },
        ],
      },
      {
        day: 'Salı', focus: 'Dinlenme', emoji: '😴',
        exercises: [{ name: 'Tam Dinlenme', sets: '-', reps: '-', rest: '-' }],
      },
      {
        day: 'Çarşamba', focus: 'Üst Vücut + Kardiyo', emoji: '💪',
        image: '/images/workouts/back.png',
        exercises: [
          { name: 'Push-Up Variations', sets: 4, reps: '15', rest: '30s' },
          { name: 'Dumbbell Row', sets: 3, reps: '12', rest: '45s' },
          { name: 'Shoulder Press', sets: 3, reps: '12', rest: '45s' },
          { name: 'Cable Flyes', sets: 3, reps: '15', rest: '30s' },
          { name: 'Treadmill Sprint Intervals', sets: 1, reps: '15 dk', rest: '-' },
        ],
      },
      {
        day: 'Perşembe', focus: 'Dinlenme / Aktif Toparlanma', emoji: '🧘',
        exercises: [
          { name: 'Hafif Yürüyüş', sets: 1, reps: '30 dk', rest: '-' },
          { name: 'Foam Rolling', sets: 1, reps: '15 dk', rest: '-' },
        ],
      },
      {
        day: 'Cuma', focus: 'Alt Vücut Güç', emoji: '⚡',
        image: '/images/workouts/legs.png',
        exercises: [
          { name: 'Goblet Squat', sets: 4, reps: '15', rest: '45s' },
          { name: 'Jump Lunges', sets: 3, reps: '12/bacak', rest: '30s' },
          { name: 'Deadlift (Orta Ağırlık)', sets: 4, reps: '12', rest: '60s' },
          { name: 'Step-Ups', sets: 3, reps: '15/bacak', rest: '30s' },
          { name: 'Plank to Push-Up', sets: 3, reps: '12', rest: '30s' },
        ],
      },
      {
        day: 'Cumartesi', focus: 'Metabolik Conditioning', emoji: '🎯',
        image: '/images/workouts/shoulders.png',
        exercises: [
          { name: 'EMOM Circuit (10 dk)', sets: 1, reps: '-', rest: '-' },
          { name: 'Thrusters', sets: 3, reps: '15', rest: '30s' },
          { name: 'Rowing Machine', sets: 4, reps: '500m', rest: '60s' },
          { name: 'TRX Rows', sets: 3, reps: '15', rest: '30s' },
          { name: 'Ab Wheel Rollout', sets: 3, reps: '12', rest: '30s' },
        ],
      },
      {
        day: 'Pazar', focus: 'Tam Dinlenme', emoji: '😴',
        exercises: [{ name: 'Tam Dinlenme', sets: '-', reps: '-', rest: '-' }],
      },
    ],

    // ─── Phase 1 — Advanced HIIT + Güç ────────────────────
    [
      {
        day: 'Pazartesi', focus: 'Üst Vücut HIIT + Güç', emoji: '🔥',
        image: '/images/workouts/chest.png',
        exercises: [
          { name: 'Dumbbell Bench Press', sets: 4, reps: '10-12', rest: '45s' },
          { name: 'Renegade Row', sets: 3, reps: '10/taraf', rest: '30s' },
          { name: 'Push-Up + Plyo Push-Up Combo', sets: 3, reps: '8+5', rest: '45s' },
          { name: 'Arnold Press', sets: 3, reps: '12', rest: '45s' },
          { name: 'Battle Ropes (Tabata)', sets: 8, reps: '20s iş / 10s dinl.', rest: '-' },
          { name: 'Triceps Dip', sets: 3, reps: '12-15', rest: '30s' },
        ],
      },
      {
        day: 'Salı', focus: 'Alt Vücut HIIT + Güç', emoji: '🦵',
        image: '/images/workouts/legs.png',
        exercises: [
          { name: 'Barbell Squat', sets: 4, reps: '10', rest: '60s' },
          { name: 'Jump Squat', sets: 3, reps: '12', rest: '30s' },
          { name: 'Walking Dumbbell Lunge', sets: 3, reps: '12/bacak', rest: '45s' },
          { name: 'Kettlebell Swing', sets: 4, reps: '20', rest: '30s' },
          { name: 'Box Jump', sets: 3, reps: '10', rest: '30s' },
          { name: 'Sprint İntervalleri (Koşu Bandı)', sets: 8, reps: '30s sprint / 30s yürü', rest: '-' },
        ],
      },
      {
        day: 'Çarşamba', focus: 'Dinlenme / Aktif Toparlanma', emoji: '🧘',
        exercises: [
          { name: 'Hafif Tempo Yürüyüş', sets: 1, reps: '40 dk', rest: '-' },
          { name: 'Yoga / Esneme', sets: 1, reps: '20 dk', rest: '-' },
        ],
      },
      {
        day: 'Perşembe', focus: 'Full Body Metabolik', emoji: '⚡',
        image: '/images/workouts/shoulders.png',
        exercises: [
          { name: 'Clean & Press', sets: 4, reps: '8', rest: '60s' },
          { name: 'Devil Press', sets: 3, reps: '10', rest: '45s' },
          { name: 'Burpee to Pull-Up', sets: 3, reps: '8', rest: '45s' },
          { name: 'Sled Push', sets: 4, reps: '20m', rest: '60s' },
          { name: 'Hanging Leg Raise', sets: 3, reps: '15', rest: '30s' },
        ],
      },
      {
        day: 'Cuma', focus: 'Push-Pull Kardiyo', emoji: '💪',
        image: '/images/workouts/back.png',
        exercises: [
          { name: 'Bench Press (Tempo: 3-0-1)', sets: 3, reps: '12', rest: '45s' },
          { name: 'Barbell Row (Tempo: 3-0-1)', sets: 3, reps: '12', rest: '45s' },
          { name: 'Dumbbell Shoulder Press', sets: 3, reps: '12', rest: '30s' },
          { name: 'Cable Row', sets: 3, reps: '15', rest: '30s' },
          { name: 'Assault Bike Intervals', sets: 6, reps: '30s max / 30s yavaş', rest: '-' },
        ],
      },
      {
        day: 'Cumartesi', focus: 'HIIT Kardiyo Finisher', emoji: '🎯',
        image: '/images/workouts/chest.png',
        exercises: [
          { name: 'Rowing Machine (500m x 4)', sets: 4, reps: '500m', rest: '90s' },
          { name: 'Burpee Broad Jump', sets: 3, reps: '10', rest: '30s' },
          { name: 'Medicine Ball Slam', sets: 3, reps: '15', rest: '30s' },
          { name: 'Ski Erg Intervals', sets: 5, reps: '200m', rest: '45s' },
          { name: 'Plank Variations', sets: 3, reps: '45s', rest: '15s' },
        ],
      },
      {
        day: 'Pazar', focus: 'Tam Dinlenme', emoji: '😴',
        exercises: [{ name: 'Tam Dinlenme', sets: '-', reps: '-', rest: '-' }],
      },
    ],

    // ─── Phase 2 — Circuit Training (Devre Antrenmanı) ────
    [
      {
        day: 'Pazartesi', focus: 'Üst Vücut Circuit', emoji: '🔥',
        image: '/images/workouts/chest.png',
        exercises: [
          { name: 'Devre (3 tur) — Push-Up', sets: 3, reps: '15', rest: '0s' },
          { name: 'Devre — Dumbbell Row', sets: 3, reps: '12', rest: '0s' },
          { name: 'Devre — Shoulder Press', sets: 3, reps: '12', rest: '0s' },
          { name: 'Devre — Bicep Curl', sets: 3, reps: '15', rest: '0s' },
          { name: 'Devre — Triceps Dip', sets: 3, reps: '12', rest: '0s' },
          { name: '↻ Turlar arası dinlenme: 90s', sets: '-', reps: '-', rest: '90s' },
        ],
      },
      {
        day: 'Salı', focus: 'Alt Vücut Circuit', emoji: '🦵',
        image: '/images/workouts/legs.png',
        exercises: [
          { name: 'Devre (3 tur) — Squat', sets: 3, reps: '15', rest: '0s' },
          { name: 'Devre — Lunge', sets: 3, reps: '12/bacak', rest: '0s' },
          { name: 'Devre — Romanian Deadlift', sets: 3, reps: '12', rest: '0s' },
          { name: 'Devre — Calf Raise', sets: 3, reps: '20', rest: '0s' },
          { name: 'Devre — Glute Bridge', sets: 3, reps: '15', rest: '0s' },
          { name: '↻ Turlar arası dinlenme: 90s', sets: '-', reps: '-', rest: '90s' },
        ],
      },
      {
        day: 'Çarşamba', focus: 'Dinlenme / Aktif Toparlanma', emoji: '🧘',
        exercises: [
          { name: 'Hafif Yüzme veya Bisiklet', sets: 1, reps: '30 dk', rest: '-' },
          { name: 'Stretching Routine', sets: 1, reps: '15 dk', rest: '-' },
        ],
      },
      {
        day: 'Perşembe', focus: 'Full Body Circuit', emoji: '⚡',
        image: '/images/workouts/shoulders.png',
        exercises: [
          { name: 'Devre (4 tur) — Thruster', sets: 4, reps: '10', rest: '0s' },
          { name: 'Devre — Pull-Up / Assisted', sets: 4, reps: '8', rest: '0s' },
          { name: 'Devre — Kettlebell Swing', sets: 4, reps: '15', rest: '0s' },
          { name: 'Devre — Mountain Climber', sets: 4, reps: '30s', rest: '0s' },
          { name: 'Devre — Plank Hold', sets: 4, reps: '30s', rest: '0s' },
          { name: '↻ Turlar arası dinlenme: 120s', sets: '-', reps: '-', rest: '120s' },
        ],
      },
      {
        day: 'Cuma', focus: 'Kardiyo + Core Circuit', emoji: '💪',
        image: '/images/workouts/back.png',
        exercises: [
          { name: 'Devre (3 tur) — Burpee', sets: 3, reps: '10', rest: '0s' },
          { name: 'Devre — Russian Twist', sets: 3, reps: '20', rest: '0s' },
          { name: 'Devre — Jump Rope', sets: 3, reps: '60s', rest: '0s' },
          { name: 'Devre — V-Up', sets: 3, reps: '12', rest: '0s' },
          { name: 'Devre — Bear Crawl', sets: 3, reps: '20m', rest: '0s' },
          { name: '↻ Turlar arası dinlenme: 90s', sets: '-', reps: '-', rest: '90s' },
        ],
      },
      {
        day: 'Cumartesi', focus: 'AMRAP Challenge', emoji: '🎯',
        image: '/images/workouts/chest.png',
        exercises: [
          { name: 'AMRAP 20dk — Wall Ball (9kg)', sets: 1, reps: '15/tur', rest: '-' },
          { name: 'AMRAP — Box Jump', sets: 1, reps: '10/tur', rest: '-' },
          { name: 'AMRAP — Ring Row / TRX Row', sets: 1, reps: '12/tur', rest: '-' },
          { name: 'AMRAP — Dumbbell Snatch', sets: 1, reps: '8/kol', rest: '-' },
          { name: 'AMRAP — Sit-Up', sets: 1, reps: '15/tur', rest: '-' },
          { name: '📝 Toplam tur sayısını kaydet!', sets: '-', reps: '-', rest: '-' },
        ],
      },
      {
        day: 'Pazar', focus: 'Tam Dinlenme', emoji: '😴',
        exercises: [{ name: 'Tam Dinlenme', sets: '-', reps: '-', rest: '-' }],
      },
    ],

    // ─── Phase 3 — Hybrid Peak (Her Şey Bir Arada) ────────
    [
      {
        day: 'Pazartesi', focus: 'Güç + Kardiyo — Üst', emoji: '🏆',
        image: '/images/workouts/chest.png',
        exercises: [
          { name: 'Bench Press', sets: 4, reps: '8', rest: '60s' },
          { name: '→ ardından Assault Bike Sprint', sets: 4, reps: '30s', rest: '30s' },
          { name: 'Weighted Pull-Up', sets: 4, reps: '6-8', rest: '60s' },
          { name: '→ ardından Rowing Sprint', sets: 4, reps: '200m', rest: '30s' },
          { name: 'Süperset: OHP + Lateral Raise', sets: 3, reps: '8 + 15', rest: '45s' },
          { name: 'Finisher: 100 Push-Up Challenge (min sürede)', sets: 1, reps: '100', rest: '-' },
        ],
      },
      {
        day: 'Salı', focus: 'Güç + Kardiyo — Alt', emoji: '🏆',
        image: '/images/workouts/legs.png',
        exercises: [
          { name: 'Back Squat', sets: 4, reps: '8', rest: '75s' },
          { name: '→ ardından Box Jump', sets: 4, reps: '8', rest: '30s' },
          { name: 'Romanian Deadlift', sets: 4, reps: '10', rest: '60s' },
          { name: '→ ardından Kettlebell Swing', sets: 4, reps: '15', rest: '30s' },
          { name: 'Süperset: Leg Press + Jump Squat', sets: 3, reps: '12 + 8', rest: '60s' },
          { name: 'Finisher: Sled Push + Farmer Walk', sets: 3, reps: '30m + 40m', rest: '90s' },
        ],
      },
      {
        day: 'Çarşamba', focus: 'Dinlenme / Aktif Toparlanma', emoji: '🧘',
        exercises: [
          { name: 'Hafif Yüzme', sets: 1, reps: '20 dk', rest: '-' },
          { name: 'Mobilite Çalışması', sets: 1, reps: '20 dk', rest: '-' },
          { name: 'Soğuk / Sıcak Kontrast', sets: 1, reps: '10 dk', rest: '-' },
        ],
      },
      {
        day: 'Perşembe', focus: 'Metabolik Devre + Core', emoji: '⚡',
        image: '/images/workouts/shoulders.png',
        exercises: [
          { name: 'EMOM 16dk (4 tur) — Clean & Press x5', sets: 4, reps: '5', rest: '-' },
          { name: 'EMOM — Devil Press x5', sets: 4, reps: '5', rest: '-' },
          { name: 'EMOM — Burpee x8', sets: 4, reps: '8', rest: '-' },
          { name: 'EMOM — Toes to Bar x10', sets: 4, reps: '10', rest: '-' },
          { name: 'Finisher: Plank Ladder (30s→45s→60s→45s→30s)', sets: 5, reps: 'artan', rest: '15s' },
        ],
      },
      {
        day: 'Cuma', focus: 'Full Body Hybrid', emoji: '💪',
        image: '/images/workouts/back.png',
        exercises: [
          { name: 'Süperset: Front Squat + Chin-Up', sets: 4, reps: '8 + 8', rest: '75s' },
          { name: 'Süperset: DB Bench Press + Pendlay Row', sets: 4, reps: '10 + 10', rest: '60s' },
          { name: 'Tabata: Battle Ropes (4dk)', sets: 8, reps: '20s iş / 10s dinl.', rest: '-' },
          { name: 'Süperset: Turkish Get-Up + Ab Wheel', sets: 3, reps: '3/taraf + 10', rest: '60s' },
          { name: 'Finisher: 2000m Row (zaman tut)', sets: 1, reps: '2000m', rest: '-' },
        ],
      },
      {
        day: 'Cumartesi', focus: 'Conditioning Testi', emoji: '🎯',
        image: '/images/workouts/chest.png',
        exercises: [
          { name: '"Filthy Fifty" WOD (modifiye):', sets: '-', reps: '-', rest: '-' },
          { name: 'Box Jump x30', sets: 1, reps: '30', rest: '-' },
          { name: 'Push-Up x30', sets: 1, reps: '30', rest: '-' },
          { name: 'Kettlebell Swing x30', sets: 1, reps: '30', rest: '-' },
          { name: 'Walking Lunge x30', sets: 1, reps: '30', rest: '-' },
          { name: 'Burpee x20', sets: 1, reps: '20', rest: '-' },
          { name: '📝 Toplam süreyi kaydet — her hafta kıyasla!', sets: '-', reps: '-', rest: '-' },
        ],
      },
      {
        day: 'Pazar', focus: 'Tam Dinlenme', emoji: '😴',
        exercises: [{ name: 'Tam Dinlenme', sets: '-', reps: '-', rest: '-' }],
      },
    ],
  ],

  // ═══════════════════════════════════════════════════════════
  // MEDİTASYON — 4 Faz
  // ═══════════════════════════════════════════════════════════
  meditation: [
    // ─── Phase 0 — Temel: Nefes & Farkındalık ──────────────
    [
      { day: 'Pazartesi', focus: 'Nefes Meditasyonu', emoji: '🧘', exercises: [
        { name: 'Derin Nefes (4-7-8 Tekniği)', sets: 3, reps: '5 dk', rest: '30s' },
        { name: 'Karın Nefesi', sets: 3, reps: '5 dk', rest: '30s' },
        { name: 'Mindfulness Oturma', sets: 1, reps: '10 dk', rest: '-' },
      ] },
      { day: 'Salı', focus: 'Vücut Tarama', emoji: '✨', exercises: [
        { name: 'Body Scan Meditation', sets: 1, reps: '15 dk', rest: '-' },
        { name: 'Progresif Kas Gevşetme', sets: 1, reps: '10 dk', rest: '-' },
      ] },
      { day: 'Çarşamba', focus: 'Farkındalık', emoji: '🌿', exercises: [
        { name: 'Yürüyüş Meditasyonu', sets: 1, reps: '20 dk', rest: '-' },
        { name: 'Mindful Eating Pratiği', sets: 1, reps: '15 dk', rest: '-' },
      ] },
      { day: 'Perşembe', focus: 'Dinlenme', emoji: '😴', exercises: [{ name: 'Serbest Gün', sets: '-', reps: '-', rest: '-' }] },
      { day: 'Cuma', focus: 'Mantra Meditasyon', emoji: '🕉️', exercises: [
        { name: 'Om Chanting', sets: 3, reps: '5 dk', rest: '30s' },
        { name: 'Mantra Tekrarı', sets: 1, reps: '15 dk', rest: '-' },
        { name: 'Sessizlik Meditasyonu', sets: 1, reps: '10 dk', rest: '-' },
      ] },
      { day: 'Cumartesi', focus: 'Görselleştirme', emoji: '🌈', exercises: [
        { name: 'Guided Visualization', sets: 1, reps: '20 dk', rest: '-' },
        { name: 'Şükran Meditasyonu', sets: 1, reps: '10 dk', rest: '-' },
      ] },
      { day: 'Pazar', focus: 'Dinlenme', emoji: '😴', exercises: [{ name: 'Serbest Gün', sets: '-', reps: '-', rest: '-' }] },
    ],
    // ─── Phase 1 — Orta: Loving-Kindness & Chakra ──────────
    [
      { day: 'Pazartesi', focus: 'Metta (Sevgi-Şefkat)', emoji: '💗', exercises: [
        { name: 'Loving-Kindness Meditasyon', sets: 1, reps: '20 dk', rest: '-' },
        { name: 'Şefkat Nefesi', sets: 3, reps: '5 dk', rest: '30s' },
        { name: 'Kendini Bağışlama Pratiği', sets: 1, reps: '10 dk', rest: '-' },
      ] },
      { day: 'Salı', focus: 'Chakra Dengeleme', emoji: '🔮', exercises: [
        { name: 'Root Chakra Meditasyon', sets: 1, reps: '10 dk', rest: '-' },
        { name: 'Heart Chakra Açılım', sets: 1, reps: '10 dk', rest: '-' },
        { name: 'Third Eye Odaklanma', sets: 1, reps: '10 dk', rest: '-' },
      ] },
      { day: 'Çarşamba', focus: 'Nefes Teknikleri', emoji: '🌬️', exercises: [
        { name: 'Alternate Nostril (Nadi Shodhana)', sets: 5, reps: '3 dk', rest: '15s' },
        { name: 'Kapalabhati Pranayama', sets: 3, reps: '30 nefes', rest: '30s' },
        { name: 'Ujjayi Nefes', sets: 1, reps: '10 dk', rest: '-' },
      ] },
      { day: 'Perşembe', focus: 'Dinlenme', emoji: '😴', exercises: [{ name: 'Serbest Gün', sets: '-', reps: '-', rest: '-' }] },
      { day: 'Cuma', focus: 'Derinleşen Farkındalık', emoji: '🧠', exercises: [
        { name: 'Open Awareness Meditation', sets: 1, reps: '20 dk', rest: '-' },
        { name: 'Non-Judgmental Observation', sets: 1, reps: '15 dk', rest: '-' },
      ] },
      { day: 'Cumartesi', focus: 'Ses & Titreşim', emoji: '🎵', exercises: [
        { name: 'Singing Bowl Meditasyon', sets: 1, reps: '15 dk', rest: '-' },
        { name: 'Binaural Beats Dinleme', sets: 1, reps: '20 dk', rest: '-' },
      ] },
      { day: 'Pazar', focus: 'Dinlenme', emoji: '😴', exercises: [{ name: 'Serbest Gün', sets: '-', reps: '-', rest: '-' }] },
    ],
    // ─── Phase 2 — İleri: Zen, Vipassana ───────────────────
    [
      { day: 'Pazartesi', focus: 'Vipassana Insight', emoji: '👁️', exercises: [
        { name: 'Anicca (Geçicilik) Meditasyonu', sets: 1, reps: '25 dk', rest: '-' },
        { name: 'Vedana (His) Gözlemi', sets: 1, reps: '15 dk', rest: '-' },
      ] },
      { day: 'Salı', focus: 'Zen Zazen', emoji: '⛩️', exercises: [
        { name: 'Shikantaza (Sadece Oturma)', sets: 1, reps: '30 dk', rest: '-' },
        { name: 'Kinhin (Yürüyüş Zen)', sets: 1, reps: '15 dk', rest: '-' },
      ] },
      { day: 'Çarşamba', focus: 'İleri Pranayama', emoji: '🌬️', exercises: [
        { name: 'Bhramari (Arı Nefesi)', sets: 5, reps: '3 dk', rest: '15s' },
        { name: 'Sitali (Soğutucu Nefes)', sets: 3, reps: '3 dk', rest: '15s' },
        { name: 'Wim Hof Nefes Tekniği', sets: 3, reps: '30 nefes + tutma', rest: '60s' },
      ] },
      { day: 'Perşembe', focus: 'Dinlenme', emoji: '😴', exercises: [{ name: 'Serbest Gün', sets: '-', reps: '-', rest: '-' }] },
      { day: 'Cuma', focus: 'Yoga Nidra', emoji: '🌙', exercises: [
        { name: 'Yoga Nidra (Bilinçli Uyku)', sets: 1, reps: '40 dk', rest: '-' },
      ] },
      { day: 'Cumartesi', focus: 'Kozmik Meditasyon', emoji: '🌌', exercises: [
        { name: 'Tonglen (Alma-Verme)', sets: 1, reps: '20 dk', rest: '-' },
        { name: 'Boşluk Meditasyonu', sets: 1, reps: '20 dk', rest: '-' },
      ] },
      { day: 'Pazar', focus: 'Dinlenme', emoji: '😴', exercises: [{ name: 'Serbest Gün', sets: '-', reps: '-', rest: '-' }] },
    ],
    // ─── Phase 3 — Usta: Uzun Oturumlar, Retreat ──────────
    [
      { day: 'Pazartesi', focus: 'Derin Oturum', emoji: '🏔️', exercises: [
        { name: 'Sessiz Oturum (Vipassana Tarzı)', sets: 1, reps: '45 dk', rest: '-' },
        { name: 'Walking Meditation', sets: 1, reps: '15 dk', rest: '-' },
      ] },
      { day: 'Salı', focus: 'Transandantal', emoji: '🌀', exercises: [
        { name: 'TM Tekniği (Mantra Tabanlı)', sets: 2, reps: '20 dk', rest: '5 dk' },
        { name: 'Sessizlik Taahhüdü', sets: 1, reps: '60 dk', rest: '-' },
      ] },
      { day: 'Çarşamba', focus: 'Bütünleşik Pratik', emoji: '🌟', exercises: [
        { name: 'Pranayama → Meditasyon → Yoga Nidra', sets: 1, reps: '60 dk', rest: '-' },
      ] },
      { day: 'Perşembe', focus: 'Dinlenme', emoji: '😴', exercises: [{ name: 'Serbest Gün', sets: '-', reps: '-', rest: '-' }] },
      { day: 'Cuma', focus: 'Koan / Sorgulama', emoji: '❓', exercises: [
        { name: 'Zen Koan Meditasyonu', sets: 1, reps: '30 dk', rest: '-' },
        { name: 'Self-Inquiry (Ben Kimim?)', sets: 1, reps: '20 dk', rest: '-' },
      ] },
      { day: 'Cumartesi', focus: 'Mini Retreat', emoji: '🏕️', exercises: [
        { name: 'Sabah: Sessiz Oturum', sets: 1, reps: '30 dk', rest: '-' },
        { name: 'Öğle: Mindful Yemek + Yürüyüş', sets: 1, reps: '45 dk', rest: '-' },
        { name: 'Akşam: Metta + Yoga Nidra', sets: 1, reps: '45 dk', rest: '-' },
      ] },
      { day: 'Pazar', focus: 'Dinlenme', emoji: '😴', exercises: [{ name: 'Serbest Gün', sets: '-', reps: '-', rest: '-' }] },
    ],
  ],

  // ═══════════════════════════════════════════════════════════
  // YOGA — 4 Faz
  // ═══════════════════════════════════════════════════════════
  yoga: [
    // ─── Phase 0 — Temel: Asana Temelleri ──────────────────
    [
      { day: 'Pazartesi', focus: 'Güneşe Selam & Temel', emoji: '☀️', exercises: [
        { name: 'Surya Namaskar A', sets: 5, reps: '1 akış', rest: '30s' },
        { name: 'Warrior I (Virabhadrasana I)', sets: 2, reps: '30s/taraf', rest: '15s' },
        { name: 'Warrior II', sets: 2, reps: '30s/taraf', rest: '15s' },
        { name: 'Tree Pose (Vrksasana)', sets: 2, reps: '30s/taraf', rest: '15s' },
        { name: 'Downward Dog', sets: 3, reps: '45s', rest: '15s' },
        { name: 'Savasana', sets: 1, reps: '5 dk', rest: '-' },
      ] },
      { day: 'Salı', focus: 'Esneklik & Açıcılar', emoji: '🌊', exercises: [
        { name: 'Cat-Cow Stretch', sets: 3, reps: '10 tekrar', rest: '15s' },
        { name: 'Pigeon Pose', sets: 2, reps: '1 dk/taraf', rest: '15s' },
        { name: 'Seated Forward Fold', sets: 3, reps: '45s', rest: '15s' },
        { name: 'Supine Twist', sets: 2, reps: '30s/taraf', rest: '15s' },
        { name: 'Happy Baby', sets: 2, reps: '45s', rest: '15s' },
      ] },
      { day: 'Çarşamba', focus: 'Dinlenme', emoji: '😴', exercises: [{ name: 'Tam Dinlenme', sets: '-', reps: '-', rest: '-' }] },
      { day: 'Perşembe', focus: 'Güç Yogası', emoji: '💪', exercises: [
        { name: 'Chair Pose (Utkatasana)', sets: 3, reps: '30s', rest: '15s' },
        { name: 'Plank Pose', sets: 3, reps: '30s', rest: '15s' },
        { name: 'Chaturanga', sets: 3, reps: '8', rest: '30s' },
        { name: 'Boat Pose (Navasana)', sets: 3, reps: '30s', rest: '15s' },
        { name: 'Crow Pose Prep', sets: 3, reps: '15s', rest: '30s' },
      ] },
      { day: 'Cuma', focus: 'Restoratif Yoga', emoji: '🌸', exercises: [
        { name: 'Child Pose (Balasana)', sets: 3, reps: '1 dk', rest: '15s' },
        { name: 'Legs Up The Wall', sets: 1, reps: '5 dk', rest: '-' },
        { name: 'Supported Bridge', sets: 2, reps: '2 dk', rest: '30s' },
        { name: 'Reclining Butterfly', sets: 1, reps: '3 dk', rest: '-' },
      ] },
      { day: 'Cumartesi', focus: 'Vinyasa Akış', emoji: '🔥', exercises: [
        { name: 'Surya Namaskar B', sets: 5, reps: '1 akış', rest: '30s' },
        { name: 'Warrior III', sets: 2, reps: '30s/taraf', rest: '15s' },
        { name: 'Half Moon', sets: 2, reps: '30s/taraf', rest: '15s' },
        { name: 'Triangle Pose', sets: 2, reps: '30s/taraf', rest: '15s' },
        { name: 'Standing Split', sets: 2, reps: '20s/taraf', rest: '15s' },
      ] },
      { day: 'Pazar', focus: 'Dinlenme', emoji: '😴', exercises: [{ name: 'Tam Dinlenme', sets: '-', reps: '-', rest: '-' }] },
    ],
    // ─── Phase 1 — Orta: Kol Dengeleri & İnversiyon Hazırlık
    [
      { day: 'Pazartesi', focus: 'Kol Dengeleri', emoji: '🤸', exercises: [
        { name: 'Crow Pose (Bakasana)', sets: 5, reps: '15s', rest: '30s' },
        { name: 'Side Crow Prep', sets: 3, reps: '10s/taraf', rest: '30s' },
        { name: 'Firefly Pose Prep', sets: 3, reps: '10s', rest: '30s' },
        { name: 'Eight Angle Pose Prep', sets: 3, reps: '10s/taraf', rest: '30s' },
      ] },
      { day: 'Salı', focus: 'Derin Esneklik', emoji: '🧘', exercises: [
        { name: 'Yin Yoga — Dragon Pose', sets: 2, reps: '3 dk/taraf', rest: '15s' },
        { name: 'Yin Yoga — Butterfly', sets: 1, reps: '5 dk', rest: '-' },
        { name: 'Yin Yoga — Seal', sets: 1, reps: '5 dk', rest: '-' },
        { name: 'Yin Yoga — Twisted Root', sets: 2, reps: '3 dk/taraf', rest: '15s' },
      ] },
      { day: 'Çarşamba', focus: 'Dinlenme', emoji: '😴', exercises: [{ name: 'Tam Dinlenme', sets: '-', reps: '-', rest: '-' }] },
      { day: 'Perşembe', focus: 'İnversiyon Hazırlık', emoji: '🙃', exercises: [
        { name: 'Dolphin Pose', sets: 5, reps: '30s', rest: '30s' },
        { name: 'Forearm Stand — Duvarda', sets: 5, reps: '20s', rest: '45s' },
        { name: 'Headstand Prep (Sirsasana)', sets: 3, reps: '15s', rest: '45s' },
        { name: 'Shoulder Stand (Sarvangasana)', sets: 3, reps: '30s', rest: '30s' },
      ] },
      { day: 'Cuma', focus: 'Power Vinyasa', emoji: '⚡', exercises: [
        { name: 'Sun Salutation C', sets: 5, reps: '1 akış', rest: '20s' },
        { name: 'Extended Side Angle', sets: 2, reps: '30s/taraf', rest: '15s' },
        { name: 'Revolved Triangle', sets: 2, reps: '30s/taraf', rest: '15s' },
        { name: 'Dancer Pose (Natarajasana)', sets: 2, reps: '20s/taraf', rest: '15s' },
        { name: 'Eagle Pose', sets: 2, reps: '30s/taraf', rest: '15s' },
      ] },
      { day: 'Cumartesi', focus: 'Pranayama & Meditasyon', emoji: '🌬️', exercises: [
        { name: 'Nadi Shodhana', sets: 5, reps: '3 dk', rest: '15s' },
        { name: 'Kapalabhati', sets: 3, reps: '30 nefes', rest: '30s' },
        { name: 'Seated Meditation', sets: 1, reps: '15 dk', rest: '-' },
      ] },
      { day: 'Pazar', focus: 'Dinlenme', emoji: '😴', exercises: [{ name: 'Tam Dinlenme', sets: '-', reps: '-', rest: '-' }] },
    ],
    // ─── Phase 2 — İleri: İnversiyonlar & Derin Backbend ───
    [
      { day: 'Pazartesi', focus: 'Headstand & Handstand', emoji: '🤸', exercises: [
        { name: 'Sirsasana (Headstand)', sets: 3, reps: '1 dk', rest: '60s' },
        { name: 'Pincha Mayurasana (Forearm Stand)', sets: 5, reps: '20s', rest: '60s' },
        { name: 'Handstand — Kick-Up', sets: 5, reps: '10s', rest: '60s' },
        { name: 'Scorpion Pose Prep', sets: 3, reps: '10s', rest: '60s' },
      ] },
      { day: 'Salı', focus: 'Derin Backbend', emoji: '🌉', exercises: [
        { name: 'Wheel Pose (Urdhva Dhanurasana)', sets: 3, reps: '30s', rest: '45s' },
        { name: 'King Pigeon (Eka Pada)', sets: 2, reps: '30s/taraf', rest: '30s' },
        { name: 'Camel Pose (Ustrasana)', sets: 3, reps: '30s', rest: '30s' },
        { name: 'Bow Pose (Dhanurasana)', sets: 3, reps: '30s', rest: '30s' },
      ] },
      { day: 'Çarşamba', focus: 'Dinlenme', emoji: '😴', exercises: [{ name: 'Tam Dinlenme', sets: '-', reps: '-', rest: '-' }] },
      { day: 'Perşembe', focus: 'Arm Balance Master', emoji: '💪', exercises: [
        { name: 'Flying Crow', sets: 5, reps: '10s', rest: '45s' },
        { name: 'Astavakrasana (Eight Angle)', sets: 3, reps: '15s/taraf', rest: '45s' },
        { name: 'Firefly (Tittibhasana)', sets: 3, reps: '15s', rest: '45s' },
        { name: 'Side Crow', sets: 3, reps: '15s/taraf', rest: '45s' },
      ] },
      { day: 'Cuma', focus: 'Ashtanga Primary', emoji: '🔥', exercises: [
        { name: 'Ashtanga Primary Series (Kısa)', sets: 1, reps: '60 dk', rest: '-' },
      ] },
      { day: 'Cumartesi', focus: 'Yin & Restore', emoji: '🌸', exercises: [
        { name: 'Yin — Saddle', sets: 1, reps: '5 dk', rest: '-' },
        { name: 'Yin — Caterpillar', sets: 1, reps: '5 dk', rest: '-' },
        { name: 'Yin — Sphinx', sets: 1, reps: '5 dk', rest: '-' },
        { name: 'Yoga Nidra', sets: 1, reps: '20 dk', rest: '-' },
      ] },
      { day: 'Pazar', focus: 'Dinlenme', emoji: '😴', exercises: [{ name: 'Tam Dinlenme', sets: '-', reps: '-', rest: '-' }] },
    ],
    // ─── Phase 3 — Usta: Kompleks Diziler & Pranayama ──────
    [
      { day: 'Pazartesi', focus: 'Full Ashtanga', emoji: '🏆', exercises: [
        { name: 'Ashtanga Primary + Intermediate', sets: 1, reps: '90 dk', rest: '-' },
      ] },
      { day: 'Salı', focus: 'İleri İnversiyon', emoji: '🤸', exercises: [
        { name: 'Free Handstand', sets: 5, reps: '30s', rest: '60s' },
        { name: 'Scorpion Pose', sets: 3, reps: '15s', rest: '60s' },
        { name: 'Peacock Pose (Mayurasana)', sets: 3, reps: '15s', rest: '45s' },
        { name: 'Flying Pigeon', sets: 3, reps: '10s/taraf', rest: '45s' },
      ] },
      { day: 'Çarşamba', focus: 'Dinlenme', emoji: '😴', exercises: [{ name: 'Tam Dinlenme', sets: '-', reps: '-', rest: '-' }] },
      { day: 'Perşembe', focus: 'İleri Pranayama', emoji: '🌬️', exercises: [
        { name: 'Kumbhaka (Nefes Tutma)', sets: 5, reps: '3 dk', rest: '30s' },
        { name: 'Surya Bhedana', sets: 3, reps: '5 dk', rest: '15s' },
        { name: 'Bandha Çalışması (Mula, Uddiyana)', sets: 3, reps: '3 dk', rest: '15s' },
        { name: 'Meditasyon Oturumu', sets: 1, reps: '30 dk', rest: '-' },
      ] },
      { day: 'Cuma', focus: 'Yaratıcı Akış', emoji: '🎨', exercises: [
        { name: 'Serbest Vinyasa Flow', sets: 1, reps: '45 dk', rest: '-' },
        { name: 'Handstand Geçişler', sets: 5, reps: '3 geçiş', rest: '45s' },
      ] },
      { day: 'Cumartesi', focus: 'Restore & Reflect', emoji: '🌸', exercises: [
        { name: 'Yin Yoga Derin Seri', sets: 1, reps: '45 dk', rest: '-' },
        { name: 'Yoga Nidra', sets: 1, reps: '30 dk', rest: '-' },
      ] },
      { day: 'Pazar', focus: 'Dinlenme', emoji: '😴', exercises: [{ name: 'Tam Dinlenme', sets: '-', reps: '-', rest: '-' }] },
    ],
  ],

  // ═══════════════════════════════════════════════════════════
  // PİLATES — 4 Faz (Mat)
  // ═══════════════════════════════════════════════════════════
  pilates: [
    // ─── Phase 0 — Temel: Mat Pilates Başlangıç ───────────
    [
      { day: 'Pazartesi', focus: 'Core & Temel', emoji: '🎯', exercises: [
        { name: 'The Hundred', sets: 3, reps: '10 nefes', rest: '30s' },
        { name: 'Roll Up', sets: 3, reps: '8', rest: '30s' },
        { name: 'Single Leg Circle', sets: 2, reps: '8/taraf', rest: '15s' },
        { name: 'Rolling Like a Ball', sets: 3, reps: '10', rest: '15s' },
        { name: 'Single Leg Stretch', sets: 3, reps: '10/taraf', rest: '15s' },
      ] },
      { day: 'Salı', focus: 'Alt Vücut', emoji: '🦵', exercises: [
        { name: 'Pelvic Curl', sets: 3, reps: '10', rest: '30s' },
        { name: 'Side Leg Lift Series', sets: 3, reps: '12/taraf', rest: '15s' },
        { name: 'Clam Shell', sets: 3, reps: '15/taraf', rest: '15s' },
        { name: 'Inner Thigh Lift', sets: 3, reps: '12/taraf', rest: '15s' },
        { name: 'Bridge Variations', sets: 3, reps: '10', rest: '30s' },
      ] },
      { day: 'Çarşamba', focus: 'Dinlenme', emoji: '😴', exercises: [{ name: 'Tam Dinlenme', sets: '-', reps: '-', rest: '-' }] },
      { day: 'Perşembe', focus: 'Üst Vücut & Sırt', emoji: '💪', exercises: [
        { name: 'Swimming', sets: 3, reps: '10 nefes', rest: '30s' },
        { name: 'Swan Dive Prep', sets: 3, reps: '8', rest: '30s' },
        { name: 'Arm Circles (Hafif Ağırlık)', sets: 3, reps: '12', rest: '15s' },
        { name: 'Push-Up (Pilates)', sets: 3, reps: '8', rest: '30s' },
        { name: 'Back Extension', sets: 3, reps: '10', rest: '30s' },
      ] },
      { day: 'Cuma', focus: 'Tam Vücut Akış', emoji: '⚡', exercises: [
        { name: 'Teaser Prep', sets: 3, reps: '8', rest: '30s' },
        { name: 'Criss Cross', sets: 3, reps: '10/taraf', rest: '15s' },
        { name: 'Double Leg Stretch', sets: 3, reps: '10', rest: '30s' },
        { name: 'Spine Stretch Forward', sets: 3, reps: '8', rest: '15s' },
        { name: 'Saw', sets: 3, reps: '8/taraf', rest: '15s' },
      ] },
      { day: 'Cumartesi', focus: 'Esneklik & Toparlanma', emoji: '🌸', exercises: [
        { name: 'Mermaid Stretch', sets: 2, reps: '30s/taraf', rest: '15s' },
        { name: 'Spine Twist', sets: 2, reps: '8/taraf', rest: '15s' },
        { name: 'Foam Roller Sırt', sets: 1, reps: '5 dk', rest: '-' },
        { name: 'Hip Flexor Stretch', sets: 2, reps: '30s/taraf', rest: '15s' },
      ] },
      { day: 'Pazar', focus: 'Dinlenme', emoji: '😴', exercises: [{ name: 'Tam Dinlenme', sets: '-', reps: '-', rest: '-' }] },
    ],
    // ─── Phase 1 — Orta: Zorlayıcı Mat ────────────────────
    [
      { day: 'Pazartesi', focus: 'İleri Core', emoji: '🎯', exercises: [
        { name: 'Teaser (Full)', sets: 3, reps: '8', rest: '30s' },
        { name: 'Jackknife', sets: 3, reps: '6', rest: '30s' },
        { name: 'Hip Circles', sets: 3, reps: '6/yön', rest: '15s' },
        { name: 'Corkscrew', sets: 3, reps: '6/yön', rest: '15s' },
        { name: 'Neck Pull', sets: 3, reps: '8', rest: '30s' },
      ] },
      { day: 'Salı', focus: 'Lateral & Rotasyon', emoji: '🔄', exercises: [
        { name: 'Side Bend', sets: 3, reps: '8/taraf', rest: '15s' },
        { name: 'Twist (Spine Twist Supine)', sets: 3, reps: '8/taraf', rest: '15s' },
        { name: 'Thread the Needle', sets: 3, reps: '8/taraf', rest: '15s' },
        { name: 'Side Plank Pilates', sets: 3, reps: '20s/taraf', rest: '30s' },
      ] },
      { day: 'Çarşamba', focus: 'Dinlenme', emoji: '😴', exercises: [{ name: 'Tam Dinlenme', sets: '-', reps: '-', rest: '-' }] },
      { day: 'Perşembe', focus: 'Props ile Pilates', emoji: '🏐', exercises: [
        { name: 'Magic Circle — Inner Thigh', sets: 3, reps: '15', rest: '15s' },
        { name: 'Magic Circle — Chest Press', sets: 3, reps: '12', rest: '15s' },
        { name: 'Resistance Band Roll Up', sets: 3, reps: '10', rest: '30s' },
        { name: 'Ball Between Knees Bridge', sets: 3, reps: '12', rest: '30s' },
      ] },
      { day: 'Cuma', focus: 'Tam Vücut Challenge', emoji: '⚡', exercises: [
        { name: 'Control Balance', sets: 3, reps: '6/taraf', rest: '30s' },
        { name: 'Boomerang', sets: 3, reps: '6', rest: '30s' },
        { name: 'Seal', sets: 3, reps: '10', rest: '15s' },
        { name: 'Rocker with Open Legs', sets: 3, reps: '8', rest: '30s' },
      ] },
      { day: 'Cumartesi', focus: 'Mobility & Stretch', emoji: '🌸', exercises: [
        { name: 'Roll Down (Standing)', sets: 3, reps: '6', rest: '15s' },
        { name: 'Figure 4 Stretch', sets: 2, reps: '1 dk/taraf', rest: '15s' },
        { name: 'Thoracic Spine Rotation', sets: 3, reps: '8/taraf', rest: '15s' },
        { name: 'Neck & Shoulder Release', sets: 1, reps: '5 dk', rest: '-' },
      ] },
      { day: 'Pazar', focus: 'Dinlenme', emoji: '😴', exercises: [{ name: 'Tam Dinlenme', sets: '-', reps: '-', rest: '-' }] },
    ],
    // ─── Phase 2 — İleri: Full Mat Repertoire ──────────────
    [
      { day: 'Pazartesi', focus: 'Klasik Mat Seri', emoji: '🎯', exercises: [
        { name: 'Hundred → Roll Up → Rollover', sets: 1, reps: 'Akış', rest: '-' },
        { name: 'Leg Circle → Rolling → Series of 5', sets: 1, reps: 'Akış', rest: '-' },
        { name: 'Spine Stretch → Open Leg Rocker', sets: 1, reps: 'Akış', rest: '-' },
        { name: 'Corkscrew → Saw → Swan Dive', sets: 1, reps: 'Akış', rest: '-' },
      ] },
      { day: 'Salı', focus: 'Side Kick Serisi', emoji: '🦵', exercises: [
        { name: 'Side Kick Front-Back', sets: 3, reps: '10/taraf', rest: '15s' },
        { name: 'Side Kick Up-Down', sets: 3, reps: '10/taraf', rest: '15s' },
        { name: 'Side Kick Circles', sets: 3, reps: '8/taraf', rest: '15s' },
        { name: 'Inner Thigh Presses', sets: 3, reps: '12/taraf', rest: '15s' },
        { name: 'Hot Potato', sets: 3, reps: '8/taraf', rest: '15s' },
      ] },
      { day: 'Çarşamba', focus: 'Dinlenme', emoji: '😴', exercises: [{ name: 'Tam Dinlenme', sets: '-', reps: '-', rest: '-' }] },
      { day: 'Perşembe', focus: 'İleri Sırt & Extension', emoji: '🌉', exercises: [
        { name: 'Swan Dive (Full)', sets: 3, reps: '6', rest: '45s' },
        { name: 'Swimming (İleri)', sets: 3, reps: '20 nefes', rest: '30s' },
        { name: 'Rocking', sets: 3, reps: '8', rest: '30s' },
        { name: 'Shoulder Bridge', sets: 3, reps: '8/taraf', rest: '30s' },
      ] },
      { day: 'Cuma', focus: 'Inversions & Challenge', emoji: '🤸', exercises: [
        { name: 'Scissors (Üst Pozisyon)', sets: 3, reps: '8/taraf', rest: '30s' },
        { name: 'Bicycle (Üst Pozisyon)', sets: 3, reps: '8/taraf', rest: '30s' },
        { name: 'Jackknife', sets: 3, reps: '6', rest: '45s' },
        { name: 'Teaser 1-2-3', sets: 3, reps: '4', rest: '30s' },
      ] },
      { day: 'Cumartesi', focus: 'Restoratif', emoji: '🌸', exercises: [
        { name: 'Wall Roll Down', sets: 3, reps: '6', rest: '15s' },
        { name: 'Constructive Rest', sets: 1, reps: '10 dk', rest: '-' },
        { name: 'Full Body Stretch Serisi', sets: 1, reps: '10 dk', rest: '-' },
      ] },
      { day: 'Pazar', focus: 'Dinlenme', emoji: '😴', exercises: [{ name: 'Tam Dinlenme', sets: '-', reps: '-', rest: '-' }] },
    ],
    // ─── Phase 3 — Usta: Koreografi & Master Class ─────────
    [
      { day: 'Pazartesi', focus: 'Full Mat (45 dk)', emoji: '🏆', exercises: [
        { name: 'Joseph Pilates Orijinal 34 Hareket', sets: 1, reps: '45 dk akış', rest: '-' },
      ] },
      { day: 'Salı', focus: 'İleri Props', emoji: '🏐', exercises: [
        { name: 'Magic Circle Full Body Serisi', sets: 1, reps: '20 dk', rest: '-' },
        { name: 'Resistance Band Complex', sets: 1, reps: '15 dk', rest: '-' },
        { name: 'Foam Roller Challenge', sets: 1, reps: '15 dk', rest: '-' },
      ] },
      { day: 'Çarşamba', focus: 'Dinlenme', emoji: '😴', exercises: [{ name: 'Tam Dinlenme', sets: '-', reps: '-', rest: '-' }] },
      { day: 'Perşembe', focus: 'Kontrol & Denge', emoji: '⚖️', exercises: [
        { name: 'Star', sets: 3, reps: '15s/taraf', rest: '30s' },
        { name: 'Twist', sets: 3, reps: '8/taraf', rest: '30s' },
        { name: 'Snake/Twist', sets: 3, reps: '6/taraf', rest: '30s' },
        { name: 'Push-Up → Pike → Teaser Geçiş', sets: 3, reps: '4 geçiş', rest: '45s' },
      ] },
      { day: 'Cuma', focus: 'Koreografik Akış', emoji: '💃', exercises: [
        { name: 'Mat Koreografi (Müzikli)', sets: 1, reps: '30 dk', rest: '-' },
        { name: 'Serbest Hareket Çalışması', sets: 1, reps: '15 dk', rest: '-' },
      ] },
      { day: 'Cumartesi', focus: 'Mindful Movement', emoji: '🌸', exercises: [
        { name: 'Pilates + Yoga Fusion', sets: 1, reps: '30 dk', rest: '-' },
        { name: 'Body Awareness Meditasyon', sets: 1, reps: '15 dk', rest: '-' },
      ] },
      { day: 'Pazar', focus: 'Dinlenme', emoji: '😴', exercises: [{ name: 'Tam Dinlenme', sets: '-', reps: '-', rest: '-' }] },
    ],
  ],

  // ═══════════════════════════════════════════════════════════
  // REFORMER — 4 Faz
  // ═══════════════════════════════════════════════════════════
  reformer: [
    // ─── Phase 0 — Temel: Reformer Başlangıç ──────────────
    [
      { day: 'Pazartesi', focus: 'Reformer Temeller', emoji: '🔧', exercises: [
        { name: 'Footwork (Paralel)', sets: 3, reps: '10', rest: '30s' },
        { name: 'Footwork (V Pozisyon)', sets: 3, reps: '10', rest: '30s' },
        { name: 'Leg Circles (Kayışlı)', sets: 3, reps: '8/taraf', rest: '15s' },
        { name: 'Short Spine', sets: 3, reps: '6', rest: '30s' },
        { name: 'Coordination', sets: 3, reps: '8', rest: '30s' },
      ] },
      { day: 'Salı', focus: 'Kol & Omuz', emoji: '💪', exercises: [
        { name: 'Arms Pulling Straps', sets: 3, reps: '10', rest: '30s' },
        { name: 'Arms T-Shape', sets: 3, reps: '10', rest: '30s' },
        { name: 'Bicep Curls (Reformer)', sets: 3, reps: '12', rest: '15s' },
        { name: 'Chest Expansion', sets: 3, reps: '10', rest: '30s' },
        { name: 'Rowing Series', sets: 3, reps: '8', rest: '30s' },
      ] },
      { day: 'Çarşamba', focus: 'Dinlenme', emoji: '😴', exercises: [{ name: 'Tam Dinlenme', sets: '-', reps: '-', rest: '-' }] },
      { day: 'Perşembe', focus: 'Bacak & Kalça', emoji: '🦵', exercises: [
        { name: 'Leg Press (Single Leg)', sets: 3, reps: '10/taraf', rest: '30s' },
        { name: 'Standing Lunge', sets: 3, reps: '10/taraf', rest: '30s' },
        { name: 'Side Splits', sets: 2, reps: '8', rest: '30s' },
        { name: 'Scooter', sets: 3, reps: '10/taraf', rest: '30s' },
        { name: 'Eve\'s Lunge', sets: 2, reps: '8/taraf', rest: '30s' },
      ] },
      { day: 'Cuma', focus: 'Core & Tam Vücut', emoji: '🎯', exercises: [
        { name: 'Long Stretch', sets: 3, reps: '8', rest: '30s' },
        { name: 'Elephant', sets: 3, reps: '10', rest: '30s' },
        { name: 'Stomach Massage Series', sets: 3, reps: '8', rest: '30s' },
        { name: 'Snake/Twist', sets: 2, reps: '6', rest: '30s' },
        { name: 'Control Balance', sets: 2, reps: '6', rest: '30s' },
      ] },
      { day: 'Cumartesi', focus: 'Esneklik', emoji: '🌸', exercises: [
        { name: 'Hip Stretch Series', sets: 2, reps: '30s/taraf', rest: '15s' },
        { name: 'Knee Stretch Series', sets: 3, reps: '10', rest: '30s' },
        { name: 'Hamstring Stretch', sets: 2, reps: '30s/taraf', rest: '15s' },
        { name: 'Mermaid (Reformer)', sets: 2, reps: '6/taraf', rest: '15s' },
      ] },
      { day: 'Pazar', focus: 'Dinlenme', emoji: '😴', exercises: [{ name: 'Tam Dinlenme', sets: '-', reps: '-', rest: '-' }] },
    ],
    // ─── Phase 1 — Orta: Artan Yay & İleri Hareketler ─────
    [
      { day: 'Pazartesi', focus: 'İleri Footwork & Legs', emoji: '🦵', exercises: [
        { name: 'Single Leg Footwork', sets: 3, reps: '10/taraf', rest: '30s' },
        { name: 'Running on Reformer', sets: 3, reps: '20', rest: '30s' },
        { name: 'Leg Circles (Ağır Yay)', sets: 3, reps: '8/taraf', rest: '15s' },
        { name: 'Frog', sets: 3, reps: '10', rest: '15s' },
        { name: 'Long Spine', sets: 3, reps: '6', rest: '45s' },
      ] },
      { day: 'Salı', focus: 'İleri Arms & Back', emoji: '💪', exercises: [
        { name: 'Pulling Straps II', sets: 3, reps: '10', rest: '30s' },
        { name: 'Backstroke', sets: 3, reps: '8', rest: '30s' },
        { name: 'Rowing — Shaving', sets: 3, reps: '10', rest: '15s' },
        { name: 'Rowing — Hug a Tree', sets: 3, reps: '10', rest: '15s' },
        { name: 'Reverse Chest Expansion', sets: 3, reps: '8', rest: '30s' },
      ] },
      { day: 'Çarşamba', focus: 'Dinlenme', emoji: '😴', exercises: [{ name: 'Tam Dinlenme', sets: '-', reps: '-', rest: '-' }] },
      { day: 'Perşembe', focus: 'Box Çalışmaları', emoji: '📦', exercises: [
        { name: 'Short Box — Round Back', sets: 3, reps: '8', rest: '30s' },
        { name: 'Short Box — Flat Back', sets: 3, reps: '8', rest: '30s' },
        { name: 'Short Box — Side Reach', sets: 3, reps: '8/taraf', rest: '15s' },
        { name: 'Short Box — Twist', sets: 3, reps: '8/taraf', rest: '15s' },
        { name: 'Long Box — Pulling Straps', sets: 3, reps: '10', rest: '30s' },
      ] },
      { day: 'Cuma', focus: 'Tam Vücut Flow', emoji: '⚡', exercises: [
        { name: 'Stomach Massage — Round', sets: 3, reps: '8', rest: '15s' },
        { name: 'Stomach Massage — Hands Back', sets: 3, reps: '8', rest: '15s' },
        { name: 'Stomach Massage — Reach', sets: 3, reps: '8', rest: '15s' },
        { name: 'Semi Circle', sets: 3, reps: '6/yön', rest: '30s' },
      ] },
      { day: 'Cumartesi', focus: 'Stretch & Restore', emoji: '🌸', exercises: [
        { name: 'Front Splits', sets: 2, reps: '30s/taraf', rest: '15s' },
        { name: 'Russian Splits', sets: 2, reps: '30s', rest: '30s' },
        { name: 'Mermaid (İleri)', sets: 2, reps: '8/taraf', rest: '15s' },
      ] },
      { day: 'Pazar', focus: 'Dinlenme', emoji: '😴', exercises: [{ name: 'Tam Dinlenme', sets: '-', reps: '-', rest: '-' }] },
    ],
    // ─── Phase 2 — İleri: Jump Board & Full Repertoire ─────
    [
      { day: 'Pazartesi', focus: 'Jump Board Kardiyo', emoji: '🦘', exercises: [
        { name: 'Basic Jumps (Paralel)', sets: 3, reps: '20', rest: '30s' },
        { name: 'Jumps (First Position)', sets: 3, reps: '20', rest: '30s' },
        { name: 'Alternating Jumps', sets: 3, reps: '20', rest: '30s' },
        { name: 'Scissors Jumps', sets: 3, reps: '16', rest: '30s' },
        { name: 'Single Leg Jumps', sets: 3, reps: '10/taraf', rest: '30s' },
      ] },
      { day: 'Salı', focus: 'İleri Kol & Sırt', emoji: '💪', exercises: [
        { name: 'Long Stretch Series', sets: 3, reps: '8', rest: '45s' },
        { name: 'Up Stretch', sets: 3, reps: '6', rest: '45s' },
        { name: 'Arabesque', sets: 3, reps: '6/taraf', rest: '30s' },
        { name: 'Balance Control Front', sets: 3, reps: '6', rest: '45s' },
      ] },
      { day: 'Çarşamba', focus: 'Dinlenme', emoji: '😴', exercises: [{ name: 'Tam Dinlenme', sets: '-', reps: '-', rest: '-' }] },
      { day: 'Perşembe', focus: 'Inversions & Challenge', emoji: '🤸', exercises: [
        { name: 'Headstand on Reformer', sets: 3, reps: '15s', rest: '60s' },
        { name: 'Control Balance (İleri)', sets: 3, reps: '6/taraf', rest: '45s' },
        { name: 'Star on Reformer', sets: 3, reps: '6/taraf', rest: '45s' },
        { name: 'Snake (Full)', sets: 3, reps: '6/taraf', rest: '45s' },
      ] },
      { day: 'Cuma', focus: 'Tam Vücut Master', emoji: '🎯', exercises: [
        { name: 'Full Reformer Flow (45 dk)', sets: 1, reps: '45 dk', rest: '-' },
      ] },
      { day: 'Cumartesi', focus: 'Toparlanma', emoji: '🌸', exercises: [
        { name: 'Leg Spring Series', sets: 1, reps: '15 dk', rest: '-' },
        { name: 'Arm Spring Series', sets: 1, reps: '15 dk', rest: '-' },
        { name: 'Stretch Serisi', sets: 1, reps: '10 dk', rest: '-' },
      ] },
      { day: 'Pazar', focus: 'Dinlenme', emoji: '😴', exercises: [{ name: 'Tam Dinlenme', sets: '-', reps: '-', rest: '-' }] },
    ],
    // ─── Phase 3 — Usta: Koreografi & Tower ────────────────
    [
      { day: 'Pazartesi', focus: 'Master Reformer', emoji: '🏆', exercises: [
        { name: 'Full Classical Repertoire', sets: 1, reps: '50 dk', rest: '-' },
      ] },
      { day: 'Salı', focus: 'Tower / Cadillac', emoji: '🗼', exercises: [
        { name: 'Roll Back Bar', sets: 3, reps: '8', rest: '30s' },
        { name: 'Leg Springs (İleri)', sets: 3, reps: '10/taraf', rest: '15s' },
        { name: 'Push Through Bar — Front', sets: 3, reps: '8', rest: '30s' },
        { name: 'Push Through Bar — Back', sets: 3, reps: '8', rest: '30s' },
        { name: 'Hanging Pull-Ups', sets: 3, reps: '6', rest: '45s' },
      ] },
      { day: 'Çarşamba', focus: 'Dinlenme', emoji: '😴', exercises: [{ name: 'Tam Dinlenme', sets: '-', reps: '-', rest: '-' }] },
      { day: 'Perşembe', focus: 'Jump Board İleri', emoji: '🦘', exercises: [
        { name: 'Plyometric Jumps', sets: 3, reps: '15', rest: '30s' },
        { name: 'Tuck Jumps', sets: 3, reps: '12', rest: '30s' },
        { name: 'Split Jumps', sets: 3, reps: '10/taraf', rest: '30s' },
        { name: 'Lateral Jumps', sets: 3, reps: '12', rest: '30s' },
        { name: 'Single Leg Plyos', sets: 3, reps: '8/taraf', rest: '45s' },
      ] },
      { day: 'Cuma', focus: 'Wunda Chair', emoji: '🪑', exercises: [
        { name: 'Pike on Chair', sets: 3, reps: '8', rest: '30s' },
        { name: 'Teaser on Chair', sets: 3, reps: '6', rest: '30s' },
        { name: 'Going Up Front', sets: 3, reps: '8/taraf', rest: '30s' },
        { name: 'Swan on Chair', sets: 3, reps: '6', rest: '45s' },
        { name: 'Horseback', sets: 3, reps: '8', rest: '30s' },
      ] },
      { day: 'Cumartesi', focus: 'Mindful Movement', emoji: '🌸', exercises: [
        { name: 'Reformer + Mat Fusion', sets: 1, reps: '30 dk', rest: '-' },
        { name: 'Nefes & Meditasyon', sets: 1, reps: '15 dk', rest: '-' },
      ] },
      { day: 'Pazar', focus: 'Dinlenme', emoji: '😴', exercises: [{ name: 'Tam Dinlenme', sets: '-', reps: '-', rest: '-' }] },
    ],
  ],
};

// ── Bütçe çarpanı ────────────────────────────────────────
const budgetMultipliers = {
  economy: 0.7,
  moderate: 1.0,
  premium: 1.5,
};

function applyBudgetToMeals(meals, budget) {
  const mult = budgetMultipliers[budget] || 1.0;
  return meals.map((m) => ({
    ...m,
    price: Math.round((m.price || 0) * mult),
  }));
}

// ── Ana Fonksiyon ────────────────────────────────────────
export function generatePlan(userMetrics, phase = 0, lang = 'tr') {
  const {
    name, age, gender, height, weight,
    bodyFatPercentage, experience, activityLevel,
    primaryGoal, workSchedule, budget,
  } = userMetrics;

  // Faz sınırlarını kontrol et
  const maxPhase = (workoutPhases[primaryGoal] || workoutPhases.muscle).length - 1;
  const safePhase = Math.max(0, Math.min(phase, maxPhase));

  const bmr = calculateBMR(weight, bodyFatPercentage, age || 25, height || 175, gender || 'male');
  const tdee = bmr * (activityMultipliers[activityLevel] || 1.55);

  let baseCalories;
  if (primaryGoal === 'muscle') {
    baseCalories = Math.round(tdee + 350);
  } else if (primaryGoal === 'fat_loss') {
    baseCalories = Math.round(tdee - 500);
  } else if (primaryGoal === 'meditation') {
    baseCalories = Math.round(tdee); // maintenance
  } else if (primaryGoal === 'yoga') {
    baseCalories = Math.round(tdee * 0.95); // slight deficit
  } else {
    baseCalories = Math.round(tdee * 1.02); // pilates/reformer slight surplus
  }

  const workoutSplit = (workoutPhases[primaryGoal] || workoutPhases.muscle)[safePhase];

  // Her gün için özel beslenme planı oluştur
  const dailyNutrition = workoutSplit.map((day) => {
    const mealType = getDayMealType(day.focus);
    const dayType = mealType === 'rest' ? 'rest'
      : mealType === 'active_rest' ? 'active_rest'
      : mealType === 'lower' ? 'lower'
      : mealType === 'hiit' ? 'hiit'
      : 'upper';

    const dayCalories = adjustCaloriesForDay(baseCalories, dayType, primaryGoal);
    const dayMacros = calculateMacros(dayCalories, primaryGoal);
    const templates = getMealTemplates(lang);
    const template = templates[mealType] || templates.rest;
    const rawMeals = template.meals(dayMacros, dayCalories);
    const meals = applyBudgetToMeals(rawMeals, budget);
    const totalPrice = meals.reduce((sum, m) => sum + (m.price || 0), 0);

    return {
      day: day.day,
      focus: day.focus,
      emoji: day.emoji,
      mealType,
      mealLabel: template.label,
      calories: dayCalories,
      macros: dayMacros,
      meals,
      totalPrice,
    };
  });

  return {
    // Kullanıcı profili
    userName: name || 'User',
    userAge: age,
    userGender: gender,
    userHeight: height,
    userWeight: weight,
    userBodyFat: bodyFatPercentage,
    userExperience: experience,
    userActivityLevel: activityLevel,
    userBudget: budget,
    userWorkSchedule: workSchedule,
    // Faz bilgisi
    phase: safePhase,
    // Hesaplanan değerler
    dailyCalories: baseCalories,
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    bmi: parseFloat((weight / ((height / 100) ** 2)).toFixed(1)),
    macros: calculateMacros(baseCalories, primaryGoal),
    macroPercentages: {
      muscle: { protein: 35, carbs: 40, fat: 25 },
      fat_loss: { protein: 40, carbs: 25, fat: 35 },
      meditation: { protein: 25, carbs: 45, fat: 30 },
      yoga: { protein: 28, carbs: 42, fat: 30 },
      pilates: { protein: 30, carbs: 40, fat: 30 },
      reformer: { protein: 32, carbs: 38, fat: 30 },
    }[primaryGoal] || { protein: 30, carbs: 40, fat: 30 },
    dailyNutrition,
    workoutSplit,
    goal: {
      tr: { muscle: 'Kas Gelişimi', fat_loss: 'Yağ Yakımı', meditation: 'Meditasyon', yoga: 'Yoga', pilates: 'Pilates', reformer: 'Reformer' },
      en: { muscle: 'Muscle Growth', fat_loss: 'Fat Loss', meditation: 'Meditation', yoga: 'Yoga', pilates: 'Pilates', reformer: 'Reformer' },
      es: { muscle: 'Crecimiento Muscular', fat_loss: 'Quema de Grasa', meditation: 'Meditación', yoga: 'Yoga', pilates: 'Pilates', reformer: 'Reformer' },
    }[lang]?.[primaryGoal] || { muscle: 'Muscle Growth', fat_loss: 'Fat Loss', meditation: 'Meditation', yoga: 'Yoga', pilates: 'Pilates', reformer: 'Reformer' }[primaryGoal] || 'Muscle Growth',
    lang,
    createdAt: new Date().toISOString(),
  };
}

// ── Mevcut planı farklı fazla yeniden oluştur ────────────
export function regeneratePlanWithPhase(existingPlan, phase) {
  const goalMap = {
    // Turkish
    'Kas Gelişimi': 'muscle', 'Yağ Yakımı': 'fat_loss', 'Meditasyon': 'meditation',
    // English
    'Muscle Growth': 'muscle', 'Fat Loss': 'fat_loss', 'Meditation': 'meditation',
    // Spanish
    'Crecimiento Muscular': 'muscle', 'Quema de Grasa': 'fat_loss', 'Meditación': 'meditation',
    // Shared
    'Yoga': 'yoga', 'Pilates': 'pilates', 'Reformer': 'reformer',
  };
  const planLang = existingPlan.lang || 'tr';
  const userMetrics = {
    name: existingPlan.userName,
    age: existingPlan.userAge,
    gender: existingPlan.userGender,
    height: existingPlan.userHeight,
    weight: existingPlan.userWeight,
    bodyFatPercentage: existingPlan.userBodyFat,
    experience: existingPlan.userExperience,
    activityLevel: existingPlan.userActivityLevel || 'moderate',
    primaryGoal: goalMap[existingPlan.goal] || 'muscle',
    budget: existingPlan.userBudget,
  };
  return generatePlan(userMetrics, phase, planLang);
}
