import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { normalizeImagePath } from '../../utils/utils';
import { getLocalizedText } from '../../utils/utils';
import { musicBanner } from '../../dataMusic/musicBanner';
import './MusicBanner.css';

const MusicBanner = () => {
    const navigate = useNavigate();
    const { i18n } = useTranslation();
    const lang = i18n.language || 'uz';
    const images = useMemo(() => {
        return musicBanner.map((item) => ({
            id: item.id,
            src: typeof item.img === 'object' ? getLocalizedText(item.img, lang) : item.img,
            link: item.buttonId ? `/music/${item.buttonId}` : null
        })).filter((img) => img.src);
    }, [lang]);

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
        if (!slidesRef.current || images.length === 0) return;

        const slideWidth = slidesRef.current.querySelector('.music-image')?.offsetWidth || 0;
        const containerWidth = carouselRef.current?.offsetWidth || 0;

        // Gap foizda - CSS bilan bir xil (2% of container)
        const gap = containerWidth * 0.01;

        // Clone rasmlar uchun offset (images.length rasmdan keyin boshlanadi)
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

    // Slayd pozitsiyalarini hisoblash
    const getSlideClass = (index) => {
        const total = images.length;
        if (total === 0) return 'hidden';

        const normalizedCurrent = currentIndex;
        const normalizedIndex = ((index % total) + total) % total;

        const prevIndex = (normalizedCurrent - 1 + total) % total;
        const nextIndex = (normalizedCurrent + 1) % total;

        const diff = index - currentIndex;

        if (diff === 0) return 'center';
        if (diff === -1 || diff === total - 1) return 'left';
        if (diff === 1 || diff === -(total - 1)) return 'right';

        return 'hidden';
    };

    if (images.length === 0) return null;

    return (
        <div className="music-banner-container">
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
                    {/* Oldingi rasmlar (clone) - infinite effect uchun */}
                    {images.map((image, index) => (
                        <li
                            key={`prev-${image.id || index}`}
                            className={`music-image ${getSlideClass(index - images.length)}`}
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
                    ))}

                    {/* Asosiy rasmlar */}
                    {images.map((image, index) => (
                        <li
                            key={image.id || index}
                            className={`music-image ${getSlideClass(index)}`}
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
                    ))}

                    {/* Keyingi rasmlar (clone) - infinite effect uchun */}
                    {images.map((image, index) => (
                        <li
                            key={`next-${image.id || index}`}
                            className={`music-image ${getSlideClass(index + images.length)}`}
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
