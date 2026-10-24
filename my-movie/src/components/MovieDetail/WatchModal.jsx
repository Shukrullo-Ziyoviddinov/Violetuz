import React, { useRef, useState, useEffect, useLayoutEffect, useMemo, useCallback } from 'react';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useMoviesApi } from '../../context/MoviesApiContext';
import { useAuth } from '../../context/AuthContext';
import { useViewedMovies } from '../../context/ViewedMoviesContext';
import { reportMovieProgress, fetchProgressConfig, DEFAULT_PROGRESS_CONFIG } from '../../api/recommendationsApi';
import { addWatchEvent as addGuestMovieWatchEvent } from '../../utils/localStorage/guestHistory/movieGuestHistory';
import { MINI_VIDEO_KIND } from '../../MiniVideo/miniVideoSession';
import { useMiniVideoPlayback } from '../../MiniVideo/MiniVideoPlaybackContext';
import { requestPauseVideos } from '../../MiniVideo/mediaPlaybackGate';
import AdsMovie from './AdsMovie';
import WatchSettingsModal from './WatchSettingsModal';
import VideoPlayerControls from '../VideoPlayerControls/VideoPlayerControls';
import './WatchModal.css';

const AD_INTERVAL_SECONDS = 900; // 15 daqiqa

const ownsMovie = (el, movieId) => Boolean(
  el
  && movieId != null
  && el.dataset.miniVideoKind === MINI_VIDEO_KIND.KINO
  && String(el.dataset.miniVideoId) === String(movieId)
);

const continuingMedia = (mediaRef, movieId) => {
  const el = mediaRef?.current;
  if (!el?.currentSrc) return null;
  if (el.dataset.miniVideoKind !== MINI_VIDEO_KIND.KINO) return null;
  if (movieId != null && String(el.dataset.miniVideoId) !== String(movieId)) return null;
  if (el.currentTime <= 0.05 && el.paused) return null;
  return el;
};
/** Progress serverga yuborish minimal oralig'i */
const PROGRESS_REPORT_INTERVAL_MS = 30_000;

const WatchModal = ({ movie, videoUrl, onClose }) => {
  const { contentLang } = useContentLanguage();
  const { isLoggedIn } = useAuth();
  const { addMovie } = useViewedMovies();
  const [watchVideoLang, setWatchVideoLang] = useState(() => (contentLang === 'ru' ? 'ru' : 'uz'));
  const seekAfterLangChangeRef = useRef(null);
  const progressConfigRef = useRef({ ...DEFAULT_PROGRESS_CONFIG });

  const computedWatchVideoSrc = useMemo(() => {
    if (videoUrl) return videoUrl;
    if (movie.watchVideo && typeof movie.watchVideo === 'object') {
      return movie.watchVideo[watchVideoLang] || movie.watchVideo.uz || movie.watchVideo.ru;
    }
    if (movie.watchUrl) return movie.watchUrl;
    return '';
  }, [videoUrl, movie.watchVideo, movie.watchUrl, watchVideoLang]);

  const movieSession = useMemo(() => {
    if (!movie?.id || !computedWatchVideoSrc) return null;
    const title = movie.title && typeof movie.title === 'object'
      ? (movie.title[contentLang] || movie.title.uz || movie.title.ru || '')
      : (movie.title || '');
    return {
      kind: MINI_VIDEO_KIND.KINO,
      id: movie.id,
      title,
      src: computedWatchVideoSrc,
      route: `/movie/${movie.id}`,
    };
  }, [computedWatchVideoSrc, contentLang, movie]);

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
  const { mediaRef, session, bindSession, activateSession, registerDetailSlot } = useMiniVideoPlayback();
  const movieMediaActive = Boolean(
    movieSession
    && session?.kind === MINI_VIDEO_KIND.KINO
    && String(session.id) === String(movieSession.id)
  );
  const videoWrapperRef = useRef(null);
  const modalRef = useRef(null);
  const adsRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(() => {
    const el = continuingMedia(mediaRef, movie?.id);
    return Boolean(el && !el.paused && !el.ended);
  });
  const [showControls, setShowControls] = useState(true);

  // Reklama state
  const [showAdOverlay, setShowAdOverlay] = useState(false);
  const showAdOverlayRef = useRef(false);
  const hasUserStartedWatchingRef = useRef(Boolean(continuingMedia(mediaRef, movie?.id)));
  const lastAdAtVideoTimeRef = useRef(-1); // -1 = birinchi reklama hali ko'rsatilmagan

  // "Ko'rildi" + progress — ijro va oldinga o'tkazish. Orqaga ayirilmaydi.
  const viewMarkedRef = useRef(false);
  const localViewedMarkedRef = useRef(false);
  const accumulatedWatchSecRef = useRef(0);
  const watchHighWaterRef = useRef(0);
  const mediaTimeRef = useRef(0);
  const lastWatchTickWallRef = useRef(null);
  const lastReportedCompletionRef = useRef(null);
  const lastReportAtRef = useRef(0);
  const progressInFlightRef = useRef(false);

  // useRef - stale closure muammosini hal qilish uchun
  const hideControlsTimeoutRef = useRef(null);
  const isPlayingRef = useRef(Boolean(continuingMedia(mediaRef, movie?.id) && !continuingMedia(mediaRef, movie?.id).paused));
  const showControlsRef = useRef(true);

  const handleWatchLangChange = (lang) => {
    if (lang === watchVideoLang || videoUrl) return;
    const v = videoRef.current;
    if (v) {
      seekAfterLangChangeRef.current = { time: v.currentTime, play: isPlayingRef.current };
    }
    setWatchVideoLang(lang);
  };

  const [, setCurrentTime] = useState(() => continuingMedia(mediaRef, movie?.id)?.currentTime || 0);
  const [, setDuration] = useState(() => {
    const dur = continuingMedia(mediaRef, movie?.id)?.duration;
    return Number.isFinite(dur) ? dur : 0;
  });
  const [volume, setVolume] = useState(() => continuingMedia(mediaRef, movie?.id)?.volume ?? 1);
  const [isMuted, setIsMuted] = useState(() => Boolean(continuingMedia(mediaRef, movie?.id)?.muted));
  const [playbackSpeed, setPlaybackSpeed] = useState(() => continuingMedia(mediaRef, movie?.id)?.playbackRate || 1);
  const playbackSpeedRef = useRef(playbackSpeed);
  
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isDraggingModal, setIsDraggingModal] = useState(false);
  const [modalTranslateY, setModalTranslateY] = useState(0);

  const speedOptions = [1, 1.5, 2];
  const { getActiveAd } = useMoviesApi();
  const activeAd = getActiveAd();

  const handleAdEnded = () => {
    if (!hasUserStartedWatchingRef.current) {
      hasUserStartedWatchingRef.current = true;
      lastAdAtVideoTimeRef.current = 0;
    }
    if (movieSession) activateSession(movieSession);
  };

  const handlePlayPause = () => {
    if (showAdOverlay) return;
    const el = mediaRef.current;
    const owner = ownsMovie(el, movie?.id);
    if (owner && isPlayingRef.current) {
      el.__markWantPlay?.(false);
      el.pause();
      showControlsWithDelay();
      return;
    }
    if (!hasUserStartedWatchingRef.current && activeAd?.isActive) {
      if (!owner) requestPauseVideos();
      adsRef.current?.showAd();
      return;
    }
    if (!hasUserStartedWatchingRef.current) {
      hasUserStartedWatchingRef.current = true;
    }
    if (movieSession) activateSession(movieSession);
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
    showAdOverlayRef.current = showAdOverlay;
    if (showAdOverlay) {
      lastWatchTickWallRef.current = null;
    }
  }, [showAdOverlay]);

  useEffect(() => {
    playbackSpeedRef.current = playbackSpeed;
  }, [playbackSpeed]);

  // Server threshold knobs (scoringWeights.progress) — FE/BE drift oldini olish
  useEffect(() => {
    let cancelled = false;
    fetchProgressConfig()
      .then((cfg) => {
        if (!cancelled && cfg) progressConfigRef.current = cfg;
      })
      .catch(() => {
        /* fallback DEFAULT_PROGRESS_CONFIG */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Film almashganda view hisoblagichni reset. Layout: play yangi kinoda eski reklamani "ko'rilgan" deb hisoblamasin.
  useLayoutEffect(() => {
    const el = mediaRef.current;
    const sameMovie = Boolean(
      ownsMovie(el, movie?.id)
      && continuingMedia(mediaRef, movie?.id)
    );
    if (sameMovie) {
      hasUserStartedWatchingRef.current = true;
      lastAdAtVideoTimeRef.current = Math.floor((el.currentTime || 0) / AD_INTERVAL_SECONDS);
      mediaTimeRef.current = el.currentTime || 0;
    } else {
      hasUserStartedWatchingRef.current = false;
      lastAdAtVideoTimeRef.current = -1;
      mediaTimeRef.current = 0;
    }
    viewMarkedRef.current = false;
    localViewedMarkedRef.current = false;
    accumulatedWatchSecRef.current = 0;
    watchHighWaterRef.current = 0;
    lastWatchTickWallRef.current = null;
    lastReportedCompletionRef.current = null;
    lastReportAtRef.current = 0;
    progressInFlightRef.current = false;
  }, [mediaRef, movie?.id]);

  // Haqiqiy film progressi: watched / duration (threshold bilan chalkashtirilmasin).
  const buildCompletionRate = useCallback((watched, dur) => {
    if (!Number.isFinite(dur) || dur <= 0) return 0;
    return Math.min(1, Math.max(0, watched / dur));
  }, []);

  const isEligibleWatch = useCallback((watched, dur) => {
    const { minWatchedSeconds, shortFilmCompleteRatio } = progressConfigRef.current;
    if (watched >= minWatchedSeconds) return true;
    return (
      Number.isFinite(dur) &&
      dur > 0 &&
      dur < minWatchedSeconds &&
      watched >= dur * shortFilmCompleteRatio
    );
  }, []);

  const markLocalViewed = useCallback(() => {
    if (localViewedMarkedRef.current || !movie?.id) return;
    localViewedMarkedRef.current = true;
    addMovie(movie);
  }, [addMovie, movie]);

  const syncWatchProgress = useCallback(
    async ({ force = false } = {}) => {
      if (movie?.id == null || movie?.id === '') return;
      if (progressInFlightRef.current) return;

      const watched = accumulatedWatchSecRef.current;
      const dur = videoRef.current?.duration;
      if (!isEligibleWatch(watched, dur)) return;

      // Local "ko'rildi" — server bilan bir xil threshold (detail ochish emas)
      markLocalViewed();

      const { affinityMinDelta } = progressConfigRef.current;
      const completionRate = buildCompletionRate(watched, dur);
      const lastC = lastReportedCompletionRef.current;
      const now = Date.now();
      const raisedEnough =
        lastC == null || completionRate >= lastC + affinityMinDelta - 1e-9;
      const intervalOk =
        lastC != null &&
        completionRate > lastC + 1e-9 &&
        now - lastReportAtRef.current >= PROGRESS_REPORT_INTERVAL_MS;

      if (!force && !raisedEnough && !intervalOk && viewMarkedRef.current) return;

      lastReportedCompletionRef.current = completionRate;
      lastReportAtRef.current = now;
      viewMarkedRef.current = true;

      // Guest: hech qachon /progress ga yuborilmaydi — faqat localStorage
      if (!isLoggedIn) {
        const category = String(movie.categoryName || '').trim();
        addGuestMovieWatchEvent(movie.id, category, completionRate);
        return;
      }

      progressInFlightRef.current = true;
      try {
        await reportMovieProgress({
          movieId: movie.id,
          watchedSeconds: watched,
          completionRate,
          durationSec: Number.isFinite(dur) && dur > 0 ? dur : undefined,
          category: movie.categoryName || undefined,
        });
      } catch {
        lastReportedCompletionRef.current = lastC;
        lastReportAtRef.current = 0;
        if (lastC == null) viewMarkedRef.current = false;
      } finally {
        progressInFlightRef.current = false;
      }
    },
    [
      buildCompletionRate,
      isEligibleWatch,
      isLoggedIn,
      markLocalViewed,
      movie,
    ]
  );

  const handleClose = useCallback(() => {
    // Modal yopilishidan oldin oxirgi progressni yuborish (yo'qolib ketmasin)
    void syncWatchProgress({ force: true }).finally(() => {
      onClose?.();
    });
  }, [onClose, syncWatchProgress]);

  const accumulateWatchTime = useCallback(() => {
    if (!isPlayingRef.current || showAdOverlayRef.current) {
      lastWatchTickWallRef.current = null;
      return;
    }

    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (lastWatchTickWallRef.current != null) {
      const wallDeltaSec = (now - lastWatchTickWallRef.current) / 1000;
      // Oddiy tick (~0.25–1s); uzun pauza/tab sleep qo'shilmasin
      if (wallDeltaSec > 0 && wallDeltaSec < 2.5) {
        const rate = Number(playbackSpeedRef.current) || 1;
        // 2× tezkorda film content ham 2× — affinity/completion shunga mos
        accumulatedWatchSecRef.current += wallDeltaSec * Math.max(0.25, rate);
        syncWatchProgress();
      }
    }
    lastWatchTickWallRef.current = now;
  }, [syncWatchProgress]);

  // Oldinga sakrash ( +10 yoki progress ). Allaqachon o'tilgan oraliq qayta yozilmaydi.
  const creditForwardSeek = (fromTime, toTime) => {
    if (showAdOverlayRef.current) return;
    const from = Number(fromTime);
    const to = Number(toTime);
    if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from + 0.4) return;
    const coveredTo = Math.max(watchHighWaterRef.current, from);
    const delta = to - coveredTo;
    watchHighWaterRef.current = Math.max(watchHighWaterRef.current, to);
    mediaTimeRef.current = to;
    if (delta <= 0.4) return;
    accumulatedWatchSecRef.current += delta;
    void syncWatchProgress();
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
    }, 4000);
  };

  // Swipe gesture handlers
  const handleTouchStart = (e) => {
    if (
      e.target.closest('.watch-modal-bottom-controls') ||
      e.target.closest('.watch-modal-controls-overlay') ||
      e.target.closest('.watch-settings-modal') ||
      e.target.closest('.watch-settings-modal-backdrop') ||
      e.target.closest('.ads-movie-overlay')
    ) return;
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
      handleClose();
    } else {
      setModalTranslateY(0);
    }
    setIsDraggingModal(false);
    setTouchStart(null);
    setTouchEnd(null);
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

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const ct = videoRef.current.currentTime;
      setCurrentTime(ct);
      if (showAdOverlayRef.current) {
        lastWatchTickWallRef.current = null;
        mediaTimeRef.current = ct;
        return;
      }
      const jump = ct - mediaTimeRef.current;
      if (jump > 0 && jump < 2.5) {
        watchHighWaterRef.current = Math.max(watchHighWaterRef.current, ct);
      }
      mediaTimeRef.current = ct;
      accumulateWatchTime();
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
      v.__markWantPlay?.(Boolean(pending.play));
      if (pending.play) v.play().catch(() => {});
      seekAfterLangChangeRef.current = null;
    }
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
    return () => clearHideTimeout();
  }, [isPlaying]);

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

  const sharedHandlersRef = useRef({});
  sharedHandlersRef.current = {
    handleTimeUpdate,
    handleLoadedMetadata,
    onPlay: () => {
      isPlayingRef.current = true;
      setIsPlaying(true);
      lastWatchTickWallRef.current =
        typeof performance !== 'undefined' ? performance.now() : Date.now();
    },
    onPause: () => {
      isPlayingRef.current = false;
      setIsPlaying(false);
      lastWatchTickWallRef.current = null;
      syncWatchProgress({ force: true });
    },
    onRateChange: (event) => {
      if (event.target.playbackRate !== playbackSpeed) {
        console.log('Rate mismatch! Expected:', playbackSpeed, 'Got:', event.target.playbackRate);
      }
    },
  };

  useEffect(() => {
    const el = mediaRef.current;
    const owner = ownsMovie(el, movie?.id);
    if (!el || !owner) {
      videoRef.current = null;
      isPlayingRef.current = false;
      setIsPlaying(false);
      return undefined;
    }
    videoRef.current = el;
    const continuing = Boolean(continuingMedia(mediaRef, movie?.id));
    isPlayingRef.current = !el.paused && !el.ended;
    setIsPlaying(isPlayingRef.current);
    setCurrentTime(el.currentTime || 0);
    if (Number.isFinite(el.duration)) setDuration(el.duration);
    if (continuing) {
      hasUserStartedWatchingRef.current = true;
      lastAdAtVideoTimeRef.current = Math.floor((el.currentTime || 0) / AD_INTERVAL_SECONDS);
      mediaTimeRef.current = el.currentTime || 0;
      setVolume(el.volume);
      setIsMuted(el.muted);
      if (el.playbackRate) setPlaybackSpeed(el.playbackRate);
    } else {
      el.volume = volume;
      el.muted = isMuted;
      el.playbackRate = playbackSpeedRef.current;
    }

    const onPlay = () => sharedHandlersRef.current.onPlay();
    const onPause = () => sharedHandlersRef.current.onPause();
    const onTime = () => sharedHandlersRef.current.handleTimeUpdate();
    const onMeta = () => sharedHandlersRef.current.handleLoadedMetadata();
    const onRate = (event) => sharedHandlersRef.current.onRateChange(event);

    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onMeta);
    el.addEventListener('loadeddata', onMeta);
    el.addEventListener('canplay', onMeta);
    el.addEventListener('ratechange', onRate);
    return () => {
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('loadedmetadata', onMeta);
      el.removeEventListener('loadeddata', onMeta);
      el.removeEventListener('canplay', onMeta);
      el.removeEventListener('ratechange', onRate);
    };
  }, [mediaRef, volume, isMuted, movie?.id, session?.kind, session?.id, session?.src]);

  useEffect(() => {
    if (!movieSession) return;
    const el = mediaRef.current;
    if (!ownsMovie(el, movieSession.id)) return;
    bindSession(movieSession);
  }, [bindSession, mediaRef, movieSession]);

  const handleMediaSlot = useCallback((node) => {
    registerDetailSlot(node);
  }, [registerDetailSlot]);

  return (
    <div
      ref={modalRef}
      className="watch-modal watch-modal--inline"
    >
      <div className="watch-modal-content">
        <div className="watch-modal-video-section">
            <div 
              ref={videoWrapperRef}
              className="watch-modal-video-wrapper"
            >
              <VideoPlayerControls
                className="watch-modal-shared-player"
                sharedMediaRef={mediaRef}
                onMediaSlot={handleMediaSlot}
                mediaActive={movieMediaActive}
                onPlayPause={handlePlayPause}
                onSeek={(from, to) => creditForwardSeek(from, to)}
                controlsSuppressed={showAdOverlay}
                renderSettings={({ anchorRef, isOpen, onClose: closeSettings }) => (
                  <WatchSettingsModal
                    isOpen={isOpen}
                    onClose={closeSettings}
                    anchorRef={anchorRef}
                    playbackSpeed={playbackSpeed}
                    onSpeedChange={handleSpeedChange}
                    watchVideoLang={watchVideoLang}
                    onLangChange={handleWatchLangChange}
                    hasLangSwitch={hasWatchVideoLangSwitch}
                    speedOptions={speedOptions}
                  />
                )}
              />
              
              <AdsMovie
                ref={adsRef}
                movieId={movie?.id}
                videoRef={videoRef}
                onVisibilityChange={setShowAdOverlay}
                onAdEnded={handleAdEnded}
              />
            </div>
          </div>
        </div>
      </div>
  );
};

export default WatchModal;