import { useEffect, useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectIsLoggedIn, selectAuthReady, selectProfile } from '../store/slices/userSlice';
import { fetchViewerRecommendedActors } from '../api/recommendedActorsApi';
import { getWatchHistory } from '../utils/localStorage/guestHistory/movieGuestHistory';
import { GUEST_MOVIE_HISTORY_CHANGED } from '../utils/localStorage/guestHistory/events';

/**
 * RecommendedActors tartibi (distinct watched-movie score).
 *  - Login → GET (o‘zgarmagan path)
 *  - Guest → POST /guest + violet_guest_movies_v1
 * Empty / xato → null (UI trending bilan to‘ldiradi).
 *
 * @returns {{ ranked: Array<{ actorId: string, score: number }>|null, loading: boolean }}
 */
export function useRecommendedActorsRanking() {
  const authReady = useAppSelector(selectAuthReady);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const profile = useAppSelector(selectProfile);
  const [ranked, setRanked] = useState(null);
  // true by default — authReady oldin / fetch oldin flash yo‘q
  const [loading, setLoading] = useState(true);
  const [guestHistoryEpoch, setGuestHistoryEpoch] = useState(0);

  useEffect(() => {
    const onHistory = () => setGuestHistoryEpoch((n) => n + 1);
    window.addEventListener(GUEST_MOVIE_HISTORY_CHANGED, onHistory);
    return () => window.removeEventListener(GUEST_MOVIE_HISTORY_CHANGED, onHistory);
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!authReady) {
      setRanked(null);
      setLoading(true);
      return undefined;
    }

    // Login: profile kelmaguncha kutish (GET path o‘zgarmaydi)
    if (isLoggedIn && !profile?.id) {
      setRanked(null);
      setLoading(true);
      return undefined;
    }

    setLoading(true);

    (async () => {
      try {
        const data = await fetchViewerRecommendedActors({
          isLoggedIn,
          limit: 40,
          localHistory: isLoggedIn ? undefined : getWatchHistory(),
        });
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
  }, [authReady, isLoggedIn, profile?.id, guestHistoryEpoch]);

  return { ranked, loading };
}
