import React, { useRef, useState, useEffect, useMemo } from 'react';
import { formatActionCount } from '../../utils/utils';
import { useTranslation } from 'react-i18next';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import LikeButton from '../../Music/LikeButton/LikeButton';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import SimilarTrailers from './SimilarTrailers';
import './TrailerModal.css';

export const TrailerCloseButton = ({ onClick, label = 'Close' }) => (
  <button type="button" className="trailer-modal-close" onClick={onClick} aria-label={label}>
    <span className="trailer-modal-close-x" aria-hidden="true">×</span>
    <svg
      className="trailer-modal-close-back"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  </button>
);

const TrailerModal = ({ movie, onClose, variant = 'modal', loading: externalLoading = false }) => {
  const isPage = variant === 'page';
  const overlayClass = isPage ? 'trailer-page-overlay' : 'trailer-modal-overlay';
  const { t } = useTranslation();
  const { contentLang } = useContentLanguage();
  const trailers = useMemo(() => {
    if (!movie) return [];
    if (movie.trailersVideo && Array.isArray(movie.trailersVideo)) {
      return movie.trailersVideo;
    }
    if (movie.trailers && Array.isArray(movie.trailers)) {
      return movie.trailers.map((tr) => ({
        id: tr.id,
        trailers: { uz: tr.url, ru: tr.url },
        title: { uz: tr.title, ru: tr.title },
      }));
    }
    return [];
  }, [movie]);
  const [selectedTrailer, setSelectedTrailer] = useState(trailers[0] || null);

  const getTrailerKey = (trailer) => {
    if (!trailer) return null;
    const movieId = trailer.movieId || movie?.id;
    return `${movieId}-${trailer.id}`;
  };

  const videoRef = useRef(null);
  const videoWrapperRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const sheetDragRef = useRef({
    active: false,
    mode: null, // 'expand' | 'collapse'
    startY: 0,
    startX: 0,
    canDrag: false,
    locked: false,
    rawDy: 0,
    lastY: 0,
    lastT: 0,
    velocity: 0,
  });
  const sheetDragYRef = useRef(0);
  const isImmersiveVideoRef = useRef(false);
  const sheetSettlingRef = useRef(null);
  const settleTimerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [trailerLoading, setTrailerLoading] = useState(true);
  const [isImmersiveVideo, setIsImmersiveVideo] = useState(false);
  const [sheetDragY, setSheetDragY] = useState(0);
  const [sheetDragProgress, setSheetDragProgress] = useState(0);
  const [isSheetDragging, setIsSheetDragging] = useState(false);
  const [sheetGesture, setSheetGesture] = useState(null); // 'expand' | 'collapse'
  const [sheetSettling, setSheetSettling] = useState(null); // 'expand' | 'collapse'
  const [sheetSnap, setSheetSnap] = useState(false); // transition o'chirish (bounce yo'q)

  useEffect(() => {
    if (!movie) {
      setSelectedTrailer(null);
      return;
    }
    setSelectedTrailer(trailers[0] || null);
    // faqat film almashganda birinchi trailerni tanlash
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movie?.id]);

  useEffect(() => {
    if (externalLoading || !movie) {
      setTrailerLoading(true);
      return undefined;
    }
    setTrailerLoading(true);
    const timer = setTimeout(() => setTrailerLoading(false), 120);
    return () => clearTimeout(timer);
  }, [externalLoading, movie?.id]);

  const showLoading = externalLoading || trailerLoading;

  // useRef - stale closure muammosini hal qilish uchun
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
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const speedOptions = [1, 1.5, 2];

  const isMobileViewport = () => typeof window !== 'undefined' && window.innerWidth <= 969;
  const getSheetThreshold = () => (typeof window !== 'undefined' ? window.innerHeight : 800) * 0.35;
  const SHEET_ACTIVATE_PX = 18;
  const SHEET_FLING_VELOCITY = 0.72; // px/ms
  const SHEET_FLING_MIN_RATIO = 0.18; // fling uchun minimal yo'l (~6% ekran)
  const SHEET_SETTLE_MS = 420;

  const emptySheetDrag = () => ({
    active: false,
    mode: null,
    startY: 0,
    startX: 0,
    canDrag: false,
    locked: false,
    rawDy: 0,
    lastY: 0,
    lastT: 0,
    velocity: 0,
  });

  // Og'ir lekin silliq rubber: barmoqning ~42% i, chegaradan keyin yanada sekin
  const resistSheetDrag = (rawAbs) => {
    const threshold = getSheetThreshold();
    const tracked = Math.max(rawAbs, 0) * 0.42;
    if (tracked <= threshold) {
      const t = tracked / Math.max(threshold, 1);
      const smoothed = t * t * (3 - 2 * t); // smoothstep
      return smoothed * threshold * 0.88;
    }
    const over = tracked - threshold;
    return threshold * 0.88 + over * 0.18;
  };

  const setSheetDragYSafe = (y, progress = 0) => {
    sheetDragYRef.current = y;
    setSheetDragY(y);
    setSheetDragProgress(progress);
  };

  const clearSettleTimer = () => {
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
  };

  const resetSheetVisual = () => {
    setSheetDragYSafe(0, 0);
    setIsSheetDragging(false);
    setSheetGesture(null);
    setSheetSettling(null);
    sheetSettlingRef.current = null;
    sheetDragRef.current = emptySheetDrag();
  };

  const snapThenClearMotion = (apply) => {
    setSheetSnap(true);
    apply();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setSheetSnap(false));
    });
  };

  // Commit: avval progress=1 gacha silliq (scroll+controls birga), keyin mode switch
  const animateCommitExpand = () => {
    if (sheetSettlingRef.current === 'expand') return;
    clearSettleTimer();
    setIsSheetDragging(false);
    setSheetGesture('expand');
    setSheetSettling('expand');
    sheetSettlingRef.current = 'expand';
    requestAnimationFrame(() => {
      // translate push yo'q — gap yaratmasin; faqat progress
      setSheetDragYSafe(0, 1);
    });
    settleTimerRef.current = setTimeout(() => {
      sheetSettlingRef.current = null;
      snapThenClearMotion(() => {
        isImmersiveVideoRef.current = true;
        setIsImmersiveVideo(true);
        setSheetSettling(null);
        setSheetGesture(null);
        setSheetDragYSafe(0, 0);
      });
    }, SHEET_SETTLE_MS);
  };

  const animateCommitCollapse = () => {
    if (sheetSettlingRef.current === 'collapse') return;
    clearSettleTimer();
    setIsSheetDragging(false);
    setSheetGesture('collapse');
    setSheetSettling('collapse');
    sheetSettlingRef.current = 'collapse';
    requestAnimationFrame(() => {
      setSheetDragYSafe(0, 1);
    });
    settleTimerRef.current = setTimeout(() => {
      sheetSettlingRef.current = null;
      snapThenClearMotion(() => {
        isImmersiveVideoRef.current = false;
        setIsImmersiveVideo(false);
        setSheetSettling(null);
        setSheetGesture(null);
        setSheetDragYSafe(0, 0);
      });
    }, SHEET_SETTLE_MS);
  };

  const collapseImmersiveVideo = ({ instant = false } = {}) => {
    if (!instant && isMobileViewport() && isImmersiveVideoRef.current && !sheetSettlingRef.current) {
      animateCommitCollapse();
      return;
    }
    clearSettleTimer();
    isImmersiveVideoRef.current = false;
    setIsImmersiveVideo(false);
    resetSheetVisual();
  };

  const expandImmersiveVideo = ({ instant = false } = {}) => {
    if (!instant && isMobileViewport() && !isImmersiveVideoRef.current && !sheetSettlingRef.current) {
      animateCommitExpand();
      return;
    }
    clearSettleTimer();
    isImmersiveVideoRef.current = true;
    setIsImmersiveVideo(true);
    resetSheetVisual();
  };

  const updateSheetVelocity = (clientY) => {
    const now = performance.now();
    const prev = sheetDragRef.current;
    const dt = Math.max(now - (prev.lastT || now), 1);
    const vy = (clientY - (prev.lastY || clientY)) / dt;
    sheetDragRef.current.lastY = clientY;
    sheetDragRef.current.lastT = now;
    sheetDragRef.current.velocity = prev.velocity * 0.65 + vy * 0.35;
  };

  const shouldCommitSheet = (rawAbs, velocitySigned, direction) => {
    const threshold = getSheetThreshold();
    if (rawAbs >= threshold) return true;
    const flingOk =
      direction === 'expand'
        ? velocitySigned >= SHEET_FLING_VELOCITY
        : velocitySigned <= -SHEET_FLING_VELOCITY;
    return flingOk && rawAbs >= threshold * SHEET_FLING_MIN_RATIO;
  };

  const handleTrailerSelect = (trailer) => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setSelectedTrailer(trailer);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setShowControls(true);
    showControlsRef.current = true;
    collapseImmersiveVideo({ instant: true });
  };

  // —— Expand: scroll-area pastga ——
  const handleSheetTouchStart = (e) => {
    if (!isMobileViewport() || isImmersiveVideoRef.current || sheetSettlingRef.current) return;
    const scrollEl = scrollAreaRef.current;
    if (!scrollEl || scrollEl.scrollTop > 2) return;
    const touch = e.touches[0];
    if (!touch) return;
    const now = performance.now();
    sheetDragRef.current = {
      active: true,
      mode: 'expand',
      startY: touch.clientY,
      startX: touch.clientX,
      canDrag: true,
      locked: false,
      rawDy: 0,
      lastY: touch.clientY,
      lastT: now,
      velocity: 0,
    };
  };

  const handleSheetTouchMove = (e) => {
    const drag = sheetDragRef.current;
    if (!drag.active || drag.mode !== 'expand' || !drag.canDrag || isImmersiveVideoRef.current || sheetSettlingRef.current) return;
    const touch = e.touches[0];
    if (!touch) return;
    const rawDy = touch.clientY - drag.startY;
    const dx = Math.abs(touch.clientX - drag.startX);

    if (rawDy < -SHEET_ACTIVATE_PX && !drag.locked) {
      sheetDragRef.current.canDrag = false;
      resetSheetVisual();
      return;
    }

    if (rawDy <= 0) return;

    if (!drag.locked) {
      if (rawDy < SHEET_ACTIVATE_PX || rawDy < dx * 1.15) return;
      sheetDragRef.current.locked = true;
      setSheetGesture('expand');
      setIsSheetDragging(true);
    }

    if (e.cancelable) e.preventDefault();
    updateSheetVelocity(touch.clientY);
    sheetDragRef.current.rawDy = rawDy;
    const threshold = getSheetThreshold();
    // Translate gap yaratadi (controls va scroll ajraladi) — faqat progress
    const progress = Math.min(rawDy / (threshold * 1.25), 1);
    setSheetDragYSafe(0, progress);
  };

  const handleSheetTouchEnd = () => {
    const drag = sheetDragRef.current;
    if (!drag.active || drag.mode !== 'expand') return;
    const rawDy = drag.rawDy;
    const velocity = drag.velocity;
    const wasLocked = drag.locked;
    sheetDragRef.current = emptySheetDrag();
    setIsSheetDragging(false);

    if (wasLocked && shouldCommitSheet(rawDy, velocity, 'expand')) {
      // progress=0 ga tashlamasdan — settle animatsiya
      expandImmersiveVideo();
    } else {
      setSheetGesture(null);
      requestAnimationFrame(() => setSheetDragYSafe(0, 0));
    }
  };

  // —— Collapse: immersive ichida yuqoriga (teskari sheet) ——
  const isCollapseIgnoreTarget = (target) => {
    if (!(target instanceof Element)) return false;
    return Boolean(
      target.closest('.trailer-modal-control-btn')
      || target.closest('.trailer-modal-progress-container')
      || target.closest('.trailer-modal-icon-btn')
      || target.closest('input')
      || target.closest('.trailer-modal-speed-menu')
    );
  };

  const handleCollapseTouchStart = (e) => {
    if (!isMobileViewport() || !isImmersiveVideoRef.current || sheetSettlingRef.current) return;
    if (isCollapseIgnoreTarget(e.target)) return;
    const touch = e.touches[0];
    if (!touch) return;
    const now = performance.now();
    sheetDragRef.current = {
      active: true,
      mode: 'collapse',
      startY: touch.clientY,
      startX: touch.clientX,
      canDrag: true,
      locked: false,
      rawDy: 0,
      lastY: touch.clientY,
      lastT: now,
      velocity: 0,
    };
  };

  const handleCollapseTouchMove = (e) => {
    const drag = sheetDragRef.current;
    if (!drag.active || drag.mode !== 'collapse' || !drag.canDrag || !isImmersiveVideoRef.current || sheetSettlingRef.current) return;
    const touch = e.touches[0];
    if (!touch) return;
    const rawDy = touch.clientY - drag.startY; // yuqoriga = manfiy
    const upDy = -rawDy;
    const dx = Math.abs(touch.clientX - drag.startX);

    if (rawDy > SHEET_ACTIVATE_PX && !drag.locked) {
      sheetDragRef.current.canDrag = false;
      resetSheetVisual();
      return;
    }

    if (upDy <= 0) return;

    if (!drag.locked) {
      if (upDy < SHEET_ACTIVATE_PX || upDy < dx * 1.15) return;
      sheetDragRef.current.locked = true;
      setSheetGesture('collapse');
      setIsSheetDragging(true);
    }

    if (e.cancelable) e.preventDefault();
    updateSheetVelocity(touch.clientY);
    sheetDragRef.current.rawDy = rawDy;
    const threshold = getSheetThreshold();
    const progress = Math.min(upDy / (threshold * 1.25), 1);
    setSheetDragYSafe(0, progress);
  };

  const handleCollapseTouchEnd = () => {
    const drag = sheetDragRef.current;
    if (!drag.active || drag.mode !== 'collapse') return;
    const upDy = Math.max(-drag.rawDy, 0);
    const velocity = drag.velocity;
    const wasLocked = drag.locked;
    const threshold = getSheetThreshold();
    const progressSnapshot = Math.min(upDy / (threshold * 1.25), 1);
    sheetDragRef.current = emptySheetDrag();
    setIsSheetDragging(false);

    if (wasLocked && shouldCommitSheet(upDy, velocity, 'collapse')) {
      collapseImmersiveVideo();
    } else if (wasLocked && progressSnapshot > 0.02) {
      requestAnimationFrame(() => {
        setSheetDragYSafe(0, 0);
        requestAnimationFrame(() => setSheetGesture(null));
      });
    } else {
      setSheetGesture(null);
      setSheetDragYSafe(0, 0);
    }
  };

  const handleExpandToggle = (e) => {
    e.stopPropagation();
    if (isMobileViewport()) {
      if (isImmersiveVideoRef.current || isImmersiveVideo) collapseImmersiveVideo();
      else expandImmersiveVideo();
      showControlsWithDelay();
      return;
    }
    handleFullscreen();
  };

  const showExpandedIcon = isMobileViewport() ? isImmersiveVideo : isFullscreen;

  const trailerModalClassName = [
    'trailer-modal',
    isImmersiveVideo ? 'trailer-modal--immersive' : '',
    isSheetDragging ? 'trailer-modal--sheet-dragging' : '',
    (sheetGesture === 'collapse' || sheetSettling === 'collapse') ? 'trailer-modal--collapsing' : '',
    sheetSettling === 'expand' ? 'trailer-modal--expanding' : '',
    sheetSnap ? 'trailer-modal--snap' : '',
  ].filter(Boolean).join(' ');

  const trailerModalStyle = isMobileViewport()
    ? {
        '--trailer-sheet-drag-y': `${sheetDragY}px`,
        '--trailer-sheet-progress': sheetDragProgress,
      }
    : undefined;

  // Scroll bloklash: faqat modal rejimida
  useEffect(() => {
    if (isPage) return undefined;
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyPaddingRight = body.style.paddingRight;
    const scrollbarW = window.innerWidth - html.clientWidth;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    if (scrollbarW > 0) body.style.paddingRight = `${scrollbarW}px`;
    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.style.paddingRight = prevBodyPaddingRight;
    };
  }, [isPage]);

  // onMouseMove throttling — har harakatda setState chaqirilmasin (qotish oldini olish)
  const lastMouseMoveRef = useRef(0);
  const throttledShowControls = () => {
    const now = Date.now();
    if (now - lastMouseMoveRef.current < 150) return;
    lastMouseMoveRef.current = now;
    showControlsWithDelay();
  };

  // Ref larni state bilan sinxronlashtirish
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    showControlsRef.current = showControls;
  }, [showControls]);

  useEffect(() => {
    isImmersiveVideoRef.current = isImmersiveVideo;
  }, [isImmersiveVideo]);

  useEffect(() => () => {
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
  }, []);

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

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlayingRef.current) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {}); // play() interrupted by pause() — expected
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
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && videoRef.current.duration) {
      setDuration(videoRef.current.duration);
      videoRef.current.playbackRate = playbackSpeed;
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
    if (!selectedTrailer) return;
    const video = videoRef.current;
    if (!video) return;

    video.pause();
    video.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    let attempts = 0;
    const maxAttempts = 50; // 5 soniya — cheksiz interval qotish oldini olish
    const checkDuration = setInterval(() => {
      attempts++;
      if (video.duration && !isNaN(video.duration)) {
        setDuration(video.duration);
        if (video.playbackRate !== playbackSpeed) video.playbackRate = playbackSpeed;
        clearInterval(checkDuration);
      } else if (attempts >= maxAttempts) {
        clearInterval(checkDuration);
      }
    }, 100);

    return () => {
      clearInterval(checkDuration);
      if (video) video.pause();
    };
  }, [selectedTrailer?.trailers?.[contentLang], playbackSpeed]);

  // Mobil: video ustiga bosilganda controls toggle
  const videoTapRef = useRef({ x: 0, y: 0, time: 0 });
  const collapseMovedRef = useRef(false);

  const handlePinTouchStart = (e) => {
    collapseMovedRef.current = false;
    handleCollapseTouchStart(e);
  };

  const handlePinTouchMove = (e) => {
    handleCollapseTouchMove(e);
    if (sheetDragRef.current.mode === 'collapse' && sheetDragRef.current.locked) {
      collapseMovedRef.current = true;
    }
  };

  const handlePinTouchEnd = () => {
    handleCollapseTouchEnd();
  };

  const handleVideoWrapperTouchStart = (e) => {
    if (!('ontouchstart' in window)) return;
    if (isCollapseIgnoreTarget(e.target)) return;
    const touch = e.touches[0];
    if (!touch) return;
    videoTapRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  };

  const handleVideoWrapperTouchEnd = (e) => {
    if (!('ontouchstart' in window)) return;
    if (collapseMovedRef.current) {
      collapseMovedRef.current = false;
      return;
    }
    if (isCollapseIgnoreTarget(e.target)) return;

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

  if (!showLoading && (!trailers || trailers.length === 0)) {
    return (
      <div className={overlayClass} onClick={isPage ? undefined : onClose}>
        <div className="trailer-modal" onClick={(e) => e.stopPropagation()}>
          <TrailerCloseButton onClick={onClose} label={t('common.back', 'Back')} />
          <div className="trailer-modal-no-trailers">
            <p>No trailers available</p>
          </div>
        </div>
      </div>
    );
  }

  const handleOverlayClick = (e) => {
    if (isPage) return;
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className={overlayClass} onClick={handleOverlayClick}>
      <div
        className={trailerModalClassName}
        style={trailerModalStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <TrailerCloseButton onClick={onClose} label={t('common.back', 'Back')} />

        <div
          className="trailer-modal-pin"
          onTouchStart={handlePinTouchStart}
          onTouchMove={handlePinTouchMove}
          onTouchEnd={handlePinTouchEnd}
          onTouchCancel={handlePinTouchEnd}
        >
            {(selectedTrailer || showLoading) && (
              <div 
                className="trailer-modal-video-wrapper"
                ref={videoWrapperRef}
                onMouseMove={('ontouchstart' in window) ? undefined : throttledShowControls}
                onMouseLeave={('ontouchstart' in window) ? undefined : () => isPlaying && setShowControls(false)}
                onTouchStart={handleVideoWrapperTouchStart}
                onTouchEnd={handleVideoWrapperTouchEnd}
              >
                {showLoading ? (
                  <div className="trailer-modal-video-placeholder" aria-hidden="true" />
                ) : (
                  <video
                    ref={videoRef}
                    src={selectedTrailer?.trailers?.[contentLang] || selectedTrailer?.trailers?.uz || selectedTrailer?.trailers?.ru || ''}
                    className="trailer-modal-video"
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
                )}
                
                {showLoading ? null : (
                <>
                <div
                  className={`trailer-modal-controls-overlay ${showControls ? 'show' : ''}`}
                >
                  <div className="trailer-modal-controls-center">
                    <button className="trailer-modal-control-btn" onClick={handleBack10} aria-label="Rewind 10 seconds">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
                        <text x="8" y="15" fill="white" fontSize="8" fontWeight="bold">10</text>
                      </svg>
                    </button>
                    
                    <button className="trailer-modal-control-btn trailer-modal-control-btn-play" onClick={handlePlayPause} aria-label={isPlaying ? t('player.pause') : t('player.play')}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                        {isPlaying ? (<><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>) : (<polygon points="5 3 19 12 5 21 5 3"/>)}
                      </svg>
                    </button>
                    
                    <button className="trailer-modal-control-btn" onClick={handleForward10} aria-label="Forward 10 seconds">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/>
                        <text x="8" y="15" fill="white" fontSize="8" fontWeight="bold">10</text>
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
                    onClick={(e) => { e.stopPropagation(); handleProgressClick(e); }}
                    onMouseDown={(e) => { e.stopPropagation(); handleProgressMouseDown(e); }}
                    onMouseMove={(e) => { e.stopPropagation(); handleProgressMouseMove(e); }}
                    onMouseUp={(e) => { e.stopPropagation(); handleProgressMouseUp(e); }}
                    onMouseLeave={(e) => { e.stopPropagation(); handleProgressMouseUp(e); }}
                    onTouchStart={(e) => { e.stopPropagation(); handleProgressTouchStart(e); }}
                    onTouchMove={(e) => { e.stopPropagation(); handleProgressTouchMove(e); }}
                    onTouchEnd={(e) => { e.stopPropagation(); handleProgressTouchEnd(e); }}
                  >
                    <div className="trailer-modal-progress-bar">
                      <div className="trailer-modal-progress-filled" style={{ width: `${isDragging ? (previewTime / duration) * 100 : getProgressPercent()}%` }}>
                        <div className="trailer-modal-progress-thumb"></div>
                      </div>
                      {isDragging && (
                        <div className="trailer-modal-preview-tooltip" style={{ left: `${(previewTime / duration) * 100}%` }}>
                          {formatTime(previewTime)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="trailer-modal-controls-bar">
                    <div className="trailer-modal-left-controls">
                      <button className="trailer-modal-icon-btn" onClick={(e) => { e.stopPropagation(); handlePlayPause(); }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          {isPlaying ? (<><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>) : (<polygon points="5 3 19 12 5 21 5 3"/>)}
                        </svg>
                      </button>

                      <button className="trailer-modal-icon-btn" onClick={(e) => { e.stopPropagation(); toggleMute(); }}>
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
                        className="trailer-modal-volume-slider"
                      />

                      <div className="trailer-modal-time-display">
                        <span className="trailer-modal-time-current">{formatTime(currentTime)}</span>
                        <span className="trailer-modal-time-separator"> / </span>
                        <span className="trailer-modal-time-duration">{formatTime(duration)}</span>
                        <span className="trailer-modal-time-remaining"> (-{formatTime(getRemainingTime())})</span>
                      </div>
                    </div>

                    <div className="trailer-modal-right-controls">
                      <div style={{ position: 'relative' }}>
                        <button className="trailer-modal-icon-btn" onClick={(e) => { e.stopPropagation(); setShowSpeedMenu(!showSpeedMenu); }} title={`Tezlik: ${playbackSpeed}x`}>
                          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{playbackSpeed}x</span>
                        </button>
                        {showSpeedMenu && (
                          <div className="trailer-modal-speed-menu" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
                            {speedOptions.map(speed => (
                              <button
                                key={speed}
                                className={`trailer-modal-speed-option ${playbackSpeed === speed ? 'active' : ''}`}
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

                      <button className="trailer-modal-icon-btn" onClick={handleExpandToggle}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          {showExpandedIcon ? (
                            <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
                          ) : (
                            <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                          )}
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                </>
                )}
              </div>
            )}
          </div>

        <div
          className="trailer-modal-scroll-area"
          ref={scrollAreaRef}
          onTouchStart={handleSheetTouchStart}
          onTouchMove={handleSheetTouchMove}
          onTouchEnd={handleSheetTouchEnd}
          onTouchCancel={handleSheetTouchEnd}
        >
            {(selectedTrailer || showLoading) && (
              <div className="trailer-modal-controls-info">
                {showLoading ? (
                  <>
                    <SkeletonLoader variant="trailer-modal-controls-title" />
                    <SkeletonLoader variant="trailer-modal-controls-text" />
                    <div className="trailer-modal-controls-actions">
                      <SkeletonLoader variant="trailer-modal-controls-action" />
                      <SkeletonLoader variant="trailer-modal-controls-action" />
                    </div>
                  </>
                ) : selectedTrailer ? (
                  <>
                    <div className="trailer-modal-controls-title">
                      {selectedTrailer.title?.[contentLang] || selectedTrailer.title?.uz || selectedTrailer.title?.ru || ''}
                    </div>
                    <div className="trailer-modal-controls-text">
                      {selectedTrailer.text?.[contentLang] || selectedTrailer.text?.uz || selectedTrailer.text?.ru || ''}
                    </div>
                    <div className="trailer-modal-controls-actions">
                      <LikeButton
                        key={getTrailerKey(selectedTrailer) || 'trailer'}
                        variant="trailerModal"
                        contentId={getTrailerKey(selectedTrailer)}
                        persistTrailerKey={getTrailerKey(selectedTrailer)}
                        initialLikeCount={selectedTrailer.like}
                        initialDislikeCount={selectedTrailer.dislike}
                        countFormatter={formatActionCount}
                      />
                    </div>
                  </>
                ) : null}
              </div>
            )}

            {(selectedTrailer || showLoading) && (
              showLoading ? (
                <SkeletonLoader
                  variant="similar-trailers-title"
                  className="trailer-modal-sticky-similar-title trailer-modal-sticky-similar-title--skeleton"
                />
              ) : (
                <h4 className="similar-trailers-title trailer-modal-sticky-similar-title">
                  {t('detail.similarTrailers')}
                </h4>
              )
            )}

            <div className="trailer-modal-sidebar">
              <SimilarTrailers
                trailerLoading={showLoading}
                currentMovie={movie}
                selectedTrailer={selectedTrailer}
                onTrailerSelect={handleTrailerSelect}
                getTrailerKey={getTrailerKey}
                hideTitleOnMobile
              />
            </div>
          </div>
      </div>
    </div>
  );
};

export default TrailerModal;