import { useEffect, useState } from 'react';
import { fetchTopActors } from '../api/recommendedActorsApi';

const TOP_ACTORS_LIMIT = 10;

/**
 * Global Top-N actors leaderboard (public).
 * @returns {{ items: Array<{ actorId: string, score: number, rank: number }>, loading: boolean }}
 */
export function useTopActors(limit = TOP_ACTORS_LIMIT) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const data = await fetchTopActors({ limit });
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
