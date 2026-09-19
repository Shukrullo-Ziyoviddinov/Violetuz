import { useEffect, useState } from 'react';
import { loadMusicTopChartsOnce } from './musicTopChartsShared';

/**
 * Oyning top musiqalari.
 * Ma’lumot: shared top-charts (hafta bilan bitta so‘rov).
 *
 * @returns {{ items: Array<{ contentKey: string, contentId: string, viewCount: number, listenedSeconds: number, rank: number }>, loading: boolean }}
 */
export function useMonthlyTopMusic() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await loadMusicTopChartsOnce();
        const list = Array.isArray(data?.monthly?.items) ? data.monthly.items : [];
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
