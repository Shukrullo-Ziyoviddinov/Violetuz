import React, { useMemo, useRef, useState } from 'react';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { getLocalizedField } from '../../utils/shortsMovieUtils';
import { formatActionCount } from '../../utils/utils';
import { useImageReady } from '../../utils/useImageReady';
import LikeButton from '../../Music/LikeButton/LikeButton';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import { useVideoDurationLabel } from './useVideoDurationLabel';
import TrillerSideCardMoreModal from './TrillerSideCardMoreModal';
import './TrillerSideCard.css';

const formatRating = (value) => {
  if (value == null || value === '') return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return Number.isInteger(num) ? String(num) : num.toFixed(1);
};

const SideCardSkeleton = () => (
  <>
    <div className="triller-side-card-thumb">
      <SkeletonLoader variant="triller-side-card-thumb" />
    </div>
    <div className="triller-side-card-body">
      <SkeletonLoader variant="triller-side-card-title" />
      <div className="triller-meta-ratings triller-side-card-ratings">
        <SkeletonLoader variant="triller-meta-rating" />
      </div>
      <div className="triller-meta-likes triller-side-card-likes">
        <SkeletonLoader variant="triller-side-card-like" />
        <SkeletonLoader variant="triller-side-card-like" />
      </div>
    </div>
    <span className="triller-side-card-more" aria-hidden="true" />
  </>
);

const TrillerSideCard = ({ triller, onSelect, loading = false }) => {
  const { contentLang } = useContentLanguage();
  const pageLoading = Boolean(loading) || !triller;

  const title = pageLoading ? '' : getLocalizedField(triller?.title, contentLang);
  const videoImg = pageLoading ? '' : getLocalizedField(triller?.videoImg, contentLang) || '';
  const videoSrc = pageLoading ? '' : getLocalizedField(triller?.video, contentLang) || '';

  const { label: durationLabel, ready: durationReady } = useVideoDurationLabel(videoSrc);
  const {
    showSkeleton: showImgSkeleton,
    imgRef,
    onLoad,
    onError,
    failed: imgFailed,
  } = useImageReady(videoImg);

  const moreBtnRef = useRef(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState(null);

  const likeMeta = useMemo(() => {
    if (pageLoading || triller?.id == null) return undefined;
    return {
      category: 'triller',
      title: title || '',
      image: videoImg || '',
      route: `/triller/${triller.id}`,
    };
  }, [pageLoading, triller?.id, title, videoImg]);

  const waitingMedia =
    !pageLoading &&
    ((Boolean(videoImg) && showImgSkeleton) || (Boolean(videoSrc) && !durationReady));

  const showSkeleton = pageLoading || waitingMedia;

  if (pageLoading) {
    return (
      <div className="triller-side-card triller-side-card--skeleton" aria-hidden="true">
        <SideCardSkeleton />
      </div>
    );
  }

  const ageLimit = triller.ageLimit != null ? Number(triller.ageLimit) : null;
  const ageLabel = Number.isFinite(ageLimit) ? `${ageLimit}+` : '';
  const imdbLabel = formatRating(triller.reytingImdb);
  const hasRatings = imdbLabel != null;
  const likeCount = Number(triller.like) || 0;
  const dislikeCount = Number(triller.dislike) || 0;
  const persistKey = triller.id != null ? `triller-${triller.id}` : undefined;

  const handleClick = () => {
    if (showSkeleton) return;
    onSelect?.(triller);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

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

  const stopCardNav = (e) => {
    e.stopPropagation();
  };

  return (
    <>
      <div
        className={`triller-side-card${showSkeleton ? ' triller-side-card--skeleton' : ''}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-busy={showSkeleton || undefined}
      >
        {showSkeleton ? (
          <>
            <div className="triller-side-card-thumb">
              <SkeletonLoader variant="triller-side-card-thumb" />
              {!imgFailed && videoImg ? (
                <img
                  ref={imgRef}
                  src={videoImg}
                  alt=""
                  className="triller-side-card-image triller-side-card-image--loading"
                  loading="lazy"
                  onLoad={onLoad}
                  onError={onError}
                />
              ) : null}
            </div>
            <div className="triller-side-card-body">
              <SkeletonLoader variant="triller-side-card-title" />
              <div className="triller-meta-ratings triller-side-card-ratings">
                <SkeletonLoader variant="triller-meta-rating" />
              </div>
              <div className="triller-meta-likes triller-side-card-likes">
                <SkeletonLoader variant="triller-side-card-like" />
                <SkeletonLoader variant="triller-side-card-like" />
              </div>
            </div>
            <span className="triller-side-card-more" aria-hidden="true" />
          </>
        ) : (
          <>
            <div className="triller-side-card-thumb">
              {!imgFailed && videoImg ? (
                <img
                  ref={imgRef}
                  src={videoImg}
                  alt={title}
                  className="triller-side-card-image"
                  loading="lazy"
                  onLoad={onLoad}
                  onError={onError}
                />
              ) : null}
              {ageLabel ? <span className="triller-side-card-age">{ageLabel}</span> : null}
              {durationLabel ? (
                <span className="triller-side-card-duration">{durationLabel}</span>
              ) : null}
            </div>

            <div className="triller-side-card-body">
              <h3 className="triller-side-card-title">{title}</h3>
              {hasRatings ? (
                <div className="triller-meta-ratings triller-side-card-ratings">
                  {imdbLabel != null ? (
                    <span className="triller-meta-rating" aria-label={`IMDb ${imdbLabel}`}>
                      <img className="triller-meta-rating-img" src="/img/imdbnew.png" alt="" />
                      <span className="triller-meta-rating-value">{imdbLabel}</span>
                    </span>
                  ) : null}
                </div>
              ) : null}
              <div
                className="triller-meta-likes triller-side-card-likes"
                onClick={stopCardNav}
                onKeyDown={stopCardNav}
              >
                <LikeButton
                  key={persistKey || 'triller-side-like'}
                  variant="trailerModal"
                  contentId={triller.id}
                  persistKey={persistKey}
                  initialLikeCount={likeCount}
                  initialDislikeCount={dislikeCount}
                  countFormatter={formatActionCount}
                  likeMeta={likeMeta}
                />
              </div>
            </div>

            <button
              ref={moreBtnRef}
              type="button"
              className="triller-side-card-more"
              onClick={handleMore}
              aria-label="Ko'proq"
              aria-haspopup="menu"
              aria-expanded={moreOpen}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <circle cx="12" cy="5" r="1.6" />
                <circle cx="12" cy="12" r="1.6" />
                <circle cx="12" cy="19" r="1.6" />
              </svg>
            </button>
          </>
        )}
      </div>

      <TrillerSideCardMoreModal
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        anchorRect={anchorRect}
        trillerId={triller.id}
        title={title}
      />
    </>
  );
};

export default TrillerSideCard;
