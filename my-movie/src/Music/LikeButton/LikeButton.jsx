import React, { useState, useCallback, useEffect } from 'react';
import { formatCount, formatShortsLikeCount } from '../../utils/utils';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  upsertLikeHistoryItem,
  removeLikeHistoryItem,
  setReaction,
  toggleShortsLike,
  selectReaction,
  selectShortsLikeCount,
} from '../../store/slices/likesSlice';
import {
  reactionKeyForPersist,
  reactionKeyForTrailer,
} from '../../store/slices/likesUtils';
import './LikeButton.css';

const parseBase = (v) => {
  if (v === '' || v === undefined || v === null) return 0;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? 0 : n;
};

/**
 * LikeButton — barcha like turlari (musiqa, kino, trailer, shorts)
 * @param {string} [persistTrailerKey] — trailer reactions kaliti
 * @param {'pill'|'movieDetail'|'trailerModal'|'trailerSimilar'|'shorts'} [variant]
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
  likeMeta,
}) => {
  const dispatch = useAppDispatch();
  const fmt = countFormatter || formatCount;

  const reactionKey = persistTrailerKey
    ? reactionKeyForTrailer(persistTrailerKey)
    : persistKey
      ? reactionKeyForPersist(persistKey)
      : null;

  const reactionFromStore = useAppSelector((state) => selectReaction(state, reactionKey));
  const shortsLikeCount = useAppSelector((state) => selectShortsLikeCount(state, contentId));

  const [localUserState, setLocalUserState] = useState(initialUserState);

  useEffect(() => {
    if (!reactionKey) {
      setLocalUserState(initialUserState);
    }
  }, [reactionKey, contentId, initialUserState]);

  const userState = reactionKey ? reactionFromStore : localUserState;
  const baseL = parseBase(initialLikeCount);
  const baseD = parseBase(initialDislikeCount);
  const likeCount = baseL + (userState === 'like' ? 1 : 0);
  const dislikeCount = baseD + (userState === 'dislike' ? 1 : 0);

  const addToHistory = useCallback(() => {
    if (likeMeta && contentId) {
      dispatch(upsertLikeHistoryItem({ meta: likeMeta, contentId }));
    }
  }, [dispatch, likeMeta, contentId]);

  const removeFromHistory = useCallback(() => {
    if (likeMeta && contentId) {
      dispatch(removeLikeHistoryItem({ meta: likeMeta, contentId }));
    }
  }, [dispatch, likeMeta, contentId]);

  const persistReaction = useCallback(
    (next) => {
      if (!reactionKey) {
        setLocalUserState(next);
        return;
      }
      dispatch(setReaction({ key: reactionKey, value: next }));
    },
    [dispatch, reactionKey]
  );

  const wrapClick = (fn) => (e) => {
    if (stopPropagation) e.stopPropagation();
    fn();
  };

  const handleShortsClick = useCallback(() => {
    if (contentId == null) return;
    dispatch(toggleShortsLike(contentId));
  }, [dispatch, contentId]);

  const handleLikeClick = useCallback(() => {
    if (userState === 'like') {
      persistReaction('none');
      removeFromHistory();
      onLikeChange?.(contentId, 'unlike', likeCount - 1);
    } else if (userState === 'dislike') {
      persistReaction('like');
      addToHistory();
      onDislikeChange?.(contentId, 'undo', dislikeCount - 1);
      onLikeChange?.(contentId, 'like', likeCount + 1);
    } else {
      persistReaction('like');
      addToHistory();
      onLikeChange?.(contentId, 'like', likeCount + 1);
    }
  }, [
    userState,
    likeCount,
    dislikeCount,
    contentId,
    onLikeChange,
    onDislikeChange,
    persistReaction,
    addToHistory,
    removeFromHistory,
  ]);

  const handleDislikeClick = useCallback(() => {
    if (userState === 'dislike') {
      persistReaction('none');
      onDislikeChange?.(contentId, 'undo', dislikeCount - 1);
    } else if (userState === 'like') {
      persistReaction('dislike');
      removeFromHistory();
      onLikeChange?.(contentId, 'unlike', likeCount - 1);
      onDislikeChange?.(contentId, 'dislike', dislikeCount + 1);
    } else {
      persistReaction('dislike');
      onDislikeChange?.(contentId, 'dislike', dislikeCount + 1);
    }
  }, [
    userState,
    likeCount,
    dislikeCount,
    contentId,
    onLikeChange,
    onDislikeChange,
    persistReaction,
    removeFromHistory,
  ]);

  if (variant === 'shorts') {
    return (
      <button
        type="button"
        className={`shorts-modal-action-btn shorts-modal-like-btn ${shortsLikeCount > 0 ? 'active' : ''}`}
        onClick={wrapClick(handleShortsClick)}
        aria-label="Like"
      >
        <svg viewBox="0 0 24 24" fill={shortsLikeCount > 0 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        {shortsLikeCount > 0 && (
          <span className="shorts-modal-action-count">{formatShortsLikeCount(shortsLikeCount)}</span>
        )}
      </button>
    );
  }

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
          onClick={wrapClick(handleLikeClick)}
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
          onClick={wrapClick(handleDislikeClick)}
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
