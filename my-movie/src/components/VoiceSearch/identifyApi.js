import { resolveApiBaseUrl } from '../../api/apiBase';

const API_BASE_URL = resolveApiBaseUrl();
const IDENTIFY_TIMEOUT_MS = 90_000;

/**
 * @param {Blob} audioBlob
 * @returns {Promise<{ matches: Array, meta: object }>}
 */
export const identifyMusicFromAudio = async (audioBlob) => {
  const formData = new FormData();
  const type = audioBlob.type || 'audio/webm';
  const ext = type.includes('ogg') ? 'ogg' : type.includes('mp4') ? 'm4a' : 'webm';
  formData.append('audio', audioBlob, `sample.${ext}`);

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), IDENTIFY_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE_URL}/identify/music`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.message || `Identify failed: ${res.status}`);
    }

    const json = await res.json();
    return {
      matches: Array.isArray(json?.data) ? json.data : [],
      meta: json?.meta || {},
    };
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error('network-error');
    }
    throw err;
  } finally {
    window.clearTimeout(timeoutId);
  }
};
