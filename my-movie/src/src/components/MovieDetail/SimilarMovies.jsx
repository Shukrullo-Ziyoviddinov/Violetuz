import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useWishlist } from '../../context/WishlistContext';
import { allMovies } from '../../data/movies';
import HorizontalScroll from '../HorizontalScroll/HorizontalScroll';
import ShowMoreButton, { getDisplayItems, DEFAULT_LIMIT } from '../ShowMoreButton/ShowMoreButton';
import './SimilarMovies.css';

const SimilarMovies = ({ currentMovie }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { contentLang } = useContentLanguage();
  const { toggleWishlist, isInWishlist } = useWishlist();

  if (!currentMovie) return null;

  const currentTypeCategory = Array.isArray(currentMovie.typeCategory)
    ? currentMovie.typeCategory.map((tc) => String(tc).toLowerCase().trim())
    : currentMovie.typeCategory
    ? [String(currentMovie.typeCategory).toLowerCase().trim()]
    : [];

  const currentFilterCountry = currentMovie.filterCountry
    ? String(currentMovie.filterCountry).toLowerCase().trim()
    : '';

  const similarMovies = allMovies.filter((movie) => {
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

  if (similarMovies.length === 0) {
    return null;
  }

  const moreToPath = `/similar-movies/${currentMovie.id}`;
  const displayMovies = getDisplayItems(similarMovies, DEFAULT_LIMIT);

  return (
    <div className="similar-movies">
      <div className="similar-movies-header">
        <h3 className="similar-movies-title">
          {i18n.language === 'uz' ? "O'xshash filimlar" : 'Похожие фильмы'}
        </h3>
        <ShowMoreButton to={moreToPath} />
      </div>
      <HorizontalScroll scrollAmount={300}>
        {displayMovies.map((movie) => (
          <div
            key={movie.id}
            className="similar-movies-item"
            onClick={() => handleMovieClick(movie.id)}
          >
              <div className="similar-movies-item-image-wrapper">
                <img
                  src={
                    movie.homeImg
                      ? movie.homeImg[contentLang] ||
                        movie.homeImg.uz ||
                        movie.homeImg.ru
                      : ''
                  }
                  alt={getMovieTitle(movie)}
                  className="similar-movies-item-image"
                />
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
                {movie.category === 'anonslar' ? (
                  <div className="similar-movies-item-badge similar-movies-item-badge-soon">
                    {t('searchModal.tezOrada', 'Tez orada')}
                  </div>
                ) : (
                  <div className="similar-movies-item-badge similar-movies-item-badge-fhd">
                    FHD
                  </div>
                )}
                {movie.ageRestriction != null && (
                  <div className="similar-movies-item-badge similar-movies-item-badge-age">
                    {movie.ageRestriction}+
                  </div>
                )}
                {movie.category !== 'anonslar' &&
                  movie.rating != null &&
                  movie.rating !== '' &&
                  movie.rating !== 'none' && (
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
              </div>
            </div>
          ))}
      </HorizontalScroll>
    </div>
  );
};

export default SimilarMovies;
