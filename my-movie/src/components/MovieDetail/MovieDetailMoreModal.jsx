import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import MovieSoundtracks from './MovieSoundtracks';
import MovieSoundtrackClips from './MovieSoundtrackClips';
import './MovieDetailMoreModal.css';

const MOBILE_MAX = 768;
const CLOSE_MS = 320;

const isMobileViewport = () =>
  typeof window !== 'undefined' && window.innerWidth <= MOBILE_MAX;

const measureVideoBottom = () => {
  const slot = document.querySelector('.movie-detail .video-player-controls .trailer-modal-media-slot');
  if (!slot) return 0;
  return Math.max(0, Math.round(slot.getBoundingClientRect().bottom));
};

const MovieDetailMoreModal = ({ open, onClose, title, movie, children }) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [translateY, setTranslateY] = useState(0);
  const [sheetTop, setSheetTop] = useState(0);
  const [animateTop, setAnimateTop] = useState(false);
  const [mobile, setMobile] = useState(isMobileViewport);

  const contentRef = useRef(null);
  const headerRef = useRef(null);
  const draggingRef = useRef(false);
  const startYRef = useRef(0);
  const startTopRef = useRef(0);
  const closingRef = useRef(false);
  const closeTimerRef = useRef(null);
  const restTopRef = useRef(0);
  const sheetTopRef = useRef(0);
  const translateYRef = useRef(0);
  const expandedRef = useRef(false);

  const finishClose = useCallback(() => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setSheetOpen(false);
    setClosing(false);
    setDragging(false);
    setTranslateY(0);
    translateYRef.current = 0;
    expandedRef.current = false;
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
      setAnimateTop(false);
      translateYRef.current = 0;
      expandedRef.current = false;
      return undefined;
    }
    const nextMobile = isMobileViewport();
    setMobile(nextMobile);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const rest = measureVideoBottom();
    restTopRef.current = rest;
    expandedRef.current = false;
    sheetTopRef.current = rest;
    setSheetTop(rest);
    setAnimateTop(false);
    if (!nextMobile) {
      setSheetOpen(true);
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    closingRef.current = false;
    setClosing(false);
    setTranslateY(0);
    translateYRef.current = 0;
    let inner = 0;
    const frame = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        setAnimateTop(true);
        setSheetOpen(true);
      });
    });
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(inner);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onResize = () => {
      const nextMobile = isMobileViewport();
      setMobile(nextMobile);
      const rest = measureVideoBottom();
      restTopRef.current = rest;
      if (!expandedRef.current) {
        sheetTopRef.current = rest;
        setSheetTop(rest);
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [open]);

  useEffect(() => () => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
  }, []);

  const applyShift = (top, shift) => {
    sheetTopRef.current = top;
    translateYRef.current = shift;
    setSheetTop(top);
    setTranslateY(shift);
  };

  const handleTouchMove = useCallback((e) => {
    if (!isMobileViewport() || !draggingRef.current || closingRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const deltaY = e.touches[0].clientY - startYRef.current;
    const rest = restTopRef.current;
    const origin = startTopRef.current;
    if (expandedRef.current) {
      if (deltaY <= 0) {
        applyShift(0, 0);
        return;
      }
      if (deltaY < rest) {
        applyShift(deltaY, 0);
        return;
      }
      applyShift(rest, deltaY - rest);
      return;
    }
    if (deltaY < 0) {
      applyShift(Math.max(0, origin + deltaY), 0);
      return;
    }
    applyShift(origin, deltaY);
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
    startTopRef.current = expandedRef.current ? 0 : restTopRef.current;
    draggingRef.current = true;
    setDragging(true);
  };

  const handleTouchEnd = (e) => {
    if (!isMobileViewport() || !draggingRef.current || closingRef.current) return;
    e.stopPropagation();
    const threshold = Math.max(56, window.innerHeight * 0.1);
    const rest = restTopRef.current;
    const top = sheetTopRef.current;
    const shift = translateYRef.current;
    draggingRef.current = false;
    setDragging(false);

    if (shift > threshold) {
      requestClose();
      return;
    }

    if (expandedRef.current) {
      if (top > rest * 0.45) {
        expandedRef.current = false;
        applyShift(rest, 0);
      } else {
        applyShift(0, 0);
      }
      return;
    }

    const lifted = rest - top;
    if (rest > 0 && lifted > Math.max(56, rest * 0.28)) {
      expandedRef.current = true;
      applyShift(0, 0);
      return;
    }
    applyShift(rest, 0);
  };

  if (!open && !closing) return null;

  const contentStyle = {};
  if (translateY) contentStyle.transform = `translateY(${translateY}px)`;

  return (
    <div
      className={[
        'movie-detail-more-modal',
        dragging ? 'dragging' : '',
        animateTop && !dragging ? 'movie-detail-more-modal--animate-top' : '',
        sheetOpen && !closing ? 'movie-detail-more-modal--open' : '',
        closing ? 'movie-detail-more-modal--closing' : '',
      ].filter(Boolean).join(' ')}
      style={mobile ? { top: sheetTop } : undefined}
      onClick={mobile ? undefined : requestClose}
    >
      <div
        ref={contentRef}
        onClick={mobile ? undefined : (e) => e.stopPropagation()}
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
        <div className="movie-detail-more-modal-body">
          {children}
          {movie ? <MovieSoundtracks movie={movie} title="Saundtrek va taronalar" /> : null}
          {movie ? <MovieSoundtrackClips movie={movie} title="Saundtrek video va kliplar" /> : null}
        </div>
      </div>
    </div>
  );
};

export default MovieDetailMoreModal;
