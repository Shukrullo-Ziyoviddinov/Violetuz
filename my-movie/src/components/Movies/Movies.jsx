import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useWishlist } from '../../context/WishlistContext';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useMoviesApi } from '../../context/MoviesApiContext';
import HorizontalScroll from '../HorizontalScroll/HorizontalScroll';
import ShowMoreButton, { getDisplayItems, shouldShowMore, DEFAULT_LIMIT } from '../ShowMoreButton/ShowMoreButton';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import { useImageReady } from '../../utils/useImageReady';
import './Movies.css';

/** Poster — image + overlay skeletons until poster loads (cache-safe) */
const MoviePosterItem = ({
  movie,
  isHorizontal,
  isWideLayout,
  contentLang,
  getMovieTitle,
  onOpen,
  isInWishlist,
  toggleWishlist,
  t,
  blockClick,
}) => {
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
      className={`movies-item ${isHorizontal ? 'movies-item-horizontal' : ''} ${isWideLayout ? 'movies-item-wide' : ''}${
        showImgSkeleton ? ' movies-item--loading' : ''
      }`}
      onClick={() => !blockClick && !showImgSkeleton && onOpen?.(movie.id)}
      aria-busy={showImgSkeleton || undefined}
    >
      <div className="movies-item-image-wrapper">
        {showImgSkeleton && (
          <SkeletonLoader
            variant="movie-image"
            className="movies-item-image-skeleton loader-skeleton"
          />
        )}
        {!imgFailed && imgSrc && (
          <img
            ref={imgRef}
            src={imgSrc}
            alt={getMovieTitle(movie)}
            className={`movies-item-image${showImgSkeleton ? ' movies-item-image--loading' : ''}`}
            onLoad={onLoad}
            onError={onError}
          />
        )}

        {showImgSkeleton ? (
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
              <span
                className="movies-item-rating movies-item-rating--skeleton"
                aria-hidden="true"
              />
            )}
          </>
        ) : (
          <>
            <button
              className={`movies-item-wishlist-btn ${isInWishlist(movie.id, 'movie') ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleWishlist(movie.id, 'movie');
              }}
              aria-label="Sevimlilarga qo'shish"
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

const Movies = ({
  sectionType = 'recommended',
  limit = DEFAULT_LIMIT,
  filteredMovies = null,
  showHorizontalScroll = false,
  headerTitle = null,
  headerCount = null,
  hideHeader = false,
  moreTo = null,
  isLoading: isLoadingProp = null,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { contentLang } = useContentLanguage();
  const { allMovies, moviesLoading } = useMoviesApi();
  const isLoading = isLoadingProp ?? moviesLoading;

  const allMoviesData = filteredMovies || allMovies;

  const shouldShowLimit = limit != null;
  const displayMovies = getDisplayItems(allMoviesData, shouldShowLimit ? limit : null);
  const hasMoreMovies = shouldShowMore(allMoviesData, limit, moreTo);

  const skeletonItems = useMemo(() => {
    const count = shouldShowLimit && Number(limit) > 0 ? Number(limit) : DEFAULT_LIMIT;
    return Array.from({ length: count }, (_, index) => ({ id: `movie-skeleton-${index}`, _skeleton: true }));
  }, [shouldShowLimit, limit]);

  const showSectionSkeleton = isLoading && displayMovies.length === 0;
  const itemsToRender = showSectionSkeleton ? skeletonItems : displayMovies;
  const showTitleSkeleton = showSectionSkeleton;

  const getMovieTitle = (movie) => {
    if (movie.title && typeof movie.title === 'object') {
      return movie.title[contentLang] || movie.title.uz || movie.title.ru;
    }
    return movie.title || '';
  };

  const handleMovieClick = (movieId) => {
    navigate(`/movie/${movieId}`);
  };

  const isHorizontal =
    showHorizontalScroll &&
    (sectionType === 'all' ||
      sectionType === 'recommended' ||
      sectionType === 'topRated' ||
      sectionType === 'koreaDrama' ||
      sectionType === 'kinolar' ||
      sectionType === 'actionMovies' ||
      sectionType === 'horrorMovies' ||
      sectionType === 'anime' ||
      sectionType === 'adventureMovies' ||
      sectionType === 'romanceMovies' ||
      sectionType === 'retroMovies' ||
      sectionType === 'uzbekMovies' ||
      sectionType === 'worldMovies' ||
      sectionType === 'animations' ||
      sectionType === 'turkishSeries' ||
      sectionType === 'russianMovies' ||
      sectionType === 'tvSeries');
  const useHorizontalScrollLayout = isHorizontal && (shouldShowLimit || sectionType === 'all');
  const isWideLayout = false;

  const renderMovieItem = (movie) => {
    if (movie._skeleton) {
      return (
        <div
          key={movie.id}
          className={`movies-item movies-item--skeleton ${isHorizontal ? 'movies-item-horizontal' : ''} ${isWideLayout ? 'movies-item-wide' : ''}`}
          aria-hidden="true"
        >
          <div className="movies-item-image-wrapper">
            <SkeletonLoader
              variant="movie-image"
              className="movies-item-image-skeleton loader-skeleton"
            />
            <span
              className="movies-item-wishlist-btn movies-item-wishlist-btn--skeleton"
              aria-hidden="true"
            />
            <span
              className="movies-item-badge movies-item-badge-fhd movies-item-badge--skeleton"
              aria-hidden="true"
            />
            <span
              className="movies-item-rating movies-item-rating--skeleton"
              aria-hidden="true"
            />
          </div>
        </div>
      );
    }

    return (
      <MoviePosterItem
        key={movie.id}
        movie={movie}
        isHorizontal={isHorizontal}
        isWideLayout={isWideLayout}
        contentLang={contentLang}
        getMovieTitle={getMovieTitle}
        onOpen={handleMovieClick}
        isInWishlist={isInWishlist}
        toggleWishlist={toggleWishlist}
        t={t}
        blockClick={isLoading}
      />
    );
  };

  return (
    <div className="movies" aria-busy={isLoading || showSectionSkeleton || undefined}>
      <div className="movies-container">
        {!hideHeader && (
          <div className={`movies-header ${headerCount !== null ? 'movies-header--centered' : ''}`}>
            {headerCount !== null && (
              <p className="movies-header-count">{headerCount} {t('movies.all')}</p>
            )}
            {showTitleSkeleton ? (
              <SkeletonLoader
                variant="movies-title"
                className="movies-title-skeleton"
                width={180}
                height={28}
              />
            ) : (
              <h2 className="movies-title">{headerTitle || t(`movies.${sectionType}`)}</h2>
            )}
            {headerCount === null && hasMoreMovies && !isLoading && (
              <ShowMoreButton to={moreTo || '/recommended'} />
            )}
          </div>
        )}
        <div className="movies-content-wrapper">
          {useHorizontalScrollLayout ? (
            <HorizontalScroll>
              {itemsToRender.map((movie) => renderMovieItem(movie))}
            </HorizontalScroll>
          ) : (
            <div className="movies-grid">
              {itemsToRender.map((movie) => renderMovieItem(movie))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Movies;
