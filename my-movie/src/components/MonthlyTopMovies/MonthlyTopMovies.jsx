import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Movies from '../Movies/Movies';
import { useMoviesApi } from '../../context/MoviesApiContext';
import { useMonthlyTopMovies } from '../../hooks/useMonthlyTopMovies';

const MONTHLY_RANK_SRC = {
  1: '/img/oytop1_preview_rev_1.png',
  2: '/img/oytop2_preview_rev_1.png',
  3: '/img/oytop3_preview_rev_1.png',
  4: '/img/oytop4_preview_rev_1.png',
  5: '/img/oytop5_preview_rev_1.png',
  6: '/img/oytop6_preview_rev_1.png',
  7: '/img/oytop7_preview_rev_1.png',
  8: '/img/oytop8_preview_rev_1.png',
  9: '/img/oytop9_preview_rev_1.png',
  10: '/img/oytop10_preview_rev_1.png',
};

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
        weeklyRankSrc: MONTHLY_RANK_SRC[rank] || '',
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
