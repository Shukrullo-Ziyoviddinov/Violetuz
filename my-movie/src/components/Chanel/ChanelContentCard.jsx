import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useWishlist } from '../../context/WishlistContext';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import { useImageReady } from '../../utils/useImageReady';
import { formatMovieRating } from '../Rating/CalculateRating';
import '../Movies/Movies.css';

const movieTitle = (movie, contentLang) => {
  if (movie?.title && typeof movie.title === 'object') {
    return movie.title[contentLang] || movie.title.uz || movie.title.ru || '';
  }
  return movie?.title || '';
};

const WishlistButton = ({ saved, onToggle }) => (
  <button
    type="button"
    className={`movies-item-wishlist-btn${saved ? ' active' : ''}`}
    onClick={(event) => {
      event.stopPropagation();
      onToggle();
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
);

const MEDIA_ROUTE = {
  music: (item) => `/music/${item.id}`,
  klip: (item) => `/music/video/${item.id}`,
  album: (item) => `/music/album/${item.id}`,
};

const MEDIA_WISHLIST = {
  music: 'music',
  klip: 'klip',
  album: 'album',
};

const ChanelContentCard = ({ kind, item, layout = 'grid', rank = null, forceSkeleton = false }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { contentLang } = useContentLanguage();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const isMovie = kind === 'movie';
  const title = isMovie ? movieTitle(item, contentLang) : item?.title || '';
  const imgSrc = isMovie
    ? (item?.homeImg
      ? item.homeImg[contentLang] || item.homeImg.uz || item.homeImg.ru || ''
      : '')
    : item?.img || '';
  const wishlistType = isMovie ? 'movie' : (MEDIA_WISHLIST[kind] || 'music');
  const { showSkeleton: imageSkeleton, imgRef, onLoad, onError, failed } = useImageReady(imgSrc);
  const showSkeleton = forceSkeleton || imageSkeleton;
  const saved = isInWishlist(item.id, wishlistType);
  const isSoon = isMovie && item.category === 'anonslar';
  const showRating = isMovie
    && !isSoon
    && !showSkeleton
    && item.rating != null
    && item.rating !== ''
    && item.rating !== 'none';
  const showAge = isMovie && !showSkeleton && rank == null && item.ageRestriction != null;
  const year = isMovie ? item.specs?.year : item?.year;
  const countries = isMovie && Array.isArray(item.specs?.countries)
    ? item.specs.countries.filter(Boolean).join(', ')
    : '';
  const metaParts = [];
  if (year != null && year !== '') metaParts.push(`${year}-yil`);
  if (countries) metaParts.push(countries);
  const metaText = metaParts.join(' ');
  const horizontal = layout === 'row';

  const open = () => {
    if (showSkeleton) return;
    navigate(isMovie ? `/movie/${item.id}` : `/music/${item.id}`);
  };

  return (
    <article
      className={`movies-item${horizontal ? ' movies-item-horizontal' : ''}${
        showSkeleton ? ' movies-item--loading' : ''
      }`}
      onClick={open}
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
          <span className="movies-item-wishlist-btn movies-item-wishlist-btn--skeleton" aria-hidden="true" />
        ) : (
          <>
            <WishlistButton
              saved={saved}
              onToggle={() => toggleWishlist(item.id, wishlistType)}
            />
            {isMovie && (isSoon ? (
              <div className="movies-item-badge movies-item-badge-soon">
                {t('searchModal.tezOrada', 'Tez orada')}
              </div>
            ) : (
              <div className="movies-item-badge movies-item-badge-fhd">FHD</div>
            ))}
            {showAge && (
              <div className="movies-item-badge movies-item-badge-age">{item.ageRestriction}+</div>
            )}
            {rank != null ? (
              <span className="chanel-weekly-top-rank" aria-hidden="true">{rank}</span>
            ) : null}
            {showRating && (
              <div className="movies-item-rating">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#ffd700" stroke="none">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span>{formatMovieRating(item.rating)}</span>
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

export default ChanelContentCard;
