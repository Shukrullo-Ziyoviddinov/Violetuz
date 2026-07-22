import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import HorizontalScroll from '../HorizontalScroll/HorizontalScroll';
import { useMoviesApi } from '../../context/MoviesApiContext';
import { normalizeImagePath } from '../../utils/utils';
import { matchId } from '../../utils/musicDataUtils';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import './VideoBanner.css';

const RATING_IMGS = {
  netflix: '/img/netflix.jpg',
  imdb: '/img/imdb.jpg',
  kinopoisk: '/img/kinopoisk.jpg',
  vl: '/img/photo_2026-02-16_20-30-31_preview_rev_1.png',
};

const RATING_SKELETON_COUNT = 4;

const VideoBanner = ({ typeFilter }) => {
  const navigate = useNavigate();
  const { contentLang } = useContentLanguage();
  const {
    allMovies,
    getVideoBannersByType,
    videoBannersLoading,
    moviesLoading,
  } = useMoviesApi();
  const videoRefs = useRef({});
  const cardRefs = useRef({});
  const scrollToIndexRef = useRef(null);
  const [unmutedIds, setUnmutedIds] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadedVideos, setLoadedVideos] = useState({});
  const [loadedTitleImgs, setLoadedTitleImgs] = useState({});
  const [loadedNameImgs, setLoadedNameImgs] = useState({});

  const filteredBanners = useMemo(
    () => getVideoBannersByType(typeFilter),
    [getVideoBannersByType, typeFilter]
  );

  const showSectionSkeleton =
    videoBannersLoading && filteredBanners.length === 0;

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

    entries.forEach(([, el]) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [filteredBanners, showSectionSkeleton]);

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

  const markVideoLoaded = (bannerId) => {
    setLoadedVideos((prev) => (prev[bannerId] ? prev : { ...prev, [bannerId]: true }));
  };

  const renderSkeletonCard = (key) => (
    <div key={key} className="video-banner-card video-banner-card--skeleton" aria-hidden="true">
      <div className="video-banner-video-wrap">
        <SkeletonLoader
          variant="video-banner-video"
          className="video-banner-video-skeleton"
        />
      </div>
      <div className="video-banner-content">
        <SkeletonLoader
          variant="video-banner-title"
          className="video-banner-title-img-skeleton"
        />
        <div className="video-banner-ratings">
          {Array.from({ length: RATING_SKELETON_COUNT }, (_, i) => (
            <SkeletonLoader
              key={`vb-rating-sk-${i}`}
              variant="video-banner-rating"
              className="video-banner-rating-item-skeleton"
            />
          ))}
        </div>
        <SkeletonLoader
          variant="video-banner-name"
          className="video-banner-name-img-skeleton"
        />
      </div>
    </div>
  );

  return (
    <div className="video-banner" aria-busy={showSectionSkeleton || undefined}>
      <div className="video-banner-container">
        <HorizontalScroll
          scrollAmount={400}
          alwaysShowButtons={!showSectionSkeleton}
          scrollToIndexRef={scrollToIndexRef}
          onScrollIndexChange={setCurrentIndex}
        >
          {showSectionSkeleton
            ? renderSkeletonCard('video-banner-section-skeleton')
            : filteredBanners.map((banner) => {
                const isMovie = banner.type === 'movie';
                const movie = isMovie
                  ? (Array.isArray(allMovies) ? allMovies : []).find((m) =>
                      matchId(m.id, banner.refId)
                    )
                  : null;

                const titleImgSrc = isMovie
                  ? movie?.titleImg?.[contentLang] ||
                    movie?.titleImg?.uz ||
                    movie?.titleImg?.ru
                  : typeof banner.titleImage === 'string'
                    ? banner.titleImage
                    : banner.titleImage?.[contentLang] ||
                      banner.titleImage?.uz ||
                      banner.titleImage?.ru;

                const ratings =
                  isMovie && movie
                    ? {
                        rating: movie.rating,
                        ratingImdb: movie.ratingImdb,
                        ratingKinopoisk: movie.ratingKinopoisk,
                        ratingNetflix: movie.ratingNetflix,
                      }
                    : null;

                const showVideoSkeleton = !loadedVideos[banner.id];
                const showTitleSkeleton = Boolean(titleImgSrc) && !loadedTitleImgs[banner.id];
                const showNameSkeleton =
                  !isMovie && Boolean(banner.nameImg) && !loadedNameImgs[banner.id];
                const showRatingsSkeleton = isMovie && moviesLoading && !movie;

                return (
                  <div
                    key={banner.id}
                    ref={(el) => {
                      cardRefs.current[banner.id] = el;
                    }}
                    data-banner-id={banner.id}
                    className="video-banner-card"
                    onClick={() => handleBannerClick(banner)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleBannerClick(banner)}
                  >
                    <div className="video-banner-video-wrap">
                      {showVideoSkeleton && (
                        <SkeletonLoader
                          variant="video-banner-video"
                          className="video-banner-video-skeleton"
                        />
                      )}
                      <video
                        ref={(el) => {
                          videoRefs.current[banner.id] = el;
                        }}
                        className={`video-banner-video${showVideoSkeleton ? ' video-banner-video--loading' : ''}`}
                        src={normalizeImagePath(banner.video)}
                        muted={!unmutedIds[banner.id]}
                        playsInline
                        autoPlay={false}
                        onLoadedData={() => markVideoLoaded(banner.id)}
                        onCanPlay={() => markVideoLoaded(banner.id)}
                        onEnded={() => handleVideoEnded(banner.id)}
                      />
                      <div className="video-banner-overlay" />
                      <button
                        type="button"
                        className="video-banner-sound-btn"
                        onClick={(e) => toggleMute(e, banner.id)}
                        aria-label={
                          unmutedIds[banner.id] ? "Ovozni o'chirish" : 'Ovozni yoqish'
                        }
                      >
                        {unmutedIds[banner.id] ? (
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                          </svg>
                        ) : (
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
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
                          {(titleImgSrc || moviesLoading) && (
                            <div className="video-banner-title-img-wrap">
                              {showTitleSkeleton || (!titleImgSrc && moviesLoading) ? (
                                <SkeletonLoader
                                  variant="video-banner-title"
                                  className="video-banner-title-img-skeleton"
                                />
                              ) : null}
                              {titleImgSrc ? (
                                <img
                                  src={normalizeImagePath(titleImgSrc)}
                                  alt=""
                                  className={`video-banner-title-img${showTitleSkeleton ? ' video-banner-img--loading' : ''}`}
                                  onLoad={() =>
                                    setLoadedTitleImgs((p) => ({
                                      ...p,
                                      [banner.id]: true,
                                    }))
                                  }
                                />
                              ) : null}
                            </div>
                          )}
                          {(ratings || showRatingsSkeleton) && (
                            <div className="video-banner-ratings">
                              {showRatingsSkeleton
                                ? Array.from({ length: RATING_SKELETON_COUNT }, (_, i) => (
                                    <SkeletonLoader
                                      key={`vb-rating-${banner.id}-${i}`}
                                      variant="video-banner-rating"
                                      className="video-banner-rating-item-skeleton"
                                    />
                                  ))
                                : (
                                  <>
                                    {ratings.ratingNetflix != null && (
                                      <span className="video-banner-rating-item">
                                        <img
                                          src={normalizeImagePath(RATING_IMGS.netflix)}
                                          alt="Netflix"
                                        />
                                        <span>{ratings.ratingNetflix}</span>
                                      </span>
                                    )}
                                    {ratings.ratingImdb != null && (
                                      <span className="video-banner-rating-item">
                                        <img
                                          src={normalizeImagePath(RATING_IMGS.imdb)}
                                          alt="IMDb"
                                        />
                                        <span>{ratings.ratingImdb}</span>
                                      </span>
                                    )}
                                    {ratings.ratingKinopoisk != null && (
                                      <span className="video-banner-rating-item">
                                        <img
                                          src={normalizeImagePath(RATING_IMGS.kinopoisk)}
                                          alt="Kinopoisk"
                                        />
                                        <span>{ratings.ratingKinopoisk}</span>
                                      </span>
                                    )}
                                    {ratings.rating != null && (
                                      <span className="video-banner-rating-item video-banner-rating-vl">
                                        <img
                                          src={normalizeImagePath(RATING_IMGS.vl)}
                                          alt="Vl"
                                        />
                                        <span>{ratings.rating}</span>
                                      </span>
                                    )}
                                  </>
                                )}
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {titleImgSrc && (
                            <div className="video-banner-title-img-wrap">
                              {showTitleSkeleton && (
                                <SkeletonLoader
                                  variant="video-banner-title"
                                  className="video-banner-title-img-skeleton"
                                />
                              )}
                              <img
                                src={normalizeImagePath(titleImgSrc)}
                                alt=""
                                className={`video-banner-title-img${showTitleSkeleton ? ' video-banner-img--loading' : ''}`}
                                onLoad={() =>
                                  setLoadedTitleImgs((p) => ({
                                    ...p,
                                    [banner.id]: true,
                                  }))
                                }
                              />
                            </div>
                          )}
                          {banner.nameImg && (
                            <div className="video-banner-name-img-wrap">
                              {showNameSkeleton && (
                                <SkeletonLoader
                                  variant="video-banner-name"
                                  className="video-banner-name-img-skeleton"
                                />
                              )}
                              <img
                                src={normalizeImagePath(banner.nameImg)}
                                alt=""
                                className={`video-banner-name-img${showNameSkeleton ? ' video-banner-img--loading' : ''}`}
                                onLoad={() =>
                                  setLoadedNameImgs((p) => ({
                                    ...p,
                                    [banner.id]: true,
                                  }))
                                }
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
        </HorizontalScroll>
        {showSectionSkeleton ? (
          <span className="video-banner-counter video-banner-counter--skeleton">
            <SkeletonLoader
              variant="video-banner-counter"
              className="video-banner-counter-skeleton"
            />
          </span>
        ) : (
          filteredBanners.length > 1 && (
            <span className="video-banner-counter">
              {currentIndex + 1}/{filteredBanners.length}
            </span>
          )
        )}
      </div>
    </div>
  );
};

export default VideoBanner;
