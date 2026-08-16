import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import ScrollTouch from '../ScrollTouch/ScrollTouch';
import * as commentsApi from '../../api/commentsApi';
import { useAuth } from '../../context/AuthContext';
import { requestOpenAuthModal } from '../../authModalBridge';
import { sortCommentListByLikes } from '../../algo/commentLikeSortAlgo';
import { formatActionCount } from '../../utils/utils';
import {
  isCommentsSheetViewport,
  useCommentsSheetViewport,
} from '../../hooks/useCommentsSheetViewport';
import './MovieComments.css';

const MOBILE_MAX = 900;
const PREVIEW_LIMIT_DEFAULT = 4;
const migrateComment = (c) => ({
  ...c,
  likes: c.likes ?? 0,
  replies: Array.isArray(c.replies) ? c.replies.map(migrateComment) : [],
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

/** Jami kommentlar soni (asosiy + barcha javoblar) */
const countTotalComments = (comments) => {
  return comments.reduce((sum, c) => sum + 1 + countTotalComments(c.replies || []), 0);
};

/** Tashqarida ko'rsatish uchun max limit */
const getDisplayedComments = (comments, limit = PREVIEW_LIMIT_DEFAULT) => {
  let count = 0;
  const takeFrom = (list) => {
    const out = [];
    for (const c of list) {
      if (count >= limit) break;
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
const CAROUSEL_MS = 4000;

/**
 * mobileSheetUi — klip/konsert/triller mobil UX:
 * komment yo‘q → input; bor → list (input yashirin), list bosilsa modal; more-btn yo‘q; titleda son.
 * Desktop o‘zgarmaydi.
 * targetType: movie | triller | klip | konsert (ixtiyoriy; movieId prefiksidan ham aniqlanadi)
 */
const MovieComments = forwardRef(
  (
    {
      movieId,
      targetType: targetTypeProp,
      onCountChange,
      previewLimit = PREVIEW_LIMIT_DEFAULT,
      mobileSheetUi = false,
    },
    ref
  ) => {
    const { i18n } = useTranslation();
    const { profile, isLoggedIn } = useAuth();
    const [comments, setComments] = useState([]);
    const [likedIds, setLikedIds] = useState(() => new Set());
    const [showCommentsModal, setShowCommentsModal] = useState(false);
    const [commentsModalOpen, setCommentsModalOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [dragY, setDragY] = useState(0);
    const [isMobile, setIsMobile] = useState(
      () => typeof window !== 'undefined' && window.innerWidth <= MOBILE_MAX
    );
    const [carouselIndex, setCarouselIndex] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const startYRef = useRef(0);
    const dragYRef = useRef(0);
    const commentsListRef = useRef(null);
    const modalInputRef = useRef(null);
    const modalClosingRef = useRef(false);
    const [isDraggingModal, setIsDraggingModal] = useState(false);
    const [isDismissingModal, setIsDismissingModal] = useState(false);

    const { sheetBottom, sheetHeight, keyboardOpen, onModalInputFocus, onModalInputBlur, canCloseFromOverlay } =
      useCommentsSheetViewport(showCommentsModal, '.movie-detail-comments-modal-body');

    const target = commentsApi.resolveCommentTarget(movieId, targetTypeProp);

    const sheetMobile = Boolean(mobileSheetUi) && isMobile;
    const limit = sheetMobile
      ? 1
      : Math.max(1, Number(previewLimit) || PREVIEW_LIMIT_DEFAULT);

    const requireAuth = useCallback(() => {
      if (isLoggedIn) return true;
      requestOpenAuthModal('register');
      return false;
    }, [isLoggedIn]);

    const reloadComments = useCallback(async () => {
      if (!target.targetId) {
        setComments([]);
        setLikedIds(new Set());
        return;
      }
      try {
        const raw = await commentsApi.fetchComments(target);
        const tree = sortCommentListByLikes(raw.map(migrateComment));
        setComments(tree);
        setLikedIds(collectLikedIds(tree));
      } catch {
        /* mavjud listni o‘chirmaymiz — tarmoq xatosida bo‘sh qilib yubormaslik */
      }
    }, [target.targetType, target.targetId]);

    useEffect(() => {
      const onResize = () => setIsMobile(window.innerWidth <= MOBILE_MAX);
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }, []);

    useEffect(() => {
      setReplyingTo(null);
      setInputValue('');
      modalClosingRef.current = false;
      setCommentsModalOpen(false);
      setShowCommentsModal(false);
      dragYRef.current = 0;
      setDragY(0);
      setIsDraggingModal(false);
      setIsDismissingModal(false);
      setSubmitError('');
      reloadComments();
    }, [movieId, targetTypeProp, reloadComments]);

    useEffect(() => {
      const mid = commentsApi.toMovieKey(movieId);
      const onRemote = (e) => {
        if (e.detail?.movieId !== mid) return;
        /* O‘zimiz create/like qilganimizda qayta GET qilmaymiz — sekinlik sababi */
        if (e.detail?.skipReload) return;
        reloadComments();
      };
      window.addEventListener(commentsApi.COMMENTS_CHANGED_EVENT, onRemote);
      return () => window.removeEventListener(commentsApi.COMMENTS_CHANGED_EVENT, onRemote);
    }, [movieId, reloadComments]);

    useEffect(() => {
      /* scroll lock hook ichida; desktop overflow */
      if (!showCommentsModal) return undefined;
      if (isCommentsSheetViewport()) return undefined;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }, [showCommentsModal]);

    /* Ochilish: keyingi frame da is-open — CSS slide-up ishlashi uchun */
    useEffect(() => {
      if (!showCommentsModal) return undefined;
      modalClosingRef.current = false;
      const id = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setCommentsModalOpen(true));
      });
      return () => window.cancelAnimationFrame(id);
    }, [showCommentsModal]);

    /* Yopilish timeout (transitionend ishlamasa) */
    useEffect(() => {
      if (!showCommentsModal || !modalClosingRef.current) return undefined;
      if (commentsModalOpen && !isDismissingModal) return undefined;
      const t = window.setTimeout(() => {
        modalClosingRef.current = false;
        setShowCommentsModal(false);
        setCommentsModalOpen(false);
        dragYRef.current = 0;
        setDragY(0);
        setIsDraggingModal(false);
        setIsDismissingModal(false);
      }, 500);
      return () => window.clearTimeout(t);
    }, [showCommentsModal, commentsModalOpen, isDismissingModal]);

    /* Desktop: modal ochilganda focus. Mobile: autoFocus yo‘q — klaviatura faqat input bosilganda */
    useEffect(() => {
      if (!showCommentsModal || !commentsModalOpen) return;
      if (isCommentsSheetViewport()) return;
      modalInputRef.current?.focus({ preventScroll: true });
    }, [showCommentsModal, commentsModalOpen]);

    /* Sheet mobile: kommentlar har 4s pastdan tepaga almashadi, oxirida qayta boshlanadi */
    useEffect(() => {
      setCarouselIndex(0);
    }, [movieId]);

    useEffect(() => {
      if (!sheetMobile || showCommentsModal || comments.length <= 1) return undefined;
      const timer = window.setInterval(() => {
        setCarouselIndex((i) => (i + 1) % comments.length);
      }, CAROUSEL_MS);
      return () => window.clearInterval(timer);
    }, [sheetMobile, showCommentsModal, comments.length, movieId]);

    useEffect(() => {
      if (comments.length === 0) {
        setCarouselIndex(0);
        return;
      }
      setCarouselIndex((i) => (i >= comments.length ? 0 : i));
    }, [comments.length]);

    const handleToggleLike = async (commentId) => {
      if (!requireAuth()) return;
      try {
        const data = await commentsApi.toggleCommentLikeRequest(commentId);
        const likes = data?.likes ?? 0;
        const liked = Boolean(data?.liked);
        setComments((prev) =>
          sortCommentListByLikes(updateLikesInTree(prev, commentId, likes, liked))
        );
        setLikedIds((prev) => {
          const next = new Set(prev);
          if (liked) next.add(String(commentId));
          else next.delete(String(commentId));
          return next;
        });
        commentsApi.dispatchMovieCommentsChanged(movieId, {
          ...target,
          skipReload: true,
        });
      } catch {
        /* ignore */
      }
    };

    const handleSubmitComment = async (e) => {
      e?.preventDefault();
      const text = inputValue.trim();
      if (!text || submitting) return;
      if (!requireAuth()) return;
      if (!target.targetId) return;

      setSubmitting(true);
      setSubmitError('');
      try {
        const data = await commentsApi.createCommentRequest({
          targetType: target.targetType,
          targetId: target.targetId,
          text,
          parentId: replyingTo ? replyingTo.id : null,
        });
        const item = data?.item ? migrateComment(data.item) : null;
        if (item) {
          if (replyingTo) {
            setComments((prev) =>
              sortCommentListByLikes(insertReplyInTree(prev, replyingTo.id, item))
            );
            setReplyingTo(null);
          } else {
            setComments((prev) => sortCommentListByLikes([item, ...prev]));
          }
        } else {
          await reloadComments();
        }
        setInputValue('');
        commentsApi.dispatchMovieCommentsChanged(movieId, {
          ...target,
          skipReload: true,
        });
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

    const handleReplyClick = (comment) => {
      if (!requireAuth()) return;
      setReplyingTo(comment);
    };

    const handleEmojiClick = (emoji) => {
      setInputValue((prev) => prev + emoji);
    };

    const handleImageEmojiClick = () => {
      setInputValue((prev) => prev + ' VL');
    };

    const openModal = useCallback(() => {
      /* Preview input focus bo‘lib klaviatura ochilmasin */
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      modalClosingRef.current = false;
      dragYRef.current = 0;
      setDragY(0);
      setIsDraggingModal(false);
      setIsDismissingModal(false);
      if (showCommentsModal) {
        setCommentsModalOpen(true);
        return;
      }
      setCommentsModalOpen(false);
      setShowCommentsModal(true);
    }, [showCommentsModal]);

    const closeModal = useCallback(() => {
      if (!showCommentsModal || modalClosingRef.current) return;
      modalClosingRef.current = true;
      setIsDraggingModal(false);
      setIsDismissingModal(true);
      setCommentsModalOpen(false);
    }, [showCommentsModal]);

    const finishCloseModal = () => {
      if (!modalClosingRef.current) return;
      modalClosingRef.current = false;
      setShowCommentsModal(false);
      setCommentsModalOpen(false);
      dragYRef.current = 0;
      setDragY(0);
      setIsDraggingModal(false);
      setIsDismissingModal(false);
    };

    const handleModalTransitionEnd = (e) => {
      if (e.target !== e.currentTarget) return;
      if (e.propertyName !== 'transform' && e.propertyName !== 'opacity') return;
      finishCloseModal();
    };

    const handleTouchStart = (e) => {
      if (modalClosingRef.current) return;
      startYRef.current = e.touches[0].clientY;
      dragYRef.current = 0;
      setIsDraggingModal(true);
    };

    const handleTouchMove = (e) => {
      if (window.innerWidth > 768 || modalClosingRef.current) return;
      const diff = Math.max(0, e.touches[0].clientY - startYRef.current);
      dragYRef.current = diff;
      setDragY(diff);
    };

    const handleTouchEnd = () => {
      if (window.innerWidth > 768 || modalClosingRef.current) return;
      const y = dragYRef.current;
      setIsDraggingModal(false);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          if (y > 80) {
            /* is-open saqlanadi — dragY pastga silliq davom etadi */
            modalClosingRef.current = true;
            setIsDismissingModal(true);
            const dismissY = Math.max(window.innerHeight, y + 24);
            dragYRef.current = dismissY;
            setDragY(dismissY);
          } else {
            dragYRef.current = 0;
            setDragY(0);
          }
        });
      });
    };

    const displayedComments = getDisplayedComments(comments, limit);
    const totalCount = countTotalComments(comments);
    const hasComments = totalCount > 0;
    const hasMore = totalCount > limit;

    const showInlineInput = !sheetMobile || !hasComments;
    const showPreviewList = !sheetMobile || hasComments;
    const showMoreBtn = !sheetMobile && hasMore;

    const carouselSafeIndex =
      comments.length > 0 ? carouselIndex % comments.length : 0;
    const carouselComment = comments[carouselSafeIndex]
      ? { ...comments[carouselSafeIndex], replies: [] }
      : null;

    useImperativeHandle(ref, () => ({ openModal }), [openModal]);
    useEffect(() => {
      onCountChange?.(totalCount);
    }, [totalCount, onCountChange]);

    const moreBtnText =
      i18n.language === 'uz' ? `Ko'proq (${totalCount})` : `Ещё (${totalCount})`;

    const renderComment = (c, isReply = false, isPreview = false) => (
      <div
        key={c.id}
        className={`movie-detail-comment-item ${isReply ? 'movie-detail-comment-reply' : ''} ${
          !isPreview ? 'movie-detail-comment-item-modal' : ''
        }`}
      >
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
                onClick={(e) => {
                  e.stopPropagation();
                  handleReplyClick(c);
                  if (isPreview) openModal();
                }}
                aria-label="Javob"
              >
                {i18n.language === 'uz' ? 'Javob' : 'Ответить'}
              </button>
            </div>
          </div>
          <div
            className={`movie-detail-comment-like-wrap ${likedIds.has(String(c.id)) ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              handleToggleLike(String(c.id));
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(ev) => ev.key === 'Enter' && handleToggleLike(String(c.id))}
            aria-label="Like"
          >
            <button type="button" className="movie-detail-comment-like-btn">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill={likedIds.has(String(c.id)) ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
            {(c.likes || 0) > 0 && (
              <span className="movie-detail-comment-like-count">
                {formatActionCount(c.likes)}
              </span>
            )}
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
        <div
          className={`movie-detail-comments${sheetMobile ? ' movie-detail-comments--sheet-mobile' : ''}`}
        >
          <h3 className="movie-detail-comments-title">
            <span className="movie-detail-comments-title-text">
              {i18n.language === 'uz' ? 'Izohlar' : 'Комментарии'}
            </span>
            {sheetMobile ? (
              <span className="movie-detail-comments-count">{totalCount}</span>
            ) : null}
          </h3>

          {showInlineInput ? (
            <div
              className="movie-detail-comments-input-wrap"
              onClick={openModal}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && openModal()}
            >
              <input
                type="text"
                className="movie-detail-comments-input"
                placeholder={
                  i18n.language === 'uz' ? 'Izoh yozing...' : 'Написать комментарий...'
                }
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onClick={(e) => {
                  e.stopPropagation();
                  openModal();
                }}
                onFocus={(e) => {
                  e.target.blur();
                  openModal();
                }}
                readOnly
                inputMode="none"
                tabIndex={-1}
              />
              <button
                type="button"
                className="movie-detail-comments-send-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  openModal();
                }}
                aria-label="Yuborish"
              >
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
              </button>
            </div>
          ) : null}

          {showPreviewList ? (
            <div
              className={`movie-detail-comments-list${
                sheetMobile && hasComments ? ' movie-detail-comments-list--open-modal' : ''
              }${sheetMobile && hasComments ? ' movie-detail-comments-carousel' : ''}`}
              onClick={sheetMobile && hasComments ? openModal : undefined}
              onKeyDown={
                sheetMobile && hasComments
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openModal();
                      }
                    }
                  : undefined
              }
              role={sheetMobile && hasComments ? 'button' : undefined}
              tabIndex={sheetMobile && hasComments ? 0 : undefined}
            >
              {!sheetMobile && displayedComments.length === 0 ? (
                <p className="movie-detail-comments-empty">
                  {i18n.language === 'uz' ? "Komment bo'sh" : 'Комментариев нет'}
                </p>
              ) : sheetMobile && carouselComment ? (
                <div
                  key={`${carouselComment.id}-${carouselSafeIndex}`}
                  className="movie-detail-comments-carousel-slide"
                >
                  {renderComment(carouselComment, false, true)}
                </div>
              ) : (
                displayedComments.map((c) => renderComment(c, false, true))
              )}
            </div>
          ) : null}

          {showMoreBtn ? (
            <button
              type="button"
              className="movie-detail-comments-more-btn"
              onClick={openModal}
            >
              {moreBtnText}
            </button>
          ) : null}
        </div>

        {showCommentsModal &&
          createPortal(
            <>
              <div
                className={`movie-detail-comments-modal-overlay${
                  commentsModalOpen && !isDismissingModal ? ' is-open' : ''
                }`}
                onClick={() => {
                  if (!canCloseFromOverlay()) return;
                  closeModal();
                }}
              />
              <div
                className={`movie-detail-comments-modal${
                  commentsModalOpen ? ' is-open' : ''
                }${isDraggingModal ? ' movie-detail-comments-modal-dragging' : ''}${
                  keyboardOpen ? ' movie-detail-comments-modal--keyboard' : ''
                }`}
                style={{
                  '--drag-y': `${dragY}px`,
                  '--sheet-bottom': `${sheetBottom}px`,
                  '--sheet-height': sheetHeight > 0 ? `${sheetHeight}px` : '84dvh',
                }}
                onClick={(e) => e.stopPropagation()}
                onTransitionEnd={handleModalTransitionEnd}
              >
                <div
                  className="movie-detail-comments-modal-header-wrap"
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <div className="movie-detail-comments-modal-drag-handle" />
                </div>

                <div className="movie-detail-comments-modal-body" ref={commentsListRef}>
                  {comments.length === 0 ? (
                    <p className="movie-detail-comments-modal-empty">
                      {i18n.language === 'uz' ? "Komment bo'sh" : 'Комментариев нет'}
                    </p>
                  ) : (
                    comments.map((c) => renderComment(c, false, false))
                  )}
                </div>

                <div className="movie-detail-comments-modal-footer">
                  {replyingTo && (
                    <div className="movie-detail-comments-replying-bar">
                      <span>
                        {i18n.language === 'uz' ? 'Javob:' : 'Ответ:'} {replyingTo.authorName}
                      </span>
                      <button
                        type="button"
                        className="movie-detail-comments-reply-cancel"
                        onClick={() => setReplyingTo(null)}
                        aria-label="Bekor qilish"
                      >
                        ×
                      </button>
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
                  <form
                    className="movie-detail-comments-modal-input-wrap"
                    onSubmit={handleSubmitComment}
                  >
                    <div className="movie-detail-comments-modal-avatar">
                      {profile?.avatar ? (
                        <img src={profile.avatar} alt="" className="profile-avatar-img" />
                      ) : (
                        <div className="movie-detail-comment-avatar-placeholder">
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <input
                      ref={modalInputRef}
                      type="text"
                      className="movie-detail-comments-modal-input"
                      placeholder={
                        replyingTo
                          ? i18n.language === 'uz'
                            ? `${replyingTo.authorName} ga javob...`
                            : `Ответ ${replyingTo.authorName}...`
                          : i18n.language === 'uz'
                            ? 'Izoh yozing...'
                            : 'Написать комментарий...'
                      }
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onFocus={() => {
                        onModalInputFocus();
                      }}
                      onBlur={() => {
                        onModalInputBlur();
                      }}
                    />
                    <button
                      type="submit"
                      className={`movie-detail-comments-modal-send-btn${
                        submitting ? ' is-loading' : ''
                      }`}
                      aria-label="Yuborish"
                      disabled={submitting}
                      aria-busy={submitting || undefined}
                    >
                      {submitting ? (
                        <span className="movie-detail-comments-modal-send-loader" aria-hidden />
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
                    <p className="movie-detail-comments-modal-submit-error">{submitError}</p>
                  ) : null}
                </div>
              </div>
            </>,
            document.body
          )}
      </>
    );
  }
);

MovieComments.displayName = 'MovieComments';

export default MovieComments;
