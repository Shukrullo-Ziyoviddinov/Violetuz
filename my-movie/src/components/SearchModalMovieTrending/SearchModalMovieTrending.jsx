import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useMoviesApi } from '../../context/MoviesApiContext';
import { useMostWatchedMovies } from '../../hooks/useMostWatchedMovies';
import ViewCount from '../ViewCount/ViewCount';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import { useImageReady } from '../../utils/useImageReady';
import { normalizeImagePath } from '../../utils/utils';
import './SearchModalMovieTrending.css';

const MORE_PATH = '/recommended/hozir-trendda';
const PREVIEW_LIMIT = 6;

const titleOf = (movie, contentLang) => {
  if (movie?.title && typeof movie.title === 'object') {
    return movie.title[contentLang] || movie.title.uz || movie.title.ru || '';
  }
  return movie?.title || '';
};

const genresOf = (movie, contentLang) => {
  const genre = movie?.genre;
  if (!genre) return '';
  if (Array.isArray(genre)) return genre.filter(Boolean).join(', ');
  if (typeof genre === 'object') {
    const list = genre[contentLang] || genre.uz || genre.ru || [];
    return (Array.isArray(list) ? list : [list]).filter(Boolean).join(', ');
  }
  return String(genre);
};

const hasImdb = (movie) => {
  const value = movie?.ratingImdb;
  return value != null && value !== '' && value !== 'none';
};

const TrendCard = ({ movie, contentLang, onOpen }) => {
  const title = titleOf(movie, contentLang);
  const genres = genresOf(movie, contentLang);
  const rawImg = movie?.homeImg
    ? movie.homeImg[contentLang] || movie.homeImg.uz || movie.homeImg.ru || ''
    : '';
  const imgSrc = normalizeImagePath(rawImg);
  const { showSkeleton, imgRef, onLoad, onError, failed } = useImageReady(imgSrc);
  const showImdb = hasImdb(movie);

  return (
    <div
      className={`search-modal-movie-trend-card${
        showSkeleton ? ' search-modal-movie-trend-card--loading' : ''
      }`}
      role="button"
      tabIndex={0}
      onClick={() => !showSkeleton && onOpen(movie)}
      onKeyDown={(e) => {
        if (showSkeleton) return;
        if (e.key === 'Enter') onOpen(movie);
      }}
      aria-busy={showSkeleton || undefined}
    >
      <div className="search-modal-movie-trend-poster-wrap">
        {showSkeleton && (
          <SkeletonLoader
            variant="movie-image"
            className="search-modal-movie-trend-poster-skeleton"
          />
        )}
        {!failed && imgSrc && (
          <img
            ref={imgRef}
            src={imgSrc}
            alt={title}
            className={`search-modal-movie-trend-poster${
              showSkeleton ? ' search-modal-movie-trend-poster--loading' : ''
            }`}
            onLoad={onLoad}
            onError={onError}
          />
        )}
      </div>
      <div className="search-modal-movie-trend-body">
        <h3 className="search-modal-movie-trend-name">{title}</h3>
        <ViewCount
          itemId={movie.id}
          type="movie"
          record={false}
          variant="text"
          className="view-count-text search-modal-movie-trend-views"
        />
        {genres ? <p className="search-modal-movie-trend-genres">{genres}</p> : null}
        {showImdb ? (
          <div className="search-modal-movie-trend-imdb">
            <img src="/img/imdbnew.png" alt="IMDb" className="search-modal-movie-trend-imdb-logo" />
            <span className="search-modal-movie-trend-imdb-value">{movie.ratingImdb}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
};

const TrendCardSkeleton = () => (
  <div className="search-modal-movie-trend-card search-modal-movie-trend-card--skeleton" aria-hidden="true">
    <div className="search-modal-movie-trend-poster-wrap">
      <SkeletonLoader variant="movie-image" className="search-modal-movie-trend-poster-skeleton" />
    </div>
    <div className="search-modal-movie-trend-body">
      <SkeletonLoader variant="block" className="search-modal-movie-trend-line" />
      <SkeletonLoader variant="block" className="search-modal-movie-trend-line search-modal-movie-trend-line--mid" />
      <SkeletonLoader variant="block" className="search-modal-movie-trend-line search-modal-movie-trend-line--short" />
    </div>
  </div>
);

/**
 * Qidiruv modalidagi kino “Hozir trendda”.
 * Ma’lumot: oxirgi 7 kun, eng ko‘p ko‘rilgan 20 ta. Bu yerda 6 tasi.
 */
const SearchModalMovieTrending = ({ onMovieClick }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { contentLang } = useContentLanguage();
  const { getMovieByIdLocal, moviesLoading } = useMoviesApi();
  const { movies: rows, loading } = useMostWatchedMovies();

  const ranked = useMemo(
    () =>
      (rows || [])
        .map((row) => getMovieByIdLocal(row.movieId))
        .filter(Boolean),
    [getMovieByIdLocal, rows]
  );

  const preview = ranked.slice(0, PREVIEW_LIMIT);
  const waiting = (loading || moviesLoading) && preview.length === 0;

  const goMore = () => {
    onMovieClick?.();
    navigate(MORE_PATH);
  };

  const openMovie = (movie) => {
    if (movie?.id == null) return;
    onMovieClick?.();
    navigate(`/movie/${movie.id}`);
  };

  if (!waiting && preview.length === 0) return null;

  return (
    <section className="search-modal-movie-trend" aria-busy={waiting || undefined}>
      <div className="search-modal-movie-trend-header">
        <h2 className="search-modal-movie-trend-title">
          <span className="search-modal-movie-trend-flame" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.2 2s.4 3.2-1.6 5.4C8.8 9.4 8 11 8 13.2 8 16.4 10.2 19 13 19c2.2 0 3.6-1.4 3.6-3.4 0-2.2-1.2-3.4-1.2-5.2 0 0 2.8 1.6 2.8 5 0 3.6-2.8 6.6-6.4 6.6S5 19 5 15.2C5 10.6 8.4 7.2 12.2 2z" />
            </svg>
          </span>
          {t('movies.hozirTrendda', 'Hozir trendda')}
        </h2>
        <button type="button" className="search-modal-movie-trend-more" onClick={goMore}>
          {t('movies.barchasiniKorish', "Barchasini ko'rish")}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M9.3 6.3 14.9 12l-5.6 5.7 1.4 1.4L17.8 12 10.7 4.9z" />
          </svg>
        </button>
      </div>
      <div className="search-modal-movie-trend-list">
        {waiting
          ? Array.from({ length: PREVIEW_LIMIT }, (_, index) => (
              <TrendCardSkeleton key={`movie-trend-skeleton-${index}`} />
            ))
          : preview.map((movie) => (
              <TrendCard
                key={movie.id}
                movie={movie}
                contentLang={contentLang}
                onOpen={openMovie}
              />
            ))}
      </div>
    </section>
  );
};

export default SearchModalMovieTrending;
