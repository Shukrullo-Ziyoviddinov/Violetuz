import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import './MusicDetailMixSheet.css';

const CLOSE_RATIO = 0.3;
const NARROW_QUERY = '(max-width: 900px)';

const genreLabel = (genre) => {
  const name = String(genre || '').trim();
  if (!name) return '';
  return name.charAt(0).toUpperCase() + name.slice(1);
};

export const useNarrowLayout = () => {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(NARROW_QUERY).matches : false
  );

  useEffect(() => {
    const media = window.matchMedia(NARROW_QUERY);
    const sync = () => setMatches(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  return matches;
};

/**
 * Mobil: mix varag‘i sahifaning yarmigacha.
 * Tutqichdan pastga varaq balandligining ~30% i yopadi.
 * Yopilganda pastda mix nomi qoladi.
 */
const MusicDetailMixSheet = ({ genre, busy, dominantColor, children }) => {
  const { t } = useTranslation();
  const panelRef = useRef(null);
  const dragRef = useRef(null);
  const [phase, setPhase] = useState('open');
  const [shift, setShift] = useState(0);
  const [dragging, setDragging] = useState(false);

  const title = t('music.mixGenreLine', {
    genre: genreLabel(genre),
    defaultValue: '{{genre}} janerdagi mixlar',
  });

  useEffect(() => {
    document.body.classList.add('music-mix-sheet-active');
    return () => document.body.classList.remove('music-mix-sheet-active');
  }, []);

  const openSheet = () => {
    const height = Math.round(window.innerHeight * 0.5);
    setPhase('open');
    setShift(height);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setShift(0));
    });
  };

  const finishDrag = (clientY) => {
    const start = dragRef.current;
    dragRef.current = null;
    setDragging(false);
    if (!start) return;
    const height = panelRef.current?.getBoundingClientRect().height || window.innerHeight * 0.5;
    const traveled = Math.max(0, clientY - start.y);
    if (traveled >= height * CLOSE_RATIO) {
      setShift(height);
      setPhase('closing');
      return;
    }
    setShift(0);
  };

  useEffect(() => {
    if (phase !== 'closing') return undefined;
    const timer = window.setTimeout(() => {
      setPhase('dock');
      setShift(0);
    }, 320);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (!dragging) return undefined;
    const onMove = (event) => {
      const start = dragRef.current;
      if (!start || event.pointerId !== start.id) return;
      setShift(Math.max(0, event.clientY - start.y));
    };
    const onUp = (event) => {
      const start = dragRef.current;
      if (!start || event.pointerId !== start.id) return;
      finishDrag(event.clientY);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [dragging]);

  const onGripDown = (event) => {
    if (phase !== 'open' || event.button > 0) return;
    dragRef.current = { y: event.clientY, id: event.pointerId };
    setDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  if (typeof document === 'undefined') return null;

  const panelStyle = { transform: `translateY(${shift}px)` };

  return createPortal(
    <div className="music-mix-sheet-host">
      {phase === 'dock' ? (
        <button
          type="button"
          className={[
            'music-mix-sheet-dock',
            dominantColor ? 'music-detail-trend-card-active' : '',
          ].filter(Boolean).join(' ')}
          style={
            dominantColor
              ? {
                  '--card-dominant-r': dominantColor.r,
                  '--card-dominant-g': dominantColor.g,
                  '--card-dominant-b': dominantColor.b,
                }
              : undefined
          }
          onClick={openSheet}
        >
          <span className="music-mix-sheet-dock-title">{title}</span>
        </button>
      ) : (
        <div
          ref={panelRef}
          className={[
            'music-mix-sheet',
            dragging ? 'is-dragging' : '',
            busy ? 'is-busy' : '',
          ].filter(Boolean).join(' ')}
          style={panelStyle}
          role="dialog"
          aria-modal="false"
          aria-label={title}
        >
          <div
            className="music-mix-sheet-grip"
            onPointerDown={onGripDown}
            role="separator"
            aria-orientation="horizontal"
            aria-label={title}
          >
            <span />
          </div>
          <h3 className="music-mix-sheet-title">{title}</h3>
          <div className="music-mix-sheet-list" aria-busy={busy || undefined}>
            {children}
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

export default MusicDetailMixSheet;
