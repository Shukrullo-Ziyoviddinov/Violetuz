import { useEffect, useState } from 'react';
import { fetchWeeklyTopArtists } from '../api/recommendedArtistsApi';

const WEEKLY_TOP_LIMIT = 10;

/**
 * Haftaning Top-N artists (public, rolling 7 days).
 */
export function useWeeklyTopArtists(limit = WEEKLY_TOP_LIMIT) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const data = await fetchWeeklyTopArtists({ limit });
        const list = Array.isArray(data?.artists) ? data.artists : [];
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
  }, [limit]);

  return { items, loading };
}
