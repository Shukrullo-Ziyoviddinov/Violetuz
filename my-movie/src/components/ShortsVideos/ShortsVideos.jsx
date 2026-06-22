import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useWishlist } from '../../context/WishlistContext';
import { shortsVideos } from '../../data/shortsVideos';
import { musicShorts as musicShortsCatalog } from '../../dataMusic/musicShorts';
import { addWatch, getWatchHistory } from '../../api/shortsWatchHistory';
import { getShortsRecommendations } from '../../algo/shortsRecommendationAlgo';
import VertikalDrag from '../VertikalDrag/VertikalDrag';
import ShortsComments from './ShortsComments';
import ShortsShare from './ShortsShare';
import Repost from '../Repost/Repost';
import SearchModalTavsiya from '../SearchModalTavsiya/SearchModalTavsiya';
import LikeButton from '../../Music/LikeButton/LikeButton';
import ShortsMovieHead from './ShortsMovieHead';
import ShortsMusicHead from './ShortsMusicHead';
import { getLocalizedField } from '../../utils/shortsMovieUtils';
import './ShortsVideos.css';

const MOBILE_BREAKPOINT = 768;
const SLIDE_DURATION = 320; // ms

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
  onCloseFromHome = null,
  variant = 'movie',
  repostIds = null,
  repostShortsEntries = null,
}) => {
  const { contentLang } = useContentLanguage();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const baseList = initialShorts || shortsVideos;
  const isMusicShorts = variant === 'music';
  const [shortsList, setShortsList] = useState(() => {
    if (repostShortsEntries?.length) {
      return buildRepostShortsList(repostShortsEntries, shortsVideos, musicShortsCatalog);
    }
    return orderShortsByRepostIds(baseList, repostIds);
  });
  const [isMobileView, setIsMobileView] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(startIndex ?? 0);
  const hasLoadedMore = useRef(false);

  useEffect(() => {
    if (repostShortsEntries?.length) {
      setShortsList(buildRepostShortsList(repostShortsEntries, shortsVideos, musicShortsCatalog));
      hasLoadedMore.current = true;
    } else {
      setShortsList(orderShortsByRepostIds(baseList, repostIds));
      if (repostIds?.length) hasLoadedMore.current = true;
      else hasLoadedMore.current = false;
    }
  }, [baseList, repostIds, repostShortsEntries]);

  const slideMusic = useMemo(() => {
    if (repostShortsEntries?.length) {
      return shortsList[activeIndex]?.type === 'musicshorts';
    }
    return isMusicShorts;
  }, [repostShortsEntries, shortsList, activeIndex, isMusicShorts]);

  const repostShareRoute = useMemo(() => {
    const p = new URLSearchParams();
    if (repostShortsEntries?.length) {
      p.set('repostShorts', repostShortsEntries.map((e) => `${e.type}:${e.id}`).join(','));
    } else if (repostIds?.length) {
      p.set('repostIds', repostIds.map(String).join(','));
    }
    p.set('startIndex', String(activeIndex));
    const q = p.toString();
    const useMusicPath = repostShortsEntries?.length
      ? shortsList[activeIndex]?.type === 'musicshorts'
      : isMusicShorts;
    return useMusicPath ? `/music/shorts?${q}` : `/shorts?${q}`;
  }, [repostShortsEntries, repostIds, activeIndex, isMusicShorts, shortsList]);

  // Desktop slide animation
  // slideState: null | { fromIndex, toIndex, direction: 'up'|'down', phase: 'animating'|'done' }
  const [slideState, setSlideState] = useState(null);
  const slideTimeoutRef = useRef(null);

  const modalVideoRef = useRef(null);
  const mobileVideoTapRef = useRef({ startY: 0, moved: false });
  const shortsCommentsRef = useRef(null);
  const [modalVideoState, setModalVideoState] = useState({ isPlaying: true, currentTime: 0, duration: 0 });
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [mobilePlayPauseVisible, setMobilePlayPauseVisible] = useState(false);
  const [modalVideoMuted, setModalVideoMuted] = useState(false);
  const [desktopHover, setDesktopHover] = useState(false);
  const [shortsCommentCount, setShortsCommentCount] = useState(0);
  const [loadedPreviews, setLoadedPreviews] = useState({});
  const [musicModalOpen, setMusicModalOpen] = useState(false);
  const musicAudioRef = useRef(null);
  const musicClipVideoRef = useRef(null);
  const clipVideoWrapRef = useRef(null);
  const [musicPlayerState, setMusicPlayerState] = useState({ isPlaying: false, currentTime: 0, duration: 0 });
  const [musicClipVideoState, setMusicClipVideoState] = useState({ isPlaying: false, currentTime: 0, duration: 0 });
  const [clipControlsVisible, setClipControlsVisible] = useState(false);
  const [clipVideoFullscreen, setClipVideoFullscreen] = useState(false);
  const gridRef = useRef(null);

  // Grid: ko‘rinishga kelgan video avtomatik ijro
  useEffect(() => {
    if (!gridRef.current) return;
    const cards = gridRef.current.querySelectorAll('.shorts-video-card');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const v = entry.target.querySelector('video');
          if (!v) return;
          if (entry.isIntersecting) v.play().catch(() => {});
          else {
            v.pause();
            v.currentTime = 0;
          }
        });
      },
      { rootMargin: '80px', threshold: 0.2 }
    );
    cards.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [shortsList]);

  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth <= MOBILE_BREAKPOINT);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    return () => { if (slideTimeoutRef.current) clearTimeout(slideTimeoutRef.current); };
  }, []);

  // Open modal at startIndex when provided (e.g. from /shorts?startIndex=2)
  useEffect(() => {
    if (startIndex != null && startIndex >= 0 && shortsList.length > 0) {
      const safe = Math.min(startIndex, shortsList.length - 1);
      setActiveIndex(safe);
      setModalOpen(true);
    }
  }, [startIndex, shortsList.length]);

  // Load more recommendations when user scrolls past 12th video (movie shorts only)
  useEffect(() => {
    if (repostShortsEntries?.length || repostIds?.length || isMusicShorts || !modalOpen || activeIndex < 11 || hasLoadedMore.current) return;
    hasLoadedMore.current = true;
    const history = getWatchHistory();
    const recs = getShortsRecommendations(shortsVideos, history, 10);
    const existingIds = new Set(shortsList.map((s) => s.id));
    const toAdd = recs.filter((s) => !existingIds.has(s.id));
    if (toAdd.length > 0) setShortsList((prev) => [...prev, ...toAdd]);
  }, [modalOpen, activeIndex, shortsList, isMusicShorts, repostIds, repostShortsEntries]);

  // Track watch: addWatch after 2 sec viewing
  useEffect(() => {
    if (!modalOpen) return;
    const short = shortsList[activeIndex];
    if (!short) return;
    const t = setTimeout(() => addWatch(short), 2000);
    return () => clearTimeout(t);
  }, [modalOpen, activeIndex, shortsList]);

  const getVideo = useCallback((item) => item.video?.[contentLang] || item.video?.uz || '', [contentLang]);

  // Desktop: animatsiya bilan o'tish
  const desktopNavigate = useCallback((direction) => {
    if (slideState || !shortsList.length) return; // animatsiya ketayotsa blok

    const toIndex = direction === 'down'
      ? (activeIndex < shortsList.length - 1 ? activeIndex + 1 : 0)
      : (activeIndex > 0 ? activeIndex - 1 : shortsList.length - 1);

    setSlideState({ fromIndex: activeIndex, toIndex, direction, phase: 'animating' });

    slideTimeoutRef.current = setTimeout(() => {
      setActiveIndex(toIndex);
      setSlideState(null);
    }, SLIDE_DURATION);
  }, [activeIndex, slideState, shortsList]);

  useEffect(() => {
    if (!shortsList.length) return;
    setActiveIndex((i) => Math.min(i, shortsList.length - 1));
  }, [shortsList.length]);

  const goPrev = useCallback(() => desktopNavigate('up'), [desktopNavigate]);
  const goNext = useCallback(() => desktopNavigate('down'), [desktopNavigate]);

  const handleMobileIndexChange = useCallback((newIndex) => {
    if (newIndex < 0 || newIndex >= shortsList.length) return;
    setActiveIndex(newIndex);
  }, [shortsList.length]);

  const openModal = useCallback((index) => {
    setActiveIndex(index);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    if (onCloseFromHome) {
      onCloseFromHome();
    }
    setModalOpen(false);
    setSlideState(null);
    setMusicModalOpen(false);
    setModalVideoMuted(false);
  }, [onCloseFromHome]);

  // "Tomosha qilish" bosilganda faqat modal yopiladi, onCloseFromHome chaqirilmaydi
  // (chunki Link film sahifasiga o'tadi; onCloseFromHome ortga qaytaradi)
  const handleWatchClick = useCallback(() => {
    setModalOpen(false);
    setSlideState(null);
    setMusicModalOpen(false);
  }, []);

  const toggleModalVideoPlay = useCallback(() => {
    const v = modalVideoRef.current;
    if (!v) return;
    if (v.paused) { v.play().catch(() => {}); }
    else { v.pause(); }
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

  // Video event listeners
  useEffect(() => {
    const v = modalVideoRef.current;
    if (!v || !modalOpen) return;
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
    return () => {
      v.removeEventListener('timeupdate', onTimeUpdate);
      v.removeEventListener('loadedmetadata', onLoadedMetadata);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('ended', onEnded);
    };
  }, [modalOpen, activeIndex]);

  useEffect(() => {
    setDescriptionExpanded(false);
    setMobilePlayPauseVisible(false);
    setDesktopHover(false);
    setMusicModalOpen(false);
    setClipControlsVisible(false);
    setClipVideoFullscreen(false);

    const v = modalVideoRef.current;
    if (v) {
      v.muted = modalVideoMuted;
      if (v.paused) v.play().catch(() => {});
      setModalVideoState((s) => ({
        ...s,
        isPlaying: !v.paused,
        currentTime: v.currentTime,
        duration: v.duration || s.duration,
      }));
    }
  }, [activeIndex, modalVideoMuted]);

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
    if (slideMusic && item?.musicId) {
      const wishlistType = item?.contentType || 'music';
      toggleWishlist(item.musicId, wishlistType);
    } else if (item?.movieId) {
      toggleWishlist(item.movieId, 'movie');
    }
  }, [activeIndex, toggleWishlist, slideMusic, shortsList]);

  const getMusicLinkPath = (item) => {
    const ct = item?.contentType;
    const id = item?.musicId;
    if (!id) return '/music';
    if (ct === 'klip' || ct === 'konsert') return `/music/video/${id}`;
    return `/music/${id}`;
  };

  const getMusicWishlistType = (item) => item?.contentType || 'music';

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

  const renderMusicSidebarButton = useCallback((item, isMusicSlide) => {
    if (isMusicSlide || !item?.musics?.img) return null;
    return (
      <button
        type="button"
        className="shorts-modal-action-btn shorts-modal-music-block"
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
    if (mobilePlayPauseVisible) {
      setMobilePlayPauseVisible(false);
      v.play().catch(() => {});
    } else {
      setMobilePlayPauseVisible(true);
      v.pause();
    }
  }, [mobilePlayPauseVisible, collapseDescription]);

  const getTitle = (item) => getLocalizedField(item?.title, contentLang);
  const getDescription = (item) => item.description?.[contentLang] || item.description?.uz || '';

  const isItemMusicSlide = useCallback((item) => (
    repostShortsEntries?.length ? item?.type === 'musicshorts' : isMusicShorts
  ), [repostShortsEntries, isMusicShorts]);

  const renderMobileShortSlide = useCallback((item, index, { isCenter = false } = {}) => {
    const itemMusic = isItemMusicSlide(item);

    return (
      <div className="shorts-modal-video-inner shorts-modal-mobile-inner">
        <video
          ref={(el) => {
            if (isCenter) {
              modalVideoRef.current = el;
            }
          }}
          src={getVideo(item)}
          autoPlay
          playsInline
          loop
          muted={isCenter ? modalVideoMuted : true}
          preload="auto"
          className="shorts-modal-video shorts-modal-mobile-video-el"
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
        {isCenter && mobilePlayPauseVisible && (
          <button
            className="shorts-modal-play-pause-center shorts-modal-play-pause-mobile"
            onClick={(e) => { e.stopPropagation(); toggleModalVideoPlay(); }}
            aria-label={modalVideoState.isPlaying ? 'Pauza' : 'Ijro'}
          >
            {modalVideoState.isPlaying ? (
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            )}
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
        <div className="shorts-modal-actions-sidebar shorts-modal-actions-mobile">
          <LikeButton
            key={item.id}
            variant="shorts"
            contentId={item.id}
            stopPropagation
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
          <ShortsShare shortItem={item} />
          <Repost
            className="shorts-modal-action-btn"
            item={{
              id: item.id,
              type: itemMusic ? 'musicshorts' : 'movieShorts',
              title: getTitle(item),
              image: '/img/movie1.jpg',
              videoUrl: getVideo(item),
              route: repostShareRoute,
            }}
          />
          <button
            type="button"
            className={`shorts-modal-action-btn shorts-modal-save-btn ${itemMusic ? (isInWishlist(item?.musicId, getMusicWishlistType(item)) ? 'active' : '') : (isInWishlist(item?.movieId, 'movie') ? 'active' : '')}`}
            onClick={handleShortsSaveClick}
            aria-label="Saqlash"
          >
            <svg viewBox="0 0 24 24" fill={itemMusic ? (isInWishlist(item?.musicId, getMusicWishlistType(item)) ? 'currentColor' : 'none') : (isInWishlist(item?.movieId, 'movie') ? 'currentColor' : 'none')} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
          {renderMusicSidebarButton(item, itemMusic)}
        </div>
          </>
        )}
      </div>
    );
  }, [
    contentLang,
    descriptionExpanded,
    getVideo,
    handleMobileVideoTap,
    handleModalVideoProgress,
    handleMusicBlockClick,
    handleShortsCommentClick,
    handleShortsSaveClick,
    handleWatchClick,
    isInWishlist,
    isItemMusicSlide,
    mobilePlayPauseVisible,
    modalVideoState,
    renderMusicSidebarButton,
    repostShareRoute,
    shortsCommentCount,
    toggleDescriptionExpanded,
    toggleModalVideoPlay,
    modalVideoMuted,
  ]);

  const handleOverlayClick = (e) => { if (e.target === e.currentTarget) closeModal(); };

  // Desktop slide animation styles
  // "from" video chiqib ketadi, "to" video kirib keladi
  const getSlideStyles = () => {
    if (!slideState) return { current: {}, incoming: null };
    const { direction } = slideState;
    // direction 'down' = keyingi (next): current chiqib up, incoming pastdan kiradi
    // direction 'up' = oldingi (prev): current chiqib down, incoming yuqoridan kiradi
    const exitY = direction === 'down' ? '-100%' : '100%';
    const enterStartY = direction === 'down' ? '100%' : '-100%';
    return {
      current: {
        transform: `translateY(${exitY})`,
        transition: `transform ${SLIDE_DURATION}ms cubic-bezier(0.4,0,0.2,1)`,
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
      },
      incoming: {
        transform: 'translateY(0)',
        transition: `transform ${SLIDE_DURATION}ms cubic-bezier(0.4,0,0.2,1)`,
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        // Starts from enterStartY, animates to 0
        // We use animation trick: set initial then next frame 0
        animFrom: enterStartY,
      },
    };
  };

  const slideStyles = getSlideStyles();

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
              renderItem={renderMobileShortSlide}
            />
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

            {/* overflow:hidden wrapper — animatsiya uchun zarur */}
            <div
              className="shorts-modal-video-wrapper shorts-modal-desktop-video"
              style={{ position: 'relative', overflow: 'hidden' }}
            >
              {/* Joriy video — chiqib ketadi */}
              <div
                className="shorts-modal-video-inner shorts-modal-desktop-inner"
                style={slideState ? slideStyles.current : {}}
                onMouseEnter={() => setDesktopHover(true)}
                onMouseLeave={() => setDesktopHover(false)}
              >
                <video
                  ref={modalVideoRef}
                  key={activeIndex}
                  src={getVideo(shortsList[activeIndex])}
                  autoPlay
                  playsInline
                  loop
                  muted={modalVideoMuted}
                  className="shorts-modal-video shorts-modal-desktop-video-el"
                  onClick={() => { collapseDescription(); toggleModalVideoPlay(); }}
                />
                {desktopHover && !slideState && (
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
                <div className={`shorts-modal-info shorts-modal-info-overlay shorts-modal-info-desktop ${descriptionExpanded ? 'shorts-modal-info-expanded' : ''}`}>
                  <div className="shorts-modal-info-content">
                    {renderShortsModalTitle(shortsList[activeIndex], contentLang, slideMusic, handleWatchClick)}
                    <div className="shorts-modal-caption-music-wrap">
                      <div className="shorts-modal-description-row">
                        <p
                          className={`shorts-modal-description ${descriptionExpanded ? 'shorts-modal-description-expanded' : ''}`}
                          onClick={toggleDescriptionExpanded}
                        >
                          {getDescription(shortsList[activeIndex])}
                        </p>
                      </div>
                    </div>
                    <div className="shorts-modal-buttons-row">
                      {slideMusic ? (
                        <>
                          <Link to={getMusicLinkPath(shortsList[activeIndex])} className="shorts-modal-watch-btn" onClick={handleWatchClick}>
                            {(() => {
                              const { label, iconType } = getMusicWatchButtonContent(shortsList[activeIndex]);
                              return (
                                <>
                                  {renderMusicWatchButtonIcon(iconType)}
                                  <span>{label}</span>
                                </>
                              );
                            })()}
                          </Link>
                          {shortsList[activeIndex]?.movieId != null && (
                            <Link to={`/movie/${shortsList[activeIndex].movieId}`} className="shorts-modal-kino-btn" onClick={handleWatchClick}>
                              <svg className="shorts-modal-watch-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="23 7 16 12 23 17 23 7" />
                                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                              </svg>
                              <span>{contentLang === 'ru' ? 'Фильм' : 'Kino'}</span>
                            </Link>
                          )}
                        </>
                      ) : (
                        <Link to={`/movie/${shortsList[activeIndex]?.movieId}`} className="shorts-modal-watch-btn" onClick={handleWatchClick}>
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
                <div className="shorts-modal-actions-sidebar">
                  <LikeButton
                    key={shortsList[activeIndex]?.id}
                    variant="shorts"
                    contentId={shortsList[activeIndex]?.id}
                    stopPropagation
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
                  <ShortsShare shortItem={shortsList[activeIndex]} />
                  <Repost
                    className="shorts-modal-action-btn"
                    item={{
                      id: shortsList[activeIndex]?.id,
                      type: slideMusic ? 'musicshorts' : 'movieShorts',
                      title: getTitle(shortsList[activeIndex]),
                      image: '/img/movie1.jpg',
                      videoUrl: getVideo(shortsList[activeIndex]),
                      route: repostShareRoute,
                    }}
                  />
                  <button
                    type="button"
                    className={`shorts-modal-action-btn shorts-modal-save-btn ${slideMusic ? (isInWishlist(shortsList[activeIndex]?.musicId, getMusicWishlistType(shortsList[activeIndex])) ? 'active' : '') : (isInWishlist(shortsList[activeIndex]?.movieId, 'movie') ? 'active' : '')}`}
                    onClick={handleShortsSaveClick}
                    aria-label="Saqlash"
                  >
                    <svg viewBox="0 0 24 24" fill={slideMusic ? (isInWishlist(shortsList[activeIndex]?.musicId, getMusicWishlistType(shortsList[activeIndex])) ? 'currentColor' : 'none') : (isInWishlist(shortsList[activeIndex]?.movieId, 'movie') ? 'currentColor' : 'none')} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                  </button>
                  {renderMusicSidebarButton(shortsList[activeIndex], slideMusic)}
                </div>
              </div>

              {/* Kelayotgan video — kirib keladi (faqat animatsiya paytida) */}
              {slideState && (
                <IncomingSlide
                  item={shortsList[slideState.toIndex]}
                  contentLang={contentLang}
                  direction={slideState.direction}
                  duration={SLIDE_DURATION}
                  onWatchClick={handleWatchClick}
                />
              )}
            </div>
          </div>
        )}
        {modalOpen && shortsList[activeIndex] && (
          <ShortsComments
            ref={shortsCommentsRef}
            shortsId={shortsList[activeIndex].id}
            compact
            onCountChange={setShortsCommentCount}
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
    <div className="shorts-videos">
      <div className="shorts-videos-container">
        <div className="shorts-videos-grid" ref={gridRef}>
          {shortsList.map((item, index) => (
            <div key={item.id} className="shorts-video-card">
              <div
                className="shorts-video-thumb"
                onClick={() => openModal(index)}
              >
                {!loadedPreviews[item.id] && (
                  <div className="shorts-video-preview-placeholder" aria-hidden="true" />
                )}
                <video
                  src={getVideo(item)}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className={`shorts-video-preview ${!loadedPreviews[item.id] ? 'shorts-video-loading' : ''}`}
                  onLoadedData={() => setLoadedPreviews((p) => ({ ...p, [item.id]: true }))}
                  onCanPlay={() => setLoadedPreviews((p) => (p[item.id] ? p : { ...p, [item.id]: true }))}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      {modalOpen && createPortal(modalContent, document.body)}
    </div>
  );
};

// Desktop: kelayotgan video componenti — mount bo'lgandan keyin animate qiladi
const IncomingSlide = (props) => {
  const { item, contentLang, direction, duration, onWatchClick } = props;
  const [style, setStyle] = useState({
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    transform: direction === 'down' ? 'translateY(100%)' : 'translateY(-100%)',
    transition: 'none',
  });

  useEffect(() => {
    // Keyingi frame da animate qilamiz
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setStyle((s) => ({
          ...s,
          transform: 'translateY(0)',
          transition: `transform ${duration}ms cubic-bezier(0.4,0,0.2,1)`,
        }));
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [duration]);

  const getVideo = (it) => it.video?.[contentLang] || it.video?.uz || '';

  return (
    <div className="shorts-modal-video-inner shorts-modal-desktop-inner" style={style}>
      <video
        src={getVideo(item)}
        autoPlay
        playsInline
        loop
        muted
        className="shorts-modal-video shorts-modal-desktop-video-el"
      />
      <div className="shorts-modal-info shorts-modal-info-overlay shorts-modal-info-desktop">
        <div className="shorts-modal-info-content">
          {renderShortsModalTitle(item, contentLang, false, onWatchClick)}
        </div>
      </div>
    </div>
  );
};

export default ShortsVideos;