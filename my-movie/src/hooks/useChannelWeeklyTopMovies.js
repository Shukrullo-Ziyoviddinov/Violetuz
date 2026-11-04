import { useEffect, useState } from 'react';
import { fetchChannelWeeklyTopMovies } from '../api/recommendationsApi';

/**
 * Kanal sahifasidagi haftaning top filmlari.
 * Tartib va limit serverda. Hook faqat shu kanal ro‘yxatini oladi.
 */
export function useChannelWeeklyTopMovies(channelId) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(Boolean(String(channelId || '').trim()));

  useEffect(() => {
    const id = String(channelId || '').trim();
    if (!id) {
      setMovies([]);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const data = await fetchChannelWeeklyTopMovies(id);
        const list = Array.isArray(data?.movies) ? data.movies : [];
        if (!cancelled) setMovies(list);
      } catch {
        if (!cancelled) setMovies([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [channelId]);

  return { movies, loading };
}
