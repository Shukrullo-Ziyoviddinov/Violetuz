import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { recommendedMovies, allMovies } from '../../data/movies';
import { useWishlist } from '../../context/WishlistContext';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useLoading } from '../../context/LoadingContext';
import HorizontalScroll from '../HorizontalScroll/HorizontalScroll';
import ShowMoreButton, { getDisplayItems, shouldShowMore, DEFAULT_LIMIT } from '../ShowMoreButton/ShowMoreButton';
import LoaderSkeleton from '../LoaderSkeleton/LoaderSkeleton';
import './Movies.css';

const Movies = ({ sectionType = 'recommended', limit = DEFAULT_LIMIT, filteredMovies = null, showHorizontalScroll = false, headerTitle = null, headerCount = null, hideHeader = false, moreTo = null, isLoading: isLoadingProp = null }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { contentLang } = useContentLanguage();
  const { moviesLoading } = useLoading();
  const isLoading = isLoadingProp ?? moviesLoading;

  let allMoviesData = filteredMovies || allMovies;
  if (sectionType === 'recommended' && !filteredMovies) {
    allMoviesData = recommendedMovies;
  }

  const shouldShowLimit = limit != null;
  const displayMovies = getDisplayItems(allMoviesData, shouldShowLimit ? limit : null);
  const hasMoreMovies = shouldShowMore(allMoviesData, limit, moreTo);

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

  const renderMovieItem = (movie) => (
    <div
      key={movie.id}
      className={`movies-item ${isHorizontal ? 'movies-item-horizontal' : ''} ${isWideLayout ? 'movies-item-wide' : ''}`}
      onClick={() => !isLoading && handleMovieClick(movie.id)}
    >
      <div className="movies-item-image-wrapper">
        {isLoading ? (
          <LoaderSkeleton variant="image" />
        ) : (
          <>
            <img
              src={movie.homeImg ? (movie.homeImg[contentLang] || movie.homeImg.uz || movie.homeImg.ru) : ''}
              alt={getMovieTitle(movie)}
              className="movies-item-image"
            />
            <button
              className={`movies-item-wishlist-btn ${isInWishlist(movie.id, 'movie') ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleWishlist(movie.id, 'movie');
              }}
              aria-label="Sevimlilarga qo'shish"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={isInWishlist(movie.id, 'movie') ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
            {movie.category === 'anonslar' ? (
              <div className="movies-item-badge movies-item-badge-soon">{t('searchModal.tezOrada', 'Tez orada')}</div>
            ) : (
              <div className="movies-item-badge movies-item-badge-fhd">FHD</div>
            )}
            {movie.ageRestriction != null && (
              <div className="movies-item-badge movies-item-badge-age">{movie.ageRestriction}+</div>
            )}
            {movie.category !== 'anonslar' && movie.rating != null && movie.rating !== '' && movie.rating !== 'none' && (
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

  return (
    <div className="movies">
      <div className="movies-container">
        {!hideHeader && (
          <div className={`movies-header ${headerCount !== null ? 'movies-header--centered' : ''}`}>
            {headerCount !== null && (
              <p className="movies-header-count">{headerCount} {t('movies.all')}</p>
            )}
            {isLoading ? (
              <LoaderSkeleton variant="text" className="movies-title-skeleton" width="180px" height="28px" />
            ) : (
              <h2 className="movies-title">{headerTitle || t(`movies.${sectionType}`)}</h2>
            )}
            {headerCount === null && hasMoreMovies && (
              isLoading ? (
                <LoaderSkeleton variant="button" className="more-btn-skeleton" width="90px" height="36px" />
              ) : (
                <ShowMoreButton to={moreTo || '/recommended'} />
              )
            )}
          </div>
        )}
        <div className="movies-content-wrapper">
          {useHorizontalScrollLayout ? (
            <HorizontalScroll>
              {displayMovies.map((movie) => renderMovieItem(movie))}
            </HorizontalScroll>
          ) : (
            <div className="movies-grid">
              {displayMovies.map((movie) => renderMovieItem(movie))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Movies;
