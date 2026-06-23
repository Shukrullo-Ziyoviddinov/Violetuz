import React, { useRef, useEffect } from 'react';
import './ScrollTouch.css';

const DRAG_THRESHOLD = 3;
const MOMENTUM_MIN_VELOCITY = 0.3;
const MOMENTUM_FRICTION = 0.92;

const ScrollTouch = ({ children, className = '', ...props }) => {
  const scrollRef = useRef(null);
  const isDown = useRef(false);
  const lastClientX = useRef(0);
  const hasDragged = useRef(false);
  const momentumFrame = useRef(null);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const stopMomentum = () => {
      if (momentumFrame.current !== null) {
        cancelAnimationFrame(momentumFrame.current);
        momentumFrame.current = null;
      }
    };

    const applyMomentum = (velocity) => {
      stopMomentum();
      if (Math.abs(velocity) < MOMENTUM_MIN_VELOCITY) return;

      let v = velocity;
      const step = () => {
        if (Math.abs(v) < MOMENTUM_MIN_VELOCITY) {
          momentumFrame.current = null;
          return;
        }
        element.scrollLeft -= v;
        v *= MOMENTUM_FRICTION;
        momentumFrame.current = requestAnimationFrame(step);
      };
      momentumFrame.current = requestAnimationFrame(step);
    };

    const scrollByDelta = (deltaX) => {
      if (deltaX === 0) return;
      totalDrag += Math.abs(deltaX);
      if (totalDrag > DRAG_THRESHOLD) hasDragged.current = true;
      element.scrollLeft -= deltaX;
    };

    let velocityX = 0;
    let lastMoveTime = 0;
    let totalDrag = 0;

    const trackVelocity = (clientX) => {
      const now = performance.now();
      const dt = now - lastMoveTime;
      if (dt > 0 && dt < 100) {
        velocityX = (clientX - lastClientX.current) / dt;
      }
      lastClientX.current = clientX;
      lastMoveTime = now;
    };

    const handleMouseDown = (e) => {
      if (e.target.closest('img')) {
        e.preventDefault();
      }
      stopMomentum();
      isDown.current = true;
      hasDragged.current = false;
      totalDrag = 0;
      velocityX = 0;
      lastMoveTime = performance.now();
      lastClientX.current = e.clientX;
      element.style.cursor = 'grabbing';
      element.setPointerCapture?.(e.pointerId);
    };

    const handleMouseLeave = () => {
      if (!isDown.current) return;
      isDown.current = false;
      element.style.cursor = 'grab';
      applyMomentum(velocityX * 16);
    };

    const handleMouseUp = (e) => {
      if (!isDown.current) return;
      isDown.current = false;
      element.style.cursor = 'grab';
      element.releasePointerCapture?.(e.pointerId);
      applyMomentum(velocityX * 16);
    };

    const handleMouseMove = (e) => {
      if (!isDown.current) return;
      e.preventDefault();
      const deltaX = e.clientX - lastClientX.current;
      trackVelocity(e.clientX);
      scrollByDelta(deltaX);
    };

    const handleClick = (e) => {
      if (hasDragged.current) {
        e.preventDefault();
        e.stopPropagation();
        hasDragged.current = false;
      }
    };

    let touchStartX = 0;
    let touchStartY = 0;
    let isTouching = false;
    let isHorizontal = null;

    const handleTouchStart = (e) => {
      stopMomentum();
      isTouching = true;
      isHorizontal = null;
      hasDragged.current = false;
      totalDrag = 0;
      velocityX = 0;
      lastMoveTime = performance.now();
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      lastClientX.current = touchStartX;
    };

    const handleTouchMove = (e) => {
      if (!isTouching) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const deltaX = Math.abs(currentX - touchStartX);
      const deltaY = Math.abs(currentY - touchStartY);

      if (isHorizontal === null) {
        if (deltaX < 5 && deltaY < 5) return;

        if (deltaY > deltaX) {
          isHorizontal = false;
          isTouching = false;
          return;
        }
        isHorizontal = true;
        lastClientX.current = currentX;
        lastMoveTime = performance.now();
      }

      if (!isHorizontal) return;

      e.preventDefault();
      const moveDelta = currentX - lastClientX.current;
      trackVelocity(currentX);
      scrollByDelta(moveDelta);
    };

    const handleTouchEnd = () => {
      if (isHorizontal) {
        applyMomentum(velocityX * 16);
      }
      isTouching = false;
      isHorizontal = null;
    };

    // Mishka g'ildiragi — vertikalni gorizontal scrollga aylantirish
    const handleWheel = (e) => {
      if (e.deltaY !== 0 && element.scrollWidth > element.clientWidth) {
        e.preventDefault();
        element.scrollLeft += e.deltaY;
      }
    };

    // Event listeners — mouseup/mousemove documentda, chunki img ustida yoki tashqarida qo'yilganda ham to'xtashi kerak
    element.addEventListener('click', handleClick, true);
    element.addEventListener('mousedown', handleMouseDown);
    element.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('touchstart', handleTouchStart, { passive: true }); // ← passive: true (preventDefault shart emas)
    element.addEventListener('touchmove', handleTouchMove, { passive: false }); // ← passive: false (gorizontalda preventDefault kerak)
    element.addEventListener('touchend', handleTouchEnd);
    element.addEventListener('wheel', handleWheel, { passive: false }); // preventDefault uchun

    element.style.cursor = 'grab';

    return () => {
      stopMomentum();
      element.removeEventListener('click', handleClick, true);
      element.removeEventListener('mousedown', handleMouseDown);
      element.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return (
    <div
      ref={scrollRef}
      className={`scroll-touch ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default ScrollTouch;