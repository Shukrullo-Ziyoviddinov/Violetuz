import { useEffect, useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectIsLoggedIn, selectAuthReady, selectProfile } from '../store/slices/userSlice';
import { fetchViewerRecommendedArtists } from '../api/recommendedArtistsApi';
import { getListenHistory } from '../utils/localStorage/guestHistory/musicGuestHistory';
import { GUEST_MUSIC_HISTORY_CHANGED } from '../utils/localStorage/guestHistory/events';

/**
 * RecommendedArtists tartibi (distinct content-key score).
 *  - Login → GET (o‘zgarmagan path)
 *  - Guest → POST /guest + violet_guest_music_v1
 * Empty / xato → null (UI trending bilan to‘ldiradi).
 *
 * @returns {{ ranked: Array<{ artistId: string, score: number }>|null, loading: boolean }}
 */
export function useRecommendedArtistsRanking() {
  const authReady = useAppSelector(selectAuthReady);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const profile = useAppSelector(selectProfile);
  const [ranked, setRanked] = useState(null);
  // true by default — authReady oldin / fetch oldin flash yo‘q
  const [loading, setLoading] = useState(true);
  const [guestHistoryEpoch, setGuestHistoryEpoch] = useState(0);

  useEffect(() => {
    const onHistory = () => setGuestHistoryEpoch((n) => n + 1);
    window.addEventListener(GUEST_MUSIC_HISTORY_CHANGED, onHistory);
    return () => window.removeEventListener(GUEST_MUSIC_HISTORY_CHANGED, onHistory);
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
        const data = await fetchViewerRecommendedArtists({
          isLoggedIn,
          limit: 40,
          localHistory: isLoggedIn ? undefined : getListenHistory(),
        });
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
  }, [authReady, isLoggedIn, profile?.id, guestHistoryEpoch]);

  return { ranked, loading };
}
