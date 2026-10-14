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
import MiniVideoWindow from './MiniVideoWindow';
import { claimVideoPlayback, registerVideoEngine } from '../VideoMiniPlayer/mediaPlaybackGate';
import {
  MINI_VIDEO_KIND,
  mergeMiniVideoSession,
  sessionMatchesDetailPath,
} from './miniVideoSession';
import './MiniVideoWindow.css';

const MiniVideoPlaybackContext = createContext(null);

const DETAIL_CLASS = {
  [MINI_VIDEO_KIND.KLIP]: 'music-vp-video video-persistent-media',
  [MINI_VIDEO_KIND.KONSERT]: 'music-vp-video video-persistent-media',
  [MINI_VIDEO_KIND.KINO]: 'watch-modal-video movie-detail-video movie-persistent-media',
  [MINI_VIDEO_KIND.TREYLER]: 'trailer-modal-video video-persistent-media',
};

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

const windowLabels = (kind) => {
  if (kind === MINI_VIDEO_KIND.KINO) {
    return {
      variant: 'movie',
      ariaLabel: 'Faol kino',
      openLabel: "Kino sahifasiga o'tish",
      closeLabel: 'Kinoni yopish',
    };
  }
  if (kind === MINI_VIDEO_KIND.TREYLER) {
    return {
      variant: 'movie',
      ariaLabel: 'Faol treyler',
      openLabel: "Treyler sahifasiga o'tish",
      closeLabel: 'Treylerni yopish',
    };
  }
  return {
    variant: 'video',
    ariaLabel: 'Faol video',
    openLabel: "Video sahifasiga o'tish",
    closeLabel: 'Videoni yopish',
  };
};

export const MiniVideoPlaybackProvider = ({ children }) => {
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
  const engineRef = useRef(null);
  const detailKeyRef = useRef(null);

  if (mediaRef.current == null && typeof document !== 'undefined') {
    mediaRef.current = createMediaElement();
  }

  const [session, setSession] = useState(null);
  const [activated, setActivated] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [suppressed, setSuppressed] = useState(false);
  const [detailKey, setDetailKey] = useState(null);

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
    const current = sessionRef.current;
    const trailerMatches = !current
      || current.kind !== MINI_VIDEO_KIND.TREYLER
      || (detailKeyRef.current != null && String(detailKeyRef.current) === String(current.id));
    const onDetailPage = sessionMatchesDetailPath(current, path) && trailerMatches;
    const detail = detailSlotRef.current;
    const mini = miniSlotRef.current;
    const keep = Boolean(
      current && (activatedRef.current || wantPlayRef.current || playbackTimeRef.current > 0.05)
    );
    let target = park;
    let mode = 'park';

    if (onDetailPage && detail) {
      rememberRect(detail);
      target = detail;
      mode = 'detail';
    } else if (keep && !onDetailPage && mini) {
      target = mini;
      mode = 'mini';
    } else if (keep && !onDetailPage) {
      rememberRect(detail);
      mode = 'hold';
    }

    if (video.parentNode !== target) target.appendChild(video);
    video.className = mode === 'detail'
      ? (DETAIL_CLASS[current?.kind] || 'video-persistent-media')
      : 'video-mini-player-video video-persistent-media';

    if (mode === 'hold') holdInView(park);
    else clearHold(park);

    if (mode !== 'detail') resumeIfNeeded();
  }, []);

  const registerDetailSlot = useCallback((node) => {
    detailSlotRef.current = node;
    placeVideo();
  }, [placeVideo]);

  const registerDetailKey = useCallback((key) => {
    const next = key == null || key === '' ? null : String(key);
    if (detailKeyRef.current === next) {
      placeVideo();
      return;
    }
    detailKeyRef.current = next;
    setDetailKey(next);
    placeVideo();
  }, [placeVideo]);

  const registerMiniSlot = useCallback((node) => {
    miniSlotRef.current = node;
    placeVideo();
  }, [placeVideo]);

  const bindSession = useCallback((next) => {
    setSession((prev) => mergeMiniVideoSession(prev, next));
  }, []);

  const activateSession = useCallback((next) => {
    const video = mediaRef.current;
    const session = mergeMiniVideoSession(null, next);
    if (!video || !session) return;
    setSession((prev) => mergeMiniVideoSession(prev, session));
    video.dataset.miniVideoKind = session.kind;
    video.dataset.miniVideoId = String(session.id);
    if (!sameSource(video, session.src)) {
      video.pause();
      video.poster = session.cover || '';
      video.src = session.src;
    }
    wantPlayRef.current = true;
    activatedRef.current = true;
    setActivated(true);
    video.play().catch(() => {});
  }, []);

  const close = useCallback(() => {
    const video = mediaRef.current;
    if (video) {
      video.pause();
      video.removeAttribute('src');
      delete video.dataset.miniVideoKind;
      delete video.dataset.miniVideoId;
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
      claimVideoPlayback(engineRef.current);
      video.play().catch(() => {});
      return;
    }
    wantPlayRef.current = false;
    video.pause();
  }, []);

  const openDetail = useCallback(() => {
    const current = sessionRef.current;
    if (!current?.route) return;
    navigate(current.route);
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
      claimVideoPlayback(engineRef.current);
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

  useEffect(() => {
    const engine = {
      pause: () => {
        wantPlayRef.current = false;
        const video = mediaRef.current;
        if (video && !video.paused) video.pause();
        setPlaying(false);
      },
      yield: () => {
        engine.pause();
        setSuppressed(true);
      },
      release: () => setSuppressed(false),
    };
    engineRef.current = engine;
    return registerVideoEngine(engine);
  }, []);

  useEffect(() => {
    const video = mediaRef.current;
    if (!video || !session?.src) return;
    video.dataset.miniVideoKind = session.kind;
    video.dataset.miniVideoId = String(session.id);
    if (sameSource(video, session.src)) return;
    const autoplay = sessionMatchesDetailPath(session, locationRef.current.pathname)
      && (session.kind === MINI_VIDEO_KIND.KLIP || session.kind === MINI_VIDEO_KIND.KONSERT);
    if (!autoplay) wantPlayRef.current = false;
    video.pause();
    video.poster = session.cover || '';
    video.src = session.src;
    if (!autoplay) return;
    const pending = video.play();
    if (pending && typeof pending.then === 'function') {
      pending.then(() => {
        if (video.paused) return;
        wantPlayRef.current = true;
        activatedRef.current = true;
        setActivated(true);
      }).catch(() => {});
    }
  }, [session]);

  useLayoutEffect(() => {
    placeVideo();
  });

  const trailerOnPage = session?.kind !== MINI_VIDEO_KIND.TREYLER
    || (detailKey != null && String(detailKey) === String(session.id));
  const onDetailPage = sessionMatchesDetailPath(session, location.pathname) && trailerOnPage;
  const media = mediaRef.current;
  const progressed = Boolean(
    activated
    || wantPlayRef.current
    || playbackTimeRef.current > 0.05
    || (media && (media.currentTime > 0.05 || (!media.paused && media.currentSrc)))
  );
  const showMini = Boolean(session && progressed && !onDetailPage && !suppressed);
  const progress = duration > 0 ? currentTime / duration : 0;
  const labels = windowLabels(session?.kind);

  const api = useMemo(
    () => ({
      mediaRef,
      session,
      bindSession,
      activateSession,
      registerDetailSlot,
      registerDetailKey,
    }),
    [session, bindSession, activateSession, registerDetailSlot, registerDetailKey]
  );

  return (
    <MiniVideoPlaybackContext.Provider value={api}>
      {children}
      <div ref={parkRef} className="video-persistent-park" />
      {showMini
        ? createPortal(
          <MiniVideoWindow
            title={session.title || ''}
            artistName={session.subtitle || ''}
            playing={playing}
            progress={progress}
            onRegisterSlot={registerMiniSlot}
            onClose={close}
            onOpenDetail={openDetail}
            onTogglePlay={togglePlay}
            variant={labels.variant}
            ariaLabel={labels.ariaLabel}
            openLabel={labels.openLabel}
            closeLabel={labels.closeLabel}
          />,
          document.body
        )
        : null}
    </MiniVideoPlaybackContext.Provider>
  );
};

export const useMiniVideoPlayback = () => {
  const value = useContext(MiniVideoPlaybackContext);
  if (!value) {
    throw new Error('useMiniVideoPlayback MiniVideoPlaybackProvider ichida ishlatiladi');
  }
  return value;
};
