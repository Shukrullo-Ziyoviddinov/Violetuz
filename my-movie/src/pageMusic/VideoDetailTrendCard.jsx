import React, { useState, useEffect } from 'react';
import { getDominantColor } from '../utils/dominantColor';
import VideoDuration from '../Music/VideoDuration/VideoDuration';
import './VideoPage.css';

const VideoDetailTrendCard = ({ item, isActive, onClick, getArtistName }) => {
  const [dominantColor, setDominantColor] = useState(null);

  useEffect(() => {
    if (!item?.img) {
      setDominantColor(null);
      return;
    }
    const imgSrc = item.img.startsWith('http')
      ? item.img
      : window.location.origin + (item.img.startsWith('/') ? item.img : '/' + item.img);
    let cancelled = false;
    getDominantColor(imgSrc).then((color) => {
      if (!cancelled && color) setDominantColor(color);
    });
    return () => { cancelled = true; };
  }, [item?.img]);

  const color = isActive && dominantColor && typeof dominantColor.r === 'number'
    ? { r: dominantColor.r, g: dominantColor.g, b: dominantColor.b }
    : isActive
      ? { r: 192, g: 78, b: 221 }
      : null;
  const cardStyle = isActive && color
    ? {
        background: `rgba(${color.r}, ${color.g}, ${color.b}, 0.25)`,
        border: `1px solid rgba(${color.r}, ${color.g}, ${color.b}, 0.5)`,
      }
    : undefined;

  return (
    <div
      className={`video-detail-trend-card ${isActive ? 'video-detail-trend-card-active' : ''}`}
      onClick={onClick}
      style={cardStyle}
    >
      <div className="video-detail-trend-card-img-wrap">
        <img
          src={item.img || '/img/movie1.jpg'}
          alt={item.title}
          className="video-detail-trend-card-img"
        />
        <div className="video-detail-trend-card-duration">
          <VideoDuration videoUrl={item.video} />
        </div>
      </div>
      <div className="video-detail-trend-card-info">
        <span className="video-detail-trend-card-title">{item.title}</span>
        <span className="video-detail-trend-card-artist">{getArtistName(item.artistId)}</span>
        {item.year && (
          <span className="video-detail-trend-card-year">{item.year}</span>
        )}
      </div>
    </div>
  );
};

export default VideoDetailTrendCard;
