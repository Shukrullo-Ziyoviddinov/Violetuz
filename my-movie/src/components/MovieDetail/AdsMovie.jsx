import React, { forwardRef, useRef, useState, useEffect, useImperativeHandle, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useMoviesApi } from '../../context/MoviesApiContext';
import './AdsMovie.css';

const SKIP_AFTER_SECONDS = 10;
const PLAYBACK_ICON_MS = 2000;

const formatAdTime = (seconds) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const AdsMovie = forwardRef(({ videoRef, onVisibilityChange, onAdEnded }, ref) => {
  const { t } = useTranslation();
  const adVideoRef = useRef(null);
  const playbackIconTimerRef = useRef(null);
  const [showAdOverlay, setShowAdOverlay] = useState(false);
  const [adCurrentTime, setAdCurrentTime] = useState(0);
  const [adDuration, setAdDuration] = useState(0);
  const [isAdPlaying, setIsAdPlaying] = useState(false);
  const [playbackIcon, setPlaybackIcon] = useState('play');
  const [showPlaybackIcon, setShowPlaybackIcon] = useState(false);
  const { getActiveAd } = useMoviesApi();
  const activeAd = getActiveAd();
  const playedSeconds = Number.isFinite(adCurrentTime) ? adCurrentTime : 0;
  const skipSecondsLeft = Math.max(0, Math.ceil(SKIP_AFTER_SECONDS - playedSeconds));
  const canSkip = playedSeconds >= SKIP_AFTER_SECONDS;

  const clearPlaybackIconTimer = () => {
    if (playbackIconTimerRef.current) {
      clearTimeout(playbackIconTimerRef.current);
      playbackIconTimerRef.current = null;
    }
  };

  const revealPlaybackIcon = (icon) => {
    setPlaybackIcon(icon);
    setShowPlaybackIcon(true);
    clearPlaybackIconTimer();
    playbackIconTimerRef.current = setTimeout(() => {
      setShowPlaybackIcon(false);
      playbackIconTimerRef.current = null;
    }, PLAYBACK_ICON_MS);
  };

  useEffect(() => () => clearPlaybackIconTimer(), []);

  const showAd = useCallback(() => {
    if (!activeAd || !activeAd.isActive) return;
    if (videoRef?.current) {
      videoRef.current.pause();
    }
    clearPlaybackIconTimer();
    setShowPlaybackIcon(false);
    setIsAdPlaying(false);
    setAdCurrentTime(0);
    setAdDuration(0);
    setShowAdOverlay(true);
    onVisibilityChange?.(true);
    setTimeout(() => {
      if (adVideoRef.current) {
        adVideoRef.current.currentTime = 0;
        adVideoRef.current.play().catch(() => {});
      }
    }, 100);
  }, [activeAd, videoRef, onVisibilityChange]);

  const handleAdEnded = useCallback(() => {
    clearPlaybackIconTimer();
    setShowPlaybackIcon(false);
    setIsAdPlaying(false);
    setAdCurrentTime(0);
    setAdDuration(0);
    setShowAdOverlay(false);
    onVisibilityChange?.(false);
    if (adVideoRef.current) {
      adVideoRef.current.pause();
      adVideoRef.current.currentTime = 0;
    }
    if (videoRef?.current) {
      videoRef.current.play().catch(() => {});
    }
    onAdEnded?.();
  }, [videoRef, onVisibilityChange, onAdEnded]);

  useImperativeHandle(ref, () => ({ showAd }));

  const handleSkipClick = (e) => {
    e.stopPropagation();
    if (!canSkip) return;
    handleAdEnded();
  };

  const toggleAdPlayback = (e) => {
    e.stopPropagation();
    const video = adVideoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => setIsAdPlaying(false));
      setIsAdPlaying(true);
      revealPlaybackIcon('play');
      return;
    }
    video.pause();
    setIsAdPlaying(false);
    revealPlaybackIcon('pause');
  };

  const syncAdProgress = () => {
    const video = adVideoRef.current;
    if (!video) return;
    setAdCurrentTime(video.currentTime || 0);
    if (Number.isFinite(video.duration) && video.duration > 0) {
      setAdDuration(video.duration);
    }
  };

  const progressPercent = adDuration > 0
    ? Math.min(100, Math.max(0, (adCurrentTime / adDuration) * 100))
    : 0;

  if (!showAdOverlay || !activeAd) return null;

  return (
    <div className="ads-movie-overlay show">
      <video
        ref={adVideoRef}
        src={activeAd.videoUrl}
        className="ads-movie-video"
        playsInline
        onTimeUpdate={syncAdProgress}
        onLoadedMetadata={syncAdProgress}
        onDurationChange={syncAdProgress}
        onPlay={() => setIsAdPlaying(true)}
        onPause={() => setIsAdPlaying(false)}
        onEnded={handleAdEnded}
      />
      <button
        type="button"
        className="ads-movie-hit"
        onClick={toggleAdPlayback}
        aria-label={isAdPlaying ? t('player.pause') : t('player.play')}
      />
      <div
        className={`ads-movie-playback${showPlaybackIcon ? ' show' : ''}`}
        aria-hidden={!showPlaybackIcon}
      >
        <svg width="42" height="42" viewBox="0 0 24 24" fill="currentColor">
          {playbackIcon === 'pause' ? (
            <>
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </>
          ) : (
            <polygon points="6 4 20 12 6 20 6 4" />
          )}
        </svg>
      </div>
      <div className="ads-movie-progress">
        <span className="ads-movie-progress-time">{formatAdTime(adCurrentTime)}</span>
        <div
          className="ads-movie-progress-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={Math.floor(adDuration) || 0}
          aria-valuenow={Math.floor(adCurrentTime)}
          aria-label={`${formatAdTime(adCurrentTime)} / ${formatAdTime(adDuration)}`}
        >
          <div className="ads-movie-progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <span className="ads-movie-progress-time ads-movie-progress-time--end">{formatAdTime(adDuration)}</span>
      </div>
      <button
        type="button"
        className={`ads-movie-skip${canSkip ? ' ads-movie-skip--ready' : ''}`}
        onClick={handleSkipClick}
        disabled={!canSkip}
        aria-disabled={!canSkip}
        aria-label={canSkip ? t('player.skipAd') : `${t('player.skipAd')} ${skipSecondsLeft}s`}
      >
        <span>{t('player.skipAd')}</span>
        {canSkip ? (
          <svg className="ads-movie-skip-icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M5.59 7.41 7 6l6 6-6 6-1.41-1.41L10.17 12zm6 0L13 6l6 6-6 6-1.41-1.41L16.17 12z" />
          </svg>
        ) : (
          <span className="ads-movie-skip-timer">{skipSecondsLeft}s</span>
        )}
      </button>
    </div>
  );
});

AdsMovie.displayName = 'AdsMovie';

export default AdsMovie;
