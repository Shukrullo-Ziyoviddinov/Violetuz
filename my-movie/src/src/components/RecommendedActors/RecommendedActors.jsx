import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import HorizontalScroll from '../HorizontalScroll/HorizontalScroll';
import { actors } from '../../data/actors';
import FollowingButton from '../../Music/FollowingButton/FollowingButton';
import './RecommendedActors.css';

const uniqueActorsById = (list) => {
  const seen = new Set();
  return list.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });
};

const RecommendedActors = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language === 'ru' ? 'ru' : 'uz';

  const displayActors = useMemo(() => uniqueActorsById(actors), []);

  const actorDisplayName = (actor) => {
    const n = actor?.name?.[lang] ?? actor?.name?.uz ?? actor?.name?.ru ?? '';
    return String(n).trim() || actor?.name?.uz || actor?.name?.ru || '';
  };

  const handleActorClick = (actorId) => {
    navigate(`/actor/${actorId}`);
  };

  return (
    <div className="recommended-actors">
      <div className="recommended-actors-container">
        <div className="recommended-actors-header">
          <h2 className="recommended-actors-title">
            {t('movies.tavsiyaEtilganAktyorlar', 'Tavsiya etilgan aktiyorlar')}
          </h2>
        </div>
        <div className="recommended-actors-content">
          <HorizontalScroll scrollAmount={140}>
            {displayActors.map((actor) => (
              <div
                key={actor.id}
                className="recommended-actors-item"
                onClick={() => handleActorClick(actor.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleActorClick(actor.id);
                  }
                }}
                aria-label={`${actorDisplayName(actor)} — ${t('navbar.movies', 'Filmlar')}`}
              >
                <div className="recommended-actors-img-wrap">
                  <img
                    src={actor.image || '/img/movie1.jpg'}
                    alt={actorDisplayName(actor)}
                    className="recommended-actors-img"
                  />
                </div>
                <p className="recommended-actors-name">{actorDisplayName(actor)}</p>
                <div
                  className="recommended-actors-follow"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  role="presentation"
                >
                  <FollowingButton
                    artistId={actor.id}
                    subscriberCount={actor.subscribers ?? 0}
                  />
                </div>
              </div>
            ))}
          </HorizontalScroll>
        </div>
      </div>
    </div>
  );
};

export default RecommendedActors;
