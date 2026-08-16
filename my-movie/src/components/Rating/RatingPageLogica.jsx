import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useAuth } from '../../context/AuthContext';
import { requestOpenAuthModal } from '../../authModalBridge';
import { fetchRatingHistory } from '../../api/ratingApi';
import { formatMovieRating } from './CalculateRating';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import { useImageReady } from '../../utils/useImageReady';
import '../Movies/Movies.css';
import './RatingPageLogica.css';

const EMPTY_IMG_SRC = '/img/ReytingImg_preview_rev_1.png';

const pickLocalized = (value, lang) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[lang] || value.uz || value.ru || '';
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
  const { isLoggedIn, authReady } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authReady) return undefined;

    if (!isLoggedIn) {
      setHistory([]);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const data = await fetchRatingHistory();
        if (cancelled) return;
        setHistory(Array.isArray(data?.history) ? data.history : []);
      } catch {
        if (!cancelled) setHistory([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authReady, isLoggedIn]);

  useEffect(() => {
    if (!authReady || isLoggedIn) return;
    requestOpenAuthModal('register');
  }, [authReady, isLoggedIn]);

  if (!authReady || loading) {
    return <RatingPageEmptySkeleton />;
  }

  if (!isLoggedIn || !history.length) {
    return <RatingPageEmpty />;
  }

  return (
    <div className="rating-page-grid">
      {history.map((item) => {
        const snap = item.snapshot || {};
        const movieId = item.movieId ?? snap.id;
        const title =
          pickLocalized(snap.title, contentLang) || 'Nomsiz kino';
        const image =
          pickLocalized(snap.homeImg, contentLang) ||
          snap.poster ||
          snap.image ||
          '/img/movie1.jpg';
        const displayRating =
          item.ratingAfter != null ? item.ratingAfter : snap.rating;
        const userVote = item.value;

        return (
          <div
            key={`${movieId}-${item.updatedAt || item.createdAt || userVote}`}
            className="movies-item rating-page-movie-item"
            role="button"
            tabIndex={0}
            onClick={() => movieId != null && navigate(`/movie/${movieId}`)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                if (movieId != null) navigate(`/movie/${movieId}`);
              }
            }}
          >
            <div className="movies-item-image-wrapper">
              <img src={image} alt={title} className="movies-item-image" />
              <div className="movies-item-badge movies-item-badge-fhd">FHD</div>
              {snap?.ageRestriction != null && (
                <div className="movies-item-badge movies-item-badge-age">
                  {snap.ageRestriction}+
                </div>
              )}
              <div className="movies-item-rating">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#ffd700" stroke="none">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span>{formatMovieRating(displayRating)}</span>
              </div>
              <div className="rating-page-user-vote">
                {t('ratingPage.ratedLabel')}:
                <span className="rating-page-user-vote-value">
                  <span className="rating-page-user-vote-star" aria-hidden="true">★</span>{' '}
                  {userVote}
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
