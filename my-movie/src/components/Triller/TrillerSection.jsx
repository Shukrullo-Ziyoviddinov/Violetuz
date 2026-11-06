import React from 'react';
import HorizontalScroll from '../HorizontalScroll/HorizontalScroll';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import TrillerCard, { TrillerCardSkeleton } from './TrillerCard';
import ShowMoreButton, { DEFAULT_LIMIT } from '../ShowMoreButton/ShowMoreButton';
import { useTrillerList } from '../../hooks/useTrillerList';
import './TrillerSection.css';

const SKELETON_COUNT = 6;

const TrillerSection = () => {
  const { data: list = [], isPending } = useTrillerList();

  if (!isPending && !list.length) return null;

  const showSkeleton = isPending || list.length === 0;
  const items = showSkeleton
    ? Array.from({ length: SKELETON_COUNT }, (_, i) => ({ id: `sk-${i}`, _skeleton: true }))
    : list.slice(0, DEFAULT_LIMIT);

  return (
    <section className="triller-section" aria-busy={showSkeleton || undefined}>
      <div className="triller-section-container">
        <div className="triller-section-header">
          {showSkeleton ? (
            <SkeletonLoader variant="triller-section-title" />
          ) : (
            <h2 className="triller-section-title">Parda ortida</h2>
          )}
          {!showSkeleton && list.length > DEFAULT_LIMIT && <ShowMoreButton to="/recommended/parda-ortida" />}
        </div>
        <div className="triller-section-scroll">
          <HorizontalScroll>
            {items.map((item) =>
              item._skeleton ? (
                <TrillerCardSkeleton key={item.id} />
              ) : (
                <TrillerCard key={item.id} triller={item} />
              )
            )}
          </HorizontalScroll>
        </div>
      </div>
    </section>
  );
};

export default TrillerSection;
