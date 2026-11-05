import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import './ChanelModalFilter.css';

const MOTION_MS = 280;

const ChanelModalFilter = ({ onClose, children }) => {
  const { t } = useTranslation();
  const panelRef = useRef(null);
  const dragRef = useRef(null);
  const closingRef = useRef(false);
  const [viewport, setViewport] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }));
  const [entered, setEntered] = useState(false);
  const [phase, setPhase] = useState('half');
  const [dragOffset, setDragOffset] = useState(null);
  const mobile = viewport.width < 768;
  const middle = Math.round(viewport.height * 0.5);
  const offset = dragOffset ?? (entered ? (phase === 'full' ? 0 : middle) : viewport.height);

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    dragRef.current = null;
    setDragOffset(null);
    setPhase('closing');
    setEntered(false);
  }, []);

  useEffect(() => {
    let secondFrame;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => setEntered(true));
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, []);

  useEffect(() => {
    if (phase !== 'closing') return undefined;
    const timer = window.setTimeout(onClose, MOTION_MS);
    return () => window.clearTimeout(timer);
  }, [phase, onClose]);

  useEffect(() => {
    const resize = () => {
      dragRef.current = null;
      setDragOffset(null);
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const root = document.documentElement;
    const body = document.body;
    const rootOverflow = root.style.overflow;
    const bodyOverflow = body.style.overflow;
    root.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    panelRef.current?.focus();
    const onKey = (event) => {
      if (event.key === 'Escape') requestClose();
      if (event.key !== 'Tab') return;
      const panel = panelRef.current;
      const items = [...panel.querySelectorAll('button, a[href], input, select, textarea, [tabindex="0"]')]
        .filter((item) => !item.disabled && item.getClientRects().length);
      const first = items[0];
      const last = items[items.length - 1];
      if (!first) {
        event.preventDefault();
        panel.focus();
      } else if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panel)) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      root.style.overflow = rootOverflow;
      body.style.overflow = bodyOverflow;
      document.removeEventListener('keydown', onKey);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [requestClose]);

  const startDrag = (event) => {
    if (!mobile || closingRef.current || event.button > 0 || event.target.closest('button')) return;
    dragRef.current = { id: event.pointerId, y: event.clientY, origin: offset, phase };
    setDragOffset(offset);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event) => {
    const start = dragRef.current;
    if (!start || start.id !== event.pointerId) return;
    setDragOffset(Math.min(viewport.height, Math.max(0, start.origin + event.clientY - start.y)));
  };

  const finishDrag = (event) => {
    const start = dragRef.current;
    if (!start || start.id !== event.pointerId) return;
    dragRef.current = null;
    setDragOffset(null);
    if (event.type === 'pointercancel') return;
    const next = Math.max(0, start.origin + event.clientY - start.y);
    if (start.phase === 'full') {
      setPhase(next >= viewport.height * 0.1 ? 'half' : 'full');
    } else if (next <= middle - viewport.height * 0.1) {
      setPhase('full');
    } else if (next >= middle + Math.max(viewport.height - middle, middle) * 0.3) {
      requestClose();
    }
  };

  return createPortal(
    <div
      className={`chanel-filter-overlay${entered ? ' is-open' : ''}`}
      onClick={(event) => { if (event.target === event.currentTarget) requestClose(); }}
    >
      <section
        ref={panelRef}
        className={`chanel-filter-modal${phase === 'full' ? ' is-full' : ''}${dragOffset != null ? ' is-dragging' : ''}`}
        style={mobile ? { top: `${offset}px` } : undefined}
        role="dialog"
        aria-modal="true"
        aria-labelledby="chanel-filter-title"
        tabIndex={-1}
      >
        <header
          className="chanel-filter-header"
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
        >
          <div className="chanel-filter-grip" aria-hidden="true"><span /></div>
          <div className="chanel-filter-heading">
            <h2 id="chanel-filter-title">{t('channel.filter', 'Filterlash')}</h2>
            <button type="button" className="chanel-filter-close" aria-label={t('common.close', 'Yopish')} onClick={requestClose}>
              <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </header>
        <div className="chanel-filter-body">{children}</div>
      </section>
    </div>,
    document.body
  );
};

export default ChanelModalFilter;
