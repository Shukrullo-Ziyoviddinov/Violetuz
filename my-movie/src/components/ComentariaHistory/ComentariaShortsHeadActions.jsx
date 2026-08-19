import React, { useCallback, useMemo } from 'react';
import { useWishlist } from '../../context/WishlistContext';
import LikeButton from '../../Music/LikeButton/LikeButton';
import Repost from '../Repost/Repost';
import { formatShortsLikeCount } from '../../utils/utils';
import {
  shortsWishlistType,
  displaySaveCount,
} from '../../store/slices/wishlistUtils';

/**
 * Sharhlar tarixida shorts kartasi — ShortsVideos modal bilan bir xil like / repost / saqlash.
 */
const ComentariaShortsHeadActions = ({
  shortsId,
  shortsSource,
  movieId,
  musicId,
  contentType,
  repostRoute,
  repostTitle,
  videoSrc,
  saveCount = 0,
}) => {
  const { toggleWishlist, isInWishlist } = useWishlist();

  const slideMusic = shortsSource === 'musicshorts';
  const item = {
    id: shortsId,
    type: slideMusic ? 'musicshorts' : 'movieShorts',
    saveCount,
  };
  const wishlistType = shortsWishlistType(item);
  const saveActive = shortsId != null && isInWishlist(shortsId, wishlistType);
  const shownSaveCount = displaySaveCount(saveCount, saveActive);

  const handleSave = useCallback(
    (e) => {
      e.stopPropagation();
      if (shortsId == null) return;
      toggleWishlist(shortsId, wishlistType);
    },
    [shortsId, wishlistType, toggleWishlist]
  );

  const repostItem = useMemo(
    () => ({
      id: shortsId,
      type: slideMusic ? 'musicshorts' : 'movieShorts',
      title: repostTitle || '',
      image: '/img/movie1.jpg',
      videoUrl: videoSrc || '',
      route: repostRoute || (slideMusic ? '/music/shorts' : '/shorts'),
    }),
    [shortsId, slideMusic, repostTitle, videoSrc, repostRoute]
  );

  return (
    <div className="comentaria-history-shorts-actions" onClick={(e) => e.stopPropagation()} role="group">
      <LikeButton variant="shorts" contentId={shortsId} stopPropagation />
      {shortsId != null ? (
        <Repost className="shorts-modal-action-btn" item={repostItem} ariaLabel="Repost" />
      ) : null}
      <button
        type="button"
        className={`shorts-modal-action-btn shorts-modal-save-btn ${saveActive ? 'active' : ''}`}
        onClick={handleSave}
        aria-label="Saqlash"
      >
        <svg
          viewBox="0 0 24 24"
          fill={saveActive ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
        <span className="shorts-modal-action-count">{formatShortsLikeCount(shownSaveCount)}</span>
      </button>
    </div>
  );
};

export default ComentariaShortsHeadActions;
