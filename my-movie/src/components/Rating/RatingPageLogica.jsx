import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMoviesApi } from '../../context/MoviesApiContext';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { calculateMovieRating, formatMovieRating, getMovieLastVote } from './CalculateRating';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import { useImageReady } from '../../utils/useImageReady';
import '../Movies/Movies.css';
import './RatingPageLogica.css';

const EMPTY_IMG_SRC = '/img/ReytingImg_preview_rev_1.png';

const normalizeType = (typeValue) => {
  const raw = String(typeValue || '')
    .trim()
    .toLowerCase();
  if (raw === 'movie' || raw === 'kino') return 'movie';
  return raw;
};

const RatingPageEmptySkeleton = () => (
  <div className="rating-page-empty" aria-busy="true">
    <div className="rating-page-empty-img rating-page-empty-img--skeleton" aria-hidden="true">
      <SkeletonLoader variant="rating-page-empty-img" />
    </div>
    <div className="rating-page-empty-text rating-page-empty-text--skeleton" aria-hidden="true">
      <SkeletonLoader variant="rating-page-empty-text" />
    </div>
    <div className="rating-page-empty-actions" aria-hidden="true">
      <div className="rating-page-empty-btn rating-page-empty-btn--skeleton">
        <SkeletonLoader variant="rating-page-empty-btn" />
      </div>
    </div>
  </div>
);

const RatingPageEmpty = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showSkeleton: showImgSkeleton, imgRef, onLoad, onError } = useImageReady(EMPTY_IMG_SRC);

  if (showImgSkeleton) {
    return <RatingPageEmptySkeleton />;
  }

  return (
    <div className="rating-page-empty">
      <img
        ref={imgRef}
        className="rating-page-empty-img"
        src={EMPTY_IMG_SRC}
        alt=""
        decoding="async"
        onLoad={onLoad}
        onError={onError}
      />
      <p className="rating-page-empty-text">{t('ratingPage.emptyDescription')}</p>
      <div className="rating-page-empty-actions">
        <button
          type="button"
          className="rating-page-empty-btn"
          onClick={() => navigate('/')}
        >
          {t('ratingPage.emptyCta')}
        </button>
      </div>
    </div>
  );
};

const RatingPageLogica = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { contentLang } = useContentLanguage();
  const { allMovies, moviesLoading } = useMoviesApi();

  const ratedMovies = useMemo(() => {
    return allMovies
      .filter((movie) => normalizeType(movie?.type) === 'movie')
      .map((movie) => {
        const userVote = getMovieLastVote(movie.id);
        if (!userVote) return null;
        const calculatedRating = calculateMovieRating(movie.id, movie.rating);
        return {
          ...movie,
          userVote,
          calculatedRating,
        };
      })
      .filter(Boolean);
  }, [allMovies]);

  if (moviesLoading && !ratedMovies.length) {
    return <RatingPageEmptySkeleton />;
  }

  if (!ratedMovies.length) {
    return <RatingPageEmpty />;
  }

  return (
    <div className="rating-page-grid">
      {ratedMovies.map((movie) => {
        const title =
          movie?.title?.[contentLang] ||
          movie?.title?.uz ||
          movie?.title?.ru ||
          'Nomsiz kino';

        const image =
          movie?.homeImg?.[contentLang] ||
          movie?.homeImg?.uz ||
          movie?.homeImg?.ru ||
          '/img/movie1.jpg';

        return (
          <div
            key={movie.id}
            className="movies-item rating-page-movie-item"
            role="button"
            tabIndex={0}
            onClick={() => navigate(`/movie/${movie.id}`)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                navigate(`/movie/${movie.id}`);
              }
            }}
          >
            <div className="movies-item-image-wrapper">
              <img src={image} alt={title} className="movies-item-image" />
              <div className="movies-item-badge movies-item-badge-fhd">FHD</div>
              {movie?.ageRestriction != null && (
                <div className="movies-item-badge movies-item-badge-age">{movie.ageRestriction}+</div>
              )}
              <div className="movies-item-rating">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#ffd700" stroke="none">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span>{formatMovieRating(movie.calculatedRating)}</span>
              </div>
              <div className="rating-page-user-vote">
                {t('ratingPage.ratedLabel')}:
                <span className="rating-page-user-vote-value">
                  <span className="rating-page-user-vote-star" aria-hidden="true">★</span> {movie.userVote}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RatingPageLogica;
