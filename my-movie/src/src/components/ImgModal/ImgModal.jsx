


import React, { useEffect, useCallback, useRef, useState } from 'react';
import './ImgModal.css';

const CLOSE_DELAY = 250;

const DownloadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ChevronLeft = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronRight = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const ImgModal = ({ isOpen, onClose, images = [], currentIndex = 0, onIndexChange }) => {
  const overlayRef = useRef(null);
  const [closing, setClosing] = useState(false);

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1 && images.length > 1;
  const showThumbs = images.length > 1;

  /* ── Animated close ── */
  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose?.();
    }, CLOSE_DELAY);
  }, [onClose]);

  /* ── Navigation ── */
  const goPrev = useCallback(() => {
    if (hasPrev) onIndexChange?.(currentIndex - 1);
  }, [hasPrev, currentIndex, onIndexChange]);

  const goNext = useCallback(() => {
    if (hasNext) onIndexChange?.(currentIndex + 1);
  }, [hasNext, currentIndex, onIndexChange]);

  /* ── Keyboard ── */
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape')      handleClose();
      if (e.key === 'ArrowLeft')   goPrev();
      if (e.key === 'ArrowRight')  goNext();
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, handleClose, goPrev, goNext]);

  /* ── Click outside ── */
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) handleClose();
  };

  /* ── Download ── */
  const handleDownload = useCallback(async () => {
    const src = images[currentIndex] || images[0];
    if (!src) return;
    const baseName =
      (typeof src === 'string' && src.split('/').pop()?.split('?')[0]) ||
      `image-${currentIndex + 1}`;
    const safeName = baseName.replace(/[^\w.\-]/g, '_') || `image-${currentIndex + 1}.jpg`;
    try {
      const res = await fetch(src, { mode: 'cors' });
      if (!res.ok) throw new Error('fetch failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement('a'), { href: url, download: safeName, rel: 'noopener' });
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      const a = Object.assign(document.createElement('a'), {
        href: src, download: safeName, target: '_blank', rel: 'noopener noreferrer',
      });
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  }, [images, currentIndex]);

  if (!isOpen || !images.length) return null;

  const currentImg = images[currentIndex] || images[0];

  return (
    <div
      ref={overlayRef}
      className={`img-modal-overlay${closing ? ' is-closing' : ''}`}
      onClick={handleOverlayClick}
    >
      {/* Top bar */}
      <div className="img-modal-topbar">
        <button
          type="button"
          className="img-modal-icon-btn"
          onClick={(e) => { e.stopPropagation(); handleDownload(); }}
          aria-label="Yuklab olish"
        >
          <DownloadIcon />
        </button>

        <button
          type="button"
          className="img-modal-icon-btn"
          onClick={handleClose}
          aria-label="Yopish"
        >
          <CloseIcon />
        </button>
      </div>

      {/* Prev */}
      {hasPrev && (
        <button
          type="button"
          className="img-modal-nav-btn img-modal-nav-prev"
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          aria-label="Oldingi"
        >
          <ChevronLeft />
        </button>
      )}

      {/* Image */}
      <div className="img-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="img-modal-image-wrap">
          <img
            key={currentImg}
            src={currentImg}
            alt={`Rasm ${currentIndex + 1}`}
            className="img-modal-image"
            draggable={false}
          />
        </div>
      </div>

      {/* Next */}
      {hasNext && (
        <button
          type="button"
          className="img-modal-nav-btn img-modal-nav-next"
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          aria-label="Keyingi"
        >
          <ChevronRight />
        </button>
      )}

      {/* Thumbnails (replaces plain counter when multiple images) */}
      {showThumbs ? (
        <div className="img-modal-thumbs" onClick={(e) => e.stopPropagation()}>
          {images.map((src, i) => (
            <img
              key={src + i}
              src={src}
              alt=""
              className={`img-modal-thumb${i === currentIndex ? ' active' : ''}`}
              onClick={() => onIndexChange?.(i)}
              draggable={false}
            />
          ))}
        </div>
      ) : null}

      {/* Simple counter when only one image */}
      {!showThumbs && (
        <span className="img-modal-counter">1 / 1</span>
      )}
    </div>
  );
};

export default ImgModal;