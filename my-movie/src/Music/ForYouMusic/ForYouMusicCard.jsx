import React from 'react';
import { useWishlist } from '../../context/WishlistContext';
import SkeletonLoader from '../../components/SkeletonLoader/SkeletonLoader';
import { useImageReady } from '../../utils/useImageReady';
import '../MusicCards/MusicCards.css';

const titleOf = (item, contentLang) => {
  if (!item?.title) return '';
  if (typeof item.title === 'object') {
    return item.title[contentLang] || item.title.uz || item.title.ru || item.title.en || '';
  }
  return String(item.title);
};

export const ForYouMusicCard = ({
  item,
  contentLang,
  artistText,
  onOpen,
  blockClick,
}) => {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const imgSrc = item.img || '';
  const title = titleOf(item, contentLang);
  const saved = isInWishlist(item.id, 'music');
  const { showSkeleton, imgRef, onLoad, onError, failed } = useImageReady(imgSrc);

  return (
    <div
      className={`music-cards-item${showSkeleton ? ' music-cards-item--loading' : ''}`}
      onClick={() => !blockClick && !showSkeleton && onOpen?.(item.id)}
      aria-busy={showSkeleton || undefined}
    >
      <div className="music-cards-item-image-wrapper">
        {showSkeleton && (
          <SkeletonLoader
            variant="music-cards-image"
            className="music-cards-item-image-skeleton"
          />
        )}
        {!failed && imgSrc && (
          <img
            ref={imgRef}
            src={imgSrc}
            alt={title}
            className={`music-cards-item-image${showSkeleton ? ' music-cards-item-image--loading' : ''}`}
            onLoad={onLoad}
            onError={onError}
          />
        )}
        {showSkeleton ? (
          <>
            <span
              className="music-cards-item-wishlist-btn music-cards-item-wishlist-btn--skeleton"
              aria-hidden="true"
            />
            <span className="music-cards-item-play music-cards-item-play--skeleton" aria-hidden="true" />
            <div className="music-cards-item-info" aria-hidden="true">
              <SkeletonLoader variant="music-cards-item-title" />
              <SkeletonLoader variant="music-cards-item-artist" />
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              className={`music-cards-item-wishlist-btn${saved ? ' active' : ''}`}
              onClick={(event) => {
                event.stopPropagation();
                toggleWishlist(item.id, 'music');
              }}
              aria-label="Sevimlilarga qo'shish"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill={saved ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
            <div className="music-cards-item-play">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21" />
              </svg>
            </div>
            <div className="music-cards-item-info">
              <h3 className="music-cards-item-title">{title}</h3>
              <p className="music-cards-item-artist">{artistText}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export const ForYouMusicCardSkeleton = () => (
  <div className="music-cards-item music-cards-item--skeleton" aria-hidden="true">
    <div className="music-cards-item-image-wrapper">
      <SkeletonLoader
        variant="music-cards-image"
        className="music-cards-item-image-skeleton"
      />
      <span className="music-cards-item-wishlist-btn music-cards-item-wishlist-btn--skeleton" />
      <span className="music-cards-item-play music-cards-item-play--skeleton" />
      <div className="music-cards-item-info">
        <SkeletonLoader variant="music-cards-item-title" />
        <SkeletonLoader variant="music-cards-item-artist" />
      </div>
    </div>
  </div>
);
