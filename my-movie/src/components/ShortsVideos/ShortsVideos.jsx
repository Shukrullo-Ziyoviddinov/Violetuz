import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useWishlist } from '../../context/WishlistContext';
import { useMoviesApi } from '../../context/MoviesApiContext';
import { useMusicApi } from '../../context/MusicApiContext';
import { resolveShortsWithMovies } from '../../utils/resolveShortsWithMovies';
import { addWatch } from '../../api/shortsWatchHistory';
import { postShortsRecoEvent } from '../../api/shortsRecoApi';
import { useShortsRecoPlayback } from './useShortsRecoPlayback';
import { useShortsPageOrder } from './useShortsPageOrder';
import {
  createWatch,
  notePlayback,
  progressEvents,
  signalWatch,
  closeWatch,
} from './shortsRecoWatch';
import { recordViewRequest } from '../../api/viewsApi';
import { useAuth } from '../../context/AuthContext';
import VertikalDrag from '../VertikalDrag/VertikalDrag';
import ShortsComments from './ShortsComments';
import ShortsShare from './ShortsShare';
import Repost from '../Repost/Repost';
import SearchModalTavsiya from '../SearchModalTavsiya/SearchModalTavsiya';
import LikeButton from '../../Music/LikeButton/LikeButton';
import ShortsMovieHead from './ShortsMovieHead';
import ShortsMusicHead from './ShortsMusicHead';
import { getLocalizedField } from '../../utils/shortsMovieUtils';
import { formatShortsLikeCount } from '../../utils/utils';
import {
  shortsWishlistType,
  displaySaveCount,
} from '../../store/slices/wishlistUtils';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import ShortsVideoThumb from './ShortsVideoThumb';
import ViewCount from '../ViewCount/ViewCount';
import ShortsDownloadButton from './ShortsDownloadButton';
import './ShortsVideos.css';

const MOBILE_BREAKPOINT = 768;
const SLIDE_DURATION = 320; // ms
const GRID_SKELETON_COUNT = 12;

/** Profil repost playlist: faqat berilgan id lar ketma-ketligi (topilmasa tashlab yuboriladi) */
function orderShortsByRepostIds(fullList, ids) {
  if (!ids?.length) return fullList;
  const out = [];
  for (const rid of ids) {
    const found = fullList.find((s) => String(s.id) === String(rid));
    if (found) out.push(found);
  }
  return out;
}

/** Kino + musiqa shortslari aralash: har bir element o‘z katalogidan olinadi */
function buildRepostShortsList(entries, movieCatalog, musicCatalog) {
  if (!entries?.length) return [];
  const out = [];
  for (const e of entries) {
    if (e.type === 'movieShorts') {
      const found = movieCatalog.find((s) => String(s.id) === String(e.id));
      if (found) out.push(found);
    } else if (e.type === 'musicshorts') {
      const found = musicCatalog.find((s) => String(s.id) === String(e.id));
      if (found) out.push(found);
    }
  }
  return out;
}

const formatTime = (seconds) => {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const ShortsSaveButton = ({ item, isInWishlist, onClick }) => {
  const type = shortsWishlistType(item);
  const saved = item?.id != null && isInWishlist(item.id, type);
  const count = displaySaveCount(item?.saveCount, saved);
  return (
    <button
      type="button"
      className={`shorts-modal-action-btn shorts-modal-save-btn ${saved ? 'active' : ''}`}
      onClick={onClick}
      aria-label="Saqlash"
    >
      <svg
        viewBox="0 0 24 24"
        fill={saved ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
      <span className="shorts-modal-action-count">{formatShortsLikeCount(count)}</span>
    </button>
  );
};

const renderShortsModalTitle = (item, contentLang, isMusicSlide = false, onWatchClick) => {
  if (isMusicSlide && item?.musicId) {
    return <ShortsMusicHead item={item} contentLang={contentLang} onWatchClick={onWatchClick} />;
  }
  if (!isMusicSlide && item?.movieId) {
    return <ShortsMovieHead item={item} contentLang={contentLang} onWatchClick={onWatchClick} />;
  }
  return (
    <h3 className="shorts-modal-title">{getLocalizedField(item?.title, contentLang)}</h3>
  );
};

// Bitta video player card (desktop animatsiya uchun)
const VideoSlide = React.forwardRef(({ item, contentLang, videoState, onVideoClick, onProgressClick, onDescriptionClick, onWatchClick, descriptionExpanded, showPlayPause, onMouseEnter, onMouseLeave }, ref) => {
  const getTitle = (it) => getLocalizedField(it?.title, contentLang);
  const getDescription = (it) => it.description?.[contentLang] || it.description?.uz || '';
  const getVideo = (it) => it.video?.[contentLang] || it.video?.uz || '';

  return (
    <div
      className="shorts-modal-video-inner shorts-modal-desktop-inner"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <video
        ref={ref}
        src={getVideo(item)}
        autoPlay
        playsInline
        loop
        className="shorts-modal-video shorts-modal-desktop-video-el"
        onClick={onVideoClick}
      />
      {showPlayPause && (
        <button
          className="shorts-modal-play-pause-center"
          onClick={(e) => { e.stopPropagation(); onVideoClick(e); }}
          aria-label={videoState.isPlaying ? 'Pauza' : 'Ijro'}
        >
          {videoState.isPlaying ? (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      )}
      <div className={`shorts-modal-info shorts-modal-info-overlay shorts-modal-info-desktop ${descriptionExpanded ? 'shorts-modal-info-expanded' : ''}`}>
        <div className="shorts-modal-info-content">
          <Link to={`/movie/${item.movieId}`} className="shorts-modal-watch-btn" onClick={onWatchClick}>
            {contentLang === 'ru' ? 'Смотреть' : 'Tomosha qilish'}
          </Link>
          {renderShortsModalTitle(item, contentLang, false, onWatchClick)}
          <p
            className={`shorts-modal-description ${descriptionExpanded ? 'shorts-modal-description-expanded' : ''}`}
            onClick={onDescriptionClick}
          >
            {getDescription(item)}
          </p>
        </div>
        <div className="shorts-modal-progress-wrap shorts-modal-progress-fixed">
          <div className="shorts-modal-progress-bar" onClick={onProgressClick}>
            <div
              className="shorts-modal-progress-fill"
              style={{ width: `${(videoState.currentTime / (videoState.duration || 1)) * 100}%` }}
            />
          </div>
          <span className="shorts-modal-duration">
            {formatTime(videoState.currentTime)} / {formatTime(videoState.duration)}
          </span>
        </div>
      </div>
    </div>
  );
});

const ShortsVideos = ({
  initialShorts = null,
  startIndex = null,
  shortId = null,
  onCloseFromHome = null,
  variant = 'movie',
  repostIds = null,
  repostShortsEntries = null,
}) => {
  const { contentLang } = useContentLanguage();
  const { isLoggedIn } = useAuth();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { allShortsVideos, allMovies, shortsLoading, moviesLoading } = useMoviesApi();
  const {
    allMusic,
    allClips,
    allConcerts,
    musicShortsCatalog,
    musicShortsLoading,
  } = useMusicApi();
  const movieShortsCatalog = useMemo(
    () =>
      resolveShortsWithMovies(allShortsVideos, allMovies, allMusic, allClips, allConcerts),
    [allShortsVideos, allMovies, allMusic, allClips, allConcerts]
  );
  const mixedCatalog = useMemo(
    () => [...movieShortsCatalog, ...musicShortsCatalog],
    [movieShortsCatalog, musicShortsCatalog]
  );
  const isMusicShorts = variant === 'music';
  const recoEnabled = !initialShorts && !repostIds?.length && !repostShortsEntries?.length;
  const [modalOpen, setModalOpen] = useState(
    () => startIndex != null && startIndex >= 0
  );
  const [feedRefresh, setFeedRefresh] = useState(0);
  const [openedFocus, setOpenedFocus] = useState(shortId ?? null);
  const pendingWatchesRef = useRef(new Map());
  const activeWatchRef = useRef(null);
  const flushWatchesRef = useRef(() => {});
  const watchRef = useRef(null);
  const sendChainRef = useRef(Promise.resolve());
  const shortsListRef = useRef([]);
  const gridListRef = useRef([]);
  const activeIndexRef = useRef(0);
  const playerFocus = openedFocus ?? shortId ?? null;
  const { list: recoList, loadMore: loadMoreReco, syncAt: syncReco } = useShortsRecoPlayback({
    enabled: recoEnabled && (modalOpen || (playerFocus != null && String(playerFocus) !== '')),
    catalog: mixedCatalog,
    shortId: playerFocus,
    refreshKey: feedRefresh,
    locked: modalOpen,
  });
  const { list: pageList, failed: pageFailed } = useShortsPageOrder({
    enabled: recoEnabled,
    catalog: mixedCatalog,
    refreshKey: feedRefresh,
  });
  const baseList = initialShorts || (isMusicShorts ? musicShortsCatalog : mixedCatalog);
  const isDataLoading = isMusicShorts
    ? musicShortsLoading
    : shortsLoading || moviesLoading || musicShortsLoading;
  const waitingForPage = recoEnabled && baseList.length > 0 && pageList == null && !pageFailed;
  const showGridSkeleton = !initialShorts && (isDataLoading || waitingForPage);
  const openedItem = useMemo(() => {
    if (playerFocus == null || String(playerFocus) === '') return null;
    return mixedCatalog.find((item) => String(item.id) === String(playerFocus)) || null;
  }, [playerFocus, mixedCatalog]);
  const gridList = useMemo(() => {
    if (repostShortsEntries?.length) {
      return buildRepostShortsList(repostShortsEntries, movieShortsCatalog, musicShortsCatalog);
    }
    if (recoEnabled && pageList) return pageList;
    if (waitingForPage) return [];
    return orderShortsByRepostIds(baseList, repostIds);
  }, [repostShortsEntries, movieShortsCatalog, musicShortsCatalog, recoEnabled, pageList, waitingForPage, baseList, repostIds]);
  const shortsList = useMemo(() => {
    if (!recoEnabled) return gridList;
    if (recoList && recoList.length) return recoList;
    if (openedItem) return [openedItem];
    return [];
  }, [recoEnabled, gridList, recoList, openedItem]);
  const [isMobileView, setIsMobileView] = useState(false);
  const [activeIndex, setActiveIndex] = useState(startIndex ?? 0);
  shortsListRef.current = shortsList;
  gridListRef.current = gridList;
  activeIndexRef.current = activeIndex;

  const slideMusic = shortsList[activeIndex]?.type === 'musicshorts';

  const repostShareRoute = useMemo(() => {
    const p = new URLSearchParams();
    if (repostShortsEntries?.length) {
      p.set('repostShorts', repostShortsEntries.map((e) => `${e.type}:${e.id}`).join(','));
    } else if (repostIds?.length) {
      p.set('repostIds', repostIds.map(String).join(','));
    }
    p.set('startIndex', String(activeIndex));
    const q = p.toString();
    return `/shorts?${q}`;
  }, [repostShortsEntries, repostIds, activeIndex]);

  // Desktop slide animation
  // slideState: null | { fromIndex, toIndex, direction: 'up'|'down', phase: 'animating'|'done' }
  const [slideState, setSlideState] = useState(null);
  const slideTimeoutRef = useRef(null);
  const slideRafRef = useRef(null);

  const modalVideoRef = useRef(null);
  const desktopVideoRefs = useRef(new Map());
  const mobileVideoRefs = useRef(new Map());
  const mobileVideoTapRef = useRef({ startY: 0, moved: false });
  const shortsCommentsRef = useRef(null);
  const shortsModalHistoryRef = useRef(false);
  const [modalVideoState, setModalVideoState] = useState({ isPlaying: true, currentTime: 0, duration: 0 });
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [mobilePlayOverlayVisible, setMobilePlayOverlayVisible] = useState(false);
  const [modalVideoMuted, setModalVideoMuted] = useState(false);
  const [desktopHover, setDesktopHover] = useState(false);
  const [shortsCommentCount, setShortsCommentCount] = useState(0);
  const [musicModalOpen, setMusicModalOpen] = useState(false);
  const musicAudioRef = useRef(null);
  const musicClipVideoRef = useRef(null);
  const clipVideoWrapRef = useRef(null);
  const [musicPlayerState, setMusicPlayerState] = useState({ isPlaying: false, currentTime: 0, duration: 0 });
  const [musicClipVideoState, setMusicClipVideoState] = useState({ isPlaying: false, currentTime: 0, duration: 0 });
  const [clipControlsVisible, setClipControlsVisible] = useState(false);
  const [clipVideoFullscreen, setClipVideoFullscreen] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth <= MOBILE_BREAKPOINT);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => () => {
    if (slideTimeoutRef.current) clearTimeout(slideTimeoutRef.current);
    if (slideRafRef.current) cancelAnimationFrame(slideRafRef.current);
  }, []);

  // Open modal at startIndex when provided (e.g. from /shorts?startIndex=2)
  useEffect(() => {
    if (shortId != null && String(shortId) !== '') return;
    if (startIndex != null && startIndex >= 0 && shortsList.length > 0) {
      const safe = Math.min(startIndex, shortsList.length - 1);
      setActiveIndex(safe);
      setModalOpen(true);
      setMobilePlayOverlayVisible(false);
      setModalVideoState((s) => ({ ...s, isPlaying: true, currentTime: 0 }));
    }
  }, [shortId, startIndex, shortsList.length]);

  const openedShortIdRef = useRef(null);
  useEffect(() => {
    if (shortId == null || String(shortId) === '' || shortsList.length === 0) return;
    if (openedShortIdRef.current === String(shortId)) return;
    const idx = shortsList.findIndex((item) => String(item.id) === String(shortId));
    if (idx < 0) return;
    openedShortIdRef.current = String(shortId);
    setActiveIndex(idx);
    setModalOpen(true);
    setMobilePlayOverlayVisible(false);
    setModalVideoState((s) => ({ ...s, isPlaying: true, currentTime: 0 }));
  }, [shortId, shortsList]);

  const recoOpenedRef = useRef(null);
  const focusId = openedFocus ?? shortId;
  useEffect(() => {
    if (!recoEnabled || !recoList || focusId == null || String(focusId) === '') return;
    if (recoOpenedRef.current === String(focusId)) return;
    const first = recoList[0];
    if (!first || String(first.id) !== String(focusId)) return;
    recoOpenedRef.current = String(focusId);
    if (!modalOpen) {
      setActiveIndex(0);
      setModalOpen(true);
    }
  }, [recoEnabled, recoList, focusId, modalOpen]);

  const rememberWatch = (short, stats) => {
    if (!short || short.id == null) return;
    if (stats.playedMsDelta < 1500 && stats.passRatio < 0.15) return;
    const key = `${short.type || 'movieShorts'}:${short.id}`;
    const prev = pendingWatchesRef.current.get(key);
    const passRatio = Math.max(prev ? prev.passRatio : 0, stats.passRatio);
    pendingWatchesRef.current.set(key, {
      shortId: short.id,
      passRatio,
      playedMsDelta: (prev ? prev.playedMsDelta : 0) + stats.playedMsDelta,
      completionsDelta: passRatio >= 0.9 ? 1 : undefined,
    });
  };

  const takeWatches = () => {
    const batch = [...pendingWatchesRef.current.values()];
    pendingWatchesRef.current.clear();
    return batch;
  };

  const syncRecoRef = useRef(syncReco);
  syncRecoRef.current = syncReco;

  const enqueueReco = (event, index, shouldSync) => {
    sendChainRef.current = sendChainRef.current
      .catch(() => {})
      .then(() => (event ? postShortsRecoEvent(event) : null))
      .then(() => {
        if (shouldSync) syncRecoRef.current(index);
      })
      .catch(() => {});
  };

  const flushPendingWatches = ({ refresh = false } = {}) => {
    if (recoEnabled) {
      const current = watchRef.current;
      let event = null;
      if (current) {
        notePlayback(current, performance.now(), modalVideoRef.current, false);
        event = closeWatch(current);
        watchRef.current = null;
      }
      if (event) enqueueReco(event, activeIndexRef.current, false);
      if (refresh) {
        sendChainRef.current = sendChainRef.current.then(() => {
          setFeedRefresh((value) => value + 1);
        });
      }
      return;
    }
    const snap = activeWatchRef.current;
    if (snap) {
      const duration = snap.video && Number.isFinite(snap.video.duration) ? snap.video.duration : 0;
      const current = snap.video && Number.isFinite(snap.video.currentTime) ? snap.video.currentTime : 0;
      const passRatio = duration > 0 ? Math.min(1, Math.max(0, current / duration)) : 0;
      rememberWatch(snap.short, {
        passRatio,
        playedMsDelta: Math.max(0, Date.now() - snap.started),
      });
      activeWatchRef.current = null;
    }
    const batch = takeWatches();
    if (!batch.length) return;
    Promise.all(batch.map((event) => postShortsRecoEvent(event).catch(() => {}))).then(() => {
      if (refresh) setFeedRefresh((value) => value + 1);
    });
  };
  flushWatchesRef.current = flushPendingWatches;

  const sendRecoSignal = (flags) => {
    if (!recoEnabled) return;
    const watch = watchRef.current;
    if (!watch) return;
    const event = signalWatch(watch, flags);
    if (event) enqueueReco(event, activeIndexRef.current, true);
  };

  useEffect(() => {
    if (!modalOpen) return undefined;
    const short = shortsList[activeIndex];
    if (!short) return undefined;
    const started = Date.now();
    const videoMap = isMobileView ? mobileVideoRefs.current : desktopVideoRefs.current;
    const video = videoMap.get(activeIndex) || modalVideoRef.current;
    activeWatchRef.current = recoEnabled ? null : { short, started, video };
    const t = setTimeout(() => addWatch(short), 2000);
    return () => {
      clearTimeout(t);
      if (recoEnabled) return;
      const snap = activeWatchRef.current;
      if (!snap || snap.short !== short) return;
      const duration = snap.video && Number.isFinite(snap.video.duration) ? snap.video.duration : 0;
      const currentTime = snap.video && Number.isFinite(snap.video.currentTime) ? snap.video.currentTime : 0;
      const passRatio = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;
      rememberWatch(snap.short, {
        passRatio,
        playedMsDelta: Math.max(0, Date.now() - snap.started),
      });
      activeWatchRef.current = null;
    };
  }, [modalOpen, activeIndex, shortsList, isMobileView, recoEnabled]);

  const activeRecoKey = `${shortsList[activeIndex]?.type || ''}:${shortsList[activeIndex]?.id ?? ''}`;
  useEffect(() => {
    if (!recoEnabled || !modalOpen) return undefined;
    const short = shortsListRef.current[activeIndex];
    const watch = createWatch(short);
    if (!watch) return undefined;
    watchRef.current = watch;
    enqueueReco(null, activeIndex, true);

    const tick = () => {
      const current = watchRef.current;
      if (!current || current.closed || current.viewId !== watch.viewId) return;
      const hidden = document.visibilityState === 'hidden';
      notePlayback(current, performance.now(), modalVideoRef.current, hidden);
      if (hidden) return;
      progressEvents(current).forEach((event) => {
        enqueueReco(event, activeIndex, true);
      });
    };

    const finishHidden = () => {
      const current = watchRef.current;
      if (!current || current.viewId !== watch.viewId) return;
      notePlayback(current, performance.now(), modalVideoRef.current, true);
      const event = closeWatch(current);
      if (event) enqueueReco(event, activeIndex, false);
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        finishHidden();
        return;
      }
      const still = shortsListRef.current[activeIndexRef.current];
      const next = createWatch(still);
      if (next) watchRef.current = next;
    };

    const timer = window.setInterval(tick, 400);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', finishHidden);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', finishHidden);
      const current = watchRef.current;
      if (!current || current.viewId !== watch.viewId) return;
      notePlayback(current, performance.now(), modalVideoRef.current, false);
      const event = closeWatch(current);
      watchRef.current = null;
      if (event) enqueueReco(event, activeIndex, false);
    };
  }, [recoEnabled, modalOpen, activeIndex, activeRecoKey]);

  useEffect(() => {
    if (modalOpen || recoEnabled) return undefined;
    let cancelled = false;
    const batch = takeWatches();
    if (!batch.length) return undefined;
    Promise.all(batch.map((event) => postShortsRecoEvent(event).catch(() => {}))).then(() => {
      if (!cancelled) setFeedRefresh((value) => value + 1);
    });
    return () => {
      cancelled = true;
    };
  }, [modalOpen]);

  useEffect(() => () => {
    flushWatchesRef.current({ refresh: false });
  }, []);

  // Aktiv short modalda — ko‘rish hisobi (bir user = bir marta)
  useEffect(() => {
    if (!modalOpen || !isLoggedIn) return undefined;
    const short = shortsList[activeIndex];
    if (short?.id == null) return undefined;
    const type = short?.type === 'musicshorts' ? 'musicshorts' : 'movieShorts';
    let cancelled = false;
    recordViewRequest({ id: short.id, type }).catch(() => {
      if (cancelled) return;
    });
    return () => {
      cancelled = true;
    };
  }, [modalOpen, activeIndex, shortsList, isLoggedIn]);

  const getVideo = useCallback((item) => item.video?.[contentLang] || item.video?.uz || '', [contentLang]);

  // Desktop: animatsiya bilan o'tish
  const desktopNavigate = useCallback((direction) => {
    if (slideState || shortsList.length < 2) return;

    const count = shortsList.length;
    if (recoEnabled && direction === 'up' && activeIndex <= 0) return;
    if (recoEnabled && direction === 'down') loadMoreReco(activeIndex);
    if (recoEnabled && direction === 'down' && activeIndex >= count - 1) return;
    const toIndex = direction === 'down'
      ? (recoEnabled ? activeIndex + 1 : (activeIndex + 1) % count)
      : (recoEnabled ? activeIndex - 1 : (activeIndex - 1 + count) % count);
    if (toIndex === activeIndex) return;

    const nextVideo = desktopVideoRefs.current.get(toIndex);
    if (nextVideo) {
      modalVideoRef.current = nextVideo;
      nextVideo.muted = modalVideoMuted;
      if (nextVideo.currentTime > 0.5) {
        try { nextVideo.currentTime = 0.04; } catch (err) { /* kadr tayyor bo'lmasa */ }
      }
      nextVideo.play().catch(() => {});
    }

    if (slideTimeoutRef.current) clearTimeout(slideTimeoutRef.current);
    if (slideRafRef.current) cancelAnimationFrame(slideRafRef.current);

    setSlideState({ fromIndex: activeIndex, toIndex, direction, phase: 'prep' });
    slideRafRef.current = requestAnimationFrame(() => {
      slideRafRef.current = requestAnimationFrame(() => {
        setSlideState((current) => (
          current && current.toIndex === toIndex
            ? { ...current, phase: 'animating' }
            : current
        ));
        slideTimeoutRef.current = setTimeout(() => {
          setActiveIndex(toIndex);
          setSlideState(null);
        }, SLIDE_DURATION);
      });
    });
  }, [activeIndex, modalVideoMuted, slideState, shortsList.length, recoEnabled, loadMoreReco]);

  useEffect(() => {
    if (!shortsList.length) return;
    setActiveIndex((i) => Math.min(i, shortsList.length - 1));
  }, [shortsList.length]);

  const goPrev = useCallback(() => desktopNavigate('up'), [desktopNavigate]);
  const goNext = useCallback(() => desktopNavigate('down'), [desktopNavigate]);

  const handleMobileIndexChange = useCallback((newIndex) => {
    if (newIndex < 0 || newIndex >= shortsList.length) return;
    if (recoEnabled) loadMoreReco(newIndex);
    setActiveIndex(newIndex);
  }, [shortsList.length, recoEnabled, loadMoreReco]);

  const handleMobileCommit = useCallback((newIndex) => {
    mobileVideoRefs.current.forEach((video, index) => {
      if (!video) return;
      if (index === newIndex) {
        modalVideoRef.current = video;
        video.muted = modalVideoMuted;
        if (video.currentTime > 0.5) {
          try { video.currentTime = 0.04; } catch (err) { /* kadr tayyor bo'lmasa */ }
        }
        video.play().catch(() => {});
        return;
      }
      video.muted = true;
    });
  }, [modalVideoMuted]);

  const openModal = useCallback((index) => {
    const item = gridListRef.current[index];
    if (item?.id != null) setOpenedFocus(item.id);
    setActiveIndex(0);
    setModalOpen(true);
    setMobilePlayOverlayVisible(false);
    setModalVideoState((s) => ({ ...s, isPlaying: true, currentTime: 0 }));
    if (!onCloseFromHome && !shortsModalHistoryRef.current) {
      window.history.pushState({ shortsModal: true }, '');
      shortsModalHistoryRef.current = true;
    }
  }, [onCloseFromHome]);

  const finishCloseModal = useCallback(() => {
    setModalOpen(false);
    setOpenedFocus(null);
    recoOpenedRef.current = null;
    setSlideState(null);
    setMusicModalOpen(false);
    setModalVideoMuted(false);
  }, []);

  const closeModal = useCallback(() => {
    if (onCloseFromHome) {
      flushWatchesRef.current({ refresh: false });
      onCloseFromHome();
      return;
    }
    if (shortsModalHistoryRef.current) {
      shortsModalHistoryRef.current = false;
      flushWatchesRef.current({ refresh: true });
      window.history.back();
      return;
    }
    flushWatchesRef.current({ refresh: true });
    finishCloseModal();
  }, [onCloseFromHome, finishCloseModal]);

  // Shorts grid dan ochilgan modal: qurilma «ortga» → faqat modal yopilsin
  useEffect(() => {
    if (!modalOpen || onCloseFromHome) return undefined;
    const onPopState = () => {
      shortsModalHistoryRef.current = false;
      flushWatchesRef.current({ refresh: true });
      finishCloseModal();
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [modalOpen, onCloseFromHome, finishCloseModal]);

  // "Tomosha qilish" bosilganda faqat modal yopiladi, onCloseFromHome chaqirilmaydi
  // (chunki Link film sahifasiga o'tadi; onCloseFromHome ortga qaytaradi)
  const handleWatchClick = useCallback(() => {
    if (shortsModalHistoryRef.current) {
      shortsModalHistoryRef.current = false;
      window.history.replaceState(null, '');
    }
    finishCloseModal();
  }, [finishCloseModal]);

  const toggleModalVideoPlay = useCallback(() => {
    const v = modalVideoRef.current;
    if (!v) return;
    if (v.paused) { v.play().catch(() => {}); }
    else { v.pause(); }
  }, []);

  const handleModalVideoPlay = useCallback(() => {
    setModalVideoState((s) => ({ ...s, isPlaying: true }));
  }, []);

  const handleModalVideoPause = useCallback(() => {
    setModalVideoState((s) => ({ ...s, isPlaying: false }));
  }, []);

  const toggleModalVideoMute = useCallback((e) => {
    e.stopPropagation();
    setModalVideoMuted((prev) => !prev);
  }, []);

  const handleModalVideoProgress = useCallback((e) => {
    const v = modalVideoRef.current;
    if (!v) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v.currentTime = percent * v.duration;
  }, []);

  const foregroundIndex = slideState?.toIndex ?? activeIndex;
  const foregroundIndexRef = useRef(activeIndex);
  foregroundIndexRef.current = foregroundIndex;

  useLayoutEffect(() => {
    if (!modalOpen) return;
    const pool = isMobileView ? mobileVideoRefs.current : desktopVideoRefs.current;
    const index = isMobileView ? activeIndex : foregroundIndex;
    const el = pool.get(index);
    if (el) modalVideoRef.current = el;
  }, [modalOpen, isMobileView, activeIndex, foregroundIndex, shortsList.length]);

  useEffect(() => {
    if (!modalOpen || isMobileView) return;
    desktopVideoRefs.current.forEach((video, index) => {
      if (!video) return;
      const isLive = index === activeIndex
        || index === slideState?.fromIndex
        || index === slideState?.toIndex;
      if (isLive) return;
      video.muted = true;
      if (!video.paused) video.pause();
      if (video.readyState >= 2 && (video.currentTime < 0.04 || video.currentTime > 0.5)) {
        try { video.currentTime = 0.04; } catch (err) { /* kadr tayyor bo'lmasa */ }
      }
    });
  }, [modalOpen, isMobileView, activeIndex, slideState, shortsList.length]);

  useEffect(() => {
    if (!modalOpen || !isMobileView) return;
    mobileVideoRefs.current.forEach((video, index) => {
      if (!video || index === activeIndex) return;
      video.muted = true;
      video.pause();
      if (video.readyState >= 2 && video.currentTime > 0.5) {
        try { video.currentTime = 0.04; } catch (err) { /* kadr tayyor bo'lmasa */ }
      }
    });
  }, [modalOpen, isMobileView, activeIndex, shortsList.length]);

  // Video event listeners (desktop ref + fallback)
  useEffect(() => {
    const v = modalVideoRef.current;
    if (!v || !modalOpen) return undefined;
    const onTimeUpdate = () => setModalVideoState((s) => ({ ...s, currentTime: v.currentTime }));
    const onLoadedMetadata = () => setModalVideoState((s) => ({ ...s, duration: v.duration }));
    const onPlay = () => setModalVideoState((s) => ({ ...s, isPlaying: true }));
    const onPause = () => setModalVideoState((s) => ({ ...s, isPlaying: false }));
    const onEnded = () => setModalVideoState((s) => ({ ...s, isPlaying: false, currentTime: 0 }));
    v.addEventListener('timeupdate', onTimeUpdate);
    v.addEventListener('loadedmetadata', onLoadedMetadata);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('ended', onEnded);
    // Ref kechroq ulansa ham holatni sinxronlash
    setModalVideoState((s) => ({
      ...s,
      isPlaying: !v.paused,
      currentTime: v.currentTime,
      duration: v.duration || s.duration,
    }));
    return () => {
      v.removeEventListener('timeupdate', onTimeUpdate);
      v.removeEventListener('loadedmetadata', onLoadedMetadata);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('ended', onEnded);
    };
  }, [modalOpen, foregroundIndex, shortsList.length]);

  useEffect(() => {
    setDescriptionExpanded(false);
    setDesktopHover(false);
    setMusicModalOpen(false);
    setClipControlsVisible(false);
    setClipVideoFullscreen(false);
    setMobilePlayOverlayVisible(false);

    const v = modalVideoRef.current;
    if (!v) return;
    v.muted = modalVideoMuted;
    if (v.paused) {
      v.play()
        .then(() => setModalVideoState((s) => ({ ...s, isPlaying: true })))
        .catch(() => {});
    } else {
      setModalVideoState((s) => ({
        ...s,
        isPlaying: true,
        currentTime: v.currentTime,
        duration: v.duration || s.duration,
      }));
    }
  }, [activeIndex, modalVideoMuted, modalOpen, shortsList.length]);

  useEffect(() => {
    if (!modalOpen) return;
    const v = modalVideoRef.current;
    if (v) v.muted = modalVideoMuted;
  }, [modalVideoMuted, modalOpen, activeIndex]);

  const handleShortsCommentClick = useCallback((e) => {
    e.stopPropagation();
    shortsCommentsRef.current?.openShortsModal?.();
  }, []);

  const handleShortsSaveClick = useCallback((e) => {
    e.stopPropagation();
    const item = shortsList[activeIndex];
    if (item?.id == null) return;
    const alreadySaved = isInWishlist(item.id, shortsWishlistType(item));
    toggleWishlist(item.id, shortsWishlistType(item));
    if (!alreadySaved) sendRecoSignal({ shared: true });
  }, [activeIndex, toggleWishlist, shortsList, isInWishlist, recoEnabled]);

  const getMusicLinkPath = (item) => {
    const ct = item?.contentType;
    const id = item?.musicId;
    if (!id) return '/music';
    if (ct === 'klip' || ct === 'konsert') return `/music/video/${id}`;
    return `/music/${id}`;
  };

  const getMusicWatchButtonContent = (item) => {
    const ct = item?.contentType || 'music';
    const labels = {
      klip: { uz: 'Klip', ru: 'Клип' },
      music: { uz: 'Musiqa', ru: 'Музыка' },
      konsert: { uz: 'Konsert', ru: 'Концерт' },
    };
    return { label: labels[ct]?.[contentLang] || labels.music[contentLang], iconType: ct };
  };

  const renderMusicWatchButtonIcon = (iconType) => {
    if (iconType === 'klip') {
      return (
        <svg className="shorts-modal-watch-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="23 7 16 12 23 17 23 7" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
      );
    }
    if (iconType === 'konsert') {
      return (
        <svg className="shorts-modal-watch-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      );
    }
    return (
      <svg className="shorts-modal-watch-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
      </svg>
    );
  };

  const handleMusicBlockClick = useCallback((e) => {
    e.stopPropagation();
    setMusicModalOpen(true);
  }, []);

  const renderMusicCornerButton = useCallback((item, isMusicSlide, variant = '') => {
    if (isMusicSlide || !item?.musics?.img) return null;
    return (
      <button
        type="button"
        className={`shorts-modal-music-corner${variant ? ` ${variant}` : ''}`}
        onClick={handleMusicBlockClick}
        aria-label="Musiqa"
      >
        <img src={item.musics.img} alt="" className="shorts-modal-music-img" />
      </button>
    );
  }, [handleMusicBlockClick]);

  const closeMusicModal = useCallback(() => setMusicModalOpen(false), []);

  const getMusicTitle = (musics) => {
    const t = musics?.title;
    if (typeof t === 'string') return t;
    return t?.[contentLang] || t?.uz || '';
  };

  const toggleMusicPlayPause = useCallback(() => {
    const a = musicAudioRef.current;
    if (!a) return;
    if (a.paused) { a.play().catch(() => {}); }
    else { a.pause(); }
  }, []);

  const handleMusicProgressClick = useCallback((e) => {
    const a = musicAudioRef.current;
    if (!a || !a.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    a.currentTime = percent * a.duration;
  }, []);

  const toggleClipPlayPause = useCallback(() => {
    const v = musicClipVideoRef.current;
    if (!v) return;
    if (v.paused) { v.play().catch(() => {}); }
    else { v.pause(); }
  }, []);

  const handleClipVideoTap = useCallback(() => {
    if (isMobileView) {
      setClipControlsVisible((v) => !v);
    } else {
      toggleClipPlayPause();
    }
  }, [isMobileView, toggleClipPlayPause]);

  const getClipProgressPercent = useCallback((clientX, barEl) => {
    if (!barEl) return 0;
    const rect = barEl.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  }, []);

  const handleClipProgressSeek = useCallback((clientX, barEl) => {
    const v = musicClipVideoRef.current;
    if (!v || !v.duration || !barEl) return;
    const percent = getClipProgressPercent(clientX, barEl);
    v.currentTime = percent * v.duration;
  }, [getClipProgressPercent]);

  const handleClipProgressClick = useCallback((e) => {
    handleClipProgressSeek(e.clientX, e.currentTarget);
  }, [handleClipProgressSeek]);

  const toggleClipFullscreen = useCallback(() => {
    const wrap = clipVideoWrapRef.current;
    if (!wrap) return;
    if (clipVideoFullscreen) {
      if (document.exitFullscreen) document.exitFullscreen();
      setClipVideoFullscreen(false);
    } else {
      if (wrap.requestFullscreen) wrap.requestFullscreen();
      setClipVideoFullscreen(true);
    }
  }, [clipVideoFullscreen]);

  const handleClipProgressDragStart = useCallback((e) => {
    e.preventDefault();
    const barEl = e.currentTarget;
    const v = musicClipVideoRef.current;
    if (!v || !v.duration) return;
    const onMove = (ev) => {
      const clientX = ev.touches ? ev.touches[0].clientX : ev.clientX;
      handleClipProgressSeek(clientX, barEl);
    };
    const onEnd = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchmove', onMove, { passive: false });
      document.removeEventListener('touchend', onEnd, { capture: true });
    };
    handleClipProgressSeek(e.touches ? e.touches[0].clientX : e.clientX, barEl);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd, { capture: true });
  }, [handleClipProgressSeek]);

  useEffect(() => {
    document.body.style.overflow = modalOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [modalOpen]);

  // Music modal ochilganda video avtomatik pauza
  useEffect(() => {
    const v = modalVideoRef.current;
    if (!v || !modalOpen) return;
    if (musicModalOpen) {
      v.pause();
      setModalVideoState((s) => ({ ...s, isPlaying: false }));
    } else {
      v.play().catch(() => {});
      setModalVideoState((s) => ({ ...s, isPlaying: true }));
    }
  }, [musicModalOpen, modalOpen]);

  // Music modal audio events
  useEffect(() => {
    if (!musicModalOpen || !shortsList[activeIndex]?.musics) return;
    const a = musicAudioRef.current;
    if (!a) return;
    setMusicPlayerState({ isPlaying: true, currentTime: 0, duration: a.duration || 0 });
    const onTimeUpdate = () => setMusicPlayerState((s) => ({ ...s, currentTime: a.currentTime }));
    const onLoadedMetadata = () => setMusicPlayerState((s) => ({ ...s, duration: a.duration }));
    const onPlay = () => setMusicPlayerState((s) => ({ ...s, isPlaying: true }));
    const onPause = () => setMusicPlayerState((s) => ({ ...s, isPlaying: false }));
    const onEnded = () => setMusicPlayerState((s) => ({ ...s, isPlaying: false, currentTime: 0 }));
    a.addEventListener('timeupdate', onTimeUpdate);
    a.addEventListener('loadedmetadata', onLoadedMetadata);
    a.addEventListener('play', onPlay);
    a.addEventListener('pause', onPause);
    a.addEventListener('ended', onEnded);
    return () => {
      a.pause();
      a.removeEventListener('timeupdate', onTimeUpdate);
      a.removeEventListener('loadedmetadata', onLoadedMetadata);
      a.removeEventListener('play', onPlay);
      a.removeEventListener('pause', onPause);
      a.removeEventListener('ended', onEnded);
    };
  }, [musicModalOpen, activeIndex]);

  useEffect(() => {
    if (!musicModalOpen || !shortsList[activeIndex]?.musics?.video) return;
    const v = musicClipVideoRef.current;
    if (!v) return;
    setMusicClipVideoState({ isPlaying: false, currentTime: 0, duration: 0 });
    const onTimeUpdate = () => setMusicClipVideoState((s) => ({ ...s, currentTime: v.currentTime }));
    const onLoadedMetadata = () => setMusicClipVideoState((s) => ({ ...s, duration: v.duration }));
    const onPlay = () => setMusicClipVideoState((s) => ({ ...s, isPlaying: true }));
    const onPause = () => setMusicClipVideoState((s) => ({ ...s, isPlaying: false }));
    const onEnded = () => setMusicClipVideoState((s) => ({ ...s, isPlaying: false, currentTime: 0 }));
    v.addEventListener('timeupdate', onTimeUpdate);
    v.addEventListener('loadedmetadata', onLoadedMetadata);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('ended', onEnded);
    return () => {
      v.pause();
      v.removeEventListener('timeupdate', onTimeUpdate);
      v.removeEventListener('loadedmetadata', onLoadedMetadata);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('ended', onEnded);
    };
  }, [musicModalOpen, activeIndex]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setClipVideoFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const collapseDescription = useCallback(() => setDescriptionExpanded(false), []);

  const toggleDescriptionExpanded = useCallback((e) => {
    e.stopPropagation();
    setDescriptionExpanded((prev) => !prev);
  }, []);

  const handleMobileVideoTap = useCallback(() => {
    const v = modalVideoRef.current;
    if (!v) return;
    collapseDescription();
    if (v.paused) {
      setMobilePlayOverlayVisible(false);
      v.play().catch(() => {});
    } else {
      v.pause();
      setMobilePlayOverlayVisible(true);
    }
  }, [collapseDescription]);

  const getTitle = (item) => getLocalizedField(item?.title, contentLang);
  const getDescription = (item) => item.description?.[contentLang] || item.description?.uz || '';

  const isItemMusicSlide = useCallback((item) => item?.type === 'musicshorts', []);

  const renderMobileShortSlide = useCallback((item, index, { isCenter = false } = {}) => {
    const itemMusic = isItemMusicSlide(item);

    return (
      <div className="shorts-modal-video-inner shorts-modal-mobile-inner">
        <video
          ref={(el) => {
            if (el) {
              mobileVideoRefs.current.set(index, el);
              if (isCenter) modalVideoRef.current = el;
            } else {
              mobileVideoRefs.current.delete(index);
            }
          }}
          src={getVideo(item)}
          autoPlay={isCenter}
          playsInline
          loop
          muted={isCenter ? modalVideoMuted : true}
          preload="auto"
          className="shorts-modal-video shorts-modal-mobile-video-el"
          onLoadedData={(e) => {
            const video = e.currentTarget;
            if (isCenter) {
              if (video.paused) video.play().catch(() => {});
              return;
            }
            video.muted = true;
            video.pause();
            if (video.currentTime < 0.04 || video.currentTime > 0.5) {
              try { video.currentTime = 0.04; } catch (err) { /* kadr tayyor bo'lmasa */ }
            }
          }}
          onPlay={isCenter ? handleModalVideoPlay : undefined}
          onPlaying={isCenter ? handleModalVideoPlay : undefined}
          onPause={isCenter ? handleModalVideoPause : undefined}
          onTouchStart={isCenter ? (e) => {
            mobileVideoTapRef.current = { startY: e.touches[0].clientY, moved: false };
          } : undefined}
          onTouchMove={isCenter ? (e) => {
            if (Math.abs(e.touches[0].clientY - mobileVideoTapRef.current.startY) > 12) {
              mobileVideoTapRef.current.moved = true;
            }
          } : undefined}
          onClick={isCenter ? (e) => {
            e.stopPropagation();
            if (mobileVideoTapRef.current.moved) return;
            handleMobileVideoTap();
          } : undefined}
        />
        {isCenter && mobilePlayOverlayVisible && (
          <button
            type="button"
            className="shorts-modal-play-pause-center shorts-modal-play-pause-mobile"
            onClick={(e) => { e.stopPropagation(); handleMobileVideoTap(); }}
            aria-label="Ijro"
          >
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          </button>
        )}
        {isCenter && (
          <>
        <div className={`shorts-modal-info shorts-modal-info-overlay shorts-modal-info-mobile ${descriptionExpanded ? 'shorts-modal-info-expanded' : ''}`}>
          <div className="shorts-modal-info-content">
            {renderShortsModalTitle(item, contentLang, itemMusic, handleWatchClick)}
            <div className="shorts-modal-caption-music-wrap">
              <div className="shorts-modal-description-row">
                <p
                  className={`shorts-modal-description ${descriptionExpanded ? 'shorts-modal-description-expanded' : ''}`}
                  onClick={toggleDescriptionExpanded}
                >
                  {getDescription(item)}
                </p>
              </div>
            </div>
            <div className="shorts-modal-buttons-row">
              {itemMusic ? (
                <>
                  <Link to={getMusicLinkPath(item)} className="shorts-modal-watch-btn" onClick={handleWatchClick}>
                    {(() => {
                      const { label, iconType } = getMusicWatchButtonContent(item);
                      return (
                        <>
                          {renderMusicWatchButtonIcon(iconType)}
                          <span>{label}</span>
                        </>
                      );
                    })()}
                  </Link>
                  {item?.movieId != null && (
                    <Link to={`/movie/${item.movieId}`} className="shorts-modal-kino-btn" onClick={handleWatchClick}>
                      <svg className="shorts-modal-watch-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="23 7 16 12 23 17 23 7" />
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                      </svg>
                      <span>{contentLang === 'ru' ? 'Фильм' : 'Kino'}</span>
                    </Link>
                  )}
                </>
              ) : (
                <Link to={`/movie/${item?.movieId}`} className="shorts-modal-watch-btn" onClick={handleWatchClick}>
                  {contentLang === 'ru' ? 'Смотреть' : 'Tomosha qilish'}
                </Link>
              )}
            </div>
          </div>
        </div>
        <div className="shorts-modal-actions-sidebar shorts-modal-actions-mobile">
          <LikeButton
            key={item.id}
            variant="shorts"
            contentId={item.id}
            stopPropagation
            onLikeChange={(_id, state) => {
              if (state === 'like') sendRecoSignal({ liked: true });
            }}
          />
          <button
            type="button"
            className="shorts-modal-action-btn shorts-modal-comment-btn"
            onClick={handleShortsCommentClick}
            aria-label="Izohlar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {shortsCommentCount > 0 && <span className="shorts-modal-action-count">{shortsCommentCount}</span>}
          </button>
          <ShortsShare
            shortItem={item}
            shortType={itemMusic ? 'musicshorts' : 'movieShorts'}
            sharePath={`/shorts?shortId=${item?.id}`}
            onShared={() => sendRecoSignal({ shared: true })}
          />
          <Repost
            className="shorts-modal-action-btn"
            item={{
              id: item.id,
              type: itemMusic ? 'musicshorts' : 'movieShorts',
              title: getTitle(item),
              image: '/img/movie1.jpg',
              videoUrl: getVideo(item),
              route: repostShareRoute,
              repostCount: item.repostCount,
            }}
          />
          <ShortsSaveButton
            item={item}
            isInWishlist={isInWishlist}
            onClick={handleShortsSaveClick}
          />
          <ShortsDownloadButton
            videoUrl={getVideo(item)}
            shortsId={item?.id}
            shortType={itemMusic ? 'musicshorts' : 'movieShorts'}
            fileName={`shorts-${item?.id || 'video'}.mp4`}
          />
        </div>
        {renderMusicCornerButton(item, itemMusic, 'shorts-modal-music-corner-mobile')}
          </>
        )}
      </div>
    );
  }, [
    contentLang,
    descriptionExpanded,
    getVideo,
    handleMobileVideoTap,
    handleModalVideoPause,
    handleModalVideoPlay,
    handleMusicBlockClick,
    handleShortsCommentClick,
    handleShortsSaveClick,
    handleWatchClick,
    isInWishlist,
    isItemMusicSlide,
    mobilePlayOverlayVisible,
    renderMusicCornerButton,
    repostShareRoute,
    shortsCommentCount,
    toggleDescriptionExpanded,
    modalVideoMuted,
  ]);

  const handleOverlayClick = (e) => { if (e.target === e.currentTarget) closeModal(); };

  const desktopSlotIndexes = useMemo(() => {
    const count = shortsList.length;
    if (!count) return [];
    const indexes = [activeIndex];
    if (count > 1) {
      const next = (activeIndex + 1) % count;
      const prev = (activeIndex - 1 + count) % count;
      if (!indexes.includes(next)) indexes.push(next);
      if (!indexes.includes(prev)) indexes.push(prev);
    }
    return indexes;
  }, [activeIndex, shortsList.length]);

  const desktopSlotStyle = (index) => {
    const count = shortsList.length;
    const base = {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      height: '100%',
    };
    if (slideState) {
      const { fromIndex, toIndex, direction, phase } = slideState;
      const enterStartY = direction === 'down' ? '100%' : '-100%';
      const exitY = direction === 'down' ? '-100%' : '100%';
      const transition = phase === 'animating'
        ? `transform ${SLIDE_DURATION}ms cubic-bezier(0.4,0,0.2,1)`
        : 'none';
      if (index === toIndex) {
        return {
          ...base,
          transform: phase === 'animating' ? 'translateY(0)' : `translateY(${enterStartY})`,
          transition,
          zIndex: 3,
        };
      }
      if (index === fromIndex) {
        return {
          ...base,
          transform: phase === 'animating' ? `translateY(${exitY})` : 'translateY(0)',
          transition,
          zIndex: 2,
        };
      }
    }
    if (index === activeIndex) {
      return { ...base, transform: 'translateY(0)', zIndex: 2 };
    }
    const next = count > 1 ? (activeIndex + 1) % count : activeIndex;
    const prev = count > 1 ? (activeIndex - 1 + count) % count : activeIndex;
    if (index === prev && index !== next) {
      return { ...base, transform: 'translateY(-100%)', transition: 'none', zIndex: 1 };
    }
    return { ...base, transform: 'translateY(100%)', transition: 'none', zIndex: 1 };
  };

  const modalMuteButton = (
    <button
      type="button"
      className="shorts-modal-mute-btn"
      onClick={toggleModalVideoMute}
      aria-label={modalVideoMuted
        ? (contentLang === 'ru' ? 'Включить звук' : 'Ovozni yoqish')
        : (contentLang === 'ru' ? 'Выключить звук' : 'Ovozni o\'chirish')}
    >
      {modalVideoMuted ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      )}
    </button>
  );

  const modalContent = modalOpen && (
    <div className="shorts-modal-overlay" onClick={handleOverlayClick}>
      <div className="shorts-modal-content" onClick={(e) => e.stopPropagation()}>
        {isMobileView ? (
          // ============ MOBILE ============
          <div className="shorts-modal-video-wrapper shorts-modal-mobile" style={{ position: 'relative', overflow: 'hidden' }}>
            <div className="shorts-modal-top-bar">
              <button className="shorts-modal-close shorts-modal-close-mobile" onClick={closeModal} aria-label="Ortga">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                </svg>
              </button>
              {modalMuteButton}
            </div>
            <VertikalDrag
              className="shorts-modal-vertikal-drag"
              items={shortsList}
              activeIndex={activeIndex}
              onIndexChange={handleMobileIndexChange}
              onCommitIndex={handleMobileCommit}
              renderItem={renderMobileShortSlide}
            />
            {/* Progress drag bilan ketmasin — VertikalDrag tashqarisida */}
            <div
              className="shorts-modal-progress-area shorts-modal-progress-area-mobile-fixed"
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              <div className="shorts-modal-progress-wrap shorts-modal-progress-fixed">
                <div className="shorts-modal-progress-bar" onClick={handleModalVideoProgress}>
                  <div
                    className="shorts-modal-progress-fill"
                    style={{ width: `${(modalVideoState.currentTime / (modalVideoState.duration || 1)) * 100}%` }}
                  />
                </div>
                <span className="shorts-modal-duration">
                  {formatTime(modalVideoState.currentTime)} / {formatTime(modalVideoState.duration)}
                </span>
              </div>
              <input
                type="text"
                className="shorts-modal-comment-input"
                placeholder={contentLang === 'ru' ? 'Написать комментарий...' : 'Izoh yozing...'}
                readOnly
                onClick={(e) => { e.stopPropagation(); handleShortsCommentClick(e); }}
              />
            </div>
          </div>
        ) : (
          // ============ DESKTOP ============
          <div className="shorts-modal-desktop">
            <div className="shorts-modal-top-bar shorts-modal-top-bar-desktop">
              <button className="shorts-modal-close shorts-modal-close-desktop" onClick={closeModal} aria-label="Ortga">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                </svg>
              </button>
              {modalMuteButton}
            </div>
            <div className="shorts-modal-nav-buttons">
              <button className="shorts-modal-nav-btn shorts-modal-nav-up" onClick={goPrev} aria-label="Oldingi">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" /></svg>
              </button>
              <button className="shorts-modal-nav-btn shorts-modal-nav-down" onClick={goNext} aria-label="Keyingi">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" /></svg>
              </button>
            </div>

            {/* overflow:hidden wrapper — oldingi va keyingi video elementi saqlanadi */}
            <div
              className="shorts-modal-video-wrapper shorts-modal-desktop-video"
              style={{ position: 'relative', overflow: 'hidden' }}
            >
              {desktopSlotIndexes.map((index) => {
                const item = shortsList[index];
                if (!item) return null;
                const itemMusic = item?.type === 'musicshorts';
                const isForeground = index === foregroundIndex;
                const showChrome = index === activeIndex || index === slideState?.toIndex;
                return (
              <div
                key={`${index}-${item?.type || 'short'}-${item?.id}`}
                className="shorts-modal-video-inner shorts-modal-desktop-inner"
                style={desktopSlotStyle(index)}
                onMouseEnter={isForeground ? () => setDesktopHover(true) : undefined}
                onMouseLeave={isForeground ? () => setDesktopHover(false) : undefined}
              >
                <video
                  ref={(el) => {
                    if (el) desktopVideoRefs.current.set(index, el);
                    else desktopVideoRefs.current.delete(index);
                  }}
                  src={getVideo(item)}
                  autoPlay={isForeground}
                  playsInline
                  loop
                  muted={isForeground ? modalVideoMuted : true}
                  preload="auto"
                  className="shorts-modal-video shorts-modal-desktop-video-el"
                  onLoadedData={(e) => {
                    const video = e.currentTarget;
                    if (desktopVideoRefs.current.get(foregroundIndexRef.current) === video) {
                      if (video.paused) video.play().catch(() => {});
                      return;
                    }
                    video.muted = true;
                    if (!video.paused) video.pause();
                    if (video.currentTime < 0.04 || video.currentTime > 0.5) {
                      try { video.currentTime = 0.04; } catch (err) { /* kadr tayyor bo'lmasa */ }
                    }
                  }}
                  onPlay={isForeground ? handleModalVideoPlay : undefined}
                  onPlaying={isForeground ? handleModalVideoPlay : undefined}
                  onPause={isForeground ? handleModalVideoPause : undefined}
                  onClick={isForeground ? () => { collapseDescription(); toggleModalVideoPlay(); } : undefined}
                />
                {isForeground && desktopHover && !slideState && (
                  <button
                    className="shorts-modal-play-pause-center"
                    onClick={(e) => { e.stopPropagation(); collapseDescription(); toggleModalVideoPlay(); }}
                    aria-label={modalVideoState.isPlaying ? 'Pauza' : 'Ijro'}
                  >
                    {modalVideoState.isPlaying ? (
                      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                    )}
                  </button>
                )}
                {showChrome && (
                <div className={`shorts-modal-info shorts-modal-info-overlay shorts-modal-info-desktop ${descriptionExpanded ? 'shorts-modal-info-expanded' : ''}`}>
                  <div className="shorts-modal-info-content">
                    {renderShortsModalTitle(item, contentLang, itemMusic, handleWatchClick)}
                    <div className="shorts-modal-caption-music-wrap">
                      <div className="shorts-modal-description-row">
                        <p
                          className={`shorts-modal-description ${descriptionExpanded ? 'shorts-modal-description-expanded' : ''}`}
                          onClick={toggleDescriptionExpanded}
                        >
                          {getDescription(item)}
                        </p>
                      </div>
                    </div>
                    <div className="shorts-modal-buttons-row">
                      {itemMusic ? (
                        <>
                          <Link to={getMusicLinkPath(item)} className="shorts-modal-watch-btn" onClick={handleWatchClick}>
                            {(() => {
                              const { label, iconType } = getMusicWatchButtonContent(item);
                              return (
                                <>
                                  {renderMusicWatchButtonIcon(iconType)}
                                  <span>{label}</span>
                                </>
                              );
                            })()}
                          </Link>
                          {item?.movieId != null && (
                            <Link to={`/movie/${item.movieId}`} className="shorts-modal-kino-btn" onClick={handleWatchClick}>
                              <svg className="shorts-modal-watch-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="23 7 16 12 23 17 23 7" />
                                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                              </svg>
                              <span>{contentLang === 'ru' ? 'Фильм' : 'Kino'}</span>
                            </Link>
                          )}
                        </>
                      ) : (
                        <Link to={`/movie/${item?.movieId}`} className="shorts-modal-watch-btn" onClick={handleWatchClick}>
                          {contentLang === 'ru' ? 'Смотреть' : 'Tomosha qilish'}
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="shorts-modal-progress-area">
                    <div className="shorts-modal-progress-wrap shorts-modal-progress-fixed">
                      <div className="shorts-modal-progress-bar" onClick={handleModalVideoProgress}>
                        <div
                          className="shorts-modal-progress-fill"
                          style={{ width: `${(modalVideoState.currentTime / (modalVideoState.duration || 1)) * 100}%` }}
                        />
                      </div>
                      <span className="shorts-modal-duration">
                        {formatTime(modalVideoState.currentTime)} / {formatTime(modalVideoState.duration)}
                      </span>
                    </div>
                    <input
                      type="text"
                      className="shorts-modal-comment-input"
                      placeholder={contentLang === 'ru' ? 'Написать комментарий...' : 'Izoh yozing...'}
                      readOnly
                      onClick={(e) => { e.stopPropagation(); handleShortsCommentClick(e); }}
                    />
                  </div>
                </div>
                )}
                {showChrome && (
                <div className="shorts-modal-actions-sidebar">
                  <LikeButton
                    key={item?.id}
                    variant="shorts"
                    contentId={item?.id}
                    stopPropagation
                    onLikeChange={(_id, state) => {
                      if (state === 'like') sendRecoSignal({ liked: true });
                    }}
                  />
                  <button
                    type="button"
                    className="shorts-modal-action-btn shorts-modal-comment-btn"
                    onClick={handleShortsCommentClick}
                    aria-label="Izohlar"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    {shortsCommentCount > 0 && <span className="shorts-modal-action-count">{shortsCommentCount}</span>}
                  </button>
                  <ShortsShare
                    shortItem={item}
                    shortType={itemMusic ? 'musicshorts' : 'movieShorts'}
                    sharePath={`/shorts?shortId=${item?.id}`}
                    onShared={() => sendRecoSignal({ shared: true })}
                  />
                  <Repost
                    className="shorts-modal-action-btn"
                    item={{
                      id: item?.id,
                      type: itemMusic ? 'musicshorts' : 'movieShorts',
                      title: getTitle(item),
                      image: '/img/movie1.jpg',
                      videoUrl: getVideo(item),
                      route: repostShareRoute,
                      repostCount: item?.repostCount,
                    }}
                  />
                  <ShortsSaveButton
                    item={item}
                    isInWishlist={isInWishlist}
                    onClick={handleShortsSaveClick}
                  />
                  <ShortsDownloadButton
                    videoUrl={getVideo(item)}
                    shortsId={item?.id}
                    shortType={itemMusic ? 'musicshorts' : 'movieShorts'}
                    fileName={`shorts-${item?.id || 'video'}.mp4`}
                  />
                </div>
                )}
                {showChrome && renderMusicCornerButton(item, itemMusic, 'shorts-modal-music-corner-desktop')}
              </div>
                );
              })}
            </div>
          </div>
        )}
        {modalOpen && shortsList[activeIndex] && (
          <ShortsComments
            ref={shortsCommentsRef}
            shortsId={shortsList[activeIndex].id}
            targetType={
              shortsList[activeIndex]?.type === 'musicshorts' ? 'musicShorts' : 'shorts'
            }
            compact
            onCountChange={setShortsCommentCount}
            onCommentPosted={() => sendRecoSignal({ commented: true })}
          />
        )}
        {!slideMusic && musicModalOpen && shortsList[activeIndex]?.musics && createPortal(
          <div className="shorts-music-modal-overlay" onClick={closeMusicModal}>
            <div className="shorts-music-modal" onClick={(e) => e.stopPropagation()}>
              <button className="shorts-music-modal-close" onClick={closeMusicModal} aria-label="Yopish">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
              </button>
              <div className="shorts-music-modal-content">
                <div className="shorts-music-modal-top-row">
                  <div className="shorts-music-modal-img-wrap">
                    <img src={shortsList[activeIndex].musics.img} alt="" className="shorts-music-modal-img" />
                  </div>
                  <div className="shorts-music-modal-player">
                  <h4 className="shorts-music-modal-title">{getMusicTitle(shortsList[activeIndex].musics)}</h4>
                  <audio
                    ref={musicAudioRef}
                    src={shortsList[activeIndex].musics.music}
                    autoPlay
                    className="shorts-music-modal-audio-hidden"
                  />
                  <div className="shorts-music-modal-controls">
                    <button
                      type="button"
                      className="shorts-music-modal-play-btn"
                      onClick={toggleMusicPlayPause}
                      aria-label={musicPlayerState.isPlaying ? 'Pauza' : 'Ijro'}
                    >
                      {musicPlayerState.isPlaying ? (
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                      )}
                    </button>
                    <div className="shorts-music-modal-progress-wrap">
                      <div
                        className="shorts-music-modal-progress-bar"
                        onClick={handleMusicProgressClick}
                      >
                        <div
                          className="shorts-music-modal-progress-fill"
                          style={{ width: `${(musicPlayerState.currentTime / (musicPlayerState.duration || 1)) * 100}%` }}
                        />
                      </div>
                      <span className="shorts-music-modal-time">
                        {formatTime(musicPlayerState.currentTime)} / {formatTime(musicPlayerState.duration)}
                      </span>
                    </div>
                  </div>
                  <div className="shorts-music-modal-download-row">
                    <a
                      href={shortsList[activeIndex].musics.music}
                      download={(getMusicTitle(shortsList[activeIndex].musics) || 'music') + '.mp3'}
                      className="shorts-music-modal-download-btn"
                      aria-label={contentLang === 'ru' ? 'Скачать музыку' : 'Musiqani yuklab olish'}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      <span className="shorts-music-modal-download-label">{contentLang === 'ru' ? 'МУЗЫКА' : 'MUSIC'}</span>
                    </a>
                    {shortsList[activeIndex].musics?.video && (
                      <a
                        href={encodeURI(shortsList[activeIndex].musics.video)}
                        download={(getMusicTitle(shortsList[activeIndex].musics) || 'clip') + '.mp4'}
                        className="shorts-music-modal-download-btn"
                        aria-label={contentLang === 'ru' ? 'Скачать видео' : 'Videoni yuklab olish'}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        <span className="shorts-music-modal-download-label">{contentLang === 'ru' ? 'ВИДЕО' : 'VIDEO'}</span>
                      </a>
                    )}
                  </div>
                </div>
                </div>
                {shortsList[activeIndex].musics?.video && (
                  <div
                    ref={clipVideoWrapRef}
                    className={`shorts-music-modal-video-wrap ${clipControlsVisible ? 'shorts-music-modal-clip-controls-visible' : ''}`}
                    onClick={handleClipVideoTap}
                    onTouchEnd={isMobileView ? (e) => { e.preventDefault(); handleClipVideoTap(); } : undefined}
                  >
                    <video
                      ref={musicClipVideoRef}
                      src={encodeURI(shortsList[activeIndex].musics.video)}
                      playsInline
                      className="shorts-music-modal-video"
                      preload="metadata"
                    />
                    <button
                      type="button"
                      className="shorts-music-modal-clip-play-btn"
                      onClick={(e) => { e.stopPropagation(); toggleClipPlayPause(); }}
                      onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); toggleClipPlayPause(); }}
                      aria-label={musicClipVideoState.isPlaying ? 'Pauza' : 'Ijro'}
                    >
                      {musicClipVideoState.isPlaying ? (
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                      )}
                    </button>
                    <div className="shorts-music-modal-clip-controls" onTouchEnd={(e) => e.stopPropagation()}>
                      <div className="shorts-music-modal-clip-left">
                        <span className="shorts-music-modal-clip-time">
                          {formatTime(musicClipVideoState.currentTime)} / {formatTime(musicClipVideoState.duration)}
                        </span>
                        <div
                          className="shorts-music-modal-clip-progress-bar"
                          onClick={handleClipProgressClick}
                          onMouseDown={handleClipProgressDragStart}
                          onTouchStart={handleClipProgressDragStart}
                        >
                          <div
                            className="shorts-music-modal-clip-progress-fill"
                            style={{ width: `${(musicClipVideoState.currentTime / (musicClipVideoState.duration || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="shorts-music-modal-clip-right">
                        <button
                          type="button"
                          className={`shorts-music-modal-clip-size-btn ${clipVideoFullscreen ? 'active' : ''}`}
                          onClick={(e) => { e.stopPropagation(); toggleClipFullscreen(); }}
                          aria-label={contentLang === 'ru' ? 'Полный экран' : 'To\'liq ekran'}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                <SearchModalTavsiya onMovieClick={closeMusicModal} />
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );

  return (
    <div className="shorts-videos" aria-busy={showGridSkeleton || undefined}>
      {!onCloseFromHome && (
        <div className="shorts-videos-container">
          <div className="shorts-videos-grid">
            {showGridSkeleton
              ? Array.from({ length: GRID_SKELETON_COUNT }, (_, index) => (
                  <div
                    key={`shorts-grid-skeleton-${index}`}
                    className="shorts-video-card shorts-video-card--skeleton"
                    aria-hidden="true"
                  >
                    <div className="shorts-video-thumb">
                      <SkeletonLoader
                        variant="shorts-thumb"
                        className="shorts-video-thumb-skeleton"
                      />
                    </div>
                  </div>
                ))
              : gridList.map((item, index) => (
              <div key={`${item.type || 'short'}-${item.id}`} className="shorts-video-card">
                <ShortsVideoThumb
                  videoSrc={getVideo(item)}
                  still
                  onClick={() => openModal(index)}
                >
                  {item?.id != null ? (
                    <ViewCount
                      itemId={item.id}
                      type={item?.type === 'musicshorts' ? 'musicshorts' : 'movieShorts'}
                      variant="icon"
                      record={false}
                      className="shorts-video-card-views"
                    />
                  ) : null}
                </ShortsVideoThumb>
              </div>
            ))}
          </div>
        </div>
      )}
      {modalOpen && createPortal(modalContent, document.body)}
    </div>
  );
};

export default ShortsVideos;