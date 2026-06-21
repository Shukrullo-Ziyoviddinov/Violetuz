import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styles from './MusicPlayerModal.module.css';
import ImgButtonVisual from '../Visual/imgButtonVisual';
import CardVisual from '../Visual/cardVisual';

const MusicPlayerModal = ({
  isOpen,
  onClose,
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
  onTogglePlay,
  onPrevTrack,
  onNextTrack,
  onToggleRepeat,
  onToggleShuffle,
  onProgressClick,
  onVolumeChange,
  onVolumeIconClick,
  onLyricsClick,
  trendList = [],
  onTrackSelect,
  artists = [],
  toggleWishlist,
  isInWishlist,
  bass = 0.5,
  treble = 0.5,
  onBassChange,
  onTrebleChange,
  analyserRef,
  audioGraphReady,
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [isEntered, setIsEntered] = useState(false);
  const [showAudioControls, setShowAudioControls] = useState(false);
  const [showLyricsInArtwork, setShowLyricsInArtwork] = useState(false);
  const [showTrendGrid, setShowTrendGrid] = useState(false);
  const [internalBass, setInternalBass] = useState(0.5);
  const [internalTreble, setInternalTreble] = useState(0.5);
  const [isClassic, setIsClassic] = useState(false);
  const bassVal = onBassChange ? bass : internalBass;
  const trebleVal = onTrebleChange ? treble : internalTreble;
  const setBassVal = onBassChange ? onBassChange : setInternalBass;
  const setTrebleVal = onTrebleChange ? onTrebleChange : setInternalTreble;
  const [bassLocked, setBassLocked] = useState(false);
  const [trebleLocked, setTrebleLocked] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      setShowAudioControls(false);
      setShowLyricsInArtwork(false);
      setShowTrendGrid(false);
      document.body.style.overflow = 'hidden';
      const raf = requestAnimationFrame(() => setIsEntered(true));
      return () => {
        document.body.style.overflow = '';
        cancelAnimationFrame(raf);
      };
    }
    setIsEntered(false);
  }, [isOpen]);

  useEffect(() => {
    return () => { document.body.style.overflow = ''; };
  }, []);


  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(onClose, 280);
  }, [onClose, isClosing]);

  const formatTime = (sec) => {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const modalContent = (
    <div className={`${styles.overlay} ${isEntered ? styles.entered : ''} ${isClosing ? styles.closing : ''}`} onClick={handleClose}>
      <div
        className={`${styles.modal} ${isEntered ? styles.entered : ''} ${isClosing ? styles.closing : ''}`}
        style={
          dominantColor && typeof dominantColor.r === 'number' && typeof dominantColor.g === 'number' && typeof dominantColor.b === 'number'
            ? {
                background: `linear-gradient(180deg, rgba(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b}, 0.9) 0%, rgba(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b}, 0.85) 35%, rgba(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b}, 0.8) 65%, rgb(28, 22, 36) 100%)`,
                border: `1px solid rgba(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b}, 0.5)`,
              }
            : undefined
        }
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className={styles.close}
          onClick={handleClose}
          aria-label="Yopish"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
          </svg>
        </button>

        <div className={`${styles.artwork} ${showAudioControls ? styles.showControls : ''} ${showLyricsInArtwork ? styles.showLyrics : ''} ${showTrendGrid ? styles.showTrendGrid : ''}`}>
          <img
            src={music?.img || '/img/movie1.jpg'}
            alt={getTitle(music)}
          />
          {!showAudioControls && !showLyricsInArtwork && !showTrendGrid && analyserRef && (
            <ImgButtonVisual analyserRef={analyserRef} isPlaying={isPlaying} audioGraphReady={audioGraphReady} />
          )}
          {trendList.length > 0 && (
            <div className={styles.artworkTrendGrid}>
              {trendList.map((item) => {
                const itemArtist = artists.find((a) => a.id === item.artistId);
                const isActive = item.id === music?.id;
                return (
                  <div
                    key={item.id}
                    className={`${styles.trendCard} ${isActive ? styles.active : ''}`}
                    onClick={() => onTrackSelect?.(item)}
                  >
                    <div className={styles.trendCardImgWrap}>
                      <img
                        src={item.img || '/img/movie1.jpg'}
                        alt={getTitle(item)}
                        className={styles.trendCardImg}
                      />
                    </div>
                    <div className={styles.trendCardInfo}>
                      <span className={styles.trendCardTitle}>{getTitle(item)}</span>
                      {itemArtist && <span className={styles.trendCardArtist}>{itemArtist.name}</span>}
                    </div>
                    {isActive && analyserRef && (
                      <div className={styles.trendCardVisual}>
                        <CardVisual
                          analyserRef={analyserRef}
                          isPlaying={isPlaying}
                          audioGraphReady={audioGraphReady}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {music?.lyricsText && getLyricsText && (() => {
            const text = getLyricsText(music.lyricsText) || '';
            if (!text.trim()) return null;
            return (
              <div className={styles.artworkLyrics} key="lyrics">
                {text.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            );
          })()}
          <div className={styles.audioControls}>
            <h4 className={styles.controlsTitle}>Ovozni o&apos;zgartirish</h4>
            <div className={styles.controlRow}>
              <span className={styles.controlLabel}>Bass</span>
              <div className={styles.controlSliderWrap}>
                <input
                  type="range"
                  className={styles.controlSlider}
                  min="0"
                  max="100"
                  value={bassVal * 100}
                  onChange={(e) => !bassLocked && setBassVal(parseFloat(e.target.value) / 100)}
                  disabled={bassLocked}
                  style={{
                    background: `linear-gradient(to right, rgba(155, 79, 231, 0.9) 0%, rgba(155, 79, 231, 0.9) ${bassVal * 100}%, rgba(255, 255, 255, 0.2) ${bassVal * 100}%, rgba(255, 255, 255, 0.2) 100%)`,
                  }}
                />
                <button
                  type="button"
                  className={`${styles.controlLock} ${bassLocked ? styles.locked : ''}`}
                  onClick={() => setBassLocked((v) => !v)}
                  aria-label={bassLocked ? 'Qulfdan ochish' : 'Qulflash'}
                >
                  {bassLocked ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className={styles.controlRow}>
              <span className={styles.controlLabel}>Treble</span>
              <div className={styles.controlSliderWrap}>
                <input
                  type="range"
                  className={styles.controlSlider}
                  min="0"
                  max="100"
                  value={trebleVal * 100}
                  onChange={(e) => !trebleLocked && setTrebleVal(parseFloat(e.target.value) / 100)}
                  disabled={trebleLocked}
                  style={{
                    background: `linear-gradient(to right, rgba(155, 79, 231, 0.9) 0%, rgba(155, 79, 231, 0.9) ${trebleVal * 100}%, rgba(255, 255, 255, 0.2) ${trebleVal * 100}%, rgba(255, 255, 255, 0.2) 100%)`,
                  }}
                />
                <button
                  type="button"
                  className={`${styles.controlLock} ${trebleLocked ? styles.locked : ''}`}
                  onClick={() => setTrebleLocked((v) => !v)}
                  aria-label={trebleLocked ? 'Qulfdan ochish' : 'Qulflash'}
                >
                  {trebleLocked ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <button
              type="button"
              className={`${styles.classicBtn} ${isClassic ? styles.active : ''}`}
              onClick={() => {
                setIsClassic((v) => !v);
                if (!isClassic) {
                  setBassVal(0.65);
                  setTrebleVal(0.4);
                } else {
                  setBassVal(0.5);
                  setTrebleVal(0.5);
                }
              }}
              aria-label="Classic"
            >
              Classic
            </button>
            <div className={`${styles.volume} ${styles.volumeInControls}`}>
              <button
                className={`${styles.volumeBtn} ${isMuted ? styles.muted : ''}`}
                onClick={onVolumeIconClick}
                aria-label={isMuted ? "Ovozni yoqish" : "Ovozni o'chirish"}
              >
                {isMuted ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
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
                onChange={onVolumeChange}
                aria-label="Ovoz"
                style={{
                  background: `linear-gradient(to right, rgba(155, 79, 231, 0.9) 0%, rgba(155, 79, 231, 0.9) ${(isMuted ? 0 : volume) * 100}%, rgba(255, 255, 255, 0.2) ${(isMuted ? 0 : volume) * 100}%, rgba(255, 255, 255, 0.2) 100%)`,
                }}
              />
            </div>
          </div>
        </div>

        <div className={styles.info}>
          <div className={styles.infoText}>
            <h2 className={styles.title}>{getTitle(music)}</h2>
            <p className={styles.artist}>{artist?.name || ''}</p>
          </div>
          {toggleWishlist && (
            <button
              type="button"
              className={`${styles.wishlistBtn} ${(music?.albumId ? isInWishlist?.(music.albumId, 'album') : isInWishlist?.(music?.id, 'music')) ? styles.active : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                if (music?.albumId) {
                  toggleWishlist(music.albumId, 'album');
                } else if (music?.id) {
                  toggleWishlist(music.id, 'music');
                }
              }}
              aria-label="Sevimlilarga qo'shish"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill={(music?.albumId ? isInWishlist?.(music.albumId, 'album') : isInWishlist?.(music?.id, 'music')) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
          )}
        </div>

        <div className={styles.progress}>
          <div
            className={styles.progressBar}
            onClick={onProgressClick}
          >
            <div
              className={styles.progressFill}
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
          <div className={styles.times}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className={styles.controls}>
          <button
            className={`${styles.btn} ${isShuffle ? styles.active : ''}`}
            onClick={onToggleShuffle}
            aria-label={isShuffle ? "Aralash o'chirish" : 'Aralash'}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
            </svg>
          </button>
          <button className={styles.btn} onClick={onPrevTrack} aria-label="Oldingi trek">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" />
            </svg>
          </button>
          <button
            className={`${styles.btn} ${styles.playBtn}`}
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Pauza' : 'Ijro etish'}
          >
            {isPlaying ? (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21" />
              </svg>
            )}
          </button>
          <button className={styles.btn} onClick={onNextTrack} aria-label="Keyingi trek">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" />
            </svg>
          </button>
          <button
            className={`${styles.btn} ${isRepeat ? styles.active : ''}`}
            onClick={onToggleRepeat}
            aria-label={isRepeat ? "Takror o'chirish" : 'Takror'}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
            </svg>
          </button>
        </div>

        <div className={styles.lyricsRow}>
          <button
            className={`${styles.artworkToggle} ${showAudioControls ? styles.active : ''}`}
            onClick={() => {
              setShowLyricsInArtwork(false);
              setShowAudioControls((v) => !v);
            }}
            aria-label={showAudioControls ? "Albom rasmini ko'rsatish" : "Ovozni o'zgartirish"}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 17v2h6v-2H3zm0-6v2h10v-2H3zm0-6v2h14V5H3zm18 12v2h-4v-2h4zm0-6v2h-4v-2h4zm0-6v2h-4V5h4z" />
            </svg>
          </button>
          {music?.lyricsText && getLyricsText && (getLyricsText(music.lyricsText) || '').trim() && (
            <button
              className={`${styles.lyricsBtn} ${showLyricsInArtwork ? styles.active : ''}`}
              onClick={() => {
                setShowAudioControls(false);
                setShowTrendGrid(false);
                setShowLyricsInArtwork((v) => !v);
              }}
              aria-label="Lyrics"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2h2v2a5 5 0 0 0 10 0v-2h2z" />
                <path d="M5 16v2h14v-2H5z" />
              </svg>
              <span>Lyrics</span>
            </button>
          )}
          {trendList.length > 0 && (
            <button
              className={`${styles.trendToggle} ${showTrendGrid ? styles.active : ''}`}
              onClick={() => {
                setShowAudioControls(false);
                setShowLyricsInArtwork(false);
                setShowTrendGrid((v) => !v);
              }}
              aria-label="Musiqalar ro'yxati"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return createPortal(modalContent, document.body);
};

export default MusicPlayerModal;
