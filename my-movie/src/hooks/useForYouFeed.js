import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectAuthReady, selectIsLoggedIn, selectProfile } from '../store/slices/userSlice';
import { fetchViewerHomeFeedPage } from '../api/homeFeedApi';
import { getWatchHistory } from '../utils/localStorage/guestHistory/movieGuestHistory';
import { GUEST_MOVIE_HISTORY_CHANGED } from '../utils/localStorage/guestHistory/events';
import { usePagedList } from '../paged-list/usePagedList';

const historyKeyOf = (history) =>
  (Array.isArray(history) ? history : [])
    .map((row) => `${row?.m ?? ''}:${row?.t ?? ''}:${row?.r ?? ''}`)
    .join(',');

/**
 * Filtrsiz "Siz uchun" lentasi.
 * Home va tavsiya sahifasi bitta keshni o‘qiydi.
 * maxItems berilsa shu ekran o‘sha songacha so‘raydi.
 */
export function useForYouFeed({ enabled = true, maxItems = null, getLimit } = {}) {
  const authReady = useAppSelector(selectAuthReady);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const profileId = useAppSelector(selectProfile)?.id;
  const [historyEpoch, setHistoryEpoch] = useState(0);

  useEffect(() => {
    if (isLoggedIn) return undefined;
    const onHistory = () => setHistoryEpoch((value) => value + 1);
    window.addEventListener(GUEST_MOVIE_HISTORY_CHANGED, onHistory);
    return () => window.removeEventListener(GUEST_MOVIE_HISTORY_CHANGED, onHistory);
  }, [isLoggedIn]);

  const historyKey = useMemo(
    () => (isLoggedIn ? '' : historyKeyOf(getWatchHistory())),
    [historyEpoch, isLoggedIn]
  );

  const viewerKey = isLoggedIn ? `user:${profileId || ''}` : `guest:${historyKey}`;
  const ready = authReady && (!isLoggedIn || Boolean(profileId));

  const readLimit = useCallback(() => {
    const requested = Number(getLimit?.() ?? 0);
    return requested > 0 ? Math.floor(requested) : 0;
  }, [getLimit]);

  const canFetch = Boolean(enabled && ready && readLimit() > 0);

  const paged = usePagedList({
    queryKey: ['for-you-feed', viewerKey],
    enabled: canFetch,
    getLimit: readLimit,
    fetchPage: async ({ offset, limit }) => {
      const page = await fetchViewerHomeFeedPage({
        isLoggedIn,
        localHistory: isLoggedIn ? undefined : getWatchHistory(),
        offset,
        limit,
      });
      return {
        items: page.movies,
        hasMore: page.hasMore,
        nextOffset: page.nextOffset,
      };
    },
  });

  const capped = maxItems != null && paged.items.length >= maxItems;
  const items = maxItems != null ? paged.items.slice(0, maxItems) : paged.items;

  const fetchNextPage = useCallback((limit) => {
    if (maxItems != null && paged.items.length >= maxItems) return Promise.resolve(undefined);
    const requested = Number(limit ?? readLimit());
    if (!(requested > 0)) return Promise.resolve(undefined);
    const room = maxItems == null
      ? Math.floor(requested)
      : Math.min(Math.floor(requested), maxItems - paged.items.length);
    if (!(room > 0)) return Promise.resolve(undefined);
    return paged.fetchNextPage(room);
  }, [maxItems, paged, readLimit]);

  return {
    items,
    hasMore: capped ? false : paged.hasMore,
    isLoading: Boolean(enabled && (!ready || paged.isLoading)),
    isFetchingNextPage: paged.isFetchingNextPage,
    fetchNextPage,
    error: paged.error,
  };
}
