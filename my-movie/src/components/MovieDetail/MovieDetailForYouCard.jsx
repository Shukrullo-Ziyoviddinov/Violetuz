import React from 'react';
import { Link } from 'react-router-dom';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import ViewCount from '../ViewCount/ViewCount';
import { useImageReady } from '../../utils/useImageReady';
import { formatActionCount } from '../../utils/utils';

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

const LikeIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
  </svg>
);

const DislikeIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z" />
  </svg>
);

export const MovieDetailForYouCardSkeleton = () => (
  <div className="movie-detail-for-you-card movie-detail-for-you-card--skeleton" aria-hidden="true">
    <SkeletonLoader variant="movie-image" className="movie-detail-for-you-poster-skeleton" />
    <div className="movie-detail-for-you-body">
      <SkeletonLoader variant="movies-title" className="movie-detail-for-you-line-skeleton" />
      <SkeletonLoader variant="movies-title" className="movie-detail-for-you-line-skeleton movie-detail-for-you-line-skeleton--short" />
      <SkeletonLoader variant="movies-title" className="movie-detail-for-you-line-skeleton movie-detail-for-you-line-skeleton--mid" />
    </div>
  </div>
);

const MovieDetailForYouCard = ({ movie, contentLang }) => {
  const title = titleOf(movie, contentLang);
  const genres = genresOf(movie, contentLang);
  const imgSrc = movie?.homeImg
    ? movie.homeImg[contentLang] || movie.homeImg.uz || movie.homeImg.ru || ''
    : '';
  const { showSkeleton, imgRef, onLoad, onError, failed } = useImageReady(imgSrc);
  const showImdb = hasImdb(movie);

  return (
    <Link
      to={`/movie/${movie.id}`}
      className={`movie-detail-for-you-card${showSkeleton ? ' movie-detail-for-you-card--loading' : ''}`}
      aria-busy={showSkeleton || undefined}
    >
      <div className="movie-detail-for-you-poster-col">
        <div className="movie-detail-for-you-poster-wrap">
          {showSkeleton && (
            <SkeletonLoader variant="movie-image" className="movie-detail-for-you-poster-skeleton" />
          )}
          {!failed && imgSrc && (
            <img
              ref={imgRef}
              src={imgSrc}
              alt={title}
              className={`movie-detail-for-you-poster${showSkeleton ? ' movie-detail-for-you-poster--loading' : ''}`}
              onLoad={onLoad}
              onError={onError}
            />
          )}
        </div>
        <div className="movie-detail-for-you-votes">
          <span className="movie-detail-for-you-vote">
            <LikeIcon />
            <span>{formatActionCount(movie.like)}</span>
          </span>
          <span className="movie-detail-for-you-vote">
            <DislikeIcon />
            <span>{formatActionCount(movie.dislike)}</span>
          </span>
        </div>
      </div>
      <div className="movie-detail-for-you-body">
        <h3 className="movie-detail-for-you-name">{title}</h3>
        <ViewCount
          itemId={movie.id}
          type="movie"
          record={false}
          variant="text"
          className="view-count-text movie-detail-for-you-views"
        />
        {genres ? <p className="movie-detail-for-you-genres">{genres}</p> : null}
        {showImdb ? (
          <div className="movie-detail-for-you-imdb">
            <img src="/img/imdbnew.png" alt="IMDb" className="movie-detail-for-you-imdb-logo" />
            <span className="movie-detail-for-you-imdb-value">{movie.ratingImdb}</span>
          </div>
        ) : null}
      </div>
    </Link>
  );
};

export default MovieDetailForYouCard;
