import React, { useEffect, useRef, useState } from 'react';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';

const VIDEO_READY_TIMEOUT_MS = 20000;

/**
 * Shorts grid/home thumb — skeleton until preview video has real frames
 * (API JSON yetarli emas; .shorts-video-thumb-shield ostida ham loader ko‘rinadi).
 */
const ShortsVideoThumb = ({
  videoSrc = '',
  className = 'shorts-video-thumb',
  still = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
  children,
}) => {
  const videoRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setReady(false);
    setFailed(false);
  }, [videoSrc]);

  useEffect(() => {
    if (!videoSrc || ready || failed) return undefined;

    const check = () => {
      const el = videoRef.current;
      if (el && el.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        setReady(true);
        setFailed(false);
      }
    };

    check();
    const intervalId = window.setInterval(check, 200);
    const timeoutId = window.setTimeout(() => {
      const el = videoRef.current;
      if (el && el.readyState >= HTMLMediaElement.HAVE_METADATA) {
        setReady(true);
      } else {
        setFailed(true);
      }
    }, VIDEO_READY_TIMEOUT_MS);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [videoSrc, ready, failed]);

  const markReady = (e) => {
    const el = e?.currentTarget || videoRef.current;
    if (el && el.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      setReady(true);
      setFailed(false);
    }
  };

  const markFailed = () => {
    setFailed(true);
    setReady(false);
  };

  const holdStillFrame = (el) => {
    if (!still || !el) return;
    el.pause();
    if (el.dataset.stillHeld === '1') {
      setReady(true);
      setFailed(false);
      return;
    }
    const duration = el.duration;
    const target = Number.isFinite(duration) && duration > 0.4
      ? Math.min(0.5, duration * 0.03)
      : 0;
    const finish = () => {
      el.pause();
      el.dataset.stillHeld = '1';
      setReady(true);
      setFailed(false);
    };
    if (target > 0.05 && el.currentTime < 0.05) {
      const onSeeked = () => {
        el.removeEventListener('seeked', onSeeked);
        finish();
      };
      el.addEventListener('seeked', onSeeked);
      try {
        el.currentTime = target;
        return;
      } catch {
        el.removeEventListener('seeked', onSeeked);
      }
    }
    finish();
  };

  const showSkeleton = Boolean(videoSrc) && !ready && !failed;

  return (
    <div
      className={`${className}${showSkeleton ? ' shorts-video-thumb--loading' : ''}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      aria-busy={showSkeleton || undefined}
    >
      {showSkeleton && (
        <SkeletonLoader
          variant="shorts-thumb"
          className="shorts-video-thumb-skeleton"
        />
      )}
      {!failed && videoSrc && (
        <video
          ref={videoRef}
          key={videoSrc}
          src={videoSrc}
          muted
          loop={!still}
          playsInline
          preload="auto"
          className={`shorts-video-preview${showSkeleton ? ' shorts-video-loading' : ''}`}
          onLoadedData={still ? (e) => holdStillFrame(e.currentTarget) : markReady}
          onLoadedMetadata={still ? (e) => holdStillFrame(e.currentTarget) : markReady}
          onCanPlay={still ? (e) => holdStillFrame(e.currentTarget) : markReady}
          onPlay={still ? (e) => e.currentTarget.pause() : undefined}
          onError={markFailed}
        />
      )}
      {children}
    </div>
  );
};

export default ShortsVideoThumb;
