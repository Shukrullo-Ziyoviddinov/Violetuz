import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import HoverModalAudio from './HoverModalAudio';
import HoverModalVideo from './HoverModalVideo';
import './cartochkaHoverModal.css';

const HOVER_DELAY_MS = 1000;

/**
 * Kartochka ustida 2 soniya hover qilinganda yuqoridan modal chiqaradi.
 * Portal orqali body ga render qilinadi - overflow:hidden kesmasin.
 * type: 'music' → HoverModalAudio | type: 'klip'|'konsert' → HoverModalVideo
 */
const CartochkaHoverModal = ({
  children,
  item,
  getArtistText = (i) => '',
  getTitle = (i) => i?.title || '',
}) => {
  const [showModal, setShowModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [modalPos, setModalPos] = useState({ left: 0, bottom: 0 });
  const timerRef = useRef(null);
  const closeTimerRef = useRef(null);
  const wrapperRef = useRef(null);
  const modalOverlayRef = useRef(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const updateModalPosition = useCallback(() => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    setModalPos({
      left: rect.left + rect.width / 2,
      bottom: window.innerHeight - rect.top + 8,
    });
  }, []);

  const handleMouseEnter = useCallback(() => {
    clearTimer();
    clearCloseTimer();
    if (showModal) return;
    timerRef.current = setTimeout(() => {
      updateModalPosition();
      setShowModal(true);
      timerRef.current = null;
    }, HOVER_DELAY_MS);
  }, [clearTimer, clearCloseTimer, showModal, updateModalPosition]);

  const startClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
  }, [isClosing]);

  const handleCloseAnimationEnd = useCallback(() => {
    if (isClosing) {
      setShowModal(false);
      setIsClosing(false);
    }
  }, [isClosing]);

  const handleMouseLeave = useCallback((e) => {
    clearTimer();
    const related = e.relatedTarget;
    if (related && modalOverlayRef.current && modalOverlayRef.current.contains(related)) return;
    closeTimerRef.current = setTimeout(startClose, 500);
  }, [clearTimer, startClose]);

  const handleModalMouseEnter = useCallback(() => {
    clearCloseTimer();
    if (isClosing) setIsClosing(false);
  }, [isClosing, clearCloseTimer]);

  const handleModalMouseLeave = useCallback((e) => {
    clearCloseTimer();
    const related = e.relatedTarget;
    if (related && wrapperRef.current && wrapperRef.current.contains(related)) return;
    closeTimerRef.current = setTimeout(startClose, 450);
  }, [startClose, clearCloseTimer]);

  useEffect(() => {
    if (!showModal) return;
    let timeoutId;
    const onScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => updateModalPosition(), 150);
    };
    window.addEventListener('scroll', onScroll, true);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      clearTimeout(timeoutId);
    };
  }, [showModal, updateModalPosition]);

  useEffect(() => {
    return () => {
      clearCloseTimer();
    };
  }, [clearCloseTimer]);

  const hasContent =
    item &&
    ((item.type === 'music' && item.audio) ||
      ((item.type === 'klip' || item.type === 'konsert') && item.video));

  const modalEl =
    hasContent && showModal ? (
      <div
        ref={modalOverlayRef}
        className={`cartochka-hover-modal-overlay cartochka-hover-modal-portal ${isClosing ? 'cartochka-hover-modal-closing' : ''}`}
        style={{
          left: modalPos.left,
          bottom: modalPos.bottom,
        }}
        onMouseEnter={handleModalMouseEnter}
        onMouseLeave={handleModalMouseLeave}
        onAnimationEnd={handleCloseAnimationEnd}
      >
        <div className="cartochka-hover-modal" role="dialog" aria-label="Hover modal">
          {item.type === 'music' ? (
            <HoverModalAudio
              item={item}
              getArtistText={getArtistText}
              getTitle={getTitle}
            />
          ) : (
            <HoverModalVideo item={item} getArtistText={getArtistText} />
          )}
        </div>
      </div>
    ) : null;

  return (
    <div
      ref={wrapperRef}
      className="cartochka-hover-modal-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {modalEl && createPortal(modalEl, document.body)}
    </div>
  );
};

export default CartochkaHoverModal;
