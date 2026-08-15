import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import './ShortsPickerModal.css';

const MOBILE_MAX = 768;
const CLOSE_MS = 340;

const isMobileViewport = () =>
  typeof window !== 'undefined' && window.innerWidth <= MOBILE_MAX;

const ShortsPickerModal = ({ isOpen, onClose, onPick }) => {
  const { t } = useTranslation();
  const [dragY, setDragY] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [exiting, setExiting] = useState(false);
  const startYRef = useRef(0);
  const dragYRef = useRef(0);
  const closeTimerRef = useRef(null);
  const openRafRef = useRef(0);

  const requestClose = useCallback(() => {
    if (exiting) return;
    if (!isMobileViewport()) {
      onClose?.();
      return;
    }
    setExiting(true);
    setSheetOpen(false);
    setDragY(0);
    dragYRef.current = 0;
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => {
      onClose?.();
    }, CLOSE_MS);
  }, [exiting, onClose]);

  const requestCloseRef = useRef(requestClose);
  requestCloseRef.current = requestClose;

  useEffect(() => {
    if (!isOpen) {
      if (openRafRef.current) window.cancelAnimationFrame(openRafRef.current);
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
      dragYRef.current = 0;
      setDragY(0);
      setSheetOpen(false);
      setExiting(false);
      return undefined;
    }

    setExiting(false);
    setDragY(0);
    dragYRef.current = 0;

    if (isMobileViewport()) {
      setSheetOpen(false);
      openRafRef.current = window.requestAnimationFrame(() => {
        openRafRef.current = window.requestAnimationFrame(() => setSheetOpen(true));
      });
    } else {
      setSheetOpen(true);
    }

    const onKey = (e) => {
      if (e.key === 'Escape') requestCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (openRafRef.current) window.cancelAnimationFrame(openRafRef.current);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen && !exiting) return undefined;
    const isMobile = isMobileViewport();
    if (isMobile) document.body.style.overflow = 'hidden';
    return () => {
      if (isMobile) document.body.style.overflow = '';
    };
  }, [isOpen, exiting]);

  useEffect(
    () => () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
      if (openRafRef.current) window.cancelAnimationFrame(openRafRef.current);
    },
    []
  );

  const handleTouchStart = (e) => {
    if (exiting) return;
    startYRef.current = e.touches[0].clientY;
    dragYRef.current = 0;
  };

  const handleTouchMove = (e) => {
    if (exiting || !isMobileViewport()) return;
    const y = e.touches[0].clientY;
    const diff = y - startYRef.current;
    if (diff > 0) {
      dragYRef.current = diff;
      setDragY(diff);
    }
  };

  const handleTouchEnd = () => {
    if (exiting) return;
    if (dragYRef.current > 80) {
      requestClose();
      return;
    }
    dragYRef.current = 0;
    setDragY(0);
  };

  const handlePick = (path) => {
    if (exiting) return;
    onPick(path);
    requestClose();
  };

  if (!isOpen && !exiting) return null;

  const overlayClass = [
    'shorts-picker-overlay',
    sheetOpen ? 'shorts-picker-overlay--open' : '',
    exiting ? 'shorts-picker-overlay--closing' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const modalClass = [
    'shorts-picker-modal',
    sheetOpen ? 'shorts-picker-modal--open' : '',
    dragY > 0 && !exiting ? 'shorts-picker-modal--dragging' : '',
    exiting ? 'shorts-picker-modal--closing' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <div className={overlayClass} onClick={requestClose} aria-hidden />
      <div
        className={modalClass}
        style={{ '--drag-y': `${dragY}px` }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shorts-picker-title"
      >
        <div
          className="shorts-picker-modal-top"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="shorts-picker-modal-drag-handle" aria-hidden />
          <div className="shorts-picker-modal-header-row">
            <h2 id="shorts-picker-title" className="shorts-picker-modal-title">
              {t('navbar.shorts')}
            </h2>
            <button
              type="button"
              className="shorts-picker-modal-close shorts-picker-modal-close--desktop"
              onClick={requestClose}
              aria-label={t('detail.close')}
            >
              ×
            </button>
          </div>
        </div>
        <div className="shorts-picker-modal-actions">
          <button
            type="button"
            className="shorts-picker-btn"
            onClick={() => handlePick('/shorts')}
            disabled={exiting}
          >
            <i className="fa-solid fa-film" aria-hidden />
            <span>{t('navbar.movieShorts')}</span>
          </button>
          <button
            type="button"
            className="shorts-picker-btn"
            onClick={() => handlePick('/music/shorts')}
            disabled={exiting}
          >
            <i className="fa-solid fa-music" aria-hidden />
            <span>{t('navbar.musicShorts')}</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default ShortsPickerModal;
