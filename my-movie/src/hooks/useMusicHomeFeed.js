import { useEffect, useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectAuthReady, selectIsLoggedIn } from '../store/slices/userSlice';
import { fetchViewerMusicHomeFeed } from '../api/musicHomeFeedApi';
import { getListenHistory } from '../utils/localStorage/guestHistory/musicGuestHistory';
import { GUEST_MUSIC_HISTORY_CHANGED } from '../utils/localStorage/guestHistory/events';

/**
 * Login: cookie. Mehmon: musiqa localHistory.
 * Bo'lim tavsiya hookiga ulanmaydi.
 *
 * @param {{ enabled?: boolean }} [opts]
 */
export function useMusicHomeFeed({ enabled = true } = {}) {
  const authReady = useAppSelector(selectAuthReady);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [guestHistoryEpoch, setGuestHistoryEpoch] = useState(0);

  useEffect(() => {
    const onHistory = () => setGuestHistoryEpoch((n) => n + 1);
    window.addEventListener(GUEST_MUSIC_HISTORY_CHANGED, onHistory);
    return () => window.removeEventListener(GUEST_MUSIC_HISTORY_CHANGED, onHistory);
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!enabled) {
      setItems([]);
      setIsLoading(false);
      return undefined;
    }

    if (!authReady) {
      setItems([]);
      setIsLoading(true);
      return undefined;
    }

    setIsLoading(true);
    const localHistory = isLoggedIn ? undefined : getListenHistory();

    fetchViewerMusicHomeFeed({ isLoggedIn, localHistory })
      .then((result) => {
        if (cancelled) return;
        setItems(Array.isArray(result.tracks) ? result.tracks : []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authReady, enabled, isLoggedIn, guestHistoryEpoch]);

  return { items, isLoading };
}
