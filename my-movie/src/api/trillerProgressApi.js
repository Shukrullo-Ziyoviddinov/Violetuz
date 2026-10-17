/**
 * Parda ortida video foizi.
 * Hisob: /api/triller-progress
 * Mehmon: localStorage. Hisobga yuborilmaydi.
 * Kino /recommendations/progress chaqirilmaydi.
 */
import { resolveApiBaseUrl } from './apiBase';
import { recordGuestTrillerProgress } from '../utils/localStorage/trillerGuestProgress';

const API_BASE_URL = resolveApiBaseUrl();

const clamp01 = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.min(1, Math.max(0, num));
};

const resolveRate = ({ completionRate, watchedSeconds, durationSec }) => {
  let rate = clamp01(completionRate);
  const watched = Number(watchedSeconds);
  const duration = Number(durationSec);
  if (Number.isFinite(watched) && watched >= 0 && Number.isFinite(duration) && duration > 0) {
    rate = Math.max(rate, clamp01(watched / duration));
  }
  return rate;
};

const trillerProgressFetch = (path, options = {}) =>
  fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

const parseJson = async (response) => {
  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok || body?.success === false) {
    const err = new Error(body?.message || 'Triller progress request failed');
    err.status = response.status;
    throw err;
  }
  return body?.data ?? body;
};

/**
 * @param {{ trillerId: number, completionRate?: number, watchedSeconds?: number, durationSec?: number }} input
 */
export const reportAccountTrillerProgress = async ({
  trillerId,
  completionRate,
  watchedSeconds,
  durationSec,
} = {}) => {
  const res = await trillerProgressFetch('/triller-progress', {
    method: 'POST',
    body: JSON.stringify({
      trillerId,
      completionRate,
      watchedSeconds,
      durationSec,
    }),
  });
  return parseJson(res);
};

export const fetchAccountTrillerProgress = async () => {
  const res = await trillerProgressFetch('/triller-progress');
  return parseJson(res);
};

/**
 * Mehmon bo‘lsa telefon. Hisob bo‘lsa server.
 * Localdagi eski foizlar hisobga ko‘chirilmaydi.
 */
export const saveTrillerWatchPercent = async ({
  trillerId,
  completionRate,
  watchedSeconds,
  durationSec,
  isLoggedIn,
} = {}) => {
  if (!isLoggedIn) {
    const rate = resolveRate({ completionRate, watchedSeconds, durationSec });
    const stored = recordGuestTrillerProgress(trillerId, rate);
    return { stored: 'local', ok: stored, completionRate: rate };
  }

  const data = await reportAccountTrillerProgress({
    trillerId,
    completionRate,
    watchedSeconds,
    durationSec,
  });
  return { stored: 'account', ...data };
};
