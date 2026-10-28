import { useEffect, useState } from 'react';
import { fetchRecentlyUploadedMusic } from '../api/musicApi';

/**
 * Saytga eng oxirgi yuklangan qo‘shiqlar (limit 20).
 * Tartib serverda: uploadedAt yangisi yuqorida.
 *
 * @param {{ enabled?: boolean }} [options]
 * @returns {{ items: Array<{ id: number, uploadedAt: string }>, loading: boolean }}
 */
export function useRecentlyUploadedMusic({ enabled = true } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(Boolean(enabled));

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const data = await fetchRecentlyUploadedMusic();
        if (!cancelled) setItems(Array.isArray(data?.items) ? data.items : []);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { items, loading };
}
