import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Movies from '../Movies/Movies';
import { useMoviesApi } from '../../context/MoviesApiContext';
import { useMonthlyTopMovies } from '../../hooks/useMonthlyTopMovies';
import { monthlyTopRankSrc } from '../../utils/topRankPreview';

/**
 * Oyning top filmlari.
 * Tartib hook/serverdan. Bo‘sh bo‘lsa blok chiqmaydi.
 * Rank rasm sloti kartochkadagi mavjud weeklyRankSrc.
 */
const MonthlyTopMovies = () => {
  const { t } = useTranslation();
  const { movies, loading } = useMonthlyTopMovies();
  const { allMovies, moviesLoading } = useMoviesApi();

  const displayMovies = useMemo(() => {
    const byId = new Map((allMovies || []).map((movie) => [String(movie.id), movie]));
    const out = [];
    for (const row of movies) {
      const movie = byId.get(String(row.movieId));
      if (!movie) continue;
      const rank = Number(row.rank) || out.length + 1;
      out.push({
        ...movie,
        weeklyRankSrc: monthlyTopRankSrc(rank),
      });
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
      showRankBadge
      headerTitle={t('movies.oyningTopFilmlari', 'Oyning top 10 filmlari')}
      isLoading={waiting}
    />
  );
};

export default MonthlyTopMovies;
