import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useWishlist } from '../../context/WishlistContext';
import HorizontalScroll from '../../components/HorizontalScroll/HorizontalScroll';
import { useRecommendedAlbums } from '../../services/recommendedAlbumsService';
import { useMusicApi } from '../../context/MusicApiContext';
import SkeletonLoader from '../../components/SkeletonLoader/SkeletonLoader';
import { useImageReady } from '../../utils/useImageReady';
import './AlbumsForYou.css';

const DEFAULT_SKELETON_COUNT = 8;

const AlbumsForYouSkeletonCard = ({ id }) => (
  <div
    className="albums-for-you-item albums-for-you-item--skeleton"
    aria-hidden="true"
  >
    <div className="albums-for-you-item-image-wrapper">
      <SkeletonLoader
        variant="albums-for-you-image"
        className="albums-for-you-item-image-skeleton"
      />
      <span
        className="albums-for-you-item-wishlist-btn albums-for-you-item-wishlist-btn--skeleton"
        aria-hidden="true"
      />
      <span
        className="albums-for-you-item-play albums-for-you-item-play--skeleton"
        aria-hidden="true"
      />
      <div className="albums-for-you-item-info">
        <SkeletonLoader variant="albums-for-you-item-title" />
        <SkeletonLoader variant="albums-for-you-item-artist" />
      </div>
    </div>
  </div>
);

/** Cover + overlay skeletons until image is ready */
const AlbumsForYouItem = ({
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
      className={`albums-for-you-item${showImgSkeleton ? ' albums-for-you-item--loading' : ''}`}
      onClick={() => !blockClick && !showImgSkeleton && onOpen?.(item.id, item.sectionId)}
      aria-busy={showImgSkeleton || undefined}
    >
      <div className="albums-for-you-item-image-wrapper">
        {showImgSkeleton && (
          <SkeletonLoader
            variant="albums-for-you-image"
            className="albums-for-you-item-image-skeleton"
          />
        )}
        {imgSrc && (
          <img
            ref={imgRef}
            src={imgSrc}
            alt={getTitleText(item)}
            className={`albums-for-you-item-image${
              showImgSkeleton ? ' albums-for-you-item-image--loading' : ''
            }`}
            onLoad={onLoad}
            onError={onError}
          />
        )}

        {showImgSkeleton ? (
          <>
            <span
              className="albums-for-you-item-wishlist-btn albums-for-you-item-wishlist-btn--skeleton"
              aria-hidden="true"
            />
            <span
              className="albums-for-you-item-play albums-for-you-item-play--skeleton"
              aria-hidden="true"
            />
            <div className="albums-for-you-item-info" aria-hidden="true">
              <SkeletonLoader variant="albums-for-you-item-title" />
              <SkeletonLoader variant="albums-for-you-item-artist" />
            </div>
          </>
        ) : (
          <>
            <button
              className={`albums-for-you-item-wishlist-btn ${
                isInWishlist(item.id, 'album') ? 'active' : ''
              }`}
              onClick={(e) => onWishlistClick(e, item.id)}
              aria-label="Sevimlilarga qo'shish"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill={isInWishlist(item.id, 'album') ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
            <div className="albums-for-you-item-play">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21" />
              </svg>
            </div>
            <div className="albums-for-you-item-info">
              <h3 className="albums-for-you-item-title">{getTitleText(item)}</h3>
              <p className="albums-for-you-item-artist">{getArtistText(item)}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/**
 * Siz uchun albomlar / O'xshash albomlar bo'limi.
 * music: type 'music'. album: type 'musicAlbom'. klip: type 'klip' yoki 'konsert' (VideoPage).
 *
 * forceSkeleton — parent hali music topmagan (refresh); image-wrapper skeletonlar darhol turadi.
 */
const AlbumsForYou = ({
  music,
  album,
  klip,
  titleKey = 'music.albumsForYou',
  forceSkeleton = false,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { contentLang } = useContentLanguage();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { getArtistById, albumsLoading } = useMusicApi();

  const item = music || album || klip;
  const { items: recommendedAlbums, isLoading } = useRecommendedAlbums(
    item,
    album ? { excludeId: album.id } : {}
  );

  const getTitleText = (albumItem) => {
    if (!albumItem?.title) return '';
    if (typeof albumItem.title === 'object') {
      return (
        albumItem.title[contentLang] ||
        albumItem.title.uz ||
        albumItem.title.ru ||
        albumItem.title.en ||
        ''
      );
    }
    return String(albumItem.title);
  };

  const getArtistText = (albumItem) => {
    if (albumItem?.artist) return albumItem.artist;
    const artist = getArtistById(albumItem?.artistId);
    return artist?.name || albumItem?.artistId || '';
  };

  const handleCardClick = (albumId, sectionId) => {
    const path = `/music/album/${albumId}${sectionId ? `?section=${encodeURIComponent(sectionId)}` : ''}`;
    navigate(path, { replace: false });
  };

  const handleWishlistClick = (e, albumId) => {
    e.stopPropagation();
    toggleWishlist(albumId, 'album');
  };

  const skeletonItems = useMemo(
    () =>
      Array.from({ length: DEFAULT_SKELETON_COUNT }, (_, index) => ({
        id: `albums-for-you-skeleton-${index}`,
        _skeleton: true,
      })),
    []
  );

  const awaitingCatalog =
    Boolean(forceSkeleton) || (Boolean(albumsLoading) && !item);
  const showSectionSkeleton =
    awaitingCatalog || (Boolean(isLoading) && recommendedAlbums.length === 0);
  const itemsToRender = showSectionSkeleton ? skeletonItems : recommendedAlbums;
  const showTitleSkeleton = showSectionSkeleton;

  if (music && music.type !== 'music') return null;
  if (album && album.type !== 'musicAlbom') return null;
  if (klip && klip.type !== 'klip' && klip.type !== 'konsert') return null;
  if (!item && !showSectionSkeleton) return null;
  if (!showSectionSkeleton && !recommendedAlbums.length) return null;

  const renderCard = (albumItem) => {
    if (albumItem._skeleton) {
      return <AlbumsForYouSkeletonCard key={albumItem.id} id={albumItem.id} />;
    }

    return (
      <AlbumsForYouItem
        key={albumItem.id}
        item={albumItem}
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
      className="albums-for-you"
      aria-busy={showSectionSkeleton || isLoading || undefined}
    >
      <div className="albums-for-you-container">
        {showTitleSkeleton ? (
          <SkeletonLoader
            variant="albums-for-you-title"
            className="albums-for-you-title-skeleton"
          />
        ) : (
          <h2 className="albums-for-you-title">{t(titleKey, 'Siz uchun albomlar')}</h2>
        )}
        <div className="albums-for-you-content">
          <HorizontalScroll>
            {itemsToRender.map((albumItem) => renderCard(albumItem))}
          </HorizontalScroll>
        </div>
      </div>
    </div>
  );
};

export default AlbumsForYou;
