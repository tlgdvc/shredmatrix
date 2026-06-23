import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, Users, PieChart, Activity, Search,
  TrendingUp, UserPlus, Calendar, Target, ChevronLeft, ChevronRight,
  Trash2, Eye, X, Shield, RefreshCw, Menu, ArrowLeft, Clock, Zap
} from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart as RechartPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  isAdmin, getAdminStats, getAdminUsers, getPlanDistribution,
  getRegistrationTrend, getUserPlanDetails, deleteUser, getRecentUsers
} from '../../lib/adminService';

// ── Colors ───────────────────────────────────────
const COLORS = ['#ff6d00', '#00b0ff', '#00e676', '#ff4081', '#7c4dff', '#ffab00', '#00bfa5', '#ff1744'];
const GOAL_COLORS = {
  'Kas Gelişimi': '#ff6d00',
  'Yağ Yakımı': '#00b0ff',
  'Yoga': '#00e676',
  'Pilates': '#7c4dff',
  'Meditasyon': '#ff4081',
  'Reformer': '#ffab00',
};
const EXP_COLORS = { 'Başlangıç': '#00e676', 'Orta': '#ffab00', 'İleri': '#ff4081' };
const GENDER_COLORS = { 'Erkek': '#00b0ff', 'Kadın': '#ff4081', 'Bilinmiyor': '#64748b' };

// ── Stat Card ────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color = '#ff6d00', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden hover:border-slate-700 transition-colors"
    >
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-[60px] opacity-20" style={{ background: color }} />
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <span className="text-[10px] text-slate-500 font-outfit uppercase tracking-wider leading-tight">{label}</span>
      </div>
      <p className="text-2xl sm:text-3xl font-extrabold font-outfit text-white">{value}</p>
      {sub && <p className="text-[10px] text-slate-500 mt-1 font-inter">{sub}</p>}
    </motion.div>
  );
}

// ── Custom Tooltip ───────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-slate-400 font-inter">{label}</p>
      <p className="text-sm font-bold text-white font-outfit">{payload[0].value}</p>
    </div>
  );
}

// ── Mini Donut Chart ─────────────────────────────
function MiniDonut({ data, colorMap, title }) {
  if (!data || data.length === 0) return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-center h-80">
      <p className="text-slate-600 text-sm font-inter">Veri yok</p>
    </div>
  );
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <h3 className="text-sm font-bold font-outfit text-white mb-2">{title}</h3>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <RechartPie>
            <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
              {data.map((entry, i) => (
                <Cell key={i} fill={colorMap?.[entry.name] || COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </RechartPie>
        </ResponsiveContainer>
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 justify-center">
        {data.map((entry, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: colorMap?.[entry.name] || COLORS[i % COLORS.length] }} />
            <span className="text-[10px] text-slate-400 font-inter">{entry.name} ({entry.value})</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ── User Detail Modal ────────────────────────────
function UserDetailModal({ userId, onClose }) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserPlanDetails(userId).then(p => { setPlan(p); setLoading(false); });
  }, [userId]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold font-outfit text-white">Kullanıcı Detayları</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-500">Yükleniyor...</div>
        ) : plan ? (
          <div className="space-y-2">
            {[
              ['İsim', plan.userName],
              ['Hedef', plan.goal],
              ['Yaş', plan.userAge],
              ['Cinsiyet', plan.userGender],
              ['Boy', plan.userHeight ? `${plan.userHeight} cm` : null],
              ['Kilo', plan.userWeight ? `${plan.userWeight} kg` : null],
              ['Vücut Yağı', plan.userBodyFat ? `%${plan.userBodyFat}` : null],
              ['Deneyim', plan.userExperience],
              ['Aktivite', plan.userActivityLevel],
              ['Program', plan.userWorkSchedule],
              ['Bütçe', plan.userBudget],
              ['Kalori', plan.dailyCalories ? `${plan.dailyCalories} kcal` : null],
            ].filter(([, v]) => v).map(([label, value]) => (
              <div key={label} className="flex items-center justify-between py-2.5 border-b border-slate-800/50">
                <span className="text-xs text-slate-500 font-inter">{label}</span>
                <span className="text-sm text-white font-outfit font-medium">{value}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">Plan bulunamadı</div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Time Ago Helper ──────────────────────────────
function timeAgo(dateStr) {
  if (!dateStr) return '-';
  const now = new Date();
  const d = new Date(dateStr);
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'Az önce';
  if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} saat önce`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} gün önce`;
  return d.toLocaleDateString('tr-TR');
}

// ═════════════════════════════════════════════════
// Main Admin Panel
// ═════════════════════════════════════════════════
export default function AdminPanel({ user }) {
  // Guard
  if (!user || !isAdmin(user)) return <Navigate to="/dashboard" replace />;

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [distribution, setDistribution] = useState({ goals: [], genders: [], ages: [], experiences: [] });
  const [trend, setTrend] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [detailUserId, setDetailUserId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const PAGE_SIZE = 15;

  const loadData = useCallback(async () => {
    const [s, d, t, r] = await Promise.all([
      getAdminStats(),
      getPlanDistribution(),
      getRegistrationTrend(),
      getRecentUsers(),
    ]);
    if (s) setStats(s);
    if (d) setDistribution(d);
    if (t) setTrend(t);
    if (r) setRecentUsers(r);
  }, []);

  const loadUsers = useCallback(async () => {
    const result = await getAdminUsers(usersPage, PAGE_SIZE, searchQuery);
    setUsers(result.users);
    setUsersTotal(result.total);
  }, [usersPage, searchQuery]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    await loadUsers();
    setRefreshing(false);
  };

  const handleDeleteUser = async (userId, name) => {
    if (!confirm(`"${name}" kullanıcısını silmek istediğine emin misin?`)) return;
    try {
      await deleteUser(userId);
      await loadUsers();
      await loadData();
    } catch (err) {
      alert('Silme başarısız: ' + err.message);
    }
  };

  const tabs = [
    { id: 'dashboard', icon: BarChart3, label: 'Genel Bakış' },
    { id: 'users', icon: Users, label: 'Kullanıcılar' },
    { id: 'analytics', icon: PieChart, label: 'Analizler' },
    { id: 'activity', icon: Activity, label: 'Aktivite' },
  ];

  const totalPages = Math.ceil(usersTotal / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col
        transform transition-transform duration-300 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-blue-500 flex items-center justify-center">
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold font-outfit text-white">Admin Panel</h1>
              <p className="text-[10px] text-slate-500 font-inter">FullBalance</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {tabs.map(tab => (
            <button key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-outfit transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
              }`}>
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={() => navigate('/dashboard')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all cursor-pointer font-outfit">
            <ArrowLeft size={16} />
            Uygulamaya Dön
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-h-screen overflow-y-auto">
        <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50 px-4 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400 hover:text-white cursor-pointer">
                <Menu size={20} />
              </button>
              <h2 className="text-lg font-bold font-outfit text-white">{tabs.find(t => t.id === activeTab)?.label}</h2>
            </div>
            <button onClick={handleRefresh} disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400 hover:text-white transition-all cursor-pointer font-inter disabled:opacity-50">
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              Yenile
            </button>
          </div>
        </header>

        <div className="p-4 lg:p-8">
          <AnimatePresence mode="wait">

            {/* ═══ DASHBOARD ═══ */}
            {activeTab === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <StatCard icon={Users} label="Toplam Kullanıcı" value={stats?.totalUsers ?? '—'} color="#ff6d00" delay={0} />
                  <StatCard icon={UserPlus} label="Bugün Kayıt" value={stats?.todayRegistrations ?? '—'} color="#00b0ff" delay={0.05} />
                  <StatCard icon={Calendar} label="Bu Hafta" value={stats?.weekRegistrations ?? '—'} color="#00e676" delay={0.1} />
                  <StatCard icon={TrendingUp} label="Aylık Büyüme" value={stats?.monthlyGrowth != null ? `%${stats.monthlyGrowth}` : '—'} sub={`${stats?.monthRegistrations ?? 0} yeni kayıt`} color="#ff4081" delay={0.15} />
                </div>

                {/* Trend */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <h3 className="text-sm font-bold font-outfit text-white mb-4">Son 30 Gün — Kayıt Trendi</h3>
                  <div className="h-56 sm:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trend}>
                        <defs>
                          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ff6d00" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#ff6d00" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Area type="monotone" dataKey="count" stroke="#ff6d00" strokeWidth={2} fill="url(#trendGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                {/* Quick stats */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <StatCard icon={Target} label="Plan Oluşturanlar" value={stats?.usersWithPlans ?? '—'}
                    sub={stats ? `%${stats.totalUsers > 0 ? Math.round((stats.usersWithPlans / stats.totalUsers) * 100) : 0} dönüşüm` : ''} color="#7c4dff" delay={0.25} />
                  <StatCard icon={Zap} label="Supabase" value="Aktif" sub="Bağlantı stabil" color="#00e676" delay={0.3} />
                </div>

                {/* Recent Users */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <h3 className="text-sm font-bold font-outfit text-white mb-3 flex items-center gap-2">
                    <Clock size={14} className="text-orange-400" />
                    Son Kayıt Olanlar
                  </h3>
                  <div className="space-y-2">
                    {recentUsers.slice(0, 5).map(u => (
                      <div key={u.id} className="flex items-center justify-between py-2 border-b border-slate-800/30 last:border-0">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-blue-500 flex items-center justify-center text-[10px] font-bold text-white font-outfit">
                            {(u.name || u.email || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs text-white font-outfit font-medium">{u.name || 'İsimsiz'}</p>
                            <p className="text-[10px] text-slate-500 font-inter">{u.email || '-'}</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-500 font-inter">{timeAgo(u.created_at)}</span>
                      </div>
                    ))}
                    {recentUsers.length === 0 && (
                      <p className="text-center text-slate-600 text-xs py-4">Henüz kayıt yok</p>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* ═══ USERS ═══ */}
            {activeTab === 'users' && (
              <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type="text" value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setUsersPage(0); }}
                    placeholder="İsim veya email ile ara..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-orange-500/50 font-inter transition-colors" />
                </div>

                {/* User Cards (mobile-friendly) */}
                <div className="space-y-2">
                  {users.map(u => (
                    <motion.div key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-blue-500 flex items-center justify-center text-sm font-bold text-white font-outfit shrink-0">
                            {(u.name || u.email || '?')[0].toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-white font-outfit font-medium truncate">{u.name || 'İsimsiz'}</p>
                            <p className="text-[11px] text-slate-500 font-inter truncate">{u.email || '-'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <button onClick={() => setDetailUserId(u.id)}
                            className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-blue-400 transition-colors cursor-pointer" title="Detay">
                            <Eye size={16} />
                          </button>
                          <button onClick={() => handleDeleteUser(u.id, u.name || u.email)}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors cursor-pointer" title="Sil">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-2.5 text-[10px] text-slate-500 font-inter">
                        <span>{u.created_at ? new Date(u.created_at).toLocaleDateString('tr-TR') : '-'}</span>
                        <span>•</span>
                        {u.plan_created_at ? (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">Plan Aktif</span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">Plan Yok</span>
                        )}
                        {u.role === 'admin' && (
                          <>
                            <span>•</span>
                            <span className="px-1.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-orange-400">Admin</span>
                          </>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {users.length === 0 && (
                    <div className="text-center py-16 text-slate-500 text-sm font-inter">
                      {searchQuery ? 'Sonuç bulunamadı' : 'Henüz kullanıcı yok'}
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-2 py-3">
                    <p className="text-xs text-slate-500 font-inter">{usersTotal} kullanıcı</p>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setUsersPage(p => Math.max(0, p - 1))} disabled={usersPage === 0}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer transition-colors">
                        <ChevronLeft size={16} />
                      </button>
                      <span className="text-xs text-slate-400 font-inter">{usersPage + 1} / {totalPages}</span>
                      <button onClick={() => setUsersPage(p => Math.min(totalPages - 1, p + 1))} disabled={usersPage >= totalPages - 1}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer transition-colors">
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}

                <AnimatePresence>
                  {detailUserId && <UserDetailModal userId={detailUserId} onClose={() => setDetailUserId(null)} />}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ═══ ANALYTICS ═══ */}
            {activeTab === 'analytics' && (
              <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <MiniDonut data={distribution.goals} colorMap={GOAL_COLORS} title="🎯 Hedef Dağılımı" />
                  <MiniDonut data={distribution.genders} colorMap={GENDER_COLORS} title="👤 Cinsiyet Dağılımı" />
                  <MiniDonut data={distribution.experiences} colorMap={EXP_COLORS} title="💪 Deneyim Seviyesi" />

                  {/* Age Bar Chart */}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                    <h3 className="text-sm font-bold font-outfit text-white mb-2">📊 Yaş Dağılımı</h3>
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={distribution.ages}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <Tooltip content={<ChartTooltip />} />
                          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                            {(distribution.ages || []).map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* ═══ ACTIVITY ═══ */}
            {activeTab === 'activity' && (
              <motion.div key="activity" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                {/* Daily bar */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <h3 className="text-sm font-bold font-outfit text-white mb-4">Günlük Kayıt Aktivitesi</h3>
                  <div className="h-64 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={trend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#ff6d00" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                {/* Summary */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <StatCard icon={Users} label="Toplam" value={stats?.totalUsers ?? '—'} color="#ff6d00" />
                  <StatCard icon={Target} label="Plan Var" value={stats?.usersWithPlans ?? '—'} color="#00b0ff" />
                  <StatCard icon={UserPlus} label="Bu Ay" value={stats?.monthRegistrations ?? '—'} color="#00e676" />
                  <StatCard icon={TrendingUp} label="Büyüme" value={stats?.monthlyGrowth != null ? `%${stats.monthlyGrowth}` : '—'} color="#ff4081" />
                </div>

                {/* Recent Users */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <h3 className="text-sm font-bold font-outfit text-white mb-3 flex items-center gap-2">
                    <Clock size={14} className="text-orange-400" />
                    Son 10 Kayıt
                  </h3>
                  <div className="space-y-2">
                    {recentUsers.map(u => (
                      <div key={u.id} className="flex items-center justify-between py-2 border-b border-slate-800/30 last:border-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-blue-500 flex items-center justify-center text-[10px] font-bold text-white font-outfit shrink-0">
                            {(u.name || u.email || '?')[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-white font-outfit font-medium truncate">{u.name || 'İsimsiz'}</p>
                            <p className="text-[10px] text-slate-500 font-inter truncate">{u.email || '-'}</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-500 font-inter shrink-0 ml-2">{timeAgo(u.created_at)}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
