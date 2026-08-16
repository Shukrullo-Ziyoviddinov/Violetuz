import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import ScrollTouch from '../ScrollTouch/ScrollTouch';
import * as shortsCommentsApi from '../../api/shortsCommentsApi';
import { useAuth } from '../../context/AuthContext';
import { requestOpenAuthModal } from '../../authModalBridge';
import { formatActionCount } from '../../utils/utils';
import { sortCommentListByLikes } from '../../algo/commentLikeSortAlgo';
import './ShortsComments.css';

const migrateShortsComment = (c) => ({
  ...c,
  likes: c.likes ?? 0,
  replies: Array.isArray(c.replies) ? c.replies.map(migrateShortsComment) : [],
});

const collectLikedIds = (list, acc = new Set()) => {
  if (!Array.isArray(list)) return acc;
  for (const c of list) {
    if (c?.likedByMe) acc.add(String(c.id));
    if (c?.replies?.length) collectLikedIds(c.replies, acc);
  }
  return acc;
};

const updateLikesInTree = (list, commentId, likes, likedByMe) =>
  list.map((c) => {
    if (String(c.id) === String(commentId)) {
      return { ...c, likes, likedByMe };
    }
    if (c.replies?.length) {
      return {
        ...c,
        replies: updateLikesInTree(c.replies, commentId, likes, likedByMe),
      };
    }
    return c;
  });

const insertReplyInTree = (list, parentId, reply) =>
  list.map((c) => {
    if (String(c.id) === String(parentId)) {
      return { ...c, replies: [...(c.replies || []), reply] };
    }
    if (c.replies?.length) {
      return { ...c, replies: insertReplyInTree(c.replies, parentId, reply) };
    }
    return c;
  });

const PREVIEW_LIMIT = 4;
const COMMENTS_SHEET_MQ = '(max-width: 768px)';

const isCommentsSheetViewport = () =>
  typeof window !== 'undefined' && window.matchMedia(COMMENTS_SHEET_MQ).matches;

const countTotalShortsComments = (comments) =>
  comments.reduce((sum, c) => sum + 1 + countTotalShortsComments(c.replies || []), 0);

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

const ShortsComments = forwardRef(({ shortsId, targetType, onCountChange, compact }, ref) => {
  const { i18n } = useTranslation();
  const { profile, isLoggedIn } = useAuth();
  const [shortsComments, setShortsComments] = useState([]);
  const [likedShortsIds, setLikedShortsIds] = useState(() => new Set());
  const [showShortsCommentsModal, setShowShortsCommentsModal] = useState(false);
  const [shortsModalOpen, setShortsModalOpen] = useState(false);
  const [shortsInputValue, setShortsInputValue] = useState('');
  const [replyingToShorts, setReplyingToShorts] = useState(null);
  const [dragY, setDragY] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [keyboardInset, setKeyboardInset] = useState(0);
  const startYRef = useRef(0);
  const shortsCommentsListRef = useRef(null);
  const modalInputRef = useRef(null);
  const modalClosingRef = useRef(false);

  const requireAuth = useCallback(() => {
    if (isLoggedIn) return true;
    requestOpenAuthModal('register');
    return false;
  }, [isLoggedIn]);

  const reloadComments = useCallback(async () => {
    if (shortsId == null) {
      setShortsComments([]);
      setLikedShortsIds(new Set());
      return;
    }
    try {
      const raw = await shortsCommentsApi.getComments(shortsId, targetType);
      const tree = sortCommentListByLikes(raw.map(migrateShortsComment));
      setShortsComments(tree);
      setLikedShortsIds(collectLikedIds(tree));
    } catch {
      /* listni o‘chirmaymiz */
    }
  }, [shortsId, targetType]);

  useEffect(() => {
    setReplyingToShorts(null);
    setShortsInputValue('');
    modalClosingRef.current = false;
    setShortsModalOpen(false);
    setShowShortsCommentsModal(false);
    setDragY(0);
    setSubmitError('');
    reloadComments();
  }, [shortsId, targetType, reloadComments]);

  useEffect(() => {
    const sid = shortsCommentsApi.toShortsKey(shortsId);
    const onRemote = (e) => {
      if (e.detail?.shortsId !== sid) return;
      if (e.detail?.skipReload) return;
      reloadComments();
    };
    window.addEventListener(shortsCommentsApi.SHORTS_COMMENTS_CHANGED_EVENT, onRemote);
    return () =>
      window.removeEventListener(shortsCommentsApi.SHORTS_COMMENTS_CHANGED_EVENT, onRemote);
  }, [shortsId, reloadComments]);

  useEffect(() => {
    if (showShortsCommentsModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setKeyboardInset(0);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showShortsCommentsModal]);

  useEffect(() => {
    if (!showShortsCommentsModal) return undefined;
    modalClosingRef.current = false;
    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setShortsModalOpen(true));
    });
    return () => window.cancelAnimationFrame(id);
  }, [showShortsCommentsModal]);

  useEffect(() => {
    if (!showShortsCommentsModal || shortsModalOpen || !modalClosingRef.current) return undefined;
    const t = window.setTimeout(() => {
      modalClosingRef.current = false;
      setShowShortsCommentsModal(false);
      setDragY(0);
      setKeyboardInset(0);
    }, 420);
    return () => window.clearTimeout(t);
  }, [showShortsCommentsModal, shortsModalOpen]);

  useEffect(() => {
    if (!showShortsCommentsModal || !shortsModalOpen) return;
    if (isCommentsSheetViewport()) return;
    modalInputRef.current?.focus();
  }, [showShortsCommentsModal, shortsModalOpen]);

  useEffect(() => {
    if (!showShortsCommentsModal) return undefined;
    const vv = window.visualViewport;
    if (!vv) return undefined;

    const update = () => {
      if (!isCommentsSheetViewport()) {
        setKeyboardInset(0);
        return;
      }
      const inset = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
      setKeyboardInset(inset);
    };

    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, [showShortsCommentsModal]);

  const handleToggleLike = async (commentId) => {
    if (!requireAuth()) return;
    try {
      const data = await shortsCommentsApi.toggleShortsCommentLikeRequest(commentId);
      const likes = data?.likes ?? 0;
      const liked = Boolean(data?.liked);
      setShortsComments((prev) =>
        sortCommentListByLikes(updateLikesInTree(prev, commentId, likes, liked))
      );
      setLikedShortsIds((prev) => {
        const next = new Set(prev);
        if (liked) next.add(String(commentId));
        else next.delete(String(commentId));
        return next;
      });
      shortsCommentsApi.dispatchShortsCommentsChanged(shortsId, { skipReload: true });
    } catch {
      /* ignore */
    }
  };

  const handleSubmitShortsComment = async (e) => {
    e?.preventDefault();
    const text = shortsInputValue.trim();
    if (!text || submitting) return;
    if (!requireAuth()) return;

    setSubmitting(true);
    setSubmitError('');
    try {
      const data = await shortsCommentsApi.createShortsCommentRequest({
        shortsId,
        text,
        parentId: replyingToShorts ? replyingToShorts.id : null,
        targetTypeHint: targetType,
      });
      const item = data?.item ? migrateShortsComment(data.item) : null;
      if (item) {
        if (replyingToShorts) {
          setShortsComments((prev) =>
            sortCommentListByLikes(insertReplyInTree(prev, replyingToShorts.id, item))
          );
          setReplyingToShorts(null);
        } else {
          setShortsComments((prev) => sortCommentListByLikes([item, ...prev]));
        }
      } else {
        await reloadComments();
      }
      setShortsInputValue('');
      shortsCommentsApi.dispatchShortsCommentsChanged(shortsId, { skipReload: true });
    } catch (err) {
      setSubmitError(
        err?.message ||
          (i18n.language === 'uz'
            ? 'Komment yuborilmadi. Qayta urinib ko‘ring.'
            : 'Не удалось отправить комментарий.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplyShortsClick = (comment) => {
    if (!requireAuth()) return;
    setReplyingToShorts(comment);
  };

  const handleEmojiShortsClick = (emoji) => {
    setShortsInputValue((prev) => prev + emoji);
  };

  const handleImageEmojiShortsClick = () => {
    setShortsInputValue((prev) => prev + ' VL');
  };

  const openShortsModal = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    modalClosingRef.current = false;
    setDragY(0);
    if (showShortsCommentsModal) {
      setShortsModalOpen(true);
      return;
    }
    setShortsModalOpen(false);
    setShowShortsCommentsModal(true);
  }, [showShortsCommentsModal]);

  const closeShortsModal = useCallback(() => {
    if (!showShortsCommentsModal || modalClosingRef.current) return;
    modalClosingRef.current = true;
    setShortsModalOpen(false);
  }, [showShortsCommentsModal]);

  const handleModalTransitionEnd = (e) => {
    if (e.target !== e.currentTarget) return;
    if (e.propertyName !== 'transform' && e.propertyName !== 'opacity') return;
    if (!modalClosingRef.current) return;
    modalClosingRef.current = false;
    setShowShortsCommentsModal(false);
    setDragY(0);
    setKeyboardInset(0);
  };

  const handleShortsInputClick = () => {
    openShortsModal();
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
    if (dragY > 80) {
      closeShortsModal();
      return;
    }
    setDragY(0);
  };

  const displayedShortsComments = getDisplayedShortsComments(shortsComments);
  const totalShortsCount = countTotalShortsComments(shortsComments);
  const hasMoreShorts = totalShortsCount > PREVIEW_LIMIT;

  useImperativeHandle(
    ref,
    () => ({
      openShortsModal,
    }),
    [openShortsModal]
  );

  useEffect(() => {
    onCountChange?.(totalShortsCount);
  }, [totalShortsCount, onCountChange]);

  const moreShortsBtnText =
    i18n.language === 'uz'
      ? `Ko'proq (${totalShortsCount})`
      : `Ещё (${totalShortsCount})`;

  const renderShortsComment = (c, isReply = false, isPreview = false) => (
    <div
      key={c.id}
      className={`shorts-comment-item ${isReply ? 'shorts-comment-reply' : ''} ${
        !isPreview ? 'shorts-comment-item-modal' : ''
      }`}
    >
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
              onClick={(e) => {
                e.stopPropagation();
                handleReplyShortsClick(c);
                if (isPreview) handleShortsInputClick();
              }}
              aria-label="Javob"
            >
              {i18n.language === 'uz' ? 'Javob' : 'Ответить'}
            </button>
          </div>
        </div>
        <div
          className={`shorts-comment-like-wrap ${likedShortsIds.has(String(c.id)) ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            handleToggleLike(String(c.id));
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(ev) => ev.key === 'Enter' && handleToggleLike(String(c.id))}
          aria-label="Like"
        >
          <button type="button" className="shorts-comment-like-btn">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill={likedShortsIds.has(String(c.id)) ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
          {(c.likes || 0) > 0 && (
            <span className="shorts-comment-like-count">{formatActionCount(c.likes)}</span>
          )}
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
              onClick={(e) => {
                e.stopPropagation();
                handleShortsInputClick();
              }}
              onFocus={(e) => {
                e.target.blur();
                handleShortsInputClick();
              }}
              readOnly
              inputMode="none"
              tabIndex={-1}
            />
            <button
              type="button"
              className="shorts-comments-send-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleShortsInputClick();
              }}
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
                {i18n.language === 'uz' ? "Komment bo'sh" : 'Комментариев нет'}
              </p>
            ) : (
              displayedShortsComments.map((c) => renderShortsComment(c, false, true))
            )}
          </div>

          {hasMoreShorts && (
            <button
              type="button"
              className="shorts-comments-more-btn"
              onClick={openShortsModal}
            >
              {moreShortsBtnText}
            </button>
          )}
        </div>
      )}

      {showShortsCommentsModal &&
        createPortal(
          <>
            <div
              className={`shorts-comments-modal-overlay${shortsModalOpen ? ' is-open' : ''}`}
              onClick={closeShortsModal}
            />
            <div
              className={`shorts-comments-modal${shortsModalOpen ? ' is-open' : ''}${
                dragY > 0 ? ' shorts-comments-modal-dragging' : ''
              }${keyboardInset > 0 ? ' shorts-comments-modal--keyboard' : ''}`}
              style={{
                '--drag-y': `${dragY}px`,
                '--keyboard-inset': `${keyboardInset}px`,
              }}
              onClick={(e) => e.stopPropagation()}
              onTransitionEnd={handleModalTransitionEnd}
            >
              <div
                className="shorts-comments-modal-header-wrap"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div className="shorts-comments-modal-drag-handle" />
              </div>

              <div className="shorts-comments-modal-body" ref={shortsCommentsListRef}>
                {shortsComments.length === 0 ? (
                  <p className="shorts-comments-modal-empty">
                    {i18n.language === 'uz' ? "Komment bo'sh" : 'Комментариев нет'}
                  </p>
                ) : (
                  shortsComments.map((c) => renderShortsComment(c, false, false))
                )}
              </div>

              <div className="shorts-comments-modal-footer">
                {replyingToShorts && (
                  <div className="shorts-comments-replying-bar">
                    <span>
                      {i18n.language === 'uz' ? 'Javob:' : 'Ответ:'} {replyingToShorts.authorName}
                    </span>
                    <button
                      type="button"
                      className="shorts-comments-reply-cancel"
                      onClick={() => setReplyingToShorts(null)}
                      aria-label="Bekor qilish"
                    >
                      ×
                    </button>
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
                    {profile?.avatar ? (
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
                    ref={modalInputRef}
                    type="text"
                    className="shorts-comments-modal-input"
                    placeholder={
                      replyingToShorts
                        ? i18n.language === 'uz'
                          ? `${replyingToShorts.authorName} ga javob...`
                          : `Ответ ${replyingToShorts.authorName}...`
                        : i18n.language === 'uz'
                          ? 'Izoh yozing...'
                          : 'Написать комментарий...'
                    }
                    value={shortsInputValue}
                    onChange={(e) => setShortsInputValue(e.target.value)}
                  />
                  <button
                    type="submit"
                    className={`shorts-comments-modal-send-btn${
                      submitting ? ' is-loading' : ''
                    }`}
                    aria-label="Yuborish"
                    disabled={submitting}
                    aria-busy={submitting || undefined}
                  >
                    {submitting ? (
                      <span className="shorts-comments-modal-send-loader" aria-hidden />
                    ) : (
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    )}
                  </button>
                </form>
                {submitError ? (
                  <p className="shorts-comments-modal-submit-error">{submitError}</p>
                ) : null}
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
