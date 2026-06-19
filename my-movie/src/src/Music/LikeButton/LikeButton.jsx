import React, { useState, useCallback, useEffect } from 'react';
import { formatCount } from '../../utils/utils';
import './LikeButton.css';

const parseBase = (v) => {
  if (v === '' || v === undefined || v === null) return 0;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? 0 : n;
};

/** TrailerModal: `trailer_reactions_${key}` JSON — avvalgi format bilan mos */
function loadTrailerUserState(tkey) {
  if (!tkey || typeof localStorage === 'undefined') return 'none';
  try {
    const stored = localStorage.getItem(`trailer_reactions_${tkey}`);
    if (!stored) return 'none';
    const data = JSON.parse(stored);
    if (data.userReaction === 'like') return 'like';
    if (data.userReaction === 'dislike') return 'dislike';
  } catch {
    /* ignore */
  }
  return 'none';
}

function getInitialLikeState(
  persistKey,
  persistTrailerKey,
  initialLikeCount,
  initialDislikeCount,
  initialUserState
) {
  const baseL = parseBase(initialLikeCount);
  const baseD = parseBase(initialDislikeCount);

  if (persistTrailerKey) {
    const us = loadTrailerUserState(persistTrailerKey);
    return {
      likeCount: baseL + (us === 'like' ? 1 : 0),
      dislikeCount: baseD + (us === 'dislike' ? 1 : 0),
      userState: us,
    };
  }

  if (!persistKey || typeof localStorage === 'undefined') {
    return { likeCount: baseL, dislikeCount: baseD, userState: initialUserState };
  }
  try {
    const liked = localStorage.getItem(`${persistKey}_isLiked`) === 'true';
    const disliked = localStorage.getItem(`${persistKey}_isDisliked`) === 'true';
    return {
      likeCount: baseL + (liked ? 1 : 0),
      dislikeCount: baseD + (disliked ? 1 : 0),
      userState: liked ? 'like' : disliked ? 'dislike' : 'none',
    };
  } catch {
    return { likeCount: baseL, dislikeCount: baseD, userState: initialUserState };
  }
}

/**
 * LikeButton — like/dislike (musiqa, video, kino detail, trailer modal va h.k.)
 * @param {string} [persistTrailerKey] — `trailer_reactions_${key}` JSON (TrailerModal / SimilarTrailers)
 */
const LikeButton = ({
  contentId,
  initialLikeCount = 0,
  initialDislikeCount = 0,
  initialUserState = 'none',
  persistKey,
  persistTrailerKey,
  variant = 'pill',
  countFormatter,
  stopPropagation = false,
  onLikeChange,
  onDislikeChange,
  className = '',
}) => {
  const fmt = countFormatter || formatCount;

  const initS = getInitialLikeState(
    persistKey,
    persistTrailerKey,
    initialLikeCount,
    initialDislikeCount,
    initialUserState
  );
  const [likeCount, setLikeCount] = useState(initS.likeCount);
  const [dislikeCount, setDislikeCount] = useState(initS.dislikeCount);
  const [userState, setUserState] = useState(initS.userState);

  // Kino (persistKey) yoki trailer (persistTrailerKey): ma'lumot + localStorage
  useEffect(() => {
    if (persistTrailerKey) {
      const baseL = parseBase(initialLikeCount);
      const baseD = parseBase(initialDislikeCount);
      const us = loadTrailerUserState(persistTrailerKey);
      setUserState(us);
      setLikeCount(baseL + (us === 'like' ? 1 : 0));
      setDislikeCount(baseD + (us === 'dislike' ? 1 : 0));
      return;
    }
    if (!persistKey) return;
    const baseL = parseBase(initialLikeCount);
    const baseD = parseBase(initialDislikeCount);
    const liked = localStorage.getItem(`${persistKey}_isLiked`) === 'true';
    const disliked = localStorage.getItem(`${persistKey}_isDisliked`) === 'true';
    setUserState(liked ? 'like' : disliked ? 'dislike' : 'none');
    setLikeCount(baseL + (liked ? 1 : 0));
    setDislikeCount(baseD + (disliked ? 1 : 0));
  }, [persistTrailerKey, persistKey, contentId, initialLikeCount, initialDislikeCount]);

  // Video/musiqa: faqat contentId o'zgarganda
  useEffect(() => {
    if (persistKey || persistTrailerKey) return;
    setLikeCount(parseBase(initialLikeCount));
    setDislikeCount(parseBase(initialDislikeCount));
    setUserState(initialUserState);
  }, [persistKey, persistTrailerKey, contentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const persistFlags = useCallback(
    (next) => {
      if (persistTrailerKey) {
        const reaction = next === 'none' ? null : next;
        try {
          localStorage.setItem(
            `trailer_reactions_${persistTrailerKey}`,
            JSON.stringify({ userReaction: reaction })
          );
        } catch {
          /* ignore */
        }
        return;
      }
      if (!persistKey) return;
      localStorage.setItem(`${persistKey}_isLiked`, next === 'like' ? 'true' : 'false');
      localStorage.setItem(`${persistKey}_isDisliked`, next === 'dislike' ? 'true' : 'false');
    },
    [persistKey, persistTrailerKey]
  );

  const wrapClick = (fn) => (e) => {
    if (stopPropagation) e.stopPropagation();
    fn();
  };

  const handleLikeClick = useCallback(() => {
    if (userState === 'like') {
      setLikeCount((c) => c - 1);
      setUserState('none');
      persistFlags('none');
      onLikeChange?.(contentId, 'unlike', likeCount - 1);
    } else if (userState === 'dislike') {
      setDislikeCount((c) => c - 1);
      setLikeCount((c) => c + 1);
      setUserState('like');
      persistFlags('like');
      onDislikeChange?.(contentId, 'undo', dislikeCount - 1);
      onLikeChange?.(contentId, 'like', likeCount + 1);
    } else {
      setLikeCount((c) => c + 1);
      setUserState('like');
      persistFlags('like');
      onLikeChange?.(contentId, 'like', likeCount + 1);
    }
  }, [userState, likeCount, dislikeCount, contentId, onLikeChange, onDislikeChange, persistFlags]);

  const handleDislikeClick = useCallback(() => {
    if (userState === 'dislike') {
      setDislikeCount((c) => c - 1);
      setUserState('none');
      persistFlags('none');
      onDislikeChange?.(contentId, 'undo', dislikeCount - 1);
    } else if (userState === 'like') {
      setLikeCount((c) => c - 1);
      setDislikeCount((c) => c + 1);
      setUserState('dislike');
      persistFlags('dislike');
      onLikeChange?.(contentId, 'unlike', likeCount - 1);
      onDislikeChange?.(contentId, 'dislike', dislikeCount + 1);
    } else {
      setDislikeCount((c) => c + 1);
      setUserState('dislike');
      persistFlags('dislike');
      onDislikeChange?.(contentId, 'dislike', dislikeCount + 1);
    }
  }, [userState, likeCount, dislikeCount, contentId, onLikeChange, onDislikeChange, persistFlags]);

  if (variant === 'trailerModal') {
    return (
      <>
        <button
          type="button"
          className={`trailer-modal-controls-like ${userState === 'like' ? 'active' : ''}`}
          onClick={wrapClick(handleLikeClick)}
          aria-label="Like"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
          </svg>
          <span>{fmt(likeCount)}</span>
        </button>
        <button
          type="button"
          className={`trailer-modal-controls-dislike ${userState === 'dislike' ? 'active' : ''}`}
          onClick={wrapClick(handleDislikeClick)}
          aria-label="Dislike"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z" />
          </svg>
          <span>{fmt(dislikeCount)}</span>
        </button>
      </>
    );
  }

  if (variant === 'trailerSimilar') {
    return (
      <>
        <button
          type="button"
          className={`similar-trailer-like ${userState === 'like' ? 'active' : ''}`}
          onClick={wrapClick(handleLikeClick)}
          aria-label="Like"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
          </svg>
          <span>{fmt(likeCount)}</span>
        </button>
        <button
          type="button"
          className={`similar-trailer-dislike ${userState === 'dislike' ? 'active' : ''}`}
          onClick={wrapClick(handleDislikeClick)}
          aria-label="Dislike"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z" />
          </svg>
          <span>{fmt(dislikeCount)}</span>
        </button>
      </>
    );
  }

  if (variant === 'movieDetail') {
    return (
      <>
        <button
          type="button"
          className={`movie-detail-action-btn ${userState === 'like' ? 'active' : ''}`}
          onClick={handleLikeClick}
          aria-label="Like"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill={userState === 'like' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
          </svg>
          <span className="movie-detail-action-count">{fmt(likeCount)}</span>
        </button>
        <button
          type="button"
          className={`movie-detail-action-btn ${userState === 'dislike' ? 'active' : ''}`}
          onClick={handleDislikeClick}
          aria-label="Dislike"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill={userState === 'dislike' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
          </svg>
          <span className="movie-detail-action-count">{fmt(dislikeCount)}</span>
        </button>
      </>
    );
  }

  return (
    <div className={`like-button ${className}`}>
      <button
        type="button"
        className={`like-button-btn like-button-like ${userState === 'like' ? 'active' : ''}`}
        onClick={handleLikeClick}
        aria-label="Like"
      >
        <span className="like-button-icon-wrap">
          <svg width="22" height="22" viewBox="0 0 24 24" fill={userState === 'like' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M7 10v12M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 15.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
          </svg>
        </span>
        <span className="like-button-count">{fmt(likeCount)}</span>
      </button>
      <button
        type="button"
        className={`like-button-btn like-button-dislike ${userState === 'dislike' ? 'active' : ''}`}
        onClick={handleDislikeClick}
        aria-label="Dislike"
      >
        <span className="like-button-icon-wrap">
          <svg width="22" height="22" viewBox="0 0 24 24" fill={userState === 'dislike' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M17 14V2" />
            <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 8.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z" />
          </svg>
        </span>
        <span className="like-button-count">{fmt(dislikeCount)}</span>
      </button>
    </div>
  );
};

export default LikeButton;
