/**
 * Detal "tavsiya etilgan" qatori.
 * GET /api/detail-recommend — cookie.
 * POST /api/detail-recommend/guest — localHistory, bazaga yozilmaydi.
 * music-similar va home-feed klientiga ulanmaydi.
 */
import { resolveApiBaseUrl } from './apiBase';
import { getListenHistory } from '../utils/localStorage/guestHistory/musicGuestHistory';

const API_BASE_URL = resolveApiBaseUrl();

const isSong = (row) => {
  const type = String(row?.type || 'music').trim().toLowerCase();
  return type === 'music' || type === '';
};

const musicRows = (localHistory) =>
  (Array.isArray(localHistory) ? localHistory : []).filter((row) => row?.ct === 'music');

const isClip = (row) => {
  const type = String(row?.type || '').trim().toLowerCase();
  return type === 'klip' || type === 'clip';
};

const clipRows = (localHistory) =>
  (Array.isArray(localHistory) ? localHistory : []).filter((row) => row?.ct === 'clip');

const detailRecommendFetch = (path, options = {}) =>
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
    const err = new Error(body?.message || 'Detail recommend request failed');
    err.status = response.status;
    throw err;
  }
  return body?.data ?? body;
};

const songsFrom = (data) => {
  if (data?.resultType !== 'music') return [];
  return (Array.isArray(data.items) ? data.items : []).filter(isSong);
};

export const fetchLoginDetailRecommend = async ({ pageType, pageId }) => {
  const params = new URLSearchParams({
    type: String(pageType || '').trim(),
    id: String(pageId ?? '').trim(),
  });
  const res = await detailRecommendFetch(`/detail-recommend?${params}`);
  const data = await parseJson(res);
  return { resultType: 'music', items: songsFrom(data) };
};

export const fetchGuestDetailRecommend = async ({ pageType, pageId, localHistory = [] }) => {
  const res = await detailRecommendFetch('/detail-recommend/guest', {
    method: 'POST',
    body: JSON.stringify({
      type: String(pageType || '').trim(),
      id: pageId,
      localHistory: musicRows(localHistory),
    }),
  });
  const data = await parseJson(res);
  return { resultType: 'music', items: songsFrom(data) };
};

export const fetchViewerDetailRecommend = async ({
  pageType,
  pageId,
  isLoggedIn,
  localHistory,
} = {}) => {
  const input = { pageType, pageId };
  if (isLoggedIn) return fetchLoginDetailRecommend(input);
  const history = localHistory != null ? localHistory : getListenHistory();
  return fetchGuestDetailRecommend({ ...input, localHistory: history });
};

const clipsFrom = (data) => {
  if (data?.resultType !== 'klip') return [];
  return (Array.isArray(data.items) ? data.items : []).filter(isClip);
};

const fetchDetailPage = async ({ pageType, pageId, isLoggedIn, localHistory, historyRows }) => {
  const type = String(pageType || '').trim();
  const id = String(pageId ?? '').trim();
  if (isLoggedIn) {
    const params = new URLSearchParams({ type, id });
    const res = await detailRecommendFetch(`/detail-recommend?${params}`);
    return parseJson(res);
  }
  const history = localHistory != null ? localHistory : getListenHistory();
  const res = await detailRecommendFetch('/detail-recommend/guest', {
    method: 'POST',
    body: JSON.stringify({
      type,
      id: pageId,
      localHistory: historyRows(history),
    }),
  });
  return parseJson(res);
};

export const fetchViewerDetailClips = async ({
  pageType,
  pageId,
  isLoggedIn,
  localHistory,
} = {}) => {
  const data = await fetchDetailPage({
    pageType,
    pageId,
    isLoggedIn,
    localHistory,
    historyRows: clipRows,
  });
  return { resultType: 'klip', items: clipsFrom(data) };
};
