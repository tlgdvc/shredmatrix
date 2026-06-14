# ShredMatrix — Teknik Görev Spesifikasyonu

> **Bu dosya bir AI coding agent'a verilmek üzere hazırlanmıştır.**
> Her görev, dosya yolları, satır numaraları ve beklenen çıktılarla birlikte tanımlanmıştır.
> Görevler öncelik sırasına göre listelenmiştir. P0 görevleri önce tamamlanmalıdır.

---

## Proje Bağlamı

- **Proje**: ShredMatrix — Fitness/Bodybuilding SaaS (Kişisel Antrenman Planı Oluşturucu)
- **Stack**: React 19 + Vite 8 + Tailwind CSS 4 + Framer Motion + Recharts + Lucide Icons
- **Mevcut Durum**: Çalışan prototip. UI/UX mükemmel ama backend YOK, tüm veri localStorage'da.
- **Dosya kökü**: Projenin root dizini (package.json'ın olduğu yer)

### Kritik Bilgi
- Projede HİÇBİR backend, API çağrısı, Supabase, veritabanı veya .env dosyası YOK.
- Tüm veri 18 ayrı localStorage key'inde saklanıyor.
- Şifreler `btoa()` ile encode ediliyor (Base64 = düz metin eşdeğeri).
- Tüm kullanıcı hesapları tek bir localStorage key'inde tutuluyor.
- Fotoğraflar Base64 data URL olarak localStorage'da — 5MB limit ile crash riski.
- URL routing yok — `useState` ile sayfa yönetimi (Off the Clock ile aynı sorun).
- `planGenerator.js` 1747 satır, 90KB — statik egzersiz/yemek verisi inline.
- `translations.js` 1202 satır, 69KB — 3 dilin tamamı startup'ta yükleniyor.

### 18 localStorage Key Haritası (Referans)
```
shredmatrix_users              → [{name, email, password}] TÜM kullanıcılar
shredmatrix_session            → {name, email} aktif oturum
shredmatrix_plan_${email}      → plan objesi (devasa)
shredmatrix_workout_log        → [{date, focus, exercises}]
shredmatrix_progress           → [{date, weight, bodyFat}]
shredmatrix_measurements       → [{date, chest, waist, hip, arm, leg}]
shredmatrix_water              → {date, glasses}
shredmatrix_water_history      → YAZILMIYOR AMA OKUNUYOR (BUG!)
shredmatrix_sleep              → [{date, hours}]
shredmatrix_profile_photo      → base64 string
shredmatrix_progress_photos    → [{id, date, src: base64}]
shredmatrix_reminder           → {enabled, hour, lastNotified}
shredmatrix_current_phase      → '0'|'1'|'2'|'3'
shredmatrix_plan_created       → ISO date string
shredmatrix_first_login        → ISO date string
shredmatrix_lang               → 'tr'|'en'|'es'
shredmatrix_install_dismissed  → ISO date string
shredmatrix_tour_seen_${email} → '1'
```

---

## P0-1: Supabase Entegrasyonu — Auth

### Mevcut Durum
`src/components/AuthScreen.jsx` satır 11:
```javascript
const hashPassword = (pw) => btoa(pw);
```
Satır 7, 22 — tüm kullanıcılar tek key'de:
```javascript
const users = JSON.parse(localStorage.getItem('shredmatrix_users') || '[]');
// [{name: "Ali", email: "ali@test.com", password: "MTIzNDU2"}, ...]
localStorage.setItem('shredmatrix_users', JSON.stringify([...users, newUser]));
```

### Yapılacak

1. Supabase projesi oluştur ve dependency ekle:
```bash
npm install @supabase/supabase-js
```

2. `.env` dosyası oluştur:
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

3. `src/lib/supabase.js` dosyası oluştur:
```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
```

4. `AuthScreen.jsx`'i yeniden yaz — tüm `localStorage` auth kodunu kaldır:
```javascript
import { supabase } from '../lib/supabase';

// Kayıt:
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: { data: { name } }
});

// Giriş:
const { data, error } = await supabase.auth.signInWithPassword({ email, password });

// Çıkış:
await supabase.auth.signOut();
```

5. `App.jsx`'teki session restore'u güncelle (satır 102-121):
```javascript
useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      setUser({ name: session.user.user_metadata.name, email: session.user.email });
      // plan'ı DB'den yükle (P0-2'de)
    }
  });

  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      setUser({ name: session.user.user_metadata.name, email: session.user.email });
    } else {
      setUser(null);
      setPlan(null);
      setCurrentView(VIEWS.LANDING);
    }
  });

  return () => subscription.unsubscribe();
}, []);
```

6. **Silinecek key'ler**: `shredmatrix_users`, `shredmatrix_session`
7. **Silinecek fonksiyon**: `hashPassword` (AuthScreen.jsx:11)
8. **Silinecek kod**: Demo account seeding (AuthScreen.jsx:107-138)

---

## P0-2: Supabase Entegrasyonu — Database

### Tablo Şeması
Supabase SQL Editor'da çalıştır:

```sql
-- Kullanıcı profil bilgileri (auth.users'a ek)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  onboarding_data JSONB,
  current_phase INTEGER DEFAULT 0,
  plan_created_at TIMESTAMPTZ,
  first_login_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Antrenman planı
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Antrenman logları
CREATE TABLE workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  day_focus TEXT,
  exercises JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- İlerleme takibi (kilo + yağ oranı)
CREATE TABLE progress_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight REAL,
  body_fat REAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vücut ölçüleri
CREATE TABLE measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  chest REAL, waist REAL, hip REAL, arm REAL, leg REAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Su takibi
CREATE TABLE water_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  glasses INTEGER DEFAULT 0,
  target_met BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Uyku takibi
CREATE TABLE sleep_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hours REAL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Hatırlatıcı ayarları
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT FALSE,
  hour INTEGER DEFAULT 9,
  last_notified TIMESTAMPTZ,
  UNIQUE(user_id)
);

-- RLS Policy'leri
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Her tablo için: sadece kendi verisini görebilir
CREATE POLICY "users_own_data" ON profiles FOR ALL USING (id = auth.uid());
CREATE POLICY "users_own_data" ON plans FOR ALL USING (user_id = auth.uid());
CREATE POLICY "users_own_data" ON workout_logs FOR ALL USING (user_id = auth.uid());
CREATE POLICY "users_own_data" ON progress_entries FOR ALL USING (user_id = auth.uid());
CREATE POLICY "users_own_data" ON measurements FOR ALL USING (user_id = auth.uid());
CREATE POLICY "users_own_data" ON water_logs FOR ALL USING (user_id = auth.uid());
CREATE POLICY "users_own_data" ON sleep_logs FOR ALL USING (user_id = auth.uid());
CREATE POLICY "users_own_data" ON reminders FOR ALL USING (user_id = auth.uid());

-- Index'ler
CREATE INDEX idx_workout_logs_user ON workout_logs(user_id, date);
CREATE INDEX idx_progress_user ON progress_entries(user_id, date);
CREATE INDEX idx_water_user ON water_logs(user_id, date);
CREATE INDEX idx_sleep_user ON sleep_logs(user_id, date);
CREATE INDEX idx_measurements_user ON measurements(user_id, date);
```

### Data Service Katmanı
`src/lib/dataService.js` dosyası oluştur — her component'in localStorage çağrılarını bu fonksiyonlarla değiştir:

```javascript
import { supabase } from './supabase';

// ── PLAN ──
export async function savePlan(userId, planData) {
  const { error } = await supabase
    .from('plans')
    .upsert({ user_id: userId, plan_data: planData }, { onConflict: 'user_id' });
  if (error) throw error;
}

export async function loadPlan(userId) {
  const { data, error } = await supabase
    .from('plans')
    .select('plan_data')
    .eq('user_id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data?.plan_data || null;
}

// ── WORKOUT LOG ──
export async function saveWorkoutLog(userId, log) {
  const { error } = await supabase
    .from('workout_logs')
    .insert({ user_id: userId, ...log });
  if (error) throw error;
}

export async function getWorkoutLogs(userId) {
  const { data, error } = await supabase
    .from('workout_logs')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (error) throw error;
  return data || [];
}

// ── PROGRESS ──
export async function saveProgress(userId, entry) {
  const { error } = await supabase
    .from('progress_entries')
    .insert({ user_id: userId, ...entry });
  if (error) throw error;
}

export async function getProgress(userId) {
  const { data, error } = await supabase
    .from('progress_entries')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true });
  if (error) throw error;
  return data || [];
}

// ── WATER ──
export async function saveWater(userId, date, glasses, targetMet) {
  const { error } = await supabase
    .from('water_logs')
    .upsert({ user_id: userId, date, glasses, target_met: targetMet },
      { onConflict: 'user_id,date' });
  if (error) throw error;
}

export async function getWaterHistory(userId) {
  const { data, error } = await supabase
    .from('water_logs')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(30);
  if (error) throw error;
  return data || [];
}

// ── MEASUREMENTS ──
export async function saveMeasurement(userId, entry) {
  const { error } = await supabase
    .from('measurements')
    .insert({ user_id: userId, ...entry });
  if (error) throw error;
}

export async function getMeasurements(userId) {
  const { data, error } = await supabase
    .from('measurements')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true });
  if (error) throw error;
  return data || [];
}

// ── SLEEP ──
export async function saveSleep(userId, date, hours) {
  const { error } = await supabase
    .from('sleep_logs')
    .upsert({ user_id: userId, date, hours },
      { onConflict: 'user_id,date' });
  if (error) throw error;
}

export async function getSleep(userId) {
  const { data, error } = await supabase
    .from('sleep_logs')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(30);
  if (error) throw error;
  return data || [];
}

// ── DELETE ACCOUNT ──
export async function deleteAllUserData(userId) {
  const tables = ['plans', 'workout_logs', 'progress_entries',
    'measurements', 'water_logs', 'sleep_logs', 'reminders', 'profiles'];
  for (const table of tables) {
    await supabase.from(table).delete().eq(
      table === 'profiles' ? 'id' : 'user_id', userId
    );
  }
}
```

### Migration Planı (localStorage → DB)
Her component için sırayla:
1. `import { saveX, getX } from '../lib/dataService'` ekle
2. `localStorage.getItem/setItem` çağrılarını dataService fonksiyonlarıyla değiştir
3. `useEffect` içinde DB'den veri yükle, `useState` ile tut
4. Kaydetme işlemlerini async yap, hata göster

**Değişecek dosyalar ve localStorage key mapping:**

| Component | Kaldırılacak localStorage Key | Kullanılacak dataService Fonksiyon |
|-----------|-------------------------------|-----------------------------------|
| App.jsx | `shredmatrix_plan_${email}` | `savePlan`, `loadPlan` |
| WorkoutPanel.jsx | `shredmatrix_workout_log` | `saveWorkoutLog`, `getWorkoutLogs` |
| WorkoutLog.jsx | `shredmatrix_workout_log` | `saveWorkoutLog`, `getWorkoutLogs` |
| ProgressTracker.jsx | `shredmatrix_progress` | `saveProgress`, `getProgress` |
| BodyMeasurements.jsx | `shredmatrix_measurements` | `saveMeasurement`, `getMeasurements` |
| WaterTracker.jsx | `shredmatrix_water` | `saveWater`, `getWaterHistory` |
| SleepTracker.jsx | `shredmatrix_sleep` | `saveSleep`, `getSleep` |
| WorkoutReminder.jsx | `shredmatrix_reminder` | DB reminders tablosu |
| Achievements.jsx | 5 key okuyor | Tüm dataService get fonksiyonları |
| WeeklyReport.jsx | 3 key okuyor | Tüm dataService get fonksiyonları |
| ProfilePage.jsx | 8 key | `deleteAllUserData` + Storage |
| adaptiveEngine.js | 3 key | dataService fonksiyonları |

**Kalacak localStorage key'ler** (cihaz-local tercihler):
- `shredmatrix_lang` — dil tercihi
- `shredmatrix_install_dismissed` — PWA prompt
- `shredmatrix_tour_seen_${email}` — onboarding turu

---

## P0-3: Supabase Entegrasyonu — Storage (Fotoğraflar)

### Mevcut Durum
`src/components/ProfilePage.jsx` satır 12-13, 45-58:
```javascript
// Profil fotoğrafı — base64 localStorage'da
const saved = localStorage.getItem('shredmatrix_profile_photo');
localStorage.setItem('shredmatrix_profile_photo', reader.result);

// İlerleme fotoğrafları — base64 array localStorage'da
const savedGallery = localStorage.getItem('shredmatrix_progress_photos');
```

### Yapılacak

1. Supabase Storage'da bucket oluştur:
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('user-photos', 'user-photos', true);

CREATE POLICY "users_own_photos" ON storage.objects FOR ALL
  USING (bucket_id = 'user-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
```

2. Upload fonksiyonu ekle (`src/lib/dataService.js`'e):
```javascript
export async function uploadPhoto(userId, file, type = 'profile') {
  const ext = file.name.split('.').pop();
  const path = `${userId}/${type}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('user-photos')
    .upload(path, file, { cacheControl: '3600', upsert: type === 'profile' });

  if (error) throw error;

  const { data } = supabase.storage
    .from('user-photos')
    .getPublicUrl(path);

  return data.publicUrl;
}

export async function deletePhoto(path) {
  const { error } = await supabase.storage
    .from('user-photos')
    .remove([path]);
  if (error) throw error;
}
```

3. `ProfilePage.jsx`'teki FileReader/base64 kodunu değiştir:
```javascript
// MEVCUT (YANLIŞ):
reader.onload = () => {
  localStorage.setItem('shredmatrix_profile_photo', reader.result);
};

// DÜZELTİLMİŞ:
const url = await uploadPhoto(user.id, file, 'profile');
setProfilePhoto(url);
await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id);
```

4. **Kaldırılacak key'ler**: `shredmatrix_profile_photo`, `shredmatrix_progress_photos`

---

## P0-4: Kritik Bug Düzeltmeleri

### Bug 1: `shredmatrix_water_history` Hiç Yazılmıyor

**Okuyan dosyalar:**
- `Achievements.jsx` satır 10: `JSON.parse(localStorage.getItem('shredmatrix_water_history') || '[]')`
- `WeeklyReport.jsx` satır 71: aynı

**Yazan:** HİÇBİR COMPONENT

**Düzeltme (localStorage versiyonu):** `WaterTracker.jsx`'e history yazma ekle:
```javascript
// WaterTracker.jsx — su hedefi karşılandığında (glasses >= 8):
useEffect(() => {
  if (glasses >= 8) {
    const history = JSON.parse(localStorage.getItem('shredmatrix_water_history') || '[]');
    const today = new Date().toISOString().slice(0, 10);
    if (!history.includes(today)) {
      history.push(today);
      localStorage.setItem('shredmatrix_water_history', JSON.stringify(history));
    }
  }
}, [glasses]);
```

**Düzeltme (Supabase versiyonu):** `water_logs` tablosunda `target_met` boolean zaten var. Achievements ve WeeklyReport bu tablodan okusun.

---

### Bug 2: React Rules of Hooks İhlali

**Dosya:** `Dashboard.jsx` satır 108-111
```javascript
// MEVCUT (YANLIŞ — hook conditional'dan sonra):
if (!plan) return null;        // L108
useEffect(() => { ... });      // L111 — HOOK SONRA!

// DÜZELTİLMİŞ — hook'u ÖNCE taşı:
useEffect(() => {
  if (!plan) return;
  // ... welcome overlay logic ...
}, [plan, user]);

if (!plan) return null;        // early return HOOK'LARDAN SONRA
```

---

### Bug 3: `useState` Side Effect Olarak Kullanılıyor

**Dosya 1:** `AuthScreen.jsx` satır 138
```javascript
// MEVCUT (YANLIŞ):
useState(() => seedDemoAccount());

// DÜZELTİLMİŞ:
useEffect(() => {
  seedDemoAccount();
}, []);
```

**Dosya 2:** `WorkoutPanel.jsx` satır 243
```javascript
// MEVCUT (YANLIŞ):
useState(() => {
  // reads localStorage and calls setCompletedDays(...)
});

// DÜZELTİLMİŞ:
useEffect(() => {
  const logs = JSON.parse(localStorage.getItem('shredmatrix_workout_log') || '[]');
  // ... hesaplama ...
  setCompletedDays(result);
}, []);
```

---

### Bug 4: WeeklyReport Stale Data

**Dosya:** `WeeklyReport.jsx`
```javascript
// MEVCUT (YANLIŞ):
const report = useMemo(() => { ... }, []); // ← boş dependency!

// DÜZELTİLMİŞ — data dependency'leri ekle:
const report = useMemo(() => { ... }, [workoutLogs, waterHistory, progressEntries]);
// Veya prop olarak data alarak:
// function WeeklyReport({ workoutLogs, waterHistory, progress }) { ... }
```

---

### Bug 5: Hesap Silme Eksik

**Dosya:** `ProfilePage.jsx` satır 180-190

```javascript
// MEVCUT — sadece 6 key siliyor:
localStorage.removeItem('shredmatrix_session');
localStorage.removeItem(`shredmatrix_plan_${user.email}`);
localStorage.removeItem('shredmatrix_progress');
localStorage.removeItem('shredmatrix_water');
localStorage.removeItem('shredmatrix_profile_photo');
localStorage.removeItem('shredmatrix_progress_photos');

// EKSİK KEY'LER — bunları da ekle:
localStorage.removeItem('shredmatrix_workout_log');
localStorage.removeItem('shredmatrix_measurements');
localStorage.removeItem('shredmatrix_sleep');
localStorage.removeItem('shredmatrix_reminder');
localStorage.removeItem('shredmatrix_first_login');
localStorage.removeItem('shredmatrix_install_dismissed');
localStorage.removeItem('shredmatrix_water_history');
localStorage.removeItem('shredmatrix_current_phase');
localStorage.removeItem('shredmatrix_plan_created');
localStorage.removeItem(`shredmatrix_tour_seen_${user.email}`);
```

**Supabase versiyonunda** `deleteAllUserData(userId)` fonksiyonunu çağır (P0-2'de tanımlandı).

---

### Bug 6: Plan Regenerasyonunda Activity Level Hardcoded

**Dosya:** `planGenerator.js` satır 1741
```javascript
// MEVCUT (YANLIŞ):
activityLevel: 'moderate',

// DÜZELTİLMİŞ — mevcut plan'dan al:
activityLevel: currentPlan.activityLevel || formData.activityLevel || 'moderate',
```

Aynı sorun `ProfilePage.jsx` satır 95'te:
```javascript
// MEVCUT:
activityLevel: 'moderate',
// DÜZELTİLMİŞ:
activityLevel: plan.activityLevel || 'moderate',
```

---

## P1-1: React Router Ekle

### Mevcut Durum
`src/App.jsx` satır 11-17:
```javascript
const VIEWS = {
  LANDING: 'landing',
  AUTH: 'auth',
  ONBOARDING: 'onboarding',
  LOADING: 'loading',
  DASHBOARD: 'dashboard',
};
```

### Yapılacak

```bash
npm install react-router-dom
```

`src/App.jsx` güncelle:
```javascript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthScreen />} />
        <Route path="/onboarding" element={
          user ? <Onboarding /> : <Navigate to="/auth" />
        } />
        <Route path="/dashboard" element={
          user && plan ? <Dashboard /> : <Navigate to="/" />
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
```

Tüm `setCurrentView(VIEWS.X)` çağrılarını `navigate('/x')` ile değiştir.

---

## P1-2: Hardcoded Türkçe String'leri i18n'e Taşı

### WorkoutLog.jsx — En Kötü Durum
Dosyada `t()` hiç kullanılmıyor. Tüm metinler hardcoded:

| Satır | String | Key Önerisi |
|-------|--------|-------------|
| ~ | "Ağırlık" | `workout.weight` |
| ~ | "Tekrar" | `workout.reps` |
| ~ | "Set Ekle" | `workout.addSet` |
| ~ | "Antrenman Günlüğü" | `workout.logTitle` |
| ~ | "toplam hacim" | `workout.totalVolume` |
| ~ | "Kaydet" | `common.save` |

**Yapılacak:** `import { useTranslation } from '../i18n/LanguageContext'` ekle, tüm hardcoded string'leri `t()` ile değiştir.

### Onboarding.jsx
| Satır | String | Dil |
|-------|--------|-----|
| 221-228 | "Zayıf", "Normal", "Fazla Kilolu", "Obez" | TR |
| 314 | "Adınızı girin..." | TR |
| 481-491 | Hedef açıklamaları | TR |
| 553 | "Özet" | TR |
| 556 | "yaş" | TR |
| 559 | "yağ" | TR |

### planGenerator.js
| Satır | İçerik | Dil |
|-------|--------|-----|
| 69-123 | Tüm yemek isimleri | TR |
| 508-1620 | Egzersiz isimleri (karışık EN/TR) | Karışık |
| ~ | Fiyatlar (₺) | TR para birimi |

### Diğer Component'ler
| Component | Hardcoded | Dil |
|-----------|-----------|-----|
| NutritionPanel.jsx | Yemek alternatifleri, ikon mapping | TR |
| SupplementGuide.jsx | Tüm supplement isimleri ve dozajları | TR |
| ShareCard.jsx | "Hedef", "Günlük Kalori", paylaşım metni | TR |
| WorkoutTimer.jsx | "2dk" preset | TR |

---

## P1-3: Error Boundary Ekle

`src/App.jsx`'e ekle:
```javascript
import { Component } from 'react';

class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Bir hata oluştu</h1>
            <p className="text-slate-400 mb-6">{this.state.error?.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-orange-500 text-white rounded-xl"
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// App return'de:
<ErrorBoundary>
  <BrowserRouter>...</BrowserRouter>
</ErrorBoundary>
```

---

## P2-1: Performans — Code Splitting

`src/App.jsx`'te lazy loading:
```javascript
import { lazy, Suspense } from 'react';

const LandingPage = lazy(() => import('./components/LandingPage'));
const AuthScreen = lazy(() => import('./components/AuthScreen'));
const Onboarding = lazy(() => import('./components/Onboarding'));
const Dashboard = lazy(() => import('./components/Dashboard'));

// Routes'u Suspense ile wrap et:
<Suspense fallback={<LoadingScreen />}>
  <Routes>...</Routes>
</Suspense>
```

Dashboard içindeki tab component'leri de lazy yap:
```javascript
const NutritionPanel = lazy(() => import('./NutritionPanel'));
const WorkoutPanel = lazy(() => import('./WorkoutPanel'));
const ProgressTracker = lazy(() => import('./ProgressTracker'));
const Achievements = lazy(() => import('./Achievements'));
const ProfilePage = lazy(() => import('./ProfilePage'));
```

---

## P2-2: Performans — Büyük Dosyaları Böl

### planGenerator.js (1747 satır, 90KB)
```
src/data/
├── planGenerator.js      # ~200 satır — sadece hesaplama mantığı
├── exercises/
│   ├── muscle.json       # Kas yapma egzersizleri
│   ├── fatLoss.json      # Yağ yakma egzersizleri
│   ├── yoga.json
│   ├── pilates.json
│   ├── meditation.json
│   └── reformer.json
└── meals/
    ├── meals.json        # Yemek veritabanı
    └── alternatives.json # Alternatif yemekler
```

### translations.js (1202 satır, 69KB)
```
src/i18n/
├── LanguageContext.jsx   # Context (değişmez)
├── translations/
│   ├── tr.json           # Türkçe
│   ├── en.json           # İngilizce
│   └── es.json           # İspanyolca
└── index.js              # Dinamik import
```

Dinamik yükleme:
```javascript
const loadTranslations = async (lang) => {
  const module = await import(`./translations/${lang}.json`);
  return module.default;
};
```

---

## P2-3: Landing Page Sahte İstatistikleri

**Dosya:** `LandingPage.jsx` satır 91-97

```javascript
// MEVCUT (YANLIŞ):
"10K+ Exercises"  // Gerçekte ~100
"500+ Recipes"    // Gerçekte ~50

// DÜZELTİLMİŞ — gerçekçi veya kaldır:
"100+ Exercises"
"50+ Recipes"
```

**Satır 204-223:** Sahte testimonial'ları kaldır veya gerçek kullanıcı yorumları ile değiştir.

---

## P2-4: Aldatıcı Özellikleri Düzelt

### CalorieCalc "Fotoğraf Tarama"
**Dosya:** `CalorieCalc.jsx`

Fotoğraf yükleme butonu AI yeteneği varmış gibi görünüyor ama sadece resmi gösteriyor. Ya:
- Özelliği kaldır
- Ya da "Bu özellik yakında" etiketi ekle
- Ya da gerçek bir food recognition API entegre et (Nutritionix, Edamam vb.)

### ShareCard "Kaydet"
**Dosya:** `ShareCard.jsx`

"Kaydet" butonu aslında screenshot hint gösteriyor. Ya:
- `html2canvas` ile gerçek image download ekle
- Ya da `navigator.share` Web Share API kullan
- Buton metnini "Ekran Görüntüsü Al" olarak değiştir

---

## P2-5: Component Bölme

| Component | Satır | Bölünecek Parçalar |
|-----------|-------|-------------------|
| `WorkoutLog.jsx` | 582 | ExerciseCard, SetRow, HistoryView, WorkoutLogMain |
| `ProfilePage.jsx` | 552 | ProfileHeader, PhotoGallery, GoalChanger, AccountActions |
| `NutritionPanel.jsx` | 536 | DaySelector, MacroDonut, MealCard |
| `ProgressTracker.jsx` | 503 | DataEntryForm, ProgressChart, EntryHistory |
| `Achievements.jsx` | 456 | BadgeCard, AchievementEngine (logic hook) |

---

## P3: Ek İyileştirmeler

### Memory Leak — URL.createObjectURL
3 dosyada `URL.revokeObjectURL()` çağrılmıyor:
- `PhotoGallery.jsx` (eğer varsa — ProfilePage içinde)
- `Stories.jsx` (eğer varsa)
- `VerificationModal.jsx` (eğer varsa)

ProfilePage.jsx'te profil fotoğrafı ve galeri fotoğrafları için:
```javascript
// Her createObjectURL sonrası:
const url = URL.createObjectURL(file);
// Kullanım bitince:
URL.revokeObjectURL(url);
```

### Dashboard localStorage Render Path'inde
**Dosya:** `Dashboard.jsx` satır 238
```javascript
// MEVCUT — her render'da localStorage okur:
{localStorage.getItem('shredmatrix_first_login')}

// DÜZELTİLMİŞ — state'e al:
const [firstLogin] = useState(() => localStorage.getItem('shredmatrix_first_login'));
```

### WorkoutReminder 30sn Polling
**Dosya:** `WorkoutReminder.jsx`
```javascript
// MEVCUT: setInterval 30 saniyede bir kontrol
// DÜZELTİLMİŞ: Bir sonraki bildirim saatine setTimeout ayarla
```

### İsRestDay Duplikasyonu
`WorkoutPanel.jsx` ve `WorkoutLog.jsx`'te aynı `isRestDay()` fonksiyonu var.
```
src/utils/workoutUtils.js → export function isRestDay(dayFocus) { ... }
```

### Input Validasyonu
- Kilo inputu negatif değer kabul ediyor — min="0" ekle
- Gram inputu 2000+ değer kabul ediyor — validasyon ekle
- Email validasyonu çok basit — regex ekle

### Vitest Ekle
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```
En azından şunlar için test yaz:
- `planGenerator.js` — BMR/TDEE hesaplamaları
- `adaptiveEngine.js` — trend/plato algılama
- `dataService.js` — CRUD operasyonları

---

## Özet

| Metrik | Değer |
|--------|-------|
| Toplam görev | 35+ |
| P0 (Kritik) | 4 görev (Supabase Auth + DB + Storage + Bug fixes) |
| P1 (Yüksek) | 3 görev (Router, i18n, Error Boundary) |
| P2 (Orta) | 5 görev (Code splitting, dosya bölme, sahte özellikler, component bölme) |
| P3 (Düşük) | 6 görev (Memory leak, polling, duplikasyon, validasyon, test) |
| Düzeltilecek bug | 6 kritik |
| Taşınacak i18n string | 50+ |
| Kaldırılacak localStorage key | 15 (3 kalacak) |
| Bölünecek dosya | planGenerator (90KB) + translations (69KB) + 5 component |

### Önerilen İş Sırası
```
Hafta 1-2: P0 — Supabase Entegrasyonu
├── Auth (email + password)
├── Database (8 tablo + RLS)
├── Storage (fotoğraflar)
└── 6 kritik bug düzeltmesi

Hafta 3: P1 — Mimari
├── React Router
├── i18n eksiklerini tamamla (50+ string)
└── Error Boundary

Hafta 4: P2 — Polish
├── Code splitting (lazy loading)
├── planGenerator + translations split
├── Sahte istatistik/özellik düzeltmeleri
└── Component bölme (5 dosya)
```
