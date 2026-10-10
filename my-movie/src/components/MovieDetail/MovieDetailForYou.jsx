import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useMoviesApi } from '../../context/MoviesApiContext';
import { useAppSelector } from '../../store/hooks';
import { selectIsLoggedIn } from '../../store/slices/userSlice';
import { useSimilarMovies } from '../../hooks/useSimilarMovies';
import { fetchViewerHomeFeedPage } from '../../api/homeFeedApi';
import { getWatchHistory } from '../../utils/localStorage/guestHistory/movieGuestHistory';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import SemicircleLoader from '../SemicircleLoader/SemicircleLoader';
import MovieDetailForYouCard, { MovieDetailForYouCardSkeleton } from './MovieDetailForYouCard';
import './MovieDetailForYou.css';

const DESKTOP_QUERY = '(min-width: 901px)';
const DESKTOP_FIRST_PAGE = 10;
const DESKTOP_NEXT_PAGE = 5;
const MOBILE_PAGE = 4;
const SKELETON_REVEAL_MS = 700;

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
  const firstPage = isDesktop ? DESKTOP_FIRST_PAGE : MOBILE_PAGE;
  const nextPage = isDesktop ? DESKTOP_NEXT_PAGE : MOBILE_PAGE;
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
      limit: firstPage,
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
  }, [isDesktop, firstPage, similarLoading, moviesLoading, excludeKey, isLoggedIn, getMovieByIdLocal]);

  const handleMore = () => {
    if (phase !== 'idle' || !hasMore || initialLoading) return;
    setPhase('arc');
    fetchViewerHomeFeedPage({
      isLoggedIn,
      localHistory: isLoggedIn ? undefined : getWatchHistory(),
      offset: pageOffset,
      limit: nextPage,
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

  const waiting = similarLoading || moviesLoading || initialLoading;
  const showMoreButton = !waiting && phase === 'idle' && hasMore;
  const showArc = phase === 'arc';
  const showListShadow = hasMore || phase !== 'idle';

  if (!waiting && pageMovies.length === 0 && pendingCount === 0) return null;

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
            ? Array.from({ length: firstPage }, (_, index) => (
                <MovieDetailForYouCardSkeleton key={`movie-detail-for-you-skeleton-${index}`} />
              ))
            : pageMovies.map((movie) => (
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
        {showArc || showMoreButton || phase === 'skeleton' ? (
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
