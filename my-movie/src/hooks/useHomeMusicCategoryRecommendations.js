import { useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectIsLoggedIn, selectAuthReady, selectProfile } from '../store/slices/userSlice';
import { fetchViewerMusicCategoryRecommendations } from '../api/musicRecommendationsApi';
import { getListenHistory } from '../utils/guestHistory/musicGuestHistory';
import { GUEST_MUSIC_HISTORY_CHANGED } from '../utils/guestHistory/events';

/** Music Home carousel uchun yetarli */
const HOME_REC_LIMIT = 40;
const HOME_FETCH_CONCURRENCY = 2;
/** Faqat login lazy GET uchun */
const HOME_PENDING_RETRY_DELAYS_MS = [2000, 4000, 8000, 12000, 20000];

/**
 * Cache key: categoryNameMusic + contentType (server scoped cache).
 * @param {string} category
 * @param {string} contentType
 */
export function musicHomeRecKey(category, contentType) {
  return `${String(category || '').trim()}\0${String(contentType || '').trim()}`;
}

/**
 * @template T
 * @param {T[]} items
 * @param {number} concurrency
 * @param {(item: T) => Promise<void>} worker
 */
async function runPool(items, concurrency, worker) {
  let next = 0;
  const runners = Array.from(
    { length: Math.max(1, Math.min(concurrency, items.length || 1)) },
    async () => {
      while (next < items.length) {
        const idx = next;
        next += 1;
        await worker(items[idx]);
      }
    }
  );
  await Promise.all(runners);
}

/**
 * Music Home / detail rails:
 *  - Login → GET (lazy + SWR) — o‘zgarmagan
 *  - Guest → POST /guest (localHistory bo‘sh → trending; bor → blend)
 *
 * @param {Array<{ category: string, contentType: string }>} sectionRequests
 * @returns {{ byKey: Record<string, Array>, isLoading: boolean }}
 */
export function useHomeMusicCategoryRecommendations(sectionRequests = []) {
  const authReady = useAppSelector(selectAuthReady);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const profile = useAppSelector(selectProfile);
  const [byKey, setByKey] = useState({});
  // true by default — authReady oldin katalog flash yo‘q
  const [isLoading, setIsLoading] = useState(true);
  const [guestHistoryEpoch, setGuestHistoryEpoch] = useState(0);

  useEffect(() => {
    const onHistory = () => setGuestHistoryEpoch((n) => n + 1);
    window.addEventListener(GUEST_MUSIC_HISTORY_CHANGED, onHistory);
    return () => window.removeEventListener(GUEST_MUSIC_HISTORY_CHANGED, onHistory);
  }, []);

  const requestsKey = useMemo(() => {
    const unique = new Map();
    for (const req of sectionRequests || []) {
      const category = typeof req?.category === 'string' ? req.category.trim() : '';
      const contentType =
        typeof req?.contentType === 'string' ? req.contentType.trim() : '';
      if (!category || !contentType) continue;
      unique.set(musicHomeRecKey(category, contentType), { category, contentType });
    }
    return [...unique.values()]
      .sort((a, b) =>
        musicHomeRecKey(a.category, a.contentType).localeCompare(
          musicHomeRecKey(b.category, b.contentType)
        )
      )
      .map((r) => musicHomeRecKey(r.category, r.contentType))
      .join('|');
  }, [sectionRequests]);

  const requests = useMemo(() => {
    if (!requestsKey) return [];
    return requestsKey.split('|').map((key) => {
      const [category, contentType] = key.split('\0');
      return { category, contentType };
    });
  }, [requestsKey]);

  useEffect(() => {
    let cancelled = false;
    const retryTimers = [];

    if (!authReady) {
      setByKey({});
      setIsLoading(requests.length > 0);
      return undefined;
    }

    if (!requests.length) {
      setByKey({});
      setIsLoading(false);
      return undefined;
    }

    if (isLoggedIn && !profile?.id) {
      setByKey({});
      setIsLoading(true);
      return undefined;
    }

    setByKey({});
    setIsLoading(true);

    const guestHistory = isLoggedIn ? null : getListenHistory();

    const applyKey = (key, items) => {
      if (cancelled || !items?.length) return;
      setByKey((prev) => {
        if (prev[key] === items) return prev;
        return { ...prev, [key]: items };
      });
    };

    const loadOne = async ({ category, contentType }, attempt = 0) => {
      const key = musicHomeRecKey(category, contentType);
      try {
        const result = await fetchViewerMusicCategoryRecommendations({
          isLoggedIn,
          category,
          contentType,
          limit: HOME_REC_LIMIT,
          lazy: isLoggedIn,
          localHistory: guestHistory ?? undefined,
        });
        if (cancelled) return;

        const items = Array.isArray(result.itemsHydrated) ? result.itemsHydrated : [];
        if (items.length) {
          applyKey(key, items);
          if (
            isLoggedIn &&
            attempt === 0 &&
            (result.source === 'cache_stale' || result.queuedRefresh)
          ) {
            const delay = HOME_PENDING_RETRY_DELAYS_MS[0];
            const timer = setTimeout(() => {
              if (!cancelled) void loadOne({ category, contentType }, 1);
            }, delay);
            retryTimers.push(timer);
          }
          return;
        }

        if (!isLoggedIn) return;

        const pending =
          result.source === 'pending' || Boolean(result.queuedRefresh);
        if (!pending) return;

        const nextAttempt = attempt + 1;
        if (nextAttempt > HOME_PENDING_RETRY_DELAYS_MS.length) return;

        const delay =
          HOME_PENDING_RETRY_DELAYS_MS[
            Math.min(attempt, HOME_PENDING_RETRY_DELAYS_MS.length - 1)
          ];
        const timer = setTimeout(() => {
          if (!cancelled) void loadOne({ category, contentType }, nextAttempt);
        }, delay);
        retryTimers.push(timer);
      } catch {
        /* katalog fallback */
      }
    };

    void (async () => {
      await runPool(requests, HOME_FETCH_CONCURRENCY, (req) => loadOne(req, 0));
      if (!cancelled) setIsLoading(false);
    })();

    return () => {
      cancelled = true;
      retryTimers.forEach((id) => clearTimeout(id));
    };
  }, [authReady, isLoggedIn, profile?.id, requestsKey, requests, guestHistoryEpoch]);

  return { byKey, isLoading };
}
