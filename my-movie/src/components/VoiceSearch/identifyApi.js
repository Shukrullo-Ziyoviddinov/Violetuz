import { resolveApiBaseUrl } from '../../api/apiBase';

const API_BASE_URL = resolveApiBaseUrl();

/**
 * @param {Blob} audioBlob
 * @returns {Promise<{ matches: Array, meta: object }>}
 */
export const identifyMusicFromAudio = async (audioBlob) => {
  const formData = new FormData();
  const type = audioBlob.type || 'audio/webm';
  const ext = type.includes('ogg') ? 'ogg' : 'webm';
  formData.append('audio', audioBlob, `sample.${ext}`);

  const res = await fetch(`${API_BASE_URL}/identify/music`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
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
};
