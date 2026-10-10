import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useMoviesApi } from '../../context/MoviesApiContext';
import { useAppSelector } from '../../store/hooks';
import { selectIsLoggedIn } from '../../store/slices/userSlice';
import { useHomeFeed } from '../../hooks/useHomeFeed';
import { useSimilarMovies } from '../../hooks/useSimilarMovies';
import { fetchViewerHomeFeedPage } from '../../api/homeFeedApi';
import { getWatchHistory } from '../../utils/localStorage/guestHistory/movieGuestHistory';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import SemicircleLoader from '../SemicircleLoader/SemicircleLoader';
import MovieDetailForYouCard, { MovieDetailForYouCardSkeleton } from './MovieDetailForYouCard';
import './MovieDetailForYou.css';

const DESKTOP_QUERY = '(min-width: 901px)';
const FIRST_PAGE = 10;
const NEXT_PAGE = 5;
const SKELETON_COUNT = 5;
const SKELETON_REVEAL_MS = 480;

const useDesktopRail = () => {
  const [desktop, setDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(DESKTOP_QUERY).matches
  );

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_QUERY);
    const sync = () => setDesktop(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  return desktop;
};

const MovieDetailForYou = ({ movieId }) => {
  const { t } = useTranslation();
  const { contentLang } = useContentLanguage();
  const { getMovieByIdLocal, moviesLoading } = useMoviesApi();
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const isDesktop = useDesktopRail();
  const { items, isLoading: feedLoading } = useHomeFeed({ enabled: !isDesktop });
  const { movies: similarMovies, isLoading: similarLoading } = useSimilarMovies({
    movieId,
    enabled: movieId != null && movieId !== '',
  });

  const [pageMovies, setPageMovies] = useState([]);
  const [pageOffset, setPageOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [phase, setPhase] = useState('idle');
  const [pendingCount, setPendingCount] = useState(0);
  const [moreKey, setMoreKey] = useState(0);
  const revealTimerRef = useRef(0);

  const excludeIds = useMemo(() => {
    const ids = [];
    if (movieId != null && movieId !== '') ids.push(String(movieId));
    for (const row of similarMovies || []) {
      if (row?.id != null) ids.push(String(row.id));
      if (row?.movieId != null) ids.push(String(row.movieId));
    }
    return [...new Set(ids)];
  }, [movieId, similarMovies]);

  const excludeKey = excludeIds.join(',');

  const resolveMovies = (rows) =>
    (rows || [])
      .map((item) => getMovieByIdLocal(item.movieId))
      .filter((movie) => movie?.id != null);

  useEffect(() => () => window.clearTimeout(revealTimerRef.current), []);

  useEffect(() => {
    if (!isDesktop) return undefined;
    if (similarLoading || moviesLoading) return undefined;

    let cancelled = false;
    setInitialLoading(true);
    setPhase('idle');
    setPendingCount(0);
    setPageMovies([]);
    setPageOffset(0);
    setHasMore(false);
    window.clearTimeout(revealTimerRef.current);

    fetchViewerHomeFeedPage({
      isLoggedIn,
      localHistory: isLoggedIn ? undefined : getWatchHistory(),
      offset: 0,
      limit: FIRST_PAGE,
      excludeIds,
    })
      .then((result) => {
        if (cancelled) return;
        setPageMovies(resolveMovies(result.movies));
        setPageOffset(result.movies.length);
        setHasMore(result.hasMore);
      })
      .catch(() => {
        if (cancelled) return;
        setPageMovies([]);
        setHasMore(false);
      })
      .finally(() => {
        if (!cancelled) setInitialLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // resolveMovies yopilishi har renderda yangilanadi; katalog funksiyasi yetarli.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDesktop, similarLoading, moviesLoading, excludeKey, isLoggedIn, getMovieByIdLocal]);

  const mobileMovies = useMemo(() => {
    const excluded = new Set(excludeIds);
    return (items || [])
      .map((item) => getMovieByIdLocal(item.movieId))
      .filter((movie) => movie?.id != null && !excluded.has(String(movie.id)));
  }, [excludeIds, getMovieByIdLocal, items]);

  const handleMore = () => {
    if (!isDesktop || phase !== 'idle' || !hasMore || initialLoading) return;
    setPhase('arc');
    fetchViewerHomeFeedPage({
      isLoggedIn,
      localHistory: isLoggedIn ? undefined : getWatchHistory(),
      offset: pageOffset,
      limit: NEXT_PAGE,
      excludeIds,
    })
      .then((result) => {
        const next = resolveMovies(result.movies);
        setPageOffset((current) => current + result.movies.length);
        setHasMore(result.hasMore);
        if (!next.length) {
          setPhase('idle');
          return;
        }
        setPendingCount(next.length);
        setPhase('skeleton');
        window.clearTimeout(revealTimerRef.current);
        revealTimerRef.current = window.setTimeout(() => {
          setPageMovies((current) => [...current, ...next]);
          setPendingCount(0);
          setPhase('idle');
          setMoreKey((key) => key + 1);
        }, SKELETON_REVEAL_MS);
      })
      .catch(() => {
        setPhase('idle');
      });
  };

  const waiting = isDesktop
    ? similarLoading || moviesLoading || initialLoading
    : similarLoading || ((feedLoading || moviesLoading) && mobileMovies.length === 0);
  const movies = isDesktop ? pageMovies : mobileMovies;
  const showMoreButton = isDesktop && !waiting && phase === 'idle' && hasMore;
  const showArc = isDesktop && phase === 'arc';
  const showListShadow = isDesktop && (hasMore || phase !== 'idle');

  if (!waiting && movies.length === 0 && pendingCount === 0) return null;

  return (
    <aside className="movie-detail-for-you" aria-busy={waiting || phase !== 'idle' || undefined}>
      <div className="movie-detail-for-you-sticky">
        {waiting ? (
          <SkeletonLoader variant="movies-title" className="movie-detail-for-you-heading-skeleton" />
        ) : (
          <h2 className="movie-detail-for-you-heading">
            {t('movies.forYou', 'Siz uchun tavsiyalar')}
          </h2>
        )}
        <div className={`movie-detail-for-you-list${showListShadow ? ' movie-detail-for-you-list--more' : ''}`}>
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
          {phase === 'skeleton'
            ? Array.from({ length: pendingCount }, (_, index) => (
                <MovieDetailForYouCardSkeleton key={`movie-detail-for-you-more-skeleton-${index}`} />
              ))
            : null}
        </div>
        {showArc || showMoreButton ? (
          <div className="movie-detail-for-you-more-wrap">
            {showArc ? (
              <SemicircleLoader />
            ) : (
              <button
                key={moreKey}
                type="button"
                className="show-more-btn movie-detail-for-you-more"
                onClick={handleMore}
              >
                {t('movies.more', "Ko'proq")}
              </button>
            )}
          </div>
        ) : null}
      </div>
    </aside>
  );
};

export default MovieDetailForYou;
