import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useWishlist } from '../../context/WishlistContext';
import { useMusicApi } from '../../context/MusicApiContext';
import HorizontalScroll from '../../components/HorizontalScroll/HorizontalScroll';
import MusicButtonMore from '../MusicButtonMore/MusicButtonMore';
import MusicSectionIcons from '../MusicSectionIcons';
import CartochkaHoverModal from '../../components/cartochkaHoverModal';
import SkeletonLoader from '../../components/SkeletonLoader/SkeletonLoader';
import { useImageReady } from '../../utils/useImageReady';
import './MusicCards.css';

const DEFAULT_SKELETON_COUNT = 10;

/** Image + overlay skeletons until cover loads (cache-safe) */
const MusicCardItem = ({
  item,
  wishlistType,
  getTitle,
  getArtistText,
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
      className={`music-cards-item${showImgSkeleton ? ' music-cards-item--loading' : ''}`}
      onClick={() => !blockClick && !showImgSkeleton && onOpen?.(item.id)}
      aria-busy={showImgSkeleton || undefined}
    >
      <div className="music-cards-item-image-wrapper">
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
            alt={getTitle(item)}
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
              <h3 className="music-cards-item-title">{getTitle(item)}</h3>
              <p className="music-cards-item-artist">{getArtistText(item)}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/**
 * Umumiy musiqa bo'limlari kartochkasi.
 * Har qanday musiqa bo'limi uchun ishlatiladi (Trend, Discover, Music Library va hokazo).
 * Section config orqali data, title, moreTo boshqariladi.
 */
const MusicCards = ({ section, isLoading: isLoadingProp = null }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { contentLang } = useContentLanguage();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const {
    getSectionItems,
    getArtistById,
    musicLoading,
    albumsLoading,
    sectionsLoading,
    pageContentLoading,
  } = useMusicApi();

  const {
    id,
    titleKey,
    titleDefault,
    moreTo,
    wishlistType = 'music',
    initialCount,
    detailPathType,
  } = section;

  const dataLoading = wishlistType === 'album' ? albumsLoading : musicLoading;
  const isLoading =
    isLoadingProp ?? (dataLoading || sectionsLoading || pageContentLoading);

  const getDetailPath = (itemId) =>
    detailPathType === 'album' ? `/music/album/${itemId}` : `/music/${itemId}`;

  const resolvedData = useMemo(
    () => getSectionItems(section),
    [getSectionItems, section]
  );

  const getTitle = (item) => {
    if (!item?.title) return '';
    if (typeof item.title === 'object') {
      return item.title[contentLang] || item.title.uz || item.title.ru || item.title.en || '';
    }
    return String(item.title);
  };

  const getArtistName = (artistId) => {
    const artist = getArtistById(artistId);
    return artist?.name || artistId;
  };

  const handleCardClick = (itemId) => {
    const path = getDetailPath(itemId);
    navigate(`${path}?section=${encodeURIComponent(section.id)}`, { replace: false });
  };

  const getArtistText = (item) => {
    if (wishlistType === 'album' && item.artist) return item.artist;
    return getArtistName(item.artistId) || item.artist || '';
  };

  const handleWishlistClick = (e, itemId) => {
    e.stopPropagation();
    toggleWishlist(itemId, wishlistType);
  };

  const safeData = Array.isArray(resolvedData) ? resolvedData : [];
  const displayItems = safeData.slice(0, initialCount);

  const skeletonCount =
    Number(initialCount) > 0 ? Number(initialCount) : DEFAULT_SKELETON_COUNT;
  const skeletonItems = useMemo(
    () =>
      Array.from({ length: skeletonCount }, (_, index) => ({
        id: `music-card-skeleton-${id || 'section'}-${index}`,
        _skeleton: true,
      })),
    [skeletonCount, id]
  );

  const showSectionSkeleton = Boolean(isLoading) && displayItems.length === 0;
  const itemsToRender = showSectionSkeleton ? skeletonItems : displayItems;
  const showTitleSkeleton = showSectionSkeleton;

  const renderCard = (item) => {
    if (item._skeleton) {
      return (
        <div
          key={item.id}
          className="music-cards-item music-cards-item--skeleton"
          aria-hidden="true"
        >
          <div className="music-cards-item-image-wrapper">
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
    }

    return (
      <CartochkaHoverModal
        key={item.id}
        item={item}
        getArtistText={getArtistText}
        getTitle={getTitle}
      >
        <MusicCardItem
          item={item}
          wishlistType={wishlistType}
          getTitle={getTitle}
          getArtistText={getArtistText}
          onOpen={handleCardClick}
          isInWishlist={isInWishlist}
          onWishlistClick={handleWishlistClick}
          blockClick={Boolean(isLoading)}
        />
      </CartochkaHoverModal>
    );
  };

  return (
    <div
      className={`music-cards music-cards--${id}`}
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
                <MusicSectionIcons type={wishlistType} />
              </span>
              <span className="music-cards-title-text">
                {t(titleKey, titleDefault)}
              </span>
            </h2>
          )}
        </div>
        <div className="music-cards-content">
          <HorizontalScroll>
            {itemsToRender.map((item) => renderCard(item))}
            {moreTo && safeData.length > 0 && !showSectionSkeleton && (
              <MusicButtonMore to={moreTo} />
            )}
          </HorizontalScroll>
        </div>
      </div>
    </div>
  );
};

export default MusicCards;
