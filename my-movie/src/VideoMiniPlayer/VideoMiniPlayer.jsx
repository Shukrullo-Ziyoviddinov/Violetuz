import React, { useCallback } from 'react';
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
  const setSlot = useCallback(
    (node) => {
      onRegisterSlot(node);
    },
    [onRegisterSlot]
  );

  const openFromStage = (event) => {
    if (event.target.closest('button')) return;
    if (!window.matchMedia('(max-width: 768px)').matches) return;
    onOpenDetail();
  };

  const ratio = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;

  return (
    <aside className="video-mini-player" aria-label="Faol video">
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
      <button type="button" className="video-mini-player-meta" onClick={onOpenDetail}>
        <span className="video-mini-player-title">{title}</span>
        {artistName ? <span className="video-mini-player-artist">{artistName}</span> : null}
      </button>
    </aside>
  );
};

export default VideoMiniPlayer;
