import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { adsData } from '../../data/adsData';
import AdsMovie from './AdsMovie';
import './WatchModal.css';

const AD_INTERVAL_SECONDS = 900; // 15 daqiqa

const WatchModal = ({ movie, videoUrl, onClose }) => {
  const { t } = useTranslation();
  const { contentLang } = useContentLanguage();
  const [watchVideoLang, setWatchVideoLang] = useState(() => (contentLang === 'ru' ? 'ru' : 'uz'));
  const seekAfterLangChangeRef = useRef(null);

  const computedWatchVideoSrc = useMemo(() => {
    if (videoUrl) return videoUrl;
    if (movie.watchVideo && typeof movie.watchVideo === 'object') {
      return movie.watchVideo[watchVideoLang] || movie.watchVideo.uz || movie.watchVideo.ru;
    }
    if (movie.watchUrl) return movie.watchUrl;
    return '';
  }, [videoUrl, movie.watchVideo, movie.watchUrl, watchVideoLang]);

  const hasWatchVideoLangSwitch =
    !videoUrl &&
    movie.watchVideo &&
    typeof movie.watchVideo === 'object' &&
    movie.watchVideo.uz &&
    movie.watchVideo.ru;

  useEffect(() => {
    setWatchVideoLang(contentLang === 'ru' ? 'ru' : 'uz');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- faqat film almashganda sinxronlash
  }, [movie.id]);

  const videoRef = useRef(null);
  const videoWrapperRef = useRef(null);
  const modalRef = useRef(null);
  const adsRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Reklama state
  const [showAdOverlay, setShowAdOverlay] = useState(false);
  const hasUserStartedWatchingRef = useRef(false);
  const lastAdAtVideoTimeRef = useRef(-1); // -1 = birinchi reklama hali ko'rsatilmagan

  // useRef - stale closure muammosini hal qilish uchun
  const hideControlsTimeoutRef = useRef(null);
  const isPlayingRef = useRef(false);
  const showControlsRef = useRef(true);

  const handleWatchLangChange = (lang) => {
    if (lang === watchVideoLang || videoUrl) return;
    const v = videoRef.current;
    if (v) {
      seekAfterLangChangeRef.current = { time: v.currentTime, play: isPlayingRef.current };
    }
    setWatchVideoLang(lang);
  };

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isDraggingModal, setIsDraggingModal] = useState(false);
  const [modalTranslateY, setModalTranslateY] = useState(0);

  const speedOptions = [1, 1.5, 2];

  const activeAd = adsData.find((ad) => ad.isActive) || adsData[0];

  const handleAdEnded = () => {
    if (!hasUserStartedWatchingRef.current) {
      hasUserStartedWatchingRef.current = true;
      lastAdAtVideoTimeRef.current = 0;
    }
  };

  const handlePlayPause = () => {
    if (showAdOverlay) return;
    if (videoRef.current) {
      if (isPlayingRef.current) {
        videoRef.current.pause();
      } else {
        if (!hasUserStartedWatchingRef.current && activeAd?.isActive) {
          adsRef.current?.showAd();
          return;
        }
        if (!hasUserStartedWatchingRef.current) {
          hasUserStartedWatchingRef.current = true;
        }
        videoRef.current.play().catch(() => {});
      }
    }
    showControlsWithDelay();
  };

  // Ref larni state bilan sinxronlashtirish
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    showControlsRef.current = showControls;
  }, [showControls]);

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

  // Swipe gesture handlers
  const handleTouchStart = (e) => {
    if (e.target.closest('.watch-modal-bottom-controls') || e.target.closest('.watch-modal-controls-overlay')) return;
    setTouchStart(e.touches[0].clientY);
    setTouchEnd(null);
  };

  const handleTouchMove = (e) => {
    if (touchStart === null) return;
    const currentTouch = e.touches[0].clientY;
    const diff = currentTouch - touchStart;
    if (diff > 0) {
      setIsDraggingModal(true);
      setModalTranslateY(diff);
      setTouchEnd(currentTouch);
    } else if (diff < 0) {
      setIsDraggingModal(false);
      setModalTranslateY(0);
      setTouchStart(null);
      setTouchEnd(null);
    }
  };

  const handleTouchEnd = () => {
    if (touchStart === null) {
      setIsDraggingModal(false);
      setModalTranslateY(0);
      return;
    }
    if (touchEnd === null) {
      setIsDraggingModal(false);
      setModalTranslateY(0);
      setTouchStart(null);
      setTouchEnd(null);
      return;
    }
    const distance = touchEnd - touchStart;
    if (distance <= 0) {
      setIsDraggingModal(false);
      setModalTranslateY(0);
      setTouchStart(null);
      setTouchEnd(null);
      return;
    }
    const modalHeight = modalRef.current ? modalRef.current.offsetHeight : window.innerHeight;
    const closeThreshold = modalHeight * 0.35;
    if (distance > closeThreshold) {
      onClose();
    } else {
      setModalTranslateY(0);
    }
    setIsDraggingModal(false);
    setTouchStart(null);
    setTouchEnd(null);
  };

  const handleBack10 = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
    }
    showControlsWithDelay();
  };

  const handleForward10 = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 10);
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
    setShowSpeedMenu(false);
    showControlsWithDelay();
  };

  const handleFullscreen = () => {
    if (!videoWrapperRef.current) return;
    try {
      if (!document.fullscreenElement) {
        if (videoWrapperRef.current.requestFullscreen) videoWrapperRef.current.requestFullscreen();
        else if (videoWrapperRef.current.webkitRequestFullscreen) videoWrapperRef.current.webkitRequestFullscreen();
        else if (videoWrapperRef.current.mozRequestFullScreen) videoWrapperRef.current.mozRequestFullScreen();
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return '0:00';
    const totalSeconds = Math.floor(seconds);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const ct = videoRef.current.currentTime;
      setCurrentTime(ct);
      if (showAdOverlay) return;
      if (isPlayingRef.current && hasUserStartedWatchingRef.current && activeAd?.isActive) {
        const nextAdSlot = Math.floor(ct / AD_INTERVAL_SECONDS);
        if (nextAdSlot > lastAdAtVideoTimeRef.current) {
          lastAdAtVideoTimeRef.current = nextAdSlot;
          adsRef.current?.showAd();
        }
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && videoRef.current.duration) {
      setDuration(videoRef.current.duration);
      videoRef.current.playbackRate = playbackSpeed;
    }
    const pending = seekAfterLangChangeRef.current;
    if (pending && videoRef.current) {
      const v = videoRef.current;
      const maxT = isFinite(v.duration) && v.duration > 0 ? v.duration : pending.time;
      v.currentTime = Math.min(pending.time, maxT);
      if (pending.play) v.play().catch(() => {});
      seekAfterLangChangeRef.current = null;
    }
  };

  const updateProgress = (clientX, progressContainer) => {
    if (videoRef.current && videoRef.current.duration && !isNaN(videoRef.current.duration) && progressContainer) {
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

  const handleProgressMouseDown = (e) => { e.stopPropagation(); setIsDragging(true); updateProgress(e.clientX, e.currentTarget); };
  const handleProgressMouseMove = (e) => { if (isDragging) { e.stopPropagation(); updateProgress(e.clientX, e.currentTarget); } };
  const handleProgressMouseUp = (e) => {
    if (isDragging) {
      e.stopPropagation();
      if (videoRef.current && previewTime >= 0) { videoRef.current.currentTime = previewTime; setCurrentTime(previewTime); setPreviewTime(0); }
      setIsDragging(false);
    }
  };
  const handleProgressTouchStart = (e) => { e.stopPropagation(); setIsDragging(true); updateProgress(e.touches[0].clientX, e.currentTarget); };
  const handleProgressTouchMove = (e) => { e.stopPropagation(); if (isDragging) updateProgress(e.touches[0].clientX, e.currentTarget); };
  const handleProgressTouchEnd = (e) => {
    e.stopPropagation();
    if (isDragging && videoRef.current && previewTime >= 0) { videoRef.current.currentTime = previewTime; setCurrentTime(previewTime); setPreviewTime(0); }
    setIsDragging(false);
  };

  const getProgressPercent = () => {
    if (duration > 0 && !isNaN(duration) && currentTime >= 0 && !isNaN(currentTime)) return Math.min(100, Math.max(0, (currentTime / duration) * 100));
    return 0;
  };

  const getRemainingTime = () => {
    if (duration > 0 && !isNaN(duration) && currentTime >= 0 && !isNaN(currentTime)) return Math.max(0, duration - currentTime);
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
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = originalStyle; };
  }, []);

  useEffect(() => {
    const checkDuration = setInterval(() => {
      if (videoRef.current && videoRef.current.duration && !isNaN(videoRef.current.duration)) {
        setDuration(videoRef.current.duration);
        if (videoRef.current.playbackRate !== playbackSpeed) videoRef.current.playbackRate = playbackSpeed;
        clearInterval(checkDuration);
      }
    }, 100);
    return () => clearInterval(checkDuration);
  }, [movie.watchVideo, movie.watchUrl, videoUrl, watchVideoLang, playbackSpeed]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showSpeedMenu && !e.target.closest('.watch-modal-speed-menu') && !e.target.closest('.watch-modal-icon-btn')) setShowSpeedMenu(false);
    };
    if (showSpeedMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showSpeedMenu]);

  const handleOverlayClick = (e) => { if (e.target === e.currentTarget) onClose(); };

  const videoTapRef = useRef({ x: 0, y: 0, time: 0 });

  const handleVideoWrapperTouchStart = (e) => {
    if (!('ontouchstart' in window)) return;
    if (e.target.closest('.watch-modal-control-btn') || e.target.closest('.watch-modal-bottom-controls') || e.target.closest('input')) return;
    const touch = e.touches[0];
    videoTapRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  };

  const handleVideoWrapperTouchEnd = (e) => {
    if (!('ontouchstart' in window)) return;
    if (e.target.closest('.watch-modal-control-btn') || e.target.closest('.watch-modal-bottom-controls') || e.target.closest('input')) return;
    const touch = e.changedTouches?.[0];
    if (!touch) return;
    const { x, y, time } = videoTapRef.current;
    const dx = Math.abs(touch.clientX - x);
    const dy = Math.abs(touch.clientY - y);
    const dt = Date.now() - time;
    if (dx < 20 && dy < 20 && dt < 300) {
      e.preventDefault();
      // showControlsRef.current - hozirgi qiymatni ref orqali o'qiymiz (stale closure yo'q)
      if (showControlsRef.current) {
        // Yashir
        clearHideTimeout();
        setShowControls(false);
        showControlsRef.current = false;
      } else {
        // Ko'rsat
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
    <div className="watch-modal-overlay" onClick={handleOverlayClick}>
      <div 
        ref={modalRef}
        className="watch-modal" 
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateY(${modalTranslateY}px)`,
          transition: isDraggingModal ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <button className="watch-modal-close" onClick={onClose} aria-label="Close">×</button>
        
        <div className="watch-modal-content">
          <div className="watch-modal-video-section">
            <div 
              ref={videoWrapperRef}
              className="watch-modal-video-wrapper"
              onMouseMove={('ontouchstart' in window) ? undefined : () => showControlsWithDelay()}
              onMouseLeave={('ontouchstart' in window) ? undefined : () => isPlaying && setShowControls(false)}
              onTouchStart={handleVideoWrapperTouchStart}
              onTouchEnd={handleVideoWrapperTouchEnd}
            >
              <video
                ref={videoRef}
                src={computedWatchVideoSrc}
                className="watch-modal-video"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onLoadedData={handleLoadedMetadata}
                onCanPlay={handleLoadedMetadata}
                onClick={handleVideoClick}
                onRateChange={(e) => {
                  if (e.target.playbackRate !== playbackSpeed) console.log('Rate mismatch! Expected:', playbackSpeed, 'Got:', e.target.playbackRate);
                }}
              />
              
              <AdsMovie
                ref={adsRef}
                videoRef={videoRef}
                onVisibilityChange={setShowAdOverlay}
                onAdEnded={handleAdEnded}
              />
              <div className={`watch-modal-controls-overlay ${showControls && !showAdOverlay ? 'show' : ''}`}>
                <div className="watch-modal-controls-center">
                  <button className="watch-modal-control-btn" onClick={handleBack10} aria-label="Rewind 10 seconds">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
                      <text x="8" y="15" fill="white" fontSize="8" fontWeight="bold">10</text>
                    </svg>
                  </button>
                  
                  <button className="watch-modal-control-btn watch-modal-control-btn-play" onClick={handlePlayPause} aria-label={isPlaying ? t('player.pause') : t('player.play')}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                      {isPlaying ? (<><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>) : (<polygon points="5 3 19 12 5 21 5 3"/>)}
                    </svg>
                  </button>
                  
                  <button className="watch-modal-control-btn" onClick={handleForward10} aria-label="Forward 10 seconds">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/>
                      <text x="8" y="15" fill="white" fontSize="8" fontWeight="bold">10</text>
                    </svg>
                  </button>
                </div>
              </div>

              <div className={`watch-modal-bottom-controls ${showControls && !showAdOverlay ? 'show' : ''}`}>
                <div 
                  className="watch-modal-progress-container"
                  onClick={(e) => { e.stopPropagation(); handleProgressClick(e); }}
                  onMouseDown={(e) => { e.stopPropagation(); handleProgressMouseDown(e); }}
                  onMouseMove={(e) => { e.stopPropagation(); handleProgressMouseMove(e); }}
                  onMouseUp={(e) => { e.stopPropagation(); handleProgressMouseUp(e); }}
                  onMouseLeave={(e) => { e.stopPropagation(); handleProgressMouseUp(e); }}
                  onTouchStart={(e) => { e.stopPropagation(); handleProgressTouchStart(e); }}
                  onTouchMove={(e) => { e.stopPropagation(); handleProgressTouchMove(e); }}
                  onTouchEnd={(e) => { e.stopPropagation(); handleProgressTouchEnd(e); }}
                >
                  <div className="watch-modal-progress-bar">
                    <div className="watch-modal-progress-filled" style={{ width: `${isDragging ? (previewTime / duration) * 100 : getProgressPercent()}%` }}>
                      <div className="watch-modal-progress-thumb"></div>
                    </div>
                    {isDragging && (
                      <div className="watch-modal-preview-tooltip" style={{ left: `${(previewTime / duration) * 100}%` }}>
                        {formatTime(previewTime)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="watch-modal-controls-bar">
                  <div className="watch-modal-left-controls">
                    <button className="watch-modal-icon-btn" onClick={(e) => { e.stopPropagation(); handlePlayPause(); }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        {isPlaying ? (<><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>) : (<polygon points="5 3 19 12 5 21 5 3"/>)}
                      </svg>
                    </button>

                    <button className="watch-modal-icon-btn" onClick={(e) => { e.stopPropagation(); toggleMute(); }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        {isMuted || volume === 0 ? (
                          <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                        ) : volume > 0.5 ? (
                          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                        ) : (
                          <path d="M7 9v6h4l5 5V4l-5 5H7z"/>
                        )}
                      </svg>
                    </button>

                    <input
                      type="range" min="0" max="1" step="0.01"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => { e.stopPropagation(); handleVolumeChange(e); }}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onMouseUp={(e) => e.stopPropagation()}
                      className="watch-modal-volume-slider"
                    />

                    <div className="watch-modal-time-display">
                      <span className="watch-modal-time-current">{formatTime(currentTime)}</span>
                      <span className="watch-modal-time-separator"> / </span>
                      <span className="watch-modal-time-duration">{formatTime(duration)}</span>
                      <span className="watch-modal-time-remaining"> (-{formatTime(getRemainingTime())})</span>
                    </div>
                  </div>

                  <div className="watch-modal-right-controls">
                    <div style={{ position: 'relative' }}>
                      <button className="watch-modal-icon-btn" onClick={(e) => { e.stopPropagation(); setShowSpeedMenu(!showSpeedMenu); }} title={`Tezlik: ${playbackSpeed}x`}>
                        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{playbackSpeed}x</span>
                      </button>
                      {showSpeedMenu && (
                        <div className="watch-modal-speed-menu" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
                          {speedOptions.map(speed => (
                            <button
                              key={speed}
                              className={`watch-modal-speed-option ${playbackSpeed === speed ? 'active' : ''}`}
                              onClick={(e) => { e.stopPropagation(); handleSpeedChange(speed); }}
                              onMouseDown={(e) => e.stopPropagation()}
                              onTouchStart={(e) => e.stopPropagation()}
                            >
                              {speed}x
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <button className="watch-modal-icon-btn" onClick={(e) => { e.stopPropagation(); handleFullscreen(); }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        {isFullscreen ? (
                          <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
                        ) : (
                          <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                        )}
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {hasWatchVideoLangSwitch && (
            <div className="watch-modal-lang-row" role="group" aria-label="Video tili">
              <button
                type="button"
                className={`watch-modal-lang-btn ${watchVideoLang === 'uz' ? 'active' : ''}`}
                onClick={() => handleWatchLangChange('uz')}
              >
                UZ
              </button>
              <button
                type="button"
                className={`watch-modal-lang-btn ${watchVideoLang === 'ru' ? 'active' : ''}`}
                onClick={() => handleWatchLangChange('ru')}
              >
                RU
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WatchModal;