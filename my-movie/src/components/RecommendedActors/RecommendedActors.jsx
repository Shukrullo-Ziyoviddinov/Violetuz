import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import HorizontalScroll from '../HorizontalScroll/HorizontalScroll';
import { useActorsApi } from '../../context/ActorsApiContext';
import FollowingButton from '../../Music/FollowingButton/FollowingButton';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import { useImageReady } from '../../utils/useImageReady';
import { useRecommendedActorsRanking } from '../../hooks/useRecommendedActorsRanking';
import { useAppSelector } from '../../store/hooks';
import { selectIsLoggedIn, selectAuthReady } from '../../store/slices/userSlice';
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

/**
 * Personalized order when ranked scores exist (≥2 films); else catalog order.
 * @param {Array} catalogActors
 * @param {Array<{ actorId: string, score: number }>|null} ranked
 */
const orderActorsByRanking = (catalogActors, ranked) => {
  const unique = uniqueActorsById(catalogActors);
  if (!ranked?.length) return unique;

  const byId = new Map(unique.map((a) => [String(a.id), a]));
  const ordered = [];
  const seen = new Set();

  for (const row of ranked) {
    const id = String(row.actorId ?? '');
    const actor = byId.get(id);
    if (!actor || seen.has(id)) continue;
    seen.add(id);
    ordered.push(actor);
  }

  return ordered.length ? ordered : unique;
};

/** Rasm, ism va follow — rasm tayyor bo‘lguncha birga skeleton (cache-safe) */
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

const RecommendedActors = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language === 'ru' ? 'ru' : 'uz';
  const { allActors, actorsLoading } = useActorsApi();
  const authReady = useAppSelector(selectAuthReady);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const { ranked, loading: rankingLoading } = useRecommendedActorsRanking();

  const displayActors = useMemo(
    () => orderActorsByRanking(allActors, ranked),
    [allActors, ranked]
  );
  const waitingPersonalized =
    authReady && isLoggedIn && rankingLoading && ranked === null;
  const showSectionSkeleton =
    (actorsLoading && displayActors.length === 0) || waitingPersonalized;
  const showTitleSkeleton = actorsLoading && allActors.length === 0;

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
