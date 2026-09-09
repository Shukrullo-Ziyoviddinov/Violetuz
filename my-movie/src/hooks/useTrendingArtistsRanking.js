import { useEffect, useState } from 'react';
import { fetchTrendingArtists } from '../api/recommendedArtistsApi';

/**
 * Public trending artists for cold-start / guest.
 * Returns [] when no data yet.
 */
export function useTrendingArtistsRanking() {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const data = await fetchTrendingArtists({ limit: 40 });
        const list = Array.isArray(data?.artists) ? data.artists : [];
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

