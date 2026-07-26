import React, { useRef, useState, useEffect, useCallback } from 'react';
import './HorizontalScroll.css';

// Carousel drag: foizga yetmasa → joyiga qaytadi; yetganda / tezlikka qarab → silliq scroll
const DRAG_THRESHOLD_PERCENT = 0.4;
const VELOCITY_THRESHOLD = 0.22; // px/ms — sekin swipe ham hisobga olinsin
const CLICK_THRESHOLD = 8;
const FLING_MS = 340;
const VELOCITY_STALE_MS = 72;
const EDGE_RESISTANCE = 0.35;
const FRICTION = 0.0032; // inertia sekinlashishi (1/ms)
const MIN_GLIDE_VELOCITY = 0.02; // px/ms

const HorizontalScroll = ({ children, scrollAmount = 400, alwaysShowButtons = false, scrollToIndexRef, onScrollIndexChange }) => {
  const wrapperRef = useRef(null);
  const trackRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const justFinishedDrag = useRef(false);
  const animTimerRef = useRef(null);
  const rafRef = useRef(null);

  const translateX = useRef(0);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const dragStartTranslate = useRef(0);
  const lastPointX = useRef(0);
  const lastMoveTime = useRef(0);
  const velocityX = useRef(0);
  const isHorizontalDrag = useRef(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => () => {
    if (animTimerRef.current) clearTimeout(animTimerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const getMaxScroll = () => {
    if (!trackRef.current || !wrapperRef.current) return 0;
    return Math.max(0, trackRef.current.scrollWidth - wrapperRef.current.clientWidth);
  };

  const applyTransform = (value) => {
    if (!trackRef.current) return;
    // Subpixel qaltirashni oldini olish (DPR bo‘yicha yaxlitlash)
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const rounded = Math.round(value * dpr) / dpr;
    translateX.current = rounded;
    trackRef.current.style.transform = `translate3d(${rounded}px, 0, 0)`;
  };

  /** Drag: 1:1 kuzatish (kechikishsiz) + chegarada yumshoq qarshilik */
  const applyDragTranslate = (value) => {
    if (!trackRef.current || !wrapperRef.current) return;
    const maxScroll = getMaxScroll();
    let next = value;
    if (next > 0) {
      next = next * EDGE_RESISTANCE;
    } else if (next < -maxScroll) {
      const overflow = next + maxScroll;
      next = -maxScroll + overflow * EDGE_RESISTANCE;
    }
    applyTransform(next);
  };

  const updateTranslate = (value) => {
    if (!trackRef.current || !wrapperRef.current) return;
    const maxScroll = getMaxScroll();
    applyTransform(Math.max(-maxScroll, Math.min(0, value)));
  };

  const getItemWidth = () => {
    if (!trackRef.current?.children?.[0]) return scrollAmount;
    const first = trackRef.current.children[0];
    const style = window.getComputedStyle(trackRef.current);
    const gap = parseFloat(style.gap) || 12;
    return first.offsetWidth + gap;
  };

  const getMaxIndex = () => {
    const itemWidth = getItemWidth();
    const maxScroll = getMaxScroll();
    if (itemWidth <= 0 || maxScroll <= 0) return 0;
    // Kam kartochkada floor(maxScroll/itemWidth)=0 bo‘lib, index 0 ham oxirga yopishib qolardi
    return Math.max(1, Math.ceil(maxScroll / itemWidth));
  };

  const snapToItemBoundary = (value) => {
    const itemWidth = getItemWidth();
    if (itemWidth <= 0) return 0;
    const maxScroll = getMaxScroll();
    if (maxScroll <= 0) return 0;

    // Oxirgi yarim kartochka ichida — to‘liq oxir (oxirgi element kesilmasin)
    if (-value >= maxScroll - itemWidth * 0.5) {
      return -maxScroll;
    }

    const index = Math.max(0, Math.round(-value / itemWidth));
    if (index === 0) return 0;

    const pos = -index * itemWidth;
    // Qolgan masofa yarim itemdan kam bo‘lsa ham oxirga yopish
    if (pos <= -maxScroll || maxScroll + pos < itemWidth * 0.5) {
      return -maxScroll;
    }
    return pos;
  };

  const indexFromTranslate = (value) => {
    const itemWidth = getItemWidth();
    if (itemWidth <= 0) return 0;
    const maxScroll = getMaxScroll();
    if (maxScroll <= 0) return 0;
    const maxIndex = getMaxIndex();
    if (-value >= maxScroll - itemWidth * 0.5) return maxIndex;
    return Math.max(0, Math.min(Math.round(-value / itemWidth), maxIndex));
  };

  const translateFromIndex = (index) => {
    const itemWidth = getItemWidth();
    const maxScroll = getMaxScroll();
    if (maxScroll <= 0 || itemWidth <= 0) return 0;
    const maxIndex = getMaxIndex();
    const clamped = Math.max(0, Math.min(index, maxIndex));
    if (clamped === 0) return 0;
    if (clamped >= maxIndex) return -maxScroll;
    const pos = -clamped * itemWidth;
    // Oraliq index ham oxirga juda yaqin bo‘lsa — to‘liq oxir
    if (maxScroll + pos < itemWidth * 0.5) return -maxScroll;
    return pos;
  };

  const getCurrentIndex = () => indexFromTranslate(translateX.current);

  const notifyIndexChange = () => {
    if (onScrollIndexChange) onScrollIndexChange(getCurrentIndex());
  };

  const checkScrollability = () => {
    if (!wrapperRef.current || !trackRef.current) return;
    const maxScroll = getMaxScroll();
    const tx = translateX.current;
    setCanScrollLeft(tx < -1);
    setCanScrollRight(tx > -maxScroll + 1);
  };

  const setMotionClass = (on) => {
    wrapperRef.current?.classList.toggle('horizontal-scroll-motion', on);
  };

  const cancelMotion = () => {
    if (animTimerRef.current) {
      clearTimeout(animTimerRef.current);
      animTimerRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const syncTranslateFromDOM = () => {
    if (!trackRef.current) return;
    const style = getComputedStyle(trackRef.current);
    if (style.transform && style.transform !== 'none') {
      const matrix = new DOMMatrixReadOnly(style.transform);
      translateX.current = matrix.m41;
    }
    trackRef.current.style.transition = 'none';
    applyTransform(translateX.current);
    void trackRef.current.offsetHeight;
  };

  useEffect(() => {
    const runCheck = () => {
      checkScrollability();
      notifyIndexChange();
    };
    runCheck();
    const t = setTimeout(runCheck, 100);
    const wrapper = wrapperRef.current;
    const track = trackRef.current;
    if (wrapper && track) {
      const ro = new ResizeObserver(runCheck);
      ro.observe(wrapper);
      return () => {
        clearTimeout(t);
        ro.disconnect();
      };
    }
    return () => clearTimeout(t);
  }, [children]);

  const animateTo = useCallback((target, preferredDuration) => {
    if (!wrapperRef.current || !trackRef.current) return;
    cancelMotion();

    const snapped = snapToItemBoundary(target);
    const distance = Math.abs(snapped - translateX.current);
    if (distance < 0.5) {
      updateTranslate(snapped);
      setMotionClass(false);
      checkScrollability();
      notifyIndexChange();
      return;
    }

    setMotionClass(true);
    // Sekin masofa — yumshoqroq ease; katta masofa — tezlikka mos
    const duration = preferredDuration ?? Math.min(520, Math.max(220, 180 + distance * 0.42));
    trackRef.current.style.transition = `transform ${duration}ms cubic-bezier(0.22, 0.82, 0.24, 1)`;
    updateTranslate(snapped);

    animTimerRef.current = setTimeout(() => {
      if (trackRef.current) trackRef.current.style.transition = '';
      setMotionClass(false);
      checkScrollability();
      notifyIndexChange();
      animTimerRef.current = null;
    }, duration);
  }, []);

  /** Native scrolldek: tezlik bilan sirg‘anish, keyin snap */
  const glideWithVelocity = (initialVelocity, finalTarget) => {
    cancelMotion();
    if (trackRef.current) trackRef.current.style.transition = 'none';
    setMotionClass(true);

    let v = initialVelocity;
    let last = performance.now();
    const maxScroll = getMaxScroll();

    const settle = () => {
      const distance = Math.abs(finalTarget - translateX.current);
      // Tezlik qolgan bo‘lsa — biroz tezroq settle; sekin bo‘lsa — yumshoq
      const boost = Math.min(120, Math.abs(v) * 180);
      const duration = Math.min(480, Math.max(200, distance * 0.48 + 160 - boost));
      animateTo(finalTarget, duration);
    };

    if (Math.abs(v) < MIN_GLIDE_VELOCITY) {
      settle();
      return;
    }

    const tick = (now) => {
      const dt = Math.min(34, now - last);
      last = now;

      v *= Math.exp(-FRICTION * dt);
      const next = translateX.current - v * dt;
      const clamped = Math.max(-maxScroll, Math.min(0, next));
      applyTransform(clamped);

      // Chegaraga urilsa yoki tezlik o‘chsa → snap
      const hitEdge = clamped !== next;
      if (hitEdge || Math.abs(v) < MIN_GLIDE_VELOCITY) {
        rafRef.current = null;
        settle();
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  };

  const handleScroll = (direction, e) => {
    e.preventDefault();
    e.stopPropagation();
    const currentIndex = getCurrentIndex();
    const nextIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    animateTo(translateFromIndex(nextIndex));
  };

  const recordMoveVelocity = (clientX) => {
    const now = performance.now();
    const dt = now - lastMoveTime.current;
    if (dt > 0 && dt < 120) {
      const instant = (lastPointX.current - clientX) / dt;
      // Sekin harakatda ham tezlikni yo‘qotmaslik — biroz ko‘proq instant
      velocityX.current = velocityX.current * 0.45 + instant * 0.55;
    }
    lastMoveTime.current = now;
    lastPointX.current = clientX;
  };

  const resolveTargetIndex = (velocity, delta) => {
    const itemWidth = getItemWidth();
    const maxIndex = getMaxIndex();
    const startIndex = indexFromTranslate(dragStartTranslate.current);

    const flingPx = velocity * FLING_MS;
    const projected = translateX.current - flingPx;
    let targetIndex = indexFromTranslate(snapToItemBoundary(projected));

    const direction =
      Math.sign(delta) ||
      Math.sign(velocity) ||
      (projected < dragStartTranslate.current ? 1 : -1);

    if (direction > 0 && targetIndex <= startIndex) {
      targetIndex = startIndex + 1;
    } else if (direction < 0 && targetIndex >= startIndex) {
      targetIndex = startIndex - 1;
    }

    const dragItems = Math.abs(delta) / Math.max(itemWidth, 1);
    const flingItems = Math.abs(flingPx) / Math.max(itemWidth, 1);
    const maxSteps = Math.max(1, Math.min(maxIndex, Math.ceil(dragItems + flingItems)));
    if (direction > 0) {
      targetIndex = Math.min(targetIndex, startIndex + maxSteps, maxIndex);
    } else {
      targetIndex = Math.max(targetIndex, startIndex - maxSteps, 0);
    }

    return targetIndex;
  };

  const finishDrag = () => {
    const maxScroll = getMaxScroll();
    if (translateX.current > 0 || translateX.current < -maxScroll) {
      updateTranslate(translateX.current);
    }

    const now = performance.now();
    const delta = dragStartX.current - lastPointX.current;
    justFinishedDrag.current = Math.abs(delta) > CLICK_THRESHOLD;

    let velocity = velocityX.current;
    if (now - lastMoveTime.current > VELOCITY_STALE_MS) {
      velocity = 0;
    }

    const itemWidth = getItemWidth();
    const thresholdDistance = itemWidth * DRAG_THRESHOLD_PERCENT;
    const absVelocity = Math.abs(velocity);
    const isFastDrag = absVelocity > VELOCITY_THRESHOLD;
    const passedThreshold = Math.abs(delta) > thresholdDistance;
    const startIndex = indexFromTranslate(dragStartTranslate.current);

    // Foizga yetmasa va sekin → silkinib joyiga qaytadi (saqlanadi)
    if (!passedThreshold && !isFastDrag) {
      const distance = Math.abs(translateFromIndex(startIndex) - translateX.current);
      animateTo(translateFromIndex(startIndex), Math.min(360, Math.max(200, 160 + distance * 0.55)));
      setTimeout(() => { justFinishedDrag.current = false; }, 150);
      return;
    }

    const targetTranslate = translateFromIndex(resolveTargetIndex(velocity, delta));

    // Sekin yoki tez — tezlikka qarab silliq glide, keyin snap
    glideWithVelocity(velocity, targetTranslate);
    setTimeout(() => { justFinishedDrag.current = false; }, 150);
  };

  const beginDrag = (clientX, clientY) => {
    cancelMotion();
    syncTranslateFromDOM();
    setMotionClass(true);
    isDraggingRef.current = true;
    dragStartX.current = clientX;
    dragStartY.current = clientY;
    dragStartTranslate.current = translateX.current;
    lastPointX.current = clientX;
    lastMoveTime.current = performance.now();
    velocityX.current = 0;
    setIsDragging(true);
  };

  const moveDrag = (clientX) => {
    if (!isDraggingRef.current) return;
    recordMoveVelocity(clientX);
    const delta = dragStartX.current - clientX;
    applyDragTranslate(dragStartTranslate.current - delta);
  };

  const handleMouseDown = (e) => {
    if (isMobile) return;
    if (e.button !== 0) return;
    e.preventDefault();
    beginDrag(e.clientX, e.clientY);
  };

  const handleMouseMove = (e) => {
    moveDrag(e.clientX);
  };

  const handleMouseUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    finishDrag();
  };

  useEffect(() => {
    if (!isDragging || isMobile) return undefined;
    const onMove = (e) => handleMouseMove(e);
    const onUp = () => handleMouseUp();
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, isMobile]);

  const handleTouchStart = (e) => {
    if (!isMobile) return;
    isHorizontalDrag.current = null;
    beginDrag(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    if (!isDraggingRef.current) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = Math.abs(dragStartX.current - currentX);
    const deltaY = Math.abs(dragStartY.current - currentY);

    if (isHorizontalDrag.current === null) {
      if (deltaX < 5 && deltaY < 5) return;
      if (deltaY > deltaX) {
        isHorizontalDrag.current = false;
        isDraggingRef.current = false;
        setMotionClass(false);
        setIsDragging(false);
        return;
      }
      isHorizontalDrag.current = true;
    }

    if (!isHorizontalDrag.current) return;

    e.preventDefault();
    moveDrag(currentX);
  };

  const handleTouchEnd = () => {
    if (!isDraggingRef.current && isHorizontalDrag.current !== true) {
      isDraggingRef.current = false;
      isHorizontalDrag.current = null;
      setIsDragging(false);
      return;
    }
    isDraggingRef.current = false;
    isHorizontalDrag.current = null;
    setIsDragging(false);
    finishDrag();
  };

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return undefined;
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => {
      el.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isMobile]);

  const handleContainerClick = (e) => {
    if (justFinishedDrag.current && !e.target.closest('[data-allow-navigate]')) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const scrollToIndex = (index) => {
    animateTo(translateFromIndex(index));
  };

  useEffect(() => {
    if (scrollToIndexRef) scrollToIndexRef.current = scrollToIndex;
    return () => { if (scrollToIndexRef) scrollToIndexRef.current = null; };
  }, [scrollToIndexRef]);

  return (
    <div className="horizontal-scroll-wrapper">
      {!isMobile && (alwaysShowButtons || canScrollLeft) && (
        <button
          className="horizontal-scroll-btn horizontal-scroll-btn-left"
          disabled={!canScrollLeft && alwaysShowButtons}
          onClick={(e) => handleScroll('left', e)}
          onMouseDown={(e) => e.stopPropagation()}
          aria-label="Scroll left"
          type="button"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
      )}

      <div
        className={`horizontal-scroll-viewport${isDragging ? ' horizontal-scroll-dragging' : ''}`}
        ref={wrapperRef}
        onMouseDown={handleMouseDown}
        onClickCapture={handleContainerClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="horizontal-scroll-track" ref={trackRef}>
          {children}
        </div>
      </div>

      {!isMobile && (alwaysShowButtons || canScrollRight) && (
        <button
          className="horizontal-scroll-btn horizontal-scroll-btn-right"
          disabled={!canScrollRight && alwaysShowButtons}
          onClick={(e) => handleScroll('right', e)}
          onMouseDown={(e) => e.stopPropagation()}
          aria-label="Scroll right"
          type="button"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      )}
    </div>
  );
};

export default HorizontalScroll;
