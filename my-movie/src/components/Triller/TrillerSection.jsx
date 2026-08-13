import React from 'react';
import { useQuery } from '@tanstack/react-query';
import HorizontalScroll from '../HorizontalScroll/HorizontalScroll';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import TrillerCard from './TrillerCard';
import { fetchAllTrillers } from '../../api/trillersApi';
import './TrillerSection.css';

const SKELETON_COUNT = 6;

const TrillerSection = () => {
  const { data: list = [], isPending } = useQuery({
    queryKey: ['trillers', 'with-description'],
    queryFn: fetchAllTrillers,
  });

  if (!isPending && !list.length) return null;

  const showSkeleton = isPending || list.length === 0;
  const items = showSkeleton
    ? Array.from({ length: SKELETON_COUNT }, (_, i) => ({ id: `sk-${i}`, _skeleton: true }))
    : list;

  return (
    <section className="triller-section" aria-busy={showSkeleton || undefined}>
      <div className="triller-section-container">
        <div className="triller-section-header">
          {showSkeleton ? (
            <SkeletonLoader variant="triller-section-title" />
          ) : (
            <h2 className="triller-section-title">Triller</h2>
          )}
        </div>
        <div className="triller-section-scroll">
          <HorizontalScroll>
            {items.map((item) =>
              item._skeleton ? (
                <div
                  key={item.id}
                  className="triller-card triller-card--skeleton"
                  aria-hidden="true"
                >
                  <div className="triller-card-image-wrap">
                    <SkeletonLoader variant="triller-card-image" />
                  </div>
                  <SkeletonLoader variant="triller-card-title" />
                </div>
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
