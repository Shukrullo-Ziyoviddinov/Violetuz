import React, { useRef, useState, useEffect } from 'react';
import './VerticalScroll.css';

const VerticalScroll = ({ children, className = '' }) => {
  const containerRef = useRef(null);
  const scrollRef = useRef(null);
  const trackRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [showScrollbar, setShowScrollbar] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const checkScrollable = () => {
      const hasScroll = container.scrollHeight > container.clientHeight;
      setShowScrollbar(hasScroll);
    };

    checkScrollable();
    const resizeObserver = new ResizeObserver(checkScrollable);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [children]);

  const handleMouseDown = (e) => {
    if (!scrollRef.current || !trackRef.current) return;
    e.preventDefault();
    setIsDragging(true);
    const rect = trackRef.current.getBoundingClientRect();
    setStartY(e.clientY - rect.top - scrollRef.current.offsetTop);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !containerRef.current || !scrollRef.current || !trackRef.current) return;
    e.preventDefault();

    const container = containerRef.current;
    const scrollbar = scrollRef.current;
    const track = trackRef.current;
    const trackRect = track.getBoundingClientRect();
    const y = e.clientY - trackRect.top;
    const scrollbarHeight = scrollbar.offsetHeight;
    const trackHeight = track.offsetHeight;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    const maxScroll = scrollHeight - clientHeight;

    const scrollbarTop = Math.max(0, Math.min(y - startY, trackHeight - scrollbarHeight));
    const scrollPercent = scrollbarTop / (trackHeight - scrollbarHeight);
    container.scrollTop = scrollPercent * maxScroll;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, startY]);

  const handleScroll = () => {
    if (!containerRef.current || !scrollRef.current || !trackRef.current) return;
    const container = containerRef.current;
    const scrollbar = scrollRef.current;
    const track = trackRef.current;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    const scrollTop = container.scrollTop;
    const maxScroll = scrollHeight - clientHeight;

    if (maxScroll <= 0) {
      scrollbar.style.display = 'none';
      setShowScrollbar(false);
      return;
    }

    setShowScrollbar(true);
    scrollbar.style.display = 'block';
    const trackHeight = track.offsetHeight;
    const thumbHeight = Math.max(20, (clientHeight / scrollHeight) * trackHeight);
    const scrollPercent = scrollTop / maxScroll;
    const maxThumbTop = trackHeight - thumbHeight;
    scrollbar.style.top = `${scrollPercent * maxThumbTop}px`;
    scrollbar.style.height = `${thumbHeight}px`;
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateScroll = () => {
      handleScroll();
    };

    const handleWheel = (e) => {
      if (container.scrollHeight > container.clientHeight) {
        e.preventDefault();
        container.scrollTop += e.deltaY;
      }
    };

    container.addEventListener('scroll', updateScroll);
    container.addEventListener('wheel', handleWheel, { passive: false });
    const resizeObserver = new ResizeObserver(updateScroll);
    resizeObserver.observe(container);
    
    // Initial update
    setTimeout(updateScroll, 100);

    return () => {
      container.removeEventListener('scroll', updateScroll);
      container.removeEventListener('wheel', handleWheel);
      resizeObserver.disconnect();
    };
  }, [children]);

  if (!showScrollbar) {
    return (
      <div className={`vertical-scroll-container ${className}`} ref={containerRef}>
        {children}
      </div>
    );
  }

  return (
    <div className={`vertical-scroll-wrapper ${className}`}>
      <div className="vertical-scroll-container" ref={containerRef}>
        {children}
      </div>
      <div className="vertical-scrollbar-track" ref={trackRef}>
        <div
          className="vertical-scrollbar-thumb"
          ref={scrollRef}
          onMouseDown={handleMouseDown}
        />
      </div>
    </div>
  );
};

export default VerticalScroll;
