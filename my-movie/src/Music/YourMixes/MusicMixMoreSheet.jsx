import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import ShareButton from '../../components/ShareButton/ShareButton';
import { useNarrowLayout } from './MusicDetailMixSheet';
import './MusicMixMoreSheet.css';

const CLOSE_RATIO = 0.3;
const CLOSE_MS = 280;

/**
 * Mix ⋯ menyusi.
 * Desktop: o‘rtadan. Mobil: pastdan, pastga ~30% tortilsa yopiladi.
 */
const MusicMixMoreSheet = ({ open, onClose, label, musicId, mixGenre }) => {
  const { t } = useTranslation();
  const narrow = useNarrowLayout();
  const panelRef = useRef(null);
  const dragRef = useRef(null);
  const closeTimerRef = useRef(null);
  const [entered, setEntered] = useState(false);
  const [closing, setClosing] = useState(false);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  const title = t('music.mixGenreLine', {
    genre: label,
    defaultValue: '{{genre}} janerdagi mixlar',
  });
  const sharePath = musicId != null && mixGenre
    ? `/music/${musicId}?mix=${encodeURIComponent(mixGenre)}`
    : '';

  const finishClose = () => {
    setClosing(false);
    setEntered(false);
    setOffset(0);
    setDragging(false);
    onClose?.();
  };

  const requestClose = () => {
    if (closing) return;
    setDragging(false);
    setClosing(true);
    if (narrow) {
      const height = panelRef.current?.offsetHeight || 240;
      setOffset(height);
    }
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(finishClose, CLOSE_MS);
  };

  useEffect(() => () => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    setClosing(false);
    setEntered(false);
    if (narrow) {
      const height = panelRef.current?.offsetHeight || 240;
      setOffset(height);
    }
  }, [open, narrow]);

  useEffect(() => {
    if (!open) return undefined;
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setOffset(0);
        setEntered(true);
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [open, narrow]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') requestClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, narrow, closing]);

  useEffect(() => {
    if (!dragging) return undefined;
    const onMove = (event) => {
      const start = dragRef.current;
      if (!start || event.pointerId !== start.id) return;
      setOffset(Math.max(0, event.clientY - start.y));
    };
    const onUp = (event) => {
      const start = dragRef.current;
      if (!start || event.pointerId !== start.id) return;
      dragRef.current = null;
      setDragging(false);
      const height = panelRef.current?.offsetHeight || 240;
      const traveled = Math.max(0, event.clientY - start.y);
      if (traveled >= height * CLOSE_RATIO) {
        setClosing(true);
        setOffset(height);
        if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = window.setTimeout(finishClose, CLOSE_MS);
        return;
      }
      setOffset(0);
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
    if (!narrow || closing || event.button > 0) return;
    dragRef.current = { y: event.clientY, id: event.pointerId };
    setDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  if (!open && !closing) return null;
  if (typeof document === 'undefined') return null;

  const panelStyle = narrow ? { transform: `translateY(${offset}px)` } : undefined;

  return createPortal(
    <div
      className={[
        'music-mix-more-overlay',
        entered && !closing ? 'is-open' : '',
        closing ? 'is-closing' : '',
      ].filter(Boolean).join(' ')}
      onClick={requestClose}
    >
      <div
        ref={panelRef}
        className={[
          'music-mix-more-panel',
          narrow ? 'is-sheet' : 'is-center',
          dragging ? 'is-dragging' : '',
        ].filter(Boolean).join(' ')}
        style={panelStyle}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        {narrow && (
          <div
            className="music-mix-more-grip"
            onPointerDown={onGripDown}
            role="separator"
            aria-orientation="horizontal"
          >
            <span />
          </div>
        )}
        <div className="music-mix-more-actions">
          <ShareButton
            movie={{ id: musicId, title }}
            sharePath={sharePath || undefined}
            dropdownInPortal
            icon="send"
            label={t('music.mixSharePlaylist', 'Playlistni ulashish')}
            className="music-mix-more-share"
            buttonClassName="music-mix-more-action"
          />
          <button type="button" className="music-mix-more-action music-mix-more-save">
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
              />
            </svg>
            <span>{t('music.mixSave', 'Saqlash')}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default MusicMixMoreSheet;
