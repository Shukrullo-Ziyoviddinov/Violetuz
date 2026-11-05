import React, { useRef, useState } from 'react';
import { useImageReady } from '../../utils/useImageReady';
import { useTranslation } from 'react-i18next';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useSimilarTrailers } from '../../hooks/useSimilarTrailers';
import { formatActionCount } from '../../utils/utils';
import LikeButton from '../../Music/LikeButton/LikeButton';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import ViewCount from '../ViewCount/ViewCount';
import UploadedAtTime from '../UploadedAtTime/UploadedAtTime';
import VerticalScroll from './VerticalScroll';
import { formatMovieRating } from '../Rating/CalculateRating';
import TrillerSideCardMoreModal from '../Triller/TrillerSideCardMoreModal';
import './SimilarTrailers.css';

const hasMovieRating = (value) =>
  value != null && value !== '' && value !== 'none' && Number.isFinite(Number(value));

const formatImdbLabel = (value) => (hasMovieRating(value) ? formatMovieRating(value) : null);

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
    <span className="similar-trailer-more" aria-hidden="true" />
  </div>
);

const SimilarTrailerItem = ({
  trailer,
  isActive,
  onSelect,
  tKey,
  contentLang,
  showMoreMenu = false,
}) => {
  const { t } = useTranslation();
  const moreBtnRef = useRef(null);
  const imageSrc = trailer.trillerimg || '';
  const { showSkeleton, imgRef, onLoad, onError, failed } = useImageReady(imageSrc);
  const [moreOpen, setMoreOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState(null);

  const imdbLabel = formatImdbLabel(trailer.ratingImdb);
  const trailerTitle =
    trailer.title?.[contentLang] || trailer.title?.uz || trailer.title?.ru || '';
  const movieId = trailer.movieId;
  const sharePath =
    movieId != null && trailer.id != null
      ? `/movie/${movieId}/trailer?trailerId=${trailer.id}`
      : '';
  const shareMovie = { id: movieId, title: trailerTitle };

  const handleMore = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (showSkeleton) return;
    if (moreOpen) {
      setMoreOpen(false);
      return;
    }
    const rect = moreBtnRef.current?.getBoundingClientRect?.() || null;
    setAnchorRect(
      rect
        ? {
            top: rect.top,
            bottom: rect.bottom,
            left: rect.left,
            right: rect.right,
            width: rect.width,
            height: rect.height,
          }
        : null
    );
    setMoreOpen(true);
  };

  return (
    <>
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
          {!failed && imageSrc && (
            <img
              ref={imgRef}
              key={imageSrc}
              src={imageSrc}
              alt={trailerTitle}
              decoding="async"
              className={`similar-trailer-video-element${showSkeleton ? ' similar-trailer-video-element--loading' : ''}`}
              onLoad={onLoad}
              onError={onError}
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
              <div className="similar-trailer-title">{trailerTitle}</div>
              {imdbLabel != null ? (
                <div className="similar-trailer-text similar-trailer-imdb" aria-label={`IMDb ${imdbLabel}`}>
                  <img
                    className="similar-trailer-imdb-img"
                    src="/img/imdbnew.png"
                    alt=""
                  />
                  <span className="similar-trailer-imdb-value">{imdbLabel}</span>
                </div>
              ) : null}
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
        {!showMoreMenu ? null : !showSkeleton ? (
          <button
            ref={moreBtnRef}
            type="button"
            className="similar-trailer-more"
            onClick={handleMore}
            aria-label={t('triller.moreActions', "Ko'proq")}
            aria-haspopup="menu"
            aria-expanded={moreOpen}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <circle cx="12" cy="5" r="1.6" />
              <circle cx="12" cy="12" r="1.6" />
              <circle cx="12" cy="19" r="1.6" />
            </svg>
          </button>
        ) : (
          <span className="similar-trailer-more" aria-hidden="true" />
        )}
      </div>

      {showMoreMenu ? (
        <TrillerSideCardMoreModal
          open={moreOpen}
          onClose={() => setMoreOpen(false)}
          anchorRect={anchorRect}
          shareOnly
          sharePath={sharePath}
          shareMovie={shareMovie}
          title={trailerTitle}
        />
      ) : null}
    </>
  );
};

const SimilarTrailers = ({
  currentMovie,
  selectedTrailer,
  onTrailerSelect,
  getTrailerKey,
  trailerLoading = false,
  hideTitleOnMobile = false,
  showMoreMenu = false,
}) => {
  const { t } = useTranslation();
  const { contentLang } = useContentLanguage();
  const { data, isPending } = useSimilarTrailers();
  const similarTrailers = data ?? [];

  const selectedKey = selectedTrailer
    ? (getTrailerKey
        ? getTrailerKey(selectedTrailer)
        : `${selectedTrailer.movieId ?? currentMovie?.id}-${selectedTrailer.id}`)
    : null;

  const titleClassName = `similar-trailers-title${hideTitleOnMobile ? ' similar-trailers-title--desktop-only' : ''}`;

  if (trailerLoading || isPending) {
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
                showMoreMenu={showMoreMenu}
              />
            );
          })}
        </div>
      </VerticalScroll>
    </div>
  );
};

export default SimilarTrailers;
