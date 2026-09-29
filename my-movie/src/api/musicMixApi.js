/**
 * Mix martasi. POST /api/music/mixes/play
 * Progress yuborishidan alohida. Mehmon yubormaydi.
 */
import { resolveApiBaseUrl } from './apiBase';

const API_BASE_URL = resolveApiBaseUrl();

/**
 * @param {{ contentId: string|number, listenedSeconds: number, sessionId: string, durationSec?: number, contentType?: string }} body
 */
export const postMixPlay = async ({
  contentId,
  listenedSeconds,
  sessionId,
  durationSec,
  contentType,
}) => {
  const response = await fetch(`${API_BASE_URL}/music/mixes/play`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contentId,
      listenedSeconds,
      sessionId,
      durationSec,
      ...(contentType ? { contentType } : {}),
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

/**
 * Egasining mixidan share token.
 * POST /api/music/mixes/share (auth).
 * @param {{ genre: string, contentType?: string }} body
 */
export const createMixShare = async ({ genre, contentType }) => {
  const response = await fetch(`${API_BASE_URL}/music/mixes/share`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      genre,
      ...(contentType ? { contentType } : {}),
    }),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok || payload?.success === false) {
    const err = new Error(payload?.message || 'Mix share create failed');
    err.status = response.status;
    throw err;
  }
  return payload?.data ?? null;
};

/**
 * Share snapshot. GET /api/music/mixes/share/:token
 * Public — mehmon ham o'qiydi. Bazaga yozilmaydi.
 * @param {string} token
 */
export const fetchMixShare = async (token) => {
  const key = String(token || '').trim();
  if (!key) return null;

  const response = await fetch(
    `${API_BASE_URL}/music/mixes/share/${encodeURIComponent(key)}`,
    { credentials: 'include' }
  );
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok || payload?.success === false) {
    const err = new Error(payload?.message || 'Mix share not found');
    err.status = response.status;
    throw err;
  }
  return payload?.data ?? null;
};
