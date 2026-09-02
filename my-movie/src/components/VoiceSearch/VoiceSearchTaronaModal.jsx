import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { fetchMusicById } from '../../api/musicApi';
import { useWishlist } from '../../context/WishlistContext';
import './VoiceSearchTaronaModal.css';

const CLOSE_MS = 360;
const OVERLAY_MS = 280;
const DRAG_START_PX = 6;
const DRAG_CLOSE_RATIO = 0.2;
const FLICK_MS = 260;
const FLICK_MIN_PX = 44;
const BODY_LOCK = 'voice-search-tarona-sheet-open';

const getAudioSrc = (musicItem) => {
  const raw = musicItem?.audio;
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (typeof window !== 'undefined' && raw.startsWith('/')) {
    return `${window.location.origin}${raw}`;
  }
  return raw;
};

const safeFileName = (title) =>
  String(title || 'music')
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '')
    .trim() || 'music';

const VoiceSearchTaronaModal = ({ open, onClose, item, onGoToMusic }) => {
  const { t } = useTranslation();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [mounted, setMounted] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [sheetY, setSheetY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const sheetRef = useRef(null);
  const dragZoneRef = useRef(null);
  const closingRef = useRef(false);
  const closeTimerRef = useRef(null);
  const startYRef = useRef(null);
  const lastYRef = useRef(null);
  const startTimeRef = useRef(0);
  const sheetHeightRef = useRef(320);

  const musicId = item?.id;
  const saved = musicId != null && isInWishlist(musicId, 'music');

  const measureSheet = useCallback(() => {
    const h = sheetRef.current?.offsetHeight;
    if (h && h > 0) sheetHeightRef.current = h;
    return sheetHeightRef.current;
  }, []);

  const finishClose = useCallback(() => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setMounted(false);
    setOverlayVisible(false);
    setSheetY(0);
    setDragging(false);
    setAnimating(false);
    closingRef.current = false;
    startYRef.current = null;
    lastYRef.current = null;
    onClose?.();
  }, [onClose]);

  const animateSheetTo = useCallback((targetY, onDone) => {
    setDragging(false);
    setAnimating(true);
    setSheetY(targetY);

    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    closeTimerRef.current = window.setTimeout(() => {
      setAnimating(false);
      onDone?.();
    }, CLOSE_MS);
  }, []);

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setOverlayVisible(false);

    const h = measureSheet();
    animateSheetTo(h + 28, finishClose);
  }, [animateSheetTo, finishClose, measureSheet]);

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
    setDragging(false);
    setAnimating(false);
    setMounted(true);
    setOverlayVisible(false);

    const h = sheetHeightRef.current;
    setSheetY(h + 28);

    const outerId = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        measureSheet();
        setOverlayVisible(true);
        setAnimating(true);
        setSheetY(0);
        window.setTimeout(() => setAnimating(false), CLOSE_MS);
      });
    });

    return () => window.cancelAnimationFrame(outerId);
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
    if (closingRef.current || animating) return;
    const y = e.touches[0].clientY;
    startYRef.current = y;
    lastYRef.current = y;
    startTimeRef.current = performance.now();
    setDragging(false);
  };

  const handleTouchMove = useCallback(
    (e) => {
      if (closingRef.current || animating || startYRef.current == null) return;
      const y = e.touches[0].clientY;
      const diff = Math.max(0, y - startYRef.current);
      lastYRef.current = y;

      if (!dragging && diff < DRAG_START_PX) return;

      e.preventDefault();
      setDragging(true);
      setSheetY(diff);
    },
    [animating, dragging]
  );

  const handleTouchEnd = () => {
    if (closingRef.current || animating || startYRef.current == null) return;

    const distance = Math.max(0, (lastYRef.current ?? startYRef.current) - startYRef.current);
    const duration = performance.now() - startTimeRef.current;
    const h = measureSheet();
    const closeThreshold = h * DRAG_CLOSE_RATIO;
    const isFlick = duration < FLICK_MS && distance > FLICK_MIN_PX;

    startYRef.current = null;
    lastYRef.current = null;

    if (distance >= closeThreshold || isFlick) {
      requestClose();
      return;
    }

    if (distance > 0) {
      animateSheetTo(0);
      return;
    }

    setDragging(false);
    setSheetY(0);
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

  const handleDownload = async () => {
    if (musicId == null || downloading) return;

    setDownloading(true);
    try {
      let audioUrl = getAudioSrc(item);
      if (!audioUrl) {
        const full = await fetchMusicById(musicId);
        audioUrl = getAudioSrc(full);
      }
      if (!audioUrl) return;

      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = `${safeFileName(item.title)}.mp3`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      // ignore — audio topilmasa yoki yuklab bo‘lmasa
    } finally {
      setDownloading(false);
    }
  };

  if (!mounted || !item) return null;

  const sheetClass = [
    'voice-search-tarona-modal-sheet',
    dragging ? 'is-dragging' : '',
    animating ? 'is-animating' : '',
    closingRef.current ? 'is-closing' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return createPortal(
    <div
      className={`voice-search-tarona-modal-overlay${overlayVisible ? ' is-visible' : ''}`}
      style={{ transitionDuration: `${OVERLAY_MS}ms` }}
      onClick={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
      role="presentation"
    >
      <div
        ref={sheetRef}
        className={sheetClass}
        style={{
          transform: `translateY(${sheetY}px)`,
          transitionDuration: dragging ? '0ms' : `${CLOSE_MS}ms`,
        }}
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

          <button
            type="button"
            className="voice-search-tarona-modal-action voice-search-tarona-modal-action--download"
            onClick={handleDownload}
            disabled={downloading}
            aria-busy={downloading}
          >
            <i className="fa-solid fa-download" aria-hidden="true" />
            <span>{t('voiceSearch.taronaDownload', 'Yuklab olish')}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default VoiceSearchTaronaModal;
