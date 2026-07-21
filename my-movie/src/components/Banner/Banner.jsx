import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useMoviesApi } from '../../context/MoviesApiContext';
import { normalizeImagePath } from '../../utils/utils';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import './Banner.css';

const BANNER_SKELETON_SLIDES = ['left', 'center', 'right'];

const Banner = () => {
    const navigate = useNavigate();
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
            const movie = movies.find((m) => m.id === banner.movieId);
            const movieImg = movie?.homeImg?.[contentLang] || movie?.homeImg?.uz || movie?.homeImg?.ru;
            const src = banner.image || movieImg || '';
            return {
                id: banner.id,
                src,
                link: banner.movieId ? `/movie/${banner.movieId}` : null
            };
        }).filter((img) => img.src);
    }, [currentBanners, contentLang, allMovies]);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isUserInteracting, setIsUserInteracting] = useState(false);
    const startXRef = useRef(0);
    const currentXRef = useRef(0);
    const carouselRef = useRef(null);
    const slidesRef = useRef(null);
    const autoPlayIntervalRef = useRef(null);
    const dragStartTimeRef = useRef(0);
    const wasDragRef = useRef(false);

    const startAutoPlay = useCallback(() => {
        stopAutoPlay();
        autoPlayIntervalRef.current = setInterval(() => {
            if (!isUserInteracting) {
                setCurrentIndex(prev => (prev + 1) % images.length);
            }
        }, 5000);
    }, [images.length, isUserInteracting]);

    const stopAutoPlay = useCallback(() => {
        if (autoPlayIntervalRef.current) {
            clearInterval(autoPlayIntervalRef.current);
            autoPlayIntervalRef.current = null;
        }
    }, []);

    const resetAutoPlay = useCallback(() => {
        stopAutoPlay();
        if (!isUserInteracting) {
            startAutoPlay();
        }
    }, [isUserInteracting, startAutoPlay, stopAutoPlay]);

    const goToSlide = useCallback((index) => {
        if (index >= 0 && index < images.length) {
            setCurrentIndex(index);
            setDragOffset(0);
            resetAutoPlay();
        }
    }, [images.length, resetAutoPlay]);

    const nextSlide = useCallback(() => {
        setCurrentIndex(prev => (prev + 1) % images.length);
        setDragOffset(0);
        resetAutoPlay();
    }, [images.length, resetAutoPlay]);

    const prevSlide = useCallback(() => {
        setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
        setDragOffset(0);
        resetAutoPlay();
    }, [images.length, resetAutoPlay]);

    const handleDragStart = (clientX) => {
        wasDragRef.current = false;
        setIsDragging(true);
        setIsUserInteracting(true);
        startXRef.current = clientX;
        currentXRef.current = clientX;
        dragStartTimeRef.current = Date.now();
        stopAutoPlay();
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
        resetAutoPlay();
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
        stopAutoPlay();
    };

    const handleMouseLeave = () => {
        if (!isDragging) {
            setIsUserInteracting(false);
            startAutoPlay();
        }
    };

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                stopAutoPlay();
            } else if (!isUserInteracting) {
                startAutoPlay();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isUserInteracting, startAutoPlay, stopAutoPlay]);

    useEffect(() => {
        let resizeTimer;
        const handleResize = () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                setCurrentIndex(prev => prev);
            }, 250);
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(resizeTimer);
        };
    }, []);

    useEffect(() => {
        if (images.length > 0) {
            startAutoPlay();
        }
        return () => stopAutoPlay();
    }, [images.length, startAutoPlay, stopAutoPlay]);

    useEffect(() => {
        if (!slidesRef.current || !carouselRef.current || images.length === 0) return;

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

    const renderSlideContent = (image, index) => {
        return (
            <img
                src={normalizeImagePath(image.src)}
                alt={`Banner ${index + 1}`}
                draggable={false}
                onError={(e) => {
                    e.target.src = normalizeImagePath('/img/no-image.png');
                }}
            />
        );
    };

    if (bannersLoading) {
        return (
            <div className="banner">
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
        <div className="banner">
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
                            onClick={() => !bannersLoading && handleSlideClick(image)}
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
                            onClick={() => !bannersLoading && handleSlideClick(image)}
                            role={image.link ? 'button' : undefined}
                        >
                            {renderSlideContent(image, index)}
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
                            onClick={() => !bannersLoading && handleSlideClick(image)}
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
