import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useWishlist } from '../../context/WishlistContext';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import { useImageReady } from '../../utils/useImageReady';
import { formatMovieRating } from '../Rating/CalculateRating';
import '../Movies/Movies.css';

const titleOf = (movie, contentLang) => {
  if (movie?.title && typeof movie.title === 'object') {
    return movie.title[contentLang] || movie.title.uz || movie.title.ru || '';
  }
  return movie?.title || '';
};

const ForYouMovieCard = ({ movie }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { contentLang } = useContentLanguage();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const title = titleOf(movie, contentLang);
  const imgSrc = movie?.homeImg
    ? movie.homeImg[contentLang] || movie.homeImg.uz || movie.homeImg.ru || ''
    : '';
  const { showSkeleton, imgRef, onLoad, onError, failed } = useImageReady(imgSrc);
  const saved = isInWishlist(movie.id, 'movie');
  const isSoon = movie.category === 'anonslar';
  const showRating =
    !isSoon && movie.rating != null && movie.rating !== '' && movie.rating !== 'none';
  const showAge = movie.ageRestriction != null;

  const year = movie.specs?.year;
  const countries = Array.isArray(movie.specs?.countries)
    ? movie.specs.countries.filter(Boolean).join(', ')
    : '';
  const metaParts = [];
  if (year != null && year !== '') metaParts.push(`${year}-yil`);
  if (countries) metaParts.push(countries);
  const metaText = metaParts.join(' ');

  return (
    <article
      className={`movies-item movies-item-horizontal${showSkeleton ? ' movies-item--loading' : ''}`}
      onClick={() => !showSkeleton && navigate(`/movie/${movie.id}`)}
      aria-busy={showSkeleton || undefined}
    >
      <div className="movies-item-image-wrapper">
        {showSkeleton && (
          <SkeletonLoader
            variant="movie-image"
            className="movies-item-image-skeleton loader-skeleton"
          />
        )}
        {!failed && imgSrc && (
          <img
            ref={imgRef}
            src={imgSrc}
            alt={title}
            className={`movies-item-image${showSkeleton ? ' movies-item-image--loading' : ''}`}
            onLoad={onLoad}
            onError={onError}
          />
        )}
        {showSkeleton ? (
          <>
            <span
              className="movies-item-wishlist-btn movies-item-wishlist-btn--skeleton"
              aria-hidden="true"
            />
            <span
              className={`movies-item-badge movies-item-badge--skeleton ${
                isSoon ? 'movies-item-badge-soon' : 'movies-item-badge-fhd'
              }`}
              aria-hidden="true"
            />
            {showAge && (
              <span
                className="movies-item-badge movies-item-badge-age movies-item-badge--skeleton"
                aria-hidden="true"
              />
            )}
            {showRating && (
              <span className="movies-item-rating movies-item-rating--skeleton" aria-hidden="true" />
            )}
          </>
        ) : (
          <>
            <button
              type="button"
              className={`movies-item-wishlist-btn${saved ? ' active' : ''}`}
              onClick={(event) => {
                event.stopPropagation();
                toggleWishlist(movie.id, 'movie');
              }}
              aria-label="Sevimlilarga qo'shish"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill={saved ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
            {isSoon ? (
              <div className="movies-item-badge movies-item-badge-soon">
                {t('searchModal.tezOrada', 'Tez orada')}
              </div>
            ) : (
              <div className="movies-item-badge movies-item-badge-fhd">FHD</div>
            )}
            {showAge && (
              <div className="movies-item-badge movies-item-badge-age">{movie.ageRestriction}+</div>
            )}
            {showRating && (
              <div className="movies-item-rating">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#ffd700" stroke="none">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span>{formatMovieRating(movie.rating)}</span>
              </div>
            )}
          </>
        )}
      </div>
      <h3 className="movies-item-title">{title}</h3>
      {metaText ? <p className="movies-item-meta">{metaText}</p> : null}
    </article>
  );
};

export const ForYouMovieCardSkeleton = () => (
  <div className="movies-item movies-item-horizontal movies-item--skeleton" aria-hidden="true">
    <div className="movies-item-image-wrapper">
      <SkeletonLoader
        variant="movie-image"
        className="movies-item-image-skeleton loader-skeleton"
      />
      <span className="movies-item-wishlist-btn movies-item-wishlist-btn--skeleton" />
      <span className="movies-item-badge movies-item-badge-fhd movies-item-badge--skeleton" />
      <span className="movies-item-badge movies-item-badge-age movies-item-badge--skeleton" />
      <span className="movies-item-rating movies-item-rating--skeleton" />
    </div>
    <span className="movies-item-title movies-item-title--skeleton" />
    <span className="movies-item-meta movies-item-meta--skeleton" />
  </div>
);

export default ForYouMovieCard;
