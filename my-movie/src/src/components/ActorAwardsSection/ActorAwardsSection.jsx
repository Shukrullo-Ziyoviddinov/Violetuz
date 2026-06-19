import React from 'react';

const AwardRow = ({ item }) => (
  <div className="actor-award-row">
    <div className="actor-award-row__thumb">
      <img src={item.image} alt="" loading="lazy" draggable={false} />
    </div>
    <div className="actor-award-row__body">
      <div className="actor-award-row__top">
        <span className="actor-award-row__title">{item.title}</span>
        <span className="actor-award-row__sep" aria-hidden>
          ·
        </span>
        <span className="actor-award-row__category">{item.category}</span>
        <span className="actor-award-row__sep" aria-hidden>
          ·
        </span>
        <span className="actor-award-row__year">{item.year}</span>
      </div>
      <div className="actor-award-row__work">{item.work}</div>
    </div>
  </div>
);

const isAwardItem = (item) =>
  item != null &&
  typeof item === 'object' &&
  !Array.isArray(item) &&
  (item.title != null || item.work != null || item.category != null);

const ActorAwardsSection = ({ awards, title }) => {
  const list = Array.isArray(awards) ? awards.filter(isAwardItem) : [];
  if (!list.length) return null;

  return (
    <section className="actor-extra-block actor-extra-block--awards">
      <h3 className="actor-extra-block__title">{title}</h3>
      <div className="actor-award-list">
        {list.map((item, idx) => (
          <AwardRow key={item.id != null ? String(item.id) : `award-${idx}`} item={item} />
        ))}
      </div>
    </section>
  );
};

export default ActorAwardsSection;
