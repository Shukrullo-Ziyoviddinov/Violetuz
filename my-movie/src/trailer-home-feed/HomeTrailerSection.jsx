import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTrailerFeed } from './TrailerFeedContext';
import ShowMoreButton from '../components/ShowMoreButton/ShowMoreButton';
import TrailerHomeCard, { TrailerHomeCardSkeleton } from './TrailerHomeCard';
import HorizontalScroll from '../components/HorizontalScroll/HorizontalScroll';
import { useVisibleCount } from '../paged-list/useVisibleCount';
import { useLoadMoreTrigger } from '../paged-list/useLoadMoreTrigger';
import './HomeTrailerSection.css';

const BLOCK_TITLES = [
  'Siz uchun treylerlar',
  'Tomosha qilishga arziydi',
  'Yana nimalarni ko‘ramiz?',
  'Yangi taassurotlar',
];

const LEAD_MAX = 10;

export default function HomeTrailerSection({ blockIndex = 0 }) {
  const { t } = useTranslation();
  const { items, ready } = useTrailerFeed();
  const cards = items.slice(blockIndex * LEAD_MAX, (blockIndex + 1) * LEAD_MAX);
  const containerRef = useRef(null);
  const itemRef = useRef(null);
  const visibleCount = useVisibleCount(containerRef, itemRef);
  const visibleRef = useRef(0);
  visibleRef.current = visibleCount;
  const [revealed, setRevealed] = useState(0);
  const title = t(`trailerHomeBlocks.block${blockIndex + 1}`, { defaultValue: BLOCK_TITLES[blockIndex] || BLOCK_TITLES[0] });
  const blockLimit = Math.min(LEAD_MAX, cards.length);
  const shown = !ready
    ? 0
    : visibleCount === 0
      ? 0
      : Math.min(blockLimit, Math.max(revealed, visibleCount));
  const room = ready ? Math.max(0, blockLimit - shown) : 0;
  const revealMore = useCallback(() => {
    const step = visibleRef.current;
    if (step <= 0) return;
    setRevealed((current) => Math.min(LEAD_MAX, Math.max(current, step) + step));
  }, []);
  const { notifyNearEnd } = useLoadMoreTrigger({
    enabled: ready && room > 0 && visibleCount > 0,
    onLoadMore: revealMore,
  });
  if (ready && !cards.length) return null;

  const measuring = visibleCount === 0;
  const pendingSkeletons = !ready ? (measuring ? 1 : visibleCount) : 0;
  const peek = room > 0 && shown > 0 ? 1 : 0;
  const visibleCards = cards.slice(0, shown);

  return <section className="home-trailer-section" aria-label={title} data-trailer-block={blockIndex + 1}>
    <div className="home-trailer-section-container" ref={containerRef}>
    <div className="home-trailer-section-header">
      <h2>{title}</h2>
      {ready && <ShowMoreButton to="/recommended/trailers" />}
    </div>
    <div className="home-trailer-section-row" aria-busy={!ready || undefined}>
      <HorizontalScroll onNearEnd={notifyNearEnd}>
      {visibleCards.map((item, index) => (
        <div key={item.key} ref={index === 0 ? itemRef : undefined}>
          <TrailerHomeCard item={item} />
        </div>
      ))}
      {Array.from({ length: pendingSkeletons }, (_, index) => (
        <div key={`trailer-skeleton-${index}`} ref={index === 0 ? itemRef : undefined}>
          <TrailerHomeCardSkeleton />
        </div>
      ))}
      {Array.from({ length: peek }, (_, index) => (
        <TrailerHomeCardSkeleton key={`trailer-peek-${index}`} />
      ))}
      </HorizontalScroll>
    </div>
    </div>
  </section>;
}
