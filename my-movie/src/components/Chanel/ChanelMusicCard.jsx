import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWishlist } from '../../context/WishlistContext';
import { useMusicApi } from '../../context/MusicApiContext';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import { useImageReady } from '../../utils/useImageReady';
import { formatArtistNames } from '../../pageMusic/useArtistCycle';
import './ChanelMusicCard.css';

const ChanelMusicCard = ({ item, layout = 'row' }) => {
  const navigate = useNavigate();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { getArtistById } = useMusicApi();
  const imgSrc = item?.img || '';
  const { showSkeleton, imgRef, onLoad, onError, failed } = useImageReady(imgSrc);
  const saved = isInWishlist(item?.id, 'music');
  const title = typeof item?.title === 'string' ? item.title : '';
  const artist = formatArtistNames(item?.artistId, getArtistById);

  const open = () => {
    if (showSkeleton || item?.id == null) return;
    navigate(`/music/${item.id}`);
  };

  return (
    <article
      className={`chanel-music-card chanel-music-card--${layout}${
        showSkeleton ? ' chanel-music-card--loading' : ''
      }`}
      onClick={open}
      aria-busy={showSkeleton || undefined}
    >
      <div className="chanel-music-card-image-wrap">
        {showSkeleton ? (
          <SkeletonLoader variant="music-cards-image" className="chanel-music-card-image-skeleton" />
        ) : null}
        {!failed && imgSrc ? (
          <img
            ref={imgRef}
            src={imgSrc}
            alt={title}
            className={`chanel-music-card-image${showSkeleton ? ' chanel-music-card-image--loading' : ''}`}
            onLoad={onLoad}
            onError={onError}
          />
        ) : null}
        {showSkeleton ? (
          <>
            <span className="chanel-music-card-wish chanel-music-card-wish--skeleton" aria-hidden="true" />
            <span className="chanel-music-card-play chanel-music-card-play--skeleton" aria-hidden="true" />
          </>
        ) : (
          <>
            <button
              type="button"
              className={`chanel-music-card-wish${saved ? ' is-active' : ''}`}
              aria-label="Sevimlilarga qo'shish"
              onClick={(event) => {
                event.stopPropagation();
                toggleWishlist(item.id, 'music');
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
            <span className="chanel-music-card-play" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21" />
              </svg>
            </span>
            <div className="chanel-music-card-info">
              <h3 className="chanel-music-card-title">{title}</h3>
              {artist ? <p className="chanel-music-card-artist">{artist}</p> : null}
            </div>
          </>
        )}
      </div>
    </article>
  );
};

export default ChanelMusicCard;
