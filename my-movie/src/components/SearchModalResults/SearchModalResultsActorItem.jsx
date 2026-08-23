import React from 'react';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import { useImageReady } from '../../utils/useImageReady';

/** Qidiruv aktyor kartochkasi — avatar + ism skeleton */
const SearchModalResultsActorItem = ({ imgSrc, name, onClick }) => {
  const src = imgSrc || '';
  const { showSkeleton, imgRef, onLoad, onError, failed } = useImageReady(src);

  return (
    <div
      className={`search-modal-results-actor-card${
        showSkeleton ? ' search-modal-results-actor-card--loading' : ''
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
      <div className="search-modal-results-actor-avatar-wrap">
        {showSkeleton && (
          <SkeletonLoader
            variant="search-modal-results-actor-avatar"
            className="search-modal-results-actor-avatar-skeleton"
          />
        )}
        {!failed && src && (
          <img
            ref={imgRef}
            src={src}
            alt={name || ''}
            className={`search-modal-results-actor-avatar${
              showSkeleton ? ' search-modal-results-actor-avatar--loading' : ''
            }`}
            onLoad={onLoad}
            onError={onError}
          />
        )}
      </div>

      {showSkeleton ? (
        <p className="search-modal-results-actor-name search-modal-results-actor-name--loading">
          <SkeletonLoader
            variant="search-modal-results-actor-name"
            className="search-modal-results-actor-name-skeleton"
          />
        </p>
      ) : name ? (
        <p className="search-modal-results-actor-name">{name}</p>
      ) : null}
    </div>
  );
};

export default SearchModalResultsActorItem;
