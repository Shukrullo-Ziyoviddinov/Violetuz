import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import './TrillerInfoModal.css';

const MOBILE_MAX = 900;
const DRAG_THRESHOLD = 8;
const FLICK_MS = 280;
const FLICK_MIN_PX = 48;
const CLOSE_MS = 340;
const BODY_LOCK_CLASS = 'triller-info-modal-open';

/**
 * Faqat mobil: pastdan ochiladi / pastga yopiladi (overlay, drag).
 */
const TrillerInfoModal = ({ open, onClose, description }) => {
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= MOBILE_MAX
  );
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [translateY, setTranslateY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const modalRef = useRef(null);
  const dragZoneRef = useRef(null);
  const startYRef = useRef(null);
  const lastYRef = useRef(null);
  const startTimeRef = useRef(0);
  const closingRef = useRef(false);
  const closeTimerRef = useRef(null);

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

    const h = modalRef.current?.offsetHeight || Math.round(window.innerHeight * 0.78);
    // Faqat px — overlay / drag yopilishida pastga slide
    setTranslateY(h + 24);
    setVisible(false);

    closeTimerRef.current = window.setTimeout(finishClose, CLOSE_MS);
  }, [finishClose]);

  useEffect(() => {
    if (!open || !isMobile || !description) {
      if (mounted && !closingRef.current) {
        requestClose();
      }
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
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isMobile, description]);

  useEffect(() => {
    if (!mounted) return undefined;
    document.documentElement.classList.add(BODY_LOCK_CLASS);
    document.body.classList.add(BODY_LOCK_CLASS);
    return () => {
      document.documentElement.classList.remove(BODY_LOCK_CLASS);
      document.body.classList.remove(BODY_LOCK_CLASS);
    };
  }, [mounted]);

  useEffect(
    () => () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    },
    []
  );

  const handleTouchStart = (e) => {
    if (closingRef.current) return;
    const y = e.touches[0].clientY;
    startYRef.current = y;
    lastYRef.current = y;
    startTimeRef.current = performance.now();
    setDragging(false);
  };

  const handleTouchMove = useCallback((e) => {
    if (closingRef.current || startYRef.current == null) return;
    const y = e.touches[0].clientY;
    const diff = y - startYRef.current;
    lastYRef.current = y;
    if (diff > DRAG_THRESHOLD) {
      e.preventDefault();
      setDragging(true);
      setTranslateY(diff);
    }
  }, []);

  const handleTouchEnd = () => {
    if (closingRef.current || startYRef.current == null) return;
    const distance = Math.max(0, (lastYRef.current ?? startYRef.current) - startYRef.current);
    const duration = performance.now() - startTimeRef.current;
    const modalHeight = modalRef.current?.offsetHeight || 320;
    const farEnough = distance > modalHeight * 0.35;
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

  if (!mounted || !isMobile || !description) return null;

  const rows = [
    { key: 'year', label: t('triller.infoYear', 'Yil'), value: description.year },
    { key: 'country', label: t('triller.infoCountry', 'Davlat'), value: description.country },
    { key: 'genre', label: t('triller.infoGenre', 'Janr'), value: description.genre },
  ].filter((row) => row.value);

  const sheetStyle =
    dragging || translateY > 0 ? { transform: `translateY(${translateY}px)` } : undefined;

  const closeFromOverlay = (e) => {
    if (e.target === e.currentTarget) requestClose();
  };

  return createPortal(
    <div
      className={`triller-info-modal-overlay${visible ? ' is-visible' : ''}`}
      onClick={closeFromOverlay}
      onTouchEnd={closeFromOverlay}
      role="presentation"
    >
      <div
        ref={modalRef}
        className={[
          'triller-info-modal',
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
        aria-label={t('triller.infoTitle', 'Triller haqida')}
      >
        <div
          ref={dragZoneRef}
          className="triller-info-modal-drag-zone"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          <div className="triller-info-modal-handle" />
          <h3 className="triller-info-modal-title">{t('triller.infoTitle', 'Triller haqida')}</h3>
        </div>
        <div className="triller-info-modal-body">
          {description.text ? <p className="triller-info-modal-text">{description.text}</p> : null}
          {rows.length > 0 ? (
            <dl className="triller-info-specs">
              {rows.map((row) => (
                <div className="triller-info-spec-row" key={row.key}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TrillerInfoModal;
