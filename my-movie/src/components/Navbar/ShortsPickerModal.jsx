import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './ShortsPickerModal.css';

const MOBILE_MAX = 768;

const ShortsPickerModal = ({ isOpen, onClose, onPick }) => {
  const { t } = useTranslation();
  const [dragY, setDragY] = useState(0);
  const startYRef = useRef(0);
  const dragYRef = useRef(0);

  useEffect(() => {
    if (!isOpen) {
      dragYRef.current = 0;
      setDragY(0);
      return;
    }
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const isMobile = window.innerWidth <= MOBILE_MAX;
    if (isMobile) document.body.style.overflow = 'hidden';
    return () => {
      if (isMobile) document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleTouchStart = (e) => {
    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (window.innerWidth > MOBILE_MAX) return;
    const y = e.touches[0].clientY;
    const diff = y - startYRef.current;
    if (diff > 0) {
      dragYRef.current = diff;
      setDragY(diff);
    }
  };

  const handleTouchEnd = () => {
    if (dragYRef.current > 80) onClose();
    dragYRef.current = 0;
    setDragY(0);
  };

  const handlePick = (path) => {
    onPick(path);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="shorts-picker-overlay" onClick={onClose} aria-hidden />
      <div
        className={`shorts-picker-modal ${dragY > 0 ? 'shorts-picker-modal--dragging' : ''}`}
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
              onClick={onClose}
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
          >
            <i className="fa-solid fa-film" aria-hidden />
            <span>{t('navbar.movieShorts')}</span>
          </button>
          <button
            type="button"
            className="shorts-picker-btn"
            onClick={() => handlePick('/music/shorts')}
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
