import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import ShareButton from '../../components/ShareButton/ShareButton';
import { createMixShare } from '../../api/musicMixApi';
import { resolveApiBaseUrl } from '../../api/apiBase';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { useNarrowLayout } from './MusicDetailMixSheet';
import './MusicMixMoreSheet.css';

const CLOSE_RATIO = 0.3;
const DRAG_START_PX = 10;
const MOTION_MS = 480;

/**
 * Mix ⋯ menyusi.
 * Desktop: o‘rtadan. Mobil: pastdan, pastga ~30% tortilsa yopiladi.
 * Share: POST /share → ?ms=token (qabul qiluvchi bazasiga yozilmaydi).
 */
const mixContentType = (value) => {
  const type = String(value || 'music').trim().toLowerCase();
  if (type === 'clip' || type === 'klip') return 'klip';
  return 'music';
};

const MusicMixMoreSheet = ({
  open,
  onClose,
  label,
  musicId,
  mixGenre,
  contentType = 'music',
  existingShareToken = '',
  existingShareCover = '',
}) => {
  const { t } = useTranslation();
  const { isLoggedIn } = useAuth();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const mixType = mixContentType(contentType);
  const wishlistId = mixGenre ? `${mixType}:${mixGenre}` : '';
  const saved = Boolean(wishlistId) && isInWishlist(wishlistId, 'mix');
  const narrow = useNarrowLayout();
  const canShare = Boolean(isLoggedIn);
  const panelRef = useRef(null);
  const dragRef = useRef(null);
  const closeTimerRef = useRef(null);
  const ignoreClickUntilRef = useRef(0);
  const [present, setPresent] = useState(false);
  const [entered, setEntered] = useState(false);
  const [closing, setClosing] = useState(false);
  const [dragY, setDragY] = useState(null);
  const [pressed, setPressed] = useState(false);
  const [shareMeta, setShareMeta] = useState(null);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareFailed, setShareFailed] = useState(false);

  const title = t('music.mixGenreLine', {
    genre: label,
    defaultValue: '{{genre}} janerdagi mixlar',
  });

  const fallbackToken = String(existingShareToken || '').trim();
  const leadId = shareMeta?.leadId || musicId;
  const coverImg = String(shareMeta?.coverImg || existingShareCover || '').trim();
  const activeToken = String(shareMeta?.token || fallbackToken || '').trim();
  const sharePath =
    activeToken && leadId != null && leadId !== ''
      ? `${mixType === 'klip' ? `/music/video/${leadId}` : `/music/${leadId}`}?ms=${encodeURIComponent(activeToken)}`
      : '';
  const shareCardUrl = activeToken
    ? `${resolveApiBaseUrl()}/music/mixes/share/${encodeURIComponent(activeToken)}/card`
    : '';

  useEffect(() => {
    if (!open) {
      setShareMeta(null);
      setShareBusy(false);
      setShareFailed(false);
      return undefined;
    }

    // Mehmon: share token serverda — createMixShare chaqirilmaydi
    if (!canShare) {
      setShareMeta(null);
      setShareBusy(false);
      setShareFailed(false);
      return undefined;
    }

    const applyFallback = () => {
      if (!fallbackToken) {
        setShareMeta(null);
        setShareFailed(true);
        return;
      }
      setShareFailed(false);
      setShareMeta({
        token: fallbackToken,
        leadId: String(musicId || '').trim(),
        coverImg: String(existingShareCover || '').trim(),
      });
    };

    if (!mixGenre) {
      applyFallback();
      setShareBusy(false);
      return undefined;
    }

    let cancelled = false;
    setShareBusy(true);
    setShareFailed(false);
    setShareMeta(null);
    createMixShare({ genre: mixGenre, contentType: mixType })
      .then((data) => {
        if (cancelled) return;
        if (!data?.token) {
          applyFallback();
          return;
        }
        setShareFailed(false);
        setShareMeta({
          token: String(data.token),
          leadId: String(data.leadId || musicId || '').trim(),
          coverImg: String(data.coverImg || existingShareCover || '').trim(),
        });
      })
      .catch(() => {
        if (!cancelled) applyFallback();
      })
      .finally(() => {
        if (!cancelled) setShareBusy(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, canShare, mixGenre, mixType, musicId, fallbackToken, existingShareCover]);

  const finishClose = () => {
    setClosing(false);
    setEntered(false);
    setPresent(false);
    setDragY(null);
    setPressed(false);
    onClose?.();
  };

  const requestClose = () => {
    if (closing) return;
    setPressed(false);
    setDragY(null);
    setClosing(true);
    setEntered(false);
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(finishClose, MOTION_MS);
  };

  useEffect(() => () => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    ignoreClickUntilRef.current = 0;
    setClosing(false);
    setEntered(false);
    setDragY(null);
    setPressed(false);
    setShareMeta(null);
    setShareFailed(false);
    setShareBusy(canShare);
    setPresent(true);
  }, [open, canShare]);

  useEffect(() => {
    if (!open || !present) return undefined;
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true));
    });
    return () => cancelAnimationFrame(frame);
  }, [open, present]);

  useEffect(() => {
    if (!present) return undefined;
    const root = document.documentElement;
    root.classList.add('music-mix-more-open');
    document.body.classList.add('music-mix-more-open');
    return () => {
      root.classList.remove('music-mix-more-open');
      document.body.classList.remove('music-mix-more-open');
    };
  }, [present]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') requestClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, narrow, closing]);

  const onSheetDown = (event) => {
    if (!narrow || closing || event.button > 0) return;
    if (event.target?.closest?.('.share-modal-overlay, .share-modal-content')) return;
    const startY = event.clientY;
    const pointerId = event.pointerId;
    dragRef.current = { y: startY, id: pointerId, dragging: false };

    const onMove = (moveEvent) => {
      if (moveEvent.pointerId !== pointerId) return;
      const dy = moveEvent.clientY - startY;
      if (dy < DRAG_START_PX) return;
      if (!dragRef.current?.dragging) {
        dragRef.current.dragging = true;
        try {
          panelRef.current?.setPointerCapture?.(pointerId);
        } catch {
          /* barmoq allaqachon qo‘yib yuborilgan bo‘lishi mumkin */
        }
        setPressed(true);
      }
      setDragY(dy);
      moveEvent.preventDefault();
    };
    const onUp = (upEvent) => {
      if (upEvent.pointerId !== pointerId) return;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      const traveled = Math.max(0, upEvent.clientY - startY);
      const wasDragging = Boolean(dragRef.current?.dragging);
      dragRef.current = null;
      if (wasDragging) ignoreClickUntilRef.current = Date.now() + 450;
      if (!wasDragging) return;
      const height = panelRef.current?.offsetHeight || 240;
      setPressed(false);
      if (traveled >= height * CLOSE_RATIO) {
        requestAnimationFrame(() => {
          setDragY(null);
          setClosing(true);
          setEntered(false);
          if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
          closeTimerRef.current = window.setTimeout(finishClose, MOTION_MS);
        });
        return;
      }
      requestAnimationFrame(() => setDragY(null));
    };
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  const ignoreGhostClick = (event) => {
    if (Date.now() >= ignoreClickUntilRef.current) return;
    event.preventDefault();
    event.stopPropagation();
  };

  if ((!open && !closing && !present) || typeof document === 'undefined') return null;

  const panelStyle = dragY != null ? { transform: `translateY(${dragY}px)` } : undefined;
  const shareReady = Boolean(sharePath);
  // Desktop center panel opacity 0→1 (~480ms): API tez bo'lsa loading ko'rinmasdan o'tib ketardi.
  // Modal ochilishi tugaguncha yuklanmoqda qoladi.
  // Mehmon: share yo'q — faqat Saqlash (entered dan keyin).
  const showActions = canShare
    ? shareReady && !shareBusy && (entered || closing)
    : entered || closing;

  return createPortal(
    <div
      className={[
        'music-mix-more-overlay',
        entered && !closing ? 'is-open' : '',
        closing ? 'is-closing' : '',
      ].filter(Boolean).join(' ')}
      onClick={(event) => {
        if (document.body.dataset.mixShareGuard) return;
        if (document.querySelector('.share-modal-overlay')) return;
        ignoreGhostClick(event);
        if (event.defaultPrevented) return;
        requestClose();
      }}
    >
      <div
        ref={panelRef}
        className={[
          'music-mix-more-panel',
          narrow ? 'is-sheet' : 'is-center',
          pressed ? 'is-dragging' : '',
        ].filter(Boolean).join(' ')}
        style={panelStyle}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onPointerDown={narrow ? onSheetDown : undefined}
        onClickCapture={ignoreGhostClick}
        onClick={(event) => event.stopPropagation()}
      >
        {narrow && (
          <div
            className="music-mix-more-grip"
            role="separator"
            aria-orientation="horizontal"
          >
            <span />
          </div>
        )}
        {!narrow && (
          <button
            type="button"
            className="music-mix-more-close"
            aria-label={t('common.close', 'Yopish')}
            onClick={requestClose}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                d="M18 6L6 18M6 6l12 12"
              />
            </svg>
          </button>
        )}
        <div className="music-mix-more-actions">
          {!showActions ? (
            <p className="music-mix-more-loading" aria-live="polite" aria-busy={!shareFailed || undefined}>
              {shareFailed && !shareBusy
                ? t('music.mixShareUnavailable', 'Ulashish hozir mumkin emas')
                : t('music.mixShareLoading', 'Yuklanmoqda…')}
            </p>
          ) : (
            <>
              {canShare ? (
                <ShareButton
                  movie={{ id: leadId, title, img: coverImg }}
                  sharePath={sharePath}
                  absoluteUrl={shareCardUrl || undefined}
                  dropdownInPortal
                  icon="send"
                  label={t('music.mixSharePlaylist', 'Playlistni ulashish')}
                  className="music-mix-more-share"
                  buttonClassName="music-mix-more-action"
                />
              ) : null}
              <button
                type="button"
                className={`music-mix-more-action music-mix-more-save${saved ? ' is-saved' : ''}`}
                aria-pressed={saved}
                onClick={() => {
                  if (!wishlistId) return;
                  toggleWishlist(wishlistId, 'mix');
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill={saved ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
                  />
                </svg>
                <span>{t('music.mixSave', 'Saqlash')}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default MusicMixMoreSheet;
