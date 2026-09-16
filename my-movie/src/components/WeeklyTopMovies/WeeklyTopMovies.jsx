import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Movies from '../Movies/Movies';
import { useMoviesApi } from '../../context/MoviesApiContext';
import { useWeeklyTopMovies } from '../../hooks/useWeeklyTopMovies';

/**
 * Haftaning top filmlari.
 * Tartib hook/serverdan. Bo‘sh bo‘lsa blok chiqmaydi.
 */
const WeeklyTopMovies = () => {
  const { t } = useTranslation();
  const { movies, loading } = useWeeklyTopMovies();
  const { allMovies, moviesLoading } = useMoviesApi();

  const displayMovies = useMemo(() => {
    const byId = new Map((allMovies || []).map((movie) => [String(movie.id), movie]));
    const out = [];
    for (const row of movies) {
      const movie = byId.get(String(row.movieId));
      if (movie) out.push(movie);
    }
    return out;
  }, [allMovies, movies]);

  const waiting =
    loading || (movies.length > 0 && moviesLoading && displayMovies.length === 0);

  if (!waiting && displayMovies.length === 0) return null;

  return (
    <Movies
      sectionType="recommended"
      filteredMovies={waiting ? [] : displayMovies}
      limit={displayMovies.length > 0 ? displayMovies.length : undefined}
      showHorizontalScroll
      headerTitle={t('movies.haftaningTopFilmlari', 'Haftaning top 10 filmlari')}
      isLoading={waiting}
    />
  );
};

export default WeeklyTopMovies;
