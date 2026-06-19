import React, { useEffect, useLayoutEffect, useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './GlobalModal.css';

const CHUNK = 6;

/** MoreModal bilan bir xil — mobil panel animatsiyasi */
const MOBILE_BREAKPOINT = 500;

export function chunkImagesForGallery(items, size = CHUNK) {
  if (!items?.length) return [];
  const out = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

/** Sahifadagi grid bilan bir xil: 6 tagacha, kam bo‘lsa oxirgisini takrorlaymiz */
function padChunkToSix(chunk) {
  if (!chunk?.length) return [];
  const out = [...chunk];
  while (out.length < 6) out.push(out[out.length - 1]);
  return out.slice(0, 6);
}

const CloseIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

function isMobileViewport() {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= MOBILE_BREAKPOINT;
}

/**
 * `.actors-page-media-row--split .actors-page-photo-gallery-grid` bilan bir xil joylashuv
 */
function ActorsSplitGalleryGrid({ urlsSix, startIndex, onImageClick }) {
  const [c0, c1, c2, c3, c4, c5] = urlsSix;

  const open = (i) => onImageClick?.(startIndex + i);

  const keyDown = (e, i) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open(i);
    }
  };

  return (
    <div className="actors-page-photo-gallery-grid global-modal-split-photo-gallery-grid">
      <div
        className="actors-page-pg-cell actors-page-pg-cell--hero"
        role="button"
        tabIndex={0}
        onClick={() => open(0)}
        onKeyDown={(e) => keyDown(e, 0)}
      >
        <img src={c0} alt="" loading="lazy" draggable={false} />
      </div>
      <div
        className="actors-page-pg-cell actors-page-pg-cell--mid-top"
        role="button"
        tabIndex={0}
        onClick={() => open(1)}
        onKeyDown={(e) => keyDown(e, 1)}
      >
        <img src={c1} alt="" loading="lazy" draggable={false} />
      </div>
      <div
        className="actors-page-pg-cell actors-page-pg-cell--mid-bottom"
        role="button"
        tabIndex={0}
        onClick={() => open(2)}
        onKeyDown={(e) => keyDown(e, 2)}
      >
        <img src={c2} alt="" loading="lazy" draggable={false} />
      </div>
      <div className="actors-page-pg-cell actors-page-pg-cell--right">
        <div className="actors-page-pg-right-top">
          <div
            className="actors-page-pg-cell actors-page-pg-cell--small"
            role="button"
            tabIndex={0}
            onClick={() => open(3)}
            onKeyDown={(e) => keyDown(e, 3)}
          >
            <img src={c3} alt="" loading="lazy" draggable={false} />
          </div>
          <div
            className="actors-page-pg-cell actors-page-pg-cell--small"
            role="button"
            tabIndex={0}
            onClick={() => open(4)}
            onKeyDown={(e) => keyDown(e, 4)}
          >
            <img src={c4} alt="" loading="lazy" draggable={false} />
          </div>
        </div>
        <div
          className="actors-page-pg-cell actors-page-pg-cell--wide"
          role="button"
          tabIndex={0}
          onClick={() => open(5)}
          onKeyDown={(e) => keyDown(e, 5)}
        >
          <img src={c5} alt="" loading="lazy" draggable={false} />
        </div>
      </div>
    </div>
  );
}

const GlobalModal = ({
  isOpen,
  onClose,
  title = '',
  images = [],
  onImageClick,
  children,
}) => {
  const overlayRef = useRef(null);
  const [isExiting, setIsExiting] = useState(false);
  const [slideReady, setSlideReady] = useState(false);
  /** Har safar ochilganda panel DOM yangilanishi — animatsiya takrorlanadi */
  const [panelKey, setPanelKey] = useState(0);

  const handleClose = useCallback(() => {
    if (isMobileViewport()) {
      setIsExiting(true);
      setTimeout(() => {
        setIsExiting(false);
        onClose?.();
      }, 320);
    } else {
      onClose?.();
    }
  }, [onClose]);

  /* Yopilganda / ochilishdan oldin: surilish holatini nolga — qayta ochilganda yana yondan suriladi */
  useLayoutEffect(() => {
    if (!isOpen) {
      setSlideReady(false);
      setIsExiting(false);
      return;
    }
    setIsExiting(false);
    setSlideReady(false);
    setPanelKey((k) => k + 1);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const mobile = isMobileViewport();

    const scrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    if (mobile) {
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
    }

    const t = setTimeout(() => setSlideReady(true), 20);

    const onKey = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onKey);

    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      window.scrollTo(0, scrollY);
    };
  }, [isOpen, handleClose]);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) handleClose();
  };

  const wrapOverlay = (dialogNode) => {
    const mobile = isMobileViewport();
    const overlayClass = `global-modal-overlay${isExiting ? ' global-modal-overlay--closing' : ''}${mobile ? ' global-modal-overlay--mobile' : ''}`;

    return (
      <div
        ref={overlayRef}
        className={overlayClass}
        onClick={handleOverlayClick}
        role="presentation"
      >
        {mobile ? (
          <div
            key={panelKey}
            className={`global-modal-panel${slideReady && !isExiting ? ' global-modal-panel--open' : ''}${isExiting ? ' global-modal-panel--closing' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            {dialogNode}
          </div>
        ) : (
          dialogNode
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  if (children != null) {
    const dialog = (
      <div
        className="global-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Modal'}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="global-modal-header">
          {title ? <h2 className="global-modal-title">{title}</h2> : <span className="global-modal-title" />}
          <button
            type="button"
            className="global-modal-close"
            onClick={handleClose}
            aria-label="Yopish"
          >
            <CloseIcon />
          </button>
        </header>
        <div className="global-modal-body global-modal-body--custom">{children}</div>
      </div>
    );

    return createPortal(wrapOverlay(dialog), document.body);
  }

  if (!images.length) return null;

  const sections = chunkImagesForGallery(images, CHUNK);

  const dialog = (
    <div
      className="global-modal-dialog"
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Gallery'}
      onClick={(e) => e.stopPropagation()}
    >
      <header className="global-modal-header">
        {title ? <h2 className="global-modal-title">{title}</h2> : <span className="global-modal-title" />}
        <button
          type="button"
          className="global-modal-close"
          onClick={handleClose}
          aria-label="Yopish"
        >
          <CloseIcon />
        </button>
      </header>
      <div className="global-modal-body">
        {sections.map((chunk, sectionIdx) => {
          const padded = padChunkToSix(chunk);
          const startIndex = sectionIdx * CHUNK;
          return (
            <section key={sectionIdx} className="global-modal-gallery-section">
              <ActorsSplitGalleryGrid
                urlsSix={padded}
                startIndex={startIndex}
                onImageClick={onImageClick}
              />
            </section>
          );
        })}
      </div>
    </div>
  );

  return createPortal(wrapOverlay(dialog), document.body);
};

export default GlobalModal;
