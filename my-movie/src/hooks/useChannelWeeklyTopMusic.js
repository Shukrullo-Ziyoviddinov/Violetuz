import { useEffect, useState } from 'react';
import { fetchChannelWeeklyTopMusic } from '../api/musicRecommendationsApi';

/**
 * Kanal sahifasidagi haftaning top musiqalari.
 * Tartib va limit serverda. Hook faqat shu kanal ro‘yxatini oladi.
 */
export function useChannelWeeklyTopMusic(channelId) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(Boolean(String(channelId || '').trim()));

  useEffect(() => {
    const id = String(channelId || '').trim();
    if (!id) {
      setItems([]);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const data = await fetchChannelWeeklyTopMusic(id);
        const list = Array.isArray(data?.items) ? data.items : [];
        if (!cancelled) setItems(list);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [channelId]);

  return { items, loading };
}
