import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleStravaCallback } from '../lib/stravaService';
import { motion } from 'framer-motion';

export default function StravaCallback() {
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const err = params.get('error');

    if (err) {
      setStatus('error');
      setError(err === 'access_denied' ? 'Strava erişimi reddedildi.' : err);
      return;
    }

    if (!code) {
      setStatus('error');
      setError('Yetkilendirme kodu bulunamadı.');
      return;
    }

    handleStravaCallback(code)
      .then(() => {
        setStatus('success');
        setTimeout(() => navigate('/', { replace: true }), 1500);
      })
      .catch((e) => {
        setStatus('error');
        setError(e.message);
      });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-sm w-full text-center"
      >
        {status === 'loading' && (
          <>
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-lg font-bold font-outfit text-white mb-1">Strava Bağlanıyor...</h2>
            <p className="text-sm text-slate-500">Lütfen bekleyin</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-5xl mb-3">✅</div>
            <h2 className="text-lg font-bold font-outfit text-emerald-400 mb-1">Strava Bağlandı!</h2>
            <p className="text-sm text-slate-500">Yönlendiriliyorsunuz...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-5xl mb-3">❌</div>
            <h2 className="text-lg font-bold font-outfit text-red-400 mb-1">Bağlantı Hatası</h2>
            <p className="text-sm text-slate-500 mb-4">{error}</p>
            <button
              onClick={() => navigate('/', { replace: true })}
              className="px-4 py-2 rounded-xl bg-slate-800 text-white text-sm font-bold cursor-pointer hover:bg-slate-700 transition-colors"
            >
              Geri Dön
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
