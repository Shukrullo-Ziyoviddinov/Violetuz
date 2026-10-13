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
import { useLocation, useNavigate } from 'react-router-dom';
import VideoMiniPlayer from './VideoMiniPlayer';
import { registerVideoPause, requestPauseMusic } from './mediaPlaybackGate';
import './VideoMiniPlayer.css';

const VideoPlaybackContext = createContext(null);

const VIDEO_DETAIL_PATH = /^\/music\/video\/[^/]+$/;

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

export const VideoPlaybackProvider = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const mediaRef = useRef(null);
  const parkRef = useRef(null);
  const detailSlotRef = useRef(null);
  const miniSlotRef = useRef(null);
  const locationRef = useRef(location);
  const sessionRef = useRef(null);
  const activatedRef = useRef(false);

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
  activatedRef.current = activated;

  const placeVideo = useCallback(() => {
    const video = mediaRef.current;
    const park = parkRef.current;
    if (!video || !park) return;
    if (!video.isConnected) park.appendChild(video);

    const path = locationRef.current.pathname;
    const onVideoPage = VIDEO_DETAIL_PATH.test(path);
    const current = sessionRef.current;
    const detail = detailSlotRef.current;
    const mini = miniSlotRef.current;
    let target = park;
    let mode = 'park';

    if (onVideoPage && detail) {
      target = detail;
      mode = 'detail';
    } else if (current && activatedRef.current && !onVideoPage && mini) {
      target = mini;
      mode = 'mini';
    }

    if (video.parentNode !== target) target.appendChild(video);
    video.className = mode === 'detail'
      ? 'music-vp-video video-persistent-media'
      : 'video-mini-player-video video-persistent-media';
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
      video.load();
    }
    detailSlotRef.current = null;
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
      requestPauseMusic();
      video.play().catch(() => {});
      return;
    }
    video.pause();
  }, []);

  const openDetail = useCallback(() => {
    const current = sessionRef.current;
    if (!current) return;
    navigate(current.route || `/music/video/${current.id}`);
  }, [navigate]);

  useEffect(() => {
    const video = mediaRef.current;
    if (!video) return undefined;

    const onPlay = () => {
      setPlaying(true);
      setActivated(true);
      requestPauseMusic();
    };
    const onPause = () => setPlaying(false);
    const onTime = () => {
      setCurrentTime(video.currentTime || 0);
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

  useEffect(() => registerVideoPause(() => {
    const video = mediaRef.current;
    if (!video || video.paused) return;
    video.pause();
    setPlaying(false);
  }), []);

  useEffect(() => {
    const video = mediaRef.current;
    if (!video || !session?.src) return;
    if (sameSource(video, session.src)) return;
    video.poster = session.cover || '';
    video.src = session.src;
    video.play().catch(() => {});
  }, [session]);

  useLayoutEffect(() => {
    placeVideo();
  });

  const onVideoPage = VIDEO_DETAIL_PATH.test(location.pathname);
  const showMini = Boolean(session && activated && !onVideoPage);
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
    <VideoPlaybackContext.Provider value={api}>
      {children}
      <div ref={parkRef} className="video-persistent-park" />
      {showMini ? (
        <VideoMiniPlayer
          title={session.title || ''}
          artistName={session.artistName || ''}
          playing={playing}
          progress={progress}
          onRegisterSlot={registerMiniSlot}
          onClose={close}
          onOpenDetail={openDetail}
          onTogglePlay={togglePlay}
        />
      ) : null}
    </VideoPlaybackContext.Provider>
  );
};

export const useVideoPlayback = () => {
  const value = useContext(VideoPlaybackContext);
  if (!value) {
    throw new Error('useVideoPlayback VideoPlaybackProvider ichida ishlatiladi');
  }
  return value;
};
