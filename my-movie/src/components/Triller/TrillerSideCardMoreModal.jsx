import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import ShareButton from '../ShareButton/ShareButton';
import { useWishlist } from '../../context/WishlistContext';
import './TrillerSideCardMoreModal.css';

const MOBILE_MAX = 900;
const CLOSE_MS = 320;
const DRAG_THRESHOLD = 8;
const FLICK_MS = 280;
const FLICK_MIN_PX = 48;
const BODY_LOCK = 'triller-side-more-open';

/**
 * Side card ⋯ menyusi:
 * Desktop — icon ostidan dropdown
 * Mobile — pastdan sheet + drag yopish
 */
const TrillerSideCardMoreModal = ({
  open,
  onClose,
  anchorRect = null,
  trillerId,
  title = '',
}) => {
  const { t } = useTranslation();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= MOBILE_MAX
  );
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [translateY, setTranslateY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [desktopPos, setDesktopPos] = useState({ top: 0, left: 0 });

  const sheetRef = useRef(null);
  const dragZoneRef = useRef(null);
  const menuRef = useRef(null);
  const closingRef = useRef(false);
  const closeTimerRef = useRef(null);
  const startYRef = useRef(null);
  const lastYRef = useRef(null);
  const startTimeRef = useRef(0);

  const saved = trillerId != null && isInWishlist(trillerId, 'triller');
  const sharePath = trillerId != null ? `/triller/${trillerId}` : '';
  const shareMovie = { id: trillerId, title: title || '' };

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= MOBILE_MAX);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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
    if (isMobile) {
      const h = sheetRef.current?.offsetHeight || Math.round(window.innerHeight * 0.4);
      setTranslateY(h + 24);
      setVisible(false);
      closeTimerRef.current = window.setTimeout(finishClose, CLOSE_MS);
    } else {
      setVisible(false);
      closeTimerRef.current = window.setTimeout(finishClose, 160);
    }
  }, [finishClose, isMobile]);

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

    if (!isMobile && anchorRect) {
      const menuW = 200;
      const gap = 6;
      let left = anchorRect.right - menuW;
      left = Math.max(8, Math.min(left, window.innerWidth - menuW - 8));
      let top = anchorRect.bottom + gap;
      setDesktopPos({ top, left });
    }

    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isMobile, anchorRect]);

  useEffect(() => {
    if (!mounted || isMobile) return undefined;
    const onDoc = (e) => {
      if (e.target.closest?.('.triller-side-card-more')) return;
      if (e.target.closest?.('.share-button-dropdown') || e.target.closest?.('.share-modal-overlay')) {
        return;
      }
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        requestClose();
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') requestClose();
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [mounted, isMobile, requestClose]);

  useEffect(() => {
    if (!mounted || !isMobile) return undefined;
    document.documentElement.classList.add(BODY_LOCK);
    document.body.classList.add(BODY_LOCK);
    return () => {
      document.documentElement.classList.remove(BODY_LOCK);
      document.body.classList.remove(BODY_LOCK);
    };
  }, [mounted, isMobile]);

  useEffect(
    () => () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    },
    []
  );

  const handleTouchStart = (e) => {
    if (closingRef.current || !isMobile) return;
    const y = e.touches[0].clientY;
    startYRef.current = y;
    lastYRef.current = y;
    startTimeRef.current = performance.now();
    setDragging(false);
  };

  const handleTouchMove = useCallback(
    (e) => {
      if (closingRef.current || startYRef.current == null || !isMobile) return;
      const y = e.touches[0].clientY;
      const diff = y - startYRef.current;
      lastYRef.current = y;
      if (diff > DRAG_THRESHOLD) {
        e.preventDefault();
        setDragging(true);
        setTranslateY(diff);
      }
    },
    [isMobile]
  );

  const handleTouchEnd = () => {
    if (closingRef.current || startYRef.current == null || !isMobile) return;
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
    if (!el || !mounted || !isMobile) return undefined;
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => el.removeEventListener('touchmove', handleTouchMove);
  }, [mounted, isMobile, handleTouchMove]);

  const handleSave = (e) => {
    e.stopPropagation();
    if (trillerId == null) return;
    toggleWishlist(trillerId, 'triller');
  };

  if (!mounted) return null;

  const sheetStyle =
    dragging || translateY > 0 ? { transform: `translateY(${translateY}px)` } : undefined;

  const actions = (
    <div className="triller-side-more-actions">
      <div className="triller-side-more-share-wrap">
        <ShareButton
          movie={shareMovie}
          sharePath={sharePath}
          dropdownInPortal
          icon="send"
          label={t('share.share', 'Ulashish')}
          className="triller-side-more-share"
          buttonClassName="triller-side-more-action triller-side-more-action--share"
        />
      </div>
      <button
        type="button"
        className={`triller-side-more-action triller-side-more-action--save${
          saved ? ' is-active' : ''
        }`}
        onClick={handleSave}
        aria-pressed={saved}
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
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
    </div>
  );

  if (!isMobile) {
    return createPortal(
      <div
        ref={menuRef}
        className={`triller-side-more-desktop${visible ? ' is-visible' : ''}`}
        style={{ top: desktopPos.top, left: desktopPos.left }}
        role="menu"
        aria-label={t('triller.moreActions', 'Boshqa amallar')}
        onClick={(e) => e.stopPropagation()}
      >
        {actions}
      </div>,
      document.body
    );
  }

  return createPortal(
    <div
      className={`triller-side-more-overlay${visible ? ' is-visible' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
      onTouchEnd={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
      role="presentation"
    >
      <div
        ref={sheetRef}
        className={[
          'triller-side-more-sheet',
          visible && translateY === 0 && !dragging ? 'is-open' : '',
          dragging ? 'is-dragging' : '',
          !visible ? 'is-closing' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={sheetStyle}
        onClick={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t('triller.moreActions', 'Boshqa amallar')}
      >
        <div
          ref={dragZoneRef}
          className="triller-side-more-drag-zone"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          <div className="triller-side-more-handle" />
        </div>
        {actions}
      </div>
    </div>,
    document.body
  );
};

export default TrillerSideCardMoreModal;
