import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useWishlist } from '../../context/WishlistContext';
import './VoiceSearchTaronaModal.css';

const CLOSE_MS = 320;
const DRAG_THRESHOLD = 8;
const FLICK_MS = 280;
const FLICK_MIN_PX = 48;
const BODY_LOCK = 'voice-search-tarona-sheet-open';

const VoiceSearchTaronaModal = ({ open, onClose, item, onGoToMusic }) => {
  const { t } = useTranslation();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [translateY, setTranslateY] = useState(0);
  const [dragging, setDragging] = useState(false);

  const sheetRef = useRef(null);
  const dragZoneRef = useRef(null);
  const closingRef = useRef(false);
  const closeTimerRef = useRef(null);
  const startYRef = useRef(null);
  const lastYRef = useRef(null);
  const startTimeRef = useRef(0);

  const musicId = item?.id;
  const saved = musicId != null && isInWishlist(musicId, 'music');

  const finishClose = useCallback(() => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setMounted(false);
    setVisible(false);
    setTranslateY(0);
    setDragging(false);
    closingRef.current = false;
    startYRef.current = null;
    lastYRef.current = null;
    onClose?.();
  }, [onClose]);

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setDragging(false);
    const h = sheetRef.current?.offsetHeight || Math.round(window.innerHeight * 0.35);
    setTranslateY(h + 24);
    setVisible(false);
    closeTimerRef.current = window.setTimeout(finishClose, CLOSE_MS);
  }, [finishClose]);

  useEffect(() => {
    if (!open) {
      if (mounted && !closingRef.current) requestClose();
      return undefined;
    }

    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    closingRef.current = false;
    setMounted(true);
    setTranslateY(0);
    setDragging(false);

    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!mounted) return undefined;
    document.documentElement.classList.add(BODY_LOCK);
    document.body.classList.add(BODY_LOCK);
    return () => {
      document.documentElement.classList.remove(BODY_LOCK);
      document.body.classList.remove(BODY_LOCK);
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') requestClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mounted, requestClose]);

  useEffect(
    () => () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    },
    []
  );

  const handleTouchStart = (e) => {
    if (closingRef.current) return;
    const y = e.touches[0].clientY;
    startYRef.current = y;
    lastYRef.current = y;
    startTimeRef.current = performance.now();
    setDragging(false);
  };

  const handleTouchMove = useCallback((e) => {
    if (closingRef.current || startYRef.current == null) return;
    const y = e.touches[0].clientY;
    const diff = y - startYRef.current;
    lastYRef.current = y;
    if (diff > DRAG_THRESHOLD) {
      e.preventDefault();
      setDragging(true);
      setTranslateY(diff);
    }
  }, []);

  const handleTouchEnd = () => {
    if (closingRef.current || startYRef.current == null) return;
    const distance = Math.max(0, (lastYRef.current ?? startYRef.current) - startYRef.current);
    const duration = performance.now() - startTimeRef.current;
    const h = sheetRef.current?.offsetHeight || 280;
    const farEnough = distance > h * 0.35;
    const isFlick = duration < FLICK_MS && distance > FLICK_MIN_PX;

    if (farEnough || isFlick) {
      requestClose();
      return;
    }
    setDragging(false);
    setTranslateY(0);
    startYRef.current = null;
    lastYRef.current = null;
  };

  useEffect(() => {
    const el = dragZoneRef.current;
    if (!el || !mounted) return undefined;
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => el.removeEventListener('touchmove', handleTouchMove);
  }, [mounted, handleTouchMove]);

  const handleSave = () => {
    if (musicId == null) return;
    toggleWishlist(musicId, 'music');
    requestClose();
  };

  const handleGoToMusic = () => {
    if (musicId == null) return;
    onGoToMusic?.(item);
    requestClose();
  };

  if (!mounted || !item) return null;

  const sheetStyle =
    dragging || translateY > 0 ? { transform: `translateY(${translateY}px)` } : undefined;

  return createPortal(
    <div
      className={`voice-search-tarona-modal-overlay${visible ? ' is-visible' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
      role="presentation"
    >
      <div
        ref={sheetRef}
        className={[
          'voice-search-tarona-modal-sheet',
          visible && translateY === 0 && !dragging ? 'is-open' : '',
          dragging ? 'is-dragging' : '',
          !visible ? 'is-closing' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={sheetStyle}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t('voiceSearch.taronaActions', 'Amallar')}
      >
        <div
          ref={dragZoneRef}
          className="voice-search-tarona-modal-drag-zone"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          <div className="voice-search-tarona-modal-handle" />
        </div>

        {item.title ? (
          <div className="voice-search-tarona-modal-preview">
            <img
              src={item.img || '/img/movie1.jpg'}
              alt=""
              className="voice-search-tarona-modal-preview-img"
            />
            <div className="voice-search-tarona-modal-preview-text">
              <span className="voice-search-tarona-modal-preview-title">{item.title}</span>
              {item.artistName || item.artistId ? (
                <span className="voice-search-tarona-modal-preview-artist">
                  {item.artistName || item.artistId}
                </span>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="voice-search-tarona-modal-actions">
          <button
            type="button"
            className={`voice-search-tarona-modal-action voice-search-tarona-modal-action--save${
              saved ? ' is-active' : ''
            }`}
            onClick={handleSave}
            aria-pressed={saved}
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill={saved ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            <span>{t('wishlist.save', 'Saqlash')}</span>
          </button>

          <button
            type="button"
            className="voice-search-tarona-modal-action voice-search-tarona-modal-action--go"
            onClick={handleGoToMusic}
          >
            <i className="fa-solid fa-music" aria-hidden="true" />
            <span>{t('voiceSearch.taronaGoToMusic', "Musiqaga o'tish")}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default VoiceSearchTaronaModal;
