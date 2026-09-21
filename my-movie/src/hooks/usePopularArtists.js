import { useEffect, useState } from 'react';
import { fetchPopularArtists } from '../api/recommendedArtistsApi';

const POPULAR_ARTISTS_LIMIT = 20;

/**
 * Mashhur artistlar (public, rolling 30 days, limit 20).
 * Oyna va tartib serverda — hook faqat ro‘yxatni oladi.
 *
 * @returns {{ items: Array<{ artistId: string, score: number, rank: number }>, loading: boolean }}
 */
export function usePopularArtists(limit = POPULAR_ARTISTS_LIMIT) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const data = await fetchPopularArtists({ limit });
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
