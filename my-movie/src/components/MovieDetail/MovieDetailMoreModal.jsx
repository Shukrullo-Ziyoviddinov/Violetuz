import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import './MovieDetailMoreModal.css';

const MOBILE_MAX = 768;
const CLOSE_MS = 320;

const isMobileViewport = () =>
  typeof window !== 'undefined' && window.innerWidth <= MOBILE_MAX;

const measureControlsBottom = () => {
  const controls = document.querySelector('.movie-detail .watch-modal-controls-overlay');
  if (!controls) return 0;
  return Math.max(0, Math.round(controls.getBoundingClientRect().bottom));
};

const MovieDetailMoreModal = ({ open, onClose, title }) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [translateY, setTranslateY] = useState(0);
  const [sheetTop, setSheetTop] = useState(0);
  const [mobile, setMobile] = useState(isMobileViewport);

  const contentRef = useRef(null);
  const headerRef = useRef(null);
  const draggingRef = useRef(false);
  const startYRef = useRef(0);
  const closingRef = useRef(false);
  const closeTimerRef = useRef(null);

  const finishClose = useCallback(() => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setSheetOpen(false);
    setClosing(false);
    setDragging(false);
    setTranslateY(0);
    draggingRef.current = false;
    closingRef.current = false;
    onClose?.();
  }, [onClose]);

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    if (!isMobileViewport()) {
      onClose?.();
      return;
    }
    closingRef.current = true;
    setDragging(false);
    draggingRef.current = false;
    const h = contentRef.current?.offsetHeight || Math.round(window.innerHeight * 0.5);
    setTranslateY((prev) => (prev > 0 ? Math.max(prev, h + 24) : h + 24));
    setSheetOpen(false);
    setClosing(true);
    closeTimerRef.current = window.setTimeout(finishClose, CLOSE_MS);
  }, [finishClose, onClose]);

  useLayoutEffect(() => {
    if (!open) {
      setSheetOpen(false);
      setClosing(false);
      setTranslateY(0);
      return undefined;
    }
    const nextMobile = isMobileViewport();
    setMobile(nextMobile);
    setSheetTop(measureControlsBottom());
    if (!nextMobile) {
      setSheetOpen(true);
      return undefined;
    }
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    closingRef.current = false;
    setClosing(false);
    setTranslateY(0);
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setSheetOpen(true));
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onResize = () => {
      const nextMobile = isMobileViewport();
      setMobile(nextMobile);
      setSheetTop(measureControlsBottom());
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => () => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isMobileViewport() || !draggingRef.current || closingRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const deltaY = e.touches[0].clientY - startYRef.current;
    setTranslateY(deltaY > 0 ? deltaY : 0);
  }, []);

  useEffect(() => {
    if (!open || !headerRef.current) return undefined;
    const el = headerRef.current;
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => el.removeEventListener('touchmove', handleTouchMove);
  }, [open, handleTouchMove]);

  const handleTouchStart = (e) => {
    if (!isMobileViewport() || closingRef.current) return;
    e.stopPropagation();
    startYRef.current = e.touches[0].clientY;
    draggingRef.current = true;
    setDragging(true);
  };

  const handleTouchEnd = (e) => {
    if (!isMobileViewport() || !dragging || closingRef.current) return;
    e.stopPropagation();
    const threshold = window.innerHeight * 0.1;
    if (translateY > threshold) {
      requestClose();
      return;
    }
    draggingRef.current = false;
    setDragging(false);
    setTranslateY(0);
  };

  if (!open && !closing) return null;

  const contentStyle = {};
  if (translateY) contentStyle.transform = `translateY(${translateY}px)`;

  return (
    <div
      className={[
        'movie-detail-more-modal',
        dragging ? 'dragging' : '',
        sheetOpen && !closing ? 'movie-detail-more-modal--open' : '',
        closing ? 'movie-detail-more-modal--closing' : '',
      ].filter(Boolean).join(' ')}
      style={{ top: sheetTop }}
    >
      <div
        ref={contentRef}
        className={[
          'movie-detail-more-modal-content',
          sheetOpen && !closing ? 'movie-detail-more-modal-content--open' : '',
          closing ? 'movie-detail-more-modal-content--closing' : '',
        ].filter(Boolean).join(' ')}
        style={Object.keys(contentStyle).length ? contentStyle : undefined}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Yana'}
      >
        <div
          ref={headerRef}
          className="movie-detail-more-modal-header"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button
            type="button"
            className="movie-detail-more-modal-close"
            onClick={requestClose}
            aria-label="Yopish"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <h3>{title}</h3>
        </div>
        <div className="movie-detail-more-modal-body" />
      </div>
    </div>
  );
};

export default MovieDetailMoreModal;
