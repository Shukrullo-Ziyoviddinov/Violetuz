import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './VideoPlayerControls.css';

const SPEED_OPTIONS = [1, 1.5, 2];

const formatTime = (seconds) => {
  if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return '0:00';
  const totalSeconds = Math.floor(seconds);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const isMobileViewport = () => typeof window !== 'undefined' && window.innerWidth <= 969;

/**
 * Global video player: play/pause, ±10s, progress, volume, speed, fullscreen.
 * Dizayn TrailerModal dagi `trailer-modal-*` classlariga mos.
 */
const VideoPlayerControls = ({
  src,
  poster,
  loading = false,
  resetKey,
  className = '',
  videoClassName = 'trailer-modal-video',
  objectFit = 'contain',
  onExpandToggle,
  expanded = false,
  autoPlay = false,
}) => {
  const { t } = useTranslation();
  const videoRef = useRef(null);
  const wrapperRef = useRef(null);
  const hideControlsTimeoutRef = useRef(null);
  const isPlayingRef = useRef(false);
  const showControlsRef = useRef(true);
  const lastMouseMoveRef = useRef(0);
  const videoTapRef = useRef({ x: 0, y: 0, time: 0 });

  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const clearHideTimeout = () => {
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
      hideControlsTimeoutRef.current = null;
    }
  };

  const startHideTimeout = () => {
    clearHideTimeout();
    hideControlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
      showControlsRef.current = false;
      setShowSpeedMenu(false);
    }, 4000);
  };

  const showControlsWithDelay = () => {
    setShowControls(true);
    showControlsRef.current = true;
    if (isPlayingRef.current) {
      startHideTimeout();
    } else {
      clearHideTimeout();
    }
  };

  const throttledShowControls = () => {
    const now = Date.now();
    if (now - lastMouseMoveRef.current < 150) return;
    lastMouseMoveRef.current = now;
    showControlsWithDelay();
  };

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    showControlsRef.current = showControls;
  }, [showControls]);

  useEffect(() => {
    if (isPlaying) {
      setShowControls(true);
      showControlsRef.current = true;
      startHideTimeout();
    } else {
      setShowControls(true);
      showControlsRef.current = true;
      clearHideTimeout();
    }
  }, [isPlaying]);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      clearHideTimeout();
    };
  }, []);

  useEffect(() => {
    if (loading || !src) return undefined;
    const video = videoRef.current;
    if (!video) return undefined;

    video.pause();
    video.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    let attempts = 0;
    const maxAttempts = 50;
    const checkDuration = setInterval(() => {
      attempts += 1;
      if (video.duration && !isNaN(video.duration)) {
        setDuration(video.duration);
        if (video.playbackRate !== playbackSpeed) video.playbackRate = playbackSpeed;
        clearInterval(checkDuration);
      } else if (attempts >= maxAttempts) {
        clearInterval(checkDuration);
      }
    }, 100);

    if (autoPlay) {
      video.play().catch(() => {});
    }

    return () => {
      clearInterval(checkDuration);
      if (video) video.pause();
    };
  }, [src, resetKey, loading, playbackSpeed, autoPlay]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlayingRef.current) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    }
    showControlsWithDelay();
  };

  const handleBack10 = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
    }
    showControlsWithDelay();
  };

  const handleForward10 = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(
        videoRef.current.duration || 0,
        videoRef.current.currentTime + 10
      );
    }
    showControlsWithDelay();
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    videoRef.current.muted = newMuted;
    if (newMuted) {
      videoRef.current.volume = 0;
    } else {
      videoRef.current.volume = volume || 0.5;
      setVolume(volume || 0.5);
    }
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      try {
        videoRef.current.playbackRate = speed;
      } catch (_) {
        /* ignore */
      }
    }
    setShowSpeedMenu(false);
    showControlsWithDelay();
  };

  const handleFullscreen = () => {
    if (!wrapperRef.current) return;
    try {
      if (!document.fullscreenElement) {
        if (wrapperRef.current.requestFullscreen) wrapperRef.current.requestFullscreen();
        else if (wrapperRef.current.webkitRequestFullscreen) wrapperRef.current.webkitRequestFullscreen();
        else if (wrapperRef.current.mozRequestFullScreen) wrapperRef.current.mozRequestFullScreen();
      } else if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      }
    } catch (_) {
      /* ignore */
    }
  };

  const handleExpandToggle = (e) => {
    e.stopPropagation();
    if (typeof onExpandToggle === 'function') {
      onExpandToggle(e);
      showControlsWithDelay();
      return;
    }
    handleFullscreen();
  };

  const showExpandedIcon =
    typeof onExpandToggle === 'function' && isMobileViewport() ? expanded : isFullscreen;

  const handleTimeUpdate = () => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current?.duration) {
      setDuration(videoRef.current.duration);
      videoRef.current.playbackRate = playbackSpeed;
    }
  };

  const updateProgress = (clientX, progressContainer) => {
    if (
      videoRef.current &&
      videoRef.current.duration &&
      !isNaN(videoRef.current.duration) &&
      progressContainer
    ) {
      const rect = progressContainer.getBoundingClientRect();
      const clickX = clientX - rect.left;
      const percent = Math.max(0, Math.min(1, clickX / rect.width));
      const newTime = percent * videoRef.current.duration;
      setPreviewTime(newTime);
      return newTime;
    }
    return 0;
  };

  const handleProgressClick = (e) => {
    e.stopPropagation();
    const newTime = updateProgress(e.clientX, e.currentTarget);
    if (videoRef.current && newTime >= 0) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      setPreviewTime(0);
    }
  };

  const handleProgressMouseDown = (e) => {
    e.stopPropagation();
    setIsDragging(true);
    updateProgress(e.clientX, e.currentTarget);
  };
  const handleProgressMouseMove = (e) => {
    if (isDragging) {
      e.stopPropagation();
      updateProgress(e.clientX, e.currentTarget);
    }
  };
  const handleProgressMouseUp = (e) => {
    if (isDragging) {
      e.stopPropagation();
      if (videoRef.current && previewTime >= 0) {
        videoRef.current.currentTime = previewTime;
        setCurrentTime(previewTime);
        setPreviewTime(0);
      }
      setIsDragging(false);
    }
  };
  const handleProgressTouchStart = (e) => {
    e.stopPropagation();
    setIsDragging(true);
    updateProgress(e.touches[0].clientX, e.currentTarget);
  };
  const handleProgressTouchMove = (e) => {
    e.stopPropagation();
    if (isDragging) updateProgress(e.touches[0].clientX, e.currentTarget);
  };
  const handleProgressTouchEnd = (e) => {
    e.stopPropagation();
    if (isDragging && videoRef.current && previewTime >= 0) {
      videoRef.current.currentTime = previewTime;
      setCurrentTime(previewTime);
      setPreviewTime(0);
    }
    setIsDragging(false);
  };

  const getProgressPercent = () => {
    if (duration > 0 && !isNaN(duration) && currentTime >= 0 && !isNaN(currentTime)) {
      return Math.min(100, Math.max(0, (currentTime / duration) * 100));
    }
    return 0;
  };

  const getRemainingTime = () => {
    if (duration > 0 && !isNaN(duration) && currentTime >= 0 && !isNaN(currentTime)) {
      return Math.max(0, duration - currentTime);
    }
    return 0;
  };

  const isControlTarget = (target) =>
    !!target?.closest?.(
      'button, input, .trailer-modal-bottom-controls, .trailer-modal-controls-center'
    );

  const handleVideoWrapperTouchStart = (e) => {
    if (!('ontouchstart' in window)) return;
    if (isControlTarget(e.target)) return;
    const touch = e.touches[0];
    if (!touch) return;
    videoTapRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  };

  const handleVideoWrapperTouchEnd = (e) => {
    if (!('ontouchstart' in window)) return;
    if (isControlTarget(e.target)) return;
    const touch = e.changedTouches?.[0];
    if (!touch) return;
    const { x, y, time } = videoTapRef.current;
    const dx = Math.abs(touch.clientX - x);
    const dyAbs = Math.abs(touch.clientY - y);
    const dt = Date.now() - time;
    if (dx < 20 && dyAbs < 20 && dt < 300) {
      e.preventDefault();
      if (showControlsRef.current) {
        clearHideTimeout();
        setShowControls(false);
        showControlsRef.current = false;
      } else {
        setShowControls(true);
        showControlsRef.current = true;
        if (isPlayingRef.current) startHideTimeout();
      }
    }
  };

  const handleVideoClick = (e) => {
    e.stopPropagation();
    if (e.target.closest('button') || e.target.closest('input')) return;
    handlePlayPause();
  };

  const wrapperClasses = ['trailer-modal-video-wrapper', 'video-player-controls', className]
    .filter(Boolean)
    .join(' ');

  const progressWidth = isDragging
    ? duration > 0
      ? (previewTime / duration) * 100
      : 0
    : getProgressPercent();

  return (
    <div
      className={wrapperClasses}
      ref={wrapperRef}
      onMouseMove={'ontouchstart' in window ? undefined : throttledShowControls}
      onMouseLeave={'ontouchstart' in window ? undefined : () => isPlaying && setShowControls(false)}
      onTouchStart={handleVideoWrapperTouchStart}
      onTouchEnd={handleVideoWrapperTouchEnd}
      data-object-fit={objectFit}
    >
      {loading ? (
        <div className="trailer-modal-video-placeholder" aria-hidden="true" />
      ) : (
        <video
          ref={videoRef}
          src={src || ''}
          poster={poster || undefined}
          className={videoClassName}
          style={{ objectFit }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onLoadedData={handleLoadedMetadata}
          onCanPlay={handleLoadedMetadata}
          onClick={handleVideoClick}
          playsInline
        />
      )}

      {!loading && (
        <>
          <div className={`trailer-modal-controls-overlay ${showControls ? 'show' : ''}`}>
            <div className="trailer-modal-controls-center">
              <button
                type="button"
                className="trailer-modal-control-btn"
                onClick={handleBack10}
                aria-label="Rewind 10 seconds"
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                  <text x="8" y="15" fill="white" fontSize="8" fontWeight="bold">
                    10
                  </text>
                </svg>
              </button>

              <button
                type="button"
                className="trailer-modal-control-btn trailer-modal-control-btn-play"
                onClick={handlePlayPause}
                aria-label={isPlaying ? t('player.pause') : t('player.play')}
              >
                <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                  {isPlaying ? (
                    <>
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </>
                  ) : (
                    <polygon points="5 3 19 12 5 21 5 3" />
                  )}
                </svg>
              </button>

              <button
                type="button"
                className="trailer-modal-control-btn"
                onClick={handleForward10}
                aria-label="Forward 10 seconds"
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" />
                  <text x="8" y="15" fill="white" fontSize="8" fontWeight="bold">
                    10
                  </text>
                </svg>
              </button>
            </div>
          </div>

          <div
            className={`trailer-modal-bottom-controls ${showControls ? 'show' : ''}`}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseMove={(e) => e.stopPropagation()}
          >
            <div
              className="trailer-modal-progress-container"
              onClick={(e) => {
                e.stopPropagation();
                handleProgressClick(e);
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                handleProgressMouseDown(e);
              }}
              onMouseMove={(e) => {
                e.stopPropagation();
                handleProgressMouseMove(e);
              }}
              onMouseUp={(e) => {
                e.stopPropagation();
                handleProgressMouseUp(e);
              }}
              onMouseLeave={(e) => {
                e.stopPropagation();
                handleProgressMouseUp(e);
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                handleProgressTouchStart(e);
              }}
              onTouchMove={(e) => {
                e.stopPropagation();
                handleProgressTouchMove(e);
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                handleProgressTouchEnd(e);
              }}
            >
              <div className="trailer-modal-progress-bar">
                <div className="trailer-modal-progress-filled" style={{ width: `${progressWidth}%` }}>
                  <div className="trailer-modal-progress-thumb" />
                </div>
                {isDragging && (
                  <div
                    className="trailer-modal-preview-tooltip"
                    style={{ left: `${duration > 0 ? (previewTime / duration) * 100 : 0}%` }}
                  >
                    {formatTime(previewTime)}
                  </div>
                )}
              </div>
            </div>

            <div className="trailer-modal-controls-bar">
              <div className="trailer-modal-left-controls">
                <button
                  type="button"
                  className="trailer-modal-icon-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayPause();
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    {isPlaying ? (
                      <>
                        <rect x="6" y="4" width="4" height="16" />
                        <rect x="14" y="4" width="4" height="16" />
                      </>
                    ) : (
                      <polygon points="5 3 19 12 5 21 5 3" />
                    )}
                  </svg>
                </button>

                <button
                  type="button"
                  className="trailer-modal-icon-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMute();
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    {isMuted || volume === 0 ? (
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                    ) : volume > 0.5 ? (
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                    ) : (
                      <path d="M7 9v6h4l5 5V4l-5 5H7z" />
                    )}
                  </svg>
                </button>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleVolumeChange(e);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                  className="trailer-modal-volume-slider"
                />

                <div className="trailer-modal-time-display">
                  <span className="trailer-modal-time-current">{formatTime(currentTime)}</span>
                  <span className="trailer-modal-time-separator"> / </span>
                  <span className="trailer-modal-time-duration">{formatTime(duration)}</span>
                  <span className="trailer-modal-time-remaining">
                    {' '}
                    (-{formatTime(getRemainingTime())})
                  </span>
                </div>
              </div>

              <div className="trailer-modal-right-controls">
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    className="trailer-modal-icon-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSpeedMenu(!showSpeedMenu);
                    }}
                    title={`Tezlik: ${playbackSpeed}x`}
                  >
                    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{playbackSpeed}x</span>
                  </button>
                  {showSpeedMenu && (
                    <div
                      className="trailer-modal-speed-menu"
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                    >
                      {SPEED_OPTIONS.map((speed) => (
                        <button
                          type="button"
                          key={speed}
                          className={`trailer-modal-speed-option ${
                            playbackSpeed === speed ? 'active' : ''
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSpeedChange(speed);
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button type="button" className="trailer-modal-icon-btn" onClick={handleExpandToggle}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    {showExpandedIcon ? (
                      <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
                    ) : (
                      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                    )}
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default VideoPlayerControls;
