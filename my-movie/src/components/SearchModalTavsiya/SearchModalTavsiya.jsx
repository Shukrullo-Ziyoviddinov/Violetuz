import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useViewedMovies } from '../../context/ViewedMoviesContext';
import { useMoviesApi } from '../../context/MoviesApiContext';
import { getRecommendations } from '../../utils/getRecommendations';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import { useImageReady } from '../../utils/useImageReady';
import { normalizeImagePath } from '../../utils/utils';
import './SearchModalTavsiya.css';

/** Faqat real tavsiya item — rasm/badge tayyor bo‘lguncha shu blok ichida loader */
const SearchModalTavsiyaItem = ({ movie, title, imgSrc, onOpen, t }) => {
  const src = normalizeImagePath(imgSrc || '');
  const { showSkeleton, imgRef, onLoad, onError, failed } = useImageReady(src);
  const isSoon = movie.category === 'anonslar';
  const showAge = movie.ageRestriction != null;

  return (
    <div
      className={`search-modal-tavsiya-item${showSkeleton ? ' search-modal-tavsiya-item--loading' : ''}`}
      onClick={() => !showSkeleton && onOpen?.(movie)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (showSkeleton) return;
        if (e.key === 'Enter') onOpen?.(movie);
      }}
      aria-busy={showSkeleton || undefined}
    >
      <div className="search-modal-tavsiya-item-image-wrapper">
        {showSkeleton && (
          <SkeletonLoader
            variant="search-modal-tavsiya-image"
            className="search-modal-tavsiya-item-image-skeleton"
          />
        )}
        {!failed && src && (
          <img
            ref={imgRef}
            src={src}
            alt={title}
            className={`search-modal-tavsiya-item-image${
              showSkeleton ? ' search-modal-tavsiya-item-image--loading' : ''
            }`}
            onLoad={onLoad}
            onError={onError}
          />
        )}

        {showSkeleton ? (
          <>
            {isSoon ? (
              <span
                className="search-modal-tavsiya-badge search-modal-tavsiya-badge-soon search-modal-tavsiya-badge--skeleton"
                aria-hidden="true"
              >
                {t('searchModal.tezOrada', 'Tez orada')}
              </span>
            ) : (
              <span
                className="search-modal-tavsiya-badge search-modal-tavsiya-badge-fhd search-modal-tavsiya-badge--skeleton"
                aria-hidden="true"
              >
                FHD
              </span>
            )}
            {showAge && (
              <span
                className="search-modal-tavsiya-badge search-modal-tavsiya-badge-age search-modal-tavsiya-badge--skeleton"
                aria-hidden="true"
              >
                {movie.ageRestriction}+
              </span>
            )}
          </>
        ) : (
          <>
            {isSoon ? (
              <span className="search-modal-tavsiya-badge search-modal-tavsiya-badge-soon">
                {t('searchModal.tezOrada', 'Tez orada')}
              </span>
            ) : (
              <span className="search-modal-tavsiya-badge search-modal-tavsiya-badge-fhd">
                FHD
              </span>
            )}
            {showAge && (
              <span className="search-modal-tavsiya-badge search-modal-tavsiya-badge-age">
                {movie.ageRestriction}+
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const SearchModalTavsiya = ({ onMovieClick }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { contentLang } = useContentLanguage();
  const { getViewedItems } = useViewedMovies();
  const { allMovies } = useMoviesApi();
  const [recommendations, setRecommendations] = useState([]);
  const [tavsiyaLoading, setTavsiyaLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setTavsiyaLoading(true);
    // Umumiy search tavsiya — category engine emas (keyin alohida global algo).
    const viewedItems = getViewedItems();
    const list = getRecommendations(allMovies, viewedItems, 12);
    if (!cancelled) {
      setRecommendations(Array.isArray(list) ? list : []);
      setTavsiyaLoading(false);
    }
    return () => {
      cancelled = true;
    };
  }, [getViewedItems, allMovies]);

  const getTitle = (m) => {
    if (m?.title && typeof m.title === 'object') {
      return m.title[contentLang] || m.title.uz || m.title.ru;
    }
    return m?.title || '';
  };

  const getImg = (m) => {
    if (m?.homeImg && typeof m.homeImg === 'object') {
      return m.homeImg[contentLang] || m.homeImg.uz || m.homeImg.ru;
    }
    return m?.homeImg || '';
  };

  const handleClick = (movie) => {
    if (onMovieClick) onMovieClick();
    navigate(`/movie/${movie.id}`);
  };

  /* Fake kartalar yo‘q — faqat real tavsiyalar */
  if (!tavsiyaLoading && recommendations.length === 0) {
    return null;
  }

  const waitingForList = tavsiyaLoading && recommendations.length === 0;

  return (
    <div
      className="search-modal-tavsiya"
      aria-busy={waitingForList || undefined}
    >
      {waitingForList ? (
        <SkeletonLoader
          variant="search-modal-tavsiya-title"
          className="search-modal-tavsiya-title-skeleton"
        />
      ) : (
        <h3 className="search-modal-tavsiya-title">
          {t('searchModal.tavsiyaEtamiz', 'Tavsiya etamiz')}
        </h3>
      )}
      {recommendations.length > 0 && (
        <div className="search-modal-tavsiya-list">
          {recommendations.map((movie) => (
            <SearchModalTavsiyaItem
              key={movie.id}
              movie={movie}
              title={getTitle(movie)}
              imgSrc={getImg(movie)}
              onOpen={handleClick}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchModalTavsiya;
