import { useEffect, useState } from 'react';
import { fetchTopArtists } from '../api/recommendedArtistsApi';

const TOP_ARTISTS_LIMIT = 10;

/**
 * Global Top-N artists leaderboard (public).
 * @returns {{ items: Array<{ artistId: string, score: number, rank: number }>, loading: boolean }}
 */
export function useTopArtists(limit = TOP_ARTISTS_LIMIT) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const data = await fetchTopArtists({ limit });
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
