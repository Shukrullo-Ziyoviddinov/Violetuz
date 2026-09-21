import React from 'react';
import FollowingButton from '../../Music/FollowingButton/FollowingButton';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import { useImageReady } from '../../utils/useImageReady';

/**
 * Tavsiya etilgan aktyorlar kartochkasi — Following + image-ready skeleton.
 */
const RecommendedActorCard = ({ actor, lang, onOpen, t }) => {
  const name = (() => {
    const n = actor?.name?.[lang] ?? actor?.name?.uz ?? actor?.name?.ru ?? '';
    return String(n).trim() || actor?.name?.uz || actor?.name?.ru || '';
  })();

  const imgSrc = actor.image || '/img/movie1.jpg';
  const { showSkeleton, imgRef, onLoad, onError } = useImageReady(imgSrc);

  return (
    <div
      className={`recommended-actors-item${showSkeleton ? ' recommended-actors-item--loading' : ''}`}
      onClick={() => !showSkeleton && onOpen?.(actor.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (showSkeleton) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen?.(actor.id);
        }
      }}
      aria-busy={showSkeleton || undefined}
      aria-label={`${name} — ${t('navbar.movies', 'Filmlar')}`}
    >
      <div className="recommended-actors-img-wrap">
        {showSkeleton && (
          <SkeletonLoader
            variant="recommended-actor-img"
            className="recommended-actors-img-skeleton"
          />
        )}
        <img
          ref={imgRef}
          src={imgSrc}
          alt={name}
          className={`recommended-actors-img${showSkeleton ? ' recommended-actors-img--loading' : ''}`}
          onLoad={onLoad}
          onError={onError}
        />
      </div>

      {showSkeleton ? (
        <>
          <div className="recommended-actors-name recommended-actors-name--skeleton">
            <SkeletonLoader
              variant="recommended-actor-name"
              className="recommended-actors-name-skeleton"
            />
          </div>
          <div className="recommended-actors-follow">
            <SkeletonLoader
              variant="recommended-actor-follow"
              className="recommended-actors-follow-skeleton following-btn"
            />
          </div>
        </>
      ) : (
        <>
          <p className="recommended-actors-name">{name}</p>
          <FollowingButton
            artistId={actor.id}
            entityType="actor"
            wrapperClassName="recommended-actors-follow"
            stopPropagation
          />
        </>
      )}
    </div>
  );
};

export default RecommendedActorCard;
