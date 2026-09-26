/**
 * Mix martasi. POST /api/music/mixes/play
 * Progress yuborishidan alohida. Mehmon yubormaydi.
 */
import { resolveApiBaseUrl } from './apiBase';

const API_BASE_URL = resolveApiBaseUrl();

/**
 * @param {{ contentId: string|number, listenedSeconds: number, sessionId: string }} body
 */
export const postMixPlay = async ({ contentId, listenedSeconds, sessionId }) => {
  const response = await fetch(`${API_BASE_URL}/music/mixes/play`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contentId,
      listenedSeconds,
      sessionId,
    }),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok || payload?.success === false) {
    const err = new Error(payload?.message || 'Mix play request failed');
    err.status = response.status;
    throw err;
  }
  return payload?.data ?? payload;
};

/** Tayyor mixlar. GET /api/music/mixes. Mehmon chaqirmaydi. */
export const fetchMusicMixes = async () => {
  const response = await fetch(`${API_BASE_URL}/music/mixes`, {
    credentials: 'include',
  });
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok || payload?.success === false) {
    const err = new Error(payload?.message || 'Mix request failed');
    err.status = response.status;
    throw err;
  }
  const mixes = payload?.data?.mixes;
  return Array.isArray(mixes) ? mixes : [];
};
