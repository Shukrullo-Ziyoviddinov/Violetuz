import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import ScrollTouch from '../ScrollTouch/ScrollTouch';
import * as commentsApi from '../../api/commentsApi';
import './MovieComments.css';

const PROFILE_STORAGE_KEY = 'violet_profile';

const getStoredProfile = () => {
  try {
    const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        name: parsed.name?.trim() || '',
        username: (parsed.username ?? parsed.surname ?? '').trim().replace(/^@+/, '').trim() || '',
        avatar: parsed.avatar ?? null,
      };
    }
  } catch (e) {}
  return { name: '', username: '', avatar: null };
};

const toggleCommentLike = (movieId, commentId, comments, setComments) => {
  const liked = commentsApi.getLikedIds(movieId);
  const isLiked = liked.has(String(commentId));

  const updateInTree = (list) => {
    return list.map((c) => {
      if (String(c.id) === String(commentId)) {
        return { ...c, likes: Math.max(0, (c.likes || 0) + (isLiked ? -1 : 1)) };
      }
      if (c.replies?.length) {
        return { ...c, replies: updateInTree(c.replies) };
      }
      return c;
    });
  };

  const updated = updateInTree(comments);
  setComments(updated);
  commentsApi.saveComments(movieId, updated);

  if (isLiked) liked.delete(String(commentId));
  else liked.add(String(commentId));
  commentsApi.saveLikedIds(movieId, liked);
};

const migrateComment = (c) => ({
  ...c,
  likes: c.likes ?? 0,
  replies: Array.isArray(c.replies) ? c.replies.map(migrateComment) : [],
});

const PREVIEW_LIMIT = 4;

/** Jami kommentlar soni (asosiy + barcha javoblar, ichki javoblar bilan) */
const countTotalComments = (comments) => {
  return comments.reduce((sum, c) => sum + 1 + countTotalComments(c.replies || []), 0);
};

/** Tashqarida ko'rsatish uchun max PREVIEW_LIMIT ta (asosiy + javoblar, ichki javoblar bilan) */
const getDisplayedComments = (comments) => {
  let count = 0;
  const takeFrom = (list) => {
    const out = [];
    for (const c of list) {
      if (count >= PREVIEW_LIMIT) break;
      count++;
      out.push({ ...c, replies: takeFrom(c.replies || []) });
    }
    return out;
  };
  return takeFrom(comments);
};

const EMOJI_LIST = [
  '👍', '❤️', '😂', '😮', '😢', '😡', '🔥', '👏',
  '😍', '😎', '🤔', '😊', '🎉', '💪', '😋', '🙏',
  '✨', '😘', '😱', '👀', '😇', '😈', '🥰', '🤩',
  '💯', '🌟', '💕', '😤', '🤣', '😭', '🥺', '👋',
];

const VL_EMOJI_IMG = '/img/photo_2026-02-16_20-30-31_preview_rev_1.png';

const MovieComments = forwardRef(({ movieId, onCountChange }, ref) => {
  const { t, i18n } = useTranslation();
  const [comments, setComments] = useState([]);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [profile, setProfile] = useState(getStoredProfile);
  const [dragY, setDragY] = useState(0);
  const startYRef = useRef(0);
  const commentsListRef = useRef(null);

  useEffect(() => {
    const raw = commentsApi.getComments(movieId);
    setComments(raw.map(migrateComment));
    setReplyingTo(null);
    setInputValue('');
    setShowCommentsModal(false);
  }, [movieId]);

  useEffect(() => {
    const stored = getStoredProfile();
    const handleStorage = () => setProfile(getStoredProfile());
    setProfile(stored);
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    if (showCommentsModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showCommentsModal]);

  const handleSubmitComment = (e) => {
    e?.preventDefault();
    const text = inputValue.trim();
    if (!text) return;

    const handle = (profile.username || '').trim();
    const handlePart = handle ? `@${handle}` : '';
    const fullName = [profile.name, handlePart].filter(Boolean).join(' ') || (i18n.language === 'uz' ? 'Foydalanuvchi' : 'Пользователь');
    const newComment = {
      id: Date.now(),
      movieId: commentsApi.toMovieKey(movieId),
      parentId: replyingTo ? replyingTo.id : null,
      text,
      authorName: fullName,
      authorAvatar: profile.avatar,
      createdAt: new Date().toISOString(),
      likes: 0,
      replies: [],
    };

    if (replyingTo) {
      const addReply = (list, parentId) => {
        return list.map((c) => {
          if (String(c.id) === String(parentId)) {
            return { ...c, replies: [...(c.replies || []), newComment] };
          }
          if (c.replies?.length) {
            return { ...c, replies: addReply(c.replies, parentId) };
          }
          return c;
        });
      };
      const updated = addReply(comments, replyingTo.id);
      setComments(updated);
      commentsApi.saveComments(movieId, updated);
      setReplyingTo(null);
    } else {
      const updated = [newComment, ...comments];
      setComments(updated);
      commentsApi.saveComments(movieId, updated);
    }
    setInputValue('');
  };

  const handleReplyClick = (comment) => {
    setReplyingTo(comment);
  };

  const handleEmojiClick = (emoji) => {
    setInputValue((prev) => prev + emoji);
  };

  const handleImageEmojiClick = () => {
    setInputValue((prev) => prev + ' VL');
  };

  const handleInputClick = () => {
    setShowCommentsModal(true);
  };

  const handleTouchStart = (e) => {
    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (window.innerWidth > 768) return;
    const y = e.touches[0].clientY;
    const diff = y - startYRef.current;
    if (diff > 0) setDragY(diff);
  };

  const handleTouchEnd = () => {
    if (dragY > 80) setShowCommentsModal(false);
    setDragY(0);
  };

  const displayedComments = getDisplayedComments(comments);
  const totalCount = countTotalComments(comments);
  const hasMore = totalCount > PREVIEW_LIMIT;
  const likedIds = commentsApi.getLikedIds(movieId);

  useImperativeHandle(ref, () => ({
    openModal: () => setShowCommentsModal(true),
  }), []);
  useEffect(() => {
    onCountChange?.(totalCount);
  }, [totalCount, onCountChange]);

  const moreBtnText = i18n.language === 'uz' 
    ? `Ko'proq (${totalCount})` 
    : `Ещё (${totalCount})`;

  const renderComment = (c, isReply = false, isPreview = false) => (
    <div key={c.id} className={`movie-detail-comment-item ${isReply ? 'movie-detail-comment-reply' : ''} ${!isPreview ? 'movie-detail-comment-item-modal' : ''}`}>
      <div className="movie-detail-comment-main">
        <div className="movie-detail-comment-avatar">
          {c.authorAvatar ? (
            <img src={c.authorAvatar} alt="" className="profile-avatar-img" />
          ) : (
            <div className="movie-detail-comment-avatar-placeholder">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          )}
        </div>
        <div className="movie-detail-comment-body">
          <span className="movie-detail-comment-author">{c.authorName}</span>
          <p className="movie-detail-comment-text">{c.text}</p>
          <div className="movie-detail-comment-tag-row">
            <button
              type="button"
              className="movie-detail-comment-reply-btn"
              onClick={(e) => { e.stopPropagation(); handleReplyClick(c); if (isPreview) handleInputClick(); }}
              aria-label="Javob"
            >
              {i18n.language === 'uz' ? 'Javob' : 'Ответить'}
            </button>
          </div>
        </div>
        <div
          className={`movie-detail-comment-like-wrap ${likedIds.has(String(c.id)) ? 'active' : ''}`}
          onClick={(e) => { e.stopPropagation(); toggleCommentLike(movieId, String(c.id), comments, setComments); }}
          role="button"
          tabIndex={0}
          onKeyDown={(ev) => ev.key === 'Enter' && toggleCommentLike(movieId, String(c.id), comments, setComments)}
          aria-label="Like"
        >
          <button type="button" className="movie-detail-comment-like-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill={likedIds.has(String(c.id)) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
          {(c.likes || 0) > 0 && <span className="movie-detail-comment-like-count">{c.likes}</span>}
        </div>
      </div>
      {c.replies?.length > 0 && (
        <div className="movie-detail-comment-replies">
          {c.replies.map((r) => renderComment(r, true))}
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="movie-detail-comments">
        <h3 className="movie-detail-comments-title">
          {i18n.language === 'uz' ? 'Izohlar' : 'Комментарии'}
        </h3>

        <div 
          className="movie-detail-comments-input-wrap"
          onClick={handleInputClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleInputClick()}
        >
          <input
            type="text"
            className="movie-detail-comments-input"
            placeholder={i18n.language === 'uz' ? 'Izoh yozing...' : 'Написать комментарий...'}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onClick={(e) => { e.stopPropagation(); handleInputClick(); }}
            readOnly
          />
          <button
            type="button"
            className="movie-detail-comments-send-btn"
            onClick={(e) => { e.stopPropagation(); handleInputClick(); }}
            aria-label="Yuborish"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>

        <div className="movie-detail-comments-list">
          {displayedComments.length === 0 ? (
            <p className="movie-detail-comments-empty">
              {i18n.language === 'uz' ? 'Komment bo\'sh' : 'Комментариев нет'}
            </p>
          ) : (
            displayedComments.map((c) => renderComment(c, false, true))
          )}
        </div>

        {hasMore && (
          <button
            type="button"
            className="movie-detail-comments-more-btn"
            onClick={() => setShowCommentsModal(true)}
          >
            {moreBtnText}
          </button>
        )}
      </div>

      {showCommentsModal && createPortal(
        <>
          <div 
            className="movie-detail-comments-modal-overlay" 
            onClick={() => setShowCommentsModal(false)} 
          />
          <div
            className={`movie-detail-comments-modal ${dragY > 0 ? 'movie-detail-comments-modal-dragging' : ''}`}
            style={{ '--drag-y': `${dragY}px` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="movie-detail-comments-modal-header-wrap"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="movie-detail-comments-modal-drag-handle" />
              <div className="movie-detail-comments-modal-header">
                <button
                  className="movie-detail-comments-modal-close movie-detail-comments-modal-close-desktop"
                  onClick={() => setShowCommentsModal(false)}
                  aria-label="Yopish"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                </button>
                <h3 className="movie-detail-comments-modal-title">
                  {i18n.language === 'uz' ? 'Izohlar' : 'Комментарии'}
                </h3>
              </div>
            </div>

            <div className="movie-detail-comments-modal-body" ref={commentsListRef}>
              {comments.length === 0 ? (
                <p className="movie-detail-comments-modal-empty">
                  {i18n.language === 'uz' ? 'Komment bo\'sh' : 'Комментариев нет'}
                </p>
              ) : (
                comments.map((c) => renderComment(c, false, false))
              )}
            </div>

            <div className="movie-detail-comments-modal-footer">
              {replyingTo && (
                <div className="movie-detail-comments-replying-bar">
                  <span>{i18n.language === 'uz' ? 'Javob:' : 'Ответ:'} {replyingTo.authorName}</span>
                  <button type="button" className="movie-detail-comments-reply-cancel" onClick={() => setReplyingTo(null)} aria-label="Bekor qilish">×</button>
                </div>
              )}
              <ScrollTouch className="movie-detail-comments-modal-emoji-row">
                <button
                  type="button"
                  className="movie-detail-comments-emoji-btn movie-detail-comments-emoji-btn-img"
                  onClick={handleImageEmojiClick}
                  aria-label="VL"
                >
                  <img src={VL_EMOJI_IMG} alt="VL" />
                </button>
                {EMOJI_LIST.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="movie-detail-comments-emoji-btn"
                    onClick={() => handleEmojiClick(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </ScrollTouch>
              <form className="movie-detail-comments-modal-input-wrap" onSubmit={handleSubmitComment}>
                <div className="movie-detail-comments-modal-avatar">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt="" className="profile-avatar-img" />
                  ) : (
                    <div className="movie-detail-comment-avatar-placeholder">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  className="movie-detail-comments-modal-input"
                  placeholder={replyingTo 
                    ? (i18n.language === 'uz' ? `${replyingTo.authorName} ga javob...` : `Ответ ${replyingTo.authorName}...`)
                    : (i18n.language === 'uz' ? 'Izoh yozing...' : 'Написать комментарий...')}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  autoFocus
                />
                <button
                  type="submit"
                  className="movie-detail-comments-modal-send-btn"
                  aria-label="Yuborish"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
});

MovieComments.displayName = 'MovieComments';

export default MovieComments;
