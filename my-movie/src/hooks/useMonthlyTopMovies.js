import { useEffect, useState } from 'react';
import { fetchMonthlyTopMovies } from '../api/recommendationsApi';

/**
 * Oyning top filmlari.
 * Tartib va limit serverda. Hook faqat ro‘yxatni oladi.
 *
 * @returns {{ movies: Array<{ movieId: string, viewCount: number, watchedSeconds: number, rank: number }>, loading: boolean }}
 */
export function useMonthlyTopMovies() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await fetchMonthlyTopMovies();
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
  }, []);

  return { movies, loading };
}
