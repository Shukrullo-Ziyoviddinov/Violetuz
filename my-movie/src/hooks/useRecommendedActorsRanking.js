import { useEffect, useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectIsLoggedIn, selectAuthReady, selectProfile } from '../store/slices/userSlice';
import { fetchRecommendedActors } from '../api/recommendedActorsApi';

/**
 * Login user uchun RecommendedActors tartibi (distinct watched-movie score).
 * Guest / empty / xato → null (katalog fallback).
 *
 * @returns {{ ranked: Array<{ actorId: string, score: number }>|null, loading: boolean }}
 */
export function useRecommendedActorsRanking() {
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
        const data = await fetchRecommendedActors({ limit: 40 });
        if (cancelled) return;
        const list = Array.isArray(data?.actors) ? data.actors : [];
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
