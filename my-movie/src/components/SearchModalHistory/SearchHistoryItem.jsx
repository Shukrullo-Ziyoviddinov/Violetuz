import React, { useMemo } from 'react';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import { useImageReady } from '../../utils/useImageReady';
import './SearchHistoryItem.css';

/** Media tip → img-blok ichidagi fit: poster (baland) | wide (keng) */
export const HISTORY_MEDIA_FIT = Object.freeze({
  movie: 'poster',
  music: 'poster',
  klip: 'wide',
  konsert: 'wide',
});

/**
 * Snapshot / item dan title.
 * @param {object|null} snapshot
 * @param {string} contentLang
 */
export const getHistoryItemTitle = (snapshot, contentLang = 'uz') => {
  if (!snapshot) return '';
  if (snapshot.name && !snapshot.title) {
    return typeof snapshot.name === 'string' ? snapshot.name : '';
  }
  const title = snapshot.title;
  if (!title) return '';
  if (typeof title === 'object') {
    return (
      title[contentLang] || title.uz || title.ru || title.en || Object.values(title)[0] || ''
    );
  }
  return String(title);
};

/**
 * Snapshot dan rasm URL.
 * movie → homeImg; music/klip/konsert → img / imgArtist
 */
export const getHistoryItemImgSrc = (snapshot, type, contentLang = 'uz') => {
  if (!snapshot) return '';
  if (type === 'movie') {
    const home = snapshot.homeImg;
    if (home && typeof home === 'object') {
      return home[contentLang] || home.uz || home.ru || '';
    }
    return home || snapshot.img || '';
  }
  return snapshot.imgArtist || snapshot.img || '';
};

/**
 * Qidiruv tarixi kartochkasi — chapda kichik img-blok, o‘ngda name + type.
 * Img-blok o‘lchami barcha turlar uchun bir xil; ichida tipga qarab fit.
 */
const SearchHistoryItem = ({
  type = 'movie',
  title,
  typeLabel,
  imgSrc,
  onClick,
}) => {
  const src = imgSrc || '';
  const fit = HISTORY_MEDIA_FIT[type] || 'poster';
  const { showSkeleton, imgRef, onLoad, onError, failed } = useImageReady(src);

  const itemClass = useMemo(
    () =>
      [
        'search-history-item',
        `search-history-item--${type}`,
        `search-history-item--${fit}`,
        showSkeleton && 'search-history-item--loading',
      ]
        .filter(Boolean)
        .join(' '),
    [type, fit, showSkeleton]
  );

  return (
    <div
      className={itemClass}
      onClick={() => !showSkeleton && onClick?.()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (showSkeleton) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      aria-busy={showSkeleton || undefined}
    >
      <div className="search-history-item-media">
        {showSkeleton && (
          <SkeletonLoader
            variant="search-history-item-image"
            className="search-history-item-media-skeleton"
          />
        )}
        {!failed && src && (
          <img
            ref={imgRef}
            src={src}
            alt={title || ''}
            className={`search-history-item-img${
              showSkeleton ? ' search-history-item-img--loading' : ''
            }`}
            onLoad={onLoad}
            onError={onError}
          />
        )}
      </div>

      <div className="search-history-item-text" aria-hidden={showSkeleton || undefined}>
        {showSkeleton ? (
          <>
            <span className="search-history-item-title search-history-item-title--loading">
              <SkeletonLoader
                variant="search-history-item-title"
                className="search-history-item-title-skeleton"
              />
            </span>
            <span className="search-history-item-type search-history-item-type--loading">
              <SkeletonLoader
                variant="search-history-item-type"
                className="search-history-item-type-skeleton"
              />
            </span>
          </>
        ) : (
          <>
            {title ? <span className="search-history-item-title">{title}</span> : null}
            {typeLabel ? <span className="search-history-item-type">{typeLabel}</span> : null}
          </>
        )}
      </div>

      <span className="search-history-item-clock" aria-hidden="true">
        {showSkeleton ? null : (
          <i className="fa-regular fa-clock" />
        )}
      </span>
    </div>
  );
};

export default SearchHistoryItem;
