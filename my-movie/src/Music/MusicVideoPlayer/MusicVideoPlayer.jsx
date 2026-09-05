import React, { useRef, useState, useEffect, forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { createMusicListenProgressReporter } from '../../utils/musicListenProgressReporter';
import MusicSettingsModal from './MusicSettingsModal';
import './MusicVideoPlayer.css';

const speedOptions = [1, 1.5, 2];

const MusicVideoPlayer = forwardRef(({
  src,
  poster,
  autoPlay,
  onEnded,
  onExpandToggle,
  expanded = false,
  /** Music rec engine — clip|concert only when provided */
  contentType = null,
  contentId = null,
  categoryNameMusic = null,
}, ref) => {
  const { t } = useTranslation();
  const { isLoggedIn } = useAuth();
  const videoRef = useRef(null);
  const videoWrapperRef = useRef(null);
  const settingsBtnRef = useRef(null);
  const listenProgressRef = useRef(null);
  if (!listenProgressRef.current) {
    listenProgressRef.current = createMusicListenProgressReporter();
  }
  const isLoggedInRef = useRef(isLoggedIn);
  isLoggedInRef.current = isLoggedIn;
  const playbackSpeedRef = useRef(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimeoutRef = useRef(null);
  const isPlayingRef = useRef(false);
  const showControlsRef = useRef(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showTimeRemaining, setShowTimeRemaining] = useState(false);
  const videoTapRef = useRef({ x: 0, y: 0, time: 0 });
  const previewTimeRef = useRef(0);
  const progressContainerRef = useRef(null);

  playbackSpeedRef.current = playbackSpeed;

  const mergedVideoRef = (node) => {
    videoRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  };

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    showControlsRef.current = showControls;
  }, [showControls]);

  useEffect(() => {
    void listenProgressRef.current.loadConfig();
  }, []);

  useEffect(() => {
    const type = contentType ? String(contentType).trim() : '';
    const id = contentId;
    if (!type || id == null || id === '') {
      listenProgressRef.current.reset(null, null);
      return undefined;
    }

    listenProgressRef.current.reset(type, id);

    return () => {
      const cat = String(categoryNameMusic || '').trim();
      if (!cat) return;
      const el = videoRef.current;
      const dur = el?.duration;
      void listenProgressRef.current.sync({
        force: true,
        isLoggedIn: isLoggedInRef.current,
        contentType: type,
        contentId: id,
        category: cat,
        durationSec: Number.isFinite(dur) && dur > 0 ? dur : undefined,
      });
    };
  }, [contentType, contentId, categoryNameMusic]);

  const flushListenProgress = ({ force = false } = {}) => {
    const type = contentType ? String(contentType).trim() : '';
    const cat = String(categoryNameMusic || '').trim();
    if (!type || contentId == null || contentId === '' || !cat) return;
    const el = videoRef.current;
    const dur = el?.duration;
    void listenProgressRef.current.sync({
      force,
      isLoggedIn: isLoggedInRef.current,
      contentType: type,
      contentId,
      category: cat,
      durationSec: Number.isFinite(dur) && dur > 0 ? dur : undefined,
    });
  };

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
      setShowSettingsModal(false);
    }, 4000);
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlayingRef.current) {
        videoRef.current.pause();
        flushListenProgress({ force: true });
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
        videoRef.current.duration,
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
    if (videoRef.current) {
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      videoRef.current.muted = newMuted;
      if (newMuted) {
        videoRef.current.volume = 0;
      } else {
        videoRef.current.volume = volume || 0.5;
        setVolume(volume || 0.5);
      }
    }
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      try {
        videoRef.current.playbackRate = speed;
      } catch (error) {
        console.error('Error setting playback rate:', error);
      }
    }
    showControlsWithDelay();
  };

  const openSettingsModal = (e) => {
    e?.stopPropagation?.();
    if (showSettingsModal) {
      closeSettingsModal();
      return;
    }
    clearHideTimeout();
    setShowControls(true);
    showControlsRef.current = true;
    setShowSettingsModal(true);
  };

  const closeSettingsModal = () => {
    setShowSettingsModal(false);
    showControlsWithDelay();
  };

  const getFullscreenElement = () =>
    document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;

  const handleFullscreen = () => {
    if (typeof onExpandToggle === 'function' && window.innerWidth <= 900) {
      onExpandToggle();
      showControlsWithDelay();
      return;
    }
    if (!videoWrapperRef.current) return;
    try {
      const isFs = getFullscreenElement();
      if (!isFs) {
        const el = videoWrapperRef.current;
        if (el.requestFullscreen) el.requestFullscreen();
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
        else if (el.msRequestFullscreen) el.msRequestFullscreen();
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
        else if (document.msExitFullscreen) document.msExitFullscreen();
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  const showExpandedIcon =
    typeof onExpandToggle === 'function' && window.innerWidth <= 900
      ? expanded
      : isFullscreen;

  const formatTime = (seconds) => {
    if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return '0:00';
    const totalSeconds = Math.floor(seconds);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      listenProgressRef.current.accumulate({
        isPlaying: isPlayingRef.current,
        playbackRate: playbackSpeedRef.current || 1,
      });
      flushListenProgress();
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && videoRef.current.duration) {
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
      previewTimeRef.current = newTime;
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
  const applyProgressFromPreview = () => {
    const pt = previewTimeRef.current;
    if (videoRef.current && pt >= 0) {
      videoRef.current.currentTime = pt;
      setCurrentTime(pt);
      setPreviewTime(0);
      previewTimeRef.current = 0;
    }
  };

  const handleProgressMouseUp = (e) => {
    if (isDragging) {
      e.stopPropagation();
      applyProgressFromPreview();
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
    if (isDragging) {
      e.preventDefault();
      updateProgress(e.touches[0].clientX, e.currentTarget);
    }
  };
  const handleProgressTouchEnd = (e) => {
    e.stopPropagation();
    if (isDragging) {
      applyProgressFromPreview();
      setIsDragging(false);
    }
  };

  const getProgressPercent = () => {
    if (duration > 0 && !isNaN(duration) && currentTime >= 0 && !isNaN(currentTime))
      return Math.min(100, Math.max(0, (currentTime / duration) * 100));
    return 0;
  };

  const getRemainingTime = () => {
    if (duration > 0 && !isNaN(duration) && currentTime >= 0 && !isNaN(currentTime))
      return Math.max(0, duration - currentTime);
    return 0;
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
    const handleFullscreenChange = () => setIsFullscreen(!!getFullscreenElement());
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      clearHideTimeout();
    };
  }, []);

  useEffect(() => {
    if (!expanded) return undefined;
    setShowControls(true);
    showControlsRef.current = true;
    showControlsWithDelay();
    return undefined;
  }, [expanded]);

  useEffect(() => {
    const checkDuration = setInterval(() => {
      if (
        videoRef.current &&
        videoRef.current.duration &&
        !isNaN(videoRef.current.duration)
      ) {
        setDuration(videoRef.current.duration);
        if (videoRef.current.playbackRate !== playbackSpeed)
          videoRef.current.playbackRate = playbackSpeed;
        clearInterval(checkDuration);
      }
    }, 100);
    return () => clearInterval(checkDuration);
  }, [src, playbackSpeed]);

  useEffect(() => {
    if (!isDragging) return;
    const handleDocMouseMove = (e) => {
      if (progressContainerRef.current) updateProgress(e.clientX, progressContainerRef.current);
    };
    const handleDocMouseUp = () => {
      applyProgressFromPreview();
      setIsDragging(false);
    };
    document.addEventListener('mousemove', handleDocMouseMove);
    document.addEventListener('mouseup', handleDocMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleDocMouseMove);
      document.removeEventListener('mouseup', handleDocMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    if (showSettingsModal) clearHideTimeout();
  }, [showSettingsModal]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        showVolumeSlider &&
        !e.target.closest('.music-vp-volume-wrap')
      )
        setShowVolumeSlider(false);
      if (
        showTimeRemaining &&
        !e.target.closest('.music-vp-time-wrap')
      )
        setShowTimeRemaining(false);
    };
    if (showVolumeSlider || showTimeRemaining) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showVolumeSlider, showTimeRemaining]);

  const handleVideoWrapperTouchStart = (e) => {
    if (!('ontouchstart' in window)) return;
    if (
      e.target.closest('.music-vp-control-btn') ||
      e.target.closest('.music-vp-bottom-controls') ||
      e.target.closest('.watch-settings-modal') ||
      e.target.closest('.watch-settings-modal-backdrop') ||
      e.target.closest('input')
    )
      return;
    const touch = e.touches[0];
    videoTapRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  };

  const handleVideoWrapperTouchEnd = (e) => {
    if (!('ontouchstart' in window)) return;
    if (
      e.target.closest('.music-vp-control-btn') ||
      e.target.closest('.music-vp-bottom-controls') ||
      e.target.closest('.watch-settings-modal') ||
      e.target.closest('.watch-settings-modal-backdrop') ||
      e.target.closest('input')
    )
      return;
    const touch = e.changedTouches?.[0];
    if (!touch) return;
    const { x, y, time } = videoTapRef.current;
    const dx = Math.abs(touch.clientX - x);
    const dy = Math.abs(touch.clientY - y);
    const dt = Date.now() - time;
    if (dx < 20 && dy < 20 && dt < 300) {
      e.preventDefault();
      if (showSettingsModal) setShowSettingsModal(false);
      if (showControlsRef.current) {
        clearHideTimeout();
        setShowControls(false);
        showControlsRef.current = false;
      } else {
        setShowControls(true);
        showControlsRef.current = true;
        if (isPlayingRef.current) {
          startHideTimeout();
        }
      }
    }
  };

  const handleVideoClick = (e) => {
    e.stopPropagation();
    if (e.target.closest('button') || e.target.closest('input')) return;
    handlePlayPause();
  };

  return (
    <div
      ref={videoWrapperRef}
      className="music-vp-video-wrapper"
      onMouseMove={
        'ontouchstart' in window ? undefined : () => showControlsWithDelay()
      }
      onMouseLeave={
        'ontouchstart' in window ? undefined : () => isPlaying && setShowControls(false)
      }
      onTouchStart={handleVideoWrapperTouchStart}
      onTouchEnd={handleVideoWrapperTouchEnd}
    >
      <video
        ref={mergedVideoRef}
        src={src}
        className="music-vp-video"
        poster={poster}
        autoPlay={autoPlay}
        playsInline
        onPlay={() => setIsPlaying(true)}
        onPause={() => {
          setIsPlaying(false);
          flushListenProgress({ force: true });
        }}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onLoadedData={handleLoadedMetadata}
        onCanPlay={handleLoadedMetadata}
        onClick={handleVideoClick}
        onEnded={(e) => {
          flushListenProgress({ force: true });
          onEnded?.(e);
        }}
      />

      <div
        className={`music-vp-controls-overlay ${showControls ? 'show' : ''}`}
      >
        <div className="music-vp-controls-center">
          <button
            className="music-vp-control-btn"
            onClick={handleBack10}
            aria-label="Orqaga 10 soniya"
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
              <text x="8" y="15" fill="white" fontSize="8" fontWeight="bold">
                10
              </text>
            </svg>
          </button>

          <button
            className="music-vp-control-btn music-vp-control-btn-play"
            onClick={handlePlayPause}
            aria-label={isPlaying ? 'Pauza' : 'Ijro'}
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
            className="music-vp-control-btn"
            onClick={handleForward10}
            aria-label="Oldinga 10 soniya"
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" />
              <text x="8" y="15" fill="white" fontSize="8" fontWeight="bold">
                10
              </text>
            </svg>
          </button>
        </div>
      </div>

      <div className={`music-vp-bottom-controls ${showControls ? 'show' : ''}`}>
        <div
          ref={progressContainerRef}
          className="music-vp-progress-container"
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
          <div className="music-vp-progress-bar">
            <div
              className="music-vp-progress-filled"
              style={{
                width: `${
                  isDragging && duration > 0
                    ? (previewTime / duration) * 100
                    : getProgressPercent()
                }%`,
              }}
            >
              <div className="music-vp-progress-thumb"></div>
            </div>
            {isDragging && duration > 0 && (
              <div
                className="music-vp-preview-tooltip"
                style={{ left: `${(previewTime / duration) * 100}%` }}
              >
                {formatTime(previewTime)}
              </div>
            )}
          </div>
        </div>

        <div className="music-vp-controls-bar">
          <div className="music-vp-left-controls">
            <button
              className="music-vp-icon-btn"
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

            <div
              className="music-vp-volume-wrap"
              onMouseEnter={() => !('ontouchstart' in window) && setShowVolumeSlider(true)}
              onMouseLeave={() => !('ontouchstart' in window) && setShowVolumeSlider(false)}
            >
              <button
                className="music-vp-icon-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  if ('ontouchstart' in window) {
                    setShowVolumeSlider((v) => !v);
                  } else {
                    toggleMute();
                  }
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
              <div
                className={`music-vp-volume-slider-block ${showVolumeSlider ? 'show' : ''}`}
              >
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
                  className="music-vp-volume-slider"
                />
              </div>
            </div>

            <div
              className="music-vp-time-wrap"
              onMouseEnter={() => !('ontouchstart' in window) && setShowTimeRemaining(true)}
              onMouseLeave={() => !('ontouchstart' in window) && setShowTimeRemaining(false)}
            >
              <div
                className="music-vp-time-display"
                onClick={(e) => {
                  e.stopPropagation();
                  if ('ontouchstart' in window) setShowTimeRemaining((v) => !v);
                }}
              >
                <span className="music-vp-time-current">
                  {formatTime(currentTime)}
                </span>
                <span className="music-vp-time-separator"> / </span>
                <span className="music-vp-time-duration">
                  {formatTime(duration)}
                </span>
              </div>
              <div className={`music-vp-time-remaining-block ${showTimeRemaining ? 'show' : ''}`}>
                <span className="music-vp-time-remaining">
                  -{formatTime(getRemainingTime())}
                </span>
              </div>
            </div>
          </div>

          <div className="music-vp-right-controls">
            <div className="music-vp-settings-anchor">
              <button
                ref={settingsBtnRef}
                className="music-vp-icon-btn"
                onClick={openSettingsModal}
                title={t('player.settings')}
                aria-label={t('player.settings')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.07 7.07 0 0 0-1.63-.94l-.36-2.54A.49.49 0 0 0 13.91 2h-3.82a.49.49 0 0 0-.48.41l-.36 2.54c-.59.24-1.13.55-1.63.94l-2.39-.96a.49.49 0 0 0-.59.22L2.72 8.87a.49.49 0 0 0 .12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94L2.84 14.52a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.3.59.22l2.39-.96c.5.39 1.04.71 1.63.94l.36 2.54c.05.23.25.41.48.41h3.82c.23 0 .43-.18.48-.41l.36-2.54c.59-.24 1.13-.55 1.63-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 0 0-.12-.61l-2.03-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z"/>
                </svg>
              </button>
              <MusicSettingsModal
                isOpen={showSettingsModal}
                onClose={closeSettingsModal}
                anchorRef={settingsBtnRef}
                playbackSpeed={playbackSpeed}
                onSpeedChange={handleSpeedChange}
                speedOptions={speedOptions}
              />
            </div>

            <button
              className="music-vp-icon-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleFullscreen();
              }}
            >
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
    </div>
  );
});

MusicVideoPlayer.displayName = 'MusicVideoPlayer';

export default MusicVideoPlayer;
