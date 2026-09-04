import { useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectIsLoggedIn, selectAuthReady, selectProfile } from '../store/slices/userSlice';
import { fetchCategoryRecommendations } from '../api/recommendationsApi';

/** Home carousel uchun yetarli; DEFAULT_LIMIT=10 */
const HOME_REC_LIMIT = 40;
/** Parallel sync stampede oldini olish */
const HOME_FETCH_CONCURRENCY = 2;
/** pending bo‘lsa qisqa poll (SWR warm) */
const HOME_PENDING_RETRY_MS = 4000;

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
 * Login user uchun home categoryName bo‘limlariga personalized tartib.
 * Guest / xato → bo‘sh map (katalog fallback).
 *
 * Cold-start: lazy=1 (server sync o‘rniga queue) + concurrency limit +
 * progressive SWR (kelgan category darhol UI’ga).
 *
 * @param {string[]} categoryNames
 * @returns {Record<string, Array>}
 */
export function useHomeCategoryRecommendations(categoryNames = []) {
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

    const applyCategory = (category, movies) => {
      if (cancelled || !movies?.length) return;
      setByCategory((prev) => {
        if (prev[category] === movies) return prev;
        return { ...prev, [category]: movies };
      });
    };

    const loadOne = async (category, { allowRetry } = { allowRetry: true }) => {
      try {
        const result = await fetchCategoryRecommendations({
          category,
          limit: HOME_REC_LIMIT,
          lazy: true,
        });
        if (cancelled) return;

        const movies = Array.isArray(result.movies) ? result.movies : [];
        if (movies.length) {
          applyCategory(category, movies);
          return;
        }

        // pending: fon precompute — bir marta qisqa qayta so‘rov
        if (allowRetry && (result.source === 'pending' || result.queuedRefresh)) {
          const timer = setTimeout(() => {
            if (!cancelled) void loadOne(category, { allowRetry: false });
          }, HOME_PENDING_RETRY_MS);
          retryTimers.push(timer);
        }
      } catch {
        /* katalog fallback */
      }
    };

    void runPool(categories, HOME_FETCH_CONCURRENCY, (category) =>
      loadOne(category, { allowRetry: true })
    );

    return () => {
      cancelled = true;
      retryTimers.forEach((id) => clearTimeout(id));
    };
  }, [authReady, isLoggedIn, profile?.id, categoriesKey, categories]);

  return byCategory;
}
