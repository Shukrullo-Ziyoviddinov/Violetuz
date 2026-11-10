import { resolveApiBaseUrl } from '../api/apiBase';
import { createGuestTrailerProgressStore } from './progress/guestTrailerProgress';
import { createGuestTrailerSignalStore } from './signals/guestTrailerSignals';
import { getWatchHistory } from '../utils/localStorage/guestHistory/movieGuestHistory';

export async function fetchTrailerFeedPage({ isLoggedIn, signal, cursor, offset, limit }) {
  if (typeof isLoggedIn !== 'boolean') throw new TypeError('Resolved authentication state is required');
  const history = isLoggedIn ? undefined : {
    sessions: createGuestTrailerProgressStore().history().slice(0, 200),
    actions: createGuestTrailerSignalStore().history().slice(0, 600),
    movieHistory: getWatchHistory().slice(0, 200),
  };
  // Stay below the server's 256 KB JSON limit even with many played intervals.
  // Local stores are newest-first; trim only the request, never local history.
  if (history) {
    while (new TextEncoder().encode(JSON.stringify(history)).length > 200_000) {
      const key = ['sessions', 'actions', 'movieHistory'].find((name) => history[name].length);
      if (!key) break;
      history[key].pop();
    }
  }
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  if (offset != null) params.set('offset', String(offset));
  if (limit != null) params.set('limit', String(limit));
  const query = params.toString() ? `?${params}` : '';
  const response = await fetch(`${resolveApiBaseUrl()}/trailer-home-feed${isLoggedIn ? '' : '/guest'}${query}`, {
    method: isLoggedIn ? 'GET' : 'POST', credentials: 'include', signal,
    ...(history ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(history) } : {}),
  });
  const body = await response.json();
  if (!response.ok || body?.success === false) {
    const error = new Error(body?.message || 'Trailer feed request failed');
    error.status = response.status;
    throw error;
  }
  const items = Array.isArray(body?.data?.items) ? body.data.items : [];
  return {
    items,
    nextCursor: body?.data?.nextCursor || null,
    pageCursor: body?.data?.pageCursor || null,
    hasMore: body?.data?.hasMore === true,
    nextOffset: Number.isFinite(body?.data?.nextOffset) ? body.data.nextOffset : items.length,
  };
}

export async function fetchTrailerHomeFeed(options) {
  return (await fetchTrailerFeedPage(options)).items;
}
