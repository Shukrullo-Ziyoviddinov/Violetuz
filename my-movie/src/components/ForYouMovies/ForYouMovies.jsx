import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import HorizontalScroll from '../HorizontalScroll/HorizontalScroll';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import ShowMoreButton, {
  DEFAULT_LIMIT,
  getDisplayItems,
  shouldShowMore,
} from '../ShowMoreButton/ShowMoreButton';
import { useMoviesApi } from '../../context/MoviesApiContext';
import { useHomeFeed } from '../../hooks/useHomeFeed';
import ForYouMovieCard, { ForYouMovieCardSkeleton } from './ForYouMovieCard';
import './ForYouMovies.css';

const SKELETON_COUNT = 6;

const ForYouMovies = () => {
  const { t } = useTranslation();
  const { getMovieByIdLocal, moviesLoading } = useMoviesApi();
  const { items, isLoading } = useHomeFeed();

  const movies = useMemo(
    () =>
      (items || [])
        .map((item) => getMovieByIdLocal(item.movieId))
        .filter(Boolean),
    [getMovieByIdLocal, items]
  );

  const displayMovies = getDisplayItems(movies, DEFAULT_LIMIT);
  const showMore = shouldShowMore(movies, DEFAULT_LIMIT, '/recommended');
  const waiting = (isLoading || moviesLoading) && movies.length === 0;
  if (!waiting && movies.length === 0) return null;

  return (
    <section className="for-you" aria-busy={waiting || undefined}>
      <div className="for-you-container">
        <div className="for-you-header">
          {waiting ? (
            <SkeletonLoader variant="movies-title" className="for-you-title-skeleton" />
          ) : (
            <h2 className="for-you-title">
              {t('movies.forYou', 'Siz uchun tavsiyalar')}
            </h2>
          )}
          {showMore && !waiting && <ShowMoreButton to="/recommended" />}
        </div>
        <HorizontalScroll>
          {waiting
            ? Array.from({ length: SKELETON_COUNT }, (_, index) => (
                <ForYouMovieCardSkeleton key={`for-you-skeleton-${index}`} />
              ))
            : displayMovies.map((movie) => (
                <ForYouMovieCard key={movie.id} movie={movie} />
              ))}
        </HorizontalScroll>
      </div>
    </section>
  );
};

export default ForYouMovies;
