import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useWishlist } from '../context/WishlistContext';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { useDominantColor } from '../hooks/useDominantColor';
import { useAlbumTotalDuration } from '../hooks/useAlbumTotalDuration';
import { useAlbumTrackDurations } from '../hooks/useAlbumTrackDurations';
import { TopAlbums } from '../dataMusic/topAlbumsData';
import { musicDropsData } from '../dataMusic/musicDropsData';
import { sevgiVaMusiqaData } from '../dataMusic/sevgiVaMusiqaData';
import { hitCollectionsData } from '../dataMusic/hitCollectionsData';
import { matchId } from '../dataMusic/musicDataUtils';
import { MUSIC_SECTIONS } from '../dataMusic/musicSectionsConfig';
import ShareButton from '../components/ShareButton/ShareButton';
import AlbumsForYou from '../Music/AlbumsForYou/AlbumsForYou';
import SimilarSongs from '../Music/SimilarSongs/SimilarSongs';
import RecommendedClips from '../Music/RecommendedClips/RecommendedClips';
import { AudioVisualizerCanvas, CardVisual } from '../Music/Visual';
import './MusicDetail.css';
import './MusicAlbumDetail.css';

const ALBUM_TRACK_ID_OFFSET = 50000;

const albumSections = (MUSIC_SECTIONS || []).filter((s) => s.wishlistType === 'album');
const albumSectionById = Object.fromEntries(albumSections.map((s) => [s.id, s]));

const albumSongToTrack = (album, song) => ({
  id: ALBUM_TRACK_ID_OFFSET + album.id * 100 + song.id,
  title: song.title,
  artist: song.artist,
  img: album.img,
  audio: song.audio,
  year: album.year,
  albumId: album.id,
  lyricsText: song.lyricsText,
});

const MusicAlbumDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const fromSection = searchParams.get('section') || location.state?.fromSection;
  const sectionConfig = fromSection ? albumSectionById[fromSection] : null;
  const { t } = useTranslation();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const {
    currentMusic,
    dominantColor,
    getTitle,
    getLyricsText,
    isPlaying,
    duration,
    loadAndPlayTrackByTrack,
    togglePlay,
    analyserRef,
    audioGraphReady,
  } = useMusicPlayer();

  const [lyricsModalOpen, setLyricsModalOpen] = useState(false);
  const [lyricsDragOffset, setLyricsDragOffset] = useState(0);
  const [lyricsDragging, setLyricsDragging] = useState(false);
  const lyricsDragStartRef = useRef(null);
  const lyricsDragOffsetRef = useRef(0);
  lyricsDragOffsetRef.current = lyricsDragOffset;

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

  const allAlbums = [...TopAlbums, ...musicDropsData, ...sevgiVaMusiqaData, ...hitCollectionsData];
  const album = allAlbums.find((a) => matchId(a.id, id));

  /* Bo'lim bo'yicha ro'yxat va sarlavha – Music Drops, Top Albomlar va hokazo */
  const albumList = sectionConfig && Array.isArray(sectionConfig.data) ? sectionConfig.data : TopAlbums;
  const sectionTitle = sectionConfig ? t(sectionConfig.titleKey, sectionConfig.titleDefault) : t('music.topAlbums', 'Top Albomlar');
  const albumDominantColor = useDominantColor(album?.img);
  const albumTotalDuration = useAlbumTotalDuration(album?.songs);
  const trackDurations = useAlbumTrackDurations(album?.songs);

  const formatTime = (sec) => {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSongClick = (song) => {
    if (!album) return;
    const track = albumSongToTrack(album, song);
    const playlist = album.songs.map((s) => albumSongToTrack(album, s));
    loadAndPlayTrackByTrack(track, { autoplay: true, playlist });
  };

  const handleAlbumCardClick = (albumId) => {
    navigate(`/music/album/${albumId}${fromSection ? `?section=${encodeURIComponent(fromSection)}` : ''}`);
  };

  const handleArtistClick = () => {
    if (album?.artistId) {
      navigate(`/music/artist/${album.artistId}`);
    }
  };

  const handleDownload = () => {
    const track = currentTrack || currentMusic;
    if (!track?.audio) return;
    const link = document.createElement('a');
    link.href = track.audio;
    link.download = `${getTitle(track)}.mp3`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!album) {
    return (
      <div className="music-detail">
        <div className="music-detail-error">Albom topilmadi</div>
      </div>
    );
  }

  const currentTrack = currentMusic?.albumId === album.id ? currentMusic : null;
  const isCurrentTrack = currentTrack && currentMusic?.id === currentTrack?.id;
  const isAlbumPlaying = !!currentTrack;
  const displayColor = (isAlbumPlaying && dominantColor) ? dominantColor : albumDominantColor;

  const activeSong = currentTrack
    ? album.songs.find((song) => {
        const track = albumSongToTrack(album, song);
        return currentMusic?.id === track.id;
      })
    : null;
  const hasActiveLyrics = activeSong?.lyricsText && getLyricsText(activeSong.lyricsText)?.trim();

  const handlePlayClick = () => {
    if (!album?.songs?.length) return;
    if (currentTrack) {
      togglePlay();
    } else {
      const firstSong = album.songs[0];
      const track = albumSongToTrack(album, firstSong);
      const playlist = album.songs.map((s) => albumSongToTrack(album, s));
      loadAndPlayTrackByTrack(track, { autoplay: true, playlist });
    }
  };

  return (
    <div className="music-detail">
      <div className="music-detail-container">
        <div className="music-detail-layout">
          <div className="music-detail-left-scroll">
            <div
              className="music-detail-top"
              style={
                displayColor && typeof displayColor.r === 'number'
                  ? {
                      background: `linear-gradient(180deg, rgba(${displayColor.r}, ${displayColor.g}, ${displayColor.b}, 0.65) 0%, rgba(${displayColor.r}, ${displayColor.g}, ${displayColor.b}, 0.45) 40%, rgba(${displayColor.r}, ${displayColor.g}, ${displayColor.b}, 0.28) 70%, rgba(${displayColor.r}, ${displayColor.g}, ${displayColor.b}, 0.12) 100%)`,
                      borderRadius: '16px',
                      padding: '1rem',
                      border: `1px solid rgba(${displayColor.r}, ${displayColor.g}, ${displayColor.b}, 0.55)`,
                    }
                  : undefined
              }
            >
              <div className="music-detail-top-row">
                <div className="music-detail-left">
                  <img
                    src={album.img || '/img/movie1.jpg'}
                    alt={album.title}
                    className="music-detail-image"
                  />
                </div>
                <div className="music-detail-right">
                  <h1 className="music-detail-title">{album.title}</h1>
                  <div
                    className="music-detail-artist-block music-album-artist-block"
                    role={album.artistId ? 'button' : undefined}
                    tabIndex={album.artistId ? 0 : undefined}
                    onClick={album.artistId ? handleArtistClick : undefined}
                    onKeyDown={
                      album.artistId
                        ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleArtistClick();
                            }
                          }
                        : undefined
                    }
                    style={album.artistId ? { cursor: 'pointer' } : undefined}
                  >
                    <img
                      src={album.img || '/img/movie1.jpg'}
                      alt={album.artist}
                      className="music-detail-artist-img"
                    />
                    <div className="music-detail-artist-info">
                      <span className="music-detail-artist-name">{album.artist}</span>
                      {album.year && (
                        <span className="music-detail-artist-year">{album.year}</span>
                      )}
                      {album.songs?.length > 0 && (
                        <span className="music-detail-artist-year">
                          {t('music.albumSongsCount', { count: album.songs.length })}
                        </span>
                      )}
                      {albumTotalDuration != null && albumTotalDuration > 0 && (
                        <span className="music-detail-artist-duration">
                          {t('music.albumTotal')} {formatTime(albumTotalDuration)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="music-detail-audio-player">
                <button
                  className="music-detail-play-btn"
                  onClick={handlePlayClick}
                  aria-label={isAlbumPlaying && isPlaying ? 'Pauza' : 'Ijro etish'}
                >
                  {isAlbumPlaying && isPlaying ? (
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
                    className={`music-detail-action-btn music-detail-save-btn ${isInWishlist(album.id, 'album') ? 'active' : ''}`}
                    onClick={() => toggleWishlist(album.id, 'album')}
                    aria-label="Sevimlilarga saqlash"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill={isInWishlist(album.id, 'album') ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                  {currentTrack && (
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
                  )}
                  <div className="music-detail-share-wrap">
                    <ShareButton movie={album} dropdownInPortal />
                  </div>
                {isAlbumPlaying && (
                  <AudioVisualizerCanvas
                    analyserRef={analyserRef}
                    isPlaying={isPlaying}
                    audioGraphReady={audioGraphReady}
                  />
                )}
              </div>
            </div>
            {hasActiveLyrics && (
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
            <div className="music-album-songs-list">
              <h3 className="music-album-songs-title">{t('music.albumSongsTitle', 'Qo\'shiqlar')}</h3>
              <div className="music-album-songs-grid">
              {album.songs.map((song, index) => {
                const track = albumSongToTrack(album, song);
                const isActive = currentMusic?.id === track.id;
                return (
                  <div
                    key={song.id}
                    className={`music-album-song-row ${isActive ? 'active' : ''}`}
                    onClick={() => handleSongClick(song)}
                  >
                    {isActive ? (
                      <div className="music-album-song-visual-wrap">
                        <CardVisual
                          analyserRef={analyserRef}
                          isPlaying={isPlaying}
                          audioGraphReady={audioGraphReady}
                        />
                      </div>
                    ) : (
                      <span className="music-album-song-index">{index + 1}</span>
                    )}
                    <span className="music-album-song-headphone-icon" aria-hidden>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                      </svg>
                    </span>
                    <div className="music-album-song-info">
                      <span className="music-album-song-title">{song.title}</span>
                      <span className="music-album-song-artist">{song.artist}</span>
                    </div>
                    <span className="music-album-song-duration">
                      {isActive && duration > 0 ? formatTime(duration) : (trackDurations[index] != null ? formatTime(trackDurations[index]) : '--:--')}
                    </span>
                  </div>
                );
              })}
              </div>
            </div>
            <AlbumsForYou album={album} titleKey="music.similarAlbums" />
            <SimilarSongs album={album} titleKey="music.songsForYou" />
            <RecommendedClips album={album} />
          </div>
          <div className="music-detail-right-scroll">
            <h3 className="music-detail-trend-title">{sectionTitle}</h3>
            <div className="music-detail-trend-grid">
              {albumList.map((item) => {
                const isActiveAlbum = item.id === album?.id;
                return (
                  <div
                    key={item.id}
                    className={`music-detail-trend-card music-album-detail-card ${isActiveAlbum ? 'music-detail-trend-card-active' : ''}`}
                  style={
                    isActiveAlbum && displayColor && typeof displayColor.r === 'number'
                      ? {
                          '--card-dominant-r': displayColor.r,
                          '--card-dominant-g': displayColor.g,
                          '--card-dominant-b': displayColor.b,
                        }
                      : undefined
                  }
                  onClick={() => handleAlbumCardClick(item.id)}
                >
                  <div className="music-detail-trend-card-img-wrap">
                    <img
                      src={item.img || '/img/movie1.jpg'}
                      alt={item.title}
                      className="music-detail-trend-card-img"
                    />
                    <div className="music-detail-trend-card-play">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21" />
                      </svg>
                    </div>
                  </div>
                  {isActiveAlbum && (
                    <CardVisual
                      analyserRef={analyserRef}
                      isPlaying={isCurrentTrack && isPlaying}
                      audioGraphReady={audioGraphReady}
                    />
                  )}
                  <div className="music-detail-trend-card-info">
                    <span className="music-detail-trend-card-title">{item.title}</span>
                    <span className="music-detail-trend-card-artist">{item.artist}</span>
                    {item.year && (
                      <span className="music-detail-trend-card-year">{item.year}</span>
                    )}
                  </div>
                </div>
              );
              })}
            </div>
          </div>
        </div>
      </div>

      {lyricsModalOpen && hasActiveLyrics && (
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
              <h3 className="music-detail-lyrics-modal-title">
                {activeSong?.title} — Lyrics
              </h3>
            </div>
            <div className="music-detail-lyrics-modal-content">
              {hasActiveLyrics.split('\n').map((line, i) => (
                <p key={i} className="music-detail-lyrics-modal-line">{line}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicAlbumDetail;
