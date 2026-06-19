import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { bannerImages } from '../../data/banners';
import { allMovies } from '../../data/movies';
import { normalizeImagePath } from '../../utils/utils';
import './Banner.css';

const Banner = () => {
    const navigate = useNavigate();
    const { contentLang } = useContentLanguage();
    const currentBanners = bannerImages[contentLang] || bannerImages.uz || bannerImages.ru || [];

    const images = useMemo(() => {
        return currentBanners.map((banner) => {
            const movie = allMovies.find((m) => m.id === banner.movieId);
            const movieImg = movie?.homeImg?.[contentLang] || movie?.homeImg?.uz || movie?.homeImg?.ru;
            const src = banner.image || movieImg || '';
            return {
                id: banner.id,
                src,
                link: banner.movieId ? `/movie/${banner.movieId}` : null
            };
        }).filter((img) => img.src);
    }, [currentBanners, contentLang]);

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

    // Auto-play funksiyalari
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

    // Slayd o'tish funksiyalari
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

    // Drag boshlanishi
    const handleDragStart = (clientX) => {
        wasDragRef.current = false;
        setIsDragging(true);
        setIsUserInteracting(true);
        startXRef.current = clientX;
        currentXRef.current = clientX;
        dragStartTimeRef.current = Date.now();
        stopAutoPlay();
    };

    // Drag harakati
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

    // Drag tugashi
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

    // Mouse drag
    const handleMouseDown = (e) => {
        e.preventDefault();
        handleDragStart(e.pageX);
    };

    // Touch events
    const handleTouchStart = (e) => {
        handleDragStart(e.touches[0].clientX);
    };

    const handleTouchMove = (e) => {
        handleDragMove(e.touches[0].clientX);
    };

    const handleTouchEnd = () => {
        handleDragEnd();
    };

    // Document event listeners for drag
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

    // Keyboard navigation
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

    // Mouse enter/leave
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

    // Visibility change
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                stopAutoPlay();
            } else {
                if (!isUserInteracting) {
                    startAutoPlay();
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isUserInteracting, startAutoPlay, stopAutoPlay]);

    // Window resize
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

    // Auto-play boshlash
    useEffect(() => {
        if (images.length > 0) {
            startAutoPlay();
        }
        return () => stopAutoPlay();
    }, [images.length, startAutoPlay, stopAutoPlay]);

    // Rasmlarni markazlash uchun transform hisoblash
    useEffect(() => {
        if (!slidesRef.current || !carouselRef.current || images.length === 0) return;

        const slidesEl = slidesRef.current;
        const carouselEl = carouselRef.current;

        const updateTransform = () => {
            if (!slidesEl || !carouselEl) return;

            const containerWidth = carouselEl.offsetWidth;
            const slidesStyle = getComputedStyle(slidesEl);
            const gap = parseFloat(slidesStyle.columnGap) || parseFloat(slidesStyle.gap) || 8;

            // Markazdagi slayd elementini olish (asosiy blokdagi currentIndex)
            const centerSlideIndex = images.length + currentIndex;
            const centerSlide = slidesEl.children[centerSlideIndex];
            const slideWidth = centerSlide?.offsetWidth ?? slidesEl.querySelector('.manga-image')?.offsetWidth ?? containerWidth * 0.44;

            // Markazdagi slaydning chap chetidan viewport markazigacha bo'lgan masofa
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

        // Layout tugagach hisoblash
        const rafId = requestAnimationFrame(() => {
            requestAnimationFrame(updateTransform);
        });

        // Konteyner o'lchami o'zgarganda qayta hisoblash
        const resizeObserver = new ResizeObserver(() => {
            requestAnimationFrame(updateTransform);
        });
        resizeObserver.observe(carouselEl);

        return () => {
            cancelAnimationFrame(rafId);
            resizeObserver.disconnect();
        };
    }, [currentIndex, dragOffset, isDragging, images.length]);

    // Slayd pozitsiyalarini hisoblash
    const getSlideClass = (index) => {
        const total = images.length;
        if (total === 0) return 'hidden';

        // Check if this slide should be visible
        const diff = index - currentIndex;

        if (diff === 0) return 'center';
        if (diff === -1 || diff === total - 1) return 'left';
        if (diff === 1 || diff === -(total - 1)) return 'right';

        return 'hidden';
    };

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
                    {/* Oldingi rasmlar (clone) - infinite effect uchun */}
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
                            <img
                                src={normalizeImagePath(image.src)}
                                alt={`Banner ${index + 1}`}
                                draggable={false}
                                onError={(e) => {
                                    e.target.src = normalizeImagePath('/img/no-image.png');
                                }}
                            />
                        </li>
                        );
                    })}

                    {/* Asosiy rasmlar */}
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
                            <img
                                src={normalizeImagePath(image.src)}
                                alt={`Banner ${index + 1}`}
                                draggable={false}
                                onError={(e) => {
                                    e.target.src = normalizeImagePath('/img/no-image.png');
                                }}
                            />
                        </li>
                        );
                    })}

                    {/* Keyingi rasmlar (clone) - infinite effect uchun */}
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
                            <img
                                src={normalizeImagePath(image.src)}
                                alt={`Banner ${index + 1}`}
                                draggable={false}
                                onError={(e) => {
                                    e.target.src = normalizeImagePath('/img/no-image.png');
                                }}
                            />
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
