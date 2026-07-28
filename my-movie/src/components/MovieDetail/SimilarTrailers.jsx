import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useMoviesApi } from '../../context/MoviesApiContext';
import { formatActionCount } from '../../utils/utils';
import LikeButton from '../../Music/LikeButton/LikeButton';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import VerticalScroll from './VerticalScroll';
import './SimilarTrailers.css';

const VIDEO_READY_TIMEOUT_MS = 25000;

/** Haqiqiy video freym chizilguncha kutadi */
const waitForPaintedFrame = (video, cb) => {
  if (!video) {
    cb();
    return () => {};
  }
  if (typeof video.requestVideoFrameCallback === 'function') {
    const id = video.requestVideoFrameCallback(() => cb());
    return () => {
      try {
        video.cancelVideoFrameCallback?.(id);
      } catch {
        /* ignore */
      }
    };
  }
  let inner = 0;
  const outer = window.requestAnimationFrame(() => {
    inner = window.requestAnimationFrame(cb);
  });
  return () => {
    window.cancelAnimationFrame(outer);
    window.cancelAnimationFrame(inner);
  };
};

/**
 * Preview kadrga seek + freym paint bo‘lgach onReady.
 * Metadata yetarli emas — partial/black kadr ko‘rinmasin.
 */
const primeSimilarTrailerThumb = (video, onReady) => {
  if (!video || video.tagName !== 'VIDEO') return () => {};
  if (video.dataset.previewReady === '1') {
    onReady();
    return () => {};
  }
  if (video.dataset.previewSeeking === '1') return () => {};
  video.dataset.previewSeeking = '1';

  let cancelPaint = null;
  let seekedHandler = null;
  let fallbackTimer = null;

  const finish = () => {
    if (video.dataset.previewReady === '1') return;
    video.dataset.previewReady = '1';
    video.dataset.previewSeeking = '0';
    cancelPaint?.();
    cancelPaint = waitForPaintedFrame(video, () => {
      if (video.videoWidth > 0 || video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        onReady();
      } else {
        onReady();
      }
    });
  };

  const doSeek = () => {
    try {
      const duration = Number(video.duration);
      const t = Number.isFinite(duration) && duration > 0
        ? Math.min(Math.max(duration * 0.08, 0.15), Math.max(duration - 0.05, 0.15))
        : 0.15;

      seekedHandler = () => {
        video.removeEventListener('seeked', seekedHandler);
        seekedHandler = null;
        if (fallbackTimer) window.clearTimeout(fallbackTimer);
        finish();
      };
      video.addEventListener('seeked', seekedHandler);

      if (Math.abs(video.currentTime - t) < 0.05 && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        video.removeEventListener('seeked', seekedHandler);
        seekedHandler = null;
        finish();
        return;
      }

      video.currentTime = t;

      // seeked kelmasa — loadeddata / soft wait
      fallbackTimer = window.setTimeout(() => {
        if (video.dataset.previewReady === '1') return;
        if (seekedHandler) {
          video.removeEventListener('seeked', seekedHandler);
          seekedHandler = null;
        }
        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          finish();
        }
      }, 2500);
    } catch {
      finish();
    }
  };

  if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
    doSeek();
  } else {
    const onMeta = () => {
      video.removeEventListener('loadedmetadata', onMeta);
      doSeek();
    };
    video.addEventListener('loadedmetadata', onMeta);
    return () => {
      video.removeEventListener('loadedmetadata', onMeta);
      if (seekedHandler) video.removeEventListener('seeked', seekedHandler);
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
      cancelPaint?.();
    };
  }

  return () => {
    if (seekedHandler) video.removeEventListener('seeked', seekedHandler);
    if (fallbackTimer) window.clearTimeout(fallbackTimer);
    cancelPaint?.();
  };
};

const SimilarTrailerItemSkeleton = () => (
  <div className="similar-trailer-item similar-trailer-item--skeleton" aria-hidden="true">
    <div className="similar-trailer-video">
      <SkeletonLoader variant="similar-trailer-video" className="similar-trailer-video-skeleton" />
    </div>
    <div className="similar-trailer-info">
      <SkeletonLoader variant="similar-trailer-title" />
      <SkeletonLoader variant="similar-trailer-text" />
      <div className="similar-trailer-actions">
        <SkeletonLoader variant="similar-trailer-action" />
        <SkeletonLoader variant="similar-trailer-action" />
      </div>
    </div>
  </div>
);

const SimilarTrailerItem = ({
  trailer,
  isActive,
  onSelect,
  tKey,
  contentLang,
}) => {
  const videoRef = useRef(null);
  const primeCleanupRef = useRef(null);
  const videoSrc =
    trailer.trailers?.[contentLang] || trailer.trailers?.uz || trailer.trailers?.ru || '';
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setReady(false);
    setFailed(false);
    primeCleanupRef.current?.();
    primeCleanupRef.current = null;
  }, [videoSrc]);

  const markReady = useCallback(() => {
    setReady(true);
    setFailed(false);
  }, []);

  const markFailed = useCallback(() => {
    setFailed(true);
    setReady(false);
  }, []);

  const tryPrime = useCallback(
    (e) => {
      const el = e?.currentTarget || videoRef.current;
      if (!el || ready || failed) return;
      // Allaqachon seek/prime ketayotgan bo‘lsa — cleanup qilmaslik (aks holda seek bekor bo‘ladi)
      if (el.dataset.previewSeeking === '1' || el.dataset.previewReady === '1') {
        if (el.dataset.previewReady === '1') markReady();
        return;
      }
      primeCleanupRef.current?.();
      primeCleanupRef.current = primeSimilarTrailerThumb(el, markReady);
    },
    [ready, failed, markReady]
  );

  useEffect(() => {
    if (!videoSrc || ready || failed) return undefined;

    const check = () => {
      const el = videoRef.current;
      if (
        el?.dataset.previewReady === '1' &&
        el.videoWidth > 0 &&
        el.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
      ) {
        markReady();
      }
    };

    check();
    const intervalId = window.setInterval(check, 250);
    const timeoutId = window.setTimeout(() => {
      const el = videoRef.current;
      if (el && el.videoWidth > 0) {
        markReady();
      } else if (el && el.readyState >= HTMLMediaElement.HAVE_METADATA) {
        markReady();
      } else {
        markFailed();
      }
    }, VIDEO_READY_TIMEOUT_MS);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [videoSrc, ready, failed, markReady, markFailed]);

  useEffect(
    () => () => {
      primeCleanupRef.current?.();
    },
    []
  );

  const showSkeleton = Boolean(videoSrc) && !ready && !failed;

  return (
    <div
      className={`similar-trailer-item${isActive ? ' active' : ''}${
        showSkeleton ? ' similar-trailer-item--loading' : ''
      }`}
      onClick={() => !showSkeleton && onSelect?.(trailer)}
      aria-busy={showSkeleton || undefined}
    >
      <div
        className={`similar-trailer-video${
          showSkeleton ? ' similar-trailer-video--loading' : ''
        }`}
      >
        {showSkeleton && (
          <SkeletonLoader
            variant="similar-trailer-video"
            className="similar-trailer-video-skeleton"
          />
        )}
        {!failed && videoSrc && (
          <video
            ref={videoRef}
            key={videoSrc}
            src={videoSrc}
            muted
            playsInline
            preload="auto"
            className={`similar-trailer-video-element${
              showSkeleton ? ' similar-trailer-video-element--loading' : ''
            }`}
            onLoadedMetadata={tryPrime}
            onLoadedData={tryPrime}
            onCanPlay={tryPrime}
            onError={markFailed}
          />
        )}
        {!showSkeleton && (
          <div className="similar-trailer-play">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        )}
      </div>
      <div className="similar-trailer-info">
        {showSkeleton ? (
          <>
            <SkeletonLoader variant="similar-trailer-title" />
            <SkeletonLoader variant="similar-trailer-text" />
            <div className="similar-trailer-actions">
              <SkeletonLoader variant="similar-trailer-action" />
              <SkeletonLoader variant="similar-trailer-action" />
            </div>
          </>
        ) : (
          <>
            <div className="similar-trailer-title">
              {trailer.title?.[contentLang] || trailer.title?.uz || trailer.title?.ru || ''}
            </div>
            <div className="similar-trailer-text">
              {trailer.text?.[contentLang] || trailer.text?.uz || trailer.text?.ru || ''}
            </div>
            <div className="similar-trailer-actions">
              <LikeButton
                key={tKey}
                variant="trailerSimilar"
                contentId={tKey}
                persistTrailerKey={tKey}
                initialLikeCount={trailer.like}
                initialDislikeCount={trailer.dislike}
                countFormatter={formatActionCount}
                stopPropagation
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const SimilarTrailers = ({
  currentMovie,
  selectedTrailer,
  onTrailerSelect,
  getTrailerKey,
  trailerLoading = false,
  hideTitleOnMobile = false,
}) => {
  const { t } = useTranslation();
  const { contentLang } = useContentLanguage();
  const { allMovies } = useMoviesApi();

  const currentTypeTrailers = selectedTrailer?.typeTrailers || '';

  const similarTrailers = useMemo(() => {
    if (!currentTypeTrailers) return [];
    return allMovies
      .flatMap((movie) =>
        (movie.trailersVideo || []).map((trailer) => ({
          ...trailer,
          movieId: movie.id,
          movieTitle: movie.title,
        }))
      )
      .filter((trailer) => trailer.typeTrailers === currentTypeTrailers);
  }, [allMovies, currentTypeTrailers]);

  const selectedKey = selectedTrailer
    ? (getTrailerKey
        ? getTrailerKey(selectedTrailer)
        : `${selectedTrailer.movieId ?? currentMovie?.id}-${selectedTrailer.id}`)
    : null;

  const titleClassName = `similar-trailers-title${hideTitleOnMobile ? ' similar-trailers-title--desktop-only' : ''}`;

  if (trailerLoading) {
    return (
      <div className="similar-trailers-container similar-trailers-container--loading">
        <SkeletonLoader
          variant="similar-trailers-title"
          className={`${titleClassName} similar-trailers-title--skeleton`}
        />
        <VerticalScroll className="similar-trailers-scroll-wrapper">
          <div className="similar-trailers-list">
            <SimilarTrailerItemSkeleton />
            <SimilarTrailerItemSkeleton />
            <SimilarTrailerItemSkeleton />
            <SimilarTrailerItemSkeleton />
          </div>
        </VerticalScroll>
      </div>
    );
  }

  if (similarTrailers.length === 0) {
    return (
      <div className="similar-trailers-container">
        <h4 className={titleClassName}>{t('detail.similarTrailers')}</h4>
        <div className="similar-trailers-no-trailers">
          <p>{t('detail.noSimilarTrailers') || 'No similar trailers available'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="similar-trailers-container">
      <h4 className={titleClassName}>{t('detail.similarTrailers')}</h4>
      <VerticalScroll className="similar-trailers-scroll-wrapper">
        <div className="similar-trailers-list">
          {similarTrailers.map((trailer) => {
            const tKey = getTrailerKey ? getTrailerKey(trailer) : `${trailer.movieId}-${trailer.id}`;
            const isActive = selectedKey != null && tKey === selectedKey;
            return (
              <SimilarTrailerItem
                key={`${trailer.movieId}-${trailer.id}`}
                trailer={trailer}
                isActive={isActive}
                onSelect={onTrailerSelect}
                tKey={tKey}
                contentLang={contentLang}
              />
            );
          })}
        </div>
      </VerticalScroll>
    </div>
  );
};

export default SimilarTrailers;
