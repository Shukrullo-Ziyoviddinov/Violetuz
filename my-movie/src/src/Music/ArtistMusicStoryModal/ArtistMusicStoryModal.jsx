import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDominantColor } from '../../utils/dominantColor';
import { VisualImgLeftRight } from '../Visual';
import './ArtistMusicStoryModal.css';

const ArtistMusicStoryModal = ({ stories = [], story, onClose, onStoryChange }) => {
  const navigate = useNavigate();
  const audioRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [dominantColor, setDominantColor] = useState(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef(null);
  const dragOffsetRef = useRef(0);
  dragOffsetRef.current = dragOffset;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev || '';
    };
  }, []);

  useEffect(() => {
    if (!story?.img) {
      setDominantColor(null);
      return;
    }
    getDominantColor(story.img).then((color) => setDominantColor(color));
  }, [story?.img]);

  const formatTime = (sec) => {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const currentIndex = stories.findIndex((s) => s.id === story?.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < stories.length - 1;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !story?.audio) return;

    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(true);

    const handleTimeUpdate = () => {
      const pct = audio.duration > 0 ? (audio.currentTime / audio.duration) * 100 : 0;
      setProgress(pct);
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setProgress(100);
      setCurrentTime(audio.duration);
      setIsPlaying(false);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    if (audio.duration && !isNaN(audio.duration)) setDuration(audio.duration);
    audio.play().catch(() => {});

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [story?.id, story?.audio]);

  const handlePrev = () => {
    if (hasPrev) onStoryChange(stories[currentIndex - 1]);
  };

  const handleNext = () => {
    if (hasNext) onStoryChange(stories[currentIndex + 1]);
    else if (stories.length > 0) onStoryChange(stories[0]);
  };

  const handleTogglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  };

  const handleTitleClick = () => {
    if (story?.artistMusicId != null) {
      navigate(`/music/${story.artistMusicId}`);
      onClose();
    }
  };

  useEffect(() => {
    const onMove = (e) => {
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const start = dragStartRef.current;
      if (!start) return;
      const dy = clientY - start.y;
      const newOffset = Math.max(0, start.startOffset + dy);
      setDragOffset(newOffset);
    };
    const onUp = () => {
      dragStartRef.current = null;
      setIsDragging(false);
      const offset = dragOffsetRef.current;
      if (offset > 100) {
        onClose();
        setDragOffset(0);
      } else {
        setDragOffset(0);
      }
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('touchend', onUp);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    };
  }, [onClose]);

  const handleDragStart = (e) => {
    if (window.innerWidth > 500) return;
    dragStartRef.current = { y: e.clientY, startOffset: dragOffset };
    setIsDragging(true);
  };

  return (
    <div
      className="artist-music-story-modal-overlay"
      onClick={onClose}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      aria-label="Modalni yopish"
    >
      <div
        className={`artist-music-story-modal${dominantColor ? ' artist-music-story-modal--has-color' : ''}${isDragging ? ' artist-music-story-modal--dragging' : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="artist-music-story-modal-title"
        style={{
          ...(dominantColor ? {
            '--modal-r': dominantColor.r,
            '--modal-g': dominantColor.g,
            '--modal-b': dominantColor.b,
          } : {}),
          ...(dragOffset > 0 ? { transform: `translateY(${dragOffset}px)` } : {}),
        }}
      >
        <div
          className="artist-music-story-modal-handle"
          onPointerDown={handleDragStart}
          aria-hidden="true"
        >
          <span className="artist-music-story-modal-handle-bar" />
        </div>

        <button
          type="button"
          className="artist-music-story-modal-close"
          onClick={onClose}
          aria-label="Yopish"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>

        <div className="artist-music-story-modal-img-wrap">
          <VisualImgLeftRight audioRef={audioRef} isPlaying={isPlaying}>
            <img
              src={story?.img || '/img/movie1.jpg'}
              alt={story?.title}
              className="artist-music-story-modal-img"
            />
          </VisualImgLeftRight>
        </div>

        <div className="artist-music-story-modal-progress-wrap">
          <span className="artist-music-story-modal-time artist-music-story-modal-time-current">
            {formatTime(currentTime)}
          </span>
          <div className="artist-music-story-modal-progress">
            <div
              className="artist-music-story-modal-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="artist-music-story-modal-time artist-music-story-modal-time-duration">
            {formatTime(duration)}
          </span>
        </div>

        <div className="artist-music-story-modal-controls">
          <button
            type="button"
            className="artist-music-story-modal-btn artist-music-story-modal-btn-prev"
            onClick={handlePrev}
            disabled={!hasPrev}
            aria-label="Oldingi"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>
          <button
            type="button"
            className="artist-music-story-modal-btn artist-music-story-modal-btn-play"
            onClick={handleTogglePlay}
            aria-label={isPlaying ? 'Pauza' : 'Ijro etish'}
          >
            {isPlaying ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21" />
              </svg>
            )}
          </button>
          <button
            type="button"
            className="artist-music-story-modal-btn artist-music-story-modal-btn-next"
            onClick={handleNext}
            aria-label="Keyingi"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
        </div>

        <div className="artist-music-story-modal-title-wrap">
          <button
            type="button"
            className="artist-music-story-modal-title"
            id="artist-music-story-modal-title"
            onClick={handleTitleClick}
          >
            {story?.title}
          </button>
          <button
            type="button"
            className="artist-music-story-modal-music-btn"
            onClick={handleTitleClick}
            aria-label="Musiqaga o'tish"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z" />
            </svg>
          </button>
        </div>

        <audio ref={audioRef} src={story?.audio} preload="auto" />
      </div>
    </div>
  );
};

export default ArtistMusicStoryModal;
