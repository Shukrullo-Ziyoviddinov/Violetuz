import { useEffect, useState } from 'react';
import { fetchPopularClips } from '../api/musicRecommendationsApi';

/**
 * Mashhur kliplar (oylik rolling, limit 20).
 * Tartib va limit serverda. Hook faqat ro‘yxatni oladi.
 *
 * @returns {{ items: Array<{ contentKey: string, contentId: string, viewCount: number, listenedSeconds: number, rank: number }>, loading: boolean }}
 */
export function usePopularClips() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await fetchPopularClips();
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
  }, []);

  return { items, loading };
}
