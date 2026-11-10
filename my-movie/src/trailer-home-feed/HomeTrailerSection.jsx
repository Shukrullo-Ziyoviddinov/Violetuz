import React, { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../store/hooks';
import { selectAuthReady, selectIsLoggedIn, selectProfile } from '../store/slices/userSlice';
import { useTrailerFeed } from './TrailerFeedContext';
import { fetchTrailerSlice } from './trailerFeedGate';
import ShowMoreButton from '../components/ShowMoreButton/ShowMoreButton';
import TrailerHomeCard, { TrailerHomeCardSkeleton } from './TrailerHomeCard';
import HorizontalScroll from '../components/HorizontalScroll/HorizontalScroll';
import { usePagedList } from '../paged-list/usePagedList';
import { useVisibleCount } from '../paged-list/useVisibleCount';
import { useLoadMoreTrigger } from '../paged-list/useLoadMoreTrigger';
import './HomeTrailerSection.css';

const BLOCK_TITLES = [
  'Siz uchun treylerlar',
  'Tomosha qilishga arziydi',
  'Yana nimalarni ko‘ramiz?',
  'Yangi taassurotlar',
];
const BLOCK_MAX = 10;

function LeadTrailerBlock({ title }) {
  const containerRef = useRef(null);
  const itemRef = useRef(null);
  const visibleCount = useVisibleCount(containerRef, itemRef);
  const visibleRef = useRef(0);
  visibleRef.current = visibleCount;
  const authReady = useAppSelector(selectAuthReady);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const accountId = useAppSelector(selectProfile)?.id;
  const viewer = authReady ? (isLoggedIn ? `account:${accountId}` : 'guest') : null;
  const getLimit = useCallback(() => visibleRef.current, []);
  const {
    items, hasMore, isLoading, isFetchingNextPage, fetchNextPage,
  } = usePagedList({
    queryKey: ['trailer-home-block', 0, viewer],
    enabled: Boolean(viewer) && visibleCount > 0,
    maxItems: BLOCK_MAX,
    getLimit,
    fetchPage: async ({ offset, limit, signal }) => {
      const room = Math.min(limit, BLOCK_MAX - offset);
      if (!(room > 0)) return { items: [], hasMore: false };
      const page = await fetchTrailerSlice({ isLoggedIn, signal, offset, limit: room, viewer });
      const cards = Array.isArray(page?.items) ? page.items.slice(0, room) : [];
      return {
        items: cards,
        hasMore: cards.length === room && offset + cards.length < BLOCK_MAX && page?.hasMore !== false,
      };
    },
  });
  const room = Math.max(0, BLOCK_MAX - items.length);
  const nextChunk = Math.min(visibleCount, room);
  const loadMore = useCallback(() => {
    const limit = Math.min(visibleRef.current, BLOCK_MAX - items.length);
    if (limit > 0) fetchNextPage(limit);
  }, [fetchNextPage, items.length]);
  const { notifyNearEnd } = useLoadMoreTrigger({
    enabled: hasMore && !isFetchingNextPage && !isLoading && nextChunk > 0,
    onLoadMore: loadMore,
  });
  const measuring = visibleCount === 0;
  const waiting = items.length === 0 && (measuring || isLoading);
  if (!waiting && items.length === 0) return null;
  const skeletonCount = measuring ? 1 : visibleCount;
  const peek = !waiting && !isFetchingNextPage && hasMore && room > 0 ? 1 : 0;
  const tailCount = isFetchingNextPage ? nextChunk : peek;
  return <section className="home-trailer-section" aria-label={title} data-trailer-block={1} aria-busy={waiting || isFetchingNextPage || undefined}>
    <div className="home-trailer-section-container" ref={containerRef}>
      <div className="home-trailer-section-header">
        <h2>{title}</h2>
        {items.length > 0 && <ShowMoreButton to="/recommended/trailers" />}
      </div>
      <div className="home-trailer-section-row">
        <HorizontalScroll onNearEnd={notifyNearEnd}>
          {waiting
            ? Array.from({ length: skeletonCount }, (_, index) => (
              <div key={`lead-skeleton-${index}`} ref={index === 0 ? itemRef : undefined}>
                <TrailerHomeCardSkeleton />
              </div>
            ))
            : items.map((item, index) => (
              <div key={item.key} ref={index === 0 ? itemRef : undefined}>
                <TrailerHomeCard item={item} />
              </div>
            ))}
          {Array.from({ length: tailCount }, (_, index) => <TrailerHomeCardSkeleton key={`lead-tail-${index}`} />)}
        </HorizontalScroll>
      </div>
    </div>
  </section>;
}

function TailTrailerBlock({ blockIndex, title }) {
  const { items, ready, rangeStart = 0 } = useTrailerFeed();
  const start = blockIndex * BLOCK_MAX - rangeStart;
  const cards = start >= 0 ? items.slice(start, start + BLOCK_MAX) : [];
  if (ready && !cards.length) return null;
  return <section className="home-trailer-section" aria-label={title} data-trailer-block={blockIndex + 1}>
    <div className="home-trailer-section-container">
      <div className="home-trailer-section-header">
        <h2>{title}</h2>
        {ready && <ShowMoreButton to="/recommended/trailers" />}
      </div>
      <div className="home-trailer-section-row" aria-busy={!ready}>
        <HorizontalScroll>
          {ready ? cards.map((item) => <TrailerHomeCard key={item.key} item={item} />)
            : Array.from({ length: BLOCK_MAX }, (_, index) => <TrailerHomeCardSkeleton key={index} />)}
        </HorizontalScroll>
      </div>
    </div>
  </section>;
}

export default function HomeTrailerSection({ blockIndex = 0 }) {
  const { t } = useTranslation();
  const title = t(`trailerHomeBlocks.block${blockIndex + 1}`, { defaultValue: BLOCK_TITLES[blockIndex] || BLOCK_TITLES[0] });
  if (blockIndex === 0) return <LeadTrailerBlock title={title} />;
  return <TailTrailerBlock blockIndex={blockIndex} title={title} />;
}
