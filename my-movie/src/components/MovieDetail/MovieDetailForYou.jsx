import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useMoviesApi } from '../../context/MoviesApiContext';
import { useHomeFeed } from '../../hooks/useHomeFeed';
import { useSimilarMovies } from '../../hooks/useSimilarMovies';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import MovieDetailForYouCard, { MovieDetailForYouCardSkeleton } from './MovieDetailForYouCard';
import './MovieDetailForYou.css';

const SKELETON_COUNT = 5;

const MovieDetailForYou = ({ movieId }) => {
  const { t } = useTranslation();
  const { contentLang } = useContentLanguage();
  const { getMovieByIdLocal, moviesLoading } = useMoviesApi();
  const { items, isLoading: feedLoading } = useHomeFeed();
  const { movies: similarMovies, isLoading: similarLoading } = useSimilarMovies({
    movieId,
    enabled: movieId != null && movieId !== '',
  });

  const movies = useMemo(() => {
    const excluded = new Set();
    if (movieId != null && movieId !== '') excluded.add(String(movieId));
    for (const row of similarMovies || []) {
      if (row?.id != null) excluded.add(String(row.id));
      if (row?.movieId != null) excluded.add(String(row.movieId));
    }
    return (items || [])
      .map((item) => getMovieByIdLocal(item.movieId))
      .filter((movie) => movie?.id != null && !excluded.has(String(movie.id)));
  }, [getMovieByIdLocal, items, movieId, similarMovies]);

  const waiting = similarLoading || ((feedLoading || moviesLoading) && movies.length === 0);
  if (!waiting && movies.length === 0) return null;

  return (
    <aside className="movie-detail-for-you" aria-busy={waiting || undefined}>
      {waiting ? (
        <SkeletonLoader variant="movies-title" className="movie-detail-for-you-heading-skeleton" />
      ) : (
        <h2 className="movie-detail-for-you-heading">
          {t('movies.forYou', 'Siz uchun tavsiyalar')}
        </h2>
      )}
      <div className="movie-detail-for-you-list">
        {waiting
          ? Array.from({ length: SKELETON_COUNT }, (_, index) => (
              <MovieDetailForYouCardSkeleton key={`movie-detail-for-you-skeleton-${index}`} />
            ))
          : movies.map((movie) => (
              <MovieDetailForYouCard
                key={movie.id}
                movie={movie}
                contentLang={contentLang}
              />
            ))}
      </div>
    </aside>
  );
};

export default MovieDetailForYou;
