import React, { useState, useEffect } from 'react';

const formatTime = (sec) => {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const VideoDuration = ({ videoUrl, className = '' }) => {
  const [duration, setDuration] = useState(null);

  useEffect(() => {
    if (!videoUrl) return;
    const video = document.createElement('video');
    const handler = () => {
      setDuration(video.duration);
    };
    video.addEventListener('loadedmetadata', handler);
    video.src = videoUrl;
    video.load();
    return () => {
      video.removeEventListener('loadedmetadata', handler);
      video.src = '';
    };
  }, [videoUrl]);

  if (duration == null) return null;
  return (
    <span className={className}>
      {formatTime(duration)}
    </span>
  );
};

export default VideoDuration;
