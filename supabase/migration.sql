-- ============================================
-- ShredMatrix — Supabase Database Migration
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================

-- ── Kullanıcı profil bilgileri (auth.users'a ek) ──
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  onboarding_data JSONB,
  current_phase INTEGER DEFAULT 0,
  plan_created_at TIMESTAMPTZ,
  first_login_at TIMESTAMPTZ DEFAULT NOW(),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Antrenman planı ──
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ── Antrenman logları ──
CREATE TABLE workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  day_focus TEXT,
  exercises JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── İlerleme takibi (kilo + yağ oranı) ──
CREATE TABLE progress_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight REAL,
  body_fat REAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Vücut ölçüleri ──
CREATE TABLE measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  chest REAL, waist REAL, hip REAL, arm REAL, leg REAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Su takibi ──
CREATE TABLE water_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  glasses INTEGER DEFAULT 0,
  target_met BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ── Uyku takibi ──
CREATE TABLE sleep_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hours REAL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ── Hatırlatıcı ayarları ──
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT FALSE,
  hour INTEGER DEFAULT 9,
  last_notified TIMESTAMPTZ,
  UNIQUE(user_id)
);

-- ============================================
-- Row Level Security (RLS) Policies
-- Kullanıcılar sadece kendi verilerine erişebilir
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_data" ON profiles FOR ALL USING (id = auth.uid());
CREATE POLICY "users_own_data" ON plans FOR ALL USING (user_id = auth.uid());
CREATE POLICY "users_own_data" ON workout_logs FOR ALL USING (user_id = auth.uid());
CREATE POLICY "users_own_data" ON progress_entries FOR ALL USING (user_id = auth.uid());
CREATE POLICY "users_own_data" ON measurements FOR ALL USING (user_id = auth.uid());
CREATE POLICY "users_own_data" ON water_logs FOR ALL USING (user_id = auth.uid());
CREATE POLICY "users_own_data" ON sleep_logs FOR ALL USING (user_id = auth.uid());
CREATE POLICY "users_own_data" ON reminders FOR ALL USING (user_id = auth.uid());

-- ============================================
-- Performance Indexes
-- ============================================

CREATE INDEX idx_workout_logs_user ON workout_logs(user_id, date);
CREATE INDEX idx_progress_user ON progress_entries(user_id, date);
CREATE INDEX idx_water_user ON water_logs(user_id, date);
CREATE INDEX idx_sleep_user ON sleep_logs(user_id, date);
CREATE INDEX idx_measurements_user ON measurements(user_id, date);

-- ============================================
-- Storage Bucket (Fotoğraflar)
-- ============================================

INSERT INTO storage.buckets (id, name, public) VALUES ('user-photos', 'user-photos', true);

CREATE POLICY "users_own_photos" ON storage.objects FOR ALL
  USING (bucket_id = 'user-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================
-- Auto-create profile on signup (trigger)
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'User'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
