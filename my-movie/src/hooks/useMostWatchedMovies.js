import { useEffect, useState } from 'react';
import { fetchMostWatchedMovies } from '../api/recommendationsApi';

/**
 * Hozir trendda — oxirgi 7 kun, eng ko‘p ko‘rilgan 20 ta.
 * Tartib va oyna serverda. Hook faqat ro‘yxatni oladi.
 *
 * @param {{ enabled?: boolean, channelId?: string, limit?: number }} [opts]
 * @returns {{ movies: Array<{ movieId: string, viewCount: number, watchedSeconds: number, rank: number }>, loading: boolean }}
 */
export function useMostWatchedMovies({ enabled = true, channelId = '', limit } = {}) {
  const channel = String(channelId || '').trim();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    let cancelled = false;

    if (!enabled) {
      setMovies([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    (async () => {
      try {
        const request = {};
        if (limit) request.limit = limit;
        if (channel) request.channelId = channel;
        const data = await fetchMostWatchedMovies(request);
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
  }, [enabled, channel, limit]);

  return { movies, loading };
}
