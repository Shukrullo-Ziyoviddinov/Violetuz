import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useWishlist } from '../../context/WishlistContext';
import HorizontalScroll from '../../components/HorizontalScroll/HorizontalScroll';
import { useRecommendedClips } from '../../services/recommendedClipsService';
import { useMusicApi } from '../../context/MusicApiContext';
import SkeletonLoader from '../../components/SkeletonLoader/SkeletonLoader';
import { useImageReady } from '../../utils/useImageReady';
import './RecommendedClips.css';

const DEFAULT_SKELETON_COUNT = 8;

const RecommendedClipSkeletonCard = ({ id }) => (
  <div
    className="recommended-clips-item recommended-clips-item--skeleton"
    aria-hidden="true"
  >
    <div className="recommended-clips-item-image-wrapper">
      <SkeletonLoader
        variant="recommended-clips-image"
        className="recommended-clips-item-image-skeleton"
      />
      <span
        className="recommended-clips-item-wishlist-btn recommended-clips-item-wishlist-btn--skeleton"
        aria-hidden="true"
      />
      <span
        className="recommended-clips-item-play recommended-clips-item-play--skeleton"
        aria-hidden="true"
      />
      <div className="recommended-clips-item-info">
        <SkeletonLoader variant="recommended-clips-item-title" />
        <SkeletonLoader variant="recommended-clips-item-artist" />
      </div>
    </div>
  </div>
);

/** Cover + overlay skeletons until image is ready */
const RecommendedClipItem = ({
  item,
  getTitleText,
  getArtistText,
  onOpen,
  isInWishlist,
  onWishlistClick,
  blockClick,
}) => {
  const imgSrc = item.img || '';
  const { showSkeleton: showImgSkeleton, imgRef, onLoad, onError } = useImageReady(imgSrc);

  return (
    <div
      className={`recommended-clips-item${
        showImgSkeleton ? ' recommended-clips-item--loading' : ''
      }`}
      onClick={() => !blockClick && !showImgSkeleton && onOpen?.(item.id)}
      aria-busy={showImgSkeleton || undefined}
    >
      <div className="recommended-clips-item-image-wrapper">
        {showImgSkeleton && (
          <SkeletonLoader
            variant="recommended-clips-image"
            className="recommended-clips-item-image-skeleton"
          />
        )}
        {imgSrc && (
          <img
            ref={imgRef}
            src={imgSrc}
            alt={getTitleText(item)}
            className={`recommended-clips-item-image${
              showImgSkeleton ? ' recommended-clips-item-image--loading' : ''
            }`}
            onLoad={onLoad}
            onError={onError}
          />
        )}

        {showImgSkeleton ? (
          <>
            <span
              className="recommended-clips-item-wishlist-btn recommended-clips-item-wishlist-btn--skeleton"
              aria-hidden="true"
            />
            <span
              className="recommended-clips-item-play recommended-clips-item-play--skeleton"
              aria-hidden="true"
            />
            <div className="recommended-clips-item-info" aria-hidden="true">
              <SkeletonLoader variant="recommended-clips-item-title" />
              <SkeletonLoader variant="recommended-clips-item-artist" />
            </div>
          </>
        ) : (
          <>
            <button
              className={`recommended-clips-item-wishlist-btn ${
                isInWishlist(item.id, 'klip') ? 'active' : ''
              }`}
              onClick={(e) => onWishlistClick(e, item.id)}
              aria-label="Sevimlilarga qo'shish"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill={isInWishlist(item.id, 'klip') ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
            <div className="recommended-clips-item-play">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21" />
              </svg>
            </div>
            <div className="recommended-clips-item-info">
              <h3 className="recommended-clips-item-title">{getTitleText(item)}</h3>
              <p className="recommended-clips-item-artist">{getArtistText(item.artistId)}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/**
 * Tavsiya etilgan kliplar / O'xshash kliplar bo'limi.
 * music: type 'music'. album: type 'musicAlbom'. klip: type 'klip' yoki 'konsert' (VideoPage).
 *
 * forceSkeleton — parent hali music topmagan (refresh); image-wrapper skeletonlar darhol turadi.
 */
const RecommendedClips = ({
  music,
  album,
  klip,
  titleKey = 'music.recommendedClips',
  forceSkeleton = false,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { contentLang } = useContentLanguage();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { getArtistById, clipsLoading } = useMusicApi();

  const item = music || album || klip;
  const { items: recommendedClips, isLoading } = useRecommendedClips(
    item,
    klip ? { excludeId: klip.id } : {}
  );

  const getTitleText = (it) => {
    if (!it?.title) return '';
    if (typeof it.title === 'object') {
      return it.title[contentLang] || it.title.uz || it.title.ru || it.title.en || '';
    }
    return String(it.title);
  };

  const getArtistText = (artistId) => {
    const artist = getArtistById(artistId);
    return artist?.name || artistId || '';
  };

  const handleCardClick = (clipId) => {
    navigate(`/music/video/${clipId}`, { replace: false });
  };

  const handleWishlistClick = (e, clipId) => {
    e.stopPropagation();
    toggleWishlist(clipId, 'klip');
  };

  const skeletonItems = useMemo(
    () =>
      Array.from({ length: DEFAULT_SKELETON_COUNT }, (_, index) => ({
        id: `recommended-clips-skeleton-${index}`,
        _skeleton: true,
      })),
    []
  );

  const awaitingCatalog =
    Boolean(forceSkeleton) || (Boolean(clipsLoading) && !item);
  const showSectionSkeleton =
    awaitingCatalog || (Boolean(isLoading) && recommendedClips.length === 0);
  const itemsToRender = showSectionSkeleton ? skeletonItems : recommendedClips;
  const showTitleSkeleton = showSectionSkeleton;

  if (music && music.type !== 'music') return null;
  if (album && album.type !== 'musicAlbom') return null;
  if (klip && klip.type !== 'klip' && klip.type !== 'konsert') return null;
  if (!item && !showSectionSkeleton) return null;
  if (!showSectionSkeleton && !recommendedClips.length) return null;

  const renderCard = (clipItem) => {
    if (clipItem._skeleton) {
      return <RecommendedClipSkeletonCard key={clipItem.id} id={clipItem.id} />;
    }

    return (
      <RecommendedClipItem
        key={clipItem.id}
        item={clipItem}
        getTitleText={getTitleText}
        getArtistText={getArtistText}
        onOpen={handleCardClick}
        isInWishlist={isInWishlist}
        onWishlistClick={handleWishlistClick}
        blockClick={Boolean(isLoading) || showSectionSkeleton}
      />
    );
  };

  return (
    <div
      className="recommended-clips"
      aria-busy={showSectionSkeleton || isLoading || undefined}
    >
      <div className="recommended-clips-container">
        {showTitleSkeleton ? (
          <SkeletonLoader
            variant="recommended-clips-title"
            className="recommended-clips-title-skeleton"
          />
        ) : (
          <h2 className="recommended-clips-title">
            {t(titleKey, 'Tavsiya etilgan kliplar')}
          </h2>
        )}
        <div className="recommended-clips-content">
          <HorizontalScroll>
            {itemsToRender.map((clipItem) => renderCard(clipItem))}
          </HorizontalScroll>
        </div>
      </div>
    </div>
  );
};

export default RecommendedClips;
