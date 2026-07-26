import React, { useState, useEffect } from 'react';
import { getDominantColor } from '../utils/dominantColor';
import VideoDuration from '../Music/VideoDuration/VideoDuration';
import SkeletonLoader from '../components/SkeletonLoader/SkeletonLoader';
import { useImageReady } from '../utils/useImageReady';
import './VideoPage.css';

const VideoDetailTrendCard = ({ item, isActive, onClick, getArtistName }) => {
  const [dominantColor, setDominantColor] = useState(null);
  const imgSrc = item?.img || '/img/movie1.jpg';
  const { showSkeleton: showImgSkeleton, imgRef, onLoad, onError } = useImageReady(imgSrc);

  useEffect(() => {
    if (!item?.img || showImgSkeleton) {
      setDominantColor(null);
      return;
    }
    const fullSrc = item.img.startsWith('http')
      ? item.img
      : window.location.origin + (item.img.startsWith('/') ? item.img : '/' + item.img);
    let cancelled = false;
    getDominantColor(fullSrc).then((color) => {
      if (!cancelled && color) setDominantColor(color);
    });
    return () => {
      cancelled = true;
    };
  }, [item?.img, showImgSkeleton]);

  const color =
    isActive && dominantColor && typeof dominantColor.r === 'number'
      ? { r: dominantColor.r, g: dominantColor.g, b: dominantColor.b }
      : isActive
        ? { r: 192, g: 78, b: 221 }
        : null;
  const cardStyle =
    isActive && color
      ? {
          background: `rgba(${color.r}, ${color.g}, ${color.b}, 0.25)`,
          border: `1px solid rgba(${color.r}, ${color.g}, ${color.b}, 0.5)`,
        }
      : undefined;

  return (
    <div
      className={`video-detail-trend-card${isActive ? ' video-detail-trend-card-active' : ''}${
        showImgSkeleton ? ' video-detail-trend-card--loading' : ''
      }`}
      onClick={() => !showImgSkeleton && onClick?.()}
      style={cardStyle}
      aria-busy={showImgSkeleton || undefined}
    >
      <div className="video-detail-trend-card-img-wrap">
        {showImgSkeleton && (
          <SkeletonLoader
            variant="video-detail-trend-img"
            className="video-detail-trend-card-img-skeleton"
          />
        )}
        {imgSrc && (
          <img
            ref={imgRef}
            src={imgSrc}
            alt={item.title}
            className={`video-detail-trend-card-img${
              showImgSkeleton ? ' video-detail-trend-card-img--loading' : ''
            }`}
            onLoad={onLoad}
            onError={onError}
          />
        )}
        {!showImgSkeleton && (
          <div className="video-detail-trend-card-duration">
            <VideoDuration videoUrl={item.video} />
          </div>
        )}
      </div>
      <div className="video-detail-trend-card-info">
        {showImgSkeleton ? (
          <>
            <SkeletonLoader variant="video-detail-trend-card-title" />
            <SkeletonLoader variant="video-detail-trend-card-artist" />
            <SkeletonLoader variant="video-detail-trend-card-year" />
          </>
        ) : (
          <>
            <span className="video-detail-trend-card-title">{item.title}</span>
            <span className="video-detail-trend-card-artist">{getArtistName(item.artistId)}</span>
            {item.year && (
              <span className="video-detail-trend-card-year">{item.year}</span>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default VideoDetailTrendCard;
