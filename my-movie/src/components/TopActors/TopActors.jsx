import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import HorizontalScroll from '../HorizontalScroll/HorizontalScroll';
import FollowingButton from '../../Music/FollowingButton/FollowingButton';
import { useActorsApi } from '../../context/ActorsApiContext';
import { useTopActors } from '../../hooks/useTopActors';
import './TopActors.css';

/**
 * Global Top-10 actors (same for everyone).
 * Data: /api/recommended-actors/top — not the personal RecommendedActors carousel.
 */
const TopActors = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language === 'ru' ? 'ru' : 'uz';
  const { allActors } = useActorsApi();
  const { items, loading } = useTopActors(10);

  const displayActors = useMemo(() => {
    const byId = new Map((allActors || []).map((a) => [String(a.id), a]));
    const out = [];
    for (const row of items) {
      const actor = byId.get(String(row.actorId));
      if (!actor) continue;
      out.push({
        ...actor,
        rank: row.rank || out.length + 1,
        score: row.score || 0,
      });
    }
    return out;
  }, [allActors, items]);

  if (!loading && displayActors.length === 0) return null;

  const resolveName = (actor) => {
    const n = actor?.name?.[lang] ?? actor?.name?.uz ?? actor?.name?.ru ?? '';
    return String(n).trim() || String(actor?.id ?? '');
  };

  return (
    <div className="top-actors" aria-busy={loading || undefined}>
      <div className="top-actors-container">
        <div className="top-actors-header">
          <h2 className="top-actors-title">
            {t('movies.topAktyorlar', 'Top 10 aktyorlar')}
          </h2>
        </div>
        <div className="top-actors-content">
          <HorizontalScroll scrollAmount={130}>
            {loading
              ? Array.from({ length: 8 }, (_, i) => (
                  <div
                    key={`top-actor-skel-${i}`}
                    className="top-actors-item"
                    aria-hidden="true"
                  >
                    <div className="top-actors-img-wrap" />
                  </div>
                ))
              : displayActors.map((actor) => (
                  <div
                    key={actor.id}
                    className="top-actors-item"
                    onClick={() => navigate(`/actor/${actor.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/actor/${actor.id}`);
                      }
                    }}
                    aria-label={`${actor.rank}. ${resolveName(actor)}`}
                  >
                    <div className="top-actors-img-wrap">
                      <img
                        src={actor.image || '/img/movie1.jpg'}
                        alt={resolveName(actor)}
                        className="top-actors-img"
                      />
                      <span className="top-actors-rank">{actor.rank}</span>
                    </div>
                    <p className="top-actors-name">{resolveName(actor)}</p>
                    <FollowingButton
                      artistId={actor.id}
                      entityType="actor"
                      wrapperClassName="top-actors-follow"
                      stopPropagation
                    />
                  </div>
                ))}
          </HorizontalScroll>
        </div>
      </div>
    </div>
  );
};

export default TopActors;
