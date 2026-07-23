import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import HorizontalScroll from '../HorizontalScroll/HorizontalScroll';
import { useMoviesApi } from '../../context/MoviesApiContext';
import { normalizeImagePath } from '../../utils/utils';
import { matchId } from '../../utils/musicDataUtils';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import { useImageReady, useImagesReadyMap } from '../../utils/useImageReady';
import './VideoBanner.css';

const RATING_IMGS = {
  netflix: '/img/netflix.jpg',
  imdb: '/img/imdb.jpg',
  kinopoisk: '/img/kinopoisk.jpg',
  vl: '/img/photo_2026-02-16_20-30-31_preview_rev_1.png',
};

const RATING_SKELETON_COUNT = 4;
const VIDEO_READY_TIMEOUT_MS = 20000;

/** Bitta banner kartochkasi — video + title/name/rating to‘liq tayyor bo‘lguncha skeleton */
const VideoBannerCard = ({
  banner,
  movie,
  contentLang,
  moviesLoading,
  unmuted,
  onToggleMute,
  onEnded,
  onOpen,
  cardRef,
  videoRef,
}) => {
  const videoElRef = useRef(null);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  const isMovie = banner.type === 'movie';
  const videoSrc = normalizeImagePath(banner.video || '');

  const titleImgSrcRaw = isMovie
    ? movie?.titleImg?.[contentLang] ||
      movie?.titleImg?.uz ||
      movie?.titleImg?.ru ||
      ''
    : typeof banner.titleImage === 'string'
      ? banner.titleImage
      : banner.titleImage?.[contentLang] ||
        banner.titleImage?.uz ||
        banner.titleImage?.ru ||
        '';

  const nameImgSrcRaw = !isMovie && banner.nameImg ? banner.nameImg : '';
  const titleImgSrc = titleImgSrcRaw ? normalizeImagePath(titleImgSrcRaw) : '';
  const nameImgSrc = nameImgSrcRaw ? normalizeImagePath(nameImgSrcRaw) : '';

  const titleImg = useImageReady(titleImgSrc);
  const nameImg = useImageReady(nameImgSrc);

  const ratings =
    isMovie && movie
      ? {
          rating: movie.rating,
          ratingImdb: movie.ratingImdb,
          ratingKinopoisk: movie.ratingKinopoisk,
          ratingNetflix: movie.ratingNetflix,
        }
      : null;

  const ratingEntries = useMemo(() => {
    if (!ratings) return [];
    const list = [];
    if (ratings.ratingNetflix != null) {
      list.push({ key: 'netflix', src: normalizeImagePath(RATING_IMGS.netflix), value: ratings.ratingNetflix, alt: 'Netflix' });
    }
    if (ratings.ratingImdb != null) {
      list.push({ key: 'imdb', src: normalizeImagePath(RATING_IMGS.imdb), value: ratings.ratingImdb, alt: 'IMDb' });
    }
    if (ratings.ratingKinopoisk != null) {
      list.push({ key: 'kinopoisk', src: normalizeImagePath(RATING_IMGS.kinopoisk), value: ratings.ratingKinopoisk, alt: 'Kinopoisk' });
    }
    if (ratings.rating != null) {
      list.push({ key: 'vl', src: normalizeImagePath(RATING_IMGS.vl), value: ratings.rating, alt: 'Vl', vl: true });
    }
    return list;
  }, [ratings]);

  const { readyMap: ratingLogosReady, markReady: markRatingReady } =
    useImagesReadyMap(ratingEntries);

  useEffect(() => {
    setVideoReady(false);
    setVideoFailed(false);
  }, [videoSrc, banner.id]);

  useEffect(() => {
    if (!videoSrc || videoReady || videoFailed) return undefined;

    const check = () => {
      const el = videoElRef.current;
      if (el && el.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        setVideoReady(true);
        setVideoFailed(false);
      }
    };

    check();
    const intervalId = window.setInterval(check, 200);
    const timeoutId = window.setTimeout(() => {
      const el = videoElRef.current;
      if (el && el.readyState >= HTMLMediaElement.HAVE_METADATA) {
        setVideoReady(true);
      } else {
        setVideoFailed(true);
      }
    }, VIDEO_READY_TIMEOUT_MS);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [videoSrc, videoReady, videoFailed]);

  const markVideoReady = (e) => {
    const el = e?.currentTarget || videoElRef.current;
    if (el && el.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      setVideoReady(true);
      setVideoFailed(false);
    }
  };

  const waitingMovieMeta = isMovie && moviesLoading && !movie;
  const titlePending = Boolean(titleImgSrc) && titleImg.showSkeleton;
  const namePending = Boolean(nameImgSrc) && nameImg.showSkeleton;
  const ratingsPending =
    waitingMovieMeta ||
    (ratingEntries.length > 0 &&
      ratingEntries.some((r) => !ratingLogosReady[r.key]));

  const showVideoSkeleton = Boolean(videoSrc) && !videoReady && !videoFailed;

  /* Content — video yoki title/name/rating hali tayyor emas */
  const showContentSkeleton =
    showVideoSkeleton ||
    waitingMovieMeta ||
    titlePending ||
    namePending ||
    (isMovie && ratingsPending && (ratingEntries.length > 0 || waitingMovieMeta));

  /* Title/name wrap har doim ko‘rinsin (loader yoki rasm) */
  const showTitleWrap = Boolean(titleImgSrc) || waitingMovieMeta || showVideoSkeleton;
  const showNameWrap = Boolean(nameImgSrc) || (!isMovie && showVideoSkeleton);

  const setVideoNode = useCallback(
    (el) => {
      videoElRef.current = el;
      if (typeof videoRef === 'function') videoRef(el);
      else if (videoRef) videoRef.current = el;
    },
    [videoRef]
  );

  return (
    <div
      ref={cardRef}
      data-banner-id={banner.id}
      className={`video-banner-card${showContentSkeleton || showVideoSkeleton ? ' video-banner-card--loading' : ''}`}
      onClick={() => !showVideoSkeleton && onOpen?.(banner)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (showVideoSkeleton) return;
        if (e.key === 'Enter') onOpen?.(banner);
      }}
      aria-busy={showVideoSkeleton || showContentSkeleton || undefined}
    >
      <div className="video-banner-video-wrap">
        {showVideoSkeleton && (
          <SkeletonLoader
            variant="video-banner-video"
            className="video-banner-video-skeleton"
          />
        )}
        {!videoFailed && videoSrc && (
          <video
            ref={setVideoNode}
            key={videoSrc}
            className={`video-banner-video${showVideoSkeleton ? ' video-banner-video--loading' : ''}`}
            src={videoSrc}
            muted={!unmuted}
            playsInline
            preload="auto"
            autoPlay={false}
            onLoadedData={markVideoReady}
            onLoadedMetadata={markVideoReady}
            onCanPlay={markVideoReady}
            onError={() => {
              setVideoFailed(true);
              setVideoReady(false);
            }}
            onEnded={() => onEnded?.(banner.id)}
          />
        )}
        <div className="video-banner-overlay" />
        {!showVideoSkeleton && (
          <button
            type="button"
            className="video-banner-sound-btn"
            onClick={(e) => onToggleMute?.(e, banner.id)}
            aria-label={unmuted ? "Ovozni o'chirish" : 'Ovozni yoqish'}
          >
            {unmuted ? (
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
        )}
      </div>

      <div className="video-banner-content">
        {isMovie ? (
          <>
            {showTitleWrap && (
              <div className="video-banner-title-img-wrap">
                {(titlePending || !titleImgSrc || showVideoSkeleton || waitingMovieMeta) && (
                  <SkeletonLoader
                    variant="video-banner-title"
                    className="video-banner-title-img-skeleton"
                  />
                )}
                {titleImgSrc && (
                  <img
                    ref={titleImg.imgRef}
                    src={titleImgSrc}
                    alt=""
                    className={`video-banner-title-img${
                      titlePending || showVideoSkeleton ? ' video-banner-img--loading' : ''
                    }`}
                    onLoad={titleImg.onLoad}
                    onError={titleImg.onError}
                  />
                )}
              </div>
            )}
            {(ratingEntries.length > 0 || waitingMovieMeta || showVideoSkeleton) && (
              <div className="video-banner-ratings">
                {showContentSkeleton || ratingsPending
                  ? Array.from({ length: RATING_SKELETON_COUNT }, (_, i) => (
                      <SkeletonLoader
                        key={`vb-rating-${banner.id}-${i}`}
                        variant="video-banner-rating"
                        className="video-banner-rating-item-skeleton"
                      />
                    ))
                  : ratingEntries.map((r) => (
                      <span
                        key={r.key}
                        className={`video-banner-rating-item${r.vl ? ' video-banner-rating-vl' : ''}`}
                      >
                        <img
                          src={r.src}
                          alt={r.alt}
                          onLoad={() => markRatingReady(r.key)}
                          onError={() => markRatingReady(r.key)}
                        />
                        <span>{r.value}</span>
                      </span>
                    ))}
              </div>
            )}
          </>
        ) : (
          <>
            {showTitleWrap && (
              <div className="video-banner-title-img-wrap">
                {(titlePending || !titleImgSrc || showVideoSkeleton) && (
                  <SkeletonLoader
                    variant="video-banner-title"
                    className="video-banner-title-img-skeleton"
                  />
                )}
                {titleImgSrc && (
                  <img
                    ref={titleImg.imgRef}
                    src={titleImgSrc}
                    alt=""
                    className={`video-banner-title-img${
                      titlePending || showVideoSkeleton ? ' video-banner-img--loading' : ''
                    }`}
                    onLoad={titleImg.onLoad}
                    onError={titleImg.onError}
                  />
                )}
              </div>
            )}
            {showNameWrap && (
              <div className="video-banner-name-img-wrap">
                {(namePending || !nameImgSrc || showVideoSkeleton) && (
                  <SkeletonLoader
                    variant="video-banner-name"
                    className="video-banner-name-img-skeleton"
                  />
                )}
                {nameImgSrc && (
                  <img
                    ref={nameImg.imgRef}
                    src={nameImgSrc}
                    alt=""
                    className={`video-banner-name-img${
                      namePending || showVideoSkeleton ? ' video-banner-img--loading' : ''
                    }`}
                    onLoad={nameImg.onLoad}
                    onError={nameImg.onError}
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

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

  const filteredBanners = useMemo(
    () => getVideoBannersByType(typeFilter),
    [getVideoBannersByType, typeFilter]
  );

  const showSectionSkeleton =
    (videoBannersLoading || moviesLoading) && filteredBanners.length === 0;

  const getNavigatePath = (banner) => {
    if (banner.type === 'movie') return `/movie/${banner.refId}`;
    if (banner.type === 'music') return `/music/video/${banner.refId}`;
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

                return (
                  <VideoBannerCard
                    key={banner.id}
                    banner={banner}
                    movie={movie}
                    contentLang={contentLang}
                    moviesLoading={moviesLoading}
                    unmuted={Boolean(unmutedIds[banner.id])}
                    onToggleMute={toggleMute}
                    onEnded={handleVideoEnded}
                    onOpen={handleBannerClick}
                    cardRef={(el) => {
                      cardRefs.current[banner.id] = el;
                    }}
                    videoRef={(el) => {
                      videoRefs.current[banner.id] = el;
                    }}
                  />
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
