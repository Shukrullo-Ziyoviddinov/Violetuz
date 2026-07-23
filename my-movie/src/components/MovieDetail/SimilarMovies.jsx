import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useWishlist } from '../../context/WishlistContext';
import { useMoviesApi } from '../../context/MoviesApiContext';
import HorizontalScroll from '../HorizontalScroll/HorizontalScroll';
import ShowMoreButton, { getDisplayItems, DEFAULT_LIMIT } from '../ShowMoreButton/ShowMoreButton';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import { useImageReady } from '../../utils/useImageReady';
import './SimilarMovies.css';

const SKELETON_COUNT = 6;

/** Poster thumb — image + overlay skeletons until poster loads (cache-safe) */
const SimilarMovieItem = ({ movie, contentLang, getMovieTitle, onOpen, isInWishlist, toggleWishlist, t }) => {
  const imgSrc = movie.homeImg
    ? movie.homeImg[contentLang] || movie.homeImg.uz || movie.homeImg.ru || ''
    : '';

  const { showSkeleton: showImgSkeleton, imgRef, onLoad, onError, failed: imgFailed } =
    useImageReady(imgSrc);

  const isSoon = movie.category === 'anonslar';
  const showRating =
    !isSoon && movie.rating != null && movie.rating !== '' && movie.rating !== 'none';
  const showAge = movie.ageRestriction != null;

  return (
    <div
      className={`similar-movies-item${showImgSkeleton ? ' similar-movies-item--loading' : ''}`}
      onClick={() => !showImgSkeleton && onOpen?.(movie.id)}
      aria-busy={showImgSkeleton || undefined}
    >
      <div className="similar-movies-item-image-wrapper">
        {showImgSkeleton && (
          <SkeletonLoader
            variant="similar-movies-image"
            className="similar-movies-item-image-skeleton"
          />
        )}
        {!imgFailed && imgSrc && (
          <img
            ref={imgRef}
            src={imgSrc}
            alt={getMovieTitle(movie)}
            className={`similar-movies-item-image${
              showImgSkeleton ? ' similar-movies-item-image--loading' : ''
            }`}
            onLoad={onLoad}
            onError={onError}
          />
        )}

        {showImgSkeleton ? (
          <>
            <span
              className="similar-movies-item-wishlist-btn similar-movies-item-wishlist-btn--skeleton"
              aria-hidden="true"
            />
            <span
              className={`similar-movies-item-badge similar-movies-item-badge--skeleton ${
                isSoon ? 'similar-movies-item-badge-soon' : 'similar-movies-item-badge-fhd'
              }`}
              aria-hidden="true"
            />
            {showAge && (
              <span
                className="similar-movies-item-badge similar-movies-item-badge-age similar-movies-item-badge--skeleton"
                aria-hidden="true"
              />
            )}
            {showRating && (
              <span
                className="similar-movies-item-rating similar-movies-item-rating--skeleton"
                aria-hidden="true"
              />
            )}
          </>
        ) : (
          <>
            <button
              className={`similar-movies-item-wishlist-btn ${
                isInWishlist(movie.id, 'movie') ? 'active' : ''
              }`}
              onClick={(e) => {
                e.stopPropagation();
                toggleWishlist(movie.id, 'movie');
              }}
              aria-label={t('wishlist.add') || "Sevimlilarga qo'shish"}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill={isInWishlist(movie.id, 'movie') ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
            {isSoon ? (
              <div className="similar-movies-item-badge similar-movies-item-badge-soon">
                {t('searchModal.tezOrada', 'Tez orada')}
              </div>
            ) : (
              <div className="similar-movies-item-badge similar-movies-item-badge-fhd">
                FHD
              </div>
            )}
            {showAge && (
              <div className="similar-movies-item-badge similar-movies-item-badge-age">
                {movie.ageRestriction}+
              </div>
            )}
            {showRating && (
              <div className="similar-movies-item-rating">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="#ffd700"
                  stroke="none"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                <span>{movie.rating}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const SimilarMovies = ({ currentMovie }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { contentLang } = useContentLanguage();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { allMovies, moviesLoading } = useMoviesApi();

  const showSectionSkeleton = Boolean(moviesLoading);

  const currentTypeCategory = currentMovie
    ? Array.isArray(currentMovie.typeCategory)
      ? currentMovie.typeCategory.map((tc) => String(tc).toLowerCase().trim())
      : currentMovie.typeCategory
        ? [String(currentMovie.typeCategory).toLowerCase().trim()]
        : []
    : [];

  const currentFilterCountry = currentMovie?.filterCountry
    ? String(currentMovie.filterCountry).toLowerCase().trim()
    : '';

  const similarMovies =
    !currentMovie || showSectionSkeleton
      ? []
      : allMovies.filter((movie) => {
          if (movie.id === currentMovie.id) return false;
          if (!movie.typeCategory && !movie.filterCountry) return false;

          const movieTypeCategory = Array.isArray(movie.typeCategory)
            ? movie.typeCategory.map((tc) => String(tc).toLowerCase().trim())
            : movie.typeCategory
              ? [String(movie.typeCategory).toLowerCase().trim()]
              : [];

          const movieFilterCountry = movie.filterCountry
            ? String(movie.filterCountry).toLowerCase().trim()
            : '';

          const hasMatchingTypeCategory =
            currentTypeCategory.length > 0 &&
            movieTypeCategory.length > 0 &&
            currentTypeCategory.some((ctc) => movieTypeCategory.includes(ctc));

          const hasMatchingFilterCountry =
            currentFilterCountry &&
            movieFilterCountry &&
            currentFilterCountry === movieFilterCountry;

          return hasMatchingTypeCategory || hasMatchingFilterCountry;
        });

  const getMovieTitle = (movie) => {
    if (movie.title && typeof movie.title === 'object') {
      return movie.title[contentLang] || movie.title.uz || movie.title.ru;
    }
    return movie.title || '';
  };

  const handleMovieClick = (movieId) => {
    navigate(`/movie/${movieId}`);
  };

  if (!showSectionSkeleton && (!currentMovie || similarMovies.length === 0)) {
    return null;
  }

  const moreToPath = currentMovie ? `/similar-movies/${currentMovie.id}` : '#';
  const displayMovies = showSectionSkeleton
    ? []
    : getDisplayItems(similarMovies, DEFAULT_LIMIT);

  return (
    <div
      className={`similar-movies${showSectionSkeleton ? ' similar-movies--skeleton' : ''}`}
      aria-busy={showSectionSkeleton || undefined}
    >
      <div className="similar-movies-header">
        {showSectionSkeleton ? (
          <SkeletonLoader
            variant="similar-movies-title"
            className="similar-movies-title-skeleton"
          />
        ) : (
          <h3 className="similar-movies-title">
            {i18n.language === 'uz' ? "O'xshash filimlar" : 'Похожие фильмы'}
          </h3>
        )}
        {!showSectionSkeleton && <ShowMoreButton to={moreToPath} />}
      </div>
      <HorizontalScroll scrollAmount={300}>
        {showSectionSkeleton
          ? Array.from({ length: SKELETON_COUNT }, (_, i) => (
              <div
                key={`similar-sk-${i}`}
                className="similar-movies-item similar-movies-item--skeleton"
                aria-hidden="true"
              >
                <div className="similar-movies-item-image-wrapper">
                  <SkeletonLoader
                    variant="similar-movies-image"
                    className="similar-movies-item-image-skeleton"
                  />
                  <span
                    className="similar-movies-item-wishlist-btn similar-movies-item-wishlist-btn--skeleton"
                    aria-hidden="true"
                  />
                  <span
                    className="similar-movies-item-badge similar-movies-item-badge-fhd similar-movies-item-badge--skeleton"
                    aria-hidden="true"
                  />
                  <span
                    className="similar-movies-item-rating similar-movies-item-rating--skeleton"
                    aria-hidden="true"
                  />
                </div>
              </div>
            ))
          : displayMovies.map((movie) => (
              <SimilarMovieItem
                key={movie.id}
                movie={movie}
                contentLang={contentLang}
                getMovieTitle={getMovieTitle}
                onOpen={handleMovieClick}
                isInWishlist={isInWishlist}
                toggleWishlist={toggleWishlist}
                t={t}
              />
            ))}
      </HorizontalScroll>
    </div>
  );
};

export default SimilarMovies;
