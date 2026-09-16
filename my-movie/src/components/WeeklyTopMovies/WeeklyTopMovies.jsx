import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Movies from '../Movies/Movies';
import { useMoviesApi } from '../../context/MoviesApiContext';
import { useWeeklyTopMovies } from '../../hooks/useWeeklyTopMovies';

const WEEKLY_RANK_SRC = {
  1: '/img/top1_preview_rev_1.png',
  2: '/img/top2_preview_rev_1.png',
  3: '/img/top3_preview_rev_1.png',
  4: '/img/top4_preview_rev_1.png',
  5: '/img/top5_preview_rev_1.png',
  6: '/img/top6_preview_rev_1.png',
  7: '/img/top7_preview_rev_1.png',
  8: '/img/top8_preview_rev_1 (1).png',
  9: '/img/top9_preview_rev_1.png',
  10: '/img/top10_preview_rev_1.png',
};

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
      if (!movie) continue;
      const rank = Number(row.rank) || out.length + 1;
      out.push({
        ...movie,
        weeklyRankSrc: WEEKLY_RANK_SRC[rank] || '',
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
      headerTitle={t('movies.haftaningTopFilmlari', 'Haftaning top 10 filmlari')}
      isLoading={waiting}
    />
  );
};

export default WeeklyTopMovies;
