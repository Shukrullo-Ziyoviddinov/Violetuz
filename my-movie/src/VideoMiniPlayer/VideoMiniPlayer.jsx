import React, { useCallback, useEffect, useRef } from 'react';
import './VideoMiniPlayer.css';

const OpenIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path
      d="M14 5h5v5M19 5l-8 8M10 19H5v-5M5 19l8-8"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path
      d="M6 6l12 12M18 6L6 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path d="M8 5v14l11-7z" fill="currentColor" />
  </svg>
);

const PauseIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path d="M6 5h4v14H6zM14 5h4v14h-4z" fill="currentColor" />
  </svg>
);

const readDockBounds = (el) => {
  const rect = el.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const sideInset = isMobile ? 10 : 16;
  const musicOpen = document.body.classList.contains('mini-player-visible');
  const nav = document.querySelector('.navbar-container');
  const navBottom = nav ? Math.max(0, nav.getBoundingClientRect().bottom) : 0;
  const minTop = Math.max(77, navBottom);
  const bottomInset = isMobile
    ? (musicOpen ? 84 + 76 : 77)
    : (musicOpen ? 104 : 16);
  const maxTop = Math.max(minTop, viewportHeight - rect.height - bottomInset);
  const leftX = sideInset;
  const rightX = Math.max(sideInset, viewportWidth - rect.width - sideInset);
  return { minTop, maxTop, leftX, rightX };
};

const VideoMiniPlayer = ({
  title,
  artistName,
  playing,
  progress,
  onRegisterSlot,
  onClose,
  onOpenDetail,
  onTogglePlay,
}) => {
  const shellRef = useRef(null);
  const dragRef = useRef(null);
  const sideRef = useRef('right');
  const draggedRef = useRef(false);

  const setSlot = useCallback(
    (node) => {
      onRegisterSlot(node);
    },
    [onRegisterSlot]
  );

  useEffect(() => {
    const el = shellRef.current;
    if (!el) return undefined;

    const onDown = (event) => {
      if (event.button != null && event.button !== 0) return;
      if (event.target.closest('.video-mini-player-btn')) return;
      const rect = el.getBoundingClientRect();
      dragRef.current = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        left: rect.left,
        top: rect.top,
        moved: false,
      };
      el.setPointerCapture(event.pointerId);
    };

    const onMove = (event) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.id) return;
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) < 6) return;
      drag.moved = true;
      draggedRef.current = true;
      const bounds = readDockBounds(el);
      const left = Math.min(bounds.rightX, Math.max(bounds.leftX, drag.left + dx));
      const top = Math.min(bounds.maxTop, Math.max(bounds.minTop, drag.top + dy));
      el.classList.add('is-dragging');
      el.classList.remove('is-settling');
      el.style.right = 'auto';
      el.style.bottom = 'auto';
      el.style.left = `${left}px`;
      el.style.top = `${top}px`;
    };

    const onUp = (event) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.id) return;
      dragRef.current = null;
      if (el.hasPointerCapture(event.pointerId)) el.releasePointerCapture(event.pointerId);
      if (!drag.moved) return;

      const bounds = readDockBounds(el);
      const rect = el.getBoundingClientRect();
      const movedLeft = drag.left - rect.left;
      const maxTravel = Math.max(0, bounds.rightX - bounds.leftX);
      const halfScreen = window.innerWidth * 0.5;
      const threshold = halfScreen < maxTravel ? halfScreen : maxTravel * 0.5;
      let side = sideRef.current;
      if (side === 'right' && movedLeft > threshold) side = 'left';
      else if (side === 'left' && movedLeft < -threshold) side = 'right';
      sideRef.current = side;

      const dockLeft = side === 'left' ? bounds.leftX : bounds.rightX;
      const top = Math.min(bounds.maxTop, Math.max(bounds.minTop, rect.top));
      el.classList.remove('is-dragging');
      el.classList.add('is-settling');
      el.style.left = `${dockLeft}px`;
      el.style.top = `${top}px`;
    };

    const onClickCapture = (event) => {
      if (!draggedRef.current) return;
      event.preventDefault();
      event.stopPropagation();
      draggedRef.current = false;
    };

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    el.addEventListener('click', onClickCapture, true);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      el.removeEventListener('click', onClickCapture, true);
    };
  }, []);

  const openFromStage = (event) => {
    if (draggedRef.current) return;
    if (event.target.closest('button')) return;
    if (!window.matchMedia('(max-width: 768px)').matches) return;
    onOpenDetail();
  };

  const ratio = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;

  return (
    <aside ref={shellRef} className="video-mini-player" aria-label="Faol video">
      <div className="video-mini-player-stage" onClick={openFromStage}>
        <div ref={setSlot} className="video-mini-player-slot" />
        <div className="video-mini-player-progress" aria-hidden="true">
          <span style={{ width: `${ratio * 100}%` }} />
        </div>
        <div className="video-mini-player-chrome">
          <button
            type="button"
            className="video-mini-player-btn video-mini-player-open"
            aria-label="Video sahifasiga o'tish"
            onClick={(event) => {
              event.stopPropagation();
              onOpenDetail();
            }}
          >
            <OpenIcon />
          </button>
          <button
            type="button"
            className="video-mini-player-btn video-mini-player-toggle"
            aria-label={playing ? 'Pauza' : 'Ijro'}
            onClick={(event) => {
              event.stopPropagation();
              onTogglePlay();
            }}
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button
            type="button"
            className="video-mini-player-btn video-mini-player-play"
            aria-label={playing ? 'Pauza' : 'Ijro'}
            onClick={(event) => {
              event.stopPropagation();
              onTogglePlay();
            }}
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button
            type="button"
            className="video-mini-player-btn video-mini-player-close"
            aria-label="Videoni yopish"
            onClick={(event) => {
              event.stopPropagation();
              onClose();
            }}
          >
            <CloseIcon />
          </button>
        </div>
      </div>
      <button
        type="button"
        className="video-mini-player-meta"
        onClick={() => {
          if (draggedRef.current) return;
          onOpenDetail();
        }}
      >
        <span className="video-mini-player-title">{title}</span>
        {artistName ? <span className="video-mini-player-artist">{artistName}</span> : null}
      </button>
    </aside>
  );
};

export default VideoMiniPlayer;
