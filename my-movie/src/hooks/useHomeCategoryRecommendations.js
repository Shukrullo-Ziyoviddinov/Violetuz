import { useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectIsLoggedIn, selectAuthReady, selectProfile } from '../store/slices/userSlice';
import { fetchViewerCategoryRecommendations } from '../api/recommendationsApi';
import { getWatchHistory } from '../utils/localStorage/guestHistory/movieGuestHistory';
import { GUEST_MOVIE_HISTORY_CHANGED } from '../utils/localStorage/guestHistory/events';

/** Home carousel uchun yetarli; DEFAULT_LIMIT=10 */
const HOME_REC_LIMIT = 40;
/** Parallel sync stampede oldini olish */
const HOME_FETCH_CONCURRENCY = 2;
/**
 * pending / queuedRefresh — SWR poll backoff (ms).
 * Bitta 4s emas: bir necha urinish, oxirgi gacha kutadi.
 * Faqat login lazy GET uchun.
 */
const HOME_PENDING_RETRY_DELAYS_MS = [2000, 4000, 8000, 12000, 20000];

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
 * Home categoryName bo‘limlari:
 *  - Login → GET (lazy + SWR) — o‘zgarmagan
 *  - Guest → POST /guest (localHistory bo‘sh → trending; bor → blend)
 *
 * Katalog faqat fetch tugagach / xatoda fallback.
 * authReady=false paytida isLoading=true — katalog flash yo‘q.
 *
 * @param {string[]} categoryNames
 * @returns {{ byCategory: Record<string, Array>, isLoading: boolean }}
 */
export function useHomeCategoryRecommendations(categoryNames = []) {
  const authReady = useAppSelector(selectAuthReady);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const profile = useAppSelector(selectProfile);
  const [byCategory, setByCategory] = useState({});
  // true by default — authReady oldin katalog flash yo‘q
  const [isLoading, setIsLoading] = useState(true);
  const [guestHistoryEpoch, setGuestHistoryEpoch] = useState(0);

  useEffect(() => {
    const onHistory = () => setGuestHistoryEpoch((n) => n + 1);
    window.addEventListener(GUEST_MOVIE_HISTORY_CHANGED, onHistory);
    return () => window.removeEventListener(GUEST_MOVIE_HISTORY_CHANGED, onHistory);
  }, []);

  const categoriesKey = useMemo(() => {
    const unique = [
      ...new Set(
        (categoryNames || [])
          .map((name) => (typeof name === 'string' ? name.trim() : ''))
          .filter(Boolean)
      ),
    ].sort();
    return unique.join('\0');
  }, [categoryNames]);

  const categories = useMemo(
    () => (categoriesKey ? categoriesKey.split('\0') : []),
    [categoriesKey]
  );

  useEffect(() => {
    let cancelled = false;
    const retryTimers = [];

    // authReady oldin: katalog flash emas — loading ushlab turiladi
    if (!authReady) {
      setByCategory({});
      setIsLoading(categories.length > 0);
      return undefined;
    }

    if (!categories.length) {
      setByCategory({});
      setIsLoading(false);
      return undefined;
    }

    // Login: profile kelmaguncha kutish (katalog flash yo‘q)
    if (isLoggedIn && !profile?.id) {
      setByCategory({});
      setIsLoading(true);
      return undefined;
    }

    setByCategory({});
    setIsLoading(true);

    const applyCategory = (category, movies) => {
      if (cancelled || !movies?.length) return;
      setByCategory((prev) => {
        if (prev[category] === movies) return prev;
        return { ...prev, [category]: movies };
      });
    };

    // Snapshot once per effect — guest history for all category POSTs
    const guestHistory = isLoggedIn ? null : getWatchHistory();

    /**
     * @param {string} category
     * @param {number} attempt — 0 = first fetch (login pending only)
     */
    const loadOne = async (category, attempt = 0) => {
      try {
        const result = await fetchViewerCategoryRecommendations({
          isLoggedIn,
          category,
          limit: HOME_REC_LIMIT,
          lazy: isLoggedIn,
          localHistory: guestHistory ?? undefined,
        });
        if (cancelled) return;

        const movies = Array.isArray(result.movies) ? result.movies : [];
        if (movies.length) {
          applyCategory(category, movies);
          // Login SWR only
          if (
            isLoggedIn &&
            attempt === 0 &&
            (result.source === 'cache_stale' || result.queuedRefresh)
          ) {
            const delay = HOME_PENDING_RETRY_DELAYS_MS[0];
            const timer = setTimeout(() => {
              if (!cancelled) void loadOne(category, 1);
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
          if (!cancelled) void loadOne(category, nextAttempt);
        }, delay);
        retryTimers.push(timer);
      } catch {
        /* katalog fallback after isLoading=false */
      }
    };

    void (async () => {
      await runPool(categories, HOME_FETCH_CONCURRENCY, (category) =>
        loadOne(category, 0)
      );
      if (!cancelled) setIsLoading(false);
    })();

    return () => {
      cancelled = true;
      retryTimers.forEach((id) => clearTimeout(id));
    };
  }, [authReady, isLoggedIn, profile?.id, categoriesKey, categories, guestHistoryEpoch]);

  return { byCategory, isLoading };
}
