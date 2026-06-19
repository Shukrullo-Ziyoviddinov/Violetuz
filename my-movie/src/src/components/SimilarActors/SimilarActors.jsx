import React, { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { actors, actorPageSectionLabels } from '../../data/actors';
import { allMovies } from '../../data/movies';
import FollowingButton from '../../Music/FollowingButton/FollowingButton';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import ShowMoreButton from '../ShowMoreButton/ShowMoreButton';
import GlobalModal from '../GlobalModal/GlobalModal';
import '../ShowMoreButton/ShowMoreButton.css';
import './SimilarActors.css';

/** Sahifada faqat shuncha kartochka; "Ko'proq" modalda barcha o'xshash aktyorlar */
const SIMILAR_VISIBLE = 4;

const SimilarActors = ({ currentActorId, actorsGenre }) => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { contentLang } = useContentLanguage();
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
  }, []);

  const list = useMemo(() => {
    if (actorsGenre == null || actorsGenre === '') return [];
    const g = String(actorsGenre).toLowerCase();
    return actors
      .filter((a) => a.id !== currentActorId && String(a.actorsGenre || '').toLowerCase() === g)
      .slice(0, 12);
  }, [currentActorId, actorsGenre]);

  const visible = useMemo(() => list.slice(0, SIMILAR_VISIBLE), [list]);
  const hasMore = list.length > SIMILAR_VISIBLE;

  const sectionTitle =
    actorPageSectionLabels.similarActors[contentLang] || actorPageSectionLabels.similarActors.uz;

  const renderActorRow = useCallback(
    (a) => {
      const name = a.name?.[contentLang] || a.name?.uz || a.name?.ru || '';
      const n = videoCountByActorId.get(a.id) ?? 0;
      return (
        <li key={a.id} className="actor-similar-card">
          <div className="actor-similar-card__btn">
            <button
              type="button"
              className="actor-similar-card__main"
              onClick={() => {
                setModalOpen(false);
                navigate(`/actor/${a.id}`);
              }}
            >
              <div className="actor-similar-card__img-wrap">
                <img src={a.image} alt="" className="actor-similar-card__img" loading="lazy" />
              </div>
              <div className="actor-similar-card__text">
                <span className="actor-similar-card__name">{name}</span>
                <span className="actors-page-movies-title">
                  {n} {i18n.language === 'uz' ? 'ta video' : 'видео'}
                </span>
              </div>
            </button>
            <div className="actor-similar-card__follow-wrap">
              <FollowingButton artistId={a.id} subscriberCount={a.subscribers ?? 0} />
            </div>
          </div>
        </li>
      );
    },
    [contentLang, i18n.language, navigate, videoCountByActorId]
  );

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
