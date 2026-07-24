import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMoviesApi } from '../../context/MoviesApiContext';
import { useActorsApi } from '../../context/ActorsApiContext';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import ShowMoreButton from '../ShowMoreButton/ShowMoreButton';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import { useImageReady } from '../../utils/useImageReady';
import './ActorTopRatedKinolar.css';

const getMovieTitle = (m, lang) => {
  const t = m.title;
  if (!t) return '';
  if (typeof t === 'string') return t;
  return t[lang] || t.uz || t.ru || '';
};

const getPoster = (m) => {
  const h = m.homeImg;
  if (!h) return '';
  if (typeof h === 'string') return h;
  return h.uz || h.ru || '';
};

/** Sahifada 3×2 = 6 ta kartochka; ortiqchalari "Ko'proq" orqali /recommended */
const TOP_RATED_VISIBLE_COUNT = 6;

const ActorTopRatedCardSkeleton = () => (
  <li className="actor-toprated-card actor-toprated-card--skeleton" aria-hidden="true">
    <div className="actor-toprated-card__btn actor-toprated-card__btn--skeleton">
      <div className="actor-toprated-card__img-wrap actor-toprated-card__img-wrap--skeleton">
        <SkeletonLoader
          variant="actor-toprated-img"
          className="actor-toprated-card__img-skeleton"
        />
        <span className="actor-toprated-card__imdb actor-toprated-card__imdb--skeleton">
          <SkeletonLoader
            variant="actor-toprated-imdb"
            className="actor-toprated-card__imdb-skeleton"
          />
        </span>
      </div>
    </div>
  </li>
);

export const ActorTopRatedKinolarSkeleton = ({ count = TOP_RATED_VISIBLE_COUNT }) => (
  <section
    className="actor-toprated actor-extra-block actor-extra-block--top-rated actor-extra-block--skeleton"
    aria-busy="true"
  >
    <div className="actor-toprated-head">
      <div className="actor-extra-block__title actor-extra-block__title--skeleton actor-toprated-head__title--skeleton">
        <SkeletonLoader
          variant="actor-extra-block-title"
          className="actor-extra-block__title-skeleton"
        />
      </div>
    </div>
    <div className="actor-toprated-scroll">
      <ul className="actor-toprated-list">
        {Array.from({ length: count }, (_, i) => (
          <ActorTopRatedCardSkeleton key={`toprated-sk-${i}`} />
        ))}
      </ul>
    </div>
  </section>
);

const ActorTopRatedCard = ({ movie, name, poster, ratingImdb, onOpen }) => {
  const { showSkeleton, imgRef, onLoad, onError } = useImageReady(poster || '');

  return (
    <li
      className={`actor-toprated-card${showSkeleton ? ' actor-toprated-card--loading' : ''}`}
      aria-busy={showSkeleton || undefined}
    >
      <button
        type="button"
        className="actor-toprated-card__btn"
        disabled={showSkeleton}
        onClick={() => !showSkeleton && onOpen?.(movie.id)}
        aria-label={name || undefined}
      >
        <div
          className={`actor-toprated-card__img-wrap${
            showSkeleton ? ' actor-toprated-card__img-wrap--loading' : ''
          }`}
        >
          {showSkeleton && (
            <SkeletonLoader
              variant="actor-toprated-img"
              className="actor-toprated-card__img-skeleton"
            />
          )}
          {poster ? (
            <img
              ref={imgRef}
              src={poster}
              alt=""
              className={`actor-toprated-card__img${
                showSkeleton ? ' actor-toprated-card__img--loading' : ''
              }`}
              loading="lazy"
              onLoad={onLoad}
              onError={onError}
            />
          ) : null}
          {showSkeleton ? (
            <span className="actor-toprated-card__imdb actor-toprated-card__imdb--skeleton">
              <SkeletonLoader
                variant="actor-toprated-imdb"
                className="actor-toprated-card__imdb-skeleton"
              />
            </span>
          ) : (
            <span className="actor-toprated-card__imdb">
              IMDb {Number(ratingImdb).toFixed(1)}
            </span>
          )}
        </div>
      </button>
    </li>
  );
};

const ActorTopRatedKinolar = ({ actorId }) => {
  const navigate = useNavigate();
  const { contentLang } = useContentLanguage();
  const { allMovies, moviesLoading } = useMoviesApi();
  const { actorPageSectionLabels } = useActorsApi();

  const list = useMemo(() => {
    const aid = Number(actorId);
    if (Number.isNaN(aid)) return [];
    return [...allMovies]
      .filter((m) => Array.isArray(m.actors) && m.actors.includes(aid))
      .filter((m) => m.ratingImdb != null && Number(m.ratingImdb) > 0)
      .sort((a, b) => Number(b.ratingImdb) - Number(a.ratingImdb));
  }, [actorId, allMovies]);

  const visible = useMemo(() => list.slice(0, TOP_RATED_VISIBLE_COUNT), [list]);
  const hasMore = list.length > TOP_RATED_VISIBLE_COUNT;

  if (moviesLoading) {
    return <ActorTopRatedKinolarSkeleton />;
  }

  if (!list.length) return null;

  return (
    <section className="actor-toprated actor-extra-block actor-extra-block--top-rated">
      <div className="actor-toprated-head">
        <h3 className="actor-extra-block__title">
          {actorPageSectionLabels?.topRatedKinolar?.[contentLang] ||
            actorPageSectionLabels?.topRatedKinolar?.uz ||
            ''}
        </h3>
        {hasMore && (
          <ShowMoreButton to="/recommended" className="actor-toprated-show-more" />
        )}
      </div>
      <div className="actor-toprated-scroll">
        <ul className="actor-toprated-list">
          {visible.map((m) => {
            const poster = getPoster(m);
            const name = getMovieTitle(m, contentLang);
            return (
              <ActorTopRatedCard
                key={m.id}
                movie={m}
                name={name}
                poster={poster}
                ratingImdb={m.ratingImdb}
                onOpen={(id) => navigate(`/movie/${id}`)}
              />
            );
          })}
        </ul>
      </div>
    </section>
  );
};

export default ActorTopRatedKinolar;
