import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useMoviesApi } from '../../context/MoviesApiContext';
import { normalizeImagePath } from '../../utils/utils';
import { matchId } from '../../utils/musicDataUtils';
import { formatMovieRating } from '../Rating/CalculateRating';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import './Banner.css';

const RATING_LOGOS = {
    vl: '/img/photo_2026-02-16_20-30-31_preview_rev_1.png',
    imdb: '/img/imdb.jpg',
    kp: '/img/kinopoisk.jpg',
    netflix: '/img/netflix.jpg',
};

const hasRatingValue = (value) => value != null && value !== '' && value !== 'none';

const linkedMovieId = (movieId) => {
    const n = Number(movieId);
    return Number.isInteger(n) && n > 0 ? n : null;
};

const pickLocalized = (value, lang) => {
    if (!value) return '';
    if (typeof value === 'string') return value.trim();
    const picked = value[lang] || value.uz || value.ru || '';
    return String(picked).trim();
};

const BANNER_SKELETON_SLIDES = ['left', 'center', 'right'];
/** Broken/slow CDN — skeleton ushlab qolmasin */
const BANNER_IMAGE_READY_TIMEOUT_MS = 20000;
/** Rasm ko‘rinib turadi, keyin video */
const BANNER_VIDEO_REVEAL_MS = 5000;

const Banner = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { contentLang } = useContentLanguage();
    const { allMovies, getBannersByLang, bannersLoading } = useMoviesApi();
    const currentBanners = useMemo(() => {
        const byLang = getBannersByLang(contentLang);
        if (byLang.length) return byLang;
        const uz = getBannersByLang('uz');
        if (uz.length) return uz;
        return getBannersByLang('ru');
    }, [contentLang, getBannersByLang]);

    const images = useMemo(() => {
        const movies = Array.isArray(allMovies) ? allMovies : [];
        return currentBanners.map((banner) => {
            const movieId = linkedMovieId(banner.movieId);
            const movie = movieId ? movies.find((m) => matchId(m.id, movieId)) : null;
            const movieImg = movie?.homeImg?.[contentLang] || movie?.homeImg?.uz || movie?.homeImg?.ru;
            const src = banner.image || movieImg || '';
            const manualTitleImg = String(banner.titleImg || '').trim();
            const manualTitle = String(banner.title || '').trim();
            const movieTitleImg = movie ? pickLocalized(movie.titleImg, contentLang) : '';
            const movieTitleText = movie ? pickLocalized(movie.title, contentLang) : '';
            const titleImg = manualTitleImg || movieTitleImg;
            return {
                id: banner.id,
                src,
                video: banner.video || '',
                movieId,
                link: movieId ? `/movie/${movieId}` : null,
                titleImg,
                titleText: manualTitle,
                titleFallback: movieTitleText,
                description: String(banner.description || '').trim(),
                category: movie?.category || '',
                rating: movie?.rating,
                ratingImdb: movie?.ratingImdb,
                ratingKinopoisk: movie?.ratingKinopoisk,
                ratingNetflix: movie?.ratingNetflix,
                specs: movie?.specs || null,
            };
        }).filter((img) => img.src);
    }, [currentBanners, contentLang, allMovies]);

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
    const [failedTitleKeys, setFailedTitleKeys] = useState(() => new Set());
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

    /* API tugagach ham rasmlar to‘liq yuklanmaguncha skeleton qoladi */
    useEffect(() => {
        setLoadedSrcs(new Set());
    }, [imageSrcKey]);

    useEffect(() => {
        if (bannersLoading || images.length === 0) return undefined;

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
        }, BANNER_IMAGE_READY_TIMEOUT_MS);

        return () => {
            window.clearTimeout(timeoutId);
            preloaders.forEach((img) => {
                img.onload = null;
                img.onerror = null;
            });
        };
    }, [bannersLoading, images, imageSrcKey, markSrcReady]);

    const allBannerImagesReady =
        images.length > 0 &&
        images.every((img) => loadedSrcs.has(normalizeImagePath(img.src)));

    const showBannerSkeleton =
        bannersLoading || (images.length > 0 && !allBannerImagesReady);

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

    /* Pastga scroll — banner ko‘rinishi pasayganda video o‘chadi, rasm qaytadi */
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
    }, [clearVideoTimers, pauseCenterVideo, showBannerSkeleton, images.length]);

    /* Rasm → 5s → video; video tugasa keyingi slayd */
    useEffect(() => {
        if (!allBannerImagesReady || images.length === 0) return undefined;
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
                }, BANNER_VIDEO_REVEAL_MS);
            }
        }, BANNER_VIDEO_REVEAL_MS);

        return () => clearVideoTimers();
    }, [
        currentIndex,
        bannerInView,
        isUserInteracting,
        isDragging,
        allBannerImagesReady,
        images,
        clearVideoTimers,
        pauseCenterVideo,
        nextSlide,
    ]);

    /* Center video play/pause — hover (isUserInteracting) video ni to‘xtatmaydi */
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
        if (!slidesRef.current || !carouselRef.current || images.length === 0 || !allBannerImagesReady) {
            return;
        }

        const slidesEl = slidesRef.current;
        const carouselEl = carouselRef.current;

        const updateTransform = () => {
            if (!slidesEl || !carouselEl) return;

            const containerWidth = carouselEl.offsetWidth;
            const slidesStyle = getComputedStyle(slidesEl);
            const gap = parseFloat(slidesStyle.columnGap) || parseFloat(slidesStyle.gap) || 8;

            const centerSlideIndex = images.length + currentIndex;
            const centerSlide = slidesEl.children[centerSlideIndex];
            const slideWidth = centerSlide?.offsetWidth ?? slidesEl.querySelector('.manga-image')?.offsetWidth ?? containerWidth * 0.44;

            const centerSlideLeft = centerSlideIndex * (slideWidth + gap);
            const centerSlideCenter = centerSlideLeft + slideWidth / 2;
            const viewportCenter = containerWidth / 2;
            const offset = viewportCenter - centerSlideCenter;

            if (isDragging) {
                slidesEl.style.transition = 'none';
                slidesEl.style.transform = `translateX(${offset + dragOffset}px)`;
            } else {
                slidesEl.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                slidesEl.style.transform = `translateX(${offset}px)`;
            }
        };

        const rafId = requestAnimationFrame(() => {
            requestAnimationFrame(updateTransform);
        });

        const resizeObserver = new ResizeObserver(() => {
            requestAnimationFrame(updateTransform);
        });
        resizeObserver.observe(carouselEl);

        return () => {
            cancelAnimationFrame(rafId);
            resizeObserver.disconnect();
        };
    }, [currentIndex, dragOffset, isDragging, images.length, allBannerImagesReady]);

    const getSlideClass = (index) => {
        const total = images.length;
        if (total === 0) return 'hidden';

        const diff = index - currentIndex;

        if (diff === 0) return 'center';
        if (diff === -1 || diff === total - 1) return 'left';
        if (diff === 1 || diff === -(total - 1)) return 'right';

        return 'hidden';
    };

    const renderBannerMeta = (image) => {
        const titleKey = `${image.id}:${image.titleImg}`;
        const showTitleImg = Boolean(image.titleImg) && !failedTitleKeys.has(titleKey);
        const titleText = image.titleText || (!showTitleImg ? image.titleFallback : '');
        const description = image.description || '';
        const hasCopy = showTitleImg || Boolean(titleText) || Boolean(description);
        if (!image?.movieId && !hasCopy) return null;

        const ratings = [
            image.category !== 'anonslar' && hasRatingValue(image.rating)
                ? { key: 'vl', src: RATING_LOGOS.vl, value: formatMovieRating(image.rating), alt: 'Rating' }
                : null,
            hasRatingValue(image.ratingImdb)
                ? { key: 'imdb', src: RATING_LOGOS.imdb, value: formatMovieRating(image.ratingImdb), alt: 'IMDb' }
                : null,
            hasRatingValue(image.ratingKinopoisk)
                ? { key: 'kp', src: RATING_LOGOS.kp, value: formatMovieRating(image.ratingKinopoisk), alt: 'Kinopoisk' }
                : null,
            hasRatingValue(image.ratingNetflix)
                ? { key: 'netflix', src: RATING_LOGOS.netflix, value: formatMovieRating(image.ratingNetflix), alt: 'Netflix' }
                : null,
        ].filter(Boolean);

        const specs = image.specs;
        const specItems = [];
        if (specs?.duration != null && specs.duration !== '') {
            specItems.push({
                key: 'duration',
                label: t('detail.duration'),
                value: `${specs.duration} min`,
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                    </svg>
                ),
            });
        }
        if (specs?.ageRating) {
            specItems.push({
                key: 'age',
                label: t('detail.ageRating'),
                value: specs.ageRating,
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                ),
            });
        }
        if (specs?.year) {
            specItems.push({
                key: 'year',
                label: t('detail.year'),
                value: specs.year,
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                ),
            });
        }
        if (Array.isArray(specs?.countries) && specs.countries.length > 0) {
            specItems.push({
                key: 'countries',
                label: t('detail.countries'),
                value: specs.countries.join(', '),
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                ),
            });
        }
        if (Array.isArray(specs?.languages) && specs.languages.length > 0) {
            specItems.push({
                key: 'languages',
                label: t('detail.languages'),
                value: specs.languages.join(', '),
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m5 8 6 6" />
                        <path d="m4 14 6-6 2-3" />
                        <path d="M2 5h12" />
                        <path d="M7 2h1" />
                        <path d="m22 22-5-10-5 10" />
                        <path d="M14 18h6" />
                    </svg>
                ),
            });
        }

        if (!hasCopy && ratings.length === 0 && specItems.length === 0) return null;

        return (
            <div className="manga-banner-meta">
                {showTitleImg || titleText ? (
                    <div className="manga-banner-title">
                        {showTitleImg ? (
                            <img
                                className="manga-banner-title-img"
                                src={normalizeImagePath(image.titleImg)}
                                alt={titleText || image.titleFallback || ''}
                                draggable={false}
                                onError={() => {
                                    setFailedTitleKeys((prev) => {
                                        if (prev.has(titleKey)) return prev;
                                        const next = new Set(prev);
                                        next.add(titleKey);
                                        return next;
                                    });
                                }}
                            />
                        ) : null}
                        {titleText ? <h2 className="manga-banner-title-text">{titleText}</h2> : null}
                    </div>
                ) : null}
                {description ? <p className="manga-banner-description">{description}</p> : null}
                {ratings.length > 0 ? (
                    <div className="movie-detail-rating">
                        {ratings.map((rating) => (
                            <div key={rating.key} className="movie-detail-rating-item">
                                <img
                                    src={normalizeImagePath(rating.src)}
                                    alt={rating.alt}
                                    className="movie-detail-rating-logo"
                                    draggable={false}
                                />
                                <span className="movie-detail-rating-value rating-value-display">{rating.value}</span>
                            </div>
                        ))}
                    </div>
                ) : null}
                {specItems.length > 0 ? (
                    <div className="movie-detail-specs-container">
                        {specItems.map((item) => (
                            <div
                                key={item.key}
                                className="movie-detail-spec-item"
                                title={item.label}
                                aria-label={`${item.label}: ${item.value}`}
                            >
                                <span className="movie-detail-spec-icon" aria-hidden="true">{item.icon}</span>
                                <span className="movie-detail-spec-value">{item.value}</span>
                            </div>
                        ))}
                    </div>
                ) : null}
            </div>
        );
    };

    const renderSlideContent = (image, index, { isPrimaryCenter = false } = {}) => {
        const src = normalizeImagePath(image.src);
        const videoSrc = normalizeImagePath(image.video);
        const isActiveCenter = isPrimaryCenter && index === currentIndex;
        const videoVisible = isActiveCenter && showCenterVideo && Boolean(videoSrc);

        return (
            <>
                <img
                    className={videoVisible ? 'manga-banner-media--hidden' : undefined}
                    src={src}
                    alt={`Banner ${index + 1}`}
                    draggable={false}
                    onLoad={() => markSrcReady(src)}
                    onError={(e) => {
                        markSrcReady(src);
                        e.target.src = normalizeImagePath('/img/movie1.jpg');
                    }}
                />
                {isActiveCenter && videoSrc ? (
                    <video
                        ref={centerVideoRef}
                        className={`manga-banner-video${videoVisible ? '' : ' manga-banner-media--hidden'}`}
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
                        className="manga-banner-sound-btn"
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
                {isActiveCenter ? renderBannerMeta(image) : null}
            </>
        );
    };

    if (showBannerSkeleton) {
        return (
            <div className="banner" ref={bannerRootRef}>
                <div className="banner-container">
                    <div
                        className="manga-carousel manga-carousel--skeleton"
                        aria-busy="true"
                        aria-label="Banner yuklanmoqda"
                    >
                        <ul className="manga-slides manga-slides--skeleton">
                            {BANNER_SKELETON_SLIDES.map((slideClass) => (
                                <li key={slideClass} className={`manga-image ${slideClass}`}>
                                    <SkeletonLoader
                                        variant="banner-image"
                                        className="manga-image-skeleton loader-skeleton"
                                    />
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

    if (images.length === 0) return null;

    return (
        <div className="banner" ref={bannerRootRef}>
            <div className="banner-container">
            <div
                className={`manga-carousel ${isDragging ? 'is-dragging' : ''}`}
                ref={carouselRef}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseEnter={handleMouseEnter}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <button
                    className="manga-nav-btn prev"
                    onClick={prevSlide}
                    aria-label="Oldingi rasm"
                >
                    &#10094;
                </button>

                <button
                    className="manga-nav-btn next"
                    onClick={nextSlide}
                    aria-label="Keyingi rasm"
                >
                    &#10095;
                </button>

                <ul className="manga-slides" ref={slidesRef}>
                    {images.map((image, index) => {
                        const slideClass = getSlideClass(index - images.length);
                        return (
                        <li
                            key={`prev-${image.id || index}`}
                            className={`manga-image ${slideClass}`}
                            aria-hidden="true"
                            onClick={() => handleSlideClick(image)}
                            role={image.link ? 'button' : undefined}
                        >
                            {renderSlideContent(image, index)}
                        </li>
                        );
                    })}

                    {images.map((image, index) => {
                        const slideClass = getSlideClass(index);
                        return (
                        <li
                            key={image.id || index}
                            className={`manga-image ${slideClass}`}
                            aria-hidden={index !== currentIndex}
                            onClick={() => handleSlideClick(image)}
                            role={image.link ? 'button' : undefined}
                        >
                            {renderSlideContent(image, index, { isPrimaryCenter: true })}
                        </li>
                        );
                    })}

                    {images.map((image, index) => {
                        const slideClass = getSlideClass(index + images.length);
                        return (
                        <li
                            key={`next-${image.id || index}`}
                            className={`manga-image ${slideClass}`}
                            aria-hidden="true"
                            onClick={() => handleSlideClick(image)}
                            role={image.link ? 'button' : undefined}
                        >
                            {renderSlideContent(image, index)}
                        </li>
                        );
                    })}
                </ul>

                <div className="manga-dots">
                    {images.map((_, index) => (
                        <div
                            key={index}
                            className={`manga-dot ${index === currentIndex ? 'active' : ''}`}
                            onClick={() => goToSlide(index)}
                            aria-label={`Rasm ${index + 1}ga o'tish`}
                            aria-current={index === currentIndex ? 'true' : 'false'}
                        />
                    ))}
                </div>
            </div>
            </div>
        </div>
    );
};

export default Banner;
