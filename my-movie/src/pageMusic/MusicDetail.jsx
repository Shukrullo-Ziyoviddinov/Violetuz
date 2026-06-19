import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useWishlist } from '../context/WishlistContext';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { allMusicData } from '../dataMusic/allMusicData';
import { ensureArray, matchId } from '../dataMusic/musicDataUtils';
import { MUSIC_SECTIONS } from '../dataMusic/musicSectionsConfig';
import { artists } from '../dataMusic/artists';
import AudioDuration from '../Music/AudioDuration/AudioDuration';
import ShareButton from '../components/ShareButton/ShareButton';
import Repost from '../components/Repost/Repost';
import FollowingButton from '../Music/FollowingButton/FollowingButton';
import SimilarSongs from '../Music/SimilarSongs/SimilarSongs';
import AlbumsForYou from '../Music/AlbumsForYou/AlbumsForYou';
import RecommendedClips from '../Music/RecommendedClips/RecommendedClips';
import { AudioVisualizerCanvas, CardVisual } from '../Music/Visual';
import { useDominantColor } from '../hooks/useDominantColor';
import { formatCount } from '../utils/utils';
import './MusicDetail.css';

const musicTrackSections = (MUSIC_SECTIONS || []).filter((s) => s.wishlistType === 'music');
const sectionById = Object.fromEntries(musicTrackSections.map((s) => [s.id, s]));

/** fromSection bo'lmaganda (masalan Music Shorts dan) – musiqani qaysi bo'limda topish */
const findSectionForMusicId = (musicId) => {
  if (musicId == null) return null;
  return musicTrackSections.find((s) =>
    ensureArray(s.data).some((item) => matchId(item.id, musicId))
  ) || null;
};

const MusicDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [searchParams] = useSearchParams();
  const fromSection = searchParams.get('section') || location.state?.fromSection;
  const music = ensureArray(allMusicData).find((m) => matchId(m.id, id));
  const sectionConfig = fromSection ? sectionById[fromSection] : (music ? findSectionForMusicId(music.id) : null);
  const resolvedSection = fromSection || sectionConfig?.id;
  const {
    currentMusic,
    artist,
    dominantColor,
    getTitle,
    getLyricsText,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isRepeat,
    isShuffle,
    bass,
    setBass,
    treble,
    setTreble,
    loadTrack,
    loadAndPlayTrack,
    setPlaylistFromPage,
    togglePlay,
    handleProgressClick,
    handleVolumeChange,
    handleVolumeIconClick,
    handlePrevTrack,
    handleNextTrack,
    toggleRepeat,
    toggleShuffle,
    analyserRef,
    audioGraphReady,
    setPlayerModalOpen,
  } = useMusicPlayer();

  const imgRef = useRef(null);
  const [lyricsModalOpen, setLyricsModalOpen] = useState(() => location.state?.openLyrics ?? false);
  const [lyricsDragOffset, setLyricsDragOffset] = useState(0);
  const [lyricsDragging, setLyricsDragging] = useState(false);
  const lyricsDragStartRef = useRef(null);
  const lyricsDragOffsetRef = useRef(0);
  lyricsDragOffsetRef.current = lyricsDragOffset;

  /** Sahifada ko'rsatilgan trekning rasmidan rang – prev/next bilan navigatsiya qilganda ham to'g'ri ishlaydi */
  const pageDominantColor = useDominantColor(typeof music?.img === 'string' ? music.img : null);

  // On mount: load track and handle initial state (autoplay, keepModalOpen, syncFromPlayer)
  useEffect(() => {
    if (!music?.id) return;

    const syncFromPlayer = !!location.state?.syncFromPlayer;
    if (syncFromPlayer) {
      /* Prev/next orqali keldik – trek allaqachon yuklangan, faqat modal va state */
    } else {
      const autoplay = !!location.state?.autoplay;
      if (autoplay) {
        loadAndPlayTrack(music.id, { autoplay: true });
      } else {
        loadTrack(music.id);
      }
    }

    if (location.state?.keepModalOpen) {
      setPlayerModalOpen(true);
    }

    /* autoplay/keepModalOpen: replace bilan tozalash. syncFromPlayer: replace QILMAYMIZ – extra navigate oldinga bosganda player yo'qolishiga olib keladi */
    if (location.state?.autoplay || location.state?.keepModalOpen) {
      const preserved = {
        ...(location.state?.fromSection ? { fromSection: location.state.fromSection } : {}),
        ...(location.state?.syncFromPlayer ? { syncFromPlayer: true } : {}),
      };
      const fullPath = `${location.pathname}${location.search || ''}`;
      navigate(fullPath, { replace: true, state: preserved });
    }
  }, [id, music?.id]);

  // Bo'lim playlistini player contextga o'tkazish – prev/next shu ro'yxat bo'yicha ishlaydi
  useEffect(() => {
    if (sectionConfig && Array.isArray(sectionConfig.data) && sectionConfig.data.length) {
      setPlaylistFromPage(ensureArray(sectionConfig.data));
    } else {
      setPlaylistFromPage(null);
    }
    return () => setPlaylistFromPage(null);
  }, [fromSection, setPlaylistFromPage, sectionConfig]);

  // Lyrics tugmasi - sahifa o'zgaganda yoki openLyrics state kelganda
  useEffect(() => {
    if (location.state?.openLyrics && music?.id) {
      setLyricsModalOpen(true);
      navigate(`${location.pathname}${location.search || ''}`, { replace: true, state: {} });
    }
  }, [location.state?.openLyrics, location.pathname, location.search, music?.id, navigate]);

  useEffect(() => {
    if (!lyricsModalOpen) return;
    const onMove = (e) => {
      const start = lyricsDragStartRef.current;
      if (start && e.cancelable) e.preventDefault();
      const clientY = e.touches ? e.touches[0]?.clientY : e.clientY;
      if (!start || clientY == null) return;
      const dy = clientY - start.y;
      const newOffset = Math.max(0, start.startOffset + dy);
      setLyricsDragOffset(newOffset);
    };
    const onUp = () => {
      lyricsDragStartRef.current = null;
      setLyricsDragging(false);
      const offset = lyricsDragOffsetRef.current;
      if (offset > 100) {
        setLyricsModalOpen(false);
        setLyricsDragOffset(0);
      } else {
        setLyricsDragOffset(0);
      }
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onUp);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    };
  }, [lyricsModalOpen]);

  useEffect(() => {
    if (lyricsModalOpen) {
      setLyricsDragOffset(0);
      setLyricsDragging(false);
    }
  }, [lyricsModalOpen]);

  const formatTime = (sec) => {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleDownload = () => {
    if (!music?.audio) return;
    const link = document.createElement('a');
    link.href = music.audio;
    link.download = `${getTitle(music)}.mp3`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!music) {
    return (
      <div className="music-detail">
        <div className="music-detail-error">Musiqa topilmadi</div>
      </div>
    );
  }

  /* Player UI: sahifadagi trek = context dagi trek. syncFromPlayer = prev/next orqali keldik, timing uchun fallback */
  const isCurrentTrack =
    matchId(currentMusic?.id, music?.id) ||
    (!!location.state?.syncFromPlayer && music?.id != null);

  // Bo'lim bo'yicha ro'yxat va title (Trend, Musiqani kashf eting, va hokazo)
  const trendList =
    sectionConfig && Array.isArray(sectionConfig.data) ? ensureArray(sectionConfig.data) : ensureArray(allMusicData);
  const sectionTitle = sectionConfig ? t(sectionConfig.titleKey, sectionConfig.titleDefault) : t('music.trendMusic', 'Trend Musiqa');

  return (
    <div className="music-detail">
      <div className="music-detail-container">
        <div className="music-detail-layout">
          <div className="music-detail-left-scroll">
            <div
              className="music-detail-top"
              style={
                (() => {
                  const color = isCurrentTrack ? (pageDominantColor || dominantColor) : null;
                  return color && typeof color.r === 'number'
                    ? {
                        background: `linear-gradient(180deg, rgba(${color.r}, ${color.g}, ${color.b}, 0.65) 0%, rgba(${color.r}, ${color.g}, ${color.b}, 0.45) 40%, rgba(${color.r}, ${color.g}, ${color.b}, 0.28) 70%, rgba(${color.r}, ${color.g}, ${color.b}, 0.12) 100%)`,
                        borderRadius: '16px',
                        padding: '1rem',
                        border: `1px solid rgba(${color.r}, ${color.g}, ${color.b}, 0.55)`,
                      }
                    : undefined;
                })()
              }
            >
              <div className="music-detail-top-row">
                <div className="music-detail-left">
                  <img
                    ref={imgRef}
                    src={music.img || '/img/movie1.jpg'}
                    alt={getTitle(music)}
                    className="music-detail-image"
                  />
                </div>
                <div className="music-detail-right">
                  <h1 className="music-detail-title">{getTitle(music)}</h1>
                  {artist && (
                    <div
                      className="music-detail-artist-block"
                      onClick={() => navigate(`/music/artist/${artist.id}`)}
                    >
                      <img
                        src={artist.imgArtist || artist.img || '/img/movie1.jpg'}
                        alt={artist.name}
                        className="music-detail-artist-img"
                      />
                      <div className="music-detail-artist-info">
                        <span className="music-detail-artist-name">{artist.name}</span>
                        {music.year && (
                          <span className="music-detail-artist-year">{music.year}</span>
                        )}
                        {isCurrentTrack && duration > 0 && (
                          <span className="music-detail-artist-duration">{formatTime(duration)}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {isCurrentTrack && (
                <div className="music-detail-audio-player">
                  <button
                    className="music-detail-play-btn"
                    onClick={togglePlay}
                    aria-label={isPlaying ? 'Pauza' : 'Ijro etish'}
                  >
                    {isPlaying ? (
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="4" width="4" height="16" />
                        <rect x="14" y="4" width="4" height="16" />
                      </svg>
                    ) : (
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21" />
                      </svg>
                    )}
                  </button>
                  <button
                    className="music-detail-action-btn music-detail-download-btn"
                    onClick={handleDownload}
                    aria-label="Yuklab olish"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </button>
                  <button
                    className={`music-detail-action-btn music-detail-save-btn ${isInWishlist(music.id, 'music') ? 'active' : ''}`}
                    onClick={() => toggleWishlist(music.id, 'music')}
                    aria-label="Sevimlilarga saqlash"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill={isInWishlist(music.id, 'music') ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                  <div className="music-detail-share-wrap">
                    <ShareButton movie={music} dropdownInPortal />
                  </div>
                  <Repost
                    className="music-detail-action-btn"
                    item={{
                      id: music.id,
                      type: 'music',
                      title: getTitle(music),
                      image: music.img || '/img/movie1.jpg',
                      route: `/music/${music.id}${resolvedSection ? `?section=${encodeURIComponent(resolvedSection)}` : ''}`,
                    }}
                  />
                  <AudioVisualizerCanvas analyserRef={analyserRef} isPlaying={isPlaying} audioGraphReady={audioGraphReady} />
                </div>
              )}
            </div>
            {music?.lyricsText && getLyricsText(music.lyricsText)?.trim() && (
              <button
                type="button"
                className="load-more-lyrics"
                onClick={() => setLyricsModalOpen(true)}
                aria-label="Lyrics"
              >
                <span className="load-more-lyrics-inner">
                  <h3 className="load-more-lyrics-title">Lyrics</h3>
                  <span className="load-more-lyrics-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2h2v2a5 5 0 0 0 10 0v-2h2z" />
                      <path d="M5 16v2h14v-2H5z" />
                    </svg>
                  </span>
                </span>
              </button>
            )}
            {artist && (
              <div
                className="music-detail-artist-card"
                onClick={() => navigate(`/music/artist/${artist.id}`)}
              >
                <img
                  src={artist.imgArtist || artist.img || '/img/movie1.jpg'}
                  alt={artist.name}
                  className="music-detail-artist-card-img"
                />
                <div className="music-detail-artist-card-info">
                  <span className="music-detail-artist-card-name">
                    {artist.name}
                    <img src="/img/galichka.png" alt="" className="music-detail-artist-card-verified" aria-hidden />
                  </span>
                  <div className="artist-detail-stat-item music-detail-artist-stat">
                    <span className="artist-detail-track-num">{formatCount(artist.subscribers ?? 0)}</span>
                    <span className="artist-detail-track-label">Obunachi</span>
                  </div>
                </div>
                <FollowingButton
                  artistId={artist.id}
                  wrapperClassName="music-detail-artist-card-btn"
                  stopPropagation
                />
              </div>
            )}
            <SimilarSongs music={music} />
            <AlbumsForYou music={music} />
            <RecommendedClips music={music} />
          </div>
          <div className="music-detail-right-scroll">
            <h3 className="music-detail-trend-title">{sectionTitle}</h3>
            <div className="music-detail-trend-grid">
              {trendList.map((item) => {
                const itemArtist = artists.find((a) => a.id === item.artistId);
                const isPlayingTrack = item.id === currentMusic?.id;
                const cardDominantColor = isPlayingTrack ? (pageDominantColor || dominantColor) : null;
                return (
                  <div
                    key={item.id}
                    className={`music-detail-trend-card ${isPlayingTrack ? 'music-detail-trend-card-active' : ''}`}
                    style={
                      isPlayingTrack &&
                      cardDominantColor &&
                      typeof cardDominantColor.r === 'number'
                        ? {
                            '--card-dominant-r': cardDominantColor.r,
                            '--card-dominant-g': cardDominantColor.g,
                            '--card-dominant-b': cardDominantColor.b,
                          }
                        : undefined
                    }
                    onClick={() => navigate(`/music/${item.id}${resolvedSection ? `?section=${encodeURIComponent(resolvedSection)}` : ''}`)}
                  >
                    <div className="music-detail-trend-card-img-wrap">
                      <img
                        src={item.img || '/img/movie1.jpg'}
                        alt={getTitle(item)}
                        className="music-detail-trend-card-img"
                      />
                      <button
                        className={`music-detail-trend-card-wishlist ${isInWishlist(item.id, 'music') ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(item.id, 'music');
                        }}
                        aria-label="Sevimlilarga qo'shish"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill={isInWishlist(item.id, 'music') ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>
                      <div className="music-detail-trend-card-play">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="5 3 19 12 5 21" />
                        </svg>
                      </div>
                    </div>
                    {isPlayingTrack && (
                      <CardVisual
                        analyserRef={analyserRef}
                        isPlaying={isPlaying}
                        audioGraphReady={audioGraphReady}
                      />
                    )}
                    <div className="music-detail-trend-card-info">
                      <span className="music-detail-trend-card-title">{getTitle(item)}</span>
                      <span className="music-detail-trend-card-artist">{itemArtist?.name || ''}</span>
                      <span className="music-detail-trend-card-meta">
                        {item.year && <span className="music-detail-trend-card-year">{item.year}</span>}
                        <AudioDuration audioUrl={item.audio} prefix={item.year ? ' • ' : ''} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {lyricsModalOpen && music?.lyricsText && getLyricsText(music.lyricsText)?.trim() && (
        <div
          className="music-detail-lyrics-modal-overlay"
          onClick={() => setLyricsModalOpen(false)}
        >
          <div
            className={`music-detail-lyrics-modal ${lyricsDragging ? 'dragging' : ''}`}
            onClick={(e) => e.stopPropagation()}
            style={{ transform: `translateY(${lyricsDragOffset}px)` }}
            onPointerDown={(e) => {
              if (e.target.closest('.music-detail-lyrics-modal-back')) return;
              if (e.target.closest('.music-detail-lyrics-modal-header')) {
                lyricsDragStartRef.current = { y: e.clientY, startOffset: lyricsDragOffset };
                setLyricsDragging(true);
                e.currentTarget.setPointerCapture?.(e.pointerId);
              }
            }}
          >
            <div className="music-detail-lyrics-modal-header">
              <div className="music-detail-lyrics-modal-handle" aria-hidden="true">
                <span className="music-detail-lyrics-modal-handle-bar" />
              </div>
              <button
                type="button"
                className="music-detail-lyrics-modal-back"
                onClick={() => setLyricsModalOpen(false)}
                onPointerDown={(e) => e.stopPropagation()}
                aria-label="Orqaga"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                </svg>
              </button>
              <h3 className="music-detail-lyrics-modal-title">Lyrics</h3>
            </div>
            <div className="music-detail-lyrics-modal-content">
              {(getLyricsText(music.lyricsText) || '').split('\n').map((line, i) => (
                <p key={i} className="music-detail-lyrics-modal-line">{line}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicDetail;
