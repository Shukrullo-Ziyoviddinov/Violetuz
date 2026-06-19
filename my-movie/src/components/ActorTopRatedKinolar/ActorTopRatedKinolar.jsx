import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { allMovies } from '../../data/movies';
import { actorPageSectionLabels } from '../../data/actors';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import ShowMoreButton from '../ShowMoreButton/ShowMoreButton';
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

const ActorTopRatedKinolar = ({ actorId }) => {
  const navigate = useNavigate();
  const { contentLang } = useContentLanguage();

  const list = useMemo(() => {
    const aid = Number(actorId);
    if (Number.isNaN(aid)) return [];
    return [...allMovies]
      .filter((m) => Array.isArray(m.actors) && m.actors.includes(aid))
      .filter((m) => m.ratingImdb != null && Number(m.ratingImdb) > 0)
      .sort((a, b) => Number(b.ratingImdb) - Number(a.ratingImdb));
  }, [actorId]);

  const visible = useMemo(() => list.slice(0, TOP_RATED_VISIBLE_COUNT), [list]);
  const hasMore = list.length > TOP_RATED_VISIBLE_COUNT;

  if (!list.length) return null;

  return (
    <section className="actor-toprated actor-extra-block actor-extra-block--top-rated">
      <div className="actor-toprated-head">
        <h3 className="actor-extra-block__title">
          {actorPageSectionLabels.topRatedKinolar[contentLang] || actorPageSectionLabels.topRatedKinolar.uz}
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
              <li key={m.id} className="actor-toprated-card">
                <button
                  type="button"
                  className="actor-toprated-card__btn"
                  onClick={() => navigate(`/movie/${m.id}`)}
                  aria-label={name || undefined}
                >
                  <div className="actor-toprated-card__img-wrap">
                    <img src={poster} alt="" className="actor-toprated-card__img" loading="lazy" />
                    <span className="actor-toprated-card__imdb">IMDb {Number(m.ratingImdb).toFixed(1)}</span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};

export default ActorTopRatedKinolar;
