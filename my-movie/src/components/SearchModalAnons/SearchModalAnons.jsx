import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import HorizontalScroll from '../HorizontalScroll/HorizontalScroll';
import ShowMoreButton from '../ShowMoreButton/ShowMoreButton';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useMoviesApi } from '../../context/MoviesApiContext';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import { useImageReady } from '../../utils/useImageReady';
import { normalizeImagePath } from '../../utils/utils';
import './SearchModalAnons.css';

/** Faqat real anons item — rasm/badge tayyor bo‘lguncha shu blok ichida loader */
const SearchModalAnonsItem = ({ item, title, imgSrc, onOpen, t }) => {
  const src = normalizeImagePath(imgSrc || '');
  const { showSkeleton, imgRef, onLoad, onError, failed } = useImageReady(src);
  const showAge = item.ageRestriction != null;

  return (
    <div
      className={`search-modal-anons-item${showSkeleton ? ' search-modal-anons-item--loading' : ''}`}
      onClick={() => !showSkeleton && onOpen?.(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (showSkeleton) return;
        if (e.key === 'Enter') onOpen?.(item);
      }}
      aria-busy={showSkeleton || undefined}
    >
      <div className="search-modal-anons-item-image-wrapper">
        {showSkeleton && (
          <SkeletonLoader
            variant="search-modal-anons-image"
            className="search-modal-anons-item-image-skeleton"
          />
        )}
        {!failed && src && (
          <img
            ref={imgRef}
            src={src}
            alt={title}
            className={`search-modal-anons-item-image${
              showSkeleton ? ' search-modal-anons-item-image--loading' : ''
            }`}
            onLoad={onLoad}
            onError={onError}
          />
        )}

        {showSkeleton ? (
          <>
            <span
              className="search-modal-anons-badge search-modal-anons-badge-soon search-modal-anons-badge--skeleton"
              aria-hidden="true"
            >
              {t('searchModal.tezOrada', 'Tez orada')}
            </span>
            {showAge && (
              <span
                className="search-modal-anons-badge search-modal-anons-badge-age search-modal-anons-badge--skeleton"
                aria-hidden="true"
              >
                {item.ageRestriction}+
              </span>
            )}
          </>
        ) : (
          <>
            <span className="search-modal-anons-badge search-modal-anons-badge-soon">
              {t('searchModal.tezOrada', 'Tez orada')}
            </span>
            {showAge && (
              <span className="search-modal-anons-badge search-modal-anons-badge-age">
                {item.ageRestriction}+
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const SearchModalAnons = ({ onAnonsClick }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { contentLang } = useContentLanguage();
  const { getMoviesByCategory, moviesLoading } = useMoviesApi();
  const anonslar = getMoviesByCategory('anonslar');

  const getTitle = (item) => {
    if (item.title && typeof item.title === 'object') {
      return item.title[contentLang] || item.title.uz || item.title.ru;
    }
    return item.title || '';
  };

  const getImg = (item) => {
    if (item.homeImg && typeof item.homeImg === 'object') {
      return item.homeImg[contentLang] || item.homeImg.uz || item.homeImg.ru;
    }
    return item.homeImg || item.img || '';
  };

  const handleClick = (item) => {
    if (onAnonsClick) onAnonsClick();
    navigate(`/movie/${item.id}`);
  };

  const handleMoreClick = () => {
    if (onAnonsClick) onAnonsClick();
    navigate('/category/anonslar');
  };

  /* Fake kartalar yo‘q — faqat real anonslar */
  if (!moviesLoading && anonslar.length === 0) {
    return null;
  }

  const waitingForList = moviesLoading && anonslar.length === 0;

  return (
    <div
      className="search-modal-anons"
      aria-busy={waitingForList || undefined}
    >
      <div className="search-modal-anons-header">
        {waitingForList ? (
          <SkeletonLoader
            variant="search-modal-anons-title"
            className="search-modal-anons-title-skeleton"
          />
        ) : (
          <h3 className="search-modal-anons-title">
            {t('searchModal.anonslar', 'Anonslar')}
          </h3>
        )}
        {!waitingForList && (
          <ShowMoreButton
            to="/category/anonslar"
            onClick={handleMoreClick}
            className="search-modal-anons-more-btn"
          />
        )}
      </div>
      {anonslar.length > 0 && (
        <HorizontalScroll scrollAmount={120}>
          {anonslar.map((item) => (
            <SearchModalAnonsItem
              key={item.id}
              item={item}
              title={getTitle(item)}
              imgSrc={getImg(item)}
              onOpen={handleClick}
              t={t}
            />
          ))}
        </HorizontalScroll>
      )}
    </div>
  );
};

export default SearchModalAnons;
