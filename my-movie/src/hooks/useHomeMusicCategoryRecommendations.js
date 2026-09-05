import { useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectIsLoggedIn, selectAuthReady, selectProfile } from '../store/slices/userSlice';
import { fetchMusicCategoryRecommendations } from '../api/musicRecommendationsApi';

/** Music Home carousel uchun yetarli */
const HOME_REC_LIMIT = 40;
const HOME_FETCH_CONCURRENCY = 2;
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
 * Login user uchun Music Home sectionlari — category × contentType scoped.
 * Guest / xato → bo‘sh map (katalog fallback).
 *
 * Faqat Music.jsx sectionlari — SimilarSongs / RecommendedClips / AlbumsForYou emas.
 *
 * @param {Array<{ category: string, contentType: string }>} sectionRequests
 * @returns {Record<string, Array>} map keyed by musicHomeRecKey(category, contentType)
 */
export function useHomeMusicCategoryRecommendations(sectionRequests = []) {
  const authReady = useAppSelector(selectAuthReady);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const profile = useAppSelector(selectProfile);
  const [byKey, setByKey] = useState({});

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

    if (!authReady || !isLoggedIn || !profile?.id || !requests.length) {
      setByKey({});
      return undefined;
    }

    setByKey({});

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
        const result = await fetchMusicCategoryRecommendations({
          category,
          contentType,
          limit: HOME_REC_LIMIT,
          lazy: true,
        });
        if (cancelled) return;

        const items = Array.isArray(result.itemsHydrated) ? result.itemsHydrated : [];
        if (items.length) {
          applyKey(key, items);
          if (
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

    void runPool(requests, HOME_FETCH_CONCURRENCY, (req) => loadOne(req, 0));

    return () => {
      cancelled = true;
      retryTimers.forEach((id) => clearTimeout(id));
    };
  }, [authReady, isLoggedIn, profile?.id, requestsKey, requests]);

  return byKey;
}
