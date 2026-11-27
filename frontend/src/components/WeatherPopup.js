import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

// Same convention as the other pages: blank = go through the CRA proxy (keeps the login cookie).
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const REFRESH_MS = 10 * 60 * 1000;          // re-fetch every 10 minutes
const MIN_KEY = 'dhara_weather_minimized';  // remembers "minimized" for this browser session

/**
 * Small floating weather card for the user's saved location (bottom-left).
 * - Expanded card <-> compact pill (click the pill / the chevron).
 * - Hidden when logged out, or if the weather service is unreachable.
 * - Shows a gentle "set your location" card when the profile has no location.
 * Move it by changing the `fixed bottom-6 left-6` classes (e.g. `right-6`, `top-24`).
 */
function WeatherPopup() {
  const { t } = useTranslation();
  const [w, setW] = useState(null);
  const [reason, setReason] = useState(null);
  const [loading, setLoading] = useState(true);
  const [minimized, setMinimized] = useState(() => {
    try { return sessionStorage.getItem(MIN_KEY) === '1'; } catch (e) { return false; }
  });

  const load = useCallback(async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/weather`, { withCredentials: true });
      if (res.data.success) {
        setW(res.data);
        setReason(null);
      } else {
        setReason(res.data.reason || 'unavailable');
      }
    } catch (e) {
      setReason('unavailable');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  const setMin = (v) => {
    setMinimized(v);
    try { sessionStorage.setItem(MIN_KEY, v ? '1' : '0'); } catch (e) { /* ignore */ }
  };

  const shell =
    'fixed bottom-6 left-6 z-40 animate-fade-in rounded-2xl border border-green-100 ' +
    'dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md shadow-xl';

  // First request can take a few seconds (geocoding + weather API): show a placeholder, not nothing.
  if (loading) {
    return (
      <div
        className={`${shell} flex items-center gap-2 px-4 py-2.5 text-sm text-gray-500 dark:text-gray-300`}
        data-testid="weather-popup-loading"
      >
        <span className="animate-pulse">🌦️</span>
        <span>{t('weather.loading', 'Loading weather…')}</span>
      </div>
    );
  }

  // ── No location saved / location not found: nudge, don't nag ──────────────
  if (!w && (reason === 'no_location' || reason === 'location_not_found')) {
    return (
      <div className={`${shell} w-64 p-4`} data-testid="weather-popup-setup">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🌦️</span>
          <div className="text-sm text-gray-700 dark:text-gray-200">
            <p className="font-semibold mb-1">
              {t('weather.setupTitle', 'See your local weather')}
            </p>
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              {reason === 'location_not_found'
                ? t('weather.notFound', "We couldn't find your saved location.")
                : t('weather.noLocation', 'Add your village or city to your profile.')}
            </p>
            <Link to="/profile" className="text-green-600 dark:text-green-400 font-semibold hover:underline">
              {t('weather.goProfile', 'Open Profile →')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Service unreachable and nothing cached: show a small retry button instead of vanishing.
  if (!w && reason === 'unavailable') {
    return (
      <button
        onClick={() => { setLoading(true); load(); }}
        className={`${shell} flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:shadow-2xl transition-all`}
        data-testid="weather-popup-error"
      >
        <span>🌦️</span>
        <span>{t('weather.unavailable', 'Weather unavailable')}</span>
        <span className="text-green-600 dark:text-green-400 font-semibold">↻</span>
      </button>
    );
  }

  // Logged out: show nothing.
  if (!w) return null;

  // ── Minimized pill ────────────────────────────────────────────────────────
  if (minimized) {
    return (
      <button
        onClick={() => setMin(false)}
        className={`${shell} flex items-center gap-2 px-4 py-2.5 hover:shadow-2xl hover:-translate-y-0.5 transition-all`}
        aria-label={t('weather.expand', 'Show weather')}
        data-testid="weather-popup-pill"
      >
        <span className="text-xl">{w.icon}</span>
        <span className="font-bold text-gray-800 dark:text-gray-100">{Math.round(w.temperature)}°C</span>
        <span className="text-xs text-gray-500 dark:text-gray-400 max-w-[90px] truncate">{w.place}</span>
      </button>
    );
  }

  // ── Expanded card ─────────────────────────────────────────────────────────
  return (
    <div className={`${shell} w-72 p-4`} data-testid="weather-popup">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-200 min-w-0">
          <span>📍</span>
          <span className="truncate">{w.place}</span>
        </div>
        <button
          onClick={() => setMin(true)}
          className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:text-white dark:hover:bg-slate-700 transition-colors"
          aria-label={t('weather.minimize', 'Minimize weather')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Current conditions */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-5xl leading-none">{w.icon}</span>
        <div>
          <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
            {Math.round(w.temperature)}°C
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">{w.condition}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500">
            {t('weather.feelsLike', 'Feels like')} {Math.round(w.feels_like)}°C
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2 text-center mb-3">
        <div className="rounded-xl bg-green-50 dark:bg-slate-700/60 py-2">
          <div className="text-sm">💧</div>
          <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">{w.humidity}%</div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400">{t('weather.humidity', 'Humidity')}</div>
        </div>
        <div className="rounded-xl bg-green-50 dark:bg-slate-700/60 py-2">
          <div className="text-sm">💨</div>
          <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">{w.wind_kmh} km/h</div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400">{t('weather.wind', 'Wind')}</div>
        </div>
        <div className="rounded-xl bg-green-50 dark:bg-slate-700/60 py-2">
          <div className="text-sm">🌧️</div>
          <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">{w.rain_chance ?? 0}%</div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400">{t('weather.rainChance', 'Rain today')}</div>
        </div>
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        {t('weather.today', 'Today')}: ↑ {w.high}° &nbsp; ↓ {w.low}°
      </div>

      {/* Next days */}
      {w.forecast?.length > 0 && (
        <div className="grid grid-cols-3 gap-2 border-t border-gray-100 dark:border-slate-700 pt-2">
          {w.forecast.map((f) => (
            <div key={f.day} className="text-center" title={f.condition}>
              <div className="text-[11px] text-gray-500 dark:text-gray-400">{f.day}</div>
              <div className="text-lg">{f.icon}</div>
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-200">{f.high}° / {f.low}°</div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500">
        <span>
          {w.stale
            ? t('weather.stale', 'Last known data') + ` · ${w.fetched_at}`
            : `${t('weather.updated', 'Updated')} ${w.fetched_at}`}
        </span>
        <span>Open-Meteo</span>
      </div>
    </div>
  );
}

export default WeatherPopup;