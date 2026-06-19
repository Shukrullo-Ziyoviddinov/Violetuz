import React, { useRef, useState, useCallback, useEffect } from 'react';
import './VertikalDrag.css';

const SWIPE_THRESHOLD = 50;

const VertikalDrag = ({ children, onSwipeUp, onSwipeDown, className = '' }) => {
  const touchStartY = useRef(null);
  const currentDiff = useRef(0);
  const containerRef = useRef(null);
  const [translateY, setTranslateY] = useState(0);

  const handleTouchStart = useCallback((e) => {
    touchStartY.current = e.touches[0].clientY;
    currentDiff.current = 0;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (touchStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    currentDiff.current = diff;
    setTranslateY(diff);
    if (Math.abs(diff) > 10 && e.cancelable) e.preventDefault();
  }, []);

  const handleTouchEnd = useCallback(() => {
    const diff = currentDiff.current;
    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      if (diff > 0) {
        onSwipeDown?.();
      } else {
        onSwipeUp?.();
      }
    }
    setTranslateY(0);
    touchStartY.current = null;
  }, [onSwipeUp, onSwipeDown]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => el.removeEventListener('touchmove', handleTouchMove);
  }, [handleTouchMove]);

  return (
    <div
      ref={containerRef}
      className={`vertikal-drag ${className}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ transform: `translateY(${translateY}px)` }}
    >
      {children}
    </div>
  );
};

export default VertikalDrag;
