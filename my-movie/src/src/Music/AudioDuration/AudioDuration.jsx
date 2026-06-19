import React, { useState, useEffect } from 'react';

const formatTime = (sec) => {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const AudioDuration = ({ audioUrl, prefix = '' }) => {
  const [duration, setDuration] = useState(null);

  useEffect(() => {
    if (!audioUrl) return;
    const audio = new Audio(audioUrl);
    const handler = () => {
      setDuration(audio.duration);
    };
    audio.addEventListener('loadedmetadata', handler);
    audio.load();
    return () => {
      audio.removeEventListener('loadedmetadata', handler);
      audio.src = '';
    };
  }, [audioUrl]);

  if (duration == null) return null;
  return (
    <>
      {prefix && <span className="music-detail-trend-card-meta-dot">{prefix}</span>}
      <span className="music-detail-trend-card-duration">{formatTime(duration)}</span>
    </>
  );
};

export default AudioDuration;
