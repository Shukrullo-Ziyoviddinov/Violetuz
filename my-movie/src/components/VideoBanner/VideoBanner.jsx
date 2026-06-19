import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import HorizontalScroll from '../HorizontalScroll/HorizontalScroll';
import { banners } from '../../data/VideoBannerData';
import { allMovies } from '../../data/movies';
import { normalizeImagePath } from '../../utils/utils';
import './VideoBanner.css';

const RATING_IMGS = {
  netflix: '/img/netflix.jpg',
  imdb: '/img/imdb.jpg',
  kinopoisk: '/img/kinopoisk.jpg',
  vl: '/img/photo_2026-02-16_20-30-31_preview_rev_1.png'
};

const VideoBanner = ({ typeFilter }) => {
  const navigate = useNavigate();
  const { contentLang } = useContentLanguage();
  const videoRefs = useRef({});
  const cardRefs = useRef({});
  const scrollToIndexRef = useRef(null);
  const [unmutedIds, setUnmutedIds] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);

  const filteredBanners = useMemo(() => {
    if (!typeFilter) return banners;
    return banners.filter((b) => b.type === typeFilter);
  }, [typeFilter]);

  const getNavigatePath = (banner) => {
    if (banner.type === 'movie') {
      return `/movie/${banner.refId}`;
    }
    if (banner.type === 'music') {
      return `/music/video/${banner.refId}`;
    }
    return null;
  };

  const handleBannerClick = (banner) => {
    const path = getNavigatePath(banner);
    if (path) navigate(path);
  };

  useEffect(() => {
    const entries = Object.entries(cardRefs.current).filter(([, el]) => el);
    if (entries.length === 0) return;

    const observer = new IntersectionObserver(
      (observationEntries) => {
        observationEntries.forEach((entry) => {
          const bannerId = Number(entry.target.dataset.bannerId);
          const video = videoRefs.current[bannerId];
          if (!video) return;
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
            video.currentTime = 0;
          }
        });
      },
      { threshold: 0.3, rootMargin: '0px' }
    );

    entries.forEach(([id, el]) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [filteredBanners]);

  const toggleMute = (e, bannerId) => {
    e.stopPropagation();
    setUnmutedIds((prev) => ({ ...prev, [bannerId]: !prev[bannerId] }));
  };

  const handleVideoEnded = (bannerId) => {
    const idx = filteredBanners.findIndex((b) => b.id === bannerId);
    if (idx < 0) return;
    const nextIdx = idx + 1;
    const scrollFn = scrollToIndexRef.current;
    if (scrollFn) {
      if (nextIdx < filteredBanners.length) scrollFn(nextIdx);
      else scrollFn(0);
    }
  };

  return (
    <div className="video-banner">
      <div className="video-banner-container">
        <HorizontalScroll
          scrollAmount={400}
          alwaysShowButtons
          scrollToIndexRef={scrollToIndexRef}
          onScrollIndexChange={setCurrentIndex}
        >
        {filteredBanners.map((banner, index) => {
          const isMovie = banner.type === 'movie';
          const movie = isMovie ? allMovies.find((m) => m.id === banner.refId) : null;

          const titleImgSrc = isMovie
            ? (movie?.titleImg?.[contentLang] || movie?.titleImg?.uz || movie?.titleImg?.ru)
            : (typeof banner.titleImage === 'string'
                ? banner.titleImage
                : (banner.titleImage?.[contentLang] || banner.titleImage?.uz || banner.titleImage?.ru));

          const ratings = isMovie && movie
            ? {
                rating: movie.rating,
                ratingImdb: movie.ratingImdb,
                ratingKinopoisk: movie.ratingKinopoisk,
                ratingNetflix: movie.ratingNetflix
              }
            : null;

          return (
            <div
              key={banner.id}
              ref={(el) => (cardRefs.current[banner.id] = el)}
              data-banner-id={banner.id}
              className="video-banner-card"
              onClick={() => handleBannerClick(banner)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleBannerClick(banner)}
            >
              <div className="video-banner-video-wrap">
                <video
                  ref={(el) => (videoRefs.current[banner.id] = el)}
                  className="video-banner-video"
                  src={normalizeImagePath(banner.video)}
                  muted={!unmutedIds[banner.id]}
                  playsInline
                  autoPlay={false}
                  onEnded={() => handleVideoEnded(banner.id)}
                />
                <div className="video-banner-overlay" />
                <button
                  type="button"
                  className="video-banner-sound-btn"
                  onClick={(e) => toggleMute(e, banner.id)}
                  aria-label={unmutedIds[banner.id] ? 'Ovozni o\'chirish' : 'Ovozni yoqish'}
                >
                  {unmutedIds[banner.id] ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <line x1="16" y1="9" x2="22" y2="15" />
                      <line x1="22" y1="9" x2="16" y2="15" />
                    </svg>
                  )}
                </button>
              </div>

              <div className="video-banner-content">
                {isMovie ? (
                  <>
                    {titleImgSrc && (
                      <img
                        src={normalizeImagePath(titleImgSrc)}
                        alt=""
                        className="video-banner-title-img"
                      />
                    )}
                    {ratings && (
                      <div className="video-banner-ratings">
                        {ratings.ratingNetflix != null && (
                          <span className="video-banner-rating-item">
                            <img src={normalizeImagePath(RATING_IMGS.netflix)} alt="Netflix" />
                            <span>{ratings.ratingNetflix}</span>
                          </span>
                        )}
                        {ratings.ratingImdb != null && (
                          <span className="video-banner-rating-item">
                            <img src={normalizeImagePath(RATING_IMGS.imdb)} alt="IMDb" />
                            <span>{ratings.ratingImdb}</span>
                          </span>
                        )}
                        {ratings.ratingKinopoisk != null && (
                          <span className="video-banner-rating-item">
                            <img src={normalizeImagePath(RATING_IMGS.kinopoisk)} alt="Kinopoisk" />
                            <span>{ratings.ratingKinopoisk}</span>
                          </span>
                        )}
                        {ratings.rating != null && (
                          <span className="video-banner-rating-item video-banner-rating-vl">
                            <img src={normalizeImagePath(RATING_IMGS.vl)} alt="Vl" />
                            <span>{ratings.rating}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {titleImgSrc && (
                      <img
                        src={normalizeImagePath(titleImgSrc)}
                        alt=""
                        className="video-banner-title-img"
                      />
                    )}
                    {banner.nameImg && (
                      <img
                        src={normalizeImagePath(banner.nameImg)}
                        alt=""
                        className="video-banner-name-img"
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
        </HorizontalScroll>
        {filteredBanners.length > 1 && (
          <span className="video-banner-counter">
            {currentIndex + 1}/{filteredBanners.length}
          </span>
        )}
      </div>
    </div>
  );
};

export default VideoBanner;
