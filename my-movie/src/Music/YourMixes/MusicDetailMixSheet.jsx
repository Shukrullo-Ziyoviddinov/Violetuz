import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import MusicMixControls from './MusicMixControls';
import './MusicDetailMixSheet.css';

const CLOSE_RATIO = 0.3;
const EXPAND_RATIO = 0.1;
const NARROW_QUERY = '(max-width: 900px)';

const viewportHeight = () => (typeof window === 'undefined' ? 0 : window.innerHeight);
const halfOffset = () => {
  const viewport = viewportHeight();
  const fallback = Math.round(viewport * 0.5);
  const img = document.querySelector('.music-detail-left .music-detail-image');
  if (!img) return fallback;
  const rect = img.getBoundingClientRect();
  if (rect.height < 40) return fallback;
  const top = Math.round(rect.bottom);
  if (top < 80 || top > viewport * 0.85) return fallback;
  return top;
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
 * Mobil: mix varag‘i avval sahifaning yarmida.
 * Yuqoriga ~10% tortilsa butun ekranga chiqadi.
 * To‘liq holatdan pastga tortilsa yopilmaydi, o‘rtaga tushadi.
 * O‘rtadan pastga ~30% tortilsa yopiladi.
 */
const MusicDetailMixSheet = ({
  label,
  busy,
  dominantColor,
  repeat,
  shuffle,
  onToggleRepeat,
  onToggleShuffle,
  children,
}) => {
  const { t } = useTranslation();
  const panelRef = useRef(null);
  const dragRef = useRef(null);
  const [phase, setPhase] = useState('half');
  const [offset, setOffset] = useState(halfOffset);
  const [dragging, setDragging] = useState(false);

  const title = t('music.mixGenreLine', {
    genre: label,
    defaultValue: '{{genre}} janerdagi mixlar',
  });

  useLayoutEffect(() => {
    if (phase !== 'half' || dragging) return;
    setOffset(halfOffset());
  }, [phase, dragging]);

  useEffect(() => {
    document.body.classList.add('music-mix-sheet-active');
    return () => document.body.classList.remove('music-mix-sheet-active');
  }, []);

  const openSheet = () => {
    const viewport = viewportHeight();
    setPhase('half');
    setOffset(viewport);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setOffset(halfOffset()));
    });
  };

  const finishDrag = (clientY) => {
    const start = dragRef.current;
    dragRef.current = null;
    setDragging(false);
    if (!start) return;
    const viewport = viewportHeight();
    const middle = halfOffset();
    const next = Math.min(viewport, Math.max(0, start.origin + (clientY - start.y)));
    const expandDistance = viewport * EXPAND_RATIO;

    if (start.snap === 'full') {
      if (next >= expandDistance) {
        setPhase('half');
        setOffset(middle);
        return;
      }
      setPhase('full');
      setOffset(0);
      return;
    }

    if (next <= middle - expandDistance) {
      setPhase('full');
      setOffset(0);
      return;
    }
    const visible = Math.max(viewport - middle, middle);
    if (next >= middle + visible * CLOSE_RATIO) {
      setPhase('closing');
      setOffset(viewport);
      return;
    }
    setPhase('half');
    setOffset(middle);
  };

  useEffect(() => {
    if (phase !== 'closing') return undefined;
    const timer = window.setTimeout(() => {
      setPhase('dock');
    }, 320);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (!dragging) return undefined;
    const onMove = (event) => {
      const start = dragRef.current;
      if (!start || event.pointerId !== start.id) return;
      const viewport = viewportHeight();
      const next = start.origin + (event.clientY - start.y);
      setOffset(Math.min(viewport, Math.max(0, next)));
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
    if (phase === 'dock' || phase === 'closing' || event.button > 0) return;
    dragRef.current = {
      y: event.clientY,
      id: event.pointerId,
      origin: offset,
      snap: phase,
    };
    setDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  if (typeof document === 'undefined') return null;

  const panelStyle = { top: `${offset}px` };

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
          <svg className="music-mix-sheet-dock-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M4 6h12v2H4V6zm0 5h12v2H4v-2zm0 5h8v2H4v-2zm12 1.5 5-3.5-5-3.5v7z" />
          </svg>
          <span className="music-mix-sheet-dock-title">{title}</span>
        </button>
      ) : (
        <div
          ref={panelRef}
          className={[
            'music-mix-sheet',
            phase === 'full' ? 'is-full' : '',
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
          <h3 className="music-mix-sheet-title" onPointerDown={onGripDown}>
            {title}
          </h3>
          {!busy && (
            <MusicMixControls
              repeat={repeat}
              shuffle={shuffle}
              onToggleRepeat={onToggleRepeat}
              onToggleShuffle={onToggleShuffle}
            />
          )}
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
