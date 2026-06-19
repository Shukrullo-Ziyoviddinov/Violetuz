import React, { useCallback, useMemo } from 'react';
import { useWishlist } from '../../context/WishlistContext';
import LikeButton from '../../Music/LikeButton/LikeButton';
import Repost from '../Repost/Repost';

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
}) => {
  const { toggleWishlist, isInWishlist } = useWishlist();

  const slideMusic = shortsSource === 'musicshorts';
  const wishlistType = contentType || 'music';
  const saveActive = slideMusic && musicId != null
    ? isInWishlist(musicId, wishlistType)
    : movieId != null && isInWishlist(movieId, 'movie');

  const handleSave = useCallback(
    (e) => {
      e.stopPropagation();
      if (slideMusic && musicId != null) {
        toggleWishlist(musicId, wishlistType);
      } else if (movieId != null) {
        toggleWishlist(movieId, 'movie');
      }
    },
    [slideMusic, musicId, movieId, wishlistType, toggleWishlist]
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
      </button>
    </div>
  );
};

export default ComentariaShortsHeadActions;
