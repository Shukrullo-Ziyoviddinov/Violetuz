import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import HorizontalScroll from '../HorizontalScroll/HorizontalScroll';
import { useMoviesApi } from '../../context/MoviesApiContext';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import { useImageReady } from '../../utils/useImageReady';
import { normalizeImagePath } from '../../utils/utils';
import './SearchModalGenre.css';

/** Faqat real genre item — rasm tayyor bo‘lguncha shu blok ichida loader */
const SearchModalGenreItem = ({ genre, title, onOpen }) => {
  const imgSrc = normalizeImagePath(genre.img || '');
  const { showSkeleton, imgRef, onLoad, onError, failed } = useImageReady(imgSrc);

  return (
    <div
      className={`search-modal-genre-item${showSkeleton ? ' search-modal-genre-item--loading' : ''}`}
      onClick={() => !showSkeleton && onOpen?.(genre)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (showSkeleton) return;
        if (e.key === 'Enter') onOpen?.(genre);
      }}
      aria-busy={showSkeleton || undefined}
    >
      <div className="search-modal-genre-item-image-wrapper">
        {showSkeleton && (
          <SkeletonLoader
            variant="search-modal-genre-image"
            className="search-modal-genre-item-image-skeleton"
          />
        )}
        {!failed && imgSrc && (
          <img
            ref={imgRef}
            src={imgSrc}
            alt={title}
            className={`search-modal-genre-item-image${
              showSkeleton ? ' search-modal-genre-item-image--loading' : ''
            }`}
            onLoad={onLoad}
            onError={onError}
          />
        )}
        {showSkeleton ? (
          <span className="search-modal-genre-item-title search-modal-genre-item-title--loading">
            <SkeletonLoader
              variant="search-modal-genre-item-title"
              className="search-modal-genre-item-title-skeleton"
            />
          </span>
        ) : (
          <span className="search-modal-genre-item-title">{title}</span>
        )}
      </div>
    </div>
  );
};

const SearchModalGenre = ({ onGenreClick }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { contentLang } = useContentLanguage();
  const { allGenres, genresLoading } = useMoviesApi();

  const getGenreTitle = (genre) => {
    if (genre.title && typeof genre.title === 'object') {
      return genre.title[contentLang] || genre.title.uz || genre.title.ru;
    }
    return genre.title || '';
  };

  const handleGenreClick = (genre) => {
    if (onGenreClick) {
      onGenreClick();
    }
    const filterValue = Array.isArray(genre.filterGenre)
      ? genre.filterGenre[0]
      : genre.filterGenre;
    navigate(`/recommended?genre=${encodeURIComponent(filterValue)}`);
  };

  /* Fake kartalar yo‘q — title skeleton faqat DB kutayotganda; itemlar faqat real genres */
  if (!genresLoading && allGenres.length === 0) {
    return null;
  }

  return (
    <div
      className="search-modal-genre"
      aria-busy={genresLoading || undefined}
    >
      {genresLoading && allGenres.length === 0 ? (
        <SkeletonLoader
          variant="search-modal-genre-title"
          className="search-modal-genre-title-skeleton"
        />
      ) : (
        <h3 className="search-modal-genre-title">{t('filters.genre', 'Janr')}</h3>
      )}
      {allGenres.length > 0 && (
        <HorizontalScroll scrollAmount={320}>
          {allGenres.map((genre) => (
            <SearchModalGenreItem
              key={genre.id}
              genre={genre}
              title={getGenreTitle(genre)}
              onOpen={handleGenreClick}
            />
          ))}
        </HorizontalScroll>
      )}
    </div>
  );
};

export default SearchModalGenre;
