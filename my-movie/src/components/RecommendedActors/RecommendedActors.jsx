import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import HorizontalScroll from '../HorizontalScroll/HorizontalScroll';
import { useActorsApi } from '../../context/ActorsApiContext';
import FollowingButton from '../../Music/FollowingButton/FollowingButton';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import './RecommendedActors.css';

const RECOMMENDED_ACTORS_SKELETON_COUNT = 8;

const uniqueActorsById = (list) => {
  const seen = new Set();
  return list.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });
};

/** Rasm, ism va follow — rasm onLoad bo‘lguncha birga skeleton */
const RecommendedActorCard = ({ actor, lang, onOpen, t }) => {
  const [imgReady, setImgReady] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const name = (() => {
    const n = actor?.name?.[lang] ?? actor?.name?.uz ?? actor?.name?.ru ?? '';
    return String(n).trim() || actor?.name?.uz || actor?.name?.ru || '';
  })();

  const imgSrc = actor.image || '/img/movie1.jpg';

  useEffect(() => {
    setImgReady(false);
    setImgFailed(false);
  }, [imgSrc, actor.id]);

  const showSkeleton = !imgReady && !imgFailed;

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
          src={imgSrc}
          alt={name}
          className={`recommended-actors-img${showSkeleton ? ' recommended-actors-img--loading' : ''}`}
          onLoad={() => {
            setImgReady(true);
            setImgFailed(false);
          }}
          onError={() => {
            setImgFailed(true);
            setImgReady(true);
          }}
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
            wrapperClassName="recommended-actors-follow"
            stopPropagation
          />
        </>
      )}
    </div>
  );
};

const RecommendedActors = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language === 'ru' ? 'ru' : 'uz';
  const { allActors, actorsLoading } = useActorsApi();

  const displayActors = useMemo(() => uniqueActorsById(allActors), [allActors]);
  const showSectionSkeleton = actorsLoading && displayActors.length === 0;
  const showTitleSkeleton = actorsLoading;

  const handleActorClick = (actorId) => {
    navigate(`/actor/${actorId}`);
  };

  const skeletonItems = useMemo(
    () =>
      Array.from({ length: RECOMMENDED_ACTORS_SKELETON_COUNT }, (_, index) => (
        <div
          key={`recommended-actor-skeleton-${index}`}
          className="recommended-actors-item recommended-actors-item--skeleton"
          aria-hidden="true"
        >
          <div className="recommended-actors-img-wrap">
            <SkeletonLoader
              variant="recommended-actor-img"
              className="recommended-actors-img-skeleton"
            />
          </div>
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
        </div>
      )),
    []
  );

  return (
    <div
      className="recommended-actors"
      aria-busy={showSectionSkeleton || showTitleSkeleton || undefined}
    >
      <div className="recommended-actors-container">
        <div className="recommended-actors-header">
          {showTitleSkeleton ? (
            <SkeletonLoader
              variant="recommended-actors-title"
              className="recommended-actors-title-skeleton"
            />
          ) : (
            <h2 className="recommended-actors-title">
              {t('movies.tavsiyaEtilganAktyorlar', 'Tavsiya etilgan aktiyorlar')}
            </h2>
          )}
        </div>
        <div className="recommended-actors-content">
          <HorizontalScroll scrollAmount={140}>
            {showSectionSkeleton
              ? skeletonItems
              : displayActors.map((actor) => (
                  <RecommendedActorCard
                    key={actor.id}
                    actor={actor}
                    lang={lang}
                    onOpen={handleActorClick}
                    t={t}
                  />
                ))}
          </HorizontalScroll>
        </div>
      </div>
    </div>
  );
};

export default RecommendedActors;
