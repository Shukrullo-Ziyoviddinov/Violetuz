import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ChanelProfileBanner.css';

const SLIDE_EASE = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
const VELOCITY_THRESHOLD = 0.3;

const bannerImage = (item) => String(item?.img || item?.image || '').trim();

const readBanners = (profileBanner) => {
  if (Array.isArray(profileBanner?.banners)) {
    return profileBanner.banners.filter((item) => bannerImage(item));
  }
  if (typeof profileBanner === 'string' && profileBanner.trim()) {
    return [{ id: 'legacy', img: profileBanner.trim(), movieId: null }];
  }
  return [];
};

const ChanelProfileBanner = ({ profileBanner }) => {
  const navigate = useNavigate();
  const banners = readBanners(profileBanner);
  const count = banners.length;
  const rootRef = useRef(null);
  const trackRef = useRef(null);
  const draggingRef = useRef(false);
  const tapBannerRef = useRef(null);
  const tapHandledRef = useRef(false);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const dragStartTimeRef = useRef(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (count ? (prev + 1) % count : 0));
    setDragOffset(0);
  }, [count]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (count ? (prev - 1 + count) % count : 0));
    setDragOffset(0);
  }, [count]);

  const openMovie = (banner) => {
    const movieId = banner?.movieId;
    if (movieId == null || movieId === '') return;
    navigate(`/movie/${movieId}`);
  };

  const handleDragStart = (clientX) => {
    if (count < 2) return;
    draggingRef.current = true;
    setIsDragging(true);
    startXRef.current = clientX;
    currentXRef.current = clientX;
    dragStartTimeRef.current = Date.now();
  };

  const handleDragMove = (clientX) => {
    if (!draggingRef.current) return;
    currentXRef.current = clientX;
    setDragOffset(clientX - startXRef.current);
  };

  const handleDragEnd = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;

    const diff = currentXRef.current - startXRef.current;
    const dragDuration = Math.max(Date.now() - dragStartTimeRef.current, 1);
    const velocity = Math.abs(diff) / dragDuration;
    const width = rootRef.current?.offsetWidth || 0;
    const threshold = Math.max(48, width * 0.22);

    const banner = tapBannerRef.current;
    tapBannerRef.current = null;
    tapHandledRef.current = true;
    if (Math.abs(diff) > threshold || (Math.abs(diff) > 10 && velocity > VELOCITY_THRESHOLD)) {
      if (diff > 0) prevSlide();
      else nextSlide();
    } else {
      setDragOffset(0);
      if (Math.abs(diff) <= 8) openMovie(banner);
    }
    setIsDragging(false);
  };

  useEffect(() => {
    if (!isDragging) return undefined;

    const handleDocumentMouseMove = (event) => {
      handleDragMove(event.pageX);
    };
    const handleDocumentMouseUp = () => {
      handleDragEnd();
    };

    document.addEventListener('mousemove', handleDocumentMouseMove);
    document.addEventListener('mouseup', handleDocumentMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleDocumentMouseMove);
      document.removeEventListener('mouseup', handleDocumentMouseUp);
    };
  }, [isDragging, count]);

  useEffect(() => {
    const track = trackRef.current;
    const root = rootRef.current;
    if (!track || !root || count === 0) return undefined;

    const updateTransform = () => {
      const width = root.offsetWidth;
      const trackStyle = getComputedStyle(track);
      const gap = parseFloat(trackStyle.columnGap) || parseFloat(trackStyle.gap) || 0;
      const offset = -currentIndex * (width + gap);
      if (isDragging) {
        track.style.transition = 'none';
        track.style.transform = `translateX(${offset + dragOffset}px)`;
      } else {
        track.style.transition = SLIDE_EASE;
        track.style.transform = `translateX(${offset}px)`;
      }
    };

    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(updateTransform);
    });
    const observer = new ResizeObserver(() => {
      requestAnimationFrame(updateTransform);
    });
    observer.observe(root);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [currentIndex, dragOffset, isDragging, count]);

  return (
    <div
      className={`channel-profile-banner${isDragging ? ' is-dragging' : ''}${count < 2 ? ' is-single' : ''}`}
      ref={rootRef}
      onMouseDown={(event) => {
        if (count < 2) return;
        event.preventDefault();
        handleDragStart(event.pageX);
      }}
      onTouchStart={(event) => handleDragStart(event.touches[0].clientX)}
      onTouchMove={(event) => handleDragMove(event.touches[0].clientX)}
      onTouchEnd={handleDragEnd}
    >
      <ul className="channel-profile-banner-track" ref={trackRef}>
        {banners.map((banner, index) => (
          <li
            key={banner.id || index}
            className={`channel-profile-banner-slide${banner.movieId != null && banner.movieId !== '' ? ' is-linked' : ''}`}
            onMouseDown={() => {
              tapBannerRef.current = banner;
            }}
            onTouchStart={() => {
              tapBannerRef.current = banner;
            }}
            onClick={() => {
              if (tapHandledRef.current) {
                tapHandledRef.current = false;
                return;
              }
              openMovie(banner);
            }}
          >
            <img src={bannerImage(banner)} alt="" draggable={false} />
          </li>
        ))}
      </ul>
      {count > 1 ? (
        <div className="channel-profile-banner-dots">
          {banners.map((banner, index) => (
            <button
              key={banner.id || index}
              type="button"
              className={`channel-profile-banner-dot${index === currentIndex ? ' is-active' : ''}`}
              aria-label={`Banner ${index + 1}`}
              aria-current={index === currentIndex ? 'true' : undefined}
              onMouseDown={(event) => event.stopPropagation()}
              onTouchStart={(event) => event.stopPropagation()}
              onClick={() => {
                setCurrentIndex(index);
                setDragOffset(0);
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default ChanelProfileBanner;
