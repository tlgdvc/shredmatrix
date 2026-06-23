import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../i18n/LanguageContext';
import {
  Link2, Unlink, RefreshCw, MapPin, Clock, Flame, TrendingUp,
} from 'lucide-react';
import {
  isStravaConnected, startStravaAuth, disconnectStrava,
  getStravaAthlete, getStravaActivities, getStravaStats,
  getActivityEmoji, formatDuration, formatDistance,
} from '../lib/stravaService';

// ── Strava Connect Card (for Profile tab) ───────────────
export function StravaConnectCard() {
  const { t } = useTranslation();
  const [connected, setConnected] = useState(isStravaConnected());
  const [athlete, setAthlete] = useState(getStravaAthlete());

  const handleConnect = () => startStravaAuth();

  const handleDisconnect = () => {
    disconnectStrava();
    setConnected(false);
    setAthlete(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900 border border-slate-800 rounded-2xl p-5"
    >
      <div className="flex items-center gap-3 mb-4">
        {/* Strava logo */}
        <div className="w-10 h-10 rounded-xl bg-[#FC4C02]/10 border border-[#FC4C02]/20 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#FC4C02">
            <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.599h4.172L10.463 0l-7 13.828h4.169" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-bold font-outfit text-white">
            {t('strava.title')}
          </h3>
          <p className="text-[10px] text-slate-500">
            {connected ? t('strava.connected') : t('strava.notConnected')}
          </p>
        </div>

        {/* Status badge */}
        <div className="ml-auto">
          {connected ? (
            <span className="text-[9px] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              ✅ {t('strava.active')}
            </span>
          ) : (
            <span className="text-[9px] px-2 py-1 rounded-full bg-slate-800 text-slate-500 border border-slate-700/30 font-bold">
              {t('strava.inactive')}
            </span>
          )}
        </div>
      </div>

      {/* Connected state — show athlete info */}
      {connected && athlete && (
        <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-slate-800/40 border border-slate-700/20">
          {athlete.profile_medium && (
            <img
              src={athlete.profile_medium}
              alt={athlete.firstname}
              className="w-10 h-10 rounded-full border-2 border-[#FC4C02]/30"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white font-outfit truncate">
              {athlete.firstname} {athlete.lastname}
            </p>
            <p className="text-[10px] text-slate-500 truncate">
              {athlete.city && `${athlete.city}, `}{athlete.country}
            </p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {connected ? (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleDisconnect}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold cursor-pointer hover:bg-red-500/20 transition-colors"
        >
          <Unlink size={14} />
          {t('strava.disconnect')}
        </motion.button>
      ) : (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleConnect}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#FC4C02] text-white text-xs font-bold cursor-pointer hover:bg-[#e04400] transition-colors shadow-lg shadow-[#FC4C02]/20"
        >
          <Link2 size={14} />
          {t('strava.connect')}
        </motion.button>
      )}
    </motion.div>
  );
}

// ── Strava Activities Panel (for Progress tab) ──────────
export function StravaActivitiesPanel() {
  const { t } = useTranslation();
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isStravaConnected()) { setLoading(false); return; }

    Promise.all([
      getStravaActivities(1, 5).catch(() => []),
      getStravaStats().catch(() => null),
    ]).then(([acts, st]) => {
      setActivities(acts);
      setStats(st);
    }).finally(() => setLoading(false));
  }, []);

  if (!isStravaConnected()) return null;

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#FC4C02">
            <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.599h4.172L10.463 0l-7 13.828h4.169" />
          </svg>
          <h3 className="text-sm font-bold font-outfit text-white">Strava</h3>
        </div>
        <div className="flex justify-center py-6">
          <div className="w-6 h-6 border-2 border-[#FC4C02] border-t-transparent rounded-full animate-spin" />
        </div>
      </motion.div>
    );
  }

  // Aggregate stats
  const recentRuns = stats?.recent_run_totals;
  const recentRides = stats?.recent_ride_totals;
  const allRuns = stats?.all_run_totals;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900 border border-slate-800 rounded-2xl p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#FC4C02">
            <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.599h4.172L10.463 0l-7 13.828h4.169" />
          </svg>
          <h3 className="text-sm font-bold font-outfit text-white">
            {t('strava.activities')}
          </h3>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            getStravaActivities(1, 5).then(setActivities).finally(() => setLoading(false));
          }}
          className="p-1.5 rounded-lg bg-slate-800/50 text-slate-500 hover:text-white transition-colors cursor-pointer"
        >
          <RefreshCw size={12} />
        </button>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {recentRuns && recentRuns.count > 0 && (
            <div className="bg-slate-800/40 border border-slate-700/20 rounded-xl p-2.5 text-center">
              <p className="text-[9px] text-slate-500 mb-0.5">🏃 {t('strava.runs')}</p>
              <p className="text-sm font-bold text-white font-outfit">
                {formatDistance(recentRuns.distance)}
              </p>
              <p className="text-[8px] text-slate-600">{t('strava.last4weeks')}</p>
            </div>
          )}
          {recentRides && recentRides.count > 0 && (
            <div className="bg-slate-800/40 border border-slate-700/20 rounded-xl p-2.5 text-center">
              <p className="text-[9px] text-slate-500 mb-0.5">🚴 {t('strava.rides')}</p>
              <p className="text-sm font-bold text-white font-outfit">
                {formatDistance(recentRides.distance)}
              </p>
              <p className="text-[8px] text-slate-600">{t('strava.last4weeks')}</p>
            </div>
          )}
          {allRuns && (
            <div className="bg-slate-800/40 border border-slate-700/20 rounded-xl p-2.5 text-center">
              <p className="text-[9px] text-slate-500 mb-0.5">🏅 {t('strava.totalRuns')}</p>
              <p className="text-sm font-bold text-white font-outfit">{allRuns.count}</p>
              <p className="text-[8px] text-slate-600">{formatDistance(allRuns.distance)}</p>
            </div>
          )}
        </div>
      )}

      {/* Activity List */}
      <div className="space-y-2">
        {activities.length === 0 ? (
          <p className="text-center text-slate-500 text-xs py-4">{t('strava.noActivities')}</p>
        ) : (
          activities.map((act, i) => (
            <motion.div
              key={act.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/15 hover:border-[#FC4C02]/20 transition-colors"
            >
              <span className="text-lg">{getActivityEmoji(act.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{act.name}</p>
                <p className="text-[9px] text-slate-500">
                  {new Date(act.start_date_local).toLocaleDateString('tr-TR', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </p>
              </div>
              <div className="flex items-center gap-3 text-[9px] text-slate-400 shrink-0">
                {act.distance > 0 && (
                  <span className="flex items-center gap-0.5">
                    <MapPin size={10} className="text-[#FC4C02]" />
                    {formatDistance(act.distance)}
                  </span>
                )}
                <span className="flex items-center gap-0.5">
                  <Clock size={10} className="text-blue-400" />
                  {formatDuration(act.moving_time)}
                </span>
                {act.total_elevation_gain > 0 && (
                  <span className="flex items-center gap-0.5">
                    <TrendingUp size={10} className="text-emerald-400" />
                    {Math.round(act.total_elevation_gain)}m
                  </span>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
