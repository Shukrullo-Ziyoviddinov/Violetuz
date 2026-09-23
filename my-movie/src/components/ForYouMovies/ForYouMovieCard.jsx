import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWishlist } from '../../context/WishlistContext';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import { useImageReady } from '../../utils/useImageReady';
import { formatMovieRating } from '../Rating/CalculateRating';

const titleOf = (movie, contentLang) => {
  if (movie?.title && typeof movie.title === 'object') {
    return movie.title[contentLang] || movie.title.uz || movie.title.ru || '';
  }
  return movie?.title || '';
};

const ForYouMovieCard = ({ movie }) => {
  const navigate = useNavigate();
  const { contentLang } = useContentLanguage();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const title = titleOf(movie, contentLang);
  const imgSrc = movie?.homeImg
    ? movie.homeImg[contentLang] || movie.homeImg.uz || movie.homeImg.ru || ''
    : '';
  const { showSkeleton, imgRef, onLoad, onError, failed } = useImageReady(imgSrc);
  const saved = isInWishlist(movie.id, 'movie');
  const showRating = movie.rating != null && movie.rating !== '' && movie.rating !== 'none';

  return (
    <article
      className={`for-you-card${showSkeleton ? ' for-you-card--loading' : ''}`}
      onClick={() => !showSkeleton && navigate(`/movie/${movie.id}`)}
      aria-busy={showSkeleton || undefined}
    >
      <div className="for-you-card-image-wrap">
        {showSkeleton && (
          <SkeletonLoader variant="movie-image" className="for-you-card-image-skeleton" />
        )}
        {!failed && imgSrc && (
          <img
            ref={imgRef}
            src={imgSrc}
            alt={title}
            className={`for-you-card-image${showSkeleton ? ' for-you-card-image--loading' : ''}`}
            onLoad={onLoad}
            onError={onError}
          />
        )}
        {!showSkeleton && (
          <button
            type="button"
            className={`for-you-card-save${saved ? ' for-you-card-save--on' : ''}`}
            aria-label="Sevimlilarga qo'shish"
            onClick={(event) => {
              event.stopPropagation();
              toggleWishlist(movie.id, 'movie');
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        )}
        {!showSkeleton && showRating && (
          <span className="for-you-card-rating">{formatMovieRating(movie.rating)}</span>
        )}
      </div>
      <h3 className="for-you-card-title">{title}</h3>
    </article>
  );
};

export const ForYouMovieCardSkeleton = () => (
  <div className="for-you-card for-you-card--skeleton" aria-hidden="true">
    <div className="for-you-card-image-wrap">
      <SkeletonLoader variant="movie-image" className="for-you-card-image-skeleton" />
    </div>
    <span className="for-you-card-title for-you-card-title--skeleton" />
  </div>
);

export default ForYouMovieCard;
