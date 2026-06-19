import React, { useEffect, useRef } from 'react';
import './ComentariaShortCard.css';

/**
 * Faqat shu short fayliga tegishli bitta kadr (harakatlanmas) — ijro yo'q,
 * Shorts sahifasidagi kabi "feed" effekti bo'lmaydi.
 */
const ComentariaShortCard = ({ title, image, videoSrc, onClick }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;

    let seekDone = false;

    const snapFrame = () => {
      if (seekDone) return;
      try {
        const d = video.duration;
        const t = d && Number.isFinite(d) && d > 0 ? Math.min(0.15, Math.max(0.04, d * 0.02)) : 0.08;
        video.currentTime = t;
      } catch {
        seekDone = true;
      }
    };

    const onSeeked = () => {
      video.pause();
      seekDone = true;
    };

    video.addEventListener('loadeddata', snapFrame);
    video.addEventListener('seeked', onSeeked);
    if (video.readyState >= 2) snapFrame();

    return () => {
      video.removeEventListener('loadeddata', snapFrame);
      video.removeEventListener('seeked', onSeeked);
      video.pause();
    };
  }, [videoSrc]);

  return (
    <button type="button" className="comentaria-short-card" onClick={onClick} aria-label={title}>
      <div className="comentaria-short-card-img-wrap">
        {videoSrc ? (
          <video
            ref={videoRef}
            className="comentaria-short-card-video"
            src={videoSrc}
            muted
            playsInline
            preload="metadata"
            disablePictureInPicture
            tabIndex={-1}
            aria-hidden="true"
          />
        ) : (
          <img src={image || '/img/movie1.jpg'} alt="" className="comentaria-short-card-img" loading="lazy" />
        )}
      </div>
    </button>
  );
};

export default ComentariaShortCard;
