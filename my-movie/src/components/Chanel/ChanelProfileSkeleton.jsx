import React from 'react';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import { ChanelProfileBannerSkeleton } from './ChanelProfileBanner';
import ChanelTypeFilterSkeleton from './ChanelTypeFilterSkeleton';
import '../../Music/FollowingButton/FollowingButton.css';
import './ChanelProfileSkeleton.css';

const ActionSkeleton = ({ className, label }) => <button type="button" disabled tabIndex={-1}
  className={`${className} channel-profile-action-skeleton`}>
  <span className="channel-profile-skeleton-label">{label}</span>
  <SkeletonLoader variant="block" />
</button>;

const ActionsSkeleton = ({ mobile = false }) => (
  <div className={`channel-profile-subscribe${mobile ? ' channel-profile-actions-mobile' : ''}`}>
    <ActionSkeleton className="following-btn" label="+ Obuna" />
    <ActionSkeleton className="channel-profile-message" label="Xabar" />
    {mobile && <ActionSkeleton className="channel-profile-filter" label="" />}
  </div>
);

export default function ChanelProfileSkeleton() {
  return <article className="channel-profile channel-profile--loading" aria-busy="true" aria-hidden="true">
    <ChanelProfileBannerSkeleton />
    <div className="channel-profile-main">
      <div className="channel-page-avatar">
        <SkeletonLoader variant="block" className="channel-profile-avatar-skeleton" />
      </div>
      <div className="channel-page-info">
        <div className="channel-profile-heading">
          <div className="channel-page-name"><SkeletonLoader variant="block" /></div>
          <div className="channel-profile-handle">
            <div className="channel-profile-username"><SkeletonLoader variant="block" /></div>
            <div className="channel-profile-subscribers"><SkeletonLoader variant="block" /></div>
          </div>
        </div>
        <div className="channel-profile-bio"><SkeletonLoader variant="block" /></div>
        <ActionsSkeleton />
      </div>
    </div>
    <ChanelTypeFilterSkeleton />
    <ActionsSkeleton mobile />
  </article>;
}
