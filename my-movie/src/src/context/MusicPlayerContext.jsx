import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { allMusicData } from '../dataMusic/allMusicData';
import { ensureArray, matchId } from '../dataMusic/musicDataUtils';
import { TopAlbums } from '../dataMusic/topAlbumsData';
import { artists } from '../dataMusic/artists';
import { useContentLanguage } from './ContentLanguageContext';
import { useDominantColor } from '../hooks/useDominantColor';
import { useWishlist } from './WishlistContext';
import MusicMiniPlayer from '../Music/MusicMiniPlayer/MusicMiniPlayer';
import MusicPlayerModal from '../Music/MusicPlayerModal/MusicPlayerModal';
import '../pageMusic/MusicDetail.css';

const ALBUM_TRACK_ID_OFFSET = 50000;
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

const MusicPlayerContext = createContext();

const MINI_PLAYER_FORBIDDEN_PATHS = ['/shorts', '/movie', '/music/video'];

export const MusicPlayerProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { contentLang } = useContentLanguage();

  const isMiniPlayerForbidden = MINI_PLAYER_FORBIDDEN_PATHS.some(
    (p) => location.pathname === p || (p !== '/movie' && location.pathname.startsWith(p + '/'))
  ) || location.pathname.match(/^\/movie\/[^/]+$/);

  /* Faqat MusicDetail sahifasida bo'lganda prev/next navigatsiya qilsin; boshqa sahifada faqat trek o'zgaradi */
  const isOnMusicDetailPage = /^\/music\/(\d+|album\/[^/]+)$/.test(location.pathname);

  const audioRef = useRef(null);
  const prevVolumeRef = useRef(0.7);
  const lastMusicRef = useRef(null);
  const playlistRef = useRef(null);
  const pendingNavigateRef = useRef(null);
  const pendingAutoplayRef = useRef(false);
  const tryAutoplayRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const bassFilterRef = useRef(null);
  const trebleFilterRef = useRef(null);
  const analyserRef = useRef(null);
  const gainNodeRef = useRef(null);

  const [currentMusic, setCurrentMusic] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isRepeat, setIsRepeat] = useState(() => sessionStorage.getItem('musicRepeat') === 'true');
  const [isShuffle, setIsShuffle] = useState(() => sessionStorage.getItem('musicShuffle') === 'true');
  const [bass, setBass] = useState(0.5);
  const [treble, setTreble] = useState(0.5);
  const [audioGraphReady, setAudioGraphReady] = useState(false);
  const [lyricsModalOpen, setLyricsModalOpen] = useState(false);
  const [lyricsDragOffset, setLyricsDragOffset] = useState(0);
  const [lyricsDragging, setLyricsDragging] = useState(false);
  const lyricsDragStartRef = useRef(null);
  const lyricsDragOffsetRef = useRef(0);
  lyricsDragOffsetRef.current = lyricsDragOffset;
  const [playerModalOpen, setPlayerModalOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(() => window.innerWidth <= 768);

  useEffect(() => {
    const check = () => setIsMobileView(window.innerWidth <= 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  /* Desktopga o'tganda modalni yopish */
  useEffect(() => {
    if (!isMobileView) setPlayerModalOpen(false);
  }, [isMobileView]);

  useEffect(() => {
    if (!isMobileView && playerModalOpen) setPlayerModalOpen(false);
  }, [isMobileView, playerModalOpen]);

  /* Lyrics modal drag */
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

  const { toggleWishlist, isInWishlist } = useWishlist();
  const artist = currentMusic
    ? (currentMusic.artistId ? artists.find((a) => a.id === currentMusic.artistId) : (currentMusic.artist ? { name: currentMusic.artist } : null))
    : null;
  const dominantColor = useDominantColor(currentMusic?.img);

  const getTitle = useCallback((item) => {
    if (!item?.title) return '';
    if (typeof item.title === 'object') {
      return item.title[contentLang] || item.title.uz || item.title.ru || item.title.en || '';
    }
    return String(item.title);
  }, [contentLang]);

  const getLyricsText = useCallback((txt) => {
    if (txt == null || txt === '') return '';
    if (typeof txt === 'object') {
      const val = txt[contentLang] ?? txt.uz ?? txt.ru ?? txt.en ?? '';
      return String(val ?? '');
    }
    return String(txt);
  }, [contentLang]);

  const loadTrack = useCallback((musicId, shouldAutoplay = false) => {
    const music = ensureArray(allMusicData).find((m) => matchId(m.id, musicId));
    if (!music?.audio) return;

    setCurrentMusic(music);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);

    const el = audioRef.current;
    if (el) {
      el.pause();
      el.autoplay = !!shouldAutoplay;
      el.src = music.audio;
      el.load();
      el.currentTime = 0;
      /* User gesture ichida darhol play() – cache’langan treklar uchun ishlaydi */
      if (shouldAutoplay) {
        const ctx = audioContextRef.current;
        if (ctx?.state === 'suspended') ctx.resume().catch(() => {});
        el.play().then(() => {
          pendingAutoplayRef.current = false;
          setIsPlaying(true);
        }).catch(() => {
          setTimeout(() => tryAutoplayRef.current?.(), 100);
        });
      }
    }
  }, []);

  const tryAutoplay = useCallback(() => {
    if (!pendingAutoplayRef.current || !audioRef.current) return;
    const el = audioRef.current;
    const ctx = audioContextRef.current;
    /* AudioContext running bo‘lsa – oddiy play; suspended bo‘lsa – avval resume */
    const doPlay = () => {
      el.play()
        .then(() => {
          pendingAutoplayRef.current = false;
          setIsPlaying(true);
        })
        .catch(() => {
          /* Fallback: muted play (ba‘zi brauzerlarda ishlaydi) */
          const wasMuted = el.muted;
          el.muted = true;
          el.play()
            .then(() => {
              el.muted = wasMuted;
              pendingAutoplayRef.current = false;
              setIsPlaying(true);
            })
            .catch(() => {
              el.muted = wasMuted;
              el.play().then(() => {
                pendingAutoplayRef.current = false;
                setIsPlaying(true);
              }).catch(() => setIsPlaying(false));
            });
        });
    };
    if (ctx?.state === 'suspended') {
      ctx.resume().then(doPlay).catch(doPlay);
    } else {
      doPlay();
    }
  }, []);

  tryAutoplayRef.current = tryAutoplay;

  /** MusicDetail sahifasida bo'lim playlistini o'rnatish – prev/next shu ro'yxat bo'yicha ishlaydi */
  const setPlaylistFromPage = useCallback((playlist) => {
    playlistRef.current = Array.isArray(playlist) && playlist.length ? playlist : null;
  }, []);

  const handleCanPlay = useCallback(() => {
    if (pendingAutoplayRef.current && audioRef.current) {
      tryAutoplay();
    }
  }, [tryAutoplay]);

  const loadAndPlayTrack = useCallback((musicId, options = {}) => {
    const { autoplay = false, syncMusicDetail = false, playlist } = options;
    pendingAutoplayRef.current = !!autoplay;
    /* playlist uzatilsa o'rnatamiz, undef bo'lsa mavjud playlistRef ni saqlaymiz (bo'lim ro'yxati) */
    if (playlist !== undefined) {
      playlistRef.current = Array.isArray(playlist) ? playlist : null;
    }

    const doAutoplay = () => {
      loadTrack(musicId, autoplay);
      tryAutoplay();
      for (let i = 0; i <= 50; i++) {
        setTimeout(() => {
          if (pendingAutoplayRef.current && audioRef.current) tryAutoplay();
        }, i * 100);
      }
    };
    /* Suspended bo'lsa avval resume – ovoz chiqishi uchun majburiy */
    const run = () => {
      if (autoplay && audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume().then(doAutoplay).catch(doAutoplay);
      } else {
        doAutoplay();
      }
    };
    run();
    if (syncMusicDetail) {
      const currentPathId = location.pathname.replace(/^\/music\//, '').replace(/\/.*$/, '') || '';
      if (currentPathId !== String(musicId)) {
        const keepModal = window.innerWidth <= 768;
        const search = typeof window !== 'undefined' ? (window.location.search || '') : '';
        /* Navigatsiyani currentMusic yangilangandan KEYIN bajarish – useEffect orqali, oldinga bosganda player yo'qolmasin */
        pendingNavigateRef.current = { musicId, keepModal, search };
      }
    }
  }, [loadTrack, location.pathname, location.search, navigate, tryAutoplay]);

  /* currentMusic yangilangandan keyin navigatsiya – oldinga bosganda player va rang yo'qolmasin */
  useEffect(() => {
    const pending = pendingNavigateRef.current;
    if (!pending || !currentMusic) return;
    if (!matchId(currentMusic.id, pending.musicId)) return;
    pendingNavigateRef.current = null;
    const search = typeof window !== 'undefined' ? (window.location.search || '') : '';
    navigate(`/music/${pending.musicId}${search || pending.search || ''}`, {
      state: { keepModalOpen: pending.keepModal, syncFromPlayer: true },
    });
  }, [currentMusic, navigate]);

  const loadTrackByTrack = useCallback((track, shouldAutoplay = false) => {
    if (!track?.audio) return;

    setCurrentMusic(track);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);

    const el = audioRef.current;
    if (el) {
      el.pause();
      el.autoplay = !!shouldAutoplay;
      el.src = track.audio;
      el.load();
      el.currentTime = 0;
      if (shouldAutoplay) {
        const ctx = audioContextRef.current;
        if (ctx?.state === 'suspended') ctx.resume().catch(() => {});
        el.play().then(() => {
          pendingAutoplayRef.current = false;
          setIsPlaying(true);
        }).catch(() => {
          setTimeout(() => tryAutoplayRef.current?.(), 100);
        });
      }
    }
  }, []);

  const loadAndPlayTrackByTrack = useCallback((track, options = {}) => {
    const { autoplay = false, playlist = null } = options;
    pendingAutoplayRef.current = !!autoplay;
    playlistRef.current = Array.isArray(playlist) ? playlist : null;

    const doAutoplay = () => {
      loadTrackByTrack(track, autoplay);
      tryAutoplay();
      for (let i = 0; i <= 50; i++) {
        setTimeout(() => {
          if (pendingAutoplayRef.current && audioRef.current) tryAutoplay();
        }, i * 100);
      }
    };
    const run = () => {
      if (autoplay && audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume().then(doAutoplay).catch(doAutoplay);
      } else {
        doAutoplay();
      }
    };
    run();
  }, [loadTrackByTrack, tryAutoplay]);

  /* Takroriy navigatsiya useEffect olib tashlandi – faqat yuqoridagi bitta useEffect qoldi */
  const seek = useCallback((time) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, time);
    setCurrentTime(audioRef.current.currentTime);
  }, []);

  useEffect(() => {
    const el = audioRef.current;
    if (!currentMusic?.audio || !el) return;
    try {
      const ctx = audioContextRef.current || new (window.AudioContext || window.webkitAudioContext)();
      if (!audioContextRef.current) audioContextRef.current = ctx;
      if (!sourceNodeRef.current) {
        const source = ctx.createMediaElementSource(el);
        sourceNodeRef.current = source;
        const bassFilter = ctx.createBiquadFilter();
        bassFilter.type = 'lowshelf';
        bassFilter.frequency.value = 150;
        bassFilter.gain.value = (bass - 0.5) * 24;
        bassFilterRef.current = bassFilter;
        const trebleFilter = ctx.createBiquadFilter();
        trebleFilter.type = 'highshelf';
        trebleFilter.frequency.value = 3000;
        trebleFilter.gain.value = (treble - 0.5) * 24;
        trebleFilterRef.current = trebleFilter;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.7;
        analyserRef.current = analyser;
        const gainNode = ctx.createGain();
        gainNode.gain.value = 1;
        gainNodeRef.current = gainNode;
        source.connect(bassFilter);
        bassFilter.connect(trebleFilter);
        trebleFilter.connect(analyser);
        analyser.connect(gainNode);
        gainNode.connect(ctx.destination);
        setAudioGraphReady(true);
      }
    } catch (e) {
      console.warn('Web Audio API not available:', e);
    }
  }, [currentMusic?.id, currentMusic?.audio]);

  useEffect(() => {
    if (bassFilterRef.current) {
      bassFilterRef.current.gain.value = (bass - 0.5) * 24;
    }
    if (trebleFilterRef.current) {
      trebleFilterRef.current.gain.value = (treble - 0.5) * 24;
    }
  }, [bass, treble]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const handleTimeUpdate = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    setCurrentTime(el.currentTime);
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handlePlaying = useCallback(() => {
    setIsPlaying(true);
    pendingAutoplayRef.current = false;
  }, []);

  /* Faqat MusicDetail sahifasida bo'lganda prev/next navigatsiya qilsin – boshqa sahifada mini playerdan bosilsa yo‘naltirmaslik */

  const handleEnded = useCallback(() => {
    const music = currentMusic;
    if (!music) return;

    if (isRepeat) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
      setIsPlaying(true);
    } else {
      const list = playlistRef.current?.length ? playlistRef.current : allMusicData;
      const isAlbumPlaylist = list.length && list[0]?.albumId != null;
      const syncDetail = isAlbumPlaylist ? !playlistRef.current?.length : isOnMusicDetailPage;
      const idx = list.findIndex((m) => m.id === music.id);
      const isLastTrackOfAlbum = isAlbumPlaylist && idx === list.length - 1;

      /* Oxirgi qo'shiq tugaganda keyingi albomga o'tish */
      if (isLastTrackOfAlbum && music.albumId) {
        const currentAlbumIndex = TopAlbums.findIndex((a) => a.id === music.albumId);
        const nextAlbumIndex = currentAlbumIndex >= 0 ? currentAlbumIndex + 1 : 0;
        const nextAlbum = TopAlbums[nextAlbumIndex] ?? TopAlbums[0];
        if (nextAlbum?.songs?.length) {
          const firstSong = nextAlbum.songs[0];
          const track = albumSongToTrack(nextAlbum, firstSong);
          const playlist = nextAlbum.songs.map((s) => albumSongToTrack(nextAlbum, s));
          navigate(`/music/album/${nextAlbum.id}`);
          loadAndPlayTrackByTrack(track, { autoplay: true, playlist });
          return;
        }
      }

      if (isShuffle) {
        const others = list.filter((m) => m.id !== music.id);
        const rand = others[Math.floor(Math.random() * others.length)] || list[0];
        if (isAlbumPlaylist) {
          loadAndPlayTrackByTrack(rand, { autoplay: true, playlist: list });
        } else {
          loadAndPlayTrack(rand.id, { autoplay: true, syncMusicDetail: syncDetail, playlist: playlistRef.current || undefined });
        }
      } else {
        const nextIdx = idx >= list.length - 1 ? 0 : idx + 1;
        const next = list[nextIdx];
        if (isAlbumPlaylist) {
          loadAndPlayTrackByTrack(next, { autoplay: true, playlist: list });
        } else {
          loadAndPlayTrack(next.id, { autoplay: true, syncMusicDetail: syncDetail, playlist: playlistRef.current || undefined });
        }
      }
    }
  }, [currentMusic, isRepeat, isShuffle, loadAndPlayTrack, loadAndPlayTrackByTrack, navigate, isOnMusicDetailPage]);

  const handlePrevTrack = useCallback(() => {
    if (!currentMusic) return;
    const list = playlistRef.current?.length ? playlistRef.current : allMusicData;
    const isAlbumPlaylist = list.length && list[0]?.albumId != null;
    const syncDetail = isAlbumPlaylist ? !playlistRef.current?.length : isOnMusicDetailPage;
    if (isShuffle) {
      const others = list.filter((m) => m.id !== currentMusic.id);
      const rand = others[Math.floor(Math.random() * others.length)] || list[0];
      if (isAlbumPlaylist) {
        loadAndPlayTrackByTrack(rand, { autoplay: isPlaying, playlist: list });
      } else {
        loadAndPlayTrack(rand.id, { autoplay: isPlaying, syncMusicDetail: syncDetail, playlist: playlistRef.current || undefined });
      }
    } else {
      const idx = list.findIndex((m) => m.id === currentMusic.id);
      const prevIdx = idx <= 0 ? list.length - 1 : idx - 1;
      const prev = list[prevIdx];
      if (isAlbumPlaylist) {
        loadAndPlayTrackByTrack(prev, { autoplay: isPlaying, playlist: list });
      } else {
        loadAndPlayTrack(prev.id, { autoplay: isPlaying, syncMusicDetail: syncDetail, playlist: playlistRef.current || undefined });
      }
    }
  }, [currentMusic, isPlaying, isShuffle, loadAndPlayTrack, loadAndPlayTrackByTrack, isOnMusicDetailPage]);

  const handleNextTrack = useCallback(() => {
    if (!currentMusic) return;
    const list = playlistRef.current?.length ? playlistRef.current : allMusicData;
    const isAlbumPlaylist = list.length && list[0]?.albumId != null;
    const syncDetail = isAlbumPlaylist ? !playlistRef.current?.length : isOnMusicDetailPage;
    const idx = list.findIndex((m) => m.id === currentMusic.id);
    const isLastTrackOfAlbum = isAlbumPlaylist && idx === list.length - 1;

    /* Oxirgi qo'shiqda oldinga bossa keyingi albomga o'tish */
    const albumIdForNext = currentMusic?.albumId ?? list[0]?.albumId;
    if (isLastTrackOfAlbum && albumIdForNext) {
      const currentAlbumIndex = TopAlbums.findIndex((a) => a.id === albumIdForNext);
      const nextAlbumIndex = currentAlbumIndex >= 0 ? currentAlbumIndex + 1 : 0;
      const nextAlbum = TopAlbums[nextAlbumIndex] ?? TopAlbums[0];
      if (nextAlbum?.songs?.length) {
        const firstSong = nextAlbum.songs[0];
        const track = albumSongToTrack(nextAlbum, firstSong);
        const playlist = nextAlbum.songs.map((s) => albumSongToTrack(nextAlbum, s));
        navigate(`/music/album/${nextAlbum.id}`);
        loadAndPlayTrackByTrack(track, { autoplay: true, playlist });
        return;
      }
    }

    if (isShuffle) {
      const others = list.filter((m) => m.id !== currentMusic.id);
      const rand = others[Math.floor(Math.random() * others.length)] || list[0];
      if (isAlbumPlaylist) {
        loadAndPlayTrackByTrack(rand, { autoplay: isPlaying, playlist: list });
      } else {
        loadAndPlayTrack(rand.id, { autoplay: isPlaying, syncMusicDetail: syncDetail, playlist: playlistRef.current || undefined });
      }
    } else {
      const nextIdx = idx >= list.length - 1 ? 0 : idx + 1;
      const next = list[nextIdx];
      if (isAlbumPlaylist) {
        loadAndPlayTrackByTrack(next, { autoplay: isPlaying, playlist: list });
      } else {
        loadAndPlayTrack(next.id, { autoplay: isPlaying, syncMusicDetail: syncDetail, playlist: playlistRef.current || undefined });
      }
    }
  }, [currentMusic, isPlaying, isShuffle, loadAndPlayTrack, loadAndPlayTrackByTrack, navigate, isOnMusicDetailPage]);

  const toggleRepeat = useCallback(() => {
    const next = !isRepeat;
    setIsRepeat(next);
    sessionStorage.setItem('musicRepeat', String(next));
  }, [isRepeat]);

  const toggleShuffle = useCallback(() => {
    const next = !isShuffle;
    setIsShuffle(next);
    sessionStorage.setItem('musicShuffle', String(next));
  }, [isShuffle]);

  const handleProgressClick = useCallback((e) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = x * duration;
  }, [duration]);

  const handleVolumeChange = useCallback((e) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    setIsMuted(false);
    if (audioRef.current) {
      audioRef.current.volume = v;
      audioRef.current.muted = false;
    }
  }, []);

  const handleVolumeIconClick = useCallback(() => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.muted = false;
      audioRef.current.volume = prevVolumeRef.current;
      setVolume(prevVolumeRef.current);
      setIsMuted(false);
    } else {
      prevVolumeRef.current = volume;
      audioRef.current.muted = true;
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const showMiniPlayer = (isPlaying || (currentTime > 0 && duration > 0)) && currentMusic;
  const showMiniPlayerUI = showMiniPlayer && !isMiniPlayerForbidden;

  useEffect(() => {
    if (currentMusic) lastMusicRef.current = currentMusic;
  }, [currentMusic]);

  const displayMusicForModal = currentMusic || lastMusicRef.current;

  /* Taqiqlangan sahifalarga kirganda musiqa avtomatik pauza */
  useEffect(() => {
    if (isMiniPlayerForbidden && isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [isMiniPlayerForbidden, isPlaying]);

  useEffect(() => {
    if (showMiniPlayerUI) {
      document.body.classList.add('mini-player-visible');
    } else {
      document.body.classList.remove('mini-player-visible');
    }
    return () => document.body.classList.remove('mini-player-visible');
  }, [showMiniPlayerUI]);

  const handleMiniPlayerRowClick = useCallback(() => {
    if (!currentMusic) return;
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      setPlayerModalOpen(true);
    } else {
      if (currentMusic.albumId) {
        navigate(`/music/album/${currentMusic.albumId}`, { state: { keepModalOpen: false } });
      } else {
        navigate(`/music/${currentMusic.id}${location.search || ''}`, { state: { keepModalOpen: false } });
      }
    }
  }, [currentMusic, location.search, navigate]);

  const handleLyricsClick = useCallback(() => {
    if (!currentMusic) return;
    if (currentMusic.lyricsText && getLyricsText(currentMusic.lyricsText)?.trim()) {
      setLyricsModalOpen(true);
    } else {
      navigate(`/music/${currentMusic.id}${location.search || ''}`, { state: { openLyrics: true } });
    }
  }, [currentMusic, getLyricsText, location.search, navigate]);

  const value = {
    currentMusic,
    artist,
    dominantColor,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isRepeat,
    isShuffle,
    bass,
    treble,
    audioGraphReady,
    audioRef,
    analyserRef,
    bassFilterRef,
    trebleFilterRef,
    getTitle,
    getLyricsText,
    loadTrack,
    loadAndPlayTrack,
    loadTrackByTrack,
    loadAndPlayTrackByTrack,
    seek,
    togglePlay,
    setBass,
    setTreble,
    handleProgressClick,
    handleVolumeChange,
    handleVolumeIconClick,
    handlePrevTrack,
    handleNextTrack,
    toggleRepeat,
    toggleShuffle,
    playerModalOpen,
    setPlayerModalOpen,
    setPlaylistFromPage,
  };

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
      {currentMusic && (
        <>
          <audio
            ref={audioRef}
            src={currentMusic.audio}
            preload="auto"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onLoadedData={handleCanPlay}
            onCanPlay={handleCanPlay}
            onCanPlayThrough={handleCanPlay}
            onPlaying={handlePlaying}
            onEnded={handleEnded}
            onError={() => setIsPlaying(false)}
            style={{ display: 'none' }}
          />
          {showMiniPlayerUI && (
            <MusicMiniPlayer
              music={currentMusic}
              artist={artist}
              dominantColor={dominantColor}
              getTitle={getTitle}
              getLyricsText={getLyricsText}
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              volume={volume}
              isMuted={isMuted}
              isRepeat={isRepeat}
              isShuffle={isShuffle}
              onProgressClick={handleProgressClick}
              onVolumeChange={handleVolumeChange}
              onVolumeIconClick={handleVolumeIconClick}
              onTogglePlay={togglePlay}
              onPrevTrack={handlePrevTrack}
              onNextTrack={handleNextTrack}
              onToggleShuffle={toggleShuffle}
              onToggleRepeat={toggleRepeat}
              onRowClick={isMobileView ? handleMiniPlayerRowClick : undefined}
              onLyricsClick={handleLyricsClick}
            />
          )}
          {lyricsModalOpen && currentMusic?.lyricsText && getLyricsText(currentMusic.lyricsText)?.trim() && (
            <div
              className="music-detail-lyrics-modal-overlay"
              onClick={() => setLyricsModalOpen(false)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Escape' && setLyricsModalOpen(false)}
              aria-label="Lyrics modali"
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
                role="dialog"
                aria-modal="true"
                aria-labelledby="lyrics-modal-title"
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
                  <h3 id="lyrics-modal-title" className="music-detail-lyrics-modal-title">Lyrics</h3>
                </div>
                <div className="music-detail-lyrics-modal-content">
                  {(getLyricsText(currentMusic.lyricsText) || '').split('\n').map((line, i) => (
                    <p key={i} className="music-detail-lyrics-modal-line">{line}</p>
                  ))}
                </div>
              </div>
            </div>
          )}
          {playerModalOpen && displayMusicForModal && !isMiniPlayerForbidden && isMobileView && (
            <MusicPlayerModal
              key="music-player-modal"
              isOpen={playerModalOpen}
              onClose={() => setPlayerModalOpen(false)}
              music={displayMusicForModal}
              artist={artist}
              dominantColor={dominantColor}
              getTitle={getTitle}
              getLyricsText={getLyricsText}
              trendList={allMusicData}
              analyserRef={analyserRef}
              audioGraphReady={audioGraphReady}
              artists={artists}
              onTrackSelect={(item) => loadAndPlayTrack(item.id, { autoplay: true, syncMusicDetail: true })}
              toggleWishlist={toggleWishlist}
              isInWishlist={isInWishlist}
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              volume={volume}
              isMuted={isMuted}
              isRepeat={isRepeat}
              isShuffle={isShuffle}
              bass={bass}
              treble={treble}
              onBassChange={setBass}
              onTrebleChange={setTreble}
              onTogglePlay={togglePlay}
              onPrevTrack={handlePrevTrack}
              onNextTrack={handleNextTrack}
              onToggleRepeat={toggleRepeat}
              onToggleShuffle={toggleShuffle}
              onProgressClick={handleProgressClick}
              onVolumeChange={handleVolumeChange}
              onVolumeIconClick={handleVolumeIconClick}
              onLyricsClick={() => {
                setPlayerModalOpen(false);
                setLyricsModalOpen(true);
              }}
            />
          )}
        </>
      )}
    </MusicPlayerContext.Provider>
  );
};

export const useMusicPlayer = () => {
  const ctx = useContext(MusicPlayerContext);
  if (!ctx) {
    throw new Error('useMusicPlayer must be used within MusicPlayerProvider');
  }
  return ctx;
};

