import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWishlist } from '../../context/WishlistContext';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import ViewCount from '../ViewCount/ViewCount';
import UploadedAtTime from '../UploadedAtTime/UploadedAtTime';
import { useImageReady } from '../../utils/useImageReady';
import './ChanelClipCard.css';

const localized = (value, lang) => {
  if (value && typeof value === 'object') return value[lang] || value.uz || value.ru || '';
  return typeof value === 'string' ? value : '';
};

const ChanelPardaCard = ({ item, layout = 'row' }) => {
  const navigate = useNavigate();
  const { contentLang } = useContentLanguage();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const title = localized(item?.title, contentLang);
  const imgSrc = localized(item?.videoImg, contentLang);
  const { showSkeleton, imgRef, onLoad, onError, failed } = useImageReady(imgSrc);
  const saved = isInWishlist(item?.id, 'triller');

  const open = () => {
    if (showSkeleton || item?.id == null) return;
    navigate(`/triller/${item.id}`);
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
                toggleWishlist(item.id, 'triller');
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
          {item?.id != null ? (
            <div className="triller-card-meta-row">
              <ViewCount
                itemId={item.id}
                type="triller"
                variant="text"
                record={false}
                className="view-count-text triller-card-view-count"
              />
              <UploadedAtTime
                at={item.createdAt || item.uploadedAt}
                className="triller-card-uploaded-at"
              />
            </div>
          ) : null}
        </div>
      )}
    </article>
  );
};

export default ChanelPardaCard;
