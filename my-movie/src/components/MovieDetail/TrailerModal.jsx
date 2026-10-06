import React, { useRef, useState, useEffect, useMemo } from 'react';
import { formatActionCount } from '../../utils/utils';
import { useTranslation } from 'react-i18next';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useMoviesApi } from '../../context/MoviesApiContext';
import LikeButton from '../../Music/LikeButton/LikeButton';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import VideoPlayerControls from '../VideoPlayerControls/VideoPlayerControls';
import SimilarTrailers from './SimilarTrailers';
import ViewCount from '../ViewCount/ViewCount';
import UploadedAtTime from '../UploadedAtTime/UploadedAtTime';
import ShareButton from '../ShareButton/ShareButton';
import TrillerDescription from '../Triller/TrillerDescription';
import { formatMovieRating } from '../Rating/CalculateRating';
import { normalizeTrailerDescription } from '../../utils/trailerDescription';
import './TrailerModal.css';

/** Trailer reytinglari — kinodagi maydonlar (alohida kiritilmaydi) */
const TRAILER_MOVIE_RATINGS = [
  { key: 'rating', src: '/img/vlplay_preview_rev_1.png', label: 'VL' },
  { key: 'ratingImdb', src: '/img/imdbnew.png', label: 'IMDb' },
  { key: 'ratingKinopoisk', src: '/img/kinopoisk.jpg', label: 'Kinopoisk' },
];

const hasMovieRating = (value) =>
  value != null && value !== '' && value !== 'none' && Number.isFinite(Number(value));

const getTrailerMovieRatings = (sourceMovie) => {
  if (!sourceMovie) return [];
  return TRAILER_MOVIE_RATINGS.reduce((list, item) => {
    const raw = sourceMovie[item.key];
    if (!hasMovieRating(raw)) return list;
    list.push({
      key: item.key,
      src: item.src,
      label: item.label,
      value: formatMovieRating(raw),
    });
    return list;
  }, []);
};

const TrailerModal = ({ movie, onClose, variant = 'modal', loading: externalLoading = false }) => {
  const isPage = variant === 'page';
  const overlayClass = isPage ? 'trailer-page-overlay' : 'trailer-modal-overlay';
  const { t } = useTranslation();
  const { contentLang } = useContentLanguage();
  const { allMovies } = useMoviesApi();
  const trailers = useMemo(() => {
    if (!movie) return [];
    if (movie.trailersVideo && Array.isArray(movie.trailersVideo)) {
      return movie.trailersVideo;
    }
    if (movie.trailers && Array.isArray(movie.trailers)) {
      return movie.trailers.map((tr) => ({
        id: tr.id,
        trailers: { uz: tr.url, ru: tr.url },
        title: { uz: tr.title, ru: tr.title },
      }));
    }
    return [];
  }, [movie]);
  const [selectedTrailer, setSelectedTrailer] = useState(trailers[0] || null);

  const getTrailerKey = (trailer) => {
    if (!trailer) return null;
    const movieId = trailer.movieId || movie?.id;
    return `${movieId}-${trailer.id}`;
  };

  const scrollAreaRef = useRef(null);
  const sheetDragRef = useRef({
    active: false,
    mode: null, // 'expand' | 'collapse'
    startY: 0,
    startX: 0,
    canDrag: false,
    locked: false,
    rawDy: 0,
    lastY: 0,
    lastT: 0,
    velocity: 0,
  });
  const sheetDragYRef = useRef(0);
  const isImmersiveVideoRef = useRef(false);
  const sheetSettlingRef = useRef(null);
  const settleTimerRef = useRef(null);
  const [trailerLoading, setTrailerLoading] = useState(true);
  const [isImmersiveVideo, setIsImmersiveVideo] = useState(false);
  const [sheetDragY, setSheetDragY] = useState(0);
  const [sheetDragProgress, setSheetDragProgress] = useState(0);
  const [isSheetDragging, setIsSheetDragging] = useState(false);
  const [sheetGesture, setSheetGesture] = useState(null); // 'expand' | 'collapse'
  const [sheetSettling, setSheetSettling] = useState(null); // 'expand' | 'collapse'
  const [sheetSnap, setSheetSnap] = useState(false); // transition o'chirish (bounce yo'q)

  useEffect(() => {
    if (!movie) {
      setSelectedTrailer(null);
      return;
    }
    setSelectedTrailer(trailers[0] || null);
    // faqat film almashganda birinchi trailerni tanlash
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movie?.id]);

  useEffect(() => {
    if (externalLoading || !movie) {
      setTrailerLoading(true);
      return undefined;
    }
    setTrailerLoading(true);
    const timer = setTimeout(() => setTrailerLoading(false), 120);
    return () => clearTimeout(timer);
  }, [externalLoading, movie?.id]);

  const showLoading = externalLoading || trailerLoading;

  const isMobileViewport = () => typeof window !== 'undefined' && window.innerWidth <= 969;
  const getSheetThreshold = () => (typeof window !== 'undefined' ? window.innerHeight : 800) * 0.35;
  const SHEET_ACTIVATE_PX = 18;
  const SHEET_FLING_VELOCITY = 0.72; // px/ms
  const SHEET_FLING_MIN_RATIO = 0.18; // fling uchun minimal yo'l (~6% ekran)
  const SHEET_SETTLE_MS = 420;

  const emptySheetDrag = () => ({
    active: false,
    mode: null,
    startY: 0,
    startX: 0,
    canDrag: false,
    locked: false,
    rawDy: 0,
    lastY: 0,
    lastT: 0,
    velocity: 0,
  });

  // Og'ir lekin silliq rubber: barmoqning ~42% i, chegaradan keyin yanada sekin
  const resistSheetDrag = (rawAbs) => {
    const threshold = getSheetThreshold();
    const tracked = Math.max(rawAbs, 0) * 0.42;
    if (tracked <= threshold) {
      const t = tracked / Math.max(threshold, 1);
      const smoothed = t * t * (3 - 2 * t); // smoothstep
      return smoothed * threshold * 0.88;
    }
    const over = tracked - threshold;
    return threshold * 0.88 + over * 0.18;
  };

  const setSheetDragYSafe = (y, progress = 0) => {
    sheetDragYRef.current = y;
    setSheetDragY(y);
    setSheetDragProgress(progress);
  };

  const clearSettleTimer = () => {
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
  };

  const resetSheetVisual = () => {
    setSheetDragYSafe(0, 0);
    setIsSheetDragging(false);
    setSheetGesture(null);
    setSheetSettling(null);
    sheetSettlingRef.current = null;
    sheetDragRef.current = emptySheetDrag();
  };

  const snapThenClearMotion = (apply) => {
    setSheetSnap(true);
    apply();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setSheetSnap(false));
    });
  };

  // Commit: avval progress=1 gacha silliq (scroll+controls birga), keyin mode switch
  const animateCommitExpand = () => {
    if (sheetSettlingRef.current === 'expand') return;
    clearSettleTimer();
    setIsSheetDragging(false);
    setSheetGesture('expand');
    setSheetSettling('expand');
    sheetSettlingRef.current = 'expand';
    requestAnimationFrame(() => {
      // translate push yo'q — gap yaratmasin; faqat progress
      setSheetDragYSafe(0, 1);
    });
    settleTimerRef.current = setTimeout(() => {
      sheetSettlingRef.current = null;
      snapThenClearMotion(() => {
        isImmersiveVideoRef.current = true;
        setIsImmersiveVideo(true);
        setSheetSettling(null);
        setSheetGesture(null);
        setSheetDragYSafe(0, 0);
      });
    }, SHEET_SETTLE_MS);
  };

  const animateCommitCollapse = () => {
    if (sheetSettlingRef.current === 'collapse') return;
    clearSettleTimer();
    setIsSheetDragging(false);
    setSheetGesture('collapse');
    setSheetSettling('collapse');
    sheetSettlingRef.current = 'collapse';
    requestAnimationFrame(() => {
      setSheetDragYSafe(0, 1);
    });
    settleTimerRef.current = setTimeout(() => {
      sheetSettlingRef.current = null;
      snapThenClearMotion(() => {
        isImmersiveVideoRef.current = false;
        setIsImmersiveVideo(false);
        setSheetSettling(null);
        setSheetGesture(null);
        setSheetDragYSafe(0, 0);
      });
    }, SHEET_SETTLE_MS);
  };

  const collapseImmersiveVideo = ({ instant = false } = {}) => {
    if (!instant && isMobileViewport() && isImmersiveVideoRef.current && !sheetSettlingRef.current) {
      animateCommitCollapse();
      return;
    }
    clearSettleTimer();
    isImmersiveVideoRef.current = false;
    setIsImmersiveVideo(false);
    resetSheetVisual();
  };

  const expandImmersiveVideo = ({ instant = false } = {}) => {
    if (!instant && isMobileViewport() && !isImmersiveVideoRef.current && !sheetSettlingRef.current) {
      animateCommitExpand();
      return;
    }
    clearSettleTimer();
    isImmersiveVideoRef.current = true;
    setIsImmersiveVideo(true);
    resetSheetVisual();
  };

  const updateSheetVelocity = (clientY) => {
    const now = performance.now();
    const prev = sheetDragRef.current;
    const dt = Math.max(now - (prev.lastT || now), 1);
    const vy = (clientY - (prev.lastY || clientY)) / dt;
    sheetDragRef.current.lastY = clientY;
    sheetDragRef.current.lastT = now;
    sheetDragRef.current.velocity = prev.velocity * 0.65 + vy * 0.35;
  };

  const shouldCommitSheet = (rawAbs, velocitySigned, direction) => {
    const threshold = getSheetThreshold();
    if (rawAbs >= threshold) return true;
    const flingOk =
      direction === 'expand'
        ? velocitySigned >= SHEET_FLING_VELOCITY
        : velocitySigned <= -SHEET_FLING_VELOCITY;
    return flingOk && rawAbs >= threshold * SHEET_FLING_MIN_RATIO;
  };

  const handleTrailerSelect = (trailer) => {
    setSelectedTrailer(trailer);
    collapseImmersiveVideo({ instant: true });
  };

  /** Reyting: trailerni egasi bo‘lgan kinodan (alohida maydon yo‘q) */
  const ratingSourceMovie = useMemo(() => {
    const trailerMovieId = selectedTrailer?.movieId;
    if (trailerMovieId != null) {
      const found = allMovies?.find((m) => Number(m.id) === Number(trailerMovieId));
      if (found) return found;
    }
    return movie || null;
  }, [selectedTrailer, movie, allMovies]);

  const movieRatings = useMemo(
    () => getTrailerMovieRatings(ratingSourceMovie),
    [ratingSourceMovie]
  );

  const trailerShare = useMemo(() => {
    if (!selectedTrailer) return null;
    const movieId = selectedTrailer.movieId ?? movie?.id;
    const trailerId = selectedTrailer.id;
    if (movieId == null || trailerId == null) return null;
    const title =
      selectedTrailer.title?.[contentLang] ||
      selectedTrailer.title?.uz ||
      selectedTrailer.title?.ru ||
      ratingSourceMovie?.title?.[contentLang] ||
      ratingSourceMovie?.title?.uz ||
      ratingSourceMovie?.title?.ru ||
      '';
    return {
      sharePath: `/movie/${movieId}/trailer?trailerId=${trailerId}`,
      movie: { id: movieId, title },
    };
  }, [selectedTrailer, movie?.id, contentLang, ratingSourceMovie]);

  /** TrillerDescription: nested text + yil/davlat/janr (legacy string ham) */
  const trailerDescription = useMemo(() => {
    const base = normalizeTrailerDescription(selectedTrailer?.text);
    if (!base) return null;

    const fill = (langBlock, lang) => {
      if (!langBlock) return langBlock;
      const desc = ratingSourceMovie?.description?.[lang] || {};
      const genreArr = desc.genre || ratingSourceMovie?.genre?.[lang];
      const genre =
        langBlock.genre ||
        (Array.isArray(genreArr) ? genreArr.join(', ') : genreArr ? String(genreArr) : '') ||
        '';
      return {
        ...langBlock,
        year:
          langBlock.year ||
          (desc.year != null ? String(desc.year) : '') ||
          (ratingSourceMovie?.specs?.year != null ? String(ratingSourceMovie.specs.year) : ''),
        country:
          langBlock.country ||
          (desc.country != null ? String(desc.country) : '') ||
          '',
        genre: genre ? String(genre) : '',
      };
    };

    return {
      uz: fill(base.uz, 'uz'),
      ru: fill(base.ru, 'ru'),
    };
  }, [selectedTrailer?.text, ratingSourceMovie]);

  // —— Expand: scroll-area pastga ——
  const handleSheetTouchStart = (e) => {
    if (!isMobileViewport() || isImmersiveVideoRef.current || sheetSettlingRef.current) return;
    const scrollEl = scrollAreaRef.current;
    if (!scrollEl || scrollEl.scrollTop > 2) return;
    const touch = e.touches[0];
    if (!touch) return;
    const now = performance.now();
    sheetDragRef.current = {
      active: true,
      mode: 'expand',
      startY: touch.clientY,
      startX: touch.clientX,
      canDrag: true,
      locked: false,
      rawDy: 0,
      lastY: touch.clientY,
      lastT: now,
      velocity: 0,
    };
  };

  const handleSheetTouchMove = (e) => {
    const drag = sheetDragRef.current;
    if (!drag.active || drag.mode !== 'expand' || !drag.canDrag || isImmersiveVideoRef.current || sheetSettlingRef.current) return;
    const touch = e.touches[0];
    if (!touch) return;
    const rawDy = touch.clientY - drag.startY;
    const dx = Math.abs(touch.clientX - drag.startX);

    if (rawDy < -SHEET_ACTIVATE_PX && !drag.locked) {
      sheetDragRef.current.canDrag = false;
      resetSheetVisual();
      return;
    }

    if (rawDy <= 0) return;

    if (!drag.locked) {
      if (rawDy < SHEET_ACTIVATE_PX || rawDy < dx * 1.15) return;
      sheetDragRef.current.locked = true;
      setSheetGesture('expand');
      setIsSheetDragging(true);
    }

    if (e.cancelable) e.preventDefault();
    updateSheetVelocity(touch.clientY);
    sheetDragRef.current.rawDy = rawDy;
    const threshold = getSheetThreshold();
    // Translate gap yaratadi (controls va scroll ajraladi) — faqat progress
    const progress = Math.min(rawDy / (threshold * 1.25), 1);
    setSheetDragYSafe(0, progress);
  };

  const handleSheetTouchEnd = () => {
    const drag = sheetDragRef.current;
    if (!drag.active || drag.mode !== 'expand') return;
    const rawDy = drag.rawDy;
    const velocity = drag.velocity;
    const wasLocked = drag.locked;
    sheetDragRef.current = emptySheetDrag();
    setIsSheetDragging(false);

    if (wasLocked && shouldCommitSheet(rawDy, velocity, 'expand')) {
      // progress=0 ga tashlamasdan — settle animatsiya
      expandImmersiveVideo();
    } else {
      setSheetGesture(null);
      requestAnimationFrame(() => setSheetDragYSafe(0, 0));
    }
  };

  // —— Collapse: immersive ichida yuqoriga (teskari sheet) ——
  const isCollapseIgnoreTarget = (target) => {
    if (!(target instanceof Element)) return false;
    return Boolean(
      target.closest('.trailer-modal-control-btn')
      || target.closest('.trailer-modal-progress-container')
      || target.closest('.trailer-modal-icon-btn')
      || target.closest('input')
      || target.closest('.trailer-modal-speed-menu')
      || target.closest('.watch-settings-modal')
      || target.closest('.watch-settings-modal-backdrop')
    );
  };

  const handleCollapseTouchStart = (e) => {
    if (!isMobileViewport() || !isImmersiveVideoRef.current || sheetSettlingRef.current) return;
    if (isCollapseIgnoreTarget(e.target)) return;
    const touch = e.touches[0];
    if (!touch) return;
    const now = performance.now();
    sheetDragRef.current = {
      active: true,
      mode: 'collapse',
      startY: touch.clientY,
      startX: touch.clientX,
      canDrag: true,
      locked: false,
      rawDy: 0,
      lastY: touch.clientY,
      lastT: now,
      velocity: 0,
    };
  };

  const handleCollapseTouchMove = (e) => {
    const drag = sheetDragRef.current;
    if (!drag.active || drag.mode !== 'collapse' || !drag.canDrag || !isImmersiveVideoRef.current || sheetSettlingRef.current) return;
    const touch = e.touches[0];
    if (!touch) return;
    const rawDy = touch.clientY - drag.startY; // yuqoriga = manfiy
    const upDy = -rawDy;
    const dx = Math.abs(touch.clientX - drag.startX);

    if (rawDy > SHEET_ACTIVATE_PX && !drag.locked) {
      sheetDragRef.current.canDrag = false;
      resetSheetVisual();
      return;
    }

    if (upDy <= 0) return;

    if (!drag.locked) {
      if (upDy < SHEET_ACTIVATE_PX || upDy < dx * 1.15) return;
      sheetDragRef.current.locked = true;
      setSheetGesture('collapse');
      setIsSheetDragging(true);
    }

    if (e.cancelable) e.preventDefault();
    updateSheetVelocity(touch.clientY);
    sheetDragRef.current.rawDy = rawDy;
    const threshold = getSheetThreshold();
    const progress = Math.min(upDy / (threshold * 1.25), 1);
    setSheetDragYSafe(0, progress);
  };

  const handleCollapseTouchEnd = () => {
    const drag = sheetDragRef.current;
    if (!drag.active || drag.mode !== 'collapse') return;
    const upDy = Math.max(-drag.rawDy, 0);
    const velocity = drag.velocity;
    const wasLocked = drag.locked;
    const threshold = getSheetThreshold();
    const progressSnapshot = Math.min(upDy / (threshold * 1.25), 1);
    sheetDragRef.current = emptySheetDrag();
    setIsSheetDragging(false);

    if (wasLocked && shouldCommitSheet(upDy, velocity, 'collapse')) {
      collapseImmersiveVideo();
    } else if (wasLocked && progressSnapshot > 0.02) {
      requestAnimationFrame(() => {
        setSheetDragYSafe(0, 0);
        requestAnimationFrame(() => setSheetGesture(null));
      });
    } else {
      setSheetGesture(null);
      setSheetDragYSafe(0, 0);
    }
  };

  const handleExpandToggle = (e) => {
    e.stopPropagation();
    if (isImmersiveVideoRef.current || isImmersiveVideo) collapseImmersiveVideo();
    else expandImmersiveVideo();
  };

  const trailerModalClassName = [
    'trailer-modal',
    isImmersiveVideo ? 'trailer-modal--immersive' : '',
    isSheetDragging ? 'trailer-modal--sheet-dragging' : '',
    (sheetGesture === 'collapse' || sheetSettling === 'collapse') ? 'trailer-modal--collapsing' : '',
    sheetSettling === 'expand' ? 'trailer-modal--expanding' : '',
    sheetSnap ? 'trailer-modal--snap' : '',
  ].filter(Boolean).join(' ');

  const trailerModalStyle = isMobileViewport()
    ? {
        '--trailer-sheet-drag-y': `${sheetDragY}px`,
        '--trailer-sheet-progress': sheetDragProgress,
      }
    : undefined;

  // Scroll bloklash: faqat modal rejimida
  useEffect(() => {
    if (isPage) return undefined;
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyPaddingRight = body.style.paddingRight;
    const scrollbarW = window.innerWidth - html.clientWidth;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    if (scrollbarW > 0) body.style.paddingRight = `${scrollbarW}px`;
    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.style.paddingRight = prevBodyPaddingRight;
    };
  }, [isPage]);

  useEffect(() => {
    isImmersiveVideoRef.current = isImmersiveVideo;
  }, [isImmersiveVideo]);

  useEffect(() => () => {
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
  }, []);

  const collapseMovedRef = useRef(false);

  const handlePinTouchStart = (e) => {
    collapseMovedRef.current = false;
    handleCollapseTouchStart(e);
  };

  const handlePinTouchMove = (e) => {
    handleCollapseTouchMove(e);
    if (sheetDragRef.current.mode === 'collapse' && sheetDragRef.current.locked) {
      collapseMovedRef.current = true;
    }
  };

  const handlePinTouchEnd = () => {
    handleCollapseTouchEnd();
  };

  if (!showLoading && (!trailers || trailers.length === 0)) {
    return (
      <div className={overlayClass} onClick={isPage ? undefined : onClose}>
        <div className="trailer-modal" onClick={(e) => e.stopPropagation()}>
          <div className="trailer-modal-no-trailers">
            <p>No trailers available</p>
          </div>
        </div>
      </div>
    );
  }

  const handleOverlayClick = (e) => {
    if (isPage) return;
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className={overlayClass} onClick={handleOverlayClick}>
      <div
        className={trailerModalClassName}
        style={trailerModalStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="trailer-modal-pin"
          onTouchStart={handlePinTouchStart}
          onTouchMove={handlePinTouchMove}
          onTouchEnd={handlePinTouchEnd}
          onTouchCancel={handlePinTouchEnd}
        >
            {(selectedTrailer || showLoading) && (
              <VideoPlayerControls
                loading={showLoading}
                src={
                  selectedTrailer?.trailers?.[contentLang] ||
                  selectedTrailer?.trailers?.uz ||
                  selectedTrailer?.trailers?.ru ||
                  ''
                }
                resetKey={getTrailerKey(selectedTrailer)}
                className=""
                videoClassName="trailer-modal-video"
                objectFit="contain"
                onExpandToggle={isMobileViewport() ? handleExpandToggle : undefined}
                expanded={isImmersiveVideo}
              />
            )}
          </div>

        <div
          className="trailer-modal-scroll-area"
          ref={scrollAreaRef}
          onTouchStart={handleSheetTouchStart}
          onTouchMove={handleSheetTouchMove}
          onTouchEnd={handleSheetTouchEnd}
          onTouchCancel={handleSheetTouchEnd}
        >
            {(selectedTrailer || showLoading) && (
              <div className="trailer-modal-controls-info">
                {showLoading ? (
                  <>
                    <SkeletonLoader variant="trailer-modal-controls-title" />
                    <div className="trailer-modal-controls-actions">
                      <div className="trailer-modal-controls-likes">
                        <SkeletonLoader variant="trailer-modal-controls-action" />
                        <SkeletonLoader variant="trailer-modal-controls-action" />
                      </div>
                      <div className="trailer-modal-controls-ratings" aria-hidden="true">
                        <SkeletonLoader variant="trailer-modal-controls-action" />
                        <SkeletonLoader variant="trailer-modal-controls-action" />
                      </div>
                    </div>
                    <TrillerDescription loading className="trailer-modal-controls-text" />
                  </>
                ) : selectedTrailer ? (
                  <>
                    <div className="trailer-modal-controls-title">
                      {selectedTrailer.title?.[contentLang] || selectedTrailer.title?.uz || selectedTrailer.title?.ru || ''}
                    </div>
                    <div className="view-count-meta-row trailer-modal-meta-row">
                      <ViewCount
                        key={getTrailerKey(selectedTrailer)}
                        itemId={getTrailerKey(selectedTrailer)}
                        type="trailer"
                        variant="text"
                        className="view-count-text trailer-modal-view-count"
                      />
                      <UploadedAtTime
                        at={selectedTrailer.createdAt || selectedTrailer.uploadedAt}
                        className="trailer-modal-uploaded-at"
                      />
                    </div>
                    <div className="trailer-modal-controls-actions">
                      <div className="trailer-modal-controls-likes">
                        <LikeButton
                          key={getTrailerKey(selectedTrailer) || 'trailer'}
                          variant="trailerModal"
                          contentId={getTrailerKey(selectedTrailer)}
                          persistTrailerKey={getTrailerKey(selectedTrailer)}
                          initialLikeCount={selectedTrailer.like}
                          initialDislikeCount={selectedTrailer.dislike}
                          countFormatter={formatActionCount}
                        />
                      </div>
                      {movieRatings.length > 0 ? (
                        <div className="trailer-modal-controls-ratings" aria-label="Reytinglar">
                          {movieRatings.map((item) => (
                            <span
                              key={item.key}
                              className="trailer-modal-rating"
                              aria-label={`${item.label} ${item.value}`}
                            >
                              <img
                                className="trailer-modal-rating-img"
                                src={item.src}
                                alt=""
                              />
                              <span className="trailer-modal-rating-value">{item.value}</span>
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {trailerShare ? (
                        <div className="trailer-modal-share-wrap">
                          <ShareButton
                            movie={trailerShare.movie}
                            sharePath={trailerShare.sharePath}
                            dropdownInPortal
                            icon="send"
                            label={t('share.share', 'Ulashish')}
                          />
                        </div>
                      ) : null}
                    </div>
                    {trailerDescription ? (
                      <TrillerDescription
                        description={trailerDescription}
                        className="trailer-modal-controls-text"
                      />
                    ) : null}
                  </>
                ) : null}
              </div>
            )}

            {(selectedTrailer || showLoading) && (
              showLoading ? (
                <SkeletonLoader
                  variant="similar-trailers-title"
                  className="trailer-modal-sticky-similar-title trailer-modal-sticky-similar-title--skeleton"
                />
              ) : (
                <h4 className="similar-trailers-title trailer-modal-sticky-similar-title">
                  {t('detail.similarTrailers')}
                </h4>
              )
            )}

            <div className="trailer-modal-sidebar">
              <SimilarTrailers
                trailerLoading={showLoading}
                currentMovie={movie}
                selectedTrailer={selectedTrailer}
                onTrailerSelect={handleTrailerSelect}
                getTrailerKey={getTrailerKey}
                hideTitleOnMobile
              />
            </div>
          </div>
      </div>
    </div>
  );
};

export default TrailerModal;