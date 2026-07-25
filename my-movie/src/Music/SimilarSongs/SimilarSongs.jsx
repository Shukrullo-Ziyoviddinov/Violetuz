import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useWishlist } from '../../context/WishlistContext';
import HorizontalScroll from '../../components/HorizontalScroll/HorizontalScroll';
import { useSimilarSongs } from '../../services/similarSongsService';
import { useMusicApi } from '../../context/MusicApiContext';
import SkeletonLoader from '../../components/SkeletonLoader/SkeletonLoader';
import { useImageReady } from '../../utils/useImageReady';
import './SimilarSongs.css';

const DEFAULT_SKELETON_COUNT = 8;

const SimilarSongSkeletonCard = ({ id }) => (
  <div
    key={id}
    className="similar-songs-item similar-songs-item--skeleton"
    aria-hidden="true"
  >
    <div className="similar-songs-item-image-wrapper">
      <SkeletonLoader
        variant="similar-songs-image"
        className="similar-songs-item-image-skeleton"
      />
      <span
        className="similar-songs-item-wishlist-btn similar-songs-item-wishlist-btn--skeleton"
        aria-hidden="true"
      />
      <span
        className="similar-songs-item-play similar-songs-item-play--skeleton"
        aria-hidden="true"
      />
      <div className="similar-songs-item-info">
        <SkeletonLoader variant="similar-songs-item-title" />
        <SkeletonLoader variant="similar-songs-item-artist" />
      </div>
    </div>
  </div>
);

/** Cover + overlay skeletons until image is ready */
const SimilarSongItem = ({
  item,
  getTitleText,
  getArtistName,
  onOpen,
  isInWishlist,
  onWishlistClick,
  blockClick,
}) => {
  const imgSrc = item.img || '';
  const { showSkeleton: showImgSkeleton, imgRef, onLoad, onError } = useImageReady(imgSrc);

  return (
    <div
      className={`similar-songs-item${showImgSkeleton ? ' similar-songs-item--loading' : ''}`}
      onClick={() => !blockClick && !showImgSkeleton && onOpen?.(item.id, item.sectionId)}
      aria-busy={showImgSkeleton || undefined}
    >
      <div className="similar-songs-item-image-wrapper">
        {showImgSkeleton && (
          <SkeletonLoader
            variant="similar-songs-image"
            className="similar-songs-item-image-skeleton"
          />
        )}
        {imgSrc && (
          <img
            ref={imgRef}
            src={imgSrc}
            alt={getTitleText(item)}
            className={`similar-songs-item-image${
              showImgSkeleton ? ' similar-songs-item-image--loading' : ''
            }`}
            onLoad={onLoad}
            onError={onError}
          />
        )}

        {showImgSkeleton ? (
          <>
            <span
              className="similar-songs-item-wishlist-btn similar-songs-item-wishlist-btn--skeleton"
              aria-hidden="true"
            />
            <span
              className="similar-songs-item-play similar-songs-item-play--skeleton"
              aria-hidden="true"
            />
            <div className="similar-songs-item-info" aria-hidden="true">
              <SkeletonLoader variant="similar-songs-item-title" />
              <SkeletonLoader variant="similar-songs-item-artist" />
            </div>
          </>
        ) : (
          <>
            <button
              className={`similar-songs-item-wishlist-btn ${
                isInWishlist(item.id, 'music') ? 'active' : ''
              }`}
              onClick={(e) => onWishlistClick(e, item.id)}
              aria-label="Sevimlilarga qo'shish"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill={isInWishlist(item.id, 'music') ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
            <div className="similar-songs-item-play">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21" />
              </svg>
            </div>
            <div className="similar-songs-item-info">
              <h3 className="similar-songs-item-title">{getTitleText(item)}</h3>
              <p className="similar-songs-item-artist">{getArtistName(item.artistId)}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/**
 * O'xshash musiqalar / Tavsiya etilgan musiqalar bo'limi.
 * music: type 'music'. album: type 'musicAlbom'. klip: type 'klip' yoki 'konsert' (VideoPage).
 * titleKey: VideoPage da "music.recommendedMusic" (Tavsiya etilgan musiqalar).
 *
 * forceSkeleton — parent hali music topmagan (refresh); image-wrapper skeletonlar darhol turadi.
 */
const SimilarSongs = ({
  music,
  album,
  klip,
  titleKey = 'music.similarSongs',
  forceSkeleton = false,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { contentLang } = useContentLanguage();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { getArtistById, musicLoading } = useMusicApi();

  const item = music || album || klip;
  const { items: similarSongs, isLoading } = useSimilarSongs(item);

  const getTitleText = (song) => {
    if (!song?.title) return '';
    if (typeof song.title === 'object') {
      return song.title[contentLang] || song.title.uz || song.title.ru || song.title.en || '';
    }
    return String(song.title);
  };

  const getArtistName = (artistId) => {
    const artist = getArtistById(artistId);
    return artist?.name || artistId || '';
  };

  const handleCardClick = (itemId, sectionId) => {
    const path = `/music/${itemId}${sectionId ? `?section=${encodeURIComponent(sectionId)}` : ''}`;
    navigate(path, { replace: false });
  };

  const handleWishlistClick = (e, itemId) => {
    e.stopPropagation();
    toggleWishlist(itemId, 'music');
  };

  const skeletonItems = useMemo(
    () =>
      Array.from({ length: DEFAULT_SKELETON_COUNT }, (_, index) => ({
        id: `similar-songs-skeleton-${index}`,
        _skeleton: true,
      })),
    []
  );

  /* Catalog hali kelmagan yoki force — bo‘lim yo‘qolmasin, image-wrapper skeleton turadi */
  const awaitingCatalog = Boolean(forceSkeleton) || (Boolean(musicLoading) && !item);
  const showSectionSkeleton =
    awaitingCatalog || (Boolean(isLoading) && similarSongs.length === 0);
  const itemsToRender = showSectionSkeleton ? skeletonItems : similarSongs;
  const showTitleSkeleton = showSectionSkeleton;

  if (music && music.type !== 'music') return null;
  if (album && album.type !== 'musicAlbom') return null;
  if (klip && klip.type !== 'klip' && klip.type !== 'konsert') return null;
  if (!item && !showSectionSkeleton) return null;
  if (!showSectionSkeleton && !similarSongs.length) return null;

  const renderCard = (song) => {
    if (song._skeleton) {
      return <SimilarSongSkeletonCard key={song.id} id={song.id} />;
    }

    return (
      <SimilarSongItem
        key={song.id}
        item={song}
        getTitleText={getTitleText}
        getArtistName={getArtistName}
        onOpen={handleCardClick}
        isInWishlist={isInWishlist}
        onWishlistClick={handleWishlistClick}
        blockClick={Boolean(isLoading) || showSectionSkeleton}
      />
    );
  };

  return (
    <div
      className="similar-songs"
      aria-busy={showSectionSkeleton || isLoading || undefined}
    >
      <div className="similar-songs-container">
        {showTitleSkeleton ? (
          <SkeletonLoader
            variant="similar-songs-title"
            className="similar-songs-title-skeleton"
          />
        ) : (
          <h2 className="similar-songs-title">{t(titleKey, "O'xshash musiqalar")}</h2>
        )}
        <div className="similar-songs-content">
          <HorizontalScroll>{itemsToRender.map((song) => renderCard(song))}</HorizontalScroll>
        </div>
      </div>
    </div>
  );
};

export default SimilarSongs;
