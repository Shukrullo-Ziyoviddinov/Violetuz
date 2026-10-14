import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import MovieMiniPlayer from './MovieMiniPlayer';
import {
  registerMoviePause,
  requestPauseMusic,
  requestPauseVideo,
} from '../VideoMiniPlayer/mediaPlaybackGate';
import '../VideoMiniPlayer/VideoMiniPlayer.css';

const MoviePlaybackContext = createContext(null);

const MOVIE_DETAIL_PATH = /^\/movie\/[^/]+$/;

const createMediaElement = () => {
  const el = document.createElement('video');
  el.playsInline = true;
  el.setAttribute('playsinline', '');
  el.setAttribute('webkit-playsinline', '');
  el.preload = 'auto';
  el.disablePictureInPicture = true;
  return el;
};

const sameSource = (el, src) => {
  if (!el || !src) return false;
  const absolute = new URL(src, window.location.href).href;
  return el.currentSrc === absolute || el.src === absolute;
};

export const MoviePlaybackProvider = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const mediaRef = useRef(null);
  const parkRef = useRef(null);
  const detailSlotRef = useRef(null);
  const miniSlotRef = useRef(null);
  const locationRef = useRef(location);
  const sessionRef = useRef(null);
  const activatedRef = useRef(false);
  const wantPlayRef = useRef(false);
  const playbackTimeRef = useRef(0);
  const lastRectRef = useRef(null);

  if (mediaRef.current == null && typeof document !== 'undefined') {
    mediaRef.current = createMediaElement();
  }

  const [session, setSession] = useState(null);
  const [activated, setActivated] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  locationRef.current = location;
  sessionRef.current = session;
  if (activated) activatedRef.current = true;

  const rememberRect = (node) => {
    if (!node) return;
    const rect = node.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;
    lastRectRef.current = rect;
  };

  const holdInView = (park) => {
    const rect = lastRectRef.current;
    if (!rect) return;
    park.style.position = 'fixed';
    park.style.left = `${rect.left}px`;
    park.style.top = `${rect.top}px`;
    park.style.width = `${rect.width}px`;
    park.style.height = `${rect.height}px`;
    park.style.overflow = 'hidden';
    park.style.zIndex = '1201';
    park.style.pointerEvents = 'none';
  };

  const clearHold = (park) => {
    park.style.position = '';
    park.style.left = '';
    park.style.top = '';
    park.style.width = '';
    park.style.height = '';
    park.style.overflow = '';
    park.style.zIndex = '';
    park.style.pointerEvents = '';
  };

  const resumeIfNeeded = () => {
    const video = mediaRef.current;
    if (!video || !wantPlayRef.current || !video.paused) return;
    const box = video.getBoundingClientRect();
    if (box.width < 2 || box.height < 2) return;
    video.play().catch(() => {});
  };

  const placeVideo = useCallback(() => {
    const video = mediaRef.current;
    const park = parkRef.current;
    if (!video || !park) return;
    if (!video.isConnected) park.appendChild(video);

    const path = locationRef.current.pathname;
    const onMoviePage = MOVIE_DETAIL_PATH.test(path);
    const current = sessionRef.current;
    const detail = detailSlotRef.current;
    const mini = miniSlotRef.current;
    const keep = Boolean(
      current && (activatedRef.current || wantPlayRef.current || playbackTimeRef.current > 0.05)
    );
    let target = park;
    let mode = 'park';

    if (onMoviePage && detail) {
      rememberRect(detail);
      target = detail;
      mode = 'detail';
    } else if (keep && !onMoviePage && mini) {
      target = mini;
      mode = 'mini';
    } else if (keep && !onMoviePage) {
      rememberRect(detail);
      mode = 'hold';
    }

    if (video.parentNode !== target) target.appendChild(video);
    video.className = mode === 'detail'
      ? 'watch-modal-video movie-detail-video movie-persistent-media'
      : 'video-mini-player-video movie-persistent-media';

    if (mode === 'hold') holdInView(park);
    else clearHold(park);

    if (mode !== 'detail') resumeIfNeeded();
  }, []);

  const registerDetailSlot = useCallback((node) => {
    detailSlotRef.current = node;
    placeVideo();
  }, [placeVideo]);

  const registerMiniSlot = useCallback((node) => {
    miniSlotRef.current = node;
    placeVideo();
  }, [placeVideo]);

  const bindSession = useCallback((next) => {
    if (!next?.src || next.id == null) return;
    setSession((prev) => {
      if (
        prev
        && String(prev.id) === String(next.id)
        && prev.src === next.src
        && prev.title === next.title
        && prev.route === next.route
        && prev.subtitle === next.subtitle
      ) {
        return prev;
      }
      if (prev && String(prev.id) === String(next.id) && prev.src === next.src) {
        return { ...prev, ...next, src: prev.src };
      }
      return next;
    });
  }, []);

  const close = useCallback(() => {
    const video = mediaRef.current;
    if (video) {
      video.pause();
      video.removeAttribute('src');
      delete video.dataset.movieId;
      video.load();
    }
    detailSlotRef.current = null;
    wantPlayRef.current = false;
    playbackTimeRef.current = 0;
    activatedRef.current = false;
    setSession(null);
    setActivated(false);
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    placeVideo();
  }, [placeVideo]);

  const togglePlay = useCallback(() => {
    const video = mediaRef.current;
    if (!video) return;
    if (video.paused) {
      wantPlayRef.current = true;
      activatedRef.current = true;
      setActivated(true);
      requestPauseMusic();
      requestPauseVideo();
      video.play().catch(() => {});
      return;
    }
    wantPlayRef.current = false;
    video.pause();
  }, []);

  const openDetail = useCallback(() => {
    const current = sessionRef.current;
    if (!current) return;
    navigate(current.route || `/movie/${current.id}`);
  }, [navigate]);

  useEffect(() => {
    const video = mediaRef.current;
    if (!video) return undefined;

    video.__markWantPlay = (next) => {
      wantPlayRef.current = Boolean(next);
      if (next) {
        activatedRef.current = true;
        setActivated(true);
      }
    };

    const onPlay = () => {
      wantPlayRef.current = true;
      activatedRef.current = true;
      setPlaying(true);
      setActivated(true);
      requestPauseMusic();
      requestPauseVideo();
    };
    const onPause = () => setPlaying(false);
    const onTime = () => {
      const time = video.currentTime || 0;
      playbackTimeRef.current = time;
      if (time > 0.05) {
        activatedRef.current = true;
        setActivated(true);
      }
      setCurrentTime(time);
      const nextDuration = video.duration;
      if (Number.isFinite(nextDuration)) setDuration(nextDuration);
    };
    const onEnded = () => setPlaying(false);

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('timeupdate', onTime);
    video.addEventListener('ended', onEnded);
    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('timeupdate', onTime);
      video.removeEventListener('ended', onEnded);
    };
  }, []);

  useEffect(() => registerMoviePause(() => {
    wantPlayRef.current = false;
    const video = mediaRef.current;
    if (!video || video.paused) return;
    video.pause();
    setPlaying(false);
  }), []);

  useEffect(() => {
    const video = mediaRef.current;
    if (!video || !session?.src) return;
    video.dataset.movieId = String(session.id);
    if (sameSource(video, session.src)) return;
    wantPlayRef.current = false;
    video.pause();
    video.poster = session.cover || '';
    video.src = session.src;
  }, [session]);

  useLayoutEffect(() => {
    placeVideo();
  });

  const onMoviePage = MOVIE_DETAIL_PATH.test(location.pathname);
  const media = mediaRef.current;
  const progressed = Boolean(
    activated
    || wantPlayRef.current
    || playbackTimeRef.current > 0.05
    || (media && (media.currentTime > 0.05 || (!media.paused && media.currentSrc)))
  );
  const showMini = Boolean(session && progressed && !onMoviePage);
  const progress = duration > 0 ? currentTime / duration : 0;

  const api = useMemo(
    () => ({
      mediaRef,
      bindSession,
      registerDetailSlot,
    }),
    [bindSession, registerDetailSlot]
  );

  return (
    <MoviePlaybackContext.Provider value={api}>
      {children}
      <div ref={parkRef} className="video-persistent-park" />
      {showMini
        ? createPortal(
          <MovieMiniPlayer
            title={session.title || ''}
            artistName={session.subtitle || ''}
            playing={playing}
            progress={progress}
            onRegisterSlot={registerMiniSlot}
            onClose={close}
            onOpenDetail={openDetail}
            onTogglePlay={togglePlay}
          />,
          document.body
        )
        : null}
    </MoviePlaybackContext.Provider>
  );
};

export const useMoviePlayback = () => {
  const value = useContext(MoviePlaybackContext);
  if (!value) {
    throw new Error('useMoviePlayback MoviePlaybackProvider ichida ishlatiladi');
  }
  return value;
};
