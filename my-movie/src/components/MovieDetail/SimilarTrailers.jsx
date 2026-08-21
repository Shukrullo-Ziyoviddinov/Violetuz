import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useMoviesApi } from '../../context/MoviesApiContext';
import { formatActionCount } from '../../utils/utils';
import LikeButton from '../../Music/LikeButton/LikeButton';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import ViewCount from '../ViewCount/ViewCount';
import UploadedAtTime from '../UploadedAtTime/UploadedAtTime';
import VerticalScroll from './VerticalScroll';
import './SimilarTrailers.css';

const VIDEO_READY_TIMEOUT_MS = 20000;

/**
 * Preview kadrga seek. Tayyor bo‘lganda (seeked) onDone.
 * Ready ni seekdan oldin bermaymiz — aks holda qora/bo‘sh kadr chiqadi.
 */
const seekPreviewFrame = (video, onDone) => {
  if (!video) return () => {};
  if (video.dataset.previewReady === '1') {
    onDone?.();
    return () => {};
  }
  if (video.dataset.previewSeeking === '1') return () => {};
  video.dataset.previewSeeking = '1';

  let settled = false;
  let fallbackTimer = null;

  const settle = () => {
    if (settled) return;
    settled = true;
    video.dataset.previewReady = '1';
    video.dataset.previewSeeking = '0';
    if (fallbackTimer) window.clearTimeout(fallbackTimer);
    onDone?.();
  };

  const onSeeked = () => {
    video.removeEventListener('seeked', onSeeked);
    settle();
  };

  try {
    const duration = Number(video.duration);
    const t = Number.isFinite(duration) && duration > 0
      ? Math.min(1, Math.max(0.1, duration * 0.08))
      : 0.1;

    video.addEventListener('seeked', onSeeked);
    video.currentTime = t;

    fallbackTimer = window.setTimeout(() => {
      video.removeEventListener('seeked', onSeeked);
      settle();
    }, 2000);
  } catch {
    settle();
  }

  return () => {
    video.removeEventListener('seeked', onSeeked);
    if (fallbackTimer) window.clearTimeout(fallbackTimer);
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
  const seekCleanupRef = useRef(null);
  const videoSrc =
    trailer.trailers?.[contentLang] || trailer.trailers?.uz || trailer.trailers?.ru || '';
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setReady(false);
    setFailed(false);
    seekCleanupRef.current?.();
    seekCleanupRef.current = null;
  }, [videoSrc]);

  useEffect(
    () => () => {
      seekCleanupRef.current?.();
    },
    []
  );

  useEffect(() => {
    if (!videoSrc || ready || failed) return undefined;

    const timeoutId = window.setTimeout(() => {
      const el = videoRef.current;
      if (el && el.readyState >= HTMLMediaElement.HAVE_METADATA) {
        setReady(true);
      } else {
        setFailed(true);
      }
    }, VIDEO_READY_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [videoSrc, ready, failed]);

  const reveal = useCallback(() => {
    setReady(true);
    setFailed(false);
  }, []);

  const startPrime = useCallback(
    (e) => {
      const el = e?.currentTarget || videoRef.current;
      if (!el || ready || failed) return;
      if (el.dataset.previewSeeking === '1') return;
      if (el.dataset.previewReady === '1') {
        reveal();
        return;
      }
      if (el.readyState < HTMLMediaElement.HAVE_METADATA) return;
      seekCleanupRef.current?.();
      seekCleanupRef.current = seekPreviewFrame(el, reveal);
    },
    [ready, failed, reveal]
  );

  const markFailed = useCallback(() => {
    setFailed(true);
    setReady(false);
  }, []);

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
            onLoadedMetadata={startPrime}
            onLoadedData={startPrime}
            onCanPlay={startPrime}
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
            <div className="similar-trailer-meta-row">
              <ViewCount
                itemId={tKey}
                type="trailer"
                variant="text"
                record={false}
                className="view-count-text similar-trailer-view-count"
              />
              <UploadedAtTime
                at={trailer.createdAt || trailer.uploadedAt}
                className="similar-trailer-uploaded-at"
              />
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
