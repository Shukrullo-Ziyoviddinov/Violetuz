import React, { useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import './MusicFilter.css';

const norm = (v) => (typeof v === 'string' ? v.toLowerCase().trim() : v);
const DRAG_CLOSE_THRESHOLD = 80;

const MOBILE_BREAKPOINT = 768;

const GenreIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
  </svg>
);

const LangIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z" />
  </svg>
);

const CountryIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
  </svg>
);

const MusicFilterModal = ({ isOpen, onClose, modalType, title, options = [], value, onChange }) => {
  const { t } = useTranslation();
  const modalRef = useRef(null);
  const dragStartY = useRef(0);
  const dragCurrentY = useRef(0);
  const isDragging = useRef(false);
  const isTouch = useRef(false);

  const handleSelect = (opt) => {
    onChange(opt);
    onClose();
  };

  const isActive = (opt) => {
    if (value == null || value === '' || value === 'all') return false;
    if (typeof opt === 'number' && typeof value === 'number') return opt === value;
    return opt && value && norm(String(opt)) === norm(String(value));
  };

  const formatOptionDisplay = (opt) => {
    if (modalType === 'year') {
      return `${opt} - ${t('music.filterYear')}`;
    }
    if (modalType === 'genre') {
      return opt;
    }
    return opt;
  };

  const handleDragStart = useCallback((e) => {
    if (window.innerWidth >= MOBILE_BREAKPOINT) return;
    isTouch.current = e.type.startsWith('touch');
    isDragging.current = true;
    dragStartY.current = isTouch.current ? e.touches[0].clientY : e.clientY;
    dragCurrentY.current = dragStartY.current;
    const modal = modalRef.current;
    if (modal) modal.style.transition = 'none';
  }, []);

  const handleDragMove = useCallback((e) => {
    if (!isDragging.current) return;
    const y = isTouch.current ? e.touches[0].clientY : e.clientY;
    dragCurrentY.current = y;
    const modal = modalRef.current;
    if (!modal) return;
    const delta = y - dragStartY.current;
    if (delta > 0) modal.style.transform = `translateY(${delta}px)`;
  }, []);

  const handleDragEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const modal = modalRef.current;
    if (!modal) return;
    modal.style.transition = '';
    const delta = dragCurrentY.current - dragStartY.current;
    if (delta > DRAG_CLOSE_THRESHOLD) {
      onClose();
    }
    modal.style.transform = '';
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const onMove = (e) => {
      if (isTouch.current) handleDragMove(e);
    };
    const onEnd = () => handleDragEnd();
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('touchend', onEnd);
    document.addEventListener('touchcancel', onEnd);
    return () => {
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('touchcancel', onEnd);
    };
  }, [isOpen, handleDragMove, handleDragEnd]);

  useEffect(() => {
    if (!isOpen) return;
    const onMouseMove = (e) => handleDragMove(e);
    const onMouseUp = () => handleDragEnd();
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [isOpen, handleDragMove, handleDragEnd]);

  if (!isOpen) return null;

  return createPortal(
    <div className={`music-filter-modal-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
      <div
        ref={modalRef}
        className="music-filter-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="music-filter-modal-header music-filter-modal-header-draggable"
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          onMouseMove={handleDragMove}
          onTouchMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchEnd={handleDragEnd}
        >
          <span className="music-filter-modal-drag-bar" aria-hidden="true" />
          <h3 className="music-filter-modal-title">{title}</h3>
          <button
            type="button"
            className="music-filter-modal-close"
            onClick={onClose}
            aria-label="Yopish"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>
        <div className="music-filter-modal-list">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              className={`music-filter-modal-option ${isActive(opt) ? 'active' : ''} ${modalType === 'genre' || modalType === 'language' || modalType === 'country' ? 'has-icon' : ''}`}
              onClick={() => handleSelect(opt)}
            >
              {modalType === 'genre' && (
                <span className="music-filter-modal-option-icon"><GenreIcon /></span>
              )}
              {modalType === 'language' && (
                <span className="music-filter-modal-option-icon"><LangIcon /></span>
              )}
              {modalType === 'country' && (
                <span className="music-filter-modal-option-icon"><CountryIcon /></span>
              )}
              <span className="music-filter-modal-option-text">{formatOptionDisplay(opt)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default MusicFilterModal;
