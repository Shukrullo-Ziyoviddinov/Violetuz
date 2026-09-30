import { useEffect, useState } from 'react';
import { fetchSimilarMovies } from '../api/movieSimilarApi';

/**
 * Server cache: GET /movies/:movieId/similar.
 * Front filter / recommendation API yo'q.
 *
 * @param {{ movieId?: string|number|null, enabled?: boolean, limit?: number }} [opts]
 */
export function useSimilarMovies({
  movieId = null,
  enabled = true,
  limit,
} = {}) {
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(Boolean(enabled && movieId != null && movieId !== ''));

  useEffect(() => {
    let cancelled = false;
    const id = movieId == null ? '' : String(movieId).trim();

    if (!enabled || !id) {
      setMovies([]);
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
    fetchSimilarMovies(id, { limit })
      .then((rows) => {
        if (!cancelled) setMovies(rows);
      })
      .catch(() => {
        if (!cancelled) setMovies([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, movieId, limit]);

  return { movies, isLoading };
}
