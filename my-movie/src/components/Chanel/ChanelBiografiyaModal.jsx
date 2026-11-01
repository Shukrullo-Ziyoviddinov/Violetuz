import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './ChanelBiografiyaModal.css';

const LINK_ORDER = ['instagram', 'telegram', 'tiktok', 'youtube'];
const DRAG_CLOSE_THRESHOLD = 80;
const MOBILE_BREAKPOINT = 768;
const SLIDE_MS = 320;
const CLOSE_MS = 420;
const SLIDE_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

const LINK_LOGOS = {
  instagram: '/img/Instagram-logo.png',
  telegram: '/img/Telegram_logo.webp',
  tiktok: '/img/tiktok-logo.png',
  youtube: '/img/youtube-logo.png',
};

const isMobileViewport = () =>
  typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT;

const getLinks = (biografiya) =>
  LINK_ORDER.map((key) => {
    const item = biografiya?.link?.[key];
    if (!item || typeof item !== 'object') return null;
    const name = String(item.name || '').trim();
    const url = String(item.url || '').trim();
    if (!name && !url) return null;
    return {
      key,
      name,
      url,
      logo: LINK_LOGOS[key] || '',
    };
  }).filter(Boolean);

const readTransform = (modal) => {
  const value = getComputedStyle(modal).transform;
  return value && value !== 'none' ? value : 'translateY(0)';
};

const playSlide = (element, from, to, duration = SLIDE_MS) => {
  element.getAnimations().forEach((anim) => anim.cancel());
  return element.animate(
    [{ transform: from }, { transform: to }],
    {
      duration,
      easing: SLIDE_EASE,
      fill: 'forwards',
    }
  );
};

const playFade = (element, from, to) => {
  element.getAnimations().forEach((anim) => anim.cancel());
  return element.animate(
    [{ opacity: from }, { opacity: to }],
    {
      duration: SLIDE_MS,
      easing: SLIDE_EASE,
      fill: 'forwards',
    }
  );
};

const ChanelBiografiyaModal = ({ isOpen, onClose, biografiya }) => {
  const overlayRef = useRef(null);
  const modalRef = useRef(null);
  const dragStartY = useRef(0);
  const dragCurrentY = useRef(0);
  const isDragging = useRef(false);
  const isTouch = useRef(false);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) setMounted(true);
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!mounted) return undefined;
    const modal = modalRef.current;
    const overlay = overlayRef.current;
    if (!modal || !overlay) return undefined;

    let timer = 0;
    let settled = false;

    const finishClose = () => {
      if (settled) return;
      settled = true;
      setVisible(false);
      setMounted(false);
    };

    if (!isMobileViewport()) {
      modal.style.transition = 'none';
      modal.style.transform = '';
      overlay.style.transition = 'none';
      overlay.style.opacity = '';
      if (isOpen) {
        setVisible(true);
        return undefined;
      }
      finishClose();
      return undefined;
    }

    if (isOpen) {
      modal.style.transition = 'none';
      overlay.style.transition = 'none';
      const slide = playSlide(modal, 'translateY(100%)', 'translateY(0)');
      playFade(overlay, 0, 1);
      setVisible(true);
      return () => slide.cancel();
    }

    const from = readTransform(modal);
    const slide = playSlide(modal, from, 'translateY(100%)', CLOSE_MS);

    const onDone = () => finishClose();
    slide.addEventListener('finish', onDone);
    timer = window.setTimeout(finishClose, CLOSE_MS + 80);

    return () => {
      window.clearTimeout(timer);
      slide.removeEventListener('finish', onDone);
    };
  }, [mounted, isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  const handleDragStart = useCallback((event) => {
    if (!isMobileViewport()) return;
    if (event.target.closest?.('.chanel-biografiya-close')) return;
    isTouch.current = event.type.startsWith('touch');
    isDragging.current = true;
    dragStartY.current = isTouch.current ? event.touches[0].clientY : event.clientY;
    dragCurrentY.current = dragStartY.current;
    const modal = modalRef.current;
    if (modal) {
      modal.getAnimations().forEach((anim) => anim.cancel());
      modal.style.transition = 'none';
    }
  }, []);

  const handleDragMove = useCallback((event) => {
    if (!isDragging.current) return;
    const y = isTouch.current ? event.touches[0].clientY : event.clientY;
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
    const delta = dragCurrentY.current - dragStartY.current;
    if (delta > DRAG_CLOSE_THRESHOLD) {
      onClose?.();
      return;
    }
    playSlide(modal, modal.style.transform || readTransform(modal), 'translateY(0)');
  }, [onClose]);

  useEffect(() => {
    if (!mounted || !visible) return undefined;
    const onMove = (event) => {
      if (isTouch.current) handleDragMove(event);
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
  }, [mounted, visible, handleDragMove, handleDragEnd]);

  useEffect(() => {
    if (!mounted || !visible) return undefined;
    const onMouseMove = (event) => handleDragMove(event);
    const onMouseUp = () => handleDragEnd();
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [mounted, visible, handleDragMove, handleDragEnd]);

  if (!mounted) return null;

  const text = String(biografiya?.text || '').trim();
  const links = getLinks(biografiya);

  return createPortal(
    <div
      ref={overlayRef}
      className={`chanel-biografiya-overlay${visible ? ' open' : ''}`}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="chanel-biografiya-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chanel-biografiya-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="chanel-biografiya-header chanel-biografiya-header-draggable"
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <span className="chanel-biografiya-drag-bar" aria-hidden="true" />
          <div className="chanel-biografiya-header-row">
            <h2 id="chanel-biografiya-title" className="chanel-biografiya-title">
              Biografiya
            </h2>
            <button
              type="button"
              className="chanel-biografiya-close"
              onClick={onClose}
              aria-label="Yopish"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>
        </div>
        <div className="chanel-biografiya-body">
          {text ? <p className="chanel-biografiya-text">{text}</p> : null}
          {links.length > 0 && (
            <ul className="chanel-biografiya-links">
              {links.map((link) => {
                const content = (
                  <>
                    {link.logo ? (
                      <img className="chanel-biografiya-logo" src={link.logo} alt="" />
                    ) : (
                      <span className="chanel-biografiya-logo chanel-biografiya-logo--empty" />
                    )}
                    <span className="chanel-biografiya-link-copy">
                      {link.name ? <span className="chanel-biografiya-link-name">{link.name}</span> : null}
                      {link.url ? <span className="chanel-biografiya-link-url">{link.url}</span> : null}
                    </span>
                  </>
                );

                return (
                  <li key={link.key}>
                    {link.url ? (
                      <a
                        className="chanel-biografiya-link"
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {content}
                      </a>
                    ) : (
                      <div className="chanel-biografiya-link">{content}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ChanelBiografiyaModal;
