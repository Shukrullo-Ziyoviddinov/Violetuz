import { useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectIsLoggedIn, selectAuthReady, selectProfile } from '../store/slices/userSlice';
import { fetchMusicCategoryRecommendations } from '../api/musicRecommendationsApi';

/** Music Home carousel uchun yetarli */
const HOME_REC_LIMIT = 40;
const HOME_FETCH_CONCURRENCY = 2;
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
 * Login user uchun Music Home categoryNameMusic bo‘limlariga personalized tartib.
 * Guest / xato → bo‘sh map (katalog fallback).
 *
 * Faqat Music.jsx sectionlari — SimilarSongs / RecommendedClips / AlbumsForYou emas.
 *
 * @param {string[]} categoryNames — categoryNameMusic list
 * @returns {Record<string, Array>}
 */
export function useHomeMusicCategoryRecommendations(categoryNames = []) {
  const authReady = useAppSelector(selectAuthReady);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const profile = useAppSelector(selectProfile);
  const [byCategory, setByCategory] = useState({});

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

    if (!authReady || !isLoggedIn || !profile?.id || !categories.length) {
      setByCategory({});
      return undefined;
    }

    setByCategory({});

    const applyCategory = (category, items) => {
      if (cancelled || !items?.length) return;
      setByCategory((prev) => {
        if (prev[category] === items) return prev;
        return { ...prev, [category]: items };
      });
    };

    const loadOne = async (category, attempt = 0) => {
      try {
        const result = await fetchMusicCategoryRecommendations({
          category,
          limit: HOME_REC_LIMIT,
          lazy: true,
        });
        if (cancelled) return;

        const items = Array.isArray(result.itemsHydrated) ? result.itemsHydrated : [];
        if (items.length) {
          applyCategory(category, items);
          if (
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
        /* katalog fallback */
      }
    };

    void runPool(categories, HOME_FETCH_CONCURRENCY, (category) =>
      loadOne(category, 0)
    );

    return () => {
      cancelled = true;
      retryTimers.forEach((id) => clearTimeout(id));
    };
  }, [authReady, isLoggedIn, profile?.id, categoriesKey, categories]);

  return byCategory;
}

/**
 * Personalized listni section wishlistType bo‘yicha filtrlash.
 * (API category ichida music/album/clip/concert aralashishi mumkin.)
 *
 * @param {Array} items
 * @param {string} contentType — music|album|clip|concert
 * @returns {Array|null}
 */
export function filterMusicRecItemsByContentType(items, contentType) {
  const type = String(contentType || '').trim();
  if (!type || !Array.isArray(items) || !items.length) return null;
  const filtered = items.filter(
    (item) => String(item?.contentType || '').trim() === type
  );
  return filtered.length ? filtered : null;
}
