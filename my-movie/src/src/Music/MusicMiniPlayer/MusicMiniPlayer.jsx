import React from 'react';
import styles from './MusicMiniPlayer.module.css';

const MusicMiniPlayer = ({
  music,
  artist,
  dominantColor,
  getTitle,
  getLyricsText,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  isRepeat,
  isShuffle,
  onProgressClick,
  onVolumeChange,
  onVolumeIconClick,
  onTogglePlay,
  onPrevTrack,
  onNextTrack,
  onToggleShuffle,
  onToggleRepeat,
  onRowClick,
  onLyricsClick,
}) => {
  const formatTime = (sec) => {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const hasLyrics = music?.lyricsText && getLyricsText && getLyricsText(music.lyricsText)?.trim();

  return (
    <div
      className={`${styles.miniPlayer} ${dominantColor ? styles.hasDominantColor : ''}`}
      style={
        dominantColor && typeof dominantColor.r === 'number'
          ? {
              '--dominant-r': dominantColor.r,
              '--dominant-g': dominantColor.g,
              '--dominant-b': dominantColor.b,
            }
          : undefined
      }
    >
      <div className={styles.miniPlayerRow} onClick={onRowClick}>
        <div className={styles.miniInfo}>
          <img
            src={music?.img || '/img/movie1.jpg'}
            alt={getTitle(music)}
            className={styles.miniImg}
          />
          <div className={styles.miniText}>
            <span className={styles.miniTitle}>{getTitle(music)}</span>
            <span className={styles.miniArtist}>{artist?.name || ''}</span>
          </div>
        </div>
        <div className={styles.miniPlayerInner}>
          <div className={styles.progressWrap}>
            <span className={styles.time}>{formatTime(currentTime)}</span>
            <div
              className={styles.progressBar}
              onClick={(e) => {
                e.stopPropagation();
                onProgressClick?.(e);
              }}
            >
              <div
                className={styles.progressFill}
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
            <span className={styles.time}>{formatTime(duration)}</span>
          </div>
          <div className={styles.controls}>
            <button
              className={`${styles.btn} ${styles.shuffleBtn} ${isShuffle ? styles.active : ''}`}
              onClick={(e) => { e.stopPropagation(); onToggleShuffle(); }}
              aria-label={isShuffle ? "Aralash o'chirish" : 'Aralash'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
              </svg>
            </button>
            <button className={styles.btn} onClick={(e) => { e.stopPropagation(); onPrevTrack(); }} aria-label="Oldingi trek">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" />
              </svg>
            </button>
            <button
              className={`${styles.btn} ${styles.playBtn}`}
              onClick={(e) => {
                e.stopPropagation();
                onTogglePlay();
              }}
              aria-label={isPlaying ? 'Pauza' : 'Ijro etish'}
            >
              {isPlaying ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21" />
                </svg>
              )}
            </button>
            <button className={styles.btn} onClick={(e) => { e.stopPropagation(); onNextTrack(); }} aria-label="Keyingi trek">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" />
              </svg>
            </button>
            <button
              className={`${styles.btn} ${styles.repeatBtn} ${isRepeat ? styles.active : ''}`}
              onClick={(e) => { e.stopPropagation(); onToggleRepeat(); }}
              aria-label={isRepeat ? "Takror o'chirish" : 'Takror'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
              </svg>
            </button>
          </div>
        </div>
        <div className={styles.volumeWrap}>
          {hasLyrics && (
            <button
              type="button"
              className={styles.lyricsBtn}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onLyricsClick?.();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label="Lyrics"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2h2v2a5 5 0 0 0 10 0v-2h2z" />
                <path d="M5 16v2h14v-2H5z" />
              </svg>
            </button>
          )}
          <div className={styles.volume}>
            <button
              className={`${styles.volumeBtn} ${isMuted ? styles.muted : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onVolumeIconClick?.();
              }}
              aria-label={isMuted ? "Ovozni yoqish" : "Ovozni o'chirish"}
            >
              {isMuted ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
              )}
            </button>
            <input
              type="range"
              className={styles.volumeBar}
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                e.stopPropagation();
                onVolumeChange?.(e);
              }}
              onClick={(e) => e.stopPropagation()}
              aria-label="Ovoz"
              style={{
                background: `linear-gradient(to right, rgba(192, 78, 221, 0.9) 0%, rgba(192, 78, 221, 0.9) ${(isMuted ? 0 : volume) * 100}%, rgba(255, 255, 255, 0.2) ${(isMuted ? 0 : volume) * 100}%, rgba(255, 255, 255, 0.2) 100%)`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicMiniPlayer;
