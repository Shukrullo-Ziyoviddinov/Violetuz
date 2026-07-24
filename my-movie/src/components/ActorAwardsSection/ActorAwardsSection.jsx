import React from 'react';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import { useImageReady } from '../../utils/useImageReady';

const AWARDS_SKELETON_COUNT = 4;

const AwardRowSkeleton = () => (
  <div className="actor-award-row actor-award-row--skeleton" aria-hidden="true">
    <div className="actor-award-row__thumb actor-award-row__thumb--skeleton">
      <SkeletonLoader
        variant="actor-award-thumb"
        className="actor-award-row__thumb-skeleton"
      />
    </div>
    <div className="actor-award-row__body">
      <div className="actor-award-row__top">
        <span className="actor-award-row__title actor-award-row__title--skeleton">
          <SkeletonLoader
            variant="actor-award-title"
            className="actor-award-row__title-skeleton"
          />
        </span>
        <span className="actor-award-row__category actor-award-row__category--skeleton">
          <SkeletonLoader
            variant="actor-award-category"
            className="actor-award-row__category-skeleton"
          />
        </span>
      </div>
      <div className="actor-award-row__work actor-award-row__work--skeleton">
        <SkeletonLoader
          variant="actor-award-work"
          className="actor-award-row__work-skeleton"
        />
      </div>
    </div>
  </div>
);

export const ActorAwardsSectionSkeleton = ({ count = AWARDS_SKELETON_COUNT }) => (
  <section
    className="actor-extra-block actor-extra-block--awards actor-extra-block--skeleton"
    aria-busy="true"
  >
    <div className="actor-extra-block__title actor-extra-block__title--skeleton">
      <SkeletonLoader
        variant="actor-extra-block-title"
        className="actor-extra-block__title-skeleton"
      />
    </div>
    <div className="actor-award-list">
      {Array.from({ length: count }, (_, i) => (
        <AwardRowSkeleton key={`award-sk-${i}`} />
      ))}
    </div>
  </section>
);

const AwardRow = ({ item }) => {
  const imgSrc = item.image || '';
  const { showSkeleton, imgRef, onLoad, onError } = useImageReady(imgSrc);

  return (
    <div
      className={`actor-award-row${showSkeleton ? ' actor-award-row--loading' : ''}`}
      aria-busy={showSkeleton || undefined}
    >
      <div
        className={`actor-award-row__thumb${
          showSkeleton ? ' actor-award-row__thumb--loading' : ''
        }`}
      >
        {showSkeleton && (
          <SkeletonLoader
            variant="actor-award-thumb"
            className="actor-award-row__thumb-skeleton"
          />
        )}
        {imgSrc ? (
          <img
            ref={imgRef}
            src={imgSrc}
            alt=""
            loading="lazy"
            draggable={false}
            className={showSkeleton ? 'actor-award-row__thumb-img--loading' : undefined}
            onLoad={onLoad}
            onError={onError}
          />
        ) : null}
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
};

const isAwardItem = (item) =>
  item != null &&
  typeof item === 'object' &&
  !Array.isArray(item) &&
  (item.title != null || item.work != null || item.category != null);

const ActorAwardsSection = ({ awards, title, isLoading = false }) => {
  if (isLoading) {
    return <ActorAwardsSectionSkeleton />;
  }

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
