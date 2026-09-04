import { useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectIsLoggedIn, selectAuthReady, selectProfile } from '../store/slices/userSlice';
import { fetchCategoryRecommendations } from '../api/recommendationsApi';

/** Home carousel uchun yetarli; DEFAULT_LIMIT=10 */
const HOME_REC_LIMIT = 40;

/**
 * Login user uchun home categoryName bo‘limlariga personalized tartib.
 * Guest / xato → bo‘sh map (katalog fallback).
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

    if (!authReady || !isLoggedIn || !profile?.id || !categories.length) {
      setByCategory({});
      return undefined;
    }

    Promise.all(
      categories.map((category) =>
        fetchCategoryRecommendations({ category, limit: HOME_REC_LIMIT })
          .then((result) => {
            const movies = Array.isArray(result.movies) ? result.movies : [];
            return [category, movies.length ? movies : null];
          })
          .catch(() => [category, null])
      )
    ).then((pairs) => {
      if (cancelled) return;
      const next = {};
      for (const [category, movies] of pairs) {
        if (movies?.length) next[category] = movies;
      }
      setByCategory(next);
    });

    return () => {
      cancelled = true;
    };
  }, [authReady, isLoggedIn, profile?.id, categoriesKey, categories]);

  return byCategory;
}
