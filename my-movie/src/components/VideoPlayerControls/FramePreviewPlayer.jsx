import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

const absoluteUrl = (src) => {
  if (!src || typeof window === 'undefined') return '';
  try {
    return new URL(src, window.location.href).href;
  } catch {
    return '';
  }
};

/**
 * Kadr uchun alohida video. Asosiy pleyerning vaqtini siljitmaydi
 * va tashqariga seek xabarini chiqarmaydi.
 */
const FramePreviewPlayer = forwardRef(function FramePreviewPlayer({ src }, ref) {
  const videoRef = useRef(null);
  const pendingTimeRef = useRef(null);

  const applyPendingTime = () => {
    const el = videoRef.current;
    const time = pendingTimeRef.current;
    if (!el || time == null || !Number.isFinite(time)) return;
    if (el.readyState < 1) return;
    const duration = el.duration;
    const next = Number.isFinite(duration) && duration > 0
      ? Math.min(Math.max(0, time), Math.max(0, duration - 0.05))
      : Math.max(0, time);
    if (Math.abs((el.currentTime || 0) - next) < 0.05) return;
    el.currentTime = next;
  };

  useImperativeHandle(ref, () => ({
    seek(time) {
      const el = videoRef.current;
      if (!el || !src || !Number.isFinite(time) || time < 0) return;
      pendingTimeRef.current = time;
      el.pause();
      const absolute = absoluteUrl(src);
      const hasSource = Boolean(absolute) && (el.currentSrc === absolute || el.src === absolute);
      if (!hasSource) el.src = src;
      if (el.readyState >= 1 && (el.currentSrc === absolute || el.src === absolute)) {
        applyPendingTime();
        return;
      }
      if (
        el.networkState === HTMLMediaElement.NETWORK_EMPTY
        || el.networkState === HTMLMediaElement.NETWORK_NO_SOURCE
      ) {
        el.load();
      }
    },
    stop() {
      const el = videoRef.current;
      pendingTimeRef.current = null;
      if (!el) return;
      el.pause();
      if (!el.getAttribute('src') && !el.currentSrc) return;
      el.removeAttribute('src');
      el.load();
    },
  }), [src]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return undefined;
    pendingTimeRef.current = null;
    el.pause();
    if (!src) {
      el.removeAttribute('src');
      el.load();
      return undefined;
    }
    const absolute = absoluteUrl(src);
    if (absolute && el.currentSrc !== absolute && el.src !== absolute) {
      el.src = src;
    }
    const onReady = () => applyPendingTime();
    el.addEventListener('loadedmetadata', onReady);
    el.addEventListener('loadeddata', onReady);
    return () => {
      el.removeEventListener('loadedmetadata', onReady);
      el.removeEventListener('loadeddata', onReady);
      pendingTimeRef.current = null;
      el.pause();
      if (el.getAttribute('src') || el.currentSrc) {
        el.removeAttribute('src');
        el.load();
      }
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      className="trailer-modal-frame-preview-video"
      muted
      playsInline
      preload="none"
      aria-hidden="true"
      tabIndex={-1}
    />
  );
});

export default FramePreviewPlayer;
