/**
 * Music / klip / albom "Shunga o'xshash" — GET /music/:id/similar (cache).
 * recommendation-music / movie-similar API lariga ulanmaydi.
 */
import { resolveApiBaseUrl } from './apiBase';

const API_BASE_URL = resolveApiBaseUrl();

/**
 * @param {string|number} id
 * @param {{ type?: 'music'|'klip'|'album', limit?: number }} [options]
 * @returns {Promise<object[]>}
 */
export const fetchSimilarMusicItems = async (id, options = {}) => {
  const sourceId = id == null ? '' : String(id).trim();
  if (!sourceId) return [];

  const params = new URLSearchParams();
  const type = String(options.type || 'music')
    .trim()
    .toLowerCase();
  if (type) params.set('type', type);

  const limit = Number(options.limit);
  if (Number.isFinite(limit) && limit > 0) {
    params.set('limit', String(Math.floor(limit)));
  }

  const query = params.toString();
  const url = `${API_BASE_URL}/music/${encodeURIComponent(sourceId)}/similar${
    query ? `?${query}` : ''
  }`;

  const response = await fetch(url, { credentials: 'include' });
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok || payload?.success === false) {
    const err = new Error(payload?.message || 'Similar music request failed');
    err.status = response.status;
    throw err;
  }

  const items = payload?.data?.items;
  return Array.isArray(items) ? items : [];
};
