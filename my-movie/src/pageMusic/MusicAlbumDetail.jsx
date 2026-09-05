import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useWishlist } from '../context/WishlistContext';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { useDominantColor } from '../hooks/useDominantColor';
import { useAlbumTotalDuration } from '../hooks/useAlbumTotalDuration';
import { useAlbumTrackDurations } from '../hooks/useAlbumTrackDurations';
import { matchId } from '../utils/musicDataUtils';
import { useMusicApi } from '../context/MusicApiContext';
import ShareButton from '../components/ShareButton/ShareButton';
import AlbumsForYou from '../Music/AlbumsForYou/AlbumsForYou';
import SimilarSongs from '../Music/SimilarSongs/SimilarSongs';
import RecommendedClips from '../Music/RecommendedClips/RecommendedClips';
import { AudioVisualizerCanvas, CardVisual } from '../Music/Visual';
import SkeletonLoader from '../components/SkeletonLoader/SkeletonLoader';
import { useImageReady } from '../utils/useImageReady';
import { albumSongToTrack } from '../utils/albumSongToTrack';
import './MusicDetail.css';
import './MusicAlbumDetail.css';

const TREND_SKELETON_COUNT = 8;
const SONGS_SKELETON_COUNT = 6;

const AlbumTrendCardSkeleton = () => (
  <div
    className="music-detail-trend-card music-album-detail-card music-detail-trend-card--skeleton"
    aria-hidden="true"
  >
    <div className="music-detail-trend-card-img-wrap">
      <SkeletonLoader
        variant="music-detail-trend-img"
        className="music-detail-trend-card-img-skeleton"
      />
      <span
        className="music-detail-trend-card-play music-detail-trend-card-play--skeleton"
        aria-hidden="true"
      />
    </div>
    <div className="music-detail-trend-card-info">
      <SkeletonLoader variant="music-detail-trend-card-title" />
      <SkeletonLoader variant="music-detail-trend-card-artist" />
      <div className="music-detail-trend-card-meta music-detail-trend-card-meta--skeleton">
        <SkeletonLoader variant="music-detail-trend-card-meta" />
      </div>
    </div>
  </div>
);

const AlbumTrendCard = ({
  item,
  isActiveAlbum,
  displayColor,
  onOpen,
  analyserRef,
  isPlaying,
  audioGraphReady,
  blockClick,
}) => {
  const imgSrc = item.img || '/img/movie1.jpg';
  const { showSkeleton: showImgSkeleton, imgRef, onLoad, onError } = useImageReady(imgSrc);

  return (
    <div
      className={`music-detail-trend-card music-album-detail-card${
        isActiveAlbum ? ' music-detail-trend-card-active' : ''
      }${showImgSkeleton ? ' music-detail-trend-card--loading' : ''}`}
      style={
        isActiveAlbum && displayColor && typeof displayColor.r === 'number'
          ? {
              '--card-dominant-r': displayColor.r,
              '--card-dominant-g': displayColor.g,
              '--card-dominant-b': displayColor.b,
            }
          : undefined
      }
      onClick={() => !blockClick && !showImgSkeleton && onOpen?.(item.id)}
      aria-busy={showImgSkeleton || undefined}
    >
      <div className="music-detail-trend-card-img-wrap">
        {showImgSkeleton && (
          <SkeletonLoader
            variant="music-detail-trend-img"
            className="music-detail-trend-card-img-skeleton"
          />
        )}
        {imgSrc && (
          <img
            ref={imgRef}
            src={imgSrc}
            alt={item.title}
            className={`music-detail-trend-card-img${
              showImgSkeleton ? ' music-detail-trend-card-img--loading' : ''
            }`}
            onLoad={onLoad}
            onError={onError}
          />
        )}
        {showImgSkeleton ? (
          <span
            className="music-detail-trend-card-play music-detail-trend-card-play--skeleton"
            aria-hidden="true"
          />
        ) : (
          <div className="music-detail-trend-card-play">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21" />
            </svg>
          </div>
        )}
      </div>
      {isActiveAlbum && !showImgSkeleton && (
        <CardVisual
          analyserRef={analyserRef}
          isPlaying={isPlaying}
          audioGraphReady={audioGraphReady}
        />
      )}
      <div className="music-detail-trend-card-info">
        {showImgSkeleton ? (
          <>
            <SkeletonLoader variant="music-detail-trend-card-title" />
            <SkeletonLoader variant="music-detail-trend-card-artist" />
            <div className="music-detail-trend-card-meta music-detail-trend-card-meta--skeleton">
              <SkeletonLoader variant="music-detail-trend-card-meta" />
            </div>
          </>
        ) : (
          <>
            <span className="music-detail-trend-card-title">{item.title}</span>
            <span className="music-detail-trend-card-artist">{item.artist}</span>
            {item.year && (
              <span className="music-detail-trend-card-year">{item.year}</span>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const AlbumSongRowSkeleton = () => (
  <div className="music-album-song-row music-album-song-row--skeleton" aria-hidden="true">
    <SkeletonLoader variant="music-album-song-index" />
    <SkeletonLoader variant="music-album-song-icon" />
    <div className="music-album-song-info">
      <SkeletonLoader variant="music-album-song-title" />
      <SkeletonLoader variant="music-album-song-artist" />
    </div>
    <SkeletonLoader variant="music-album-song-duration" />
  </div>
);

const MusicAlbumDetail = () => {
  const { id } = useParams();
  const { sections, allAlbums, getAlbumsByCategory, albumsLoading } = useMusicApi();
  const albumSections = (sections || []).filter((s) => s.wishlistType === 'album');
  const topAlbums = getAlbumsByCategory('TopAlbums');
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const fromSection = searchParams.get('section') || location.state?.fromSection;
  const sectionConfig = fromSection
    ? albumSections.find((s) => s.id === fromSection || s.slug === fromSection) || null
    : null;
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
  const [lyricsSheetOpen, setLyricsSheetOpen] = useState(false);
  const [lyricsClosing, setLyricsClosing] = useState(false);
  const [lyricsDragOffset, setLyricsDragOffset] = useState(0);
  const [lyricsDragging, setLyricsDragging] = useState(false);
  const lyricsDragStartRef = useRef(null);
  const lyricsDragOffsetRef = useRef(0);
  const lyricsModalRef = useRef(null);
  const lyricsClosingRef = useRef(false);
  const lyricsCloseTimerRef = useRef(null);
  const LYRICS_CLOSE_MS = 320;
  lyricsDragOffsetRef.current = lyricsDragOffset;

  const trendSkeletonItems = useMemo(
    () =>
      Array.from({ length: TREND_SKELETON_COUNT }, (_, index) => ({
        id: `album-trend-skeleton-${index}`,
        _skeleton: true,
      })),
    []
  );
  const songSkeletonItems = useMemo(
    () =>
      Array.from({ length: SONGS_SKELETON_COUNT }, (_, index) => ({
        id: `album-song-skeleton-${index}`,
        _skeleton: true,
      })),
    []
  );

  const finishLyricsClose = useCallback(() => {
    if (lyricsCloseTimerRef.current) {
      window.clearTimeout(lyricsCloseTimerRef.current);
      lyricsCloseTimerRef.current = null;
    }
    setLyricsModalOpen(false);
    setLyricsSheetOpen(false);
    setLyricsClosing(false);
    setLyricsDragging(false);
    setLyricsDragOffset(0);
    lyricsDragStartRef.current = null;
    lyricsClosingRef.current = false;
  }, []);

  const closeLyricsModal = useCallback(() => {
    if (lyricsClosingRef.current) return;
    if (typeof window !== 'undefined' && window.innerWidth > 768) {
      setLyricsModalOpen(false);
      return;
    }
    lyricsClosingRef.current = true;
    lyricsDragStartRef.current = null;
    setLyricsDragging(false);
    const h = lyricsModalRef.current?.offsetHeight || Math.round(window.innerHeight * 0.5);
    setLyricsDragOffset((prev) => (prev > 0 ? Math.max(prev, h + 24) : h + 24));
    setLyricsSheetOpen(false);
    setLyricsClosing(true);
    lyricsCloseTimerRef.current = window.setTimeout(finishLyricsClose, LYRICS_CLOSE_MS);
  }, [finishLyricsClose]);

  useEffect(() => {
    if (!lyricsModalOpen) {
      setLyricsSheetOpen(false);
      setLyricsClosing(false);
      return undefined;
    }
    if (typeof window !== 'undefined' && window.innerWidth > 768) {
      setLyricsSheetOpen(true);
      setLyricsDragOffset(0);
      setLyricsDragging(false);
      return undefined;
    }
    if (lyricsCloseTimerRef.current) {
      window.clearTimeout(lyricsCloseTimerRef.current);
      lyricsCloseTimerRef.current = null;
    }
    lyricsClosingRef.current = false;
    setLyricsClosing(false);
    setLyricsDragOffset(0);
    setLyricsDragging(false);
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setLyricsSheetOpen(true));
    });
    return () => cancelAnimationFrame(id);
  }, [lyricsModalOpen]);

  useEffect(() => () => {
    if (lyricsCloseTimerRef.current) window.clearTimeout(lyricsCloseTimerRef.current);
  }, []);

  useEffect(() => {
    if (!lyricsModalOpen) return;
    const onMove = (e) => {
      if (lyricsClosingRef.current) return;
      const start = lyricsDragStartRef.current;
      if (start && e.cancelable) e.preventDefault();
      const clientY = e.touches ? e.touches[0]?.clientY : e.clientY;
      if (!start || clientY == null) return;
      const dy = clientY - start.y;
      const newOffset = Math.max(0, start.startOffset + dy);
      setLyricsDragOffset(newOffset);
    };
    const onUp = () => {
      if (lyricsClosingRef.current) return;
      lyricsDragStartRef.current = null;
      setLyricsDragging(false);
      const offset = lyricsDragOffsetRef.current;
      if (offset > 100) {
        closeLyricsModal();
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
  }, [lyricsModalOpen, closeLyricsModal]);

  const album = allAlbums.find((a) => matchId(a.id, id));

  const coverSrc = album?.img || (album ? '/img/movie1.jpg' : '');
  const coverImg = useImageReady(coverSrc);
  const artistImgSrc = album ? album.img || '/img/movie1.jpg' : '';
  const artistImg = useImageReady(artistImgSrc);

  const showHeroDataSkeleton = Boolean(albumsLoading) && !album;
  const heroAwaitingCover = Boolean(album) && coverImg.showSkeleton;
  const showCoverSkeleton = showHeroDataSkeleton || coverImg.showSkeleton;
  const showTitleSkeleton = showHeroDataSkeleton || heroAwaitingCover;
  const showArtistDataSkeleton = showHeroDataSkeleton || heroAwaitingCover;
  const showArtistImgSkeleton = Boolean(album) && artistImg.showSkeleton;
  const showSongsSkeleton = showHeroDataSkeleton || heroAwaitingCover;

  const albumList = sectionConfig?.categoryNameMusic
    ? getAlbumsByCategory(sectionConfig.categoryNameMusic)
    : topAlbums;
  const sectionTitle = sectionConfig
    ? t(sectionConfig.titleKey, sectionConfig.titleDefault)
    : t('music.topAlbums', 'Top Albomlar');
  const albumDominantColor = useDominantColor(album?.img);
  const albumTotalDuration = useAlbumTotalDuration(album?.songs);
  const trackDurations = useAlbumTrackDurations(album?.songs);

  const showTrendSectionSkeleton =
    showHeroDataSkeleton || (Boolean(albumsLoading) && albumList.length === 0);
  const trendItemsToRender = showTrendSectionSkeleton ? trendSkeletonItems : albumList;

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
    navigate(
      `/music/album/${albumId}${fromSection ? `?section=${encodeURIComponent(fromSection)}` : ''}`
    );
  };

  const handleArtistClick = () => {
    if (album?.artistId) {
      navigate(`/music/artist/${album.artistId}`);
    }
  };

  const handleDownload = () => {
    const track = currentMusic?.albumId === album?.id ? currentMusic : null;
    if (!track?.audio) return;
    const link = document.createElement('a');
    link.href = track.audio;
    link.download = `${getTitle(track)}.mp3`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!album && !albumsLoading) {
    return (
      <div className="music-detail">
        <div className="music-detail-error">Albom topilmadi</div>
      </div>
    );
  }

  const currentTrack = album && currentMusic?.albumId === album.id ? currentMusic : null;
  const isCurrentTrack = currentTrack && currentMusic?.id === currentTrack?.id;
  const isAlbumPlaying = !!currentTrack;
  const displayColor =
    isAlbumPlaying && dominantColor ? dominantColor : albumDominantColor;

  const topStyle =
    displayColor && typeof displayColor.r === 'number'
      ? {
          background: `linear-gradient(180deg, rgba(${displayColor.r}, ${displayColor.g}, ${displayColor.b}, 0.65) 0%, rgba(${displayColor.r}, ${displayColor.g}, ${displayColor.b}, 0.45) 40%, rgba(${displayColor.r}, ${displayColor.g}, ${displayColor.b}, 0.28) 70%, rgba(${displayColor.r}, ${displayColor.g}, ${displayColor.b}, 0.12) 100%)`,
          borderRadius: '16px',
          padding: '1rem',
          border: `1px solid rgba(${displayColor.r}, ${displayColor.g}, ${displayColor.b}, 0.55)`,
        }
      : undefined;

  const activeSong =
    album && currentTrack
      ? album.songs.find((song) => {
          const track = albumSongToTrack(album, song);
          return currentMusic?.id === track.id;
        })
      : null;
  const hasActiveLyrics =
    activeSong?.lyricsText && getLyricsText(activeSong.lyricsText)?.trim();

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
    <div className="music-detail" aria-busy={showHeroDataSkeleton || undefined}>
      <div className="music-detail-container">
        <div className="music-detail-layout">
          <div className="music-detail-left-scroll">
            <div className="music-detail-top" style={topStyle}>
              <div className="music-detail-top-row">
                <div
                  className="music-detail-left"
                  aria-busy={showCoverSkeleton || undefined}
                >
                  {showCoverSkeleton && (
                    <SkeletonLoader
                      variant="music-detail-cover"
                      className="music-detail-cover-skeleton"
                    />
                  )}
                  {coverSrc && album && (
                    <img
                      ref={coverImg.imgRef}
                      src={coverSrc}
                      alt={album.title}
                      className={`music-detail-image${
                        showCoverSkeleton ? ' music-detail-image--loading' : ''
                      }`}
                      onLoad={coverImg.onLoad}
                      onError={coverImg.onError}
                    />
                  )}
                </div>
                <div className="music-detail-right">
                  {showTitleSkeleton || !album ? (
                    <h1
                      className="music-detail-title music-detail-title--skeleton"
                      aria-hidden="true"
                    >
                      <SkeletonLoader variant="music-detail-title" />
                    </h1>
                  ) : (
                    <h1 className="music-detail-title">{album.title}</h1>
                  )}
                  {(showArtistDataSkeleton || album) && (
                    <div
                      className={`music-detail-artist-block music-album-artist-block${
                        showArtistDataSkeleton
                          ? ' music-detail-artist-block--skeleton'
                          : ''
                      }`}
                      role={
                        !showArtistDataSkeleton && album?.artistId
                          ? 'button'
                          : undefined
                      }
                      tabIndex={
                        !showArtistDataSkeleton && album?.artistId ? 0 : undefined
                      }
                      onClick={
                        !showArtistDataSkeleton && album?.artistId
                          ? handleArtistClick
                          : undefined
                      }
                      onKeyDown={
                        !showArtistDataSkeleton && album?.artistId
                          ? (e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleArtistClick();
                              }
                            }
                          : undefined
                      }
                      style={
                        showArtistDataSkeleton || !album?.artistId
                          ? { cursor: 'default' }
                          : { cursor: 'pointer' }
                      }
                      aria-busy={
                        showArtistDataSkeleton || showArtistImgSkeleton || undefined
                      }
                    >
                      {showArtistDataSkeleton ? (
                        <>
                          <SkeletonLoader variant="music-detail-artist-img" />
                          <div className="music-detail-artist-info">
                            <SkeletonLoader variant="music-detail-artist-name" />
                            <SkeletonLoader variant="music-detail-artist-meta" />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="music-detail-artist-img-wrap">
                            {showArtistImgSkeleton && (
                              <SkeletonLoader
                                variant="music-detail-artist-img"
                                className="music-detail-artist-img--skeleton"
                              />
                            )}
                            {artistImgSrc && (
                              <img
                                ref={artistImg.imgRef}
                                src={artistImgSrc}
                                alt={album.artist}
                                className={`music-detail-artist-img${
                                  showArtistImgSkeleton
                                    ? ' music-detail-artist-img--loading'
                                    : ''
                                }`}
                                onLoad={artistImg.onLoad}
                                onError={artistImg.onError}
                              />
                            )}
                          </div>
                          <div className="music-detail-artist-info">
                            <span className="music-detail-artist-name">
                              {album.artist}
                            </span>
                            {album.year && (
                              <span className="music-detail-artist-year">
                                {album.year}
                              </span>
                            )}
                            {album.songs?.length > 0 && (
                              <span className="music-detail-artist-year">
                                {t('music.albumSongsCount', {
                                  count: album.songs.length,
                                })}
                              </span>
                            )}
                            {albumTotalDuration != null && albumTotalDuration > 0 && (
                              <span className="music-detail-artist-duration">
                                {t('music.albumTotal')} {formatTime(albumTotalDuration)}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {album && (
                <div className="music-detail-audio-player">
                  <button
                    className="music-detail-play-btn"
                    onClick={handlePlayClick}
                    aria-label={
                      isAlbumPlaying && isPlaying ? 'Pauza' : 'Ijro etish'
                    }
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
                    className={`music-detail-action-btn music-detail-save-btn ${
                      isInWishlist(album.id, 'album') ? 'active' : ''
                    }`}
                    onClick={() => toggleWishlist(album.id, 'album')}
                    aria-label="Sevimlilarga saqlash"
                  >
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill={
                        isInWishlist(album.id, 'album') ? 'currentColor' : 'none'
                      }
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                  {currentTrack && (
                    <button
                      className="music-detail-action-btn music-detail-download-btn"
                      onClick={handleDownload}
                      aria-label="Yuklab olish"
                    >
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
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
              )}
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
              {showSongsSkeleton ? (
                <SkeletonLoader
                  variant="music-album-songs-title"
                  className="music-album-songs-title-skeleton"
                />
              ) : (
                <h3 className="music-album-songs-title">
                  {t('music.albumSongsTitle', "Qo'shiqlar")}
                </h3>
              )}
              <div
                className="music-album-songs-grid"
                aria-busy={showSongsSkeleton || undefined}
              >
                {showSongsSkeleton
                  ? songSkeletonItems.map((row) => (
                      <AlbumSongRowSkeleton key={row.id} />
                    ))
                  : album.songs.map((song, index) => {
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
                            <span className="music-album-song-index">
                              {index + 1}
                            </span>
                          )}
                          <span
                            className="music-album-song-headphone-icon"
                            aria-hidden
                          >
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                            </svg>
                          </span>
                          <div className="music-album-song-info">
                            <span className="music-album-song-title">
                              {song.title}
                            </span>
                            <span className="music-album-song-artist">
                              {song.artist}
                            </span>
                          </div>
                          <span className="music-album-song-duration">
                            {isActive && duration > 0
                              ? formatTime(duration)
                              : trackDurations[index] != null
                                ? formatTime(trackDurations[index])
                                : '--:--'}
                          </span>
                        </div>
                      );
                    })}
              </div>
            </div>
            <AlbumsForYou
              album={album}
              titleKey="music.similarAlbums"
              forceSkeleton={showHeroDataSkeleton}
            />
            <SimilarSongs
              album={album}
              titleKey="music.songsForYou"
              forceSkeleton={showHeroDataSkeleton}
            />
            <RecommendedClips album={album} forceSkeleton={showHeroDataSkeleton} />
          </div>
          <div className="music-detail-right-scroll">
            {showTrendSectionSkeleton ? (
              <SkeletonLoader
                variant="music-detail-trend-title"
                className="music-detail-trend-title-skeleton"
              />
            ) : (
              <h3 className="music-detail-trend-title">{sectionTitle}</h3>
            )}
            <div
              className="music-detail-trend-grid"
              aria-busy={showTrendSectionSkeleton || undefined}
            >
              {trendItemsToRender.map((item) => {
                if (item._skeleton) {
                  return <AlbumTrendCardSkeleton key={item.id} />;
                }
                const isActiveAlbum = item.id === album?.id;
                return (
                  <AlbumTrendCard
                    key={item.id}
                    item={item}
                    isActiveAlbum={isActiveAlbum}
                    displayColor={displayColor}
                    onOpen={handleAlbumCardClick}
                    analyserRef={analyserRef}
                    isPlaying={isCurrentTrack && isPlaying}
                    audioGraphReady={audioGraphReady}
                    blockClick={showTrendSectionSkeleton}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {lyricsModalOpen && hasActiveLyrics && (
        <div
          className={[
            'music-detail-lyrics-modal-overlay',
            lyricsSheetOpen && !lyricsClosing ? 'music-detail-lyrics-modal-overlay--open' : '',
            lyricsClosing ? 'music-detail-lyrics-modal-overlay--closing' : '',
          ].filter(Boolean).join(' ')}
          onClick={closeLyricsModal}
        >
          <div
            ref={lyricsModalRef}
            className={[
              'music-detail-lyrics-modal',
              lyricsDragging ? 'dragging' : '',
              lyricsSheetOpen && !lyricsClosing ? 'music-detail-lyrics-modal--open' : '',
              lyricsClosing ? 'music-detail-lyrics-modal--closing' : '',
            ].filter(Boolean).join(' ')}
            onClick={(e) => e.stopPropagation()}
            style={lyricsDragOffset ? { transform: `translateY(${lyricsDragOffset}px)` } : undefined}
            onPointerDown={(e) => {
              if (lyricsClosingRef.current) return;
              if (e.target.closest('.music-detail-lyrics-modal-back')) return;
              if (e.target.closest('.music-detail-lyrics-modal-header')) {
                lyricsDragStartRef.current = {
                  y: e.clientY,
                  startOffset: lyricsDragOffset,
                };
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
                onClick={closeLyricsModal}
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
                <p key={i} className="music-detail-lyrics-modal-line">
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicAlbumDetail;
