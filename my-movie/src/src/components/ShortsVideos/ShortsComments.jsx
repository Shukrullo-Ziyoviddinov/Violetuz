import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import ScrollTouch from '../ScrollTouch/ScrollTouch';
import * as shortsCommentsApi from '../../api/shortsCommentsApi';
import './ShortsComments.css';

const PROFILE_STORAGE_KEY = 'violet_profile';

const formatLikeCount = (n) => {
  const num = Number(n);
  if (!Number.isFinite(num) || num < 0) return '0';
  if (num < 100) return String(num);
  if (num < 1000) return Math.floor(num / 100) * 100 + '+';
  const k = num / 1000;
  if (k % 1 === 0) return k + 'k';
  const str = k.toFixed(1).replace(/\.0$/, '');
  return str + 'k';
};

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

const toggleShortsCommentLike = (shortsId, commentId, comments, setComments) => {
  const liked = shortsCommentsApi.getLikedIds(shortsId);
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
  shortsCommentsApi.saveComments(shortsId, updated);

  if (isLiked) liked.delete(String(commentId));
  else liked.add(String(commentId));
  shortsCommentsApi.saveLikedIds(shortsId, liked);
};

const migrateShortsComment = (c) => ({
  ...c,
  likes: c.likes ?? 0,
  replies: Array.isArray(c.replies) ? c.replies.map(migrateShortsComment) : [],
});

const PREVIEW_LIMIT = 4;

const countTotalShortsComments = (comments) => {
  return comments.reduce((sum, c) => sum + 1 + countTotalShortsComments(c.replies || []), 0);
};

const getDisplayedShortsComments = (comments) => {
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

const ShortsComments = forwardRef(({ shortsId, onCountChange, compact }, ref) => {
  const { i18n } = useTranslation();
  const [shortsComments, setShortsComments] = useState([]);
  const [showShortsCommentsModal, setShowShortsCommentsModal] = useState(false);
  const [shortsInputValue, setShortsInputValue] = useState('');
  const [replyingToShorts, setReplyingToShorts] = useState(null);
  const [profile, setProfile] = useState(getStoredProfile);
  const [dragY, setDragY] = useState(0);
  const startYRef = useRef(0);
  const shortsCommentsListRef = useRef(null);

  useEffect(() => {
    const raw = shortsCommentsApi.getComments(shortsId);
    setShortsComments(raw.map(migrateShortsComment));
    setReplyingToShorts(null);
    setShortsInputValue('');
    setShowShortsCommentsModal(false);
  }, [shortsId]);

  useEffect(() => {
    const stored = getStoredProfile();
    const handleStorage = () => setProfile(getStoredProfile());
    setProfile(stored);
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    if (showShortsCommentsModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showShortsCommentsModal]);

  const handleSubmitShortsComment = (e) => {
    e?.preventDefault();
    const text = shortsInputValue.trim();
    if (!text) return;

    const handle = (profile.username || '').trim();
    const handlePart = handle ? `@${handle}` : '';
    const fullName = [profile.name, handlePart].filter(Boolean).join(' ') || (i18n.language === 'uz' ? 'Foydalanuvchi' : 'Пользователь');
    const newComment = {
      id: Date.now(),
      shortsId: shortsCommentsApi.toShortsKey(shortsId),
      parentId: replyingToShorts ? replyingToShorts.id : null,
      text,
      authorName: fullName,
      authorAvatar: profile.avatar,
      createdAt: new Date().toISOString(),
      likes: 0,
      replies: [],
    };

    if (replyingToShorts) {
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
      const updated = addReply(shortsComments, replyingToShorts.id);
      setShortsComments(updated);
      shortsCommentsApi.saveComments(shortsId, updated);
      setReplyingToShorts(null);
    } else {
      const updated = [newComment, ...shortsComments];
      setShortsComments(updated);
      shortsCommentsApi.saveComments(shortsId, updated);
    }
    setShortsInputValue('');
  };

  const handleReplyShortsClick = (comment) => {
    setReplyingToShorts(comment);
  };

  const handleEmojiShortsClick = (emoji) => {
    setShortsInputValue((prev) => prev + emoji);
  };

  const handleImageEmojiShortsClick = () => {
    setShortsInputValue((prev) => prev + ' VL');
  };

  const handleShortsInputClick = () => {
    setShowShortsCommentsModal(true);
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
    if (dragY > 80) setShowShortsCommentsModal(false);
    setDragY(0);
  };

  const displayedShortsComments = getDisplayedShortsComments(shortsComments);
  const totalShortsCount = countTotalShortsComments(shortsComments);
  const hasMoreShorts = totalShortsCount > PREVIEW_LIMIT;
  const likedShortsIds = shortsCommentsApi.getLikedIds(shortsId);

  useImperativeHandle(ref, () => ({
    openShortsModal: () => setShowShortsCommentsModal(true),
  }), []);

  useEffect(() => {
    onCountChange?.(totalShortsCount);
  }, [totalShortsCount, onCountChange]);

  const moreShortsBtnText = i18n.language === 'uz'
    ? `Ko'proq (${totalShortsCount})`
    : `Ещё (${totalShortsCount})`;

  const renderShortsComment = (c, isReply = false, isPreview = false) => (
    <div key={c.id} className={`shorts-comment-item ${isReply ? 'shorts-comment-reply' : ''} ${!isPreview ? 'shorts-comment-item-modal' : ''}`}>
      <div className="shorts-comment-main">
        <div className="shorts-comment-avatar">
          {c.authorAvatar ? (
            <img src={c.authorAvatar} alt="" className="profile-avatar-img" />
          ) : (
            <div className="shorts-comment-avatar-placeholder">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          )}
        </div>
        <div className="shorts-comment-body">
          <span className="shorts-comment-author">{c.authorName}</span>
          <p className="shorts-comment-text">{c.text}</p>
          <div className="shorts-comment-tag-row">
            <button
              type="button"
              className="shorts-comment-reply-btn"
              onClick={(e) => { e.stopPropagation(); handleReplyShortsClick(c); if (isPreview) handleShortsInputClick(); }}
              aria-label="Javob"
            >
              {i18n.language === 'uz' ? 'Javob' : 'Ответить'}
            </button>
          </div>
        </div>
        <div
          className={`shorts-comment-like-wrap ${likedShortsIds.has(String(c.id)) ? 'active' : ''}`}
          onClick={(e) => { e.stopPropagation(); toggleShortsCommentLike(shortsId, String(c.id), shortsComments, setShortsComments); }}
          role="button"
          tabIndex={0}
          onKeyDown={(ev) => ev.key === 'Enter' && toggleShortsCommentLike(shortsId, String(c.id), shortsComments, setShortsComments)}
          aria-label="Like"
        >
          <button type="button" className="shorts-comment-like-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill={likedShortsIds.has(String(c.id)) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
          {(c.likes || 0) > 0 && <span className="shorts-comment-like-count">{formatLikeCount(c.likes)}</span>}
        </div>
      </div>
      {c.replies?.length > 0 && (
        <div className="shorts-comment-replies">
          {c.replies.map((r) => renderShortsComment(r, true))}
        </div>
      )}
    </div>
  );

  return (
    <>
      {!compact && (
        <div className="shorts-comments">
          <h3 className="shorts-comments-title">
            {i18n.language === 'uz' ? 'Izohlar' : 'Комментарии'}
          </h3>

          <div
            className="shorts-comments-input-wrap"
            onClick={handleShortsInputClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleShortsInputClick()}
          >
            <input
              type="text"
              className="shorts-comments-input"
              placeholder={i18n.language === 'uz' ? 'Izoh yozing...' : 'Написать комментарий...'}
              value={shortsInputValue}
              onChange={(e) => setShortsInputValue(e.target.value)}
              onClick={(e) => { e.stopPropagation(); handleShortsInputClick(); }}
              readOnly
            />
            <button
              type="button"
              className="shorts-comments-send-btn"
              onClick={(e) => { e.stopPropagation(); handleShortsInputClick(); }}
              aria-label="Yuborish"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>

          <div className="shorts-comments-list">
            {displayedShortsComments.length === 0 ? (
              <p className="shorts-comments-empty">
                {i18n.language === 'uz' ? 'Komment bo\'sh' : 'Комментариев нет'}
              </p>
            ) : (
              displayedShortsComments.map((c) => renderShortsComment(c, false, true))
            )}
          </div>

          {hasMoreShorts && (
            <button
              type="button"
              className="shorts-comments-more-btn"
              onClick={() => setShowShortsCommentsModal(true)}
            >
              {moreShortsBtnText}
            </button>
          )}
        </div>
      )}

      {showShortsCommentsModal && createPortal(
        <>
          <div
            className="shorts-comments-modal-overlay"
            onClick={() => setShowShortsCommentsModal(false)}
          />
          <div
            className={`shorts-comments-modal ${dragY > 0 ? 'shorts-comments-modal-dragging' : ''}`}
            style={{ '--drag-y': `${dragY}px` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="shorts-comments-modal-header-wrap"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="shorts-comments-modal-drag-handle" />
              <div className="shorts-comments-modal-header">
                <button
                  className="shorts-comments-modal-close shorts-comments-modal-close-desktop"
                  onClick={() => setShowShortsCommentsModal(false)}
                  aria-label="Yopish"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                </button>
                <h3 className="shorts-comments-modal-title">
                  {i18n.language === 'uz' ? 'Izohlar' : 'Комментарии'}
                </h3>
              </div>
            </div>

            <div className="shorts-comments-modal-body" ref={shortsCommentsListRef}>
              {shortsComments.length === 0 ? (
                <p className="shorts-comments-modal-empty">
                  {i18n.language === 'uz' ? 'Komment bo\'sh' : 'Комментариев нет'}
                </p>
              ) : (
                shortsComments.map((c) => renderShortsComment(c, false, false))
              )}
            </div>

            <div className="shorts-comments-modal-footer">
              {replyingToShorts && (
                <div className="shorts-comments-replying-bar">
                  <span>{i18n.language === 'uz' ? 'Javob:' : 'Ответ:'} {replyingToShorts.authorName}</span>
                  <button type="button" className="shorts-comments-reply-cancel" onClick={() => setReplyingToShorts(null)} aria-label="Bekor qilish">×</button>
                </div>
              )}
              <ScrollTouch className="shorts-comments-modal-emoji-row">
                <button
                  type="button"
                  className="shorts-comments-emoji-btn shorts-comments-emoji-btn-img"
                  onClick={handleImageEmojiShortsClick}
                  aria-label="VL"
                >
                  <img src={VL_EMOJI_IMG} alt="VL" />
                </button>
                {EMOJI_LIST.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="shorts-comments-emoji-btn"
                    onClick={() => handleEmojiShortsClick(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </ScrollTouch>
              <form className="shorts-comments-modal-input-wrap" onSubmit={handleSubmitShortsComment}>
                <div className="shorts-comments-modal-avatar">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt="" className="profile-avatar-img" />
                  ) : (
                    <div className="shorts-comment-avatar-placeholder">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  className="shorts-comments-modal-input"
                  placeholder={replyingToShorts
                    ? (i18n.language === 'uz' ? `${replyingToShorts.authorName} ga javob...` : `Ответ ${replyingToShorts.authorName}...`)
                    : (i18n.language === 'uz' ? 'Izoh yozing...' : 'Написать комментарий...')}
                  value={shortsInputValue}
                  onChange={(e) => setShortsInputValue(e.target.value)}
                  autoFocus
                />
                <button
                  type="submit"
                  className="shorts-comments-modal-send-btn"
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

ShortsComments.displayName = 'ShortsComments';

export default ShortsComments;
