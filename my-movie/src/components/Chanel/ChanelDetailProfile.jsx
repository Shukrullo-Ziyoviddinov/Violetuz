import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { fetchChannelById } from '../../api/channelsApi';
import { useIsFollowing } from '../../context/FollowingContext';
import FollowingButton from '../../Music/FollowingButton/FollowingButton';
import { formatCount } from '../../utils/utils';
import './ChanelDetailProfile.css';

const ChanelDetailProfile = ({ channelId }) => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const id = String(channelId || '').trim();
  const isSubscribed = useIsFollowing(id, 'channel');
  const { data: channel } = useQuery({
    queryKey: ['channel', id],
    queryFn: () => fetchChannelById(id),
    enabled: Boolean(id),
  });

  if (!id || !channel) return null;

  const subscribers = (channel.subscribers ?? 0) + (isSubscribed ? 1 : 0);
  const subscriberLabel = String(i18n.language || '').startsWith('ru') ? 'подписчиков' : 'obunachi';

  const openProfile = () => {
    navigate(`/channel/${encodeURIComponent(channel.id)}`);
  };

  return (
    <div
      className="chanel-detail-profile"
      role="link"
      tabIndex={0}
      onClick={openProfile}
      onKeyDown={(event) => {
        if (event.key === 'Enter') openProfile();
      }}
    >
      <div className="chanel-detail-profile-link">
        <div className="chanel-detail-profile-avatar">
          {channel.avatar ? (
            <img src={channel.avatar} alt="" />
          ) : (
            <span aria-hidden="true">{String(channel.name || '?').slice(0, 1)}</span>
          )}
        </div>
        <div className="chanel-detail-profile-text">
          <p className="chanel-detail-profile-name">{channel.name}</p>
          <p className="chanel-detail-profile-subs">
            {formatCount(subscribers)} {subscriberLabel}
          </p>
        </div>
      </div>
      <FollowingButton artistId={channel.id} entityType="channel" stopPropagation />
    </div>
  );
};

export default ChanelDetailProfile;
