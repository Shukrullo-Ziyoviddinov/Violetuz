import React from 'react';
import { useTranslation } from 'react-i18next';
import ScrollTouch from '../ScrollTouch/ScrollTouch';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import { CHANNEL_TYPES } from './channelTypes';
import './ChanelTypeFilter.css';

export default function ChanelTypeFilterSkeleton() {
  const { t } = useTranslation();
  return <div className="chanel-type-bar" aria-hidden="true">
    <ScrollTouch className="chanel-type-filter">
      {CHANNEL_TYPES.map((type) => <span key={type.id} className="chanel-type-filter-chip chanel-type-filter-chip--skeleton">
        <span className="chanel-type-filter-skeleton-label">{t(`channel.filters.${type.id}`, type.fallback)}</span>
        <SkeletonLoader variant="block" />
      </span>)}
    </ScrollTouch>
    <div className="chanel-type-search chanel-type-search--skeleton">
      <SkeletonLoader variant="block" />
    </div>
  </div>;
}
