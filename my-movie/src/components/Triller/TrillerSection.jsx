import React, { useCallback, useRef, useState } from 'react';
import HorizontalScroll from '../HorizontalScroll/HorizontalScroll';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import TrillerCard, { TrillerCardSkeleton } from './TrillerCard';
import ShowMoreButton, { DEFAULT_LIMIT } from '../ShowMoreButton/ShowMoreButton';
import { useTrillerList } from '../../hooks/useTrillerList';
import { useVisibleCount } from '../../paged-list/useVisibleCount';
import { useLoadMoreTrigger } from '../../paged-list/useLoadMoreTrigger';
import './TrillerSection.css';

const TrillerSection = () => {
  const { data: list = [], isPending } = useTrillerList();
  const containerRef = useRef(null);
  const itemRef = useRef(null);
  const visibleCount = useVisibleCount(containerRef, itemRef);
  const visibleRef = useRef(0);
  visibleRef.current = visibleCount;
  const [revealed, setRevealed] = useState(0);
  const ranked = list.slice(0, DEFAULT_LIMIT);
  const shown = isPending || visibleCount === 0
    ? 0
    : Math.min(ranked.length, Math.max(revealed, visibleCount));
  const room = Math.max(0, ranked.length - shown);
  const revealMore = useCallback(() => {
    const step = visibleRef.current;
    if (step <= 0) return;
    setRevealed((current) => Math.min(DEFAULT_LIMIT, Math.max(current, step) + step));
  }, []);
  const { notifyNearEnd } = useLoadMoreTrigger({
    enabled: !isPending && room > 0 && visibleCount > 0,
    onLoadMore: revealMore,
  });

  if (!isPending && !list.length) return null;

  const showSkeleton = isPending || list.length === 0 || visibleCount === 0;
  const skeletonCount = visibleCount === 0 ? 1 : visibleCount;
  const peek = !showSkeleton && room > 0 ? 1 : 0;

  return (
    <section className="triller-section" aria-busy={showSkeleton || undefined}>
      <div className="triller-section-container" ref={containerRef}>
        <div className="triller-section-header">
          {isPending || list.length === 0 ? (
            <SkeletonLoader variant="triller-section-title" />
          ) : (
            <h2 className="triller-section-title">Parda ortida</h2>
          )}
          {!isPending && list.length > DEFAULT_LIMIT && <ShowMoreButton to="/recommended/parda-ortida" />}
        </div>
        <div className="triller-section-scroll">
          <HorizontalScroll onNearEnd={notifyNearEnd}>
            {showSkeleton
              ? Array.from({ length: skeletonCount }, (_, index) => (
                <div key={`sk-${index}`} ref={index === 0 ? itemRef : undefined}>
                  <TrillerCardSkeleton />
                </div>
              ))
              : ranked.slice(0, shown).map((item, index) => (
                <div key={item.id} ref={index === 0 ? itemRef : undefined}>
                  <TrillerCard triller={item} />
                </div>
              ))}
            {Array.from({ length: peek }, (_, index) => (
              <TrillerCardSkeleton key={`peek-${index}`} />
            ))}
          </HorizontalScroll>
        </div>
      </div>
    </section>
  );
};

export default TrillerSection;
