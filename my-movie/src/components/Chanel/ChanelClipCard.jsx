import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWishlist } from '../../context/WishlistContext';
import { useMusicApi } from '../../context/MusicApiContext';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import { useImageReady } from '../../utils/useImageReady';
import { formatArtistNames } from '../../pageMusic/useArtistCycle';
import './ChanelClipCard.css';

const ChanelClipCard = ({ item, layout = 'row' }) => {
  const navigate = useNavigate();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { getArtistById } = useMusicApi();
  const imgSrc = item?.img || '';
  const { showSkeleton, imgRef, onLoad, onError, failed } = useImageReady(imgSrc);
  const saved = isInWishlist(item?.id, 'klip');
  const title = typeof item?.title === 'string' ? item.title : '';
  const artist = formatArtistNames(item?.artistId, getArtistById);

  const open = () => {
    if (showSkeleton || item?.id == null) return;
    navigate(`/music/video/${item.id}`);
  };

  return (
    <article
      className={`chanel-clip-card chanel-clip-card--${layout}${
        showSkeleton ? ' chanel-clip-card--loading' : ''
      }`}
      onClick={open}
      aria-busy={showSkeleton || undefined}
    >
      <div className="chanel-clip-card-image-wrap">
        {showSkeleton ? (
          <SkeletonLoader variant="music-cards-image" className="chanel-clip-card-image-skeleton" />
        ) : null}
        {!failed && imgSrc ? (
          <img
            ref={imgRef}
            src={imgSrc}
            alt={title}
            className={`chanel-clip-card-image${showSkeleton ? ' chanel-clip-card-image--loading' : ''}`}
            onLoad={onLoad}
            onError={onError}
          />
        ) : null}
        {showSkeleton ? (
          <>
            <span className="chanel-clip-card-wish chanel-clip-card-wish--skeleton" aria-hidden="true" />
            <span className="chanel-clip-card-play chanel-clip-card-play--skeleton" aria-hidden="true" />
          </>
        ) : (
          <>
            <button
              type="button"
              className={`chanel-clip-card-wish${saved ? ' is-active' : ''}`}
              aria-label="Sevimlilarga qo'shish"
              onClick={(event) => {
                event.stopPropagation();
                toggleWishlist(item.id, 'klip');
              }}
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
            <span className="chanel-clip-card-play" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21" />
              </svg>
            </span>
          </>
        )}
      </div>
      {showSkeleton ? null : (
        <div className="chanel-clip-card-info">
          <h3 className="chanel-clip-card-title">{title}</h3>
          {artist ? <p className="chanel-clip-card-artist">{artist}</p> : null}
        </div>
      )}
    </article>
  );
};

export default ChanelClipCard;
