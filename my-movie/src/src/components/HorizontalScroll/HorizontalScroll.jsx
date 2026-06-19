import React, { useRef, useState, useEffect } from 'react';
import './HorizontalScroll.css';

// Carousel drag: sekin + foizga yetmasa → joyiga qaytadi, yetganda yoki tez surganda → keyingiga
const DRAG_THRESHOLD_PERCENT = 0.4;
const VELOCITY_THRESHOLD = 0.12;
const CLICK_THRESHOLD = 8;

const HorizontalScroll = ({ children, scrollAmount = 400, alwaysShowButtons = false, scrollToIndexRef, onScrollIndexChange }) => {
  const wrapperRef = useRef(null);
  const trackRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const justFinishedDrag = useRef(false);

  // translateX px da (0 = boshlang'ich, manfiy = o'ngga scroll)
  const translateX = useRef(0);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0); // ← YANGI: vertikal yo'nalishni aniqlash uchun
  const dragStartTranslate = useRef(0);
  const dragStartTime = useRef(0);
  const lastPointX = useRef(0);
  const isHorizontalDrag = useRef(null); // ← YANGI: null = aniqlanmagan, true/false = yo'nalish

  // Mobile yoki desktop
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const updateTranslate = (value) => {
    if (!trackRef.current || !wrapperRef.current) return;
    const maxScroll = Math.max(0, trackRef.current.scrollWidth - wrapperRef.current.clientWidth);
    translateX.current = Math.max(-maxScroll, Math.min(0, value));
    trackRef.current.style.transform = `translateX(${translateX.current}px)`;
  };

  // Bitta element (kartochka) kengligi + gap
  const getItemWidth = () => {
    if (!trackRef.current?.children?.[0]) return scrollAmount;
    const first = trackRef.current.children[0];
    const style = window.getComputedStyle(trackRef.current);
    const gap = parseFloat(style.gap) || 12;
    return first.offsetWidth + gap;
  };

  // translateX ni eng yaqin to'liq element chegarasiga snap qilish
  const snapToItemBoundary = (value) => {
    const itemWidth = getItemWidth();
    if (itemWidth <= 0) return value;
    const maxScroll = trackRef.current && wrapperRef.current
      ? Math.max(0, trackRef.current.scrollWidth - wrapperRef.current.clientWidth)
      : 0;
    const maxIndex = Math.floor(maxScroll / itemWidth);
    const index = Math.round(-value / itemWidth);
    const snapped = index >= maxIndex ? -maxScroll : -Math.min(index * itemWidth, maxScroll);
    return Math.max(-maxScroll, Math.min(0, snapped));
  };

  const getCurrentIndex = () => {
    const itemWidth = getItemWidth();
    if (itemWidth <= 0) return 0;
    const maxScroll = trackRef.current && wrapperRef.current
      ? Math.max(0, trackRef.current.scrollWidth - wrapperRef.current.clientWidth)
      : 0;
    const maxIndex = Math.floor(maxScroll / itemWidth);
    const atEnd = -translateX.current >= maxScroll - 1;
    return atEnd ? maxIndex : Math.round(-translateX.current / itemWidth);
  };

  const notifyIndexChange = () => {
    if (onScrollIndexChange) onScrollIndexChange(getCurrentIndex());
  };

  const checkScrollability = () => {
    if (!wrapperRef.current || !trackRef.current) return;
    const maxScroll = Math.max(0, trackRef.current.scrollWidth - wrapperRef.current.clientWidth);
    const tx = translateX.current;
    setCanScrollLeft(tx < -1);
    setCanScrollRight(tx > -maxScroll + 1);
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

  const handleScroll = (direction, e) => {
    e.preventDefault();
    e.stopPropagation();
    const itemWidth = getItemWidth();
    const maxScroll = trackRef.current && wrapperRef.current
      ? Math.max(0, trackRef.current.scrollWidth - wrapperRef.current.clientWidth)
      : 0;
    const maxIndex = Math.floor(maxScroll / itemWidth);
    const atEnd = -translateX.current >= maxScroll - 1;
    const currentIndex = atEnd ? maxIndex : Math.round(-translateX.current / itemWidth);
    const nextIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    const clampedIndex = Math.max(0, Math.min(nextIndex, maxIndex));
    const target = clampedIndex >= maxIndex ? -maxScroll : -clampedIndex * itemWidth;
    animateTo(target);
  };

  const animateTo = (target) => {
    if (!wrapperRef.current || !trackRef.current) return;
    const snapped = snapToItemBoundary(target);
    trackRef.current.style.transition = 'transform 0.3s ease-out';
    updateTranslate(snapped);
    setTimeout(() => {
      if (trackRef.current) trackRef.current.style.transition = '';
      checkScrollability();
      notifyIndexChange();
    }, 300);
  };

  // ========== MOUSE DRAG (Desktop) ==========
  const handleMouseDown = (e) => {
    if (isMobile) return;
    if (e.button !== 0) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartX.current = e.clientX;
    dragStartTranslate.current = translateX.current;
    dragStartTime.current = Date.now();
    lastPointX.current = e.clientX;
    if (trackRef.current) trackRef.current.style.transition = '';
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    lastPointX.current = e.clientX;
    const delta = dragStartX.current - e.clientX;
    updateTranslate(dragStartTranslate.current - delta);
    checkScrollability();
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const delta = dragStartX.current - lastPointX.current;
    justFinishedDrag.current = Math.abs(delta) > CLICK_THRESHOLD;
    const duration = Date.now() - dragStartTime.current;
    const velocity = duration > 0 ? Math.abs(delta) / duration : 0;
    const itemWidth = getItemWidth();
    const thresholdDistance = itemWidth * DRAG_THRESHOLD_PERCENT;

    const isFastDrag = velocity > VELOCITY_THRESHOLD;
    const passedThreshold = Math.abs(delta) > thresholdDistance;

    const maxScroll = trackRef.current && wrapperRef.current
      ? Math.max(0, trackRef.current.scrollWidth - wrapperRef.current.clientWidth)
      : 0;
    const maxIndex = Math.floor(maxScroll / itemWidth);
    const atEnd = -dragStartTranslate.current >= maxScroll - 1;
    const startIndex = atEnd ? maxIndex : Math.round(-dragStartTranslate.current / itemWidth);

    let targetTranslate;
    if (isFastDrag || passedThreshold) {
      const direction = delta > 0 ? 1 : -1;
      const nextIndex = Math.max(0, Math.min(startIndex + direction, maxIndex));
      targetTranslate = nextIndex >= maxIndex ? -maxScroll : -nextIndex * itemWidth;
    } else {
      targetTranslate = snapToItemBoundary(dragStartTranslate.current);
    }

    animateTo(targetTranslate);
    setTimeout(() => { justFinishedDrag.current = false; }, 150);
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e) => handleMouseMove(e);
    const onUp = () => handleMouseUp();
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging]);

  // ========== TOUCH DRAG (Mobile) — TUZATILGAN ==========
  const handleTouchStart = (e) => {
    if (!isMobile) return;
    isDraggingRef.current = true;
    isHorizontalDrag.current = null; // ← yo'nalish aniqlanmagan holat
    dragStartX.current = e.touches[0].clientX;
    dragStartY.current = e.touches[0].clientY; // ← Y koordinatani saqlash
    dragStartTranslate.current = translateX.current;
    dragStartTime.current = Date.now();
    lastPointX.current = e.touches[0].clientX;
    setIsDragging(true);
    if (trackRef.current) trackRef.current.style.transition = '';
  };

  const handleTouchMove = (e) => {
    if (!isDraggingRef.current) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = Math.abs(dragStartX.current - currentX);
    const deltaY = Math.abs(dragStartY.current - currentY);

    // Yo'nalishni birinchi marta aniqlash
    if (isHorizontalDrag.current === null) {
      if (deltaX < 5 && deltaY < 5) return; // hali aniqlab bo'lmaydi, kuting

      if (deltaY > deltaX) {
        // Vertikal scroll — biz boshqarmaymiz, brauzerga qo'yib beramiz
        isHorizontalDrag.current = false;
        isDraggingRef.current = false;
        setIsDragging(false);
        return;
      } else {
        // Gorizontal drag — biz boshqaramiz
        isHorizontalDrag.current = true;
      }
    }

    // Faqat gorizontal drag holatida preventDefault va harakat
    if (!isHorizontalDrag.current) return;

    e.preventDefault(); // ← faqat gorizontal bo'lsa bloklash
    lastPointX.current = currentX;
    const delta = dragStartX.current - currentX;
    updateTranslate(dragStartTranslate.current - delta);
  };

  const handleTouchEnd = () => {
    if (!isDraggingRef.current && isHorizontalDrag.current !== true) {
      // Vertikal scroll edi, hech narsa qilmaymiz
      isDraggingRef.current = false;
      isHorizontalDrag.current = null;
      setIsDragging(false);
      return;
    }
    isDraggingRef.current = false;
    isHorizontalDrag.current = null;
    setIsDragging(false);

    const delta = dragStartX.current - lastPointX.current;
    justFinishedDrag.current = Math.abs(delta) > CLICK_THRESHOLD;
    const duration = Date.now() - dragStartTime.current;
    const velocity = duration > 0 ? Math.abs(delta) / duration : 0;
    const itemWidth = getItemWidth();
    const thresholdDistance = itemWidth * DRAG_THRESHOLD_PERCENT;

    const isFastDrag = velocity > VELOCITY_THRESHOLD;
    const passedThreshold = Math.abs(delta) > thresholdDistance;
    const maxScroll = trackRef.current && wrapperRef.current
      ? Math.max(0, trackRef.current.scrollWidth - wrapperRef.current.clientWidth)
      : 0;
    const maxIndex = Math.floor(maxScroll / itemWidth);
    const atEnd = -dragStartTranslate.current >= maxScroll - 1;
    const startIndex = atEnd ? maxIndex : Math.round(-dragStartTranslate.current / itemWidth);

    let targetTranslate;
    if (isFastDrag || passedThreshold) {
      const direction = delta > 0 ? 1 : -1;
      const nextIndex = Math.max(0, Math.min(startIndex + direction, maxIndex));
      targetTranslate = nextIndex >= maxIndex ? -maxScroll : -nextIndex * itemWidth;
    } else {
      targetTranslate = snapToItemBoundary(dragStartTranslate.current);
    }

    animateTo(targetTranslate);
    setTimeout(() => { justFinishedDrag.current = false; }, 150);
  };

  // Touch uchun passive: false — gorizontal dragda preventDefault ishlashi uchun
  // Wheel listener olib tashlandi — brauzer o'zi boshqaradi
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
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
    const itemWidth = getItemWidth();
    const maxScroll = trackRef.current && wrapperRef.current
      ? Math.max(0, trackRef.current.scrollWidth - wrapperRef.current.clientWidth)
      : 0;
    const maxIndex = Math.floor(maxScroll / itemWidth);
    const clampedIndex = Math.max(0, Math.min(index, maxIndex));
    const target = clampedIndex >= maxIndex ? -maxScroll : -clampedIndex * itemWidth;
    animateTo(target);
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
        className={`horizontal-scroll-viewport ${isDragging ? 'horizontal-scroll-dragging' : ''}`}
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
