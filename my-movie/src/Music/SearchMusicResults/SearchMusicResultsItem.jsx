import React from 'react';
import SkeletonLoader from '../../components/SkeletonLoader/SkeletonLoader';
import { useImageReady } from '../../utils/useImageReady';

/**
 * Qidiruv musiqa kartochkasi — rasm yuklanmaguncha shu blok ichida skeleton.
 * variant: grid (musiqa/albom), video (klip/konsert), artist
 */
const SearchMusicResultsItem = ({
  variant = 'grid',
  imgSrc,
  title,
  artist,
  onClick,
}) => {
  const src = imgSrc || '';
  const { showSkeleton, imgRef, onLoad, onError, failed } = useImageReady(src);
  const showArtist = variant !== 'artist';

  const itemClass = [
    'search-music-results-item',
    variant === 'video' && 'search-music-results-item--video',
    variant === 'artist' && 'search-music-results-item--artist',
    showSkeleton && 'search-music-results-item--loading',
  ]
    .filter(Boolean)
    .join(' ');

  const infoContent = showSkeleton ? (
    <>
      <span className="search-music-results-item-title search-music-results-item-title--loading">
        <SkeletonLoader
          variant="search-music-results-title"
          className="search-music-results-item-title-skeleton"
        />
      </span>
      {showArtist && (
        <span className="search-music-results-item-artist search-music-results-item-artist--loading">
          <SkeletonLoader
            variant="search-music-results-artist"
            className="search-music-results-item-artist-skeleton"
          />
        </span>
      )}
    </>
  ) : (
    <>
      {title ? <span className="search-music-results-item-title">{title}</span> : null}
      {showArtist && artist ? (
        <span className="search-music-results-item-artist">{artist}</span>
      ) : null}
    </>
  );

  return (
    <div
      className={itemClass}
      onClick={() => !showSkeleton && onClick?.()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (showSkeleton) return;
        if (e.key === 'Enter') onClick?.();
      }}
      aria-busy={showSkeleton || undefined}
    >
      <div className="search-music-results-item-image-wrapper">
        {showSkeleton && (
          <SkeletonLoader
            variant="search-music-results-image"
            className="search-music-results-item-image-skeleton"
          />
        )}
        {!failed && src && (
          <img
            ref={imgRef}
            src={src}
            alt={title || ''}
            className={`search-music-results-item-image${
              showSkeleton ? ' search-music-results-item-image--loading' : ''
            }`}
            onLoad={onLoad}
            onError={onError}
          />
        )}
        {(variant === 'grid' || variant === 'video') && (
          <div className="search-music-results-item-info" aria-hidden={showSkeleton || undefined}>
            {infoContent}
          </div>
        )}
      </div>
      {variant === 'artist' && (
        <div className="search-music-results-item-info" aria-hidden={showSkeleton || undefined}>
          {infoContent}
        </div>
      )}
    </div>
  );
};

export default SearchMusicResultsItem;
