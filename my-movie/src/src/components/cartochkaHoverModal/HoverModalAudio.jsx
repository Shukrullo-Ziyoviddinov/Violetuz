import React, { useRef, useEffect, useState, useCallback } from 'react';
import './HoverModalAudio.css';

/**
 * Hover modal ichida musiqa audio kartochkasi.
 * Layout: img + (title, artist) bir qatorda, keyin progress bar va pause icon.
 */
const HoverModalAudio = ({ item, getArtistText, getTitle }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.play().catch(() => {});
      setIsPlaying(true);
    }
    return () => {
      if (audio) audio.pause();
    };
  }, [item?.id]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onEnded = () => setIsPlaying(false);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, [item?.id]);

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying((p) => !p);
  }, [isPlaying]);

  const handleProgressClick = useCallback((e) => {
    const audio = audioRef.current;
    const bar = e.currentTarget;
    if (!audio || !duration) return;
    const rect = bar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * duration;
  }, [duration]);

  if (!item?.audio) return null;

  const title = typeof getTitle === 'function' ? getTitle(item) : (item.title || '');
  const artist = typeof getArtistText === 'function' ? getArtistText(item) : (item.artist || '');
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="hover-modal-audio">
      <div className="hover-modal-audio-card">
        <div className="hover-modal-audio-row">
          <div className="hover-modal-audio-cover">
            <img
              src={item.img || '/img/movie1.jpg'}
              alt={title}
              className="hover-modal-audio-cover-img"
            />
          </div>
          <div className="hover-modal-audio-info">
            <span className="hover-modal-audio-artist">{artist}</span>
            <span className="hover-modal-audio-title">{title}</span>
          </div>
          <div
            className="hover-modal-audio-progress"
            onClick={handleProgressClick}
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="hover-modal-audio-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <button
            type="button"
            className="hover-modal-audio-btn"
            onClick={togglePlayPause}
            aria-label={isPlaying ? 'Pauza' : 'Ijro'}
          >
            {isPlaying ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21" />
              </svg>
            )}
          </button>
        </div>
      </div>
      <audio
        ref={audioRef}
        src={item.audio}
        autoPlay
        loop
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default HoverModalAudio;
