import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, Users, PieChart, Activity, Settings, LogOut, Search,
  TrendingUp, UserPlus, Calendar, Target, ChevronLeft, ChevronRight,
  Trash2, Eye, X, Shield, RefreshCw, Menu, ArrowLeft
} from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart as RechartPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  isAdmin, getAdminStats, getAdminUsers, getPlanDistribution,
  getRegistrationTrend, getUserPlanDetails, deleteUser
} from '../../lib/adminService';

// ── Colors ───────────────────────────────────────
const COLORS = ['#ff6d00', '#00b0ff', '#00e676', '#ff4081', '#7c4dff', '#ffab00', '#00bfa5', '#ff1744'];
const GOAL_COLORS = {
  'Kas Gelişimi': '#ff6d00', 'Muscle Growth': '#ff6d00',
  'Yağ Yakımı': '#00b0ff', 'Fat Loss': '#00b0ff',
  'Yoga': '#00e676', 'Pilates': '#7c4dff',
  'Meditasyon': '#ff4081', 'Meditation': '#ff4081',
  'Reformer': '#ffab00',
};

// ── Stat Card ────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color = '#ff6d00', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-700 transition-colors"
    >
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-[60px] opacity-20" style={{ background: color }} />
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
          <Icon size={18} style={{ color }} />
        </div>
        <span className="text-xs text-slate-500 font-outfit uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-3xl font-extrabold font-outfit text-white">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1 font-inter">{sub}</p>}
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
          <div className="space-y-3">
            {[
              ['İsim', plan.userName],
              ['Hedef', plan.goal],
              ['Yaş', plan.userAge],
              ['Cinsiyet', plan.userGender],
              ['Boy', plan.userHeight ? `${plan.userHeight} cm` : '-'],
              ['Kilo', plan.userWeight ? `${plan.userWeight} kg` : '-'],
              ['Vücut Yağı', plan.userBodyFat ? `%${plan.userBodyFat}` : '-'],
              ['Deneyim', plan.userExperience],
              ['Aktivite', plan.userActivityLevel],
              ['Program', plan.userWorkSchedule],
              ['Bütçe', plan.userBudget],
              ['Kalori', plan.dailyCalories ? `${plan.dailyCalories} kcal` : '-'],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-slate-800/50">
                <span className="text-xs text-slate-500 font-inter">{label}</span>
                <span className="text-sm text-white font-outfit font-medium">{value || '-'}</span>
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

// ═════════════════════════════════════════════════
// Main Admin Panel
// ═════════════════════════════════════════════════
export default function AdminPanel({ user }) {
  // Guard: redirect non-admin users
  if (!user || !isAdmin(user)) return <Navigate to="/dashboard" replace />;

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data states
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [distribution, setDistribution] = useState({ goals: [], genders: [], ages: [] });
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailUserId, setDetailUserId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const PAGE_SIZE = 15;

  // ── Load data ──────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    const [s, d, t] = await Promise.all([
      getAdminStats(),
      getPlanDistribution(),
      getRegistrationTrend(),
    ]);
    if (s) setStats(s);
    if (d) setDistribution(d);
    if (t) setTrend(t);
    setLoading(false);
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

  const handleDeleteUser = async (userId, email) => {
    if (!confirm(`${email} kullanıcısını silmek istediğine emin misin?`)) return;
    try {
      await deleteUser(userId);
      await loadUsers();
      await loadData();
    } catch (err) {
      alert('Silme başarısız: ' + err.message);
    }
  };

  // ── Sidebar items ─────────────────────────────
  const tabs = [
    { id: 'dashboard', icon: BarChart3, label: 'Genel Bakış' },
    { id: 'users', icon: Users, label: 'Kullanıcılar' },
    { id: 'analytics', icon: PieChart, label: 'Analizler' },
    { id: 'activity', icon: Activity, label: 'Aktivite' },
  ];

  const totalPages = Math.ceil(usersTotal / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      {/* ── Mobile Sidebar Overlay ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-slate-900 border-r border-slate-800 flex flex-col
        transform transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
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

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-outfit transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all cursor-pointer font-outfit"
          >
            <ArrowLeft size={16} />
            Uygulamaya Dön
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 min-h-screen overflow-y-auto">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50 px-4 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400 hover:text-white cursor-pointer">
                <Menu size={20} />
              </button>
              <h2 className="text-lg font-bold font-outfit text-white">
                {tabs.find(t => t.id === activeTab)?.label}
              </h2>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400 hover:text-white transition-all cursor-pointer font-inter disabled:opacity-50"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              Yenile
            </button>
          </div>
        </header>

        <div className="p-4 lg:p-8">
          <AnimatePresence mode="wait">
            {/* ═══ DASHBOARD TAB ═══ */}
            {activeTab === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon={Users} label="Toplam Kullanıcı" value={stats?.totalUsers ?? '—'} color="#ff6d00" delay={0} />
                  <StatCard icon={UserPlus} label="Bugün Kayıt" value={stats?.todayRegistrations ?? '—'} color="#00b0ff" delay={0.05} />
                  <StatCard icon={Calendar} label="Bu Hafta" value={stats?.weekRegistrations ?? '—'} color="#00e676" delay={0.1} />
                  <StatCard icon={TrendingUp} label="Aylık Büyüme" value={stats?.monthlyGrowth != null ? `%${stats.monthlyGrowth}` : '—'} sub={`${stats?.monthRegistrations ?? 0} yeni kullanıcı`} color="#ff4081" delay={0.15} />
                </div>

                {/* Registration Trend Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5"
                >
                  <h3 className="text-sm font-bold font-outfit text-white mb-4">Son 30 Gün — Kayıt Trendi</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trend}>
                        <defs>
                          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ff6d00" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#ff6d00" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Area type="monotone" dataKey="count" stroke="#ff6d00" strokeWidth={2} fill="url(#trendGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                {/* Quick info */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <StatCard icon={Target} label="Plan Oluşturanlar" value={stats?.usersWithPlans ?? '—'} sub={stats ? `%${stats.totalUsers > 0 ? Math.round((stats.usersWithPlans / stats.totalUsers) * 100) : 0} dönüşüm oranı` : ''} color="#7c4dff" delay={0.25} />
                  <StatCard icon={Settings} label="Supabase Durumu" value="Aktif" sub="Bağlantı stabil" color="#00e676" delay={0.3} />
                </div>
              </motion.div>
            )}

            {/* ═══ USERS TAB ═══ */}
            {activeTab === 'users' && (
              <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setUsersPage(0); }}
                    placeholder="İsim veya email ile ara..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-orange-500/50 font-inter transition-colors"
                  />
                </div>

                {/* Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-800">
                          <th className="px-4 py-3 text-xs text-slate-500 font-outfit font-medium uppercase tracking-wider">Kullanıcı</th>
                          <th className="px-4 py-3 text-xs text-slate-500 font-outfit font-medium uppercase tracking-wider hidden sm:table-cell">Email</th>
                          <th className="px-4 py-3 text-xs text-slate-500 font-outfit font-medium uppercase tracking-wider hidden md:table-cell">Kayıt Tarihi</th>
                          <th className="px-4 py-3 text-xs text-slate-500 font-outfit font-medium uppercase tracking-wider hidden lg:table-cell">Plan</th>
                          <th className="px-4 py-3 text-xs text-slate-500 font-outfit font-medium uppercase tracking-wider text-right">İşlem</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {users.map(u => (
                          <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white font-outfit">
                                  {(u.name || u.email || '?')[0].toUpperCase()}
                                </div>
                                <span className="text-sm text-white font-outfit font-medium">{u.name || 'İsimsiz'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-400 font-inter hidden sm:table-cell">{u.email}</td>
                            <td className="px-4 py-3 text-sm text-slate-500 font-inter hidden md:table-cell">
                              {u.created_at ? new Date(u.created_at).toLocaleDateString('tr-TR') : '-'}
                            </td>
                            <td className="px-4 py-3 hidden lg:table-cell">
                              {u.plan_created_at ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-inter">Aktif</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 text-xs font-inter">Yok</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center gap-1 justify-end">
                                <button
                                  onClick={() => setDetailUserId(u.id)}
                                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-blue-400 transition-colors cursor-pointer"
                                  title="Detay"
                                >
                                  <Eye size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u.id, u.email)}
                                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                                  title="Sil"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {users.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-4 py-12 text-center text-slate-500 text-sm font-inter">
                              {searchQuery ? 'Sonuç bulunamadı' : 'Henüz kullanıcı yok'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
                      <p className="text-xs text-slate-500 font-inter">{usersTotal} kullanıcı</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setUsersPage(p => Math.max(0, p - 1))}
                          disabled={usersPage === 0}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer transition-colors"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <span className="text-xs text-slate-400 font-inter">{usersPage + 1} / {totalPages}</span>
                        <button
                          onClick={() => setUsersPage(p => Math.min(totalPages - 1, p + 1))}
                          disabled={usersPage >= totalPages - 1}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer transition-colors"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Detail Modal */}
                <AnimatePresence>
                  {detailUserId && (
                    <UserDetailModal userId={detailUserId} onClose={() => setDetailUserId(null)} />
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ═══ ANALYTICS TAB ═══ */}
            {activeTab === 'analytics' && (
              <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                {/* Goal Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                    <h3 className="text-sm font-bold font-outfit text-white mb-4">Hedef Dağılımı</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartPie>
                          <Pie
                            data={distribution.goals}
                            cx="50%" cy="50%"
                            innerRadius={55} outerRadius={85}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {distribution.goals.map((entry, i) => (
                              <Cell key={i} fill={GOAL_COLORS[entry.name] || COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<ChartTooltip />} />
                          <Legend
                            wrapperStyle={{ fontSize: '11px', fontFamily: 'Inter' }}
                            formatter={(value) => <span className="text-slate-400">{value}</span>}
                          />
                        </RechartPie>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>

                  {/* Gender Distribution */}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                    <h3 className="text-sm font-bold font-outfit text-white mb-4">Cinsiyet Dağılımı</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartPie>
                          <Pie
                            data={distribution.genders}
                            cx="50%" cy="50%"
                            innerRadius={55} outerRadius={85}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {distribution.genders.map((entry, i) => (
                              <Cell key={i} fill={i === 0 ? '#00b0ff' : '#ff4081'} />
                            ))}
                          </Pie>
                          <Tooltip content={<ChartTooltip />} />
                          <Legend
                            wrapperStyle={{ fontSize: '11px', fontFamily: 'Inter' }}
                            formatter={(value) => <span className="text-slate-400">{value}</span>}
                          />
                        </RechartPie>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>
                </div>

                {/* Age Distribution */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <h3 className="text-sm font-bold font-outfit text-white mb-4">Yaş Dağılımı</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={distribution.ages}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                          {distribution.ages.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* ═══ ACTIVITY TAB ═══ */}
            {activeTab === 'activity' && (
              <motion.div key="activity" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                {/* Registration Trend - larger */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <h3 className="text-sm font-bold font-outfit text-white mb-4">Günlük Kayıt Aktivitesi</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={trend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#ff6d00" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon={Users} label="Toplam" value={stats?.totalUsers ?? '—'} color="#ff6d00" />
                  <StatCard icon={Target} label="Plan Var" value={stats?.usersWithPlans ?? '—'} color="#00b0ff" />
                  <StatCard icon={UserPlus} label="Bu Ay" value={stats?.monthRegistrations ?? '—'} color="#00e676" />
                  <StatCard icon={TrendingUp} label="Büyüme" value={stats?.monthlyGrowth != null ? `%${stats.monthlyGrowth}` : '—'} color="#ff4081" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
