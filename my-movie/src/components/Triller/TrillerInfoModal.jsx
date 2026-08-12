import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import './TrillerInfoModal.css';

const MOBILE_MAX = 900;
const DRAG_THRESHOLD = 8;
const FLICK_MS = 280;
const FLICK_MIN_PX = 48;

/**
 * Faqat mobil: pastdan ochiladigan description modal.
 * Drag: 35% pastga → yopiladi; kamroq → qaytadi.
 * Tez flick (bosib turmasdan) → 35% bo‘lmasa ham yopiladi.
 */
const TrillerInfoModal = ({ open, onClose, description }) => {
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= MOBILE_MAX
  );
  const [translateY, setTranslateY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const modalRef = useRef(null);
  const startYRef = useRef(null);
  const lastYRef = useRef(null);
  const startTimeRef = useRef(0);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= MOBILE_MAX);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!open || !isMobile) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, isMobile]);

  useEffect(() => {
    if (!open) {
      setTranslateY(0);
      setDragging(false);
      startYRef.current = null;
    }
  }, [open]);

  const handleTouchStart = (e) => {
    const y = e.touches[0].clientY;
    startYRef.current = y;
    lastYRef.current = y;
    startTimeRef.current = performance.now();
    setDragging(false);
  };

  const handleTouchMove = useCallback((e) => {
    if (startYRef.current == null) return;
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
    if (startYRef.current == null) return;
    const distance = Math.max(0, (lastYRef.current ?? startYRef.current) - startYRef.current);
    const duration = performance.now() - startTimeRef.current;
    const modalHeight = modalRef.current?.offsetHeight || 320;
    const farEnough = distance > modalHeight * 0.35;
    const isFlick = duration < FLICK_MS && distance > FLICK_MIN_PX;

    if (farEnough || isFlick) {
      onClose?.();
    }

    setDragging(false);
    setTranslateY(0);
    startYRef.current = null;
    lastYRef.current = null;
  };

  useEffect(() => {
    const el = modalRef.current;
    if (!el || !open || !isMobile) return undefined;
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => el.removeEventListener('touchmove', handleTouchMove);
  }, [open, isMobile, handleTouchMove]);

  if (!open || !isMobile || !description) return null;

  const rows = [
    { key: 'year', label: t('triller.infoYear', 'Yil'), value: description.year },
    { key: 'country', label: t('triller.infoCountry', 'Davlat'), value: description.country },
    { key: 'genre', label: t('triller.infoGenre', 'Janr'), value: description.genre },
  ].filter((row) => row.value);

  return createPortal(
    <div
      className="triller-info-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      role="presentation"
    >
      <div
        ref={modalRef}
        className={`triller-info-modal${dragging ? ' is-dragging' : ''}`}
        style={{ transform: `translateY(${translateY}px)` }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        role="dialog"
        aria-modal="true"
        aria-label={t('triller.infoTitle', 'Triller haqida')}
      >
        <div className="triller-info-modal-drag-zone">
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
