import { useEffect, useState } from 'react';
import { fetchTrendingActors } from '../api/recommendedActorsApi';

/**
 * Public trending actors for cold-start / guest.
 * Returns [] when no data yet.
 */
export function useTrendingActorsRanking() {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const data = await fetchTrendingActors({ limit: 40 });
        const list = Array.isArray(data?.actors) ? data.actors : [];
        if (!cancelled) setTrending(list);
      } catch {
        if (!cancelled) setTrending([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { trending, loading };
}

