import { useEffect, useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectAuthReady, selectIsLoggedIn } from '../store/slices/userSlice';
import { fetchChannelViewerMusicHomeFeed } from '../api/musicHomeFeedApi';
import { getListenHistory } from '../utils/localStorage/guestHistory/musicGuestHistory';
import { GUEST_MUSIC_HISTORY_CHANGED } from '../utils/localStorage/guestHistory/events';

/**
 * Kanal qidiruvi "Siz uchun tavsiyalar".
 * Umumiy useMusicHomeFeed chaqirilmaydi va uning keshiga yozilmaydi.
 *
 * @param {{ channelId?: string, enabled?: boolean }} [opts]
 */
export function useChannelMusicHomeFeed({ channelId = '', enabled = true } = {}) {
  const authReady = useAppSelector(selectAuthReady);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [guestHistoryEpoch, setGuestHistoryEpoch] = useState(0);
  const channel = String(channelId || '').trim();

  useEffect(() => {
    const onHistory = () => setGuestHistoryEpoch((n) => n + 1);
    window.addEventListener(GUEST_MUSIC_HISTORY_CHANGED, onHistory);
    return () => window.removeEventListener(GUEST_MUSIC_HISTORY_CHANGED, onHistory);
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
    const localHistory = isLoggedIn ? undefined : getListenHistory();

    fetchChannelViewerMusicHomeFeed({ channelId: channel, isLoggedIn, localHistory })
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
  }, [authReady, channel, enabled, isLoggedIn, guestHistoryEpoch]);

  return { items, isLoading };
}
