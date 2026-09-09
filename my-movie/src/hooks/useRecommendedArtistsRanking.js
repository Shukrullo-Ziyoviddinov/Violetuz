import { useEffect, useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectIsLoggedIn, selectAuthReady, selectProfile } from '../store/slices/userSlice';
import { fetchRecommendedArtists } from '../api/recommendedArtistsApi';

/**
 * Login user uchun RecommendedArtists tartibi (distinct content score).
 * Guest / empty / xato → null (katalog fallback).
 *
 * @returns {{ ranked: Array<{ artistId: string, score: number }>|null, loading: boolean }}
 */
export function useRecommendedArtistsRanking() {
  const authReady = useAppSelector(selectAuthReady);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const profile = useAppSelector(selectProfile);
  const [ranked, setRanked] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!authReady || !isLoggedIn || !profile?.id) {
      setRanked(null);
      setLoading(false);
      return undefined;
    }

    setLoading(true);

    (async () => {
      try {
        const data = await fetchRecommendedArtists({ limit: 40 });
        if (cancelled) return;
        const list = Array.isArray(data?.artists) ? data.artists : [];
        setRanked(list.length ? list : null);
      } catch {
        if (!cancelled) setRanked(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authReady, isLoggedIn, profile?.id]);

  return { ranked, loading };
}
