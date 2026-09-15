import { useEffect, useState } from 'react';
import { fetchWeeklyTopActors } from '../api/recommendedActorsApi';

const WEEKLY_TOP_LIMIT = 10;

/**
 * Haftaning Top-N actors (public, rolling 7 days).
 */
export function useWeeklyTopActors(limit = WEEKLY_TOP_LIMIT) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const data = await fetchWeeklyTopActors({ limit });
        const list = Array.isArray(data?.actors) ? data.actors : [];
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
