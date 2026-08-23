import React from 'react';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import { useImageReady } from '../../utils/useImageReady';

/** Qidiruv kino kartochkasi — rasm + title/meta skeleton */
const SearchModalResultsMovieItem = ({
  imgSrc,
  title,
  metaText,
  isSoon,
  ageRestriction,
  soonLabel,
  onClick,
}) => {
  const src = imgSrc || '';
  const { showSkeleton, imgRef, onLoad, onError, failed } = useImageReady(src);

  return (
    <div
      className={`search-modal-results-item${
        showSkeleton ? ' search-modal-results-item--loading' : ''
      }`}
      onClick={() => !showSkeleton && onClick?.()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (showSkeleton) return;
        if (e.key === 'Enter') onClick?.();
      }}
      aria-busy={showSkeleton || undefined}
    >
      <div className="search-modal-results-item-image-wrapper">
        {showSkeleton && (
          <SkeletonLoader
            variant="search-modal-results-image"
            className="search-modal-results-item-image-skeleton"
          />
        )}
        {!failed && src && (
          <img
            ref={imgRef}
            src={src}
            alt={title || ''}
            className={`search-modal-results-item-image${
              showSkeleton ? ' search-modal-results-item-image--loading' : ''
            }`}
            onLoad={onLoad}
            onError={onError}
          />
        )}
        {!showSkeleton && isSoon && (
          <span className="search-modal-results-badge search-modal-results-badge-soon">
            {soonLabel}
          </span>
        )}
        {!showSkeleton && ageRestriction != null && (
          <span className="search-modal-results-badge search-modal-results-badge-age">
            {ageRestriction}+
          </span>
        )}
      </div>

      <div className="search-modal-results-item-text" aria-hidden={showSkeleton || undefined}>
        {showSkeleton ? (
          <>
            <span className="search-modal-results-item-title search-modal-results-item-title--loading">
              <SkeletonLoader
                variant="search-modal-results-title"
                className="search-modal-results-item-title-skeleton"
              />
            </span>
            <span className="search-modal-results-item-meta search-modal-results-item-meta--loading">
              <SkeletonLoader
                variant="search-modal-results-meta"
                className="search-modal-results-item-meta-skeleton"
              />
            </span>
          </>
        ) : (
          <>
            {title ? (
              <h3 className="search-modal-results-item-title">{title}</h3>
            ) : null}
            {metaText ? (
              <p className="search-modal-results-item-meta">{metaText}</p>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchModalResultsMovieItem;
