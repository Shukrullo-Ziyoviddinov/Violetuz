import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { normalizeImagePath } from '../../utils/utils';
import { getLocalizedText } from '../../utils/utils';
import { useMusicApi } from '../../context/MusicApiContext';
import SkeletonLoader from '../../components/SkeletonLoader/SkeletonLoader';
import './MusicBanner.css';

const MUSIC_BANNER_SKELETON_SLIDES = ['left', 'center', 'right'];
/** Broken/slow CDN — skeleton ushlab qolmasin */
const MUSIC_BANNER_IMAGE_READY_TIMEOUT_MS = 20000;
/** Rasm ko‘rinib turadi, keyin video */
const MUSIC_BANNER_VIDEO_REVEAL_MS = 5000;

const MusicBanner = () => {
    const navigate = useNavigate();
    const { i18n } = useTranslation();
    const { allMusicBanners, musicBannersLoading } = useMusicApi();
    const lang = i18n.language || 'uz';
    const images = useMemo(() => {
        const banners = Array.isArray(allMusicBanners) ? allMusicBanners : [];
        return banners.map((item) => ({
            id: item.id,
            src: typeof item.img === 'object' ? getLocalizedText(item.img, lang) : item.img,
            video: item.video || '',
            link: item.buttonId ? `/music/${item.buttonId}` : null
        })).filter((img) => img.src);
    }, [lang, allMusicBanners]);

    const imageSrcKey = useMemo(
        () => images.map((img) => normalizeImagePath(img.src)).join('|'),
        [images]
    );

    const [loadedSrcs, setLoadedSrcs] = useState(() => new Set());
    const [currentIndex, setCurrentIndex] = useState(0);
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isUserInteracting, setIsUserInteracting] = useState(false);
    const [showCenterVideo, setShowCenterVideo] = useState(false);
    const [bannerInView, setBannerInView] = useState(true);
    const [unmuted, setUnmuted] = useState(false);
    const startXRef = useRef(0);
    const currentXRef = useRef(0);
    const carouselRef = useRef(null);
    const slidesRef = useRef(null);
    const bannerRootRef = useRef(null);
    const centerVideoRef = useRef(null);
    const videoRevealTimerRef = useRef(null);
    const noVideoAdvanceTimerRef = useRef(null);
    const dragStartTimeRef = useRef(0);
    const wasDragRef = useRef(false);

    const markSrcReady = useCallback((src) => {
        if (!src) return;
        setLoadedSrcs((prev) => {
            if (prev.has(src)) return prev;
            const next = new Set(prev);
            next.add(src);
            return next;
        });
    }, []);

    const clearVideoTimers = useCallback(() => {
        if (videoRevealTimerRef.current) {
            clearTimeout(videoRevealTimerRef.current);
            videoRevealTimerRef.current = null;
        }
        if (noVideoAdvanceTimerRef.current) {
            clearTimeout(noVideoAdvanceTimerRef.current);
            noVideoAdvanceTimerRef.current = null;
        }
    }, []);

    const pauseCenterVideo = useCallback(() => {
        const el = centerVideoRef.current;
        if (!el) return;
        el.pause();
        try {
            el.currentTime = 0;
        } catch {
            /* ignore */
        }
    }, []);

    useEffect(() => {
        setLoadedSrcs(new Set());
    }, [imageSrcKey]);

    useEffect(() => {
        if (musicBannersLoading || images.length === 0) return undefined;

        const normalized = images.map((img) => normalizeImagePath(img.src)).filter(Boolean);
        const uniqueSrcs = [...new Set(normalized)];
        const preloaders = [];

        uniqueSrcs.forEach((src) => {
            const existing = typeof document !== 'undefined'
                ? Array.from(document.images || []).find((el) => el.currentSrc === src || el.src === src)
                : null;
            if (existing && existing.complete && existing.naturalWidth > 0) {
                markSrcReady(src);
                return;
            }

            const img = new Image();
            const onDone = () => markSrcReady(src);
            img.onload = onDone;
            img.onerror = onDone;
            img.src = src;
            preloaders.push(img);
        });

        const timeoutId = window.setTimeout(() => {
            uniqueSrcs.forEach((src) => markSrcReady(src));
        }, MUSIC_BANNER_IMAGE_READY_TIMEOUT_MS);

        return () => {
            window.clearTimeout(timeoutId);
            preloaders.forEach((img) => {
                img.onload = null;
                img.onerror = null;
            });
        };
    }, [musicBannersLoading, images, imageSrcKey, markSrcReady]);

    const goToSlide = useCallback((index) => {
        if (index >= 0 && index < images.length) {
            clearVideoTimers();
            setShowCenterVideo(false);
            setUnmuted(false);
            pauseCenterVideo();
            setCurrentIndex(index);
            setDragOffset(0);
        }
    }, [images.length, clearVideoTimers, pauseCenterVideo]);

    const nextSlide = useCallback(() => {
        clearVideoTimers();
        setShowCenterVideo(false);
        setUnmuted(false);
        pauseCenterVideo();
        setCurrentIndex((prev) => (prev + 1) % images.length);
        setDragOffset(0);
    }, [images.length, clearVideoTimers, pauseCenterVideo]);

    const prevSlide = useCallback(() => {
        clearVideoTimers();
        setShowCenterVideo(false);
        setUnmuted(false);
        pauseCenterVideo();
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
        setDragOffset(0);
    }, [images.length, clearVideoTimers, pauseCenterVideo]);

    const handleToggleMute = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        const el = centerVideoRef.current;
        setUnmuted((prev) => {
            const nextUnmuted = !prev;
            if (el) {
                el.muted = !nextUnmuted;
                if (nextUnmuted) {
                    el.play().catch(() => {});
                }
            }
            return nextUnmuted;
        });
    }, []);

    const handleVideoEnded = useCallback(() => {
        nextSlide();
    }, [nextSlide]);

    const handleDragStart = (clientX) => {
        wasDragRef.current = false;
        setIsDragging(true);
        setIsUserInteracting(true);
        startXRef.current = clientX;
        currentXRef.current = clientX;
        dragStartTimeRef.current = Date.now();
        clearVideoTimers();
        if (centerVideoRef.current) centerVideoRef.current.pause();
    };

    const handleDragMove = (clientX) => {
        if (!isDragging) return;
        currentXRef.current = clientX;
        const diff = clientX - startXRef.current;
        if (Math.abs(diff) > 10) wasDragRef.current = true;
        setDragOffset(diff);
    };

    const handleSlideClick = (image) => {
        if (wasDragRef.current || !image?.link) return;
        navigate(image.link);
    };

    const handleDragEnd = () => {
        if (!isDragging) return;

        const diff = currentXRef.current - startXRef.current;
        const dragDuration = Date.now() - dragStartTimeRef.current;
        const velocity = Math.abs(diff) / dragDuration;

        const threshold = 300;
        const velocityThreshold = 0.3;

        if (Math.abs(diff) > threshold || velocity > velocityThreshold) {
            if (diff > 0) {
                prevSlide();
            } else {
                nextSlide();
            }
        } else {
            setDragOffset(0);
        }

        setIsDragging(false);
        setIsUserInteracting(false);
    };

    const handleMouseDown = (e) => {
        e.preventDefault();
        handleDragStart(e.pageX);
    };

    const handleTouchStart = (e) => {
        handleDragStart(e.touches[0].clientX);
    };

    const handleTouchMove = (e) => {
        handleDragMove(e.touches[0].clientX);
    };

    const handleTouchEnd = () => {
        handleDragEnd();
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleDocumentMouseMove = (e) => {
            handleDragMove(e.pageX);
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
    }, [isDragging]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') {
                prevSlide();
            } else if (e.key === 'ArrowRight') {
                nextSlide();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [prevSlide, nextSlide]);

    const handleMouseEnter = () => {
        setIsUserInteracting(true);
        // Video allaqachon ijroda bo‘lsa pauza qilmaymiz (unmute icon uchun)
        if (!showCenterVideo) {
            clearVideoTimers();
        }
    };

    const handleMouseLeave = () => {
        if (!isDragging) {
            setIsUserInteracting(false);
        }
    };

    useEffect(() => {
        const root = bannerRootRef.current;
        if (!root) return undefined;

        const observer = new IntersectionObserver(
            ([entry]) => {
                const visible = entry.isIntersecting && entry.intersectionRatio >= 0.55;
                setBannerInView(visible);
                if (!visible) {
                    clearVideoTimers();
                    setShowCenterVideo(false);
                    pauseCenterVideo();
                }
            },
            { threshold: [0, 0.35, 0.55, 0.75, 1] }
        );
        observer.observe(root);
        return () => observer.disconnect();
    }, [clearVideoTimers, pauseCenterVideo, musicBannersLoading, images.length]);

    useEffect(() => {
        if (images.length === 0) return undefined;
        if (!bannerInView || isUserInteracting || isDragging) return undefined;

        const current = images[currentIndex];
        const hasVideo = Boolean(current?.video);

        clearVideoTimers();
        setShowCenterVideo(false);
        pauseCenterVideo();

        videoRevealTimerRef.current = setTimeout(() => {
            if (hasVideo) {
                setShowCenterVideo(true);
            } else {
                noVideoAdvanceTimerRef.current = setTimeout(() => {
                    nextSlide();
                }, MUSIC_BANNER_VIDEO_REVEAL_MS);
            }
        }, MUSIC_BANNER_VIDEO_REVEAL_MS);

        return () => clearVideoTimers();
    }, [
        currentIndex,
        bannerInView,
        isUserInteracting,
        isDragging,
        images,
        clearVideoTimers,
        pauseCenterVideo,
        nextSlide,
    ]);

    useEffect(() => {
        const el = centerVideoRef.current;
        if (!el) return;
        if (showCenterVideo && bannerInView && !isDragging) {
            el.muted = !unmuted;
            el.play().catch(() => {});
        } else {
            el.pause();
        }
    }, [showCenterVideo, bannerInView, isDragging, currentIndex, unmuted]);

    useEffect(() => {
        let resizeTimer;
        const handleResize = () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                setCurrentIndex((prev) => prev);
            }, 250);
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(resizeTimer);
        };
    }, []);

    useEffect(() => {
        if (!slidesRef.current || images.length === 0) return;

        const slideWidth = slidesRef.current.querySelector('.music-image')?.offsetWidth || 0;
        const containerWidth = carouselRef.current?.offsetWidth || 0;

        const gap = containerWidth * 0.01;

        const actualIndex = currentIndex + images.length;
        const offset = (containerWidth / 2) - (slideWidth / 2) - (actualIndex * (slideWidth + gap));

        if (isDragging) {
            slidesRef.current.style.transition = 'none';
            slidesRef.current.style.transform = `translateX(${offset + dragOffset}px)`;
        } else {
            slidesRef.current.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            slidesRef.current.style.transform = `translateX(${offset}px)`;
        }
    }, [currentIndex, dragOffset, isDragging, images.length]);

    const getSlideClass = (index) => {
        const total = images.length;
        if (total === 0) return 'hidden';

        const diff = index - currentIndex;

        if (diff === 0) return 'center';
        if (diff === -1 || diff === total - 1) return 'left';
        if (diff === 1 || diff === -(total - 1)) return 'right';

        return 'hidden';
    };

    const renderSlideContent = (image, index, { isPrimaryCenter = false } = {}) => {
        const src = normalizeImagePath(image.src);
        const videoSrc = normalizeImagePath(image.video);
        const ready = loadedSrcs.has(src);
        const isActiveCenter = isPrimaryCenter && index === currentIndex;
        const videoVisible = isActiveCenter && showCenterVideo && Boolean(videoSrc);

        return (
            <>
                {!ready && (
                    <SkeletonLoader
                        variant="banner-image"
                        className="music-image-skeleton"
                    />
                )}
                <img
                    src={src}
                    alt={`Banner ${index + 1}`}
                    draggable={false}
                    className={[
                        ready ? '' : 'music-image-img--loading',
                        videoVisible ? 'music-banner-media--hidden' : '',
                    ].filter(Boolean).join(' ') || undefined}
                    onLoad={() => markSrcReady(src)}
                    onError={(e) => {
                        markSrcReady(src);
                        e.target.src = normalizeImagePath('/img/movie1.jpg');
                    }}
                />
                {isActiveCenter && videoSrc ? (
                    <video
                        ref={centerVideoRef}
                        className={`music-banner-video${videoVisible ? '' : ' music-banner-media--hidden'}`}
                        src={videoSrc}
                        muted={!unmuted}
                        playsInline
                        preload="auto"
                        draggable={false}
                        onEnded={handleVideoEnded}
                    />
                ) : null}
                {videoVisible ? (
                    <button
                        type="button"
                        className="music-banner-sound-btn"
                        onClick={handleToggleMute}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        aria-label={unmuted ? "Ovozni o'chirish" : 'Ovozni yoqish'}
                    >
                        {unmuted ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                            </svg>
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                <line x1="16" y1="9" x2="22" y2="15" />
                                <line x1="22" y1="9" x2="16" y2="15" />
                            </svg>
                        )}
                    </button>
                ) : null}
            </>
        );
    };

    if (musicBannersLoading && images.length === 0) {
        return (
            <div className="music-banner-container" ref={bannerRootRef}>
                <div
                    className="music-carousel music-carousel--skeleton"
                    aria-busy="true"
                    aria-label="Banner yuklanmoqda"
                >
                    <ul className="music-slides music-slides--skeleton">
                        {MUSIC_BANNER_SKELETON_SLIDES.map((slideClass) => (
                            <li key={slideClass} className={`music-image ${slideClass}`}>
                                <SkeletonLoader
                                    variant="banner-image"
                                    className="music-image-skeleton"
                                />
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        );
    }

    if (images.length === 0) return null;

    return (
        <div className="music-banner-container" ref={bannerRootRef}>
            <div
                className={`music-carousel ${isDragging ? 'is-dragging' : ''}`}
                ref={carouselRef}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseEnter={handleMouseEnter}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <button
                    className="music-nav-btn prev"
                    onClick={prevSlide}
                    aria-label="Oldingi rasm"
                >
                    &#10094;
                </button>

                <button
                    className="music-nav-btn next"
                    onClick={nextSlide}
                    aria-label="Keyingi rasm"
                >
                    &#10095;
                </button>

                <ul className="music-slides" ref={slidesRef}>
                    {images.map((image, index) => (
                        <li
                            key={`prev-${image.id || index}`}
                            className={`music-image ${getSlideClass(index - images.length)}`}
                            aria-hidden="true"
                            onClick={() => handleSlideClick(image)}
                            role={image.link ? 'button' : undefined}
                        >
                            {renderSlideContent(image, index)}
                        </li>
                    ))}

                    {images.map((image, index) => (
                        <li
                            key={image.id || index}
                            className={`music-image ${getSlideClass(index)}`}
                            aria-hidden={index !== currentIndex}
                            onClick={() => handleSlideClick(image)}
                            role={image.link ? 'button' : undefined}
                        >
                            {renderSlideContent(image, index, { isPrimaryCenter: true })}
                        </li>
                    ))}

                    {images.map((image, index) => (
                        <li
                            key={`next-${image.id || index}`}
                            className={`music-image ${getSlideClass(index + images.length)}`}
                            aria-hidden="true"
                            onClick={() => handleSlideClick(image)}
                            role={image.link ? 'button' : undefined}
                        >
                            {renderSlideContent(image, index)}
                        </li>
                    ))}
                </ul>

                <div className="music-dots">
                    {images.map((_, index) => (
                        <div
                            key={index}
                            className={`music-dot ${index === currentIndex ? 'active' : ''}`}
                            onClick={() => goToSlide(index)}
                            aria-label={`Rasm ${index + 1}ga o'tish`}
                            aria-current={index === currentIndex ? 'true' : 'false'}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MusicBanner;
