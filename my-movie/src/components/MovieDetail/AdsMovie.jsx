import React, { forwardRef, useRef, useState, useImperativeHandle, useCallback } from 'react';
import { adsData } from '../../data/adsData';
import './AdsMovie.css';

const AdsMovie = forwardRef(({ videoRef, onVisibilityChange, onAdEnded }, ref) => {
  const adVideoRef = useRef(null);
  const [showAdOverlay, setShowAdOverlay] = useState(false);

  const activeAd = adsData.find((ad) => ad.isActive) || adsData[0];

  const showAd = useCallback(() => {
    if (!activeAd || !activeAd.isActive) return;
    if (videoRef?.current) {
      videoRef.current.pause();
    }
    setShowAdOverlay(true);
    onVisibilityChange?.(true);
    setTimeout(() => {
      if (adVideoRef.current) {
        adVideoRef.current.currentTime = 0;
        adVideoRef.current.play().catch(() => {});
      }
    }, 100);
  }, [activeAd, videoRef, onVisibilityChange]);

  const handleAdEnded = useCallback(() => {
    setShowAdOverlay(false);
    onVisibilityChange?.(false);
    if (adVideoRef.current) {
      adVideoRef.current.pause();
      adVideoRef.current.currentTime = 0;
    }
    if (videoRef?.current) {
      videoRef.current.play().catch(() => {});
    }
    onAdEnded?.();
  }, [videoRef, onVisibilityChange, onAdEnded]);

  useImperativeHandle(ref, () => ({ showAd }));

  if (!showAdOverlay || !activeAd) return null;

  return (
    <div className="ads-movie-overlay show">
      <video
        ref={adVideoRef}
        src={activeAd.videoUrl}
        className="ads-movie-video"
        playsInline
        onEnded={handleAdEnded}
      />
    </div>
  );
});

AdsMovie.displayName = 'AdsMovie';

export default AdsMovie;
