import React, { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useActorsApi } from '../../context/ActorsApiContext';
import { useMoviesApi } from '../../context/MoviesApiContext';
import FollowingButton from '../../Music/FollowingButton/FollowingButton';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import ShowMoreButton from '../ShowMoreButton/ShowMoreButton';
import GlobalModal from '../GlobalModal/GlobalModal';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import { useImageReady } from '../../utils/useImageReady';
import '../ShowMoreButton/ShowMoreButton.css';
import './SimilarActors.css';

/** Sahifada faqat shuncha kartochka; "Ko'proq" modalda barcha o'xshash aktyorlar */
const SIMILAR_VISIBLE = 4;

const SimilarActorCardSkeleton = () => (
  <li className="actor-similar-card actor-similar-card--skeleton" aria-hidden="true">
    <div className="actor-similar-card__btn actor-similar-card__btn--skeleton">
      <div className="actor-similar-card__main">
        <div className="actor-similar-card__img-wrap actor-similar-card__img-wrap--skeleton">
          <SkeletonLoader
            variant="actor-similar-img"
            className="actor-similar-card__img-skeleton"
          />
        </div>
        <div className="actor-similar-card__text">
          <span className="actor-similar-card__name actor-similar-card__name--skeleton">
            <SkeletonLoader
              variant="actor-similar-name"
              className="actor-similar-card__name-skeleton"
            />
          </span>
          <span className="actors-page-movies-title actors-page-movies-title--skeleton">
            <SkeletonLoader
              variant="actor-similar-movies-title"
              className="actor-similar-card__movies-title-skeleton"
            />
          </span>
        </div>
      </div>
      <div className="actor-similar-card__follow-wrap">
        <span className="following-btn following-btn--skeleton actor-similar-card__follow-btn--skeleton">
          <SkeletonLoader
            variant="actor-similar-follow"
            className="actor-similar-card__follow-skeleton"
          />
        </span>
      </div>
    </div>
  </li>
);

export const SimilarActorsSkeleton = ({ count = SIMILAR_VISIBLE }) => (
  <section
    className="actor-extra-block actor-extra-block--similar actor-extra-block--skeleton"
    aria-busy="true"
  >
    <div className="actor-similar-head">
      <div className="actor-extra-block__title actor-extra-block__title--skeleton actor-similar-head__title--skeleton">
        <SkeletonLoader
          variant="actor-extra-block-title"
          className="actor-extra-block__title-skeleton"
        />
      </div>
    </div>
    <div className="actor-similar-scroll">
      <ul className="actor-similar-list">
        {Array.from({ length: count }, (_, i) => (
          <SimilarActorCardSkeleton key={`similar-sk-${i}`} />
        ))}
      </ul>
    </div>
  </section>
);

const SimilarActorCard = ({
  actor,
  name,
  videoCountLabel,
  onOpen,
}) => {
  const imgSrc = actor.image || '';
  const { showSkeleton, imgRef, onLoad, onError } = useImageReady(imgSrc);

  return (
    <li
      className={`actor-similar-card${showSkeleton ? ' actor-similar-card--loading' : ''}`}
      aria-busy={showSkeleton || undefined}
    >
      <div className="actor-similar-card__btn">
        <button
          type="button"
          className="actor-similar-card__main"
          disabled={showSkeleton}
          onClick={() => !showSkeleton && onOpen?.(actor.id)}
        >
          <div
            className={`actor-similar-card__img-wrap${
              showSkeleton ? ' actor-similar-card__img-wrap--loading' : ''
            }`}
          >
            {showSkeleton && (
              <SkeletonLoader
                variant="actor-similar-img"
                className="actor-similar-card__img-skeleton"
              />
            )}
            {imgSrc ? (
              <img
                ref={imgRef}
                src={imgSrc}
                alt=""
                className={`actor-similar-card__img${
                  showSkeleton ? ' actor-similar-card__img--loading' : ''
                }`}
                loading="lazy"
                onLoad={onLoad}
                onError={onError}
              />
            ) : null}
          </div>
          <div className="actor-similar-card__text">
            <span className="actor-similar-card__name">{name}</span>
            <span className="actors-page-movies-title">{videoCountLabel}</span>
          </div>
        </button>
        <FollowingButton
          artistId={actor.id}
          wrapperClassName="actor-similar-card__follow-wrap"
          stopPropagation
        />
      </div>
    </li>
  );
};

const SimilarActors = ({ currentActorId, actorsGenre }) => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { contentLang } = useContentLanguage();
  const { getActorsByGenre, actorPageSectionLabels, actorsLoading } = useActorsApi();
  const { allMovies } = useMoviesApi();
  const [modalOpen, setModalOpen] = useState(false);

  const videoCountByActorId = useMemo(() => {
    const map = new Map();
    for (const m of allMovies) {
      const ids = m.actors;
      if (!Array.isArray(ids)) continue;
      for (const id of ids) {
        map.set(id, (map.get(id) ?? 0) + 1);
      }
    }
    return map;
  }, [allMovies]);

  const list = useMemo(() => {
    if (actorsGenre == null || actorsGenre === '') return [];
    return getActorsByGenre(actorsGenre)
      .filter((a) => a.id !== currentActorId)
      .slice(0, 12);
  }, [currentActorId, actorsGenre, getActorsByGenre]);

  const visible = useMemo(() => list.slice(0, SIMILAR_VISIBLE), [list]);
  const hasMore = list.length > SIMILAR_VISIBLE;

  const sectionTitle =
    actorPageSectionLabels?.similarActors?.[contentLang] ||
    actorPageSectionLabels?.similarActors?.uz ||
    '';

  const openActor = useCallback(
    (id) => {
      setModalOpen(false);
      navigate(`/actor/${id}`);
    },
    [navigate]
  );

  const renderActorRow = useCallback(
    (a) => {
      const name = a.name?.[contentLang] || a.name?.uz || a.name?.ru || '';
      const n = videoCountByActorId.get(a.id) ?? 0;
      const videoCountLabel = `${n} ${i18n.language === 'uz' ? 'ta video' : 'видео'}`;
      return (
        <SimilarActorCard
          key={a.id}
          actor={a}
          name={name}
          videoCountLabel={videoCountLabel}
          onOpen={openActor}
        />
      );
    },
    [contentLang, i18n.language, openActor, videoCountByActorId]
  );

  if (actorsLoading) {
    return <SimilarActorsSkeleton />;
  }

  if (!list.length) return null;

  return (
    <section className="actor-extra-block actor-extra-block--similar">
      <div className="actor-similar-head">
        <h3 className="actor-extra-block__title">{sectionTitle}</h3>
        {hasMore && (
          <ShowMoreButton onClick={() => setModalOpen(true)} className="actor-similar-show-more" />
        )}
      </div>
      <div className="actor-similar-scroll">
        <ul className="actor-similar-list">{visible.map((a) => renderActorRow(a))}</ul>
      </div>

      <GlobalModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={sectionTitle}>
        <ul className="actor-similar-list actor-similar-list--modal">{list.map((a) => renderActorRow(a))}</ul>
      </GlobalModal>
    </section>
  );
};

export default SimilarActors;
