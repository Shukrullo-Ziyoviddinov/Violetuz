import { useEffect, useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectAuthReady, selectIsLoggedIn } from '../store/slices/userSlice';
import { fetchChannelViewerHomeFeed } from '../api/homeFeedApi';
import { getWatchHistory } from '../utils/localStorage/guestHistory/movieGuestHistory';
import { GUEST_MOVIE_HISTORY_CHANGED } from '../utils/localStorage/guestHistory/events';

/**
 * Kanal qidiruvi "Tavsiya etamiz".
 * Umumiy useHomeFeed chaqirilmaydi va uning keshiga yozilmaydi.
 *
 * @param {{ channelId?: string, enabled?: boolean }} [opts]
 */
export function useChannelHomeFeed({ channelId = '', enabled = true } = {}) {
  const authReady = useAppSelector(selectAuthReady);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [guestHistoryEpoch, setGuestHistoryEpoch] = useState(0);
  const channel = String(channelId || '').trim();

  useEffect(() => {
    const onHistory = () => setGuestHistoryEpoch((n) => n + 1);
    window.addEventListener(GUEST_MOVIE_HISTORY_CHANGED, onHistory);
    return () => window.removeEventListener(GUEST_MOVIE_HISTORY_CHANGED, onHistory);
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!enabled || !channel) {
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
    const localHistory = isLoggedIn ? undefined : getWatchHistory();

    fetchChannelViewerHomeFeed({ channelId: channel, isLoggedIn, localHistory })
      .then((result) => {
        if (cancelled) return;
        setItems(Array.isArray(result.movies) ? result.movies : []);
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
  }, [authReady, channel, enabled, isLoggedIn, guestHistoryEpoch]);

  return { items, isLoading };
}
