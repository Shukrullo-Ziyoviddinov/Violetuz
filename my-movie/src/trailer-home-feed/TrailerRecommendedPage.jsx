import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTrailerFeed } from './TrailerFeedContext';
import TrailerHomeCard, { TrailerHomeCardSkeleton } from './TrailerHomeCard';
import '../pages/RecommendedPage.css';
import './TrailerRecommendedPage.css';

export default function TrailerRecommendedPage() {
  const { t } = useTranslation();
  const { items, ready, loading, error, nextCursor, loadMore, refresh } = useTrailerFeed();
  return <div className="recommended-page trailer-recommended-page">
    <h1>{t('homeTrailers', { defaultValue: 'Treylerlar' })}</h1>
    <div className="trailer-recommended-grid" aria-busy={loading}>
      {items.map((item) => <TrailerHomeCard key={item.key} item={item} />)}
      {loading && !error && Array.from({ length: 10 }, (_, index) => <TrailerHomeCardSkeleton key={`loading-${index}`} />)}
    </div>
    {ready && !items.length && !error && <p>{t('trailerFeed.empty', { defaultValue: 'Hozircha tavsiyalar yo‘q.' })}</p>}
    {error && <p role="alert">{t('trailerFeed.error', { defaultValue: 'Tavsiyalarni yuklab bo‘lmadi.' })}</p>}
    {error?.status === 410 || (error && !items.length)
      ? <button type="button" onClick={refresh}>{t('trailerFeed.refresh', { defaultValue: 'Yangilash' })}</button>
      : nextCursor && <button type="button" onClick={loadMore} disabled={loading}>
        {loading ? t('trailerFeed.loading', { defaultValue: 'Yuklanmoqda…' }) : t('movies.more', { defaultValue: 'Ko‘proq' })}
      </button>}
  </div>;
}
