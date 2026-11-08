import React, { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import HorizontalScroll from '../HorizontalScroll/HorizontalScroll';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import ShowMoreButton from '../ShowMoreButton/ShowMoreButton';
import { useForYouFeed } from '../../hooks/useForYouFeed';
import { useVisibleCount } from '../../paged-list/useVisibleCount';
import { useLoadMoreTrigger } from '../../paged-list/useLoadMoreTrigger';
import ForYouMovieCard, { ForYouMovieCardSkeleton } from './ForYouMovieCard';
import './ForYouMovies.css';

const HOME_MAX = 10;

const ForYouMovies = () => {
  const { t } = useTranslation();
  const containerRef = useRef(null);
  const itemRef = useRef(null);
  const visibleCount = useVisibleCount(containerRef, itemRef);
  const visibleRef = useRef(0);
  visibleRef.current = visibleCount;
  const getLimit = useCallback(() => visibleRef.current, []);
  const {
    items,
    hasMore,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
  } = useForYouFeed({ maxItems: HOME_MAX, getLimit });

  const room = Math.max(0, HOME_MAX - items.length);
  const nextChunk = Math.min(visibleCount, room);
  const loadMore = useCallback(() => {
    const limit = Math.min(visibleRef.current, HOME_MAX - items.length);
    if (limit > 0) fetchNextPage(limit);
  }, [fetchNextPage, items.length]);
  const { notifyNearEnd } = useLoadMoreTrigger({
    enabled: hasMore && !isFetchingNextPage && !isLoading && nextChunk > 0,
    onLoadMore: loadMore,
  });

  const measuring = visibleCount === 0;
  const waiting = items.length === 0 && (measuring || isLoading);
  if (!waiting && items.length === 0) return null;

  const skeletonCount = measuring ? 1 : visibleCount;
  const peek = !waiting && !isFetchingNextPage && hasMore && room > 0 ? 1 : 0;
  const tailCount = isFetchingNextPage ? nextChunk : peek;
  const showMore = items.length >= HOME_MAX || hasMore;

  return (
    <section className="for-you" aria-busy={waiting || isFetchingNextPage || undefined}>
      <div className="for-you-container" ref={containerRef}>
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
        <HorizontalScroll onNearEnd={notifyNearEnd}>
          {waiting
            ? Array.from({ length: skeletonCount }, (_, index) => (
                <div key={`for-you-skeleton-${index}`} ref={index === 0 ? itemRef : undefined}>
                  <ForYouMovieCardSkeleton />
                </div>
              ))
            : items.map((movie, index) => (
                <div key={movie.id ?? movie.movieId} ref={index === 0 ? itemRef : undefined}>
                  <ForYouMovieCard movie={movie} />
                </div>
              ))}
          {Array.from({ length: tailCount }, (_, index) => (
            <ForYouMovieCardSkeleton key={`for-you-tail-${index}`} />
          ))}
        </HorizontalScroll>
      </div>
    </section>
  );
};

export default ForYouMovies;
