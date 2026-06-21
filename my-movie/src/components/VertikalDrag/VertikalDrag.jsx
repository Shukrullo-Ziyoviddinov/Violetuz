import React, { useRef, useState, useCallback, useEffect } from 'react';
import './VertikalDrag.css';

const SWIPE_THRESHOLD_RATIO = 0.4;
const VELOCITY_THRESHOLD = 0.45;
const TRANSITION_MS = 250;

const VertikalDrag = ({
  items,
  activeIndex,
  onIndexChange,
  renderItem,
  className = '',
}) => {
  const containerRef = useRef(null);
  const wrapperHeightRef = useRef(0);
  const activeIndexRef = useRef(activeIndex);
  const commitTimeoutRef = useRef(null);

  const [containerHeight, setContainerHeight] = useState(0);
  const [displayIndex, setDisplayIndex] = useState(activeIndex);

  const touchStartY = useRef(null);
  const lastY = useRef(0);
  const lastTime = useRef(0);
  const velocity = useRef(0);
  const isDragging = useRef(false);
  const dragYRef = useRef(0);

  const [dragY, setDragY] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  activeIndexRef.current = activeIndex;

  useEffect(() => {
    if (!isAnimating && !isDragging.current) {
      setDisplayIndex(activeIndex);
    }
  }, [activeIndex, isAnimating]);

  useEffect(() => {
    const updateHeight = () => {
      if (!containerRef.current) return;
      const h = containerRef.current.clientHeight;
      wrapperHeightRef.current = h;
      setContainerHeight(h);
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  useEffect(() => () => {
    if (commitTimeoutRef.current) clearTimeout(commitTimeoutRef.current);
  }, []);

  const hasPrev = displayIndex > 0;
  const hasNext = displayIndex < items.length - 1;

  const resetDrag = useCallback(() => {
    touchStartY.current = null;
    isDragging.current = false;
    dragYRef.current = 0;
    velocity.current = 0;
  }, []);

  const handleTouchStart = useCallback((e) => {
    if (isAnimating) return;

    if (commitTimeoutRef.current) {
      clearTimeout(commitTimeoutRef.current);
      commitTimeoutRef.current = null;
    }

    touchStartY.current = e.touches[0].clientY;
    lastY.current = touchStartY.current;
    lastTime.current = performance.now();
    velocity.current = 0;
    isDragging.current = true;
  }, [isAnimating]);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging.current || touchStartY.current === null) return;

    const currentY = e.touches[0].clientY;
    const now = performance.now();

    let diff = currentY - touchStartY.current;

    if (diff < 0 && !hasNext) {
      diff = diff * 0.3;
    } else if (diff > 0 && !hasPrev) {
      diff = diff * 0.3;
    }

    const dt = now - lastTime.current;
    if (dt > 0) {
      velocity.current = (currentY - lastY.current) / dt;
    }
    lastY.current = currentY;
    lastTime.current = now;

    dragYRef.current = diff;
    setDragY(diff);

    if (Math.abs(diff) > 5 && e.cancelable) {
      e.preventDefault();
    }
  }, [hasNext, hasPrev]);

  const finishDrag = useCallback((finalDiff, finalVelocity) => {
    const height = wrapperHeightRef.current || 1;
    const ratio = Math.abs(finalDiff) / height;

    const passedDistance = ratio >= SWIPE_THRESHOLD_RATIO;
    const isFastFlickUp = finalVelocity < -VELOCITY_THRESHOLD;
    const isFastFlickDown = finalVelocity > VELOCITY_THRESHOLD;

    let direction = 0;
    if (finalDiff < 0 && hasNext && (passedDistance || isFastFlickUp)) {
      direction = -1;
    } else if (finalDiff > 0 && hasPrev && (passedDistance || isFastFlickDown)) {
      direction = 1;
    }

    if (direction === 0) {
      setIsAnimating(true);
      dragYRef.current = 0;
      setDragY(0);
      commitTimeoutRef.current = window.setTimeout(() => {
        setIsAnimating(false);
        resetDrag();
      }, TRANSITION_MS);
      return;
    }

    const newIndex = activeIndexRef.current - direction;

    setIsAnimating(true);
    dragYRef.current = direction === -1 ? -height : height;
    setDragY(direction === -1 ? -height : height);

    commitTimeoutRef.current = window.setTimeout(() => {
      setIsAnimating(false);
      dragYRef.current = 0;
      setDragY(0);
      setDisplayIndex(newIndex);
      onIndexChange(newIndex);
      resetDrag();
    }, TRANSITION_MS);
  }, [hasNext, hasPrev, onIndexChange, resetDrag]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current) return;

    const finalDiff = dragYRef.current;
    const finalVelocity = velocity.current;
    isDragging.current = false;
    touchStartY.current = null;

    finishDrag(finalDiff, finalVelocity);
  }, [finishDrag]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => el.removeEventListener('touchmove', handleTouchMove);
  }, [handleTouchMove]);

  const height = containerHeight || wrapperHeightRef.current;

  const slideOffsets = [-1, 0, 1];

  return (
    <div
      ref={containerRef}
      className={`vertikal-drag-container ${className}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div
        className="vertikal-drag-track"
        style={{
          transform: `translateY(${dragY}px)`,
          transition: isAnimating ? `transform ${TRANSITION_MS}ms cubic-bezier(0.22, 0.61, 0.36, 1)` : 'none',
        }}
      >
        {slideOffsets.map((offset) => {
          const idx = displayIndex + offset;
          if (idx < 0 || idx >= items.length) return null;
          const item = items[idx];
          return (
            <div
              key={item.id}
              className={`vertikal-drag-slide ${offset === 0 ? 'vertikal-drag-slide-active' : ''}`}
              style={{ transform: `translateY(${offset * height}px)` }}
            >
              {renderItem(item, idx, { isCenter: offset === 0 })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VertikalDrag;
