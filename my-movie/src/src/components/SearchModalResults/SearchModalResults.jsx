import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import ScrollTouch from '../ScrollTouch/ScrollTouch';
import { searchContentByQuery } from '../../utils/searchMovies';
import './SearchModalResults.css';

const SearchModalResults = ({ query, onMovieClick }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { contentLang } = useContentLanguage();

  const { actors: actorResults, movies: movieResults } = searchContentByQuery(query, contentLang, 20);

  const getTitle = (m) => {
    if (m?.title && typeof m.title === 'object') {
      return m.title[contentLang] || m.title.uz || m.title.ru;
    }
    return m?.title || '';
  };

  const getImg = (m) => {
    if (m?.homeImg && typeof m.homeImg === 'object') {
      return m.homeImg[contentLang] || m.homeImg.uz || m.homeImg.ru;
    }
    return m?.homeImg || '';
  };

  const handleMovieClick = (movie) => {
    if (onMovieClick) onMovieClick();
    navigate(`/movie/${movie.id}`);
  };

  const handleActorClick = (actor) => {
    if (onMovieClick) onMovieClick();
    navigate(`/actor/${actor.id}`);
  };

  const getActorName = (actor) => {
    for (const lang of [contentLang, 'uz', 'ru']) {
      const v = actor?.name?.[lang];
      if (typeof v === 'string' && v.trim()) return v.trim();
    }
    return '';
  };

  if (!query?.trim()) return null;

  const hasAny = actorResults.length > 0 || movieResults.length > 0;

  return (
    <div className="search-modal-results">
      {actorResults.length > 0 && (
        <div className="search-modal-results-actors-block">
          <h3 className="search-modal-results-section-title">
            {t('searchModal.actorsSection', 'Aktyor')}
          </h3>
          <ScrollTouch className="search-modal-results-actors-scroll">
            <div className="search-modal-results-actors-row">
              {actorResults.map((actor) => (
                <div
                  key={`actor-${actor.id}`}
                  className="search-modal-results-actor-card"
                  onClick={() => handleActorClick(actor)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleActorClick(actor)}
                >
                  <div className="search-modal-results-actor-avatar-wrap">
                    <img
                      src={actor.image}
                      alt={getActorName(actor)}
                      className="search-modal-results-actor-avatar"
                    />
                  </div>
                  {getActorName(actor) && (
                    <p className="search-modal-results-actor-name">{getActorName(actor)}</p>
                  )}
                </div>
              ))}
            </div>
          </ScrollTouch>
        </div>
      )}

      {movieResults.length > 0 && (
        <div
          className={`search-modal-results-movies-block${actorResults.length > 0 ? ' search-modal-results-movies-block--after-actors' : ''}`}
        >
          <div className="search-modal-results-grid">
            {movieResults.map((movie) => (
              <div
                key={`movie-${movie.id}`}
                className="search-modal-results-item"
                onClick={() => handleMovieClick(movie)}
              >
                <div className="search-modal-results-item-image-wrapper">
                  <img
                    src={getImg(movie)}
                    alt={getTitle(movie)}
                    className="search-modal-results-item-image"
                  />
                  {movie.category === 'anonslar' && (
                    <span className="search-modal-results-badge search-modal-results-badge-soon">
                      {t('searchModal.tezOrada', 'Tez orada')}
                    </span>
                  )}
                  {movie.ageRestriction != null && (
                    <span className="search-modal-results-badge search-modal-results-badge-age">
                      {movie.ageRestriction}+
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasAny && (
        <p className="search-modal-results-empty">{t('searchModal.noResults', 'Natija topilmadi')}</p>
      )}
    </div>
  );
};

export default SearchModalResults;
