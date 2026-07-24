import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useWishlist } from '../../context/WishlistContext';
import HorizontalScroll from '../../components/HorizontalScroll/HorizontalScroll';
import CartochkaHoverModal from '../../components/cartochkaHoverModal';
import CartochkaMobileAutoPlay from '../../components/cartochkaHoverModal/CartochkaMobileAutoPlay';
import MusicSectionIcons from '../MusicSectionIcons';
import SkeletonLoader from '../../components/SkeletonLoader/SkeletonLoader';
import { useImageReady } from '../../utils/useImageReady';
import { useMusicApi } from '../../context/MusicApiContext';
import '../MusicCards/MusicCards.css';
import '../MusicButtonMore/MusicButtonMore.css';
import './ClipsCards.css';

const DEFAULT_SKELETON_COUNT = 10;

const ClipsCardItem = ({
  item,
  wishlistType,
  getArtistName,
  onOpen,
  isInWishlist,
  onWishlistClick,
  blockClick,
}) => {
  const imgSrc = item.img || '';
  const { showSkeleton: showImgSkeleton, imgRef, onLoad, onError, failed: imgFailed } =
    useImageReady(imgSrc);

  return (
    <div
      className={`music-cards-item clips-item${
        showImgSkeleton ? ' music-cards-item--loading' : ''
      }`}
      onClick={() => !blockClick && !showImgSkeleton && onOpen?.(item.id)}
      aria-busy={showImgSkeleton || undefined}
    >
      <div className="music-cards-item-image-wrapper clips-image-wrapper">
        {showImgSkeleton && (
          <SkeletonLoader
            variant="music-cards-image"
            className="music-cards-item-image-skeleton"
          />
        )}
        {!imgFailed && imgSrc && (
          <img
            ref={imgRef}
            src={imgSrc}
            alt={item.title}
            className={`music-cards-item-image${
              showImgSkeleton ? ' music-cards-item-image--loading' : ''
            }`}
            onLoad={onLoad}
            onError={onError}
          />
        )}

        {showImgSkeleton ? (
          <>
            <span
              className="music-cards-item-wishlist-btn music-cards-item-wishlist-btn--skeleton"
              aria-hidden="true"
            />
            <span
              className="music-cards-item-play music-cards-item-play--skeleton"
              aria-hidden="true"
            />
            <div className="music-cards-item-info" aria-hidden="true">
              <SkeletonLoader variant="music-cards-item-title" />
              <SkeletonLoader variant="music-cards-item-artist" />
            </div>
          </>
        ) : (
          <>
            <button
              className={`music-cards-item-wishlist-btn ${
                isInWishlist(item.id, wishlistType) ? 'active' : ''
              }`}
              onClick={(e) => onWishlistClick(e, item.id)}
              aria-label="Sevimlilarga qo'shish"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill={isInWishlist(item.id, wishlistType) ? 'currentColor' : 'none'}
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
              <h3 className="music-cards-item-title">{item.title}</h3>
              <p className="music-cards-item-artist">{getArtistName(item.artistId)}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/**
 * Umumiy videoli klip kartochkalar komponenti.
 * Har qanday klip bo'limi uchun ishlatiladi (Trend, Popular, va hokazo).
 */
const ClipsCards = ({ section, isLoading: isLoadingProp = null }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const {
    id,
    data,
    titleKey,
    titleDefault,
    moreTo,
    wishlistType,
    initialCount,
  } = section;

  const {
    getArtistById,
    clipsLoading,
    concertsLoading,
    clipSectionsLoading,
    concertSectionsLoading,
    pageContentLoading,
  } = useMusicApi();

  const dataLoading = wishlistType === 'konsert' ? concertsLoading : clipsLoading;
  const isLoading =
    isLoadingProp ??
    (dataLoading || clipSectionsLoading || concertSectionsLoading || pageContentLoading);

  const getArtistName = (artistId) => {
    const artist = getArtistById(artistId);
    return artist?.name || artistId;
  };

  const handleCardClick = (itemId) => {
    navigate(`/music/video/${itemId}`);
  };

  const handleWishlistClick = (e, itemId) => {
    e.stopPropagation();
    toggleWishlist(itemId, wishlistType);
  };

  const safeData = Array.isArray(data) ? data : [];
  const displayItems = safeData.slice(0, initialCount);

  const skeletonCount =
    Number(initialCount) > 0 ? Number(initialCount) : DEFAULT_SKELETON_COUNT;
  const skeletonItems = useMemo(
    () =>
      Array.from({ length: skeletonCount }, (_, index) => ({
        id: `clips-card-skeleton-${id || 'section'}-${index}`,
        _skeleton: true,
      })),
    [skeletonCount, id]
  );

  const showSectionSkeleton = Boolean(isLoading) && displayItems.length === 0;
  const itemsToRender = showSectionSkeleton ? skeletonItems : displayItems;
  const showTitleSkeleton = showSectionSkeleton;

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const renderSkeletonCard = (item) => (
    <div
      key={item.id}
      className="music-cards-item clips-item music-cards-item--skeleton"
      aria-hidden="true"
    >
      <div className="music-cards-item-image-wrapper clips-image-wrapper">
        <SkeletonLoader
          variant="music-cards-image"
          className="music-cards-item-image-skeleton"
        />
        <span
          className="music-cards-item-wishlist-btn music-cards-item-wishlist-btn--skeleton"
          aria-hidden="true"
        />
        <span
          className="music-cards-item-play music-cards-item-play--skeleton"
          aria-hidden="true"
        />
        <div className="music-cards-item-info">
          <SkeletonLoader variant="music-cards-item-title" />
          <SkeletonLoader variant="music-cards-item-artist" />
        </div>
      </div>
    </div>
  );

  const renderCard = (item) => (
    <ClipsCardItem
      item={item}
      wishlistType={wishlistType}
      getArtistName={getArtistName}
      onOpen={handleCardClick}
      isInWishlist={isInWishlist}
      onWishlistClick={handleWishlistClick}
      blockClick={Boolean(isLoading)}
    />
  );

  return (
    <div
      className={`music-cards clips-cards clips-cards--${id}`}
      aria-busy={isLoading || showSectionSkeleton || undefined}
    >
      <div className="music-cards-container">
        <div className="music-cards-header">
          {showTitleSkeleton ? (
            <SkeletonLoader
              variant="music-cards-title"
              className="music-cards-title-skeleton"
            />
          ) : (
            <h2 className="music-cards-title">
              <span className="music-cards-title-icon" aria-hidden="true">
                <MusicSectionIcons type={wishlistType || 'klip'} />
              </span>
              <span className="music-cards-title-text">
                {t(titleKey, titleDefault)}
              </span>
            </h2>
          )}
        </div>
        <div className="music-cards-content">
          <HorizontalScroll>
            {itemsToRender.map((item) => {
              if (item._skeleton) return renderSkeletonCard(item);

              return isMobile ? (
                <CartochkaMobileAutoPlay
                  key={item.id}
                  item={item}
                  onCardClick={handleCardClick}
                >
                  {renderCard(item)}
                </CartochkaMobileAutoPlay>
              ) : (
                <CartochkaHoverModal
                  key={item.id}
                  item={item}
                  getArtistText={(i) => getArtistName(i.artistId)}
                >
                  {renderCard(item)}
                </CartochkaHoverModal>
              );
            })}
            {moreTo && !showSectionSkeleton && (
              <div
                className="music-button-more music-cards-item"
                onClick={() => navigate(moreTo)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(moreTo)}
                aria-label="Ko'proq ko'rish"
                data-allow-navigate
              >
                <div className="music-button-more-wrapper music-cards-item-image-wrapper">
                  <span className="music-button-more-icon">
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </span>
                </div>
              </div>
            )}
          </HorizontalScroll>
        </div>
      </div>
    </div>
  );
};

export default ClipsCards;
