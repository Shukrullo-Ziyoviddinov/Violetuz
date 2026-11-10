import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTrailerFeed } from './TrailerFeedContext';
import { useLoadMoreTrigger } from '../paged-list/useLoadMoreTrigger';
import TrailerHomeCard, { TrailerHomeCardSkeleton } from './TrailerHomeCard';
import '../pages/RecommendedPage.css';
import './TrailerRecommendedPage.css';

export default function TrailerRecommendedPage() {
  const { t } = useTranslation();
  const { items, ready, loading, error, nextCursor, loadMore, refresh } = useTrailerFeed();
  const canLoadMore = Boolean(nextCursor) && !loading && !error;
  const { sentinelRef } = useLoadMoreTrigger({ enabled: canLoadMore, onLoadMore: loadMore });
  return <div className="recommended-page trailer-recommended-page">
    <h1>{t('homeTrailers', { defaultValue: 'Treylerlar' })}</h1>
    <div className="trailer-recommended-grid" aria-busy={loading}>
      {items.map((item) => <TrailerHomeCard key={item.key} item={item} />)}
      {loading && !error && Array.from({ length: 10 }, (_, index) => <TrailerHomeCardSkeleton key={`loading-${index}`} />)}
    </div>
    {canLoadMore && <div className="trailer-recommended-sentinel" ref={sentinelRef} aria-hidden="true" />}
    {ready && !items.length && !error && <p>{t('trailerFeed.empty', { defaultValue: 'Hozircha tavsiyalar yo‘q.' })}</p>}
    {error && <p role="alert">{t('trailerFeed.error', { defaultValue: 'Tavsiyalarni yuklab bo‘lmadi.' })}</p>}
    {(error?.status === 410 || (error && !items.length)) && (
      <button type="button" onClick={refresh}>{t('trailerFeed.refresh', { defaultValue: 'Yangilash' })}</button>
    )}
  </div>;
}
